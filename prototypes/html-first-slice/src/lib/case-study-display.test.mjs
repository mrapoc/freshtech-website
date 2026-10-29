import assert from 'node:assert/strict';
import test from 'node:test';

import { allSectors, countLabel, coverageSectors, displayStudy, relatedStudies, resultHeading, sectorColour, sectorTextColour, victoryOf } from './case-study-display.mjs';
import { detailSeo, listingSeo, prettifySegment } from './case-study-seo.mjs';

// Synthetic records only.
const full = {
  id: 'cs-1', slug: 'first-study', client: 'First Ltd', industry: 'Legal', title: 'First title',
  challenge: 'c', solution: 's', result: 'Result line', outcome: 'First outcome',
  testimonial: 'Quote', contactName: 'Named Contact', techStack: ['One', 'Two', 'Three', 'Four'],
  shortStats: { risk: 'Risk line', strategy: 'Strategy line', victory: '40% faster' },
};
const bare = { id: 'cs-2', slug: 'second-study', client: 'Second Co', industry: 'Retail', title: 'Second title', challenge: 'c', solution: 's', result: 'Two words', outcome: 'Second outcome', testimonial: 'Quote two' };
const third = { ...bare, id: 'cs-3', slug: 'third-study', industry: 'Legal', testimonial: undefined };
const fourth = { ...bare, id: 'cs-4', slug: 'fourth-study' };

test('listing display mirrors the STUDIES mapping', () => {
  assert.deepEqual(displayStudy(full, 0), {
    client: 'First Ltd', slug: 'first-study', industry: 'Legal', headline: 'First title', summary: 'First outcome',
    metricNum: '40%', metricLabel: 'Strategy line', metricSub: 'Risk line', services: ['One', 'Two', 'Three'],
    quote: { text: 'Quote', name: 'Named Contact' }, featured: true,
  });
  const second = displayStudy(bare, 1);
  assert.equal(second.metricNum, 'Two');
  assert.equal(second.metricLabel, 'Two words');
  assert.equal(second.metricSub, '');
  assert.deepEqual(second.services, []);
  assert.deepEqual(second.quote, { text: 'Quote two', name: 'Second Co' });
  assert.equal(second.featured, true);
  assert.equal(displayStudy(third, 2).featured, false);
  assert.equal(displayStudy(third, 2).quote, undefined);
});

test('sectors, counts and coverage badges follow the source rules', () => {
  assert.deepEqual(allSectors([full, bare, third]), ['All', 'Legal', 'Retail']);
  assert.equal(countLabel(3, 3, 'All'), '3 stories');
  assert.equal(countLabel(3, 2, 'Legal'), '2 in Legal');
  assert.equal(coverageSectors().length, 10);
  assert.equal(coverageSectors()[0], 'Legal');
  assert.equal(sectorColour('Unknown sector'), '#3288be');
  assert.equal(sectorColour('Healthcare'), '#2E7D5B');
  assert.equal(sectorTextColour('Healthcare'), '#FFFFFF');
  assert.equal(sectorTextColour('Charities'), '#0F1923');
  assert.equal(sectorTextColour('Unknown sector'), '#0F1923');
});

test('detail helpers mirror the detail page', () => {
  assert.equal(victoryOf(full), '40% faster');
  assert.equal(victoryOf(bare), 'Two words');
  assert.equal(resultHeading(full), 'Result line');
  assert.equal(resultHeading({ ...bare, result: '' }), 'Mission accomplished');
  assert.deepEqual(relatedStudies([full, bare, third, fourth], 'second-study').map(study => study.slug), ['first-study', 'third-study', 'fourth-study']);
  assert.deepEqual(relatedStudies([full, bare, third, fourth], 'first-study').map(study => study.slug), ['second-study', 'third-study', 'fourth-study']);
});

test('listing head follows the collection contract', () => {
  const seo = listingSeo();
  assert.equal(seo.title, 'Case Studies: Real Results for Shropshire Businesses | Fresh Tech');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/case-studies');
  assert.equal(seo.ogType, 'website');
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['CollectionPage', 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas[0].name, 'Case Studies: Real Results for Shropshire Businesses');
  assert.deepEqual(seo.schemas[0].isPartOf, { '@id': 'https://fresh-tech.uk/#organization' });
  assert.deepEqual(seo.schemas[2].itemListElement.map(item => [item.name, item.item]), [['Home', 'https://fresh-tech.uk/'], ['Case Studies', 'https://fresh-tech.uk/case-studies']]);
});

test('detail head follows the article contract', () => {
  const seo = detailSeo(full);
  assert.equal(seo.title, 'First title: Case Study | Fresh Tech IT Support');
  assert.equal(seo.description, 'First outcome');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/case-studies/first-study');
  assert.equal(seo.ogType, 'article');
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas[0].headline, 'First title: Case Study');
  assert.equal(seo.schemas[0].mainEntityOfPage, seo.canonical);
  assert.deepEqual(seo.schemas[0].author, { '@id': 'https://fresh-tech.uk/#organization' });
  assert.deepEqual(seo.schemas[2].itemListElement.map(item => item.name), ['Home', 'Case Studies', 'First Study']);
  const long = detailSeo({ ...full, title: 'A deliberately long case study title that exceeds the short suffix cap' });
  assert.equal(long.title, 'A deliberately long case study title that exceeds the short suffix cap: Case Study');
  assert.throws(() => detailSeo({ slug: 'x' }), /requires a case study/);
});

test('breadcrumb segment names follow the SEO component table', () => {
  assert.equal(prettifySegment('case-studies'), 'Case Studies');
  assert.equal(prettifySegment('some-client-story'), 'Some Client Story');
});
