// @vitest-environment node
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import { optimiseHomepageCss, CRITICAL_MARKER, BUNDLED_MARKER } from './homepage-critical-css.mjs';

const fonts = [
  `@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/inter-400.woff2) format("woff2")}`,
  `@font-face{font-family:"Inter";font-style:normal;font-weight:700;font-display:swap;src:url(/fonts/inter-700.woff2) format("woff2")}`,
  `@font-face{font-family:"Fraunces";font-style:italic;font-weight:600;font-display:swap;unicode-range:U+0000-00FF;src:url(/fonts/fraunces.woff2) format("woff2")}`,
];
const css = [
  ...fonts,
  `:root{--ft-accent:#0f766e;--ft-gap:1rem}`,
  `html{scroll-behavior:smooth}`,
  `body{margin:0;color:#111}`,
  `.ft-hero{display:grid;gap:var(--ft-gap)}`,
  `@media (min-width:768px){.ft-hero{grid-template-columns:1fr 1fr}}`,
  `@media (min-width:1280px){.ft-hero{gap:2rem}}`,
  `.no-print{display:block}`,
  `.unused-card{border:1px solid red}`,
  `@media (min-width:768px){.unused-card{padding:4rem}}`,
  `@keyframes ft-fade{from{opacity:0}to{opacity:1}}`,
].join('');
const head = `<head><meta charset="utf-8"><title>Fresh Tech</title><link rel="canonical" href="https://fresh-tech.uk/"><link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossorigin><style ${BUNDLED_MARKER}>${css}</style><link rel="modulepreload" href="/assets/app.js"><script type="application/ld+json">{"@type":"Organization","name":"Fresh Tech"}</script></head>`;
const body = `<body><div id="root" data-ft-ssr="home-v1" data-ft-ssr-date="2026-09-14T12:00:00Z"><main class="ft-hero"><h1 style="font-family:Inter">Managed IT</h1><p class="no-print">Support</p></main></div><script>window.__FT__={"a":1}</script><script type="module" src="/assets/app.js"></script></body>`;
const page = `<!DOCTYPE html><html lang="en">${head}${body}</html>`;
const href = '/assets/index-Ab12Cd34.css';
const styleStart = page.indexOf('<style');
const styleEnd = page.indexOf('</style>') + '</style>'.length;
const prefix = page.slice(0, styleStart);
const suffix = page.slice(styleEnd);

function criticalCss(output: string) {
  const match = output.match(new RegExp(`<style ${CRITICAL_MARKER}>([\\s\\S]*?)</style>`));
  if (!match) throw new Error('missing critical style');
  return match[1];
}

describe('homepage critical CSS transformer', () => {
  it('preserves the existing remote font link without fetching it', async () => {
    const link = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo" media="print" onload="this.media=\'all\'">';
    const output = await optimiseHomepageCss(page.replace('</head>', `${link}</head>`), href);
    expect(output).toContain(link);
  });
  it('replaces only the bundled style and preserves every other byte', async () => {
    const output = await optimiseHomepageCss(page, href);
    expect(output.startsWith(prefix)).toBe(true);
    expect(output.endsWith(suffix)).toBe(true);
    expect(output.match(new RegExp(CRITICAL_MARKER, 'g'))).toHaveLength(1);
    expect(output).not.toContain(BUNDLED_MARKER);
    const middle = output.slice(prefix.length, output.length - suffix.length);
    expect(middle).toBe(`<style ${CRITICAL_MARKER}>${criticalCss(output)}</style><link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`);
    expect(output.match(/rel="stylesheet"/g)).toHaveLength(2);
    expect(output.match(/<noscript>/g)).toHaveLength(1);
    expect(output).toContain('<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossorigin>');
  });
  it('restores every original @font-face once, in order, with unchanged metadata', async () => {
    const output = await optimiseHomepageCss(page, href);
    const faces: string[] = [];
    postcss.parse(criticalCss(output)).walkAtRules('font-face', rule => { faces.push(rule.toString()); });
    expect(faces).toEqual(fonts);
  });
  it('keeps critical and responsive ft rules while pruning unrelated CSS', async () => {
    const critical = criticalCss(await optimiseHomepageCss(page, href));
    for (const rule of [':root{', 'html{', 'body{', '.ft-hero{display:grid', '.no-print{', '@keyframes ft-fade']) expect(critical).toContain(rule);
    expect(critical.match(/@media \(min-width:768px\)\{\.ft-hero/g)).toHaveLength(1);
    expect(critical.match(/@media \(min-width:1280px\)\{\.ft-hero/g)).toHaveLength(1);
    expect(critical).not.toContain('.unused-card');
    expect(critical.length).toBeLessThan(css.length);
  });
  it('refuses the wrong route, duplicate inline CSS, missing SSR root and prior output', async () => {
    await expect(optimiseHomepageCss(page.replace('https://fresh-tech.uk/"', 'https://fresh-tech.uk/about"'), href)).rejects.toThrow('canonical');
    await expect(optimiseHomepageCss(page.replace('</head>', `<style ${BUNDLED_MARKER}>a{color:red}</style></head>`), href)).rejects.toThrow('exactly one style');
    await expect(optimiseHomepageCss(page.replace(' data-ft-ssr="home-v1"', ''), href)).rejects.toThrow('SSR root');
    await expect(optimiseHomepageCss(page.replace('<div id="root"', '<div id="app"'), href)).rejects.toThrow('SSR root');
    await expect(optimiseHomepageCss(page.replace('</head>', `<link rel="stylesheet" href="${href}"></head>`), href)).rejects.toThrow('external stylesheet');
    const once = await optimiseHomepageCss(page, href);
    await expect(optimiseHomepageCss(once, href)).rejects.toThrow('exactly one style');
  });
  it('refuses unsafe stylesheet hrefs before running Beasties', async () => {
    let constructed = 0;
    class Spy { constructor() { constructed++; } process(html: string) { return Promise.resolve(html); } }
    for (const bad of ['/assets/../secret.css', 'https://fresh-tech.uk/assets/app.css', '/other/app.css', '/assets/nested/app.css', '/assets/app.js', 'assets/app.css', '/assets/.hidden.css']) {
      await expect(optimiseHomepageCss(page, bad, { Beasties: Spy })).rejects.toThrow('unsafe stylesheet href');
    }
    expect(constructed).toBe(0);
  });
  it('fails closed when Beasties warns or errors instead of hiding unsupported selectors', async () => {
    class Warning { logger: { warn(message: string): void }; constructor(options: { logger: { warn(message: string): void } }) { this.logger = options.logger; } process(html: string) { this.logger.warn('Unsupported selector'); return Promise.resolve(html); } }
    await expect(optimiseHomepageCss(page, href, { Beasties: Warning })).rejects.toThrow('Unsupported selector');
    class Erroring { logger: { error(message: string): void }; constructor(options: { logger: { error(message: string): void } }) { this.logger = options.logger; } process(html: string) { this.logger.error('Failed'); return Promise.resolve(html); } }
    await expect(optimiseHomepageCss(page, href, { Beasties: Erroring })).rejects.toThrow('Failed');
    class Lost { process() { return Promise.resolve('<html><head></head><body></body></html>'); } }
    await expect(optimiseHomepageCss(page, href, { Beasties: Lost })).rejects.toThrow('lost the bundled style');
  });
  it('passes the reviewed Beasties configuration and does not touch the full asset', async () => {
    let seen: Record<string, unknown> = {};
    class Recorder { constructor(options: Record<string, unknown>) { seen = options; } process(html: string) { return Promise.resolve(html); } }
    const output = await optimiseHomepageCss(page, href, { Beasties: Recorder });
    expect(seen).toMatchObject({ external: false, remote: false, reduceInlineStyles: true, mergeStylesheets: false, inlineFonts: true, preloadFonts: false, keyframes: 'all', pruneSource: false });
    expect((seen.allowRules as RegExp[]).map(String)).toEqual(['/\\.ft-/', '/:root/', '/^html/', '/^body/', '/\\.no-print/']);
    expect(output).toContain(`href="${href}"`);
    expect(output).not.toContain(`${href}?`);
  });
});
