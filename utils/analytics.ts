/**
 * Analytics Utility for Fresh Tech Website
 *
 * This file provides helper functions for tracking events in Google Analytics 4 (GA4).
 *
 * SETUP INSTRUCTIONS:
 * 1. Get your GA4 Measurement ID from https://analytics.google.com
 *    - Go to Admin > Data Streams > Web > Your stream
 *    - Copy the Measurement ID (starts with G-)
 * 2. Replace G-XXXXXXXXXX in index.html with your Measurement ID
 * 3. Set up conversion events in GA4:
 *    - Go to Admin > Events
 *    - Mark these events as conversions: contact_form_submit, phone_click, pricing_view
 *
 * CLARITY SETUP:
 * 1. Create a project at https://clarity.microsoft.com
 * 2. Go to Settings > Overview and copy the Project ID
 * 3. Replace CLARITY_PROJECT_ID in index.html with your Project ID
 */

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Track a GA4 event
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

/**
 * Track contact form submission - HIGH VALUE CONVERSION
 * Set this as a conversion in GA4 Admin > Events
 */
export const trackContactFormSubmit = (formSource?: string) => {
  trackEvent('contact_form_submit', {
    event_category: 'conversion',
    event_label: formSource || 'contact_page',
    value: 1
  });
};

/**
 * Track phone number clicks - HIGH VALUE CONVERSION
 * Set this as a conversion in GA4 Admin > Events
 */
export const trackPhoneClick = (phoneNumber: string, location?: string) => {
  trackEvent('phone_click', {
    event_category: 'conversion',
    event_label: location || 'unknown',
    phone_number: phoneNumber,
    value: 1
  });
};

/**
 * Track pricing page views - INTENT SIGNAL
 * Set this as a conversion in GA4 Admin > Events
 */
export const trackPricingView = () => {
  trackEvent('pricing_view', {
    event_category: 'engagement',
    event_label: 'pricing_calculator'
  });
};

/**
 * Track quote request from pricing calculator - HIGH VALUE CONVERSION
 */
export const trackQuoteRequest = (plan: string, estimatedPrice: number, userCount: number) => {
  trackEvent('quote_request', {
    event_category: 'conversion',
    event_label: plan,
    value: estimatedPrice,
    user_count: userCount
  });
};

/**
 * Track Calendly booking initiated
 */
export const trackCalendlyOpen = () => {
  trackEvent('calendly_open', {
    event_category: 'engagement',
    event_label: 'video_call_booking'
  });
};

/**
 * Track resource downloads (buyers guide, etc)
 */
export const trackResourceDownload = (resourceName: string) => {
  trackEvent('resource_download', {
    event_category: 'engagement',
    event_label: resourceName
  });
};

/**
 * Track service page views
 */
export const trackServiceView = (serviceName: string) => {
  trackEvent('service_view', {
    event_category: 'engagement',
    event_label: serviceName
  });
};

/**
 * Track location page views (for local SEO tracking)
 */
export const trackLocationView = (locationName: string) => {
  trackEvent('location_view', {
    event_category: 'engagement',
    event_label: locationName
  });
};

/**
 * Track technology explainer page views
 */
export const trackTechExplainerView = (topicName: string) => {
  trackEvent('tech_explainer_view', {
    event_category: 'engagement',
    event_label: topicName
  });
};

/**
 * Track CTA button clicks
 */
export const trackCtaClick = (ctaName: string, location: string) => {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: ctaName,
    cta_location: location
  });
};

/**
 * AI Search Referral Detection
 * Tracks traffic coming from AI assistants like ChatGPT, Perplexity, Claude, etc.
 *
 * AI referrals are identified by:
 * 1. Referrer containing AI domain names
 * 2. URL parameters added by AI systems
 * 3. User agent patterns (some AI systems add identifiers)
 *
 * Set up a custom dimension in GA4 for 'ai_referrer' to segment this traffic
 */
const AI_REFERRER_PATTERNS = [
  'chat.openai.com',
  'chatgpt.com',
  'perplexity.ai',
  'claude.ai',
  'anthropic.com',
  'bard.google.com',
  'gemini.google.com',
  'copilot.microsoft.com',
  'bing.com/chat',
  'you.com',
  'phind.com',
  'poe.com'
];

/**
 * Detect if the current visit is from an AI assistant
 */
export const detectAIReferral = (): string | null => {
  if (typeof window === 'undefined') return null;

  const referrer = document.referrer.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);

  // Check referrer against known AI patterns
  for (const pattern of AI_REFERRER_PATTERNS) {
    if (referrer.includes(pattern)) {
      return pattern.split('.')[0]; // Return 'chatgpt', 'perplexity', etc.
    }
  }

  // Check for AI-specific URL parameters (some AI systems add these)
  if (urlParams.get('utm_source')?.toLowerCase().includes('ai')) {
    return urlParams.get('utm_source') || 'ai_unknown';
  }
  if (urlParams.get('ref')?.toLowerCase().includes('ai')) {
    return urlParams.get('ref') || 'ai_unknown';
  }

  return null;
};

/**
 * Track AI referral on page load
 * Call this once on app initialization
 */
export const trackAIReferral = () => {
  const aiSource = detectAIReferral();
  if (aiSource) {
    trackEvent('ai_referral', {
      event_category: 'acquisition',
      event_label: aiSource,
      ai_source: aiSource,
      landing_page: window.location.pathname
    });

    // Also set as user property for segmentation
    if (window.gtag) {
      window.gtag('set', 'user_properties', {
        ai_referred: 'true',
        ai_source: aiSource
      });
    }
  }
};

/**
 * Initialize AI referral tracking
 * Add this to your App.tsx useEffect
 */
export const initAITracking = () => {
  // Track on initial page load
  if (typeof window !== 'undefined') {
    // Delay slightly to ensure gtag is loaded
    setTimeout(trackAIReferral, 1000);
  }
};
