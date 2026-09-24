/**
 * Cautions about one typed cupboard item, against the diets you keep.
 *
 * THE RULE: the app's own diet rules are authoritative, and Jev may only ADD a
 * caution. `itemCautions` starts from what the app's rules say — the same
 * ingredient patterns and audit lists that decide every recipe (lib/diets.ts,
 * lib/diet-audit.js) — and Jev's answers are only ever consulted for diets
 * those rules did not already flag. There is no code path by which an answer
 * from Jev removes, softens or reorders a caution the app raised: a Jev answer
 * of 0 for a diet the app flags changes nothing. jev-diet.test.ts holds that
 * as a property over random answers.
 */
import type { ItemAnswers } from '../../supabase/functions/jev-decide/templates';
import type { Recipe } from '../data/types';
import { breaksDietBecause, meetsDiet, tagContradictions } from './diets';

/** Jev's probability that the item breaks a diet, at or above which the app
 *  adds a "check the label" caution. Low on purpose: a false caution costs a
 *  glance at a packet, a missed one costs somebody their diet. */
export const JEV_CAUTION_MIN = 0.5;

const TAGGED = ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'halal', 'kosher'];

/** 'worcestershire  SAUCE ' -> 'Worcestershire sauce', the cookbook's own
 *  casing, so the exact-name audit lists (Milk, Butter, Ham) match too. */
export function canonicalItem(name: string): string {
  const t = name.replace(/\s+/g, ' ').trim().toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

/**
 * Which of `diets` the app's own rules say this one item breaks — asked of a
 * one-line recipe carrying every tag, so the audit that proves a recipe's tag
 * wrong proves the item wrong for the same diet.
 */
export function appItemCautions(name: string, diets: string[]): string[] {
  const n = canonicalItem(name);
  if (!n) return [];
  const one = { items: [{ n, g: '1', s: 0, src: 'model', opt: false }], tags: TAGGED.slice() } as unknown as Recipe;
  const audit = tagContradictions(one) as Record<string, string[]>;
  return diets.filter((d) => {
    if (TAGGED.indexOf(d) >= 0) {
      return !!audit[d] && audit[d].length > 0;
    }
    return !meetsDiet(one, d) || breaksDietBecause(one, d).length > 0;
  });
}

export interface Caution {
  diet: string;
  /** 'app' — the app's own rules. 'jev' — added by Jev's second opinion. */
  from: 'app' | 'jev';
  /** Jev's probability, for a Jev caution. */
  p?: number;
}

/**
 * Every caution the app's rules raise, in the order of your diets, then any
 * Jev adds for the diets those rules did not flag. `jev` may be null (off,
 * slow, failed): the app's cautions come back unchanged.
 */
export function itemCautions(appFlags: string[], jev: ItemAnswers | null, diets: string[]): Caution[] {
  const out: Caution[] = appFlags.map((diet) => ({ diet, from: 'app' as const }));
  if (!jev) return out;
  for (const d of diets) {
    if (appFlags.indexOf(d) >= 0) continue;
    const p = (jev as Record<string, number | null>)[d];
    if (typeof p === 'number' && p >= JEV_CAUTION_MIN) out.push({ diet: d, from: 'jev', p });
  }
  return out;
}
