import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEM_MARKER, inspectMarker, inventoryIsClean, mainMarker, problemInventory } from './problem-inventory.mjs';

// Synthetic documents only: slugs and copy below are invented for the tests
// and are not records from data/content.ts.
const familyPage = (slug, extra = '') => `<!doctype html><html><head><title>x</title></head><body><header></header><main id="main-content" class="pb-page" data-problem-page="${slug}" data-variant="standard" tabindex="-1"><h1>Synthetic heading</h1>${extra}</main><footer></footer></body></html>`;
const plainPage = `<!doctype html><html><body><main id="main-content"><h1>Plans compared</h1></main></body></html>`;
// Marker text inside a style rule, a script string, a comment and visible
// prose, but never as an attribute of the main element.
const decoyPage = `<!doctype html><html><head><style>main[data-problem-page="slow-things"]{color:red}</style></head><body><!-- <main data-problem-page="slow-things"> --><main id="main-content"><h1>Decoy</h1><p>The marker data-problem-page="slow-things" is only text here.</p></main><script>const marker = '<main data-problem-page="slow-things">';</script></body></html>`;
const twoMains = `<!doctype html><html><body><main data-problem-page="slow-things"></main><main data-problem-page="slow-things"></main></body></html>`;
const strayPage = `<!doctype html><html><body><main id="main-content"><div data-problem-page="slow-things"><h1>Stray</h1></div></main></body></html>`;

test('marker constant is the ProblemPage template attribute', () => {
  assert.equal(PROBLEM_MARKER, 'data-problem-page');
});

test('mainMarker reads the marker from the single main element only', () => {
  assert.equal(mainMarker(familyPage('slow-things')), 'slow-things');
  assert.equal(mainMarker(plainPage), null);
  assert.equal(mainMarker(decoyPage), null);
  assert.equal(mainMarker(strayPage), null);
  assert.equal(mainMarker('<body><p>no main</p></body>'), null);
  assert.equal(mainMarker('<main data-problem-page=""></main>'), null);
  assert.equal(mainMarker(twoMains), null);
});

test('inspectMarker reports main count, stray markers and case-insensitive attribute names', () => {
  assert.deepEqual(inspectMarker(familyPage('slow-things')), { mains: 1, marker: 'slow-things', strayMarkers: 0, emptyMarkers: 0 });
  assert.deepEqual(inspectMarker(decoyPage), { mains: 1, marker: null, strayMarkers: 0, emptyMarkers: 0 });
  assert.deepEqual(inspectMarker(twoMains), { mains: 2, marker: null, strayMarkers: 2, emptyMarkers: 0 });
  assert.deepEqual(inspectMarker(strayPage), { mains: 1, marker: null, strayMarkers: 1, emptyMarkers: 0 });
  assert.deepEqual(inspectMarker('<main DATA-PROBLEM-PAGE="loud-things"></main>'), { mains: 1, marker: 'loud-things', strayMarkers: 0, emptyMarkers: 0 });
  assert.deepEqual(inspectMarker(familyPage('slow-things', '<section data-problem-page="slow-things"></section>')), { mains: 1, marker: 'slow-things', strayMarkers: 1, emptyMarkers: 0 });
});

test('an empty marker on a main is an invalid marked page, not an unowned one', () => {
  assert.deepEqual(inspectMarker('<main data-problem-page=""></main>'), { mains: 1, marker: null, strayMarkers: 0, emptyMarkers: 1 });
  assert.deepEqual(inspectMarker('<main data-problem-page></main>'), { mains: 1, marker: null, strayMarkers: 0, emptyMarkers: 1 });
  assert.deepEqual(inspectMarker('<main DATA-PROBLEM-PAGE=""></main>'), { mains: 1, marker: null, strayMarkers: 0, emptyMarkers: 1 });
  assert.deepEqual(inspectMarker('<main data-problem-page="slow-things"></main><main data-problem-page=""></main>'), { mains: 2, marker: null, strayMarkers: 2, emptyMarkers: 1 });
});

test('an unexpected single-main page with an empty marker is reported as invalid rather than silently ignored', () => {
  const inventory = problemInventory([
    { route: 'slow-things', html: familyPage('slow-things') },
    { route: 'slow-sales', html: '<!doctype html><html><body><main id="main-content" data-problem-page=""><h1>Empty claim</h1></main></body></html>' },
  ], ['slow-things']);
  assert.deepEqual(inventory.family, ['slow-things']);
  assert.deepEqual(inventory.missing, []);
  assert.deepEqual(inventory.unexpected, []);
  assert.deepEqual(inventory.invalid, ['slow-sales']);
  assert.equal(inventoryIsClean(inventory), false);
});

test('an expected slug whose main carries an empty marker is both missing and invalid', () => {
  const inventory = problemInventory([
    { route: 'slow-things', html: '<main data-problem-page=""></main>' },
  ], ['slow-things']);
  assert.deepEqual(inventory.family, []);
  assert.deepEqual(inventory.missing, ['slow-things']);
  assert.deepEqual(inventory.invalid, ['slow-things']);
  assert.equal(inventoryIsClean(inventory), false);
});

test('a clean build matches the reader-derived slugs exactly and ignores unrelated root pages', () => {
  const expected = ['slow-things', 'broken-things'];
  const inventory = problemInventory([
    { route: '', html: plainPage },
    { route: 'slow-things', html: familyPage('slow-things') },
    { route: 'broken-things', html: familyPage('broken-things') },
    { route: 'microsoft-365-plans-compared', html: plainPage },
    { route: 'it-support-somewhere', html: `<main data-service-location-page="it-support-somewhere"></main>` },
    { route: 'blog/slow-things', html: decoyPage },
  ], expected);
  assert.deepEqual(inventory, { family: ['slow-things', 'broken-things'], missing: [], unexpected: [], mismatched: [], invalid: [], duplicated: [], multipleMain: [], stray: [] });
  assert.equal(inventoryIsClean(inventory), true);
});

test('missing, unexpected and nested marker/route mismatches are reported by route only', () => {
  const inventory = problemInventory([
    { route: 'slow-things', html: familyPage('slow-things') },
    // A future unrelated root page that adopts the template would be unexpected, not silently claimed.
    { route: 'slow-sales', html: familyPage('slow-sales') },
    { route: 'nested/broken-things', html: familyPage('broken-things') },
  ], ['slow-things', 'broken-things']);
  assert.deepEqual(inventory.family, ['slow-things', 'slow-sales', 'nested/broken-things']);
  assert.deepEqual(inventory.missing, ['broken-things']);
  assert.deepEqual(inventory.unexpected, ['slow-sales', 'nested/broken-things']);
  assert.deepEqual(inventory.mismatched, ['nested/broken-things (marker broken-things)']);
  assert.deepEqual(inventory.duplicated, []);
  assert.equal(inventoryIsClean(inventory), false);
});

test('duplicate markers, multiple mains and stray markers each fail', () => {
  const inventory = problemInventory([
    { route: 'slow-things', html: familyPage('slow-things') },
    { route: 'copies/slow-things', html: familyPage('slow-things') },
    { route: 'broken-things', html: twoMains },
    { route: '', html: strayPage },
  ], ['slow-things', 'broken-things']);
  assert.deepEqual(inventory.family, ['slow-things', 'copies/slow-things']);
  assert.deepEqual(inventory.duplicated, ['slow-things']);
  assert.deepEqual(inventory.mismatched, ['copies/slow-things (marker slow-things)']);
  assert.deepEqual(inventory.unexpected, ['copies/slow-things']);
  assert.deepEqual(inventory.missing, ['broken-things']);
  assert.deepEqual(inventory.multipleMain, ['broken-things']);
  assert.deepEqual(inventory.stray, ['broken-things', '/']);
  assert.deepEqual(inventory.invalid, []);
  assert.equal(inventoryIsClean(inventory), false);
});

test('a page whose marker differs from its own path is mismatched even when the marker is expected', () => {
  const inventory = problemInventory([
    { route: 'slow-things', html: familyPage('broken-things') },
    { route: 'broken-things', html: familyPage('slow-things') },
  ], ['slow-things', 'broken-things']);
  assert.deepEqual(inventory.missing, []);
  assert.deepEqual(inventory.unexpected, []);
  assert.deepEqual(inventory.mismatched, ['slow-things (marker broken-things)', 'broken-things (marker slow-things)']);
  assert.equal(inventoryIsClean(inventory), false);
});

test('rejects malformed inputs and duplicate expected slugs', () => {
  assert.throws(() => problemInventory('pages', ['a']), /array of \{ route, html \}/);
  assert.throws(() => problemInventory([], []), /at least one expected slug/);
  assert.throws(() => problemInventory([], ['a', 'a']), /contain a duplicate/);
  assert.throws(() => problemInventory([{ route: 'a' }], ['a']), /string route and html/);
});
