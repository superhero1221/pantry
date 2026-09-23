#!/usr/bin/env node
/**
 * A canonical snapshot of what the CI gate compares between two commits.
 *
 *   node scripts/jev/snapshot.mjs <root>      prints JSON on stdout
 *
 * <root> is a directory holding a `src/` tree (and the package.json that
 * says `"type": "module"`): the working tree for HEAD, or a temp directory
 * that `git archive <base> src package.json` was unpacked into. The app's own
 * modules are imported from THAT root, so each commit is judged by its own
 * cookbook, its own meetsDiet() and its own language files.
 *
 * Why a separate process per commit rather than importing both in one: Node
 * caches modules by URL and the two trees import each other by relative path,
 * so one process would need two copies of every hook and cache rule to keep
 * them apart. A child process per snapshot is the boring, obviously-isolated
 * answer, and costs about a second.
 *
 * Why import rather than diff the text of cookbook.js: a recipe's text moves
 * when a neighbour is edited, a helper like I() can change every item without
 * touching a recipe, and the thing that matters is the value the app actually
 * uses. Comparing canonical JSON (keys sorted) of the imported values sees
 * exactly the changes the app sees and nothing else.
 */
import { createHash } from 'node:crypto';
import { register } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** JSON with object keys sorted at every depth, so equal values print equal. */
export function canonical(x) {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x && typeof x === 'object') {
    return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined && typeof x[k] !== 'function').map((k) => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  }
  if (typeof x === 'function' || x === undefined) return 'null';
  return JSON.stringify(x);
}

export const hash = (x) => createHash('sha256').update(typeof x === 'string' ? x : canonical(x)).digest('hex').slice(0, 16);

export const OTHER = ['es', 'fr', 'pl', 'ur', 'ar'];

/** Leaves of a nested pack section as dotted keys — the same flattening check-translations.mjs uses. */
export function flatten(x, prefix, out) {
  if (typeof x === 'string') out[prefix] = x;
  else if (Array.isArray(x)) x.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) flatten(v, `${prefix}.${k}`, out);
  return out;
}

/**
 * The part of a recipe a diet depends on: what you buy, what you do, what it
 * is called and what it claims. Prices, photos and nutrition are left out on
 * purpose — a repricing of every line must not buy 153 Jev calls.
 */
export const dietView = (r) => ({
  name: r.name,
  cuisine: r.cuisine,
  items: (r.items || []).map((i) => ({ g: i.g, n: i.n, opt: !!i.opt })),
  method: (r.method || []).map((s) => ({ text: s.text, tip: s.tip ?? null })),
  tags: [...(r.tags || [])],
});

/** Build the snapshot from already-loaded modules. Pure; the CLI below does the loading. */
export function build({ cookbook, diets, i18n, extra, langs }) {
  const dietIds = (cookbook.DIETS || []).map((d) => d.id);
  const recipes = {};
  for (const r of cookbook.RECIPES || []) {
    const view = dietView(r);
    recipes[r.id] = {
      view,
      fp: hash(view),
      all: hash(r),
      meets: Object.fromEntries(dietIds.map((d) => [d, !!diets.meetsDiet(r, d)])),
      contradictions: diets.tagContradictions ? diets.tagContradictions(r) : {},
    };
  }

  // The three tables data.test.ts holds to key parity, read directly from the
  // language files the way check-translations.mjs reads them.
  const lp = (l, part) => langs[l]?.[part] || {};
  const tables = {
    strings: { en: i18n.strings('en'), ...Object.fromEntries(OTHER.map((l) => [l, lp(l, 'strings')])) },
    pack: {
      en: Object.entries(i18n.pack('en')).reduce((o, [k, v]) => flatten(v, k, o), {}),
      ...Object.fromEntries(OTHER.map((l) => [l, Object.entries(lp(l, 'pack')).reduce((o, [k, v]) => flatten(v, k, o), {})])),
    },
    extra: { en: extra.EXTRA?.en || {}, ...Object.fromEntries(OTHER.map((l) => [l, lp(l, 'extra')])) },
  };
  const translations = {};
  const incomplete = [];
  for (const [table, t] of Object.entries(tables)) {
    for (const [key, en] of Object.entries(t.en)) {
      if (typeof en !== 'string') continue;
      const row = { table, key, en, ...Object.fromEntries(OTHER.map((l) => [l, t[l]?.[key]])) };
      const missing = OTHER.filter((l) => typeof row[l] !== 'string');
      if (missing.length) incomplete.push({ table, key, missing });
      else translations[`${table}.${key}`] = row;
    }
  }
  return { ok: true, diets: dietIds, recipes, translations, incomplete };
}

/** Import the app's modules from <root> and build its snapshot. */
export async function load(root) {
  const at = (p) => pathToFileURL(resolve(root, p)).href;
  const cookbook = await import(at('src/data/cookbook.js'));
  const diets = await import(at('src/lib/diets.ts'));
  const i18n = await import(at('src/data/pantry-i18n.js'));
  const extra = await import(at('src/data/extra-copy.ts'));
  const langs = {};
  for (const l of OTHER) langs[l] = await import(at(`src/data/lang/${l}.ts`));
  return build({ cookbook, diets, i18n, extra, langs });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  register('./ts-hooks.mjs', import.meta.url);
  const root = process.argv[2];
  if (!root) {
    console.error('usage: node scripts/jev/snapshot.mjs <root>');
    process.exit(2);
  }
  try {
    process.stdout.write(JSON.stringify(await load(root)));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: String(e?.stack || e).slice(0, 2000) }));
    process.exitCode = 1;
  }
}
