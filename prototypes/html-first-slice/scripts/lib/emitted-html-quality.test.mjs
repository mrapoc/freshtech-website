import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { inspectEmittedHtml, QUALITY_BUDGETS } from './emitted-html-quality.mjs';

const temporary = [];
test.after(async () => Promise.all(temporary.map(path => rm(path, { recursive: true, force: true }))));

const htmlFor = (route = '/', body = '') => `<!doctype html>
<html lang="en-GB"><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Useful page description">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://fresh-tech.uk${route}">
<title>Useful page title</title>
<script type="application/ld+json">{"@context":"https://schema.org"}</script>
</head><body><main><h1>Useful heading</h1>
<img src="/image.png" alt="" width="32" height="24">
${body}<script type="module" src="/entry.js"></script>
</main></body></html>`;

async function fixture({ route = '/', html = htmlFor(route), entry = `import './dependency.js'; import('./later.js');` } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'fresh-tech-quality-'));
  temporary.push(root);
  const output = route === '/' ? join(root, 'index.html') : join(root, route.slice(1), 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await Promise.all([
    writeFile(output, html),
    writeFile(join(root, 'entry.js'), entry),
    writeFile(join(root, 'dependency.js'), 'export const ready = true;'),
    writeFile(join(root, 'style.css'), 'body { color: #111 }'),
    writeFile(join(root, 'image.png'), 'synthetic'),
  ]);
  return root;
}

async function rejectsMutation(pattern, mutate, options) {
  const route = options?.route ?? '/';
  const root = await fixture({ route, html: mutate(htmlFor(route)), entry: options?.entry });
  await assert.rejects(inspectEmittedHtml(root, options?.inspect), pattern);
}

test('accepts a valid document and excludes dynamic imports from the initial graph', async () => {
  const root = await fixture();
  const report = await inspectEmittedHtml(root);
  assert.equal(report.pageCount, 1);
  assert.deepEqual(report.routes[0].initialModules, ['dependency.js', 'entry.js']);
  assert.equal(report.routes[0].route, '/');
});

for (const [name, pattern, mutate] of [
  ['html lang', /html lang/, html => html.replace(' lang="en-GB"', '')],
  ['main', /exactly one main/, html => html.replaceAll('<main>', '<div>').replaceAll('</main>', '</div>')],
  ['h1', /exactly one h1/, html => html.replaceAll('<h1>', '<h2>').replaceAll('</h1>', '</h2>')],
  ['title', /title is empty/, html => html.replace('Useful page title', '')],
  ['description', /meta description is empty/, html => html.replace('content="Useful page description"', 'content=""')],
  ['viewport', /exactly one viewport/, html => html.replace('<meta name="viewport" content="width=device-width, initial-scale=1">', '')],
  ['canonical', /canonical must be/, html => html.replace('https://fresh-tech.uk/', 'https://fresh-tech.uk/wrong')],
  ['robots', /robots meta contradicts/, html => html.replace('noindex, nofollow', 'index, noindex')],
]) test(`rejects invalid ${name}`, () => rejectsMutation(pattern, mutate));

test('rejects viewports that prevent 200% zoom', async () => {
  await rejectsMutation(/prevents 200% zoom/, html => html.replace('initial-scale=1', 'initial-scale=1, maximum-scale=1'));
  await rejectsMutation(/disables user scaling/, html => html.replace('initial-scale=1', 'initial-scale=1, user-scalable=no'));
});

test('rejects invalid JSON-LD', () => rejectsMutation(/invalid JSON-LD/, html => html.replace('{"@context":"https://schema.org"}', '{bad')));

test('rejects em dashes in visible copy, title and description including numeric entities', async () => {
  await rejectsMutation(/visible text contains an em dash/, html => html.replace('Useful heading', 'Useful — heading'));
  await rejectsMutation(/title contains an em dash/, html => html.replace('Useful page title', 'Useful &#8212; title'));
  await rejectsMutation(/meta description contains an em dash/, html => html.replace('Useful page description', 'Useful &#x2014; description'));
});

test('rejects emoji-led list text without rejecting numbers or SVG icons', async () => {
  await rejectsMutation(/list item begins with textual emoji/, html => html.replace('</h1>', '</h1><ul><li>✅ Setup</li></ul>'));
  await rejectsMutation(/list item begins with textual emoji/, html => html.replace('</h1>', '</h1><ul><li>&#x2705; Setup</li></ul>'));
  const root = await fixture({ html: htmlFor('/').replace('</h1>', '</h1><ul><li>1. Setup</li><li><svg><path></path></svg>Setup</li></ul>') });
  await inspectEmittedHtml(root);
});

test('rejects missing image accessibility and dimensions', async () => {
  await rejectsMutation(/img is missing alt/, html => html.replace(' alt=""', ''));
  await rejectsMutation(/img has invalid width/, html => html.replace('width="32"', 'width="0"'));
  await rejectsMutation(/img has invalid height/, html => html.replace('height="24"', 'height="auto"'));
});

test('rejects framework hydration markers', async () => {
  await rejectsMutation(/framework hydration/, html => html.replace('<main>', '<main data-reactroot="">'));
  await rejectsMutation(/framework hydration/, html => html.replace('<main>', '<main><astro-island>'));
});

test('rejects the reserved data-testimonials-fixture attribute on any element regardless of value or case', async () => {
  const pattern = /reserved data-testimonials-fixture attribute/;
  for (const attribute of [
    'data-testimonials-fixture="true"',
    'data-testimonials-fixture="false"',
    'data-testimonials-fixture',
    'data-testimonials-fixture=""',
    'DATA-TESTIMONIALS-FIXTURE="1"',
    'Data-Testimonials-Fixture="no"',
  ]) {
    await rejectsMutation(pattern, html => html.replace('<main>', `<main ${attribute}>`));
  }
  await rejectsMutation(pattern, html => html.replace('</h1>', '</h1><section data-testimonials-fixture="true"><p>Synthetic</p></section>'));
  await rejectsMutation(pattern, html => html.replace('<html lang="en-GB">', '<html lang="en-GB" data-testimonials-fixture="true">'));
  await rejectsMutation(pattern, html => html.replace('</h1>', '</h1><img src="/image.png" alt="" width="1" height="1" data-testimonials-fixture>'));
});

test('does not reject the fixture marker as visible text or as a script string', async () => {
  const body = '<p>The string data-testimonials-fixture="true" is only text here.</p>'
    + '<script type="module">const marker = "data-testimonials-fixture"; const other = \'data-testimonials-fixture="true"\';</script>';
  const root = await fixture({ html: htmlFor('/', body) });
  const report = await inspectEmittedHtml(root);
  assert.equal(report.pageCount, 1);
});

test('rejects eager analytics and external executable resources', async () => {
  await rejectsMutation(/eager external executable/, html => html.replace('/entry.js', 'https://example.com/widget.js'));
  await rejectsMutation(/eager inline analytics/, html => html.replace('</head>', '<script>fetch("https://www.googletagmanager.com/x")</script></head>'));
  await rejectsMutation(/unsupported eager executable/, html => html.replace('/entry.js', 'data:text/javascript,alert(1)'));
  await rejectsMutation(/unsupported eager embedded/, html => html.replace('</main>', '<iframe src="blob:test"></iframe></main>'));
  const badge = 'https://registry.blockmarktech.com/certificates/x/widget/';
  for (const frame of [`<iframe src="https://example.com/x" loading="lazy" sandbox></iframe>`, `<iframe src="${badge}" sandbox></iframe>`,
    `<iframe src="${badge}" loading="lazy"></iframe>`, `<iframe src="${badge}" loading="lazy" sandbox="allow-scripts allow-top-navigation"></iframe>`,
    `<iframe src="${badge}" loading="lazy" sandbox="allow-popups allow-same-origin"></iframe>`]) {
    await rejectsMutation(/eager external embedded/, html => html.replace('</main>', `${frame}</main>`));
  }
});

test('accepts only the reviewed Blockmark certificate badge frame, lazy and sandboxed', async () => {
  const frame = '<iframe src="https://registry.blockmarktech.com/certificates/x/widget/?theme=white" title="Certificate" width="132" height="132" loading="lazy" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>';
  const root = await fixture({ html: htmlFor('/', `<p>Certified.</p>${frame}`) });
  assert.equal((await inspectEmittedHtml(root)).pageCount, 1);
});

test('rejects every stylesheet reference under the inline-CSS contract', async () => {
  for (const reference of ['/style.css', 'https://example.com/style.css', '//example.com/style.css']) {
    await rejectsMutation(/stylesheet reference violates the inline-CSS contract/, html => html.replace('</head>', `<link rel="stylesheet" href="${reference}"></head>`));
  }
  await rejectsMutation(/stylesheet reference violates the inline-CSS contract/, html => html.replace('</head>', '<style>@import "/style.css";</style></head>'));
  await rejectsMutation(/stylesheet reference violates the inline-CSS contract/, html => html.replace('</head>', '<style>@import url(/style.css);</style></head>'));
  await rejectsMutation(/stylesheet reference violates the inline-CSS contract/, html => html.replace('</head>', '<style>@import "https://example.com/extra.css";</style></head>'));
  await rejectsMutation(/stylesheet reference violates the inline-CSS contract/, html => html.replace('</head>', '<style>@import url(https://example.com/extra.css);</style></head>'));
});

test('rejects mixed-content resources but allows remote HTTPS images and CSS assets', async () => {
  await rejectsMutation(/mixed-content resource/, html => html.replace('/image.png', 'http://example.com/image.png'));
  const root = await fixture({ html: htmlFor('/').replace('/image.png', 'https://images.example.com/image.png') });
  await inspectEmittedHtml(root);
  const cssImageRoot = await fixture({ html: htmlFor('/').replace('</head>', '<style>.hero{background:url(https://images.example.com/background.jpg)}</style></head>') });
  await inspectEmittedHtml(cssImageRoot);
});

const withSrcset = (html, srcset) => html.replace('<img src="/image.png"', `<img src="/image.png" srcset="${srcset}"`);

test('tokenises srcset candidates by URL token rather than by every comma', async () => {
  // A URL token runs until ASCII whitespace, so internal commas in the
  // Cloudinary-style transformation segment stay part of one HTTPS URL.
  const commaHttps = 'https://images.example.test/upload/w_130,f_auto,q_auto:eco/fixture.svg 1x, https://images.example.test/upload/w_260,f_auto,q_auto:eco/fixture.svg 2x';
  await inspectEmittedHtml(await fixture({ html: withSrcset(htmlFor('/'), commaHttps) }));

  // Ordinary local candidates with descriptors resolve each URL exactly.
  const multiRoot = await fixture({ html: withSrcset(htmlFor('/'), '/image.png 1x, /image-2x.png 2x') });
  await writeFile(join(multiRoot, 'image-2x.png'), 'synthetic');
  await inspectEmittedHtml(multiRoot);

  // Descriptor-free candidates separated by comma plus whitespace: the URL
  // token ends in a comma, which is stripped, and the next token is a URL.
  const compactRoot = await fixture({ html: withSrcset(htmlFor('/'), '/image.png, /image-2x.png') });
  await writeFile(join(compactRoot, 'image-2x.png'), 'synthetic');
  await inspectEmittedHtml(compactRoot);

  // A data URL contains a comma but no whitespace, so it stays intact.
  await inspectEmittedHtml(await fixture({ html: withSrcset(htmlFor('/'), 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E 1x, /image.png 2x') }));

  // Commas inside a descriptor's parentheses do not start a new candidate.
  await inspectEmittedHtml(await fixture({ html: withSrcset(htmlFor('/'), '/image.png calc(1px,2px) , /image.png 2x') }));
});

test('still checks every true srcset candidate URL', async () => {
  await rejectsMutation(/local resource does not exist with exact casing: "\/image-2x.png"/, html => withSrcset(html, '/image.png 1x, /image-2x.png 2x'));
  await rejectsMutation(/mixed-content resource "http:\/\/images.example.test\/upload\/w_130,f_auto\/fixture.svg"/, html => withSrcset(html, 'http://images.example.test/upload/w_130,f_auto/fixture.svg 1x, /image.png 2x'));
  await rejectsMutation(/resource escapes dist/, html => withSrcset(html, '/image.png 1x, ../outside.png 2x'));
  // Without whitespace after the comma the grammar yields a single URL token,
  // which is then checked as one (nonexistent) local resource.
  await rejectsMutation(/local resource does not exist with exact casing: "\/image.png,\/image-2x.png"/, html => withSrcset(html, '/image.png,/image-2x.png'));
});

test('rejects missing and escaping local resources', async () => {
  await rejectsMutation(/local resource does not exist/, html => html.replace('/image.png', '/missing.png'));
  await rejectsMutation(/exact casing/, html => html.replace('/image.png', '/Image.png'));
  await rejectsMutation(/resource escapes dist/, html => html.replace('/image.png', '../outside.png'));
});

test('rejects unresolved, bare and escaping static imports', async () => {
  for (const [entry, pattern] of [
    [`import './missing.js';`, /initial module does not exist/],
    [`import 'package-name';`, /bare static import/],
    [`import '../outside.js';`, /resource escapes dist/],
  ]) {
    const root = await fixture({ entry });
    await assert.rejects(inspectEmittedHtml(root), pattern);
  }
});

test('enforces each per-page gzip budget', async () => {
  const root = await fixture({ html: htmlFor('/', '<script>const inline = "content";</script>') });
  for (const [budget, pattern] of [
    ['htmlGzipBytes', /gzip HTML/],
    ['initialModulesGzipBytes', /initial module gzip/],
    ['inlineExecutableGzipBytes', /inline executable gzip/],
  ]) {
    await assert.rejects(inspectEmittedHtml(root, { budgets: { ...QUALITY_BUDGETS, [budget]: 1 } }), pattern);
  }
});

test('counts classic scripts and imports from inline modules in the initial JavaScript budget', async () => {
  const classicRoot = await fixture({ html: htmlFor('/').replace('type="module"', ''), entry: 'const payload = "classic";' });
  await assert.rejects(inspectEmittedHtml(classicRoot, { budgets: { ...QUALITY_BUDGETS, initialModulesGzipBytes: 1 } }), /initial module gzip/);

  const inlineRoot = await fixture({ html: htmlFor('/').replace('<script type="module" src="/entry.js"></script>', '<script type="module">import "./entry.js";</script>') });
  const report = await inspectEmittedHtml(inlineRoot);
  assert.deepEqual(report.routes[0].initialModules, ['dependency.js', 'entry.js']);
});

test('discovers a newly emitted nested route without a route list', async () => {
  const root = await fixture();
  const route = '/future/new-page';
  const output = join(root, 'future', 'new-page', 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, htmlFor(route));
  const report = await inspectEmittedHtml(root);
  assert.equal(report.pageCount, 2);
  assert.deepEqual(report.routes.map(item => item.route).sort(), ['/', route]);
});

test('rejects emitted HTML outside directory index layout', async () => {
  const root = await fixture();
  await writeFile(join(root, 'orphan.html'), htmlFor('/orphan'));
  await assert.rejects(inspectEmittedHtml(root), /Unexpected HTML route layout/);
});

test('reports total emitted JavaScript without applying a shared cap', async () => {
  const root = await fixture();
  await writeFile(join(root, 'unused.js'), 'x'.repeat(100_000));
  const report = await inspectEmittedHtml(root);
  assert.ok(report.totalEmittedJavaScriptGzipBytes > 0);
});
