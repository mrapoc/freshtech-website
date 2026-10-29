// Reproducible generator for the careers social sharing card
// (public/images/careers-hiring-<version>.png, 1200x630). Renders an inline
// HTML template with the site's own Bungee / Archivo fonts, the white logo and
// the brand ink / yellow tokens through the verified Playwright module, then
// screenshots it. No image generation service and no new dependency: it uses
// the root repository Playwright and a full Chromium-based browser with
// sandboxing on, like the other browser gates. Copy is limited to the approved
// advert words; change the VERSION and the careers.astro seo.image together.
//
// Usage (from prototypes/html-first-slice):
//   PLAYWRIGHT_MODULE=<root node_modules/playwright> \
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<full Chromium/Edge executable> \
//   node scripts/generate-careers-card.mjs
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const VERSION = '20261016';
const projectDir = resolve(import.meta.dirname, '..');
const publicDir = resolve(projectDir, 'public');
const output = resolve(publicDir, 'images', `careers-hiring-${VERSION}.png`);
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath && !process.argv.includes('--html')) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required');

const font = file => process.argv.includes('--html') ? '/fonts/' + file : pathToFileURL(resolve(publicDir, 'fonts', file)).href;
const logo = `data:image/webp;base64,${(await readFile(resolve(publicDir, 'images', 'fresh-tech-logo-white.webp'))).toString('base64')}`;

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Bungee'; src: url('${font('bungee-latin.woff2')}') format('woff2'); }
@font-face { font-family: 'Archivo'; font-weight: 400 800; src: url('${font('archivo-v25-latin.woff2')}') format('woff2'); }
@font-face { font-family: 'Archivo Narrow'; font-weight: 600 700; src: url('${font('archivo-narrow-v35-latin.woff2')}') format('woff2'); }
html, body { margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: #0f1923 radial-gradient(rgba(255,255,255,.04) 1.4px, transparent 1.4px); background-size: 13px 13px; color: #fbf6ec; font-family: 'Archivo', sans-serif; }
.card { position: relative; box-sizing: border-box; height: 100%; padding: 56px 72px; display: flex; flex-direction: column; justify-content: space-between; border-top: 14px solid #f5c24a; }
.top { display: flex; align-items: center; justify-content: space-between; }
.logo { height: 118px; width: auto; }
.eyebrow { font: 700 22px/1 'Archivo Narrow', sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #f5c24a; }
h1 { margin: 0; font: 400 76px/1.02 'Bungee', sans-serif; color: #fff; max-width: 1000px; }
.sub { margin: 0; font: 700 40px/1.15 'Bungee', sans-serif; color: #f5c24a; }
.facts { display: flex; gap: 20px; }
.fact { padding: 18px 26px; border: 2px solid rgba(255,255,255,.22); background: rgba(255,255,255,.07); font: 700 27px/1.2 'Archivo', sans-serif; color: #fff; }
</style></head><body><div class="card">
<div class="top"><img class="logo" src="${logo}" alt="Fresh Tech"><div class="eyebrow">We're hiring</div></div>
<div><h1>IT Support Engineer (2nd Line)</h1></div>
<div class="facts"><div class="fact">£30,000 to £35,000</div><div class="fact">Home-based</div><div class="fact">Shropshire, north Herefordshire and neighbouring areas</div></div>
</div></body></html>`;

if (process.argv.includes('--html')) { await writeFile(resolve(publicDir, 'careers-card-preview.html'), html); process.exit(0); }
const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => ['Bungee', 'Archivo', 'Archivo Narrow'].map(family => document.fonts.check(`20px "${family}"`)));
  if (!loaded.every(Boolean)) throw new Error(`fonts not loaded: ${JSON.stringify(loaded)}`);
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.card *')].some(element => { const rect = element.getBoundingClientRect(); return rect.right > 1200 || rect.bottom > 630; }));
  if (overflow) throw new Error('card content overflows 1200x630');
  await writeFile(output, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
  console.log(`Wrote ${output}`);
} finally {
  await browser.close();
}


