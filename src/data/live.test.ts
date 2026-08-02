import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain JS module, no declarations for the helper
import { normaliseIngredient } from './pantry-live.js';
import { RECIPES } from './cookbook';

/**
 * The normaliser decides which Open Prices category a recipe line is looked up
 * under. A miss is harmless — the app falls back to the modelled figure. A
 * WRONG match is not: it puts a real price on the wrong product and the basket
 * total is confidently incorrect. These guard that direction.
 */
describe('Open Prices ingredient matching', () => {
  it('strips cooking qualifiers to reach the plain product', () => {
    expect(normaliseIngredient('Raw prawns, peeled')).toBe('Prawns');
    expect(normaliseIngredient('Firm tofu')).toBe('Tofu');
    expect(normaliseIngredient('Mature cheddar')).toBe('Cheddar');
    expect(normaliseIngredient('Roasted peanuts')).toBe('Peanuts');
    expect(normaliseIngredient('Long grain rice')).toBe('Rice');
    expect(normaliseIngredient('Tuna in spring water')).toBe('Tuna');
  });

  it('never collapses a product into a different one', () => {
    // Each of these is its own thing at its own price. Matching them to the
    // near neighbour would price the basket off the wrong shelf.
    expect(normaliseIngredient('Spring onions')).not.toBe('Onions');
    expect(normaliseIngredient('Sweet potato')).not.toBe('Potatoes');
    expect(normaliseIngredient('Soured cream, to dip')).not.toBe('Cream');
    expect(normaliseIngredient('Garlic powder')).not.toBe('Garlic');
    expect(normaliseIngredient('Coconut milk')).not.toBe('Milk');
  });

  it('is stable and never returns empty for anything in the cookbook', () => {
    for (const r of RECIPES) {
      for (const i of r.items) {
        const out = normaliseIngredient(i.n);
        expect(out.length, `"${i.n}" normalised to nothing`).toBeGreaterThan(0);
        // Idempotent: normalising twice must not keep eating the word.
        expect(normaliseIngredient(out), `"${i.n}" is not stable`).toBe(out);
      }
    }
  });
});
