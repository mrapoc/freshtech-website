import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultImage, indexRobots, industrySeo, listingSeo, prettifyIndustrySlug } from './industry-seo.mjs';

test('builds the listing service head with the Sectors breadcrumb name', () => {
  const seo = listingSeo();
  assert.equal(seo.title, 'Sectors We Work With: Specialist IT Support | Fresh Tech');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/industries');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Service', ['LocalBusiness', 'ProfessionalService'], 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas[0].name, 'Sectors We Work With: Specialist IT Support');
  assert.equal(seo.schemas[0].url, seo.canonical);
  assert.deepEqual(seo.schemas[3].itemListElement.map(item => [item.name, item.item]), [
    ['Home', 'https://fresh-tech.uk/'], ['Sectors', 'https://fresh-tech.uk/industries'],
  ]);
});

test('builds the detail service head and three-item breadcrumb from the route slug', () => {
  const seo = industrySeo({ slug: 'test-sector', title: 'IT Support for Test Sector', metaDesc: 'Sector description.' });
  assert.equal(seo.title, 'IT Support for Test Sector | Fresh Tech IT Support');
  assert.equal(seo.description, 'Sector description.');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/industries/test-sector');
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Service', ['LocalBusiness', 'ProfessionalService'], 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas[0].name, 'IT Support for Test Sector');
  assert.equal(seo.schemas[0].provider['@id'], 'https://fresh-tech.uk/#localbusiness');
  assert.deepEqual(seo.schemas[0].areaServed.map(area => area.name), ['Shropshire', 'Herefordshire', 'Worcestershire', 'Powys']);
  assert.deepEqual(seo.schemas[3].itemListElement.map(item => [item.name, item.item]), [
    ['Home', 'https://fresh-tech.uk/'], ['Sectors', 'https://fresh-tech.uk/industries'], ['Test Sector', seo.canonical],
  ]);
  assert.equal(seo.schemas.some(schema => schema['@type'] === 'FAQPage'), false);
});

test('applies the SEO title cap progressively and rejects incomplete input', () => {
  const title = rawTitle => industrySeo({ slug: 'a', title: rawTitle, metaDesc: 'D' }).title;
  // Synthetic raw titles of exact length: " | Fresh Tech IT Support" adds 24 chars, " | Fresh Tech" adds 13.
  const synthetic = length => 'IT Support for Sector'.padEnd(length, 'x');
  const mid = synthetic(46);
  assert.equal(`${mid} | Fresh Tech IT Support`.length > 65, true);
  assert.equal(title(mid), `${mid} | Fresh Tech`);
  assert.equal(title(mid).length, 59);
  const atCap = synthetic(52);
  assert.equal(`${atCap} | Fresh Tech`.length, 65);
  assert.equal(title(atCap), `${atCap} | Fresh Tech`);
  const overCap = synthetic(53);
  assert.equal(`${overCap} | Fresh Tech`.length, 66);
  assert.equal(title(overCap), overCap);
  assert.equal(prettifyIndustrySlug('financial-advisers'), 'Financial Advisers');
  assert.throws(() => industrySeo({ slug: 'a' }), /requires an industry/);
});
