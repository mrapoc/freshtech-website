// Display transformations copied from pages-v2/CaseStudiesPageV2.tsx and
// pages-v2/CaseStudyDetailPageV2.tsx. Kept framework-neutral so the same
// rules render the Astro templates and can be unit-tested with synthetic data.

// SECTOR_COLOURS in CaseStudiesPageV2.tsx. Key order is the "Sectors we've
// worked in" badge order; unknown industries fall back to the primary colour.
export const SECTOR_COLOURS = {
  'Legal': '#1f5c8c',
  'Healthcare': '#2E7D5B',
  'Manufacturing': '#7B4F2E',
  'Agriculture & Food': '#4A7A3A',
  'Field Services': '#5B4A7A',
  'Accountants': '#1F5C8C',
  'Charities': '#e8541f',
  'Engineering': '#7B4F2E',
  'Retail & Distribution': '#1F5C8C',
  'Veterinary': '#2E7D5B',
};
export const DEFAULT_SECTOR_COLOUR = '#3288be';
export const sectorColour = industry => SECTOR_COLOURS[industry] || DEFAULT_SECTOR_COLOUR;
export const sectorTextColour = industry => ['Charities'].includes(industry) || !Object.hasOwn(SECTOR_COLOURS, industry) ? '#0F1923' : '#FFFFFF';
export const coverageSectors = () => Object.keys(SECTOR_COLOURS);

export const victoryOf = study => study.shortStats?.victory ?? study.result ?? 'Win';

// The STUDIES mapping: first two source entries are featured.
export function displayStudy(study, index) {
  return {
    client: study.client,
    slug: study.slug,
    industry: study.industry,
    headline: study.title,
    summary: study.outcome,
    metricNum: victoryOf(study).split(' ')[0],
    metricLabel: study.shortStats?.strategy ?? study.result ?? 'Outcome',
    metricSub: study.shortStats?.risk ?? '',
    services: study.techStack?.slice(0, 3) ?? [],
    quote: study.testimonial ? { text: study.testimonial, name: study.contactName || study.client } : undefined,
    featured: index < 2,
  };
}

export const displayStudies = studies => studies.map(displayStudy);
export const allSectors = studies => ['All', ...new Set(studies.map(study => study.industry))];
export const countLabel = (total, filtered, filter) => (filter === 'All' ? `${total} stories` : `${filtered} in ${filter}`);

// Detail page: related stories are the first three other entries in source order.
export const relatedStudies = (studies, slug) => studies.filter(study => study.slug !== slug).slice(0, 3);
export const resultHeading = study => study.result || 'Mission accomplished';
