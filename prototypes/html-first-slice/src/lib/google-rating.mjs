import { exactKeys, utc } from './website-proof.mjs';

export function parseGoogleRating(data, now = Date.now()) {
  if (!exactKeys(data, ['schema_version', 'status', 'rating', 'review_count', 'observed_at', 'expires_at'])
    || data.schema_version !== 1 || data.status !== 'available'
    || typeof data.rating !== 'number' || !Number.isFinite(data.rating) || data.rating < 1 || data.rating > 5
    || !Number.isSafeInteger(data.review_count) || data.review_count < 1 || data.review_count > 1_000_000_000) return [];
  const observed = utc(data.observed_at), expiry = utc(data.expires_at);
  if (!(observed <= now && now < expiry && expiry - observed <= 259200000)) return [];
  return [{ ...data, expiry }];
}
export const googleRatingLabel = value => `Rated ${(Math.floor(value.rating * 10) / 10).toFixed(1)}/5 · ${value.review_count.toLocaleString('en-GB')} ${value.review_count === 1 ? 'review' : 'reviews'}`;
