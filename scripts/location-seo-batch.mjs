// Batch SEO metrics across all 28 location pages.
// Outputs a CSV-ish table flagging anything outside target ranges.
import { chromium } from '@playwright/test';

const ROUTES = [
  // County
  'it-support-shropshire', 'it-support-herefordshire', 'it-support-worcestershire', 'it-support-powys',
  'cyber-essentials-shropshire', 'cyber-essentials-herefordshire', 'cyber-essentials-worcestershire', 'cyber-essentials-powys',
  'microsoft-365-shropshire', 'microsoft-365-herefordshire', 'microsoft-365-worcestershire', 'microsoft-365-powys',
  // Town
  'it-support-ludlow', 'it-support-shrewsbury', 'it-support-telford', 'it-support-hereford', 'it-support-worcester', 'it-support-kidderminster',
  'cyber-essentials-shrewsbury', 'cyber-essentials-telford', 'cyber-essentials-hereford', 'cyber-essentials-worcester', 'cyber-essentials-kidderminster',
  'microsoft-365-shrewsbury', 'microsoft-365-telford', 'microsoft-365-hereford', 'microsoft-365-worcester', 'microsoft-365-kidderminster',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const rows = [];

for (const slug of ROUTES) {
  try {
    await page.goto(`http://localhost:5173/${slug}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => !!document.getElementById('json-ld-schema'), { timeout: 8000 });
    await page.waitForTimeout(200);

    const m = await page.evaluate(() => {
      const title = document.title;
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const main = document.querySelector('main');
      const text = main ? (main.textContent || '').replace(/\s+/g, ' ').trim() : '';
      const words = text.split(/\s+/).filter(w => w.length > 1);
      const wordCount = words.length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
      const syllables = words.reduce((sum, w) => {
        const s = w.toLowerCase().replace(/[^a-z]/g, '');
        if (!s) return sum;
        let count = s.replace(/[^aeiouy]+/g, ' ').trim().split(/\s+/).length;
        if (s.endsWith('e')) count = Math.max(1, count - 1);
        return sum + Math.max(1, count);
      }, 0);
      const flesch = wordCount > 0
        ? 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)
        : 0;
      return {
        titleLen: title.length,
        metaLen: metaDesc.length,
        wordCount,
        flesch: Math.round(flesch),
      };
    });
    rows.push({ slug, ...m });
  } catch (err) {
    rows.push({ slug, error: err.message.split('\n')[0].slice(0, 60) });
  }
}

await browser.close();

// Header
console.log(`${'slug'.padEnd(34)} ${'TITLE'.padStart(6)}  ${'META'.padStart(5)}  ${'WORDS'.padStart(5)}  ${'FLESCH'.padStart(6)}  FLAGS`);
console.log('-'.repeat(85));

let totalIssues = 0;
const flagSummary = { title: 0, meta: 0, words: 0, flesch: 0 };

for (const r of rows) {
  if (r.error) {
    console.log(`${r.slug.padEnd(34)} ERROR ${r.error}`);
    continue;
  }
  const flags = [];
  if (r.titleLen > 60) { flags.push('title>60'); flagSummary.title++; }
  if (r.metaLen > 160) { flags.push('meta>160'); flagSummary.meta++; }
  if (r.metaLen < 130) { flags.push('meta<130'); flagSummary.meta++; }
  if (r.wordCount < 500) { flags.push(`words<500(${r.wordCount})`); flagSummary.words++; }
  if (r.flesch < 35) { flags.push(`flesch<35(${r.flesch})`); flagSummary.flesch++; }
  if (flags.length) totalIssues++;
  const t = String(r.titleLen).padStart(6);
  const m = String(r.metaLen).padStart(5);
  const w = String(r.wordCount).padStart(5);
  const f = String(r.flesch).padStart(6);
  console.log(`${r.slug.padEnd(34)} ${t}  ${m}  ${w}  ${f}  ${flags.join(', ')}`);
}

console.log(`\n${totalIssues} of ${rows.length} pages have issues.`);
console.log(`Issue breakdown: titles ${flagSummary.title}, metas ${flagSummary.meta}, word-count ${flagSummary.words}, readability ${flagSummary.flesch}`);
