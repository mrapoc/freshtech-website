import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'ultrahtml';
import { GOOGLE_REVIEWS_URL } from '../src/lib/testimonial-display.mjs';
import { checkBodyFamilyMarker, checkRichBlock, checkSourceContact, checkTestimonials, expectedLogoImage, parseCheckerArgs, richTextExpectation } from './problem-output-check.mjs';

// Synthetic RichText blocks, testimonials, logos and contact markup only:
// nothing below is a record from data/content.ts, and importing the checker
// never reads the source projection, the retained fixture or a dist directory
// (main() is guarded).

const ROUTE = '/synthetic-route';
const block = html => parse(`<div class="pb-rich">${html}</div>`);
const passes = (source, html) => assert.doesNotThrow(() => checkRichBlock(ROUTE, 'synthetic', block(html), source));
const fails = (source, html, pattern) => assert.throws(() => checkRichBlock(ROUTE, 'synthetic', block(html), source), pattern);

const MIXED_SOURCE = 'Intro with [a link](/contact) and **bold** text.\nSecond line.\n\n- First item\n- Second *item*\n\n1. Step one\n2. Step two';
const MIXED_HTML = '<p>Intro with <a href="/contact">a link</a> and <strong>bold</strong> text.<br>Second line.</p><ul><li>First item</li><li>Second <em>item</em></li></ul><ol><li>Step one</li><li>Step two</li></ol>';

test('richTextExpectation restates the RichText block rules with ordered pieces and links', () => {
  const expected = richTextExpectation(MIXED_SOURCE);
  assert.equal(expected.p, 1);
  assert.equal(expected.br, 1);
  assert.equal(expected.ul, 1);
  assert.equal(expected.ol, 1);
  assert.equal(expected.li, 4);
  assert.deepEqual(expected.pieces, ['Intro with a link and bold text.', 'Second line.', 'First item', 'Second item', 'Step one', 'Step two']);
  assert.deepEqual(expected.links, [{ label: 'a link', href: '/contact', external: false }]);
});

test('a faithful rendering of paragraphs, breaks, lists, emphasis and links passes', () => {
  passes(MIXED_SOURCE, MIXED_HTML);
  passes('Plain sentence.', '<p>Plain sentence.</p>');
  passes('Visit [the site](https://example.test/page) now.', '<p>Visit <a href="https://example.test/page" target="_blank" rel="noopener noreferrer">the site</a> now.</p>');
});

test('added wording fails even though every source piece is still present', () => {
  fails(MIXED_SOURCE, MIXED_HTML.replace('text.<br>', 'text. Extra words here.<br>'), /rendered text differs from the ordered source text/);
  fails('Plain sentence.', '<p>Plain sentence. And more.</p>', /rendered text differs/);
  fails('Plain sentence.', '<p>Prefix. Plain sentence.</p>', /rendered text differs/);
});

test('reordered pieces fail even though every source piece is still present', () => {
  fails(MIXED_SOURCE, MIXED_HTML.replace('<li>First item</li><li>Second <em>item</em></li>', '<li>Second <em>item</em></li><li>First item</li>'), /rendered text differs/);
  fails('One.\n\nTwo.', '<p>Two.</p><p>One.</p>', /rendered text differs/);
});

test('the same href with different labels is legal and is compared by position', () => {
  const source = 'See [pricing details](/pricing) or [our plans](/pricing).';
  passes(source, '<p>See <a href="/pricing">pricing details</a> or <a href="/pricing">our plans</a>.</p>');
  fails(source, '<p>See <a href="/pricing">our plans</a> or <a href="/pricing">pricing details</a>.</p>', /(rendered text differs|link 0 label differs)/);
});

test('reordered links with identical labels fail on the link target, not the text', () => {
  const source = '[Read more](/alpha) or [Read more](/beta).';
  passes(source, '<p><a href="/alpha">Read more</a> or <a href="/beta">Read more</a>.</p>');
  fails(source, '<p><a href="/beta">Read more</a> or <a href="/alpha">Read more</a>.</p>', /link 0 target differs from the source/);
});

test('link count, external attributes and unsafe schemes are still enforced', () => {
  fails('No links here.', '<p>No <a href="/contact">links</a> here.</p>', /link count differs/);
  fails('Visit [the site](https://example.test) now.', '<p>Visit <a href="https://example.test">the site</a> now.</p>', /external link 0 lacks/);
  fails('Visit [contact](/contact) now.', '<p>Visit <a href="/contact" target="_blank">contact</a> now.</p>', /internal link 0 opened in a new tab/);
  fails('Visit [contact](javascript:void) now.', '<p>Visit <a href="javascript:void">contact</a> now.</p>', /unsafe link scheme/);
});

test('bold wrapped around a link follows the React precedence: an empty strong, a plain link, then a literal "**" tail', () => {
  const source = '1. Step one\n2. **[Synthetic label](/fixture)** - Example';
  const expected = richTextExpectation(source);
  assert.deepEqual(expected.pieces, ['Step one', 'Synthetic label** - Example']);
  assert.deepEqual(expected.links, [{ label: 'Synthetic label', href: '/fixture', external: false }]);
  passes(source, '<ol><li>Step one</li><li><strong></strong><a href="/fixture">Synthetic label</a>** - Example</li></ol>');
  // A "cleaner" rendering that honours the bold and hides the markers is not the source rendering.
  fails(source, '<ol><li>Step one</li><li><strong><a href="/fixture">Synthetic label</a></strong> - Example</li></ol>', /rendered text differs from the ordered source text/);
  fails(source, '<ol><li>Step one</li><li><strong></strong><a href="/fixture">Synthetic label</a>** - Example (added)</li></ol>', /rendered text differs from the ordered source text/);
  const paragraph = 'Before **[label](/fixture)** after.';
  // Links are split out first, so the surrounding "**" halves are separate segments with a lone marker each and render literally.
  assert.deepEqual(richTextExpectation(paragraph).pieces, ['Before **label** after.']);
  passes(paragraph, '<p>Before **<a href="/fixture">label</a>** after.</p>');
});

test('markdown markers inside a link label stay literal because labels are plain text', () => {
  const source = 'See [**bold** and *em* label](/fixture) here.';
  const expected = richTextExpectation(source);
  assert.deepEqual(expected.pieces, ['See **bold** and *em* label here.']);
  assert.deepEqual(expected.links, [{ label: '**bold** and *em* label', href: '/fixture', external: false }]);
  passes(source, '<p>See <a href="/fixture">**bold** and *em* label</a> here.</p>');
  fails(source, '<p>See <a href="/fixture"><strong>bold</strong> and <em>em</em> label</a> here.</p>', /(rendered text differs|link 0 label differs)/);
  fails(source, '<p>See <a href="/fixture">**bold** and *em* label</a> here. More.</p>', /rendered text differs from the ordered source text/);
});

test('stray markers the source renders literally are expected literally, and a lone "**" segment renders empty', () => {
  assert.deepEqual(richTextExpectation('Price ** today').pieces, ['Price ** today']);
  assert.deepEqual(richTextExpectation('Only **').pieces, ['Only **']);
  assert.deepEqual(richTextExpectation('*not closed').pieces, ['*not closed']);
  assert.deepEqual(richTextExpectation('and **half').pieces, ['and **half']);
  // An unclosed em followed by a later star still pairs up, as the React split does.
  assert.deepEqual(richTextExpectation('*not closed and **half').pieces, ['not closed and *half']);
  assert.deepEqual(richTextExpectation('**').pieces, ['']);
  assert.deepEqual(richTextExpectation('a * b * c').pieces, ['a  b  c']);
  passes('Price ** today', '<p>Price ** today</p>');
  fails('Price ** today', '<p>Price today</p>', /rendered text differs/);
  passes('**', '<p><strong></strong></p>');
  passes('Real **bold** and *em* still collapse.', '<p>Real <strong>bold</strong> and <em>em</em> still collapse.</p>');
  fails('Real **bold** and *em* still collapse.', '<p>Real **bold** and *em* still collapse.</p>', /rendered text differs/);
});

test('fixture mode comes from the flag or TESTIMONIALS_FIXTURE=1, and an invalid value fails even with the flag', () => {
  assert.deepEqual(parseCheckerArgs([], undefined), { distDir: 'dist', fixtureMode: false });
  assert.deepEqual(parseCheckerArgs(['out'], ''), { distDir: 'out', fixtureMode: false });
  assert.deepEqual(parseCheckerArgs(['--testimonials-fixture'], undefined), { distDir: 'dist', fixtureMode: true });
  assert.deepEqual(parseCheckerArgs(['out', '--testimonials-fixture'], '1'), { distDir: 'out', fixtureMode: true });
  assert.deepEqual(parseCheckerArgs([], '1'), { distDir: 'dist', fixtureMode: true });
  assert.throws(() => parseCheckerArgs([], '0'), /must be unset or exactly "1"/);
  assert.throws(() => parseCheckerArgs([], 'yes'), /must be unset or exactly "1"/);
  assert.throws(() => parseCheckerArgs(['--testimonials-fixture'], 'true'), /must be unset or exactly "1"/);
  assert.throws(() => parseCheckerArgs(['--testimonials-fixture'], '0'), /must be unset or exactly "1"/);
  assert.throws(() => parseCheckerArgs(['--fixture'], undefined), /Unknown option --fixture/);
  assert.throws(() => parseCheckerArgs(['a', 'b'], undefined), /At most one dist directory/);
});

// --- Shared testimonials block: exact comparison on either projection -------------------
// Fails with the pattern and, because record content must never reach a log,
// with none of the given strings anywhere in the message.
const failsPrivately = (fn, pattern, secrets) => {
  let error;
  // assert.throws itself fails when fn does not throw; the validator runs the
  // anchored pattern against error.message, not the "Error: ..." string form.
  assert.throws(fn, caught => {
    assert.ok(caught instanceof Error, 'expected the checker to fail with an Error');
    assert.match(caught.message, pattern);
    for (const secret of secrets) assert.ok(!caught.message.includes(secret), `failure message leaked ${JSON.stringify(secret)}`);
    error = caught;
    return true;
  }, 'expected the checker to fail');
  return error;
};
const esc = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const CLOUDINARY_LOGO = 'https://res.cloudinary.com/synthetic-cloud/image/upload/v1/synthetic/logo-two.png';
const CLOUDINARY_1X = 'https://res.cloudinary.com/synthetic-cloud/image/upload/w_130,f_auto,q_auto:eco/v1/synthetic/logo-two.png';
const CLOUDINARY_2X = 'https://res.cloudinary.com/synthetic-cloud/image/upload/w_260,f_auto,q_auto:eco/v1/synthetic/logo-two.png';
// Index 2 deliberately repeats index 0: repetition is inherited copy the
// renderer must preserve. Indexes 0, 2 and 3 share one category.
const syntheticReviews = () => ({
  testimonialCategories: { all: 'All synthetic reviews', speed: 'Synthetic speed label', value: 'Synthetic value label' },
  testimonials: [
    { quote: 'Synthetic quote alpha.', name: 'Synthetic Person Alpha', business: 'Synthetic Company Alpha', rating: 5, reviewed: '2024', category: 'speed' },
    { quote: 'Synthetic quote beta.', name: 'Synthetic Person Beta', rating: 5, reviewed: '2024', category: 'value' },
    { quote: 'Synthetic quote alpha.', name: 'Synthetic Person Alpha', business: 'Synthetic Company Alpha', rating: 5, reviewed: '2024', category: 'speed' },
    { quote: 'Synthetic quote delta.', name: 'Synthetic Person Delta', business: 'Synthetic Company Delta', rating: 5, reviewed: '2024', category: 'speed' },
  ],
  partnerLogos: [
    { src: '/synthetic/logos/logo-one.svg', alt: 'Synthetic logo one' },
    { src: CLOUDINARY_LOGO, alt: 'Synthetic logo two' },
  ],
});
const figureHtml = (item, index) => `<figure class="source-testimonials-item" data-testimonials-item data-index="${index}" data-category="${item.category}"><blockquote><p class="source-testimonials-quote">"${esc(item.quote)}"</p></blockquote><figcaption><span class="source-testimonials-name">${esc(item.name)}</span><span class="source-testimonials-company">${item.business ? `${esc(item.business)} · ` : ''}<a href="${esc(GOOGLE_REVIEWS_URL)}">Google review</a></span></figcaption></figure>`;
// A faithful rendering of the block. `data` is what gets rendered; the
// checker is then handed a possibly different expectation.
const renderTestimonials =(data, { fixtureAttribute = false, logoImage = expectedLogoImage } = {}) => {
  const { testimonials, testimonialCategories, partnerLogos } = data;
  const tabs = Object.entries(testimonialCategories).map(([key, label]) => {
    const count = key === 'all' ? testimonials.length : testimonials.filter(item => item.category === key).length;
    return `<button type="button" class="source-testimonials-filter" data-testimonials-filter="${key}" aria-pressed="${key === 'all' ? 'true' : 'false'}"><svg aria-hidden="true"></svg><span>${esc(label)}</span><span class="source-testimonials-count">${count}</span></button>`;
  }).join('');
  const items = testimonials.map(figureHtml).join('');
  const dots = testimonials.map((item, index) => `<button type="button" class="source-testimonials-dot" data-index="${index}" aria-label="Go to testimonial ${index + 1} of ${testimonials.length}"></button>`).join('');
  const logos = partnerLogos.map(logo => { const image = logoImage(logo); return `<li class="source-testimonials-logo"><img src="${esc(image.src)}" srcset="${esc(image.srcset)}" alt="${esc(image.alt)}" width="130" height="40" loading="lazy" decoding="async" data-testimonials-logo></li>`; }).join('');
  return `<section class="source-testimonials" data-testimonials aria-labelledby="source-testimonials-heading"${fixtureAttribute ? ' data-testimonials-fixture="true"' : ''}>` +
    '<h2 id="source-testimonials-heading">Trusted By Local Heroes</h2><p class="source-testimonials-lead">Don\'t just take our word for it.</p>' +
    `<div class="source-testimonials-filters" hidden role="group">${tabs}</div>` +
    '<div class="source-testimonials-stars" aria-hidden="true"><svg></svg><svg></svg><svg></svg><svg></svg><svg></svg></div>' +
    `<div data-testimonials-stack role="region" aria-live="off" aria-atomic="true">${items}</div>` +
    '<p data-testimonials-empty hidden>No reviews in this category yet.</p>' +
    `<div data-testimonials-controls hidden>${dots}<button type="button" data-testimonials-pause>Pause rotation</button></div>` +
    `<p class="source-testimonials-logos-title">Powering Businesses Like</p><ul data-testimonials-logos>${logos}</ul></section>`;
};
const mainDocument = html => parse(`<main>${html}</main>`);
const checkReviews = (html, expected, fixtureMode = false) => { const document = mainDocument(html); return checkTestimonials(ROUTE, document, document, expected, fixtureMode); };
const reviewsPass = (html, expected, fixtureMode = false) => assert.doesNotThrow(() => checkReviews(html, expected, fixtureMode));
const reviewsFail = (html, expected, pattern, secrets, fixtureMode = false) => failsPrivately(() => checkReviews(html, expected, fixtureMode), pattern, secrets);
// Every synthetic value the expectation carries; none may appear in a failure.
const reviewSecrets = data => [
  ...data.testimonials.flatMap(item => [item.quote, item.name, ...(item.business ? [item.business] : [])]),
  ...Object.values(data.testimonialCategories),
  ...data.partnerLogos.flatMap(logo => [logo.src, logo.alt]),
  'res.cloudinary.com',
];

test('expectedLogoImage restates the SmartImage Cloudinary formula for the 130px and 2x candidates', () => {
  assert.deepEqual(expectedLogoImage({ src: CLOUDINARY_LOGO, alt: 'Synthetic logo two' }), { src: CLOUDINARY_1X, srcset: `${CLOUDINARY_1X} 1x, ${CLOUDINARY_2X} 2x`, alt: 'Synthetic logo two' });
  // Non-Cloudinary sources and Cloudinary URLs without /upload/ are untouched; an already-optimised URL is not doubled.
  assert.deepEqual(expectedLogoImage({ src: '/synthetic/logos/logo-one.svg', alt: 'one' }), { src: '/synthetic/logos/logo-one.svg', srcset: '/synthetic/logos/logo-one.svg 1x, /synthetic/logos/logo-one.svg 2x', alt: 'one' });
  assert.equal(expectedLogoImage({ src: 'https://res.cloudinary.com/synthetic-cloud/image/fetch/logo.png', alt: 'x' }).src, 'https://res.cloudinary.com/synthetic-cloud/image/fetch/logo.png');
  assert.equal(expectedLogoImage({ src: CLOUDINARY_1X, alt: 'x' }).src, CLOUDINARY_1X);
  assert.equal(expectedLogoImage({ src: 'https://cdn.example.test/image/upload/logo.png', alt: 'x' }).src, 'https://cdn.example.test/image/upload/logo.png');
});

test('a faithful testimonials rendering passes the exact comparison in default and fixture mode, duplicates included', () => {
  const data = syntheticReviews();
  reviewsPass(renderTestimonials(data), data);
  reviewsPass(renderTestimonials(data, { fixtureAttribute: true }), data, true);
  reviewsFail(renderTestimonials(data, { fixtureAttribute: true }), data, /default build carries synthetic fixture testimonials/, reviewSecrets(data));
  reviewsFail(renderTestimonials(data), data, /fixture build must mark the testimonials section/, reviewSecrets(data), true);
});

test('a changed quote, name or business fails on the review index and field without leaking either value', () => {
  const data = syntheticReviews();
  const secrets = [...reviewSecrets(data), 'Reworded synthetic quote.', 'Reworded Synthetic Person', 'Reworded Synthetic Company'];
  const quoteChanged = syntheticReviews(); quoteChanged.testimonials[2].quote = 'Reworded synthetic quote.';
  reviewsFail(renderTestimonials(quoteChanged), data, /^\/synthetic-route: review 2 quote differs from the projection$/, secrets);
  const nameChanged = syntheticReviews(); nameChanged.testimonials[1].name = 'Reworded Synthetic Person';
  reviewsFail(renderTestimonials(nameChanged), data, /^\/synthetic-route: review 1 name differs from the projection$/, secrets);
  const companyChanged = syntheticReviews(); companyChanged.testimonials[3].business = 'Reworded Synthetic Company';
  reviewsFail(renderTestimonials(companyChanged), data, /^\/synthetic-route: review 3 caption differs from the projection$/, secrets);
  const businessAdded = syntheticReviews(); businessAdded.testimonials[1].business = 'Reworded Synthetic Company';
  reviewsFail(renderTestimonials(businessAdded), data, /^\/synthetic-route: review 1 caption differs from the projection$/, secrets);
  // The Testimonials.tsx quote wrapper is part of the rendering.
  reviewsFail(renderTestimonials(data).replace('"Synthetic quote beta."', 'Synthetic quote beta.'), data, /review 1 quote differs/, reviewSecrets(data));
});

test('every review must link to the Google reviews as its source', () => {
  const data = syntheticReviews();
  const faithful = renderTestimonials(data);
  const href = `href="${esc(GOOGLE_REVIEWS_URL)}"`;
  reviewsFail(faithful.replace(href, 'href="https://example.test/reviews"'), data, /^\/synthetic-route: review 0 does not link to the Google reviews as its source$/, reviewSecrets(data));
  reviewsFail(faithful.replace(`<a ${href}>Google review</a>`, 'Google review'), data, /review 0 source link missing/, reviewSecrets(data));
});

test('reordering reviews within one category fails even though every count and category key still matches', () => {
  const data = syntheticReviews();
  const reordered = syntheticReviews();
  [reordered.testimonials[0], reordered.testimonials[3]] = [reordered.testimonials[3], reordered.testimonials[0]];
  assert.deepEqual(reordered.testimonials.map(item => item.category), data.testimonials.map(item => item.category));
  reviewsFail(renderTestimonials(reordered), data, /review 0 quote differs/, reviewSecrets(data));
});

test('a rendering that de-duplicates the repeated review, or adds one, fails on the count even when the tab counts still match', () => {
  const data = syntheticReviews();
  const faithful = renderTestimonials(data);
  // Tab counts are left as the source computes them; only the figures change.
  const deduplicated = faithful.replace(/<figure class="source-testimonials-item" data-testimonials-item data-index="2".*?<\/figure>/, '');
  assert.notEqual(deduplicated, faithful);
  reviewsFail(deduplicated, data, /^\/synthetic-route: review count differs from the projection$/, reviewSecrets(data));
  const extended = faithful.replace('</div><p data-testimonials-empty', `${figureHtml(data.testimonials[1], 4)}</div><p data-testimonials-empty`);
  assert.notEqual(extended, faithful);
  reviewsFail(extended, data, /^\/synthetic-route: review count differs from the projection$/, reviewSecrets(data));
  // Changing the record list itself also moves the tab counts, which fail first.
  const dropped = syntheticReviews(); dropped.testimonials.splice(2, 1);
  reviewsFail(renderTestimonials(dropped), data, /testimonial tab 0 count differs from the projection/, reviewSecrets(data));
});

test('category keys, labels, tab order and counts are compared exactly', () => {
  const data = syntheticReviews();
  const secrets = [...reviewSecrets(data), 'Reworded synthetic label'];
  const relabelled = syntheticReviews(); relabelled.testimonialCategories.speed = 'Reworded synthetic label';
  reviewsFail(renderTestimonials(relabelled), data, /^\/synthetic-route: testimonial tab 1 label differs from the projection$/, secrets);
  const reorderedTabs = syntheticReviews(); reorderedTabs.testimonialCategories = { all: 'All synthetic reviews', value: 'Synthetic value label', speed: 'Synthetic speed label' };
  reviewsFail(renderTestimonials(reorderedTabs), data, /testimonial tab 1 key or pressed state differs/, secrets);
  const recategorised = syntheticReviews(); recategorised.testimonials[3].category = 'value';
  reviewsFail(renderTestimonials(recategorised), data, /testimonial tab 1 count differs/, secrets);
  // Same counts, wrong key on one figure.
  reviewsFail(renderTestimonials(data).replace('data-index="1" data-category="value"', 'data-index="1" data-category="speed"'), data, /review 1 category key differs/, secrets);
  const extraTab = syntheticReviews(); extraTab.testimonialCategories.extra = 'Synthetic extra label';
  reviewsFail(renderTestimonials(extraTab), data, /testimonial tab count differs/, secrets);
});

test('logo src, srcset and alt must follow the Cloudinary formula over the projection, in order', () => {
  const data = syntheticReviews();
  const secrets = [...reviewSecrets(data), 'Reworded synthetic alt'];
  const realt = syntheticReviews(); realt.partnerLogos[1].alt = 'Reworded synthetic alt';
  reviewsFail(renderTestimonials(realt), data, /^\/synthetic-route: logo 1 alt differs from the projection$/, secrets);
  // Unoptimised Cloudinary src, or a srcset whose 2x candidate is not the 260px URL.
  reviewsFail(renderTestimonials(data, { logoImage: logo => ({ src: logo.src, srcset: `${logo.src} 1x, ${logo.src} 2x`, alt: logo.alt }) }), data, /logo 1 src differs from the SmartImage formula/, secrets);
  reviewsFail(renderTestimonials(data, { logoImage: logo => { const image = expectedLogoImage(logo); return { ...image, srcset: `${image.src} 1x, ${image.src} 2x` }; } }), data, /logo 1 srcset differs from the LogoCarousel 1x\/2x formula/, secrets);
  // Dropping the 2x candidate fails on the first logo, Cloudinary or not.
  reviewsFail(renderTestimonials(data, { logoImage: logo => { const image = expectedLogoImage(logo); return { ...image, srcset: `${image.src} 1x` }; } }), data, /logo 0 srcset differs/, secrets);
  // A different quality preset in the formula is not the source formula.
  reviewsFail(renderTestimonials(data).replaceAll('q_auto:eco', 'q_auto:good'), data, /logo 1 src differs/, secrets);
  const swapped = syntheticReviews(); swapped.partnerLogos.reverse();
  reviewsFail(renderTestimonials(swapped), data, /logo 0 src differs/, secrets);
  const dropped = syntheticReviews(); dropped.partnerLogos.pop();
  reviewsFail(renderTestimonials(dropped), data, /logo count differs from the projection/, secrets);
});

// --- Shared contact block: exact SourceContact contract ---------------------------------
const CONTACT_LEAD = 'Ready to banish tech headaches? Fill out the form or book a chat directly. Tell us what you need help with and how best to reach you.';
const CONTACT_TRUST = 'Trusted by local businesses for over 10 years';
const ONBOARDING_LABEL = 'Thinking of switching providers? See how easy it is';
const CONTACT_METHODS = [
  ['Call The Batphone', 'tel:01584517234', '01584 517 234'],
  ['Email HQ', 'mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'],
  ['Face-to-Face', '/contact', 'Book an Intro Call with Sam'],
];
const renderContact = ({ lead = `<p class="source-contact-lead">${CONTACT_LEAD}</p>`, trust = `<p class="source-contact-trust"><span aria-hidden="true">✓ </span>${CONTACT_TRUST}</p>`, onboarding = `<p class="source-contact-switch"><a href="/onboarding">${ONBOARDING_LABEL} <span aria-hidden="true">→</span></a></p>`, methods = CONTACT_METHODS } = {}) => {
  const items = methods.map(([label, href, value]) => `<li class="source-contact-item"><span class="source-contact-icon" aria-hidden="true"><svg></svg></span><span class="source-contact-item-body"><span class="source-contact-label">${label}</span><a class="source-contact-value" href="${href}">${value}</a></span></li>`).join('');
  return '<section id="contact" class="source-contact" aria-labelledby="source-contact-heading"><div class="source-contact-info"><h2 id="source-contact-heading">Signal for Help</h2>' +
    `${lead}${trust}${onboarding}<ul class="source-contact-list">${items}</ul></div><div class="source-contact-aside"><div data-contact-disabled><p>Synthetic disabled preview notice.</p></div></div></section>`;
};
const checkContact = html => { const document = mainDocument(html); return checkSourceContact(ROUTE, document, document, html); };
const contactPasses = html => assert.doesNotThrow(() => checkContact(html));
const contactFails = (html, pattern, secrets = []) => failsPrivately(() => checkContact(html), pattern, [CONTACT_LEAD, CONTACT_TRUST, ONBOARDING_LABEL, ...secrets]);

test('a faithful SourceContact rendering passes, with or without its decorative aria-hidden glyphs', () => {
  contactPasses(renderContact());
  contactPasses(renderContact({ trust: `<p class="source-contact-trust">${CONTACT_TRUST}</p>`, onboarding: `<p class="source-contact-switch"><a href="/onboarding">${ONBOARDING_LABEL}</a></p>` }));
});

test('a dropped or changed lead paragraph fails on the field without leaking either wording', () => {
  contactFails(renderContact({ lead: '' }), /^\/synthetic-route: contact lead paragraph missing$/);
  contactFails(renderContact({ lead: '<p class="source-contact-lead">Reworded synthetic lead paragraph.</p>' }), /^\/synthetic-route: contact lead paragraph differs from the source$/, ['Reworded synthetic lead']);
  contactFails(renderContact({ lead: `<p class="source-contact-lead">${CONTACT_LEAD} Extra synthetic sentence.</p>` }), /contact lead paragraph differs/, ['Extra synthetic sentence']);
  contactFails(renderContact({ lead: `<p class="source-contact-lead">${CONTACT_LEAD.replace(' and how best to reach you', '')}</p>` }), /contact lead paragraph differs/);
});

test('the trust sentence is compared without its aria-hidden checkmark, so a dropped, changed or exposed mark fails', () => {
  contactFails(renderContact({ trust: '' }), /^\/synthetic-route: contact trust sentence missing$/);
  contactFails(renderContact({ trust: '<p class="source-contact-trust"><span aria-hidden="true">✓ </span>Reworded synthetic trust sentence</p>' }), /^\/synthetic-route: contact trust sentence differs from the source/, ['Reworded synthetic trust']);
  // The checkmark read aloud is not the source sentence.
  contactFails(renderContact({ trust: `<p class="source-contact-trust"><span>✓ </span>${CONTACT_TRUST}</p>` }), /contact trust sentence differs/);
  contactFails(renderContact({ trust: `<p class="source-contact-trust">✓ ${CONTACT_TRUST}</p>` }), /contact trust sentence differs/);
});

test('the onboarding link is compared by href and aria-hidden-free label, so either drifting fails', () => {
  // The prior loose check still catches a section with no /onboarding link at all.
  contactFails(renderContact({ onboarding: '' }), /contact section is missing the \/onboarding link/);
  // With an /onboarding link elsewhere in the section, the exact contract on the switch line is what fails.
  const strayOnboarding = [...CONTACT_METHODS, ['Synthetic extra', '/onboarding', 'Synthetic extra value']];
  contactFails(renderContact({ onboarding: '', methods: strayOnboarding }), /^\/synthetic-route: onboarding line missing$/, ['Synthetic extra']);
  contactFails(renderContact({ onboarding: `<p class="source-contact-switch">${ONBOARDING_LABEL}</p>`, methods: strayOnboarding }), /^\/synthetic-route: onboarding line must carry exactly one link$/, ['Synthetic extra']);
  contactFails(renderContact({ onboarding: `<p class="source-contact-switch"><a href="/contact">${ONBOARDING_LABEL} <span aria-hidden="true">→</span></a></p>`, methods: strayOnboarding }), /^\/synthetic-route: onboarding link target differs from the source$/, ['Synthetic extra']);
  contactFails(renderContact({ onboarding: '<p class="source-contact-switch"><a href="/onboarding">Reworded synthetic switch label <span aria-hidden="true">→</span></a></p>' }), /^\/synthetic-route: onboarding link label differs from the source/, ['Reworded synthetic switch']);
  contactFails(renderContact({ onboarding: `<p class="source-contact-switch"><a href="/onboarding">${ONBOARDING_LABEL}: <span aria-hidden="true">→</span></a></p>` }), /onboarding link label differs/);
  // The arrow read aloud is not the source label.
  contactFails(renderContact({ onboarding: `<p class="source-contact-switch"><a href="/onboarding">${ONBOARDING_LABEL} →</a></p>` }), /onboarding link label differs/);
});

test('phone, email and booking are compared as label/href/value pairs in order, not as loose includes', () => {
  // Every label, href and value is still present somewhere; only the pairing is wrong.
  const swappedValues = [['Call The Batphone', 'mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'], ['Email HQ', 'tel:01584517234', '01584 517 234'], CONTACT_METHODS[2]];
  contactFails(renderContact({ methods: swappedValues }), /^\/synthetic-route: contact method 0 link target differs from the source$/);
  const swappedLabels = [['Email HQ', 'tel:01584517234', '01584 517 234'], ['Call The Batphone', 'mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk'], CONTACT_METHODS[2]];
  contactFails(renderContact({ methods: swappedLabels }), /^\/synthetic-route: contact method 0 label differs from the source$/);
  const wrongValue = [CONTACT_METHODS[0], ['Email HQ', 'mailto:hello@fresh-tech.uk', 'hello@fresh-tech.uk (synthetic)'], CONTACT_METHODS[2]];
  contactFails(renderContact({ methods: wrongValue }), /^\/synthetic-route: contact method 1 link value differs from the source$/, ['(synthetic)']);
  const reordered = [CONTACT_METHODS[1], CONTACT_METHODS[0], CONTACT_METHODS[2]];
  contactFails(renderContact({ methods: reordered }), /contact method 0 label differs/);
  // The prior loose assertions still hold: a missing method fails before the pairs are reached.
  contactFails(renderContact({ methods: CONTACT_METHODS.slice(0, 2) }), /contact section is missing the \/contact link/);
  contactFails(renderContact({ methods: [...CONTACT_METHODS, ['Synthetic extra', '/contact', 'Synthetic extra value']] }), /contact method count differs from the source/, ['Synthetic extra']);
});

// --- Body family marker: ownership by the main marker, never by route ------------------
const page = (bodyAttrs, mainAttrs) => `<!doctype html><html lang="en-GB"><head><title>Synthetic</title></head><body${bodyAttrs}><main${mainAttrs}><h1>Synthetic</h1></main></body></html>`;
const PROBLEM_BODY = ' data-page-family="problems"';
const PROBLEM_MAIN = ' data-problem-page="synthetic-problem"';

test('a marked problem page and an unmarked non-problem page pass the body family marker check', () => {
  assert.equal(checkBodyFamilyMarker('synthetic-problem', page(PROBLEM_BODY, PROBLEM_MAIN)), true);
  assert.equal(checkBodyFamilyMarker('unrelated-route', page('', '')), false);
  assert.equal(checkBodyFamilyMarker('/', page(' data-page-family="other"', '')), false);
});

test('a problem page with a missing or wrong body family marker fails', () => {
  assert.throws(() => checkBodyFamilyMarker('synthetic-problem', page('', PROBLEM_MAIN)), /^Error: synthetic-problem: problem page must have exactly one body with data-page-family="problems"$/);
  assert.throws(() => checkBodyFamilyMarker('synthetic-problem', page(' data-page-family="other"', PROBLEM_MAIN)), /problem page must have exactly one body/);
  assert.throws(() => checkBodyFamilyMarker('synthetic-problem', page(' data-page-family="Problems"', PROBLEM_MAIN)), /problem page must have exactly one body/);
});

test('the problems body marker leaked onto an unrelated route fails regardless of its path', () => {
  assert.throws(() => checkBodyFamilyMarker('unrelated-route', page(PROBLEM_BODY, '')), /^Error: unrelated-route: non-problem page carries data-page-family="problems" on its body$/);
  assert.throws(() => checkBodyFamilyMarker('/', page(PROBLEM_BODY, '')), /non-problem page carries/);
  // A page that looks like a problem slug but has no main marker is not owned, so the marker is still a leak.
  assert.throws(() => checkBodyFamilyMarker('ransomware-recovery', page(PROBLEM_BODY, '')), /non-problem page carries/);
});

test('the contact block must stay in disabled preview mode without eager embeds', () => {
  contactFails(renderContact().replace('<div data-contact-disabled>', '<form data-contact-form action="/api/send-email">').replace('</div></div></section>', '</form></div></section>'), /contact form is not in the default disabled preview mode/);
  contactFails(`${renderContact()}<script src="https://assets.calendly.com/assets/external/widget.js"></script>`, /eager scheduling embed leaked/);
});
