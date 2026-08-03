/**
 * Rasterises scripts/og-image.svg to public/og.png at exactly 1200x630.
 *
 *   node scripts/make-og-image.mjs
 *
 * Chromium is the rasteriser because it is the one that can actually be had:
 * rsvg-convert, inkscape, imagemagick and resvg are all absent. It is also the
 * renderer whose output matches what the design looks like in the app.
 *
 * Playwright is deliberately not in package.json. This runs about twice a year,
 * and a browser download on every CI install, to rebuild a file that is
 * committed, is a bad trade. Fetch it when you need it:
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *   node scripts/make-og-image.mjs
 *
 * Two things happen on the way in. The woff2 files the app ships are inlined
 * as data URIs, so the render cannot race a font load or quietly fall back to
 * Times. And the pill row is laid out from real measured text, so editing a
 * label in the SVG does not leave a rect the wrong size around it.
 *
 * The PNG is committed. This script is how it is reproduced, not a build step.
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'scripts', 'og-image.svg');
const OUT = path.join(ROOT, 'public', 'og.png');

/* Playwright's pinned build is the happy path. When the browsers directory
   holds a different revision than this version of Playwright expects — which
   is normal in a sandbox that pre-seeded them — fall back to whatever real
   binary is in there rather than failing on a version number. */
function browserPath() {
  const pinned = chromium.executablePath();
  if (existsSync(pinned)) return pinned;
  const dir = process.env.PLAYWRIGHT_BROWSERS_PATH || '';
  if (dir && existsSync(dir)) {
    for (const entry of readdirSync(dir).sort().reverse()) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/headless_shell']) {
        const p = path.join(dir, entry, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  throw new Error('No Chromium found. Run: npx playwright install chromium');
}

const face = (family, weight, file) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(
    path.join(ROOT, 'public', 'fonts', file),
  ).toString('base64')}) format('woff2');}`;

const fonts =
  face('Caprasimo', 400, 'caprasimo-400.woff2') +
  [400, 500, 600, 700, 800].map((w) => face('Figtree', w, 'figtree.woff2')).join('');

const svg = readFileSync(SRC, 'utf8').replace('/* fonts injected here */', fonts);

const browser = await chromium.launch({ executablePath: browserPath(), args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

await page.setContent(`<style>html,body{margin:0;padding:0}</style>${svg}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

/* Lay the pills out from measured text: one row on the same left margin as
   everything else, each rect sized to the label it contains. Reported back so
   a label that has grown too long for the frame is a number on the terminal
   rather than a surprise in a tweet. */
const row = await page.evaluate(() => {
  const g = document.getElementById('pills');
  const y = +g.dataset.y, h = +g.dataset.h, pad = +g.dataset.pad, gap = +g.dataset.gap;
  const pills = [...g.querySelectorAll('.pill')].map((p) => {
    const text = p.querySelector('text');
    return { p, text, w: text.getComputedTextLength() + pad * 2 };
  });
  const total = pills.reduce((n, o) => n + o.w, 0) + gap * (pills.length - 1);
  const left = +g.dataset.x;
  let x = left;
  for (const { p, text, w } of pills) {
    const rect = p.querySelector('rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('rx', h / 2);
    text.setAttribute('x', x + w / 2);
    text.setAttribute('y', y + h / 2 + 9);
    text.setAttribute('text-anchor', 'middle');
    x += w + gap;
  }
  return { total, right: 1200 - (left + total) };
});

if (row.right < 80) console.warn(`! pill row is ${row.total | 0}px wide, leaving ${row.right | 0}px on the right. Shorten a label.`);

await page.locator('svg').screenshot({ path: OUT });
await browser.close();
console.log(`og.png written — pill row ${row.total | 0}px wide, ${row.right | 0}px clear on the right`);
