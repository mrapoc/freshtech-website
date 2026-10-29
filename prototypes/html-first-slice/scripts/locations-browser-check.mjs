import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { locations } from '../src/generated/locations-data.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(projectDir, 'dist');
const contentTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
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
const port = address.port;
const baseUrl = `http://127.0.0.1:${port}`;
const urlFor = slug => `${baseUrl}/locations/${slug}/`;

try {
  const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
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
      else if (url.hostname === 'res.cloudinary.com') {
        state.external.push(url.hostname);
        route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="72" />' });
      } else { state.external.push(url.hostname); route.abort(); }
    });
    return state;
  };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const contrast = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) => {
      const alpha = front.length > 3 ? front[3] : 1;
      return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha));
    };
    const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return elements.map(element => {
      const layers = []; for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255]; for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = luminance(blend(channels(getComputedStyle(element).color), background));
      const behind = luminance(background); return (Math.max(foreground, behind) + .05) / (Math.min(foreground, behind) + .05);
    });
  });
  await mkdir(resolve(projectDir, 'evidence', 'locations-browser'), { recursive: true });

  const representative = locations.reduce((longest, location) => location.heroTitle.length > longest.heroTitle.length ? location : longest);
  // Measure glyph layout after the font is ready, rather than accepting overflow-wrap as proof.
  for (const width of [320, 390, 412]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await configurePage(page);
    for (const location of locations) {
      await page.goto(urlFor(location.slug));
      await page.evaluate(() => document.fonts.ready);
      const broken = await page.locator('h1').evaluate(element => {
        const failures = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const match of node.textContent.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
            if (new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size > 1) failures.push(match[0]);
          }
        }
        return failures;
      });
      check(broken.length === 0, `${width}px/${location.slug}: broken heading words ${broken.join(', ')}`);
    }
    await context.close();
  }
  const checkDelayedFontWrap = async (width, location) => {
    let releaseFonts;
    const fontGate = new Promise(resolveGate => { releaseFonts = resolveGate; });
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.addInitScript(() => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() })));
    const page = await context.newPage();
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') {
        if (url.pathname.startsWith('/fonts/')) await fontGate;
        await route.continue();
      } else if (isBlockmarkBadge(url)) {
        await route.fulfill(BLOCKMARK_STUB);
      } else if (url.hostname === 'res.cloudinary.com') {
        await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="72" />' });
      } else await route.abort();
    });
    const geometry = () => page.evaluate(() => {
      const actions = document.querySelector('.location-actions').getBoundingClientRect();
      const heading = document.querySelector('.location-hero h1').getBoundingClientRect();
      return { bannerHeight: document.querySelector('.prototype-banner').getBoundingClientRect().height, actionsTop: actions.top, headingHeight: heading.height, fontStatus: document.fonts.status, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    try {
      await page.goto(urlFor(location.slug), { waitUntil: 'domcontentloaded' });
      await delay(200);
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const before = await geometry();
      if (width === 390 && location.slug === representative.slug) {
        await page.evaluate(() => scrollTo(0, 0));
        const cdp = await context.newCDPSession(page);
        const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        await writeFile(resolve(projectDir, 'evidence', 'locations-browser', 'phone-font-slow-fallback.png'), Buffer.from(capture.data, 'base64'));
      }
      check(before.fontStatus === 'loading', `${width}px/${location.slug} delayed font: fonts loaded before fallback capture`);
      releaseFonts();
      await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))));
      const after = await geometry();
      if (width === 390 && location.slug === representative.slug) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: resolve(projectDir, 'evidence', 'locations-browser', 'phone-font-slow-after-load.png'), fullPage: false });
      }
      check(Math.abs(after.bannerHeight - before.bannerHeight) <= .5, `${width}px/${location.slug} delayed font: banner moved ${before.bannerHeight}px to ${after.bannerHeight}px`);
      check(after.fontStatus === 'loaded', `${width}px/${location.slug} delayed font: fonts did not finish loading`);
      check(Math.abs(after.actionsTop - before.actionsTop) <= 1, `${width}px/${location.slug} delayed font: actions moved ${after.actionsTop - before.actionsTop}px (heading ${before.headingHeight}px to ${after.headingHeight}px)`);
      check(before.overflow <= 0 && after.overflow <= 0, `${width}px/${location.slug} delayed font: overflow before ${before.overflow}px / after ${after.overflow}px`);
    } finally {
      releaseFonts(); await context.close();
    }
  };

  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() })));
    const page = await context.newPage();
    const state = await configurePage(page);
    const response = await page.goto(urlFor(representative.slug), { waitUntil: 'networkidle' });
    check(response?.status() === 200, `${viewport.name}: representative status`);
    check(await page.locator('h1').innerText() === representative.heroTitle, `${viewport.name}: representative H1`);
    check(await page.locator('.location-feature-card').count() === representative.features.length, `${viewport.name}: feature count`);
    check(await page.locator('.location-faq-list details').count() === representative.faqs.length, `${viewport.name}: FAQ count`);
    check(await page.locator('a[href="tel:+441584517234"]').count() >= 1, `${viewport.name}: phone link`);
    check(await page.locator('a[href="/contact"]').count() >= 2, `${viewport.name}: contact links`);
    check(await page.locator('nav [aria-current="page"]').count() === 0, `${viewport.name}: unexpected active navigation item`);
    const faq = page.locator('.location-faq-list details').first();
    await faq.locator('summary').focus(); await page.keyboard.press('Enter');
    check(await faq.getAttribute('open') !== null, `${viewport.name}: native FAQ keyboard toggle`);
    check(await noOverflow(page), `${viewport.name}: horizontal overflow`);
    const ratios = await contrast(page, '.location-badge, .location-hero-copy, .location-primary-button, .location-review-panel span, .location-eyebrow, .location-feature-card p, .location-faq-list details > div');
    check(ratios.length >= 7 && ratios.every(ratio => ratio >= 4.5), `${viewport.name}: representative contrast ${ratios.join(',')}`);
    check(state.errors.length === 0, `${viewport.name}: browser errors ${state.errors.join('; ')}`);
    check(state.external.every(host => host === 'res.cloudinary.com'), `${viewport.name}: unexpected external hosts ${state.external.join(',')}`);
    if (viewport.name === 'phone') {
      const cdp = await context.newCDPSession(page);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.location-hero h1' });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      check(fonts.some(font => /Bungee/i.test(font.familyName) && font.glyphCount > 0), `phone: normal-load hero did not paint Bungee ${fonts.map(font => font.familyName).join(',')}`);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: resolve(projectDir, 'evidence', 'locations-browser', 'phone-font-fast.png'), fullPage: false });
    }
    await page.screenshot({ path: resolve(projectDir, 'evidence', 'locations-browser', `${viewport.name}-top.png`), fullPage: false });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    check(await noOverflow(page), `${viewport.name}: overflow at 200% text`);
    await context.close();
  }

  for (const width of [320, 390, 412]) {
    for (let index = 0; index < locations.length; index += 2) {
      await Promise.all(locations.slice(index, index + 2).map(location => checkDelayedFontWrap(width, location)));
    }
  }

  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const state = await configurePage(page);
    for (const location of locations) {
      state.errors.length = 0;
      const response = await page.goto(urlFor(location.slug), { waitUntil: 'domcontentloaded' });
      check(response?.status() === 200, `${viewport.name}/${location.slug}: status`);
      check(await page.locator('h1').innerText() === location.heroTitle, `${viewport.name}/${location.slug}: H1`);
      check(await page.locator(`[data-location-page="${location.slug}"]`).count() === 1, `${viewport.name}/${location.slug}: template marker`);
      check(await noOverflow(page), `${viewport.name}/${location.slug}: overflow`);
      check(state.errors.length === 0, `${viewport.name}/${location.slug}: browser errors ${state.errors.join('; ')}`);
    }
    await context.close();
  }

  const noJsContext = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const noJsPage = await noJsContext.newPage();
  const noJsState = await configurePage(noJsPage);
  const noJsResponse = await noJsPage.goto(urlFor(representative.slug), { waitUntil: 'domcontentloaded' });
  check(noJsResponse?.status() === 200, 'no-JS: status');
  check(await noJsPage.locator('.location-feature-card').count() === representative.features.length, 'no-JS: features remain present');
  check(await noJsPage.locator('.location-faq-list details').count() === representative.faqs.length, 'no-JS: FAQs remain present');
  const noJsFaq = noJsPage.locator('.location-faq-list details').first();
  await noJsFaq.locator('summary').click();
  check(await noJsFaq.getAttribute('open') !== null, 'no-JS: native FAQ opens');
  check(await noOverflow(noJsPage), 'no-JS: phone overflow');
  check(noJsState.errors.length === 0, `no-JS: browser errors ${noJsState.errors.join('; ')}`);
  await noJsContext.close();

  await browser.close();
  if (failures.length) throw new Error(`${failures.length} location browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} location browser assertions passed across ${locations.length} routes at 320px/390px/412px delayed-font, 390px/1440px route sweeps, representative 200% text and phone no-JS`);
} finally {
  await new Promise(resolveClose => server.close(resolveClose));
}
