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

/* Six files, not one. English is still in pantry-i18n.js; the other five moved
   into their own chunks so that a reader only downloads their own language.
   This script edits them as TEXT, so it had to follow — before, it would have
   rewritten one line, printed "updated 1 of 6" and exited zero. */
const PATHS = [
  'src/data/pantry-i18n.js',
  'src/data/lang/es.ts',
  'src/data/lang/fr.ts',
  'src/data/lang/pl.ts',
  'src/data/lang/ur.ts',
  'src/data/lang/ar.ts',
];
const count = new Set(RECIPES.map((r) => r.code)).size;

/** Urdu uses extended Arabic-Indic digits, Arabic uses Arabic-Indic. */
const easternArabic = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x06f0 + Number(d)));
const arabicIndic = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));

let found = 0;
let changed = 0;

for (const path of PATHS) {
  const text = readFileSync(path, 'utf8');
  const next = text.replace(/^(\s*"?ofCountries"?: ")(.*)(",)$/gm, (whole, head, value, tail) => {
    found += 1;
  // Replace whichever run of digits the line already has, in whatever script,
  // rather than rebuilding the sentence — the surrounding words differ per
  // language and word order puts the number in a different place in each.
    const line = value
      .replace(/[0-9]+/, String(count))
      .replace(/[۰-۹]+/, easternArabic(count))
      .replace(/[٠-٩]+/, arabicIndic(count));
    if (line !== value) changed += 1;
    return head + line + tail;
  });
  if (next !== text) writeFileSync(path, next);
}

/* Counting matches rather than changes: a line already correct is not a
   failure, a line that has gone missing is. Without this the split would fail
   silently and the sentence would drift a language at a time. */
if (found !== 6) {
  throw new Error(`expected six "ofCountries" strings across ${PATHS.length} files, found ${found}`);
}
console.log(`cookbook covers ${count} countries; rewrote ${changed} of ${found} translations`);
