// Production release gate for a PUBLIC_SITE_MODE=production build that already
// contains its root files (scripts/production-root-files.mjs).
//
// Usage: node scripts/production-output-check.mjs <production-dist>
import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

import { PRODUCTION_ROBOTS } from '../src/lib/site-mode.mjs';
import { INDEXNOW_KEY_FILE } from './production-root-files.mjs';

const ORIGIN = 'https://fresh-tech.uk';
// Built, indexable pages deliberately absent from the sitemap (route -> reason).
// /blog/scheduled is not built at all: it is an authenticated React tool.
export const UNLISTED_ROUTES = new Map();
// Pages that deliberately carry noindex in production (route -> reason).
export const NOINDEX_ROUTES = new Map();
const BANNER_TEXT = [
  'HTML-first complete-route comparison. Local prototype only.',
  'HTML-first contact comparison. Local preview only.',
  'Local Astro parity prototype. Not published.',
];
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.xml', '.txt', '.json', '.webmanifest', '.svg']);
const PREVIEW_COPY = /\b(?:this|static) preview\b|\bpreview (?:host|build)\b/i;

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const tags = (html, pattern) => [...html.matchAll(pattern)].map(match => match[0]);

export async function checkProductionOutput(distDir) {
  const failures = [];
  const fail = message => failures.push(message);
  const files = (await readdir(distDir, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => relative(distDir, resolve(entry.parentPath, entry.name)).split(sep).join('/'));

  const pages = new Map();
  for (const file of files.filter(path => path === 'index.html' || path.endsWith('/index.html'))) {
    pages.set(file === 'index.html' ? '/' : `/${file.slice(0, -'/index.html'.length)}`, await readFile(resolve(distDir, file), 'utf8'));
  }
  if (!pages.size) fail('no built pages found');

  // Sitemap: every URL built, every indexable page listed.
  const sitemap = await readFile(resolve(distDir, 'sitemap.xml'), 'utf8').catch(() => '');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  if (!locs.length) fail('sitemap.xml is missing or lists no URLs');
  const listed = new Set();
  for (const loc of locs) {
    if (!loc.startsWith(`${ORIGIN}/`)) { fail(`sitemap URL outside ${ORIGIN}: ${loc}`); continue; }
    const route = loc === `${ORIGIN}/` ? '/' : loc.slice(ORIGIN.length);
    if (listed.has(route)) fail(`sitemap lists ${route} twice`);
    listed.add(route);
    if (!pages.has(route)) fail(`sitemap URL has no built page: ${loc}`);
  }

  const holds = JSON.parse(await readFile(resolve(import.meta.dirname, '../../../data/editorial-holds.json'), 'utf8')).slugs;
  const rss = await readFile(resolve(distDir, 'rss.xml'), 'utf8').catch(() => '');
  if (!rss.includes('<rss')) fail('rss.xml is missing');
  for (const slug of holds) {
    if (listed.has(`/blog/${slug}`) || rss.includes(`/blog/${slug}<`) || pages.has(`/blog/${slug}`)) fail(`editorial hold leaked: ${slug}`);
  }

  for (const [route, html] of pages) {
    const robots = tags(html, /<meta name="robots"[^>]*>/g);
    const noindex = NOINDEX_ROUTES.has(route);
    if (robots.length !== 1) fail(`${route}: expected one robots meta, found ${robots.length}`);
    else if (noindex ? !/noindex/.test(attr(robots[0], 'content') ?? '') : attr(robots[0], 'content') !== PRODUCTION_ROBOTS) {
      fail(`${route}: unexpected robots "${attr(robots[0], 'content')}"`);
    }
    if (!noindex && !listed.has(route) && !UNLISTED_ROUTES.has(route)) fail(`${route}: indexable page missing from sitemap`);

    const canonical = tags(html, /<link rel="canonical"[^>]*>/g);
    const ogUrl = tags(html, /<meta property="og:url"[^>]*>/g);
    const expected = route === '/' ? `${ORIGIN}/` : `${ORIGIN}${route}`;
    if (canonical.length !== 1 || attr(canonical[0], 'href') !== expected) fail(`${route}: canonical must be exactly ${expected}`);
    if (ogUrl.length !== 1 || attr(ogUrl[0], 'content') !== expected) fail(`${route}: og:url must be exactly ${expected}`);

    if (html.includes('class="prototype-banner"') || BANNER_TEXT.some(text => html.includes(text))) fail(`${route}: prototype banner present`);
    if (html.includes('data-contact-disabled')) fail(`${route}: disabled contact form rendered`);
    for (const form of tags(html, /<form[^>]*data-contact-form[^>]*>/g)) {
      if (attr(form, 'data-submission-mode') !== 'enabled') fail(`${route}: contact form is not enabled`);
    }
    for (const tool of tags(html, /<div[^>]*\sdata-email-checker(?=[\s>])[^>]*>/g)) {
      if (attr(tool, 'data-lead-capture') !== 'enabled') fail(`${route}: email checker lead capture is not enabled`);
    }
    // The production CSP omits 'unsafe-inline' from script-src, so any inline
    // executable script, event-handler attribute or javascript: URL would be
    // blocked in the browser. JSON-LD and other data blocks are not executed.
    for (const script of tags(html, /<script(?![^>]*\ssrc=)[^>]*>/g)) {
      const type = (attr(script, 'type') ?? '').toLowerCase();
      if (['', 'module', 'text/javascript', 'application/javascript'].includes(type)) fail(`${route}: inline executable script (blocked by CSP)`);
    }
    if (/<[a-z][^>]*\son[a-z]+=/i.test(html)) fail(`${route}: inline event-handler attribute (blocked by CSP)`);
    if (/\s(?:href|src|action)="\s*javascript:/i.test(html)) fail(`${route}: javascript: URL (blocked by CSP)`);
    // A form that falls back to GET would put typed email addresses in the URL,
    // server logs and analytics page locations.
    for (const form of html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)) {
      const method = (attr(form[0].match(/<form\b[^>]*>/)[0], 'method') ?? 'get').toLowerCase();
      if (method !== 'post' && /<input[^>]*\stype="email"/.test(form[0])) fail(`${route}: form with an email field does not use method="post"`);
    }
    if (html.includes('id="ec-preview-note"') || /<input[^>]*id="ec-consent"[^>]*\sdisabled/.test(html)) fail(`${route}: email checker preview note or disabled consent present`);
  }

  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(extname(file).toLowerCase())) continue;
    const body = await readFile(resolve(distDir, file), 'utf8');
    if (body.includes('preview.fresh-tech.uk')) fail(`${file}: references preview.fresh-tech.uk`);
    if (body.includes('/.netlify/')) fail(`${file}: references a /.netlify/ path`);
    if (extname(file) === '.html' && PREVIEW_COPY.test(body)) fail(`${file}: preview-only copy present (${body.match(PREVIEW_COPY)[0]})`);
  }

  const robotsTxt = await readFile(resolve(distDir, 'robots.txt'), 'utf8').catch(() => '');
  if (!/^Sitemap: https:\/\/fresh-tech\.uk\/sitemap\.xml\s*$/m.test(robotsTxt)) fail('robots.txt lacks the production Sitemap line');
  if (/^Disallow:\s*\/\s*$/m.test(robotsTxt)) fail('robots.txt disallows the whole site');
  if (!/^User-agent: GPTBot\s*\nAllow: \/\s*$/m.test(robotsTxt.replaceAll('\r', ''))) fail('robots.txt no longer allows AI crawlers');
  const key = await readFile(resolve(distDir, INDEXNOW_KEY_FILE), 'utf8').catch(() => '');
  if (key.trim() !== INDEXNOW_KEY_FILE.replace(/\.txt$/, '')) fail('IndexNow key file is missing or wrong');

  return { pages: pages.size, sitemapUrls: locs.length, failures };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  if (!process.argv[2]) throw new Error('usage: node scripts/production-output-check.mjs <production-dist>');
  const report = await checkProductionOutput(resolve(process.argv[2]));
  if (report.failures.length) {
    console.error(`Production output check failed (${report.failures.length}):\n${report.failures.slice(0, 50).join('\n')}`);
    process.exit(1);
  }
  console.log(`Production output check passed: ${report.pages} pages, ${report.sitemapUrls} sitemap URLs, unlisted exclusions: ${UNLISTED_ROUTES.size}, noindex exclusions: ${NOINDEX_ROUTES.size}.`);
}
