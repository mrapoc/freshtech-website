import { test, expect, goto } from './helpers';

async function openBooking(page: import('@playwright/test').Page) {
  await goto(page, '/contact');
  const opener = page.getByRole('button', { name: 'Open booking calendar' });
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'How Can We Help?' })).toBeVisible();
  return opener;
}

test('booking qualifies visitors before loading the calendar', async ({ page }) => {
  await openBooking(page);
  await expect(page.locator('.calendly-inline-widget')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Exploring IT Support/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Existing Customer/ })).toBeVisible();
  const dialog = page.getByRole('dialog');
  for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 6; i++) {
    await page.keyboard.press(key);
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
});

test('existing customers get phone and email support', async ({ page }) => {
  await openBooking(page);
  await page.getByRole('button', { name: /Existing Customer/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('a[href^="tel:"]')).toBeVisible();
  await expect(dialog.locator('a[href^="mailto:"]')).toBeVisible();
  await expect(page.locator('.calendly-inline-widget')).toHaveCount(0);
});

test('booking restores keyboard focus and resets when reopened', async ({ page }) => {
  const opener = await openBooking(page);
  await page.getByRole('button', { name: /Existing Customer/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'How Can We Help?' })).toBeVisible();
});

test('blocked calendar offers a named dialog and contact fallback', async ({ page }) => {
  await openBooking(page);
  await page.getByRole('button', { name: /Exploring IT Support/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName(/.+/);
  await expect(dialog.locator('a[href^="tel:"]')).toBeVisible();
  await expect(dialog.locator('a[href*="calendly.com"]')).toBeVisible();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.route('https://assets.calendly.com/assets/external/widget.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.Calendly = { initInlineWidget({parentElement}) { const frame = document.createElement('iframe'); frame.title = 'Test booking calendar'; frame.src = 'about:blank'; parentElement.appendChild(frame); } };`,
  }));
  await dialog.getByRole('button', { name: 'Try again' }).click();
  await expect(dialog.locator('iframe[title="Test booking calendar"]')).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
});
