import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGoogleRating, googleRatingLabel } from './google-rating.mjs';
const now = Date.parse('2026-09-22T12:00:00Z');
const fixture = () => ({ schema_version: 1, status: 'available', rating: 4.6, review_count: 123,
  observed_at: '2026-09-22T11:00:00Z', expires_at: '2026-09-23T11:00:00Z' });
test('accepts a fresh aggregate and displays its own count', () => {
  assert.equal(parseGoogleRating(fixture(), now).length, 1);
  assert.equal(googleRatingLabel(fixture()), 'Rated 4.6/5 · 123 reviews');
  assert.equal(googleRatingLabel({ rating: 4.69, review_count: 1 }), 'Rated 4.6/5 · 1 review');
});
test('rejects changed schemas, private fields and invalid aggregates', () => {
  for (const patch of [{ schema_version: 2 }, { status: 'unavailable' }, { reviews: [] }, { rating: '5' },
    { rating: NaN }, { rating: 5.01 }, { rating: 0 }, { review_count: 0 }, { review_count: '123' },
    { review_count: 1.2 }, { review_count: 1e9 + 1 }]) assert.deepEqual(parseGoogleRating({ ...fixture(), ...patch }, now), []);
});
test('rejects expired, future, invalid and renewed observations', () => {
  for (const patch of [{ expires_at: '2026-09-22T12:00:00Z' }, { observed_at: '2026-09-22T12:00:01Z' },
    { observed_at: 'bad' }, { expires_at: '2026-09-25T11:00:01Z' }]) assert.deepEqual(parseGoogleRating({ ...fixture(), ...patch }, now), []);
  assert.equal(parseGoogleRating(fixture(), Date.parse(fixture().expires_at) - 1).length, 1);
});
