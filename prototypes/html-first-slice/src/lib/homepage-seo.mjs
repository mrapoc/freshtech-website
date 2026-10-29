const BASE_URL = 'https://fresh-tech.uk';
const ORG_ID = `${BASE_URL}/#organization`;
const LOCAL_BUSINESS_ID = `${BASE_URL}/#localbusiness`;
import { DEFAULT_SOCIAL_IMAGE } from './social-image.mjs';
const DEFAULT_IMAGE = DEFAULT_SOCIAL_IMAGE;
const HOMEPAGE_TITLE = 'Business IT Support in Shropshire & the Marches';
const HOMEPAGE_DESCRIPTION = 'Friendly, expert business IT support across Shropshire, Herefordshire and the Welsh Borders. From £40/user/month. No 3-year lock-ins. Fast remote fixes.';
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export function finalTitle(title) {
  const long = `${title} | Fresh Tech IT Support`;
  if (long.length <= 65) return long;
  const short = `${title} | Fresh Tech`;
  return short.length <= 65 ? short : title;
}

const address = () => ({
  '@type': 'PostalAddress', streetAddress: '28 Livesey Avenue', addressLocality: 'Ludlow',
  addressRegion: 'Shropshire', postalCode: 'SY8 1HN', addressCountry: 'GB',
});
const offer = (name, path) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, url: `${BASE_URL}${path}` } });

const localBusiness = image => ({
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'ProfessionalService'],
  '@id': LOCAL_BUSINESS_ID,
  name: 'Fresh Tech IT Support',
  description: 'Managed IT Support and Cybersecurity services for businesses in Shropshire, Herefordshire, and the West Midlands.',
  image,
  url: `${BASE_URL}/`,
  telephone: '+441584517234',
  email: 'hello@fresh-tech.uk',
  priceRange: '££',
  address: address(),
  geo: { '@type': 'GeoCoordinates', latitude: 52.368, longitude: -2.717 },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00', closes: '17:00',
  }],
  areaServed: [
    ['AdministrativeArea', 'Shropshire'], ['AdministrativeArea', 'Herefordshire'],
    ['AdministrativeArea', 'Worcestershire'], ['AdministrativeArea', 'Powys'],
    ['City', 'Ludlow'], ['City', 'Shrewsbury'], ['City', 'Hereford'], ['City', 'Telford'],
    ['City', 'Worcester'], ['City', 'Leominster'], ['City', 'Ross-on-Wye'], ['City', 'Bridgnorth'],
    ['City', 'Malvern'], ['City', 'Ledbury'], ['City', 'Oswestry'], ['City', 'Welshpool'],
  ].map(([type, name]) => ({ '@type': type, name })),
  serviceArea: {
    '@type': 'GeoCircle',
    geoMidpoint: { '@type': 'GeoCoordinates', latitude: 52.368, longitude: -2.717 },
    geoRadius: '55000',
  },
  makesOffer: [
    offer('Managed IT Support', '/services/managed-it-support'),
    offer('Cyber Security', '/services/cybersecurity'),
    offer('Cyber Essentials Certification Support', '/services/cyber-essentials'),
    offer('Microsoft 365 & Cloud Solutions', '/services/cloud-solutions'),
    offer('Cloud Backup & Disaster Recovery', '/services/backup-disaster-recovery'),
    offer('Business Phone Systems', '/services/cloud-phone-systems'),
    offer('Hardware Procurement', '/services/hardware-procurement'),
    offer('Strategic IT Projects', '/services/strategic-projects'),
    offer('Managed Print', '/services/managed-print'),
  ],
});

const organization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Fresh Tech IT Support',
  legalName: 'Fresh PCS Consultancy Ltd',
  identifier: [
    { '@type': 'PropertyValue', propertyID: 'UK Companies House', value: '09296207' },
    { '@type': 'PropertyValue', propertyID: 'VAT', value: 'GB199976510' },
  ],
  url: BASE_URL,
  logo: 'https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png',
  description: 'Business IT support for SMEs across Shropshire, Herefordshire and the wider UK. Fast remote response, proactive security, and jargon-free service.',
  foundingDate: '2014',
  founders: [{ '@type': 'Person', name: 'Sam James' }],
  address: address(),
  contactPoint: {
    '@type': 'ContactPoint', telephone: '+441584517234', contactType: 'customer service',
    email: 'hello@fresh-tech.uk', availableLanguage: ['English'],
  },
  sameAs: ['https://www.facebook.com/freshtechuk', 'https://www.linkedin.com/company/fresh-tech-uk'],
});

export function homepageSeo() {
  return {
    title: finalTitle(HOMEPAGE_TITLE),
    description: HOMEPAGE_DESCRIPTION,
    canonical: `${BASE_URL}/`,
    image: DEFAULT_IMAGE,
    ogType: 'website',
    robots: INDEX_ROBOTS,
    schemas: [localBusiness(DEFAULT_IMAGE), organization()],
  };
}
