import { test, expect, goto } from './helpers';

for (const path of ['/', '/services', '/pricing', '/contact', '/about', '/blog', '/faq', '/industries', '/resources', '/it-health-check']) {
  test(`${path} has a main heading, image alternatives and valid labels`, async ({ page }) => {
    await goto(page, path);
    await expect(page.locator('main h1')).toHaveCount(1);
    const missing = await page.locator('img:not([alt])').count();
    expect(missing).toBe(0);
    const broken = await page.locator('[aria-labelledby]').evaluateAll(elements => elements.flatMap(el => (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(id => id && !document.getElementById(id))));
    expect(broken).toEqual([]);
  });
}

test('cookie preferences contain focus and restore it on Escape', async ({ page }) => {
  await goto(page, '/contact');
  const opener = page.getByRole('button', { name: 'Cookie settings', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName(/cookies|preferences/i);
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('preferences do not preselect analytics when no decision exists', async ({ page }) => {
  await goto(page, '/contact');
  await page.evaluate(() => localStorage.removeItem('ft-cookie-consent-v1'));
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Analytics', exact: true })).toHaveAttribute('aria-checked', 'false');
});
