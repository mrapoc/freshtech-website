// Same-origin JSON endpoints that pages call after load for the anonymous public
// proof feature. Static builds have no
// handler for them, so every browser gate that serves a built directory must
// stub exactly these paths; anything else under /api is still an ordinary
// request and a 404 there is a real defect. Kept in one place so a new feed
// cannot be stubbed by one gate and 404 in another (the homepage Google
// aggregate was missed by the generic quality gate on 16 October 2026).
export const PROOF_ENDPOINT_PATHS = Object.freeze(['/api/website-metrics', '/api/website-feedback', '/api/google-rating']);

export const isProofEndpoint = pathname => PROOF_ENDPOINT_PATHS.includes(pathname);

// Exact-origin check for Playwright route handlers: the request must be a GET
// for one of the listed paths on the served origin (no query, no subpath).
export const isProofEndpointRequest = ({ method, url, baseOrigin }) => {
  if (method !== 'GET') return false;
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  return parsed.origin === baseOrigin && parsed.search === '' && isProofEndpoint(parsed.pathname);
};

export const PROOF_ENDPOINT_STUB = Object.freeze({ status: 200, contentType: 'application/json', body: '{}' });
