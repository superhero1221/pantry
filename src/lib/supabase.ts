import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional. With no keys configured the app runs exactly as it did
 * before — everything local, nothing sent anywhere — and every call site here
 * checks `db` before reaching for it. That keeps `npm run dev` working for
 * anyone who clones this without credentials.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const db: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null;

export const cloudEnabled = !!db;

/** VAPID public key for Web Push; without it the app never asks for permission. */
export const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
