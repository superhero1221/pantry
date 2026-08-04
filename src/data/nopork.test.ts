import { describe, expect, it } from 'vitest';
import { RECIPES } from './cookbook';

/**
 * No pork, no alcohol, anywhere in the cookbook.
 *
 * This is a standing rule for this cookbook rather than a diet filter. The
 * `no_pork` and `no_alcohol` options still exist on the Diet screen and still
 * work, but they now have nothing to exclude — which is the point. Somebody who
 * keeps halal should not have to trust a filter; the shelf itself is clean.
 *
 * Ten dishes were removed rather than rewritten, because the pork or the wine
 * WAS the dish: carbonara without guanciale is not carbonara, and coq au vin
 * without the vin is a chicken casserole with a French name. Fourteen more kept
 * their place with an honest swap — chicken in the banh mi, beef in the kimchi
 * jjigae, stock where the wine was.
 *
 * Vinegar is deliberately not on this list. It is a fermented product with
 * essentially no alcohol left in it and is treated as permissible by most
 * authorities. The cookbook says "white vinegar" rather than "white wine
 * vinegar" all the same, because the word on a shopping list is what a shopper
 * actually reads.
 */
const PORK = /\b(pork|bacon|ham|gammon|lardons?|pancetta|guanciale|chorizo|prosciutto|salami|lard|pepperoni)\b/i;

/** Matched on whole words, and never on vinegar. */
const ALCOHOL =
  /\b(red wine|white wine|rice wine|cooking wine|shaoxing|mirin|sake|beer|lager|ale|stout|cider|rum|brandy|vodka|whisky|whiskey|sherry|vermouth|marsala|kirsch)\b/i;

const offending = (text: string) => {
  if (/vinegar/i.test(text)) return null;
  return PORK.test(text) ? 'pork' : ALCOHOL.test(text) ? 'alcohol' : null;
};

describe('the cookbook keeps no pork and no alcohol', () => {
  it('buys none of it', () => {
    const found: string[] = [];
    for (const r of RECIPES) {
      for (const item of r.items) {
        const what = offending(item.n);
        if (what) found.push(`${r.id}: "${item.n}" (${what})`);
      }
    }
    expect(found, 'ingredients that should not be in this cookbook').toEqual([]);
  });

  it('does not mention it in the method either', () => {
    // An ingredient can be swapped out of the shopping list and left behind in
    // the steps — "pork belly in for 5 minutes" on a recipe that now buys beef.
    // That reads as a mistake to a cook standing at the hob, and it is one.
    const found: string[] = [];
    for (const r of RECIPES) {
      for (const [i, step] of r.method.entries()) {
        const what = offending(`${step.text} ${step.tip ?? ''}`);
        if (what) found.push(`${r.id} step ${i + 1} (${what})`);
      }
    }
    expect(found, 'method steps still naming pork or alcohol').toEqual([]);
  });

  it('leaves the two diet filters with nothing to exclude', () => {
    // If either filter ever removes a dish again, something has slipped back in.
    for (const r of RECIPES) {
      expect(r.items.some((i) => offending(i.n) === 'pork'), `${r.id} is not pork free`).toBe(false);
      expect(r.items.some((i) => offending(i.n) === 'alcohol'), `${r.id} is not alcohol free`).toBe(false);
    }
  });
});
