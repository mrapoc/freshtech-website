import assert from 'node:assert/strict';
import test from 'node:test';
import { GOOGLE_REVIEWS_URL, categoryIcon, categoryTabs, filterTestimonials, logoImage, logoImages, optimizeCloudinaryUrl, reviewCaption, reviewCaptionPrefix, testimonialCount } from './testimonial-display.mjs';

// Synthetic records only.
const categories = { all: 'Every Test Review', alpha: 'Alpha Tab', beta: 'Beta Tab', gamma: 'Gamma Tab' };
const review = (quote, category, name = 'Test Person') => ({ quote, name, business: 'Test Company', rating: 5, reviewed: '2024', category });
const testimonials = [
  review('First.', 'alpha'),
  review('Second.', 'beta'),
  review('Third.', 'alpha', 'Other Person'),
  review('First.', 'alpha'),
  review('Fifth.', 'beta'),
];
const cloudinary = 'https://res.cloudinary.com/demo/image/upload/v1/logos/test-logo.png';

test('filtering mirrors the filteredTestimonials memo and preserves order', () => {
  const all = filterTestimonials(testimonials, 'all', categories);
  assert.deepEqual(all.map(item => item.quote), ['First.', 'Second.', 'Third.', 'First.', 'Fifth.']);
  assert.notEqual(all, testimonials);
  assert.deepEqual(filterTestimonials(testimonials).map(item => item.quote), ['First.', 'Second.', 'Third.', 'First.', 'Fifth.']);
  assert.deepEqual(filterTestimonials(testimonials, 'alpha', categories).map(item => item.quote), ['First.', 'Third.', 'First.']);
  assert.deepEqual(filterTestimonials(testimonials, 'beta', categories).map(item => item.quote), ['Second.', 'Fifth.']);
  assert.deepEqual(filterTestimonials(testimonials, 'gamma', categories), []);
  assert.deepEqual(filterTestimonials([], 'all', categories), []);
});

test('captions name the stated business, if any, then the Google source', () => {
  assert.equal(reviewCaption({ business: 'Test Company' }), 'Test Company · Google review');
  assert.equal(reviewCaptionPrefix({ business: 'Test Company' }), 'Test Company · ');
  assert.equal(reviewCaption({}), 'Google review');
  assert.equal(reviewCaptionPrefix({}), '');
  assert.match(GOOGLE_REVIEWS_URL, /^https:\/\/search\.google\.com\/local\/reviews\?placeid=/);
});

test('unknown or malformed categories throw when the map is supplied', () => {
  assert.throws(() => filterTestimonials(testimonials, 'delta', categories), /Unknown testimonial category "delta"/);
  assert.throws(() => filterTestimonials(testimonials, '', categories), /non-empty string/);
  // undefined takes the "all" default argument; only a present non-string is malformed.
  assert.deepEqual(filterTestimonials(testimonials, undefined, categories).map(item => item.quote), ['First.', 'Second.', 'Third.', 'First.', 'Fifth.']);
  assert.throws(() => filterTestimonials(testimonials, null, categories), /non-empty string/);
  assert.throws(() => filterTestimonials(testimonials, 'constructor', categories), /Unknown testimonial category/);
  assert.deepEqual(filterTestimonials(testimonials, 'delta'), []);
});

test('counts and tabs follow the category key order with the all total first', () => {
  assert.equal(testimonialCount(testimonials, 'all', categories), 5);
  assert.equal(testimonialCount(testimonials, 'alpha', categories), 3);
  assert.equal(testimonialCount(testimonials, 'gamma', categories), 0);
  assert.deepEqual(categoryTabs(testimonials, categories), [
    { key: 'all', label: 'Every Test Review', icon: 'star', count: 5, active: true },
    { key: 'alpha', label: 'Alpha Tab', icon: 'star', count: 3, active: false },
    { key: 'beta', label: 'Beta Tab', icon: 'star', count: 2, active: false },
    { key: 'gamma', label: 'Gamma Tab', icon: 'star', count: 0, active: false },
  ]);
  assert.deepEqual(categoryTabs(testimonials, { all: 'All', speed: 'Speed', reliability: 'R', proactive: 'P', value: 'V' }).map(tab => tab.icon), ['star', 'clock', 'shield', 'zap', 'trending-up']);
  assert.equal(categoryIcon('unknown'), 'star');
});

test('optimizeCloudinaryUrl matches the SmartImage formula exactly', () => {
  assert.equal(optimizeCloudinaryUrl(cloudinary, 130, 'eco'), 'https://res.cloudinary.com/demo/image/upload/w_130,f_auto,q_auto:eco/v1/logos/test-logo.png');
  assert.equal(optimizeCloudinaryUrl(cloudinary, 260, 'eco'), 'https://res.cloudinary.com/demo/image/upload/w_260,f_auto,q_auto:eco/v1/logos/test-logo.png');
  assert.equal(optimizeCloudinaryUrl(cloudinary), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/v1/logos/test-logo.png');
  assert.equal(optimizeCloudinaryUrl(cloudinary, 400, '25'), 'https://res.cloudinary.com/demo/image/upload/w_400,f_auto,q_25/v1/logos/test-logo.png');
  assert.equal(optimizeCloudinaryUrl(optimizeCloudinaryUrl(cloudinary, 130, 'eco'), 130, 'eco'), optimizeCloudinaryUrl(cloudinary, 130, 'eco'));
  assert.equal(optimizeCloudinaryUrl('https://example.test/logo.png', 130, 'eco'), 'https://example.test/logo.png');
  assert.equal(optimizeCloudinaryUrl('/images/logos/local.svg', 130, 'eco'), '/images/logos/local.svg');
  assert.equal(optimizeCloudinaryUrl('https://res.cloudinary.com/demo/image/fetch/x.png', 130, 'eco'), 'https://res.cloudinary.com/demo/image/fetch/x.png');
  assert.equal(optimizeCloudinaryUrl(''), '');
  assert.equal(optimizeCloudinaryUrl(undefined), '');
});

test('logo images mirror LogoItem with 1x/2x srcset and fixed box', () => {
  const image = logoImage({ src: cloudinary, alt: 'Test Logo' });
  assert.deepEqual(image, {
    src: 'https://res.cloudinary.com/demo/image/upload/w_130,f_auto,q_auto:eco/v1/logos/test-logo.png',
    srcSet: 'https://res.cloudinary.com/demo/image/upload/w_130,f_auto,q_auto:eco/v1/logos/test-logo.png 1x, https://res.cloudinary.com/demo/image/upload/w_260,f_auto,q_auto:eco/v1/logos/test-logo.png 2x',
    alt: 'Test Logo',
    width: 130,
    height: 40,
    loading: 'lazy',
    decoding: 'async',
  });
  const local = logoImage({ src: '/images/logos/local.svg', alt: 'Local' });
  assert.equal(local.src, '/images/logos/local.svg');
  assert.equal(local.srcSet, '/images/logos/local.svg 1x, /images/logos/local.svg 2x');
  assert.deepEqual(logoImages([{ src: cloudinary, alt: 'A' }, { src: cloudinary, alt: 'B' }]).map(item => item.alt), ['A', 'B']);
  assert.throws(() => logoImage({ alt: 'No src' }), /requires src and alt/);
  assert.throws(() => logoImage({ src: '', alt: 'Empty' }), /requires src and alt/);
  assert.throws(() => logoImage({ src: cloudinary }), /requires src and alt/);
});

test('helpers return data only and never build markup', () => {
  const hostile = review('<b>"quoted"</b> & more', 'alpha', '<script>alert(1)</script>');
  const [item] = filterTestimonials([hostile], 'alpha', categories);
  assert.equal(item.quote, '<b>"quoted"</b> & more');
  assert.equal(item.name, '<script>alert(1)</script>');
  const image = logoImage({ src: cloudinary, alt: '"><img src=x onerror=alert(1)>' });
  assert.equal(image.alt, '"><img src=x onerror=alert(1)>');
  assert.equal(categoryTabs([hostile], { all: 'All <em>x</em>', alpha: 'A' })[0].label, 'All <em>x</em>');
});
