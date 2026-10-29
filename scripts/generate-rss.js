// RSS Feed Generator for Publer integration
// Generates rss.xml with ONLY future scheduled posts
// This prevents Publer from posting all existing content at once
// Publer uses pubDate to auto-schedule when posts go live

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default posting time (9:00 AM UK time)
const DEFAULT_POST_HOUR = 9;
const DEFAULT_POST_MINUTE = 0;

// Helper to check if a post date is in the future
export const isFuturePost = (dateString) => {
  const postDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return postDate > today;
};

// Parse the blog posts from content.ts
export const extractBlogPosts = () => {
  const contentPath = path.join(__dirname, '../data/content.ts');
  const content = fs.readFileSync(contentPath, 'utf-8');

  // Extract the blogPosts array using regex
  const blogPostsMatch = content.match(/export const blogPosts = \[([\s\S]*?)\];\s*export const/);
  if (!blogPostsMatch) {
    console.error('Could not find blogPosts in content.ts');
    return [];
  }

  // Split the array into individual post objects, then read each field on its own.
  // Fields are optional and order-independent: posts carrying extras such as
  // imageAlt used to be skipped entirely by a single fixed-order regex.
  const body = blogPostsMatch[1];
  const starts = [...body.matchAll(/\{\s*id:\s*"/g)].map(m => m.index);

  const field = (chunk, name) => {
    const m = chunk.match(new RegExp(`\\b${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (!m) return null;
    // The captured text is still source-escaped (\", \n), so decode it
    try {
      return JSON.parse(`"${m[1]}"`);
    } catch {
      return m[1];
    }
  };

  const posts = [];
  starts.forEach((start, i) => {
    const chunk = body.slice(start, starts[i + 1] ?? body.length);
    const post = {
      id: field(chunk, 'id'),
      slug: field(chunk, 'slug'),
      title: field(chunk, 'title'),
      date: field(chunk, 'date'),
      readTime: field(chunk, 'readTime'),
      image: field(chunk, 'image'),
      excerpt: field(chunk, 'excerpt')
    };
    // slug, title and date are the minimum needed to build a usable RSS item
    if (post.slug && post.title && post.date) posts.push(post);
  });

  return posts;
};

// Convert date string to RFC 822 format for RSS with specific time
const toRFC822WithTime = (dateString, hour = DEFAULT_POST_HOUR, minute = DEFAULT_POST_MINUTE) => {
  const date = new Date(dateString);
  // Set specific time (in UK timezone approximation - UTC+0 for simplicity)
  date.setUTCHours(hour, minute, 0, 0);
  return date.toUTCString();
};

// Escape XML special characters
const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Generate RSS XML
export const generateRSS = (posts, includeScheduled = true) => {
  const baseUrl = 'https://fresh-tech.uk';
  const now = new Date().toUTCString();

  // Sort all posts by date (newest first)
  let allPosts = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Optionally filter to only published posts
  if (!includeScheduled) {
    allPosts = allPosts.filter(post => !isFuturePost(post.date));
  }

  // Limit to last 50 posts for RSS
  allPosts = allPosts.slice(0, 50);

  const items = allPosts.map(post => {
    const isScheduled = isFuturePost(post.date);
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${toRFC822WithTime(post.date)}</pubDate>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <enclosure url="${post.image}" type="image/jpeg" />
      <media:content url="${post.image}" medium="image" />${isScheduled ? '\n      <!-- SCHEDULED POST - Publer will auto-queue for pubDate -->' : ''}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Fresh Tech Blog - IT Tips &amp; Cybersecurity News</title>
    <link>${baseUrl}/blog</link>
    <description>IT tips, cybersecurity news and updates from the Fresh Tech team. Practical advice for UK small businesses.</description>
    <language>en-gb</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png</url>
      <title>Fresh Tech Blog</title>
      <link>${baseUrl}/blog</link>
    </image>
${items}
  </channel>
</rss>`;
};

// Main execution
const main = () => {
  console.log('Generating RSS feed for Publer...');

  const posts = extractBlogPosts();
  console.log(`Found ${posts.length} total posts`);

  // Filter to ONLY future scheduled posts - prevents Publer from posting existing content
  const scheduledPosts = posts.filter(p => isFuturePost(p.date));
  const publishedCount = posts.length - scheduledPosts.length;

  console.log(`${publishedCount} already published (excluded from RSS)`);
  console.log(`${scheduledPosts.length} scheduled for future (included in RSS)`);

  if (scheduledPosts.length === 0) {
    console.log('⚠️  No scheduled posts found - RSS feed will be empty');
  }

  // Generate RSS with only scheduled posts
  const rss = generateRSS(scheduledPosts, true);

  const outputPath = path.join(__dirname, '../public/rss.xml');
  fs.writeFileSync(outputPath, rss);

  console.log(`✅ RSS feed generated: public/rss.xml`);
  console.log(`   Posts will be scheduled for ${DEFAULT_POST_HOUR}:${String(DEFAULT_POST_MINUTE).padStart(2, '0')} UTC`);
  if (scheduledPosts.length > 0) {
    console.log(`   Publer will auto-post on each post's scheduled date`);
  }
};

// Run only as a script; the native production build imports the helpers above.
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
