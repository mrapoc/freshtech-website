/**
 * Framework-neutral cookie consent + analytics loader for the HTML-first prototype.
 *
 * Mirrors the audited production contract split across `utils/consent.ts`
 * (React bridge) and the inline loader in `index.html`, folded into one module:
 *
 * - Explicit opt-in only. Nothing loads until `{ analytics: true }` is stored
 *   under CONSENT_KEY AND storage proves writable (probe write). Unreadable,
 *   corrupt or unwritable storage fails closed.
 * - Accept arms an idempotent delayed loader that fires on first click, scroll,
 *   touchstart or keydown, or after LOAD_DELAY_MS, and re-reads consent at fire time.
 * - Reject/withdraw cancels a pending load, clears known GA4/Clarity cookies on
 *   the host and Fresh Tech's two-label root domain, dispatches CONSENT_EVENT and reloads
 *   only if vendor scripts had already been inserted.
 * - Returning visitors with a stored opt-in may auto-arm via `autoArm()`; a stored
 *   denial never arms.
 *
 * Integration (done by the layout owner, not here): create one controller at
 * startup, call `autoArm()`, wire banner buttons to `setConsent(true|false)` and
 * footer links to `openCookieSettings()`. All browser globals are injectable so
 * the module is unit-testable in Node and vendor insertion is mockable.
 */

export const CONSENT_KEY = 'ft-cookie-consent-v1';
export const CONSENT_EVENT = 'ft:consent-changed';
export const OPEN_SETTINGS_EVENT = 'ft:open-cookie-settings';
export const GA_ID = 'G-XB492EFNKW';
export const CLARITY_ID = 'urhwe2bbi1';
export const GA_SCRIPT_URL = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
export const CLARITY_SCRIPT_URL = `https://www.clarity.ms/tag/${CLARITY_ID}`;
export const LOAD_DELAY_MS = 3000;
export const INTERACTION_EVENTS = ['click', 'scroll', 'touchstart', 'keydown'] as const;
/** Cookie names GA4 and Clarity are known to set (same pattern as utils/consent.ts). */
export const VENDOR_COOKIE_PATTERN = /^_ga|^_gid|^_gat|^_gcl|^_clck|^_clsk|^_cltk|^MUID|^CLID|^ANONCHK|^SM$/i;

export interface ConsentState {
  analytics: boolean;
  ts: number;
}

/** Minimal storage surface; `window.localStorage` satisfies it. Any method may throw. */
export interface ConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Subset of `Document` the module touches; real documents satisfy it structurally. */
export interface ConsentDocument {
  cookie: string;
  head: { appendChild(node: object): unknown } | null;
  createElement(tagName: 'script'): { async: boolean; src: string };
  addEventListener(type: string, listener: () => void, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: () => void, options?: EventListenerOptions): void;
}

/** Subset of `Window` the module touches. Vendor globals are attached by the default loader. */
export interface ConsentWindow {
  location: { hostname: string; reload(): void };
  dispatchEvent(event: Event): boolean;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
}

export interface ConsentControllerOptions {
  window?: ConsentWindow;
  document?: ConsentDocument;
  /** Getter, because merely touching `localStorage` can throw when blocked. */
  storage?: () => ConsentStorage;
  /** Replaces the real GA4 + Clarity script insertion (tests pass a spy). */
  loadVendors?: (window: ConsentWindow, document: ConsentDocument) => void;
  now?: () => number;
  delayMs?: number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
}

export interface ConsentController {
  /** Stored decision, or null when absent, corrupt or unreadable. */
  getConsent(): ConsentState | null;
  /** True only when an opt-in is stored AND storage is writable (probe). */
  hasUsableOptIn(): boolean;
  /** Records and applies a decision. Accept arms; reject cancels, clears cookies, reloads if loaded. */
  setConsent(analytics: boolean): void;
  /** Arms the delayed loader if consent is usable. Idempotent. Returns true when armed or already loaded. */
  armAnalytics(): boolean;
  /** Cancels a pending load. Returns true when vendor scripts are already on the page. */
  cancelAnalytics(): boolean;
  /** Arms only for a returning visitor with a usable stored opt-in. */
  autoArm(): boolean;
  openCookieSettings(): void;
  onConsentChanged(listener: (state: ConsentState) => void): () => void;
  onOpenSettings(listener: () => void): () => void;
  isArmed(): boolean;
  isLoaded(): boolean;
}

/** Production vendor insertion: same IDs, URLs and async flags as index.html. */
export function installVendorScripts(win: ConsentWindow, doc: ConsentDocument): void {
  const ga = doc.createElement('script');
  ga.async = true;
  ga.src = GA_SCRIPT_URL;
  doc.head?.appendChild(ga);
  win.dataLayer = win.dataLayer || [];
  const dataLayer = win.dataLayer;
  win.gtag = function gtag(..._args: unknown[]) {
    // Match Google's bootstrap exactly: gtag.js consumes Arguments objects.
    dataLayer.push(arguments);
  };
  win.gtag('js', new Date());
  win.gtag('config', GA_ID);

  if (!win.clarity) {
    let clarity: NonNullable<ConsentWindow['clarity']>;
    clarity = function clarityLoader(..._args: unknown[]) {
      // Match Clarity's bootstrap queue rather than assuming arrays are interchangeable.
      (clarity.q = clarity.q || []).push(arguments);
    };
    win.clarity = clarity;
  }
  const clarityScript = doc.createElement('script');
  clarityScript.async = true;
  clarityScript.src = CLARITY_SCRIPT_URL;
  doc.head?.appendChild(clarityScript);
}

/**
 * Best-effort expiry for the current fresh-tech.uk hostname shape.
 * The two-label root calculation is intentionally site-specific, not a public-suffix parser.
 */
export function clearVendorCookies(win: ConsentWindow, doc: ConsentDocument): string[] {
  const names = doc.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((n) => VENDOR_COOKIE_PATTERN.test(n));
  const host = win.location.hostname;
  const root = host.split('.').slice(-2).join('.');
  const domains = [...new Set(['', host, `.${host}`, `.${root}`])];
  names.forEach((name) => {
    domains.forEach((d) => {
      doc.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`;
    });
  });
  return names;
}

export function createConsentController(options: ConsentControllerOptions = {}): ConsentController {
  const win = options.window ?? (globalThis as unknown as { window: ConsentWindow }).window;
  const doc = options.document ?? (globalThis as unknown as { document: ConsentDocument }).document;
  const storage = options.storage ?? (() => (globalThis as unknown as { localStorage: ConsentStorage }).localStorage);
  const loadVendors = options.loadVendors ?? installVendorScripts;
  const now = options.now ?? (() => Date.now());
  const delayMs = options.delayMs ?? LOAD_DELAY_MS;
  const schedule = options.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const unschedule = options.clearTimeout ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));

  let loaded = false;
  let disarm: (() => void) | null = null;

  function getConsent(): ConsentState | null {
    try {
      const raw = storage().getItem(CONSENT_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof (parsed as ConsentState).analytics === 'boolean') {
        return parsed as ConsentState;
      }
    } catch {
      /* blocked or corrupt: no decision */
    }
    return null;
  }

  function hasUsableOptIn(): boolean {
    if (getConsent()?.analytics !== true) return false;
    try {
      const s = storage();
      s.setItem(`${CONSENT_KEY}:probe`, '1');
      s.removeItem(`${CONSENT_KEY}:probe`);
      return true;
    } catch {
      return false;
    }
  }

  function armAnalytics(): boolean {
    if (loaded) return true;
    if (disarm) return true;
    if (!hasUsableOptIn()) return false;
    const fire = () => {
      cleanup();
      if (!hasUsableOptIn()) return;
      loaded = true;
      loadVendors(win, doc);
    };
    const timer = schedule(fire, delayMs);
    const cleanup = () => {
      unschedule(timer);
      INTERACTION_EVENTS.forEach((e) => doc.removeEventListener(e, fire, { capture: true }));
      disarm = null;
    };
    INTERACTION_EVENTS.forEach((e) => doc.addEventListener(e, fire, { passive: true, capture: true }));
    disarm = cleanup;
    return true;
  }

  function cancelAnalytics(): boolean {
    disarm?.();
    return loaded;
  }

  function setConsent(analytics: boolean): void {
    const state: ConsentState = { analytics, ts: now() };
    let stored = false;
    try {
      storage().setItem(CONSENT_KEY, JSON.stringify(state));
      stored = true;
    } catch {
      /* storage blocked: an opt-in that cannot be recorded never arms */
    }
    let alreadyLoaded = false;
    if (analytics) {
      if (stored) armAnalytics();
    } else {
      if (!stored) {
        try {
          storage().removeItem(CONSENT_KEY);
        } catch {
          /* cannot clear either; loader treats unwritable storage as no consent */
        }
      }
      alreadyLoaded = cancelAnalytics();
      clearVendorCookies(win, doc);
    }
    win.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
    if (alreadyLoaded) win.location.reload();
  }

  return {
    getConsent,
    hasUsableOptIn,
    setConsent,
    armAnalytics,
    cancelAnalytics,
    autoArm: () => (hasUsableOptIn() ? armAnalytics() : false),
    openCookieSettings: () => {
      win.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
    },
    onConsentChanged: (listener) => {
      const handler = (event: Event) => listener((event as CustomEvent<ConsentState>).detail);
      win.addEventListener(CONSENT_EVENT, handler);
      return () => win.removeEventListener(CONSENT_EVENT, handler);
    },
    onOpenSettings: (listener) => {
      const handler = () => listener();
      win.addEventListener(OPEN_SETTINGS_EVENT, handler);
      return () => win.removeEventListener(OPEN_SETTINGS_EVENT, handler);
    },
    isArmed: () => disarm !== null,
    isLoaded: () => loaded,
  };
}
