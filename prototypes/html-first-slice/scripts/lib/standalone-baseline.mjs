import { parse } from 'ultrahtml';
import { decodeEntities, normalise } from './blog-rendered-text.mjs';

// Shared extraction for standalone-page parity. The same function reads the
// production prerendered React HTML (captured once into test-fixtures) and the
// native Astro output, so both sides are measured identically:
//   head:    title, description, canonical, robots, og:type, JSON-LD graph
//   content: inside the single <main>, in document order,
//            headings [level, text], links [href, text], images [src, alt],
//            and the whitespace-normalised visible text.
// Scripts, styles, SVGs, templates, noscript and aria-hidden subtrees are ignored.

const ELEMENT = 1;
const TEXT = 2;
const SKIPPED = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const INLINE = new Set(['a', 'abbr', 'b', 'code', 'em', 'i', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'label']);
const tag = node => (node.type === ELEMENT ? (node.name ?? '').toLowerCase() : '');
const attr = (node, name) => node.attributes?.[name];
const hidden = node => attr(node, 'aria-hidden') === 'true' || attr(node, 'hidden') !== undefined;
const walk = (node, visit) => { if (visit(node) === false) return; for (const child of node.children ?? []) walk(child, visit); };
const find = (root, predicate) => { const out = []; walk(root, node => { if (node.type === ELEMENT && predicate(node)) out.push(node); }); return out; };
// Content lists inside <main> never descend into script, style, svg, template or noscript.
const findContent = (root, predicate) => { const out = []; walk(root, node => { if (node !== root && node.type === ELEMENT && SKIPPED.has(tag(node))) return false; if (node.type === ELEMENT && predicate(node)) out.push(node); }); return out; };

export function visibleText(node) {
  const out = [];
  const collect = current => {
    if (current.type === TEXT) { out.push(decodeEntities(current.value ?? '')); return; }
    const name = tag(current);
    if (SKIPPED.has(name) || (current.type === ELEMENT && hidden(current))) return;
    const block = current.type === ELEMENT && !INLINE.has(name);
    if (block) out.push(' ');
    for (const child of current.children ?? []) collect(child);
    if (block) out.push(' ');
  };
  collect(node);
  return normalise(out.join(''));
}

const rawText = node => (node.children ?? []).map(child => (child.type === TEXT ? child.value ?? '' : rawText(child))).join('');

export function extractPage(html) {
  const document = parse(html);
  const metaContent = key => {
    const node = find(document, n => tag(n) === 'meta' && (attr(n, 'name') === key || attr(n, 'property') === key))[0];
    return node ? decodeEntities(attr(node, 'content') ?? '') : null;
  };
  const titles = find(document, n => tag(n) === 'title');
  const canonical = find(document, n => tag(n) === 'link' && (attr(n, 'rel') ?? '').split(/\s+/).includes('canonical'))[0];
  const schemas = find(document, n => tag(n) === 'script' && (attr(n, 'type') ?? '').toLowerCase() === 'application/ld+json')
    .flatMap(node => { const value = JSON.parse(rawText(node)); return Array.isArray(value) ? value : [value]; });
  const mains = find(document, n => tag(n) === 'main');
  if (mains.length !== 1) throw new Error(`expected exactly one <main>, found ${mains.length}`);
  const main = mains[0];
  const visible = node => { for (let n = node; n; n = n.parent) if (n.type === ELEMENT && hidden(n)) return false; return true; };
  const headings = findContent(main, n => /^h[1-6]$/.test(tag(n))).filter(visible).map(n => [Number(tag(n)[1]), visibleText(n)]);
  const links = findContent(main, n => tag(n) === 'a' && attr(n, 'href') !== undefined).filter(visible).map(n => [decodeEntities(attr(n, 'href')), visibleText(n)]);
  const images = findContent(main, n => tag(n) === 'img').filter(visible).map(n => [decodeEntities(attr(n, 'src') ?? ''), decodeEntities(attr(n, 'alt') ?? '')]);
  return {
    head: {
      title: titles.length ? normalise(decodeEntities(rawText(titles[0]))) : null,
      description: metaContent('description'),
      canonical: canonical ? decodeEntities(attr(canonical, 'href') ?? '') : null,
      robots: metaContent('robots'),
      ogType: metaContent('og:type'),
      ogImage: metaContent('og:image'),
      schemas,
    },
    content: { headings, links, images, text: visibleText(main) },
  };
}

