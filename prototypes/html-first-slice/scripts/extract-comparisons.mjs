import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readComparisons } from './lib/comparison-reader.mjs';

// Extracts the comparisonPages records from data/content.ts; the record keys
// are the route inventory. The log prints route counts and slugs, never copy.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'comparisons-data.mjs');

const comparisons = readComparisons('data/content.ts', await readFile(sourcePath, 'utf8'));
const comparisonSlugs = comparisons.map(page => page.slug);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const comparisons = ${JSON.stringify(comparisons, null, 2)};\n` +
  `export const comparisonSlugs = ${JSON.stringify(comparisonSlugs)};\n`, 'utf8');
console.log(`Extracted ${comparisons.length} comparison routes (${comparisonSlugs.join(', ')}) from ${sourcePath}`);
