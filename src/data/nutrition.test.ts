import { describe, expect, it } from 'vitest';
import { RECIPES } from './cookbook';
import { FOODS, UNIT } from './nutrition';
import { canonical, edibleGrams, microRows, perServing, unknownIngredients } from '../lib/nutrition';

/**
 * The cookbook's calorie counts are derived, and these tests are what keeps
 * them that way. Every one of the original fourteen `per` blocks was written by
 * hand and every one was wrong, understating energy by up to sixty-one per cent
 * and never once overstating it. The direction is the tell: totting a recipe up
 * in your head loses the oil, the butter and the tin of coconut milk, and never
 * invents them.
 */
describe('nutrition', () => {
  it('can price every ingredient in the cookbook', () => {
    // The failure this catches is a new recipe naming an ingredient the table
    // has never heard of. Without this it would silently contribute zero
    // calories, which is worse than refusing the recipe.
    for (const r of RECIPES) {
      expect(unknownIngredients(r), `${r.id} uses ingredients with no composition`).toEqual([]);
    }
  });

  it('can turn every written quantity into grams', () => {
    for (const r of RECIPES) {
      for (const item of r.items) {
        expect(() => edibleGrams(item), `${r.id}: "${item.g}" of "${item.n}"`).not.toThrow();
        expect(edibleGrams(item), `${r.id}: ${item.n}`).toBeGreaterThan(0);
      }
    }
  });

  it('matches what the cookbook prints, to the calorie', () => {
    // scripts/nutrition.mjs writes these blocks. If this fails, someone edited
    // a number by hand — rerun it rather than fixing the test.
    for (const r of RECIPES) {
      expect(r.per, `${r.id} is stale — run node scripts/nutrition.mjs`).toEqual(perServing(r));
      expect(r.micro, `${r.id} micro is stale`).toEqual(microRows(r));
    }
  });

  it('lands every dish in the range a plate of food occupies', () => {
    // Not a style rule. A main course under 250 kcal means an ingredient was
    // dropped or a dry weight was entered as cooked; over 1400 means a recipe
    // is being split between too few people. Both have shipped before.
    for (const r of RECIPES) {
      const { kcal } = perServing(r);
      expect(kcal, `${r.name} is ${kcal} kcal a serving`).toBeGreaterThan(250);
      expect(kcal, `${r.name} is ${kcal} kcal a serving`).toBeLessThan(1400);
    }
  });

  it('keeps the macros arithmetically possible', () => {
    // Protein and carbohydrate are 4 kcal a gram, fat is 9. If the sum of the
    // parts is far from the stated energy, one of the four is wrong.
    for (const r of RECIPES) {
      const p = perServing(r);
      const fromMacros = p.protein * 4 + p.carb * 4 + p.fat * 9;
      const drift = Math.abs(fromMacros - p.kcal) / p.kcal;
      expect(drift, `${r.name}: ${p.kcal} kcal vs ${Math.round(fromMacros)} from macros`).toBeLessThan(0.12);
    }
  });

  it('counts things it cannot weigh', () => {
    // A recipe asking for "2" of something with no unit weight would throw at
    // build time; this checks the table stays ahead of the cookbook.
    for (const r of RECIPES) {
      for (const item of r.items) {
        if (/^[\d.]+(\s+[a-z]+)?$/i.test(String(item.g).trim()) && !/\d\s*(g|kg|ml|l|tbsp|tsp)$/i.test(String(item.g))) {
          expect(UNIT[canonical(item.n)], `${r.id}: "${item.n}" is counted but has no unit weight`).toBeDefined();
        }
      }
    }
  });

  it('agrees with a worked example', () => {
    // One recipe checked by hand, so a table-wide error cannot pass by moving
    // the test and the code together. Carbonara is five ingredients and one
    // yield: 200 g spaghetti at 371, 120 g guanciale at 450, 3 eggs of 58 g at
    // 143, 60 g pecorino at 419, and 6 g of peppercorns of which 60% is solids,
    // at 251 — all over two servings.
    const carbonara = RECIPES.find((r) => r.id === 'carbonara')!;
    const byHand = (200 * 3.71 + 120 * 4.5 + 3 * 58 * 1.43 + 60 * 4.19 + 6 * 0.6 * 2.51) / 2;
    expect(Math.abs(perServing(carbonara).kcal - byHand)).toBeLessThan(5);
  });

  it('has a composition table that is not quietly broken', () => {
    // Ethanol carries 7 kcal a gram and has no column here, so anything with
    // drink in it reads as far more energy than its macros can account for.
    // That is the ingredient being right, not the row being wrong. Vanilla
    // extract belongs on this list too — it is about a third alcohol.
    const ALCOHOL = /wine|mirin|beer|cider|sake|rum|brandy|sherry|vermouth|vanilla extract/i;

    for (const [name, row] of Object.entries(FOODS)) {
      expect(row.length, `${name} has ${row.length} columns`).toBe(10);
      for (const n of row) expect(Number.isFinite(n), `${name} has a non-number`).toBe(true);
      const [kcal, protein, carb, fat, fibre] = row;
      // Energy has to be roughly what the macros say, or the row is a typo.
      // Fibre counts inside the carbohydrate figure but yields about 2 kcal a
      // gram rather than 4, which only shows up on the spices: coriander seed
      // is three-quarters fibre by weight and the naive sum overstates it by
      // 44%. Salt and vinegar are minerals and water and fall under the gate.
      const fromMacros = protein * 4 + (carb - fibre) * 4 + fibre * 2 + fat * 9;
      if (kcal > 60 && !ALCOHOL.test(name)) {
        expect(Math.abs(fromMacros - kcal) / kcal, `${name}: ${kcal} vs ${Math.round(fromMacros)}`).toBeLessThan(0.35);
      }
    }
  });
});
