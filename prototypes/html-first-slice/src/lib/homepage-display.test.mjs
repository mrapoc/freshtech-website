import assert from 'node:assert/strict';
import test from 'node:test';
import { countyShortLabel, featuredTestimonial, homepageCaseStudies, homepagePricing, mastheadIssue, mastheadLabels } from './homepage-display.mjs';
import { comparison, countyLinks, faqs, industries, pricingTiers, processSteps, serviceAreas, services } from './homepage-data.mjs';

test('homepage static inventories retain their bounded source shape', () => {
  assert.deepEqual([services.length, comparison.length, pricingTiers.length, processSteps.length, industries.length, serviceAreas.length, countyLinks.length, faqs.length], [5, 5, 3, 5, 6, 10, 4, 5]);
  assert.ok(!comparison.some(item => /15 min|response time/i.test(`${item.row} ${item.us}`)), 'unapproved response claim must not return');
  assert.deepEqual(pricingTiers.map(tier => tier.includes.length), [6, 4, 6]);
  assert.ok(!JSON.stringify(pricingTiers).match(/included onsite|onsite visits included|monthly.*visits/i));
  assert.equal(comparison.find(item => item.row === 'Contract length').href, '/terms-of-business');
  assert.ok(!JSON.stringify({ comparison, faqs }).includes('12-month standard agreement'));
});

test('homepage rates come from the validated pricing extraction', () => {
  assert.deepEqual(homepagePricing(pricingTiers, { rates: { Standard: 40, Plus: 60, Premium: 90 } }).map(tier => tier.rate), [40, 60, 90]);
  assert.throws(() => homepagePricing(pricingTiers, { rates: { Standard: 40 } }), /Missing validated homepage rate for Plus/);
});

test('masthead labels use the fixed Europe/London calendar and weekly issue', () => {
  const now = new Date('2026-09-15T11:00:00Z');
  assert.deepEqual(mastheadLabels(now), { day: 'Tue', month: 'September 2026', issue: mastheadIssue(now) });
  assert.equal(mastheadIssue(new Date('2023-09-14T00:00:00Z')), 1);
});

test('county labels preserve complete place names', () => {
  assert.equal(countyShortLabel('Herefordshire'), 'Herefordshire');
  assert.equal(countyShortLabel('Shropshire'), 'Shropshire');
  assert.equal(countyShortLabel('Powys'), 'Powys');
});

test('case selections use synthetic records without copying customer fixtures', () => {
  const records = [
    { slug: 'one', client: 'Alpha', industry: 'Legal', title: 'One', outcome: 'A', result: 'R', shortStats: { victory: 'V', strategy: 'S' } },
    { slug: 'food-production-uptime', client: 'Beta Foods', contactName: 'B Person', industry: 'Food', title: 'Two', outcome: 'B', result: 'R', testimonial: 'Synthetic quote' },
    { slug: 'three', client: 'Gamma', industry: 'Care', title: 'Three', outcome: 'C', result: 'R' },
    { slug: 'four', client: 'Delta', industry: 'Retail', title: 'Four', outcome: 'D', result: 'R' },
  ];
  assert.deepEqual(homepageCaseStudies(records).map(item => item.href), ['/case-studies/one', '/case-studies/food-production-uptime', '/case-studies/three']);
  assert.deepEqual(featuredTestimonial(records), { quote: 'Synthetic quote', attribution: 'B Person · Beta Foods', initials: 'BP', href: '/case-studies/food-production-uptime' });
  const fallback = featuredTestimonial([{ slug: 'another-story', client: 'Other Test', testimonial: 'Another synthetic quote' }]);
  assert.equal(fallback.quote, 'Another synthetic quote');
  assert.equal(fallback.href, '/case-studies/another-story', 'a replacement quote links to its own story');
});
