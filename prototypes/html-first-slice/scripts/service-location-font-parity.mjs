import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, relative, resolve, sep } from 'node:path';

// Bounded before/after font-parity diagnostic for the root-slug service-location
// family. It answers one question: with fonts held byte-identical, do two builds
// of /it-support-shropshire and /it-support-ludlow lay out and paint the same
// way in the same Chromium, both when the three "Service Location" faces are
// definitely painted and when every font request is refused?
//
// - Inputs come only from the environment: SERVICE_BEFORE_DIST, SERVICE_AFTER_DIST,
//   FONT_EVIDENCE_DIR, PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
//   Nothing under src/generated, content or the project's own dist is read.
// - Each dist is served by its own read-only localhost server on port 0. Any
//   non-GET request and any request that leaves the page's own origin is aborted.
// - The six /fonts WOFF2 files must hash identically in both dists; every font
//   request in the loaded condition is fulfilled from the "before" bytes.
// - loaded-font (deterministic diagnostic): the product faces use
//   font-display: optional, and request routing disables the browser cache, so
//   warming plus reload never overcomes Chromium's fallback latch and the
//   scoped families never paint. After the document's CSS has registered its
//   faces, every FontFace.display is set to 'block' (a font-timing override
//   for this diagnostic only, applied identically to both sides; product CSS
//   is untouched), every face (scoped and global) is loaded explicitly,
//   document.fonts.ready is awaited and a style recalculation is forced. If a
//   representative still paints a fallback, FontFace instances are built from
//   the same local bytes with the original family and descriptors preserved
//   and loaded through the FontFace API. Either way document.fonts.check must
//   be true for each family and CDP CSS.getPlatformFontsForNode must report
//   only custom fonts on the representatives; a fallback paint fails the side.
// - blocked-font: abort every font request before navigation, wait for
//   document.fonts.ready, require check false for each family and no custom
//   platform font on the representatives.
// - Snapshot: every element in the main subtree (tag, class, a fixed computed
//   property list, bounding rect); compared before vs after within the same
//   condition only. Structure and styles must match exactly, geometry within
//   0.75px. Differing nodes carry their ancestor chain's computed styles.
// - Output is one JSON report plus per-side snapshot files. No screenshots and
//   no text content are written. Exit code is non-zero when any case is
//   skipped or failed, or when setup aborts.
const require = createRequire(import.meta.url);
const requiredEnv = name => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const beforeDist = resolve(requiredEnv('SERVICE_BEFORE_DIST'));
const afterDist = resolve(requiredEnv('SERVICE_AFTER_DIST'));
const evidenceDir = resolve(requiredEnv('FONT_EVIDENCE_DIR'));
const playwrightModule = requiredEnv('PLAYWRIGHT_MODULE');
const executablePath = requiredEnv('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH');
const playwright = require(playwrightModule);

const routes = ['it-support-shropshire', 'it-support-ludlow'];
const widths = [390, 768, 1440];
const viewportHeight = 900;
const conditions = ['loaded-font', 'blocked-font'];
const sides = ['before', 'after'];
const geometryTolerance = 0.75;
const loadedFontTiming = {
  override: "FontFace.display = 'block' on every CSS-registered face after load; every face (scoped and global) loaded explicitly; document.fonts.ready awaited; style recalculation forced",
  scope: 'diagnostic font timing only, applied identically to before and after; product CSS and font files untouched',
  fallback: 'FontFace instances constructed from the same local font bytes with family, weight, style, stretch and unicode-range preserved, only when the override still paints a fallback face',
};
const maxReportedDifferences = 40;

// The six subsets referenced by src/styles/service-locations.css and global.css.
const fontFiles = [
  'archivo-v25-latin-ext.woff2', 'archivo-v25-latin.woff2',
  'archivo-narrow-v35-latin-ext.woff2', 'archivo-narrow-v35-latin.woff2',
  'bungee-latin-ext.woff2', 'bungee-latin.woff2',
];
// One spec per scoped family; the probe text covers both unicode-range subsets
// (U+0041 latin, U+0100 latin-ext) so check() and load() touch all six faces.
const fontProbeText = 'AĀ';
const fontSpecs = [
  "400 16px 'Service Location Archivo'",
  "700 16px 'Service Location Archivo Narrow'",
  "400 16px 'Service Location Bungee'",
];
// Representatives: hero heading, hero intro paragraph and the first paragraph
// in main. service-locations.css has no .sl-intro; the intro copy is .sl-hero-copy.
const representativeSelectors = ['.sl-hero h1', '.sl-hero-copy', 'main p'];

// Computed properties captured per element. Resolved box sizes are left to the
// bounding rect so the 0.75px tolerance applies to them rather than exact match.
const computedProperties = [
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-synthesis', 'font-kerning',
  'line-height', 'letter-spacing', 'word-spacing', 'text-transform', 'text-align', 'text-decoration-line',
  'white-space', 'overflow-wrap', 'word-break', 'hyphens',
  'color', 'background-color', 'opacity', 'visibility', 'display', 'position', 'z-index', 'box-sizing',
  'min-width', 'max-width', 'min-height', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-color',
  'box-shadow', 'transform',
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-items', 'align-self',
  'justify-content', 'gap', 'grid-template-columns', 'grid-column', 'list-style-type', 'vertical-align',
  'overflow-x', 'overflow-y',
];

const contentTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sha256File = path => new Promise((resolveHash, reject) => {
  const hash = createHash('sha256');
  createReadStream(path).on('error', reject).on('data', chunk => hash.update(chunk)).on('end', () => resolveHash(hash.digest('hex')));
});

// Read-only static server bound to a single dist directory. GET and HEAD only;
// paths are confined to the root and everything else is a 404 or 405.
const startServer = async root => {
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { allow: 'GET, HEAD' });
        response.end();
        return;
      }
      let pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(`${root}${sep}`)) throw new Error('Unsafe request path');
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': contentTypes[extname(file).toLowerCase()] || 'application/octet-stream', 'content-length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start local static server');
  return { server, origin: `http://127.0.0.1:${address.port}`, close: () => new Promise(resolveClose => server.close(resolveClose)) };
};

const isFontRequest = (request, url) => request.resourceType() === 'font' || url.pathname.startsWith('/fonts/') || /\.(woff2?|ttf|otf)$/i.test(url.pathname);

const settle = page => page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
const fontsReady = page => page.evaluate(() => document.fonts.ready.then(() => document.fonts.status));
const loadFonts = page => page.evaluate(({ specs, text }) => Promise.allSettled(specs.map(spec => document.fonts.load(spec, text))).then(results => results.map(result => result.status)), { specs: fontSpecs, text: fontProbeText });
const checkFonts = page => page.evaluate(({ specs, text }) => specs.map(spec => document.fonts.check(spec, text)), { specs: fontSpecs, text: fontProbeText });
const faceStatuses = page => page.evaluate(() => [...document.fonts].map(face => ({ family: face.family, weight: face.weight, display: face.display, status: face.status })));

// Loaded-font timing override: switch every registered face to display 'block'
// and load each one directly (face.load() covers every unicode-range subset, so
// global families are included as well as the three scoped ones).
const overrideFontTiming = page => page.evaluate(async () => {
  const faces = [...document.fonts];
  let displaySet = 0;
  for (const face of faces) { try { face.display = 'block'; displaySet++; } catch { /* descriptor not settable on this face */ } }
  const results = await Promise.allSettled(faces.map(face => face.load()));
  return { faces: faces.length, displaySet, displays: faces.map(face => face.display), loaded: results.map(result => result.status) };
});
// Force a full style recalculation and layout so a face that finished loading
// after the initial paint is actually applied before anything is measured.
const forceRecalc = page => page.evaluate(() => {
  const body = document.body;
  const prior = body.style.getPropertyValue('display');
  body.style.setProperty('display', 'none');
  void body.offsetHeight;
  if (prior) body.style.setProperty('display', prior); else body.style.removeProperty('display');
  void body.offsetHeight;
});
// Fallback: rebuild each registered face from the same local bytes through the
// FontFace API, preserving family and descriptors, so the loaded faces do not
// depend on the CSS-connected faces having escaped the optional-display latch.
const addFontFaceInstances = (page, encodedFonts) => page.evaluate(async fonts => {
  const decode = base64 => Uint8Array.from(atob(base64), char => char.charCodeAt(0)).buffer;
  const fileFor = face => {
    const family = /narrow/i.test(face.family) ? 'archivo-narrow' : /archivo/i.test(face.family) ? 'archivo' : /bungee/i.test(face.family) ? 'bungee' : null;
    if (!family) return null;
    const subset = /U\+0?100\b/i.test(face.unicodeRange) ? 'latin-ext' : 'latin';
    return fonts[`${family}:${subset}`] ? `${family}:${subset}` : null;
  };
  const created = [];
  const skipped = [];
  for (const face of [...document.fonts]) {
    const key = fileFor(face);
    if (!key) { skipped.push(face.family); continue; }
    const clone = new FontFace(face.family, decode(fonts[key]), { weight: face.weight, style: face.style, stretch: face.stretch, unicodeRange: face.unicodeRange, featureSettings: face.featureSettings, display: 'block' });
    document.fonts.add(clone);
    created.push({ family: face.family, weight: face.weight, unicodeRange: face.unicodeRange, file: key, clone });
  }
  const results = await Promise.allSettled(created.map(entry => entry.clone.load()));
  return { added: created.map(({ clone, ...entry }, index) => ({ ...entry, status: results[index].status })), skipped };
}, encodedFonts);

const captureSnapshot = page => page.evaluate(properties => {
  scrollTo(0, 0);
  const main = document.querySelector('main');
  if (!main) return null;
  const elements = [main, ...main.querySelectorAll('*')];
  const indexOf = new Map(elements.map((element, index) => [element, index]));
  const round = value => Math.round(value * 1000) / 1000;
  const nodes = elements.map(element => {
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const styles = {};
    for (const property of properties) styles[property] = computed.getPropertyValue(property);
    return {
      tag: element.tagName.toLowerCase(),
      className: element.getAttribute('class') || '',
      parent: element === main ? -1 : (indexOf.get(element.parentElement) ?? -1),
      styles,
      rect: [rect.x, rect.y, rect.width, rect.height].map(round),
    };
  });
  return {
    document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, scrollHeight: document.documentElement.scrollHeight },
    nodes,
  };
}, computedProperties);

const representativeFonts = async (cdp, page) => {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const results = [];
  for (const selector of representativeSelectors) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) { results.push({ selector, missing: true, fonts: [] }); continue; }
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    const computed = await page.evaluate(target => {
      const element = document.querySelector(target);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const round = value => Math.round(value * 1000) / 1000;
      return { fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight, rect: [rect.x, rect.y, rect.width, rect.height].map(round) };
    }, selector);
    results.push({
      selector,
      missing: false,
      fonts: fonts.map(font => ({ familyName: font.familyName, isCustomFont: Boolean(font.isCustomFont), glyphCount: font.glyphCount }))
        .sort((left, right) => left.familyName.localeCompare(right.familyName) || left.glyphCount - right.glyphCount),
      ...computed,
    });
  }
  return results;
};

const paintedOnlyCustom = representative => !representative.missing && representative.fonts.length > 0 && representative.fonts.filter(font => font.glyphCount > 0).every(font => font.isCustomFont);
const paintedNoCustom = representative => !representative.missing && representative.fonts.every(font => !font.isCustomFont);

// Runs one side (before or after) of one case in a fresh context. Throws on
// setup problems (non-200, missing main), which the caller records as skipped.
const runSide = async ({ browser, origin, route, width, condition, fontBytes, encodedFonts }) => {
  const context = await browser.newContext({ viewport: { width, height: viewportHeight }, deviceScaleFactor: 1, locale: 'en-GB' });
  context.setDefaultTimeout(30000);
  const state = { fontRequests: [], abortedMethods: [], external: [], unknownFonts: [], consoleErrors: 0, pageErrors: 0 };
  const failures = [];
  try {
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') state.consoleErrors++; });
    page.on('pageerror', () => { state.pageErrors++; });
    await page.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== 'GET') { state.abortedMethods.push(request.method()); return route.abort(); }
      if (url.origin !== origin) { state.external.push(url.host); return route.abort(); }
      if (!isFontRequest(request, url)) return route.continue();
      state.fontRequests.push(url.pathname);
      if (condition === 'blocked-font') return route.abort();
      const bytes = fontBytes.get(url.pathname);
      if (!bytes) { state.unknownFonts.push(url.pathname); return route.abort(); }
      return route.fulfill({ status: 200, body: bytes, headers: { 'content-type': 'font/woff2', 'cache-control': 'public, max-age=31536000, immutable' } });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

    const url = `${origin}/${route}/`;
    const response = await page.goto(url, { waitUntil: 'load' });
    if (!response || response.status() !== 200) throw new Error(`status ${response ? response.status() : 'none'} for ${url}`);

    let checks = [];
    let representatives = [];
    let loadResults = [];
    let fontStatus = 'unknown';
    let timing = null;
    if (condition === 'loaded-font') {
      // Deterministic diagnostic: override display to 'block' on every
      // registered face, load every face, await ready, force recalculation.
      // Identical on both sides; see loadedFontTiming in the report.
      timing = { strategy: 'display-override', override: await overrideFontTiming(page), fallback: null };
      loadResults = await loadFonts(page);
      fontStatus = await fontsReady(page);
      await forceRecalc(page);
      await settle(page);
      checks = await checkFonts(page);
      representatives = await representativeFonts(cdp, page);
      if (!(checks.every(Boolean) && representatives.every(paintedOnlyCustom))) {
        // The CSS-connected faces still paint a fallback: add FontFace
        // instances from the same local bytes with descriptors preserved.
        timing.strategy = 'fontface-instances';
        timing.fallback = await addFontFaceInstances(page, encodedFonts);
        loadResults = await loadFonts(page);
        fontStatus = await fontsReady(page);
        await forceRecalc(page);
        await settle(page);
        checks = await checkFonts(page);
        representatives = await representativeFonts(cdp, page);
      }
      checks.forEach((loaded, index) => { if (!loaded) failures.push(`loaded-font: document.fonts.check false for ${fontSpecs[index]}`); });
      for (const representative of representatives) {
        if (representative.missing) failures.push(`loaded-font: representative ${representative.selector} not found`);
        else if (!paintedOnlyCustom(representative)) failures.push(`loaded-font: ${representative.selector} painted non-custom or no fonts (${representative.fonts.map(font => `${font.familyName}:${font.glyphCount}${font.isCustomFont ? ':custom' : ''}`).join(', ') || 'none'})`);
      }
      if (state.unknownFonts.length) failures.push(`loaded-font: font requests outside the six known files: ${[...new Set(state.unknownFonts)].join(', ')}`);
    } else {
      await settle(page);
      fontStatus = await fontsReady(page);
      await settle(page);
      checks = await checkFonts(page);
      representatives = await representativeFonts(cdp, page);
      checks.forEach((loaded, index) => { if (loaded) failures.push(`blocked-font: document.fonts.check true for ${fontSpecs[index]}`); });
      for (const representative of representatives) {
        if (representative.missing) failures.push(`blocked-font: representative ${representative.selector} not found`);
        else if (!paintedNoCustom(representative)) failures.push(`blocked-font: ${representative.selector} painted a custom font (${representative.fonts.map(font => `${font.familyName}:${font.glyphCount}`).join(', ')})`);
      }
    }

    await settle(page);
    const snapshot = await captureSnapshot(page);
    if (!snapshot) throw new Error(`no <main> element for ${url}`);
    const faces = await faceStatuses(page);
    await cdp.detach();
    return {
      status: failures.length ? 'failed' : 'passed',
      failures,
      timing,
      fontStatus,
      loadResults,
      checks: Object.fromEntries(fontSpecs.map((spec, index) => [spec, checks[index]])),
      faces,
      representatives,
      requests: { fonts: [...new Set(state.fontRequests)].sort(), abortedMethods: [...new Set(state.abortedMethods)], external: [...new Set(state.external)].sort(), unknownFonts: [...new Set(state.unknownFonts)] },
      errors: { console: state.consoleErrors, page: state.pageErrors },
      document: snapshot.document,
      elementCount: snapshot.nodes.length,
      snapshot,
    };
  } finally {
    await context.close();
  }
};

const ancestorsOf = (nodes, index) => {
  const chain = [];
  for (let parent = nodes[index]?.parent ?? -1; parent >= 0; parent = nodes[parent].parent) chain.push(parent);
  return chain;
};

// Same-condition comparison of two snapshots. Structure and styles are exact;
// each rect axis may move by at most the tolerance.
const compareSnapshots = (before, after) => {
  const failures = [];
  const differences = [];
  if (before.nodes.length !== after.nodes.length) {
    failures.push(`main subtree element count ${before.nodes.length} before vs ${after.nodes.length} after`);
    return { failures, differences, differingCount: 0 };
  }
  for (const key of ['scrollWidth', 'clientWidth']) {
    if (before.document[key] !== after.document[key]) failures.push(`document ${key} ${before.document[key]} before vs ${after.document[key]} after`);
  }
  if (Math.abs(before.document.scrollHeight - after.document.scrollHeight) > geometryTolerance) failures.push(`document scrollHeight ${before.document.scrollHeight} before vs ${after.document.scrollHeight} after`);
  let differingCount = 0;
  before.nodes.forEach((node, index) => {
    const other = after.nodes[index];
    const diffs = [];
    if (node.tag !== other.tag || node.className !== other.className) diffs.push({ kind: 'structure', before: { tag: node.tag, className: node.className }, after: { tag: other.tag, className: other.className } });
    for (const property of computedProperties) {
      if (node.styles[property] !== other.styles[property]) diffs.push({ kind: 'style', property, before: node.styles[property], after: other.styles[property] });
    }
    ['x', 'y', 'width', 'height'].forEach((axis, position) => {
      const delta = other.rect[position] - node.rect[position];
      if (Math.abs(delta) > geometryTolerance) diffs.push({ kind: 'geometry', axis, before: node.rect[position], after: other.rect[position], delta: Math.round(delta * 1000) / 1000 });
    });
    if (!diffs.length) return;
    differingCount++;
    if (differences.length >= maxReportedDifferences) return;
    differences.push({
      index,
      tag: node.tag,
      className: node.className,
      diffs,
      ancestors: ancestorsOf(before.nodes, index).map(ancestorIndex => ({
        index: ancestorIndex,
        tag: before.nodes[ancestorIndex].tag,
        className: before.nodes[ancestorIndex].className,
        before: before.nodes[ancestorIndex].styles,
        after: after.nodes[ancestorIndex].styles,
      })),
    });
  });
  if (differingCount) failures.push(`${differingCount} main subtree element(s) differ in structure, computed styles or geometry (first ${Math.min(differingCount, maxReportedDifferences)} detailed)`);
  return { failures, differences, differingCount };
};

const compareRepresentatives = (before, after) => {
  const failures = [];
  before.forEach((left, index) => {
    const right = after[index];
    if (!right || left.selector !== right.selector) { failures.push(`representative list mismatch at ${left.selector}`); return; }
    if (left.missing !== right.missing) { failures.push(`${left.selector}: present on one side only`); return; }
    if (left.missing) return;
    if (JSON.stringify(left.fonts) !== JSON.stringify(right.fonts)) failures.push(`${left.selector}: platform fonts differ (${left.fonts.map(font => `${font.familyName}:${font.glyphCount}`).join(', ')} vs ${right.fonts.map(font => `${font.familyName}:${font.glyphCount}`).join(', ')})`);
    for (const key of ['fontFamily', 'fontSize', 'lineHeight']) if (left[key] !== right[key]) failures.push(`${left.selector}: ${key} ${left[key]} vs ${right[key]}`);
    left.rect.forEach((value, position) => { if (Math.abs(value - right.rect[position]) > geometryTolerance) failures.push(`${left.selector}: rect ${['x', 'y', 'width', 'height'][position]} ${value} vs ${right.rect[position]}`); });
  });
  return failures;
};

const stripSnapshot = side => { const { snapshot, ...rest } = side; return rest; };

const report = {
  tool: 'service-location-font-parity',
  generatedAt: new Date().toISOString(),
  status: 'running',
  inputs: { beforeDist, afterDist, evidenceDir, playwrightModule, executablePath, sameDist: beforeDist === afterDist },
  parameters: { routes, widths, viewportHeight, deviceScaleFactor: 1, locale: 'en-GB', conditions, fontSpecs, fontProbeText, representativeSelectors, computedProperties, geometryTolerance, loadedFontTiming },
  browser: {},
  fonts: { files: {}, identical: false },
  cases: [],
  summary: { passed: 0, failed: 0, skipped: 0 },
  setupError: null,
};

let browser;
let beforeServer;
let afterServer;
try {
  await mkdir(resolve(evidenceDir, 'snapshots'), { recursive: true });

  // Six fonts must be byte-identical across the two dists; the before bytes
  // are the only bytes ever served to the browser.
  const fontBytes = new Map();
  const mismatches = [];
  for (const file of fontFiles) {
    const entry = {};
    for (const [side, dist] of [['before', beforeDist], ['after', afterDist]]) {
      try {
        const bytes = await readFile(resolve(dist, 'fonts', file));
        entry[side] = { sha256: sha256(bytes), bytes: bytes.length };
        if (side === 'before') fontBytes.set(`/fonts/${file}`, bytes);
      } catch (error) {
        entry[side] = { error: error.code || error.message };
      }
    }
    entry.identical = Boolean(entry.before?.sha256) && entry.before.sha256 === entry.after?.sha256;
    if (!entry.identical) mismatches.push(file);
    report.fonts.files[file] = entry;
  }
  report.fonts.identical = mismatches.length === 0;
  if (mismatches.length) throw new Error(`font bytes are missing or differ between dists: ${mismatches.join(', ')}`);
  // Same before bytes, keyed "<family-file>:<subset>" for the FontFace fallback
  // (archivo-v25-latin-ext.woff2 -> archivo:latin-ext).
  const encodedFonts = Object.fromEntries(fontFiles.map(file => {
    const stem = file.replace(/\.woff2$/, '').replace(/-v\d+/, '');
    const subset = stem.endsWith('-latin-ext') ? 'latin-ext' : 'latin';
    return [`${stem.slice(0, stem.length - subset.length - 1)}:${subset}`, fontBytes.get(`/fonts/${file}`).toString('base64')];
  }));

  try { report.browser.playwrightVersion = require(`${playwrightModule}/package.json`).version; } catch { report.browser.playwrightVersion = null; }
  report.browser.executableSha256 = await sha256File(executablePath);

  beforeServer = await startServer(beforeDist);
  afterServer = await startServer(afterDist);
  const origins = { before: beforeServer.origin, after: afterServer.origin };

  browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  report.browser.version = browser.version();

  for (const route of routes) {
    for (const width of widths) {
      for (const condition of conditions) {
        const name = `${route}-${width}-${condition}`;
        const record = { name, route, width, condition, status: 'running', failures: [], sides: {}, snapshotFiles: {}, comparison: null };
        report.cases.push(record);
        const results = {};
        for (const side of sides) {
          try {
            results[side] = await runSide({ browser, origin: origins[side], route, width, condition, fontBytes, encodedFonts });
            const file = resolve(evidenceDir, 'snapshots', `${name}-${side}.json`);
            await writeFile(file, JSON.stringify(results[side].snapshot));
            record.snapshotFiles[side] = relative(evidenceDir, file).split(sep).join('/');
            record.sides[side] = stripSnapshot(results[side]);
            record.failures.push(...results[side].failures.map(failure => `${side}: ${failure}`));
          } catch (error) {
            record.sides[side] = { status: 'skipped', reason: error.message };
            record.failures.push(`${side}: skipped (${error.message})`);
          }
        }
        if (results.before && results.after) {
          const comparison = compareSnapshots(results.before.snapshot, results.after.snapshot);
          const representativeFailures = compareRepresentatives(results.before.representatives, results.after.representatives);
          record.comparison = { differingCount: comparison.differingCount, differences: comparison.differences };
          record.failures.push(...comparison.failures.map(failure => `parity: ${failure}`), ...representativeFailures.map(failure => `parity: ${failure}`));
          record.status = record.failures.length ? 'failed' : 'passed';
        } else {
          record.status = 'skipped';
        }
        report.summary[record.status]++;
        console.log(`${record.status.padEnd(7)} ${name}${record.failures.length ? ` (${record.failures.length} issue${record.failures.length === 1 ? '' : 's'})` : ''}`);
      }
    }
  }
  report.status = report.summary.failed || report.summary.skipped ? 'failed' : 'passed';
} catch (error) {
  report.status = 'aborted';
  report.setupError = error.message;
  console.error(`service-location font parity aborted: ${error.message}`);
} finally {
  if (browser) {
    try { await browser.close(); } catch (error) { console.error(`Browser close failed: ${error.message}`); }
  }
  await Promise.all([beforeServer?.close(), afterServer?.close()]);
  const reportPath = resolve(evidenceDir, 'service-location-font-parity.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const expected = routes.length * widths.length * conditions.length;
  console.log(`${report.status}: ${report.summary.passed}/${expected} cases passed, ${report.summary.failed} failed, ${report.summary.skipped} skipped; report ${reportPath}`);
  for (const record of report.cases) for (const failure of record.failures) console.log(`  ${record.name}: ${failure}`);
  if (report.status !== 'passed') process.exitCode = 1;
}
