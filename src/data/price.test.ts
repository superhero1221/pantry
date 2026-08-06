import { describe, expect, it } from 'vitest';
import { RECIPES } from './cookbook';

/**
 * One price per ingredient, everywhere.
 *
 * The cookbook used to charge different amounts for the same thing depending
 * on which recipe you had open: fresh coriander at £16.67/kg in one dish and
 * £81.67/kg in another, parsley from £12 to £45, rice vinegar from £2.67 to
 * £11.67. 484 lines across 100 ingredients disagreed with themselves. That is
 * wrong without needing to know the true price of coriander — a shopping list
 * cannot charge four times as much for a herb because of what it is going in.
 *
 * `scripts/reprice-cookbook.mjs` settled each one on the quantity-weighted
 * median of what the file already said. This holds it there. Add a recipe with
 * a herb priced by eye and this fails naming the herb, the dish and both
 * figures, which is the whole reason it exists — the drift arrived one
 * plausible-looking line at a time and nothing was watching.
 *
 * It deliberately does NOT assert any particular price. What the right price
 * for coriander is depends on shelf data the app gets from Open Prices and
 * community reports, and both override these figures per line when they land.
 * This asserts only that the fallback agrees with itself, which is what has to
 * be true before anybody can tell that it is wrong.
 */

type Item = { g: string; n: string; s: number };
type Recipe = { name: string; items: Item[] };

const RS = RECIPES as Recipe[];

/** Grams for a quantity string, or null when it is counted rather than
 *  weighed. Mirrors scripts/reprice-cookbook.mjs — deliberately re-stated
 *  rather than imported, so a change to the script cannot quietly relax the
 *  test that guards it. */
const gramsOf = (q: string): number | null => {
  const s = String(q ?? '').trim();
  let m = s.match(/^([\d.]+)\s*g$/i);
  if (m) return parseFloat(m[1]);
  m = s.match(/^([\d.]+)\s*kg$/i);
  if (m) return parseFloat(m[1]) * 1000;
  m = s.match(/^([\d.]+)\s*ml$/i);
  if (m) return parseFloat(m[1]);
  return null;
};

describe('every ingredient costs the same in every recipe', () => {
  it('agrees on £/kg for anything sold by weight', () => {
    const byName = new Map<string, { recipe: string; grams: number; s: number; perKg: number }[]>();
    for (const r of RS) {
      for (const i of r.items) {
        const grams = gramsOf(i.g);
        if (!grams) continue;
        const k = i.n.toLowerCase();
        if (!byName.has(k)) byName.set(k, []);
        byName.get(k)!.push({ recipe: r.name, grams, s: i.s, perKg: (i.s / grams) * 1000 });
      }
    }

    const wrong: string[] = [];
    for (const [name, rows] of byName) {
      if (rows.length < 2) continue;
      /* Compared against the line with the largest quantity, because `s` is
         money to two decimals and a 2 g pinch of salt costs a penny whatever
         salt costs — £5/kg against the £1.25/kg the same table charges for
         8 g. Judge the small quantities by what the big ones imply, and allow
         a penny either way for the rounding that produced them. */
      const ref = rows.reduce((a, b) => (b.grams > a.grams ? b : a));
      for (const x of rows) {
        const expect = (ref.perKg * x.grams) / 1000;
        if (Math.abs(x.s - expect) > 0.011) {
          wrong.push(
            `${name} in ${x.recipe}: ${x.grams} g at £${x.s} is £${x.perKg.toFixed(2)}/kg, ` +
              `but ${ref.grams} g in ${ref.recipe} implies £${ref.perKg.toFixed(2)}/kg`,
          );
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('agrees on the price of one onion, one lime, two tins', () => {
    /* Counted rather than weighed, so there is no £/kg to compare and the
       quantity string is part of the key: '2 tins' of tuna is a different
       line from '1 tin', and both are allowed to exist. */
    const byUnit = new Map<string, { recipe: string; s: number }[]>();
    for (const r of RS) {
      for (const i of r.items) {
        if (gramsOf(i.g)) continue;
        const k = `${i.n.toLowerCase()} @ ${i.g}`;
        if (!byUnit.has(k)) byUnit.set(k, []);
        byUnit.get(k)!.push({ recipe: r.name, s: i.s });
      }
    }

    const wrong: string[] = [];
    for (const [k, rows] of byUnit) {
      const lo = Math.min(...rows.map((x) => x.s));
      const hi = Math.max(...rows.map((x) => x.s));
      if (hi - lo > 0.011) {
        const cheap = rows.find((x) => x.s === lo)!;
        const dear = rows.find((x) => x.s === hi)!;
        wrong.push(`${k}: £${lo} in ${cheap.recipe} but £${hi} in ${dear.recipe}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('never gives an ingredient away', () => {
    /* A real quantity of a real thing is never free. A 0.00 line reads as a
       bug on the shopping list, and it would also let a mispriced ingredient
       hide: nothing else here would notice £0.00 of saffron. */
    const free = RS.flatMap((r) =>
      r.items.filter((i) => !(i.s > 0)).map((i) => `${i.n} in ${r.name}: £${i.s}`),
    );
    expect(free).toEqual([]);
  });
});
