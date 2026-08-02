/**
 * Scanning a barcode, and getting a photograph of the actual thing.
 *
 * Every attempt at "real food images" so far went looking for a stock
 * photograph of a generic tomato, and produced Victorian engravings, a coin
 * labelled lemon, and a plate of profiteroles labelled spinach. The premise was
 * wrong. The realest possible image of the food someone is about to buy is the
 * photograph of the exact product in their hand, and Open Food Facts already
 * has millions of them, contributed by the people who bought them.
 *
 * So the camera is the image source. Scan the barcode and you get that product's
 * own photograph, its own label nutrition, and — through Open Prices — what
 * other people have paid for it. Nothing here is generic, modelled or
 * illustrated.
 */

export interface ScannedProduct {
  code: string;
  name: string;
  brand: string;
  /** Pack size as printed, e.g. "400 g". */
  quantity: string;
  /** Photograph of this exact product, from Open Food Facts. */
  image: string | null;
  /** Per 100 g, straight off the label. Nulls where the label does not say. */
  per100: {
    kcal: number | null; protein: number | null; carb: number | null;
    fat: number | null; fibre: number | null; sodium: number | null; salt: number | null;
  };
  nutriscore: string | null;
  novaGroup: number | null;
  categories: string[];
  /** Grams in the pack, parsed from `quantity` where possible. */
  packGrams: number | null;
}

const OFF = 'https://world.openfoodfacts.org/api/v2';

/**
 * Every network call gets a deadline.
 *
 * Without one, a request that hangs rather than fails leaves the screen on
 * "Looking it up…" forever — which is exactly what happens on a weak signal in
 * a supermarket, the only place this feature is ever used. Failing after ten
 * seconds with an explanation beats waiting indefinitely for one that will
 * never come.
 */
async function get(url: string, ms = 10000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { signal: c.signal });
  } finally {
    clearTimeout(t);
  }
}

const num = (v: unknown): number | null => (typeof v === 'number' && isFinite(v) ? v : null);

/** "400 g", "1.5 l", "2 x 200g" → grams. Returns null rather than guessing. */
export function parseQuantity(q: string): number | null {
  if (!q) return null;
  const s = q.toLowerCase().replace(',', '.');
  const multi = s.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l)\b/);
  if (multi) {
    const each = parseFloat(multi[2]) * unit(multi[3]);
    return each ? parseFloat(multi[1]) * each : null;
  }
  const m = s.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cl)\b/);
  if (!m) return null;
  const u = unit(m[2]);
  return u ? parseFloat(m[1]) * u : null;
}
const unit = (u: string) => ({ g: 1, kg: 1000, ml: 1, l: 1000, cl: 10 }[u] ?? 0);

export async function lookup(code: string): Promise<ScannedProduct | null> {
  const clean = code.replace(/\D/g, '');
  if (clean.length < 8) throw new Error('That does not look like a barcode — they are 8 to 14 digits.');
  const fields = [
    'code', 'product_name', 'brands', 'quantity', 'image_front_small_url', 'image_front_url',
    'nutriments', 'nutriscore_grade', 'nova_group', 'categories_tags',
  ].join(',');
  let r: Response;
  try {
    r = await get(`${OFF}/product/${clean}.json?fields=${fields}`);
  } catch {
    // Offline, or a network that blocks it. Everything else in this app works
    // without a connection, so say which part needs one rather than failing flat.
    throw new Error('Could not reach Open Food Facts. Scanning is the one part of this app that needs a connection — everything else still works.');
  }
  if (!r.ok) throw new Error(`Open Food Facts did not answer (${r.status}).`);
  const j = await r.json();
  if (j.status === 0 || !j.product) return null;
  const p = j.product;
  const n = p.nutriments ?? {};
  const q = p.quantity ?? '';
  const sodium = num(n.sodium_100g);
  const salt = num(n.salt_100g);
  return {
    code: clean,
    name: p.product_name || 'Unnamed product',
    brand: p.brands || '',
    quantity: q,
    image: p.image_front_small_url || p.image_front_url || null,
    per100: {
      kcal: num(n['energy-kcal_100g']),
      protein: num(n.proteins_100g),
      carb: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
      fibre: num(n.fiber_100g),
      // labels give one or the other; derive the missing one rather than showing a gap
      sodium: sodium != null ? sodium * 1000 : salt != null ? (salt * 1000) / 2.5 : null,
      salt: salt != null ? salt : sodium != null ? sodium * 2.5 : null,
    },
    nutriscore: p.nutriscore_grade || null,
    novaGroup: num(p.nova_group),
    categories: (p.categories_tags ?? []).slice(0, 6),
    packGrams: parseQuantity(q),
  };
}

export interface KnownPrice {
  price: number;
  currency: string;
  date: string;
  where: string | null;
}

/**
 * What people have actually paid for this exact barcode.
 *
 * Bounded to the last year and to the requested currency, because a price from
 * two countries and three years ago is worse than no price at all — it looks
 * like data while being noise.
 */
export async function pricesFor(code: string, currency: string, limit = 5): Promise<KnownPrice[]> {
  let r: Response;
  try {
    r = await get(`https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(code)}&order_by=-date&size=${limit}`);
  } catch {
    return [];   // a missing price is a gap, not a failure worth interrupting for
  }
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return (j?.items ?? [])
    .filter((i: Record<string, unknown>) => i.currency === currency && typeof i.date === 'string' && new Date(i.date as string) >= cutoff)
    .map((i: Record<string, unknown>) => ({
      price: Number(i.price),
      currency: String(i.currency),
      date: String(i.date),
      where: (i.location as Record<string, unknown> | null)?.osm_name as string ?? null,
    }));
}

/** Which of our ingredients a scanned product most likely is, if any. */
export function guessIngredient(p: ScannedProduct, offCategory: Record<string, string>): string | null {
  const tags = new Set(p.categories);
  for (const [ref, cat] of Object.entries(offCategory)) if (tags.has(cat)) return ref;
  return null;
}
