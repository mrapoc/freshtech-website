import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// Head contract for the technology routes, following components/SEO.tsx as
// called by the React pages:
// - /technology renders <SEO title="Technology Explained | Fresh Tech"
//   description canonical> (TechnologyLandingPage). The default type is
//   website, so the graph is [LocalBusiness, Organization, BreadcrumbList]. The
//   raw title already carries a brand suffix and the component appends another;
//   that doubled suffix is the current production head and is kept as parity.
// - /technology/:slug renders <SEO title={data.title} description={data.metaDesc}
//   canonical schema={[articleSchema, faqSchema]}> (TechExplainerPage). The
//   explicit schema array replaces the type default, so the graph is
//   [Article, FAQPage, Organization, BreadcrumbList] with the page's fixed
//   dates and the Markdown-link-stripped FAQ answers. og:type stays website.
// Production robots are index/follow; the preview keeps BaseLayout's noindex
// default, so `robots` is deliberately not passed by the routes.
const baseUrl = 'https://fresh-tech.uk';
const organizationId = `${baseUrl}/#organization`;
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const productionRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const previewRobots = 'noindex, nofollow';

// Copied from pages/TechnologyLandingPage.tsx <SEO ... />.
export const listingRawTitle = 'Technology Explained | Fresh Tech';
export const listingDescription = 'Plain-English guides to the technology that protects your business. No jargon, no sales pitch - just clear explanations of what these tools do and why they matter.';
export const listingCanonical = `${baseUrl}/technology`;
export const listingBreadcrumbName = 'Technology';
export const explainerCanonical = slug => `${baseUrl}/technology/${slug}`;
// components/SEO.tsx title-case fallback; "technology" and the explainer slugs
// are not in its SEGMENT_NAMES map.
export const prettifySegment = segment => segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

// Copied from pages/TechExplainerPage.tsx articleSchema.
export const ARTICLE_DATE_PUBLISHED = '2025-06-01T00:00:00+00:00';
export const ARTICLE_DATE_MODIFIED = '2026-03-04T00:00:00+00:00';
export const publisherLogo = 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png';
export const stripMarkdownLinks = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

export function listingSeo() {
  const { localBusiness, organization } = sharedSchemas();
  return {
    title: siteTitle(listingRawTitle), rawTitle: listingRawTitle,
    description: listingDescription, canonical: listingCanonical, image: defaultImage,
    ogType: 'website', productionRobots, previewRobots,
    schemas: [localBusiness, organization, breadcrumbSchema([['Home', `${baseUrl}/`], [listingBreadcrumbName, listingCanonical]])],
  };
}

export function explainerSeo(explainer) {
  if (!explainer || typeof explainer.slug !== 'string' || typeof explainer.title !== 'string' || typeof explainer.metaDesc !== 'string'
    || typeof explainer.h1 !== 'string' || !Array.isArray(explainer.faqs)) {
    throw new Error('explainerSeo requires an explainer with slug, title, metaDesc, h1 and faqs');
  }
  const canonical = explainerCanonical(explainer.slug);
  const { organization } = sharedSchemas();
  const article = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: explainer.h1, description: explainer.metaDesc,
    datePublished: ARTICLE_DATE_PUBLISHED, dateModified: ARTICLE_DATE_MODIFIED,
    author: { '@type': 'Organization', name: 'Fresh Tech IT Support', '@id': organizationId, url: baseUrl },
    publisher: { '@type': 'Organization', name: 'Fresh Tech IT Support', logo: { '@type': 'ImageObject', url: publisherLogo } },
    inLanguage: 'en-GB', isAccessibleForFree: true,
  };
  const faqPage = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: explainer.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: stripMarkdownLinks(faq.a) } })),
  };
  return {
    title: siteTitle(explainer.title), rawTitle: explainer.title,
    description: explainer.metaDesc, canonical, image: defaultImage,
    ogType: 'website', productionRobots, previewRobots,
    schemas: [article, faqPage, organization, breadcrumbSchema([['Home', `${baseUrl}/`], [listingBreadcrumbName, listingCanonical], [prettifySegment(explainer.slug), canonical]])],
  };
}
