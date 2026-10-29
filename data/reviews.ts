/**
 * Google Reviews Configuration
 *
 * This file centralizes review data for easy updates.
 * Update the reviewCount and lastUpdated when new reviews come in.
 *
 * To update:
 * 1. Check Google Business Profile for current review count
 * 2. Update reviewCount below
 * 3. Update lastUpdated to today's date
 * 4. Optionally add new testimonials to the testimonials array in content.ts
 */

export const googleReviewsConfig = {
  // Current review count from Google Business Profile
  reviewCount: 42,

  // Current rating (should always be 5.0 if only showing 5-star)
  rating: 5.0,

  // Last time this was updated (for tracking freshness)
  lastUpdated: "2026-01-02",

  // Google Place ID for Fresh Tech Ludlow
  placeId: "ChIJ6a1VcjVqcEgR2_jkYe5Em5A",

  // Minimum rating to display (only show 5-star reviews)
  minimumRating: 5,

  // Review source for schema
  reviewSource: "Google",

  // URL to leave a Google review
  reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ6a1VcjVqcEgR2_jkYe5Em5A"
};

/**
 * Featured reviews for display on the site
 * These are manually curated 5-star reviews
 * Add new ones here as they come in
 */
export const featuredGoogleReviews = [
  {
    author: "Carole Aveson",
    company: "CAA Administration Services",
    rating: 5,
    text: "Well all I can say is a big shout out to Sam James BSc at Fresh Tech for literally swooping into rescue my computer from being hacked within seconds.",
    date: "2024-06",
    source: "Google"
  },
  {
    author: "Lindsey Pearce",
    company: "Pearce Cycles",
    rating: 5,
    text: "Fresh Tech's proactive approach has been particularly beneficial for Pearce Cycles. Not only do they resolve our current issues efficiently, but they also anticipate potential problems before they arise.",
    date: "2024-05",
    source: "Google"
  },
  {
    author: "Helen Graham",
    company: "The Ludlow Nut Company",
    rating: 5,
    text: "We have been working with Sam and the Fresh Tech team for over 5 years. The response time and service we receive is excellent. Sam is always willing to give unbiased advice and is extremely knowledgeable!",
    date: "2024-04",
    source: "Google"
  }
];

/**
 * Generate aggregate rating schema for use across the site
 */
export const generateAggregateRatingSchema = () => ({
  "@type": "AggregateRating",
  "ratingValue": googleReviewsConfig.rating.toString(),
  "reviewCount": googleReviewsConfig.reviewCount.toString(),
  "bestRating": "5",
  "worstRating": "1"
});
