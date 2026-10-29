import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('Explicit sandbox Chrome required');

const projectDir = resolve(import.meta.dirname, '..');
const port = await new Promise((done, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const selected = probe.address().port;
    probe.close(error => error ? reject(error) : done(selected));
  });
});
const origin = `http://127.0.0.1:${port}`;
const pageUrl = `${origin}/services/managed-it-support/`;
const expectedFonts = new Set([
  '/fonts/archivo-v25-latin.woff2',
  '/fonts/archivo-v25-latin-ext.woff2',
  '/fonts/archivo-narrow-v35-latin.woff2',
  '/fonts/archivo-narrow-v35-latin-ext.woff2',
  '/fonts/bungee-latin.woff2',
  '/fonts/bungee-latin-ext.woff2',
]);
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: projectDir,
  env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });

let browser;
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const dimensions = page => page.evaluate(() => {
  const heading = document.querySelector('h1').getBoundingClientRect();
  return {
    heading: [heading.x, heading.y, heading.width, heading.height],
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
  };
});

try {
  const readyDeadlineMs = 90_000;
  const readyDeadline = Date.now() + readyDeadlineMs;
  let ready = false;
  while (Date.now() < readyDeadline) {
    if (server.exitCode !== null) throw new Error(`Owned preview exited ${server.exitCode}: ${serverLog.trim().slice(-500) || '[no output]'}`);
    try { if ((await fetch(pageUrl)).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) {
    const tail = serverLog.trim().slice(-500);
    throw new Error(`Owned preview did not become ready within ${readyDeadlineMs / 1000} seconds${tail ? `: ${tail}` : ' (it produced no output, so this is a startup timeout rather than a crash)'}`);
  }

  browser = await chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  for (const viewport of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const localFonts = new Set();
    const googleFonts = [];
    const errors = [];
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (/^\/api\/website-(metrics|feedback)$/.test(url.pathname) && url.hostname === '127.0.0.1') return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      if (url.origin === origin) return route.continue();
      if (isBlockmarkBadge(url)) return route.fulfill(BLOCKMARK_STUB);
      if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') googleFonts.push(url.href);
      if (request.resourceType() === 'image') return route.fulfill({ status: 200, contentType: 'image/png', body: transparentPng });
      return route.abort();
    });
    const page = await context.newPage();
    page.on('requestfinished', request => {
      const url = new URL(request.url());
      if (url.origin === origin && url.pathname.endsWith('.woff2')) localFonts.add(url.pathname);
    });
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const welshLoads = await page.evaluate(async () => {
      const probes = [
        ['Archivo', '400'],
        ['Archivo Narrow', '600'],
        ['Bungee', '400'],
      ];
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-10000px;top:0;white-space:nowrap;';
      for (const [family, weight] of probes) {
        const span = document.createElement('span');
        span.textContent = 'Cymru ŵ ŷ';
        span.style.fontFamily = `'${family}'`;
        span.style.fontWeight = weight;
        span.style.fontSize = '32px';
        host.append(span);
      }
      document.body.append(host);
      const loaded = await Promise.all(probes.map(([family, weight]) => document.fonts.load(`${weight} 32px "${family}"`, 'Cymru ŵ ŷ')));
      host.remove();
      return loaded.map(faces => faces.length > 0);
    });
    await page.waitForTimeout(100);
    const before = await dimensions(page);
    await page.waitForTimeout(300);
    const after = await dimensions(page);

    check(googleFonts.length === 0, `${viewport.name}: requested Google Fonts: ${googleFonts.join(', ')}`);
    check(localFonts.size === expectedFonts.size && [...expectedFonts].every(path => localFonts.has(path)), `${viewport.name}: local font requests differ: ${[...localFonts].join(', ')}`);
    check(welshLoads.every(Boolean), `${viewport.name}: a Welsh Latin-ext font face did not load`);
    check(await page.evaluate(() => document.fonts.status === 'loaded'), `${viewport.name}: fonts did not settle`);
    check(after.scrollWidth <= after.clientWidth, `${viewport.name}: local fonts caused horizontal overflow`);
    check(before.heading.every((value, index) => Math.abs(value - after.heading[index]) < 0.25), `${viewport.name}: heading geometry changed after fonts settled`);
    check(before.scrollWidth === after.scrollWidth && before.scrollHeight === after.scrollHeight, `${viewport.name}: document geometry changed after fonts settled`);
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  console.log(`Self-hosted font integration: ${checks} checks passed`);
} finally {
  await browser?.close();
  server.kill();
}
