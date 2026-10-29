// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { splitContent, contentChunksPlugin } from './content-chunks.mjs';

describe('independent content build modules', () => {
  it('preserves literal data and removes TypeScript annotations', () => {
    const parts = splitContent('export const first: Record<string, unknown> = { title: "£40", values: [true, null, -1] }; export const second = [`hello`];');
    expect([...parts.keys()]).toEqual(['first', 'second']);
    expect(parts.get('first')).toContain('title: "£40"');
    expect(parts.get('first')).not.toContain('Record');
    expect(parts.get('first')).not.toContain('second');
  });

  it.each([
    '', 'export const a = ;', 'import x from "x"; export const a = [];',
    'export let a = [];', 'export const a = [], b = [];',
    'export const a = fetch("https://example.com");',
    'export const a = []; export const b = a;',
    'export const a = { get title() { return "x"; } };',
    'export const a = { ["name"]: "value" };',
    'export const a = [...other];', 'export const a = { other };',
    'export const a = `${other}`;',
  ])('rejects unsupported code rather than silently changing semantics: %s', source => {
    expect(() => splitContent(source)).toThrow();
  });

  it('accepts the actual authoring catalogue without altering it', () => {
    const source = readFileSync(new URL('../data/content.ts', import.meta.url), 'utf8');
    const parts = splitContent(source);
    for (const name of ['caseStudies', 'blogPosts', 'techExplainers', 'contactDetails']) expect(parts.has(name)).toBe(true);
  });

  it('exposes independent modules and leaves unrelated files untouched', () => {
    const plugin = contentChunksPlugin();
    const root = path.resolve('/project');
    plugin.configResolved({ root });
    expect(plugin.transform('anything', path.join(root, 'other.ts'))).toBeNull();
    const result = plugin.transform('export const a = [1]; export const b = [2];', path.join(root, 'data/content.ts'));
    expect(result?.code).toContain('fresh-tech-content:a');
    expect(plugin.load('\0fresh-tech-content:a')?.code).not.toContain('const b');
    expect(() => plugin.load('\0fresh-tech-content:missing')).toThrow();
  });
});
