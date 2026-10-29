import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicationOf, punctuationConflicts, readBlogPosts, ukCalendarDate } from './lib/blog-reader.mjs';

// Extracts the published blog records from data/content.ts. Held slugs come
// from data/editorial-holds.json (the same file the sitemap and prerender use)
// and "today" is the UK calendar date, overridable with BLOG_PUBLISH_AS_OF for
// reproducible builds. Held and future posts are never written as records:
// only their slugs are, so the output checker can prove they were not emitted.
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectDir, '..', '..', 'data', 'content.ts');
const holdsPath = resolve(projectDir, '..', '..', 'data', 'editorial-holds.json');
const outputPath = resolve(projectDir, 'src', 'generated', 'blog-data.mjs');

const holds = JSON.parse(await readFile(holdsPath, 'utf8'));
if (!Array.isArray(holds.slugs) || holds.slugs.some(slug => typeof slug !== 'string')) throw new Error('data/editorial-holds.json must list string slugs');
const asOf = process.env.BLOG_PUBLISH_AS_OF || ukCalendarDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('BLOG_PUBLISH_AS_OF must be an ISO calendar date (YYYY-MM-DD)');

const posts = readBlogPosts('data/content.ts', await readFile(sourcePath, 'utf8'));
const publication = publicationOf(posts, { heldSlugs: new Set(holds.slugs), asOf });
const unknownHolds = holds.slugs.filter(slug => !posts.some(post => post.slug === slug));
const conflicts = publication.published.flatMap(punctuationConflicts);
const blogSlugs = publication.published.map(post => post.slug);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath,
  `// Generated from data/content.ts and data/editorial-holds.json. Do not edit. Records are inherited parity data, not newly verified copy.\n` +
  `export const blogPosts = ${JSON.stringify(publication.published, null, 2)};\n` +
  `export const blogSlugs = ${JSON.stringify(blogSlugs)};\n` +
  `// Publication decision inputs: UK calendar date used and the slugs excluded by hold or future date.\n` +
  `export const blogPublication = ${JSON.stringify({ asOf, sourceCount: posts.length, heldSlugs: publication.held, futureSlugs: publication.future }, null, 2)};\n`, 'utf8');

console.log(`Extracted ${blogSlugs.length} published blog routes of ${posts.length} source records as of ${asOf} UK (${publication.held.length} held, ${publication.future.length} future-dated) from ${sourcePath}`);
if (unknownHolds.length) console.warn(`Warning: editorial holds without a matching blogPosts record: ${unknownHolds.join(', ')}`);
if (conflicts.length) console.warn(`Warning: ${conflicts.length} punctuation conflict(s) in published copy (not rewritten):\n  ${conflicts.join('\n  ')}`);
