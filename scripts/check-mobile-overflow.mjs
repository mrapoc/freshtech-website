import { chromium, devices } from '@playwright/test';

const browser = await chromium.launch();
const context = await browser.newContext(devices['iPhone SE']);
const page = await context.newPage();

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });

// Wait for React to mount (json-ld-schema is created by SEO component useEffect)
await page.waitForFunction(() => !!document.getElementById('json-ld-schema'), { timeout: 15000 });
await page.waitForTimeout(800);

const result = await page.evaluate(() => {
  const vw = window.innerWidth;
  const body = document.body;
  const html = document.documentElement;
  const bodyOverflow = body.scrollWidth - vw;
  const htmlOverflow = html.scrollWidth - vw;

  // Find any element wider than the viewport
  const offenders = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) {
      const tag = el.tagName.toLowerCase();
      const cls = (el.className && typeof el.className === 'string')
        ? el.className.slice(0, 60)
        : '';
      offenders.push({
        tag,
        cls,
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 50),
      });
    }
  });

  return {
    viewport: vw,
    bodyScrollWidth: body.scrollWidth,
    htmlScrollWidth: html.scrollWidth,
    bodyOverflow,
    htmlOverflow,
    offenderCount: offenders.length,
    topOffenders: offenders.slice(0, 8),
  };
});

console.log(JSON.stringify(result, null, 2));

// Verify sticky nav still works after the overflow-x:hidden change
const stickyCheck = await page.evaluate(async () => {
  const header = document.querySelector('header');
  if (!header) return { error: 'no header found' };
  const before = header.getBoundingClientRect().top;
  window.scrollTo(0, 800);
  await new Promise(r => setTimeout(r, 200));
  const after = header.getBoundingClientRect().top;
  return { topBeforeScroll: before, topAfterScroll: after, sticks: Math.abs(after) < 5 };
});
console.log('STICKY CHECK:', JSON.stringify(stickyCheck));

await browser.close();
