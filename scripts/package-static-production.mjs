// Packages the native production build for the 20i production site. It never
// uses the React baseline archive: the site is the PUBLIC_SITE_MODE=production
// Astro output (with its root files) plus the generated production .htaccess and
// the lead email endpoint at the path that .htaccess rewrites to.
//
// Prerequisite: PUBLIC_SITE_MODE=production npm run build (in prototypes/html-first-slice).
// Usage: node scripts/package-static-production.mjs [--date YYYYMMDD] [--tag label] [--preserve-existing-endpoints]
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const sliceDir = resolve(repoRoot, 'prototypes', 'html-first-slice');
const distDir = resolve(sliceDir, 'dist-production');
const ENDPOINT_PATHS = ['server/api/send-email.php', 'server/api/website-proof.php', 'server/api/google-rating.php'];
const preserveEndpoints = process.argv.includes('--preserve-existing-endpoints');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${basename(command)} ${args[0]} failed (${result.status ?? result.error?.message})`);
}

const dateFlag = process.argv.indexOf('--date');
const now = new Date();
const date = dateFlag > -1 ? process.argv[dateFlag + 1] : `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
if (!/^\d{8}$/.test(date ?? '')) throw new Error('--date must be YYYYMMDD');

const outDir = resolve(repoRoot, '.artifacts', '20i-production');
const tagFlag = process.argv.indexOf('--tag');
const tag = tagFlag > -1 ? process.argv[tagFlag + 1] : '';
if (tagFlag > -1 && !/^[a-z][a-z0-9-]{0,30}$/.test(tag ?? '')) throw new Error('--tag must be a short lowercase label');
const name = `freshtech-production-${date}${preserveEndpoints ? '-update' : ''}${tag ? `-${tag}` : ''}`;
const siteDir = resolve(outDir, `${name}-site`);
const manifestPath = resolve(outDir, `${name}-manifest.json`);
const zipPath = resolve(outDir, `${name}.zip`);
for (const path of [siteDir, manifestPath, zipPath]) {
  if (existsSync(path)) throw new Error(`Refusing to overwrite ${path}; use a new --tag to preserve the earlier package`);
}
if (!existsSync(resolve(distDir, 'index.html'))) throw new Error('Run PUBLIC_SITE_MODE=production npm run build in prototypes/html-first-slice first');

// Re-run the release gate on the exact output being packaged.
run(process.execPath, [resolve(sliceDir, 'scripts', 'production-output-check.mjs'), distDir]);

// Font provenance notes stay in the repository; only public file types ship.
await mkdir(outDir, { recursive: true });
await cp(distDir, siteDir, { recursive: true, filter: source => !/PROVENANCE\.md$/i.test(source) });

run(process.execPath, [resolve(repoRoot, 'scripts', 'generate-apache-static-config.mjs'),
  '--mode', 'production', '--site-dir', siteDir, '--out', resolve(siteDir, '.htaccess'), '--manifest-out', manifestPath]);

// The manifest inventory refuses PHP by design; the endpoint is added explicitly.
await mkdir(resolve(siteDir, 'server', 'api'), { recursive: true });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.preservedFiles = preserveEndpoints ? ['server/api/send-email.php'] : [];
for (const path of ENDPOINT_PATHS) {
  if (manifest.preservedFiles.includes(path)) continue;
  const endpoint = await readFile(resolve(sliceDir, path));
  await writeFile(resolve(siteDir, path), endpoint);
  manifest.files.push({ path, bytes: endpoint.byteLength, sha256: createHash('sha256').update(endpoint).digest('hex'), serverSide: true });
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

run(process.env.PYTHON || 'python', [resolve(repoRoot, 'scripts', 'package-static-preview.py'),
  '--mode', 'production', '--source', siteDir, '--manifest', manifestPath, '--out', zipPath]);

const archive = await readFile(zipPath);
console.log(JSON.stringify({
  zip: zipPath,
  bytes: (await stat(zipPath)).size,
  sha256: createHash('sha256').update(archive).digest('hex'),
  manifest: manifestPath,
  files: manifest.files.length,
}, null, 2));
