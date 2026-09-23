/**
 * The three benchmark tasks, built from the app's own pure modules only.
 * No browser, no network: `node scripts/jev/bench.mjs --dry` runs all of this.
 *
 * Every question is built by the same function the matching check uses, so
 * the wording Jev and the LLMs see is word for word what the checks ask:
 *   diets        -> dietQuestions() and stateOf() from check-diets.mjs
 *   picks        -> pickOkQuestion() / bestQuestion() / person() from check-picks.mjs
 *   translations -> question() and enumerate() from check-translations.mjs
 *
 * Picks: the real check drives the built app for its top five, because
 * ranked() lives inside a React hook. The benchmark cannot need a browser, so
 * its scenarios are built here from pure modules instead — the check's own
 * people (scenarios()), the cookbook, meetsDiet(), toLocal() — with candidate
 * lists constructed so the right answer is known exactly: in most scenarios
 * exactly one of the five keeps every hard constraint, in some none does.
 * These are NOT the app's real top five, and they do not need to be: the task
 * measures whether a judge can check hard constraints, which is the part of
 * the picks check that has a right answer.
 */
import { COUNTRIES, DIETS, RECIPES, STORES_BY_COUNTRY, breaksDietBecause, meetsDiet, toLocal } from './app.mjs';
import { DEFS, dietQuestions, stateOf } from './check-diets.mjs';
import { HARD_CONSTRAINTS, bestQuestion, money, person, pickOkQuestion, scenarios } from './check-picks.mjs';
import { OTHER as LANGS_OTHER } from './app.mjs';
import { enumerate, question as trQuestion, skipReason } from './check-translations.mjs';
import { DIET_GOLD, TRANSLATION_GOLD_BROKEN, TRANSLATION_GOLD_OK } from './gold.mjs';
import { prng } from './lib.mjs';

export const SEED = 20260923;
/** max_tokens per LLM call, per task: room for the JSON and a little slack. */
export const MAX_TOKENS = { diets: 220, picks: 90, translations: 130, broken: 50 };

/** Deterministic shuffle. */
export function shuffle(xs, rand) {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Diets ───────────────────────────────────────────────────────────────── */

/** 40 recipes: every recipe the gold set names, then a seeded fill. */
export function dietSample(n = 40) {
  if (!DIETS.every((d) => DEFS[d.id])) throw new Error('a diet the app offers has no DEFS entry');
  const goldIds = [...new Set(DIET_GOLD.map((g) => g.recipe))];
  for (const id of goldIds) if (!RECIPES.some((r) => r.id === id)) throw new Error(`gold recipe ${id} is not in the cookbook`);
  const rest = shuffle(
    RECIPES.filter((r) => !goldIds.includes(r.id)),
    prng(SEED),
  );
  const ids = [...goldIds, ...rest.map((r) => r.id)].slice(0, n);
  return ids.map((id) => RECIPES.find((r) => r.id === id));
}

export function dietCalls(n = 40) {
  return dietSample(n).map((r) => ({
    id: r.id,
    task: 'diets',
    state: stateOf(r),
    questions: dietQuestions(),
    maxTokens: MAX_TOKENS.diets,
    meta: { app: Object.fromEntries(DIETS.map((d) => [d.id, meetsDiet(r, d.id)])) },
  }));
}

/* ── Picks-style constraint check ────────────────────────────────────────── */

/**
 * A diet break that nobody could argue with, beyond the hand-set tag — so a
 * candidate counted as breaking a diet really does. (The tags are cautious:
 * an untagged dish is not necessarily unsuitable, and a judge who says so
 * should not be marked wrong.)
 */
const MEAT = /\b(chicken|beef|lamb|pork|bacon|ham|sausages?|merguez|mince|brisket|steak|wings|thighs|bones|prawns?|shrimp|fish|cod|salmon|mackerel|tuna|anchov\w*)\b/i;
const DAIRY = /(?<!coconut |peanut |cashew |almond |oat |soy )\b(milk|butter|cream|cheese|cheddar|parmesan|mozzarella|feta|halloumi|paneer|ghee|yoghurt|gruyere|pecorino|soured cream)\b(?! beans)/i;
const CLEAR = {
  vegan: (n) => MEAT.test(n) || DAIRY.test(n) || /\b(eggs?|honey|mayonnaise)\b/i.test(n),
  vegetarian: (n) => MEAT.test(n),
  gluten_free: (n) => /\b(plain flour|bread|breadcrumbs|spaghetti|pasta|macaroni|couscous|bulgur|baguette|pitta|egg noodles|wonton|buns|semolina|flatbread|soy sauce|stock cube)\b/i.test(n),
  dairy_free: (n) => DAIRY.test(n),
  halal: (n) => /\b(pork|bacon|ham|lard|chorizo|wine|beer|mirin)\b/i.test(n),
  kosher: (n) => /\b(pork|bacon|ham|prawns?|shrimp|squid|mussels|clams|crab|lobster)\b/i.test(n),
};
/**
 * The app's cautious extras: coconut and tahini count as nuts under DEFS, but
 * a judge shown only the word "Nut free" can fairly read them as fine, so a
 * dish that breaks nut free ONLY through them is not a clear break.
 */
const CAUTIOUS_ONLY = { nut_free: /coconut|tahini/i };
export function clearlyBreaksDiet(r, d) {
  if (meetsDiet(r, d)) return false;
  const named = breaksDietBecause(r, d).filter((n) => !CAUTIOUS_ONLY[d]?.test(n));
  if (named.length) return true; // derived diets: the app names the ingredient
  if (breaksDietBecause(r, d).length) return false; // only the cautious extras
  const items = r.items.filter((i) => !i.opt).map((i) => i.n);
  if (d === 'kosher' && items.some((n) => MEAT.test(n) && !/fish|cod|salmon|mackerel|tuna|anchov/i.test(n)) && items.some((n) => DAIRY.test(n))) return true;
  return !!CLEAR[d] && items.some((n) => CLEAR[d](n));
}

const AMBIGUOUS = /stock|sausage|worcestershire|parmesan|pecorino|feta|gruy|mozzarella|cheddar|curry paste/i;

/** Whole recipe, non-optional items, at the country's cheapest shop, GBP baseline. */
export function priceGbp(r, country) {
  const mult = Math.min(...STORES_BY_COUNTRY[country].map((s) => s.mult));
  return r.items.filter((i) => !i.opt).reduce((a, i) => a + i.s * mult, 0);
}

export function pickFacts(r, s) {
  const gbp = priceGbp(r, s.country);
  const brokenDiets = s.diets.filter((d) => !meetsDiet(r, d));
  const overTime = r.total > s.maxTime;
  const overBudget = gbp > s.budget;
  return {
    id: r.id,
    compliant: !brokenDiets.length && !overTime && gbp <= s.budget * 0.95,
    clearlyBroken: overTime || gbp > s.budget * 1.1 || s.diets.some((d) => clearlyBreaksDiet(r, d)),
    brokenDiets,
    overTime,
    overBudget,
    priceGbp: gbp,
  };
}

function dishOf(r, s) {
  return {
    name: r.name,
    cuisine: r.cuisine,
    total_minutes: r.total,
    difficulty: `${r.diff}/4 (${r.diffLabel})`,
    servings: r.servings,
    price_shown_by_app: `${money(priceGbp(r, s.country), s.country)} to buy (whole recipe, cheapest shop)`,
    kcal_per_serving: r.per.kcal,
    protein_g_per_serving: r.per.protein,
    ingredients: r.items.map((i) => `${i.g} ${i.n}${i.opt ? ' (optional)' : ''}`),
  };
}

/**
 * Could the compliant dish be "clearly unsuitable" for this person, which the
 * best question's own "none" option allows? Then the gold would not be exact.
 * So the one compliant candidate must be a proper dinner (not a side, snack or
 * thin soup), fit the stated goal and not be far above the cooking level.
 */
export function properDinner(r, s) {
  if (r.per.kcal < 450 || r.per.protein < 15) return false;
  if (r.diff > Math.max(2, s.level + 1)) return false;
  if (s.goal === 'muscle' && r.per.protein < 25) return false;
  if (s.goal === 'gain' && r.per.kcal < 600) return false;
  if (s.goal === 'lose' && r.per.kcal > 750) return false;
  return true;
}

/**
 * Twenty scenarios. Every fifth has no compliant candidate at all (gold
 * "none"); the rest have exactly one. The first-listed dish ("apps_pick") is
 * the compliant one in about half, so pick_ok is balanced.
 */
export function pickCalls(n = 20) {
  const people = scenarios().slice(0, n);
  return people.map((s, i) => {
    const rand = prng(SEED + 1000 + i);
    const facts = RECIPES.map((r) => ({ r, f: pickFacts(r, s) }));
    const good = facts.filter((x) => x.f.compliant && properDinner(x.r, s) && (!s.diets.length || !x.r.items.some((it) => AMBIGUOUS.test(it.n))));
    const bad = facts.filter((x) => !x.f.compliant && x.f.clearlyBroken);
    if (bad.length < 5) throw new Error(`scenario ${s.id}: only ${bad.length} clearly non-compliant dishes`);
    const wantNone = i % 5 === 4 || !good.length;
    const picked = wantNone ? shuffle(bad, rand).slice(0, 5) : [shuffle(good, rand)[0], ...shuffle(bad, rand).slice(0, 4)];
    const compliantFirst = !wantNone && i % 2 === 0;
    let order = shuffle(picked, rand);
    if (!wantNone) {
      const g = picked[0];
      order = order.filter((x) => x !== g);
      order.splice(compliantFirst ? 0 : 1 + Math.floor(rand() * 4), 0, g);
    }
    const recipes = order.map((x) => x.r);
    const gold = { pick_ok: order[0].f.compliant, best: wantNone ? 'none' : picked[0].r.id };
    return {
      id: s.id,
      task: 'picks',
      state: {
        person: person(s),
        hard_constraints: HARD_CONSTRAINTS,
        apps_pick: dishOf(recipes[0], s),
        candidates: Object.fromEntries(recipes.map((r) => [r.id, dishOf(r, s)])),
      },
      // Jev also gets best_b, the same question with the options reversed, for
      // the order-flip rate. The LLMs are asked once (llmQuestions).
      questions: { pick_ok: pickOkQuestion(), best_a: bestQuestion(recipes, [0, 1, 2, 3, 4]), best_b: bestQuestion(recipes, [4, 3, 2, 1, 0]) },
      llmQuestions: ['pick_ok', 'best_a'],
      maxTokens: MAX_TOKENS.picks,
      meta: { scenario: s, gold, facts: order.map((x) => x.f), budgetLocal: toLocal(s.budget, COUNTRIES[s.country], COUNTRIES[s.country].fx) },
    };
  });
}

/* ── Translations ────────────────────────────────────────────────────────── */

export function translationCalls(n = 60) {
  const { rows } = enumerate();
  const keep = rows.filter((r) => !skipReason(r));
  const idOf = (r) => `${r.table}:${r.key}`;
  const goldIds = [...new Set(TRANSLATION_GOLD_OK.map((g) => g.id))];
  for (const id of [...goldIds, ...TRANSLATION_GOLD_BROKEN.map((g) => g.id)])
    if (!rows.some((r) => idOf(r) === id)) throw new Error(`gold translation key ${id} is not in the language files`);
  const rest = shuffle(
    keep.filter((r) => !goldIds.includes(idOf(r))),
    prng(SEED + 7),
  );
  const picked = [...goldIds.map((id) => keep.find((r) => idOf(r) === id)), ...rest].slice(0, n);
  const stateOfRow = (r, over = {}) => ({ key: `${r.table}.${r.key}`, english: r.en, es: r.es, fr: r.fr, pl: r.pl, ur: r.ur, ar: r.ar, ...over });
  const calls = picked.map((r) => ({
    id: idOf(r),
    task: 'translations',
    state: stateOfRow(r),
    questions: Object.fromEntries(LANGS_OTHER.map((l) => [`${l}_faithful`, trQuestion(l)])),
    maxTokens: MAX_TOKENS.translations,
    meta: { row: r },
  }));
  const broken = TRANSLATION_GOLD_BROKEN.map((g) => {
    const r = rows.find((x) => idOf(x) === g.id);
    if (r[g.lang] === g.text) throw new Error(`broken gold ${g.id}/${g.lang} is identical to the real text`);
    return {
      id: `${g.id}#broken-${g.lang}`,
      task: 'broken',
      state: stateOfRow(r, { [g.lang]: g.text }),
      questions: { [`${g.lang}_faithful`]: trQuestion(g.lang) },
      maxTokens: MAX_TOKENS.broken,
      meta: { gold: g },
    };
  });
  return { calls, broken };
}

/** Everything, keyed by task. `only` narrows to one of diets|picks|translations. */
export function buildTasks({ only } = {}) {
  const want = (t) => !only || only === t;
  const tr = want('translations') ? translationCalls() : { calls: [], broken: [] };
  return {
    diets: want('diets') ? dietCalls() : [],
    picks: want('picks') ? pickCalls() : [],
    translations: tr.calls,
    broken: tr.broken,
  };
}

/** The LLM's version of a call: picks drop best_b. */
export function llmCall(c) {
  if (!c.llmQuestions) return c;
  return { ...c, questions: Object.fromEntries(c.llmQuestions.map((k) => [k, c.questions[k]])) };
}
