import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * STANDALONE=1 builds one self-contained file instead of a site: no code
 * splitting, so `scripts/build-standalone.mjs` can inline the lot into a
 * single page that runs from anywhere, offline, with no server.
 */
const standalone = process.env.STANDALONE === '1';

// GitHub Pages serves a project site from /<repo>/, so the build needs to know
// its prefix. The Pages workflow sets it; everywhere else defaults to root.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { host: true },
  define: standalone ? { 'import.meta.env.VITE_STANDALONE': '"1"' } : {},
  build: {
    cssCodeSplit: !standalone,
    rollupOptions: standalone ? { output: { inlineDynamicImports: true } } : {},
  },
});
