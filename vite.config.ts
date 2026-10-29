import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { contentChunksPlugin } from './scripts/content-chunks.mjs';

// Custom plugin to clean up production build HTML
const cleanHtmlPlugin = () => ({
  name: 'clean-html',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    // Remove the source entry point (Vite replaces with bundled version)
    html = html.replace(/<script type="module" src="\/index\.tsx"><\/script>/g, '');

    return html;
  }
});

// Inline the one generated stylesheet before prerendering. The bundle is small
// enough that this removes a render-blocking round trip without selector
// extraction, duplicate font declarations or route-specific FOUC risk.
let isSsrBuild = false;
const inlineBundledCssPlugin = () => ({
  name: 'inline-bundled-css',
  apply: 'build' as const,
  configResolved(config: { build: { ssr?: boolean | string } }) {
    isSsrBuild = Boolean(config.build.ssr);
  },
  closeBundle: () => {
    // The homepage SSR bundle (dist-ssr/) has no index.html to inline into.
    if (isSsrBuild) return;
    const outDir = resolve(__dirname, 'dist');
    const htmlPath = resolve(outDir, 'index.html');
    const html = readFileSync(htmlPath, 'utf-8');

    if (html.includes('data-ft-bundled-css')) {
      throw new Error('Bundled CSS was already inlined');
    }

    const stylesheetPattern = /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+\.css)["'])[^>]*>/gi;
    const bundledLinks = [...html.matchAll(stylesheetPattern)]
      .filter((match) => /^\/assets\/[^/]+\.css$/.test(match[1]));

    if (bundledLinks.length !== 1) {
      throw new Error(`Expected one generated stylesheet link, found ${bundledLinks.length}`);
    }

    const [link, href] = bundledLinks[0];
    const cssPath = resolve(outDir, href.slice(1));
    const localPath = relative(outDir, cssPath);
    if (localPath.startsWith('..') || isAbsolute(localPath)) {
      throw new Error('Generated stylesheet escapes the output directory');
    }
    const css = readFileSync(cssPath, 'utf-8');
    if (Buffer.byteLength(css, 'utf-8') > 200 * 1024) {
      throw new Error('Generated CSS exceeds the reviewed 200 KiB inline limit');
    }
    if (/<\/style/i.test(css)) {
      throw new Error('Generated CSS contains an unsafe </style sequence');
    }

    writeFileSync(htmlPath, html.replace(link, () => `<style data-ft-bundled-css>${css}</style>`));
    console.log('✅ Bundled CSS inlined successfully');
  }
});

export default defineConfig({
  plugins: [contentChunksPlugin(), react(), cleanHtmlPlugin(), inlineBundledCssPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Improve chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // Lucide icons - split into separate chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // Heavy data files
          if (id.includes('data/industryGuides.ts')) {
            return 'industry-guides';
          }
          if (id.includes('data/blogPosts.ts')) {
            return 'blog-content';
          }
        }
      }
    }
  }
});
