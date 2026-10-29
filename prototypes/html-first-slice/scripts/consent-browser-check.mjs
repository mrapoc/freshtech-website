// Sandbox browser check for src/scripts/consent.ts. Serves the synthetic fixture
// from test-fixtures/consent-page.html on 127.0.0.1 and intercepts every vendor
// request; nothing reaches real analytics endpoints. Env: PLAYWRIGHT_MODULE,
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (same as browser-check.mjs).
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { stripTypeScriptTypes } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');

const projectDir = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(projectDir, 'test-fixtures/consent-page.html'), 'utf8');
const js = stripTypeScriptTypes(await readFile(resolve(projectDir, 'src/scripts/consent.ts'), 'utf8'));
const server = createServer((req, res) => {
  if (req.url === '/consent.js') res.writeHead(200, { 'content-type': 'text/javascript' }).end(js);
  else res.writeHead(200, { 'content-type': 'text/html' }).end(html);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const baseUrl = `http://127.0.0.1:${server.address().port}/`;
const KEY = 'ft-cookie-consent-v1';
const GA_URL = 'https://www.googletagmanager.com/gtag/js?id=G-XB492EFNKW';
const CLARITY_URL = 'https://www.clarity.ms/tag/urhwe2bbi1';
const failures = [];
let assertions = 0;
const check = (c, m) => { assertions++; if (!c) failures.push(m); };

const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
async function open(init) {
  const context = await browser.newContext();
  const vendor = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(baseUrl)) return route.continue();
    vendor.push(url);
    if (url === GA_URL || url === CLARITY_URL) {
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__vendorHits=(window.__vendorHits||0)+1;' });
    }
    return route.abort();
  });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  return { context, page, vendor };
}

try {
  // 1. No decision: nothing loads, accept arms, first click fires exactly GA + Clarity.
  {
    const { context, page, vendor } = await open();
    check(vendor.length === 0, 'fresh visit made a vendor request');
    check((await page.evaluate(() => window.__autoArmed)) === false, 'fresh visit auto-armed');
    await page.click('#accept');
    check((await page.evaluate(() => JSON.parse(localStorage.getItem('ft-cookie-consent-v1')).analytics)) === true, 'accept not stored');
    check((await page.evaluate(() => window.__events.at(-1)[0])) === 'consent', 'consent event missing');
    check(vendor.length === 0, 'accept click loaded vendors before a later interaction');
    await page.mouse.click(5, 5); // first interaction after arm
    await page.waitForFunction(() => window.__vendorHits === 2, null, { timeout: 5000 }).catch(() => failures.push('vendor stubs did not execute'));
    check(vendor.length === 2 && vendor.includes(GA_URL) && vendor.includes(CLARITY_URL), `unexpected vendor set ${JSON.stringify(vendor)}`);
    check(await page.evaluate(() => [...document.scripts].filter((s) => s.async && s.src.includes('clarity.ms')).length === 1), 'clarity tag not async');
    // 2. Withdraw after load: cookies cleared, page reloads, nothing re-arms.
    await page.evaluate(() => { document.cookie = '_ga=GA1.1.1; path=/'; document.cookie = '_clck=abc; path=/'; window.__marker = 1; });
    // Cancel through the controller: a real click is itself one of the capture-phase
    // analytics triggers and would correctly load before the button handler runs.
    await page.evaluate(() => window.__consent.setConsent(false));
    await page.waitForFunction(() => window.__marker === undefined, null, { timeout: 5000 }).catch(() => failures.push('reject after load did not reload'));
    await page.waitForLoadState('networkidle');
    check(!(await page.evaluate(() => document.cookie)).match(/_ga|_clck/), 'vendor cookies survived withdrawal');
    check((await page.evaluate(() => window.__autoArmed)) === false, 'stored denial auto-armed');
    check(vendor.length === 2, 'vendor request after withdrawal');
    await context.close();
  }
  // 3. Returning opt-in auto-arms and fires on the 3000ms timeout without interaction.
  {
    const { context, page, vendor } = await open(`localStorage.setItem('${KEY}', JSON.stringify({ analytics: true, ts: 1 }))`);
    check((await page.evaluate(() => window.__autoArmed)) === true, 'stored opt-in did not auto-arm');
    await page.waitForFunction(() => window.__vendorHits === 2, null, { timeout: 6000 }).catch(() => failures.push('timeout path did not load vendors'));
    check(vendor.length === 2, 'timeout path vendor count');
    // Pending-only reject: cancel + no reload.
    await context.close();
  }
  // 4. Reject while pending cancels without reload.
  {
    const { context, page, vendor } = await open(`localStorage.setItem('${KEY}', JSON.stringify({ analytics: true, ts: 1 }))`);
    await page.evaluate(() => { window.__marker = 1; });
    // A synthetic controller call isolates cancellation while still pending.
    // Clicking is itself a configured interaction and would fire first in capture.
    await page.evaluate(() => window.__consent.setConsent(false));
    await page.waitForTimeout(3500);
    check((await page.evaluate(() => window.__marker)) === 1, 'pending reject reloaded the page');
    check(vendor.length === 0, 'pending reject still loaded vendors');
    await context.close();
  }
  // 5. Blocked storage fails closed, open-settings event still works.
  {
    const { context, page, vendor } = await open(`Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } })`);
    await page.click('#accept');
    await page.mouse.click(5, 5);
    await page.waitForTimeout(3500);
    check(vendor.length === 0, 'blocked storage loaded vendors');
    await page.click('#settings');
    check((await page.evaluate(() => window.__events.some((e) => e[0] === 'open-settings'))), 'open-settings event missing');
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`${assertions} assertions, ${failures.length} failures`);
if (failures.length) { failures.forEach((f) => console.error(` - ${f}`)); process.exit(1); }
