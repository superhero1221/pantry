import type {
  BrowseCat,
  Country,
  Diet,
  HistoryRow,
  PassportRow,
  Perishable,
  Recipe,
  Source,
  Store,
  TechniqueCard,
} from './types';

export declare const SKILL_CARDS: TechniqueCard[];
export declare const SKILL_LEVELS: { lvl: 1 | 2 | 3 | 4; ids: string[] }[];
export declare const DIETS: Diet[];
export declare const COUNTRIES: Record<string, Country>;
export declare const STORES_BY_COUNTRY: Record<string, Store[]>;
export declare const GOALS: string[];
export declare const STORES: Store[];
export declare const RECIPES: Recipe[];
export declare const PASSPORT: PassportRow[];
export declare const HISTORY: HistoryRow[];
export declare const PERISH: Perishable[];
export declare const STAPLES: string[];
export declare const CRAVINGS: string[];
export declare const COPYCAT_HINTS: string[];
export declare const LEARNED_PING: Record<string, string>;
export declare const LEARNED_TEXT: Record<string, [string, string]>;
export declare const SOURCES: Source[];
export declare const BROWSE_CATS: BrowseCat[];
export declare const PILL: string;
export declare const PILL_ON: string;
export declare const PILL_OFF: string;
