import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGuides } from './lib/guide-reader.mjs';

// Extracts every industry guide from data/industryGuides.ts into
// src/generated/guides-data.mjs without executing the source. Locked sections
// are emitted like any other section (the native preview renders them in full;
// no gating or email capture happens here). The source file is read only.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'industryGuides.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'guides-data.mjs');

const guides = readGuides('data/industryGuides.ts', await readFile(sourcePath, 'utf8'));
const guideSlugs = guides.map(guide => guide.slug);
const sectionCount = guides.reduce((total, guide) => total + guide.sections.length, 0);
const checkCount = guides.reduce((total, guide) => total + guide.sections.reduce((inner, section) => inner + section.checklist.length, 0), 0);
const lockedCount = guides.reduce((total, guide) => total + guide.sections.filter(section => section.locked).length, 0);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/industryGuides.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `// section.icon is a lucide-react icon name (string), validated against the reader's allow-list.\n` +
  `// section.locked mirrors the source flag; every section is emitted regardless.\n` +
  `export const guides = ${JSON.stringify(guides, null, 2)};\n` +
  `export const guideSlugs = ${JSON.stringify(guideSlugs)};\n`, 'utf8');
console.log(`Extracted ${guides.length} guide routes (${guideSlugs.join(', ')}) with ${sectionCount} sections (${lockedCount} locked) and ${checkCount} checklist items from ${sourcePath}`);
