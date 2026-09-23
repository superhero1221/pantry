/**
 * The app's own modules, loaded read-only as ground truth.
 *
 * Plain `node` runs the app's TypeScript directly (Node 22.18+ strips types),
 * and ts-hooks.mjs supplies the extensionless resolution Vite would. Nothing
 * here is copied from the app and nothing in the app is changed — if
 * meetsDiet() changes tomorrow, the next run of the harness judges the new one.
 */
import { register } from 'node:module';

register('./ts-hooks.mjs', import.meta.url);

const cookbook = await import('../../src/data/cookbook.js');
const diets = await import('../../src/lib/diets.ts');
const i18n = await import('../../src/data/pantry-i18n.js');
const extra = await import('../../src/data/extra-copy.ts');
const money = await import('../../src/lib/money.ts');
const langs = {
  es: await import('../../src/data/lang/es.ts'),
  fr: await import('../../src/data/lang/fr.ts'),
  pl: await import('../../src/data/lang/pl.ts'),
  ur: await import('../../src/data/lang/ur.ts'),
  ar: await import('../../src/data/lang/ar.ts'),
};

export const { RECIPES, DIETS, COUNTRIES, STORES_BY_COUNTRY } = cookbook;
export const { meetsDiet, breaksDietBecause, DERIVED, ENFORCEABLE } = diets;
export const { strings, pack } = i18n;
/** The words the app itself prints for each diet, in English. */
export const dietWords = i18n.diets('en');
export const { EXTRA } = extra;
export const { toLocal } = money;
/** The five non-English language files, read directly — not through the
 *  English-backed accessors, which would compare English with English. */
export const LANGS = langs;
export const OTHER = ['es', 'fr', 'pl', 'ur', 'ar'];
