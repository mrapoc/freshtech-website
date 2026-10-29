#!/usr/bin/env node
// Official PageSpeed Insights sweep of every sitemap URL, mobile and desktop.
//
// Usage: node scripts/pagespeed-sweep.mjs [--only /pricing,/about] [--concurrency 4]
// The API key is read from %USERPROFILE%/.secrets/pagespeed-api-key.txt (or the
// PAGESPEED_API_KEY_FILE path) and is never printed or written anywhere.
// Writes .artifacts/pagespeed/<timestamp>.json and a .md summary, sorted worst first.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const keyFile = process.env.PAGESPEED_API_KEY_FILE || resolve(homedir(), '.secrets', 'pagespeed-api-key.txt');
const key = (await readFile(keyFile, 'utf8')).trim();
if (!/^[A-Za-z0-9_-]{20,}$/.test(key)) throw new Error(`No usable API key in ${keyFile}`);

const arg = name => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };
const concurrency = Number(arg('--concurrency') ?? 4);
const site = 'https://fresh-tech.uk';
const sitemap = await (await fetch(`${site}/sitemap.xml`)).text();
let urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
const only = arg('--only');
if (only) urls = only.split(',').map(path => `${site}${path === '/' ? '/' : path}`);
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const jobs = urls.flatMap(url => ['mobile', 'desktop'].map(strategy => ({ url, strategy })));

const delay = ms => new Promise(done => setTimeout(done, ms));
async function run({ url, strategy }) {
  const query = new URLSearchParams({ url, strategy, key });
  for (const category of CATEGORIES) query.append('category', category);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${query}`, { signal: AbortSignal.timeout(120_000) });
      const body = await response.json();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${body?.error?.message ?? 'error'}`);
      const lh = body.lighthouseResult;
      const audit = id => lh.audits[id]?.numericValue;
      return {
        url, strategy,
        scores: Object.fromEntries(CATEGORIES.map(id => [id, Math.round((lh.categories[id]?.score ?? 0) * 100)])),
        lcp: Math.round(audit('largest-contentful-paint')), fcp: Math.round(audit('first-contentful-paint')),
        tbt: Math.round(audit('total-blocking-time')), cls: Number((audit('cumulative-layout-shift') ?? 0).toFixed(3)),
        lcpElement: lh.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel?.replace(/\s+/g, ' ').slice(0, 60) ?? '',
      };
    } catch (error) {
      // Error text never includes the request URL, so the key cannot leak into logs.
      if (attempt === 4) return { url, strategy, error: String(error.message).replaceAll(key, '[key]') };
      await delay(5000 * attempt);
    }
  }
}

const results = [];
let next = 0;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const result = await run(job);
    results.push(result);
    const s = result.scores;
    process.stdout.write(`${results.length}/${jobs.length} ${job.strategy.padEnd(7)} ${s ? CATEGORIES.map(c => s[c]).join('/') : 'ERROR'} ${job.url.replace(site, '') || '/'}\n`);
  }
}));

const total = r => r.scores ? CATEGORIES.reduce((sum, c) => sum + r.scores[c], 0) : -1;
results.sort((a, b) => total(a) - total(b) || a.url.localeCompare(b.url));
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = resolve(repoRoot, '.artifacts', 'pagespeed');
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, `${stamp}.json`), `${JSON.stringify(results, null, 2)}\n`);

const perfect = results.filter(r => total(r) === 400).length;
const errors = results.filter(r => r.error);
const below = results.filter(r => r.scores && total(r) < 400);
const lines = [
  `# PageSpeed sweep ${stamp}`, '',
  `${urls.length} URLs x mobile and desktop = ${results.length} runs. ${perfect} scored 100 in all four categories, ${below.length} below, ${errors.length} errors.`, '',
  '| Page | Device | Perf | A11y | BP | SEO | LCP ms | CLS | LCP element |', '|---|---|---|---|---|---|---|---|---|',
  ...below.map(r => `| ${r.url.replace(site, '') || '/'} | ${r.strategy} | ${r.scores.performance} | ${r.scores.accessibility} | ${r.scores['best-practices']} | ${r.scores.seo} | ${r.lcp} | ${r.cls} | ${r.lcpElement} |`),
  ...errors.map(r => `| ${r.url.replace(site, '') || '/'} | ${r.strategy} | error: ${r.error} | | | | | | |`),
];
await writeFile(resolve(outDir, `${stamp}.md`), `${lines.join('\n')}\n`);
console.log(`\n${lines.slice(2, 3).join('')}\nReport: ${resolve(outDir, `${stamp}.md`)}`);
