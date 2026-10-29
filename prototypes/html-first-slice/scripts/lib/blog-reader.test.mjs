import assert from 'node:assert/strict';
import test from 'node:test';
import { initialsOf, parseCalendarDate, publicationOf, punctuationConflicts, readBlogPosts, ukCalendarDate } from './blog-reader.mjs';

// Synthetic fixtures only. Field shapes follow the V2 templates, not any real
// article in data/content.ts.
const record = (slug, overrides = {}) => {
  const fields = {
    id: `'${slug}-id'`, slug: `'${slug}'`, title: `'Post ${slug}'`,
    excerpt: "'A short summary. With a second sentence.'",
    content: "'## Heading\\n\\nBody with **bold**, `code` and a [link](/services/managed-it-support).\\n\\n* one\\n* two\\n\\n| A | B |\\n|---|---|\\n| 1 | 2 |'",
    date: "'Aug 11, 2026'", readTime: "'4 min read'", author: "'Sam James'", tags: "['Security', 'Email']",
    image: "'https://res.cloudinary.com/demo/image/upload/sample.webp'", imageAlt: "'Sample'", ...overrides,
  };
  return `{ ${Object.entries(fields).filter(([, value]) => value !== undefined).map(([name, value]) => `${name}: ${value}`).join(', ')} }`;
};
const source = body => `export const blogPosts = [${body}];\nexport const other = 1;`;

test('reads records in source order and derives the V2 display values', () => {
  const posts = readBlogPosts('fixture.ts', source(`${record('alpha')}, ${record('beta', { tags: undefined, author: undefined, image: undefined, imageAlt: undefined })}`));
  assert.deepEqual(posts.map(post => post.slug), ['alpha', 'beta']);
  assert.equal(posts[0].isoDate, '2026-08-11');
  assert.equal(posts[0].category, 'Security');
  assert.equal(posts[0].authorName, 'Sam James');
  assert.equal(posts[0].authorInitials, 'SJ');
  assert.deepEqual(posts[0].tags, ['Security', 'Email']);
  assert.equal(posts[1].category, 'IT Advice');
  assert.equal(posts[1].authorName, 'Sam');
  assert.equal(posts[1].authorInitials, 'SJ');
  assert.deepEqual(posts[1].tags, []);
  assert.equal('image' in posts[1], false);
  assert.equal('video' in posts[1], false);
});

test('reads an optional video block and rejects unsafe or malformed media', () => {
  const video = "{ src: 'https://res.cloudinary.com/demo/video/upload/clip.mp4', poster: 'https://res.cloudinary.com/demo/image/upload/poster.jpg', title: 'Clip', caption: 'Cap', duration: 'PT1M5S', maxWidth: 480 }";
  const [post] = readBlogPosts('fixture.ts', source(record('alpha', { video })));
  assert.deepEqual(post.video, { src: 'https://res.cloudinary.com/demo/video/upload/clip.mp4', poster: 'https://res.cloudinary.com/demo/image/upload/poster.jpg', title: 'Clip', caption: 'Cap', duration: 'PT1M5S', maxWidth: 480 });
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { video: "{ src: 'http://example.com/clip.mp4', poster: 'https://example.com/p.jpg' }" }))), /safe https URL/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { video: "{ src: 'https://example.com/clip.mp4' }" }))), /missing field poster/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { video: "{ src: 'https://example.com/clip.mp4', poster: 'https://example.com/p.jpg', duration: '65s' }" }))), /ISO 8601 duration/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { video: "{ src: 'https://example.com/clip.mp4', poster: 'https://example.com/p.jpg', maxWidth: '480' }" }))), /positive integer/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { video: "{ src: 'https://example.com/clip.mp4', poster: 'https://example.com/p.jpg', embedUrl: 'https://example.com' }" }))), /unexpected field embedUrl/);
});

test('rejects missing, unexpected and malformed fields fail-closed', () => {
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { extra: "'x'" }))), /unexpected field extra/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { readTime: undefined }))), /missing field readTime/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { content: "''" }))), /non-empty string/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('Bad Slug'))), /safe route segment/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { tags: "['A', 'A']" }))), /repeats A/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { tags: "'Security'" }))), /must be an array/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { image: "'javascript:alert(1)'" }))), /safe https URL/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { image: undefined }))), /imageAlt is present without image/);
  assert.throws(() => readBlogPosts('fixture.ts', source(`${record('alpha')}, ${record('alpha')}`)), /Duplicate blog post slug/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { id: '19' }))), /blogPosts\[0\]\.id/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { id: "''" }))), /blogPosts\[0\]\.id/);
  assert.throws(() => readBlogPosts('fixture.ts', `const shared = ${record('alpha')}; export const blogPosts = [shared];`), /Non-literal expression/);
  assert.throws(() => readBlogPosts('fixture.ts', source(`{ ...${record('alpha')} }`)), /Only plain property assignments|spread/i);
  assert.throws(() => readBlogPosts('fixture.ts', 'export const other = [];'), /must declare blogPosts exactly once/);
});

test('accepts duplicate legacy ids when slugs are distinct', () => {
  // Real source reuses ids; routes key on slug, so ids are metadata only.
  const posts = readBlogPosts('fixture.ts', source(`${record('alpha', { id: "'19'" })}, ${record('beta', { id: "'19'" })}, ${record('gamma', { id: "'19'" })}`));
  assert.deepEqual(posts.map(post => post.slug), ['alpha', 'beta', 'gamma']);
  assert.deepEqual(posts.map(post => post.id), ['19', '19', '19']);
  assert.throws(() => readBlogPosts('fixture.ts', source(`${record('alpha', { id: "'1'" })}, ${record('alpha', { id: "'2'" })}`)), /Duplicate blog post slug alpha/);
});

test('rejects unsafe inline link targets inside article content', () => {
  for (const href of ['javascript:alert(1)', '//evil.test/x', 'data:text/plain,x', 'vbscript:x', 'tel:+44 1584 517234', 'tel:javascript:alert(1)', 'mailto:a@b.test?subject=x']) {
    assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { content: `'See [this](${href}).'` }))), /disallowed inline link/);
  }
  const [post] = readBlogPosts('fixture.ts', source(record('alpha', { content: "'See [a](#anchor), [b](/contact), [c](https://example.com/page?x=1), [d](tel:+441584517234) and [e](mailto:hello@example.com).'" })));
  assert.match(post.content, /#anchor/);
  assert.match(post.content, /tel:\+441584517234/);
  assert.match(post.content, /mailto:hello@example\.com/);
});

test('parses calendar dates deterministically and rejects impossible ones', () => {
  assert.equal(parseCalendarDate('Aug 11, 2026'), '2026-08-11');
  assert.equal(parseCalendarDate('August 11, 2026'), '2026-08-11');
  assert.equal(parseCalendarDate('Mar 1, 2025'), '2025-03-01');
  assert.equal(parseCalendarDate('2026-02-28'), '2026-02-28');
  assert.throws(() => parseCalendarDate('Feb 30, 2026'), /real calendar day/);
  assert.throws(() => parseCalendarDate('2026-13-01'), /real calendar day/);
  assert.throws(() => parseCalendarDate('11/08/2026'), /not "Mon D, YYYY"/);
  assert.throws(() => parseCalendarDate('Foo 1, 2026'), /unknown month name/);
  assert.throws(() => readBlogPosts('fixture.ts', source(record('alpha', { date: "'11 August 2026'" }))), /blogPosts\[0\]\.date/);
});

test('derives today in the United Kingdom regardless of process timezone', () => {
  // 23:30 UTC on 10 July is 00:30 BST on 11 July.
  assert.equal(ukCalendarDate(new Date('2026-07-10T23:30:00Z')), '2026-07-11');
  // 23:30 UTC on 10 January is still 10 January in GMT.
  assert.equal(ukCalendarDate(new Date('2026-01-10T23:30:00Z')), '2026-01-10');
});

test('publication excludes held and future posts and keeps same-day posts', () => {
  const posts = readBlogPosts('fixture.ts', source([
    record('old', { date: "'Jan 5, 2026'" }),
    record('today', { date: "'Sep 15, 2026'" }),
    record('tomorrow', { date: "'Sep 16, 2026'" }),
    record('held-old', { date: "'Jan 1, 2020'" }),
  ].join(', ')));
  const result = publicationOf(posts, { heldSlugs: new Set(['held-old']), asOf: '2026-09-15' });
  assert.deepEqual(result.published.map(post => post.slug), ['old', 'today']);
  assert.deepEqual(result.held, ['held-old']);
  assert.deepEqual(result.future, ['tomorrow']);
  assert.throws(() => publicationOf(posts, { heldSlugs: ['held-old'], asOf: '2026-09-15' }), /Set/);
  assert.throws(() => publicationOf(posts, { heldSlugs: new Set(), asOf: 'today' }), /ISO calendar date/);
});

test('reports punctuation conflicts without rewriting the copy', () => {
  const [post] = readBlogPosts('fixture.ts', source(record('alpha', { title: "'Bad — title'", content: "'Body — text'" })));
  assert.deepEqual(punctuationConflicts(post), ['alpha.title: em dash', 'alpha.content: em dash']);
  assert.equal(post.title, 'Bad — title');
  assert.equal(initialsOf('Sam'), 'S');
  assert.equal(initialsOf('sam james smith'), 'SJ');
});
