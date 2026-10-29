import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// Head contract for the root-slug service-location routes, following
// components/SEO.tsx as called by pages-v2/ServiceLocationPageV2.tsx:
// <SEO title description canonical={`https://fresh-tech.uk/${slug}`}
//      schema={[serviceLocationSchema, faqSchema]} />
// The explicit schema array replaces the type-based LocalBusiness object, so
// the graph is Service (with an inline LocalBusiness provider), FAQPage, the
// site Organization and the auto breadcrumb (Home > title-cased slug).
// No image, type or faqs prop: default social image, og:type website, and
// the FAQPage object comes from the page's own schema, not the SEO faqs branch.
const baseUrl = 'https://fresh-tech.uk';
export const defaultImage = DEFAULT_SOCIAL_IMAGE;
export const indexRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const serviceLocationCanonical = slug => `${baseUrl}/${slug}`;
export const prettifySlug = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
// The React page strips Markdown links from FAQ answers before they enter the
// schema and leaves every other character as written.
export const faqAnswerText = answer => answer.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

export function serviceLocationSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${page.service} - ${page.location}`,
    description: page.metaDesc,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Fresh Tech IT Support',
      '@id': `${baseUrl}/#organization`,
      telephone: '+441584517234',
      email: 'hello@fresh-tech.uk',
      address: { '@type': 'PostalAddress', addressLocality: 'Ludlow', addressRegion: 'Shropshire', addressCountry: 'GB' },
    },
    areaServed: { '@type': 'AdministrativeArea', name: page.location },
    serviceType: page.service,
  };
}

export function faqSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(faq.a) } })),
  };
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

export function serviceLocationSeo(page) {
  if (!page || typeof page.slug !== 'string' || typeof page.title !== 'string' || typeof page.metaDesc !== 'string' || typeof page.service !== 'string' || typeof page.location !== 'string' || !Array.isArray(page.faqs)) {
    throw new Error('serviceLocationSeo requires a page with slug, title, metaDesc, service, location and faqs');
  }
  const canonical = serviceLocationCanonical(page.slug);
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(page.title), rawTitle: page.title,
    description: page.metaDesc, canonical, image: defaultImage,
    ogType: 'website', robots: indexRobots,
    schemas: [
      serviceLocationSchema(page),
      faqSchema(page),
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], [prettifySlug(page.slug), canonical]]),
    ],
  };
}
