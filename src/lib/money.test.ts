import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../data/cookbook';
import { formatAmount, formatMoney, fromLocal, parseLocalAmount, toLocal, wholeUnits } from './money';

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

describe('what people type into a money field', () => {
  const all = Object.entries(COUNTRIES) as [string, { idx: number; fx: number; sym: string }][];

  it('reads both decimal marks and the grouping the app prints', () => {
    const cases: [string, boolean, number][] = [
      ['7.50', false, 7.5],
      ['7,50', false, 7.5],
      ['7,5', false, 7.5],
      ['0,500', false, 0.5],
      ['1.234,50', false, 1234.5],
      ['1,234.50', false, 1234.5],
      ['1 234,50', false, 1234.5],
      ["1'234.50", false, 1234.5],
      ['1,200', false, 1200],
      ['5,000', true, 5000],
      ['4.628', true, 4628],
      ['1.234.567', true, 1234567],
      ['1,20,000', true, 120000],
      ['12', true, 12],
      ['4,5', true, 5],
    ];
    for (const [raw, whole, want] of cases) expect(parseLocalAmount(raw, whole), raw).toBe(want);
  });

  it('reads Arabic, Urdu and Devanagari digits', () => {
    expect(parseLocalAmount('١٢٥', true)).toBe(125);
    expect(parseLocalAmount('٤٠', false)).toBe(40);
    expect(parseLocalAmount('۵۰۰', true)).toBe(500);
    expect(parseLocalAmount('٤٫٥', false)).toBe(4.5);
    expect(parseLocalAmount('٥٬٠٠٠', true)).toBe(5000);
    expect(parseLocalAmount('٧،٥٠', false)).toBe(7.5);
    expect(parseLocalAmount('५००', true)).toBe(500);
  });

  it('ignores the currency and the bidi marks that come with a copied price', () => {
    expect(parseLocalAmount('₦4,628', true)).toBe(4628);
    expect(parseLocalAmount('AED 25.40', false)).toBe(25.4);
    expect(parseLocalAmount('7,50 €', false)).toBe(7.5);
    expect(parseLocalAmount('\u2066Rs634\u2069', true)).toBe(634);
  });

  it('refuses anything that is not an amount', () => {
    for (const raw of ['', '   ', 'abc', '1e3', 'Infinity', '-5', '1.2.3', '1,2,3', '7..5', '.', ','])
      expect(parseLocalAmount(raw, false), JSON.stringify(raw)).toBeNaN();
  });

  it('prints the same shape whatever the browser locale', () => {
    expect(formatMoney(4628, '₦', true)).toBe('₦4,628');
    expect(formatMoney(1234567.4, '₦', true)).toBe('₦1,234,567');
    expect(formatMoney(634, 'Rs', true)).toBe('Rs634');
    expect(formatMoney(-917, '₦', true)).toBe('₦-917');
    expect(formatMoney(7.5, '£', false)).toBe('£7.50');
    expect(formatMoney(1000, '£', false)).toBe('£1000.00');
    expect(formatAmount(6020, true)).toBe('6,020');
  });

  it('reads back exactly what it printed, in every country the app prices', () => {
    // Everything from a penny to the budget ceiling, through the same scale
    // fmt() uses: a figure the app shows can be typed back in and mean it.
    const bases = [0.004, 0.01, 0.37, 1, 2.5, 3.71, 6.5, 12.99, 47.3, 99.99, 250, 999.99, 1000, 2717.4];
    for (const [code, c] of all) {
      const whole = wholeUnits(c);
      for (const b of bases) {
        const v = toLocal(b, c, c.fx);
        const printed = formatMoney(v, c.sym, whole);
        const shown = whole ? Math.round(v) : Number(v.toFixed(2));
        expect(parseLocalAmount(printed, whole), `${code} ${printed}`).toBe(shown);
        expect(parseLocalAmount(formatAmount(v, whole), whole), `${code} ${printed} without the symbol`).toBe(shown);
      }
    }
  });

  it('keeps the shape where it was: whole units exactly where a pound buys forty', () => {
    const shape = Object.fromEntries(all.map(([code, c]) => [code, wholeUnits(c)]));
    expect(shape).toEqual({ GB: false, US: false, IN: true, NG: true, PK: true, DE: false, AE: false, TR: true });
  });
});
