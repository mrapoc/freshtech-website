import assert from 'node:assert/strict';
import test from 'node:test';
import { dateModified, datePublished, defaultImage, faqAnswerText, indexRobots, problemSeo } from './problem-seo.mjs';

// Synthetic page only; shapes follow pages/ProblemPage.tsx.
const page = {
  slug: 'slow-things', title: 'Why Are My Test Things So Slow?', metaDesc: 'Slow test things description.',
  h1: 'Why Are Your Test Things So Slow?',
  faqs: [{ q: 'Replace or upgrade?', a: 'See our [pricing](/pricing) and **plans**.' }, { q: 'Second?', a: 'Plain answer.' }],
};

test('builds the root-slug head with the four-object graph from the React schema call', () => {
  const seo = problemSeo(page);
  assert.equal(seo.title, 'Why Are My Test Things So Slow? | Fresh Tech IT Support');
  assert.equal(seo.rawTitle, page.title);
  assert.equal(seo.description, page.metaDesc);
  assert.equal(seo.canonical, 'https://fresh-tech.uk/slow-things');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'FAQPage', 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas.some(schema => Array.isArray(schema['@type'])), false, 'no type-based LocalBusiness object when an explicit schema is passed');
  assert.equal(seo.schemas[2]['@id'], 'https://fresh-tech.uk/#organization');
});

test('Article object is headlined by h1, described by metaDesc and carries the fixed source dates and objects', () => {
  const [article] = problemSeo(page).schemas;
  assert.deepEqual(article, {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Why Are Your Test Things So Slow?',
    description: 'Slow test things description.',
    datePublished: '2025-06-01T00:00:00+00:00',
    dateModified: '2026-03-04T00:00:00+00:00',
    author: { '@type': 'Organization', name: 'Fresh Tech IT Support', '@id': 'https://fresh-tech.uk/#organization', url: 'https://fresh-tech.uk' },
    publisher: { '@type': 'Organization', name: 'Fresh Tech IT Support', logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png' } },
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
  });
  assert.equal(datePublished, '2025-06-01T00:00:00+00:00');
  assert.equal(dateModified, '2026-03-04T00:00:00+00:00');
  assert.equal('image' in article, false);
  assert.equal('url' in article, false);
  assert.equal('mainEntityOfPage' in article, false);
});

test('FAQPage strips Markdown links from answers and keeps everything else verbatim', () => {
  const faq = problemSeo(page).schemas[1];
  assert.deepEqual(faq.mainEntity, [
    { '@type': 'Question', name: 'Replace or upgrade?', acceptedAnswer: { '@type': 'Answer', text: 'See our pricing and **plans**.' } },
    { '@type': 'Question', name: 'Second?', acceptedAnswer: { '@type': 'Answer', text: 'Plain answer.' } },
  ]);
  assert.equal(faqAnswerText('[a](/x) and [b](https://e.test/y)'), 'a and b');
});

test('breadcrumb is the auto-derived Home > title-cased slug pair and the title cap applies', () => {
  const seo = problemSeo(page);
  assert.deepEqual(seo.schemas[3].itemListElement.map(item => [item.position, item.name, item.item]), [
    [1, 'Home', 'https://fresh-tech.uk/'], [2, 'Slow Things', 'https://fresh-tech.uk/slow-things'],
  ]);
  const numeric = problemSeo({ ...page, slug: 'windows-10-end-of-life' });
  assert.equal(numeric.schemas[3].itemListElement[1].name, 'Windows 10 End Of Life');
  // 47 chars raw: the long suffix (24) would exceed 65, the short suffix (13) fits.
  const mid = problemSeo({ ...page, title: 'Business Email Compromise: Protect Your Company' });
  assert.equal(mid.title, 'Business Email Compromise: Protect Your Company | Fresh Tech');
  // 56 chars raw: both suffixed forms exceed the cap, so the raw title is kept.
  const long = problemSeo({ ...page, title: 'Your IT Provider Is Not Responding: What To Do Right Now' });
  assert.equal(long.title, 'Your IT Provider Is Not Responding: What To Do Right Now');
  assert.throws(() => problemSeo({ slug: 'a' }), /requires a page/);
});
