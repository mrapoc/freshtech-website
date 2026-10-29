import { test, expect } from './helpers';

const route = '/blog/qr-code-scams-quishing-business';
const title = 'QR Code Phishing: What to Tell Your Team';

for (const width of [390, 1440]) {
  test(`approved QR article renders and links correctly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Vite preview serves directory snapshots with a trailing slash; the
    // canonical remains the production URL without one.
    const response = await page.goto(`${route}/`, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    expect(await response!.text()).toContain(title);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://fresh-tech.uk${route}`);
    await expect(page.getByRole('heading', { name: 'What a QR code hides, and what your phone shows you', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Multi-factor authentication reduces the risk. It does not remove it', exact: true })).toHaveCount(1);
    await expect(page.getByAltText('Person using a laptop and a smartphone at a table', { exact: true })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`qr-${width}.png`), fullPage: true });
    const contact = page.getByRole('link', { name: 'get in touch', exact: true });
    await contact.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('main h1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}
