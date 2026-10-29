import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_ALIASES, readIndustries } from './lib/industry-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'industries-data.mjs');
const industries = readIndustries('data/content.ts', await readFile(sourcePath, 'utf8'));
const industrySlugs = industries.map(industry => industry.slug);
for (const target of Object.values(ROUTE_ALIASES)) {
  if (!industrySlugs.includes(target)) throw new Error(`Route alias target ${target} is not an industryPages record`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const industries = ${JSON.stringify(industries, null, 2)};\n` +
  `export const industrySlugs = ${JSON.stringify(industrySlugs)};\n` +
  `// React-side redirects; emitted as data for edge routing, never as duplicate routes.\n` +
  `export const industryRouteAliases = ${JSON.stringify(ROUTE_ALIASES)};\n`, 'utf8');
console.log(`Extracted ${industries.length} industry routes (${industrySlugs.join(', ')}) from ${sourcePath}`);
