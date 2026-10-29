import { test, expect, goto, type Page } from './helpers';

// The FreshPSA chat embed was removed from index.html because its hidden
// iframe target refuses framing. These tests prove no widget is loaded and
// that the legacy Layout's fixed controls now go to /contact instead.

function trackExternalRequests(page: Page) {
  const seen: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) seen.push(request.url());
  });
  return seen;
}

async function expectNoWidget(page: Page, external: string[]) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  expect(external.filter((u) => /chat|widget/i.test(new URL(u).hostname))).toEqual([]);
  await expect(page.locator('script[src*="widget-embed"]')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#freshpsa-chat-widget')).toHaveCount(0);
  const globals = await page.evaluate(() => {
    const w = window as Window & { openFreshChat?: unknown; FreshPSAChat?: unknown };
    return { open: typeof w.openFreshChat, config: typeof w.FreshPSAChat };
  });
  expect(globals).toEqual({ open: 'undefined', config: 'undefined' });
}

for (const path of ['/', '/faq']) {
  test(`no chat widget script, frame or request on ${path}`, async ({ page }) => {
    const external = trackExternalRequests(page);
    await goto(page, path);
    await expectNoWidget(page, external);
  });
}

test('legacy layout offers contact instead of a fake live chat', async ({ page }) => {
  await goto(page, '/faq');
  await expect(page.getByRole('link', { name: /live chat/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /live chat|^chat$/i })).toHaveCount(0);
});

test.describe('desktop fixed control', () => {
  test.skip(({ isMobile }) => !!isMobile, 'desktop only');

  test('mouse activation reaches the contact page', async ({ page }) => {
    await goto(page, '/faq');
    const link = page.getByRole('link', { name: 'Get in touch' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/contact');
    await link.click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('main h1').first()).toBeVisible();
  });

  test('keyboard activation reaches the contact page', async ({ page }) => {
    await goto(page, '/faq');
    const link = page.getByRole('link', { name: 'Get in touch' });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('booking control remains available', async ({ page }) => {
    await goto(page, '/faq');
    await page.getByRole('button', { name: 'Book Chat' }).click();
    await expect(page.getByRole('dialog', { name: 'How Can We Help?' })).toBeVisible();
  });
});

test.describe('phone conversion bar', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone only');
  const bar = (page: Page) => page.locator('div.fixed.bottom-0', { has: page.getByRole('button', { name: 'Book Call' }) });

  test('contact link reaches the contact page', async ({ page }) => {
    await goto(page, '/faq');
    const link = bar(page).getByRole('link', { name: 'Contact', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/contact');
    await link.click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('main h1').first()).toBeVisible();
  });

  test('keyboard activation reaches the contact page', async ({ page }) => {
    await goto(page, '/faq');
    const link = bar(page).getByRole('link', { name: 'Contact', exact: true });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('call and booking controls remain available', async ({ page }) => {
    await goto(page, '/faq');
    await expect(bar(page).locator('a[href^="tel:"]')).toBeVisible();
    await bar(page).getByRole('button', { name: 'Book Call' }).click();
    await expect(page.getByRole('dialog', { name: 'How Can We Help?' })).toBeVisible();
  });
});
