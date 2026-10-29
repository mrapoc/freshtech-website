import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force instant scroll to top on route change.
    // Using window.scrollTo is often more reliable than documentElement for strict resetting.
    // 'instant' behavior overrides the global 'scroll-behavior: smooth' CSS 
    // which prevents the page from landing halfway down on navigation.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}