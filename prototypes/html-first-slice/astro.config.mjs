import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://fresh-tech.uk',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // Never inline bundled scripts: every executable script stays an external
      // /_astro/ module so the Content-Security-Policy can omit 'unsafe-inline'
      // from script-src. Other assets keep Vite's default inline limit.
      assetsInlineLimit: (filePath) => (filePath.endsWith('.js') ? false : undefined),
    },
  },
});
