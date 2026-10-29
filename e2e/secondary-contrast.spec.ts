import { test, expect, goto, type Page } from './helpers';

// Rendered-colour WCAG AA check for two secondary v2 pages. The measurement is
// the same algorithm as contrast.spec.ts (which keeps it file-local); a text
// node is only certified when every ancestor up to an opaque background-color
// has no background-image and no opacity group above the first background
// layer. Anything else is skipped with a reason, never passed.
interface Sample { text: string; ratio: number; min: number; fg: string; bg: string; size: number; weight: number }
interface Skipped { text: string; reason: string }
interface Result { samples: Sample[]; skipped: Skipped[] }

async function settle(page: Page) {
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
        const label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);

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

const describe = (s: Sample) => `${s.ratio.toFixed(3)}:1 < ${s.min} "${s.text}" ${s.fg} on ${s.bg} ${s.size}px/${s.weight}`;
const failures = (samples: Sample[]) => samples.filter(s => s.ratio < s.min);
const find = (samples: Sample[], text: string) => samples.find(s => s.text.includes(text));

// Brand blues. Text painted in either must pass on whatever it actually sits on.
const BLUES = ['#3288be', '#1f5c8c'];

// Combinations these changes target: each must be measured (not skipped) and pass.
// The shared EmailCheckerTool (components-v2) is now included; its orange
// button, grey privacy note and blue privacy link are fixed and named below.
const PAGES: { path: string; must: string[] }[] = [
  { path: '/microsoft-business-premium', must: [
    'Microsoft 365', 'What you get', 'Standard vs Premium', 'Honest take',
    'Feature', 'Maybe skip if',
  ] },
  { path: '/email-security-guide', must: [
    'Not a sales pitch', 'See it for yourself', 'The three that matter', 'DKIM', 'Nice to have', 'The cost and effort',
    'Not just security', 'Do it yourself', '01', '06', 'Beyond the free basics', 'Microsoft 365 Business Premium page',
    'Run my free check', 'privacy policy', 'What happens without it', 'The one that does the blocking',
  ] },
];

for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
  for (const { path, must } of PAGES) {
    test(`${path} measured text meets WCAG AA contrast (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await goto(page, path);
      await page.screenshot({ path: test.info().outputPath(`${name}${path.replace(/\//g, '-')}.png`), fullPage: true, scale: 'css' });
      const { samples, skipped } = await measure(page, 'main');
      const failed = failures(samples);
      test.info().annotations.push(
        { type: 'skipped-text', description: skipped.map(s => `${s.text} (${s.reason})`).join('; ') },
        { type: 'all-failures', description: failed.map(describe).join('; ') || 'none' },
      );
      console.log([`[${name}] ${path}: measured ${samples.length}, skipped ${skipped.length}, failing ${failed.length}`, ...failed.map(f => `  - ${describe(f)}`)].join('\n'));
      for (const text of must) {
        const s = find(samples, text);
        expect(s, `"${text}" measured, not skipped`).toBeDefined();
        expect(s!.ratio, `"${text}" ${s!.fg} on ${s!.bg} ${s!.size}px/${s!.weight}`).toBeGreaterThanOrEqual(s!.min);
      }
      expect(samples.length).toBeGreaterThan(30);
      expect(failed.filter(f => BLUES.includes(f.fg) || BLUES.includes(f.bg)).map(describe)).toEqual([]);
      // Every certifiably measured sample must meet its own AA threshold. Skipped
      // text is still reported above but is never counted as a pass.
      expect(failed.map(describe)).toEqual([]);
    });
  }
}
