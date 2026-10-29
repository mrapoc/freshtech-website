import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertArray, assertExactKeys, assertPlainObject, assertString, interfaceMembers, isLiteral, literalValue, parseSource, topLevelConstLiteral, ts,
} from './lib/literal-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cataloguePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const servicePagePath = resolve(projectDir, '..', '..', 'pages-v2', 'ServiceDetailPageV2.tsx');
const listingPagePath = resolve(projectDir, '..', '..', 'pages-v2', 'ServicesPageV2.tsx');
const navigationPath = resolve(projectDir, '..', '..', 'components-v2', 'SiteNavV2.tsx');
const servicesOutputPath = resolve(projectDir, 'src', 'generated', 'services-data.mjs');
const navigationOutputPath = resolve(projectDir, 'src', 'generated', 'navigation-data.mjs');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATALOGUE_FIELDS = ['title', 'slug', 'icon', 'desc'];
// The ServiceContent interface in pages-v2/ServiceDetailPageV2.tsx. Optional
// interface members are still required on every entry so the template never
// silently renders an undefined field.
const CONTENT_FIELDS = ['tagline', 'heroStat', 'priceFrom', 'priceNote', 'includes', 'howItWorks', 'outcomes', 'faqs'];

// --- Service catalogue: data/content.ts `export const services` -------------
const catalogueFile = parseSource('data/content.ts', await readFile(cataloguePath, 'utf8'));
const catalogue = assertArray(topLevelConstLiteral(catalogueFile, 'services'), 'services catalogue');
const slugs = new Set();
for (const [index, entry] of catalogue.entries()) {
  const label = `services[${index}]`;
  assertExactKeys(entry, CATALOGUE_FIELDS, label);
  for (const field of CATALOGUE_FIELDS) assertString(entry[field], `${label}.${field}`);
  if (!SLUG_PATTERN.test(entry.slug)) throw new Error(`${label}.slug "${entry.slug}" is not a safe route segment`);
  if (slugs.has(entry.slug)) throw new Error(`Duplicate service slug ${entry.slug}`);
  slugs.add(entry.slug);
}

// --- Per-service content: pages-v2/ServiceDetailPageV2.tsx SERVICE_CONTENT ---
const servicePageFile = parseSource('pages-v2/ServiceDetailPageV2.tsx', await readFile(servicePagePath, 'utf8'));
const declaredInterface = interfaceMembers(servicePageFile, 'ServiceContent').map(member => member.name);
if (declaredInterface.length !== CONTENT_FIELDS.length || CONTENT_FIELDS.some(field => !declaredInterface.includes(field))) {
  throw new Error(`ServiceContent interface fields (${declaredInterface.join(', ')}) no longer match the template contract (${CONTENT_FIELDS.join(', ')})`);
}
const contentRecord = assertPlainObject(topLevelConstLiteral(servicePageFile, 'SERVICE_CONTENT'), 'SERVICE_CONTENT');

function validateContent(slug, content) {
  const label = `SERVICE_CONTENT['${slug}']`;
  assertExactKeys(content, CONTENT_FIELDS, label);
  assertString(content.tagline, `${label}.tagline`);
  assertExactKeys(content.heroStat, ['num', 'label'], `${label}.heroStat`);
  assertString(content.heroStat.num, `${label}.heroStat.num`);
  assertString(content.heroStat.label, `${label}.heroStat.label`);
  if (content.priceFrom !== null && !(typeof content.priceFrom === 'number' && Number.isFinite(content.priceFrom) && content.priceFrom > 0)) {
    throw new Error(`${label}.priceFrom must be null or a positive number`);
  }
  assertString(content.priceNote, `${label}.priceNote`);
  assertArray(content.includes, `${label}.includes`).forEach((item, index) => assertString(item, `${label}.includes[${index}]`));
  assertArray(content.howItWorks, `${label}.howItWorks`).forEach((step, index) => {
    assertExactKeys(step, ['step', 'title', 'desc'], `${label}.howItWorks[${index}]`);
    for (const field of ['step', 'title', 'desc']) assertString(step[field], `${label}.howItWorks[${index}].${field}`);
  });
  assertArray(content.outcomes, `${label}.outcomes`).forEach((outcome, index) => {
    assertExactKeys(outcome, ['stat', 'label'], `${label}.outcomes[${index}]`);
    assertString(outcome.stat, `${label}.outcomes[${index}].stat`);
    assertString(outcome.label, `${label}.outcomes[${index}].label`);
  });
  assertArray(content.faqs, `${label}.faqs`).forEach((faq, index) => {
    if (!Array.isArray(faq) || faq.length !== 2) throw new Error(`${label}.faqs[${index}] must be a [question, answer] pair`);
    assertString(faq[0], `${label}.faqs[${index}][0]`);
    assertString(faq[1], `${label}.faqs[${index}][1]`);
  });
  return content;
}

const contentSlugs = Object.keys(contentRecord);
for (const slug of contentSlugs) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`SERVICE_CONTENT key "${slug}" is not a safe route segment`);
  if (!slugs.has(slug)) throw new Error(`SERVICE_CONTENT has an entry for ${slug} that is not in the services catalogue`);
}
for (const slug of slugs) {
  if (!Object.hasOwn(contentRecord, slug)) throw new Error(`Catalogue service ${slug} has no SERVICE_CONTENT entry (the React page would fall back to generic copy)`);
}

// --- Generated services module: catalogue order, related = first three others.
const services = catalogue.map(entry => ({
  page: { title: entry.title, slug: entry.slug, desc: entry.desc },
  content: validateContent(entry.slug, contentRecord[entry.slug]),
  related: catalogue.filter(other => other.slug !== entry.slug).slice(0, 3).map(other => ({ title: other.title, slug: other.slug, desc: other.desc })),
}));

// --- Services listing: pages-v2/ServicesPageV2.tsx GROUPS and hero stats -----
const HREF_PATTERN = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const GROUP_FIELDS = ['group', 'lede', 'services'];
const ITEM_FIELDS = ['name', 'slug', 'desc', 'price', 'href'];
const ITEM_OPTIONAL_FIELDS = ['tag', 'tagColor'];
const listingFile = parseSource('pages-v2/ServicesPageV2.tsx', await readFile(listingPagePath, 'utf8'));
for (const [name, required, optional] of [['ServiceGroup', GROUP_FIELDS, []], ['ServiceItem', ITEM_FIELDS, ITEM_OPTIONAL_FIELDS]]) {
  const members = interfaceMembers(listingFile, name);
  const declaredRequired = members.filter(member => !member.optional).map(member => member.name).sort().join(',');
  const declaredOptional = members.filter(member => member.optional).map(member => member.name).sort().join(',');
  if (declaredRequired !== [...required].sort().join(',') || declaredOptional !== [...optional].sort().join(',')) {
    throw new Error(`${name} interface (${members.map(member => member.name).join(', ')}) no longer matches the listing template contract`);
  }
}
const groups = assertArray(topLevelConstLiteral(listingFile, 'GROUPS'), 'GROUPS');
const itemHrefs = new Set();
const itemSlugs = new Set();
for (const [groupIndex, group] of groups.entries()) {
  const groupLabel = `GROUPS[${groupIndex}]`;
  assertExactKeys(group, GROUP_FIELDS, groupLabel);
  assertString(group.group, `${groupLabel}.group`);
  assertString(group.lede, `${groupLabel}.lede`);
  assertArray(group.services, `${groupLabel}.services`).forEach((item, itemIndex) => {
    const label = `${groupLabel}.services[${itemIndex}]`;
    assertPlainObject(item, label);
    for (const field of ITEM_FIELDS) assertString(item[field], `${label}.${field}`);
    for (const key of Object.keys(item)) {
      if (!ITEM_FIELDS.includes(key) && !ITEM_OPTIONAL_FIELDS.includes(key)) throw new Error(`${label} has unexpected field ${key}`);
      if (ITEM_OPTIONAL_FIELDS.includes(key)) assertString(item[key], `${label}.${key}`);
    }
    if (!SLUG_PATTERN.test(item.slug)) throw new Error(`${label}.slug "${item.slug}" is not a safe slug`);
    if (!HREF_PATTERN.test(item.href)) throw new Error(`${label}.href "${item.href}" is not a safe site-relative path`);
    if (itemHrefs.has(item.href)) throw new Error(`Listing repeats href ${item.href}`);
    if (itemSlugs.has(item.slug)) throw new Error(`Listing repeats slug ${item.slug}`);
    itemHrefs.add(item.href);
    itemSlugs.add(item.slug);
    // Detail-route cards must point at a generated /services/[slug] route.
    if (item.href.startsWith('/services/')) {
      const target = item.href.slice('/services/'.length);
      if (!slugs.has(target)) throw new Error(`${label}.href ${item.href} does not match a catalogue service route`);
      if (target !== item.slug) throw new Error(`${label} slug ${item.slug} does not match its href ${item.href}`);
    }
  });
}
const listingItems = groups.flatMap(group => group.services);
const standaloneItems = listingItems.filter(item => !item.href.startsWith('/services/'));

// Hero stats are an inline `[{ n, l }, ...].map(...)` literal inside JSX.
const statCandidates = [];
(function visitListing(node) {
  if (ts.isJsxExpression(node) && node.expression && ts.isCallExpression(node.expression)) {
    const callee = node.expression.expression;
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'map' && ts.isArrayLiteralExpression(callee.expression) && isLiteral(callee.expression)) {
      const value = literalValue(listingFile, callee.expression);
      if (value.length && value.every(item => item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).join(',') === 'n,l')) statCandidates.push(value);
    }
  }
  ts.forEachChild(node, visitListing);
})(listingFile);
if (statCandidates.length !== 1) throw new Error(`Expected exactly one inline hero stats literal in ServicesPageV2.tsx, found ${statCandidates.length}`);
const listingStats = statCandidates[0].map(({ n, l }, index) => ({ n: assertString(n, `stats[${index}].n`), l: assertString(l, `stats[${index}].l`) }));

await mkdir(dirname(servicesOutputPath), { recursive: true });
await writeFile(
  servicesOutputPath,
  `// Generated from data/content.ts, pages-v2/ServiceDetailPageV2.tsx and pages-v2/ServicesPageV2.tsx. Do not edit.\n` +
    `export const services = ${JSON.stringify(services, null, 2)};\n` +
    `export const serviceSlugs = ${JSON.stringify(services.map(service => service.page.slug))};\n` +
    `export const serviceGroups = ${JSON.stringify(groups, null, 2)};\n` +
    `export const listingStats = ${JSON.stringify(listingStats, null, 2)};\n`,
  'utf8',
);
console.log(`Extracted ${services.length} service routes (${services.map(service => service.page.slug).join(', ')}) from ${cataloguePath} and ${servicePagePath}`);
console.log(`Extracted ${groups.length} listing groups with ${listingItems.length} cards (${standaloneItems.length} standalone: ${standaloneItems.map(item => item.href).join(', ')}) and ${listingStats.length} hero stats from ${listingPagePath}`);

// --- Navigation: components-v2/SiteNavV2.tsx ---------------------------------
const navigationFile = parseSource('components-v2/SiteNavV2.tsx', await readFile(navigationPath, 'utf8'));

function validateLinks(links, label, { fields, optionalFields = [] }) {
  assertArray(links, label);
  const hrefs = new Set();
  for (const [index, link] of links.entries()) {
    assertPlainObject(link, `${label}[${index}]`);
    for (const field of fields) assertString(link[field], `${label}[${index}].${field}`);
    for (const key of Object.keys(link)) {
      if (!fields.includes(key) && !optionalFields.includes(key)) throw new Error(`${label}[${index}] has unexpected field ${key}`);
      if (optionalFields.includes(key)) assertString(link[key], `${label}[${index}].${key}`);
    }
    if (!HREF_PATTERN.test(link.href)) throw new Error(`${label}[${index}].href "${link.href}" is not a safe site-relative path`);
    if (hrefs.has(link.href)) throw new Error(`${label} repeats href ${link.href}`);
    hrefs.add(link.href);
  }
  return links;
}

const main = validateLinks(topLevelConstLiteral(navigationFile, 'NAV_LINKS'), 'NAV_LINKS', { fields: ['label', 'href'] });
const sectors = validateLinks(topLevelConstLiteral(navigationFile, 'SECTOR_LINKS'), 'SECTOR_LINKS', { fields: ['label', 'href'] });
const resources = validateLinks(topLevelConstLiteral(navigationFile, 'RESOURCE_LINKS'), 'RESOURCE_LINKS', { fields: ['label', 'href', 'desc'], optionalFields: ['tag'] });

// The mobile "more resources" inventory is an inline `[...].map(...)` literal
// inside JSX. Collect every literal-only `{label, href}` array that is mapped
// inside a JSX expression; the main mobile list spreads NAV_LINKS so it is not
// a literal and is excluded. Exactly one candidate must remain.
const mobileCandidates = [];
function visit(node) {
  if (ts.isJsxExpression(node) && node.expression && ts.isCallExpression(node.expression)) {
    const callee = node.expression.expression;
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'map' && ts.isArrayLiteralExpression(callee.expression) && isLiteral(callee.expression)) {
      const value = literalValue(navigationFile, callee.expression);
      if (value.every(item => item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 2 && 'label' in item && 'href' in item)) {
        mobileCandidates.push(value);
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(navigationFile);
if (mobileCandidates.length !== 1) throw new Error(`Expected exactly one inline mobile resource inventory in SiteNavV2.tsx, found ${mobileCandidates.length}`);
const mobileResources = validateLinks(mobileCandidates[0], 'mobile resources', { fields: ['label', 'href'] });

if (main.length !== 4 || sectors.length !== 6 || resources.length !== 6 || mobileResources.length !== 8) {
  throw new Error('V2 navigation inventory no longer matches the extracted route contract');
}
await writeFile(
  navigationOutputPath,
  `// Generated from components-v2/SiteNavV2.tsx. Do not edit.\n` +
    `export const navigation = ${JSON.stringify({ main, sectors, resources, mobileResources }, null, 2)};\n`,
  'utf8',
);
console.log(`Extracted navigation inventory from ${navigationPath}`);
