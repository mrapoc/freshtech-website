import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';
const baseUrl = 'https://fresh-tech.uk';
const image = DEFAULT_SOCIAL_IMAGE;
const localBusinessId = `${baseUrl}/#localbusiness`;
const organizationId = `${baseUrl}/#organization`;

export const serviceCanonical = slug => `${baseUrl}/services/${slug}`;
export const serviceRawTitle = title => `${title}: IT Support Shropshire`;
export const serviceTitle = title => siteTitle(serviceRawTitle(title));
// The React SEO component names the final breadcrumb from the route slug, not
// the service title (retained output: "Managed It Support").
export const breadcrumbName = slug => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

// Site-wide LocalBusiness offer list inherited from the current SEO component.
// It is the same on every service route and is not derived from the catalogue.
const offers = [
  ['Managed IT Support', 'managed-it-support'], ['Cyber Security', 'cybersecurity'], ['Cyber Essentials Certification Support', 'cyber-essentials'],
  ['Microsoft 365 & Cloud Solutions', 'cloud-solutions'], ['Cloud Backup & Disaster Recovery', 'backup-disaster-recovery'],
  ['Business Phone Systems', 'cloud-phone-systems'], ['Hardware Procurement', 'hardware-procurement'],
  ['Strategic IT Projects', 'strategic-projects'], ['Managed Print', 'managed-print'],
];

export const listingCanonical = `${baseUrl}/services`;
// Copied from pages-v2/ServicesPageV2.tsx <SEO title description type="service" />.
export const listingRawTitle = 'IT Services: Managed Support, Cyber Security & More';
export const listingDescription = 'All the IT your business needs in one flat monthly fee. Managed support, cyber security, Microsoft 365, cloud backup, phone systems. From £40/user/month.';
export const siteTitle = rawTitle => {
  const longTitle = `${rawTitle} | Fresh Tech IT Support`;
  if (longTitle.length <= 65) return longTitle;
  const shortTitle = `${rawTitle} | Fresh Tech`;
  return shortTitle.length <= 65 ? shortTitle : rawTitle;
};
export const areaServed = () => ['Shropshire', 'Herefordshire', 'Worcestershire', 'Powys'].map(name => ({ '@type': 'AdministrativeArea', name }));

function serviceSchema(rawTitle, description, canonical) {
  return {
    '@context': 'https://schema.org', '@type': 'Service', name: rawTitle,
    description, url: canonical, provider: { '@id': localBusinessId },
    areaServed: areaServed(),
  };
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

// Listing route head for type="service" at /services. These values follow the
// current production SEO component's title cap, service and auto-breadcrumb rules.
export function listingSeo() {
  const { localBusiness, organization } = sharedSchemas();
  return {
    title: siteTitle(listingRawTitle),
    rawTitle: listingRawTitle,
    description: listingDescription,
    canonical: listingCanonical,
    image,
    schemas: [
      serviceSchema(listingRawTitle, listingDescription, listingCanonical),
      localBusiness,
      organization,
      breadcrumbSchema([['Home', `${baseUrl}/`], ['Services', listingCanonical]]),
    ],
  };
}

export function serviceSeo(page) {
  if (!page || typeof page.slug !== 'string' || typeof page.title !== 'string' || typeof page.desc !== 'string') {
    throw new Error('serviceSeo requires a catalogue page with slug, title and desc');
  }
  const canonical = serviceCanonical(page.slug);
  const rawTitle = serviceRawTitle(page.title);
  const title = serviceTitle(page.title);
  const { localBusiness, organization } = sharedSchemas();
  const schemas = [
    serviceSchema(rawTitle, page.desc, canonical),
    localBusiness,
    organization,
    breadcrumbSchema([['Home', `${baseUrl}/`], ['Services', listingCanonical], [breadcrumbName(page.slug), canonical]]),
  ];
  return { title, rawTitle, description: page.desc, canonical, image, schemas };
}

export function sharedSchemas() {
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': localBusinessId,
    name: 'Fresh Tech IT Support',
    description: 'Managed IT Support and Cybersecurity services for businesses in Shropshire, Herefordshire, and the West Midlands.',
    image,
    url: `${baseUrl}/`,
    telephone: '+441584517234',
    email: 'hello@fresh-tech.uk',
    priceRange: '££',
    address: { '@type': 'PostalAddress', streetAddress: '28 Livesey Avenue', addressLocality: 'Ludlow', addressRegion: 'Shropshire', postalCode: 'SY8 1HN', addressCountry: 'GB' },
    geo: { '@type': 'GeoCoordinates', latitude: 52.368, longitude: -2.717 },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' }],
    areaServed: [
      ...['Shropshire', 'Herefordshire', 'Worcestershire', 'Powys'].map(name => ({ '@type': 'AdministrativeArea', name })),
      ...['Ludlow', 'Shrewsbury', 'Hereford', 'Telford', 'Worcester', 'Leominster', 'Ross-on-Wye', 'Bridgnorth', 'Malvern', 'Ledbury', 'Oswestry', 'Welshpool'].map(name => ({ '@type': 'City', name })),
    ],
    serviceArea: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: 52.368, longitude: -2.717 }, geoRadius: '55000' },
    makesOffer: offers.map(([name, slug]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, url: serviceCanonical(slug) } })),
  };
  const organization = {
      '@context': 'https://schema.org', '@type': 'Organization', '@id': organizationId,
      name: 'Fresh Tech IT Support', legalName: 'Fresh PCS Consultancy Ltd',
      identifier: [
        { '@type': 'PropertyValue', propertyID: 'UK Companies House', value: '09296207' },
        { '@type': 'PropertyValue', propertyID: 'VAT', value: 'GB199976510' },
      ],
      url: baseUrl,
      logo: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png',
      description: 'Business IT support for SMEs across Shropshire, Herefordshire and the wider UK. Fast remote response, proactive security, and jargon-free service.',
      foundingDate: '2014', founders: [{ '@type': 'Person', name: 'Sam James' }],
      address: { '@type': 'PostalAddress', streetAddress: '28 Livesey Avenue', addressLocality: 'Ludlow', addressRegion: 'Shropshire', postalCode: 'SY8 1HN', addressCountry: 'GB' },
      contactPoint: { '@type': 'ContactPoint', telephone: '+441584517234', contactType: 'customer service', email: 'hello@fresh-tech.uk', availableLanguage: ['English'] },
      sameAs: ['https://www.facebook.com/freshtechuk', 'https://www.linkedin.com/company/fresh-tech-uk'],
  };
  return { localBusiness, organization };
}
