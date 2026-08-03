import type { Recipe } from '../data/types';

/**
 * Tags a recipe claims that its own ingredients contradict, as a map of tag
 * name to the ingredients that disprove it. Empty means nothing was caught,
 * which is not the same as the tags being right.
 */
export function tagContradictions(recipe: Recipe): Record<string, string[]>;
