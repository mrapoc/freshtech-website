// Enhancement for a server-rendered review pool ([data-review-pool]). The HTML
// renders every review and shows the first data-review-pool-count of them, so
// the no-JS page has a fixed, sensible set. This picks a fresh random
// selection of the same size on each visit, keeping source order. Nothing is
// fetched and no review text is touched; only the hidden flags change.

export interface PoolItem { hidden: boolean }

export interface PoolSection {
  getAttribute(name: string): string | null;
  querySelectorAll(selector: string): Iterable<unknown>;
}

export interface PoolRoot { querySelector(selector: string): unknown }

// Indexes of `count` distinct items out of `total`, in ascending order, from a
// partial Fisher-Yates shuffle. `random` returns [0, 1) like Math.random.
export function pickReviews(total: number, count: number, random: () => number = Math.random): number[] {
  const indexes = Array.from({ length: total }, (_, index) => index);
  const size = Math.max(0, Math.min(count, total));
  for (let position = 0; position < size; position += 1) {
    const swap = position + Math.floor(random() * (total - position));
    [indexes[position], indexes[swap]] = [indexes[swap], indexes[position]];
  }
  return indexes.slice(0, size).sort((a, b) => a - b);
}

// Returns the indexes now shown, or null when there is no usable pool.
export function enhanceReviewPool(root: PoolRoot, random: () => number = Math.random): number[] | null {
  const section = root.querySelector('[data-review-pool]') as PoolSection | null;
  if (!section) return null;
  const count = Number(section.getAttribute('data-review-pool-count'));
  const items = Array.from(section.querySelectorAll('[data-review-pool-item]')) as PoolItem[];
  if (!Number.isInteger(count) || count < 1 || items.length <= count) return null;
  const shown = new Set(pickReviews(items.length, count, random));
  items.forEach((item, index) => { item.hidden = !shown.has(index); });
  return [...shown];
}
