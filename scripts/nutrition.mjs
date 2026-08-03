#!/usr/bin/env node
/**
 * Rewrite every `per` and `micro` block in the cookbook from its ingredient
 * list.
 *
 * These blocks used to be written by hand beside each recipe, and every one of
 * the original fourteen was wrong — understating energy by between seven and
 * sixty-one per cent, always downward, because oil and cheese and coconut milk
 * are exactly what you forget when you total a recipe in your head.
 *
 * Run it after adding or editing a recipe:  node scripts/nutrition.mjs
 * Check without writing:                    node scripts/nutrition.mjs --check
 *
 * `--check` is what CI wants: it exits non-zero if the file on disk disagrees
 * with what the ingredients say, so a hand-edited calorie count cannot survive
 * review.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { RECIPES } from '../src/data/cookbook.js';
import { microRows, perServing, unknownIngredients } from '../src/lib/nutrition.js';

const PATH = 'src/data/cookbook.js';
const check = process.argv.includes('--check');

// The file is written with unicode escapes rather than literal glyphs, so the
// micro rows have to go back the same way or the diff is full of noise.
const esc = (s) => s.replace(/[-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

let text = readFileSync(PATH, 'utf8');
const perBlocks = text.match(/^ {4}per: \{[^}]*\},$/gm) ?? [];
const microBlocks = text.match(/^ {4}micro: \[\n(?: {6}\{[^\n]*\n)+ {4}\],$/gm) ?? [];

if (perBlocks.length !== RECIPES.length || microBlocks.length !== RECIPES.length) {
  console.error(
    `expected one per and one micro block per recipe: ${RECIPES.length} recipes, ` +
      `${perBlocks.length} per, ${microBlocks.length} micro`,
  );
  process.exit(2);
}

const unknown = [];
for (const r of RECIPES) {
  const miss = unknownIngredients(r);
  if (miss.length) unknown.push(`${r.id}: ${miss.join(', ')}`);
}
if (unknown.length) {
  console.error('ingredients with no entry in src/data/nutrition.js:\n  ' + unknown.join('\n  '));
  process.exit(2);
}

// Both arrays are in file order, which is RECIPES order, so they zip.
let i = 0;
const changed = [];
text = text.replace(/^ {4}per: \{[^}]*\},$/gm, () => {
  const r = RECIPES[i++];
  const p = perServing(r);
  const line = `    per: { kcal: ${p.kcal}, protein: ${p.protein}, carb: ${p.carb}, fat: ${p.fat} },`;
  if (p.kcal !== r.per.kcal) {
    const pc = Math.round(((p.kcal - r.per.kcal) / r.per.kcal) * 100);
    changed.push(`${r.id}: ${r.per.kcal} -> ${p.kcal} kcal (${pc > 0 ? '+' : ''}${pc}%)`);
  }
  return line;
});

let j = 0;
text = text.replace(/^ {4}micro: \[\n(?: {6}\{[^\n]*\n)+ {4}\],$/gm, () => {
  const rows = microRows(RECIPES[j++]);
  const body = rows
    .map((m) => `      { label: '${m.label}', amount: '${esc(m.amount)}', pct: ${m.pct}, color: '${m.color}' },`)
    .join('\n');
  return `    micro: [\n${body}\n    ],`;
});

const current = readFileSync(PATH, 'utf8');
if (check) {
  if (text !== current) {
    console.error('cookbook nutrition is stale. Run: node scripts/nutrition.mjs');
    for (const c of changed) console.error('  ' + c);
    process.exit(1);
  }
  console.log(`nutrition is current for all ${RECIPES.length} recipes`);
} else {
  writeFileSync(PATH, text);
  console.log(`rewrote nutrition for ${RECIPES.length} recipes`);
  for (const c of changed) console.log('  ' + c);
}
