import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { blogPosts, blogPublication, blogSlugs } from '../src/generated/blog-data.mjs';
import { ARTICLE_IMAGE_SIZES, allCategories, articleImageSrcset, featuredPosts, listingPosts, relatedPosts } from '../src/lib/blog-display.mjs';
import { SMALL_HEADING, SMALL_HEADING_CLASS, blockTokens } from '../src/lib/blog-markdown.mjs';
import { ukCalendarDate } from './lib/blog-reader.mjs';
import { missingBodyText, normalise, renderedText } from './lib/blog-rendered-text.mjs';
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';

// Focused checker for the emitted /blog family. Expectations are derived from
// the generated data, data/editorial-holds.json and an inline restatement of
// the components/SEO.tsx head formula as called by the V2 blog templates, not
// from blog-seo.mjs. Record content is compared, never printed.
const baseUrl = 'https://fresh-tech.uk';
const listingCanonical = `${baseUrl}/blog`;
const listingRawTitle = 'Blog: Plain-English IT Advice for Shropshire Businesses';
const listingDescription = 'Practical IT guides, plain-English advice and honest answers from Fresh Tech, managed IT support based in Ludlow, Shropshire.';
const defaultImage = DEFAULT_SOCIAL_IMAGE;
const organizationRef = { '@id': `${baseUrl}/#organization` };
const staticMetadata = {
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  'og:image:width': '1200', 'og:image:height': '630', 'og:site_name': 'Fresh Tech IT Support', 'og:locale': 'en_GB',
  'twitter:card': 'summary_large_image', 'twitter:site': '@fresh_tech_', 'twitter:creator': '@fresh_tech_',
};
const HTML_GZIP_BUDGET = 32 * 1024;
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
// Parsed-DOM text (scripts/lib/blog-rendered-text.mjs): inline adjacency such
// as "<strong>Bold</strong>." survives, block boundaries do not run together.
const textOf = renderedText;
const escapeAttr = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
const SEGMENT_NAMES = { blog: 'Blog', about: 'About Us', contact: 'Contact', pricing: 'Pricing', careers: 'Careers', refer: 'Refer a Business', dpa: 'Data Processing Terms', onboarding: 'Switching IT Provider', services: 'Services', industries: 'Sectors', locations: 'Locations', 'case-studies': 'Case Studies', 'why-trust-us': 'Why Trust Us', 'it-health-check': 'IT Health Check', 'microsoft-business-premium': 'Microsoft 365 Business Premium', 'ai-acceptable-use-policy': 'AI Acceptable Use Policy', 'privacy-policy': 'Privacy Policy', 'terms-conditions': 'Terms & Conditions', 'terms-of-business': 'Terms of Business', 'sub-processors': 'Sub-processors' };
const prettify = slug => SEGMENT_NAMES[slug] ?? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const fail = message => { throw new Error(message); };
let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) fail(message); };

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

function checkHead(route, html, { rawTitle, description, canonical, ogType, image, schemas }) {
  const head = readHead(html);
  const title = siteTitle(rawTitle);
  expect(head.title === title, `${route}: title differs from the React head formula`);
  expect(head.canonicals.length === 1 && head.canonicals[0] === canonical, `${route}: canonical differs from ${canonical}`);
  const expected = { ...staticMetadata, description, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'og:url': canonical, 'og:type': ogType, 'og:image': image, 'twitter:image': image };
  for (const [key, value] of Object.entries(expected)) expect(head.metadata[key] === value, `${route}: metadata ${key} differs from the React head formula`);
  expect(JSON.stringify(head.schemas) === JSON.stringify(schemas), `${route}: JSON-LD differs from the React SEO graph for this call`);
}

function checkFramework(route, html, marker) {
  expect(html.includes(marker) && html.includes('<main id="main-content"'), `${route}: missing template markers`);
  expect(!html.includes('data-reactroot') && !html.includes('<astro-island'), `${route}: contains framework hydration markup`);
  expect(!/href="\s*javascript:/i.test(html) && !/href="\s*data:/i.test(html) && !/href="\s*vbscript:/i.test(html), `${route}: unsafe link scheme emitted`);
  if (html.includes('href="/blog"')) {
    const navBlock = html.match(/<header[\s\S]*?<\/header>/)?.[0] || '';
    if (navBlock.includes('href="/blog"')) expect(navBlock.includes('href="/blog" aria-current="page"'), `${route}: Blog navigation link is not marked current`);
  }
  for (const slug of excludedSlugs) expect(!html.includes(`href="/blog/${slug}"`), `${route}: links to an unpublished post`);
}

// --- Publication and inventory -----------------------------------------------
const holds = JSON.parse(await readFile(resolve(import.meta.dirname, '..', '..', '..', 'data', 'editorial-holds.json'), 'utf8'));
const heldFromFile = new Set(holds.slugs);
const excludedSlugs = [...new Set([...blogPublication.heldSlugs, ...blogPublication.futureSlugs, ...heldFromFile])];
expect(/^\d{4}-\d{2}-\d{2}$/.test(blogPublication.asOf) && blogPublication.asOf <= ukCalendarDate(), `Publication date ${blogPublication.asOf} is malformed or in the future`);
for (const post of blogPosts) {
  expect(post.isoDate <= blogPublication.asOf, `${post.slug}: published with a date after ${blogPublication.asOf}`);
  expect(!heldFromFile.has(post.slug), `${post.slug}: published despite an editorial hold`);
}
expect(blogPublication.sourceCount === blogPosts.length + blogPublication.heldSlugs.length + blogPublication.futureSlugs.length, 'Publication counts do not reconcile with the source count');

const built = [];
for (const entry of await readdir(resolve('dist/blog'))) {
  if ((await stat(resolve('dist/blog', entry))).isDirectory()) built.push(entry);
}
const missing = blogSlugs.filter(slug => !built.includes(slug));
const unexpected = built.filter(slug => !blogSlugs.includes(slug));
expect(!missing.length && !unexpected.length, `Built blog inventory differs. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);
for (const slug of excludedSlugs) expect(!built.includes(slug), `Unpublished post ${slug} was emitted as a route`);
expect(!built.includes('scheduled'), 'Private /blog/scheduled must not be emitted by the native prototype');

// --- Listing ------------------------------------------------------------------
const sorted = listingPosts(blogPosts);
const listingHtml = await readFile(resolve('dist/blog/index.html'), 'utf8');
const listingText = textOf(listingHtml);
for (const copy of [
  'IT insights', 'No jargon · No upsell', 'The IT blog nobody asked for.',
  'Practical advice for businesses with 5–50 staff across Shropshire and Herefordshire. Written by engineers who fix the problems, not a content team.',
  'All articles', `${sorted.length} ${sorted.length === 1 ? 'article' : 'articles'}`, 'Featured articles', 'IT problem you want a straight answer to?', 'Call us. 01584 517 234. We pick up.', 'Book a free call', 'Our services',
]) expect(listingText.includes(copy), `/blog: built HTML is missing listing copy: ${copy}`);
expect(listingHtml.includes('<h1>The IT blog nobody asked for.</h1>'), '/blog: H1 is not the source heading');
const cardHrefs = [...listingHtml.matchAll(/<a class="blog-card" href="([^"]+)" data-slug="[^"]+" data-post-category="([^"]*)"/g)];
expect(JSON.stringify(cardHrefs.map(match => match[1])) === JSON.stringify(sorted.map(post => `/blog/${post.slug}`)), '/blog: card order differs from newest-first listing order');
expect(cardHrefs.every((match, index) => unescape(match[2]) === sorted[index].category), '/blog: card categories differ from tags[0] or the IT Advice fallback');
const featuredHrefs = [...listingHtml.matchAll(/<a class="blog-featured-card" href="([^"]+)"/g)].map(match => match[1]);
expect(JSON.stringify(featuredHrefs) === JSON.stringify(featuredPosts(sorted).map(post => `/blog/${post.slug}`)), '/blog: featured cards are not the first two listed posts');
const filterButtons = [...listingHtml.matchAll(/<button type="button" data-filter="([^"]*)" aria-pressed="(true|false)">/g)];
expect(filterButtons.map(match => unescape(match[1])).join('|') === allCategories(sorted).join('|'), '/blog: filter chips differ from All plus categories in listing order');
expect(filterButtons.length > 0 && filterButtons[0][2] === 'true' && filterButtons.filter(match => match[2] === 'true').length === 1, '/blog: only the All chip should be pressed at render time');
expect(/<div class="blog-filters" data-blog-filters[^>]*\bhidden[^>]*>/.test(listingHtml), '/blog: chip toolbar must be hidden until enhanced');
expect(listingHtml.includes('data-filter-count') && listingHtml.includes('data-filter-label') && listingHtml.includes('data-filter-empty') && listingHtml.includes('data-blog-featured'), '/blog: filter hooks missing');
const heroLinks = [...listingHtml.matchAll(/<a href="#all-articles" data-filter="([^"]*)"/g)].map(match => unescape(match[1]));
expect(heroLinks[0] === 'All' && heroLinks.length >= 2 && heroLinks.length <= 7 && heroLinks.slice(1).every(category => allCategories(sorted).includes(category)), '/blog: hero category browser differs from All plus the top six categories');
for (const [index, post] of sorted.entries()) {
  const cardText = textOf(listingHtml.slice(cardHrefs[index].index, cardHrefs[index + 1]?.index));
  for (const value of [post.title, post.excerpt, post.category, `${post.authorName} · ${post.date} · ${post.readTime}`]) expect(cardText.includes(normalise(value)), `/blog: card ${post.slug} is missing a source field`);
}
checkFramework('/blog', listingHtml, 'data-blog-page');
const { organization } = (() => {
  // The Organization object is site-wide; take it from any emitted route and
  // compare structurally so a drift in the shared schema still fails here.
  const schemas = readHead(listingHtml).schemas || [];
  return { organization: schemas.find(schema => schema['@type'] === 'Organization') };
})();
expect(organization && organization['@id'] === organizationRef['@id'] && organization.name === 'Fresh Tech IT Support' && organization.legalName === 'Fresh PCS Consultancy Ltd', '/blog: Organization schema missing or wrong');
const breadcrumb = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })) });
checkHead('/blog', listingHtml, {
  rawTitle: listingRawTitle, description: listingDescription, canonical: listingCanonical, ogType: 'website', image: defaultImage,
  schemas: [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: listingRawTitle, description: listingDescription, url: listingCanonical, isPartOf: organizationRef },
    organization,
    breadcrumb([['Home', `${baseUrl}/`], ['Blog', listingCanonical]]),
  ],
});

// --- Articles -------------------------------------------------------------------
const oversized = [];
const emDashRoutes = [];
for (const post of blogPosts) {
  const route = `/blog/${post.slug}`;
  const canonical = `${listingCanonical}/${post.slug}`;
  const body = await readFile(resolve('dist/blog', post.slug, 'index.html'));
  const html = body.toString('utf8');
  const text = textOf(html);
  const gzip = gzipSync(body).length;
  if (gzip > HTML_GZIP_BUDGET) oversized.push(`${route} (${gzip} gzip bytes)`);
  if (html.includes('—')) emDashRoutes.push(route);

  expect(textOf(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? '') === normalise(post.title), `${route}: H1 is not the source title`);
  for (const value of [post.excerpt, `${post.authorName} · ${post.date} · ${post.readTime}`, 'Blog', 'Got an IT question?', 'Call us. We pick up.', '20 minutes. No sales pitch. Just a straight answer to your IT question.', 'Book a 20-min call']) {
    expect(text.includes(normalise(value)), `${route}: built HTML is missing rendered source or template text`);
  }
  const heroBlock = html.match(/<section class="blog-hero blog-post-hero">([\s\S]*?)<\/section>/)?.[1] || '';
  const tagBadges = [...heroBlock.matchAll(/<span class="blog-badge blog-badge-primary">([^<]*)<\/span>/g)].map(match => unescape(match[1]));
  expect(JSON.stringify(tagBadges) === JSON.stringify(post.tags.slice(0, 3)), `${route}: hero tag badges differ from the first three source tags`);

  if (post.video) {
    expect(html.includes(`<video controls preload="none" playsinline poster="${escapeAttr(post.video.poster)}"`) && html.includes(`<source src="${escapeAttr(post.video.src)}" type="video/mp4"`), `${route}: video branch does not match source`);
    expect(post.video.maxWidth ? html.includes(`style="max-width:${post.video.maxWidth}px"`) : !html.includes('style="max-width:'), `${route}: video maxWidth branch does not match source`);
    expect(html.includes('<div class="blog-media-frame blog-media-frame-video"><video') && !html.includes('<div class="blog-media-frame blog-media-frame-image">'), `${route}: video frame missing or hero image rendered alongside the video`);
    expect(post.video.caption ? text.includes(normalise(post.video.caption)) : !html.includes('blog-media-caption'), `${route}: video caption branch does not match source`);
  } else if (post.image) {
    // The CSS frame reserves geometry; image attributes provide its fallback size.
    const image = html.match(/<div class="blog-media-frame blog-media-frame-image"><img src="([^"]+)"(?: srcset="([^"]+)" sizes="([^"]+)")? alt="([^"]*)"/);
    const srcset = articleImageSrcset(post.image);
    expect(image && (image[2] ? unescape(image[2]) : undefined) === srcset && (image[3] ? unescape(image[3]) : undefined) === (srcset && ARTICLE_IMAGE_SIZES), `${route}: hero image srcset or sizes do not match articleImageSrcset`);
    expect(image && unescape(image[1]) === post.image && unescape(image[4]) === (post.imageAlt || post.title), `${route}: hero image branch does not match source or lacks the reserving frame`);
    expect(!html.includes('<video'), `${route}: video rendered without a source video`);
  } else {
    expect(!html.includes('class="blog-media-section"'), `${route}: media section rendered without image or video`);
  }

  // Body: every rendered block's text, element counts and link targets.
  const article = html.match(/<article class="blog-article">([\s\S]*?)<\/article>/)?.[1] ?? fail(`${route}: article body missing`);
  // Expected text comes from blockTokens, so the documented list-item emoji
  // rule in blog-markdown.mjs applies to both sides of the comparison.
  const blocks = blockTokens(post.content);
  const count = pattern => (article.match(pattern) || []).length;
  const inlineOf = block => block.type === 'table' ? [...block.header.flat(), ...block.rows.flat(2)] : block.type === 'ul' || block.type === 'ol' ? block.items.flat() : block.children;
  const missingText = missingBodyText(article, blocks);
  expect(!missingText.length, `${route}: rendered body is missing source text from ${missingText.map(item => `a ${item.type} block`).join(', ')}`);
  for (const block of blocks) {
    for (const token of inlineOf(block)) {
      if (token.type === 'link') expect(article.includes(`href="${escapeAttr(token.href)}"`) && (!token.external || article.includes(`href="${escapeAttr(token.href)}" target="_blank" rel="noopener noreferrer"`)), `${route}: link target or external attributes differ from source`);
      if (token.type === 'code') expect(article.includes(`<code>${token.value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</code>`), `${route}: inline code content differs from source`);
    }
  }
  const expectedCounts = { h2: blocks.filter(block => block.type === 'h2').length, h3: blocks.filter(block => block.type === 'h3').length, table: blocks.filter(block => block.type === 'table').length, ul: blocks.filter(block => block.type === 'ul').length, ol: blocks.filter(block => block.type === 'ol').length, p: blocks.filter(block => block.type === 'p').length };
  // Promoted orphan headings are emitted as <h2 class="..."> so the H2 count
  // matches the tag with or without attributes; every other element stays exact.
  expect(count(/<h2(?:\s[^>]*)?>/g) === expectedCounts.h2 && count(/<h3>/g) === expectedCounts.h3 && count(/<table>/g) === expectedCounts.table && count(/<ul>/g) === expectedCounts.ul && count(/<ol>/g) === expectedCounts.ol && count(/<p>/g) === expectedCounts.p, `${route}: block element counts differ from the source Markdown`);
  const smallHeadings = blocks.filter(block => block.type === 'h2' && block.presentation === SMALL_HEADING).length;
  expect(count(new RegExp(`<h2 class="${SMALL_HEADING_CLASS}">`, 'g')) === smallHeadings && count(/<h2 [^>]*>/g) === smallHeadings, `${route}: small-presentation H2 count differs from the promoted orphan ### headings`);
  // Independent of blockTokens: the emitted outline itself must never skip a
  // level (H1 hero, then H2 before any H3), whatever the tokeniser decided.
  const outline = [...article.matchAll(/<h([23])(?:\s[^>]*)?>/g)].map(match => Number(match[1]));
  expect(outline.every((level, index) => level <= (index === 0 ? 2 : outline[index - 1] + 1)), `${route}: article heading outline skips a level (${outline.join(',')})`);
  expect(count(/<li>/g) === blocks.filter(block => block.type === 'ul' || block.type === 'ol').reduce((sum, block) => sum + block.items.length, 0), `${route}: list item count differs from source`);
  expect(count(/<tr>/g) === blocks.filter(block => block.type === 'table').reduce((sum, block) => sum + 1 + block.rows.length, 0), `${route}: table row count differs from source`);
  expect(count(/<strong>/g) === blocks.flatMap(inlineOf).filter(token => token.type === 'strong').length, `${route}: strong element count differs from the source bold tokens`);

  const relatedBlock = html.match(/<div class="blog-related-grid">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/)?.[1] || '';
  const relatedHrefs = [...relatedBlock.matchAll(/<a class="blog-related-card" href="([^"]+)"/g)].map(match => match[1]);
  const expectedRelated = relatedPosts(blogPosts, post.slug);
  expect(JSON.stringify(relatedHrefs) === JSON.stringify(expectedRelated.map(other => `/blog/${other.slug}`)), `${route}: related articles differ from the first three other published posts in source order`);
  for (const other of expectedRelated) expect(textOf(relatedBlock).includes(normalise(other.title)) && textOf(relatedBlock).includes(normalise(other.excerpt)), `${route}: related card text differs from source`);
  expect(html.includes('href="/blog"') && html.includes('href="/contact"'), `${route}: back link or conversion link missing`);
  checkFramework(route, html, `data-blog-post="${post.slug}"`);

  const schemas = [{
    '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt,
    ...(post.image ? { image: post.image } : {}),
    url: canonical, author: organizationRef, publisher: organizationRef, mainEntityOfPage: canonical, datePublished: post.isoDate, dateModified: post.isoDate,
  }];
  if (post.video) {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'VideoObject', name: post.video.title || post.title, description: post.video.caption || post.excerpt,
      thumbnailUrl: [post.video.poster, post.image].filter(Boolean), contentUrl: post.video.src, uploadDate: post.isoDate,
      ...(post.video.duration ? { duration: post.video.duration } : {}), publisher: organizationRef,
    });
  }
  schemas.push(organization, breadcrumb([['Home', `${baseUrl}/`], ['Blog', listingCanonical], [prettify(post.slug), canonical]]));
  checkHead(route, html, {
    rawTitle: post.title, description: post.excerpt, canonical, ogType: 'article',
    image: post.image ? (post.image.startsWith('http') ? post.image : `${baseUrl}${post.image}`) : defaultImage, schemas,
  });
}

console.log(`/blog listing and ${blogPosts.length} published blog routes verified as of ${blogPublication.asOf} UK: ${assertions} publication, inventory, content, head and framework assertions passed; ${excludedSlugs.length} held or future slugs confirmed absent`);
if (oversized.length) console.warn(`Warning: ${oversized.length} article route(s) exceed the ${HTML_GZIP_BUDGET}-byte gzip HTML budget enforced by check-emitted-html-quality (long-post exceptions to review, budget not raised):\n  ${oversized.join('\n  ')}`);
if (emDashRoutes.length) console.warn(`Warning: em dash present in emitted copy on ${emDashRoutes.length} route(s) (source punctuation, not rewritten; the quality gate will reject these):\n  ${emDashRoutes.join('\n  ')}`);
