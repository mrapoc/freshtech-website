import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { inspectMarker } from './lib/problem-inventory.mjs';
import { classifyRequest, describeRequestFailure, formatRequestFailures } from './lib/problem-browser-network.mjs';

// Browser gate for /team/[slug] (TeamPage.astro). Team pages carry no reviews
// or forms, so this runs against the canonical dist (TEAM_TEST_DIST, default
// dist). Routes are discovered from the data-team-page marker.
//   - every route at 390 / 1440 / 320: status, one H1 in one main, cards present
//     and linking to /blog/, no page overflow, no browser errors;
//   - keyboard: the first card is reachable by Tab and shows a visible focus;
//   - computed contrast >= 4.5:1 on the template's text at phone and desktop;
//   - measured 200% text at 320px: no page overflow or clipped text;
//   - JavaScript off: profile, cards and CTA visible, no overflow;
//   - delayed fonts: H1 and main geometry must not move once fonts arrive.
// Owned 127.0.0.1 server, sandboxed Chromium, the shared network policy
// (served origin only; Cloudinary images stubbed; everything else aborted).
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(process.env.TEAM_TEST_DIST || resolve(projectDir, 'dist'));
const evidenceDir = resolve(process.env.TEAM_EVIDENCE_DIR || resolve(projectDir, 'evidence', 'team-browser'));
const MARKER = 'data-team-page';
const REQUIRED_SECTIONS = ['sweep-phone', 'sweep-desktop', 'sweep-320', 'representatives', 'text-200', 'no-js', 'delayed-font'];

const routes = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
  const { mains, marker, strayMarkers, emptyMarkers } = inspectMarker(await readFile(resolve(entry.parentPath, entry.name), 'utf8'), MARKER);
  if (marker === null && !strayMarkers && !emptyMarkers) continue;
  if (mains !== 1 || strayMarkers || emptyMarkers || route !== `team/${marker}`) throw new Error(`/${route}: invalid ${MARKER} marker`);
  routes.push(route);
}
if (!routes.length) throw new Error(`no ${MARKER} pages under ${distDir}; build first`);

const contentTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') throw new Error('Read-only server');
    let pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolve(distDir, `.${pathname}`);
    if (file !== distDir && !file.startsWith(`${distDir}${sep}`)) throw new Error('Unsafe request path');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
const baseUrl = `http://127.0.0.1:${server.address().port}`;
// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
const phone = { name: 'phone', width: 390, height: 844 };
const desktop = { name: 'desktop', width: 1440, height: 1000 };
const narrow = { name: '320', width: 320, height: 844 };
const contrastSelectors = '.team-breadcrumbs a, .team-breadcrumbs [aria-current="page"], .team-power, .team-role, .team-bio, .team-expertise li, .team-linkedin, .team-articles h2, .team-count, .team-tags span, .team-card h3, .team-excerpt, .team-meta > span, .team-empty, .team-cta h3, .team-cta p, .team-cta-button';

const failures = [];
const sections = [];
const networkFailures = [];
const geometry = [];
let assertions = 0;
let fatal = null;
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  const configure = async (page, label, fontGate = null) => {
    const state = { errors: [], blocked: [] };
    page.on('console', message => { if (message.type() === 'error') state.errors.push(message.text()); });
    page.on('pageerror', error => state.errors.push(error.message));
    page.context().on('requestfailed', request => networkFailures.push({ label, ...describeRequestFailure({ method: request.method(), url: request.url(), errorText: request.failure()?.errorText, pageUrl: page.url(), baseOrigin: baseUrl }) }));
    await page.route('**/*', async route => {
      const request = route.request();
      const decision = classifyRequest({ method: request.method(), url: request.url(), baseOrigin: baseUrl });
      if (decision.action === 'continue') {
        if (fontGate && new URL(request.url()).pathname.endsWith('.woff2')) { await delay(1000); await fontGate; }
        return route.continue();
      }
      if (decision.action === 'fulfil') return route.fulfill(decision.stub);
      state.blocked.push(`${request.method()} ${request.url()}`);
      return route.abort();
    });
    return state;
  };
  const clean = (state, label) => {
    check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
    check(state.blocked.length === 0, `${label}: blocked requests ${state.blocked.join(', ')}`);
  };
  const close = async (context, page, label) => {
    check(await page.waitForLoadState('networkidle', { timeout: 10000 }).then(() => true, () => false), `${label}: network did not settle`);
    await context.close();
  };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const settle = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  const structure = async (page, label) => {
    const shape = await page.evaluate(() => ({
      h1s: document.querySelectorAll('h1').length, mains: document.querySelectorAll('main').length,
      h1: document.querySelector('h1')?.textContent.trim(), crumb: document.querySelector('.team-breadcrumbs [aria-current="page"]')?.textContent.trim(),
      cards: document.querySelectorAll('.team-card').length, cardLinks: [...document.querySelectorAll('.team-card')].every(card => card.getAttribute('href').startsWith('/blog/')),
      empty: document.querySelectorAll('.team-empty').length, cta: document.querySelector('.team-cta-button')?.getAttribute('href'),
    }));
    check(shape.h1s === 1 && shape.mains === 1 && shape.h1 && shape.h1 === shape.crumb, `${label}: one H1 in one main matching the breadcrumb`);
    check((shape.cards > 0 && shape.cardLinks && shape.empty === 0) || (shape.cards === 0 && shape.empty === 1), `${label}: article cards or empty state`);
    check(shape.cta === '/contact', `${label}: CTA link`);
  };
  const contrast = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) => { const alpha = front.length > 3 ? front[3] : 1; return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha)); };
    const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return elements.filter(element => element.offsetParent !== null).map(element => {
      const layers = []; for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255]; for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = luminance(blend(channels(getComputedStyle(element).color), background));
      const behind = luminance(background);
      return { ratio: (Math.max(foreground, behind) + .05) / (Math.min(foreground, behind) + .05), name: element.className || element.tagName };
    });
  });
  const doubleText = page => page.evaluate(() => {
    const elements = [document.body, ...document.body.querySelectorAll('*')];
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const before = parseFloat(getComputedStyle(document.querySelector('h1')).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return Math.abs(parseFloat(getComputedStyle(document.querySelector('h1')).fontSize) - before * 2) <= .5;
  });
  await mkdir(evidenceDir, { recursive: true });

  for (const viewport of [phone, desktop, narrow]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configure(page, `sweep-${viewport.name}`);
    for (const route of routes) {
      const label = `${viewport.name}/${route}`;
      check((await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' }))?.status() === 200, `${label}: status`);
      await structure(page, label);
      check(await noOverflow(page), `${label}: page overflow`);
    }
    clean(state, `sweep-${viewport.name}`);
    sections.push(`sweep-${viewport.name}`);
    await close(context, page, `sweep-${viewport.name}`);
  }

  for (const viewport of [phone, desktop]) {
    for (const route of routes) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const label = `${viewport.name}/${route}`;
      const state = await configure(page, label);
      await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' });
      const firstCard = page.locator('.team-card').first();
      if (await firstCard.count()) {
        let reached = false;
        for (let step = 0; step < 60 && !reached; step++) { await page.keyboard.press('Tab'); reached = await firstCard.evaluate(element => element === document.activeElement); }
        check(reached && await firstCard.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'), `${label}: first article card not reachable by Tab with a visible focus`);
      }
      const ratios = await contrast(page, contrastSelectors);
      const low = ratios.filter(item => item.ratio < 4.5);
      check(ratios.length >= 15 && low.length === 0, `${label}: contrast below 4.5 ${low.map(item => `${item.name} ${item.ratio.toFixed(2)}`).join(', ')}`);
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      await settle(page);
      await page.screenshot({ path: resolve(evidenceDir, `${route.replace('/', '-')}-${viewport.name}.png`) });
      clean(state, label);
      await close(context, page, label);
    }
  }
  sections.push('representatives');

  {
    const context = await browser.newContext({ viewport: narrow });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configure(page, 'text-200');
    for (const route of routes) {
      await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' });
      check(await doubleText(page), `320-200/${route}: H1 did not double`);
      await settle(page);
      check(await noOverflow(page), `320-200/${route}: page overflow at 200% text`);
      const clipped = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(element => {
        if (!element.getClientRects().length || !element.textContent.trim()) return false;
        const style = getComputedStyle(element);
        const clips = value => value === 'hidden' || value === 'clip';
        return (clips(style.overflowY) && element.scrollHeight > element.clientHeight + 1) || (clips(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
      }).map(element => element.className || element.tagName).slice(0, 5));
      check(clipped.length === 0, `320-200/${route}: clipped text ${clipped.join(', ')}`);
      await page.screenshot({ path: resolve(evidenceDir, `${route.replace('/', '-')}-320-200.png`), fullPage: true });
    }
    clean(state, 'text-200');
    sections.push('text-200');
    await close(context, page, 'text-200');
  }

  for (const route of routes) {
    const context = await browser.newContext({ viewport: phone, javaScriptEnabled: false });
    const page = await context.newPage();
    const label = `no-js/${route}`;
    const state = await configure(page, label);
    check((await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'domcontentloaded' }))?.status() === 200, `${label}: status`);
    await structure(page, label);
    check(await page.locator('.team-profile, .team-articles, .team-cta').evaluateAll(items => items.length === 3 && items.every(item => item.getClientRects().length > 0)), `${label}: profile, articles and CTA visible`);
    check(await noOverflow(page), `${label}: overflow`);
    clean(state, label);
    await close(context, page, label);
  }
  sections.push('no-js');

  for (const route of routes) {
    for (const [viewport, doubled] of [[phone, false], [desktop, false], [narrow, true]]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const label = `delayed-font/${viewport.name}${doubled ? '-200' : ''}/${route}`;
      let release;
      const gate = new Promise(done => { release = done; });
      const state = await configure(page, label, gate);
      try {
        await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'domcontentloaded' });
        if (doubled) check(await doubleText(page), `${label}: H1 did not double`);
        await delay(150);
        await settle(page);
        const measure = () => page.evaluate(() => Object.fromEntries(['h1', 'main', '.team-articles'].map(selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return [selector, [rect.x, rect.y + scrollY, rect.width, rect.height]]; })));
        const before = await measure();
        release();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        await settle(page);
        const after = await measure();
        const delta = Math.max(...Object.keys(before).flatMap(key => before[key].map((value, index) => Math.abs(value - after[key][index]))));
        geometry.push({ label, delta, before, after });
        check(delta <= .75, `${label}: geometry moved ${delta.toFixed(2)}px after fonts loaded`);
        check(await noOverflow(page), `${label}: overflow`);
      } finally { release(); }
      clean(state, label);
      await close(context, page, label);
    }
  }
  sections.push('delayed-font');

  check(networkFailures.length === 0, `network: ${networkFailures.length} failed requests ${formatRequestFailures(networkFailures)}`);
  const missing = REQUIRED_SECTIONS.filter(name => !sections.includes(name));
  check(missing.length === 0, `sections skipped: ${missing.join(', ')}`);
  if (failures.length) throw new Error(`${failures.length} team browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} team browser assertions passed across ${routes.length} routes (390/1440/320 sweeps, keyboard card focus, contrast, 320px 200% text, no-JS, delayed fonts)`);
} catch (error) {
  fatal = error;
} finally {
  if (browser) await browser.close().catch(() => {});
  await new Promise(done => server.close(done));
  await writeFile(resolve(evidenceDir, 'report.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), distDir: relative(projectDir, distDir), routes, sections, assertions, failures, networkFailures, geometry, error: fatal ? fatal.message : null }, null, 2)}\n`);
  if (fatal) { console.error(fatal.message); process.exitCode = 1; }
}
