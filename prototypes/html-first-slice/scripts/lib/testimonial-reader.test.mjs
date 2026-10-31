import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeLogoSrc, readTestimonialData, validateCategories, validatePartnerLogos, validateTestimonials } from './testimonial-reader.mjs';

// Synthetic fixtures only. Shapes follow components/Testimonials.tsx and
// components/LogoCarousel.tsx, not any real record in data/content.ts.
const categories = "{ all: 'Every Test Review', alpha: 'Alpha Tab', beta: 'Beta Tab' }";
const review = (overrides = {}) => {
  const fields = { quote: "'A synthetic quote.'", name: "'Test Person'", business: "'Test Company'", rating: '5', reviewed: "'2024'", category: "'alpha'", ...overrides };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const logo = (overrides = {}) => {
  const fields = { src: "'https://res.cloudinary.com/demo/image/upload/v1/test-logo.png'", alt: "'Test Logo'", ...overrides };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const source = ({ reviews = `[${review()}, ${review({ category: "'beta'" })}]`, cats = categories, logos = `[${logo()}]` } = {}) =>
  `export const testimonialCategories = ${cats};\nexport const testimonials: Testimonial[] = ${reviews};\nexport const partnerLogos = ${logos};\n`;

test('reads the three literals with exact fields and source order', () => {
  const data = readTestimonialData('fixture.ts', source({
    reviews: `[${review({ quote: "'First.'" })}, ${review({ quote: "'Second.'", category: "'beta'" })}, ${review({ quote: "'Third.'" })}]`,
    logos: `[${logo({ alt: "'One'" })}, ${logo({ src: "'/images/logos/two.svg'", alt: "'Two'" })}]`,
  }));
  assert.deepEqual(Object.keys(data), ['testimonials', 'testimonialCategories', 'partnerLogos']);
  assert.deepEqual(data.testimonialCategories, { all: 'Every Test Review', alpha: 'Alpha Tab', beta: 'Beta Tab' });
  assert.deepEqual(data.testimonials.map(item => item.quote), ['First.', 'Second.', 'Third.']);
  assert.deepEqual(Object.keys(data.testimonials[0]), ['quote', 'name', 'business', 'rating', 'reviewed', 'category']);
  assert.deepEqual(data.testimonials[1], { quote: 'Second.', name: 'Test Person', business: 'Test Company', rating: 5, reviewed: '2024', category: 'beta' });
  assert.deepEqual(data.partnerLogos, [
    { src: 'https://res.cloudinary.com/demo/image/upload/v1/test-logo.png', alt: 'One' },
    { src: '/images/logos/two.svg', alt: 'Two' },
  ]);
});

test('keeps repeated quotes and repeated logos rather than deduplicating', () => {
  const data = readTestimonialData('fixture.ts', source({
    reviews: `[${review()}, ${review()}, ${review({ name: "'Other Person'" })}]`,
    logos: `[${logo()}, ${logo()}]`,
  }));
  assert.equal(data.testimonials.length, 3);
  assert.deepEqual(data.testimonials[0], data.testimonials[1]);
  assert.equal(data.partnerLogos.length, 2);
});

test('fails closed on empty arrays, empty category maps and missing declarations', () => {
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: '[]' })), /testimonials must be an array with at least 1/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: '[]' })), /partnerLogos must be an array with at least 1/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: '{}' })), /testimonialCategories has no entries/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ alpha: 'Alpha' }" })), /must include the "all" tab/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All' }" })), /at least one category besides "all"/);
  assert.throws(() => readTestimonialData('fixture.ts', `export const testimonials = [${review()}];`), /must declare testimonialCategories exactly once/);
  assert.throws(() => readTestimonialData('fixture.ts', `${source()}export const partnerLogos = [];`), /must declare partnerLogos exactly once \(found 2\)/);
  assert.throws(() => readTestimonialData('fixture.ts', source().replace('export const partnerLogos', 'export let partnerLogos')), /must be a const declaration/);
});

test('rejects malformed testimonial fields', () => {
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ category: undefined })}]` })), /testimonials\[0\] is missing field category/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ source: "'x'" })}]` })), /testimonials\[0\] has unexpected field source/);
  assert.equal(readTestimonialData('fixture.ts', source({ reviews: `[${review({ business: undefined })}]` })).testimonials[0].business, undefined);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ business: "''" })}]` })), /testimonials\[0\]\.business must be a non-empty string/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ rating: "'5'" })}]` })), /rating must be a whole number from 1 to 5/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ rating: '6' })}]` })), /rating must be a whole number from 1 to 5/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ reviewed: "'eight years ago'" })}]` })), /reviewed must be a four-digit year/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review()}, ${review({ quote: "''" })}]` })), /testimonials\[1\]\.quote must be a non-empty string/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ name: "'   '" })}]` })), /testimonials\[0\]\.name must be a non-empty string/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ business: '42' })}]` })), /testimonials\[0\]\.business must be a non-empty string/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: "['just a string']" })), /testimonials\[0\] must be an object literal/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `{ first: ${review()} }` })), /testimonials must be an array/);
});

test('rejects categories that are not named, or that are the all tab', () => {
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ category: "'gamma'" })}]` })), /category "gamma" is not a named testimonial category/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ category: "'all'" })}]` })), /category may not be "all"/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All', 'Bad Key': 'Bad' }" })), /"Bad Key" is not a safe category key/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All', alpha: '' }" })), /testimonialCategories\.alpha must be a non-empty string/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All', alpha: 3 }" })), /testimonialCategories\.alpha must be a non-empty string/);
  assert.throws(() => validateCategories(['all']), /must be an object literal/);
  assert.throws(() => validateTestimonials([{ quote: 'q', name: 'n', rating: 5, reviewed: '2024', category: 'alpha' }], { all: 'All' }), /not a named testimonial category/);
});

test('rejects malformed and unsafe logo entries', () => {
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ alt: undefined })}]` })), /partnerLogos\[0\] is missing field alt/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ width: '130' })}]` })), /partnerLogos\[0\] has unexpected field width/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ alt: "''" })}]` })), /partnerLogos\[0\]\.alt must be a non-empty string/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo()}, ${logo({ src: "'http://example.test/logo.png'" })}]` })), /partnerLogos\[1\]\.src is not a safe https URL/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ src: "'javascript:alert(1)'" })}]` })), /not a safe https URL/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ src: "'//cdn.example.test/logo.png'" })}]` })), /not a safe https URL/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ src: "'/images/../secret.png'" })}]` })), /not a safe https URL/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ src: "'images/relative.png'" })}]` })), /not a safe https URL/);
  assert.throws(() => validatePartnerLogos([{ src: 'https://example.test/a b.png', alt: 'x' }]), /not a safe https URL/);
});

test('isSafeLogoSrc accepts only https URLs and clean site-local paths', () => {
  assert.equal(isSafeLogoSrc('https://res.cloudinary.com/demo/image/upload/v1/logo.png'), true);
  assert.equal(isSafeLogoSrc('https://example.test/logo.svg?v=2'), true);
  assert.equal(isSafeLogoSrc('/images/logos/logo.webp'), true);
  assert.equal(isSafeLogoSrc('/logo.png'), true);
  assert.equal(isSafeLogoSrc('http://example.test/logo.png'), false);
  assert.equal(isSafeLogoSrc('https://user:pass@example.test/logo.png'), false);
  assert.equal(isSafeLogoSrc('data:image/png;base64,AAAA'), false);
  assert.equal(isSafeLogoSrc('//example.test/logo.png'), false);
  assert.equal(isSafeLogoSrc('/images/logo.png?x=1'), false);
  assert.equal(isSafeLogoSrc('/images/./logo.png'), false);
  assert.equal(isSafeLogoSrc('/images/<script>.png'), false);
  assert.equal(isSafeLogoSrc('https://example.test/logo"onerror=x.png'), false);
  assert.equal(isSafeLogoSrc(''), false);
  assert.equal(isSafeLogoSrc(42), false);
});

test('rejects non-literal records, spreads, computed and unsafe keys', () => {
  assert.throws(() => readTestimonialData('fixture.ts', `const shared = ${review()};\n${source({ reviews: '[shared]' })}`), /Non-literal expression/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[{ ...${review()} }]` })), /Only plain property assignments|spread/i);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review()}, ...more]` })), /Array spread/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review({ quote: '`Hello ${name}`' })}]` })), /Non-literal expression/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ logos: `[${logo({ src: "cloudinary('logo')" })}]` })), /Non-literal expression/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All', ['al' + 'pha']: 'Alpha' }" })), /Computed property keys/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All', __proto__: 'Bad' }" })), /Unsafe object key __proto__/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ cats: "{ all: 'All', alpha: 'A', alpha: 'B' }" })), /Duplicate object key alpha/);
  assert.throws(() => readTestimonialData('fixture.ts', source({ reviews: `[${review()}] as const` })), /Wrapped expressions/);
});
