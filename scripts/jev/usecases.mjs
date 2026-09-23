#!/usr/bin/env node
/**
 * What could Jev do INSIDE Pantry? Six real product jobs, each with a small
 * hand-labelled test set (usecases-data.mjs), measured for accuracy, the
 * dangerous confident-and-wrong answers, latency and cost per 1,000 uses,
 * with a verdict and a note on how it would plug in.
 *
 *   node scripts/jev/usecases.mjs [--dry] [--mock] [--max-usd=0.05]
 *        [--only=cravings|prices|swaps|cupboard|moods|feedback]
 *        [--picks-facts=jev-results/picks-facts.json] [--out=jev-results]
 *
 *   --picks-facts  moods: take the five candidates from a saved picks run
 *                  (picks-facts.json from `run.mjs picks --dry`, or picks.json
 *                  from a live run) instead of the pure-module approximation
 *                  of Home's ranking for a default profile.
 *
 * The key is read from OPENROUTER_API_KEY and nowhere else, and it must never
 * reach the browser: every job here would run server-side (see NOTES below).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COUNTRIES, DIETS, RECIPES, meetsDiet, toLocal } from './app.mjs';
import { clearlyBreaksDiet } from './bench-tasks.mjs';
import { DEFS, stateOf } from './check-diets.mjs';
import { Jev, MODEL, MOCK_BANNER, choice, esc, estimateTokens, fmtUsd, mask, noul, score, usd } from './lib.mjs';
import { median, msStr, p90, pctStr, per1000, scoreChoice, scoreLevel, scoreNoul, tally, unlessSkipped, usdStr, verdictFor } from './score.mjs';
import { CRAVINGS, CUPBOARD, FEEDBACK, FEEDBACK_TYPES, INTENTS, MOODS, PRICE_ERROR_TYPES, PRICE_REPORTS, SWAPS, URGENCY, parseDietGold } from './usecases-data.mjs';

const { canonical, gramsOf } = await import('../../src/lib/nutrition.js');
const { COPYCAT_HINTS } = await import('../../src/data/cookbook.js');

export const JOBS = ['cravings', 'prices', 'swaps', 'cupboard', 'moods', 'feedback'];

/* ── Pure helpers (exported for the tests) ───────────────────────────────── */

export const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
export const CUISINES = [...new Set(RECIPES.map((r) => r.cuisine))].sort();

/**
 * What the craving box finds TODAY, mirroring `matches()` in usePantry.ts:
 * the typed text as a substring of name + cuisine + copycat + local name, or
 * any word longer than two letters, or a copycat hint. Kept in step by hand;
 * if usePantry changes, this is the line to update.
 */
export function todayMatches(text) {
  const q = text.toLowerCase().trim();
  if (!q) return [];
  return RECIPES.filter((r) => {
    const hay = (r.name + ' ' + r.cuisine + ' ' + (r.copycat || '') + ' ' + r.local).toLowerCase();
    return hay.indexOf(q) >= 0 || (!!r.copycat && COPYCAT_HINTS.some((h) => q.indexOf(h) >= 0)) || q.split(/\s+/).some((w) => w.length > 2 && hay.indexOf(w) >= 0);
  });
}

/** GBP-baseline price per kg the app models for an ingredient: its largest occurrence in the cookbook. */
export function modelledPerKgGbp(name) {
  let best = null;
  for (const r of RECIPES)
    for (const i of r.items) {
      if (i.n !== name) continue;
      let g;
      try {
        g = gramsOf(i);
      } catch {
        continue;
      }
      if (g > 0 && (!best || g > best.g)) best = { g, s: i.s };
    }
  if (!best) throw new Error(`no modelled price for "${name}" in the cookbook`);
  return (best.s / best.g) * 1000;
}

const localOf = (gbp, code) => toLocal(gbp, COUNTRIES[code], COUNTRIES[code].fx);
const whole = (code) => COUNTRIES[code].fx >= 40;
const round = (v, code) => (whole(code) ? Math.round(v) : Math.round(v * 100) / 100);
// Two significant figures below one unit, so a tiny modelled price (a pack
// typed as 2 g) reads as £0.0017 rather than a misleading £0.00.
const fmtLocal = (v, code) => COUNTRIES[code].sym + (v > 0 && v < 1 ? String(Number(v.toPrecision(2))) : whole(code) ? Math.round(v).toLocaleString('en-GB') : v.toFixed(2));

/** One community price report, from a PRICE_REPORTS row and the app's model. */
export function buildReport(x) {
  const perKg = modelledPerKgGbp(x.item);
  const modelled = localOf((perKg * x.grams) / 1000, x.country);
  let price;
  let packGrams = x.grams;
  if (x.kind === 'ok') price = modelled * x.factor;
  else if (x.kind === 'wrong_currency') price = localOf((perKg * x.grams) / 1000, x.as);
  else if (x.kind === 'extra_zero') price = modelled * 10;
  else if (x.kind === 'unit_mismatch') {
    price = modelled;
    packGrams = x.grams / 1000;
  } else if (x.kind === 'wrong_item') price = localOf((modelledPerKgGbp(x.pricedAs) * x.pricedGrams) / 1000, x.country);
  else throw new Error(`unknown report kind ${x.kind}`);
  // The currency's own precision, or the "as" currency's for a wrong-currency slip.
  price = round(price, x.kind === 'wrong_currency' ? x.as : x.country);
  const modelledForPack = localOf((perKg * packGrams) / 1000, x.country);
  return {
    state: {
      item: x.item,
      product_label: x.label,
      pack_grams: packGrams,
      price_paid: price,
      currency: COUNTRIES[x.country].iso,
      country: COUNTRIES[x.country].name,
      apps_modelled_price_for_this_pack: fmtLocal(modelledForPack, x.country),
      apps_modelled_price_per_kg: fmtLocal(localOf(perKg, x.country), x.country),
    },
    gold: { plausible: x.kind === 'ok', error_type: x.kind === 'ok' ? 'none' : x.kind },
  };
}

/**
 * Home's first five for a default profile, from pure modules: the no-query,
 * no-diet, no-goal branch of ranked() in usePantry.ts with the defaults a new
 * user has (budget £6, 60 minutes, level 2, Aldi's 0.82 for ranking, the
 * recipe's own `have` list as the cupboard). An APPROXIMATION kept in step by
 * hand — --picks-facts swaps in the real app's list from a picks run.
 */
export function defaultTop5({ budget = 6, maxTime = 60, level = 2 } = {}) {
  const owned = (r, n) => r.have.map((h) => canonical(h)).includes(canonical(n.split(',')[0].trim()));
  const scored = RECIPES.map((r) => {
    const cost = r.items.filter((i) => !owned(r, i.n) && !i.opt).reduce((a, i) => a + i.s * 0.82, 0);
    let s = cost > budget ? (cost - budget) * 22 : -6;
    s += Math.max(0, r.diff - level) * 14;
    return { r, s, rank: r.total <= maxTime ? 0 : 1 };
  });
  scored.sort((a, b) => a.rank - b.rank || a.s - b.s);
  return scored.slice(0, 5).map((x) => x.r);
}

/** The five candidates from a saved picks run: the first scenario with no diets. */
export function top5FromPicksFile(path) {
  const j = JSON.parse(readFileSync(path, 'utf8'));
  const rows = Array.isArray(j) ? j : j.rows || [];
  const row = rows.find((x) => !x.scenario?.diets?.length) || rows[0];
  if (!row) throw new Error(`${path}: no scenarios`);
  const ids = row.top.map((t) => t.id);
  const rs = ids.map((id) => RECIPES.find((r) => r.id === id));
  if (rs.some((r) => !r)) throw new Error(`${path}: a dish id is not in the cookbook`);
  return { recipes: rs.slice(0, 5), scenario: row.id };
}

/**
 * Apply a mood rule to the candidates: one passes -> it; none -> 'none';
 * several -> null (n/a).
 *
 * Diets are three-valued. The app's tags are cautious (an untagged dish is not
 * necessarily unsuitable: veg_curry has no halal tag but nothing in it breaks
 * DEFS.halal), so a dish passes a diet only when meetsDiet() says so, fails it
 * only when it clearly breaks it (clearlyBreaksDiet, shared with the bench),
 * and is otherwise UNSURE. Any unsure dish that meets every other limit makes
 * the case n/a: it could be a second right answer, or the only one.
 */
export function moodGold(rule, recipes) {
  const other = (r) =>
    (rule.maxTotal == null || r.total <= rule.maxTotal) &&
    (rule.minProtein == null || r.per.protein >= rule.minProtein) &&
    (rule.maxKcal == null || r.per.kcal <= rule.maxKcal) &&
    (rule.minKcal == null || r.per.kcal >= rule.minKcal) &&
    (rule.minDiff == null || r.diff >= rule.minDiff) &&
    (rule.maxDiff == null || r.diff <= rule.maxDiff) &&
    (!rule.cuisines || rule.cuisines.includes(r.cuisine));
  const diets = rule.diets || [];
  const pass = recipes.filter((r) => other(r) && diets.every((d) => meetsDiet(r, d)));
  const unsure = recipes.filter((r) => other(r) && !pass.includes(r) && !diets.some((d) => clearlyBreaksDiet(r, d)));
  const gold = unsure.length ? null : pass.length === 1 ? pass[0].id : pass.length === 0 ? 'none' : null;
  return { gold, passing: pass.map((r) => r.id), unsure: unsure.map((r) => r.id) };
}

/* ── The six jobs as Jev calls ───────────────────────────────────────────── */

const yesNo = (what) => ({ true: `Yes: ${what}.`, false: `No: not ${what}.` });

function cravingCalls() {
  const examples = (c) =>
    RECIPES.filter((r) => r.cuisine === c)
      .slice(0, 3)
      .map((r) => r.name)
      .join(', ');
  const criteria = Object.fromEntries([...CUISINES.map((c) => [slug(c), `${c} food, e.g. ${examples(c)}`]), ['none_or_unclear', 'No cuisine is named or clearly implied, or it is one this cookbook does not have.']]);
  return CRAVINGS.map((x, i) => {
    const gold = { cuisine: x.cuisine };
    const yes = x.yes ? x.yes.split(',') : [];
    const unsure = x.unsure ? x.unsure.split(',') : [];
    for (const k of Object.keys(INTENTS)) gold[`wants_${k}`] = yes.includes(k) ? true : unsure.includes(k) ? null : false;
    const g = [].concat(x.cuisine ?? []);
    for (const c of g) if (!criteria[c]) throw new Error(`craving gold cuisine ${c} is not one of the app's cuisines`);
    return {
      id: `craving-${String(i + 1).padStart(2, '0')}`,
      label: `${x.text} (${x.lang})`,
      state: { typed_into_the_box: x.text, where: 'The "Something else in mind?" box on the Home screen of a cooking app that picks one dinner. People type anything, in any language, often with typos.' },
      questions: {
        cuisine: choice('Which one cuisine from this cookbook is the person asking for? Use none_or_unclear if they did not name or clearly imply one, or named one the cookbook does not have.', criteria),
        ...Object.fromEntries(Object.entries(INTENTS).map(([k, d]) => [`wants_${k}`, noul(`Does the person ask for, or clearly imply, ${d}?`, yesNo(`they ask for or clearly imply ${d}`))])),
      },
      gold,
      meta: { today: todayMatches(x.text).length },
    };
  });
}

function priceCalls() {
  return PRICE_REPORTS.map((x, i) => {
    const r = buildReport(x);
    return {
      id: `price-${String(i + 1).padStart(2, '0')}`,
      label: `${x.item} ${x.country} (${x.kind})`,
      state: { ...r.state, context: 'A community "what did you actually pay" price report in a cooking app, before it is allowed into the median everyone else sees. The modelled price is the app\'s own estimate; real shelf prices vary by shop and brand, often by 2x.' },
      questions: {
        plausible: noul('Is this a plausible real price that someone paid for this item and pack in this country? Shop-to-shop and brand differences of up to about 2x either way from the modelled price are normal.', {
          true: 'Plausible: a real person could have paid this.',
          false: 'Implausible: almost certainly a typing mistake or the wrong item.',
        }),
        error_type: choice('If something is wrong with this report, what is it most likely to be?', PRICE_ERROR_TYPES),
      },
      gold: r.gold,
    };
  });
}

function swapCalls() {
  return SWAPS.map((x, i) => {
    const r = RECIPES.find((y) => y.id === x.recipe);
    if (!r) throw new Error(`swap recipe ${x.recipe} not in the cookbook`);
    if (!r.items.some((it) => it.n === x.out)) throw new Error(`swap ${x.recipe}: "${x.out}" is not an ingredient`);
    return {
      id: `swap-${String(i + 1).padStart(2, '0')}`,
      label: `${r.name}: ${x.out} -> ${x.in}`,
      state: { recipe: r.name, ingredients: stateOf(r).ingredients, swap: { remove: x.out, use_instead: x.in } },
      questions: Object.fromEntries(Object.keys(x.gold).map((d) => [d, noul(`After this swap — "${x.out}" removed and "${x.in}" used in its place, everything else unchanged — answer for the changed recipe: ${DEFS[d].q}`, { true: DEFS[d].t, false: DEFS[d].f })])),
      gold: x.gold,
      meta: { why: x.why },
    };
  });
}

function cupboardCalls() {
  return CUPBOARD.map((x, i) => {
    const g = parseDietGold(x.gold);
    return {
      id: `cupboard-${String(i + 1).padStart(2, '0')}`,
      label: x.text,
      state: { typed_into_kitchen_cupboard: x.text },
      questions: Object.fromEntries(
        DIETS.map((d) => [
          d.id,
          noul(`Taking this item as it is normally sold, is it compatible with this diet as the app defines it? The app's definition, written for recipes: "${DEFS[d.id].q}"`, {
            true: 'As normally sold, the item is compatible with the diet.',
            false: 'As normally sold, the item is, or contains, something the diet excludes.',
          }),
        ]),
      ),
      gold: Object.fromEntries(DIETS.map((d) => [d.id, g[d.id] ?? null])),
      meta: { note: x.note },
    };
  });
}

function moodCalls(recipes) {
  const facts = (r) => ({ name: r.name, cuisine: r.cuisine, total_minutes: r.total, difficulty: `${r.diff}/4 (${r.diffLabel})`, kcal_per_serving: r.per.kcal, protein_g_per_serving: r.per.protein, diets_it_meets: DIETS.filter((d) => meetsDiet(r, d.id)).map((d) => d.id) });
  const criteria = Object.fromEntries([...recipes.map((r) => [r.id, `${r.name} (${r.cuisine}, ${r.total} min, difficulty ${r.diff}/4)`]), ['none', 'None of these five fits; offer something else.']]);
  return MOODS.map((x, i) => {
    const g = moodGold(x.rule, recipes);
    return {
      id: `mood-${String(i + 1).padStart(2, '0')}`,
      label: x.text,
      state: { how_they_feel: x.text, what_home_is_offering: Object.fromEntries(recipes.map((r) => [r.id, facts(r)])) },
      questions: { pick: choice('Which one of these dishes best fits how this person feels and what they said tonight? Treat anything they state as a limit (time, diet, cuisine, calories, protein, difficulty) as a hard limit. Answer none if no dish meets their limits.', criteria) },
      gold: { pick: g.gold },
      meta: { passing: g.passing, unsure: g.unsure },
    };
  });
}

function feedbackCalls() {
  return FEEDBACK.map((x, i) => ({
    id: `feedback-${String(i + 1).padStart(2, '0')}`,
    label: x.text.slice(0, 60),
    state: { message: x.text, app: 'Pantry: a cooking app that picks dinner, with diet filters, modelled prices for 8 countries, and six languages.' },
    questions: {
      type: choice('What kind of report is this message?', FEEDBACK_TYPES),
      urgency: score('How urgent is this for the app team?', URGENCY),
    },
    gold: { type: x.type, urgency: x.urgency },
  }));
}

export function buildJobs({ only, picksFacts } = {}) {
  let moodSource = 'pure-module approximation of Home for a default profile (budget £6, 60 min, level 2, no diets)';
  let moodRecipes = null;
  const want = (j) => !only || only === j;
  if (want('moods')) {
    if (picksFacts) {
      const t = top5FromPicksFile(picksFacts);
      moodRecipes = t.recipes;
      moodSource = `the real app's top five for scenario ${t.scenario}, from ${picksFacts}`;
    } else moodRecipes = defaultTop5();
  }
  const build = { cravings: cravingCalls, prices: priceCalls, swaps: swapCalls, cupboard: cupboardCalls, moods: () => moodCalls(moodRecipes), feedback: feedbackCalls };
  return { jobs: Object.fromEntries(JOBS.filter(want).map((j) => [j, build[j]()])), moodSource, moodRecipes };
}

/** Score one call's answers against its gold. */
export function scoreCall(c, res) {
  const out = [];
  for (const [q, spec] of Object.entries(c.questions)) {
    const gold = c.gold[q];
    const a = res?.answers?.[q];
    const v = a?.ok ? a.value : null;
    const s = unlessSkipped(res, spec.type === 'noul' ? scoreNoul(v, gold) : spec.type === 'choice' ? scoreChoice(v, gold, a?.confidence) : scoreLevel(v, gold));
    out.push({ question: q, gold, answer: v, confidence: a?.confidence ?? null, ...s });
  }
  return out;
}

/* ── How each job would plug in ──────────────────────────────────────────── */

const NOTES = {
  cravings:
    'A Supabase Edge Function (`supabase/functions/craving/`, Deno, like `send-reminders`) holding OPENROUTER_API_KEY as a Supabase secret. Home calls it with `supabase.functions.invoke` when the person submits the box — not on every keystroke — and the answer becomes a cuisine filter plus ranking nudges (quick → maxTime, cheap → budget, high-protein → the muscle goal). Today\'s substring match stays as the instant first answer and the fallback when offline or signed out. Cache by lower-cased phrase so repeat phrases cost nothing. CSP already allows https://*.supabase.co.',
  prices:
    'Server-side only, and never on the user\'s critical path: a database trigger or the pg_cron schedule that already drives send-reminders feeds new `price_reports` rows to an Edge Function, which marks implausible ones as held back from `price_medians()` until a person looks. The user never waits; their report still saves instantly. It needs no client change. (The product label used here is not a column today; without it wrong-item errors are harder to catch.)',
  swaps:
    'An Edge Function called when someone taps a swap (a feature Pantry does not have yet). Cache per (recipe, removed, added) in a table, so each swap is paid for once for everyone. Diet tags stay authoritative: Jev\'s answer would only ever add a warning ("this may no longer be vegan"), never clear one.',
  cupboard:
    'An Edge Function called when a free-text item is added to Kitchen, answering in the background; the item is saved immediately and a diet warning appears a moment later if needed. Cache per normalised item text in a shared table — cupboard items repeat across users, so real cost per 1,000 users is far below the per-call figure.',
  moods:
    'An Edge Function called from a "how are you feeling?" prompt on Home, choosing among the five dishes ranked() already produced — so it can never offer a dish that breaks a diet the ranking already enforces. "none" should fall back to "show me another".',
  feedback:
    'Pantry has no feedback inbox today (Legal has a mailto contact only). If one is added — a `feedback` table insert — a trigger calls an Edge Function that files each message with a type and urgency and pings a person for "critical". Nobody waits on it.',
};

/* ── Main ────────────────────────────────────────────────────────────────── */

async function main() {
  const argv = process.argv.slice(2);
  const flag = (n) => argv.includes(`--${n}`);
  const opt = (n, d) => {
    const a = argv.find((x) => x.startsWith(`--${n}=`));
    return a ? a.slice(n.length + 3) : d;
  };
  if (flag('help')) {
    console.log(`usage: node scripts/jev/usecases.mjs [--dry] [--mock] [--max-usd=0.05] [--only=${JOBS.join('|')}] [--picks-facts=path] [--out=jev-results] [--concurrency=4]`);
    return;
  }
  const dry = flag('dry');
  const mock = flag('mock');
  const maxUsd = Number(opt('max-usd', '0.05'));
  const only = opt('only');
  const outDir = resolve(opt('out', 'jev-results'));
  const concurrency = Number(opt('concurrency', '4'));
  const picksFacts = opt('picks-facts');
  if (!Number.isFinite(maxUsd) || maxUsd <= 0) throw new Error('--max-usd must be a positive number');
  if (only && !JOBS.includes(only)) throw new Error(`--only must be one of ${JOBS.join(', ')}`);
  if (picksFacts && !existsSync(picksFacts)) throw new Error(`--picks-facts: ${picksFacts} does not exist`);
  const key = process.env.OPENROUTER_API_KEY;
  if (!dry && !mock && !key) {
    console.error('OPENROUTER_API_KEY is not set. Export it in this shell, or use --dry / --mock.');
    process.exitCode = 2;
    return;
  }
  mkdirSync(outDir, { recursive: true });
  console.log(`Jev use cases — ${dry ? 'DRY (no network)' : mock ? 'MOCK (offline fake)' : `LIVE ${MODEL}, key ${mask(key)}`}; jobs ${only || 'all'}; max ${fmtUsd(maxUsd)}; out ${outDir}`);

  const { jobs, moodSource, moodRecipes } = buildJobs({ only, picksFacts });
  const est = (calls) => calls.reduce((a, c) => a + estimateTokens({ model: MODEL, state: c.state, questions: c.questions }), 0);
  let totalTok = 0;
  for (const [j, calls] of Object.entries(jobs)) {
    const t = est(calls);
    totalTok += t;
    const gold = calls.reduce((a, c) => a + Object.values(c.gold).filter((g) => g != null && !(Array.isArray(g) && !g.length)).length, 0);
    console.log(`  ${j.padEnd(9)} ${String(calls.length).padStart(3)} calls  ${String(calls.reduce((a, c) => a + Object.keys(c.questions).length, 0)).padStart(4)} questions  ${String(gold).padStart(4)} with gold  ~${t.toLocaleString()} tok  ~${fmtUsd(usd(t))}`);
  }
  if (moodRecipes) console.log(`  moods candidates: ${moodSource}: ${moodRecipes.map((r) => r.id).join(', ')}`);
  console.log(`  total ~${totalTok.toLocaleString()} input tokens est. -> ~${fmtUsd(usd(totalTok))} (hard cap ${fmtUsd(maxUsd)})`);

  if (dry) {
    const dir = join(outDir, 'samples');
    mkdirSync(dir, { recursive: true });
    for (const [j, calls] of Object.entries(jobs)) writeFileSync(join(dir, `usecase-${j}.json`), JSON.stringify({ model: MODEL, state: calls[0].state, questions: calls[0].questions }, null, 2));
    writeFileSync(
      join(outDir, 'usecases-dry.json'),
      JSON.stringify({ mode: 'dry', max_usd: maxUsd, jobs: Object.fromEntries(Object.entries(jobs).map(([j, c]) => [j, { calls: c.length, est_tokens: est(c), est_usd: usd(est(c)) }])), est_tokens: totalTok, est_usd: usd(totalTok), worst_case_usd: Math.min(maxUsd, usd(totalTok)), mood_source: moodSource }, null, 2),
    );
    console.log(`  wrote ${join(outDir, 'usecases-dry.json')} and samples/usecase-*.json`);
    return;
  }

  const jev = new Jev({ apiKey: key, mock, maxUsd, concurrency, outDir });
  const report = {};
  for (const [j, calls] of Object.entries(jobs)) {
    console.log(`\n[${j}] ${calls.length} calls`);
    const res = new Array(calls.length);
    let next = 0;
    const worker = async () => {
      while (next < calls.length) {
        const i = next++;
        const t0 = performance.now();
        res[i] = await jev.decide(calls[i].state, calls[i].questions, { id: calls[i].id });
        res[i].ms = performance.now() - t0;
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, calls.length) }, worker));
    const rows = calls.map((c, i) => ({ id: c.id, label: c.label, scores: scoreCall(c, res[i]), ms: res[i].ms, error: res[i].skipped ? res[i].reason : res[i].error || null, meta: c.meta || null }));
    const t = tally(rows.flatMap((r) => r.scores));
    const ok = res.filter((r) => r && !r.skipped && !r.error);
    const cost = res.reduce((a, r) => a + (r?.usage?.costUsd ?? 0), 0);
    const ms = ok.map((r) => r.ms);
    report[j] = {
      calls: calls.length,
      answered: ok.length,
      gold: t,
      latency: { median: median(ms), p90: p90(ms) },
      cost_usd: cost,
      per_1000_uses_usd: per1000(cost, ok.length),
      verdict: verdictFor(t, { mock }),
      note: NOTES[j],
      rows,
    };
    if (j === 'cravings') report[j].today_finds_nothing = calls.filter((c) => c.meta.today === 0).length;
    if (j === 'moods') report[j].source = moodSource;
    console.log(`  accuracy ${pctStr(t.accuracy)} (${t.right}/${t.scored})${t.notRun ? `, NOT RUN ${t.notRun}` : ''}, confident & wrong ${t.confidentWrong}, n/a ${t.na}, median ${msStr(report[j].latency.median)}, per 1,000 uses ${usdStr(report[j].per_1000_uses_usd)} -> ${report[j].verdict}`);
  }

  /* Report */
  const EDGE_MS = 150;
  const md = ['# What could Jev do inside Pantry?\n'];
  if (mock) md.push(MOCK_BANNER);
  md.push(
    'Six product jobs, each with a small hand-labelled test set (`scripts/jev/usecases-data.mjs`). **Accuracy** is over the questions with a clear right answer; ambiguous ones are n/a and not scored. ' +
      '**Confident & wrong** is the dangerous case — a noul below 0.1 or above 0.9 on the wrong side, or a choice with confidence above 0.9 that is wrong — because that is the answer the product would act on without a second look. ' +
      `Latency is wall time per call from this machine; the user would feel roughly that plus ~${EDGE_MS} ms for the Edge Function hop (an assumption, not measured here).\n`,
  );
  md.push('**The key can never ship to the browser.** Pantry is a static Vite build on Vercel (`vercel.json` has no functions) and everything in the bundle is public. The repo already runs server code as Supabase Edge Functions (`supabase/functions/send-reminders`), the CSP already allows `https://*.supabase.co`, and a secret there is `supabase secrets set OPENROUTER_API_KEY=...`. So every job below runs in a Supabase Edge Function.\n');
  md.push('## Summary\n');
  md.push('| job | calls | accuracy | confident & wrong | n/a | median / p90 | user would feel | per 1,000 uses | verdict |');
  md.push('|---|---|---|---|---|---|---|---|---|');
  for (const [j, r] of Object.entries(report))
    md.push(`| ${j} | ${r.calls} | ${pctStr(r.gold.accuracy)} (${r.gold.right}/${r.gold.scored})${r.gold.notRun ? `; ${r.gold.notRun} not run` : ''} | ${r.gold.confidentWrong} | ${r.gold.na} | ${msStr(r.latency.median)} / ${msStr(r.latency.p90)} | ${r.latency.median == null ? 'n/a' : '~' + msStr(r.latency.median + EDGE_MS)} | ${usdStr(r.per_1000_uses_usd)} | **${r.verdict}** |`);
  md.push('');
  for (const [j, r] of Object.entries(report)) {
    md.push(`## ${j}\n`);
    md.push(`**Verdict: ${r.verdict}.** Accuracy ${pctStr(r.gold.accuracy)}, confident & wrong ${r.gold.confidentWrong}, median ${msStr(r.latency.median)}, ${usdStr(r.per_1000_uses_usd)} per 1,000 uses.\n`);
    if (j === 'cravings') md.push(`Today the box is a substring match on dish name, cuisine and local name: it finds **nothing** for ${r.today_finds_nothing} of ${r.calls} of these phrases.\n`);
    if (j === 'moods') md.push(`Candidates: ${r.source}.\n`);
    md.push(`**How it would plug in.** ${r.note}\n`);
    const wrong = r.rows.flatMap((x) => x.scores.filter((s) => s.status === 'wrong' || s.status === 'error').map((s) => ({ ...s, label: x.label, id: x.id })));
    if (!wrong.length) md.push('No wrong answers on scored questions.\n');
    else {
      md.push(`Wrong answers (${wrong.length}):\n`);
      md.push('| case | question | expected | got | confident & wrong |');
      md.push('|---|---|---|---|---|');
      for (const w of wrong.slice(0, 60)) md.push(`| ${esc(w.label)} | ${w.question} | ${Array.isArray(w.gold) ? w.gold.join(' or ') : w.gold} | ${w.answer == null ? '(no answer)' : typeof w.answer === 'number' ? w.answer.toFixed(3) : w.answer}${w.confidence != null ? ` (conf ${w.confidence.toFixed(2)})` : ''} | ${w.confidentWrong ? '**yes**' : ''} |`);
      if (wrong.length > 60) md.push(`\n…and ${wrong.length - 60} more in usecases.json.`);
      md.push('');
    }
  }
  md.push('## Verdict rule\n');
  md.push('**use it**: accuracy ≥ 90% and no confident-and-wrong answers. **maybe**: accuracy ≥ 75% — as a suggestion with a fallback, or only with a person or a rule behind it if any answer was confidently wrong. **don\'t**: below 75%. The sets are small (15–30 cases), so one or two answers move a job across a line; read the wrong-answer tables before deciding.\n');

  writeFileSync(join(outDir, 'usecases.md'), md.join('\n'));
  writeFileSync(join(outDir, 'usecases.json'), JSON.stringify({ mode: mock ? 'mock' : 'live', model: MODEL, max_usd: maxUsd, spent_usd: jev.spentUsd, stopped: jev.stopped, jobs: report }, null, 2));
  console.log(`\nspent ${fmtUsd(jev.spentUsd)} of ${fmtUsd(maxUsd)}${mock ? ' (mock — nothing spent)' : ''}; requests ${jev.calls}, retries ${jev.retries}, errors ${jev.errors}`);
  console.log(`wrote ${join(outDir, 'usecases.md')} and usecases.json`);
  if (jev.stopped) process.exitCode = 3;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
