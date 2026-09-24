# Jev inside the app

`scripts/jev/` asks TypeSafe's **Jev** decision model (`typesafe/jev-1.13` on OpenRouter) for second opinions *about* the app, offline, as reports. This is the other half: Jev asked *from inside* the app, for three small decisions a person is making right now, through a Supabase Edge Function that holds the key.

It is **off by default**. A build without `VITE_JEV=1` does not contain the client at all: the bundler folds it away, no request is made, and no new element is rendered. The browser proof below checks that DOM and requests are identical to the commit before this work.

## What it does

| where | the user does | Jev is asked (fixed questions, server side) | the app then |
|---|---|---|---|
| **Tonight**, the "Something else in mind?" box | types a note the cookbook's own matcher cannot match as a whole phrase ("something cosy and quick", "somethin cosy n quick, itallian", "algo rápido y barato") | one `choice` of cuisine (the cookbook's 37 cuisines + `none_or_unclear`) and one `noul` per intent: quick, cheap, comforting, light, high_protein, spicy, vegetarian_leaning | uses the fields that already exist. Cuisine goes into the query, which already narrows Tonight to it. Quick moves the time chip to 30 min. Cheap moves the money chip down one preset. The other intents become a small lean inside `ranked()`'s existing score (light and high protein reuse the goal terms). A green chip under the box says what it read ("Read as Quick · Comforting · Italian") and has **Undo**, which puts back the text, the time, the money and the flags. |
| **Kitchen**, a new "Check an item" field (shown only in a Jev build, and only when a diet is set: the Kitchen had no free-text entry before) | types a cupboard item ("Worcestershire sauce") | one `noul` per diet the app offers: "would this item, as normally bought, break *diet*?", worded like `scripts/jev/check-diets.mjs` DEFS | shows the app's own cautions first (the same rules `lib/diets.ts` and `lib/diet-audit.js` apply to recipes). If Jev puts P(breaks) ≥ 0.5 on a diet you keep that those rules did not flag, it **adds** "Vegan: Worcestershire sauce is often made with something this rules out. Check the label." |
| **Shop**, the "Saw a different price?" form (signed in) | enters a price for a pack | `noul` *plausible*, plus a `choice` of likely mistake: none, wrong_currency, extra_zero_or_decimal_slip, per_kg_vs_pack, wrong_item, other. State: item, amount, currency, country, pack grams, and the app's modelled local price for that pack | if *plausible* < 0.2, or a named mistake has confidence > 0.8, it asks once before sending: "That is about 100× the usual price here (£0.40 for 160 g). Did you mean £0.40?" with **Use £0.40**, **It is right — send it** and **Let me fix it**. It never refuses a price and never changes one without a tap. |

Every string is in all six languages (`src/data/extra-copy.ts` and `src/data/lang/*.ts`, `jev*` keys), and the parity test holds them to that.

When is Tonight's box sent to Jev? Only when **no dish name, cuisine, local name or copycat matches the whole phrase**, 700 ms after the last keystroke, at most once per distinct text (answers are cached for the visit). "pasta", "pad thai" and "Italian" never reach Jev, because the app already knows them. "something cosy and quick" does: today's matcher answers it word by word, and every dish with "and" in its name counts as a match.

## The fail-safe rule

**The app's own rules stay authoritative. Jev may only add a caution, never remove, soften or reorder one.**

- Diets: `itemCautions(appFlags, jev, diets)` in `src/lib/jev-diet.ts` starts from the app's own flags and only looks at Jev's answers for diets those flags do not cover. There is no code path from a Jev answer to fewer cautions. `src/lib/jev-maps.test.ts` holds this as a property over 3,000 random items, diet sets and answers (including `null`, 0 and missing values): the app's cautions always come back first, in order, unchanged, and anything added is Jev's, for a diet you keep, at or over the threshold. The browser proof checks it live too: with Jev answering 0.02 for everything, "bacon" still shows "Vegan: bacon breaks this setting."
- Craving leans sit *inside* `ranked()`'s score, below its two partitions: a dish that breaks your diet still cannot outrank one that keeps it. A cuisine that Jev wrote into the box does not get the "you typed it by name" pass over the time budget, so "quick Italian" is quick.
- Price reports: Jev can only cause a question, never a refusal. With no answer, nothing is asked.
- Every failure is `null`, and `null` means "carry on exactly as before": flag off, no project, network down, 1.5 s passed, 4xx/5xx, a malformed answer. `decide()` never throws.

## Turning it on

```sh
# 1. The key lives in the function's secrets and nowhere else.
supabase secrets set OPENROUTER_API_KEY=<your-openrouter-key>   # never in a VITE_* variable, never in a file

# 2. Which pages may call it. Exact origins; `*` matches one DNS label.
supabase secrets set ALLOWED_ORIGINS="https://pantryglobe.com,https://www.pantryglobe.com,http://localhost:5173,https://*--pantryglobe.netlify.app"

# Optional abuse limits (defaults shown; the cap is off unless set).
supabase secrets set RATE_BURST=10 RATE_PER_MINUTE=20 DAILY_CALL_CAP=5000

# 3. Deploy.
supabase functions deploy jev-decide

# 4. Build the site with the flag, against the same project.
VITE_SUPABASE_URL=https://<project>.supabase.co VITE_SUPABASE_ANON_KEY=<anon key> VITE_JEV=1 npm run build
```

On Netlify, set `VITE_JEV=1` next to the two `VITE_SUPABASE_*` variables in the site's environment settings and redeploy.

**`ALLOWED_ORIGINS`**:
- `https://pantryglobe.com` and `https://www.pantryglobe.com` are two different origins. List both if both serve the app.
- `http://localhost:5173` is the Vite dev server. The port is part of the origin, so `vite preview` (4173) needs its own entry.
- Netlify deploy previews look like `https://deploy-preview-42--<site>.netlify.app`. Allow them with `https://*--<site>.netlify.app`. **Do not use `https://*.netlify.app`**: that allows every Netlify site on the internet to spend your key.
- Empty or unset means nothing is allowed, so a function deployed before it is configured does nothing. A request with no `Origin` header is refused too.
- CORS only stops browsers. A script can send any `Origin` it likes, which is why the rate limit, the cap and the key's own credit limit exist.

**JWT verification.** The client calls the function with the public anon key in `Authorization`, like every other Supabase call the app makes, so the default `verify_jwt = true` works with legacy anon JWTs. If the project uses the newer `sb_publishable_…` keys, deploy with `supabase functions deploy jev-decide --no-verify-jwt`. The function does not need a user and checks origin, rate and shape itself.

**Put a credit limit on the OpenRouter key** (openrouter.ai → Keys → limit). This is the only cap that holds across every instance, restart and forged header.

## What the function will and will not do

`supabase/functions/jev-decide/index.ts` is a thin Deno shell. Everything else is in `templates.ts`, which is pure TypeScript that vitest imports (`src/lib/jev-function.test.ts`).

- **Not an open proxy.** The client sends `{ task, input, lang }`. `task` must be one of the three. The questions, their wording, the choice labels and the model are fixed in `templates.ts`. Any other field in the body (`questions`, `model`, anything) is ignored. The user's words only ever go into `state`, and every question tells Jev to treat them as text to judge, never as instructions.
- **Validation.**
  - Free text: 200 characters or fewer, with control and bidi-override characters stripped.
  - `lang`: one of en/es/fr/pl/ur/ar.
  - Price reports: typed fields with the database's own bounds. Amount is above 0 and at most 10000. Currency is `^[A-Z]{3}$` and country is `^[A-Z]{2}$`. Pack is a whole number of grams from 1 to 50000. The modelled price is above 0.
  - The whole body is 2 KB or less.
  - A refusal carries a short reason (`bad_lang`, `input_too_long`, …) and never echoes the input.
- **Rate limit.** A token bucket per client IP, 10 burst and 20 a minute by default. It is held in the instance's memory, so it **resets on every cold start, redeploy or new instance**. It bounds a burst from one address, not a day. The IP comes from `cf-connecting-ip`, or else the first `x-forwarded-for` hop, which a caller can forge.
- **Daily cap.** `DAILY_CALL_CAP` counts upstream calls per UTC day, **per instance**, so it resets for the same reasons. The key's credit limit is the real ceiling.
- **Timeout.** 1500 ms hard limit on the call to Jev, body included (`504 timeout`).
- **No leaks.** On success the response is `{ ok: true, task, answers, confidence, ms }` with typed, normalised answers. Otherwise it is `{ ok: false, reason }`. An upstream error body or header is never passed on. An upstream status is logged only as its class (`upstream_4xx`, `upstream_5xx`, `upstream_429`). The key is only ever in the `Authorization` header to openrouter.ai. Tests check that none of these reach the response or the log.
- **The answer envelope is unconfirmed.** The response parser is `findAnswers()` from `scripts/jev/lib.mjs`, ported as-is: it tries `answers`, `results`, `decisions`, `outputs`, `output`, `data.answers`, `data`, then the top level. It also accepts arrays of `{name, answer}`. A response with nothing readable in it is `502 unreadable`, never a guess. Before switching this on for users, do a tiny live run of the offline harness (`node scripts/jev/run.mjs diets --limit=3 --max-usd=0.02`) and read `jev-results/raw-first-response.json`.

## Cost per 1,000 uses

Jev bills $0.042 per million input tokens, and output is free. These estimates come from `estimateTokens()`, which uses the same deliberately high rule as the offline harness: characters ÷ 3.2, plus 80 tokens a question, plus 60. They are computed on the real request bodies `buildRequest()` makes:

| task | questions | request size | est. input tokens | est. cost per 1,000 calls |
|---|---|---|---|---|
| craving | 1 choice (38 labels) + 7 nouls | ~8.6 KB | ~3,400 | **~$0.14** |
| pantry_item | 9 nouls | ~8.7 KB | ~3,500 | **~$0.15** |
| price_report | 1 noul + 1 choice | ~2.2 KB | ~920 | **~$0.04** |

A thousand people using all three once each is about **$0.33**. Cravings are only sent for text the cookbook cannot match as a whole phrase. Answers are cached per visit, and the Kitchen check only runs on a tap. So real use sits well under one call per visit.

Supabase Edge Functions include 500,000 invocations a month on the free plan, and charge about $2 per million beyond that on paid plans. At these volumes that cost is also negligible.

## Latency

- Jev itself: about 0.4–1 s per call (all questions in one request are evaluated in parallel).
- Edge function hop: typically 50–200 ms on top.
- Hard stops: the function gives up on Jev at 1500 ms, and the client gives up on the function at 1500 ms (AbortController). The client's clock includes the hop, so an unusually slow Jev call is simply abandoned.
- Tonight's box waits 700 ms after the last keystroke before asking. The answer is thrown away if you have typed since or left the screen.
- Nothing waits for Jev. The dish on Tonight, the Kitchen and the price form all work at once, and Jev's answer adjusts them when it arrives. If the answer is late, nothing changes (the browser proof holds a 2 s response and checks that nothing moved).

## Turning it off

Any one of these works. The first is the cleanest.

1. **Build without `VITE_JEV`** (remove the variable on Netlify and redeploy). The client code is not in the bundle, nothing new renders, and nothing is sent.
2. `supabase secrets unset OPENROUTER_API_KEY` or set `ALLOWED_ORIGINS=""`. The function then answers every call with `{ ok: false }`, which the client reads as null, and the site behaves as it did before Jev.
3. `supabase functions delete jev-decide`. Same effect: every call fails and every failure is null.

## Tests and proof

- `src/lib/jev-function.test.ts` tests the function without Deno:
  - the templates: cuisine and diet lists equal the cookbook's, and user text never appears in an instruction
  - validation, including every refusal reason and extra client fields being ignored
  - envelope parsing
  - CORS: exact origins, wildcard previews, lookalike hosts, missing origin and preflight
  - the per-IP token bucket and its refill
  - the 1500 ms timeout
  - upstream error bodies, headers and the key never reaching the response or the log
  - the daily cap
- `src/lib/jev.test.ts` tests the client:
  - it is off without the flag or without a project, and off makes no request
  - it gives up at 1500 ms
  - every failure is null and it never throws
  - it caches answers, and a failure is asked again next time
- `src/lib/jev-maps.test.ts` covers the three mappings, including the fail-safe property test.
- `npx -y deno check supabase/functions/jev-decide/index.ts` passes.
- Browser proof (`scripts/jev/in-app-proof/`; the recipe is at the top of `proof.mjs`), in Playwright at 402×874 with the function intercepted by `page.route` and no network:
  - the craving chip changes the offer
  - Undo restores the text, the time and the money
  - a misspelt cuisine gives an Italian dish of 30 minutes or less
  - a 2 s answer is ignored
  - the Worcestershire sauce caution appears for a vegan
  - the bacon caution survives Jev saying "fine"
  - a 100× price gets the confirm step, and "send it" still sends it
  - with the flag off, the DOM and the requests on Home, Kitchen and the price form are identical to the previous commit, both with and without a Supabase project configured
- The built bundle contains neither `sk-or` nor `openrouter.ai`, whichever way it was built.

## Before switching it on for real users

- **Privacy page.** With the flag on, text typed into the craving box and the Kitchen check, and the fields of a price report, go to this project's Supabase function and on to OpenRouter / TypeSafe. `privOthersB` in the six language files does not say so yet. Update it in the same release that sets `VITE_JEV=1`.
- **Envelope.** Do the tiny live run described above and confirm that `findAnswers()` reads the real response.
