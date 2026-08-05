/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
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

/**
 * The copyright notice, in the only place a person who has taken this will
 * actually be looking: the bundle itself.
 *
 * A web app ships its own source. `view-source` and the network tab hand over
 * every line of this to anyone who asks, and no licence file in a repository
 * they never visited will reach them. So the notice travels with the code.
 *
 * Attached in `generateBundle` rather than through rollup's `output.banner`,
 * which is where this started and where it did not work. A banner addon is
 * applied while the chunk is rendered, and Vite minifies in a `renderChunk`
 * hook afterwards with esbuild's `legalComments: 'none'` — which strips a
 * `/*!` bang comment along with everything else, the exact thing the bang is
 * supposed to prevent. The notice went in, the build went green, and the
 * shipped file had nothing in it. Only grepping dist/ found that.
 *
 * `generateBundle` runs after every renderChunk hook in the pipeline, so there
 * is nothing left downstream to eat it. No sourcemap to shift, since this
 * build does not emit any.
 *
 * Entry chunk only. Repeating it on react, cookbook and five language files
 * would be five hundred bytes of the same sentence and would read as noise
 * rather than as a claim.
 */
const NOTICE = `/*! Pantry — pantryglobe.com
 * Copyright © 2026 the Pantry authors. All rights reserved.
 * Proprietary. Not open source. Reading this is not permission to take it.
 * Third-party data, photographs and typefaces remain under their own terms:
 * OpenStreetMap and Open Food Facts (ODbL), dish photographs (CC BY / BY-SA),
 * Caprasimo and Figtree (SIL OFL). The app credits each one on screen.
 * Licensing: privacy@pantryglobe.com
 */`;

/**
 * `<link rel="license" href="/LICENSE">` in index.html has to resolve, and
 * LICENSE lives at the repository root rather than in `public/` — where it
 * belongs, since it governs the repository and not just the site.
 *
 * So the build emits a copy rather than the repository keeping two. Read at
 * build time, which means the served copy cannot drift from the real one: if
 * the file were deleted the build fails here instead of shipping a link to a
 * 404, and a link to a missing licence is worse than no link.
 *
 * Skipped for the standalone build, which is one file handed over by hand and
 * has no origin for an absolute path to resolve against.
 */
const licenceFile = () => ({
  name: 'pantry-licence-file',
  apply: 'build' as const,
  // The notice lands on line 2, not line 1: Vite's own `__vite__mapDeps`
  // helper is injected by a core post plugin, and a core post plugin outranks
  // anything a config can declare — `enforce: 'post'` was tried here and
  // changed nothing. It sits directly above the app's first import, which is
  // where a person reading this file starts anyway.
  generateBundle(_options: unknown, bundle: Record<string, { type: string; isEntry?: boolean; code?: string }>) {
    for (const output of Object.values(bundle)) {
      if (output.type === 'chunk' && output.isEntry && output.code) {
        output.code = NOTICE + '\n' + output.code;
      }
    }

    if (standalone) return;
    // @ts-expect-error — `this` is the rollup plugin context.
    this.emitFile({
      type: 'asset',
      fileName: 'LICENSE',
      source: readFileSync(new URL('./LICENSE', import.meta.url), 'utf8'),
    });
  },
});

export default defineConfig({
  base,
  plugins: [react(), licenceFile()],
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
