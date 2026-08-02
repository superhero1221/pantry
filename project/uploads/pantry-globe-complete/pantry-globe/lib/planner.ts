import { NUTRIENTS } from './nutrients';
import { RECIPES, applyVariant, nutrition, recipeMatches } from './engine';
import { fmtMoney } from './countries';
import { quote, coverage, type Coverage } from './prices';
import type {
  Recipe, RecipeItem, NutritionTotals, CountryProfile, DietTag, PricedItem,
} from './types';

/**
 * Deterministic meal-set planner.
 *
 * Everything here is arithmetic and search — no model, no API, no key, no cost.
 * "Give me 5 days at 2,000 kcal and 150 g protein under £55" is a constraint
 * satisfaction problem, and solving it directly is instant, works offline, and
 * cannot hallucinate a macro figure. The optional LLM layer sits on top of this,
 * never underneath it.
 */

export interface PlanTargets {
  days: number;
  mealsPerDay: number;      // 1..3
  servings: number;         // per meal
  kcalPerDay?: number;
  proteinPerDay?: number;
  budget?: number;          // whole plan, local currency, first-cook basis
  diets: DietTag[];
  maxRepeats: number;       // how many times one dish may appear
}

export interface PlannedMeal { recipeId: string; variantId: string | null }
export interface PlanDay { meals: PlannedMeal[]; totals: NutritionTotals }

export interface MealPlan {
  days: PlanDay[];
  shopping: PricedItem[];
  firstCook: number;
  marginal: number;
  perMeal: number;
  avg: NutritionTotals;
  targets: PlanTargets;
  /** What a naive shopper would pay buying each dish's packs separately. */
  naiveFirstCook: number;
  overlapSaving: number;
  sharedItems: number;
  score: number;
  notes: PlanNote[];
  coverage: Coverage;
}

/** Notes carry their tone so the UI can't render good news as a warning. */
export interface PlanNote { text: string; kind: 'good' | 'warn' }

/* --------------------------------------------------------------- seeded RNG */
// Seeded so the same inputs always give the same plan — a plan that reshuffles
// every time you look at it is not a plan.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------- candidates */
export interface Candidate {
  recipe: Recipe;
  variantId: string | null;
  items: RecipeItem[];
  perServing: NutritionTotals;
  refs: Set<string>;
}

export function candidates(diets: DietTag[], extra: Recipe[] = [], only?: Recipe[]): Candidate[] {
  const out: Candidate[] = [];
  for (const r of (only ?? [...RECIPES, ...extra])) {
    const m = recipeMatches(r, diets);
    if (!m.ok) continue;
    // the base recipe, if it qualifies on its own
    const variants: (string | null)[] = m.via ? [m.via.id] : [null];
    // plus any other variant that also qualifies — more room for the optimiser
    for (const v of r.variants) {
      if (variants.includes(v.id)) continue;
      if (!diets.length || diets.every((d) => v.tags.includes(d))) variants.push(v.id);
    }
    for (const vid of variants) {
      const items = applyVariant(r, vid);
      out.push({
        recipe: r,
        variantId: vid,
        items,
        perServing: nutrition(items, r.servings),
        refs: new Set(items.filter((i) => i.ref !== 'water').map((i) => i.ref)),
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------- aggregation */
/**
 * Price a whole plan. The important part: ingredients are summed ACROSS every
 * meal before pack maths is applied, so one 1 kg bag of rice covers four dishes.
 * This is why a week's plan costs far less than the sum of its dishes.
 */
export function priceePlan(
  picks: { c: Candidate; servings: number }[],
  country: CountryProfile,
  tier: number,
  pantry: Set<string>,
): { items: PricedItem[]; firstCook: number; marginal: number; naive: number; shared: number; coverage: Coverage } {
  const totalGrams = new Map<string, { g: number; note?: string; optional: boolean; uses: number }>();

  for (const { c, servings } of picks) {
    const scale = servings / Math.max(c.recipe.servings, 1);
    for (const it of c.items) {
      if (it.ref === 'water') continue;
      const e = totalGrams.get(it.ref);
      if (e) { e.g += it.grams * scale; e.uses += 1; if (!it.optional) e.optional = false; }
      else totalGrams.set(it.ref, { g: it.grams * scale, note: it.note, optional: !!it.optional, uses: 1 });
    }
  }

  const items: PricedItem[] = [];
  let firstCook = 0, marginal = 0, shared = 0;

  for (const [ref, { g, note, optional, uses }] of totalGrams) {
    const n = NUTRIENTS[ref];
    if (!n) continue;
    if (uses > 1) shared++;
    const q = quote(ref, country, tier);
    if (!q) continue;
    const packs = Math.max(1, Math.ceil(g / Math.max(n.packSize, 1)));
    const packPrice = q.packPrice * packs;
    const marg = q.packPrice * (g / Math.max(n.packSize, 1));
    const owned = pantry.has(ref);
    items.push({
      ref, name: n.name, grams: Math.round(g * 10) / 10, packSize: n.packSize,
      packPrice: owned ? 0 : packPrice, marginal: marg, role: n.role, optional, note,
      source: q.source, obs: q.n, confidence: q.confidence,
    });
    if (!owned) firstCook += packPrice;
    marginal += marg;
  }

  // What you'd pay shopping for each dish on its own — the counterfactual.
  let naive = 0;
  for (const { c, servings } of picks) {
    const scale = servings / Math.max(c.recipe.servings, 1);
    for (const it of c.items) {
      if (it.ref === 'water' || pantry.has(it.ref)) continue;
      const n = NUTRIENTS[it.ref];
      if (!n) continue;
      const q = quote(it.ref, country, tier);
      if (!q) continue;
      naive += q.packPrice * Math.max(1, Math.ceil((it.grams * scale) / Math.max(n.packSize, 1)));
    }
  }

  items.sort((a, b) => b.packPrice - a.packPrice);
  return { items, firstCook, marginal, naive, shared, coverage: coverage(items) };
}

/* ------------------------------------------------------------------ scoring */
/**
 * Scored PER DAY, not on the weekly average.
 *
 * Averaging is the tempting shortcut and it produces plans that look correct in
 * aggregate while swinging 1,500 to 2,400 kcal day to day. If someone sets a
 * 2,000 kcal target they mean every day, so each day is scored on its own
 * deviation and the worst day is penalised extra.
 */
function scorePlan(
  picks: Candidate[],
  t: PlanTargets,
  cost: number,
): { score: number; kcal: number; protein: number; worstKcalGap: number } {
  let s = 0;
  let sumKcal = 0, sumProt = 0, worstGap = 0;

  for (let d = 0; d < t.days; d++) {
    const day = picks.slice(d * t.mealsPerDay, (d + 1) * t.mealsPerDay);
    if (!day.length) continue;
    const dK = day.reduce((a, c) => a + c.perServing.kcal, 0);
    const dP = day.reduce((a, c) => a + c.perServing.protein, 0);
    sumKcal += dK; sumProt += dP;

    if (t.kcalPerDay) {
      const gap = Math.abs(dK - t.kcalPerDay) / t.kcalPerDay;
      worstGap = Math.max(worstGap, gap);
      s += gap * 110;
    }
    if (t.proteinPerDay) {
      // undershooting protein is worse than overshooting it
      const diff = dP - t.proteinPerDay;
      s += (diff < 0 ? -diff * 1.8 : diff * 0.5) / t.proteinPerDay * 130;
    }
  }

  // punish the single worst day so one blow-out can't hide behind a good average
  s += worstGap * 90;

  const dayKcal = sumKcal / t.days;
  const dayProt = sumProt / t.days;

  if (t.budget && cost > t.budget) s += ((cost - t.budget) / t.budget) * 150;

  // variety: penalise repeats beyond the allowance
  const counts = new Map<string, number>();
  for (const c of picks) counts.set(c.recipe.id, (counts.get(c.recipe.id) ?? 0) + 1);
  for (const n of counts.values()) if (n > t.maxRepeats) s += (n - t.maxRepeats) * 40;

  // cuisine spread: a week of seven curries is technically valid and nobody wants it
  const cuisines = new Set(picks.map((c) => c.recipe.cuisine));
  s += Math.max(0, Math.min(picks.length, 4) - cuisines.size) * 12;

  // effort: penalise stacking several long cooks
  const long = picks.filter((c) => c.recipe.totalMin > 90).length;
  s += Math.max(0, long - Math.ceil(picks.length / 3)) * 15;

  return { score: s, kcal: dayKcal, protein: dayProt, worstKcalGap: worstGap };
}

/* ------------------------------------------------------------------- solver */
export function buildPlan(
  t: PlanTargets,
  country: CountryProfile,
  tier: number,
  pantry: Set<string>,
  seed = 7,
  extra: Recipe[] = [],
  only?: Recipe[],
): MealPlan | null {
  const pool = candidates(t.diets, extra, only);
  if (!pool.length) return null;

  const slots = t.days * t.mealsPerDay;
  const rnd = mulberry32(seed);
  const priceOf = (picks: Candidate[]) =>
    priceePlan(picks.map((c) => ({ c, servings: t.servings })), country, tier, pantry);

  // seed: spread across distinct recipes, best protein-per-cost first
  const sorted = [...pool].sort(
    (a, b) => b.perServing.protein / Math.max(a.perServing.kcal, 1) - a.perServing.protein / Math.max(b.perServing.kcal, 1),
  );
  let current: Candidate[] = [];
  for (let i = 0; i < slots; i++) current.push(sorted[i % sorted.length]);

  let best = current;
  let bestPrice = priceOf(best);
  let bestScore = scorePlan(best, t, bestPrice.firstCook).score;

  // Hill-climb with two move types. Replacement changes what's cooked; swapping
  // two slots redistributes existing dishes across days, which is what actually
  // fixes an uneven day without changing the shopping list at all.
  const ITERS = 2200;
  for (let i = 0; i < ITERS; i++) {
    const next = [...current];
    if (rnd() < 0.35 && slots > 1) {
      const a = Math.floor(rnd() * slots);
      let b = Math.floor(rnd() * slots);
      if (b === a) b = (a + 1) % slots;
      [next[a], next[b]] = [next[b], next[a]];
    } else {
      next[Math.floor(rnd() * slots)] = pool[Math.floor(rnd() * pool.length)];
    }
    const p = priceOf(next);
    const sc = scorePlan(next, t, p.firstCook).score;
    if (sc < bestScore || rnd() < 0.03) {
      current = next;
      if (sc < bestScore) { best = next; bestScore = sc; bestPrice = p; }
    }
    // restart from the best-known plan periodically so sideways moves can't drift away
    if (i % 500 === 499) current = [...best];
  }

  const final = priceOf(best);
  const sc = scorePlan(best, t, final.firstCook);

  // lay out days
  const days: PlanDay[] = [];
  for (let d = 0; d < t.days; d++) {
    const meals = best.slice(d * t.mealsPerDay, (d + 1) * t.mealsPerDay);
    const totals = meals.reduce<NutritionTotals>((acc, c) => {
      for (const k of Object.keys(acc) as (keyof NutritionTotals)[]) acc[k] += c.perServing[k];
      return acc;
    }, { kcal: 0, protein: 0, carb: 0, fat: 0, fibre: 0, iron: 0, calcium: 0, b12: 0, zinc: 0, vitA: 0, vitC: 0, sodium: 0, potassium: 0 });
    days.push({ meals: meals.map((c) => ({ recipeId: c.recipe.id, variantId: c.variantId })), totals });
  }

  const avg = days.reduce<NutritionTotals>((acc, d) => {
    for (const k of Object.keys(acc) as (keyof NutritionTotals)[]) acc[k] += d.totals[k] / days.length;
    return acc;
  }, { kcal: 0, protein: 0, carb: 0, fat: 0, fibre: 0, iron: 0, calcium: 0, b12: 0, zinc: 0, vitA: 0, vitC: 0, sodium: 0, potassium: 0 });

  const notes: PlanNote[] = [];
  if (t.kcalPerDay && Math.abs(sc.kcal - t.kcalPerDay) / t.kcalPerDay > 0.1)
    notes.push({ kind: 'warn', text: `Averages ${Math.round(sc.kcal)} kcal/day against your ${t.kcalPerDay} target — the menu can't get closer without more repeats.` });
  if (t.kcalPerDay && sc.worstKcalGap > 0.2) {
    const spread = days.map((d) => Math.round(d.totals.kcal));
    notes.push({ kind: 'warn', text: `Days aren't even: ${Math.min(...spread)}–${Math.max(...spread)} kcal. The dishes only combine so many ways at ${t.mealsPerDay} meal${t.mealsPerDay === 1 ? '' : 's'} a day — loosening the calorie target or allowing more repeats will even it out faster than adding a meal.` });
  }
  if (t.proteinPerDay && sc.protein < t.proteinPerDay * 0.9)
    notes.push({ kind: 'warn', text: `Protein reaches ${Math.round(sc.protein)} g/day, short of ${t.proteinPerDay} g. Add a snack, or allow more repeats so the high-protein dishes appear twice.` });
  if (t.budget && final.firstCook > t.budget)
    notes.push({ kind: 'warn', text: `First shop is ${fmtMoney(final.firstCook, country)} against a ${fmtMoney(t.budget, country)} budget. It falls to about ${fmtMoney(final.marginal, country)} once your cupboard is stocked — the overage is almost all spices and staples you'll still have next month.` });
  if (avg.b12 < 0.6)
    notes.push({ kind: 'warn', text: 'B12 across this plan is very low. If it is plant-only, that nutrient needs a fortified food or a supplement — it cannot be improvised.' });
  if (avg.fibre > 28) notes.push({ kind: 'good', text: 'Fibre is comfortably at target across the week.' });
  if (t.proteinPerDay && sc.protein >= t.proteinPerDay) notes.push({ kind: 'good', text: `Protein target met — ${Math.round(sc.protein)} g a day.` });

  return {
    days,
    shopping: final.items,
    firstCook: final.firstCook,
    marginal: final.marginal,
    perMeal: final.marginal / Math.max(slots * t.servings, 1),
    avg,
    targets: t,
    naiveFirstCook: final.naive,
    overlapSaving: Math.max(0, final.naive - final.firstCook),
    sharedItems: final.shared,
    score: bestScore,
    notes,
    coverage: final.coverage,
  };
}

/* =========================================================================
 * COOK PROFILE
 * ------------------------------------------------------------------------
 * The onboarding answers, and the code that turns them into real constraints.
 * Collecting preferences and then ignoring them is the standard failure of
 * onboarding flows — every field below changes what the planner is allowed
 * to pick, and `explainProfile` states the effect back to the user so a
 * wrong answer is visible rather than silently shaping the menu.
 * ========================================================================= */

export type Tier = 1 | 2 | 3 | 4;

export interface CookProfile {
  skill: Tier;        // 1 barely cooked -> 4 cooks a lot
  budget: Tier;       // 1 tight -> 4 not a concern
  time: Tier;         // 1 ~15 min -> 4 as long as it takes
  adventure: Tier;    // 1 familiar only -> 4 anything
  diets: DietTag[];
  people: number;
}

export const DEFAULT_PROFILE: CookProfile = {
  skill: 2, budget: 2, time: 2, adventure: 2, diets: [], people: 2,
};

/** Hardest dish a given skill tier should be offered. */
const SKILL_CAP: Record<Tier, number> = { 1: 1, 2: 2, 3: 3, 4: 4 };
const DIFFICULTY_RANK: Record<string, number> = {
  easy: 1, 'easy-medium': 2, medium: 3, hard: 4,
};

/** Minutes of total cook time each time tier tolerates. */
const TIME_CAP: Record<Tier, number> = { 1: 25, 2: 45, 3: 75, 4: 100000 };

/** Weekly grocery budget per person, in GBP, before the country index. */
const BUDGET_PER_PERSON_GBP: Record<Tier, number> = { 1: 30, 2: 45, 3: 65, 4: 0 };

/**
 * How far outside familiar territory a dish sits, 1-4.
 * Hand-assigned rather than inferred: "adventurous" is about what the eater
 * recognises, which no ingredient count can tell you. Unknown dishes — including
 * anything the AI layer invents — default to 3, so they surface for people who
 * asked to explore and stay hidden from people who didn't.
 */
const BOLDNESS: Record<string, Tier> = {
  poached_eggs_avocado: 1, spaghetti_carbonara: 1, swedish_meatballs: 1,
  greek_yogurt_bowl: 1, chicken_salad_bowl: 1, spinach_feta_eggs: 1,
  chicken_tacos: 2, shakshuka: 2, butter_chicken: 2, dal_tadka: 2,
  red_lentil_soup: 2, chickpea_feta_salad: 2,
  chicken_biryani: 3, pad_thai: 3, jollof_rice: 3, moroccan_couscous: 3,
  machboos_dajaj: 3, falafel_bowl: 3,
  beef_pho: 4,
  // batch D
  chicken_stir_fry: 1, tuna_pasta_bake: 1, beef_chilli: 1, roast_chicken_traybake: 1,
  salmon_traybake: 1, omelette_cheese_herb: 1, lentil_bolognese: 2, veg_curry_coconut: 2,
};
export const boldnessOf = (id: string): Tier => BOLDNESS[id] ?? 3;

export interface ProfileFilter {
  allowed: Recipe[];
  excluded: { recipe: Recipe; why: string }[];
}

/** Apply the profile as a hard filter over the dish pool. */
export function filterByProfile(profile: CookProfile, pool: Recipe[]): ProfileFilter {
  const allowed: Recipe[] = [];
  const excluded: { recipe: Recipe; why: string }[] = [];
  for (const r of pool) {
    const diff = DIFFICULTY_RANK[r.difficulty] ?? 3;
    if (diff > SKILL_CAP[profile.skill]) { excluded.push({ recipe: r, why: 'harder than your comfort level' }); continue; }
    if (r.totalMin > TIME_CAP[profile.time]) { excluded.push({ recipe: r, why: `takes ${r.totalMin >= 120 ? Math.round(r.totalMin / 60) + ' h' : r.totalMin + ' min'}` }); continue; }
    if (boldnessOf(r.id) > profile.adventure + 1) { excluded.push({ recipe: r, why: 'more adventurous than you asked for' }); continue; }
    if (profile.diets.length && !recipeMatches(r, profile.diets).ok) { excluded.push({ recipe: r, why: 'does not fit your restrictions' }); continue; }
    allowed.push(r);
  }
  return { allowed, excluded };
}

/** Budget for a whole plan, in local currency. 0 means unconstrained. */
export function budgetFor(profile: CookProfile, days: number, c: CountryProfile): number {
  const perPersonWeek = BUDGET_PER_PERSON_GBP[profile.budget];
  if (!perPersonWeek) return 0;
  return perPersonWeek * (days / 7) * profile.people * c.index * c.fx;
}

/** Plain-language statement of what each answer is doing. */
export function explainProfile(profile: CookProfile, allowed: number, total: number): string[] {
  const out: string[] = [];
  out.push(
    profile.skill === 1 ? 'Only straightforward dishes — nothing that needs technique you have not used yet.'
    : profile.skill === 4 ? 'Nothing held back on difficulty.'
    : `Dishes up to ${profile.skill === 2 ? 'easy-medium' : 'medium'} difficulty.`,
  );
  out.push(
    profile.time === 4 ? 'No limit on cooking time.'
    : `Nothing over ${TIME_CAP[profile.time]} minutes start to finish.`,
  );
  out.push(
    profile.adventure === 1 ? 'Familiar food only — no dish you would have to look up.'
    : profile.adventure === 4 ? 'Anything goes, including the long and unusual ones.'
    : 'Mostly familiar, with a few things you may not have cooked before.',
  );
  if (profile.diets.length) out.push(`Filtered to: ${profile.diets.join(', ').replace(/_/g, '-')}.`);
  out.push(`${allowed} of ${total} dishes fit — the rest are hidden, not deleted.`);
  return out;
}

/**
 * Build the best plan for a profile, choosing the meal count rather than
 * assuming it.
 *
 * A beginner limited to quick, light dishes cannot reach 2,000 kcal in two
 * meals — the ceiling is roughly 1,000. Fixing meals-per-day at 2 and then
 * reporting a 35% miss is technically honest and practically useless, so the
 * planner tries each option and says which it picked and why.
 */
export function planForProfile(
  profile: CookProfile,
  opts: { days: number; kcalPerDay?: number; proteinPerDay?: number; seed?: number },
  country: CountryProfile,
  tier: number,
  pantry: Set<string>,
  extra: Recipe[] = [],
): { plan: MealPlan | null; mealsPerDay: number; allowed: number; total: number; excluded: { recipe: Recipe; why: string }[]; reason: string } {
  const pool = [...RECIPES, ...extra];
  const { allowed, excluded } = filterByProfile(profile, pool);
  const budget = budgetFor(profile, opts.days, country) || undefined;

  if (!allowed.length) {
    return { plan: null, mealsPerDay: 0, allowed: 0, total: pool.length, excluded, reason: 'Nothing matches all of those answers at once.' };
  }

  let best: MealPlan | null = null;
  let bestMeals = 2;
  let bestGap = Infinity;

  for (const meals of [2, 3, 4]) {
    const p = buildPlan(
      {
        days: opts.days, mealsPerDay: meals, servings: profile.people,
        kcalPerDay: opts.kcalPerDay, proteinPerDay: opts.proteinPerDay,
        budget, diets: profile.diets, maxRepeats: meals >= 3 ? 3 : 2,
      },
      country, tier, pantry, opts.seed ?? 7, extra, allowed,
    );
    if (!p) continue;
    const gap = opts.kcalPerDay ? Math.abs(p.avg.kcal - opts.kcalPerDay) / opts.kcalPerDay : 0;
    if (gap < bestGap) { bestGap = gap; best = p; bestMeals = meals; }
    if (gap < 0.06) break; // close enough; more meals just adds cooking
  }

  const reason =
    bestMeals === 2 ? 'Two meals a day covers your target.'
    : `Your answers rule out the heavier dishes, so it takes ${bestMeals} meals a day to reach your calories rather than two.`;

  return { plan: best, mealsPerDay: bestMeals, allowed: allowed.length, total: pool.length, excluded, reason };
}
