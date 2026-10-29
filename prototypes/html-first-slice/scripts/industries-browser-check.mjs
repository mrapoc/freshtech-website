import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { industries } from '../src/generated/industries-data.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

// Economical industry gate derived from locations-browser-check.mjs:
// - every generated route (listing + details) swept at phone and desktop;
// - the longest heading at 320px measured for broken words on every detail route;
// - the representative detail route and listing checked at 320px, 200% text,
//   keyboard FAQ toggle, contrast, painted Bungee, slow-font same-document and no-JS.
// Owned static server, explicit Chromium executable, sandbox on, and all
// non-local requests blocked (Cloudinary stubbed) so no provider write can occur.
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(projectDir, 'dist');
const evidenceDir = resolve(projectDir, 'evidence', 'industries-browser');
const contentTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
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

const listingRoute = { name: 'listing', url: `${baseUrl}/industries/`, h1: 'We probably know your software.', marker: '[data-industries-page]' };
const detailRoutes = industries.map(industry => ({ name: industry.slug, url: `${baseUrl}/industries/${industry.slug}/`, h1: industry.h1, marker: `[data-industry-page="${industry.slug}"]`, industry }));
const routes = [listingRoute, ...detailRoutes];
const representative = detailRoutes.reduce((longest, route) => route.h1.length > longest.h1.length ? route : longest);
// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
const stubImage = { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="72" />' };

// Declared outside the try so a Playwright exception mid-run still closes the
// browser (and its connections) before the server is closed; otherwise
// server.close can hang on live keep-alive sockets.
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const failures = [];
  let assertions = 0;
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  const configurePage = async page => {
    const state = { errors: [], external: [] };
    page.on('console', message => { if (message.type() === 'error') state.errors.push(message.text()); });
    page.on('pageerror', error => state.errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') route.continue();
      else if (isBlockmarkBadge(url)) route.fulfill(BLOCKMARK_STUB);
      else if (url.hostname === 'res.cloudinary.com') { state.external.push(url.hostname); route.fulfill(stubImage); }
      else { state.external.push(url.hostname); route.abort(); }
    });
    return state;
  };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const brokenWords = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const broken = [];
    for (const element of elements) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        // Segments are split on whitespace and ordinary hyphens (U+002D, U+2010):
        // a line break at a hyphen is a legal break, not a broken word. Only a
        // break inside a letter run counts. Offsets are preserved via match.index.
        for (const match of node.textContent.matchAll(/[^\s\-‐]+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
          if (new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size > 1) broken.push(match[0]);
        }
      }
    }
    return broken;
  });
  const contrast = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) => { const alpha = front.length > 3 ? front[3] : 1; return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha)); };
    const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return elements.map(element => {
      const layers = []; for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255]; for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = luminance(blend(channels(getComputedStyle(element).color), background));
      const behind = luminance(background); return (Math.max(foreground, behind) + .05) / (Math.min(foreground, behind) + .05);
    });
  });
  const paintedBungee = async (context, page, selector) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    await cdp.detach();
    return fonts;
  };
  await mkdir(evidenceDir, { recursive: true });

  // 1. Route sweep: every generated route at phone and desktop.
  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page);
    for (const route of routes) {
      state.errors.length = 0;
      const response = await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      check(response?.status() === 200, `${viewport.name}/${route.name}: status`);
      check(await page.locator('h1').count() === 1 && await page.locator('h1').innerText() === route.h1, `${viewport.name}/${route.name}: H1`);
      check(await page.locator(route.marker).count() === 1, `${viewport.name}/${route.name}: template marker`);
      check(await page.locator('nav [aria-current="page"]').count() === 0, `${viewport.name}/${route.name}: unexpected active navigation item`);
      check(await noOverflow(page), `${viewport.name}/${route.name}: overflow`);
      check(state.errors.length === 0, `${viewport.name}/${route.name}: browser errors ${state.errors.join('; ')}`);
      if (route.industry) {
        check(await page.locator('.industry-faq-list details').count() === route.industry.faqs.length, `${viewport.name}/${route.name}: FAQ count`);
        check(await page.locator('.industry-related-links a').count() === 4, `${viewport.name}/${route.name}: related links`);
      }
    }
    check(state.external.every(host => host === 'res.cloudinary.com'), `${viewport.name}: unexpected external hosts ${state.external.join(',')}`);
    await context.close();
  }

  // 2. Longest headings at 320px: no word may break across lines once fonts are ready.
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    await configurePage(page);
    // Synthetic fixture proving the detector: a wrap at the hyphen in
    // "Non-Profits" is legal, while a forced mid-letter break in "Profits" is
    // still reported. Monospace + ch widths make the break points deterministic.
    await page.setContent('<style>p{font-family:monospace;font-size:16px;margin:0}</style><p id="legal" style="width:5ch">Non-Profits</p><p id="illegal" style="width:5ch;word-break:break-all">Profits</p>');
    const legal = await brokenWords(page, '#legal');
    const illegal = await brokenWords(page, '#illegal');
    const legalLines = await page.locator('#legal').evaluate(element => { const range = document.createRange(); range.selectNodeContents(element); return new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size; });
    check(legalLines === 2, `320px/fixture: Non-Profits rendered on ${legalLines} line(s), expected a wrap at the hyphen`);
    check(legal.length === 0, `320px/fixture: hyphen wrap flagged as broken ${legal.join(', ')}`);
    check(illegal.length === 1 && illegal[0] === 'Profits', `320px/fixture: mid-letter break not detected ${illegal.join(', ')}`);
    for (const route of routes) {
      await page.goto(route.url);
      await page.evaluate(() => document.fonts.ready);
      const broken = await brokenWords(page, 'h1, .industry-card h3, .industry-sector-head h3, .industry-question-card h3');
      check(broken.length === 0, `320px/${route.name}: broken heading words ${broken.join(', ')}`);
      check(await noOverflow(page), `320px/${route.name}: overflow`);
    }
    await context.close();
  }

  // 3. Representative detail and listing: interaction, contrast, painted Bungee, 200% text.
  for (const route of [representative, listingRoute]) {
    for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const state = await configurePage(page);
      const response = await page.goto(route.url, { waitUntil: 'networkidle' });
      const label = `${viewport.name}/${route.name}`;
      check(response?.status() === 200, `${label}: status`);
      check(await page.locator('a[href="/contact"]').count() >= 2, `${label}: contact links`);
      if (route.industry) {
        check(await page.locator('.industry-challenges .industry-card').count() === route.industry.challenges.length, `${label}: challenge count`);
        check(await page.locator('.industry-solutions .industry-card').count() === route.industry.solutions.length, `${label}: solution count`);
        const faq = page.locator('.industry-faq-list details').first();
        await faq.locator('summary').focus(); await page.keyboard.press('Enter');
        check(await faq.getAttribute('open') !== null, `${label}: native FAQ keyboard toggle`);
        const ratios = await contrast(page, '.industry-eyebrow, .industry-hero-copy, .industry-primary-button, .industry-secondary-button, .industry-stat-panel span, .industry-section-heading > p:last-child, .industry-card h3, .industry-card p, .industry-faq-list summary, .industry-faq-list details > div, .industry-related-links a, .industry-related-label, .industry-question-card p, .industry-question-card a');
        check(ratios.length >= 14 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      } else {
        check(await page.locator('.industry-sector-card').count() === industries.length, `${label}: sector card count`);
        const hrefs = await page.locator('.industry-sector-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')));
        check(JSON.stringify(hrefs) === JSON.stringify(industries.map(industry => `/industries/${industry.slug}`)), `${label}: sector card order`);
        const ratios = await contrast(page, '.industry-eyebrow, .industry-hero-copy, .industry-primary-button, .industry-secondary-button, .industry-stat-panel span, .industry-section-heading > p:last-child, .industry-sector-head h3, .industry-sticker, .industry-sector-card p, .industry-sector-more, .industries-closing-grid p:last-child');
        check(ratios.length >= 11 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      }
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      if (viewport.name === 'phone') {
        const fonts = await paintedBungee(context, page, '.industry-hero h1');
        check(fonts.some(font => /Bungee/i.test(font.familyName) && font.glyphCount > 0), `${label}: normal-load hero did not paint Bungee ${fonts.map(font => font.familyName).join(',')}`);
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-font-fast.png`), fullPage: false });
      }
      await page.screenshot({ path: resolve(evidenceDir, `${route.name}-${viewport.name}-top.png`), fullPage: false });
      // 200% text: fixed-pixel headings and body copy ignore a root font-size
      // change, so snapshot the computed font-size of html and every body
      // descendant first, then force each to twice that px value.
      const textScale = await page.evaluate(() => {
        const elements = [document.documentElement, ...document.body.querySelectorAll('*')];
        const before = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
        const h1Before = parseFloat(getComputedStyle(document.querySelector('h1')).fontSize);
        elements.forEach((element, index) => element.style.setProperty('font-size', `${before[index] * 2}px`, 'important'));
        return { h1Before };
      });
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const h1After = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('h1')).fontSize));
      check(Math.abs(h1After - textScale.h1Before * 2) <= .5, `${label}: h1 font-size ${textScale.h1Before}px became ${h1After}px at 200% text, expected ${textScale.h1Before * 2}px`);
      check(await noOverflow(page), `${label}: overflow at 200% text`);
      if (viewport.name === 'phone') await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-200.png`), fullPage: false });
      await context.close();
    }
  }

  // 4. Slow fonts in the same document: layout must not move when the font eventually arrives.
  const checkDelayedFont = async (width, route) => {
    let releaseFonts;
    const fontGate = new Promise(resolveGate => { releaseFonts = resolveGate; });
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    await page.route('**/*', async gate => {
      const url = new URL(gate.request().url());
      if (url.hostname === '127.0.0.1') { if (url.pathname.startsWith('/fonts/')) await fontGate; await gate.continue(); }
      else if (isBlockmarkBadge(url)) await gate.fulfill(BLOCKMARK_STUB);
      else if (url.hostname === 'res.cloudinary.com') await gate.fulfill(stubImage);
      else await gate.abort();
    });
    const geometry = () => page.evaluate(() => ({
      bannerHeight: document.querySelector('.prototype-banner').getBoundingClientRect().height,
      actionsTop: document.querySelector('.industry-actions').getBoundingClientRect().top,
      headingHeight: document.querySelector('.industry-hero h1').getBoundingClientRect().height,
      fontStatus: document.fonts.status,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    const label = `${width}px/${route.name} delayed font`;
    try {
      await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await delay(200);
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const before = await geometry();
      if (width === 390) {
        await page.evaluate(() => scrollTo(0, 0));
        const cdp = await context.newCDPSession(page);
        const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        await writeFile(resolve(evidenceDir, `${route.name}-phone-font-slow-fallback.png`), Buffer.from(capture.data, 'base64'));
      }
      check(before.fontStatus === 'loading', `${label}: fonts loaded before fallback capture`);
      releaseFonts();
      await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))));
      const after = await geometry();
      if (width === 390) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-font-slow-after-load.png`), fullPage: false });
      }
      check(Math.abs(after.bannerHeight - before.bannerHeight) <= .5, `${label}: banner moved ${before.bannerHeight}px to ${after.bannerHeight}px`);
      check(after.fontStatus === 'loaded', `${label}: fonts did not finish loading`);
      check(Math.abs(after.actionsTop - before.actionsTop) <= 1, `${label}: actions moved ${after.actionsTop - before.actionsTop}px (heading ${before.headingHeight}px to ${after.headingHeight}px)`);
      check(before.overflow <= 0 && after.overflow <= 0, `${label}: overflow before ${before.overflow}px / after ${after.overflow}px`);
    } finally {
      releaseFonts(); await context.close();
    }
  };
  for (const width of [320, 390]) for (const route of [representative, listingRoute]) await checkDelayedFont(width, route);

  // 5. No JavaScript: content and native FAQ still work.
  const noJsContext = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const noJsPage = await noJsContext.newPage();
  const noJsState = await configurePage(noJsPage);
  const noJsResponse = await noJsPage.goto(representative.url, { waitUntil: 'domcontentloaded' });
  check(noJsResponse?.status() === 200, 'no-JS: status');
  check(await noJsPage.locator('.industry-card').count() === representative.industry.challenges.length + representative.industry.solutions.length, 'no-JS: cards remain present');
  check(await noJsPage.locator('.industry-faq-list details').count() === representative.industry.faqs.length, 'no-JS: FAQs remain present');
  const noJsFaq = noJsPage.locator('.industry-faq-list details').first();
  await noJsFaq.locator('summary').click();
  check(await noJsFaq.getAttribute('open') !== null, 'no-JS: native FAQ opens');
  check(await noOverflow(noJsPage), 'no-JS: phone overflow');
  check(noJsState.errors.length === 0, `no-JS: browser errors ${noJsState.errors.join('; ')}`);
  await noJsContext.close();

  if (failures.length) throw new Error(`${failures.length} industry browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} industry browser assertions passed across ${routes.length} routes (390px/1440px sweeps, 320px heading words, representative ${representative.name} + listing at 200% text, keyboard, painted Bungee, 320px/390px delayed fonts and phone no-JS)`);
} finally {
  // Close the browser first so no page connections keep the server alive.
  // A close error is reported but never swallows the original failure (the
  // finally block has no return, so a pending throw still propagates).
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; }
  }
  await new Promise(resolveClose => server.close(resolveClose));
}
