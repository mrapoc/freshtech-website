import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProblems } from './lib/problem-reader.mjs';

// Extracts the problemPages records from data/content.ts; the record keys are
// the route inventory. Record content is written to the gitignored generated module only;
// the log prints route counts and slugs, never copy.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'problems-data.mjs');

const problems = readProblems('data/content.ts', await readFile(sourcePath, 'utf8'));
const problemSlugs = problems.map(page => page.slug);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const problems = ${JSON.stringify(problems, null, 2)};\n` +
  `export const problemSlugs = ${JSON.stringify(problemSlugs)};\n`, 'utf8');
console.log(`Extracted ${problems.length} problem routes (${problemSlugs.join(', ')}) from ${sourcePath}`);
