import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { inspectMarker } from './lib/problem-inventory.mjs';
import { classifyRequest, describeRequestFailure, formatRequestFailures } from './lib/problem-browser-network.mjs';
import { PROOF_ENDPOINT_STUB, isProofEndpointRequest } from './lib/proof-endpoints.mjs';
import { assessNoJsForms } from './lib/standalone-forms.mjs';

// Browser gate for native standalone pages (StandaloneShell.astro), discovered by
// the data-standalone-page marker in the canonical dist (STANDALONE_TEST_DIST,
// default dist). Contrast and 390/1440 overflow for every route are already
// covered by quality-browser-check.mjs; this gate adds, for every standalone route:
//   - 320px with measured 200% text: one H1, no page overflow, no clipped text;
//   - JavaScript off: native disclosures open, no overflow, and no form that could
//     submit anywhere: only the in-browser email checker form and, on a
//     production build, the shared contact form are allowed, and the contact
//     form must be inert (disabled submit, noscript note, Enter posts nothing);
//   - keyboard: the first disclosure has visible focus and toggles with Enter;
//   - delayed fonts at 390px and 320px/200%: H1 and main must not move;
//   - review pools ([data-review-pool], at least one route): without JavaScript
//     the first review in each slot shows; with it a random one per slot shows
//     (Math.random pinned per run) and the pool height matches the no-JS height
//     at 320px, 390px and 1440px, so the swap cannot shift the layout; every
//     visible review links to the Google reviews with visible keyboard focus,
//     hidden ones cannot take focus, and no card overflows.
// Owned 127.0.0.1 server, sandboxed Chromium, the shared network policy (served
// origin only; Cloudinary images stubbed; everything else aborted and recorded).
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(process.env.STANDALONE_TEST_DIST || resolve(projectDir, 'dist'));
const evidenceDir = resolve(process.env.STANDALONE_EVIDENCE_DIR || resolve(projectDir, 'evidence', 'standalone-browser'));
const MARKER = 'data-standalone-page';
const REQUIRED_SECTIONS = ['text-200', 'no-js', 'keyboard', 'delayed-font', 'review-pool'];
const GOOGLE_REVIEWS_URL = 'https://search.google.com/local/reviews?placeid=ChIJ6a1VcjVqcEgR2_jkYe5Em5A';

const routes = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
  const { mains, marker, strayMarkers, emptyMarkers } = inspectMarker(await readFile(resolve(entry.parentPath, entry.name), 'utf8'), MARKER);
  if (marker === null && !strayMarkers && !emptyMarkers) continue;
  if (mains !== 1 || strayMarkers || emptyMarkers || route !== marker) throw new Error(`/${route}: invalid ${MARKER} marker`);
  routes.push(route);
}
routes.sort();
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
    const state = { errors: [], blocked: [], nonGet: [] };
    page.on('console', message => { if (message.type() === 'error') state.errors.push(message.text()); });
    page.on('pageerror', error => state.errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') state.nonGet.push(`${request.method()} ${request.url()}`); });
    page.context().on('requestfailed', request => networkFailures.push({ label, ...describeRequestFailure({ method: request.method(), url: request.url(), errorText: request.failure()?.errorText, pageUrl: page.url(), baseOrigin: baseUrl }) }));
    await page.route('**/*', async route => {
      const request = route.request();
      if (isProofEndpointRequest({ method: request.method(), url: request.url(), baseOrigin: baseUrl })) return route.fulfill(PROOF_ENDPOINT_STUB);
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
  const doubleText = page => page.evaluate(() => {
    const elements = [document.body, ...document.body.querySelectorAll('*')];
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const before = parseFloat(getComputedStyle(document.querySelector('h1')).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return Math.abs(parseFloat(getComputedStyle(document.querySelector('h1')).fontSize) - before * 2) <= .5;
  });
  await mkdir(evidenceDir, { recursive: true });

  // 1. Every route at 320px with measured 200% text.
  {
    const context = await browser.newContext({ viewport: narrow });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configure(page, 'text-200');
    for (const route of routes) {
      const label = `320-200/${route}`;
      check((await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' }))?.status() === 200, `${label}: status`);
      check(await page.evaluate(() => document.querySelectorAll('h1').length === 1 && document.querySelectorAll('main').length === 1), `${label}: one H1 in one main`);
      check(await doubleText(page), `${label}: H1 did not double`);
      await settle(page);
      check(await noOverflow(page), `${label}: page overflow at 200% text`);
      const clipped = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(element => {
        if (!element.getClientRects().length || !element.textContent.trim() || element.matches('[role="region"][tabindex="0"]')) return false;
        const style = getComputedStyle(element);
        const clips = value => value === 'hidden' || value === 'clip';
        return (clips(style.overflowY) && element.scrollHeight > element.clientHeight + 1) || (clips(style.overflowX) && element.scrollWidth > element.clientWidth + 1);
      }).map(element => element.className || element.tagName).slice(0, 5));
      check(clipped.length === 0, `${label}: clipped text ${clipped.join(', ')}`);
      await page.screenshot({ path: resolve(evidenceDir, `${route}-320-200.png`) });
    }
    clean(state, 'text-200');
    sections.push('text-200');
    await close(context, page, 'text-200');
  }

  // 2. JavaScript off at phone width.
  for (const route of routes) {
    const context = await browser.newContext({ viewport: phone, javaScriptEnabled: false });
    const page = await context.newPage();
    const label = `no-js/${route}`;
    const state = await configure(page, label);
    check((await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'domcontentloaded' }))?.status() === 200, `${label}: status`);
    const summaries = page.locator('main details > summary');
    const count = await summaries.count();
    for (let index = 0; index < Math.min(count, 3); index++) {
      const summary = summaries.nth(index);
      if (await summary.evaluate(element => element.parentElement.open)) continue;
      await summary.click();
      check(await summary.evaluate(element => element.parentElement.open), `${label}: disclosure ${index} did not open without JavaScript`);
    }
    const forms = await page.evaluate(() => [...document.querySelectorAll('main form')].map(form => ({
      action: form.getAttribute('action'),
      method: form.getAttribute('method'),
      checker: form.closest('[data-email-checker]') !== null,
      contact: form.hasAttribute('data-contact-form'),
      submissionMode: form.getAttribute('data-submission-mode'),
      submitButtons: [...form.querySelectorAll('button[type="submit"], input[type="submit"]')].map(button => ({ disabled: button.disabled })),
      noscriptNote: form.querySelector('noscript') !== null,
    })));
    const formPolicy = assessNoJsForms(forms);
    check(formPolicy.ok, `${label}: ${formPolicy.problems.join('; ')}`);
    if (formPolicy.contactForms) {
      // Behavioural proof, not just attributes: typing and pressing Enter in
      // the production contact form must neither navigate nor send a request.
      // The route policy aborts and records any non-GET, so a real POST would
      // also surface as a network failure; no message is ever sent.
      const before = page.url();
      const nameField = page.locator('main [data-contact-form] input[name="name"]');
      await nameField.fill('Synthetic no-JS check');
      await nameField.press('Enter');
      await delay(300);
      check(page.url() === before, `${label}: Enter in the contact form navigated to ${page.url()}`);
      check(state.nonGet.length === 0, `${label}: the contact form sent a request without JavaScript ${state.nonGet.join(', ')}`);
      check(await page.locator('main [data-contact-form] [data-contact-submit]').isDisabled(), `${label}: contact submit button is not disabled without JavaScript`);
    }
    check(await noOverflow(page), `${label}: overflow`);
    clean(state, label);
    await close(context, page, label);
  }
  sections.push('no-js');

  // 3. Keyboard: the first disclosure has visible focus and toggles with Enter.
  {
    const context = await browser.newContext({ viewport: desktop });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configure(page, 'keyboard');
    for (const route of routes) {
      await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' });
      const summary = page.locator('main details > summary').first();
      if (!(await summary.count())) continue;
      await page.keyboard.press('Tab');
      await summary.focus();
      check(await summary.evaluate(element => element.matches(':focus-visible') && (getComputedStyle(element).outlineStyle !== 'none' || getComputedStyle(element).boxShadow !== 'none')), `keyboard/${route}: disclosure focus not visible`);
      const before = await summary.evaluate(element => element.parentElement.open);
      await page.keyboard.press('Enter');
      check(await summary.evaluate(element => element.parentElement.open) !== before, `keyboard/${route}: Enter did not toggle the disclosure`);
    }
    clean(state, 'keyboard');
    sections.push('keyboard');
    await close(context, page, 'keyboard');
  }

  // 4. Delayed fonts at 390px and at 320px with 200% text.
  for (const route of routes) {
    for (const [viewport, doubled] of [[phone, false], [narrow, true]]) {
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
        const measure = () => page.evaluate(() => Object.fromEntries(['h1', 'main'].map(selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return [selector, [rect.x, rect.y + scrollY, rect.width]]; })));
        const before = await measure();
        release();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        await settle(page);
        const after = await measure();
        const delta = Math.max(...Object.keys(before).flatMap(key => before[key].map((value, index) => Math.abs(value - after[key][index]))));
        geometry.push({ label, delta });
        check(delta <= .75, `${label}: geometry moved ${delta.toFixed(2)}px after fonts loaded`);
      } finally { release(); }
      clean(state, label);
      await close(context, page, label);
    }
  }
  sections.push('delayed-font');

  // 5. Review pools: no-JS default, random pick per slot, no layout shift,
  // source links, layout.
  {
    const poolState = page => page.evaluate(() => {
      const pool = document.querySelector('[data-review-pool]');
      if (!pool) return null;
      const poolRect = pool.getBoundingClientRect();
      const slots = [...pool.querySelectorAll('[data-review-pool-slot]')].map(slot => {
        const items = [...slot.querySelectorAll('[data-review-pool-item]')];
        const visible = item => !item.inert && item.getAttribute('aria-hidden') !== 'true' && getComputedStyle(item).visibility === 'visible';
        const hiddenOk = items.every(item => visible(item) || (item.inert && item.getAttribute('aria-hidden') === 'true' && getComputedStyle(item).visibility === 'hidden'));
        return { total: items.length, shown: items.flatMap((item, index) => (visible(item) ? [index] : [])), links: items.filter(visible).map(item => [...item.querySelectorAll('a')].map(link => link.href)), hiddenOk };
      });
      const fits = [...pool.querySelectorAll('[data-review-pool-item]')].every(item => item.getBoundingClientRect().right <= poolRect.right + 1 && item.scrollWidth <= item.clientWidth + 1 && item.scrollHeight <= item.clientHeight + 1);
      return { slots, fits, height: poolRect.height };
    });
    const linksOk = pool => pool.slots.every(slot => slot.links.every(links => links.length === 1 && links[0] === GOOGLE_REVIEWS_URL));
    const poolRoutes = [];
    const baselineHeights = new Map();
    for (const route of routes) {
      for (const viewport of [narrow, phone, desktop]) {
        const context = await browser.newContext({ viewport, javaScriptEnabled: false });
        const page = await context.newPage();
        const label = `review-pool/no-js/${viewport.name}/${route}`;
        const state = await configure(page, label);
        await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const pool = await poolState(page);
        if (pool) {
          if (!poolRoutes.includes(route)) poolRoutes.push(route);
          baselineHeights.set(`${route}/${viewport.name}`, pool.height);
          check(pool.slots.length >= 1 && pool.slots.some(slot => slot.total > 1), `${label}: pool must have a slot with more than one review`);
          check(pool.slots.every(slot => slot.shown.length === 1 && slot.shown[0] === 0 && slot.hiddenOk), `${label}: default must show the first review in every slot and hide the rest`);
          check(linksOk(pool), `${label}: a visible review does not link to the Google reviews`);
          check(pool.fits, `${label}: a review card overflows`);
        }
        clean(state, label);
        await close(context, page, label);
      }
    }
    check(poolRoutes.length > 0, 'review-pool: no route renders a review pool');
    for (const route of poolRoutes) {
      // Math.random pinned high picks the last review in every slot.
      for (const viewport of [narrow, phone, desktop]) {
        const context = await browser.newContext({ viewport });
        await context.addInitScript(consentInit);
        await context.addInitScript(() => { Math.random = () => 0.9999; });
        const page = await context.newPage();
        const label = `review-pool/${viewport.name}/${route}`;
        const state = await configure(page, label);
        await page.goto(`${baseUrl}/${route}/`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => [...document.querySelectorAll('[data-review-pool-slot]')].every(slot => { const items = slot.querySelectorAll('[data-review-pool-item]'); return !items[items.length - 1].inert; }), null, { timeout: 5000 }).catch(() => {});
        const pool = await poolState(page);
        check(pool.slots.every(slot => slot.shown.length === 1 && slot.shown[0] === slot.total - 1 && slot.hiddenOk), `${label}: JavaScript did not swap in the random review per slot`);
        check(Math.abs(pool.height - baselineHeights.get(`${route}/${viewport.name}`)) <= .5, `${label}: the swap changed the pool height (${pool.height} vs ${baselineHeights.get(`${route}/${viewport.name}`)} without JavaScript)`);
        check(linksOk(pool), `${label}: a visible review does not link to the Google reviews`);
        check(pool.fits, `${label}: a review card overflows`);
        check(await noOverflow(page), `${label}: page overflow`);
        if (viewport === desktop) {
          const link = page.locator('[data-review-pool-item]:not([inert]) a').first();
          await link.focus();
          await page.keyboard.press('Shift+Tab');
          await page.keyboard.press('Tab');
          check(await link.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'), `${label}: source link focus not visible`);
          const reachable = await page.evaluate(() => [...document.querySelectorAll('[data-review-pool-item][inert] a')].filter(link => { link.focus(); return document.activeElement === link; }).length);
          check(reachable === 0, `${label}: ${reachable} hidden review links can take focus`);
        }
        await page.locator('[data-review-pool]').screenshot({ path: resolve(evidenceDir, `${route}-review-pool-${viewport.name}.png`) });
        clean(state, label);
        await close(context, page, label);
      }
    }
    sections.push('review-pool');
  }

  check(networkFailures.length === 0, `network: ${networkFailures.length} failed requests ${formatRequestFailures(networkFailures)}`);
  const missing = REQUIRED_SECTIONS.filter(name => !sections.includes(name));
  check(missing.length === 0, `sections skipped: ${missing.join(', ')}`);
  if (failures.length) throw new Error(`${failures.length} standalone browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} standalone browser assertions passed across ${routes.length} routes (320px 200% text, no-JS disclosures and forms, keyboard disclosures, delayed fonts, review pools)`);
} catch (error) {
  fatal = error;
} finally {
  if (browser) await browser.close().catch(() => {});
  await new Promise(done => server.close(done));
  await writeFile(resolve(evidenceDir, 'report.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), distDir: relative(projectDir, distDir), routes, sections, assertions, failures, networkFailures, geometry, error: fatal ? fatal.message : null }, null, 2)}\n`);
  if (fatal) { console.error(fatal.message); process.exitCode = 1; }
}
