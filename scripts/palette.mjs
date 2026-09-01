#!/usr/bin/env node
/**
 * The brighter palette, as a mapping from the old earth ramp to the new one,
 * with the contrast maths done rather than eyeballed.
 *
 * The old palette was the Organic design handoff: warm, low-saturation, every
 * ground a shade of beige and every accent muted. Legible, calm, and — the
 * verdict that started this — gloomy. Nothing popped, and a food app whose
 * photographs are washed out is working against its own appetite appeal.
 *
 * What changes: grounds lift towards white, accents gain chroma, the greens
 * stop being olive. What does not change: the roles. Every old colour maps to
 * exactly one new colour playing the same part, so this is a find-and-replace
 * that cannot reorganise the design by accident.
 *
 * Run `node scripts/palette.mjs` to check contrast, `--write` to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

export const MAP = {
  /* Grounds. The single biggest lever: a near-white page reads bright before
     a single accent has been touched. */
  '#efe3cd': '#fdf0e2', '#e6d8bd': '#f9e6d2', '#f7eeda': '#fffaf4', '#f5ead8': '#fffaf3',
  '#f9f4ed': '#ffffff', '#f2ece2': '#fdf5ec', '#f2ece1': '#fdf5ec', '#e6dcc9': '#f6e7d5',
  '#eee7db': '#fdf0e3', '#ebddc5': '#ffe9d2', '#e2d8c6': '#f4e4d2', '#dcc9a6': '#f7dcb4',
  '#dcd3c4': '#efdcc8',
  /* Ink. Kept dark; a brighter ground can carry more contrast, not less. */
  '#201e1d': '#1b1714', '#2e2b25': '#241e18', '#474238': '#3b3229', '#645c50': '#6a5c4c',
  '#7a7263': '#7d6d5b', '#82796a': '#847462', '#a19786': '#96866f', '#c0b6a5': '#cbb79f',
  /* Orange. The brand colour, sharpened from terracotta to something that
     looks like heat. 3.50:1 with white — enough for the 19px bold buttons.
     Anything smaller uses the 700. */
  '#fff2eb': '#fff4ea', '#ffe1d0': '#ffe4cd', '#ffc6a5': '#ffc79b', '#f6a06b': '#ff9d4f',
  '#d67f48': '#fb7c2b', '#c67139': '#e85d04', '#b2622d': '#c04a03', '#8c491a': '#a83f06',
  '#643312': '#7d2f04', '#402310': '#571f02',
  /* Green. Was olive; now a fresh herb green. */
  '#f0fae1': '#f1fde0', '#e1eecc': '#e2f8c6', '#ccdbb2': '#cdf0a4', '#aebf92': '#a8dc78',
  '#8fa073': '#7cc24a', '#7a8a5e': '#5fa62c', '#728157': '#4f9021', '#56633f': '#3d7213',
  '#3d472b': '#2c5410',
};

const srgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
};
const lum = (h) => { const [r, g, b] = srgb(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Pairs the app actually renders, with the WCAG AA ratio each must meet. */
const PAIRS = [
  ['body text on a card', '#474238', '#f9f4ed', 4.5],
  ['body text on the shell', '#474238', '#f5ead8', 4.5],
  ['muted text on a card', '#645c50', '#f9f4ed', 4.5],
  ['muted text on the shell', '#645c50', '#f5ead8', 4.5],
  ['muted text on the warm surface', '#645c50', '#ebddc5', 4.5],
  ['muted text on the hover tint', '#645c50', '#eee7db', 4.5],
  ['label grey on a card', '#a19786', '#f9f4ed', 3],
  ['near-black on the shell', '#201e1d', '#f5ead8', 4.5],
  ['white on the brand button', '#ffffff', '#c67139', 3],
  ['white on the button hover', '#ffffff', '#b2622d', 3],
  ['white on the deep orange button', '#ffffff', '#8c491a', 4.5],
  ['link orange on a card', '#8c491a', '#f9f4ed', 4.5],
  ['link orange on the pale peach panel', '#8c491a', '#fff2eb', 4.5],
  ['heading on the pale peach panel', '#643312', '#fff2eb', 4.5],
  ['text on the green panel', '#3d472b', '#e1eecc', 4.5],
  ['secondary on the green panel', '#56633f', '#e1eecc', 4.5],
  ['brand orange on the shell', '#c67139', '#f5ead8', 3],
];
const NEW = (h) => MAP[h.toLowerCase()] ?? h;
let failing = 0;
console.log('pair'.padEnd(38), 'before'.padStart(7), 'after'.padStart(7), '  need   verdict');
for (const [name, fg, bg, need] of PAIRS) {
  const before = ratio(fg, bg), after = ratio(NEW(fg), NEW(bg));
  const ok = after >= need; if (!ok) failing++;
  console.log(name.padEnd(38), before.toFixed(2).padStart(7), after.toFixed(2).padStart(7), String(need).padStart(6), ok ? '  pass' : '  FAIL');
}
console.log(`\n${PAIRS.length} pairs — ${failing} failing AA.`);
if (!process.argv.includes('--write')) { console.log('Dry run. Pass --write to apply.'); process.exit(failing ? 1 : 0); }
if (failing) { console.error('Refusing to write a palette that fails AA.'); process.exit(1); }

/* Placeholder pass so a new value that equals another old value cannot be
   rewritten twice. .js is included: MICRO_COLOUR in data/nutrition.js is the
   source the cookbook's 460 micro-bar colours are generated from. */
const FILES = execSync("grep -rlE '#[0-9a-fA-F]{6}' src index.html public/manifest.webmanifest --include='*.ts' --include='*.tsx' --include='*.css' --include='*.html' --include='*.webmanifest' --include='nutrition.js'").toString().trim().split('\n');
const keys = Object.keys(MAP); let changed = 0;
for (const file of FILES) {
  const before = readFileSync(file, 'utf8'); let text = before;
  keys.forEach((old, i) => { text = text.split(old).join(`@@${i}@@`).split(old.toUpperCase()).join(`@@${i}@@`); });
  keys.forEach((old, i) => { text = text.split(`@@${i}@@`).join(MAP[old]); });
  if (text !== before) { writeFileSync(file, text); changed++; }
}
console.log(`Applied to ${changed} files. Now run: node scripts/nutrition.mjs  (regenerates the cookbook's micro-bar colours from MICRO_COLOUR).`);
