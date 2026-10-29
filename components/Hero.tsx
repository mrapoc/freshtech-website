import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import { CalendarCheck, Calculator, Star, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { partnerLogos } from '../data/content';
import { SmartImage, optimizeCloudinaryUrl } from './SmartImage';
import { trackCalendlyOpen, trackCtaClick } from '../utils/analytics';

// Lazy load modal - only needed when user clicks booking button
const CalendlyModal = lazy(() => import('./CalendlyModal').then(m => ({ default: m.CalendlyModal })));

// Get time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Working late?";
};

export const Hero = memo(function Hero() {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());

  // Update greeting every minute to handle time boundary crossings
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Logo rotation state - use transition instead of key changes
  const [randomLogos, setRandomLogos] = useState<{src: string, alt: string}[]>([]);
  const [logoSetIndex, setLogoSetIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize random logos AFTER initial paint to avoid blocking LCP
  useEffect(() => {
    const shuffleLogos = () => {
      const shuffled = [...partnerLogos].sort(() => 0.5 - Math.random());
      setRandomLogos(shuffled);
    };

    // Defer shuffle to avoid blocking main thread during initial render
    if (window.requestIdleCallback) {
      window.requestIdleCallback(shuffleLogos, { timeout: 2000 });
    } else {
      // Fallback for Safari
      setTimeout(shuffleLogos, 100);
    }
  }, []);

  // Rotate logos every 5 seconds with fade transition
  useEffect(() => {
    if (randomLogos.length === 0) return;

    const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setLogoSetIndex(prev => prev + 1);
          setIsTransitioning(false);
        }, 300); // Match fade-out duration
    }, 8000);

    return () => clearInterval(interval);
  }, [randomLogos]);

  // Get current 4 logos
  const getVisibleLogos = () => {
      if (randomLogos.length === 0) return [];
      const logos = [];
      for (let i = 0; i < 4; i++) {
          const index = (logoSetIndex * 4 + i) % randomLogos.length;
          logos.push({ ...randomLogos[index], stableKey: i });
      }
      return logos;
  };

  const visibleLogos = getVisibleLogos();

  // Updated Headshot with specific image and Comic Background
  const Headshot = () => (
    <button
      type="button"
      className="relative cursor-pointer group shrink-0 focus:outline-hidden focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
      onClick={() => { trackCalendlyOpen(); setIsCalendlyOpen(true); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trackCalendlyOpen(); setIsCalendlyOpen(true); } }}
      aria-label="Book a chat with Sam James, Director"
    >
      <div className="absolute -top-5 right-0 bg-white text-neutral font-bold text-xs px-2 py-1 transform rotate-6 border-2 border-neutral z-20 group-hover:scale-110 transition-transform whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        Chat with Sam!
      </div>
      {/* Comic Halftone Background Circle - Significantly Increased Size */}
      <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-neutral shadow-xs relative bg-primary shrink-0 transition-all duration-300">
        <SmartImage
          src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/sam-headshot.png"
          alt="Sam James, Director"
          width={224}
          height={224}
          className="w-full h-full object-cover relative z-10 hover:scale-110 transition-transform duration-500"
          fallbackSrc="https://ui-avatars.com/api/?name=Sam+James&background=2B7AB1&color=fff&size=200"
          // Headshot is small, so we use explicit pixel sizes to prevent fetching large versions
          sizes="(max-width: 768px) 160px, 224px"
        />
      </div>
    </button>
  );

  // Replaced Video with Comic Style Placeholder
  const HeroComicImage = () => (
    <div className="aspect-video bg-neutral border-4 border-neutral overflow-hidden relative group">
        <SmartImage 
          // Removed manual f_auto,q_auto params as SmartImage injects them. 
          // This ensures the URL matches the preload tag in index.html EXACTLY.
          src="https://fresh-tech.uk/images/fresh-tech-social-20261016.png"
          alt="Fresh Tech, IT support for local businesses across Shropshire, Herefordshire and the Welsh Borders"
          width={800}
          height={450} // Explicit height for 16:9 aspect ratio to prevent CLS
          fetchPriority="high" // Prioritize loading for LCP
          loading="eager"
          quality="25" // '25' forces a fixed quality lower than q_auto:low for maximum mobile speed
          // Added object-top to prevent heads being cut off
          className="w-full h-full object-cover object-top opacity-90 hover:scale-105 transition-transform duration-700"
          fallbackText="Fresh Tech"
          // Exact sizing calculation:
          // Mobile: 100vw - 32px (container pad) - 12px (card border) - 8px (image border) = 52px
          // Desktop: Approx 45vw
          sizes="(max-width: 1024px) calc(100vw - 52px), 45vw"
        />
        
        {/* Comic Caption Overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-neutral to-transparent p-4 pt-12">
             <div className="bg-white text-neutral text-xs font-bold inline-block px-2 py-1 border-2 border-neutral transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                MISSION STATUS:
             </div>
             <p className="font-heading text-xl text-white mt-1 italic tracking-wide">WE SAVE YOUR TECH.</p>
        </div>
    </div>
  );

  return (
    <>
      {/* Only load modal component when needed */}
      {isCalendlyOpen && (
        <Suspense fallback={null}>
          <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
        </Suspense>
      )}
      
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-36 overflow-hidden bg-tertiary/20">
          {/* Comic Dots Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none pattern-dots-blue"></div>
          
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left Content */}
            <div>
              <p className="text-sm text-gray-500 mb-2 font-medium">{greeting} - let's talk IT.</p>
              <div className="inline-block bg-highlight px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 border border-neutral shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Business IT Support
              </div>
              <h1 className="font-heading text-4xl md:text-6xl leading-tight mb-6 text-neutral">
                Business IT That <span className="text-primary-dark">Just Works.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-4 max-w-lg leading-relaxed">
                Friendly, expert technology support for businesses in Ludlow, Shrewsbury, Hereford and across the UK.
                We stop the computer headaches so you can focus on growing your business.
              </p>
              <p className="text-sm text-primary-dark font-medium mb-6">
                Serving Shropshire, Herefordshire & the Welsh Borders
              </p>

              {/* Trust Bar - compact on mobile, lead with response time */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
                  <Clock size={14} className="text-green-600 shrink-0" />
                  <span className="font-medium text-green-700">&lt;15m response</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200">
                  <Star size={14} className="text-yellow-500 shrink-0" fill="currentColor" />
                  <span className="font-medium text-gray-700">5.0 rated (42 reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200">
                  <ShieldCheck size={14} className="text-green-600 shrink-0" />
                  <span className="font-medium text-gray-700">30-day guarantee</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/pricing"
                  onClick={() => trackCtaClick('get_instant_quote', 'hero')}
                  className="flex flex-col items-center justify-center bg-accent text-neutral px-10 py-5 rounded-lg font-bold shadow-comic border-2 border-neutral hover:translate-y-[2px] hover:shadow-comic-hover transition-all w-full sm:w-auto"
                >
                  <span className="flex items-center gap-2 text-xl">
                    <Calculator size={22} />
                    Get Instant Quote
                  </span>
                  <span className="text-xs font-semibold text-neutral/90">From £40/user • 30-day money-back guarantee</span>
                </Link>
                <button
                  onClick={() => { trackCalendlyOpen(); setIsCalendlyOpen(true); }}
                  className="flex items-center justify-center gap-2 bg-white text-neutral px-8 py-4 rounded-lg font-bold border-2 border-neutral shadow-comic-hover hover:shadow-comic hover:translate-y-[-2px] transition-all w-full sm:w-auto"
                >
                  <CalendarCheck size={18} />
                  Book a Discovery Call
                </button>
              </div>

              {/* Industry Selector */}
              <div className="mt-8 p-4 bg-white/60 rounded-xl border border-gray-200 backdrop-blur-xs">
                <p className="text-xs text-gray-500 font-medium mb-3">We specialise in your industry:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Legal', slug: 'solicitors' },
                    { name: 'Manufacturing', slug: 'manufacturing' },
                    { name: 'Healthcare', slug: 'healthcare' },
                    { name: 'Accountants', slug: 'accountants' },
                    { name: 'Agriculture', slug: 'agriculture' },
                  ].map((ind) => (
                    <Link
                      key={ind.slug}
                      to={`/industries/${ind.slug}`}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-primary hover:text-primary transition-colors"
                    >
                      {ind.name}
                    </Link>
                  ))}
                  <Link
                    to="/industries"
                    className="text-xs px-3 py-1.5 text-primary font-medium hover:underline"
                  >
                    Find your industry →
                  </Link>
                </div>
              </div>
              
              {/* Rotating Client Logos Snippet - Widened */}
              <div className="mt-10 w-full sm:max-w-md inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-sm font-semibold text-neutral bg-white/70 px-4 py-3 rounded-2xl border border-white/50 backdrop-blur-md shadow-xs transition-all hover:shadow-md hover:bg-white cursor-default">
                  <div className="flex items-center gap-2 border-b sm:border-b-0 sm:border-r border-gray-300 pb-2 sm:pb-0 sm:pr-4">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">Trusted By</span>
                  </div>
                  
                  {/* Grid of logos with fade transition - optimized for 100px display */}
                  <div className={`grid grid-cols-4 gap-4 items-center h-8 w-full transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                      {visibleLogos.map((logo) => {
                          const optimizedSrc = optimizeCloudinaryUrl(logo.src, 100, 'eco');
                          const optimizedSrc2x = optimizeCloudinaryUrl(logo.src, 200, 'eco');
                          return (
                            <div key={logo.stableKey} className="flex items-center justify-center w-full h-full">
                                <img
                                    src={optimizedSrc}
                                    srcSet={`${optimizedSrc} 1x, ${optimizedSrc2x} 2x`}
                                    alt={logo.alt}
                                    width={100}
                                    height={40}
                                    loading="lazy"
                                    decoding="async"
                                    className="max-h-8 max-w-full object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                                    title={logo.alt}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                          );
                      })}
                      {visibleLogos.length === 0 && <span className="text-xs text-gray-400 col-span-4 text-center">Loading...</span>}
                  </div>
              </div>
            </div>
            
            {/* Right Card - Comic Style Transformation */}
            <div className="relative perspective-1000">
              
              {/* Main Card - Removed padding (p-4) to make image fill card */}
              <div className="bg-white rounded-lg border-[6px] border-neutral shadow-[12px_12px_0px_0px_rgba(46,46,46,1)] transform rotate-1 hover:rotate-0 transition-transform duration-500 relative overflow-hidden">
                
                {/* Internal Halftone Texture */}
                <div className="absolute inset-0 opacity-10 pointer-events-none z-10 pattern-dots-dark-sm"></div>

                {/* Floating Badge - "Sticker" Look - Left side */}
                <div className="absolute top-6 left-6 bg-highlight text-neutral font-bold px-3 py-2 border-4 border-neutral shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 flex flex-col items-center transform -rotate-6 hover:scale-110 transition-transform">
                   <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="black" stroke="none" />)}
                   </div>
                   <div className="text-[10px] font-heading uppercase tracking-widest">Google Rated</div>
                </div>

                <HeroComicImage />
                
                {/* Narrator Box Style Caption - Added margin/padding to separate from image edge visually at bottom */}
                <div className="bg-yellow-50 border-t-4 border-neutral p-4 relative shadow-xs z-20">
                      {/* Label Tab */}
                      <div className="absolute -top-3 left-4 bg-primary-dark text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-2 border-neutral">
                        Director's Log
                      </div>

                      <div className="flex items-center justify-between gap-4">
                          <div className="grow">
                              {/* Changed to H2 for SEO hierarchy - was skipping level */}
                              <h2 className="font-heading text-2xl text-primary-dark leading-tight mb-2">
                                We Take Your IT Personally.
                              </h2>
                              <p className="text-sm text-gray-800 font-medium leading-relaxed font-sans">
                                "We handle the tech headaches so you don't have to. Real experts, fast solutions, no scripts."
                              </p>
                          </div>
                          <Headshot />
                      </div>
                </div>

              </div>
              
              {/* Decorative "Speed Lines" behind the card */}
              <div className="absolute -bottom-10 -left-10 w-24 h-24 border-t-4 border-l-4 border-accent opacity-30 -z-10"></div>
              <div className="absolute -top-10 -right-10 w-24 h-24 border-b-4 border-r-4 border-primary opacity-30 -z-10"></div>
            </div>
          </div>
        </section>
    </>
  );
});