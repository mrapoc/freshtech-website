import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertArray, assertExactKeys, assertPlainObject, assertString } from './lib/literal-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectDir, '..', '..');
const sourcePath = resolve(repositoryRoot, 'data', 'pricing.json');
const outputPath = resolve(projectDir, 'src', 'generated', 'pricing-data.mjs');
const fontDir = resolve(projectDir, 'public', 'fonts');
const fontFiles = [
  ['brand/fonts/bungee/bungee-v17-latin-headings.woff2', 'bungee-latin.woff2'],
  ['brand/fonts/bungee/bungee-v17-latin-ext.woff2', 'bungee-latin-ext.woff2'],
  ['brand/fonts/archivo/archivo-v25-latin.woff2', 'archivo-v25-latin.woff2'],
  ['brand/fonts/archivo/archivo-v25-latin-ext.woff2', 'archivo-v25-latin-ext.woff2'],
  ['brand/fonts/archivo-narrow/archivo-narrow-v35-latin.woff2', 'archivo-narrow-v35-latin.woff2'],
  ['brand/fonts/archivo-narrow/archivo-narrow-v35-latin-ext.woff2', 'archivo-narrow-v35-latin-ext.woff2'],
  ['public/fonts/bungee/OFL.txt', 'BUNGEE-OFL.txt'],
  ['public/fonts/bungee/PROVENANCE.md', 'BUNGEE-PROVENANCE.md'],
  ['public/fonts/archivo/OFL.txt', 'ARCHIVO-OFL.txt'],
  ['public/fonts/archivo/PROVENANCE.md', 'ARCHIVO-PROVENANCE.md'],
  ['public/fonts/archivo-narrow/OFL.txt', 'ARCHIVO-NARROW-OFL.txt'],
  ['public/fonts/archivo-narrow/PROVENANCE.md', 'ARCHIVO-NARROW-PROVENANCE.md'],
];
const source = assertPlainObject(JSON.parse(await readFile(sourcePath, 'utf8')), 'data/pricing.json');
assertExactKeys(source, ['rates', 'minimumMonthly', 'tiers', 'universalInclusions', 'slaRows', 'objections'], 'data/pricing.json');
const tiers = assertArray(source.tiers, 'tiers', 3);
const universalInclusions = assertArray(source.universalInclusions, 'universalInclusions');
const slaRows = assertArray(source.slaRows, 'slaRows');
const objections = assertArray(source.objections, 'objections');
const calculatorRates = assertPlainObject(source.rates, 'rates');
const minimumMonthly = source.minimumMonthly;

const expectedNames = ['Standard', 'Plus', 'Premium'];
if (tiers.length !== expectedNames.length) throw new Error(`tiers must contain exactly ${expectedNames.length} entries`);
tiers.forEach((tier, index) => {
  const optional = tier.name === 'Premium' ? [] : tier.name === 'Plus' ? ['minimum', 'sticker'] : ['minimum'];
  assertExactKeys(tier, ['name', 'price', 'highlight', 'note', 'features', ...optional], `tiers[${index}]`);
  if (tier.name !== expectedNames[index]) throw new Error(`tiers[${index}].name must be ${expectedNames[index]}`);
  assertString(tier.price, `tiers[${index}].price`);
  assertString(tier.note, `tiers[${index}].note`);
  if (typeof tier.highlight !== 'boolean') throw new Error(`tiers[${index}].highlight must be boolean`);
  if (tier.minimum !== undefined) assertString(tier.minimum, `tiers[${index}].minimum`);
  if (tier.sticker !== undefined) assertString(tier.sticker, `tiers[${index}].sticker`);
  assertArray(tier.features, `tiers[${index}].features`).forEach((feature, featureIndex) => assertString(feature, `tiers[${index}].features[${featureIndex}]`));
});

for (const [index, item] of universalInclusions.entries()) {
  assertExactKeys(item, ['title', 'desc'], `universalInclusions[${index}]`);
  assertString(item.title, `universalInclusions[${index}].title`);
  assertString(item.desc, `universalInclusions[${index}].desc`);
}
for (const [index, row] of slaRows.entries()) {
  assertExactKeys(row, ['priority', 'type', 'response', 'resolution'], `slaRows[${index}]`);
  for (const key of ['priority', 'type', 'response', 'resolution']) assertString(row[key], `slaRows[${index}].${key}`);
}
for (const [index, objection] of objections.entries()) {
  assertExactKeys(objection, ['q', 'a'], `objections[${index}]`);
  assertString(objection.q, `objections[${index}].q`);
  assertString(objection.a, `objections[${index}].a`);
}
if (objections.filter(objection => objection.q === '"We don\'t want to be locked in."').length !== 1) {
  throw new Error('objections must contain the agreement question exactly once');
}
assertExactKeys(calculatorRates, expectedNames, 'rates');
if (!Number.isFinite(minimumMonthly) || minimumMonthly <= 0) throw new Error('minimumMonthly must be a positive number');
for (const [index, name] of expectedNames.entries()) {
  const cardRate = Number(tiers[index].price);
  if (!Number.isFinite(calculatorRates[name]) || calculatorRates[name] !== cardRate) {
    throw new Error(`${name} card price and calculator rate differ in ${sourcePath}`);
  }
}

await mkdir(dirname(outputPath), { recursive: true });
await mkdir(fontDir, { recursive: true });
await Promise.all(fontFiles.map(([source, destination]) => copyFile(resolve(repositoryRoot, source), resolve(fontDir, destination))));
await writeFile(
  outputPath,
  `// Generated from data/pricing.json. Do not edit.\n` +
    `export const pricing = ${JSON.stringify({ rates: calculatorRates, minimumMonthly, tiers, universalInclusions, slaRows, objections }, null, 2)};\n`,
  'utf8',
);

console.log(`Extracted pricing from ${sourcePath}`);
