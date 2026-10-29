import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { techExplainers, technologyDirectory, technologyListing, techSlugs } from '../src/generated/technology-data.mjs';
import { trackSupersededAborts } from './lib/navigation-aborts.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

// Focused technology gate, same harness as industries/blog-browser-check:
// - every generated route (listing + explainers) swept at 390px and 1440px:
//   HTTP 200, single source H1, preview noindex, no overflow, no heading
//   skips, source FAQ count, keyboard open/close/focus of the native FAQ
//   disclosure, source-derived related links, more grid and listing order;
// - the listing and the longest explainer that carries inline links: 320px,
//   200% text (every element doubled, H1 ratio proven, no clipping), contrast,
//   painted Bungee, reduced motion, keyboard mobile menu, consent banner;
// - delayed fonts on both: fallback capture, after-load capture, no layout
//   movement or clipping (font-display: optional, so no swap is expected);
// - no-JavaScript on the representative and the listing: native FAQ, inline
//   links, related and more grids, categories, cards, shared contact links.
// Owned read-only static server, explicit Chromium executable, sandbox on.
// Non-local requests: GET Cloudinary image requests (any number, each one
// recorded) and exactly one GET helpdesk report endpoint are mocked; every
// other external request, and any non-GET request to those, is denied and
// fails the run. "Local" means the
// exact served origin, not every 127.0.0.1 port. Every failed request on every
// page is recorded, none are suppressed. Nothing is written anywhere but
// evidence/.
// Expectations come from the generated data only; no display or SEO helper is
// imported, so the templates cannot vouch for themselves.
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
if (!techExplainers.length || techExplainers.length !== techSlugs.length) throw new Error('No technology explainers in the generated data; run scripts/extract-technology.mjs and npm run build first');
const projectDir = resolve(import.meta.dirname, '..');
const distDir = resolve(projectDir, 'dist');
const evidenceDir = resolve(projectDir, 'evidence', 'technology-browser');
const reportPath = resolve(evidenceDir, 'report.json');
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

// Route inventory and source-derived expectations.
const listingRoute = { name: 'listing', url: `${baseUrl}/technology/`, h1: 'Technology Explained', marker: '[data-technology-listing]' };
const detailRoutes = techExplainers.map(explainer => ({ name: explainer.slug, url: `${baseUrl}/technology/${explainer.slug}/`, h1: explainer.h1, marker: `[data-technology-explainer="${explainer.slug}"]`, explainer }));
const routes = [listingRoute, ...detailRoutes];
const expectedCategories = technologyListing.categories.filter(category => technologyListing.pages.some(page => page.category === category));
const expectedCards = expectedCategories.flatMap(category => technologyListing.pages.filter(page => page.category === category).map(page => `/technology/${page.slug}`));
const expectedMore = slug => technologyDirectory.filter(page => page.slug !== slug).map(page => `/technology/${page.slug}`);
const bodyOf = explainer => [explainer.whatItIs, explainer.howWeDoIt, ...explainer.faqs.map(faq => faq.a)].join('\n\n');
const LINK = /\[(.*?)\]\((.*?)\)/g;
const sourceLinks = explainer => [...bodyOf(explainer).matchAll(LINK)].map(match => match[2]);
const linked = detailRoutes.filter(route => sourceLinks(route.explainer).length > 0);
if (!linked.length) throw new Error('No explainer carries an inline link; the representative route cannot be chosen');
const representative = linked.reduce((longest, route) => bodyOf(route.explainer).length > bodyOf(longest.explainer).length ? route : longest);
// Top frame only: init scripts also run in the sandboxed Cyber Essentials badge frame, which has no storage.
const consentInit = () => window === window.top && localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
const phone = { name: 'phone', width: 390, height: 844 };
const desktop = { name: 'desktop', width: 1440, height: 1000 };

// Network policy: exact mocks for the two known non-local requests, deny the rest.
const cloudinaryImage = { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"/>' };
const helpdeskReportPrefix = 'https://helpdesk.fresh-tech.uk/api/ReportData/';
const isLocal = url => url.origin === baseUrl;
const network = { mockedImages: new Set(), metricsStubbed: new Set(), denied: [] };
const policy = (route, state) => {
  const request = route.request();
  const url = new URL(request.url());
  if (isLocal(url)) return route.continue();
  if (request.method() === 'GET' && isBlockmarkBadge(url)) return route.fulfill(BLOCKMARK_STUB);
  if (request.method() === 'GET' && url.hostname === 'res.cloudinary.com' && request.resourceType() === 'image') { network.mockedImages.add(url.href); return route.fulfill(cloudinaryImage); }
  if (request.method() === 'GET' && url.href.startsWith(helpdeskReportPrefix)) { network.metricsStubbed.add(url.href); return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }); }
  const entry = `${request.method()} ${url.href}`;
  network.denied.push(entry);
  state?.errors.push(`external request denied: ${entry}`);
  return route.abort('blockedbyclient');
};

const failures = [];
const screenshots = [];
const fontObservations = [];
let assertions = 0;
let status = 'error';
const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
const report = async () => {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify({
    status, generatedAt: new Date().toISOString(),
    runtime: { node: process.version, browserExecutable: executablePath.split(/[\\/]/).slice(-3).join('/') },
    routes: { count: routes.length, listing: '/technology/', explainers: techSlugs, representative: representative.name },
    expectations: { categories: expectedCategories, listingCards: expectedCards.length, directoryEntries: technologyDirectory.length, source: 'src/generated/technology-data.mjs only' },
    assertions, failures, screenshots, fontObservations,
    network: {
      mockedCloudinaryImages: [...network.mockedImages].sort(), metricsStubbed: [...network.metricsStubbed].sort(), denied: network.denied,
      note: `GET Cloudinary image responses are a local 1200x600 SVG mock; GET ${helpdeskReportPrefix}* (the retired metrics feed) is stubbed 503. No other external request, and no non-GET request, is allowed.`,
    },
    limitations: [
      'Hero images are mocked, so real image payload, decoding cost and Cloudinary availability are not measured here.',
      'Fonts use font-display: optional. The delayed-font pass proves the fallback layout does not move when the file arrives; it does not expect a swap to the web font.',
      'The 200% pass doubles every computed font size after load. It models text-only enlargement, not page zoom.',
      'Contrast is measured against solid ancestor background colours; the hero dot pattern is a low-alpha overlay and is not modelled.',
    ],
  }, null, 2)}\n`);
};

let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  await mkdir(evidenceDir, { recursive: true });
  // Every page collects console errors, page errors and every failed request
  // (local or not; denied external requests are already recorded by policy,
  // this keeps the browser-side failure too).
  const observe = page => {
    const state = { errors: [] };
    const superseded = trackSupersededAborts(page);
    page.on('console', message => { if (message.type() === 'error') state.errors.push(`console: ${message.text()}`); });
    page.on('pageerror', error => state.errors.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request => { if (!superseded(request)) state.errors.push(`requestfailed: ${request.method()} ${request.url()} (${request.failure()?.errorText || 'unknown'})`); });
    return state;
  };
  const configurePage = async page => {
    const state = observe(page);
    await page.route('**/*', route => policy(route, state));
    return state;
  };
  const newPage = async (viewport, options = {}) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, ...options.context });
    if (!options.noConsent) await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = await configurePage(page);
    return { context, page, state };
  };
  const shot = async (page, name) => { await page.screenshot({ path: resolve(evidenceDir, name), fullPage: false }); screenshots.push(name); };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const settle = page => page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const robots = page => page.locator('meta[name="robots"]').getAttribute('content');
  const hrefs = (page, selector) => page.locator(selector).evaluateAll(links => links.map(link => link.getAttribute('href')));
  const texts = (page, selector) => page.locator(selector).evaluateAll(nodes => nodes.map(node => node.textContent.trim()));
  const headingSkips = page => page.evaluate(() => {
    const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(heading => !heading.closest('[hidden], [aria-hidden="true"]') && heading.getClientRects().length > 0)
      .map(heading => ({ level: Number(heading.tagName.slice(1)), text: heading.textContent.trim().slice(0, 60) }));
    return levels.filter((heading, index) => index > 0 && heading.level > levels[index - 1].level + 1).map(heading => `h${heading.level} "${heading.text}"`);
  });
  const brokenWords = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const broken = [];
    for (const element of elements) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        // Whitespace and ordinary hyphens are legal break points; only a break inside a letter run counts.
        for (const match of node.textContent.matchAll(/[^\s\-‐]+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
          if (new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size > 1) broken.push(match[0]);
        }
      }
    }
    return broken;
  });
  // Text nodes under the selector whose painted rects escape an overflow-clipping ancestor.
  const clippedText = (page, selector) => page.locator(selector).evaluateAll(roots => {
    const clipped = [];
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!node.textContent.trim() || !parent || parent.closest('[hidden], [aria-hidden="true"]') || parent.getClientRects().length === 0) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        const rects = [...range.getClientRects()];
        for (let ancestor = parent; ancestor; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor);
          const clipsX = ['hidden', 'clip'].includes(style.overflowX);
          const clipsY = ['hidden', 'clip'].includes(style.overflowY);
          if (!clipsX && !clipsY) continue;
          const box = ancestor.getBoundingClientRect();
          if (rects.some(rect => (clipsX && (rect.left < box.left - 1 || rect.right > box.right + 1)) || (clipsY && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)))) { clipped.push(node.textContent.trim().slice(0, 60)); break; }
        }
      }
    }
    return clipped;
  });
  const contrast = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) => { const alpha = front.length > 3 ? front[3] : 1; return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha)); };
    const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return elements.filter(element => element.offsetParent !== null).map(element => {
      const layers = []; for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255]; for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = luminance(blend(channels(getComputedStyle(element).color), background));
      const behind = luminance(background); return (Math.max(foreground, behind) + .05) / (Math.min(foreground, behind) + .05);
    });
  });
  const paintedFonts = async (context, page, selector) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    await cdp.detach();
    return fonts;
  };
  // 200% text: snapshot every element's computed size, force each to double it,
  // then prove the H1 ratio and that no element missed the doubling.
  const doubleText = page => page.evaluate(() => {
    const elements = [document.documentElement, ...document.body.querySelectorAll('*')];
    const before = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    const h1 = document.querySelector('h1');
    const h1Before = parseFloat(getComputedStyle(h1).fontSize);
    elements.forEach((element, index) => { if (before[index] > 0) element.style.setProperty('font-size', `${before[index] * 2}px`, 'important'); });
    const mismatched = elements.filter((element, index) => before[index] > 0 && Math.abs(parseFloat(getComputedStyle(element).fontSize) - before[index] * 2) > .5).length;
    return { h1Before, h1After: parseFloat(getComputedStyle(h1).fontSize), elements: elements.length, mismatched };
  });
  const checkDoubled = async (page, label) => {
    const scale = await doubleText(page);
    await settle(page);
    check(scale.h1Before > 0 && Math.abs(scale.h1After - scale.h1Before * 2) <= .5, `${label}: H1 font size ${scale.h1Before}px did not double (${scale.h1After}px)`);
    check(scale.mismatched === 0, `${label}: ${scale.mismatched} of ${scale.elements} elements did not double their font size`);
    check(await noOverflow(page), `${label}: overflow at 200% text`);
    const clipped = await clippedText(page, 'main');
    check(clipped.length === 0, `${label}: enlarged text clipped: ${clipped.join(' | ')}`);
  };
  // Native disclosure from the keyboard: Enter opens, Enter closes, focus stays on the summary.
  const keyboardFaq = async (page, label) => {
    const details = page.locator('.tech-faq-list details').first();
    const summary = details.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    check(await details.evaluate(element => element.open), `${label}: FAQ did not open from the keyboard`);
    check(await details.locator('.tech-prose').isVisible(), `${label}: opened FAQ answer is not visible`);
    await page.keyboard.press('Enter');
    check(await details.evaluate(element => !element.open), `${label}: FAQ did not close from the keyboard`);
    check(await summary.evaluate(element => element === document.activeElement), `${label}: FAQ summary lost focus while toggling`);
  };

  // 1. Route sweep: every generated route at phone and desktop.
  for (const viewport of [phone, desktop]) {
    const { context, page, state } = await newPage(viewport);
    for (const route of routes) {
      state.errors.length = 0;
      const label = `${viewport.name}/${route.name}`;
      const response = await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      check(response?.status() === 200, `${label}: status ${response?.status() ?? 'none'}`);
      check(await page.locator('h1').count() === 1 && await page.locator('h1').innerText() === route.h1, `${label}: H1`);
      check(await page.locator(route.marker).count() === 1, `${label}: template marker`);
      check(await robots(page) === 'noindex, nofollow', `${label}: preview robots is not noindex, nofollow`);
      // Site navigation only; the explainer breadcrumb legitimately carries aria-current.
      check(await page.locator('.desktop-nav [aria-current="page"], [data-mobile-menu] [aria-current="page"]').count() === 0, `${label}: unexpected active navigation item`);
      check(await noOverflow(page), `${label}: overflow`);
      const skips = await headingSkips(page);
      check(skips.length === 0, `${label}: heading hierarchy skips a level at ${skips.join(', ')}`);
      check(await page.locator('main #contact').count() === 1 && await page.locator('main #contact h2').first().innerText() === 'Signal for Help', `${label}: shared contact section`);
      if (route.explainer) {
        check(await page.locator('.tech-faq-list details').count() === route.explainer.faqs.length, `${label}: FAQ count`);
        await keyboardFaq(page, label);
        check(JSON.stringify(await hrefs(page, '.tech-related-links a')) === JSON.stringify(route.explainer.related.map(service => `/services/${service.slug}`)), `${label}: related links`);
        check(JSON.stringify(await hrefs(page, '.tech-more-card')) === JSON.stringify(expectedMore(route.name)), `${label}: more grid`);
        // Semantic text, not innerText: the breadcrumb is rendered with CSS
        // text-transform: uppercase, which innerText reflects and textContent does not.
        // The source text and the aria-current marker are both still proven.
        check(await page.locator('.tech-breadcrumbs [aria-current="page"]').count() === 1 && (await page.locator('.tech-breadcrumbs [aria-current="page"]').textContent() || '').trim() === route.h1, `${label}: breadcrumb current item`);
      } else {
        check(JSON.stringify(await texts(page, '.tech-category h3')) === JSON.stringify(expectedCategories), `${label}: category order`);
        check(JSON.stringify(await hrefs(page, '.tech-topic-card')) === JSON.stringify(expectedCards), `${label}: card order`);
      }
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
    }
    await context.close();
  }

  // 2. Representative explainer and listing: contrast, painted Bungee, inline links, 200% text, keyboard menu.
  for (const route of [representative, listingRoute]) {
    for (const viewport of [phone, desktop]) {
      const { context, page, state } = await newPage(viewport);
      const label = `${viewport.name}/${route.name}`;
      const response = await page.goto(route.url, { waitUntil: 'networkidle' });
      check(response?.status() === 200, `${label}: status`);
      check(await page.locator('[data-cookie-banner]').isHidden(), `${label}: banner shown despite a stored consent decision`);
      check(await page.locator('a[href="/contact"]').count() >= 2, `${label}: contact links`);
      if (route.explainer) {
        check(JSON.stringify(await hrefs(page, '.tech-what .tech-prose a, .tech-how .tech-prose a, .tech-faq .tech-prose a')) === JSON.stringify(sourceLinks(route.explainer)), `${label}: inline prose links differ from source`);
        check(await page.locator('.tech-benefit-card').count() === route.explainer.benefits.length && await page.locator('.tech-risk-card').count() === route.explainer.risks.length, `${label}: card counts`);
        const ratios = await contrast(page, '.tech-eyebrow, .tech-breadcrumbs a, .tech-breadcrumbs [aria-current], .tech-hero-copy, .tech-primary-button, .tech-secondary-button, .tech-section-heading > p:last-child, .tech-prose, .tech-card h3, .tech-card p, .tech-faq-list summary, .tech-related-links a, .tech-more-card, .tech-cta p');
        check(ratios.length >= 14 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      } else {
        const ratios = await contrast(page, '.tech-eyebrow, .tech-hero-copy, .tech-intro p, .tech-section-heading > p:last-child, .tech-category h3, .tech-topic-card h4, .tech-topic-card p, .tech-topic-more, .tech-cta p, .tech-primary-button, .tech-secondary-button');
        check(ratios.length >= 11 && ratios.every(ratio => ratio >= 4.5), `${label}: contrast ${ratios.map(ratio => ratio.toFixed(2)).join(',')}`);
      }
      if (viewport.name === 'phone') {
        const fonts = await paintedFonts(context, page, '.tech-hero h1');
        check(fonts.some(font => /Bungee/i.test(font.familyName) && font.glyphCount > 0), `${label}: normal-load hero did not paint Bungee ${fonts.map(font => font.familyName).join(',')}`);
        fontObservations.push({ route: route.name, pass: 'normal load', h1Fonts: fonts.map(font => font.familyName) });
        await page.evaluate(() => scrollTo(0, 0));
        await shot(page, `${route.name}-phone-font-fast.png`);
        // Keyboard mobile menu: Enter opens, links visible, Escape closes and restores focus.
        const menu = page.locator('[data-mobile-menu]');
        await menu.locator('summary').focus();
        await page.keyboard.press('Enter');
        check(await menu.evaluate(element => element.open) && await menu.locator('nav a').first().isVisible(), `${label}: mobile menu did not open from the keyboard`);
        await page.keyboard.press('Escape');
        check(await menu.evaluate(element => !element.open) && await menu.locator('summary').evaluate(element => element === document.activeElement), `${label}: Escape did not close the mobile menu and restore focus`);
      }
      await shot(page, `${route.name}-${viewport.name}-top.png`);
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
      await checkDoubled(page, label);
      if (viewport.name === 'phone') await shot(page, `${route.name}-phone-200.png`);
      await context.close();
    }
  }

  // 3. 320px: every route for overflow; representative and listing also for heading words and 200% text.
  {
    const { context, page, state } = await newPage({ width: 320, height: 844 });
    for (const route of routes) {
      state.errors.length = 0;
      await page.goto(route.url);
      await page.evaluate(() => document.fonts.ready);
      check(await noOverflow(page), `320px/${route.name}: overflow`);
      const broken = await brokenWords(page, 'h1, .tech-section h2, .tech-card h3, .tech-category h3, .tech-topic-card h4');
      check(broken.length === 0, `320px/${route.name}: broken heading words ${broken.join(', ')}`);
      check(state.errors.length === 0, `320px/${route.name}: browser errors ${state.errors.join('; ')}`);
    }
    for (const route of [representative, listingRoute]) {
      state.errors.length = 0;
      await page.goto(route.url, { waitUntil: 'networkidle' });
      await checkDoubled(page, `320px/${route.name}`);
      await page.evaluate(() => scrollTo(0, 0));
      await shot(page, `${route.name}-320-200.png`);
      check(state.errors.length === 0, `320px/${route.name} 200%: browser errors ${state.errors.join('; ')}`);
    }
    await context.close();
  }

  // 4. Reduced motion: no effective transition remains on the cards or the FAQ
  // marker, and the FAQ still toggles. The global reduced-motion rule sets
  // transition-duration: .01ms !important, which overrides the local "none",
  // so computed durations are parsed and must be at most 0.00001s; anything
  // longer is a real transition and fails.
  const maxReducedSeconds = 0.00001 + 1e-9;
  const seconds = part => { const value = parseFloat(part); return part.trim().endsWith('ms') ? value / 1000 : value; };
  for (const route of [representative, listingRoute]) {
    const { context, page, state } = await newPage(phone, { context: { reducedMotion: 'reduce' } });
    await page.goto(route.url, { waitUntil: 'networkidle' });
    const durations = await page.locator('.tech-topic-card, .tech-more-card, .tech-faq-list summary b').evaluateAll(elements => elements.map(element => getComputedStyle(element).transitionDuration));
    const parsed = durations.flatMap(duration => duration.split(',').map(seconds));
    check(parsed.length > 0 && parsed.every(value => Number.isFinite(value) && value >= 0 && value <= maxReducedSeconds), `reduced-motion/${route.name}: transitions remain ${[...new Set(durations)].join(',')}`);
    if (route.explainer) await keyboardFaq(page, `reduced-motion/${route.name}`);
    check(state.errors.length === 0, `reduced-motion/${route.name}: browser errors ${state.errors.join('; ')}`);
    await context.close();
  }

  // 5. Consent without a stored decision: banner shown, keyboard Reject stores the denial, no vendor request.
  {
    const { context, page, state } = await newPage(phone, { noConsent: true });
    await page.goto(representative.url, { waitUntil: 'networkidle' });
    const banner = page.locator('[data-cookie-banner]');
    // The banner is mounted after a delay; networkidle does not mean it is shown yet.
    const bannerShown = await banner.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false);
    check(bannerShown && await banner.isVisible(), 'consent: banner hidden with no stored decision (not visible within 3s)');
    await page.locator('[data-consent="reject"]').focus();
    await page.keyboard.press('Enter');
    check(await banner.isHidden(), 'consent: banner still visible after keyboard Reject');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ft-cookie-consent-v1') || 'null'));
    check(stored && stored.analytics === false, 'consent: keyboard Reject did not store a denial');
    await delay(300);
    check(state.errors.length === 0, `consent: browser errors ${state.errors.join('; ')}`);
    await context.close();
  }

  // 6. Delayed fonts in the same document: the fallback layout must not move
  // when the font file arrives (font-display: optional never swaps late).
  const checkDelayedFont = async (width, route) => {
    let releaseFonts;
    const fontGate = new Promise(resolveGate => { releaseFonts = resolveGate; });
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.addInitScript(consentInit);
    const page = await context.newPage();
    const state = observe(page);
    await page.route('**/*', async gate => {
      const url = new URL(gate.request().url());
      if (isLocal(url) && url.pathname.startsWith('/fonts/')) { await fontGate; return gate.continue(); }
      return policy(gate, state);
    });
    const followSelector = route.explainer ? '.tech-hero .tech-actions' : '.tech-hero-copy';
    const geometry = () => page.evaluate(selector => ({
      bannerHeight: document.querySelector('.prototype-banner').getBoundingClientRect().height,
      followTop: document.querySelector(selector).getBoundingClientRect().top,
      headingHeight: document.querySelector('.tech-hero h1').getBoundingClientRect().height,
      fontStatus: document.fonts.status,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }), followSelector);
    const label = `${width}px/${route.name} delayed font`;
    try {
      await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await delay(200);
      await settle(page);
      const before = await geometry();
      const clippedBefore = await clippedText(page, '.tech-hero');
      if (width === 390) {
        await page.evaluate(() => scrollTo(0, 0));
        const cdp = await context.newCDPSession(page);
        const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        await cdp.detach();
        const name = `${route.name}-phone-font-slow-fallback.png`;
        await writeFile(resolve(evidenceDir, name), Buffer.from(capture.data, 'base64'));
        screenshots.push(name);
      }
      check(before.fontStatus === 'loading', `${label}: fonts loaded before the fallback capture`);
      releaseFonts();
      await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))));
      const after = await geometry();
      const clippedAfter = await clippedText(page, '.tech-hero');
      const fonts = await paintedFonts(context, page, '.tech-hero h1');
      fontObservations.push({ route: route.name, pass: `${width}px delayed font after load`, h1Fonts: fonts.map(font => font.familyName), swapped: fonts.some(font => /Bungee/i.test(font.familyName)) });
      if (width === 390) {
        await page.evaluate(() => scrollTo(0, 0));
        await shot(page, `${route.name}-phone-font-slow-after-load.png`);
      }
      check(Math.abs(after.bannerHeight - before.bannerHeight) <= .5, `${label}: banner moved ${before.bannerHeight}px to ${after.bannerHeight}px`);
      check(after.fontStatus === 'loaded', `${label}: fonts did not finish loading`);
      check(Math.abs(after.followTop - before.followTop) <= 1, `${label}: content below the heading moved ${after.followTop - before.followTop}px (heading ${before.headingHeight}px to ${after.headingHeight}px)`);
      check(before.overflow <= 0 && after.overflow <= 0, `${label}: overflow before ${before.overflow}px / after ${after.overflow}px`);
      check(clippedBefore.length === 0 && clippedAfter.length === 0, `${label}: hero text clipped before [${clippedBefore.join(' | ')}] after [${clippedAfter.join(' | ')}]`);
      check(state.errors.length === 0, `${label}: browser errors ${state.errors.join('; ')}`);
    } finally {
      releaseFonts(); await context.close();
    }
  };
  for (const width of [320, 390]) for (const route of [representative, listingRoute]) await checkDelayedFont(width, route);

  // Shared contact section without JavaScript. The frozen markup carries the
  // source contact links twice on purpose: .source-contact-info holds the
  // onboarding, tel:01584517234 and mailto links, and .source-contact-aside
  // holds the disabled ContactForm notice with its own tel:+441584517234 and
  // mailto links. Each block is asserted on its own, so a duplicate in either
  // is still caught while the other block cannot mask or fail it.
  const checkNoJsContact = async (page, label) => {
    const info = 'main #contact .source-contact-info';
    check(await page.locator(`${info} a[href="/onboarding"]`).count() === 1 && await page.locator(`${info} a[href="tel:01584517234"]`).count() === 1 && await page.locator(`${info} a[href="mailto:hello@fresh-tech.uk"]`).count() === 1, `${label}: shared contact onboarding, tel and email links`);
    const disabled = 'main #contact [data-contact-disabled]';
    check(await page.locator(disabled).count() === 1, `${label}: disabled contact form notice`);
    check(await page.locator(`${disabled} a[href="tel:+441584517234"]`).count() === 1 && await page.locator(`${disabled} a[href="mailto:hello@fresh-tech.uk"]`).count() === 1, `${label}: disabled contact form tel and email links`);
  };

  // 7. No JavaScript: native FAQ, inline links and both link grids still work.
  {
    const { context, page, state } = await newPage(phone, { context: { javaScriptEnabled: false } });
    const response = await page.goto(representative.url, { waitUntil: 'domcontentloaded' });
    check(response?.status() === 200, 'no-JS: status');
    check(await page.locator('.tech-faq-list details').count() === representative.explainer.faqs.length, 'no-JS: FAQs present');
    await keyboardFaq(page, 'no-JS');
    // Real pointer click on the closed summary (no force, no synthetic event).
    // global.css sets html { scroll-behavior: smooth }, and on this long
    // document the browser's own scroll-into-view after the keyboard toggle
    // plus Playwright's pre-click scroll can leave the summary oscillating, so
    // the click times out as "element is not stable". The product CSS is left
    // unchanged: scrollIntoView({ behavior: 'instant' }) overrides the smooth
    // behaviour for that one call, so the summary is placed deterministically
    // (instant, centred). With javaScriptEnabled: false, page-side callbacks
    // (requestAnimationFrame, promises) cannot be relied on to run, so no
    // frame-callback promise is awaited in the browser: the evaluate is
    // synchronous, and stability is proven from Node by sampling the
    // summary's bounding box at 100ms intervals (at most 10 samples) until
    // two consecutive samples are equal, finite and fully inside the viewport.
    const faq = page.locator('.tech-faq-list details').first();
    const summary = faq.locator('summary');
    const placement = await summary.evaluate(element => {
      element.scrollIntoView({ behavior: 'instant', block: 'center' });
      return { scrollY: window.scrollY, viewport: { width: innerWidth, height: innerHeight }, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, open: element.parentElement.open };
    });
    const roundBox = box => box && { top: Math.round(box.y * 100) / 100, left: Math.round(box.x * 100) / 100, width: box.width, height: box.height };
    const finiteBox = box => !!box && [box.top, box.left, box.width, box.height].every(Number.isFinite);
    const samples = [];
    let stable = false;
    for (let sample = 0; sample < 10 && !stable; sample++) {
      if (sample > 0) await delay(100);
      const box = roundBox(await summary.boundingBox());
      samples.push(box);
      const previous = samples[samples.length - 2];
      // Playwright's boundingBox is relative to the main frame viewport, so no scroll offset is applied.
      stable = finiteBox(previous) && finiteBox(box) && previous.top === box.top && previous.left === box.left && previous.width === box.width && previous.height === box.height
        && box.height > 0 && box.top >= 0 && box.top + box.height <= placement.viewport.height;
    }
    const pointerGeometry = { ...placement, samples };
    check(stable, `no-JS: FAQ summary not stable in the viewport before the pointer click ${JSON.stringify(pointerGeometry)}`);
    try {
      await summary.click({ timeout: 10000 });
    } catch (error) {
      const debug = await summary.evaluate(element => { const box = element.getBoundingClientRect(); return { top: box.top, left: box.left, width: box.width, height: box.height, scrollY: window.scrollY, viewport: { width: innerWidth, height: innerHeight }, open: element.parentElement.open, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior }; }).catch(() => 'unavailable');
      check(false, `no-JS: pointer click on the FAQ summary failed: ${error.message.split('\n')[0]} geometry ${JSON.stringify({ before: pointerGeometry, after: debug })}`);
    }
    check(await faq.evaluate(element => element.open), 'no-JS: native FAQ does not open on click');
    check(JSON.stringify(await hrefs(page, '.tech-what .tech-prose a, .tech-how .tech-prose a, .tech-faq .tech-prose a')) === JSON.stringify(sourceLinks(representative.explainer)), 'no-JS: inline prose links differ from source');
    check(await page.locator('.tech-related-links a').count() === representative.explainer.related.length, 'no-JS: related links present');
    check(await page.locator('.tech-more-card').count() === expectedMore(representative.name).length, 'no-JS: more grid present');
    check(await noOverflow(page), 'no-JS: phone overflow');
    await checkNoJsContact(page, 'no-JS');
    check(state.errors.length === 0, `no-JS: browser errors ${state.errors.join('; ')}`);
    await context.close();
  }

  // 8. No JavaScript on the listing: categories, cards, shared contact links, preview noindex, no overflow.
  {
    const { context, page, state } = await newPage(phone, { context: { javaScriptEnabled: false } });
    const response = await page.goto(listingRoute.url, { waitUntil: 'domcontentloaded' });
    check(response?.status() === 200, 'no-JS listing: status');
    check(await page.locator('h1').count() === 1 && await page.locator('h1').innerText() === listingRoute.h1, 'no-JS listing: H1');
    check(JSON.stringify(await texts(page, '.tech-category h3')) === JSON.stringify(expectedCategories), 'no-JS listing: category order');
    check(JSON.stringify(await hrefs(page, '.tech-topic-card')) === JSON.stringify(expectedCards), 'no-JS listing: card order');
    await checkNoJsContact(page, 'no-JS listing');
    check(await robots(page) === 'noindex, nofollow', 'no-JS listing: preview robots is not noindex, nofollow');
    check(await noOverflow(page), 'no-JS listing: phone overflow');
    check(state.errors.length === 0, `no-JS listing: browser errors ${state.errors.join('; ')}`);
    await context.close();
  }

  check(network.denied.length === 0, `external requests denied: ${network.denied.join(', ')}`);
  status = failures.length ? 'failed' : 'passed';
  if (failures.length) throw new Error(`${failures.length} technology browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} technology browser assertions passed across ${routes.length} routes (390px/1440px sweeps with keyboard FAQ, 320px words and overflow, representative ${representative.name} + listing at 200% text, contrast, painted Bungee, reduced motion, keyboard menu, consent, 320px/390px delayed fonts and phone no-JS on the representative and the listing). Report: ${reportPath}`);
} finally {
  // Report first, then close the browser so no page connection keeps the server alive.
  await report();
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); process.exitCode = 1; }
  }
  await new Promise(resolveClose => server.close(resolveClose));
}
