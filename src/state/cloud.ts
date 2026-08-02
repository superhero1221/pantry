import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { cloudEnabled, getDb } from '../lib/supabase';
import type { HistoryRow } from '../data/types';

/* ── Session ──────────────────────────────────────────────────────────────
   Signing in is optional and reversible. Signed out, nothing here runs and
   the app is exactly what it was: local, and nothing leaves the device. */

export type AuthStatus = 'off' | 'loading' | 'out' | 'sent' | 'in' | 'error';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(cloudEnabled ? 'loading' : 'off');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cloudEnabled) return;
    let unsubscribe = () => {};
    getDb().then((db) => {
      if (!db) return;
      db.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setStatus(data.session ? 'in' : 'out');
      });
      const { data: sub } = db.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setStatus(next ? 'in' : 'out');
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string) => {
    setStatus('loading');
    setError(null);
    // No client means the SDK never arrived, which means no network. Say so
    // rather than dropping the button back to its resting state in silence.
    const db = await getDb();
    if (!db) {
      setStatus('error');
      return;
    }
    const { error: err } = await db.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }, []);

  const signOut = useCallback(async () => {
    const db = await getDb();
    if (!db) return;
    await db.auth.signOut();
    setStatus('out');
  }, []);

  return { session, status, error, signIn, signOut, userId: session?.user.id ?? null,
           email: session?.user.email ?? null };
}

/* ── What the account carries ─────────────────────────────────────────── */

export interface CloudProfile {
  goal: string | null;
  language: string;
  max_time: number;
  budget_amount: number;
  streak: number;
  country: string;
  diets: string[];
  skill_cards: Record<string, string>;
  time_cards: Record<string, string>;
  learned: Record<string, string>;
  dismissed: Record<string, boolean>;
  nudges: Record<string, boolean>;
  onboarded: boolean;
  skill: number;
}

export async function pullProfile(userId: string): Promise<CloudProfile | null> {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db
    .from('profiles')
    .select(
      'goal, language, max_time, budget_amount, streak, country, diets, skill_cards, time_cards, learned, dismissed, nudges, onboarded, skill',
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('pullProfile', error.message);
    return null;
  }
  return (data as CloudProfile) ?? null;
}

export async function pushProfile(userId: string, p: Partial<CloudProfile>) {
  const db = await getDb();
  if (!db) return;
  const { error } = await db.from('profiles').upsert({ id: userId, ...p });
  if (error) console.warn('pushProfile', error.message);
}

/* ── The cook log ─────────────────────────────────────────────────────────
   Only real cooks travel. The eight weeks of history the app ships with are
   sample data to make the Stats screen legible before you have cooked
   anything, and writing those into someone's account would be a lie. */

export interface LocalCook extends HistoryRow {
  clientId?: string;
  seeded?: boolean;
}

const toRow = (userId: string, c: LocalCook) => ({
  user_id: userId,
  client_id: c.clientId,
  recipe_id: c.id,
  name: c.name,
  country_code: c.code,
  cuisine: c.cuisine,
  spend: Number(c.spend.toFixed(2)),
  servings: c.servings,
  kcal: Math.round(c.kcal),
  protein: Math.round(c.protein),
  carb: Math.round(c.carb),
  difficulty: c.diff,
  waste: c.waste,
  cooked_at: new Date(c.at).toISOString(),
});

const DAY = 864e5;

const fromRow = (r: Record<string, unknown>): LocalCook => {
  const at = new Date(r.cooked_at as string).getTime();
  return {
    clientId: (r.client_id as string) ?? (r.id as string),
    id: r.recipe_id as string,
    name: r.name as string,
    code: (r.country_code as string) ?? '',
    cuisine: (r.cuisine as string) ?? '',
    spend: Number(r.spend ?? 0),
    servings: Number(r.servings ?? 2),
    kcal: Number(r.kcal ?? 0),
    protein: Number(r.protein ?? 0),
    carb: Number(r.carb ?? 0),
    diff: Number(r.difficulty ?? 1),
    waste: Number(r.waste ?? 0),
    at,
    ago: Math.max(0, Math.floor((Date.now() - at) / DAY)),
  };
};

export async function pullCooks(userId: string): Promise<LocalCook[]> {
  const db = await getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('cook_log')
    .select('*')
    .eq('user_id', userId)
    .order('cooked_at', { ascending: false })
    .limit(500);
  if (error) {
    console.warn('pullCooks', error.message);
    return [];
  }
  return (data ?? []).map(fromRow);
}

export async function pushCooks(userId: string, cooks: LocalCook[]) {
  const real = cooks.filter((c) => !c.seeded && c.clientId);
  if (!real.length) return;
  const db = await getDb();
  if (!db) return;
  const { error } = await db
    .from('cook_log')
    .upsert(real.map((c) => toRow(userId, c)), { onConflict: 'user_id,client_id' });
  if (error) console.warn('pushCooks', error.message);
}

/* ── Community prices ─────────────────────────────────────────────────── */

export interface PriceMedian {
  ref: string;
  currency: string;
  median_per_kg: number;
  reports: number;
  newest: string;
}

export async function priceMedians(refs: string[], country: string) {
  if (!refs.length) return {} as Record<string, PriceMedian>;
  const db = await getDb();
  if (!db) return {} as Record<string, PriceMedian>;
  const { data, error } = await db.rpc('price_medians', { refs, in_country: country });
  if (error) {
    console.warn('priceMedians', error.message);
    return {} as Record<string, PriceMedian>;
  }
  const out: Record<string, PriceMedian> = {};
  for (const row of (data ?? []) as PriceMedian[]) out[row.ref] = row;
  return out;
}

export async function reportPrice(input: {
  userId: string;
  ref: string;
  price: number;
  currency: string;
  packGrams: number;
  storeName?: string;
  storeTier?: string;
  country: string;
}) {
  const db = await getDb();
  if (!db) return { ok: false, error: 'Not connected' };
  const { error } = await db.from('price_reports').insert({
    user_id: input.userId,
    ref: input.ref,
    price: input.price,
    currency: input.currency,
    pack_grams: input.packGrams,
    store_name: input.storeName ?? null,
    store_tier: input.storeTier ?? null,
    country: input.country,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ── Reminders ────────────────────────────────────────────────────────── */

export async function scheduleReminder(input: {
  userId: string;
  title: string;
  body: string;
  lang: string;
  dueAt: Date;
  kind?: string;
}) {
  const db = await getDb();
  if (!db) return { ok: false };
  const { error } = await db.from('reminders').insert({
    user_id: input.userId,
    kind: input.kind ?? 'leftover',
    title: input.title,
    body: input.body,
    lang: input.lang,
    due_at: input.dueAt.toISOString(),
  });
  if (error) console.warn('scheduleReminder', error.message);
  return { ok: !error };
}

/** Fire `fn` at most once per `ms`, trailing — used to keep writes off the keystroke path. */
export function useThrottled<T>(fn: (value: T) => void, ms: number) {
  const latest = useRef<T | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const target = useRef(fn);
  target.current = fn;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (value: T) => {
      latest.current = value;
      if (timer.current) return;
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        if (latest.current !== null) target.current(latest.current);
      }, ms);
    },
    [ms],
  );
}
