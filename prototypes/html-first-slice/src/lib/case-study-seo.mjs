import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// Head contract for the case-study routes, following components/SEO.tsx:
// - /case-studies renders <SEO type="collection"> with the listing title and
//   description: CollectionPage + Organization + auto breadcrumb, og:type website.
// - /case-studies/:slug renders <SEO type="article"> with `${title}: Case Study`
//   and the outcome as description: Article + Organization + auto breadcrumb,
//   og:type article. Neither route passes an image, so the default social image
//   is used everywhere, including Article.image.
const baseUrl = 'https://fresh-tech.uk';
const organizationId = `${baseUrl}/#organization`;
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const indexRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

// Copied from pages-v2/CaseStudiesPageV2.tsx <SEO title description type="collection" />.
export const listingRawTitle = 'Case Studies: Real Results for Shropshire Businesses';
export const listingDescription = 'Real outcomes for real businesses. See how Fresh Tech has helped solicitors, healthcare practices, manufacturers and more across Shropshire and Herefordshire.';
export const listingCanonical = `${baseUrl}/case-studies`;
export const detailCanonical = slug => `${baseUrl}/case-studies/${slug}`;
export const detailRawTitle = title => `${title}: Case Study`;

// Only the parent case-study segment needs the component's explicit mapping.
// Detail slugs follow the component's title-case fallback.
const SEGMENT_NAMES = {
  'case-studies': 'Case Studies',
};
export const prettifySegment = segment => (Object.hasOwn(SEGMENT_NAMES, segment)
  ? SEGMENT_NAMES[segment]
  : segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

export function listingSeo() {
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(listingRawTitle),
    rawTitle: listingRawTitle,
    description: listingDescription,
    canonical: listingCanonical,
    image: defaultImage,
    ogType: 'website',
    robots: indexRobots,
    schemas: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: listingRawTitle, description: listingDescription, url: listingCanonical, isPartOf: { '@id': organizationId } },
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], ['Case Studies', listingCanonical]]),
    ],
  };
}

export function detailSeo(study) {
  if (!study || typeof study.slug !== 'string' || typeof study.title !== 'string' || typeof study.outcome !== 'string') {
    throw new Error('detailSeo requires a case study with slug, title and outcome');
  }
  const canonical = detailCanonical(study.slug);
  const rawTitle = detailRawTitle(study.title);
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(rawTitle),
    rawTitle,
    description: study.outcome,
    canonical,
    image: defaultImage,
    ogType: 'article',
    robots: indexRobots,
    schemas: [
      {
        '@context': 'https://schema.org', '@type': 'Article', headline: rawTitle, description: study.outcome, image: defaultImage, url: canonical,
        author: { '@id': organizationId }, publisher: { '@id': organizationId }, mainEntityOfPage: canonical,
      },
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], ['Case Studies', listingCanonical], [prettifySegment(study.slug), canonical]]),
    ],
  };
}
