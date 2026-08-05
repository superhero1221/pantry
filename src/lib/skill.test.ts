import { describe, expect, it } from 'vitest';
import { SKILL_CARDS, SKILL_LEVELS } from '../data/cookbook';
import { clampLevel, levelFromCards } from './skill';

const all = (tier: string) => Object.fromEntries(SKILL_CARDS.map((c) => [c.id, tier]));

/**
 * The onboarding question used to be two screens of drag-and-drop and is now
 * one screen of four taps. These are the two things that had to survive the
 * change: the number it produces, and the number it reads out of a profile
 * saved by the old build.
 */
describe('levelFromCards', () => {
  it('reads a skipped tier list as never answered, not as 2', () => {
    // The old code returned 2 for an empty map, which is the right ranking
    // default but the wrong thing to write into a profile — it makes the app
    // claim an answer nobody gave.
    expect(levelFromCards({})).toBeNull();
  });

  it('agrees with the arithmetic it replaces', () => {
    expect(levelFromCards(all('S'))).toBe(4); // 18 × 1.1 / 4 = 4.95, clamped
    expect(levelFromCards(all('A'))).toBe(3); // 18 × 0.7 / 4 = 3.15
    expect(levelFromCards(all('C'))).toBe(1); // 0, clamped up
    expect(levelFromCards({ fish: 'S' })).toBe(1); // 4.4 / 4 = 1.1
    expect(levelFromCards({ onion: 'S', rice: 'S' })).toBe(1);
  });

  it('clamps anything a hand-edited backup file can carry', () => {
    for (const n of [-3, 0, 0.4, 4.6, 9, 1e9, NaN, 'three', null, undefined, {}]) {
      const out = clampLevel(n);
      expect(out, String(n)).toBeGreaterThanOrEqual(1);
      expect(out, String(n)).toBeLessThanOrEqual(4);
    }
  });
});

describe('the four options', () => {
  it('covers 1 to 4, uses every technique once, and never shows a row of one', () => {
    expect(SKILL_LEVELS.map((r) => r.lvl)).toEqual([1, 2, 3, 4]);
    expect(SKILL_LEVELS.flatMap((r) => r.ids).sort()).toEqual(SKILL_CARDS.map((c) => c.id).sort());
    for (const row of SKILL_LEVELS) expect(row.ids, String(row.lvl)).toHaveLength(2);
  });

  it('climbs — each row asks more than the one above it', () => {
    const weight = (row: { ids: string[] }) =>
      row.ids.reduce((n, id) => n + (SKILL_CARDS.find((c) => c.id === id)?.w ?? 0), 0);
    const weights = SKILL_LEVELS.map(weight);
    for (let i = 1; i < weights.length; i++) expect(weights[i]).toBeGreaterThan(weights[i - 1]);
  });
});
