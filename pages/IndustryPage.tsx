import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { industryPages } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, Shield, Zap, Headphones, ChevronDown, ChevronUp, RefreshCw, Cloud, Folder, Users, Cog, Laptop, Lock, Mail, Briefcase, Scale, Server, Database, Building, Heart, Monitor, Eye, BookOpen, FileCheck, Leaf, MapPin, Clock, BadgeCheck, FileText, PiggyBank, Satellite, Upload, ArrowRight } from 'lucide-react';
import { Testimonials } from '../components/Testimonials';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { trackServiceView } from '../utils/analytics';
import { useInView } from '../hooks/useInView';

export const IndustryPage = () => {
  const location = useLocation();
  // Extract industry slug from pathname (e.g., "/industries/accountants" -> "accountants")
  const industry = location.pathname.replace(/^\/industries\//, '');
  const data = industryPages[industry];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [challengesRef, challengesInView] = useInView(0.1);
  const [solutionsRef, solutionsInView] = useInView(0.1);
  const [faqRef, faqInView] = useInView(0.05);
  const [ctaRef, ctaInView] = useInView(0.2);

  // Track page view
  useEffect(() => {
    if (data) {
      trackServiceView(`industry_${data.slug}`);
    }
  }, [data]);

  if (!data) {
    return <Navigate to="/404" />;
  }

  // Icon mapping
  const iconMap: Record<string, React.ElementType> = {
    CheckCircle, Shield, Zap, Headphones, RefreshCw, Cloud, Folder, Users, Cog, Laptop,
    Lock, Mail, Briefcase, Scale, Server, Database, Building, Heart, Monitor, Eye,
    BookOpen, FileCheck, Leaf, MapPin, Clock, BadgeCheck, FileText, PiggyBank, Satellite, Upload
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Schema for industry service
  const industrySchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `IT Support for ${data.h1.replace('IT Support for ', '')}`,
    "description": data.metaDesc,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Fresh Tech IT Support",
      "@id": "https://fresh-tech.uk/#organization",
      "telephone": "+441584517234",
      "email": "hello@fresh-tech.uk",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ludlow",
        "addressRegion": "Shropshire",
        "addressCountry": "GB"
      }
    },
    "audience": {
      "@type": "BusinessAudience",
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "minValue": data.minStaff
      }
    }
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
        "text": faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      }
    }))
  };

  return (
    <>
      <SEO
        title={data.title}
        description={data.metaDesc}
        canonical={`https://fresh-tech.uk/industries/${data.slug}`}
        schema={[industrySchema, faqSchema]}
      />

      {/* Hero Section */}
      <section className="bg-linear-to-br from-primary via-primary to-secondary text-white pt-32 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Industries', href: '/industries' },
              { label: data.h1.replace('IT Support for ', '') }
            ]}
            variant="light"
          />
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{data.h1}</h1>
          <p className="text-xl text-gray-200 mb-4 leading-relaxed">{data.intro}</p>
          <p className="text-sm text-gray-300 mb-8">Designed for businesses with {data.minStaff}+ staff who value technology as a business enabler.</p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg transition-all shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px]"
            >
              {data.cta}
            </Link>
            <a
              href="tel:01584517234"
              className="bg-white text-neutral border-2 border-neutral font-bold px-8 py-4 rounded-lg transition-all shadow-comic-hover hover:shadow-comic hover:translate-y-[-2px]"
            >
              Call 01584 517 234
            </a>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section ref={challengesRef as React.RefObject<HTMLElement>} className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className={`font-heading text-3xl text-center mb-4 text-neutral transition-all duration-700 ${challengesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>The IT Challenges You Face</h2>
          <p className={`text-center text-gray-600 mb-12 max-w-2xl mx-auto transition-all duration-700 ${challengesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>We understand the specific technology pressures in your sector</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.challenges.map((challenge, index) => {
              const IconComponent = iconMap[challenge.icon] || CheckCircle;
              return (
                <div key={index} className={`bg-red-50 border border-red-100 rounded-xl p-6 transition-all duration-500 ${challengesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${150 + index * 100}ms` }}>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-heading text-lg mb-2 text-gray-900">{challenge.title}</h3>
                  <p className="text-gray-600 text-sm">{challenge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section ref={solutionsRef as React.RefObject<HTMLElement>} className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className={`font-heading text-3xl text-center mb-4 text-neutral transition-all duration-700 ${solutionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>How Fresh Tech Helps</h2>
          <p className={`text-center text-gray-600 mb-12 max-w-2xl mx-auto transition-all duration-700 ${solutionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Practical solutions designed for your industry</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.solutions.map((solution, index) => {
              const IconComponent = iconMap[solution.icon] || CheckCircle;
              return (
                <div key={index} className={`bg-white rounded-xl p-6 shadow-xs hover:shadow-lg transition-all duration-500 ${solutionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${150 + index * 100}ms` }}>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading text-lg mb-2 text-primary">{solution.title}</h3>
                  <p className="text-gray-600 text-sm">{solution.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <RichText text={data.content} />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef as React.RefObject<HTMLElement>} className="py-16 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className={`font-heading text-3xl text-center mb-4 text-neutral transition-all duration-700 ${faqInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Frequently Asked Questions
          </h2>
          <p className={`text-center text-gray-600 mb-12 transition-all duration-700 ${faqInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Common questions from businesses in your sector</p>

          <div className="space-y-4">
            {data.faqs.map((faq, index) => (
              <div key={index} className={`bg-white rounded-xl overflow-hidden shadow-xs transition-all duration-500 ${faqInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${150 + index * 75}ms` }}>
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

      {/* CTA Section */}
      <section ref={ctaRef as React.RefObject<HTMLElement>} className="py-16 bg-primary">
        <div className={`container max-w-4xl mx-auto px-4 text-center transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-3xl text-white mb-4">Ready to Talk?</h2>
          <p className="text-xl text-gray-200 mb-8">Let's discuss how we can support your business</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg transition-all shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px]"
            >
              {data.cta}
            </Link>
            <Link
              to="/pricing"
              className="bg-white text-neutral border-2 border-neutral font-bold px-8 py-4 rounded-lg transition-all shadow-comic-hover hover:shadow-comic hover:translate-y-[-2px] flex items-center gap-2"
            >
              View Pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Contact */}
      <Contact />
    </>
  );
};
