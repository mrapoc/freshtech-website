import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { industries } from '../data/content';
import { hasGuide } from '../data/industryGuidesIndex';
import { useInView } from '../hooks/useInView';

export const Industries = () => {
  const [ref, isInView] = useInView(0.05);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="industries" className="py-20 bg-neutral text-white">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col md:flex-row justify-between items-end mb-12 gap-6 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <h2 className="font-heading text-4xl md:text-5xl text-highlight mb-4">Who We Help</h2>
            <p className="text-gray-300 text-lg max-w-xl">We specialize in supporting these sectors across Shropshire and the UK.</p>
          </div>
          <Link to="/industries" className="text-white border-b-2 border-accent hover:text-accent transition-colors pb-1 flex items-center gap-2">
             View all industries <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind, index) => (
            <div key={index} className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-secondary transition-all duration-500 group flex flex-col ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${150 + (index % 3) * 100}ms` }}>
              <h3 className="font-heading text-2xl mb-2 text-white">{ind.name}</h3>
              <p className="text-gray-400 text-sm mb-6 grow line-clamp-3">{ind.desc}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-center">
                <Link to={`/industries/${ind.slug}`} className="text-white font-bold text-sm hover:text-accent transition-colors">
                    View Details
                </Link>
                {hasGuide(ind.slug) ? (
                  <Link
                    to={`/guides/${ind.slug}`}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white uppercase tracking-widest bg-primary-dark hover:bg-primary px-2.5 py-1.5 rounded-sm transition-colors"
                  >
                    <BookOpen size={12} />
                    Free Guide
                  </Link>
                ) : (
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-gray-700 px-2 py-1 rounded-sm">
                    Guide Coming Soon
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* "Other" Card */}
          <div className={`bg-primary-dark rounded-xl p-6 border border-primary flex flex-col justify-center items-center text-center shadow-[0_0_20px_rgba(49,134,192,0.4)] transition-all duration-500 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${150 + (industries.length % 3) * 100}ms` }}>
            <h3 className="font-heading text-2xl mb-2 text-white">Don't see your sector?</h3>
            <p className="text-white text-sm mb-4 font-medium">We support accountants, non-profits, logistics firms and more.</p>
            <Link to="/contact" className="bg-white text-primary-dark px-4 py-2 rounded-sm font-bold text-sm hover:bg-highlight hover:text-neutral transition-colors">
              Tell us about your mission
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};