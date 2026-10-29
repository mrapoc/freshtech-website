import { test, expect, goto } from './helpers';

const legalRoutes = [
  '/terms-of-business',
  '/terms-of-business/v1-0',
  '/dpa',
  '/dpa/v1-0',
  '/sub-processors',
];

for (const path of legalRoutes) {
  test(`${path} renders indexable metadata, legal chrome and footer links`, async ({ page }) => {
    await goto(page, path);
    await expect(page.getByRole('heading', { name: 'The legal bit.' })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://fresh-tech.uk${path}`
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S.{40}/);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
    await expect(page.locator('.legal-page')).toHaveAttribute('data-placeholder-count', '0');
    await expect(page.locator('.legal-placeholder-warning')).toHaveCount(0);
    await expect(page.locator('footer a[href="/terms-of-business"]')).toBeVisible();
    await expect(page.locator('footer a[href="/dpa"]')).toBeVisible();
  });
}

test('heading, annex and numbered-clause anchors are stable and direct links settle on target', async ({
  page,
}) => {
  await page.goto('/terms-of-business#clause-11-6', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://fresh-tech.uk/terms-of-business'
  );
  await expect(page.getByRole('heading', { name: 'The legal bit.' })).toBeVisible();
  const clause = page.locator('#clause-11-6');
  await expect(clause).toContainText('11.6');
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      clause.evaluate(element => {
        const top = element.getBoundingClientRect().top;
        return top >= 0 && top < window.innerHeight;
      })
    )
    .toBe(true);
  await expect(page.locator('h2#clause-11')).toContainText('11. Warranties and liability');

  await goto(page, '/dpa');
  await expect(page.locator('h2#annex-1')).toBeVisible();
  await expect(page.locator('h2#annex-2')).toBeVisible();
  await expect(page.locator('h2#annex-3')).toBeVisible();
});

test('legal tables scroll independently on phones without overflowing the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page, '/sub-processors');
  const tableRegion = page.getByRole('region', { name: 'Scrollable legal document table' }).first();
  await expect(tableRegion).toBeVisible();
  await tableRegion.focus();
  await expect(tableRegion).toBeFocused();
  expect(await tableRegion.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(
    true
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
  ).toBeLessThanOrEqual(0);
});

test('print layout exposes a repeating document footer and hides site chrome', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chromium print-media verification');
  await goto(page, '/terms-of-business/v1-0');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.legal-print-footer')).toBeVisible();
  await expect(page.locator('.legal-print-footer')).toContainText('Version 1.0');
  await expect(page.locator('.legal-print-footer')).toContainText(
    'https://fresh-tech.uk/terms-of-business/v1-0'
  );
  await expect(page.locator('header')).toBeHidden();
  await expect(page.locator('footer')).toBeHidden();
});
