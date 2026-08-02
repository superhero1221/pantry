import { NUTRIENTS } from './nutrients';
import type { IngredientRole, RecipeItem } from './types';

/**
 * How food is drawn.
 *
 * The requirement is that lifting the pasta off a dish actually removes it and
 * re-points the label — which rules photography out at the first step, because
 * the pixels under the pasta do not exist. Every ingredient therefore has to be
 * its own layer, and the only way to have 122 of those without commissioning
 * 122 illustrations is to draw them procedurally: a small vocabulary of forms,
 * one colour per ingredient, and geometry generated from a seed.
 *
 * The seed is the ingredient name, so a dish looks identical every time it is
 * opened. Food that rearranges itself on each render looks like a bug, and more
 * importantly it breaks the one thing this view is for — pointing at a specific
 * piece and saying what it contributes.
 *
 * Nothing here knows about SVG. This module returns geometry; the shell decides
 * how to paint it and what to attach to it.
 */

export type Form =
  | 'pool'    // sauce, oil, liquid — spreads under everything
  | 'dome'    // mounded grain, mince
  | 'strand'  // noodles, spaghetti
  | 'slab'    // bread, tofu, a fillet
  | 'chunk'   // diced meat, cubed potato
  | 'round'   // sliced tomato, cucumber, egg
  | 'wedge'   // lemon, lime, avocado half
  | 'bean'    // pulses, peas, corn — scattered ovals
  | 'leaf'    // herbs, spinach, salad
  | 'shred'   // grated cheese, sliced cabbage
  | 'crumb';  // spice, seeds, breadcrumb — fine scatter

export interface Look {
  form: Form;
  /** Base fill. Highlight and shade are derived from it, so one colour per ingredient. */
  color: string;
  /** Stacking order on the plate, low to high. */
  z: number;
}

/** Default form and colour for anything not named below. */
const ROLE_LOOK: Record<IngredientRole, Look> = {
  liquid:    { form: 'pool',  color: '#7fb6d8', z: 0 },
  fat:       { form: 'pool',  color: '#e8c65a', z: 0 },
  condiment: { form: 'pool',  color: '#8a5a34', z: 1 },
  sweetener: { form: 'crumb', color: '#e6d5b4', z: 6 },
  starch:    { form: 'dome',  color: '#f0e4cb', z: 2 },
  pulse:     { form: 'bean',  color: '#c98f4e', z: 3 },
  vegetable: { form: 'chunk', color: '#c0453a', z: 3 },
  fruit:     { form: 'wedge', color: '#8fbf5a', z: 4 },
  protein:   { form: 'chunk', color: '#b5714a', z: 4 },
  dairy:     { form: 'shred', color: '#f4e9d2', z: 5 },
  nut:       { form: 'crumb', color: '#c9a473', z: 6 },
  aromatic:  { form: 'leaf',  color: '#4f9a4a', z: 6 },
  spice:     { form: 'crumb', color: '#a8622a', z: 7 },
  acid:      { form: 'wedge', color: '#e8d24a', z: 7 },
};

/**
 * Named overrides. Only ingredients that actually appear in the recipe set are
 * worth tuning — everything else falls through to its role and still draws.
 */
const LOOK: Record<string, Partial<Look>> = {
  // --- fats, liquids, sauces --------------------------------------------
  water: { color: '#8fc3e0' }, olive_oil: { color: '#c9c04a' }, vegetable_oil: { color: '#ead96a' },
  sesame_oil: { color: '#b8862f' }, butter: { form: 'chunk', color: '#f3d98a', z: 1 },
  ghee: { color: '#f0c862' }, soy_sauce: { color: '#4a2c1c' }, fish_sauce: { color: '#8a5f2a' },
  oyster_sauce: { color: '#3d2416' }, tahini: { form: 'pool', color: '#d9c08a', z: 1 },
  harissa: { color: '#b8341f' }, dijon_mustard: { color: '#d8b13c' },
  passata: { form: 'pool', color: '#b8382c', z: 1 }, tomato_puree: { form: 'pool', color: '#9e2b1f', z: 1 },
  coconut_milk: { form: 'pool', color: '#f2f0e8', z: 1 }, lingonberry_jam: { form: 'pool', color: '#a01f3c', z: 5 },
  tamarind_paste: { form: 'pool', color: '#6b3a1e', z: 1 }, honey: { form: 'pool', color: '#e0a02a', z: 5 },
  stock_cube_beef: { form: 'crumb', color: '#7a4a24' }, stock_cube_chicken: { form: 'crumb', color: '#c9a25c' },
  stock_cube_veg: { form: 'crumb', color: '#9aa83c' },
  vinegar_white: { form: 'pool', color: '#e8e4d0', z: 1 }, vinegar_rice: { form: 'pool', color: '#e0dcc4', z: 1 },

  // --- starches ----------------------------------------------------------
  basmati_rice: { form: 'dome', color: '#f6efe0' }, long_grain_rice: { form: 'dome', color: '#f4ecdc' },
  jasmine_rice: { form: 'dome', color: '#f7f1e4' }, couscous: { form: 'dome', color: '#e8d5a8' },
  spaghetti: { form: 'strand', color: '#edd68f' }, rice_noodles: { form: 'strand', color: '#f0ece0' },
  bread_sourdough: { form: 'slab', color: '#d9a962' }, flatbread: { form: 'slab', color: '#e3c288' },
  tortilla_corn: { form: 'slab', color: '#eccf87' }, potato: { form: 'chunk', color: '#e8d193' },
  sweet_potato: { form: 'chunk', color: '#d97a35' }, breadcrumbs: { form: 'crumb', color: '#d2a058' },
  plain_flour: { form: 'crumb', color: '#f2eadb' }, cornflour: { form: 'crumb', color: '#f6f2e8' },

  // --- proteins ----------------------------------------------------------
  chicken_thigh: { form: 'chunk', color: '#d9a86a' }, chicken_breast: { form: 'chunk', color: '#e6c894' },
  beef_mince_5: { form: 'dome', color: '#8a4530', z: 4 }, beef_brisket: { form: 'chunk', color: '#7d3a28' },
  beef_sirloin: { form: 'slab', color: '#8f3f2c', z: 4 }, lamb_diced: { form: 'chunk', color: '#8a3d2e' },
  guanciale: { form: 'chunk', color: '#d4767a' }, prawns_raw: { form: 'wedge', color: '#f08a6a', z: 4 },
  salmon: { form: 'slab', color: '#e8875a', z: 4 }, tuna_tinned: { form: 'shred', color: '#c9a58a', z: 4 },
  tofu_firm: { form: 'chunk', color: '#f2e8c8' }, egg: { form: 'round', color: '#f7f2e4', z: 4 },

  // --- pulses ------------------------------------------------------------
  chickpeas_tinned: { form: 'bean', color: '#d8b878' }, red_lentils: { form: 'bean', color: '#e08a45' },
  kidney_beans_tinned: { form: 'bean', color: '#8f3320' },

  // --- vegetables --------------------------------------------------------
  tomato_fresh: { form: 'round', color: '#d13a2c' }, tomato_tinned: { form: 'chunk', color: '#b8362a' },
  red_pepper: { form: 'chunk', color: '#cc2f2a' }, cucumber: { form: 'round', color: '#a8cf78' },
  carrot: { form: 'round', color: '#e07a22' }, courgette: { form: 'round', color: '#7aa84a' },
  aubergine: { form: 'chunk', color: '#5e3a72' }, mushroom: { form: 'round', color: '#c4a683' },
  spinach_fresh: { form: 'leaf', color: '#2f7a3a', z: 4 }, spinach_frozen: { form: 'leaf', color: '#2a6b34', z: 4 },
  lettuce: { form: 'leaf', color: '#7ac455', z: 5 }, white_cabbage: { form: 'shred', color: '#e2eac4', z: 4 },
  peas_frozen: { form: 'bean', color: '#5aa83c' }, sweetcorn: { form: 'bean', color: '#f0c22a' },
  beansprouts: { form: 'shred', color: '#f0f0dc', z: 4 }, olives_black: { form: 'bean', color: '#3a3038' },

  // --- dairy -------------------------------------------------------------
  feta: { form: 'chunk', color: '#f7f4ea', z: 5 }, cheddar: { form: 'shred', color: '#f0b03c' },
  parmesan: { form: 'crumb', color: '#f2e6c0', z: 6 }, pecorino: { form: 'crumb', color: '#f0e4bc', z: 6 },
  greek_yogurt: { form: 'pool', color: '#fbfaf4', z: 5 }, natural_yogurt: { form: 'pool', color: '#faf8f0', z: 5 },
  double_cream: { form: 'pool', color: '#fdfbf2', z: 5 }, milk_semi: { form: 'pool', color: '#fafaf4', z: 1 },

  // --- aromatics ---------------------------------------------------------
  garlic: { form: 'crumb', color: '#f0ead4', z: 5 }, ginger: { form: 'crumb', color: '#e0c28a', z: 5 },
  onion: { form: 'shred', color: '#f2e8d0', z: 3 }, red_onion: { form: 'shred', color: '#a45a86', z: 3 },
  spring_onion: { form: 'shred', color: '#7ec24a', z: 6 }, green_chilli: { form: 'wedge', color: '#4ea82f', z: 6 },
  scotch_bonnet: { form: 'wedge', color: '#e8a020', z: 6 },
  coriander_fresh: { form: 'leaf', color: '#4aa83f' }, parsley_fresh: { form: 'leaf', color: '#3f9636' },
  basil_fresh: { form: 'leaf', color: '#357f30' }, mint_fresh: { form: 'leaf', color: '#5ab058' },
  dill_fresh: { form: 'leaf', color: '#6aab52' }, curry_leaves: { form: 'leaf', color: '#2f7030' },

  // --- nuts --------------------------------------------------------------
  almonds: { form: 'bean', color: '#d8b48a', z: 6 }, cashews: { form: 'bean', color: '#e8d2a8', z: 6 },
  peanuts: { form: 'bean', color: '#c99a5e', z: 6 }, sesame_seeds: { form: 'crumb', color: '#eadcb8' },

  // --- spices ------------------------------------------------------------
  salt: { form: 'crumb', color: '#fbfbf8' }, black_pepper: { form: 'crumb', color: '#3a3230' },
  white_pepper: { form: 'crumb', color: '#e0d8c4' }, turmeric: { form: 'crumb', color: '#e8a512' },
  cumin_ground: { form: 'crumb', color: '#9a6528' }, coriander_ground: { form: 'crumb', color: '#b8944a' },
  paprika_smoked: { form: 'crumb', color: '#c2401c' }, kashmiri_chilli: { form: 'crumb', color: '#cc3418' },
  chilli_powder: { form: 'crumb', color: '#b52d16' }, garam_masala: { form: 'crumb', color: '#7d4a22' },
  cinnamon_ground: { form: 'crumb', color: '#8f5426' }, cardamom_green: { form: 'bean', color: '#a8bf62' },
  cloves_whole: { form: 'crumb', color: '#4a2c18' }, bay_leaf: { form: 'leaf', color: '#5a7a48' },
  saffron: { form: 'crumb', color: '#e05a10' }, nutmeg: { form: 'crumb', color: '#8a6038' },
  star_anise: { form: 'wedge', color: '#5e3a1e', z: 7 }, fenugreek_leaves: { form: 'leaf', color: '#6a8a42' },
  oregano_dried: { form: 'crumb', color: '#7a8f48' }, allspice_ground: { form: 'crumb', color: '#7a4e28' },
  baharat: { form: 'crumb', color: '#8a4a24' }, ras_el_hanout: { form: 'crumb', color: '#a05a24' },
  mustard_seeds: { form: 'crumb', color: '#c9a83c' }, loomi_dried_lime: { form: 'round', color: '#6a5a3a', z: 7 },
  sugar: { form: 'crumb', color: '#fafaf6' }, brown_sugar: { form: 'crumb', color: '#c9954e' },

  // --- acids and fruit ---------------------------------------------------
  lemon: { form: 'wedge', color: '#f2d423' }, lime: { form: 'wedge', color: '#9ec92a' },
  avocado: { form: 'wedge', color: '#8fbf4a', z: 5 },
};

export function lookOf(ref: string): Look {
  const n = NUTRIENTS[ref];
  const base = ROLE_LOOK[n?.role ?? 'starch'];
  const over = LOOK[ref];
  return over ? { ...base, ...over } : base;
}

/* --------------------------------------------------------------- geometry */

/** Deterministic per-ingredient RNG — the same dish must draw identically every time. */
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One drawn piece. Coordinates are in a 100x100 plate space. */
export interface Piece { x: number; y: number; r: number; rot: number; k: number }

export interface Layer {
  ref: string;
  name: string;
  form: Form;
  color: string;
  z: number;
  role: IngredientRole;
  grams: number;
  /** Share of the dish's total mass, 0-1 — drives how much of the plate it covers. */
  mass: number;
  pieces: Piece[];
  /** Where a label's leader line should attach. */
  anchor: { x: number; y: number };
}

/** How many pieces a form draws, scaled by how much of the dish it is. */
function pieceCount(form: Form, mass: number): number {
  const big = Math.min(1, mass * 3.2);
  switch (form) {
    case 'pool': return 1;
    case 'dome': return 1;
    case 'slab': return Math.max(1, Math.round(1 + big * 1.5));
    case 'strand': return Math.round(5 + big * 7);
    case 'chunk': return Math.round(2 + big * 6);
    case 'round': return Math.round(2 + big * 4);
    case 'wedge': return Math.round(1 + big * 2);
    case 'bean': return Math.round(4 + big * 12);
    case 'leaf': return Math.round(2 + big * 5);
    case 'shred': return Math.round(3 + big * 8);
    case 'crumb': return Math.round(3 + big * 10);
  }
}

/** Radius of one piece, in plate units. */
function pieceSize(form: Form, mass: number): number {
  const s = 0.75 + Math.min(1, mass * 2.4) * 0.55;
  switch (form) {
    // A pool has to scale like everything else. Fixed at plate-width it meant a
    // 30 g slick of oil covered the dish in a flat disc and hid the food under
    // the one ingredient nobody is looking at.
    case 'pool': return 11 + Math.min(1, mass * 5) * 19;
    case 'dome': return 26 + mass * 16;
    case 'slab': return 17 * s;
    case 'strand': return 14 * s;
    case 'chunk': return 8.2 * s;
    case 'round': return 9.0 * s;
    case 'wedge': return 11 * s;
    case 'bean': return 4.0 * s;
    case 'leaf': return 7.4 * s;
    case 'shred': return 6.4 * s;
    case 'crumb': return 2.0 * s;
  }
}

/**
 * Lay out one dish.
 *
 * Pieces are scattered inside an ellipse rather than a circle, because the plate
 * is drawn in slight perspective and a circular scatter reads as a flat disc
 * seen from directly above — which is exactly the look this view is trying not
 * to have. Higher layers sit tighter to the centre so lower ones stay visible
 * around the edge; a dish where the garnish covers the rice tells you nothing.
 */
export function plateLayers(items: RecipeItem[], opts: { spread?: number } = {}): Layer[] {
  const spread = opts.spread ?? 1;
  const usable = items.filter((i) => i.ref !== 'water' && NUTRIENTS[i.ref]);
  const total = usable.reduce((a, i) => a + i.grams, 0) || 1;

  const layers: Layer[] = usable.map((it) => {
    const n = NUTRIENTS[it.ref];
    const look = lookOf(it.ref);
    const mass = it.grams / total;
    const rnd = rng(seedOf(it.ref));
    const count = pieceCount(look.form, mass);
    const r = pieceSize(look.form, mass);

    // higher layers cluster inward
    const reach = (look.form === 'pool' ? 0 : (34 - look.z * 2.6)) * spread;
    const pieces: Piece[] = [];

    // Single-piece forms sit in the middle. Running them through the scatter put
    // the rice and the mince off to one side of the plate, which looks less like
    // a served dish than like someone knocked it.
    if (count === 1) {
      pieces.push({ x: 50, y: 52, r: r, rot: 0, k: rnd() });
    } else for (let i = 0; i < count; i++) {
      // golden-angle placement keeps a scatter even rather than clumped,
      // then jitter stops it looking mechanical
      const t = (i + 0.5) / count;
      const ang = i * 2.39996 + rnd() * 0.9;
      const rad = Math.sqrt(t) * reach + (rnd() - 0.5) * 6;
      pieces.push({
        x: 50 + Math.cos(ang) * rad,
        y: 50 + Math.sin(ang) * rad * 0.62, // ellipse: the plate is tilted
        r: r * (0.82 + rnd() * 0.36),
        rot: rnd() * 360,
        k: rnd(),
      });
    }
    // label attaches to the piece nearest the top edge — leader lines that cross
    // the middle of the plate obscure the thing they are pointing at
    const a = pieces.reduce((b, p) => (p.y < b.y ? p : b), pieces[0] ?? { x: 50, y: 50 } as Piece);
    return {
      ref: it.ref, name: n.name, form: look.form, color: look.color, z: look.z,
      role: n.role, grams: it.grams, mass, pieces,
      anchor: { x: a.x, y: a.y },
    };
  });

  return layers.sort((a, b) => a.z - b.z || b.mass - a.mass);
}

/* ------------------------------------------------------------ contribution */

export interface Contribution {
  ref: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  fibre: number;
  /** The macro this ingredient contributes most of, relative to the dish. */
  headline: 'protein' | 'carb' | 'fat' | 'fibre' | 'kcal';
  /** That macro's share of the dish total, 0-1. */
  share: number;
  /** One line on why it is there, when there is something worth saying. */
  note?: string;
}

/**
 * What one ingredient actually contributes, per serving.
 *
 * The headline macro is chosen by SHARE of the dish rather than by absolute
 * grams: 8 g of olive oil is not much fat in isolation, but if it is most of
 * the fat in the dish then that is the true thing to point at. Picking by
 * absolute size would label everything on the plate "carb" because rice is
 * heavy, which tells the reader nothing they could not see.
 */
export function contribution(items: RecipeItem[], ref: string, baseServings: number): Contribution | null {
  const it = items.find((i) => i.ref === ref);
  const n = NUTRIENTS[ref];
  if (!it || !n) return null;

  const per = (i: RecipeItem, key: 'kcal' | 'protein' | 'carb' | 'fat' | 'fibre') => {
    const nn = NUTRIENTS[i.ref];
    if (!nn) return 0;
    return (nn[key] * i.grams * (i.absorption ?? 1)) / 100 / Math.max(baseServings, 1);
  };

  const mine = {
    kcal: per(it, 'kcal'), protein: per(it, 'protein'), carb: per(it, 'carb'),
    fat: per(it, 'fat'), fibre: per(it, 'fibre'),
  };
  const totals = { kcal: 0, protein: 0, carb: 0, fat: 0, fibre: 0 };
  for (const i of items) {
    totals.kcal += per(i, 'kcal'); totals.protein += per(i, 'protein');
    totals.carb += per(i, 'carb'); totals.fat += per(i, 'fat'); totals.fibre += per(i, 'fibre');
  }

  const keys: Contribution['headline'][] = ['protein', 'carb', 'fat', 'fibre'];
  let headline: Contribution['headline'] = 'kcal';
  let share = totals.kcal > 0 ? mine.kcal / totals.kcal : 0;
  for (const k of keys) {
    const t = totals[k];
    if (t <= 0.5) continue;                    // dish has too little for a share to mean anything
    if (mine[k] < 0.6) continue;               // this ingredient barely has any
    const s = mine[k] / t;
    if (s > share) { share = s; headline = k; }
  }

  return {
    ref, name: n.name, grams: it.grams / Math.max(baseServings, 1),
    ...mine, headline, share, note: NOTES[ref],
  };
}

/** Why an ingredient earns its place — only where there is something non-obvious to say. */
const NOTES: Record<string, string> = {
  lemon: 'Acid at the end, not the start — heat drives off what makes it taste bright.',
  lime: 'Squeezed after the pan comes off, or it turns bitter.',
  garlic: 'Burns in about forty seconds. It goes in after the onion, never with it.',
  turmeric: 'Colour more than flavour. Its absorption improves markedly with black pepper alongside.',
  black_pepper: 'Worth grinding fresh — pre-ground has lost most of what you are paying for.',
  spinach_fresh: 'Collapses to roughly a tenth of its volume. The pile always looks wrong before it wilts.',
  chickpeas_tinned: 'Tinned is not a compromise here; dried needs an overnight soak for the same result.',
  greek_yogurt: 'Off the heat. It splits if it boils.',
  double_cream: 'Full fat holds together when heated where single cream separates.',
  egg: 'Complete protein and the cheapest source of B12 on the plate.',
  red_lentils: 'No soaking, and they break down into their own sauce in about twenty minutes.',
  olive_oil: 'Extra virgin is for finishing. For frying it is expensive and its flavour is destroyed anyway.',
  feta: 'Salty enough that the dish needs less salt elsewhere.',
  tomato_puree: 'Fry it for a minute before adding liquid — raw, it tastes metallic.',
  saffron: 'The most expensive thing in the cupboard by weight. A pinch is genuinely the correct amount.',
  cumin_ground: 'Ground spice loses its edge in months. Whole seed, toasted and crushed, is a different ingredient.',
  ginger: 'Freezes well and grates more easily frozen than fresh.',
  onion: 'Most of the sweetness comes from time, not heat. Rushing it is the commonest cause of a thin-tasting dish.',
  bay_leaf: 'Does almost nothing in under twenty minutes, and a lot over an hour.',
  fenugreek_leaves: 'Crushed between the palms as it goes in — that is where the aroma is.',
  salt: 'Added in layers as you cook, not all at the end, which is why restaurant food tastes seasoned through.',
};
