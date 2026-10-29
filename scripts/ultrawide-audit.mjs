import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const VIEWPORT = { width: 3440, height: 1440 };
const OUT_DIR = 'scripts/ultrawide-shots';

const ROUTES = [
  ['home',           '/'],
  ['services',       '/services'],
  ['service-detail', '/services/managed-it-support'],
  ['pricing',        '/pricing'],
  ['about',          '/about'],
  ['contact',        '/contact'],
  ['case-studies',   '/case-studies'],
  ['blog',           '/blog'],
  ['industries',     '/industries'],
  ['why-trust-us',   '/why-trust-us'],
  ['onboarding',     '/onboarding'],
  ['careers',        '/careers'],
  ['it-health',      '/it-health-check'],
  ['ms-premium',     '/microsoft-business-premium'],
  ['foundation',     '/foundation-monitoring'],
  ['compare',        '/compare'],
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
const page = await context.newPage();

const results = [];

for (const [name, path] of ROUTES) {
  try {
    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => !!document.getElementById('json-ld-schema'), { timeout: 10000 });
    await page.waitForTimeout(500);

    // Hero-only screenshot (top 900px)
    await page.screenshot({
      path: `${OUT_DIR}/${name}-hero.png`,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: 900 },
    });

    // Detect decorative absolute-positioned elements anchored to viewport edges
    // (i.e., far from the centered content area) — these are the ultrawide bug pattern.
    const findings = await page.evaluate(() => {
      const contentLeft  = (window.innerWidth - 1320) / 2; // expected content left edge
      const contentRight = contentLeft + 1320;
      const gap = 100; // tolerance — element more than 100px past content edge = suspect

      const suspects = [];
      document.querySelectorAll('section *').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'absolute') return;
        const r = el.getBoundingClientRect();
        // Skip if scoped to a small container (likely a card-internal decoration)
        const parent = el.parentElement;
        if (!parent) return;
        const pr = parent.getBoundingClientRect();
        if (pr.width < window.innerWidth * 0.6) return; // parent is narrow → scoped, skip

        const tooFarRight = r.left > contentRight + gap;
        const tooFarLeft  = r.right < contentLeft - gap;
        if (tooFarRight || tooFarLeft) {
          suspects.push({
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            side: tooFarRight ? 'right' : 'left',
            sample: (el.textContent || '').trim().slice(0, 40),
          });
        }
      });
      return suspects;
    });

    results.push({ route: path, suspects: findings });
    console.log(`${name.padEnd(16)} ${findings.length === 0 ? 'OK ' : `${findings.length} suspects`} → ${OUT_DIR}/${name}-hero.png`);
    if (findings.length) {
      findings.forEach(s => console.log(`    ${s.side.padEnd(5)} ${s.tag} w=${s.width} at [${s.left},${s.right}]  "${s.sample}"`));
    }
  } catch (err) {
    console.log(`${name.padEnd(16)} ERROR  ${err.message.split('\n')[0]}`);
    results.push({ route: path, error: err.message });
  }
}

await browser.close();

const issueCount = results.reduce((n, r) => n + (r.suspects?.length || 0), 0);
console.log(`\n${issueCount} total decoration-anchoring issues across ${ROUTES.length} routes.`);
