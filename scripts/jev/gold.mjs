/**
 * Hand-verified gold labels for bench.mjs.
 *
 * Only cases where the right answer is unambiguous UNDER THE APP'S OWN
 * DEFINITIONS (DEFS in check-diets.mjs): nut free counts coconut and tahini;
 * gluten free counts ordinary soy sauce, stock cubes and miso; halal/kosher
 * assume the right butcher; vinegar is not alcohol. Each case says why, so a
 * reader can check it against the ingredient list in src/data/cookbook.js.
 *
 * `app` is what meetsDiet() says today, written down when the case was chosen,
 * so a case where the gold and the app differ is visible here and not only in
 * a report. bench.test.mjs fails if meetsDiet() drifts from these.
 */

export const DIET_GOLD = [
  // fish sauce / vegan and gluten free
  { recipe: 'pad_thai', diet: 'vegan', gold: false, app: false, why: 'fish sauce, prawns and eggs' },
  { recipe: 'green_curry_tofu', diet: 'vegan', gold: true, app: true, why: 'a Thai curry made with soy sauce, not fish sauce or shrimp paste' },
  { recipe: 'larb_gai', diet: 'gluten_free', gold: true, app: true, why: 'fish sauce is not a gluten source; no soy sauce' },
  { recipe: 'tom_yum', diet: 'gluten_free', gold: true, app: true, why: 'fish sauce, coconut milk, rice — nothing with gluten' },
  // soy sauce / gluten free
  { recipe: 'stir_fry', diet: 'gluten_free', gold: false, app: false, why: 'ordinary soy sauce' },
  { recipe: 'mapo_tofu', diet: 'gluten_free', gold: false, app: false, why: 'soy sauce and doubanjiang' },
  // coconut, tahini, butter beans / nut free
  { recipe: 'veg_curry', diet: 'nut_free', gold: false, app: false, why: 'coconut milk (cautious rule)' },
  { recipe: 'pumpkin_kootu', diet: 'nut_free', gold: false, app: false, why: 'desiccated coconut; the butternut squash is NOT a nut' },
  { recipe: 'dan_dan_noodles', diet: 'nut_free', gold: false, app: false, why: 'tahini' },
  { recipe: 'tabbouleh_plate', diet: 'nut_free', gold: true, app: true, why: 'butter beans are not nuts; nothing else is' },
  // meat + dairy / kosher, and fish + dairy (allowed)
  { recipe: 'butter_chicken', diet: 'kosher', gold: false, app: false, why: 'chicken cooked with butter, cream and yoghurt' },
  { recipe: 'shepherds_pie', diet: 'kosher', gold: false, app: false, why: 'lamb with butter and milk in the same dish' },
  { recipe: 'kedgeree', diet: 'kosher', gold: true, app: true, why: 'smoked mackerel with butter and eggs: fish with dairy is allowed, no meat' },
  // stock cubes, miso / gluten free
  { recipe: 'jollof_rice', diet: 'gluten_free', gold: false, app: false, why: 'stock cube' },
  { recipe: 'moin_moin', diet: 'gluten_free', gold: false, app: false, why: 'stock cube' },
  { recipe: 'miso_soup_rice', diet: 'gluten_free', gold: false, app: false, why: 'miso paste' },
  { recipe: 'miso_soup_rice', diet: 'vegan', gold: true, app: true, why: 'vegetable stock, miso, tofu, rice, vegetables' },
  // eggs / vegan
  { recipe: 'egg_fried_rice', diet: 'vegan', gold: false, app: false, why: 'eggs' },
  { recipe: 'egg_fried_rice', diet: 'vegetarian', gold: true, app: true, why: 'eggs are vegetarian; no meat or fish' },
  { recipe: 'egg_hoppers', diet: 'gluten_free', gold: true, app: true, why: 'rice flour, coconut milk, yeast, eggs' },
  { recipe: 'dal_tadka', diet: 'vegan', gold: false, app: false, why: 'ghee' },
  // anchovies, sausages
  { recipe: 'spaghetti_puttanesca', diet: 'vegetarian', gold: false, app: false, why: 'anchovies' },
  { recipe: 'merguez_couscous', diet: 'no_pork', gold: true, app: true, why: 'merguez is a lamb/beef sausage' },
  { recipe: 'merguez_couscous', diet: 'gluten_free', gold: false, app: false, why: 'couscous is wheat' },
  // The one case where gold and the app differ: a British banger is pork as
  // normally bought, and DEFS.no_pork says "ordinary pork sausages" count.
  // The app's no_pork pattern does not match the bare word "Sausages".
  { recipe: 'bangers_and_mash', diet: 'no_pork', gold: false, app: true, why: 'British "sausages" are pork as normally bought; the app pattern misses the bare word' },
];

/**
 * Ten translations checked by hand as faithful, from the real language files.
 * The bench sample always includes these keys, so they cost nothing extra.
 */
export const TRANSLATION_GOLD_OK = [
  { id: 'strings:welcome1', lang: 'es', why: '"Una decisión en pantalla cada vez" = one decision on screen at a time' },
  { id: 'strings:welcome3', lang: 'fr', why: '"Se souvient de ce que vous avez déjà" = remembers what you already have' },
  { id: 'strings:locWhy', lang: 'pl', why: 'prices and shops change street by street; nothing leaves this device' },
  { id: 'strings:tierTime', lang: 'es', why: '"¿Cuánto tiempo tienes de verdad?" = how much time do you really have?' },
  { id: 'strings:dietSub', lang: 'fr', why: 'tap all that apply; can be changed later' },
  { id: 'strings:locWhy', lang: 'ar', why: 'prices and stores change from street to street; nothing leaves this device' },
  { id: 'strings:dietTitle', lang: 'ur', why: '"کوئی چیز جو آپ نہیں کھاتے؟" = any thing you do not eat?' },
  { id: 'strings:locDenied', lang: 'es', why: 'no problem: pick a place and I will work with that' },
  { id: 'strings:welcome2', lang: 'pl', why: 'prices from the place where you really are' },
  { id: 'strings:homeWhat', lang: 'ar', why: '"ما الذي تشتهيه؟" = what do you fancy?' },
];

/**
 * Five deliberately broken copies of real translations. Each replaces ONE
 * language's text in an otherwise real row; only that language is asked.
 * Every break changes the MEANING, because the question only asks whether the
 * text says the same thing as the English. (Wrong-language or left-in-English
 * cases were dropped: "Show me dinner" in the Urdu field does say the same
 * thing, so a literal judge could fairly answer yes.)
 */
export const TRANSLATION_GOLD_BROKEN = [
  { id: 'pack:v.nudge', lang: 'fr', kind: 'wrong number', text: 'Les germes et la coriandre sont à utiliser sous 5 jours', why: 'English says 3 days' },
  { id: 'strings:locWhy', lang: 'es', kind: 'negation flipped', text: 'Los precios y las tiendas no cambian calle por calle. Nada sale de este dispositivo.', why: 'says prices and shops do NOT change street by street' },
  { id: 'strings:welcomeTag', lang: 'fr', kind: 'dropped clause', text: 'Dites-moi ce qui vous tente. Je décide pour vous.', why: 'drops "and what is in your pocket" (the budget)' },
  { id: 'strings:tierTime', lang: 'pl', kind: 'wrong word', text: 'Ile masz naprawdę pieniędzy?', why: '"how much MONEY do you really have?" where the English asks about time' },
  { id: 'strings:homeGo', lang: 'ur', kind: 'wrong meal', text: 'ناشتہ دکھائیں', why: '"show breakfast" (ناشتہ) where the English says dinner (the real text has رات کا کھانا)' },
];
