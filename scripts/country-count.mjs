#!/usr/bin/env node
/**
 * Keep the Passport denominator equal to the number of countries the cookbook
 * actually covers, in all six languages.
 *
 * The Passport counts countries you have cooked FROM, so "of 11 countries" is
 * a claim about the cookbook, not about you. It shipped saying 91 once. It is
 * written out six times in six scripts, two of which do not use Latin digits,
 * so it is exactly the sort of number that goes stale the moment a recipe from
 * a new country is added — which is why data.test.ts asserts it and why this
 * script exists to fix it.
 *
 *   node scripts/country-count.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { RECIPES } from '../src/data/cookbook.js';

const PATH = 'src/data/pantry-i18n.js';
const count = new Set(RECIPES.map((r) => r.code)).size;

/** Urdu uses extended Arabic-Indic digits, Arabic uses Arabic-Indic. */
const easternArabic = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x06f0 + Number(d)));
const arabicIndic = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));

let text = readFileSync(PATH, 'utf8');
let changed = 0;

text = text.replace(/^(\s*"ofCountries": ")(.*)(",)$/gm, (whole, head, value, tail) => {
  // Replace whichever run of digits the line already has, in whatever script,
  // rather than rebuilding the sentence — the surrounding words differ per
  // language and word order puts the number in a different place in each.
  const next = value
    .replace(/[0-9]+/, String(count))
    .replace(/[۰-۹]+/, easternArabic(count))
    .replace(/[٠-٩]+/, arabicIndic(count));
  if (next !== value) changed += 1;
  return head + next + tail;
});

writeFileSync(PATH, text);
console.log(`cookbook covers ${count} countries; updated ${changed} of 6 translations`);
