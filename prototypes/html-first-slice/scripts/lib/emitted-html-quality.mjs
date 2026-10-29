import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { init, parse as parseModules } from 'es-module-lexer';
import { parse as parseHtml } from 'ultrahtml';

export const QUALITY_BUDGETS = Object.freeze({
  htmlGzipBytes: 32 * 1024,
  initialModulesGzipBytes: 16 * 1024,
  inlineExecutableGzipBytes: 4 * 1024,
});
const SITE_ORIGIN = 'https://fresh-tech.uk';
const RESOURCE_LINK_RELS = new Set(['icon', 'modulepreload', 'preload', 'stylesheet']);
const EXECUTABLE_SCRIPT_TYPES = new Set(['', 'application/javascript', 'module', 'text/javascript']);
const ANALYTICS_HOSTS = ['clarity.ms', 'google-analytics.com', 'googletagmanager.com'];
// Reserved attribute that marks synthetic-fixture testimonial markup. Its
// presence on any element, whatever the value or case, means the page was
// built from test data and must never pass. Only real element attributes
// count: the same string inside text or script bodies is not a marker.
const RESERVED_FIXTURE_ATTRIBUTE = 'data-testimonials-fixture';

const walkFiles = async directory => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(path));
    else files.push(path);
  }
  return files;
};

const visit = (node, callback) => {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
};

const textContent = node => {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(textContent).join('');
};

const visibleText = node => {
  if (node.type === 1 && ['script', 'style', 'svg'].includes(node.name?.toLowerCase())) return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(visibleText).join('');
};

const decodeNumericEntities = value => value.replace(/&#(?:x([\da-f]+)|(\d+));/gi, (entity, hex, decimal) => {
  const codePoint = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
  try { return String.fromCodePoint(codePoint); }
  catch { return entity; }
});

const containsEmDash = value => /—|&(?:#0*8212|#x0*2014|mdash);/i.test(value);
const startsWithEmoji = value => /^\s*(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)/u.test(decodeNumericEntities(value));

const elements = (document, name) => {
  const found = [];
  visit(document, node => {
    if (node.type === 1 && (!name || node.name?.toLowerCase() === name)) found.push(node);
  });
  return found;
};

const routeFor = (distDir, file) => {
  const path = relative(distDir, file).replaceAll('\\', '/');
  if (path === 'index.html') return '/';
  if (!path.endsWith('/index.html')) throw new Error(`Unexpected HTML route layout: ${path}`);
  return `/${path.slice(0, -'/index.html'.length)}`;
};

const expectedCanonical = route => `${SITE_ORIGIN}${route}`;
// The one reviewed external frame (9 Oct 2026): Blockmark's Cyber Essentials
// certificate badge. Approved only lazy and sandboxed without allow-same-origin
// (an opaque origin even when its own script runs); any other iframe, or this
// one without those guards, is still an eager embed.
const APPROVED_FRAME_PREFIX = 'https://registry.blockmarktech.com/certificates/';
const approvedFrame = node => {
  const attributes = node.attributes ?? {};
  const sandbox = (attributes.sandbox ?? '').toLowerCase().split(/\s+/);
  return (attributes.src ?? '').trim().startsWith(APPROVED_FRAME_PREFIX) && (attributes.loading ?? '').toLowerCase() === 'lazy'
    && 'sandbox' in attributes && !sandbox.includes('allow-same-origin') && !sandbox.includes('allow-top-navigation');
};
const relTokens = node => new Set((node.attributes?.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean));
const namedMeta = (document, name) => elements(document, 'meta').filter(node => (node.attributes?.name ?? '').toLowerCase() === name);

const decodeReference = value => {
  const withoutSuffix = value.split('#', 1)[0].split('?', 1)[0];
  try { return decodeURIComponent(withoutSuffix); }
  catch { throw new Error(`cannot decode resource URL ${JSON.stringify(value)}`); }
};

const remoteKind = value => {
  if (value.startsWith('//')) return 'https';
  return value.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase() ?? null;
};

const localPathFor = (distDir, ownerFile, value) => {
  const decoded = decodeReference(value);
  const candidate = decoded.startsWith('/')
    ? resolve(distDir, decoded.slice(1))
    : resolve(dirname(ownerFile), decoded);
  const inside = relative(distDir, candidate);
  if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {
    throw new Error(`resource escapes dist: ${JSON.stringify(value)}`);
  }
  return candidate;
};

const existsAsExactFile = async (distDir, path) => {
  try {
    let cursor = distDir;
    for (const part of relative(distDir, path).split(sep)) {
      if (!(await readdir(cursor)).includes(part)) return false;
      cursor = resolve(cursor, part);
    }
    return (await stat(path)).isFile();
  }
  catch { return false; }
};

// ASCII whitespace per the Infra Standard: TAB, LF, FF, CR and SPACE.
const isAsciiWhitespace = character => character === ' ' || character === '\t' || character === '\n' || character === '\f' || character === '\r';

// Candidate URLs from a srcset attribute, following the HTML Standard
// "parse a srcset attribute" algorithm (WHATWG HTML, section 4.8.4.3.10).
// Splitting srcset on every comma is wrong: a URL token runs until ASCII
// whitespace and may contain commas (Cloudinary transformations, data URLs).
// Only commas that end the URL token are candidate separators, and those
// trailing commas are stripped. Descriptors are then consumed up to the next
// top-level comma, ignoring commas inside parentheses, so descriptor text is
// never mistaken for a URL.
const srcsetCandidateUrls = srcset => {
  const urls = [];
  let position = 0;
  while (position < srcset.length) {
    // Splitting loop: skip a sequence of ASCII whitespace or U+002C COMMA.
    while (position < srcset.length && (isAsciiWhitespace(srcset[position]) || srcset[position] === ',')) position += 1;
    if (position >= srcset.length) break;
    // Collect the URL: a sequence of code points that are not ASCII whitespace.
    const start = position;
    while (position < srcset.length && !isAsciiWhitespace(srcset[position])) position += 1;
    let url = srcset.slice(start, position);
    if (url.endsWith(',')) {
      // A URL ending in commas has no descriptors: remove all trailing commas
      // and return to the splitting loop for the next candidate.
      url = url.replace(/,+$/, '');
      urls.push(url);
      continue;
    }
    urls.push(url);
    // Descriptor tokenizer: consume descriptors until a top-level comma or the
    // end of input. State: after-descriptor, in-descriptor or in-parens.
    let state = 'after-descriptor';
    while (position < srcset.length) {
      const character = srcset[position];
      position += 1;
      if (state === 'in-parens') {
        if (character === ')') state = 'in-descriptor';
      } else if (state === 'in-descriptor') {
        if (isAsciiWhitespace(character)) state = 'after-descriptor';
        else if (character === ',') break;
        else if (character === '(') state = 'in-parens';
      } else if (!isAsciiWhitespace(character)) {
        if (character === ',') break;
        state = character === '(' ? 'in-parens' : 'in-descriptor';
      }
    }
  }
  return urls;
};

const executableInlineScripts = document => elements(document, 'script').filter(node => {
  if (node.attributes?.src) return false;
  return EXECUTABLE_SCRIPT_TYPES.has((node.attributes?.type ?? '').trim().toLowerCase());
});

const addViolation = (violations, route, message) => violations.push(`${route}: ${message}`);

const inspectDocument = async ({ document, html, file, route, distDir, violations }) => {
  const exactlyOne = (nodes, label, content) => {
    if (nodes.length !== 1) return addViolation(violations, route, `expected exactly one ${label}, found ${nodes.length}`);
    if (content && !content(nodes[0]).trim()) addViolation(violations, route, `${label} is empty`);
  };

  exactlyOne(elements(document, 'html'), 'html element');
  const htmlElement = elements(document, 'html')[0];
  if (htmlElement && !(htmlElement.attributes?.lang ?? '').trim()) addViolation(violations, route, 'html lang is missing or empty');
  exactlyOne(elements(document, 'main'), 'main element');
  exactlyOne(elements(document, 'h1'), 'h1', textContent);
  exactlyOne(elements(document, 'title'), 'title', textContent);

  const descriptions = namedMeta(document, 'description');
  exactlyOne(descriptions, 'meta description', node => node.attributes?.content ?? '');
  const viewports = namedMeta(document, 'viewport');
  exactlyOne(viewports, 'viewport meta', node => node.attributes?.content ?? '');
  if (viewports.length === 1) {
    const content = viewports[0].attributes?.content ?? '';
    if (/\buser-scalable\s*=\s*(?:no|0)\b/i.test(content)) addViolation(violations, route, 'viewport disables user scaling');
    const maximumScale = content.match(/\bmaximum-scale\s*=\s*([\d.]+)/i)?.[1];
    if (maximumScale && Number(maximumScale) < 2) addViolation(violations, route, 'viewport prevents 200% zoom');
  }

  const canonicals = elements(document, 'link').filter(node => relTokens(node).has('canonical'));
  exactlyOne(canonicals, 'canonical link', node => node.attributes?.href ?? '');
  if (canonicals.length === 1 && canonicals[0].attributes?.href !== expectedCanonical(route)) {
    addViolation(violations, route, `canonical must be ${expectedCanonical(route)}`);
  }

  const robots = namedMeta(document, 'robots');
  exactlyOne(robots, 'robots meta', node => node.attributes?.content ?? '');
  if (robots.length === 1) {
    const tokens = new Set((robots[0].attributes?.content ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean));
    if (tokens.has('index') && tokens.has('noindex')) addViolation(violations, route, 'robots meta contradicts itself with index and noindex');
  }

  const titleText = elements(document, 'title').map(textContent).join('');
  const descriptionText = descriptions.map(node => node.attributes?.content ?? '').join('');
  const bodyText = elements(document, 'body').map(visibleText).join('');
  if (containsEmDash(titleText)) addViolation(violations, route, 'title contains an em dash');
  if (containsEmDash(descriptionText)) addViolation(violations, route, 'meta description contains an em dash');
  if (containsEmDash(bodyText)) addViolation(violations, route, 'visible text contains an em dash');
  for (const item of elements(document, 'li')) {
    if (startsWithEmoji(visibleText(item))) addViolation(violations, route, 'list item begins with textual emoji');
  }

  for (const script of elements(document, 'script').filter(node => (node.attributes?.type ?? '').toLowerCase() === 'application/ld+json')) {
    try { JSON.parse(textContent(script)); }
    catch { addViolation(violations, route, 'contains invalid JSON-LD'); }
  }

  if (elements(document, 'astro-island').length || /\bdata-reactroot\b/i.test(html)) {
    addViolation(violations, route, 'contains framework hydration markup');
  }

  for (const node of elements(document)) {
    if (Object.keys(node.attributes ?? {}).some(name => name.toLowerCase() === RESERVED_FIXTURE_ATTRIBUTE)) {
      addViolation(violations, route, `<${node.name}> carries the reserved ${RESERVED_FIXTURE_ATTRIBUTE} attribute: synthetic fixture markup must not be published`);
    }
  }

  for (const image of elements(document, 'img')) {
    if (!Object.hasOwn(image.attributes ?? {}, 'alt')) addViolation(violations, route, 'img is missing alt');
    for (const dimension of ['width', 'height']) {
      if (!/^[1-9]\d*$/.test(image.attributes?.[dimension] ?? '')) addViolation(violations, route, `img has invalid ${dimension}`);
    }
  }

  const references = [];
  const addReference = (node, attribute, policy = 'asset') => {
    const value = node.attributes?.[attribute]?.trim();
    if (value) references.push({ value, policy });
  };
  for (const node of elements(document)) {
    const name = node.name?.toLowerCase();
    if (name === 'script') addReference(node, 'src', 'executable');
    if (name === 'iframe') addReference(node, 'src', approvedFrame(node) ? 'asset' : 'embedded');
    if (['audio', 'img', 'source', 'video'].includes(name)) addReference(node, 'src', name === 'img' || name === 'source' ? 'image' : 'media');
    if (name === 'video') addReference(node, 'poster', 'image');
    if (['img', 'source'].includes(name) && node.attributes?.srcset) {
      for (const value of srcsetCandidateUrls(node.attributes.srcset)) {
        if (value) references.push({ value, policy: 'image' });
      }
    }
    if (name === 'link') {
      const rels = relTokens(node);
      if ([...rels].some(rel => RESOURCE_LINK_RELS.has(rel))) {
        const policy = rels.has('stylesheet') ? 'stylesheet' : rels.has('modulepreload') ? 'executable' : rels.has('preload') ? 'preload' : 'asset';
        addReference(node, 'href', policy);
      }
    }
    const css = name === 'style' ? textContent(node) : node.attributes?.style;
    if (css) {
      for (const match of css.matchAll(/@import\s+url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/gi)) {
        const value = match[1] ?? match[2] ?? match[3];
        if (value) references.push({ value, policy: 'stylesheet' });
      }
      for (const match of css.matchAll(/@import\s+(?:"([^"]+)"|'([^']+)')/gi)) {
        const value = match[1] ?? match[2];
        if (value) references.push({ value, policy: 'stylesheet' });
      }
      for (const match of css.matchAll(/\burl\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
        if (match[2]) references.push({ value: match[2], policy: 'css-asset' });
      }
    }
  }

  for (const { value, policy } of references) {
    if (value.startsWith('#')) continue;
    if (policy === 'stylesheet') {
      addViolation(violations, route, `stylesheet reference violates the inline-CSS contract: ${JSON.stringify(value)}`);
      continue;
    }
    if (value.startsWith('data:') || value.startsWith('blob:')) {
      if (['embedded', 'executable', 'preload', 'stylesheet'].includes(policy)) addViolation(violations, route, `unsupported eager ${policy} resource ${JSON.stringify(value)}`);
      continue;
    }
    const protocol = remoteKind(value);
    if (protocol === 'http') {
      addViolation(violations, route, `mixed-content resource ${JSON.stringify(value)}`);
      continue;
    }
    if (protocol) {
      if (protocol !== 'https') addViolation(violations, route, `unsupported resource URL ${JSON.stringify(value)}`);
      if (['embedded', 'executable', 'preload', 'stylesheet'].includes(policy)) addViolation(violations, route, `eager external ${policy} resource ${JSON.stringify(value)}`);
      continue;
    }
    try {
      const assetPath = localPathFor(distDir, file, value);
      if (!await existsAsExactFile(distDir, assetPath)) addViolation(violations, route, `local resource does not exist with exact casing: ${JSON.stringify(value)}`);
    } catch (error) { addViolation(violations, route, error.message); }
  }

  for (const script of executableInlineScripts(document)) {
    const body = textContent(script);
    if (ANALYTICS_HOSTS.some(host => body.includes(host))) addViolation(violations, route, 'contains eager inline analytics');
  }
};

const resolveModule = (distDir, ownerFile, specifier) => {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) throw new Error(`bare static import ${JSON.stringify(specifier)}`);
  return localPathFor(distDir, ownerFile, specifier);
};

const initialModuleGraph = async ({ document, file: htmlFile, distDir, route, violations }) => {
  const entries = [];
  for (const script of elements(document, 'script')) {
    const type = (script.attributes?.type ?? '').trim().toLowerCase();
    if (script.attributes?.src && EXECUTABLE_SCRIPT_TYPES.has(type)) entries.push({ value: script.attributes.src, traverse: type === 'module' });
  }
  for (const link of elements(document, 'link')) {
    const rels = relTokens(link);
    if (rels.has('modulepreload') && link.attributes?.href) entries.push({ value: link.attributes.href, traverse: true });
    else if (rels.has('preload') && (link.attributes?.as ?? '').toLowerCase() === 'script' && link.attributes?.href) entries.push({ value: link.attributes.href, traverse: false });
  }

  const pending = [];
  for (const entry of entries) {
    if (remoteKind(entry.value) || entry.value.startsWith('data:') || entry.value.startsWith('blob:')) continue;
    try { pending.push({ file: localPathFor(distDir, htmlFile, entry.value), traverse: entry.traverse }); }
    catch (error) { addViolation(violations, route, error.message); }
  }
  const files = new Map();
  const traversed = new Set();
  await init;
  const queueStaticImports = (ownerFile, body) => {
    let imports;
    try { [imports] = parseModules(body); }
    catch { addViolation(violations, route, `cannot parse module: ${relative(distDir, ownerFile).replaceAll('\\', '/')}`); return; }
    for (const imported of imports) {
      if (imported.d !== -1 || !imported.n) continue;
      try { pending.push({ file: resolveModule(distDir, ownerFile, imported.n), traverse: true }); }
      catch (error) { addViolation(violations, route, `${relative(distDir, ownerFile).replaceAll('\\', '/')}: ${error.message}`); }
    }
  };
  for (const script of elements(document, 'script')) {
    if (!script.attributes?.src && (script.attributes?.type ?? '').trim().toLowerCase() === 'module') {
      queueStaticImports(htmlFile, textContent(script));
    }
  }
  while (pending.length) {
    const { file, traverse } = pending.pop();
    const key = relative(distDir, file).replaceAll('\\', '/');
    if (!files.has(key) && !await existsAsExactFile(distDir, file)) {
      addViolation(violations, route, `initial module does not exist: ${key}`);
      continue;
    }
    const body = files.get(key) ?? await readFile(file);
    files.set(key, body);
    if (traverse && !traversed.has(key)) {
      traversed.add(key);
      queueStaticImports(file, body.toString('utf8'));
    }
  }
  return files;
};

export async function inspectEmittedHtml(distDirectory, { budgets = QUALITY_BUDGETS } = {}) {
  const distDir = resolve(distDirectory);
  const allFiles = await walkFiles(distDir);
  const htmlFiles = allFiles.filter(file => extname(file).toLowerCase() === '.html').sort();
  const violations = [];
  const routes = [];
  for (const file of htmlFiles) {
    let route;
    try { route = routeFor(distDir, file); }
    catch (error) { violations.push(error.message); continue; }
    const body = await readFile(file);
    const html = body.toString('utf8');
    let document;
    try { document = parseHtml(html); }
    catch { addViolation(violations, route, 'HTML parser rejected the document'); continue; }
    await inspectDocument({ document, html, file, route, distDir, violations });
    const modules = await initialModuleGraph({ document, file, distDir, route, violations });
    const htmlGzipBytes = gzipSync(body).length;
    const initialModulesGzipBytes = [...modules.values()].reduce((total, module) => total + gzipSync(module).length, 0);
    const inlineExecutableGzipBytes = executableInlineScripts(document)
      .reduce((total, script) => total + gzipSync(Buffer.from(textContent(script))).length, 0);
    if (htmlGzipBytes > budgets.htmlGzipBytes) addViolation(violations, route, `gzip HTML ${htmlGzipBytes} exceeds ${budgets.htmlGzipBytes}`);
    if (initialModulesGzipBytes > budgets.initialModulesGzipBytes) addViolation(violations, route, `initial module gzip ${initialModulesGzipBytes} exceeds ${budgets.initialModulesGzipBytes}`);
    if (inlineExecutableGzipBytes > budgets.inlineExecutableGzipBytes) addViolation(violations, route, `inline executable gzip ${inlineExecutableGzipBytes} exceeds ${budgets.inlineExecutableGzipBytes}`);
    routes.push({
      route,
      file: relative(distDir, file).replaceAll('\\', '/'),
      htmlGzipBytes,
      initialModulesGzipBytes,
      inlineExecutableGzipBytes,
      initialModules: [...modules.keys()].sort(),
    });
  }
  if (!htmlFiles.length) violations.push('No emitted HTML files found');
  const javascriptFiles = allFiles.filter(file => extname(file).toLowerCase() === '.js');
  const report = {
    budgets: { ...budgets },
    pageCount: routes.length,
    totalEmittedJavaScriptGzipBytes: (await Promise.all(javascriptFiles.map(async file => gzipSync(await readFile(file)).length))).reduce((a, b) => a + b, 0),
    routes,
  };
  if (violations.length) throw new AggregateError(violations.map(message => new Error(message)), `Emitted HTML quality failed:\n${violations.map(message => `- ${message}`).join('\n')}`);
  return report;
}
