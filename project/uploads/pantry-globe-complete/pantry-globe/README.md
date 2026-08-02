# Pantry Globe

Name a dish and a place. Get the shops that are actually open near you, an estimated
ingredient basket in local currency, the full macro **and** micronutrient breakdown, a
substitution engine that also rewrites the cooking method, and step-by-step instructions.

Works in any country.

## What's real vs estimated

| Layer | Source | Honest? |
|---|---|---|
| Nearby shops, type, distance | OpenStreetMap via Overpass, live | Real |
| Opening hours / open right now | OSM `opening_hours`, parsed | Real where mapped; shown as "unknown" where not |
| Geocoding | Nominatim | Real |
| Nutrition (macros + 8 micros) | Standard food-composition tables, bundled | Real |
| **Prices** | UK reference pack price x country cost index x store tier x FX | **Estimated** — there is no global retail price API |

Price estimation is labelled as such throughout the UI. The alternative would be
inventing precision that doesn't exist.

## Design notes

- **First-cook vs marginal cost.** Buying every pack for one butter chicken is ~4x what the
  dish actually consumes. That gap — spices, oil, a bag of rice — is the single biggest
  driver of "cooking is expensive", and it disappears on the second cook. Both numbers are
  always shown, plus a break-even count.
- **Pantry state.** Tap anything you already own; it drops out of the total and persists.
  This is the highest-leverage feature in the product, because a first-cook number is
  wrong by ~300% for anyone with a stocked cupboard.
- **Method deltas.** Every substitution carries the cooking changes it forces
  (`Breast overcooks: cut the simmer from 8 min to 4 min`). A substitution engine that
  changes ingredients but not method gives you dry chicken and you blame the recipe.
- **Absorption.** Deep-fry oil is priced in full (you buy the bottle) but only ~8% counts
  toward nutrition (you eat that much). Without this, falafel reads as 3,000 kcal.
- **Regional Overpass mirrors are excluded.** Instances like `overpass.osm.ch` answer HTTP 200
  with zero elements outside their region, which silently looks like "no shops here".
  Mirrors are raced in parallel and empty responses are treated as soft failures.

## Meal plans

Ask for N days at a calorie and protein target and it solves for it. This is a
constraint problem, not a language problem — a seeded hill-climb over the dish
pool, scored on **per-day** deviation rather than the weekly average. Averaging is
the tempting shortcut and it produces plans that read as correct in aggregate
while swinging 1,500 to 2,400 kcal day to day.

The plan's shopping list sums quantities **across every meal before** pack maths
is applied, so one bag of rice covers four dishes. That's typically a 40-45%
saving over shopping for the same meals one at a time, and it's a bigger lever
than choosing a cheaper supermarket.

When it can't hit your targets it says so and says why, rather than quietly
returning something that misses.

## The AI layer (optional, and off by default)

Everything above runs with no key, no account and no network beyond shop lookup.
The language layer adds only the two jobs a model is genuinely better at than
code: parsing a free-text request, and writing a dish that isn't in the menu.

- Bring your own OpenRouter key. It lives in your browser, is sent per request,
  and is never stored server-side or logged.
- Only free-tier models are listed. The list is fetched live and filtered to
  models that emit **text and nothing else** — OpenRouter's free tier also
  includes music and image models that would otherwise appear in a chat picker.
- A generated recipe is validated against the real ingredient table before use.
  Anything unpriceable is dropped and reported, so an invented dish can't fake
  its macros. The cooking steps themselves are the model's and are not verified,
  and the UI says so.

## Data

19 dishes, 136 ingredients, 60+ variants, 190+ method deltas.
`GET /api/selftest` validates every ingredient reference and returns computed nutrition
and basket costs per dish — run it after editing any data file.

## Stack

Next.js 15 (App Router) - TypeScript - Tailwind - no database, no API keys, installable as a PWA.

## Local

```bash
npm install
npm run dev
```
