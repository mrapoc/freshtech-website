import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProblemRouteInventory, readProblemRoutes, readProblems } from './problem-reader.mjs';

// Synthetic fixtures only. Field shapes follow pages/ProblemPage.tsx, not any
// real record in data/content.ts.
const record = (key, overrides = {}) => {
  const fields = {
    slug: `'${key}'`,
    title: `'Test Problem ${key}'`, metaDesc: "'A useful description.'", h1: "'Why Is This Test Problem Happening?'",
    intro: "'Plain intro copy.'",
    symptoms: "['Symptom one', 'Symptom two']",
    causes: "[{ title: 'Cause', desc: 'Because.', icon: 'Cpu' }, { title: 'Other', desc: 'Also.', icon: 'Unknown' }]",
    solutions: "[{ title: 'Fix', desc: 'We fix it.', icon: 'Zap' }]",
    content: "'**Heading**\\n\\nBody with a [link](/it-health-check).\\n\\n- one\\n- two'",
    faqs: "[{ q: 'Can you help?', a: 'Yes. [Contact us](/contact).' }]",
    cta: "'Book a Test'", ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const source = body => `export const problemPages: Record<string, any> = { ${body} };`;
const routesSource = routes => `const ProblemPage = lazy(() => import('./x'));\nconst Other = lazy(() => import('./y'));\nexport default function App() { return (<Routes>${routes}<Route path="/other" element={<Other />} /><Route path="/it-support-x" element={<ServiceLocationPage />} /></Routes>); }`;

test('reads records in source order and keeps every rendered field including icons', () => {
  const pages = readProblems('fixture.ts', source(`"slow-things": ${record('slow-things')}, "broken-things": ${record('broken-things')}`));
  assert.deepEqual(pages.map(page => page.slug), ['slow-things', 'broken-things']);
  assert.deepEqual(Object.keys(pages[0]), ['slug', 'title', 'metaDesc', 'h1', 'intro', 'symptoms', 'causes', 'solutions', 'content', 'faqs', 'cta']);
  assert.deepEqual(pages[0].symptoms, ['Symptom one', 'Symptom two']);
  assert.deepEqual(pages[0].causes[1], { title: 'Other', desc: 'Also.', icon: 'Unknown' });
  assert.deepEqual(pages[0].solutions, [{ title: 'Fix', desc: 'We fix it.', icon: 'Zap' }]);
  assert.deepEqual(pages[0].faqs[0], { q: 'Can you help?', a: 'Yes. [Contact us](/contact).' });
  assert.equal(pages[0].content, '**Heading**\n\nBody with a [link](/it-health-check).\n\n- one\n- two');
  assert.equal(pages[0].cta, 'Book a Test');
});

test('rejects invalid keys, key/slug mismatch, duplicate titles and empty maps', () => {
  assert.throws(() => readProblems('fixture.ts', source(`'Bad Slug': ${record('Bad Slug')}`)), /safe route segment/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('beta')}`)), /slug "beta" does not match its key/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { slug: "'../alpha'" })}`)), /does not match its key/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha')}, beta: ${record('beta', { title: "'Test Problem alpha'" })}`)), /Duplicate problem title/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha')}, alpha: ${record('alpha')}`)), /Duplicate object key alpha/);
  assert.throws(() => readProblems('fixture.ts', 'export const problemPages = {};'), /no records/);
});

test('rejects missing, unexpected and malformed fields', () => {
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { extra: "'no'" })}`)), /unexpected field extra/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { cta: undefined })}`)), /missing field cta/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { slug: undefined })}`)), /missing field slug/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { symptoms: '[]' })}`)), /symptoms must be an array with at least 1/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { symptoms: "['ok', 42]" })}`)), /symptoms\[1\] must be a non-empty string/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { causes: "[{ title: 'A', desc: 'B' }]" })}`)), /causes\[0\] is missing field icon/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { solutions: "[{ title: 'A', desc: 'B', icon: 'C', extra: 'D' }]" })}`)), /solutions\[0\] has unexpected field extra/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q' }]" })}`)), /missing field a/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { intro: "''" })}`)), /non-empty string/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: 'not an object'`)), /must be an object literal/);
});

test('rejects non-literal records, spreads and template substitutions', () => {
  assert.throws(() => readProblems('fixture.ts', `const shared = ${record('alpha')}; export const problemPages = { alpha: shared };`), /Non-literal expression/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: { ...${record('alpha')} }`)), /Only plain property assignments|spread/i);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { h1: '`Why ${thing}`' })}`)), /Non-literal expression/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { cta: "'Book'.toUpperCase()" })}`)), /Non-literal expression/);
  assert.throws(() => readProblems('fixture.ts', source(`['__proto__']: ${record('alpha')}`)), /Computed property keys/);
});

test('rejects unsafe links in every RichText field', () => {
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { content: "'[bad](javascript:alert(1))'" })}`)), /content contains a disallowed inline link/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q', a: '[bad](data:text/plain,x)' }]" })}`)), /faqs\[0\]\.a contains a disallowed/);
  assert.throws(() => readProblems('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q', a: '[bad](//evil.test)' }]" })}`)), /faqs\[0\]\.a contains a disallowed/);
  const pages = readProblems('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q', a: 'See [this](https://www.ncsc.gov.uk/) and [that](/pricing).' }]" })}`));
  assert.equal(pages[0].faqs[0].a, 'See [this](https://www.ncsc.gov.uk/) and [that](/pricing).');
});

test('reads ProblemPage routes from App.tsx in source order and only for that component', () => {
  const routes = readProblemRoutes('App.tsx', routesSource('<Route path="/slow-things" element={<ProblemPage />} /><Route path="/broken-things" element={<ProblemPage />} />'));
  assert.deepEqual(routes, ['slow-things', 'broken-things']);
  assert.throws(() => readProblemRoutes('App.tsx', routesSource('<Route path={`/${slug}`} element={<ProblemPage />} />')), /non-literal path/);
  assert.throws(() => readProblemRoutes('App.tsx', routesSource('<Route path="/problems/slow" element={<ProblemPage />} />')), /not a root slug/);
  assert.throws(() => readProblemRoutes('App.tsx', routesSource('<Route path="/a" element={<ProblemPage />} /><Route path="/a" element={<ProblemPage />} />')), /duplicate/);
  assert.throws(() => readProblemRoutes('App.tsx', routesSource('')), /declares no ProblemPage routes/);
});

test('route inventory must equal the record keys exactly', () => {
  const pages = readProblems('fixture.ts', source(`"slow-things": ${record('slow-things')}, "broken-things": ${record('broken-things')}`));
  assert.deepEqual(assertProblemRouteInventory(pages, ['broken-things', 'slow-things']), ['slow-things', 'broken-things']);
  assert.throws(() => assertProblemRouteInventory(pages, ['slow-things']), /Not routed: \[broken-things\]/);
  assert.throws(() => assertProblemRouteInventory(pages, ['slow-things', 'broken-things', 'extra-things']), /Routed without a record: \[extra-things\]/);
});
