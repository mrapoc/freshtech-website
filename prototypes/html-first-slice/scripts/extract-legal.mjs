import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripLeadingH1 } from '../src/lib/legal-markdown.mjs';

// Extracts the three legal document routes (terms-of-business, dpa,
// sub-processors) for the native pages.
//
// The React port (pages-v2/LegalDocumentPageV2.tsx, data/legalDocuments.ts)
// does not keep its documents as literal TS records: data/legalDocuments.ts
// globs Markdown files with YAML-style front matter out of content/*.md, maps
// "current" version per slug via content/legal-pages.json, and
// utils/legalDocuments.ts's parseLegalDocument() reads the front matter and
// scans for [DECIDE]/[VERIFY] placeholder tokens. There is no JS object
// literal here for scripts/lib/literal-reader.mjs to parse, so this script
// reads the actual source of truth directly (content/*.md, a plain JSON
// mapping) with the same fail-closed spirit: unknown front matter fields,
// missing required fields, an unregistered slug, or a duplicate route all
// throw rather than being silently accepted.
//
// Publication rule ported exactly from LegalDocumentPageV2: a document with
// one or more [DECIDE]/[VERIFY] placeholder tokens still gets its route (the
// React route 200s, it does not 404), but the body is replaced with the
// "being prepared" notice instead of being rendered. There is no date-based
// publish gate in the React component (effective_date/last_updated are
// display-only), so none is added here. None of the three current documents
// contain a placeholder token.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(projectDir, '..', '..');
const contentDir = resolve(repoDir, 'content');
const outputPath = resolve(projectDir, 'src', 'generated', 'legal-data.mjs');

const REQUIRED_FIELDS = ['title', 'slug', 'summary'];
const ALLOWED_FIELDS = new Set(['title', 'slug', 'summary', 'version', 'effective_date', 'last_updated']);

// Ports utils/legalDocuments.ts's parseLegalDocument, with an added
// allowed-field check (fail closed on an unrecognised front matter key).
function parseLegalDocument(source, fileName) {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatter) throw new Error(`${fileName}: missing YAML front matter`);

  const values = {};
  for (const line of frontMatter[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!field) continue;
    if (!ALLOWED_FIELDS.has(field[1])) throw new Error(`${fileName}: unexpected front matter field "${field[1]}"`);
    values[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }

  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) throw new Error(`${fileName}: missing front matter field "${field}"`);
  }

  const placeholders = [];
  source.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(/\[(?:DECIDE|VERIFY)[^\]]*\]/g)) placeholders.push({ token: match[0], line: index + 1 });
  });

  return { metadata: values, body: source.slice(frontMatter[0].length), placeholders };
}

const versionPathPart = version => `v${version.replace(/\./g, '-')}`;

// Ports data/legalDocuments.ts's addVersionHistoryLinks: turns each version
// number in a "Version history" table's first column into a link to that
// version's URL, applied only when the document itself is versioned.
const addVersionHistoryLinks = (body, slug) =>
  body.replace(/^(\|\s*)(\d+\.\d+)(\s*\|.*)$/gm, (_row, start, version, rest) => `${start}[${version}](/${slug}/${versionPathPart(version)})${rest}`);

// Ports LegalDocumentPageV2's formatDocumentDate, run at build time since
// front-matter dates are fixed strings, not derived from "today".
function formatDocumentDate(value) {
  if (!value || value.includes('[DECIDE')) return value || 'Not set';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const legalPagesPath = resolve(contentDir, 'legal-pages.json');
const legalPages = JSON.parse(await readFile(legalPagesPath, 'utf8'));
if (!legalPages.current || typeof legalPages.current !== 'object') throw new Error(`${legalPagesPath}: missing "current" map`);

const fileNames = (await readdir(contentDir)).filter(name => name.endsWith('.md'));
const documents = [];
for (const fileName of fileNames) {
  const source = await readFile(resolve(contentDir, fileName), 'utf8');
  documents.push({ fileName, ...parseLegalDocument(source, fileName) });
}

const knownSlugs = new Set(Object.keys(legalPages.current));
for (const doc of documents) {
  if (!knownSlugs.has(doc.metadata.slug)) {
    throw new Error(`${doc.fileName}: slug "${doc.metadata.slug}" is not registered in content/legal-pages.json "current"`);
  }
}

// One route entry per URL React actually serves for getLegalDocument(slug,
// version): the current (no-version) URL for every slug in legal-pages.json,
// plus a versioned URL for every document that declares a version. Today that
// is one file per slug, so the versioned and current URLs for
// terms-of-business/dpa render the same content, exactly as in production.
function buildRoute(slug, doc, versionPath) {
  const { metadata, body, placeholders } = doc;
  const dateLabel = metadata.version ? 'Effective date' : 'Last updated';
  const dateValue = placeholders.length ? 'Not yet published' : formatDocumentDate(metadata.effective_date || metadata.last_updated);
  const printMeta = metadata.version ? `Version ${metadata.version}` : `${dateLabel}: ${dateValue}`;
  const strippedBody = stripLeadingH1(body);
  const bodyMarkdown = placeholders.length ? '' : (metadata.version ? addVersionHistoryLinks(strippedBody, slug) : strippedBody);
  return {
    slug,
    versionPath: versionPath ?? null,
    version: metadata.version ?? null,
    title: metadata.title,
    summary: metadata.summary,
    dateLabel,
    dateValue,
    printMeta,
    placeholderCount: placeholders.length,
    bodyMarkdown,
  };
}

const routes = [];
const seen = new Set();
const addRoute = route => {
  const key = `${route.slug}/${route.versionPath ?? ''}`;
  if (seen.has(key)) throw new Error(`Duplicate legal route for ${key}`);
  seen.add(key);
  routes.push(route);
};

for (const [slug, currentFile] of Object.entries(legalPages.current)) {
  const current = documents.find(doc => doc.fileName === currentFile);
  if (!current) throw new Error(`${legalPagesPath}: current file "${currentFile}" for "${slug}" was not found in ${contentDir}`);
  addRoute(buildRoute(slug, current, null));
}
for (const doc of documents) {
  if (!doc.metadata.version) continue;
  addRoute(buildRoute(doc.metadata.slug, doc, versionPathPart(doc.metadata.version)));
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated from content/*.md and content/legal-pages.json. Do not edit.\n` +
  `export const legalRoutes = ${JSON.stringify(routes, null, 2)};\n`,
  'utf8'
);
console.log(`Extracted ${routes.length} legal document route(s) from ${fileNames.length} file(s) in ${contentDir}`);
