/**
 * Tests for bench.mjs and usecases.mjs, offline:  node --test scripts/jev/bench.test.mjs
 *
 * node:test and outside src/, like lib.test.mjs, so the app's vitest run never
 * sees it. No network: every client test uses a fake fetch.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { DIETS, RECIPES, meetsDiet } from './app.mjs';
import { dietCalls, pickCalls, pickFacts, translationCalls } from './bench-tasks.mjs';
import { DIET_GOLD, TRANSLATION_GOLD_BROKEN, TRANSLATION_GOLD_OK } from './gold.mjs';
import { choice, noul, score } from './lib.mjs';
import { Budget, Llm, OFFLINE_MODELS, answerSchema, chatBody, contentOf, costFromUsage, globToRegExp, mockOpenRouterFetch, parseLlmAnswers, prefsFromFlag, priceOf, selectModels } from './llm.mjs';
import { agreement, compareWord, flipRate, median, p90, per1000, quantile, scoreChoice, scoreLevel, scoreNoul, tally, verdictFor } from './score.mjs';
import { CUISINES, buildJobs, buildReport, defaultTop5, moodGold, scoreCall, slug, todayMatches, top5FromPicksFile } from './usecases.mjs';
import { CRAVINGS, CUPBOARD, PRICE_REPORTS, SWAPS, parseDietGold } from './usecases-data.mjs';

const out = () => mkdtempSync(join(tmpdir(), 'jev-bench-'));
const quiet = () => {};
const Q = { a: noul('is it?'), b: choice('which?', { x: 'x', y: 'y', none: 'neither' }), c: score('how much?', ['low', 'mid', 'high']) };
const reply = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
const chat = (content, usage = { prompt_tokens: 100, completion_tokens: 10 }) => reply(200, { choices: [{ message: { content } }], usage });

/* ── Gold-set scoring ────────────────────────────────────────────────────── */

test('scores nouls against gold, and flags only the confident mistakes', () => {
  assert.deepEqual(scoreNoul(0.97, true), { status: 'right', confidentWrong: false });
  assert.deepEqual(scoreNoul(0.5, true), { status: 'right', confidentWrong: false }, '0.5 reads as yes');
  assert.deepEqual(scoreNoul(0.3, true), { status: 'wrong', confidentWrong: false });
  assert.deepEqual(scoreNoul(0.05, true), { status: 'wrong', confidentWrong: true });
  assert.deepEqual(scoreNoul(0.95, false), { status: 'wrong', confidentWrong: true });
  assert.deepEqual(scoreNoul(0.9, false), { status: 'wrong', confidentWrong: false }, '0.9 exactly is not outside 0.1..0.9');
  assert.equal(scoreNoul(null, true).status, 'error');
  assert.equal(scoreNoul(0.2, null).status, 'n/a');
});

test('scores choices, including several acceptable labels and n/a gold', () => {
  assert.equal(scoreChoice('pakistani', ['pakistani', 'indian']).status, 'right');
  assert.equal(scoreChoice('thai', ['pakistani', 'indian']).status, 'wrong');
  assert.equal(scoreChoice('thai', 'indian', 0.95).confidentWrong, true);
  assert.equal(scoreChoice('thai', 'indian', 0.6).confidentWrong, false);
  assert.equal(scoreChoice('thai', null).status, 'n/a');
  assert.equal(scoreChoice(undefined, 'x').status, 'error');
  assert.equal(scoreLevel(2.4, 2).status, 'right');
  assert.equal(scoreLevel(0.4, 3).confidentWrong, true);
  assert.equal(scoreLevel(1, null).status, 'n/a');
});

test('tallies: errors count against accuracy, n/a does not', () => {
  const t = tally([{ status: 'right' }, { status: 'right' }, { status: 'wrong', confidentWrong: true }, { status: 'error' }, { status: 'n/a' }]);
  assert.equal(t.scored, 4);
  assert.equal(t.accuracy, 0.5);
  assert.equal(t.confidentWrong, 1);
  assert.equal(t.na, 1);
  assert.equal(tally([{ status: 'n/a' }]).accuracy, null);
});

test('quantiles, flips, agreement, money and verdicts', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(p90([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 9.1);
  assert.equal(quantile([], 0.5), null);
  assert.equal(median([null, 5, undefined]), 5);
  assert.deepEqual(flipRate([0.9, 0.1, 0.6, null], [0.8, 0.7, 0.4, 0.5]), { flips: 2, pairs: 3, missing: 1, rate: 2 / 3 });
  assert.deepEqual(agreement([0.9, 0.2, 0.7], [true, true, 0.9]), { agree: 2, n: 3, rate: 2 / 3 });
  assert.equal(per1000(0.5, 250), 2);
  assert.equal(per1000(1, 0), null);
  assert.equal(verdictFor({ accuracy: 0.95, confidentWrong: 0, scored: 20 }), 'use it');
  assert.match(verdictFor({ accuracy: 0.95, confidentWrong: 1, scored: 20 }), /^maybe — only with a human/);
  assert.match(verdictFor({ accuracy: 0.8, confidentWrong: 0, scored: 20 }), /^maybe — as a suggestion/);
  assert.equal(verdictFor({ accuracy: 0.6, confidentWrong: 0, scored: 20 }), "don't");
  assert.match(verdictFor({ accuracy: 1, confidentWrong: 0, scored: 1 }, { mock: true }), /mock/);
  assert.match(verdictFor({ accuracy: null, confidentWrong: 0, scored: 0 }), /can't tell/);
  assert.equal(compareWord(0.8, 0.83), 'as good as');
  assert.equal(compareWord(0.9, 0.7), 'better than');
  assert.equal(compareWord(0.6, 0.7), 'worse than');
});

/* ── LLM replies ─────────────────────────────────────────────────────────── */

test('parses the JSON small models actually return', () => {
  const plain = parseLlmAnswers('{"a": 0.8, "b": "y", "c": 1.5}', Q);
  assert.equal(plain.answers.a.value, 0.8);
  assert.equal(plain.answers.b.value, 'y');
  assert.equal(plain.answers.c.value, 1.5);
  const fenced = parseLlmAnswers('Sure! Here you go:\n```json\n{"a": "0.25", "b": "NONE", "c": 0}\n```\nHope that helps.', Q);
  assert.equal(fenced.answers.a.value, 0.25, 'number as a string');
  assert.equal(fenced.answers.b.value, 'none', 'label in the wrong case');
  const bools = parseLlmAnswers('{"a": true, "b": "x", "c": 2}', Q);
  assert.equal(bools.answers.a.value, 1, 'true reads as 1');
  const nested = parseLlmAnswers('{"answers": {"a": 0.1, "b": "x", "c": 1}}', Q);
  assert.equal(nested.answers.a.value, 0.1);
  const objChoice = parseLlmAnswers('{"a": 0.4, "b": {"choice": "y"}, "c": 1}', Q);
  assert.equal(objChoice.answers.b.value, 'y');
});

test('an unreadable or out-of-range reply is an error, never an opinion', () => {
  assert.equal(parseLlmAnswers('', Q).answers.a.ok, false);
  assert.match(parseLlmAnswers('I cannot tell from this.', Q).problem, /no JSON object/);
  assert.match(parseLlmAnswers('{"a": 0.5, "b": }', Q).problem, /not valid JSON/);
  assert.equal(parseLlmAnswers('[1,2]', Q).answers.a.ok, false);
  const r = parseLlmAnswers('{"a": 1.7, "b": "z", "c": 9}', Q);
  assert.equal(r.answers.a.ok, false, 'noul above 1');
  assert.equal(r.answers.b.ok, false, 'label never offered');
  assert.equal(r.answers.c.ok, false, 'score past the last level');
  const partial = parseLlmAnswers('{"a": 0.3}', Q);
  assert.equal(partial.answers.a.ok, true);
  assert.equal(partial.answers.b.ok, false);
});

test('builds a strict schema and only sends response_format a model supports', () => {
  const s = answerSchema(Q);
  assert.deepEqual(s.required, ['a', 'b', 'c']);
  assert.deepEqual(s.properties.b.enum, ['x', 'y', 'none']);
  assert.equal(s.additionalProperties, false);
  const strict = chatBody({ id: 'm', supported_parameters: ['structured_outputs'] }, { s: 1 }, Q, { maxTokens: 50 });
  assert.equal(strict.response_format.type, 'json_schema');
  assert.equal(strict.max_tokens, 50);
  assert.equal(chatBody({ id: 'm', supported_parameters: ['response_format'] }, {}, Q, { maxTokens: 5 }).response_format.type, 'json_object');
  assert.equal(chatBody({ id: 'm', supported_parameters: [] }, {}, Q, { maxTokens: 5 }).response_format, undefined);
  const user = JSON.parse(strict.messages[1].content);
  assert.deepEqual(user, { state: { s: 1 }, questions: Q }, 'the LLM sees exactly the Jev state and questions');
  assert.equal(contentOf({ choices: [{ message: { content: [{ type: 'text', text: '{"a"' }, { type: 'text', text: ':1}' }] } }] }), '{"a":1}');
});

/* ── Cost ────────────────────────────────────────────────────────────────── */

test('cost: usage.cost wins, otherwise listed prices times tokens', () => {
  const m = { pricing: { prompt: '0.000001', completion: '0.000005' } };
  assert.deepEqual(priceOf(m), { input: 1e-6, output: 5e-6, request: 0 });
  const listed = costFromUsage({ prompt_tokens: 1000, completion_tokens: 100 }, m);
  assert.equal(listed.source, 'listed-price');
  assert.ok(Math.abs(listed.usd - 0.0015) < 1e-12);
  const rep = costFromUsage({ prompt_tokens: 1000, completion_tokens: 100, cost: 0.00042 }, m);
  assert.equal(rep.source, 'reported');
  assert.equal(rep.usd, 0.00042);
  assert.equal(costFromUsage({ cost: '0.001' }, m).usd, 0.001);
  assert.equal(costFromUsage(undefined, m).usd, 0);
});

test('a shared budget refuses what would pass the cap', () => {
  const b = new Budget(0.01);
  assert.equal(b.reserve(0.006), true);
  assert.equal(b.reserve(0.006), false, 'two in flight cannot both have the last cent');
  b.release(0.006);
  b.commit(0.004);
  assert.ok(Math.abs(b.left() - 0.006) < 1e-12);
});

/* ── Choosing models ─────────────────────────────────────────────────────── */

test('selects the cheapest plain match per group from a /models listing', () => {
  const workload = { input: 200000, output: 20000 };
  const { chosen, considered } = selectModels(OFFLINE_MODELS, { workload });
  assert.deepEqual(
    chosen.map((m) => m.id),
    ['anthropic/claude-3-haiku', 'google/gemini-2.0-flash-001'],
  );
  assert.ok(!considered.some((m) => m.id.includes(':free')), 'free variants are never chosen');
  assert.ok(!considered.some((m) => m.id === 'openrouter/auto'), 'the router (price -1) is never chosen');
  // With the cheap ones gone, the dearer matches win, and a thinking model
  // only when nothing else is left.
  const fewer = OFFLINE_MODELS.filter((m) => !['anthropic/claude-3-haiku', 'google/gemini-2.0-flash-001', 'openai/gpt-4o-mini', 'openai/gpt-4.1-mini'].includes(m.id));
  const again = selectModels(fewer, { workload }).chosen.map((m) => m.id);
  assert.equal(again[0], 'anthropic/claude-3.5-haiku');
  assert.ok(['openai/gpt-5-mini', 'google/gemini-2.5-flash'].includes(again[1]));
  assert.equal(selectModels(fewer, { workload }).chosen[1].thinks, true);
  // --models: one model per entry, exact ids and globs.
  const flagged = selectModels(OFFLINE_MODELS, { prefs: prefsFromFlag('openai/gpt-4.1-mini,anthropic/*sonnet*'), workload }).chosen.map((m) => m.id);
  assert.deepEqual(flagged, ['openai/gpt-4.1-mini', 'anthropic/claude-sonnet-4.5']);
  assert.deepEqual(selectModels([], { workload }).chosen, []);
  assert.ok(globToRegExp('openai/gpt-*-mini').test('openai/gpt-4o-mini'));
  assert.ok(!globToRegExp('openai/gpt-*-mini').test('openai/gpt-4o-mini-2024-07-18'));
  assert.ok(!globToRegExp('google/gemini-*-flash').test('google/gemini-2.0-flash/extra'));
});

/* ── The LLM client, against fake fetches ────────────────────────────────── */

const MODEL_ROW = { id: 'openai/gpt-4o-mini', pricing: { prompt: '0.00000015', completion: '0.0000006' }, supported_parameters: ['structured_outputs'] };

test('LLM client: retries a 429, reads the reply, charges listed prices when cost is absent', async () => {
  let n = 0;
  const fetchImpl = async () => (++n === 1 ? reply(429, { error: { message: 'slow down' } }, { 'retry-after': '0' }) : chat('{"a":0.9,"b":"x","c":1}', { prompt_tokens: 1000, completion_tokens: 20 }));
  const dir = out();
  const c = new Llm({ model: MODEL_ROW, budget: new Budget(1), mock: true, fetchImpl, outDir: dir, say: quiet });
  const r = await c.ask({ s: 1 }, Q, { id: 't', maxTokens: 50 });
  assert.equal(r.ok, true);
  assert.equal(r.answers.b.value, 'x');
  assert.equal(r.attempts, 2);
  assert.equal(c.retries, 1);
  assert.equal(r.usage.costSource, 'listed-price');
  assert.ok(Math.abs(r.usage.costUsd - (1000 * 0.15e-6 + 20 * 0.6e-6)) < 1e-12);
  assert.ok(typeof r.ms === 'number');
  assert.ok(readFileSync(join(dir, 'raw-first-llm-openai_gpt-4o-mini.json'), 'utf8').includes('{\\"a\\":0.9'));
});

test('LLM client: the spend guard stops before a call that could pass the cap', async () => {
  let calls = 0;
  const fetchImpl = async () => (calls++, chat('{"a":0.5,"b":"x","c":0}', { prompt_tokens: 10, completion_tokens: 5, cost: 0.0001 }));
  const c = new Llm({ model: { ...MODEL_ROW, pricing: { prompt: '0.001', completion: '0.001' } }, budget: new Budget(0.05), mock: true, fetchImpl, outDir: out(), say: quiet });
  const r = await c.ask({ big: 'x'.repeat(400) }, Q, { maxTokens: 100 });
  assert.equal(r.skipped, true, 'worst case (input estimate + 100 output tokens at $0.001) is over $0.05');
  assert.equal(calls, 0, 'nothing was sent');
  assert.match(c.stopped, /spend guard/);
});

test('LLM client: 404 stops the model, a prose reply is an error, the key never reaches the log', async () => {
  const key = 'sk-or-v1-' + 'b'.repeat(64);
  const dir = out();
  const c404 = new Llm({ model: MODEL_ROW, budget: new Budget(1), apiKey: key, fetchImpl: async () => reply(404, { error: { message: `no endpoints for ${key}` } }), outDir: dir, say: quiet });
  const r = await c404.ask({}, Q, { maxTokens: 10 });
  assert.equal(r.ok, false);
  assert.match(c404.stopped, /not found/);
  assert.equal((await c404.ask({}, Q, { maxTokens: 10 })).skipped, true);
  const log = readFileSync(join(dir, 'run.log.jsonl'), 'utf8');
  assert.ok(!log.includes('b'.repeat(20)), 'the key is scrubbed from the log');
  const prose = new Llm({ model: MODEL_ROW, budget: new Budget(1), mock: true, fetchImpl: async () => chat('I think it is probably fine.'), outDir: out(), say: quiet });
  const p = await prose.ask({}, Q, { maxTokens: 10 });
  assert.equal(p.ok, false);
  assert.match(p.problem, /no JSON object/);
});

test('the fake OpenRouter lists models and answers in schema', async () => {
  const f = mockOpenRouterFetch({ failAt: {} });
  const list = await (await f('https://openrouter.ai/api/v1/models')).json();
  assert.ok(list.data.some((m) => m.id === 'openai/gpt-4o-mini'));
  const body = chatBody(MODEL_ROW, { x: 1 }, Q, { maxTokens: 50 });
  const j = await (await f('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', body: JSON.stringify(body) })).json();
  const parsed = parseLlmAnswers(contentOf(j), Q);
  assert.ok(Object.values(parsed.answers).every((a) => a.ok) || parsed.problem);
  assert.equal(typeof j.usage.cost, 'number');
});

/* ── Gold data stays true to the app ─────────────────────────────────────── */

test('diet gold: every case exists, and meetsDiet still says what it said when the case was written', () => {
  assert.equal(DIET_GOLD.length, 25);
  for (const g of DIET_GOLD) {
    const r = RECIPES.find((x) => x.id === g.recipe);
    assert.ok(r, g.recipe);
    assert.ok(DIETS.some((d) => d.id === g.diet), g.diet);
    assert.equal(meetsDiet(r, g.diet), g.app, `${g.recipe}/${g.diet}: meetsDiet changed — re-check this gold case`);
  }
  assert.ok(DIET_GOLD.some((g) => g.gold !== g.app), 'at least one case where the app is wrong is kept on purpose');
});

test('bench tasks: the diet sample holds every gold recipe; picks gold is exact', () => {
  const d = dietCalls();
  assert.equal(d.length, 40);
  for (const g of DIET_GOLD) assert.ok(d.some((c) => c.id === g.recipe));
  assert.equal(new Set(d.map((c) => c.id)).size, 40);
  const p = pickCalls();
  assert.equal(p.length, 20);
  for (const c of p) {
    const s = c.meta.scenario;
    const ids = Object.keys(c.state.candidates);
    assert.equal(ids.length, 5);
    const compliant = ids.filter((id) => pickFacts(RECIPES.find((r) => r.id === id), s).compliant);
    assert.ok(compliant.length <= 1, `${c.id}: more than one compliant candidate`);
    assert.equal(c.meta.gold.best, compliant[0] ?? 'none');
    assert.equal(c.meta.gold.pick_ok, compliant[0] === ids[0]);
    assert.deepEqual(Object.keys(c.questions.best_a.criteria).slice(0, 5), ids);
    assert.deepEqual(Object.keys(c.questions.best_b.criteria).slice(0, 5), [...ids].reverse());
  }
  assert.ok(p.some((c) => c.meta.gold.pick_ok) && p.some((c) => !c.meta.gold.pick_ok), 'pick_ok gold is not all one side');
  assert.ok(p.some((c) => c.meta.gold.best === 'none') && p.some((c) => c.meta.gold.best !== 'none'));
});

test('translation gold: keys exist, the ten are in the sample, the five are really broken', () => {
  const { calls, broken } = translationCalls();
  assert.equal(calls.length, 60);
  assert.equal(TRANSLATION_GOLD_OK.length + TRANSLATION_GOLD_BROKEN.length, 15);
  for (const g of TRANSLATION_GOLD_OK) assert.ok(calls.some((c) => c.id === g.id), g.id);
  assert.equal(broken.length, 5);
  for (const b of broken) {
    const g = b.meta.gold;
    assert.equal(b.state[g.lang], g.text);
    assert.deepEqual(Object.keys(b.questions), [`${g.lang}_faithful`]);
  }
  assert.deepEqual(new Set(TRANSLATION_GOLD_BROKEN.map((g) => g.kind)), new Set(['wrong number', 'negation flipped', 'dropped clause', 'wrong language', 'English left in']));
});

/* ── Use-case data ───────────────────────────────────────────────────────── */

test('use-case sets have the sizes promised and valid labels', () => {
  assert.equal(CRAVINGS.length, 30);
  assert.equal(PRICE_REPORTS.length, 30);
  assert.equal(SWAPS.length, 25);
  assert.equal(CUPBOARD.length, 30);
  const langs = new Set(CRAVINGS.map((c) => c.lang));
  for (const l of ['es', 'fr', 'pl', 'ur', 'ar']) assert.ok(langs.has(l), `a craving in ${l}`);
  const slugs = new Set([...CUISINES.map(slug), 'none_or_unclear']);
  for (const c of CRAVINGS) for (const g of [].concat(c.cuisine ?? [])) assert.ok(slugs.has(g), `${c.text}: ${g}`);
  assert.deepEqual(parseDietGold('v:F nf:T'), { vegan: false, nut_free: true });
  assert.throws(() => parseDietGold('zz:T'));
  const { jobs } = buildJobs();
  assert.deepEqual(Object.keys(jobs), ['cravings', 'prices', 'swaps', 'cupboard', 'moods', 'feedback']);
  assert.equal(jobs.moods.length, 15);
  assert.equal(jobs.feedback.length, 20);
});

test('price reports are built from the app\'s own model, with the error baked in', () => {
  const ok = buildReport(PRICE_REPORTS.find((x) => x.kind === 'ok' && x.country === 'GB'));
  assert.equal(ok.gold.plausible, true);
  assert.equal(ok.gold.error_type, 'none');
  const unit = buildReport(PRICE_REPORTS.find((x) => x.kind === 'unit_mismatch'));
  assert.ok(unit.state.pack_grams < 10, 'kilos typed as grams');
  const zero = PRICE_REPORTS.find((x) => x.kind === 'extra_zero');
  const base = buildReport({ ...zero, kind: 'ok', factor: 1 }).state.price_paid;
  const z = buildReport(zero).state.price_paid;
  assert.ok(Math.abs(z / base - 10) < 0.2, `x10: ${z} vs ${base}`);
  const cur = buildReport(PRICE_REPORTS.find((x) => x.kind === 'wrong_currency' && x.country === 'NG'));
  assert.ok(cur.state.price_paid < 10, 'a pound-sized number in a naira field');
  assert.equal(cur.state.currency, 'NGN');
});

test('swap cases name real ingredients, and moods and cravings behave', () => {
  for (const s of SWAPS) assert.ok(RECIPES.find((r) => r.id === s.recipe).items.some((i) => i.n === s.out), `${s.recipe}: ${s.out}`);
  const five = defaultTop5();
  assert.equal(five.length, 5);
  assert.equal(moodGold({ maxTotal: 1 }, five).gold, 'none');
  assert.equal(moodGold({}, five).gold, null, 'all five pass: ambiguous');
  const quickest = [...five].sort((a, b) => a.total - b.total);
  if (quickest[0].total < quickest[1].total) assert.equal(moodGold({ maxTotal: quickest[0].total }, five).gold, quickest[0].id);
  // --picks-facts: both saved shapes, the first scenario with no diets wins.
  const dir = out();
  const top = (ids) => ids.map((id, i) => ({ rank: i + 1, id }));
  writeFileSync(join(dir, 'picks-facts.json'), JSON.stringify([{ id: 's02', scenario: { diets: ['vegan'] }, top: top(['veg_curry', 'sambar', 'parippu', 'japchae', 'tteokbokki']) }, { id: 's01', scenario: { diets: [] }, top: top(['omelette', 'stir_fry', 'pad_thai', 'larb_gai', 'tom_yum']) }]));
  assert.deepEqual(top5FromPicksFile(join(dir, 'picks-facts.json')).recipes.map((r) => r.id), ['omelette', 'stir_fry', 'pad_thai', 'larb_gai', 'tom_yum']);
  writeFileSync(join(dir, 'picks.json'), JSON.stringify({ rows: [{ id: 's09', scenario: { diets: [] }, top: top(['sambar', 'omelette', 'stir_fry', 'pad_thai', 'larb_gai']) }] }));
  assert.equal(top5FromPicksFile(join(dir, 'picks.json')).scenario, 's09');
  assert.ok(todayMatches('pad thai').some((r) => r.id === 'pad_thai'));
  assert.equal(todayMatches('something cosy').length, 0, 'today the box finds nothing for a mood');
  const c = { questions: { a: noul('?'), b: choice('?', { x: 1, y: 2 }) }, gold: { a: true, b: null } };
  const s = scoreCall(c, { answers: { a: { ok: true, value: 0.02 }, b: { ok: true, value: 'x', confidence: 0.99 } } });
  assert.equal(s[0].confidentWrong, true);
  assert.equal(s[1].status, 'n/a');
});
