// Display rules copied from pages/ComparisonPage.tsx.
import { ICON_NODES } from './problem-icons.mjs';

// Source hrefs and labels, verbatim.
export const PHONE_HREF = 'tel:01584517234';
export const CALL_LABEL = 'Call 01584 517 234';
export const CONTACT_HREF = '/contact';

// Fixed section copy, verbatim from the React page.
export const COPY = Object.freeze({
  optionsHeading: 'The Options',
  optionsIntro: 'A straightforward comparison of your choices',
  tableHeading: 'Side-by-Side Comparison',
  tableIntro: 'Feature-by-feature breakdown',
  featureHeader: 'Feature',
  verdictHeading: 'Our Verdict',
  faqHeading: 'Common Questions',
  faqIntro: 'Answers to questions we hear most often',
  finalHeading: 'Ready to Make the Right Choice?',
  finalCopy: "We'll assess your current setup and recommend the best approach for your business - with no obligation.",
  recommended: 'Recommended',
  advantages: 'Advantages',
  disadvantages: 'Disadvantages',
  bestFor: 'Best for:',
});

// Breadcrumbs call: Resources (/resources) and the page h1, after the
// component's own leading Home crumb. The last item has no href.
export const breadcrumbItems = page => [['Home', '/'], ['Resources', '/resources'], [page.h1, null]];

// `index === data.options.length - 1 && data.options.length > 2`
export const isRecommended = (index, count) => index === count - 1 && count > 2;

// The React iconMap: { Shield, Cloud, Monitor, Wrench, User, Users, CheckCircle },
// `iconMap[option.icon] || CheckCircle`.
export const ICON_MAP_KEYS = Object.freeze(['Shield', 'Cloud', 'Monitor', 'Wrench', 'User', 'Users', 'CheckCircle']);
export const iconName = name => (ICON_MAP_KEYS.includes(name) ? name : 'CheckCircle');

// lucide-react v0.554.0 `User` (ISC); the problem packet has every other glyph.
const COMPARISON_NODES = Object.freeze({
  ...ICON_NODES,
  User: [['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }], ['circle', { cx: '12', cy: '7', r: '4' }]],
});
for (const key of [...ICON_MAP_KEYS, 'XCircle', 'ChevronDown', 'ChevronUp']) {
  if (!Object.hasOwn(COMPARISON_NODES, key)) throw new Error(`Comparison icon packet is missing ${key}`);
}
export function comparisonIconNodes(name) {
  if (!Object.hasOwn(COMPARISON_NODES, name)) throw new Error(`No comparison glyph named "${name}"`);
  return COMPARISON_NODES[name];
}

export const comparisonFontPreloads = h1 => (/[Ā-ỿⱠ-ꟿ]/u.test(h1)
  ? ['/fonts/bungee-latin.woff2', '/fonts/bungee-latin-ext.woff2']
  : ['/fonts/bungee-latin.woff2']);
