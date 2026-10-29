import React from 'react';
import { Users, Clock, Shield, Star } from 'lucide-react';
import { useInView } from '../hooks/useInView';

export const SocialProofBanner = () => {
  const [ref, isInView] = useInView(0.3);
  const proofPoints = [
    { icon: Users, text: "Trusted by 50+ local businesses", highlight: "50+" },
    { icon: Clock, text: "Average client stays 5+ years", highlight: "5+" },
    { icon: Shield, text: "10+ years protecting SMBs", highlight: "10+" },
    { icon: Star, text: "5.0 Google rating", highlight: "5.0" }
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="bg-gray-50 border-y border-gray-100 py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {proofPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-2.5 text-sm md:text-base text-gray-600 transition-all duration-500 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <Icon size={16} className="text-primary" aria-hidden="true" />
                </div>
                <span>
                  <span className="font-bold text-neutral">{point.highlight}</span>
                  {' '}{point.text.replace(point.highlight, '').trim()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
