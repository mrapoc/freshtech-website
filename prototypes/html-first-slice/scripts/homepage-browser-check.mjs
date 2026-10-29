import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');
const projectDir = resolve(import.meta.dirname, '..');
const port = await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.unref();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    if (!address || typeof address === 'string') return reject(new Error('Could not reserve preview port'));
    probe.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: projectDir, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ASTRO_PREVIEW_BACKGROUND: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });

try {
  const readyDeadlineMs = 90_000;
  const readyDeadline = Date.now() + readyDeadlineMs;
  let ready = false;
  while (Date.now() < readyDeadline) {
    if (server.exitCode !== null) throw new Error(`Preview exited ${server.exitCode}: ${serverLog.trim().slice(-500) || '[no output]'}`);
    try { if ((await fetch(baseUrl)).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) {
    const tail = serverLog.trim().slice(-500);
    throw new Error(`Preview did not become ready within ${readyDeadlineMs / 1000} seconds${tail ? `: ${tail}` : ' (it produced no output, so this is a startup timeout rather than a crash)'}`);
  }
  const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const failures = [];
  let assertions = 0;
  const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
  const sectionOrder = ['hero', 'reviews', 'services', 'comparison', 'pricing', 'process', 'cases', 'sectors', 'areas', 'faq', 'final'];
  const viewports = [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }];
  await mkdir(resolve(projectDir, 'evidence', 'homepage-browser'), { recursive: true });

  const open = async (viewport, javaScriptEnabled = true) => {
    const context = await browser.newContext({ viewport, javaScriptEnabled });
    const page = await context.newPage();
    const errors = [];
    const external = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (/^\/api\/(website-(metrics|feedback)|google-rating)$/.test(url.pathname)) route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      else if (url.hostname === '127.0.0.1') route.continue();
      else if (isBlockmarkBadge(url)) route.fulfill(BLOCKMARK_STUB);
      else if (url.hostname === 'res.cloudinary.com') {
        external.push(url.hostname);
        route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3" />' });
      } else if (url.hostname === 'helpdesk.fresh-tech.uk') {
        external.push(url.hostname);
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ AverageResponseTimeLast30DaysMinutes: 4.2, CallWaitTimeInMinutes: 0.5, LatestFResponseDate: '2026-09-16T10:00:00Z' }]),
        });
      } else { external.push(url.hostname); route.abort(); }
    });
    const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
    return { context, page, errors, external, response };
  };

  const checkDelayedFontWrap = async width => {
    let releaseFonts;
    const fontGate = new Promise(resolveGate => { releaseFonts = resolveGate; });
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (/^\/api\/(website-(metrics|feedback)|google-rating)$/.test(url.pathname)) { await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); }
      else if (url.hostname === '127.0.0.1') {
        if (url.pathname.startsWith('/fonts/')) await fontGate;
        await route.continue();
      } else if (isBlockmarkBadge(url)) {
        await route.fulfill(BLOCKMARK_STUB);
      } else if (url.hostname === 'res.cloudinary.com') {
        await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3" />' });
      } else if (url.hostname === 'helpdesk.fresh-tech.uk') {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      } else await route.abort();
    });
    const geometry = () => page.evaluate(() => {
      const heading = document.querySelector('.home-hero h1').getBoundingClientRect();
      const actions = document.querySelector('.home-actions').getBoundingClientRect();
      return {
        headingHeight: heading.height,
        actionsTop: actions.top,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        fontStatus: document.fonts.status,
      };
    });
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const before = await geometry();
      check(before.fontStatus === 'loading', `${width}px delayed font: fonts loaded before fallback geometry was captured`);
      releaseFonts();
      await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))));
      const after = await geometry();
      check(after.fontStatus === 'loaded', `${width}px delayed font: fonts did not finish loading`);
      check(Math.abs(after.actionsTop - before.actionsTop) <= 1, `${width}px delayed font: actions moved ${after.actionsTop - before.actionsTop}px (heading ${before.headingHeight}px to ${after.headingHeight}px)`);
      check(before.overflow <= 0 && after.overflow <= 0, `${width}px delayed font: horizontal overflow before ${before.overflow}px / after ${after.overflow}px`);
    } finally {
      releaseFonts();
      await context.close();
    }
  };

  for (const viewport of viewports) {
    const run = await open(viewport);
    const { context, page, errors, external, response } = run;
    check(response?.status() === 200, `${viewport.name}: homepage status`);
    check(await page.locator('h1').count() === 1, `${viewport.name}: one H1`);
    check((await page.locator('h1').innerText()).replace(/\s+/g, ' ').toLowerCase() === 'business it that saves the day.', `${viewport.name}: H1 text`);
    // The photo panel sits below the fold and the image is loading="lazy" with
    // fetchpriority="low", so under load it can still hold no data. decode()
    // rejects with EncodingError on an image that has not loaded, rather than
    // waiting for it, so bring it into view and let it finish first.
    const photoImage = page.locator('.home-photo-panel img');
    await photoImage.scrollIntoViewIfNeeded();
    await photoImage.evaluate(image => image.complete || new Promise((loaded, failed) => {
      image.addEventListener('load', loaded, { once: true });
      image.addEventListener('error', () => failed(new Error(`team photo failed to load: ${image.currentSrc || image.src}`)), { once: true });
    }));
    const photo = await photoImage.evaluate(async image => {
      await image.decode();
      return { source: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight, displayedWidth: image.getBoundingClientRect().width };
    });
    await page.evaluate(() => scrollTo(0, 0));
    check(new URL(photo.source).origin === baseUrl, `${viewport.name}: team photo loads from the site itself`);
    // naturalWidth is density-corrected for srcset and may round down. Compare
    // with the displayed size, rather than a fixed viewport-dependent minimum.
    check(photo.width >= Math.floor(photo.displayedWidth) && photo.height > 0 && Math.abs(photo.width / photo.height - 4 / 3) < .01, `${viewport.name}: team photo decoded at the displayed size and intended ratio (${photo.width}x${photo.height}, displayed ${photo.displayedWidth}px)`);
    const builtOrder = await page.locator('main > section').evaluateAll(sections => sections.map(section => [...section.classList].find(name => /^home-(hero|report|services|comparison|pricing|process|cases|reviews|sectors|areas|faq|final)$/.test(name)).slice(5)));
    check(builtOrder.join(',') === sectionOrder.join(','), `${viewport.name}: section order`);
    check(await page.locator('.home-service-card').count() === 5, `${viewport.name}: five service cards`);
    check(await page.locator('.home-case-card').count() === 3, `${viewport.name}: three case cards`);
    check(await page.locator('.home-faq-list details').count() === 5, `${viewport.name}: five FAQs`);
    check(await page.locator('text=All systems operational').count() === 0, `${viewport.name}: no false status`);
    check(await page.locator('[data-proof-metrics]').isHidden(), `${viewport.name}: unavailable proof hidden`);
    check(await page.locator('a[href="/terms-of-business"]').count() >= 2, `${viewport.name}: terms links`);
    check(await page.locator('a[href="tel:+441584517234"]').count() >= 1, `${viewport.name}: phone link`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: no overflow`);
    if (viewport.name === 'phone') {
      const mobileMenu = page.locator('[data-mobile-menu]');
      await mobileMenu.locator('summary').click();
      check(await mobileMenu.getAttribute('open') !== null, 'phone: mobile menu did not open');
      await page.keyboard.press('Escape');
      check(await mobileMenu.getAttribute('open') === null, 'phone: Escape did not close mobile menu');
    }
    const cookieBanner = page.locator('[data-cookie-banner]');
    await cookieBanner.waitFor({ state: 'visible', timeout: 2_000 }).catch(() => undefined);
    check(await cookieBanner.isVisible(), `${viewport.name}: cookie notice did not appear`);
    const cookieSettings = cookieBanner.locator('[data-consent="customise"]');
    await cookieSettings.click();
    const cookieDialog = page.locator('[data-cookie-dialog]');
    check(await cookieDialog.evaluate(dialog => dialog.open), `${viewport.name}: cookie settings did not open`);
    await page.keyboard.press('Escape');
    check(!(await cookieDialog.evaluate(dialog => dialog.open)), `${viewport.name}: Escape did not close cookie settings`);
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-consent') === 'customise', null, { timeout: 1500 }).catch(() => undefined);
    check(await cookieSettings.evaluate(element => element === document.activeElement), `${viewport.name}: cookie settings focus was not restored`);
    await cookieBanner.locator('[data-consent="reject"]').click();
    check(await page.evaluate(() => JSON.parse(localStorage.getItem('ft-cookie-consent-v1')).analytics === false), `${viewport.name}: cookie rejection was not stored`);
    check(await cookieBanner.isHidden(), `${viewport.name}: cookie notice remained after rejection`);
    const secondFaq = page.locator('.home-faq-list details').nth(1);
    await secondFaq.locator('summary').focus();
    await page.keyboard.press('Enter');
    check(await secondFaq.getAttribute('open') !== null, `${viewport.name}: FAQ keyboard toggle`);
    const ratios = await page.locator('.home-sticker-green, .home-sticker-blue, .home-report-state, .home-card-link, .home-review-unavailable, .home-sector-card p, .home-sector-card > strong').evaluateAll(elements => {
      const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
      const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      return elements.map(element => {
        const fg = luminance(rgb(getComputedStyle(element).color));
        let node = element; let bg = [255, 255, 255, 1];
        while (node) { const value = rgb(getComputedStyle(node).backgroundColor); if ((value[3] ?? 1) > 0) { bg = value; break; } node = node.parentElement; }
        const bl = luminance(bg); return (Math.max(fg, bl) + .05) / (Math.min(fg, bl) + .05);
      });
    });
    check(ratios.length >= 5 && ratios.every(ratio => ratio >= 4.5), `${viewport.name}: representative contrast ${ratios.join(',')}`);
    const caseLabelContrasts = await page.locator('.home-case-top > span, .home-case-top > strong').evaluateAll(elements => {
      const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
      const luminance = ([r, g, b]) => [r, g, b].map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      return elements.map(element => {
        const style = getComputedStyle(element);
        const foreground = style.color;
        const background = style.backgroundColor;
        const fg = luminance(rgb(foreground));
        const bg = luminance(rgb(background));
        return { label: element.textContent?.trim(), foreground, background, ratio: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05) };
      });
    });
    check(caseLabelContrasts.length === 6 && caseLabelContrasts.every(({ ratio }) => ratio >= 4.5), `${viewport.name}: all case-card label contrasts ${JSON.stringify(caseLabelContrasts)}`);
    check(errors.length === 0, `${viewport.name}: browser errors ${errors.join('; ')}`);
    check(!external.includes('www.google-analytics.com') && !external.includes('www.clarity.ms'), `${viewport.name}: no analytics request`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(projectDir, 'evidence', 'homepage-browser', `${viewport.name}-top.png`), fullPage: false });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${viewport.name}: no overflow at 200% text`);
    await context.close();
  }

  await checkDelayedFontWrap(390);
  await checkDelayedFontWrap(412);

  const noJs = await open({ width: 390, height: 844 }, false);
  check(await noJs.page.locator('main > section').count() === sectionOrder.length, 'no-JS: all sections render');
  check(await noJs.page.locator('.home-process-grid li').count() === 5, 'no-JS: process remains visible');
  check((await noJs.page.locator('[data-google-rating-label]').textContent())?.trim() === 'Read our reviews', 'no-JS: direct Google link without a saved rating');
  check(await noJs.page.getByText('Herefordshire', { exact: true }).count() >= 1, 'no-JS: county names remain complete');
  const noJsSecondFaq = noJs.page.locator('.home-faq-list details').nth(1);
  await noJsSecondFaq.locator('summary').click();
  check(await noJsSecondFaq.getAttribute('open') !== null, 'no-JS: native FAQ opens');
  check(await noJs.page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'no-JS: no phone overflow');
  check(noJs.errors.length === 0, `no-JS: browser errors ${noJs.errors.join('; ')}`);
  await noJs.context.close();
  await browser.close();
  if (failures.length) throw new Error(`${failures.length} homepage browser failures across ${assertions} assertions:\n${failures.join('\n')}`);
  console.log(`${assertions} homepage browser assertions passed at 390px, 412px delayed-font, 1440px, 200% text and phone no-JS`);
} finally {
  if (server.exitCode === null) { server.kill(); await Promise.race([new Promise(resolveExit => server.once('exit', resolveExit)), delay(3000)]); }
}
