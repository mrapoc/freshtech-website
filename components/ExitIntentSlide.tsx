import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Stethoscope } from 'lucide-react';

const STORAGE_KEY = 'ft_exit_shown';
const MIN_TIME_ON_SITE = 30000; // 30 seconds before showing

export const ExitIntentSlide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Don't run on mobile (exit intent doesn't work well)
    if (window.innerWidth < 1024) return;

    // Don't show if already shown this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Don't show if they've already done the health check
    if (localStorage.getItem('ft_health_check_completed')) return;

    // Don't show on health check page itself
    if (window.location.pathname.includes('health-check')) return;

    const startTime = Date.now();

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves toward the top (likely closing tab/navigating away)
      if (e.clientY > 50) return;

      // Only trigger after minimum time on site
      if (Date.now() - startTime < MIN_TIME_ON_SITE) return;

      // Only trigger once
      if (hasTriggered) return;

      setHasTriggered(true);
      setIsVisible(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-slide-in-right"
      role="dialog"
      aria-label="IT Health Check prompt"
    >
      <div className="bg-white rounded-xl shadow-2xl border-2 border-neutral max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope size={20} />
            <span className="font-heading text-lg">Before you go...</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading text-xl text-neutral mb-2">
            How healthy is your IT?
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Take our free 3-minute check and discover security gaps, backup risks, and quick wins for your business.
          </p>

          {/* Incentive */}
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            <p className="text-green-700 text-xs font-medium">
              ✓ Get a personalised report + free 15-min consultation call
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/it-health-check"
              onClick={handleDismiss}
              className="flex-1 bg-accent text-neutral font-bold py-2.5 px-4 rounded-lg text-center hover:bg-accent/90 transition-colors border-2 border-neutral shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Start Health Check
            </Link>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              aria-label="Dismiss and continue browsing"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
