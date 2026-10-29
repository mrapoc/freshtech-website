import { createHash } from 'node:crypto';
import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';
import { readServiceLocationRoutes } from './service-location-reader.mjs';

// Fail-closed projection of data/content.ts `comparisonPages` onto the fields
// pages/ComparisonPage.tsx renders. Every field in the source record type is
// rendered (option icons select an SVG, falling back to CheckCircle as the
// React iconMap does), so nothing is dropped. Source order is preserved; the
// route inventory is the object's key order. Every comparison row must carry
// exactly one value per option, because the React table renders row.values
// positionally under the option headers.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['slug', 'title', 'metaDesc', 'h1', 'intro', 'options', 'comparisonRows', 'verdict', 'content', 'faqs', 'cta'];
export const STRING_FIELDS = ['slug', 'title', 'metaDesc', 'h1', 'intro', 'verdict', 'content', 'cta'];
export const OPTION_FIELDS = ['name', 'desc', 'pros', 'cons', 'bestFor', 'icon'];
export const ROUTE_COMPONENT = 'ComparisonPage';

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]*\]\(([^)]*)\)/g)) {
    if (!isAllowedInlineHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

const stringList = (value, label) => assertArray(value, label).map((item, index) => assertString(item, `${label}[${index}]`));

function validateEntry(key, entry) {
  const label = `comparisonPages.${key}`;
  if (!SLUG_PATTERN.test(key)) throw new Error(`comparisonPages key "${key}" is not a safe route segment`);
  assertPlainObject(entry, label);
  assertExactKeys(entry, REQUIRED_FIELDS, label);
  const strings = {};
  for (const field of STRING_FIELDS) strings[field] = assertString(entry[field], `${label}.${field}`);
  if (strings.slug !== key) throw new Error(`${label}.slug "${strings.slug}" does not match its key`);
  const options = assertArray(entry.options, `${label}.options`).map((option, index) => {
    const optionLabel = `${label}.options[${index}]`;
    assertPlainObject(option, optionLabel);
    assertExactKeys(option, OPTION_FIELDS, optionLabel);
    return {
      name: assertString(option.name, `${optionLabel}.name`),
      desc: assertString(option.desc, `${optionLabel}.desc`),
      pros: stringList(option.pros, `${optionLabel}.pros`),
      cons: stringList(option.cons, `${optionLabel}.cons`),
      bestFor: assertString(option.bestFor, `${optionLabel}.bestFor`),
      icon: assertString(option.icon, `${optionLabel}.icon`),
    };
  });
  if (options.length < 2) throw new Error(`${label}.options needs at least two options`);
  const comparisonRows = assertArray(entry.comparisonRows, `${label}.comparisonRows`).map((row, index) => {
    const rowLabel = `${label}.comparisonRows[${index}]`;
    assertPlainObject(row, rowLabel);
    assertExactKeys(row, ['feature', 'values'], rowLabel);
    const values = stringList(row.values, `${rowLabel}.values`);
    if (values.length !== options.length) throw new Error(`${rowLabel} has ${values.length} values for ${options.length} options`);
    return { feature: assertString(row.feature, `${rowLabel}.feature`), values };
  });
  // Rendered through RichText: verdict, content and faqs[].a. faqs[].q is plain text.
  validateInlineLinks(strings.verdict, `${label}.verdict`);
  validateInlineLinks(strings.content, `${label}.content`);
  const faqs = assertArray(entry.faqs, `${label}.faqs`).map((faq, index) => {
    const faqLabel = `${label}.faqs[${index}]`;
    assertPlainObject(faq, faqLabel);
    assertExactKeys(faq, ['q', 'a'], faqLabel);
    const source = { q: assertString(faq.q, `${faqLabel}.q`), a: assertString(faq.a, `${faqLabel}.a`) };
    validateInlineLinks(source.a, `${faqLabel}.a`);
    return source;
  });
  return {
    slug: strings.slug, title: strings.title, metaDesc: strings.metaDesc, h1: strings.h1, intro: strings.intro,
    options, comparisonRows, verdict: strings.verdict, content: strings.content, faqs, cta: strings.cta,
  };
}

export function readComparisons(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertPlainObject(topLevelConstLiteral(file, 'comparisonPages'), 'comparisonPages');
  const keys = Object.keys(entries);
  if (!keys.length) throw new Error('comparisonPages has no records');
  const titles = new Set();
  return keys.map(key => {
    const page = validateEntry(key, entries[key]);
    const titleKey = page.title.toLocaleLowerCase('en-GB');
    if (titles.has(titleKey)) throw new Error(`Duplicate comparison title ${page.title}`);
    titles.add(titleKey);
    return page;
  });
}

// The native template restates fixed copy and the Recommended rule from the
// React component, which data validation cannot see. Fail closed when that
// component changes: SHA-256 of pages/ComparisonPage.tsx with CRLF normalised
// to LF. Update the digest only after re-reviewing the template against it.
export const COMPARISON_SOURCE_FILE = 'pages/ComparisonPage.tsx';
export const REVIEWED_COMPARISON_SOURCE_SHA256 = 'ca9757369dd91b9f077830443bc6721524d0717f616584f045695b72b0f32b7c';
export const comparisonSourceDigest = source => createHash('sha256').update(source.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
export function assertComparisonSource(source, expected = REVIEWED_COMPARISON_SOURCE_SHA256) {
  const actual = comparisonSourceDigest(source);
  if (actual !== expected) throw new Error(`${COMPARISON_SOURCE_FILE} has changed since the native comparison template was reviewed (SHA-256 ${actual}). Re-review the template, then update REVIEWED_COMPARISON_SOURCE_SHA256.`);
  return actual;
}

export function readComparisonRoutes(fileName, source) {
  return readServiceLocationRoutes(fileName, source, ROUTE_COMPONENT);
}

export function assertComparisonRouteInventory(pages, routes) {
  const slugs = pages.map(page => page.slug);
  const missing = slugs.filter(slug => !routes.includes(slug));
  const unexpected = routes.filter(slug => !slugs.includes(slug));
  if (missing.length || unexpected.length) {
    throw new Error(`App.tsx ${ROUTE_COMPONENT} routes differ from comparisonPages. Not routed: [${missing.join(', ')}]. Routed without a record: [${unexpected.join(', ')}]`);
  }
  return slugs;
}
