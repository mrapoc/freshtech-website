import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { prettifySegment } from './blog-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// Head contract for /guides/:industry, following components/SEO.tsx as called
// by pages/IndustryGuidePage.tsx:
//
//   <SEO title={`${guide.title} | Free Guide`} description={guide.metaDesc}
//        canonical={`/guides/${industry}`} schema={pageSchema} />
//
// - `type` is not passed, so it defaults to 'website' and og:type is
//   "website" even though the page's own schema is an Article.
// - The explicit `schema` prop replaces the component's type-based default
//   (no LocalBusiness object on this route), so the graph is
//   [Article (copied verbatim from the page), Organization, BreadcrumbList].
// - No `breadcrumbs` prop: the list is auto-derived from the pathname. The
//   "guides" segment is not in SEGMENT_NAMES, so it title-cases to "Guides";
//   the slug uses the same fallback ("renewable-energy" -> "Renewable Energy").
//   The visible Breadcrumbs component on the page emits no schema of its own.
// - No `image` or `faqs`: default social image, no FAQPage.
// - No `noIndex`: production would emit the index directive below. The native
//   preview deliberately does not pass it through; BaseLayout's default
//   preview `noindex, nofollow` stays in force until an authorised cutover.
const baseUrl = 'https://fresh-tech.uk';
const organizationId = `${baseUrl}/#organization`;
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const productionRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const guidesPath = `${baseUrl}/guides`;
export const guideCanonical = slug => `${baseUrl}/guides/${slug}`;
export const guideRawTitle = title => `${title} | Free Guide`;

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

// pageSchema from pages/IndustryGuidePage.tsx, key order preserved. The
// author carries an inline name/url alongside the @id and the publisher is an
// un-identified Organization with a logo: both are the source's shape, not the
// shared organization reference used by the blog helper.
export function guideArticleSchema(guide) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDesc,
    author: {
      '@type': 'Organization',
      name: 'Fresh Tech IT Support',
      '@id': organizationId,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fresh Tech IT Support',
      logo: {
        '@type': 'ImageObject',
        url: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png',
      },
    },
    articleSection: 'Industry Guides',
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
  };
}

export function guideSeo(guide) {
  if (!guide || typeof guide.slug !== 'string' || typeof guide.title !== 'string' || typeof guide.metaDesc !== 'string') {
    throw new Error('guideSeo requires a guide with slug, title and metaDesc');
  }
  const canonical = guideCanonical(guide.slug);
  const rawTitle = guideRawTitle(guide.title);
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(rawTitle), rawTitle,
    description: guide.metaDesc, canonical, image: defaultImage,
    ogType: 'website',
    schemas: [
      guideArticleSchema(guide),
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], ['Guides', guidesPath], [prettifySegment(guide.slug), canonical]]),
    ],
  };
}
