import assert from 'node:assert/strict';
import test from 'node:test';
import { accentTone, badgeText, countyHubSlug, iconName } from './service-location-display.mjs';

const slugs = ['it-support-shropshire', 'cyber-essentials-shropshire', 'it-support-ludlow', 'microsoft-365-hereford', 'it-support-newtown'];

test('town pages link to the same-service county hub only when that hub record exists', () => {
  assert.equal(countyHubSlug({ slug: 'it-support-ludlow', isCounty: false }, slugs), 'it-support-shropshire');
  assert.equal(countyHubSlug({ slug: 'cyber-essentials-telford', isCounty: false }, slugs), 'cyber-essentials-shropshire');
  // Hub record absent: microsoft-365-herefordshire is not in the fixture inventory.
  assert.equal(countyHubSlug({ slug: 'microsoft-365-hereford', isCounty: false }, slugs), null);
  // Town not in the map, county pages, and non-service slugs never get a hub.
  assert.equal(countyHubSlug({ slug: 'it-support-newtown', isCounty: false }, slugs), null);
  assert.equal(countyHubSlug({ slug: 'it-support-shropshire', isCounty: true }, slugs), null);
  assert.equal(countyHubSlug({ slug: 'managed-print-ludlow', isCounty: false }, slugs), null);
});

test('benefit icons map like the React ICON_MAP with the CheckCircle fallback', () => {
  assert.equal(iconName('MapPin'), 'MapPin');
  assert.equal(iconName('Tool'), 'Wrench');
  assert.equal(iconName('Cog'), 'CheckCircle');
  assert.equal(iconName(''), 'CheckCircle');
});

test('accent stripes cycle and the badge adds Welsh Borders for towns only', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(accentTone), ['accent', 'primary', 'green', 'yellow', 'accent', 'primary']);
  assert.equal(badgeText({ location: 'Ludlow', isCounty: false }), 'Ludlow, Welsh Borders');
  assert.equal(badgeText({ location: 'Powys', isCounty: true }), 'Powys');
});
