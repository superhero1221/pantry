/**
 * A second opinion from Jev, asked through the app's own Supabase function.
 *
 * Off unless BOTH a Supabase project is configured AND the build sets
 * VITE_JEV=1. Off, `decide()` answers null at once and touches nothing — no
 * request, no timer, no state — so a build without the flag is the app it was.
 *
 * On, it posts { task, input, lang } to `<VITE_SUPABASE_URL>/functions/v1/
 * jev-decide` with the public anon key, exactly like any other Supabase call
 * the app makes. There is no OpenRouter key anywhere on this side and there
 * never can be: the questions and the key both live in the function
 * (supabase/functions/jev-decide), and the client only sends what the user
 * typed.
 *
 * Every failure is null: no flag, no network, slow (1500 ms), refused,
 * malformed. Callers treat null as "carry on exactly as before", which is the
 * whole contract. It never throws.
 */
import type { CravingAnswers, ItemAnswers, PriceAnswers, PriceInput } from '../../supabase/functions/jev-decide/templates';

export type JevTask = 'craving' | 'pantry_item' | 'price_report';
export type JevInput = { craving: string; pantry_item: string; price_report: PriceInput };
export type JevAnswers = { craving: CravingAnswers; pantry_item: ItemAnswers; price_report: PriceAnswers };

export const JEV_TIMEOUT_MS = 1500;

const INTENTS = ['quick', 'cheap', 'comforting', 'light', 'high_protein', 'spicy', 'vegetarian_leaning'] as const;
const DIETS = ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free', 'no_pork', 'no_alcohol'] as const;
const PRICE_ERRORS = ['none', 'wrong_currency', 'extra_zero_or_decimal_slip', 'per_kg_vs_pack', 'wrong_item', 'other'];

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const p01 = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
const label = (x: unknown): string | null => (typeof x === 'string' && /^[a-z_]{1,40}$/.test(x) ? x : null);

/**
 * The function's answer, checked again here. The function is ours, but the
 * wire is the wire: a value that is not the shape promised is dropped rather
 * than trusted, and an answer with nothing usable in it is null.
 */
export function readAnswers<T extends JevTask>(task: T, json: unknown): JevAnswers[T] | null {
  if (!isObj(json) || json.ok !== true || json.task !== task || !isObj(json.answers)) return null;
  const a = json.answers;
  if (task === 'craving') {
    const src = isObj(a.intents) ? a.intents : {};
    const intents = Object.fromEntries(INTENTS.map((k) => [k, p01(src[k])])) as CravingAnswers['intents'];
    const out: CravingAnswers = { cuisine: label(a.cuisine), cuisine_confidence: p01(a.cuisine_confidence), intents };
    if (!out.cuisine && INTENTS.every((k) => intents[k] === null)) return null;
    return out as JevAnswers[T];
  }
  if (task === 'pantry_item') {
    const out = Object.fromEntries(DIETS.map((d) => [d, p01(a[d])])) as ItemAnswers;
    if (DIETS.every((d) => out[d] === null)) return null;
    return out as JevAnswers[T];
  }
  const e = label(a.error);
  const out: PriceAnswers = {
    plausible: p01(a.plausible),
    error: e && PRICE_ERRORS.includes(e) ? (e as PriceAnswers['error']) : null,
    error_confidence: p01(a.error_confidence),
  };
  if (out.plausible === null && !out.error) return null;
  return out as JevAnswers[T];
}

export interface JevConfig {
  url?: string;
  anonKey?: string;
  flag?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function createJev(cfg: JevConfig) {
  const enabled = !!(cfg.url && cfg.anonKey) && cfg.flag === '1';
  const endpoint = enabled ? cfg.url!.replace(/\/+$/, '') + '/functions/v1/jev-decide' : '';
  const timeoutMs = cfg.timeoutMs ?? JEV_TIMEOUT_MS;
  /** Answers already had, and questions already in flight, by exact input.
   *  Failures are not kept: the next ask gets a fresh chance. */
  const cache = new Map<string, Promise<unknown>>();

  async function ask<T extends JevTask>(task: T, input: JevInput[T], lang: string): Promise<JevAnswers[T] | null> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const f = cfg.fetchImpl ?? globalThis.fetch;
      const res = await f(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.anonKey!,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
        body: JSON.stringify({ task, input, lang }),
        signal: ctl.signal,
      });
      if (!res.ok) return null;
      return readAnswers(task, await res.json());
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function decide<T extends JevTask>(task: T, input: JevInput[T], lang = 'en'): Promise<JevAnswers[T] | null> {
    if (!enabled) return Promise.resolve(null);
    try {
      const key = task + '|' + lang + '|' + JSON.stringify(input);
      const had = cache.get(key) as Promise<JevAnswers[T] | null> | undefined;
      if (had) return had;
      const p = ask(task, input, lang).then((r) => {
        if (r === null) cache.delete(key);
        return r;
      });
      if (cache.size >= 100) cache.delete(cache.keys().next().value as string);
      cache.set(key, p);
      return p;
    } catch {
      return Promise.resolve(null);
    }
  }

  return { enabled, decide };
}

/* Written so that a build without VITE_JEV=1 folds all of this to `false`
   and a null-returning stub: the bundler drops the client, and nothing in the
   shipped code can reach the function at all. */
const FLAG = import.meta.env.VITE_JEV === '1';
const jev = FLAG
  ? createJev({
      url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
      flag: import.meta.env.VITE_JEV as string | undefined,
    })
  : null;

/** True only in a build made with VITE_JEV=1 against a configured project. */
export const jevEnabled: boolean = FLAG && !!jev && jev.enabled;
export const decide: ReturnType<typeof createJev>['decide'] = jev
  ? jev.decide
  : () => Promise.resolve(null);
