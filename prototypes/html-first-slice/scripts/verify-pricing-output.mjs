import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pricing } from '../src/generated/pricing-data.mjs';
import { PRICING_H1, pricingHead } from '../src/lib/pricing-seo.mjs';

const html = await readFile(resolve('dist/pricing/index.html'), 'utf8');
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replaceAll('&pound;', '£').replaceAll('&#163;', '£')
  .replaceAll('&ndash;', '–').replaceAll('&middot;', '·')
  .replaceAll('&rsquo;', '’').replaceAll('&#39;', "'")
  .replaceAll('&quot;', '"').replaceAll('&amp;', '&')
  .replace(/\s+/g, ' ').trim();
let assertions = 0;
const check = (condition, message) => { assertions++; assert.ok(condition, message); };
const hasText = value => text.includes(String(value).replace(/\s+/g, ' ').trim());

const expectedSections = ['hero', 'live-stats', 'tiers', 'inclusions', 'sla', 'add-ons', 'comparison', 'objections', 'free-review', 'final-cta'];
const actualSections = [...html.matchAll(/data-section="([^"]+)"/g)].map(match => match[1]);
check(JSON.stringify(actualSections) === JSON.stringify(expectedSections), `Pricing section order differs: ${actualSections.join(', ')}`);

for (const expected of [
  PRICING_H1, 'Choose your level of cover', 'The foundation. On all three tiers.',
  'Same SLA on every plan', '£10/user/month: cloud account only', 'Sold separately. No markup.',
  'Saves you money. Keeps your email safe. One less admin task.', 'Compare the real cost',
  'The three blockers. Addressed.', "Not sure what you're paying for?", "20 minutes. That's all it takes.",
]) check(hasText(expected), `Pricing output is missing source copy: ${expected}`);

for (const tier of pricing.tiers) {
  check(html.includes(`data-tier-card="${tier.name}"`), `${tier.name} tier card missing`);
  check(hasText(`£${tier.price}`), `${tier.name} tier price missing`);
  check(hasText(tier.note), `${tier.name} tier note missing`);
  for (const feature of tier.features) check(hasText(feature), `${tier.name} feature missing: ${feature}`);
}
for (const item of pricing.universalInclusions) {
  check(hasText(item.title), `Universal inclusion title missing: ${item.title}`);
  check(hasText(item.desc), `Universal inclusion description missing: ${item.title}`);
}
for (const row of pricing.slaRows) {
  for (const value of Object.values(row)) check(hasText(value), `SLA value missing: ${value}`);
}
for (const [index, objection] of pricing.objections.entries()) {
  check(hasText(objection.q), `Objection missing: ${objection.q}`);
  if (index !== 1) check(hasText(objection.a), `Objection answer missing: ${objection.q}`);
}
check(hasText("Unless your signed Proposal says otherwise, support runs on a 30-day rolling agreement with 30 days' notice."), 'Current agreement baseline is missing');
check(!hasText('12-month agreements with a 30-day money-back guarantee.'), 'Stale 12-month agreement wording remains public');
const objectionCards = [...html.matchAll(/<article class="objection-card">([\s\S]*?)<\/article>/g)].map(match => match[1]);
check(objectionCards.length === pricing.objections.length, 'Objection card inventory differs');
check(objectionCards[1]?.includes('30-day rolling agreement'), 'Terms correction is not attached to the agreement objection');
check(hasText('Last reviewed May 2026 · Sam James'), 'Last-reviewed stamp missing');

for (const href of ['#tiers', '/contact', '/contact?ref=spend-review', '/microsoft-business-premium', '/terms-of-business']) {
  check(html.includes(`href="${href}"`), `Pricing link missing: ${href}`);
}
check(html.includes('data-website-proof') && html.includes('data-proof-metrics hidden') && html.includes('data-proof-feedback hidden'), 'Proof must start hidden');
check(html.includes('data-calculator'), 'Calculator hook missing');
check(html.includes('class="static-fallback"'), 'No-JavaScript calculator fallback missing');
check(!/<[^>]+class=["'][^"']*\bslice-note\b[^"']*["']/i.test(html), 'Old partial-slice note remains');
check(!html.includes('data-reactroot') && !html.includes('<astro-island'), 'Pricing output contains framework hydration markup');

const head = pricingHead();
check(html.includes(`<title>${head.title}</title>`), 'Pricing title does not match SEO contract');
check(html.includes(`<link rel="canonical" href="${head.canonical}">`), 'Pricing canonical missing');
check(html.includes(`content="${head.description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`), 'Pricing description missing');
const schemaMatch = html.match(/<script id="json-ld-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
check(Boolean(schemaMatch), 'Pricing JSON-LD block missing');
const schemas = JSON.parse(schemaMatch[1]);
check(JSON.stringify(schemas) === JSON.stringify(head.schemas), 'Pricing JSON-LD differs from SEO contract');
check(html.includes('aria-current="page">Pricing</a>'), 'Pricing navigation item is not active');

console.log(`${assertions} pricing parity assertions passed`);
