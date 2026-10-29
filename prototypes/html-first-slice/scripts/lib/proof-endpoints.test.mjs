import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PROOF_ENDPOINT_PATHS, isProofEndpoint, isProofEndpointRequest } from './proof-endpoints.mjs';

const base = 'http://127.0.0.1:4321';

test('every feed the browser proof script can request is a stubbed endpoint', async () => {
  const source = await readFile(resolve(import.meta.dirname, '..', '..', 'src', 'scripts', 'website-proof.mjs'), 'utf8');
  const feeds = await readFile(resolve(import.meta.dirname, '..', '..', 'src', 'lib', 'website-proof.mjs'), 'utf8');
  const requested = [...`${source}\n${feeds}`.matchAll(/['"`](\/api\/[a-z-]+)['"`]/g)].map(match => match[1]);
  assert.ok(requested.includes('/api/google-rating'), 'the homepage Google aggregate feed must be found in the proof script');
  for (const path of new Set(requested)) assert.ok(isProofEndpoint(path), `${path} is requested by the proof script but not stubbed by the browser gates`);
});

test('request matching is exact: origin, GET, path and no query string', () => {
  for (const path of PROOF_ENDPOINT_PATHS) assert.equal(isProofEndpointRequest({ method: 'GET', url: `${base}${path}`, baseOrigin: base }), true);
  assert.equal(isProofEndpointRequest({ method: 'POST', url: `${base}/api/website-metrics`, baseOrigin: base }), false);
  assert.equal(isProofEndpointRequest({ method: 'GET', url: `${base}/api/website-metrics?x=1`, baseOrigin: base }), false);
  assert.equal(isProofEndpointRequest({ method: 'GET', url: `${base}/api/send-email`, baseOrigin: base }), false);
  assert.equal(isProofEndpointRequest({ method: 'GET', url: `${base}/api/google-rating/`, baseOrigin: base }), false);
  assert.equal(isProofEndpointRequest({ method: 'GET', url: 'http://localhost:4321/api/google-rating', baseOrigin: base }), false);
  assert.equal(isProofEndpointRequest({ method: 'GET', url: 'not a url', baseOrigin: base }), false);
});
