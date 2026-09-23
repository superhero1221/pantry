import { createElement, lazy, useSyncExternalStore, type ComponentType } from 'react';
import type { Pantry } from './state/usePantry';

/* The fifteen screens that are not in the first chunk, and the means to fetch
   one before anybody walks to it.

   A bare React.lazy suspends on its first render however fast the chunk comes,
   and React 19 then holds the fallback for at least 300ms — so every first
   visit to a tab was a third of a second of empty page, even from the worker's
   cache. Warmed with preload() first, a screen here renders its component
   straight away and never suspends at all. Walked to before its chunk is here,
   it draws nothing until the chunk lands and then draws itself, which is the
   fetch and no more: nothing suspends, so there is no 300ms floor either.

   Out of App.tsx so that file exports only components, which is what keeps
   Fast Refresh working on it in dev. */

type Props = { v: Pantry };
export type SplitScreen = ComponentType<Props> & { preload: () => Promise<unknown> };

function split(load: () => Promise<ComponentType<Props>>): SplitScreen {
  /* What a render can see: the component, 'lost' if its fetch failed, or null
     while nothing has come back yet. Changed only by the fetch settling, and
     every mounted wrapper is told when it does. */
  let now: ComponentType<Props> | 'lost' | null = null;
  let pending: Promise<ComponentType<Props>> | null = null;
  const heard = new Set<() => void>();
  const settle = (next: typeof now) => {
    now = next;
    heard.forEach((f) => f());
  };
  const listen = (f: () => void) => {
    heard.add(f);
    return () => void heard.delete(f);
  };
  /* A failed preload forgets itself, so the next attempt fetches again rather
     than replaying the old failure. */
  const preload = () =>
    (pending ??= load().then(
      (C) => (settle(C), C),
      (e) => {
        pending = null;
        if (now !== 'lost') settle('lost');
        throw e;
      },
    ));
  /* Only for a fetch that failed. It imports again, as the app always did,
     and a second failure is thrown into the Boundary and the crash net
     exactly as before. */
  const Lazy = lazy(() => preload().then((C) => ({ default: C })));
  /* Once a screen has rendered through Lazy it stays on Lazy. Switching to
     the bare component later would be a different element type in the same
     place, and React would remount it — on Cook, mid-recipe, that throws
     away focus for nothing. */
  let viaLazy = false;
  const S = ((p: Props) => {
    const got = useSyncExternalStore(listen, () => now);
    if (got === 'lost' || viaLazy) {
      viaLazy = true;
      return <Lazy {...p} />;
    }
    if (got) return createElement(got, p);
    preload().catch(() => {});
    return null;
  }) as SplitScreen;
  S.preload = preload;
  return S;
}

/* Written out longhand rather than generated from a map, because a bundler
   can only split what it can see statically. */
export const After = split(() => import('./screens/After').then((m) => m.After));
export const Browse = split(() => import('./screens/Browse').then((m) => m.Browse));
export const Cook = split(() => import('./screens/Cook').then((m) => m.Cook));
export const Diet = split(() => import('./screens/Diet').then((m) => m.Diet));
export const Goal = split(() => import('./screens/Goal').then((m) => m.Goal));
export const Kitchen = split(() => import('./screens/Kitchen').then((m) => m.Kitchen));
export const Legal = split(() => import('./screens/Legal').then((m) => m.Legal));
export const Level = split(() => import('./screens/Level').then((m) => m.Level));
export const Locate = split(() => import('./screens/Locate').then((m) => m.Locate));
export const Passport = split(() => import('./screens/Passport').then((m) => m.Passport));
export const Plan = split(() => import('./screens/Plan').then((m) => m.Plan));
export const Results = split(() => import('./screens/Results').then((m) => m.Results));
export const Settings = split(() => import('./screens/Settings').then((m) => m.Settings));
export const Shop = split(() => import('./screens/Shop').then((m) => m.Shop));
export const Stats = split(() => import('./screens/Stats').then((m) => m.Stats));

/** Warm-up order: the setup first for someone who has not finished it,
 *  otherwise the tabs people actually walk to. */
export const WARM_SETUP: SplitScreen[] = [Goal, Level, Diet, Locate, Browse, Results, Shop, Cook, After, Kitchen, Passport, Settings, Plan, Stats, Legal];
export const WARM_TABS: SplitScreen[] = [Browse, Results, Shop, Cook, After, Kitchen, Passport, Settings, Plan, Stats, Legal, Goal, Level, Diet, Locate];

/* Every route that lands on one of these, aliases included — mirrors SCREENS
   and ALIASES in usePantry. Welcome and Home are in the first chunk already. */
const BY_HASH: Record<string, SplitScreen> = {
  after: After, browse: Browse, cook: Cook, diet: Diet, goal: Goal, kitchen: Kitchen,
  privacy: Legal, terms: Legal, tier: Level, locate: Locate, passport: Passport,
  plan: Plan, week: Plan, results: Results, settings: Settings, you: Settings,
  shop: Shop, stats: Stats,
};

/** The chunk for the screen in the address bar. Resolves either way: a
 *  failure is left for the real render to meet. */
export const warmFirst = (hash: string): Promise<unknown> =>
  BY_HASH[hash.replace(/^#\/?/, '').split('/')[0]]?.preload().catch(() => {}) ?? Promise.resolve();
