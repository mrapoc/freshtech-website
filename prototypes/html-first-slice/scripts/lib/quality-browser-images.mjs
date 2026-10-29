// Lazy-image preparation for the generic quality browser audit.
//
// auditDocument reads image.complete and naturalWidth/naturalHeight for every
// visible image. Below-the-fold loading="lazy" images have not been fetched at
// that point, so the audit would either report them as failures or, if they
// were excluded, never prove they load. This helper runs immediately before the
// audit: it scrolls each rendered, visible lazy image into the viewport, waits
// a bounded time for it to load and decode, records any broken / timed-out /
// undecodable image as a failure, and restores the original scroll position
// whether or not anything failed. The audit's own checks are then applied
// unchanged, with no lazy exclusions.
//
// The functions passed to locator.evaluate / page.evaluate are serialised by
// Playwright, so they must not close over module scope. They read the window
// through element.ownerDocument.defaultView so synthetic tests can supply a
// fake element without stubbing globals.

export const lazyImageSelector = 'img[loading="lazy" i]';
export const defaultLazyImageTimeoutMs = 5000;

// Same visibility definition as auditDocument in quality-browser-check.mjs.
// Kept in sync by hand because auditDocument runs as one serialised closure.
const describeLazyImage = image => {
  const view = image.ownerDocument.defaultView;
  const style = view.getComputedStyle(image);
  const rect = image.getBoundingClientRect();
  const visuallyHidden = image.matches('.visually-hidden, .sr-only')
    || (style.position === 'absolute' && style.overflow === 'hidden'
      && (style.clip !== 'auto' || style.clipPath !== 'none' || (rect.width <= 2 && rect.height <= 2)));
  const visible = !visuallyHidden && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  if (!visible) return null;
  return {
    src: image.currentSrc || image.src,
    alt: image.getAttribute('alt'),
    widthAttribute: image.getAttribute('width'),
    heightAttribute: image.getAttribute('height'),
  };
};

const scrollLazyImageIntoView = image => {
  image.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
};

// Resolves with { status: 'loaded' | 'broken' | 'timeout' | 'decode-error', ... }.
// Never rejects: a rejection would surface as a thrown evaluate rather than a
// recorded failure for the route.
const settleLazyImage = (image, timeoutMs) => new Promise(resolveOutcome => {
  const view = image.ownerDocument.defaultView;
  let settled = false;
  let timer;
  const snapshot = () => ({ complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, currentSrc: image.currentSrc || image.src });
  const finish = outcome => {
    if (settled) return;
    settled = true;
    view.clearTimeout(timer);
    image.removeEventListener('load', onLoad);
    image.removeEventListener('error', onError);
    resolveOutcome({ ...outcome, ...snapshot() });
  };
  const decode = () => {
    let decoding;
    try {
      decoding = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
    } catch (error) {
      decoding = Promise.reject(error);
    }
    Promise.resolve(decoding).then(
      () => finish(image.naturalWidth > 0 && image.naturalHeight > 0 ? { status: 'loaded' } : { status: 'broken' }),
      error => finish({ status: 'decode-error', error: String(error?.name || error) }),
    );
  };
  const onLoad = () => decode();
  const onError = () => finish({ status: 'broken' });
  timer = view.setTimeout(() => finish({ status: 'timeout' }), timeoutMs);
  image.addEventListener('load', onLoad);
  image.addEventListener('error', onError);
  if (image.complete) {
    // Already settled by the browser: zero natural size on a complete image
    // means the fetch failed (or there is no usable source).
    if (image.naturalWidth === 0 && image.naturalHeight === 0) finish({ status: 'broken' });
    else decode();
  }
});

const readScroll = () => ({ x: window.scrollX, y: window.scrollY });
const writeScroll = ({ x, y }) => { window.scrollTo({ left: x, top: y, behavior: 'instant' }); };

/**
 * Bring every rendered visible loading="lazy" image into the viewport and wait
 * (bounded) for it to load and decode. Returns { checked, failures } where
 * each failure carries the image description and the settle outcome. The
 * original scroll position is restored in a finally block.
 *
 * @param {{ evaluate: Function, locator: Function }} page Playwright page (or a fake with the same surface).
 * @param {{ timeoutMs?: number }} [options]
 */
export const prepareLazyImages = async (page, { timeoutMs = defaultLazyImageTimeoutMs } = {}) => {
  const failures = [];
  let checked = 0;
  const initialScroll = await page.evaluate(readScroll);
  try {
    const images = page.locator(lazyImageSelector);
    const count = await images.count();
    for (let index = 0; index < count; index++) {
      const image = images.nth(index);
      const description = await image.evaluate(describeLazyImage);
      if (!description) continue;
      checked++;
      await image.evaluate(scrollLazyImageIntoView);
      const outcome = await image.evaluate(settleLazyImage, timeoutMs);
      if (outcome.status !== 'loaded') failures.push({ index, ...description, ...outcome });
    }
  } finally {
    await page.evaluate(writeScroll, initialScroll);
  }
  return { checked, failures };
};
