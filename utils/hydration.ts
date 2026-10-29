/**
 * Homepage SSR/hydration contract (build-only experiment).
 *
 * The server (scripts/prerender.js via entry-server.tsx) renders the homepage
 * with a fixed viewport width and a fixed timestamp. The client must produce
 * the *same* initial tree, so both sides read from this snapshot during the
 * first render. The serialised snapshot remains available for the lifetime of
 * the document so a Suspense boundary that hydrates later sees the same server
 * values. useSyncExternalStore moves each consumer to live browser values once
 * React has hydrated that consumer.
 *
 * createRoot paths (dev, every other route) never set a snapshot, so they
 * keep reading live values immediately, exactly as before.
 */

export const SSR_MARKER_ATTR = 'data-ft-ssr';
export const SSR_MARKER_VALUE = 'home-v1';
export const SSR_DATE_ATTR = 'data-ft-ssr-date';
export const SSR_WIDTH = 1280;

export interface HydrationSnapshot {
  width: number;
  /** Epoch ms captured at server render time. */
  now: number;
}

let snapshot: HydrationSnapshot | null = null;

export function beginHydration(next: HydrationSnapshot): void {
  snapshot = next;
}

export function getHydrationSnapshot(): HydrationSnapshot | null {
  return snapshot;
}

/** Server renders are isolated sequentially by the prerender build. */
export function endHydration(): void {
  if (typeof window === 'undefined') snapshot = null;
}

/**
 * Reads the marker from the prerendered document. Returns the snapshot when
 * this document carries true SSR homepage markup, otherwise null. The
 * pathname check matters: the SPA fallback can serve dist/index.html for an
 * unknown path, and that document must NOT be hydrated as the homepage.
 */
export function readHydrationSnapshot(root: HTMLElement, pathname: string): HydrationSnapshot | null {
  if (root.getAttribute(SSR_MARKER_ATTR) !== SSR_MARKER_VALUE) return null;
  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (normalised !== '/') return null;
  const now = Date.parse(root.getAttribute(SSR_DATE_ATTR) || '');
  if (!Number.isFinite(now)) return null;
  return { width: SSR_WIDTH, now };
}
