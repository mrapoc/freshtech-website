import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPage, sourceDigest } from './lib/standalone-baseline.mjs';
import { STANDALONE_ROUTES } from './lib/standalone-routes.mjs';

// Captures the production prerendered React output of each standalone route
// into test-fixtures/standalone/<name>.json, together with the SHA-256 of the
// React component that renders it. The native output gate compares against
// these fixtures and refuses to run when a component has changed since capture.
// Usage: node scripts/capture-standalone-baseline.mjs [route ...]
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(projectDir, '..', '..');
const outDir = resolve(projectDir, 'test-fixtures', 'standalone');
const wanted = process.argv.slice(2);
await mkdir(outDir, { recursive: true });
for (const entry of STANDALONE_ROUTES.filter(item => !wanted.length || wanted.includes(item.route))) {
  const response = await fetch(`https://fresh-tech.uk${entry.route}`, { redirect: 'manual', headers: { 'user-agent': 'FreshTech-static-parity-capture' } });
  if (response.status !== 200) throw new Error(`${entry.route}: production returned ${response.status}`);
  const page = extractPage(await response.text());
  const source = await readFile(resolve(repoDir, entry.source), 'utf8');
  const fixture = { route: entry.route, source: entry.source, sourceSha256: sourceDigest(source), capturedAt: new Date().toISOString(), ...page };
  await writeFile(resolve(outDir, `${entry.name}.json`), `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  console.log(`${entry.route}: ${page.content.headings.length} headings, ${page.content.links.length} links, ${page.content.images.length} images, ${page.content.text.length} chars`);
}
