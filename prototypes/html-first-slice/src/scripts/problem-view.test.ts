import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPARISON_LABEL_PREFIX, isProblemSlug, trackProblemView, type ProblemViewEnv } from './problem-view.ts';

// Synthetic environment only: a gtag spy, a fake head observer and a fake
// consent surface. No consent controller, no storage, no vendor, no network.

const EXPECTED = ['event', 'service_view', { event_category: 'engagement', event_label: 'problem_ransomware-recovery' }];

function fakeEnv(initial: { optIn?: boolean; gtagReady?: boolean } = {}) {
  const calls: unknown[][] = [];
  const gtag = (...args: unknown[]) => { calls.push(args); };
  let gtagReady = initial.gtagReady ?? false;
  let optIn = initial.optIn ?? false;
  let headCallback: (() => void) | null = null;
  let listeners: Array<(state: { analytics: boolean }) => void> = [];
  let disconnects = 0;
  let unsubscribes = 0;

  const env: ProblemViewEnv = {
    hasUsableOptIn: () => optIn,
    onConsentChanged: listener => {
      listeners.push(listener);
      return () => { unsubscribes += 1; listeners = listeners.filter(l => l !== listener); };
    },
    getGtag: () => (gtagReady ? gtag : undefined),
    observeHead: onChange => { headCallback = onChange; return () => { disconnects += 1; headCallback = null; }; },
  };

  return {
    env,
    calls,
    setOptIn(value: boolean) { optIn = value; },
    /** Simulates installVendorScripts: gtag defined, then the head observer batch is delivered. */
    installVendor() { gtagReady = true; headCallback?.(); },
    /** Delivers a head mutation batch that did not come from the vendor (e.g. a style tag). */
    unrelatedHeadMutation() { headCallback?.(); },
    notifyConsent(analytics: boolean) { [...listeners].forEach(l => l({ analytics })); },
    get observing() { return headCallback !== null; },
    get subscribed() { return listeners.length > 0; },
    get disconnects() { return disconnects; },
    get unsubscribes() { return unsubscribes; },
  };
}

test('ready opted-in visitor emits the exact event once and tears down', () => {
  const fake = fakeEnv({ optIn: true, gtagReady: true });
  const handle = trackProblemView('ransomware-recovery', fake.env);
  assert.deepEqual(fake.calls, [EXPECTED]);
  assert.equal(handle.emitted(), true);
  assert.equal(fake.observing, false);
  assert.equal(fake.subscribed, false);
  assert.equal(fake.disconnects, 1);
  assert.equal(fake.unsubscribes, 1);
  // Stray notifications after teardown never re-emit.
  fake.notifyConsent(true);
  fake.unrelatedHeadMutation();
  handle.dispose();
  assert.equal(fake.calls.length, 1);
});

test('missing consent never emits even when gtag is present', () => {
  const fake = fakeEnv({ optIn: false, gtagReady: true });
  const handle = trackProblemView('ransomware-recovery', fake.env);
  fake.installVendor();
  fake.unrelatedHeadMutation();
  assert.equal(fake.calls.length, 0);
  assert.equal(handle.emitted(), false);
  assert.equal(fake.subscribed, true, 'keeps listening for a later grant');
});

test('rejected consent never emits', () => {
  const fake = fakeEnv({ optIn: false, gtagReady: true });
  trackProblemView('ransomware-recovery', fake.env);
  fake.notifyConsent(false);
  fake.installVendor();
  assert.equal(fake.calls.length, 0);
});

test('storage-denied opt-in (hasUsableOptIn false) never emits despite an accept notification', () => {
  const fake = fakeEnv({ optIn: false, gtagReady: true });
  trackProblemView('ransomware-recovery', fake.env);
  // The banner dispatched an accept, but the controller could not persist it.
  fake.notifyConsent(true);
  fake.notifyConsent(true);
  fake.installVendor();
  assert.equal(fake.calls.length, 0);
});

test('delayed vendor: waits for gtag via the head observer, then emits once', () => {
  const fake = fakeEnv({ optIn: true, gtagReady: false });
  const handle = trackProblemView('ransomware-recovery', fake.env);
  assert.equal(fake.calls.length, 0);
  fake.unrelatedHeadMutation();
  assert.equal(fake.calls.length, 0);
  fake.installVendor();
  assert.deepEqual(fake.calls, [EXPECTED]);
  assert.equal(handle.emitted(), true);
  assert.equal(fake.observing, false);
  assert.equal(fake.subscribed, false);
  fake.unrelatedHeadMutation();
  assert.equal(fake.calls.length, 1);
});

test('later grant: no consent at start, accept then vendor load emits once', () => {
  const fake = fakeEnv({ optIn: false, gtagReady: false });
  trackProblemView('ransomware-recovery', fake.env);
  fake.setOptIn(true);
  fake.notifyConsent(true);
  assert.equal(fake.calls.length, 0, 'gtag not ready yet');
  fake.installVendor();
  assert.deepEqual(fake.calls, [EXPECTED]);
});

test('later grant with vendor already present emits on the consent notification', () => {
  const fake = fakeEnv({ optIn: false, gtagReady: true });
  trackProblemView('ransomware-recovery', fake.env);
  fake.setOptIn(true);
  fake.notifyConsent(true);
  assert.deepEqual(fake.calls, [EXPECTED]);
  assert.equal(fake.subscribed, false);
});

test('revoked before the vendor arrives never emits', () => {
  const fake = fakeEnv({ optIn: true, gtagReady: false });
  trackProblemView('ransomware-recovery', fake.env);
  fake.setOptIn(false);
  fake.notifyConsent(false);
  fake.installVendor();
  assert.equal(fake.calls.length, 0);
});

test('duplicate consent notifications emit at most once', () => {
  const fake = fakeEnv({ optIn: true, gtagReady: true });
  // Start with gtag hidden so the first emission comes from a notification.
  const fake2 = fakeEnv({ optIn: true, gtagReady: false });
  trackProblemView('ransomware-recovery', fake.env);
  trackProblemView('ransomware-recovery', fake2.env);
  fake.notifyConsent(true);
  fake.notifyConsent(true);
  fake.notifyConsent(true);
  assert.equal(fake.calls.length, 1);
  fake2.installVendor();
  fake2.notifyConsent(true);
  fake2.notifyConsent(true);
  fake2.installVendor();
  assert.equal(fake2.calls.length, 1);
});

test('teardown before emission disconnects, unsubscribes and blocks later emission', () => {
  const fake = fakeEnv({ optIn: true, gtagReady: false });
  const handle = trackProblemView('ransomware-recovery', fake.env);
  assert.equal(fake.observing, true);
  assert.equal(fake.subscribed, true);
  handle.dispose();
  handle.dispose();
  assert.equal(fake.disconnects, 1);
  assert.equal(fake.unsubscribes, 1);
  assert.equal(fake.observing, false);
  assert.equal(fake.subscribed, false);
  fake.installVendor();
  fake.notifyConsent(true);
  assert.equal(fake.calls.length, 0);
  assert.equal(handle.emitted(), false);
});

test('observeHead returning null still emits via the immediate check or a consent change', () => {
  const calls: unknown[][] = [];
  let optIn = false;
  let listener: ((state: { analytics: boolean }) => void) | null = null;
  const env: ProblemViewEnv = {
    hasUsableOptIn: () => optIn,
    onConsentChanged: l => { listener = l; return () => { listener = null; }; },
    getGtag: () => (...args: unknown[]) => { calls.push(args); },
    observeHead: () => null,
  };
  trackProblemView('ransomware-recovery', env);
  assert.equal(calls.length, 0);
  optIn = true;
  listener?.({ analytics: true });
  assert.deepEqual(calls, [EXPECTED]);
  assert.equal(listener, null);
});

test('invalid slugs never emit and never subscribe', () => {
  const bad: unknown[] = ['', 'Ransomware', 'a_b', '../x', '-lead', 'trail-', 'a--b', 'a b', 'a/b', 'x'.repeat(101), undefined, null, 42];
  for (const slug of bad) {
    assert.equal(isProblemSlug(slug), false, `expected invalid: ${String(slug)}`);
    const fake = fakeEnv({ optIn: true, gtagReady: true });
    const handle = trackProblemView(slug, fake.env);
    fake.installVendor();
    fake.notifyConsent(true);
    assert.equal(fake.calls.length, 0);
    assert.equal(fake.observing, false);
    assert.equal(fake.subscribed, false);
    assert.equal(handle.emitted(), false);
    handle.dispose();
  }
  assert.equal(isProblemSlug('ransomware-recovery'), true);
  assert.equal(isProblemSlug('slow-wifi-2'), true);
});

test('comparison pages emit the same event with the comparison_ label', () => {
  const fake = fakeEnv({ optIn: true, gtagReady: true });
  trackProblemView('break-fix-vs-managed-it', fake.env, COMPARISON_LABEL_PREFIX);
  assert.deepEqual(fake.calls, [['event', 'service_view', { event_category: 'engagement', event_label: 'comparison_break-fix-vs-managed-it' }]]);
});
