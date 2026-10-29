import { test, expect } from './helpers';

// Run against a full prerender served by vite preview, not the dev shell:
// E2E_BASE_URL=http://localhost:5189 npx playwright test e2e/hero-prerender.spec.ts --project=chromium
for (const javaScriptEnabled of [false, true]) {
  test.describe(`prerendered hero, JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, () => {
    test.use({ javaScriptEnabled });

    for (const width of [390, 767, 768, 1023, 1024, 1440]) {
      test(`${width}px preserves responsive layout before and after React`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto('/', { waitUntil: 'load' });
        expect(response?.status()).toBe(200);
        // This cannot pass by letting React generate the heading from an empty SPA shell.
        const html = await response!.text();
        expect(html).toMatch(/<h1[^>]*class="ft-hero-h1"/);
        expect(html).not.toContain('aria-label="Cookie notice"');
        const hero = page.locator('.ft-hero');
        const heading = hero.locator('h1');
        await expect(heading).toHaveText('BUSINESS ITTHAT SAVESTHE DAY.');
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresh-tech.uk/');
        const mobile = width < 768;
        const desktop = width >= 1024;
        await expect(heading).toHaveCSS('font-size', desktop ? '96px' : mobile ? '58px' : '72px');
        await expect(heading).toHaveCSS('font-family', /Bungee/);
        await expect(hero).toHaveCSS('padding', desktop ? '80px 48px 96px' : mobile ? '40px 20px 48px' : '56px 32px 64px');
        await expect(hero.locator('.ft-hero-grid')).toHaveCSS('gap', mobile ? '32px' : '36px');
        const tracks = await hero.locator('.ft-hero-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' '));
        expect(tracks).toHaveLength(desktop ? 2 : 1);
        await expect(hero.locator('.ft-hero-photo')).toHaveCSS('max-height', desktop ? 'none' : '420px');
        await expect(hero.locator('.ft-hero-photo')).toHaveCSS('overflow', desktop ? 'visible' : 'hidden');
        if (mobile) {
          const box = await heading.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          expect(await heading.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        }
        if ([390, 1440].includes(width)) {
          await hero.screenshot({ path: test.info().outputPath(`hero-${width}-${javaScriptEnabled ? 'on' : 'off'}.png`) });
        }
      });
    }
  });
}

test('a first-time visitor still receives the cookie choice after prerender', async ({ browser, baseURL }) => {
  // Empty storage deliberately bypasses helpers.ts's saved-denial fixture.
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
  try {
    await context.route('**/*', route => {
      const r = route.request();
      const url = new URL(r.url());
      if (r.method() !== 'GET' || !['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
      if (url.pathname.startsWith('/.netlify/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return route.continue();
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const notice = page.getByRole('dialog', { name: 'Cookie notice', exact: true });
    await expect(notice).toBeVisible();
    const reject = notice.getByRole('button', { name: /reject/i });
    await reject.focus();
    await expect(reject).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(notice).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ft-cookie-consent-v1')!).analytics)).toBe(false);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
