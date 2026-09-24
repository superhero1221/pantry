/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_STANDALONE?: string;
  /** '1' turns on the Jev second opinions (src/lib/jev.ts). Needs the two above. */
  readonly VITE_JEV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
