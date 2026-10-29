// Bounded critical-CSS transformer for the prerendered homepage only.
// Pure function over strings: no filesystem, network or process access.
// Beasties (0.5.4) prunes the single inlined bundle down to rules the SSR
// markup needs; the full hashed stylesheet is then requested asynchronously.
import postcss from 'postcss';
import { parse } from 'parse5';

export const BUNDLED_MARKER = 'data-ft-bundled-css';
export const CRITICAL_MARKER = 'data-ft-critical-css';
export const HOME_CANONICAL = 'https://fresh-tech.uk/';
export const SSR_MARKER_VALUE = 'home-v1';
// One hashed file directly under /assets/. No slashes, no dot-led segments.
const SAFE_HREF = /^\/assets\/[A-Za-z0-9_-]+\.css$/;
const ALLOW_RULES = [/\.ft-/, /:root/, /^html/, /^body/, /\.no-print/];

function fail(message) { throw new Error(`homepage critical CSS: ${message}`); }

function documentFacts(html) {
  const facts = { styles: [], critical: 0, hydration: [], canonicals: [], stylesheets: [] };
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
    if ('data-ft-ssr' in attrs || 'data-ft-ssr-date' in attrs) facts.hydration.push(attrs);
    if (node.tagName === 'style' && BUNDLED_MARKER in attrs) facts.styles.push(node);
    if (node.tagName === 'style' && CRITICAL_MARKER in attrs) facts.critical++;
    if (node.tagName === 'link' && attrs.rel === 'canonical') facts.canonicals.push(attrs.href);
    if (node.tagName === 'link' && /\bstylesheet\b/i.test(attrs.rel || '') && attrs.href?.startsWith('/assets/')) facts.stylesheets.push(attrs.href);
    for (const child of node.childNodes || []) visit(child);
  }
  visit(parse(html, { sourceCodeLocationInfo: true }));
  return facts;
}

// Byte offsets of the one bundled <style>, so replacement touches nothing else.
function styleSpan(html, facts) {
  const [style] = facts.styles;
  const location = style.sourceCodeLocation;
  if (!location?.startTag || !location.endTag) fail('bundled style lacks source offsets');
  return { start: location.startTag.startOffset, cssStart: location.startTag.endOffset, cssEnd: location.endTag.startOffset, end: location.endTag.endOffset };
}

function validate(html, stylesheetHref) {
  if (typeof html !== 'string' || typeof stylesheetHref !== 'string') fail('html and stylesheetHref must be strings');
  if (!SAFE_HREF.test(stylesheetHref) || stylesheetHref.includes('..')) fail(`unsafe stylesheet href ${JSON.stringify(stylesheetHref)}`);
  const facts = documentFacts(html);
  if (facts.styles.length !== 1) fail(`expected exactly one style[${BUNDLED_MARKER}], found ${facts.styles.length}`);
  if (facts.critical) fail('document already carries critical CSS');
  const marker = facts.hydration[0];
  if (facts.hydration.length !== 1 || marker.id !== 'root' || marker['data-ft-ssr'] !== SSR_MARKER_VALUE) fail('expected exactly one homepage SSR root');
  if (facts.canonicals.length !== 1 || facts.canonicals[0] !== HOME_CANONICAL) fail('canonical must be the homepage');
  if (facts.stylesheets.length) fail('document already references an external stylesheet');
  return facts;
}

function fontFaces(root) {
  const faces = [];
  root.walkAtRules(rule => { if (rule.name.toLowerCase() === 'font-face') faces.push(rule); });
  return faces;
}

async function runBeasties(html, Beasties) {
  const problems = [];
  const record = level => (...args) => problems.push(`${level}: ${args.map(String).join(' ')}`);
  const noop = () => {};
  const logger = { trace: noop, debug: noop, log: noop, info: noop, warn: record('warn'), error: record('error') };
  const beasties = new Beasties({
    path: '', publicPath: '/', logger, logLevel: 'warn',
    remote: false, external: false, pruneSource: false, compress: false,
    reduceInlineStyles: true, mergeStylesheets: false, inlineFonts: true, preloadFonts: false,
    keyframes: 'all', allowRules: ALLOW_RULES,
  });
  const output = await beasties.process(html);
  if (problems.length) fail(`Beasties reported ${problems.length} problem(s):\n${problems.join('\n')}`);
  if (typeof output !== 'string') fail('Beasties returned no document');
  return output;
}

export async function optimiseHomepageCss(html, stylesheetHref, options = {}) {
  const facts = validate(html, stylesheetHref);
  const span = styleSpan(html, facts);
  const originalCss = html.slice(span.cssStart, span.cssEnd);
  const originalFaces = fontFaces(postcss.parse(originalCss));
  const originalFaceText = originalFaces.map(rule => rule.toString());

  const Beasties = options.Beasties || (await import('beasties')).default;
  // Beasties sees the entire final document so selector matching is exact, but
  // only the pruned <style> text is read back; head, scripts and SSR bytes come
  // from the original string.
  const processed = await runBeasties(html, Beasties);
  const processedFacts = documentFacts(processed);
  if (processedFacts.styles.length !== 1) fail('Beasties output lost the bundled style');
  const processedSpan = styleSpan(processed, processedFacts);
  const critical = postcss.parse(processed.slice(processedSpan.cssStart, processedSpan.cssEnd));

  // Font families only appear in React inline styles, so Beasties drops every
  // @font-face. Restore the original nodes, in order, exactly once.
  for (const rule of fontFaces(critical)) rule.remove();
  critical.prepend(...originalFaces.map(rule => rule.clone()));
  const finalCss = critical.toString();
  const restored = fontFaces(postcss.parse(finalCss)).map(rule => rule.toString());
  if (restored.length !== originalFaceText.length || restored.some((text, index) => text.trim() !== originalFaceText[index].trim())) fail('font-face restoration changed font metadata');
  if (/<\/style/i.test(finalCss)) fail('critical CSS contains an unsafe </style sequence');
  if (!finalCss.trim()) fail('critical CSS is empty');

  const asyncLink = `<link rel="stylesheet" href="${stylesheetHref}" media="print" onload="this.media='all'">`;
  const fallback = `<noscript><link rel="stylesheet" href="${stylesheetHref}"></noscript>`;
  return `${html.slice(0, span.start)}<style ${CRITICAL_MARKER}>${finalCss}</style>${asyncLink}${fallback}${html.slice(span.end)}`;
}
