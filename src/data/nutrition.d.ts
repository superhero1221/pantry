/** kcal, protein, carb, fat, fibre, iron, calcium, B12, vitC, salt — per 100 g. */
export type FoodRow = [number, number, number, number, number, number, number, number, number, number];

export const FOODS: Record<string, FoodRow>;
/** Grams in one of the things a recipe counts rather than weighs. */
export const UNIT: Record<string, number>;
/** Fraction of the listed weight that is edible — a drained tin, a stock bone. */
export const YIELD: Record<string, number>;
/** Names that mean the same food, for kitchens saved before canonicalisation. */
export const ALIAS: Record<string, string>;
/** EU nutrient reference values, the denominator under every micro row. */
export const NRV: Record<'fibre' | 'iron' | 'calcium' | 'b12' | 'vitc' | 'salt', number>;
export const COL: Record<string, number>;
export const MICRO_COLOUR: Record<string, string>;
