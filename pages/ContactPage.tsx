import { formatMinutes } from '../utils/publicMetrics';
import React from 'react';
import { Link } from 'react-router-dom';
import { Contact } from '../components/Contact';
import { Faq } from '../components/Faq';
import { SEO } from '../components/SEO';
import { PageHeader } from '../components/PageHeader';
import { Clock, Phone, Shield, Zap, MapPin, Mail, Star } from 'lucide-react';
import { faqCategories } from '../data/content';
import { useLiveStats } from '../components/LiveStats';
import { useInView } from '../hooks/useInView';

export const ContactPage = () => {
  const { stats, loading } = useLiveStats();
  const [introRef, introInView] = useInView(0.15);
  const [trustRef, trustInView] = useInView(0.1);
  const [methodsRef, methodsInView] = useInView(0.15);
  const [coverageRef, coverageInView] = useInView(0.15);

  // Extract relevant FAQs for schema (General IT Support has contact-relevant Qs)
  const contactFaqs = faqCategories
    .filter(cat => ['General IT Support', 'Onboarding & Transition'].includes(cat.title))
    .flatMap(cat => cat.items);

  // LocalBusiness schema for contact page
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Fresh Tech IT Support",
    "description": "Managed IT Support and Cybersecurity services for businesses in Shropshire, Herefordshire, and the West Midlands.",
    "url": "https://fresh-tech.uk",
    "telephone": "+441584517234",
    "email": "hello@fresh-tech.uk",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ludlow",
      "addressRegion": "Shropshire",
      "postalCode": "SY8 1HN",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 52.3677,
      "longitude": -2.7181
    },
    "areaServed": [
      { "@type": "City", "name": "Ludlow" },
      { "@type": "City", "name": "Shrewsbury" },
      { "@type": "City", "name": "Hereford" },
      { "@type": "City", "name": "Telford" }
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "42"
    },
    "priceRange": "££"
  };

  // Format response time from live stats
  const getResponseTimeDisplay = () => formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);

  // Format call wait time from live stats
  const getCallWaitDisplay = () => formatMinutes(stats?.CallWaitTimeInMinutes, loading);

  return (
    <div className="bg-white">
      <SEO
        title="Contact Us"
        description="Contact Fresh Tech IT Support in Ludlow, Shropshire. Call 01584 517 234, email hello@fresh-tech.uk, or book a free consultation. Under 15-min response."
        schema={contactSchema}
        faqs={contactFaqs}
      />
      <PageHeader
        title="Contact HQ"
        subtitle="We are standing by to save your day."
        highlightText="Get in touch"
      />

      {/* Intro Content - Unique text for SEO */}
      <section className="py-12 bg-white border-b" ref={introRef as React.RefObject<HTMLElement>}>
        <div className="container max-w-4xl mx-auto px-4">
          <div className={`prose prose-lg max-w-none transition-all duration-700 ${introInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xl text-gray-700 leading-relaxed">
              Whether you're dealing with a tech emergency, thinking about switching IT providers, or just want to chat about how technology could work better for your business - we're here to help.
            </p>
            <p className="text-gray-600">
              When you contact Fresh Tech, you'll speak directly with our team in Ludlow - not a call centre or an automated system. We understand that IT problems don't wait for convenient moments, which is why we prioritise fast, human responses. Most enquiries get a reply within 15 minutes during business hours.
            </p>
            <p className="text-gray-600">
              <strong>Not sure if we're the right fit?</strong> That's completely fine. We're happy to have a no-obligation conversation about your IT setup, answer questions, or point you in the right direction even if we're not the solution. No hard sell, no awkward follow-ups.
            </p>
          </div>
        </div>
      </section>

      {/* Why Contact Us - Trust Signals */}
      <section className="py-16 bg-gray-50 border-b border-gray-100" ref={trustRef as React.RefObject<HTMLElement>}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Why Businesses Choose Fresh Tech</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're not a faceless call centre. We're your local IT team who actually picks up the phone.
            </p>
          </div>

          {/* Stats Grid - Using Live Stats for first two */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className={`bg-white p-6 rounded-xl shadow-xs border border-gray-100 text-center transition-all duration-500 ${trustInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-green-600" />
              </div>
              <div className="font-heading text-3xl text-primary mb-1">{getResponseTimeDisplay()}</div>
              <p className="text-gray-600 text-sm">Avg response time</p>
              <p className="text-xs text-gray-400 mt-1">Live from helpdesk</p>
            </div>
            <div className={`bg-white p-6 rounded-xl shadow-xs border border-gray-100 text-center transition-all duration-500 ${trustInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone size={24} className="text-blue-600" />
              </div>
              <div className="font-heading text-3xl text-primary mb-1">{getCallWaitDisplay()}</div>
              <p className="text-gray-600 text-sm">Avg call wait time</p>
              <p className="text-xs text-gray-400 mt-1">Live from helpdesk</p>
            </div>
            <div className={`bg-white p-6 rounded-xl shadow-xs border border-gray-100 text-center transition-all duration-500 ${trustInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-purple-600" />
              </div>
              <div className="font-heading text-3xl text-primary mb-1">10+ yrs</div>
              <p className="text-gray-600 text-sm">Supporting local businesses</p>
            </div>
            <div className={`bg-white p-6 rounded-xl shadow-xs border border-gray-100 text-center transition-all duration-500 ${trustInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div className="font-heading text-3xl text-primary mb-1">5.0</div>
              <p className="text-gray-600 text-sm">Google rating (42 reviews)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white" ref={methodsRef as React.RefObject<HTMLElement>}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a href="tel:+441584517234" className={`flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-colors group transition-all duration-500 ${methodsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-colors">
                <Phone size={24} />
              </div>
              <div>
                <p className="font-bold text-neutral group-hover:text-white">Call Us</p>
                <p className="text-gray-600 group-hover:text-white/80">01584 517 234</p>
              </div>
            </a>
            <a href="mailto:hello@fresh-tech.uk" className={`flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-colors group transition-all duration-500 ${methodsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-colors">
                <Mail size={24} />
              </div>
              <div>
                <p className="font-bold text-neutral group-hover:text-white">Email Us</p>
                <p className="text-gray-600 group-hover:text-white/80">hello@fresh-tech.uk</p>
              </div>
            </a>
            <div className={`flex items-center gap-4 p-6 bg-gray-50 rounded-xl transition-all duration-500 ${methodsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                <MapPin size={24} />
              </div>
              <div>
                <p className="font-bold text-neutral">Based in</p>
                <p className="text-gray-600">Ludlow, Shropshire</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
              <Clock size={16} />
              <span>Office hours: Monday - Friday, 9am - 5pm</span>
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Form */}
      <Contact />

      {/* Coverage Area */}
      <section className="py-12 bg-gray-50" ref={coverageRef as React.RefObject<HTMLElement>}>
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-heading text-2xl text-neutral mb-6">We Cover The West Midlands & Welsh Borders</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['Ludlow', 'Shrewsbury', 'Hereford', 'Telford', 'Leominster', 'Craven Arms', 'Church Stretton', 'Bridgnorth'].map((town, idx) => (
              <Link
                key={town}
                to={`/locations/${town.toLowerCase().replace(' ', '-')}`}
                className={`bg-white px-4 py-2 rounded-full text-sm font-bold text-gray-600 border border-gray-200 hover:border-primary hover:text-primary transition-all duration-400 ${coverageInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                {town}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Faq
        categories={['General IT Support', 'Onboarding & Transition']}
        title="Support Questions"
        subtitle="What happens after you contact us."
      />
    </div>
  );
};
