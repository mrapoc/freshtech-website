import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRouteInventory, readServiceLocationRoutes, readServiceLocations } from './service-location-reader.mjs';

// Synthetic fixtures only. Field shapes follow ServiceLocationPageV2, not any
// real record in data/content.ts.
const record = (overrides = {}) => {
  const fields = {
    service: "'Test Service'", location: "'Testshire'", isCounty: 'true',
    title: "'Test Service Testshire'", metaDesc: "'A useful description.'", h1: "'Test Service for Testshire Businesses'",
    intro: "'Plain intro copy.'",
    content: "'**Heading**\\n\\nBody with a [link](/services/managed-it-support).\\n\\n- one\\n- two'",
    benefits: "[{ title: 'Local', desc: 'We are here.', icon: 'MapPin' }, { title: 'Fast', desc: 'Quick.', icon: 'Unknown' }]",
    localContext: "'Local context sentence.'",
    faqs: "[{ q: 'Can **you** help?', a: 'Yes. [Contact us](/contact).' }]",
    relatedService: "'managed-it-support'", relatedLocation: "'testshire'", ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const source = body => `export const serviceLocationPages: Record<string, any> = { ${body} };`;
const routesSource = routes => `const ServiceLocationPage = lazy(() => import('./x'));\nconst Other = lazy(() => import('./y'));\nexport default function App() { return (<Routes>${routes}<Route path="/other" element={<Other />} /></Routes>); }`;

test('reads records in source order and keeps every rendered field including benefit icons', () => {
  const pages = readServiceLocations('fixture.ts', source(`"it-support-testshire": ${record()}, "it-support-testtown": ${record({ isCounty: 'false', title: "'Other Title'" })}`));
  assert.deepEqual(pages.map(page => page.slug), ['it-support-testshire', 'it-support-testtown']);
  assert.deepEqual(Object.keys(pages[0]), ['slug', 'service', 'location', 'isCounty', 'title', 'metaDesc', 'h1', 'intro', 'content', 'benefits', 'localContext', 'faqs', 'relatedService', 'relatedLocation']);
  assert.equal(pages[0].isCounty, true);
  assert.equal(pages[1].isCounty, false);
  assert.deepEqual(pages[0].benefits[1], { title: 'Fast', desc: 'Quick.', icon: 'Unknown' });
  assert.deepEqual(pages[0].faqs[0], { q: 'Can **you** help?', a: 'Yes. [Contact us](/contact).' });
});

test('rejects invalid keys, non-boolean isCounty, unsafe related slugs and duplicate titles', () => {
  assert.throws(() => readServiceLocations('fixture.ts', source(`'Bad Slug': ${record()}`)), /safe route segment/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ isCounty: "'yes'" })}`)), /boolean literal/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ relatedService: "'../admin'" })}`)), /relatedService .* safe route segment/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record()}, beta: ${record()}`)), /Duplicate service-location title/);
  assert.throws(() => readServiceLocations('fixture.ts', 'export const serviceLocationPages = {};'), /no records/);
});

test('rejects missing, unexpected and malformed fields', () => {
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ extra: "'no'" })}`)), /unexpected field extra/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ localContext: undefined })}`)), /missing field localContext/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ benefits: "[{ title: 'A', desc: 'B' }]" })}`)), /missing field icon/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ benefits: '[]' })}`)), /at least 1/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ faqs: "[{ q: 'Q' }]" })}`)), /missing field a/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ intro: "''" })}`)), /non-empty string/);
});

test('rejects non-literal records, spreads and template substitutions', () => {
  assert.throws(() => readServiceLocations('fixture.ts', `const shared = ${record()}; export const serviceLocationPages = { alpha: shared };`), /Non-literal expression/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: { ...${record()} }`)), /Only plain property assignments|spread/i);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ h1: '`IT for ${place}`' })}`)), /Non-literal expression/);
});

test('rejects unsafe links in every rich-text field', () => {
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ content: "'[bad](javascript:alert(1))'" })}`)), /content contains a disallowed inline link/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ faqs: "[{ q: '[bad](//evil.test)', a: 'A' }]" })}`)), /faqs\[0\]\.q contains a disallowed/);
  assert.throws(() => readServiceLocations('fixture.ts', source(`alpha: ${record({ faqs: "[{ q: 'Q', a: '[bad](data:text/plain,x)' }]" })}`)), /faqs\[0\]\.a contains a disallowed/);
});

test('reads ServiceLocationPage routes from App.tsx in source order and only for that component', () => {
  const routes = readServiceLocationRoutes('App.tsx', routesSource('<Route path="/it-support-testshire" element={<ServiceLocationPage />} /><Route path="/it-support-testtown" element={<ServiceLocationPage />} />'));
  assert.deepEqual(routes, ['it-support-testshire', 'it-support-testtown']);
  assert.throws(() => readServiceLocationRoutes('App.tsx', routesSource('<Route path={`/${slug}`} element={<ServiceLocationPage />} />')), /non-literal path/);
  assert.throws(() => readServiceLocationRoutes('App.tsx', routesSource('<Route path="/nested/it-support" element={<ServiceLocationPage />} />')), /not a root slug/);
  assert.throws(() => readServiceLocationRoutes('App.tsx', routesSource('<Route path="/a" element={<ServiceLocationPage />} /><Route path="/a" element={<ServiceLocationPage />} />')), /duplicate/);
  assert.throws(() => readServiceLocationRoutes('App.tsx', routesSource('')), /declares no ServiceLocationPage routes/);
});

test('route inventory must equal the record keys exactly', () => {
  const pages = readServiceLocations('fixture.ts', source(`"it-support-testshire": ${record()}, "it-support-testtown": ${record({ title: "'Other'" })}`));
  assert.deepEqual(assertRouteInventory(pages, ['it-support-testtown', 'it-support-testshire']), ['it-support-testshire', 'it-support-testtown']);
  assert.throws(() => assertRouteInventory(pages, ['it-support-testshire']), /Not routed: \[it-support-testtown\]/);
  assert.throws(() => assertRouteInventory(pages, ['it-support-testshire', 'it-support-testtown', 'it-support-extra']), /Routed without a record: \[it-support-extra\]/);
});
