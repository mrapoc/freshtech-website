import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { industries, industryRouteAliases } from '../src/generated/industries-data.mjs';
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';

// Focused checker for the emitted /industries family. Expectations are derived
// from the generated data and an inline restatement of the components/SEO.tsx
// head formula, not from the SEO module under test or any retained fixture.
const baseUrl = 'https://fresh-tech.uk';
const listingCanonical = `${baseUrl}/industries`;
const listingRawTitle = 'Sectors We Work With: Specialist IT Support';
const listingDescription = 'Specialist IT support for solicitors, accountants, healthcare, manufacturing, charities and more, across Shropshire, Herefordshire and the Welsh Borders.';
const staticMetadata = {
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  'og:image': DEFAULT_SOCIAL_IMAGE,
  'og:image:width': '1200', 'og:image:height': '630', 'og:type': 'website', 'og:site_name': 'Fresh Tech IT Support', 'og:locale': 'en_GB',
  'twitter:card': 'summary_large_image', 'twitter:site': '@fresh_tech_', 'twitter:creator': '@fresh_tech_',
};
staticMetadata['twitter:image'] = staticMetadata['og:image'];
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const textOf = value => unescape(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim());
const visibleSource = value => value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replaceAll('**', '');
const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
const prettify = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const fail = message => { throw new Error(message); };

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

function checkHead(route, html, { rawTitle, description, canonical, breadcrumbs }) {
  const head = readHead(html);
  const title = siteTitle(rawTitle);
  if (head.title !== title) fail(`${route}: title "${head.title}" differs from the React head formula "${title}"`);
  if (head.canonicals.length !== 1 || head.canonicals[0] !== canonical) fail(`${route}: canonical differs from ${canonical}`);
  const expected = { ...staticMetadata, description, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'og:url': canonical };
  for (const [key, value] of Object.entries(expected)) if (head.metadata[key] !== value) fail(`${route}: metadata ${key} differs from the React head formula`);
  if (!Array.isArray(head.schemas) || head.schemas.length !== 4) fail(`${route}: expected a four-schema JSON-LD graph`);
  const [service, localBusiness, organization, breadcrumb] = head.schemas;
  if (service['@type'] !== 'Service' || service.name !== rawTitle || service.description !== description || service.url !== canonical || service.provider?.['@id'] !== `${baseUrl}/#localbusiness`) fail(`${route}: Service schema differs from the React service formula`);
  if (JSON.stringify(service.areaServed?.map(area => area.name)) !== JSON.stringify(['Shropshire', 'Herefordshire', 'Worcestershire', 'Powys'])) fail(`${route}: Service areaServed differs`);
  if (JSON.stringify(localBusiness['@type']) !== JSON.stringify(['LocalBusiness', 'ProfessionalService']) || localBusiness['@id'] !== `${baseUrl}/#localbusiness`) fail(`${route}: LocalBusiness schema missing or wrong`);
  if (organization['@type'] !== 'Organization' || organization['@id'] !== `${baseUrl}/#organization`) fail(`${route}: Organization schema missing or wrong`);
  if (breadcrumb['@type'] !== 'BreadcrumbList') fail(`${route}: BreadcrumbList schema missing`);
  const items = breadcrumb.itemListElement.map((item, index) => [item['@type'], item.position, item.name, item.item]);
  const expectedItems = breadcrumbs.map(([name, item], index) => ['ListItem', index + 1, name, item]);
  if (JSON.stringify(items) !== JSON.stringify(expectedItems)) fail(`${route}: breadcrumb differs from the React auto-breadcrumb formula`);
  if (head.schemas.some(schema => schema['@type'] === 'FAQPage')) fail(`${route}: added FAQ schema absent from the React source call`);
  return Object.keys(expected).length + 8;
}

function checkFramework(route, html, marker) {
  if (!html.includes(marker) || !html.includes('<main id="main-content"')) fail(`${route}: missing template markers`);
  if (html.includes('data-reactroot') || html.includes('<astro-island')) fail(`${route}: contains framework hydration markup`);
  if (html.includes('—')) fail(`${route}: contains an em dash`);
  for (const [alias] of Object.entries(industryRouteAliases)) {
    if (html.includes(`href="/industries/${alias}"`)) fail(`${route}: links to alias route /industries/${alias}`);
  }
  return 3;
}

const sourceSlugs = industries.map(industry => industry.slug);
const built = [];
for (const entry of await readdir(resolve('dist/industries'))) {
  if ((await stat(resolve('dist/industries', entry))).isDirectory()) built.push(entry);
}
const missing = sourceSlugs.filter(slug => !built.includes(slug));
const unexpected = built.filter(slug => !sourceSlugs.includes(slug));
if (missing.length || unexpected.length) fail(`Built industry inventory differs. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);
for (const alias of Object.keys(industryRouteAliases)) if (built.includes(alias)) fail(`Alias ${alias} was emitted as a duplicate route`);

let assertions = 0;
const listingHtml = await readFile(resolve('dist/industries/index.html'), 'utf8');
const listingText = textOf(listingHtml);
for (const copy of ['We probably know your software.', 'Sectors with dedicated pages', 'Sectors with a dedicated page', 'Call us anyway.', `${industries.length} Sectors with dedicated pages`]) {
  if (!listingText.includes(copy)) fail(`/industries: built HTML is missing listing copy: ${copy}`);
  assertions++;
}
const cardHrefs = [...listingHtml.matchAll(/class="industry-sector-card" href="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(cardHrefs) !== JSON.stringify(sourceSlugs.map(slug => `/industries/${slug}`))) fail('/industries: sector cards differ from source order');
for (const industry of industries) {
  for (const value of [industry.name, industry.desc]) if (!listingText.includes(visibleSource(value))) fail(`/industries: missing card text: ${value}`);
}
assertions += 1 + industries.length * 2;
assertions += checkFramework('/industries', listingHtml, 'data-industries-page');
assertions += checkHead('/industries', listingHtml, { rawTitle: listingRawTitle, description: listingDescription, canonical: listingCanonical, breadcrumbs: [['Home', `${baseUrl}/`], ['Sectors', listingCanonical]] });

for (const industry of industries) {
  const route = `/industries/${industry.slug}`;
  const html = await readFile(resolve('dist/industries', industry.slug, 'index.html'), 'utf8');
  const text = textOf(html);
  const sector = industry.name.toLowerCase();
  const sourceValues = [
    industry.h1, industry.intro,
    ...industry.challenges.flatMap(card => [card.title, card.desc]),
    ...industry.solutions.flatMap(card => [card.title, card.desc]),
    ...industry.faqs.flatMap(faq => [faq.q, faq.a]),
    `We work with ${sector}`, `${industry.minStaff ?? 5}+`, `Staff: typical client size in ${sector}`, `What ${sector} deal with`, `Questions from ${sector}`,
    'We know your problems', 'How we solve them', 'Specific to your sector', 'Other sectors we support', 'View all sectors', "Not sure if we're right for your sector?",
  ];
  for (const value of sourceValues) {
    if (!text.includes(visibleSource(value))) fail(`${route}: built HTML is missing rendered source text: ${visibleSource(value)}`);
  }
  if ((html.match(/class="industry-card"/g) || []).length !== industry.challenges.length) fail(`${route}: challenge count differs from source`);
  if ((html.match(/class="industry-card industry-solution-card"/g) || []).length !== industry.solutions.length) fail(`${route}: solution count differs from source`);
  if ((html.match(/<details>/g) || []).length !== industry.faqs.length) fail(`${route}: FAQ count differs from source`);
  const related = industries.filter(other => other.slug !== industry.slug).slice(0, 3).map(other => `/industries/${other.slug}`);
  const relatedBlock = html.match(/<div class="industry-related-links">([\s\S]*?)<\/div>/)?.[1] || '';
  const relatedHrefs = [...relatedBlock.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  if (JSON.stringify(relatedHrefs) !== JSON.stringify([...related, '/industries'])) fail(`${route}: related sector links differ from the first three other source records`);
  if (!html.includes('href="#challenges"') || !html.includes('id="challenges"')) fail(`${route}: in-page anchor is broken`);
  assertions += sourceValues.length + 5;
  assertions += checkFramework(route, html, `data-industry-page="${industry.slug}"`);
  assertions += checkHead(route, html, {
    rawTitle: industry.title, description: industry.metaDesc, canonical: `${listingCanonical}/${industry.slug}`,
    breadcrumbs: [['Home', `${baseUrl}/`], ['Sectors', listingCanonical], [prettify(industry.slug), `${listingCanonical}/${industry.slug}`]],
  });
}

console.log(`/industries listing and ${industries.length} source-derived industry routes verified: ${assertions} content, inventory, head and framework assertions passed; aliases ${Object.keys(industryRouteAliases).join(', ')} not emitted`);
