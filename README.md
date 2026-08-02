# Pantry

An ADHD-first cooking app. Tell it what you fancy and what's in your pocket; it does the deciding.
One choice on screen at a time, priced where you actually stand, and it remembers what's already in
your cupboard.

Built from the Claude Design handoff in [`project/`](project/) — see
[`docs/HANDOFF.md`](docs/HANDOFF.md) for the original bundle notes and [`chats/`](chats/) for the
design conversation that produced it.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck, test, then production build into dist/
npm run test       # vitest
npm run preview
```

Runs with no configuration at all — everything local, nothing sent anywhere.
Copy `.env.example` to `.env.local` to switch on accounts, price reporting and
push; see [Server bits](#server-bits) for what each one needs.

## What's here

Fifteen screens, all client-side:

| Flow | Screens |
| --- | --- |
| Onboarding | Welcome → Goals → Tier list (skill, then time) → Diet → Location |
| Deciding | Tonight, Browse, Results |
| Doing | Shop, Cook, After |
| Planning | The week — days x meals, one shopping list |
| Keeping track | Kitchen, Stats, Passport, You |

The decisions behind them, from the design conversation:

- **Tier list** — S/A/B/C rows you drag technique cards into, then time cards. Skill is derived from
  what you have actually done rather than a self-rating. Drag works, or tap a card then tap a row.
- **Tonight** — craving box, budget chips with an Other field, time chips, one big button, and
  "I don't care — just pick one", because deciding is the expensive part.
- **Results** — four big macro numbers up front, micronutrients behind one tap, price per serving
  next to the takeaway price it replaces.
- **Copycat** — "Wingstop mango habanero" resolves to a baked-not-fried recipe with the price
  difference spelled out.
- **Shop** — three store tiers, same basket, three totals. Lines you already own are struck out at
  zero, with an honest note about which prices are measured and which are modelled.
- **Cook** — one step, 23px type, timers, and an "I've lost the thread" button that tells you what
  is on the hob.
- **After** — an optional photo of the plate, a waste read, the portion-shrink offer with your
  approval, the can-this-be-saved verdict, and the streak.
- **Stats** — eight weeks of spend, top dishes, difficulty spread, and the questions the log has
  earned the right to ask. Every answer becomes a card you can delete; nothing is inferred and acted
  on quietly.

## Accounts and sync

Optional and reversible. Signed out, the app is what it always was: local, and
nothing leaves the device. Signing in — email magic link, no password —
moves your goal, tier lists, diets, budget, language, cook log, streak and
cupboard into Postgres behind row-level security, so the same account works on
your phone and your laptop.

Local-first throughout. Sign in and whatever you already did on this device is
adopted, not overwritten: cooks logged before you had an account are pushed up
and merged by client id, so signing in twice cannot duplicate them. Profile
writes are throttled, so a burst of taps on the tier list is one round trip.

The eight weeks of sample cooks the app ships with are marked `seeded` and
**never** reach anyone's account — they exist so the Stats screen is legible
before you have cooked anything, and they step aside the moment there is a real
cook.

## Prices, for real this time

The design was honest that most of its basket is modelled rather than measured.
This is the path from one to the other: tap any line on the Shop screen, say
what it actually cost and what size the pack was, and everyone shopping in that
country gets a median instead of an estimate. Lines backed by real reports turn
their source dot green, show how many people reported and when, and the basket
total recomputes from them.

Reads go through a `security definer` function that returns aggregates only. A
plain select policy would expose who reported what and where they shop, which
is not something this app should hand out.

## The week

Days x meals a day x how many you're feeding, filled from the same ranking
Tonight uses — so your diets, your tier list and your goal all still apply,
just seven times over. Swap any meal you don't fancy. The shopping list is the
union of every dish scaled to your servings, with anything already in your
cupboard struck out at zero, and a per-day figure next to the total.

## Installing it

It installs to your home screen and works with no signal, which is what a
kitchen usually has. The service worker caches the shell, the language packs,
the methods and the dish photographs on first visit; the only things that ever
hit the network are the ones that are meaningless stale — shops near you, live
prices, your account.

The leftover nudge is a real Web Push notification the day after you cook
something that keeps, composed in your language before it is queued. It is the
only notification the app ever sends.

## Layout

The design was drawn inside a 390×844 phone frame. This build drops the bezel, notch, status bar and
the designer's desk panel, and ships the screens themselves: full-viewport on a phone, a centred
480px column lifted off the warm ground on anything wider. Every value inside the screens — colour,
radius, size, spacing — is what the design exported.

## Structure

```
src/
  App.tsx              screen router, notification toast, drag ghost
  state/usePantry.ts   all state and every derived value the screens read
  screens/             one file per screen
  ui/                  Btn/A (themed hover), Icon (Lucide at 2.75), Nav, PlateDrop, bits
  lib/css.ts           CSS declaration strings → React style objects
  state/cloud.ts       session, sync, price medians, reminders
  state/usePwa.ts      install prompt, notification permission, push subscription
  data/
    cookbook.js        recipes, countries, stores, history, passport, staples
    extra-copy.ts      copy added after the handoff — English only, see below
    pantry-i18n.js     six languages, RTL included
    pantry-food.js     ingredient and micronutrient names, leftover verdicts
    pantry-live.js     geolocation, Nominatim, Overpass, Open Prices
    pantry-data.js     Open Food Facts nutrition snapshot — present, not yet wired in
    pantry-map.js      ingredient → Open Food Facts tag map — present, not yet wired in
```

`usePantry` keeps one state object and returns a flat bag of values, mirroring the prototype's
`renderVals`. Screens read from it and render; none of them holds state of its own.

Styling stays as CSS declaration strings, because that is how the design expresses it and how the
state layer computes it (`PILL_ON`, the tier-row styles, the store cards). `css()` parses them into
React style objects, so a rule can move between the two without being rewritten.

## Languages

English, Español, Français, Polski, اردو, العربية — switchable in **You → Language**, with
`dir="rtl"` applied at the document root and directional icons mirrored. Dish names, cuisines,
ingredient names, difficulty words, shop tiers and every assembled sentence translate.

Recipe **methods stay in English** by design, with a note at the top of the Cook screen explaining
why in your language: a mistranslated instruction about when to pull prawns off the heat is worse
than an English one.

Adding a language: copy the `en` block in `pantry-i18n.js`, translate the values, add an entry to
`LANGS`. Every key must exist in `PACKS.en` first — `pack()` uses English as the whitelist, so a key
missing there is silently dropped. The audit is one line:
`Object.keys(PACKS[l]).filter(k => !(k in PACKS.en))` must be empty for every language.

### What is not translated

All six languages are complete — the designed screens through
`pantry-i18n.js`, everything added afterwards through
`src/data/extra-copy.ts`. A test asserts that every key exists in every
language and that no language carries a key English does not, so a gap fails
the build rather than shipping silently. The translations of the added copy
have not been reviewed by a native speaker.

One deliberate holdout remains: **recipe methods stay in English**, with a note
at the top of the cook screen explaining why in your language. A mistranslated
instruction about when to pull prawns off the heat is worse than an English
one. Interface copy carries no such risk, so it is translated.

## Where the numbers come from, and what they mean

- **The basket total is not a till receipt.** Prices are pro-rata: the 12 g of
  garlic a recipe uses, not the bulb you have to buy. The Shop screen says so
  under the total. Real pack sizes would change this from an honest estimate to
  an actual forecast; that data is not in the app.
- **Eight countries can be priced**, four of them from measured market surveys
  and the rest modelled from pack prices. The coverage note says exactly that.
- **The Passport denominator is the eleven countries the cookbook covers**, not
  the countries that can be priced — two different numbers that were once
  wrongly the same one.
- **The eight weeks of history are sample data**, flagged as such on Stats
  until your first real cook replaces them, and never written to an account.
- **Of the five data sources listed in Settings, two are live** — Nominatim and
  Overpass, when you grant location. The other three are marked
  "not connected yet" rather than implied to be running.

## Tests

```bash
npm run test
```

Covers the pure layers, which is where the mistakes actually were:

- the CSS declaration parser, including the one shape it cannot handle
- technique matching, with the "soak … drain them well" case that broke it,
  and a guard on how many steps fall through to the generic drawing
- data integrity: every dish has its photograph, no recipe claims you own
  something it never asks for, every logged cook resolves to a real dish
- translation completeness across all six languages, in both directions

## Server bits## Server bits

None of this is needed to run the app; each piece switches on a feature.

**Database.** Migrations are in `supabase/migrations`, in order:

| File | What it does |
| --- | --- |
| `…_profile_state.sql` | Adds this app's state to `profiles`, plus a signup trigger and RLS |
| `…_cook_log.sql` | The cook log, and the amount/use-by columns the Kitchen needs |
| `…_plan_meals.sql` | Explicit plan picks, so a saved week can be edited |
| `…_price_reports.sql` | Store tier, indexes, and the `price_medians` aggregate function |
| `…_push_and_reminders.sql` | Push subscriptions and the reminder queue |
| `…_schedule_reminders.sql` | **Apply last** — pg_cron job, needs the two Vault secrets named in the file |

Every one is idempotent, additive, and leaves the existing pantry-globe tables
and the account already registered against them alone.

**Edge function.** `supabase/functions/send-reminders` sends the due reminders
as Web Push and retires subscriptions the browser reports as gone.

```bash
npx web-push generate-vapid-keys
supabase functions deploy send-reminders
supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… VAPID_SUBJECT=mailto:you@example.com
```

**Auth.** Magic link redirects to `window.location.origin`, so add both
`http://localhost:5173` and the deployed origin to the project's redirect
allow-list.

## Prices and location

Prices are arithmetic over bundled data: a baseline shelf price per ingredient, times the store
multiplier, times the country cost index and exchange rate. No model is consulted, so it answers
instantly and cannot invent a dish.

**Exchange rates.** The `fx` in `COUNTRIES` is the floor, not a claim about today. On landing on
Tonight, at most once a day, the app asks Frankfurter for the European Central Bank's daily
reference set and merges in the currencies it covers — pounds, dollars, euros, rupees and lira
among them. Naira, Pakistani rupees and dirhams are not in that set and stay on the bundled number
for good. Nothing waits on the answer: there is no spinner and no error state, and offline, blocked
or refused, every figure is exactly the one the app shipped with. A rate is never swapped in
mid-shop either — an answer that arrives after you have left Tonight is cached for next time rather
than moving a basket you are standing in front of. **You → Where these numbers come from** says
which rate you are on: live, not published for your currency, or not connected yet.

**Use my location** runs the browser's geolocation, reverse-geocodes through OpenStreetMap
Nominatim, and pulls the actual supermarkets within 2.5 km from Overpass with their opening hours,
tiering them by chain. Deny permission and it falls back to the country picker. Open Prices supplies
real crowdsourced shelf prices where anyone has logged them.

No UK, US or EU supermarket publishes a public price API. Without a vendor key the app uses Open
Prices, which is real but patchy, and every line says whether it is measured, scaled or modelled.
**You → Supermarket price key** holds a slot for a paid aggregator.

`pantry-data.js` and `pantry-map.js` — the Open Food Facts nutrition snapshot from the last, unfinished
turn of the design conversation — are copied across but not wired in. Macros still come from the
recipe data. Wiring them up is a follow-on.

## What persists

Language, country, tier lists, diets, budget, goal, nudge toggles, cook history and the streak are
kept in `localStorage` under `pantry.v1`, so the app does not forget your onboarding on reload.
**You → Start over** clears all of it. The day's exchange rates sit in their own key,
`pantry.fx.v1`, because a rate is not something you told the app: starting over forgets you, not
what the pound did. Nothing is sent anywhere; the plate photo is read into an object URL and never
leaves the device.
