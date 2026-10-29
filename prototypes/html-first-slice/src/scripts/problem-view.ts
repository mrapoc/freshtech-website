/**
 * Consent-gated `service_view` for Problem pages.
 *
 * Mirrors the React page's `trackServiceView('problem_' + slug)` from
 * utils/analytics.ts exactly:
 *   gtag('event', 'service_view', { event_category: 'engagement', event_label: 'problem_<slug>' })
 *
 * This module never loads a vendor, never creates a consent controller and
 * never touches storage itself. enhance.ts hands it the one existing
 * controller's `hasUsableOptIn` and `onConsentChanged`, plus two thin
 * browser hooks (`getGtag`, `observeHead`), so it can be driven in Node with
 * fakes. The event fires at most once per page instance, and only when a
 * usable opt-in is true at the moment of emission AND `gtag` exists.
 *
 * Readiness without polling: `installVendorScripts` appends the GA <script>
 * to <head> and defines `window.gtag` in the same synchronous call, so a
 * childList MutationObserver on <head> (delivered as a microtask right after
 * that call) plus one immediate check is enough to notice the vendor. A
 * consent-change subscription covers a grant that happens after this module
 * has started. Both are torn down on the first successful emission or when
 * the owner calls `dispose()`.
 *
 * Lifecycle limitations (deliberate):
 * - `gtag` is the bootstrap queue stub until gtag.js finishes loading. The
 *   event is pushed to `dataLayer` and sent once the script arrives, same as
 *   the React site. If the user leaves before that, the hit is lost, as before.
 * - Once per page instance means a back-forward cache restore does not emit
 *   again; the subscription is kept alive across a persisted pagehide so a
 *   pending (not yet emitted) view can still complete after restore.
 * - A revoke after the vendor has loaded reloads the page (consent.ts), which
 *   naturally resets this module.
 */

export const SERVICE_VIEW_EVENT = 'service_view';
export const SERVICE_VIEW_CATEGORY = 'engagement';
export const PROBLEM_LABEL_PREFIX = 'problem_';
/** ComparisonPage.tsx calls trackServiceView('comparison_' + slug) with the same event shape. */
export const COMPARISON_LABEL_PREFIX = 'comparison_';

/** Route-safe slug: lowercase letters/digits separated by single hyphens, bounded length. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 100;

export function isProblemSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value);
}

export type Gtag = (...args: unknown[]) => void;

export interface ProblemViewEnv {
  /** From the existing consent controller: stored opt-in AND writable storage. */
  hasUsableOptIn(): boolean;
  /** From the existing consent controller. Returns an unsubscribe function. */
  onConsentChanged(listener: (state: { analytics: boolean }) => void): () => void;
  /** Current `window.gtag`, or undefined until the vendor bootstrap has run. */
  getGtag(): Gtag | undefined;
  /**
   * Watch <head> children and call `onChange` after each mutation batch.
   * Returns a disconnect function, or null when observation is unavailable
   * (then only the immediate check and consent changes can trigger emission).
   */
  observeHead(onChange: () => void): (() => void) | null;
}

export interface ProblemViewHandle {
  /** True once the event has been handed to gtag. */
  emitted(): boolean;
  /** Stops observing and unsubscribes. Safe to call repeatedly. */
  dispose(): void;
}

export function trackProblemView(slug: unknown, env: ProblemViewEnv, labelPrefix: string = PROBLEM_LABEL_PREFIX): ProblemViewHandle {
  let emitted = false;
  let disposed = false;
  let disconnect: (() => void) | null = null;
  let unsubscribe: (() => void) | null = null;

  const dispose = () => {
    disposed = true;
    const d = disconnect;
    const u = unsubscribe;
    disconnect = null;
    unsubscribe = null;
    d?.();
    u?.();
  };

  if (!isProblemSlug(slug)) {
    return { emitted: () => false, dispose };
  }
  const label = labelPrefix + slug;

  const tryEmit = () => {
    if (emitted || disposed) return;
    // Consent is re-read at emission time, not cached from an earlier notification.
    if (!env.hasUsableOptIn()) return;
    const gtag = env.getGtag();
    if (typeof gtag !== 'function') return;
    emitted = true;
    dispose();
    gtag('event', SERVICE_VIEW_EVENT, { event_category: SERVICE_VIEW_CATEGORY, event_label: label });
  };

  unsubscribe = env.onConsentChanged(() => tryEmit());
  disconnect = env.observeHead(tryEmit);
  tryEmit();

  return { emitted: () => emitted, dispose };
}

/** Minimal shape of the controller surface this module needs from enhance.ts. */
export interface ProblemViewConsent {
  hasUsableOptIn(): boolean;
  onConsentChanged(listener: (state: { analytics: boolean }) => void): () => void;
}

/** Real-browser environment over the existing controller; enhance.ts is the only caller. */
export function browserProblemViewEnv(
  consent: ProblemViewConsent,
  win: { gtag?: Gtag } = window as { gtag?: Gtag },
  doc: Document = document,
): ProblemViewEnv {
  return {
    hasUsableOptIn: () => consent.hasUsableOptIn(),
    onConsentChanged: listener => consent.onConsentChanged(listener),
    getGtag: () => win.gtag,
    observeHead: onChange => {
      if (!doc.head || typeof MutationObserver === 'undefined') return null;
      const observer = new MutationObserver(onChange);
      observer.observe(doc.head, { childList: true });
      return () => observer.disconnect();
    },
  };
}
