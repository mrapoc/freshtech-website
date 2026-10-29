import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRouteInventory, readServiceLocationRoutes, readServiceLocations } from './lib/service-location-reader.mjs';
import { countyHubSlug } from '../src/lib/service-location-display.mjs';

// Extracts the serviceLocationPages records from data/content.ts and proves the
// derived route inventory equals the ServiceLocationPage routes hand-listed in
// App.tsx. Record content is written to the gitignored generated module only;
// the log prints route counts and slugs, never copy.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const appPath = resolve(projectDir, '..', '..', 'App.tsx');
const outputPath = resolve(projectDir, 'src', 'generated', 'service-locations-data.mjs');

const serviceLocations = readServiceLocations('data/content.ts', await readFile(sourcePath, 'utf8'));
const reactRoutes = readServiceLocationRoutes('App.tsx', await readFile(appPath, 'utf8'));
const serviceLocationSlugs = assertRouteInventory(serviceLocations, reactRoutes);
const hubs = serviceLocations.filter(page => countyHubSlug(page, serviceLocationSlugs)).length;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts and App.tsx. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const serviceLocations = ${JSON.stringify(serviceLocations, null, 2)};\n` +
  `export const serviceLocationSlugs = ${JSON.stringify(serviceLocationSlugs)};\n` +
  `// ServiceLocationPage route paths read from App.tsx, in source order; proven equal to the record keys above.\n` +
  `export const serviceLocationReactRoutes = ${JSON.stringify(reactRoutes)};\n`, 'utf8');
console.log(`Extracted ${serviceLocations.length} service-location routes (${serviceLocationSlugs.join(', ')}) from ${sourcePath}; ${reactRoutes.length} App.tsx routes matched; ${hubs} town routes link to a county hub`);
