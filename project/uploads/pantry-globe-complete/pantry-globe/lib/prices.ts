import { NUTRIENTS } from './nutrients';
import { REAL_PRICES, PRICE_SNAPSHOT_DATE, PRICE_SOURCE } from './price-data';
import { WFP_PRICES } from './wfp-prices';
import { ageing, REFERENCE_MONTH, type Ageing } from './inflation';
import type { CountryProfile } from './types';

/**
 * Price resolution, with provenance.
 *
 * Three sources, in order:
 *   1. `local`    — measured in this country, by World Food Programme
 *                   enumerators visiting real markets. CC BY-IGO. Only exists
 *                   for the ~60 countries WFP monitors, which are almost
 *                   exactly the countries no grocery API covers.
 *   2. `real`     — Open Prices (Open Food Facts), community-submitted, ODbL.
 *                   Median of at least 3 observations after outlier rejection.
 *                   Two thirds of it is French, so it is treated as a European
 *                   average and scaled, not as a local price.
 *   3. `estimate` — a UK reference pack price scaled by country and shop tier.
 *
 * `local` outranks `real` for one reason: it was measured in the place the
 * question is being asked about. A French median scaled by a country index is a
 * decent guess at an Ethiopian price; an Ethiopian market price is not a guess.
 *
 * Every quote carries where it came from and how well supported it is, and the
 * UI shows that per line. A number with no provenance invites more trust than
 * it has earned, and the gap between "we measured this" and "we guessed this"
 * is the single most important thing to be honest about in a pricing app.
 */

export type PriceSource = 'local' | 'real' | 'estimate';

export interface PriceQuote {
  /** Price for one pack of the ingredient's standard size, in local currency. */
  packPrice: number;
  perKgLocal: number;
  source: PriceSource;
  /** Observations behind a real price. 0 for estimates. */
  n: number;
  /** 'high' | 'medium' | 'low' — for real prices, driven by n and spread. */
  confidence: 'high' | 'medium' | 'low';
  note?: string;
  /** How this figure was carried forward from the date its basis was set. */
  ageing: Ageing;
}

/**
 * Both kinds of price age.
 *
 * It would be easy to age only the modelled figures, on the reasoning that the
 * measured ones are "real". But a measured price is only real as of the day it
 * was measured, and the Open Prices snapshot has a date on it like anything
 * else. Ageing one and not the other would make the measured figures quietly
 * drift out of date while wearing the badge that says they are trustworthy.
 */
const monthOfDate = (iso: string) => iso.slice(0, 7);

/** Dollars per pound, from the country table, so there is one rate not two. */
const USD_PER_GBP = 1.27;

export const SNAPSHOT_DATE = PRICE_SNAPSHOT_DATE;
export const SOURCE_NAME = PRICE_SOURCE;

/**
 * The snapshot is a Europe-weighted average — most contributions come from
 * France and neighbours, whose grocery indices sit within a few points of the
 * UK. So it is treated as index 1.0 and scaled the same way an estimate is.
 * That is an approximation and it is the honest one: pretending a French
 * median is a Kuwaiti shelf price would be worse.
 */
export function quote(ref: string, country: CountryProfile, tier: number, now: Date = new Date()): PriceQuote | null {
  const n = NUTRIENTS[ref];
  if (!n) return null;

  // Measured in this country, at real markets, this year.
  const w = WFP_PRICES[country.code]?.[ref];
  if (w) {
    const age = ageing(w.month, country.code, now, 'measured');
    // WFP publishes in US dollars. country.fx is local units per pound, and
    // the model's dollar rate is the US profile's fx, so the two compose.
    const perKgLocal = w.usdPerKg * (country.fx / USD_PER_GBP) * tier * age.factor;
    const confidence: PriceQuote['confidence'] =
      w.markets >= 15 && w.spread <= 0.45 ? 'high'
      : w.markets >= 5 && w.spread <= 0.8 ? 'medium'
      : 'low';
    return {
      packPrice: (perKgLocal * n.packSize) / 1000,
      perKgLocal,
      source: 'local',
      n: w.n,
      confidence,
      ageing: age,
      note: `measured in ${w.markets} market${w.markets === 1 ? '' : 's'} here, ${w.month}`,
    };
  }

  const real = REAL_PRICES[ref];
  if (real) {
    const age = ageing(monthOfDate(PRICE_SNAPSHOT_DATE), country.code, now, 'measured');
    const perKgLocal = real.gbpPerKg * country.index * tier * country.fx * age.factor;
    const packPrice = (perKgLocal * n.packSize) / 1000;
    const confidence: PriceQuote['confidence'] =
      real.n >= 25 && real.spread <= 0.45 ? 'high'
      : real.n >= 8 && real.spread <= 0.8 ? 'medium'
      : 'low';
    return {
      packPrice,
      perKgLocal,
      source: 'real',
      n: real.n,
      confidence,
      ageing: age,
      note:
        confidence === 'low'
          ? `${real.n} shopper reports, but they disagree widely`
          : `median of ${real.n} shopper reports`,
    };
  }

  const age = ageing(REFERENCE_MONTH, country.code, now);
  const cal = calibration(country);
  const packPrice = n.packPriceGBP * country.index * tier * country.fx * age.factor * cal.factor;
  return {
    packPrice,
    perKgLocal: (packPrice / Math.max(n.packSize, 1)) * 1000,
    source: 'estimate',
    n: 0,
    confidence: 'low',
    ageing: age,
    note: cal.applied
      ? `reference price, corrected ${cal.factor < 1 ? 'down' : 'up'} ${Math.abs(Math.round((cal.factor - 1) * 100))}% to match ${cal.on} things measured here`
      : 'reference price scaled by country and shop type',
  };
}

export interface Calibration { factor: number; applied: boolean; on: number }

/**
 * Correct the model against reality, per country.
 *
 * For the countries WFP monitors we know what a dozen staples ACTUALLY cost
 * there. If the model says Ethiopian onions are twice what the market recorded,
 * that is not bad luck on onions — the country index is off, and every modelled
 * price in that country is off with it in the same direction.
 *
 * So: take the ratio of measured to modelled across every ingredient we have
 * both for, and use the median of those ratios to nudge the rest. The median,
 * not the mean, because one subsidised staple should not drag the whole basket.
 *
 * Guarded three ways — at least four ingredients to compare, ratios clamped to
 * a factor of four before they are even considered, and the result clamped to
 * [0.5, 2]. A correction is a correction, not a licence to invent a new price.
 */
const calCache = new Map<string, Calibration>();
export function calibration(country: CountryProfile): Calibration {
  const hit = calCache.get(country.code);
  if (hit) return hit;

  const measured = WFP_PRICES[country.code];
  let out: Calibration = { factor: 1, applied: false, on: 0 };
  if (measured) {
    const ratios: number[] = [];
    for (const [ref, w] of Object.entries(measured)) {
      const n = NUTRIENTS[ref];
      if (!n || !n.packSize) continue;
      const modelledPerKg = (n.packPriceGBP * country.index * country.fx / n.packSize) * 1000;
      const measuredPerKg = w.usdPerKg * (country.fx / USD_PER_GBP);
      if (modelledPerKg <= 0 || measuredPerKg <= 0) continue;
      const r = measuredPerKg / modelledPerKg;
      if (r > 0.25 && r < 4) ratios.push(r);
    }
    if (ratios.length >= 4) {
      ratios.sort((a, b) => a - b);
      const m = ratios.length >> 1;
      const med = ratios.length % 2 ? ratios[m] : (ratios[m - 1] + ratios[m]) / 2;
      out = { factor: Math.min(2, Math.max(0.5, med)), applied: true, on: ratios.length };
    }
  }
  calCache.set(country.code, out);
  return out;
}

export interface Coverage {
  total: number;
  /** Items priced from a measurement of any kind, local or European. */
  real: number;
  /** Of those, the ones measured in this very country. */
  local: number;
  /** Share of the basket's MONEY covered by real prices, which matters more
   *  than the share of items — twenty cheap spices priced by guesswork move a
   *  total far less than one mispriced joint of meat. */
  realValueShare: number;
}

export function coverage(items: { ref: string; packPrice: number; source: PriceSource }[]): Coverage {
  const measured = (i: { source: PriceSource }) => i.source === 'real' || i.source === 'local';
  const total = items.length;
  const real = items.filter(measured).length;
  const local = items.filter((i) => i.source === 'local').length;
  const sum = items.reduce((a, i) => a + i.packPrice, 0);
  const realSum = items.filter(measured).reduce((a, i) => a + i.packPrice, 0);
  return { total, real, local, realValueShare: sum > 0 ? realSum / sum : 0 };
}
