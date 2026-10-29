// Display rules copied from pages-v2/ServiceLocationPageV2.tsx.

// Town pages link up to their same-service county hub. The map and the slug
// pattern are the component's own; a hub link is only emitted when the target
// record exists, exactly as the React page checks serviceLocationPages[hub].
export const TOWN_TO_COUNTY = Object.freeze({
  ludlow: 'shropshire', shrewsbury: 'shropshire', telford: 'shropshire',
  hereford: 'herefordshire', worcester: 'worcestershire', kidderminster: 'worcestershire',
});
export const SERVICE_SLUG_PATTERN = /^(it-support|cyber-essentials|microsoft-365)-(.+)$/;

export function countyHubSlug(page, slugs) {
  if (page.isCounty) return null;
  const match = page.slug.match(SERVICE_SLUG_PATTERN);
  const county = match && TOWN_TO_COUNTY[match[2]];
  if (!county) return null;
  const hub = `${match[1]}-${county}`;
  return slugs.includes(hub) ? hub : null;
}

// Benefit card icon names the React ICON_MAP knows; anything else renders the
// CheckCircle glyph (the component's `|| CheckCircle` fallback).
export const KNOWN_ICONS = Object.freeze(['CheckCircle', 'MapPin', 'Zap', 'Wifi', 'Leaf', 'Shield', 'Headphones', 'Building', 'RefreshCw', 'Cloud', 'Folder', 'Users', 'Truck', 'Wrench', 'Tool']);
export const iconName = name => (KNOWN_ICONS.includes(name) ? (name === 'Tool' ? 'Wrench' : name) : 'CheckCircle');

// Card accent stripe colours cycle in source order: accent, primary, green, yellow.
export const ACCENT_TONES = Object.freeze(['accent', 'primary', 'green', 'yellow']);
export const accentTone = index => ACCENT_TONES[index % ACCENT_TONES.length];

// Location badge: towns add ", Welsh Borders"; counties show the name alone.
export const badgeText = page => `${page.location}${page.isCounty ? '' : ', Welsh Borders'}`;
