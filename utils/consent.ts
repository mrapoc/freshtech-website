/**
 * Cookie consent state (UK GDPR / PECR).
 *
 * Non-essential cookies (Google Analytics 4, Microsoft Clarity) must NOT load
 * until the visitor opts in. The loaders live in index.html behind
 * `window.ftLoadAnalytics()`; this module is the React-side bridge that records
 * the decision and arms / tears down those scripts accordingly.
 *
 * Storage: a single localStorage key. Bump the version suffix to force everyone
 * to re-consent (e.g. when a new cookie category is added).
 */

export const CONSENT_KEY = 'ft-cookie-consent-v1';
export const CONSENT_EVENT = 'ft:consent-changed';
export const OPEN_SETTINGS_EVENT = 'ft:open-cookie-settings';

export interface ConsentState {
  analytics: boolean;
  ts: number;
}

declare global {
  interface Window {
    ftLoadAnalytics?: () => void;
    /** Cancels a pending analytics load. Returns true if the vendor scripts are already on the page. */
    ftCancelAnalytics?: () => boolean;
  }
}

export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.analytics === 'boolean') return parsed as ConsentState;
  } catch {
    /* corrupt value — treat as no decision */
  }
  return null;
}

/** Best-effort removal of GA4 / Clarity cookies when consent is withdrawn. */
function clearAnalyticsCookies(): void {
  if (typeof document === 'undefined') return;
  const existing = document.cookie.split(';').map(c => c.split('=')[0].trim());
  const targets = existing.filter(n =>
    /^_ga|^_gid|^_gat|^_gcl|^_clck|^_clsk|^_cltk|^MUID|^CLID|^ANONCHK|^SM$/i.test(n),
  );
  const host = window.location.hostname;
  const root = host.split('.').slice(-2).join('.');
  const domains = ['', host, `.${host}`, `.${root}`];
  targets.forEach(name => {
    domains.forEach(d => {
      const domainPart = d ? `; domain=${d}` : '';
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`;
    });
  });
}

/**
 * Records the visitor's decision and applies it.
 *
 * Accept arms the loader in index.html, which re-reads stored consent before
 * adding any vendor script. If storage cannot be written, the loader finds no
 * stored consent and nothing loads (fail closed).
 *
 * Reject persists the denial, cancels any pending load and clears vendor
 * cookies. If the vendor scripts are already running, the page is reloaded so
 * they stop. The reloaded page cannot re-arm: either the denial was written,
 * the old opt-in was removed, or storage is unwritable and the loader treats
 * that as no consent. A preference cannot persist without writable storage,
 * but withdrawal on the current page always stops collection.
 */
export function setConsent(analytics: boolean): void {
  if (typeof window === 'undefined') return;
  const state: ConsentState = { analytics, ts: Date.now() };
  let stored = false;
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    stored = true;
  } catch {
    /* storage blocked: analytics cannot be loaded without a stored decision */
  }
  let alreadyLoaded = false;
  if (analytics) {
    if (stored && typeof window.ftLoadAnalytics === 'function') window.ftLoadAnalytics();
  } else {
    if (!stored) {
      try {
        window.localStorage.removeItem(CONSENT_KEY);
      } catch {
        /* cannot clear either */
      }
    }
    if (typeof window.ftCancelAnalytics === 'function') alreadyLoaded = window.ftCancelAnalytics();
    clearAnalyticsCookies();
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  if (alreadyLoaded) window.location.reload();
}

/** Re-open the preferences dialog from anywhere (e.g. a footer link). */
export function openCookieSettings(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}
