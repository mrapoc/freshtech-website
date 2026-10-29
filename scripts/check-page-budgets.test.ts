// @vitest-environment node
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectPage, checkPages, budgets } from './check-page-budgets.mjs';

const page = `<html><head><link rel="canonical" href="https://fresh-tech.uk/example"><style data-ft-bundled-css>h1{color:black}</style><link rel="modulepreload" href="/assets/app.js"></head><body><main><h1>Example</h1></main><script type="module" src="/assets/app.js"></script></body></html>`;
const read = () => Buffer.from('export const value = 1');
const deferredCss = '<link rel="stylesheet" href="/assets/app-hash.css" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="/assets/app-hash.css"></noscript>';
const homePage = () => page.replace('fresh-tech.uk/example', 'fresh-tech.uk/')
  .replace('data-ft-bundled-css', 'data-ft-critical-css')
  .replace('</style>', `</style>${deferredCss}`)
  .replace('<main>', '<main id="root" data-ft-ssr="home-v1" data-ft-ssr-date="2026-09-14T12:00:00Z">');

describe('generated page performance contract', () => {
  it('requires one valid homepage snapshot and rejects leakage to other pages', () => {
    const home = page.replace('fresh-tech.uk/example', 'fresh-tech.uk/');
    const marked = homePage();
    expect(inspectPage(home, '/', read).failures).toContain('Missing or invalid homepage hydration snapshot');
    expect(inspectPage(marked, '/', read).failures).toEqual([]);
    expect(inspectPage(marked.replace('2026-09-14T12:00:00Z', 'invalid'), '/', read).failures).toContain('Missing or invalid homepage hydration snapshot');
    expect(inspectPage(marked.replace('<h1>', '<h1 data-ft-ssr="home-v1">'), '/', read).failures).toContain('Missing or invalid homepage hydration snapshot');
    expect(inspectPage(marked, '/example', read).failures).toContain('Homepage hydration snapshot leaked into another route');
  });
  it('requires a bounded homepage critical style and a complete deferred stylesheet fallback', () => {
    const home = homePage();
    expect(inspectPage(home.replace('media="print"', 'media="all"'), '/', read).failures).toContain('Missing or invalid homepage deferred CSS and noscript fallback');
    expect(inspectPage(home.replace(/<noscript>.*?<\/noscript>/, ''), '/', read).failures).toContain('Missing or invalid homepage deferred CSS and noscript fallback');
    expect(inspectPage(home.split('app-hash.css').join('../secret.css'), '/', read).failures).toContain('Missing or invalid homepage deferred CSS and noscript fallback');
    expect(inspectPage(home.replace('h1{color:black}', 'x'.repeat(32_001)), '/', read).failures).toContain('Missing, duplicate or oversized homepage critical CSS');
    expect(inspectPage(home, '/', asset => { if (asset.endsWith('.css')) throw new Error('missing'); return read(); }).failures).toContain('Missing full homepage stylesheet');
  });
  it('validates both directions of sitemap coverage and respects noindex', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'freshtech-budget-'));
    try {
      fs.mkdirSync(path.join(root, 'example'));
      fs.mkdirSync(path.join(root, 'assets'));
      fs.writeFileSync(path.join(root, 'assets/app.js'), read());
      fs.writeFileSync(path.join(root, 'assets/app-hash.css'), 'h1{color:black}');
      fs.writeFileSync(path.join(root, 'index.html'), homePage());
      const example = path.join(root, 'example/index.html');
      fs.writeFileSync(example, page);
      const sitemap = path.join(root, 'sitemap.xml');
      const xml = (routes: string[]) => `<urlset>${routes.map(route => `<url><loc>https://fresh-tech.uk${route}</loc></url>`).join('')}</urlset>`;
      fs.writeFileSync(sitemap, xml(['/', '/example']));
      expect(checkPages(root).every(result => result.failures.length === 0)).toBe(true);
      fs.writeFileSync(sitemap, xml(['/']));
      expect(checkPages(root).find(result => result.route === '/example')?.failures).toContain('Indexable page missing from sitemap');
      fs.writeFileSync(example, page.replace('</head>', '<meta name="robots" content="noindex,follow"></head>'));
      expect(checkPages(root).every(result => result.failures.length === 0)).toBe(true);
      fs.writeFileSync(sitemap, xml(['/', '/example']));
      expect(checkPages(root).find(result => result.route === '/example')?.failures).toContain('Noindex page included in sitemap');
      fs.writeFileSync(sitemap, xml(['/', '/missing']));
      expect(() => checkPages(root)).toThrow('Sitemap route lacks prerendered output');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
  it('counts duplicate module hints once and validates a complete document', () => {
    const result = inspectPage(page, '/example', read);
    expect(result.failures).toEqual([]);
    expect(result.initialJsGzipBytes).toBeGreaterThan(0);
    expect(inspectPage(page.replace('<link rel="modulepreload" href="/assets/app.js">', ''), '/example', read).initialJsGzipBytes).toBe(result.initialJsGzipBytes);
  });
  it('rejects missing assets, wrong route content and reintroduced CSS requests', () => {
    expect(inspectPage(page, '/different', read).failures).toContain('Missing or incorrect canonical');
    expect(inspectPage(page.replace('<h1>Example</h1>', ''), '/example', read).failures).toContain('Missing prerendered main heading');
    expect(inspectPage(page, '/example', () => { throw new Error('missing'); }).failures).toContain('Missing initial module /assets/app.js');
    expect(inspectPage(page.replace('</head>', '<link rel="stylesheet" href="/assets/app.css"></head>'), '/example', read).failures).toContain('External bundled stylesheet reintroduced');
  });
  it('fails configured byte budgets and prevents escaping asset reads', () => {
    expect(inspectPage(page, '/example', read, { ...budgets, initialJsGzipBytes: 1 }).failures.join()).toContain('Initial module gzip');
    let reads = 0;
    const altered = page.split('/assets/app.js').join('/assets/../../secret.js');
    expect(inspectPage(altered, '/example', () => { reads++; return read(); }).failures).toContain('Unexpected initial module URL');
    expect(reads).toBe(0);
  });
});
