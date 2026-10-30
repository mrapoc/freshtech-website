import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';

// Fail-closed projection of data/content.ts `serviceLocationPages` onto the
// fields pages-v2/ServiceLocationPageV2.tsx renders. Every field in the source
// record type is rendered (benefit icons select an SVG, falling back to the
// CheckCircle glyph exactly as the React ICON_MAP does), so nothing is dropped.
// Source order is preserved; the route inventory is the object's key order.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['service', 'location', 'isCounty', 'title', 'metaDesc', 'h1', 'intro', 'content', 'benefits', 'localContext', 'faqs', 'relatedService', 'relatedLocation'];
export const STRING_FIELDS = ['service', 'location', 'title', 'metaDesc', 'h1', 'intro', 'content', 'localContext', 'relatedService', 'relatedLocation'];

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
  if (!SLUG_PATTERN.test(key)) throw new Error(`serviceLocationPages key "${key}" is not a safe route segment`);
  assertPlainObject(entry, `serviceLocationPages.${key}`);
  assertExactKeys(entry, REQUIRED_FIELDS, `serviceLocationPages.${key}`);
  const strings = {};
  for (const field of STRING_FIELDS) strings[field] = assertString(entry[field], `serviceLocationPages.${key}.${field}`);
  if (typeof entry.isCounty !== 'boolean') throw new Error(`serviceLocationPages.${key}.isCounty must be a boolean literal`);
  for (const field of ['relatedService', 'relatedLocation']) {
    if (!SLUG_PATTERN.test(strings[field])) throw new Error(`serviceLocationPages.${key}.${field} "${strings[field]}" is not a safe route segment`);
  }
  // Rendered through RichText (content, faqs[].a) or renderInlineMd (faqs[].q).
  validateInlineLinks(strings.content, `serviceLocationPages.${key}.content`);
  const benefits = assertArray(entry.benefits, `serviceLocationPages.${key}.benefits`).map((benefit, index) =>
    validateTextObject(benefit, ['title', 'desc', 'icon'], `serviceLocationPages.${key}.benefits[${index}]`));
  const faqs = assertArray(entry.faqs, `serviceLocationPages.${key}.faqs`).map((faq, index) => {
    const source = validateTextObject(faq, ['q', 'a'], `serviceLocationPages.${key}.faqs[${index}]`);
    validateInlineLinks(source.q, `serviceLocationPages.${key}.faqs[${index}].q`);
    validateInlineLinks(source.a, `serviceLocationPages.${key}.faqs[${index}].a`);
    return source;
  });
  return {
    slug: key,
    service: strings.service,
    location: strings.location,
    isCounty: entry.isCounty,
    title: strings.title,
    metaDesc: strings.metaDesc,
    h1: strings.h1,
    intro: strings.intro,
    content: strings.content,
    benefits,
    localContext: strings.localContext,
    faqs,
    relatedService: strings.relatedService,
    relatedLocation: strings.relatedLocation,
  };
}

export function readServiceLocations(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertPlainObject(topLevelConstLiteral(file, 'serviceLocationPages'), 'serviceLocationPages');
  const keys = Object.keys(entries);
  if (!keys.length) throw new Error('serviceLocationPages has no records');
  const titles = new Set();
  return keys.map(key => {
    const page = validateEntry(key, entries[key]);
    const titleKey = page.title.toLocaleLowerCase('en-GB');
    if (titles.has(titleKey)) throw new Error(`Duplicate service-location title ${page.title}`);
    titles.add(titleKey);
    return page;
  });
}
