// Netlify Serverless Function: Fetch Google Reviews via Places API (New)
// Caches results for 24 hours to minimise API costs
//
// Required env vars (set in Netlify dashboard > Site settings > Environment variables):
//   GOOGLE_PLACES_API_KEY  - Google Cloud API key with Places API (New) enabled

// Module-level cache — persists across warm invocations
let cache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Provider status values we are willing to echo publicly. Anything else is reported as UNRECOGNISED.
const PUBLIC_STATUS_ALLOWLIST = new Set([
  'OK', 'ZERO_RESULTS', 'NOT_FOUND', 'INVALID_REQUEST', 'OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'UNKNOWN_ERROR',
]);

// Static diagnostic codes. Only these strings (plus a numeric HTTP status) are ever logged.
// Message classification only fires on explicit provider statements; anything else stays unknown.
const DIAG = {
  API_NOT_ENABLED: 'provider_api_not_enabled',
  KEY_RESTRICTED_OR_INVALID: 'provider_key_restricted_or_invalid',
  BILLING: 'provider_billing_disabled',
  OVER_QUERY_LIMIT: 'provider_over_query_limit',
  DENIED_UNKNOWN: 'provider_denied_unknown',
  OTHER_STATUS: 'provider_error_other',
  MALFORMED: 'upstream_malformed_response',
  HTTP_ERROR: 'upstream_http_error',
  TIMEOUT: 'upstream_timeout',
  NETWORK: 'upstream_network_error',
  UNKNOWN: 'unknown',
};

const sanitizeStatus = (status) => (PUBLIC_STATUS_ALLOWLIST.has(status) ? status : 'UNRECOGNISED');

// Preserve the function's existing public/provider-status contract while using
// the canonical error statuses returned by Places API (New).
const NEW_STATUS_TO_PUBLIC_STATUS = new Map([
  ['INVALID_ARGUMENT', 'INVALID_REQUEST'],
  ['NOT_FOUND', 'NOT_FOUND'],
  ['PERMISSION_DENIED', 'REQUEST_DENIED'],
  ['RESOURCE_EXHAUSTED', 'OVER_QUERY_LIMIT'],
  ['INTERNAL', 'UNKNOWN_ERROR'],
  ['UNAVAILABLE', 'UNKNOWN_ERROR'],
  ['UNKNOWN', 'UNKNOWN_ERROR'],
]);

const publicStatusFromNewError = (error) => {
  if (!error || typeof error !== 'object' || Array.isArray(error)) return undefined;
  return NEW_STATUS_TO_PUBLIC_STATUS.get(error.status);
};

const ERROR_INFO_TYPE = 'type.googleapis.com/google.rpc.ErrorInfo';
const ERROR_REASON_TO_DIAGNOSTIC = new Map([
  ['SERVICE_DISABLED', DIAG.API_NOT_ENABLED],
  ['BILLING_DISABLED', DIAG.BILLING],
  ['API_KEY_INVALID', DIAG.KEY_RESTRICTED_OR_INVALID],
  ['API_KEY_SERVICE_BLOCKED', DIAG.KEY_RESTRICTED_OR_INVALID],
  ['API_KEY_HTTP_REFERRER_BLOCKED', DIAG.KEY_RESTRICTED_OR_INVALID],
  ['API_KEY_IP_ADDRESS_BLOCKED', DIAG.KEY_RESTRICTED_OR_INVALID],
]);

// Recognise only Google's documented ErrorInfo envelope and fixed reason values.
// Metadata can contain request-specific details and must never be logged or reflected.
const diagnosticFromErrorInfo = (error) => {
  if (!error || typeof error !== 'object' || Array.isArray(error) || !Array.isArray(error.details)) return undefined;
  for (const detail of error.details) {
    if (!detail || typeof detail !== 'object' || Array.isArray(detail) ||
        detail['@type'] !== ERROR_INFO_TYPE || detail.domain !== 'googleapis.com') continue;
    const diagnostic = ERROR_REASON_TO_DIAGNOSTIC.get(detail.reason);
    if (diagnostic) return diagnostic;
  }
  return undefined;
};

// Explicit statement patterns only. Bare keywords (key, billing, legacy) are not evidence.
const KEY_PATTERNS = [
  /api key (is )?(invalid|not valid|expired)/,
  /invalid api key/,
  /not authorized to use this api key/,
  /api keys? with (referer|ip|android|ios|application) restrictions?/,
];
const BILLING_PATTERNS = [/enable billing/, /billing (is |has been )?(not enabled|disabled)/];
const NOT_ENABLED_PATTERNS = [/api[^.]*\b(is |has )?not (been )?enabled/, /has not been used in project/, /api[^.]*\bis disabled/];

// Map a provider error to a diagnostic code. Never returns any input text.
const classifyProviderError = (status, errorMessage) => {
  if (status === 'OVER_QUERY_LIMIT') return DIAG.OVER_QUERY_LIMIT;
  if (status !== 'REQUEST_DENIED') return sanitizeStatus(status) === 'UNRECOGNISED' ? DIAG.MALFORMED : DIAG.OTHER_STATUS;
  const msg = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
  if (KEY_PATTERNS.some((re) => re.test(msg))) return DIAG.KEY_RESTRICTED_OR_INVALID;
  if (BILLING_PATTERNS.some((re) => re.test(msg))) return DIAG.BILLING;
  if (NOT_ENABLED_PATTERNS.some((re) => re.test(msg))) return DIAG.API_NOT_ENABLED;
  return DIAG.DENIED_UNKNOWN;
};

const logDiagnostic = (code, upstreamHttpStatus, providerStatus) => {
  console.warn(JSON.stringify({
    event: 'google_reviews_upstream_failure',
    code,
    upstreamHttpStatus: Number.isInteger(upstreamHttpStatus) ? upstreamHttpStatus : null,
    providerStatus: providerStatus === undefined ? null : sanitizeStatus(providerStatus),
  }));
};

const failureResponse = (headers, error) => ({
  statusCode: 502,
  headers: { ...headers, 'Cache-Control': 'no-store' },
  body: JSON.stringify({ error, reviews: [], rating: null, totalReviews: null, cached: false }),
});

export const handler = async (event) => {
  // CORS
  const allowedOrigins = [
    'https://fresh-tech.uk',
    'https://www.fresh-tech.uk',
    'http://localhost:5173',
  ];
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400', // CDN caches 24h, browser 1h
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = 'ChIJ6a1VcjVqcEgR2_jkYe5Em5A'; // Fresh Tech - public Google Place ID

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        error: 'Missing GOOGLE_PLACES_API_KEY environment variable',
        reviews: [],
        rating: null,
        totalReviews: null,
        cached: false,
      }),
    };
  }

  // Return cached data if fresh
  const now = Date.now();
  if (cache.data && (now - cache.timestamp) < CACHE_TTL_MS) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...cache.data, cached: true }),
    };
  }

  try {
    // Places API (New) returns up to 5 reviews, sorted by relevance.
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`;

    let res;
    try {
      res = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews',
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
      logDiagnostic(timedOut ? DIAG.TIMEOUT : DIAG.NETWORK);
      return failureResponse(headers, 'Failed to fetch reviews');
    }

    let json;
    try {
      json = await res.json();
    } catch {
      logDiagnostic(res.ok ? DIAG.MALFORMED : DIAG.HTTP_ERROR, res.status);
      return failureResponse(headers, 'Failed to fetch reviews');
    }

    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      logDiagnostic(res.ok ? DIAG.MALFORMED : DIAG.HTTP_ERROR, res.status);
      return failureResponse(headers, 'Failed to fetch reviews');
    }

    const providerStatus = publicStatusFromNewError(json.error);
    if (!res.ok || json.error !== undefined) {
      const providerMessage = json.error && typeof json.error === 'object' && !Array.isArray(json.error)
        ? json.error.message
        : undefined;
      const structuredDiagnostic = diagnosticFromErrorInfo(json.error);
      const code = structuredDiagnostic || (providerStatus === undefined
        ? (res.ok ? DIAG.MALFORMED : DIAG.HTTP_ERROR)
        : classifyProviderError(providerStatus, providerMessage));
      logDiagnostic(code, res.status, providerStatus);
      // Do not expose provider details beyond an allowlisted status.
      return failureResponse(headers, `Google API returned: ${sanitizeStatus(providerStatus)}`);
    }

    const result = json;

    // Server-side filter: strip residential and negative reviews before caching
    const BLOCK_KEYWORDS = [
      'gaming rig', 'gaming pc', 'my gaming', 'my laptop', 'my computer',
      'my mac', 'my pc', 'personal laptop', 'home computer', 'home network',
      'photo recovery', 'treasured photos', 'choose a new laptop',
      'bought a laptop', 'bought in a laptop', 'hard drive broken',
      'hard drives broken', 'warranty repair', 'charger sent',
      'jagged graphics', 'boot up', 'great friend',
      'playstation', 'xbox', 'nintendo', 'my phone', 'my ipad',
      'my son', 'my daughter', 'my wife', 'my husband',
    ];

    const reviews = (Array.isArray(result.reviews) ? result.reviews : [])
      .filter((r) => {
        // Drop anything below 4 stars
        if (!r || typeof r !== 'object' || Array.isArray(r) ||
            typeof r.rating !== 'number' || !Number.isFinite(r.rating) || r.rating < 4 || r.rating > 5) return false;
        // Drop empty or very short reviews
        if (!r.text || typeof r.text !== 'object' || Array.isArray(r.text) ||
            typeof r.text.text !== 'string' || r.text.text.trim().length < 60) return false;
        // Google review attribution is required by the public review contract.
        if (!r.authorAttribution || typeof r.authorAttribution !== 'object' || Array.isArray(r.authorAttribution) ||
            typeof r.authorAttribution.displayName !== 'string' || !r.authorAttribution.displayName) return false;
        // Drop residential signals
        const lower = r.text.text.toLowerCase();
        return !BLOCK_KEYWORDS.some((kw) => lower.includes(kw));
      })
      .map((r) => {
        const publishedAt = typeof r.publishTime === 'string' ? Date.parse(r.publishTime) : NaN;
        return {
          author: r.authorAttribution.displayName,
          rating: r.rating,
          text: r.text.text,
          relativeTime: typeof r.relativePublishTimeDescription === 'string' ? r.relativePublishTimeDescription : '',
          time: Number.isFinite(publishedAt) ? Math.floor(publishedAt / 1000) : 0,
          profilePhoto: typeof r.authorAttribution.photoUri === 'string' ? r.authorAttribution.photoUri : null,
        };
      });

    const data = {
      reviews,
      rating: typeof result.rating === 'number' && Number.isFinite(result.rating) && result.rating >= 0 && result.rating <= 5 ? result.rating : null,
      totalReviews: Number.isInteger(result.userRatingCount) && result.userRatingCount >= 0 ? result.userRatingCount : null,
      businessName: typeof result.displayName?.text === 'string' && result.displayName.text ? result.displayName.text : 'Fresh Tech IT Support',
      fetchedAt: new Date().toISOString(),
    };

    // Update cache
    cache = { data, timestamp: now };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...data, cached: false }),
    };
  } catch {
    // Do not log provider payloads, exception messages or URLs containing the API key.
    logDiagnostic(DIAG.UNKNOWN);
    return failureResponse(headers, 'Failed to fetch reviews');
  }
};
