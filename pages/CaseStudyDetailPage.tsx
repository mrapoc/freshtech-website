import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { caseStudies, industries } from '../data/content';
import { industryGuides } from '../data/industryGuides';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, ArrowRight, Quote, BookOpen, AlertTriangle, Zap, Trophy, Server, Shield, CalendarCheck } from 'lucide-react';
import { CalendlyModal } from '../components/CalendlyModal';
import { SmartImage } from '../components/SmartImage';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const CaseStudyDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const study = caseStudies.find(s => s.slug === slug);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  if (!study) {
    return <Navigate to="/404" />;
  }

  // Find related industry data and guide
  const relatedIndustry = industries.find(ind => ind.name === study.industry);
  const industrySlug = relatedIndustry?.slug || '';
  const hasGuide = industryGuides[industrySlug] !== undefined;
  const guide = hasGuide ? industryGuides[industrySlug] : null;

  // Article schema for case study - proper structured data for Google
  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": study.title,
    "description": `How Fresh Tech helped ${study.client} achieve ${study.result}.`,
    "image": study.image,
    "datePublished": "2025-01-15T00:00:00+00:00",
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
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://fresh-tech.uk/case-studies/${slug}`
    },
    "about": {
      "@type": "Thing",
      "name": study.industry
    },
    "inLanguage": "en-GB"
  };

  // Breadcrumbs for schema
  const breadcrumbsSchema = [
    { name: 'Home', item: '/' },
    { name: 'Case Studies', item: '/case-studies' },
    { name: study.title, item: `/case-studies/${slug}` }
  ];

  return (
    <div className="bg-gray-50">
      <SEO
        title={`${study.title} | Case Study`}
        description={`How Fresh Tech helped ${study.client} achieve ${study.result}.`}
        type="article"
        schema={caseStudySchema}
        breadcrumbs={breadcrumbsSchema}
        image={study.image}
      />
      <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
      
      {/* Header - Cleaner, Full Width */}
      <div className="bg-neutral text-white pt-32 pb-24 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
            <SmartImage 
              src={study.image} 
              alt={study.client} 
              className="w-full h-full object-cover object-center opacity-50" 
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-linear-to-b from-neutral/70 to-neutral"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
           <Breadcrumbs
             items={[
               { label: 'Case Studies', href: '/case-studies' },
               { label: study.title }
             ]}
             variant="light"
             className="mb-8"
           />

           <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="bg-accent text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xs">
                    {study.industry}
                </div>
                <div className="bg-gray-700 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                    <CalendarCheck size={12} /> Verified Success
                </div>
           </div>
           
           <h1 className="font-heading text-4xl md:text-6xl mb-6 leading-tight max-w-4xl">{study.title}</h1>
           <p className="text-xl text-gray-300 font-medium">Client: <span className="text-white">{study.client}</span></p>
        </div>
      </div>

      {/* Stats Dashboard - Overlapping Header */}
      <div className="container mx-auto px-4 relative z-20 -mt-12">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 grid md:grid-cols-3 gap-8">
               <div className="text-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
                   <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">The Villain</div>
                   <div className="text-red-500 font-heading text-lg flex items-center justify-center gap-2">
                       <AlertTriangle size={20} /> Risk
                   </div>
                   <p className="text-sm text-gray-600 mt-2 px-4">{study.shortStats?.risk || "Operational Downtime"}</p>
               </div>
               <div className="text-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
                   <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">The Fix</div>
                   <div className="text-primary font-heading text-lg flex items-center justify-center gap-2">
                       <Zap size={20} /> Strategy
                   </div>
                   <p className="text-sm text-gray-600 mt-2 px-4">{study.shortStats?.strategy || "Managed Infrastructure Overhaul"}</p>
               </div>
               <div className="text-center">
                   <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">The Victory</div>
                   <div className="text-green-600 font-heading text-xl flex items-center justify-center gap-2">
                       <Trophy size={24} /> {study.result}
                   </div>
                   <p className="text-sm text-gray-600 mt-2 px-4">{study.shortStats?.victory || "Complete digital transformation success."}</p>
               </div>
          </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-12 gap-12">
           
           {/* Main Story (Left 8 cols) */}
           <div className="lg:col-span-8 space-y-16">
              
              {/* Section 1: The Challenge */}
              <div className="flex gap-6">
                  <div className="hidden md:flex flex-col items-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                          <AlertTriangle size={24} />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                  </div>
                  <div>
                      <h2 className="font-heading text-3xl text-neutral mb-4">The Challenge</h2>
                      <p className="text-lg text-gray-600 leading-relaxed">
                          {study.challenge}
                      </p>
                  </div>
              </div>

              {/* Section 2: The Solution */}
              <div className="flex gap-6">
                  <div className="hidden md:flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                          <Shield size={24} />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                  </div>
                  <div>
                      <h2 className="font-heading text-3xl text-neutral mb-4">The Fresh Tech Solution</h2>
                      <p className="text-lg text-gray-600 leading-relaxed">
                          {study.solution}
                      </p>
                      
                      {/* Tech Stack Visual */}
                      {study.techStack && (
                          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
                              <h4 className="font-bold text-neutral mb-4 flex items-center gap-2">
                                  <Server size={18} className="text-accent" /> Mission Tech Stack
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                  {study.techStack.map((tech, i) => (
                                      <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                                          {tech}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Section 3: The Outcome */}
              <div className="flex gap-6">
                  <div className="hidden md:flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                          <CheckCircle size={24} />
                      </div>
                  </div>
                  <div>
                      <h2 className="font-heading text-3xl text-neutral mb-4">The Outcome</h2>
                      <p className="text-lg text-gray-600 leading-relaxed">
                          {study.outcome}
                      </p>
                  </div>
              </div>

              {/* Testimonial Quote */}
              {study.testimonial && (
                 <div className="bg-neutral text-white p-10 rounded-3xl relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 opacity-10">
                        <Quote size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-accent text-4xl font-heading mb-4">"</div>
                        <p className="text-xl md:text-2xl font-light italic leading-relaxed mb-6">
                           {study.testimonial}
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                                {study.contactName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-white">{study.contactName}</p>
                                <p className="text-gray-400 text-sm">{study.client}</p>
                            </div>
                        </div>
                    </div>
                 </div>
              )}
           </div>

           {/* Sidebar (Right 4 cols) */}
           <div className="lg:col-span-4 space-y-8">
              
              {/* CTA Box */}
              <div className="bg-white p-8 rounded-2xl border-t-4 border-accent shadow-lg">
                 <h3 className="font-heading text-2xl mb-4 text-neutral">Facing similar villains?</h3>
                 <p className="text-gray-600 mb-6 text-sm">
                     We can deploy the same strategies for your business. Book a free 15-minute discovery call with Sam.
                 </p>
                 <button onClick={() => setIsCalendlyOpen(true)} className="w-full bg-accent text-white py-4 rounded-lg font-bold shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all border-2 border-neutral mb-4">
                     Book Discovery Call
                 </button>
                 <Link to="/contact" className="block w-full text-center text-gray-500 hover:text-primary text-sm font-bold underline">
                     Or send us a message
                 </Link>
              </div>

              {/* Related Industry Guide */}
              {hasGuide && guide && (
                 <Link to={`/guides/${industrySlug}`} className="block bg-linear-to-br from-primary/10 to-accent/10 p-8 rounded-2xl border-2 border-primary/20 text-center hover:border-primary hover:shadow-lg transition-all group">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-primary shadow-xs group-hover:bg-primary group-hover:text-white transition-colors">
                        <BookOpen size={24} />
                    </div>
                    <h4 className="font-bold text-neutral mb-2">Free {study.industry} IT Guide</h4>
                    <p className="text-sm text-gray-600 mb-4">{guide.subtitle}</p>
                    <span className="font-bold text-sm flex items-center justify-center gap-1 text-primary group-hover:text-accent">
                        Open Interactive Guide <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                 </Link>
              )}
           </div>
        </div>
      </div>

      <Contact />
    </div>
  );
};