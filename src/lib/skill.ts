import { SKILL_CARDS } from '../data/cookbook';

/**
 * How much cooking you have done: one number, 1 to 4.
 *
 * `null` means you never said, which is not the same as 2 even though 2 is
 * what the ranker uses when nobody has said. The distinction matters on the
 * Settings screen, which should not claim to know something you skipped.
 */
export type Level = 1 | 2 | 3 | 4;

/** Anything a hand-edited file or a stale column can carry, made safe.
 *
 *  Worth being paranoid about. `P.levels[lvl]` is read on every render of every
 *  screen — it is a plain property of the object the state hook returns, and
 *  that hook runs inside App's own render — so an out-of-range index does not
 *  break the Settings row, it takes down the app past the error boundary. */
export const clampLevel = (n: unknown): Level =>
  (Math.max(1, Math.min(4, Math.round(Number(n)))) || 2) as Level;

/**
 * The old two-step tier list, read as a level.
 *
 * This is the arithmetic the drag screen used, preserved exactly so that
 * somebody who answered it in the old build lands where they were rather than
 * where a fresh install would put them: each card carries a weight, S counts it
 * at 1.1, A at 0.7, B and C at nothing, and the total over four is the level.
 *
 * Returns null for an empty map — a skipped screen is a skipped screen, and
 * turning it into 2 here would make the profile claim an answer that was never
 * given.
 */
export function levelFromCards(cards: Record<string, unknown>): Level | null {
  if (!cards || !Object.keys(cards).length) return null;
  let score = 0;
  for (const card of SKILL_CARDS) {
    const tier = cards[card.id];
    if (tier === 'S') score += (card.w ?? 0) * 1.1;
    else if (tier === 'A') score += (card.w ?? 0) * 0.7;
  }
  return clampLevel(score / 4);
}
