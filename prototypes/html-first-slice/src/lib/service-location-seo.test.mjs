import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultImage, faqAnswerText, indexRobots, prettifySlug, serviceLocationSeo } from './service-location-seo.mjs';

const page = {
  slug: 'it-support-testshire', service: 'Managed IT Support', location: 'Testshire', title: 'IT Support Testshire | Towns',
  metaDesc: 'Testshire IT support description.',
  faqs: [{ q: 'Do you cover Testshire?', a: 'Yes. See our [pricing](/pricing) and **plans**.' }, { q: 'Second?', a: 'Plain answer.' }],
};

test('builds the root-slug head with the four-object graph from the React schema call', () => {
  const seo = serviceLocationSeo(page);
  assert.equal(seo.title, 'IT Support Testshire | Towns | Fresh Tech IT Support');
  assert.equal(seo.description, page.metaDesc);
  assert.equal(seo.canonical, 'https://fresh-tech.uk/it-support-testshire');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Service', 'FAQPage', 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas.some(schema => Array.isArray(schema['@type'])), false, 'no type-based LocalBusiness object when an explicit schema is passed');
});

test('Service object carries the inline LocalBusiness provider and the page area', () => {
  const [service] = serviceLocationSeo(page).schemas;
  assert.equal(service.name, 'Managed IT Support - Testshire');
  assert.equal(service.description, page.metaDesc);
  assert.equal(service.serviceType, 'Managed IT Support');
  assert.deepEqual(service.areaServed, { '@type': 'AdministrativeArea', name: 'Testshire' });
  assert.deepEqual(service.provider, {
    '@type': 'LocalBusiness', name: 'Fresh Tech IT Support', '@id': 'https://fresh-tech.uk/#organization',
    telephone: '+441584517234', email: 'hello@fresh-tech.uk',
    address: { '@type': 'PostalAddress', addressLocality: 'Ludlow', addressRegion: 'Shropshire', addressCountry: 'GB' },
  });
  assert.equal('url' in service, false);
});

test('FAQPage strips Markdown links from answers and keeps everything else verbatim', () => {
  const faq = serviceLocationSeo(page).schemas[1];
  assert.deepEqual(faq.mainEntity, [
    { '@type': 'Question', name: 'Do you cover Testshire?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. See our pricing and **plans**.' } },
    { '@type': 'Question', name: 'Second?', acceptedAnswer: { '@type': 'Answer', text: 'Plain answer.' } },
  ]);
  assert.equal(faqAnswerText('[a](/x) and [b](https://e.test/y)'), 'a and b');
});

test('breadcrumb is the auto-derived Home > title-cased slug pair and the title cap applies', () => {
  const seo = serviceLocationSeo(page);
  assert.deepEqual(seo.schemas[3].itemListElement.map(item => [item.position, item.name, item.item]), [
    [1, 'Home', 'https://fresh-tech.uk/'], [2, 'It Support Testshire', 'https://fresh-tech.uk/it-support-testshire'],
  ]);
  assert.equal(prettifySlug('microsoft-365-worcester'), 'Microsoft 365 Worcester');
  const long = serviceLocationSeo({ ...page, title: 'IT Support Hereford | 15-Minute Response | 5-Star IT Support' });
  assert.equal(long.title, 'IT Support Hereford | 15-Minute Response | 5-Star IT Support');
  const mid = serviceLocationSeo({ ...page, title: 'Cyber Essentials Herefordshire | Certification & Support' });
  // 56 chars raw; both suffixed forms exceed the 65-char cap, so the raw title is kept.
  assert.equal(mid.title, 'Cyber Essentials Herefordshire | Certification & Support');
  assert.throws(() => serviceLocationSeo({ slug: 'a' }), /requires a page/);
});
