import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertArray, assertExactKeys, assertString, literalValue, parseSource, topLevelConstLiteral, ts,
} from './lib/literal-reader.mjs';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectDir, '..', '..');
const sourcePath = resolve(projectDir, '..', '..', 'pages-v2', 'PricingPageV2.tsx');
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
const source = await readFile(sourcePath, 'utf8');
const file = parseSource('pages-v2/PricingPageV2.tsx', source);
function nestedConstLiteral(name) {
  const matches = [];
  (function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) matches.push(node);
    ts.forEachChild(node, visit);
  })(file);
  if (matches.length !== 1) throw new Error(`${file.fileName} must declare ${name} exactly once (found ${matches.length})`);
  const declaration = matches[0];
  if (!(declaration.parent.flags & ts.NodeFlags.Const) || !declaration.initializer) throw new Error(`${name} must be an initialised const declaration`);
  return literalValue(file, declaration.initializer);
}
const tiers = assertArray(topLevelConstLiteral(file, 'TIERS'), 'TIERS', 3);
const universalInclusions = assertArray(topLevelConstLiteral(file, 'UNIVERSAL_INCLUSIONS'), 'UNIVERSAL_INCLUSIONS');
const slaRows = assertArray(topLevelConstLiteral(file, 'SLA_ROWS'), 'SLA_ROWS');
const objections = assertArray(topLevelConstLiteral(file, 'OBJECTIONS'), 'OBJECTIONS');
const calculatorRates = nestedConstLiteral('tierRates');
const minimumMonthly = nestedConstLiteral('MIN_MONTHLY');

const expectedNames = ['Standard', 'Plus', 'Premium'];
if (tiers.length !== expectedNames.length) throw new Error(`TIERS must contain exactly ${expectedNames.length} entries`);
tiers.forEach((tier, index) => {
  const optional = tier.name === 'Premium' ? [] : tier.name === 'Plus' ? ['minimum', 'sticker'] : ['minimum'];
  assertExactKeys(tier, ['name', 'price', 'highlight', 'note', 'features', ...optional], `TIERS[${index}]`);
  if (tier.name !== expectedNames[index]) throw new Error(`TIERS[${index}].name must be ${expectedNames[index]}`);
  assertString(tier.price, `TIERS[${index}].price`);
  assertString(tier.note, `TIERS[${index}].note`);
  if (typeof tier.highlight !== 'boolean') throw new Error(`TIERS[${index}].highlight must be boolean`);
  if (tier.minimum !== undefined) assertString(tier.minimum, `TIERS[${index}].minimum`);
  if (tier.sticker !== undefined) assertString(tier.sticker, `TIERS[${index}].sticker`);
  assertArray(tier.features, `TIERS[${index}].features`).forEach((feature, featureIndex) => assertString(feature, `TIERS[${index}].features[${featureIndex}]`));
});

for (const [index, item] of universalInclusions.entries()) {
  assertExactKeys(item, ['title', 'desc'], `UNIVERSAL_INCLUSIONS[${index}]`);
  assertString(item.title, `UNIVERSAL_INCLUSIONS[${index}].title`);
  assertString(item.desc, `UNIVERSAL_INCLUSIONS[${index}].desc`);
}
for (const [index, row] of slaRows.entries()) {
  assertExactKeys(row, ['priority', 'type', 'response', 'resolution'], `SLA_ROWS[${index}]`);
  for (const key of ['priority', 'type', 'response', 'resolution']) assertString(row[key], `SLA_ROWS[${index}].${key}`);
}
for (const [index, objection] of objections.entries()) {
  assertExactKeys(objection, ['q', 'a'], `OBJECTIONS[${index}]`);
  assertString(objection.q, `OBJECTIONS[${index}].q`);
  assertString(objection.a, `OBJECTIONS[${index}].a`);
}
if (objections.filter(objection => objection.q === '"We don\'t want to be locked in."').length !== 1) {
  throw new Error('OBJECTIONS must contain the agreement question exactly once');
}
assertExactKeys(calculatorRates, expectedNames, 'tierRates');
if (!Number.isFinite(minimumMonthly) || minimumMonthly <= 0) throw new Error('MIN_MONTHLY must be a positive number');
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
  `// Generated from pages-v2/PricingPageV2.tsx. Do not edit.\n` +
    `export const pricing = ${JSON.stringify({ rates: calculatorRates, minimumMonthly, tiers, universalInclusions, slaRows, objections }, null, 2)};\n`,
  'utf8',
);

console.log(`Extracted pricing from ${sourcePath}`);
// Service catalogue, per-service content and navigation are read by the
// TypeScript AST literal reader in scripts/extract-services.mjs.
