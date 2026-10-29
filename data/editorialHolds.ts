import editorialHolds from './editorial-holds.json';

// Slugs awaiting Sam's preview approval. See data/editorial-holds.json.
const HELD = new Set<string>(editorialHolds.slugs);

export const isHeld = (slug: string): boolean => HELD.has(slug);
