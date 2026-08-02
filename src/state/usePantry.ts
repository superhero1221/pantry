import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChangeEvent,
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
  SKILL_TIERS,
  SOURCES,
  STAPLES,
  STORES_BY_COUNTRY,
  TIME_CARDS,
  TIME_TIERS,
} from '../data/cookbook';
import type { HistoryRow, Recipe, Store, TechniqueCard } from '../data/types';
import * as food from '../data/pantry-food';
import * as i18n from '../data/pantry-i18n';
import type { Shop, Price } from '../data/pantry-live';
import { cloudEnabled, db } from '../lib/supabase';
import { asset } from '../lib/asset';
import { xt } from '../data/extra-copy';
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
 *  of the five places a dish picture is rendered. */
const RECIPES: Recipe[] = RAW_RECIPES.map((r) => ({ ...r, pic: asset(r.pic) }));

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
  | 'settings';

type Waste = 'none' | 'some' | 'lots';

interface Drag {
  id: string;
  label: string;
  x: number;
  y: number;
  ox: number;
  oy: number;
  moved: boolean;
  over: string | null;
}

export interface PantryState {
  screen: Screen;
  seen: boolean;
  tierStep: 0 | 1;
  skill: Record<string, string>;
  time: Record<string, string>;
  diets: string[];
  country: string | null;
  locating: boolean;
  located: boolean;
  query: string;
  budget: number;
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
  shrink: boolean | null;
  streak: number;
  reminded: boolean;
  notif: string | null;
  drag: Drag | null;
  sel: string | null;
  toggles: Record<string, boolean>;
  lang: string | null;
  langOpen: boolean;
  liveStatus: 'idle' | 'locating' | 'placed' | 'live' | 'noshops' | 'error';
  liveErr: string | null;
  liveCity: string | null;
  liveArea: string | null;
  liveShops: Shop[] | null;
  liveCoords: { lat: number; lon: number } | null;
  livePrices: Record<string, Price> | null;
  priceStatus: 'idle' | 'loading' | 'live' | 'empty';
  vendorKey: string;
  vendorDraft: string;
  browseCat: string;
  history: LocalCook[];
  profile: Record<string, string>;
  dismissed: Record<string, boolean>;
  photoSkipped: boolean;
  plate: string | null;
  medians: Record<string, PriceMedian>;
  reportFor: string | null;
  reportPrice: string;
  reportPack: string;
  reportBusy: boolean;
  planDays: number;
  planMeals: number;
  planServings: number;
  plan: string[];
  planSaved: boolean;
}

const INITIAL: PantryState = {
  screen: 'welcome',
  seen: false,
  tierStep: 0,
  skill: {},
  time: {},
  diets: [],
  country: null,
  locating: false,
  located: false,
  query: '',
  budget: 6,
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
  shrink: null,
  streak: 4,
  reminded: false,
  notif: null,
  drag: null,
  sel: null,
  toggles: { leftover: true, shrink: true, shop: false },
  lang: null,
  langOpen: false,
  liveStatus: 'idle',
  liveErr: null,
  liveCity: null,
  liveArea: null,
  liveShops: null,
  liveCoords: null,
  livePrices: null,
  priceStatus: 'idle',
  vendorKey: '',
  vendorDraft: '',
  browseCat: 'all',
  // Eight weeks of sample cooks so the Stats screen is legible before you have
  // cooked anything. Marked seeded so it never reaches anyone's account.
  history: HISTORY.map((h) => ({ ...h, seeded: true })),
  profile: {},
  dismissed: {},
  photoSkipped: false,
  plate: null,
  medians: {},
  reportFor: null,
  reportPrice: '',
  reportPack: '',
  reportBusy: false,
  planDays: 5,
  planMeals: 1,
  planServings: 2,
  plan: [],
  planSaved: false,
};

/* ── What survives a reload ────────────────────────────────────────────────
   Only what the user actually told the app: their languages, their tier
   lists, their diets, what they cooked. Never the transient screen state.
   "Start over" in Settings clears the lot. */
const STORE_KEY = 'pantry.v1';
const KEEP = [
  'seen',
  'skill',
  'time',
  'diets',
  'country',
  'budget',
  'maxTime',
  'lang',
  'toggles',
  'history',
  'profile',
  'dismissed',
  'streak',
  'vendorKey',
  'planDays',
  'planMeals',
  'planServings',
  'plan',
] as const;

function load(): Partial<PantryState> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PantryState>) : {};
  } catch {
    return {};
  }
}

function save(s: PantryState) {
  try {
    const out: Record<string, unknown> = {};
    for (const k of KEEP) out[k] = s[k];
    localStorage.setItem(STORE_KEY, JSON.stringify(out));
  } catch {
    /* private mode, quota — the app works fine without it */
  }
}

function initialState(): PantryState {
  const saved = load();
  const s = { ...INITIAL, ...saved };
  if (s.seen) s.screen = 'home';
  return s;
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

  /* Language: the browser's, until the user says otherwise. */
  useEffect(() => {
    if (!ref.current.lang) setState({ lang: i18n.detect() });
  }, [setState]);

  /* One-second tick for the cook-step timer. */
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = ref.current;
      if (s.timerRun && s.timerLeft > 0) setState({ timerLeft: s.timerLeft - 1 });
    }, 1000);
    return () => window.clearInterval(t);
  }, [setState]);

  const go = useCallback(
    (screen: Screen, extra?: Partial<PantryState>) => {
      setState({ screen, lostOpen: false, ...extra });
      const el = document.querySelector('.pg-scroll');
      if (el) el.scrollTop = 0;
    },
    [setState],
  );

  const place = useCallback(
    (id: string, tier: string) => {
      const s = ref.current;
      const key = s.tierStep === 0 ? 'skill' : 'time';
      setState({ [key]: { ...s[key], [id]: tier }, sel: null } as Partial<PantryState>);
    },
    [setState],
  );

  const pull = useCallback(
    (id: string) => {
      const s = ref.current;
      const key = s.tierStep === 0 ? 'skill' : 'time';
      const m = { ...s[key] };
      delete m[id];
      setState({ [key]: m } as Partial<PantryState>);
    },
    [setState],
  );

  const ping = useCallback(
    (text: string) => {
      setState({ notif: text });
      window.clearTimeout(notifTimer.current);
      notifTimer.current = window.setTimeout(() => setState({ notif: null }), 4200);
    },
    [setState],
  );

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
    streak: s.streak,
    country: s.country || 'GB',
    diets: s.diets,
    skill_cards: s.skill,
    time_cards: s.time,
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
        streak: remote.streak ?? local.streak,
        skill: remote.skill_cards ?? local.skill,
        time: remote.time_cards ?? local.time,
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
    S.streak,
    S.skill,
    S.time,
    S.profile,
    S.dismissed,
    S.toggles,
    S.seen,
  ]);

  /* Dragging a technique card. The pointer listeners live on the window so a
     card can be dropped anywhere, including outside its row. */
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = ref.current.drag;
      if (!d) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const row = el?.closest('[data-tier]');
      setState({
        drag: {
          ...d,
          x: e.clientX,
          y: e.clientY,
          over: row ? row.getAttribute('data-tier') : null,
          moved: d.moved || Math.abs(e.clientX - d.ox) + Math.abs(e.clientY - d.oy) > 5,
        },
      });
    };
    const up = () => {
      const d = ref.current.drag;
      if (!d) return;
      if (d.over) place(d.id, d.over);
      else if (!d.moved) setState({ sel: d.id });
      setState({ drag: null });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setState]);

  /* ── Language ─────────────────────────────────────────────────────────── */
  const lg = S.lang || 'en';
  const T = useMemo(() => i18n.strings(lg), [lg]);
  const P = useMemo(() => i18n.pack(lg), [lg]);
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

  const fmt = useCallback(
    (gbp: number) => {
      const v = gbp * c.idx * c.fx;
      if (c.fx >= 40) return c.sym + Math.round(v).toLocaleString();
      return c.sym + v.toFixed(2);
    },
    [c],
  );

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

  const toBuy = useCallback(
    (r: Recipe, m: number = mult) =>
      r.items
        .filter((i) => r.have.indexOf(i.n.split(',')[0]) < 0)
        .reduce((a, i) => a + i.s * m, 0),
    [mult],
  );
  const allIn = (r: Recipe) => r.items.reduce((a, i) => a + i.s * mult, 0);

  /* ── The tier lists ───────────────────────────────────────────────────── */
  const skillLevel = () => {
    if (!Object.values(S.skill).length) return 2;
    let sc = 0;
    SKILL_CARDS.forEach((cd) => {
      const t = S.skill[cd.id];
      if (t === 'S') sc += (cd.w ?? 0) * 1.1;
      else if (t === 'A') sc += (cd.w ?? 0) * 0.7;
    });
    return Math.max(1, Math.min(4, Math.round(sc / 4)));
  };
  const timeLevel = () => {
    let best = 0;
    TIME_CARDS.forEach((cd) => {
      const t = S.time[cd.id];
      if ((t === 'S' || t === 'A') && (cd.m ?? 0) > best) best = cd.m ?? 0;
    });
    return best || 45;
  };

  /* ── Ranking ──────────────────────────────────────────────────────────── */
  const ranked = useCallback((): Recipe[] => {
    const q = S.query.toLowerCase().trim();
    const lvl = skillLevel();
    const scored = RECIPES.map((r) => {
      let s = 0;
      if (q) {
        const hay = (r.name + ' ' + r.cuisine + ' ' + (r.copycat || '') + ' ' + r.local).toLowerCase();
        if (hay.indexOf(q) >= 0) s -= 100;
        q.split(/\s+/).forEach((w) => {
          if (w.length > 2 && hay.indexOf(w) >= 0) s -= 30;
        });
        if (r.copycat && COPYCAT_HINTS.some((h) => q.indexOf(h) >= 0)) s -= 140;
      }
      const cost = toBuy(r, 0.82);
      if (cost > S.budget) s += (cost - S.budget) * 22;
      else s -= 6;
      if (r.total > S.maxTime) s += (r.total - S.maxTime) * 0.5;
      S.diets.forEach((d) => {
        if (['vegan', 'vegetarian', 'gluten_free', 'dairy_free'].indexOf(d) >= 0 && r.tags.indexOf(d) < 0)
          s += 200;
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
      return { r, s };
    });
    scored.sort((a, b) => a.s - b.s);
    return scored.map((x) => x.r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.query, S.budget, S.maxTime, S.diets, S.profile, S.skill, toBuy]);

  /* ── Real location, real shops ────────────────────────────────────────── */
  const live = () => import('../data/pantry-live');

  const refreshPrices = useCallback(async () => {
    const r = RECIPES.find((x) => x.id === ref.current.pickId) || RECIPES[0];
    setState({ priceStatus: 'loading' });
    try {
      const L = await live();
      const names = r.items.map((i) => i.n.split(',')[0]);
      const got = await L.priceBasket(names, ref.current.country || 'GB');
      setState({ livePrices: got, priceStatus: Object.keys(got).length ? 'live' : 'empty' });
    } catch {
      setState({ priceStatus: 'empty' });
    }
  }, [setState]);

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
      refreshPrices();
    } catch (e) {
      setState({
        liveStatus: 'error',
        liveErr: e instanceof Error ? e.message : String(e),
        locating: false,
        located: true,
      });
    }
  }, [refreshPrices, setState]);

  /* ── The log, and the questions it earns the right to ask ─────────────── */
  const logCook = (r: Recipe, waste: Waste | null) => {
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
    priceMedians(refs, ref.current.country || 'GB').then((m) => {
      if (live) setState({ medians: m });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.screen, S.pickId, S.country, setState]);

  /* ── Derived view values ──────────────────────────────────────────────── */
  const screen = S.screen;
  const cityNow = S.liveCity || c.city;
  const tierIsSkill = S.tierStep === 0;
  const cards: TechniqueCard[] = tierIsSkill ? SKILL_CARDS : TIME_CARDS;
  const tiers = tierIsSkill ? SKILL_TIERS : TIME_TIERS;
  const placed = tierIsSkill ? S.skill : S.time;
  const dragOver = S.drag ? S.drag.over : null;

  const buy = toBuy(recipe);
  const whole = allIn(recipe);
  const saved = whole - buy;
  const per = buy / recipe.servings;
  const under = S.budget - buy;
  const lvl = skillLevel();

  // What the basket costs once real reported prices replace the model.
  const buyReal = recipe.items
    .filter((i) => recipe.have.indexOf(i.n.split(',')[0]) < 0)
    .reduce((a, i) => {
      const seen = S.medians[refOf(i.n)];
      const g = gramsOf(i.g);
      return a + (seen && g ? (seen.median_per_kg * g) / 1000 : i.s * mult);
    }, 0);

  const cardWord = (cd: TechniqueCard) => P.skill[cd.id] || P.times[cd.id] || cd.label;
  const tierWord = (t: { key: string; label: string }) =>
    (tierIsSkill ? P.sTiers[t.key] : P.tTiers[t.key]) || t.label;

  const skillWords = P.levels;
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
  const vs = (k: string, fb: string, vals?: Record<string, string | number>) => fill(V[k] || fb, vals);
  const countryName = P.cn[cc] || c.name;

  const wasteMap = {
    none: { head: word('clearedIt', 'Nothing left.'), body: V.wasteNone, pct: 0 },
    some: { head: word('someLeft', 'About a fifth left.'), body: V.wasteSome, pct: 20 },
    lots: { head: word('lotsLeft', 'Around half left.'), body: V.wasteLots, pct: 45 },
  };
  const w = S.waste ? wasteMap[S.waste] : null;
  const shrinkSave = w ? (per * w.pct) / 100 : 0;

  const dietOn = (id: string) => S.diets.indexOf(id) >= 0;
  const dietWords = i18n.diets(lg);

  const weekly = [7, 6, 5, 4, 3, 2, 1, 0].map((wk) =>
    S.history.filter((x) => x.ago >= wk * 7 && x.ago < (wk + 1) * 7).reduce((a, x) => a + x.spend, 0),
  );
  const maxWeek = Math.max.apply(null, weekly);
  const thisWeek = weekly[weekly.length - 1];
  const lastWeek = weekly[weekly.length - 2];

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

  const navItems = [
    { id: 'home' as const, t: 'navTonight', label: 'Tonight', d: 'M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8' },
    {
      id: 'kitchen' as const,
      t: 'navKitchen',
      label: 'Kitchen',
      d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 10h18M7 6.5v1M7 14v2',
    },
    { id: 'stats' as const, t: 'navStats', label: 'Stats', d: 'M3 20h18M7 20v-7M12 20V6M17 20v-11' },
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
    showNav:
      ['home', 'kitchen', 'stats', 'passport', 'settings', 'browse', 'plan'].indexOf(screen) >= 0,

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
    toTier: () => go('tier', { tierStep: 0 }),
    skipOnboarding: () => go('home', { seen: true }),
    back: () => {
      if (screen === 'tier' && S.tierStep === 1) return setState({ tierStep: 0 });
      if (screen === 'tier') return go('welcome');
      if (screen === 'diet') return go('tier', { tierStep: 1 });
      if (screen === 'locate') return go('diet');
      if (screen === 'shop') return go('results');
      return go('home');
    },
    goHome: () => go('home'),
    goKitchen: () => go('kitchen'),
    goPassport: () => go('passport'),
    goBrowse: () => go('browse'),
    noop: () => ping(vs('receiptPing', 'Receipt scanning is a sketch for now — the price engine is what is real.')),

    /* ── Tier list ──────────────────────────────────────────────────────── */
    dot1: S.tierStep === 0 ? '#c67139' : '#dcd3c4',
    dot2: S.tierStep === 1 ? '#c67139' : '#dcd3c4',
    tierTitle: tierIsSkill ? T.tierSkill : T.tierTime,
    tierSub: tierIsSkill ? vs('tierSkillSub', '') : vs('tierTimeSub', ''),
    trayLabel: Object.keys(placed).length ? word('leftToPlace', 'left to place') : word('theCards', 'The cards'),
    trayEmpty: Object.keys(placed).length >= cards.length,
    tierRows: tiers.map((t) => {
      const mine = cards.filter((cd) => placed[cd.id] === t.key);
      const hot = dragOver === t.key || (S.sel && !mine.length);
      return {
        key: t.key,
        label: tierWord(t),
        badgeBg: t.badgeBg,
        badgeFg: t.badgeFg,
        empty: mine.length === 0,
        style:
          'display:flex;gap:11px;align-items:center;padding:8px;border-radius:22px;width:100%;text-align:start;min-height:62px;transition:background .15s,box-shadow .15s;background:' +
          (dragOver === t.key ? '#ffe1d0' : '#f9f4ed') +
          (hot ? ';box-shadow:inset 0 0 0 2px #c67139' : ';box-shadow:inset 0 0 0 1px rgba(32,30,29,.06)'),
        onDrop: () => {
          if (S.sel) place(S.sel, t.key);
        },
        cards: mine.map((cd) => ({
          key: cd.id,
          label: cardWord(cd),
          pull: (e: ReactMouseEvent) => {
            e.stopPropagation();
            pull(cd.id);
          },
        })),
      };
    }),
    tray: cards
      .filter((cd) => !placed[cd.id])
      .map((cd) => ({
        key: cd.id,
        label: cardWord(cd),
        style:
          'padding:11px 15px;border-radius:999px;font-size:13.5px;font-weight:600;touch-action:none;user-select:none;transition:transform .12s;background:' +
          (S.sel === cd.id ? '#c67139;color:#fff' : '#fff;color:#201e1d') +
          ';box-shadow:0 1px 2px rgba(46,43,37,.14)' +
          (S.drag && S.drag.id === cd.id ? ';opacity:.3' : ''),
        grab: (e: ReactPointerEvent) => {
          e.preventDefault();
          setState({
            drag: {
              id: cd.id,
              label: cardWord(cd),
              x: e.clientX,
              y: e.clientY,
              ox: e.clientX,
              oy: e.clientY,
              moved: false,
              over: null,
            },
          });
        },
      })),
    tierReadout: tierIsSkill
      ? Object.keys(S.skill).length
        ? vs('readsLike', 'Reads like: {w}. {p}', { w: skillWords[lvl], p: V['plan' + lvl] || '' })
        : vs('placeFew', 'Place a few and I will tell you what I make of it.')
      : Object.keys(S.time).length
        ? vs('timeRead', 'Right — I will keep everything under {m} minutes on a normal day.', { m: timeLevel() })
        : vs('placeFew', 'Place a few and I will tell you what I make of it.'),
    tierCta: T.tierNext,
    tierNext: () => (tierIsSkill ? setState({ tierStep: 1, sel: null }) : go('diet')),

    dragging: !!S.drag,
    dragLabel: S.drag ? S.drag.label : '',
    ghostStyle: S.drag
      ? {
          position: 'fixed' as const,
          left: S.drag.x,
          top: S.drag.y,
          transform: 'translate(-50%,-50%) rotate(-3deg) scale(1.06)',
          padding: '11px 15px',
          borderRadius: 999,
          background: '#c67139',
          color: '#fff',
          fontSize: 13.5,
          fontWeight: 600,
          pointerEvents: 'none' as const,
          zIndex: 999,
          boxShadow: '0 12px 32px rgba(46,43,37,.34)',
          whiteSpace: 'nowrap' as const,
        }
      : undefined,

    /* ── Diet ───────────────────────────────────────────────────────────── */
    dietChips: DIETS.map((d) => ({
      key: d.id,
      label: dietWords[d.id] || d.label,
      style: (dietOn(d.id) ? PILL_ON : PILL_OFF) + 'flex:none;',
      toggle: () =>
        setState({ diets: dietOn(d.id) ? S.diets.filter((x) => x !== d.id) : S.diets.concat([d.id]) }),
    })),
    dietNote: S.diets.length ? vs('dietSome', '') : vs('dietNone', ''),
    toLocate: () => {
      go('locate', { locating: true, located: false });
      window.setTimeout(() => setState({ locating: false, located: true }), 1900);
    },

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
    liveShopLine: S.liveShops
      ? hs('liveShops', '{n} shops within walking distance, straight off OpenStreetMap', {
          n: S.liveShops.length,
        })
      : vs('looking', 'Looking for shops near you…'),
    useLocation: useMyLocation,

    /* ── Home ───────────────────────────────────────────────────────────── */
    greeting: word('evening', 'Evening'),
    streak: S.streak + ' ' + (HH.daysWord || 'days'),
    query: S.query,
    onQuery: (e: ChangeEvent<HTMLInputElement>) => setState({ query: e.target.value }),
    cravings: (P.cravings || CRAVINGS).map((label) => ({
      key: label,
      label,
      style:
        (S.query.toLowerCase() === label.toLowerCase() ? PILL_ON : PILL_OFF) +
        'font-size:13.5px;padding:10px 15px;',
      pick: () => setState({ query: label }),
    })),
    servingsLabel: hs('forServings', 'for {n} servings', { n: 2 }),
    budgetChips: [3, 5, 6, 8, 12]
      .map((b) => ({
        key: String(b),
        label: fmt(b),
        style:
          (S.budget === b && !S.budgetOtherOpen ? PILL_ON : PILL_OFF) +
          'flex:none;min-width:64px;text-align:center;justify-content:center;',
        pick: () => setState({ budget: b, budgetOtherOpen: false }),
      }))
      .concat([
        {
          key: 'other',
          label: HH.otherChip || 'Other',
          style: (S.budgetOtherOpen ? PILL_ON : PILL_OFF) + 'flex:none;',
          pick: () => setState({ budgetOtherOpen: !S.budgetOtherOpen }),
        },
      ]),
    budgetOtherOpen: S.budgetOtherOpen,
    budgetDraft: S.budgetDraft,
    symbol: c.sym,
    onBudgetDraft: (e: ChangeEvent<HTMLInputElement>) => setState({ budgetDraft: e.target.value }),
    commitBudget: () => {
      const v = parseFloat(S.budgetDraft);
      if (v > 0) setState({ budget: v / (c.idx * c.fx), budgetOtherOpen: false, budgetDraft: '' });
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
      style: (S.maxTime === t.m ? PILL_ON : PILL_OFF) + 'flex:none;',
      pick: () => setState({ maxTime: t.m }),
    })),
    searchCta: S.query ? hs('findMe', 'Find me {q}', { q: S.query.toLowerCase() }) : T.homeGo,
    search: () => go('results', { pickId: ranked()[0].id, showMicro: false }),
    decideForMe: () => {
      const pool = ranked();
      go('results', {
        pickId: pool[Math.floor(Math.random() * Math.min(3, pool.length))].id,
        query: '',
        showMicro: false,
      });
    },
    pantryLine: hs('inKitchen', '{n} things already in your kitchen', { n: STAPLES.length + PERISH.length }),
    pantryNudge: vs('nudge', 'Beansprouts and coriander want using in the next 3 days'),

    /* ── Results ────────────────────────────────────────────────────────── */
    isCopycat: !!recipe.copycat,
    copycatOf: recipe.copycat || '',
    dishName: dish(recipe),
    dishLocal: P.lo[recipe.id] || recipe.local,
    dishCuisine: cuisineWord(recipe.cuisine),
    dishPic: recipe.pic,
    priceTotal: fmt(buy),
    priceSub: word('toBuyFor', 'to buy, for') + ' ' + recipe.servings + ' ' + word('servings', 'servings'),
    pricePer: fmt(per),
    budgetLabel: fmt(S.budget),
    timeLabel:
      S.maxTime === 999 ? R.noRush : R.underMins + ' ' + S.maxTime + ' ' + word('minutes', 'min'),
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
    savingLine: recipe.copycat
      ? recipe.copycat +
        ' ' +
        X.anOrderOf +
        ' ' +
        fmt(recipe.restaurant) +
        ' ' +
        X.forEight +
        ' ' +
        fmt(buy) +
        ', ' +
        X.andYouKeep +
        ' ' +
        fmt(recipe.restaurant - per) +
        ' ' +
        X.aPortion
      : X.youKeep +
        ' ' +
        fmt(recipe.restaurant - per) +
        ' ' +
        X.everyTime +
        ' ' +
        X.fourTimes +
        ' ' +
        fmt((recipe.restaurant - per) * 4) +
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
          ' · ' +
          Math.round(a.per.protein) +
          'g ' +
          word('protein', 'protein'),
        price: fmt(toBuy(a) / a.servings),
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
        price: fmt(t),
        meta:
          s.km +
          ' km · ' +
          (s.real ? s.closes || SH.hoursUnknown : SH.openTill + ' ' + s.closes),
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
      const owned = recipe.have.indexOf(i.n.split(',')[0]) >= 0;
      const key = refOf(i.n);
      const seen = S.medians[key];
      // A community median beats the model, so when there is one it is what
      // the line costs — and the dot turns green to say why.
      const grams = gramsOf(i.g);
      const community = seen && grams ? (seen.median_per_kg * grams) / 1000 : null;
      return {
        key: i.n,
        ref: key,
        name: foodName(i.n),
        community: seen
          ? { reports: seen.reports, newest: seen.newest.slice(0, 10), amount: community }
          : null,
        openReport: () =>
          setState({
            reportFor: key,
            reportPrice: '',
            reportPack: grams ? String(grams) : '',
          }),
        tick: owned ? '✓' : '',
        boxBg: owned ? '#8fa073' : '#eee7db',
        nameFg: owned ? '#82796a' : '#201e1d',
        strike: owned ? 'line-through' : 'none',
        sub: owned
          ? word('already', 'already in your kitchen')
          : i.g + (i.opt ? ' · ' + word('optional', 'optional') : ''),
        srcColor: seen
          ? '#56633f'
          : i.src === 'local'
            ? '#728157'
            : i.src === 'euro'
              ? '#f6a06b'
              : '#c0b6a5',
        price: owned ? fmt(0) : community != null ? fmt(community) : fmt(i.s * mult),
        priceFg: owned ? '#a19786' : '#201e1d',
      };
    }),
    shopSubLine: stores.length + ' ' + SH.shopSub + ' ' + cityNow + '. ' + SH.sameBasket,
    listSummary:
      recipe.items.length -
      recipe.have.length +
      ' ' +
      word('toBuy', 'to buy') +
      ' · ' +
      recipe.have.length +
      ' ' +
      word('youHave', 'you have'),
    basketTotal: fmt(buyReal),
    savedLine: fill(SL.saved, { a: fmt(saved), b: fmt(saved * 9) }),

    /* ── Reporting a real price ─────────────────────────────────────────── */
    reportOpen: !!S.reportFor,
    reportItemName: (() => {
      const item = recipe.items.find((i) => refOf(i.n) === S.reportFor);
      return item ? foodName(item.n) : '';
    })(),
    reportPriceValue: S.reportPrice,
    reportPackValue: S.reportPack,
    reportBusy: S.reportBusy,
    canReport: cloudEnabled && !!auth.userId,
    onReportPrice: (e: ChangeEvent<HTMLInputElement>) => setState({ reportPrice: e.target.value }),
    onReportPack: (e: ChangeEvent<HTMLInputElement>) => setState({ reportPack: e.target.value }),
    closeReport: () => setState({ reportFor: null }),
    submitReport: async () => {
      const price = parseFloat(S.reportPrice);
      const pack = parseFloat(S.reportPack);
      if (!auth.userId || !S.reportFor || !(price > 0) || !(pack > 0)) return;
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
      }
    },
    honestyLine: fill(c.tier === 'local' ? SL.measured : SL.modelled, { c: countryName }),
    toCook: () => go('cook', { step: 0, timerRun: false, timerLeft: 0 }),

    /* ── Cook ───────────────────────────────────────────────────────────── */
    stepNo: S.step + 1,
    stepCount: S.step + 1 + ' ' + word('stepOf', 'of') + ' ' + recipe.method.length,
    cookPct: Math.round(((S.step + 1) / recipe.method.length) * 100) + '%',
    stepText: recipe.method[S.step]?.text || '',
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
      if (S.step >= recipe.method.length - 1)
        return go('after', { waste: null, shrink: null, reminded: false });
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
      pick: () => setState({ waste: x.k }),
    })),
    wasteHeadline: w ? w.head : '',
    wasteBody: w ? w.body : '',
    resetWaste: () => setState({ waste: null, shrink: null }),
    keepBg: recipe.keeps ? '#e1eecc' : '#eee7db',
    keepIconBg: recipe.keeps ? '#8fa073' : '#c0b6a5',
    keepIcon: recipe.keeps ? '✓' : '✕',
    keepFg: recipe.keeps ? '#3d472b' : '#645c50',
    keepTitle: (food.keepText(lg, recipe.id) || [recipe.keepTitle, recipe.keepBody])[0],
    keepBody: (food.keepText(lg, recipe.id) || [recipe.keepTitle, recipe.keepBody])[1],
    canRemind: recipe.keeps && !S.reminded && S.waste !== 'none',
    remindCta: vs('remind', 'Nudge me at 12:30 tomorrow'),
    setReminder: () => {
      setState({ reminded: true });
      const line = vs('remindPing', 'Tomorrow 12:30 — {d} is still good.', { d: dish(recipe) });
      ping(line);
      // Signed in, this is a real notification tomorrow lunchtime rather than a
      // toast you can only see if the app is already open.
      if (auth.userId) {
        const due = new Date();
        due.setDate(due.getDate() + 1);
        due.setHours(12, 30, 0, 0);
        scheduleReminder({
          userId: auth.userId,
          title: 'Pantry',
          body: line,
          lang: lg,
          dueAt: due,
        });
      }
    },
    offerShrink: !!w && w.pct > 0 && S.shrink === null,
    shrinkTitle: w && w.pct >= 40 ? vs('shrinkBig', '') : vs('shrinkSmall', ''),
    shrinkBody: w ? vs('shrinkBody', 'Same dish, smaller pan. Saves about {a} a cook.', { a: fmt(shrinkSave) }) : '',
    acceptShrink: () => {
      setState({ shrink: true, streak: S.streak + 1 });
      ping(vs('shrinkPing', 'Portion trimmed. Next {d} is sized for what you actually eat.', { d: dish(recipe) }));
    },
    declineShrink: () => setState({ shrink: false }),
    shrinkDone: S.shrink !== null,
    shrinkDoneText: S.shrink ? vs('shrinkYesText', '') : vs('shrinkNoText', ''),
    streakBig: S.streak + ' ' + word('daysRunning', 'days running'),
    streakSub:
      w && w.pct === 0
        ? vs('streakClean', 'Nothing binned all week. That is roughly {a} saved.', { a: fmt(6.4) })
        : vs('streakKeep', 'Keep a clean plate tomorrow and it is a week.'),
    streakDots: (HH.week || ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((d, i) => ({
      key: i,
      label: d,
      bg: i < S.streak ? 'rgba(246,160,107,.9)' : 'rgba(245,234,216,.12)',
      fg: i < S.streak ? '#402310' : 'rgba(245,234,216,.45)',
    })),
    finishMeal: () => {
      logCook(recipe, S.waste);
      go('home');
    },

    /* ── Kitchen ────────────────────────────────────────────────────────── */
    goingOffLabel: word('goingOff', 'going off soon'),
    cupboardLabel: word('cupboard', 'cupboard stock'),
    keepsMonthsLabel: word('keepsMonths', 'Keeps for months'),
    daysWord: word('days', 'DAYS'),
    useItLabel: word('useIt', 'Use it'),
    scanLabel: word('scanReceipt', 'Scan a receipt to add more'),
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
    ofCountriesLabel: word('ofCountries', 'of 91 countries'),
    keptOutLabel: word('keptOut', 'kept out of takeaways'),
    countriesCooked: PASSPORT.length,
    totalSaved: fmt(287.4),
    passport: PASSPORT.slice()
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
    passportNudge: hs('passportNudge', '', { a: fmt(0.71) }),
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
    statsSaved: fmt(
      S.history.reduce(
        (a, x) => a + Math.max(0, (RECIPES.find((y) => y.id === x.id)?.restaurant || 9) * x.servings - x.spend),
        0,
      ),
    ),
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
      per: fmt(toBuy(x, 0.82) / x.servings),
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
      const want = S.planDays * S.planMeals;
      const offset = Math.floor(Math.random() * pool.length);
      const picks: string[] = [];
      for (let i = 0; i < want; i += 1) picks.push(pool[(offset + i) % pool.length].id);
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
          cuisineWord(r.cuisine) + ' · ' + r.total + ' ' + word('minutes', 'min') + ' · ' + diffWord(r.diff),
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
          const owned = r.have.indexOf(item.n.split(',')[0]) >= 0;
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
          if (r.have.indexOf(item.n.split(',')[0]) >= 0) continue;
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
      if (!auth.userId || !db || !S.plan.length) return;
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
        console.warn('savePlan', error?.message);
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
        return;
      }
      setState({ planSaved: true });
      ping(xt(lg, 'planSaved'));
    },

    /* ── Settings ───────────────────────────────────────────────────────── */
    kitchenSub: X.kitchenSub,
    nudgesLabel: X.nudges,
    insteadLabel: X.insteadOf,
    twoOthersLabel: X.twoOthers,
    skillSummary:
      word('skillIs', 'Skill') +
      ': ' +
      skillWords[lvl].charAt(0).toUpperCase() +
      skillWords[lvl].slice(1) +
      '.',
    timeSummary:
      word('timeIs', 'Time') +
      ': ' +
      word('upTo', 'up to') +
      ' ' +
      timeLevel() +
      ' ' +
      word('minutesNormal', 'minutes on a normal day') +
      '. ' +
      Object.keys(S.skill).length +
      ' ' +
      word('ofThem', 'of') +
      ' ' +
      SKILL_CARDS.length +
      ' ' +
      word('cardsPlaced', 'technique cards placed') +
      '.',
    redoTier: () => go('tier', { tierStep: 0 }),
    toggles: [
      { k: 'leftover', label: X.leftoverN, sub: X.leftoverS },
      { k: 'shrink', label: X.shrinkN, sub: X.shrinkS },
      { k: 'shop', label: X.shopN, sub: X.shopS },
    ].map((t) => ({
      key: t.k,
      label: t.label,
      sub: t.sub,
      trackBg: S.toggles[t.k] ? '#8fa073' : '#dcd3c4',
      knobX: S.toggles[t.k] ? '23px' : '3px',
      flip: () => setState({ toggles: { ...S.toggles, [t.k]: !S.toggles[t.k] } }),
    })),
    restart: () => {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch {
        /* nothing to clear */
      }
      setS({ ...INITIAL, lang: S.lang });
    },
    langNative: i18n.nativeOf(lg),
    langOpen: S.langOpen,
    toggleLang: () => setState({ langOpen: !S.langOpen }),
    langOptions: i18n.LANGS.map((l) => ({
      key: l.code,
      native: l.native,
      style: (lg === l.code ? PILL_ON : PILL_OFF) + 'flex:none;font-size:14.5px;padding:11px 18px;',
      pick: () => setState({ lang: l.code, langOpen: false }),
    })),
    vendorDraft: S.vendorDraft,
    onVendorDraft: (e: ChangeEvent<HTMLInputElement>) => setState({ vendorDraft: e.target.value }),
    saveVendor: async () => {
      setState({ vendorKey: S.vendorDraft });
      const L = await live();
      L.setVendorKey(S.vendorDraft);
      ping(S.vendorDraft ? vs('keyOn', 'Key saved.') : vs('keyOff', 'Key cleared.'));
    },
    sources: SOURCES.map((s, n) => ({ ...s, key: s.name, use: P.us[n] || s.use })),

    /* ── Copy that appears on more than one screen ──────────────────────── */
    t: T,
    u: U,

    /* Copy added after the handoff — English until translated. */
    xt: (k: string) => xt(lg, k),

    /* ── The account ─────────────────────────────────────────────────────── */
    cloudEnabled,
    authStatus: auth.status,
    authError: auth.error,
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
