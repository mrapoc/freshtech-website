import { cloudinarySrcset } from './cloudinary-image.mjs';
// Listing and article ordering rules copied from pages-v2/BlogPageV2.tsx and
// pages-v2/BlogPostPageV2.tsx. Input is the generated published record set
// (already hold- and date-filtered) in source order.

// Category colours from BlogPageV2 CAT_COLOURS; unknown categories fall back
// to T.primary. Values are the V2 theme tokens.
const T = { primary: '#3288be', primaryDark: '#1f5c8c', accent: '#e8541f', green: '#2e7d5b' };
export const CATEGORY_COLOURS = {
  'Security': T.accent, 'Cyber Security': T.accent, 'Email': T.primaryDark, 'AI': T.primary, 'Microsoft 365': '#0078D4',
  'Hardware': T.primaryDark, 'Software': T.primary, 'Business Guide': T.primaryDark, 'Cost Saving': T.green, 'Compliance': '#7B4F2E',
};
export const colourFor = category => CATEGORY_COLOURS[category] || T.primary;
export const HERO_CATEGORY_LIMIT = 6;

// Listing order: newest first. Sort is stable, so equal dates keep source order.
export function listingPosts(posts) {
  return [...posts].sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0));
}

export const featuredPosts = sorted => sorted.slice(0, 2);

export function categoryCounts(sorted) {
  const counts = new Map();
  for (const post of sorted) counts.set(post.category, (counts.get(post.category) || 0) + 1);
  return counts;
}

// Chip order: All, then categories in first-seen listing order.
export const allCategories = sorted => ['All', ...new Set(sorted.map(post => post.category))];

// Hero browser: the top six categories by count (ties keep insertion order,
// matching Array.prototype.sort on Object.entries) and the remainder count.
export function heroCategories(sorted) {
  const entries = [...categoryCounts(sorted).entries()].sort((a, b) => b[1] - a[1]);
  return { top: entries.slice(0, HERO_CATEGORY_LIMIT), remainder: Math.max(0, entries.length - HERO_CATEGORY_LIMIT) };
}

export const countLabel = count => `${count} ${count === 1 ? 'article' : 'articles'}`;

// Featured quote panel: first sentence of the summary, as V2 computes it.
export const firstSentence = summary => `${summary.split('.')[0]}.`;

// Article "Related articles": the first three other published posts in source
// order (not listing order).
export const relatedPosts = (posts, slug) => posts.filter(post => post.slug !== slug).slice(0, 3);

// Badge text: V2 paints every badge white. White on the two lightest tones
// (primary, accent) is below 4.5:1 at badge size, so those use ink instead.
export const badgeTextColour = category => ([T.primary, T.accent].includes(colourFor(category)) ? '#0f1923' : '#ffffff');

// Article hero image widths: the image is shown with object-fit: contain, so the
// browser picks an uncropped Cloudinary width. The src stays the stored URL.
export const ARTICLE_IMAGE_WIDTHS = Object.freeze([480, 720, 1200, 1600]);
export const ARTICLE_IMAGE_SIZES = '(min-width: 768px) min(calc(100vw - 64px), 880px), calc(100vw - 40px)';
export const articleImageSrcset = url => cloudinarySrcset(url, ARTICLE_IMAGE_WIDTHS);
