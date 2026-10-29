import { test, expect, goto } from './helpers';

const routes = [
  ['homepage', '/'],
  ['legacy FAQ', '/faq/'],
  ['service', '/services/managed-it-support/'],
  ['blog article', '/blog/qr-code-scams-quishing-business/'],
] as const;

test.describe('prerendered documents carry styles for first paint', () => {
  test.use({ javaScriptEnabled: false });

  for (const [label, route] of routes) {
    for (const viewport of [
      { label: 'phone', width: 390, height: 844 },
      { label: 'desktop', width: 1440, height: 900 },
    ] as const) {
      test(`${label}, ${viewport.label}: first paint does not wait for a bundled stylesheet`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        if (route === '/') await page.route(/\/assets\/[^/]+\.css$/, request => request.abort());
        const localStylesheets: string[] = [];
        page.on('request', request => {
          const url = new URL(request.url());
          if (request.resourceType() === 'stylesheet' && ['localhost', '127.0.0.1'].includes(url.hostname)) {
            localStylesheets.push(url.pathname);
          }
        });

        await goto(page, route);
        const html = await page.content();
        const marker = route === '/' ? 'data-ft-critical-css' : 'data-ft-bundled-css';
        expect(html.match(new RegExp(marker, 'g'))).toHaveLength(1);
        if (route !== '/') expect(html).not.toMatch(/<link\b[^>]*\bhref=["']\/assets\/[^"']+\.css["'][^>]*>/i);
        expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(500_000);
        if (route !== '/') expect(localStylesheets).toEqual([]);
        expect(await page.locator(`style[${marker}]`).evaluate(element => element.textContent?.length ?? 0)).toBeLessThan(route === '/' ? 32_000 : 200 * 1024);

        const heading = page.locator('main h1').first();
        await expect(heading).toBeVisible();
        const box = await heading.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(await heading.evaluate(element => getComputedStyle(element).fontFamily)).not.toBe('serif');
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

        await page.screenshot({
          path: testInfo.outputPath(`${label.replace(/\s+/g, '-')}-${viewport.label}.png`),
          fullPage: false,
        });
      });
    }
  }
});

for (const width of [390, 768, 1024, 1440, 1920]) {
  test(`${width}px homepage does not move when the deferred stylesheet arrives`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let requested!: () => void;
    const seen = new Promise<void>(resolve => { requested = resolve; });
    await page.route(/\/assets\/[^/]+\.css$/, async route => {
      requested();
      await gate;
      await route.continue();
    });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await seen;
    await page.evaluate(() => document.fonts.ready);
    const measure = () => page.evaluate(() => {
      const rects = ['header', '.ft-hero-h1', '.ft-hero-grid', '.ft-hero-copy'].map(selector => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return [box.x, box.y, box.width, box.height];
      });
      return { rects, width: document.documentElement.scrollWidth };
    });
    const before = await measure();
    release();
    await expect(page.locator('head > link[rel="stylesheet"][href^="/assets/"]')).toHaveAttribute('media', 'all');
    const after = await measure();
    expect(after).toEqual(before);
    expect(after.width).toBeLessThanOrEqual(width);
    expect(errors).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`critical-css-${width}.png`) });
  });
}
