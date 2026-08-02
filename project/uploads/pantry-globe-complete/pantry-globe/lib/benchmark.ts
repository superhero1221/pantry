import type { CountryProfile } from './types';

/**
 * What a cooked serving is actually being compared against.
 *
 * The app used to benchmark only against a restaurant portion. That is the
 * flattering comparison and the weak one: almost nobody chooses between cooking
 * a lentil dal and ordering a curry, and "you saved £9 on a takeaway" is a
 * claim the reader discounts on sight.
 *
 * The comparison the market already understands is the meal kit, because that
 * is the product actually competing for the same decision — someone who has
 * decided to cook at home this week and is choosing how to source it. The
 * incumbent planner apps benchmark that way for exactly this reason.
 *
 * Every figure below is a published UK price with a date attached, not a guess,
 * and each carries its own source string so the UI can show it. Ranges are
 * stored as ranges; where a single number is needed the CONSERVATIVE end is
 * used, so the comparison is always the hardest one for us to win.
 */

export interface Benchmark {
  id: string;
  label: string;
  /** GBP per single serving, low end — the conservative side of the comparison. */
  lowGBP: number;
  /** GBP per single serving, high end. */
  highGBP: number;
  /** Which country index scales it: grocery-like or restaurant-like. */
  scale: 'grocery' | 'restaurant';
  blurb: string;
  source: string;
}

export const BENCHMARK_DATE = '2026-07-27';

export const BENCHMARKS: Benchmark[] = [
  {
    id: 'kit_full',
    label: 'Meal kit, full price',
    lowGBP: 4.5,
    highGBP: 6.5,
    scale: 'grocery',
    blurb: 'Gousto, HelloFresh and similar once the introductory discounts run out. This is what a kit subscriber pays from about month two onward.',
    source: 'UK meal-kit list prices, July 2026',
  },
  {
    id: 'kit_intro',
    label: 'Meal kit, on introductory offer',
    lowGBP: 2.32,
    highGBP: 2.56,
    scale: 'grocery',
    blurb: 'Averaged across the first four boxes, where the discount is steepest. The fairest hard test — beat this and the full-price comparison follows.',
    source: 'MoneySavingExpert meal-box comparison, April 2026 (4 meals for 4 people)',
  },
  {
    id: 'planner_app',
    label: 'Best planned-shop app',
    lowGBP: 2.11,
    highGBP: 2.11,
    scale: 'grocery',
    blurb: "Cherrypick's published figure for its 'spend less' range, with real supermarket prices and a delivered basket behind it. The number to be measured against.",
    source: 'Cherrypick published figure, 2026',
  },
];

export interface BenchmarkLine {
  id: string;
  label: string;
  /** Local currency, per serving, conservative end. */
  low: number;
  high: number;
  /** Positive = we are cheaper by this much per serving. */
  saving: number;
  /** Fraction cheaper against the LOW end, e.g. 0.42 = 42% cheaper. */
  share: number;
  beats: boolean;
  blurb: string;
  source: string;
}

/**
 * Compare a per-serving cost against every benchmark.
 *
 * `perServing` must be the MARGINAL cost — the value of food actually eaten.
 * Comparing a first-shop total against a meal kit would be dishonest in our own
 * favour: the kit ships exact portions and leaves you nothing, while a first
 * shop leaves a cupboard full of rice and spice you will eat for weeks. The
 * leftovers report is where that difference is accounted for, not here.
 */
export function benchmark(perServing: number, c: CountryProfile): BenchmarkLine[] {
  return BENCHMARKS.map((b) => {
    const k = (b.scale === 'restaurant' ? c.restaurantIndex : c.index) * c.fx;
    const low = b.lowGBP * k;
    const high = b.highGBP * k;
    return {
      id: b.id,
      label: b.label,
      low,
      high,
      saving: low - perServing,
      share: low > 0 ? (low - perServing) / low : 0,
      beats: perServing < low,
      blurb: b.blurb,
      source: b.source,
    };
  });
}

/**
 * One honest headline sentence. Returns null when there is nothing worth
 * claiming — a plan that loses to every benchmark should say nothing rather
 * than reach for the one comparison it happens to win.
 */
export function headline(lines: BenchmarkLine[], perServing: number, fmt: (n: number) => string): { text: string; kind: 'good' | 'warn' } {
  const won = lines.filter((l) => l.beats);
  if (!won.length) {
    const cheapest = [...lines].sort((a, b) => a.low - b.low)[0];
    return {
      kind: 'warn',
      text: `At ${fmt(perServing)} a serving this comes out above ${cheapest.label.toLowerCase()} (${fmt(cheapest.low)}). Dropping to a discount shop or cutting the meat-heavy days is what moves this number.`,
    };
  }
  // claim against the hardest benchmark actually beaten
  const hardest = won.sort((a, b) => a.low - b.low)[0];
  return {
    kind: 'good',
    text: `${fmt(perServing)} a serving — ${Math.round(hardest.share * 100)}% under ${hardest.label.toLowerCase()} at ${fmt(hardest.low)}.`,
  };
}
