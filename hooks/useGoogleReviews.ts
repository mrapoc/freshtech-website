import { createDeferredResource, metricNumber } from '../utils/publicMetrics';

export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  time: number;
  profilePhoto: string | null;
}

export interface GoogleReviewsData {
  reviews: GoogleReview[];
  rating: number | null;
  totalReviews: number | null;
  businessName: string;
  loading: boolean;
  error: boolean;
  fetchedAt: string | null;
}

// Fallback reviews — shown when API is unavailable (e.g. missing env vars on localhost)
// IMPORTANT: These must NOT overlap with trustTestimonials in WhyTrustUsPage.tsx
// (which uses: Hendra Healthcare, Advanced Pest Management, Ludlow Nut Company, Jaques Int)
const fallbackReviews: GoogleReview[] = [
  {
    author: 'Carole Aveson',
    rating: 5,
    text: 'A big shout out to Sam James at Fresh Tech for literally swooping in to rescue my computer from being hacked within seconds. Thank goodness I outsource to companies who know what they are doing.',
    relativeTime: 'Selected customer review',
    time: 0,
    profilePhoto: null,
  },
  {
    author: 'Lindsey Pearce',
    rating: 5,
    text: "Fresh Tech's proactive approach has been particularly beneficial for Pearce Cycles. Not only do they resolve our current issues efficiently, but they also anticipate potential problems before they arise.",
    relativeTime: 'Selected customer review',
    time: 0,
    profilePhoto: null,
  },
  {
    author: 'Julia Hughes',
    rating: 5,
    text: 'From day one, the team at Fresh Tech has been consistently reliable and responsive. They are always just a call or email away, ready to tackle any IT issue we encounter.',
    relativeTime: 'Selected customer review',
    time: 0,
    profilePhoto: null,
  },
  {
    author: 'Rupert Williams',
    rating: 5,
    text: 'We wholeheartedly recommend Fresh Tech to any business looking for reliable, expert, and friendly IT support. Their service has not just been a support function but a key driver in our success.',
    relativeTime: 'Selected customer review',
    time: 0,
    profilePhoto: null,
  },
];

// --- Review filtering logic ---
// Fresh Tech stopped residential work ~2021. Older Google reviews include
// personal laptop repairs, gaming rigs, photo recovery, etc. that dilute
// the business IT messaging. This filter keeps only business-relevant reviews.

/** Strong signals that a review is about personal/residential work */
const RESIDENTIAL_SIGNALS = [
  // Personal device work
  'gaming rig', 'gaming pc', 'my gaming', 'gaming setup',
  'my laptop', 'my computer', 'my mac', 'my pc', 'my imac',
  'personal laptop', 'personal computer', 'family computer',
  'home computer', 'home network', 'home wifi', 'home broadband',
  // Consumer electronics
  'playstation', 'xbox', 'nintendo', 'my phone', 'my ipad', 'my tablet',
  // Residential tasks
  'recovered treasured photos', 'photo recovery', 'treasured photos',
  'choose a new laptop', 'bought a laptop', 'bought in a laptop',
  'hard drive broken', 'hard drives broken',
  'warranty repair', 'charger sent',
  'laptop needs', 'laptop that', 'laptop which',
  'jagged graphics', 'boot up',
  'my son', 'my daughter', 'my wife', 'my husband', 'my mum', 'my dad',
  // Personal relationship framing (not business client)
  'great friend',
];

/** Signals that a review is business-related */
const BUSINESS_SIGNALS = [
  'network', 'server', 'team', 'business', 'company', 'office',
  'sme', 'staff', 'managed', 'monitoring', 'helpdesk', 'onboarding',
  'microsoft 365', 'microsoft', 'cyber', 'security', 'backup',
  'downtime', 'it support', 'it provider', 'support contract',
  'our queries', 'our team', 'our systems', 'our network',
  'proactive', 'responsive', 'vendor', 'compliance',
  'healthcare', 'manufacturing', 'solicitor', 'accountant',
];

/** Minimum review length to display (filters out "Great service." one-liners) */
const MIN_REVIEW_LENGTH = 60;

/**
 * Determines if a review should be shown on the trust page.
 * Logic:
 *  1. Must be 4+ stars (filter negatives)
 *  2. Must have text and meet minimum length
 *  3. If residential signal found → reject
 *  4. If business signal found → accept
 *  5. If neither signal → reject (too ambiguous)
 */
const isBusinessReview = (review: GoogleReview): boolean => {
  // Filter negative reviews
  if (review.rating < 4) return false;

  // Filter empty or very short reviews
  if (!review.text || review.text.trim().length < MIN_REVIEW_LENGTH) return false;

  const text = review.text.toLowerCase();

  // Reject if any residential signal is found
  if (RESIDENTIAL_SIGNALS.some(signal => text.includes(signal))) return false;

  // Accept if any business signal is found
  if (BUSINESS_SIGNALS.some(signal => text.includes(signal))) return true;

  // Ambiguous reviews (no clear signal either way) — reject to keep messaging tight
  // Exception: very positive longer reviews (200+ chars) are likely fine
  return text.length >= 200;
};

const initial = { reviews: fallbackReviews, rating: null as number | null, totalReviews: null as number | null, businessName: 'Fresh Tech IT Support' };
const useReviewsResource = createDeferredResource(initial, async signal => {
  const response = await fetch('/.netlify/functions/google-reviews', { signal });
  if (!response.ok) throw new Error('Reviews unavailable');
  const data = await response.json();
  if (!data || data.stale) throw new Error('Reviews unavailable');
  const rating = metricNumber(data.rating);
  const count = metricNumber(data.totalReviews);
  const validReviews = Array.isArray(data.reviews) ? data.reviews.filter((r: GoogleReview) =>
    r && typeof r.author === 'string' && typeof r.text === 'string' &&
    typeof r.rating === 'number' && r.rating >= 0 && r.rating <= 5 && isBusinessReview(r)
  ) : [];
  return {
    reviews: validReviews.length ? validReviews : fallbackReviews,
    rating: rating !== null && rating <= 5 ? rating : null,
    totalReviews: count !== null && Number.isInteger(count) ? count : null,
    businessName: typeof data.businessName === 'string' ? data.businessName : initial.businessName,
  };
}, 2000);

export const useGoogleReviews = (): GoogleReviewsData => {
  const { data, ...state } = useReviewsResource();
  return { ...data, ...state };
};
