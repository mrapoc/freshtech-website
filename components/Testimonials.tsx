import React, { useState, useEffect, useMemo, memo } from 'react';
import { Star, Quote, Clock, Shield, TrendingUp, Zap } from 'lucide-react';
import { testimonials, testimonialCategories } from '../data/content';
import { LogoCarousel } from './LogoCarousel';
import { useInView } from '../hooks/useInView';

// Note: Review/aggregateRating schema is handled by the SEO component on pages that use Testimonials
// This prevents duplicate schema injection which causes Google Search Console errors

// Category icons
const categoryIcons: Record<string, React.ElementType> = {
  all: Star,
  speed: Clock,
  reliability: Shield,
  proactive: Zap,
  value: TrendingUp
};

export const Testimonials = memo(function Testimonials() {
  const [ref, isInView] = useInView(0.1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter testimonials by category
  const filteredTestimonials = useMemo(() => {
    if (activeCategory === 'all') return testimonials;
    return testimonials.filter(t => t.category === activeCategory);
  }, [activeCategory]);

  // Reset index when category changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || filteredTestimonials.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredTestimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused, filteredTestimonials.length]);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-neutral text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-8 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-3xl md:text-4xl text-highlight mb-4">Trusted By Local Heroes</h2>
          <p className="text-gray-400 mb-6">Don't just take our word for it.</p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {Object.entries(testimonialCategories).map(([key, label]) => {
              const Icon = categoryIcons[key];
              const count = key === 'all' ? testimonials.length : testimonials.filter(t => t.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === key
                      ? 'bg-accent text-neutral'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === key ? 'bg-neutral/20' : 'bg-gray-600'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`max-w-4xl mx-auto relative mb-20 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: '200ms' }}>
           {/* Slider Container */}
           <div
             className="bg-gray-800 rounded-2xl p-8 md:p-12 border border-gray-700 relative shadow-2xl flex flex-col items-center text-center pt-16 transition-all duration-500"
             onMouseEnter={() => setIsPaused(true)}
             onMouseLeave={() => setIsPaused(false)}
           >
              {/* Static Icon */}
              <div className="absolute -top-6 bg-accent p-4 rounded-full border-4 border-neutral shadow-lg z-10">
                  <Quote size={32} className="text-white" />
              </div>
              
              {/* Static Stars */}
              <div className="mb-6 text-yellow-400 flex gap-1 relative z-0">
                  {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
              </div>

              {/* Dynamic Content - Grid Stack for stable height */}
              {/* All testimonials render in the same grid cell. The container takes the height of the tallest one. */}
              <div
                className="grid grid-cols-1 w-full relative"
                role="region"
                aria-label="Customer testimonials"
                aria-live="polite"
                aria-atomic="true"
              >
                  {filteredTestimonials.map((t, idx) => (
                      <div
                        key={`${activeCategory}-${idx}`}
                        className={`col-start-1 row-start-1 flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
                            idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                        aria-hidden={idx !== activeIndex}
                      >
                          <p className="text-xl md:text-2xl font-medium italic mb-8 leading-relaxed text-gray-200">
                              "{t.quote}"
                          </p>

                          <div>
                              <p className="font-heading text-lg text-white">{t.name}</p>
                              <p className="text-blue-200 text-sm font-bold uppercase tracking-wider">{t.company}</p>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Dots */}
              <div className="flex gap-2 mt-8 justify-center relative z-20">
                  {filteredTestimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className="p-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-full"
                        aria-label={`Go to testimonial ${idx + 1}`}
                      >
                        <div className={`h-3 rounded-full transition-all ${idx === activeIndex ? 'bg-accent w-6' : 'bg-gray-600 w-3 hover:bg-gray-400'}`} />
                      </button>
                  ))}
              </div>
           </div>
        </div>

        {/* Logos */}
        <div className={`border-t border-gray-700 pt-12 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
            <p className="text-center text-gray-400 text-sm uppercase tracking-widest mb-8">Powering Businesses Like</p>
            <LogoCarousel />
        </div>
      </div>
    </section>
  );
});