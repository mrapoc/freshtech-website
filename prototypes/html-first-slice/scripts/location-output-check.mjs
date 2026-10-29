import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { locations } from '../src/generated/locations-data.mjs';
import { loadRetainedReactHead } from './lib/retained-react-head.mjs';

// Retained fixture captured with the retired social image; the current default is substituted before comparison.
const retained = await loadRetainedReactHead();
const comparedMetadata = ['description', 'robots', 'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:url', 'og:type', 'og:site_name', 'og:locale', 'twitter:card', 'twitter:site', 'twitter:creator', 'twitter:title', 'twitter:description', 'twitter:image'];
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const textOf = value => unescape(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim());
const visibleSource = value => value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replaceAll('**', '');
const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
const prettify = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

function readHead(html) {
  const title = unescape(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
  const canonical = unescape([...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)].at(-1)?.[1] || '');
  const metadata = {};
  for (const tag of html.match(/<meta\s+[^>]+>/gi) || []) {
    const key = tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content=(["'])(.*?)\1/i)?.[2];
    if (key && content !== undefined) metadata[key] = unescape(content);
  }
  const schemaText = html.match(/<script id="json-ld-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  return { title, canonical, metadata, schemas: schemaText ? JSON.parse(schemaText) : null };
}

function expectedHead(location) {
  const canonical = `https://fresh-tech.uk/locations/${location.slug}`;
  const title = siteTitle(location.heroTitle);
  const metadata = { ...retained.metadata };
  for (const key of ['og:title', 'twitter:title']) metadata[key] = title;
  for (const key of ['description', 'og:description', 'twitter:description']) metadata[key] = location.metaDesc;
  metadata['og:url'] = canonical;
  const schemas = structuredClone(retained.schemas);
  Object.assign(schemas[0], { name: location.heroTitle, description: location.metaDesc, url: canonical });
  schemas[3].itemListElement = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fresh-tech.uk/' },
    { '@type': 'ListItem', position: 2, name: prettify(location.slug), item: canonical },
  ];
  return { title, canonical, metadata, schemas };
}

const sourceSlugs = locations.map(location => location.slug);
const builtSlugs = [];
for (const entry of await readdir(resolve('dist/locations'))) {
  if ((await stat(resolve('dist/locations', entry))).isDirectory()) builtSlugs.push(entry);
}
const missing = sourceSlugs.filter(slug => !builtSlugs.includes(slug));
const unexpected = builtSlugs.filter(slug => !sourceSlugs.includes(slug));
if (missing.length || unexpected.length) throw new Error(`Built location inventory differs. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);

let contentAssertions = 0;
let headAssertions = 0;
for (const location of locations) {
  const html = await readFile(resolve('dist/locations', location.slug, 'index.html'), 'utf8');
  const text = textOf(html);
  const sourceValues = [
    location.city, location.heroTitle, location.heroDesc, location.introTitle, location.introText,
    ...location.features.flatMap(feature => [feature.title, feature.desc]),
    ...location.faqs.flatMap(faq => [faq.q, faq.a]),
  ];
  for (const value of sourceValues) {
    const expected = visibleSource(value);
    if (!text.includes(expected)) throw new Error(`${location.slug}: built HTML is missing rendered source text: ${expected}`);
  }
  if ((html.match(/class="location-feature-card"/g) || []).length !== location.features.length) throw new Error(`${location.slug}: feature count differs from source`);
  if ((html.match(/<details>/g) || []).length < location.faqs.length) throw new Error(`${location.slug}: FAQ count differs from source`);
  if (!html.includes(`data-location-page="${location.slug}"`) || !html.includes('<main id="main-content"')) throw new Error(`${location.slug}: missing location template markers`);
  if (html.includes('data-reactroot') || html.includes('<astro-island')) throw new Error(`${location.slug}: contains framework hydration markup`);
  contentAssertions += sourceValues.length + 4;

  const built = readHead(html);
  const expected = expectedHead(location);
  if (built.title !== expected.title || built.canonical !== expected.canonical) throw new Error(`${location.slug}: title or canonical differs from the React head formula`);
  for (const key of comparedMetadata) if (built.metadata[key] !== expected.metadata[key]) throw new Error(`${location.slug}: metadata ${key} differs from the React head formula`);
  if (JSON.stringify(built.schemas) !== JSON.stringify(expected.schemas)) throw new Error(`${location.slug}: JSON-LD differs from the React head formula`);
  if (built.schemas.some(schema => schema['@type'] === 'FAQPage')) throw new Error(`${location.slug}: added FAQ schema absent from the React source call`);
  headAssertions += comparedMetadata.length + 4;
}

console.log(`${locations.length} source-derived location routes verified: ${contentAssertions} content/inventory and ${headAssertions} head/framework assertions passed`);
