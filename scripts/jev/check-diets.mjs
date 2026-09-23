/**
 * Check A — diets. A safety second opinion on every diet claim the app makes.
 *
 * For each of the 153 recipes, one request carrying one yes/no question per
 * diet the app offers. The app's answer is meetsDiet() itself, imported, not
 * re-implemented. Jev is asked the same question in words, phrased to mean
 * exactly what the app means by each diet (see DEFS below and the comments in
 * src/lib/diets.ts and src/lib/diet-audit.js), so a disagreement is a real
 * disagreement and not two definitions talking past each other.
 *
 * The expensive mistake is the app saying a dish is safe when it is not, so
 * that case sorts first.
 */
import { DIETS, RECIPES, breaksDietBecause, DERIVED, meetsDiet } from './app.mjs';
import { MOCK_BANNER, esc, noul, pct, r3 } from './lib.mjs';

export const name = 'diets';

/**
 * Each diet in the app's own terms.
 *
 * Halal and kosher here mean what the app's tags mean: nothing on the
 * shopping list is forbidden, assuming meat is bought from the appropriate
 * butcher. The app cannot see slaughter method and does not claim to. Nut
 * free follows the app's deliberately cautious list: coconut and tahini count;
 * nutmeg, butternut squash and butter beans do not. Gluten free follows the
 * app's audit list, which counts ordinary soy sauce, stock cubes and miso.
 * Vinegar is not alcohol (nopork.test.ts says why).
 */
export const DEFS = {
  vegan: {
    q: 'Is this recipe vegan as written — no meat, poultry, fish, seafood, eggs, dairy (milk, butter, ghee, cream, cheese, yoghurt, paneer), honey, gelatin, or animal-derived sauce or stock (fish sauce, oyster sauce, meat or chicken stock)?',
    t: 'Every ingredient is plant-based, as it would normally be bought.',
    f: 'At least one ingredient is, or is normally made from, an animal product.',
  },
  vegetarian: {
    q: 'Is this recipe vegetarian as written — no meat, poultry, fish, seafood, gelatin, or sauce or stock made from them (fish sauce, oyster sauce, anchovy, meat or chicken stock)? Eggs, dairy and honey are allowed.',
    t: 'No ingredient is, or is normally made from, meat, poultry, fish or seafood.',
    f: 'At least one ingredient is, or is normally made from, meat, poultry, fish or seafood.',
  },
  halal: {
    q: 'Can this recipe be cooked halal exactly as written — no pork or pork product (bacon, ham, lard, pork sausages, pork gelatin) and no alcohol (wine, beer, mirin, sake, spirits; vinegar is fine)? Assume any beef, lamb or chicken is bought from a halal butcher.',
    t: 'Nothing on the ingredient list is forbidden under halal rules, given halal-slaughtered meat.',
    f: 'At least one ingredient is pork, a pork product, or alcohol, or is normally made with them.',
  },
  kosher: {
    q: 'Can this recipe be cooked kosher exactly as written — no pork or pork product, no shellfish or other non-kosher seafood (prawns, shrimp, squid, mussels, clams, crab, lobster), and no meat or poultry cooked together with dairy in the same dish? Assume meat is bought from a kosher butcher; fish with fins and scales is fine.',
    t: 'Nothing on the list is forbidden and meat is not combined with dairy.',
    f: 'It uses pork, shellfish or non-kosher seafood, or combines meat or poultry with dairy.',
  },
  gluten_free: {
    q: 'Is this recipe gluten free as written — no wheat, barley, rye or spelt, and nothing normally made from them (pasta, bread, flour, couscous, bulgur, semolina, wheat or egg noodles, pastry, breadcrumbs, tortillas, ordinary soy sauce, stock cubes, miso, beer)? Rice noodles, rice flour, gram flour, cornflour, corn tortillas, buckwheat and polenta are fine.',
    t: 'No ingredient contains gluten as it would normally be bought.',
    f: 'At least one ingredient contains, or is normally made with, gluten.',
  },
  dairy_free: {
    q: 'Is this recipe dairy free as written — no milk from animals, cream, butter, ghee, cheese, yoghurt, paneer, crème fraîche, whey or casein? Coconut milk, plant milks, butter beans, peanut butter and eggs are NOT dairy.',
    t: 'No ingredient is, or is normally made from, animal milk.',
    f: 'At least one ingredient is, or is normally made from, animal milk.',
  },
  nut_free: {
    q: 'Is this recipe nut free under a cautious allergy rule — no peanuts, no tree nuts (almond, cashew, pistachio, walnut, pecan, hazelnut, macadamia, brazil, pine nut), no coconut in any form, no nut butter, praline, marzipan or tahini? Nutmeg, butternut squash, water chestnut and butter beans are NOT nuts.',
    t: 'No ingredient is a nut, coconut, tahini, or made from them.',
    f: 'At least one ingredient is a nut, coconut, tahini, or made from them.',
  },
  no_pork: {
    q: 'Is this recipe free of pork as written — no ingredient is, or would normally be bought as, pork or a pork product (pork, bacon, ham, gammon, lard, pancetta, chorizo, salami, prosciutto, ordinary pork sausages, pork gelatin)?',
    t: 'No ingredient is, or would normally be bought as, pork.',
    f: 'At least one ingredient is, or would normally be bought as, pork.',
  },
  no_alcohol: {
    q: 'Is this recipe free of alcohol as written — no wine, beer, cider, spirits, sherry, mirin, sake, rice or cooking wine, as an ingredient or in the method? Vinegar does not count as alcohol.',
    t: 'Nothing alcoholic is added at any point.',
    f: 'An alcoholic drink or cooking alcohol is added somewhere.',
  },
};

/** What Jev reads about a recipe. Full item strings; the method, shortened. */
export function stateOf(r) {
  return {
    name: r.name,
    cuisine: r.cuisine,
    ingredients: r.items.map((i) => `${i.g} ${i.n}${i.opt ? ' (optional)' : ''}`),
    method_summary: r.method.map((s, i) => `${i + 1}. ${s.text.length > 160 ? s.text.slice(0, 157) + '...' : s.text}`),
  };
}

export async function prepare({ limit }) {
  const missing = DIETS.map((d) => d.id).filter((d) => !DEFS[d]);
  if (missing.length) throw new Error(`diets offered by the app with no definition here: ${missing.join(', ')} — add them to DEFS`);
  const recipes = limit ? RECIPES.slice(0, limit) : RECIPES;
  const calls = recipes.map((r) => ({
    id: r.id,
    state: stateOf(r),
    questions: Object.fromEntries(
      DIETS.map((d) => [d.id, noul(DEFS[d.id].q, { true: DEFS[d.id].t, false: DEFS[d.id].f })]),
    ),
    meta: { app: Object.fromEntries(DIETS.map((d) => [d.id, meetsDiet(r, d.id)])) },
  }));
  return { calls, notes: [`${recipes.length} of ${RECIPES.length} recipes x ${DIETS.length} diets`] };
}

const SEVERITY = {
  APP_SAYS_SAFE_JEV_DISAGREES: 0,
  APP_SAYS_UNSAFE_JEV_DISAGREES: 1,
  UNSURE: 2,
  ERROR: 3,
  AGREE: 4,
};

export function classify(appMeets, p) {
  if (p == null) return 'ERROR';
  if (appMeets && p < 0.2) return 'APP_SAYS_SAFE_JEV_DISAGREES';
  if (!appMeets && p > 0.8) return 'APP_SAYS_UNSAFE_JEV_DISAGREES';
  if (p >= 0.2 && p <= 0.8) return 'UNSURE';
  return 'AGREE';
}

export function analyse(prep, results, { mock }) {
  const rows = [];
  prep.calls.forEach((c, i) => {
    const res = results[i];
    const r = RECIPES.find((x) => x.id === c.id);
    for (const d of DIETS) {
      const app = c.meta.app[d.id];
      const a = res?.answers?.[d.id];
      const p = a?.ok ? a.value : null;
      rows.push({
        recipe: c.id,
        name: r.name,
        diet: d.id,
        app_meets: app,
        how_app_decides: DERIVED.includes(d.id) ? 'ingredient pattern' : 'hand-set tag',
        jev_noul: p,
        verdict: res?.skipped ? 'SKIPPED' : classify(app, p),
        error: res?.skipped ? res.reason : res?.error || a?.problem || null,
      });
    }
  });

  const counts = {};
  for (const x of rows) counts[x.verdict] = (counts[x.verdict] || 0) + 1;
  const perDiet = DIETS.map((d) => {
    const ds = rows.filter((x) => x.diet === d.id);
    const n = (v) => ds.filter((x) => x.verdict === v).length;
    return { diet: d.id, total: ds.length, agree: n('AGREE'), safe_disagree: n('APP_SAYS_SAFE_JEV_DISAGREES'), unsafe_disagree: n('APP_SAYS_UNSAFE_JEV_DISAGREES'), unsure: n('UNSURE'), error: n('ERROR') + n('SKIPPED') };
  });
  const flagged = rows
    .filter((x) => x.verdict !== 'AGREE')
    .sort(
      (a, b) =>
        (SEVERITY[a.verdict] ?? 9) - (SEVERITY[b.verdict] ?? 9) ||
        // Worst first within a class: the most confident disagreement.
        (a.verdict === 'APP_SAYS_UNSAFE_JEV_DISAGREES' ? (b.jev_noul ?? 0) - (a.jev_noul ?? 0) : (a.jev_noul ?? 1) - (b.jev_noul ?? 1)),
    );

  const md = [];
  md.push('# Jev second opinion: diets\n');
  if (mock) md.push(MOCK_BANNER);
  md.push(
    `Each (recipe, diet) pair: the app's own \`meetsDiet()\` against Jev's probability that the recipe meets the diet as the app defines it. ` +
      `**APP_SAYS_SAFE_JEV_DISAGREES** (app says it fits, Jev < 0.2) is the dangerous one — someone who ticked that diet is shown the dish. ` +
      `**APP_SAYS_UNSAFE_JEV_DISAGREES** (app says no, Jev > 0.8) only hides a dish. **UNSURE** is 0.2–0.8. Jev is a second opinion, not an authority: every flagged row lists its ingredients so a person can decide.\n`,
  );
  md.push(`## Summary\n`);
  md.push(`${prep.calls.length} recipes, ${rows.length} pairs. ` + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ') + '\n');
  md.push('| diet | pairs | agree | app safe, Jev no | app unsafe, Jev yes | unsure | error/skipped |');
  md.push('|---|---|---|---|---|---|---|');
  for (const d of perDiet) md.push(`| ${d.diet} | ${d.total} | ${d.agree} (${pct(d.agree, d.total)}) | ${d.safe_disagree} | ${d.unsafe_disagree} | ${d.unsure} | ${d.error} |`);
  md.push('');

  const section = (title, verdict, blurb) => {
    const xs = flagged.filter((x) => x.verdict === verdict);
    md.push(`## ${title} (${xs.length})\n`);
    if (blurb) md.push(blurb + '\n');
    if (!xs.length) return md.push('None.\n');
    for (const x of xs) {
      const r = RECIPES.find((y) => y.id === x.recipe);
      const because = breaksDietBecause(r, x.diet);
      md.push(`### ${x.name} — ${x.diet}  \`noul ${r3(x.jev_noul)}\``);
      md.push(`- app: **${x.app_meets ? 'meets' : 'does not meet'}** ${x.diet} (${x.how_app_decides}; tags: ${r.tags.join(', ') || 'none'})${because.length ? ` — app's reason: ${because.join(', ')}` : ''}`);
      if (x.error) md.push(`- error: ${esc(x.error)}`);
      md.push(`- ingredients: ${r.items.map((i) => `${i.g} ${i.n}${i.opt ? ' (optional)' : ''}`).join('; ')}`);
      md.push('');
    }
  };
  section('App says safe, Jev disagrees — check these first', 'APP_SAYS_SAFE_JEV_DISAGREES', 'The app would show these to someone who asked for that diet.');
  section('App says unsafe, Jev disagrees', 'APP_SAYS_UNSAFE_JEV_DISAGREES', 'The app hides these from that diet. If Jev is right, the cost is a dish nobody on that diet is offered.');
  section('Unsure (0.2 – 0.8)', 'UNSURE', "Jev could not tell. Often an ingredient whose status depends on the brand — stock cubes, sausages, curry paste.");
  const errs = flagged.filter((x) => x.verdict === 'ERROR' || x.verdict === 'SKIPPED');
  if (errs.length) {
    md.push(`## Errors and skipped (${errs.length})\n`);
    for (const x of errs.slice(0, 50)) md.push(`- ${x.recipe} / ${x.diet}: ${x.verdict} ${esc(x.error)}`);
    md.push('');
  }
  md.push('A noul answer is a probability with no separate confidence figure, so TypeSafe\'s act/confirm/escalate bands do not apply to this check; the 0.2 / 0.8 cut-offs above play that role.\n');

  return { json: { check: name, mock, counts, per_diet: perDiet, flagged, rows }, markdown: md.join('\n'), headline: `diets: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ')}` };
}
