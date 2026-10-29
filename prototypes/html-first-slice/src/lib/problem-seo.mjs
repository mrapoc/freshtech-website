import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { defaultImage, faqAnswerText, indexRobots, prettifySlug } from './service-location-seo.mjs';

// Head contract for the root-slug problem routes, following components/SEO.tsx
// as called by pages/ProblemPage.tsx:
// <SEO title description={metaDesc} canonical={`https://fresh-tech.uk/${slug}`}
//      schema={[articleSchema, faqSchema]} />
// The explicit schema array replaces the type-based LocalBusiness object, so
// the graph is Article (inline Organization author/publisher), FAQPage, the
// site Organization and the auto breadcrumb (Home > title-cased slug).
// No image, type or faqs prop: default social image, og:type website, and the
// FAQPage object comes from the page's own schema, not the SEO faqs branch.
const baseUrl = 'https://fresh-tech.uk';
export { defaultImage, faqAnswerText, indexRobots, prettifySlug };
export const problemCanonical = slug => `${baseUrl}/${slug}`;
// Fixed dates copied from the React page's inline articleSchema.
export const datePublished = '2025-06-01T00:00:00+00:00';
export const dateModified = '2026-03-04T00:00:00+00:00';
const logoUrl = 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png';

export function articleSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.metaDesc,
    datePublished,
    dateModified,
    author: {
      '@type': 'Organization',
      name: 'Fresh Tech IT Support',
      '@id': `${baseUrl}/#organization`,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fresh Tech IT Support',
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
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

export function problemSeo(page) {
  if (!page || typeof page.slug !== 'string' || typeof page.title !== 'string' || typeof page.metaDesc !== 'string' || typeof page.h1 !== 'string' || !Array.isArray(page.faqs)) {
    throw new Error('problemSeo requires a page with slug, title, metaDesc, h1 and faqs');
  }
  const canonical = problemCanonical(page.slug);
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(page.title), rawTitle: page.title,
    description: page.metaDesc, canonical, image: defaultImage,
    ogType: 'website', robots: indexRobots,
    schemas: [
      articleSchema(page),
      faqSchema(page),
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], [prettifySlug(page.slug), canonical]]),
    ],
  };
}
