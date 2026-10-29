import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'service' | 'profile' | 'collection';
  slug?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: { name: string; item: string }[];
  faqs?: { q: string; a: string }[];
  noIndex?: boolean;
  canonical?: string;
  canonicalPath?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image = "https://fresh-tech.uk/images/fresh-tech-social-20261016.png", // Default social share image (1200x630 for OG)
  type = 'website',
  slug: _slug = '',
  schema,
  breadcrumbs,
  faqs,
  noIndex = false,
  canonical,
  canonicalPath
}) => {
  const location = useLocation();
  const baseUrl = 'https://fresh-tech.uk';
  // Normalize: strip trailing slash (except root) for consistent canonicals
  const normalizedPath = location.pathname.length > 1 && location.pathname.endsWith('/')
    ? location.pathname.slice(0, -1)
    : location.pathname;
  // Use explicit canonical if provided, otherwise derive from current URL
  const currentUrl = canonical
    ? (canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`)
    : canonicalPath
      ? `${baseUrl}${canonicalPath}`
      : `${baseUrl}${normalizedPath}`;

  // Cap title at ~65 chars for SERP display. Shorten brand suffix progressively.
  const TITLE_MAX = 65;
  const longSuffix = ' | Fresh Tech IT Support';
  const shortSuffix = ' | Fresh Tech';
  const finalTitle =
    (title + longSuffix).length <= TITLE_MAX ? title + longSuffix
    : (title + shortSuffix).length <= TITLE_MAX ? title + shortSuffix
    : title;
  
  // Updated description to avoid industry jargon - acts as fallback for pages that don't pass one
  const finalDescription = description || "Business IT support for UK SMEs. Managed IT, 24/7 Huntress SOC, Dell Premier hardware, Cyber Essentials prep. Fast remote response, jargon-free service. From £40/user/month.";

  // Ensure image is an absolute URL for Open Graph to work correctly
  const finalImage = image.startsWith('http') ? image : `${baseUrl}${image}`;

  useEffect(() => {
    // 1. Update Basic Meta Tags
    document.title = finalTitle;
    
    updateMeta('name', 'description', finalDescription);
    updateLink('canonical', currentUrl);

    // 2. Robots Tag (Critical for SEO & Soft 404 handling)
    // max-image-preview:large helps Google Discover/AI show big thumbnails
    const robotsContent = noIndex 
      ? "noindex, nofollow" 
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    updateMeta('name', 'robots', robotsContent);

    // 3. Update Open Graph (Facebook/LinkedIn)
    updateMeta('property', 'og:title', finalTitle);
    updateMeta('property', 'og:description', finalDescription);
    updateMeta('property', 'og:image', finalImage);
    updateMeta('property', 'og:image:width', '1200');
    updateMeta('property', 'og:image:height', '630');
    updateMeta('property', 'og:url', currentUrl);
    // Map our internal `type` prop to a valid Open Graph type.
    // OG only accepts: website, article, profile, book, music.*, video.*, game.*
    // Our 'service' and 'collection' types fall back to 'website'.
    const ogType: string =
      type === 'article' || type === 'profile' ? type :
      type === 'website'                       ? 'website' :
                                                 'website';
    updateMeta('property', 'og:type', ogType);
    updateMeta('property', 'og:site_name', 'Fresh Tech IT Support');
    updateMeta('property', 'og:locale', 'en_GB');

    // 4. Update Twitter/X Cards (for link previews when shared)
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:site', '@fresh_tech_');
    updateMeta('name', 'twitter:creator', '@fresh_tech_');
    updateMeta('name', 'twitter:title', finalTitle);
    updateMeta('name', 'twitter:description', finalDescription);
    updateMeta('name', 'twitter:image', finalImage);

    // 5. Inject JSON-LD Schemas
    const schemasToInject: Record<string, unknown>[] = [];

    const ORG_ID = `${baseUrl}/#organization`;
    const LOCAL_BUSINESS_ID = `${baseUrl}/#localbusiness`;

    const localBusinessSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      // ProfessionalService is a LocalBusiness subtype that better fits a B2B
      // IT/MSP; declaring both keeps existing LocalBusiness signals intact.
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": LOCAL_BUSINESS_ID,
      "name": "Fresh Tech IT Support",
      "description": "Managed IT Support and Cybersecurity services for businesses in Shropshire, Herefordshire, and the West Midlands.",
      "image": finalImage,
      "url": `${baseUrl}/`,
      "telephone": "+441584517234",
      "email": "hello@fresh-tech.uk",
      "priceRange": "££",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "28 Livesey Avenue",
        "addressLocality": "Ludlow",
        "addressRegion": "Shropshire",
        "postalCode": "SY8 1HN",
        "addressCountry": "GB"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 52.368,
        "longitude": -2.717
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "17:00"
        }
      ],
      "areaServed": [
        { "@type": "AdministrativeArea", "name": "Shropshire" },
        { "@type": "AdministrativeArea", "name": "Herefordshire" },
        { "@type": "AdministrativeArea", "name": "Worcestershire" },
        { "@type": "AdministrativeArea", "name": "Powys" },
        { "@type": "City", "name": "Ludlow" },
        { "@type": "City", "name": "Shrewsbury" },
        { "@type": "City", "name": "Hereford" },
        { "@type": "City", "name": "Telford" },
        { "@type": "City", "name": "Worcester" },
        { "@type": "City", "name": "Leominster" },
        { "@type": "City", "name": "Ross-on-Wye" },
        { "@type": "City", "name": "Bridgnorth" },
        { "@type": "City", "name": "Malvern" },
        { "@type": "City", "name": "Ledbury" },
        { "@type": "City", "name": "Oswestry" },
        { "@type": "City", "name": "Welshpool" }
      ],
      // Genuine service radius from the Ludlow HQ (~55km reaches Shrewsbury,
      // Hereford, Worcester and Welshpool — the four-county footprint).
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": { "@type": "GeoCoordinates", "latitude": 52.368, "longitude": -2.717 },
        "geoRadius": "55000"
      },
      // Explicit service catalogue so search + AI engines can extract exactly
      // what we offer. Only real services with live /services pages.
      "makesOffer": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Managed IT Support", "url": `${baseUrl}/services/managed-it-support` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Cyber Security", "url": `${baseUrl}/services/cybersecurity` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Cyber Essentials Certification Support", "url": `${baseUrl}/services/cyber-essentials` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Microsoft 365 & Cloud Solutions", "url": `${baseUrl}/services/cloud-solutions` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Cloud Backup & Disaster Recovery", "url": `${baseUrl}/services/backup-disaster-recovery` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Business Phone Systems", "url": `${baseUrl}/services/cloud-phone-systems` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Hardware Procurement", "url": `${baseUrl}/services/hardware-procurement` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Strategic IT Projects", "url": `${baseUrl}/services/strategic-projects` } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Managed Print", "url": `${baseUrl}/services/managed-print` } }
      ]
    };

    // A. Main Schema — by type. Pages can override via the `schema` prop.
    if (schema) {
      if (Array.isArray(schema)) {
        schemasToInject.push(...schema);
      } else {
        schemasToInject.push(schema);
      }
    } else if (type === 'website') {
      schemasToInject.push(localBusinessSchema);
    } else if (type === 'service') {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": title,
        "description": finalDescription,
        "url": currentUrl,
        "provider": { "@id": LOCAL_BUSINESS_ID },
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Shropshire" },
          { "@type": "AdministrativeArea", "name": "Herefordshire" },
          { "@type": "AdministrativeArea", "name": "Worcestershire" },
          { "@type": "AdministrativeArea", "name": "Powys" }
        ]
      });
      // Service pages also need LocalBusiness on the graph so the @id reference resolves.
      schemasToInject.push(localBusinessSchema);
    } else if (type === 'article') {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": finalDescription,
        "image": finalImage,
        "url": currentUrl,
        "author": { "@id": ORG_ID },
        "publisher": { "@id": ORG_ID },
        "mainEntityOfPage": currentUrl
      });
    } else if (type === 'profile') {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": title,
        "description": finalDescription,
        "url": currentUrl,
        "mainEntity": { "@id": LOCAL_BUSINESS_ID }
      });
      schemasToInject.push(localBusinessSchema);
    } else if (type === 'collection') {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": finalDescription,
        "url": currentUrl,
        "isPartOf": { "@id": ORG_ID }
      });
    }

    // B. Organization Schema (always include for brand identity)
    schemasToInject.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORG_ID,
      "name": "Fresh Tech IT Support",
      "legalName": "Fresh PCS Consultancy Ltd",
      "identifier": [
        { "@type": "PropertyValue", "propertyID": "UK Companies House", "value": "09296207" },
        { "@type": "PropertyValue", "propertyID": "VAT", "value": "GB199976510" }
      ],
      "url": "https://fresh-tech.uk",
      "logo": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png",
      "description": "Business IT support for SMEs across Shropshire, Herefordshire and the wider UK. Fast remote response, proactive security, and jargon-free service.",
      "foundingDate": "2014",
      "founders": [
        {
          "@type": "Person",
          "name": "Sam James"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "28 Livesey Avenue",
        "addressLocality": "Ludlow",
        "addressRegion": "Shropshire",
        "postalCode": "SY8 1HN",
        "addressCountry": "GB"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+441584517234",
        "contactType": "customer service",
        "email": "hello@fresh-tech.uk",
        "availableLanguage": ["English"]
      },
      "sameAs": [
        "https://www.facebook.com/freshtechuk",
        "https://www.linkedin.com/company/fresh-tech-uk"
      ]
    });

    // C. Breadcrumb Schema — explicit prop OR auto-derived from pathname for nested pages.
    const finalBreadcrumbs = breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : autoBreadcrumbs(normalizedPath);
    if (finalBreadcrumbs.length > 0) {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": finalBreadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.item.startsWith('http') ? crumb.item : `${baseUrl}${crumb.item}`
        }))
      });
    }

    // D. FAQ Schema — only inject if explicitly passed. Note: Google removed FAQ rich
    // results for non-government/non-healthcare sites in Aug 2023. Pass `faqs` only
    // for genuine gov/healthcare authority content; for everyone else leave it off
    // and keep the FAQ UI as plain on-page content.
    if (faqs && faqs.length > 0) {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      });
    }

    // Inject all schemas
    injectSchemas(schemasToInject);

  }, [title, description, image, type, currentUrl, schema, finalTitle, finalDescription, finalImage, breadcrumbs, faqs, noIndex, normalizedPath]);

  return null;
};

// Pretty-name a URL segment: "cyber-essentials" → "Cyber Essentials".
// Special-cases handle slugs that don't title-case cleanly (e.g. "ai-acceptable-use-policy").
const SEGMENT_NAMES: Record<string, string> = {
  '': 'Home',
  'industries': 'Sectors',
  'locations': 'Locations',
  'services': 'Services',
  'case-studies': 'Case Studies',
  'blog': 'Blog',
  'why-trust-us': 'Why Trust Us',
  'it-health-check': 'IT Health Check',
  'microsoft-business-premium': 'Microsoft 365 Business Premium',
  'ai-acceptable-use-policy': 'AI Acceptable Use Policy',
  'privacy-policy': 'Privacy Policy',
  'terms-conditions': 'Terms & Conditions',
  'terms-of-business': 'Terms of Business',
  'dpa': 'Data Processing Terms',
  'sub-processors': 'Sub-processors',
  'about': 'About Us',
  'contact': 'Contact',
  'pricing': 'Pricing',
  'onboarding': 'Switching IT Provider',
  'careers': 'Careers',
  'refer': 'Refer a Business',
};

const prettifySegment = (segment: string): string => {
  if (segment in SEGMENT_NAMES) return SEGMENT_NAMES[segment];
  return segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const autoBreadcrumbs = (path: string): { name: string; item: string }[] => {
  // Strip leading/trailing slash, skip root (no breadcrumbs for the home page).
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return [];
  const segments = trimmed.split('/');
  const crumbs: { name: string; item: string }[] = [{ name: 'Home', item: '/' }];
  let acc = '';
  for (const seg of segments) {
    acc += '/' + seg;
    crumbs.push({ name: prettifySegment(seg), item: acc });
  }
  return crumbs;
};

// Helper to update meta tags dynamically
const updateMeta = (attribute: string, attributeValue: string, content: string) => {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

// Helper to update link tags (canonical)
const updateLink = (rel: string, href: string) => {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

// Helper to inject JSON-LD
const injectSchemas = (schemas: Record<string, unknown>[]) => {
  const scriptId = 'json-ld-schema';
  let script = document.getElementById(scriptId);
  
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  
  // Wrap multiple schemas in a graph or array
  script.textContent = JSON.stringify(schemas);
};
