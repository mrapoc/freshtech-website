import { prettifySegment } from './blog-seo.mjs';
import { sharedSchemas, siteTitle } from './service-seo.mjs';
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';

// General port of components/SEO.tsx for the standalone routes. Each page passes
// the same props its React component gives <SEO>; the output gate compares the
// result with the captured production head, so any divergence fails the build.
const baseUrl = 'https://fresh-tech.uk';
const ORG_ID = `${baseUrl}/#organization`;
const LOCAL_BUSINESS_ID = `${baseUrl}/#localbusiness`;
export const DEFAULT_IMAGE = DEFAULT_SOCIAL_IMAGE;
export const DEFAULT_DESCRIPTION = 'Business IT support for UK SMEs. Managed IT, 24/7 Huntress SOC, Dell Premier hardware, Cyber Essentials prep. Fast remote response, jargon-free service. From £40/user/month.';

const autoBreadcrumbs = path => {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return [];
  const crumbs = [{ name: 'Home', item: '/' }];
  let acc = '';
  for (const segment of trimmed.split('/')) {
    acc += `/${segment}`;
    crumbs.push({ name: prettifySegment(segment), item: acc });
  }
  return crumbs;
};

// props: { path, title, description?, image?, type?, schema?, breadcrumbs?, faqs?, canonical? }
export function standaloneSeo({ path, title, description, image = DEFAULT_IMAGE, type = 'website', schema, breadcrumbs, faqs, canonical }) {
  if (typeof path !== 'string' || !path.startsWith('/') || typeof title !== 'string') throw new Error('standaloneSeo needs a path and title');
  const currentUrl = canonical ? (canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`) : `${baseUrl}${path}`;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const finalImage = image.startsWith('http') ? image : `${baseUrl}${image}`;
  const { localBusiness, organization } = sharedSchemas();
  const schemas = [];
  if (schema) schemas.push(...(Array.isArray(schema) ? schema : [schema]));
  else if (type === 'website') schemas.push(localBusiness);
  else if (type === 'service') {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'Service', name: title, description: finalDescription, url: currentUrl,
      provider: { '@id': LOCAL_BUSINESS_ID },
      areaServed: ['Shropshire', 'Herefordshire', 'Worcestershire', 'Powys'].map(name => ({ '@type': 'AdministrativeArea', name })),
    }, localBusiness);
  } else if (type === 'article') {
    schemas.push({ '@context': 'https://schema.org', '@type': 'Article', headline: title, description: finalDescription, image: finalImage, url: currentUrl, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, mainEntityOfPage: currentUrl });
  } else if (type === 'profile') {
    schemas.push({ '@context': 'https://schema.org', '@type': 'AboutPage', name: title, description: finalDescription, url: currentUrl, mainEntity: { '@id': LOCAL_BUSINESS_ID } }, localBusiness);
  } else if (type === 'collection') {
    schemas.push({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description: finalDescription, url: currentUrl, isPartOf: { '@id': ORG_ID } });
  }
  schemas.push(organization);
  const crumbs = breadcrumbs && breadcrumbs.length ? breadcrumbs : autoBreadcrumbs(path);
  if (crumbs.length) {
    schemas.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: crumb.item.startsWith('http') ? crumb.item : `${baseUrl}${crumb.item}` })),
    });
  }
  if (faqs && faqs.length) {
    schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) });
  }
  const ogType = type === 'article' || type === 'profile' ? type : 'website';
  return { title: siteTitle(title), rawTitle: title, description: finalDescription, canonical: currentUrl, image: finalImage, ogType, schemas };
}
