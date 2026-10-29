import { readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'ultrahtml';
import { readGuides } from './lib/guide-reader.mjs';
import { decodeEntities, normalise, renderedText } from './lib/blog-rendered-text.mjs';
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';

// Focused checker for the emitted /guides/[industry] family. Expectations come
// from the canonical source (data/industryGuides.ts, read structurally with the
// shared AST reader, never executed) and from inline restatements of the source
// page's parseMarkdown line rules, the components/SEO.tsx head formula and the
// pageSchema literal in pages/IndustryGuidePage.tsx. The renderer
// (src/lib/guide-markdown.mjs), the head helper (src/lib/guide-seo.mjs) and the
// generated data are deliberately not imported: a bug shared between renderer
// and checker must not cancel out. Record content is compared, never printed.
//
// Every route is parsed into a DOM (ultrahtml) and compared as decoded text
// and element structure, so raw entities, attribute values and CSS text can
// never satisfy a content assertion by accident.
//
// GUIDE_DIST_DIR is the root of the built site (default <project>/dist), the
// same meaning guide-browser-check.mjs gives it; this checker appends /guides.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'industryGuides.ts');
const siteDir = process.env.GUIDE_DIST_DIR ? resolve(process.env.GUIDE_DIST_DIR) : resolve(projectDir, 'dist');
const distDir = resolve(siteDir, 'guides');

const baseUrl = 'https://fresh-tech.uk';
const organizationId = `${baseUrl}/#organization`;
const defaultImage = DEFAULT_SOCIAL_IMAGE;
const previewRobots = 'noindex, nofollow';
const staticMetadata = {
  'og:image:width': '1200', 'og:image:height': '630', 'og:site_name': 'Fresh Tech IT Support', 'og:locale': 'en_GB',
  'twitter:card': 'summary_large_image', 'twitter:site': '@fresh_tech_', 'twitter:creator': '@fresh_tech_',
};
// getPriorityLabel from the source page.
const PRIORITY_LABELS = { critical: 'Critical', high: 'High Priority', medium: 'Recommended' };
// Copy from the source page and from components/Contact.tsx via SourceContact.astro.
const CTA_COPY = { heading: 'Ready to Implement?', contact: 'Book Free Consultation', healthCheck: 'Take IT Health Check' };
const RELATED_COPY = { cyber: 'Cyber Essentials', pricing: 'View Pricing' };
const CONTACT_COPY = ['Signal for Help', 'Call The Batphone', '01584 517 234', 'Email HQ', 'hello@fresh-tech.uk', 'Face-to-Face', 'Book an Intro Call with Sam', 'Trusted by local businesses for over 10 years'];

// components/SEO.tsx title formula, restated (not imported from service-seo.mjs).
const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
// Breadcrumb names are auto-derived from the pathname by the SEO component.
// Neither "guides" nor any guide slug is in its SEGMENT_NAMES map, so both
// title-case by word.
const titleCase = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const fail = message => { throw new Error(message); };
let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) fail(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Source line oracle ---------------------------------------------------------
// Restates parseMarkdown from pages/IndustryGuidePage.tsx line by line: bullets
// ("• " / "- "), numbered items (/^(\d+)\.\s+(.+)$/), whole-line bold headings,
// blank spacing, otherwise a paragraph. Bold markers are stripped (the source
// regex only recognises **...** with no * inside; anything else is literal).
// The documented native grouping is restated too: consecutive bullet lines are
// one unordered list, consecutive numbered lines one ordered list carrying the
// source numbers, and any other line ends the open list. Output is one entry
// per block: heading/paragraph text, or a list with its kind and items (each
// ordered item keeps its source number so the emitted start/value can be
// checked against the source, not just the item text).
const stripBold = text => text.replace(/\*\*([^*]+)\*\*/g, '$1');
// The source heading test, plus the documented native refinement that a bold
// line with nothing inside stays a paragraph. Bullet and numbered checks run
// first in sourceBlocks, so "- **x**" never reaches this test, as in source.
const isHeadingLine = line => line.startsWith('**') && line.endsWith('**') && line.length >= 5 && !line.slice(2, -2).includes('**') && line.slice(2, -2).trim() !== '';
function sourceBlocks(content) {
  const blocks = [];
  let list = null;
  for (const line of content.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('• ') || line.startsWith('- ')) {
      if (!list || list.kind !== 'ul') { list = { kind: 'ul', items: [] }; blocks.push(list); }
      list.items.push({ text: stripBold(line.slice(2)) });
      continue;
    }
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      if (!list || list.kind !== 'ol') { list = { kind: 'ol', items: [] }; blocks.push(list); }
      list.items.push({ number: Number(numbered[1]), text: stripBold(numbered[2]) });
      continue;
    }
    list = null;
    if (isHeadingLine(line)) { blocks.push({ kind: 'heading', text: line.slice(2, -2) }); continue; }
    if (line.trim() === '') continue;
    blocks.push({ kind: 'paragraph', text: stripBold(line) });
  }
  return blocks;
}
// Effective numbering of an emitted <ol> as a browser would count it: the
// start attribute (default 1) seeds the counter, an li value attribute resets
// it, otherwise each item is the previous plus one. Attributes must be plain
// non-negative integers; anything else fails rather than being coerced.
const INTEGER = /^\d+$/;
function effectiveNumbers(list, items, label) {
  const start = attr(list, 'start');
  expect(start === null || INTEGER.test(start), `${label}: <ol start> is not a plain integer`);
  let next = start === null ? 1 : Number(start);
  return items.map(item => {
    const value = attr(item, 'value');
    expect(value === null || INTEGER.test(value), `${label}: <li value> is not a plain integer`);
    const number = value === null ? next : Number(value);
    next = number + 1;
    return number;
  });
}

// --- DOM helpers (ultrahtml tree: type 1 = element, text nodes carry .value) ---
const ELEMENT = 1;
const isElement = node => node?.type === ELEMENT;
const tag = node => (node.name ?? '').toLowerCase();
const attr = (node, name) => (Object.hasOwn(node.attributes ?? {}, name) ? decodeEntities(node.attributes[name]) : null);
function* walk(node) {
  for (const child of node.children ?? []) {
    if (isElement(child)) { yield child; yield* walk(child); }
  }
}
const findAll = (root, predicate) => [...walk(root)].filter(predicate);
const findOne = (root, predicate, label) => {
  const matches = findAll(root, predicate);
  expect(matches.length === 1, `${label}: expected exactly one match, found ${matches.length}`);
  return matches[0];
};
const byTag = name => node => tag(node) === name;
const byAttr = (name, value) => node => (value === undefined ? attr(node, name) !== null : attr(node, name) === value);
const byClass = name => node => (attr(node, 'class') ?? '').split(/\s+/).includes(name);
const byId = id => byAttr('id', id);
const text = node => renderedText(serialiseText(node));
// Rendered text of a parsed node: re-collected from the tree rather than sliced
// from the original string by offset. Decorative aria-hidden elements (icon
// arrows, ticks) are dropped so link and heading text compares to source copy.
function serialiseText(node) {
  if (typeof node.value === 'string') return node.value;
  if (!isElement(node)) return (node.children ?? []).map(serialiseText).join('');
  const name = tag(node);
  if (['script', 'style', 'svg', 'template', 'noscript'].includes(name) || node.attributes?.['aria-hidden'] === 'true') return '';
  return `<${name}>${(node.children ?? []).map(serialiseText).join('')}</${name}>`;
}
const children = (node, name) => (node.children ?? []).filter(child => isElement(child) && (!name || tag(child) === name));

// --- Head ------------------------------------------------------------------------
function readHead(document) {
  const head = findOne(document, byTag('head'), 'head');
  const title = text(findOne(head, byTag('title'), 'title'));
  const canonicals = findAll(head, node => tag(node) === 'link' && attr(node, 'rel') === 'canonical').map(node => attr(node, 'href'));
  const metadata = {};
  for (const meta of findAll(head, byTag('meta'))) {
    const key = attr(meta, 'name') ?? attr(meta, 'property');
    const content = attr(meta, 'content');
    if (key && content !== null) { expect(!Object.hasOwn(metadata, key), `head: duplicate meta ${key}`); metadata[key] = content; }
  }
  const script = findOne(head, node => tag(node) === 'script' && attr(node, 'id') === 'json-ld-schema', 'json-ld script');
  const raw = (script.children ?? []).map(child => child.value ?? '').join('');
  return { title, canonicals, metadata, schemas: JSON.parse(raw) };
}

function checkHead(route, document, guide) {
  const head = readHead(document);
  const canonical = `${baseUrl}/guides/${guide.slug}`;
  const title = siteTitle(`${guide.title} | Free Guide`);
  expect(head.title === title, `${route}: <title> differs from the SEO formula for "${guide.title} | Free Guide"`);
  expect(same(head.canonicals, [canonical]), `${route}: canonical differs from ${canonical}`);
  const expected = {
    ...staticMetadata, description: guide.metaDesc, robots: previewRobots,
    'og:title': title, 'twitter:title': title, 'og:description': guide.metaDesc, 'twitter:description': guide.metaDesc,
    'og:url': canonical, 'og:type': 'website', 'og:image': defaultImage, 'twitter:image': defaultImage,
  };
  for (const [key, value] of Object.entries(expected)) expect(head.metadata[key] === value, `${route}: metadata ${key} differs from the SEO formula (or preview robots)`);

  // Graph shape: [Article (source pageSchema literal), Organization, BreadcrumbList].
  const schemas = head.schemas;
  expect(Array.isArray(schemas) && schemas.length === 3, `${route}: JSON-LD graph must be exactly Article, Organization, BreadcrumbList`);
  const [article, organization, breadcrumb] = schemas;
  expect(same(article, {
    '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, description: guide.metaDesc,
    author: { '@type': 'Organization', name: 'Fresh Tech IT Support', '@id': organizationId, url: baseUrl },
    publisher: { '@type': 'Organization', name: 'Fresh Tech IT Support', logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png' } },
    articleSection: 'Industry Guides', inLanguage: 'en-GB', isAccessibleForFree: true,
  }), `${route}: Article schema differs from the source pageSchema literal`);
  expect(organization?.['@type'] === 'Organization' && organization['@id'] === organizationId && organization.name === 'Fresh Tech IT Support' && organization.legalName === 'Fresh PCS Consultancy Ltd', `${route}: Organization schema missing or wrong`);
  expect(same(breadcrumb, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${baseUrl}/guides` },
      { '@type': 'ListItem', position: 3, name: titleCase(guide.slug), item: canonical },
    ],
  }), `${route}: BreadcrumbList differs from the auto-derived pathname breadcrumb`);
}

// --- Body ------------------------------------------------------------------------
function checkSection(route, main, guide, section, index) {
  const label = `${route} section ${section.id}`;
  const element = findOne(main, node => tag(node) === 'section' && attr(node, 'id') === `guide-section-${section.id}`, `${label}: <section>`);
  expect(attr(element, 'data-guide-section') !== null, `${label}: missing data-guide-section`);
  expect(!!section.locked === (attr(element, 'data-locked') === 'true'), `${label}: data-locked differs from the source locked flag`);
  // Locked sections must be emitted in full and visible: no hidden attribute on
  // the section or its body, and no gate/unlock markup in place of content.
  expect(attr(element, 'hidden') === null, `${label}: section is hidden`);
  const body = findOne(element, byId(`guide-body-${section.id}`), `${label}: body`);
  expect(attr(body, 'hidden') === null, `${label}: body is hidden at render time`);
  expect(findAll(element, node => ['form', 'input'].includes(tag(node)) && attr(node, 'type') !== 'checkbox').length === 0, `${label}: unexpected form or input (email-capture gate must not be rebuilt)`);

  const heading = findOne(element, byId(`guide-title-${section.id}`), `${label}: h2`);
  expect(tag(heading) === 'h2' && text(heading) === normalise(section.title), `${label}: h2 differs from the source title`);
  expect(attr(element, 'aria-labelledby') === `guide-title-${section.id}`, `${label}: aria-labelledby does not point at the h2`);
  const toggle = findOne(element, byAttr('data-guide-toggle'), `${label}: toggle`);
  expect(attr(toggle, 'hidden') !== null && attr(toggle, 'aria-expanded') === 'true' && attr(toggle, 'aria-controls') === `guide-body-${section.id}`, `${label}: toggle must be hidden, expanded and control the body at render time`);

  // Section content: headings, paragraphs and list items in source order.
  const content = findOne(body, byClass('guide-content'), `${label}: content`);
  const expected = sourceBlocks(section.content);
  const actual = [];
  for (const block of children(content)) {
    const name = tag(block);
    if (name === 'h3') actual.push({ kind: 'heading', text: text(block) });
    else if (name === 'p') actual.push({ kind: 'paragraph', text: text(block) });
    else if (name === 'ul' || name === 'ol') {
      const items = children(block);
      expect(items.length > 0 && items.every(byTag('li')), `${label}: list contains non-li children`);
      if (name === 'ul') {
        expect(attr(block, 'start') === null && items.every(item => attr(item, 'value') === null), `${label}: <ul> or its items carry numbering attributes`);
        actual.push({ kind: 'ul', items: items.map(item => ({ text: text(item) })) });
      } else {
        const numbers = effectiveNumbers(block, items, label);
        actual.push({ kind: 'ol', items: items.map((item, position) => ({ number: numbers[position], text: text(item) })) });
      }
    } else fail(`${label}: unexpected content element <${name}>`);
  }
  const wanted = expected.map(block => (block.items
    ? { kind: block.kind, items: block.items.map(item => (block.kind === 'ol' ? { number: item.number, text: normalise(item.text) } : { text: normalise(item.text) })) }
    : { kind: block.kind, text: normalise(block.text) }));
  expect(same(actual, wanted), `${label}: rendered content blocks differ from the source lines, list kinds or effective numbering (${actual.length} rendered vs ${wanted.length} source)`);
  expect(findAll(content, node => !['h3', 'p', 'ul', 'ol', 'li', 'strong'].includes(tag(node))).length === 0, `${label}: content contains elements outside h3/p/ul/ol/li/strong`);
  // Bold runs: every **x** on a non-heading source line must be exactly one
  // <strong>x</strong> in the output, in order, and no strong may appear
  // without a source marker. Whole-line headings carry no strong (the source
  // h4 had none either).
  const strongTexts = findAll(content, byTag('strong')).map(text);
  const inlineRuns = section.content.replace(/\r\n/g, '\n').split('\n')
    .filter(line => !isHeadingLine(line))
    .flatMap(line => [...line.matchAll(/\*\*([^*]+)\*\*/g)].map(match => normalise(match[1])));
  expect(same(strongTexts, inlineRuns), `${label}: <strong> runs differ from the source inline bold markers`);

  // Checklist: exact texts, tips, priorities, ids and count, in order.
  const checklist = findAll(body, byClass('guide-checklist'));
  if (section.checklist.length === 0) {
    expect(checklist.length === 0, `${label}: checklist rendered for a section without one`);
  } else {
    expect(checklist.length === 1, `${label}: expected one checklist block`);
    expect(text(findOne(checklist[0], byTag('h3'), `${label}: checklist heading`)) === 'Action Checklist', `${label}: checklist heading copy`);
    const items = findAll(checklist[0], byClass('guide-check'));
    expect(items.length === section.checklist.length, `${label}: checklist count ${items.length} differs from source ${section.checklist.length}`);
    section.checklist.forEach((check, position) => {
      const item = items[position];
      const itemLabel = `${label} check ${check.id}`;
      expect(attr(item, 'data-priority') === check.priority, `${itemLabel}: priority attribute differs`);
      const input = findOne(item, byTag('input'), `${itemLabel}: input`);
      expect(attr(input, 'type') === 'checkbox' && attr(input, 'id') === `guide-check-${check.id}` && attr(input, 'data-guide-check') !== null && attr(input, 'checked') === null, `${itemLabel}: checkbox id, type or initial state`);
      const labelNode = findOne(item, node => tag(node) === 'label' && attr(node, 'for') === `guide-check-${check.id}`, `${itemLabel}: label`);
      expect(text(labelNode) === normalise(check.text), `${itemLabel}: label text differs from source`);
      const priority = findOne(item, byId(`guide-priority-${check.id}`), `${itemLabel}: priority`);
      expect(text(priority) === PRIORITY_LABELS[check.priority], `${itemLabel}: priority label differs from getPriorityLabel`);
      const tips = findAll(item, byId(`guide-tip-${check.id}`));
      if (check.tip) {
        expect(tips.length === 1 && text(tips[0]) === normalise(`Tip: ${check.tip}`), `${itemLabel}: tip text differs from source`);
        expect(attr(input, 'aria-describedby') === `guide-tip-${check.id} guide-priority-${check.id}`, `${itemLabel}: aria-describedby must reference tip then priority`);
      } else {
        expect(tips.length === 0, `${itemLabel}: tip rendered without a source tip`);
        expect(attr(input, 'aria-describedby') === `guide-priority-${check.id}`, `${itemLabel}: aria-describedby must reference the priority only`);
      }
    });
  }

  // TOC entry for this section, in order.
  return { index, anchor: `#guide-section-${section.id}`, entry: `${index + 1}. ${section.title}` };
}

function checkRoute(guide, html) {
  const route = `/guides/${guide.slug}`;
  const document = parse(html);
  checkHead(route, document, guide);

  expect(!html.includes('data-reactroot') && !html.includes('<astro-island'), `${route}: contains framework hydration markup`);
  expect(!/href="\s*(?:javascript|data|vbscript):/i.test(html), `${route}: unsafe link scheme emitted`);

  const main = findOne(document, node => tag(node) === 'main' && attr(node, 'id') === 'main-content', `${route}: main`);
  const totalItems = guide.sections.reduce((total, section) => total + section.checklist.length, 0);
  expect(attr(main, 'data-guide-page') === guide.slug && attr(main, 'data-guide-total') === String(totalItems), `${route}: main data attributes differ from the source slug and checklist total`);

  // Hero and stats.
  const h1s = findAll(document, byTag('h1'));
  expect(h1s.length === 1 && text(h1s[0]) === normalise(guide.title), `${route}: exactly one H1 carrying the source title`);
  const mainText = text(main);
  for (const value of [guide.subtitle, guide.intro, guide.stats.readTime, guide.stats.lastUpdated, 'Free Industry Guide', 'Read Time', 'Checklist Items', 'Last Updated']) {
    expect(mainText.includes(normalise(value)), `${route}: main is missing hero, intro or stats text`);
  }
  const stats = findOne(main, byClass('guide-stats'), `${route}: stats`);
  expect(same(findAll(stats, byTag('dd')).map(text), [guide.stats.readTime, String(totalItems), guide.stats.lastUpdated]), `${route}: stats values differ from source`);
  const crumbs = findAll(findOne(main, byClass('guide-breadcrumb'), `${route}: breadcrumb`), byTag('a'));
  expect(same(crumbs.map(node => [attr(node, 'href'), text(node)]), [['/', 'Home'], ['/industries', 'Industries'], [`/industries/${guide.slug}`, guide.industry]]), `${route}: visible breadcrumb differs from source`);
  expect(attr(findOne(main, byAttr('data-guide-actions'), `${route}: print actions`), 'hidden') !== null, `${route}: print buttons must be hidden until enhanced`);

  // Sections, in source order, every one emitted (locked included).
  const sectionElements = findAll(main, byAttr('data-guide-section'));
  expect(same(sectionElements.map(node => attr(node, 'id')), guide.sections.map(section => `guide-section-${section.id}`)), `${route}: emitted section order or inventory differs from source`);
  const tocExpected = guide.sections.map((section, index) => checkSection(route, main, guide, section, index));
  const toc = findOne(main, byClass('guide-toc'), `${route}: toc`);
  expect(same(findAll(toc, byTag('a')).map(node => [attr(node, 'href'), text(node)]), tocExpected.map(entry => [entry.anchor, normalise(entry.entry)])), `${route}: table of contents differs from the numbered source sections`);
  const lockedCount = guide.sections.filter(section => section.locked).length;
  expect(findAll(main, byAttr('data-locked', 'true')).length === lockedCount, `${route}: locked section count differs from source`);
  expect(findAll(main, byAttr('data-guide-check')).length === totalItems, `${route}: checkbox total differs from the source checklist total`);

  // Progress strip hidden at render time and sized from the source total.
  const progress = findOne(main, byAttr('data-guide-progress'), `${route}: progress strip`);
  expect(attr(progress, 'hidden') !== null, `${route}: progress strip must be hidden until enhanced`);
  const bar = findOne(progress, byTag('progress'), `${route}: progress bar`);
  expect(attr(bar, 'max') === String(totalItems) && attr(bar, 'value') === '0', `${route}: progress bar max/value`);

  // CTA and related links: exact source targets and labels.
  const cta = findOne(main, byClass('guide-cta'), `${route}: cta`);
  expect(text(findOne(cta, byTag('h2'), `${route}: cta heading`)) === CTA_COPY.heading, `${route}: CTA heading copy`);
  expect(text(cta).includes(normalise(`This guide gives you the knowledge. We provide the expertise to make it happen. Book a free consultation to discuss your ${guide.industry.toLowerCase()} IT needs.`)), `${route}: CTA paragraph differs from source (lower-cased industry)`);
  expect(same(findAll(findOne(cta, byClass('guide-cta-actions'), `${route}: cta actions`), byTag('a')).map(node => [attr(node, 'href'), text(node)]), [['/contact', CTA_COPY.contact], ['/it-health-check', CTA_COPY.healthCheck]]), `${route}: CTA links differ from source`);
  const related = findOne(main, byClass('guide-related'), `${route}: related`);
  expect(text(findOne(related, byTag('h2'), `${route}: related heading`)) === 'Related Resources', `${route}: related heading copy`);
  expect(same(findAll(related, byTag('a')).map(node => [attr(node, 'href'), text(node)]), [[`/industries/${guide.slug}`, `${guide.industry} IT Services`], ['/services/cyber-essentials', RELATED_COPY.cyber], ['/pricing', RELATED_COPY.pricing]]), `${route}: related links differ from source`);

  // Shared source contact block, rendered once, disabled form: no inputs, no forms.
  const contact = findOne(main, node => tag(node) === 'section' && attr(node, 'id') === 'contact', `${route}: contact section`);
  const contactText = text(contact);
  for (const copy of CONTACT_COPY) expect(contactText.includes(copy), `${route}: contact block is missing source copy: ${copy}`);
  const contactHrefs = findAll(contact, byTag('a')).map(node => attr(node, 'href'));
  for (const href of ['tel:01584517234', 'mailto:hello@fresh-tech.uk', '/contact', '/onboarding']) expect(contactHrefs.includes(href), `${route}: contact block is missing link ${href}`);
  expect(findAll(contact, byAttr('data-contact-disabled')).length === 1, `${route}: disabled contact notice missing`);
  expect(findAll(contact, node => ['form', 'input', 'textarea', 'select', 'button'].includes(tag(node))).length === 0, `${route}: contact block must contain no form controls in disabled mode`);
  // Inside main the only form controls are the checklist checkboxes (the
  // cookie dialog outside main owns its own form and is checked elsewhere).
  const controls = findAll(main, node => ['form', 'input', 'textarea', 'select'].includes(tag(node)));
  expect(controls.length === totalItems && controls.every(node => tag(node) === 'input' && attr(node, 'data-guide-check') !== null), `${route}: form controls other than the checklist checkboxes inside main`);
  expect(findAll(document, byAttr('data-contact-form')).length === 0 && !html.includes('/api/send-email'), `${route}: the active contact form or its endpoint leaked into the guide route`);

  // Heading outline inside main never skips a level.
  const outline = findAll(main, node => /^h[1-6]$/.test(tag(node))).map(node => Number(tag(node)[1]));
  expect(outline[0] === 1 && outline.every((level, position) => position === 0 || level <= outline[position - 1] + 1), `${route}: heading outline skips a level (${outline.join(',')})`);

  // Ids unique across the document (prefixing must keep source ids off page chrome).
  const ids = findAll(document, byAttr('id')).map(node => attr(node, 'id'));
  expect(new Set(ids).size === ids.length, `${route}: duplicate element ids`);
}

// --- Inventory and run -----------------------------------------------------------
const guides = readGuides('data/industryGuides.ts', await readFile(sourcePath, 'utf8'));
const expectedSlugs = guides.map(guide => guide.slug);
expect(expectedSlugs.length > 0, 'The source has no guides; nothing to verify');
// Recursive discovery: exactly <slug>/index.html per source guide, nothing
// nested deeper, no /guides/index.html listing and no stray files.
let entries;
try {
  entries = await readdir(distDir, { recursive: true, withFileTypes: true });
} catch (error) {
  fail(`Emitted guide directory ${distDir} is not readable (${error.message}); build first or set GUIDE_DIST_DIR to the built site root`);
}
const built = [];
const strays = [];
for (const entry of entries) {
  const parts = relative(distDir, resolve(entry.parentPath, entry.name)).split(sep);
  if (entry.isDirectory()) { if (parts.length > 1) strays.push(`${parts.join('/')}/`); continue; }
  if (entry.isFile() && parts.length === 2 && parts[1] === 'index.html') built.push(parts[0]);
  else strays.push(parts.join('/'));
}
expect(!strays.length, `Unexpected entries under ${distDir}: ${strays.join(', ')} (a /guides listing, nested route or stray file was emitted)`);
const missing = expectedSlugs.filter(slug => !built.includes(slug));
const unexpected = built.filter(slug => !expectedSlugs.includes(slug));
expect(!missing.length && !unexpected.length, `Built guide inventory differs from source. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);

for (const guide of guides) {
  const html = await readFile(resolve(distDir, guide.slug, 'index.html'), 'utf8');
  checkRoute(guide, html);
}

const sectionCount = guides.reduce((total, guide) => total + guide.sections.length, 0);
const lockedCount = guides.reduce((total, guide) => total + guide.sections.filter(section => section.locked).length, 0);
const checkCount = guides.reduce((total, guide) => total + guide.sections.reduce((inner, section) => inner + section.checklist.length, 0), 0);
console.log(`${guides.length} guide routes verified from ${distDir}: ${sectionCount} sections (${lockedCount} locked, all emitted visibly), ${checkCount} checklist items, ${assertions} inventory, content, head and framework assertions passed`);
