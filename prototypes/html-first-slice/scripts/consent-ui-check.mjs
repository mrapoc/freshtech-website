// Run against a freshly built local Astro preview. All vendor requests are mocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('Explicit sandbox Chrome required');
const port = await new Promise((done, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const port = probe.address().port;
    probe.close(error => error ? reject(error) : done(port));
  });
});
const base = `http://127.0.0.1:${port}/services/managed-it-support/`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: resolve(import.meta.dirname, '..'),
  env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '0' },
  stdio: 'ignore',
});
let browser;
const vendors = new Set(['https://www.googletagmanager.com/gtag/js?id=G-XB492EFNKW', 'https://www.clarity.ms/tag/urhwe2bbi1']);
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
try {
  for (let attempt = 0; attempt < 360; attempt++) {
    if (server.exitCode !== null) throw new Error(`Owned preview exited: ${server.exitCode}`);
    try { if ((await fetch(base)).ok) break; } catch {}
    if (attempt === 359) throw new Error('Owned preview did not become ready within 90 seconds');
    await delay(250);
  }
  browser = await chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  for (const blocked of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const hits = [];
    const localScripts = [];
    const errors = [];
    await context.route('**/*', route => {
      const url = route.request().url();
      if (new URL(url).origin === new URL(base).origin) {
        if (route.request().resourceType() === 'script') localScripts.push(new URL(url).pathname);
        return route.continue();
      }
      if (isBlockmarkBadge(url)) return route.fulfill(BLOCKMARK_STUB);
      if (vendors.has(url)) {
        hits.push(url);
        return route.fulfill({ contentType: 'text/javascript', body: 'window.__vendorCount=(window.__vendorCount||0)+1;' });
      }
      return route.abort();
    });
    if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    check(await page.locator('[data-cookie-banner]').isVisible(), 'fresh-visit banner was hidden at DOMContentLoaded');
    check(!localScripts.some(path => path.includes('live-metrics')), 'service loaded pricing-only live metrics');
    check(hits.length === 0, 'vendors loaded before consent');
    await page.locator('[data-consent="accept"]').click();
    await page.waitForTimeout(3300);
    check(!localScripts.some(path => path.includes('live-metrics')), 'service loaded pricing-only live metrics after startup');
    check(hits.length === (blocked ? 0 : 2), 'incorrect vendor count after consent');
    const settings = page.locator('[data-cookie-settings]').first();
    await settings.click();
    check(await page.locator('[data-cookie-dialog]').evaluate(el => el.open), 'settings dialog did not open');
    if (blocked) await page.locator('[data-dialog-reject]').click();
    else await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('[data-dialog-reject]').click()]);
    if (!blocked) {
      await page.waitForFunction(() => document.querySelector('[data-cookie-dialog]') && !document.querySelector('[data-cookie-dialog]').open && JSON.parse(localStorage.getItem('ft-cookie-consent-v1')).analytics === false);
      await page.waitForTimeout(3300);
      check(hits.length === 2, 'vendors reloaded after withdrawal');
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('ft:open-cookie-settings')));
      check(await page.locator('[data-cookie-dialog]').evaluate(el => el.open), 'external settings event did not open dialog');
    }
    check(errors.length === 0, `page errors: ${errors.join(', ')}`);
    await context.close();
  }
  console.log(`Consent UI integration: ${checks} checks passed`);
} finally {
  await browser?.close();
  server.kill();
}
