import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      // Regression tests never submit leads or contact external services.
      if (request.method() !== 'GET') return route.abort();
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
      if (url.pathname.startsWith('/.netlify/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return route.continue();
    });
    await page.addInitScript(() => localStorage.setItem('ft-cookie-consent-v1', JSON.stringify({ analytics: false, ts: Date.now() })));
    await use(page);
  },
});
export { expect };
export type { Page };
export async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://fresh-tech.uk${path === '/' ? '/' : path.replace(/\/$/, '')}`);
  await expect(page.locator('main h1').first()).toBeVisible();
}
