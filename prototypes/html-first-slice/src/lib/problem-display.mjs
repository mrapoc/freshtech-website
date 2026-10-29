// Display rules copied from pages/ProblemPage.tsx, plus the root-slug route
// inventory merge used by src/pages/[slug].astro.
import { ICON_NODES } from './problem-icons.mjs';

// `const isEmergency = data.slug === 'ransomware-recovery'`: red hero and
// closing band, and a single call-now action in place of contact + phone /
// contact + pricing.
export const EMERGENCY_SLUG = 'ransomware-recovery';
export const isEmergency = page => page.slug === EMERGENCY_SLUG;

// Source hrefs and labels, verbatim.
export const PHONE_HREF = 'tel:01584517234';
export const CALL_NOW_LABEL = 'Call Now: 01584 517 234';
export const HERO_CALL_LABEL = 'Call 01584 517 234';
export const CONTACT_HREF = '/contact';
export const PRICING_HREF = '/pricing';
export const PRICING_LABEL = 'View Pricing';

// Breadcrumbs component call: items Resources (/resources) and the page h1,
// with the component's own leading Home crumb. The last item has no href.
export const breadcrumbItems = page => [['Home', '/'], ['Resources', '/resources'], [page.h1, null]];

// Cause/solution card icon names the React iconMap knows; anything else renders
// the CheckCircle glyph (`iconMap[cause.icon] || CheckCircle`). XCircle and the
// chevrons are drawn by the page directly, so they are deliberately not here:
// a record naming them still falls back, as it does in production.
export const ICON_MAP_KEYS = Object.freeze([
  'CheckCircle', 'Shield', 'Zap', 'RefreshCw', 'Cloud', 'Database', 'Lock', 'Mail', 'Globe', 'Key',
  'Monitor', 'Eye', 'Cpu', 'Package', 'Bug', 'Wifi', 'Activity', 'Network', 'Search', 'TrendingUp',
  'TrendingDown', 'UserMinus', 'Clock', 'FileCheck', 'ListChecks', 'Scale', 'Handshake',
  'AlertTriangle', 'Truck', 'Maximize', 'ClipboardCheck', 'PiggyBank', 'ShieldOff', 'FolderSync',
  'Radio', 'MapPin', 'BookOpen', 'MessageSquare', 'Target', 'GitBranch', 'HardDrive', 'HelpCircle',
  'CreditCard', 'Calendar', 'Server', 'Headphones', 'Wrench', 'FileText', 'Users', 'Phone', 'ArrowRight',
]);
for (const key of ICON_MAP_KEYS) {
  if (!Object.hasOwn(ICON_NODES, key)) throw new Error(`Icon packet is missing the iconMap glyph ${key}`);
}
export const iconName = name => (ICON_MAP_KEYS.includes(name) ? name : 'CheckCircle');

// The H1 is set in the global Bungee face (global.css, existing font assets);
// preload the Latin subset, plus Latin Extended only when the heading needs it.
export const problemFontPreloads = h1 => (/[Ā-ỿⱠ-ꟿ]/u.test(h1)
  ? ['/fonts/bungee-latin.woff2', '/fonts/bungee-latin-ext.woff2']
  : ['/fonts/bungee-latin.woff2']);

// Root-slug route inventory: every generated family shares the /[slug] segment,
// so the merged list must be collision-free before Astro sees it. Families are
// emitted in the order given, records in their generated (source) order.
export const ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function mergeRouteInventory(families) {
  if (!Array.isArray(families) || !families.length) throw new Error('mergeRouteInventory needs at least one family');
  const owners = new Map();
  const routes = [];
  for (const family of families) {
    if (!family || typeof family.family !== 'string' || !family.family) throw new Error('Every route family needs a name');
    if (!Array.isArray(family.pages) || !family.pages.length) throw new Error(`Route family ${family.family} has no records`);
    for (const page of family.pages) {
      const slug = page && page.slug;
      if (typeof slug !== 'string' || !ROUTE_SLUG_PATTERN.test(slug)) throw new Error(`Route family ${family.family} has a record without a safe slug`);
      const owner = owners.get(slug);
      if (owner) throw new Error(`Root-slug collision: /${slug} is claimed by both ${owner} and ${family.family}`);
      owners.set(slug, family.family);
      routes.push({ slug, family: family.family, page });
    }
  }
  return routes;
}
