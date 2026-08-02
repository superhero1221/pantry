/**
 * Ageing prices, so "modelled" stops meaning "guessed".
 *
 * Two thirds of a typical basket here is a modelled figure, and the honest
 * label for that has always been the app's strongest asset — but "modelled" on
 * its own invites the reader to hear "made up". It also hides a second problem:
 * a reference price written in July 2026 is simply wrong by the following
 * summer, and silently wrong, which is the worst failure mode for a product
 * whose whole pitch is trust.
 *
 * Both are fixed by the same thing. Every price carries the date its basis was
 * set, and is compounded forward to today against a published national food
 * inflation series. The claim then stops being "we think it costs this" and
 * becomes "this was measured on that date and is aged by this published series
 * to now" — which is checkable, and which is what the grocery statisticians
 * themselves do.
 *
 * Where no series exists for a country, nothing is aged and the UI says so.
 * Inventing an inflation rate to avoid an awkward gap would give away exactly
 * the thing this module exists to protect.
 */

export interface CpiPoint {
  /** Month the figure refers to, YYYY-MM. */
  ym: string;
  /** Annual CPI rate for food and non-alcoholic beverages, per cent. */
  annual: number;
}

export interface CpiSeries {
  country: string;
  label: string;
  source: string;
  /** Where a human can check it. */
  url: string;
  points: CpiPoint[];
}

/**
 * UK — ONS series D7G8, CPI annual rate, food and non-alcoholic beverages.
 * Read from the ONS time series page; figures are theirs, not derived.
 */
const GB: CpiSeries = {
  country: 'GB',
  label: 'Food and non-alcoholic beverages, annual CPI',
  source: 'ONS series D7G8',
  url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g8/mm23',
  points: [
    { ym: '2024-11', annual: 2.0 }, { ym: '2024-12', annual: 2.0 },
    { ym: '2025-01', annual: 3.3 }, { ym: '2025-02', annual: 3.3 },
    { ym: '2025-03', annual: 3.0 }, { ym: '2025-04', annual: 3.4 },
    { ym: '2025-05', annual: 4.4 }, { ym: '2025-06', annual: 4.5 },
    { ym: '2025-07', annual: 4.9 }, { ym: '2025-08', annual: 5.1 },
    { ym: '2025-09', annual: 4.5 }, { ym: '2025-10', annual: 4.9 },
    { ym: '2025-11', annual: 4.2 }, { ym: '2025-12', annual: 4.5 },
    { ym: '2026-01', annual: 3.6 }, { ym: '2026-02', annual: 3.3 },
    { ym: '2026-03', annual: 3.7 }, { ym: '2026-04', annual: 3.0 },
  ],
};

export const SERIES: Record<string, CpiSeries> = { GB };

/**
 * The month the bundled UK reference pack prices in lib/nutrients.ts describe.
 * Changing a reference price without moving this date makes every later figure
 * quietly wrong, so they belong together.
 */
export const REFERENCE_MONTH = '2026-07';

const ymToIndex = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};
const monthOf = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

export interface Ageing {
  /** Multiply a price by this. 1 = untouched. */
  factor: number;
  /** Whole months between the basis date and now. */
  months: number;
  /** Percentage change applied, for display. */
  pct: number;
  /** True when part of the span ran past the end of the published series. */
  extrapolated: boolean;
  /** How many months were extrapolated. */
  extrapolatedMonths: number;
  series: CpiSeries | null;
  /** One line the UI can show verbatim. */
  basis: string;
}

/**
 * Compound a price forward from `fromYM` to `now`.
 *
 * The series publishes ANNUAL rates per month, so each month contributes its
 * own twelfth root rather than a twelfth of the rate — compounding a 4.9%
 * annual rate as 0.408% a month overstates it, slightly but systematically, and
 * a systematic overstatement is precisely the kind of error that would justify
 * the scepticism this is meant to answer.
 *
 * Months past the last published figure are carried at the most recent rate and
 * counted separately, because that part is a projection and should be labelled
 * as one.
 */
export type BasisKind = 'reference' | 'measured';

export function ageing(
  fromYM: string,
  countryCode: string,
  now: Date = new Date(),
  kind: BasisKind = 'reference',
): Ageing {
  // The two kinds of price have different provenance and the sentence has to
  // say so: one was written down as a reference, the other was measured in a
  // shop. Describing a measured price as a "reference price set" would quietly
  // misrepresent the better of the two.
  const noun = kind === 'measured' ? 'Measured' : 'Reference price set';
  const series = SERIES[countryCode] ?? null;
  const start = ymToIndex(fromYM);
  const end = monthOf(now);
  const months = Math.max(0, end - start);

  if (!series || months === 0) {
    return {
      factor: 1, months, pct: 0, extrapolated: false, extrapolatedMonths: 0, series,
      basis: series
        ? `${noun} ${fromYM}. Same month as today, so there is nothing to age yet — this figure starts moving next month.`
        : `${noun} ${fromYM}. No published food inflation series is bundled for this country, so nothing has been aged and the figure is as old as it looks.`,
    };
  }

  const byMonth = new Map(series.points.map((p) => [ymToIndex(p.ym), p.annual]));
  const last = series.points[series.points.length - 1];
  const lastIdx = ymToIndex(last.ym);

  let factor = 1;
  let extrapolatedMonths = 0;
  for (let i = start; i < end; i++) {
    let annual = byMonth.get(i);
    if (annual == null) {
      annual = i > lastIdx ? last.annual : series.points[0].annual;
      extrapolatedMonths++;
    }
    factor *= Math.pow(1 + annual / 100, 1 / 12);
  }

  const pct = (factor - 1) * 100;
  const yyyymm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const parts = [
    `${noun} ${fromYM}, aged ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% to ${yyyymm} using ${series.source} (${series.label.toLowerCase()}).`,
  ];
  if (extrapolatedMonths > 0)
    parts.push(`${extrapolatedMonths} month${extrapolatedMonths === 1 ? '' : 's'} of that runs past the last published figure (${last.ym}, ${last.annual}%) and is carried at that rate.`);

  return { factor, months, pct, extrapolated: extrapolatedMonths > 0, extrapolatedMonths, series, basis: parts.join(' ') };
}
