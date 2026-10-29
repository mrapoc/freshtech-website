import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { problemPages } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, Shield, Zap, ChevronDown, ChevronUp, RefreshCw, Cloud, Database, Lock, Mail, Globe, Key, Monitor, Eye, Cpu, Package, Bug, Wifi, Activity, Network, Search, TrendingUp, TrendingDown, UserMinus, Clock, FileCheck, ListChecks, Scale, Handshake, AlertTriangle, Truck, Maximize, ClipboardCheck, ArrowRight, Phone, XCircle, PiggyBank, ShieldOff, FolderSync, Radio, MapPin, BookOpen, MessageSquare, Target, GitBranch, HardDrive, HelpCircle, CreditCard, Calendar, Server, Headphones, Wrench, FileText, Users } from 'lucide-react';
import { Testimonials } from '../components/Testimonials';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { trackServiceView } from '../utils/analytics';
import { useInView } from '../hooks/useInView';

export const ProblemPage = () => {
  const location = useLocation();
  // Extract problem slug from pathname (e.g., "/slow-computers" -> "slow-computers")
  const problem = location.pathname.replace(/^\//, '');
  const data = problemPages[problem];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [symptomsRef, symptomsInView] = useInView(0.1);
  const [causesRef, causesInView] = useInView(0.05);
  const [solutionsRef, solutionsInView] = useInView(0.05);

  // Track page view
  useEffect(() => {
    if (data) {
      trackServiceView(`problem_${data.slug}`);
    }
  }, [data]);

  if (!data) {
    return <Navigate to="/404" />;
  }

  // Icon mapping
  const iconMap: Record<string, React.ElementType> = {
    CheckCircle, Shield, Zap, RefreshCw, Cloud, Database, Lock, Mail, Globe, Key,
    Monitor, Eye, Cpu, Package, Bug, Wifi, Activity, Network, Search, TrendingUp,
    TrendingDown, UserMinus, Clock, FileCheck, ListChecks, Scale, Handshake,
    AlertTriangle, Truck, Maximize, ClipboardCheck, PiggyBank, ShieldOff, FolderSync,
    Radio, MapPin, BookOpen, MessageSquare, Target, GitBranch, HardDrive, HelpCircle,
    CreditCard, Calendar, Server, Headphones, Wrench, FileText, Users, Phone, ArrowRight
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Schema for problem page
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
        "text": faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      }
    }))
  };

  // Check if this is an emergency page (ransomware)
  const isEmergency = data.slug === 'ransomware-recovery';

  return (
    <>
      <SEO
        title={data.title}
        description={data.metaDesc}
        canonical={`https://fresh-tech.uk/${data.slug}`}
        schema={[articleSchema, faqSchema]}
      />

      {/* Hero Section */}
      <section className={`${isEmergency ? 'bg-linear-to-br from-red-700 via-red-600 to-red-800' : 'bg-linear-to-br from-primary via-primary to-secondary'} text-white pt-32 pb-20`}>
        <div className="container max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Resources', href: '/resources' },
              { label: data.h1 }
            ]}
            variant="light"
          />
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{data.h1}</h1>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">{data.intro}</p>

          {isEmergency ? (
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:01584517234"
                className="bg-white hover:bg-gray-100 text-red-700 font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Now: 01584 517 234
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              <Link
                to="/contact"
                className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
              >
                {data.cta}
              </Link>
              <a
                href="tel:01584517234"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
              >
                Call 01584 517 234
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Symptoms Section */}
      <section className="py-16 bg-white" ref={symptomsRef as React.RefObject<HTMLElement>}>
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className={`font-heading text-3xl text-center mb-4 text-neutral transition-all duration-700 ${symptomsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Does This Sound Familiar?</h2>
          <p className={`text-center text-gray-600 mb-8 transition-all duration-700 ${symptomsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>Common signs you're experiencing this issue</p>
          <div className={`bg-red-50 border border-red-100 rounded-2xl p-8 transition-all duration-700 ${symptomsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: '200ms' }}>
            <ul className="space-y-4">
              {data.symptoms.map((symptom, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-800">{symptom}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Causes Section */}
      <section className="py-16 bg-gray-50" ref={causesRef as React.RefObject<HTMLElement>}>
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="font-heading text-3xl text-center mb-4 text-neutral">What's Causing This?</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Understanding the root causes helps find the right solution</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.causes.map((cause, index) => {
              const IconComponent = iconMap[cause.icon] || CheckCircle;
              return (
                <div key={index} className={`bg-white rounded-xl p-6 shadow-xs transition-all duration-500 ${causesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{cause.title}</h3>
                  <p className="text-gray-600 text-sm">{cause.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 bg-white" ref={solutionsRef as React.RefObject<HTMLElement>}>
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="font-heading text-3xl text-center mb-4 text-neutral">How We Can Help</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Practical solutions to resolve your issues</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.solutions.map((solution, index) => {
              const IconComponent = iconMap[solution.icon] || CheckCircle;
              return (
                <div key={index} className={`bg-green-50 border border-green-100 rounded-xl p-6 transition-all duration-500 ${solutionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{solution.title}</h3>
                  <p className="text-gray-600 text-sm">{solution.desc}</p>
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
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="font-heading text-3xl text-center mb-4 text-neutral">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 mb-12">Common questions about this issue</p>

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

      {/* CTA Section */}
      <section className={`py-16 ${isEmergency ? 'bg-red-700' : 'bg-primary'}`}>
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Fix This?</h2>
          <p className="text-xl text-gray-200 mb-8">Let's get your IT working properly</p>
          <div className="flex flex-wrap justify-center gap-4">
            {isEmergency ? (
              <a
                href="tel:01584517234"
                className="bg-white hover:bg-gray-100 text-red-700 font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Now: 01584 517 234
              </a>
            ) : (
              <>
                <Link
                  to="/contact"
                  className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
                >
                  {data.cta}
                </Link>
                <Link
                  to="/pricing"
                  className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all flex items-center gap-2"
                >
                  View Pricing <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
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
