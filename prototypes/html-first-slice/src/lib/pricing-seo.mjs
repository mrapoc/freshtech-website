import { areaServed, sharedSchemas, siteTitle } from './service-seo.mjs';

const SITE = 'https://fresh-tech.uk';
export const PRICING_RAW_TITLE = 'Pricing: Simple per-user IT support';
export const PRICING_DESCRIPTION = "Indicative per-user pricing for managed IT support. Standard from £40/user/month. No setup fees, no time-and-materials creep. Onsite visits billed separately.";
export const PRICING_CANONICAL = `${SITE}/pricing`;
// The pricing H1. Held here because the page, the two output checks and the two
// browser gates all assert it; when it was a literal in each, the October 2026
// change to "Remote IT support. Priced per person." left four of them stale.
export const PRICING_H1 = 'Remote IT support. Priced per person.';

export function pricingHead() {
  const { localBusiness, organization } = sharedSchemas();
  return {
    title: siteTitle(PRICING_RAW_TITLE),
    description: PRICING_DESCRIPTION,
    canonical: PRICING_CANONICAL,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: PRICING_RAW_TITLE,
        description: PRICING_DESCRIPTION,
        url: PRICING_CANONICAL,
        provider: { '@id': `${SITE}/#localbusiness` },
        areaServed: areaServed(),
      },
      localBusiness,
      organization,
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Pricing', item: PRICING_CANONICAL },
        ],
      },
    ],
  };
}
