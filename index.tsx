import React, { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { beginHydration, readHydrationSnapshot } from './utils/hydration';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Homepage-only true SSR: dist/index.html carries React-rendered markup plus an
// explicit marker (scripts/prerender.js). Only that document, and only when the
// URL really is "/", is hydrated. Everything else (other routes' page.content()
// snapshots, the SPA fallback, dev) keeps createRoot, which replaces the DOM.
const snapshot = readHydrationSnapshot(rootElement, window.location.pathname);

if (snapshot) {
  beginHydration(snapshot);
  hydrateRoot(
    rootElement,
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
