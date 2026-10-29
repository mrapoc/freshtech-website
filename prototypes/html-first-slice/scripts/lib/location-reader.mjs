import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['city', 'heroTitle', 'metaDesc', 'heroDesc', 'introTitle', 'introText', 'content', 'features', 'faqs'];
export const OPTIONAL_FIELDS = ['services', 'isCounty', 'towns'];

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!isAllowedInlineHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

function validateTextObject(value, fields, label) {
  assertExactKeys(value, fields, label);
  return Object.fromEntries(fields.map(field => [field, assertString(value[field], `${label}.${field}`)]));
}

function validateEntry(slug, entry) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`locationsData key "${slug}" is not a safe route segment`);
  assertPlainObject(entry, `locationsData.${slug}`);
  for (const key of Object.keys(entry)) {
    if (!REQUIRED_FIELDS.includes(key) && !OPTIONAL_FIELDS.includes(key)) throw new Error(`locationsData.${slug} has unexpected field ${key}`);
  }
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(entry, field)) throw new Error(`locationsData.${slug} is missing field ${field}`);
  }
  const strings = {};
  for (const field of REQUIRED_FIELDS.filter(field => !['features', 'faqs'].includes(field))) {
    strings[field] = assertString(entry[field], `locationsData.${slug}.${field}`);
  }
  validateInlineLinks(strings.introText, `locationsData.${slug}.introText`);

  const features = assertArray(entry.features, `locationsData.${slug}.features`).map((feature, index) => {
    const source = validateTextObject(feature, ['title', 'desc', 'icon'], `locationsData.${slug}.features[${index}]`);
    validateInlineLinks(source.desc, `locationsData.${slug}.features[${index}].desc`);
    return { title: source.title, desc: source.desc };
  });
  const faqs = assertArray(entry.faqs, `locationsData.${slug}.faqs`).map((faq, index) => {
    const source = validateTextObject(faq, ['q', 'a'], `locationsData.${slug}.faqs[${index}]`);
    validateInlineLinks(source.q, `locationsData.${slug}.faqs[${index}].q`);
    validateInlineLinks(source.a, `locationsData.${slug}.faqs[${index}].a`);
    return source;
  });

  if (Object.hasOwn(entry, 'services')) {
    assertArray(entry.services, `locationsData.${slug}.services`).forEach((service, index) => {
      validateTextObject(service, ['title', 'desc', 'link'], `locationsData.${slug}.services[${index}]`);
    });
  }
  if (Object.hasOwn(entry, 'isCounty') && typeof entry.isCounty !== 'boolean') throw new Error(`locationsData.${slug}.isCounty must be a boolean`);
  if (Object.hasOwn(entry, 'towns')) {
    assertArray(entry.towns, `locationsData.${slug}.towns`).forEach((town, index) => assertString(town, `locationsData.${slug}.towns[${index}]`));
  }

  return {
    slug,
    city: strings.city,
    heroTitle: strings.heroTitle,
    metaDesc: strings.metaDesc,
    heroDesc: strings.heroDesc,
    introTitle: strings.introTitle,
    introText: strings.introText,
    features,
    faqs,
  };
}

export function readLocations(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertPlainObject(topLevelConstLiteral(file, 'locationsData'), 'locationsData');
  const cities = new Set();
  return Object.entries(entries).map(([slug, entry]) => {
    const location = validateEntry(slug, entry);
    const cityKey = location.city.toLocaleLowerCase('en-GB');
    if (cities.has(cityKey)) throw new Error(`Duplicate location city ${location.city}`);
    cities.add(cityKey);
    return location;
  });
}
