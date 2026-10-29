export const BUNDLED_MARKER: 'data-ft-bundled-css';
export const CRITICAL_MARKER: 'data-ft-critical-css';
export const HOME_CANONICAL: 'https://fresh-tech.uk/';
export const SSR_MARKER_VALUE: 'home-v1';

export interface BeastiesLogger {
  trace(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
export interface BeastiesLike {
  process(html: string): Promise<string>;
}
export interface BeastiesConstructor {
  new (options: { logger: BeastiesLogger } & Record<string, unknown>): BeastiesLike;
}
export interface HomepageCriticalCssOptions {
  /** Test seam; defaults to the `beasties` package default export. */
  Beasties?: BeastiesConstructor;
}

/**
 * Replaces the single inlined bundle in the final prerendered homepage with a
 * critical subset plus an async stylesheet link and noscript fallback.
 * Throws instead of returning partial output on any validation failure or
 * Beasties warning. Never touches the filesystem or network.
 */
export function optimiseHomepageCss(html: string, stylesheetHref: string, options?: HomepageCriticalCssOptions): Promise<string>;
