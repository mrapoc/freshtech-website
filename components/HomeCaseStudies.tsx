import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { caseStudies } from '../data/content';
import { SmartImage } from './SmartImage';
import { ChevronDown } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const INITIAL_COUNT = 6;

export const HomeCaseStudies = () => {
  const [showAll, setShowAll] = useState(false);
  const [ref, isInView] = useInView(0.05);
  const visibleStudies = showAll ? caseStudies : caseStudies.slice(0, INITIAL_COUNT);
  const hasMore = caseStudies.length > INITIAL_COUNT;

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
            <div className={`text-center mb-12 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="font-heading text-3xl md:text-4xl mb-4 text-neutral">Success Stories</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">See how we've helped other local businesses become superheroes.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-10">
              {visibleStudies.map((study, index) => (
                <div key={study.id} className={`bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 group hover:border-primary transition-all duration-500 flex flex-col h-full ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${150 + (index % 3) * 100}ms` }}>
                  <div className="h-48 overflow-hidden relative">
                    <SmartImage
                      src={study.image}
                      alt={study.client}
                      width={600}
                      height={400} // Explicit height for 3:2 ratio
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      // Correct sizes: Mobile = 100vw, Tablet = 50vw, Desktop = 33vw (since grid-cols-3)
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 px-2 py-1 text-xs font-bold rounded-sm uppercase tracking-wider text-neutral shadow-xs">
                        {study.industry}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col grow">
                    <h3 className="font-heading text-xl mb-2 leading-tight">{study.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 grow">{study.outcome}</p>
                    <Link to={`/case-studies/${study.slug}`} className="text-primary-dark font-bold text-sm hover:underline decoration-2 mt-auto inline-flex items-center">
                        Read Case Study →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
              {hasMore && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-2 bg-white text-neutral border-2 border-gray-300 px-6 py-3 rounded-lg font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  Show More
                  <ChevronDown size={20} />
                </button>
              )}
              <Link to="/case-studies" className="inline-block bg-white text-primary-dark border-2 border-primary px-6 py-3 rounded-lg font-bold hover:bg-primary hover:text-white transition-colors">
                See More Success Stories →
              </Link>
            </div>
        </div>
    </section>
  );
};
