/// <reference types="vitest/config" />
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    cssCodeSplit: !standalone,
    // React does not change between deploys; the app does. Its own chunk keeps
    // its own hash, so a deploy that only touched a screen leaves 190 kB of
    // framework sitting in the worker's cache where it already is. Not a
    // first-load saving — the page still fetches both, in parallel, and Vite
    // adds the modulepreload that keeps it from becoming a waterfall.
    rollupOptions: standalone
      ? { output: { inlineDynamicImports: true } }
      : {
          output: {
            manualChunks: (id: string) => {
              if (id.includes('/node_modules/react')) return 'react';
              // The cookbook is the largest thing in the build and the slowest
              // to change: a hundred and fifty recipes of ingredients, method
              // and prose. Screens change every deploy, recipes hardly ever, so
              // giving it its own hash leaves it in the service worker's cache
              // across deploys that only touched the app.
              if (id.includes('/src/data/cookbook') || id.includes('/src/data/nutrition')) {
                return 'cookbook';
              }
              return undefined;
            },
          },
        },
  },
});
