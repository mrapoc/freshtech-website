// Read-only HTTP parity gate for the isolated 20i preview. Never sends a form.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseNetlifyRouting } from './generate-apache-static-config.mjs';
const origin = 'https://preview.fresh-tech.uk';
const arg = name => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
const redirects = parseNetlifyRouting(await readFile(new URL('../netlify.toml', import.meta.url), 'utf8')).redirects.filter(row => row.status === 301);
const matchPath = (pattern, path) => new RegExp('^' + pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(path);
const stamp = String(Date.now());
const probes = redirects.map(row => {
  const path = row.from.replaceAll('*', 'migration-probe');
  const query = new URLSearchParams({ __routing_probe: stamp });
  if (row.query) query.set(Object.keys(row.query)[0], '');
  const first = redirects.find(candidate => matchPath(candidate.from, path) && (!candidate.query || Object.keys(candidate.query).every(key => query.has(key))));
  assert.ok(first, `No expected redirect for ${path}`);
  return { path: `${path}?${query}`, status: 301, location: `${origin}${first.to}${first.query ? '' : `?${query}`}` };
});
probes.push(
  { path: '/', status: 200 },
  { path: '/pricing', status: 200, cache: 'public, max-age=0, must-revalidate' },
  { path: `/pricing/?__routing_probe=${stamp}`, status: 301, location: `${origin}/pricing?__routing_probe=${stamp}` },
  { path: '/?next=https://example.test/', status: 200 },
  { path: '/__migration_missing_20260915', status: 404 },
  { path: '/.netlify/functions/send-email', status: 503 },
  { path: '/api/send-email', status: 503 },
);
const asset = arg('--asset');
if (asset) {
  assert.match(asset, /^\/(?:assets|_astro)\/[A-Za-z0-9_.-]+$/);
  probes.push({ path: asset, status: 200, cache: 'public, max-age=31536000, immutable' });
}
let next = 0;
const results = new Array(probes.length);
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < probes.length) {
    const index = next++;
    const probe = probes[index];
    try {
      const response = await fetch(origin + probe.path, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const actual = { status: response.status, location: response.headers.get('location'), robots: response.headers.get('x-robots-tag'), cache: response.headers.get('cache-control'), csp: Boolean(response.headers.get('content-security-policy')) };
      const failures = [];
      if (actual.status !== probe.status) failures.push(`status ${actual.status}, expected ${probe.status}`);
      if (actual.location !== (probe.location ?? null)) failures.push(`location ${actual.location}, expected ${probe.location ?? null}`);
      if (actual.robots !== 'noindex, nofollow') failures.push('preview indexing protection missing');
      if (!actual.csp) failures.push('CSP missing');
      if (probe.cache && actual.cache !== probe.cache) failures.push('cache policy differs');
      results[index] = { path: probe.path, ...actual, failures };
    } catch (error) { results[index] = { path: probe.path, failures: [error.message] }; }
  }
}));
const failures = results.filter(result => result.failures.length);
const report = { checkedAt: new Date().toISOString(), origin, method: 'HEAD only', probes: results.length, passed: results.length - failures.length, results };
const out = arg('--out');
if (out) { await mkdir(dirname(resolve(out)), { recursive: true }); await writeFile(resolve(out), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ probes: report.probes, passed: report.passed, failures }, null, 2));
if (failures.length) process.exitCode = 1;
