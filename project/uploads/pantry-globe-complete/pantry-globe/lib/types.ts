// ============ CORE TYPES — the contract for all bundled data ============

/** Nutrients per 100 g (or 100 ml for liquids). All numbers, no nulls. */
export interface Nutrient {
  id: string;            // snake_case unique key
  name: string;          // display name
  kcal: number;
  protein: number;       // g
  carb: number;          // g
  fat: number;           // g
  fibre: number;         // g
  iron: number;          // mg
  calcium: number;       // mg
  b12: number;           // µg
  zinc: number;          // mg
  vitA: number;          // µg RAE
  vitC: number;          // mg
  sodium: number;        // mg
  potassium: number;     // mg
  /** Ingredient role — drives the substitution graph. */
  role: IngredientRole;
  /** Reference price in GBP for the SMALLEST typical retail pack. */
  packPriceGBP: number;
  /** Size of that smallest pack, in g/ml. */
  packSize: number;
  /** Dietary tags for filtering. */
  tags: DietTag[];
}

export type IngredientRole =
  | 'protein' | 'dairy' | 'fat' | 'starch' | 'vegetable' | 'fruit'
  | 'aromatic' | 'spice' | 'acid' | 'liquid' | 'sweetener' | 'nut' | 'pulse' | 'condiment';

export type DietTag =
  | 'vegan' | 'vegetarian' | 'halal' | 'kosher' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'pork' | 'alcohol';

/** One line in a recipe. */
export interface RecipeItem {
  ref: string;           // Nutrient.id
  grams: number;         // for the recipe's base servings
  note?: string;         // "finely diced", "off the heat"
  optional?: boolean;
  /**
   * Fraction of `grams` that actually ends up eaten. Default 1.
   * Deep-frying oil is the case that matters: you buy 500 g and eat ~40 g.
   * Nutrition uses grams * absorption; PRICING always uses the full grams,
   * because you still have to buy the whole bottle.
   */
  absorption?: number;
}

export interface MethodStep {
  n: number;
  text: string;
  minutes?: number;
  tip?: string;          // beginner-facing warning or cue
}

/** A swap the engine offers for this dish. */
export interface Variant {
  id: string;
  label: string;
  /** Replace ingredient A with B. `to: null` removes it. */
  swaps: { from: string; to: string | null; grams?: number }[];
  /** How the method must change — the piece most apps skip. */
  methodDeltas: { step: number; change: string }[];
  tags: DietTag[];
  note?: string;
}

export interface Recipe {
  id: string;
  name: string;
  localName?: string;    // native-script or transliterated name
  cuisine: string;
  country: string;       // ISO-3166-1 alpha-2 of origin
  blurb: string;
  servings: number;      // what `grams` refer to
  activeMin: number;
  totalMin: number;
  difficulty: 'easy' | 'easy-medium' | 'medium' | 'hard';
  items: RecipeItem[];
  method: MethodStep[];
  failures: { symptom: string; cause: string }[];
  variants: Variant[];
  /** Typical restaurant/delivery price for one portion, in GBP, for the savings calc. */
  restaurantGBP: number;
  tags: DietTag[];
}

// ============ COMPUTED / RUNTIME ============

export interface NutritionTotals {
  kcal: number; protein: number; carb: number; fat: number; fibre: number;
  iron: number; calcium: number; b12: number; zinc: number;
  vitA: number; vitC: number; sodium: number; potassium: number;
}

export interface Store {
  id: string;
  name: string;
  kind: string;              // supermarket | convenience | greengrocer | butcher | ...
  brand?: string;
  lat: number;
  lon: number;
  distanceKm: number;
  openNow: boolean | null;   // null = hours unknown
  hoursRaw?: string;
  closesAt?: string;
  minutesUntilClose?: number;
  /** Price tier multiplier applied on top of the country index. */
  tier: number;
  tierLabel: 'discount' | 'standard' | 'convenience' | 'premium' | 'independent';
}

export interface CountryProfile {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  /** GBP -> local currency. Approximate, bundled, clearly labelled. */
  fx: number;
  /** Grocery cost index vs UK = 1.00 */
  index: number;
  /** Restaurant cost index vs UK = 1.00 */
  restaurantIndex: number;
}

export interface PricedItem {
  ref: string;
  name: string;
  grams: number;
  packSize: number;
  packPrice: number;      // local currency, at chosen store
  marginal: number;       // local currency, only what the dish uses
  role: IngredientRole;
  optional: boolean;
  note?: string;
  /**
   * Where this number came from:
   *   'local'    measured at markets in this country
   *   'real'     measured, but mostly in Europe, then scaled to here
   *   'estimate' modelled from a reference price
   */
  source: 'local' | 'real' | 'estimate';
  /** Observations behind a real price; 0 for estimates. */
  obs: number;
  confidence: 'high' | 'medium' | 'low';
}
