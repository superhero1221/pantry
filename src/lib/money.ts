/**
 * The two directions money travels in this app, in one place.
 *
 * The cookbook is written in a pounds-and-pence baseline. What a screen shows
 * is that baseline scaled by the country's cost index and its exchange rate.
 * Anything *measured* — a price someone reported, a shelf price from Open
 * Prices — arrives already in real local money and has to come back down the
 * same scale before anything else touches it.
 *
 * These were once one multiplication written inline in two places and its
 * inverse written nowhere, which is how a community price reported in Lagos
 * came out 925x too big: naira went in, and naira times the naira rate came
 * out. Both directions live here now so they cannot drift apart again.
 */

export interface Money {
  /** Cost-of-living index for the country, relative to the UK. */
  idx: number;
}

/** How many local units one unit of the baseline is worth right now. */
export const scaleOf = (c: Money, fx: number) => c.idx * fx;

/** Baseline → what the shopper sees. */
export const toLocal = (base: number, c: Money, fx: number) => base * scaleOf(c, fx);

/** What the shopper paid → baseline, so the rest of the app can use it. */
export const fromLocal = (local: number, c: Money, fx: number) => local / scaleOf(c, fx);
