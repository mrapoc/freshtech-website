import { areaServed, sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

const baseUrl = 'https://fresh-tech.uk';
const localBusinessId = `${baseUrl}/#localbusiness`;
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const indexRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const locationCanonical = slug => `${baseUrl}/locations/${slug}`;
export const prettifyLocationSlug = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

function breadcrumbSchema(slug, canonical) {
  const items = [['Home', `${baseUrl}/`], [prettifyLocationSlug(slug), canonical]];
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

export function locationSeo(location) {
  if (!location || typeof location.slug !== 'string' || typeof location.heroTitle !== 'string' || typeof location.metaDesc !== 'string') {
    throw new Error('locationSeo requires a location with slug, heroTitle and metaDesc');
  }
  const canonical = locationCanonical(location.slug);
  const { localBusiness, organization } = sharedSchemas();
  return {
    title: siteTitle(location.heroTitle), rawTitle: location.heroTitle,
    description: location.metaDesc, canonical, image: defaultImage,
    ogType: 'website', robots: indexRobots,
    schemas: [
      {
        '@context': 'https://schema.org', '@type': 'Service', name: location.heroTitle,
        description: location.metaDesc, url: canonical, provider: { '@id': localBusinessId }, areaServed: areaServed(),
      },
      localBusiness,
      organization,
      breadcrumbSchema(location.slug, canonical),
    ],
  };
}
