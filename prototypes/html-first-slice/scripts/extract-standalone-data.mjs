import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertArray, assertExactKeys, assertPlainObject, assertString, parseSource, topLevelConstLiteral } from './lib/literal-reader.mjs';

// Shared data/content.ts records rendered by standalone pages (FAQ, resources,
// glossary, support), extracted so content edits reach the native pages instead
// of living as copies inside them. Literal-only, fail closed on unexpected shape.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'standalone-data.mjs');
const file = parseSource('data/content.ts', await readFile(sourcePath, 'utf8'));

const faqCategories = assertArray(topLevelConstLiteral(file, 'faqCategories'), 'faqCategories').map((category, index) => {
  const label = `faqCategories[${index}]`;
  assertExactKeys(category, ['title', 'items'], label);
  return {
    title: assertString(category.title, `${label}.title`),
    items: assertArray(category.items, `${label}.items`).map((item, itemIndex) => {
      assertExactKeys(item, ['q', 'a'], `${label}.items[${itemIndex}]`);
      return { q: assertString(item.q, `${label}.items[${itemIndex}].q`), a: assertString(item.a, `${label}.items[${itemIndex}].a`) };
    }),
  };
});

const techDefinitions = assertArray(topLevelConstLiteral(file, 'techDefinitions'), 'techDefinitions').map((entry, index) => {
  const label = `techDefinitions[${index}]`;
  const keys = ['term', 'icon', 'question', 'risk', 'reward'];
  assertExactKeys(entry, keys, label);
  return Object.fromEntries(keys.map(key => [key, assertString(entry[key], `${label}.${key}`)]));
});

// contactDetails is a nested object of strings; copy it as-is after checking
// every leaf is a string so nothing executable or unexpected slips through.
const stringTree = (value, label) => {
  if (typeof value === 'string') return value;
  assertPlainObject(value, label);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, stringTree(child, `${label}.${key}`)]));
};
const contactDetails = stringTree(topLevelConstLiteral(file, 'contactDetails'), 'contactDetails');

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts. Do not edit.\n` +
  `export const faqCategories = ${JSON.stringify(faqCategories, null, 2)};\n` +
  `export const techDefinitions = ${JSON.stringify(techDefinitions, null, 2)};\n` +
  `export const contactDetails = ${JSON.stringify(contactDetails, null, 2)};\n`, 'utf8');
console.log(`Extracted ${faqCategories.length} FAQ categories (${faqCategories.flatMap(category => category.items).length} answers), ${techDefinitions.length} glossary terms and contact details from ${sourcePath}`);
