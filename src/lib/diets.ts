import type { Recipe } from '../data/types';

/**
 * Whether a recipe meets a diet.
 *
 * The cookbook tags six diets by hand — vegan, vegetarian, gluten free, dairy
 * free, halal and kosher — and those tags are the answer where they exist.
 * Three more are offered in the picker with no tag on any recipe: nut free, no
 * pork and no alcohol. Before this file they were accepted and then silently
 * ignored, so ticking "Nut free" still returned Pad Thai and its roasted
 * peanuts. Those three are derived from the ingredient list instead.
 *
 * What a derived answer can and cannot do, stated plainly because the Diet
 * screen says the same thing to the user: it reads the ingredients a recipe
 * asks you to buy. It cannot see what a factory put in a jar of curry powder,
 * it cannot see a shared production line, and it does not know what happened
 * to the pan before you got there. It is a filter, not an allergen guarantee.
 */

/** Diets the cookbook tags itself. The tag is authoritative. */
const TAGGED = ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'halal', 'kosher'];

/**
 * An ingredient matching one of these disqualifies the recipe from that diet.
 *
 * Written as whole words so `nutmeg` and `butternut` are not read as nuts, and
 * with each nut named rather than leaning on a bare `nut`, because `peanut` and
 * `hazelnut` end in it and a boundary would miss them.
 *
 * Coconut is in the nut list deliberately. Botanically it is a drupe and many
 * people with a nut allergy eat it safely — but it is labelled a tree nut in
 * the US, and for a filter whose failure mode is an allergic reaction the
 * cautious answer is the right one. It costs a nut-free cook one curry.
 */
const DISQUALIFIES: Record<string, RegExp> = {
  nut_free:
    /\b(nuts?|peanuts?|almonds?|cashews?|pistachios?|walnuts?|pecans?|hazelnuts?|macadamias?|coconut|praline|marzipan|nut butter|tahini)\b/i,
  no_pork: /\b(pork|bacon|ham|gammon|lardons?|pancetta|guanciale|chorizo|prosciutto|salami|lard)\b/i,
  no_alcohol:
    /\b(wine|beer|lager|ale|stout|cider|mirin|sake|rum|brandy|vodka|whisky|whiskey|sherry|vermouth|marsala|kirsch)\b/i,
};

/** Every diet this file can actually answer for. */
export const ENFORCEABLE = TAGGED.concat(Object.keys(DISQUALIFIES));

/** The three answered by reading ingredients rather than by a tag. */
export const DERIVED = Object.keys(DISQUALIFIES);

export function meetsDiet(recipe: Recipe, diet: string): boolean {
  if (TAGGED.indexOf(diet) >= 0) return recipe.tags.indexOf(diet) >= 0;
  const bad = DISQUALIFIES[diet];
  // A diet nothing can answer for must not quietly exclude every dish.
  if (!bad) return true;
  return !recipe.items.some((i) => bad.test(i.n));
}

/** The ingredients that put a recipe out of a diet, for saying so on screen. */
export function breaksDietBecause(recipe: Recipe, diet: string): string[] {
  const bad = DISQUALIFIES[diet];
  if (!bad) return [];
  return recipe.items.filter((i) => bad.test(i.n)).map((i) => i.n);
}

export { tagContradictions } from './diet-audit';
