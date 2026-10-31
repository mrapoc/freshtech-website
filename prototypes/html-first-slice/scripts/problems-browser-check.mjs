import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parse } from 'ultrahtml';
import { PROBLEM_MARKER, inspectMarker } from './lib/problem-inventory.mjs';
import { CLARITY_URL, CLOUDINARY_ORIGIN, GA_URL, classifyRequest, describeRequestFailure, formatRequestFailures } from './lib/problem-browser-network.mjs';
import { FIXTURE_CATEGORY_KEYS, FIXTURE_LOGO_COUNT, FIXTURE_REVIEW_COUNT, TESTIMONIALS_FIXTURE_ATTRIBUTE } from './lib/testimonial-fixture.mjs';
import { CALL_NOW_LABEL, CONTACT_HREF, EMERGENCY_SLUG, HERO_CALL_LABEL, PHONE_HREF, PRICING_HREF, PRICING_LABEL } from '../src/lib/problem-display.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';
import { GOOGLE_REVIEWS_URL } from '../src/lib/testimonial-display.mjs';

// Browser gate for the root-slug Problem family (ProblemPage.astro with the
// shared SourceTestimonials and SourceContact sections), derived from
// service-locations-browser-check.mjs. It only ever runs against a synthetic
// fixture build: PROBLEM_TEST_DIST names the dist emitted by the staged
// fixture project (stage-problem-fixture.mjs, npm ci, npm run build:fixture).
// Routes are discovered from the emitted HTML (the data-problem-page marker on
// the single <main>, parsed with ultrahtml), never from a hardcoded list or
// the generated data, and every discovered page must carry the reserved
// data-testimonials-fixture="true" attribute or the run aborts before a
// browser starts, so a real customer review can never be exercised here.
//   - every route at 390 / 1440 / 320: status, one H1 in one main, marker and
//     variant, fixture review / logo / filter structure, FAQ count, emergency
//     vs standard actions, disabled contact with no forms, overflow, errors;
//   - representatives slow-computers (standard) and ransomware-recovery
//     (emergency) at phone and desktop: keyboard single-open FAQ, keyboard
//     mobile menu / desktop nav, computed contrast, carousel filter / dots /
//     pause / focus pause, measured 200% text with no overflow or clipped
//     text, screenshots (top, reviews section, 200%);
//   - one real 8.2 s wait proving the 8 s rotation, then a second proving the
//     explicit pause stops it (no timer injection); reduced motion never arms;
//   - fresh consent: reject loads nothing before or after; accept with the
//     vendor scripts stubbed captures the exact gtag service_view label;
//   - JavaScript off: all reviews visible, native FAQ and menu usable;
//   - delayed fonts: both representatives at phone, desktop and 320 (320 at
//     measured 200% text) with every local font response held for 1 s and then
//     on an explicit gate until the fallback snapshot and CDP platform-font
//     capture complete, so the page is measured on the fallback face; H1, main
//     and page geometry must not move once document.fonts.ready resolves
//     (0.75px tolerance, never relaxed) and nothing may overflow. Per-node
//     before/after boxes, computed font metrics and painted fonts (header, main
//     and footer descendants, including the contact and footer headings) go to
//     the report as diagnosis only; the header is included because the 6px
//     main Y shift seen at 320/200% originates upstream of main. The CDP
//     capture must align with the page snapshot and must not fail for any
//     visible own-text node (hidden nodes may report an empty font list).
//     Problem's optional font aliases are expected to prevent the swap; a
//     shift here means the alias is missing or wrong.
// Owned read-only 127.0.0.1 server, explicit Chromium executable, sandbox on.
// Network boundary (scripts/lib/problem-browser-network.mjs, unit-tested): GET
// continues only on the exact served origin; Cloudinary and, under
// consent-accept only, the two exact vendor URLs are stubbed; everything else
// (any non-GET, any other origin including other 127.0.0.1 ports, https or
// localhost) is aborted. Every failed request of any cause, policy aborts
// included, is recorded per page and globally with method, URL, error text and
// the current route; each context waits for network idle before closing, and
// the run fails on any recorded failure, asserted once more after every
// context has closed so late teardown failures cannot slip through.
// The general fonts before/after regression remains a separate check.
// Screenshots are evidence only: focus is blurred, the scroll position is
// pinned instantly and two frames are allowed to settle before capture, and
// the reviews-section capture temporarily hides only the fixed header and
// skip link in the page under test (restored immediately afterwards). No
// product CSS changes are involved and no assertion depends on that hiding.
// Report: <evidence>/report.json plus PNG evidence; review text is never logged.
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
if (!process.env.PROBLEM_TEST_DIST) throw new Error('PROBLEM_TEST_DIST is required: the synthetic fixture dist built from scripts/stage-problem-fixture.mjs');
const distDir = resolve(process.env.PROBLEM_TEST_DIST);
if (!(await stat(distDir).catch(() => null))?.isDirectory()) throw new Error(`PROBLEM_TEST_DIST is not a directory: ${distDir}`);
const projectDir = resolve(import.meta.dirname, '..');
const evidenceDir = resolve(process.env.PROBLEM_EVIDENCE_DIR || resolve(projectDir, 'evidence', 'problem-browser'));
const STANDARD_SLUG = 'slow-computers';
const FILTER_COUNT = FIXTURE_CATEGORY_KEYS.length + 1;
const vendorHosts = new Set(['www.googletagmanager.com', 'www.google-analytics.com', 'analytics.google.com', 'www.clarity.ms', 'c.clarity.ms']);
const REQUIRED_SECTIONS = ['sweep-phone', 'sweep-desktop', 'sweep-320', 'representatives', 'rotation', 'reduced-motion', 'consent-reject', 'consent-accept', 'no-js', 'delayed-font'];
const FONT_DELAY_MS = 1000;
const FONT_FALLBACK_SETTLE_MS = 150;
const GEOMETRY_TOLERANCE_PX = 0.75;
const isVendor = href => vendorHosts.has(new URL(href).hostname);
const isCloudinary = href => new URL(href).origin === CLOUDINARY_ORIGIN;
const NETWORK_SETTLE_TIMEOUT_MS = 10000;

// 1. Discovery from the emitted HTML: marker-owned pages only, fixture-marked only.
const ELEMENT = 1;
const attrOf = (node, name) => { for (const [key, value] of Object.entries(node.attributes ?? {})) if (key.toLowerCase() === name) return typeof value === 'string' ? value : ''; return undefined; };
const findAll = (node, predicate, out = []) => { if (node.type === ELEMENT && predicate(node)) out.push(node); for (const child of node.children ?? []) findAll(child, predicate, out); return out; };
const routes = [];
const discoveryErrors = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
  const html = await readFile(resolve(entry.parentPath, entry.name), 'utf8');
  const { mains, marker, strayMarkers, emptyMarkers } = inspectMarker(html);
  if (marker === null && !strayMarkers && !emptyMarkers) continue;
  const label = route || '/';
  if (mains !== 1 || strayMarkers || emptyMarkers || marker !== route) { discoveryErrors.push(`${label}: invalid ${PROBLEM_MARKER} marker`); continue; }
  const document = parse(html);
  const main = findAll(document, node => (node.name ?? '').toLowerCase() === 'main')[0];
  const sections = findAll(document, node => attrOf(node, 'data-testimonials') !== undefined);
  if (sections.length !== 1 || attrOf(sections[0], TESTIMONIALS_FIXTURE_ATTRIBUTE) !== 'true') discoveryErrors.push(`${label}: testimonials section is not the synthetic fixture (${TESTIMONIALS_FIXTURE_ATTRIBUTE}="true")`);
  const variant = attrOf(main, 'data-variant');
  if (variant !== (route === EMERGENCY_SLUG ? 'emergency' : 'standard')) discoveryErrors.push(`${label}: data-variant ${variant} contradicts the emergency rule`);
  routes.push({ slug: route, variant });
}
if (!routes.length) discoveryErrors.push(`no ${PROBLEM_MARKER} pages found under ${distDir}; build the staged fixture first`);
const standard = routes.find(route => route.slug === STANDARD_SLUG);
const emergency = routes.find(route => route.slug === EMERGENCY_SLUG);
if (!standard || !emergency) discoveryErrors.push(`representatives ${STANDARD_SLUG} and ${EMERGENCY_SLUG} must both be emitted`);
if (discoveryErrors.length) throw new Error(`Refusing to start a browser:\n${discoveryErrors.join('\n')}`);
const representatives = [standard, emergency];

// 2. Owned read-only static server over the fixture dist.
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
// The footer's lazy Cyber Essentials badge frame loads after the first network
// idle and Chromium then swaps it into its own process, after which the main
// frame never reports networkidle again and every later settle times out (seen
// with Edge and Playwright's Chromium). This synthetic journey removes the frame
// as it is parsed, before it loads; every other route check stubs the badge.
const removeBadgeFrame = () => {
  if (window !== window.top) return;
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1 && node.matches('iframe.ce-badge')) node.remove();
  }))).observe(document, { childList: true, subtree: true });
};
const newContext = async options => {
  const context = await browser.newContext(options);
  await context.addInitScript(removeBadgeFrame);
  return context;
};
const phone = { name: 'phone', width: 390, height: 844 };
const desktop = { name: 'desktop', width: 1440, height: 1000 };
const narrow = { name: '320', width: 320, height: 844 };
const contrastSelectors = '.pb-breadcrumbs a, .pb-breadcrumbs [aria-current="page"], .pb-hero-copy, .pb-button, .pb-section-heading p, .pb-symptom-list li, .pb-card h3, .pb-card p, .pb-rich p, .pb-rich li, .pb-rich a, .pb-faq-list summary span, .pb-faq-answer p, .pb-final-copy, .source-testimonials-lead, .source-testimonials-filter, .source-testimonials-quote, .source-testimonials-name, .source-testimonials-company, .source-testimonials-pause, .source-testimonials-logos-title, .source-contact-lead, .source-contact-trust, .source-contact-switch a, .source-contact-label, .source-contact-value';

const failures = [];
const sections = [];
const evidence = [];
const delayedFontGeometry = [];
// Global collection of every failed request across every context (see configurePage).
const networkFailures = [];
let assertions = 0;
let fatal = null;
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  // options.label: context label attached to every recorded request failure.
  // options.vendorStub: explicit stub for the two exact vendor script URLs
  // (consent-accept only); without it those URLs are blocked like any other.
  // options.delayFonts: hold every local font response for FONT_DELAY_MS so the
  // page renders on the fallback face first (installed before navigation).
  // options.fontGate: an additional explicit promise every held font response
  // must also await (after the delay) before continuing, so the caller can keep
  // the fallback face in place until its BEFORE snapshot and CDP capture finish.
  // state.external lists only fulfilled external stubs; state.blocked lists
  // policy aborts; state.failed lists every failed request of any cause
  // (policy abort, network error, cancellation on navigation or close), each
  // also pushed to the global networkFailures list. Nothing is ignored.
  const configurePage = async (page, { label = 'page', vendorStub = null, delayFonts = false, fontGate = null } = {}) => {
    const state = { errors: [], external: [], blocked: [], failed: [], fonts: [] };
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
        const url = new URL(request.url());
        if (delayFonts && (request.resourceType() === 'font' || url.pathname.endsWith('.woff2'))) { state.fonts.push(url.pathname); await delay(FONT_DELAY_MS); if (fontGate) await fontGate; }
        return route.continue();
      }
      if (decision.action === 'fulfil') { state.external.push(request.url()); return route.fulfill(decision.stub); }
      state.blocked.push(`${request.method()} ${request.url()} (${decision.reason})`);
      return route.abort();
    });
    return state;
  };
  const networkClean = (state, label) => {
    check(state.blocked.length === 0, `${label}: blocked requests ${state.blocked.join(', ')}`);
    check(state.failed.length === 0, `${label}: failed requests ${formatRequestFailures(state.failed)}`);
  };
  const clean = (state, label) => {
    check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
    networkClean(state, label);
    check(state.external.every(isCloudinary), `${label}: unexpected external requests ${state.external.join(', ')}`);
  };
  // Expected loads must finish before teardown, so a cancelled in-flight request
  // can neither masquerade as a real failure nor hide one; the wait itself is asserted.
  const settleNetwork = async (page, label) => {
    const settled = await page.waitForLoadState('networkidle', { timeout: NETWORK_SETTLE_TIMEOUT_MS }).then(() => true, () => false);
    check(settled, `${label}: network did not settle within ${NETWORK_SETTLE_TIMEOUT_MS}ms`);
  };
  const closeContext = async (context, page, label) => { await settleNetwork(page, label); await context.close(); };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const settle = page => page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const contrast = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) => { const alpha = front.length > 3 ? front[3] : 1; return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha)); };
    const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return elements.filter(element => element.offsetParent !== null || getComputedStyle(element).position === 'fixed').map(element => {
      const layers = []; for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255]; for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = luminance(blend(channels(getComputedStyle(element).color), background));
      const behind = luminance(background); return (Math.max(foreground, behind) + .05) / (Math.min(foreground, behind) + .05);
    });
  });
  // 200% text: snapshot every computed size, then double each one explicitly.
  const doubleText = page => page.evaluate(() => {
    const elements = [document.body, ...document.body.querySelectorAll('*')];
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const h1 = document.querySelector('h1');
    const h1Before = parseFloat(getComputedStyle(h1).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return { h1Before, h1After: parseFloat(getComputedStyle(h1).fontSize) };
  });
  const checkDoubled = ({ h1Before, h1After }, label) => check(h1Before > 0 && Math.abs(h1After - h1Before * 2) <= .5, `${label}: H1 font size ${h1Before}px did not double (${h1After}px)`);
  // Text-bearing elements inside main whose own overflow clips content that no longer fits.
  const clippedText = page => page.evaluate(() => [...document.querySelectorAll('main *')].filter(element => {
    if (!element.getClientRects().length || !element.textContent.trim()) return false;
    const style = getComputedStyle(element);
    const clips = value => value === 'hidden' || value === 'clip';
    return (clips(style.overflowY) && element.scrollHeight > element.clientHeight + 1) || (clips(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
  }).map(element => element.className || element.tagName).slice(0, 5));
  const headingCheck = async (page, route, label) => {
    const heading = await page.evaluate(() => ({
      h1s: document.querySelectorAll('h1').length, mains: document.querySelectorAll('main').length,
      h1: document.querySelector('h1')?.textContent.trim(), crumb: document.querySelector('.pb-breadcrumbs [aria-current="page"]')?.textContent.trim(),
    }));
    check(heading.h1s === 1 && heading.mains === 1 && !!heading.h1 && heading.h1 === heading.crumb, `${label}: one H1 in one main matching the current breadcrumb`);
    check(await page.locator(`main[${PROBLEM_MARKER}="${route.slug}"][data-variant="${route.variant}"]`).count() === 1, `${label}: template marker and variant`);
  };
  const actionCheck = async (page, route, label) => {
    for (const [section, secondary] of [['.pb-hero', [PHONE_HREF, HERO_CALL_LABEL]], ['.pb-final', [PRICING_HREF, PRICING_LABEL]]]) {
      const links = await page.locator(`${section} .pb-actions a`).evaluateAll(anchors => anchors.map(anchor => [anchor.getAttribute('href'), anchor.textContent.trim()]));
      const ok = route.variant === 'emergency'
        ? links.length === 1 && links[0][0] === PHONE_HREF && links[0][1] === CALL_NOW_LABEL
        : links.length === 2 && links[0][0] === CONTACT_HREF && links[0][1].length > 0 && links[1][0] === secondary[0] && links[1][1] === secondary[1];
      check(ok, `${label}: ${section} actions for the ${route.variant} variant ${JSON.stringify(links)}`);
    }
    if (route.variant === 'emergency') check(await page.locator(`.pb-hero a[href="${CONTACT_HREF}"], .pb-hero a[href="${PRICING_HREF}"], .pb-final a[href="${CONTACT_HREF}"], .pb-final a[href="${PRICING_HREF}"]`).count() === 0, `${label}: emergency variant offers contact or pricing`);
  };
  const structureCheck = async (page, label) => {
    check(await page.locator('[data-testimonials-item]').count() === FIXTURE_REVIEW_COUNT && await page.locator('[data-testimonials-logo]').count() === FIXTURE_LOGO_COUNT && await page.locator('[data-testimonials-filter]').count() === FILTER_COUNT, `${label}: ${FIXTURE_REVIEW_COUNT} reviews, ${FIXTURE_LOGO_COUNT} logos, ${FILTER_COUNT} filters`);
    check(await page.locator('.pb-faq-list details').count() > 0, `${label}: FAQ count`);
    check(await page.locator('[data-contact-disabled]').count() === 1 && await page.locator('form:not([method="dialog"]), main input, main textarea, main select').count() === 0, `${label}: contact is the disabled preview with no forms`);
  };
  const waitEnhanced = async (page, label) => {
    const enhanced = await page.locator('.source-testimonials.is-enhanced').waitFor({ timeout: 5000 }).then(() => true, () => false);
    check(enhanced, `${label}: testimonials did not enhance`);
    return enhanced;
  };
  const activeIndex = page => page.locator('[data-testimonials-item].is-active').getAttribute('data-index');
  const liveState = page => page.locator('[data-testimonials-stack]').getAttribute('aria-live');
  const leaveSection = async page => { await page.mouse.move(1, 1); await page.evaluate(() => document.activeElement?.blur()); };
  const screenshot = async (target, name, options = {}) => { await target.screenshot({ path: resolve(evidenceDir, name), ...options }); evidence.push(name); };
  // Evidence-only capture prep: drop focus rings, pin the scroll position
  // instantly and let two frames settle so the PNG shows a stable layout.
  const settleTop = async page => {
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo({ top: 0, behavior: 'instant' }); });
    await settle(page);
  };
  // Evidence-only: the fixed header and skip link would overlay the reviews
  // section in a locator screenshot, so hide only those two for the capture
  // and restore them immediately. No product CSS is touched and nothing is
  // asserted while they are hidden.
  const OVERLAY_SELECTOR = 'body > header, header[data-site-header], .skip-link, a.skip-link';
  const screenshotWithoutOverlay = async (page, locator, name) => {
    await page.evaluate(selector => { for (const element of document.querySelectorAll(selector)) { element.dataset.evidenceHidden = element.style.visibility || ''; element.style.visibility = 'hidden'; } }, OVERLAY_SELECTOR);
    try {
      await settle(page);
      await screenshot(locator, name);
    } finally {
      await page.evaluate(selector => { for (const element of document.querySelectorAll(selector)) { element.style.visibility = element.dataset.evidenceHidden || ''; delete element.dataset.evidenceHidden; } }, OVERLAY_SELECTOR);
    }
  };
  const carouselCheck = async (page, label) => {
    const shown = page.locator('[data-testimonials-item]:not([hidden])');
    const active = page.locator('[data-testimonials-item].is-active');
    check(await page.locator('[data-testimonials-filters]').isVisible() && await page.locator('[data-testimonials-controls]').isVisible(), `${label}: carousel controls revealed`);
    check(await shown.count() === FIXTURE_REVIEW_COUNT && await active.count() === 1 && await active.isVisible() && await page.locator('[data-testimonials-item][aria-hidden="false"]').count() === 1, `${label}: all filter shows every review with one active`);
    const filter = page.locator('[data-testimonials-filter]').nth(1);
    const key = await filter.getAttribute('data-testimonials-filter');
    const expected = Number(await filter.locator('.source-testimonials-count').innerText());
    await filter.click();
    const narrowed = await shown.evaluateAll((items, category) => items.every(item => item.dataset.category === category), key);
    check(expected > 1 && expected < FIXTURE_REVIEW_COUNT && await filter.getAttribute('aria-pressed') === 'true' && await shown.count() === expected && narrowed && await active.count() === 1 && await page.locator('[data-testimonials-dot]:not([hidden])').count() === expected, `${label}: category filter narrows reviews and dots to ${expected}`);
    const dot = page.locator('[data-testimonials-dot]').nth(1);
    await dot.click();
    check(await dot.getAttribute('aria-current') === 'true' && await activeIndex(page) === await shown.nth(1).getAttribute('data-index'), `${label}: dot selects the second visible review`);
    const pause = page.locator('[data-testimonials-pause]');
    await pause.click();
    check(await pause.innerText() === 'Resume rotation' && await liveState(page) === 'polite', `${label}: explicit pause`);
    await pause.click();
    check(await pause.innerText() === 'Pause rotation', `${label}: explicit resume`);
    await page.locator('[data-testimonials-filter]').first().click();
    await leaveSection(page);
    check(await liveState(page) === 'off' && await shown.count() === FIXTURE_REVIEW_COUNT, `${label}: rotation armed once focus and pointer leave the section`);
    await page.locator('[data-testimonials-filter]').first().focus();
    check(await liveState(page) === 'polite', `${label}: keyboard focus inside the section pauses rotation`);
    await leaveSection(page);
    check(await liveState(page) === 'off', `${label}: rotation resumes when focus leaves`);
  };
  await mkdir(evidenceDir, { recursive: true });

  // 3. Route sweep at phone, desktop and 320px on every discovered route.
  for (const viewport of [phone, desktop, narrow]) {
    const context = await newContext({ viewport });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page, { label: `sweep-${viewport.name}` });
    for (const route of routes) {
      state.errors.length = 0;
      const label = `${viewport.name}/${route.slug}`;
      const response = await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      check(response?.status() === 200, `${label}: status`);
      await headingCheck(page, route, label);
      await structureCheck(page, label);
      await actionCheck(page, route, label);
      check(await noOverflow(page), `${label}: overflow`);
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      // Finish this route's loads before navigating on, so nothing is cancelled mid-flight.
      await settleNetwork(page, label);
    }
    clean(state, `sweep-${viewport.name}`);
    sections.push(`sweep-${viewport.name}`);
    await closeContext(context, page, `sweep-${viewport.name}`);
  }

  // 4. Representatives with JavaScript: keyboard, actions, contrast, carousel, 200% text, screenshots.
  for (const route of representatives) {
    for (const viewport of [phone, desktop]) {
      const context = await newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const label = `${viewport.name}/${route.slug}`;
      const state = await configurePage(page, { label });
      const response = await page.goto(route.url, { waitUntil: 'networkidle' });
      check(response?.status() === 200, `${label}: status`);
      await actionCheck(page, route, label);
      // Keyboard FAQ: Enter opens, opening another closes the first (shared name), Enter closes.
      const faqs = page.locator('.pb-faq-list details');
      const first = faqs.nth(0);
      await first.locator('summary').focus(); await page.keyboard.press('Enter');
      check(await first.getAttribute('open') !== null && await first.locator('.pb-faq-answer').isVisible(), `${label}: keyboard FAQ open`);
      if (await faqs.count() > 1) {
        await faqs.nth(1).locator('summary').focus(); await page.keyboard.press('Enter');
        check(await faqs.nth(1).getAttribute('open') !== null && await first.getAttribute('open') === null && await page.locator('.pb-faq-list details[open]').count() === 1, `${label}: only one FAQ open at a time`);
      }
      await page.keyboard.press('Enter');
      check(await page.locator('.pb-faq-list details[open]').count() === 0, `${label}: keyboard FAQ close`);
      if (viewport.width < 1024) {
        const menu = page.locator('[data-mobile-menu]');
        const summary = menu.locator('summary');
        await summary.focus(); await page.keyboard.press('Enter');
        check(await menu.getAttribute('open') !== null && await menu.locator('nav a').first().isVisible(), `${label}: mobile menu did not open from keyboard`);
        await page.keyboard.press('Escape');
        check(await menu.getAttribute('open') === null && await summary.evaluate(element => element === document.activeElement), `${label}: Escape did not close the mobile menu and restore focus`);
      } else {
        const firstLink = page.locator('.desktop-nav a').first();
        await firstLink.focus();
        check(await firstLink.isVisible() && await firstLink.evaluate(element => element === document.activeElement), `${label}: desktop navigation focus`);
      }
      const enhanced = await waitEnhanced(page, label);
      if (enhanced) await carouselCheck(page, label);
      const ratios = await contrast(page, contrastSelectors);
      check(ratios.length >= 20 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      // Active filter count badge: computed contrast (ancestors composited by
      // the same helper) in the normal, hovered and keyboard-focused states of
      // its pressed parent, so a hover background or focus outline on the pill
      // can never drop the badge text below 4.5:1. carouselCheck leaves the
      // first filter pressed with focus and pointer outside the section.
      if (enhanced) {
        const activeFilter = page.locator('[data-testimonials-filter][aria-pressed="true"]');
        const activeCount = '[data-testimonials-filter][aria-pressed="true"] .source-testimonials-count';
        check(await activeFilter.count() === 1 && await page.locator(activeCount).count() === 1, `${label}: exactly one pressed filter with a count badge`);
        const countState = async name => {
          const [ratio] = await contrast(page, activeCount);
          check(ratio !== undefined && ratio >= 4.5, `${label}: active count contrast (${name}) ${ratio === undefined ? 'not visible' : ratio.toFixed(2)}`);
        };
        await countState('normal');
        await activeFilter.hover();
        await settle(page);
        check(await activeFilter.evaluate(element => element.matches(':hover')), `${label}: pressed filter did not receive hover`);
        await countState('hover');
        await leaveSection(page);
        // The hover above put the browser in pointer modality, and a
        // programmatic .focus() does not switch it back, so :focus-visible
        // would not match. A real Tab keypress establishes keyboard modality
        // first; the assertion itself is unchanged.
        await page.keyboard.press('Tab');
        await activeFilter.focus();
        await settle(page);
        check(await activeFilter.evaluate(element => element === document.activeElement && element.matches(':focus-visible')), `${label}: pressed filter did not receive visible focus`);
        await countState('focus');
        await leaveSection(page);
      }
      await settleTop(page);
      await screenshot(page, `${route.slug}-${viewport.name}-top.png`, { fullPage: false });
      await screenshotWithoutOverlay(page, page.locator('[data-testimonials]'), `${route.slug}-${viewport.name}-reviews.png`);
      checkDoubled(await doubleText(page), label);
      await settle(page);
      check(await noOverflow(page), `${label}: overflow at 200% text`);
      const clipped = await clippedText(page);
      check(clipped.length === 0, `${label}: clipped text at 200% ${clipped.join(', ')}`);
      await settleTop(page);
      await screenshot(page, `${route.slug}-${viewport.name}-200.png`, { fullPage: false });
      clean(state, label);
      await closeContext(context, page, label);
    }
  }
  sections.push('representatives');

  // 5. Real rotation timing on the standard representative: the carousel opens
  // on the review Math.random picks (pinned high, so the last one) and links it
  // to Google; one 8.2 s wait proves the 8 s advance while unfocused and
  // unhovered; a second proves pause stops it.
  {
    const context = await newContext({ viewport: phone });
    await context.addInitScript(consentInit);
    await context.addInitScript(() => { Math.random = () => 0.9999; });
    const page = await context.newPage();
    const state = await configurePage(page, { label: 'rotation' });
    await page.goto(standard.url, { waitUntil: 'networkidle' });
    if (await waitEnhanced(page, 'rotation')) {
      check(await activeIndex(page) === String(FIXTURE_REVIEW_COUNT - 1), 'rotation: did not open on the randomly chosen review');
      check(await page.locator('[data-testimonials-item].is-active a').getAttribute('href') === GOOGLE_REVIEWS_URL, 'rotation: the active review does not link to the Google reviews');
      await leaveSection(page);
      await page.locator('[data-testimonials-filter]').first().click();
      await leaveSection(page);
      check(await activeIndex(page) === '0' && await liveState(page) === 'off', 'rotation: armed on the first review');
      await delay(8200);
      check(await activeIndex(page) === '1', 'rotation: review did not advance after 8 seconds');
      const pause = page.locator('[data-testimonials-pause]');
      await pause.click();
      await leaveSection(page);
      const paused = await activeIndex(page);
      check(await liveState(page) === 'polite' && await pause.innerText() === 'Resume rotation', 'rotation: pause did not stop the timer');
      await delay(8200);
      check(await activeIndex(page) === paused, 'rotation: review advanced while paused');
    }
    clean(state, 'rotation');
    sections.push('rotation');
    await closeContext(context, page, 'rotation');
  }

  // 6. Reduced motion: no autoplay at all, pause control withdrawn, reviews still reachable.
  {
    const context = await newContext({ viewport: phone, reducedMotion: 'reduce' });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page, { label: 'reduced-motion' });
    await page.goto(standard.url, { waitUntil: 'networkidle' });
    if (await waitEnhanced(page, 'reduced-motion')) {
      await leaveSection(page);
      check(await liveState(page) === 'polite' && await page.locator('[data-testimonials-pause]').isHidden(), 'reduced-motion: rotation armed under prefers-reduced-motion');
      check(await page.locator('[data-testimonials-item].is-active').count() === 1 && await page.locator('[data-testimonials-dot]:not([hidden])').count() === FIXTURE_REVIEW_COUNT, 'reduced-motion: manual review selection unavailable');
    }
    clean(state, 'reduced-motion');
    sections.push('reduced-motion');
    await closeContext(context, page, 'reduced-motion');
  }

  // 7. Fresh consent, rejected: no vendor request or gtag before or after, on both representatives.
  {
    const context = await newContext({ viewport: phone });
    const page = await context.newPage();
    const state = await configurePage(page, { label: 'consent-reject' });
    await page.goto(standard.url, { waitUntil: 'networkidle' });
    const banner = page.locator('[data-cookie-banner]');
    check(await banner.isVisible(), 'consent-reject: notice is shown without stored consent');
    await page.locator('[data-consent="reject"]').click();
    await settle(page);
    check(await banner.isHidden(), 'consent-reject: notice hides after rejection');
    await page.keyboard.press('Shift');
    await delay(3200);
    await settleNetwork(page, 'consent-reject');
    await page.goto(emergency.url, { waitUntil: 'networkidle' });
    check(await banner.isHidden(), 'consent-reject: rejection persists on the next route');
    check(await page.evaluate(() => typeof window.gtag === 'undefined' && !Array.isArray(window.dataLayer)), 'consent-reject: gtag or dataLayer present');
    check(!state.external.some(href => vendorHosts.has(new URL(href).hostname)), `consent-reject: analytics vendor requested ${state.external.join(', ')}`);
    clean(state, 'consent-reject');
    sections.push('consent-reject');
    await closeContext(context, page, 'consent-reject');
  }

  // 8. Fresh consent, accepted: vendor scripts stubbed, the bootstrap queue must hold exactly one service_view with the problem label.
  {
    const context = await newContext({ viewport: phone });
    const page = await context.newPage();
    const vendorStub = { status: 200, contentType: 'text/javascript', body: 'window.__vendorStub=(window.__vendorStub||0)+1;' };
    const state = await configurePage(page, { label: 'consent-accept', vendorStub });
    // state.external legitimately carries the stubbed Cloudinary logo requests from
    // the testimonials section, so vendor assertions count only vendorHosts. The
    // helper fulfils only the two exact vendor URLs with this stub; any other
    // vendor request is aborted and therefore recorded as a failure below.
    const vendorRequests = () => state.external.filter(isVendor);
    await page.goto(standard.url, { waitUntil: 'networkidle' });
    check(await page.locator('[data-cookie-banner]').isVisible() && vendorRequests().length === 0 && await page.evaluate(() => typeof window.gtag === 'undefined'), `consent-accept: something loaded before the decision ${vendorRequests().join(', ')}`);
    await page.locator('[data-consent="accept"]').click();
    check(await page.locator('[data-cookie-banner]').isHidden() && vendorRequests().length === 0, `consent-accept: accepting alone must not load vendors ${vendorRequests().join(', ')}`);
    await page.keyboard.press('Shift');
    const fired = await page.waitForFunction(() => window.__vendorStub === 2 && Array.isArray(window.dataLayer) && [...window.dataLayer].some(entry => entry[0] === 'event'), null, { timeout: 5000 }).then(() => true, () => false);
    check(fired, 'consent-accept: stubbed vendors did not run or no event reached the gtag queue');
    const events = await page.evaluate(() => [...(window.dataLayer ?? [])].map(entry => [...entry]).filter(entry => entry[0] === 'event'));
    check(events.length === 1 && events[0][1] === 'service_view' && events[0][2]?.event_category === 'engagement' && events[0][2]?.event_label === `problem_${standard.slug}`, `consent-accept: gtag queue ${JSON.stringify(events)}`);
    const vendors = vendorRequests();
    check(vendors.length === 2 && vendors.includes(GA_URL) && vendors.includes(CLARITY_URL), `consent-accept: vendor requests ${vendors.join(', ')}`);
    check(state.external.every(href => isCloudinary(href) || href === GA_URL || href === CLARITY_URL), `consent-accept: unexpected external requests ${state.external.filter(href => !isCloudinary(href) && href !== GA_URL && href !== CLARITY_URL).join(', ')}`);
    check(state.errors.length === 0, `consent-accept: browser errors ${state.errors.join('; ')}`);
    networkClean(state, 'consent-accept');
    sections.push('consent-accept');
    await closeContext(context, page, 'consent-accept');
  }

  // 9. JavaScript off on both representatives: every review visible, native FAQ and menu, actions.
  for (const route of representatives) {
    const context = await newContext({ viewport: phone, javaScriptEnabled: false });
    const page = await context.newPage();
    const label = `no-js/${route.slug}`;
    const state = await configurePage(page, { label });
    const response = await page.goto(route.url, { waitUntil: 'domcontentloaded' });
    check(response?.status() === 200, `${label}: status`);
    await headingCheck(page, route, label);
    await structureCheck(page, label);
    await actionCheck(page, route, label);
    const allVisible = await page.locator('[data-testimonials-item]').evaluateAll(items => items.every(item => item.getClientRects().length > 0 && getComputedStyle(item).visibility !== 'hidden' && getComputedStyle(item).opacity !== '0'));
    check(allVisible && await page.locator('[data-testimonials-filters]').isHidden() && await page.locator('[data-testimonials-controls]').isHidden(), `${label}: every review visible with the enhancement controls hidden`);
    const faqs = page.locator('.pb-faq-list details');
    await faqs.nth(0).locator('summary').click();
    check(await faqs.nth(0).getAttribute('open') !== null && await faqs.nth(0).locator('.pb-faq-answer').isVisible(), `${label}: native FAQ opens`);
    if (await faqs.count() > 1) {
      await faqs.nth(1).locator('summary').click();
      check(await faqs.nth(1).getAttribute('open') !== null && await faqs.nth(0).getAttribute('open') === null, `${label}: native FAQ keeps one open`);
    }
    const menu = page.locator('[data-mobile-menu]');
    await menu.locator('summary').click();
    check(await menu.getAttribute('open') !== null && await menu.locator('nav a').first().isVisible(), `${label}: native mobile menu opens`);
    await menu.locator('summary').click();
    check(await noOverflow(page), `${label}: overflow`);
    clean(state, label);
    await closeContext(context, page, label);
  }
  sections.push('no-js');

  // 10. Delayed fonts on both representatives at phone, desktop and 320 (the 320
  // run applies the existing doubleText helper first, so it is measured at 200%
  // text). Every local font response is held for FONT_DELAY_MS and then on an
  // explicit deferred gate, so the fallback face stays in place until the BEFORE
  // snapshot (DOMContentLoaded + FONT_FALLBACK_SETTLE_MS) and the CDP platform
  // font capture have both completed. The gate is then released and, after
  // document.fonts.ready and two frames, H1, main and document geometry must be
  // within GEOMETRY_TOLERANCE_PX of that snapshot and nothing may overflow.
  // Diagnosis (report only): every element under header, main and footer is
  // snapshotted before and after (tag / class / index, bounding box, computed
  // font-family / font-size / line-height, an own-text boolean, ancestor
  // chain), CSS.getPlatformFontsForNode is captured for every own-text node,
  // and the top 20 nodes by changed height / width / y are recorded with their
  // paired platform fonts. The header (and every descendant) comes first so the
  // upstream cause of the 6px main Y shift identified at 320/200% is captured.
  // The only assertions on the diagnosis are that the CDP node list aligns with
  // the page snapshot (mismatch null) and that no CDP font call failed for a
  // visible own-text node; hidden nodes may legitimately report an empty font
  // array. No text content is ever read into the report.
  const FONT_SNAPSHOT_SELECTOR = 'header, header *, main, main *, footer, footer *';
  const FONT_SNAPSHOT_RETAIN_LIMIT = 600;
  const FONT_SHIFT_TOP = 20;
  const snapshotNodes = page => page.evaluate(selector => {
    const round = value => Math.round(value * 1000) / 1000;
    const classOf = element => (typeof element.className === 'string' ? element.className.trim() : '');
    const describe = element => { const cls = classOf(element); return element.tagName.toLowerCase() + (cls ? `.${cls.split(/\s+/).join('.')}` : ''); };
    const ancestors = element => { const out = []; for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) out.push(describe(node)); return out; };
    return [...document.querySelectorAll(selector)].map((element, index) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        index, tag: element.tagName.toLowerCase(), class: classOf(element),
        box: [box.x, box.y, box.width, box.height].map(round),
        fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight,
        ownText: [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0),
        ancestors: ancestors(element),
      };
    });
  }, FONT_SNAPSHOT_SELECTOR);
  // CDP painted fonts for every own-text node in the snapshot, aligned by index:
  // DOM.querySelectorAll returns document order, the same order as the page-side
  // querySelectorAll, so nodeIds[i] is snapshot[i]. Only font names and glyph
  // counts are recorded, never text.
  const platformFonts = async (client, snapshot) => {
    const { root } = await client.send('DOM.getDocument', { depth: 0 });
    const { nodeIds } = await client.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: FONT_SNAPSHOT_SELECTOR });
    const fonts = new Array(snapshot.length).fill(null);
    // failed: own-text nodes whose CDP call rejected (distinct from a hidden
    // node that answers normally with an empty font array).
    const failed = [];
    if (nodeIds.length !== snapshot.length) return { fonts, failed, mismatch: { cdp: nodeIds.length, page: snapshot.length } };
    for (let index = 0; index < snapshot.length; index++) {
      if (!snapshot[index].ownText) continue;
      const result = await client.send('CSS.getPlatformFontsForNode', { nodeId: nodeIds[index] }).catch(() => null);
      if (!result) { failed.push(index); continue; }
      fonts[index] = result.fonts.map(font => ({ family: font.familyName, postScript: font.postScriptName, custom: font.isCustomFont, glyphs: font.glyphCount }));
    }
    return { fonts, failed, mismatch: null };
  };
  const visibleOwnText = (snapshot, index) => snapshot[index].ownText && snapshot[index].box[2] > 0 && snapshot[index].box[3] > 0;
  const nodeShifts = (beforeNodes, afterNodes, beforeFonts, afterFonts) => {
    const round = value => Math.round(value * 1000) / 1000;
    const count = Math.min(beforeNodes.length, afterNodes.length);
    const changes = [];
    for (let index = 0; index < count; index++) {
      const b = beforeNodes[index]; const a = afterNodes[index];
      const shift = { y: round(a.box[1] - b.box[1]), width: round(a.box[2] - b.box[2]), height: round(a.box[3] - b.box[3]) };
      const magnitude = Math.max(Math.abs(shift.y), Math.abs(shift.width), Math.abs(shift.height));
      if (magnitude === 0) continue;
      changes.push({
        magnitude, index, tag: b.tag, class: b.class, ownText: b.ownText, ancestors: b.ancestors, deltas: shift,
        before: { box: b.box, fontFamily: b.fontFamily, fontSize: b.fontSize, lineHeight: b.lineHeight, platformFonts: beforeFonts[index] },
        after: { box: a.box, fontFamily: a.fontFamily, fontSize: a.fontSize, lineHeight: a.lineHeight, platformFonts: afterFonts[index] },
      });
    }
    return { nodeCount: { before: beforeNodes.length, after: afterNodes.length }, changedCount: changes.length, top: changes.sort((x, y) => y.magnitude - x.magnitude).slice(0, FONT_SHIFT_TOP) };
  };
  const measureGeometry = page => page.evaluate(() => {
    const round = value => Math.round(value * 1000) / 1000;
    const rect = element => { if (!element) return null; const box = element.getBoundingClientRect(); return [box.x, box.y, box.width, box.height].map(round); };
    const root = document.documentElement;
    return {
      fontStatus: document.fonts.status,
      loadedFaces: [...document.fonts].filter(face => face.status === 'loaded').length,
      h1: rect(document.querySelector('h1')),
      main: rect(document.querySelector('main')),
      document: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, scrollHeight: root.scrollHeight },
    };
  });
  const withinTolerance = (before, after) => Array.isArray(before) && Array.isArray(after) && before.every((value, index) => Math.abs(after[index] - value) <= GEOMETRY_TOLERANCE_PX);
  const deltas = (before, after) => (Array.isArray(before) && Array.isArray(after) ? before.map((value, index) => Math.round((after[index] - value) * 1000) / 1000) : null);
  for (const route of representatives) {
    for (const viewport of [phone, desktop, narrow]) {
      const context = await newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      // Explicit deferred gate: held font responses stay pending (beyond the 1 s
      // delay) until releaseFonts() runs after the BEFORE snapshot and CDP capture.
      let releaseFonts = () => {};
      const fontGate = new Promise(resolveGate => { releaseFonts = resolveGate; });
      const label = `delayed-font/${viewport.name}/${route.slug}`;
      const state = await configurePage(page, { label, delayFonts: true, fontGate });
      const client = await context.newCDPSession(page);
      try {
        await client.send('DOM.enable');
        await client.send('CSS.enable');
        const response = await page.goto(route.url, { waitUntil: 'domcontentloaded' });
        check(response?.status() === 200, `${label}: status`);
        await delay(FONT_FALLBACK_SETTLE_MS);
        // 320 is measured at 200% text: double before the fallback snapshot so
        // both snapshots share the same scale (the gate still holds the fonts).
        let doubled = null;
        if (viewport === narrow) { doubled = await doubleText(page); checkDoubled(doubled, label); await settle(page); }
        const before = await measureGeometry(page);
        const overflowBefore = !(await noOverflow(page));
        const beforeNodes = await snapshotNodes(page);
        const beforeFonts = await platformFonts(client, beforeNodes);
        check(state.fonts.length > 0 && before.fontStatus === 'loading', `${label}: fallback snapshot was not taken while fonts were pending (${state.fonts.length} held, status ${before.fontStatus})`);
        releaseFonts();
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        const after = await measureGeometry(page);
        const overflowAfter = !(await noOverflow(page));
        const afterNodes = await snapshotNodes(page);
        const afterFonts = await platformFonts(client, afterNodes);
        check(after.fontStatus === 'loaded', `${label}: document.fonts did not settle (${after.fontStatus})`);
        check(beforeFonts.mismatch === null && afterFonts.mismatch === null, `${label}: CDP node list did not align with the page snapshot ${JSON.stringify({ before: beforeFonts.mismatch, after: afterFonts.mismatch })}`);
        const cdpFailed = [...beforeFonts.failed.filter(index => visibleOwnText(beforeNodes, index)).map(index => `before#${index}`), ...afterFonts.failed.filter(index => visibleOwnText(afterNodes, index)).map(index => `after#${index}`)];
        check(cdpFailed.length === 0, `${label}: CSS.getPlatformFontsForNode failed for visible own-text nodes ${cdpFailed.join(', ')}`);
        check(before.h1 !== null && before.main !== null, `${label}: H1 or main missing for geometry`);
        check(withinTolerance(before.h1, after.h1), `${label}: H1 moved after fonts loaded ${JSON.stringify(deltas(before.h1, after.h1))}`);
        check(withinTolerance(before.main, after.main), `${label}: main moved after fonts loaded ${JSON.stringify(deltas(before.main, after.main))}`);
        check(before.document.scrollWidth === after.document.scrollWidth && Math.abs(after.document.scrollHeight - before.document.scrollHeight) <= GEOMETRY_TOLERANCE_PX, `${label}: document size changed after fonts loaded (${before.document.scrollWidth}x${before.document.scrollHeight} to ${after.document.scrollWidth}x${after.document.scrollHeight})`);
        check(!overflowBefore && !overflowAfter, `${label}: overflow (fallback ${overflowBefore}, loaded ${overflowAfter})`);
        const shifts = nodeShifts(beforeNodes, afterNodes, beforeFonts.fonts, afterFonts.fonts);
        const retainFull = beforeNodes.length <= FONT_SNAPSHOT_RETAIN_LIMIT && afterNodes.length <= FONT_SNAPSHOT_RETAIN_LIMIT;
        const withFonts = (nodes, fonts) => nodes.map((node, index) => ({ ...node, platformFonts: fonts[index] }));
        delayedFontGeometry.push({
          label, slug: route.slug, viewport: viewport.name, textScale: doubled ? 2 : 1, doubled, fontDelayMs: FONT_DELAY_MS, fallbackSettleMs: FONT_FALLBACK_SETTLE_MS, tolerancePx: GEOMETRY_TOLERANCE_PX,
          gate: 'held until BEFORE snapshot and CDP capture completed, then released; awaited document.fonts.ready + 2 rAF',
          heldFonts: [...new Set(state.fonts)].sort(), before, after,
          deltas: { h1: deltas(before.h1, after.h1), main: deltas(before.main, after.main), scrollHeight: after.document.scrollHeight - before.document.scrollHeight },
          overflow: { fallback: overflowBefore, loaded: overflowAfter },
          nodeShifts: shifts,
          cdpMismatch: { before: beforeFonts.mismatch, after: afterFonts.mismatch },
          snapshots: retainFull ? { before: withFonts(beforeNodes, beforeFonts.fonts), after: withFonts(afterNodes, afterFonts.fonts) } : { retained: false, reason: `more than ${FONT_SNAPSHOT_RETAIN_LIMIT} nodes; see nodeShifts.top` },
        });
      } finally {
        releaseFonts();
        await client.detach().catch(() => {});
      }
      clean(state, label);
      await closeContext(context, page, label);
    }
  }
  sections.push('delayed-font');

  // Every context is closed: the global list also holds failures raised late
  // during teardown, after the per-context checks above already ran.
  check(networkFailures.length === 0, `network: ${networkFailures.length} failed requests after all contexts closed ${formatRequestFailures(networkFailures)}`);

  const missing = REQUIRED_SECTIONS.filter(name => !sections.includes(name));
  check(missing.length === 0, `sections skipped: ${missing.join(', ')}`);
  if (assertions === 0) failures.push('no assertions ran');
  if (failures.length) throw new Error(`${failures.length} problem browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} problem browser assertions passed across ${routes.length} fixture routes (390px/1440px/320px sweeps, representatives ${standard.slug} and ${emergency.slug}: keyboard FAQ and menu, actions, contrast, carousel, 200% text, real 8s rotation and pause, reduced motion, fresh-context reject and stubbed accept, phone no-JS, ${FONT_DELAY_MS}ms delayed fonts with ${GEOMETRY_TOLERANCE_PX}px geometry tolerance)`);
} catch (error) {
  fatal = error;
} finally {
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; }
  }
  await new Promise(resolveClose => server.close(resolveClose));
  await mkdir(evidenceDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(), distDir: relative(projectDir, distDir), evidenceDir: relative(projectDir, evidenceDir), fixtureAttribute: TESTIMONIALS_FIXTURE_ATTRIBUTE,
    routes: routes.map(({ slug, variant }) => ({ slug, variant })), representatives: representatives.map(route => route.slug),
    sections, assertions, failures, evidence, networkFailures, delayedFont: delayedFontGeometry, error: fatal ? fatal.message : null,
  };
  await writeFile(resolve(evidenceDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (fatal) { console.error(fatal.message); process.exitCode = 1; }
}
