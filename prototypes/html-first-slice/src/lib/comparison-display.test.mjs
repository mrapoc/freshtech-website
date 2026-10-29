import assert from 'node:assert/strict';
import test from 'node:test';
import { ICON_MAP_KEYS, breadcrumbItems, comparisonIconNodes, iconName, isRecommended } from './comparison-display.mjs';
import { comparisonSeo, defaultImage, indexRobots } from './comparison-seo.mjs';

// Synthetic page only; shapes follow pages/ComparisonPage.tsx.
const page = {
  slug: 'a-vs-b', title: 'A vs B - Which Is Right?', metaDesc: 'A test description.', h1: 'A vs B: The Test',
  faqs: [{ q: 'Which?', a: 'See [pricing](/pricing) and **B**.' }],
};

test('only the last of three or more options is recommended', () => {
  assert.deepEqual([0, 1].map(index => isRecommended(index, 2)), [false, false]);
  assert.deepEqual([0, 1, 2].map(index => isRecommended(index, 3)), [false, false, true]);
  assert.deepEqual([0, 1, 2, 3].map(index => isRecommended(index, 4)), [false, false, false, true]);
});

test('icons follow the React iconMap with a CheckCircle fallback and every glyph is drawable', () => {
  assert.deepEqual(ICON_MAP_KEYS, ['Shield', 'Cloud', 'Monitor', 'Wrench', 'User', 'Users', 'CheckCircle']);
  assert.equal(iconName('User'), 'User');
  assert.equal(iconName('Zap'), 'CheckCircle', 'a problem-family glyph outside the comparison iconMap still falls back');
  assert.equal(iconName('user'), 'CheckCircle');
  for (const name of [...ICON_MAP_KEYS, 'XCircle', 'ChevronDown', 'ChevronUp']) assert.ok(comparisonIconNodes(name).length >= 1);
  assert.throws(() => comparisonIconNodes('__proto__'), /No comparison glyph/);
});

test('breadcrumbs are Home, Resources and the unlinked h1', () => {
  assert.deepEqual(breadcrumbItems(page), [['Home', '/'], ['Resources', '/resources'], ['A vs B: The Test', null]]);
});

test('head follows the SEO call with ComparisonPage\'s own Article object', () => {
  const seo = comparisonSeo(page);
  assert.equal(seo.title, 'A vs B - Which Is Right? | Fresh Tech IT Support');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/a-vs-b');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'FAQPage', 'Organization', 'BreadcrumbList']);
  assert.deepEqual(seo.schemas[0], {
    '@context': 'https://schema.org', '@type': 'Article', headline: page.h1, description: page.metaDesc,
    author: { '@type': 'Organization', name: 'Fresh Tech' },
    publisher: { '@type': 'Organization', name: 'Fresh Tech', logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png' } },
  });
  assert.equal(seo.schemas[1].mainEntity[0].acceptedAnswer.text, 'See pricing and **B**.');
  assert.deepEqual(seo.schemas[3].itemListElement.map(item => item.item), ['https://fresh-tech.uk/', 'https://fresh-tech.uk/a-vs-b']);
  assert.throws(() => comparisonSeo({ slug: 'x' }), /requires a page/);
});
