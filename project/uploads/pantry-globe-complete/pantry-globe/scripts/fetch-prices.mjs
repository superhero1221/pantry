/**
 * Pull real grocery prices from Open Prices (Open Food Facts, ODbL) and bake a
 * snapshot into lib/price-data.ts.
 *
 * Why build-time and not runtime:
 *  - the app stays fully offline-capable and instant
 *  - no CORS, no rate limits, no third-party outage in the user's critical path
 *  - the snapshot is reviewable in git, so a bad data day is visible in a diff
 *
 * Run:  npm run prices
 *
 * The data is community-submitted and genuinely noisy — one chicken breast row
 * reads $35.25/kg. Everything below exists to throw that away rather than ship it.
 */
import { writeFileSync } from 'node:fs';

const API = 'https://prices.openfoodfacts.org/api/v1/prices';

/** Local currency -> GBP. Approximate, matches lib/countries.ts. */
const TO_GBP = {
  GBP: 1, EUR: 1 / 1.17, USD: 1 / 1.27, CHF: 1 / 1.07, SEK: 1 / 13.6, NOK: 1 / 13.9,
  DKK: 1 / 8.7, PLN: 1 / 5.0, CZK: 1 / 29, CAD: 1 / 1.74, AUD: 1 / 1.94, NZD: 1 / 2.1,
  JPY: 1 / 190, INR: 1 / 108, BRL: 1 / 6.9, MXN: 1 / 23.5, ZAR: 1 / 23, TRY: 1 / 44,
};

/**
 * Ingredient id -> Open Food Facts category tag.
 * Only raw-ish staples: branded packaged goods dominate the database and their
 * prices say nothing useful about what a cook actually buys.
 */
const CATEGORIES = {
  chicken_breast: 'en:chicken-breasts', chicken_thigh: 'en:chicken-thighs',
  beef_mince_5: 'en:minced-beef', beef_sirloin: 'en:beef-steaks', lamb_diced: 'en:lamb-meats',
  bacon_streaky: 'en:bacons', salmon: 'en:salmons', white_fish: 'en:cods',
  prawns_raw: 'en:shrimps', tuna_tinned: 'en:canned-tunas',
  egg: 'en:chicken-eggs', milk_semi: 'en:semi-skimmed-milks', butter: 'en:butters',
  greek_yogurt: 'en:greek-yogurts', natural_yogurt: 'en:plain-yogurts', cheddar: 'en:cheddar',
  parmesan: 'en:parmigiano-reggiano', feta: 'en:fetas', mozzarella: 'en:mozzarella',
  double_cream: 'en:creams', tofu_firm: 'en:tofu', soya_yogurt: 'en:soy-yogurts',
  coconut_milk: 'en:coconut-milks',
  olive_oil: 'en:olive-oils', vegetable_oil: 'en:sunflower-oils', sesame_oil: 'en:sesame-oils',
  basmati_rice: 'en:basmati-rice', jasmine_rice: 'en:jasmine-rice', long_grain_rice: 'en:rices',
  spaghetti: 'en:spaghetti', couscous: 'en:couscous', bulgur: 'en:bulgur',
  rice_noodles: 'en:rice-noodles', plain_flour: 'en:wheat-flours',
  red_lentils: 'en:lentils', chickpeas_tinned: 'en:canned-chickpeas',
  black_beans_tinned: 'en:canned-black-beans', kidney_beans_tinned: 'en:canned-kidney-beans',
  tomato_tinned: 'en:canned-tomatoes', passata: 'en:tomato-purees', tomato_puree: 'en:tomato-concentrates',
  onion: 'en:onions', red_onion: 'en:red-onions', potato: 'en:potatoes', sweet_potato: 'en:sweet-potatoes',
  carrot: 'en:carrots', courgette: 'en:zucchini', aubergine: 'en:aubergines',
  red_pepper: 'en:red-bell-peppers', green_pepper: 'en:bell-peppers', mushroom: 'en:mushrooms',
  white_cabbage: 'en:cabbages', spinach_fresh: 'en:spinachs', avocado: 'en:avocados',
  cucumber: 'en:cucumbers', tomato_fresh: 'en:tomatoes', lettuce: 'en:lettuces',
  lemon: 'en:lemons', lime: 'en:limes', garlic: 'en:garlics', ginger: 'en:gingers',
  peas_frozen: 'en:frozen-peas', sweetcorn: 'en:sweetcorns', olives_black: 'en:black-olives',
  bread_sourdough: 'en:breads', flatbread: 'en:flatbreads',
  peanuts: 'en:peanuts', almonds: 'en:almonds', cashews: 'en:cashew-nuts',
  sesame_seeds: 'en:sesame-seeds', pine_nuts: 'en:pine-nuts', tahini: 'en:tahini',
  honey: 'en:honeys', sugar: 'en:sugars', soy_sauce: 'en:soy-sauces',
  fish_sauce: 'en:fish-sauces', vinegar_white: 'en:vinegars', dijon_mustard: 'en:mustards',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json', 'User-Agent': 'PantryGlobe/1.0 (open-source meal planner)' } });
      if (r.status === 429) { await sleep(2500 * (attempt + 1)); continue; }
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1200 * (attempt + 1));
    }
  }
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Median absolute deviation filter.
 *
 * Mean and standard deviation are the wrong tools here: a single $35/kg typo
 * drags the mean up and inflates the SD enough to keep itself inside any
 * sensible cutoff. The median and MAD don't move for one bad row.
 */
function robust(values) {
  if (values.length < 3) return null;
  const med = median(values);
  const mad = median(values.map((v) => Math.abs(v - med))) || med * 0.15;
  const kept = values.filter((v) => Math.abs(v - med) <= 3 * mad);
  if (kept.length < 3) return null;
  const lo = median(kept.filter((v) => v <= median(kept)));
  const hi = median(kept.filter((v) => v >= median(kept)));
  return {
    value: median(kept),
    n: kept.length,
    rejected: values.length - kept.length,
    spread: med > 0 ? (hi - lo) / med : 0,
  };
}

const out = {};
const log = [];
let done = 0;

for (const [ref, cat] of Object.entries(CATEGORIES)) {
  done++;
  let rows = [];
  try {
    // paginate — one page of 100 is plenty for these categories
    const j = await getJson(`${API}?category_tag=${encodeURIComponent(cat)}&size=100&order_by=-date`);
    rows = j.items ?? [];
  } catch (e) {
    log.push(`${ref}: fetch failed (${e.message})`);
    continue;
  }

  // keep only rows priced per unit weight/volume — a price "per unit" is
  // meaningless without knowing the unit's size
  const perKg = [];
  for (const it of rows) {
    if (!it.price || !(it.price_per === 'KILOGRAM')) continue;
    const fx = TO_GBP[it.currency];
    if (!fx) continue;
    const gbp = it.price * fx;
    if (gbp <= 0.05 || gbp > 200) continue; // hard sanity bounds before stats
    perKg.push(gbp);
  }

  const stat = robust(perKg);
  if (!stat) { log.push(`${ref}: only ${perKg.length} usable rows, keeping estimate`); continue; }

  out[ref] = {
    gbpPerKg: Math.round(stat.value * 1000) / 1000,
    n: stat.n,
    rejected: stat.rejected,
    spread: Math.round(stat.spread * 100) / 100,
  };
  log.push(`${ref}: ${stat.value.toFixed(2)} GBP/kg from ${stat.n} rows (${stat.rejected} rejected, spread ${(stat.spread * 100).toFixed(0)}%)`);
  process.stdout.write(`\r  ${done}/${Object.keys(CATEGORIES).length}  ${Object.keys(out).length} priced   `);
  await sleep(220);
}

const stamp = new Date().toISOString().slice(0, 10);
const body = `// GENERATED — do not edit by hand. Run \`npm run prices\` to refresh.
//
// Real grocery prices from Open Prices (Open Food Facts), ODbL licensed,
// community-submitted. Snapshot taken ${stamp}.
//
// Each entry survived a median-absolute-deviation filter and needed at least
// three independent observations. \`spread\` is the interquartile range over the
// median — treat anything above ~0.6 as a wide, weakly-supported price.
//
// Coverage is deliberately partial. Ingredients absent here fall back to the
// estimate model in lib/prices.ts, and the UI labels which is which.

export interface RealPrice { gbpPerKg: number; n: number; rejected: number; spread: number }

export const PRICE_SNAPSHOT_DATE = '${stamp}';
export const PRICE_SOURCE = 'Open Prices (Open Food Facts), ODbL';

export const REAL_PRICES: Record<string, RealPrice> = ${JSON.stringify(out, null, 2)};
`;

writeFileSync('lib/price-data.ts', body);
console.log(`\n\n${Object.keys(out).length}/${Object.keys(CATEGORIES).length} ingredients got real prices\n`);
console.log(log.join('\n'));
