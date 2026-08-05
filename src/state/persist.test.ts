import { describe, expect, it } from 'vitest';
import { KEEP, SHAPE, pick } from './usePantry';

/**
 * The gate every saved profile comes through — the boot read and an imported
 * file both land in `pick`.
 *
 * This exists because of how loudly it fails quietly. `SHAPE[k]` is called
 * unconditionally for every name in `KEEP`, so a name added to one and not the
 * other does not drop that key: it throws, `load()`'s catch swallows the throw
 * and returns `{}`, and the cook's history, cupboard, budget, diets and saved
 * week are gone on the next render with nothing in the console. The first test
 * here is worth more than the rest of the file.
 */
describe('the saved-profile gate', () => {
  it('validates every key it keeps', () => {
    for (const k of KEEP) expect(typeof SHAPE[k], k).toBe('function');
  });

  it('migrates a tier list saved by the old build into a level', () => {
    const all = (t: string) =>
      Object.fromEntries(['onion', 'rice', 'sear', 'sauce', 'temp', 'fry', 'dough', 'fish'].map((id) => [id, t]));
    expect(pick({ skill: all('S') }).level).toBe(4);
    expect(pick({ skill: all('A') }).level).toBe(3);
    expect(pick({ skill: { fish: 'S' } }).level).toBe(1);
  });

  it('reads a skipped tier list as never answered', () => {
    // Not as 2. Two is what the ranker falls back to, but writing it into the
    // profile would make the app claim an answer that was never given.
    expect(pick({ skill: {}, time: { t30: 'S' } }).level).toBeNull();
    expect(pick({}).level).toBeUndefined();
  });

  it('prefers a level already saved over an old tier list', () => {
    expect(pick({ level: 1, skill: { fish: 'S', dough: 'S', fry: 'S' } }).level).toBe(1);
  });

  it('drops an out-of-range level rather than handing it to a screen', () => {
    // P.levels is indexed with this on every render of every screen, and that
    // indexing happens inside App's own render — so a bad number here is a
    // blank app, not a broken row.
    for (const bad of [0, 5, -1, 2.5, '3', {}, []]) {
      expect(pick({ level: bad }).level, JSON.stringify(bad)).toBeUndefined();
    }
    expect(pick({ level: null }).level).toBeNull();
  });

  it('never carries the retired keys through', () => {
    const out = pick({ skill: { onion: 'S' }, time: { t30: 'S' } }) as Record<string, unknown>;
    expect('skill' in out).toBe(false);
    expect('time' in out).toBe(false);
  });
});
