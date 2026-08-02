import { RECIPES } from './engine';
import type { Recipe } from './types';

/**
 * What a dish needs you to actually own.
 *
 * Every recipe app assumes a kitchen. The situations where cooking advice is
 * worth most are the ones where that assumption fails — a hotel room with a
 * kettle, a shared house with one pan and no sharp knife, a bedsit with two
 * hob rings and no oven. "Roast for 40 minutes" is not advice there, it is
 * noise, and the app should be able to say so rather than serve it anyway.
 *
 * Requirements are derived from the method text rather than hand-tagged. Twenty
 * seven recipes could be tagged by hand; a hundred could not, and a hand-tagged
 * list drifts the moment someone edits a step. Deriving it means the tag is
 * always what the instructions actually say.
 */

export type Kit =
  | 'hob'        // any ring or burner
  | 'oven'
  | 'grill'
  | 'pan'        // frying pan or skillet
  | 'pot'        // saucepan big enough to boil in
  | 'knife'      // something that genuinely cuts
  | 'board'
  | 'blender'
  | 'kettle'
  | 'microwave';

export const KIT_LABEL: Record<Kit, string> = {
  hob: 'A hob or hotplate', oven: 'An oven', grill: 'A grill',
  pan: 'A frying pan', pot: 'A saucepan', knife: 'A sharp knife',
  board: 'A chopping board', blender: 'A blender', kettle: 'A kettle',
  microwave: 'A microwave',
};

/** The kit most people have without thinking about it. */
export const FULL_KITCHEN: Kit[] = ['hob', 'oven', 'grill', 'pan', 'pot', 'knife', 'board', 'kettle', 'microwave'];
/** A hotel room, roughly. */
export const HOTEL_ROOM: Kit[] = ['kettle'];
/** One ring, one pan, one knife — the commonest constrained case. */
export const ONE_RING: Kit[] = ['hob', 'pan', 'knife', 'board', 'kettle'];

const RULES: { kit: Kit; re: RegExp }[] = [
  { kit: 'oven', re: /\boven|\bbake|\bbaking|\broast|\b1[6-9]0\s?°?c|\b2[0-4]0\s?°?c|gas mark/i },
  { kit: 'grill', re: /\bgrill|\bbroil|\bchargrill/i },
  { kit: 'blender', re: /\bblend\b|\bblended\b|\bblitz|food processor|liquidis/i },
  { kit: 'knife', re: /\bchop|\bdice|\bslice|\bmince\b|finely|\bcut\b|\bhalve|\bquarter|\bshred|\bcarve|\bjulienne|\btrim\b/i },
  { kit: 'board', re: /\bchop|\bdice|\bslice|\bcut\b|\bhalve|\bshred/i },
  { kit: 'pan', re: /frying pan|\bskillet|\bfry\b|\bfries\b|\bsear\b|\bsauté|\bsaute|\bwok\b|\bgriddle/i },
  { kit: 'pot', re: /\bsaucepan|\bboil|\bsimmer|large pan|\bstockpot|\bcasserole|\bpot\b/i },
  { kit: 'hob', re: /\bpan\b|\bfry\b|\bboil|\bsimmer|\bsauté|\bsaute|\bheat the|\bmedium heat|\bhigh heat|\blow heat|\bhob\b|\bwok\b/i },
  { kit: 'microwave', re: /\bmicrowave/i },
  { kit: 'kettle', re: /\bkettle|boiling water from/i },
];

/** Everything a recipe's method implies you need. */
export function needsOf(r: Recipe): Kit[] {
  const text = [r.method.map((m) => `${m.text} ${m.tip ?? ''}`).join(' '), r.items.map((i) => i.note ?? '').join(' ')]
    .join(' ');
  const out = new Set<Kit>();
  for (const { kit, re } of RULES) if (re.test(text)) out.add(kit);
  // A pan or a pot on its own is meaningless without something to heat it on.
  if ((out.has('pan') || out.has('pot')) && !out.has('hob')) out.add('hob');
  return [...out];
}

const CACHE = new Map<string, Kit[]>();
export function needs(r: Recipe): Kit[] {
  let v = CACHE.get(r.id);
  if (!v) { v = needsOf(r); CACHE.set(r.id, v); }
  return v;
}

export interface KitFit {
  ok: boolean;
  missing: Kit[];
  /** Plain sentence naming what stops it, or what it needs. */
  why: string;
}

/**
 * Can this be cooked with what's to hand?
 *
 * Returns the specific missing item rather than a yes or no, because "you can't
 * make this" is useless and "you can't make this without an oven" tells someone
 * whether to keep looking or go and borrow one.
 */
export function fits(r: Recipe, have: Kit[]): KitFit {
  const need = needs(r);
  const missing = need.filter((k) => !have.includes(k));
  if (!missing.length) return { ok: true, missing, why: `Needs only ${need.map((k) => KIT_LABEL[k].toLowerCase().replace(/^an? /, '')).join(', ') || 'nothing special'}.` };
  return {
    ok: false,
    missing,
    why: `Needs ${missing.map((k) => KIT_LABEL[k].toLowerCase().replace(/^an? /, '')).join(' and ')}, which you said you haven't got.`,
  };
}

/** Kit summary across the whole collection — used to explain an empty result. */
export function kitCoverage(have: Kit[]): { total: number; cookable: number; blocker: Kit | null } {
  let cookable = 0;
  const blocked = new Map<Kit, number>();
  for (const r of RECIPES) {
    const f = fits(r, have);
    if (f.ok) cookable++;
    else for (const m of f.missing) blocked.set(m, (blocked.get(m) ?? 0) + 1);
  }
  let blocker: Kit | null = null, best = 0;
  for (const [k, n] of blocked) if (n > best) { best = n; blocker = k; }
  return { total: RECIPES.length, cookable, blocker };
}
