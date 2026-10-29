import { test, expect, goto, type Page } from './helpers';

// Reads rendered colours from the DOM and checks WCAG AA contrast (4.5:1 normal
// text, 3:1 large text) against unrounded ratios. A text node is only certified
// when every ancestor up to an opaque background-color has no background-image
// (images and gradients paint above background-color) and no ancestor above the
// first background layer has opacity < 1 (an opacity group composites the
// background and the text together over something we cannot see from here).
// Everything else is reported as skipped with its reason rather than passed.
interface Sample { text: string; ratio: number; min: number; fg: string; bg: string; size: number; weight: number }
interface Skipped { text: string; reason: string }
interface Result { samples: Sample[]; skipped: Skipped[] }

async function settle(page: Page) {
  // Wait for finite animations only; infinite ones (pulses) would never resolve.
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations()
      .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
      .map(a => a.finished.catch(() => undefined))),
    new Promise(r => setTimeout(r, 2000)),
  ]));
}

async function measure(page: Page, rootSelector: string): Promise<Result> {
  await settle(page);
  return page.evaluate((selector) => {
    const parse = (s: string): [number, number, number, number] | null => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const over = (top: number[], a: number, under: number[]) => top.map((c, i) => c * a + under[i] * (1 - a));
    const lum = (c: number[]) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const hex = (c: number[]) => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

    const samples: Sample[] = [];
    const skipped: Skipped[] = [];
    const seen = new Set<Element>();
    for (const root of Array.from(document.querySelectorAll(selector))) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = (node.textContent || '').trim();
        const el = node.parentElement;
        if (!el || text.length < 2 || seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        // Label by the element's whole text so split text nodes (e.g. "© {year} …") stay findable.
        const label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);

        // Phase 1: walk up to the first opaque background-color, collecting
        // translucent layers and text-only opacity on the way.
        let bg: number[] | null = null;
        let alpha = parseFloat(cs.opacity);
        let reason = '';
        const layers: [number[], number][] = [];
        let cur: Element | null = el;
        let sawLayer = false;
        while (cur) {
          const s = getComputedStyle(cur);
          if (s.backgroundImage !== 'none') { reason = `background-image on <${cur.tagName.toLowerCase()}>`; break; }
          const op = cur === el ? 1 : parseFloat(s.opacity);
          if (op < 1) {
            if (sawLayer) { reason = 'opacity group above a background layer'; break; }
            alpha *= op;
          }
          const c = parse(s.backgroundColor);
          if (c && c[3] > 0) {
            if (parseFloat(s.opacity) < 1) { reason = 'opacity on a background layer'; break; }
            sawLayer = true;
            if (c[3] >= 1) { bg = c.slice(0, 3); break; }
            layers.unshift([c.slice(0, 3), c[3]]);
          }
          cur = cur.parentElement;
        }
        if (!reason && !bg) reason = 'no opaque background found';
        // Phase 2: any opacity < 1 above the opaque background composites
        // background and text together; we cannot certify that from here.
        if (!reason && cur) {
          for (let up = cur.parentElement; up; up = up.parentElement) {
            if (parseFloat(getComputedStyle(up).opacity) < 1) { reason = 'opacity group above opaque background'; break; }
          }
        }
        if (reason || !bg) { skipped.push({ text: label, reason: reason || 'unresolved' }); continue; }
        for (const [c, a] of layers) bg = over(c, a, bg);
        const fgRaw = parse(cs.color);
        if (!fgRaw) { skipped.push({ text: label, reason: 'unparsable color' }); continue; }
        const fg = over(fgRaw.slice(0, 3), fgRaw[3] * alpha, bg);
        const size = parseFloat(cs.fontSize);
        const weight = parseInt(cs.fontWeight, 10);
        const large = size >= 24 || (weight >= 700 && size >= 18.66);
        samples.push({ text: label, ratio: ratio(fg, bg), min: large ? 3 : 4.5, fg: hex(fg), bg: hex(bg), size, weight });
      }
    }
    return { samples, skipped };
  }, rootSelector);
}

const failures = (samples: Sample[]) =>
  samples.filter(s => s.ratio < s.min).map(s => `${s.ratio.toFixed(3)}:1 < ${s.min} "${s.text}" ${s.fg} on ${s.bg} ${s.size}px/${s.weight}`);

const find = (samples: Sample[], text: string) => samples.find(s => s.text.includes(text));

// Cases PageSpeed flagged: each must be measured (not skipped) and pass.
const FLAGGED = ['Get an Instant Quote', 'Takes 90 seconds', 'Most popular', 'Shrop', 'Browse by county', 'Livesey', 'Fresh Tech I.T. Specialists', 'Cookies', 'Cookie settings'];

for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
  test(`homepage text on solid backgrounds meets WCAG AA contrast (${name})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goto(page, '/');
    const { samples, skipped } = await measure(page, 'main, footer');
    test.info().annotations.push({ type: 'skipped-text', description: skipped.map(s => `${s.text} (${s.reason})`).join('; ') });
    console.log([`[${name}] measured ${samples.length}, skipped ${skipped.length}:`, ...skipped.map(s => `  - ${s.text} (${s.reason})`)].join('\n'));
    for (const text of FLAGGED) {
      const s = find(samples, text);
      expect(s, `"${text}" measured, not skipped`).toBeDefined();
      expect(s!.ratio, `"${text}" ${s!.fg} on ${s!.bg}`).toBeGreaterThanOrEqual(s!.min);
    }
    expect(samples.length).toBeGreaterThan(50);
    expect(samples.some(s => s.text === 'Shrop'), 'actual county label measured').toBe(true);
    expect(failures(samples)).toEqual([]);
  });

  test(`navigation booking button meets WCAG AA contrast (${name})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goto(page, '/');
    if (name === 'phone') await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const { samples } = await measure(page, name === 'phone' ? 'header + div a[href="/contact"]' : 'header a[href="/contact"]');
    expect(samples.some(s => /Book a.*call/i.test(s.text)), 'booking CTA measured').toBe(true);
    expect(failures(samples)).toEqual([]);
  });
}

test('reviews section paper text passes over the worst-case gradient stop plus halftone dot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await goto(page, '/');
  const heading = page.getByRole('heading', { name: 'Selected customer reviews' });
  const result = await heading.evaluate(h => {
    const section = h.closest('section')!;
    const s = getComputedStyle(section);
    const rgb = (str: string) => Array.from(str.matchAll(/rgba?\(([^)]+)\)/g)).map(m => m[1].split(/[\s,/]+/).filter(Boolean).map(Number));
    // Solid stops (alpha 1) are gradient colours; translucent ones are the halftone dots.
    const colours = rgb(s.backgroundImage);
    const stops = colours.filter(c => c.length === 3 || c[3] === 1).map(c => c.slice(0, 3));
    const dots = colours.filter(c => c.length === 4 && c[3] < 1);
    const texts = ['In their own words', 'Read customer feedback', 'Google reviews', 'Ludlow Nut'].map(t => {
      const el = Array.from(section.querySelectorAll<HTMLElement>('*')).find(e => e.childElementCount === 0 && (e.textContent || '').includes(t));
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { t, color: cs.color, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) };
    });
    const rating = Array.from(section.querySelectorAll<HTMLElement>('div')).find(e => e.childElementCount === 0 && parseFloat(getComputedStyle(e).fontSize) >= 48);
    const r = rating ? getComputedStyle(rating) : null;
    return { backgroundColor: s.backgroundColor, stops, dots, texts, rating: r ? { color: r.color, size: parseFloat(r.fontSize) } : null };
  });
  expect(result.stops.length, 'gradient stops parsed from rendered CSS').toBeGreaterThanOrEqual(2);
  expect(result.dots.length, 'halftone dot colour parsed from rendered CSS').toBeGreaterThanOrEqual(1);

  const parse = (s: string) => s.match(/rgba?\(([^)]+)\)/)![1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const over = (top: number[], a: number, under: number[]) => top.map((c, i) => c * a + under[i] * (1 - a));
  // Candidate backgrounds: each solid stop, the background-color, and each dot composited over each of them.
  const bases = [...result.stops, parse(result.backgroundColor).slice(0, 3)];
  const candidates = [...bases, ...bases.flatMap(b => result.dots.map(d => over(d.slice(0, 3), d[3], b)))];

  for (const t of result.texts) {
    expect(t, 'reviews text located').not.toBeNull();
    const fg = parse(t!.color).slice(0, 3);
    const large = t!.size >= 24 || (t!.weight >= 700 && t!.size >= 18.66);
    const worst = Math.min(...candidates.map(bg => ratio(fg, bg)));
    expect(worst, `"${t!.t}" worst-case ${worst.toFixed(3)}:1`).toBeGreaterThanOrEqual(large ? 3 : 4.5);
  }
  expect(result.rating, 'large rating figure located').not.toBeNull();
  const ratingWorst = Math.min(...candidates.map(bg => ratio(parse(result.rating!.color).slice(0, 3), bg)));
  expect(ratingWorst, `rating worst-case ${ratingWorst.toFixed(3)}:1 (large text)`).toBeGreaterThanOrEqual(3);
});

test('cookie preferences dialog meets WCAG AA contrast', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await goto(page, '/contact');
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const { samples } = await measure(page, '[role="dialog"]');
  const link = find(samples, 'cookie policy');
  expect(link, 'cookie policy link measured').toBeDefined();
  expect(link!.ratio).toBeGreaterThanOrEqual(4.5);
  expect(failures(samples)).toEqual([]);
});
