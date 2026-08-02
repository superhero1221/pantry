export interface Lang {
  code: string;
  native: string;
  dir: 'ltr' | 'rtl';
}

type Dict = Record<string, string>;

/** Everything beyond the flat UI strings — dish names, cuisines, card labels,
 *  difficulty words and the fragments the app assembles sentences from. */
export interface Pack {
  /** Dish subtitles ("with rice", "on toast") keyed by recipe id. */
  lo: Dict;
  /** What each data source is used for, in SOURCES order. */
  us: string[];
  plans: string[];
  /** Country names for the passport rows. */
  pc: Dict;
  /** Perishable amounts a1…a5, plus "cooked" / "time" / "times". */
  am: Dict;
  /** Sentences with {placeholders}, plus `week` — the weekday initials. */
  h: Dict & { week?: string[] };
  /** Longer assembled sentences with {placeholders}. */
  v: Dict;
  /** Interface copy that only appears once. */
  u: Dict;
  /** Country names as they read inside a sentence. */
  cn: Dict;
  /** The shopping-list honesty lines. */
  sl: Dict;
  /** The learning questions — each is { q, why, o: [options] } — alongside the
   *  flat `noted` and `empty` strings the Stats screen uses. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: Record<string, any>;
  /** What the app has worked out about you, as [title, body]. */
  L: Record<string, [string, string]>;
  x: Dict;
  s: Dict;
  levels: string[];
  r: Dict;
  dishes: Dict;
  cuisines: Dict;
  diff: Record<number | string, string>;
  skill: Dict;
  times: Dict;
  sTiers: Dict;
  tTiers: Dict;
  cravings: string[];
  shops: Dict;
  goals: Dict;
  /** Single words and short fragments. */
  w: Dict;
}

export declare const LANGS: Lang[];
export declare const diets: (code: string) => Dict;
export declare const pack: (code: string) => Pack;
export declare const dirOf: (code: string) => 'ltr' | 'rtl';
export declare const nativeOf: (code: string) => string;
export declare const strings: (code: string) => Dict;
export declare const detect: () => string;
