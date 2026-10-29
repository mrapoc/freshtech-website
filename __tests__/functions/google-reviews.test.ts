// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi, type MockInstance } from 'vitest';

const SECRET_KEY = 'synthetic-secret-key-AIzaSyFAKE1234567890';
const RAW_MESSAGE = 'RAW PROVIDER MESSAGE: project 123456 must enable Billing, key restricted to referer example.test';
const REVIEW_TEXT = 'Customer review body that must never appear in server logs, long enough to pass the length filter.';

let warn: MockInstance<typeof console.warn>;
let error: MockInstance<typeof console.error>;
let log: MockInstance<typeof console.log>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  error = vi.spyOn(console, 'error').mockImplementation(() => {});
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); vi.restoreAllMocks(); });

async function load() {
  // @ts-expect-error Directly exercise the JavaScript Netlify handler.
  return import('../../netlify/functions/google-reviews.js');
}
async function call() {
  const { handler } = await load();
  return handler({ httpMethod: 'GET', headers: {} });
}
function stubKeyAnd(fetchImpl: unknown) {
  vi.stubEnv('GOOGLE_PLACES_API_KEY', SECRET_KEY);
  vi.stubGlobal('fetch', fetchImpl);
}
function newApiError(status: string, message: string, httpStatus = 403, details?: unknown[]) {
  return new Response(JSON.stringify({ error: { status, message, ...(details ? { details } : {}) } }), { status: httpStatus });
}
function errorInfo(reason: unknown, domain = 'googleapis.com', type = 'type.googleapis.com/google.rpc.ErrorInfo') {
  return { '@type': type, reason, domain, metadata: { service: 'must-not-be-logged.example', consumer: SECRET_KEY } };
}
function allLogOutput() {
  return JSON.stringify([...warn.mock.calls, ...error.mock.calls, ...log.mock.calls]);
}
function loggedDiagnostics() {
  return warn.mock.calls.map((args) => JSON.parse(String(args[0])));
}
function expectNoLeak(response: { body: string }) {
  const out = allLogOutput() + response.body;
  for (const forbidden of [SECRET_KEY, RAW_MESSAGE, 'must enable Billing', 'maps.googleapis.com', 'place_id=', REVIEW_TEXT]) {
    expect(out).not.toContain(forbidden);
  }
}
function expectFailureShape(response: { statusCode: number; headers: Record<string, string>; body: string }) {
  expect(response.statusCode).toBe(502);
  expect(response.headers['Cache-Control']).toBe('no-store');
  expect(JSON.parse(response.body)).toMatchObject({ reviews: [], rating: null, totalReviews: null, cached: false });
}
const ALLOWED_LOG_KEYS = ['event', 'code', 'upstreamHttpStatus', 'providerStatus'];
function expectSingleDiagnostic(code: string, upstreamHttpStatus: number | null, providerStatus: string | null) {
  const entries = loggedDiagnostics();
  expect(entries).toHaveLength(1);
  expect(Object.keys(entries[0]).sort()).toEqual([...ALLOWED_LOG_KEYS].sort());
  expect(entries[0]).toEqual({ event: 'google_reviews_upstream_failure', code, upstreamHttpStatus, providerStatus });
}

it('missing configuration returns null aggregates and no-store', async () => {
  vi.stubEnv('GOOGLE_PLACES_API_KEY', '');
  const response = await call();
  expect(response.statusCode).toBe(500);
  expect(response.headers['Cache-Control']).toBe('no-store');
  expect(JSON.parse(response.body)).toMatchObject({ rating: null, totalReviews: null });
});

it('preserves an actual zero total instead of 42', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(Response.json({ rating: 0, userRatingCount: 0, reviews: [] })));
  const response = await call();
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toMatchObject({ rating: 0, totalReviews: 0 });
  expect(warn).not.toHaveBeenCalled();
});

it('success still filters, caches and logs nothing', async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({
    displayName: { text: 'Fresh Tech' }, rating: 4.9, userRatingCount: 12,
    reviews: [
      { authorAttribution: { displayName: 'A', photoUri: 'https://example.test/a.jpg' }, rating: 5, text: { text: REVIEW_TEXT }, relativePublishTimeDescription: 'a month ago', publishTime: '2026-08-01T00:00:00Z' },
      { authorAttribution: { displayName: 'B' }, rating: 3, text: { text: REVIEW_TEXT }, publishTime: '2026-07-01T00:00:00Z' },
      { authorAttribution: { displayName: 'C' }, rating: 5, text: { text: 'Fixed my gaming pc quickly and cheaply, would recommend to anyone at home.' }, publishTime: '2026-06-01T00:00:00Z' },
    ],
  }));
  stubKeyAnd(fetchMock);
  const { handler } = await load();
  const first = await handler({ httpMethod: 'GET', headers: {} });
  const second = await handler({ httpMethod: 'GET', headers: {} });
  const firstBody = JSON.parse(first.body);
  expect(first.statusCode).toBe(200);
  expect(first.headers['Cache-Control']).toBe('public, max-age=3600, s-maxage=86400');
  expect(firstBody).toMatchObject({ rating: 4.9, totalReviews: 12, cached: false });
  expect(firstBody.reviews).toEqual([expect.objectContaining({
    author: 'A', relativeTime: 'a month ago', time: 1785542400, profilePhoto: 'https://example.test/a.jpg',
  })]);
  expect(JSON.parse(second.body).cached).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('https://places.googleapis.com/v1/places/ChIJ6a1VcjVqcEgR2_jkYe5Em5A?languageCode=en');
  expect(url).not.toContain(SECRET_KEY);
  expect(init.headers).toEqual({
    'X-Goog-Api-Key': SECRET_KEY,
    'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews',
  });
  expect(allLogOutput()).not.toContain(REVIEW_TEXT);
  expect(allLogOutput()).not.toContain(SECRET_KEY);
});

it('drops malformed nested reviews instead of exposing invalid render data', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      displayName: { text: 'Fresh Tech' },
      reviews: [
        { authorAttribution: { displayName: 'A' }, rating: Number.NaN, text: { text: REVIEW_TEXT } },
        { authorAttribution: [], rating: 5, text: { text: REVIEW_TEXT } },
        { authorAttribution: { displayName: { text: 'A' } }, rating: 5, text: { text: REVIEW_TEXT } },
        { authorAttribution: { displayName: 'A' }, rating: 5, text: [REVIEW_TEXT] },
      ],
    }),
  }));
  const response = await call();
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body).reviews).toEqual([]);
  expect(warn).not.toHaveBeenCalled();
});

it('PERMISSION_DENIED with unrecognised message preserves the public denied contract', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('PERMISSION_DENIED', RAW_MESSAGE.replace(/Billing|key|referer/g, 'x'))));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Google API returned: REQUEST_DENIED');
  expectSingleDiagnostic('provider_denied_unknown', 403, 'REQUEST_DENIED');
  expectNoLeak(response);
});

it.each([
  ['You are calling a legacy API, which is not enabled for your project.', 'provider_api_not_enabled'],
  ['Places API has not been used in project 123456 before or it is disabled.', 'provider_api_not_enabled'],
  ['The provided API key is invalid.', 'provider_key_restricted_or_invalid'],
  ['This IP, site or mobile application is not authorized to use this API key. Request received from IP address 203.0.113.9', 'provider_key_restricted_or_invalid'],
  ['API keys with referer restrictions cannot be used with this API.', 'provider_key_restricted_or_invalid'],
  ['You must enable Billing on the Google Cloud Project at https://console.developers.google.com/', 'provider_billing_disabled'],
])('classifies recognised REQUEST_DENIED message %#', async (message, code) => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('PERMISSION_DENIED', message)));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic(code, 403, 'REQUEST_DENIED');
  expect(allLogOutput() + response.body).not.toContain(message);
  expect(allLogOutput() + response.body).not.toContain('203.0.113.9');
  expectNoLeak(response);
});

it.each([
  'This API project is not authorized to use this API.',
  'Billing details were reviewed but the request was denied for another reason.',
  'Legacy API access was refused by policy.',
  'The API key parameter was received but the request is not permitted.',
  'Requests to this API must include a valid key parameter.',
  'The API quota limit was reviewed and access denied.',
])('ambiguous REQUEST_DENIED message stays unknown: %s', async (message) => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('PERMISSION_DENIED', message)));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic('provider_denied_unknown', 403, 'REQUEST_DENIED');
  expect(allLogOutput() + response.body).not.toContain(message);
  expectNoLeak(response);
});

it('RESOURCE_EXHAUSTED maps to the existing public provider limit code', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('RESOURCE_EXHAUSTED', RAW_MESSAGE, 429)));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Google API returned: OVER_QUERY_LIMIT');
  expectSingleDiagnostic('provider_over_query_limit', 429, 'OVER_QUERY_LIMIT');
  expectNoLeak(response);
});

it.each([
  ['numeric', 200],
  ['null', null],
])('%s provider status is treated as an HTTP error and sanitised', async (_label, status) => {
  stubKeyAnd(vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { status, message: RAW_MESSAGE } }), { status: 500 })));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Google API returned: UNRECOGNISED');
  expectSingleDiagnostic('upstream_http_error', 500, null);
  expectNoLeak(response);
});

it.each([
  ['top-level array', [{ rating: 5 }]],
  ['array error', { error: [{ status: 'PERMISSION_DENIED' }] }],
])('%s body is malformed', async (_label, body) => {
  stubKeyAnd(vi.fn().mockResolvedValue(Response.json(body)));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic('upstream_malformed_response', 200, null);
  expectNoLeak(response);
});

it('non-2xx success-shaped body is an HTTP error, not a success', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(new Response(JSON.stringify({ rating: 5, userRatingCount: 3 }), { status: 500 })));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Google API returned: UNRECOGNISED');
  expectSingleDiagnostic('upstream_http_error', 500, null);
  expectNoLeak(response);
});

it('arbitrary provider status is not echoed publicly or logged raw', async () => {
  const injected = '<script>alert(1)</script>' + SECRET_KEY;
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError(injected, RAW_MESSAGE)));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Google API returned: UNRECOGNISED');
  expectSingleDiagnostic('upstream_http_error', 403, null);
  expect(allLogOutput() + response.body).not.toContain('<script>');
  expectNoLeak(response);
});

it.each([
  ['SERVICE_DISABLED', 'provider_api_not_enabled'],
  ['BILLING_DISABLED', 'provider_billing_disabled'],
  ['API_KEY_INVALID', 'provider_key_restricted_or_invalid'],
  ['API_KEY_SERVICE_BLOCKED', 'provider_key_restricted_or_invalid'],
  ['API_KEY_HTTP_REFERRER_BLOCKED', 'provider_key_restricted_or_invalid'],
  ['API_KEY_IP_ADDRESS_BLOCKED', 'provider_key_restricted_or_invalid'],
])('classifies allowlisted google.rpc.ErrorInfo reason %s without exposing details', async (reason, code) => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('PERMISSION_DENIED', 'Unrecognised provider wording', 403, [errorInfo(reason)])));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic(code, 403, 'REQUEST_DENIED');
  expect(allLogOutput() + response.body).not.toContain(reason);
  expect(allLogOutput() + response.body).not.toContain('must-not-be-logged.example');
  expectNoLeak(response);
});

it.each([
  ['wrong domain', errorInfo('SERVICE_DISABLED', 'example.com')],
  ['unknown reason', errorInfo('SOMETHING_NEW')],
  ['prototype-named reason', errorInfo('__proto__')],
  ['wrong type', errorInfo('SERVICE_DISABLED', 'googleapis.com', 'type.googleapis.com/example.ErrorInfo')],
])('ignores %s in structured error details', async (_label, detail) => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('PERMISSION_DENIED', 'Unrecognised provider wording', 403, [detail])));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic('provider_denied_unknown', 403, 'REQUEST_DENIED');
  expectNoLeak(response);
});

it('prototype-named provider status cannot inherit a public mapping', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(newApiError('__proto__', RAW_MESSAGE)));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Google API returned: UNRECOGNISED');
  expectSingleDiagnostic('upstream_http_error', 403, null);
  expectNoLeak(response);
});

it('provider error in a 2xx response is still rejected and classified', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(Response.json({ error: { status: 'PERMISSION_DENIED', message: 'The provided API key is invalid.' } })));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic('provider_key_restricted_or_invalid', 200, 'REQUEST_DENIED');
  expectNoLeak(response);
});

it('non-JSON body is malformed and never logged', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(new Response('<html>' + RAW_MESSAGE + '</html>', { status: 200, headers: { 'Content-Type': 'text/html' } })));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Failed to fetch reviews');
  expectSingleDiagnostic('upstream_malformed_response', 200, null);
  expectNoLeak(response);
});

it('HTTP failure without provider status logs numeric status only', async () => {
  stubKeyAnd(vi.fn().mockResolvedValue(new Response('Service Unavailable ' + RAW_MESSAGE, { status: 503 })));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic('upstream_http_error', 503, null);
  expectNoLeak(response);
});

it('timeout is classified without logging the exception', async () => {
  const err = new Error('The operation was aborted due to timeout ' + SECRET_KEY);
  err.name = 'TimeoutError';
  stubKeyAnd(vi.fn().mockRejectedValue(err));
  const response = await call();
  expectFailureShape(response);
  expect(JSON.parse(response.body).error).toBe('Failed to fetch reviews');
  expectSingleDiagnostic('upstream_timeout', null, null);
  expectNoLeak(response);
});

it('network error is classified without logging the exception', async () => {
  stubKeyAnd(vi.fn().mockRejectedValue(new TypeError('fetch failed: ' + RAW_MESSAGE)));
  const response = await call();
  expectFailureShape(response);
  expectSingleDiagnostic('upstream_network_error', null, null);
  expectNoLeak(response);
});
