// Pre-launch assessment against the staging branch deploy.
// For each page: capture title/meta/canonical/h1/schema/console-errors/broken-images
// and save desktop + mobile screenshots. Output a single JSON report + a slim summary.
//
// Run: node scripts/launch-assessment.mjs

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const STAGING = process.argv[2];
if (!STAGING) throw new Error('Usage: node scripts/launch-assessment.mjs <site-url>');
const OUT_DIR = path.join(import.meta.dirname, 'assessment');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, 'desktop'), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, 'mobile'),  { recursive: true });

// Slug-able filename
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\//,'').replace(/\//g,'_'));

// Representative cross-section. One of each template type.
const PAGES = [
  '/',
  '/services',
  '/services/managed-it-support',
  '/services/cybersecurity',
  '/services/cyber-essentials',
  '/pricing',
  '/about',
  '/why-trust-us',
  '/contact',
  '/industries',
  '/industries/solicitors',
  '/industries/accountants',
  '/locations/ludlow',
  '/blog',
  '/case-studies',
  '/microsoft-business-premium',
  '/it-health-check',
  '/ai-acceptable-use-policy',
  '/foundation-monitoring',
  '/compare',
  '/onboarding',
  '/careers',
  '/refer',
  '/privacy-policy',
  '/terms-conditions',
];

const browser = await chromium.launch();

async function findFirstBlogSlug() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${STAGING}/blog`, { waitUntil: 'networkidle', timeout: 30000 });
  const href = await page.locator('a[href^="/blog/"]').first().getAttribute('href').catch(() => null);
  await ctx.close();
  return href;
}
async function findFirstCaseStudySlug() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${STAGING}/case-studies`, { waitUntil: 'networkidle', timeout: 30000 });
  const href = await page.locator('a[href^="/case-studies/"]').first().getAttribute('href').catch(() => null);
  await ctx.close();
  return href;
}

const blogPath = await findFirstBlogSlug();
const csPath   = await findFirstCaseStudySlug();
if (blogPath && !PAGES.includes(blogPath)) PAGES.push(blogPath);
if (csPath   && !PAGES.includes(csPath))   PAGES.push(csPath);

console.log(`Assessing ${PAGES.length} pages: includes blog post ${blogPath} and case study ${csPath}`);

const report = [];

async function assessPage(pagePath, viewport, dirName) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const brokenImages = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on('pageerror', e => consoleErrors.push(`[pageerror] ${e.message.slice(0, 200)}`));
  page.on('requestfailed', req => {
    const u = req.url();
    if (u.includes('region1.google-analytics') || u.includes('allorigins')) return; // out-of-scope acks
    failedRequests.push(`${req.method()} ${u.slice(0, 120)}`);
  });
  page.on('response', resp => {
    if (resp.status() >= 400 && resp.request().resourceType() === 'image') {
      brokenImages.push(`${resp.status()} ${resp.url().slice(0, 120)}`);
    }
  });

  const url = `${STAGING}${pagePath}`;
  let loadError = null;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    loadError = e.message;
  }

  // Wait for React/SEO mount
  try {
    await page.waitForFunction(() => document.getElementById('json-ld-schema'), null, { timeout: 8000 });
  } catch {}
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.trim() || null;
    const attr = (sel, a) => document.querySelector(sel)?.getAttribute(a) || null;
    const allH1 = [...document.querySelectorAll('h1')].map(h => h.innerText.replace(/\s+/g,' ').trim());
    const h2Count = document.querySelectorAll('h2').length;
    const h3Count = document.querySelectorAll('h3').length;
    let schemaTypes = [];
    try {
      const raw = document.getElementById('json-ld-schema')?.textContent;
      const arr = raw ? JSON.parse(raw) : [];
      schemaTypes = arr.map(s => s['@type']).filter(Boolean);
    } catch (e) {}
    const imgs = [...document.querySelectorAll('img')];
    const missingAlt = imgs.filter(i => !i.hasAttribute('alt') || i.getAttribute('alt') === '').length;
    return {
      title: document.title,
      description: attr('meta[name="description"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      robots: attr('meta[name="robots"]', 'content'),
      ogType: attr('meta[property="og:type"]', 'content'),
      ogImage: attr('meta[property="og:image"]', 'content'),
      h1Texts: allH1,
      h1Count: allH1.length,
      h2Count, h3Count,
      schemaTypes,
      imgCount: imgs.length,
      imgMissingAlt: missingAlt,
      bodyLength: document.body.innerText.length,
    };
  });

  // Screenshot — viewport only (not full page) to keep file sizes tame
  const shotPath = path.join(OUT_DIR, dirName, `${slug(pagePath)}.png`);
  try {
    await page.screenshot({ path: shotPath, fullPage: false });
  } catch (e) {
    // ignore
  }

  await ctx.close();
  return { ...data, consoleErrors, brokenImages, failedRequests, loadError, screenshot: shotPath };
}

for (const p of PAGES) {
  const desktop = await assessPage(p, { width: 1440, height: 900 }, 'desktop');
  const mobile  = await assessPage(p, { width: 390, height: 844 }, 'mobile');
  report.push({ path: p, desktop, mobile });
  console.log(`  ✓ ${p.padEnd(45)} h1=${desktop.h1Count} schema=${desktop.schemaTypes.join('+') || 'NONE'} errs=${desktop.consoleErrors.length}`);
}

await browser.close();

// Write full JSON
fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

// Slim summary printed to stdout
console.log('\n=== ISSUES ===\n');
let issueCount = 0;
for (const r of report) {
  const issues = [];
  if (r.desktop.loadError) issues.push(`LOAD FAIL: ${r.desktop.loadError.slice(0, 80)}`);
  if (r.desktop.h1Count === 0) issues.push('NO H1');
  if (r.desktop.h1Count > 1) issues.push(`MULTIPLE H1 (${r.desktop.h1Count}): ${r.desktop.h1Texts.join(' | ').slice(0, 80)}`);
  if (!r.desktop.title) issues.push('NO TITLE');
  if (r.desktop.title && r.desktop.title.length > 70) issues.push(`TITLE LONG ${r.desktop.title.length}c`);
  if (!r.desktop.description) issues.push('NO DESCRIPTION');
  if (r.desktop.description && r.desktop.description.length > 160) issues.push(`DESC LONG ${r.desktop.description.length}c`);
  if (!r.desktop.canonical) issues.push('NO CANONICAL');
  if (r.desktop.canonical && !r.desktop.canonical.startsWith('https://fresh-tech.uk')) issues.push(`CANONICAL WRONG: ${r.desktop.canonical}`);
  if (r.desktop.schemaTypes.length === 0) issues.push('NO JSON-LD');
  if (r.desktop.brokenImages.length > 0) issues.push(`BROKEN IMG: ${r.desktop.brokenImages.length}`);
  if (r.desktop.consoleErrors.length > 0) issues.push(`CONSOLE ERR (${r.desktop.consoleErrors.length}): ${r.desktop.consoleErrors[0].slice(0, 60)}`);
  if (r.desktop.imgMissingAlt > 0) issues.push(`MISSING ALT: ${r.desktop.imgMissingAlt}`);
  if (r.desktop.bodyLength < 1000 && r.path !== '/404') issues.push(`THIN: ${r.desktop.bodyLength}c body`);

  if (issues.length > 0) {
    issueCount += issues.length;
    console.log(`  ${r.path}`);
    issues.forEach(i => console.log(`    - ${i}`));
  }
}
if (issueCount === 0) console.log('  None — site is launch-clean.');

console.log(`\n=== TOTALS ===\nPages: ${report.length}\nIssues: ${issueCount}\nReport: ${path.join(OUT_DIR, 'report.json')}\nScreenshots: ${OUT_DIR}/{desktop,mobile}/*.png`);
