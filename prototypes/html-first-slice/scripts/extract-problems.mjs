import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertProblemRouteInventory, readProblemRoutes, readProblems } from './lib/problem-reader.mjs';

// Extracts the problemPages records from data/content.ts and proves the
// derived route inventory equals the ProblemPage routes hand-listed in
// App.tsx. Record content is written to the gitignored generated module only;
// the log prints route counts and slugs, never copy.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const appPath = resolve(projectDir, '..', '..', 'App.tsx');
const outputPath = resolve(projectDir, 'src', 'generated', 'problems-data.mjs');

const problems = readProblems('data/content.ts', await readFile(sourcePath, 'utf8'));
const reactRoutes = readProblemRoutes('App.tsx', await readFile(appPath, 'utf8'));
const problemSlugs = assertProblemRouteInventory(problems, reactRoutes);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts and App.tsx. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const problems = ${JSON.stringify(problems, null, 2)};\n` +
  `export const problemSlugs = ${JSON.stringify(problemSlugs)};\n` +
  `// ProblemPage route paths read from App.tsx, in source order; proven equal to the record keys above.\n` +
  `export const problemReactRoutes = ${JSON.stringify(reactRoutes)};\n`, 'utf8');
console.log(`Extracted ${problems.length} problem routes (${problemSlugs.join(', ')}) from ${sourcePath}; ${reactRoutes.length} App.tsx routes matched`);
