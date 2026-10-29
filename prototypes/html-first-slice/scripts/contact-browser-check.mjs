import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

const playwrightModule = process.env.PLAYWRIGHT_MODULE;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!playwrightModule || !executablePath) throw new Error('Set PLAYWRIGHT_MODULE and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for the local browser runtime.');
const runtime = await import(pathToFileURL(playwrightModule).href);
const { chromium } = runtime.default ?? runtime;
const port = 4337;
const origin = `http://127.0.0.1:${port}`;
const dist = process.env.CONTACT_TEST_DIST
  ? resolve(process.env.CONTACT_TEST_DIST)
  : fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', origin).pathname);
    let path = join(dist, pathname.replace(/^\/+/, ''));
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream' });
    createReadStream(path).pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });

const browser = await chromium.launch({ executablePath, headless: true, chromiumSandbox: true });
try {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const externalRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.route('**/*', async route => {
    const requestUrl = new URL(route.request().url());
    if (isBlockmarkBadge(requestUrl)) { await route.fulfill(BLOCKMARK_STUB); return; }
    if (requestUrl.origin !== origin) { externalRequests.push(requestUrl.href); await route.fulfill({ status: 204, body: '' }); return; }
    await route.continue();
  });
  let releaseFirst;
  let submissions = 0;
  const bodies = [];
  await page.route('**/api/send-email', async route => {
    submissions += 1; bodies.push(route.request().postDataJSON());
    if (submissions === 1) { await new Promise(resolve => { releaseFirst = resolve; }); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false }) }); }
    else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto(`${origin}/contact`, { waitUntil: 'domcontentloaded' });
  if (await page.locator('meta[name="robots"]').getAttribute('content') !== 'noindex, nofollow') throw new Error('Contact preview lost noindex.');
  const bookingLinks = page.locator(`a[href="https://calendly.com/fresh-sam/20min"]`);
  if (await bookingLinks.count() !== 2) throw new Error('Expected both source booking links.');
  for (const link of await bookingLinks.all()) {
    if (await link.getAttribute('target') !== '_blank' || await link.getAttribute('rel') !== 'noopener noreferrer') throw new Error('External booking link lost its new-tab safety label contract.');
  }
  await page.locator('[data-contact-form].is-progressive').waitFor({ state: 'attached' });
  if (await page.locator('[data-contact-form] .js-note').isVisible()) throw new Error('JS note still visible after form enhancement.');
  // AutoFill fills rendered fields, even off-screen ones, so the spam trap must not render at all.
  if (await page.locator('#contact-hp').evaluate(input => input.getClientRects().length) !== 0) throw new Error('Spam trap field is rendered and can be autofilled.');
  await page.locator('[data-contact-submit]').click();
  if (submissions !== 0) throw new Error('Native validation allowed an empty submission.');
  await page.locator('#contact-name').fill('Synthetic Person');
  await page.locator('#contact-email').fill('synthetic@example.test');
  await page.locator('#contact-phone').fill('01584 000 000');
  await page.locator('#contact-message').fill('Synthetic browser journey. No real delivery.');
  await page.locator('input[name="privacyConsent"]').check();
  await page.locator('[data-contact-submit]').focus(); await page.keyboard.press('Enter');
  await page.getByText('Sending…').waitFor();
  if (!(await page.locator('[data-contact-submit]').isDisabled())) throw new Error('Submit was not disabled while pending.');
  releaseFirst();
  await page.locator('[data-contact-error]:visible').waitFor();
  if (await page.locator('#contact-name').inputValue() !== 'Synthetic Person' || await page.locator('#contact-message').inputValue() !== 'Synthetic browser journey. No real delivery.') throw new Error('Values were not retained after failure.');
  if (await page.locator('[data-contact-submit]').isDisabled() || await page.locator('[data-submit-label]').textContent() !== 'Send message') throw new Error('Pending state did not clear after failure.');
  await page.locator('[data-contact-retry]').click(); await page.locator('[data-contact-submit]').click();
  await page.locator('[data-contact-success]:visible').waitFor();
  await page.getByRole('heading', { name: 'Thanks. Your message has been submitted.' }).waitFor();
  if (await page.locator('[data-contact-form]').isVisible()) throw new Error('Form still visible after success.');
  if (submissions !== 2 || bodies.some(body => body.name !== 'Synthetic Person' || body.honeypot !== '')) throw new Error('Unexpected synthetic endpoint payload.');
  await page.locator('[data-contact-another]').click();
  if (await page.locator('#contact-name').inputValue() !== '') throw new Error('Send another did not reset the form.');
  const evidence = join(tmpdir(), 'freshtech-contact-browser'); await mkdir(evidence, { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: join(evidence, 'desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 }); await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: join(evidence, 'phone.png'), fullPage: true });
  if (await page.locator('body').evaluate(element => element.scrollWidth > element.clientWidth)) throw new Error('Contact page overflows horizontally at 360px.');
  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
  console.log(JSON.stringify({ submissions, externalRequestsBlocked: externalRequests.length, evidence }));
  await context.close();
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
