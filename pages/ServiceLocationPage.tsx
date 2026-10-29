import React, { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { serviceLocationPages } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, MapPin, Zap, Wifi, Leaf, Shield, ChevronDown, ChevronUp, Headphones, Building, RefreshCw, Cloud, Folder, Users, Truck, Wrench, ArrowRight } from 'lucide-react';
import { Testimonials } from '../components/Testimonials';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const ServiceLocationPage = () => {
  const location = useLocation();
  // Extract slug from pathname (e.g., "/it-support-shropshire" -> "it-support-shropshire")
  const slug = location.pathname.replace(/^\//, '');
  const data = serviceLocationPages[slug];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!data) {
    return <Navigate to="/404" />;
  }

  // Icon mapping
  const iconMap: Record<string, React.ElementType> = {
    CheckCircle, MapPin, Zap, Wifi, Leaf, Shield, Headphones, Building, RefreshCw, Cloud, Folder, Users, Truck, Wrench, Tool: Wrench
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Schema for local service
  const serviceLocationSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${data.service} - ${data.location}`,
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
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": data.location
    },
    "serviceType": data.service
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
        canonical={`https://fresh-tech.uk/${slug}`}
        schema={[serviceLocationSchema, faqSchema]}
      />

      {/* Hero Section */}
      <section className="bg-linear-to-br from-primary via-primary to-secondary text-white pt-32 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Services', href: '/services' },
              { label: data.service, href: `/services/${data.relatedService}` },
              { label: data.location }
            ]}
            variant="light"
          />
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{data.h1}</h1>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">{data.intro}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Get a Quote
            </Link>
            <a
              href="tel:01584517234"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
            >
              Call 01584 517 234
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Why Choose Fresh Tech in {data.location}?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.benefits.map((benefit, index) => {
              const IconComponent = iconMap[benefit.icon] || CheckCircle;
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-primary">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <RichText text={data.content} />
            </div>

            {/* Local Context */}
            <div className="mt-8 p-6 bg-primary/5 rounded-xl border-l-4 border-accent">
              <h3 className="font-bold text-lg text-primary mb-2">Local Expertise</h3>
              <p className="text-gray-700">{data.localContext}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">
            {data.service} in {data.location}: FAQs
          </h2>
          <p className="text-center text-gray-600 mb-12">Common questions about our services in {data.location}</p>

          <div className="space-y-4">
            {data.faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
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

      {/* Related Links */}
      <section className="py-12 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={`/services/${data.relatedService}`}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-primary font-medium"
            >
              See {data.service} details <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/locations/${data.relatedLocation}`}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-primary font-medium"
            >
              All services in {data.location} <ArrowRight className="w-4 h-4" />
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
