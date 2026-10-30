import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTechnologyData, isSafeImageSource, readServiceCatalogue, readTechExplainers, readTechnologyPages } from './technology-reader.mjs';

const explainer = (overrides = {}) => {
  const fields = {
    title: "'Test Explainer'", metaDesc: "'A useful description.'", h1: "'Test Explainer: Explained'",
    heroImage: "'https://res.cloudinary.com/example/image/upload/f_auto,q_auto/test.jpg'",
    intro: "'Plain intro text.'",
    whatItIs: "'First paragraph with **bold** and a [link](/services/managed-it-support).\\n\\n- one\\n- two'",
    benefits: "[{ title: 'Benefit', desc: 'Benefit copy.', icon: 'Shield' }]",
    risks: "[{ title: 'Risk', desc: 'Risk copy.' }]",
    howWeDoIt: "'We do it. See [docs](https://example.com/docs).'",
    faqs: "[{ q: 'Question?', a: 'Answer with [service](/services/cybersecurity).' }]",
    relatedServices: "['managed-it-support', 'missing-service']",
    ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const explainerSource = body => `export const techExplainers: Record<string, any> = { ${body} };`;
const servicesSource = body => `export const services: any[] = [ ${body} ];`;
const card = (slug, category = 'Cyber Security') => ({ slug, title: `Card ${slug}`, desc: 'Card copy.', category });
const entry = slug => ({ slug, title: `Entry ${slug}` });
const pages = ({ cards = [card('rmm')], categories = ['Cyber Security', 'IT Management'], directory = [entry('rmm')] } = {}) => ({ listing: { pages: cards, categories }, directory });

test('projects techExplainers records in source order and drops benefit icons', () => {
  const [record] = readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer()}`));
  assert.deepEqual(Object.keys(record), ['slug', 'title', 'metaDesc', 'h1', 'intro', 'whatItIs', 'howWeDoIt', 'heroImage', 'benefits', 'risks', 'faqs', 'relatedServices']);
  assert.equal(record.slug, 'alpha');
  assert.deepEqual(record.benefits, [{ title: 'Benefit', desc: 'Benefit copy.' }]);
  assert.deepEqual(record.faqs, [{ q: 'Question?', a: 'Answer with [service](/services/cybersecurity).' }]);
  assert.equal(record.whatItIs.includes('\n\n- one'), true);
  const two = readTechExplainers('fixture.ts', explainerSource(`beta: ${explainer({ title: "'Beta'" })}, alpha: ${explainer()}`));
  assert.deepEqual(two.map(record => record.slug), ['beta', 'alpha']);
});

test('heroImage is optional and must be a safe source', () => {
  const [record] = readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ heroImage: undefined })}`));
  assert.equal(record.heroImage, null);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ heroImage: "'javascript:alert(1)'" })}`)), /safe image source/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ heroImage: "'http://insecure.example/x.jpg'" })}`)), /safe image source/);
  assert.equal(isSafeImageSource('/images/hero.jpg'), true);
  assert.equal(isSafeImageSource('/images/../secret'), false);
  assert.equal(isSafeImageSource('//cdn.example/x.jpg'), false);
});

test('rejects unsafe keys, wrong fields, empty arrays, duplicates and unsafe rich-text links', () => {
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`'Bad Slug': ${explainer()}`)), /safe route segment/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ extra: "'x'" })}`)), /unexpected field extra/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ risks: undefined })}`)), /missing field risks/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ benefits: "[{ title: 'A', desc: 'B' }]" })}`)), /missing field icon/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ faqs: '[]' })}`)), /at least 1/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ relatedServices: "['a', 'a']" })}`)), /duplicate slug/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer()}, beta: ${explainer()}`)), /Duplicate techExplainers title/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ whatItIs: "'[x](javascript:alert(1))'" })}`)), /disallowed inline link/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ howWeDoIt: "'[x](//evil.test)'" })}`)), /disallowed inline link/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ faqs: "[{ q: 'Q', a: '[x](data:text/html,1)' }]" })}`)), /disallowed inline link/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer({ intro: '`${x}`' })}`)), /Non-literal|template/i);
  assert.throws(() => readTechExplainers('fixture.ts', `const shared = ${explainer()}; export const techExplainers = { alpha: shared };`), /Non-literal expression/);
  assert.throws(() => readTechExplainers('fixture.ts', explainerSource(`alpha: { ...${explainer()} }`)), /Only plain property assignments|spread/i);
});

test('reads the listing cards, category order and explainer directory', () => {
  const data = readTechnologyPages(pages({ cards: [card('rmm', 'IT Management'), card('mfa')], directory: [entry('rmm'), entry('mfa')] }));
  assert.deepEqual(data.listing.categories, ['Cyber Security', 'IT Management']);
  assert.deepEqual(data.listing.pages, [
    { slug: 'rmm', title: 'Card rmm', desc: 'Card copy.', category: 'IT Management' },
    { slug: 'mfa', title: 'Card mfa', desc: 'Card copy.', category: 'Cyber Security' },
  ]);
  assert.deepEqual(data.directory, [{ slug: 'rmm', title: 'Entry rmm' }, { slug: 'mfa', title: 'Entry mfa' }]);
  assert.throws(() => readTechnologyPages(pages({ cards: [card('rmm', 'Unknown')] })), /not in categories/);
  assert.throws(() => readTechnologyPages(pages({ cards: [card('rmm'), card('rmm')] })), /duplicate slug/);
  assert.throws(() => readTechnologyPages(pages({ cards: [{ ...card('rmm'), extra: 'x' }] })), /unexpected|exactly/i);
  assert.throws(() => readTechnologyPages(pages({ cards: [{ ...card('rmm'), title: 1 }] })), /must be a/);
  assert.throws(() => readTechnologyPages(pages({ cards: [card('Not A Slug')] })), /safe route segment/);
  assert.throws(() => readTechnologyPages(pages({ categories: ['Cyber Security', 'Cyber Security'] })), /duplicate/);
  assert.throws(() => readTechnologyPages(pages({ directory: [entry('rmm'), entry('rmm')] })), /duplicate slug/);
  assert.throws(() => readTechnologyPages(pages({ directory: [{ ...entry('rmm'), color: 'blue' }] })), /unexpected|exactly/i);
  assert.throws(() => readTechnologyPages(pages({ directory: [] })), /directory/);
  assert.throws(() => readTechnologyPages({ ...pages(), extra: [] }), /unexpected|exactly/i);
});

test('reads only slug and title from the service catalogue without evaluating other members', () => {
  const services = readServiceCatalogue('fixture.ts', servicesSource(`{ slug: 'managed-it-support', title: 'Managed IT Support', desc: 'x', icon: Shield, price: computePrice() }, { title: 'Cyber Security', slug: 'cybersecurity', content: { ...shared } }`));
  assert.deepEqual(services, [{ slug: 'managed-it-support', title: 'Managed IT Support' }, { slug: 'cybersecurity', title: 'Cyber Security' }]);
  assert.throws(() => readServiceCatalogue('fixture.ts', servicesSource(`{ slug: 'a' }`)), /missing field title/);
  assert.throws(() => readServiceCatalogue('fixture.ts', servicesSource(`{ slug: 'a', title: 'A' }, { slug: 'a', title: 'B' }`)), /duplicate slug/);
  assert.throws(() => readServiceCatalogue('fixture.ts', servicesSource(`{ slug: 'a', title: titleVar }`)), /Non-literal expression/);
  assert.throws(() => readServiceCatalogue('fixture.ts', servicesSource(`{ ['slug']: 'a', title: 'A' }`)), /Unsupported property key/);
});

test('buildTechnologyData resolves related services by title, records unresolved slugs and rejects dangling cards', () => {
  const explainers = readTechExplainers('fixture.ts', explainerSource(`alpha: ${explainer()}, beta: ${explainer({ title: "'Beta'", relatedServices: "[]" })}`));
  const services = [{ slug: 'managed-it-support', title: 'Managed IT Support' }];
  const listing = { pages: [{ slug: 'alpha', title: 'Alpha', desc: 'D', category: 'C' }], categories: ['C'] };
  const data = buildTechnologyData({ explainers, listing, directory: [{ slug: 'alpha', title: 'Alpha' }, { slug: 'beta', title: 'Beta' }], services });
  assert.deepEqual(data.techSlugs, ['alpha', 'beta']);
  assert.deepEqual(data.techExplainers[0].related, [{ slug: 'managed-it-support', title: 'Managed IT Support' }]);
  assert.deepEqual(data.techExplainers[0].unresolvedRelatedServices, ['missing-service']);
  assert.deepEqual(data.techExplainers[1].related, []);
  assert.deepEqual(data.unlistedSlugs, ['beta']);
  assert.throws(() => buildTechnologyData({ explainers, listing: { pages: [{ slug: 'gamma', title: 'G', desc: 'D', category: 'C' }], categories: ['C'] }, directory: [], services }), /Listing card gamma/);
  assert.throws(() => buildTechnologyData({ explainers, listing, directory: [{ slug: 'gamma', title: 'G' }], services }), /Directory entry gamma/);
});
