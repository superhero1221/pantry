# Ingredient cut-outs

Real photographs, one per ingredient, so a plate composed from them can still be
taken apart. A photograph of a *finished dish* cannot — the pixels under the
pasta do not exist — so the only way to have both real imagery and the
pull-it-apart mechanic is one image per ingredient.

## Adding more

    python3 scripts/fetch_cutouts.py tomato_fresh="ripe tomato" lemon="whole lemon"
    node scripts/build-photos.mjs     # runs automatically as part of `npm run static`

**Then look at every single image before shipping it.** Automated search picks
the wrong subject far more often than it picks the right one — in two rounds
here, "lemon" returned a coin, "chicken breast" an eighteenth-century painting,
and "spinach" a plate of profiteroles. Roughly one in four was usable.

Delete the rejects from this folder and from `manifest.json`, or they ship.

## What the filters already do

- **Licence** — CC0 and public domain are used freely; CC BY and CC BY-SA are
  used and recorded as needing credit. Share-alike passes to the cut-out.
- **Colour** — rejects anything near-monochrome. Public domain overwhelmingly
  means *old*, so the free pool is full of Victorian seed catalogues and
  botanical engravings. This filter throws those out.
- **Coverage** — rejects a cut-out that kept almost the whole frame, which
  usually means background removal failed.

## What it cannot do

Screen for a **visible brand sticker or an identifiable person**. Both are a
bigger practical risk than any licence clause, because none of these sources
provides model or property releases. Only your eyes catch those. A red pepper
was rejected here for exactly that reason.

## If you want real coverage

Hand-pick from Pexels: modern colour, no attribution required, and genuinely
good coverage of non-Western dishes. It needs a person choosing each image,
which is the part that cannot be automated — and is precisely why no free
ingredient cut-out library exists for anyone to download.
