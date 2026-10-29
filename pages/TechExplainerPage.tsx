import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { techExplainers, services } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, Shield, Zap, Headphones, RefreshCw, Lock, BadgeCheck, Users, Folder, Cloud, ChevronDown, ChevronUp, AlertTriangle, ArrowRight, Lightbulb, Cog, BookOpen, Monitor, Wifi, Server, Key, Mail, FileWarning, ShieldCheck, Laptop, Globe } from 'lucide-react';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { trackPhoneClick, trackTechExplainerView } from '../utils/analytics';

// Define all tech explainer pages with display info
const allTechPages = [
  { slug: 'rmm', title: 'What is RMM?', icon: Monitor, color: 'blue' },
  { slug: 'edr-mdr', title: 'EDR & MDR', icon: Shield, color: 'red' },
  { slug: 'application-control', title: 'Application Control', icon: Lock, color: 'purple' },
  { slug: 'admin-rights', title: 'Admin Rights', icon: Key, color: 'amber' },
  { slug: 'itdr', title: 'Identity Protection', icon: Users, color: 'green' },
  { slug: 'conditional-access', title: 'Conditional Access', icon: ShieldCheck, color: 'blue' },
  { slug: 'intune-autopilot', title: 'Intune & Autopilot', icon: Laptop, color: 'indigo' },
  { slug: 'ncsc', title: 'The NCSC', icon: BadgeCheck, color: 'teal' },
  { slug: 'patching', title: 'Why Patching Matters', icon: RefreshCw, color: 'orange' },
  { slug: 'end-of-life', title: 'End of Life Devices', icon: FileWarning, color: 'red' },
  { slug: 'business-networking', title: 'Business Networking', icon: Wifi, color: 'cyan' },
  { slug: 'cloud-vs-onpremise', title: 'Cloud vs On-Premise', icon: Server, color: 'violet' },
  { slug: 'zero-trust', title: 'Zero Trust', icon: Globe, color: 'emerald' },
  { slug: 'mfa', title: 'MFA Explained', icon: Key, color: 'green' },
  { slug: 'phishing', title: 'Phishing', icon: Mail, color: 'red' },
  { slug: 'vpn', title: 'VPN & Zero Trust', icon: Lock, color: 'purple' },
];

export const TechExplainerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const data = techExplainers[slug || ''];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Track page view for analytics
  useEffect(() => {
    if (data) {
      trackTechExplainerView(data.h1);
    }
  }, [data]);

  if (!data) {
    return <Navigate to="/404" />;
  }

  // Icon mapping
  const iconMap: Record<string, React.ElementType> = {
    CheckCircle, Shield, Zap, Headphones, RefreshCw, Lock, BadgeCheck, Users, Folder, Cloud
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Get related service details
  const relatedServiceDetails = data.relatedServices
    .map(serviceSlug => services.find(s => s.slug === serviceSlug))
    .filter(Boolean);

  // Schema for the page
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": data.h1,
    "description": data.metaDesc,
    "datePublished": "2025-06-01T00:00:00+00:00",
    "dateModified": "2026-03-04T00:00:00+00:00",
    "author": {
      "@type": "Organization",
      "name": "Fresh Tech IT Support",
      "@id": "https://fresh-tech.uk/#organization",
      "url": "https://fresh-tech.uk"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fresh Tech IT Support",
      "logo": {
        "@type": "ImageObject",
        "url": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png"
      }
    },
    "inLanguage": "en-GB",
    "isAccessibleForFree": true
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Strip markdown links for schema
      }
    }))
  };

  return (
    <>
      <SEO
        title={data.title}
        description={data.metaDesc}
        canonical={`https://fresh-tech.uk/technology/${slug}`}
        schema={[articleSchema, faqSchema]}
      />

      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-primary via-primary to-secondary text-white pt-32 pb-20 overflow-hidden">
        {/* Hero Image Overlay */}
        {data.heroImage && (
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <img
              src={data.heroImage}
              alt={data.h1}
              width={1200}
              height={600}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}
        <div className="container max-w-4xl mx-auto px-4 relative z-10">
          <Breadcrumbs
            items={[
              { label: 'Technology Explained', href: '/technology' },
              { label: data.h1 }
            ]}
            variant="light"
          />
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-accent" />
            <span className="text-accent font-medium">Technology Explained</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{data.h1}</h1>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">{data.intro}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Talk to an Expert
            </Link>
            <a
              href="tel:01584517234"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
              onClick={() => trackPhoneClick('01584 517 234', 'tech_explainer_hero')}
            >
              Call 01584 517 234
            </a>
          </div>
        </div>
      </section>

      {/* What It Is Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-primary">What is it?</h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <RichText text={data.whatItIs} />
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-primary">Business Benefits</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {data.benefits.map((benefit, index) => {
              const IconComponent = iconMap[benefit.icon] || CheckCircle;
              return (
                <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <IconComponent className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-primary">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Risks Section */}
      <section className="py-16 bg-red-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-primary">Risks Without It</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {data.risks.map((risk, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-xs">
                <h3 className="font-bold text-lg mb-2 text-red-700">{risk.title}</h3>
                <p className="text-gray-700">{risk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Do It */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
              <Cog className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-3xl font-bold text-primary">How Fresh Tech Implements This</h2>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 prose prose-lg max-w-none">
            <RichText text={data.howWeDoIt} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 mb-12">Common questions about {data.h1.toLowerCase()}</p>

          <div className="space-y-4">
            {data.faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-primary pr-4">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-accent shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <div className="text-gray-700 leading-relaxed">
                      <RichText text={faq.a} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      {relatedServiceDetails.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8 text-primary">Related Services</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {relatedServiceDetails.map((service, index) => (
                <Link
                  key={index}
                  to={`/services/${service!.slug}`}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-lg transition-colors text-primary font-medium"
                >
                  {service!.title} <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* More Technology Explained */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4 text-primary">More Technology Explained</h2>
          <p className="text-center text-gray-600 mb-8">Explore our other jargon-free technology guides</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {allTechPages
              .filter(page => page.slug !== slug)
              .map((page) => {
                const IconComponent = page.icon;
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-100 text-blue-600',
                  red: 'bg-red-100 text-red-600',
                  purple: 'bg-purple-100 text-purple-600',
                  amber: 'bg-amber-100 text-amber-600',
                  green: 'bg-green-100 text-green-600',
                  indigo: 'bg-indigo-100 text-indigo-600',
                  teal: 'bg-teal-100 text-teal-600',
                  orange: 'bg-orange-100 text-orange-600',
                  cyan: 'bg-cyan-100 text-cyan-600',
                  violet: 'bg-violet-100 text-violet-600',
                  emerald: 'bg-emerald-100 text-emerald-600',
                };
                return (
                  <Link
                    key={page.slug}
                    to={`/technology/${page.slug}`}
                    className="bg-white rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1 text-center group"
                  >
                    <div className={`w-10 h-10 ${colorMap[page.color] || 'bg-gray-100 text-gray-600'} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors">{page.title}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to protect your business?</h2>
          <p className="text-gray-200 text-lg mb-8">
            Let's talk about how we can implement these technologies for your organisation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Get in Touch
            </Link>
            <Link
              to="/services"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <Contact />
    </>
  );
};
