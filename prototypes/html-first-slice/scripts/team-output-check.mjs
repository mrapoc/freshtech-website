import { readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'ultrahtml';
import { decodeEntities, normalise } from './lib/blog-rendered-text.mjs';
import { publicationOf, readBlogPosts } from './lib/blog-reader.mjs';
import { inspectMarker } from './lib/problem-inventory.mjs';
import { readTeamMembers } from './lib/team-reader.mjs';
import { loadRetainedReactHead } from './lib/retained-react-head.mjs';

// Focused checker for /team/[slug] (pages/AuthorPage.tsx ported by
// src/components/TeamPage.astro). Expectations come from the fail-closed source
// projections read at run time (teamMembers and published blogPosts from
// data/content.ts with data/editorial-holds.json, using the publication date the
// build recorded), the retained Organization fixture, and inline restatements of
// AuthorPage's literals, sort, reading-time formula, Person schema and the
// SEO.tsx head formula. Nothing here imports the team display or SEO modules.
// Usage: node scripts/team-output-check.mjs [dist-dir]

const MARKER = 'data-team-page';
const BASE_URL = 'https://fresh-tech.uk';
const PREVIEW_ROBOTS = 'noindex, nofollow';
let assertions = 0;
const expect = (condition, message) => { assertions++; if (!condition) throw new Error(message); };

const ELEMENT_NODE = 1;
const TEXT_NODE = 2;
const SKIPPED = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const INLINE = new Set(['a', 'b', 'em', 'i', 'small', 'span', 'strong']);
const walk = (node, callback) => { callback(node); for (const child of node.children ?? []) walk(child, callback); };
const tagName = node => (node.type === ELEMENT_NODE ? (node.name ?? '').toLowerCase() : '');
const find = (root, predicate) => { const out = []; walk(root, node => { if (node.type === ELEMENT_NODE && predicate(node)) out.push(node); }); return out; };
const byName = (root, name) => find(root, node => tagName(node) === name);
const attr = (node, name) => node.attributes?.[name];
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
const decorative = node => byName(node, 'svg').every(svg => attr(svg, 'aria-hidden') === 'true');
const siteTitle = raw => ((`${raw} | Fresh Tech IT Support`).length <= 65 ? `${raw} | Fresh Tech IT Support` : (`${raw} | Fresh Tech`).length <= 65 ? `${raw} | Fresh Tech` : raw);
const readingTime = content => `${Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(word => word.length > 0).length / 200))} min read`;
const CLOUDINARY_IMAGE = /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/(?:f_auto,q_auto\/)?/;
// Resized delivery must keep the source image path; any other URL (for example
// a video poster frame under /video/upload/) is emitted unchanged.
const sameImage = (emitted, source) => (CLOUDINARY_IMAGE.test(source) ? emitted.endsWith(`/${source.replace(CLOUDINARY_IMAGE, '')}`) : emitted === source);

const distDir = resolve(process.argv[2] ?? 'dist');
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(projectDir, '..', '..');
const contentSource = await readFile(resolve(repoDir, 'data', 'content.ts'), 'utf8');
const members = readTeamMembers('data/content.ts', contentSource);
const holds = JSON.parse(await readFile(resolve(repoDir, 'data', 'editorial-holds.json'), 'utf8'));
const { blogPublication } = await import('../src/generated/blog-data.mjs');
const published = publicationOf(readBlogPosts('data/content.ts', contentSource), { heldSlugs: new Set(holds.slugs), asOf: blogPublication.asOf }).published;
const organization = (await loadRetainedReactHead()).schemas[2];
expect(organization?.['@type'] === 'Organization', 'retained fixture no longer holds the Organization object at index 2');

const builtPages = [];
for (const entry of await readdir(distDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name !== 'index.html') continue;
  builtPages.push({ route: relative(distDir, entry.parentPath).split(sep).filter(Boolean).join('/'), html: await readFile(resolve(entry.parentPath, entry.name), 'utf8') });
}
// Ownership is the marker on the single <main>; the emitted directory must be team/<marker>.
const owned = builtPages.map(page => ({ ...page, inspection: inspectMarker(page.html, MARKER) })).filter(page => page.inspection.marker !== null || page.inspection.strayMarkers || page.inspection.emptyMarkers);
for (const page of owned) {
  const { mains, marker, strayMarkers, emptyMarkers } = page.inspection;
  expect(mains === 1 && !strayMarkers && !emptyMarkers && page.route === `team/${marker}`, `/${page.route}: invalid ${MARKER} marker or route`);
}
for (const page of builtPages) if (!page.route.startsWith('team/')) expect(!/<body[^>]*data-page-family="team"/.test(page.html), `/${page.route}: non-team page carries the team body marker`);
expect(JSON.stringify(owned.map(page => page.route).sort()) === JSON.stringify(members.map(member => `team/${member.slug}`).sort()), `team inventory differs: [${owned.map(page => page.route).join(', ')}]`);

let cards = 0;
for (const member of members) {
  const route = `/team/${member.slug}`;
  const canonical = `${BASE_URL}${route}`;
  const html = builtPages.find(page => page.route === `team/${member.slug}`).html;
  const document = parse(html);
  const main = only(byName(document, 'main'), `${route}: expected one main`);
  expect(attr(main, MARKER) === member.slug && attr(main, 'id') === 'main-content' && attr(main, 'tabindex') === '-1', `${route}: main landmark or marker differs`);
  expect(!byName(document, 'astro-island').length, `${route}: hydration markup emitted`);
  expect(attr(only(byName(document, 'body'), `${route}: expected one body`), 'data-page-family') === 'team', `${route}: body lacks the team font-isolation marker`);
  expect(!textOf(only(byName(document, 'body'), `${route}: expected one body`)).includes('—'), `${route}: visible text contains an em dash`);

  const crumbs = byName(only(byClass(main, 'team-breadcrumbs'), `${route}: breadcrumb missing`), 'li');
  expect(crumbs.length === 3 && attr(only(byName(crumbs[0], 'a'), `${route}: home crumb`), 'href') === '/' && attr(only(byName(crumbs[1], 'a'), `${route}: about crumb`), 'href') === '/about' && textOf(crumbs[1]) === 'About', `${route}: breadcrumb differs from Home > About`);
  expect(attr(only(byName(crumbs[2], 'span'), `${route}: current crumb`), 'aria-current') === 'page' && textOf(crumbs[2]) === normalise(member.name), `${route}: current crumb is not the unlinked name`);
  const h1s = byName(document, 'h1');
  expect(h1s.length === 1 && textOf(h1s[0]) === normalise(member.name), `${route}: H1 is not the single member name`);
  const portrait = only(byName(only(byClass(main, 'team-portrait'), `${route}: portrait missing`), 'img'), `${route}: portrait image missing`);
  expect(attr(portrait, 'alt') === member.name && sameImage(decodeEntities(attr(portrait, 'src') ?? ''), member.imgUnmasked) && attr(portrait, 'width') === '256' && attr(portrait, 'height') === '256', `${route}: portrait is not imgUnmasked with the name as alt and reserved dimensions`);
  expect(textOf(only(byClass(main, 'team-power'), `${route}: power missing`)) === normalise(member.power), `${route}: power differs`);
  expect(textOf(only(byClass(main, 'team-role'), `${route}: role missing`)) === normalise(member.role), `${route}: role differs`);
  expect(textOf(only(byClass(main, 'team-bio'), `${route}: bio missing`)) === normalise(member.extendedBio), `${route}: extendedBio differs`);
  const skills = byName(only(byClass(main, 'team-expertise'), `${route}: expertise missing`), 'li');
  expect(skills.length === member.expertise.length && skills.every((item, index) => textOf(item) === normalise(member.expertise[index]) && byName(item, 'svg').length === 1 && decorative(item)), `${route}: expertise tags differ from the source order or icons are not decorative`);
  const linkedin = byClass(main, 'team-linkedin');
  if (member.linkedin) expect(linkedin.length === 1 && attr(linkedin[0], 'href') === member.linkedin && attr(linkedin[0], 'target') === '_blank' && attr(linkedin[0], 'rel') === 'noopener noreferrer' && textOf(linkedin[0]) === 'Connect on LinkedIn', `${route}: LinkedIn link differs`);
  else expect(linkedin.length === 0 && !html.includes('linkedin.com/in/'), `${route}: LinkedIn link rendered without a source profile`);

  const expectedPosts = published.filter(post => post.author === member.shortName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const articles = only(byClass(main, 'team-articles'), `${route}: articles section missing`);
  expect(textOf(only(byName(articles, 'h2'), `${route}: articles heading missing`)) === `Articles by ${normalise(member.shortName)} (${expectedPosts.length})`, `${route}: articles heading or count differs`);
  const links = byClass(articles, 'team-card');
  expect(links.length === expectedPosts.length, `${route}: article card count differs from the published posts by ${member.shortName}`);
  expect(byClass(articles, 'team-empty').length === (expectedPosts.length ? 0 : 1), `${route}: empty state presence differs`);
  links.forEach((link, index) => {
    const post = expectedPosts[index];
    cards++;
    expect(attr(link, 'href') === `/blog/${post.slug}`, `${route}: card ${index} links to the wrong post`);
    expect(textOf(only(byName(link, 'h3'), `${route}: card ${index} title missing`)) === normalise(post.title), `${route}: card ${index} title differs`);
    expect(textOf(only(byClass(link, 'team-excerpt'), `${route}: card ${index} excerpt missing`)) === normalise(post.excerpt), `${route}: card ${index} excerpt differs`);
    expect((only(byClass(link, 'team-tags'), `${route}: card ${index} tags missing`).children ?? []).filter(child => tagName(child) === 'span').map(textOf).join('|') === post.tags.slice(0, 2).map(normalise).join('|'), `${route}: card ${index} tags differ from the first two source tags`);
    expect((only(byClass(link, 'team-meta'), `${route}: card ${index} meta missing`).children ?? []).filter(child => tagName(child) === 'span').map(textOf).join('|') === [normalise(post.date), readingTime(post.content), 'Read'].join('|') && decorative(link), `${route}: card ${index} date, reading time or read label differs`);
    const images = byName(link, 'img');
    if (post.image) expect(images.length === 1 && attr(images[0], 'alt') === post.title && sameImage(decodeEntities(attr(images[0], 'src') ?? ''), post.image) && attr(images[0], 'loading') === 'lazy', `${route}: card ${index} image differs from the post image`);
    else expect(images.length === 0, `${route}: card ${index} renders an image the post does not have`);
  });

  const cta = only(byClass(main, 'team-cta'), `${route}: CTA missing`);
  expect(textOf(only(byName(cta, 'h3'), `${route}: CTA heading missing`)) === `Want to work with ${normalise(member.shortName)}?`, `${route}: CTA heading differs`);
  expect(textOf(only(byName(cta, 'p'), `${route}: CTA copy missing`)) === 'Get in touch to discuss how Fresh Tech can help your business with IT support, cybersecurity, and technology strategy.', `${route}: CTA copy differs`);
  const button = only(byName(cta, 'a'), `${route}: CTA link missing`);
  expect(attr(button, 'href') === '/contact' && textOf(button) === 'Get in Touch', `${route}: CTA link differs`);

  const title = siteTitle(`${member.name} - ${member.role}`);
  const description = `${member.extendedBio.slice(0, 155)}...`;
  const meta = {};
  for (const node of byName(document, 'meta')) { const key = attr(node, 'name') ?? attr(node, 'property'); if (key) meta[key] = decodeEntities(attr(node, 'content') ?? ''); }
  expect(textOf(only(byName(document, 'title'), `${route}: title missing`)) === normalise(title), `${route}: title differs`);
  const canonicals = byName(document, 'link').filter(link => attr(link, 'rel') === 'canonical');
  expect(canonicals.length === 1 && attr(canonicals[0], 'href') === canonical, `${route}: canonical differs`);
  for (const [key, value] of Object.entries({ description, robots: PREVIEW_ROBOTS, 'og:type': 'profile', 'og:title': title, 'og:description': description, 'og:url': canonical, 'og:image': member.imgUnmasked, 'twitter:image': member.imgUnmasked })) {
    expect(meta[key] === value, `${route}: metadata ${key} differs`);
  }
  const schemaScript = only(byName(document, 'script').filter(script => attr(script, 'type') === 'application/ld+json'), `${route}: JSON-LD missing`);
  const expectedSchemas = [
    {
      '@context': 'https://schema.org', '@type': 'Person', name: member.name, jobTitle: member.role, description: member.extendedBio, image: member.imgUnmasked, url: canonical,
      worksFor: { '@type': 'Organization', name: 'Fresh Tech IT Support', url: BASE_URL }, knowsAbout: member.expertise,
      ...(member.linkedin && { sameAs: [member.linkedin] }),
    },
    organization,
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', `${BASE_URL}/`], ['About', `${BASE_URL}/about`], [member.name, canonical]].map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })) },
  ];
  expect(JSON.stringify(JSON.parse(rawText(schemaScript))) === JSON.stringify(expectedSchemas), `${route}: JSON-LD differs from the Person, Organization and breadcrumb graph`);
}

console.log(`${members.length} team routes verified (${members.map(member => member.slug).join(', ')}): ${assertions} assertions passed; ${cards} article cards compared against published posts as of ${blogPublication.asOf}`);
