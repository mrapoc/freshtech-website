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
  reviewCount: 44,

  // Current rating (should always be 5.0 if only showing 5-star)
  rating: 5.0,

  // Last time this was updated (for tracking freshness)
  lastUpdated: "2026-10-29",

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
    author: "Nick Bromley Accountancy",
    rating: 5,
    text: "Sam and Matt are amazing. They genuinely care about delivering the best service. We have been using the services of Fresh Tech for a number of years now, on an ad-hoc basis for some services and a recurring basis for others. As our business grows we know that we won't need to look elsewhere for managed IT services - Fresh Tech will be more than capable of servicing our needs, and most likely deliver additional services that we don't currently utilise. Thanks both!",
    source: "Google"
  },
  {
    author: "Helen Graham",
    company: "Ludlow Nut Co Ltd",
    rating: 5,
    text: "We are very pleased with the service offered by Fresh Tech. Having just upgraded all our computers to Windows 11, we are very happy with the efficiency, knowledge and attitude of Sam & Matt, making the whole process very streamlined and pain-free!",
    source: "Google"
  },
  {
    author: "Shropshire Lettings",
    rating: 5,
    text: "Great IT company who offer fast and friendly support. Would recommend to businesses small and large.",
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
