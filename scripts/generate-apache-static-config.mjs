import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PUBLIC_EXTENSIONS = new Set([
  '.avif', '.css', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json', '.mjs',
  '.otf', '.pdf', '.png', '.svg', '.ttf', '.txt', '.webmanifest', '.webp', '.woff', '.woff2', '.xml',
]);

// The site needs no inline script: every executable script is an external same-origin module (enforced by
// prototypes/html-first-slice/scripts/production-output-check.mjs), so
// script-src omits 'unsafe-inline'. Third parties are limited to Cloudinary
// media, consent-gated GA4 and Clarity, the helpdesk metrics feed and Google
// DNS-over-HTTPS for the email checker, and frames only from Blockmark's
// certificate registry (the Cyber Essentials badge). Inline styles remain allowed: pages
// inline their stylesheets and use style attributes for layout tokens.
export const STATIC_SITE_HEADERS = Object.freeze({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://helpdesk.fresh-tech.uk https://dns.google",
    "media-src 'self' https://res.cloudinary.com",
    "frame-src https://registry.blockmarktech.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; '),
  // Site isolation: no cross-origin window keeps a handle on our pages, and
  // other sites cannot embed our resources. same-site still allows subdomains.
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
});

const ROUTING_KEYS = ['redirects', 'headers', 'cacheControl'];
const REDIRECT_KEYS = new Set(['from', 'to', 'query']);

/**
 * Parse and validate hosting/routing.json: ordered permanent redirects, the
 * global security headers and the two Cache-Control policies. Every redirect
 * is a 301. Order matters: Apache applies the first match, so specific
 * sources must come before wildcards that would also match them.
 */
export function parseRouting(source) {
  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    throw new Error(`routing source is not valid JSON: ${error.message}`);
  }
  if (!config || typeof config !== 'object' || Array.isArray(config) || Object.keys(config).join(',') !== ROUTING_KEYS.join(',')) {
    throw new Error(`routing source must contain exactly ${ROUTING_KEYS.join(', ')}`);
  }
  const { redirects, headers, cacheControl } = config;
  if (!Array.isArray(redirects) || !redirects.length) throw new Error('redirects must be a non-empty array');
  for (const [index, redirect] of redirects.entries()) {
    const label = `redirect ${index + 1}`;
    if (!redirect || typeof redirect !== 'object' || Array.isArray(redirect)) throw new Error(`${label}: must be an object`);
    for (const key of Object.keys(redirect)) if (!REDIRECT_KEYS.has(key)) throw new Error(`${label}: unsupported key ${key}`);
    if (typeof redirect.from !== 'string' || typeof redirect.to !== 'string') {
      throw new Error(`${label}: from and to are required`);
    }
    if (!/^\/(?:[a-z0-9.-]+(?:\/[a-z0-9.-]+)*)?$/.test(redirect.to) || redirect.to.split('/').some(part => part === '.' || part === '..')) {
      throw new Error(`${label}: destination must be a canonical literal site path`);
    }
    if ('query' in redirect && !/^[A-Za-z0-9_-]+$/.test(redirect.query)) throw new Error(`${label}: query must be one parameter name`);
  }

  const queryContracts = [
    ['wordfence_lh', '/'],
    ['id', '/'],
    ['s', '/blog'],
  ];
  for (const [index, [parameter, destination]] of queryContracts.entries()) {
    const redirect = redirects[index];
    if (redirect?.from !== '/' || redirect.to !== destination || redirect.query !== parameter) {
      throw new Error(`redirect ${index + 1}: WordPress query redirect contract changed`);
    }
  }
  if (redirects.slice(queryContracts.length).some((redirect) => 'query' in redirect)) {
    throw new Error('only the first three redirects may contain query matchers');
  }

  const strings = (value, label) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length) throw new Error(`${label} must be a non-empty object`);
    for (const [name, text] of Object.entries(value)) {
      if (!/^[A-Za-z0-9-]+$/.test(name) || typeof text !== 'string' || !text) throw new Error(`${label}.${name} must be a non-empty string`);
    }
  };
  strings(headers, 'headers');
  if (Object.keys(headers).some(name => Object.hasOwn(STATIC_SITE_HEADERS, name))) {
    throw new Error('headers must not set the policies owned by STATIC_SITE_HEADERS');
  }
  strings(cacheControl, 'cacheControl');
  if (Object.keys(cacheControl).sort().join(',') !== 'html,immutable') throw new Error('cacheControl must contain exactly html and immutable');
  return config;
}

function apacheEscape(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function routePattern(from) {
  if (!from.startsWith('/')) throw new Error(`unsupported redirect source: ${from}`);
  return from
    .slice(1)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
}

function queryCondition(name) {
  return `RewriteCond %{QUERY_STRING} (^|&)${name}=[^&]*(&|$) [NC]`;
}

/** Compile reviewed routing into an Apache 2.4 per-directory configuration. */
export function compileApacheStaticConfig(source, { mode, previewSendEmail = false }) {
  if (!['preview', 'production'].includes(mode)) throw new Error('mode must be preview or production');
  if (typeof previewSendEmail !== 'boolean') throw new Error('previewSendEmail must be a boolean');
  if (previewSendEmail && mode !== 'preview') throw new Error('previewSendEmail applies to preview mode only');
  const config = parseRouting(source);
  // The 20i origin sees HTTP behind its TLS proxy. Never derive redirect scheme
  // or authority from that request, or HTTPS clients receive downgrade hops.
  const redirectOrigin = mode === 'preview' ? 'https://preview.fresh-tech.uk' : 'https://fresh-tech.uk';

  const sourceHash = createHash('sha256').update(source).digest('hex');
  const permanent = config.redirects;
  const globalHeaders = config.headers;
  const assetCache = config.cacheControl.immutable;
  const htmlCache = config.cacheControl.html;

  const lines = [
    '# Generated by scripts/generate-apache-static-config.mjs. Do not edit.',
    `# Source hosting/routing.json SHA-256: ${sourceHash}`,
    '# HTTPS redirection is owned by the 20i Force HTTPS control.',
    '# There is no catch-all fallback, so unknown paths return 404.',
    '',
    'Options -Indexes -MultiViews',
    'DirectoryIndex index.html',
    'DirectorySlash Off',
    'ErrorDocument 404 "Not found"',
    '',
    'RewriteEngine On',
    '',
  ];
  if (mode === 'production') {
    lines.push(
      '# One canonical host: 20i redirects cannot keep the path, so www goes to the apex here.',
      'RewriteCond %{HTTP_HOST} ^www\\.fresh-tech\\.uk$ [NC]',
      'RewriteRule ^ https://fresh-tech.uk%{REQUEST_URI} [R=301,END,NE]',
    );
  }
  lines.push(
    '# PHP endpoint internals are never directly reachable. The rewrite below is',
    '# the only route in, and END stops these rules re-running on that rewrite.',
    'RewriteRule ^server(?:/|$) - [R=404,END]',
  );
  if (mode === 'production' || previewSendEmail) {
    lines.push(
      '# Lead email endpoint. The PHP script enforces method, origin, size and rate limits.',
      'RewriteRule ^api/send-email$ /server/api/send-email.php [END]',
    );
  }
  if (mode === 'production') {
    lines.push(
      '# Anonymous public proof. Fixed paths; PHP never forwards visitor credentials.',
      'RewriteRule ^api/website-(metrics|feedback)$ /server/api/website-proof.php [END]',
      'RewriteRule ^api/google-rating$ /server/api/google-rating.php [END]',
    );
  }
  if (mode === 'preview') {
    lines.push(
      previewSendEmail
        ? '# Preserve the isolated preview: only the explicitly enabled lead endpoint runs.'
        : '# Preserve the isolated preview: no endpoint execution or form submissions.',
      'RewriteRule ^(?:\\.netlify(?:/|$)|api(?:/|$)) - [R=503,END]',
      'RewriteCond %{REQUEST_METHOD} !^(?:GET|HEAD)$ [NC]',
      'RewriteRule ^ - [R=405,END]',
    );
  }
  lines.push('');
  lines.push('# Ordered legacy redirects from hosting/routing.json.');

  permanent.forEach((redirect, index) => {
    lines.push(`# ${index + 1}: ${redirect.from} -> ${redirect.to}`);
    if (redirect.query) lines.push(queryCondition(redirect.query));
    const flags = redirect.query ? 'R=301,END,NE,QSD' : 'R=301,END,NE';
    lines.push(`RewriteRule ^${routePattern(redirect.from)}$ ${redirectOrigin}${redirect.to} [${flags}]`);
  });

  lines.push(
    '',
    '# Canonicalise remaining browser requests after exact legacy redirects.',
    'RewriteCond %{THE_REQUEST} "\\s/+([^/?\\s][^?\\s]*?)/+(?:[?\\s])" [NC]',
    `RewriteRule ^ ${redirectOrigin}/%1 [R=301,END,NE]`,
    '',
    '# Serve /route from /route/index.html without changing the browser URL.',
    'RewriteCond %{REQUEST_FILENAME}/index.html -f',
    'RewriteRule ^(.+)$ /$1/index.html [END]',
    '',
    '# Security headers from hosting/routing.json, with the',
    '# static-site Content-Security-Policy and site-isolation headers.',
  );
  for (const [name, value] of Object.entries({ ...globalHeaders, ...STATIC_SITE_HEADERS })) {
    lines.push(`Header always set ${name} "${apacheEscape(value)}"`);
  }
  if (mode === 'preview') lines.push('Header always set X-Robots-Tag "noindex, nofollow"');

  lines.push(
    '',
    '# Cache generated HTML conservatively and Vite fingerprinted assets immutably.',
    '<FilesMatch "(^|/)index\\.html$">',
    `  Header set Cache-Control "${apacheEscape(htmlCache)}"`,
    '</FilesMatch>',
    '<If "%{REQUEST_URI} =~ m#^/assets/#">',
    `  Header set Cache-Control "${apacheEscape(assetCache)}"`,
    '</If>',
    '<If "%{REQUEST_URI} =~ m#^/_astro/#">',
    `  Header set Cache-Control "${apacheEscape(assetCache)}"`,
    '</If>',
    '# Copied font paths are not content-hashed: cache for one day, then revalidate.',
    '<If "%{REQUEST_URI} =~ m#^/fonts/.*\\.(woff2?|ttf|otf)$#">',
    '  Header set Cache-Control "public, max-age=86400, must-revalidate"',
    '</If>',
    '# Local pictures and icons may be replaced at stable URLs: revalidate after one day.',
    '<If "%{REQUEST_URI} =~ m#^/(images|icons)/.*\\.(avif|gif|ico|jpe?g|png|svg|webp)$#">',
    '  Header set Cache-Control "public, max-age=86400, must-revalidate"',
    '</If>',
    '',
  );
  return lines.join('\n');
}

function publicPath(relativePath) {
  return relativePath.split(sep).join('/');
}

function assertSafePublicFile(path) {
  const segments = path.split('/');
  const name = segments.at(-1);
  if (segments.some((segment) => segment.startsWith('.'))) {
    throw new Error(`refusing hidden output path: ${path}`);
  }
  if (!PUBLIC_EXTENSIONS.has(extname(name).toLowerCase())) {
    throw new Error(`refusing unsupported public file type: ${path}`);
  }
  if (/(^|[-_.])(credentials?|secrets?|private[-_]?key)([-_.]|$)/i.test(name) || /(^|\.)config\./i.test(name)) {
    throw new Error(`refusing configuration or credential-like output: ${path}`);
  }
  if ((path.startsWith('assets/') || path.startsWith('_astro/')) && !/[.-][A-Za-z0-9_-]{8}\.[^.]+$/.test(name)) {
    throw new Error(`immutable asset is not fingerprinted: ${path}`);
  }
}

/** Inventory only reviewed public file types. The generated .htaccess is added by the CLI. */
export async function createUploadManifest(siteDirectory) {
  const requestedRoot = resolve(siteDirectory);
  const rootStat = await lstat(requestedRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error('static output root must be a real directory, not a file or symbolic link');
  }
  const root = await realpath(requestedRoot);
  const entries = [];

  async function visit(directory) {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const child of children) {
      const absolute = resolve(directory, child.name);
      const path = publicPath(relative(root, absolute));
      if (!path || path === '..' || path.startsWith('../')) throw new Error(`output escaped site directory: ${path}`);
      if (child.isSymbolicLink()) throw new Error(`refusing symbolic link in static output: ${path}`);
      if (child.isDirectory()) await visit(absolute);
      else if (child.isFile()) {
        assertSafePublicFile(path);
        const content = await readFile(absolute);
        entries.push({ path, bytes: content.byteLength, sha256: createHash('sha256').update(content).digest('hex') });
      } else throw new Error(`refusing special file in static output: ${path}`);
    }
  }

  await visit(root);
  if (!entries.some(({ path }) => path === 'index.html')) throw new Error('static output must contain index.html');
  return entries;
}

async function main() {
  const args = process.argv.slice(2);
  const valueFor = (flag) => {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
  };
  const mode = valueFor('--mode');
  const sourcePath = valueFor('--source') ?? resolve(import.meta.dirname, '..', 'hosting', 'routing.json');
  const outputPath = valueFor('--out');
  const siteDirectory = valueFor('--site-dir');
  const manifestPath = valueFor('--manifest-out');
  const previewSendEmail = args.includes('--enable-preview-send-email');
  if (!mode || !outputPath || !siteDirectory || !manifestPath || args.some((arg) => arg.startsWith('--') && !['--mode', '--source', '--out', '--site-dir', '--manifest-out', '--enable-preview-send-email'].includes(arg))) {
    throw new Error('usage: node scripts/generate-apache-static-config.mjs --mode preview|production --site-dir <static-output> --out <path> --manifest-out <path> [--source hosting/routing.json] [--enable-preview-send-email]');
  }

  const source = await readFile(resolve(sourcePath), 'utf8');
  const output = compileApacheStaticConfig(source, { mode, previewSendEmail });
  const files = await createUploadManifest(siteDirectory);
  const resolvedOutput = resolve(outputPath);
  await mkdir(dirname(resolvedOutput), { recursive: true });
  await writeFile(resolvedOutput, output, 'utf8');
  const manifest = {
    schemaVersion: 1,
    mode,
    files: [
      { path: '.htaccess', bytes: Buffer.byteLength(output), sha256: createHash('sha256').update(output).digest('hex'), generated: true },
      ...files,
    ],
  };
  const resolvedManifest = resolve(manifestPath);
  await mkdir(dirname(resolvedManifest), { recursive: true });
  await writeFile(resolvedManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`Wrote ${resolvedOutput} and ${resolvedManifest} (${manifest.files.length} files)\n`);
}

if (import.meta.url === pathToFileURL(fileURLToPath(import.meta.url)).href && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
