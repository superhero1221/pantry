#!/usr/bin/env node
/**
 * Draw a tile for every dish that has no photograph.
 *
 * Fourteen dishes have real photographs, from Wikimedia Commons, credited by
 * photographer in public/pix/manifest.json. The rest of the cookbook does not,
 * and there is no honest way to conjure one: a generated image that looks like
 * a photograph of food is a picture of a meal that has never existed, shown to
 * someone deciding what to eat tonight.
 *
 * So these are plainly drawings. Flat shapes in the app's own palette, an
 * overhead plate, and an arrangement that varies with the dish but never
 * pretends to be a photograph of it. They are deterministic — the same id
 * always draws the same tile — so the cookbook looks the same on every device
 * and a rebuild produces no diff.
 *
 * SVG rather than webp: a few hundred bytes instead of forty kilobytes, sharp
 * at the 54 px it appears at in the week grid and at the full-width hero on
 * Results, and no rasteriser in the build.
 *
 *   node scripts/make-dish-tiles.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { RECIPES } from '../src/data/cookbook.js';

/**
 * A small deterministic generator. Same id, same tile, forever — which matters
 * because the alternative is every rebuild producing a diff on 140 files.
 */
const seedOf = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

/** The ground the app is already painted on. */
const GROUNDS = ['#f0e4cc', '#eee7db', '#f2e8d6', '#ece2cd'];
const PLATES = ['#faf4e8', '#f6efdf', '#fbf6ec'];

/**
 * Food colour by region. Warm everywhere, because the app is warm everywhere,
 * but a Thai green curry and a Polish beetroot soup should not come out the
 * same colour.
 */
const REGION = {
  IT: ['#c1502e', '#8fa073', '#e0c060', '#a8442b'],
  IN: ['#d17c2f', '#c67139', '#8a9a5b', '#e0a93b'],
  PK: ['#c67139', '#b8532e', '#8a9a5b', '#e0a93b'],
  LK: ['#c67139', '#a8442b', '#7f9163', '#e8b74a'],
  CN: ['#b8532e', '#8a6a45', '#8fa073', '#d99a3c'],
  JP: ['#c1502e', '#8fa073', '#e8ddc4', '#a86b3c'],
  KR: ['#b83f24', '#c67139', '#8fa073', '#e0a93b'],
  TH: ['#7f9163', '#c67139', '#e0c060', '#a8442b'],
  VN: ['#8fa073', '#c67139', '#e8ddc4', '#a8442b'],
  MY: ['#c67139', '#8a6a45', '#e0a93b', '#7f9163'],
  ID: ['#a8562b', '#c67139', '#8a9a5b', '#e0a93b'],
  MX: ['#c1502e', '#8fa073', '#e0c060', '#8a6a45'],
  PE: ['#c67139', '#e0c060', '#8fa073', '#a8442b'],
  BR: ['#8a6a45', '#c67139', '#8fa073', '#e0c060'],
  AR: ['#a8442b', '#8fa073', '#8a6a45', '#c67139'],
  LB: ['#8fa073', '#e0c060', '#c67139', '#ded2b4'],
  SY: ['#8fa073', '#c67139', '#e0c060', '#a8442b'],
  PS: ['#8fa073', '#e0c060', '#c67139', '#ded2b4'],
  IR: ['#c67139', '#8a9a5b', '#e0c060', '#a8442b'],
  MA: ['#c67139', '#e0a93b', '#8fa073', '#a8562b'],
  TN: ['#c1502e', '#e0a93b', '#8fa073', '#8a6a45'],
  EG: ['#c67139', '#8a6a45', '#e0c060', '#8fa073'],
  ET: ['#b8532e', '#c67139', '#8a9a5b', '#e0a93b'],
  NG: ['#c1502e', '#e0a93b', '#8fa073', '#8a6a45'],
  GH: ['#c67139', '#e0a93b', '#8a6a45', '#8fa073'],
  SN: ['#c67139', '#8fa073', '#e0c060', '#a8562b'],
  KE: ['#8a9a5b', '#c67139', '#e0c060', '#8a6a45'],
  GB: ['#c8a15c', '#8fa073', '#a8562b', '#e8ddc4'],
  IE: ['#8fa073', '#c8a15c', '#e8ddc4', '#a8562b'],
  FR: ['#a8562b', '#c8a15c', '#8fa073', '#e8ddc4'],
  ES: ['#c1502e', '#e0a93b', '#8fa073', '#8a6a45'],
  GR: ['#8fa073', '#e8ddc4', '#c1502e', '#c8a15c'],
  TR: ['#c1502e', '#8fa073', '#e0a93b', '#8a6a45'],
  RS: ['#a8562b', '#c8a15c', '#8fa073', '#e8ddc4'],
  US: ['#c67139', '#c8a15c', '#8fa073', '#a8442b'],
  JM: ['#8a9a5b', '#c67139', '#e0a93b', '#a8442b'],
  CU: ['#8a6a45', '#c67139', '#8fa073', '#e0c060'],
};
const FALLBACK = ['#c67139', '#8fa073', '#c8a15c', '#a8562b'];

/**
 * Four ways of arranging a plate. Which one a dish gets is fixed by its id, not
 * by what it is — this is decoration, and pretending it were a diagram of the
 * actual food would be the same lie as a fake photograph in a slower form.
 */
function contents(kind, rand, colours, cx, cy, r) {
  const pick = () => colours[Math.floor(rand() * colours.length)];
  const n = (v) => Math.round(v);
  // Serving is what makes a tile read as food rather than as decoration on an
  // empty plate. The first version left most of the plate bare, and at the
  // 54 px it appears at in the week grid that is indistinguishable from a
  // missing image. Every arrangement now sits on a filled base.
  const out = [
    `<circle cx="${cx}" cy="${cy}" r="${n(r * 0.94)}" fill="${colours[0]}" opacity="0.28"/>`,
  ];

  if (kind === 0) {
    // Strands. Noodles, pasta, anything you twirl. Each one gets its own
    // rotation about the centre — laid out purely by height they came out as
    // even horizontal stripes, which read as a venetian blind rather than food.
    for (let i = 0; i < 20; i++) {
      const y = cy + (i / 19 - 0.5) * r * 1.4 + (rand() * 20 - 10);
      const half = r * (0.55 + rand() * 0.42);
      const spin = rand() * 60 - 30;
      out.push(
        `<path d="M${n(cx - half)} ${n(y)} q ${n(half)} ${n(rand() * 54 - 27)} ${n(half * 2)} 0" fill="none" stroke="${pick()}" stroke-width="${n(11 + rand() * 10)}" stroke-linecap="round" opacity="0.88" transform="rotate(${n(spin)} ${cx} ${cy})"/>`,
      );
    }
  } else if (kind === 1) {
    // Grains and pulses — rice, lentils, couscous. Dense enough to be a pile.
    for (let i = 0; i < 120; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * r * 0.92;
      out.push(
        `<circle cx="${n(cx + Math.cos(a) * rr)}" cy="${n(cy + Math.sin(a) * rr)}" r="${n(9 + rand() * 13)}" fill="${pick()}" opacity="0.85"/>`,
      );
    }
  } else if (kind === 2) {
    // A stew. One soft body with things surfacing in it.
    out.push(`<circle cx="${cx}" cy="${cy}" r="${n(r * 0.9)}" fill="${colours[0]}" opacity="0.92"/>`);
    for (let i = 0; i < 16; i++) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * r * 0.68;
      out.push(
        `<circle cx="${n(cx + Math.cos(a) * rr)}" cy="${n(cy + Math.sin(a) * rr)}" r="${n(14 + rand() * 24)}" fill="${colours[1 + Math.floor(rand() * (colours.length - 1))]}" opacity="0.9"/>`,
      );
    }
  } else {
    // Pieces. Cut things, arranged — tray bakes, grills, tacos, roasts.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + rand() * 0.6;
      const rr = r * (0.14 + rand() * 0.56);
      const w = 66 + rand() * 62;
      const h = 50 + rand() * 46;
      const x = cx + Math.cos(a) * rr - w / 2;
      const y = cy + Math.sin(a) * rr - h / 2;
      out.push(
        `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(12 + rand() * 12)}" fill="${pick()}" opacity="0.88" transform="rotate(${n(rand() * 70 - 35)} ${n(x + w / 2)} ${n(y + h / 2)})"/>`,
      );
    }
  }
  return out.join('');
}

function tile(recipe) {
  const rand = rng(seedOf(recipe.id));
  const colours = REGION[recipe.code] ?? FALLBACK;
  const ground = GROUNDS[Math.floor(rand() * GROUNDS.length)];
  const plate = PLATES[Math.floor(rand() * PLATES.length)];
  const cx = 300;
  const cy = 300;
  const r = 208;

  // A wide viewBox with the plate dead centre, because the same file is
  // cover-cropped to a 54 px square in the week grid and to a 2:1 band on
  // Results. Anything off-centre loses its subject in one of the two.
  // Shepherd's Pie has an apostrophe in it, and an unescaped one silently
  // breaks the file wherever it gets quoted downstream.
  const label = recipe.name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${label}">` +
    `<rect width="600" height="600" fill="${ground}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r + 22}" fill="#e4d8bf" opacity="0.55"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${plate}"/>` +
    `<clipPath id="p"><circle cx="${cx}" cy="${cy}" r="${r - 14}"/></clipPath>` +
    `<g clip-path="url(#p)">${contents(Math.floor(rand() * 4), rand, colours, cx, cy, r - 14)}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#dcd3c4" stroke-width="6"/>` +
    `</svg>`
  );
}

const manifestPath = 'public/pix/manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

let drawn = 0;
let photographed = 0;
const missing = [];
for (const r of RECIPES) {
  // Test the path the recipe actually points at, not a name built from the id:
  // six of the photographed dishes are filed under the photograph's name rather
  // than the recipe's, so `mango_wings` lives at `buffalo_wings_baked.webp`.
  if (r.pic && existsSync(`public/${r.pic}`)) {
    photographed += 1;
    continue;
  }
  if (r.pic && !r.pic.endsWith(`${r.id}.svg`)) missing.push(`${r.id} -> ${r.pic}`);
  const svg = tile(r);
  writeFileSync(`public/pix/${r.id}.svg`, svg);
  manifest[r.id] = {
    licence: 'CC0-1.0',
    author: 'Generated by scripts/make-dish-tiles.mjs',
    note: 'An illustration in the app palette, not a photograph of this dish.',
    img: `${r.id}.svg`,
    bytes: Buffer.byteLength(svg),
  };
  drawn += 1;
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
console.log(`${photographed} photographed, ${drawn} drawn`);
if (missing.length) {
  console.log('drawn over a pic path that pointed at nothing:');
  for (const m of missing) console.log('  ' + m);
}
