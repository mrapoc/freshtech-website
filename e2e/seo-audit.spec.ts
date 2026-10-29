import { test, expect, goto } from './helpers';

function schemaTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(schemaTypes);
  if (!value || typeof value !== 'object') return [];
  const object = value as Record<string, unknown>;
  const own = object['@type'];
  const names = typeof own === 'string' ? [own] : Array.isArray(own) ? own.filter((x): x is string => typeof x === 'string') : [];
  return [...names, ...Object.values(object).flatMap(schemaTypes)];
}

const routes = ['/', '/services', '/industries', '/pricing', '/contact', '/about', '/blog', '/faq', '/case-studies', '/resources', '/support-upgrade', '/services/managed-it-support', '/services/cybersecurity', '/services/cloud-phone-systems', '/locations/ludlow', '/it-support-shropshire', '/industries/solicitors', '/break-fix-vs-managed-it', '/email-account-hacked'];
for (const path of routes) {
  test(`${path} has route-specific indexable SEO`, async ({ page }) => {
    await goto(page, path);
    await expect(page).toHaveTitle(/\S.{15}/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S.{40}/);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', await page.title());
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    const schema = await page.locator('#json-ld-schema').textContent();
    const parsed = JSON.parse(schema || '{}');
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    expect(nodes.length).toBeGreaterThan(0);
    expect(schemaTypes(parsed).length).toBeGreaterThan(0);
    for (const node of nodes) expect(node['@context']).toBe('https://schema.org');
    if (path !== '/') await expect(page.locator('main h1')).not.toContainText('THAT SAVES');
  });
}

test('key pages have distinct titles and descriptions', async ({ page }) => {
  const titles = new Set(), descriptions = new Set();
  for (const path of ['/', '/services', '/pricing', '/contact', '/about', '/blog']) {
    await goto(page, path);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(titles.has(title)).toBe(false); expect(descriptions.has(description)).toBe(false);
    titles.add(title); descriptions.add(description);
  }
});

for (const path of ['/this-page-does-not-exist', '/blog/this-post-does-not-exist', '/industries/this-industry-does-not-exist']) {
  test(`${path} is explicitly not indexable`, async ({ page }) => {
    await goto(page, path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page).toHaveTitle(/Page Not Found/);
    const schema = await page.locator('#json-ld-schema').textContent();
    expect(schemaTypes(JSON.parse(schema || '{}'))).not.toContain('Article');
  });
}

test('legacy hash navigation cannot satisfy a contact-page assertion', async ({ page }) => {
  await page.goto('/#/contact');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresh-tech.uk/');
  await expect(page.locator('link[rel="canonical"]')).not.toHaveAttribute('href', 'https://fresh-tech.uk/contact');
});

const legacyClientRedirects: [string, string][] = [
  ['/technology-projects', '/technology'],
  ['/managed-print-solutions', '/services/managed-print'],
  ['/service-area/it-support-in-shropshire', '/it-support-shropshire'],
  ['/service-area/it-support-in-ludlow', '/it-support-ludlow'],
  ['/service-area/it-support-in-hereford', '/it-support-hereford'],
  ['/service-area/it-support-in-telford', '/it-support-telford'],
];
for (const [legacy, destination] of legacyClientRedirects) {
  test(`legacy ${legacy} resolves client-side to ${destination}`, async ({ page }) => {
    await page.goto(legacy, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://fresh-tech.uk${destination}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
    await expect(page).not.toHaveTitle(/Page Not Found/);
  });
}

test('live /it-support-herefordshire route is not treated as a legacy redirect', async ({ page }) => {
  await goto(page, '/it-support-herefordshire');
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/);
  await expect(page).not.toHaveTitle(/Page Not Found/);
});
