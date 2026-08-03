# Credits and licences

Pantry is three different things under three different sets of terms, and it is
worth being exact about which is which.

## The code

The application code in this repository is licensed **AGPL-3.0-only**. See
`LICENSE` for the full text.

The short version, in plain English: you may read it, run it, change it and
share it. If you run a modified copy as a service that other people use over a
network — which is the only way anybody would ever run this — you have to offer
them the source of what you are running. That is the whole reason for choosing
the AGPL over the GPL. A cooking PWA is never *distributed*; it is *served*,
and the GPL's obligations would never trigger.

## The data

None of this is ours to relicense. It is used under the terms below, and those
terms are why the app renders an attribution notice on the Settings screen and
again on Locate and Shop, in all six languages, rather than filing it here where
no user would find it.

| Source | What it gives Pantry | Licence |
| --- | --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) via Nominatim | place names from your coordinates | ODbL 1.0 |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) via Overpass | the shops near you, and their opening hours | ODbL 1.0 |
| [Open Prices](https://prices.openfoodfacts.org) | real prices photographed on the shelf | ODbL 1.0 |
| [Open Food Facts](https://world.openfoodfacts.org) | pack weights and nutrition | ODbL 1.0 |
| WFP food price monitor, via [HDX](https://data.humdata.org) | the measured baseline in 62 countries | CC BY |
| [European Central Bank](https://www.ecb.europa.eu) reference rates, via Frankfurter | today's exchange rates | free reuse with attribution |

**© OpenStreetMap contributors.** OpenStreetMap data is available under the
[Open Database Licence](https://opendatacommons.org/licenses/odbl/1-0/).

## The photographs

The dish photographs are the lead image of each dish's own Wikipedia article.
The app currently tells the reader they are "almost all CC BY-SA", which is
true and is not enough: CC BY-SA requires the author and the licence to be
named per work, and "almost all" means some are under something else. A
per-image credit table is outstanding work, not a solved problem.

## Fonts

Caprasimo and Figtree, both under the SIL Open Font License, self-hosted in
`public/fonts` so that no visitor's IP goes to a font CDN to read a recipe.