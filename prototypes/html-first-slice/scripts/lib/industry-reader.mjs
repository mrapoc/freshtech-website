import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';

// Fail-closed projection of data/content.ts `industryPages` onto the fields the
// V2 templates actually render (pages-v2/IndustriesPageV2.tsx and
// pages-v2/IndustryDetailPageV2.tsx). heroImage, content, cta and card icons are
// present in the source but never rendered by either template, so they are
// validated loosely and dropped. Source order is preserved: the listing grid and
// the "Other sectors" links both depend on it.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['slug', 'name', 'desc', 'title', 'metaDesc', 'h1', 'intro', 'challenges', 'solutions', 'faqs'];
export const OPTIONAL_FIELDS = ['heroImage', 'content', 'cta', 'minStaff'];
// React-side redirects in IndustryDetailPageV2 that are not source records. They
// must become edge redirects at root integration, never duplicate routes.
export const ROUTE_ALIASES = { engineering: 'manufacturing', legal: 'solicitors' };

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!isAllowedInlineHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

function validateTextObject(value, fields, label) {
  assertExactKeys(value, fields, label);
  return Object.fromEntries(fields.map(field => [field, assertString(value[field], `${label}.${field}`)]));
}

function readCards(entry, field, slug) {
  return assertArray(entry[field], `industryPages.${slug}.${field}`).map((card, index) => {
    const source = validateTextObject(card, ['title', 'desc', 'icon'], `industryPages.${slug}.${field}[${index}]`);
    validateInlineLinks(source.desc, `industryPages.${slug}.${field}[${index}].desc`);
    return { title: source.title, desc: source.desc };
  });
}

function validateEntry(key, entry) {
  if (!SLUG_PATTERN.test(key)) throw new Error(`industryPages key "${key}" is not a safe route segment`);
  if (Object.hasOwn(ROUTE_ALIASES, key)) throw new Error(`industryPages key "${key}" collides with a route alias`);
  assertPlainObject(entry, `industryPages.${key}`);
  for (const field of Object.keys(entry)) {
    if (!REQUIRED_FIELDS.includes(field) && !OPTIONAL_FIELDS.includes(field)) throw new Error(`industryPages.${key} has unexpected field ${field}`);
  }
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(entry, field)) throw new Error(`industryPages.${key} is missing field ${field}`);
  }
  const strings = {};
  for (const field of REQUIRED_FIELDS.filter(field => !['challenges', 'solutions', 'faqs'].includes(field))) {
    strings[field] = assertString(entry[field], `industryPages.${key}.${field}`);
  }
  if (strings.slug !== key) throw new Error(`industryPages.${key} declares slug "${strings.slug}" that differs from its key`);
  validateInlineLinks(strings.intro, `industryPages.${key}.intro`);

  const challenges = readCards(entry, 'challenges', key);
  const solutions = readCards(entry, 'solutions', key);
  const faqs = assertArray(entry.faqs, `industryPages.${key}.faqs`).map((faq, index) => {
    const source = validateTextObject(faq, ['q', 'a'], `industryPages.${key}.faqs[${index}]`);
    validateInlineLinks(source.q, `industryPages.${key}.faqs[${index}].q`);
    validateInlineLinks(source.a, `industryPages.${key}.faqs[${index}].a`);
    return source;
  });

  for (const field of ['heroImage', 'content', 'cta']) {
    if (Object.hasOwn(entry, field)) assertString(entry[field], `industryPages.${key}.${field}`);
  }
  let minStaff = null;
  if (Object.hasOwn(entry, 'minStaff')) {
    if (!Number.isInteger(entry.minStaff) || entry.minStaff < 1) throw new Error(`industryPages.${key}.minStaff must be a positive integer`);
    minStaff = entry.minStaff;
  }

  return {
    slug: key,
    name: strings.name,
    desc: strings.desc,
    title: strings.title,
    metaDesc: strings.metaDesc,
    h1: strings.h1,
    intro: strings.intro,
    challenges,
    solutions,
    faqs,
    minStaff,
  };
}

export function readIndustries(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertPlainObject(topLevelConstLiteral(file, 'industryPages'), 'industryPages');
  const names = new Set();
  return Object.entries(entries).map(([key, entry]) => {
    const industry = validateEntry(key, entry);
    const nameKey = industry.name.toLocaleLowerCase('en-GB');
    if (names.has(nameKey)) throw new Error(`Duplicate industry name ${industry.name}`);
    names.add(nameKey);
    return industry;
  });
}
