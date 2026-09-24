/**
 * Whether to ask "are you sure?" before a price report goes in.
 *
 * Asking is the only thing this can do. It never refuses and never changes a
 * number on its own: the reader sees the price they typed, how far it is from
 * the usual one, a suggested correction where the arithmetic finds one, and a
 * button that sends what they typed anyway. With no answer from Jev (off,
 * slow, failed) it does not ask at all, and the report goes in as it always
 * has.
 */
import type { PriceAnswers } from '../../supabase/functions/jev-decide/templates';

/** Jev's "plausible" below this, and the app asks. */
export const PLAUSIBLE_MAX = 0.2;
/** Or Jev names a kind of mistake with more confidence than this. */
export const ERROR_CONFIDENCE_MIN = 0.8;

export interface PriceCheck {
  /** Show the confirm step. */
  ask: boolean;
  /** typed / modelled, for "about 900x the usual price". */
  ratio: number;
  /** A corrected amount the arithmetic supports, or null. */
  suggestion: number | null;
  error: PriceAnswers['error'];
}

const near = (a: number, b: number) => a / b >= 1 / 3 && a / b <= 3;

/**
 * The correction that best explains a slip, if one lands within a factor of
 * three of the modelled price: a power of ten (a stray zero, a decimal in the
 * wrong place), or a per-kilo price typed against a smaller pack.
 */
export function suggestFix(price: number, modelled: number, packGrams: number, error: PriceAnswers['error']): number | null {
  if (!(price > 0 && modelled > 0)) return null;
  // A price in the wrong money has no arithmetic fix the app can stand
  // behind — exchange rates are not powers of ten — so it asks instead.
  if (error === 'wrong_currency') return null;
  const tries: number[] = [];
  if (error === 'per_kg_vs_pack' && packGrams > 0) tries.push((price * packGrams) / 1000);
  for (const k of [1, 2, 3]) tries.push(price / 10 ** k, price * 10 ** k);
  if (error !== 'per_kg_vs_pack' && packGrams > 0) tries.push((price * packGrams) / 1000);
  const ok = tries.filter((x) => x > 0 && near(x, modelled));
  if (!ok.length) return null;
  // Closest on a log scale, so ×10 and ÷10 are judged alike.
  ok.sort((a, b) => Math.abs(Math.log(a / modelled)) - Math.abs(Math.log(b / modelled)));
  return ok[0];
}

export function priceCheck(a: PriceAnswers | null, price: number, modelled: number, packGrams: number): PriceCheck {
  const ratio = modelled > 0 ? price / modelled : 1;
  if (!a) return { ask: false, ratio, suggestion: null, error: null };
  const implausible = a.plausible !== null && a.plausible < PLAUSIBLE_MAX;
  const namedError = !!a.error && a.error !== 'none' && (a.error_confidence ?? 0) > ERROR_CONFIDENCE_MIN;
  const ask = implausible || namedError;
  return { ask, ratio, suggestion: ask ? suggestFix(price, modelled, packGrams, a.error) : null, error: a.error };
}
