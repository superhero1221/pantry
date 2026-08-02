import { NUTRIENTS } from './nutrients';
import { RECIPES, applyVariant, recipeMatches } from './engine';
import { quote } from './prices';
import type { CountryProfile, DietTag, IngredientRole, PricedItem, Recipe } from './types';

/**
 * What is left in the packs after the plan is cooked.
 *
 * The app already knows this exactly — it computes both the pack total and the
 * value consumed — but it has only ever shown the gap as a number, which reads
 * like waste. It usually isn't. A kilo of rice bought for two dishes is stock;
 * half a bag of spinach bought for one is a countdown.
 *
 * So the report splits on that line and nothing else: what keeps, and what has
 * to be used. Presenting both as a single "leftovers" figure would be the same
 * mistake as averaging a week's calories.
 */

/** Roles whose surplus sits in a cupboard for months rather than spoiling. */
const KEEPS: IngredientRole[] = ['spice', 'starch', 'pulse', 'nut', 'sweetener', 'condiment', 'fat', 'liquid', 'acid'];

export interface LeftoverLine {
  ref: string;
  name: string;
  role: IngredientRole;
  packSize: number;
  packs: number;
  gramsBought: number;
  gramsUsed: number;
  gramsLeft: number;
  /** Share of what you bought that the plan does not touch, 0-1. */
  unusedShare: number;
  /** Local currency value of the surplus. */
  value: number;
  /** True = cupboard stock. False = perishable, needs using. */
  keeps: boolean;
}

export interface NextMeal {
  recipeId: string;
  name: string;
  cuisine: string;
  /** Ingredients the surplus already covers. */
  covered: number;
  total: number;
  /** Local currency still needed to cook it for `servings`. */
  extraCost: number;
  /** What you would still have to buy, biggest first. */
  missing: { name: string; price: number }[];
  totalMin: number;
}

export interface LeftoverReport {
  lines: LeftoverLine[];
  /** Cupboard stock — value that carries forward. */
  stockValue: number;
  /** Perishable surplus — value that will be lost if unused. */
  perishableValue: number;
  perishableLines: LeftoverLine[];
  stockLines: LeftoverLine[];
  /** Share of the first shop that is stock rather than this week's food, 0-1. */
  stockShare: number;
  next: NextMeal[];
}

/**
 * Build the report from a priced shopping list.
 *
 * `packPrice` is already the whole-pack spend and `marginal` the value consumed,
 * so the surplus is exactly their difference — no second pass at pack maths,
 * and no chance of the two views of the same basket disagreeing. Items already
 * in the pantry are skipped: their surplus is not something this plan bought.
 */
export function leftovers(shopping: PricedItem[], firstCook: number): LeftoverReport {
  const lines: LeftoverLine[] = [];

  for (const it of shopping) {
    if (it.packPrice <= 0) continue; // owned already, or free — not this shop's surplus
    const packSize = Math.max(it.packSize, 1);
    const packs = Math.max(1, Math.ceil(it.grams / packSize));
    const gramsBought = packs * packSize;
    const gramsLeft = Math.max(0, gramsBought - it.grams);
    if (gramsLeft < packSize * 0.05) continue; // a rounding crumb, not a leftover
    const value = Math.max(0, it.packPrice - it.marginal);
    lines.push({
      ref: it.ref,
      name: it.name,
      role: it.role,
      packSize,
      packs,
      gramsBought,
      gramsUsed: it.grams,
      gramsLeft: Math.round(gramsLeft * 10) / 10,
      unusedShare: gramsLeft / gramsBought,
      value,
      keeps: KEEPS.includes(it.role),
    });
  }

  lines.sort((a, b) => b.value - a.value);
  const stockLines = lines.filter((l) => l.keeps);
  const perishableLines = lines.filter((l) => !l.keeps);
  const stockValue = stockLines.reduce((a, l) => a + l.value, 0);
  const perishableValue = perishableLines.reduce((a, l) => a + l.value, 0);

  return {
    lines,
    stockLines,
    perishableLines,
    stockValue,
    perishableValue,
    stockShare: firstCook > 0 ? stockValue / firstCook : 0,
    next: [],
  };
}

/**
 * What the surplus could cook next, ranked by how little more it costs.
 *
 * The useful question is not "which recipe uses coriander" — it is "what can I
 * make on Monday for almost nothing because the cupboard is already most of the
 * way there". So dishes are ranked by the money still needed, not by the count
 * of ingredients matched, and the shortfall is itemised rather than summarised:
 * "£2.40 more, and it's the chicken" is actionable in a way that "60% covered"
 * is not.
 */
export function nextFromLeftovers(
  report: LeftoverReport,
  country: CountryProfile,
  tier: number,
  servings: number,
  diets: DietTag[] = [],
  pantry: Set<string> = new Set(),
  pool: Recipe[] = RECIPES,
  limit = 4,
): NextMeal[] {
  const have = new Map<string, number>();
  for (const l of report.lines) have.set(l.ref, l.gramsLeft);

  const out: NextMeal[] = [];

  for (const r of pool) {
    const m = recipeMatches(r, diets);
    if (!m.ok) continue;
    const items = applyVariant(r, m.via ? m.via.id : null).filter((i) => i.ref !== 'water' && !i.optional);
    if (!items.length) continue;

    const scale = servings / Math.max(r.servings, 1);
    let covered = 0;
    let extraCost = 0;
    const missing: { name: string; price: number }[] = [];

    for (const it of items) {
      const n = NUTRIENTS[it.ref];
      if (!n) continue;
      const need = it.grams * scale;
      const stock = have.get(it.ref) ?? 0;
      if (pantry.has(it.ref) || stock >= need) { covered++; continue; }
      const q = quote(it.ref, country, tier);
      if (!q) continue;
      // credit the part the surplus does cover — buying the shortfall still
      // means buying a whole pack, but a half-covered line is not a full miss
      const shortfall = need - stock;
      const price = q.packPrice * Math.max(1, Math.ceil(shortfall / Math.max(n.packSize, 1)));
      extraCost += price;
      missing.push({ name: n.name, price });
    }

    const total = items.length;
    if (total === 0) continue;
    // Require the surplus to be doing real work. Below this it is just a recipe
    // suggestion wearing a leftovers badge.
    if (covered / total < 0.4) continue;

    missing.sort((a, b) => b.price - a.price);
    out.push({
      recipeId: r.id, name: r.name, cuisine: r.cuisine,
      covered, total, extraCost, missing: missing.slice(0, 5), totalMin: r.totalMin,
    });
  }

  out.sort((a, b) => a.extraCost - b.extraCost || b.covered / b.total - a.covered / a.total);
  return out.slice(0, limit);
}

/**
 * The pack-economics sentence.
 *
 * Buying a 1 kg bag of rice for 300 g of dish is not overspending, and the app
 * should stop presenting it as though it were. This states the trade the right
 * way round: what the week costs, what carries forward, and what the second
 * week therefore looks like.
 */
export function packEconomics(
  firstCook: number,
  marginal: number,
  report: LeftoverReport,
  fmt: (n: number) => string,
): { text: string; kind: 'good' | 'warn' }[] {
  const out: { text: string; kind: 'good' | 'warn' }[] = [];
  const carried = report.stockValue;

  if (carried > firstCook * 0.08) {
    out.push({
      kind: 'good',
      text: `${fmt(firstCook)} buys the packs, but ${fmt(carried)} of that is cupboard stock — rice, spices, oil — that does not get eaten this week. Cook the same plan again and the shop is nearer ${fmt(Math.max(marginal, firstCook - carried))}.`,
    });
  }
  if (report.perishableValue > firstCook * 0.06 && report.perishableLines.length) {
    // ingredient names carry a full descriptor ("hen egg, whole raw"); in a
    // sentence only the head noun reads as English
    const worst = report.perishableLines.slice(0, 3).map((l) => l.name.split(',')[0].toLowerCase()).join(', ');
    out.push({
      kind: 'warn',
      text: `${fmt(report.perishableValue)} of the shop is fresh food the plan does not finish — mostly ${worst}. That is the part that actually goes in the bin, so it is worth planning a use for it.`,
    });
  }
  return out;
}
