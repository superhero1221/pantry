export type PriceSource = 'model' | 'euro' | 'local';

export interface Item {
  /** Quantity as it reads on a shopping list — "160 g", "2 tins", "1". */
  g: string;
  /** Canonical English name. Cupboard matching runs on this, never the translation. */
  n: string;
  /** Baseline shelf price in GBP before the store multiplier and country index. */
  s: number;
  src: PriceSource;
  opt: boolean;
}

export interface Micro {
  label: string;
  amount: string;
  pct: number;
  color: string;
}

export interface Step {
  text: string;
  m?: number;
  tip?: string;
  /** A photograph of this step, when one has been shot. Without it the cook
   *  screen draws the technique instead. */
  pic?: string;
}

export interface Recipe {
  id: string;
  name: string;
  local: string;
  cuisine: string;
  code: string;
  pic: string;
  servings: number;
  active: number;
  total: number;
  diff: number;
  diffLabel: string;
  restaurant: number;
  copycat?: string;
  tags: string[];
  per: { kcal: number; protein: number; carb: number; fat: number };
  micro: Micro[];
  items: Item[];
  have: string[];
  keeps: boolean;
  keepTitle: string;
  keepBody: string;
  method: Step[];
}

export interface Country {
  name: string;
  city: string;
  sym: string;
  cur: string;
  /** ISO 4217 code, so a published rate can be matched to the country. */
  iso: string;
  /** Local units per pound, as bundled. A floor for when there is no network,
   *  not a claim about today — see the note above COUNTRIES. */
  fx: number;
  idx: number;
  tier: PriceSource;
}

export interface Store {
  id: string;
  name: string;
  tier: string;
  mult: number;
  /** Only present on shops Overpass actually found — a modelled comparison
   *  card has no honest distance or closing time to print. */
  km?: number;
  closes?: string;
  real?: boolean;
}

export interface TechniqueCard {
  id: string;
  label: string;
  w?: number;
  m?: number;
}

export interface TierRow {
  key: string;
  label: string;
  badgeBg: string;
  badgeFg: string;
}

export interface HistoryRow {
  ago: number;
  id: string;
  name: string;
  code: string;
  cuisine: string;
  spend: number;
  servings: number;
  kcal: number;
  protein: number;
  carb: number;
  diff: number;
  waste: number;
  at: number;
}

export interface Perishable {
  name: string;
  amount: string;
  days: number;
}

export interface PassportRow {
  code: string;
  dish: string;
  country: string;
  times: number;
  price: number;
}

export interface Source {
  name: string;
  use: string;
  licence: string;
  url: string;
}

export interface BrowseCat {
  k: string;
  w: string;
  label: string;
}

export interface Diet {
  id: string;
  label: string;
}
