import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../data/cookbook';
import { fromLocal, toLocal } from './money';

describe('money', () => {
  const all = Object.entries(COUNTRIES) as [string, { idx: number; fx: number; sym: string }][];

  it('round-trips in every country the app prices', () => {
    for (const [code, c] of all) {
      const base = 3.71;
      expect(fromLocal(toLocal(base, c, c.fx), c, c.fx), code).toBeCloseTo(base, 10);
    }
  });

  it('does not scale a measured price twice', () => {
    // The bug this file exists to prevent. Someone in Lagos reports ₦100/kg.
    // Rendering that straight through toLocal gave ₦92,560 — the naira figure
    // multiplied by the naira rate. Through fromLocal first it comes back out
    // as the ₦100 they actually paid.
    for (const [code, c] of all) {
      const paid = 100;
      const shown = toLocal(fromLocal(paid, c, c.fx), c, c.fx);
      expect(shown, `${code} distorted a measured price`).toBeCloseTo(paid, 6);
    }
  });

  it('leaves the UK alone, which is why the bug hid for so long', () => {
    // idx and fx are both 1 at home, so the double-scaling was the identity
    // and every UK figure looked correct. Worth pinning: if GB ever stops
    // being the baseline, these tests start carrying the weight.
    const gb = COUNTRIES.GB;
    expect(gb.idx).toBe(1);
    expect(gb.fx).toBe(1);
    expect(toLocal(4.25, gb, gb.fx)).toBe(4.25);
  });

  it('uses the live rate, not the bundled one, in both directions', () => {
    const c = COUNTRIES.TR;
    const live = 63; // bundled is 43
    expect(toLocal(1, c, live)).toBeCloseTo(c.idx * live, 10);
    expect(fromLocal(c.idx * live, c, live)).toBeCloseTo(1, 10);
  });
});
