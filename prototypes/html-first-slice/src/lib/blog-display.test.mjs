import assert from 'node:assert/strict';
import test from 'node:test';
import { allCategories, badgeTextColour, categoryCounts, colourFor, countLabel, featuredPosts, firstSentence, heroCategories, listingPosts, relatedPosts } from './blog-display.mjs';

const post = (slug, isoDate, category) => ({ slug, isoDate, category, excerpt: `${slug} first. ${slug} second.` });
const posts = [
  post('a', '2026-01-01', 'Security'), post('b', '2026-03-01', 'Email'), post('c', '2026-03-01', 'Security'),
  post('d', '2025-12-31', 'AI'), post('e', '2026-02-01', 'Hardware'), post('f', '2026-02-02', 'Software'),
  post('g', '2026-02-03', 'Compliance'), post('h', '2026-02-04', 'Cost Saving'),
];

test('listing sorts newest first with stable ties, and features the first two', () => {
  const sorted = listingPosts(posts);
  assert.deepEqual(sorted.map(item => item.slug), ['b', 'c', 'h', 'g', 'f', 'e', 'a', 'd']);
  assert.deepEqual(featuredPosts(sorted).map(item => item.slug), ['b', 'c']);
  assert.deepEqual(posts.map(item => item.slug), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 'source order untouched');
});

test('categories: chip order, counts, hero top six and remainder', () => {
  const sorted = listingPosts(posts);
  assert.deepEqual(allCategories(sorted), ['All', 'Email', 'Security', 'Cost Saving', 'Compliance', 'Software', 'Hardware', 'AI']);
  assert.deepEqual([...categoryCounts(sorted).entries()], [['Email', 1], ['Security', 2], ['Cost Saving', 1], ['Compliance', 1], ['Software', 1], ['Hardware', 1], ['AI', 1]]);
  const hero = heroCategories(sorted);
  assert.deepEqual(hero.top.map(([name]) => name), ['Security', 'Email', 'Cost Saving', 'Compliance', 'Software', 'Hardware']);
  assert.equal(hero.remainder, 1);
  assert.equal(heroCategories(sorted.slice(0, 2)).remainder, 0);
});

test('labels, colours, first sentence and related order', () => {
  assert.equal(countLabel(1), '1 article');
  assert.equal(countLabel(4), '4 articles');
  assert.equal(colourFor('Security'), '#e8541f');
  assert.equal(colourFor('Unknown'), '#3288be');
  assert.equal(badgeTextColour('Security'), '#0f1923');
  assert.equal(badgeTextColour('Unknown'), '#0f1923');
  assert.equal(badgeTextColour('Email'), '#ffffff');
  assert.equal(badgeTextColour('Cost Saving'), '#ffffff');
  assert.equal(firstSentence('One. Two.'), 'One.');
  assert.equal(firstSentence('No full stop'), 'No full stop.');
  assert.deepEqual(relatedPosts(posts, 'b').map(item => item.slug), ['a', 'c', 'd']);
  assert.deepEqual(relatedPosts(posts, 'a').map(item => item.slug), ['b', 'c', 'd']);
  assert.deepEqual(relatedPosts(posts.slice(0, 1), 'a'), []);
});

test('article image srcset: Cloudinary originals get widths, anything else none', async () => {
  const { articleImageSrcset } = await import('./blog-display.mjs');
  assert.equal(articleImageSrcset('https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/a-b.jpg'),
    'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto,w_480/a-b.jpg 480w, https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto,w_720/a-b.jpg 720w, https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto,w_1200/a-b.jpg 1200w, https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto,w_1600/a-b.jpg 1600w');
  assert.equal(articleImageSrcset('https://res.cloudinary.com/djkmeg5se/video/upload/so_2,w_1200/x.jpg'), undefined);
  assert.equal(articleImageSrcset(undefined), undefined);
});
