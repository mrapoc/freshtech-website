import { readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse } from 'ultrahtml';
import { decodeEntities, normalise } from './lib/blog-rendered-text.mjs';
import { readComparisons } from './lib/comparison-reader.mjs';
import { inventoryIsClean, mainMarker, problemInventory } from './lib/problem-inventory.mjs';
import { readTestimonialData } from './lib/testimonial-reader.mjs';
import { FIXTURE_MODE, TESTIMONIALS_FIXTURE_ENV, resolveTestimonialsFixtureMode, syntheticTestimonialData } from './lib/testimonial-fixture.mjs';
import { checkRichBlock, checkSourceContact, checkTestimonials } from './problem-output-check.mjs';
import { loadRetainedReactHead } from './lib/retained-react-head.mjs';
import { DEFAULT_SOCIAL_IMAGE } from '../src/lib/social-image.mjs';

// Focused checker for the emitted root-slug comparison family
// (pages/ComparisonPage.tsx ported by src/components/ComparisonPage.astro).
// Expectations come from the fail-closed source projection read at run time
// (data/content.ts), the retained React Organization fixture and
// inline restatements of the React page's literals, table, recommendation rule,
// schema objects and components/SEO.tsx head formula. Nothing here imports the
// comparison display or SEO modules under test. The shared RichText,
// testimonials and contact contracts are the Problem checker's exported
// functions, which throw on the first difference.
// Family ownership is the data-comparison-page marker on the single <main>.
// Record content is compared, never printed.
//
// Usage: node scripts/comparison-output-check.mjs [dist-dir] [--testimonials-fixture]

const MARKER = 'data-comparison-page';
const FAMILY = 'comparisons';
const FIXTURE_FLAG = '--testimonials-fixture';
const BASE_URL = 'https://fresh-tech.uk';
const DEFAULT_IMAGE = DEFAULT_SOCIAL_IMAGE;
const LOGO_URL = 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png';
const STATIC_METADATA = {
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  'og:image': DEFAULT_IMAGE, 'og:image:width': '1200', 'og:image:height': '630', 'og:type': 'website', 'og:site_name': 'Fresh Tech IT Support', 'og:locale': 'en_GB',
  'twitter:card': 'summary_large_image', 'twitter:site': '@fresh_tech_', 'twitter:creator': '@fresh_tech_', 'twitter:image': DEFAULT_IMAGE,
};
const HTML_GZIP_BUDGET = 32 * 1024;
// pages/ComparisonPage.tsx literals.
const PHONE_HREF = 'tel:01584517234';
const CALL_LABEL = 'Call 01584 517 234';
const CONTACT_HREF = '/contact';
const SECTION_COPY = {
  options: ['The Options', 'A straightforward comparison of your choices'],
  table: ['Side-by-Side Comparison', 'Feature-by-feature breakdown'],
  faqs: ['Common Questions', 'Answers to questions we hear most often'],
};
const VERDICT_HEADING = 'Our Verdict';
const FINAL_HEADING = 'Ready to Make the Right Choice?';
const FINAL_COPY = "We'll assess your current setup and recommend the best approach for your business - with no obligation.";

const siteTitle = rawTitle => {
  const long = `${rawTitle} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${rawTitle} | Fresh Tech`;
  return short.length <= 65 ? short : rawTitle;
};
const prettify = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const faqAnswerText = answer => answer.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) throw new Error(message); };

const ELEMENT_NODE = 1;
const TEXT_NODE = 2;
const SKIPPED = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const INLINE = new Set(['a', 'abbr', 'b', 'code', 'em', 'i', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u']);
const walk = (node, callback) => { callback(node); for (const child of node.children ?? []) walk(child, callback); };
const tagName = node => (node.type === ELEMENT_NODE ? (node.name ?? '').toLowerCase() : '');
const find = (root, predicate) => { const out = []; walk(root, node => { if (node.type === ELEMENT_NODE && predicate(node)) out.push(node); }); return out; };
const byName = (root, name) => find(root, node => tagName(node) === name);
const attr = (node, name) => node.attributes?.[name];
const hasAttr = (node, name) => Object.keys(node.attributes ?? {}).some(key => key.toLowerCase() === name);
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name);
const byClass = (root, name) => find(root, node => hasClass(node, name));
const only = (nodes, message) => { expect(nodes.length === 1, message); return nodes[0]; };
const collectText = (node, out) => {
  if (node.type === TEXT_NODE) { out.push(decodeEntities(node.value ?? '')); return; }
  const name = tagName(node);
  if (SKIPPED.has(name)) return;
  const block = node.type === ELEMENT_NODE && !INLINE.has(name);
  if (block) out.push(' ');
  for (const child of node.children ?? []) collectText(child, out);
  if (block) out.push(' ');
};
const textOf = node => { const out = []; collectText(node, out); return normalise(out.join('')); };
const rawText = node => (node.children ?? []).map(child => (child.type === TEXT_NODE ? child.value ?? '' : rawText(child))).join('');
const decorativeSvgs = node => byName(node, 'svg').filter(svg => attr(svg, 'aria-hidden') === 'true');

function readHead(document) {
  const titles = byName(document, 'title');
  const canonicals = byName(document, 'link').filter(link => (attr(link, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical')).map(link => decodeEntities(attr(link, 'href') ?? ''));
  const metadata = {};
  for (const meta of byName(document, 'meta')) {
    const key = attr(meta, 'name') ?? attr(meta, 'property');
    const content = attr(meta, 'content');
    if (key && typeof content === 'string') metadata[key] = decodeEntities(content);
  }
  const scripts = byName(document, 'script').filter(script => attr(script, 'id') === 'json-ld-schema' && (attr(script, 'type') ?? '').toLowerCase() === 'application/ld+json');
  return { title: titles.length === 1 ? textOf(titles[0]) : null, canonicals, metadata, schemas: scripts.length === 1 ? JSON.parse(rawText(scripts[0])) : null };
}

const args = process.argv.slice(2);
for (const flag of args.filter(arg => arg.startsWith('--'))) if (flag !== FIXTURE_FLAG) throw new Error(`Unknown option ${flag}`);
const positional = args.filter(arg => !arg.startsWith('--'));
if (positional.length > 1) throw new Error('At most one dist directory may be given');
const fixtureMode = args.includes(FIXTURE_FLAG) || resolveTestimonialsFixtureMode(process.env[TESTIMONIALS_FIXTURE_ENV]) === FIXTURE_MODE;
const distDir = resolve(positional[0] ?? 'dist');
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(projectDir, '..', '..');

const contentSource = await readFile(resolve(repoDir, 'data', 'content.ts'), 'utf8');
const comparisons = readComparisons('data/content.ts', contentSource);
const slugs = comparisons.map(page => page.slug);
const reviewSource = fixtureMode ? syntheticTestimonialData() : readTestimonialData('data/content.ts', contentSource);
const retained = await loadRetainedReactHead();
const organization = retained.schemas[2];
expect(organization?.['@type'] === 'Organization', 'retained fixture no longer holds the Organization object at index 2');

const builtPages = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  const route = relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/');
  builtPages.push({ route, html: await readFile(resolve(entry.parentPath, entry.name), 'utf8') });
}
expect(builtPages.length > 0, `no built index.html pages found under ${distDir}; run the build first`);
// The body family marker belongs to comparison pages only.
for (const { route, html } of builtPages) {
  const owned = mainMarker(html, MARKER) !== null;
  const carriers = byName(parse(html), 'body').filter(body => attr(body, 'data-page-family') === FAMILY);
  if (owned) expect(carriers.length === 1, `/${route}: comparison page must have one body with data-page-family="${FAMILY}"`);
  else expect(carriers.length === 0, `/${route}: non-comparison page carries data-page-family="${FAMILY}"`);
}
const inventory = problemInventory(builtPages, slugs, MARKER);
expect(inventoryIsClean(inventory), `Built comparison inventory differs: ${JSON.stringify({ ...inventory, family: undefined })}`);

const oversized = [];
let tableCells = 0;
for (const page of comparisons) {
  const route = `/${page.slug}`;
  const canonical = `${BASE_URL}/${page.slug}`;
  const html = builtPages.find(built => built.route === page.slug).html;
  const document = parse(html);
  const gzip = gzipSync(Buffer.from(html, 'utf8')).length;
  if (gzip > HTML_GZIP_BUDGET) oversized.push(`${route} (${gzip} gzip bytes)`);

  const main = only(byName(document, 'main'), `${route}: expected exactly one main element`);
  expect(attr(main, 'id') === 'main-content' && attr(main, 'tabindex') === '-1' && attr(main, MARKER) === page.slug, `${route}: main landmark id, tabindex or marker differs`);
  expect(!byName(document, 'astro-island').length && !/\bdata-reactroot\b/i.test(html), `${route}: contains framework hydration markup`);
  expect(!textOf(only(byName(document, 'body'), `${route}: expected one body`)).includes('—'), `${route}: visible text contains an em dash`);
  for (const style of byName(document, 'style')) expect(!/\.pb-|data-page-family='problems'/.test(rawText(style)), `${route}: Problem family CSS leaked onto a comparison page`);
  expect(byName(document, 'style').some(style => rawText(style).includes('.cp-page')), `${route}: comparison stylesheet not inlined`);

  // Hero.
  const hero = only(byClass(main, 'cp-hero'), `${route}: expected one hero`);
  const crumbs = byName(only(byClass(hero, 'cp-breadcrumbs'), `${route}: breadcrumb missing`), 'li');
  expect(crumbs.length === 3, `${route}: breadcrumb item count differs`);
  [['/', 'Home'], ['/resources', 'Resources']].forEach(([href, label], index) => {
    const link = only(byName(crumbs[index], 'a'), `${route}: breadcrumb ${index} link missing`);
    expect(attr(link, 'href') === href && textOf(link) === label, `${route}: breadcrumb ${index} differs`);
  });
  const current = only(byName(crumbs[2], 'span'), `${route}: current breadcrumb missing`);
  expect(attr(current, 'aria-current') === 'page' && textOf(current) === normalise(page.h1), `${route}: current breadcrumb is not the unlinked h1`);
  const h1s = byName(document, 'h1');
  expect(h1s.length === 1 && textOf(h1s[0]) === normalise(page.h1) && find(hero, node => node === h1s[0]).length === 1, `${route}: H1 is not the single source h1 in the hero`);
  expect(textOf(only(byClass(hero, 'cp-hero-copy'), `${route}: intro missing`)) === normalise(page.intro), `${route}: intro differs`);
  const checkActions = (container, label) => {
    const links = byName(only(byClass(container, 'cp-actions'), `${route}: ${label} actions missing`), 'a');
    expect(links.length === 2, `${route}: ${label} must carry two actions`);
    expect(attr(links[0], 'href') === CONTACT_HREF && textOf(links[0]) === normalise(page.cta), `${route}: ${label} primary action is not the source cta to /contact`);
    expect(attr(links[1], 'href') === PHONE_HREF && textOf(links[1]) === CALL_LABEL, `${route}: ${label} secondary action is not the phone link`);
  };
  checkActions(hero, 'hero');

  const section = name => only(byClass(main, `cp-${name}`), `${route}: expected one ${name} section`);
  const checkHeading = (container, name) => {
    const header = only(byClass(container, 'cp-section-heading'), `${route}: ${name} heading missing`);
    expect(textOf(only(byName(header, 'h2'), `${route}: ${name} h2 missing`)) === SECTION_COPY[name][0] && textOf(only(byName(header, 'p'), `${route}: ${name} lead missing`)) === SECTION_COPY[name][1], `${route}: ${name} heading copy differs`);
  };

  // Options, including the recommendation rule and every pro, con and best-for.
  const options = section('options');
  checkHeading(options, 'options');
  const cards = byClass(only(byClass(options, 'cp-option-grid'), `${route}: option grid missing`), 'cp-option');
  expect(cards.length === page.options.length, `${route}: option count differs`);
  cards.forEach((card, index) => {
    const source = page.options[index];
    const recommended = index === page.options.length - 1 && page.options.length > 2;
    expect((attr(card, 'data-recommended') === 'true') === recommended && byClass(card, 'cp-badge').length === (recommended ? 1 : 0), `${route}: options[${index}] recommendation differs from the React rule`);
    if (recommended) expect(textOf(byClass(card, 'cp-badge')[0]) === 'Recommended', `${route}: options[${index}] badge copy differs`);
    expect(decorativeSvgs(only(byClass(card, 'cp-option-icon'), `${route}: options[${index}] icon missing`)).length === 1, `${route}: options[${index}] icon is not one decorative SVG`);
    expect(textOf(only(byName(card, 'h3'), `${route}: options[${index}] name missing`)) === normalise(source.name), `${route}: options[${index}].name differs`);
    expect(textOf(only(byClass(card, 'cp-option-desc'), `${route}: options[${index}] desc missing`)) === normalise(source.desc), `${route}: options[${index}].desc differs`);
    const headings = byName(card, 'h4').map(textOf);
    expect(headings.join('|') === 'Advantages|Disadvantages', `${route}: options[${index}] list headings differ`);
    for (const [key, className] of [['pros', 'cp-pros'], ['cons', 'cp-cons']]) {
      const items = byName(only(byClass(card, className), `${route}: options[${index}].${key} list missing`), 'li');
      expect(items.length === source[key].length, `${route}: options[${index}].${key} count differs`);
      items.forEach((item, itemIndex) => {
        expect(decorativeSvgs(item).length === 1 && textOf(item) === normalise(source[key][itemIndex]), `${route}: options[${index}].${key}[${itemIndex}] differs`);
      });
    }
    expect(textOf(only(byClass(card, 'cp-best-for'), `${route}: options[${index}] best-for missing`)) === normalise(`Best for: ${source.bestFor}`), `${route}: options[${index}].bestFor differs`);
  });

  // Table: every header and every cell, positionally.
  const tableSection = section('table-section');
  checkHeading(tableSection, 'table');
  const scroller = only(byClass(tableSection, 'cp-table-scroll'), `${route}: table scroll region missing`);
  const headingId = attr(only(byName(only(byClass(tableSection, 'cp-section-heading'), `${route}: table heading missing`), 'h2'), `${route}: table h2 missing`), 'id');
  expect(attr(scroller, 'role') === 'region' && attr(scroller, 'tabindex') === '0' && headingId && attr(scroller, 'aria-labelledby') === headingId, `${route}: table scroll region is not a labelled focusable region`);
  const table = only(byName(scroller, 'table'), `${route}: table missing`);
  const headerCells = byName(only(byName(table, 'thead'), `${route}: thead missing`), 'th');
  expect(headerCells.map(textOf).join('|') === ['Feature', ...page.options.map(option => normalise(option.name))].join('|') && headerCells.every(cell => attr(cell, 'scope') === 'col'), `${route}: table header differs`);
  const rows = byName(only(byName(table, 'tbody'), `${route}: tbody missing`), 'tr');
  expect(rows.length === page.comparisonRows.length, `${route}: table row count differs`);
  rows.forEach((row, index) => {
    const source = page.comparisonRows[index];
    const feature = only(byName(row, 'th'), `${route}: comparisonRows[${index}] feature missing`);
    expect(attr(feature, 'scope') === 'row' && textOf(feature) === normalise(source.feature), `${route}: comparisonRows[${index}].feature differs`);
    const cells = byName(row, 'td');
    expect(cells.length === source.values.length, `${route}: comparisonRows[${index}] cell count differs`);
    cells.forEach((cell, cellIndex) => { tableCells++; expect(textOf(cell) === normalise(source.values[cellIndex]), `${route}: comparisonRows[${index}].values[${cellIndex}] differs`); });
  });

  // Verdict, content and FAQs.
  const verdict = only(byClass(section('verdict-section'), 'cp-verdict'), `${route}: verdict missing`);
  expect(textOf(only(byName(verdict, 'h2'), `${route}: verdict heading missing`)) === VERDICT_HEADING, `${route}: verdict heading differs`);
  checkRichBlock(route, 'verdict', only(byClass(verdict, 'cp-verdict-copy'), `${route}: verdict copy missing`), page.verdict);
  checkRichBlock(route, 'content', only(byClass(section('content'), 'cp-content-copy'), `${route}: content missing`), page.content);
  const faqSection = section('faqs');
  checkHeading(faqSection, 'faqs');
  const details = byName(faqSection, 'details');
  expect(details.length === page.faqs.length, `${route}: FAQ count differs`);
  details.forEach((item, index) => {
    expect(attr(item, 'name') === 'comparison-faq' && !hasAttr(item, 'open'), `${route}: faqs[${index}] is not a closed disclosure in the FAQ group`);
    const summary = only(byName(item, 'summary'), `${route}: faqs[${index}] summary missing`);
    expect(textOf(only(byName(summary, 'span'), `${route}: faqs[${index}] question missing`)) === normalise(page.faqs[index].q) && decorativeSvgs(summary).length === 2, `${route}: faqs[${index}].q or chevrons differ`);
    checkRichBlock(route, `faqs[${index}].a`, only(byClass(item, 'cp-faq-answer'), `${route}: faqs[${index}] answer missing`), page.faqs[index].a);
  });

  const final = section('final');
  expect(textOf(only(byName(final, 'h2'), `${route}: closing heading missing`)) === FINAL_HEADING && textOf(only(byClass(final, 'cp-final-copy'), `${route}: closing copy missing`)) === FINAL_COPY, `${route}: closing copy differs`);
  checkActions(final, 'closing');

  checkTestimonials(route, document, main, reviewSource, fixtureMode);
  checkSourceContact(route, document, main, html);

  // Head.
  const head = readHead(document);
  const title = siteTitle(page.title);
  expect(head.title === normalise(title), `${route}: title differs from the React head formula`);
  expect(head.canonicals.length === 1 && head.canonicals[0] === canonical, `${route}: canonical differs`);
  const expectedMetadata = { ...STATIC_METADATA, description: page.metaDesc, 'og:title': title, 'twitter:title': title, 'og:description': page.metaDesc, 'twitter:description': page.metaDesc, 'og:url': canonical };
  for (const [key, value] of Object.entries(expectedMetadata)) expect(head.metadata[key] === value, `${route}: metadata ${key} differs`);
  const expectedSchemas = [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: page.h1, description: page.metaDesc,
      author: { '@type': 'Organization', name: 'Fresh Tech' },
      publisher: { '@type': 'Organization', name: 'Fresh Tech', logo: { '@type': 'ImageObject', url: LOGO_URL } },
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(faq.a) } })) },
    organization,
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` }, { '@type': 'ListItem', position: 2, name: prettify(page.slug), item: canonical }] },
  ];
  expect(JSON.stringify(head.schemas) === JSON.stringify(expectedSchemas), `${route}: JSON-LD differs from the React Article, FAQPage, Organization and breadcrumb graph`);
}

console.log(`${comparisons.length} root-slug comparison routes verified (${slugs.join(', ')}): ${assertions} comparison assertions passed plus the shared RichText, testimonials and contact contracts; ${tableCells} table cells compared; testimonials against the ${fixtureMode ? 'synthetic fixture' : 'run-time source projection'}`);
if (oversized.length) console.warn(`Warning: route(s) exceed the ${HTML_GZIP_BUDGET}-byte gzip HTML budget:\n  ${oversized.join('\n  ')}`);
