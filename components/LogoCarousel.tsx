import React, { useState } from 'react';
import { partnerLogos } from '../data/content';
import { optimizeCloudinaryUrl } from './SmartImage';

// Logo item with error handling - optimized for small display size
const LogoItem = ({ logo, index: _index }: { logo: { src: string; alt: string }; index: number }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Don't render anything if image fails to load
    return null;
  }

  // Optimize for actual display size (130px) with 2x for retina = 260px max
  // Use 'eco' quality for small logos - good balance of quality and size
  const optimizedSrc = optimizeCloudinaryUrl(logo.src, 130, 'eco');
  const optimizedSrc2x = optimizeCloudinaryUrl(logo.src, 260, 'eco');

  return (
    <div className="mx-8 w-32 h-10 flex items-center justify-center shrink-0 transition-opacity duration-300 opacity-60 hover:opacity-100">
      <img
        src={optimizedSrc}
        srcSet={`${optimizedSrc} 1x, ${optimizedSrc2x} 2x`}
        alt={logo.alt}
        width="130"
        height="40"
        loading="lazy"
        decoding="async"
        className="max-h-8 max-w-full object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export const LogoCarousel = () => {
  return (
    <div className="w-full overflow-hidden bg-white py-10 border-t border-gray-100">
      <div className="relative w-full flex">
        {/* Track 1 - Primary */}
        <div className="flex animate-marquee whitespace-nowrap will-change-transform" style={{ transform: 'translate3d(0,0,0)' }}>
          {partnerLogos.map((logo, index) => (
            <LogoItem key={`logo-1-${index}`} logo={logo} index={index} />
          ))}
        </div>
        {/* Track 2 - Duplicate for seamless loop */}
        <div className="flex absolute top-0 animate-marquee2 whitespace-nowrap will-change-transform" style={{ transform: 'translate3d(0,0,0)' }}>
          {partnerLogos.map((logo, index) => (
            <LogoItem key={`logo-2-${index}`} logo={logo} index={index} />
          ))}
        </div>
      </div>

      {/* Marquee animation styles */}
      <style>{`
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee2 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
};
