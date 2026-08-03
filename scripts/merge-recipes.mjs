#!/usr/bin/env node
/**
 * Fold a batch of written recipes into the cookbook.
 *
 * Takes the JSON produced by the expand-cookbook workflow — batches of recipes
 * plus a reviewer's verdict on each — applies the verdicts, refuses anything
 * that would not survive the test suite, and writes the survivors into
 * src/data/cookbook.js in the format that file is already written in.
 *
 *   node scripts/merge-recipes.mjs <batches.json> [--dry]
 *
 * Nothing here is clever. It is deliberately suspicious: a recipe that reaches
 * the app is one a person might cook and feed to someone with an allergy, so
 * every check below is a thing that is cheaper to catch now than later.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { RECIPES } from '../src/data/cookbook.js';
import { FOODS, UNIT } from '../src/data/nutrition.js';
import { canonical } from '../src/lib/nutrition.js';

const [, , input, ...rest] = process.argv;
const dry = rest.includes('--dry');
if (!input) {
  console.error('usage: node scripts/merge-recipes.mjs <batches.json> [--dry]');
  process.exit(2);
}

const batches = JSON.parse(readFileSync(input, 'utf8'));

const DIFF = { 1: ['Very easy', 'Comfortable'], 2: ['Easy enough'], 3: ['A stretch'], 4: ['A proper project'] };
const TAGS = new Set(['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'halal', 'kosher']);

/**
 * Escape what the eye cannot check.
 *
 * The cookbook keeps accented Latin and typographic punctuation as themselves,
 * because a reader can see that "café" is right. Thai, Arabic, Devanagari and
 * Hangul go in as escapes: nobody reviewing a diff can tell a correct Thai
 * string from one with a broken combining mark, and a mangled one would ship.
 */
const KEEP = new Set([0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x00b7]);
const esc = (s) =>
  [...s]
    .map((ch) => {
      const cp = ch.codePointAt(0);
      if (cp <= 0x24f || KEEP.has(cp)) return ch;
      if (cp > 0xffff) {
        const h = Math.floor((cp - 0x10000) / 0x400) + 0xd800;
        const l = ((cp - 0x10000) % 0x400) + 0xdc00;
        return `\\u${h.toString(16)}\\u${l.toString(16)}`;
      }
      return `\\u${cp.toString(16).padStart(4, '0')}`;
    })
    .join('');

/** Quote the way the file does: single quotes, doubles only when forced. */
const q = (s) => {
  const body = esc(s).replace(/\\(?!u[0-9a-f]{4})/g, '\\\\');
  return body.includes("'") ? `"${body.replace(/"/g, '\\"')}"` : `'${body}'`;
};

const seenId = new Set(RECIPES.map((r) => r.id));
const seenName = new Set(RECIPES.map((r) => r.name.toLowerCase()));
const kept = [];
const rejected = [];
const newFoods = {};
const newUnits = {};

for (const batch of batches) {
  if (!batch) continue;
  Object.assign(newFoods, batch.newFoods || {});
  Object.assign(newUnits, batch.newUnits || {});

  const verdictFor = new Map((batch.verdicts || []).map((v) => [v.id, v]));

  for (const r of batch.recipes || []) {
    const why = [];
    const v = verdictFor.get(r.id);

    if (v && v.verdict === 'drop') why.push(`reviewer dropped it: ${(v.problems || []).join('; ')}`);
    // A reviewer correcting the tags is the common case and is not a rejection.
    if (v && v.verdict === 'fix' && Array.isArray(v.tagsShouldBe)) r.tags = v.tagsShouldBe;

    if (!/^[a-z][a-z0-9_]{2,28}$/.test(r.id)) why.push(`bad id "${r.id}"`);
    if (seenId.has(r.id)) why.push(`duplicate id "${r.id}"`);
    if (seenName.has(String(r.name).toLowerCase())) why.push(`duplicate name "${r.name}"`);
    if (!/^[A-Z]{2}$/.test(r.code || '')) why.push(`bad country code "${r.code}"`);
    if (!(DIFF[r.diff] || []).includes(r.diffLabel)) why.push(`diff ${r.diff} does not match "${r.diffLabel}"`);
    if (!(r.total >= r.active)) why.push(`total ${r.total} is less than active ${r.active}`);
    for (const t of r.tags || []) if (!TAGS.has(t)) why.push(`unknown tag "${t}"`);
    if ((r.tags || []).includes('vegan') && !(r.tags || []).includes('vegetarian')) {
      // Cheap to fix and dangerous to leave: the vegetarian filter is a plain
      // tag lookup, so a vegan dish without the tag is invisible to it.
      r.tags.push('vegetarian');
    }

    // Every ingredient has to be priceable and weighable, or the nutrition card
    // is a guess again and the whole exercise was pointless.
    for (const it of r.items || []) {
      const name = canonical(it.n);
      const known = FOODS[name] || newFoods[name] || newFoods[it.n];
      if (!known) why.push(`no composition for "${it.n}"`);
      const bare = /^[\d.]+(\s+[a-z]+)?$/i.test(String(it.g).trim()) && !/(g|kg|ml|l|tbsp|tsp|dsp)$/i.test(String(it.g).trim());
      if (bare && UNIT[name] === undefined && newUnits[name] === undefined && newUnits[it.n] === undefined) {
        why.push(`"${it.n}" is counted as "${it.g}" but has no unit weight`);
      }
    }

    // The existing suite asserts this, so catch it here where the message is
    // about a recipe rather than about an array index.
    for (const had of r.have || []) {
      if (!(r.items || []).some((i) => i.n.split(',')[0] === had)) {
        why.push(`claims you have "${had}", which it never asks for`);
      }
    }

    if (why.length) rejected.push({ id: r.id, name: r.name, why });
    else {
      seenId.add(r.id);
      seenName.add(String(r.name).toLowerCase());
      kept.push(r);
    }
  }
}

const serialise = (r) => {
  const items = (r.items || [])
    .map((i) => `I(${q(i.g)}, ${q(i.n)}, ${i.s}, ${q(i.src)}${i.opt ? ', 1' : ''})`)
    .reduce((lines, piece) => {
      // Two per line, the way the file already reads.
      if (lines.length && lines[lines.length - 1].count < 2) {
        lines[lines.length - 1].text += ' ' + piece + ',';
        lines[lines.length - 1].count += 1;
      } else lines.push({ text: piece + ',', count: 1 });
      return lines;
    }, [])
    .map((l) => '      ' + l.text)
    .join('\n');

  const method = (r.method || [])
    .map((s) => `      { text: ${q(s.text)}${s.m ? `, m: ${s.m}` : ''}${s.tip ? `, tip: ${q(s.tip)}` : ''} },`)
    .join('\n');

  return `  {
    id: ${q(r.id)}, name: ${q(r.name)}, local: ${q(r.local)}, cuisine: ${q(r.cuisine)}, code: ${q(r.code)},
    pic: ${q(`pix/${r.id}.svg`)}, servings: ${r.servings}, active: ${r.active}, total: ${r.total}, diff: ${r.diff}, diffLabel: ${q(r.diffLabel)},
    restaurant: ${r.restaurant}, tags: [${(r.tags || []).map(q).join(', ')}],
    per: { kcal: 0, protein: 0, carb: 0, fat: 0 },
    micro: [
      { label: 'Fibre', amount: '0.0 g', pct: 0, color: '#8fa073' },
      { label: 'Iron', amount: '0.0 mg', pct: 0, color: '#d67f48' },
      { label: 'Calcium', amount: '0 mg', pct: 0, color: '#8fa073' },
      { label: 'Vitamin B12', amount: '0.0 \\u00b5g', pct: 0, color: '#d67f48' },
      { label: 'Vitamin C', amount: '0 mg', pct: 0, color: '#8fa073' },
      { label: 'Salt', amount: '0.0 g', pct: 0, color: '#c0b6a5' },
    ],
    items: [
${items}
    ],
    have: [${(r.have || []).map(q).join(', ')}],
    keeps: ${!!r.keeps},
    keepTitle: ${q(r.keepTitle)},
    keepBody: ${q(r.keepBody)},
    method: [
${method}
    ],
  },`;
};

console.log(`kept ${kept.length}, rejected ${rejected.length}`);
for (const r of rejected) console.log(`  REJECT ${r.id} (${r.name})\n    - ${r.why.join('\n    - ')}`);
if (dry) process.exit(rejected.length ? 1 : 0);
if (!kept.length) {
  console.error('nothing to merge');
  process.exit(1);
}

// --- new ingredients, into the composition table --------------------------
if (Object.keys(newFoods).length || Object.keys(newUnits).length) {
  let nut = readFileSync('src/data/nutrition.js', 'utf8');
  const foodLines = Object.entries(newFoods)
    .filter(([name]) => !FOODS[name])
    .map(([name, row]) => `  ${/^[A-Za-z][A-Za-z0-9]*$/.test(name) ? name : `'${name}'`}: [${row.join(', ')}],`);
  if (foodLines.length) {
    nut = nut.replace(
      /(\n};\n\n\/\*\*\n \* Weight in grams)/,
      `\n\n  // ---- Added with the cookbook expansion --------------------------------\n${foodLines.join('\n')}$1`,
    );
  }
  const unitLines = Object.entries(newUnits)
    .filter(([name]) => UNIT[name] === undefined)
    .map(([name, g]) => `  ${/^[A-Za-z][A-Za-z0-9]*$/.test(name) ? name : `'${name}'`}: ${g},`);
  if (unitLines.length) {
    nut = nut.replace(/(\n};\n\n\/\*\*\n \* The fraction of the listed weight)/, `\n${unitLines.join('\n')}$1`);
  }
  writeFileSync('src/data/nutrition.js', nut);
  console.log(`added ${foodLines.length} ingredients and ${unitLines.length} unit weights`);
}

// --- the recipes themselves ----------------------------------------------
const cookbook = readFileSync('src/data/cookbook.js', 'utf8');
// The first `];` after the declaration, rather than a named neighbour — what
// follows RECIPES in the file is an implementation detail and has already
// moved once.
const start = cookbook.indexOf('export const RECIPES');
const at = start < 0 ? -1 : cookbook.indexOf('\n];\n', start);
if (at < 0) {
  console.error('could not find the end of RECIPES');
  process.exit(2);
}
const merged = cookbook.slice(0, at) + '\n' + kept.map(serialise).join('\n') + cookbook.slice(at);
writeFileSync('src/data/cookbook.js', merged);
console.log(`wrote ${kept.length} recipes into the cookbook`);
console.log('now run: node scripts/nutrition.mjs && node scripts/make-dish-tiles.mjs && node scripts/country-count.mjs');
