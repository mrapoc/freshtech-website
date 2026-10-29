import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { blogPosts } from '../src/generated/blog-data.mjs';
import { allCategories, featuredPosts, listingPosts, relatedPosts } from '../src/lib/blog-display.mjs';
import { hasList, hasTable } from '../src/lib/blog-markdown.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

// Economical blog gate derived from industries-browser-check.mjs:
// - every generated route (listing + articles) swept at phone and desktop;
// - every route at 320px for document overflow, listing heading words intact;
// - the representative article (longest body that carries a table and a list)
//   and the listing at 320px/200% text, keyboard filtering, contrast, painted
//   Bungee, slow-font same-document geometry and no-JS;
// - the first image article and first video article with late, non-matching
//   synthetic hero media to prove the reserved media box does not move.
// Owned static server, explicit Chromium executable, sandbox on, and all
// non-local requests blocked (Cloudinary images and media stubbed) so no
// provider write can occur.
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
if (!blogPosts.length) throw new Error('No published blog posts in the generated data; run scripts/extract-blog.mjs first');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(projectDir, 'dist');
const evidenceDir = resolve(projectDir, 'evidence', 'blog-browser');
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

const sorted = listingPosts(blogPosts);
const categories = allCategories(sorted);
const listingRoute = { name: 'listing', url: `${baseUrl}/blog/`, h1: 'The IT blog nobody asked for.', marker: '[data-blog-page]' };
const articleRoutes = blogPosts.map(post => ({ name: post.slug, url: `${baseUrl}/blog/${post.slug}/`, h1: post.title, marker: `[data-blog-post="${post.slug}"]`, post }));
const routes = [listingRoute, ...articleRoutes];
const richest = articleRoutes.filter(route => hasTable(route.post.content) && hasList(route.post.content));
const representative = (richest.length ? richest : articleRoutes).reduce((longest, route) => route.post.content.length > longest.post.content.length ? route : longest);
// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
const stubImage = { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" />' };
const stubMedia = { status: 200, contentType: 'video/mp4', body: '' };

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
    if (url.hostname === 'res.cloudinary.com') return route.fulfill(route.request().resourceType() === 'media' ? stubMedia : stubImage);
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
        for (const match of node.textContent.matchAll(/\S+/g)) {
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
  const visibleCards = page => page.locator('.blog-card:visible').count();
  // Cheap outline check run on every route in the sweep so an orphan ### that
  // escapes the tokeniser is caught here before the full emitted-quality CI
  // gate: rendered (non-hidden) headings must never skip a level.
  const headingSkips = page => page.evaluate(() => {
    const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(heading => !heading.closest('[hidden], [aria-hidden="true"]') && heading.getClientRects().length > 0)
      .map(heading => ({ level: Number(heading.tagName.slice(1)), text: heading.textContent.trim().slice(0, 60) }));
    return levels.filter((heading, index) => index > 0 && heading.level > levels[index - 1].level + 1).map(heading => `h${heading.level} "${heading.text}"`);
  });
  // 200% text: changing only the root font size misses every px-sized rule, so
  // snapshot the computed size of every element first and then double each one
  // explicitly. Returns the H1 size before and after so the doubling is proven.
  const doubleText = page => page.evaluate(() => {
    const elements = [document.body, ...document.body.querySelectorAll('*')];
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const h1 = document.querySelector('h1');
    const h1Before = parseFloat(getComputedStyle(h1).fontSize);
    elements.forEach((element, index) => { if (sizes[index] > 0) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
    return { h1Before, h1After: parseFloat(getComputedStyle(h1).fontSize) };
  });
  const checkDoubled = ({ h1Before, h1After }, label) => check(h1Before > 0 && Math.abs(h1After - h1Before * 2) <= .5, `${label}: H1 font size ${h1Before}px did not double (${h1After}px)`);
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
      check(await noOverflow(page), `${viewport.name}/${route.name}: overflow`);
      const skips = await headingSkips(page);
      check(skips.length === 0, `${viewport.name}/${route.name}: heading hierarchy skips a level at ${skips.join(', ')}`);
      check(state.errors.length === 0, `${viewport.name}/${route.name}: browser errors ${state.errors.join('; ')}`);
      if (route.post) {
        check(await page.locator('.blog-related-card').count() === relatedPosts(blogPosts, route.post.slug).length, `${viewport.name}/${route.name}: related count`);
        check(await page.locator('.blog-article').count() === 1, `${viewport.name}/${route.name}: article body`);
      } else {
        check(await page.locator('.blog-card').count() === sorted.length && await visibleCards(page) === sorted.length, `${viewport.name}/${route.name}: all published cards visible`);
        check(await page.locator('.blog-filters').isVisible(), `${viewport.name}/${route.name}: enhanced filter toolbar revealed`);
      }
    }
    check(state.external.every(host => host === 'res.cloudinary.com'), `${viewport.name}: unexpected external hosts ${state.external.join(',')}`);
    await context.close();
  }

  // 2. 320px: no document overflow on any route; listing heading words intact.
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    await configurePage(page);
    for (const route of routes) {
      await page.goto(route.url);
      await page.evaluate(() => document.fonts.ready);
      check(await noOverflow(page), `320px/${route.name}: overflow`);
      if (!route.post) {
        const broken = await brokenWords(page, 'h1, .blog-card h3, .blog-count');
        check(broken.length === 0, `320px/${route.name}: broken heading words ${broken.join(', ')}`);
      }
    }
    await context.close();
  }

  // 3. Representative article and listing: interaction, contrast, painted Bungee, 200% text.
  for (const route of [representative, listingRoute]) {
    for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(consentInit);
      const page = await context.newPage();
      const state = await configurePage(page);
      const response = await page.goto(route.url, { waitUntil: 'networkidle' });
      const label = `${viewport.name}/${route.name}`;
      check(response?.status() === 200, `${label}: status`);
      check(await page.locator('a[href="/contact"]').count() >= 1, `${label}: contact link`);
      if (route.post) {
        check(await page.locator('.blog-article table').count() >= 1 && await page.locator('.blog-article li').count() >= 1, `${label}: representative table and list present`);
        const wrap = page.locator('.blog-table-wrap').first();
        await wrap.focus();
        check(await wrap.evaluate(element => element === document.activeElement), `${label}: table region is keyboard focusable`);
        const ratios = await contrast(page, '.blog-back a, .blog-badge, .blog-author-chip-light .blog-meta, .blog-excerpt, .blog-article p, .blog-article li, .blog-article td, .blog-article th, .blog-article a, .blog-article h2, .blog-eyebrow, .blog-related-card p, .blog-cta p, .blog-button-accent');
        check(ratios.length >= 10 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      } else {
        const hrefs = await page.locator('.blog-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')));
        check(JSON.stringify(hrefs) === JSON.stringify(sorted.map(post => `/blog/${post.slug}`)), `${label}: card order`);
        check(await page.locator('.blog-featured-card').count() === featuredPosts(sorted).length, `${label}: featured count`);
        // Keyboard: Tab from the first chip to the second, activate with Enter, then Space back to All.
        const chips = page.locator('.blog-filters button');
        if (categories.length > 1) {
          const category = categories[1];
          const expected = sorted.filter(post => post.category === category).length;
          await chips.first().focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
          check(await chips.nth(1).getAttribute('aria-pressed') === 'true' && await chips.first().getAttribute('aria-pressed') === 'false', `${label}: chip pressed state`);
          check(await visibleCards(page) === expected, `${label}: filtered card count for ${category}`);
          check((await page.locator('[data-filter-count]').innerText()) === `${expected} ${expected === 1 ? 'article' : 'articles'}`, `${label}: filtered count label`);
          check((await page.locator('[data-filter-label]').textContent()) === category, `${label}: filtered eyebrow label`);
          check(await page.locator('[data-blog-featured]').isHidden(), `${label}: featured hidden outside All`);
          await chips.first().focus(); await page.keyboard.press('Space');
          check(await visibleCards(page) === sorted.length && await page.locator('[data-blog-featured]').isVisible(), `${label}: All restores every card and the featured block`);
          // Hero category links filter in place without navigating.
          const heroLink = page.locator('.blog-category-browser a[data-filter]').nth(1);
          const heroCategory = await heroLink.getAttribute('data-filter');
          await heroLink.focus(); await page.keyboard.press('Enter');
          check(!page.url().includes('#') && await heroLink.getAttribute('aria-current') === 'true' && await visibleCards(page) === sorted.filter(post => post.category === heroCategory).length, `${label}: hero category link filters in place`);
          await chips.first().click();
        }
        // Settle the chip colour transitions (reduced motion sets transition: none) so contrast is not sampled mid-fade.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const ratios = await contrast(page, '.blog-hero-note, .blog-hero-copy, .blog-category-browser a span, .blog-category-browser a b, .blog-category-more, .blog-badge, .blog-featured-body > p, .blog-featured-body .blog-meta, .blog-featured-body .blog-read, .blog-eyebrow, .blog-filters button, .blog-card-body > p, .blog-meta, .blog-read, .blog-cta-strip p, .blog-button-paper, .blog-button-outline');
        check(ratios.length >= 14 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
        // Restore normal motion: global reduced-motion CSS gives every element a transition duration, which would delay the 200% text read below.
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      if (viewport.name === 'phone') {
        const fonts = await paintedBungee(context, page, '.blog-hero h1');
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

  // 3b. Representative article at 320px and 200% text: the table scrolls inside its region, the document does not.
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    await configurePage(page);
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    checkDoubled(await doubleText(page), `320px/${representative.name}`);
    await settle(page);
    check(await noOverflow(page), `320px/${representative.name}: overflow at 200% text`);
    const wrapScrolls = await page.locator('.blog-table-wrap').first().evaluate(element => getComputedStyle(element).overflowX === 'auto');
    check(wrapScrolls, `320px/${representative.name}: table wrapper is not horizontally scrollable`);
    await page.evaluate(() => document.querySelector('.blog-table-wrap').scrollIntoView());
    await page.screenshot({ path: resolve(evidenceDir, `${representative.name}-320-200-table.png`), fullPage: false });
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
    const followSelector = route.post ? '.blog-author-chip-light' : '.blog-hero-copy';
    const geometry = () => page.evaluate(selector => ({
      bannerHeight: document.querySelector('.prototype-banner').getBoundingClientRect().height,
      followTop: document.querySelector(selector).getBoundingClientRect().top,
      headingHeight: document.querySelector('.blog-hero h1').getBoundingClientRect().height,
      fontStatus: document.fonts.status,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }), followSelector);
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
      if (width === 390) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-font-slow-after-load.png`), fullPage: false });
      }
      check(Math.abs(after.bannerHeight - before.bannerHeight) <= .5, `${label}: banner moved ${before.bannerHeight}px to ${after.bannerHeight}px`);
      check(after.fontStatus === 'loaded', `${label}: fonts did not finish loading`);
      check(Math.abs(after.followTop - before.followTop) <= 1, `${label}: content below the heading moved ${after.followTop - before.followTop}px (heading ${before.headingHeight}px to ${after.headingHeight}px)`);
      check(before.overflow <= 0 && after.overflow <= 0, `${label}: overflow before ${before.overflow}px / after ${after.overflow}px`);
    } finally {
      releaseFonts(); await context.close();
    }
  };
  for (const width of [320, 390]) for (const route of [representative, listingRoute]) await checkDelayedFont(width, route);

  // 4b. Late hero media whose ratio (4:5) matches neither the 16:9 image frame
  // nor the 9:16 video frame: the reserved box and the article below must not
  // move when it arrives, and the asset is letterboxed rather than cropped.
  // Synthetic SVG fixture only: this proves the frame geometry, not the real
  // Cloudinary assets, whose dimensions are never fetched here.
  const lateStub = { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="#c00"/></svg>' };
  const mediaRoutes = [articleRoutes.find(route => route.post.image && !route.post.video), articleRoutes.find(route => route.post.video)].filter(Boolean);
  const checkLateMedia = async (width, route) => {
    let releaseMedia;
    const mediaGate = new Promise(resolveGate => { releaseMedia = resolveGate; });
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = { errors: [], external: [] };
    page.on('pageerror', error => state.errors.push(error.message));
    await page.route('**/*', async gate => {
      const url = new URL(gate.request().url());
      if (url.hostname === 'res.cloudinary.com' && gate.request().resourceType() === 'image') { await mediaGate; return gate.fulfill(lateStub); }
      return routeExternal(gate, state);
    });
    const isVideo = Boolean(route.post.video);
    const geometry = () => page.evaluate(() => {
      const frame = document.querySelector('.blog-media-frame').getBoundingClientRect();
      const media = document.querySelector('.blog-media-frame img, .blog-media-frame video');
      return {
        frameTop: frame.top, frameWidth: frame.width, frameHeight: frame.height,
        excerptTop: document.querySelector('.blog-excerpt').getBoundingClientRect().top,
        fit: getComputedStyle(media).objectFit,
        complete: media.complete ?? null, naturalWidth: media.naturalWidth ?? null, naturalHeight: media.naturalHeight ?? null,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const label = `${width}px/${route.name} late ${isVideo ? 'poster' : 'image'}`;
    try {
      await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await delay(200);
      await settle(page);
      const before = await geometry();
      check(before.frameHeight > 0 && before.frameWidth > 0, `${label}: frame has no reserved box before media arrives`);
      if (!isVideo) check(before.complete === false, `${label}: image loaded before the fallback capture`);
      releaseMedia();
      if (isVideo) await delay(300);
      else await page.waitForFunction(() => document.querySelector('.blog-media-frame img').naturalWidth > 0, null, { timeout: 5000 });
      await settle(page);
      const after = await geometry();
      // srcset scales natural size by the chosen candidate's density, so assert the fixture's 4:5 shape, not 800x1000.
      if (!isVideo) check(after.naturalWidth > 0 && Math.abs(after.naturalWidth / after.naturalHeight - .8) < .01, `${label}: non-matching fixture did not arrive (${after.naturalWidth}x${after.naturalHeight})`);
      check(after.fit === 'contain', `${label}: media is not object-fit: contain (${after.fit})`);
      check(Math.abs(after.frameTop - before.frameTop) <= .5 && Math.abs(after.frameWidth - before.frameWidth) <= .5 && Math.abs(after.frameHeight - before.frameHeight) <= .5, `${label}: frame moved from ${before.frameWidth}x${before.frameHeight}@${before.frameTop} to ${after.frameWidth}x${after.frameHeight}@${after.frameTop}`);
      check(Math.abs(after.excerptTop - before.excerptTop) <= .5, `${label}: article moved ${after.excerptTop - before.excerptTop}px when media arrived`);
      check(before.overflow <= 0 && after.overflow <= 0, `${label}: overflow before ${before.overflow}px / after ${after.overflow}px`);
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      if (width === 390) {
        await page.evaluate(() => document.querySelector('.blog-media-frame').scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: resolve(evidenceDir, `${route.name}-phone-late-media.png`), fullPage: false });
      }
    } finally {
      releaseMedia(); await context.close();
    }
  };
  for (const route of mediaRoutes) for (const width of [390, 1440]) await checkLateMedia(width, route);

  // 5. No JavaScript: full content, hidden chip toolbar, hero links jump to the list, native table and lists.
  const noJsContext = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const noJsPage = await noJsContext.newPage();
  const noJsState = await configurePage(noJsPage);
  const listingResponse = await noJsPage.goto(listingRoute.url, { waitUntil: 'domcontentloaded' });
  check(listingResponse?.status() === 200, 'no-JS listing: status');
  check(await visibleCards(noJsPage) === sorted.length, 'no-JS listing: every published card visible');
  check(await noJsPage.locator('.blog-filters').isHidden(), 'no-JS listing: chip toolbar stays hidden');
  check(await noJsPage.locator('.blog-featured-card').count() === featuredPosts(sorted).length, 'no-JS listing: featured block present');
  await noJsPage.locator('.blog-category-browser a[data-filter]').first().click();
  check(noJsPage.url().endsWith('#all-articles'), 'no-JS listing: hero category link jumps to the article list');
  check(await noOverflow(noJsPage), 'no-JS listing: phone overflow');
  const articleResponse = await noJsPage.goto(representative.url, { waitUntil: 'domcontentloaded' });
  check(articleResponse?.status() === 200, 'no-JS article: status');
  check(await noJsPage.locator('.blog-article table').count() >= 1 && await noJsPage.locator('.blog-article li').count() >= 1, 'no-JS article: table and list remain present');
  check(await noJsPage.locator('.blog-related-card').count() === relatedPosts(blogPosts, representative.post.slug).length, 'no-JS article: related cards present');
  check(await noOverflow(noJsPage), 'no-JS article: phone overflow');
  check(noJsState.errors.length === 0, `no-JS: browser errors ${noJsState.errors.join('; ')}`);
  await noJsContext.close();

  if (failures.length) throw new Error(`${failures.length} blog browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} blog browser assertions passed across ${routes.length} routes (390px/1440px sweeps, 320px overflow, representative ${representative.name} + listing at 200% text, keyboard filters, painted Bungee, 320px/390px delayed fonts, late synthetic hero media on ${mediaRoutes.length} route(s) and phone no-JS)`);
} finally {
  // Close the browser first so no page connections keep the server alive.
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; }
  }
  await new Promise(resolveClose => server.close(resolveClose));
}
