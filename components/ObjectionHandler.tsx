import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Calendar, ShieldCheck, MessageCircle } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const objections = [
  {
    concern: "Switching providers is disruptive",
    answer: "Zero downtime. We run both systems in parallel during handover.",
    icon: RefreshCw,
    link: "/onboarding"
  },
  {
    concern: "Trapped in a long contract",
    answer: "12-month terms help us invest in you properly - but we won't hold you prisoner if it's not working.",
    icon: Calendar
  },
  {
    concern: "What if it doesn't work out?",
    answer: "30-day money-back guarantee. If we're not the right fit, you pay nothing.",
    icon: ShieldCheck,
    link: "/pricing"
  },
  {
    concern: "IT people speak jargon",
    answer: "Plain English only. We explain things so they actually make sense.",
    icon: MessageCircle
  }
];

export const ObjectionHandler = () => {
  const [ref, isInView] = useInView(0.15);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-14 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <p className={`text-center text-sm font-medium text-gray-500 mb-8 transition-all duration-500 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Common concerns we hear:</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {objections.map((obj, index) => {
            const content = (
              <div className={`flex items-start gap-3 p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-500 h-full ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 shrink-0">
                  <obj.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">"{obj.concern}"</p>
                  <p className="text-sm font-medium text-neutral">{obj.answer}</p>
                </div>
              </div>
            );

            return obj.link ? (
              <Link key={index} to={obj.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={index}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
