// Build-time site mode. PUBLIC_SITE_MODE=production builds the public
// fresh-tech.uk release; unset (or empty) keeps the default preview build.
// Any other value fails the build rather than silently choosing a mode.
export const PRODUCTION_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const PREVIEW_ROBOTS = 'noindex, nofollow';

export function resolveSiteMode(value) {
  if (value === undefined || value === null || value === '' || value === 'preview') return 'preview';
  if (value === 'production') return 'production';
  throw new Error(`PUBLIC_SITE_MODE must be unset, "preview" or "production"; received ${JSON.stringify(value)}`);
}
