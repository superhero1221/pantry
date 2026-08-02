import { NUTRIENTS } from './nutrients';
import { quote, coverage, type Coverage } from './prices';
import { RECIPES_A } from './recipes-a';
import { RECIPES_B } from './recipes-b';
import { RECIPES_C } from './recipes-c';
import { RECIPES_D } from './recipes-d';
import type {
  Recipe, RecipeItem, NutritionTotals, CountryProfile, PricedItem, Store, DietTag, Variant,
} from './types';

export const RECIPES: Recipe[] = [...RECIPES_A, ...RECIPES_B, ...RECIPES_C, ...RECIPES_D];
export const byId = (id: string) => RECIPES.find((r) => r.id === id);

const ZERO: NutritionTotals = {
  kcal: 0, protein: 0, carb: 0, fat: 0, fibre: 0, iron: 0, calcium: 0,
  b12: 0, zinc: 0, vitA: 0, vitC: 0, sodium: 0, potassium: 0,
};

/** Apply a variant's swaps to a recipe's item list. */
export function applyVariant(recipe: Recipe, variantId: string | null): RecipeItem[] {
  const v = recipe.variants.find((x) => x.id === variantId);
  if (!v) return recipe.items;
  let items = recipe.items.map((i) => ({ ...i }));
  for (const s of v.swaps) {
    if (s.to === null) { items = items.filter((i) => i.ref !== s.from); continue; }
    const idx = items.findIndex((i) => i.ref === s.from);
    if (idx >= 0) items[idx] = { ...items[idx], ref: s.to, grams: s.grams ?? items[idx].grams, note: undefined, absorption: undefined };
    else items.push({ ref: s.to, grams: s.grams ?? 50 });
  }
  // merge duplicate refs
  const merged = new Map<string, RecipeItem>();
  for (const i of items) {
    const e = merged.get(i.ref);
    if (e) e.grams += i.grams;
    else merged.set(i.ref, { ...i });
  }
  return [...merged.values()];
}

/** Nutrition PER SERVING, scaled from the recipe's base servings to `servings`. */
export function nutrition(items: RecipeItem[], baseServings: number, includeOptional = true): NutritionTotals {
  const t: NutritionTotals = { ...ZERO };
  for (const it of items) {
    if (it.optional && !includeOptional) continue;
    const n = NUTRIENTS[it.ref];
    if (!n) continue;
    const f = (it.grams * (it.absorption ?? 1)) / 100;
    t.kcal += n.kcal * f; t.protein += n.protein * f; t.carb += n.carb * f; t.fat += n.fat * f;
    t.fibre += n.fibre * f; t.iron += n.iron * f; t.calcium += n.calcium * f; t.b12 += n.b12 * f;
    t.zinc += n.zinc * f; t.vitA += n.vitA * f; t.vitC += n.vitC * f;
    t.sodium += n.sodium * f; t.potassium += n.potassium * f;
  }
  const k = 1 / Math.max(baseServings, 1);
  return Object.fromEntries(Object.entries(t).map(([a, b]) => [a, b * k])) as unknown as NutritionTotals;
}

/** UK reference nutrient intakes, adult. Used for % RNI badges. */
export const RNI = {
  fibre: 30, iron: 8.7, calcium: 700, b12: 1.5, zinc: 9.5,
  vitA: 700, vitC: 40, sodium: 2400, potassium: 3500,
} as const;

export interface Basket {
  items: PricedItem[];
  firstCook: number;   // buy every pack
  marginal: number;    // only what's consumed
  perServing: number;
  missing: string[];
  coverage: Coverage;
}

/**
 * Price a basket. Each line resolves through lib/prices.ts, which prefers real
 * community-measured prices and falls back to the estimate model — and reports
 * which it used, per item.
 */
export function priceBasket(
  items: RecipeItem[],
  country: CountryProfile,
  tier: number,
  servings: number,
  baseServings: number,
  pantry: Set<string>,
): Basket {
  const scale = servings / Math.max(baseServings, 1);
  const out: PricedItem[] = [];
  const missing: string[] = [];
  let firstCook = 0, marginal = 0;

  for (const it of items) {
    const n = NUTRIENTS[it.ref];
    if (!n) { missing.push(it.ref); continue; }
    if (it.ref === 'water') continue; // nobody shops for tap water
    const grams = it.grams * scale;
    const q = quote(it.ref, country, tier);
    if (!q) { missing.push(it.ref); continue; }
    const packsNeeded = Math.max(1, Math.ceil(grams / Math.max(n.packSize, 1)));
    const packPrice = q.packPrice * packsNeeded;
    const marg = q.packPrice * Math.min(grams / Math.max(n.packSize, 1), packsNeeded);
    const owned = pantry.has(it.ref);
    out.push({
      ref: it.ref, name: n.name, grams: Math.round(grams * 10) / 10,
      packSize: n.packSize, packPrice: owned ? 0 : packPrice, marginal: marg,
      role: n.role, optional: !!it.optional, note: it.note,
      source: q.source, obs: q.n, confidence: q.confidence,
    });
    if (!owned) firstCook += packPrice;
    marginal += marg;
  }
  out.sort((a, b) => b.marginal - a.marginal);
  return {
    items: out, firstCook, marginal,
    perServing: marginal / Math.max(servings, 1), missing,
    coverage: coverage(out),
  };
}

/** Rank stores: open now first, then price tier, then distance. */
export function rankStores(stores: Store[]): Store[] {
  return [...stores].sort((a, b) => {
    const ao = a.openNow === true ? 0 : a.openNow === null ? 1 : 2;
    const bo = b.openNow === true ? 0 : b.openNow === null ? 1 : 2;
    if (ao !== bo) return ao - bo;
    const at = a.tier * 10 + a.distanceKm * 0.6;
    const bt = b.tier * 10 + b.distanceKm * 0.6;
    return at - bt;
  });
}

export function dietOk(tags: DietTag[], filters: DietTag[]): boolean {
  return filters.every((f) => tags.includes(f));
}

/** Recipe passes a diet filter if the base recipe OR any variant satisfies it. */
export function recipeMatches(r: Recipe, filters: DietTag[]): { ok: boolean; via: Variant | null } {
  if (!filters.length) return { ok: true, via: null };
  if (dietOk(r.tags, filters)) return { ok: true, via: null };
  const v = r.variants.find((x) => dietOk(x.tags, filters));
  return { ok: !!v, via: v ?? null };
}

/**
 * What one ingredient can be swapped to, and which variant does it.
 *
 * Variants are currently all-or-nothing chips with labels like "Leaner, more
 * beans" — which is how the data is shaped, not how anyone thinks. Nobody wants
 * a variant; they want the chicken to be salmon. This inverts it: ask what an
 * ingredient can become and the answer comes back with the variant that
 * achieves it, so the choice is made on the thing being replaced rather than on
 * a name for a bundle of changes.
 */
export interface SwapOption {
  /** Ingredient it becomes, or null when the variant simply drops it. */
  to: string | null;
  toName: string;
  grams: number | null;
  variantId: string;
  variantLabel: string;
  /** Everything else that variant changes, so nothing happens invisibly. */
  alsoChanges: string[];
  note?: string;
}

export function swapsFor(r: Recipe, ref: string): SwapOption[] {
  const out: SwapOption[] = [];
  for (const v of r.variants) {
    const sw = v.swaps.find((x) => x.from === ref);
    if (!sw) continue;
    const others = v.swaps
      .filter((x) => x !== sw && x.from)
      .map((x) => {
        const from = NUTRIENTS[x.from]?.name?.split(',')[0] ?? x.from;
        const to = x.to ? NUTRIENTS[x.to]?.name?.split(',')[0] ?? x.to : null;
        return to ? `${from} → ${to}` : `no ${from.toLowerCase()}`;
      });
    out.push({
      to: sw.to,
      toName: sw.to ? NUTRIENTS[sw.to]?.name ?? sw.to : 'left out',
      grams: sw.grams ?? null,
      variantId: v.id,
      variantLabel: v.label,
      alsoChanges: others,
      note: v.note,
    });
  }
  return out;
}

/**
 * The method as it applies to a given variant, with the swaps spelled out.
 *
 * A variant that replaces feta with beef leaves every step that says "crumble
 * over the feta" quietly wrong, and hand-writing a correction for each of them
 * across 58 variants is both enormous and impossible to keep true — an audit
 * found over two hundred such steps. So the notices are generated: any step
 * naming an ingredient the variant swapped out gets one automatically, and a
 * hand-written delta always wins where the change is more than substitution.
 *
 * Generated notices are marked as such, because "use X instead of Y" is a
 * mechanical fact, while "and give it eight minutes longer" is a judgement
 * someone made, and the reader deserves to know which they are reading.
 */
export interface StepNote { step: number; change: string; generated: boolean }

const headWords = (ref: string): string[] =>
  (NUTRIENTS[ref]?.name ?? '').split(',')[0].toLowerCase().replace(/\s*\(.*\)/, '')
    .split(/\s+/).filter((w) => w.length > 3);

/** Does this step's text actually refer to that ingredient? */
function stepNames(text: string, ref: string): boolean {
  const w = headWords(ref);
  if (!w.length) return false;
  const t = text.toLowerCase();
  return w.some((x) => t.includes(x.replace(/s$/, '').slice(0, 7)));
}

export function methodNotes(r: Recipe, variantId: string | null): StepNote[] {
  const v = r.variants.find((x) => x.id === variantId);
  if (!v) return [];
  const out: StepNote[] = v.methodDeltas.map((d) => ({ step: d.step, change: d.change, generated: false }));
  const written = new Set(out.map((d) => d.step));

  for (const sw of v.swaps) {
    if (!sw.from || !r.items.some((i) => i.ref === sw.from)) continue;
    const fromName = NUTRIENTS[sw.from]?.name?.split(',')[0];
    if (!fromName) continue;
    // a same-noun swap (thigh for breast) does not make the step wrong
    if (sw.to && headWords(sw.from).some((w) => headWords(sw.to as string).includes(w))) continue;
    const toName = sw.to ? NUTRIENTS[sw.to]?.name?.split(',')[0] : null;

    for (const st of r.method) {
      if (written.has(st.n)) continue;
      if (!stepNames(`${st.text} ${st.tip ?? ''}`, sw.from)) continue;
      out.push({
        step: st.n,
        change: toName
          ? `Where this says ${fromName.toLowerCase()}, use the ${toName.toLowerCase()} instead.`
          : `Skip the ${fromName.toLowerCase()} — this version does not use it.`,
        generated: true,
      });
      written.add(st.n);
    }
  }
  return out.sort((a, b) => a.step - b.step);
}

/**
 * Storage advice, where getting it wrong makes someone ill.
 *
 * The app promotes leftovers and prices a cupboard that carries forward, so it
 * has a duty to say how to keep the food. Cooked rice is the case that matters:
 * Bacillus cereus spores survive cooking and germinate at room temperature, and
 * six of these dishes produce a lot of it. This is derived from the ingredient
 * list rather than written per recipe so a new rice dish cannot be added
 * without it.
 */
const RICEY = ['basmati_rice', 'long_grain_rice', 'jasmine_rice', 'couscous'];
export function storageAdvice(items: RecipeItem[]): { text: string; kind: 'warn' } | null {
  if (!items.some((i) => RICEY.includes(i.ref))) return null;
  return {
    kind: 'warn',
    text: 'Leftover rice: cool it within an hour — spread it out, do not leave the pan on the hob — then fridge it and eat within a day. Reheat once only, until it is steaming hot all the way through. The spores that cause the problem survive cooking, so this is about how it is cooled, not how well it was cooked.',
  };
}

export function restaurantPrice(r: Recipe, c: CountryProfile): number {
  return r.restaurantGBP * c.restaurantIndex * c.fx;
}
