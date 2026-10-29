// Fixed copy and display rules of the technology family, copied verbatim from
// pages/TechnologyLandingPage.tsx and pages/TechExplainerPage.tsx. Nothing here
// is new editorial content; the strings are the current React output.
export const listingCopy = Object.freeze({
  highlight: 'Knowledge Base',
  title: 'Technology Explained',
  subtitle: 'Plain-English guides to the technology that protects your business. No jargon, no sales pitch - just clear explanations of what these tools do and why they matter.',
  introHeading: 'Why We Created This',
  intro: "IT is full of acronyms and technical terms. We believe you deserve to understand what you're paying for - and why it matters to your business. These guides explain each technology in plain English, focusing on business benefits and real-world risks.",
  topicsHeading: 'All Topics',
  topicsSub: 'Click any topic to learn more',
  readGuide: 'Read Guide',
  ctaHeading: "Have a question we haven't answered?",
  ctaBody: "We're always happy to explain technology in plain English. Get in touch.",
  ctaPrimary: { label: 'Ask a Question', href: '/contact' },
  ctaSecondary: { label: 'Resource Centre', href: '/resources' },
});

export const explainerCopy = Object.freeze({
  breadcrumbHome: 'Home',
  breadcrumbListing: 'Technology Explained',
  eyebrow: 'Technology Explained',
  heroPrimary: { label: 'Talk to an Expert', href: '/contact' },
  heroPhone: { label: 'Call 01584 517 234', href: 'tel:01584517234' },
  whatHeading: 'What is it?',
  benefitsHeading: 'Business Benefits',
  risksHeading: 'Risks Without It',
  howHeading: 'How Fresh Tech Implements This',
  faqHeading: 'Frequently Asked Questions',
  relatedHeading: 'Related Services',
  moreHeading: 'More Technology Explained',
  moreSub: 'Explore our other jargon-free technology guides',
  ctaHeading: 'Ready to protect your business?',
  ctaBody: "Let's talk about how we can implement these technologies for your organisation.",
  ctaPrimary: { label: 'Get in Touch', href: '/contact' },
  ctaSecondary: { label: 'View All Services', href: '/services' },
});

// `Common questions about {data.h1.toLowerCase()}` in the React FAQ section.
export const faqSubheading = h1 => `Common questions about ${h1.toLowerCase()}`;

// TechnologyLandingPage: categories in their declared order, each with the
// cards whose category matches in card order; empty categories are skipped.
export function groupListing(listing) {
  return listing.categories
    .map(category => ({ category, pages: listing.pages.filter(page => page.category === category) }))
    .filter(group => group.pages.length > 0);
}

// TechExplainerPage: allTechPages minus the current route, in source order.
export function otherTechPages(directory, slug) {
  return directory.filter(page => page.slug !== slug);
}

// Hero image delivery. The source URLs are full-size Cloudinary originals
// (`/upload/f_auto,q_auto/<id>`); the VPN original is about 740KB and was the
// mobile LCP. The native frame is a 2:1 box at most 1100px wide, so the
// same image is requested as 2:1 crops at a few widths and the browser picks
// one. The crop matches the frame's `aspect-ratio: 2 / 1; object-fit: cover`,
// so what is visible does not change. Any other URL is left untouched.
export const HERO_IMAGE_WIDTHS = Object.freeze([480, 720, 1200, 1600]);
export const HERO_IMAGE_SIZES = '(min-width: 768px) min(calc(100vw - 64px), 1100px), calc(100vw - 40px)';
const CLOUDINARY_HERO = /^(https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/)f_auto,q_auto\/([^/?#]+)$/;
export function heroImageSources(url) {
  const match = typeof url === 'string' ? url.match(CLOUDINARY_HERO) : null;
  if (!match) return { src: url, srcset: undefined, sizes: undefined };
  const at = width => `${match[1]}w_${width},c_fill,ar_2:1,f_auto,q_auto/${match[2]}`;
  return { src: at(1200), srcset: HERO_IMAGE_WIDTHS.map(width => `${at(width)} ${width}w`).join(', '), sizes: HERO_IMAGE_SIZES };
}
