import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';
import { PRICING_H1 } from '../src/lib/pricing-seo.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');

const projectDir = resolve(import.meta.dirname, '..');
const port = await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.unref();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    if (!address || typeof address === 'string') return reject(new Error('Could not reserve preview port'));
    probe.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const baseUrl = `http://127.0.0.1:${port}/pricing/`;
const vendorUrls = new Set([
  'https://www.googletagmanager.com/gtag/js?id=G-XB492EFNKW',
  'https://www.clarity.ms/tag/urhwe2bbi1',
]);
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: projectDir,
  env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });

try {
  const readyDeadlineMs = 90_000;
  const readyDeadline = Date.now() + readyDeadlineMs;
  let ready = false;
  while (Date.now() < readyDeadline) {
    if (server.exitCode !== null) throw new Error(`Astro preview exited before readiness (exit ${server.exitCode}): ${serverLog.trim().slice(-500) || '[no output]'}`);
    try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) {
    const tail = serverLog.trim().slice(-500);
    throw new Error(`Astro preview did not become ready within ${readyDeadlineMs / 1000} seconds${tail ? `: ${tail}` : ' (it produced no output, so this is a startup timeout rather than a crash)'}`);
  }

  const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const failures = [];
  let assertions = 0;
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  const sectionOrder = ['hero', 'live-stats', 'tiers', 'inclusions', 'sla', 'add-ons', 'comparison', 'objections', 'free-review', 'final-cta'];
  const routeRequest = async (route, externalRequests) => {
    const url = route.request().url();
    if (/^\/api\/website-(metrics|feedback)$/.test(new URL(url).pathname)) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (vendorUrls.has(url)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__pricingVendorStub=true;' });
    const parsed = new URL(url);
    if (parsed.hostname === '127.0.0.1') return route.continue();
    if (isBlockmarkBadge(parsed)) return route.fulfill(BLOCKMARK_STUB);
    if (parsed.hostname === 'res.cloudinary.com') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60"/>' });
    externalRequests.push(url);
    return route.abort();
  };
  const contrastRatio = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const parse = value => (value.match(/[\d.]+/g) ?? []).map(Number);
    const blend = (foreground, background) => {
      const alpha = foreground.length >= 4 ? foreground[3] : 1;
      return foreground.slice(0, 3).map((channel, index) => channel * alpha + background[index] * (1 - alpha));
    };
    const luminance = rgb => {
      const [r, g, b] = rgb.map(channel => { const n = channel / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; });
      return .2126 * r + .7152 * g + .0722 * b;
    };
    return Math.min(...elements.map(element => {
      const layers = [];
      for (let node = element; node; node = node.parentElement) layers.push(parse(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255];
      for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = blend(parse(getComputedStyle(element).color), background);
      const a = luminance(foreground); const b = luminance(background);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    }));
  });

  await mkdir(resolve(projectDir, 'evidence'), { recursive: true });
  for (const viewport of [{ name: 'pricing-phone', width: 390, height: 844 }, { name: 'pricing-desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    const externalRequests = [];
    const vendorRequests = [];
    const liveMetricsRequests = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (vendorUrls.has(request.url())) vendorRequests.push(request.url());
      if (new URL(request.url()).pathname.includes('/live-metrics.')) liveMetricsRequests.push(request.url());
    });
    await page.route('**/*', route => routeRequest(route, externalRequests));
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    check(await page.locator('h1').textContent() === PRICING_H1, `${viewport.name}: H1 missing`);
    check(await page.locator('.skip-link').getAttribute('href') === '#main-content' && await page.locator('main#main-content').count() === 1, `${viewport.name}: skip link does not target the pricing main landmark`);
    check(await page.locator('.projects-note [aria-hidden]').count() === 0 && !(await page.locator('.projects-note').textContent()).includes('📋'), `${viewport.name}: projects note retains a decorative icon`);
    check(JSON.stringify(await page.locator('[data-section]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-section')))) === JSON.stringify(sectionOrder), `${viewport.name}: section order differs`);
    check(await page.locator('[data-tier-card]').count() === 3, `${viewport.name}: tier count differs`);
    check(await page.locator('.inclusion-list > li').count() === 7, `${viewport.name}: universal inclusion count differs`);
    check(await page.locator('.sla-table tbody tr').count() === 4, `${viewport.name}: SLA row count differs`);
    check(await page.locator('.objection-card').count() === 3, `${viewport.name}: objection count differs`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: horizontal overflow`);
    check(await page.locator('.static-fallback').isHidden(), `${viewport.name}: enhanced fallback remains visible`);
    check(vendorRequests.length === 0, `${viewport.name}: analytics requested before consent: ${vendorRequests.join(', ')}`);
    check(externalRequests.length === 0, `${viewport.name}: unexpected external requests: ${externalRequests.join(', ')}`);

    const range = page.locator('#people');
    await range.focus();
    await page.keyboard.press('ArrowRight');
    check(await page.locator('[data-users]').textContent() === '11', `${viewport.name}: range keyboard input did not update users`);
    const premium = page.locator('input[name="tier"][value="Premium"]');
    await premium.focus();
    await page.keyboard.press('Space');
    check(await premium.isChecked(), `${viewport.name}: Premium radio did not select from keyboard`);
    check(await page.locator('[data-monthly]').textContent() === '990', `${viewport.name}: Premium total differs`);
    await range.evaluate(element => { element.value = '3'; element.dispatchEvent(new Event('input', { bubbles: true })); });
    const standard = page.locator('input[name="tier"][value="Standard"]');
    await standard.check();
    check(await page.locator('[data-monthly]').textContent() === '200', `${viewport.name}: Standard minimum differs`);
    check(await page.locator('[data-minimum-message]').isVisible(), `${viewport.name}: minimum explanation missing`);

    check(await page.locator('[data-proof-metrics]').isHidden(), `${viewport.name}: unavailable proof hidden`);
    for (const selector of ['.tier-minimum', '.tier-note', '.addon-small', '.comparison-label', '.comparison-unit', '.review-small', '.final-small', '.fine-print', '.last-reviewed', '.primary-button', '.quote-link', '.review-cta', '.final-cta']) {
      check(await contrastRatio(page, selector) >= 4.5, `${viewport.name}: ${selector} contrast is below 4.5:1`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await page.waitForTimeout(50);
    await page.screenshot({ path: resolve(projectDir, 'evidence', `${viewport.name}.png`), fullPage: true });
    await context.close();
  }

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.route('**/*', route => routeRequest(route, []));
  await noJsPage.goto(baseUrl);
  check(await noJsPage.locator('.static-fallback').isVisible(), 'no-JS: calculator fallback hidden');
  check(await noJsPage.locator('.interactive-only').isHidden(), 'no-JS: dead calculator controls visible');
  check(await noJsPage.locator('[data-section]').count() === sectionOrder.length, 'no-JS: complete pricing sections missing');
  check(await noJsPage.locator('[data-proof-metrics]').isHidden(), 'no-JS: no fake proof');
  check(await noJsPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'no-JS: horizontal overflow');
  await noJsContext.close();

  const importFailureContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const importFailurePage = await importFailureContext.newPage();
  await importFailurePage.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' && url.pathname.includes('WebsiteProof')) return route.abort();
    return routeRequest(route, []);
  });
  await importFailurePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  check(await importFailurePage.locator('[data-proof-metrics]').isHidden(), 'failed proof import stays hidden');
  check(await importFailurePage.locator('.proof-next-step a').first().isVisible(), 'failed proof import preserves contact');
  await importFailureContext.close();

  await browser.close();
  if (failures.length) throw new Error(`Pricing browser failures:\n- ${failures.join('\n- ')}`);
  console.log(`${assertions} pricing browser assertions passed across phone, desktop and no-JavaScript contexts`);
} finally {
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise(resolveExit => server.once('exit', resolveExit)), delay(3000)]);
  }
}
