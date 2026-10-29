import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultImage, guideArticleSchema, guideCanonical, guideRawTitle, guideSeo, productionRobots } from './guide-seo.mjs';

const guide = { slug: 'test-sector', industry: 'Test Sector', title: 'Test Sector IT Guide', metaDesc: 'Free IT guide for test sector firms.' };

test('guide head: Free Guide title formula, metaDesc, canonical, default image and website og:type', () => {
  const seo = guideSeo(guide);
  assert.equal(seo.rawTitle, 'Test Sector IT Guide | Free Guide');
  assert.equal(seo.title, 'Test Sector IT Guide | Free Guide | Fresh Tech IT Support');
  assert.equal(seo.description, guide.metaDesc);
  assert.equal(seo.canonical, 'https://fresh-tech.uk/guides/test-sector');
  assert.equal(seo.canonical, guideCanonical('test-sector'));
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website', 'type is not passed in the source, so og:type stays website despite the Article schema');
  assert.equal('robots' in seo, false, 'the preview keeps the BaseLayout noindex default; the production directive is exported separately');
  assert.equal(productionRobots, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
});

test('guide graph: verbatim page Article, then Organization, then the auto breadcrumb Home > Guides > slug', () => {
  const seo = guideSeo(guide);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'Organization', 'BreadcrumbList']);
  assert.deepEqual(seo.schemas[0], {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Test Sector IT Guide',
    description: guide.metaDesc,
    author: { '@type': 'Organization', name: 'Fresh Tech IT Support', '@id': 'https://fresh-tech.uk/#organization', url: 'https://fresh-tech.uk' },
    publisher: { '@type': 'Organization', name: 'Fresh Tech IT Support', logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png' } },
    articleSection: 'Industry Guides',
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
  });
  assert.deepEqual(Object.keys(seo.schemas[0]), ['@context', '@type', 'headline', 'description', 'author', 'publisher', 'articleSection', 'inLanguage', 'isAccessibleForFree'], 'key order matches the source pageSchema');
  assert.deepEqual(seo.schemas[0], guideArticleSchema(guide));
  assert.equal('url' in seo.schemas[0], false, 'the source Article has no url, image, dates or mainEntityOfPage');
  assert.equal(seo.schemas[1]['@id'], 'https://fresh-tech.uk/#organization');
  assert.equal(seo.schemas.some(schema => Array.isArray(schema['@type']) && schema['@type'].includes('LocalBusiness')), false, 'an explicit schema prop replaces the type-based LocalBusiness default');
  assert.deepEqual(seo.schemas[2].itemListElement.map(item => [item.position, item.name, item.item]), [
    [1, 'Home', 'https://fresh-tech.uk/'], [2, 'Guides', 'https://fresh-tech.uk/guides'], [3, 'Test Sector', seo.canonical],
  ]);
});

test('breadcrumb names use the SEO component fallback for hyphenated slugs and mapped segments', () => {
  const renewable = guideSeo({ ...guide, slug: 'renewable-energy' });
  assert.equal(renewable.schemas[2].itemListElement[2].name, 'Renewable Energy');
  const retail = guideSeo({ ...guide, slug: 'retail-distribution' });
  assert.equal(retail.schemas[2].itemListElement[2].name, 'Retail Distribution', 'the ampersand in the industry name is not recoverable from the slug, as in React');
  const mapped = guideSeo({ ...guide, slug: 'about' });
  assert.equal(mapped.schemas[2].itemListElement[2].name, 'About Us', 'a slug matching a SEGMENT_NAMES key breadcrumbs the mapped way');
});

test('title cap applies to the Free Guide raw title progressively', () => {
  const title = rawGuideTitle => guideSeo({ ...guide, title: rawGuideTitle }).title;
  // guideRawTitle adds " | Free Guide" (13 chars); the long suffix adds 24, the short 13.
  assert.equal(guideRawTitle('X'), 'X | Free Guide');
  const synthetic = length => 'Guide'.padEnd(length, 'x');
  const fitsLong = synthetic(28); // 28 + 13 + 24 = 65
  assert.equal(title(fitsLong), `${fitsLong} | Free Guide | Fresh Tech IT Support`);
  assert.equal(title(fitsLong).length, 65);
  const fitsShort = synthetic(29); // 29 + 13 + 24 = 66 > 65; 29 + 13 + 13 = 55
  assert.equal(title(fitsShort), `${fitsShort} | Free Guide | Fresh Tech`);
  const atCap = synthetic(39); // 39 + 13 + 13 = 65
  assert.equal(title(atCap), `${atCap} | Free Guide | Fresh Tech`);
  const overCap = synthetic(40); // 40 + 13 + 13 = 66
  assert.equal(title(overCap), `${overCap} | Free Guide`);
  // Real source title: "Engineer's IT Performance Guide" (31 chars) takes the short suffix.
  assert.equal(title("Engineer's IT Performance Guide"), "Engineer's IT Performance Guide | Free Guide | Fresh Tech");
});

test('rejects incomplete input', () => {
  assert.throws(() => guideSeo(), /requires a guide/);
  assert.throws(() => guideSeo({ slug: 'a', title: 'T' }), /requires a guide/);
  assert.throws(() => guideSeo({ slug: 'a', metaDesc: 'D' }), /requires a guide/);
});
