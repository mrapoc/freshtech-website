// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { navigationLinks, navigationModule, contentChunksPlugin } from './content-chunks.mjs';
import { industryNavigation, problemNavigation } from '../data/navigation';

const source = readFileSync(new URL('../data/content.ts', import.meta.url), 'utf8');

describe('navigation projection parity', () => {
  it('build projection equals the runtime derivation for labels, order and slugs', () => {
    const links = navigationLinks(source);
    expect(links.industryPages).toEqual(industryNavigation);
    expect(links.problemPages).toEqual(problemNavigation);
    expect(links.industryPages.length).toBeGreaterThan(0);
    expect(links.problemPages.length).toBeGreaterThan(0);
  });

  it('emits a literal module without the full records', () => {
    const code = navigationModule(source);
    expect(code).toContain('export const industryNavigation = ');
    expect(code).toContain('export const problemNavigation = ');
    expect(code).not.toMatch(/metaDesc|intro|symptoms/);
    expect(Buffer.byteLength(code)).toBeLessThan(8_000);
  });

  it.each([
    'export const industryPages = { __proto__: { slug: "a", h1: "A" } }; export const problemPages = {};',
    'export const industryPages = {}; export const problemPages = {}; sideEffect();',
    'export const industryPages = {};',
    'export const industryPages = {}; export const problemPages = other;',
    'export const industryPages = { a: { slug: "a", h1: "A" } }; export const problemPages = { b: { slug: "b" } };',
    'export const industryPages = { a: { slug: "a", h1: `A` } }; export const problemPages = {};',
    'export const industryPages = { 1: { slug: "a", h1: "A" } }; export const problemPages = {};',
    'export const industryPages = { ...x }; export const problemPages = {};',
  ])('rejects shapes that would diverge from runtime: %s', bad => {
    expect(() => navigationLinks(bad)).toThrow();
  });

  it('preserves quoted field names and last duplicate field values', () => {
    const links = navigationLinks('export const industryPages = { a: { slug: "old", "slug": "a", "h1": "A" } }; export const problemPages = {};');
    expect(links.industryPages).toEqual([{ slug: 'a', h1: 'A' }]);
  });

  it('layout no longer imports the full page records eagerly', () => {
    const layout = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');
    expect(layout).not.toMatch(/\b(industryPages|problemPages)\b/);
    expect(layout).toContain("from '../data/navigation'");
  });

  it('plugin replaces data/navigation.ts with the projection and enforces it ran', () => {
    const plugin = contentChunksPlugin();
    const root = path.resolve(process.cwd());
    plugin.configResolved({ root });
    expect(() => plugin.buildEnd()).toThrow('was not replaced');
    const result = plugin.transform('import { industryPages } from "./content";', path.join(root, 'data/navigation.ts'));
    expect(result?.code).toBe(navigationModule(source));
    expect(() => plugin.buildEnd()).not.toThrow();
  });
});
