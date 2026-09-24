// Pantry — a second opinion from Jev, asked from inside the app.
//
// POST { task, input, lang? } from the browser; answers with
// { ok: true, task, answers, confidence, ms } or { ok: false, reason }.
//
// Not an open proxy. The three tasks — 'craving', 'pantry_item',
// 'price_report' — each have fixed questions in templates.ts, and the client
// can only send the user's short input. Everything here is in templates.ts so
// vitest can test it without Deno; this file only hands it the environment and
// fetch. docs/JEV-IN-APP.md is the operator's guide.
//
// Secrets and settings it reads:
//   OPENROUTER_API_KEY — required. Never logged, never returned, never sent
//                        anywhere but openrouter.ai.
//   ALLOWED_ORIGINS    — required. Comma list, `*` matches one host label:
//                        https://pantryglobe.com,http://localhost:5173,https://*--pantryglobe.netlify.app
//   DAILY_CALL_CAP     — optional. Upstream calls per UTC day, per instance.
//   RATE_BURST, RATE_PER_MINUTE — optional. Per-IP token bucket (default 10, 20).
//
//   supabase secrets set OPENROUTER_API_KEY=... ALLOWED_ORIGINS=https://pantryglobe.com
//   supabase functions deploy jev-decide

import { createHandler } from './templates.ts';

const handle = createHandler({
  env: (k) => Deno.env.get(k),
  fetch: (url, init) => fetch(url, init),
  log: (line) => console.warn(line),
});

Deno.serve(handle);
