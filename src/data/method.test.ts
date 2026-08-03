import { describe, expect, it } from 'vitest';
import { RECIPES } from './cookbook';

/**
 * Does the method actually use what the shopping list makes you buy?
 *
 * This is the commonest defect in recipe data and the most annoying one to
 * meet in a kitchen: you buy the thing, you get to the end of the steps, and
 * the thing is still on the counter. Dal Tadka shipped like that — 200 g of
 * basmati rice on the list and not one step that mentioned rice.
 *
 * It has to be forgiving about words, because recipes are written the way
 * people talk. A step that says "pasta into the water" has used the spaghetti,
 * and one that says "cheese over one half" has used the mature cheddar.
 */

/** Words in an ingredient name that carry no identity of their own. */
const NOISE = new Set([
  'fresh', 'dried', 'ground', 'raw', 'firm', 'whole', 'tinned', 'chopped', 'long', 'grain',
  'mature', 'extra', 'virgin', 'spring', 'water', 'flat', 'peeled', 'ripe', 'frozen', 'silken',
  'leaf', 'leaves', 'seeds', 'seed', 'stick', 'sticks', 'powder', 'sauce', 'paste', 'plain',
  'the', 'and', 'for', 'dip', 'red', 'green', 'white', 'black', 'sweet', 'baby', 'light',
]);

/** What a cook is likely to call it once it is in the pan. */
const ALSO: Record<string, string[]> = {
  cheddar: ['cheese'], pecorino: ['cheese'], parmesan: ['cheese'], mozzarella: ['cheese'],
  feta: ['cheese'], halloumi: ['cheese'], paneer: ['cheese'], gruyere: ['cheese'],
  spaghetti: ['pasta'], macaroni: ['pasta'], lasagne: ['pasta'], tagliatelle: ['pasta'],
  basmati: ['rice'], arborio: ['rice'], couscous: ['grain'],
  guanciale: ['pork'], pancetta: ['pork'], lardons: ['pork'],
  prawns: ['prawn'], chickpeas: ['chickpea'], lentils: ['lentil', 'dal', 'dhal'],
  aubergine: ['aubergines'], courgette: ['courgettes'], coriander: ['cilantro'],
  passata: ['tomato'], puree: ['tomato'], stock: ['broth'], oil: ['oil'],
  yoghurt: ['yogurt'], beansprouts: ['sprouts'], gochugaru: ['chilli'],
};

describe('every recipe uses what it makes you buy', () => {
  it('mentions each non-optional ingredient somewhere in the method', () => {
    const unused: string[] = [];

    for (const r of RECIPES) {
      const method = r.method.map((s) => `${s.text} ${s.tip ?? ''}`).join(' ').toLowerCase();

      for (const item of r.items) {
        if (item.opt) continue;
        const words = item.n
          .toLowerCase()
          .replace(/[^a-z\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !NOISE.has(w));

        const candidates = words.flatMap((w) => [w, w.replace(/s$/, ''), ...(ALSO[w] ?? [])]);
        // An ingredient made only of noise words has nothing to look for and is
        // not evidence of anything either way.
        if (!candidates.length) continue;
        if (!candidates.some((c) => method.includes(c))) unused.push(`${r.id}: "${item.n}"`);
      }
    }

    expect(unused, 'bought but never used').toEqual([]);
  });

  it('gives every step something to do', () => {
    for (const r of RECIPES) {
      for (const [i, s] of r.method.entries()) {
        expect(s.text.trim().length, `${r.id} step ${i + 1} is too short to be an instruction`).toBeGreaterThan(20);
        if (s.tip !== undefined) {
          expect(s.tip.trim().length, `${r.id} step ${i + 1} has an empty tip`).toBeGreaterThan(20);
        }
      }
    }
  });

  it('does not claim to take less time than its steps add up to', () => {
    // `total` is what the app filters on when you say you have half an hour, so
    // a total that undercuts its own steps is the app breaking a promise.
    for (const r of RECIPES) {
      const steps = r.method.reduce((n, s) => n + (s.m ?? 0), 0);
      expect(r.total, `${r.name}: total ${r.total} min, steps add to ${steps}`).toBeGreaterThanOrEqual(
        Math.round(steps * 0.5),
      );
      expect(r.total, `${r.name}: total ${r.total} is less than active ${r.active}`).toBeGreaterThanOrEqual(r.active);
    }
  });
});
