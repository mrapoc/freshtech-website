import React, { useEffect, useState } from 'react';

/**
 * Scroll Progress Bar
 * Shows a thin progress bar at the top of the page indicating scroll position
 * Only visible on pages with enough content to scroll
 */
export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Only show if page is scrollable (more than 200px of scrollable content)
      if (docHeight > 200) {
        setIsVisible(true);
        const scrollProgress = (scrollTop / docHeight) * 100;
        setProgress(Math.min(scrollProgress, 100));
      } else {
        setIsVisible(false);
      }
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });

    // Initial check
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-1 z-100 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div
        className="h-full bg-linear-to-r from-primary via-accent to-highlight transition-all duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
