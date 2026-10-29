import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLARITY_URL, CLOUDINARY_IMAGE_STUB, GA_URL, classifyRequest, describeRequestFailure, formatRequestFailures } from './problem-browser-network.mjs';
import { BLOCKMARK_STUB } from './blockmark-stub.mjs';

const baseOrigin = 'http://127.0.0.1:4173';
const vendorStub = { status: 200, contentType: 'text/javascript', body: ';' };
const classify = (url, extra = {}) => classifyRequest({ method: 'GET', url, baseOrigin, ...extra });

test('GET on the exact served origin continues', () => {
  assert.equal(classify(`${baseOrigin}/slow-computers/`).action, 'continue');
  assert.equal(classify(`${baseOrigin}/fonts/inter.woff2?v=1#x`).action, 'continue');
});

test('same host on a different port, scheme or a localhost alias is blocked', () => {
  for (const url of ['http://127.0.0.1:4174/slow-computers/', 'http://127.0.0.1/slow-computers/', 'https://127.0.0.1:4173/slow-computers/', 'http://localhost:4173/slow-computers/', 'http://[::1]:4173/', 'http://127.0.0.1.nip.io:4173/']) {
    const decision = classify(url);
    assert.equal(decision.action, 'abort', url);
    assert.match(decision.reason, /not allowed/, url);
  }
  assert.equal(classify('http://127.0.0.1:4173/').action, 'continue');
});

test('every non-GET method is blocked even on the served origin or an allowed stub', () => {
  for (const method of ['POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'get', undefined]) {
    for (const url of [`${baseOrigin}/`, 'https://res.cloudinary.com/logo.png', GA_URL]) {
      const decision = classifyRequest({ method, url, baseOrigin, vendorStub });
      assert.equal(decision.action, 'abort', `${method} ${url}`);
      assert.match(decision.reason, /non-GET/, `${method} ${url}`);
    }
  }
});

test('Cloudinary HTTPS origin GET is fulfilled with the image stub, other schemes and hosts are not', () => {
  const decision = classify('https://res.cloudinary.com/demo/image/upload/logo.png');
  assert.equal(decision.action, 'fulfil');
  assert.equal(decision.stub, CLOUDINARY_IMAGE_STUB);
  assert.equal(classify('http://res.cloudinary.com/demo/logo.png').action, 'abort');
  assert.equal(classify('https://res.cloudinary.com:8443/demo/logo.png').action, 'abort');
  assert.equal(classify('https://cloudinary.com/demo/logo.png').action, 'abort');
  assert.equal(classify('https://evil.res.cloudinary.com/demo/logo.png').action, 'abort');
});

test('the two exact vendor URLs are fulfilled only when an explicit stub is provided', () => {
  for (const url of [GA_URL, CLARITY_URL]) {
    assert.equal(classify(url).action, 'abort', `${url} without stub`);
    const decision = classify(url, { vendorStub });
    assert.equal(decision.action, 'fulfil', url);
    assert.equal(decision.stub, vendorStub, url);
  }
  for (const url of ['https://www.googletagmanager.com/gtag/js?id=G-OTHER', 'https://www.googletagmanager.com/gtag/js', `${GA_URL}&l=x`, 'https://www.clarity.ms/tag/other', 'https://c.clarity.ms/collect', 'https://www.google-analytics.com/g/collect', 'http://www.clarity.ms/tag/urhwe2bbi1']) {
    assert.equal(classify(url, { vendorStub }).action, 'abort', url);
  }
});

test('unparseable URLs and non-http schemes are blocked, malformed base origins are rejected', () => {
  assert.equal(classify('not a url').action, 'abort');
  assert.equal(classify('data:text/plain,hello').action, 'abort');
  assert.equal(classify('blob:http://127.0.0.1:4173/abc').action, 'abort');
  assert.equal(classify('file:///C:/dist/index.html').action, 'abort');
  assert.throws(() => classifyRequest({ method: 'GET', url: `${baseOrigin}/`, baseOrigin: `${baseOrigin}/` }), TypeError);
  assert.throws(() => classifyRequest({ method: 'GET', url: `${baseOrigin}/`, baseOrigin: '127.0.0.1:4173' }), TypeError);
  assert.throws(() => classifyRequest({ method: 'GET', url: `${baseOrigin}/`, baseOrigin: undefined }), TypeError);
});

test('failure metadata records method, URL, error text and the current page route', () => {
  const failure = describeRequestFailure({ method: 'POST', url: 'https://api.example.com/x', errorText: 'net::ERR_FAILED', pageUrl: `${baseOrigin}/ransomware-recovery/`, baseOrigin });
  assert.deepEqual(failure, { method: 'POST', url: 'https://api.example.com/x', errorText: 'net::ERR_FAILED', route: '/ransomware-recovery/' });
  const foreign = describeRequestFailure({ method: 'GET', url: `${baseOrigin}/a.css`, errorText: '', pageUrl: 'about:blank', baseOrigin });
  assert.deepEqual(foreign, { method: 'GET', url: `${baseOrigin}/a.css`, errorText: 'unknown', route: 'about:blank' });
  const missing = describeRequestFailure({ method: undefined, url: undefined, errorText: undefined, pageUrl: undefined, baseOrigin });
  assert.deepEqual(missing, { method: 'unknown', url: 'unknown', errorText: 'unknown', route: 'unknown' });
  assert.equal(formatRequestFailures([failure, foreign]), `POST https://api.example.com/x (net::ERR_FAILED) on /ransomware-recovery/; GET ${baseOrigin}/a.css (unknown) on about:blank`);
});

test('only the Blockmark badge certificate frame is fulfilled with the local badge stub', () => {
  const decision = classify('https://registry.blockmarktech.com/certificates/abc/widget/?type=1');
  assert.equal(decision.action, 'fulfil');
  assert.equal(decision.stub, BLOCKMARK_STUB);
  for (const url of ['http://registry.blockmarktech.com/certificates/abc/widget/', 'https://registry.blockmarktech.com/other', 'https://evil.registry.blockmarktech.com/certificates/abc/']) assert.equal(classify(url).action, 'abort', url);
  assert.equal(classifyRequest({ method: 'POST', url: 'https://registry.blockmarktech.com/certificates/abc/widget/', baseOrigin }).action, 'abort');
});
