import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const projectDir = resolve(import.meta.dirname, '..');
const defaultSource = resolve(projectDir, '..', '..', '..', 'static-generation-prototype', '.static-prototype', 'worker-html', 'services', 'managed-it-support', 'index.html');
const sourcePath = resolve(process.argv[2] || defaultSource);
const outputPath = resolve(projectDir, 'test-fixtures', 'managed-service-react-head.json');
const html = await readFile(sourcePath, 'utf8');
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const title = unescape(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
const canonicalMatches = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)];
const canonical = unescape(canonicalMatches.at(-1)?.[1] || '');
const metadata = {};
for (const tag of html.match(/<meta\s+[^>]+>/gi) || []) {
  const key = tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1];
  const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
  if (key && content !== undefined) metadata[key] = unescape(content);
}
const schemaText = html.match(/<script id=["']json-ld-schema["'] type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1];
if (!title || !canonical || !schemaText) throw new Error('Retained React output is missing required head fields');
const retained = {
  provenance: {
    source: '.worktrees/static-generation-prototype/.static-prototype/worker-html/services/managed-it-support/index.html',
    sha256: createHash('sha256').update(html).digest('hex'),
    note: 'Retained output from the independently built React static-generation prototype.',
  },
  title,
  canonical,
  metadata,
  schemas: JSON.parse(schemaText),
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(retained, null, 2)}\n`, 'utf8');
console.log(`Captured retained React head baseline from ${sourcePath}`);
