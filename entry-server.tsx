/**
 * Build-only homepage SSR entry. Built by `vite build --ssr entry-server.tsx`
 * into dist-ssr/ and imported by scripts/prerender.js. It is never shipped to
 * the browser. Only "/" is rendered; every other route stays createRoot.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './App';
import { beginHydration, endHydration, SSR_WIDTH } from './utils/hydration';

export function renderHome(renderedAt: Date): string {
  beginHydration({ width: SSR_WIDTH, now: renderedAt.getTime() });
  try {
    return renderToString(
      <ErrorBoundary>
        <StaticRouter location="/">
          <AppShell />
        </StaticRouter>
      </ErrorBoundary>
    );
  } finally {
    endHydration();
  }
}
