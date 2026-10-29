import { useSyncExternalStore } from 'react';

/** Public metric values may be JSON numbers or decimal strings, never coerced booleans. */
export function metricNumber(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value.trim()))) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function formatMinutes(value: unknown, loading = false): string {
  const number = metricNumber(value);
  return number === null ? (loading ? 'Loading…' : 'Unavailable') : `${Number(number.toFixed(1))} min`;
}

/** One deferred request per resource, shared across mounted consumers. No persistent storage. */
export function createDeferredResource<T>(initial: T, fetcher: (signal: AbortSignal) => Promise<T>, delay = 3000) {
  type Snapshot = { data: T; loading: boolean; error: boolean; fetchedAt: string | null };
  const empty: Snapshot = { data: initial, loading: true, error: false, fetchedAt: null };
  let snapshot = empty;
  const listeners = new Set<() => void>();
  let cancel: (() => void) | undefined;
  let expires = 0;
  const notify = () => listeners.forEach(listener => listener());
  const start = () => {
    if (cancel || Date.now() < expires) return;
    snapshot = { ...empty };
    let active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (!active) return;
      timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const data = await fetcher(controller.signal);
        if (active) snapshot = { data, loading: false, error: false, fetchedAt: new Date().toISOString() };
      } catch {
        if (active) snapshot = { ...empty, loading: false, error: true };
      } finally {
        clearTimeout(timeout);
        if (active) {
          expires = Date.now() + (snapshot.error ? 30000 : 300000);
          cancel = undefined;
          notify();
        }
      }
    };
    const schedule = () => {
      timer = setTimeout(() => {
        if (window.requestIdleCallback) idle = window.requestIdleCallback(() => { void run(); }, { timeout: 5000 });
        else void run();
      }, delay);
    };
    cancel = () => {
      active = false;
      window.removeEventListener('load', schedule);
      clearTimeout(timer);
      clearTimeout(timeout);
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      controller.abort();
      cancel = undefined;
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    notify();
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    start();
    return () => {
      listeners.delete(listener);
      if (!listeners.size) cancel?.();
    };
  };
  return () => useSyncExternalStore(subscribe, () => snapshot, () => empty);
}
