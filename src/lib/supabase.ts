import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional. With no keys configured the app runs exactly as it did
 * before — everything local, nothing sent anywhere — and every call site here
 * checks the client before reaching for it. That keeps `npm run dev` working
 * for anyone who clones this without credentials.
 *
 * The SDK is 207 kB of JavaScript and nothing it does works without a network,
 * so it is fetched on the first call that actually wants it — signing in,
 * syncing, reporting a price — rather than ahead of the first screen. Whether
 * the cloud exists at all is read off the keys, not off the client, so a
 * screen can ask that question without pulling the SDK in behind it.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const cloudEnabled = !!(url && key);

let client: SupabaseClient | null = null;
let pending: Promise<SupabaseClient | null> | null = null;

/** The client, once it has arrived. Null means no keys or no network — both of
 *  which every call site already reads as "stay local", which is why a failed
 *  fetch clears `pending` rather than latching the cloud off for the session. */
export function getDb(): Promise<SupabaseClient | null> {
  if (client) return Promise.resolve(client);
  if (!cloudEnabled) return Promise.resolve(null);
  if (!pending) {
    pending = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        client = createClient(url as string, key as string, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          },
        });
        return client;
      })
      .catch(() => {
        pending = null;
        return null;
      });
  }
  return pending;
}

/** VAPID public key for Web Push; without it the app never asks for permission. */
export const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
