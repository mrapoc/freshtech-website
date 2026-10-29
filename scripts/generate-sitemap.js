/**
 * Automated Sitemap Generator
 * Runs during build to generate sitemap.xml from routes and content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLegalRoutes } from './legal-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://fresh-tech.uk';

// Editorial hold: slugs awaiting preview approval stay out regardless of the clock.
const HELD_SLUGS = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/editorial-holds.json'), 'utf-8')).slugs
);

// Check if a post date is in the future (reused from generate-rss.js)
function isFuturePost(dateString) {
  const postDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return postDate > now;
}

// Convert human-readable date (e.g. "Mar 31, 2026") to YYYY-MM-DD
export function toISODate(dateString) {
  // Content stores calendar dates, not instants. Parse in UTC so local BST
  // cannot shift a publication date to the previous day.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T00:00:00Z`
    : `${dateString} UTC`);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

// Priority overrides for specific routes
const priorityOverrides = {
  '/it-support-ludlow': '0.9',
  '/technology/vpn': '0.7',
};

// Define all static routes with their priorities and change frequencies
// NOTE: /industries/* and /technology/* are extracted dynamically from content.ts — do not duplicate here
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/services', priority: '0.9', changefreq: 'weekly' },
  { path: '/industries', priority: '0.9', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { path: '/contact', priority: '0.9', changefreq: 'monthly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/case-studies', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'daily' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/resources', priority: '0.7', changefreq: 'weekly' },
  { path: '/it-health-check', priority: '0.8', changefreq: 'monthly' },
  { path: '/email-security-check', priority: '0.8', changefreq: 'monthly' },
  { path: '/email-security-guide', priority: '0.8', changefreq: 'monthly' },
  { path: '/onboarding', priority: '0.7', changefreq: 'monthly' },
  { path: '/why-trust-us', priority: '0.8', changefreq: 'monthly' },
  { path: '/technology', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-business-premium', priority: '0.8', changefreq: 'monthly' },
  { path: '/cloud-backup-necessity', priority: '0.8', changefreq: 'monthly' },
  { path: '/foundation-monitoring', priority: '0.7', changefreq: 'monthly' },
  { path: '/compare', priority: '0.9', changefreq: 'monthly' },
  { path: '/co-managed-it', priority: '0.8', changefreq: 'monthly' },
  { path: '/technology-stack', priority: '0.7', changefreq: 'monthly' },
  { path: '/service-standards', priority: '0.7', changefreq: 'monthly' },
  { path: '/support-upgrade', priority: '0.3', changefreq: 'yearly' },
  { path: '/support', priority: '0.5', changefreq: 'monthly' },
  { path: '/careers', priority: '0.5', changefreq: 'monthly' },
  { path: '/recruitment-privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/refer', priority: '0.4', changefreq: 'monthly' },
  { path: '/ai-acceptable-use-policy', priority: '0.7', changefreq: 'monthly' },
  { path: '/managed-print-guide', priority: '0.7', changefreq: 'monthly' },
  { path: '/upgrade-to-business-premium', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-conditions', priority: '0.3', changefreq: 'yearly' },
  ...getLegalRoutes().map(path => ({ path, priority: '0.3', changefreq: 'yearly' })),
  // Service + Location pages
  { path: '/it-support-shropshire', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-herefordshire', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-worcestershire', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-powys', priority: '0.8', changefreq: 'monthly' },
  { path: '/cyber-essentials-shropshire', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-herefordshire', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-worcestershire', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-powys', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-shropshire', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-herefordshire', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-worcestershire', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-powys', priority: '0.7', changefreq: 'monthly' },
  // Town-level Service + Location pages
  { path: '/it-support-shrewsbury', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-telford', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-hereford', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-worcester', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-kidderminster', priority: '0.8', changefreq: 'monthly' },
  { path: '/it-support-ludlow', priority: '0.8', changefreq: 'monthly' },
  { path: '/cyber-essentials-shrewsbury', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-telford', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-hereford', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-worcester', priority: '0.7', changefreq: 'monthly' },
  { path: '/cyber-essentials-kidderminster', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-shrewsbury', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-telford', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-hereford', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-worcester', priority: '0.7', changefreq: 'monthly' },
  { path: '/microsoft-365-kidderminster', priority: '0.7', changefreq: 'monthly' },
  // Problem pages
  { path: '/slow-computers', priority: '0.7', changefreq: 'monthly' },
  { path: '/it-security-audit', priority: '0.7', changefreq: 'monthly' },
  { path: '/switch-it-provider', priority: '0.7', changefreq: 'monthly' },
  { path: '/ransomware-recovery', priority: '0.7', changefreq: 'monthly' },
  { path: '/office-move-it', priority: '0.7', changefreq: 'monthly' },
  // New problem pages
  { path: '/windows-10-end-of-life', priority: '0.8', changefreq: 'monthly' },
  { path: '/office-wifi-problems', priority: '0.7', changefreq: 'monthly' },
  { path: '/staff-clicking-phishing', priority: '0.7', changefreq: 'monthly' },
  { path: '/server-end-of-life', priority: '0.7', changefreq: 'monthly' },
  { path: '/it-provider-not-responding', priority: '0.7', changefreq: 'monthly' },
  { path: '/new-business-it-setup', priority: '0.7', changefreq: 'monthly' },
  // Incident-response problem pages (built + prerendered; were missing from the sitemap)
  { path: '/business-email-compromise', priority: '0.8', changefreq: 'monthly' },
  { path: '/email-account-hacked', priority: '0.7', changefreq: 'monthly' },
  { path: '/data-breach-discovered', priority: '0.7', changefreq: 'monthly' },
  { path: '/laptop-stolen-lost', priority: '0.7', changefreq: 'monthly' },
  // Comparison/decision pages
  { path: '/break-fix-vs-managed-it', priority: '0.8', changefreq: 'monthly' },
  { path: '/in-house-vs-outsourced-it', priority: '0.8', changefreq: 'monthly' },
  { path: '/microsoft-365-plans-compared', priority: '0.8', changefreq: 'monthly' },
  // Glossary
  { path: '/glossary', priority: '0.6', changefreq: 'monthly' },
];

// Extract slugs from array patterns like: slug: "value" or slug: 'value'
function extractSlugsFromArray(content, arrayName) {
  const slugs = [];
  const arrayPattern = new RegExp(`export\\s+const\\s+${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm');
  const match = content.match(arrayPattern);

  if (match) {
    const slugMatches = match[1].matchAll(/slug:\s*["']([^"']+)["']/g);
    for (const m of slugMatches) {
      slugs.push(m[1]);
    }
  }
  return slugs;
}

// Extract blog posts with slug + date, filtering out future-dated posts
function extractBlogPosts(content) {
  const posts = [];
  const match = content.match(/export\s+const\s+blogPosts\s*=\s*\[([\s\S]*?)\];\s*export\s+const/);
  if (!match) return posts;

  // Match slug and date fields (they appear in consistent order in each post object)
  const postRegex = /slug:\s*["']([^"']+)["'][\s\S]*?date:\s*["']([^"']+)["']/g;
  let m;
  while ((m = postRegex.exec(match[1])) !== null) {
    const slug = m[1];
    const date = m[2];
    if (!HELD_SLUGS.has(slug) && !isFuturePost(date)) {
      posts.push({ slug, date });
    }
  }
  return posts;
}

// Extract keys from Record/object using brace-depth tracking (replaces fragile indentation regex)
function extractKeysFromRecord(content, recordName) {
  const keys = [];

  const startPattern = new RegExp(`export\\s+const\\s+${recordName}[^=]*=\\s*\\{`, 'm');
  const startMatch = content.match(startPattern);
  if (!startMatch) return keys;

  const startIdx = startMatch.index + startMatch[0].length;
  let depth = 1; // We're already inside the opening {

  // Walk character-by-character to find keys at depth 1
  let i = startIdx;
  while (i < content.length && depth > 0) {
    const ch = content[i];

    if (ch === '{') {
      depth++;
      i++;
      continue;
    }
    if (ch === '}') {
      depth--;
      i++;
      continue;
    }

    // At depth 1, look for key patterns: "key": { or key: {
    if (depth === 1) {
      // Try quoted key: "key": { or 'key': {
      const quotedMatch = content.substring(i).match(/^["']([a-z0-9-]+)["']\s*:\s*\{/);
      if (quotedMatch) {
        keys.push(quotedMatch[1]);
        // Advance past the key but not past the { (the loop handles depth)
        i += quotedMatch[0].length - 1;
        continue;
      }
      // Try unquoted key: key: {
      const unquotedMatch = content.substring(i).match(/^([a-z][a-z0-9-]*)\s*:\s*\{/);
      if (unquotedMatch) {
        keys.push(unquotedMatch[1]);
        i += unquotedMatch[0].length - 1;
        continue;
      }
    }

    // Skip string literals to avoid matching keys inside string values
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++; // skip escaped chars
        i++;
      }
    }
    // Skip template literals
    if (ch === '`') {
      i++;
      while (i < content.length && content[i] !== '`') {
        if (content[i] === '\\') i++;
        i++;
      }
    }

    i++;
  }

  return keys;
}

// Dynamic content extraction
async function getDynamicRoutes() {
  const routes = [];

  try {
    const contentPath = path.join(__dirname, '../data/content.ts');
    const content = fs.readFileSync(contentPath, 'utf-8');

    // Services (from services array)
    const serviceSlugs = extractSlugsFromArray(content, 'services');
    serviceSlugs.forEach(slug => {
      routes.push({ path: `/services/${slug}`, priority: '0.8', changefreq: 'monthly' });
    });
    console.log(`   Found ${serviceSlugs.length} service pages`);

    // Industry DETAIL pages come from the industryPages record only — that's the
    // data source IndustryDetailPageV2 actually renders. The separate `industries`
    // array has extra slugs (engineering, legal, renewable-energy, retail-distribution,
    // veterinary) with NO detail-page entry, so they render empty; never sitemap them.
    const industryPageKeys = extractKeysFromRecord(content, 'industryPages');
    industryPageKeys.forEach(slug => {
      routes.push({ path: `/industries/${slug}`, priority: '0.7', changefreq: 'monthly' });
    });
    console.log(`   Found ${industryPageKeys.length} industry pages (from industryPages record)`);

    // Case Studies
    const caseStudySlugs = extractSlugsFromArray(content, 'caseStudies');
    caseStudySlugs.forEach(slug => {
      routes.push({ path: `/case-studies/${slug}`, priority: '0.7', changefreq: 'monthly' });
    });
    console.log(`   Found ${caseStudySlugs.length} case study pages`);

    // Blog Posts (with date filtering — excludes future/scheduled posts)
    const blogPosts = extractBlogPosts(content);
    const totalBlogSlugs = extractSlugsFromArray(content, 'blogPosts');
    const skippedCount = totalBlogSlugs.length - blogPosts.length;
    blogPosts.forEach(({ slug, date }) => {
      routes.push({
        path: `/blog/${slug}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: toISODate(date),
      });
    });
    console.log(`   Found ${blogPosts.length} published blog posts${skippedCount > 0 ? ` (${skippedCount} future-dated excluded)` : ''}`);

    // Existing named team profiles are public, indexable content.
    extractSlugsFromArray(content, 'teamMembers').forEach(slug => {
      routes.push({ path: `/team/${slug}`, priority: '0.5', changefreq: 'monthly' });
    });

    // Locations (from locationsData record)
    const locationKeys = extractKeysFromRecord(content, 'locationsData');
    locationKeys.forEach(slug => {
      routes.push({ path: `/locations/${slug}`, priority: '0.6', changefreq: 'monthly' });
    });
    console.log(`   Found ${locationKeys.length} location pages`);

    // Tech Explainers (from techExplainers record)
    const techKeys = extractKeysFromRecord(content, 'techExplainers');
    techKeys.forEach(slug => {
      routes.push({ path: `/technology/${slug}`, priority: '0.6', changefreq: 'monthly' });
    });
    console.log(`   Found ${techKeys.length} technology pages`);

  } catch (error) {
    console.warn('Warning: Could not parse content.ts:', error.message);
  }

  // Industry guides from separate file
  try {
    const guidesPath = path.join(__dirname, '../data/industryGuides.ts');
    const guides = fs.readFileSync(guidesPath, 'utf-8');
    const guideKeys = extractKeysFromRecord(guides, 'industryGuides');
    guideKeys.forEach(slug => {
      routes.push({ path: `/guides/${slug}`, priority: '0.7', changefreq: 'monthly' });
    });
    console.log(`   Found ${guideKeys.length} industry guides`);
  } catch (error) {
    console.warn('Warning: Could not parse industryGuides.ts:', error.message);
  }

  return routes;
}

// Generate XML sitemap. outputPath defaults to the React public folder; the
// native production build passes its own output directory.
export async function generateSitemap(outputPath = path.join(__dirname, '../public/sitemap.xml')) {
  console.log('🗺️  Generating sitemap...');

  const dynamicRoutes = await getDynamicRoutes();
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  // Apply priority overrides
  for (const route of allRoutes) {
    if (priorityOverrides[route.path]) {
      route.priority = priorityOverrides[route.path];
    }
  }

  // Remove duplicates (keep first occurrence with higher priority)
  const seen = new Set();
  const uniqueRoutes = allRoutes.filter(route => {
    if (seen.has(route.path)) return false;
    seen.add(route.path);
    return true;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
${route.lastmod ? `    <lastmod>${route.lastmod}</lastmod>\n` : ''}    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(outputPath, xml);

  console.log(`✅ Sitemap generated with ${uniqueRoutes.length} URLs`);
  console.log(`   Output: ${outputPath}`);
  return uniqueRoutes;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateSitemap().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
