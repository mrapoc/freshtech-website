import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parse } from 'ultrahtml';
import { inspectMarker } from './lib/problem-inventory.mjs';
import { CLARITY_URL, CLOUDINARY_ORIGIN, GA_URL, classifyRequest, describeRequestFailure, formatRequestFailures } from './lib/problem-browser-network.mjs';
import { TESTIMONIALS_FIXTURE_ATTRIBUTE } from './lib/testimonial-fixture.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

// Browser gate for the root-slug comparison family (ComparisonPage.astro with
// the shared SourceTestimonials and SourceContact sections). Like the Problem
// gate it only runs against the synthetic fixture build (COMPARISON_TEST_DIST,
// normally the same dist-synthetic the Problem gate uses): routes are
// discovered from the data-comparison-page marker and every page must carry
// the synthetic testimonials attribute or no browser starts. The shared
// carousel behaviour is covered by the Problem gate; this gate covers what the
// comparison template adds:
//   - every route at 390 / 1440 / 320: status, one H1 in one main, table shape
//     (one header row, row headers, cells per option), recommendation rule,
//     FAQ count, disabled contact, no page overflow, no browser errors;
//   - representatives (the three-option page and one two-option page) at phone
//     and desktop: keyboard single-open FAQ, keyboard mobile menu, the table
//     region is keyboard focusable and scrolls horizontally when narrower than
//     the table, computed contrast on the template's text (including the
//     recommended card, badge and table), measured 200% text with no page
//     overflow or clipped text, screenshots;
//   - 320px with 200% text: the table still scrolls inside its region;
//   - fresh consent: reject loads nothing; accept with stubbed vendors queues
//     exactly one service_view labelled comparison_<slug>;
//   - JavaScript off: native FAQ, every option and cell visible, no overflow;
//   - delayed fonts at phone, desktop and 320/200%: local fonts are held until
//     a fallback snapshot is taken; H1, main and table geometry must not move
//     after the fonts arrive (0.75px) and nothing may overflow.
// Owned read-only 127.0.0.1 server, explicit Chromium, sandbox on, and the
// Problem gate's unit-tested network policy (served origin only; Cloudinary
// and, under accept only, the two exact vendor URLs stubbed; everything else
// aborted and recorded as a failure).
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
if (!process.env.COMPARISON_TEST_DIST) throw new Error('COMPARISON_TEST_DIST is required: the synthetic fixture dist built from scripts/stage-problem-fixture.mjs');
const distDir = resolve(process.env.COMPARISON_TEST_DIST);
if (!(await stat(distDir).catch(() => null))?.isDirectory()) throw new Error(`COMPARISON_TEST_DIST is not a directory: ${distDir}`);
const projectDir = resolve(import.meta.dirname, '..');
const evidenceDir = resolve(process.env.COMPARISON_EVIDENCE_DIR || resolve(projectDir, 'evidence', 'comparison-browser'));
const MARKER = 'data-comparison-page';
const REQUIRED_SECTIONS = ['sweep-phone', 'sweep-desktop', 'sweep-320', 'representatives', 'table-320-200', 'consent-reject', 'consent-accept', 'no-js', 'delayed-font'];
const FONT_DELAY_MS = 1000;
const GEOMETRY_TOLERANCE_PX = 0.75;
const NETWORK_SETTLE_TIMEOUT_MS = 10000;
const vendorHosts = new Set(['www.googletagmanager.com', 'www.google-analytics.com', 'analytics.google.com', 'www.clarity.ms', 'c.clarity.ms']);
const isVendor = href => vendorHosts.has(new URL(href).hostname);
const isCloudinary = href => new URL(href).origin === CLOUDINARY_ORIGIN;

// 1. Discovery: marker-owned, fixture-marked pages only.
const ELEMENT = 1;
const attrOf = (node, name) => { for (const [key, value] of Object.entries(node.attributes ?? {})) if (key.toLowerCase() === name) return typeof value === 'string' ? value : ''; return undefined; };
const findAll = (node, predicate, out = []) => { if (node.type === ELEMENT && predicate(node)) out.push(node); for (const child of node.children ?? []) findAll(child, predicate, out); return out; };
const routes = [];
const discoveryErrors = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
  const html = await readFile(resolve(entry.parentPath, entry.name), 'utf8');
  const { mains, marker, strayMarkers, emptyMarkers } = inspectMarker(html, MARKER);
  if (marker === null && !strayMarkers && !emptyMarkers) continue;
  if (mains !== 1 || strayMarkers || emptyMarkers || marker !== route) { discoveryErrors.push(`/${route}: invalid ${MARKER} marker`); continue; }
  const document = parse(html);
  const testimonials = findAll(document, node => attrOf(node, 'data-testimonials') !== undefined);
  if (testimonials.length !== 1 || attrOf(testimonials[0], TESTIMONIALS_FIXTURE_ATTRIBUTE) !== 'true') discoveryErrors.push(`/${route}: testimonials section is not the synthetic fixture`);
  const options = findAll(document, node => (attrOf(node, 'class') ?? '').split(/\s+/).includes('cp-option')).length;
  routes.push({ slug: route, options });
}
if (!routes.length) discoveryErrors.push(`no ${MARKER} pages found under ${distDir}; build the staged fixture first`);
const threeOption = routes.find(route => route.options > 2);
const twoOption = routes.find(route => route.options === 2);
if (!threeOption || !twoOption) discoveryErrors.push('representatives need one page with three or more options and one with two');
if (discoveryErrors.length) throw new Error(`Refusing to start a browser:\n${discoveryErrors.join('\n')}`);
const representatives = [threeOption, twoOption];

// 2. Owned read-only static server.
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
  } catch {
    response.writeHead(404); response.end('Not found');
  }
});
await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not start local static server');
const baseUrl = `http://127.0.0.1:${address.port}`;
for (const route of routes) route.url = `${baseUrl}/${route.slug}/`;

// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
const phone = { name: 'phone', width: 390, height: 844 };
const desktop = { name: 'desktop', width: 1440, height: 1000 };
const narrow = { name: '320', width: 320, height: 844 };
const contrastSelectors = '.cp-breadcrumbs a, .cp-breadcrumbs [aria-current="page"], .cp-hero-copy, .cp-button, .cp-section-heading p, .cp-badge, .cp-option h3, .cp-option-desc, .cp-option h4, .cp-points span, .cp-best-for, .cp-table th, .cp-table td, .cp-verdict h2, .cp-verdict-copy p, .cp-rich p, .cp-rich li, .cp-rich a, .cp-faq-list summary span, .cp-final-copy, .source-testimonials-lead, .source-contact-lead';

const failures = [];
const sections = [];
const evidence = [];
const fontGeometry = [];
const networkFailures = [];
let assertions = 0;
let fatal = null;
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  const configurePage = async (page, { label = 'page', vendorStub = null, fontGate = null } = {}) => {
    const state = { errors: [], external: [], blocked: [], failed: [] };
    page.on('console', message => { if (message.type() === 'error') state.errors.push(message.text()); });
    page.on('pageerror', error => state.errors.push(error.message));
    page.context().on('requestfailed', request => {
      const failure = describeRequestFailure({ method: request.method(), url: request.url(), errorText: request.failure()?.errorText, pageUrl: page.url(), baseOrigin: baseUrl });
      state.failed.push(failure);
      networkFailures.push({ label, ...failure });
    });
    await page.route('**/*', async route => {
      const request = route.request();
      if (request.method() === 'GET' && isBlockmarkBadge(request.url())) return route.fulfill(BLOCKMARK_STUB);
      const decision = classifyRequest({ method: request.method(), url: request.url(), baseOrigin: baseUrl, vendorStub });
      if (decision.action === 'continue') {
        if (fontGate && new URL(request.url()).pathname.endsWith('.woff2')) { await delay(FONT_DELAY_MS); await fontGate; }
        return route.continue();
      }
      if (decision.action === 'fulfil') { state.external.push(request.url()); return route.fulfill(decision.stub); }
      state.blocked.push(`${request.method()} ${request.url()} (${decision.reason})`);
      return route.abort();
    });
    return state;
  };
  const settleNetwork = async (page, label) => {
    const settled = await page.waitForLoadState('networkidle', { timeout: NETWORK_SETTLE_TIMEOUT_MS }).then(() => true, () => false);
    check(settled, `${label}: network did not settle`);
  };
  const clean = (state, label, { vendors = false } = {}) => {
    check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
    check(state.blocked.length === 0, `${label}: blocked requests ${state.blocked.join(', ')}`);
    check(state.failed.length === 0, `${label}: failed requests ${formatRequestFailures(state.failed)}`);
    check(state.external.every(href => isCloudinary(href) || (vendors && (href === GA_URL || href === CLARITY_URL))), `${label}: unexpected external requests ${state.external.join(', ')}`);
  };
  const closeContext = async (context, page, label) => { await settleNetwork(page, label); await context.close(); };
  const settle = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const screenshot = async (page, name) => {
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo({ top: 0, behavior: 'instant' }); });
    await settle(page);
    await page.screenshot({ path: resolve(evidenceDir, name) });
    evidence.push(name);
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
    const h1 = document.querySelector('h1');
    const before = parseFloat(getComputedStyle(h1).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return Math.abs(parseFloat(getComputedStyle(h1).fontSize) - before * 2) <= .5;
  });
  const clippedText = page => page.evaluate(() => [...document.querySelectorAll('main *')].filter(element => {
    if (!element.getClientRects().length || !element.textContent.trim() || element.matches('.cp-table-scroll')) return false;
    const style = getComputedStyle(element);
    const clips = value => value === 'hidden' || value === 'clip';
    return (clips(style.overflowY) && element.scrollHeight > element.clientHeight + 1) || (clips(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
  }).map(element => element.className || element.tagName).slice(0, 5));
  const structure = async (page, route, label) => {
    const shape = await page.evaluate(() => {
      const options = document.querySelectorAll('.cp-option').length;
      return {
        h1s: document.querySelectorAll('h1').length, mains: document.querySelectorAll('main').length,
        h1: document.querySelector('h1')?.textContent.trim(), crumb: document.querySelector('.cp-breadcrumbs [aria-current="page"]')?.textContent.trim(),
        options, headerCells: document.querySelectorAll('.cp-table thead th').length,
        rowsOk: [...document.querySelectorAll('.cp-table tbody tr')].every(row => row.querySelectorAll('th[scope="row"]').length === 1 && row.querySelectorAll('td').length === options),
        rows: document.querySelectorAll('.cp-table tbody tr').length,
        recommended: [...document.querySelectorAll('.cp-option')].map(card => card.dataset.recommended === 'true'),
        faqs: document.querySelectorAll('.cp-faq-list details').length,
        contactDisabled: document.querySelectorAll('[data-contact-disabled]').length === 1 && document.querySelectorAll('form:not([method="dialog"]), main input, main textarea, main select').length === 0,
      };
    });
    check(shape.h1s === 1 && shape.mains === 1 && !!shape.h1 && shape.h1 === shape.crumb, `${label}: one H1 in one main matching the breadcrumb`);
    check(shape.options === route.options && shape.headerCells === route.options + 1 && shape.rows > 0 && shape.rowsOk, `${label}: table shape does not match ${route.options} options`);
    check(JSON.stringify(shape.recommended) === JSON.stringify(shape.recommended.map((_, index) => index === shape.options - 1 && shape.options > 2)), `${label}: recommendation rule ${JSON.stringify(shape.recommended)}`);
    check(shape.faqs > 0 && shape.contactDisabled, `${label}: FAQs present and contact disabled`);
  };
  const tableScrolls = async (page, label) => {
    const region = page.locator('.cp-table-scroll');
    const [scrollWidth, clientWidth] = await region.evaluate(element => [element.scrollWidth, element.clientWidth]);
    if (scrollWidth <= clientWidth + 1) return false;
    await region.evaluate(element => { element.scrollLeft = 0; });
    await page.keyboard.press('Tab'); // keyboard modality before focusing the region
    await region.focus();
    check(await region.evaluate(element => element === document.activeElement && element.matches(':focus-visible')), `${label}: table region is not keyboard focusable with a visible focus`);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    // Smooth scrolling can start late on a loaded machine, so wait for movement
    // (up to 5 seconds) instead of reading once after a fixed delay.
    const moved = await region.evaluate(element => new Promise(done => {
      const started = performance.now();
      const read = () => element.scrollLeft > 0 || performance.now() - started > 5000 ? done(element.scrollLeft) : setTimeout(read, 50);
      read();
    }));
    check(moved > 0, `${label}: table region did not scroll from the keyboard`);
    return true;
  };
  await mkdir(evidenceDir, { recursive: true });

  // 3. Sweeps.
  for (const viewport of [phone, desktop, narrow]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page, { label: `sweep-${viewport.name}` });
    for (const route of routes) {
      state.errors.length = 0;
      const label = `${viewport.name}/${route.slug}`;
      check((await page.goto(route.url, { waitUntil: 'domcontentloaded' }))?.status() === 200, `${label}: status`);
      await structure(page, route, label);
      check(await noOverflow(page), `${label}: page overflow`);
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      await settleNetwork(page, label);
    }
    clean(state, `sweep-${viewport.name}`);
    sections.push(`sweep-${viewport.name}`);
    await closeContext(context, page, `sweep-${viewport.name}`);
  }

  // 4. Representatives.
  for (const route of representatives) {
    for (const viewport of [phone, desktop]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const label = `${viewport.name}/${route.slug}`;
      const state = await configurePage(page, { label });
      check((await page.goto(route.url, { waitUntil: 'networkidle' }))?.status() === 200, `${label}: status`);
      const faqs = page.locator('.cp-faq-list details');
      await faqs.nth(0).locator('summary').focus(); await page.keyboard.press('Enter');
      check(await faqs.nth(0).getAttribute('open') !== null && await faqs.nth(0).locator('.cp-faq-answer').isVisible(), `${label}: keyboard FAQ open`);
      if (await faqs.count() > 1) {
        await faqs.nth(1).locator('summary').focus(); await page.keyboard.press('Enter');
        check(await page.locator('.cp-faq-list details[open]').count() === 1 && await faqs.nth(1).getAttribute('open') !== null, `${label}: only one FAQ open at a time`);
      }
      await page.keyboard.press('Enter');
      check(await page.locator('.cp-faq-list details[open]').count() === 0, `${label}: keyboard FAQ close`);
      if (viewport.width < 1024) {
        const menu = page.locator('[data-mobile-menu]');
        await menu.locator('summary').focus(); await page.keyboard.press('Enter');
        check(await menu.getAttribute('open') !== null, `${label}: mobile menu did not open from keyboard`);
        await page.keyboard.press('Escape');
        check(await menu.getAttribute('open') === null, `${label}: Escape did not close the mobile menu`);
      }
      const scrolled = await tableScrolls(page, label);
      if (viewport === phone) check(scrolled, `${label}: table should overflow its region at 390px and scroll`);
      else check(!scrolled, `${label}: table should fit its region at 1440px`);
      const ratios = await contrast(page, contrastSelectors);
      const low = ratios.filter(item => item.ratio < 4.5);
      check(ratios.length >= 30 && low.length === 0, `${label}: contrast below 4.5 ${low.map(item => `${item.name} ${item.ratio.toFixed(2)}`).join(', ')}`);
      await screenshot(page, `${route.slug}-${viewport.name}-top.png`);
      await page.locator('.cp-options').screenshot({ path: resolve(evidenceDir, `${route.slug}-${viewport.name}-options.png`) });
      await page.locator('.cp-table-section').screenshot({ path: resolve(evidenceDir, `${route.slug}-${viewport.name}-table.png`) });
      evidence.push(`${route.slug}-${viewport.name}-options.png`, `${route.slug}-${viewport.name}-table.png`);
      check(await doubleText(page), `${label}: H1 did not double at 200% text`);
      await settle(page);
      check(await noOverflow(page), `${label}: page overflow at 200% text`);
      const clipped = await clippedText(page);
      check(clipped.length === 0, `${label}: clipped text at 200% ${clipped.join(', ')}`);
      await screenshot(page, `${route.slug}-${viewport.name}-200.png`);
      clean(state, label);
      await closeContext(context, page, label);
    }
  }
  sections.push('representatives');

  // 5. 320px with 200% text: the table is still usable inside its region.
  {
    const context = await browser.newContext({ viewport: narrow });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page, { label: 'table-320-200' });
    for (const route of representatives) {
      await page.goto(route.url, { waitUntil: 'networkidle' });
      check(await doubleText(page), `320-200/${route.slug}: H1 did not double`);
      await settle(page);
      check(await noOverflow(page), `320-200/${route.slug}: page overflow`);
      check(await tableScrolls(page, `320-200/${route.slug}`), `320-200/${route.slug}: table did not scroll inside its region`);
      await page.locator('.cp-table-section').screenshot({ path: resolve(evidenceDir, `${route.slug}-320-200-table.png`) });
      evidence.push(`${route.slug}-320-200-table.png`);
    }
    clean(state, 'table-320-200');
    sections.push('table-320-200');
    await closeContext(context, page, 'table-320-200');
  }

  // 6. Consent rejected: nothing loads, on two routes.
  {
    const context = await browser.newContext({ viewport: phone });
    const page = await context.newPage();
    const state = await configurePage(page, { label: 'consent-reject' });
    await page.goto(threeOption.url, { waitUntil: 'networkidle' });
    check(await page.locator('[data-cookie-banner]').isVisible(), 'consent-reject: notice shown without stored consent');
    await page.locator('[data-consent="reject"]').click();
    await page.keyboard.press('Shift');
    await delay(3200);
    await settleNetwork(page, 'consent-reject');
    await page.goto(twoOption.url, { waitUntil: 'networkidle' });
    check(await page.locator('[data-cookie-banner]').isHidden(), 'consent-reject: rejection persists');
    check(await page.evaluate(() => typeof window.gtag === 'undefined' && !Array.isArray(window.dataLayer)), 'consent-reject: gtag or dataLayer present');
    check(!state.external.some(isVendor), 'consent-reject: analytics vendor requested');
    clean(state, 'consent-reject');
    sections.push('consent-reject');
    await closeContext(context, page, 'consent-reject');
  }

  // 7. Consent accepted with stubbed vendors: exactly one comparison service_view.
  {
    const context = await browser.newContext({ viewport: phone });
    const page = await context.newPage();
    const vendorStub = { status: 200, contentType: 'text/javascript', body: 'window.__vendorStub=(window.__vendorStub||0)+1;' };
    const state = await configurePage(page, { label: 'consent-accept', vendorStub });
    await page.goto(twoOption.url, { waitUntil: 'networkidle' });
    check(!state.external.some(isVendor) && await page.evaluate(() => typeof window.gtag === 'undefined'), 'consent-accept: vendor loaded before the decision');
    await page.locator('[data-consent="accept"]').click();
    await page.keyboard.press('Shift');
    const fired = await page.waitForFunction(() => window.__vendorStub === 2 && Array.isArray(window.dataLayer) && [...window.dataLayer].some(entry => entry[0] === 'event'), null, { timeout: 5000 }).then(() => true, () => false);
    check(fired, 'consent-accept: vendors did not run or no event reached the queue');
    const events = await page.evaluate(() => [...(window.dataLayer ?? [])].map(entry => [...entry]).filter(entry => entry[0] === 'event'));
    check(events.length === 1 && events[0][1] === 'service_view' && events[0][2]?.event_category === 'engagement' && events[0][2]?.event_label === `comparison_${twoOption.slug}`, `consent-accept: gtag queue ${JSON.stringify(events)}`);
    clean(state, 'consent-accept', { vendors: true });
    sections.push('consent-accept');
    await closeContext(context, page, 'consent-accept');
  }

  // 8. JavaScript off.
  for (const route of representatives) {
    const context = await browser.newContext({ viewport: phone, javaScriptEnabled: false });
    const page = await context.newPage();
    const label = `no-js/${route.slug}`;
    const state = await configurePage(page, { label });
    check((await page.goto(route.url, { waitUntil: 'domcontentloaded' }))?.status() === 200, `${label}: status`);
    await structure(page, route, label);
    const visible = await page.locator('.cp-option, .cp-table td, .cp-verdict, .cp-content-copy p').evaluateAll(items => items.every(item => item.getClientRects().length > 0 && getComputedStyle(item).visibility !== 'hidden'));
    check(visible, `${label}: options, table cells, verdict and content visible`);
    const faqs = page.locator('.cp-faq-list details');
    await faqs.nth(0).locator('summary').click();
    check(await faqs.nth(0).getAttribute('open') !== null && await faqs.nth(0).locator('.cp-faq-answer').isVisible(), `${label}: native FAQ opens`);
    if (await faqs.count() > 1) {
      await faqs.nth(1).locator('summary').click();
      check(await faqs.nth(0).getAttribute('open') === null, `${label}: native FAQ keeps one open`);
    }
    check(await noOverflow(page), `${label}: overflow`);
    clean(state, label);
    await closeContext(context, page, label);
  }
  sections.push('no-js');

  // 9. Delayed fonts: fallback snapshot, release, then geometry must hold.
  for (const route of representatives) {
    for (const [viewport, doubled] of [[phone, false], [desktop, false], [narrow, true]]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const label = `delayed-font/${viewport.name}${doubled ? '-200' : ''}/${route.slug}`;
      let release;
      const fontGate = new Promise(done => { release = done; });
      const state = await configurePage(page, { label, fontGate });
      try {
        await page.goto(route.url, { waitUntil: 'domcontentloaded' });
        if (doubled) check(await doubleText(page), `${label}: H1 did not double`);
        await delay(150);
        await settle(page);
        const measure = () => page.evaluate(() => {
          const box = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height }; };
          return { h1: box('h1'), main: box('main'), table: box('.cp-table-scroll'), overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
        });
        const before = await measure();
        release();
        await page.evaluate(() => document.fonts.ready);
        await settleNetwork(page, label);
        await settle(page);
        const after = await measure();
        const deltas = Object.fromEntries(['h1', 'main', 'table'].map(key => [key, Math.max(...['x', 'y', 'width', 'height'].map(side => Math.abs(after[key][side] - before[key][side])))]));
        fontGeometry.push({ label, before, after, deltas });
        check(Object.values(deltas).every(delta => delta <= GEOMETRY_TOLERANCE_PX), `${label}: geometry moved after fonts loaded ${JSON.stringify(deltas)}`);
        check(!before.overflow && !after.overflow, `${label}: page overflow with fallback or loaded fonts`);
      } finally {
        release();
      }
      clean(state, label);
      await closeContext(context, page, label);
    }
  }
  sections.push('delayed-font');

  check(networkFailures.length === 0, `network: ${networkFailures.length} failed requests after all contexts closed ${formatRequestFailures(networkFailures)}`);
  const missing = REQUIRED_SECTIONS.filter(name => !sections.includes(name));
  check(missing.length === 0, `sections skipped: ${missing.join(', ')}`);
  if (failures.length) throw new Error(`${failures.length} comparison browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} comparison browser assertions passed across ${routes.length} fixture routes (sweeps at 390/1440/320; representatives ${threeOption.slug} and ${twoOption.slug}: keyboard FAQ, menu and table scrolling, contrast, 200% text; 320px 200% table; consent reject and accept; no-JS; delayed fonts)`);
} catch (error) {
  fatal = error;
} finally {
  if (browser) await browser.close().catch(error => { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; });
  await new Promise(done => server.close(done));
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'report.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), distDir: relative(projectDir, distDir), routes, representatives: representatives.map(route => route.slug), sections, assertions, failures, evidence, networkFailures, delayedFont: fontGeometry, error: fatal ? fatal.message : null }, null, 2)}\n`);
  if (fatal) { console.error(fatal.message); process.exitCode = 1; }
}
