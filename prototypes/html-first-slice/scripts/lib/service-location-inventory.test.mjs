import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mainMarker, serviceLocationInventory } from './service-location-inventory.mjs';

const familyPage = slug => `<!doctype html><html><head><title>x</title></head><body><header></header><main id="main-content" data-service-location-page="${slug}"><h1>Hi</h1></main></body></html>`;
const plainPage = `<!doctype html><html><body><main id="main-content"><h1>Plans compared</h1></main></body></html>`;
const decoyPage = `<!doctype html><html><head><style>main[data-service-location-page="it-support-ludlow"]{color:red}</style></head><body><main id="main-content"><h1>Decoy</h1></main><script>const marker = 'data-service-location-page="it-support-ludlow"';</script></body></html>`;

test('mainMarker reads the marker from the main element only', () => {
  assert.equal(mainMarker(familyPage('it-support-ludlow')), 'it-support-ludlow');
  assert.equal(mainMarker(plainPage), null);
  assert.equal(mainMarker(decoyPage), null);
  assert.equal(mainMarker('<body><p>no main</p></body>'), null);
  assert.equal(mainMarker('<main data-service-location-page="a"></main><main data-service-location-page="a"></main>'), null);
});

test('inventory compares exact emitted paths with the generated slugs', () => {
  const expected = ['it-support-ludlow', 'cyber-essentials-shropshire'];
  const clean = serviceLocationInventory([
    { route: '', html: plainPage },
    { route: 'it-support-ludlow', html: familyPage('it-support-ludlow') },
    { route: 'cyber-essentials-shropshire', html: familyPage('cyber-essentials-shropshire') },
    { route: 'microsoft-365-plans-compared', html: plainPage },
    { route: 'blog/it-support-ludlow', html: decoyPage },
  ], expected);
  assert.deepEqual(clean, { family: ['it-support-ludlow', 'cyber-essentials-shropshire'], missing: [], unexpected: [], mismatched: [] });

  const broken = serviceLocationInventory([
    { route: 'it-support-ludlow', html: familyPage('it-support-ludlow') },
    { route: 'microsoft-365-plans-compared', html: familyPage('microsoft-365-plans-compared') },
    { route: 'nested/cyber-essentials-shropshire', html: familyPage('cyber-essentials-shropshire') },
  ], expected);
  assert.deepEqual(broken.missing, ['cyber-essentials-shropshire']);
  assert.deepEqual(broken.unexpected, ['microsoft-365-plans-compared', 'nested/cyber-essentials-shropshire']);
  assert.deepEqual(broken.mismatched, ['nested/cyber-essentials-shropshire (marker cyber-essentials-shropshire)']);
});
