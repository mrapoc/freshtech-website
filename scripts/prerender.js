/**
 * Pre-render script for SEO
 *
 * Runs AFTER `vite build`. Uses Playwright to render every route in a headless
 * browser and saves the fully-rendered HTML to dist/<path>/index.html.
 *
 * This gives Googlebot (and all bots) correct per-page:
 *   - <title>
 *   - <meta name="description">
 *   - <link rel="canonical">
 *   - Open Graph / Twitter Card tags
 *   - JSON-LD structured data
 *   - Actual page content
 *
 * The site still hydrates as a normal SPA for real users.
 *
 * Route list is extracted from the sitemap generator's same data sources
 * so it stays in sync automatically.
 */

import fs from 'fs';
import path from 'path';
import { getLegalRoutes } from './legal-content.mjs';
import { fileURLToPath, pathToFileURL } from 'url';
import { createServer } from 'http';
import { parse } from 'parse5';
import { optimiseHomepageCss } from './homepage-critical-css.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const BASE_URL = 'https://fresh-tech.uk';

// Editorial hold: slugs awaiting preview approval stay out regardless of the clock.
const HELD_SLUGS = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/editorial-holds.json'), 'utf-8')).slugs
);

// ─── Route extraction (mirrors generate-sitemap.js logic) ──────────────

function extractSlugsFromArray(content, arrayName) {
  const slugs = [];
  const arrayPattern = new RegExp(`export\\s+const\\s+${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm');
  const match = content.match(arrayPattern);
  if (match) {
    for (const m of match[1].matchAll(/slug:\s*["']([^"']+)["']/g)) {
      slugs.push(m[1]);
    }
  }
  return slugs;
}

function extractKeysFromRecord(content, recordName) {
  const keys = [];
  const startPattern = new RegExp(`export\\s+const\\s+${recordName}[^=]*=\\s*\\{`, 'm');
  const startMatch = content.match(startPattern);
  if (!startMatch) return keys;

  const startIdx = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = startIdx;

  while (i < content.length && depth > 0) {
    const ch = content[i];
    if (ch === '{') { depth++; i++; continue; }
    if (ch === '}') { depth--; i++; continue; }

    if (depth === 1) {
      const quotedMatch = content.substring(i).match(/^["']([a-z0-9-]+)["']\s*:\s*\{/);
      if (quotedMatch) { keys.push(quotedMatch[1]); i += quotedMatch[0].length - 1; continue; }
      const unquotedMatch = content.substring(i).match(/^([a-z][a-z0-9-]*)\s*:\s*\{/);
      if (unquotedMatch) { keys.push(unquotedMatch[1]); i += unquotedMatch[0].length - 1; continue; }
    }

    if (ch === '"' || ch === "'") {
      const q = ch; i++;
      while (i < content.length && content[i] !== q) { if (content[i] === '\\') i++; i++; }
    }
    if (ch === '`') {
      i++;
      while (i < content.length && content[i] !== '`') { if (content[i] === '\\') i++; i++; }
    }
    i++;
  }
  return keys;
}

function isFuturePost(dateString) {
  const postDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return postDate > now;
}

function extractBlogSlugs(content) {
  const slugs = [];
  const match = content.match(/export\s+const\s+blogPosts\s*=\s*\[([\s\S]*?)\];\s*export\s+const/);
  if (!match) return slugs;
  const postRegex = /slug:\s*["']([^"']+)["'][\s\S]*?date:\s*["']([^"']+)["']/g;
  let m;
  while ((m = postRegex.exec(match[1])) !== null) {
    if (!HELD_SLUGS.has(m[1]) && !isFuturePost(m[2])) slugs.push(m[1]);
  }
  return slugs;
}

export function getAllRoutes() {
  const routes = [
    '/',
    '/services', '/industries', '/pricing', '/contact', '/about',
    '/case-studies', '/blog', '/faq', '/resources', '/it-health-check',
    '/onboarding', '/why-trust-us', '/technology', '/glossary', '/email-security-check', '/email-security-guide',
    '/microsoft-business-premium', '/cloud-backup-necessity',
    '/managed-print-guide', '/ai-acceptable-use-policy',
    '/upgrade-to-business-premium',
    '/foundation-monitoring', '/compare',
    '/co-managed-it', '/technology-stack', '/service-standards',
    '/privacy-policy', '/cookie-policy', '/terms-conditions',
    ...getLegalRoutes(),
    '/careers', '/support', '/support-upgrade', '/refer',
    // County-level service+location
    '/it-support-shropshire', '/it-support-herefordshire', '/it-support-worcestershire', '/it-support-powys',
    '/cyber-essentials-shropshire', '/cyber-essentials-herefordshire', '/cyber-essentials-worcestershire', '/cyber-essentials-powys',
    '/microsoft-365-shropshire', '/microsoft-365-herefordshire', '/microsoft-365-worcestershire', '/microsoft-365-powys',
    // Town-level service+location
    '/it-support-shrewsbury', '/it-support-telford', '/it-support-hereford', '/it-support-worcester', '/it-support-kidderminster', '/it-support-ludlow',
    '/cyber-essentials-shrewsbury', '/cyber-essentials-telford', '/cyber-essentials-hereford', '/cyber-essentials-worcester', '/cyber-essentials-kidderminster',
    '/microsoft-365-shrewsbury', '/microsoft-365-telford', '/microsoft-365-hereford', '/microsoft-365-worcester', '/microsoft-365-kidderminster',
    // Problem pages
    '/slow-computers', '/it-security-audit', '/switch-it-provider', '/ransomware-recovery', '/office-move-it',
    '/email-account-hacked', '/laptop-stolen-lost', '/business-email-compromise', '/data-breach-discovered',
    '/windows-10-end-of-life', '/office-wifi-problems', '/staff-clicking-phishing',
    '/server-end-of-life', '/it-provider-not-responding', '/new-business-it-setup',
    // Comparison pages
    '/break-fix-vs-managed-it', '/in-house-vs-outsourced-it', '/microsoft-365-plans-compared',
  ];

  // Dynamic routes from content files
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/content.ts'), 'utf-8');

    for (const slug of extractSlugsFromArray(content, 'services')) routes.push(`/services/${slug}`);
    // Industry detail routes come from industryPages ONLY (the data IndustryDetailPageV2
    // renders). The `industries` array has 5 extra slugs with no detail entry that would
    // render empty pages — excluded so they're never prerendered/indexed.
    for (const slug of extractKeysFromRecord(content, 'industryPages')) routes.push(`/industries/${slug}`);
    for (const slug of extractSlugsFromArray(content, 'caseStudies')) routes.push(`/case-studies/${slug}`);
    for (const slug of extractBlogSlugs(content)) routes.push(`/blog/${slug}`);
    for (const slug of extractKeysFromRecord(content, 'locationsData')) routes.push(`/locations/${slug}`);
    for (const slug of extractKeysFromRecord(content, 'techExplainers')) routes.push(`/technology/${slug}`);
    // Team members
    for (const slug of extractSlugsFromArray(content, 'teamMembers')) routes.push(`/team/${slug}`);
  } catch (err) {
    console.warn('⚠️  Could not parse content.ts:', err.message);
  }

  try {
    const guides = fs.readFileSync(path.join(__dirname, '../data/industryGuides.ts'), 'utf-8');
    for (const slug of extractKeysFromRecord(guides, 'industryGuides')) routes.push(`/guides/${slug}`);
  } catch (err) {
    console.warn('⚠️  Could not parse industryGuides.ts:', err.message);
  }

  // Deduplicate
  return [...new Set(routes)];
}

// ─── Static file server for dist/ ──────────────────────────────────────

function startServer(port) {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
      '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'text/xml',
    };

    const server = createServer((req, res) => {
      let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);

      // SPA fallback: if the file doesn't exist and has no extension, serve index.html
      if (!ext && !fs.existsSync(filePath)) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      if (!fs.existsSync(filePath)) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => resolve(server));
  });
}

// ─── Homepage true SSR (build-only experiment) ─────────────────────────

const SSR_MARKER_ATTR = 'data-ft-ssr';
const SSR_MARKER_VALUE = 'home-v1';
const SSR_DATE_ATTR = 'data-ft-ssr-date';

async function renderHomeSsr() {
  const entry = path.join(__dirname, '../dist-ssr/entry-server.js');
  if (!fs.existsSync(entry)) throw new Error('dist-ssr/entry-server.js missing: run `npm run build:ssr-home` first');
  const { renderHome } = await import(pathToFileURL(entry).href);
  const renderedAt = new Date();
  const body = renderHome(renderedAt);
  if (!/<h1[^>]*class="ft-hero-h1"/.test(body)) throw new Error('Homepage SSR markup lacks the hero H1');
  return { body, renderedAt };
}

export function injectHomeSsr(html, { body, renderedAt }) {
  const roots = [];
  const document = parse(html, { sourceCodeLocationInfo: true });
  const visit = node => {
    const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
    if (attrs.id === 'root') roots.push({ node, attrs });
    for (const child of node.childNodes || []) visit(child);
  };
  visit(document);
  if (roots.length !== 1) throw new Error(`Expected one #root in homepage shell, found ${roots.length}`);
  const [{ node, attrs }] = roots;
  if (SSR_MARKER_ATTR in attrs) throw new Error('Homepage already carries SSR markup');
  const location = node.sourceCodeLocation;
  if (!location?.startTag || !location?.endTag) throw new Error('Homepage #root lacks source offsets');
  const replacement = `<div id="root" ${SSR_MARKER_ATTR}="${SSR_MARKER_VALUE}" ${SSR_DATE_ATTR}="${renderedAt.toISOString()}">${body}</div>`;
  return html.slice(0, location.startOffset) + replacement + html.slice(location.endOffset);
}

// ─── Main pre-render logic ─────────────────────────────────────────────

async function prerender() {
  const PORT = 4173;
  const routes = getAllRoutes();

  console.log(`\n🖨️  Pre-rendering ${routes.length} routes...\n`);

  // A standalone repeat must not expose the previous homepage-only hint to
  // other routes through the SPA fallback document.
  const shellFile = path.join(DIST_DIR, 'index.html');
  const shell = fs.readFileSync(shellFile, 'utf-8');
  const cleanShell = shell.replace(/<link\b[^>]*\bid="ft-home-bungee-preload"[^>]*>/g, '');
  if (cleanShell !== shell) fs.writeFileSync(shellFile, cleanShell);

  // Start local server
  const server = await startServer(PORT);

  // Dynamic import Playwright (dev dependency)
  const { chromium } = await import('playwright');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(executablePath
    ? { executablePath, chromiumSandbox: true }
    : undefined);

  // Renders one route → dist/<route>/index.html. Returns true on success.
  async function renderOne(route) {
    const page = await browser.newPage();
    try {
      // Block all third-party/external requests during prerender. They aren't
      // needed for the SEO HTML (title, canonical, JSON-LD, content) and — worse —
      // analytics, Tawk, the PSA/LiveStats fetch and its proxy never settle on a
      // local server. That previously stalled `networkidle` until timeout, so a
      // route could silently fail and fall back to the homepage shell
      // (canonical=homepage → Google won't index it). Blocking them makes
      // prerender fast and deterministic.
      await page.route('**/*', (r) => {
        const u = r.request().url();
        return (u.startsWith(`http://localhost:${PORT}`) || u.startsWith('data:'))
          ? r.continue()
          : r.abort();
      });

      // Keep the cookie banner out of the snapshot. CookieBanner shows itself
      // 900ms after mount when no consent is stored; networkidle + 200ms can
      // cross that timer, so the banner (with its Bungee heading) was being
      // serialised into some routes nondeterministically, which also made
      // legacy routes fetch Bungee from static markup. Storing an explicit
      // denial in this throwaway build browser only (same fixture as e2e/helpers.ts)
      // keeps the banner and analytics off during capture. Real visitors load
      // with no stored consent and still get the banner as normal.
      await page.addInitScript(() => {
        localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() }));
      });

      // App.tsx uses BrowserRouter; the dev static server has SPA fallback so
      // unknown paths serve index.html, then BrowserRouter renders the right page.
      const url = `http://localhost:${PORT}${route}`;
      // networkidle (reliable now that external requests are blocked) ensures the
      // lazy-loaded route chunk finishes loading and rendering.
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

      // The SPA fallback serves the already-prerendered HOMEPAGE shell for unknown
      // paths, and that shell ALREADY contains a json-ld-schema element — so we must
      // NOT wait on "schema exists" (it passes instantly against the homepage and we'd
      // snapshot before the real route renders). Instead wait until the canonical
      // reflects THIS route, which only happens once the route's own SEO has run.
      const expectedPath = (route === '/' ? '/' : route).replace(/\/$/, '') || '/';
      await page.waitForFunction(
        (want) => {
          const c = document.querySelector('link[rel="canonical"]');
          if (!c) return false;
          const got = (new URL(c.href).pathname.replace(/\/$/, '')) || '/';
          // Home: canonical must be root. Non-home: canonical must have moved OFF
          // root — the SPA fallback shell shows the homepage canonical ('/'), so any
          // non-root value means THIS route's SEO has run (robust to custom canonicals).
          return want === '/' ? got === '/' : got !== '/';
        },
        expectedPath,
        { timeout: 15000 }
      );

      // Small extra wait for any final meta tag updates
      await page.waitForTimeout(200);

      let html = await page.content();
      // Normalise any localhost/hash URLs that leaked into the HTML.
      html = html.replace(/http:\/\/localhost:\d+\/#?/g, BASE_URL + '/');
      // Ensure the canonical tag has the correct production URL for this route.
      const canonicalUrl = route === '/' ? `${BASE_URL}/` : `${BASE_URL}${route}`;
      html = html.replace(
        /<link[^>]*rel="canonical"[^>]*>/,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );

      const outDir = route === '/' ? DIST_DIR : path.join(DIST_DIR, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      return true;
    } catch (err) {
      console.warn(`   ⚠️  Failed: ${route} — ${err.message}`);
      return false;
    } finally {
      await page.close();
    }
  }

  // ── First pass: concurrent batches ──
  const CONCURRENCY = 6;
  let rendered = 0;
  const failedRoutes = [];

  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    const batch = routes.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(renderOne));
    results.forEach((ok, j) => ok ? rendered++ : failedRoutes.push(batch[j]));
    console.log(`   ${rendered}/${routes.length} rendered...`);
  }

  // ── Retry pass: failed routes one-at-a-time (avoids the contention that
  // causes most transient timeouts), so a flaky moment never fails the deploy. ──
  const stillFailed = [];
  if (failedRoutes.length) {
    console.log(`\n🔁 Retrying ${failedRoutes.length} failed route(s) sequentially...\n`);
    for (const route of failedRoutes) {
      if (await renderOne(route)) rendered++;
      else stillFailed.push(route);
    }
  }

  await browser.close();
  server.close();

  // Add the homepage-only preload after every route has been captured. Adding
  // it earlier would leak it into other routes through the SPA fallback shell.
  if (!stillFailed.includes('/')) {
    const homeFile = path.join(DIST_DIR, 'index.html');
    let html = fs.readFileSync(homeFile, 'utf-8');
    // Finalise SSR after all routes, so its root marker and snapshot cannot
    // leak into later captures through the homepage SPA fallback shell.
    html = injectHomeSsr(html, await renderHomeSsr());
    const fontUrl = html.match(/url\(["']?(\/assets\/bungee-v17-latin-(?!ext-)[\w-]+\.woff2)/)?.[1];
    if (!fontUrl) throw new Error('Homepage Bungee latin asset was not found');
    html = html.replace(/<head(?:\s[^>]*)?>/, (head) =>
      `${head}<link id="ft-home-bungee-preload" rel="preload" as="font" type="font/woff2" href="${fontUrl}" crossorigin="anonymous">`);
    const stylesheets = fs.readdirSync(path.join(DIST_DIR, 'assets')).filter(file => file.endsWith('.css'));
    if (stylesheets.length !== 1) throw new Error(`Expected one full stylesheet, found ${stylesheets.length}`);
    html = await optimiseHomepageCss(html, `/assets/${stylesheets[0]}`);
    fs.writeFileSync(homeFile, html);
  }

  console.log(`\n✅ Pre-rendering complete: ${rendered} rendered, ${stillFailed.length} failed out of ${routes.length} routes\n`);

  if (stillFailed.length) {
    console.error('   Still failed after retry:', stillFailed.join(', '));
    process.exit(1);
  }
}

// Only run when executed directly, so tests can import getAllRoutes().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  prerender().catch(err => {
    console.error('Pre-rendering failed:', err);
    process.exit(1);
  });
}
