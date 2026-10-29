import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultLazyImageTimeoutMs, lazyImageSelector, prepareLazyImages } from './quality-browser-images.mjs';

// Synthetic browser surface: a fake window, fake <img> elements and a fake
// Playwright page/locator whose evaluate() calls run the serialisable page
// functions directly against the fakes. No DOM library is involved.

const createWindow = ({ scrollX = 0, scrollY = 0 } = {}) => {
  const window = {
    scrollX,
    scrollY,
    scrollCalls: [],
    scrollTo(options) {
      window.scrollCalls.push(options);
      window.scrollX = options.left;
      window.scrollY = options.top;
    },
    getComputedStyle: element => element.style,
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: id => clearTimeout(id),
  };
  return window;
};

const createImage = (window, {
  src = 'https://example.test/image.png',
  alt = 'Example',
  width = '1200',
  height = '675',
  style = {},
  rect = { width: 300, height: 200 },
  complete = false,
  naturalWidth = 0,
  naturalHeight = 0,
  top = 3000,
  onScrollIntoView = () => {},
  decode,
  matches = () => false,
} = {}) => {
  const listeners = { load: new Set(), error: new Set() };
  const attributes = { alt, width, height, loading: 'lazy' };
  const image = {
    src,
    currentSrc: src,
    complete,
    naturalWidth,
    naturalHeight,
    style: { display: 'inline', visibility: 'visible', opacity: '1', position: 'static', overflow: 'visible', clip: 'auto', clipPath: 'none', ...style },
    ownerDocument: { defaultView: window },
    scrollIntoViewCalls: [],
    getAttribute: name => attributes[name] ?? null,
    matches,
    getBoundingClientRect: () => ({ width: rect.width, height: rect.height, top: top - window.scrollY }),
    scrollIntoView(options) {
      image.scrollIntoViewCalls.push(options);
      window.scrollY = top;
      onScrollIntoView(image);
    },
    addEventListener: (type, handler) => listeners[type].add(handler),
    removeEventListener: (type, handler) => listeners[type].delete(handler),
    dispatch: type => { for (const handler of [...listeners[type]]) handler({ type }); },
    listenerCount: type => listeners[type].size,
  };
  if (decode) image.decode = () => decode(image);
  return image;
};

const createPage = (window, images) => ({
  window,
  async evaluate(fn, arg) {
    const previous = globalThis.window;
    globalThis.window = window;
    try { return await fn(arg); } finally {
      if (previous === undefined) delete globalThis.window; else globalThis.window = previous;
    }
  },
  locator(selector) {
    assert.equal(selector, lazyImageSelector);
    return {
      count: async () => images.length,
      nth: index => ({
        evaluate: async (fn, arg) => {
          const element = images[index];
          if (element.throwOnEvaluate) throw new Error(element.throwOnEvaluate);
          return fn(element, arg);
        },
      }),
    };
  },
});

// Simulates the browser fetching a lazy image once it is scrolled into view.
const loadsAfterScroll = (naturalWidth = 1200, naturalHeight = 675) => image => {
  setTimeout(() => {
    image.complete = true;
    image.naturalWidth = naturalWidth;
    image.naturalHeight = naturalHeight;
    image.dispatch('load');
  }, 5);
};

test('exports a bounded default timeout', () => {
  assert.ok(Number.isInteger(defaultLazyImageTimeoutMs) && defaultLazyImageTimeoutMs > 0);
});

test('lazy image that loads and decodes after scrolling into view passes and scroll is restored', async () => {
  const window = createWindow({ scrollX: 0, scrollY: 120 });
  const image = createImage(window, { onScrollIntoView: loadsAfterScroll(), decode: async () => {} });
  const page = createPage(window, [image]);

  const result = await prepareLazyImages(page, { timeoutMs: 500 });

  assert.deepEqual(result, { checked: 1, failures: [] });
  assert.deepEqual(image.scrollIntoViewCalls, [{ block: 'center', inline: 'nearest', behavior: 'instant' }]);
  assert.deepEqual(window.scrollCalls, [{ left: 0, top: 120, behavior: 'instant' }]);
  assert.equal(window.scrollY, 120);
  assert.equal(image.listenerCount('load'), 0, 'load listener removed');
  assert.equal(image.listenerCount('error'), 0, 'error listener removed');
});

test('image that never loads is reported as a timeout, bounded by timeoutMs', async () => {
  const window = createWindow();
  const image = createImage(window, { src: 'https://example.test/slow.png' });
  const page = createPage(window, [image]);

  const started = Date.now();
  const result = await prepareLazyImages(page, { timeoutMs: 30 });
  const elapsed = Date.now() - started;

  assert.equal(result.checked, 1);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].status, 'timeout');
  assert.equal(result.failures[0].src, 'https://example.test/slow.png');
  assert.equal(result.failures[0].complete, false);
  assert.ok(elapsed < 1000, `timed out promptly (${elapsed}ms)`);
  assert.equal(image.listenerCount('load'), 0);
});

test('image whose fetch fires error after scrolling is reported as broken', async () => {
  const window = createWindow();
  const image = createImage(window, {
    src: 'https://example.test/missing.png',
    onScrollIntoView: target => setTimeout(() => { target.complete = true; target.dispatch('error'); }, 5),
  });
  const page = createPage(window, [image]);

  const result = await prepareLazyImages(page, { timeoutMs: 500 });

  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].status, 'broken');
  assert.equal(result.failures[0].naturalWidth, 0);
});

test('already-complete image with zero natural size is reported as broken without waiting', async () => {
  const window = createWindow();
  const image = createImage(window, { complete: true, naturalWidth: 0, naturalHeight: 0 });
  const page = createPage(window, [image]);

  const result = await prepareLazyImages(page, { timeoutMs: 5000 });

  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].status, 'broken');
});

test('already-complete image with natural size passes once decode resolves', async () => {
  const window = createWindow();
  let decoded = 0;
  const image = createImage(window, { complete: true, naturalWidth: 800, naturalHeight: 600, decode: async () => { decoded++; } });
  const page = createPage(window, [image]);

  const result = await prepareLazyImages(page, { timeoutMs: 500 });

  assert.deepEqual(result, { checked: 1, failures: [] });
  assert.equal(decoded, 1);
});

test('decode rejection is reported as a decode failure even though load fired', async () => {
  const window = createWindow();
  const image = createImage(window, {
    onScrollIntoView: loadsAfterScroll(),
    decode: async () => { throw Object.assign(new Error('The source image cannot be decoded.'), { name: 'EncodingError' }); },
  });
  const page = createPage(window, [image]);

  const result = await prepareLazyImages(page, { timeoutMs: 500 });

  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].status, 'decode-error');
  assert.equal(result.failures[0].error, 'EncodingError');
  assert.equal(result.failures[0].complete, true, 'failure recorded although image later reports complete');
});

test('hidden lazy images are skipped using the audit visibility definition', async () => {
  const window = createWindow();
  const images = [
    createImage(window, { style: { display: 'none' } }),
    createImage(window, { style: { visibility: 'hidden' } }),
    createImage(window, { style: { opacity: '0' } }),
    createImage(window, { rect: { width: 0, height: 0 } }),
    createImage(window, { matches: () => true }),
    createImage(window, { style: { position: 'absolute', overflow: 'hidden', clip: 'rect(0 0 0 0)' } }),
    createImage(window, { onScrollIntoView: loadsAfterScroll(), decode: async () => {} }),
  ];
  const page = createPage(window, images);

  const result = await prepareLazyImages(page, { timeoutMs: 500 });

  assert.deepEqual(result, { checked: 1, failures: [] });
  for (const hidden of images.slice(0, -1)) assert.equal(hidden.scrollIntoViewCalls.length, 0);
  assert.equal(images.at(-1).scrollIntoViewCalls.length, 1);
});

test('failures from earlier images are kept while later images continue to be checked', async () => {
  const window = createWindow();
  const images = [
    createImage(window, { src: 'https://example.test/first.png', top: 1500 }),
    createImage(window, { src: 'https://example.test/second.png', top: 2500, onScrollIntoView: loadsAfterScroll(), decode: async () => {} }),
  ];
  const page = createPage(window, images);

  const result = await prepareLazyImages(page, { timeoutMs: 30 });

  assert.equal(result.checked, 2);
  assert.deepEqual(result.failures.map(item => [item.index, item.src, item.status]), [[0, 'https://example.test/first.png', 'timeout']]);
  assert.equal(images[1].scrollIntoViewCalls.length, 1);
});

test('scroll position is restored even when an evaluate throws part-way', async () => {
  const window = createWindow({ scrollX: 8, scrollY: 640 });
  const images = [
    createImage(window, { onScrollIntoView: loadsAfterScroll(), decode: async () => {} }),
    Object.assign(createImage(window), { throwOnEvaluate: 'Target closed' }),
  ];
  const page = createPage(window, images);

  await assert.rejects(() => prepareLazyImages(page, { timeoutMs: 500 }), /Target closed/);

  assert.deepEqual(window.scrollCalls.at(-1), { left: 8, top: 640, behavior: 'instant' });
  assert.equal(window.scrollX, 8);
  assert.equal(window.scrollY, 640);
});

test('page with no lazy images checks nothing and still restores scroll', async () => {
  const window = createWindow({ scrollY: 40 });
  const page = createPage(window, []);

  const result = await prepareLazyImages(page);

  assert.deepEqual(result, { checked: 0, failures: [] });
  assert.deepEqual(window.scrollCalls, [{ left: 0, top: 40, behavior: 'instant' }]);
});
