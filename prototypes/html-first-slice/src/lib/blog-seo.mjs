import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// Head contract for the blog routes, following components/SEO.tsx as called by
// the active V2 templates:
// - /blog renders <SEO title description type="collection"> (BlogPageV2):
//   CollectionPage + Organization + auto breadcrumb Home > Blog, og:type website,
//   default social image.
// - /blog/:slug renders <SEO title={post.title} description={post.excerpt}
//   type="article" image={post.image} schema={postSchema}> (BlogPostPageV2).
//   The explicit `schema` replaces the component's Article default, so the
//   graph is [Article(+dates), VideoObject?, Organization, BreadcrumbList].
//   Article.image is the raw post.image (absent when the post has none);
//   og:image is the absolutised post.image or the default social image.
const baseUrl = 'https://fresh-tech.uk';
const organizationId = `${baseUrl}/#organization`;
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const indexRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

// Copied from pages-v2/BlogPageV2.tsx <SEO title description type="collection" />.
export const listingRawTitle = 'Blog: Plain-English IT Advice for Shropshire Businesses';
export const listingDescription = 'Practical IT guides, plain-English advice and honest answers from Fresh Tech, managed IT support based in Ludlow, Shropshire.';
export const listingCanonical = `${baseUrl}/blog`;
export const postCanonical = slug => `${baseUrl}/blog/${slug}`;

// components/SEO.tsx SEGMENT_NAMES, reproduced in full so a post slug that
// happens to match a mapped segment breadcrumbs the same way React does.
const SEGMENT_NAMES = {
  '': 'Home', industries: 'Sectors', locations: 'Locations', services: 'Services', 'case-studies': 'Case Studies', blog: 'Blog',
  'why-trust-us': 'Why Trust Us', 'it-health-check': 'IT Health Check', 'microsoft-business-premium': 'Microsoft 365 Business Premium',
  'ai-acceptable-use-policy': 'AI Acceptable Use Policy', 'privacy-policy': 'Privacy Policy', 'terms-conditions': 'Terms & Conditions',
  'terms-of-business': 'Terms of Business', dpa: 'Data Processing Terms', 'sub-processors': 'Sub-processors', about: 'About Us',
  contact: 'Contact', pricing: 'Pricing', onboarding: 'Switching IT Provider', careers: 'Careers', refer: 'Refer a Business',
};
export const prettifySegment = segment => (Object.hasOwn(SEGMENT_NAMES, segment)
  ? SEGMENT_NAMES[segment]
  : segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));

const absoluteImage = image => (image.startsWith('http') ? image : `${baseUrl}${image}`);

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

export function listingSeo() {
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(listingRawTitle), rawTitle: listingRawTitle,
    description: listingDescription, canonical: listingCanonical, image: defaultImage,
    ogType: 'website', robots: indexRobots,
    schemas: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: listingRawTitle, description: listingDescription, url: listingCanonical, isPartOf: { '@id': organizationId } },
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], ['Blog', listingCanonical]]),
    ],
  };
}

export function postSeo(post) {
  if (!post || typeof post.slug !== 'string' || typeof post.title !== 'string' || typeof post.excerpt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(post.isoDate || '')) {
    throw new Error('postSeo requires a post with slug, title, excerpt and isoDate');
  }
  const canonical = postCanonical(post.slug);
  const organizationRef = { '@id': organizationId };
  const { organization } = sharedSchemas();
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt,
    ...(post.image ? { image: post.image } : {}),
    url: canonical, author: organizationRef, publisher: organizationRef, mainEntityOfPage: canonical,
    datePublished: post.isoDate, dateModified: post.isoDate,
  };
  const schemas = [article];
  if (post.video) {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'VideoObject',
      name: post.video.title || post.title,
      description: post.video.caption || post.excerpt,
      thumbnailUrl: [post.video.poster, post.image].filter(Boolean),
      contentUrl: post.video.src,
      uploadDate: post.isoDate,
      ...(post.video.duration ? { duration: post.video.duration } : {}),
      publisher: organizationRef,
    });
  }
  schemas.push(organization, breadcrumbSchema([['Home', `${baseUrl}/`], ['Blog', listingCanonical], [prettifySegment(post.slug), canonical]]));
  return {
    title: siteTitle(post.title), rawTitle: post.title,
    description: post.excerpt, canonical, image: post.image ? absoluteImage(post.image) : defaultImage,
    ogType: 'article', robots: indexRobots, schemas,
  };
}
