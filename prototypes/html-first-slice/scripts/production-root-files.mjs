// Writes the production root files into a production build directory:
// sitemap.xml and rss.xml from the root React generators (editorial holds
// respected), robots.txt and the IndexNow key file copied from the root public
// folder. Native images, fonts, icons and manifest live in this application's
// public folder and are also copied by Astro.
//
// Usage: node scripts/production-root-files.mjs <production-dist>
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectDir = resolve(import.meta.dirname, '..');
const repoRoot = resolve(projectDir, '..', '..');
export const INDEXNOW_KEY_FILE = '2b725a5296b158e1900494bc69ec6024.txt';

export async function writeProductionRootFiles(distDir) {
  const { generateSitemap } = await import('../../../scripts/generate-sitemap.js');
  const { extractBlogPosts, generateRSS, isFuturePost } = await import('../../../scripts/generate-rss.js');
  const holds = new Set(JSON.parse(await readFile(resolve(repoRoot, 'data', 'editorial-holds.json'), 'utf8')).slugs);

  // The sitemap generator already excludes held and future-dated posts.
  await generateSitemap(resolve(distDir, 'sitemap.xml'));

  // Same feed as the React build (scheduled posts only, for Publer), minus held posts.
  const scheduled = extractBlogPosts().filter(post => isFuturePost(post.date) && !holds.has(post.slug));
  await writeFile(resolve(distDir, 'rss.xml'), generateRSS(scheduled, true), 'utf8');

  const robots = await readFile(resolve(repoRoot, 'public', 'robots.txt'), 'utf8');
  if (!/^Sitemap: https:\/\/fresh-tech\.uk\/sitemap\.xml\s*$/m.test(robots)) {
    throw new Error('public/robots.txt must point its Sitemap line at https://fresh-tech.uk/sitemap.xml');
  }
  await copyFile(resolve(repoRoot, 'public', 'robots.txt'), resolve(distDir, 'robots.txt'));
  await copyFile(resolve(repoRoot, 'public', INDEXNOW_KEY_FILE), resolve(distDir, INDEXNOW_KEY_FILE));
  // The native manifest references the same-origin icons shipped with the site.
  await copyFile(resolve(projectDir, 'public', 'manifest.json'), resolve(distDir, 'manifest.json'));
  console.log(`Production root files written: sitemap.xml, rss.xml (${scheduled.length} scheduled posts), robots.txt, manifest.json, ${INDEXNOW_KEY_FILE}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  if (!process.argv[2]) throw new Error('usage: node scripts/production-root-files.mjs <production-dist>');
  await writeProductionRootFiles(resolve(process.argv[2]));
}
