// Recipe invariants, checked mechanically.
//
// Two human audits found ~50 problems in recipes I had written and never
// verified: ingredients listed but never used, variants that swap an ingredient
// out while a step still names it, salt quantities that would ruin a dish,
// dishes that break the calorie contract their own file header states.
//
// Patching those one by one fixes today. A checker that fails the build fixes
// the class — nothing here can be reintroduced without the build saying so.
//
//   node scripts/audit.mjs          list every problem
//   node scripts/audit.mjs --strict exit non-zero if any ERROR remains
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

execSync('npx esbuild scripts/audit-entry.ts --bundle --platform=node --format=cjs --outfile=/tmp/audit-bundle.cjs --log-level=error', { stdio: 'inherit' });
const { RECIPES, NUTRIENTS, applyVariant, nutrition, methodNotes } = require('/tmp/audit-bundle.cjs');

const problems = [];
const add = (level, id, what) => problems.push({ level, id, what });

/** Words in a step that refer to an ingredient, so a stale step can be spotted. */
function mentions(text, ref) {
  const n = NUTRIENTS[ref];
  if (!n) return false;
  // match on the head noun of the ingredient name, which is what a method
  // actually says — "Feta, Greek" is written as "the feta"
  const head = n.name.split(',')[0].toLowerCase().replace(/\s*\(.*\)/, '');
  if (head.length < 4) return false;
  // ANY significant word, not all of them. A method says "the mince", not
  // "the beef mince, 5% fat", and demanding every word flagged 140 ingredients
  // that were used perfectly well.
  const words = head.split(/\s+/).filter((w) => w.length > 3);
  if (!words.length) return false;
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w.replace(/s$/, '').slice(0, 7)));
}

const headWords = (ref) => ((NUTRIENTS[ref]?.name ?? '').split(',')[0].toLowerCase()
  .replace(/\s*\(.*\)/, '').split(/\s+/).filter((w) => w.length > 3));
const shareNoun = (a, b) => headWords(a).some((w) => headWords(b).includes(w));

for (const r of RECIPES) {
  const allText = r.method.map((m) => `${m.text} ${m.tip ?? ''}`).join(' ');

  // 1. every non-optional ingredient should appear in some step
  for (const it of r.items) {
    if (it.optional || it.ref === 'water') continue;
    if (!NUTRIENTS[it.ref]) { add('ERROR', r.id, `item "${it.ref}" is not in the nutrient table`); continue; }
    if (!mentions(allText, it.ref)) add('WARN', r.id, `"${NUTRIENTS[it.ref].name}" is bought but never mentioned in any step`);
  }

  // 2. a variant that removes or replaces an ingredient must not leave a step naming it
  for (const v of r.variants) {
    const notes = methodNotes(r, v.id);
    const deltaSteps = new Set(notes.map((d) => d.step));
    for (const sw of v.swaps) {
      if (!sw.from) continue;
      if (sw.to === sw.from) continue;                       // quantity change only
      if (!r.items.some((i) => i.ref === sw.from)) continue;  // pure addition
      // Swapping chicken thigh for chicken breast does not make "brown the
      // chicken" wrong. Only a swap that crosses to a different ingredient
      // entirely leaves a step naming something no longer in the dish.
      if (sw.to && shareNoun(sw.from, sw.to)) continue;
      for (const st of r.method) {
        if (!mentions(`${st.text} ${st.tip ?? ''}`, sw.from)) continue;
        if (!deltaSteps.has(st.n))
          add('ERROR', `${r.id}/${v.id}`, `swaps out "${sw.from}" but step ${st.n} still names it, with no delta`);
      }
      if (sw.to && !NUTRIENTS[sw.to]) add('ERROR', `${r.id}/${v.id}`, `swaps to "${sw.to}", which is not in the nutrient table`);
    }
    // 3. two deltas on the same step: one of them is invisible
    const seen = new Set();
    for (const d of v.methodDeltas) {
      if (seen.has(d.step)) add('ERROR', `${r.id}/${v.id}`, `two method deltas both target step ${d.step}`);
      seen.add(d.step);
      if (!r.method.some((m) => m.n === d.step)) add('ERROR', `${r.id}/${v.id}`, `delta targets step ${d.step}, which does not exist`);
    }
    // 4. a variant claiming a diet its own ingredients contradict
    for (const tag of v.tags) {
      if (tag === 'pork' || tag === 'alcohol') continue;  // markers, not claims
      const bad = applyVariant(r, v.id).filter((i) => NUTRIENTS[i.ref] && !NUTRIENTS[i.ref].tags.includes(tag));
      if (bad.length) add('ERROR', `${r.id}/${v.id}`, `claims ${tag} but contains ${bad.map((b) => NUTRIENTS[b.ref].name).slice(0, 3).join(', ')}`);
    }
  }

  // 5. the base recipe's own diet claims
  for (const tag of r.tags) {
    if (tag === 'pork' || tag === 'alcohol') continue;
    const bad = r.items.filter((i) => NUTRIENTS[i.ref] && !NUTRIENTS[i.ref].tags.includes(tag));
    if (bad.length) add('ERROR', r.id, `claims ${tag} but contains ${bad.map((b) => NUTRIENTS[b.ref].name).slice(0, 3).join(', ')}`);
  }

  // 6. salt. 6 g a day is the UK reference; a single dinner above it is a fault,
  //    and stock cubes are ~44% salt so they have to be counted too.
  const n = nutrition(r.items, r.servings);
  const saltG = (n.sodium * 2.5) / 1000;
  if (saltG > 6) add('ERROR', r.id, `${saltG.toFixed(1)} g salt per serving — above the whole 6 g daily reference`);
  else if (saltG > 4.5) add('WARN', r.id, `${saltG.toFixed(1)} g salt per serving is very high`);

  // 7. poultry and pork need a stated temperature somewhere, not just a look
  const risky = r.items.some((i) => /chicken|pork|turkey/.test(i.ref));
  if (risky && !/\b(6[0-9]|7[0-9]|8[0-9]) ?C\b|\b1[5-8][0-9] ?F\b/.test(allText))
    add('ERROR', r.id, 'contains poultry but no step states an internal temperature');
  for (const v of r.variants) {
    const items = applyVariant(r, v.id);
    if (!items.some((i) => /chicken|pork|turkey/.test(i.ref))) continue;
    const vText = allText + ' ' + v.methodDeltas.map((d) => d.change).join(' ');
    if (!/\b7[0-9] ?C\b/.test(vText))
      add('ERROR', `${r.id}/${v.id}`, 'variant introduces poultry with no internal temperature stated');
  }

  // 8. portion sanity
  if (n.kcal > 1400) add('WARN', r.id, `${Math.round(n.kcal)} kcal per serving is very large`);
  if (n.kcal < 200) add('WARN', r.id, `${Math.round(n.kcal)} kcal per serving is very small`);

  // 9. a note that contradicts the ref it is attached to
  for (const it of r.items) {
    const note = (it.note ?? '').toLowerCase();
    const nm = (NUTRIENTS[it.ref]?.name ?? '').toLowerCase();
    if (/never tinned|not tinned/.test(note) && /tinned/.test(nm))
      add('ERROR', r.id, `"${it.ref}" note says never tinned, but the ingredient IS the tinned one`);
    if (/dried/.test(note) && /tinned/.test(nm))
      add('ERROR', r.id, `"${it.ref}" note asks for dried but the ingredient is tinned — the nutrition and price are ~3x out`);
  }
}

const errors = problems.filter((p) => p.level === 'ERROR');
const warns = problems.filter((p) => p.level === 'WARN');
for (const p of [...errors, ...warns]) console.log(`${p.level.padEnd(5)} ${p.id.padEnd(34)} ${p.what}`);
console.log(`\n${errors.length} errors, ${warns.length} warnings, across ${RECIPES.length} recipes`);
writeFileSync('/tmp/audit.json', JSON.stringify(problems, null, 1));
if (process.argv.includes('--strict') && errors.length) process.exit(1);
