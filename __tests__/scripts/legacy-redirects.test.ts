// @vitest-environment node
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { exactRedirects } from '../../data/legacyRedirects';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

/** Normalise a path the way App's LegacyWildcardHandler does: lower-case, no trailing slash except root. */
const normalise = (p: string) => {
  const lower = p.toLowerCase();
  return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower;
};

/** Exact (non-wildcard) 301 rules from netlify.toml, keyed by normalised source. */
function edgeExactRedirects(): Map<string, string> {
  const map = new Map<string, string>();
  for (const block of read('netlify.toml').split('[[redirects]]').slice(1)) {
    const from = block.match(/^\s*from\s*=\s*"([^"]+)"/m)?.[1];
    const to = block.match(/^\s*to\s*=\s*"([^"]+)"/m)?.[1];
    const status = block.match(/^\s*status\s*=\s*(\d+)/m)?.[1];
    // Only unconditional, non-wildcard 301s are exact mappings; skip query/conditional rules.
    const conditional = /^\s*(query|conditions)\b/m.test(block);
    if (conditional) continue;
    if (!from || !to || status !== '301' || from.includes('*')) continue;
    const key = normalise(from);
    // Netlify uses the first matching rule; keep the first definition for a source.
    if (!map.has(key)) map.set(key, normalise(to));
  }
  return map;
}

/** Explicit (non-parameterised, non-catch-all) route paths declared in App.tsx. */
function explicitAppRoutes(): Set<string> {
  const paths = [...read('App.tsx').matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]);
  return new Set(paths.filter(p => p !== '*' && !p.includes(':')).map(normalise));
}

describe('client legacy redirects stay consistent with the edge and the router', () => {
  const edge = edgeExactRedirects();
  const routes = explicitAppRoutes();

  it('parses the edge config and the router', () => {
    expect(edge.size).toBeGreaterThan(40);
    expect(routes.size).toBeGreaterThan(50);
    expect(edge.get('/service-area/it-support-in-ludlow')).toBe('/it-support-ludlow');
    expect(routes.has('/it-support-herefordshire')).toBe(true);
  });

  it('sends every source that both layers handle to the same destination', () => {
    const mismatches: string[] = [];
    let overlaps = 0;
    for (const [source, clientTarget] of Object.entries(exactRedirects)) {
      const edgeTarget = edge.get(normalise(source));
      if (edgeTarget === undefined) continue;
      overlaps += 1;
      if (normalise(clientTarget) !== edgeTarget) mismatches.push(`${source}: client ${clientTarget} vs edge ${edgeTarget}`);
    }
    expect(overlaps).toBeGreaterThan(15);
    expect(mismatches).toEqual([]);
  });

  it('carries the previously stale mappings at their current edge targets', () => {
    expect(exactRedirects['/technology-projects']).toBe('/technology');
    expect(exactRedirects['/managed-print-solutions']).toBe('/services/managed-print');
    expect(exactRedirects['/service-area/it-support-in-shropshire']).toBe('/it-support-shropshire');
    expect(exactRedirects['/service-area/it-support-in-ludlow']).toBe('/it-support-ludlow');
    expect(exactRedirects['/service-area/it-support-in-hereford']).toBe('/it-support-hereford');
    expect(exactRedirects['/service-area/it-support-in-telford']).toBe('/it-support-telford');
  });

  it('never lists a live explicit App route as a legacy source', () => {
    // The catch-all never runs for these, so such entries are dormant at best and misleading at worst.
    const collisions = Object.keys(exactRedirects).filter(source => routes.has(normalise(source)));
    expect(collisions).toEqual([]);
    for (const live of ['/about', '/contact', '/services', '/pricing', '/case-studies', '/it-support-shropshire', '/it-support-herefordshire']) {
      expect(routes.has(live)).toBe(true);
      expect(exactRedirects).not.toHaveProperty(live);
    }
  });
});
