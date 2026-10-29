import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

export const budgets = {
  htmlBytes: 400_000,
  htmlGzipBytes: 55_000,
  inlineCssBytes: 200 * 1024,
  initialJsGzipBytes: 400_000,
};

function documentFacts(html) {
  const facts = { links: [], scripts: [], css: [], criticalCss: [], headings: [], hydration: [], noindex: false };
  const text = node => node.value || (node.childNodes || []).map(text).join('');
  function visit(node, inMain = false, inNoscript = false) {
    const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
    if ('data-ft-ssr' in attrs || 'data-ft-ssr-date' in attrs) facts.hydration.push(attrs);
    if (node.tagName === 'link') facts.links.push({ ...attrs, inNoscript });
    if (node.tagName === 'script') facts.scripts.push(attrs);
    if (node.tagName === 'style' && 'data-ft-bundled-css' in attrs) facts.css.push(text(node));
    if (node.tagName === 'style' && 'data-ft-critical-css' in attrs) facts.criticalCss.push(text(node));
    if (node.tagName === 'h1' && inMain) facts.headings.push(text(node));
    if (node.tagName === 'meta' && /^(robots|googlebot)$/i.test(attrs.name || '') && /\bnoindex\b/i.test(attrs.content || '')) facts.noindex = true;
    for (const child of node.childNodes || []) visit(child, inMain || node.tagName === 'main', inNoscript || node.tagName === 'noscript');
  }
  visit(parse(html, { scriptingEnabled: false }));
  return facts;
}

export function inspectPage(html, route, readAsset, limits = budgets) {
  const failures = [];
  const facts = documentFacts(html);
  if (route === '/') {
    const marker = facts.hydration[0];
    if (facts.hydration.length !== 1 || marker.id !== 'root' || marker['data-ft-ssr'] !== 'home-v1' || !Number.isFinite(Date.parse(marker['data-ft-ssr-date'] || ''))) failures.push('Missing or invalid homepage hydration snapshot');
  } else if (facts.hydration.length) failures.push('Homepage hydration snapshot leaked into another route');
  const raw = Buffer.byteLength(html);
  const gzip = gzipSync(html).length;
  if (raw > limits.htmlBytes) failures.push(`HTML ${raw} > ${limits.htmlBytes} bytes`);
  if (gzip > limits.htmlGzipBytes) failures.push(`HTML gzip ${gzip} > ${limits.htmlGzipBytes} bytes`);
  if (!facts.headings.some(heading => heading.trim())) failures.push('Missing prerendered main heading');
  const canonicals = facts.links.filter(link => link.rel === 'canonical');
  if (canonicals.length !== 1 || canonicals[0].href !== `https://fresh-tech.uk${route}`) failures.push('Missing or incorrect canonical');
  const localSheets = facts.links.filter(link => link.rel === 'stylesheet' && link.href?.startsWith('/assets/'));
  if (route === '/') {
    if (facts.css.length || facts.criticalCss.length !== 1 || Buffer.byteLength(facts.criticalCss[0] || '') > 32_000) failures.push('Missing, duplicate or oversized homepage critical CSS');
    if (gzip > 30_000) failures.push('Homepage HTML gzip exceeds 30000 bytes');
    const deferred = localSheets.filter(link => !link.inNoscript);
    const fallback = localSheets.filter(link => link.inNoscript);
    const sheet = deferred[0];
    if (deferred.length !== 1 || fallback.length !== 1 || !/^\/assets\/[A-Za-z0-9_-]+\.css$/.test(sheet?.href || '') || sheet.media !== 'print' || sheet.onload !== "this.media='all'" || fallback[0].href !== sheet.href || fallback[0].media) {
      failures.push('Missing or invalid homepage deferred CSS and noscript fallback');
    } else {
      try {
        if (readAsset(sheet.href).length > limits.inlineCssBytes) failures.push('Full homepage stylesheet exceeds CSS budget');
      } catch { failures.push('Missing full homepage stylesheet'); }
    }
  } else {
    if (facts.criticalCss.length || facts.css.length !== 1 || Buffer.byteLength(facts.css[0] || '') > limits.inlineCssBytes) failures.push('Missing, duplicate or oversized bundled CSS');
    if (localSheets.length) failures.push('External bundled stylesheet reintroduced');
  }
  // Vite's prerendered modulepreload hints include the active route graph.
  // This metric covers those explicit initial modules, not later interactions.
  const scripts = new Set([
    ...facts.scripts.filter(script => script.type === 'module' && script.src).map(script => script.src),
    ...facts.links.filter(link => link.rel === 'modulepreload' && link.href).map(link => link.href),
  ]);
  let initialJsGzip = 0;
  for (const asset of scripts) {
    if (!/^\/assets\/[^/]+\.js$/.test(asset)) { failures.push('Unexpected initial module URL'); continue; }
    try { initialJsGzip += gzipSync(readAsset(asset)).length; }
    catch { failures.push(`Missing initial module ${asset}`); }
  }
  if (!scripts.size) failures.push('Missing application module');
  if (initialJsGzip > limits.initialJsGzipBytes) failures.push(`Initial module gzip ${initialJsGzip} > ${limits.initialJsGzipBytes} bytes`);
  if (route === '/' && initialJsGzip > 210_000) failures.push('Homepage initial module gzip exceeds 210000 bytes');
  return { route, htmlBytes: raw, htmlGzipBytes: gzip, initialJsGzipBytes: initialJsGzip, noindex: facts.noindex, failures };
}

export function checkPages(directory) {
  const root = path.resolve(directory);
  const files = [];
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Generated output must not contain symlinks');
      const target = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.name === 'index.html') files.push(target);
    }
  }
  walk(root);
  if (!files.length) throw new Error('No prerendered pages found');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => new URL(match[1].replaceAll('&amp;', '&')));
  if (!urls.length) throw new Error('Sitemap has no routes');
  const generated = new Set(files.map(file => path.resolve(file)));
  const sitemapRoutes = new Set(urls.map(url => url.pathname));
  for (const url of urls) {
    if (url.origin !== 'https://fresh-tech.uk' || !generated.has(path.resolve(root, `.${url.pathname}`, 'index.html'))) throw new Error(`Sitemap route lacks prerendered output: ${url.pathname}`);
  }
  const assets = new Map();
  const readAsset = asset => {
    if (!assets.has(asset)) assets.set(asset, fs.readFileSync(path.join(root, asset.slice(1))));
    return assets.get(asset);
  };
  return files.map(file => {
    const folder = path.relative(root, path.dirname(file)).split(path.sep).join('/');
    const result = inspectPage(fs.readFileSync(file, 'utf8'), folder ? `/${folder}` : '/', readAsset);
    if (!result.noindex && !sitemapRoutes.has(result.route)) result.failures.push('Indexable page missing from sitemap');
    if (result.noindex && sitemapRoutes.has(result.route)) result.failures.push('Noindex page included in sitemap');
    return result;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = checkPages(process.argv[2] || 'dist');
  const failed = results.filter(page => page.failures.length);
  console.log(JSON.stringify({ pages: results.length, failed: failed.length,
    maximumHtmlGzip: Math.max(...results.map(page => page.htmlGzipBytes)),
    maximumInitialJsGzip: Math.max(...results.map(page => page.initialJsGzipBytes)), findings: failed }, null, 2));
  if (failed.length) process.exitCode = 1;
}
