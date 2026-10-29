// Pure request policy for the Problem browser gate (problems-browser-check.mjs).
// No Playwright import: the checker maps a decision onto route.continue /
// route.fulfill / route.abort, and this module is unit-tested on its own.
//   - GET only. Every other method is blocked, whatever the origin.
//   - Local traffic continues only when the exact URL origin (scheme, host,
//     port) equals the served base origin. A different port, https, or a
//     localhost alias is an external origin and is blocked.
//   - External GET traffic is fulfilled only for the Cloudinary HTTPS origin
//     (image stub) and, when the caller supplies an explicit vendor stub, the
//     two exact GA / Clarity script URLs. The Blockmark Cyber Essentials
//     badge frame (footer of every page) is fulfilled with a local stub.
//     Everything else is blocked.
// On a green run nothing is ever aborted: allowed calls are fulfilled and any
// blocked request surfaces as a recorded request failure.
import { BLOCKMARK_STUB, isBlockmarkBadge } from './blockmark-stub.mjs';

export const CLOUDINARY_ORIGIN = 'https://res.cloudinary.com';
export const GA_URL = 'https://www.googletagmanager.com/gtag/js?id=G-XB492EFNKW';
export const CLARITY_URL = 'https://www.clarity.ms/tag/urhwe2bbi1';
export const VENDOR_URLS = Object.freeze([GA_URL, CLARITY_URL]);
export const CLOUDINARY_IMAGE_STUB = Object.freeze({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="72" />' });

const parseUrl = value => { try { return new URL(value); } catch { return null; } };

// classifyRequest({ method, url, baseOrigin, vendorStub }) ->
//   { action: 'continue' | 'fulfil' | 'abort', reason, stub? }
export const classifyRequest = ({ method, url, baseOrigin, vendorStub = null }) => {
  const base = typeof baseOrigin === 'string' ? parseUrl(baseOrigin) : null;
  if (!base || base.origin !== baseOrigin) throw new TypeError(`baseOrigin must be an exact origin such as http://127.0.0.1:1234, got ${JSON.stringify(baseOrigin)}`);
  if (method !== 'GET') return { action: 'abort', reason: `non-GET method ${String(method)}` };
  const parsed = typeof url === 'string' ? parseUrl(url) : null;
  if (!parsed) return { action: 'abort', reason: 'unparseable URL' };
  // blob: / data: / filesystem: URLs inherit or synthesise an origin, so the
  // scheme is checked before the origin comparison.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { action: 'abort', reason: `scheme ${parsed.protocol} not allowed` };
  if (parsed.origin === baseOrigin) return { action: 'continue', reason: 'served origin' };
  if (isBlockmarkBadge(parsed)) return { action: 'fulfil', reason: 'blockmark badge stub', stub: BLOCKMARK_STUB };
  if (parsed.origin === CLOUDINARY_ORIGIN) return { action: 'fulfil', reason: 'cloudinary image stub', stub: CLOUDINARY_IMAGE_STUB };
  if (vendorStub && VENDOR_URLS.includes(parsed.href)) return { action: 'fulfil', reason: 'vendor stub', stub: vendorStub };
  return { action: 'abort', reason: `external origin ${parsed.origin} not allowed` };
};

// Failure metadata for the report: method, URL, Chromium error text and the
// route of the page that was current when the request failed.
export const describeRequestFailure = ({ method, url, errorText, pageUrl, baseOrigin }) => {
  const page = typeof pageUrl === 'string' ? parseUrl(pageUrl) : null;
  const route = page && page.origin === baseOrigin ? page.pathname : (typeof pageUrl === 'string' && pageUrl ? pageUrl : 'unknown');
  return { method: String(method ?? 'unknown'), url: String(url ?? 'unknown'), errorText: typeof errorText === 'string' && errorText ? errorText : 'unknown', route };
};

export const formatRequestFailures = failures => failures.map(failure => `${failure.method} ${failure.url} (${failure.errorText}) on ${failure.route}`).join('; ');
