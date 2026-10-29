// Compare public preview responses with an approved local deployment manifest.
// Sends public paths only. Never uploads files, credentials or form submissions.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, lstat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const origin = 'https://preview.fresh-tech.uk';
const option = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const manifestPath = option('--manifest');
if (!manifestPath) throw new Error('Pass --manifest with the approved preview manifest.');
const manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
const out = option('--out');
if (out) {
  try {
    await lstat(resolve(out));
    throw new Error('Output already exists; choose a fresh report path.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (manifest.schemaVersion !== 1 || manifest.mode !== 'preview' || !Array.isArray(manifest.files)) {
  throw new Error('Expected a version 1 preview deployment manifest.');
}
const metricsPath = option('--metrics');
const metrics = JSON.parse(await readFile(metricsPath ? resolve(metricsPath)
  : new URL('../prototypes/html-first-slice/evidence/build-metrics.json', import.meta.url), 'utf8'));
const htmlPaths = new Set(metrics.files.map(file => file.path)
  .filter(path => /^(?:[a-z0-9-]+\/)*index\.html$/.test(path)));
const selected = manifest.files.filter(file => htmlPaths.has(file.path)
  || /^(?:_astro|fonts)\/[A-Za-z0-9_.-]+\.(?:css|js|woff2)$/.test(file.path));
if (!selected.some(file => file.path === 'services/index.html')
  || !selected.some(file => file.path === 'case-studies/index.html')
  || !selected.some(file => file.path === 'pricing/index.html')) {
  throw new Error('Manifest must include both complete families and pricing.');
}
// The generated build inventory independently defines completeness. Do not use
// hardcoded family sizes: future data entries must automatically enter this gate.
const expected = new Set([
  ...htmlPaths,
  ...metrics.serviceRoutes.map(route => `${route.slice(1)}/index.html`),
  ...metrics.caseStudyRoutes.map(route => `${route.slice(1)}/index.html`),
  'pricing/index.html',
  ...metrics.files.map(file => file.path).filter(path => /^(?:_astro|fonts)\/[A-Za-z0-9_.-]+\.(?:css|js|woff2)$/.test(path)),
]);
const actualPaths = new Set(selected.map(file => file.path));
if (actualPaths.size !== selected.length || actualPaths.size !== expected.size
  || [...expected].some(path => !actualPaths.has(path))) {
  throw new Error('Manifest selection differs from the current generated family/asset inventory.');
}
for (const file of selected) {
  if (!/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error(`Missing SHA256: ${file.path}`);
}
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({ origin, plannedProbes: selected.length, htmlPages: htmlPaths.size, networkRequests: 0 }, null, 2));
  process.exit(0);
}
const results = new Array(selected.length);
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < selected.length) {
    const index = next++;
    const file = selected[index];
    const html = htmlPaths.has(file.path);
    const path = file.path === 'index.html' ? '/' : '/' + (html ? file.path.slice(0, -11) : file.path);
    const failures = [];
    try {
      const response = await fetch(origin + path, {
        redirect: 'manual', signal: AbortSignal.timeout(20000),
      });
      const body = Buffer.from(await response.arrayBuffer());
      const sha256 = createHash('sha256').update(body).digest('hex');
      if (response.status !== 200) failures.push(`HTTP ${response.status}`);
      if (sha256 !== file.sha256) failures.push('Body differs from approved artifact');
      if (response.headers.get('x-robots-tag') !== 'noindex, nofollow') failures.push('Preview noindex missing');
      const cache = (response.headers.get('cache-control') ?? '').toLowerCase().split(',').map(value => value.trim()).sort().join(',');
      const expectedCache = html ? 'max-age=0,must-revalidate,public'
        : path.startsWith('/fonts/') ? 'max-age=86400,must-revalidate,public'
        : 'immutable,max-age=31536000,public';
      if (cache !== expectedCache) failures.push('Cache policy differs');
      if (html) {
        const text = body.toString('utf8');
        const canonicals = [...text.matchAll(/<link\b[^>]*>/gi)].flatMap(([tag]) => {
          const attributes = Object.fromEntries([...tag.matchAll(/\b([a-z-]+)\s*=\s*(["'])(.*?)\2/gi)].map(([, name, , value]) => [name.toLowerCase(), value]));
          return attributes.rel?.toLowerCase().split(/\s+/).includes('canonical') ? [attributes.href] : [];
        });
        if (canonicals.length !== 1 || canonicals[0] !== `https://fresh-tech.uk${path}`) failures.push('Production canonical target differs');
      }
      results[index] = { path, status: response.status, bytes: body.length, sha256, failures };
    } catch (error) {
      results[index] = { path, failures: [error.message] };
    }
  }
}));
const failed = results.filter(result => result.failures.length);
const report = { checkedAt: new Date().toISOString(), origin, probes: results.length, passed: results.length - failed.length, results };
if (out) {
  await mkdir(dirname(resolve(out)), { recursive: true });
  await writeFile(resolve(out), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ probes: report.probes, passed: report.passed, failures: failed }, null, 2));
if (failed.length) process.exitCode = 1;
