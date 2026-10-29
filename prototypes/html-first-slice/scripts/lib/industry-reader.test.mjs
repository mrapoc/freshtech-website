import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTE_ALIASES, readIndustries } from './industry-reader.mjs';

const record = (key, overrides = {}) => {
  const fields = {
    slug: `'${key}'`, name: "'Test Sector'", desc: "'Short listing copy.'",
    heroImage: "'https://example.com/hero.jpg'",
    title: "'IT Support for Test Sector'", metaDesc: "'A useful description.'", h1: "'IT Support for Test Sector'",
    intro: "'See **our** [service](/services/managed-it-support).'",
    challenges: "[{ title: 'Slow systems', desc: 'Read our [approach](https://example.com/help).', icon: 'Zap' }]",
    solutions: "[{ title: 'Fast fixes', desc: 'We fix [things](/services/managed-it-support).', icon: 'Cog' }]",
    content: "'Unused long-form source copy.'",
    faqs: "[{ q: 'Can **you** help?', a: 'Yes. [Contact us](/contact).' }]",
    cta: "'Book a call'", minStaff: '10', ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const source = body => `export const industryPages: Record<string, any> = { ${body} };`;

test('reads source order and projects only fields rendered by the V2 templates', () => {
  const industries = readIndustries('fixture.ts', source(`alpha: ${record('alpha')}, beta: ${record('beta', { name: "'Second Sector'" })}`));
  assert.deepEqual(industries.map(industry => industry.slug), ['alpha', 'beta']);
  assert.deepEqual(Object.keys(industries[0]), ['slug', 'name', 'desc', 'title', 'metaDesc', 'h1', 'intro', 'challenges', 'solutions', 'faqs', 'minStaff']);
  assert.deepEqual(industries[0].challenges[0], { title: 'Slow systems', desc: 'Read our [approach](https://example.com/help).' });
  assert.deepEqual(industries[0].solutions[0], { title: 'Fast fixes', desc: 'We fix [things](/services/managed-it-support).' });
  assert.deepEqual(industries[0].faqs[0], { q: 'Can **you** help?', a: 'Yes. [Contact us](/contact).' });
  assert.equal(industries[0].minStaff, 10);
  for (const excluded of ['heroImage', 'content', 'cta', 'icon']) assert.equal(excluded in industries[0], false);
});

test('treats heroImage, content, cta and minStaff as optional and reports absent minStaff as null', () => {
  const [industry] = readIndustries('fixture.ts', source(`alpha: ${record('alpha', { heroImage: undefined, content: undefined, cta: undefined, minStaff: undefined })}`));
  assert.equal(industry.minStaff, null);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { minStaff: "'ten'" })}`)), /positive integer/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { minStaff: '0' })}`)), /positive integer/);
});

test('rejects invalid route keys, alias collisions, slug mismatches and duplicate names', () => {
  assert.throws(() => readIndustries('fixture.ts', source(`'Bad Slug': ${record('Bad Slug')}`)), /safe route segment/);
  for (const alias of Object.keys(ROUTE_ALIASES)) {
    assert.throws(() => readIndustries('fixture.ts', source(`${alias}: ${record(alias)}`)), /collides with a route alias/);
  }
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('other')}`)), /differs from its key/);
  assert.throws(() => readIndustries('fixture.ts', source(`one: ${record('one')}, two: ${record('two')}`)), /Duplicate industry name/);
});

test('rejects non-literal records and spreads', () => {
  assert.throws(() => readIndustries('fixture.ts', `const shared = ${record('alpha')}; export const industryPages = { alpha: shared };`), /Non-literal expression/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: { ...${record('alpha')} }`)), /Only plain property assignments|spread/i);
});

test('rejects missing, unexpected and malformed nested fields', () => {
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { extra: "'no'" })}`)), /unexpected field extra/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: { slug: 'alpha' }`)), /missing field name/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { challenges: "[{ title: 'A', desc: 'B' }]" })}`)), /missing field icon/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { solutions: '[]' })}`)), /at least 1/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: 'Q' }]" })}`)), /missing field a/);
});

test('rejects unsafe links in every rendered inline-Markdown field', () => {
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { intro: "'[bad](javascript:alert(1))'" })}`)), /disallowed inline link/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { challenges: "[{ title: 'A', desc: '[bad](//evil.test)', icon: 'X' }]" })}`)), /disallowed inline link/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { solutions: "[{ title: 'A', desc: '[bad](data:text/plain,x)', icon: 'X' }]" })}`)), /disallowed inline link/);
  assert.throws(() => readIndustries('fixture.ts', source(`alpha: ${record('alpha', { faqs: "[{ q: '[bad](vbscript:x)', a: 'A' }]" })}`)), /disallowed inline link/);
});
