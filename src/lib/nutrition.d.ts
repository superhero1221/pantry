import type { Item, Micro, Recipe } from '../data/types';

/** Everything a serving delivers, unrounded — macros plus the six micros. */
export interface Analysis {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  fibre: number;
  iron: number;
  calcium: number;
  b12: number;
  vitc: number;
  salt: number;
}

/** Canonical name for an ingredient string, ignoring the note after the comma. */
export function canonical(name: string): string;
/** Grams a line asks you to buy. Throws on a quantity it cannot read. */
export function gramsOf(item: Item): number;
/** Grams you actually eat, after draining the tin or lifting out the bones. */
export function edibleGrams(item: Item): number;
/** Ingredients in a recipe the composition table has never heard of. */
export function unknownIngredients(recipe: Recipe): string[];
/** Everything a serving delivers. Optional lines are excluded. */
export function analyse(recipe: Recipe): Analysis;
/** The four numbers the card prints, rounded. */
export function perServing(recipe: Recipe): Recipe['per'];
/** The six micronutrient bars, against EU reference values. */
export function microRows(recipe: Recipe): Micro[];
