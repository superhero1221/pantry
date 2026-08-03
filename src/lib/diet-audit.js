/* ── Auditing the six tags nobody derives ──────────────────────────────────
   The six above are hand-written on each recipe, and a hand-written tag is a
   claim rather than a fact. With fourteen recipes you could read them all. At
   a hundred and fifty nobody will, and the failure mode is not a bad dinner —
   it is meat on a plate that says vegetarian.

   So the tags are audited against the ingredients. These are sets of exact
   canonical names rather than patterns, because patterns get this wrong in
   ways that matter: "Coconut milk" is not dairy, "Butter beans" and "Peanut
   butter" are not butter, and a regex for /milk|butter/ would strip the
   dairy-free tag off three perfectly good vegan recipes.

   This proves a tag is WRONG. It cannot prove one is right — it cannot see
   what a factory put in a jar of curry powder, and the app says so. */

const MEAT = new Set([
  'Chicken breast', 'Chicken thighs', 'Chicken wings', 'Chicken mince',
  'Beef mince', 'Beef brisket', 'Beef steak', 'Beef bones',
  'Lamb mince', 'Lamb shoulder', 'Pork mince', 'Pork shoulder', 'Pork belly',
  'Bacon', 'Guanciale', 'Pancetta', 'Chorizo', 'Sausages', 'Ham',
]);

const FISH = new Set([
  'Raw prawns, peeled', 'Salmon', 'Cod fillet', 'White fish fillet', 'Mackerel',
  'Tuna in spring water', 'Sardines', 'Anchovies', 'Squid', 'Mussels',
]);

/** Not kosher, whatever else is true of the dish. */
const SHELLFISH = new Set(['Raw prawns, peeled', 'Squid', 'Mussels']);

/** Made from fish, and the classic way a "vegetarian" curry stops being one. */
const ANIMAL_SAUCE = new Set(['Fish sauce', 'Oyster sauce']);

const DAIRY = new Set([
  'Milk', 'Whole milk', 'Yoghurt', 'Greek yoghurt', 'Double cream', 'Single cream',
  'Soured cream', 'Creme fraiche', 'Butter', 'Ghee', 'Cheddar', 'Mature cheddar',
  'Mozzarella', 'Parmesan', 'Pecorino Romano', 'Feta', 'Halloumi', 'Cream cheese', 'Paneer',
]);

const PORK = new Set([
  'Pork mince', 'Pork shoulder', 'Pork belly', 'Bacon', 'Guanciale', 'Pancetta', 'Chorizo', 'Ham',
]);

const BOOZE = new Set(['Red wine', 'White wine', 'Mirin']);

/** Wheat, and the two sauces nobody expects to contain it. */
const GLUTEN = new Set([
  'Pasta', 'Spaghetti', 'Macaroni', 'Lasagne sheets', 'Egg noodles', 'Udon noodles',
  'Soba noodles', 'Couscous', 'Bulgur wheat', 'Plain flour', 'Semolina', 'Bread',
  'Sourdough', 'Flour tortillas', 'Flatbread', 'Pitta bread', 'Burger buns',
  'Breadcrumbs', 'Filo pastry', 'Puff pastry', 'Wonton wrappers',
  'Soy sauce', 'Dark soy sauce', 'Stock cube', 'Miso paste',
]);

/** A last line for ingredients added after this file was written. */
const LOOKS_LIKE = {
  meat: /\b(chicken|beef|pork|lamb|mutton|veal|duck|turkey|bacon|ham|sausage|chorizo|pancetta|guanciale|salami|prosciutto|mince|brisket|gelatin[e]?)\b/i,
  fish: /\b(fish|prawns?|shrimp|squid|mussels?|clams?|anchov(y|ies)|sardines?|salmon|cod|tuna|mackerel|crab|lobster|oysters?)\b/i,
  dairy: /\b(cheese|cheddar|mozzarella|parmesan|pecorino|feta|halloumi|paneer|ricotta|mascarpone|yoghurt|yogurt|ghee|buttermilk)\b/i,
  gluten: /\b(wheat|flour|bread|pasta|noodles?|semolina|couscous|bulgur|barley|rye|seitan|pastry|breadcrumbs)\b/i,
};

const has = (recipe, set) =>
  recipe.items.filter((i) => set.has(i.n.trim())).map((i) => i.n);

const looks = (recipe, kind, exempt) =>
  recipe.items.filter((i) => LOOKS_LIKE[kind].test(i.n) && !exempt.test(i.n)).map((i) => i.n);

/** Coconut is not dairy and butter beans are not butter. */
const NOT_DAIRY = /coconut|butter beans?|peanut butter|nut butter|soya?\b|oat milk|almond milk/i;
/** Rice noodles and glass noodles carry no wheat. */
const NOT_GLUTEN = /rice noodles?|rice flour|gram flour|glass noodles?|corn tortillas?|cornflour|buckwheat|polenta/i;

/**
 * Tags a recipe claims that its own ingredients contradict.
 *
 * Returns a map of tag to the ingredients that disprove it. An empty object
 * means nothing here caught anything, which is not the same as the tags being
 * right — see the note above.
 */
export function tagContradictions(recipe) {
  const out = {};
  const tag = (t) => recipe.tags.indexOf(t) >= 0;
  const add = (t, names) => {
    if (names.length) out[t] = [...new Set([...(out[t] ?? []), ...names])];
  };

  const meat = [...has(recipe, MEAT), ...looks(recipe, 'meat', /never/)];
  const fish = [...has(recipe, FISH), ...looks(recipe, 'fish', /sauce$/)];
  const sauce = has(recipe, ANIMAL_SAUCE);
  const dairy = [...has(recipe, DAIRY), ...looks(recipe, 'dairy', NOT_DAIRY)];
  const eggs = recipe.items.filter((i) => /^eggs?$/i.test(i.n.trim())).map((i) => i.n);
  const honey = recipe.items.filter((i) => /\bhoney\b/i.test(i.n)).map((i) => i.n);

  if (tag('vegan')) add('vegan', [...meat, ...fish, ...sauce, ...dairy, ...eggs, ...honey]);
  if (tag('vegetarian')) add('vegetarian', [...meat, ...fish, ...sauce]);
  if (tag('dairy_free')) add('dairy_free', dairy);
  if (tag('gluten_free')) add('gluten_free', [...has(recipe, GLUTEN), ...looks(recipe, 'gluten', NOT_GLUTEN)]);
  if (tag('halal')) add('halal', [...has(recipe, PORK), ...has(recipe, BOOZE)]);
  if (tag('kosher')) {
    add('kosher', [...has(recipe, PORK), ...has(recipe, SHELLFISH)]);
    // Meat and dairy in the same pot is the other half of the rule, and it is
    // the half a tagger who only checked for pork will have missed.
    if (meat.length && dairy.length) add('kosher', [...meat, ...dairy]);
  }
  // Vegan without vegetarian is not dangerous, but it hides the dish from a
  // filter that is a plain tag lookup.
  if (tag('vegan') && !tag('vegetarian')) out.vegetarian = ['tagged vegan but not vegetarian'];

  return out;
}
