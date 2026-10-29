import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { useGoogleReviews } from '../hooks/useGoogleReviews';
import { useInView } from '../hooks/useInView';

interface GoogleReviewsProps {
  maxReviews?: number;
}

export const GoogleReviews: React.FC<GoogleReviewsProps> = ({ maxReviews = 5 }) => {
  const { reviews, rating, totalReviews, loading } = useGoogleReviews();
  const [ref, isInView] = useInView(0.1);

  const displayReviews = reviews.slice(0, maxReviews);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-16 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Header with Google branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            {/* Google "G" logo — SVG for crisp rendering at any size */}
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Google Reviews</span>
          </div>
          <h2 className="font-heading text-3xl text-neutral mb-3">
            {rating === null ? 'Selected customer reviews' : `Rated ${rating.toFixed(1)} out of 5`}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">

            <span className="text-gray-500 text-sm">
              {totalReviews === null ? 'Current review totals are unavailable' : `Based on ${totalReviews} Google reviews`}
            </span>
          </div>
          <a
            href="https://search.google.com/local/reviews?placeid=ChIJ6a1VcjVqcEgR2_jkYe5Em5A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            See all reviews on Google <ExternalLink size={10} />
          </a>
        </div>

        {/* Reviews grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(j => (
                    <div key={j} className="w-4 h-4 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {displayReviews.map((review, idx) => (
              <blockquote
                key={idx}
                className={`bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-500 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      size={14}
                      className={i <= review.rating ? 'text-yellow-400' : 'text-gray-200'}
                      fill="currentColor"
                    />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-4">
                  "{review.text}"
                </p>

                {/* Author */}
                <footer className="flex items-center gap-3">
                  {review.profilePhoto ? (
                    <img
                      src={review.profilePhoto}
                      alt={`${review.author}'s profile`}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {review.author.charAt(0)}
                    </div>
                  )}
                  <div>
                    <cite className="font-bold text-sm text-neutral not-italic">{review.author}</cite>
                    {review.relativeTime && (
                      <p className="text-xs text-gray-400">{review.relativeTime}</p>
                    )}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        {/* Google attribution — required by Places API ToS */}
        <p className="text-center text-[10px] text-gray-300 mt-8">
          Reviews provided by Google Maps Platform. Google and the Google logo are trademarks of Google LLC.
        </p>
      </div>
    </section>
  );
};
