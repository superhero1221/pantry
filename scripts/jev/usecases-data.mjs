/**
 * Hand-labelled test sets for usecases.mjs — six jobs Jev might do inside
 * Pantry. Every expected answer here was written by hand; where a case has no
 * single right answer it is left null and reported as n/a, never scored.
 *
 * Diet answers follow the app's own definitions (DEFS in check-diets.mjs):
 * nut free counts coconut and tahini; gluten free counts ordinary soy sauce,
 * stock cubes and miso; halal/kosher assume the right butcher; vinegar is not
 * alcohol.
 */

/* ── 1. Cravings box ─────────────────────────────────────────────────────── */

export const INTENTS = {
  quick: 'something fast or low-effort to make (roughly 30 minutes or less, or "no energy")',
  cheap: 'something cheap or budget-friendly',
  comforting: 'warm, hearty, cosy comfort food',
  light: 'something light, not heavy or rich',
  high_protein: 'something high in protein (gym, muscle, "protein")',
  spicy: 'something spicy or hot',
};

/**
 * `cuisine`: the slug of one of the app's cuisines (from RECIPES), an array of
 * acceptable slugs, 'none_or_unclear', or null (ambiguous — not scored).
 * `yes`: intents the phrase clearly asks for. `unsure`: intents it might
 * imply (not scored). Every other intent is clearly NOT asked for (false).
 */
export const CRAVINGS = [
  { text: 'pad thai', lang: 'en', cuisine: 'thai', yes: '', unsure: 'spicy' },
  { text: 'padthai plz', lang: 'en', cuisine: 'thai', yes: '', unsure: 'spicy' },
  { text: 'somthing italien', lang: 'en', cuisine: 'italian', yes: '', unsure: '' },
  { text: 'curry', lang: 'en', cuisine: null, yes: '', unsure: 'spicy,comforting' },
  { text: 'butter chicken but quick', lang: 'en', cuisine: 'indian', yes: 'quick', unsure: 'comforting,high_protein,spicy' },
  { text: 'something cosy', lang: 'en', cuisine: 'none_or_unclear', yes: 'comforting', unsure: '' },
  { text: "I'm wiped", lang: 'en', cuisine: 'none_or_unclear', yes: '', unsure: 'quick,comforting' },
  { text: 'cheap and filling, payday is friday', lang: 'en', cuisine: 'none_or_unclear', yes: 'cheap', unsure: 'comforting' },
  { text: 'high protein after gym', lang: 'en', cuisine: 'none_or_unclear', yes: 'high_protein', unsure: 'quick' },
  { text: 'something light, not too heavy', lang: 'en', cuisine: 'none_or_unclear', yes: 'light', unsure: '' },
  { text: 'spicy korean', lang: 'en', cuisine: 'korean', yes: 'spicy', unsure: '' },
  { text: 'tacos', lang: 'en', cuisine: 'mexican', yes: '', unsure: 'spicy' },
  { text: 'ramen', lang: 'en', cuisine: 'japanese', yes: '', unsure: 'comforting' },
  { text: 'algo rápido y barato', lang: 'es', cuisine: 'none_or_unclear', yes: 'quick,cheap', unsure: '' },
  { text: 'comida mexicana picante', lang: 'es', cuisine: 'mexican', yes: 'spicy', unsure: '' },
  { text: 'quelque chose de réconfortant', lang: 'fr', cuisine: 'none_or_unclear', yes: 'comforting', unsure: '' },
  { text: 'un curry thaï pas trop épicé', lang: 'fr', cuisine: 'thai', yes: '', unsure: 'comforting' },
  { text: 'coś szybkiego z kurczakiem', lang: 'pl', cuisine: 'none_or_unclear', yes: 'quick', unsure: 'high_protein' },
  { text: 'pierogi', lang: 'pl', cuisine: 'none_or_unclear', yes: '', unsure: 'comforting' },
  { text: 'کچھ مصالحے دار', lang: 'ur', cuisine: null, yes: 'spicy', unsure: '' },
  { text: 'بریانی', lang: 'ur', cuisine: ['pakistani', 'indian', 'south_indian'], yes: '', unsure: 'spicy,comforting' },
  { text: 'شيء خفيف', lang: 'ar', cuisine: 'none_or_unclear', yes: 'light', unsure: '' },
  { text: 'طعام مغربي', lang: 'ar', cuisine: ['moroccan', 'north_african', 'tunisian'], yes: '', unsure: '' },
  { text: 'jollof', lang: 'en', cuisine: 'west_african', yes: '', unsure: 'spicy' },
  { text: 'full english vibes but for dinner', lang: 'en', cuisine: 'british', yes: '', unsure: 'comforting' },
  { text: 'wingstop mango habanero', lang: 'en', cuisine: 'american', yes: 'spicy', unsure: '' },
  { text: 'idk anything', lang: 'en', cuisine: 'none_or_unclear', yes: '', unsure: '' },
  { text: 'sushi', lang: 'en', cuisine: 'japanese', yes: '', unsure: 'light' },
  { text: 'something with eggs', lang: 'en', cuisine: 'none_or_unclear', yes: '', unsure: 'high_protein,quick' },
  { text: 'cold and rainy, want soup', lang: 'en', cuisine: 'none_or_unclear', yes: 'comforting', unsure: 'light' },
];
// Notes on the hard ones:
//  - 'curry': Indian, Thai, Sri Lankan, Pakistani, Japanese... all in the book. Not scored.
//  - 'کچھ مصالحے دار' (Urdu: "something spicy/masala-y"): 'masala' leans South Asian but
//    does not name a cuisine. Not scored.
//  - 'pierogi': Polish, and the book has no Polish cuisine -> none_or_unclear.
//  - 'بریانی' (biryani): the book files biryani under Pakistani; Indian and South Indian
//    (Hyderabadi, Chettinad...) are equally right.
//  - 'طعام مغربي': مغربي is Moroccan in everyday use but also Maghrebi, so the book's
//    North African and Tunisian cuisines are accepted too.
//  - Pad Thai swap: crispy shallots, not sesame seeds, because the app's nut rule names
//    tahini but says nothing about sesame seeds, which would make nut free ambiguous.

/* ── 2. Price-report sanity check ────────────────────────────────────────── */

/**
 * Each report is built at run time from the app's own modelled price for the
 * item (cookbook item.s per gram, through toLocal for the country), so the
 * numbers are the app's. `kind` says how the reported price is made:
 *   ok             modelled x `factor` (0.7 - 1.6: shop and brand spread)
 *   wrong_currency the right amount, but typed in `as` currency's numbers
 *   extra_zero     modelled x 10
 *   unit_mismatch  the right price for `realGrams`, but pack typed as kilos (pack_grams = realGrams / 1000)
 *   wrong_item     the modelled price of `pricedAs` (another item) for this pack; label names that item
 */
export const PRICE_REPORTS = [
  { item: 'Basmati rice', country: 'GB', grams: 1000, kind: 'ok', factor: 1.25, label: 'Tilda pure basmati 1kg' },
  { item: 'Chicken thighs', country: 'NG', grams: 1000, kind: 'ok', factor: 1.1, label: 'Chicken thighs 1kg' },
  { item: 'Red lentils', country: 'IN', grams: 500, kind: 'ok', factor: 0.9, label: 'Masoor dal 500g' },
  { item: 'Tinned tomatoes', country: 'DE', grams: 400, kind: 'ok', factor: 0.8, label: 'Gehackte Tomaten 400g' },
  { item: 'Paneer', country: 'IN', grams: 200, kind: 'ok', factor: 1.3, label: 'Amul paneer 200g' },
  { item: 'Spaghetti', country: 'TR', grams: 500, kind: 'ok', factor: 1.2, label: 'Spagetti makarna 500g' },
  { item: 'Salmon', country: 'GB', grams: 240, kind: 'ok', factor: 1.1, label: '2 salmon fillets 240g' },
  { item: 'Butter', country: 'US', grams: 250, kind: 'ok', factor: 1.3, label: 'Salted butter 250g' },
  { item: 'Greek yoghurt', country: 'AE', grams: 500, kind: 'ok', factor: 1.15, label: 'Greek style yoghurt 500g' },
  { item: 'Beef mince', country: 'PK', grams: 500, kind: 'ok', factor: 0.95, label: 'Beef qeema 500g' },
  { item: 'Coconut milk, tinned', country: 'NG', grams: 400, kind: 'ok', factor: 1.4, label: 'Coconut milk 400ml tin' },
  { item: 'Potatoes', country: 'GB', grams: 2000, kind: 'ok', factor: 0.8, label: 'Maris Piper potatoes 2kg' },
  { item: 'Mature cheddar', country: 'US', grams: 400, kind: 'ok', factor: 0.9, label: 'Sharp cheddar block 400g' },
  { item: 'Saffron', country: 'AE', grams: 1, kind: 'ok', factor: 1.2, label: 'Saffron threads 1g' },
  { item: 'Lamb shoulder', country: 'TR', grams: 1000, kind: 'ok', factor: 1.1, label: 'Kuzu kol 1kg' },

  { item: 'Long grain rice', country: 'NG', grams: 1000, kind: 'wrong_currency', as: 'GB', label: 'Long grain rice 1kg' },
  { item: 'Chicken breast', country: 'PK', grams: 500, kind: 'wrong_currency', as: 'GB', label: 'Chicken breast boneless 500g' },
  { item: 'Red lentils', country: 'IN', grams: 1000, kind: 'wrong_currency', as: 'US', label: 'Masoor dal 1kg' },
  { item: 'Spaghetti', country: 'TR', grams: 500, kind: 'wrong_currency', as: 'DE', label: 'Spagetti 500g' },

  { item: 'Butter', country: 'GB', grams: 250, kind: 'extra_zero', label: 'Butter 250g' },
  { item: 'Tinned tomatoes', country: 'US', grams: 400, kind: 'extra_zero', label: 'Diced tomatoes 14oz can' },
  { item: 'Basmati rice', country: 'IN', grams: 1000, kind: 'extra_zero', label: 'Basmati rice 1kg' },
  { item: 'Olive oil', country: 'DE', grams: 500, kind: 'extra_zero', label: 'Olivenöl 500ml' },

  { item: 'Potatoes', country: 'GB', grams: 2000, kind: 'unit_mismatch', label: 'Potatoes 2kg bag' },
  { item: 'Chicken thighs', country: 'NG', grams: 1000, kind: 'unit_mismatch', label: 'Chicken thighs 1kg' },
  { item: 'Sugar', country: 'TR', grams: 1000, kind: 'unit_mismatch', label: 'Toz şeker 1kg' },
  { item: 'Basmati rice', country: 'GB', grams: 5000, kind: 'unit_mismatch', label: 'Basmati rice 5kg sack' },

  { item: 'Saffron', country: 'GB', grams: 1, kind: 'wrong_item', pricedAs: 'Turmeric', pricedGrams: 100, label: 'Ground turmeric 100g' },
  { item: 'Chicken breast', country: 'GB', grams: 500, kind: 'wrong_item', pricedAs: 'Stock cube', pricedGrams: 80, label: 'Chicken stock cubes x8' },
  { item: 'Salmon', country: 'US', grams: 240, kind: 'wrong_item', pricedAs: 'Peas, frozen', pricedGrams: 240, label: 'Frozen garden peas 240g' },
];

export const PRICE_ERROR_TYPES = {
  none: 'The report looks like a real price someone paid for this item and pack.',
  wrong_currency: "The number looks like it was typed in a different currency's units (for example pounds or dollars typed in a naira, rupee or lira field).",
  extra_zero: 'The price is about ten times what it should be, as if a zero was added.',
  unit_mismatch: 'The pack size looks wrong: kilos typed as grams (for example a 1 kg bag entered as 1 g), so the price per kilo is absurd.',
  wrong_item: 'The price or the product label is for a different item from the one being reported.',
  other: 'Implausible for some other reason.',
};

/* ── 3. Ingredient swap safety ───────────────────────────────────────────── */

/** recipe id, the ingredient removed (must match the cookbook exactly), what goes in, gold per diet asked. */
export const SWAPS = [
  { recipe: 'green_curry_tofu', out: 'Soy sauce', in: 'Fish sauce', gold: { vegan: false, gluten_free: true }, why: 'fish sauce is animal; it was the only gluten source' },
  { recipe: 'larb_gai', out: 'Fish sauce', in: 'Soy sauce', gold: { gluten_free: false, dairy_free: true }, why: 'ordinary soy sauce has wheat' },
  { recipe: 'stir_fry', out: 'Soy sauce', in: 'Gluten-free tamari', gold: { gluten_free: true }, why: 'soy sauce was the only gluten source' },
  { recipe: 'butter_chicken', out: 'Butter', in: 'Ghee', gold: { dairy_free: false }, why: 'ghee is dairy; cream and yoghurt remain' },
  { recipe: 'butter_chicken', out: 'Double cream', in: 'Coconut cream', gold: { dairy_free: false, nut_free: false }, why: 'butter and yoghurt remain; coconut counts as a nut here' },
  { recipe: 'dal_tadka', out: 'Ghee', in: 'Vegetable oil', gold: { vegan: true, dairy_free: true }, why: 'ghee was the only animal product' },
  { recipe: 'egg_fried_rice', out: 'Eggs', in: 'Firm tofu', gold: { vegan: true, gluten_free: false }, why: 'eggs were the only animal product; soy sauce remains' },
  { recipe: 'veg_curry', out: 'Coconut milk', in: 'Double cream', gold: { vegan: false, nut_free: true }, why: 'cream is dairy; coconut was the only nut' },
  { recipe: 'veg_curry', out: 'Coconut milk', in: 'Cashew cream', gold: { vegan: true, nut_free: false }, why: 'cashews are tree nuts' },
  { recipe: 'pad_thai', out: 'Roasted peanuts', in: 'Crispy fried shallots', gold: { nut_free: true, vegan: false }, why: 'peanuts were the only nut; prawns, eggs, fish sauce remain' },
  { recipe: 'pad_thai', out: 'Fish sauce', in: 'Soy sauce', gold: { gluten_free: false }, why: 'ordinary soy sauce has wheat' },
  { recipe: 'kedgeree', out: 'Butter', in: 'Olive oil', gold: { dairy_free: true, kosher: true }, why: 'butter was the only dairy; fish and eggs, no meat' },
  { recipe: 'spaghetti_puttanesca', out: 'Anchovies', in: 'Extra capers', gold: { vegetarian: true, vegan: true }, why: 'anchovies were the only animal product' },
  { recipe: 'spaghetti_puttanesca', out: 'Spaghetti', in: 'Rice noodles', gold: { gluten_free: true }, why: 'spaghetti was the only gluten source' },
  { recipe: 'shepherds_pie', out: 'Lamb mince', in: 'Green lentils', gold: { vegetarian: false }, why: 'Worcestershire sauce contains anchovies' },
  { recipe: 'sloppy_joes', out: 'Beef mince', in: 'Soy mince', gold: { vegetarian: false, gluten_free: false }, why: 'Worcestershire sauce (anchovies); burger buns' },
  { recipe: 'bangers_and_mash', out: 'Sausages', in: 'Vegetarian sausages', gold: { vegetarian: false, no_pork: true }, why: 'Worcestershire sauce contains anchovies; the pork is gone' },
  { recipe: 'cumin_lamb', out: 'Flatbread', in: 'Long grain rice', gold: { gluten_free: false }, why: 'soy sauce remains' },
  { recipe: 'teriyaki_salmon', out: 'Soy sauce', in: 'Gluten-free tamari', gold: { gluten_free: true }, why: 'soy sauce was the only gluten source' },
  { recipe: 'omelette', out: 'Bread', in: 'Gluten-free bread', gold: { gluten_free: true }, why: 'bread was the only gluten source' },
  { recipe: 'chicken_milanese', out: 'Breadcrumbs', in: 'Crushed cornflakes', gold: { gluten_free: false }, why: 'plain flour remains' },
  { recipe: 'menemen', out: 'Feta', in: 'Vegan feta', gold: { vegan: false }, why: 'eggs and butter remain' },
  { recipe: 'palak_paneer', out: 'Paneer', in: 'Firm tofu', gold: { vegan: false, dairy_free: false }, why: 'ghee and double cream remain' },
  { recipe: 'katsu_curry', out: 'Honey', in: 'Sugar', gold: { vegan: false }, why: 'chicken, eggs and butter remain' },
  { recipe: 'rice_and_peas', out: 'Coconut milk', in: 'Water', gold: { nut_free: true, vegan: true }, why: 'coconut milk was the only nut' },
];

/* ── 4. Cupboard items: hidden allergens and diets ───────────────────────── */

/**
 * Free text a user might type into Kitchen. Gold per diet, as the item is
 * NORMALLY sold, under the app's definitions. T = compatible, F = not;
 * a diet left out is ambiguous (brand-dependent) and not scored.
 * Keys: v vegan, vg vegetarian, h halal, k kosher, gf gluten_free,
 * df dairy_free, nf nut_free, np no_pork, na no_alcohol.
 */
export const CUPBOARD = [
  { text: 'Worcestershire sauce', gold: 'v:F vg:F df:T nf:T np:T', note: 'anchovies; UK malt vinegar makes gluten brand-dependent' },
  { text: 'Pesto', gold: 'v:F df:F nf:F np:T na:T gf:T', note: 'parmesan and pine nuts' },
  { text: 'naan bread', gold: 'gf:F np:T na:T', note: 'wheat; dairy varies by brand' },
  { text: 'gummy bears', gold: 'v:F vg:F nf:T', note: 'gelatine (pork, or beef in halal markets such as PK, AE, TR), so halal depends on the market and is not scored' },
  { text: 'Oyster sauce', gold: 'v:F vg:F k:F df:T np:T na:T nf:T', note: 'shellfish' },
  { text: 'Tahini', gold: 'nf:F v:T vg:T gf:T df:T np:T na:T h:T k:T', note: 'sesame paste; the app counts tahini as a nut' },
  { text: 'Marzipan', gold: 'nf:F vg:T gf:T df:T np:T', note: 'almonds' },
  { text: 'Halloumi', gold: 'v:F df:F gf:T nf:T np:T na:T', note: 'cheese; rennet makes vegetarian brand-dependent' },
  { text: 'Fish sauce', gold: 'v:F vg:F df:T nf:T np:T na:T', note: 'anchovies' },
  { text: 'Soy sauce', gold: 'gf:F v:T vg:T df:T nf:T np:T', note: 'ordinary soy sauce is brewed with wheat' },
  { text: 'miso paste', gold: 'gf:F df:T nf:T np:T', note: 'the app counts miso as gluten' },
  { text: 'chicken stock cubes', gold: 'v:F vg:F gf:F nf:T', note: 'chicken; the app counts stock cubes as gluten' },
  { text: 'Ghee', gold: 'v:F df:F vg:T gf:T nf:T np:T na:T h:T', note: 'clarified butter' },
  { text: 'coconut milk', gold: 'nf:F v:T vg:T df:T gf:T np:T na:T', note: 'coconut counts as a nut here; it is not dairy' },
  { text: 'Peanut butter', gold: 'nf:F vg:T df:T gf:T np:T na:T', note: 'peanuts; not dairy' },
  { text: 'Honey', gold: 'v:F vg:T df:T gf:T nf:T np:T na:T', note: 'bees' },
  { text: 'parmesan', gold: 'v:F df:F gf:T nf:T np:T', note: 'cheese' },
  { text: 'smoked bacon', gold: 'np:F h:F k:F vg:F v:F df:T nf:T', note: 'pork' },
  { text: 'Chorizo', gold: 'np:F h:F k:F vg:F v:F nf:T', note: 'pork sausage' },
  { text: 'Lard', gold: 'np:F h:F k:F vg:F v:F df:T nf:T gf:T', note: 'pork fat; NOT dairy' },
  { text: 'Mirin', gold: 'na:F h:F v:T vg:T df:T nf:T np:T', note: 'sweet rice wine' },
  { text: 'beer', gold: 'na:F h:F gf:F df:T nf:T np:T', note: 'barley' },
  { text: 'butter beans (tinned)', gold: 'nf:T df:T v:T vg:T gf:T np:T na:T h:T k:T', note: 'a bean: neither butter nor nut' },
  { text: 'ground nutmeg', gold: 'nf:T v:T df:T gf:T np:T', note: 'a seed; the app does not count it as a nut' },
  { text: 'rice noodles', gold: 'gf:T v:T df:T nf:T np:T', note: 'rice flour and water' },
  { text: 'egg noodles', gold: 'gf:F v:F vg:T df:T np:T', note: 'wheat and egg' },
  { text: 'couscous', gold: 'gf:F v:T df:T nf:T np:T', note: 'wheat' },
  { text: 'paneer', gold: 'v:F df:F vg:T gf:T nf:T np:T', note: 'acid-set cheese, no rennet' },
  { text: 'mayonnaise', gold: 'v:F vg:T df:T gf:T nf:T np:T', note: 'egg yolk; not dairy' },
  { text: 'vegetable stock cube', gold: 'vg:T np:T gf:F nf:T', note: 'the app counts stock cubes as gluten' },
];
export const DIET_KEYS = { v: 'vegan', vg: 'vegetarian', h: 'halal', k: 'kosher', gf: 'gluten_free', df: 'dairy_free', nf: 'nut_free', np: 'no_pork', na: 'no_alcohol' };
export function parseDietGold(s) {
  const out = {};
  for (const tok of s.trim().split(/\s+/)) {
    const [k, v] = tok.split(':');
    if (!DIET_KEYS[k] || !['T', 'F'].includes(v)) throw new Error(`bad diet gold token ${tok}`);
    out[DIET_KEYS[k]] = v === 'T';
  }
  return out;
}

/* ── 5. Mood to dish ─────────────────────────────────────────────────────── */

/**
 * Gold is a RULE, not a dish id, because the five candidates come from the
 * app's current ranking and change when the cookbook does. The rule's hard
 * parts are applied to the five: exactly one passes -> that one is gold; none
 * pass -> 'none' is gold; several pass -> no single right answer (n/a).
 */
export const MOODS = [
  { text: 'exhausted, 20 minutes, want comfort', rule: { maxTotal: 20 } },
  { text: 'I have 15 minutes before a meeting', rule: { maxTotal: 15 } },
  { text: 'vegetarian tonight, not fussy', rule: { diets: ['vegetarian'] } },
  { text: 'post-gym, need loads of protein, 40 g or more', rule: { minProtein: 40 } },
  { text: 'trying to eat light, under 500 calories', rule: { maxKcal: 500 } },
  { text: 'want a real challenge tonight: difficulty 3 out of 4 or harder', rule: { minDiff: 3 } },
  { text: 'vegan, and 30 minutes max please', rule: { diets: ['vegan'], maxTotal: 30 } },
  { text: 'no meat, no fish, under 30 minutes', rule: { diets: ['vegetarian'], maxTotal: 30 } },
  { text: "I'm starving, want something big, 800 calories or more", rule: { minKcal: 800 } },
  { text: 'gluten free, and no more than 30 minutes', rule: { diets: ['gluten_free'], maxTotal: 30 } },
  { text: 'I can barely cook: difficulty 1 only, please', rule: { maxDiff: 1 } },
  { text: 'feeling adventurous: Korean or Ethiopian?', rule: { cuisines: ['Korean', 'Ethiopian'] } },
  { text: 'halal please, nothing over 45 minutes', rule: { diets: ['halal'], maxTotal: 45 } },
  { text: 'dairy free, and I am tired', rule: { diets: ['dairy_free'] } },
  { text: 'craving something Italian', rule: { cuisines: ['Italian'] } },
];

/* ── 6. Feedback triage ──────────────────────────────────────────────────── */

export const FEEDBACK_TYPES = {
  bug: 'Something in the app is broken: a crash, a wrong display, a feature not working.',
  wrong_price: 'A price the app shows is wrong for a real shop or country.',
  wrong_recipe_info: 'A recipe fact is wrong: an ingredient, a diet tag, a time, a quantity, a step.',
  translation: 'Text in a language other than English is wrong, missing or untranslated.',
  feature_request: 'Asks for something new or different.',
  abuse_spam: 'Spam, advertising, abuse, or not about the app.',
};
export const URGENCY = [
  'low: nice to have, or no harm done',
  'medium: annoying or misleading, with an easy workaround',
  'high: blocks someone from using the app, or misleads many people',
  'critical: a safety risk (a diet or allergen error someone could eat) or a data/security problem',
];
/** type null / urgency null = no single right answer, not scored; an array of types = any of them is right. */
export const FEEDBACK = [
  // Both diet-filter complaints could be a wrong recipe fact or a filter bug (nut free is
  // derived in code, not tagged), so either type is accepted.
  { text: 'I ticked Nut free and it showed me a satay with peanuts in the ingredient list!! My son is allergic', type: ['wrong_recipe_info', 'bug'], urgency: 3 },
  { text: 'App goes to a white screen when I tap Shop on my iPhone 12', type: 'bug', urgency: 2 },
  { text: 'Rice is not £12 at Aldi, it is more like £1.20 a kilo', type: 'wrong_price', urgency: null },
  { text: 'In Polish the first screen is fine but the recipe steps are all still in English', type: 'translation', urgency: null },
  { text: 'Could you add a meal plan for the whole week?', type: 'feature_request', urgency: 0 },
  { text: 'BUY CHEAP FOLLOWERS NOW www.spam.example', type: 'abuse_spam', urgency: 0 },
  { text: "The Arabic for 'Skip' on the welcome screen actually says 'Next'", type: 'translation', urgency: null },
  { text: 'Pad Thai says 25 minutes total but the noodles alone soak for 40', type: 'wrong_recipe_info', urgency: null },
  { text: 'Lagos prices are way off, tomatoes are ₦800 not ₦8,000', type: 'wrong_price', urgency: null },
  { text: 'please add a dark mode 🙏', type: 'feature_request', urgency: 0 },
  { text: "I can't sign in, the magic link email never arrives", type: 'bug', urgency: null },
  { text: 'you are all idiots this app is garbage', type: 'abuse_spam', urgency: 0 },
  { text: 'A dish tagged kosher has chicken and butter cooked together', type: 'wrong_recipe_info', urgency: 3 },
  { text: "The French recipe says 'ajoutez 3 œufs' but the English says 2 eggs", type: 'translation', urgency: null },
  { text: "The cooking timer doesn't go off when my phone is locked", type: 'bug', urgency: null },
  { text: 'Would love a shopping list I can share with my partner', type: 'feature_request', urgency: 0 },
  { text: 'Prices in Turkey look like last year, the lira has moved a lot since', type: 'wrong_price', urgency: null },
  { text: 'Earn $5000/week from home!!! click here', type: 'abuse_spam', urgency: 0 },
  { text: "The gluten free filter shows me a stir fry made with soy sauce — I'm coeliac", type: ['wrong_recipe_info', 'bug'], urgency: 3 },
  { text: 'I set my budget to 5 and the Home screen shows £50', type: 'bug', urgency: null },
];
