/**
 * Lightweight index of available industry guides
 * Used by components that only need to check if a guide exists
 * Import the full industryGuides.ts only when you need the actual content
 */
export const availableGuides = new Set([
  'engineering',
  'legal',
  'healthcare',
  'manufacturing',
  'veterinary'
]);

export const hasGuide = (slug: string): boolean => availableGuides.has(slug);
