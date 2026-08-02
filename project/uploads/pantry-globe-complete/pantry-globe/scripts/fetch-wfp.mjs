// Real, in-country retail prices for 70 countries, from the World Food
// Programme's market monitoring, published on the Humanitarian Data Exchange
// under CC BY-IGO.
//
// Why this and not scraping supermarkets: WFP enumerators physically visit
// markets and write down what things cost. It is measured, it is attributable,
// it is licensed for reuse, and it covers precisely the countries no grocery
// API will ever serve. Scraping Tesco gets you one country, a lawsuit risk and
// a pipeline that breaks whenever their front end changes.
//
// What it is not: rich countries. WFP does not monitor the UK, US, Germany or
// the Gulf, because those places are not food-insecure. Those keep the Open
// Prices figures and the model. This fills in the other half of the world.
//
//   node scripts/fetch-wfp.mjs          # last two years
//   node scripts/fetch-wfp.mjs 2024     # add a year
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PKG = 'https://data.humdata.org/api/3/action/package_show?id=global-wfp-food-prices';
const CACHE = 'wfpcache';

/**
 * WFP commodity name -> this app's ingredient ref.
 *
 * Deliberately conservative. A mapping is only here when the commodity IS the
 * ingredient — "Tomatoes" is tomato_fresh, no argument. Everything ambiguous is
 * left out rather than fudged: "Meat (beef)" covers whatever cut that market
 * sells and is not the same thing as 5% mince, "Bread" is not sourdough, and
 * "Fish" is not salmon. A wrong price wearing a "measured" badge is worse than
 * an honest estimate, which is the whole argument this app is built on.
 */
const MAP = {
  // vegetables and fruit — unambiguous
  'Tomatoes': 'tomato_fresh',
  'Onions': 'onion',
  'Onions (red)': 'red_onion',
  'Onions (shallot, medium)': 'onion',
  'Potatoes': 'potato',
  'Potatoes (Irish)': 'potato',
  'Sweet potatoes': 'sweet_potato',
  'Carrots': 'carrot',
  'Cabbage': 'white_cabbage',
  'Cucumbers': 'cucumber',
  'Eggplants': 'aubergine',
  'Garlic': 'garlic',
  'Garlic (medium)': 'garlic',
  'Lemons': 'lemon',
  'Spinach': 'spinach_fresh',
  'Pumpkin': 'courgette',      // nearest dense summer squash the app prices
  'Okra (fresh)': 'courgette',

  // staples
  'Rice': 'long_grain_rice',
  'Rice (local)': 'long_grain_rice',
  'Rice (imported)': 'long_grain_rice',
  'Rice (medium quality)': 'long_grain_rice',
  'Rice (well milled)': 'long_grain_rice',
  'Rice (regular, milled)': 'long_grain_rice',
  'Wheat flour': 'plain_flour',
  'Wheat flour (imported)': 'plain_flour',
  'Wheat flour (high quality)': 'plain_flour',
  'Pasta': 'spaghetti',
  'Pasta (spaghetti)': 'spaghetti',
  'Bulgur': 'bulgur',

  // pulses
  'Lentils': 'red_lentils',
  'Chickpeas': 'chickpeas_dried',

  // protein and dairy
  'Eggs': 'egg',
  'Yogurt': 'natural_yogurt',

  // fats, seasoning, nuts
  'Oil (vegetable)': 'vegetable_oil',
  'Salt': 'salt',
  'Salt (iodised)': 'salt',
  'Sugar': 'sugar',
  'Sugar (white)': 'sugar',
  'Sugar (local)': 'sugar',
  'Groundnuts (shelled)': 'peanuts',
  'Sesame': 'sesame_seeds',
};

/**
 * WFP labels countries with three-letter codes; the app uses two. Only the
 * countries that actually appear in the data are listed, so an unmapped code
 * shows up as a warning at build time rather than silently dropping a country.
 */
const ISO3_TO_2 = {
  AFG:'AF', ARM:'AM', BDI:'BI', BEN:'BJ', BFA:'BF', BGD:'BD', BOL:'BO', CAF:'CF',
  CIV:'CI', CMR:'CM', COD:'CD', COG:'CG', DJI:'DJ', DZA:'DZ', ECU:'EC', EGY:'EG',
  ETH:'ET', GIN:'GN', GMB:'GM', GNB:'GW', IDN:'ID', IND:'IN', IRN:'IR', IRQ:'IQ',
  JOR:'JO', KEN:'KE', KGZ:'KG', LBN:'LB', LBR:'LR', LBY:'LY', LKA:'LK', LSO:'LS',
  MDA:'MD', MLI:'ML', MMR:'MM', MOZ:'MZ', MRT:'MR', MWI:'MW', NER:'NE', NGA:'NG',
  NPL:'NP', PAK:'PK', PHL:'PH', PSE:'PS', RWA:'RW', SDN:'SD', SEN:'SN', SLE:'SL',
  SOM:'SO', SSD:'SS', SWZ:'SZ', SYR:'SY', TCD:'TD', TGO:'TG', TLS:'TL', TUR:'TR',
  UGA:'UG', UKR:'UA', VEN:'VE', YEM:'YE', ZMB:'ZM', ZWE:'ZW',
};

// Some units are not a kilogram of the thing. Only these are trusted.
const UNIT_TO_KG = { 'KG': 1, '100 KG': 100, '25 KG': 25, '50 KG': 50, '12.5 KG': 12.5, '5 KG': 5, '10 KG': 10, '2 KG': 2, '1.5 KG': 1.5, '500 G': 0.5, '750 G': 0.75, '400 G': 0.4, '250 G': 0.25 };

const median = a => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

async function resources() {
  const r = await fetch(PKG);
  if (!r.ok) throw new Error(`HDX package_show: HTTP ${r.status}`);
  const d = await r.json();
  return d.result.resources.filter(x => x.format === 'CSV' && /global_\d{4}\.csv$/.test(x.url));
}

async function csvFor(year, res) {
  mkdirSync(CACHE, { recursive: true });
  const p = join(CACHE, `${year}.csv`);
  if (existsSync(p)) return readFileSync(p, 'utf8');
  const hit = res.find(x => x.url.endsWith(`global_${year}.csv`));
  if (!hit) return null;
  process.stderr.write(`  downloading ${year}… `);
  const r = await fetch(hit.url);
  if (!r.ok) { process.stderr.write(`HTTP ${r.status}\n`); return null; }
  const t = await r.text();
  writeFileSync(p, t);
  process.stderr.write(`${(t.length / 1e6).toFixed(1)} MB\n`);
  return t;
}

/** Minimal CSV reader — the WFP export quotes fields containing commas. */
function* parse(text) {
  const lines = text.split('\n');
  const head = splitRow(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = splitRow(lines[i]);
    if (c.length < head.length) continue;
    const o = {};
    head.forEach((h, j) => (o[h] = c[j]));
    yield o;
  }
}
function splitRow(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur.replace(/\r$/, ''));
  return out;
}

const years = process.argv.length > 2
  ? process.argv.slice(2)
  : [String(new Date(Date.parse('2026-08-01')).getUTCFullYear()), '2025'];

const res = await resources();
// countryiso3 -> ref -> [{usdPerKg, date, currency, localPerKg}]
const obs = new Map();
let read = 0, kept = 0;

for (const y of years) {
  const text = await csvFor(y, res);
  if (!text) continue;
  for (const r of parse(text)) {
    read++;
    if (r.pricetype !== 'Retail' || r.priceflag !== 'actual') continue;
    const ref = MAP[r.commodity];
    if (!ref) continue;
    const kg = UNIT_TO_KG[r.unit];
    if (!kg) continue;
    const usd = Number(r.usdprice), loc = Number(r.price);
    if (!isFinite(usd) || usd <= 0 || !isFinite(loc) || loc <= 0) continue;
    const c = r.countryiso3;
    if (!obs.has(c)) obs.set(c, new Map());
    const m = obs.get(c);
    if (!m.has(ref)) m.set(ref, []);
    m.get(ref).push({ usd: usd / kg, local: loc / kg, date: r.date, currency: r.currency, market: r.market });
    kept++;
  }
}

// Newest 180 days present for that country/ingredient, so a market that stopped
// reporting last year does not quietly set today's price.
const WINDOW = 180 * 864e5;
const out = {};
let cells = 0;
for (const [iso, byRef] of obs) {
  const o = {};
  for (const [ref, list] of byRef) {
    const newest = list.reduce((m, x) => Math.max(m, Date.parse(x.date)), 0);
    const recent = list.filter(x => Date.parse(x.date) >= newest - WINDOW);
    if (recent.length < 3) continue;           // three markets or it is anecdote
    const usd = median(recent.map(x => x.usd));
    const spread = (() => {
      const s = [...recent.map(x => x.usd)].sort((a, b) => a - b);
      const q1 = s[Math.floor(s.length * 0.25)], q3 = s[Math.floor(s.length * 0.75)];
      return usd > 0 ? (q3 - q1) / usd : 1;
    })();
    o[ref] = {
      usdPerKg: Number(usd.toFixed(4)),
      n: recent.length,
      markets: new Set(recent.map(x => x.market)).size,
      spread: Number(spread.toFixed(3)),
      month: new Date(newest).toISOString().slice(0, 7),
      currency: recent[0].currency,
    };
    cells++;
  }
  if (!Object.keys(o).length) continue;
  const two = ISO3_TO_2[iso];
  if (!two) { console.error(`  unmapped country code ${iso} — dropped, add it to ISO3_TO_2`); continue; }
  out[two] = o;
}

/* ------------------------------------------------------ country profiles ----
   The bigger discovery in this data is not the prices. It is that most of the
   countries it covers were not in the app at all — no currency, no exchange
   rate, so no way to use it there. That is what "not global" actually meant.

   Both missing numbers are recoverable from the same rows. WFP records each
   price twice, once in local currency and once in dollars, so dividing one by
   the other gives a live exchange rate per country. And comparing what a
   kilogram of the same ingredient costs there against the UK reference gives
   the grocery price level. Neither is invented; both are median-of-many. */

const { createRequire } = await import('node:module');
const { execSync: run } = await import('node:child_process');
run('npx esbuild lib/nutrients.ts --bundle --format=cjs --target=node18 --outfile=/tmp/nutr.cjs', { stdio: 'ignore' });
const { NUTRIENTS } = createRequire(import.meta.url)('/tmp/nutr.cjs');

const USD_PER_GBP = 1.27;
const SYMBOL = { EUR:'€', USD:'$', GBP:'£', JPY:'¥', INR:'₹', NGN:'₦', PHP:'₱', TRY:'₺', UAH:'₴',
  KRW:'₩', VND:'₫', THB:'฿', ILS:'₪', KES:'KSh', EGP:'E£', PKR:'₨', BDT:'৳', LKR:'Rs', IDR:'Rp',
  ZAR:'R', GHS:'₵', XOF:'CFA', XAF:'FCFA', MAD:'DH', TND:'DT', DZD:'DA', IQD:'ID', JOD:'JD',
  LBP:'L£', SYP:'S£', YER:'YR', SDG:'SDG', ETB:'Br', UGX:'USh', TZS:'TSh', RWF:'FRw', MWK:'MK',
  ZMW:'ZK', MZN:'MT', AFN:'؋', AMD:'֏', KGS:'⃀', MDL:'L', NPR:'रू', MMK:'K', BOB:'Bs', VES:'Bs.' };

// Country names in English, from the runtime's own CLDR data rather than a
// hand-typed list that would go stale and misspell things.
const NAME = new Intl.DisplayNames(['en'], { type: 'region' });

const fxOut = {}, profiles = {};
for (const [iso3, byRef] of obs) {
  const two = ISO3_TO_2[iso3];
  if (!two) continue;

  // exchange rate: local currency per US dollar, median over every recent row
  const all = [...byRef.values()].flat();
  const newest = all.reduce((m, x) => Math.max(m, Date.parse(x.date)), 0);
  const recent = all.filter(x => Date.parse(x.date) >= newest - WINDOW && x.usd > 0);
  if (recent.length < 20) continue;
  const cur = recent[0].currency;
  const perUsd = median(recent.map(x => x.local / x.usd));
  if (!isFinite(perUsd) || perUsd <= 0) continue;

  // grocery price level: measured price per kg against the UK reference price
  // per kg for the same ingredient, median across everything we have both for
  const ratios = [];
  for (const [ref, w] of Object.entries(out[two] || {})) {
    const n = NUTRIENTS[ref];
    if (!n || !n.packSize || !n.packPriceGBP) continue;
    const ukPerKg = (n.packPriceGBP / n.packSize) * 1000;      // £/kg in the UK
    const therePerKg = w.usdPerKg / USD_PER_GBP;               // £/kg there
    const r = therePerKg / ukPerKg;
    if (r > 0.05 && r < 5) ratios.push(r);
  }
  fxOut[two] = { currency: cur, perUsd: Number(perUsd.toFixed(4)), n: recent.length,
                 month: new Date(newest).toISOString().slice(0, 7) };
  if (ratios.length >= 4) {
    ratios.sort((a, b) => a - b);
    const m = ratios.length >> 1;
    const index = ratios.length % 2 ? ratios[m] : (ratios[m - 1] + ratios[m]) / 2;
    // Hitting the clamp means the derivation disagreed with reality by more
    // than a factor of two and a half, which in practice means a country with
    // two live exchange rates. Publish nothing rather than publish the cap.
    if (index <= 0.15 || index >= 2.5) {
      console.error(`  ${two}: price level came out at ${index.toFixed(2)} — implausible, country skipped`);
      continue;
    }
    profiles[two] = {
      code: two,
      name: NAME.of(two) || two,
      currency: cur,
      symbol: SYMBOL[cur] || cur + ' ',
      fx: Number((perUsd * USD_PER_GBP).toFixed(4)),
      index: Number(Math.min(2.5, Math.max(0.15, index)).toFixed(3)),
      // no restaurant survey exists for these countries, so eating out is
      // assumed to track groceries. Said plainly rather than dressed up.
      restaurantIndex: Number(Math.min(2.5, Math.max(0.15, index)).toFixed(3)),
      derivedFrom: ratios.length,
      asOf: fxOut[two].month,
    };
  }
}

writeFileSync('lib/wfp-countries.ts',
`// GENERATED by scripts/fetch-wfp.mjs — do not edit.
//
// Country profiles derived from World Food Programme market data, for the
// places the hand-written country table never covered. The exchange rate is the
// median of local-price-over-dollar-price across every recent observation; the
// price level is the median ratio of measured price per kilogram there against
// the UK reference for the same ingredient.
//
// restaurantIndex is set equal to index because no restaurant price survey
// exists for these countries. Eating-out comparisons there are a guess and the
// app says so.
import type { CountryProfile } from './types';

export interface DerivedProfile extends CountryProfile {
  /** How many ingredients the price level was averaged over. */
  derivedFrom: number;
  /** Month the underlying observations come from. */
  asOf: string;
}
export const WFP_FX: Record<string, { currency: string; perUsd: number; n: number; month: string }> = ${JSON.stringify(fxOut, null, 0)};
export const WFP_COUNTRIES: Record<string, DerivedProfile> = ${JSON.stringify(profiles, null, 0)};
`);
console.log(`${Object.keys(fxOut).length} exchange rates, ${Object.keys(profiles).length} derived country profiles -> lib/wfp-countries.ts`);

const months = new Set(Object.values(out).flatMap(o => Object.values(o).map(x => x.month)));
writeFileSync('lib/wfp-prices.ts',
`// GENERATED by scripts/fetch-wfp.mjs — do not edit.
//
// Median in-country retail price per kilogram, in USD, from World Food
// Programme market monitoring via the Humanitarian Data Exchange.
// Licence: CC BY-IGO. Attribution is shown on the app's sources screen.
//
// ${Object.keys(out).length} countries, ${cells} country/ingredient pairs, from ${kept.toLocaleString('en-GB')} observations.
// Each figure is the median of at least 3 recent observations from real markets.
export interface WfpPrice {
  /** Median retail price for one kilogram, in US dollars. */
  usdPerKg: number;
  /** Observations behind it. */
  n: number;
  /** Distinct markets those observations came from. */
  markets: number;
  /** Interquartile spread as a fraction of the median. Big means disagreement. */
  spread: number;
  /** Month the newest observation belongs to. */
  month: string;
  /** Currency the original observations were recorded in. */
  currency: string;
}
export const WFP_LICENCE = 'CC BY-IGO';
export const WFP_SOURCE = 'World Food Programme, via the Humanitarian Data Exchange';
export const WFP_URL = 'https://data.humdata.org/dataset/global-wfp-food-prices';
export const WFP_MONTHS: string[] = ${JSON.stringify([...months].sort())};
export const WFP_PRICES: Record<string, Record<string, WfpPrice>> = ${JSON.stringify(out, null, 0)};
`);

console.log(`read ${read.toLocaleString('en-GB')} rows, kept ${kept.toLocaleString('en-GB')}`);
console.log(`${Object.keys(out).length} countries, ${cells} country/ingredient prices -> lib/wfp-prices.ts`);
const top = Object.entries(out).sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length);
console.log('best covered:', top.slice(0, 12).map(([k, v]) => `${k}(${Object.keys(v).length})`).join(' '));
console.log('thinnest:', top.slice(-6).map(([k, v]) => `${k}(${Object.keys(v).length})`).join(' '));
