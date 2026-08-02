import { Store } from './types';

type Tier = Store['tierLabel'];

const MULT: Record<Tier, number> = {
  discount: 0.82,
  independent: 0.88,
  standard: 1.0,
  convenience: 1.15,
  premium: 1.35,
};

// Brand → tier. Lowercased substring match. Global coverage of the majors.
const BRANDS: [string, Tier][] = [
  // discounters
  ['aldi', 'discount'], ['lidl', 'discount'], ['netto', 'discount'], ['penny', 'discount'],
  ['norma', 'discount'], ['biedronka', 'discount'], ['dia', 'discount'], ['willys', 'discount'],
  ['kaufland', 'discount'], ['action', 'discount'], ['profi', 'discount'], ['mere', 'discount'],
  ['grocery outlet', 'discount'], ['food basics', 'discount'], ['no frills', 'discount'],
  ['b&m', 'discount'], ['iceland', 'discount'], ['farmfoods', 'discount'], ['jumbo', 'discount'],
  // premium
  ['waitrose', 'premium'], ['marks & spencer', 'premium'], ['m&s ', 'premium'],
  ['whole foods', 'premium'], ['erewhon', 'premium'], ['bio', 'premium'], ['organic', 'premium'],
  ['fortnum', 'premium'], ['harrods', 'premium'], ['dean & deluca', 'premium'],
  // convenience (check BEFORE standard so "tesco express" beats "tesco")
  ['express', 'convenience'], ['local', 'convenience'], ['7-eleven', 'convenience'],
  ['seven eleven', 'convenience'], ['circle k', 'convenience'], ['spar', 'convenience'],
  ['co-op', 'convenience'], ['coop pronto', 'convenience'], ['oxxo', 'convenience'],
  ['familymart', 'convenience'], ['lawson', 'convenience'], ['one stop', 'convenience'],
  ['nisa', 'convenience'], ['premier', 'convenience'], ['costcutter', 'convenience'],
  ['ampm', 'convenience'], ['minimarket', 'convenience'], ['mini market', 'convenience'],
  ['zabka', 'convenience'], ['żabka', 'convenience'], ['pressbyrån', 'convenience'],
  // standard chains
  ['tesco', 'standard'], ['sainsbury', 'standard'], ['asda', 'standard'], ['morrisons', 'standard'],
  ['carrefour', 'standard'], ['auchan', 'standard'], ['intermarch', 'standard'], ['leclerc', 'standard'],
  ['casino', 'standard'], ['monoprix', 'standard'], ['rewe', 'standard'], ['edeka', 'standard'],
  ['albert heijn', 'standard'], ['delhaize', 'standard'], ['colruyt', 'standard'],
  ['ica', 'standard'], ['coop', 'standard'], ['hemköp', 'standard'], ['city gross', 'standard'],
  ['rema', 'standard'], ['kiwi', 'standard'], ['meny', 'standard'], ['bilka', 'standard'],
  ['fakta', 'standard'], ['s-market', 'standard'], ['k-market', 'standard'], ['prisma', 'standard'],
  ['mercadona', 'standard'], ['eroski', 'standard'], ['consum', 'standard'], ['continente', 'standard'],
  ['pingo doce', 'standard'], ['conad', 'standard'], ['esselunga', 'standard'], ['coop italia', 'standard'],
  ['migros', 'standard'], ['denner', 'standard'], ['billa', 'standard'], ['hofer', 'standard'],
  ['kroger', 'standard'], ['safeway', 'standard'], ['albertsons', 'standard'], ['publix', 'standard'],
  ['walmart', 'standard'], ['target', 'standard'], ['trader joe', 'standard'], ['heb', 'standard'],
  ['loblaws', 'standard'], ['sobeys', 'standard'], ['metro', 'standard'], ['iga', 'standard'],
  ['woolworths', 'standard'], ['coles', 'standard'], ['countdown', 'standard'], ['new world', 'standard'],
  ['pak\'nsave', 'standard'], ['foodstuffs', 'standard'],
  ['lulu', 'standard'], ['carrefour city', 'standard'], ['sultan center', 'standard'],
  ['city centre', 'standard'], ['union coop', 'standard'], ['othaim', 'standard'], ['panda', 'standard'],
  ['tamimi', 'standard'], ['danube', 'standard'], ['spinneys', 'standard'], ['choithrams', 'standard'],
  ['big bazaar', 'standard'], ['dmart', 'standard'], ['reliance', 'standard'], ['more', 'standard'],
  ['aeon', 'standard'], ['ito yokado', 'standard'], ['tesco lotus', 'standard'], ['big c', 'standard'],
  ['makro', 'standard'], ['ntuc', 'standard'], ['fairprice', 'standard'], ['cold storage', 'standard'],
  ['giant', 'standard'], ['vinmart', 'standard'], ['winmart', 'standard'], ['bach hoa xanh', 'standard'],
  ['shoprite', 'standard'], ['pick n pay', 'standard'], ['checkers', 'standard'], ['spar group', 'standard'],
  ['soriana', 'standard'], ['chedraui', 'standard'], ['la comer', 'standard'], ['bodega', 'standard'],
  ['pão de açúcar', 'standard'], ['carrefour bairro', 'standard'], ['jumbo argentina', 'standard'],
  ['migros turk', 'standard'], ['bim', 'standard'], ['a101', 'standard'], ['sok', 'standard'],
  ['pyaterochka', 'standard'], ['magnit', 'standard'], ['perekrestok', 'standard'],
  ['emart', 'standard'], ['lotte mart', 'standard'], ['homeplus', 'standard'],
];

export function classify(name: string, osmShop: string): { tier: number; tierLabel: Tier } {
  const n = name.toLowerCase();
  // convenience/premium/discount markers win over the base chain name
  for (const pass of ['premium', 'discount', 'convenience', 'standard'] as Tier[]) {
    for (const [key, tier] of BRANDS) {
      if (tier === pass && n.includes(key)) return { tier: MULT[tier], tierLabel: tier };
    }
  }
  const byShop: Record<string, Tier> = {
    supermarket: 'standard',
    convenience: 'convenience',
    grocery: 'independent',
    greengrocer: 'independent',
    butcher: 'independent',
    seafood: 'independent',
    deli: 'premium',
    marketplace: 'independent',
    farm: 'independent',
    health_food: 'premium',
    wholesale: 'discount',
  };
  const t = byShop[osmShop] ?? 'standard';
  return { tier: MULT[t], tierLabel: t };
}

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const KIND_LABEL: Record<string, string> = {
  supermarket: 'Supermarket',
  convenience: 'Convenience store',
  grocery: 'Grocery',
  greengrocer: 'Greengrocer',
  butcher: 'Butcher',
  seafood: 'Fishmonger',
  deli: 'Deli',
  marketplace: 'Market',
  farm: 'Farm shop',
  health_food: 'Health food',
  wholesale: 'Wholesale',
};

export type { Store };
