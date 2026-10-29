import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { defaultImage, faqAnswerText, indexRobots, prettifySlug } from './service-location-seo.mjs';

// Head contract for the root-slug comparison routes, following components/SEO.tsx
// as called by pages/ComparisonPage.tsx:
// <SEO title description={metaDesc} canonical={`https://fresh-tech.uk/${slug}`}
//      schema={[articleSchema, faqSchema]} />
// Same graph shape as the problem family (Article, FAQPage, site Organization,
// auto breadcrumb), but ComparisonPage's inline Article object is its own:
// "Fresh Tech" author/publisher, no dates, @id, url, language or access flag.
const baseUrl = 'https://fresh-tech.uk';
export { defaultImage, indexRobots };
const logoUrl = 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png';

export function articleSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.metaDesc,
    author: { '@type': 'Organization', name: 'Fresh Tech' },
    publisher: { '@type': 'Organization', name: 'Fresh Tech', logo: { '@type': 'ImageObject', url: logoUrl } },
  };
}

export function faqSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(faq.a) } })),
  };
}

export function comparisonSeo(page) {
  if (!page || typeof page.slug !== 'string' || typeof page.title !== 'string' || typeof page.metaDesc !== 'string' || typeof page.h1 !== 'string' || !Array.isArray(page.faqs)) {
    throw new Error('comparisonSeo requires a page with slug, title, metaDesc, h1 and faqs');
  }
  const canonical = `${baseUrl}/${page.slug}`;
  const { organization } = sharedSchemas();
  return {
    title: siteTitle(page.title), rawTitle: page.title,
    description: page.metaDesc, canonical, image: defaultImage,
    ogType: 'website', robots: indexRobots,
    schemas: [
      articleSchema(page),
      faqSchema(page),
      organization,
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [['Home', `${baseUrl}/`], [prettifySlug(page.slug), canonical]].map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
      },
    ],
  };
}
