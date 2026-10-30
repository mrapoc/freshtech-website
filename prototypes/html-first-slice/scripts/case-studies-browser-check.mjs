// Case-study browser gate. Runs against its own Astro preview of the built
// output and covers: listing filters at phone and desktop, every direct detail
// route, listing-to-detail navigation, overflow and browser errors, active
// navigation, JavaScript-off listing usefulness and a representative detail
// JavaScript-off pass. It never prints record content, only slugs and counts.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { caseStudies } from '../src/generated/case-studies-data.mjs';
import { allSectors, displayStudies, relatedStudies } from '../src/lib/case-study-display.mjs';
import { BLOCKMARK_STUB, isBlockmarkBadge } from './lib/blockmark-stub.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');

const projectDir = resolve(import.meta.dirname, '..');
const suppliedBaseUrl = process.env.E2E_BASE_URL?.replace(/\/$/, '');
const port = suppliedBaseUrl ? null : await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.unref();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    if (!address || typeof address === 'string') return reject(new Error('Could not reserve a preview port'));
    probe.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const baseUrl = suppliedBaseUrl ?? `http://127.0.0.1:${port}`;
const listingUrl = `${baseUrl}/case-studies/`;
const detailUrl = slug => `${baseUrl}/case-studies/${slug}/`;
const studies = displayStudies(caseStudies);
const sectors = allSectors(studies);
const slugs = caseStudies.map(study => study.slug);
// Representative detail: prefer the first record with the full optional set
// (shortStats, testimonial, techStack) so every conditional block is exercised.
// Testimonials can all be withheld, so fall back to shortStats and techStack.
const representative = caseStudies.find(study => study.shortStats && study.testimonial && study.techStack?.length)
  ?? caseStudies.find(study => study.shortStats && study.techStack?.length);
if (!representative) throw new Error('The case-study browser gate requires a representative with shortStats and techStack');
// The sector to exercise the filter with: the first sector that does not match every study.
const filterSector = sectors.slice(1).find(sector => studies.some(study => study.industry !== sector)) ?? sectors[1];
if (!filterSector) throw new Error('The generated case-study data contains no sector to filter on');
const viewports = [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }];
const allowedHosts = new Set(['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com', 'res.cloudinary.com']);

const server = suppliedBaseUrl ? null : spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: projectDir,
  env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server?.stdout.on('data', chunk => { serverLog += chunk; });
server?.stderr.on('data', chunk => { serverLog += chunk; });

try {
  const readyDeadlineMs = 90_000;
  const readyDeadline = Date.now() + readyDeadlineMs;
  let ready = false;
  while (Date.now() < readyDeadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) throw new Error(`Astro preview exited before readiness (exit ${server.exitCode}): ${serverLog.trim().slice(-500) || '[no output]'}`);
    try { if ((await fetch(listingUrl)).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) {
    const tail = serverLog.trim().slice(-500);
    throw new Error(`Astro preview did not become ready within ${readyDeadlineMs / 1000} seconds${tail ? `: ${tail}` : ' (it produced no output, so this is a startup timeout rather than a crash)'}`);
  }

  const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  const failures = [];
  let assertionCount = 0;
  const check = (condition, message) => { assertionCount++; if (!condition) failures.push(message); };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  const dismissCookieForScreenshot = async page => {
    const reject = page.locator('[data-consent="reject"]');
    if (await reject.isVisible()) await reject.click();
  };
  const contrastRatio = (page, selector) => page.locator(selector).evaluateAll(elements => {
    const channels = value => (value.match(/[\d.]+/g) ?? []).map(Number);
    const blend = (front, back) => {
      const alpha = front.length > 3 ? front[3] : 1;
      return front.slice(0, 3).map((channel, index) => channel * alpha + back[index] * (1 - alpha));
    };
    const luminance = rgb => rgb.map(channel => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    return Math.min(...elements.map(element => {
      const layers = [];
      for (let node = element; node; node = node.parentElement) layers.push(channels(getComputedStyle(node).backgroundColor));
      let background = [255, 255, 255];
      for (const layer of layers.reverse()) if ((layer[3] ?? 1) > 0) background = blend(layer, background);
      const foreground = blend(channels(getComputedStyle(element).color), background);
      const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
      return (high + 0.05) / (low + 0.05);
    }));
  });
  const openContext = async (viewport, options = {}) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, ...options });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (isBlockmarkBadge(url)) route.fulfill(BLOCKMARK_STUB);
      else if (allowedHosts.has(url.hostname)) route.continue();
      else route.abort();
    });
    return { context, page, errors };
  };
  // Case Studies is a Resources entry, not a main link, so active state lives
  // inside the desktop disclosure panel or the mobile menu.
  const activeCaseStudiesLink = async (page, viewport) => {
    if (viewport.width < 1024) {
      await page.locator('[data-mobile-menu] summary').click();
      const active = await page.locator('[data-mobile-menu] nav a[href="/case-studies"][aria-current="page"]').count() === 1;
      await page.keyboard.press('Escape');
      return active && await page.locator('[data-mobile-menu] nav a[aria-current="page"]').count() === 1;
    }
    const disclosure = page.locator('[data-nav-group="resources"]');
    await disclosure.locator('summary').focus();
    await page.keyboard.press('Enter');
    const active = await disclosure.locator('a[href="/case-studies"][aria-current="page"]').count() === 1;
    await page.keyboard.press('Escape');
    return active && await page.locator('.desktop-nav > a[aria-current="page"]').count() === 0;
  };
  await mkdir(resolve(projectDir, 'evidence'), { recursive: true });

  // Listing: filters, structure, active navigation, card-to-detail navigation.
  for (const viewport of viewports) {
    const label = `listing ${viewport.name}`;
    const { context, page, errors } = await openContext(viewport);
    const response = await page.goto(listingUrl, { waitUntil: 'networkidle' });
    check(response?.status() === 200, `${label}: route did not return 200`);
    check(await page.locator('h1').textContent() === 'Real jobs.Real fixes.', `${label}: heading missing`);
    check(await page.locator('.cs-featured-card').count() === Math.min(2, studies.length), `${label}: featured pair missing`);
    check(await page.locator('.cs-card').count() === studies.length, `${label}: all-studies grid is incomplete`);
    check(await page.locator('[data-case-study-filters]').isVisible(), `${label}: filter toolbar was not revealed by the enhancement script`);
    check((await page.locator('[data-case-study-filters] button').allTextContents()).join('|') === sectors.join('|'), `${label}: filter buttons differ from source sectors`);
    check(await page.locator('[data-case-study-filters] button[aria-pressed="true"]').textContent() === 'All', `${label}: All is not pressed initially`);
    check(await page.locator('[data-filter-count]').textContent() === `${studies.length} stories`, `${label}: initial count label is wrong`);
    check(await activeCaseStudiesLink(page, viewport), `${label}: Case Studies is not the single active navigation entry`);
    check(await contrastRatio(page, '.sector-badge') >= 4.5, `${label}: a sector badge is below 4.5:1 contrast`);
    check(await contrastRatio(page, '.cs-client, .cs-card-body .cs-quote span, .cs-card-foot .cs-tags span, .cs-hero-note') >= 4.5, `${label}: card, hero-note or attribution text is below 4.5:1 contrast`);
    check(await noOverflow(page), `${label}: horizontal overflow`);

    // Filter by keyboard: Tab-free focus + Enter on a sector button, then back to All.
    const expectedVisible = studies.filter(study => study.industry === filterSector).length;
    const sectorButton = page.locator(`[data-case-study-filters] button[data-sector="${filterSector.replaceAll('"', '\\"')}"]`);
    await sectorButton.focus();
    await page.keyboard.press('Enter');
    check(await sectorButton.getAttribute('aria-pressed') === 'true' && await page.locator('[data-case-study-filters] button[aria-pressed="true"]').count() === 1, `${label}: pressed state did not move to the chosen sector`);
    check(await page.locator('.cs-card:visible').count() === expectedVisible && expectedVisible > 0, `${label}: visible cards after filtering differ from the source sector count`);
    check((await page.locator('.cs-card:visible').evaluateAll(cards => cards.map(card => card.dataset.industry))).every(industry => industry === filterSector), `${label}: a visible card is outside the chosen sector`);
    check(await page.locator('[data-filter-count]').textContent() === `${expectedVisible} in ${filterSector}`, `${label}: filtered count label is wrong`);
    check(await page.locator('[data-filter-empty]').isHidden(), `${label}: empty state shown while results exist`);
    check(await page.locator('.cs-featured-card').count() === Math.min(2, studies.length), `${label}: featured stories should not be filtered`);
    check(await noOverflow(page), `${label}: horizontal overflow after filtering`);
    await page.locator('[data-case-study-filters] button[data-sector="All"]').click();
    check(await page.locator('.cs-card:visible').count() === studies.length && await page.locator('[data-filter-count]').textContent() === `${studies.length} stories`, `${label}: All did not restore every study`);

    // Cards are real links to generated detail routes.
    await dismissCookieForScreenshot(page);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await page.waitForTimeout(50);
    await page.screenshot({ path: resolve(projectDir, 'evidence', `case-studies-listing-${viewport.name}-viewport.png`) });
    const target = studies.at(-1);
    await page.locator(`.cs-card[data-slug="${target.slug}"]`).click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, '') === `/case-studies/${target.slug}`, { waitUntil: 'load' });
    check(await page.locator('main.case-study-page').count() === 1 && await page.locator('h1').textContent() === target.headline, `${label}: card click did not open its generated detail route`);
    check(errors.length === 0, `${label}: browser errors after interactions: ${errors.join('; ')}`);
    await context.close();
  }

  // Representative detail route: full structure, back link, related order, menu and consent notice.
  for (const viewport of viewports) {
    const label = `${representative.slug} ${viewport.name}`;
    const { context, page, errors } = await openContext(viewport);
    const vendorRequests = [];
    page.on('request', request => { if (/google-analytics|googletagmanager|clarity\.ms|calendly\.com/.test(request.url())) vendorRequests.push(request.url()); });
    const response = await page.goto(detailUrl(representative.slug), { waitUntil: 'networkidle' });
    check(response?.status() === 200, `${label}: route did not return 200`);
    check(await page.locator('h1').textContent() === representative.title, `${label}: heading missing`);
    check(await page.locator('.cs-back a[href="/case-studies"]').isVisible(), `${label}: back link missing`);
    check(await page.locator('.cs-outcome-box strong').isVisible(), `${label}: outcome box missing`);
    check(await page.locator('.cs-metric').count() === (representative.shortStats ? 3 : 0), `${label}: result metrics differ from shortStats`);
    check(await page.locator('.cs-stack li').count() === (representative.techStack?.length ?? 0), `${label}: technology tags differ from source`);
    check(await page.locator('.cs-testimonial').count() === (representative.testimonial ? 1 : 0), `${label}: testimonial branch differs from source`);
    const relatedHrefs = await page.locator('.cs-related-card').evaluateAll(links => links.map(link => link.getAttribute('href')));
    check(relatedHrefs.join(',') === relatedStudies(caseStudies, representative.slug).map(item => `/case-studies/${item.slug}`).join(','), `${label}: related links differ from source order`);
    check(await activeCaseStudiesLink(page, viewport), `${label}: Case Studies is not the single active navigation entry`);
    check(await page.locator('a[href="/contact"]').count() >= 3, `${label}: conversion links are missing`);
    check(vendorRequests.length === 0, `${label}: vendor request occurred before consent`);
    check(await contrastRatio(page, '.cs-detail-client, .cs-box-label, .cs-metric span, .cs-related-industry, .cs-back a') >= 4.5, `${label}: a detail label is below 4.5:1 contrast`);
    check(await contrastRatio(page, '.sector-badge') >= 4.5, `${label}: detail sector badge is below 4.5:1 contrast`);
    check(await noOverflow(page), `${label}: horizontal overflow`);
    if (viewport.width < 1024) {
      await page.waitForTimeout(950);
      check(await page.locator('[data-cookie-banner]').isVisible(), `${label}: cookie notice did not appear`);
    }
    await dismissCookieForScreenshot(page);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await page.waitForTimeout(50);
    await page.screenshot({ path: resolve(projectDir, 'evidence', `case-study-detail-${viewport.name}-viewport.png`) });
    check(errors.length === 0, `${label}: browser errors after interactions: ${errors.join('; ')}`);
    await context.close();
  }

  // Every generated detail route: HTTP status, H1, template, overflow and errors.
  const swept = [];
  for (const viewport of viewports) {
    const { context, page, errors } = await openContext(viewport);
    for (const study of caseStudies) {
      const label = `${study.slug} sweep ${viewport.name}`;
      const response = await page.goto(detailUrl(study.slug), { waitUntil: 'load' });
      check(response?.status() === 200, `${label}: route returned ${response?.status() ?? 'no response'}`);
      check(await page.locator('h1').textContent() === study.title, `${label}: H1 is not the source title`);
      check(await page.locator('main.case-study-page').count() === 1, `${label}: case-study template missing`);
      check(await noOverflow(page), `${label}: horizontal overflow`);
      check(errors.length === 0, `${label}: browser errors: ${errors.join('; ')}`);
      errors.length = 0;
      if (viewport.name === 'phone') swept.push(study.slug);
    }
    await context.close();
  }
  check(swept.join(',') === slugs.join(','), `route sweep covered [${swept.join(', ')}] rather than [${slugs.join(', ')}]`);

  // JavaScript off: the listing keeps every study visible and usable, hides the
  // dead filter toolbar, and the representative detail route stays complete.
  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJs = await noJsContext.newPage();
  const noJsResponse = await noJs.goto(listingUrl);
  check(noJsResponse?.status() === 200, 'listing no-JS: route did not return 200');
  check(await noJs.locator('.cs-card:visible').count() === studies.length, 'listing no-JS: not every study is visible');
  check(await noJs.locator('[data-case-study-filters]').isHidden(), 'listing no-JS: dead filter controls are visible');
  check(await noJs.locator('[data-filter-count]').textContent() === `${studies.length} stories`, 'listing no-JS: count label missing');
  check(await noJs.locator('.sector-badge').count() >= studies.length, 'listing no-JS: sector badges are missing, so sector information is lost without the filter');
  check(await noJs.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'listing no-JS: horizontal overflow');
  await noJs.locator('[data-mobile-menu] summary').click();
  check(await noJs.locator('[data-mobile-menu] nav a[href="/case-studies"]').isVisible(), 'listing no-JS: mobile navigation unreachable');
  await noJs.locator('[data-mobile-menu] summary').click();
  await noJs.locator(`.cs-card[data-slug="${representative.slug}"]`).click();
  await noJs.waitForURL(url => url.pathname.replace(/\/$/, '') === `/case-studies/${representative.slug}`, { waitUntil: 'load' });
  check(await noJs.locator('h1').textContent() === representative.title, `${representative.slug} no-JS: heading missing after listing navigation`);
  check(await noJs.locator('.cs-metric').count() === (representative.shortStats ? 3 : 0) && await noJs.locator('.cs-related-card').count() === Math.min(3, caseStudies.length - 1), `${representative.slug} no-JS: content incomplete`);
  check(await noJs.locator('.cs-back a[href="/case-studies"]').isVisible(), `${representative.slug} no-JS: back link missing`);
  await noJsContext.close();

  await browser.close();
  if (failures.length) throw new Error(`Case-study browser checks failed:\n- ${failures.join('\n- ')}`);
  console.log(`${assertionCount} case-study browser assertions passed across the /case-studies listing (filtering on "${filterSector}"), ${representative.slug} (representative), a ${slugs.length}-route sweep (${slugs.join(', ')}) and JavaScript-off contexts at 390px and 1440px`);
} finally {
  server?.kill('SIGTERM');
}
