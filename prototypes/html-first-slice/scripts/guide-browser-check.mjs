import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { trackSupersededAborts } from './lib/navigation-aborts.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

// Browser gate for the emitted /guides/[industry] family, derived from the
// industry and blog gates:
// - inventory: the validated generated guide data (every guide the extractor
//   found, no hardcoded count) must match the emitted guide directories
//   exactly before any browser starts; nested routes under a guide or a
//   /guides listing are rejected. Counts are derived from the data and
//   reported, so a new source guide enters the sweep automatically;
// - every guide route swept at 390px and 1440px: status, H1, canonical,
//   section and checklist counts (139 across the source), locked content
//   rendered visibly, no overflow, no serialised page data for a client
//   framework, source contact block in disabled mode, no browser errors;
// - the deterministic first guide exercised for its enhancements: Space on a
//   checkbox with progress/completion/reset, keyboard section toggle, TOC
//   into a collapsed section, initial legacy (bare source id) hash landing
//   under the sticky header, print buttons through a stubbed window.print;
// - phone no-JS: everything readable, dead controls hidden, native checkbox
//   and TOC still usable;
// - 320px and a real 200% per-element text enlargement (snapshot, double
//   once) with no document overflow and no clipped core text;
// - contrast measured at normal, hover and keyboard-focus states for priority
//   badges, tips and source contact links (values recorded, never assumed);
// - reduced motion leaves no visible transition or animation over 10ms;
// - consent: a fresh context with no stored decision (every other context
//   seeds a stored rejection) must show the banner, load no analytics vendor
//   after interaction plus the loader delay, and still load none after
//   Reject; the page experience itself is not altered for this check;
// - a real page.pdf (A4, preferCSSPageSize) with sections collapsed, plus a
//   print-media screenshot; every section body visible and chrome hidden in
//   print, collapsed state restored afterwards. Pagination of the PDF is
//   reviewed by a person on the PC packet; this gate records it as pending.
//
// Environment:
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH  required; chromiumSandbox stays on
//   PLAYWRIGHT_MODULE                    module specifier for playwright
//   GUIDE_DIST_DIR   root of the built site (default <project>/dist). Guide
//                    routes are served from <GUIDE_DIST_DIR>/guides/<slug>/.
//                    guide-output-check.mjs reads the same variable with the
//                    same meaning and appends /guides itself.
//   GUIDE_DATA_FILE  generated data module (default src/generated/guides-data.mjs)
//   GUIDE_EVIDENCE_DIR  report, screenshots and PDF (default evidence/guides-browser)
//
// Owned read-only static server (GET/HEAD, path-contained), explicit Chromium
// executable, sandbox on. Every non-local request is blocked and counted as a
// failure except the exact Cloudinary logo URLs the templates reference,
// which are answered with a local SVG. Nothing is written anywhere but the
// evidence directory.
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = process.env.GUIDE_DIST_DIR ? resolve(process.env.GUIDE_DIST_DIR) : resolve(projectDir, 'dist');
const dataFile = process.env.GUIDE_DATA_FILE ? resolve(process.env.GUIDE_DATA_FILE) : resolve(projectDir, 'src', 'generated', 'guides-data.mjs');
const evidenceDir = process.env.GUIDE_EVIDENCE_DIR ? resolve(process.env.GUIDE_EVIDENCE_DIR) : resolve(projectDir, 'evidence', 'guides-browser');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRIORITIES = ['critical', 'high', 'medium'];
// Analytics vendors the shared consent controller may load after opt-in. Any
// request to these hosts in the no-consent context is a failure, not a stub.
const VENDOR_HOSTS = new Set(['www.googletagmanager.com', 'www.google-analytics.com', 'analytics.google.com', 'www.clarity.ms', 'c.clarity.ms']);
// src/scripts/consent.ts LOAD_DELAY_MS, restated: the armed loader fires on
// first interaction or after this delay, so the no-consent wait must exceed it.
const CONSENT_LOAD_DELAY_MS = 3000;
// Exact image URL the guide print header references (the shared chrome logos are self-hosted).
const ALLOWED_CLOUDINARY = new Set([
  'https://res.cloudinary.com/djkmeg5se/image/upload/w_200,f_auto,q_auto/fresh-tech-logo.png',
]);
const stubImage = { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="72" />' };
// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));

// --- Data and inventory (fail before any browser work) --------------------------
const { guides } = await import(pathToFileURL(dataFile).href);
const bad = message => { throw new Error(`${dataFile}: ${message}`); };
if (!Array.isArray(guides) || guides.length === 0) bad('guides must be a non-empty array');
for (const guide of guides) {
  if (!SLUG.test(guide?.slug ?? '')) bad(`guide slug ${JSON.stringify(guide?.slug)} is not a safe route segment`);
  for (const field of ['industry', 'title']) if (typeof guide[field] !== 'string' || !guide[field]) bad(`${guide.slug}.${field} must be a non-empty string`);
  if (!Array.isArray(guide.sections) || guide.sections.length === 0) bad(`${guide.slug}.sections must be a non-empty array`);
  for (const section of guide.sections) {
    if (!SLUG.test(section?.id ?? '') || typeof section.title !== 'string' || typeof section.locked !== 'boolean' || !Array.isArray(section.checklist)) bad(`${guide.slug} section ${JSON.stringify(section?.id)} is malformed`);
    for (const check of section.checklist) if (!SLUG.test(check?.id ?? '') || !PRIORITIES.includes(check.priority)) bad(`${guide.slug} check ${JSON.stringify(check?.id)} is malformed`);
  }
}
if (new Set(guides.map(guide => guide.slug)).size !== guides.length) bad('duplicate guide slugs');
const checkTotal = guide => guide.sections.reduce((total, section) => total + section.checklist.length, 0);
const grandTotal = guides.reduce((total, guide) => total + checkTotal(guide), 0);
const sectionTotal = guides.reduce((total, guide) => total + guide.sections.length, 0);
if (grandTotal === 0) bad('the source has no checklist items at all; the data is not usable');

// Emitted inventory, discovered recursively: exactly one index.html per
// source slug, directly under /guides/<slug>/, nothing nested deeper, no
// /guides/index.html listing and no stray files.
const guidesDir = resolve(distDir, 'guides');
let entries;
try {
  entries = await readdir(guidesDir, { recursive: true, withFileTypes: true });
} catch (error) {
  throw new Error(`Emitted guide directory ${guidesDir} is not readable (${error.message}); build first or set GUIDE_DIST_DIR to the built site root`);
}
const emittedRoutes = [];
const strays = [];
for (const entry of entries) {
  if (!entry.isFile()) continue;
  const relativePath = relative(guidesDir, resolve(entry.parentPath, entry.name)).split(sep);
  if (relativePath.length === 2 && relativePath[1] === 'index.html') emittedRoutes.push(relativePath[0]);
  else strays.push(relativePath.join('/'));
}
if (strays.length) throw new Error(`Unexpected files under ${guidesDir}: ${strays.join(', ')} (a /guides listing, nested route or stray asset was emitted)`);
const expectedSlugs = guides.map(guide => guide.slug);
const missing = expectedSlugs.filter(slug => !emittedRoutes.includes(slug));
const unexpected = emittedRoutes.filter(slug => !expectedSlugs.includes(slug));
if (missing.length || unexpected.length) throw new Error(`Emitted guide inventory differs from source. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);
for (const entry of entries) {
  if (entry.isDirectory() && relative(guidesDir, resolve(entry.parentPath, entry.name)).split(sep).length > 1) throw new Error(`Nested directory under a guide route: ${relative(guidesDir, resolve(entry.parentPath, entry.name))}`);
}

// --- Owned read-only static server -----------------------------------------------
const contentTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') throw new Error('Read-only server');
    let pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolve(distDir, `.${pathname}`);
    if (file !== distDir && !file.startsWith(`${distDir}${sep}`)) throw new Error('Unsafe request path');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404); response.end('Not found');
  }
});
await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not start local static server');
const baseUrl = `http://127.0.0.1:${address.port}`;

const routes = guides.map(guide => ({ name: guide.slug, url: `${baseUrl}/guides/${guide.slug}/`, guide, total: checkTotal(guide) }));
const representative = routes[0];
const phone = { name: 'phone', width: 390, height: 844 };
const desktop = { name: 'desktop', width: 1440, height: 1000 };
const narrow = { name: 'narrow', width: 320, height: 844 };

const report = {
  generatedAt: new Date().toISOString(), distDir: relative(projectDir, distDir), dataFile: relative(projectDir, dataFile), guides: expectedSlugs, guideCount: guides.length, sectionTotal, checkTotal: grandTotal,
  inventory: 'Derived from the validated generated data; no expected count is hardcoded, so a new source guide enters this sweep automatically.',
  assertions: 0, failures: [], unexpectedRequests: [], contrast: {}, artifacts: [], consent: {}, landings: [], toggleDiagnostics: {},
  pdfVisualReview: { status: 'pending', note: 'The PDF artifact was produced with page.pdf (A4, preferCSSPageSize). Its pagination (one section per sheet, footer placement, no split checklist cards) is confirmed by rendering the pages on the PC packet; the print-media screenshot proves visibility and hidden chrome only.' },
};
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const check = (condition, message) => { report.assertions++; if (!condition) report.failures.push(message); };
  const artifact = async (name, page, options = {}) => {
    const path = resolve(evidenceDir, name);
    await page.screenshot({ path, fullPage: false, ...options });
    report.artifacts.push(name);
  };
  const routeRequests = (route, state) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1') {
      if (request.method() === 'GET' || request.method() === 'HEAD') return route.continue();
      state.unexpected.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (isBlockmarkBadge(url) && request.method() === 'GET') return route.fulfill(BLOCKMARK_STUB);
    if (ALLOWED_CLOUDINARY.has(url.href) && request.method() === 'GET') { state.stubbed.push(url.href); return route.fulfill(stubImage); }
    state.unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  };
  const configurePage = async page => {
    const state = { errors: [], unexpected: [], stubbed: [] };
    page.on('console', message => { if (message.type() === 'error') state.errors.push(message.text()); });
    page.on('pageerror', error => state.errors.push(error.message));
    const superseded = trackSupersededAborts(page);
    page.on('requestfailed', request => { if (new URL(request.url()).hostname === '127.0.0.1' && !superseded(request)) state.errors.push(`request failed ${request.url()}`); });
    await page.route('**/*', route => routeRequests(route, state));
    return state;
  };
  const openContext = async (viewport, options = {}, { seedConsent = true } = {}) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, ...options });
    if (seedConsent) await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page);
    return { context, page, state };
  };
  const finishState = (state, label) => {
    check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
    check(state.unexpected.length === 0, `${label}: unexpected requests ${state.unexpected.join(', ')}`);
    report.unexpectedRequests.push(...state.unexpected.map(entry => `${label}: ${entry}`));
  };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  // JS-enabled contexts only: rAF promises never resolve with javaScriptEnabled:false.
  const settle = page => page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  // Node-side polling, shared by the no-JS and JS checks: nothing below awaits
  // a page-side timer or frame. State is read with synchronous evaluate calls
  // and polled from Node under a finite deadline; on timeout the last
  // observation is returned so the failure can quote what was actually seen.
  const NOJS_DEADLINE_MS = 10_000;
  const NOJS_POLL_MS = 50;
  const pollUntil = async (read, done) => {
    const started = Date.now();
    let previous = null;
    for (;;) {
      const current = await read();
      if (done(current, previous)) return { ok: true, value: current, waitedMs: Date.now() - started };
      if (Date.now() - started >= NOJS_DEADLINE_MS) return { ok: false, value: current, waitedMs: Date.now() - started };
      previous = current;
      await delay(NOJS_POLL_MS);
    }
  };
  const sameBox = (a, b) => !!a && !!b && ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key] - b[key]) < .5);
  const inViewport = (box, viewport) => box.width > 0 && box.height > 0 && box.y >= 0 && box.x >= 0 && box.y + box.height <= viewport.height && box.x + box.width <= viewport.width;
  // Instant (non-smooth) scroll via synchronous evaluate, then poll the
  // bounding box from Node until it is unchanged across two reads and fully
  // inside the viewport.
  const stableBox = async (page, locator, viewport) => {
    await locator.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    return pollUntil(() => locator.boundingBox(), (box, prev) => sameBox(box, prev) && inViewport(box, viewport));
  };
  // Genuine pointer click: the box must be stable and visible, and the element
  // under the click point must be the target, one of its descendants, or (for a
  // checkbox) the label that controls it, which is the source's clickable row.
  const nativeClick = async (page, locator, viewport, label, description) => {
    const stable = await stableBox(page, locator, viewport);
    if (!stable.ok) { check(false, `${label}: ${description} did not reach a stable visible bounding box within ${NOJS_DEADLINE_MS}ms (last ${JSON.stringify(stable.value)})`); return false; }
    const x = stable.value.x + stable.value.width / 2;
    const y = stable.value.y + stable.value.height / 2;
    const hit = await locator.evaluate((element, point) => {
      const under = document.elementFromPoint(point.x, point.y);
      const ok = !!under && (element === under || element.contains(under) || (element instanceof HTMLInputElement && under instanceof HTMLLabelElement && under.control === element));
      return { ok, under: under ? `${under.tagName.toLowerCase()}${under.id ? `#${under.id}` : ''}${under.getAttribute('for') ? `[for=${under.getAttribute('for')}]` : ''}` : 'nothing' };
    }, { x, y });
    check(hit.ok, `${label}: ${description} at (${x.toFixed(1)}, ${y.toFixed(1)}) is covered by ${hit.under}`);
    if (!hit.ok) return false;
    await page.mouse.click(x, y);
    return true;
  };
  const isVisible = (page, selector) => page.locator(selector).evaluateAll(elements => elements.map(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'));
  const allVisible = async (page, selector) => { const states = await isVisible(page, selector); return states.length > 0 && states.every(Boolean); };
  const noneVisible = async (page, selector) => (await isVisible(page, selector)).every(state => !state);
  // Heading geometry relative to the sticky header: fully inside the viewport and below the header's bottom edge.
  const headingLanding = (page, sectionId) => page.evaluate(id => {
    const heading = document.querySelector(`#guide-section-${id} [data-guide-header] h2`);
    const header = document.querySelector('.site-header');
    const rect = heading.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, headerBottom: header ? header.getBoundingClientRect().bottom : 0, viewport: innerHeight, scrollY, focused: document.activeElement === heading, hash: location.hash };
  }, sectionId);
  const isLandedGeometry = geometry => geometry.top >= geometry.headerBottom - 1 && geometry.bottom <= geometry.viewport + 1;
  const landed = (geometry, label) => {
    check(isLandedGeometry(geometry), `${label}: heading at ${geometry.top.toFixed(1)}..${geometry.bottom.toFixed(1)} is not fully visible below the sticky header (header bottom ${geometry.headerBottom.toFixed(1)}, viewport ${geometry.viewport})`);
    check(geometry.focused, `${label}: focus did not move to the section heading`);
  };
  // JS contexts: the page's global smooth scroll animates past two rAF frames,
  // so the heading geometry is polled from Node under the same bounded deadline
  // until it is landed and unchanged across two reads. The test never scrolls
  // the page itself; on timeout the last observation is returned and the
  // unchanged landed() assertions report the actual geometry.
  const settledLanding = async (page, sectionId, label) => {
    const result = await pollUntil(() => headingLanding(page, sectionId), (geometry, prev) => !!prev && Math.abs(prev.top - geometry.top) < .5 && isLandedGeometry(geometry));
    report.landings.push({ label, settled: result.ok, waitedMs: result.waitedMs, geometry: result.value });
    return result.value;
  };
  // Section toggle state as the reader experiences it: ARIA, the hidden
  // attribute, computed display, the visible label text and focus placement.
  // renderedLabelText (innerText) and textTransform are diagnostics only:
  // they record what CSS text-transform did to the label so a false failure
  // caused by uppercase rendering is visible in the report. Assertions use
  // labelText (textContent), which is the DOM string the script sets.
  const toggleState = (page, sectionId) => page.evaluate(id => {
    const toggle = document.querySelector(`#guide-section-${id} [data-guide-toggle]`);
    const body = document.querySelector(`#guide-body-${id}`);
    const text = toggle?.querySelector('[data-guide-toggle-text]');
    return {
      ariaExpanded: toggle?.getAttribute('aria-expanded') ?? null,
      bodyHidden: body ? body.hidden : null,
      bodyDisplay: body ? getComputedStyle(body).display : null,
      labelText: text ? text.textContent.trim() : null,
      renderedLabelText: text ? text.innerText.trim() : null,
      textTransform: text ? getComputedStyle(text).textTransform : null,
      toggleFocused: !!toggle && document.activeElement === toggle,
    };
  }, sectionId);
  // Tick or untick a checkbox as a reader would: Space from the focused box or
  // a real pointer click on its label row. The resulting state is asserted.
  const tickByKeyboard = async (page, box, expected, label, description) => {
    await box.focus();
    check(await box.evaluate(element => element === document.activeElement), `${label}: ${description} did not take focus`);
    await page.keyboard.press('Space');
    const state = await pollUntil(() => box.isChecked(), checked => checked === expected);
    check(state.ok, `${label}: Space did not ${expected ? 'tick' : 'untick'} ${description} within ${NOJS_DEADLINE_MS}ms (checked ${state.value})`);
    return state.ok;
  };
  const tickByLabel = async (page, box, viewport, expected, label, description) => {
    const boxLabel = page.locator(`label[for="${await box.getAttribute('id')}"]`);
    if (!(await nativeClick(page, boxLabel, viewport, label, `${description} label`))) return false;
    const state = await pollUntil(() => box.isChecked(), checked => checked === expected);
    check(state.ok, `${label}: label click did not ${expected ? 'tick' : 'untick'} ${description} within ${NOJS_DEADLINE_MS}ms (checked ${state.value})`);
    return state.ok;
  };
  const contrast = (page, selector) => contrastOf(page.locator(selector));
  const contrastOf = locator => locator.evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) => { const alpha = front.length > 3 ? front[3] : 1; return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha)); };
    const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const ratio = (front, back) => { const a = luminance(front); const b = luminance(back); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
    return elements.filter(element => element.getClientRects().length > 0).map(element => {
      const layers = []; for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255]; for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const style = getComputedStyle(element);
      const text = ratio(blend(channels(style.color), background), background);
      // Focus indicator: outline colour against the surface behind the element (3:1 non-text minimum).
      const outlineWidth = parseFloat(style.outlineWidth) || 0;
      const outline = style.outlineStyle !== 'none' && outlineWidth > 0 ? ratio(blend(channels(style.outlineColor), background), background) : null;
      return { text: Number(text.toFixed(2)), outline: outline === null ? null : Number(outline.toFixed(2)), outlineWidth };
    });
  });
  const motionOver10ms = page => page.evaluate(() => {
    const seconds = value => value.split(',').map(part => part.trim().endsWith('ms') ? parseFloat(part) / 1000 : parseFloat(part)).filter(Number.isFinite);
    return [...document.body.querySelectorAll('*')].filter(element => element.getClientRects().length > 0).flatMap(element => {
      const style = getComputedStyle(element);
      return [...seconds(style.transitionDuration), ...seconds(style.animationDuration)].filter(duration => duration > .01).map(duration => `${element.tagName.toLowerCase()}.${[...element.classList].join('.')} ${duration}s`);
    });
  });
  // 200% text: fixed px rules ignore a root change, so every element's computed
  // size is snapshotted first and then doubled exactly once.
  const doubleText = page => page.evaluate(() => {
    const elements = [document.documentElement, ...document.body.querySelectorAll('*')];
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const h1 = document.querySelector('h1');
    const h1Before = parseFloat(getComputedStyle(h1).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return { h1Before, h1After: parseFloat(getComputedStyle(h1).fontSize) };
  });
  const CORE_TEXT = 'h1, .guide-hero-copy, .guide-intro, .guide-stats dd, .guide-stats dt, .guide-toc a, .guide-section-header h2, .guide-content h3, .guide-content p, .guide-content li, .guide-check-body label, .guide-tip, .guide-priority, .guide-cta h2, .guide-cta > p';
  const clippedCoreText = page => page.locator(CORE_TEXT).evaluateAll(elements => {
    const clipped = [];
    for (const element of elements) {
      const range = document.createRange(); range.selectNodeContents(element);
      const rects = [...range.getClientRects()];
      if (!rects.length) continue;
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const clipsX = ['hidden', 'clip'].includes(style.overflowX);
        const clipsY = ['hidden', 'clip'].includes(style.overflowY);
        if (!clipsX && !clipsY) continue;
        const clip = ancestor.getBoundingClientRect();
        if (rects.some(rect => (clipsX && (rect.left < clip.left - 1 || rect.right > clip.right + 1)) || (clipsY && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1)))) {
          clipped.push(`${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 40)}"`); break;
        }
      }
    }
    return clipped;
  });
  await mkdir(evidenceDir, { recursive: true });

  // 1. Route sweep: every guide at phone and desktop.
  for (const viewport of [phone, desktop]) {
    const { context, page, state } = await openContext(viewport);
    for (const route of routes) {
      state.errors.length = 0; state.unexpected.length = 0;
      const label = `${viewport.name}/${route.name}`;
      const { guide } = route;
      const response = await page.goto(route.url, { waitUntil: 'networkidle' });
      check(response?.status() === 200, `${label}: status ${response?.status()}`);
      check(await page.locator('h1').count() === 1 && (await page.locator('h1').innerText()).trim() === guide.title, `${label}: H1`);
      check(await page.locator('link[rel="canonical"]').evaluateAll(links => links.map(link => link.href)).then(hrefs => hrefs.length === 1 && hrefs[0] === `https://fresh-tech.uk/guides/${guide.slug}`), `${label}: canonical`);
      check(await page.locator(`main[data-guide-page="${guide.slug}"]`).count() === 1, `${label}: template marker`);
      check(await page.locator('[data-guide-section]').count() === guide.sections.length, `${label}: section count`);
      check(await page.locator('[data-guide-check]').count() === route.total, `${label}: checklist count ${route.total}`);
      const lockedSelector = '[data-guide-section][data-locked="true"] .guide-section-body';
      check(await page.locator(lockedSelector).count() === guide.sections.filter(section => section.locked).length, `${label}: locked section count`);
      check(await allVisible(page, lockedSelector) && await page.locator(`${lockedSelector} .guide-content`).evaluateAll(bodies => bodies.every(body => body.textContent.trim().length > 0)), `${label}: locked content is not rendered visibly`);
      check(await noOverflow(page), `${label}: overflow`);
      check(await page.evaluate(() => document.querySelectorAll('astro-island, [data-reactroot], script[type="application/json"]').length === 0 && ![...document.scripts].some(script => !script.src && script.type !== 'application/ld+json' && /"sections"\s*:/.test(script.textContent))), `${label}: serialised guide data or hydration markup present`);
      check(await page.locator('#contact [data-contact-disabled]').count() === 1 && await page.locator('#contact form, #contact input, #contact textarea, #contact select, #contact button').count() === 0, `${label}: source contact block is not in disabled mode`);
      check(await page.locator('[data-guide-actions]').isVisible() && await page.locator('[data-guide-progress]').isVisible(), `${label}: enhancements did not reveal print actions and progress`);
      finishState(state, label);
    }
    await context.close();
  }

  // 2. Representative first guide at desktop: enhancements by keyboard and pointer.
  {
    const { context, page, state } = await openContext(desktop);
    const { guide } = representative;
    const label = `desktop/${representative.name} interactions`;
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    await artifact(`${representative.name}-desktop-top.png`, page);
    const boxes = page.locator('[data-guide-check]');
    const progress = () => page.evaluate(() => ({
      count: document.querySelector('[data-guide-progress-count]').textContent,
      percent: document.querySelector('[data-guide-progress-percent]').textContent,
      value: document.querySelector('[data-guide-progress-bar]').value,
      max: document.querySelector('[data-guide-progress-bar]').max,
      complete: !document.querySelector('[data-guide-progress-complete]').hidden,
    }));
    // Space on the first checkbox.
    await boxes.first().focus(); await page.keyboard.press('Space');
    check(await boxes.first().isChecked(), `${label}: Space did not tick the first checkbox`);
    const onePercent = Math.round((1 / representative.total) * 100);
    check(JSON.stringify(await progress()) === JSON.stringify({ count: '1', percent: `${onePercent}%`, value: 1, max: representative.total, complete: false }), `${label}: progress after one tick ${JSON.stringify(await progress())}`);
    // Completion: every remaining box ticked by Space from the focused box, no
    // forced actionability. Reset: every box unticked through a real pointer
    // click on its label row (the source's clickable card), hit-tested first.
    for (let index = 1; index < representative.total; index++) await tickByKeyboard(page, boxes.nth(index), true, label, `checkbox ${index + 1}`);
    check(JSON.stringify(await progress()) === JSON.stringify({ count: String(representative.total), percent: '100%', value: representative.total, max: representative.total, complete: true }), `${label}: completion state ${JSON.stringify(await progress())}`);
    check(await page.locator('[data-guide-progress-complete]').isVisible() && (await page.locator('[data-guide-progress-complete]').innerText()).trim() === 'Complete!', `${label}: Complete! status not visible`);
    for (let index = 0; index < representative.total; index++) await tickByLabel(page, boxes.nth(index), desktop, false, label, `checkbox ${index + 1}`);
    check(JSON.stringify(await progress()) === JSON.stringify({ count: '0', percent: '0%', value: 0, max: representative.total, complete: false }), `${label}: reset state ${JSON.stringify(await progress())}`);

    // Keyboard section toggle on the first section. The actual state is
    // recorded before Enter, after Enter and after Space; the expected DOM
    // state is polled under the bounded deadline and the failure carries the
    // observed values.
    const first = guide.sections[0];
    const toggle = page.locator(`#guide-section-${first.id} [data-guide-toggle]`);
    const toggleDiagnostics = { beforeEnter: null, afterEnter: null, afterSpace: null };
    report.toggleDiagnostics[label] = toggleDiagnostics;
    await toggle.focus();
    toggleDiagnostics.beforeEnter = await toggleState(page, first.id);
    await page.keyboard.press('Enter');
    const collapsedState = await pollUntil(() => toggleState(page, first.id), state => state.ariaExpanded === 'false' && state.bodyHidden === true && state.bodyDisplay === 'none' && state.labelText === 'Show');
    toggleDiagnostics.afterEnter = { ...collapsedState.value, waitedMs: collapsedState.waitedMs };
    check(collapsedState.ok, `${label}: Enter did not collapse the first section within ${NOJS_DEADLINE_MS}ms (before ${JSON.stringify(toggleDiagnostics.beforeEnter)}, after ${JSON.stringify(collapsedState.value)})`);
    check(collapsedState.value.toggleFocused, `${label}: focus left the toggle after collapsing (${JSON.stringify(collapsedState.value)})`);
    await page.keyboard.press('Space');
    const expandedState = await pollUntil(() => toggleState(page, first.id), state => state.ariaExpanded === 'true' && state.bodyHidden === false && state.bodyDisplay !== 'none');
    toggleDiagnostics.afterSpace = { ...expandedState.value, waitedMs: expandedState.waitedMs };
    check(expandedState.ok && await page.locator(`#guide-body-${first.id}`).isVisible(), `${label}: Space did not re-expand the first section within ${NOJS_DEADLINE_MS}ms (${JSON.stringify(expandedState.value)})`);
    check(await page.locator('[data-guide-toggle]').evaluateAll(toggles => toggles.every(element => !element.hidden)), `${label}: toggles are not all revealed`);

    // TOC into a collapsed section (the last one, so the jump is real).
    const target = guide.sections[guide.sections.length - 1];
    await page.locator(`#guide-section-${target.id} [data-guide-toggle]`).click();
    check(await page.locator(`#guide-body-${target.id}`).isHidden(), `${label}: could not collapse the TOC target section`);
    await page.evaluate(() => scrollTo(0, 0));
    const tocLink = page.locator(`.guide-toc a[href="#guide-section-${target.id}"]`);
    await tocLink.focus(); await page.keyboard.press('Enter');
    const tocLanding = await settledLanding(page, target.id, `${label}: TOC`);
    check(tocLanding.hash === `#guide-section-${target.id}`, `${label}: TOC hash is ${tocLanding.hash}`);
    check(await page.locator(`#guide-section-${target.id} [data-guide-toggle]`).getAttribute('aria-expanded') === 'true' && await page.locator(`#guide-body-${target.id}`).isVisible(), `${label}: TOC did not reveal the collapsed target`);
    landed(tocLanding, `${label}: TOC`);
    check(await page.locator(`#guide-title-${target.id}`).getAttribute('tabindex') === '-1', `${label}: heading is not programmatically focusable`);

    // Print buttons: window.print stubbed in-page; beforeprint expands, afterprint restores.
    await page.locator(`#guide-section-${first.id} [data-guide-toggle]`).click();
    await page.evaluate(() => {
      window.__guidePrint = { calls: 0, expandedDuringPrint: null };
      addEventListener('beforeprint', () => { window.__guidePrint.expandedDuringPrint = [...document.querySelectorAll('[data-guide-toggle]')].map(toggle => toggle.getAttribute('aria-expanded')); });
      window.print = () => { window.__guidePrint.calls++; dispatchEvent(new Event('beforeprint')); dispatchEvent(new Event('afterprint')); };
    });
    const printButtons = page.locator('[data-guide-print]');
    check(await printButtons.count() === 2 && await allVisible(page, '[data-guide-print]'), `${label}: two visible print buttons`);
    await printButtons.nth(0).click(); await printButtons.nth(1).click();
    const printed = await page.evaluate(() => window.__guidePrint);
    check(printed.calls === 2, `${label}: window.print called ${printed.calls} times, expected 2`);
    check(Array.isArray(printed.expandedDuringPrint) && printed.expandedDuringPrint.length === guide.sections.length && printed.expandedDuringPrint.every(value => value === 'true'), `${label}: beforeprint did not expand every section (${JSON.stringify(printed.expandedDuringPrint)})`);
    check(await toggle.getAttribute('aria-expanded') === 'false' && await page.locator(`#guide-body-${first.id}`).isHidden(), `${label}: afterprint did not restore the collapsed section`);
    await toggle.click();
    finishState(state, label);
    await context.close();
  }

  // 3. Initial legacy hash (bare source id) and a legacy hashchange land the heading under the sticky header.
  {
    const { context, page, state } = await openContext(desktop);
    const { guide } = representative;
    const legacy = guide.sections[guide.sections.length - 1];
    const label = `desktop/${representative.name} legacy hash`;
    await page.goto(`${representative.url}#${legacy.id}`, { waitUntil: 'networkidle' });
    const initial = await settledLanding(page, legacy.id, `${label}: initial`);
    check(initial.scrollY > 0, `${label}: page did not scroll for #${legacy.id}`);
    check(initial.hash === `#${legacy.id}`, `${label}: hash was rewritten to ${initial.hash}`);
    landed(initial, `${label}: initial`);
    await artifact(`${representative.name}-desktop-legacy-hash.png`, page);
    const other = guide.sections[1] ?? guide.sections[0];
    await page.evaluate(() => scrollTo(0, 0));
    await page.evaluate(id => { location.hash = `#${id}`; }, other.id);
    landed(await settledLanding(page, other.id, `${label}: hashchange`), `${label}: hashchange`);
    finishState(state, label);
    await context.close();
  }

  // 4. Phone without JavaScript: everything readable, dead controls hidden, native checkbox and TOC.
  {
    const { context, page, state } = await openContext(phone, { javaScriptEnabled: false });
    const { guide } = representative;
    const label = `no-JS phone/${representative.name}`;
    const response = await page.goto(representative.url, { waitUntil: 'domcontentloaded' });
    check(response?.status() === 200, `${label}: status`);
    check(await page.locator('[data-guide-section]').count() === guide.sections.length && await allVisible(page, '.guide-section-body'), `${label}: every section body visible`);
    check(await allVisible(page, '[data-guide-section][data-locked="true"] .guide-section-body'), `${label}: locked sections visible`);
    check(await page.locator('.guide-checklist').count() === guide.sections.filter(section => section.checklist.length).length && await allVisible(page, '.guide-checklist'), `${label}: checklists visible`);
    check(await noneVisible(page, '[data-guide-actions], [data-guide-print], [data-guide-toggle], [data-guide-progress]'), `${label}: dead print/toggle controls or progress strip visible`);
    // Real pointer clicks, no force: the click point is hit-tested first and the
    // resulting state is read synchronously (a native checkbox toggles at once).
    const box = page.locator('[data-guide-check]').first();
    const boxLabel = page.locator(`label[for="${await box.getAttribute('id')}"]`);
    if (await nativeClick(page, box, phone, label, 'native checkbox')) check(await box.isChecked(), `${label}: native checkbox did not tick`);
    if (await nativeClick(page, boxLabel, phone, label, 'checkbox label')) check(!(await box.isChecked()), `${label}: label click did not untick the native checkbox`);
    const target = guide.sections[guide.sections.length - 1];
    const tocLink = page.locator(`.guide-toc a[href="#guide-section-${target.id}"]`);
    if (await nativeClick(page, tocLink, phone, label, 'native TOC link')) {
      // The native anchor jump may smooth-scroll; poll the heading geometry from
      // Node until the hash is set and the heading sits still under the header.
      const hasLanded = geometry => geometry.hash === `#guide-section-${target.id}` && geometry.top >= geometry.headerBottom - 1 && geometry.bottom <= geometry.viewport + 1;
      const landing = await pollUntil(() => headingLanding(page, target.id), (geometry, prev) => hasLanded(geometry) && !!prev && Math.abs(prev.top - geometry.top) < .5);
      check(landing.ok, `${label}: native TOC link did not land on the section within ${NOJS_DEADLINE_MS}ms (hash ${landing.value.hash}, top ${landing.value.top.toFixed(1)}, bottom ${landing.value.bottom.toFixed(1)}, header ${landing.value.headerBottom.toFixed(1)}, viewport ${landing.value.viewport})`);
    }
    check(await noOverflow(page), `${label}: overflow`);
    await page.evaluate(() => scrollTo(0, 0));
    await artifact(`${representative.name}-phone-nojs-top.png`, page);
    finishState(state, label);
    await context.close();
  }

  // 5. Phone screenshot, 320px and real 200% text: no overflow, no clipped core text.
  {
    const { context, page, state } = await openContext(phone);
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    check(await noOverflow(page), `phone/${representative.name}: overflow`);
    await artifact(`${representative.name}-phone-top.png`, page);
    finishState(state, `phone/${representative.name}`);
    await context.close();
  }
  {
    const { context, page, state } = await openContext(narrow);
    const label = `320px/${representative.name}`;
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    check(await noOverflow(page), `${label}: overflow`);
    const clippedBefore = await clippedCoreText(page);
    check(clippedBefore.length === 0, `${label}: clipped core text ${clippedBefore.join(', ')}`);
    await artifact(`${representative.name}-narrow-top.png`, page);
    const scale = await doubleText(page);
    await settle(page);
    check(scale.h1Before > 0 && Math.abs(scale.h1After - scale.h1Before * 2) <= .5, `${label}: H1 ${scale.h1Before}px did not double (${scale.h1After}px)`);
    check(await noOverflow(page), `${label}: overflow at 200% text`);
    const clippedAfter = await clippedCoreText(page);
    check(clippedAfter.length === 0, `${label}: clipped core text at 200% ${clippedAfter.join(', ')}`);
    check(await allVisible(page, '.guide-priority') && await allVisible(page, '.guide-check-body label'), `${label}: checklist labels or badges lost at 200%`);
    await artifact(`${representative.name}-narrow-200.png`, page);
    await page.locator('.guide-checklist').first().scrollIntoViewIfNeeded();
    await artifact(`${representative.name}-narrow-200-checklist.png`, page);
    finishState(state, label);
    await context.close();
  }

  // 6. Contrast at normal, hover and keyboard-focus states. Every value is
  // measured from computed styles and recorded; a group with no measurement
  // fails rather than passing silently.
  {
    const { context, page, state } = await openContext(desktop);
    const label = `desktop/${representative.name} contrast`;
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    const groups = {
      priorityCritical: '.guide-check[data-priority="critical"] .guide-priority',
      priorityHigh: '.guide-check[data-priority="high"] .guide-priority',
      priorityMedium: '.guide-check[data-priority="medium"] .guide-priority',
      tip: '.guide-tip', tipLabel: '.guide-tip span',
      contactValue: '.source-contact-value', contactSwitch: '.source-contact-switch a', contactLabel: '.source-contact-label', contactDisabledLinks: '[data-contact-disabled] a',
      checkLabel: '.guide-check-body label', content: '.guide-content p, .guide-content li', tocLink: '.guide-toc a', heroCopy: '.guide-hero-copy', eyebrow: '.guide-eyebrow-light', breadcrumb: '.guide-breadcrumb a',
      secondaryButton: '.guide-secondary-button', progressText: '.guide-progress-text', relatedLink: '.guide-related-grid a',
    };
    const measured = {};
    for (const [name, selector] of Object.entries(groups)) {
      const values = await contrast(page, selector);
      measured[name] = { state: 'normal', selector, count: values.length, min: values.length ? Math.min(...values.map(value => value.text)) : null };
      check(values.length > 0, `${label}: nothing measured for ${name}`);
      check(values.every(value => value.text >= 4.5), `${label}: ${name} text contrast ${values.map(value => value.text).join(',')}`);
    }
    // Hover: pointer over each link kind, then measure the hovered element.
    const hovered = {};
    for (const [name, selector] of Object.entries({ tocLink: '.guide-toc a', contactValue: '.source-contact-value', contactSwitch: '.source-contact-switch a', relatedLink: '.guide-related-grid a', checkCard: '.guide-check', toggle: '[data-guide-toggle]', breadcrumb: '.guide-breadcrumb a', secondaryButton: '.guide-secondary-button' })) {
      const element = page.locator(selector).first();
      await element.scrollIntoViewIfNeeded(); await element.hover(); await settle(page);
      const values = await contrastOf(name === 'checkCard' ? element.locator('label') : element);
      hovered[name] = { selector, count: values.length, text: values[0]?.text ?? null };
      check(values.length === 1 && values[0].text >= 4.5, `${label}: hover ${name} contrast ${values[0]?.text}`);
    }
    // Keyboard focus: reach each link with Tab so :focus-visible applies, then
    // measure text and outline (3:1 non-text minimum, at least 2px wide).
    const focused = {};
    for (const [name, selector] of Object.entries({ contactValue: '.source-contact-value', contactSwitch: '.source-contact-switch a', tocLink: '.guide-toc a', checkbox: '[data-guide-check]', toggle: '[data-guide-toggle]' })) {
      const element = page.locator(selector).first();
      await element.evaluate(node => { const helper = document.createElement('button'); helper.setAttribute('data-focus-helper', ''); node.parentElement.insertBefore(helper, node); helper.focus(); });
      await page.keyboard.press('Tab');
      await page.evaluate(() => document.querySelector('[data-focus-helper]')?.remove());
      const isTarget = await element.evaluate(node => node === document.activeElement && node.matches(':focus-visible'));
      // The checkbox's indicator is drawn on its card (.guide-check:has(:focus-visible)).
      const values = await contrastOf(name === 'checkbox' ? element.locator('xpath=ancestor::li[1]') : element);
      const value = values[0];
      focused[name] = { selector, focusVisible: isTarget, text: value?.text ?? null, outline: value?.outline ?? null, outlineWidth: value?.outlineWidth ?? null };
      check(isTarget, `${label}: Tab did not give ${name} keyboard focus`);
      check(!!value && value.text >= 4.5, `${label}: focused ${name} text contrast ${value?.text}`);
      check(!!value && value.outline !== null && value.outline >= 3 && value.outlineWidth >= 2, `${label}: focused ${name} indicator outline ${value?.outline} at ${value?.outlineWidth}px (need >=3:1 and >=2px)`);
    }
    report.contrast = { normal: measured, hover: hovered, focus: focused, method: 'Computed color over blended ancestor backgrounds (alpha-composited); outline colour against the same background. Gradients and images are not sampled; the guide surfaces measured are flat colours.' };
    finishState(state, label);
    await context.close();
  }

  // 7. Reduced motion: no visible transition or animation over 10ms.
  {
    const { context, page, state } = await openContext(phone, { reducedMotion: 'reduce' });
    const label = `reduced-motion phone/${representative.name}`;
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    const motion = await motionOver10ms(page);
    check(motion.length === 0, `${label}: motion retained on ${motion.slice(0, 5).join('; ')}`);
    await tickByKeyboard(page, page.locator('[data-guide-check]').first(), true, label, 'first checkbox');
    const motionAfter = await motionOver10ms(page);
    check(motionAfter.length === 0, `${label}: motion retained after ticking a checkbox ${motionAfter.slice(0, 5).join('; ')}`);
    finishState(state, label);
    await context.close();
  }

  // 8. Consent: a fresh context with no stored decision. The banner must
  // appear, no vendor may load after interaction plus the loader delay, and
  // Reject must leave it that way. Only observation and the visitor's own
  // Reject click; nothing else about the page is altered.
  {
    const { context, page, state } = await openContext(desktop, {}, { seedConsent: false });
    const label = `no-consent desktop/${representative.name}`;
    const vendorRequests = [];
    page.on('request', request => { if (VENDOR_HOSTS.has(new URL(request.url()).hostname)) vendorRequests.push(request.url()); });
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    check(await page.evaluate(() => localStorage.getItem('ft-cookie-consent-v1')) === null, `${label}: context unexpectedly carries a stored consent decision`);
    const banner = page.locator('[data-cookie-banner]');
    check(await banner.count() === 1 && await banner.isVisible(), `${label}: cookie banner did not appear without a stored decision`);
    check(await page.locator('[data-consent="reject"]').isVisible() && await page.locator('[data-consent="accept"]').isVisible(), `${label}: banner Accept/Reject controls not visible`);
    // Interaction (pointer on page body, scroll, key) then more than the loader delay.
    await page.mouse.click(5, 5);
    await page.mouse.wheel(0, 200);
    await page.keyboard.press('Shift');
    await delay(CONSENT_LOAD_DELAY_MS + 500);
    check(vendorRequests.length === 0, `${label}: analytics vendor requested with no decision: ${vendorRequests.join(', ')}`);
    check(await banner.isVisible(), `${label}: banner disappeared before any decision`);
    await page.locator('[data-consent="reject"]').click();
    await page.waitForLoadState('networkidle');
    check(await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('ft-cookie-consent-v1')).analytics === false; } catch { return false; } }), `${label}: Reject did not store a denial`);
    check(!(await banner.isVisible()), `${label}: banner still visible after Reject`);
    await page.mouse.click(5, 5);
    await delay(CONSENT_LOAD_DELAY_MS + 500);
    check(vendorRequests.length === 0, `${label}: analytics vendor requested after Reject: ${vendorRequests.join(', ')}`);
    report.consent = { route: representative.name, bannerShown: true, loaderDelayWaitedMs: CONSENT_LOAD_DELAY_MS + 500, vendorRequests };
    finishState(state, label);
    await context.close();
  }

  // 9. Print: real PDF with sections collapsed, print-media screenshot, restored state.
  {
    const { context, page, state } = await openContext(desktop);
    const { guide } = representative;
    const label = `print/${representative.name}`;
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    const collapsed = [guide.sections[0].id, guide.sections[guide.sections.length - 1].id];
    for (const id of collapsed) await page.locator(`#guide-section-${id} [data-guide-toggle]`).click();
    check((await isVisible(page, collapsed.map(id => `#guide-body-${id}`).join(', '))).every(state => !state), `${label}: sections did not collapse before printing`);
    await page.emulateMedia({ media: 'print' });
    await settle(page);
    check(await allVisible(page, '.guide-section-body') && await allVisible(page, '.guide-content'), `${label}: a collapsed section body is not visible in print media`);
    check(await noneVisible(page, '.site-header, .site-footer, .prototype-banner, .skip-link, .cookie-banner, .cookie-settings, [data-guide-actions], [data-guide-toggle], [data-guide-progress], .guide-cta-actions, .guide-related, .guide-breadcrumb'), `${label}: page chrome or enhancement controls visible in print media`);
    check(await allVisible(page, '.guide-print-header, .guide-print-footer, .guide-print-contact'), `${label}: print header, footer or contact line missing in print media`);
    await artifact(`${representative.name}-print-media.png`, page, { fullPage: true });
    const pdfPath = resolve(evidenceDir, `${representative.name}-print.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4', preferCSSPageSize: true, printBackground: true });
    report.artifacts.push(`${representative.name}-print.pdf`);
    const pdfHead = (await readFile(pdfPath)).subarray(0, 5).toString('latin1');
    check(pdfHead === '%PDF-' && (await stat(pdfPath)).size > 1024, `${label}: PDF artifact is empty or not a PDF`);
    await page.emulateMedia({ media: null });
    await settle(page);
    // Whether or not Chromium dispatched beforeprint/afterprint for the PDF
    // export, the reader's collapsed set must be intact afterwards.
    const restored = await page.evaluate(ids => ids.map(id => ({ expanded: document.querySelector(`#guide-section-${id} [data-guide-toggle]`).getAttribute('aria-expanded'), hidden: document.querySelector(`#guide-body-${id}`).hidden })), collapsed);
    check(restored.every(entry => entry.expanded === 'false' && entry.hidden), `${label}: collapsed state not restored after print ${JSON.stringify(restored)}`);
    check(await allVisible(page, guide.sections.filter(section => !collapsed.includes(section.id)).map(section => `#guide-body-${section.id}`).join(', ')), `${label}: an open section was hidden by the print cycle`);
    finishState(state, label);
    await context.close();
  }
} finally {
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; }
  }
  await new Promise(resolveClose => server.close(resolveClose));
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

if (report.failures.length) {
  process.exitCode = 1;
  throw new Error(`${report.failures.length} guide browser failures across ${report.assertions} assertions:\n${report.failures.join('\n')}`);
}
console.log(`${report.assertions} guide browser assertions passed across ${routes.length} guide routes, ${sectionTotal} sections and ${grandTotal} checklist items (390px/1440px sweeps, ${representative.name} enhancements by keyboard, legacy hash landing, phone no-JS, 320px + 200% text, contrast normal/hover/focus, reduced motion, no-consent banner + vendor silence, A4 PDF + print media). PDF pagination visual review: pending. Evidence in ${evidenceDir}`);
