import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

interface PageViewsProps {
  className?: string;
  pageName?: string;
}

/**
 * Page Views Counter Component
 * Shows "X people viewed this today" for social proof
 * Uses localStorage to simulate view counts (resets daily)
 * In production, this would connect to analytics
 */
export const PageViews: React.FC<PageViewsProps> = ({ className = '', pageName }) => {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const pageKey = pageName || window.location.pathname;
    const storageKey = `page-views-${pageKey}`;
    const today = new Date().toDateString();

    // Get stored data
    const stored = localStorage.getItem(storageKey);
    let data = stored ? JSON.parse(stored) : null;

    // Reset if it's a new day
    if (!data || data.date !== today) {
      // Generate a realistic base number (higher for popular pages)
      const isHomePage = pageKey === '/' || pageKey === '';
      const isPricingPage = pageKey.includes('pricing');
      const isContactPage = pageKey.includes('contact');

      let baseViews = 5 + Math.floor(Math.random() * 15); // 5-20 for regular pages
      if (isHomePage) baseViews = 25 + Math.floor(Math.random() * 50); // 25-75 for home
      if (isPricingPage) baseViews = 15 + Math.floor(Math.random() * 30); // 15-45 for pricing
      if (isContactPage) baseViews = 10 + Math.floor(Math.random() * 20); // 10-30 for contact

      data = { date: today, count: baseViews };
    }

    // Increment view count (with some randomness to feel natural)
    if (Math.random() > 0.3) { // 70% chance to increment
      data.count += 1;
    }

    // Save and display
    localStorage.setItem(storageKey, JSON.stringify(data));
    setViews(data.count);
  }, [pageName]);

  if (views === null) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-gray-500 ${className}`}>
      <Eye size={12} className="text-gray-400" />
      <span>{views} {views === 1 ? 'person' : 'people'} viewed this today</span>
    </span>
  );
};
