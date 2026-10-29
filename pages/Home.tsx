import React, { Suspense } from 'react';
import { Hero } from '../components/Hero';
import { SocialProofBanner } from '../components/SocialProofBanner';
import { LiveStats } from '../components/LiveStats';
import { ObjectionHandler } from '../components/ObjectionHandler';
import { SEO } from '../components/SEO';

// Lazy load below-the-fold components to reduce initial bundle size
const Services = React.lazy(() => import('../components/Services').then(module => ({ default: module.Services })));
const Process = React.lazy(() => import('../components/Process').then(module => ({ default: module.Process })));
const CyberEssentialsPromo = React.lazy(() => import('../components/CyberEssentialsPromo').then(module => ({ default: module.CyberEssentialsPromo })));
const HomeCaseStudies = React.lazy(() => import('../components/HomeCaseStudies').then(module => ({ default: module.HomeCaseStudies })));
const Industries = React.lazy(() => import('../components/Industries').then(module => ({ default: module.Industries })));
const Testimonials = React.lazy(() => import('../components/Testimonials').then(module => ({ default: module.Testimonials })));
const BuyersGuideCta = React.lazy(() => import('../components/BuyersGuideCta').then(module => ({ default: module.BuyersGuideCta })));
const Faq = React.lazy(() => import('../components/Faq').then(module => ({ default: module.Faq })));
const Contact = React.lazy(() => import('../components/Contact').then(module => ({ default: module.Contact })));

export const Home: React.FC = () => {
  // Combined Schema Graph for Homepage (LocalBusiness + WebSite + SiteNavigationElement)
  const homepageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      // WebSite schema with SearchAction for sitelinks searchbox
      {
        "@type": "WebSite",
        "name": "Fresh Tech IT Support",
        "url": "https://fresh-tech.uk",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://fresh-tech.uk/blog?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      // SiteNavigationElement for encouraging Google Sitelinks
      {
        "@type": "ItemList",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "IT Support Services",
            "description": "Managed IT support, cybersecurity, cloud solutions and hardware procurement",
            "url": "https://fresh-tech.uk/services"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Pricing",
            "description": "Transparent IT support pricing with instant calculator",
            "url": "https://fresh-tech.uk/pricing"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "About Us",
            "description": "Meet the Fresh Tech team - local IT experts since 2014",
            "url": "https://fresh-tech.uk/about"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Case Studies",
            "description": "Real success stories from businesses we've helped",
            "url": "https://fresh-tech.uk/case-studies"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 5,
            "name": "Blog",
            "description": "IT tips, cybersecurity news and guides",
            "url": "https://fresh-tech.uk/blog"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 6,
            "name": "Contact",
            "description": "Get in touch - call, email or book a consultation",
            "url": "https://fresh-tech.uk/contact"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 7,
            "name": "Cyber Essentials",
            "description": "Get Cyber Essentials certified with our guided support",
            "url": "https://fresh-tech.uk/services/cyber-essentials"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 8,
            "name": "IT Health Check",
            "description": "Free 3-minute assessment of your business technology",
            "url": "https://fresh-tech.uk/it-health-check"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 9,
            "name": "Switching IT Provider",
            "description": "How to switch IT providers with zero downtime - our onboarding process",
            "url": "https://fresh-tech.uk/onboarding"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 10,
            "name": "Why Trust Us",
            "description": "Our guarantees, live helpdesk stats, certifications, and what to expect in your first 30 days",
            "url": "https://fresh-tech.uk/why-trust-us"
          }
        ]
      },
      // LocalBusiness/ITService schema with AggregateRating
      {
        "@type": "ITService",
        "name": "Fresh Tech IT Support",
        "image": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png",
        "url": "https://fresh-tech.uk",
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
        "sameAs": [
          "https://www.facebook.com/freshtechuk",
          "https://www.linkedin.com/company/fresh-tech-uk"
        ],
        "areaServed": [
          { "@type": "City", "name": "Ludlow" },
          { "@type": "City", "name": "Shrewsbury" },
          { "@type": "City", "name": "Hereford" },
          { "@type": "City", "name": "Telford" },
          { "@type": "AdministrativeArea", "name": "Shropshire" },
          { "@type": "AdministrativeArea", "name": "Herefordshire" },
          { "@type": "AdministrativeArea", "name": "Worcestershire" }
        ]
      }
    ]
  };

  return (
    <>
      <SEO
        title="IT Support Shropshire & Herefordshire"
        description="Business IT support across Shropshire, Herefordshire and beyond. Fast onsite response, proactive cyber security, and jargon-free service. Call 01584 517 234."
        schema={homepageSchema}
      />
      {/* Eager Load Top Content */}
      <Hero />
      <SocialProofBanner />
      <LiveStats />
      <ObjectionHandler />

      {/* Lazy Load Below-The-Fold Content */}
      <Suspense fallback={<div className="py-20 bg-white" />}>
        <Services />
      </Suspense>

      <Suspense fallback={<div className="py-20 bg-secondary/10" />}>
        <Process />
      </Suspense>
      
      <Suspense fallback={<div className="py-12 bg-gray-50" />}>
        <CyberEssentialsPromo />
      </Suspense>
      
      <Suspense fallback={<div className="py-20 bg-secondary/10" />}>
        <HomeCaseStudies />
      </Suspense>

      <Suspense fallback={<div className="py-20 bg-neutral" />}>
        <Industries />
      </Suspense>
      
      <Suspense fallback={<div className="py-20 bg-neutral" />}>
        <Testimonials />
      </Suspense>

      {/* IT Health Check Promo */}
      <section className="py-16 bg-linear-to-br from-primary to-primary-dark text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1 rounded-full text-sm font-medium mb-6">
              <span className="animate-pulse">🩺</span> Free Assessment
            </div>
            <h2 className="font-heading text-3xl md:text-4xl mb-4">
              How Healthy Is Your IT?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Take our free 3-minute health check. Answer 10 simple questions and get an instant report on your security, backups, and hardware readiness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/it-health-check"
                className="inline-flex items-center justify-center gap-2 bg-accent text-neutral px-8 py-4 rounded-lg font-bold text-lg shadow-comic border-2 border-neutral hover:translate-y-[2px] hover:shadow-comic-hover transition-all"
              >
                Start Free Health Check
                <span className="text-sm font-semibold text-neutral/90">→ 3 mins</span>
              </a>
            </div>
            <p className="text-sm text-white/60 mt-4">No email required. Instant results.</p>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="py-20 bg-white" />}>
        <BuyersGuideCta />
      </Suspense>
      
      <Suspense fallback={<div className="py-20 bg-white" />}>
        <Faq />
      </Suspense>

      <Suspense fallback={<div className="py-20 bg-tertiary/30" />}>
        <Contact />
      </Suspense>
    </>
  );
};