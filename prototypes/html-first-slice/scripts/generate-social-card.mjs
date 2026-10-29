// Reproducible generator for the site-wide social sharing card
// (public/images/fresh-tech-social-<version>.png, 1200x630), the default
// og:image declared in src/lib/social-image.mjs. The template is deterministic
// HTML using the site's own Bungee / Archivo fonts, the white logo and the
// brand ink / yellow tokens; the copy is limited to existing approved words.
//
//   node scripts/generate-social-card.mjs --html
//     Writes evidence/social-card-preview.html (fonts and logo referenced by
//     relative path, nothing embedded) for a manual browser render. No browser
//     or Playwright module is loaded on this path.
//
//   PLAYWRIGHT_MODULE=<root node_modules/playwright> \
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<full Chromium/Edge executable> \
//   node scripts/generate-social-card.mjs
//     Renders the PNG through the verified Playwright module with sandboxing on.
//
// Change VERSION here and DEFAULT_SOCIAL_IMAGE together so caches refresh.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const VERSION = '20261016';
const WIDTH = 1200;
const HEIGHT = 630;
const projectDir = resolve(import.meta.dirname, '..');
const publicDir = resolve(projectDir, 'public');
const output = resolve(publicDir, 'images', `fresh-tech-social-${VERSION}.png`);
const previewOnly = process.argv.includes('--html');

// Preview: paths relative to evidence/. Render: absolute file URLs plus an
// embedded logo so the screenshot never depends on a served origin.
const fontUrl = file => (previewOnly ? `../public/fonts/${file}` : pathToFileURL(resolve(publicDir, 'fonts', file)).href);
const logoUrl = previewOnly
  ? '../public/images/fresh-tech-logo-white.webp'
  : `data:image/webp;base64,${(await readFile(resolve(publicDir, 'images', 'fresh-tech-logo-white.webp'))).toString('base64')}`;

export const socialCardHtml = ({ font = fontUrl, logo = logoUrl } = {}) => `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Fresh Tech social card ${WIDTH}x${HEIGHT}</title><style>
@font-face { font-family: 'Bungee'; src: url('${font('bungee-latin.woff2')}') format('woff2'); }
@font-face { font-family: 'Archivo'; font-weight: 400 800; src: url('${font('archivo-v25-latin.woff2')}') format('woff2'); }
@font-face { font-family: 'Archivo Narrow'; font-weight: 600 700; src: url('${font('archivo-narrow-v35-latin.woff2')}') format('woff2'); }
html, body { margin: 0; }
body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #0f1923 radial-gradient(rgba(255,255,255,.04) 1.4px, transparent 1.4px); background-size: 13px 13px; color: #fbf6ec; font-family: 'Archivo', sans-serif; }
.card { position: relative; box-sizing: border-box; height: 100%; padding: 60px 72px 56px; display: flex; flex-direction: column; justify-content: space-between; border-top: 14px solid #f5c24a; }
.logo { height: 132px; align-self: flex-start; width: auto; display: block; }
h1 { margin: 0; font: 400 80px/1.02 'Bungee', sans-serif; color: #fff; max-width: 1040px; }
.area { margin: 18px 0 0; font: 700 34px/1.2 'Archivo', sans-serif; color: #f5c24a; }
.foot { display: flex; align-items: center; justify-content: space-between; }
.brand { font: 400 30px/1 'Bungee', sans-serif; color: #fff; }
.url { font: 700 26px/1 'Archivo Narrow', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #f5c24a; }
</style></head><body><div class="card">
<img class="logo" src="${logo}" alt="Fresh Tech">
<div><h1>IT support for local businesses</h1><p class="area">Shropshire, Herefordshire and the Welsh Borders</p></div>
<div class="foot"><div class="brand">Fresh Tech</div><div class="url">fresh-tech.uk</div></div>
</div></body></html>`;

if (previewOnly) {
  const preview = resolve(projectDir, 'evidence', 'social-card-preview.html');
  await mkdir(resolve(projectDir, 'evidence'), { recursive: true });
  await writeFile(preview, socialCardHtml());
  console.log(`Wrote ${preview} (open in a browser at ${WIDTH}x${HEIGHT}; no browser was launched)`);
} else {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (!executablePath) throw new Error('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required (or pass --html for a preview file)');
  const playwright = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await playwright.chromium.launch({ headless: true, chromiumSandbox: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await page.setContent(socialCardHtml(), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => ['Bungee', 'Archivo', 'Archivo Narrow'].map(family => document.fonts.check(`20px "${family}"`)));
    if (!loaded.every(Boolean)) throw new Error(`fonts not loaded: ${JSON.stringify(loaded)}`);
    const overflow = await page.evaluate(([w, h]) => [...document.querySelectorAll('.card *')].some(element => { const rect = element.getBoundingClientRect(); return rect.right > w || rect.bottom > h; }), [WIDTH, HEIGHT]);
    if (overflow) throw new Error(`card content overflows ${WIDTH}x${HEIGHT}`);
    await writeFile(output, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } }));
    console.log(`Wrote ${output}`);
  } finally {
    await browser.close();
  }
}
