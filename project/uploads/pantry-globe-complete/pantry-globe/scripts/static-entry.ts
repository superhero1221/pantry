// Entry point for the standalone single-file build.
// Re-exports the REAL engine so the offline preview and the deployed app share
// one implementation — a hand-ported copy would drift and start lying.
export { RECIPES, applyVariant, nutrition, priceBasket, recipeMatches, restaurantPrice, rankStores, RNI, storageAdvice, methodNotes, swapsFor } from '../lib/engine';
export { NUTRIENTS } from '../lib/nutrients';
export { buildPlan, planForProfile, filterByProfile, budgetFor, explainProfile, boldnessOf, DEFAULT_PROFILE } from '../lib/planner';
export type { CookProfile, Tier } from '../lib/planner';
export { COUNTRIES, DERIVED_COUNTRIES, getCountry, fmtMoney } from '../lib/countries';
export { classify, haversineKm, KIND_LABEL } from '../lib/stores';
export { statusFrom } from '../lib/hours';
export { quote, coverage, calibration, SNAPSHOT_DATE, SOURCE_NAME } from '../lib/prices';
export { WFP_PRICES, WFP_SOURCE, WFP_URL, WFP_LICENCE, WFP_MONTHS } from '../lib/wfp-prices';
export { WFP_COUNTRIES, WFP_FX } from '../lib/wfp-countries';
export { REAL_PRICES } from '../lib/price-data';
export { ROLE_SHOPS, SHOP_LABEL, shoppingRoute } from '../lib/shops';
export { benchmark, headline, BENCHMARKS, BENCHMARK_DATE } from '../lib/benchmark';
export { leftovers, nextFromLeftovers, packEconomics } from '../lib/leftovers';
export { plateLayers, contribution, lookOf } from '../lib/visual';
export { ageing, SERIES, REFERENCE_MONTH } from '../lib/inflation';
export { signIn, uploadProof, submitPrice, OFF_CATEGORY, canContribute, OP_BASE } from '../lib/contribute';
export { PHOTOS, PHOTO_CREDITS, hasPhoto } from '../lib/photo-data';
export { suggest, ASSUMED_STAPLES } from '../lib/tonight';
export { KIT_LABEL, FULL_KITCHEN, ONE_RING, HOTEL_ROOM, needs, fits, kitCoverage } from '../lib/equipment';
export { lookup, pricesFor, parseQuantity, guessIngredient } from '../lib/scan';
export { DISH_PHOTOS, DISH_REMOTE, DISH_CREDITS, dishPhoto } from '../lib/dish-photos';
export { ING_PHOTOS, ING_REMOTE, ING_CREDITS, ingPhoto } from '../lib/ing-photos';
