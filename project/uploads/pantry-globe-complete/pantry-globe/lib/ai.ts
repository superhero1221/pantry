import { NUTRIENTS } from './nutrients';
import { RECIPES } from './engine';
import type { Recipe, DietTag } from './types';

/**
 * Optional language layer.
 *
 * Nothing in this file is required for the app to work. The planner, pricing and
 * nutrition engines are deterministic and run without it. This exists only for
 * the two jobs a language model is actually better at than code:
 *   1. turning a sentence into structured intent
 *   2. inventing a dish that isn't in the bundled menu
 *
 * The user's API key lives in their browser and is sent per-request. It is never
 * stored on the server, never logged, and never leaves their device except to
 * OpenRouter itself.
 */

/**
 * Used only if OpenRouter's model list can't be reached. The live list is the
 * source of truth — free model IDs churn every few months, so treat anything
 * hardcoded here as already going stale.
 */
export const FALLBACK_FREE_MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'inclusionai/ling-3.0-flash:free',
  'google/gemma-4-26b-a4b-it:free',
];

export interface ParsedIntent {
  kind: 'dish' | 'plan' | 'invent' | 'unclear';
  recipeId?: string;
  variantId?: string | null;
  dishName?: string;
  servings?: number;
  days?: number;
  mealsPerDay?: number;
  kcalPerDay?: number;
  proteinPerDay?: number;
  budget?: number;
  diets?: DietTag[];
  reply: string;
}

const DIET_VALUES = 'vegan, vegetarian, halal, kosher, gluten_free, dairy_free, nut_free';

export function intentPrompt(userText: string): { system: string; user: string } {
  const menu = RECIPES.map((r) => `${r.id} = ${r.name} (${r.cuisine}); variants: ${r.variants.map((v) => v.id).join(', ') || 'none'}`).join('\n');
  return {
    system:
`You turn a cooking request into JSON. You do not cook, plan, or calculate — other code does that. Return ONLY a JSON object, no prose, no markdown fence.

Available dishes:
${menu}

Schema:
{
  "kind": "dish" | "plan" | "invent" | "unclear",
  "recipeId": string,        // only if kind=dish and it matches the menu above
  "variantId": string|null,  // only if the user asked for a version that exists
  "dishName": string,        // only if kind=invent — the dish they want that isn't on the menu
  "servings": number,
  "days": number,            // kind=plan
  "mealsPerDay": number,     // kind=plan, 1-3
  "kcalPerDay": number,
  "proteinPerDay": number,
  "budget": number,
  "diets": string[],         // any of: ${DIET_VALUES}
  "reply": string            // one short sentence to the user, plain and specific
}

Rules:
- kind="dish" when they name something on the menu. kind="invent" when they name a dish NOT on the menu. kind="plan" when they want multiple days or a week of food.
- Omit any field you have no evidence for. Never invent a number the user did not imply.
- "high protein" alone is not a number — leave proteinPerDay out rather than guessing.
- Never put a recipeId that is not in the list above.`,
    user: userText,
  };
}

export function inventPrompt(dishName: string, diets: DietTag[]): { system: string; user: string } {
  const ids = Object.keys(NUTRIENTS).join(', ');
  return {
    system:
`You write a recipe as JSON for an app that prices and analyses it. Return ONLY a JSON object, no prose, no markdown fence.

You may ONLY reference these ingredient ids — this is the complete list the app can price and compute nutrition for:
${ids}

If the dish needs something not listed, pick the closest available id and say so in the item's "note". Never invent an id.

Schema (all fields required unless marked optional):
{
  "id": string,              // lowercase_snake_case, unique
  "name": string,
  "localName": string,       // optional, native-script name
  "cuisine": string,
  "country": string,         // ISO 3166-1 alpha-2
  "blurb": string,           // one concrete sentence, no marketing language
  "servings": 2,
  "activeMin": number,
  "totalMin": number,
  "difficulty": "easy" | "easy-medium" | "medium" | "hard",
  "restaurantGBP": number,   // realistic UK price for ONE portion delivered
  "tags": string[],          // any of: ${DIET_VALUES}, pork, alcohol
  "items": [ { "ref": string, "grams": number, "note": string?, "optional": boolean?, "absorption": number? } ],
  "method": [ { "n": number, "text": string, "minutes": number?, "tip": string? } ],
  "failures": [ { "symptom": string, "cause": string } ],
  "variants": [ { "id": string, "label": string, "tags": string[],
                  "swaps": [ { "from": string, "to": string|null, "grams": number? } ],
                  "methodDeltas": [ { "step": number, "change": string } ] } ]
}

Hard requirements:
- items: realistic gram weights for 2 servings, including the starch/bread that makes it a meal. 1 tsp ground spice ~ 2 g, 1 garlic clove ~ 4 g.
- absorption: set this ONLY for deep-frying oil, to the fraction actually eaten (about 0.08). The app prices the full amount but only counts the absorbed part as food.
- method: 8-14 steps, real times and temperatures, written for a beginner. Put a "tip" on the 3-5 steps where beginners actually fail — use sensory cues ("when it smells fragrant rather than dusty"), not platitudes.
- variants: 2-3. Every variant MUST have at least one methodDelta explaining how the cooking changes. A swap that changes ingredients but not method gives the cook a ruined dish.
- tags must be honest. Anything with meat/fish/dairy/egg is not vegan.`,
    user: `Dish: ${dishName}${diets.length ? `\nMust satisfy: ${diets.join(', ')}` : ''}`,
  };
}

/** Strip fences and pull the first JSON object out of a model response. */
export function extractJson(text: string): any {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a === -1 || b === -1) throw new Error('no JSON object in model response');
  return JSON.parse(t.slice(a, b + 1));
}

export interface RecipeCheck { recipe: Recipe | null; dropped: string[]; problems: string[] }

/**
 * Validate a model-written recipe against the real ingredient table.
 * Unknown refs are dropped rather than trusted — an unpriceable, uncomputable
 * ingredient would silently skew both the basket and the macros.
 */
export function validateRecipe(raw: any): RecipeCheck {
  const problems: string[] = [];
  const dropped: string[] = [];
  if (!raw || typeof raw !== 'object') return { recipe: null, dropped, problems: ['not an object'] };

  const items = Array.isArray(raw.items) ? raw.items : [];
  const good = items.filter((i: any) => {
    const ok = i && typeof i.ref === 'string' && NUTRIENTS[i.ref] && typeof i.grams === 'number' && i.grams > 0;
    if (!ok && i?.ref) dropped.push(String(i.ref));
    return ok;
  }).map((i: any) => ({
    ref: i.ref,
    grams: Math.min(Math.max(i.grams, 0.1), 5000),
    note: typeof i.note === 'string' ? i.note : undefined,
    optional: !!i.optional,
    absorption: typeof i.absorption === 'number' && i.absorption > 0 && i.absorption <= 1 ? i.absorption : undefined,
  }));

  if (good.length < 4) problems.push(`only ${good.length} usable ingredients`);

  const method = (Array.isArray(raw.method) ? raw.method : [])
    .filter((s: any) => s && typeof s.text === 'string')
    .map((s: any, i: number) => ({
      n: typeof s.n === 'number' ? s.n : i + 1,
      text: s.text,
      minutes: typeof s.minutes === 'number' ? s.minutes : undefined,
      tip: typeof s.tip === 'string' ? s.tip : undefined,
    }));
  if (method.length < 4) problems.push(`only ${method.length} method steps`);

  const variants = (Array.isArray(raw.variants) ? raw.variants : [])
    .map((v: any) => ({
      id: String(v?.id ?? ''),
      label: String(v?.label ?? ''),
      tags: Array.isArray(v?.tags) ? v.tags : [],
      swaps: (Array.isArray(v?.swaps) ? v.swaps : []).filter(
        (s: any) => s && NUTRIENTS[s.from] && (s.to === null || NUTRIENTS[s.to]),
      ),
      methodDeltas: Array.isArray(v?.methodDeltas) ? v.methodDeltas.filter((d: any) => d && typeof d.change === 'string') : [],
    }))
    .filter((v: any) => v.id && v.label && v.swaps.length);

  for (const v of variants) {
    if (!v.methodDeltas.length) problems.push(`variant "${v.label}" changes ingredients but not method`);
  }

  if (problems.length && good.length < 4) return { recipe: null, dropped, problems };

  const recipe: Recipe = {
    id: String(raw.id || 'ai_' + Date.now().toString(36)),
    name: String(raw.name || 'Untitled'),
    localName: raw.localName ? String(raw.localName) : undefined,
    cuisine: String(raw.cuisine || 'AI'),
    country: String(raw.country || 'XX').toUpperCase().slice(0, 2),
    blurb: String(raw.blurb || ''),
    servings: 2,
    activeMin: Number(raw.activeMin) || 30,
    totalMin: Number(raw.totalMin) || 45,
    difficulty: ['easy', 'easy-medium', 'medium', 'hard'].includes(raw.difficulty) ? raw.difficulty : 'medium',
    items: good,
    method,
    failures: (Array.isArray(raw.failures) ? raw.failures : []).filter((f: any) => f?.symptom && f?.cause),
    variants,
    restaurantGBP: Number(raw.restaurantGBP) || 11,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
  return { recipe, dropped, problems };
}
