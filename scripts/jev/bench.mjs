#!/usr/bin/env node
/**
 * Is Jev worth it compared with a normal LLM?
 *
 * The same states and the same questions — built by the checks' own question
 * builders, so the wording is identical — go to TypeSafe's Jev (Decisions API)
 * and to one or two small general-purpose models on OpenRouter's chat
 * completions endpoint, asked for the same typed answers (a probability for a
 * noul, an offered label for a choice). Then both are scored the same way:
 *
 *   - agreement with the app's own diet labels (meetsDiet)
 *   - accuracy on hand-verified GOLD cases (gold.mjs; picks gold is exact by
 *     construction, see bench-tasks.mjs)
 *   - confident-and-wrong answers (the dangerous kind)
 *   - median / p90 wall time per call, tokens, dollars, dollars per 1,000
 *     questions
 *   - Jev only: consistency (the diets sample asked twice — how often does an
 *     answer cross 0.5?) and choice order-flips (the picks choice asked with
 *     the options in both orders). LLMs are asked once, to save money.
 *
 *   node scripts/jev/bench.mjs [--dry] [--mock] [--max-usd=0.30]
 *        [--models=anthropic/claude-*haiku*,openai/gpt-4o-mini]
 *        [--only=diets|translations|picks] [--out=jev-results] [--concurrency=4]
 *
 *   --dry     no network, no key: counts calls, estimates the worst case per
 *             model from stand-in prices (llm.mjs OFFLINE_MODELS), writes
 *             sample payloads.
 *   --mock    the whole pipeline offline: a fake Jev (lib.mjs) and a fake
 *             OpenRouter (llm.mjs) including GET /models.
 *   --models  comma list of model ids or globs, one model per entry;
 *             default one cheap Anthropic Haiku + one cheap OpenAI/Google mini/flash.
 *
 * The key is read from OPENROUTER_API_KEY and nowhere else.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildTasks, llmCall } from './bench-tasks.mjs';
import { DIETS, OTHER } from './app.mjs';
import { DIET_GOLD, TRANSLATION_GOLD_BROKEN, TRANSLATION_GOLD_OK } from './gold.mjs';
import { Jev, MODEL, MOCK_BANNER, esc, estimateTokens, fmtUsd, mask, mockFetch, usd } from './lib.mjs';
import { Budget, Llm, MOCK_EXTRA_PREFS, OFFLINE_MODELS, chatBody, dearestPlausible, estimateChatTokens, fetchModels, mockOpenRouterFetch, perMillion, prefsFromFlag, priceOf, selectModels } from './llm.mjs';
import { agreement, compareWord, flipRate, median, msStr, p90, pctStr, per1000, scoreChoice, scoreNoul, tally, times, usdStr } from './score.mjs';

/* ── Flags ───────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const a = argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
if (flag('help')) {
  console.log('usage: node scripts/jev/bench.mjs [--dry] [--mock] [--max-usd=0.30] [--models=a,b] [--only=diets|translations|picks] [--out=jev-results] [--concurrency=4]');
  process.exit(0);
}
const dry = flag('dry');
const mock = flag('mock');
const maxUsd = Number(opt('max-usd', '0.30'));
const only = opt('only');
const outDir = resolve(opt('out', 'jev-results'));
const concurrency = Number(opt('concurrency', '4'));
const prefs = prefsFromFlag(opt('models'));
if (!Number.isFinite(maxUsd) || maxUsd <= 0) {
  console.error('--max-usd must be a positive number');
  process.exit(2);
}
if (maxUsd > 0.45) console.warn(`warning: --max-usd ${maxUsd} is more than this script's share of the key's $1 cap (keep bench + usecases under $0.45).`);
if (only && !['diets', 'translations', 'picks'].includes(only)) {
  console.error('--only must be diets, translations or picks');
  process.exit(2);
}
const key = process.env.OPENROUTER_API_KEY;
if (!dry && !mock && !key) {
  console.error('OPENROUTER_API_KEY is not set. Export it in this shell, or use --dry / --mock.');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });
const mode = dry ? 'DRY (no network)' : mock ? 'MOCK (offline fakes)' : `LIVE, key ${mask(key)}`;
console.log(`Jev bench — ${mode}; tasks ${only || 'all'}; max ${fmtUsd(maxUsd)}; out ${outDir}`);

/* ── Tasks ───────────────────────────────────────────────────────────────── */

const T = buildTasks({ only });
const TASKS = ['diets', 'picks', 'translations', 'broken'].filter((t) => T[t].length);
const allCalls = TASKS.flatMap((t) => T[t]);
const nq = (calls) => calls.reduce((a, c) => a + Object.keys(c.questions).length, 0);
console.log(
  `  ${TASKS.map((t) => `${t} ${T[t].length} calls / ${nq(T[t])} q`).join('; ')}` +
    (T.picks.length ? '\n  picks scenarios are built from pure app modules (no browser, no picks-facts.json): see bench-tasks.mjs' : ''),
);

/** Jev: diets twice (consistency), everything else once. */
const jevPlan = [...T.diets.map((c) => ({ ...c, pass: 1 })), ...T.diets.map((c) => ({ ...c, pass: 2 })), ...T.picks, ...T.translations, ...T.broken];
const llmPlan = allCalls.map(llmCall);
const jevTokens = jevPlan.reduce((a, c) => a + estimateTokens({ model: MODEL, state: c.state, questions: c.questions }), 0);
const jevEstUsd = usd(jevTokens);

/** A model's worst case for the whole plan: estimated input + max_tokens output. */
function workloadOf(model) {
  let input = 0;
  let output = 0;
  for (const c of llmPlan) {
    const b = chatBody(model, c.state, c.questions, { maxTokens: c.maxTokens });
    input += estimateChatTokens(b);
    output += c.maxTokens;
  }
  return { input, output };
}
// Token counts barely depend on the model (only whether response_format is
// sent), so select on the workload of a plain body.
const plainWorkload = workloadOf({ id: 'x', supported_parameters: [] });
const worstUsd = (m) => {
  const w = workloadOf(m);
  const p = priceOf(m);
  return w.input * p.input + w.output * p.output;
};

/**
 * The gold-only subset: every call that carries a gold case. A model whose
 * full plan would break the budget gets this instead, before being skipped
 * outright; its report row says so.
 */
const goldDietIds = new Set(DIET_GOLD.map((g) => g.recipe));
const goldTrIds = new Set(TRANSLATION_GOLD_OK.map((g) => g.id));
const inGoldSubset = (c) => c.task === 'picks' || c.task === 'broken' || (c.task === 'diets' && goldDietIds.has(c.id)) || (c.task === 'translations' && goldTrIds.has(c.id));
const worstFor = (m, plan) =>
  plan.reduce((a, c) => a + estimateChatTokens(chatBody(m, c.state, c.questions, { maxTokens: c.maxTokens })) * m.price.input + c.maxTokens * m.price.output, 0);

/* ── Dry run ─────────────────────────────────────────────────────────────── */

if (dry) {
  const dir = join(outDir, 'samples');
  mkdirSync(dir, { recursive: true });
  for (const t of TASKS) {
    writeFileSync(join(dir, `bench-${t}-jev.json`), JSON.stringify({ model: MODEL, state: T[t][0].state, questions: T[t][0].questions }, null, 2));
    writeFileSync(join(dir, `bench-${t}-llm.json`), JSON.stringify(chatBody(OFFLINE_MODELS[4], llmCall(T[t][0]).state, llmCall(T[t][0]).questions, { maxTokens: T[t][0].maxTokens }), null, 2));
  }
  const { chosen, considered } = selectModels(OFFLINE_MODELS, { prefs, workload: plainWorkload });
  const dear = dearestPlausible(OFFLINE_MODELS, { prefs, workload: plainWorkload });
  console.log(`\n  Jev: ${jevPlan.length} calls (diets twice), ~${jevTokens.toLocaleString()} input tokens est. -> ~${fmtUsd(jevEstUsd)}`);
  console.log(`  LLM workload per model: ${llmPlan.length} calls, ~${plainWorkload.input.toLocaleString()} input tokens est. + up to ${plainWorkload.output.toLocaleString()} output tokens (max_tokens caps)`);
  console.log('  models the default preference would choose from the stand-in list (a live run reads GET /models):');
  /** What the live loop below would decide for each model, cheapest first. */
  const simulate = (models) => {
    let total = jevEstUsd;
    const rows = [];
    for (const m of models.map((x) => ({ m: x, w: worstUsd(x) })).sort((a, b) => a.w - b.w)) {
      const wg = worstFor(m.m, llmPlan.filter(inGoldSubset));
      const decision = total + m.w <= maxUsd ? 'full' : total + wg <= maxUsd ? 'gold-only' : 'skip';
      const spend = decision === 'full' ? m.w : decision === 'gold-only' ? wg : 0;
      total += spend;
      rows.push({ id: m.m.id, input_per_m: m.m.price.input * 1e6, output_per_m: m.m.price.output * 1e6, worst_usd_full: m.w, worst_usd_gold_only: wg, decision, worst_usd_charged: spend });
    }
    return { rows, total };
  };
  const show = (r) => `    ${r.id.padEnd(34)} $${r.input_per_m.toFixed(3)}/M in / $${r.output_per_m.toFixed(3)}/M out  full ~${fmtUsd(r.worst_usd_full)}, gold-only ~${fmtUsd(r.worst_usd_gold_only)} -> ${r.decision.toUpperCase()}`;
  const likely = simulate(chosen);
  for (const r of likely.rows) console.log(show(r));
  const ceilingModels = dear.filter((d) => d.id).map((d) => OFFLINE_MODELS.find((m) => m.id === d.id)).map((m) => ({ ...m, price: priceOf(m) }));
  const ceiling = simulate(ceilingModels);
  console.log('  ceiling, if only the dearest non-thinking match per group were listed:');
  for (const r of ceiling.rows) console.log(show(r));
  const total = Math.max(likely.total, ceiling.total);
  const scriptWorst = Math.min(maxUsd, total);
  console.log(`\n  bench worst case: likely ~${fmtUsd(likely.total)}, ceiling ~${fmtUsd(ceiling.total)}; hard cap --max-usd ${fmtUsd(maxUsd)} -> at most ${fmtUsd(scriptWorst)}`);
  writeFileSync(
    join(outDir, 'bench-dry.json'),
    JSON.stringify({ mode: 'dry', max_usd: maxUsd, tasks: Object.fromEntries(TASKS.map((t) => [t, { calls: T[t].length, questions: nq(T[t]) }])), jev: { calls: jevPlan.length, est_tokens: jevTokens, est_usd: jevEstUsd }, llm_workload: plainWorkload, likely, ceiling, considered, est_total_usd: total, worst_case_usd: scriptWorst }, null, 2),
  );
  console.log(`  wrote ${join(outDir, 'bench-dry.json')} and samples/bench-*.json`);
  process.exit(0);
}

/* ── Running ─────────────────────────────────────────────────────────────── */

/** Run calls `concurrency` at a time, timing each. fn(call) -> result. */
async function runTimed(calls, fn, label) {
  const out = new Array(calls.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < calls.length) {
      const i = next++;
      const t0 = performance.now();
      const r = await fn(calls[i]);
      if (r && r.ms == null) r.ms = performance.now() - t0;
      out[i] = r;
      if (++done % 40 === 0 || done === calls.length) console.log(`  ${label} ${done}/${calls.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, calls.length) }, worker));
  return out;
}

/** In mock, the second diets pass goes through a fetch that nudges a few
 *  answers across 0.5, so the consistency code has flips to count. */
function jitteredMock() {
  const base = mockFetch({ failAt: {} });
  let n = 0;
  return async (url, init) => {
    const res = await base(url, init);
    const json = await res.json();
    for (const a of Object.values(json.answers || {})) if (a.type === 'noul' && ++n % 11 === 0) a.noul = +(1 - a.noul).toFixed(3);
    return new Response(JSON.stringify(json), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

const budget = new Budget(maxUsd);
const jev = new Jev({ apiKey: key, mock, maxUsd, concurrency, outDir });
const jev2 = mock ? new Jev({ apiKey: key, mock, maxUsd, concurrency, outDir, fetchImpl: jitteredMock() }) : jev;
console.log(`\n[jev] ${jevPlan.length} calls, est. ~${fmtUsd(jevEstUsd)}`);
const jevRes = await runTimed(jevPlan, (c) => (c.pass === 2 ? jev2 : jev).decide(c.state, c.questions, { id: `${c.task}:${c.id}${c.pass ? '#' + c.pass : ''}` }), 'jev');
const jevSpent = jev.spentUsd + (jev2 !== jev ? jev2.spentUsd : 0);
budget.commit(jevSpent);
console.log(`  jev spent ${fmtUsd(jevSpent)}${mock ? ' (mock)' : ''}; ${fmtUsd(budget.left())} left for the LLMs`);

/* LLMs */
const orFetch = mock ? mockOpenRouterFetch() : globalThis.fetch;
let listing = null;
let listingError = null;
try {
  listing = await fetchModels({ fetchImpl: orFetch, apiKey: mock ? undefined : key });
} catch (e) {
  listingError = String(e.message || e);
  console.log(`  could not list models (${listingError}); running Jev only`);
  listingError = `could not read the model list (${listingError})`;
}
// --mock also asks for two made-up dear models, so the gold-only and skip
// paths run on every mock (unless --models narrows the choice).
const livePrefs = mock && !opt('models') ? [...prefs, ...MOCK_EXTRA_PREFS] : prefs;
const selection = listing ? selectModels(listing, { prefs: livePrefs, workload: plainWorkload }) : { chosen: [], considered: [] };
// No point paying for the comparison when Jev itself did not answer: the
// usual cause is an envelope findAnswers() cannot read (see JEV-RUN.md step 3).
const jevAnswered = jevRes.filter((r) => r && r.ok).length;
const jevBroken = jev.stopped || jevAnswered < jevPlan.length / 2 ? `Jev answered ${jevAnswered} of ${jevPlan.length} calls${jev.stopped ? ` and stopped (${jev.stopped})` : ''}` : null;
if (jevBroken) {
  console.log(`  NOT running any LLM: ${jevBroken}. Fix that first; nothing more is spent.`);
  selection.chosen = [];
  listingError = `not run: ${jevBroken}`;
}
const systems = [];
const llmRuns = [];
// Cheapest first, so a dear model can never crowd out a cheap one.
const ordered = selection.chosen.map((m) => ({ m, w: worstUsd(m) })).sort((a, b) => a.w - b.w);
for (const { m, w } of ordered) {
  console.log(`\n[${m.id}] ${perMillion(m.price.input)} in / ${perMillion(m.price.output)} out; worst case for ${llmPlan.length} calls ~${fmtUsd(w)}${m.thinks ? ' (a thinking model: nothing cheaper matched)' : ''}`);
  let plan = llmPlan;
  let subset = null;
  if (w > budget.left()) {
    const goldPlan = llmPlan.filter(inGoldSubset);
    const wg = worstFor(m, goldPlan);
    if (wg > budget.left()) {
      console.log(`  SKIPPED: ~${fmtUsd(w)} worst case (gold-only ~${fmtUsd(wg)}) > ${fmtUsd(budget.left())} left under --max-usd`);
      llmRuns.push({ model: m, skipped: `worst case ${fmtUsd(w)} (gold-only ${fmtUsd(wg)}) > ${fmtUsd(budget.left())} left` });
      continue;
    }
    subset = `gold-only subset, ${goldPlan.length} of ${llmPlan.length} calls (full plan worst case ${fmtUsd(w)} > ${fmtUsd(budget.left())} left)`;
    console.log(`  full plan does not fit; running the ${subset}`);
    plan = llmPlan.map((c) => (inGoldSubset(c) ? c : { ...c, notRun: true }));
  }
  const client = new Llm({ model: m, budget, apiKey: key, mock, fetchImpl: orFetch, outDir, concurrency });
  const res = await runTimed(
    plan,
    (c) => (c.notRun ? Promise.resolve({ skipped: true, notRun: true, reason: 'not in the gold-only subset', ms: null }) : client.ask(c.state, c.questions, { id: `${c.task}:${c.id}`, maxTokens: c.maxTokens })),
    m.id,
  );
  console.log(`  spent ${fmtUsd(client.spentUsd)}${mock ? ' (mock)' : ''}; requests ${client.calls}, retries ${client.retries}, errors ${client.errors}${client.stopped ? '; STOPPED: ' + client.stopped : ''}`);
  llmRuns.push({ model: m, res, client, subset });
}

/* ── Scoring ─────────────────────────────────────────────────────────────── */

const val = (r, q) => (r?.answers?.[q]?.ok ? r.answers[q].value : null);
const conf = (r, q) => r?.answers?.[q]?.confidence ?? null;

/**
 * Everything about one system. `byTask` maps task -> results aligned with
 * T[task]; `diets2` is Jev's second diets pass.
 */
function measure(name, kind, byTask, extra = {}) {
  const all = TASKS.flatMap((t) => byTask[t] || []).concat(extra.diets2 || []);
  const ok = all.filter((r) => r && !r.skipped && !r.error);
  const ms = ok.map((r) => r.ms);
  const questions = ok.reduce((a, r) => a + Object.values(r.answers || {}).filter((x) => x.ok).length, 0);
  const cost = all.reduce((a, r) => a + (r?.usage?.costUsd ?? 0), 0);
  const inTok = all.reduce((a, r) => a + (r?.usage?.inputTokens ?? r?.usage?.estTokens ?? 0), 0);
  const outTok = all.reduce((a, r) => a + (r?.usage?.outputTokens ?? 0), 0);
  const costSources = [...new Set(all.map((r) => r?.usage?.costSource ?? (r?.usage?.cost != null ? 'reported' : r?.usage ? 'estimated' : null)).filter(Boolean))];
  const perTask = {};
  const goldRows = [];

  if (byTask.diets) {
    const ps = [];
    const truths = [];
    T.diets.forEach((c, i) => {
      for (const d of DIETS) {
        ps.push(val(byTask.diets[i], d.id));
        truths.push(c.meta.app[d.id]);
      }
    });
    const g = DIET_GOLD.map((x) => {
      const i = T.diets.findIndex((c) => c.id === x.recipe);
      const p = i >= 0 ? val(byTask.diets[i], x.diet) : null;
      const s = scoreNoul(p, x.gold);
      goldRows.push({ task: 'diets', case: `${x.recipe} / ${x.diet}`, gold: x.gold, answer: p, ...s, why: x.why });
      return s;
    });
    perTask.diets = { app_agreement: agreement(ps, truths), gold: tally(g), ms: { median: median(byTask.diets.map((r) => r?.ms)), p90: p90(byTask.diets.map((r) => r?.ms)) } };
    if (extra.diets2) {
      const a = [];
      const b = [];
      T.diets.forEach((c, i) => DIETS.forEach((d) => (a.push(val(byTask.diets[i], d.id)), b.push(val(extra.diets2[i], d.id)))));
      perTask.diets.consistency = flipRate(a, b);
    }
  }
  if (byTask.picks) {
    const ok_ = [];
    const best = [];
    let flips = 0;
    let both = 0;
    T.picks.forEach((c, i) => {
      const r = byTask.picks[i];
      const p = val(r, 'pick_ok');
      const s1 = scoreNoul(p, c.meta.gold.pick_ok);
      ok_.push(s1);
      goldRows.push({ task: 'picks', case: `${c.id} pick_ok`, gold: c.meta.gold.pick_ok, answer: p, ...s1 });
      const lab = val(r, 'best_a');
      const s2 = scoreChoice(lab, c.meta.gold.best, conf(r, 'best_a'));
      best.push(s2);
      goldRows.push({ task: 'picks', case: `${c.id} best`, gold: c.meta.gold.best, answer: lab, ...s2 });
      const labB = val(r, 'best_b');
      if (lab != null && labB != null) {
        both++;
        if (lab !== labB) flips++;
      }
    });
    perTask.picks = { pick_ok: tally(ok_), best: tally(best), ms: { median: median(byTask.picks.map((r) => r?.ms)), p90: p90(byTask.picks.map((r) => r?.ms)) } };
    if (kind === 'jev') perTask.picks.order_flips = { flips, pairs: both, rate: both ? flips / both : null };
  }
  if (byTask.translations || byTask.broken) {
    const g = [];
    for (const x of TRANSLATION_GOLD_OK) {
      const i = T.translations.findIndex((c) => c.id === x.id);
      const p = i >= 0 ? val(byTask.translations[i], `${x.lang}_faithful`) : null;
      const s = scoreNoul(p, true);
      g.push(s);
      goldRows.push({ task: 'translations', case: `${x.id} ${x.lang} (faithful)`, gold: true, answer: p, ...s, why: x.why });
    }
    TRANSLATION_GOLD_BROKEN.forEach((x, i) => {
      const p = val(byTask.broken?.[i], `${x.lang}_faithful`);
      const s = scoreNoul(p, false);
      g.push(s);
      goldRows.push({ task: 'translations', case: `${x.id} ${x.lang} (${x.kind})`, gold: false, answer: p, ...s, why: x.why });
    });
    const ps = (byTask.translations || []).flatMap((r) => OTHER.map((l) => val(r, `${l}_faithful`)));
    const judged = ps.filter((p) => p != null);
    perTask.translations = { gold: tally(g), flagged: judged.filter((p) => p < 0.5).length, judged: judged.length, ms: { median: median((byTask.translations || []).map((r) => r?.ms)), p90: p90((byTask.translations || []).map((r) => r?.ms)) } };
  }
  const goldAll = tally(goldRows);
  return {
    name,
    kind,
    ...extra.info,
    calls: all.length,
    answered_calls: ok.length,
    skipped: all.filter((r) => r?.skipped).length,
    failed: all.filter((r) => r && !r.skipped && r.error).length,
    questions_answered: questions,
    latency: { median: median(ms), p90: p90(ms) },
    tokens: { input: inTok, output: outTok },
    cost_usd: cost,
    cost_sources: costSources,
    per_1000_questions_usd: per1000(cost, questions),
    gold: goldAll,
    per_task: perTask,
    gold_rows: goldRows,
  };
}

const split = (res, plan) => {
  const by = {};
  plan.forEach((c, i) => {
    const k = c.pass === 2 ? 'diets2' : c.task;
    (by[k] ||= []).push(res[i]);
  });
  return by;
};
const jb = split(jevRes, jevPlan);
systems.push(measure(`Jev (${MODEL})`, 'jev', { diets: jb.diets, picks: jb.picks, translations: jb.translations, broken: jb.broken }, { diets2: jb.diets2, info: { id: MODEL, price: 'input $0.042/M, output free' } }));
for (const run of llmRuns) {
  if (!run.res) continue;
  const lb = split(run.res, llmPlan);
  const m = measure(run.model.id, 'llm', { diets: lb.diets, picks: lb.picks, translations: lb.translations, broken: lb.broken }, { info: { id: run.model.id, price: `input ${perMillion(run.model.price.input)}, output ${perMillion(run.model.price.output)}`, ...(run.subset ? { subset: run.subset } : {}) } });
  // How often the LLM lands on the same side of 0.5 as Jev, over everything both answered.
  const pairsL = [];
  const pairsJ = [];
  for (const t of ['diets', 'translations']) {
    (T[t] || []).forEach((c, i) => {
      for (const q of Object.keys(c.questions)) {
        pairsL.push(val(lb[t]?.[i], q));
        pairsJ.push(val(jb[t]?.[i], q));
      }
    });
  }
  m.agreement_with_jev = agreement(pairsL, pairsJ);
  systems.push(m);
}

/* ── Report ──────────────────────────────────────────────────────────────── */

const J = systems[0];
const L = systems.slice(1);
const md = ['# Is Jev worth it? Jev vs general LLMs on Pantry\'s own questions\n'];
if (mock) md.push(MOCK_BANNER + '> The LLM answers come from the fake OpenRouter in `scripts/jev/llm.mjs`, and `mock/*` models do not exist. Every number and verdict below is meaningless.\n');
md.push(
  'The same state and the same questions — built by the checks\' own question builders, word for word — went to Jev and to general LLMs on OpenRouter (chat completions, asked for a JSON object of typed answers). ' +
    'A noul is read as yes at ≥ 0.5. **Gold** cases are hand-verified (`scripts/jev/gold.mjs`) or exact by construction (picks). ' +
    '**Confident and wrong** means a noul below 0.1 or above 0.9 on the wrong side, or a choice with confidence above 0.9 that is wrong — the answers you would act on without checking.\n',
);
md.push(`Tasks: ${TASKS.map((t) => `${t} ${T[t].length} calls / ${nq(T[t])} questions`).join('; ')}. Jev also answered the diets sample a second time (consistency) and each picks choice with the options reversed (order flips).`);
if (T.picks.length) md.push('Picks scenarios are built from pure app modules (the check\'s own people, the cookbook, meetsDiet, toLocal), not from the browser: in most, exactly one of the five candidates keeps every hard constraint; in the rest, none does. See `bench-tasks.mjs`.');
md.push('');
md.push('## Models\n');
md.push('| system | price | cost figure |');
md.push('|---|---|---|');
md.push(`| ${J.name} | ${J.price} | ${J.cost_sources.join(', ') || 'n/a'} |`);
for (const s of L) md.push(`| ${s.name} | ${s.price} | ${s.cost_sources.join(', ') || 'n/a'}${s.subset ? `; **${s.subset}**` : ''} |`);
for (const r of llmRuns.filter((x) => x.skipped)) md.push(`| ${r.model.id} | ${perMillion(r.model.price.input)} in / ${perMillion(r.model.price.output)} out | **skipped**: ${r.skipped} |`);
if (listingError) md.push(`\nNo LLM ran: ${esc(listingError)}.`);
if (!selection.chosen.length && listing) md.push(`\nNo listed model matched --models (${prefs.map((p) => p.patterns.join('|')).join(', ')}).`);
md.push('');

md.push('## Headline\n');
md.push('| system | gold accuracy | confident & wrong | agrees with app (diets) | median / p90 per call | tokens in / out | cost | per 1,000 questions |');
md.push('|---|---|---|---|---|---|---|---|');
for (const s of systems) {
  const aa = s.per_task.diets?.app_agreement;
  md.push(`| ${s.name} | ${pctStr(s.gold.accuracy)} (${s.gold.right}/${s.gold.scored}) | ${s.gold.confidentWrong} | ${aa ? `${pctStr(aa.rate)} (${aa.agree}/${aa.n})` : 'n/a'} | ${msStr(s.latency.median)} / ${msStr(s.latency.p90)} | ${s.tokens.input.toLocaleString()} / ${s.tokens.output.toLocaleString()} | ${usdStr(s.cost_usd)} | ${usdStr(s.per_1000_questions_usd)} |`);
}
md.push('');
md.push('## By task\n');
md.push('| system | diets gold | picks: pick_ok | picks: best dish | translations gold | translation flags (< 0.5) | agrees with Jev |');
md.push('|---|---|---|---|---|---|---|');
const tl = (t) => (t ? `${pctStr(t.accuracy)} (${t.right}/${t.scored})` : 'n/a');
for (const s of systems) {
  const p = s.per_task;
  md.push(`| ${s.name} | ${tl(p.diets?.gold)} | ${tl(p.picks?.pick_ok)} | ${tl(p.picks?.best)} | ${tl(p.translations?.gold)} | ${p.translations ? `${p.translations.flagged}/${p.translations.judged}` : 'n/a'} | ${s.agreement_with_jev ? pctStr(s.agreement_with_jev.rate) : '—'} |`);
}
md.push('');
md.push('## Jev only: stability\n');
const cons = J.per_task.diets?.consistency;
const of = J.per_task.picks?.order_flips;
md.push(`- **Consistency** — the diets sample asked twice: ${cons ? `${cons.flips} of ${cons.pairs} answers crossed 0.5 (${pctStr(cons.rate)})${cons.missing ? `; ${cons.missing} pairs missing` : ''}` : 'not run'}.`);
md.push(`- **Order flips** — the picks choice with the five options reversed: ${of ? `${of.flips} of ${of.pairs} changed answer (${pctStr(of.rate)})` : 'not run'}.`);
md.push('- LLMs were asked once each, to keep the spend down, so neither figure is measured for them.\n');

md.push('## Verdict\n');
if (!L.length) md.push('No LLM ran, so there is nothing to compare Jev with. See the Models table.\n');
for (const s of L) {
  const gw = compareWord(J.gold.accuracy, s.gold.accuracy);
  const ja = J.per_task.diets?.app_agreement?.rate;
  const la = s.per_task.diets?.app_agreement?.rate;
  md.push(`**Jev vs ${s.name}.** On gold cases Jev is **${gw}** ${s.name} (${pctStr(J.gold.accuracy)} vs ${pctStr(s.gold.accuracy)}; confident-and-wrong ${J.gold.confidentWrong} vs ${s.gold.confidentWrong}). ` +
    (ja != null && la != null ? `On agreeing with the app's diet labels it is ${compareWord(ja, la)} it (${pctStr(ja)} vs ${pctStr(la)}). ` : '') +
    `Median latency ${msStr(J.latency.median)} vs ${msStr(s.latency.median)} — Jev is ${J.latency.median != null && s.latency.median != null ? (J.latency.median <= s.latency.median ? `${times(s.latency.median, J.latency.median)} faster` : `${times(J.latency.median, s.latency.median)} slower`) : 'n/a'}. ` +
    `Per 1,000 questions ${usdStr(J.per_1000_questions_usd)} vs ${usdStr(s.per_1000_questions_usd)} — Jev is ${J.per_1000_questions_usd != null && s.per_1000_questions_usd ? (J.per_1000_questions_usd <= s.per_1000_questions_usd ? `${times(s.per_1000_questions_usd, J.per_1000_questions_usd)} cheaper` : `${times(J.per_1000_questions_usd, s.per_1000_questions_usd)} dearer`) : 'n/a'}.\n`);
}
md.push('How to read it: gold sets are small (25 diet cases, 20 + 20 picks answers, 15 translation cases), so a difference of one or two cases is noise. The cost multiple is the robust number; the accuracy numbers say whether Jev is in the same league.\n');

md.push('## Every gold miss\n');
for (const s of systems) {
  const miss = s.gold_rows.filter((g) => g.status === 'wrong' || g.status === 'error');
  md.push(`### ${s.name} (${miss.length})\n`);
  if (!miss.length) {
    md.push('None.\n');
    continue;
  }
  md.push('| task | case | gold | answer | confident & wrong | why the gold is what it is |');
  md.push('|---|---|---|---|---|---|');
  for (const g of miss) md.push(`| ${g.task} | ${esc(g.case)} | ${g.gold} | ${g.answer == null ? '(no answer)' : typeof g.answer === 'number' ? g.answer.toFixed(3) : g.answer} | ${g.confidentWrong ? '**yes**' : ''} | ${esc(g.why || '')} |`);
  md.push('');
}
md.push('## Caveats\n');
md.push('- Latency is wall time per call from this machine, including any retry, with up to ' + concurrency + ' calls in flight.');
md.push('- LLM cost is `usage.cost` when OpenRouter returned it, otherwise the listed per-token price times the reported tokens (the Models table says which).');
md.push('- The LLMs see a short system prompt explaining the answer format; Jev needs none. Both see the identical state and questions.');
md.push('- Diet gold follows the app\'s own definitions (DEFS in check-diets.mjs). One gold case (bangers and mash / no pork) deliberately disagrees with the app, which misses the bare word "Sausages".');

writeFileSync(join(outDir, 'bench.md'), md.join('\n'));
writeFileSync(
  join(outDir, 'bench.json'),
  JSON.stringify(
    {
      mode: mock ? 'mock' : 'live',
      max_usd: maxUsd,
      spent_usd: budget.spent,
      tasks: Object.fromEntries(TASKS.map((t) => [t, { calls: T[t].length, questions: nq(T[t]) }])),
      models_considered: selection.considered,
      skipped_models: llmRuns.filter((r) => r.skipped).map((r) => ({ id: r.model.id, reason: r.skipped })),
      systems,
    },
    null,
    2,
  ),
);

console.log('\n' + '─'.repeat(60));
for (const s of systems) console.log(`${s.name.slice(0, 34).padEnd(34)} gold ${pctStr(s.gold.accuracy).padStart(6)}  conf-wrong ${String(s.gold.confidentWrong).padStart(2)}  median ${msStr(s.latency.median).padStart(7)}  ${usdStr(s.cost_usd)}  per 1k q ${usdStr(s.per_1000_questions_usd)}`);
console.log(`spent ${fmtUsd(budget.spent)} of ${fmtUsd(maxUsd)}${mock ? ' (mock — nothing spent)' : ''}`);
console.log(`wrote ${join(outDir, 'bench.md')} and bench.json`);
if (jev.stopped || llmRuns.some((r) => r.client?.stopped)) process.exitCode = 3;
