import type { CountryProfile } from './types';

/**
 * Contributing a price back to Open Prices.
 *
 * The app reads from Open Prices, which is ODbL — a licence that asks you to
 * share back. Reading a community dataset for years without adding to it is
 * both poor form and, for this product specifically, self-defeating: the share
 * of the basket that is measured rather than modelled only rises if someone
 * measures more, and nobody else is going to measure a Kuwaiti spice shop.
 *
 * Two design constraints, neither negotiable:
 *
 * The user's Open Food Facts password is theirs. It goes from their browser
 * straight to the Open Food Facts auth endpoint and nowhere else — not to a
 * server of ours, not to storage. Only the returned token is kept, in memory,
 * for the session. There is no server in this app to send it to, and that
 * should stay true.
 *
 * Open Prices requires a photograph as proof for every submission. That is not
 * an obstacle to route around, it is the reason the dataset is worth reading:
 * a price with a picture of the shelf edge behind it can be checked by someone
 * else later. So the flow asks for the photo rather than trying to avoid it.
 */

export const OP_BASE = 'https://prices.openfoodfacts.org/api/v1';

export interface OpSession { token: string; username: string }

/** Exchange Open Food Facts credentials for a bearer token. Nothing is stored. */
export async function signIn(username: string, password: string): Promise<OpSession> {
  const body = new URLSearchParams({ username, password });
  const r = await fetch(`${OP_BASE}/auth?set_cookie=0`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (r.status === 401 || r.status === 403) throw new Error('Open Food Facts did not accept that username and password.');
  if (!r.ok) throw new Error(`Open Food Facts sign-in failed (${r.status}).`);
  const j = await r.json().catch(() => null);
  const token = j && (j.access_token || j.token);
  if (!token) throw new Error('Signed in, but no token came back.');
  return { token, username };
}

/** Upload the shelf-edge or receipt photo. Returns the proof id the price needs. */
export async function uploadProof(session: OpSession, file: Blob, kind: 'PRICE_TAG' | 'RECEIPT' = 'PRICE_TAG'): Promise<number> {
  const fd = new FormData();
  fd.append('file', file, 'proof.jpg');
  fd.append('type', kind);
  const r = await fetch(`${OP_BASE}/proofs/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}` },
    body: fd,
  });
  if (!r.ok) throw new Error(`The photo would not upload (${r.status}).`);
  const j = await r.json();
  if (!j || typeof j.id !== 'number') throw new Error('The photo uploaded but no proof id came back.');
  return j.id;
}

export interface PriceReport {
  /** Open Food Facts category, e.g. en:tomatoes. Used for loose produce. */
  categoryTag?: string;
  /** Barcode, for a packaged product. One of this or categoryTag is required. */
  productCode?: string;
  price: number;
  currency: string;
  /** KILOGRAM for loose produce sold by weight, UNIT for a pack. */
  pricePer: 'KILOGRAM' | 'UNIT';
  /** YYYY-MM-DD. */
  date: string;
  /** The shop, as OpenStreetMap already identified it for the shop finder. */
  osmId: number;
  osmType: 'NODE' | 'WAY' | 'RELATION';
  proofId: number;
  comment?: string;
}

export async function submitPrice(session: OpSession, p: PriceReport): Promise<number> {
  if (!p.categoryTag && !p.productCode) throw new Error('A price needs either a category or a barcode.');
  const payload: Record<string, unknown> = {
    price: p.price,
    currency: p.currency,
    date: p.date,
    location_osm_id: p.osmId,
    location_osm_type: p.osmType,
    proof_id: p.proofId,
  };
  if (p.categoryTag) { payload.category_tag = p.categoryTag; payload.price_per = p.pricePer; }
  if (p.productCode) payload.product_code = p.productCode;
  if (p.comment) payload.owner_comment = p.comment;

  const r = await fetch(`${OP_BASE}/prices`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Open Prices rejected it (${r.status}). ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.id;
}

/**
 * Ingredient to Open Food Facts category.
 *
 * Only ingredients whose category exists in the OFF taxonomy are offered for
 * contribution. Guessing a tag would produce a submission that is accepted and
 * then filed under nothing, which pollutes a dataset other people rely on —
 * worse than not contributing at all.
 */
export const OFF_CATEGORY: Record<string, string> = {
  tomato_fresh: 'en:tomatoes', cucumber: 'en:cucumbers', carrot: 'en:carrots',
  onion: 'en:onions', red_onion: 'en:red-onions', garlic: 'en:garlics',
  potato: 'en:potatoes', sweet_potato: 'en:sweet-potatoes', courgette: 'en:zucchini',
  aubergine: 'en:aubergines', red_pepper: 'en:red-bell-peppers', mushroom: 'en:mushrooms',
  lettuce: 'en:lettuces', white_cabbage: 'en:cabbages', spinach_fresh: 'en:fresh-spinach',
  lemon: 'en:lemons', lime: 'en:limes', avocado: 'en:avocados',
  ginger: 'en:gingers', green_chilli: 'en:chili-peppers', spring_onion: 'en:spring-onions',
  basmati_rice: 'en:basmati-rice', long_grain_rice: 'en:long-grain-rice', jasmine_rice: 'en:jasmine-rice',
  spaghetti: 'en:spaghetti', couscous: 'en:couscous', plain_flour: 'en:wheat-flours',
  red_lentils: 'en:red-lentils', chickpeas_tinned: 'en:canned-chickpeas', kidney_beans_tinned: 'en:canned-kidney-beans',
  chicken_breast: 'en:chicken-breasts', chicken_thigh: 'en:chicken-thighs',
  beef_mince_5: 'en:ground-beef', salmon: 'en:salmons', prawns_raw: 'en:prawns',
  egg: 'en:chicken-eggs', milk_semi: 'en:semi-skimmed-milks', butter: 'en:butters',
  cheddar: 'en:cheddar', feta: 'en:feta', greek_yogurt: 'en:greek-yogurts',
  olive_oil: 'en:olive-oils', vegetable_oil: 'en:vegetable-oils',
  almonds: 'en:almonds', cashews: 'en:cashew-nuts', peanuts: 'en:peanuts',
  sugar: 'en:sugars', honey: 'en:honeys', tofu_firm: 'en:tofu',
  bread_sourdough: 'en:sourdough-breads', tuna_tinned: 'en:canned-tuna',
};

export const canContribute = (ref: string) => !!OFF_CATEGORY[ref];
