import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCaseStudies } from './lib/case-study-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'case-studies-data.mjs');

const caseStudies = readCaseStudies('data/content.ts', await readFile(sourcePath, 'utf8'));
const caseStudySlugs = caseStudies.map(study => study.slug);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
    `export const caseStudies = ${JSON.stringify(caseStudies, null, 2)};\n` +
    `export const caseStudySlugs = ${JSON.stringify(caseStudySlugs)};\n`,
  'utf8',
);
// Build logs name only the count and slugs, never record content.
console.log(`Extracted ${caseStudies.length} case study routes (${caseStudySlugs.join(', ')}) from ${sourcePath}`);
