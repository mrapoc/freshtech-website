import { parse } from 'ultrahtml';
import { visibleText } from '../../src/lib/blog-markdown.mjs';

// Rendered-text extraction for the blog output checker. The earlier checker
// replaced every tag with a space, so "<strong>Bold</strong>." became "Bold ."
// and any source sentence with punctuation right after inline formatting failed
// content parity for no real reason. This walks the parsed DOM instead: inline
// elements contribute nothing to the text so adjacency survives, block-level
// elements contribute a boundary so text from neighbouring blocks never runs
// together, and entities are decoded exactly once (ultrahtml keeps text raw).

const ELEMENT_NODE = 1;
const SKIPPED = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'body', 'br', 'button', 'caption', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'legend', 'li', 'main', 'nav', 'ol', 'option', 'p', 'pre', 'section',
  'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title', 'tr', 'ul', 'video',
]);
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', middot: '·', pound: '£', copy: '©', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

export const decodeEntities = value => value.replace(/&(?:#x([\da-f]+)|#(\d+)|([a-z]+));/gi, (entity, hex, decimal, name) => {
  if (name) return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
  try { return String.fromCodePoint(Number.parseInt(hex ?? decimal, hex ? 16 : 10)); }
  catch { return entity; }
});

const collect = (node, out) => {
  if (typeof node.value === 'string') { out.push(decodeEntities(node.value)); return; }
  const name = node.type === ELEMENT_NODE ? (node.name ?? '').toLowerCase() : '';
  if (SKIPPED.has(name)) return;
  const block = BLOCK.has(name);
  if (block) out.push('\n');
  for (const child of node.children ?? []) collect(child, out);
  if (block) out.push('\n');
};

// Whitespace-normalised text of an HTML string or fragment. Block boundaries
// become a single space; inline adjacency ("Bold." from <strong>Bold</strong>.)
// is preserved verbatim.
export function renderedText(html) {
  const out = [];
  collect(parse(html), out);
  return out.join('').replace(/\s+/g, ' ').trim();
}

export const normalise = value => value.replace(/\s+/g, ' ').trim();

// Pieces of source text (per block, per list item, per table cell) that the
// rendered article text does not contain. Empty means full content parity.
export function missingBodyText(articleHtml, blocks) {
  const text = renderedText(articleHtml);
  const missing = [];
  for (const block of blocks) {
    const pieces = block.type === 'table' ? [...block.header, ...block.rows.flat()].map(visibleText)
      : block.type === 'ul' || block.type === 'ol' ? block.items.map(visibleText) : [visibleText(block.children)];
    for (const piece of pieces) {
      const wanted = normalise(piece);
      if (wanted && !text.includes(wanted)) missing.push({ type: block.type, text: wanted });
    }
  }
  return missing;
}
