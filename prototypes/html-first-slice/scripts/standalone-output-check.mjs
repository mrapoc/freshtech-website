import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPage } from './lib/standalone-baseline.mjs';
import { STANDALONE_DIFFERENCES } from './lib/standalone-differences.mjs';
import { STANDALONE_ROUTES } from './lib/standalone-routes.mjs';
import { applyPublicProofReview } from './lib/public-proof-review.mjs';
import { substituteRetainedHead } from './lib/retained-react-head.mjs';

// Parity gate for native standalone pages. Each ported route (a dist page whose
// single <main> carries data-standalone-page) is compared with the production
// baseline captured from the production React site before it was retired:
//   - head title, description, canonical, og:type, og:image and the JSON-LD graph are equal;
//   - robots is the preview noindex default;
//   - main headings, links, images and normalised visible text are equal after
//     applying only the documented per-route differences in standalone-differences.mjs.
// Images compare by Cloudinary asset path so resized delivery is allowed.
// Routes not yet ported are listed, never silently passed.
// Usage: node scripts/standalone-output-check.mjs [dist-dir]
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(process.argv[2] ?? 'dist');
const MARKER = 'data-standalone-page';
let assertions = 0;
const failures = [];
const expect = (condition, message) => { assertions++; if (!condition) failures.push(message); };
const assetPath = src => src.replace(/^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/(?:[a-z]_[^/]*\/)*/, '');
const firstDifference = (a, b) => {
  const index = [...Array(Math.max(a.length, b.length)).keys()].find(i => JSON.stringify(a[i]) !== JSON.stringify(b[i]));
  return index === undefined ? null : `at ${index}: native ${JSON.stringify(a[index])} vs baseline ${JSON.stringify(b[index])}`;
};
const textDifference = (a, b) => {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `at char ${i}: native "${a.slice(Math.max(0, i - 40), i + 60)}" vs baseline "${b.slice(Math.max(0, i - 40), i + 60)}"`;
};

const ported = [];
const pending = [];
for (const entry of STANDALONE_ROUTES) {
  const file = resolve(distDir, entry.route.slice(1), 'index.html');
  if (!(await stat(file).catch(() => null))?.isFile()) { pending.push(entry.route); continue; }
  const html = await readFile(file, 'utf8');
  if (!new RegExp(`<main[^>]*\\s${MARKER}="${entry.name}"`).test(html)) { pending.push(entry.route); continue; }
  ported.push(entry.route);
  const route = entry.route;
  // Baselines were captured with the retired superheroes social image; the
  // current site-wide default is substituted (og:image and LocalBusiness image).
  const fixture = JSON.parse(substituteRetainedHead(await readFile(resolve(projectDir, 'test-fixtures', 'standalone', `${entry.name}.json`), 'utf8')));
  const native = extractPage(html);
  const differences = STANDALONE_DIFFERENCES[route] ?? {};
  const baseline = structuredClone(fixture);
  for (const [from, to] of differences.text ?? []) {
    expect(baseline.content.text.includes(from), `${route}: documented text difference no longer matches the baseline: "${from.slice(0, 60)}"`);
    baseline.content.text = baseline.content.text.replace(from, to);
  }
  for (const key of ['headings', 'links', 'images']) if (differences[key]) baseline.content[key] = differences[key](baseline.content[key]);
  applyPublicProofReview(route, baseline);

  for (const key of ['title', 'description', 'canonical', 'ogType', 'ogImage']) expect(native.head[key] === baseline.head[key], `${route}: head ${key} "${native.head[key]}" differs from production "${baseline.head[key]}"`);
  expect(native.head.robots === 'noindex, nofollow', `${route}: preview robots should be the noindex default`);
  expect(JSON.stringify(native.head.schemas) === JSON.stringify(baseline.head.schemas), `${route}: JSON-LD differs from production ${firstDifference(native.head.schemas, baseline.head.schemas)}`);
  expect(JSON.stringify(native.content.headings) === JSON.stringify(baseline.content.headings), `${route}: headings differ ${firstDifference(native.content.headings, baseline.content.headings)}`);
  expect(JSON.stringify(native.content.links) === JSON.stringify(baseline.content.links), `${route}: links differ ${firstDifference(native.content.links, baseline.content.links)}`);
  const images = list => list.map(([src, alt]) => [assetPath(src), alt]);
  expect(JSON.stringify(images(native.content.images)) === JSON.stringify(images(baseline.content.images)), `${route}: images differ ${firstDifference(images(native.content.images), images(baseline.content.images))}`);
  expect(native.content.text === baseline.content.text, `${route}: visible text differs ${textDifference(native.content.text, baseline.content.text)}`);
  expect(!native.content.text.includes('—'), `${route}: visible text contains an em dash`);
}

if (failures.length) {
  console.error(`${failures.length} standalone parity failures across ${assertions} assertions:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`${ported.length} standalone routes match production (${assertions} assertions); ${pending.length} not yet ported: ${pending.join(', ')}`);
