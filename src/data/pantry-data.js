/* Real food data for Pantry.
 *
 * Nutrition: Open Food Facts (openfoodfacts.org), ODbL. For each ingredient we
 * query the category and take the MEDIAN per-100g across up to 50 products, so
 * one mis-typed label cannot move the number much.
 *
 * Every median is then checked against the Atwater relation
 *   kcal ≈ 4·protein + 4·carbohydrate + 9·fat
 * and marked untrusted if the stated energy is more than 30% away from what its
 * own macros imply. 11 of 74 categories fail this — mostly spices whose OFF
 * category is polluted with drinks and supplements (turmeric lattes filed under
 * "turmeric"). Untrusted entries are NOT shown as numbers. They show as gaps.
 *
 * Prices: Open Prices (prices.openfoodfacts.org), ODbL, queried live by currency
 * and category. Coverage is thin and very uneven by country — that is a real
 * property of a crowd-sourced price database, and the app says so rather than
 * papering over it with an estimate.
 *
 * Snapshot captured 2026-08-01. The app re-queries in the background and
 * overwrites this with fresher figures when it can reach the network.
 */

export const SNAPSHOT_DATE = '2026-08-01';

/* [kcal, protein, carb, fat, fibre, salt, iron_mg, calcium_mg, b12_ug, vitC_mg, sampleN, trusted] per 100 g */
const N = {"en:rice-noodles":[344,6,72,1,1.4,0.1,0.65,14,null,null,48,1],"en:tamarind":[361,3.3,73,4.6,6.7,0.54,null,null,null,null,5,1],"en:fish-sauces":[68,10.1,5.3,0,0,25,2.67,null,null,null,48,1],"en:brown-sugars":[396,0,99,0,0,0,0,null,null,null,48,1],"en:prawns":[84,17,0.5,0.9,0,1.68,null,null,null,null,50,1],"en:tofu":[170,14,1.9,8.6,2,0.98,1.98,198,null,null,50,1],"en:chicken-eggs":[140,13,0.5,9.8,0,0.31,null,null,null,null,50,1],"en:garlic":[104,5.1,20,0.8,2.4,0.1,null,null,null,null,27,1],"en:vegetable-oils":[900,0,0,100,0,0,null,null,null,null,46,1],"en:olive-oils":[824,0,0,92,0,0,null,null,null,null,47,1],"en:spring-onion":[31,1.9,7,0.2,1.6,null,null,null,null,null,5,1],"en:bean-sprouts":[29,2.3,3.6,0.5,2,0.03,null,null,null,null,3,1],"en:roasted-peanuts":[618,26,11,51,8.2,0.83,1.21,null,null,null,48,1],"en:limes":[28,0.5,3.1,0.4,0.5,0.01,null,null,null,null,15,0],"en:chili-powder":[246,13.2,23,10,37,0.05,null,null,null,null,25,1],"en:coriander":[26,1.8,1.5,1.6,3.8,0.1,null,null,null,null,12,1],"en:chicken-wings":[197,18.8,2.8,11,0.4,1.2,null,null,null,null,49,1],"en:chicken-breasts":[122,23,0.6,2.1,0.5,0.64,null,null,null,null,49,1],"en:chicken-thighs":[187,18,0.4,12.5,0,0.24,null,null,null,null,44,1],"en:mangoes":[64,0.7,14,0.5,1.8,0.01,null,null,null,27.9,43,1],"en:chili-peppers":[70,1.8,4,1.1,2.8,1.7,0.1,null,null,null,36,0],"en:honeys":[324,0.5,81.5,0.5,0.5,0.03,null,null,null,null,40,1],"en:rice-vinegars":[15,0.1,0.5,0,0,0.02,null,null,null,null,46,0],"en:corn-starches":[355,0.5,87,0.5,0.7,0.02,null,null,null,null,45,1],"en:baking-powders":[145,0.2,42.2,0.4,0.5,22.07,null,null,null,null,26,1],"en:salts":[0,0,0,0,0,98,null,null,null,null,33,1],"en:sour-creams":[200,2.7,3.3,18,0,0.1,null,84,null,null,47,1],"en:long-grain-rices":[345,6.6,71.6,1.1,1.1,0.01,null,null,null,null,48,1],"en:basmati-rice":[332,7.5,71,1,1,0.01,null,null,null,null,47,1],"en:soy-sauces":[69,5.4,6.9,0,0.5,15.3,null,null,null,null,49,1],"en:ginger":[52,0.3,5.8,0.2,0.8,0.03,null,null,null,null,39,0],"en:carrots":[72,1,5.7,4.4,2.8,0.59,null,null,null,null,48,1],"en:broccoli":[34,3,3,0.5,3,0.03,0.81,47,null,22,46,1],"en:red-bell-peppers":[38,1,6,0.5,2,0.7,null,null,null,null,32,1],"en:cheddar":[416,25.4,0.1,34.9,0,1.8,null,739,null,null,49,1],"en:butters":[737,0.6,0.6,80,0,0.5,null,null,null,null,47,1],"en:parsley":[41,3.5,3.5,0.7,4,0.1,null,null,null,null,20,1],"en:breads":[277,9.6,46.4,4,5.2,0.95,null,null,null,null,47,1],"en:sweet-potatoes":[82,1.6,16.9,0.5,2.7,0.11,0.7,23,null,14.2,44,1],"en:canned-chickpeas":[120,6.6,15.1,2.2,6,0.41,null,null,null,null,48,1],"en:coconut-milks":[180,1.5,2.5,18,0.5,0.04,0.59,12,null,1.7,46,1],"en:curry-powder":[310,12.5,30,11,19.5,4.35,null,null,null,null,27,1],"en:turmeric":[1,0.8,0.5,0.5,2,0.01,null,null,null,null,17,0],"en:cumin":[47,10,7,14,10.5,0,null,null,null,null,16,0],"en:spinachs":[28,2.9,1.6,0.6,2.4,0.1,null,94,null,null,48,1],"en:onions":[40,1.2,7.9,0.3,1.4,0.03,null,null,null,null,36,1],"en:red-onions":[38,1.3,6.7,0.2,1.6,0.01,null,null,null,null,29,1],"en:canned-tomatoes":[23,1.2,3.8,0.2,0.9,0.07,null,null,null,null,50,1],"en:tomatoes":[25,1.2,4,0.2,0.9,0.1,null,null,null,null,46,1],"en:tomato-purees":[32,1.5,5.1,0.3,1.6,0.23,null,4,null,null,49,1],"en:pastas":[351,10,65.4,2.3,3,0.02,null,10,null,null,46,1],"en:spaghetti":[351,12.5,71,1.9,3.3,0.01,1.02,null,null,null,49,1],"en:canned-tunas":[134,24.9,0,1.6,0,1,null,null,null,null,48,1],"en:stock-cubes":[90,0.5,1.1,0.6,0.5,0.96,null,null,null,null,15,0],"en:feta":[280,16.5,0.7,24,0,2.23,null,null,null,null,49,1],"en:paprika":[39,2.1,5,1.6,2,0.05,null,null,null,null,8,1],"en:tortillas":[273,8.8,46.7,5.6,5,1.1,2.11,128,null,null,45,1],"en:avocados":[183,1.9,1.9,17.7,3.4,0.02,null,null,null,null,29,1],"en:oregano":[25,0.6,26,0.5,14.5,0,null,null,null,null,13,0],"en:beef":[184,20,0.5,5.7,0.4,0.28,2.27,null,null,null,48,1],"en:star-anise":[337,18,42.7,15.9,15,0,null,null,null,null,6,1],"en:cinnamon":[243,3.9,27.5,1.2,53,0.03,null,null,null,null,15,0],"en:cloves":[21,1,1,1,2.7,0,null,null,null,null,12,1],"en:black-pepper":[1,0.9,1.6,2.1,0,0.1,null,null,null,null,21,0],"en:basil":[44,3.5,2.6,1.2,3.4,0.1,null,null,null,null,18,1],"en:celery":[20,0.9,2.5,0.3,2.3,0.42,null,null,null,null,32,1],"en:red-lentils":[333,25,48,1.5,11,0.01,6,null,null,null,45,1],"en:ghee":[897,0,0,99.8,0,0,null,null,null,null,46,1],"en:fenugreek":[250,20,30,2.1,5.5,0,null,null,null,null,12,1],"en:thyme":[26,1.1,0.5,0.8,12,0,null,null,null,null,10,0],"en:creams":[248,2.5,4.5,23.5,0,0.1,null,100,null,null,50,1],"en:yogurts":[95,4.1,6.8,3,0,0.04,null,129,null,null,50,1],"en:pecorino-romano":[400,26,0,33,0,4.7,null,null,null,null,49,1],"en:flatbreads":[290,9.1,49.8,5.1,3.8,0.95,null,null,null,null,50,1]};

const KEYS = ['kcal', 'protein', 'carb', 'fat', 'fibre', 'salt', 'iron', 'calcium', 'b12', 'vitc'];

/* Categories Open Food Facts has nothing usable for. Named, not hidden. */
export const NO_NUTRITION = ['en:garlic-powder', 'en:canned-sweetcorn', 'en:garam-masala', 'en:dried-chili-peppers', 'en:bay-leaf', 'en:pork-cheek'];

/* Categories whose OFF median contradicts its own macros — shown as gaps. */
export const UNTRUSTED = Object.keys(N).filter((k) => !N[k][11]);

export function per100(tag) {
  const row = N[tag];
  if (!row) return null;
  const o = { trusted: !!row[11], n: row[10], tag };
  KEYS.forEach((k, i) => { o[k] = row[i]; });
  return o;
}

/* Reference intakes used for the % figures (UK/EU adult, per day). */
export const RI = { fibre: 30, iron: 14, calcium: 800, b12: 2.5, vitc: 80, salt: 6 };

/* Parse "160 g", "2", "1 tbsp" into grams. Returns null when we cannot tell,
   which becomes a visible gap rather than a guess. */
export function grams(qty, unitWeight) {
  if (!qty) return null;
  const s = String(qty).trim().toLowerCase();
  let m = s.match(/^([\d.]+)\s*g$/);        if (m) return parseFloat(m[1]);
  m = s.match(/^([\d.]+)\s*kg$/);            if (m) return parseFloat(m[1]) * 1000;
  m = s.match(/^([\d.]+)\s*ml$/);            if (m) return parseFloat(m[1]);
  m = s.match(/^([\d.]+)\s*l$/);             if (m) return parseFloat(m[1]) * 1000;
  m = s.match(/^([\d.]+)\s*tbsp$/);          if (m) return parseFloat(m[1]) * 15;
  m = s.match(/^([\d.]+)\s*tsp$/);           if (m) return parseFloat(m[1]) * 5;
  m = s.match(/^([\d.]+)$/);                 if (m && unitWeight) return parseFloat(m[1]) * unitWeight;
  m = s.match(/^([\d.]+)\s*x/);              if (m && unitWeight) return parseFloat(m[1]) * unitWeight;
  return null;
}

/* Sum a recipe's ingredients into per-serving nutrition, and report honestly
   how much of the dish that sum actually covers. */
export function dishNutrition(items, servings, map) {
  const tot = {}; KEYS.forEach((k) => { tot[k] = 0; });
  const covered = {}; KEYS.forEach((k) => { covered[k] = 0; });
  let gramsTotal = 0, gramsMeasured = 0;
  const gaps = [];
  for (const it of items) {
    const nm = it.n !== undefined ? it.n : it.name;
    const meta = map[nm] || {};
    const g = grams(it.g !== undefined ? it.g : it.qty, meta.unit);
    const p = meta.off ? per100(meta.off) : null;
    if (g === null) { gaps.push({ name: nm, why: 'quantity' }); continue; }
    gramsTotal += g;
    if (!p || !p.trusted) { gaps.push({ name: nm, why: p ? 'contradictory' : 'absent', tag: meta.off }); continue; }
    gramsMeasured += g;
    for (const k of KEYS) { if (typeof p[k] === 'number') { tot[k] += (p[k] * g) / 100; covered[k] += g; } }
  }
  const per = {};
  for (const k of KEYS) per[k] = covered[k] > 0 ? tot[k] / servings : null;
  return { per, gaps, gramsTotal, gramsMeasured, coverage: gramsTotal ? gramsMeasured / gramsTotal : 0 };
}

/* ---- Prices: live, per currency, from Open Prices ---- */

const PRICE_CACHE_KEY = 'pantry.prices.v1';
const memCache = {};

function loadCache() {
  try { return JSON.parse(localStorage.getItem(PRICE_CACHE_KEY) || '{}'); } catch (e) { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(c)); } catch (e) { /* quota — fine */ }
}

const median = (a) => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/* One query per (category, currency). Returns null when the database simply
   has no price — the caller shows a gap, never a substitute. */
export async function fetchPrice(tag, currency) {
  const key = tag + '|' + currency;
  if (memCache[key] !== undefined) return memCache[key];
  const cache = loadCache();
  const hit = cache[key];
  const fresh = hit && Date.now() - hit.t < 1000 * 60 * 60 * 24 * 7;
  if (fresh) { memCache[key] = hit.v; return hit.v; }
  let val = null;
  try {
    const url = `https://prices.openfoodfacts.org/api/v1/prices?category_tag=${encodeURIComponent(tag)}&currency=${encodeURIComponent(currency)}&size=100&order_by=-date`;
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      const kg = (j.items || []).filter((it) => it.price_per === 'KILOGRAM' && typeof it.price === 'number' && it.price > 0);
      if (kg.length) {
        val = { perKg: Math.round(median(kg.map((x) => x.price)) * 100) / 100, n: kg.length, newest: kg.map((x) => x.date).sort().pop(), currency };
      }
    }
  } catch (e) { /* offline — cache the miss briefly below */ }
  memCache[key] = val;
  cache[key] = { t: Date.now(), v: val };
  saveCache(cache);
  return val;
}

export async function priceRecipe(items, map, currency) {
  const nameOf = (i) => (i.n !== undefined ? i.n : i.name);
  const tags = [...new Set(items.map((i) => (map[nameOf(i)] || {}).off).filter(Boolean))];
  const found = {};
  for (const t of tags) { found[t] = await fetchPrice(t, currency); }
  let total = 0, priced = 0, newest = null;
  const unpriced = [];
  for (const it of items) {
    const nm = nameOf(it);
    const meta = map[nm] || {};
    const g = grams(it.g !== undefined ? it.g : it.qty, meta.unit);
    const p = meta.off ? found[meta.off] : null;
    if (g === null || !p) { unpriced.push(nm); continue; }
    total += (p.perKg * g) / 1000;
    priced++;
    if (!newest || p.newest > newest) newest = p.newest;
  }
  return { total: priced ? Math.round(total * 100) / 100 : null, priced, of: items.length, unpriced, newest, currency };
}

/* Live record counts for the sources sheet — real numbers, not claims. */
export async function sourceCounts() {
  const out = {};
  try {
    const r = await fetch('https://prices.openfoodfacts.org/api/v1/prices?size=1');
    if (r.ok) out.prices = (await r.json()).total;
  } catch (e) { out.prices = null; }
  return out;
}
