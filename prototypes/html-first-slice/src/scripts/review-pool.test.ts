import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceReviewPool, pickReview } from './review-pool.ts';

// Fake DOM: slots of reviews, the first in each shown as the server default.
function item(shown: boolean) {
  const attributes = new Map<string, string>(shown ? [] : [['aria-hidden', 'true']]);
  return {
    inert: !shown,
    attributes,
    setAttribute: (name: string, value: string) => { attributes.set(name, value); },
    removeAttribute: (name: string) => { attributes.delete(name); },
  };
}
function fixture(sizes: number[]) {
  const slots = sizes.map(size => Array.from({ length: size }, (_, index) => item(index === 0)));
  const section = { querySelectorAll: (selector: string) => (selector === '[data-review-pool-slot]' ? slots.map(items => ({ querySelectorAll: (inner: string) => (inner === '[data-review-pool-item]' ? items : []) })) : []) };
  return { slots, root: { querySelector: (selector: string) => (selector === '[data-review-pool]' ? section : null) } };
}
const sequence = (...values: number[]) => () => values.shift() ?? 0;
const shown = (slots: ReturnType<typeof item>[][]) => slots.map(items => items.flatMap((entry, index) => (!entry.inert && !entry.attributes.has('aria-hidden') ? [index] : [])));

test('pickReview maps [0, 1) onto every index of the slot', () => {
  assert.equal(pickReview(3, () => 0), 0);
  assert.equal(pickReview(3, () => 0.34), 1);
  assert.equal(pickReview(3, () => 0.9999), 2);
  assert.equal(pickReview(1, () => 0.9999), 0);
  const seen = new Set<number>();
  for (let run = 0; run < 200; run += 1) seen.add(pickReview(3));
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
});

test('enhancement shows exactly one review per slot and hides the rest', () => {
  const f = fixture([3, 3, 2, 2]);
  assert.deepEqual(shown(f.slots), [[0], [0], [0], [0]]);
  assert.deepEqual(enhanceReviewPool(f.root, sequence(0.9999, 0.5, 0, 0.6)), [2, 1, 0, 1]);
  assert.deepEqual(shown(f.slots), [[2], [1], [0], [1]]);
  for (const items of f.slots) for (const entry of items) assert.equal(entry.inert, entry.attributes.get('aria-hidden') === 'true');
});

test('a missing section or empty slot leaves the markup alone', () => {
  assert.equal(enhanceReviewPool({ querySelector: () => null }), null);
  const f = fixture([0, 2]);
  assert.deepEqual(enhanceReviewPool(f.root, () => 0.9999), [-1, 1]);
  assert.deepEqual(shown(f.slots), [[], [1]]);
});
