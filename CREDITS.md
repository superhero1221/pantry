# Credits and licences

Pantry is three different things under three different sets of terms, and it is
worth being exact about which is which.

## The code

The application code in this repository is **proprietary — all rights
reserved**. See `LICENSE`.

The short version, in plain English: it is here to be run, not taken. Cook from
the recipes, print one, feed people who pay you for dinner. Do not republish the
collection, the tables or the translations, and do not host a copy. Permission
for any of that is available by asking rather than by forking.

This reverses an earlier decision. The file used to name AGPL-3.0-only, on the
argument that an app whose whole value is being honest about where its numbers
come from ought to show its working. That argument is still a good one; it lost
to the fact that the AGPL explicitly permits a competing fork, and this is a
product rather than a demonstration. `LICENSE` records the reversal, including
the two things it cannot undo: copies already received under the AGPL keep it,
and the CC0 dish tiles already published stay public domain.

The distinction that survives unchanged is the one that mattered most. **None of
the third-party material below is relicensed by that decision.** The data stays
ODbL, the photographs stay CC BY-SA, the typefaces stay OFL, and the attribution
they require is rendered in the app rather than filed here. Closing the code
does not close anything that was never ours to close.

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

## The nutrition figures

The `per` block and the micronutrient bars on every recipe are **computed**,
not typed in. `src/data/nutrition.js` holds a composition table — energy,
macronutrients and six micronutrients per 100 g of each raw ingredient — and
`scripts/nutrition.mjs` totals a recipe's shopping list and divides by its
servings. A test fails the build if the two ever disagree, which is what stops
anyone editing a calorie count by hand.

Those per-100 g figures are typical published values of the sort found in
government and academic food composition tables, principally USDA FoodData
Central (public domain) and McCance and Widdowson's *The Composition of Foods*.
They are not measurements of the specific product anybody will buy: brands
vary, a tin drains differently every time, and a medium onion is a range rather
than a weight. The percentages are against **EU nutrient reference values**.

This matters because the numbers that were there before were wrong. All
fourteen original recipes understated energy — by between 7 and 61 per cent,
never once overstating it — because totting a recipe up by eye loses the oil,
the butter and the tin of coconut milk and never invents them.

## One price per ingredient

Every ingredient costs the same in every recipe, and until recently it did not.

Fresh coriander was £16.67/kg in one dish and £81.67/kg in another. Parsley ran
£12 to £45, rice vinegar £2.67 to £11.67, garam masala £12.50 to £26.67. Across
the 153 recipes, **484 lines covering 100 ingredients disagreed with
themselves** by more than a penny of rounding.

That is wrong without anybody having to know what coriander really costs. A
shopping list cannot charge four times as much for a herb because of what it is
going into. The drift arrived one plausible-looking line at a time — each recipe
priced on its own, nothing comparing them — which is exactly the failure a
hundred and fifty hand-written recipes invite and exactly what a test is for.

`scripts/reprice-cookbook.mjs` settles each ingredient on the **quantity-weighted
median** of what the file already said. Both halves earn their place. The median,
because a mean is dragged by the outliers that are the problem. The weighting,
because `s` is money to two decimals — so a 2 g pinch of salt costs a penny
whatever salt costs, which reads as £5/kg against the £1.25/kg the same table
charges for 8 g, and an unweighted median over dozens of pinches would elect the
rounding error.

Taking the largest-quantity line instead was measured and rejected: it moves
recipe totals by −4.4% on average, because the biggest quantity of a herb is a
bunch bought loose while most people buy the packet. The weighted median moves
the mean recipe by **−0.43%**, so this is a consistency fix and not a silent
repricing of the cookbook. 625 lines changed; six recipes did not move at all;
fourteen moved by more than 10%, and those fourteen are the point — Cumin Lamb
fell 20.6% and Ghormeh Sabzi rose 23.0% because they were the dishes carrying
the worst of the contradiction.

`price.test.ts` holds it there, and fails naming the ingredient, the dish and
both figures. It asserts no particular price: what coriander *should* cost
depends on shelf data that only Open Prices and community reports can supply,
and both override these figures per line when they land. It asserts only that
the fallback agrees with itself — which is what has to be true before anyone can
tell that it is wrong.

## No pork, no alcohol

The cookbook keeps neither, anywhere. `nopork.test.ts` fails the build if either
appears in an ingredient list *or* is left behind in a method step — a recipe
that buys beef and still says "pork belly in for 5 minutes" reads as a mistake
to somebody standing at the hob, and is one.

Ten dishes were removed rather than rewritten, because the pork or the wine WAS
the dish: carbonara without guanciale is not carbonara, and coq au vin without
the vin is a chicken casserole with a French name. Fourteen more kept their
place with an honest swap — chicken in the banh mi, beef in the kimchi jjigae,
stock where the wine was. Ten new dishes were written to replace what went.

Vinegar is deliberately exempt. It is a fermented product with essentially no
alcohol left in it. The shopping list says "white vinegar" rather than "white
wine vinegar" all the same, because the word on the list is what a shopper
actually reads.

The `no_pork` and `no_alcohol` filters still exist on the Diet screen and still
work. They now have nothing to exclude, which is the point: somebody who keeps
halal should not have to trust a filter.

## The pictures

**108 of the 153 dishes have a photograph**, taken from Wikimedia Commons and
credited individually — photographer, licence, source file and the article it
came from — in `public/pix/manifest.json`. Most are CC BY-SA or CC BY, and both
grant the right to use the work *on condition* that the author and licence are
named. `pictures.test.ts` fails the build if any photograph in the app has no
credit, because an uncredited CC BY-SA image is a licence breach rather than an
oversight. It also refuses any NC or ND licence: NC forbids exactly what a live
site does, and ND forbids the resize every one of these has had.

No photograph appears on two dishes. That is tested too — dal tadka and the Sri
Lankan dhal were both handed the same stock photo of dried lentils, and Beef and
Pork Ragu was given Lentil Bolognese's plate of tagliatelle.

Six dishes had a photograph that was of the wrong thing: the karahi pan rather
than the chicken cooked in it, raw egusi seeds rather than the stew, dried
lentils rather than a cooked dhal, a kitchen worktop rather than a bowl of
minestrone. Those went back to drawings. A drawing is honest about being a
drawing; a photograph of the wrong food is not.

The remaining **45 dishes have a drawing**, generated by
`scripts/make-dish-tiles.mjs`: flat shapes in the app's own palette, laid out
deterministically from the recipe's id. They were offered CC0 under the previous
licence and copies already published stay that way — a public domain dedication
is not something you can take back, and forty-five flat colour tiles are not
worth pretending otherwise. They are deliberately not
photorealistic. A generated image that looked like a photograph of food would be
a picture of a meal that has never existed, shown to somebody deciding what to
cook tonight, and no amount of it being pretty would make that honest.

`scripts/fetch-dish-photos.mjs` is what fetches the photographs, and
`.github/workflows/dish-photos.yml` runs it. It pins the Wikipedia article for
each dish rather than searching, because a search for "Fish Pie" returns things
that are not fish pie.

## The mascot

Pantry — the cream canister with the brown lid, the brass plate and the wooden
spoon — comes from a character sheet made for this app. It is drawn in the
rubber-hose idiom of 1930s animation: heavy outlines, big eyes, limbs with no
elbows, white gloves. That idiom is public property and has been for decades;
the characters other people have drawn in it are not, and none of them are in
here.

The sheets were image-generated to a written brief and then worked on by hand.
That is worth stating plainly rather than leaving to be discovered, because it
decides what protects the character. In the United States a purely
machine-generated image has no copyright at all — the Copyright Office has said
so repeatedly and the courts have agreed — and what human effort adds is
protection over *that* contribution and no more: the brief, the selection of
eleven poses from many, the cutting, the common floor line and jar width, the
decision to throw the English lettering away. Thin, and real, but thin.

So copyright is not the fence here. **Trade mark is.** A mark is protected by
being used in trade as a badge of origin, and it does not ask who held the pen.
The character is used that way — on the launch screen, on the goal screen, at
the end of a cook — and `LICENSE` claims it as a mark on that basis.

Eleven poses ship, in two sets, because a corner sticker and a full-width
illustration want different canvases.

`public/mascot` holds the four that are empty-handed — walking, winking,
thinking, cheering — and the screen decides which one stands in the corner.
`public/mascot/big` holds the seven that are holding something: pointing with
the spoon, celebrating, and one for each answer to "what are you after?" —
standing on bathroom scales, carrying a loaded plate, lifting a barbell,
counting the change in a purse, bouncing with stars for eyes. Pick a goal and
the character acts it out; nothing else on that screen tells you the app heard
you. The corner one stands down whenever a big one is on screen.

Two of the drawings arrived with English painted on them — a "RECIPE
COMPLETED!" banner and a speech bubble reading "cheapest, nearby, all
ingredients". Both were cut off and thrown away. This app speaks six languages
including two written right to left, and a picture cannot translate or be read
aloud. The headings say those things instead, in yours.

Two scripts turn a sheet into those files, and both are in `scripts`:

- `cut-mascot.py` removes the background by flooding inward from the edges
  rather than by deleting pixels near the background colour. The distinction is
  the whole job: the character's body is cream too, and a colour test punches a
  hole straight through the middle of the jar. It then separates the poses by
  finding blobs of ink and taking the big ones as figures, because a raised
  spoon in one pose reaches over the pose below it and any method based on
  empty rows and columns welds the sheet into one piece.
  A second mode, `--room`, handles a drawing with real scenery behind it: it
  keeps the ink drawn thicker than a floorboard line, fills whatever those
  outlines enclose, and takes the biggest thing that comes back.
- `mascot-poses.py` scales every pose to a common jar WIDTH and stands them all
  on one floor line, lined up over one point. Scaling by image height is the
  obvious approach and it is wrong — a pose holding a spoon overhead is a
  taller picture, so the character comes out smaller in it, and in a fixed
  corner that reads as the character shrinking and sinking every time it
  changes pose. Scaling by body height fails too, because half these drawings
  come with a prop and a barbell held overhead measures as body. The jar is a
  cylinder, so its width is the commonest measurement in the drawing by a wide
  margin, and nothing else occupies enough rows to outvote it.

It bobs about three pixels every three and a half
seconds, which is as much movement as an app for people who are easily pulled
away from things has any business making. `prefers-reduced-motion` stops it
along with everything else, and there is a switch on the Settings screen to
take it away entirely.

It is deliberately **not** mirrored in Arabic and Urdu, though everything else
in the app is. It has its own name painted across its belly, and a mirrored
photograph spells that backwards; facing the wrong way is a smaller mistake
than nonsense.

## Fonts

Caprasimo and Figtree, both under the SIL Open Font License, self-hosted in
`public/fonts` so that no visitor's IP goes to a font CDN to read a recipe.
The OFL asks that its text travel with the fonts, so the full licence for each
sits beside the `.woff2` it covers: `public/fonts/Caprasimo-OFL.txt`
(Copyright 2023 The Caprasimo Project Authors) and
`public/fonts/Figtree-OFL.txt` (Copyright 2022 The Figtree Project Authors).