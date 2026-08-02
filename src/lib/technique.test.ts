import { describe, expect, it } from 'vitest';
import { techniqueOf } from './technique';
import { RECIPES } from '../data/cookbook';

describe('techniqueOf', () => {
  it('reads the verb a step opens with, not one buried at the end', () => {
    // The bug this guards: first-rule-wins called this a drain, because
    // "drain them well" is the last four words.
    expect(
      techniqueOf(
        'Soak the dry rice noodles in warm tap water — not boiling — for 30 to 40 minutes, until they bend easily round your finger but still snap if you bite one. Drain them well.',
      ),
    ).toBe('soak');
  });

  it('recognises the obvious cases', () => {
    expect(techniqueOf('Oven to 120 °C fan. Bake 30 minutes.')).toBe('oven');
    expect(techniqueOf('Heat your widest pan on the highest heat.')).toBe('fry');
    expect(techniqueOf('Toss constantly for 2 to 3 minutes.')).toBe('toss');
    expect(techniqueOf('Blend the mango, half the habanero, honey and vinegar smooth.')).toBe('blend');
    expect(techniqueOf('Onto two warm plates.')).toBe('plate');
    expect(techniqueOf('Dice the onion, grate the garlic and ginger.')).toBe('prep');
  });

  it('falls back to prep rather than throwing on anything unrecognised', () => {
    expect(techniqueOf('')).toBe('prep');
    expect(techniqueOf('Something entirely unlike cooking.')).toBe('prep');
  });

  it('classifies every real step, and does not dump most of them in the fallback', () => {
    const steps = RECIPES.flatMap((r) => r.method.map((s) => s.text));
    expect(steps.length).toBeGreaterThan(100);

    const tally: Record<string, number> = {};
    for (const text of steps) {
      const t = techniqueOf(text);
      expect(t).toBeTruthy();
      tally[t] = (tally[t] ?? 0) + 1;
    }

    // The first version had 44% landing on 'prep' — a chopping board drawn over
    // steps that were plainly frying. Anything near that is a regression.
    expect(tally.prep / steps.length).toBeLessThan(0.35);
    // And the cooking verbs should actually be represented.
    for (const t of ['fry', 'simmer', 'toss', 'oven', 'boil', 'plate']) {
      expect(tally[t] ?? 0).toBeGreaterThan(0);
    }
  });
});
