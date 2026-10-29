import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { serviceLocations, serviceLocationSlugs } from '../src/generated/service-locations-data.mjs';
import { countyHubSlug } from '../src/lib/service-location-display.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

// Focused browser gate for the root-slug service-location family, derived from
// industries-browser-check.mjs:
// - every generated route swept at phone and desktop (status, single H1,
//   template marker, no active nav item, benefit/FAQ/related counts, overflow,
//   browser errors);
// - every route at 320px: no document overflow and no heading word broken
//   across lines once fonts are ready;
// - two deterministic representatives (the first county record and the first
//   town record that links to a county hub, both in source order) at phone and
//   desktop: keyboard FAQ toggle, keyboard mobile menu open/Escape/focus return,
//   conversion and related links, measured 200% text, computed contrast on the
//   family's small text, painted Bungee, slow-font same-document geometry;
// - a fresh context without stored consent: no analytics vendor request before
//   or after rejecting, and the notice hides on rejection;
// - a JavaScript-off phone context: content, native FAQ, native menu, links.
// Owned static server, explicit Chromium executable, sandbox on, and all
// non-local requests blocked (Cloudinary stubbed) so no provider write can occur.
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
if (!serviceLocations.length) throw new Error('No service-location records in the generated data; run scripts/extract-service-locations.mjs first');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(projectDir, 'dist');
const evidenceDir = resolve(projectDir, 'evidence', 'service-locations-browser');
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

const routes = serviceLocations.map(page => ({
  name: page.slug, url: `${baseUrl}/${page.slug}/`, h1: page.h1, marker: `[data-service-location-page="${page.slug}"]`, page,
  hub: countyHubSlug(page, serviceLocationSlugs),
}));
const countyRepresentative = routes.find(route => route.page.isCounty);
const townRepresentative = routes.find(route => !route.page.isCounty && route.hub);
if (!countyRepresentative || !townRepresentative) throw new Error('Representative selection needs one county record and one town record with a county hub');
const representatives = [countyRepresentative, townRepresentative];
const vendorHosts = new Set(['www.googletagmanager.com', 'www.google-analytics.com', 'analytics.google.com', 'www.clarity.ms', 'c.clarity.ms']);
// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
const stubImage = { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="72" />' };
const contrastSelectors = '.sl-breadcrumbs a, .sl-breadcrumbs [aria-current="page"], .sl-badge, .sl-hero-copy, .sl-primary-button, .sl-secondary-button, .sl-review-panel span, .sl-review-panel p, .sl-eyebrow, .sl-benefit-card h3, .sl-benefit-card p, .sl-rich p, .sl-rich li, .sl-rich a, .sl-local-label, .sl-local-context p:last-child, .sl-faq-list summary span, .sl-faq-answer p, .sl-related-links a, .sl-final-copy';

let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const failures = [];
  let assertions = 0;
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  const routeExternal = (route, state) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (isBlockmarkBadge(url)) return route.fulfill(BLOCKMARK_STUB);
    state?.external.push(url.hostname);
    if (url.hostname === 'res.cloudinary.com') return route.fulfill(stubImage);
    return route.abort();
  };
  const configurePage = async page => {
    const state = { errors: [], external: [] };
    page.on('console', message => { if (message.type() === 'error') state.errors.push(message.text()); });
    page.on('pageerror', error => state.errors.push(error.message));
    await page.route('**/*', route => routeExternal(route, state));
    return state;
  };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const settle = page => page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const brokenWords = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const broken = [];
    for (const element of elements) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        // A wrap at an ordinary hyphen is a legal break; only a break inside a letter run counts.
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
    return elements.filter(element => element.offsetParent !== null || getComputedStyle(element).position === 'fixed').map(element => {
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
  const headingSkips = page => page.evaluate(() => {
    const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(heading => !heading.closest('[hidden], [aria-hidden="true"]') && heading.getClientRects().length > 0)
      .map(heading => ({ level: Number(heading.tagName.slice(1)), text: heading.textContent.trim().slice(0, 60) }));
    return levels.filter((heading, index) => index > 0 && heading.level > levels[index - 1].level + 1).map(heading => `h${heading.level} "${heading.text}"`);
  });
  // 200% text: snapshot every element's computed size, then double each one
  // explicitly (px-sized rules ignore a root change). Returns the H1 before and after.
  const doubleText = page => page.evaluate(() => {
    const elements = [document.body, ...document.body.querySelectorAll('*')];
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const h1 = document.querySelector('h1');
    const h1Before = parseFloat(getComputedStyle(h1).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return { h1Before, h1After: parseFloat(getComputedStyle(h1).fontSize) };
  });
  const checkDoubled = ({ h1Before, h1After }, label) => check(h1Before > 0 && Math.abs(h1After - h1Before * 2) <= .5, `${label}: H1 font size ${h1Before}px did not double (${h1After}px)`);
  const relatedCount = route => (route.hub ? 3 : 2);
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
      check(await page.locator('header nav [aria-current="page"]').count() === 0, `${viewport.name}/${route.name}: unexpected active navigation item`);
      check(await page.locator('.sl-breadcrumbs [aria-current="page"]').count() === 1, `${viewport.name}/${route.name}: breadcrumb current item`);
      check(await page.locator('.sl-benefit-card').count() === route.page.benefits.length, `${viewport.name}/${route.name}: benefit count`);
      check(await page.locator('.sl-faq-list details').count() === route.page.faqs.length, `${viewport.name}/${route.name}: FAQ count`);
      check(await page.locator('.sl-related-links a').count() === relatedCount(route), `${viewport.name}/${route.name}: related link count`);
      check(await page.locator('.sl-related-links [data-county-hub]').count() === (route.hub ? 1 : 0), `${viewport.name}/${route.name}: county hub link`);
      const skips = await headingSkips(page);
      check(skips.length === 0, `${viewport.name}/${route.name}: heading hierarchy skips a level at ${skips.join(', ')}`);
      check(await noOverflow(page), `${viewport.name}/${route.name}: overflow`);
      check(state.errors.length === 0, `${viewport.name}/${route.name}: browser errors ${state.errors.join('; ')}`);
    }
    check(state.external.every(host => host === 'res.cloudinary.com'), `${viewport.name}: unexpected external hosts ${state.external.join(',')}`);
    await context.close();
  }

  // 2. 320px on every route: no overflow, no heading word broken mid-letter once fonts are ready.
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    await configurePage(page);
    // Synthetic fixture proving the detector: a wrap at the hyphen in
    // "Non-Profits" is legal, while a forced mid-letter break is reported.
    await page.setContent('<style>p{font-family:monospace;font-size:16px;margin:0}</style><p id="legal" style="width:5ch">Non-Profits</p><p id="illegal" style="width:5ch;word-break:break-all">Profits</p>');
    const legal = await brokenWords(page, '#legal');
    const illegal = await brokenWords(page, '#illegal');
    check(legal.length === 0, `320px/fixture: hyphen wrap flagged as broken ${legal.join(', ')}`);
    check(illegal.length === 1 && illegal[0] === 'Profits', `320px/fixture: mid-letter break not detected ${illegal.join(', ')}`);
    for (const route of routes) {
      await page.goto(route.url);
      await page.evaluate(() => document.fonts.ready);
      const broken = await brokenWords(page, 'h1, .sl-section h2, .sl-final h2, .sl-benefit-card h3');
      check(broken.length === 0, `320px/${route.name}: broken heading words ${broken.join(', ')}`);
      check(await noOverflow(page), `320px/${route.name}: overflow`);
    }
    await context.close();
  }

  // 3. Representatives: interactions, links, contrast, painted Bungee, 200% text.
  for (const route of representatives) {
    for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const state = await configurePage(page);
      const response = await page.goto(route.url, { waitUntil: 'networkidle' });
      const label = `${viewport.name}/${route.name}`;
      check(response?.status() === 200, `${label}: status`);
      check(await page.locator('a[href="/contact"]').count() >= 2 && await page.locator('a[href="tel:+441584517234"]').count() >= 2, `${label}: conversion links`);
      const hrefs = await page.locator('.sl-related-links a').evaluateAll(links => links.map(link => link.getAttribute('href')));
      check(JSON.stringify(hrefs) === JSON.stringify([...(route.hub ? [`/${route.hub}`] : []), `/services/${route.page.relatedService}`, `/locations/${route.page.relatedLocation}`]), `${label}: related link order ${hrefs.join(',')}`);
      check(await page.locator('.sl-breadcrumbs a[href="/services"]').count() === 1, `${label}: breadcrumb services link`);
      // Keyboard FAQ: Enter on the summary opens, Enter again closes, answer text visible when open.
      const faq = page.locator('.sl-faq-list details').first();
      await faq.locator('summary').focus(); await page.keyboard.press('Enter');
      check(await faq.getAttribute('open') !== null && await faq.locator('.sl-faq-answer').isVisible(), `${label}: keyboard FAQ open`);
      await page.keyboard.press('Enter');
      check(await faq.getAttribute('open') === null, `${label}: keyboard FAQ close`);
      if (viewport.width < 1024) {
        const menu = page.locator('[data-mobile-menu]');
        const summary = menu.locator('summary');
        await summary.focus(); await page.keyboard.press('Enter');
        check(await menu.getAttribute('open') !== null && await menu.locator('nav a').first().isVisible(), `${label}: mobile menu did not open from keyboard`);
        await page.keyboard.press('Escape');
        check(await menu.getAttribute('open') === null, `${label}: Escape did not close the mobile menu`);
        check(await summary.evaluate(element => element === document.activeElement), `${label}: mobile menu did not restore focus`);
      } else {
        const firstLink = page.locator('.desktop-nav a').first();
        await firstLink.focus();
        check(await firstLink.isVisible() && await firstLink.evaluate(element => element === document.activeElement), `${label}: desktop navigation focus`);
      }
      const ratios = await contrast(page, contrastSelectors);
      check(ratios.length >= 18 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      if (viewport.name === 'phone') {
        const fonts = await paintedBungee(context, page, '.sl-hero h1');
        check(fonts.some(font => /Bungee/i.test(font.familyName) && font.glyphCount > 0), `${label}: normal-load hero did not paint Bungee ${fonts.map(font => font.familyName).join(',')}`);
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-font-fast.png`), fullPage: false });
      }
      await page.screenshot({ path: resolve(evidenceDir, `${route.name}-${viewport.name}-top.png`), fullPage: false });
      checkDoubled(await doubleText(page), label);
      await settle(page);
      check(await noOverflow(page), `${label}: overflow at 200% text`);
      if (viewport.name === 'phone') await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-200.png`), fullPage: false });
      await context.close();
    }
  }

  // 3b. Town representative at 320px and 200% text: document still does not scroll sideways.
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    await configurePage(page);
    await page.goto(townRepresentative.url, { waitUntil: 'networkidle' });
    checkDoubled(await doubleText(page), `320px/${townRepresentative.name}`);
    await settle(page);
    check(await noOverflow(page), `320px/${townRepresentative.name}: overflow at 200% text`);
    await context.close();
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
      else await routeExternal(gate);
    });
    const geometry = () => page.evaluate(() => ({
      bannerHeight: document.querySelector('.prototype-banner').getBoundingClientRect().height,
      actionsTop: document.querySelector('.sl-actions').getBoundingClientRect().top,
      headingHeight: document.querySelector('.sl-hero h1').getBoundingClientRect().height,
      fontStatus: document.fonts.status,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    const label = `${width}px/${route.name} delayed font`;
    try {
      await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await delay(200);
      await settle(page);
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
      check(Math.abs(after.bannerHeight - before.bannerHeight) <= .5, `${label}: banner moved ${before.bannerHeight}px to ${after.bannerHeight}px`);
      check(after.fontStatus === 'loaded', `${label}: fonts did not finish loading`);
      check(Math.abs(after.actionsTop - before.actionsTop) <= 1, `${label}: actions moved ${after.actionsTop - before.actionsTop}px (heading ${before.headingHeight}px to ${after.headingHeight}px)`);
      check(before.overflow <= 0 && after.overflow <= 0, `${label}: overflow before ${before.overflow}px / after ${after.overflow}px`);
    } finally {
      releaseFonts(); await context.close();
    }
  };
  for (const width of [320, 390]) for (const route of representatives) await checkDelayedFont(width, route);

  // 5. Consent on a fresh context: notice shown, no vendor request before or after rejection.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const state = await configurePage(page);
    await page.goto(townRepresentative.url, { waitUntil: 'networkidle' });
    const banner = page.locator('[data-cookie-banner]');
    check(await banner.isVisible(), 'consent: notice is shown without stored consent');
    await page.locator('[data-consent="reject"]').click();
    await settle(page);
    check(await banner.isHidden(), 'consent: notice hides after rejection');
    await page.goto(countyRepresentative.url, { waitUntil: 'networkidle' });
    check(await banner.isHidden(), 'consent: rejection persists on the next route');
    check(!state.external.some(host => vendorHosts.has(host)), `consent: analytics vendor requested ${state.external.filter(host => vendorHosts.has(host)).join(',')}`);
    check(state.errors.length === 0, `consent: browser errors ${state.errors.join('; ')}`);
    await context.close();
  }

  // 6. No JavaScript: full content, native FAQ and menu, county hub link.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await context.newPage();
    const state = await configurePage(page);
    const response = await page.goto(townRepresentative.url, { waitUntil: 'domcontentloaded' });
    check(response?.status() === 200, 'no-JS: status');
    check(await page.locator('.sl-benefit-card').count() === townRepresentative.page.benefits.length, 'no-JS: benefit cards present');
    check(await page.locator('.sl-rich').first().locator('p, li').count() >= 1, 'no-JS: rich content present');
    check(await page.locator('.sl-faq-list details').count() === townRepresentative.page.faqs.length, 'no-JS: FAQs present');
    const faq = page.locator('.sl-faq-list details').first();
    await faq.locator('summary').click();
    check(await faq.getAttribute('open') !== null && await faq.locator('.sl-faq-answer').isVisible(), 'no-JS: native FAQ opens');
    const menu = page.locator('[data-mobile-menu]');
    await menu.locator('summary').click();
    check(await menu.getAttribute('open') !== null && await menu.locator('nav a').first().isVisible(), 'no-JS: native mobile menu opens');
    await menu.locator('summary').click();
    check(await page.locator('.sl-related-links [data-county-hub]').count() === 1 && await page.locator('.sl-related-links a').count() === 3, 'no-JS: county hub and related links present');
    check(await noOverflow(page), 'no-JS: phone overflow');
    check(state.errors.length === 0, `no-JS: browser errors ${state.errors.join('; ')}`);
    await context.close();
  }

  if (failures.length) throw new Error(`${failures.length} service-location browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} service-location browser assertions passed across ${routes.length} routes (390px/1440px sweeps, 320px heading words, representatives ${countyRepresentative.name} and ${townRepresentative.name} at 200% text, keyboard FAQ and menu, contrast, painted Bungee, 320px/390px delayed fonts, fresh-context consent and phone no-JS)`);
} finally {
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; }
  }
  await new Promise(resolveClose => server.close(resolveClose));
}
