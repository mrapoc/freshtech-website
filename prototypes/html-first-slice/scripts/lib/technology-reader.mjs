import { assertArray, assertExactKeys, assertPlainObject, assertString, literalValue, parseSource, topLevelConstLiteral, ts } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';

// Fail-closed readers for the technology family. Three sources are projected
// onto exactly what the technology listing and explainer pages render:
// - data/content.ts `techExplainers`: one record per /technology/[slug] route.
//   Benefit `icon` strings are validated and dropped (no icon is rendered).
// - data/content.ts `services`: only `slug` and `title` are evaluated, because
//   the explainer page shows related services by title. Every other service
//   property is left unevaluated so this reader never depends on their shape.
// - data/technology-pages.json: the /technology listing cards and category
//   order, and the "More Technology Explained" directory on each explainer.
// Nothing is executed. Text is preserved exactly as written in the source.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const EXPLAINER_REQUIRED_FIELDS = ['title', 'metaDesc', 'h1', 'intro', 'whatItIs', 'benefits', 'risks', 'howWeDoIt', 'faqs', 'relatedServices'];
export const EXPLAINER_OPTIONAL_FIELDS = ['heroImage'];
export const LISTING_PAGE_FIELDS = ['slug', 'title', 'desc', 'category'];
export const DIRECTORY_PAGE_FIELDS = ['slug', 'title'];
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function describe(file, node) {
  const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file));
  return `${file.fileName}:${line + 1}:${character + 1}`;
}

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!isAllowedInlineHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

// Same image rule as the case-study reader: absolute https or a site-relative
// path of unreserved characters (no schemes, query strings, whitespace or ..).
export function isSafeImageSource(value) {
  if (typeof value !== 'string' || !value) return false;
  if (/^https:\/\/[A-Za-z0-9.-]+\/[A-Za-z0-9._~!$&'()*+,;=:@/%-]+$/.test(value)) return true;
  return /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/.test(value) && !value.includes('..');
}

function assertSlug(value, label) {
  assertString(value, label);
  if (!SLUG_PATTERN.test(value)) throw new Error(`${label} "${value}" is not a safe route segment`);
  return value;
}

function textObject(value, fields, label) {
  assertExactKeys(value, fields, label);
  return Object.fromEntries(fields.map(field => [field, assertString(value[field], `${label}.${field}`)]));
}

function validateExplainer(key, entry) {
  const label = `techExplainers.${key}`;
  assertSlug(key, 'techExplainers key');
  assertPlainObject(entry, label);
  for (const field of Object.keys(entry)) {
    if (!EXPLAINER_REQUIRED_FIELDS.includes(field) && !EXPLAINER_OPTIONAL_FIELDS.includes(field)) throw new Error(`${label} has unexpected field ${field}`);
  }
  for (const field of EXPLAINER_REQUIRED_FIELDS) {
    if (!Object.hasOwn(entry, field)) throw new Error(`${label} is missing field ${field}`);
  }
  const strings = {};
  for (const field of ['title', 'metaDesc', 'h1', 'intro', 'whatItIs', 'howWeDoIt']) strings[field] = assertString(entry[field], `${label}.${field}`);
  // Only whatItIs, howWeDoIt and FAQ answers pass through RichText in the
  // source page; intro, titles and card copy are rendered as plain text.
  validateInlineLinks(strings.whatItIs, `${label}.whatItIs`);
  validateInlineLinks(strings.howWeDoIt, `${label}.howWeDoIt`);
  const benefits = assertArray(entry.benefits, `${label}.benefits`).map((card, index) => {
    const source = textObject(card, ['title', 'desc', 'icon'], `${label}.benefits[${index}]`);
    return { title: source.title, desc: source.desc };
  });
  const risks = assertArray(entry.risks, `${label}.risks`).map((card, index) => textObject(card, ['title', 'desc'], `${label}.risks[${index}]`));
  const faqs = assertArray(entry.faqs, `${label}.faqs`).map((faq, index) => {
    const source = textObject(faq, ['q', 'a'], `${label}.faqs[${index}]`);
    validateInlineLinks(source.a, `${label}.faqs[${index}].a`);
    return source;
  });
  const relatedServices = assertArray(entry.relatedServices, `${label}.relatedServices`, 0).map((slug, index) => assertSlug(slug, `${label}.relatedServices[${index}]`));
  if (new Set(relatedServices).size !== relatedServices.length) throw new Error(`${label}.relatedServices contains a duplicate slug`);
  let heroImage = null;
  if (Object.hasOwn(entry, 'heroImage')) {
    assertString(entry.heroImage, `${label}.heroImage`);
    if (!isSafeImageSource(entry.heroImage)) throw new Error(`${label}.heroImage is not a safe image source`);
    heroImage = entry.heroImage;
  }
  return { slug: key, ...strings, heroImage, benefits, risks, faqs, relatedServices };
}

export function readTechExplainers(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertPlainObject(topLevelConstLiteral(file, 'techExplainers'), 'techExplainers');
  const titles = new Set();
  const explainers = Object.entries(entries).map(([key, entry]) => validateExplainer(key, entry));
  if (!explainers.length) throw new Error('techExplainers has no records');
  for (const explainer of explainers) {
    const titleKey = explainer.title.toLocaleLowerCase('en-GB');
    if (titles.has(titleKey)) throw new Error(`Duplicate techExplainers title ${explainer.title}`);
    titles.add(titleKey);
  }
  return explainers;
}

function topLevelConstNode(file, name) {
  const matches = [];
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) matches.push({ statement, declaration });
    }
  }
  if (matches.length !== 1) throw new Error(`${file.fileName} must declare ${name} exactly once (found ${matches.length})`);
  const { statement, declaration } = matches[0];
  if (!(statement.declarationList.flags & ts.NodeFlags.Const)) throw new Error(`${name} must be a const declaration`);
  if (!declaration.initializer) throw new Error(`${name} has no initializer`);
  return declaration.initializer;
}

function arrayElements(file, node, label) {
  if (!ts.isArrayLiteralExpression(node)) throw new Error(`${label} must be an array literal`);
  return node.elements.map(element => {
    if (ts.isSpreadElement(element) || ts.isOmittedExpression(element)) throw new Error(`Array spread or hole at ${describe(file, element)}`);
    if (!ts.isObjectLiteralExpression(element)) throw new Error(`${label} entries must be object literals (${describe(file, element)})`);
    return element;
  });
}

function propertyName(file, property) {
  if (!ts.isPropertyAssignment(property)) throw new Error(`Only plain property assignments are supported at ${describe(file, property)}`);
  if (ts.isComputedPropertyName(property.name) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
    throw new Error(`Unsupported property key at ${describe(file, property)}`);
  }
  const key = property.name.text;
  if (UNSAFE_KEYS.has(key)) throw new Error(`Unsafe object key ${key} at ${describe(file, property)}`);
  return key;
}

function uniqueSlugs(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.slug)) throw new Error(`${label} contains duplicate slug ${item.slug}`);
    seen.add(item.slug);
  }
  return items;
}

// data/technology-pages.json: `listing` (cards and category order) and `directory`.
export function readTechnologyPages(source) {
  assertPlainObject(source, 'technology pages');
  assertExactKeys(source, ['listing', 'directory'], 'technology pages');
  assertExactKeys(source.listing, ['pages', 'categories'], 'listing');
  const pages = assertArray(source.listing.pages, 'listing.pages').map((card, index) => {
    const page = textObject(card, LISTING_PAGE_FIELDS, `listing.pages[${index}]`);
    assertSlug(page.slug, `listing.pages[${index}].slug`);
    return page;
  });
  const categories = assertArray(source.listing.categories, 'listing.categories').map((category, index) => assertString(category, `listing.categories[${index}]`));
  if (new Set(categories).size !== categories.length) throw new Error('listing.categories contains a duplicate');
  for (const page of pages) {
    if (!categories.includes(page.category)) throw new Error(`listing card ${page.slug} category "${page.category}" is not in categories`);
  }
  const directory = assertArray(source.directory, 'directory').map((entry, index) => {
    const page = textObject(entry, DIRECTORY_PAGE_FIELDS, `directory[${index}]`);
    assertSlug(page.slug, `directory[${index}].slug`);
    return page;
  });
  return { listing: { pages: uniqueSlugs(pages, 'listing.pages'), categories }, directory: uniqueSlugs(directory, 'directory') };
}

// data/content.ts `services`: slug and title only. Other members are not evaluated.
export function readServiceCatalogue(fileName, source) {
  const file = parseSource(fileName, source);
  const services = arrayElements(file, topLevelConstNode(file, 'services'), 'services').map((element, index) => {
    const label = `services[${index}]`;
    const picked = {};
    const seen = new Set();
    for (const property of element.properties) {
      const key = propertyName(file, property);
      if (seen.has(key)) throw new Error(`Duplicate object key ${key} at ${describe(file, property)}`);
      seen.add(key);
      if (key === 'slug' || key === 'title') picked[key] = assertString(literalValue(file, property.initializer), `${label}.${key}`);
    }
    for (const key of ['slug', 'title']) if (!Object.hasOwn(picked, key)) throw new Error(`${label} is missing field ${key}`);
    assertSlug(picked.slug, `${label}.slug`);
    return picked;
  });
  if (!services.length) throw new Error('services has no entries');
  return uniqueSlugs(services, 'services');
}

// Cross-source inventory. Related services resolve by catalogue lookup exactly
// as the React page does (`services.find(...)` then `filter(Boolean)`): a slug
// with no catalogue entry is dropped from the rendered links but recorded so
// the output checker can prove it was not emitted and the log can report it.
export function buildTechnologyData({ explainers, listing, directory, services }) {
  const slugs = new Set(explainers.map(explainer => explainer.slug));
  for (const page of listing.pages) {
    if (!slugs.has(page.slug)) throw new Error(`Listing card ${page.slug} has no techExplainers record`);
  }
  for (const page of directory) {
    if (!slugs.has(page.slug)) throw new Error(`Directory entry ${page.slug} has no techExplainers record`);
  }
  const titles = new Map(services.map(service => [service.slug, service.title]));
  const records = explainers.map(explainer => {
    const related = [];
    const unresolvedRelatedServices = [];
    for (const slug of explainer.relatedServices) {
      if (titles.has(slug)) related.push({ slug, title: titles.get(slug) });
      else unresolvedRelatedServices.push(slug);
    }
    return { ...explainer, related, unresolvedRelatedServices };
  });
  return {
    techExplainers: records,
    techSlugs: records.map(record => record.slug),
    technologyListing: listing,
    technologyDirectory: directory,
    unlistedSlugs: records.map(record => record.slug).filter(slug => !listing.pages.some(page => page.slug === slug)),
  };
}
