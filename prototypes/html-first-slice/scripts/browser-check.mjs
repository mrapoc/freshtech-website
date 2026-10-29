import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { services, serviceGroups } from '../src/generated/services-data.mjs';
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
    if (!address || typeof address === 'string') return reject(new Error('Could not reserve a preview port'));
    probe.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const baseUrl = `http://127.0.0.1:${port}/pricing/`;
const serviceRoute = slug => `http://127.0.0.1:${port}/services/${slug}/`;
// managed-it-support keeps the full interaction, consent, screenshot and
// first-load accounting flow. A second generated service, preferring one on the
// quote-based hero branch, gets representative coverage. Every route gets the
// HTTP, H1, overflow and browser-error sweep.
const managed = services.find(service => service.page.slug === 'managed-it-support');
if (!managed) throw new Error('managed-it-support is not in the generated services data');
const representative = services.find(service => service.page.slug !== managed.page.slug && service.content.priceFrom === null)
  ?? services.find(service => service.page.slug !== managed.page.slug);
if (!representative) throw new Error('The generated services data contains no second service route');
const serviceUrl = serviceRoute(managed.page.slug);
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
  const assetTransfers = [];
  const assetReads = [];
  const serviceScriptReads = [];
  const serviceScripts = new Map();
  let serviceInlineScripts = [];
  let assertionCount = 0;
  const allowedHosts = new Set(['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com', 'res.cloudinary.com']);
  const vendorUrls = new Set([
    'https://www.googletagmanager.com/gtag/js?id=G-XB492EFNKW',
    'https://www.clarity.ms/tag/urhwe2bbi1',
  ]);
  // Exact live-metrics report URL and deterministic synthetic fixture shared
  // with pricing-browser-check.mjs so /pricing does not hit the live helpdesk.
  const handleRequest = route => {
    const requestUrl = route.request().url();
    if (/^\/api\/website-(metrics|feedback)$/.test(new URL(requestUrl).pathname)) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (vendorUrls.has(requestUrl)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__consentVendorStubs=(window.__consentVendorStubs||0)+1;' });
    const url = new URL(requestUrl);
    if (isBlockmarkBadge(url)) return route.fulfill(BLOCKMARK_STUB);
    if (allowedHosts.has(url.hostname)) return route.continue();
    return route.abort();
  };
  const requestFailure = request => `request failed: ${request.method()} ${request.resourceType()} ${request.url()} (${request.failure()?.errorText ?? 'unknown error'})`;
  const check = (condition, message) => { assertionCount++; if (!condition) failures.push(message); };
  const contrastRatio = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const parse = value => (value.match(/[\d.]+/g) ?? []).map(Number);
    const blend = (foreground, background) => {
      const alpha = foreground.length >= 4 ? foreground[3] : 1;
      return foreground.slice(0, 3).map((channel, index) => channel * alpha + background[index] * (1 - alpha));
    };
    const luminance = rgb => {
      const [r, g, b] = rgb.map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = element => {
      const layers = [];
      for (let node = element.parentElement; node; node = node.parentElement) layers.push(parse(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255];
      for (const candidate of layers.reverse()) {
        const alpha = candidate.length >= 4 ? candidate[3] : 1;
        if (alpha > 0) background = blend(candidate, background);
      }
      const foreground = blend(parse(getComputedStyle(element).color), background);
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    };
    return Math.min(...elements.map(ratio));
  });
  await mkdir(resolve(projectDir, 'evidence'), { recursive: true });

  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(requestFailure(request)));
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.hostname === '127.0.0.1') return;
      assetReads.push(response.body().then(body => assetTransfers.push({ viewport: viewport.name, url: response.url(), bytes: body.length })).catch(() => undefined));
    });
    await page.route('**/*', handleRequest);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    check(await page.locator('h1').textContent() === PRICING_H1, `${viewport.name}: heading missing`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: horizontal overflow`);
    check(await page.locator('.static-fallback').isHidden(), `${viewport.name}: enhanced static fallback remains visible`);

    if (viewport.name === 'phone') {
      const menu = page.locator('[data-mobile-menu]');
      const summary = menu.locator('summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      check(await menu.getAttribute('open') !== null, 'phone: menu did not open with keyboard');
      check(await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), 'phone: open menu did not lock body scroll');
      await page.keyboard.press('Escape');
      check(await menu.getAttribute('open') === null, 'phone: Escape did not close menu');
      check(await summary.evaluate(element => element === document.activeElement), 'phone: menu focus was not returned');
    } else {
      const disclosure = page.locator('[data-nav-group="resources"]');
      const summary = disclosure.locator('summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      check(await disclosure.getAttribute('open') !== null, 'desktop: resources did not open with keyboard');
      await page.keyboard.press('Escape');
      check(await disclosure.getAttribute('open') === null, 'desktop: Escape did not close resources');
      check(await summary.evaluate(element => element === document.activeElement), 'desktop: resources focus was not returned');
      await page.keyboard.press('Enter');
      await page.locator('.desktop-actions a').first().focus();
      check(await disclosure.getAttribute('open') === null, 'desktop: resources remained open after focus left');
    }

    await page.locator('#people').evaluate((element) => { element.value = '20'; element.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('input[name="tier"][value="Premium"]').check();
    check(await page.locator('[data-monthly]').textContent() === '1,800', `${viewport.name}: 20 Premium was not £1,800`);
    await page.locator('#people').evaluate((element) => { element.value = '3'; element.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('input[name="tier"][value="Standard"]').check();
    check(await page.locator('[data-monthly]').textContent() === '200', `${viewport.name}: Standard minimum was not £200`);
    check(await page.locator('[data-minimum-message]').isVisible(), `${viewport.name}: minimum explanation missing`);
    await page.locator('input[name="tier"][value="Premium"]').check();
    check(await page.locator('[data-monthly]').textContent() === '270', `${viewport.name}: Premium incorrectly applied a minimum`);
    check(errors.length === 0, `${viewport.name}: browser errors after interactions: ${errors.join('; ')}`);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      document.documentElement.style.scrollBehavior = 'auto';
      scrollTo(0, 0);
    });
    await page.waitForTimeout(50);
    await page.screenshot({ path: resolve(projectDir, 'evidence', `${viewport.name}.png`), fullPage: true });
    await context.close();
  }

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(baseUrl);
  check(await noJsPage.locator('.static-fallback').isVisible(), 'no-JS: static estimate is not visible');
  check(await noJsPage.locator('.interactive-only').isHidden(), 'no-JS: dead controls are visible');
  await noJsPage.locator('[data-mobile-menu] summary').click();
  check(await noJsPage.locator('[data-mobile-menu] nav a').first().isVisible(), 'no-JS: mobile navigation links are unreachable');
  await noJsContext.close();

  for (const viewport of [{ name: 'service-phone', width: 390, height: 844 }, { name: 'service-desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    const vendorRequests = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(requestFailure(request)));
    page.on('request', request => {
      if (/google-analytics|googletagmanager|clarity\.ms|calendly\.com/.test(request.url())) vendorRequests.push(request.url());
    });
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.hostname !== '127.0.0.1' || response.request().resourceType() !== 'script' || serviceScripts.has(url.pathname)) return;
      serviceScripts.set(url.pathname, null);
      serviceScriptReads.push(response.body().then(body => serviceScripts.set(url.pathname, body)));
    });
    await page.route('**/*', handleRequest);
    await page.goto(serviceUrl, { waitUntil: 'networkidle' });
    check(await contrastRatio(page, '.related-label') >= 4.5, `${viewport.name}: related-services label contrast is below 4.5:1`);
    check(await contrastRatio(page, '.last-reviewed') >= 4.5, `${viewport.name}: last-reviewed text contrast is below 4.5:1`);
    check(await contrastRatio(page, '.service-hero .eyebrow') >= 4.5, `${viewport.name}: service eyebrow contrast is below 4.5:1`);
    check(await contrastRatio(page, '.hero-price > span:not(.price-label), .hero-price a') >= 4.5, `${viewport.name}: hero price small-text contrast is below 4.5:1`);
    check(await contrastRatio(page, '.closing-section small') >= 4.5, `${viewport.name}: closing small-text contrast is below 4.5:1`);
    check(await contrastRatio(page, '.step-number') >= 3, `${viewport.name}: large process numbers have insufficient contrast`);
    const contactTargets = await page.locator('.footer-brand > a').evaluateAll(links => links.map(link => {
      const { width, height, top, bottom } = link.getBoundingClientRect();
      return { width, height, top, bottom };
    }));
    check(contactTargets.length === 2 && contactTargets.every(target => target.width >= 44 && target.height >= 44), `${viewport.name}: footer contact targets are smaller than 44px`);
    check(contactTargets.length === 2 && contactTargets[1].top >= contactTargets[0].bottom, `${viewport.name}: footer contact targets overlap`);
    if (!serviceInlineScripts.length) {
      serviceInlineScripts = await page.evaluate(() => [...document.scripts]
        .filter(script => !script.src && !/^(application|text)\/ld\+json$/i.test(script.type))
        .map(script => script.textContent || '')
        .filter(Boolean));
    }
    check(await page.locator('h1').textContent() === managed.page.title, `${viewport.name}: heading missing`);
    check(await page.locator('.tick-list li').count() === managed.content.includes.length, `${viewport.name}: source inclusion list is incomplete`);
    check(await page.locator('.process-grid article').count() === managed.content.howItWorks.length, `${viewport.name}: process is incomplete`);
    check(await page.locator('.faq-list details').count() === managed.content.faqs.length, `${viewport.name}: FAQs are incomplete`);
    check(await page.locator('.hero-price').count() === 1 && await page.locator('.hero-quote').count() === 0, `${viewport.name}: priced hero branch missing`);
    check(await page.locator('nav a[aria-current="page"]').first().textContent() === 'Services', `${viewport.name}: active navigation is wrong`);
    check(await page.locator('a[href="/contact"]').count() >= 4, `${viewport.name}: conversion links are missing`);
    check(vendorRequests.length === 0, `${viewport.name}: vendor request occurred before consent`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: horizontal overflow`);

    const faq = page.locator('.faq-list details').first();
    await faq.locator('summary').focus();
    await page.keyboard.press('Enter');
    check(await faq.getAttribute('open') !== null, `${viewport.name}: FAQ did not open with keyboard`);

    if (viewport.width < 1024) {
      const menu = page.locator('[data-mobile-menu]');
      const summary = menu.locator('summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      check(await menu.getAttribute('open') !== null, `${viewport.name}: menu did not open`);
      await page.keyboard.press('Escape');
      check(await summary.evaluate(element => element === document.activeElement), `${viewport.name}: menu focus not returned`);
    } else {
      const disclosure = page.locator('[data-nav-group="resources"]');
      await disclosure.locator('summary').focus();
      await page.keyboard.press('Enter');
      check(await disclosure.getAttribute('open') !== null, `${viewport.name}: resources did not open`);
      await page.keyboard.press('Escape');
      check(await disclosure.getAttribute('open') === null, `${viewport.name}: resources did not close`);
      await disclosure.locator('summary').focus();
      await page.keyboard.press('Enter');
      await page.locator('.desktop-actions a').first().focus();
      check(await disclosure.getAttribute('open') === null, `${viewport.name}: resources remained open after focus left`);
    }

    if (viewport.width < 1024) {
      await page.waitForTimeout(950);
      check(await page.locator('[data-cookie-banner]').isVisible(), `${viewport.name}: cookie notice did not appear`);
      await page.locator('[data-consent="reject"]').click();
      check(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).analytics === false, 'ft-cookie-consent-v1'), `${viewport.name}: rejection was not stored`);
      check(vendorRequests.length === 0, `${viewport.name}: rejection triggered a vendor request`);
    } else {
      const settings = page.locator('[data-cookie-settings]');
      await settings.focus();
      await settings.click();
      check(await page.locator('[data-cookie-dialog]').evaluate(dialog => dialog.open), `${viewport.name}: cookie settings did not open`);
      await page.keyboard.press('Escape');
      check(await settings.evaluate(element => element === document.activeElement), `${viewport.name}: cookie settings focus not returned`);
      await settings.click();
      await page.locator('[data-analytics]').check();
      await page.locator('[data-save-consent]').click();
      check(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).analytics === true, 'ft-cookie-consent-v1'), `${viewport.name}: analytics preference was not stored`);
      check(await settings.evaluate(element => element === document.activeElement), `${viewport.name}: saved settings did not return focus to a visible control`);
      await page.mouse.click(5, 5);
      await page.waitForFunction(() => window.__consentVendorStubs === 2, null, { timeout: 5000 }).catch(() => undefined);
      check(vendorRequests.length === 2 && vendorRequests.every(url => vendorUrls.has(url)), `${viewport.name}: consent loaded an unexpected vendor set: ${vendorRequests.join(', ')}`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors after interactions: ${errors.join('; ')}`);
    await context.close();
  }

  const serviceNoJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const serviceNoJs = await serviceNoJsContext.newPage();
  await serviceNoJs.goto(serviceUrl);
  check(await serviceNoJs.locator('h1').textContent() === managed.page.title, 'service no-JS: heading missing');
  check(await serviceNoJs.locator('.tick-list li').count() === managed.content.includes.length, 'service no-JS: content incomplete');
  await serviceNoJs.locator('.faq-list summary').first().click();
  check(await serviceNoJs.locator('.faq-list details').first().getAttribute('open') !== null, 'service no-JS: FAQ unreachable');
  await serviceNoJs.locator('[data-mobile-menu] summary').click();
  check(await serviceNoJs.locator('[data-mobile-menu] nav a').first().isVisible(), 'service no-JS: mobile navigation unreachable');
  await serviceNoJsContext.close();

  // Representative coverage of a second generated service route.
  for (const viewport of [{ name: `${representative.page.slug}-phone`, width: 390, height: 844 }, { name: `${representative.page.slug}-desktop`, width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    const vendorRequests = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(requestFailure(request)));
    page.on('request', request => {
      if (/google-analytics|googletagmanager|clarity\.ms|calendly\.com/.test(request.url())) vendorRequests.push(request.url());
    });
    await page.route('**/*', handleRequest);
    const response = await page.goto(serviceRoute(representative.page.slug), { waitUntil: 'networkidle' });
    check(response?.status() === 200, `${viewport.name}: route did not return 200`);
    check(await page.locator('h1').textContent() === representative.page.title, `${viewport.name}: heading missing`);
    check((await page.locator('.tagline').textContent()) === representative.content.tagline, `${viewport.name}: tagline missing`);
    check(await page.locator('.tick-list li').count() === representative.content.includes.length, `${viewport.name}: source inclusion list is incomplete`);
    check(await page.locator('.process-grid article').count() === representative.content.howItWorks.length, `${viewport.name}: process is incomplete`);
    check(await page.locator('.outcomes article').count() === representative.content.outcomes.length, `${viewport.name}: outcomes are incomplete`);
    check(await page.locator('.faq-list details').count() === representative.content.faqs.length, `${viewport.name}: FAQs are incomplete`);
    if (representative.content.priceFrom === null) {
      check(await page.locator('.hero-quote').isVisible() && await page.locator('.hero-price').count() === 0, `${viewport.name}: quote hero branch missing`);
      check(await page.locator('.hero-quote a[href="/contact"]').isVisible(), `${viewport.name}: quote link missing`);
      check(await contrastRatio(page, '.hero-quote .quote-label, .hero-quote a') >= 4.5, `${viewport.name}: quote small-text contrast is below 4.5:1`);
    } else {
      check(await page.locator('.hero-price').isVisible() && await page.locator('.hero-quote').count() === 0, `${viewport.name}: priced hero branch missing`);
      check(await contrastRatio(page, '.hero-price > span:not(.price-label), .hero-price a') >= 4.5, `${viewport.name}: price small-text contrast is below 4.5:1`);
    }
    const relatedHrefs = await page.locator('.related-links a:not(.all-services)').evaluateAll(links => links.map(link => link.getAttribute('href')));
    check(relatedHrefs.join(',') === representative.related.map(item => `/services/${item.slug}`).join(','), `${viewport.name}: related links differ from source order`);
    check(await page.locator('nav a[aria-current="page"]').first().textContent() === 'Services', `${viewport.name}: active navigation is wrong`);
    check(await page.locator('a[href="/contact"]').count() >= 4, `${viewport.name}: conversion links are missing`);
    check(vendorRequests.length === 0, `${viewport.name}: vendor request occurred before consent`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: horizontal overflow`);
    const faq = page.locator('.faq-list details').first();
    await faq.locator('summary').focus();
    await page.keyboard.press('Enter');
    check(await faq.getAttribute('open') !== null, `${viewport.name}: FAQ did not open with keyboard`);
    if (viewport.width < 1024) {
      const menu = page.locator('[data-mobile-menu]');
      await menu.locator('summary').focus();
      await page.keyboard.press('Enter');
      check(await menu.getAttribute('open') !== null, `${viewport.name}: menu did not open`);
      await page.keyboard.press('Escape');
      check(await menu.getAttribute('open') === null, `${viewport.name}: Escape did not close menu`);
      await page.waitForTimeout(950);
      check(await page.locator('[data-cookie-banner]').isVisible(), `${viewport.name}: cookie notice did not appear`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors after interactions: ${errors.join('; ')}`);
    await context.close();
  }

  const representativeNoJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const representativeNoJs = await representativeNoJsContext.newPage();
  await representativeNoJs.goto(serviceRoute(representative.page.slug));
  check(await representativeNoJs.locator('h1').textContent() === representative.page.title, `${representative.page.slug} no-JS: heading missing`);
  check(await representativeNoJs.locator('.tick-list li').count() === representative.content.includes.length, `${representative.page.slug} no-JS: content incomplete`);
  await representativeNoJs.locator('[data-mobile-menu] summary').click();
  check(await representativeNoJs.locator('[data-mobile-menu] nav a').first().isVisible(), `${representative.page.slug} no-JS: mobile navigation unreachable`);
  await representativeNoJsContext.close();

  // Every generated service route: HTTP status, H1, overflow and browser errors.
  const sweptRoutes = [];
  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(requestFailure(request)));
    await page.route('**/*', handleRequest);
    for (const service of services) {
      const label = `${service.page.slug} sweep ${viewport.name}`;
      const response = await page.goto(serviceRoute(service.page.slug), { waitUntil: 'load' });
      check(response?.status() === 200, `${label}: route returned ${response?.status() ?? 'no response'}`);
      check(await page.locator('h1').textContent() === service.page.title, `${label}: H1 is not the catalogue title`);
      check(await page.locator('main.service-page').count() === 1, `${label}: service template missing`);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${label}: horizontal overflow`);
      if (viewport.name === 'phone' && service.page.slug === 'backup-disaster-recovery') {
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
        await page.waitForTimeout(50);
        await page.screenshot({ path: resolve(projectDir, 'evidence', 'service-backup-disaster-recovery-phone-viewport.png') });
      }
      check(errors.length === 0, `${label}: browser errors: ${errors.join('; ')}`);
      errors.length = 0;
      if (viewport.name === 'phone') sweptRoutes.push(service.page.slug);
    }
    await context.close();
  }
  const sourceSlugs = services.map(service => service.page.slug);
  check(sweptRoutes.join(',') === sourceSlugs.join(','), `route sweep covered [${sweptRoutes.join(', ')}] rather than [${sourceSlugs.join(', ')}]`);

  // /services listing: reached through the header Services entrypoint from a
  // detail route, then structure, card order, overflow and errors.
  const listingUrl = `http://127.0.0.1:${port}/services/`;
  const expectedCardHrefs = serviceGroups.flatMap(group => group.services.map(item => item.href));
  for (const viewport of [{ name: 'listing-phone', width: 390, height: 844 }, { name: 'listing-desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    const vendorRequests = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(requestFailure(request)));
    page.on('request', request => {
      if (/google-analytics|googletagmanager|clarity\.ms|calendly\.com/.test(request.url())) vendorRequests.push(request.url());
    });
    await page.route('**/*', handleRequest);
    await page.goto(serviceUrl, { waitUntil: 'networkidle' });
    if (viewport.width < 1024) {
      await page.locator('[data-mobile-menu] summary').click();
      await page.locator('[data-mobile-menu] nav a[href="/services"]').click();
    } else {
      await page.locator('.desktop-nav a[href="/services"]').click();
    }
    await page.waitForURL(url => /^\/services\/?$/.test(url.pathname), { waitUntil: 'networkidle' });
    check(/^\/services\/?$/.test(new URL(page.url()).pathname), `${viewport.name}: navigation Services entrypoint did not resolve to /services`);
    check(await page.locator('h1').textContent() === 'All the IT your business needs. One place. One fee.', `${viewport.name}: listing heading missing`);
    check(await page.locator('.group-section').count() === serviceGroups.length, `${viewport.name}: group count differs from source`);
    check((await page.locator('.group-intro h2').allTextContents()).join('|') === serviceGroups.map(group => group.group).join('|'), `${viewport.name}: group order differs from source`);
    const cardHrefs = await page.locator('.service-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')));
    check(cardHrefs.join(',') === expectedCardHrefs.join(','), `${viewport.name}: card hrefs differ from source order`);
    check(await page.locator('.listing-stats .hero-stat').count() === 4, `${viewport.name}: hero stats missing`);
    check(await contrastRatio(page, '.service-hero .eyebrow') >= 4.5, `${viewport.name}: listing eyebrow contrast is below 4.5:1`);
    check(await contrastRatio(page, '.listing-stats .hero-stat span') >= 4.5, `${viewport.name}: listing stat-label contrast is below 4.5:1`);
    check(await contrastRatio(page, '.service-card small') >= 4.5, `${viewport.name}: listing card-price contrast is below 4.5:1`);
    check(await page.locator('nav a[aria-current="page"]').first().textContent() === 'Services', `${viewport.name}: active navigation is wrong`);
    check(await page.locator('a[href="/it-health-check"]').count() >= 1 && await page.locator('a[href="/contact"]').count() >= 2, `${viewport.name}: CTA links missing`);
    check(vendorRequests.length === 0, `${viewport.name}: vendor request occurred before consent`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: horizontal overflow`);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await page.waitForTimeout(50);
    await page.screenshot({ path: resolve(projectDir, 'evidence', `${viewport.name}-viewport.png`) });
    // A card is a real link to a generated detail route.
    const firstDetail = expectedCardHrefs.find(href => href.startsWith('/services/'));
    await page.locator(`.service-card[href="${firstDetail}"]`).click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, '') === firstDetail, { waitUntil: 'load' });
    check(await page.locator('main.service-page').count() === 1, `${viewport.name}: card did not open a generated detail route`);
    check(errors.length === 0, `${viewport.name}: browser errors after interactions: ${errors.join('; ')}`);
    await context.close();
  }

  const listingNoJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const listingNoJs = await listingNoJsContext.newPage();
  const listingNoJsResponse = await listingNoJs.goto(listingUrl);
  check(listingNoJsResponse?.status() === 200, 'listing no-JS: route did not return 200');
  check(await listingNoJs.locator('h1').textContent() === 'All the IT your business needs. One place. One fee.', 'listing no-JS: heading missing');
  check(await listingNoJs.locator('.service-card').count() === expectedCardHrefs.length, 'listing no-JS: cards incomplete');
  await listingNoJs.locator('[data-mobile-menu] summary').click();
  check(await listingNoJs.locator('[data-mobile-menu] nav a').first().isVisible(), 'listing no-JS: mobile navigation unreachable');
  await listingNoJsContext.close();

  for (const viewport of [{ name: 'service-phone', width: 390, height: 844 }, { name: 'service-desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    await context.addInitScript(key => window === window.top && localStorage.setItem(key, JSON.stringify({ analytics: false, ts: Date.now() })), 'ft-cookie-consent-v1');
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(requestFailure(request)));
    await page.route('**/*', handleRequest);
    await page.goto(serviceUrl, { waitUntil: 'networkidle' });
    check(await page.evaluate(() => scrollY === 0), `${viewport.name}: fresh visual context did not start at page top`);
    check(errors.length === 0, `${viewport.name}: visual context browser errors: ${errors.join('; ')}`);
    await page.screenshot({ path: resolve(projectDir, 'evidence', `${viewport.name}-viewport.png`) });
    await page.addStyleTag({ content: '.site-header{position:static!important}' });
    await page.screenshot({ path: resolve(projectDir, 'evidence', `${viewport.name}-fullpage-normalised.png`), fullPage: true });
    await context.close();
  }

  await Promise.all(assetReads);
  await writeFile(resolve(projectDir, 'evidence', 'external-assets.json'), `${JSON.stringify(assetTransfers, null, 2)}\n`, 'utf8');
  await Promise.all(serviceScriptReads);
  const prototypeAssets = [...serviceScripts]
    .filter(([, body]) => body)
    .map(([path, body]) => ({ path, bytes: body.length, gzipBytes: gzipSync(body).length, brotliBytes: brotliCompressSync(body).length }));
  const inlineBody = Buffer.from(serviceInlineScripts.join('\n'), 'utf8');
  const inline = {
    count: serviceInlineScripts.length,
    bytes: inlineBody.length,
    gzipBytes: inlineBody.length ? gzipSync(inlineBody).length : 0,
    brotliBytes: inlineBody.length ? brotliCompressSync(inlineBody).length : 0,
  };
  const sum = key => prototypeAssets.reduce((total, asset) => total + asset[key], 0) + inline[key];
  await writeFile(resolve(projectDir, 'evidence', 'prototype-first-load.json'), `${JSON.stringify({
    route: `/services/${managed.page.slug}`,
    method: 'Unique local script response bodies plus executable inline scripts in a cold browser context; JSON-LD excluded.',
    externalScripts: prototypeAssets,
    inlineScripts: inline,
    totals: { bytes: sum('bytes'), gzipBytes: sum('gzipBytes'), brotliBytes: sum('brotliBytes') },
  }, null, 2)}\n`, 'utf8');

  await browser.close();
  if (failures.length) throw new Error(`Browser checks failed:\n- ${failures.join('\n- ')}`);
  console.log(`${assertionCount} browser assertions passed across pricing, the /services listing, ${managed.page.slug} (full), ${representative.page.slug} (representative) and a ${services.length}-route sweep (${sourceSlugs.join(', ')}) in phone, desktop and no-JS contexts`);
} finally {
  server.kill('SIGTERM');
}
