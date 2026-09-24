/**
 * The three pure mappings from Jev's answers to what the app does, including
 * the fail-safe property: Jev can add a diet caution and never remove one.
 */
import { describe, expect, it } from 'vitest';
import { DIETS, RECIPES } from '../data/cookbook';
import type { CravingAnswers, ItemAnswers } from '../../supabase/functions/jev-decide/templates';
import { cravingPlan, isComforting, isSpicy, leanScore, QUICK_MINUTES } from './jev-craving';
import { appItemCautions, itemCautions, JEV_CAUTION_MIN } from './jev-diet';
import { priceCheck, suggestFix } from './jev-price';

const CUISINES = Array.from(new Set(RECIPES.map((r) => r.cuisine)));
const BUDGETS = [3, 5, 6, 8, 12];
const none = { quick: null, cheap: null, comforting: null, light: null, high_protein: null, spicy: null, vegetarian_leaning: null };
const ans = (intents: Partial<CravingAnswers['intents']>, cuisine: string | null = 'none_or_unclear', c = 0.9): CravingAnswers => ({
  cuisine,
  cuisine_confidence: c,
  intents: { ...none, ...intents },
});

describe('craving -> the app’s own filters', () => {
  it('"something cosy and quick": time capped, comfort lean, query cleared', () => {
    const p = cravingPlan(ans({ quick: 0.96, comforting: 0.91, cheap: 0.2 }), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS);
    expect(p).toEqual({
      intents: ['quick', 'comforting'],
      cuisine: null,
      set: { query: '', maxTime: QUICK_MINUTES },
      lean: { comforting: true },
    });
  });

  it('a confident cuisine narrows through the query; an unsure one does not', () => {
    expect(cravingPlan(ans({}, 'italian', 0.8), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)?.set.query).toBe('Italian');
    expect(cravingPlan(ans({}, 'north_african', 0.8), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)?.cuisine).toBe('North African');
    expect(cravingPlan(ans({}, 'italian', 0.4), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)).toBeNull();
    expect(cravingPlan(ans({}, 'klingon', 0.99), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)).toBeNull();
  });

  it('cheap steps the budget down one preset, never below the lowest', () => {
    expect(cravingPlan(ans({ cheap: 0.9 }), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)?.set.budget).toBe(5);
    expect(cravingPlan(ans({ cheap: 0.9 }), { maxTime: 60, budget: 7.5 }, CUISINES, BUDGETS)?.set.budget).toBe(6);
    expect(cravingPlan(ans({ cheap: 0.9 }), { maxTime: 60, budget: 3 }, CUISINES, BUDGETS)?.set.budget).toBeUndefined();
  });

  it('quick never loosens a tighter time budget', () => {
    expect(cravingPlan(ans({ quick: 0.9 }), { maxTime: 15, budget: 6 }, CUISINES, BUDGETS)?.set.maxTime).toBeUndefined();
  });

  it('nothing confident, or no answer at all, is no plan — today’s behaviour', () => {
    expect(cravingPlan(null, { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)).toBeNull();
    expect(cravingPlan(ans({ quick: 0.69, spicy: 0.5 }), { maxTime: 60, budget: 6 }, CUISINES, BUDGETS)).toBeNull();
  });

  it('leans reorder by the recipe’s own facts', () => {
    const spicy = RECIPES.filter(isSpicy);
    const comfort = RECIPES.filter(isComforting);
    expect(spicy.length).toBeGreaterThan(10);
    expect(comfort.length).toBeGreaterThan(10);
    const r = RECIPES.find((x) => x.name === 'Chilli con Carne')!;
    expect(leanScore(r, { spicy: true }, 1)).toBeLessThan(0);
    expect(leanScore(r, {}, 1)).toBe(0);
  });
});

describe('pantry item -> cautions (the fail-safe)', () => {
  const ALL = DIETS.map((d) => d.id);

  it('the app’s own rules flag what they already know', () => {
    expect(appItemCautions('bacon', ALL).sort()).toEqual(['halal', 'kosher', 'no_pork', 'vegan', 'vegetarian'].sort());
    expect(appItemCautions('Milk', ['vegan', 'dairy_free', 'vegetarian'])).toEqual(['vegan', 'dairy_free']);
    expect(appItemCautions('peanut butter', ['nut_free', 'dairy_free'])).toEqual(['nut_free']);
    expect(appItemCautions('red wine', ['no_alcohol', 'halal'])).toEqual(['no_alcohol', 'halal']);
    expect(appItemCautions('Worcestershire sauce', ['vegan', 'vegetarian'])).toEqual([]);
  });

  it('Jev adds "check the label" for a diet the rules missed', () => {
    const jev = { vegan: 0.93, vegetarian: 0.88 } as ItemAnswers;
    const c = itemCautions(appItemCautions('Worcestershire sauce', ['vegan']), jev, ['vegan']);
    expect(c).toEqual([{ diet: 'vegan', from: 'jev', p: 0.93 }]);
  });

  it('Jev at 0 for a diet the rules flag changes nothing', () => {
    const zero = Object.fromEntries(ALL.map((d) => [d, 0])) as unknown as ItemAnswers;
    const app = appItemCautions('bacon', ALL);
    expect(itemCautions(app, zero, ALL)).toEqual(app.map((diet) => ({ diet, from: 'app' })));
    expect(itemCautions(app, null, ALL)).toEqual(app.map((diet) => ({ diet, from: 'app' })));
  });

  it('PROPERTY: over random items, diets and answers, every app caution survives, first and unchanged', () => {
    // Deterministic PRNG so a failure reproduces.
    let s = 12345;
    const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const words = RECIPES.flatMap((r) => r.items.map((i) => i.n)).concat(['Worcestershire sauce', 'gelatine sweets', 'beer', 'honey', 'cashews', '']);
    for (let t = 0; t < 3000; t++) {
      const item = words[Math.floor(rnd() * words.length)];
      const diets = ALL.filter(() => rnd() < 0.5);
      const answers =
        rnd() < 0.1
          ? null
          : (Object.fromEntries(ALL.map((d) => [d, rnd() < 0.15 ? null : rnd() < 0.3 ? 0 : rnd()])) as unknown as ItemAnswers);
      const app = appItemCautions(item, diets);
      const out = itemCautions(app, answers, diets);
      // Superset, with the app's cautions first, in order, still marked as the app's.
      expect(out.slice(0, app.length)).toEqual(app.map((diet) => ({ diet, from: 'app' })));
      // Anything added is Jev's, for a kept diet the app did not flag, at or over the line.
      for (const c of out.slice(app.length)) {
        expect(c.from).toBe('jev');
        expect(diets).toContain(c.diet);
        expect(app).not.toContain(c.diet);
        expect(c.p!).toBeGreaterThanOrEqual(JEV_CAUTION_MIN);
      }
      // And nothing Jev says can shrink the list below what the app said.
      expect(out.length).toBeGreaterThanOrEqual(app.length);
    }
  });
});

describe('price report -> ask before sending', () => {
  it('asks when Jev calls it implausible, and suggests the slipped zero', () => {
    const c = priceCheck({ plausible: 0.02, error: 'extra_zero_or_decimal_slip', error_confidence: 0.6 }, 390, 3.9, 500);
    expect(c.ask).toBe(true);
    expect(c.ratio).toBeCloseTo(100);
    expect(c.suggestion).toBeCloseTo(3.9);
  });

  it('asks when Jev names a mistake with confidence over 0.8, even if not sure it is implausible', () => {
    expect(priceCheck({ plausible: 0.5, error: 'per_kg_vs_pack', error_confidence: 0.85 }, 8, 2, 250).ask).toBe(true);
    expect(priceCheck({ plausible: 0.5, error: 'per_kg_vs_pack', error_confidence: 0.8 }, 8, 2, 250).ask).toBe(false);
    expect(priceCheck({ plausible: 0.5, error: 'none', error_confidence: 0.99 }, 8, 2, 250).ask).toBe(false);
  });

  it('never asks without an answer, and never on a plausible price', () => {
    expect(priceCheck(null, 900, 1, 500).ask).toBe(false);
    expect(priceCheck({ plausible: 0.2, error: null, error_confidence: null }, 900, 1, 500).ask).toBe(false);
    expect(priceCheck({ plausible: 0.95, error: 'none', error_confidence: 0.9 }, 4, 3.9, 500).ask).toBe(false);
  });

  it('suggests only what lands near the usual price', () => {
    expect(suggestFix(4.99, 0.5, 500, 'extra_zero_or_decimal_slip')).toBeCloseTo(0.499);
    expect(suggestFix(8, 2, 250, 'per_kg_vs_pack')).toBe(2);
    expect(suggestFix(37, 1, 500, 'wrong_currency')).toBeNull();
  });
});
