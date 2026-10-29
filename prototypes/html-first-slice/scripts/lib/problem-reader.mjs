import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';
import { readServiceLocationRoutes } from './service-location-reader.mjs';

// Fail-closed projection of data/content.ts `problemPages` onto the fields
// pages/ProblemPage.tsx renders. Every field in the source record type is
// rendered (cause/solution icons select an SVG, falling back to CheckCircle as
// the React iconMap does; `slug` drives the canonical, analytics id and the
// ransomware emergency variant), so nothing is dropped. Source order is
// preserved; the route inventory is the object's key order.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['slug', 'title', 'metaDesc', 'h1', 'intro', 'symptoms', 'causes', 'solutions', 'content', 'faqs', 'cta'];
export const STRING_FIELDS = ['slug', 'title', 'metaDesc', 'h1', 'intro', 'content', 'cta'];
// The React component that owns every problem route in App.tsx.
export const ROUTE_COMPONENT = 'ProblemPage';

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]*\]\(([^)]*)\)/g)) {
    if (!isAllowedInlineHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

function validateTextObject(value, fields, label) {
  assertExactKeys(value, fields, label);
  return Object.fromEntries(fields.map(field => [field, assertString(value[field], `${label}.${field}`)]));
}

function validateEntry(key, entry) {
  if (!SLUG_PATTERN.test(key)) throw new Error(`problemPages key "${key}" is not a safe route segment`);
  assertPlainObject(entry, `problemPages.${key}`);
  assertExactKeys(entry, REQUIRED_FIELDS, `problemPages.${key}`);
  const strings = {};
  for (const field of STRING_FIELDS) strings[field] = assertString(entry[field], `problemPages.${key}.${field}`);
  // ProblemPage looks the record up by pathname but canonicalises, tracks and
  // styles by data.slug, so the two must be the same string.
  if (strings.slug !== key) throw new Error(`problemPages.${key}.slug "${strings.slug}" does not match its key`);
  const symptoms = assertArray(entry.symptoms, `problemPages.${key}.symptoms`).map((symptom, index) =>
    assertString(symptom, `problemPages.${key}.symptoms[${index}]`));
  const causes = assertArray(entry.causes, `problemPages.${key}.causes`).map((cause, index) =>
    validateTextObject(cause, ['title', 'desc', 'icon'], `problemPages.${key}.causes[${index}]`));
  const solutions = assertArray(entry.solutions, `problemPages.${key}.solutions`).map((solution, index) =>
    validateTextObject(solution, ['title', 'desc', 'icon'], `problemPages.${key}.solutions[${index}]`));
  // Rendered through RichText: content and faqs[].a. faqs[].q is plain text.
  validateInlineLinks(strings.content, `problemPages.${key}.content`);
  const faqs = assertArray(entry.faqs, `problemPages.${key}.faqs`).map((faq, index) => {
    const source = validateTextObject(faq, ['q', 'a'], `problemPages.${key}.faqs[${index}]`);
    validateInlineLinks(source.a, `problemPages.${key}.faqs[${index}].a`);
    return source;
  });
  return {
    slug: strings.slug,
    title: strings.title,
    metaDesc: strings.metaDesc,
    h1: strings.h1,
    intro: strings.intro,
    symptoms,
    causes,
    solutions,
    content: strings.content,
    faqs,
    cta: strings.cta,
  };
}

export function readProblems(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertPlainObject(topLevelConstLiteral(file, 'problemPages'), 'problemPages');
  const keys = Object.keys(entries);
  if (!keys.length) throw new Error('problemPages has no records');
  const titles = new Set();
  return keys.map(key => {
    const page = validateEntry(key, entries[key]);
    const titleKey = page.title.toLocaleLowerCase('en-GB');
    if (titles.has(titleKey)) throw new Error(`Duplicate problem title ${page.title}`);
    titles.add(titleKey);
    return page;
  });
}

// Root-slug routes owned by the ProblemPage component in App.tsx, in source
// order. The service-location route reader already walks the TSX AST for an
// arbitrary component name, so it is reused rather than duplicated.
export function readProblemRoutes(fileName, source) {
  return readServiceLocationRoutes(fileName, source, ROUTE_COMPONENT);
}

// The React routes are hand-listed while the data is keyed: both must agree
// exactly, otherwise a record would be built here that production never serves
// (or a production route would have no native output).
export function assertProblemRouteInventory(pages, routes) {
  const slugs = pages.map(page => page.slug);
  const missing = slugs.filter(slug => !routes.includes(slug));
  const unexpected = routes.filter(slug => !slugs.includes(slug));
  if (missing.length || unexpected.length) {
    throw new Error(`App.tsx ${ROUTE_COMPONENT} routes differ from problemPages. Not routed: [${missing.join(', ')}]. Routed without a record: [${unexpected.join(', ')}]`);
  }
  return slugs;
}
