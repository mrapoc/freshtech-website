import assert from 'node:assert/strict';
import test from 'node:test';
import { readComparisons } from './comparison-reader.mjs';

// Synthetic fixtures only. Field shapes follow pages/ComparisonPage.tsx, not any
// real record in data/content.ts.
const option = name => `{ name: '${name}', desc: 'About ${name}.', pros: ['Good'], cons: ['Bad'], bestFor: 'Someone', icon: 'Shield' }`;
const record = (key, overrides = {}) => {
  const fields = {
    slug: `'${key}'`, title: `'Test Comparison ${key}'`, metaDesc: "'A useful description.'", h1: "'A Versus B'",
    intro: "'Plain intro copy.'",
    options: `[${option('A')}, ${option('B')}]`,
    comparisonRows: "[{ feature: 'Cost', values: ['Low', 'High'] }, { feature: 'Speed', values: ['Slow', 'Fast'] }]",
    verdict: "'Pick **B** and see [pricing](/pricing).'",
    content: "'## Heading\\n\\nBody.'",
    faqs: "[{ q: 'Which?', a: 'B. [Contact us](/contact).' }]",
    cta: "'Get Advice'", ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const source = body => `export const comparisonPages: Record<string, any> = { ${body} };`;

test('reads records in source order and keeps every rendered field', () => {
  const pages = readComparisons('fixture.ts', source(`"a-vs-b": ${record('a-vs-b')}, "c-vs-d": ${record('c-vs-d')}`));
  assert.deepEqual(pages.map(page => page.slug), ['a-vs-b', 'c-vs-d']);
  assert.deepEqual(Object.keys(pages[0]), ['slug', 'title', 'metaDesc', 'h1', 'intro', 'options', 'comparisonRows', 'verdict', 'content', 'faqs', 'cta']);
  assert.deepEqual(pages[0].options[1], { name: 'B', desc: 'About B.', pros: ['Good'], cons: ['Bad'], bestFor: 'Someone', icon: 'Shield' });
  assert.deepEqual(pages[0].comparisonRows[1], { feature: 'Speed', values: ['Slow', 'Fast'] });
  assert.equal(pages[0].verdict, 'Pick **B** and see [pricing](/pricing).');
  assert.equal(pages[0].content, '## Heading\n\nBody.');
});

test('rejects bad keys, mismatched slugs, duplicate titles and empty maps', () => {
  assert.throws(() => readComparisons('fixture.ts', source(`'Bad Slug': ${record('Bad Slug')}`)), /safe route segment/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('beta')}`)), /does not match its key/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha')}, beta: ${record('beta', { title: "'Test Comparison alpha'" })}`)), /Duplicate comparison title/);
  assert.throws(() => readComparisons('fixture.ts', 'export const comparisonPages = {};'), /no records/);
});

test('rejects malformed options, rows and FAQs', () => {
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { options: `[${option('A')}]` })}`)), /at least two options/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { options: "[{ name: 'A' }, { name: 'B' }]" })}`)), /options\[0\] is missing field desc/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { comparisonRows: "[{ feature: 'Cost', values: ['Low'] }]" })}`)), /1 values for 2 options/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { comparisonRows: "[{ feature: 'Cost', values: ['Low', 'High'], note: 'x' }]" })}`)), /unexpected field note/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q' }]" })}`)), /missing field a/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { verdict: undefined })}`)), /missing field verdict/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { cta: "'Book'.toUpperCase()" })}`)), /Non-literal expression/);
});

test('rejects unsafe links in every RichText field', () => {
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { verdict: "'[bad](javascript:alert(1))'" })}`)), /verdict contains a disallowed/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { content: "'[bad](//evil.test)'" })}`)), /content contains a disallowed/);
  assert.throws(() => readComparisons('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q', a: '[bad](data:text/plain,x)' }]" })}`)), /faqs\[0\]\.a contains a disallowed/);
});
