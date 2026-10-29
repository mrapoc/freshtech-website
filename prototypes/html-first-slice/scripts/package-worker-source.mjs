import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, link, lstat, open, readFile, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectDir, '..', '..');
const defaultManifest = resolve(projectDir, 'scripts', 'worker-source-manifest.txt');

export const REQUIRED_WORKER_PATHS = [
  'brand/fonts/archivo/archivo-v25-latin.woff2',
  'brand/fonts/archivo/archivo-v25-latin-ext.woff2',
  'brand/fonts/archivo-narrow/archivo-narrow-v35-latin.woff2',
  'brand/fonts/archivo-narrow/archivo-narrow-v35-latin-ext.woff2',
  'brand/fonts/bungee/bungee-v17-latin-headings.woff2',
  'brand/fonts/bungee/bungee-v17-latin-ext.woff2',
  'public/fonts/archivo/OFL.txt',
  'public/fonts/archivo/PROVENANCE.md',
  'public/fonts/archivo-narrow/OFL.txt',
  'public/fonts/archivo-narrow/PROVENANCE.md',
  'public/fonts/bungee/OFL.txt',
  'public/fonts/bungee/PROVENANCE.md',
  'data/content.ts',
  'pages-v2/PricingPageV2.tsx',
  'pages-v2/ServiceDetailPageV2.tsx',
  'pages-v2/ServicesPageV2.tsx',
  'components-v2/SiteNavV2.tsx',
  'components/SEO.tsx',
  'components-v2/inlineMd.tsx',
  'pages-v2/CaseStudiesPageV2.tsx',
  'pages-v2/CaseStudyDetailPageV2.tsx',
  'prototypes/html-first-slice/src/pages/services/[slug].astro',
  'prototypes/html-first-slice/src/pages/case-studies/[slug].astro',
  'prototypes/html-first-slice/src/components/PricingPage.astro',
  'prototypes/html-first-slice/src/lib/pricing-seo.mjs',
  'prototypes/html-first-slice/src/lib/public-metrics.mjs',
  'prototypes/html-first-slice/src/scripts/live-metrics.ts',
  'prototypes/html-first-slice/src/lib/website-proof.test.mjs',
  'prototypes/html-first-slice/scripts/verify-pricing-output.mjs',
  'prototypes/html-first-slice/scripts/pricing-browser-check.mjs',
];

const forbiddenComponent = /^(?:\.env(?:\..*)?|.*(?:secret|credential).*|(?:customer|client)[-_]?(?:data|fixture)s?(?:\..*)?)$/i;
const portableComponent = /^[A-Za-z0-9._\-[\]]+$/;

export function parseManifest(text) {
  const entries = text.split(/\r?\n/).filter(Boolean);
  if (!entries.length) throw new Error('Worker source manifest is empty');
  if (new Set(entries).size !== entries.length) throw new Error('Worker source manifest contains duplicate paths');
  return entries;
}

export function validatePath(entry) {
  const components = entry.split('/');
  if (/[\x00-\x1f\x7f]/.test(entry) || entry.includes('\\') || entry.includes(':') || isAbsolute(entry) || entry.startsWith('/')) {
    throw new Error(`Unsafe worker source path: ${entry}`);
  }
  if (!entry || components.some(component => !component || component === '.' || component === '..' || !portableComponent.test(component))) {
    throw new Error(`Unsupported worker source path: ${entry}`);
  }
  if (components.some(component => component.startsWith('-') || forbiddenComponent.test(component))) {
    throw new Error(`Forbidden worker source path: ${entry}`);
  }
}

export async function validateManifest(rootDir, entries, { requiredPaths = REQUIRED_WORKER_PATHS, inspect = lstat } = {}) {
  const rootInfo = await inspect(rootDir);
  if (rootInfo.isSymbolicLink()) throw new Error('Worker source root is a symlink');
  if (!rootInfo.isDirectory()) throw new Error('Worker source root is not a directory');
  for (const entry of entries) validatePath(entry);
  for (const required of requiredPaths) {
    if (!entries.includes(required)) throw new Error(`Required worker source path is missing: ${required}`);
  }
  for (const entry of entries) {
    const components = entry.split('/');
    let current = rootDir;
    for (const [index, component] of components.entries()) {
      current = resolve(current, component);
      const info = await inspect(current);
      if (info.isSymbolicLink()) throw new Error(`Worker source path crosses a symlink: ${entry}`);
      if (index < components.length - 1 && !info.isDirectory()) throw new Error(`Worker source parent is not a directory: ${entry}`);
      if (index === components.length - 1 && !info.isFile()) throw new Error(`Worker source path is not a regular file: ${entry}`);
    }
  }
}

export function assertArchiveMatchesManifest(entries, archiveEntries) {
  const actual = archiveEntries.map(entry => entry.replace(/^\.\//, '').replace(/\/$/, '')).filter(Boolean);
  if (new Set(actual).size !== actual.length) throw new Error('Worker source archive contains duplicate entries');
  const missing = entries.filter(entry => !actual.includes(entry));
  const unexpected = actual.filter(entry => !entries.includes(entry));
  if (missing.length || unexpected.length || actual.length !== entries.length) {
    throw new Error(`Worker source archive differs from manifest. Missing: [${missing.join(', ')}]. Unexpected: [${unexpected.join(', ')}]`);
  }
}

function runTar(args, cwd) {
  const result = spawnSync('tar', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`tar failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout;
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export function validateOutputPath(rootDir, manifestPath, entries, outputPath) {
  const output = resolve(outputPath);
  if (!output.toLowerCase().endsWith('.tgz')) throw new Error('Worker source archive output must end in .tgz');
  const protectedPaths = [resolve(manifestPath), ...entries.map(entry => resolve(rootDir, entry))];
  if (protectedPaths.includes(output)) throw new Error('Worker source archive output overlaps a manifest or source path');
  return output;
}

export async function createSourceArchive({ rootDir, manifestPath, outputPath, requiredPaths = REQUIRED_WORKER_PATHS }) {
  const entries = parseManifest(await readFile(manifestPath, 'utf8'));
  await validateManifest(rootDir, entries, { requiredPaths });
  const output = validateOutputPath(rootDir, manifestPath, entries, outputPath);
  if (await pathExists(output)) throw new Error(`Worker source archive output already exists: ${output}`);
  const temporary = resolve(dirname(output), `.${randomUUID()}.tgz.partial`);
  const reservation = await open(temporary, 'wx');
  await reservation.close();
  try {
    // Each allowlisted path is a separate argv value after `--`, so tar cannot
    // reinterpret manifest lines as options, escapes or wildcard patterns.
    runTar(['-czf', temporary, '--', ...entries], rootDir);
    const archiveEntries = runTar(['-tzf', temporary], rootDir).split(/\r?\n/).filter(Boolean);
    assertArchiveMatchesManifest(entries, archiveEntries);
    const sha256 = createHash('sha256').update(await readFile(temporary)).digest('hex').toUpperCase();
    await link(temporary, output);
    return { entries, sha256 };
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outputPath = process.argv[2];
  if (!outputPath || process.argv.length !== 3) {
    throw new Error('Usage: npm run package:worker -- <output.tgz>');
  }
  const result = await createSourceArchive({ rootDir: repositoryRoot, manifestPath: defaultManifest, outputPath });
  console.log(`Worker source archive: ${resolve(outputPath)}`);
  console.log(`Manifest entries: ${result.entries.length}`);
  console.log(`SHA256: ${result.sha256}`);
}
