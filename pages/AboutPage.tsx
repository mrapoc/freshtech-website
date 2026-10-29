
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Testimonials } from '../components/Testimonials';
import { CalendlyModal } from '../components/CalendlyModal';
import { Zap, Heart, Shield, Rocket, Linkedin, Users, Award, Clock, BadgeCheck, ArrowRight } from 'lucide-react';
import { teamMembers, timelineEvents } from '../data/content';
import { SEO } from '../components/SEO';
import { BuyersGuideCta } from '../components/BuyersGuideCta';
import { LiveStats } from '../components/LiveStats';
import { CyberEssentialsPromo } from '../components/CyberEssentialsPromo';
import { SmartImage } from '../components/SmartImage';
import { useInView } from '../hooks/useInView';

// Certifications and partnerships
const certifications = [
  { name: "Cyber Essentials Certified", icon: Shield },
  { name: "Microsoft Partner", icon: BadgeCheck },
  { name: "5.0 Google Rating", icon: Award },
  { name: "10+ Years Experience", icon: Clock },
];

// Organization schema for About page - Enhanced for AI search
const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://fresh-tech.uk/#organization",
  "name": "Fresh Tech IT Support",
  "alternateName": "Fresh Tech",
  "legalName": "Fresh Tech Limited",
  "url": "https://fresh-tech.uk",
  "logo": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png",
  "description": "Local IT support company providing managed IT services, cybersecurity, and technology consulting to businesses in Shropshire, Herefordshire, and the West Midlands.",
  "foundingDate": "2014-11",
  "foundingLocation": {
    "@type": "Place",
    "name": "Ludlow, Shropshire"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "28 Livesey Avenue",
    "addressLocality": "Ludlow",
    "addressRegion": "Shropshire",
    "postalCode": "SY8 1HN",
    "addressCountry": "GB"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+441584517234",
    "email": "hello@fresh-tech.uk",
    "contactType": "customer service",
    "availableLanguage": "English",
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  },
  "sameAs": [
    "https://www.facebook.com/freshtechuk",
    "https://www.linkedin.com/company/fresh-tech-uk"
  ],
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "minValue": 2,
    "maxValue": 10
  },
"hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "certification",
      "name": "Cyber Essentials Certified",
      "recognizedBy": {
        "@type": "Organization",
        "name": "National Cyber Security Centre (NCSC)"
      }
    },
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "partnership",
      "name": "Microsoft Partner",
      "recognizedBy": {
        "@type": "Organization",
        "name": "Microsoft"
      }
    }
  ],
"makesOffer": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Remote IT Support",
        "description": "Unlimited remote helpdesk support with proactive monitoring"
      },
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "35",
        "priceCurrency": "GBP",
        "unitText": "per user per month",
        "referenceQuantity": {
          "@type": "QuantitativeValue",
          "value": "1",
          "unitCode": "MON"
        }
      }
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Managed IT Support",
        "description": "Full managed IT including remote and onsite support, monitoring, and maintenance"
      },
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "45",
        "priceCurrency": "GBP",
        "unitText": "per user per month",
        "referenceQuantity": {
          "@type": "QuantitativeValue",
          "value": "1",
          "unitCode": "MON"
        }
      }
    }
  ],
  "areaServed": [
    { "@type": "City", "name": "Ludlow" },
    { "@type": "City", "name": "Shrewsbury" },
    { "@type": "City", "name": "Hereford" },
    { "@type": "City", "name": "Telford" },
    { "@type": "City", "name": "Leominster" },
    { "@type": "AdministrativeArea", "name": "Shropshire" },
    { "@type": "AdministrativeArea", "name": "Herefordshire" },
    { "@type": "AdministrativeArea", "name": "Worcestershire" },
    { "@type": "AdministrativeArea", "name": "Powys" }
  ],
  "knowsAbout": [
    "IT Support",
    "Managed IT Services",
    "Managed Service Provider",
    "Cybersecurity",
    "Microsoft 365",
    "Cloud Solutions",
    "Network Infrastructure",
    "Cyber Essentials Certification",
    "Business Continuity",
    "Disaster Recovery",
    "Remote Working Solutions"
  ],
  "slogan": "Your Local IT Superheroes",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "42",
    "bestRating": "5"
  }
};

// Custom Superhero Reveal Card Component
const TeamMemberCard: React.FC<{ member: typeof teamMembers[0] }> = ({ member }) => {
  return (
    <div className="group relative w-full md:w-96 h-[500px] rounded-2xl overflow-hidden border-4 border-neutral shadow-comic bg-white transition-transform hover:-translate-y-2 duration-300">
      
      {/* Themed Background: Comic Sunburst */}
      <div className="absolute inset-0 bg-primary z-0 overflow-hidden">
         <div className="absolute inset-0 opacity-30 origin-center animate-pulse-slow" 
              style={{
                  background: 'repeating-conic-gradient(from 0deg, #6DC9F0 0deg 15deg, #2B7AB1 15deg 30deg)',
              }}>
         </div>
         {/* Comic Halftone Overlay */}
         <div className="absolute inset-0 z-10 opacity-20" 
              style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
         </div>
      </div>

      {/* IMAGES: Layered for Reveal Effect */}
      
      {/* Layer 1 (Bottom): Unmasked / Reveal Image */}
      {/* Only visible when top layer fades out */}
      <div className="absolute inset-0 flex items-end justify-center z-10">
         <SmartImage 
            src={member.imgUnmasked} 
            alt={`${member.name} Unmasked`}
            width={500}
            className="h-[90%] w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
         />
      </div>

      {/* Layer 2 (Top): Masked / Hero Image */}
      {/* Fades out on hover */}
      <div className="absolute inset-0 flex items-end justify-center z-20 transition-opacity duration-500 group-hover:opacity-0">
         <SmartImage 
            src={member.imgMasked} 
            alt={`${member.name} Hero`}
            width={500}
            className="h-[90%] w-full object-cover object-top"
         />
      </div>

      {/* Card Info Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-neutral via-neutral/95 to-transparent pt-24 pb-6 px-6 z-30 text-white translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex justify-between items-end mb-2">
           <div>
              <h3 className="font-heading text-3xl uppercase tracking-wide text-white drop-shadow-md">{member.name}</h3>
              <p className="text-accent font-bold text-sm uppercase tracking-widest">{member.role}</p>
           </div>
           {/* Power Badge */}
           <div className="bg-highlight text-neutral text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-3 border-2 border-neutral">
              {member.power}
           </div>
        </div>
        
        <div className="max-h-0 group-hover:max-h-96 overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100">
           <p className="text-gray-200 text-sm leading-relaxed mt-3 border-t border-gray-600 pt-3">
              {member.bio}
           </p>
           <div className="flex flex-wrap gap-4 mt-4">
              {member.slug && (
                <Link to={`/team/${member.slug}`} className="inline-flex items-center gap-2 text-highlight hover:text-white font-bold text-xs uppercase tracking-widest">
                   <Users size={16} /> View Full Profile
                </Link>
              )}
              {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent hover:text-white font-bold text-xs uppercase tracking-widest">
                   <Linkedin size={16} /> LinkedIn
                </a>
              )}
           </div>
        </div>
      </div>

      {/* "Reveal Identity" Hint */}
      <div className="absolute top-4 right-4 z-30 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         Secret Identity Revealed!
      </div>
    </div>
  );
};

export const AboutPage = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [missionRef, missionInView] = useInView(0.2);
  const [teamRef, teamInView] = useInView(0.05);
  const [valuesRef, valuesInView] = useInView(0.1);
  const [timelineRef, timelineInView] = useInView(0.1);

  return (
    <div className="bg-white">
      <SEO
        title="About Us"
        description="Meet the team behind Fresh Tech. Friendly, local IT support experts serving businesses across Shropshire and the Welsh Marches since 2014."
        image="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/v1764607317/fresh-tech-it-support-team.png"
        schema={aboutSchema}
      />
      <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
      
      {/* 1. HERO SECTION */}
      <section className="bg-neutral text-white pt-32 pb-16 lg:pb-24 relative overflow-hidden">
        {/* Comic Pattern Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none pattern-dots-blue"></div>
        
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
             <div className="inline-flex items-center gap-2 bg-highlight text-neutral px-4 py-1 font-bold uppercase tracking-widest mb-6 transform -rotate-2 border-2 border-white shadow-comic">
                <Users size={18} /> Est. 2014
             </div>
             <h1 className="font-heading text-5xl md:text-6xl mb-6">Meet The Alliance</h1>
             <p className="text-xl text-gray-300 mb-8 leading-relaxed">
               We aren't just engineers; we're your technology sidekicks. 
               Based in Ludlow, we fight downtime for businesses locally and across the UK.
             </p>
             <div className="flex flex-wrap gap-4">
               <button onClick={() => setIsCalendlyOpen(true)} className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all">
                  Book a Discovery Call
               </button>
               <Link to="/contact" className="bg-white text-neutral border-2 border-neutral px-8 py-4 rounded-lg font-bold shadow-comic-hover hover:shadow-comic hover:translate-y-[-2px] transition-all">
                  Send a Signal
               </Link>
             </div>
          </div>

          {/* Group Photo Comic Frame */}
          <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
             <div className="relative w-full max-w-md transform rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-full h-full bg-primary rounded-lg border-4 border-neutral"></div>
                
                {/* The Photo Frame */}
                <div className="relative bg-white p-3 pb-16 rounded-lg border-4 border-neutral shadow-2xl">
                   <div className="relative overflow-hidden border-2 border-neutral bg-gray-200 aspect-4/3">
                       <SmartImage 
                          src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/v1764607317/fresh-tech-it-support-team.png" 
                          width={800}
                          fallbackSrc="https://picsum.photos/seed/teamgroup/800/600"
                          alt="Fresh Tech Team (Sam & Matt)" 
                          className="w-full h-full object-cover transition-all" 
                        />
                   </div>
                   
                   {/* Caption style */}
                   <div className="absolute bottom-4 left-0 w-full text-center">
                      <p className="font-heading text-2xl text-neutral transform -rotate-1">The Fresh Tech Team</p>
                   </div>
                   
                   <div className="absolute -bottom-6 -right-6 bg-accent text-white text-xs font-bold px-4 py-2 rounded-full border-4 border-neutral shadow-comic transform rotate-12 z-20">
                      Heroes for Hire!
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      <LiveStats />

      {/* CERTIFICATIONS BAR */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {certifications.map((cert, idx) => {
              const Icon = cert.icon;
              return (
                <div key={idx} className="flex items-center gap-2 text-gray-600">
                  <Icon size={20} className="text-primary" />
                  <span className="font-medium text-sm">{cert.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Page CTA */}
      <section className="py-6 bg-primary/5 border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Link to="/why-trust-us" className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-sm">
            <Shield size={16} />
            See our guarantees, live helpdesk stats, and what your first 30 days look like
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 2. MISSION */}
      <section ref={missionRef as React.RefObject<HTMLElement>} className="py-20 bg-white">
        <div className={`container mx-auto px-4 max-w-3xl text-center transition-all duration-700 ${missionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            We exist because traditional IT support is often slow, grumpy, or confusing. We wanted to change that.
            At Fresh Tech, our mission is to give local businesses in Ludlow, Shrewsbury, and Hereford enterprise-grade technology delivered with a smile.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            We believe that when your technology works perfectly, you become a superhero in your own industry. We're just the sidekicks making sure your gadgets never fail.
          </p>
        </div>
      </section>

      {/* RIGHT FIT Section */}
      <section className="py-12 bg-tertiary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl text-neutral mb-4">Who We Work With</h2>
            <p className="text-gray-600 mb-8">
              We've built our business around <strong>5-100 staff companies</strong> in Shropshire, Herefordshire, and the Welsh Borders.
              That's our sweet spot - big enough to need proper IT, small enough to value a personal relationship.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">Solicitors</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">Manufacturers</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">Accountants</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">Healthcare</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">Agriculture</span>
              <span className="bg-white px-4 py-2 rounded-full border border-gray-200">Charities</span>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Not sure if we're right for you? <a href="/it-health-check" className="text-primary font-medium hover:underline">Take our free IT Health Check</a>
            </p>
          </div>
        </div>
      </section>

      {/* 3. TEAM CARDS (Superhero Reveal) */}
      <section ref={teamRef as React.RefObject<HTMLElement>} className="py-20 bg-tertiary/20 border-y-4 border-neutral border-dashed">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${teamInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
             <h2 className="font-heading text-4xl text-neutral mb-4">Behind The Mask</h2>
             <p className="text-gray-600 max-w-2xl mx-auto">
               Hover over our team cards to reveal the real people behind the tech.
             </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-12">
            {teamMembers.map((member, idx) => (
               <TeamMemberCard key={idx} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE VALUES */}
      <section ref={valuesRef as React.RefObject<HTMLElement>} className="py-20 bg-white">
         <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className={`bg-white p-8 rounded-xl shadow-xs border-b-4 border-primary text-center hover:shadow-md transition-all duration-500 group ${valuesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '100ms' }}>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Zap size={32} className="text-primary group-hover:text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Super Speed</h3>
                  <p className="text-gray-600 text-sm">We answer calls in seconds and fix problems in minutes.</p>
               </div>
               <div className={`bg-white p-8 rounded-xl shadow-xs border-b-4 border-accent text-center hover:shadow-md transition-all duration-500 group ${valuesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                    <Heart size={32} className="text-accent group-hover:text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Friendly Support</h3>
                  <p className="text-gray-600 text-sm">No robots, no scripts, just helpful humans who care.</p>
               </div>
               <div className={`bg-white p-8 rounded-xl shadow-xs border-b-4 border-neutral text-center hover:shadow-md transition-all duration-500 group ${valuesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
                  <div className="w-16 h-16 bg-neutral/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-neutral group-hover:text-white transition-colors">
                    <Shield size={32} className="text-neutral group-hover:text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Security First</h3>
                  <p className="text-gray-600 text-sm">We build security into every single thing we do.</p>
               </div>
               <div className={`bg-white p-8 rounded-xl shadow-xs border-b-4 border-highlight text-center hover:shadow-md transition-all duration-500 group ${valuesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
                  <div className="w-16 h-16 bg-highlight/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-highlight group-hover:text-neutral transition-colors">
                    <Rocket size={32} className="text-highlight group-hover:text-neutral" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Always Improving</h3>
                  <p className="text-gray-600 text-sm">Technology changes fast. We stay ahead of the curve for you.</p>
               </div>
            </div>
         </div>
      </section>

      {/* 5. TIMELINE */}
      <section ref={timelineRef as React.RefObject<HTMLElement>} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
           <div className={`transition-all duration-700 ${timelineInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="font-heading text-4xl text-neutral mb-6">The Origin Story</h2>
              <p className="text-gray-600 mb-4">
                 Fresh Tech began in 2014 when Sam realized that most small businesses were being ignored by big IT firms. They were stuck with slow computers, dangerous security gaps, and unresponsive support.
              </p>
              <p className="text-gray-600 mb-8">
                 Starting from a small office in Ludlow with just a laptop and a coffee machine, we have grown into the region's most trusted partner. In 2020, amidst the global pandemic, we pivoted fully to managed services to ensure our clients could survive and thrive remotely.
              </p>
              <div className="pl-6 border-l-4 border-tertiary space-y-8">
                 {timelineEvents.map((event, i) => (
                    <div key={i}>
                        <span className="text-accent font-bold text-sm bg-accent/10 px-2 py-1 rounded-sm">{event.year}</span>
                        <p className="font-bold text-neutral mt-1">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
           <div className="relative">
               <SmartImage 
                  src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/v1764608940/sam-james-providing-onsite-it-support-ludlow.jpg" 
                  width={800}
                  className="rounded-2xl shadow-2xl border-4 border-neutral object-cover" 
                  alt="Fresh Tech Founder Sam James providing onsite IT support to a local business client in Ludlow" 
               />
               <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border-l-4 border-accent max-w-xs">
                  <p className="italic text-gray-600 text-sm">"We built Fresh Tech to be the IT company we would want to hire."</p>
                  <p className="font-bold text-sm mt-2">- Sam, Founder</p>
               </div>
           </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF */}
      <Testimonials />

      {/* 7. Cyber Essentials Promo - Added */}
      <CyberEssentialsPromo />

      {/* 8. CTA BAND */}
      <BuyersGuideCta />
    </div>
  );
};
