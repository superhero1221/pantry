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
npm run build      # typecheck + production build into dist/
npm run preview
```

## What's here

Fifteen screens, all client-side:

| Flow | Screens |
| --- | --- |
| Onboarding | Welcome → Goals → Tier list (skill, then time) → Diet → Location |
| Deciding | Tonight, Browse, Results |
| Doing | Shop, Cook, After |
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
  data/
    cookbook.js        recipes, countries, stores, history, passport, staples
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

### Two strings the design never translated

Carried over as-is rather than machine-translated:

1. `src/screens/Locate.tsx` — "Every price you see from here is in {currency}, at shops that
   actually exist near you. Not right?" has no key in `pantry-i18n.js`, so it renders in English in
   every language.
2. `LEARNED_PING` in `src/data/cookbook.js` — the toast after answering a learning question ("Noted.
   I will aim higher on protein…") is an English constant in the design.

Both need a key in all six languages to fix; say the word and they get one.

## Prices and location

Prices are arithmetic over bundled data: a baseline shelf price per ingredient, times the store
multiplier, times the country cost index and exchange rate. No model is consulted, so it answers
instantly and cannot invent a dish.

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
**You → Start over** clears all of it. Nothing is sent anywhere; the plate photo is read into an
object URL and never leaves the device.
