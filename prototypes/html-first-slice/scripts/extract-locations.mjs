import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLocations } from './lib/location-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'locations-data.mjs');
const locations = readLocations('data/content.ts', await readFile(sourcePath, 'utf8'));
const locationSlugs = locations.map(location => location.slug);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const locations = ${JSON.stringify(locations, null, 2)};\n` +
  `export const locationSlugs = ${JSON.stringify(locationSlugs)};\n`, 'utf8');
console.log(`Extracted ${locations.length} location routes (${locationSlugs.join(', ')}) from ${sourcePath}`);
