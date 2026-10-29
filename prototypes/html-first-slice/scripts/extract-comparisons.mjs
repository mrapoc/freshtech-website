import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPARISON_SOURCE_FILE, assertComparisonRouteInventory, assertComparisonSource, readComparisonRoutes, readComparisons } from './lib/comparison-reader.mjs';

// Extracts the comparisonPages records from data/content.ts and proves the
// derived route inventory equals the ComparisonPage routes hand-listed in
// App.tsx. The log prints route counts and slugs, never copy.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const appPath = resolve(projectDir, '..', '..', 'App.tsx');
const outputPath = resolve(projectDir, 'src', 'generated', 'comparisons-data.mjs');

assertComparisonSource(await readFile(resolve(projectDir, '..', '..', ...COMPARISON_SOURCE_FILE.split('/')), 'utf8'));
const comparisons = readComparisons('data/content.ts', await readFile(sourcePath, 'utf8'));
const reactRoutes = readComparisonRoutes('App.tsx', await readFile(appPath, 'utf8'));
const comparisonSlugs = assertComparisonRouteInventory(comparisons, reactRoutes);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts and App.tsx. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const comparisons = ${JSON.stringify(comparisons, null, 2)};\n` +
  `export const comparisonSlugs = ${JSON.stringify(comparisonSlugs)};\n`, 'utf8');
console.log(`Extracted ${comparisons.length} comparison routes (${comparisonSlugs.join(', ')}) from ${sourcePath}; ${reactRoutes.length} App.tsx routes matched`);
