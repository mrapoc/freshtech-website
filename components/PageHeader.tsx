
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  highlightText?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, highlightText }) => {
  return (
    <div className="bg-neutral text-white pt-32 pb-16 relative overflow-hidden">
      {/* Comic Dot Pattern Overlay to match About Page */}
      <div className="absolute inset-0 opacity-10 pointer-events-none pattern-dots-blue"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {highlightText && (
          <div className="inline-block bg-highlight text-neutral px-4 py-1 font-bold uppercase tracking-widest mb-6 transform -rotate-2 border border-white shadow-comic">
            {highlightText}
          </div>
        )}
        <h1 className="font-heading text-4xl md:text-6xl mb-6">{title}</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
