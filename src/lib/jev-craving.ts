/**
 * What a craving Jev has read turns into, in the app's own terms.
 *
 * Pure: answers and the current settings in, a plan out. usePantry applies it
 * through the fields that already exist — the typed query (which is what
 * already narrows Tonight to a cuisine), the time budget and the money budget
 * — so the refine panel's own chips light up to show what changed, and one
 * undo puts every one of them back.
 *
 * The four intents with no field of their own (comforting, light, high
 * protein, spicy, meat-free) become a ranking lean: a few points in ranked()'s
 * existing score, the same size as the goal nudges already there. A lean never
 * touches the diet partition or the time line, so it can reorder what is
 * allowed but never let in what is not.
 */
import type { CravingAnswers, Intent } from '../../supabase/functions/jev-decide/templates';
import type { Recipe } from '../data/types';

/** A yes/no this likely before it counts as asked for. */
export const INTENT_MIN = 0.7;
/** A cuisine this confident before it narrows the pool. */
export const CUISINE_MIN = 0.6;
/** "Quick" means this many minutes at most. */
export const QUICK_MINUTES = 30;

/** Intents in the order the chip reads them. */
export const CHIP_ORDER: Intent[] = ['quick', 'cheap', 'comforting', 'light', 'high_protein', 'spicy', 'vegetarian_leaning'];

export type Lean = Partial<Record<'cheap' | 'comforting' | 'light' | 'high_protein' | 'spicy' | 'vegetarian_leaning', true>>;

export interface CravingPlan {
  /** What the chip says was understood: intents first, then the cuisine. */
  intents: Intent[];
  /** The cookbook's own cuisine name, or null. */
  cuisine: string | null;
  /** New values for existing state fields. Absent means unchanged. */
  set: { query: string; maxTime?: number; budget?: number };
  lean: Lean;
}

/** 'North African' -> 'north_african': the function's choice labels. */
export const cuisineKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

/**
 * Null when nothing was read with enough confidence to act on — the caller
 * then leaves the app exactly as it was.
 */
export function cravingPlan(
  a: CravingAnswers | null,
  now: { maxTime: number; budget: number },
  cuisines: string[],
  budgets: number[],
): CravingPlan | null {
  if (!a) return null;
  const intents = CHIP_ORDER.filter((k) => (a.intents[k] ?? 0) >= INTENT_MIN);
  const byKey = new Map(cuisines.map((c) => [cuisineKey(c), c]));
  const cuisine =
    a.cuisine && a.cuisine !== 'none_or_unclear' && (a.cuisine_confidence ?? 0) >= CUISINE_MIN ? byKey.get(a.cuisine) ?? null : null;
  if (!intents.length && !cuisine) return null;

  const set: CravingPlan['set'] = { query: cuisine ?? '' };
  if (intents.includes('quick') && now.maxTime > QUICK_MINUTES) set.maxTime = QUICK_MINUTES;
  if (intents.includes('cheap')) {
    // One preset down from where the budget stands, never below the lowest.
    const lower = budgets.filter((b) => b < now.budget - 1e-9);
    const next = lower.length ? Math.max(...lower) : null;
    if (next !== null) set.budget = next;
  }
  const lean: Lean = {};
  for (const k of intents) if (k !== 'quick') lean[k] = true;
  return { intents, cuisine, set, lean };
}

const SPICY = /\b(chill?i(es)?|chillies|chili|habanero|scotch bonnet|jalape\w*|gochujang|gochugaru|berbere|harissa|doubanjiang|sambal|sriracha|cayenne)\b/i;
const COMFORT =
  /\b(stew|pie|curry|soup|bake|cheese|hotpot|risotto|dal|dhal|chilli con carne|bolognese|ragu|mash|gumbo|jambalaya|biryani|nihari|masala|tagine|wot|jjigae|laksa|pho|harira|fagioli|minestrone|toad in the hole|moussaka|parmigiana|katsu|mac(aroni)?)\b/i;

export const isSpicy = (r: Recipe) => r.items.some((i) => SPICY.test(i.n));
export const isComforting = (r: Recipe) => COMFORT.test(r.name);

/**
 * Points for ranked()'s score: lower sorts earlier. `perServing` is the dish's
 * cost per serving in the base currency, the same figure the 'cheap' goal
 * reads. light and high_protein are the 'lose' and 'muscle' goal terms,
 * reused rather than invented.
 */
export function leanScore(r: Recipe, lean: Lean, perServing: number): number {
  let s = 0;
  if (lean.cheap) s += perServing * 12;
  if (lean.light) s += Math.max(0, r.per.kcal - 520) * 0.09;
  if (lean.high_protein) s -= Math.min(45, r.per.protein * 1.1);
  if (lean.spicy && isSpicy(r)) s -= 30;
  if (lean.comforting && isComforting(r)) s -= 30;
  if (lean.vegetarian_leaning && r.tags.indexOf('vegetarian') >= 0) s -= 30;
  return s;
}
