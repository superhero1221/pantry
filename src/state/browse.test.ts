import { describe, expect, it } from 'vitest';
import { BROWSE_CATS, RECIPES } from '../data/cookbook';
import type { Recipe } from '../data/types';
import { orderBrowse } from './browse';

/** The comparators orderBrowse replaced, word for word, with the price as a
 *  parameter. The new code is only allowed to be faster than this. */
function before(list: Recipe[], cat: string, toBuy: (r: Recipe) => number): Recipe[] {
  switch (cat) {
    case 'quick':
      return list.filter((x) => x.total <= 30);
    case 'cheap':
      return list.slice().sort((a, b) => toBuy(a) / a.servings - toBuy(b) / b.servings);
    case 'protein':
      return list.slice().sort((a, b) => b.per.protein - a.per.protein);
    case 'veg':
      return list.filter((x) => x.tags.indexOf('vegetarian') >= 0 || x.tags.indexOf('vegan') >= 0);
    case 'easy':
      return list.slice().sort((a, b) => a.diff - b.diff);
    default:
      return list;
  }
}

const ids = (l: Recipe[]) => l.map((r) => r.id);

/* Three ways a basket can be priced: the cookbook's own sums, a cupboard that
   already holds the commonest things (so many dishes tie, some at zero), and
   everything free (every dish ties). Ties are where two sorts can disagree. */
const common = new Set(['Onion', 'Garlic', 'Rice', 'Egg', 'Eggs', 'Salt', 'Olive oil', 'Butter', 'Tomato', 'Tomatoes']);
const PRICES: Record<string, (r: Recipe) => number> = {
  cookbook: (r) => r.items.reduce((a, i) => a + i.s * 0.82, 0),
  stocked: (r) => r.items.filter((i) => !common.has(i.n)).reduce((a, i) => a + i.s * 0.82, 0),
  free: () => 0,
};

describe('Browse order', () => {
  it('prices every dish to a real number, so no comparator ever saw NaN', () => {
    for (const r of RECIPES) {
      expect(Number.isFinite(PRICES.cookbook(r) / r.servings), r.id).toBe(true);
      expect(Number.isFinite(r.per.protein), r.id).toBe(true);
      expect(Number.isFinite(r.diff), r.id).toBe(true);
    }
  });

  for (const [how, price] of Object.entries(PRICES)) {
    it(`matches the old sort for every chip (${how})`, () => {
      for (const { k } of BROWSE_CATS) {
        expect(ids(orderBrowse(RECIPES, k, price)), k).toEqual(ids(before(RECIPES, k, price)));
      }
    });
  }

  it('prices each dish once per chip tap, not once per comparison', () => {
    let calls = 0;
    orderBrowse(RECIPES, 'cheap', (r) => (calls++, r.items.length));
    expect(calls).toBe(RECIPES.length);
  });

  it('keeps the length and skips the work when Browse is not on screen', () => {
    let calls = 0;
    const price = () => (calls++, 1);
    for (const { k } of BROWSE_CATS) {
      expect(orderBrowse(RECIPES, k, price, false).length, k).toBe(before(RECIPES, k, price).length);
    }
    calls = 0;
    orderBrowse(RECIPES, 'cheap', price, false);
    expect(calls).toBe(0);
  });
});
