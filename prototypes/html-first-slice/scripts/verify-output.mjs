import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { services, serviceGroups, listingStats } from '../src/generated/services-data.mjs';
import { navigation } from '../src/generated/navigation-data.mjs';
import { caseStudies } from '../src/generated/case-studies-data.mjs';
import { pricing } from '../src/generated/pricing-data.mjs';
import { allSectors, coverageSectors, displayStudies, relatedStudies, resultHeading, victoryOf } from '../src/lib/case-study-display.mjs';
import { comparison, countyLinks, faqs, industries, pricingTiers, processSteps, serviceAreas, services as homepageServices } from '../src/lib/homepage-data.mjs';
import { featuredTestimonial, homepageCaseStudies, homepagePricing } from '../src/lib/homepage-display.mjs';
import { homepageSeo } from '../src/lib/homepage-seo.mjs';
import { assertPricingCssScoped } from './lib/pricing-css-scope.mjs';
import { loadRetainedReactHead } from './lib/retained-react-head.mjs';
import { PRICING_H1 } from '../src/lib/pricing-seo.mjs';

const html = await readFile(resolve('dist/pricing/index.html'), 'utf8');
const css = await readFile(resolve('src/styles/pricing.css'), 'utf8');
const expectations = [
  `<h1>${PRICING_H1}</h1>`,
  '<link rel="canonical" href="https://fresh-tech.uk/pricing">',
  'data-tier-card="Standard"',
  'data-tier-card="Plus"',
  'data-tier-card="Premium"',
  'Example: 10 people on Plus is £600 per month',
  'data-calculator',
  'application/ld+json',
  '<a class="skip-link" href="#main-content">Skip to main content</a>',
  '<main id="main-content" tabindex="-1" class="pricing-page">',
];

for (const expected of expectations) {
  if (!html.includes(expected)) throw new Error(`Built pricing HTML is missing: ${expected}`);
}

if (html.includes('data-reactroot') || html.includes('<astro-island')) {
  throw new Error('The HTML-first slice unexpectedly contains framework hydration markup');
}
const projectsNote = html.match(/<p class="projects-note">([\s\S]*?)<\/p>/)?.[1] ?? '';
if (!projectsNote || projectsNote.includes('📋') || projectsNote.includes('aria-hidden')) {
  throw new Error('The pricing projects note contains a decorative icon');
}
assertPricingCssScoped(css, { standalone: true });

console.log(`${expectations.length} static output assertions passed`);

// --- Service template family ------------------------------------------------
const RETAINED_SLUG = 'managed-it-support';
const retained = await loadRetainedReactHead();
// Strips markup, then decodes the entities Astro emits for text content
// (`<2hr` in the hardware outcomes arrives as `&lt;2hr`). Applied to both the
// built HTML and the source value so whitespace normalises identically.
const decodeText = value => value.replace(/<[^>]+>/g, ' ').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&').replace(/\s+/g, ' ');
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const comparedMetadata = ['description', 'robots', 'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:url', 'og:type', 'og:site_name', 'og:locale', 'twitter:card', 'twitter:site', 'twitter:creator', 'twitter:title', 'twitter:description', 'twitter:image'];
const navigationLinks = [...navigation.main, ...navigation.sectors, ...navigation.resources, ...navigation.mobileResources];

// Route inventory: the built /services/* directories must be exactly the
// source catalogue slugs, compared by name rather than by count.
const sourceSlugs = services.map(service => service.page.slug);
if (!sourceSlugs.includes(RETAINED_SLUG)) throw new Error(`Source catalogue no longer contains ${RETAINED_SLUG}, which the retained React fixture verifies`);
const builtSlugs = [];
for (const entry of await readdir(resolve('dist/services'))) {
  if ((await stat(resolve('dist/services', entry))).isDirectory()) builtSlugs.push(entry);
}
const missing = sourceSlugs.filter(slug => !builtSlugs.includes(slug));
const unexpected = builtSlugs.filter(slug => !sourceSlugs.includes(slug));
if (missing.length || unexpected.length) {
  throw new Error(`Built service routes differ from the source catalogue. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);
}

// Expected head values are derived here from the retained React fixture, not
// from src/lib/service-seo.mjs, so every route is checked against the current
// source formula independently of the helper that rendered it.
function expectedHead(page) {
  const canonical = `https://fresh-tech.uk/services/${page.slug}`;
  const rawTitle = `${page.title}: IT Support Shropshire`;
  const title = expectedSiteTitle(rawTitle);
  const breadcrumb = page.slug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  const metadata = { ...retained.metadata };
  for (const key of ['og:title', 'twitter:title']) metadata[key] = title;
  for (const key of ['description', 'og:description', 'twitter:description']) metadata[key] = page.desc;
  metadata['og:url'] = canonical;
  const schemas = structuredClone(retained.schemas);
  Object.assign(schemas[0], { name: rawTitle, description: page.desc, url: canonical });
  Object.assign(schemas[3].itemListElement[2], { name: breadcrumb, item: canonical });
  return { title, canonical, metadata, schemas };
}

function expectedSiteTitle(rawTitle) {
  const longTitle = `${rawTitle} | Fresh Tech IT Support`;
  if (longTitle.length <= 65) return longTitle;
  const shortTitle = `${rawTitle} | Fresh Tech`;
  return shortTitle.length <= 65 ? shortTitle : rawTitle;
}

function readHead(serviceHtml) {
  const title = unescape(serviceHtml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
  const canonical = unescape([...serviceHtml.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)].at(-1)?.[1] || '');
  const metadata = {};
  for (const tag of serviceHtml.match(/<meta\s+[^>]+>/gi) || []) {
    const key = tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1];
    const contentMatch = tag.match(/content=(["'])(.*?)\1/i);
    const content = contentMatch?.[2];
    if (key && content !== undefined) metadata[key] = unescape(content);
  }
  const schemaMatch = serviceHtml.match(/<script id="json-ld-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const schemas = schemaMatch ? JSON.parse(schemaMatch[1]) : null;
  return { title, canonical, metadata, schemas };
}

function verifyHead(slug, built, expected, sourceLabel) {
  if (built.title !== expected.title) throw new Error(`${slug}: title "${built.title}" differs from ${sourceLabel} "${expected.title}"`);
  if (built.canonical !== expected.canonical) throw new Error(`${slug}: canonical differs from ${sourceLabel}`);
  for (const key of comparedMetadata) {
    if (built.metadata[key] !== expected.metadata[key]) throw new Error(`${slug}: ${key} differs from ${sourceLabel}`);
  }
  if (!Array.isArray(built.schemas) || built.schemas.length !== 4) throw new Error(`${slug}: expected four JSON-LD schema objects`);
  const types = built.schemas.map(schema => JSON.stringify(schema['@type']));
  const expectedTypes = ['"Service"', '["LocalBusiness","ProfessionalService"]', '"Organization"', '"BreadcrumbList"'];
  if (types.join('|') !== expectedTypes.join('|')) throw new Error(`${slug}: schema types ${types.join(', ')} differ from the four-schema contract`);
  if (JSON.stringify(built.schemas) !== JSON.stringify(expected.schemas)) throw new Error(`${slug}: JSON-LD differs from ${sourceLabel}`);
}

let contentAssertions = 0;
let headAssertions = 0;
let navigationAssertions = 0;
for (const service of services) {
  const { page, content, related } = service;
  const serviceHtml = await readFile(resolve('dist/services', page.slug, 'index.html'), 'utf8');
  const serviceText = decodeText(serviceHtml);
  const contentValues = [
    page.title, page.desc, content.tagline, content.heroStat.num, content.heroStat.label, content.priceNote,
    ...content.includes,
    ...content.outcomes.flatMap(item => [item.stat, item.label]),
    ...content.howItWorks.flatMap(item => [item.step, item.title, item.desc]),
    ...content.faqs.flat(),
    ...related.map(item => item.title),
  ];
  for (const value of contentValues) {
    if (!serviceText.includes(decodeText(value))) throw new Error(`${page.slug}: HTML is missing source content: ${value}`);
  }
  contentAssertions += contentValues.length;
  if (!serviceHtml.includes(`<h1>${page.title.replaceAll('&', '&amp;')}</h1>`)) throw new Error(`${page.slug}: H1 is not the catalogue title`);
  if (serviceHtml.includes('data-reactroot') || serviceHtml.includes('<astro-island')) throw new Error(`${page.slug}: unexpectedly contains framework hydration markup`);
  contentAssertions += 2;

  // Related services: the first three other catalogue entries in source order.
  const expectedRelated = services.filter(other => other.page.slug !== page.slug).slice(0, 3).map(other => other.page.slug);
  if (related.map(item => item.slug).join(',') !== expectedRelated.join(',')) throw new Error(`${page.slug}: related services are not the first three other catalogue entries`);
  const relatedHrefs = [...serviceHtml.matchAll(/class="related-links"[\s\S]*?<a class="all-services"/g)][0]?.[0] || '';
  const builtRelated = [...relatedHrefs.matchAll(/href="\/services\/([^"]+)"/g)].map(match => match[1]);
  if (builtRelated.join(',') !== expectedRelated.join(',')) throw new Error(`${page.slug}: rendered related links [${builtRelated.join(', ')}] differ from source order [${expectedRelated.join(', ')}]`);
  contentAssertions += 2;

  // Price presentation branch mirrors the React template.
  const hasPrice = serviceHtml.includes('class="hero-price"');
  const hasQuote = serviceHtml.includes('class="hero-quote"');
  if (content.priceFrom != null ? !(hasPrice && !hasQuote && serviceHtml.includes(`£${content.priceFrom}`)) : !(hasQuote && !hasPrice)) {
    throw new Error(`${page.slug}: hero pricing branch does not match priceFrom=${content.priceFrom}`);
  }
  contentAssertions += 1;

  const built = readHead(serviceHtml);
  verifyHead(page.slug, built, expectedHead(page), 'the source head formula');
  if (page.slug === RETAINED_SLUG) verifyHead(page.slug, built, retained, 'retained React output');
  headAssertions += comparedMetadata.length + 4;

  for (const { label, href } of navigationLinks) {
    if (!serviceText.includes(label) || !serviceHtml.includes(`href="${href}"`)) throw new Error(`${page.slug}: navigation is missing source-derived link: ${label} (${href})`);
  }
  navigationAssertions += navigationLinks.length;
}

console.log(`${services.length} service routes verified (${sourceSlugs.join(', ')}): ${contentAssertions} content, ${headAssertions} head/framework and ${navigationAssertions} source-navigation assertions passed; ${RETAINED_SLUG} also matched the retained React head fixture`);

// --- /services listing ------------------------------------------------------
const listingHtml = await readFile(resolve('dist/services/index.html'), 'utf8');
const listingText = decodeText(listingHtml);
let listingAssertions = 0;
const listingExpect = (condition, message) => { listingAssertions++; if (!condition) throw new Error(`/services: ${message}`); };
// Source copy from pages-v2/ServicesPageV2.tsx.
const listingCopy = [
  'What we do',
  'All the IT your business needs. One place. One fee.',
  "Every service on this page is either included in your monthly plan or quoted at a fixed price before we start. No hourly rates, no \"that's extra\" surprises.",
  'See pricing', 'Book a call',
  'Not sure what you need?', 'Start with a free IT health check',
  "Tell us what you have. We'll tell you what's missing, what's at risk, and what a sensible plan looks like.",
  'Free IT health check',
  ...listingStats.flatMap(({ n, l }) => [n, l]),
];
for (const value of listingCopy) listingExpect(listingText.includes(decodeText(value)), `missing source copy: ${value}`);
listingExpect(listingHtml.includes('<h1>All the IT your business needs. One place. One fee.</h1>'), 'H1 is not the source heading');
listingExpect(listingStats.length === 4 && (listingHtml.match(/class="hero-stat"/g) || []).length === 4, 'hero stats are not the four source stats');
listingExpect(!listingHtml.includes('data-reactroot') && !listingHtml.includes('<astro-island'), 'unexpectedly contains framework hydration markup');

// Groups and cards: exact hrefs in source order.
const groupBlocks = [...listingHtml.matchAll(/<section class="content-section group-section" data-group="([^"]*)">([\s\S]*?)<\/section>/g)];
listingExpect(groupBlocks.length === serviceGroups.length && serviceGroups.length === 4, `expected ${serviceGroups.length} group sections, found ${groupBlocks.length}`);
listingExpect(groupBlocks.map(match => unescape(match[1])).join('|') === serviceGroups.map(group => group.group).join('|'), 'group order differs from source');
const allCardHrefs = [];
for (const [index, group] of serviceGroups.entries()) {
  const block = groupBlocks[index][2];
  const blockText = decodeText(block);
  listingExpect(blockText.includes(`Group ${String(index + 1).padStart(2, '0')}`) && blockText.includes(decodeText(group.group)) && blockText.includes(decodeText(group.lede)), `group ${group.group} eyebrow, name or lede missing`);
  const cards = [...block.matchAll(/<a class="service-card" href="([^"]+)" data-slug="([^"]+)">([\s\S]*?)<\/a>/g)];
  listingExpect(cards.map(card => card[1]).join(',') === group.services.map(item => item.href).join(','), `group ${group.group} card hrefs differ from source order`);
  listingExpect(cards.map(card => card[2]).join(',') === group.services.map(item => item.slug).join(','), `group ${group.group} card slugs differ from source order`);
  for (const [cardIndex, item] of group.services.entries()) {
    const cardText = decodeText(cards[cardIndex][3]);
    listingExpect(cardText.includes(decodeText(item.name)) && cardText.includes(decodeText(item.desc)) && cardText.includes(decodeText(item.price)), `card ${item.slug} name, desc or price missing`);
    const tagMatch = cards[cardIndex][3].match(/<span class="card-tag(?: free)?">([^<]*)<\/span>/);
    listingExpect((tagMatch ? unescape(tagMatch[1]) : undefined) === item.tag, `card ${item.slug} tag differs from source`);
    allCardHrefs.push(item.href);
  }
}
const detailHrefs = allCardHrefs.filter(href => href.startsWith('/services/')).map(href => href.slice('/services/'.length));
const unlinked = sourceSlugs.filter(slug => !detailHrefs.includes(slug));
listingExpect(unlinked.length === 0, `generated detail routes not linked from the listing: ${unlinked.join(', ')}`);
const standalone = allCardHrefs.filter(href => !href.startsWith('/services/'));
listingExpect(new Set(allCardHrefs).size === allCardHrefs.length, 'card hrefs are not unique');
for (const href of ['/pricing', '/contact', '/it-health-check']) listingExpect(listingHtml.includes(`href="${href}"`), `CTA link ${href} missing`);
for (const { label, href } of navigationLinks) listingExpect(listingText.includes(label) && listingHtml.includes(`href="${href}"`), `navigation is missing source-derived link: ${label} (${href})`);

// Head: shared LocalBusiness and Organization objects must equal the retained
// detail fixture exactly. Service and BreadcrumbList are checked against the
// listing formula (rawTitle, description, canonical, two-item breadcrumb) and
// follow the directly inspected production SEO type/path contract for /services.
const listingRawTitle = 'IT Services: Managed Support, Cyber Security & More';
const listingDescription = 'All the IT your business needs in one flat monthly fee. Managed support, cyber security, Microsoft 365, cloud backup, phone systems. From £40/user/month.';
const listingCanonical = 'https://fresh-tech.uk/services';
const listingHead = readHead(listingHtml);
const listingMetadata = { ...retained.metadata };
for (const key of ['og:title', 'twitter:title']) listingMetadata[key] = expectedSiteTitle(listingRawTitle);
for (const key of ['description', 'og:description', 'twitter:description']) listingMetadata[key] = listingDescription;
listingMetadata['og:url'] = listingCanonical;
const listingSchemas = structuredClone(retained.schemas);
Object.assign(listingSchemas[0], { name: listingRawTitle, description: listingDescription, url: listingCanonical });
listingSchemas[3].itemListElement = listingSchemas[3].itemListElement.slice(0, 2);
verifyHead('/services', listingHead, { title: expectedSiteTitle(listingRawTitle), canonical: listingCanonical, metadata: listingMetadata, schemas: listingSchemas }, 'the inspected production listing SEO contract');
listingAssertions += comparedMetadata.length + 4;
console.log(`/services listing verified: ${listingAssertions} assertions across ${serviceGroups.length} groups, ${allCardHrefs.length} cards (${standalone.length} standalone: ${standalone.join(', ')}), CTAs, navigation and head`);

// --- /case-studies listing and /case-studies/[slug] routes ------------------
// Expected head values are derived here from components/SEO.tsx rules and the
// retained fixture's Organization object, independently of case-study-seo.mjs.
// Assertions are representative rather than a mirror of every rendered value;
// record content is never printed, only slugs.
let caseStudyAssertions = 0;
const csExpect = (condition, message) => { caseStudyAssertions++; if (!condition) throw new Error(message); };
const caseStudySlugs = caseStudies.map(study => study.slug);
const builtCaseStudySlugs = [];
for (const entry of await readdir(resolve('dist/case-studies'))) {
  if ((await stat(resolve('dist/case-studies', entry))).isDirectory()) builtCaseStudySlugs.push(entry);
}
const missingCaseStudies = caseStudySlugs.filter(slug => !builtCaseStudySlugs.includes(slug));
const unexpectedCaseStudies = builtCaseStudySlugs.filter(slug => !caseStudySlugs.includes(slug));
csExpect(!missingCaseStudies.length && !unexpectedCaseStudies.length, `Built case-study routes differ from the source records. Missing: [${missingCaseStudies.join(', ')}]. Unexpected: [${unexpectedCaseStudies.join(', ')}]`);

const organizationSchema = retained.schemas[2];
csExpect(organizationSchema['@type'] === 'Organization', 'retained fixture no longer holds the Organization object at index 2');
const caseStudyBase = 'https://fresh-tech.uk';
const organizationRef = { '@id': `${caseStudyBase}/#organization` };
const breadcrumb = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })) });
const caseStudyMetadata = (title, description, canonical, ogType) => {
  const metadata = { ...retained.metadata };
  for (const key of ['og:title', 'twitter:title']) metadata[key] = title;
  for (const key of ['description', 'og:description', 'twitter:description']) metadata[key] = description;
  metadata['og:url'] = canonical;
  metadata['og:type'] = ogType;
  return metadata;
};
function verifyCaseStudyHead(label, built, expected) {
  csExpect(built.title === expected.title, `${label}: title differs from the SEO contract`);
  csExpect(built.canonical === expected.canonical, `${label}: canonical differs from the SEO contract`);
  for (const key of comparedMetadata) csExpect(built.metadata[key] === expected.metadata[key], `${label}: ${key} differs from the SEO contract`);
  csExpect(JSON.stringify(built.schemas) === JSON.stringify(expected.schemas), `${label}: JSON-LD differs from the SEO contract`);
}

// Listing head: type="collection" gives CollectionPage + Organization + Home > Case Studies.
const csListingRawTitle = 'Case Studies: Real Results for Shropshire Businesses';
const csListingDescription = 'Real outcomes for real businesses. See how Fresh Tech has helped solicitors, healthcare practices, manufacturers and more across Shropshire and Herefordshire.';
const csListingCanonical = `${caseStudyBase}/case-studies`;
const csListingHtml = await readFile(resolve('dist/case-studies/index.html'), 'utf8');
const csListingText = decodeText(csListingHtml);
verifyCaseStudyHead('/case-studies', readHead(csListingHtml), {
  title: expectedSiteTitle(csListingRawTitle),
  canonical: csListingCanonical,
  metadata: caseStudyMetadata(expectedSiteTitle(csListingRawTitle), csListingDescription, csListingCanonical, 'website'),
  schemas: [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: csListingRawTitle, description: csListingDescription, url: csListingCanonical, isPartOf: organizationRef },
    organizationSchema,
    breadcrumb([['Home', `${caseStudyBase}/`], ['Case Studies', csListingCanonical]]),
  ],
});

// Listing content: source copy, featured pair, card order, sector filters.
const studies = displayStudies(caseStudies);
for (const value of [
  'Client stories', 'From the businesses we support', 'Real jobs.', 'Real fixes.',
  'Stories from jobs we have done. Where a client is named, the story is theirs. Where the client is not named, the story is based on a real job and some details are illustrative.',
  'Book a call', 'See pricing', 'Published case studies', 'Based on real jobs', '2014', 'Supporting businesses since', 'Based in Ludlow',
  'Reviews', 'Customer feedback', 'Selected client stories', 'Support', 'Contact our helpdesk', 'Mon–Fri, 9am–5pm',
  'Featured stories', 'All case studies', `${studies.length} stories`, "Sectors we've worked in", "Don't see your sector? Call us anyway.",
  "We support any business with 5–50 staff across Shropshire, Herefordshire and the Welsh Borders. If we're not the right fit we'll say so.", 'Book a 20-min call',
  ...coverageSectors(),
]) csExpect(csListingText.includes(decodeText(value)), `/case-studies: missing source copy: ${value}`);
csExpect(/<h1>Real jobs\.<br\s*\/?>Real fixes\.<\/h1>/.test(csListingHtml), '/case-studies: H1 is not the source heading');
csExpect(!csListingHtml.includes('data-reactroot') && !csListingHtml.includes('<astro-island'), '/case-studies: unexpectedly contains framework hydration markup');
const featuredSlugs = [...csListingHtml.matchAll(/<a class="cs-featured-card" href="\/case-studies\/([^"]+)" data-slug="[^"]+"/g)].map(match => match[1]);
csExpect(featuredSlugs.join(',') === caseStudySlugs.slice(0, 2).join(','), `/case-studies: featured cards [${featuredSlugs.join(', ')}] are not the first two source entries`);
const cardMatches = [...csListingHtml.matchAll(/<a class="cs-card" href="\/case-studies\/([^"]+)" data-slug="[^"]+" data-industry="([^"]*)"/g)];
csExpect(cardMatches.map(match => match[1]).join(',') === caseStudySlugs.join(','), '/case-studies: all-studies card order differs from source order');
csExpect(cardMatches.every((match, index) => unescape(match[2]) === caseStudies[index].industry), '/case-studies: card industries differ from source');
const filterButtons = [...csListingHtml.matchAll(/<button type="button" data-sector="([^"]*)" aria-pressed="(true|false)">/g)];
csExpect(filterButtons.map(match => unescape(match[1])).join('|') === allSectors(studies).join('|'), '/case-studies: sector filter buttons differ from All plus unique industries in source order');
csExpect(filterButtons.length > 0 && filterButtons[0][2] === 'true' && filterButtons.filter(match => match[2] === 'true').length === 1, '/case-studies: only the All filter should be pressed at render time');
csExpect(/<div class="cs-filters" data-case-study-filters[^>]*\bhidden[^>]*>/.test(csListingHtml), '/case-studies: filter toolbar must be hidden until enhanced');
csExpect(csListingHtml.includes('data-filter-count') && csListingHtml.includes('data-filter-empty'), '/case-studies: filter count or empty-state hooks missing');
for (const [index, study] of studies.entries()) {
  const cardText = decodeText(csListingHtml.slice(cardMatches[index].index, cardMatches[index + 1]?.index));
  for (const value of [study.client, study.headline, study.summary, study.metricNum, study.metricLabel, study.industry]) {
    csExpect(cardText.includes(decodeText(value)), `/case-studies: card ${study.slug} is missing a source field`);
  }
}
for (const { label, href } of navigationLinks) csExpect(csListingText.includes(label) && csListingHtml.includes(`href="${href}"`), `/case-studies: navigation is missing source-derived link: ${label} (${href})`);
csExpect(csListingHtml.includes('href="/case-studies" aria-current="page"'), '/case-studies: Case Studies resource link is not marked current');

// Detail routes: head per the article contract, representative content, related order.
const prettify = segment => segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
for (const study of caseStudies) {
  const label = `/case-studies/${study.slug}`;
  const html = await readFile(resolve('dist/case-studies', study.slug, 'index.html'), 'utf8');
  const text = decodeText(html);
  const canonical = `${caseStudyBase}/case-studies/${study.slug}`;
  const rawTitle = `${study.title}: Case Study`;
  verifyCaseStudyHead(label, readHead(html), {
    title: expectedSiteTitle(rawTitle),
    canonical,
    metadata: caseStudyMetadata(expectedSiteTitle(rawTitle), study.outcome, canonical, 'article'),
    schemas: [
      { '@context': 'https://schema.org', '@type': 'Article', headline: rawTitle, description: study.outcome, image: retained.metadata['og:image'], url: canonical, author: organizationRef, publisher: organizationRef, mainEntityOfPage: canonical },
      organizationSchema,
      breadcrumb([['Home', `${caseStudyBase}/`], ['Case Studies', csListingCanonical], [prettify(study.slug), canonical]]),
    ],
  });
  csExpect(html.includes(`<h1>${study.title.replaceAll('&', '&amp;')}</h1>`), `${label}: H1 is not the source title`);
  for (const value of [study.client, study.industry, study.outcome, study.challenge, study.solution, victoryOf(study), 'All case studies', 'The challenge', 'What they were dealing with', 'What we did', 'The solution', 'More stories', "Other clients we've helped", 'Sounds like you?', "Let's talk about your setup", "We'll tell you honestly if we can help, and what it would look like.", 'Book a 20-min call']) {
    csExpect(text.includes(decodeText(value)), `${label}: HTML is missing source content`);
  }
  if (study.shortStats) {
    csExpect(text.includes(decodeText(`Risk: ${study.shortStats.risk}`)) && text.includes('The result') && text.includes(decodeText(resultHeading(study))) && (html.match(/class="cs-metric" data-tone=/g) || []).length === 3, `${label}: shortStats block is incomplete`);
  } else {
    csExpect(!html.includes('class="content-section cs-result-section"') && !html.includes('class="cs-risk"'), `${label}: result block rendered without shortStats`);
  }
  csExpect(study.testimonial ? html.includes('class="cs-testimonial"') && text.includes(decodeText(study.testimonial)) : !html.includes('class="cs-testimonial"'), `${label}: testimonial branch does not match source`);
  csExpect(study.disclosure ? html.includes('class="cs-disclosure"') && text.includes(decodeText(study.disclosure)) : !html.includes('class="cs-disclosure"'), `${label}: disclosure branch does not match source`);
  csExpect(study.image ? html.includes(`<img src="${study.image}"`) : !html.includes('class="content-section cs-image-section"'), `${label}: image branch does not match source`);
  const stackItems = (html.match(/<ul class="cs-stack"[^>]*>([\s\S]*?)<\/ul>/)?.[1].match(/<li>/g) || []).length;
  csExpect(stackItems === (study.techStack?.length ?? 0), `${label}: techStack tags do not match source`);
  const relatedHrefs = [...html.matchAll(/<a class="cs-related-card" href="\/case-studies\/([^"]+)"/g)].map(match => match[1]);
  csExpect(relatedHrefs.join(',') === relatedStudies(caseStudies, study.slug).map(item => item.slug).join(','), `${label}: related stories differ from the first three other source entries`);
  csExpect(html.includes('href="/case-studies" aria-current="page"') && html.includes('href="/contact"'), `${label}: navigation state or conversion link missing`);
  csExpect(!html.includes('data-reactroot') && !html.includes('<astro-island'), `${label}: unexpectedly contains framework hydration markup`);
}
console.log(`${caseStudies.length} case-study routes verified (${caseStudySlugs.join(', ')}) plus the /case-studies listing: ${caseStudyAssertions} route-inventory, head, content and navigation assertions passed`);

// --- Homepage ---------------------------------------------------------------
const homepageHtml = await readFile(resolve('dist/index.html'), 'utf8');
const homepageText = decodeText(homepageHtml);
const homepageHead = readHead(homepageHtml);
const homepageExpectedSeo = homepageSeo();
let homepageAssertions = 0;
const homeExpect = (condition, message) => { homepageAssertions++; if (!condition) throw new Error(`/: ${message}`); };
homeExpect(homepageHead.title === homepageExpectedSeo.title, 'title differs from the active homepage contract');
homeExpect(homepageHead.canonical === homepageExpectedSeo.canonical, 'canonical differs from the active homepage contract');
for (const key of ['description', 'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:url', 'og:type', 'og:site_name', 'og:locale', 'twitter:card', 'twitter:site', 'twitter:creator', 'twitter:title', 'twitter:description', 'twitter:image']) {
  const expected = key === 'description' || key === 'og:description' || key === 'twitter:description' ? homepageExpectedSeo.description
    : key === 'og:title' || key === 'twitter:title' ? homepageExpectedSeo.title
    : key === 'og:url' ? homepageExpectedSeo.canonical
    : key === 'og:type' ? homepageExpectedSeo.ogType
    : key === 'og:image' || key === 'twitter:image' ? homepageExpectedSeo.image
    : retained.metadata[key];
  homeExpect(homepageHead.metadata[key] === expected, `${key} differs from the active homepage contract`);
}
homeExpect(homepageHead.metadata.robots === 'noindex, nofollow', 'preview must remain noindex');
homeExpect(JSON.stringify(homepageHead.schemas) === JSON.stringify(homepageExpectedSeo.schemas), 'JSON-LD differs from LocalBusiness plus Organization contract');
homeExpect((homepageHtml.match(/<h1\b/g) || []).length === 1, 'must contain exactly one H1');
homeExpect(!homepageHtml.includes('data-reactroot') && !homepageHtml.includes('<astro-island'), 'contains framework hydration markup');

const sectionClasses = [...homepageHtml.matchAll(/<section class="([^"]*\bhome-(?:hero|report|services|comparison|pricing|process|cases|reviews|sectors|areas|faq|final)\b[^"]*)"/g)].map(match => match[1].match(/\bhome-(hero|report|services|comparison|pricing|process|cases|reviews|sectors|areas|faq|final)\b/)[1]);
homeExpect(sectionClasses.join(',') === 'hero,reviews,services,comparison,pricing,process,cases,sectors,areas,faq,final', `section order differs: ${sectionClasses.join(',')}`);
homeExpect((homepageHtml.match(/class="home-service-card/g) || []).length === homepageServices.length && homepageServices.length === 5, 'service-card inventory differs');
homeExpect((homepageHtml.match(/class="home-comparison-row/g) || []).length === comparison.length && comparison.length === 5, 'comparison inventory differs');
homeExpect((homepageHtml.match(/class="home-tier/g) || []).length === pricingTiers.length && pricingTiers.length === 3, 'pricing tier inventory differs');
homeExpect((homepageHtml.match(/<li><span>[1-5]<\/span><h3>/g) || []).length === processSteps.length && processSteps.length === 5, 'process inventory differs');
homeExpect((homepageHtml.match(/class="home-sector-card/g) || []).length === industries.length && industries.length === 6, 'sector inventory differs');
homeExpect((homepageHtml.match(/class="home-area-grid"/g) || []).length === 1 && serviceAreas.length === 10 && countyLinks.length === 4, 'service-area source inventory differs');
homeExpect((homepageHtml.match(/<details(?: open)?><summary>/g) || []).length === faqs.length && faqs.length === 5, 'FAQ inventory differs');

const homepageStudies = homepageCaseStudies(caseStudies);
for (const item of homepageStudies) homeExpect(homepageHtml.includes(`href="${item.href}"`), `missing selected case-study link ${item.href}`);
const rates = homepagePricing(pricingTiers, pricing);
for (const tier of rates) homeExpect(homepageText.includes(`£${tier.rate}`), `missing validated ${tier.name} rate`);
homeExpect(homepageHtml.includes('data-proof-metrics hidden') && homepageHtml.includes('data-proof-feedback hidden'), 'Proof sections must start hidden');
homeExpect(!homepageHtml.includes('data-report-response') && !homepageText.includes('80% of clients'), 'Retired or unsupported claims remain');
for (const value of ['Google Maps', 'Read our reviews', 'Herefordshire', 'Shropshire', 'Worcestershire', 'Powys']) homeExpect(homepageText.includes(value), `missing review fallback or complete county label: ${value}`);
homeExpect(homepageHtml.indexOf('data-proof-metrics') < homepageHtml.indexOf('class="home-photo-panel'), 'live call proof must precede the team photo on phones');
homeExpect(!/44 reviews|5\.0\/5|data-masthead-/.test(homepageHtml), 'no baked review rating, total or date decoration');
const selectedTestimonial = featuredTestimonial(caseStudies);
if (selectedTestimonial) homeExpect(homepageHtml.includes(`<footer><a href="${selectedTestimonial.href}">`), 'selected testimonial links to its own case study');
for (const forbidden of ['All systems operational', 'last sync 2 min ago', 'Booking new clients', 'standard agreement is 12 months']) homeExpect(!homepageText.includes(forbidden), `contains held or unsupported claim: ${forbidden}`);
homeExpect(homepageHtml.includes('href="/terms-of-business"'), 'reconciled agreement copy must link to the current terms');
homeExpect(homepageHtml.includes('href="tel:+441584517234"'), 'telephone CTA is missing');
console.log(`Homepage verified: ${homepageAssertions} head, section-order, source-inventory, unavailable-state and framework assertions passed`);
