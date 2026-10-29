// Display transformations copied from components/Testimonials.tsx,
// components/LogoCarousel.tsx and components/SmartImage.tsx. Kept
// framework-neutral so the same rules render the Astro templates and can be
// unit-tested with synthetic data. Every helper returns plain data; nothing
// here builds HTML, so the templates own escaping.

export const ALL_CATEGORY = 'all';

// categoryIcons in Testimonials.tsx, as lucide icon names. Unknown keys fall
// back to the star used by the "all" tab.
export const CATEGORY_ICONS = { all: 'star', speed: 'clock', reliability: 'shield', proactive: 'zap', value: 'trending-up' };
export const categoryIcon = key => CATEGORY_ICONS[key] ?? CATEGORY_ICONS[ALL_CATEGORY];

function assertCategoryKey(category, categories) {
  if (typeof category !== 'string' || !category) throw new Error('Testimonial category must be a non-empty string');
  if (categories && !Object.hasOwn(categories, category)) throw new Error(`Unknown testimonial category "${category}"`);
  return category;
}

// The filteredTestimonials memo: "all" is the whole list, otherwise an
// exact category match. Source order is preserved and the result is always a
// fresh array. When the category map is supplied, an unknown key throws
// rather than silently rendering an empty slider.
export function filterTestimonials(testimonials, category = ALL_CATEGORY, categories) {
  assertCategoryKey(category, categories);
  if (category === ALL_CATEGORY) return [...testimonials];
  return testimonials.filter(item => item.category === category);
}

export const testimonialCount = (testimonials, category = ALL_CATEGORY, categories) => filterTestimonials(testimonials, category, categories).length;

// The category filter tabs: Object.entries(testimonialCategories) in key
// order, each with the count badge the React component computes.
export function categoryTabs(testimonials, categories) {
  return Object.entries(categories).map(([key, label]) => ({
    key,
    label,
    icon: categoryIcon(key),
    count: testimonialCount(testimonials, key),
    active: key === ALL_CATEGORY,
  }));
}

// optimizeCloudinaryUrl in SmartImage.tsx, verbatim: inject
// w_{width},f_auto,q_auto:{preset} (or q_{number}) after /upload/ and leave
// non-Cloudinary URLs untouched.
export function optimizeCloudinaryUrl(url, width, quality = 'good') {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/upload/')) return url;
  const isAuto = ['good', 'eco', 'best', 'low'].includes(quality);
  const qParam = isAuto ? `q_auto:${quality}` : `q_${quality}`;
  const params = ['f_auto', qParam];
  if (width) params.unshift(`w_${width}`);
  const paramStr = params.join(',');
  if (url.includes(`/${paramStr}/`)) return url;
  return url.replace('/upload/', `/upload/${paramStr}/`);
}

// LogoItem in LogoCarousel.tsx: 130px display width, 2x for retina, eco
// quality, fixed 130x40 box, lazy and async.
export const LOGO_WIDTH = 130;
export const LOGO_HEIGHT = 40;
export const LOGO_QUALITY = 'eco';

export function logoImage(logo) {
  if (!logo || typeof logo.src !== 'string' || !logo.src || typeof logo.alt !== 'string') throw new Error('Partner logo requires src and alt strings');
  const src = optimizeCloudinaryUrl(logo.src, LOGO_WIDTH, LOGO_QUALITY);
  const src2x = optimizeCloudinaryUrl(logo.src, LOGO_WIDTH * 2, LOGO_QUALITY);
  return {
    src,
    srcSet: `${src} 1x, ${src2x} 2x`,
    alt: logo.alt,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    loading: 'lazy',
    decoding: 'async',
  };
}

export const logoImages = logos => logos.map(logoImage);
