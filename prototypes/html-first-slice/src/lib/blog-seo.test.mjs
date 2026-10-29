import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultImage, indexRobots, listingSeo, postSeo, prettifySegment } from './blog-seo.mjs';

test('listing head: collection graph, Blog breadcrumb and the uncapped raw title', () => {
  const seo = listingSeo();
  // 55-character raw title: both brand suffixes overflow 65, so the raw title stands.
  assert.equal(seo.title, 'Blog: Plain-English IT Advice for Shropshire Businesses');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/blog');
  assert.equal(seo.image, defaultImage);
  assert.equal(seo.ogType, 'website');
  assert.equal(seo.robots, indexRobots);
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['CollectionPage', 'Organization', 'BreadcrumbList']);
  assert.equal(seo.schemas[0].isPartOf['@id'], 'https://fresh-tech.uk/#organization');
  assert.deepEqual(seo.schemas[2].itemListElement.map(item => [item.name, item.item]), [['Home', 'https://fresh-tech.uk/'], ['Blog', 'https://fresh-tech.uk/blog']]);
});

test('article head with image: Article carries raw image and both dates; og:image is the post image', () => {
  const seo = postSeo({ slug: 'test-post', title: 'Test Post Title', excerpt: 'Excerpt.', isoDate: '2026-08-11', image: '/images/test.webp' });
  assert.equal(seo.title, 'Test Post Title | Fresh Tech IT Support');
  assert.equal(seo.description, 'Excerpt.');
  assert.equal(seo.canonical, 'https://fresh-tech.uk/blog/test-post');
  assert.equal(seo.image, 'https://fresh-tech.uk/images/test.webp');
  assert.equal(seo.ogType, 'article');
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'Organization', 'BreadcrumbList']);
  assert.deepEqual(seo.schemas[0], {
    '@context': 'https://schema.org', '@type': 'Article', headline: 'Test Post Title', description: 'Excerpt.', image: '/images/test.webp',
    url: seo.canonical, author: { '@id': 'https://fresh-tech.uk/#organization' }, publisher: { '@id': 'https://fresh-tech.uk/#organization' },
    mainEntityOfPage: seo.canonical, datePublished: '2026-08-11', dateModified: '2026-08-11',
  });
  assert.deepEqual(seo.schemas[2].itemListElement.map(item => [item.name, item.item]), [
    ['Home', 'https://fresh-tech.uk/'], ['Blog', 'https://fresh-tech.uk/blog'], ['Test Post', seo.canonical],
  ]);
});

test('article head without image: Article.image absent, default social image used', () => {
  const seo = postSeo({ slug: 'no-image', title: 'No Image', excerpt: 'E.', isoDate: '2026-01-02' });
  assert.equal(seo.image, defaultImage);
  assert.equal('image' in seo.schemas[0], false);
  assert.equal(seo.schemas[0].datePublished, '2026-01-02');
});

test('article head with video: VideoObject sits between Article and Organization', () => {
  const video = { src: 'https://cdn.example.com/v/clip.mp4', poster: 'https://cdn.example.com/i/poster.jpg', caption: 'Caption', duration: 'PT2M' };
  const seo = postSeo({ slug: 'video-post', title: 'Video Post', excerpt: 'E.', isoDate: '2026-05-05', image: 'https://cdn.example.com/i/hero.jpg', video });
  assert.deepEqual(seo.schemas.map(schema => schema['@type']), ['Article', 'VideoObject', 'Organization', 'BreadcrumbList']);
  assert.deepEqual(seo.schemas[1], {
    '@context': 'https://schema.org', '@type': 'VideoObject', name: 'Video Post', description: 'Caption',
    thumbnailUrl: ['https://cdn.example.com/i/poster.jpg', 'https://cdn.example.com/i/hero.jpg'], contentUrl: video.src,
    uploadDate: '2026-05-05', duration: 'PT2M', publisher: { '@id': 'https://fresh-tech.uk/#organization' },
  });
  assert.equal('embedUrl' in seo.schemas[1], false);
  const untitled = postSeo({ slug: 'v', title: 'T', excerpt: 'E.', isoDate: '2026-05-05', video: { src: video.src, poster: video.poster } });
  assert.equal(untitled.schemas[1].name, 'T');
  assert.equal(untitled.schemas[1].description, 'E.');
  assert.deepEqual(untitled.schemas[1].thumbnailUrl, [video.poster]);
  assert.equal('duration' in untitled.schemas[1], false);
});

test('title cap, segment names and input validation', () => {
  const title = rawTitle => postSeo({ slug: 'a', title: rawTitle, excerpt: 'E', isoDate: '2026-01-01' }).title;
  const synthetic = length => 'Synthetic Post'.padEnd(length, 'x');
  assert.equal(title(synthetic(41)), `${synthetic(41)} | Fresh Tech IT Support`);
  assert.equal(title(synthetic(42)), `${synthetic(42)} | Fresh Tech`);
  assert.equal(title(synthetic(53)), synthetic(53));
  assert.equal(prettifySegment('about'), 'About Us');
  assert.equal(prettifySegment('why-your-backup-fails'), 'Why Your Backup Fails');
  assert.throws(() => postSeo({ slug: 'a', title: 'T', excerpt: 'E', isoDate: 'Aug 11, 2026' }), /requires a post/);
  assert.throws(() => postSeo({ slug: 'a', title: 'T' }), /requires a post/);
});
