import assert from 'node:assert/strict';
import test from 'node:test';
import { ARTICLE_DATE_MODIFIED, ARTICLE_DATE_PUBLISHED, defaultImage, explainerSeo, listingSeo, previewRobots, prettifySegment, productionRobots, stripMarkdownLinks } from './technology-seo.mjs';

test('listing head follows the React website-type formula, including the inherited doubled suffix', () => {
  const seo = listingSeo();
  assert.equal(seo.title, 'Technology Explained | Fresh Tech | Fresh Tech IT Support');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/technology');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.previewRobots, 'noindex, nofollow');
  assert.equal(seo.productionRobots, productionRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), [['LocalBusiness', 'ProfessionalService'], 'Organization', 'BreadcrumbList']);
  assert.deepEqual(seo.schemas[2].itemListElement.map(item => [item.name, item.item]), [['Home', 'https://fresh-tech.uk/'], ['Technology', 'https://fresh-tech.uk/technology']]);
});

test('explainer head uses the page schema array: Article with fixed dates, FAQPage with links stripped, Organization, breadcrumb', () => {
  const seo = explainerSeo({ slug: 'edr-mdr', title: 'EDR & MDR Explained: Next-Gen Security', metaDesc: 'Desc.', h1: 'EDR & MDR: Beyond Antivirus', faqs: [{ q: 'Q?', a: 'See [Cyber Security](/services/cybersecurity) and **bold**.' }] });
  assert.equal(seo.title, 'EDR & MDR Explained: Next-Gen Security | Fresh Tech IT Support');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/technology/edr-mdr');
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.previewRobots, previewRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'FAQPage', 'Organization', 'BreadcrumbList']);
  const [article, faq, organization, breadcrumb] = seo.schemas;
  assert.equal(article.headline, 'EDR & MDR: Beyond Antivirus');
  assert.equal(article.description, 'Desc.');
  assert.equal(article.datePublished, ARTICLE_DATE_PUBLISHED);
  assert.equal(article.dateModified, ARTICLE_DATE_MODIFIED);
  assert.deepEqual(article.author, { '@type': 'Organization', name: 'Fresh Tech IT Support', '@id': 'https://fresh-tech.uk/#organization', url: 'https://fresh-tech.uk' });
  assert.equal(article.publisher.logo.url, 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png');
  assert.equal(article.inLanguage, 'en-GB');
  assert.equal(article.isAccessibleForFree, true);
  assert.equal('url' in article, false);
  assert.deepEqual(faq.mainEntity, [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'See Cyber Security and **bold**.' } }]);
  assert.equal(organization['@id'], 'https://fresh-tech.uk/#organization');
  assert.deepEqual(breadcrumb.itemListElement.map(item => [item.name, item.item]), [
    ['Home', 'https://fresh-tech.uk/'], ['Technology', 'https://fresh-tech.uk/technology'], ['Edr Mdr', 'https://fresh-tech.uk/technology/edr-mdr'],
  ]);
  assert.equal(seo.schemas.some(schema => Array.isArray(schema['@type'])), false, 'no LocalBusiness when the page supplies its own schema');
});

test('title cap, segment prettifying, link stripping and input validation', () => {
  const long = explainerSeo({ slug: 'vpn', title: 'Do I Need a VPN? Business VPN Guide for 2025', metaDesc: 'D', h1: 'H', faqs: [] });
  assert.equal(long.title, 'Do I Need a VPN? Business VPN Guide for 2025 | Fresh Tech');
  const overCap = explainerSeo({ slug: 'a', title: 'x'.repeat(53), metaDesc: 'D', h1: 'H', faqs: [] });
  assert.equal(overCap.title, 'x'.repeat(53));
  assert.equal(prettifySegment('cloud-vs-onpremise'), 'Cloud Vs Onpremise');
  assert.equal(stripMarkdownLinks('[a](/x) and [b](https://y) c'), 'a and b c');
  assert.throws(() => explainerSeo({ slug: 'a', title: 'T', metaDesc: 'D' }), /requires an explainer/);
});
