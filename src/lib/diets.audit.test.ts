import { describe, expect, it } from 'vitest';
import { RECIPES } from '../data/cookbook';
import { tagContradictions } from './diets';

describe('diet tags', () => {
  it('is never contradicted by the recipe it sits on', () => {
    const bad: string[] = [];
    for (const r of RECIPES) {
      const c = tagContradictions(r);
      for (const [tag, why] of Object.entries(c)) bad.push(`${r.id} "${tag}" <- ${why.join(', ')}`);
    }
    expect(bad, 'tags contradicted by ingredients').toEqual([]);
  });
});
