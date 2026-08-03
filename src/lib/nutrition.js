import { ALIAS, COL, FOODS, MICRO_COLOUR, NRV, UNIT, YIELD } from '../data/nutrition.js';

/**
 * Turning a shopping list into a nutrition card.
 *
 * The cookbook writes quantities the way a person reads them — "160 g", "2",
 * "4 slices", "1 tin", "2 tbsp". Every one of those has to become grams before
 * it can become calories, and the conversion is where a recipe app quietly goes
 * wrong. So this file refuses to guess: an amount it cannot parse or an
 * ingredient it has never heard of throws, and `nutrition.test.ts` runs it over
 * the whole cookbook. A recipe cannot reach the app without a computable
 * nutrition card.
 */

/** Spoons are volume, but for the things measured in them this is close enough. */
const SPOON = { tbsp: 15, tsp: 5, dsp: 10 };

/** Amounts that are a gesture rather than a measurement. */
const GESTURE = { pinch: 0.5, handful: 20, splash: 10, drizzle: 8, dash: 1 };

/** Canonical name for an ingredient string, ignoring the note after the comma. */
export function canonical(name) {
  const head = String(name).split(',')[0].trim();
  return ALIAS[head] ?? (FOODS[head] ? head : (ALIAS[name] ?? name));
}

/**
 * Grams of food in one line of a recipe.
 *
 * `ml` is taken as grams. That is exact for stock and near enough for coconut
 * milk; it overstates oil by about eight per cent, which is why the cookbook
 * weighs oil rather than pouring it.
 */
export function gramsOf(item) {
  const name = canonical(item.n);
  const raw = String(item.g).trim().toLowerCase();

  const weight = raw.match(/^([\d.]+)\s*(g|kg|ml|l)$/);
  if (weight) {
    const n = parseFloat(weight[1]);
    const mult = { g: 1, kg: 1000, ml: 1, l: 1000 }[weight[2]];
    return n * mult;
  }

  const spoon = raw.match(/^([\d.]+)\s*(tbsp|tsp|dsp)$/);
  if (spoon) return parseFloat(spoon[1]) * SPOON[spoon[2]];

  const gesture = raw.match(/^(?:a |an )?(pinch|handful|splash|drizzle|dash)$/);
  if (gesture) return GESTURE[gesture[1]];

  // "2", "4 slices", "1 tin", "2 tins", "3 sprigs" — all counted, so they need
  // a weight per one. A count with no UNIT entry is the failure this throws on.
  const counted = raw.match(/^([\d.]+)(?:\s+[a-z]+)?$/);
  if (counted) {
    const per = UNIT[name];
    if (per === undefined) {
      throw new Error(`no unit weight for "${name}" — it is counted as "${item.g}"`);
    }
    return parseFloat(counted[1]) * per;
  }

  throw new Error(`cannot read the quantity "${item.g}" for "${name}"`);
}

/** Grams of it you actually eat, after draining the tin or lifting out the bones. */
export function edibleGrams(item) {
  const name = canonical(item.n);
  return gramsOf(item) * (YIELD[name] ?? 1);
}

/** Ingredients in a recipe that this table has never heard of. */
export function unknownIngredients(recipe) {
  const missing = [];
  for (const item of recipe.items) {
    const name = canonical(item.n);
    if (!FOODS[name]) missing.push(item.n);
  }
  return missing;
}

/**
 * Everything a recipe delivers, per serving.
 *
 * Optional lines are left out, for the same reason the shopping basket leaves
 * them out: you have not agreed to buy them. Adding the soured cream you did
 * not ask for to the calorie count would make the card wrong for the person who
 * cooked the recipe as written.
 */
export function analyse(recipe) {
  const totals = { kcal: 0, protein: 0, carb: 0, fat: 0, fibre: 0, iron: 0, calcium: 0, b12: 0, vitc: 0, salt: 0 };

  for (const item of recipe.items) {
    if (item.opt) continue;
    const name = canonical(item.n);
    const row = FOODS[name];
    if (!row) throw new Error(`${recipe.id}: no composition for "${item.n}"`);
    const hundreds = edibleGrams(item) / 100;
    for (const key of Object.keys(totals)) totals[key] += row[COL[key]] * hundreds;
  }

  const servings = recipe.servings || 1;
  const each = {};
  for (const key of Object.keys(totals)) each[key] = totals[key] / servings;
  return each;
}

/** The four big numbers, rounded the way the card prints them. */
export function perServing(recipe) {
  const a = analyse(recipe);
  return {
    kcal: Math.round(a.kcal),
    protein: Math.round(a.protein),
    carb: Math.round(a.carb),
    fat: Math.round(a.fat),
  };
}

const ROWS = [
  ['Fibre', 'fibre', 'g', 1],
  ['Iron', 'iron', 'mg', 1],
  ['Calcium', 'calcium', 'mg', 0],
  ['Vitamin B12', 'b12', 'µg', 1],
  ['Vitamin C', 'vitc', 'mg', 0],
  ['Salt', 'salt', 'g', 1],
];

/** The six micronutrient bars, against EU reference values. */
export function microRows(recipe) {
  const a = analyse(recipe);
  return ROWS.map(([label, key, unit, dp]) => {
    const amount = a[key];
    return {
      label,
      amount: `${amount.toFixed(dp)} ${unit}`,
      pct: Math.round((amount / NRV[key]) * 100),
      color: MICRO_COLOUR[label],
    };
  });
}
