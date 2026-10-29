import assert from 'node:assert/strict';
import test from 'node:test';
import { authorPosts, cardImageSources, expertiseIcon, portraitSources, readingTime, teamIconNodes } from './team-display.mjs';
import { personSchema, teamDescription, teamSeo } from './team-seo.mjs';

const member = {
  name: 'Ann One', shortName: 'Ann', slug: 'ann-one', role: 'Engineer', power: 'The Tester', bio: 'Short.',
  extendedBio: 'x'.repeat(200), expertise: ['Networking', 'Unknown Skill'], imgMasked: 'm', imgUnmasked: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/b.png?v=2', linkedin: '',
};

test('author posts match shortName exactly, newest first, ties in source order', () => {
  const posts = [
    { slug: 'a', author: 'Ann', date: 'Jan 5, 2026' }, { slug: 'b', author: 'Ann One', date: 'Feb 1, 2026' },
    { slug: 'c', author: 'Ann', date: 'Mar 1, 2026' }, { slug: 'd', author: 'Ann', date: 'Jan 5, 2026' },
  ];
  assert.deepEqual(authorPosts(posts, member).map(post => post.slug), ['c', 'a', 'd']);
});

test('reading time follows ReadingTime.tsx: 200 wpm, minimum one minute, tags stripped', () => {
  assert.equal(readingTime('one two'), '1 min read');
  assert.equal(readingTime(`<p>${'word '.repeat(401)}</p>`), '3 min read');
});

test('expertise icons fall back to Shield and every glyph exists', () => {
  assert.equal(expertiseIcon('Networking'), 'Cpu');
  assert.equal(expertiseIcon('Unknown Skill'), 'Shield');
  for (const name of ['Shield', 'Cloud', 'Cpu', 'Wrench', 'Calendar', 'Clock', 'ArrowRight', 'Linkedin']) assert.ok(teamIconNodes(name).length);
});

test('Cloudinary images are requested at rendered sizes, other URLs pass through', () => {
  assert.equal(portraitSources(member.imgUnmasked).src, 'https://res.cloudinary.com/demo/image/upload/w_256,c_fill,ar_1:1,g_north,f_auto,q_auto/b.png?v=2');
  assert.match(cardImageSources('https://res.cloudinary.com/demo/image/upload/v1/x.jpg').srcset, /w_400,c_fill,ar_16:9,f_auto,q_auto\/v1\/x\.jpg 400w/);
  assert.equal(cardImageSources('https://example.com/x.jpg').src, 'https://example.com/x.jpg');
});

test('head follows AuthorPage: truncated description, profile type, Person without sameAs when LinkedIn is empty', () => {
  assert.equal(teamDescription(member), `${'x'.repeat(155)}...`);
  const seo = teamSeo(member);
  assert.equal(seo.title, 'Ann One - Engineer | Fresh Tech IT Support');
  assert.equal(seo.ogType, 'profile');
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Person', 'Organization', 'BreadcrumbList']);
  assert.equal('sameAs' in personSchema(member), false);
  assert.deepEqual(personSchema({ ...member, linkedin: 'https://www.linkedin.com/in/ann/' }).sameAs, ['https://www.linkedin.com/in/ann/']);
});
