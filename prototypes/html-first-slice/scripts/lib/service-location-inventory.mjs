import { parse } from 'ultrahtml';

// Emitted-family ownership for the root-slug service-location pages. A built
// page belongs to the family only when its <main> element carries the
// data-service-location-page marker. The marker is read from the parsed DOM,
// never from a substring match, so the same text inside a script, style or
// comment does not count, and URL shape (a service-name prefix) is never used:
// a future standalone /microsoft-365-plans-compared page is not family.

const ELEMENT_NODE = 1;
const MARKER = 'data-service-location-page';

const collectMains = (node, out) => {
  if (node.type === ELEMENT_NODE && (node.name ?? '').toLowerCase() === 'main') out.push(node);
  for (const child of node.children ?? []) collectMains(child, out);
};

// Marker value of the page's single <main>, or null when there is no main, more
// than one main, or the main has no marker.
export function mainMarker(html) {
  const mains = [];
  collectMains(parse(html), mains);
  if (mains.length !== 1) return null;
  const value = mains[0].attributes?.[MARKER];
  return typeof value === 'string' && value !== '' ? value : null;
}

// pages: [{ route, html }] where route is the emitted directory relative to
// dist with '/' separators ('' for the root index). expectedSlugs: generated
// serviceLocationSlugs. Returns exact-path differences and marker mismatches.
export function serviceLocationInventory(pages, expectedSlugs) {
  const family = [];
  const mismatched = [];
  for (const { route, html } of pages) {
    const marker = mainMarker(html);
    if (marker === null) continue;
    family.push(route);
    if (marker !== route) mismatched.push(`${route || '/'} (marker ${marker})`);
  }
  const expected = new Set(expectedSlugs);
  return {
    family,
    missing: expectedSlugs.filter(slug => !family.includes(slug)),
    unexpected: family.filter(route => !expected.has(route)),
    mismatched,
  };
}
