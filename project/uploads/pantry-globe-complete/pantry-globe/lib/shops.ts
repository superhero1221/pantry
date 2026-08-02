import type { IngredientRole } from './types';

/**
 * Where each kind of ingredient is actually best bought.
 *
 * "Go to a supermarket" is true and useless. The useful answer is that meat is
 * cheaper and better at a butcher, spices are a third of the price at a South
 * Asian or Middle Eastern grocer, and nobody should drive anywhere for salt.
 * These map onto OpenStreetMap `shop=` values so the finder can rank real shops
 * against what's actually on the list.
 */

export interface ShopHint {
  /** OSM shop values that sell this well, best first. */
  osm: string[];
  label: string;
  why?: string;
}

export const ROLE_SHOPS: Record<IngredientRole, ShopHint> = {
  protein: {
    osm: ['butcher', 'seafood', 'supermarket'],
    label: 'Butcher or fishmonger',
    why: 'Usually cheaper per kilo than a supermarket and cut to order. Independent butchers also handle halal.',
  },
  vegetable: {
    osm: ['greengrocer', 'marketplace', 'supermarket'],
    label: 'Greengrocer or market',
    why: 'Markets are markedly cheaper for loose vegetables and you can buy the amount you need rather than a bagged 500 g.',
  },
  fruit: {
    osm: ['greengrocer', 'marketplace', 'supermarket'],
    label: 'Greengrocer or market',
  },
  aromatic: {
    osm: ['greengrocer', 'marketplace', 'supermarket'],
    label: 'Greengrocer or market',
    why: 'Garlic, ginger and chillies cost a fraction of the supermarket packet price loose.',
  },
  spice: {
    osm: ['grocery', 'supermarket'],
    label: 'World-food grocer',
    why: 'The single biggest saving in the whole shop. A 100 g bag at a South Asian or Middle Eastern grocer costs about what a 30 g supermarket jar does.',
  },
  pulse: {
    osm: ['grocery', 'supermarket'],
    label: 'World-food grocer',
    why: 'Lentils, chickpeas and beans are far cheaper in 1 kg bags than in tins or small packets.',
  },
  starch: {
    osm: ['grocery', 'supermarket'],
    label: 'Supermarket or world-food grocer',
    why: 'Rice especially — a 5 kg bag at an Asian grocer beats supermarket 1 kg boxes by a wide margin.',
  },
  dairy: { osm: ['supermarket', 'convenience'], label: 'Supermarket' },
  fat: { osm: ['supermarket', 'grocery'], label: 'Supermarket' },
  nut: {
    osm: ['grocery', 'supermarket', 'health_food'],
    label: 'World-food grocer',
    why: 'Nuts and seeds are sold loose or in large bags for much less than supermarket snack packs.',
  },
  acid: { osm: ['supermarket', 'greengrocer'], label: 'Supermarket' },
  liquid: { osm: ['supermarket'], label: 'Supermarket' },
  sweetener: { osm: ['supermarket'], label: 'Supermarket' },
  condiment: {
    osm: ['grocery', 'supermarket'],
    label: 'Supermarket or world-food grocer',
    why: 'Soy sauce, fish sauce and tahini are cheaper and better at an East Asian or Middle Eastern grocer.',
  },
};

/** Human label for an OSM shop value. */
export const SHOP_LABEL: Record<string, string> = {
  supermarket: 'Supermarket',
  convenience: 'Convenience store',
  grocery: 'Grocer',
  greengrocer: 'Greengrocer',
  butcher: 'Butcher',
  seafood: 'Fishmonger',
  deli: 'Deli',
  marketplace: 'Market',
  health_food: 'Health food shop',
  wholesale: 'Wholesaler',
  farm: 'Farm shop',
};

export interface ShopPlanLine {
  kind: string;
  label: string;
  why?: string;
  items: { name: string; price: number }[];
  total: number;
}

/**
 * Group a basket by where each line is best bought, and rank the groups by how
 * much money is at stake — the point is to tell someone which single detour is
 * worth making, not to send them to five shops.
 */
export function shoppingRoute(
  items: { name: string; role: IngredientRole; packPrice: number }[],
): ShopPlanLine[] {
  const groups = new Map<string, ShopPlanLine>();
  for (const it of items) {
    const hint = ROLE_SHOPS[it.role] ?? ROLE_SHOPS.starch;
    const kind = hint.osm[0];
    let g = groups.get(kind);
    if (!g) {
      g = { kind, label: hint.label, why: hint.why, items: [], total: 0 };
      groups.set(kind, g);
    }
    g.items.push({ name: it.name, price: it.packPrice });
    g.total += it.packPrice;
  }
  for (const g of groups.values()) g.items.sort((a, b) => b.price - a.price);
  return [...groups.values()].sort((a, b) => b.total - a.total);
}
