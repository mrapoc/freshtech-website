import { test, expect } from './helpers';

// Built output only (true SSR markup exists only after `npm run build`). Run
// through `npm run test:e2e:built`, which owns the fresh build and preview.
const HYDRATION_WARNING = /hydrat|did not match|recoverable/i;

const hydrationCases = [
  { width: 390, url: '/', timezoneId: 'Europe/London' },
  { width: 1440, url: '/', timezoneId: 'Europe/London' },
  { width: 390, url: '/?utm_source=hydration-check', timezoneId: 'America/New_York' },
  { width: 1920, url: '/#top', timezoneId: 'Pacific/Auckland' },
] as const;

for (const { width, url, timezoneId } of hydrationCases) {
  test.describe(`${width}px ${url} in ${timezoneId}`, () => {
    test.use({ timezoneId });

    test('retains the SSR tree and responsive geometry', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const consoleIssues: string[] = [];
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type()) && HYDRATION_WARNING.test(msg.text())) consoleIssues.push(msg.text());
    });
    page.on('pageerror', err => consoleIssues.push(err.message));

    // Hold the application module behind an explicit gate so measurements are
    // definitely from the server DOM rather than a timing guess.
    let releaseEntry!: () => void;
    const entryGate = new Promise<void>(resolve => { releaseEntry = resolve; });
    let sawEntry!: () => void;
    const entryRequested = new Promise<void>(resolve => { sawEntry = resolve; });
    await page.route(/\/assets\/index-[^/]+\.js$/, async route => {
      sawEntry();
      await entryGate;
      await route.continue();
    });

    const response = await page.goto(url, { waitUntil: 'commit' });
    const html = await response!.text();
    expect(html).toContain('data-ft-ssr="home-v1"');
    expect(html).toMatch(/data-ft-ssr-date="\d{4}-/);
    expect(html).toMatch(/<h1[^>]*class="ft-hero-h1"/);
    expect(html).not.toContain('aria-label="Cookie notice"');

    await entryRequested;
    await page.evaluate(() => document.fonts.ready);

    // Keep the actual node reference outside the DOM. Adding a data attribute
    // here would itself create a hydration warning.
    const heading = page.locator('main h1.ft-hero-h1');
    await expect(heading).toHaveText('BUSINESS ITTHAT SAVESTHE DAY.');
    const mobileNav = page.locator('.ft-nav-mobile');
    const desktopNav = page.locator('.ft-nav-desktop-main');
    if (width < 1024) {
      await expect(mobileNav).toBeVisible();
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
      await expect(desktopNav).toBeHidden();
      await expect(page.getByRole('button', { name: 'Show resources links' })).toHaveCount(0);
    } else {
      await expect(mobileNav).toBeHidden();
      await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(0);
      await expect(desktopNav).toBeVisible();
      await expect(page.getByRole('button', { name: 'Show resources links' })).toBeVisible();
    }
    const before = await page.evaluate(() => {
      const h1 = document.querySelector('main h1.ft-hero-h1')!;
      (window as typeof window & { __ftSsrHeading?: Element }).__ftSsrHeading = h1;
      const rect = (selector: string) => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      };
      return {
        header: rect('header'),
        heading: rect('main h1.ft-hero-h1'),
        copy: rect('main .ft-hero-copy'),
        desktopCta: rect('.ft-nav-desktop-main a[href="/contact"]'),
      };
    });

    releaseEntry();
    await page.waitForLoadState('networkidle');

    // A real disclosure state change proves event handlers are attached.
    if (width < 1024) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible();
      await page.getByRole('button', { name: 'Close menu', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveCount(0);
    } else {
      const disclosure = page.getByRole('button', { name: 'Show resources links' });
      await disclosure.focus();
      await disclosure.press('Enter');
      await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
      await disclosure.press('Escape');
    }

    const after = await page.evaluate(() => {
      const h1 = document.querySelector('main h1.ft-hero-h1')!;
      const rect = (selector: string) => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      };
      return {
        sameHeading: (window as typeof window & { __ftSsrHeading?: Element }).__ftSsrHeading === h1,
        header: rect('header'),
        heading: rect('main h1.ft-hero-h1'),
        copy: rect('main .ft-hero-copy'),
        desktopCta: rect('.ft-nav-desktop-main a[href="/contact"]'),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(after.sameHeading).toBe(true);
    for (const area of ['header', 'heading', 'copy', 'desktopCta'] as const) {
      for (const dimension of ['x', 'y', 'width', 'height'] as const) {
        expect(Math.abs(after[area][dimension] - before[area][dimension])).toBeLessThanOrEqual(1);
      }
    }
    expect(after.horizontalOverflow).toBeLessThanOrEqual(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresh-tech.uk/');
    const ukYear = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric', timeZone: 'Europe/London',
    }).format(new Date());
    await expect(page.locator('footer')).toContainText(`© ${ukYear}`);

    const desktop = width >= 1024;
    await expect(heading).toHaveCSS('font-size', desktop ? '96px' : '58px');
    const tracks = await page.locator('.ft-hero-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' '));
    expect(tracks).toHaveLength(desktop ? 2 : 1);
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(desktop ? 0 : 1);

    expect(consoleIssues).toEqual([]);
    });
  });
}

test('homepage -> other route -> homepage keeps working after hydration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresh-tech.uk/pricing');
  await page.getByRole('link', { name: 'Fresh Tech', exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('main h1.ft-hero-h1')).toHaveText('BUSINESS ITTHAT SAVESTHE DAY.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresh-tech.uk/');
  expect(errors).toEqual([]);
});

test('first-time visitor gets the cookie choice on the hydrated homepage', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (route.request().method() !== 'GET' || !['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
      if (url.pathname.startsWith('/.netlify/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return route.continue();
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(baseURL!);
    const notice = page.getByRole('dialog', { name: 'Cookie notice', exact: true });
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: /accept/i }).click();
    await expect(notice).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ft-cookie-consent-v1')!).analytics)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
