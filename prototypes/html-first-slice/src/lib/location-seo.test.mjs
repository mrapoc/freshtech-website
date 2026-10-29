import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultImage, indexRobots, locationSeo, prettifyLocationSlug } from './location-seo.mjs';

test('builds the current service head and four-schema graph for a location', () => {
  const seo = locationSeo({ slug: 'ross-on-wye', heroTitle: 'IT Support Ross-on-Wye', metaDesc: 'Local support description.' });
  assert.equal(seo.title, 'IT Support Ross-on-Wye | Fresh Tech IT Support');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/locations/ross-on-wye');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Service', ['LocalBusiness', 'ProfessionalService'], 'Organization', 'BreadcrumbList']);
  assert.deepEqual(seo.schemas[0].areaServed.map(area => area.name), ['Shropshire', 'Herefordshire', 'Worcestershire', 'Powys']);
  assert.deepEqual(seo.schemas[3].itemListElement.map(item => [item.name, item.item]), [
    ['Home', 'https://fresh-tech.uk/'], ['Ross On Wye', seo.canonical],
  ]);
  assert.equal(seo.schemas.some(schema => schema['@type'] === 'FAQPage'), false);
});

test('uses the SEO title cap and rejects incomplete input', () => {
  const longTitle = 'A location heading that is deliberately longer than the complete branded title allowance';
  assert.equal(locationSeo({ slug: 'test-town', heroTitle: longTitle, metaDesc: 'Description' }).title, longTitle);
  assert.equal(prettifyLocationSlug('llandrindod-wells'), 'Llandrindod Wells');
  assert.throws(() => locationSeo({ slug: 'test-town' }), /requires a location/);
});
