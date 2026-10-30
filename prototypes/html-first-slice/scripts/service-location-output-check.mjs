import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { serviceLocations, serviceLocationSlugs } from '../src/generated/service-locations-data.mjs';
import { normalise, renderedText } from './lib/blog-rendered-text.mjs';
import { serviceLocationInventory } from './lib/service-location-inventory.mjs';
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';
import { loadRetainedReactHead } from './lib/retained-react-head.mjs';

// Focused checker for the emitted root-slug service-location family.
// Expectations are derived from the generated records,
// the retained React Organization fixture, and inline
// restatements of the components/SEO.tsx head formula, the React page's schema
// objects, its county-hub rule and the components/RichText.tsx block rules.
// Nothing here imports the SEO, display or rich-text modules under test.
// Record content is compared, never printed.
const baseUrl = 'https://fresh-tech.uk';
const defaultImage = DEFAULT_SOCIAL_IMAGE;
const staticMetadata = {
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  'og:image': defaultImage, 'og:image:width': '1200', 'og:image:height': '630', 'og:type': 'website', 'og:site_name': 'Fresh Tech IT Support', 'og:locale': 'en_GB',
  'twitter:card': 'summary_large_image', 'twitter:site': '@fresh_tech_', 'twitter:creator': '@fresh_tech_', 'twitter:image': defaultImage,
};
const HTML_GZIP_BUDGET = 32 * 1024;
// Source sanity and county computation only. Emitted family ownership is
// decided by the <main> marker (see lib/service-location-inventory.mjs), so a
// standalone page such as /microsoft-365-plans-compared is never claimed.
const ROUTE_PREFIX = /^(it-support|cyber-essentials|microsoft-365)-([a-z0-9-]+)$/;
const TOWN_TO_COUNTY = { ludlow: 'shropshire', shrewsbury: 'shropshire', telford: 'shropshire', hereford: 'herefordshire', worcester: 'worcestershire', kidderminster: 'worcestershire' };
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const escapeAttr = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const textOf = renderedText;
// Visible text of a Markdown source string as the React page would show it:
// link labels stay, markers go. Em markers are only removed for real *em* runs.
const visibleSource = value => value.replace(/\[(.*?)\]\((.*?)\)/g, '$1').replace(/\*\*([^*]+?)\*\*/g, '$1').replace(/\*([^*]+?)\*/g, (match, inner) => (match.length > 2 ? inner : match));
const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
const prettify = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const fail = message => { throw new Error(message); };
let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) fail(message); };

// --- Inline restatement of components/RichText.tsx block rules --------------
const isBullet = line => line.trim().startsWith('-') || line.trim().startsWith('•');
const isNumbered = line => /^\d+\./.test(line.trim());
function richTextExpectation(text) {
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
    for (const match of paragraph.matchAll(/\[(.*?)\]\((.*?)\)/g)) expectation.links.push({ href: match[2], external: match[2].startsWith('http') });
  }
  return expectation;
}
function checkRichBlock(route, label, blockHtml, source) {
  const expected = richTextExpectation(source);
  const count = pattern => (blockHtml.match(pattern) || []).length;
  expect(count(/<p>/g) === expected.p && count(/<ul>/g) === expected.ul && count(/<ol>/g) === expected.ol && count(/<li>/g) === expected.li, `${route}: ${label} block element counts differ from the RichText paragraph/list rules`);
  expect(count(/<br\s*\/?>/g) === expected.br, `${route}: ${label} single line breaks differ from the source`);
  const text = textOf(blockHtml);
  for (const piece of expected.pieces) expect(text.includes(normalise(piece)), `${route}: ${label} is missing rendered source text`);
  for (const link of expected.links) {
    expect(blockHtml.includes(`href="${escapeAttr(link.href)}"`), `${route}: ${label} is missing a source link target`);
    if (link.external) expect(blockHtml.includes(`href="${escapeAttr(link.href)}" target="_blank" rel="noopener noreferrer"`), `${route}: ${label} external link lacks the React attributes`);
    else expect(!new RegExp(`href="${escapeAttr(link.href).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" target=`).test(blockHtml), `${route}: ${label} internal link opened in a new tab`);
  }
  expect(!/href="\s*(?:javascript|data|vbscript):/i.test(blockHtml), `${route}: ${label} emitted an unsafe link scheme`);
}

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

// --- Inventory: records and emitted directories --------------------------------
expect(serviceLocationSlugs.length > 0 && new Set(serviceLocationSlugs).size === serviceLocationSlugs.length, 'no (or duplicate) service-location slugs');
expect(JSON.stringify(serviceLocations.map(page => page.slug)) === JSON.stringify(serviceLocationSlugs), 'generated slug list is not the record order');
for (const slug of serviceLocationSlugs) expect(ROUTE_PREFIX.test(slug), `${slug}: not a service-prefixed root slug`);

// Every emitted dist/**/index.html is parsed; a page is family only when its
// <main> carries data-service-location-page, and that marker must equal the
// exact emitted path.
const distDir = resolve('dist');
const builtPages = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
  builtPages.push({ route, html: await readFile(resolve(entry.parentPath, entry.name), 'utf8') });
}
expect(builtPages.length > 0, 'no built dist/**/index.html pages found; run the build first');
const inventory = serviceLocationInventory(builtPages, serviceLocationSlugs);
expect(!inventory.missing.length && !inventory.unexpected.length && !inventory.mismatched.length, `Built service-location inventory differs. Missing: [${inventory.missing.join(', ')}]. Unexpected: [${inventory.unexpected.join(', ')}]. Marker/route mismatch: [${inventory.mismatched.join(', ')}]`);

// Organization: the site-wide object retained from the React head fixture.
const retained = await loadRetainedReactHead();
const organization = retained.schemas[2];
expect(organization?.['@type'] === 'Organization' && organization['@id'] === `${baseUrl}/#organization`, 'retained fixture no longer holds the Organization object at index 2');

// --- Routes ------------------------------------------------------------------
const oversized = [];
let hubLinks = 0;
for (const page of serviceLocations) {
  const route = `/${page.slug}`;
  const canonical = `${baseUrl}/${page.slug}`;
  const body = await readFile(resolve('dist', page.slug, 'index.html'));
  const html = body.toString('utf8');
  const text = textOf(html);
  const gzip = gzipSync(body).length;
  if (gzip > HTML_GZIP_BUDGET) oversized.push(`${route} (${gzip} gzip bytes)`);

  // Framework and template markers.
  expect(html.includes(`data-service-location-page="${page.slug}"`) && html.includes('<main id="main-content"'), `${route}: missing template markers`);
  expect(html.includes(`data-county="${page.isCounty ? 'true' : 'false'}"`), `${route}: county flag differs from source`);
  expect(!html.includes('data-reactroot') && !html.includes('<astro-island'), `${route}: contains framework hydration markup`);
  expect(!html.includes('—'), `${route}: contains an em dash`);
  expect(!/href="\s*(?:javascript|data|vbscript):/i.test(html), `${route}: unsafe link scheme emitted`);
  const header = html.match(/<header[\s\S]*?<\/header>/)?.[0] || '';
  expect(header && !header.includes('aria-current="page"'), `${route}: a navigation item is marked current on a root-slug route`);

  // Hero: breadcrumb, badge, H1, intro, calls to action, review panel.
  expect(textOf(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? '') === normalise(page.h1), `${route}: H1 is not the source h1`);
  const crumbs = html.match(/<nav class="sl-breadcrumbs" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/)?.[1] ?? fail(`${route}: breadcrumb missing`);
  expect(JSON.stringify([...crumbs.matchAll(/href="([^"]+)"/g)].map(match => match[1])) === JSON.stringify(['/', '/services', `/services/${page.relatedService}`]), `${route}: breadcrumb links differ from Services > service > location`);
  expect(JSON.stringify([...crumbs.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => textOf(match[1]))) === JSON.stringify(['Home', 'Services', normalise(page.service), normalise(page.location)]), `${route}: breadcrumb labels differ from source`);
  expect(crumbs.includes('aria-current="page"'), `${route}: current breadcrumb not marked`);
  expect(textOf(html.match(/<p class="sl-badge">([\s\S]*?)<\/p>/)?.[1] ?? '') === normalise(`${page.location}${page.isCounty ? '' : ', Welsh Borders'}`), `${route}: location badge differs from the county/town rule`);
  for (const value of [
    page.intro, page.localContext, 'Local expertise', 'Why local matters', `Why ${page.location} businesses choose Fresh Tech`,
    `${page.service} in ${page.location}`, 'Common questions', 'Ready to talk?', `${page.service} for ${page.location} businesses`,
    "20 minutes. No sales pitch. We'll tell you honestly whether we're a fit.", 'Book a 20-min call', '01584 517 234',
    'Reviews', 'Read customer feedback on Google', 'Ludlow HQ ·', 'Engineers across the Welsh Borders',
    `See ${page.service} details`, `All services in ${page.location}`,
    ...page.benefits.flatMap(benefit => [benefit.title, benefit.desc]),
    ...page.faqs.flatMap(faq => [visibleSource(faq.q), visibleSource(faq.a)]),
  ]) expect(text.includes(normalise(value)), `${route}: built HTML is missing rendered source or template text`);
  expect((html.match(/href="\/contact"/g) || []).length >= 2 && (html.match(/href="tel:\+441584517234"/g) || []).length >= 2, `${route}: hero or closing conversion links missing`);

  // Benefits: count, order and accent cycle.
  const cards = [...html.matchAll(/<article class="sl-benefit-card" data-tone="([^"]+)">([\s\S]*?)<\/article>/g)];
  expect(cards.length === page.benefits.length, `${route}: benefit card count differs from source`);
  expect(JSON.stringify(cards.map(match => match[1])) === JSON.stringify(page.benefits.map((benefit, index) => ['accent', 'primary', 'green', 'yellow'][index % 4])), `${route}: benefit accent order differs from the React cycle`);
  cards.forEach((match, index) => {
    expect(textOf(match[2].match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? '') === normalise(page.benefits[index].title), `${route}: benefit ${index} title differs`);
    expect(match[2].includes('<svg') && match[2].includes('aria-hidden="true"'), `${route}: benefit ${index} icon is not a decorative SVG`);
  });

  // RichText content card and FAQ answers.
  const richBlocks = [...html.matchAll(/<div class="sl-rich(?: sl-faq-answer)?">([\s\S]*?)<\/div>/g)].map(match => match[1]);
  expect(richBlocks.length === 1 + page.faqs.length, `${route}: expected one content block and ${page.faqs.length} FAQ answer blocks`);
  checkRichBlock(route, 'content', richBlocks[0], page.content);
  const details = [...html.matchAll(/<details>([\s\S]*?)<\/details>/g)];
  expect(details.length === page.faqs.length, `${route}: FAQ count differs from source`);
  details.forEach((match, index) => {
    const summary = match[1].match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? fail(`${route}: FAQ ${index} summary missing`);
    const question = textOf(summary.match(/<span>([\s\S]*?)<\/span>/)?.[1] ?? '');
    expect(question === normalise(visibleSource(page.faqs[index].q)), `${route}: FAQ ${index} question differs from source`);
    expect(/<b aria-hidden="true">\+<\/b>/.test(summary), `${route}: FAQ ${index} summary lacks the decorative aria-hidden plus marker`);
    checkRichBlock(route, `FAQ ${index} answer`, richBlocks[index + 1], page.faqs[index].a);
  });

  // Related links: county hub (town pages with an existing same-service hub), service, location.
  const serviceMatch = page.slug.match(ROUTE_PREFIX);
  const county = !page.isCounty && serviceMatch ? TOWN_TO_COUNTY[serviceMatch[2]] : undefined;
  const hub = county && serviceLocationSlugs.includes(`${serviceMatch[1]}-${county}`) ? `${serviceMatch[1]}-${county}` : null;
  const related = html.match(/<nav class="sl-container sl-related-links" aria-label="Related pages">([\s\S]*?)<\/nav>/)?.[1] ?? fail(`${route}: related links missing`);
  const relatedHrefs = [...related.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  expect(JSON.stringify(relatedHrefs) === JSON.stringify([...(hub ? [`/${hub}`] : []), `/services/${page.relatedService}`, `/locations/${page.relatedLocation}`]), `${route}: related links differ from the county-hub, service and location rule`);
  if (hub) {
    hubLinks++;
    const hubPage = serviceLocations.find(other => other.slug === hub);
    expect(related.includes(`data-county-hub="${hub}"`) && textOf(related).includes(normalise(`${page.service} across ${hubPage.location}`)), `${route}: county hub link text differs from source`);
  } else expect(!related.includes('data-county-hub'), `${route}: county hub link emitted without a hub`);

  // Head: SEO component formula with the page's explicit schema array.
  const head = readHead(html);
  const title = siteTitle(page.title);
  expect(head.title === title, `${route}: title differs from the React head formula`);
  expect(head.canonicals.length === 1 && head.canonicals[0] === canonical, `${route}: canonical differs from ${canonical}`);
  const expectedMetadata = { ...staticMetadata, description: page.metaDesc, 'og:title': title, 'twitter:title': title, 'og:description': page.metaDesc, 'twitter:description': page.metaDesc, 'og:url': canonical };
  for (const [key, value] of Object.entries(expectedMetadata)) expect(head.metadata[key] === value, `${route}: metadata ${key} differs from the React head formula`);
  const expectedSchemas = [
    {
      '@context': 'https://schema.org', '@type': 'Service', name: `${page.service} - ${page.location}`, description: page.metaDesc,
      provider: { '@type': 'LocalBusiness', name: 'Fresh Tech IT Support', '@id': `${baseUrl}/#organization`, telephone: '+441584517234', email: 'hello@fresh-tech.uk', address: { '@type': 'PostalAddress', addressLocality: 'Ludlow', addressRegion: 'Shropshire', addressCountry: 'GB' } },
      areaServed: { '@type': 'AdministrativeArea', name: page.location }, serviceType: page.service,
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') } })) },
    organization,
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` }, { '@type': 'ListItem', position: 2, name: prettify(page.slug), item: canonical }] },
  ];
  expect(JSON.stringify(head.schemas) === JSON.stringify(expectedSchemas), `${route}: JSON-LD differs from the React Service, FAQPage, Organization and breadcrumb graph`);
}

console.log(`${serviceLocations.length} root-slug service-location routes verified (${serviceLocationSlugs.join(', ')}): ${assertions} inventory, content, RichText, related-link, head and framework assertions passed; ${hubLinks} town routes link to a county hub`);
if (oversized.length) console.warn(`Warning: ${oversized.length} route(s) exceed the ${HTML_GZIP_BUDGET}-byte gzip HTML budget enforced by check-emitted-html-quality (budget not raised):\n  ${oversized.join('\n  ')}`);
