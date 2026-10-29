import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTeamMembers } from './lib/team-reader.mjs';

// Extracts teamMembers from data/content.ts for the /team/[slug] routes. Each
// member's articles come from the already-extracted published blog records,
// so held and future posts stay excluded exactly as on /blog.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const outputPath = resolve(projectDir, 'src', 'generated', 'team-data.mjs');

const teamMembers = readTeamMembers('data/content.ts', await readFile(sourcePath, 'utf8'));
const teamSlugs = teamMembers.map(member => member.slug);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const teamMembers = ${JSON.stringify(teamMembers, null, 2)};\n` +
  `export const teamSlugs = ${JSON.stringify(teamSlugs)};\n`, 'utf8');
console.log(`Extracted ${teamSlugs.length} team routes (${teamSlugs.join(', ')}) from ${sourcePath}`);
