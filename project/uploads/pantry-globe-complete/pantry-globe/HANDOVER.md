# Pantry Globe — everything, and how to run it

Written 1 August 2026. This is the whole project as it stands, plus exactly
what to do with each file.

---

## The two files you can just open

No install, no server, no internet needed for the app itself.
Double-click either one and it runs in your browser.

| File | Size | What it is |
|---|---|---|
| `pantry-simple.html` | 410 KB | **The stripped-back version.** Two screens. Pick a dish, see what to buy and how to cook it. Nothing else. |
| `pantry-globe.html` | 548 KB | The full version — week planner, Tonight mode, barcode scan, 3D exploded view, price provenance, 91 countries. |

Both contain the entire engine, all 28 recipes and all the price data inside the
single file. Photographs load from a public copy on the internet, so away from
a connection you get the text but not the pictures.

---

## Running it properly (with local photographs)

```bash
cd pantry-globe            # this folder
npm install                # about 540 MB of build tools, one time
npm run static             # builds the full version
node scripts/build-simple.mjs   # builds the stripped version
```

Outputs land at `../pantry-globe.html` and `../pantry-simple.html`, and a
complete static site in `dist/`. To look at it locally with the photographs
served from disk:

```bash
python3 -m http.server 8000 --directory dist
# then open http://127.0.0.1:8000
```

---

## What's in here

```
lib/            The engine. Plain TypeScript, no framework.
  engine.ts         pricing a basket, nutrition, swaps, storage advice
  recipes-a..d.ts   28 recipes, every step written out
  nutrients.ts      141 ingredients: per-100g nutrition, pack size, reference price
  prices.ts         price resolution: measured here > measured in Europe > modelled
  wfp-prices.ts     GENERATED — 426 real market prices across 62 countries
  wfp-countries.ts  GENERATED — 41 country profiles derived from that data
  countries.ts      91 countries: currency, exchange rate, price level
  inflation.ts      ONS series D7G8, used to age prices forward month by month
  planner.ts        the week planner (hill-climb over a seeded random start)
  tonight.ts        "I want 40g protein for £6 in 20 minutes with one pan"
  equipment.ts      derives what kit a recipe needs from its method text
  visual.ts         the vector plate drawing (only used by the full version)
  scan.ts           barcode lookup against Open Food Facts
  contribute.ts     submitting a price back to Open Prices

scripts/
  simple-shell.html   the stripped interface        <- the one to keep
  static-shell.html   the full interface
  build-simple.mjs    builds pantry-simple.html
  build-static.mjs    builds pantry-globe.html and dist/
  fetch-wfp.mjs       downloads World Food Programme market prices, regenerates
                      lib/wfp-prices.ts and lib/wfp-countries.ts
  fetch_dish_photos.py   pulls each dish photo from its own Wikipedia article
  fetch_ing_photos.py    same for ingredients, with the background removed
  audit.mjs           checks every recipe against 9 rules — run before shipping
  crawl.mjs           clicks every control on every screen, fails on any JS error

dishpix/  25 dish photographs (webp) + manifest with licence and author
ingpix/   57 ingredient cut-outs + manifest
public/pix/  the same photographs, copied where the build wants them
app/      an old Next.js version. Not used. Safe to delete.
```

---

## The one command that matters before you ship anything

```bash
node scripts/audit.mjs --strict
```

Nine checks across all 28 recipes. It caught 215 real errors when it was first
written, including five food-safety ones — a salmon variant served raw, two
chicken dishes told to cook to 71 °C instead of 75 °C, one relying on residual
heat, and a whole chicken breast with no temperature check at all. It also
caught eleven false dietary claims and salt loads up to 11.2 g per serving.

It currently reports **0 errors, 36 warnings**. The warnings are mostly
ingredients bought but never named in a step, which is worth fixing but will not
poison anyone. Keep it at zero errors.

---

## Where the numbers come from

Prices resolve in three tiers, and every line in the full version shows which
tier it used:

1. **Measured here** — World Food Programme enumerators visit markets in ~70
   countries and write down prices. Published on the Humanitarian Data Exchange
   under CC BY-IGO, updated monthly. 124,474 observations from 2025–26 reduce to
   426 country/ingredient medians, each from at least 3 recent observations.
   Covers 62 countries. **Does not cover the UK, US, EU or the Gulf** — WFP
   monitors food-insecure countries, which is exactly the set no grocery API
   serves.

2. **Measured in Europe, scaled** — Open Prices (Open Food Facts): 284,709
   shopper-submitted prices across 122 countries, ODbL. But 69% of it is French
   and the UK has only 2,025, so it is treated as a European average and scaled
   by country, not as a local price.

3. **Modelled** — a UK reference pack price scaled by country and shop type,
   aged forward using ONS food CPI.

**Be honest about this when you show anyone.** In Britain, 74% of the money in
any basket is tier 3. Zero prices in this app were measured in Britain. Every
figure I have quoted you for the UK — the £1.53 a serving, the £74.62 saved on
wings — is mostly a model.

The model does correct itself where it can: in the 62 WFP countries it compares
measured against modelled across every ingredient it has both for, and nudges
the rest by the median ratio. India came down 22%, Indonesia 19%. A country
whose derived price level hits the clamp gets dropped rather than published —
Yemen came out at 2.84× because it has two live exchange rates, so Yemen is out.

To refresh the world prices:
```bash
node scripts/fetch-wfp.mjs        # re-downloads and regenerates both files
```

---

## Photographs

25 dishes, 57 ingredients. Each one is the **lead image of that subject's own
Wikipedia article**, not an image-search result. That distinction matters:
searching an image library for "lemon" famously returns a coin, "chicken
breast" returned an 18th-century painting, and "spinach" returned profiteroles.
An article has one lead image chosen by editors who care about the subject.

Licences are almost all CC BY-SA — attribution and share-alike. Author and
licence for every image are in `dishpix/manifest.json` and
`ingpix/manifest.json`. The full version has a credits screen. **If you publish
this commercially you must keep the attribution.**

Several ingredient cut-outs came out badly (basmati is a grey smudge, coriander
nearly blank). The stripped version does not show them for that reason.

---

## Live

Deployed at:
`https://pantry-globe-world-yousifs-projects-1527185f.vercel.app`

It is behind Vercel's own login until you turn that off:
Vercel → project **pantry-globe-world** → Settings → Deployment Protection →
Vercel Authentication → **Disabled** → Save.

The deploy works by fetching the built site from a public Supabase storage
bucket at build time, because pushing 2.8 MB through a chat is not possible.
`build.mjs` in the Vercel project does that; the bucket is
`iokudugeqfwjtifomyis.supabase.co/storage/v1/object/public/app`.

To update the live site you have to re-upload `dist/` to that bucket and
redeploy. That is clumsy. **A Vercel token from vercel.com/account/tokens makes
it one command instead**, and lets you deploy to production properly rather than
to a preview URL.

---

## Honest assessment

Three things it claims to do:

- **Tell you what to cook.** 28 recipes across 23 cuisines — roughly one dish
  per cuisine. It is a sampler. This is the biggest problem and it is a content
  problem, not a code problem.
- **Tell you what it costs.** In your country, mostly modelled. See above.
- **Tell you where to buy it.** It lists shops near you from OpenStreetMap and
  has no idea what any of them charge.

The engine, the recipe accuracy audit, the food-safety checks and the world
price pipeline are real and worth keeping. The 3D exploded view, the vector
plate drawing and the barcode scan are novelty and could go tomorrow without
anyone noticing.

## What would actually make it useful, in order

1. **More recipes.** 28 → a few hundred. Everything else is downstream of this.
2. **Real UK prices.** The only legal route at scale is people photographing
   their own receipts. `lib/contribute.ts` already does the submitting; the
   interface for it needs to be one button, not a tab.
3. **Delete the decoration.** Start from `simple-shell.html`, not from
   `static-shell.html`.
