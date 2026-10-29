import assert from 'node:assert/strict';
import test from 'node:test';
import { explainerCopy, faqSubheading, groupListing, listingCopy, otherTechPages } from './technology-display.mjs';

const card = (slug, category) => ({ slug, title: `Title ${slug}`, desc: `Desc ${slug}`, category });
const listing = {
  categories: ['Security', 'Empty', 'Cloud', 'Devices'],
  pages: [card('a', 'Cloud'), card('b', 'Security'), card('c', 'Devices'), card('d', 'Security'), card('e', 'Cloud')],
};

test('groups cards by declared category order, keeps card order inside a group and skips empty categories', () => {
  const groups = groupListing(listing);
  assert.deepEqual(groups.map(group => group.category), ['Security', 'Cloud', 'Devices'], 'declared order, not first-seen order, with Empty dropped');
  assert.deepEqual(groups.map(group => group.pages.map(page => page.slug)), [['b', 'd'], ['a', 'e'], ['c']]);
  assert.equal(groups.flatMap(group => group.pages).length, listing.pages.length, 'every card appears exactly once');
  assert.deepEqual(listing.pages.map(page => page.slug), ['a', 'b', 'c', 'd', 'e'], 'source order untouched');
  assert.deepEqual(groupListing({ categories: [], pages: listing.pages }), [], 'no categories means no groups');
  assert.deepEqual(groupListing({ categories: ['Security'], pages: [] }), []);
});

test('a card whose category is undeclared is not rendered under any group', () => {
  const groups = groupListing({ categories: ['Security'], pages: [card('a', 'Security'), card('x', 'Unknown')] });
  assert.deepEqual(groups.flatMap(group => group.pages.map(page => page.slug)), ['a']);
});

test('more-links are the directory minus the current route, in source order', () => {
  const directory = [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }, { slug: 'c', title: 'C' }];
  assert.deepEqual(otherTechPages(directory, 'b').map(page => page.slug), ['a', 'c']);
  assert.deepEqual(otherTechPages(directory, 'a').map(page => page.slug), ['b', 'c']);
  assert.deepEqual(otherTechPages(directory, 'not-listed').map(page => page.slug), ['a', 'b', 'c'], 'an unlisted explainer still links to the whole directory');
  assert.deepEqual(otherTechPages([{ slug: 'a', title: 'A' }], 'a'), []);
  assert.deepEqual(directory.map(page => page.slug), ['a', 'b', 'c'], 'source order untouched');
});

test('FAQ subheading lowercases the h1 as the React page does', () => {
  assert.equal(faqSubheading('Remote Monitoring & Management (RMM)'), 'Common questions about remote monitoring & management (rmm)');
  assert.equal(faqSubheading('Why We Remove Local Admin Rights'), 'Common questions about why we remove local admin rights');
});

test('fixed copy is frozen, complete, and matches the React source strings', () => {
  assert.ok(Object.isFrozen(listingCopy) && Object.isFrozen(explainerCopy));
  const strings = object => Object.values(object).flatMap(value => (typeof value === 'string' ? [value] : [value.label, value.href]));
  for (const value of [...strings(listingCopy), ...strings(explainerCopy)]) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, 'no empty copy');
    assert.equal(value, value.trim(), 'no stray surrounding whitespace');
    assert.ok(!value.includes('—'), `em dash in fixed copy: ${value}`);
  }
  const links = [listingCopy.ctaPrimary, listingCopy.ctaSecondary, explainerCopy.heroPrimary, explainerCopy.heroPhone, explainerCopy.ctaPrimary, explainerCopy.ctaSecondary];
  for (const link of links) {
    assert.deepEqual(Object.keys(link).sort(), ['href', 'label']);
    assert.match(link.href, /^(?:\/[a-z0-9/-]*|tel:\d+)$/, `link target must be site-relative or tel: ${link.href}`);
  }
  assert.equal(explainerCopy.heroPhone.href, `tel:${explainerCopy.heroPhone.label.replace(/\D/g, '')}`, 'phone link dials the displayed number');
  // Listing: TechnologyLandingPage.tsx PageHeader, intro and CTA.
  assert.equal(listingCopy.highlight, 'Knowledge Base');
  assert.equal(listingCopy.title, 'Technology Explained');
  assert.equal(listingCopy.introHeading, 'Why We Created This');
  assert.equal(listingCopy.topicsHeading, 'All Topics');
  assert.equal(listingCopy.topicsSub, 'Click any topic to learn more');
  assert.equal(listingCopy.readGuide, 'Read Guide');
  assert.deepEqual(listingCopy.ctaPrimary, { label: 'Ask a Question', href: '/contact' });
  assert.deepEqual(listingCopy.ctaSecondary, { label: 'Resource Centre', href: '/resources' });
  // Explainer: TechExplainerPage.tsx section headings in page order and CTAs.
  assert.deepEqual(
    [explainerCopy.whatHeading, explainerCopy.benefitsHeading, explainerCopy.risksHeading, explainerCopy.howHeading, explainerCopy.faqHeading, explainerCopy.relatedHeading, explainerCopy.moreHeading, explainerCopy.ctaHeading],
    ['What is it?', 'Business Benefits', 'Risks Without It', 'How Fresh Tech Implements This', 'Frequently Asked Questions', 'Related Services', 'More Technology Explained', 'Ready to protect your business?'],
  );
  assert.equal(explainerCopy.breadcrumbListing, listingCopy.title, 'breadcrumb names the listing by its page title');
  assert.equal(explainerCopy.eyebrow, listingCopy.title);
  assert.deepEqual(explainerCopy.heroPrimary, { label: 'Talk to an Expert', href: '/contact' });
  assert.deepEqual(explainerCopy.ctaPrimary, { label: 'Get in Touch', href: '/contact' });
  assert.deepEqual(explainerCopy.ctaSecondary, { label: 'View All Services', href: '/services' });
});

test('hero images are served as 2:1 Cloudinary crops at fixed widths; other URLs pass through', async () => {
  const { heroImageSources } = await import('./technology-display.mjs');
  const base = 'https://res.cloudinary.com/djkmeg5se/image/upload/';
  const sources = heroImageSources(`${base}f_auto,q_auto/vpn-hero.jpg`);
  assert.equal(sources.src, `${base}w_1200,c_fill,ar_2:1,f_auto,q_auto/vpn-hero.jpg`);
  assert.equal(sources.srcset, [480, 720, 1200, 1600].map(width => `${base}w_${width},c_fill,ar_2:1,f_auto,q_auto/vpn-hero.jpg ${width}w`).join(', '));
  assert.match(sources.sizes, /1100px/);
  for (const other of [`${base}v1/f_auto,q_auto/x.jpg`, 'https://example.com/f_auto,q_auto/x.jpg', `${base}f_auto,q_auto/x.jpg?y=1`]) {
    assert.deepEqual(heroImageSources(other), { src: other, srcset: undefined, sizes: undefined });
  }
});
