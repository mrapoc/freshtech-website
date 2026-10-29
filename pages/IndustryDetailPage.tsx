import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { industries, blogPosts, caseStudies } from '../data/content';
import { industryGuides } from '../data/industryGuides';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, ArrowRight, BookOpen, Clock, AlertTriangle, ShieldCheck, Zap, MessageSquare, FileCode, Wind, Scale, Mail, Activity, Wifi, Truck, Moon, Signal, Lock, CloudRain, CreditCard, WifiOff, Map, Image, Users } from 'lucide-react';
import { CalendlyModal } from '../components/CalendlyModal';
import { SmartImage } from '../components/SmartImage';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const IndustryDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const industry = industries.find(i => i.slug === slug);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  if (!industry) {
    return <Navigate to="/404" />;
  }

  // Filter related content (relatedBlogs for future use)
  const _relatedBlogs = blogPosts.filter(post => post.tags?.includes(industry.name));
  const relatedCaseStudies = caseStudies.filter(study => study.industry === industry.name);

  // Check if there's an industry guide for this sector
  const hasGuide = industryGuides[slug || ''] !== undefined;

  // Icon Mapping
  const iconMap: Record<string, React.ElementType> = {
      FileCode, Wind, AlertTriangle, Scale, Clock, Mail, Activity, Wifi, Truck, Moon, Signal, Lock, CloudRain, CreditCard, WifiOff, Map, Image, Users
  };

  return (
    <div className="bg-white">
      <SEO title={`IT Support for ${industry.name}`} description={industry.desc} faqs={(industry as any).faqs} />
      <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />

      {/* 1. Hero */}
      <div className="relative pt-32 pb-24 bg-neutral text-white overflow-hidden">
         <SmartImage
            src={industry.heroImage}
            alt={industry.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            fetchPriority="high"
            fallbackText=""
         />
         <div className="absolute inset-0 bg-linear-to-r from-neutral via-neutral/90 to-transparent"></div>
         <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
                <Breadcrumbs
                  items={[
                    { label: 'Industries', href: '/industries' },
                    { label: industry.name }
                  ]}
                  variant="light"
                  className="mb-6"
                />
                <h1 className="font-heading text-4xl md:text-6xl mb-6 leading-tight">
                    {industry.name} IT <br/><span className="text-primary">Without The Headache.</span>
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                    <RichText text={industry.desc} boldColorClass="text-white" />
                </p>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => setIsCalendlyOpen(true)} className="bg-accent text-white px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all">
                        Book a {industry.name} Discovery Call
                    </button>
                    <Link to="/contact" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-neutral transition-colors">
                        Ask a Question
                    </Link>
                </div>
            </div>
            {/* Lingo Card */}
            {industry.lingo && (
                <div className="md:w-1/3 w-full">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl relative shadow-2xl">
                        <div className="absolute -top-4 -right-4 bg-highlight text-neutral p-3 rounded-full shadow-lg">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="font-heading text-xl mb-4 text-highlight">{industry.lingo.title}</h3>
                        <p className="text-gray-200 italic leading-relaxed">
                            "{industry.lingo.text}"
                        </p>
                    </div>
                </div>
            )}
         </div>
      </div>

      {/* Prominent Guide Banner */}
      {hasGuide && (
        <div className="bg-linear-to-r from-primary to-accent py-4">
          <div className="container mx-auto px-4">
            <Link to={`/guides/${slug}`} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-white group">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Free Interactive Guide</p>
                  <p className="font-heading text-lg">{industry.name} IT Checklist</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                Open Guide <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* 2. The Reality Check (Challenges) */}
      <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">The Reality of {industry.name} IT</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">We know the specific frustrations you deal with daily. Does this sound familiar?</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                  {industry.challenges?.map((challenge: any, idx: number) => {
                      const Icon = iconMap[challenge.icon] || AlertTriangle;
                      return (
                          <div key={idx} className="bg-white p-8 rounded-2xl shadow-xs border border-gray-200 hover:border-red-300 transition-colors group">
                              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                  <Icon size={24} />
                              </div>
                              <h3 className="font-bold text-xl text-neutral mb-3">{challenge.title}</h3>
                              <p className="text-gray-600 leading-relaxed text-sm"><RichText text={challenge.desc} /></p>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* 3. The Fix (Solutions) */}
      <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div>
                      <h2 className="font-heading text-4xl text-primary mb-6">How We Fix It</h2>
                      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                          We don't just patch problems; we build systems designed for your specific workflow.
                      </p>
                      
                      <div className="space-y-8">
                          {industry.solutions?.map((sol: any, idx: number) => (
                              <div key={idx} className="flex gap-4">
                                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                                      <CheckCircle size={24} />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-xl text-neutral mb-2">{sol.title}</h3>
                                      <p className="text-gray-600 leading-relaxed"><RichText text={sol.desc} /></p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  {/* Compliance / Trust Box */}
                  <div className="bg-neutral text-white p-10 rounded-3xl border-l-8 border-accent relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 opacity-10">
                          <ShieldCheck size={160} />
                      </div>
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="bg-accent p-2 rounded-lg">
                                <ShieldCheck size={32} />
                             </div>
                             <h3 className="font-heading text-2xl">Compliance Ready</h3>
                          </div>
                          
                          <div className="mb-8">
                             <h4 className="font-bold text-xl text-highlight mb-2">{industry.compliance?.title}</h4>
                             <p className="text-gray-300 leading-relaxed">
                                 <RichText text={industry.compliance?.desc} boldColorClass="text-white" />
                             </p>
                          </div>
                          
                          <div className="bg-white/10 rounded-xl p-6 border border-white/10">
                              <p className="text-sm italic text-gray-300 mb-4">
                                 "<RichText text={industry.content} boldColorClass="text-white" />"
                              </p>
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                                 <Zap size={14} /> Expert Knowledge
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 4. Resources / Case Studies */}
      <div className="py-20 bg-tertiary/10 border-y-4 border-neutral border-dashed">
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                  <div>
                      <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">Proven In The Field</h2>
                      <p className="text-gray-600">See how we've helped other {industry.name} businesses succeed.</p>
                  </div>
                  {hasGuide && (
                      <Link to={`/guides/${slug}`} className="bg-white px-6 py-3 rounded-lg border-2 border-primary shadow-xs flex items-center gap-4 hover:shadow-md hover:border-accent transition-all group">
                          <div className="bg-primary/10 p-2 rounded-sm group-hover:bg-accent/20 transition-colors">
                              <BookOpen size={20} className="text-primary group-hover:text-accent transition-colors" />
                          </div>
                          <div className="text-left">
                              <p className="text-xs font-bold text-gray-500 uppercase">Free Interactive Guide</p>
                              <p className="font-bold text-neutral text-sm flex items-center gap-2">
                                  {industry.name} IT Checklist <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </p>
                          </div>
                      </Link>
                  )}
              </div>

              {relatedCaseStudies.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {relatedCaseStudies.map(study => (
                          <div key={study.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-shadow flex flex-col">
                              <div className="h-48 relative overflow-hidden">
                                  <SmartImage 
                                    src={study.image} 
                                    alt={study.client} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy" 
                                  />
                                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider text-neutral">
                                      {study.result}
                                  </div>
                              </div>
                              <div className="p-6 flex flex-col grow">
                                  <h3 className="font-heading text-xl mb-2">{study.title}</h3>
                                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">{study.challenge}</p>
                                  <Link to={`/case-studies/${study.slug}`} className="mt-auto text-primary font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                                      Read Case Study <ArrowRight size={16} />
                                  </Link>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="bg-white p-8 rounded-xl text-center border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">Case studies for this sector are being updated. Ask us for references!</p>
                  </div>
              )}
          </div>
      </div>

      <Contact />
    </div>
  );
};