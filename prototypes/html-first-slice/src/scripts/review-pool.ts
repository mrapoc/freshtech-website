// Enhancement for a server-rendered review pool ([data-review-pool]). The pool
// is split into slots ([data-review-pool-slot]); every review in a slot sits in
// the same grid cell, so the cell is always as tall as its tallest review and
// swapping which one shows can never shift the layout. The HTML shows the
// first review in each slot (the no-JS default) and marks the rest inert and
// aria-hidden; this picks a random review per slot on each visit. Nothing is
// fetched and no review text is touched.

export interface PoolItem {
  inert: boolean;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export interface PoolSlot { querySelectorAll(selector: string): Iterable<unknown> }

export interface PoolRoot { querySelector(selector: string): unknown }

// Index of the review to show in a slot of `size`; `random` returns [0, 1).
export const pickReview = (size: number, random: () => number = Math.random) => Math.min(size - 1, Math.floor(random() * size));

// Returns the index shown in each slot, or null when there is no pool.
export function enhanceReviewPool(root: PoolRoot, random: () => number = Math.random): number[] | null {
  const section = root.querySelector('[data-review-pool]') as PoolSlot | null;
  if (!section) return null;
  const slots = Array.from(section.querySelectorAll('[data-review-pool-slot]')) as PoolSlot[];
  return slots.map(slot => {
    const items = Array.from(slot.querySelectorAll('[data-review-pool-item]')) as PoolItem[];
    if (!items.length) return -1;
    const chosen = pickReview(items.length, random);
    items.forEach((item, index) => {
      item.inert = index !== chosen;
      if (index === chosen) item.removeAttribute('aria-hidden');
      else item.setAttribute('aria-hidden', 'true');
    });
    return chosen;
  });
}
