import assert from 'node:assert/strict';
import test from 'node:test';
import { readLocations } from './location-reader.mjs';

const record = (overrides = {}) => {
  const fields = {
    city: "'Test Town'", heroTitle: "'IT support in Test Town'", metaDesc: "'A useful description.'",
    heroDesc: "'Plain hero copy.'", introTitle: "'Local support'", introText: "'See **local** [support](/services/managed-it-support).'",
    content: "'Unused long-form source copy.'",
    features: "[{ title: 'Fast help', desc: 'Read our [approach](https://example.com/help).', icon: 'Zap' }]",
    faqs: "[{ q: 'Can **you** help?', a: 'Yes. [Contact us](/contact).' }]",
    services: "[{ title: 'Managed support', desc: 'Help.', link: '/services/managed-it-support' }]",
    isCounty: 'false', towns: "['Nearby']", ...overrides,
  };
  return `{ ${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join(', ')} }`;
};
const source = body => `export const locationsData: Record<string, any> = { ${body} };`;

test('reads source order and projects only fields rendered by the V2 template', () => {
  const locations = readLocations('fixture.ts', source(`alpha: ${record()}, beta: ${record({ city: "'Second Town'" })}`));
  assert.deepEqual(locations.map(location => location.slug), ['alpha', 'beta']);
  assert.deepEqual(Object.keys(locations[0]), ['slug', 'city', 'heroTitle', 'metaDesc', 'heroDesc', 'introTitle', 'introText', 'features', 'faqs']);
  assert.deepEqual(locations[0].features[0], { title: 'Fast help', desc: 'Read our [approach](https://example.com/help).' });
  for (const excluded of ['content', 'services', 'isCounty', 'towns', 'icon']) assert.equal(excluded in locations[0], false);
});

test('rejects invalid route keys and duplicate cities', () => {
  assert.throws(() => readLocations('fixture.ts', source(`'Bad Slug': ${record()}`)), /safe route segment/);
  assert.throws(() => readLocations('fixture.ts', source(`one: ${record()}, two: ${record()}`)), /Duplicate location city/);
});

test('rejects non-literal records and spreads', () => {
  assert.throws(() => readLocations('fixture.ts', `const shared = ${record()}; export const locationsData = { test: shared };`), /Non-literal expression/);
  assert.throws(() => readLocations('fixture.ts', source(`test: { ...${record()} }`)), /Only plain property assignments|spread/i);
});

test('rejects missing, unexpected and malformed nested fields', () => {
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ extra: "'no'" })}`)), /unexpected field extra/);
  assert.throws(() => readLocations('fixture.ts', source(`test: { city: 'Only city' }`)), /missing field heroTitle/);
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ features: "[{ title: 'A', desc: 'B' }]" })}`)), /missing field icon/);
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ faqs: '[]' })}`)), /at least 1/);
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ isCounty: "'yes'" })}`)), /must be a boolean/);
});

test('rejects unsafe links in every rendered inline-Markdown field', () => {
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ introText: "'[bad](javascript:alert(1))'" })}`)), /disallowed inline link/);
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ features: "[{ title: 'A', desc: '[bad](//evil.test)', icon: 'X' }]" })}`)), /disallowed inline link/);
  assert.throws(() => readLocations('fixture.ts', source(`test: ${record({ faqs: "[{ q: 'Q', a: '[bad](data:text/plain,x)' }]" })}`)), /disallowed inline link/);
});
