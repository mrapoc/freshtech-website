// Quick diagnostic: open the staging URL, trigger the Calendly modal,
// and report console errors / failed network requests / iframe state.
// Run with: node scripts/check-calendly.mjs <staging-url>

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const STAGING_URL = process.argv[2];
if (!STAGING_URL) throw new Error('Usage: node scripts/check-calendly.mjs <site-url>');
const SCREENSHOT_PATH = fileURLToPath(new URL('calendly-check.png', import.meta.url));

const consoleMessages = [];
const networkFailures = [];
const cspViolations = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

page.on('console', msg => {
  const text = msg.text();
  if (msg.type() === 'error' || msg.type() === 'warning' || text.toLowerCase().includes('calendly') || text.toLowerCase().includes('csp')) {
    consoleMessages.push(`[${msg.type()}] ${text}`);
  }
});

page.on('pageerror', err => consoleMessages.push(`[pageerror] ${err.message}`));

page.on('requestfailed', req => {
  const url = req.url();
  if (url.includes('calendly') || url.includes('assets.calendly')) {
    networkFailures.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
  }
});

page.on('response', resp => {
  if (resp.status() >= 400) {
    const url = resp.url();
    if (url.includes('calendly') || url.includes('assets.calendly')) {
      networkFailures.push(`${resp.status()} ${url}`);
    }
  }
});

// CSP violations come through console but also as Reporting API events
await page.addInitScript(() => {
  document.addEventListener('securitypolicyviolation', e => {
    console.warn(`[CSP-VIOLATION] directive=${e.violatedDirective} blocked=${e.blockedURI}`);
  });
});

console.log(`→ Loading ${STAGING_URL}`);
await page.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: 30000 });

// Find a button that opens the Calendly modal. Try a few common labels.
const triggerLabels = ['Book a 20-min call', 'Book a call', 'Get a free quote', 'Get an Instant Quote'];
let opened = false;
for (const label of triggerLabels) {
  const btn = page.getByRole('link', { name: new RegExp(label, 'i') }).first();
  if (await btn.count() > 0) {
    console.log(`→ Found trigger: "${label}". Clicking to navigate to /contact.`);
    await btn.click();
    opened = true;
    break;
  }
}
if (!opened) {
  console.log('→ No homepage CTA matched. Navigating directly to /contact.');
  await page.goto(STAGING_URL.replace(/\/$/, '') + '/contact', { waitUntil: 'networkidle' });
}

await page.waitForTimeout(1500);

// On /contact, look for a CTA that opens the qualifier modal.
console.log('→ Looking for "Book a 20-min call" button on /contact page...');
const contactBtn = page.getByRole('button', { name: /book.*call|book.*20|book.*meeting/i }).first();
if (await contactBtn.count() > 0) {
  await contactBtn.click();
  console.log('→ Clicked contact-page CTA.');
} else {
  // Try any button containing "Calendly" or "Book"
  const fallback = page.locator('button, a').filter({ hasText: /book|calendly/i }).first();
  if (await fallback.count() > 0) {
    await fallback.click();
    console.log('→ Clicked fallback CTA.');
  } else {
    console.log('  ⚠️  No Book CTA found on /contact');
  }
}

await page.waitForTimeout(2000);

// Qualifier modal should appear. Click "I'm Exploring IT Support".
const qualifier = page.getByRole('button', { name: /exploring it support|new business|i'm exploring/i }).first();
if (await qualifier.count() > 0) {
  console.log('→ Qualifier modal opened. Clicking "I\'m Exploring IT Support".');
  await qualifier.click();
} else {
  console.log('  ⚠️  Qualifier modal not detected');
}

// Wait for the Calendly iframe to attempt to load.
await page.waitForTimeout(5000);

// Check for the iframe
const iframes = await page.frames();
const calendlyFrame = iframes.find(f => f.url().includes('calendly.com'));
console.log(`\n=== Calendly iframe state ===`);
if (calendlyFrame) {
  console.log(`  Found iframe with URL: ${calendlyFrame.url()}`);
  // Try to get the title of the iframe content
  try {
    const title = await calendlyFrame.title();
    console.log(`  Iframe title: "${title}"`);
  } catch (e) {
    console.log(`  Couldn't read iframe title (likely cross-origin): ${e.message}`);
  }
} else {
  console.log('  ⚠️  No Calendly iframe present in the page.');
}

// Look for the Calendly inline widget container
const widgetContainer = await page.locator('.calendly-inline-widget').count();
console.log(`  .calendly-inline-widget elements: ${widgetContainer}`);
if (widgetContainer > 0) {
  const dataUrl = await page.locator('.calendly-inline-widget').first().getAttribute('data-url');
  console.log(`  data-url attribute: ${dataUrl}`);
}

// Screenshot the modal state
await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
console.log(`\n→ Screenshot saved: ${SCREENSHOT_PATH}`);

// Reports
console.log(`\n=== Console messages (errors/warnings/calendly/csp) ===`);
if (consoleMessages.length === 0) console.log('  (none)');
else consoleMessages.forEach(m => console.log(`  ${m}`));

console.log(`\n=== Failed/4xx-5xx network requests (calendly only) ===`);
if (networkFailures.length === 0) console.log('  (none)');
else networkFailures.forEach(f => console.log(`  ${f}`));

await browser.close();
process.exit(0);
