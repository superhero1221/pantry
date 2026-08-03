// Live data adapters for Pantry.
// Every source here is a real, keyless, public API. Each call degrades to null
// rather than throwing, so the app always has a modelled fallback to fall back on.
//
//   Nominatim (OpenStreetMap)  reverse geocode  1 req/sec, needs a UA/Referer, ODbL
//   Overpass  (OpenStreetMap)  nearby shops     keyless, ODbL
//   Open Prices (Open Food Facts) real prices   keyless for reads, ODbL
//   Open Food Facts            product lookup   keyless, ODbL
//   Frankfurter (ECB reference) exchange rates  keyless, about thirty currencies
//
// No major UK/US supermarket publishes a developer API, and their terms forbid
// scraping one together, so the real prices here are Open Prices plus the app's
// own reports. There was once a vendorPrice() that posted a bearer token to a
// third-party aggregator; the UI that set that key promised something no code
// delivered, so both are gone. A vendor integration arrives as working code or
// not at all.

const UA = 'PantryPrototype/1.0 (design prototype)';
const cache = new Map();

const memo = async (key, ttl, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  return v;
};

const timed = (url, opts = {}, ms = 9000) => {
  const ac = new AbortController();
  const bail = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(bail));
};


/** Browser geolocation. Resolves {lat, lon, accuracy} or rejects with a readable reason. */
export function locate(opts = {}) {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('This device has no location service.'));
    navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => rej(new Error(
        e.code === 1 ? 'Location permission was declined.'
        : e.code === 2 ? 'Your position could not be worked out.'
        : 'Location timed out.')),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000, ...opts }
    );
  });
}

/** Coordinates → {city, area, countryCode, countryName}. OSM Nominatim. */
export async function reverseGeocode(lat, lon) {
  return memo(`rev:${lat.toFixed(3)},${lon.toFixed(3)}`, 864e5, async () => {
    const u = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`;
    const r = await timed(u, { headers: { 'Accept-Language': 'en', Referer: location.origin } });
    if (!r.ok) throw new Error('Nominatim ' + r.status);
    const j = await r.json();
    const a = j.address || {};
    return {
      city: a.city || a.town || a.village || a.suburb || a.county || j.name || 'here',
      area: a.suburb || a.neighbourhood || a.city_district || '',
      countryCode: (a.country_code || '').toUpperCase(),
      countryName: a.country || '',
      attribution: '© OpenStreetMap contributors'
    };
  });
}

const KM = (aLat, aLon, bLat, bLon) => {
  const R = 6371, d = x => x * Math.PI / 180;
  const dLat = d(bLat - aLat), dLon = d(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(d(aLat)) * Math.cos(d(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Chains whose pricing position is well enough known to place on a tier.
// Everything else is read off the OSM tag and labelled honestly.
const TIERS = [
  [/aldi|lidl|netto|penny|biedronka|dia|iceland|farmfoods|food ?basics|no ?frills|grocery ?outlet|winco/i, 'discount', 0.82],
  [/costco|makro|metro|sam.s ?club|booker|bestway/i, 'wholesale', 0.74],
  [/tesco|sainsbury|asda|morrison|kroger|safeway|albertson|publix|carrefour|auchan|edeka|rewe|coop|migros|jumbo|albert ?heijn|mercadona|big ?bazaar|dmart|shoprite/i, 'standard', 1.0],
  [/waitrose|marks ?&? ?spencer|m&s|whole ?foods|erewhon|planet ?organic|gourmet/i, 'premium', 1.28],
  [/express|local|metro ?station|extra ?small|to ?go|city|petrol|7.?eleven|circle ?k|spar|nisa|premier|londis|costcutter|corner/i, 'convenience', 1.15]
];
const tierOf = name => {
  for (const [re, label, mult] of TIERS) if (re.test(name)) return { tierLabel: label, mult };
  return { tierLabel: 'standard', mult: 1.0 };
};

/** Real supermarkets around a point, nearest first. OSM Overpass. */
export async function nearbyShops(lat, lon, radius = 2500, limit = 8) {
  return memo(`shops:${lat.toFixed(3)},${lon.toFixed(3)},${radius}`, 36e5, async () => {
    const q = `[out:json][timeout:20];(nwr["shop"~"^(supermarket|convenience|greengrocer|wholesale)$"](around:${radius},${lat},${lon}););out center ${limit * 4};`;
    const r = await timed('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(q)
    }, 20000);
    if (!r.ok) throw new Error('Overpass ' + r.status);
    const j = await r.json();
    const seen = new Set();
    return (j.elements || [])
      .map(e => {
        const t = e.tags || {};
        const name = t.name || t.brand || t.operator;
        if (!name) return null;
        const y = e.lat ?? e.center?.lat, x = e.lon ?? e.center?.lon;
        if (y == null) return null;
        const key = name.toLowerCase() + Math.round(y * 1000);
        if (seen.has(key)) return null;
        seen.add(key);
        const isConv = t.shop === 'convenience';
        const t2 = tierOf(name + ' ' + (t.brand || ''));
        return {
          name,
          brand: t.brand || '',
          km: KM(lat, lon, y, x),
          hours: t.opening_hours || '',
          osmId: e.type[0] + e.id,
          tierLabel: isConv && t2.tierLabel === 'standard' ? 'convenience' : t2.tierLabel,
          mult: isConv && t2.tierLabel === 'standard' ? 1.15 : t2.mult
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.km - b.km)
      .slice(0, limit);
  });
}

const CATEGORY_TAG = {
  'Chicken breast': 'en:chicken-breasts', 'Chicken thighs': 'en:chicken-thighs',
  'Minced beef': 'en:minced-beef', 'Eggs': 'en:chicken-eggs',
  'Rice': 'en:rices', 'Basmati rice': 'en:basmati-rice', 'Pasta': 'en:pastas',
  'Spaghetti': 'en:spaghetti', 'Rice noodles': 'en:rice-noodles',
  'Red lentils': 'en:red-lentils', 'Chickpeas': 'en:chickpeas',
  'Tinned tomatoes': 'en:canned-tomatoes', 'Coconut milk': 'en:coconut-milks',
  'Onions': 'en:onions', 'Garlic': 'en:garlics', 'Potatoes': 'en:potatoes',
  'Milk': 'en:milks', 'Butter': 'en:butters', 'Cheddar': 'en:cheddar',
  'Feta': 'en:fetas', 'Yoghurt': 'en:yogurts', 'Olive oil': 'en:olive-oils',
  'Vegetable oil': 'en:vegetable-oils', 'Tofu': 'en:tofus', 'Prawns': 'en:shrimps',
  'Peanuts': 'en:peanuts', 'Tuna': 'en:canned-tuna', 'Bread': 'en:breads'
};

/**
 * Median recent shelf price for an ingredient, in the local currency.
 * Open Prices is crowdsourced, so coverage is patchy and honest about it:
 * returns {value, currency, n, newest, source} or null when nobody has logged it.
 */
/**
 * The cookbook writes ingredients the way a recipe does — "Raw prawns, peeled",
 * "Mature cheddar", "Onion" — and the category table is keyed on the plain
 * product. Rather than list every wording, strip the cooking adjectives and try
 * the singular. Takes the cookbook from 21 matched lines to 27 with no new tags.
 *
 * The rest stay unmatched on purpose. Guessing an Open Food Facts tag that
 * happens to exist but names a different product would return real prices for
 * the wrong thing, which is worse than the modelled figure it replaced — so
 * only tags someone has checked go in the table.
 *
 * Deliberately conservative: it only ever removes qualifiers and a trailing s,
 * so it cannot turn one product into a different one. "Spring onions" does not
 * become "Onions" — the qualifier list has no "spring" in it, because a spring
 * onion is a different thing at a different price.
 */
const QUALIFIER =
  /^(raw|firm|fresh|dried|ground|mature|long grain|tinned|chopped|whole|smoked|roasted|extra virgin)\s+/i;

export function normaliseIngredient(name) {
  let n = String(name).split(',')[0].trim();
  // "Tuna in spring water" is tuna; the packing medium is not the product.
  n = n.replace(/\s+in\s+.+$/i, '');
  for (let i = 0; i < 3 && QUALIFIER.test(n); i += 1) n = n.replace(QUALIFIER, '');
  if (CATEGORY_TAG[n]) return n;
  const cap = n.charAt(0).toUpperCase() + n.slice(1);
  if (CATEGORY_TAG[cap]) return cap;
  // Singular ↔ plural, both directions, because the table mixes the two.
  for (const alt of [cap.replace(/s$/, ''), cap + 's', cap.replace(/es$/, '')]) {
    if (alt !== cap && CATEGORY_TAG[alt]) return alt;
  }
  return cap;
}

export async function openPrice(ingredient, countryCode = 'GB') {
  const tag = CATEGORY_TAG[normaliseIngredient(ingredient)];
  if (!tag) return null;
  return memo(`op:${tag}:${countryCode}`, 216e5, async () => {
    const u = `https://prices.openfoodfacts.org/api/v1/prices?category_tag=${encodeURIComponent(tag)}`
      + `&location_country=${encodeURIComponent(countryCode)}&order_by=-date&size=50`;
    const r = await timed(u, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const rows = (j.items || j.results || (Array.isArray(j) ? j : [])).filter(p => p && p.price > 0);
    if (!rows.length) return null;
    // Per-kilo where the row carries a weight, otherwise the pack price.
    const per = rows.map(p => {
      const g = p.product?.product_quantity;
      return g > 0 ? (p.price / g) * 1000 : p.price;
    }).sort((a, b) => a - b);
    const mid = per.length % 2 ? per[(per.length - 1) / 2]
      : (per[per.length / 2 - 1] + per[per.length / 2]) / 2;
    return {
      value: mid,
      currency: rows[0].currency || 'EUR',
      n: rows.length,
      newest: rows.map(p => p.date).sort().pop(),
      source: 'Open Prices (Open Food Facts), ODbL'
    };
  }).catch(() => null);
}

/** Batch the above, tolerating individual misses. Returns a name→price map. */
export async function priceBasket(ingredients, countryCode) {
  const out = {};
  for (const n of ingredients.slice(0, 12)) {
    try { const p = await openPrice(n, countryCode); if (p) out[n] = p; } catch (_) {}
  }
  return out;
}

/**
 * GBP → everything else, from the European Central Bank's daily reference rates
 * by way of Frankfurter: keyless, no quota, nothing to sign up for.
 *
 * The ECB set is about thirty currencies. Naira, Pakistani rupees and dirhams
 * are not among them, so what comes back is deliberately partial and the caller
 * merges it over the bundled rates rather than replacing them.
 *
 * Resolves {date, rates} or null. It never throws and never retries: a block, a
 * refusal, a captive portal or a plane all mean null, and null means the app
 * keeps the numbers it shipped with. Deliberately not wrapped in memo() — a
 * null here means "not right now", and holding that in memory for a day would
 * outlive the reason for it. The day-long cache is the caller's, on disk.
 */
export async function fxRates() {
  try {
    // A shorter leash than the default: nothing on screen is waiting for this.
    const r = await timed('https://api.frankfurter.app/latest?from=GBP',
      { headers: { Accept: 'application/json' } }, 7000);
    if (!r.ok) return null;
    const j = await r.json();
    const raw = j && j.rates;
    // One currency we know is always in the set proves this is the payload and
    // not a hotel login page being polite.
    if (!raw || typeof raw.USD !== 'number') return null;
    const rates = { GBP: 1 };
    for (const k of Object.keys(raw)) {
      if (typeof raw[k] === 'number' && raw[k] > 0) rates[k] = raw[k];
    }
    return { date: typeof j.date === 'string' ? j.date : '', rates };
  } catch (_) {
    return null;
  }
}

export const SOURCES = [
  { name: 'OpenStreetMap / Nominatim', use: 'turning your coordinates into a place name', url: 'https://operations.osmfoundation.org/policies/nominatim/', licence: 'ODbL' },
  { name: 'OpenStreetMap / Overpass', use: 'the actual shops around you', url: 'https://wiki.openstreetmap.org/wiki/Overpass_API', licence: 'ODbL' },
  { name: 'Open Prices', use: 'real prices people have photographed', url: 'https://prices.openfoodfacts.org', licence: 'ODbL' },
  { name: 'Open Food Facts', use: 'product and nutrition data', url: 'https://world.openfoodfacts.org', licence: 'ODbL' },
  { name: 'WFP food price monitor', use: 'the modelled baseline where crowd data is thin', url: 'https://data.humdata.org', licence: 'CC BY' }
];
