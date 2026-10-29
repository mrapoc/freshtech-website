// Display rules copied from pages/AuthorPage.tsx and components/ReadingTime.tsx.
import { ICON_NODES } from './problem-icons.mjs';

export const COPY = Object.freeze({
  linkedin: 'Connect on LinkedIn',
  articlesHeading: shortName => `Articles by ${shortName}`,
  empty: 'No articles published yet.',
  ctaHeading: shortName => `Want to work with ${shortName}?`,
  ctaBody: 'Get in touch to discuss how Fresh Tech can help your business with IT support, cybersecurity, and technology strategy.',
  ctaLabel: 'Get in Touch',
  ctaHref: '/contact',
  read: 'Read',
});

// Breadcrumbs call: About (/about) and the member name, after Home.
export const breadcrumbItems = member => [['Home', '/'], ['About', '/about'], [member.name, null]];

// `post.author === author.shortName`, published only (the blog projection has
// already removed held and future posts), newest first. Array sort is stable,
// so posts sharing a date keep their source order, as in the browser.
export const authorPosts = (posts, member) => posts
  .filter(post => post.author === member.shortName)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// calculateReadingTime + formatReadingTime (200 words per minute, minimum 1).
export function readingTime(content) {
  const words = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(word => word.length > 0).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

// expertiseIcons with the `|| Shield` fallback.
const EXPERTISE_ICONS = Object.freeze({
  'Strategic IT Planning': 'Shield', Cybersecurity: 'Shield', 'Microsoft 365': 'Cloud', 'Business Continuity': 'Shield',
  Infrastructure: 'Cpu', Networking: 'Cpu', Hardware: 'Wrench', Troubleshooting: 'Wrench',
});
export const expertiseIcon = skill => (Object.hasOwn(EXPERTISE_ICONS, skill) ? EXPERTISE_ICONS[skill] : 'Shield');

// lucide-react v0.554.0 `Linkedin` (ISC); every other glyph is in the problem packet.
const TEAM_NODES = Object.freeze({
  ...ICON_NODES,
  Linkedin: [['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' }], ['rect', { width: '4', height: '12', x: '2', y: '9' }], ['circle', { cx: '4', cy: '4', r: '2' }]],
});
export function teamIconNodes(name) {
  if (!Object.hasOwn(TEAM_NODES, name)) throw new Error(`No team glyph named "${name}"`);
  return TEAM_NODES[name];
}

// Cloudinary delivery at the rendered size. Source images carry
// `/upload/f_auto,q_auto/` (optionally with a version and query); the chosen
// width replaces that segment. Non-matching URLs pass through unchanged.
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/)(?:f_auto,q_auto\/)?(.+)$/;
export function cloudinarySources(url, widths, crop) {
  const match = typeof url === 'string' ? url.match(CLOUDINARY) : null;
  if (!match) return { src: url, srcset: undefined };
  const at = width => `${match[1]}w_${width},${crop},f_auto,q_auto/${match[2]}`;
  return { src: at(widths.at(-2) ?? widths[0]), srcset: widths.map(width => `${at(width)} ${width}w`).join(', ') };
}
export const portraitSources = url => ({ ...cloudinarySources(url, [256, 512], 'c_fill,ar_1:1,g_north'), sizes: '(min-width: 768px) 256px, 192px' });
export const cardImageSources = url => ({ ...cloudinarySources(url, [400, 640, 800], 'c_fill,ar_16:9'), sizes: '(min-width: 1024px) 340px, (min-width: 768px) calc(50vw - 56px), calc(100vw - 40px)' });
