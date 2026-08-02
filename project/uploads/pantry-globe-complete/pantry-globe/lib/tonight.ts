import { NUTRIENTS } from './nutrients';
import { RECIPES, applyVariant, nutrition, priceBasket, recipeMatches } from './engine';
import { fits, needs, kitCoverage, type Kit } from './equipment';
import { boldnessOf } from './planner';
import type { CountryProfile, DietTag, NutritionTotals, Recipe, Variant } from './types';

/**
 * One meal, right now.
 *
 * The weekly planner assumes you can think about Thursday. Plenty of people
 * cannot — not as a failing but as how their attention works — and for them a
 * seven-day plan is not a smaller version of the problem, it is a different and
 * harder one. This answers the question actually being asked at six in the
 * evening: it is now, I have this much money, this much patience and this much
 * kitchen, tell me what to cook and stop asking me things.
 *
 * Everything here is arithmetic over the same recipe data. No model is
 * consulted, so it answers instantly, offline, and cannot invent a dish that
 * does not exist or a macro that was never measured.
 */

export interface TonightWants {
  kcal?: number;
  protein?: number;
  carb?: number;
  /** Local currency, for the whole meal. */
  budget?: number;
  /** Minutes from walking in to eating. */
  minutes?: number;
  /** 1 barely cooks -> 4 confident. */
  skill: 1 | 2 | 3 | 4;
  diets: DietTag[];
  /** What's actually in the kitchen. */
  kit: Kit[];
  /** Ingredient refs already owned — nothing is charged for these. */
  have: Set<string>;
  servings: number;
}

export interface Suggestion {
  recipe: Recipe;
  variant: Variant | null;
  servings: number;
  per: NutritionTotals;
  /** Cost of what you'd still have to buy. */
  toBuy: number;
  /** Cost if you had to buy every pack from scratch. */
  everyPack: number;
  /** Value of what actually gets eaten — the rest stays in your cupboard. */
  eaten: number;
  minutes: number;
  score: number;
  /** Ingredients you already have that this uses. */
  uses: string[];
  /** Short reasons this was picked, for display. */
  why: string[];
  /** A better version you could afford, if there is one. */
  tradeUp?: { label: string; extra: number; note: string };
}

const DIFF: Record<string, number> = { easy: 1, 'easy-medium': 2, medium: 3, hard: 4 };

/**
 * How far off target, as a fraction. Undershooting protein is punished harder
 * than overshooting it, because someone who asked for 40 g of protein and got
 * 30 has not had the meal they asked for, while 48 is simply dinner.
 */
function miss(actual: number, want: number | undefined, underWeight = 1, overWeight = 1): number {
  if (!want) return 0;
  const d = (actual - want) / want;
  return d < 0 ? -d * underWeight : d * overWeight;
}

export function suggest(
  w: TonightWants,
  country: CountryProfile,
  tier: number,
  limit = 3,
  pool: Recipe[] = RECIPES,
): { picks: Suggestion[]; considered: number; note: string | null } {
  const out: Suggestion[] = [];
  let considered = 0;

  for (const r of pool) {
    // hard filters first: these are not preferences, they are facts about
    // whether the person can physically cook the thing tonight
    if (w.minutes && r.totalMin > w.minutes) continue;
    if ((DIFF[r.difficulty] ?? 3) > w.skill + 1) continue;
    if (!fits(r, w.kit).ok) continue;
    const m = recipeMatches(r, w.diets);
    if (!m.ok) continue;

    const variantIds: (string | null)[] = m.via ? [m.via.id] : [null];
    for (const v of r.variants) {
      if (variantIds.includes(v.id)) continue;
      if (!w.diets.length || w.diets.every((d) => v.tags.includes(d))) variantIds.push(v.id);
    }

    for (const vid of variantIds) {
      considered++;
      const items = applyVariant(r, vid);
      const per1 = nutrition(items, r.servings);

      // Scale the portion to the calorie target rather than serving a fixed
      // plate and reporting the miss. Someone asking for 500 kcal wants 500
      // kcal, and a dish that is 700 a portion is a smaller portion, not a
      // different dish.
      let scale = 1;
      if (w.kcal && per1.kcal > 0) scale = Math.max(0.55, Math.min(1.8, w.kcal / per1.kcal));
      const per = Object.fromEntries(
        Object.entries(per1).map(([k, val]) => [k, (val as number) * scale]),
      ) as unknown as NutritionTotals;

      const servings = w.servings;
      const basket = priceBasket(items, country, tier, servings * scale, r.servings, w.have);
      const toBuy = basket.firstCook;
      // A stated budget is a limit, not a hint. A little tolerance for pack
      // rounding is fair; a third over is simply not the thing they asked for.
      if (w.budget && toBuy > w.budget * 1.06) continue;

      // Same for protein. Someone who asks for 40 g and is handed 20 has not
      // been given a worse version of what they wanted, they have been given
      // something else.
      if (w.protein && per1.protein * scale < w.protein * 0.75) continue;

      const uses = items.filter((i) => w.have.has(i.ref) && i.ref !== 'water')
        .map((i) => NUTRIENTS[i.ref]?.name ?? i.ref);

      let s = 0;
      s += miss(per.kcal, w.kcal, 100, 70);
      s += miss(per.protein, w.protein, 320, 18);
      s += miss(per.carb, w.carb, 25, 60);
      if (w.budget) s += Math.max(0, (toBuy - w.budget) / w.budget) * 120;
      if (w.minutes) s += (r.totalMin / w.minutes) * 22;
      s += (DIFF[r.difficulty] ?? 3) * 6;
      s += Math.max(0, boldnessOf(r.id) - w.skill) * 8;
      s -= uses.length * 9;                       // strongly prefer using what's already there
      s += Math.abs(scale - 1) * 18;              // a wildly rescaled portion is a worse answer

      const why: string[] = [];
      if (w.protein && per.protein >= w.protein) why.push(`${Math.round(per.protein)} g protein`);
      if (w.kcal) why.push(`${Math.round(per.kcal)} kcal`);
      why.push(r.totalMin <= 20 ? `${r.totalMin} minutes` : `${r.totalMin} min`);
      if (uses.length) why.push(`uses ${uses.length} thing${uses.length === 1 ? '' : 's'} you have`);
      if (r.difficulty === 'easy') why.push('nothing tricky');

      out.push({ recipe: r, variant: vid ? r.variants.find((x) => x.id === vid) ?? null : null,
        servings, per, toBuy, everyPack: basket.firstCook, eaten: basket.marginal,
        minutes: r.totalMin, score: s, uses, why });
    }
  }

  out.sort((a, b) => a.score - b.score);

  // Keep one entry per dish so the list is three dinners, not three versions of
  // the same dinner.
  const seen = new Set<string>();
  const picks: Suggestion[] = [];
  for (const o of out) {
    if (seen.has(o.recipe.id)) continue;
    seen.add(o.recipe.id);
    picks.push(o);
    if (picks.length >= limit) break;
  }

  // Money left over should buy something better, not sit there. This is the
  // difference between a budget tool and a useful one: if the cheapest option
  // that fits costs half of what someone said they would spend, the honest
  // move is to offer them the nicer thing rather than bank the difference on
  // their behalf.
  const bud = w.budget;
  if (bud != null && picks.length) {
    const best = picks[0];
    const room = bud - best.toBuy;
    if (room > 1.5) {
      const nicer = out.find((o) =>
        o.recipe.id !== best.recipe.id &&
        o.toBuy > best.toBuy + 1 && o.toBuy <= bud &&
        (!w.protein || o.per.protein >= w.protein * 0.9));
      if (nicer) {
        best.tradeUp = {
          label: nicer.variant ? `${nicer.recipe.name} — ${nicer.variant.label}` : nicer.recipe.name,
          extra: nicer.toBuy - best.toBuy,
          note: `You said up to ${bud.toFixed(2)} and this comes to ${best.toBuy.toFixed(2)}. For the rest you could have this instead.`,
        };
      }
    }
  }

  let note: string | null = null;
  if (!picks.length) {
    const cov = kitCoverage(w.kit);
    if (cov.cookable === 0 && cov.blocker)
      note = `Nothing in the collection can be cooked with only what you've got — almost everything needs ${cov.blocker === 'knife' ? 'something to cut with' : cov.blocker}. That is an honest limit of 27 recipes, not a judgement about your kitchen.`;
    else if (w.minutes && w.minutes < 20)
      note = `Nothing here comes in under ${w.minutes} minutes. The quickest is ${Math.min(...RECIPES.map((r) => r.totalMin))} minutes.`;
    else if (w.budget != null) {
      const b = w.budget;
      const relaxed = suggest({ ...w, budget: undefined }, country, tier, 1, pool);
      const cheapest = relaxed.picks[0];
      note = cheapest
        ? `Nothing fits under ${b.toFixed(2)}. The cheapest that still hits your targets is ${cheapest.recipe.name} at ${cheapest.toBuy.toFixed(2)} — and only about ${cheapest.eaten.toFixed(2)} of that gets eaten tonight; the rest stays in your cupboard.`
        : `Nothing fits under ${b.toFixed(2)} with those targets, at any price. The protein target is probably the binding one.`;
    }
    else note = 'Nothing matches all of those at once. Loosen whichever matters least.';
  }

  return { picks, considered, note };
}

/** Which recipes a set of on-hand ingredients gets you closest to. */
export function fromWhatIHave(have: Set<string>, w: Omit<TonightWants, 'have'>, country: CountryProfile, tier: number) {
  return suggest({ ...w, have }, country, tier, 4);
}

/**
 * What almost everyone already has.
 *
 * Costing a weeknight dinner as though the cook owns no salt makes every meal
 * look like a 12 pound outlay and buries anything that fits a real budget. A
 * stated 6 pounds means six pounds of shopping on top of the cupboard, and
 * pretending otherwise produced "nothing fits" for budgets that comfortably do.
 * Anything here can be unticked by someone who genuinely has an empty kitchen.
 */
export const ASSUMED_STAPLES = [
  'salt', 'black_pepper', 'olive_oil', 'vegetable_oil', 'sugar', 'plain_flour',
  'cumin_ground', 'coriander_ground', 'turmeric', 'paprika_smoked', 'chilli_powder',
  'oregano_dried', 'cinnamon_ground', 'garam_masala', 'bay_leaf', 'stock_cube_chicken',
  'stock_cube_veg', 'stock_cube_beef', 'butter', 'water',
];

export { needs, fits, kitCoverage };
