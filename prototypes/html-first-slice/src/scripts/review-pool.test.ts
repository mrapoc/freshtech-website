import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceReviewPool, pickReviews } from './review-pool.ts';

// Fake DOM: a section with N items, the first `count` visible as the
// server-rendered default.
function fixture(total: number, count: string | null = '4') {
  const items = Array.from({ length: total }, (_, index) => ({ hidden: index >= Number(count) }));
  const section = {
    getAttribute: (name: string) => (name === 'data-review-pool-count' ? count : null),
    querySelectorAll: (selector: string) => (selector === '[data-review-pool-item]' ? items : []),
  };
  return { items, root: { querySelector: (selector: string) => (selector === '[data-review-pool]' ? section : null) } };
}
const sequence = (...values: number[]) => () => values.shift() ?? 0;
const visible = (items: Array<{ hidden: boolean }>) => items.flatMap((item, index) => (item.hidden ? [] : [index]));

test('pickReviews returns distinct ascending indexes of the requested size', () => {
  assert.deepEqual(pickReviews(8, 4, () => 0), [0, 1, 2, 3]);
  assert.deepEqual(pickReviews(8, 4, () => 0.9999), [0, 1, 2, 7]);
  assert.deepEqual(pickReviews(8, 4, sequence(0.5, 0, 0.99, 0.2)), [0, 1, 4, 7]);
  for (let run = 0; run < 200; run += 1) {
    const picked = pickReviews(8, 4);
    assert.equal(new Set(picked).size, 4);
    assert.ok(picked.every(index => index >= 0 && index < 8));
    assert.deepEqual(picked, [...picked].sort((a, b) => a - b));
  }
  assert.deepEqual(pickReviews(3, 5, () => 0.5), [0, 1, 2]);
  assert.deepEqual(pickReviews(0, 4), []);
});

test('every review can be chosen over many visits', () => {
  const seen = new Set<number>();
  for (let run = 0; run < 200; run += 1) pickReviews(8, 4).forEach(index => seen.add(index));
  assert.equal(seen.size, 8);
});

test('enhancement swaps the default set for a random one of the same size', () => {
  const f = fixture(8);
  assert.deepEqual(visible(f.items), [0, 1, 2, 3]);
  assert.deepEqual(enhanceReviewPool(f.root, sequence(0.5, 0, 0.99, 0.2)), [0, 1, 4, 7]);
  assert.deepEqual(visible(f.items), [0, 1, 4, 7]);
});

test('a missing section, bad count or pool no larger than the count leaves the markup alone', () => {
  assert.equal(enhanceReviewPool({ querySelector: () => null }), null);
  for (const [total, count] of [[4, '4'], [3, '4'], [8, null], [8, '0'], [8, 'four'], [8, '2.5']] as const) {
    const f = fixture(total, count);
    const before = f.items.map(item => item.hidden);
    assert.equal(enhanceReviewPool(f.root, () => 0.9999), null);
    assert.deepEqual(f.items.map(item => item.hidden), before);
  }
});
