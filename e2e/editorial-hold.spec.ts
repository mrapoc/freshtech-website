import { test, expect, goto } from './helpers';
import fs from 'node:fs';

const holds: { slugs: string[] } = JSON.parse(fs.readFileSync(new URL('../data/editorial-holds.json', import.meta.url), 'utf8'));

const published = '/blog/staff-using-ai-at-work-company-data';

for (const width of [390, 1440]) {
  test(`held articles stay out of discovery after their planned dates at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date('2027-03-01T12:00:00Z'));
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/blog', '/team/sam-james', '/resources', published]) {
      await goto(page, path);
      for (const slug of holds.slugs) {
        await expect(page.locator(`main a[href="/blog/${slug}"]`)).toHaveCount(0);
      }
      if (path === '/blog' || path === '/team/sam-james') {
        await expect(page.locator(`main a[href="${published}"]`).first()).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `overflow at ${path}`).toBe(false);
      if (path === '/blog') await page.screenshot({ path: test.info().outputPath(`blog-${width}.png`) });
    }
    expect(errors).toEqual([]);
  });
}

test('previously exposed held article keeps its direct URL', async ({ page }) => {
  test.skip(!holds.slugs.length, 'no article is on hold');
  await page.clock.setFixedTime(new Date('2027-03-01T12:00:00Z'));
  const heldSlug = holds.slugs[0];
  await goto(page, `/blog/${heldSlug}`);
  await expect(page.locator(`link[rel="canonical"]`)).toHaveAttribute('href', `https://fresh-tech.uk/blog/${heldSlug}`);
});
