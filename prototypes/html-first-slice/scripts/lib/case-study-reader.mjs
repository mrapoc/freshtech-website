import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedInlineHref } from '../../src/lib/inline-markdown.mjs';

// Fail-closed reader for the `caseStudies` literal in data/content.ts. It is
// separated from the extractor so the validation rules can be exercised with
// synthetic fixture source text rather than the private marketing records.

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['id', 'slug', 'client', 'industry', 'title', 'challenge', 'solution', 'result', 'outcome'];
export const OPTIONAL_STRING_FIELDS = ['testimonial', 'contactName', 'image', 'disclosure'];
export const OPTIONAL_FIELDS = [...OPTIONAL_STRING_FIELDS, 'techStack', 'shortStats'];
export const SHORT_STATS_FIELDS = ['risk', 'strategy', 'victory'];
// An image must be an absolute https URL or a site-relative path built from
// unreserved characters. Anything else (schemes, protocol-relative, query
// strings, spaces, traversal) is rejected rather than rendered into `src`.
const HTTPS_IMAGE_PATTERN = /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[A-Za-z0-9._~,%-]+)+$/;
const RELATIVE_IMAGE_PATTERN = /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/;

export function isSafeImage(value) {
  if (typeof value !== 'string' || value.includes('..') || /\s/.test(value)) return false;
  return HTTPS_IMAGE_PATTERN.test(value) || RELATIVE_IMAGE_PATTERN.test(value);
}

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!isAllowedInlineHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

function validateEntry(entry, label) {
  assertPlainObject(entry, label);
  for (const key of Object.keys(entry)) {
    if (!REQUIRED_FIELDS.includes(key) && !OPTIONAL_FIELDS.includes(key)) throw new Error(`${label} has unexpected field ${key}`);
  }
  const record = {};
  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(entry, field)) throw new Error(`${label} is missing field ${field}`);
    record[field] = assertString(entry[field], `${label}.${field}`);
  }
  for (const field of ['challenge', 'solution', 'outcome']) validateInlineLinks(record[field], `${label}.${field}`);
  if (!SLUG_PATTERN.test(record.slug)) throw new Error(`${label}.slug "${record.slug}" is not a safe route segment`);
  for (const field of OPTIONAL_STRING_FIELDS) {
    if (Object.hasOwn(entry, field)) record[field] = assertString(entry[field], `${label}.${field}`);
  }
  if (Object.hasOwn(record, 'image') && !isSafeImage(record.image)) throw new Error(`${label}.image is not a safe https URL or site-relative path`);
  if (Object.hasOwn(entry, 'techStack')) {
    const stack = assertArray(entry.techStack, `${label}.techStack`, 0);
    const seen = new Set();
    stack.forEach((item, index) => {
      assertString(item, `${label}.techStack[${index}]`);
      if (seen.has(item)) throw new Error(`${label}.techStack repeats ${item}`);
      seen.add(item);
    });
    record.techStack = [...stack];
  }
  if (Object.hasOwn(entry, 'shortStats')) {
    assertExactKeys(entry.shortStats, SHORT_STATS_FIELDS, `${label}.shortStats`);
    record.shortStats = {};
    for (const field of SHORT_STATS_FIELDS) record.shortStats[field] = assertString(entry.shortStats[field], `${label}.shortStats.${field}`);
  }
  return record;
}

// Parses source text and returns the validated case-study records in source
// order with normalised key order. The generated route inventory therefore
// follows legitimate additions to the source record without template edits.
export function readCaseStudies(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertArray(topLevelConstLiteral(file, 'caseStudies'), 'caseStudies');
  const slugs = new Set();
  const ids = new Set();
  const records = entries.map((entry, index) => {
    const record = validateEntry(entry, `caseStudies[${index}]`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate case study slug ${record.slug}`);
    if (ids.has(record.id)) throw new Error(`Duplicate case study id ${record.id}`);
    slugs.add(record.slug);
    ids.add(record.id);
    return record;
  });
  return records;
}
