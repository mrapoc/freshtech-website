import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTechnologyData,
  readServiceCatalogue,
  readTechExplainers,
  readTechnologyPages,
} from './lib/technology-reader.mjs';

// Projects the technology family onto src/generated/technology-data.mjs.
// Sources, all read as literals and never executed:
// - data/content.ts (canonical root file by default): `techExplainers` and the
//   `services` slug/title catalogue used to resolve related-service links.
//   `--source PATH` substitutes an approved projection file that declares the
//   same two exports, for workers that must not read the canonical file.
// - data/technology-pages.json: the /technology cards and category order, and
//   the "More Technology Explained" directory.
// The generated module is build output and is not committed.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = resolve(projectDir, '..', '..');
const outputPath = resolve(projectDir, 'src', 'generated', 'technology-data.mjs');

function parseArguments(argv) {
  let source = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--source') {
      source = argv[index + 1];
      if (!source) throw new Error('--source requires a path');
      index += 1;
    } else if (argument.startsWith('--source=')) {
      source = argument.slice('--source='.length);
      if (!source) throw new Error('--source requires a path');
    } else {
      throw new Error(`Unknown argument ${argument}`);
    }
  }
  return { source };
}

const { source } = parseArguments(process.argv.slice(2));
const contentPath = source ? resolve(process.cwd(), source) : resolve(rootDir, 'data', 'content.ts');
const contentLabel = source ? source.replaceAll('\\', '/') : 'data/content.ts';
const pagesPath = resolve(rootDir, 'data', 'technology-pages.json');

const contentSource = await readFile(contentPath, 'utf8');
const explainers = readTechExplainers(contentLabel, contentSource);
const services = readServiceCatalogue(contentLabel, contentSource);
const { listing, directory } = readTechnologyPages(JSON.parse(await readFile(pagesPath, 'utf8')));

const data = buildTechnologyData({ explainers, listing, directory, services });

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from ${contentLabel} and data/technology-pages.json. Do not edit.\n` +
  `// Records are inherited parity data, not newly verified copy.\n` +
  `export const techExplainers = ${JSON.stringify(data.techExplainers, null, 2)};\n` +
  `export const techSlugs = ${JSON.stringify(data.techSlugs)};\n` +
  `export const technologyListing = ${JSON.stringify(data.technologyListing, null, 2)};\n` +
  `export const technologyDirectory = ${JSON.stringify(data.technologyDirectory, null, 2)};\n` +
  `// Explainer routes with no card on /technology (still emitted).\n` +
  `export const unlistedSlugs = ${JSON.stringify(data.unlistedSlugs)};\n`, 'utf8');

const unresolved = data.techExplainers
  .filter(record => record.unresolvedRelatedServices.length)
  .map(record => `${record.slug}: ${record.unresolvedRelatedServices.join(', ')}`);
console.log(`Extracted ${data.techSlugs.length} technology routes (${data.techSlugs.join(', ')}) from ${contentPath}`);
console.log(`Listing: ${data.technologyListing.pages.length} cards in ${data.technologyListing.categories.length} categories; directory: ${data.technologyDirectory.length} entries`);
if (data.unlistedSlugs.length) console.log(`Explainers without a listing card: ${data.unlistedSlugs.join(', ')}`);
if (unresolved.length) console.log(`Related services with no catalogue entry (not rendered): ${unresolved.join('; ')}`);
