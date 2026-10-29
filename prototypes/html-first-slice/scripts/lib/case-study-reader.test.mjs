import assert from 'node:assert/strict';
import test from 'node:test';

import { isSafeImage, readCaseStudies } from './case-study-reader.mjs';

// Synthetic fixture records only. No production case-study content is used.
const alpha = `{
    id: 'cs-alpha', slug: 'alpha-study', client: 'Alpha Ltd', industry: 'Legal',
    title: 'Alpha title', challenge: 'Alpha challenge', solution: 'Alpha solution',
    result: 'Alpha result', outcome: 'Alpha outcome',
    testimonial: 'Alpha quote', contactName: 'A. Person', image: 'https://example.test/images/alpha.webp',
    techStack: ['Tool One', 'Tool Two'], shortStats: { risk: 'Risk text', strategy: 'Strategy text', victory: 'Victory text' },
  }`;
const beta = `{
    id: 'cs-beta', slug: 'beta-study', client: 'Beta Co', industry: 'Healthcare',
    title: 'Beta title', challenge: 'Beta challenge', solution: 'Beta solution',
    result: 'Beta result', outcome: 'Beta outcome',
  }`;
const wrap = entries => `interface CaseStudy { id: string }\nexport const caseStudies: CaseStudy[] = [${entries.join(',\n')}];\n`;
const read = entries => readCaseStudies('fixture.ts', wrap(entries));

test('accepts a valid literal catalogue with optional fields present or absent', () => {
  const records = read([alpha, beta]);
  assert.equal(records.length, 2);
  assert.deepEqual(records.map(record => record.slug), ['alpha-study', 'beta-study']);
  assert.deepEqual(Object.keys(records[0]), ['id', 'slug', 'client', 'industry', 'title', 'challenge', 'solution', 'result', 'outcome', 'testimonial', 'contactName', 'image', 'techStack', 'shortStats']);
  assert.deepEqual(records[0].shortStats, { risk: 'Risk text', strategy: 'Strategy text', victory: 'Victory text' });
  assert.equal(records[1].testimonial, undefined);
  assert.equal(records[1].techStack, undefined);
});

for (const [name, entry, message] of [
  ['a missing required field', alpha.replace("outcome: 'Alpha outcome',", ''), /missing field outcome/],
  ['an empty required string', alpha.replace("client: 'Alpha Ltd'", "client: '  '"), /client must be a non-empty string/],
  ['an unexpected field', alpha.replace("id: 'cs-alpha',", "id: 'cs-alpha', extra: 'no',"), /unexpected field extra/],
  ['an unsafe slug', alpha.replace("slug: 'alpha-study'", "slug: 'Alpha Study'"), /not a safe route segment/],
  ['a path-like slug', alpha.replace("slug: 'alpha-study'", "slug: '../alpha'"), /not a safe route segment/],
  ['a non-string testimonial', alpha.replace("testimonial: 'Alpha quote'", 'testimonial: 12'), /testimonial must be a non-empty string/],
  ['a non-array techStack', alpha.replace("techStack: ['Tool One', 'Tool Two']", "techStack: 'Tool One'"), /techStack must be an array/],
  ['a repeated techStack entry', alpha.replace("'Tool Two'", "'Tool One'"), /techStack repeats Tool One/],
  ['shortStats missing a stat', alpha.replace("victory: 'Victory text'", ''), /shortStats is missing field victory/],
  ['shortStats with an extra key', alpha.replace("victory: 'Victory text'", "victory: 'Victory text', bonus: 'x'"), /shortStats has unexpected field bonus/],
  ['a javascript: image', alpha.replace('https://example.test/images/alpha.webp', 'javascript:alert(1)'), /image is not a safe/],
  ['a protocol-relative image', alpha.replace('https://example.test/images/alpha.webp', '//example.test/a.webp'), /image is not a safe/],
  ['an http image', alpha.replace('https://example.test/images/alpha.webp', 'http://example.test/a.webp'), /image is not a safe/],
  ['a traversal image path', alpha.replace('https://example.test/images/alpha.webp', '/images/../a.webp'), /image is not a safe/],
  ['a computed value', alpha.replace("title: 'Alpha title'", 'title: makeTitle()'), /Non-literal expression \(CallExpression\)/],
  ['a template substitution', alpha.replace("title: 'Alpha title'", 'title: `Alpha ${name}`'), /Non-literal expression \(TemplateExpression\)/],
  ['an object spread', alpha.replace("id: 'cs-alpha',", "...shared, id: 'cs-alpha',"), /Only plain property assignments/],
  ['an unsafe inline link', alpha.replace("outcome: 'Alpha outcome'", "outcome: '[bad](javascript:alert)'"), /disallowed inline link target/],
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => read([entry, beta]), message);
  });
}

test('rejects duplicate slugs and ids', () => {
  assert.throws(() => read([alpha, beta.replace("slug: 'beta-study'", "slug: 'alpha-study'")]), /Duplicate case study slug alpha-study/);
  assert.throws(() => read([alpha, beta.replace("id: 'cs-beta'", "id: 'cs-alpha'")]), /Duplicate case study id cs-alpha/);
});

test('rejects a non-array or non-const declaration', () => {
  assert.throws(() => readCaseStudies('fixture.ts', 'export const caseStudies = {};'), /caseStudies must be an array/);
  assert.throws(() => readCaseStudies('fixture.ts', 'export let caseStudies = [];'), /must be a const declaration/);
  assert.throws(() => readCaseStudies('fixture.ts', 'export const caseStudies = [] as const;'), /Wrapped expressions are not supported/);
  assert.throws(() => readCaseStudies('fixture.ts', 'export const other = [];'), /must declare caseStudies exactly once/);
});

test('image safety accepts https and site-relative paths only', () => {
  assert.equal(isSafeImage('https://res.example/upload/f_auto,q_auto/image.webp'), true);
  assert.equal(isSafeImage('/images/case-study.webp'), true);
  assert.equal(isSafeImage('https://example.test'), false);
  assert.equal(isSafeImage('/images/a b.webp'), false);
  assert.equal(isSafeImage('/images/a.webp?x=1'), false);
  assert.equal(isSafeImage('data:image/png;base64,AAAA'), false);
});
