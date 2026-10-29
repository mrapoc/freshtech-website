import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { technologyDirectory, technologyListing, techExplainers, techSlugs, unlistedSlugs } from '../src/generated/technology-data.mjs';
import { decodeEntities, normalise, renderedText } from './lib/blog-rendered-text.mjs';
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';

// Focused checker for the emitted /technology family.
//
// Independence: nothing here imports the display helpers, the RichText
// tokeniser or the SEO helper the templates render from. Expectations come
// from three places only:
// - the generated data (src/generated/technology-data.mjs), the approved
//   source projection of data/content.ts and the two React pages;
// - fixed UI copy, CTA targets, schema constants and the head formula restated
//   below from pages/TechnologyLandingPage.tsx, pages/TechExplainerPage.tsx,
//   components/Contact.tsx and components/SEO.tsx, and re-verified at run time
//   as literals present in those React sources so a copy change upstream fails
//   here;
// - a small oracle of components/RichText.tsx block and inline semantics
//   (paragraph split, list detection, link/strong/em markers) used to derive
//   the decoded text and element counts a fragment must carry.
// Record content is compared, never printed. Text parity uses decoded DOM text
// (ultrahtml through scripts/lib/blog-rendered-text.mjs), so entity encoding
// and whitespace minification cannot cause false failures.
const projectDir = resolve(import.meta.dirname, '..');
const rootDir = resolve(projectDir, '..', '..');
const react = {
  landing: await readFile(resolve(rootDir, 'pages', 'TechnologyLandingPage.tsx'), 'utf8'),
  explainer: await readFile(resolve(rootDir, 'pages', 'TechExplainerPage.tsx'), 'utf8'),
  contact: await readFile(resolve(rootDir, 'components', 'Contact.tsx'), 'utf8'),
  seo: await readFile(resolve(rootDir, 'components', 'SEO.tsx'), 'utf8'),
};

const baseUrl = 'https://fresh-tech.uk';
const listingCanonical = `${baseUrl}/technology`;
// components/SEO.tsx constants (restated; verified against the source below).
const seoConstants = {
  longSuffix: ' | Fresh Tech IT Support', shortSuffix: ' | Fresh Tech', titleMax: 65,
  defaultImage: DEFAULT_SOCIAL_IMAGE,
  noIndexRobots: 'noindex, nofollow', siteName: 'Fresh Tech IT Support', locale: 'en_GB', twitterCard: 'summary_large_image', twitterHandle: '@fresh_tech_',
  organizationId: `${baseUrl}/#organization`, localBusinessId: `${baseUrl}/#localbusiness`,
  legalName: 'Fresh PCS Consultancy Ltd', companiesHouse: '09296207', email: 'hello@fresh-tech.uk', telephone: '+441584517234', postalCode: 'SY8 1HN',
  publisherLogo: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png',
};
// pages/TechnologyLandingPage.tsx: <SEO>, <PageHeader> and section copy.
const listingCopy = {
  rawTitle: 'Technology Explained | Fresh Tech',
  description: 'Plain-English guides to the technology that protects your business. No jargon, no sales pitch - just clear explanations of what these tools do and why they matter.',
  highlight: 'Knowledge Base', title: 'Technology Explained',
  introHeading: 'Why We Created This',
  intro: "IT is full of acronyms and technical terms. We believe you deserve to understand what you're paying for - and why it matters to your business. These guides explain each technology in plain English, focusing on business benefits and real-world risks.",
  topicsHeading: 'All Topics', topicsSub: 'Click any topic to learn more', readGuide: 'Read Guide',
  ctaHeading: "Have a question we haven't answered?", ctaBody: "We're always happy to explain technology in plain English. Get in touch.",
  ctaPrimary: { label: 'Ask a Question', href: '/contact' }, ctaSecondary: { label: 'Resource Centre', href: '/resources' },
};
// pages/TechExplainerPage.tsx: breadcrumb, hero, section headings, CTAs, schema constants.
const explainerCopy = {
  breadcrumbListing: 'Technology Explained', eyebrow: 'Technology Explained',
  heroPrimary: { label: 'Talk to an Expert', href: '/contact' }, heroPhone: { label: 'Call 01584 517 234', href: 'tel:01584517234' },
  whatHeading: 'What is it?', benefitsHeading: 'Business Benefits', risksHeading: 'Risks Without It', howHeading: 'How Fresh Tech Implements This',
  faqHeading: 'Frequently Asked Questions', relatedHeading: 'Related Services', moreHeading: 'More Technology Explained', moreSub: 'Explore our other jargon-free technology guides',
  ctaHeading: 'Ready to protect your business?', ctaBody: "Let's talk about how we can implement these technologies for your organisation.",
  ctaPrimary: { label: 'Get in Touch', href: '/contact' }, ctaSecondary: { label: 'View All Services', href: '/services' },
  datePublished: '2025-06-01T00:00:00+00:00', dateModified: '2026-03-04T00:00:00+00:00',
};
// components/Contact.tsx: the shared <Contact /> section both React pages end
// with. Only the informational side is required here (heading, prose, trust
// sentence, onboarding link, tel and email links and their labels). The form
// and the Calendly modal are disabled separately in the preview (approved
// ContactForm disabled notice; booking redirects to /contact), so no enabled
// field controls are required. The section markup is owned by the root
// SourceContact.astro component and is located by id="contact" only, never by
// a class name. The source trust line starts with a "✓" glyph; the sentence is
// what is asserted, not the glyph.
const contactCopy = {
  heading: 'Signal for Help',
  intro: 'Ready to banish tech headaches? Fill out the form or book a chat directly. Tell us what you need help with and how best to reach you.',
  trust: 'Trusted by local businesses for over 10 years',
  onboarding: { label: 'Thinking of switching providers? See how easy it is', href: '/onboarding' },
  phoneLabel: 'Call The Batphone', phone: '01584 517 234', phoneHref: 'tel:01584517234',
  emailLabel: 'Email HQ', email: 'hello@fresh-tech.uk', emailHref: 'mailto:hello@fresh-tech.uk',
  bookingLabel: 'Face-to-Face', booking: 'Book an Intro Call with Sam',
};
// `Common questions about {data.h1.toLowerCase()}` in the React FAQ section.
const faqSubheading = h1 => `Common questions about ${h1.toLowerCase()}`;
// Breadcrumbs.tsx is not read here; the React breadcrumb component always
// prefixes Home. The listing breadcrumb name comes from the SEO.tsx fallback.
const breadcrumbHome = 'Home';
const listingBreadcrumbName = 'Technology';

const textOf = renderedText;
const unescape = decodeEntities;
const escapeAttr = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fail = message => { throw new Error(message); };
let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) fail(message); };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const count = (html, pattern) => (html.match(pattern) || []).length;
// Section slices by class; the technology templates never nest <section>.
const section = (html, className) => html.match(new RegExp(`<section[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1] ?? null;
// The prose wrappers only ever contain p/ul/ol/li/br/strong/em/a, never a div.
const prose = html => html.match(/<div class="tech-prose(?: [^"]*)?">([\s\S]*?)<\/div>/)?.[1] ?? null;
const mainOf = html => html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
// H2 headings of the technology-owned sections only. The shared contact
// section carries its own H2 and is checked separately, so it must not join
// the template heading order.
const techHeadings = main => (main.match(/<section[^>]*class="[^"]*\btech-section\b[^"]*"[^>]*>[\s\S]*?<\/section>/g) || [])
  .flatMap(block => [...block.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map(match => textOf(match[1])));
// The shared contact section is the last child of <main>; slicing to </main>
// tolerates whatever nesting the root component uses.
const contactOf = main => { const start = main.search(/<section[^>]*\bid="contact"[^>]*>/); return start === -1 ? null : main.slice(start, main.lastIndexOf('</main>')); };

// --- Restated constants must still be literals in the React sources ------------
// JSX text collapses runs of whitespace, so both sides are normalised; TS string
// escapes for apostrophes are unescaped before comparison.
const sourceHas = (source, literal) => normalise(source.replaceAll("\\'", "'")).includes(normalise(literal));
const requireLiterals = (label, source, literals) => {
  for (const literal of literals) expect(sourceHas(source, literal), `${label} no longer contains the restated literal: ${literal}`);
};
requireLiterals('pages/TechnologyLandingPage.tsx', react.landing, [
  `title="${listingCopy.rawTitle}"`, `description="${listingCopy.description}"`, `canonical="${listingCanonical}"`,
  `title="${listingCopy.title}"`, `highlightText="${listingCopy.highlight}"`, listingCopy.introHeading, listingCopy.intro, listingCopy.topicsHeading, listingCopy.topicsSub,
  listingCopy.readGuide, listingCopy.ctaHeading, listingCopy.ctaBody, listingCopy.ctaPrimary.label, `to="${listingCopy.ctaPrimary.href}"`, listingCopy.ctaSecondary.label, `to="${listingCopy.ctaSecondary.href}"`,
  'if (categoryPages.length === 0) return null',
]);
requireLiterals('pages/TechExplainerPage.tsx', react.explainer, [
  "label: 'Technology Explained', href: '/technology'", `<span className="text-accent font-medium">${explainerCopy.eyebrow}</span>`,
  explainerCopy.heroPrimary.label, `href="${explainerCopy.heroPhone.href}"`, explainerCopy.heroPhone.label,
  explainerCopy.whatHeading, explainerCopy.benefitsHeading, explainerCopy.risksHeading, explainerCopy.howHeading, explainerCopy.faqHeading,
  'Common questions about {data.h1.toLowerCase()}', explainerCopy.relatedHeading, explainerCopy.moreHeading, explainerCopy.moreSub,
  explainerCopy.ctaHeading, explainerCopy.ctaBody, explainerCopy.ctaPrimary.label, explainerCopy.ctaSecondary.label, `to="${explainerCopy.ctaSecondary.href}"`,
  `"datePublished": "${explainerCopy.datePublished}"`, `"dateModified": "${explainerCopy.dateModified}"`, `"url": "${seoConstants.publisherLogo}"`,
  '"inLanguage": "en-GB"', '"isAccessibleForFree": true', "faq.a.replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')",
  '.filter(page => page.slug !== slug)', '.filter(Boolean)', 'schema={[articleSchema, faqSchema]}', 'canonical={`https://fresh-tech.uk/technology/${slug}`}',
]);
requireLiterals('components/Contact.tsx', react.contact, [
  // The retained React reference still carries the retired timing claim. The
  // native contact copy above is deliberately checked separately in every page.
  'id="contact"', contactCopy.heading, 'Ready to banish tech headaches? Fill out the form or book a chat directly. We respond faster than a speeding bullet (usually under 15 minutes).', `✓ ${contactCopy.trust}`, contactCopy.onboarding.label, `to="${contactCopy.onboarding.href}"`,
  'href={`tel:${contactDetails.phone.replace(/\\s/g, \'\')}`}', contactCopy.phoneLabel, contactCopy.emailLabel, `label="${contactCopy.email}"`, contactCopy.bookingLabel, contactCopy.booking, '<ContactForm />',
]);
requireLiterals('components/SEO.tsx', react.seo, [
  `const longSuffix = '${seoConstants.longSuffix}'`, `const shortSuffix = '${seoConstants.shortSuffix}'`, `const TITLE_MAX = ${seoConstants.titleMax}`,
  `image = "${seoConstants.defaultImage}"`, `"${seoConstants.noIndexRobots}"`, `'og:site_name', '${seoConstants.siteName}'`, `'og:locale', '${seoConstants.locale}'`,
  `'twitter:card', '${seoConstants.twitterCard}'`, `'twitter:site', '${seoConstants.twitterHandle}'`, `'twitter:creator', '${seoConstants.twitterHandle}'`,
  "const ORG_ID = `${baseUrl}/#organization`", "const LOCAL_BUSINESS_ID = `${baseUrl}/#localbusiness`", `"legalName": "${seoConstants.legalName}"`,
  `"value": "${seoConstants.companiesHouse}"`, `"email": "${seoConstants.email}"`, `"telephone": "${seoConstants.telephone}"`, `"postalCode": "${seoConstants.postalCode}"`,
  "'': 'Home'", '.map(w => w.charAt(0).toUpperCase() + w.slice(1))', '} else if (type === \'website\') {', 'schemasToInject.push(localBusinessSchema);',
]);
// "technology" and the explainer slugs must fall through to the title-case
// fallback; a new SEGMENT_NAMES entry would change the breadcrumb schema.
expect(!/^\s*'technology'\s*:/m.test(react.seo), 'components/SEO.tsx now maps the technology segment; the breadcrumb expectation must change');
for (const slug of techSlugs) expect(!new RegExp(`^\\s*'${escapeRegExp(slug)}'\\s*:`, 'm').test(react.seo), `components/SEO.tsx now maps the ${slug} segment; the breadcrumb expectation must change`);

// components/SEO.tsx head formula.
const siteTitle = rawTitle => {
  const long = `${rawTitle}${seoConstants.longSuffix}`;
  if (long.length <= seoConstants.titleMax) return long;
  const short = `${rawTitle}${seoConstants.shortSuffix}`;
  return short.length <= seoConstants.titleMax ? short : rawTitle;
};
const prettify = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const stripMarkdownLinks = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const staticMetadata = {
  robots: seoConstants.noIndexRobots,
  'og:image': seoConstants.defaultImage, 'twitter:image': seoConstants.defaultImage, 'og:type': 'website',
  'og:image:width': '1200', 'og:image:height': '630', 'og:site_name': seoConstants.siteName, 'og:locale': seoConstants.locale,
  'twitter:card': seoConstants.twitterCard, 'twitter:site': seoConstants.twitterHandle, 'twitter:creator': seoConstants.twitterHandle,
};

function readHead(html) {
  const title = unescape(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
  const canonicals = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)].map(match => unescape(match[1]));
  const metadata = {};
  for (const tag of html.match(/<meta\s+[^>]+>/gi) || []) {
    const key = tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content=(["'])(.*?)\1/i)?.[2];
    if (key && content !== undefined) metadata[key] = unescape(content);
  }
  const schemaText = html.match(/<script id="json-ld-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  return { title, canonicals, metadata, schemas: schemaText ? JSON.parse(schemaText) : null };
}

function checkHead(route, html, { rawTitle, description, canonical, schemas }) {
  const head = readHead(html);
  const title = siteTitle(rawTitle);
  expect(head.title === title, `${route}: title differs from the React head formula`);
  expect(head.canonicals.length === 1 && head.canonicals[0] === canonical, `${route}: canonical differs from ${canonical}`);
  const expected = { ...staticMetadata, description, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'og:url': canonical };
  for (const [key, value] of Object.entries(expected)) expect(head.metadata[key] === value, `${route}: metadata ${key} differs from the React head formula or the preview noindex default`);
  expect(same(head.schemas, schemas), `${route}: JSON-LD differs from the React SEO graph for this call`);
}

// Shared contact section (SourceContact.astro): informational parity with
// components/Contact.tsx inside the id="contact" section. Form controls are
// deliberately not required (disabled notice in the preview).
function checkContact(route, main) {
  const block = contactOf(main);
  expect(block !== null, `${route}: shared contact section (id="contact") missing from main`);
  if (block === null) return;
  const ctaStart = main.indexOf('class="tech-section tech-cta"');
  expect(ctaStart !== -1 && ctaStart < main.search(/<section[^>]*\bid="contact"[^>]*>/), `${route}: shared contact section must follow the closing CTA`);
  const text = textOf(block);
  expect([...block.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].some(match => textOf(match[1]) === contactCopy.heading), `${route}: contact section H2 is not "${contactCopy.heading}"`);
  for (const copy of [contactCopy.intro, contactCopy.trust, contactCopy.onboarding.label, contactCopy.phoneLabel, contactCopy.phone, contactCopy.emailLabel, contactCopy.email, contactCopy.bookingLabel, contactCopy.booking]) {
    expect(text.includes(normalise(copy)), `${route}: contact section is missing source copy: ${copy}`);
  }
  const link = (href, label) => [...block.matchAll(new RegExp(`<a\\s[^>]*href="${escapeRegExp(escapeAttr(href))}"[^>]*>([\\s\\S]*?)<\\/a>`, 'g'))].some(match => textOf(match[1]).includes(normalise(label)));
  expect(link(contactCopy.onboarding.href, contactCopy.onboarding.label), `${route}: contact onboarding link to ${contactCopy.onboarding.href} with its source label missing`);
  expect(link(contactCopy.phoneHref, contactCopy.phone), `${route}: contact telephone link ${contactCopy.phoneHref} with the source number missing`);
  expect(link(contactCopy.emailHref, contactCopy.email), `${route}: contact email link ${contactCopy.emailHref} with the source address missing`);
  expect(!/<a [^>]*target="_blank"(?![^>]*rel="noopener noreferrer")/.test(block), `${route}: contact section has an external link without rel="noopener noreferrer"`);
}

function checkFramework(route, html, marker) {
  expect(html.includes(marker) && html.includes('<main id="main-content"'), `${route}: missing template markers`);
  expect(!html.includes('data-reactroot') && !html.includes('<astro-island'), `${route}: contains framework hydration markup`);
  expect(!/href="\s*javascript:/i.test(html) && !/href="\s*data:/i.test(html) && !/href="\s*vbscript:/i.test(html), `${route}: unsafe link scheme emitted`);
}

// --- RichText oracle (components/RichText.tsx semantics) -------------------------
// Blocks: paragraphs split on blank lines; a paragraph is a bullet list when
// every non-empty line starts with "-" or "•", a numbered list when every
// non-empty line starts with digits and a full stop; otherwise a paragraph whose
// single newlines become <br>. Inline: [label](url) links are split out first
// (labels stay plain text), then **strong**, then *em* in the remaining text.
// Only text, counts and link targets are derived; no elements are emitted.
const LINK = /\[(.*?)\]\((.*?)\)/g;
const isBullet = line => line.trim().startsWith('-') || line.trim().startsWith('•');
const isNumbered = line => /^\d+\./.test(line.trim());
function richTextBlocks(text) {
  if (!text) return [];
  return text.split(/\n\n+/).map(paragraph => {
    const lines = paragraph.split('\n');
    if (lines.every(line => line.trim() === '' || isBullet(line)) && lines.some(isBullet)) return { type: 'ul', rows: lines.filter(isBullet).map(line => line.replace(/^[-•]\s*/, '')) };
    if (lines.every(line => line.trim() === '' || isNumbered(line)) && lines.some(isNumbered)) return { type: 'ol', rows: lines.filter(isNumbered).map(line => line.replace(/^\d+\.\s*/, '')) };
    return { type: 'p', rows: lines };
  });
}
function inlineOracle(row) {
  const parts = row.split(LINK);
  const result = { text: '', strong: 0, em: 0, links: [] };
  for (let index = 0; index < parts.length; index += 3) {
    for (const part of (parts[index] ?? '').split(/(\*\*[^*]+?\*\*)/g)) {
      if (part.startsWith('**') && part.endsWith('**')) { result.strong++; result.text += part.slice(2, -2); continue; }
      for (const piece of part.split(/(\*[^*]+?\*)/g)) {
        if (piece.startsWith('*') && piece.endsWith('*') && piece.length > 2) { result.em++; result.text += piece.slice(1, -1); } else result.text += piece;
      }
    }
    if (index + 2 < parts.length) { result.links.push({ label: parts[index + 1], href: parts[index + 2] }); result.text += parts[index + 1]; }
  }
  return result;
}
// React renders any [label](url) as a link (external when it starts with
// "http"). The native template only links http(s) or site-relative targets, so
// a source link outside that set is a parity gap and fails here.
const isLinkableHref = href => /^https?:\/\//.test(href) || (href.startsWith('/') && !href.startsWith('//'));

function checkRichText(route, label, fragment, source) {
  expect(fragment !== null, `${route}: ${label} prose wrapper missing`);
  if (fragment === null) return;
  const blocks = richTextBlocks(source);
  const rows = blocks.flatMap(block => block.rows.map(inlineOracle));
  expect(textOf(fragment) === normalise(rows.map(row => row.text).join(' ')), `${route}: ${label} rendered text differs from the source RichText body`);
  const paragraphs = blocks.filter(block => block.type === 'p');
  expect(count(fragment, /<p>/g) === paragraphs.length, `${route}: ${label} paragraph count differs from source`);
  expect(count(fragment, /<br\s*\/?>/g) === paragraphs.reduce((sum, block) => sum + block.rows.length - 1, 0), `${route}: ${label} line break count differs from source newlines`);
  expect(count(fragment, /<ul>/g) === blocks.filter(block => block.type === 'ul').length && count(fragment, /<ol>/g) === blocks.filter(block => block.type === 'ol').length, `${route}: ${label} list count differs from source`);
  expect(count(fragment, /<li>/g) === blocks.filter(block => block.type !== 'p').reduce((sum, block) => sum + block.rows.length, 0), `${route}: ${label} list item count differs from source`);
  expect(count(fragment, /<strong>/g) === rows.reduce((sum, row) => sum + row.strong, 0), `${route}: ${label} bold count differs from source`);
  expect(count(fragment, /<em>/g) === rows.reduce((sum, row) => sum + row.em, 0), `${route}: ${label} emphasis count differs from source`);
  const links = rows.flatMap(row => row.links);
  expect(count(fragment, /<a\s/g) === links.length, `${route}: ${label} link count differs from source`);
  for (const link of links) {
    expect(isLinkableHref(link.href), `${route}: ${label} source link target is neither http(s) nor site-relative; React would link it and the native template will not`);
    const open = link.href.startsWith('http') ? `<a href="${escapeAttr(link.href)}" target="_blank" rel="noopener noreferrer">` : `<a href="${escapeAttr(link.href)}">`;
    const anchors = [...fragment.matchAll(new RegExp(`${escapeRegExp(open)}([\\s\\S]*?)<\\/a>`, 'g'))];
    expect(anchors.some(match => textOf(match[1]) === normalise(link.label)), `${route}: ${label} link target, external attributes or label differ from source`);
  }
  expect(!/<a [^>]*target="_blank"(?![^>]*rel="noopener noreferrer")/.test(fragment), `${route}: ${label} has an external link without rel="noopener noreferrer"`);
}

// --- Inventory and route ownership ---------------------------------------------
// The count is derived from the generated data (17 explainers at the time of
// writing); nothing here fixes that number, so new records extend the checks.
const slugSet = new Set(techSlugs);
expect(techSlugs.length > 0 && techSlugs.length === techExplainers.length && slugSet.size === techSlugs.length, 'Generated techSlugs do not match the explainer records one-to-one (zero routes is a failure)');
expect(techExplainers.every((record, index) => record.slug === techSlugs[index]), 'Generated techSlugs order differs from the explainer records');
for (const page of technologyListing.pages) expect(slugSet.has(page.slug), `Listing card ${page.slug} has no explainer route`);
for (const page of technologyDirectory) expect(slugSet.has(page.slug), `Directory entry ${page.slug} has no explainer route`);
expect(same(unlistedSlugs, techSlugs.filter(slug => !technologyListing.pages.some(page => page.slug === slug))), 'Generated unlistedSlugs differ from the slugs without a listing card');

const distTechnology = resolve(projectDir, 'dist', 'technology');
const built = [];
const strayFiles = [];
for (const entry of await readdir(distTechnology)) {
  if ((await stat(resolve(distTechnology, entry))).isDirectory()) built.push(entry);
  else if (entry !== 'index.html') strayFiles.push(entry);
}
const missing = techSlugs.filter(slug => !built.includes(slug));
const unexpected = built.filter(slug => !slugSet.has(slug));
expect(!missing.length && !unexpected.length, `Built technology inventory differs from techSlugs. Missing: [${missing.join(', ')}]. Unexpected or stale: [${unexpected.join(', ')}]`);
expect(!strayFiles.length, `Unexpected files under dist/technology: [${strayFiles.join(', ')}]`);
for (const slug of techSlugs) expect((await stat(resolve(distTechnology, slug, 'index.html'))).isFile(), `/technology/${slug}: index.html missing`);

// --- Listing --------------------------------------------------------------------
// TechnologyLandingPage: categories in declared order, each with the cards whose
// category matches in card order; empty categories are skipped and a card whose
// category is not declared is never rendered.
const groups = technologyListing.categories
  .map(category => ({ category, pages: technologyListing.pages.filter(page => page.category === category) }))
  .filter(group => group.pages.length > 0);
const groupedCards = groups.flatMap(group => group.pages);
const orphanCards = technologyListing.pages.filter(page => !technologyListing.categories.includes(page.category));
const listingHtml = await readFile(resolve(distTechnology, 'index.html'), 'utf8');
const listingText = textOf(listingHtml);
const listingMain = mainOf(listingHtml);
expect(count(listingMain, /<h1>/g) === 1 && textOf(listingMain.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? '') === listingCopy.title, '/technology: H1 is not the source page title');
for (const copy of [listingCopy.highlight, listingCopy.description, listingCopy.introHeading, listingCopy.intro, listingCopy.topicsHeading, listingCopy.topicsSub, listingCopy.ctaHeading, listingCopy.ctaBody, listingCopy.ctaPrimary.label, listingCopy.ctaSecondary.label]) {
  expect(listingText.includes(normalise(copy)), `/technology: built HTML is missing listing copy: ${copy}`);
}
expect(same(techHeadings(listingMain), [listingCopy.introHeading, listingCopy.topicsHeading, listingCopy.ctaHeading]), '/technology: section order or H2 headings differ from the React page');
checkContact('/technology', listingMain);
expect(listingHtml.includes(`<a class="tech-primary-button" href="${listingCopy.ctaPrimary.href}">`) && listingHtml.includes(`<a class="tech-secondary-button" href="${listingCopy.ctaSecondary.href}">`), '/technology: CTA link targets differ from source');
const categoryMatches = [...listingHtml.matchAll(/<div class="tech-category" data-category="([^"]*)">/g)];
expect(same(categoryMatches.map(match => unescape(match[1])), groups.map(group => group.category)), '/technology: category groups differ from the declared category order with empty categories skipped');
const cardMatches = [...listingHtml.matchAll(/<a class="tech-topic-card" href="([^"]+)">/g)];
expect(cardMatches.length === groupedCards.length, `/technology: card count ${cardMatches.length} differs from the ${groupedCards.length} source cards in declared categories`);
expect(same(cardMatches.map(match => match[1]), groupedCards.map(page => `/technology/${page.slug}`)), '/technology: card order differs from category-grouped source order');
for (const [index, match] of categoryMatches.entries()) {
  const group = groups[index];
  const block = listingHtml.slice(match.index, categoryMatches[index + 1]?.index ?? listingHtml.indexOf('<section class="tech-section tech-cta">'));
  expect(textOf(block.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? '') === normalise(group.category), `/technology: category heading differs for group ${index + 1}`);
  expect(same([...block.matchAll(/<a class="tech-topic-card" href="([^"]+)">/g)].map(inner => inner[1]), group.pages.map(page => `/technology/${page.slug}`)), `/technology: cards under ${group.category} differ from source card order`);
  const blockText = textOf(block);
  for (const page of group.pages) {
    expect(blockText.includes(normalise(page.title)) && blockText.includes(normalise(page.desc)), `/technology: card ${page.slug} is missing its source title or description`);
  }
  expect(count(block, /<h4>/g) === group.pages.length, `/technology: card heading count differs under ${group.category}`);
}
// Read Guide affordance (TechnologyListing.astro): the decorative arrow is a
// nested aria-hidden span INSIDE the affordance span, so the label text is the
// outer span's own text node and the arrow is the inner span's text:
//   <span class="tech-topic-more">Read Guide <span aria-hidden="true">→</span></span>
// The pattern is tight to that fixed shape: the label is a single text node
// (no child elements before the arrow), the arrow span carries no other text,
// and the outer span closes immediately after it. Every affordance span
// emitted must take this shape (opening tag count equals full-shape count).
const readGuidePattern = /<span class="tech-topic-more">([^<]*)<span aria-hidden="true">([^<]*)<\/span>\s*<\/span>/g;
const readGuideSpans = [...listingHtml.matchAll(readGuidePattern)];
const readGuideOpenings = count(listingHtml, /<span class="tech-topic-more">/g);
expect(readGuideOpenings === groupedCards.length && readGuideSpans.length === groupedCards.length, `/technology: Read Guide affordance count (${readGuideSpans.length} well-formed of ${readGuideOpenings} emitted) differs from the ${groupedCards.length} source cards`);
expect(readGuideSpans.every(match => textOf(match[1]) === listingCopy.readGuide), `/technology: Read Guide affordance text (excluding the arrow) must decode to "${listingCopy.readGuide}"`);
expect(readGuideSpans.every(match => textOf(match[2]) === '→'), '/technology: Read Guide arrow must be the "→" glyph inside the nested aria-hidden="true" span');
for (const slug of [...unlistedSlugs, ...orphanCards.map(page => page.slug)]) expect(!listingHtml.includes(`href="/technology/${slug}"`), `/technology: emitted a card for ${slug}, which React would not render`);
checkFramework('/technology', listingHtml, 'data-technology-listing');

// Site-wide LocalBusiness and Organization nodes are the shared SEO.tsx
// baseline. They are taken from the listing output, but only after their
// identity shape is asserted against the constants restated from SEO.tsx.
const listingSchemas = readHead(listingHtml).schemas || [];
const localBusiness = listingSchemas.find(schema => same(schema['@type'], ['LocalBusiness', 'ProfessionalService']));
const organization = listingSchemas.find(schema => schema['@type'] === 'Organization');
expect(localBusiness && localBusiness['@id'] === seoConstants.localBusinessId && localBusiness.name === seoConstants.siteName && localBusiness.url === `${baseUrl}/`
  && localBusiness.telephone === seoConstants.telephone && localBusiness.email === seoConstants.email && localBusiness.image === seoConstants.defaultImage
  && localBusiness.address?.postalCode === seoConstants.postalCode && Array.isArray(localBusiness.makesOffer) && localBusiness.makesOffer.length > 0, '/technology: LocalBusiness schema missing or its identity differs from SEO.tsx');
expect(organization && organization['@id'] === seoConstants.organizationId && organization.name === seoConstants.siteName && organization.legalName === seoConstants.legalName
  && organization.url === baseUrl && organization.logo === seoConstants.publisherLogo && organization.contactPoint?.telephone === seoConstants.telephone
  && organization.identifier?.some(entry => entry.propertyID === 'UK Companies House' && entry.value === seoConstants.companiesHouse), '/technology: Organization schema missing or its identity differs from SEO.tsx');
const breadcrumb = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })) });
// <SEO title description canonical> with the default type "website": the graph
// is [LocalBusiness, Organization, BreadcrumbList].
checkHead('/technology', listingHtml, {
  rawTitle: listingCopy.rawTitle, description: listingCopy.description, canonical: listingCanonical,
  schemas: [localBusiness, organization, breadcrumb([[breadcrumbHome, `${baseUrl}/`], [listingBreadcrumbName, listingCanonical]])],
});

// --- Explainers -------------------------------------------------------------------
const emDashRoutes = [];
for (const explainer of techExplainers) {
  const route = `/technology/${explainer.slug}`;
  const canonical = `${listingCanonical}/${explainer.slug}`;
  const html = await readFile(resolve(distTechnology, explainer.slug, 'index.html'), 'utf8');
  const text = textOf(html);
  if (html.includes('—')) emDashRoutes.push(route);

  // Hero, breadcrumb and fixed copy.
  const main = mainOf(html);
  expect(count(main, /<h1>/g) === 1 && textOf(main.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? '') === normalise(explainer.h1), `${route}: H1 is not the source h1`);
  const hero = section(html, 'tech-hero') ?? '';
  expect(textOf(hero.match(/<li aria-current="page">([\s\S]*?)<\/li>/)?.[1] ?? '') === normalise(explainer.h1), `${route}: breadcrumb current item is not the source h1`);
  expect(hero.includes('<a href="/">') && hero.includes('<a href="/technology">'), `${route}: breadcrumb links to Home and the listing are missing`);
  for (const copy of [breadcrumbHome, explainerCopy.breadcrumbListing, explainerCopy.eyebrow, explainer.intro, explainerCopy.heroPrimary.label, explainerCopy.heroPhone.label]) {
    expect(textOf(hero).includes(normalise(copy)), `${route}: hero is missing rendered source or template text`);
  }
  expect(hero.includes(`<a class="tech-primary-button" href="${explainerCopy.heroPrimary.href}">`) && hero.includes(`<a class="tech-secondary-button" href="${explainerCopy.heroPhone.href}">`), `${route}: hero CTA targets differ from source`);
  if (explainer.heroImage) {
    // Documented deviation: React paints the image behind the text with
    // alt={data.h1}; the native hero shows the same source image decoratively
    // in its own 2:1 frame after the hero text, requested as 2:1 Cloudinary
    // crops at 480/800/1200/1600px (restated here, not imported).
    const cloudinary = explainer.heroImage.match(/^(https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/)f_auto,q_auto\/([^/?#]+)$/);
    const crop = width => `${cloudinary[1]}w_${width},c_fill,ar_2:1,f_auto,q_auto/${cloudinary[2]}`;
    const image = cloudinary
      ? `<img src="${escapeAttr(crop(1200))}" srcset="${escapeAttr([480, 720, 1200, 1600].map(width => `${crop(width)} ${width}w`).join(', '))}" sizes="(min-width: 768px) min(calc(100vw - 64px), 1100px), calc(100vw - 40px)" alt="" width="1200" height="600"`
      : `<img src="${escapeAttr(explainer.heroImage)}" alt="" width="1200" height="600"`;
    expect(hero.includes(image), `${route}: hero image differs from the source image crops or lacks decorative alt and reserved dimensions`);
    expect(hero.indexOf('tech-hero-media') > hero.indexOf('</h1>') && hero.indexOf('tech-hero-media') > hero.indexOf('tech-actions'), `${route}: hero image frame is not placed after the hero text`);
  } else {
    expect(!hero.includes('tech-hero-media') && !hero.includes('<img'), `${route}: hero image rendered without a source heroImage`);
  }
  for (const copy of [explainerCopy.whatHeading, explainerCopy.benefitsHeading, explainerCopy.risksHeading, explainerCopy.howHeading, explainerCopy.faqHeading, faqSubheading(explainer.h1), explainerCopy.moreHeading, explainerCopy.moreSub, explainerCopy.ctaHeading, explainerCopy.ctaBody, explainerCopy.ctaPrimary.label, explainerCopy.ctaSecondary.label]) {
    expect(text.includes(normalise(copy)), `${route}: built HTML is missing template copy: ${copy}`);
  }
  const heading2 = techHeadings(main);
  const expectedHeadings = [explainerCopy.whatHeading, explainerCopy.benefitsHeading, explainerCopy.risksHeading, explainerCopy.howHeading, explainerCopy.faqHeading, ...(explainer.related.length ? [explainerCopy.relatedHeading] : []), explainerCopy.moreHeading, explainerCopy.ctaHeading];
  expect(same(heading2, expectedHeadings), `${route}: section order or H2 headings differ from the React page`);

  // RichText bodies.
  checkRichText(route, 'What is it?', prose(section(html, 'tech-what') ?? ''), explainer.whatItIs);
  checkRichText(route, 'How Fresh Tech Implements This', prose(section(html, 'tech-how') ?? ''), explainer.howWeDoIt);

  // Benefit and risk cards: count, order and text.
  for (const [className, cards, label] of [['tech-benefit-card', explainer.benefits, 'benefit'], ['tech-risk-card', explainer.risks, 'risk']]) {
    const block = section(html, label === 'benefit' ? 'tech-benefits' : 'tech-risks') ?? '';
    const articles = [...block.matchAll(new RegExp(`<article class="tech-card ${className}">([\\s\\S]*?)<\\/article>`, 'g'))];
    expect(articles.length === cards.length, `${route}: ${label} card count differs from source`);
    expect(same(articles.map(match => textOf(match[1].match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? '')), cards.map(card => normalise(card.title))), `${route}: ${label} card order or titles differ from source`);
    for (const [index, card] of cards.entries()) {
      expect(articles[index] && textOf(articles[index][1]).includes(normalise(card.desc)), `${route}: ${label} card ${index + 1} is missing its source description`);
    }
  }

  // FAQs: native details/summary. The question lives in its own span; the "+"
  // is a separate aria-hidden element so it never joins the question text.
  const faqBlock = section(html, 'tech-faq') ?? '';
  const details = [...faqBlock.matchAll(/<details>\s*<summary>\s*<span>([\s\S]*?)<\/span>\s*<b aria-hidden="true">\+<\/b>\s*<\/summary>\s*<div class="tech-prose">([\s\S]*?)<\/div>\s*<\/details>/g)];
  expect(count(faqBlock, /<details>/g) === explainer.faqs.length && details.length === explainer.faqs.length, `${route}: FAQ count or summary structure differs from source`);
  expect(count(faqBlock, /<summary>/g) === explainer.faqs.length && !/<summary>\s*[^<]*\+/.test(faqBlock), `${route}: a FAQ summary carries a literal plus outside the decorative element`);
  for (const [index, faq] of explainer.faqs.entries()) {
    const match = details[index];
    expect(match && textOf(match[1]) === normalise(faq.q), `${route}: FAQ ${index + 1} question differs from source`);
    if (match) checkRichText(route, `FAQ ${index + 1} answer`, match[2], faq.a);
  }

  // Related services: React maps relatedServices through the catalogue and
  // filter(Boolean)s the misses, so only resolved entries render, in order.
  const relatedBlock = section(html, 'tech-related');
  if (explainer.related.length) {
    expect(relatedBlock !== null, `${route}: related services section missing`);
    expect(same([...(relatedBlock ?? '').matchAll(/<li><a href="([^"]+)">/g)].map(match => match[1]), explainer.related.map(service => `/services/${service.slug}`)), `${route}: related service links differ from the resolved source order`);
    for (const service of explainer.related) expect(textOf(relatedBlock ?? '').includes(normalise(service.title)), `${route}: related service title missing`);
  } else {
    expect(relatedBlock === null, `${route}: related services section rendered with no resolved services`);
  }
  for (const slug of explainer.unresolvedRelatedServices) expect(!html.includes(`href="/services/${slug}"`), `${route}: unresolved related service ${slug} was linked`);

  // More Technology Explained: allTechPages minus the current route, in order.
  const moreBlock = section(html, 'tech-more') ?? '';
  const moreHrefs = [...moreBlock.matchAll(/<a class="tech-more-card" href="([^"]+)">/g)].map(match => match[1]);
  const expectedMore = technologyDirectory.filter(page => page.slug !== explainer.slug);
  expect(same(moreHrefs, expectedMore.map(page => `/technology/${page.slug}`)), `${route}: more-links differ from the directory minus this route in source order`);
  expect(!moreHrefs.includes(route), `${route}: links to itself in the more grid`);
  for (const page of expectedMore) expect(textOf(moreBlock).includes(normalise(page.title)), `${route}: more-link title missing for ${page.slug}`);

  const cta = section(html, 'tech-cta') ?? '';
  expect(cta.includes(`<a class="tech-primary-button" href="${explainerCopy.ctaPrimary.href}">`) && cta.includes(`<a class="tech-secondary-button" href="${explainerCopy.ctaSecondary.href}">`), `${route}: closing CTA targets differ from source`);
  checkContact(route, main);
  checkFramework(route, html, `data-technology-explainer="${explainer.slug}"`);

  // <SEO title={data.title} description={data.metaDesc} canonical schema={[articleSchema, faqSchema]}>:
  // the explicit schema array replaces the type default, so no LocalBusiness;
  // Organization and the auto breadcrumb are still appended. The Article dates
  // are the fixed literals in the React page, not new claims.
  const article = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: explainer.h1, description: explainer.metaDesc,
    datePublished: explainerCopy.datePublished, dateModified: explainerCopy.dateModified,
    author: { '@type': 'Organization', name: seoConstants.siteName, '@id': seoConstants.organizationId, url: baseUrl },
    publisher: { '@type': 'Organization', name: seoConstants.siteName, logo: { '@type': 'ImageObject', url: seoConstants.publisherLogo } },
    inLanguage: 'en-GB', isAccessibleForFree: true,
  };
  const faqPage = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: explainer.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: stripMarkdownLinks(faq.a) } })),
  };
  checkHead(route, html, {
    rawTitle: explainer.title, description: explainer.metaDesc, canonical,
    schemas: [article, faqPage, organization, breadcrumb([[breadcrumbHome, `${baseUrl}/`], [listingBreadcrumbName, listingCanonical], [prettify(explainer.slug), canonical]])],
  });
}

console.log(`/technology listing and ${techSlugs.length} source-derived technology routes verified: ${assertions} inventory, content, RichText, shared contact, head and framework assertions passed; ${groupedCards.length} listing cards in ${groups.length} categories; ${technologyDirectory.length} directory entries in the more grid; ${unlistedSlugs.length} explainer(s) without a listing card`);
if (orphanCards.length) console.warn(`Warning: ${orphanCards.length} listing card(s) have an undeclared category and are not rendered (React behaviour): ${orphanCards.map(page => page.slug).join(', ')}`);
if (emDashRoutes.length) console.warn(`Warning: em dash present in emitted copy on ${emDashRoutes.length} route(s) (source punctuation, not rewritten; the quality gate will reject these):\n  ${emDashRoutes.join('\n  ')}`);
