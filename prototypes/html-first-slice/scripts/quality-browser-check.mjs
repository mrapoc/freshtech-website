import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { mainMarker } from './lib/service-location-inventory.mjs';
import { prepareLazyImages } from './lib/quality-browser-images.mjs';
import { PROOF_ENDPOINT_STUB, isProofEndpointRequest } from './lib/proof-endpoints.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

const projectDir = resolve(import.meta.dirname, '..');
// QUALITY_DIST_DIR audits another build directory (for example dist-production);
// unset keeps the default preview dist.
const distDir = resolve(projectDir, process.env.QUALITY_DIST_DIR || 'dist');
const reportPath = resolve(projectDir, process.env.QUALITY_BROWSER_REPORT || 'evidence/quality-browser/report.json');
const moduleName = process.env.PLAYWRIGHT_MODULE || 'playwright';
const playwright = createRequire(import.meta.url)(moduleName);

const routes = (await readdir(distDir, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name === 'index.html')
  .map(entry => {
    const directory = relative(distDir, entry.parentPath);
    return directory ? `/${directory.split(sep).join('/')}/` : '/';
  })
  .sort((a, b) => a.localeCompare(b))
  // Local diagnosis only: QUALITY_ONLY_ROUTES="/faq/,/about/" audits just those
  // routes. CI never sets it, so the release gate always audits every route.
  .filter(route => !process.env.QUALITY_ONLY_ROUTES || process.env.QUALITY_ONLY_ROUTES.split(',').includes(route));
if (!routes.length) throw new Error(`No built routes found under ${distDir}; run npm run build first.`);
if (new Set(routes).size !== routes.length) throw new Error('Built route discovery returned duplicates.');

// Root-slug service-location family representative: the first emitted route in
// sorted order whose <main> carries data-service-location-page (parsed, not a
// URL-prefix guess, so a standalone /microsoft-365-plans-compared is skipped).
let serviceLocationRepresentative;
for (const route of routes) {
  const html = await readFile(resolve(distDir, ...route.split('/').filter(Boolean), 'index.html'), 'utf8');
  if (mainMarker(html) !== null) { serviceLocationRepresentative = route; break; }
}

const port = await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.unref();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    if (!address || typeof address === 'string') return reject(new Error('Could not reserve a preview port.'));
    probe.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--outDir', distDir, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: projectDir,
  // Any non-empty value disables Astro 7's agent-triggered background mode.
  // The CLI only detaches when --background is set; "0" keeps this child owned.
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ASTRO_PREVIEW_BACKGROUND: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });

const failures = [];
const findings = [];
const coverage = [];
const requestedExternalHosts = new Set();
const mockedImageUrls = new Set();
const mockedMediaUrls = new Set();
// Cloudinary fixtures, strictly scoped by resource type (mirrors the focused
// blog-browser-check stubs). Anything else from that host is still an
// unexpected external request and fails the run.
const cloudinaryFixtures = {
  image: { status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"/>' },
  media: { status: 200, contentType: 'video/mp4', body: '' },
};
const vendorHosts = new Set(['www.googletagmanager.com', 'www.google-analytics.com', 'analytics.google.com', 'www.clarity.ms', 'c.clarity.ms']);
let assertions = 0;
let resolvedContrastCandidates = 0;
let unresolvedContrastCandidates = 0;
const unresolvedContrastSamples = new Map();
const check = (condition, message, details = {}) => {
  assertions++;
  if (!condition) failures.push({ message, ...details });
};

const report = async status => {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify({
    status,
    generatedAt: new Date().toISOString(),
    source: { gitCommit: process.env.QUALITY_SOURCE_COMMIT || null, routeDiscovery: `${relative(projectDir, distDir).split(sep).join('/')}/**/index.html` },
    runtime: { node: process.version, browserExecutable: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.split(/[\\/]/).slice(-3).join('/') || 'Playwright bundled Chromium' },
    coverage: {
      discoveredRoutes: routes,
      routeCount: routes.length,
      viewportRuns: coverage,
      assertions,
      representativeFamilies: representativeRoutes,
      contrast: {
        resolvedCandidates: resolvedContrastCandidates,
        unresolvedCandidates: unresolvedContrastCandidates,
        unresolvedSamples: [...unresolvedContrastSamples.values()].slice(0, 100),
      },
    },
    network: {
      externalHostsObserved: [...requestedExternalHosts].sort(),
      mockedExternalImageCount: mockedImageUrls.size,
      mockedExternalMediaCount: mockedMediaUrls.size,
      note: 'External Cloudinary image responses are local SVG mocks and Cloudinary media (video) responses are empty video/mp4 mocks. Results prove element semantics and intrinsic layout only, not remote availability.',
    },
    findings,
    failures,
    limitations: [
      'Contrast uses computed colours and ancestor solid backgrounds; text over background images or gradients is reported as unresolved instead of guessed.',
      'Image and video availability are not tested because external Cloudinary images and media are mocked.',
      'The 200% pass doubles every element computed font size after load. It models WCAG text-only enlargement, not page zoom or operating-system magnification.',
      'No-JavaScript and route-specific interactions remain covered by the existing focused browser gates, not repeated across every route here.',
    ],
  }, null, 2)}\n`);
};

const representativeRoutes = [
  '/', '/pricing/', '/contact/', '/services/', '/services/managed-it-support/', '/case-studies/',
  routes.find(route => route.startsWith('/case-studies/') && route !== '/case-studies/'),
  routes.find(route => route.startsWith('/locations/')),
  routes.find(route => route === '/industries/'),
  routes.find(route => route.startsWith('/industries/') && route !== '/industries/'),
  routes.find(route => route === '/blog/'),
  routes.find(route => route.startsWith('/blog/') && route !== '/blog/'),
  serviceLocationRepresentative,
  routes.find(route => route === '/technology/'),
  // Routes are sorted, so this is always the first explainer alphabetically.
  routes.find(route => route.startsWith('/technology/') && route !== '/technology/'),
  // Guides have no listing route; the first emitted detail (sorted, so deterministic).
  routes.find(route => route.startsWith('/guides/') && route !== '/guides/'),
].filter(Boolean);

const installNetworkPolicy = async page => {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    // Public proof feeds have no static handler; stub exactly those GETs (the
    // shared list includes the homepage's /api/google-rating, which main's
    // inline pattern also covered). Any other /api request reaches the preview
    // server and its 404 fails the route.
    if (isProofEndpointRequest({ method: route.request().method(), url: url.href, baseOrigin: baseUrl })) return route.fulfill(PROOF_ENDPOINT_STUB);
    if (url.origin === baseUrl) return route.continue();
    if (route.request().method() === 'GET' && isBlockmarkBadge(url)) return route.fulfill(BLOCKMARK_STUB);
    requestedExternalHosts.add(url.hostname);
    if (url.hostname === 'res.cloudinary.com') {
      const resourceType = route.request().resourceType();
      if (resourceType === 'image') { mockedImageUrls.add(url.href); return route.fulfill(cloudinaryFixtures.image); }
      if (resourceType === 'media') { mockedMediaUrls.add(url.href); return route.fulfill(cloudinaryFixtures.media); }
      // Any other Cloudinary resource type falls through to the unexpected-request failure below.
    }
    if (url.hostname === 'helpdesk.fresh-tech.uk') {
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    }
    if (vendorHosts.has(url.hostname)) {
      failures.push({ message: 'Analytics vendor requested before consent.', route: page.url(), url: url.href });
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    }
    failures.push({ message: 'Unexpected external request.', route: page.url(), url: url.href });
    return route.abort('blockedbyclient');
  });
};

const auditDocument = page => page.evaluate(() => {
  const visible = element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const visuallyHidden = element.matches('.visually-hidden, .sr-only')
      || (style.position === 'absolute' && style.overflow === 'hidden'
        && (style.clip !== 'auto' || style.clipPath !== 'none' || (rect.width <= 2 && rect.height <= 2)));
    return !visuallyHidden && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  };
  const parseColour = value => {
    if (!/^rgba?\(/i.test(value)) return null;
    const parts = value.match(/[\d.]+/g)?.map(Number) || [];
    return parts.length >= 3 ? [parts[0], parts[1], parts[2], parts[3] ?? 1] : null;
  };
  const blend = (foreground, background) => {
    const alpha = foreground[3];
    return [
      foreground[0] * alpha + background[0] * (1 - alpha),
      foreground[1] * alpha + background[1] * (1 - alpha),
      foreground[2] * alpha + background[2] * (1 - alpha),
      1,
    ];
  };
  const luminance = colour => {
    const values = colour.slice(0, 3).map(channel => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  };
  const ratio = (a, b) => {
    const first = luminance(a);
    const second = luminance(b);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  };
  const identify = element => {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const classes = [...element.classList].slice(0, 3).map(value => `.${CSS.escape(value)}`).join('');
    const parent = element.parentElement;
    const parentLabel = parent ? `${parent.localName}${[...parent.classList].slice(0, 2).map(value => `.${CSS.escape(value)}`).join('')}` : '';
    return `${parentLabel ? `${parentLabel} > ` : ''}${element.localName}${classes}`;
  };
  const textCandidates = [...document.body.querySelectorAll('*')].filter(element => {
    if (!visible(element) || element.closest('[aria-hidden="true"], [hidden]')) return false;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(element.tagName)) return false;
    // Native range, colour and selection controls do not paint their value as text.
    if (element.tagName === 'INPUT' && ['range', 'color', 'checkbox', 'radio', 'hidden', 'image'].includes(element.type)) return false;
    const renderedText = (element.innerText || element.value || '').trim();
    if (!renderedText) return false;
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(element.tagName)) return true;
    return [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  });
  const contrastFailures = [];
  const unresolvedContrast = [];
  for (const element of textCandidates) {
    const style = getComputedStyle(element);
    let background = [255, 255, 255, 1];
    let unresolvedBackground = false;
    let unresolvedOpacity = false;
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.push(node);
    for (const node of ancestors.reverse()) {
      const nodeStyle = getComputedStyle(node);
      const colour = parseColour(nodeStyle.backgroundColor);
      if (Number(nodeStyle.opacity) !== 1) unresolvedOpacity = true;
      if (colour && colour[3] > 0) {
        background = blend(colour, background);
        if (colour[3] === 1) unresolvedBackground = false;
      } else if (!colour) unresolvedBackground = true;
      // Background images paint above background colours, even opaque ones.
      if (nodeStyle.backgroundImage !== 'none') unresolvedBackground = true;
    }
    const foregroundSource = parseColour(style.color);
    if (!foregroundSource) {
      unresolvedContrast.push({ selector: identify(element), text: (element.innerText || element.value || '').trim().replace(/\s+/g, ' ').slice(0, 100), reason: 'unsupported foreground colour', colour: style.color });
      continue;
    }
    const foreground = blend(foregroundSource, background);
    const measured = ratio(foreground, background);
    const size = Number.parseFloat(style.fontSize);
    const weight = Number.parseInt(style.fontWeight, 10) || (style.fontWeight === 'bold' ? 700 : 400);
    const threshold = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
    const details = { selector: identify(element), text: (element.innerText || element.value || '').trim().replace(/\s+/g, ' ').slice(0, 100), ratio: Number(measured.toFixed(2)), threshold };
    if (unresolvedBackground || unresolvedOpacity) unresolvedContrast.push(details);
    else if (measured + 0.005 < threshold) contrastFailures.push(details);
  }
  const images = [...document.images].filter(visible).map(image => ({
    src: image.currentSrc || image.src,
    alt: image.getAttribute('alt'),
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    widthAttribute: image.getAttribute('width'),
    heightAttribute: image.getAttribute('height'),
  }));
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(heading => ({ level: Number(heading.tagName.slice(1)), text: heading.textContent.trim().slice(0, 100) }));
  const headingSkips = headings.slice(1).filter((heading, index) => heading.level > headings[index].level + 1);
  const seconds = value => value.split(',').map(part => part.trim().endsWith('ms') ? Number.parseFloat(part) / 1000 : Number.parseFloat(part)).filter(Number.isFinite);
  const motionDurations = [...document.body.querySelectorAll('*')].filter(visible).flatMap(element => {
    const style = getComputedStyle(element);
    return [...seconds(style.transitionDuration), ...seconds(style.animationDuration)].map(duration => ({ selector: identify(element), duration }));
  }).filter(item => item.duration > 0.01);
  const skip = document.querySelector('a.skip-link');
  const target = skip?.hash ? document.querySelector(skip.hash) : null;
  const clippedText = textCandidates.flatMap(element => [...element.childNodes]
    .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
    .flatMap(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const textRects = [...range.getClientRects()];
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const clipsX = ['hidden', 'clip'].includes(style.overflowX);
        const clipsY = ['hidden', 'clip'].includes(style.overflowY);
        if (!clipsX && !clipsY) continue;
        const clip = ancestor.getBoundingClientRect();
        if (textRects.some(rect => (clipsX && (rect.left < clip.left - 1 || rect.right > clip.right + 1))
          || (clipsY && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1)))) {
          return [{ selector: identify(element), clippingAncestor: identify(ancestor), text: node.textContent.trim().replace(/\s+/g, ' ').slice(0, 100) }];
        }
      }
      return [];
    })).slice(0, 30);
  const overflowElements = [...document.body.querySelectorAll('*')].filter(visible).map(element => {
    const rect = element.getBoundingClientRect();
    return { selector: identify(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
  }).filter(rect => rect.left < -1 || rect.right > document.documentElement.clientWidth + 1).slice(0, 30);
  return {
    title: document.title,
    h1: headings.filter(heading => heading.level === 1),
    headingSkips,
    mainCount: document.querySelectorAll('main').length,
    mainIdCount: document.querySelectorAll('main#main-content').length,
    skipTargetValid: Boolean(skip && target?.matches('main')),
    overflowPixels: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    overflowElements,
    imageFailures: images.filter(image => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0),
    imagesMissingDimensions: images.filter(image => !image.widthAttribute || !image.heightAttribute),
    contrastFailures,
    unresolvedContrast,
    contrastCandidateCount: textCandidates.length,
    motionDurations,
    clippedText,
  };
});

const runPage = async (browser, route, viewport, options = {}) => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => {
    const host = new URL(request.url()).hostname;
    if (host === '127.0.0.1') errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
  });
  // Chromium's console line for a failed load omits the URL, so record every
  // same-origin error response with its exact resource for the report.
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === baseUrl && response.status() >= 400) errors.push(`response ${response.status()}: ${url.pathname}${url.search}`);
  });
  await installNetworkPolicy(page);
  try {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    if (options.textZoom) {
      await page.evaluate(() => {
        const elements = [document.documentElement, ...document.body.querySelectorAll('*')];
        const sizes = elements.map(element => Number.parseFloat(getComputedStyle(element).fontSize));
        elements.forEach((element, index) => {
          if (Number.isFinite(sizes[index])) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important');
        });
      });
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
    }
    await page.evaluate(() => document.fonts.ready);
    // Below-the-fold loading="lazy" images are not fetched at networkidle.
    // Scroll each visible one into view and wait (bounded) for load + decode so
    // the audit's unchanged complete/natural-size checks measure real bitmaps.
    // Scroll is restored before the audit runs; any broken, timed-out or
    // undecodable lazy image fails the route even if it completes later.
    const lazyImages = await prepareLazyImages(page);
    const audit = await auditDocument(page);
    const label = `${route} ${viewport.name}${options.textZoom ? ' text-200' : ''}${options.reducedMotion ? ' reduced-motion' : ''}`;
    check(response?.status() === 200, `${label}: expected HTTP 200, got ${response?.status() ?? 'no response'}.`, { route, viewport: viewport.name });
    check(lazyImages.failures.length === 0, `${label}: a visible lazy image failed to load or decode once scrolled into view.`, { route, value: lazyImages.failures });
    check(audit.h1.length === 1 && Boolean(audit.h1[0]?.text), `${label}: expected one non-empty visible H1.`, { route, value: audit.h1 });
    check(audit.mainCount === 1 && audit.mainIdCount === 1, `${label}: expected one main landmark with id main-content.`, { route, mainCount: audit.mainCount, mainIdCount: audit.mainIdCount });
    check(audit.skipTargetValid, `${label}: skip link does not target the main landmark.`, { route });
    check(audit.headingSkips.length === 0, `${label}: visible heading hierarchy skips a level.`, { route, value: audit.headingSkips });
    check(audit.overflowPixels === 0, `${label}: horizontal overflow.`, { route, pixels: audit.overflowPixels, value: audit.overflowElements });
    check(audit.imageFailures.length === 0, `${label}: an image failed or has no intrinsic bitmap dimensions.`, { route, value: audit.imageFailures });
    check(audit.imagesMissingDimensions.length === 0, `${label}: a visible image lacks explicit width/height attributes.`, { route, value: audit.imagesMissingDimensions });
    check(audit.contrastFailures.length === 0, `${label}: computed text contrast failure.`, { route, value: audit.contrastFailures });
    check(errors.length === 0, `${label}: browser errors.`, { route, value: errors });
    if (options.reducedMotion) check(audit.motionDurations.length === 0, `${label}: visible elements retain motion over 10ms.`, { route, value: audit.motionDurations });
    if (options.textZoom) check(audit.clippedText.length === 0, `${label}: enlarged text is clipped by an overflow boundary.`, { route, value: audit.clippedText });
    resolvedContrastCandidates += audit.contrastCandidateCount - audit.unresolvedContrast.length;
    unresolvedContrastCandidates += audit.unresolvedContrast.length;
    for (const item of audit.unresolvedContrast) {
      const key = `${route}\u0000${item.selector}\u0000${item.text}`;
      if (!unresolvedContrastSamples.has(key)) unresolvedContrastSamples.set(key, { route, ...item });
    }

    const skip = page.locator('a.skip-link');
    if (await skip.count()) {
      await skip.focus();
      check(await skip.evaluate(element => element === document.activeElement), `${label}: skip link cannot receive programmatic keyboard focus.`, { route });
      await page.keyboard.press('Enter');
      check(await page.locator('main#main-content').evaluate(element => element === document.activeElement), `${label}: activating the skip link did not move focus to main.`, { route });
    }
    if (viewport.width < 1024) {
      const menu = page.locator('[data-mobile-menu]');
      const summary = menu.locator('summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      check(await menu.getAttribute('open') !== null, `${label}: mobile menu did not open from keyboard.`, { route });
      check(await menu.locator('nav a').first().isVisible(), `${label}: mobile navigation links are not visible when opened.`, { route });
      await page.keyboard.press('Escape');
      check(await menu.getAttribute('open') === null, `${label}: Escape did not close the mobile menu.`, { route });
      check(await summary.evaluate(element => element === document.activeElement), `${label}: mobile menu did not restore focus.`, { route });
    } else {
      const firstLink = page.locator('.desktop-nav a').first();
      check(await firstLink.isVisible(), `${label}: desktop navigation is not visible.`, { route });
      await firstLink.focus();
      check(await firstLink.evaluate(element => element === document.activeElement), `${label}: desktop navigation link cannot receive focus.`, { route });
    }
    if (route === '/pricing/' && options.textZoom) {
      const priceTokens = await page.locator('.tier-price strong, .comparison-price, .total strong').evaluateAll(elements => elements.flatMap(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const tokens = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (const match of node.textContent.matchAll(/£?\d[\d,.+k]*/gi)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const lineTops = [...range.getClientRects()].map(rect => Math.round(rect.top));
            tokens.push({ text: match[0], lines: new Set(lineTops).size });
          }
        }
        return tokens;
      }));
      check(priceTokens.every(item => item.lines === 1), `${label}: digits within a price endpoint broke across lines.`, { route, value: priceTokens });
      const cta = await page.locator('.example-cta').evaluate(element => {
        const rect = element.getBoundingClientRect();
        const text = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const brokenWords = [];
        if (text) {
          for (const match of text.textContent.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(text, match.index);
            range.setEnd(text, match.index + match[0].length);
            if (range.getClientRects().length !== 1) brokenWords.push(match[0]);
          }
        }
        return { width: rect.width, height: rect.height, brokenWords };
      });
      check(cta.width >= 44 && cta.height >= 44 && cta.brokenWords.length === 0, `${label}: example CTA is too small or breaks inside a word.`, { route, value: cta });
    }
    const captureEvidence = ['/pricing/', '/contact/'].includes(route)
      ? options.textZoom || ['phone-390', 'desktop-1440'].includes(viewport.name)
      : route === '/' && options.textZoom;
    if (process.env.QUALITY_BROWSER_SCREENSHOTS === '1' && captureEvidence) {
      const reject = page.locator('[data-consent="reject"]');
      if (await reject.isVisible()) await reject.click();
      await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
      const screenshotDir = resolve(projectDir, 'evidence', 'quality-browser', 'screenshots');
      await mkdir(screenshotDir, { recursive: true });
      const routeName = route.replaceAll('/', '') || 'home';
      const mode = options.textZoom ? 'text-200' : viewport.name;
      const regions = route === '/'
        ? [['hero', '.home-hero'], ['services', '.home-services'], ['reviews', '.home-reviews']]
        : route === '/pricing/'
          ? [['hero', '.hero'], ['tiers', '.tiers-section'], ['comparison', '.comparison-section'], ['example', '.example-strip']]
          : [['hero', '.contact-hero'], ['book-panel', '.book-panel'], ['form-notice', '.message-section']];
      for (const [regionName, selector] of regions) {
        const region = page.locator(selector).first();
        if (await region.count()) await region.screenshot({ path: resolve(screenshotDir, `${routeName}-${mode}-${regionName}.png`) });
      }
    }
    coverage.push({ route, viewport: viewport.name, width: viewport.width, height: viewport.height, textZoom: Boolean(options.textZoom), reducedMotion: Boolean(options.reducedMotion) });
  } finally {
    await context.close();
  }
};

let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 360; attempt++) {
    if (server.exitCode !== null) throw new Error(`Astro preview exited before readiness (exit ${server.exitCode}): ${serverLog.trim().slice(-800)}`);
    try {
      if ((await fetch(baseUrl)).ok) { ready = true; break; }
    } catch {}
    if (attempt === 359) throw new Error(`Astro preview did not become ready after 90 seconds (pid ${server.pid}, exit ${server.exitCode}): ${serverLog.trim().slice(-800) || '[no output]'}`);
    await delay(250);
  }
  if (!ready) throw new Error('Astro preview readiness loop ended without a successful response.');
  browser = await playwright.chromium.launch({
    headless: true,
    chromiumSandbox: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  });
  const fixture = await browser.newPage();
  await fixture.setContent(`<body style="background:#fff;color:#000"><label for="probe-range">People</label><input id="probe-range" type="range" value="10" style="color:#aaa;background:#fff"><output>10</output><input id="probe-text" type="text" value="Synthetic" style="color:#aaa;background:#fff"><input id="probe-submit" type="submit" value="Go" style="color:#aaa;background:#fff"></body>`);
  const fixtureAudit = await auditDocument(fixture);
  check(!fixtureAudit.contrastFailures.some(item => item.selector === '#probe-range'), 'Synthetic range value must not be audited as painted text.');
  check(fixtureAudit.contrastFailures.some(item => item.selector === '#probe-text'), 'Synthetic low-contrast text input must fail.');
  check(fixtureAudit.contrastFailures.some(item => item.selector === '#probe-submit'), 'Synthetic low-contrast submit label must fail.');
  check(!fixtureAudit.contrastFailures.some(item => item.selector.includes('output')), 'Synthetic black output value must pass.');
  await fixture.close();
  for (const route of routes) {
    await runPage(browser, route, { name: 'phone-390', width: 390, height: 844 });
    await runPage(browser, route, { name: 'desktop-1440', width: 1440, height: 1000 });
  }
  for (const route of representativeRoutes) {
    await runPage(browser, route, { name: 'narrow-320', width: 320, height: 720 });
    await runPage(browser, route, { name: 'phone-390', width: 390, height: 844 }, { textZoom: true });
    await runPage(browser, route, { name: 'phone-390', width: 390, height: 844 }, { reducedMotion: true });
  }
  await report(failures.length ? 'failed' : 'passed');
  console.log(`${routes.length} built routes audited across 390px and 1440px; ${representativeRoutes.length} family routes also covered at 320px, 200% text and reduced motion.`);
  console.log(`${assertions} assertions, ${failures.length} failures, ${findings.length} review findings. Report: ${reportPath}`);
  if (failures.length) {
    for (const failure of failures.slice(0, 30)) console.error(`FAIL: ${failure.message} ${JSON.stringify(failure.value ?? null).slice(0, 2000)}`);
    if (failures.length > 30) console.error(`...and ${failures.length - 30} more failures; see the JSON report.`);
    process.exitCode = 1;
  }
} catch (error) {
  failures.push({ message: error instanceof Error ? error.stack || error.message : String(error) });
  await report('error');
  throw error;
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise(resolveExit => server.once('exit', resolveExit)), delay(3000)]);
  }
}
