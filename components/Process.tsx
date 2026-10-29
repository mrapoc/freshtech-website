import React, { useEffect, useRef, useState, memo } from 'react';
import { processSteps } from '../data/content';

export const Process = memo(function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Cache geometry to avoid forced reflows during scroll
  const metrics = useRef({ top: 0, height: 0, windowHeight: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Measure dimensions on mount and resize - Optimized to prevent Forced Reflow
  useEffect(() => {
    const measure = () => {
      // Wrap in rAF to ensure we measure at the start of a frame, avoiding layout thrashing
      window.requestAnimationFrame(() => {
        if (sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect();
          // Calculate absolute position relative to document
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          
          metrics.current = {
            top: rect.top + scrollTop,
            height: rect.height,
            windowHeight: window.innerHeight
          };
        }
      });
    };

    // Initial measure
    measure();
    
    window.addEventListener('resize', measure);
    // Recalculate on load to ensure images/layout are settled
    window.addEventListener('load', measure);
    
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, []);

  // Optimized Scroll Listener
  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const { top, height, windowHeight } = metrics.current;
      
      // If metrics haven't been set yet (e.g. before mount), skip
      if (height === 0) {
        ticking = false;
        return;
      }

      const scrollTop = window.scrollY;
      
      // Calculate position relative to viewport using cached absolute top
      // rect.top would be (absoluteTop - scrollTop)
      const rectTop = top - scrollTop;
      
      // Calculate progress
      const startOffset = windowHeight * 0.8;
      const endOffset = windowHeight * 0.2;
      
      const totalDistance = height + startOffset - endOffset;
      const scrolledDistance = startOffset - rectTop;
      
      let progress = scrolledDistance / totalDistance;
      
      // Clamp between 0 and 1
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      
      setScrollProgress(progress);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger once
    updateProgress();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-secondary/10 border-y-4 border-neutral border-dashed overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="font-heading text-4xl md:text-5xl text-neutral mb-4">How We Save The Day</h2>
          <p className="text-lg text-gray-700">Our simple 5-step process to stress-free IT.</p>
        </div>

        <div className="relative">
          {/* Desktop Horizontal Track (Gray Background) */}
          <div className="hidden lg:block absolute top-12 left-0 h-2 bg-gray-200 border-y-2 border-gray-300 z-0 w-full transition-opacity duration-1000 delay-1000" style={{ opacity: isVisible ? 1 : 0 }}></div>
          
          {/* Animated Progress Line (Desktop) */}
          <div 
            className="hidden lg:block absolute top-12 left-0 h-2 bg-accent border-y-2 border-neutral z-0 transition-opacity duration-500 ease-out"
            style={{ 
                width: `${scrollProgress * 100}%`,
                opacity: isVisible ? 1 : 0,
                transitionDelay: '1200ms'
            }}
          ></div>

          {/* Mobile Vertical Track */}
          <div className="lg:hidden absolute left-6 top-8 bottom-0 w-1 bg-gray-200 transition-opacity duration-1000 delay-1000" style={{ opacity: isVisible ? 1 : 0 }}></div>

          {/* Animated Progress Line (Mobile) */}
          <div 
             className="lg:hidden absolute left-6 top-8 w-1 bg-accent z-0 transition-opacity duration-500"
             style={{ 
                 height: `${scrollProgress * 100}%`, 
                 opacity: isVisible ? 1 : 0,
                 transitionDelay: '1200ms'
             }}
          ></div>

          {/* Steps Container */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
            {processSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex flex-col lg:items-center lg:text-center relative pl-8 lg:pl-0 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-50'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="w-12 h-12 lg:w-24 lg:h-24 bg-highlight rounded-full border-4 border-neutral flex items-center justify-center font-heading text-xl lg:text-3xl shadow-comic mb-4 lg:mb-6 relative z-10 group hover:scale-110 transition-transform shrink-0">
                  {index + 1}
                </div>
                
                <div className="lg:px-2">
                    <h3 className="font-heading text-xl lg:text-2xl mb-2 text-primary">{step.title.split('. ')[1]}</h3>
                    <p className="text-sm lg:text-base text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});