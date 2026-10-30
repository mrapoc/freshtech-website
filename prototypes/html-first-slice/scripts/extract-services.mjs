import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral,
} from './lib/literal-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cataloguePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const servicePagesPath = resolve(projectDir, '..', '..', 'data', 'service-pages.json');
const navigationPath = resolve(projectDir, '..', '..', 'data', 'navigation.json');
const servicesOutputPath = resolve(projectDir, 'src', 'generated', 'services-data.mjs');
const navigationOutputPath = resolve(projectDir, 'src', 'generated', 'navigation-data.mjs');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATALOGUE_FIELDS = ['title', 'slug', 'icon', 'desc'];
// Every field is required on every entry so the template never silently
// renders an undefined field.
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

// --- Per-service content, listing and hero stats: data/service-pages.json ---
const servicePages = assertPlainObject(JSON.parse(await readFile(servicePagesPath, 'utf8')), 'data/service-pages.json');
assertExactKeys(servicePages, ['content', 'groups', 'listingStats'], 'data/service-pages.json');
const contentRecord = assertPlainObject(servicePages.content, 'content');

function validateContent(slug, content) {
  const label = `content['${slug}']`;
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
  if (!SLUG_PATTERN.test(slug)) throw new Error(`content key "${slug}" is not a safe route segment`);
  if (!slugs.has(slug)) throw new Error(`content has an entry for ${slug} that is not in the services catalogue`);
}
for (const slug of slugs) {
  if (!Object.hasOwn(contentRecord, slug)) throw new Error(`Catalogue service ${slug} has no content entry`);
}

// --- Generated services module: catalogue order, related = first three others.
const services = catalogue.map(entry => ({
  page: { title: entry.title, slug: entry.slug, desc: entry.desc },
  content: validateContent(entry.slug, contentRecord[entry.slug]),
  related: catalogue.filter(other => other.slug !== entry.slug).slice(0, 3).map(other => ({ title: other.title, slug: other.slug, desc: other.desc })),
}));

// --- Services listing groups and hero stats ---------------------------------
const HREF_PATTERN = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const GROUP_FIELDS = ['group', 'lede', 'services'];
const ITEM_FIELDS = ['name', 'slug', 'desc', 'price', 'href'];
const ITEM_OPTIONAL_FIELDS = ['tag', 'tagColor'];
const groups = assertArray(servicePages.groups, 'groups');
const itemHrefs = new Set();
const itemSlugs = new Set();
for (const [groupIndex, group] of groups.entries()) {
  const groupLabel = `groups[${groupIndex}]`;
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

const listingStats = assertArray(servicePages.listingStats, 'listingStats').map((stat, index) => {
  assertExactKeys(stat, ['n', 'l'], `listingStats[${index}]`);
  return { n: assertString(stat.n, `listingStats[${index}].n`), l: assertString(stat.l, `listingStats[${index}].l`) };
});

await mkdir(dirname(servicesOutputPath), { recursive: true });
await writeFile(
  servicesOutputPath,
  `// Generated from data/content.ts and data/service-pages.json. Do not edit.\n` +
    `export const services = ${JSON.stringify(services, null, 2)};\n` +
    `export const serviceSlugs = ${JSON.stringify(services.map(service => service.page.slug))};\n` +
    `export const serviceGroups = ${JSON.stringify(groups, null, 2)};\n` +
    `export const listingStats = ${JSON.stringify(listingStats, null, 2)};\n`,
  'utf8',
);
console.log(`Extracted ${services.length} service routes (${services.map(service => service.page.slug).join(', ')}) from ${cataloguePath} and ${servicePagesPath}`);
console.log(`Extracted ${groups.length} listing groups with ${listingItems.length} cards (${standaloneItems.length} standalone: ${standaloneItems.map(item => item.href).join(', ')}) and ${listingStats.length} hero stats from ${servicePagesPath}`);

// --- Navigation: data/navigation.json ----------------------------------------
const navigationSource = assertPlainObject(JSON.parse(await readFile(navigationPath, 'utf8')), 'data/navigation.json');
assertExactKeys(navigationSource, ['main', 'sectors', 'resources', 'mobileResources'], 'data/navigation.json');

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

const main = validateLinks(navigationSource.main, 'main', { fields: ['label', 'href'] });
const sectors = validateLinks(navigationSource.sectors, 'sectors', { fields: ['label', 'href'] });
const resources = validateLinks(navigationSource.resources, 'resources', { fields: ['label', 'href', 'desc'], optionalFields: ['tag'] });

const mobileResources = validateLinks(navigationSource.mobileResources, 'mobileResources', { fields: ['label', 'href'] });

if (main.length !== 4 || sectors.length !== 6 || resources.length !== 6 || mobileResources.length !== 8) {
  throw new Error('Navigation inventory no longer matches the extracted route contract');
}
await writeFile(
  navigationOutputPath,
  `// Generated from data/navigation.json. Do not edit.\n` +
    `export const navigation = ${JSON.stringify({ main, sectors, resources, mobileResources }, null, 2)};\n`,
  'utf8',
);
console.log(`Extracted navigation inventory from ${navigationPath}`);
