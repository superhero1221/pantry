import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import {
  BROWSE_CATS,
  COPYCAT_HINTS,
  COUNTRIES,
  CRAVINGS,
  DIETS,
  GOALS,
  HISTORY,
  LEARNED_PING,
  LEARNED_TEXT,
  PASSPORT,
  PERISH,
  PILL_OFF,
  PILL_ON,
  RECIPES as RAW_RECIPES,
  SKILL_CARDS,
  SKILL_LEVELS,
  SOURCES,
  STAPLES,
  STORES_BY_COUNTRY,
} from '../data/cookbook';
import type { HistoryRow, Item, Recipe, Store, TechniqueCard } from '../data/types';
import * as food from '../lib/food-table';
import * as i18n from '../data/pantry-i18n';
import type { Fx, Shop } from '../data/pantry-live';
import { cloudEnabled, getDb } from '../lib/supabase';
import { asset } from '../lib/asset';
import { techniqueOf } from '../lib/technique';
import { DERIVED, meetsDiet } from '../lib/diets';
import { fromLocal, toLocal } from '../lib/money';
import { clampLevel, levelFromCards, type Level } from '../lib/skill';
import { canonical } from '../lib/nutrition';
import { xt } from '../data/extra-copy';
import { loadPack, needsPack, ready as packReady } from '../data/lang-pack';
import { exportBackup, readBackup, readStore, STORE_KEY } from '../lib/backup';
import {
  pullCooks,
  pullProfile,
  pushCooks,
  pushProfile,
  priceMedians,
  reportPrice,
  scheduleReminder,
  useSession,
  useThrottled,
  type CloudProfile,
  type LocalCook,
  type PriceMedian,
} from './cloud';

/** Photographs are resolved against BASE_URL once, here, rather than at each
 *  of the five places a dish picture is rendered.
 *
 *  `have` is canonicalised at the same time, and it has to be: `isOwned` looks
 *  a cupboard key up in this list, the key is folded through the alias map, and
 *  a recipe whose list still said "Onions" would answer no to "Onion" and put
 *  an onion you already own back on your shopping list. */
const RECIPES: Recipe[] = RAW_RECIPES.map((r) => ({
  ...r,
  pic: asset(r.pic),
  have: r.have.map((h) => canonical(h)),
}));

/** How many countries the cookbook actually covers — the Passport's
 *  denominator. Counted from the recipes rather than typed in, because the
 *  number that was typed in said 91 long after it meant anything. */
const COVERED = new Set(RECIPES.map((r) => r.code)).size;

export type Screen =
  | 'welcome'
  | 'goal'
  | 'tier'
  | 'diet'
  | 'locate'
  | 'home'
  | 'browse'
  | 'results'
  | 'shop'
  | 'cook'
  | 'after'
  | 'kitchen'
  | 'stats'
  | 'passport'
  | 'plan'
  | 'settings'
  | 'privacy'
  | 'terms';

type Waste = 'none' | 'some' | 'lots';

/** Live rates as last seen, plus the moment we saw them. `at` is ours, not the
 *  ECB's, and it is what holds the app to one ask a day. Null anywhere means it
 *  is running on the rates it shipped with — which is also exactly where a
 *  failed, blocked or offline fetch leaves it. */
interface FxCache extends Fx {
  at: number;
}

/** Poses in `public/mascot` — small, empty-handed, for the corner. */
export type Pose = 'walk' | 'wink' | 'think' | 'cheer';

/** Poses in `public/mascot/big` — holding something, for a screen. */
export type BigPose = 'point' | 'celebrate' | 'lose' | 'gain' | 'muscle' | 'cheap' | 'energy';

export interface PantryState {
  screen: Screen;
  seen: boolean;
  /** How much cooking you have done, 1..4, or null for never said. */
  level: Level | null;
  diets: string[];
  country: string | null;
  locating: boolean;
  located: boolean;
  query: string;
  budget: number;
  /** How many times you have asked for a different dinner this visit. */
  reroll: number;
  refineOpen: boolean;
  budgetOtherOpen: boolean;
  budgetDraft: string;
  maxTime: number;
  pickId: string;
  showMicro: boolean;
  store: string;
  step: number;
  timerLeft: number;
  timerRun: boolean;
  lostOpen: boolean;
  waste: Waste | null;
  /** A plan save is in flight — the button is a no-op until it lands. */
  planSaving: boolean;
  /** The last Set was refused. Set only by commitBudget, cleared by the next
   *  keystroke: the field states the range once and then shuts up. */
  budgetErr: boolean;
  /** Open Prices and the community medians are two independent lookups, so
   *  they get two flags. One boolean would let whichever finished first turn
   *  off the other one's spinner. The bag ORs them into `pricesBusy`. */
  openBusy: boolean;
  medianBusy: boolean;
  /** The log row this cook went in as, so the waste answer annotates it
   *  rather than creating it. Reset when a new cook starts; never persisted. */
  cookLogId: string | null;
  reminded: boolean;
  notif: string | null;
  toggles: Record<string, boolean>;
  lang: string | null;
  langOpen: boolean;
  liveStatus: 'idle' | 'locating' | 'placed' | 'live' | 'noshops' | 'error';
  liveErr: string | null;
  liveCity: string | null;
  liveArea: string | null;
  liveShops: Shop[] | null;
  liveCoords: { lat: number; lon: number } | null;
  browseCat: string;
  history: LocalCook[];
  profile: Record<string, string>;
  dismissed: Record<string, boolean>;
  photoSkipped: boolean;
  plate: string | null;
  /** Explicit "I have this" / "I do not" overrides, keyed by canonical name.
   *  Absent means "no opinion" and the default below decides. */
  owned: Record<string, boolean>;
  /** Optional extras you have actually asked for, keyed the same way. Absent
   *  means you have not, and an extra you have not asked for is not part of
   *  what the dish costs. Deliberately not folded into `owned`: not wanting
   *  the dip is not the same claim as having it in the fridge. */
  extras: Record<string, boolean>;
  medians: Record<string, PriceMedian>;
  /** Open Prices, keyed the same way as medians. Crowdsourced worldwide under
   *  an open licence, so it needs no account and arrives for signed-out users
   *  too — the one real price source this app has without a vendor deal. */
  openPrices: Record<string, { perKg: number; n: number; newest: string }>;
  reportFor: string | null;
  reportPrice: string;
  reportPack: string;
  reportBusy: boolean;
  planDays: number;
  planMeals: number;
  planServings: number;
  plan: string[];
  planSaved: boolean;
  /** What a pound is worth today, where anyone has managed to ask. Null is the
   *  ordinary case, not the error case: it means the bundled rates. */
  fx: FxCache | null;
  /** The ingredient table has landed. Held here only because a render has to
   *  happen when it does — nothing reads it. English never needs it at all. */
  foodReady: boolean;
  /** Never read for its value — see the memos below. */
  packAt: string;
}

const INITIAL: PantryState = {
  screen: 'welcome',
  seen: false,
  level: null,
  diets: [],
  country: null,
  locating: false,
  located: false,
  query: '',
  budget: 6,
  reroll: 0,
  refineOpen: false,
  budgetOtherOpen: false,
  budgetDraft: '',
  maxTime: 60,
  pickId: 'pad_thai',
  showMicro: false,
  store: 'gb1',
  step: 0,
  timerLeft: 0,
  timerRun: false,
  lostOpen: false,
  waste: null,
  planSaving: false,
  budgetErr: false,
  openBusy: false,
  medianBusy: false,
  cookLogId: null,
  reminded: false,
  notif: null,
  toggles: { leftover: true, mascot: true },
  lang: null,
  langOpen: false,
  liveStatus: 'idle',
  liveErr: null,
  liveCity: null,
  liveArea: null,
  liveShops: null,
  liveCoords: null,
  browseCat: 'all',
  // Eight weeks of sample cooks so the Stats screen is legible before you have
  // cooked anything. Marked seeded so it never reaches anyone's account.
  history: HISTORY.map((h) => ({ ...h, seeded: true })),
  profile: {},
  dismissed: {},
  photoSkipped: false,
  plate: null,
  owned: {},
  extras: {},
  medians: {},
  openPrices: {},
  reportFor: null,
  reportPrice: '',
  reportPack: '',
  reportBusy: false,
  planDays: 5,
  planMeals: 1,
  planServings: 2,
  plan: [],
  planSaved: false,
  fx: null,
  foodReady: false,
  packAt: '',
};

/* ── What survives a reload ────────────────────────────────────────────────
   Only what the user actually told the app: their languages, how much cooking
   they have done, their diets, what they cooked. Never the transient screen
   state.
   "Start over" in Settings clears the lot. */
// STORE_KEY itself now lives in lib/backup.ts, imported above: the crash
// screen and the export both have to name it, and neither can afford to
// import this file.
export const KEEP = [
  'seen',
  'level',
  'diets',
  'country',
  'budget',
  'maxTime',
  'lang',
  'toggles',
  'history',
  'profile',
  'dismissed',
  'planDays',
  'planMeals',
  'planServings',
  'plan',
  'owned',
  'extras',
] as const;

const isObj = (x: unknown) => !!x && typeof x === 'object' && !Array.isArray(x);
const isNum = (x: unknown) => typeof x === 'number' && Number.isFinite(x);

/** The most one dinner is allowed to cost, in the pounds-and-pence baseline.
 *  Not a judgement about your money: past this, every "under budget" figure on
 *  the results screen is a number nobody reads and the chip stops being a chip.
 *  It bounds what commitBudget will accept and what an imported file may carry,
 *  so a file cannot smuggle in what the keyboard refuses. */
const MAX_BASE = 1000;

/** The value each kept key is allowed to be. The boot read never needed this —
 *  nothing but save() below writes that key. An imported file is a different
 *  proposition, so both now go through the same gate, and a key of the wrong
 *  shape is dropped rather than handed to a screen that will call .map on it. */
export const SHAPE: Record<string, (x: unknown) => boolean> = {
  seen: (x) => typeof x === 'boolean',
  /* A gate, not a coercion: anything outside 1..4 is dropped rather than
     clamped, and skillLevel() supplies the default. Adding a name to KEEP
     without a line here is not a missing key — SHAPE[k] is called
     unconditionally, the throw is swallowed by load()'s catch, and the whole
     profile is silently wiped. persist.test.ts exists to catch exactly that. */
  level: (x) => x === null || (typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 4),
  diets: Array.isArray,
  country: (x) => x === null || typeof x === 'string',
  budget: (x) => isNum(x) && (x as number) > 0 && (x as number) <= MAX_BASE,
  maxTime: isNum,
  lang: (x) => typeof x === 'string',
  toggles: isObj,
  history: Array.isArray,
  profile: isObj,
  dismissed: isObj,
  planDays: isNum,
  planMeals: isNum,
  planServings: isNum,
  plan: Array.isArray,
  owned: isObj,
  extras: isObj,
};

/**
 * What this build still keeps out of a stored blob, whatever wrote it — the
 * boot read and an imported file both come through here, so a file can never
 * carry in something a reload would not have kept.
 *
 * Copied key by key from KEEP, never spread. Blobs written by earlier builds
 * carry retired keys — streak, vendorKey, the shrink and shop toggles — and an
 * unfiltered spread would resurrect them into state, back into storage on the
 * next save, and up into the cloud profile, forever. A file someone hands you
 * can carry anything at all, including `__proto__`: JSON.parse makes that an
 * ordinary own property rather than the setter, and this loop only ever reads
 * the seventeen names it was given, so neither route reaches anything.
 */
/** Re-key a saved map through the alias map.
 *
 *  A kitchen saved before ingredient names were canonicalised has "Onions" in
 *  it, and `keyOf` now answers "Onion". Without this, everything a returning
 *  cook had ticked would quietly come back unticked — the app would look like
 *  it had forgotten them, which is worse than never having stored it. Later
 *  writes win over earlier ones, so an explicit "no" set against the new
 *  spelling is not overwritten by an old "yes". */
const realias = <T,>(map: Record<string, T>): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(map)) out[canonical(k)] = v;
  return out;
};

export function pick(blob: Record<string, unknown>): Partial<PantryState> {
  const out: Record<string, unknown> = {};
  for (const k of KEEP) if (k in blob && SHAPE[k](blob[k])) out[k] = blob[k];
  /* A tier list saved by an older build. The loop above only ever looks at KEEP
     names, so the moment 'skill' left KEEP these maps became invisible to it —
     they have to be read straight off the blob.
     This is the only chance there will ever be. usePantry's very first effect
     is save(S), and save writes KEEP and nothing else, so one render after an
     unmigrated boot the old maps are gone from storage with no backup. Both
     callers reach here: the boot read and an imported file. */
  if (out.level == null && isObj(blob.skill)) {
    out.level = levelFromCards(blob.skill as Record<string, unknown>);
  }
  if (isObj(out.toggles)) {
    const was = out.toggles as Record<string, boolean>;
    out.toggles = { leftover: was.leftover ?? true, mascot: was.mascot ?? true };
  }
  if (isObj(out.owned)) out.owned = realias(out.owned as Record<string, boolean>);
  if (isObj(out.extras)) out.extras = realias(out.extras as Record<string, boolean>);
  return out as Partial<PantryState>;
}

function load(): Partial<PantryState> {
  try {
    const raw = readStore();
    if (!raw) return {};
    return pick(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return {};
  }
}

/** How many cooks came back with an imported file, carried across the reload
 *  that applies it. A toast cannot survive a reload, and writing one to state
 *  before the reload would put the old profile straight back over the file. */
const IMPORTED_KEY = 'pantry.imported.v1';

function save(s: PantryState) {
  try {
    const out: Record<string, unknown> = {};
    for (const k of KEEP) out[k] = s[k];
    localStorage.setItem(STORE_KEY, JSON.stringify(out));
  } catch {
    /* private mode, quota — the app works fine without it */
  }
}

/* ── What a pound is worth ─────────────────────────────────────────────────
   Its own key, deliberately not part of the profile above: an exchange rate is
   not something you told the app, so "Start over" forgets you and leaves this
   where it is. Read synchronously at boot so a returning user never sees a
   price change shape a frame after opening, and written only when a fetch has
   actually come back with something. Missing, unreadable or half-written all
   mean the bundled rates, which is where the app starts anyway. */
const FX_KEY = 'pantry.fx.v1';
const FX_TTL = 864e5;

function loadFx(): FxCache | null {
  try {
    const raw = localStorage.getItem(FX_KEY);
    const f = raw ? (JSON.parse(raw) as FxCache) : null;
    return f && f.rates && typeof f.rates === 'object' && typeof f.at === 'number' ? f : null;
  } catch {
    return null;
  }
}

function saveFx(f: FxCache) {
  try {
    localStorage.setItem(FX_KEY, JSON.stringify(f));
  } catch {
    /* private mode, quota — the bundled rates are always there */
  }
}

function initialState(): PantryState {
  const saved = load();
  const s = { ...INITIAL, ...saved, fx: loadFx() };
  /* The browser's language before the first frame rather than in an effect
     after it. `dir` is computed from this, so a first-time Arabic or Urdu
     visitor used to get an English left-to-right frame and then a flip — with
     all six languages fully bundled, so it was never the loading that caused
     it. Guarded the way crash.ts guards the same call: a runtime with no
     `navigator` is not a reason to render nothing. */
  if (!s.lang) {
    try {
      s.lang = i18n.detect();
    } catch {
      /* no navigator — English, which is what detect() would have said */
    }
  }
  if (s.seen) s.screen = 'home';
  // Where the address bar says, within reason. Someone who has not been
  // through the setup starts at the welcome whatever the hash claims, and
  // someone who has finished it is never dropped back into it by one left over
  // from last time.
  // The small print is the one exception to "finish the setup first": you have
  // to be able to read what an app does with you before you agree to any of it.
  const at = typeof window !== 'undefined' ? parseHash(window.location.hash) : null;
  if (at && (s.seen || LEGAL.indexOf(at.screen) >= 0) && ONBOARDING.indexOf(at.screen) < 0) {
    s.screen = at.screen;
    if (at.pickId) s.pickId = at.pickId;
  }
  // /privacy and /terms, normalised to the hash before anything renders, so the
  // address bar never ends up saying /privacy#/settings two taps later.
  const path = legalPath();
  if (path) {
    s.screen = path;
    try {
      window.history.replaceState({ pg: 0 }, '', BASE + '#/' + path);
    } catch {
      /* opaque origin — the hash the router writes next says the same thing */
    }
  }
  return s;
}

/** Canonical ingredient key — the name before the first comma, which is what
 *  the recipe `have` lists and the cupboard both match on, folded through the
 *  alias map so one cupboard entry covers every spelling of the thing.
 *
 *  The original fourteen recipes were written independently and drifted:
 *  "Onion" and "Onions", "Carrot" and "Carrots", "Cumin" and "Ground cumin"
 *  were four different things to a cupboard that matches on the string. With
 *  fourteen dishes you might not notice. With a hundred and fifty, the Kitchen
 *  lists both spellings and owning one does not stop the other appearing on
 *  your shopping list, which is precisely the promise the screen makes. */
const keyOf = (name: string) => canonical(name.split(',')[0].trim());

/** The budget presets the design ships, in GBP: the chip row on Home, and the
 *  set that a typed-in amount is measured against. */
const BUDGETS = [3, 5, 6, 8, 12];

/** One of the four answers to "What can you already do?".
 *
 *  Not PILL_ON: white on #c67139 is 3.61:1, under AA at this size, and colour
 *  on its own is not a state anyway. This is the highlight the tier rows
 *  already used — a peach fill inside an orange ring — plus a tick, so the
 *  chosen row survives both a contrast check and a greyscale screenshot. */
const LEVEL_ROW =
  'display:flex;flex-direction:column;align-items:stretch;gap:4px;width:100%;min-height:64px;' +
  'padding:13px 16px;border-radius:22px;text-align:start;color:#201e1d;' +
  'transition:background .15s,box-shadow .15s;';
const LEVEL_ON = 'background:#ffe1d0;box-shadow:inset 0 0 0 2px #c67139;';
const LEVEL_OFF = 'background:#f9f4ed;box-shadow:inset 0 0 0 1px rgba(32,30,29,.06);';

/** Days since a cook. Real rows age with the calendar; seeded sample rows keep
 *  the age they shipped with, because a stage set should not rot — the sample
 *  chart is a diorama, says so, and steps aside on the first real cook anyway.
 *  This used to trust the stored snapshot for real rows too, which logCook
 *  wrote as 0 and nothing ever aged: every dinner ever cooked counted as
 *  "this week", forever, and the week-over-week delta was fiction. */
const ageOf = (x: LocalCook) =>
  x.seeded ? x.ago : Math.max(0, Math.floor((Date.now() - x.at) / 864e5));

/** The local calendar day a timestamp falls on, as a comparable key. */
const dayKey = (t: number) => {
  const d = new Date(t);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** Consecutive calendar days with a real cook, ending today — or yesterday, so
 *  the streak is not dead at breakfast before tonight's dinner. The app used
 *  to ship this as a literal 4 and increment it when you accepted a smaller
 *  portion: a streak you could neither earn nor lose by cooking. Now it is
 *  read off the log, which means it can be zero, and zero is simply not shown
 *  rather than dressed up. */
const streakFrom = (history: LocalCook[]): number => {
  const days = new Set(history.filter((c) => !c.seeded).map((c) => dayKey(c.at)));
  if (!days.size) return 0;
  // Anchor at noon so stepping back 24h can never skip or repeat a local day
  // across a DST change.
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);
  let t = noon.getTime();
  if (!days.has(dayKey(t))) t -= 864e5;
  let n = 0;
  while (days.has(dayKey(t))) {
    n += 1;
    t -= 864e5;
  }
  return n;
};

/** English names for every country the cookbook covers — the last resort after
 *  the translated maps, so a real cook from Mexico never renders as "MX". */
const COUNTRY_NAMES: Record<string, string> = {
  TH: 'Thailand', US: 'United States', CN: 'China', FR: 'France', IN: 'India',
  GB: 'United Kingdom', MA: 'Morocco', MX: 'Mexico', VN: 'Vietnam',
  NG: 'Nigeria', IT: 'Italy',
};

/* ── The address bar ───────────────────────────────────────────────────────
   Pantry had no routing at all: the URL never moved, so the phone's own back
   button left the app instead of stepping back a screen, and a reload dropped
   you at Home with the dish you were reading gone. One history entry per
   screen answers both.

   The four screens that are about a particular dish carry its id, because the
   pick is deliberately not in KEEP — the address bar, not localStorage, is
   where a screen's transient subject belongs. */
const SCREENS: Screen[] = [
  'welcome', 'goal', 'tier', 'diet', 'locate', 'home', 'browse', 'results',
  'shop', 'cook', 'after', 'kitchen', 'stats', 'passport', 'plan', 'settings',
  'privacy', 'terms',
];
const DISH_SCREENS: Screen[] = ['results', 'shop', 'cook', 'after'];
/** The setup is walked, never linked to. */
const ONBOARDING: Screen[] = ['welcome', 'goal', 'tier', 'diet', 'locate'];
/** The opposite of ONBOARDING: the two screens anyone may open, setup or no
 *  setup. A privacy policy that only a signed-up user can read is not one. */
const LEGAL: Screen[] = ['privacy', 'terms'];

/** Both documents are also reachable at a plain path, because an app-store
 *  listing cannot carry a fragment. No host rule is needed — /privacy already
 *  falls through to index.html the way every stray deep link does, and the
 *  worker answers it from the cached shell with no signal. This turns the path
 *  it arrived at into the hash the router speaks, in place and before the first
 *  render, so nothing downstream ever learns a path was involved. */
const BASE = import.meta.env.BASE_URL || '/';
const LEGAL_PATHS: Record<string, Screen> = { privacy: 'privacy', terms: 'terms' };

function legalPath(): Screen | null {
  if (typeof window === 'undefined') return null;
  const p = window.location.pathname;
  const rest = (p.indexOf(BASE) === 0 ? p.slice(BASE.length) : p.replace(/^\//, '')).replace(/\/$/, '');
  return LEGAL_PATHS[rest] ?? null;
}

/** Section order for each document. The copy itself is 'privLocalH' and
 *  'privLocalB' in extra-copy.ts, so adding a section is one entry here and
 *  two keys there — and the translation test keeps enforcing all six. */
const PRIV_SECTIONS = [
  'privLocal', 'privAccount', 'privDiet', 'privWhere', 'privPhoto',
  'privPush', 'privPrice', 'privOthers', 'privNever', 'privRights', 'privContact',
];
const TERM_SECTIONS = [
  'termWhat', 'termPrice', 'termAllergen', 'termCook', 'termAccount',
  'termLicence', 'termChange',
];

/** One address for both documents, so there is one place to change it. */
const LEGAL_CONTACT = 'privacy@pantryglobe.com';

const hashFor = (screen: Screen, pickId: string) =>
  '#/' + screen + (DISH_SCREENS.indexOf(screen) >= 0 ? '/' + pickId : '');

/** '#/results/pad_thai' → the screen, and the dish if this build has one by
 *  that name. A dish it does not recognise is dropped rather than obeyed: the
 *  screen keeps the pick it already had, so a dead link lands on a real dinner
 *  instead of a blank, and the hash is rewritten to say which one. */
/** The tab is labelled "You"; the screen has always been called `settings`.
 *  Anyone typing the name they can see landed on the home screen, so the name
 *  they can see is a route too. Written links keep saying `settings`. */
const ALIASES: Record<string, Screen> = { you: 'settings', tonight: 'home', week: 'plan' };

function parseHash(hash: string): { screen: Screen; pickId?: string } | null {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const head = ALIASES[parts[0]] || parts[0] || '';
  if ((SCREENS as string[]).indexOf(head) < 0) return null;
  const id = parts[1] || '';
  return RECIPES.some((r) => r.id === id)
    ? { screen: head as Screen, pickId: id }
    : { screen: head as Screen };
}

/** How many screens deep this entry is. Kept in history.state, which survives
 *  a reload — a counter of our own would forget, and the back button would
 *  stop stepping back at exactly the moment the stack is still there. */
const depthOf = () => {
  const st = window.history.state as { pg?: number } | null;
  return st && typeof st.pg === 'number' ? st.pg : 0;
};

/** Write an entry. A single-file build opened from a file:// page has an
 *  opaque origin and refuses one; the screen still changes, the URL simply
 *  stays put, which is what the whole app did before it had any routing. */
function writeHash(url: string, push: boolean) {
  try {
    const at = { pg: depthOf() + (push ? 1 : 0) };
    if (push) window.history.pushState(at, '', url);
    else window.history.replaceState(at, '', url);
  } catch {
    /* opaque origin — navigation still works, the address bar just stays put */
  }
}

export function usePantry() {
  const [S, setS] = useState<PantryState>(initialState);
  const ref = useRef(S);
  ref.current = S;
  const notifTimer = useRef<number | undefined>(undefined);

  const setState = useCallback(
    (patch: Partial<PantryState>) => setS((prev) => ({ ...prev, ...patch })),
    [],
  );

  useEffect(() => save(S), [S]);

  /* The ingredient names for whatever language that turned out to be. English
     is the key rather than a translation, so an English kitchen fetches
     nothing; every other one fetches the table once and the worker keeps it. */
  useEffect(() => {
    if (!food.needsTable(S.lang || 'en') || food.ready()) return;
    food.loadTable().then((ok) => {
      if (ok) setState({ foodReady: true });
    });
  }, [S.lang, setState]);

  /* The interface pack for whatever language that turned out to be. English is
     the fallback for the other five, so an English reader fetches nothing;
     every other one fetches about 16 kB once and the worker keeps it.

     Usually a no-op — main.tsx already waited for this before the first frame.
     It is here for the three ways a language can arrive later: the boot wait
     ran out of patience, a signed-in profile brought a different one down from
     the cloud, or the picker in Settings changed it.

     `packAt` is never read for its value. It is in the dependency lists of T
     and P below and nowhere else, because those two are keyed on the language,
     and a pack that lands without the language changing would otherwise never
     be picked up — leaving the whole interface in English until the next time
     somebody touched the language picker. Same job as foodReady, and out of
     KEEP for the same reason: it describes this boot, not this profile. */
  useEffect(() => {
    const code = S.lang || 'en';
    if (!needsPack(code) || packReady(code)) return;
    loadPack(code).then((ok) => {
      if (ok) setState({ packAt: code });
    });
  }, [S.lang, setState]);

  /* One-second tick for the cook-step timer. */
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = ref.current;
      if (s.timerRun && s.timerLeft > 0) setState({ timerLeft: s.timerLeft - 1 });
    }, 1000);
    return () => window.clearInterval(t);
  }, [setState]);

  const go = useCallback(
    (screen: Screen, extra?: Partial<PantryState>, replace?: boolean) => {
      setState({ screen, lostOpen: false, ...extra });
      // One entry per screen, so Back steps back through Pantry and only leaves
      // it from the screen you opened on. Arriving where you already are — a
      // nav tap on the tab you are on — replaces instead: an entry for every
      // tap that changed nothing is how Back comes to need twenty presses.
      // Chip taps never reach here at all. They are state, not a screen, and
      // they leave the address bar alone.
      const want = hashFor(screen, (extra && extra.pickId) || ref.current.pickId);
      writeHash(want, !replace && window.location.hash !== want);
      const el = document.querySelector('.pg-scroll');
      if (el) el.scrollTop = 0;
    },
    [setState],
  );

  /* The stack. The entry you arrive on is replaced rather than pushed, so Back
     from the first screen still leaves — the one place it should. */
  useEffect(() => {
    const h = window.location.hash;
    // A fragment that is not ours — a sign-in link carries its own — is left
    // alone rather than thrown away; the next screen change writes over it.
    if (!h || h.slice(0, 2) === '#/') {
      const want = hashFor(ref.current.screen, ref.current.pickId);
      if (h !== want) writeHash(want, false);
    }

    const onPop = () => {
      const cur = ref.current;
      const at = parseHash(window.location.hash);
      const to =
        at && (cur.seen || ONBOARDING.indexOf(at.screen) >= 0 || LEGAL.indexOf(at.screen) >= 0)
          ? at
          : null;
      const next: Screen = to ? to.screen : cur.seen ? 'home' : 'welcome';
      const pick = (to && to.pickId) || cur.pickId;
      // An entry this visit is not allowed to be on — the setup, to someone who
      // has not been through it — corrects the address bar instead of obeying
      // it, and stays where it is.
      if (!to) writeHash(hashFor(next, pick), false);
      setS((prev) =>
        prev.screen === next && prev.pickId === pick
          ? prev
          : { ...prev, screen: next, pickId: pick, lostOpen: false },
      );
      const el = document.querySelector('.pg-scroll');
      if (el) el.scrollTop = 0;
    };

    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  const ping = useCallback(
    (text: string) => {
      setState({ notif: text });
      window.clearTimeout(notifTimer.current);
      notifTimer.current = window.setTimeout(() => setState({ notif: null }), 4200);
    },
    [setState],
  );

  /* A file was loaded a moment ago, on the far side of the reload that applied
     it. The count rides across in sessionStorage because the import is not
     allowed to touch React state — `save(S)` runs on every change and would
     write the old profile straight back over the file it just placed. Read
     once, cleared immediately, so a second reload does not announce it twice.
     The language is already the imported one: initialState() read it. */
  useEffect(() => {
    let n: string | null = null;
    try {
      n = sessionStorage.getItem(IMPORTED_KEY);
      if (n !== null) sessionStorage.removeItem(IMPORTED_KEY);
    } catch {
      /* no session storage, no confirmation — the data arrived regardless */
    }
    if (n !== null) ping(xt(ref.current.lang || 'en', 'dataImported').split('{n}').join(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── The account ────────────────────────────────────────────────────────
     Local-first. Everything works signed out; signing in adopts whatever you
     already did on this device, then keeps it in step across your others. */
  const auth = useSession();
  const hydrated = useRef<string | null>(null);

  const asCloudProfile = (s: PantryState): Partial<CloudProfile> => ({
    goal: s.profile.goal || null,
    language: s.lang || 'en',
    max_time: s.maxTime,
    budget_amount: Number(s.budget.toFixed(2)),
    // Derived, not stored: the log is the truth and the profile column just
    // mirrors it for anything reading the table directly.
    streak: streakFrom(s.history),
    country: s.country || 'GB',
    diets: s.diets,
    skill_level: s.level,
    learned: s.profile,
    dismissed: s.dismissed,
    nudges: s.toggles,
    onboarded: s.seen,
  });

  useEffect(() => {
    const uid = auth.userId;
    if (!uid || hydrated.current === uid) return;
    hydrated.current = uid;
    let live = true;

    (async () => {
      const local = ref.current;
      const [remote, cooks] = await Promise.all([pullProfile(uid), pullCooks(uid)]);
      if (!live) return;

      // Anything you cooked before signing in belongs to you; carry it up.
      const mine = local.history.filter((c) => !c.seeded && c.clientId);
      if (mine.length) await pushCooks(uid, mine);

      const merged = new Map<string, LocalCook>();
      for (const c of cooks) merged.set(c.clientId!, c);
      for (const c of mine) if (!merged.has(c.clientId!)) merged.set(c.clientId!, c);
      const history = [...merged.values()].sort((a, b) => b.at - a.at);

      // A fresh account with an untouched device keeps the sample history so
      // Stats is not an empty room; the moment either side has a real cook,
      // the sample goes.
      const useSample = history.length === 0;

      if (!remote || !remote.onboarded) {
        // The account has nothing to say yet — this device does.
        await pushProfile(uid, asCloudProfile(local));
        setState({ history: useSample ? local.history.filter((c) => c.seeded) : history });
        return;
      }

      setState({
        lang: remote.language || local.lang,
        country: remote.country || local.country,
        diets: remote.diets ?? local.diets,
        maxTime: remote.max_time ?? local.maxTime,
        budget: Number(remote.budget_amount ?? local.budget),
        /* skill_level only, never skill_cards. An upsert touches only the
           columns it names, so the moment this build stopped writing
           skill_cards that map froze at whatever an older client last dragged
           into it. Falling back to it would let a stale tier list overrule the
           answer you tapped on your other phone. The migration read it once,
           server-side, to fill this column in — which is the only time it
           should ever be read again. */
        level: remote.skill_level == null ? local.level : clampLevel(remote.skill_level),
        profile: remote.learned ?? local.profile,
        dismissed: remote.dismissed ?? local.dismissed,
        toggles: remote.nudges ?? local.toggles,
        seen: remote.onboarded || local.seen,
        history: useSample ? local.history.filter((c) => c.seeded) : history,
      });
    })();

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId, setState]);

  useEffect(() => {
    if (!auth.userId) hydrated.current = null;
  }, [auth.userId]);

  /* Writes are throttled so a burst of taps on the tier list is one round trip. */
  const syncProfile = useThrottled<PantryState>((s) => {
    if (auth.userId) pushProfile(auth.userId, asCloudProfile(s));
  }, 2500);

  useEffect(() => {
    if (!auth.userId || hydrated.current !== auth.userId) return;
    syncProfile(S);
  }, [
    auth.userId,
    syncProfile,
    S,
    S.lang,
    S.country,
    S.diets,
    S.maxTime,
    S.budget,
    S.level,
    S.profile,
    S.dismissed,
    S.toggles,
    S.seen,
  ]);

  /* ── Language ─────────────────────────────────────────────────────────── */
  const lg = S.lang || 'en';
  /* S.packAt is the second dependency and it is never read. Without it a pack
     that lands after the first render is invisible: both memos are keyed on the
     language, the language has not changed, and the entire interface stays in
     English for the rest of the session. StrictMode will not reproduce it and
     no test can — both render passes happen in the same task. */
  const T = useMemo(() => i18n.strings(lg), [lg, S.packAt]);
  const P = useMemo(() => i18n.pack(lg), [lg, S.packAt]);
  /* Unmemoised and correct on the first paint whatever happens: dirOf reads
     only LANGS, which never leaves the main chunk. */
  const dir = i18n.dirOf(lg);

  const dish = (r: { id?: string; name: string }) => (r.id && P.dishes[r.id]) || r.name;
  const cuisineWord = (name: string) => P.cuisines[name] || name;
  const diffWord = (d: number) => P.diff[d] || ['Very easy', 'Easy enough', 'A stretch', 'A proper project'][d - 1];
  const word = (k: string, fb: string) => P.w[k] || fb;
  /** Ingredient names come from the packet, so they follow the interface language. */
  const foodName = (en: string) => food.foodName(lg, en);

  /* ── Money ────────────────────────────────────────────────────────────── */
  const cc = S.country || 'GB';
  const c = COUNTRIES[cc] || COUNTRIES.GB;
  /** Today's rate where a fetch has got through and the ECB publishes one for
   *  this currency; the rate the cookbook shipped with everywhere else. Naira,
   *  Pakistani rupees and dirhams are never in the published set, so those
   *  three always read from the cookbook — as does every country on a phone
   *  with no signal. A rate of 0, NaN or undefined falls through to the
   *  bundled number on the same line, so a malformed answer cannot land. */
  const fxLive = (S.fx && S.fx.rates[c.iso]) || 0;
  const fx = fxLive || c.fx;

  const fmt = useCallback(
    (gbp: number) => {
      const v = toLocal(gbp, c, fx);
      // Whole lira and whole naira, pounds and euros to the penny: that is a
      // property of the currency, not of today's rate. The bundled figure
      // decides the shape so a live rate can never change it.
      if (c.fx >= 40) return c.sym + Math.round(v).toLocaleString();
      return c.sym + v.toFixed(2);
    },
    [c, fx],
  );

  /** The inverse of fmt's arithmetic: a real price in real local money, turned
   *  back into the pounds-and-pence base the cookbook is written in.
   *
   *  Every measured price arrives in the currency it was paid in — a community
   *  report is stored as entered, Open Prices answers in the shop's currency —
   *  while everything the app computes is a GBP baseline that fmt multiplies up
   *  on the way out. Handing fmt a local figure multiplies it a second time,
   *  which is invisible in the UK (idx and fx are both 1) and off by 925x in
   *  Nigeria. Real money goes through here first. */
  const localToBase = useCallback((local: number) => fromLocal(local, c, fx), [c, fx]);

  /** The figure fmt() will actually print, handed back in pounds. Any line that
   *  multiplies a saving starts here: "×4" beside £10.18 read £40.70 because
   *  the four was applied to 10.1753, a number nobody was ever shown. It
   *  quantises in display money rather than in pounds, and takes the same
   *  branch fmt() takes, so whole lira and whole naira stay whole after they
   *  are multiplied. */
  const asShown = useCallback(
    (gbp: number) => {
      const k = c.idx * fx;
      const v = gbp * k;
      return (c.fx >= 40 ? Math.round(v) : Math.round(v * 100) / 100) / k;
    },
    [c, fx],
  );

  /* ── The budget ───────────────────────────────────────────────────────────
     Presets are held in GBP; a typed amount is local money divided back by
     c.idx * c.fx, so it almost never lands on a preset float exactly. Compare
     what the two print instead: if the row and the budget read alike, they are
     the same choice, and no epsilon has to be invented to say so. */
  const sameMoney = (a: number, b: number) => fmt(a) === fmt(b);
  const budgetIsCustom = !BUDGETS.some((b) => sameMoney(S.budget, b));

  /** The smallest amount fmt() can print as itself. It rounds to whole units
   *  where a pound buys forty of something and to hundredths where it does not,
   *  so the floor is one naira and one penny — a property of the currency, not
   *  of today's rate, which is why it reads c.fx and not fx. Type 0.001 today
   *  and the screen says "£0.00" and means it. */
  const minLocal = c.fx >= 40 ? 1 : 0.01;
  /** The ceiling in the same local money, scaled the way every other price is,
   *  so it is £1,000 in Birmingham and ₦925,600 in Lagos rather than a
   *  pounds-shaped number imposed on naira. */
  const maxLocal = MAX_BASE * c.idx * fx;

  const commitBudget = () => {
    const v = parseFloat(S.budgetDraft);
    // Both ends, in the money it was typed in. `v > 0` alone let £999999999
    // through, which wraps the chip row onto its own line and stretches every
    // "under your budget" figure downstream, and let 0.001 through, which
    // renders as £0.00 — the app showing you a number you did not ask for.
    // parseFloat('Infinity') is Infinity, and Infinity > 0 was true, so that
    // got in too.
    //
    // Refused, not clamped: quietly turning 999999999 into 1000 would be the
    // app claiming you asked for something you did not. The budget stays where
    // it was, what you typed stays in the field, and the screen says the range
    // once — see budgetRangeLine.
    if (!Number.isFinite(v) || v < minLocal || v > maxLocal) {
      setState({ budgetErr: true });
      return;
    }
    // Divide by the rate it was displayed at, not the bundled one, or a budget
    // typed in local money is stored as a different amount than it read.
    setState({
      budget: v / (c.idx * fx),
      // A new budget is a new question, so the offer starts again from the top.
      reroll: 0,
      budgetOtherOpen: false,
      budgetDraft: '',
      budgetErr: false,
    });
  };

  const storeList = useCallback((): Store[] => {
    const s = ref.current.liveShops;
    if (!s || !s.length) return STORES_BY_COUNTRY[cc] || STORES_BY_COUNTRY.GB;
    return s.slice(0, 4).map((x, i) => ({
      id: 'live' + i,
      name: x.name,
      tier: x.tierLabel,
      mult: x.mult,
      km: Math.round(x.km * 10) / 10,
      closes: x.hours ? x.hours.split(';')[0] : 'hours unknown',
      real: true,
    }));
  }, [cc]);

  const stores = storeList();
  const mult = (stores.find((s) => s.id === S.store) || stores[0]).mult;

  const recipe: Recipe = RECIPES.find((r) => r.id === S.pickId) || RECIPES[0];

  /**
   * What you said, then what the recipe assumes. Your answer always wins and
   * it sticks — that is the difference between a checklist and a cupboard.
   *
   * Deliberately NOT seeded from the Kitchen screen's store-cupboard list:
   * folding all eighteen staples in marks eleven of Pad Thai's fifteen lines
   * as owned and drops the basket to 42p, which is a number nobody believes.
   * The recipe's own assumption is the honest starting point; anything else
   * you own is one tap away and stays tapped.
   */
  const isOwned = useCallback(
    (r: Recipe, name: string) => {
      const k = keyOf(name);
      return k in S.owned ? S.owned[k] : r.have.indexOf(k) >= 0;
    },
    [S.owned],
  );

  const toggleOwned = useCallback(
    (r: Recipe, name: string) => {
      const k = keyOf(name);
      setState({ owned: { ...ref.current.owned, [k]: !isOwned(r, name) } });
    },
    [isOwned, setState],
  );

  /**
   * The dip is not part of what the wings cost. A line the recipe marks
   * optional stays off the shopping list until you ask for it, and asking is
   * one tap — the same two-state override the cupboard uses, kept in its own
   * map on purpose. Folding it into `owned` would have the list tell you that
   * soured cream is already in your kitchen because you did not want it.
   */
  const wantsExtra = useCallback((name: string) => !!S.extras[keyOf(name)], [S.extras]);

  const toggleExtra = useCallback(
    (name: string) => {
      const k = keyOf(name);
      setState({ extras: { ...ref.current.extras, [k]: !ref.current.extras[k] } });
    },
    [setState],
  );

  /** On your list: the recipe needs it, your cupboard has not already covered
   *  it, and if it is only an extra you have actually asked for it. */
  const onList = useCallback(
    (r: Recipe, i: Item) => !isOwned(r, i.n) && (!i.opt || wantsExtra(i.n)),
    [isOwned, wantsExtra],
  );

  const toBuy = useCallback(
    (r: Recipe, m: number = mult) =>
      r.items.filter((i) => onList(r, i)).reduce((a, i) => a + i.s * m, 0),
    [mult, onList],
  );
  const allIn = (r: Recipe) =>
    r.items.filter((i) => !i.opt || wantsExtra(i.n)).reduce((a, i) => a + i.s * mult, 0);
  void allIn;

  /** The cheapest and dearest this basket comes to across the shops the Shop
   *  screen is showing — and the names of those two shops, because a range
   *  with nothing attached to its ends is the wrong kind of number.
   *
   *  Endpoints come from the live `stores` array and never from the tier
   *  constants. 0.74 and 1.28 exist only in pantry-live's TIERS, matched by
   *  regex against OpenStreetMap names; no country in STORES_BY_COUNTRY ships
   *  either end. Great Britain offline is 0.82/1.0/1.15, Turkey is
   *  0.78/0.84/1.0 — nothing above baseline at all. Sweeping a fixed
   *  0.74–1.28 would quote a Costco-to-Waitrose spread to somebody in Istanbul
   *  whose screen shows three shops inside a narrower band, which is the same
   *  fault as the heading that claimed walking distance for shops nobody
   *  looked up.
   *
   *  Wholesale is excluded unless it is the shop you picked. 0.74 is Costco,
   *  Makro, Booker — a membership, a trade card and a two-kilo pack. A low end
   *  most readers cannot actually pay is not a price range, it is a boast, and
   *  bulk packs break the premise `totalMeans` states out loud: what this
   *  meal's SHARE of each ingredient costs. The exception earns its keep —
   *  Pakistan's first card is Metro Cash & Carry and it is the default
   *  selection, so there the clamp keeps it in.
   *
   *  `here` is concatenated so the span always contains the selected-store
   *  figure. That figure is the one `verdict`, `keep`, `ranked()` and the cook
   *  log all use, and a printed range that does not contain the number the
   *  rest of the screen reasons about is a contradiction the reader can see.
   *
   *  Both ends come back as the GBP baseline the cookbook is written in, so
   *  each goes through fmt() exactly once on the way out. */
  const spanOf = useCallback(
    (r: Recipe) => {
      const usable = stores.filter((s) => s.tier !== 'wholesale' || s.id === S.store);
      const pool = usable.length ? usable : stores;
      const here = toBuy(r, mult);
      const costs = pool.map((s) => toBuy(r, s.mult)).concat(here);
      const lo = Math.min.apply(null, costs);
      const hi = Math.max.apply(null, costs);
      const at = (v: number) => pool.find((s) => Math.abs(toBuy(r, s.mult) - v) < 1e-9);
      return { lo, hi, loShop: at(lo)?.name || '', hiShop: at(hi)?.name || '' };
    },
    [stores, S.store, mult, toBuy],
  );

  /* ── How much cooking you have done ───────────────────────────────────── */
  /** One number, 1..4, and the only thing about you that ranking reads.
   *
   *  Clamped here as well as in SHAPE, because SHAPE gates localStorage and
   *  imported files and a signed-in hydrate goes nowhere near it. Everything
   *  downstream indexes P.levels with this on every render of every screen, and
   *  that indexing happens inside App's own render — so an out-of-range number
   *  would not break a Settings row, it would take the app down past the error
   *  boundary. The 2 is the same default the empty tier list used to give.
   *
   *  There is no timeLevel() any more. It read a second tier list that never
   *  wrote S.maxTime, so it governed nothing: fitsTime() has always read
   *  S.maxTime, which only the Home screen's time chips set. All it did was
   *  print a sentence that could disagree with them. */
  const skillLevel = () => clampLevel(S.level ?? 2);

  /* ── Ranking ──────────────────────────────────────────────────────────── */
  /** The time budget, taken literally. Everything that reads it treats it as a
   *  line rather than a nudge — the soft penalty this replaced let a name match
   *  buy its way past a 30-minute promise with a 55-minute dish. */
  const fitsTime = (r: Recipe) => r.total <= S.maxTime;

  const ranked = useCallback((): Recipe[] => {
    const q = S.query.toLowerCase().trim();
    const lvl = skillLevel();
    const scored = RECIPES.map((r) => {
      let s = 0;
      // Asked for by name. The one thing allowed to pull a dish past the time
      // budget, because refusing to show you the dish you typed would be worse
      // than showing it and saying how long it really takes.
      let named = false;
      if (q) {
        const hay = (r.name + ' ' + r.cuisine + ' ' + (r.copycat || '') + ' ' + r.local).toLowerCase();
        if (hay.indexOf(q) >= 0) {
          s -= 100;
          named = true;
        }
        q.split(/\s+/).forEach((w) => {
          if (w.length > 2 && hay.indexOf(w) >= 0) s -= 30;
        });
        // Ingredients count, but they never set `named`. "Chickpeas" is a
        // question about what is in the cupboard, not a request for one
        // particular dish, so it should sort a chickpea recipe up without
        // earning the exemption that lets a dish you asked for by name ignore
        // the time you said you had. Worth having only now the cookbook is
        // large enough that you cannot see everything with chickpeas in it.
        const pantryHay = r.items.map((i) => i.n).join(' ').toLowerCase();
        q.split(/\s+/).forEach((w) => {
          if (w.length > 3 && pantryHay.indexOf(w) >= 0) s -= 18;
        });
        if (r.copycat && COPYCAT_HINTS.some((h) => q.indexOf(h) >= 0)) {
          s -= 140;
          named = true;
        }
      }
      const cost = toBuy(r, 0.82);
      if (cost > S.budget) s += (cost - S.budget) * 22;
      else s -= 6;
      // A diet is a harder line than a clock, so it is tracked as a flag and
      // not only as a score: nothing that breaks one may outrank something that
      // keeps it, however quick it is. All nine are checked here — four of them
      // used to be, and ticking "Nut free" still returned Pad Thai.
      let breaksDiet = false;
      S.diets.forEach((d) => {
        if (!meetsDiet(r, d)) {
          s += 200;
          breaksDiet = true;
        }
      });
      const pr = S.profile;
      const head = pr.push === 'yes' ? 1 : 0;
      s += Math.max(0, r.diff - lvl - head) * 14;
      if (pr.training === 'strength') s -= Math.min(40, r.per.protein);
      if (pr.training === 'endurance') s -= Math.min(30, r.per.carb * 0.35);
      if (pr.calorieGoal === 'cut') s += Math.max(0, r.per.kcal - 550) * 0.08;
      if (pr.calorieGoal === 'recomp') s -= (r.per.protein / r.per.kcal) * 400;
      if (pr.cuisine && r.cuisine === pr.cuisine) s -= 25;
      if (pr.goal === 'lose') s += Math.max(0, r.per.kcal - 520) * 0.09;
      if (pr.goal === 'gain') s -= Math.min(45, r.per.kcal / 16);
      if (pr.goal === 'muscle') s -= Math.min(45, r.per.protein * 1.1);
      if (pr.goal === 'recomp') s -= (r.per.protein / r.per.kcal) * 420;
      if (pr.goal === 'cheap') s += (toBuy(r, 0.82) / r.servings) * 12;
      if (pr.goal === 'energy') s -= Math.min(28, r.per.carb * 0.3);
      return { r, s, named, breaksDiet };
    });
    // Two promises, hardest first. A diet you have set is absolute — nothing
    // that breaks it can outrank something that keeps it. Within that, the time
    // budget is a promise too, not a preference: only a dish you named by hand
    // gets past it, and every screen that shows one says so. Partitioning
    // rather than filtering keeps the list fourteen long, so nothing that reads
    // it can be handed an empty pool.
    const rank = (x: { r: Recipe; named: boolean; breaksDiet: boolean }) =>
      (x.breaksDiet ? 2 : 0) + (x.named || fitsTime(x.r) ? 0 : 1);
    scored.sort((a, b) => rank(a) - rank(b) || a.s - b.s);
    return scored.map((x) => x.r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.query, S.budget, S.maxTime, S.diets, S.profile, S.level, toBuy]);

  /* ── Real location, real shops ────────────────────────────────────────── */
  const live = () => import('../data/pantry-live');

  const useMyLocation = useCallback(async () => {
    setState({ liveStatus: 'locating', liveErr: null, locating: true });
    try {
      const L = await live();
      const pos = await L.locate();
      const placeFound = await L.reverseGeocode(pos.lat, pos.lon);
      const known = COUNTRIES[placeFound.countryCode] ? placeFound.countryCode : ref.current.country || 'GB';
      setState({
        liveCoords: pos,
        liveCity: placeFound.city,
        liveArea: placeFound.area,
        country: known,
        liveStatus: 'placed',
        located: true,
        locating: false,
      });
      const shops = await L.nearbyShops(pos.lat, pos.lon);
      setState({ liveShops: shops, liveStatus: shops.length ? 'live' : 'noshops' });
      if (shops.length) setState({ store: 'live0' });
    } catch (e) {
      setState({
        liveStatus: 'error',
        liveErr: e instanceof Error ? e.message : String(e),
        locating: false,
        located: true,
      });
    }
  }, [setState]);

  /* ── What a pound is worth today ──────────────────────────────────────────
     The bundled rates are the floor: the app boots on them and never waits for
     a network to show a price. Once a day, and only on landing on Tonight —
     never between the shop list and the till — we ask the ECB's daily set what
     is true and merge in the currencies it actually covers.

     Every part of this is allowed to fail. No spinner, no error, no "loading"
     anywhere in the bag: blocked, refused, slow or impossible and every number
     on screen is the one the app shipped with, which is exactly what it shows
     today. An answer that lands after you have left Tonight is written to the
     cache and applied on the next visit instead, so a rate never moves a
     basket you are standing in front of. */
  const fxAsked = useRef(false);

  useEffect(() => {
    if (S.screen !== 'home' || fxAsked.current) return;
    const have = ref.current.fx;
    if (have && Date.now() - have.at < FX_TTL) return;
    fxAsked.current = true;
    let onTonight = true;
    (async () => {
      try {
        const L = await live();
        const fresh = await L.fxRates();
        if (!fresh) return;
        const next = { ...fresh, at: Date.now() };
        saveFx(next);
        if (onTonight) setState({ fx: next });
      } catch {
        /* the rates it shipped with were always the answer if this fails */
      }
    })();
    return () => {
      onTonight = false;
    };
  }, [S.screen, setState]);

  /* ── The log, and the questions it earns the right to ask ─────────────── */
  /** Put tonight in the log and say which row it went in as, so the waste
   *  answer a minute later can annotate the same row instead of being the
   *  thing that creates it. */
  const logCook = (r: Recipe, waste: Waste | null): string => {
    const row: LocalCook = {
      clientId:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.round(Date.now() % 9973),
      ago: 0,
      id: r.id,
      name: r.name,
      code: r.code,
      cuisine: r.cuisine,
      spend: toBuy(r),
      servings: r.servings,
      kcal: r.per.kcal,
      protein: r.per.protein,
      carb: r.per.carb,
      diff: r.diff,
      waste: waste === 'lots' ? 0.5 : waste === 'some' ? 0.2 : 0,
      at: Date.now(),
    };
    // The sample weeks step aside the moment there is a real one.
    const kept = S.history.filter((c) => !c.seeded);
    setState({ history: [row].concat(kept) });
    if (auth.userId) pushCooks(auth.userId, [row]);
    return row.clientId!;
  };

  /** Every question is skippable, and every answer is a fact the user can
   *  delete again on the Stats screen. Nothing is inferred and acted on quietly. */
  const openQuestions = () => {
    const h = S.history;
    const n = h.length;
    if (n < 6) return [];
    const QP = P.q || {};
    const sub = (s: string, vals?: Record<string, string | number>) => {
      Object.keys(vals || {}).forEach((k) => {
        s = String(s).split('{' + k + '}').join(String(vals![k]));
      });
      return s;
    };
    const QQ = (id: string, field: string, vals?: Record<string, string | number>) =>
      sub(((QP[id] || {}) as Record<string, string>)[field] || '', vals);
    const QO = (id: string, ix: number, vals?: Record<string, string | number>) =>
      sub((QP[id]?.o || [])[ix] || '', vals);
    const share = (fn: (x: HistoryRow) => boolean) => h.filter(fn).length;
    const out: { id: string; q: string; why: string; opts: { v: string; l: string }[] }[] = [];

    const hp = share((x) => x.protein >= 38);
    if (!S.profile.training && !S.dismissed.training && hp / n >= 0.4)
      out.push({
        id: 'training',
        q: QQ('training', 'q', { k: hp, n }),
        why: QQ('training', 'why'),
        opts: [
          { v: 'strength', l: QO('training', 0) },
          { v: 'endurance', l: QO('training', 1) },
          { v: 'none', l: QO('training', 2) },
        ],
      });

    const lc = share((x) => x.kcal <= 500);
    if (!S.profile.calorieGoal && !S.dismissed.calorieGoal && lc / n >= 0.4)
      out.push({
        id: 'calorieGoal',
        q: QQ('calorieGoal', 'q', { k: lc, n }),
        why: QQ('calorieGoal', 'why'),
        opts: [
          { v: 'cut', l: QO('calorieGoal', 0) },
          { v: 'recomp', l: QO('calorieGoal', 1) },
          { v: 'none', l: QO('calorieGoal', 2) },
        ],
      });

    const counts: Record<string, number> = {};
    h.forEach((x) => {
      counts[x.cuisine] = (counts[x.cuisine] || 0) + 1;
    });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!S.profile.cuisine && !S.dismissed.cuisine && counts[top] / n >= 0.25)
      out.push({
        id: 'cuisine',
        q: QQ('cuisine', 'q', { k: counts[top], n, c: cuisineWord(top) }),
        why: QQ('cuisine', 'why'),
        opts: [
          { v: top, l: QO('cuisine', 0, { c: cuisineWord(top) }) },
          { v: 'none', l: QO('cuisine', 1) },
        ],
      });

    const ceiling = Math.max.apply(null, h.slice(0, 10).map((x) => x.diff));
    if (!S.profile.push && !S.dismissed.push && ceiling <= 2 && n >= 8)
      out.push({
        id: 'push',
        q: QQ('push', 'q'),
        why: QQ('push', 'why'),
        opts: [
          { v: 'yes', l: QO('push', 0) },
          { v: 'no', l: QO('push', 1) },
        ],
      });

    const avg = h.slice(0, 8).reduce((a, x) => a + x.spend / x.servings, 0) / Math.min(8, n);
    if (!S.profile.budget && !S.dismissed.budget && avg > S.budget * 0.62)
      out.push({
        id: 'budget',
        q: QQ('budget', 'q', { a: fmt(avg), b: fmt(S.budget) }),
        why: QQ('budget', 'why'),
        opts: [
          { v: 'up', l: QO('budget', 0) },
          { v: 'no', l: QO('budget', 1) },
        ],
      });
    return out;
  };

  const answer = (id: string, v: string) => {
    if (v === 'none' || v === 'no') {
      setState({ dismissed: { ...S.dismissed, [id]: true } });
      return;
    }
    const extra: Partial<PantryState> = {};
    if (id === 'budget' && v === 'up') extra.budget = Math.round(S.budget * 1.5);
    setState({ profile: { ...S.profile, [id]: v }, ...extra });
    ping(LEARNED_PING[id] || 'Noted.');
  };

  const learned = () =>
    Object.keys(S.profile)
      .map((k) => ({ k, v: S.profile[k] }))
      .filter((x) => LEARNED_TEXT[x.k + ':' + x.v] || LEARNED_TEXT[x.k]);

  /* ── Community prices ───────────────────────────────────────────────────
     A stable key per ingredient so two people reporting "Chicken breast" in
     different languages land on the same row. Matching runs on the canonical
     English name, exactly as cupboard matching does. */
  const refOf = (name: string) =>
    name
      .split(',')[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  /** Grams implied by a shopping-list quantity, when it says so plainly. */
  const gramsOf = (qty: string): number | null => {
    const m = /^([\d.]+)\s*(g|kg|ml|l)\b/i.exec(qty.trim());
    if (!m) return null;
    const n = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    return unit === 'kg' || unit === 'l' ? n * 1000 : n;
  };

  useEffect(() => {
    if (!cloudEnabled || S.screen !== 'shop') return;
    const r = RECIPES.find((x) => x.id === ref.current.pickId) || RECIPES[0];
    const refs = r.items.map((i) => refOf(i.n));
    let live = true;
    setState({ medianBusy: true });
    priceMedians(refs, ref.current.country || 'GB')
      .then((m) => {
        if (live) setState({ medians: m, medianBusy: false });
      })
      // A bare .then was an unhandled rejection waiting to happen, and the
      // flag it leaves behind would say "checking" forever.
      .catch(() => {
        if (live) setState({ medianBusy: false });
      });
    return () => {
      live = false;
      setState({ medianBusy: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.screen, S.pickId, S.country, setState]);

  /* Open Prices, on the same trigger as the community medians but with no
     `cloudEnabled` guard: it is a public read under an open licence, so a
     signed-out user with no Supabase project still gets real shelf prices.
     Every failure path leaves `openPrices` alone and the basket falls back to
     the modelled figure, which is what it did before this existed. */
  useEffect(() => {
    if (S.screen !== 'shop') return;
    const r = RECIPES.find((x) => x.id === ref.current.pickId) || RECIPES[0];
    const cc = ref.current.country || 'GB';
    const want = COUNTRIES[cc]?.iso;
    let alive = true;

    setState({ openBusy: true });

    (async () => {
      try {
        const L = await live();
        const found = await L.priceBasket(
          r.items.map((i) => i.n),
          cc,
        );
        if (!alive) return;
        const out: PantryState['openPrices'] = {};
        for (const [name, p] of Object.entries(found)) {
          // Only a price paid in this country's own currency can be shown in
          // it. Open Prices answers in whatever the shopper paid, and there is
          // no honest way to turn a euro shelf price into a rupee one here.
          if (!p || !want || p.currency !== want || !(p.value > 0)) continue;
          out[refOf(name)] = { perKg: p.value, n: p.n, newest: String(p.newest || '').slice(0, 10) };
        }
        if (Object.keys(out).length) setState({ openPrices: out });
      } catch {
        /* offline, blocked, or nobody has logged one — the model still works */
      } finally {
        if (alive) setState({ openBusy: false });
      }
    })();

    return () => {
      alive = false;
      setState({ openBusy: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.screen, S.pickId, S.country, setState]);

  /* ── Derived view values ──────────────────────────────────────────────── */
  const screen = S.screen;
  const cityNow = S.liveCity || c.city;

  /** What the app would cook you tonight if you said nothing at all.
   *
   *  The top of the ranked list, walked down one place each time you ask for
   *  something else. Computed here rather than on navigation because the Home
   *  screen now opens on it: there is no "submit" any more, so the answer has
   *  to exist before anybody presses anything. Wraps, so it cannot dead-end. */
  const pool = ranked();
  const offer: Recipe = pool.length ? pool[S.reroll % pool.length] : recipe;

  /* Computed once each rather than at every key that needs them: spanOf walks
     the store list and calls toBuy per shop, and the two of them were being
     recomputed six times inside one object literal. */
  const rSpan = spanOf(recipe);
  const oSpan = spanOf(offer);
  /** Whether the two ends print differently — which decides both whether the
   *  attribution line appears and how big the number is set. A range is twice
   *  the characters, and 44px Caprasimo has room for one price, not two. */
  const rIsSpan = fmt(rSpan.lo) !== fmt(rSpan.hi);
  const oIsSpan = fmt(oSpan.lo) !== fmt(oSpan.hi);

  const buy = toBuy(recipe);
  const whole = allIn(recipe);
  const saved = whole - buy;
  const per = buy / recipe.servings;
  const under = S.budget - buy;
  /** A portion of this against a portion of the takeaway — `restaurant` is a
   *  per-serving price everywhere else in here, which is why savedVsTakeaway
   *  multiplies it by servings. Quantised to the figure the screen prints, so
   *  "four times a month" multiplies what you were actually shown. */
  const keep = asShown(recipe.restaurant - per);
  const lvl = skillLevel();
  /** The dish on screen runs past the time budget. It gets here by being named,
   *  or by being tapped in Browse or the planner — so the screen drops the
   *  "under {m} min" chip it has not earned and states the real number. */
  const overTime = recipe.total > S.maxTime;

  /** What one line costs, in the pounds-and-pence base the cookbook is written
   *  in, taking the best source available for it:
   *
   *    1. a community report — what someone paid in a shop you can walk to
   *    2. Open Prices      — real money, from anyone in this country
   *    3. the model        — arithmetic over a baseline, not a receipt
   *
   *  Both measured sources are held in the currency they were paid in, so they
   *  come back through localToBase before fmt multiplies them out again.
   *  The basket total and every line read this one function, so the sum can
   *  never disagree with the numbers printed above it. */
  const lineCost = (i: { n: string; g: string; s: number }) => {
    const k = refOf(i.n);
    const g = gramsOf(i.g);
    const seen = S.medians[k];
    const open = S.openPrices[k];
    if (g && seen) return localToBase((seen.median_per_kg * g) / 1000);
    if (g && open) return localToBase((open.perKg * g) / 1000);
    return i.s * mult;
  };

  // What the basket costs once real prices replace the model.
  const buyReal = recipe.items
    .filter((i) => onList(recipe, i))
    .reduce((a, i) => a + lineCost(i), 0);

  /** What one technique is called, in your language. */
  const actWord = (id: string) => P.skill[id] || id;

  const skillWords = P.levels;
  /** P.levels are lowercase sentence fragments — they were written to finish
   *  "Reads like: {w}." Everywhere one is shown as a label it gets capitalised,
   *  and this is a harmless no-op in Urdu and Arabic. */
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const R = P.r;
  const SH = P.s;
  const X = P.x;
  const SL = P.sl;
  const U = P.u;
  const V = P.v;
  const HH = P.h;
  const PC = P.pc;
  const AM = P.am;

  const fill = (s: string, vals?: Record<string, string | number>) => {
    Object.keys(vals || {}).forEach((k) => {
      s = String(s).split('{' + k + '}').join(String(vals![k]));
    });
    return s;
  };
  const hs = (k: string, fb: string, vals?: Record<string, string | number>) => fill(HH[k] || fb, vals);

  /** Two prices as one string, each converted exactly once.
   *
   *  fmt() takes pounds. Handing it a figure that has already been through
   *  fmt's arithmetic multiplies it a second time — invisible in Britain,
   *  where idx and fx are both 1, and 925x out in Lagos. So the ENDS are
   *  divided and compared in the baseline and only formatted at the last step;
   *  never format one end and do arithmetic on the other.
   *
   *  It collapses to a single figure when the two ends print alike. Whole-unit
   *  currencies round hard — fmt takes the Math.round branch wherever a pound
   *  buys forty of something — and a per-serving span in naira would otherwise
   *  print "₦480 – ₦480", which reads as a bug rather than as a narrow range.
   *  Turkey's three multipliers are 0.78/0.84/1.0 and will collapse often.
   *
   *  U+2066 and U+2069 are a left-to-right isolate around the whole thing, and
   *  they are load-bearing rather than decorative. "£3.00 – £4.50" contains no
   *  strongly-directional character at all: the symbol is ET, the digits are
   *  EN, the dash and the spaces are neutral. Inside an Arabic or Urdu
   *  paragraph the bidi algorithm resolves the dash between two European
   *  numbers to the paragraph's own direction, and the two ends swap — the
   *  screen says four-fifty to three pounds. The isolate pins the run LTR
   *  wherever it lands. It is needed because these strings render inside
   *  <div>s as well as <span>s, and styles.css only sets unicode-bidi:plaintext
   *  on the latter. */
  const fmtSpan = (loGbp: number, hiGbp: number) => {
    const a = fmt(Math.min(loGbp, hiGbp));
    const b = fmt(Math.max(loGbp, hiGbp));
    /* The collapsed case keeps the ≈ the Shop cards carry, and the spanned
       case does not. A range is self-evidently not a precise claim and says so
       by its shape; a lone figure is not, and that is the whole reason the
       Shop screen grew a ≈ in the first place. Turkey's 0.78/0.84/1.0 and any
       whole-unit currency will land here often. */
    return a === b ? '≈' + a : '⁦' + fill(xt(lg, 'priceRange'), { a, b }) + '⁩';
  };
  const vs = (k: string, fb: string, vals?: Record<string, string | number>) => fill(V[k] || fb, vals);
  const countryName = P.cn[cc] || c.name;
  /** "over your 30" — what a time past the budget is called, wherever it shows. */
  const overBy = fill(xt(lg, 'timeOver'), { m: S.maxTime });

  /** What the shop lookup has to say for itself. "Looking" is only true while a
   *  call is genuinely in flight: once Overpass has answered this is the count,
   *  and before anything has been asked it is not this line's turn to speak. */
  const shopsLine = S.liveShops
    ? hs('liveShops', '{n} shops within walking distance, straight off OpenStreetMap', {
        n: S.liveShops.length,
      })
    : vs('looking', 'Looking for shops near you…');

  const wasteMap = {
    none: { head: word('clearedIt', 'Nothing left.'), body: V.wasteNone, pct: 0 },
    some: { head: word('someLeft', 'About a fifth left.'), body: V.wasteSome, pct: 20 },
    lots: { head: word('lotsLeft', 'Around half left.'), body: V.wasteLots, pct: 45 },
  };
  const w = S.waste ? wasteMap[S.waste] : null;

  const dietOn = (id: string) => S.diets.indexOf(id) >= 0;
  const dietWords = i18n.diets(lg);

  const weekly = [7, 6, 5, 4, 3, 2, 1, 0].map((wk) =>
    S.history
      .filter((x) => ageOf(x) >= wk * 7 && ageOf(x) < (wk + 1) * 7)
      .reduce((a, x) => a + x.spend, 0),
  );
  const maxWeek = Math.max.apply(null, weekly);
  const thisWeek = weekly[weekly.length - 1];
  const lastWeek = weekly[weekly.length - 2];

  /** What the log says you did not hand to a takeaway: each cook's restaurant
   *  price less what it actually cost you, floored at zero so a dear night
   *  counts as nothing saved rather than as a loss. Stats prints it in a tile
   *  and the passport prints it under the flags, so it is worked out once, here
   *  — two screens reading one number cannot quote you two. A dish with no
   *  restaurant price is counted at a nine pound plate, and the whole thing
   *  follows the log the moment real cooks push the sample weeks out. */
  /** Read off the log every render, never stored — see streakFrom. */
  const streakDays = streakFrom(S.history);

  /** The row this evening's cook of this dish went in as. The transient id
   *  when the session survived; otherwise the most recent real row for the
   *  same recipe within six hours — a reload on the After screen loses
   *  transient state, and losing it must neither discard the waste answer nor
   *  log the same dinner twice on the way back through the last step. */
  const currentCookId = (): string | null => {
    if (S.cookLogId) return S.cookLogId;
    const row = S.history.find(
      (c) => !c.seeded && c.id === recipe.id && Date.now() - c.at < 6 * 36e5,
    );
    return row?.clientId ?? null;
  };

  /* The passport used to be a static array forever — cook from Mexico and it
     never noticed. Real cooks drive it now: one row per country, counted, with
     the cheapest per-serving dish carrying the flag. The shipped rows only
     stand in until the first real cook, and the banner says so for exactly as
     long as that is true. */
  const realCooks = S.history.filter((c) => !c.seeded);
  const passportRows = realCooks.length
    ? Object.values(
        realCooks.reduce<Record<string, { code: string; times: number; best: LocalCook }>>(
          (m, c) => {
            const g = m[c.code] || (m[c.code] = { code: c.code, times: 0, best: c });
            g.times += 1;
            if (c.spend / c.servings < g.best.spend / g.best.servings) g.best = c;
            return m;
          },
          {},
        ),
      ).map((g) => ({
        code: g.code,
        dish: g.best.name,
        country: COUNTRY_NAMES[g.code] || g.code,
        times: g.times,
        price: g.best.spend / g.best.servings,
      }))
    : PASSPORT;

  const savedVsTakeaway = S.history.reduce(
    (a, x) => a + Math.max(0, (RECIPES.find((y) => y.id === x.id)?.restaurant || 9) * x.servings - x.spend),
    0,
  );

  const dishMap: Record<string, { id: string; name: string; cuisine: string; n: number; spend: number; pic?: string }> =
    {};
  S.history.forEach((x) => {
    const d =
      dishMap[x.id] ||
      (dishMap[x.id] = {
        id: x.id,
        name: x.name,
        cuisine: x.cuisine,
        n: 0,
        spend: 0,
        pic: RECIPES.find((y) => y.id === x.id)?.pic,
      });
    d.n += 1;
    d.spend += x.spend;
  });
  const byDish = Object.values(dishMap)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  const browseSet = (() => {
    const list = RECIPES;
    switch (S.browseCat) {
      case 'quick':
        return list.filter((x) => x.total <= 30);
      case 'cheap':
        return list.slice().sort((a, b) => toBuy(a, 0.82) / a.servings - toBuy(b, 0.82) / b.servings);
      case 'protein':
        return list.slice().sort((a, b) => b.per.protein - a.per.protein);
      case 'veg':
        return list.filter((x) => x.tags.indexOf('vegetarian') >= 0 || x.tags.indexOf('vegan') >= 0);
      case 'easy':
        return list.slice().sort((a, b) => a.diff - b.diff);
      default:
        return list;
    }
  })();

  /* Four, not five. Stats came out because it is a readout you land on rather
     than a place you launch from — it lives in You now, under its own title,
     "What I know". Passport stayed: it is the only collection in the app, and
     its only other way in is the streak flame on Tonight, which disappears by
     definition on the day a lapsing cook most needs something to come back to.
     Browse stayed out too. It is a corridor rather than a hub — every card in
     it opens the same results screen the answer does — and this app was just
     rebuilt around not asking a depleted reader to generate a desire. */
  const navItems = [
    { id: 'home' as const, t: 'navTonight', label: 'Tonight', d: 'M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8' },
    {
      id: 'kitchen' as const,
      t: 'navKitchen',
      label: 'Kitchen',
      d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 10h18M7 6.5v1M7 14v2',
    },
    {
      id: 'passport' as const,
      t: 'navPassport',
      label: 'Passport',
      d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
    },
    { id: 'settings' as const, t: 'navYou', label: 'You', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0' },
  ];

  return {
    state: S,
    setState,
    dir,
    lang: lg,
    notif: S.notif,
    /* For the error boundary's reset key, and nothing else so far: a screen
       change has to be able to clear a screen that threw. */
    screen,
    pickId: S.pickId,

    isWelcome: screen === 'welcome',
    isGoal: screen === 'goal',
    isTier: screen === 'tier',
    isDiet: screen === 'diet',
    isLocate: screen === 'locate',
    isHome: screen === 'home',
    isBrowse: screen === 'browse',
    isResults: screen === 'results',
    isShop: screen === 'shop',
    isCook: screen === 'cook',
    isAfter: screen === 'after',
    isKitchen: screen === 'kitchen',
    isStats: screen === 'stats',
    isPassport: screen === 'passport',
    isSettings: screen === 'settings',

    /* ── The small print ─────────────────────────────────────────────────
       One component renders both documents; which one is a function of the
       screen, not a prop, so Legal.tsx stays as empty-headed as the rest. */
    isLegal: LEGAL.indexOf(screen) >= 0,
    legalTitle: xt(lg, screen === 'terms' ? 'termTitle' : 'privTitle'),
    legalUpdated: xt(lg, 'legalUpdated'),
    legalIntro: xt(lg, screen === 'terms' ? 'termIntro' : 'privIntro'),
    legalContact: LEGAL_CONTACT,
    legalSections: (screen === 'terms' ? TERM_SECTIONS : PRIV_SECTIONS).map((k) => ({
      key: k,
      heading: xt(lg, k + 'H'),
      // Paragraphs are newlines inside one key rather than one key each: the
      // translator sees the whole thought, and the test still counts one key.
      body: xt(lg, k + 'B').split('\n').filter(Boolean),
    })),
    /* Stats is where the app tells you what it has worked out about you, and
       where you delete any of it. That is a disclosure, which reads better as
       a row in You than as a permanent tab — its own title in all six
       languages is already "What I know". */
    statsRow: {
      name: T.statsTitle,
      sub: xt(lg, 'statsRowSub'),
      go: () => go('stats'),
    },
    legalKicker: xt(lg, 'legalKicker'),
    legalLinks: [
      { key: 'privacy', name: xt(lg, 'privacyRow'), sub: xt(lg, 'privacyRowSub'), go: () => go('privacy') },
      { key: 'terms', name: xt(lg, 'termsRow'), sub: xt(lg, 'termsRowSub'), go: () => go('terms') },
    ],

    showNav:
      ['home', 'kitchen', 'stats', 'passport', 'settings', 'browse', 'plan'].indexOf(screen) >= 0,

    /* Whether the character in the corner is standing there. Read as "not
       false" rather than "is true" so that a profile saved before it existed
       shows it, the same as a fresh install would.

       It stands down on a screen that is already showing the big one. Two of
       the same character on one screen is one too many, and on the Goal screen
       the corner is exactly where the Next button is. */
    mascot:
      S.toggles.mascot !== false &&
      /* Suppressed outright on the three screens where a character is in the
         way rather than company.

         Cook is the important one. You are looking up from a hot pan trying to
         find your place again, the screen shows one step because that is the
         whole point of it, and something bobbing in the corner is exactly the
         movement-that-means-nothing this app wrote its own rules to prevent.

         Shop is a column of money. A cartoon standing next to the numbers
         competes with the one thing the screen exists to make legible.

         After already shows the big one, and two of the same character on one
         screen is one too many — as does Goal, once you have answered it. */
      ['cook', 'shop', 'after'].indexOf(screen) < 0 &&
      !(screen === 'goal' && !!S.profile.goal),

    /* Which pose. Not decoration for its own sake: the character is the only
       thing on screen that reacts to where you are, and a cook who has just
       finished a dish should be met by something pleased about it rather than
       by the same drawing that was on the shopping list. Four poses, so each
       one still means something — a fifth would be a pose nobody could name. */
    mascotPose: (['welcome', 'goal', 'tier', 'diet', 'locate'].indexOf(screen) >= 0
      ? 'think'
      : screen === 'after' || screen === 'stats' || screen === 'passport'
        ? 'cheer'
        : screen === 'results' || screen === 'cook' || screen === 'shop'
          ? 'wink'
          : 'walk') as Pose,

    /* And the big one, which is the whole point of having a character at all.
       Answer "what are you after?" and it acts the answer out: on the scales
       for losing weight, holding a barbell for building muscle, counting the
       change in a purse for doing it cheaply. Nothing else on the Goal screen
       tells you the app heard you — the chip goes dark, and that is it.

       `recomp` shares the barbell with `muscle` and `gain` shares the loaded
       plate with nothing, because six drawings for seven goals is honest and
       a seventh drawn to fill a gap would look like it. No goal, no picture. */
    goalPose: ({
      lose: 'lose',
      gain: 'gain',
      muscle: 'muscle',
      recomp: 'muscle',
      cheap: 'cheap',
      energy: 'energy',
    }[S.profile.goal] ?? null) as BigPose | null,

    /* ── Onboarding ─────────────────────────────────────────────────────── */
    start: () => go('goal'),
    goalTitle: word('goalTitle', 'What are you after?'),
    goalSub: word(
      'goalSub',
      'Optional, and you can change or delete it later. It changes what I put in front of you, not what I let you cook.',
    ),
    goalNote: word('goalNote', 'Whatever you pick, nothing gets hidden. I reorder the list and tell you why.'),
    goalSkip: word('goalSkip', 'No goal for now'),
    goalChips: GOALS.map((g) => ({
      key: g,
      label: P.goals[g] || g,
      style: (S.profile.goal === g ? PILL_ON : PILL_OFF) + 'font-size:15px;padding:14px 19px;',
      pick: () =>
        setState({ profile: { ...S.profile, ...(g === 'none' ? { goal: '' } : { goal: g }) } }),
    })),
    toTier: () => go('tier'),
    /** "Step 2 of 4" for the dot row, which was a picture with nothing to read. */
    dotsLabel: (at: number) => fill(xt(lg, 'stepOf'), { n: at + 1, of: 4 }),
    resLevelLabel: xt(lg, 'resLevel'),
    skipOnboarding: () => go('home', { seen: true }),

    /* ── How much cooking you have done ─────────────────────────────────── */
    /* One question, four answers, one tap. It used to be two screens of
       drag-and-drop — eight technique cards into four rows, then five time
       cards into four more — thirteen drags on a phone to produce one number
       between 1 and 4 and a sentence that governed nothing.

       The acts lead and the level name follows, deliberately. Asking what
       somebody can DO is the one genuinely good idea the tier list had:
       nobody rates their own cooking accurately, but everybody knows whether
       they have kneaded dough. It also sidesteps a problem the old readout
       had but a button would not survive — P.levels is masculine in Spanish,
       French, Polish and Arabic ("cocinero", "un cuisinier sûr de lui"), and
       promoting it to the thing you press would misgender about half the
       people who press it. A verb phrase has no gender in any of the six. */
    levelSub: xt(lg, 'levelSub'),
    /* Hidden for anyone who already finished setup and arrived from Settings:
       "step 2 of 4" means nothing to somebody who set up last March. */
    levelDots: !S.seen,
    levelOptions: SKILL_LEVELS.map((row, i) => ({
      key: String(row.lvl),
      /* The roving-tabindex group has to be able to move focus, and a screen
         holds no state to do it with. */
      id: 'pg-level-' + row.lvl,
      acts: row.ids.map(actWord),
      name: cap(skillWords[row.lvl] || ''),
      on: S.level === row.lvl,
      /* Exactly one radio is tabbable. With nothing chosen yet it is the
         first, so one Tab reaches the group and the arrows do the rest. */
      tabIndex: (S.level == null ? i === 0 : S.level === row.lvl) ? 0 : -1,
      style: LEVEL_ROW + (S.level === row.lvl ? LEVEL_ON : LEVEL_OFF),
      hover: S.level === row.lvl ? '' : 'background:#f2ece1',
      pick: () => setState({ level: row.lvl as Level }),
      /* In a radio group the arrows move AND choose, which is what makes four
         alternatives reachable without sight or a mouse. Up and Down only:
         Home and End need no mirroring for Arabic and Urdu, and Left and Right
         would. Enter and Space are the button's own and land on `pick`. */
      onKey: (e: ReactKeyboardEvent) => {
        const n = SKILL_LEVELS.length;
        const to =
          e.key === 'ArrowDown' ? (i + 1) % n
          : e.key === 'ArrowUp' ? (i - 1 + n) % n
          : e.key === 'Home' ? 0
          : e.key === 'End' ? n - 1
          : -1;
        if (to < 0) return;
        e.preventDefault();
        const lv = SKILL_LEVELS[to].lvl as Level;
        setState({ level: lv });
        window.requestAnimationFrame(() => document.getElementById('pg-level-' + lv)?.focus());
      },
    })),
    /* Empty until you have answered. Four labelled rows explain themselves, and
       the old "Place a few and I will tell you what I make of it" was about a
       half-filled deck that no longer exists. The element stays mounted either
       way so its live region is there before the text arrives. */
    levelReadout:
      S.level == null
        ? ''
        : vs('readsLike', 'Reads like: {w}. {p}', {
            w: skillWords[S.level] || '',
            p: V['plan' + S.level] || '',
          }),
    levelReadoutStyle:
      S.level == null
        ? 'margin:0;padding:0'
        : 'margin-top:14px;padding:13px 15px;border-radius:20px;background:#e1eecc;' +
          'font-size:13.5px;line-height:1.5;color:#3d472b;text-wrap:pretty',
    levelCta: T.tierNext,
    /* Skip and Next are the same door with two labels, deliberately: the answer
       is optional and skillLevel() defaults to 2 either way. A returning cook
       who came from Settings goes back to Settings rather than being walked
       through Diet and Locate a second time. */
    levelNext: () => go(S.seen ? 'settings' : 'diet'),
    back: () => {
      if (depthOf() > 0) return window.history.back();
      /* No stack. A single-file build opened from file:// has an opaque origin,
         pushState throws, writeHash swallows it and depthOf() stays 0 forever —
         so in the standalone build this ladder IS the router rather than a rare
         fallback, and it has to walk setup backwards a screen at a time.
         Three things were wrong with it before: 'tier' went back to Welcome and
         skipped Goal, 'diet' set a tier step that no longer exists, and there
         was no 'goal' case at all, so Back from the first question dropped an
         unfinished visitor on Home with the nav bar showing and `seen` false. */
      if (screen === 'goal') return go('welcome');
      if (screen === 'tier') return go('goal');
      if (screen === 'diet') return go('tier');
      if (screen === 'locate') return go('diet');
      if (screen === 'shop') return go('results');
      // Arrived by link, so there is no stack. Back goes where the link lives.
      if (LEGAL.indexOf(screen) >= 0) return go('settings');
      return go('home');
    },
    goHome: () => go('home'),
    goKitchen: () => go('kitchen'),
    goPassport: () => go('passport'),
    goBrowse: () => go('browse'),
    goStats: () => go('stats'),

    /* ── Diet ───────────────────────────────────────────────────────────── */
    dietChips: DIETS.map((d) => ({
      key: d.id,
      label: dietWords[d.id] || d.label,
      on: dietOn(d.id),
      style: (dietOn(d.id) ? PILL_ON : PILL_OFF) + 'flex:none;',
      toggle: () =>
        setState({ diets: dietOn(d.id) ? S.diets.filter((x) => x !== d.id) : S.diets.concat([d.id]) }),
    })),
    /* Nut free, no pork and no alcohol are read off the ingredient list rather
       than off a tag, because the cookbook carries no tag for them. That works,
       but it cannot see a factory, so the screen says so rather than letting an
       allergy filter imply a guarantee it has no way to make. */
    dietNote:
      (S.diets.some((d) => DERIVED.indexOf(d) >= 0) ? xt(lg, 'dietDerived') + ' ' : '') +
      (S.diets.length ? vs('dietSome', '') : vs('dietNone', '')),
    /* Straight to the question. This used to stage a 1.9-second radar sweep
       with a setTimeout and then announce "Found you" — no lookup ever ran.
       The radar still exists, for the real one: tap "use my location" and
       useMyLocation drives the same animation while genuinely looking. */
    toLocate: () => go('locate', { locating: false, located: true }),

    /* ── Location ───────────────────────────────────────────────────────── */
    locating: S.locating,
    located: S.located,
    countryCode: cc,
    cityName: c.city,
    countryLine: c.name + ' · ' + c.cur.charAt(0).toUpperCase() + c.cur.slice(1) + ' ' + c.sym,
    currencyName: c.cur,
    countryChips: Object.keys(COUNTRIES).map((k) => ({
      key: k,
      label: COUNTRIES[k].city,
      style: (cc === k ? PILL_ON : PILL_OFF) + 'flex:none;font-size:13.5px;padding:9px 14px;',
      pick: () => setState({ country: k }),
    })),
    finishOnboarding: () => go('home', { seen: true }),
    liveIdle: S.liveStatus === 'idle',
    liveBusy: S.liveStatus === 'locating',
    liveFailed: S.liveStatus === 'error',
    liveOn: S.liveStatus === 'live' || S.liveStatus === 'placed' || S.liveStatus === 'noshops',
    liveErrText: S.liveErr || '',
    liveAreaLine: S.liveArea ? S.liveArea + ', ' + cityNow : cityNow,
    liveShopLine: shopsLine,
    /* Locate draws the four live states as four blocks; Settings has one line,
       so it folds them into one. The idle state is the whole point of this:
       before you have tapped, nothing is looking, and there is a difference
       between a call that is running and one that has never started. A failure
       gives its reason and leaves the button tappable. */
    liveWhereLine:
      S.liveStatus === 'idle'
        ? xt(lg, 'liveLook')
        : S.liveStatus === 'error'
          ? S.liveErr || xt(lg, 'liveLook')
          : shopsLine,
    useLocation: useMyLocation,

    /* ── Home ───────────────────────────────────────────────────────────── */
    /* By the clock, not a hardcoded "Evening" at nine in the morning. */
    greeting: (() => {
      const h = new Date().getHours();
      if (h < 12) return xt(lg, 'morning');
      if (h < 17) return xt(lg, 'afternoon');
      return word('evening', 'Evening');
    })(),
    /* Zero is not shown rather than dressed up: the flame chip only appears
       once there is a real day to count. */
    streak: streakDays + ' ' + (HH.daysWord || 'days'),
    showStreak: streakDays > 0,
    query: S.query,
    onQuery: (e: ChangeEvent<HTMLInputElement>) => setState({ query: e.target.value }),
    cravings: (P.cravings || CRAVINGS).map((label) => ({
      key: label,
      label,
      on: S.query.toLowerCase() === label.toLowerCase(),
      style:
        (S.query.toLowerCase() === label.toLowerCase() ? PILL_ON : PILL_OFF) +
        'font-size:13.5px;padding:10px 15px;',
      pick: () => setState({ query: label }),
    })),
    servingsLabel: hs('forServings', 'for {n} servings', { n: 2 }),
    budgetChips: BUDGETS.map((b) => ({
      key: String(b),
      label: fmt(b),
      on: sameMoney(S.budget, b) && !S.budgetOtherOpen,
      style:
        (sameMoney(S.budget, b) && !S.budgetOtherOpen ? PILL_ON : PILL_OFF) +
        'flex:none;min-width:64px;text-align:center;justify-content:center;',
      pick: () => setState({ budget: b, budgetOtherOpen: false }),
    }))
      // Your own number sits in the row as a sixth chip, lit like any other, so
      // setting it is visibly a choice and not a shot into the dark. It is
      // derived, never stored: tap a preset and it stops existing.
      .concat(
        budgetIsCustom
          ? [
              {
                key: 'custom',
                label: fmt(S.budget),
                on: !S.budgetOtherOpen,
                style:
                  (S.budgetOtherOpen ? PILL_OFF : PILL_ON) +
                  'flex:none;min-width:64px;text-align:center;justify-content:center;',
                pick: () => setState({ budgetOtherOpen: false }),
              },
            ]
          : [],
      )
      .concat([
        {
          key: 'other',
          label: HH.otherChip || 'Other',
          on: S.budgetOtherOpen,
          style: (S.budgetOtherOpen ? PILL_ON : PILL_OFF) + 'flex:none;',
          pick: () => setState({ budgetOtherOpen: !S.budgetOtherOpen, budgetErr: false }),
        },
      ]),
    budgetOtherOpen: S.budgetOtherOpen,
    budgetDraft: S.budgetDraft,
    symbol: c.sym,
    /* Typing is not an error state. Whatever the last Set said, the next
       keystroke clears it — the field states the range once and then shuts up
       rather than turning red while you are halfway through a number. */
    onBudgetDraft: (e: ChangeEvent<HTMLInputElement>) =>
      setState({ budgetDraft: e.target.value, budgetErr: false }),
    budgetErr: S.budgetErr,
    /* Both ends through fmt(), so the range is stated in the money you are
       typing in: pennies in Birmingham, whole naira in Lagos. */
    budgetRangeLine: fill(xt(lg, 'budgetRange'), {
      a: fmt(localToBase(minLocal)),
      b: fmt(MAX_BASE),
    }),
    commitBudget,
    /* Enter is the Set button — the same function, so the two cannot drift.
       Escape abandons what you typed and leaves the budget where it was. */
    onBudgetKey: (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitBudget();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setState({ budgetOtherOpen: false, budgetDraft: '', budgetErr: false });
      }
    },
    timeChips: [
      { m: 15 },
      { m: 30 },
      { m: 45 },
      { m: 60, w: 'anHour', l: 'An hour' },
      { m: 999, w: 'noRush', l: 'No rush' },
    ].map((t) => ({
      key: String(t.m),
      label: t.w ? word(t.w, t.l!) : t.m + ' ' + word('minutes', 'min'),
      on: S.maxTime === t.m,
      style: (S.maxTime === t.m ? PILL_ON : PILL_OFF) + 'flex:none;',
      pick: () => setState({ maxTime: t.m }),
    })),
    searchCta: S.query ? hs('findMe', 'Find me {q}', { q: S.query.toLowerCase() }) : T.homeGo,
    search: () => go('results', { pickId: ranked()[0].id, showMicro: false, reroll: 0 }),

    /* ── Tonight, answered ──────────────────────────────────────────────────
       The screen used to open as a form: what do you fancy, how much, how long,
       then a button. Four decisions on the one screen whose entire job is to
       end decision paralysis — which is the fridge-staring loop rebuilt inside
       the app.

       It opens on an answer now. Everything needed to pick is already known —
       diets, cupboard, goal, budget, the time you last said — so the app
       commits first and the first thing you do is REACT rather than GENERATE.
       That distinction is the whole point: inventing a desire is expensive when
       you are depleted, reacting to an offer is cheap. The craving box, the
       money and the time have not gone anywhere; they moved below the answer,
       behind one tap, for the minority who arrive knowing what they want. */
    tonightDish: dish(offer),
    tonightCuisine: cuisineWord(offer.cuisine),
    tonightPic: offer.pic,
    /* A span rather than a figure, because this dish has not been chosen yet
       and the shop has not been either. Both ends of the baseline are divided
       before either is formatted — dividing a formatted string is how the "×4"
       bug printed £40.70 beside £10.18. */
    tonightTotal: fmtSpan(oSpan.lo, oSpan.hi),
    tonightPer: fmtSpan(oSpan.lo / offer.servings, oSpan.hi / offer.servings),
    tonightPerSub: T.resServing,
    tonightTotalFs: oIsSpan ? '25px' : '38px',
    tonightPerFs: oIsSpan ? '17px' : '24px',
    /* What the two ends ARE. Without this the range is a confidence interval,
       which is a claim the app cannot support: both ends come off the same
       modelled baseline, so a baseline that is 40% wrong slides the range
       rather than widening it. Named shops make it a statement about where you
       shop, which is true. Null when the ends collapsed, so nothing explains a
       range that is not on screen. */
    tonightRangeWhy: oIsSpan ? fill(xt(lg, 'rangeShops'), { a: oSpan.loShop, b: oSpan.hiShop }) : null,
    tonightSub:
      word('toBuyFor', 'to buy, for') + ' ' + offer.servings + ' ' + word('servings', 'servings'),
    tonightMins: offer.total + ' ' + word('minutes', 'min'),
    tonightOpen: () => go('results', { pickId: offer.id, showMicro: false }),
    /* Walks down the ranked list rather than shuffling, so pressing it four
       times shows four different dinners instead of the same one twice. It
       wraps, so it can never dead-end. */
    tonightAgain: () => setState({ reroll: S.reroll + 1 }),
    /* Announced rather than shown: the dish name changes in place, and a screen
       reader would otherwise be told nothing at all. */
    tonightSaid: fill(xt(lg, 'nowShowing'), { d: dish(offer) }),
    refineOpen: S.refineOpen,
    toggleRefine: () => setState({ refineOpen: !S.refineOpen }),
    refineLabel: xt(lg, 'refine'),
    tonightId: xt(lg, 'tonightId'),
    tonightCta: xt(lg, 'cookThis'),
    tonightAgainCta: xt(lg, 'another'),
    decideForMe: () => {
      const pool = ranked();
      // Nothing has been asked for by name here, so the budget is a line: the
      // shuffle only lands on something you have actually got the evening for.
      const fits = pool.filter(fitsTime);
      const from = fits.length ? fits : pool;
      go('results', {
        pickId: from[Math.floor(Math.random() * Math.min(3, from.length))].id,
        query: '',
        showMicro: false,
      });
    },
    /* Non-possessive on purpose: the card used to say "23 things already in
       YOUR kitchen" over a shipped list, with a static beansprouts nudge that
       named produce nobody had bought. The Kitchen screen's banner owns the
       full honesty; this card matches it in one line. */
    pantryLine: fill(xt(lg, 'pantryLineSample'), { n: STAPLES.length + PERISH.length }),
    pantryNudge: xt(lg, 'pantrySubSample'),

    /* ── Results ────────────────────────────────────────────────────────── */
    isCopycat: !!recipe.copycat,
    copycatOf: recipe.copycat || '',
    dishName: dish(recipe),
    dishLocal: P.lo[recipe.id] || recipe.local,
    dishCuisine: cuisineWord(recipe.cuisine),
    dishPic: recipe.pic,
    priceTotal: fmtSpan(rSpan.lo, rSpan.hi),
    priceSub: word('toBuyFor', 'to buy, for') + ' ' + recipe.servings + ' ' + word('servings', 'servings'),
    priceTotalFs: rIsSpan ? '27px' : '44px',
    pricePerFs: rIsSpan ? '17px' : '26px',
    priceRangeWhy: rIsSpan ? fill(xt(lg, 'rangeShops'), { a: rSpan.loShop, b: rSpan.hiShop }) : null,
    /* Two per-serving keys, deliberately.
       `pricePerSpan` is the headline beside priceTotal. `pricePer` stays a
       single figure because it is the right-hand operand of the takeaway
       comparison further down the screen — the struck-through restaurant price
       with an arrow to yours — and `keep` and `savingLine` are computed from
       the same `per`. Range that one and the screen shows a span, then claims
       you keep an exact amount derived from a number never printed. */
    pricePerSpan: fmtSpan(rSpan.lo / recipe.servings, rSpan.hi / recipe.servings),
    pricePer: fmt(per),
    budgetLabel: fmt(S.budget),
    // Over a 55-minute dish this chip used to read "under 30 min". Now it reads
    // "55 min · over your 30", and the note below says why it is here at all.
    timeLabel: overTime
      ? recipe.total + ' ' + word('minutes', 'min') + ' · ' + overBy
      : S.maxTime === 999
        ? R.noRush
        : R.underMins + ' ' + S.maxTime + ' ' + word('minutes', 'min'),
    timeOverNote: overTime
      ? fill(xt(lg, 'timeOverWhy'), { m: S.maxTime, t: recipe.total })
      : null,
    verdict:
      under >= 0
        ? fmt(under) + ' ' + R.underYour + ' ' + fmt(S.budget) + ' ' + R.andIncludes
        : fmt(-under) + ' ' + R.overYour + ' ' + fmt(S.budget) + '. ' + R.switchCheapest,
    verdictBg: under >= 0 ? '#e1eecc' : '#ffe1d0',
    verdictFg: under >= 0 ? '#3d472b' : '#8c491a',
    macros: [
      { key: 'kcal', value: String(Math.round(recipe.per.kcal)), label: word('kcal', 'kcal'), bg: '#fff2eb', fg: '#8c491a' },
      {
        key: 'protein',
        value: Math.round(recipe.per.protein) + 'g',
        label: word('protein', 'protein'),
        bg: '#e1eecc',
        fg: '#3d472b',
      },
      { key: 'carb', value: Math.round(recipe.per.carb) + 'g', label: X.carbs, bg: '#eee7db', fg: '#474238' },
      { key: 'fat', value: Math.round(recipe.per.fat) + 'g', label: X.fat, bg: '#eee7db', fg: '#474238' },
    ],
    microCta: S.showMicro ? X.microHide : X.microShow,
    showMicro: S.showMicro,
    toggleMicro: () => setState({ showMicro: !S.showMicro }),
    micros: recipe.micro.map((m) => ({
      key: m.label,
      label: foodName('micro:' + m.label) === 'micro:' + m.label ? m.label : foodName('micro:' + m.label),
      amount: m.amount,
      color: m.color,
      pct: Math.min(100, m.pct) + '%',
    })),
    takeawayPrice: fmt(recipe.restaurant),
    /* Both sides of this are one portion. It used to put a restaurant order of
       eight next to a whole batch of twelve and then call the difference "a
       portion", which is three different units in one sentence. The copycat
       line is a single templated string rather than six concatenated
       fragments, so word order — and right-to-left — belongs to whoever wrote
       the translation instead of to the order the pieces are glued in. */
    savingLine: recipe.copycat
      ? fill(xt(lg, 'copycatKeep'), {
          who: recipe.copycat,
          a: fmt(recipe.restaurant),
          b: fmt(per),
          c: fmt(keep),
        })
      : X.youKeep +
        ' ' +
        fmt(keep) +
        ' ' +
        X.everyTime +
        ' ' +
        X.fourTimes +
        ' ' +
        fmt(keep * 4) +
        '.',
    timeTotal: recipe.total + ' ' + word('minutes', 'min'),
    timeActive: recipe.active + ' ' + word('activeMins', 'of them are you'),
    diffLabel: diffWord(recipe.diff),
    alternates: ranked()
      .filter((x) => x.id !== recipe.id)
      .slice(0, 2)
      .map((a) => ({
        key: a.id,
        name: dish(a),
        pic: a.pic,
        meta:
          cuisineWord(a.cuisine) +
          ' · ' +
          a.total +
          ' ' +
          word('minutes', 'min') +
          (fitsTime(a) ? '' : ' · ' + overBy) +
          ' · ' +
          Math.round(a.per.protein) +
          'g ' +
          word('protein', 'protein'),
        price: fmtSpan(spanOf(a).lo / a.servings, spanOf(a).hi / a.servings),
        pick: () => go('results', { pickId: a.id, showMicro: false }),
      })),
    toShop: () => go('shop'),

    /* ── Shop ───────────────────────────────────────────────────────────── */
    stores: stores.map((s) => {
      const t = toBuy(recipe, s.mult);
      const base = Math.min.apply(null, stores.map((x) => toBuy(recipe, x.mult)));
      const on = S.store === s.id;
      return {
        key: s.id,
        name: s.name,
        tier: P.shops[s.tier] || s.tier,
        /* An approximately-equals sign, because this row is the most
           convincing lie in the app.
           Everything else on it is real and measured: Overpass gave us a
           genuine Aldi, its genuine distance, its genuine closing time. The
           price is not. It is this basket multiplied by 0.82 because the name
           matched the discount tier — a modelled figure wearing a real shop's
           badge, and the more real the rest of the card looks the more it
           reads as Aldi's own number. No UK, US or EU supermarket publishes a
           price API; the Shop screen says so further down, and said it while
           this line printed an unqualified £5.10.
           One character, chosen because it needs no translation and no
           layout: ≈ means "about" in all six languages and in none of them. */
        price: '≈' + fmt(t),
        /* A shop Overpass found carries its measured distance and hours. A
           fallback card used to invent both — "0.6 km · open till 22:00" for
           a shop nobody looked up — and now says what it actually is: a
           typical price for that kind of shop here. */
        meta: s.real
          ? s.km + ' km · ' + (s.closes || SH.hoursUnknown)
          : xt(lg, 'storeModelled'),
        delta: t <= base + 0.001 ? T.shopCheapest : '+' + fmt(t - base),
        tagBg: on ? '#c67139' : '#eee7db',
        tagFg: on ? '#fff' : '#82796a',
        priceFg: on ? '#8c491a' : '#645c50',
        style:
          'display:flex;gap:12px;align-items:center;padding:15px 17px;border-radius:26px;width:100%;transition:background .15s,box-shadow .15s;background:' +
          (on ? '#fff2eb' : '#f9f4ed') +
          (on ? ';box-shadow:inset 0 0 0 2px #c67139' : ';box-shadow:inset 0 0 0 1px rgba(32,30,29,.07)'),
        pick: () => setState({ store: s.id }),
      };
    }),
    basket: recipe.items.map((i) => {
      const owned = isOwned(recipe, i.n);
      /** An extra you have not asked for: on the list to look at, off the
       *  total, one tap from being either. Not struck through — a line through
       *  a name means you have it, and you do not. */
      const skipped = !owned && !!i.opt && !wantsExtra(i.n);
      const off = owned || skipped;
      const key = refOf(i.n);
      const seen = S.medians[key];
      const open = S.openPrices[key];
      const grams = gramsOf(i.g);
      /* Three sources, best first. A community report is what someone actually
         paid in a shop you can walk to, so it wins. Open Prices is real money
         too but from anyone in the country, so it comes second. The modelled
         figure is last because it is arithmetic, not a receipt.
         Both measured sources are stored in the currency they were paid in and
         have to come back through localToBase, or fmt multiplies them a second
         time on the way out. */
      const measured = grams && (seen || open) ? lineCost(i) : null;
      return {
        key: i.n,
        ref: key,
        name: foodName(i.n),
        community: seen
          ? { reports: seen.reports, newest: seen.newest.slice(0, 10), amount: measured }
          : open
            ? { reports: open.n, newest: open.newest, amount: measured, openData: true }
            : null,
        owned,
        /** Crossed off, whichever of the two reasons it is. */
        pressed: off,
        toggle: () => (i.opt ? toggleExtra(i.n) : toggleOwned(recipe, i.n)),
        openReport: () =>
          setState({
            reportFor: key,
            reportPrice: '',
            reportPack: grams ? String(grams) : '',
          }),
        tick: owned ? '✓' : '',
        boxBg: owned ? '#8fa073' : '#eee7db',
        nameFg: off ? '#82796a' : '#201e1d',
        strike: owned ? 'line-through' : 'none',
        sub: owned
          ? word('already', 'already in your kitchen')
          : i.g +
            (i.opt ? ' · ' + (skipped ? xt(lg, 'extraAdd') : word('optional', 'optional')) : ''),
        srcColor: seen
          ? '#56633f'
          : open
            ? '#8fa073'
            : i.src === 'local'
              ? '#728157'
              : i.src === 'euro'
                ? '#f6a06b'
                : '#c0b6a5',
        price: off ? fmt(0) : measured != null ? fmt(measured) : fmt(i.s * mult),
        priceFg: off ? '#a19786' : '#201e1d',
      };
    }),
    /* "3 shops within walking distance of Birmingham" — true only when
       Overpass actually answered. Without location the list falls back to
       STORES_BY_COUNTRY, three cards nobody looked up, and this line put them
       within walking distance of a city on the strength of nothing.
       The same invention was already caught one line down, where a fallback
       card used to print "0.6 km · open till 22:00"; the meta was fixed and
       the heading above it was not, which is how it kept claiming a locality
       while every card under it admitted to being a type. */
    shopSubLine:
      stores.length +
      ' ' +
      (stores.some((s) => s.real) ? SH.shopSub : xt(lg, 'storeKinds')) +
      ' ' +
      cityNow +
      '. ' +
      SH.sameBasket,
    listSummary: (() => {
      const have = recipe.items.filter((i) => isOwned(recipe, i.n)).length;
      const buying = recipe.items.filter((i) => onList(recipe, i)).length;
      return (
        buying + ' ' + word('toBuy', 'to buy') +
        ' · ' + have + ' ' + word('youHave', 'you have')
      );
    })(),
    basketTotal: fmt(buyReal),
    /** True while a line is struck through because the recipe assumes it, not
     *  because you said so — five of Mango Habanero Wings' eleven. The note
     *  under the list says as much, once, for exactly as long as it is true. */
    assumedOwned: recipe.items.some(
      (i) => !(keyOf(i.n) in S.owned) && recipe.have.indexOf(keyOf(i.n)) >= 0,
    ),
    /* The "{b} you did not spend twice" figure is this saving times nine
       shops — an assumption, so the sentence now names it instead of passing
       the product off as a measurement. */
    savedLine:
      fill(SL.saved, { a: fmt(saved), b: fmt(asShown(saved) * 9) }) +
      ' ' +
      xt(lg, 'savedAssumes'),

    /* ── Reporting a real price ─────────────────────────────────────────── */
    reportOpen: !!S.reportFor,
    reportItemName: (() => {
      const item = recipe.items.find((i) => refOf(i.n) === S.reportFor);
      return item ? foodName(item.n) : '';
    })(),
    reportPriceValue: S.reportPrice,
    reportPackValue: S.reportPack,
    reportBusy: S.reportBusy,
    /* Two lookups, one question. The basket used to reprice itself under your
       finger — line prices and the total both move — with a seven-pixel dot
       changing colour as the only tell. This says it is looking, for exactly as
       long as it is looking, and says nothing at all the rest of the time. */
    pricesBusy: S.openBusy || S.medianBusy,
    canReport: cloudEnabled && !!auth.userId,
    onReportPrice: (e: ChangeEvent<HTMLInputElement>) => setState({ reportPrice: e.target.value }),
    onReportPack: (e: ChangeEvent<HTMLInputElement>) => setState({ reportPack: e.target.value }),
    closeReport: () => setState({ reportFor: null }),
    submitReport: async () => {
      const price = parseFloat(S.reportPrice);
      // Whole grams. A pack is a thing on a shelf, not a measurement.
      const pack = Math.round(parseFloat(S.reportPack));
      // Read through the ref, like savePlan: setState is a request, so a second
      // tap arriving before the next render would see reportBusy still false
      // and send the same price twice.
      if (!auth.userId || !S.reportFor || ref.current.reportBusy) return;
      // The same bounds the table enforces, checked here so that the ordinary
      // mistake — a stray zero, grams typed as kilos — comes back as a
      // sentence rather than as a rejected insert. `> 0` alone let 999999
      // through, which is one row that owns the median for everybody.
      if (!(price > 0 && price <= 10000 && pack >= 1 && pack <= 50000)) {
        ping(xt(lg, 'priceOutOfRange'));
        return;
      }
      setState({ reportBusy: true });
      const store = stores.find((x) => x.id === S.store);
      // Prices are entered in the local currency, and stored in it — the
      // median function never mixes currencies because it groups by country.
      const res = await reportPrice({
        userId: auth.userId,
        ref: S.reportFor,
        price,
        currency: c.cur,
        packGrams: pack,
        storeName: store?.name,
        storeTier: store?.tier,
        country: cc,
      });
      setState({ reportBusy: false, reportFor: null, reportPrice: '', reportPack: '' });
      if (res.ok) {
        ping(xt(lg, 'priceThanks'));
        const fresh = await priceMedians(
          recipe.items.map((i) => refOf(i.n)),
          cc,
        );
        setState({ medians: fresh });
      } else {
        // A refusal that closes the panel in silence reads as success, which
        // is the app telling someone their price went in when it did not.
        // The two the table raises deliberately carry their own SQLSTATE;
        // anything else is a network or a policy problem and says so.
        ping(
          xt(
            lg,
            res.code === '23505'
              ? 'priceAlready'
              : res.code === '54000'
                ? 'priceTooMany'
                : 'priceFailed',
          ),
        );
      }
    },
    honestyLine: fill(c.tier === 'local' ? SL.measured : SL.modelled, { c: countryName }),
    toCook: () => go('cook', { step: 0, timerRun: false, timerLeft: 0, cookLogId: null }),

    /* ── Cook ───────────────────────────────────────────────────────────── */
    stepNo: S.step + 1,
    stepCount: S.step + 1 + ' ' + word('stepOf', 'of') + ' ' + recipe.method.length,
    cookPct: Math.round(((S.step + 1) / recipe.method.length) * 100) + '%',
    stepText: recipe.method[S.step]?.text || '',
    /** A photograph if the recipe carries one for this step, otherwise the
     *  drawing of whatever the step is asking you to do. */
    stepPic: recipe.method[S.step]?.pic ? asset(recipe.method[S.step].pic!) : null,
    stepTechnique: techniqueOf(recipe.method[S.step]?.text || ''),
    stepTip: recipe.method[S.step]?.tip || null,
    stepMins: recipe.method[S.step]?.m ? recipe.method[S.step].m + ' ' + word('minutes', 'min') : null,
    canTime: !!recipe.method[S.step]?.m && !S.timerRun,
    timerCta: recipe.method[S.step]?.m
      ? (U.timerStart || 'Start a {m} minute timer').split('{m}').join(String(recipe.method[S.step].m))
      : '',
    timerOn: S.timerRun,
    timerText: Math.floor(S.timerLeft / 60) + ':' + String(S.timerLeft % 60).padStart(2, '0'),
    startTimer: () => setState({ timerRun: true, timerLeft: (recipe.method[S.step].m ?? 0) * 60 }),
    stopTimer: () => setState({ timerRun: false, timerLeft: 0 }),
    lostOpen: S.lostOpen,
    lostCta: S.lostOpen ? U.gotIt : T.cookLost,
    toggleLost: () => setState({ lostOpen: !S.lostOpen }),
    recap:
      S.step === 0
        ? vs('hob0', 'You have just started. Nothing is on the heat yet.')
        : vs('recapDone', 'You have done {a} of {b} steps. The last thing you did: {t}.', {
            a: S.step,
            b: recipe.method.length,
            t: recipe.method[S.step - 1].text.split('.')[0],
          }),
    hobState:
      S.step === 0
        ? vs('hobNone', 'Nothing on the hob.')
        : S.step < 3
          ? vs('hobPrep', 'Nothing on the hob yet — this is all prep.')
          : vs('hobHot', 'On the hob right now: the pan, hot. Do not walk away from it.'),
    nextCta:
      S.step >= recipe.method.length - 1 ? word('thatsIt', 'That’s it — done') : word('doneNext', 'Done, next'),
    nextStep: () => {
      if (S.step >= recipe.method.length - 1) {
        // Reaching the end of the method IS the cook — that is when it goes in
        // the log, with the waste question still open. Answering it later
        // annotates the same row; walking away no longer un-cooks dinner.
        // (It used to log only when the waste question was answered, so a
        // closed tab on the After screen lost the meal.)
        const id = currentCookId() ?? logCook(recipe, null);
        return go('after', { waste: null, reminded: false, cookLogId: id });
      }
      setState({ step: S.step + 1, timerRun: false, timerLeft: 0, lostOpen: false });
    },
    prevStep: () => setState({ step: Math.max(0, S.step - 1), timerRun: false, lostOpen: false }),
    methodUntranslated: lg !== 'en',
    stepsEnglishTitle: word('stepsEnglish', 'Steps are in English'),
    stepsEnglishWhy: word('stepsWhy', 'I have not translated the method.'),

    /* ── After ──────────────────────────────────────────────────────────── */
    photoSkipped: S.photoSkipped,
    photoWanted: !S.photoSkipped,
    plate: S.plate,
    setPlate: (url: string | null) => setState({ plate: url }),
    skipPhoto: () => setState({ photoSkipped: true }),
    unskipPhoto: () => setState({ photoSkipped: false }),
    platePlaceholder: X.plate,
    wasteUnset: !S.waste,
    wasteSet: !!S.waste,
    wasteChoices: (
      [
        { k: 'none' as const, pct: '0%', label: T.afterCleared },
        { k: 'some' as const, pct: '~20%', label: T.afterBit },
        { k: 'lots' as const, pct: '~50%', label: T.afterLoads },
      ]
    ).map((x) => ({
      key: x.k,
      pct: x.pct,
      label: x.label,
      style:
        'flex:1;padding:15px 8px;border-radius:24px;background:#f9f4ed;box-shadow:inset 0 0 0 1px rgba(32,30,29,.07);transition:background .15s',
      pick: async () => {
        // The cook is already in the log; this annotates it. The same row goes
        // back up to the cloud, where the upsert on client id overwrites.
        // currentCookId re-finds the row after a reload has dropped the
        // transient id, so the answer still lands on the right dinner.
        const target = currentCookId();
        const pct = x.k === 'lots' ? 0.5 : x.k === 'some' ? 0.2 : 0;
        const history = S.history.map((c) =>
          c.clientId && c.clientId === target ? { ...c, waste: pct } : c,
        );
        setState({ waste: x.k, history });
        const row = history.find((c) => c.clientId === target);
        if (auth.userId && row) pushCooks(auth.userId, [row]);
      },
    })),
    wasteHeadline: w ? w.head : '',
    wasteBody: w ? w.body : '',
    resetWaste: () => setState({ waste: null }),
    keepBg: recipe.keeps ? '#e1eecc' : '#eee7db',
    keepIconBg: recipe.keeps ? '#8fa073' : '#c0b6a5',
    keepIcon: recipe.keeps ? '✓' : '✕',
    keepFg: recipe.keeps ? '#3d472b' : '#645c50',
    keepTitle: (food.keepText(lg, recipe.id) || [recipe.keepTitle, recipe.keepBody])[0],
    keepBody: (food.keepText(lg, recipe.id) || [recipe.keepTitle, recipe.keepBody])[1],
    /* The button only exists when tapping it schedules a real notification:
       leftovers worth keeping, the nudge toggle on, and a signed-in account
       for the reminder to be attached to. It used to show for everyone and,
       signed out, set a flag, toast "Tomorrow 12:30 —", and then nothing on
       earth would fire — a promise with no machinery behind it. Signed out,
       the honest line says what it needs instead. */
    /* Gated on the pack because this is the only place in the app where a
       late-arriving language is permanent rather than a one-frame wobble.
       setReminder composes the notification body out of the pack and writes
       the finished sentence to Supabase; the edge function replays that stored
       text a day later, verbatim. Offer it before the pack lands and an Arabic
       reader gets a right-to-left-framed English push tomorrow, unfixable
       after the fact. */
    canRemind:
      packReady(lg) &&
      recipe.keeps && !S.reminded && S.waste !== 'none' && !!S.toggles.leftover && !!auth.userId,
    remindNeedsAccount:
      recipe.keeps && !S.reminded && S.waste !== 'none' && !!S.toggles.leftover && !auth.userId && cloudEnabled,
    remindNeedsAccountLine: xt(lg, 'notifyNeedsAccount'),
    remindCta: vs('remind', 'Nudge me at 12:30 tomorrow'),
    setReminder: () => {
      setState({ reminded: true });
      const line = vs('remindPing', 'Tomorrow 12:30 — {d} is still good.', { d: dish(recipe) });
      ping(line);
      const due = new Date();
      due.setDate(due.getDate() + 1);
      due.setHours(12, 30, 0, 0);
      scheduleReminder({
        userId: auth.userId!,
        title: 'Pantry',
        body: line,
        lang: lg,
        dueAt: due,
      });
    },
    streakBig: streakDays + ' ' + word('daysRunning', 'days running'),
    /* The clean-plate line used to claim "roughly £6.40 saved" — a hardcoded
       literal, whoever you were and whatever you cooked. The money claim is
       gone; a clean plate is worth stating without inventing its price. */
    /* The old line said "keep a clean plate tomorrow and it is a week" — the
       clean-plate streak it belonged to is gone; the flame now counts days you
       cooked, so the line does too. */
    streakSub: w && w.pct === 0 ? xt(lg, 'streakCleanReal') : xt(lg, 'streakGoOn'),
    streakDots: (HH.week || ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((d, i) => ({
      key: i,
      label: d,
      bg: i < Math.min(streakDays, 7) ? 'rgba(246,160,107,.9)' : 'rgba(245,234,216,.12)',
      fg: i < Math.min(streakDays, 7) ? '#402310' : 'rgba(245,234,216,.45)',
    })),
    finishMeal: () => {
      // The cook was logged when the last step was done; this is just leaving.
      // The end of a cook takes the place of the after screen rather than
      // stacking on top of it: Back from Home should not offer to log the same
      // dinner a second time.
      go('home', undefined, true);
    },

    /* ── Kitchen ────────────────────────────────────────────────────────── */
    goingOffLabel: word('goingOff', 'going off soon'),
    cupboardLabel: word('cupboard', 'cupboard stock'),
    keepsMonthsLabel: word('keepsMonths', 'Keeps for months'),
    daysWord: word('days', 'DAYS'),
    useItLabel: word('useIt', 'Use it'),
    useFirstCount: PERISH.filter((p) => p.days <= 4).length,
    stockValue: fmt(18.4),
    perishables: PERISH.map((p, i) => ({
      key: p.name,
      name: foodName(p.name),
      amount: AM['a' + (i + 1)] || p.amount,
      days: p.days,
      chipBg: p.days <= 2 ? '#ffc6a5' : p.days <= 4 ? '#ffe1d0' : '#e1eecc',
      chipFg: p.days <= 4 ? '#8c491a' : '#3d472b',
      use: () => go('results', { query: p.name, pickId: ranked()[0].id }),
    })),
    staples: STAPLES.map((label) => {
      const q = label.match(/ ×\d+$/);
      const base = q ? label.slice(0, -q[0].length) : label;
      const alias = ({ Chickpeas: 'Chickpeas, tinned', Peanuts: 'Roasted peanuts' } as Record<string, string>)[base] || base;
      return { key: label, label: foodName(alias) + (q ? q[0] : '') };
    }),

    /* ── Passport ───────────────────────────────────────────────────────── */
    ofCountriesLabel: word('ofCountries', 'of ' + COVERED + ' countries'),
    keptOutLabel: word('keptOut', 'kept out of takeaways'),
    countriesCooked: passportRows.length,
    totalSaved: fmt(savedVsTakeaway),
    /** True while the flags below are the shipped diorama rather than yours. */
    passportIsSample: realCooks.length === 0,
    passport: passportRows.slice()
      .sort((a, b) => a.price - b.price)
      .map((p, i) => ({
        key: p.code,
        rank: i + 1,
        code: p.code,
        dish: dish(RECIPES.filter((r) => r.name === p.dish)[0] || { name: p.dish }),
        meta:
          (PC[p.code] || p.country) +
          ' · ' +
          AM.cooked +
          ' ' +
          p.times +
          ' ' +
          (p.times === 1 ? AM.time : AM.times),
        price: fmt(p.price),
        bg: i === 0 ? '#fff2eb' : '#f9f4ed',
        rankFg: i === 0 ? '#c67139' : '#a19786',
        chipBg: i === 0 ? '#c67139' : '#ebddc5',
        chipFg: i === 0 ? '#fff' : '#645c50',
      })),
    /* This line used to read "84 countries you have never cooked from. The
       cheapest one you are missing is Ethiopia — misir wot lands at £0.71 a
       serving." Every number and both names were invented: 84 was the dead 91
       minus the seven on the passport, and neither Ethiopia nor misir wot is in
       the cookbook, so the app was recommending a dish it cannot cook. It is
       counted and named off the data now, and there is nothing to say once you
       have cooked from everywhere. */
    passportNudge: (() => {
      // Counted against what YOU have cooked once there is anything real —
      // the sample rows only answer for themselves while they are on stage.
      const cooked = new Set(
        realCooks.length
          ? realCooks.map((c) => c.code)
          : RECIPES.filter((r) => PASSPORT.some((p) => p.dish === r.name)).map((r) => r.code),
      );
      const missing = RECIPES.filter((r) => !cooked.has(r.code));
      if (!missing.length) return '';
      // Per serving at the cheapest tier, the same basis the passport rows use.
      const per = (r: Recipe) => (r.items.reduce((s, i) => s + i.s, 0) * 0.82) / r.servings;
      const cheapest = missing.reduce((a, r) => (per(r) < per(a) ? r : a));
      return fill(xt(lg, 'passportNudgeReal'), {
        n: new Set(missing.map((r) => r.code)).size,
        c: P.cn[cheapest.code] || COUNTRIES[cheapest.code]?.name || COUNTRY_NAMES[cheapest.code] || cheapest.code,
        d: dish(cheapest),
        a: fmt(per(cheapest)),
      });
    })(),
    passportSub: X.passportSub,

    /* ── Stats ──────────────────────────────────────────────────────────── */
    aServingAvgLabel: word('aServingAvg', 'a serving, average'),
    notSpentLabel: word('notSpent', 'not spent on takeaway'),
    leftOnPlateLabel: word('leftOnPlate', 'left on the plate'),
    eightWeeksLabel: word('eightWeeks', 'Eight weeks, oldest on the left'),
    patternLabel: word('patternMaybe', 'A pattern, maybe'),
    forgetAllLabel: word('forgetAll', 'Forget everything and start the questions again'),
    statsSpendWeek: fmt(thisWeek),
    statsSpendDelta:
      (lastWeek ? (thisWeek >= lastWeek ? '+' : '−') + fmt(Math.abs(thisWeek - lastWeek)) : '—') +
      ' ' +
      X.onLast,
    statsAvgServing: fmt(
      S.history.reduce((a, x) => a + x.spend / x.servings, 0) / Math.max(1, S.history.length),
    ),
    statsSaved: fmt(savedVsTakeaway),
    statsWaste:
      Math.round((S.history.reduce((a, x) => a + x.waste, 0) / Math.max(1, S.history.length)) * 100) + '%',
    weekBars: weekly.map((v, i) => ({
      key: i,
      label: i === weekly.length - 1 ? X.nowW : '−' + (weekly.length - 1 - i),
      h: Math.max(4, Math.round((v / Math.max(1, maxWeek)) * 108)) + 'px',
      bg: i === weekly.length - 1 ? '#c67139' : '#dcc9a6',
    })),
    topDishes: byDish.map((d) => ({
      key: d.id,
      name: P.dishes[d.id] || d.name,
      count: d.n + '×',
      meta: cuisineWord(d.cuisine) + ' · ' + fmt(d.spend / d.n) + ' ' + word('aCook', 'a cook'),
      barW: Math.round((d.n / byDish[0].n) * 100) + '%',
      pic: d.pic,
    })),
    diffBars: [1, 2, 3, 4].map((d) => {
      const n = S.history.filter((x) => x.diff === d).length;
      return {
        key: d,
        label: diffWord(d),
        pct: Math.round((n / Math.max(1, S.history.length)) * 100) + '%',
        w: Math.round((n / Math.max(1, S.history.length)) * 100) + '%',
        bg: ['#8fa073', '#aebf92', '#d67f48', '#b2622d'][d - 1],
      };
    }),
    statsSub: (X.statsSub || '').split('{n}').join(String(S.history.length)),
    /** True while every row in the log is the sample data the app ships with. */
    isSampleLog: S.history.length > 0 && S.history.every((c) => c.seeded),
    questions: openQuestions()
      .slice(0, 1)
      .map((q) => ({
        key: q.id,
        q: q.q,
        why: q.why,
        opts: q.opts.map((o) => ({ key: o.v, label: o.l, pick: () => answer(q.id, o.v) })),
        skip: () => setState({ dismissed: { ...S.dismissed, [q.id]: true } }),
      })),
    learnedList: learned().map((x) => {
      const txt = P.L[x.k + ':' + x.v] ||
        P.L[x.k] ||
        LEARNED_TEXT[x.k + ':' + x.v] ||
        LEARNED_TEXT[x.k] || [P.q.noted || 'Noted', ''];
      const shown = x.k === 'goal' ? P.goals[x.v] || x.v : x.k === 'cuisine' ? cuisineWord(x.v) : x.v;
      const put = (s: string) => String(s).split('{v}').join(shown);
      return {
        key: x.k,
        title: put(txt[0]),
        body: put(txt[1]),
        forget: () => {
          const p = { ...S.profile };
          delete p[x.k];
          setState({ profile: p, dismissed: { ...S.dismissed, [x.k]: true } });
        },
      };
    }),
    nothingLearned: learned().length === 0,
    nothingLearnedText: P.q.empty,
    forgetAll: () => setState({ profile: {}, dismissed: {} }),

    /* ── Browse ─────────────────────────────────────────────────────────── */
    wholeMenuTitle: word('wholeMenu', 'The whole menu'),
    browseSub: (X.browseSub || '').split('{city}').join(cityNow),
    browseCats: BROWSE_CATS.map((b) => ({
      key: b.k,
      label: word(b.w, b.label),
      style: (S.browseCat === b.k ? PILL_ON : PILL_OFF) + 'flex:none;font-size:13.5px;padding:9px 15px;',
      pick: () => setState({ browseCat: b.k }),
    })),
    browseCount: browseSet.length + ' ' + word('dishesWord', 'dishes'),
    browseList: browseSet.map((x) => ({
      key: x.id,
      name: dish(x),
      cuisine: cuisineWord(x.cuisine) + ' · ' + x.total + ' ' + word('minutes', 'min'),
      pic: x.pic,
      /* Was fmt(toBuy(x, 0.82) / servings) — a hardcoded discount tier, so a
         browse card quoted the Aldi price and tapping it showed the price at
         the shop you had actually chosen. The number moved on the way in and
         nothing on either screen said why. A span drawn from the same `stores`
         array cannot do that: the card's range contains the figure the next
         screen prints, by construction. */
      per: fmtSpan(spanOf(x).lo / x.servings, spanOf(x).hi / x.servings),
      diffLabel: diffWord(x.diff),
      diffBg: x.diff <= 1 ? '#e1eecc' : x.diff <= 2 ? '#f7eeda' : x.diff <= 3 ? '#ffe1d0' : '#ffc6a5',
      diffFg: x.diff <= 2 ? '#3d472b' : '#8c491a',
      pick: () => go('results', { pickId: x.id, query: x.name, showMicro: false }),
    })),

    /* ── The week ───────────────────────────────────────────────────────── */
    isPlan: screen === 'plan',
    goPlan: () => go('plan'),
    planDays: S.planDays,
    planMeals: S.planMeals,
    planServings: S.planServings,
    planSavedNote: S.planSaved,
    /* planSaving already existed and already guarded the double tap; the button
       simply never read it, so a two-table Supabase insert looked like nothing
       had happened. */
    planBusy: S.planSaving,
    planDayChips: [3, 5, 7].map((d) => ({
      key: String(d),
      label: String(d),
      style: (S.planDays === d ? PILL_ON : PILL_OFF) + 'flex:none;min-width:56px;justify-content:center;text-align:center;',
      pick: () => setState({ planDays: d, plan: [], planSaved: false }),
    })),
    planMealChips: [1, 2].map((m) => ({
      key: String(m),
      label: String(m),
      style: (S.planMeals === m ? PILL_ON : PILL_OFF) + 'flex:none;min-width:56px;justify-content:center;text-align:center;',
      pick: () => setState({ planMeals: m, plan: [], planSaved: false }),
    })),
    planServingChips: [1, 2, 4].map((n) => ({
      key: String(n),
      label: String(n),
      style: (S.planServings === n ? PILL_ON : PILL_OFF) + 'flex:none;min-width:56px;justify-content:center;text-align:center;',
      pick: () => setState({ planServings: n, planSaved: false }),
    })),
    planEmpty: S.plan.length === 0,
    /** Fill the week from the same ranking Tonight uses, so your diets, your
     *  tier list and your goal all still apply — just seven times over. */
    buildPlan: () => {
      const pool = ranked();
      if (!pool.length) return;
      // A week you have not got the evenings for is not a plan. The days are
      // filled from what fits your time — rotated, so a shuffle still shuffles
      // — and only spill past it when there are not enough dishes under it to
      // go round without serving you the same one five nights running. The
      // cells that spilled say so.
      const fits = pool.filter(fitsTime);
      const over = pool.filter((r) => !fitsTime(r));
      const spin = fits.length ? Math.floor(Math.random() * fits.length) : 0;
      const order = fits.length ? fits.slice(spin).concat(fits.slice(0, spin), over) : pool;
      const want = S.planDays * S.planMeals;
      const picks: string[] = [];
      for (let i = 0; i < want; i += 1) picks.push(order[i % order.length].id);
      setState({ plan: picks, planSaved: false });
    },
    planCells: S.plan.map((id, i) => {
      const r = RECIPES.find((x) => x.id === id) || RECIPES[0];
      const pool = ranked();
      return {
        key: i + ':' + id,
        day: Math.floor(i / S.planMeals) + 1,
        showDay: i % S.planMeals === 0,
        dayLabel: word('planDay', 'Day') + ' ' + (Math.floor(i / S.planMeals) + 1),
        name: dish(r),
        pic: r.pic,
        meta:
          cuisineWord(r.cuisine) +
          ' · ' +
          r.total +
          ' ' +
          word('minutes', 'min') +
          (fitsTime(r) ? '' : ' · ' + overBy) +
          ' · ' +
          diffWord(r.diff),
        /* A single figure, unlike Tonight, Results and Browse.
           This was a span for one build and it was wrong twice over. The
           screen already prints "the whole week" and "a day" as exact totals
           and a shopping list of exact rows underneath, all at the selected
           shop — a column of ranges between them reads as arithmetic that does
           not add up, and the reader is right. And a week is one trip: the
           spread between Aldi and a corner shop is a choice you make once for
           the whole list, not five separate uncertainties.
           The spans belong where a dish is still being chosen. By the time you
           are laying out a week you have chosen the shop. */
        price: fmt((toBuy(r, mult) / r.servings) * S.planServings),
        open: () => go('results', { pickId: id, showMicro: false }),
        swap: (e: ReactMouseEvent) => {
          e.stopPropagation();
          const used = new Set(S.plan);
          const next = pool.find((x) => !used.has(x.id)) || pool[(pool.indexOf(r) + 1) % pool.length];
          const copy = S.plan.slice();
          copy[i] = next.id;
          setState({ plan: copy, planSaved: false });
        },
      };
    }),
    planList: (() => {
      type Line = { key: string; name: string; uses: number; cost: number; owned: boolean };
      const map = new Map<string, Line>();
      for (const id of S.plan) {
        const r = RECIPES.find((x) => x.id === id);
        if (!r) continue;
        const scale = S.planServings / r.servings;
        for (const item of r.items) {
          if (item.opt && !wantsExtra(item.n)) continue;
          const owned = isOwned(r, item.n);
          const line = map.get(item.n) || {
            key: item.n,
            name: foodName(item.n),
            uses: 0,
            cost: 0,
            owned: true,
          };
          line.uses += 1;
          line.cost += item.s * mult * scale;
          // Only struck out if every dish that wants it already has it.
          line.owned = line.owned && owned;
          map.set(item.n, line);
        }
      }
      return [...map.values()]
        .sort((a, b) => Number(a.owned) - Number(b.owned) || b.cost - a.cost)
        .map((l) => ({
          key: l.key,
          name: l.name,
          sub:
            l.uses > 1
              ? l.uses + ' ' + word('planUses', 'meals')
              : word('planUse', '1 meal'),
          price: l.owned ? fmt(0) : fmt(l.cost),
          owned: l.owned,
          nameFg: l.owned ? '#82796a' : '#201e1d',
          strike: l.owned ? 'line-through' : 'none',
          boxBg: l.owned ? '#8fa073' : '#eee7db',
          tick: l.owned ? '✓' : '',
          priceFg: l.owned ? '#a19786' : '#201e1d',
        }));
    })(),
    planTotal: (() => {
      let total = 0;
      const counted = new Set<string>();
      for (const id of S.plan) {
        const r = RECIPES.find((x) => x.id === id);
        if (!r) continue;
        const scale = S.planServings / r.servings;
        for (const item of r.items) {
          if (!onList(r, item)) continue;
          counted.add(item.n);
          total += item.s * mult * scale;
        }
      }
      return fmt(total);
    })(),
    planPerDay: (() => {
      let total = 0;
      for (const id of S.plan) {
        const r = RECIPES.find((x) => x.id === id);
        if (!r) continue;
        total += toBuy(r, mult) * (S.planServings / r.servings);
      }
      return fmt(S.planDays ? total / S.planDays : 0);
    })(),
    savePlan: async () => {
      // The in-flight flag is a double-tap guard as much as UI: two quick taps
      // used to insert the same week twice. It is read through the ref and set
      // before the first await, because the first save also loads the Supabase
      // client — hundreds of milliseconds in which a second tap would sail
      // past a flag that only flipped afterwards.
      if (!auth.userId || !S.plan.length || ref.current.planSaving) return;
      setState({ planSaving: true });
      const db = await getDb();
      if (!db) {
        setState({ planSaving: false });
        return;
      }
      const { data, error } = await db
        .from('saved_plans')
        .insert({
          user_id: auth.userId,
          label: xt(lg, 'planTitle'),
          days: S.planDays,
          meals_per_day: S.planMeals,
          servings: S.planServings,
          country: cc,
          diets: S.diets,
        })
        .select('id')
        .single();
      if (error || !data) {
        // A failed save that says nothing looks exactly like a successful one
        // from the outside, which is the worst property a Save button can have.
        console.warn('savePlan', error?.message);
        setState({ planSaving: false });
        ping(xt(lg, 'planSaveFailed'));
        return;
      }
      const rows = S.plan.map((id, i) => ({
        plan_id: data.id as string,
        user_id: auth.userId!,
        day: Math.floor(i / S.planMeals),
        slot: i % S.planMeals,
        recipe_id: id,
        servings: S.planServings,
      }));
      const { error: err2 } = await db.from('plan_meals').insert(rows);
      if (err2) {
        console.warn('savePlan meals', err2.message);
        setState({ planSaving: false });
        ping(xt(lg, 'planSaveFailed'));
        return;
      }
      setState({ planSaved: true, planSaving: false });
      ping(xt(lg, 'planSaved'));
    },

    /* ── Settings ───────────────────────────────────────────────────────── */
    kitchenSub: X.kitchenSub,
    nudgesLabel: X.nudges,
    insteadLabel: X.insteadOf,
    twoOthersLabel: X.twoOthers,
    skillSummary: word('skillIs', 'Skill') + ': ' + cap(skillWords[lvl] || '') + '.',
    /* Reads the number that actually governs what gets offered. It used to read
       the time tier list, which wrote nothing — so this line could, and did,
       disagree with the time chips on the Home screen. The 999 branch is not
       optional: "No rush" is stored as 999 minutes. */
    timeSummary:
      S.maxTime === 999
        ? word('timeIs', 'Time') + ': ' + R.noRush + '.'
        : word('timeIs', 'Time') +
          ': ' +
          word('upTo', 'up to') +
          ' ' +
          S.maxTime +
          ' ' +
          word('minutesNormal', 'minutes on a normal day') +
          '.',
    redoTier: () => go('tier'),
    /* Two switches, both of which do something. The other two rows that used
       to sit here gated nothing: "portion learning" belonged to the shrink
       offer (now gone), and "shop closing alerts" described a feature with no
       code behind it anywhere — no timer, no notification, no closing-time
       check. The mascot's switch is here rather than under some appearance
       heading because a character bobbing in the corner is a nudge like any
       other, and this is where you come to stop being nudged. */
    toggles: [
      { k: 'leftover', label: X.leftoverN, sub: X.leftoverS },
      { k: 'mascot', label: xt(lg, 'mascotN'), sub: xt(lg, 'mascotS') },
    ].map((t) => ({
      key: t.k,
      label: t.label,
      sub: t.sub,
      on: !!S.toggles[t.k],
      trackBg: S.toggles[t.k] ? '#8fa073' : '#dcd3c4',
      knobX: S.toggles[t.k] ? '23px' : '3px',
      flip: () => setState({ toggles: { ...S.toggles, [t.k]: !S.toggles[t.k] } }),
    })),
    /* ── Your data, in your hands ───────────────────────────────────────────
       Everything above lives in one key in one browser. Clear the browser and
       it is gone: there is no copy anywhere else unless you asked for one. */
    exportData: () => exportBackup(readStore()),
    importData: (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      // Emptied whatever happens next, or picking the same file twice fires
      // change only once.
      e.target.value = '';
      if (!file) return;
      file
        .text()
        .then((text) => {
          const got = readBackup(text);
          if (!got.ok) {
            // Two refusals, two different truths. A newer file is not
            // half-opened: taking the keys this build recognises and dropping
            // the rest would look like it worked, and then the next state
            // change would write the pruned blob back over it — an import that
            // quietly deletes half your history.
            ping(xt(lg, got.why === 'future' ? 'dataFutureFile' : 'dataBadFile'));
            return;
          }
          // Through the same filter the boot read uses. A file can carry
          // anything; only the seventeen keys in KEEP, each of the right shape,
          // get past here.
          const keep = pick(got.data);
          const cooks = Array.isArray(keep.history)
            ? (keep.history as LocalCook[]).filter((h) => h && !h.seeded).length
            : 0;
          try {
            sessionStorage.setItem(IMPORTED_KEY, String(cooks));
          } catch {
            /* no confirmation, then — the data still arrives */
          }
          try {
            localStorage.setItem(STORE_KEY, JSON.stringify(keep));
          } catch {
            ping(xt(lg, 'dataBadFile'));
            return;
          }
          // Storage, then reload, and nothing set on React state in between:
          // `save(S)` runs on every state change and would write the old
          // profile straight back over the file just placed. The reload also
          // makes initialState() the only thing that ever turns a blob into
          // state, so an import behaves exactly like opening the app tomorrow
          // rather than being a second hydration path that can drift from
          // load(); it clears everything outside KEEP, all of which is stale
          // against an imported profile; and it lets the sign-in merge run
          // once in its usual order instead of racing a mid-session setS.
          window.location.reload();
        })
        .catch(() => ping(xt(lg, 'dataBadFile')));
    },
    /* Said only when it is true. After the reload the sign-in merge carries
       your imported cooks up — history is merged, and it is the irreplaceable
       part — but a profile the account already has wins on settings. Better to
       say so than to quietly hand back a file that half took. */
    importCloudNote: auth.userId ? xt(lg, 'dataImportCloud') : '',

    restart: () => {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch {
        /* nothing to clear */
      }
      // Your language and what a pound is worth are not things you told me, so
      // neither is mine to throw away here.
      setS({ ...INITIAL, lang: S.lang, fx: S.fx });
      // Starting over is not somewhere you travelled to: the address bar goes
      // back to the welcome in place, so Back does not offer the settings of a
      // profile that no longer exists.
      writeHash(hashFor('welcome', INITIAL.pickId), false);
    },
    langNative: i18n.nativeOf(lg),
    langOpen: S.langOpen,
    toggleLang: () => setState({ langOpen: !S.langOpen }),
    langOptions: i18n.LANGS.map((l) => ({
      key: l.code,
      native: l.native,
      style: (lg === l.code ? PILL_ON : PILL_OFF) + 'flex:none;font-size:14.5px;padding:11px 18px;',
      // Both the interface and the ingredient names are fetched now, and both
      // are waited for, so the screen changes language once rather than in two
      // passes. A switch that cannot complete does not happen at all: offline,
      // an Arabic label sitting over an English interface is worse than the
      // English label you already had, and you would have to find your way back
      // through it.
      pick: async () => {
        const [got] = await Promise.all([
          loadPack(l.code),
          food.needsTable(l.code) ? food.loadTable() : Promise.resolve(true),
        ]);
        if (!got) {
          ping(fill(xt(lg, 'langOffline'), { n: i18n.nativeOf(l.code) }));
          return;
        }
        setState({ lang: l.code, langOpen: false, packAt: l.code });
      },
    })),
    /* Nominatim and Overpass run for real when you grant location, Open Prices
       runs whenever you open a shopping list, and the exchange rate is live the
       moment a network allows it — the last row says so, or says why not. The
       remaining two are honest provenance for data that is not wired in yet,
       and the screen shows which is which rather than implying all of them are
       live. */
    sources: SOURCES.map((s, n) => {
      // Live means this session has actually had something back, not that the
      // name matches something we could in principle call. Nominatim answers
      // with a place name and Overpass with a list of shops; until one of those
      // has landed the row says "not connected yet", because it is not.
      const on = /nominatim/i.test(s.name)
        ? S.liveCity !== null
        : /overpass/i.test(s.name)
          ? S.liveShops !== null
          : /open prices/i.test(s.name)
            ? Object.keys(S.openPrices).length > 0
            : false;
      return {
        ...s,
        key: s.name,
        use: P.us[n] || s.use,
        active: on,
        note: on ? '' : xt(lg, 'sourceIdle'),
      };
    }).concat([
      {
        key: 'fx',
        name: 'European Central Bank · Frankfurter',
        use: xt(lg, 'sourceFx'),
        licence: 'ECB',
        url: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html',
        active: !!fxLive,
        // Three states, three truths. "Not connected yet" would be a permanent
        // lie in Lagos, Lahore and Dubai: the ECB publishes no rate for their
        // money and never will, so those prices are bundled by design, not by
        // failure, and the row says which.
        note: fxLive ? '' : S.fx ? xt(lg, 'sourceFxBundled') : xt(lg, 'sourceIdle'),
      },
    ]),

    /* ── Copy that appears on more than one screen ──────────────────────── */
    t: T,
    u: U,

    /* Copy added after the handoff — English until translated. */
    xt: (k: string) => xt(lg, k),

    /* ── The account ─────────────────────────────────────────────────────── */
    cloudEnabled,
    authStatus: auth.status,
    authError: auth.error ?? (auth.status === 'error' ? xt(lg, 'cloudUnreachable') : null),
    signedIn: !!auth.userId,
    userId: auth.userId,
    email: auth.email,
    signIn: auth.signIn,
    signOut: auth.signOut,

    nav: navItems.map((n) => ({
      key: n.id,
      label: T[n.t] || n.label,
      fg: screen === n.id ? '#c67139' : '#a19786',
      d: n.d,
      go: () => go(n.id),
    })),
  };
}

export type Pantry = ReturnType<typeof usePantry>;
