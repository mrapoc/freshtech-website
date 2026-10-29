import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { locationsData } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, MapPin, ArrowRight, Zap, Wifi, Leaf, Shield, Coffee, ChevronDown, ChevronUp, Briefcase, Clock, Truck, Star, Cloud } from 'lucide-react';
import { Services } from '../components/Services';
import { Testimonials } from '../components/Testimonials';
import { PricingCalculator } from '../components/PricingCalculator';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { trackLocationView } from '../utils/analytics';

export const LocationPage = () => {
  const { city } = useParams<{ city: string }>();
  const data = locationsData[city?.toLowerCase() || ''];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Track location page view for analytics
  useEffect(() => {
    if (data) {
      trackLocationView(data.city);
    }
  }, [data]);

  if (!data) {
    return <Navigate to="/404" />;
  }

  // Generate Google Map Embed URL
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(data.city + ", UK")}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  // Icon mapping
  const iconMap: Record<string, React.ElementType> = {
      Zap, Wifi, Leaf, Shield, MapPin, Coffee, Briefcase, Clock, Truck, Star, Cloud
  };

  const toggleFaq = (index: number) => {
      setOpenFaq(openFaq === index ? null : index);
  };

  // Location-specific coordinates for schema
  const locationCoords: Record<string, { lat: number; lng: number }> = {
    // Towns - Shropshire
    ludlow: { lat: 52.368, lng: -2.717 },
    shrewsbury: { lat: 52.708, lng: -2.754 },
    telford: { lat: 52.678, lng: -2.449 },
    bridgnorth: { lat: 52.535, lng: -2.419 },
    "craven-arms": { lat: 52.441, lng: -2.838 },
    "church-stretton": { lat: 52.538, lng: -2.802 },
    oswestry: { lat: 52.860, lng: -3.054 },
    whitchurch: { lat: 52.968, lng: -2.682 },
    "market-drayton": { lat: 52.904, lng: -2.484 },
    // Towns - Herefordshire
    hereford: { lat: 52.056, lng: -2.716 },
    leominster: { lat: 52.228, lng: -2.739 },
    "ross-on-wye": { lat: 51.914, lng: -2.587 },
    ledbury: { lat: 52.036, lng: -2.424 },
    bromyard: { lat: 52.186, lng: -2.510 },
    kington: { lat: 52.233, lng: -3.028 },
    // Towns - Worcestershire
    worcester: { lat: 52.193, lng: -2.221 },
    malvern: { lat: 52.112, lng: -2.325 },
    kidderminster: { lat: 52.388, lng: -2.249 },
    redditch: { lat: 52.307, lng: -1.946 },
    bromsgrove: { lat: 52.336, lng: -2.058 },
    droitwich: { lat: 52.268, lng: -2.154 },
    // Towns - Powys
    welshpool: { lat: 52.659, lng: -3.145 },
    newtown: { lat: 52.512, lng: -3.313 },
    brecon: { lat: 51.945, lng: -3.398 },
    "builth-wells": { lat: 52.150, lng: -3.403 },
    "llandrindod-wells": { lat: 52.242, lng: -3.381 },
    machynlleth: { lat: 52.593, lng: -3.853 },
    knighton: { lat: 52.347, lng: -3.043 },
    montgomery: { lat: 52.561, lng: -3.150 },
    // Towns - Additional Shropshire
    "much-wenlock": { lat: 52.596, lng: -2.556 },
    // Towns - Additional Herefordshire
    "hay-on-wye": { lat: 52.075, lng: -3.124 },
    weobley: { lat: 52.151, lng: -2.870 },
    pembridge: { lat: 52.183, lng: -2.899 },
    // Towns - Additional Worcestershire
    "tenbury-wells": { lat: 52.311, lng: -2.597 },
    "upton-upon-severn": { lat: 52.060, lng: -2.213 },
    pershore: { lat: 52.112, lng: -2.078 },
    evesham: { lat: 52.092, lng: -1.949 },
    // Counties
    shropshire: { lat: 52.676, lng: -2.738 },
    herefordshire: { lat: 52.076, lng: -2.788 },
    worcestershire: { lat: 52.192, lng: -2.221 },
    powys: { lat: 52.254, lng: -3.410 }
  };

  const coords = locationCoords[city?.toLowerCase() || ''] || locationCoords.ludlow;
  const isCounty = data.isCounty === true;

  // Determine region for schema
  const getAddressRegion = () => {
    if (isCounty) return data.city;
    const herefordshireTowns = ["hereford", "leominster", "ross-on-wye", "ledbury", "bromyard", "kington", "hay-on-wye", "weobley", "pembridge"];
    const worcestershireTowns = ["worcester", "malvern", "kidderminster", "redditch", "bromsgrove", "droitwich", "tenbury-wells", "upton-upon-severn", "pershore", "evesham"];
    const powysTowns = ["welshpool", "newtown", "brecon", "builth-wells", "llandrindod-wells", "machynlleth", "knighton", "montgomery"];
    if (herefordshireTowns.includes(city?.toLowerCase() || '')) return "Herefordshire";
    if (worcestershireTowns.includes(city?.toLowerCase() || '')) return "Worcestershire";
    if (powysTowns.includes(city?.toLowerCase() || '')) return "Powys";
    return "Shropshire";
  };

  // LocalBusiness schema for this location
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Fresh Tech IT Support - ${data.city}`,
    "description": data.metaDesc,
    "image": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png",
    "url": `https://fresh-tech.uk/locations/${city?.toLowerCase()}`,
    "telephone": "+441584517234",
    "email": "hello@fresh-tech.uk",
    "priceRange": "££",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": isCounty ? "Ludlow" : data.city,
      "addressRegion": getAddressRegion(),
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": coords.lat,
      "longitude": coords.lng
    },
    "areaServed": isCounty ? {
      "@type": "AdministrativeArea",
      "name": data.city
    } : {
      "@type": "City",
      "name": data.city
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "17:00"
      }
    ]
  };

  return (
    <div className="bg-white">
      <SEO
        title={data.heroTitle}
        description={data.metaDesc}
        schema={locationSchema}
        breadcrumbs={[
          { name: "Locations", item: "/about" },
          { name: `${data.city} IT Support`, item: `/locations/${city?.toLowerCase()}` }
        ]}
      />
      
      {/* Hero Section */}
      <div className="bg-neutral text-white pt-32 pb-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-primary/20 z-0"></div>
         {/* Comic Halftone Overlay */}
         <div className="absolute inset-0 opacity-10 pointer-events-none pattern-dots-blue"></div>
         
         <div className="container mx-auto px-4 relative z-10 text-center">
            <Breadcrumbs
              items={[
                { label: 'About', href: '/about' },
                { label: `${data.city} IT Support` }
              ]}
              variant="light"
              className="mb-6 justify-center [&_ol]:justify-center"
            />
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1 rounded-full text-sm font-bold mb-6 backdrop-blur-xs">
                <MapPin size={16} className="text-accent" />
                Serving {data.city} & Surrounding Areas
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl mb-6">{data.heroTitle}</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">{data.heroDesc}</p>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
               <Link to="/contact" className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all">
                  Get a {data.city} Quote
               </Link>
               <a href="tel:01584517234" className="bg-white text-neutral px-8 py-4 rounded-lg font-bold border-2 border-transparent hover:border-white transition-colors">
                  Call 01584 517 234
               </a>
            </div>
         </div>
      </div>

      {/* Intro & Map Split */}
      <section className="py-20 bg-white">
         <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
             <div>
                 <h2 className="font-heading text-3xl md:text-4xl text-primary mb-6">{data.introTitle || `Why ${data.city} Businesses Choose Us`}</h2>
                 <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    <RichText text={data.introText || data.content} />
                 </p>
                 
                 {!data.introText && (
                     <ul className="space-y-4 mb-8">
                         <li className="flex items-center gap-3">
                             <CheckCircle className="text-green-500 shrink-0" />
                             <span className="font-bold text-neutral">Local Engineers (No outsourcing)</span>
                         </li>
                         <li className="flex items-center gap-3">
                             <CheckCircle className="text-green-500 shrink-0" />
                             <span className="font-bold text-neutral">Under 15-minute response time</span>
                         </li>
                         <li className="flex items-center gap-3">
                             <CheckCircle className="text-green-500 shrink-0" />
                             <span className="font-bold text-neutral">Cyber Essentials Plus Partners</span>
                         </li>
                     </ul>
                 )}
                 
                 {data.introText && (
                     <p className="text-gray-600 text-lg leading-relaxed mb-8"><RichText text={data.content} /></p>
                 )}

                 <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 mb-8">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Shield size={20} /> Local Cyber Security
                    </h3>
                    <p className="text-sm text-blue-800">
                        We help {data.city} businesses achieve <strong>Cyber Essentials Plus</strong> certification, protecting your reputation and data.
                    </p>
                 </div>
             </div>
             
             {/* Map Embed */}
             <div className="relative h-full min-h-[280px] md:min-h-[400px]">
                 <div className="bg-gray-200 rounded-2xl w-full h-full absolute inset-0 flex items-center justify-center border-4 border-neutral shadow-comic overflow-hidden group">
                     {/* Grayscale Filter applied to map for professional look */}
                     <iframe 
                        title={`Map of ${data.city}`}
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={mapSrc}
                        className="w-full h-full grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                        style={{ filter: 'grayscale(100%)' }}
                     ></iframe>
                     
                     {/* Overlay Badge */}
                     <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-bold shadow-md pointer-events-none z-10 text-neutral">
                        Active in {data.city}
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* Local Features Grid - Only if defined */}
      {data.features && (
          <section className="py-20 bg-gray-50 border-y-4 border-neutral border-dashed">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                      <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">Tailored for {data.city}</h2>
                      <p className="text-gray-600">Specific solutions for local businesses.</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {data.features.map((feature: any, idx: number) => {
                          const Icon = iconMap[feature.icon] || CheckCircle;
                          return (
                              <div key={idx} className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:border-primary transition-colors group">
                                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                      <Icon size={28} />
                                  </div>
                                  <h3 className="font-bold text-xl text-neutral mb-2">{feature.title}</h3>
                                  <p className="text-gray-600 text-sm leading-relaxed"><RichText text={feature.desc} /></p>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </section>
      )}

      {/* Towns We Cover - County Pages Only */}
      {isCounty && data.towns && (
          <section className="py-20 bg-white">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                      <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">Towns & Areas We Cover in {data.city}</h2>
                      <p className="text-gray-600 max-w-2xl mx-auto">From market towns to rural villages, we provide responsive IT support across the county.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {data.towns.map((town: string, idx: number) => {
                          const townSlug = town.toLowerCase().replace(/\s+/g, '-').replace(/-on-/g, '-on-');
                          const hasPage = locationsData[townSlug] !== undefined;
                          return hasPage ? (
                              <Link
                                  key={idx}
                                  to={`/locations/${townSlug}`}
                                  className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors group"
                              >
                                  <MapPin size={16} className="text-primary shrink-0" />
                                  <span className="font-bold text-neutral group-hover:text-primary transition-colors">{town}</span>
                                  <ArrowRight size={14} className="text-gray-400 ml-auto group-hover:text-primary transition-colors" />
                              </Link>
                          ) : (
                              <div
                                  key={idx}
                                  className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-100"
                              >
                                  <MapPin size={16} className="text-gray-400 shrink-0" />
                                  <span className="font-bold text-neutral">{town}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </section>
      )}

      {/* Popular Services for This Location */}
      {data.services && (
          <section className="py-20 bg-primary">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                      <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">Popular Services in {data.city}</h2>
                      <p className="text-gray-300">What {data.city} businesses are asking for most</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {data.services.map((service: any, idx: number) => (
                          <Link
                              key={idx}
                              to={service.link}
                              className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-all group"
                          >
                              <h3 className="font-bold text-xl text-white mb-2 group-hover:text-accent transition-colors">{service.title}</h3>
                              <p className="text-gray-300 text-sm mb-4">{service.desc}</p>
                              <span className="text-accent font-bold text-sm flex items-center gap-1">
                                  See how it works <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </span>
                          </Link>
                      ))}
                  </div>
                  <div className="text-center mt-10">
                      <Link
                          to="/services"
                          className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-lg font-bold hover:bg-accent/90 transition-colors"
                      >
                          View All Services <ArrowRight size={18} />
                      </Link>
                  </div>
              </div>
          </section>
      )}

      {/* General Services Fallback - Only show if no specific services defined */}
      {!data.services && (
          <div className="bg-white">
            <Services />
          </div>
      )}

      {/* Trust Signals */}
      <Testimonials />

      {/* Local FAQ Section */}
      {data.faqs && (
          <section className="py-20 bg-gray-50">
              <div className="container mx-auto px-4 max-w-3xl">
                  <div className="text-center mb-12">
                      <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">Questions from {data.city} Locals</h2>
                      <p className="text-gray-600">Answers to common queries about our local support.</p>
                  </div>
                  <div className="space-y-4">
                      {data.faqs.map((faq: any, idx: number) => (
                          <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                              <button 
                                  onClick={() => toggleFaq(idx)}
                                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                              >
                                  <span className="font-bold text-lg text-neutral pr-4">{faq.q}</span>
                                  {openFaq === idx ? <ChevronUp className="text-accent shrink-0" /> : <ChevronDown className="text-gray-400 shrink-0" />}
                              </button>
                              {openFaq === idx && (
                                  <div className="p-6 pt-0 text-gray-600 border-t border-gray-100 mt-4">
                                      <RichText text={faq.a} />
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </section>
      )}

      {/* Calculator / CTA Split */}
      <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-16">
                  <div>
                      <h2 className="font-heading text-3xl md:text-4xl text-primary mb-6">Ready to upgrade your IT?</h2>
                      <p className="text-gray-600 text-lg mb-8">
                          Stop struggling with slow computers and unreliable support. Get a local team that cares about your business success.
                      </p>
                      <div className="bg-neutral text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                          <div className="relative z-10">
                              <h3 className="font-bold text-xl mb-4">Book a Free Onsite Audit</h3>
                              <p className="text-gray-300 mb-6 text-sm">
                                  We'll visit your {data.city} office, check your security, and give you a jargon-free report. No obligation.
                              </p>
                              <Link to="/contact" className="block w-full bg-white text-neutral text-center py-3 rounded-lg font-bold hover:bg-highlight transition-colors">
                                  Schedule Audit
                              </Link>
                          </div>
                      </div>
                  </div>
                  <div>
                      <PricingCalculator />
                  </div>
              </div>
          </div>
      </section>

      <Contact />
    </div>
  );
};