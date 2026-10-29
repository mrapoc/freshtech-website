import { assertArray, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './literal-reader.mjs';
import { isAllowedBlogHref } from '../../src/lib/blog-markdown.mjs';

// Fail-closed reader for the `blogPosts` literal in data/content.ts, projected
// onto the fields the active V2 templates render (pages-v2/BlogPageV2.tsx and
// pages-v2/BlogPostPageV2.tsx). Any field outside this list throws rather than
// being dropped silently, so a new source field has to be wired deliberately.
//
// Rendered fields:
//   listing: slug, title, tags[0] (category), date, readTime, author, excerpt
//   article: all of the above plus content, image, imageAlt, video, tags[0..3]
//   head:    title, excerpt, image, date, video (Article / VideoObject schema)
// `id` is never rendered but every record carries it (scripts/generate-rss.js
// splits the array on `{ id: "`), so it is required to be a non-empty string.
// It is legacy metadata and is NOT unique in the source; routes key on slug,
// which is the only identity this reader enforces as unique.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const REQUIRED_FIELDS = ['id', 'slug', 'title', 'excerpt', 'content', 'date', 'readTime'];
export const OPTIONAL_STRING_FIELDS = ['author', 'image', 'imageAlt'];
export const OPTIONAL_FIELDS = [...OPTIONAL_STRING_FIELDS, 'tags', 'video'];
export const VIDEO_REQUIRED_FIELDS = ['src', 'poster'];
export const VIDEO_OPTIONAL_FIELDS = ['title', 'caption', 'duration', 'maxWidth'];
export const DEFAULT_CATEGORY = 'IT Advice';
export const DEFAULT_AUTHOR = 'Sam';
export const DEFAULT_AUTHOR_FULL = 'Sam James';

const HTTPS_URL_PATTERN = /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[A-Za-z0-9._~,%-]+)+$/;
const RELATIVE_PATH_PATTERN = /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/;
const ISO_DURATION_PATTERN = /^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function isSafeImage(value) {
  if (typeof value !== 'string' || value.includes('..') || /\s/.test(value)) return false;
  return HTTPS_URL_PATTERN.test(value) || RELATIVE_PATH_PATTERN.test(value);
}

export function isSafeMediaUrl(value) {
  return typeof value === 'string' && !value.includes('..') && HTTPS_URL_PATTERN.test(value);
}

// Post dates are calendar dates, not instants. Accept the two spellings the
// source uses ("Aug 11, 2026" / "August 11, 2026" and "2026-08-11"), validate
// the calendar day and return an ISO calendar date. This is the same day the
// V2 template derives with getFullYear/getMonth/getDate after parsing to local
// midnight, but without the process timezone in the loop.
export function parseCalendarDate(value, label = 'date') {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
  let year; let month; let day;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const written = value.match(/^([A-Za-z]{3,9}) (\d{1,2}), (\d{4})$/);
  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (written) {
    const name = written[1].toLowerCase();
    const index = MONTHS.findIndex(full => full === name || full.slice(0, 3) === name);
    if (index === -1) throw new Error(`${label} "${value}" has an unknown month name`);
    [year, month, day] = [Number(written[3]), index + 1, Number(written[2])];
  } else {
    throw new Error(`${label} "${value}" is not "Mon D, YYYY" or "YYYY-MM-DD"`);
  }
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`${label} "${value}" is not a real calendar day`);
  }
  const pad = number => String(number).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Today's calendar date in the United Kingdom, independent of the build
// machine's timezone. Netlify builds run in UTC; the V2 runtime compares
// against the visitor's local midnight. Publication here is UK-date based.
export function ukCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function initialsOf(name) {
  return name.split(/\s+/).slice(0, 2).map(word => word[0] || '').join('').toUpperCase().slice(0, 2);
}

function validateInlineLinks(value, label) {
  for (const match of value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!isAllowedBlogHref(match[1])) throw new Error(`${label} contains a disallowed inline link target`);
  }
}

function validateVideo(value, label) {
  assertPlainObject(value, label);
  for (const key of Object.keys(value)) {
    if (!VIDEO_REQUIRED_FIELDS.includes(key) && !VIDEO_OPTIONAL_FIELDS.includes(key)) throw new Error(`${label} has unexpected field ${key}`);
  }
  const video = {};
  for (const field of VIDEO_REQUIRED_FIELDS) {
    if (!Object.hasOwn(value, field)) throw new Error(`${label} is missing field ${field}`);
    video[field] = assertString(value[field], `${label}.${field}`);
    if (!isSafeMediaUrl(video[field])) throw new Error(`${label}.${field} is not a safe https URL`);
  }
  for (const field of ['title', 'caption']) {
    if (Object.hasOwn(value, field)) video[field] = assertString(value[field], `${label}.${field}`);
  }
  if (Object.hasOwn(value, 'duration')) {
    video.duration = assertString(value.duration, `${label}.duration`);
    if (!ISO_DURATION_PATTERN.test(video.duration)) throw new Error(`${label}.duration must be an ISO 8601 duration such as PT1M30S`);
  }
  if (Object.hasOwn(value, 'maxWidth')) {
    if (!Number.isInteger(value.maxWidth) || value.maxWidth < 1) throw new Error(`${label}.maxWidth must be a positive integer`);
    video.maxWidth = value.maxWidth;
  }
  return video;
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
  if (!SLUG_PATTERN.test(record.slug)) throw new Error(`${label}.slug "${record.slug}" is not a safe route segment`);
  record.isoDate = parseCalendarDate(record.date, `${label}.date`);
  validateInlineLinks(record.content, `${label}.content`);
  for (const field of OPTIONAL_STRING_FIELDS) {
    if (Object.hasOwn(entry, field)) record[field] = assertString(entry[field], `${label}.${field}`);
  }
  if (Object.hasOwn(record, 'image') && !isSafeImage(record.image)) throw new Error(`${label}.image is not a safe https URL or site-relative path`);
  if (Object.hasOwn(entry, 'imageAlt') && !Object.hasOwn(entry, 'image')) throw new Error(`${label}.imageAlt is present without image`);
  record.tags = [];
  if (Object.hasOwn(entry, 'tags')) {
    const tags = assertArray(entry.tags, `${label}.tags`, 0);
    const seen = new Set();
    tags.forEach((tag, index) => {
      assertString(tag, `${label}.tags[${index}]`);
      if (seen.has(tag)) throw new Error(`${label}.tags repeats ${tag}`);
      seen.add(tag);
    });
    record.tags = [...tags];
  }
  if (Object.hasOwn(entry, 'video')) record.video = validateVideo(entry.video, `${label}.video`);
  // Derived display values, exactly as the V2 templates compute them.
  record.category = record.tags[0] || DEFAULT_CATEGORY;
  record.authorName = record.author || DEFAULT_AUTHOR;
  record.authorInitials = initialsOf(record.author || DEFAULT_AUTHOR_FULL);
  return record;
}

// Parses source text and returns every validated record in source order.
// Publication filtering is a separate step so callers can report what was
// excluded and why.
export function readBlogPosts(fileName, source) {
  const file = parseSource(fileName, source);
  const entries = assertArray(topLevelConstLiteral(file, 'blogPosts'), 'blogPosts');
  const slugs = new Set();
  return entries.map((entry, index) => {
    const record = validateEntry(entry, `blogPosts[${index}]`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate blog post slug ${record.slug}`);
    slugs.add(record.slug);
    return record;
  });
}

// Mirrors the V2 publication rule: not held and not dated after today. A post
// dated today is published. Elapsed dates never lift a hold.
export function publicationOf(posts, { heldSlugs, asOf }) {
  if (!(heldSlugs instanceof Set)) throw new Error('publicationOf requires heldSlugs as a Set');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('publicationOf requires asOf as an ISO calendar date');
  const published = [];
  const held = [];
  const future = [];
  for (const post of posts) {
    if (heldSlugs.has(post.slug)) held.push(post.slug);
    else if (post.isoDate > asOf) future.push(post.slug);
    else published.push(post);
  }
  return { published, held, future, asOf };
}

// Copy conflicts the site's content rules reject (AGENTS.md) but which must
// never be rewritten here: reported for editorial action instead.
export function punctuationConflicts(post) {
  const conflicts = [];
  for (const field of ['title', 'excerpt', 'content', 'imageAlt']) {
    if (typeof post[field] === 'string' && post[field].includes('—')) conflicts.push(`${post.slug}.${field}: em dash`);
  }
  if (post.video?.caption?.includes('—')) conflicts.push(`${post.slug}.video.caption: em dash`);
  return conflicts;
}
