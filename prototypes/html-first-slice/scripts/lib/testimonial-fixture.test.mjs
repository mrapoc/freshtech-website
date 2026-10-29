import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FIXTURE_CATEGORY_KEYS,
  FIXTURE_LOGO_COUNT,
  FIXTURE_LOGO_PATH_PREFIX,
  FIXTURE_LONG_QUOTE_MIN_LENGTH,
  FIXTURE_MODE,
  FIXTURE_MODULE_BANNER,
  FIXTURE_REVIEW_COUNT,
  SOURCE_MODE,
  TESTIMONIALS_FIXTURE_ATTRIBUTE,
  buildTestimonialData,
  renderTestimonialsModule,
  resolveTestimonialsFixtureMode,
  syntheticTestimonialData,
} from './testimonial-fixture.mjs';
import { ALL_CATEGORY, isSafeLogoSrc, validateCategories, validatePartnerLogos, validateTestimonials } from './testimonial-reader.mjs';

// Synthetic-only tests. Nothing here reads data/content.ts or src/generated.
const synthetic = /synthetic|fixture/i;
const importModuleText = text => import(`data:text/javascript;base64,${Buffer.from(text, 'utf8').toString('base64')}`);

test('mode resolution fails closed on anything other than unset or exactly "1"', () => {
  assert.equal(resolveTestimonialsFixtureMode(undefined), SOURCE_MODE);
  assert.equal(resolveTestimonialsFixtureMode(''), SOURCE_MODE);
  assert.equal(resolveTestimonialsFixtureMode('1'), FIXTURE_MODE);
  for (const value of ['0', 'true', 'TRUE', 'yes', 'on', ' 1', '1 ', '01', 'fixture', 'source', 'false']) {
    assert.throws(() => resolveTestimonialsFixtureMode(value), /TESTIMONIALS_FIXTURE must be unset or exactly "1"/, value);
  }
});

test('synthetic data has 8 reviews over the four categories plus all, and 14 safe local logos', () => {
  const data = syntheticTestimonialData();
  assert.deepEqual(Object.keys(data), ['testimonials', 'testimonialCategories', 'partnerLogos', 'testimonialsFixture']);
  assert.equal(data.testimonialsFixture, true);
  assert.equal(FIXTURE_REVIEW_COUNT, 8);
  assert.equal(FIXTURE_LOGO_COUNT, 14);
  assert.equal(data.testimonials.length, 8);
  assert.equal(data.partnerLogos.length, 14);
  assert.deepEqual(Object.keys(data.testimonialCategories), [ALL_CATEGORY, 'speed', 'reliability', 'proactive', 'value']);
  assert.deepEqual([...FIXTURE_CATEGORY_KEYS], ['speed', 'reliability', 'proactive', 'value']);
  for (const key of FIXTURE_CATEGORY_KEYS) {
    assert.equal(data.testimonials.filter(item => item.category === key).length, 2, key);
  }
  for (const item of data.testimonials) {
    assert.deepEqual(Object.keys(item), ['quote', 'name', 'company', 'category']);
    assert.match(item.quote, synthetic);
    assert.match(item.name, synthetic);
    assert.match(item.company, synthetic);
    assert.doesNotMatch(item.quote, /—/);
  }
  // The first quote is a long synthetic wall of text so layouts are exercised.
  assert.equal(FIXTURE_LONG_QUOTE_MIN_LENGTH, 260);
  assert.ok(data.testimonials[0].quote.length >= FIXTURE_LONG_QUOTE_MIN_LENGTH, `first quote is ${data.testimonials[0].quote.length} chars`);
  assert.match(data.testimonials[0].quote, /^Synthetic fixture review 1 of 8:/);
  for (const label of Object.values(data.testimonialCategories)) assert.match(label, synthetic);
  for (const logo of data.partnerLogos) {
    assert.deepEqual(Object.keys(logo), ['src', 'alt']);
    assert.ok(logo.src.startsWith(FIXTURE_LOGO_PATH_PREFIX), logo.src);
    assert.equal(isSafeLogoSrc(logo.src), true, logo.src);
    assert.match(logo.alt, synthetic);
  }
  assert.equal(new Set(data.partnerLogos.map(logo => logo.src)).size, 14);
});

test('synthetic data passes the reader validators and is a fresh copy on every call', () => {
  const data = syntheticTestimonialData();
  const categories = validateCategories(data.testimonialCategories);
  assert.equal(validateTestimonials(data.testimonials, categories).length, 8);
  assert.equal(validatePartnerLogos(data.partnerLogos).length, 14);
  const again = syntheticTestimonialData();
  assert.deepEqual(again, data);
  assert.notEqual(again.testimonials, data.testimonials);
  again.testimonials[0].quote = 'mutated';
  assert.notEqual(syntheticTestimonialData().testimonials[0].quote, 'mutated');
});

test('fixture mode never invokes the source reader', async () => {
  let calls = 0;
  const readSource = async () => { calls += 1; throw new Error('source reader must not run in fixture mode'); };
  const data = await buildTestimonialData(FIXTURE_MODE, { readSource });
  assert.equal(calls, 0);
  assert.equal(data.testimonialsFixture, true);
  assert.equal(data.testimonials.length, 8);
  assert.equal(data.partnerLogos.length, 14);
  const withoutReader = await buildTestimonialData(FIXTURE_MODE, {});
  assert.equal(withoutReader.testimonialsFixture, true);
});

test('source mode invokes the injected reader exactly once and marks the result as not a fixture', async () => {
  let calls = 0;
  const projected = {
    testimonials: [{ quote: 'Synthetic source quote.', name: 'Synthetic Person', company: 'Synthetic Co', category: 'alpha' }],
    testimonialCategories: { all: 'All', alpha: 'Alpha' },
    partnerLogos: [{ src: '/synthetic/logo.svg', alt: 'Synthetic logo' }],
    extra: 'dropped',
  };
  const data = await buildTestimonialData(SOURCE_MODE, { readSource: async () => { calls += 1; return projected; } });
  assert.equal(calls, 1);
  assert.deepEqual(data, {
    testimonials: projected.testimonials,
    testimonialCategories: projected.testimonialCategories,
    partnerLogos: projected.partnerLogos,
    testimonialsFixture: false,
  });
  await assert.rejects(buildTestimonialData(SOURCE_MODE, {}), /requires a readSource function/);
  await assert.rejects(buildTestimonialData('other', { readSource: async () => projected }), /Unknown testimonial extraction mode/);
});

test('rendered fixture module exports the flag with a prominent banner and importable counts', async () => {
  const text = renderTestimonialsModule(syntheticTestimonialData());
  assert.ok(text.startsWith(FIXTURE_MODULE_BANNER));
  assert.match(text, /^\/\/ GENERATED SYNTHETIC FIXTURE\./);
  assert.match(text, /never publish/i);
  assert.ok(text.includes(TESTIMONIALS_FIXTURE_ATTRIBUTE));
  assert.ok(text.includes('export const testimonialsFixture = true;'));
  assert.ok(!text.includes('Generated from data/content.ts'));
  const generated = await importModuleText(text);
  assert.equal(generated.testimonialsFixture, true);
  assert.equal(generated.testimonials.length, 8);
  assert.equal(Object.keys(generated.testimonialCategories).length, 5);
  assert.equal(generated.partnerLogos.length, 14);
});

test('rendered source module exports the flag as false without the fixture banner', async () => {
  const data = await buildTestimonialData(SOURCE_MODE, {
    readSource: async () => ({
      testimonials: [{ quote: 'Synthetic source quote.', name: 'Synthetic Person', company: 'Synthetic Co', category: 'alpha' }],
      testimonialCategories: { all: 'All', alpha: 'Alpha' },
      partnerLogos: [{ src: '/synthetic/logo.svg', alt: 'Synthetic logo' }],
    }),
  });
  const text = renderTestimonialsModule(data);
  assert.ok(text.startsWith('// Generated from data/content.ts.'));
  assert.ok(!text.includes('GENERATED SYNTHETIC FIXTURE'));
  assert.ok(text.includes('export const testimonialsFixture = false;'));
  const generated = await importModuleText(text);
  assert.equal(generated.testimonialsFixture, false);
  assert.equal(generated.testimonials.length, 1);
  assert.throws(() => renderTestimonialsModule({ ...data, testimonialsFixture: 'true' }), /must be a boolean/);
  assert.throws(() => renderTestimonialsModule({ ...data, testimonialsFixture: undefined }), /must be a boolean/);
});
