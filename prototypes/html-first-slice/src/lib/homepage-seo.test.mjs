import { loadRetainedReactHead } from '../../scripts/lib/retained-react-head.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { finalTitle, homepageSeo } from './homepage-seo.mjs';

const retained = await loadRetainedReactHead();

test('homepage head matches the active root SEO contract', () => {
  const seo = homepageSeo();
  assert.deepEqual(Object.keys(seo).sort(), ['canonical', 'description', 'image', 'ogType', 'robots', 'schemas', 'title']);
  assert.equal(seo.title, 'Business IT Support in Shropshire & the Marches | Fresh Tech');
  assert.equal(seo.description, 'Friendly, expert business IT support across Shropshire, Herefordshire and the Welsh Borders. From £40/user/month. No 3-year lock-ins. Fast remote fixes.');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/');
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  assert.deepEqual(seo.schemas, [retained.schemas[1], retained.schemas[2]]);
});

test('title suffix and fresh-object contracts are stable', () => {
  assert.equal(finalTitle('Managed IT Support'), 'Managed IT Support | Fresh Tech IT Support');
  assert.equal(finalTitle('Business IT Support in Shropshire & the Marches'), 'Business IT Support in Shropshire & the Marches | Fresh Tech');
  assert.equal(finalTitle('A'.repeat(60)), 'A'.repeat(60));
  const first = homepageSeo();
  const second = homepageSeo();
  assert.notEqual(first.schemas, second.schemas);
  assert.notEqual(first.schemas[0], second.schemas[0]);
  first.schemas[0].name = 'changed';
  assert.equal(second.schemas[0].name, 'Fresh Tech IT Support');
});
