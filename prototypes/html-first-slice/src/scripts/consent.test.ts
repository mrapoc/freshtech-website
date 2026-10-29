// Unit tests for consent.ts. Run with: node --experimental-strip-types --test src/scripts/consent.test.ts
// Uses node:test plus tiny fakes; Node's global EventTarget/CustomEvent stand in for window/document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_EVENT, CONSENT_KEY, CLARITY_SCRIPT_URL, GA_SCRIPT_URL, LOAD_DELAY_MS, OPEN_SETTINGS_EVENT,
  createConsentController, installVendorScripts,
  type ConsentDocument, type ConsentStorage, type ConsentWindow,
} from './consent.ts';

function makeStorage(initial: Record<string, string> = {}, opts: { readOnly?: boolean; throwAll?: boolean } = {}): ConsentStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  const guard = () => { if (opts.throwAll) throw new Error('blocked'); };
  return {
    data,
    getItem: (k) => { guard(); return data.get(k) ?? null; },
    setItem: (k, v) => { guard(); if (opts.readOnly) throw new Error('QuotaExceeded'); data.set(k, v); },
    removeItem: (k) => { guard(); if (opts.readOnly) throw new Error('QuotaExceeded'); data.delete(k); },
  };
}

function makeEnv(storage: ConsentStorage, cookie = '') {
  const cookieWrites: string[] = [];
  const scripts: { async: boolean; src: string }[] = [];
  const docTarget = new EventTarget();
  const document: ConsentDocument = {
    get cookie() { return cookie; },
    set cookie(v: string) { cookieWrites.push(v); },
    head: { appendChild: (n) => scripts.push(n as { async: boolean; src: string }) },
    createElement: () => ({ async: false, src: '' }),
    addEventListener: (t, l, o) => docTarget.addEventListener(t, l, o),
    removeEventListener: (t, l, o) => docTarget.removeEventListener(t, l, o),
  };
  const winTarget = new EventTarget();
  let reloads = 0;
  const window: ConsentWindow = {
    location: { hostname: 'www.example.test', reload: () => { reloads++; } },
    dispatchEvent: (e) => winTarget.dispatchEvent(e),
    addEventListener: (t, l) => winTarget.addEventListener(t, l),
    removeEventListener: (t, l) => winTarget.removeEventListener(t, l),
  };
  const timers: { fn: () => void; ms: number; cleared: boolean }[] = [];
  const loads: number[] = [];
  const controller = createConsentController({
    window, document, storage: () => storage,
    loadVendors: () => loads.push(1),
    now: () => 1234,
    setTimeout: (fn, ms) => { const t = { fn, ms, cleared: false }; timers.push(t); return t; },
    clearTimeout: (h) => { (h as { cleared: boolean }).cleared = true; },
  });
  const fireTimer = () => { const t = timers.find((x) => !x.cleared); t?.fn(); };
  const interact = (type: string) => docTarget.dispatchEvent(new Event(type));
  return { controller, document, window, cookieWrites, scripts, timers, loads, reloads: () => reloads, fireTimer, interact };
}

const optIn = () => JSON.stringify({ analytics: true, ts: 1 });
const optOut = () => JSON.stringify({ analytics: false, ts: 1 });

test('accept stores {analytics, ts}, dispatches event and arms without loading', () => {
  const storage = makeStorage();
  const env = makeEnv(storage);
  const seen: unknown[] = [];
  env.controller.onConsentChanged((s) => seen.push(s));
  env.controller.setConsent(true);
  assert.deepEqual(JSON.parse(storage.data.get(CONSENT_KEY)!), { analytics: true, ts: 1234 });
  assert.deepEqual(seen, [{ analytics: true, ts: 1234 }]);
  assert.equal(env.controller.isArmed(), true);
  assert.equal(env.loads.length, 0);
  assert.equal(env.timers[0].ms, LOAD_DELAY_MS);
});

test('armed loader fires once on first interaction and is idempotent', () => {
  const env = makeEnv(makeStorage({ [CONSENT_KEY]: optIn() }));
  assert.equal(env.controller.autoArm(), true);
  assert.equal(env.controller.armAnalytics(), true);
  assert.equal(env.timers.length, 1);
  env.interact('scroll');
  assert.equal(env.loads.length, 1);
  assert.equal(env.controller.isLoaded(), true);
  assert.equal(env.timers[0].cleared, true);
  env.interact('click');
  env.fireTimer();
  assert.equal(env.loads.length, 1);
  assert.equal(env.controller.armAnalytics(), true);
  assert.equal(env.timers.length, 1);
});

for (const type of ['click', 'touchstart', 'keydown']) {
  test(`loader fires on ${type}`, () => {
    const env = makeEnv(makeStorage({ [CONSENT_KEY]: optIn() }));
    env.controller.autoArm();
    env.interact(type);
    assert.equal(env.loads.length, 1);
  });
}

test('loader fires on timeout without interaction', () => {
  const env = makeEnv(makeStorage({ [CONSENT_KEY]: optIn() }));
  env.controller.autoArm();
  env.fireTimer();
  assert.equal(env.loads.length, 1);
});

test('loader rechecks consent at fire time', () => {
  const storage = makeStorage({ [CONSENT_KEY]: optIn() });
  const env = makeEnv(storage);
  env.controller.autoArm();
  storage.data.set(CONSENT_KEY, optOut());
  env.fireTimer();
  assert.equal(env.loads.length, 0);
  assert.equal(env.controller.isArmed(), false);
  assert.equal(env.controller.isLoaded(), false);
});

test('stored denial, missing and corrupt values never auto-arm', () => {
  for (const value of [optOut(), '{not json', '"string"', JSON.stringify({ analytics: 'yes' })]) {
    const env = makeEnv(makeStorage({ [CONSENT_KEY]: value }));
    assert.equal(env.controller.autoArm(), false, value);
    assert.equal(env.controller.isArmed(), false);
  }
  assert.equal(makeEnv(makeStorage()).controller.autoArm(), false);
  assert.equal(makeEnv(makeStorage()).controller.getConsent(), null);
});

test('read-only storage with an old opt-in fails closed', () => {
  const env = makeEnv(makeStorage({ [CONSENT_KEY]: optIn() }, { readOnly: true }));
  assert.equal(env.controller.hasUsableOptIn(), false);
  assert.equal(env.controller.autoArm(), false);
  assert.equal(env.controller.armAnalytics(), false);
});

test('blocked storage: accept does not arm but still dispatches the event', () => {
  const env = makeEnv(makeStorage({}, { throwAll: true }));
  const seen: unknown[] = [];
  env.controller.onConsentChanged((s) => seen.push(s));
  env.controller.setConsent(true);
  assert.equal(env.controller.isArmed(), false);
  assert.equal(seen.length, 1);
  env.controller.setConsent(false);
  assert.equal(env.reloads(), 0);
});

test('reject cancels a pending load, clears cookies on all domains, no reload', () => {
  const storage = makeStorage({ [CONSENT_KEY]: optIn() });
  const env = makeEnv(storage, '_ga=1; _ga_ABC=2; _clck=3; session=keep; MUID=4');
  env.controller.autoArm();
  env.controller.setConsent(false);
  assert.equal(env.controller.isArmed(), false);
  assert.equal(env.timers[0].cleared, true);
  env.fireTimer();
  env.interact('click');
  assert.equal(env.loads.length, 0);
  assert.deepEqual(JSON.parse(storage.data.get(CONSENT_KEY)!), { analytics: false, ts: 1234 });
  const names = new Set(env.cookieWrites.map((w) => w.split('=')[0]));
  assert.deepEqual([...names].sort(), ['MUID', '_clck', '_ga', '_ga_ABC']);
  const gaWrites = env.cookieWrites.filter((w) => w.startsWith('_ga='));
  assert.equal(gaWrites.length, 4);
  assert.ok(gaWrites.some((w) => !w.includes('domain=')));
  assert.ok(gaWrites.some((w) => w.endsWith('domain=www.example.test')));
  assert.ok(gaWrites.some((w) => w.endsWith('domain=.www.example.test')));
  assert.ok(gaWrites.some((w) => w.endsWith('domain=.example.test')));
  assert.ok(env.cookieWrites.every((w) => w.includes('expires=Thu, 01 Jan 1970')));
  assert.equal(env.reloads(), 0);
});

test('withdraw after vendors loaded reloads the page', () => {
  const env = makeEnv(makeStorage({ [CONSENT_KEY]: optIn() }));
  env.controller.autoArm();
  env.interact('keydown');
  assert.equal(env.controller.isLoaded(), true);
  assert.equal(env.controller.cancelAnalytics(), true);
  env.controller.setConsent(false);
  assert.equal(env.reloads(), 1);
});

test('reject with unwritable storage removes any stale opt-in attempt and stays closed', () => {
  const storage = makeStorage({ [CONSENT_KEY]: optIn() }, { readOnly: true });
  const env = makeEnv(storage);
  env.controller.setConsent(false);
  assert.equal(env.controller.hasUsableOptIn(), false);
  assert.equal(env.controller.autoArm(), false);
});

test('open-settings event round trip and unsubscribe', () => {
  const env = makeEnv(makeStorage());
  let count = 0;
  const off = env.controller.onOpenSettings(() => count++);
  env.controller.openCookieSettings();
  off();
  env.controller.openCookieSettings();
  assert.equal(count, 1);
  let raw = 0;
  env.window.addEventListener(OPEN_SETTINGS_EVENT, () => raw++);
  env.window.addEventListener(CONSENT_EVENT, () => raw++);
  env.controller.openCookieSettings();
  env.controller.setConsent(false);
  assert.equal(raw, 2);
});

test('installVendorScripts inserts async GA4 and Clarity tags with the public IDs', () => {
  const env = makeEnv(makeStorage());
  installVendorScripts(env.window, env.document);
  assert.deepEqual(env.scripts.map((s) => [s.src, s.async]), [[GA_SCRIPT_URL, true], [CLARITY_SCRIPT_URL, true]]);
  assert.equal(GA_SCRIPT_URL, 'https://www.googletagmanager.com/gtag/js?id=G-XB492EFNKW');
  assert.equal(CLARITY_SCRIPT_URL, 'https://www.clarity.ms/tag/urhwe2bbi1');
  assert.equal(env.window.dataLayer?.length, 2);
  assert.equal(Array.isArray(env.window.dataLayer?.[0]), false);
  assert.equal(Object.prototype.toString.call(env.window.dataLayer?.[0]), '[object Arguments]');
  assert.equal((env.window.dataLayer?.[0] as IArguments)[0], 'js');
  assert.equal((env.window.dataLayer?.[1] as IArguments)[0], 'config');
  assert.equal(typeof env.window.gtag, 'function');
  env.window.clarity?.('set', 'x');
  const clarityEntry = env.window.clarity?.q?.[0] as IArguments;
  assert.equal(Array.isArray(clarityEntry), false);
  assert.equal(Object.prototype.toString.call(clarityEntry), '[object Arguments]');
  assert.equal(clarityEntry[0], 'set');
  assert.equal(clarityEntry[1], 'x');
});
