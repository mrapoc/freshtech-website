import { test, expect, goto } from './helpers';

for (const width of [390, 1440]) {
  for (const path of ['/', '/contact', '/pricing', '/services', '/support-upgrade']) {
    test(`${path} fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await goto(page, path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
    });
  }
}

test('contact offers working phone, email and booking controls', async ({ page }) => {
  await goto(page, '/contact');
  await expect(page.locator('main a[href="tel:+441584517234"]').first()).toBeVisible();
  await expect(page.locator('main a[href="mailto:hello@fresh-tech.uk"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open booking calendar' })).toBeVisible();
});

test('mobile menu navigates and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page, '/');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeVisible();
});

test('blog listing links to a real article', async ({ page }) => {
  await goto(page, '/blog');
  await page.locator('main a[href^="/blog/"]').first().click();
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
  await expect(page.locator('article')).toBeVisible();
});
