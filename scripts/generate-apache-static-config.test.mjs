import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  compileApacheStaticConfig,
  createUploadManifest,
  parseNetlifyRouting,
} from './generate-apache-static-config.mjs';

const source = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');

test('Google aggregate has one exact production route and no preview handler', () => {
  const production = compileApacheStaticConfig(source, { mode: 'production' });
  assert.ok(production.includes('RewriteRule ^api/google-rating$ /server/api/google-rating.php [END]'));
  assert.equal((production.match(/google-rating\.php/g) ?? []).length, 1);
  assert.doesNotMatch(compileApacheStaticConfig(source, { mode: 'preview' }), /google-rating/);
});

test('copied fonts receive a bounded cache lifetime without immutable semantics', () => {
  const output = compileApacheStaticConfig(source, { mode: 'preview' });
  assert.ok(output.includes('<If "%{REQUEST_URI} =~ m#^/fonts/.*\\.(woff2?|ttf|otf)$#">\n  Header set Cache-Control "public, max-age=86400, must-revalidate"\n</If>'));
});

test('native pictures and icons receive a bounded cache lifetime', () => {
  for (const mode of ['preview', 'production']) {
    const output = compileApacheStaticConfig(source, { mode });
    assert.ok(output.includes('<If "%{REQUEST_URI} =~ m#^/(images|icons)/.*\\.(avif|gif|ico|jpe?g|png|svg|webp)$#">\n  Header set Cache-Control "public, max-age=86400, must-revalidate"\n</If>'));
  }
});

test('parses the complete ordered Netlify routing contract', () => {
  const config = parseNetlifyRouting(source);
  assert.equal(config.redirects.length, 99);
  assert.equal(config.redirects.filter(({ status }) => status === 301).length, 98);
  assert.deepEqual(config.redirects[0].query, { wordfence_lh: ':val' });
  assert.deepEqual(config.redirects.at(-1), { from: '/*', to: '/index.html', status: 200 });
  assert.deepEqual(config.headers.map(({ for: path }) => path), ['/*', '/assets/*', '/index.html']);
});

test('preserves redirect order, including intentionally shadowed wildcard rules', () => {
  const output = compileApacheStaticConfig(source, { mode: 'production' });
  assert.ok(output.indexOf('# 48: /wp-content/* -> /') < output.indexOf('# 50: /wp-content/uploads/* -> /resources'));
  assert.ok(output.includes('RewriteRule ^wp-content/.*$ https://fresh-tech.uk/ [R=301,END,NE]'));
  assert.ok(output.includes('RewriteRule ^.*-sitemap\\.xml$ https://fresh-tech.uk/sitemap.xml [R=301,END,NE]'));
  const legacySection = output.split('# Ordered legacy redirects translated from netlify.toml.')[1].split('# Canonicalise remaining')[0];
  assert.equal((legacySection.match(/\[R=301,/g) ?? []).length, 98);
  assert.ok(output.indexOf('RewriteRule ^home/$ https://fresh-tech.uk/ [R=301,END,NE]') < output.indexOf('# Canonicalise remaining'));
});

test('clears matched WordPress queries but preserves queries during slash canonicalisation', () => {
  const output = compileApacheStaticConfig(source, { mode: 'production' });
  assert.match(output, /RewriteCond %\{QUERY_STRING\} \(\^\|&\)wordfence_lh=\[\^&\]\*\(&\|\$\) \[NC\]/);
  assert.ok(output.includes('RewriteRule ^$ https://fresh-tech.uk/ [R=301,END,NE,QSD]'));
  const slashRule = output.match(/RewriteRule \^ https:\/\/fresh-tech\.uk\/%1 .*$/m)?.[0];
  assert.ok(slashRule);
  assert.doesNotMatch(slashRule, /QSD/);
  assert.match(output, /RewriteCond %\{THE_REQUEST\} "\\s\/\+\(\[\^\/\?\\s\]\[\^\?\\s\]\*\?\)\/\+\(\?:\[\?\\s\]\)" \[NC\]/);
  assert.match(slashRule, /\/%1 \[R=301,END,NE\]/);
  assert.doesNotMatch(slashRule, /\/\$1/);
});

test('raw-request slash target stays same-origin and preserves encoded query/hash octets', () => {
  const condition = /\s\/+([^/?\s][^?\s]*?)\/+(?:[?\s])/;
  const targetFor = (requestLine) => {
    const capture = requestLine.match(condition)?.[1];
    return capture ? `/${capture}` : null;
  };
  assert.equal(targetFor('GET /pricing/%3Ffilter%3Done/ HTTP/1.1'), '/pricing/%3Ffilter%3Done');
  assert.equal(targetFor('GET /pricing/%23details/?probe=1 HTTP/1.1'), '/pricing/%23details');
  assert.equal(targetFor('GET //attacker.example/path/ HTTP/1.1'), '/attacker.example/path');
  assert.equal(targetFor('GET /?next=https://example.test/ HTTP/1.1'), null);
  assert.equal(targetFor('GET /pricing?next=https://example.test/ HTTP/1.1'), null);
  assert.equal(targetFor('GET /// HTTP/1.1'), null);
  assert.equal(targetFor('GET ////?next=/ HTTP/1.1'), null);
});

test('uses static directory indexes and leaves unknown paths to Apache 404 handling', () => {
  const output = compileApacheStaticConfig(source, { mode: 'production' });
  assert.match(output, /Options -Indexes -MultiViews/);
  assert.match(output, /DirectorySlash Off/);
  assert.match(output, /ErrorDocument 404 "Not found"/);
  assert.match(output, /RewriteCond %\{REQUEST_FILENAME\}\/index\.html -f/);
  assert.match(output, /RewriteRule \^\(\.\+\)\$ \/\$1\/index\.html \[END\]/);
  assert.doesNotMatch(output, /RewriteRule .* \/index\.html \[R?=?(?:200)?/);
  assert.match(output, /Netlify SPA fallback is intentionally omitted/);
});

test('emits exact security and cache headers, with preview indexing protection', () => {
  const preview = compileApacheStaticConfig(source, { mode: 'preview' });
  const production = compileApacheStaticConfig(source, { mode: 'production' });
  for (const output of [preview, production]) {
    const csp = output.match(/^Header always set Content-Security-Policy "([^"]*)"$/m)?.[1];
    assert.ok(csp, 'one static-site CSP is emitted');
    assert.equal(output.match(/^Header always set Content-Security-Policy /gm).length, 1);
    const scriptSrc = csp.split('; ').find(directive => directive.startsWith('script-src '));
    assert.equal(scriptSrc, "script-src 'self' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms");
    assert.doesNotMatch(csp, /unsafe-eval|cdn\.tailwindcss\.com|esm\.sh|netlify\.app/);
    assert.match(csp, /frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'/);
    assert.match(output, /Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"/);
    assert.match(output, /Header always set Permissions-Policy "camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)"/);
    assert.match(output, /Header always set Cross-Origin-Opener-Policy "same-origin"/);
    assert.match(output, /Header always set Cross-Origin-Resource-Policy "same-site"/);
  }
  assert.match(preview, /Header always set X-Robots-Tag "noindex, nofollow"/);
  assert.doesNotMatch(production, /X-Robots-Tag/);
  assert.ok(preview.includes('RewriteRule ^ https://preview.fresh-tech.uk/%1 [R=301,END,NE]'));
  assert.doesNotMatch(preview, /RewriteRule .* http:\/\//);
  assert.ok(preview.includes('RewriteRule ^(?:\\.netlify(?:/|$)|api(?:/|$)) - [R=503,END]'));
  assert.ok(preview.includes('RewriteCond %{REQUEST_METHOD} !^(?:GET|HEAD)$ [NC]'));
  assert.doesNotMatch(production, /R=503|R=405/);
  assert.ok(preview.indexOf('[R=503,END]') < preview.indexOf('# Ordered legacy redirects'));
  assert.match(production, /Header set Cache-Control "public, max-age=31536000, immutable"/);
  assert.match(production, /%\{REQUEST_URI\} =~ m#\^\/_astro\/#/);
  assert.match(production, /Header set Cache-Control "public, max-age=0, must-revalidate"/);
  assert.doesNotMatch(production, /RewriteCond %\{HTTPS\}/);
  // The only host rule: www to the apex with the path kept, before any other rewrite.
  assert.ok(production.includes('RewriteCond %{HTTP_HOST} ^www\\.fresh-tech\\.uk$ [NC]\nRewriteRule ^ https://fresh-tech.uk%{REQUEST_URI} [R=301,END,NE]'));
  assert.ok(production.indexOf('HTTP_HOST') < production.indexOf('RewriteRule ^server'));
  assert.equal(production.match(/RewriteCond %\{HTTP_HOST\}/g).length, 1);
  assert.doesNotMatch(preview, /RewriteCond %\{HTTP_HOST\} \^www/);
});

test('builds a hash manifest from public files and rejects unsafe or unversioned output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'freshtech-apache-manifest-'));
  assert.ok(resolve(root).startsWith(resolve(tmpdir())));
  try {
    await mkdir(join(root, '_astro'));
    await mkdir(join(root, 'pricing'));
    await writeFile(join(root, 'index.html'), '<h1>Home</h1>');
    await writeFile(join(root, 'pricing', 'index.html'), '<h1>Pricing</h1>');
    await writeFile(join(root, '_astro', 'page.A1b2C3d4.js'), 'export{}');
    const manifest = await createUploadManifest(root);
    assert.deepEqual(manifest.map(({ path }) => path), [
      '_astro/page.A1b2C3d4.js',
      'index.html',
      'pricing/index.html',
    ]);
    assert.ok(manifest.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));

    await writeFile(join(root, '.env'), 'SECRET=not-a-real-secret');
    await assert.rejects(createUploadManifest(root), /refusing hidden output path/);
    await rm(join(root, '.env'));
    await writeFile(join(root, '_astro', 'unversioned.js'), 'export{}');
    await assert.rejects(createUploadManifest(root), /immutable asset is not fingerprinted/);
    await rm(join(root, '_astro', 'unversioned.js'));
    await writeFile(join(root, '_astro', 'logo-fresh-tech.png'), 'synthetic');
    await assert.rejects(createUploadManifest(root), /immutable asset is not fingerprinted/);
    await rm(join(root, '_astro', 'logo-fresh-tech.png'));
    await writeFile(join(root, 'app.config.json'), '{}');
    await assert.rejects(createUploadManifest(root), /configuration or credential-like output/);

    const linkedRoot = `${root}-link`;
    await symlink(root, linkedRoot, 'junction');
    try {
      await assert.rejects(createUploadManifest(linkedRoot), /root must be a real directory/);
    } finally {
      await rm(linkedRoot, { force: true });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails closed when redirect semantics drift', () => {
  assert.throws(
    () => compileApacheStaticConfig(source.replace('to = "/blog"', 'to = "//example.test"'), { mode: 'production' }),
    /destination must be a canonical literal site path/,
  );
  assert.throws(
    () => compileApacheStaticConfig(source.replace('status = 301', 'status = 302'), { mode: 'production' }),
    /only forced 301 redirects/,
  );
  assert.throws(
    () => compileApacheStaticConfig(source.replace('X-Frame-Options = "DENY"', 'X-Frame-Options = "SAMEORIGIN"'), { mode: 'production' }),
    /semantics changed/,
  );
  assert.throws(
    () => compileApacheStaticConfig(source.replace('force = true', 'force = false'), { mode: 'production' }),
    /only forced 301 redirects/,
  );
  assert.throws(
    () => compileApacheStaticConfig(source.replace('  force = true', '  force = true\n  conditions = "unknown"'), { mode: 'production' }),
    /unsupported redirect key/,
  );
  assert.throws(() => compileApacheStaticConfig(source, { mode: 'live' }), /mode must be preview or production/);
});

 test('preserves former client-only industry aliases at the edge', () => {
  const config = parseNetlifyRouting(source);
  for (const [from, to] of [['/industries/engineering', '/industries/manufacturing'], ['/industries/legal', '/industries/solicitors']]) {
    assert.deepEqual(config.redirects.find(rule => rule.from === from), { from, to, status: 301, force: true });
  }
  const output = compileApacheStaticConfig(source, { mode: 'preview' });
  assert.ok(output.includes('RewriteRule ^industries/engineering$ https://preview.fresh-tech.uk/industries/manufacturing [R=301,END,NE]'));
  assert.ok(output.includes('RewriteRule ^industries/legal$ https://preview.fresh-tech.uk/industries/solicitors [R=301,END,NE]'));
});

test('routes the lead endpoint to PHP in production and hides server internals', () => {
  const production = compileApacheStaticConfig(source, { mode: 'production' });
  const route = 'RewriteRule ^api/send-email$ /server/api/send-email.php [END]';
  const deny = 'RewriteRule ^server(?:/|$) - [R=404,END]';
  assert.ok(production.includes(route));
  assert.ok(production.includes(deny));
  assert.ok(production.indexOf(deny) < production.indexOf(route));
  assert.ok(production.indexOf(route) < production.indexOf('# Ordered legacy redirects'));
  assert.equal(production.split('/server/').length, 4);
  const proof = 'RewriteRule ^api/website-(metrics|feedback)$ /server/api/website-proof.php [END]';
  assert.ok(production.includes(proof));
  assert.ok(production.indexOf(deny) < production.indexOf(proof));
  for (const path of ['api/website-metrics', 'api/website-feedback']) assert.match(path, /^api\/website-(metrics|feedback)$/);
  for (const path of ['api/website-private', 'api/website-metrics/', 'api/website-feedback.php']) assert.doesNotMatch(path, /^api\/website-(metrics|feedback)$/);
  const denyPattern = /^server(?:\/|$)/;
  for (const path of ['server', 'server/', 'server/api/send-email.php', 'server/tests/send-email-test.php']) assert.match(path, denyPattern);
  for (const path of ['servers', 'services/server']) assert.doesNotMatch(path, denyPattern);
  assert.match('api/send-email', /^api\/send-email$/);
  for (const path of ['api/send-email/', 'api/send-email.php', 'api/send-emailx']) assert.doesNotMatch(path, /^api\/send-email$/);
});

test('preview keeps the lead endpoint disabled unless explicitly enabled', () => {
  const preview = compileApacheStaticConfig(source, { mode: 'preview' });
  assert.doesNotMatch(preview, /send-email/);
  assert.doesNotMatch(preview, /website-proof\.php/);
  assert.ok(preview.includes('RewriteRule ^server(?:/|$) - [R=404,END]'));
  assert.ok(preview.includes('# Preserve the isolated preview: no endpoint execution or form submissions.'));

  const enabled = compileApacheStaticConfig(source, { mode: 'preview', previewSendEmail: true });
  const route = enabled.indexOf('RewriteRule ^api/send-email$ /server/api/send-email.php [END]');
  assert.ok(route > enabled.indexOf('RewriteRule ^server(?:/|$) - [R=404,END]'));
  assert.ok(route < enabled.indexOf('[R=503,END]'));
  assert.ok(route < enabled.indexOf('RewriteRule ^ - [R=405,END]'));
  assert.match(enabled, /X-Robots-Tag "noindex, nofollow"/);

  assert.throws(() => compileApacheStaticConfig(source, { mode: 'production', previewSendEmail: true }), /preview mode only/);
  assert.throws(() => compileApacheStaticConfig(source, { mode: 'preview', previewSendEmail: 'yes' }), /must be a boolean/);
});
