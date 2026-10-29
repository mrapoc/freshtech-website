import { areaServed, sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// Head contract for the industry routes, following components/SEO.tsx:
// - /industries renders <SEO title description type="service"> (IndustriesPageV2):
//   Service + LocalBusiness + Organization + auto breadcrumb, og:type website.
// - /industries/:slug renders <SEO title={ind.title} description={ind.metaDesc}
//   type="service"> (IndustryDetailPageV2): same graph with a three-item
//   breadcrumb. The "industries" segment is named "Sectors" by the component's
//   SEGMENT_NAMES map; detail slugs use its title-case fallback. Neither route
//   passes an image or faqs, so the default social image applies and no FAQPage
//   schema is emitted.
const baseUrl = 'https://fresh-tech.uk';
const localBusinessId = `${baseUrl}/#localbusiness`;
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const indexRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

// Copied from pages-v2/IndustriesPageV2.tsx <SEO title description type="service" />.
export const listingRawTitle = 'Sectors We Work With: Specialist IT Support';
export const listingDescription = 'Specialist IT support for solicitors, accountants, healthcare, manufacturing, charities and more, across Shropshire, Herefordshire and the Welsh Borders.';
export const listingCanonical = `${baseUrl}/industries`;
export const listingBreadcrumbName = 'Sectors';
export const industryCanonical = slug => `${baseUrl}/industries/${slug}`;
export const prettifyIndustrySlug = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

function serviceSchema(rawTitle, description, canonical) {
  return {
    '@context': 'https://schema.org', '@type': 'Service', name: rawTitle,
    description, url: canonical, provider: { '@id': localBusinessId }, areaServed: areaServed(),
  };
}

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
    ogType: 'website', robots: indexRobots,
    schemas: [
      serviceSchema(listingRawTitle, listingDescription, listingCanonical),
      localBusiness,
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], [listingBreadcrumbName, listingCanonical]]),
    ],
  };
}

export function industrySeo(industry) {
  if (!industry || typeof industry.slug !== 'string' || typeof industry.title !== 'string' || typeof industry.metaDesc !== 'string') {
    throw new Error('industrySeo requires an industry with slug, title and metaDesc');
  }
  const canonical = industryCanonical(industry.slug);
  const { localBusiness, organization } = sharedSchemas();
  return {
    title: siteTitle(industry.title), rawTitle: industry.title,
    description: industry.metaDesc, canonical, image: defaultImage,
    ogType: 'website', robots: indexRobots,
    schemas: [
      serviceSchema(industry.title, industry.metaDesc, canonical),
      localBusiness,
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], [listingBreadcrumbName, listingCanonical], [prettifyIndustrySlug(industry.slug), canonical]]),
    ],
  };
}
