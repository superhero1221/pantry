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

/** Where a pound buys forty or more of something, prices are whole units:
 *  lira, rupees, naira. A property of the currency, which is why it reads the
 *  bundled rate and never today's — a live rate must not change the shape. */
export const wholeUnits = (c: { fx: number }) => c.fx >= 40;

/** A plain number the way every screen prints it: ASCII digits, a comma every
 *  three places for whole units, a point and two places for the rest.
 *
 *  Written out rather than handed to toLocaleString(), because that follows
 *  the *browser's* locale, not the app's: a German browser printed ₦4.628,
 *  which reads as four naira next to £7.50 on the same screen, and an Arabic
 *  one printed Rs٦٣٤ in a UI whose every other number is ASCII. The comma
 *  grouping is also exactly what parseLocalAmount reads back, so a figure the
 *  app printed can be typed back in and mean the same thing. */
export const formatAmount = (v: number, whole: boolean) =>
  whole ? String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : v.toFixed(2);

export const formatMoney = (v: number, sym: string, whole: boolean) => sym + formatAmount(v, whole);

/* One run of digits split by one kind of separator into thousands: 5,000 and
   1.234.567, or the Indian lakh grouping 1,20,000. A leading 0 never groups,
   so 0.500 stays half of something. */
const GROUPED = /^[1-9]\d{0,2}(?:,\d{3})+$|^[1-9]\d{0,2}(?:\.\d{3})+$|^[1-9]\d?(?:,\d{2})+,\d{3}$/;

/** What someone typed into a money field, as a number — NaN if it is not one.
 *
 *  parseFloat read '7,50' as 7 on every comma-decimal keyboard, '5,000' in
 *  Lagos as five naira (the format the app itself prints), and stopped at the
 *  first Arabic-Indic digit, so ٤٠ could not be typed at all. This reads:
 *  - Arabic-Indic ٠-٩, Extended Arabic-Indic ۰-۹ (Urdu, Persian keyboards) and
 *    Devanagari ०-९ digits, with the Arabic decimal ٫, thousands ٬ and comma ،;
 *  - both decimal marks. With both present the later one is the decimal point
 *    (1.234,50 and 1,234.50). With one, it groups thousands only when every
 *    group after it is exactly three digits (5,000 · 4.628 · 1,20,000) — no
 *    currency here has three decimal places, so 7,50 and 7.5 are decimals;
 *  - spaces of every width and apostrophes as grouping (1 234 · 1'234);
 *  - the currency symbol or code at either end (₦4,628, AED 25.40, 7,50 €),
 *    so anything fmt() prints parses back to the number it showed.
 *  `whole` rounds to a whole unit, since a budget of ₦4.5 would print as a
 *  number nobody typed. Anything else — a minus sign, 1e3, Infinity, two
 *  decimal points — is NaN, and the caller's range check says so. */
export function parseLocalAmount(raw: string, whole: boolean): number {
  let s = String(raw)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x966))
    .replace(/٫/g, '.')
    .replace(/[٬،]/g, ',')
    // Bidi marks and isolates ride along when a price is copied out of RTL text.
    .replace(/[\s'\u2019\u200e\u200f\u061c\u2066-\u2069]/g, '')
    .replace(/^[\p{Sc}\p{L}]+|[\p{Sc}\p{L}]+$/gu, '');
  const lc = s.lastIndexOf(','),
    ld = s.lastIndexOf('.');
  if (lc >= 0 && ld >= 0) {
    // Both marks: the later one is the decimal point, the other only groups.
    const at = Math.max(lc, ld);
    s = s.slice(0, at).replace(lc > ld ? /\./g : /,/g, '') + '.' + s.slice(at + 1);
  } else if (GROUPED.test(s)) s = s.replace(/[,.]/g, '');
  else s = s.replace(',', '.');
  if (!/^\d*\.?\d+$/.test(s)) return NaN;
  return whole ? Math.round(Number(s)) : Number(s);
}
