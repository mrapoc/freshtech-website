import { parse } from 'ultrahtml';

// Emitted-family ownership for the root-slug problem pages. A built page
// belongs to the family only when its single <main> element carries the
// data-problem-page marker. The marker is read from the parsed DOM, never from
// a substring match, so the same text inside a script, style or comment does
// not count, and URL shape is never used: the family has no slug prefix, so a
// future unrelated root page (/microsoft-365-plans-compared, /slow-sales) is
// never claimed and an unexpected marked page is always reported.

const ELEMENT_NODE = 1;
export const PROBLEM_MARKER = 'data-problem-page';

// HTML attribute names are case-insensitive, so DATA-PROBLEM-PAGE on a <main>
// is the marker as far as a browser is concerned and must be read as such.
const markerValue = (node, marker) => {
  for (const [name, value] of Object.entries(node.attributes ?? {})) {
    if (name.toLowerCase() === marker) return typeof value === 'string' ? value : '';
  }
  return undefined;
};

const collect = (node, mains, marked, marker) => {
  if (node.type === ELEMENT_NODE) {
    const name = (node.name ?? '').toLowerCase();
    if (name === 'main') mains.push(node);
    if (markerValue(node, marker) !== undefined) marked.push(node);
  }
  for (const child of node.children ?? []) collect(child, mains, marked, marker);
};

// Marker inspection of one emitted document:
//   mains        number of <main> elements (a valid page has exactly one)
//   marker       the non-empty marker of the single main, else null
//   strayMarkers count of marker attributes on elements other than that main
//   emptyMarkers count of <main> elements carrying the marker with an empty
//                value: a page that claims the family but names no slug is an
//                invalid marked page, never a silently unowned one
// markerName defaults to the problem marker; the comparison family passes its own.
export function inspectMarker(html, markerName = PROBLEM_MARKER) {
  const mains = [];
  const marked = [];
  collect(parse(html), mains, marked, markerName);
  const main = mains.length === 1 ? mains[0] : null;
  const value = main ? markerValue(main, markerName) : undefined;
  const marker = typeof value === 'string' && value !== '' ? value : null;
  return {
    mains: mains.length,
    marker,
    strayMarkers: marked.filter(node => node !== main).length,
    emptyMarkers: mains.filter(node => markerValue(node, markerName) === '').length,
  };
}

// Marker value of the page's single <main>, or null when there is no main,
// more than one main, or the main has no (or an empty) marker.
export const mainMarker = (html, markerName = PROBLEM_MARKER) => inspectMarker(html, markerName).marker;

// pages: [{ route, html }] where route is the emitted directory relative to
// dist with '/' separators ('' for the root index). expectedSlugs: the
// reader-derived problem slugs, in source order. Every list holds routes (or,
// for duplicated, marker values), never page content.
//   family       routes whose single main carries a marker
//   missing      expected slugs with no family page at exactly that path
//   unexpected   family routes that are not an expected slug
//   mismatched   family routes whose marker is not their exact emitted path
//   invalid      routes where a <main> carries the marker with an empty value
//                (reported as an invalid marked page, never counted as family)
//   duplicated   marker values claimed by more than one page
//   multipleMain routes with more than one <main> (never counted as family)
//   stray        routes carrying the marker on an element other than the main
export function problemInventory(pages, expectedSlugs, markerName = PROBLEM_MARKER) {
  if (!Array.isArray(pages)) throw new Error('problemInventory needs an array of { route, html } pages');
  if (!Array.isArray(expectedSlugs) || !expectedSlugs.length) throw new Error('problemInventory needs at least one expected slug');
  if (new Set(expectedSlugs).size !== expectedSlugs.length) throw new Error('problemInventory expected slugs contain a duplicate');
  const family = [];
  const mismatched = [];
  const invalid = [];
  const multipleMain = [];
  const stray = [];
  const claims = new Map();
  for (const { route, html } of pages) {
    if (typeof route !== 'string' || typeof html !== 'string') throw new Error('Every page needs a string route and html');
    const { mains, marker, strayMarkers, emptyMarkers } = inspectMarker(html, markerName);
    const label = route || '/';
    if (mains > 1) multipleMain.push(label);
    if (strayMarkers) stray.push(label);
    if (emptyMarkers) invalid.push(label);
    if (marker === null) continue;
    family.push(route);
    claims.set(marker, (claims.get(marker) ?? 0) + 1);
    if (marker !== route) mismatched.push(`${label} (marker ${marker})`);
  }
  const expected = new Set(expectedSlugs);
  return {
    family,
    missing: expectedSlugs.filter(slug => !family.includes(slug)),
    unexpected: family.filter(route => !expected.has(route)),
    mismatched,
    invalid,
    duplicated: [...claims.entries()].filter(([, count]) => count > 1).map(([marker]) => marker),
    multipleMain,
    stray,
  };
}

export const inventoryIsClean = inventory => ['missing', 'unexpected', 'mismatched', 'invalid', 'duplicated', 'multipleMain', 'stray'].every(key => !inventory[key].length);
