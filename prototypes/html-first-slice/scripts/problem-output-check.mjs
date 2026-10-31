import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse } from 'ultrahtml';
import { decodeEntities, normalise } from './lib/blog-rendered-text.mjs';
import { PROBLEM_MARKER, inventoryIsClean, mainMarker, problemInventory } from './lib/problem-inventory.mjs';
import { readProblems } from './lib/problem-reader.mjs';
import { readTestimonialData } from './lib/testimonial-reader.mjs';
import { GOOGLE_REVIEWS_URL, REVIEW_SOURCE_LABEL, reviewCaption } from '../src/lib/testimonial-display.mjs';
import { FIXTURE_MODE, TESTIMONIALS_FIXTURE_ATTRIBUTE, TESTIMONIALS_FIXTURE_ENV, resolveTestimonialsFixtureMode, syntheticTestimonialData } from './lib/testimonial-fixture.mjs';
import { loadRetainedReactHead } from './lib/retained-react-head.mjs';

// Focused checker for the emitted root-slug problem family (pages/ProblemPage.tsx
// ported by src/components/ProblemPage.astro). Expectations come from the
// fail-closed source projection (scripts/lib/problem-reader.mjs over
// data/content.ts, read here at run time rather than from the
// generated module), the retained React Organization fixture, and inline
// restatements of components/SEO.tsx, the React page's schema objects, its
// literal copy and hrefs, and the components/RichText.tsx block rules. Nothing
// here imports the SEO, display, icon or rich-text modules under test.
//
// Emitted pages are parsed with ultrahtml; family ownership is the
// data-problem-page marker on the single <main> (scripts/lib/problem-inventory.mjs),
// never a URL prefix. Record and review content is compared, never printed:
// failures name the route, field and index only.
//
// Usage: node scripts/problem-output-check.mjs [dist-dir] [--testimonials-fixture]
// The shared testimonials block is compared exactly in both modes: every
// review (quote wrapper, name, company, category key), every tab (key, label,
// count) and every logo (src, srcset, alt under the SmartImage Cloudinary
// formula) in source order, duplicates included. By default the expectation is
// the fail-closed source projection read at run time and the reserved fixture
// attribute must be absent. With --testimonials-fixture or TESTIMONIALS_FIXTURE=1
// (the extractor's own switch) the expectation is the synthetic fixture and the
// build must carry the fixture attribute. The environment value is validated
// whether or not the flag is given, so an unrecognised value is always an error
// rather than a silent source-mode run. Values are compared, never printed.
//
// checkRichBlock, richTextExpectation, checkTestimonials, expectedLogoImage,
// checkSourceContact, checkBodyFamilyMarker and parseCheckerArgs are exported for
// scripts/problem-output-check.test.mjs; main() only runs when this file is
// the entry point, so importing it never reads the source projection or dist.

const FIXTURE_FLAG = '--testimonials-fixture';
const BASE_URL = 'https://fresh-tech.uk';
const DEFAULT_IMAGE = DEFAULT_SOCIAL_IMAGE;
const LOGO_URL = 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png';
// components/SEO.tsx emits the index directive for every page; the React
// page passes no robots override, so the port is compared with that formula.
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const STATIC_METADATA = {
  robots: INDEX_ROBOTS,
  'og:image': DEFAULT_IMAGE, 'og:image:width': '1200', 'og:image:height': '630', 'og:type': 'website', 'og:site_name': 'Fresh Tech IT Support', 'og:locale': 'en_GB',
  'twitter:card': 'summary_large_image', 'twitter:site': '@fresh_tech_', 'twitter:creator': '@fresh_tech_', 'twitter:image': DEFAULT_IMAGE,
};
const HTML_GZIP_BUDGET = 32 * 1024;
// pages/ProblemPage.tsx literals.
const EMERGENCY_SLUG = 'ransomware-recovery';
const PHONE_HREF = 'tel:01584517234';
const CALL_NOW_LABEL = 'Call Now: 01584 517 234';
const HERO_CALL_LABEL = 'Call 01584 517 234';
const CONTACT_HREF = '/contact';
const PRICING_HREF = '/pricing';
const PRICING_LABEL = 'View Pricing';
const ARTICLE_DATE_PUBLISHED = '2025-06-01T00:00:00+00:00';
const ARTICLE_DATE_MODIFIED = '2026-03-04T00:00:00+00:00';
const SECTION_COPY = {
  symptoms: ['Does This Sound Familiar?', "Common signs you're experiencing this issue"],
  causes: ["What's Causing This?", 'Understanding the root causes helps find the right solution'],
  solutions: ['How We Can Help', 'Practical solutions to resolve your issues'],
  faqs: ['Frequently Asked Questions', 'Common questions about this issue'],
  final: ['Ready to Fix This?', "Let's get your IT working properly"],
};
// components/Testimonials.tsx, components/LogoCarousel.tsx and components/Contact.tsx literals.
const TESTIMONIALS_HEADING = 'Trusted By Local Heroes';
const TESTIMONIALS_LEAD = "Don't just take our word for it.";
const LOGOS_TITLE = 'Powering Businesses Like';
const ALL_CATEGORY = 'all';
const LOGO_WIDTH = '130';
const LOGO_HEIGHT = '40';
const LOGO_QUALITY = 'eco';
const CONTACT_HEADING = 'Signal for Help';
// src/components/SourceContact.astro public business contact contract (the
// inherited components/Contact.tsx copy). Decorative aria-hidden glyphs beside
// the trust sentence and onboarding label are excluded from the comparison.
const CONTACT_LEAD = 'Ready to banish tech headaches? Fill out the form or book a chat directly. Tell us what you need help with and how best to reach you.';
const CONTACT_TRUST = 'Trusted by local businesses for over 10 years';
const ONBOARDING_HREF = '/onboarding';
const ONBOARDING_LABEL = 'Thinking of switching providers? See how easy it is';
const EMAIL_HREF = 'mailto:hello@fresh-tech.uk';
const CONTACT_METHODS = [
  ['Call The Batphone', PHONE_HREF, '01584 517 234'],
  ['Email HQ', EMAIL_HREF, 'hello@fresh-tech.uk'],
  ['Face-to-Face', CONTACT_HREF, 'Book an Intro Call with Sam'],
];

const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
const prettify = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
// The React page strips Markdown links from FAQ answers before the schema.
const faqAnswerText = answer => answer.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
// Visible text of one source line as the React RichText shows it, restating
// its inline precedence independently of the port: links are split out first
// and their labels are shown as plain text (markers inside a label stay
// visible), then each surrounding segment is split on **strong** runs, and the
// remaining pieces on *em* runs. A segment that merely starts and ends with
// "**" (a lone "**" left beside a link) becomes an empty strong, exactly as the
// React component slices it; every other stray marker is literal text.
const visibleEm = str => str.split(/(\*[^*]+?\*)/g).map(part => (part.startsWith('*') && part.endsWith('*') && part.length > 2 ? part.slice(1, -1) : part)).join('');
const visibleStrong = str => str.split(/(\*\*[^*]+?\*\*)/g).map(part => (part.startsWith('**') && part.endsWith('**') ? part.slice(2, -2) : visibleEm(part))).join('');
const visibleSource = line => {
  const parts = line.split(/\[(.*?)\]\((.*?)\)/g);
  let visible = '';
  for (let index = 0; index < parts.length; index += 3) {
    if (parts[index]) visible += visibleStrong(parts[index]);
    if (index + 2 < parts.length) visible += parts[index + 1];
  }
  return visible;
};

const fail = message => { throw new Error(message); };
let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) fail(message); };

// --- Parsed-DOM helpers --------------------------------------------------------
const ELEMENT_NODE = 1;
const TEXT_NODE = 2;
const SKIPPED = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'body', 'br', 'button', 'caption', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'legend', 'li', 'main', 'nav', 'ol', 'option', 'p', 'pre', 'section',
  'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title', 'tr', 'ul', 'video',
]);
const walk = (node, callback) => { callback(node); for (const child of node.children ?? []) walk(child, callback); };
const tagName = node => (node.type === ELEMENT_NODE ? (node.name ?? '').toLowerCase() : '');
const find = (root, predicate) => { const out = []; walk(root, node => { if (node.type === ELEMENT_NODE && predicate(node)) out.push(node); }); return out; };
const byName = (root, name) => find(root, node => tagName(node) === name);
const attr = (node, name) => node.attributes?.[name];
const hasAttr = (node, name) => Object.keys(node.attributes ?? {}).some(key => key.toLowerCase() === name);
const classes = node => (attr(node, 'class') ?? '').split(/\s+/).filter(Boolean);
const hasClass = (node, name) => classes(node).includes(name);
const byClass = (root, name) => find(root, node => hasClass(node, name));
const byAttr = (root, name) => find(root, node => hasAttr(node, name));
const only = (nodes, message) => { expect(nodes.length === 1, message); return nodes[0]; };
const collectText = (node, out, skipHidden) => {
  if (node.type === TEXT_NODE) { out.push(decodeEntities(node.value ?? '')); return; }
  const name = tagName(node);
  if (SKIPPED.has(name) || (skipHidden && attr(node, 'aria-hidden') === 'true')) return;
  const block = BLOCK.has(name);
  if (block) out.push(' ');
  for (const child of node.children ?? []) collectText(child, out, skipHidden);
  if (block) out.push(' ');
};
// Whitespace-normalised visible text: inline adjacency survives, block
// boundaries become a space, entities decode once.
const textOf = node => { const out = []; collectText(node, out, false); return normalise(out.join('')); };
// The same text with aria-hidden="true" subtrees removed: what assistive
// technology reads, so decorative glyphs must be hidden to be tolerated.
const accessibleTextOf = node => { const out = []; collectText(node, out, true); return normalise(out.join('')); };
const rawText = node => (node.children ?? []).map(child => (child.type === TEXT_NODE ? child.value ?? '' : rawText(child))).join('');
const decorativeSvgs = node => byName(node, 'svg').filter(svg => attr(svg, 'aria-hidden') === 'true');

// --- Inline restatement of components/RichText.tsx block rules ------------------
const isBullet = line => line.trim().startsWith('-') || line.trim().startsWith('•');
const isNumbered = line => /^\d+\./.test(line.trim());
export function richTextExpectation(text) {
  const expectation = { p: 0, ul: 0, ol: 0, li: 0, br: 0, pieces: [], links: [] };
  for (const paragraph of text.split(/\n\n+/)) {
    const lines = paragraph.split('\n');
    const bulletList = lines.every(line => line.trim() === '' || isBullet(line)) && lines.some(isBullet);
    const numberedList = !bulletList && lines.every(line => line.trim() === '' || isNumbered(line)) && lines.some(isNumbered);
    if (bulletList || numberedList) {
      const items = lines.filter(bulletList ? isBullet : isNumbered).map(line => line.replace(bulletList ? /^[-•]\s*/ : /^\d+\.\s*/, ''));
      expectation[bulletList ? 'ul' : 'ol']++;
      expectation.li += items.length;
      expectation.pieces.push(...items.map(visibleSource));
    } else {
      expectation.p++;
      expectation.br += lines.length - 1;
      expectation.pieces.push(...lines.map(visibleSource));
    }
    for (const match of paragraph.matchAll(/\[(.*?)\]\((.*?)\)/g)) expectation.links.push({ label: match[1], href: match[2], external: match[2].startsWith('http') });
  }
  return expectation;
}
// The rendered visible text must equal the ordered source pieces exactly
// (paragraphs, line breaks and list items each become one block boundary), so
// added, dropped or reordered wording fails. Links are compared by document
// position against the source links in order: the same href may legitimately
// appear more than once with different labels.
export function checkRichBlock(route, label, block, source) {
  const expected = richTextExpectation(source);
  const count = name => byName(block, name).length;
  expect(count('p') === expected.p && count('ul') === expected.ul && count('ol') === expected.ol && count('li') === expected.li, `${route}: ${label} block element counts differ from the RichText paragraph/list rules`);
  expect(count('br') === expected.br, `${route}: ${label} single line breaks differ from the source`);
  expect(textOf(block) === normalise(expected.pieces.join(' ')), `${route}: ${label} rendered text differs from the ordered source text`);
  const anchors = byName(block, 'a');
  expect(anchors.length === expected.links.length, `${route}: ${label} link count differs from the source`);
  expected.links.forEach((link, index) => {
    const anchor = anchors[index];
    expect(decodeEntities(attr(anchor, 'href') ?? '') === link.href, `${route}: ${label} link ${index} target differs from the source`);
    expect(textOf(anchor) === normalise(link.label), `${route}: ${label} link ${index} label differs from the source`);
    if (link.external) expect(attr(anchor, 'target') === '_blank' && attr(anchor, 'rel') === 'noopener noreferrer', `${route}: ${label} external link ${index} lacks the React target/rel attributes`);
    else expect(attr(anchor, 'target') === undefined && attr(anchor, 'rel') === undefined, `${route}: ${label} internal link ${index} opened in a new tab`);
  });
  for (const anchor of anchors) expect(!/^\s*(?:javascript|data|vbscript):/i.test(decodeEntities(attr(anchor, 'href') ?? '')), `${route}: ${label} emitted an unsafe link scheme`);
}

// --- Inline restatement of the LogoCarousel/SmartImage image formula -------------
// optimizeCloudinaryUrl in components/SmartImage.tsx, restated rather than
// imported from the display module under test: a URL on res.cloudinary.com
// with an /upload/ segment gains w_{width},f_auto,q_auto:eco directly after
// /upload/ (unless that exact segment is already present); any other URL is
// left untouched. LogoItem renders the 130px candidate as src and pairs it
// with a 2x (260px) candidate in srcset.
const cloudinaryLogoUrl = (url, width) => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const params = `w_${width},f_auto,q_auto:${LOGO_QUALITY}`;
  return url.includes(`/${params}/`) ? url : url.replace('/upload/', `/upload/${params}/`);
};
export function expectedLogoImage(logo) {
  const src = cloudinaryLogoUrl(logo.src, Number(LOGO_WIDTH));
  return { src, srcset: `${src} 1x, ${cloudinaryLogoUrl(logo.src, Number(LOGO_WIDTH) * 2)} 2x`, alt: logo.alt };
}

// --- Shared testimonials block -------------------------------------------------------
// expected: { testimonials, testimonialCategories, partnerLogos } from either
// the run-time source projection or the synthetic fixture; the same exact
// comparison runs on both. Reviews, tabs and logos are compared by position in
// source order (a repeated review must be emitted again, a reorder within one
// category fails on its quote), and failures name the route, index and field
// only. fixtureMode decides whether the reserved fixture attribute must be
// present on the section or absent from the whole document.
export function checkTestimonials(route, document, main, expected, fixtureMode) {
  const { testimonials, testimonialCategories, partnerLogos } = expected;
  const tabKeys = Object.keys(testimonialCategories);
  const tabCount = key => (key === ALL_CATEGORY ? testimonials.length : testimonials.filter(item => item.category === key).length);
  expect(testimonials.length > 0 && partnerLogos.length > 0 && tabKeys.includes(ALL_CATEGORY), `${route}: testimonial projection has no reviews, no logos or no "all" tab`);

  const reviews = only(byClass(main, 'source-testimonials'), `${route}: expected one testimonials section inside main`);
  expect(hasAttr(reviews, 'data-testimonials') && attr(reviews, 'aria-labelledby') === 'source-testimonials-heading', `${route}: testimonials section hooks differ`);
  expect(textOf(only(find(reviews, node => attr(node, 'id') === 'source-testimonials-heading'), `${route}: testimonials heading missing`)) === TESTIMONIALS_HEADING, `${route}: testimonials heading differs`);
  expect(textOf(only(byClass(reviews, 'source-testimonials-lead'), `${route}: testimonials lead missing`)) === TESTIMONIALS_LEAD, `${route}: testimonials lead differs`);
  const filters = only(byClass(reviews, 'source-testimonials-filters'), `${route}: testimonial filters missing`);
  expect(hasAttr(filters, 'hidden') && attr(filters, 'role') === 'group', `${route}: testimonial filters must be a hidden group before enhancement`);
  const tabs = byClass(filters, 'source-testimonials-filter');
  expect(tabs.length === tabKeys.length, `${route}: testimonial tab count differs from the projection`);
  tabs.forEach((tab, index) => {
    const key = tabKeys[index];
    expect(attr(tab, 'type') === 'button' && attr(tab, 'data-testimonials-filter') === key && attr(tab, 'aria-pressed') === (key === ALL_CATEGORY ? 'true' : 'false'), `${route}: testimonial tab ${index} key or pressed state differs from the projection`);
    expect(decorativeSvgs(tab).length === 1, `${route}: testimonial tab ${index} icon is not decorative`);
    expect(textOf(only(byClass(tab, 'source-testimonials-count'), `${route}: testimonial tab ${index} count missing`)) === String(tabCount(key)), `${route}: testimonial tab ${index} count differs from the projection`);
    const label = byName(tab, 'span').find(span => !hasClass(span, 'source-testimonials-count'));
    expect(label !== undefined && textOf(label) === normalise(testimonialCategories[key]), `${route}: testimonial tab ${index} label differs from the projection`);
  });
  const stars = only(byClass(reviews, 'source-testimonials-stars'), `${route}: star row missing`);
  expect(attr(stars, 'aria-hidden') === 'true' && byName(stars, 'svg').length === 5, `${route}: star row is not five decorative stars`);
  const stack = only(byAttr(reviews, 'data-testimonials-stack'), `${route}: testimonial stack missing`);
  expect(attr(stack, 'role') === 'region' && attr(stack, 'aria-live') === 'off' && attr(stack, 'aria-atomic') === 'true', `${route}: testimonial stack live-region attributes differ`);
  const items = byClass(reviews, 'source-testimonials-item');
  expect(items.length === testimonials.length, `${route}: review count differs from the projection`);
  items.forEach((item, index) => {
    const record = testimonials[index];
    expect(tagName(item) === 'figure' && hasAttr(item, 'data-testimonials-item') && attr(item, 'data-index') === String(index), `${route}: review ${index} figure hooks differ`);
    expect(attr(item, 'data-category') === record.category, `${route}: review ${index} category key differs from the projection`);
    const quote = only(byClass(item, 'source-testimonials-quote'), `${route}: review ${index} quote missing`);
    const name = only(byClass(item, 'source-testimonials-name'), `${route}: review ${index} name missing`);
    const company = only(byClass(item, 'source-testimonials-company'), `${route}: review ${index} company missing`);
    expect(byName(item, 'blockquote').length === 1 && byName(item, 'figcaption').length === 1 && textOf(quote) && textOf(name) && textOf(company), `${route}: review ${index} structure is incomplete`);
    // Testimonials.tsx wraps the quote in straight double quotes.
    expect(textOf(quote) === normalise(`"${record.quote}"`), `${route}: review ${index} quote differs from the projection`);
    expect(textOf(name) === normalise(record.name), `${route}: review ${index} name differs from the projection`);
    expect(textOf(company) === normalise(reviewCaption(record)), `${route}: review ${index} caption differs from the projection`);
    const source = only(byName(company, 'a'), `${route}: review ${index} source link missing`);
    expect(decodeEntities(attr(source, 'href') ?? '') === GOOGLE_REVIEWS_URL && textOf(source) === REVIEW_SOURCE_LABEL, `${route}: review ${index} does not link to the Google reviews as its source`);
  });
  const empty = only(byAttr(reviews, 'data-testimonials-empty'), `${route}: empty-state paragraph missing`);
  expect(hasAttr(empty, 'hidden') && textOf(empty) === 'No reviews in this category yet.', `${route}: empty-state copy or hidden state differs`);
  const controls = only(byAttr(reviews, 'data-testimonials-controls'), `${route}: testimonial controls missing`);
  expect(hasAttr(controls, 'hidden'), `${route}: testimonial controls must be hidden before enhancement`);
  const dots = byClass(controls, 'source-testimonials-dot');
  expect(dots.length === testimonials.length, `${route}: dot count differs from the review count`);
  dots.forEach((dot, index) => expect(attr(dot, 'type') === 'button' && attr(dot, 'data-index') === String(index) && attr(dot, 'aria-label') === `Go to testimonial ${index + 1} of ${testimonials.length}`, `${route}: dot ${index} attributes differ`));
  expect(textOf(only(byAttr(controls, 'data-testimonials-pause'), `${route}: pause button missing`)) === 'Pause rotation', `${route}: pause button label differs`);
  expect(textOf(only(byClass(reviews, 'source-testimonials-logos-title'), `${route}: logo caption missing`)) === LOGOS_TITLE, `${route}: logo caption differs`);
  const logos = byClass(only(byAttr(reviews, 'data-testimonials-logos'), `${route}: logo list missing`), 'source-testimonials-logo');
  expect(logos.length === partnerLogos.length, `${route}: logo count differs from the projection`);
  logos.forEach((logo, index) => {
    const image = only(byName(logo, 'img'), `${route}: logo ${index} image missing`);
    expect(hasAttr(image, 'alt') && attr(image, 'width') === LOGO_WIDTH && attr(image, 'height') === LOGO_HEIGHT && attr(image, 'loading') === 'lazy' && attr(image, 'decoding') === 'async' && hasAttr(image, 'data-testimonials-logo'), `${route}: logo ${index} attributes differ from the LogoCarousel rules`);
    const src = decodeEntities(attr(image, 'src') ?? '');
    expect(src && (src.startsWith('https://') || (src.startsWith('/') && !src.startsWith('//'))) && typeof attr(image, 'srcset') === 'string', `${route}: logo ${index} source is not a safe https URL or site-local path with a srcset`);
    const rendered = expectedLogoImage(partnerLogos[index]);
    expect(src === rendered.src, `${route}: logo ${index} src differs from the SmartImage formula over the projection`);
    expect(decodeEntities(attr(image, 'srcset')) === rendered.srcset, `${route}: logo ${index} srcset differs from the LogoCarousel 1x/2x formula over the projection`);
    expect(decodeEntities(attr(image, 'alt')) === rendered.alt, `${route}: logo ${index} alt differs from the projection`);
  });
  const fixtureCarriers = byAttr(document, TESTIMONIALS_FIXTURE_ATTRIBUTE);
  if (fixtureMode) expect(fixtureCarriers.length === 1 && fixtureCarriers[0] === reviews && attr(reviews, TESTIMONIALS_FIXTURE_ATTRIBUTE) === 'true', `${route}: fixture build must mark the testimonials section with ${TESTIMONIALS_FIXTURE_ATTRIBUTE}="true" and nothing else`);
  else expect(!fixtureCarriers.length && !/synthetic fixture/i.test(textOf(reviews)), `${route}: default build carries synthetic fixture testimonials`);
  return reviews;
}

// --- Shared contact block (default disabled preview mode) -----------------------------
// Exact SourceContact contract: hooks, heading, disabled form, the lead
// paragraph, the trust sentence (its decorative checkmark must be aria-hidden),
// the onboarding link target and label (its decorative arrow must be
// aria-hidden), and the three label/link pairs in order, each label paired
// with its own href and value rather than merely present somewhere in the
// section. Failures name the route and method index only.
export function checkSourceContact(route, document, main, html) {
  const contact = only(byClass(main, 'source-contact'), `${route}: expected one contact section inside main`);
  expect(attr(contact, 'id') === 'contact' && attr(contact, 'aria-labelledby') === 'source-contact-heading', `${route}: contact section hooks differ`);
  expect(textOf(only(find(contact, node => attr(node, 'id') === 'source-contact-heading'), `${route}: contact heading missing`)) === CONTACT_HEADING, `${route}: contact heading differs`);
  expect(byAttr(contact, 'data-contact-disabled').length === 1 && !byAttr(document, 'data-contact-form').length && !byAttr(document, 'data-contact-root').length && !html.includes('/api/send-email'), `${route}: contact form is not in the default disabled preview mode`);
  const contactHrefs = byName(contact, 'a').map(link => attr(link, 'href'));
  for (const href of [PHONE_HREF, EMAIL_HREF, CONTACT_HREF, ONBOARDING_HREF]) expect(contactHrefs.includes(href), `${route}: contact section is missing the ${href.split(':')[0]} link`);
  const contactText = textOf(contact);
  for (const label of ['Call The Batphone', 'Email HQ', 'Face-to-Face', '01584 517 234', 'hello@fresh-tech.uk', 'Book an Intro Call with Sam']) expect(contactText.includes(label), `${route}: contact section is missing a source label`);
  expect(!/assets\.calendly\.com|calendly-inline-widget/i.test(html), `${route}: an eager scheduling embed leaked into the route`);

  const lead = only(byClass(contact, 'source-contact-lead'), `${route}: contact lead paragraph missing`);
  expect(textOf(lead) === CONTACT_LEAD, `${route}: contact lead paragraph differs from the source`);
  const trust = only(byClass(contact, 'source-contact-trust'), `${route}: contact trust sentence missing`);
  expect(accessibleTextOf(trust) === CONTACT_TRUST, `${route}: contact trust sentence differs from the source (decorative marks must be aria-hidden)`);
  const onboarding = only(byName(only(byClass(contact, 'source-contact-switch'), `${route}: onboarding line missing`), 'a'), `${route}: onboarding line must carry exactly one link`);
  expect(attr(onboarding, 'href') === ONBOARDING_HREF, `${route}: onboarding link target differs from the source`);
  expect(accessibleTextOf(onboarding) === ONBOARDING_LABEL, `${route}: onboarding link label differs from the source (decorative marks must be aria-hidden)`);
  const methods = byClass(only(byClass(contact, 'source-contact-list'), `${route}: contact method list missing`), 'source-contact-item');
  expect(methods.length === CONTACT_METHODS.length, `${route}: contact method count differs from the source`);
  CONTACT_METHODS.forEach(([label, href, value], index) => {
    const method = methods[index];
    expect(textOf(only(byClass(method, 'source-contact-label'), `${route}: contact method ${index} label missing`)) === label, `${route}: contact method ${index} label differs from the source`);
    const link = only(byName(method, 'a'), `${route}: contact method ${index} must carry exactly one link`);
    expect(attr(link, 'href') === href, `${route}: contact method ${index} link target differs from the source`);
    expect(textOf(link) === value, `${route}: contact method ${index} link value differs from the source`);
  });
  return contact;
}

// --- Body family marker ---------------------------------------------------------------
// The layout stamps data-page-family="problems" on <body> for problem-owned
// pages only. Ownership is the data-problem-page <main> marker (mainMarker),
// never a route prefix, so this runs over every emitted page: a problem page
// must have exactly one body carrying the value, and any other family's page
// must not carry it on any body (a default-layout regression that stamps
// every page fails on the first unrelated route).
const BODY_FAMILY_ATTRIBUTE = 'data-page-family';
const PROBLEM_FAMILY = 'problems';
export function checkBodyFamilyMarker(route, html) {
  const owned = mainMarker(html) !== null;
  const bodies = byName(parse(html), 'body');
  const carriers = bodies.filter(body => attr(body, BODY_FAMILY_ATTRIBUTE) === PROBLEM_FAMILY);
  if (owned) expect(bodies.length === 1 && carriers.length === 1, `${route}: problem page must have exactly one body with ${BODY_FAMILY_ATTRIBUTE}="${PROBLEM_FAMILY}"`);
  else expect(carriers.length === 0, `${route}: non-problem page carries ${BODY_FAMILY_ATTRIBUTE}="${PROBLEM_FAMILY}" on its body`);
  return owned;
}

// --- Head -------------------------------------------------------------------------
function readHead(document) {
  const titles = byName(document, 'title');
  const canonicals = byName(document, 'link').filter(link => (attr(link, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical')).map(link => decodeEntities(attr(link, 'href') ?? ''));
  const metadata = {};
  for (const meta of byName(document, 'meta')) {
    const key = attr(meta, 'name') ?? attr(meta, 'property');
    const content = attr(meta, 'content');
    if (key && typeof content === 'string') metadata[key] = decodeEntities(content);
  }
  const scripts = byName(document, 'script').filter(script => attr(script, 'id') === 'json-ld-schema' && (attr(script, 'type') ?? '').toLowerCase() === 'application/ld+json');
  return { title: titles.length === 1 ? textOf(titles[0]) : null, canonicals, metadata, schemas: scripts.length === 1 ? JSON.parse(rawText(scripts[0])) : null };
}
const firstSchemaDifference = (built, expected) => {
  if (!Array.isArray(built)) return 'not an array';
  if (built.length !== expected.length) return `count ${built.length} (expected ${expected.length})`;
  const index = expected.findIndex((schema, position) => JSON.stringify(built[position]) !== JSON.stringify(schema));
  return index === -1 ? null : `index ${index} (${expected[index]['@type']})`;
};

// --- Command line ---------------------------------------------------------------
// args: process.argv.slice(2); fixtureEnv: the raw TESTIMONIALS_FIXTURE value.
// The environment value is resolved unconditionally, before it is combined
// with the flag, so an invalid value fails even when the flag is present.
export function parseCheckerArgs(args, fixtureEnv) {
  const flags = args.filter(arg => arg.startsWith('--'));
  const positional = args.filter(arg => !arg.startsWith('--'));
  for (const flag of flags) if (flag !== FIXTURE_FLAG) fail(`Unknown option ${flag}. Usage: node scripts/problem-output-check.mjs [dist-dir] [${FIXTURE_FLAG}]`);
  if (positional.length > 1) fail('At most one dist directory may be given');
  const envMode = resolveTestimonialsFixtureMode(fixtureEnv);
  const fixtureMode = flags.includes(FIXTURE_FLAG) || envMode === FIXTURE_MODE;
  return { distDir: positional[0] ?? 'dist', fixtureMode };
}

async function main() {
  const parsed = parseCheckerArgs(process.argv.slice(2), process.env[TESTIMONIALS_FIXTURE_ENV]);
  const { fixtureMode } = parsed;
  const distDir = resolve(parsed.distDir);
  const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const repoDir = resolve(projectDir, '..', '..');

  // --- Source projection at run time (never the generated module) -----------------
  const contentSource = await readFile(resolve(repoDir, 'data', 'content.ts'), 'utf8');
  const problems = readProblems('data/content.ts', contentSource);
  const problemSlugs = problems.map(page => page.slug);
  expect(problems.length > 0 && new Set(problemSlugs).size === problemSlugs.length, 'problemPages projection is empty or repeats a slug');

  // Shared testimonials: the synthetic fixture in fixture mode, otherwise the
  // fail-closed source projection. Either way every value is compared exactly
  // by checkTestimonials; the records are held for comparison only and are
  // never printed (only their counts appear in the summary line).
  const reviewSource = fixtureMode ? syntheticTestimonialData() : readTestimonialData('data/content.ts', contentSource);
  const shape = { reviews: reviewSource.testimonials.length, tabs: Object.keys(reviewSource.testimonialCategories).length, logos: reviewSource.partnerLogos.length };
  expect(shape.reviews > 0 && shape.logos > 0 && Object.hasOwn(reviewSource.testimonialCategories, ALL_CATEGORY), 'testimonial projection has no reviews, no logos or no "all" tab');

  // Organization: the site-wide object retained from the React head fixture.
  const retained = await loadRetainedReactHead();
  const organization = retained.schemas[2];
  expect(organization?.['@type'] === 'Organization' && organization['@id'] === `${BASE_URL}/#organization`, 'retained fixture no longer holds the Organization object at index 2');

  // --- Inventory: every emitted dist/**/index.html, owned by the <main> marker --------
  const builtPages = [];
  for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name !== 'index.html') continue;
    const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
    builtPages.push({ route, html: await readFile(resolve(entry.parentPath, entry.name), 'utf8') });
  }
  expect(builtPages.length > 0, `no built index.html pages found under ${distDir}; run the build first`);
  // Body family marker on every emitted page, owned or not, before the
  // inventory narrows to the family: a leaked marker on another family fails here.
  for (const { route, html } of builtPages) checkBodyFamilyMarker(route || '/', html);
  const inventory = problemInventory(builtPages, problemSlugs);
  expect(inventoryIsClean(inventory), `Built problem inventory differs. Missing: [${inventory.missing.join(', ')}]. Unexpected: [${inventory.unexpected.join(', ')}]. Marker/route mismatch: [${inventory.mismatched.join(', ')}]. Invalid (empty) marker: [${inventory.invalid.join(', ')}]. Duplicate markers: [${inventory.duplicated.join(', ')}]. Multiple <main>: [${inventory.multipleMain.join(', ')}]. Marker outside <main>: [${inventory.stray.join(', ')}]`);

  // --- Routes -------------------------------------------------------------------------
  const oversized = [];
  let emergencyRoutes = 0;
  for (const page of problems) {
    const route = `/${page.slug}`;
    const canonical = `${BASE_URL}/${page.slug}`;
    const html = builtPages.find(built => built.route === page.slug).html;
    const document = parse(html);
    const gzip = gzipSync(Buffer.from(html, 'utf8')).length;
    if (gzip > HTML_GZIP_BUDGET) oversized.push(`${route} (${gzip} gzip bytes)`);
    const emergency = page.slug === EMERGENCY_SLUG;
    const variant = emergency ? 'emergency' : 'standard';
    if (emergency) emergencyRoutes++;

    // Framework, document and template markers.
    const main = only(byName(document, 'main'), `${route}: expected exactly one main element`);
    expect(attr(main, 'id') === 'main-content' && attr(main, 'tabindex') === '-1' && attr(main, PROBLEM_MARKER) === page.slug && attr(main, 'data-variant') === variant, `${route}: main landmark id, tabindex, marker or variant differs from the template`);
    expect(attr(only(byName(document, 'html'), `${route}: expected one html element`), 'lang') === 'en-GB', `${route}: html lang is not en-GB`);
    expect(!byName(document, 'astro-island').length && !/\bdata-reactroot\b/i.test(html), `${route}: contains framework hydration markup`);
    const body = only(byName(document, 'body'), `${route}: expected one body element`);
    expect(!textOf(body).includes('—'), `${route}: visible text contains an em dash`);
    for (const anchor of byName(document, 'a')) expect(!/^\s*(?:javascript|data|vbscript):/i.test(decodeEntities(attr(anchor, 'href') ?? '')), `${route}: unsafe link scheme emitted`);

    // Common chrome: banner, skip link, one site header and footer outside main, consent.
    const insideMain = new Set();
    walk(main, node => insideMain.add(node));
    const siteHeaders = byName(document, 'header').filter(node => !insideMain.has(node));
    const siteFooters = byName(document, 'footer').filter(node => !insideMain.has(node));
    expect(siteHeaders.length === 1 && siteFooters.length === 1, `${route}: expected exactly one site header and footer outside main`);
    expect(!find(siteHeaders[0], node => attr(node, 'aria-current') === 'page').length, `${route}: a navigation item is marked current on a root-slug route`);
    const skip = only(byClass(document, 'skip-link'), `${route}: expected one skip link`);
    expect(attr(skip, 'href') === '#main-content' && textOf(skip) === 'Skip to main content', `${route}: skip link target or label differs`);
    expect(textOf(only(byClass(document, 'prototype-banner'), `${route}: expected one prototype banner`)) === 'HTML-first complete-route comparison. Local prototype only.', `${route}: prototype banner copy differs`);
    const consentBanner = only(byAttr(document, 'data-cookie-banner'), `${route}: expected one cookie banner`);
    expect(hasAttr(consentBanner, 'hidden') && attr(consentBanner, 'role') === 'dialog' && byAttr(document, 'data-cookie-dialog').length === 1, `${route}: consent banner or settings dialog differs from the shared component`);
    const inlineScripts = byName(document, 'script').filter(script => !attr(script, 'src') && ['', 'module', 'text/javascript', 'application/javascript'].includes((attr(script, 'type') ?? '').trim().toLowerCase()));
    expect(!inlineScripts.some(script => /googletagmanager\.com|google-analytics\.com|clarity\.ms/i.test(rawText(script))), `${route}: eager inline analytics present before consent`);

    // Hero: breadcrumb, H1, intro, calls to action.
    const hero = only(byClass(main, 'pb-hero'), `${route}: expected one hero section`);
    expect(attr(hero, 'data-variant') === variant, `${route}: hero variant differs from the emergency rule`);
    const crumbNav = only(byClass(hero, 'pb-breadcrumbs'), `${route}: breadcrumb missing`);
    expect(attr(crumbNav, 'aria-label') === 'Breadcrumb', `${route}: breadcrumb nav is not labelled`);
    const crumbs = byName(crumbNav, 'li');
    expect(crumbs.length === 3, `${route}: breadcrumb item count differs from Home > Resources > h1`);
    [['/', 'Home'], ['/resources', 'Resources']].forEach(([href, label], index) => {
      const link = only(byName(crumbs[index], 'a'), `${route}: breadcrumb ${index} link missing`);
      expect(attr(link, 'href') === href && textOf(link) === label, `${route}: breadcrumb ${index} differs from the source items`);
    });
    const current = only(byName(crumbs[2], 'span'), `${route}: current breadcrumb missing`);
    expect(attr(current, 'aria-current') === 'page' && !byName(crumbs[2], 'a').length && textOf(current) === normalise(page.h1), `${route}: current breadcrumb is not the unlinked h1`);
    const h1s = byName(document, 'h1');
    expect(h1s.length === 1 && insideMain.has(h1s[0]) && textOf(h1s[0]) === normalise(page.h1), `${route}: H1 is not the single source h1 inside main`);
    expect(textOf(only(byClass(hero, 'pb-hero-copy'), `${route}: intro missing`)) === normalise(page.intro), `${route}: intro differs from the source`);

    const checkActions = (container, label, closing) => {
      const actions = only(byClass(container, 'pb-actions'), `${route}: ${label} actions missing`);
      const links = byName(actions, 'a');
      if (emergency) {
        expect(links.length === 1, `${route}: ${label} must carry exactly one emergency call action`);
        expect(attr(links[0], 'href') === PHONE_HREF && textOf(links[0]) === CALL_NOW_LABEL && hasClass(links[0], 'pb-button-emergency') && decorativeSvgs(links[0]).length === 1, `${route}: ${label} emergency call action differs from the React page`);
        expect(!byName(container, 'a').some(link => [CONTACT_HREF, PRICING_HREF].includes(attr(link, 'href'))), `${route}: ${label} offers contact or pricing on the emergency variant`);
      } else {
        expect(links.length === 2, `${route}: ${label} must carry the contact action plus one secondary action`);
        expect(attr(links[0], 'href') === CONTACT_HREF && textOf(links[0]) === normalise(page.cta) && hasClass(links[0], 'pb-button-primary'), `${route}: ${label} primary action is not the source cta linking to /contact`);
        if (closing) expect(attr(links[1], 'href') === PRICING_HREF && textOf(links[1]) === PRICING_LABEL && hasClass(links[1], 'pb-button-secondary') && decorativeSvgs(links[1]).length === 1, `${route}: ${label} secondary action is not the pricing link`);
        else expect(attr(links[1], 'href') === PHONE_HREF && textOf(links[1]) === HERO_CALL_LABEL && hasClass(links[1], 'pb-button-secondary'), `${route}: ${label} secondary action is not the phone link`);
      }
    };
    checkActions(hero, 'hero', false);

    // Section headings from the React copy.
    const section = name => only(byClass(main, `pb-${name}`), `${route}: expected one ${name} section`);
    const checkHeading = (container, name) => {
      const header = only(byClass(container, 'pb-section-heading'), `${route}: ${name} section heading missing`);
      const [h2, lead] = SECTION_COPY[name];
      expect(textOf(only(byName(header, 'h2'), `${route}: ${name} h2 missing`)) === h2 && textOf(only(byName(header, 'p'), `${route}: ${name} lead missing`)) === lead, `${route}: ${name} section heading differs from the React copy`);
    };

    // Symptoms.
    const symptoms = section('symptoms');
    checkHeading(symptoms, 'symptoms');
    const symptomItems = byName(only(byClass(symptoms, 'pb-symptom-list'), `${route}: symptom list missing`), 'li');
    expect(symptomItems.length === page.symptoms.length, `${route}: symptoms count differs from the source`);
    symptomItems.forEach((item, index) => {
      expect(decorativeSvgs(item).length === 1 && byName(item, 'svg').length === 1, `${route}: symptoms[${index}] icon is not a single decorative SVG`);
      expect(textOf(only(byName(item, 'span'), `${route}: symptoms[${index}] text span missing`)) === normalise(page.symptoms[index]), `${route}: symptoms[${index}] differs from the source`);
    });

    // Cause and solution cards.
    const checkCards = (name, grid, records) => {
      const cards = byClass(only(byClass(section(name), grid), `${route}: ${name} grid missing`), 'pb-card');
      expect(cards.length === records.length, `${route}: ${name} card count differs from the source`);
      cards.forEach((card, index) => {
        expect(tagName(card) === 'article', `${route}: ${name}[${index}] is not an article`);
        const icon = only(byClass(card, 'pb-card-icon'), `${route}: ${name}[${index}] icon wrapper missing`);
        expect(decorativeSvgs(icon).length === 1 && byName(card, 'svg').length === 1, `${route}: ${name}[${index}] icon is not a single decorative SVG`);
        expect(textOf(only(byName(card, 'h3'), `${route}: ${name}[${index}] title missing`)) === normalise(records[index].title), `${route}: ${name}[${index}].title differs from the source`);
        expect(textOf(only(byName(card, 'p'), `${route}: ${name}[${index}] description missing`)) === normalise(records[index].desc), `${route}: ${name}[${index}].desc differs from the source`);
      });
    };
    checkHeading(section('causes'), 'causes');
    checkCards('causes', 'pb-cause-grid', page.causes);
    checkHeading(section('solutions'), 'solutions');
    checkCards('solutions', 'pb-solution-grid', page.solutions);

    // RichText content card and FAQs.
    expect(byClass(main, 'pb-rich').length === 1 + page.faqs.length, `${route}: expected one content block and ${page.faqs.length} FAQ answer blocks`);
    const contentBlock = only(byClass(section('content'), 'pb-rich'), `${route}: content block missing`);
    expect(!hasClass(contentBlock, 'pb-faq-answer') && only(byClass(section('content'), 'pb-content-card'), `${route}: content card missing`), `${route}: content block is not the content card`);
    checkRichBlock(route, 'content', contentBlock, page.content);
    const faqSection = section('faqs');
    checkHeading(faqSection, 'faqs');
    const details = byName(faqSection, 'details');
    expect(details.length === page.faqs.length, `${route}: FAQ count differs from the source`);
    details.forEach((item, index) => {
      expect(attr(item, 'name') === 'problem-faq' && !hasAttr(item, 'open'), `${route}: faqs[${index}] is not a closed disclosure sharing the FAQ group name`);
      const summary = only(byName(item, 'summary'), `${route}: faqs[${index}] summary missing`);
      expect(textOf(only(byName(summary, 'span'), `${route}: faqs[${index}] question span missing`)) === normalise(page.faqs[index].q), `${route}: faqs[${index}].q differs from the source`);
      const chevrons = decorativeSvgs(summary);
      expect(chevrons.length === 2 && hasClass(chevrons[0], 'pb-chevron-down') && hasClass(chevrons[1], 'pb-chevron-up'), `${route}: faqs[${index}] summary lacks the two decorative chevrons`);
      const answer = only(byClass(item, 'pb-faq-answer'), `${route}: faqs[${index}] answer block missing`);
      expect(hasClass(answer, 'pb-rich'), `${route}: faqs[${index}] answer is not a RichText block`);
      checkRichBlock(route, `faqs[${index}].a`, answer, page.faqs[index].a);
    });

    // Closing call to action.
    const final = section('final');
    expect(attr(final, 'data-variant') === variant, `${route}: closing band variant differs from the emergency rule`);
    expect(textOf(only(byName(final, 'h2'), `${route}: closing heading missing`)) === SECTION_COPY.final[0] && textOf(only(byClass(final, 'pb-final-copy'), `${route}: closing copy missing`)) === SECTION_COPY.final[1], `${route}: closing copy differs from the React page`);
    checkActions(final, 'closing', true);

    // Shared testimonials block: exact values from the source projection or
    // the synthetic fixture, whichever this run was asked to verify.
    checkTestimonials(route, document, main, reviewSource, fixtureMode);

    // Shared contact block in its default disabled preview mode.
    checkSourceContact(route, document, main, html);

    // Head: SEO component formula with the page's explicit schema array.
    const head = readHead(document);
    const title = siteTitle(page.title);
    expect(head.title === normalise(title), `${route}: title differs from the React head formula`);
    expect(head.canonicals.length === 1 && head.canonicals[0] === canonical, `${route}: canonical differs from ${canonical}`);
    const expectedMetadata = { ...STATIC_METADATA, description: page.metaDesc, 'og:title': title, 'twitter:title': title, 'og:description': page.metaDesc, 'twitter:description': page.metaDesc, 'og:url': canonical };
    for (const [key, value] of Object.entries(expectedMetadata)) expect(head.metadata[key] === value, `${route}: metadata ${key} differs from the React head formula`);
    expect(!head.metadata.description.includes('—') && !title.includes('—'), `${route}: title or description contains an em dash`);
    const expectedSchemas = [
      {
        '@context': 'https://schema.org', '@type': 'Article', headline: page.h1, description: page.metaDesc,
        datePublished: ARTICLE_DATE_PUBLISHED, dateModified: ARTICLE_DATE_MODIFIED,
        author: { '@type': 'Organization', name: 'Fresh Tech IT Support', '@id': `${BASE_URL}/#organization`, url: BASE_URL },
        publisher: { '@type': 'Organization', name: 'Fresh Tech IT Support', logo: { '@type': 'ImageObject', url: LOGO_URL } },
        inLanguage: 'en-GB', isAccessibleForFree: true,
      },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(faq.a) } })) },
      organization,
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` }, { '@type': 'ListItem', position: 2, name: prettify(page.slug), item: canonical }] },
    ];
    const schemaDifference = firstSchemaDifference(head.schemas, expectedSchemas);
    expect(schemaDifference === null, `${route}: JSON-LD differs from the React Article, FAQPage, Organization and breadcrumb graph at ${schemaDifference}`);
  }

  console.log(`${problems.length} root-slug problem routes verified (${problemSlugs.join(', ')}): ${assertions} inventory, chrome, content, RichText, call-to-action, shared-section, head and framework assertions passed; ${emergencyRoutes} emergency route(s); testimonials and logos compared exactly against the ${fixtureMode ? 'synthetic fixture' : 'run-time source projection'} (${shape.reviews} reviews, ${shape.tabs} tabs, ${shape.logos} logos); SourceContact contract verified`);
  if (oversized.length) console.warn(`Warning: ${oversized.length} route(s) exceed the ${HTML_GZIP_BUDGET}-byte gzip HTML budget enforced by check-emitted-html-quality (budget not raised):\n  ${oversized.join('\n  ')}`);
}

// Only the entry point runs the check; importing this module (for its tests)
// never reads the source projection, the retained fixture or a dist directory.
// process.argv[1] is undefined under `node -e`/`--eval`, so it is guarded.
const entryPoint = process.argv[1];
if (typeof entryPoint === 'string' && import.meta.url === pathToFileURL(entryPoint).href) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
