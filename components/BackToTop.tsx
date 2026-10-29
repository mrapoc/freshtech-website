import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 md:bottom-8 right-4 z-40 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark hover:shadow-xl transition-all duration-300 focus:outline-hidden focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 animate-fade-in"
      aria-label="Back to top"
    >
      <ArrowUp size={24} />
    </button>
  );
};
