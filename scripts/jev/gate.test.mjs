/**
 * Tests for the CI gate, offline:  node --test scripts/jev/gate.test.mjs
 *
 * node:test and outside src/, like lib.test.mjs, so the app's vitest run
 * never sees it. No test touches the network: Jev is always a fake fetch.
 *
 *   - diff detection, on synthetic snapshots AND on a real git fixture
 *     (a temp repository holding a copy of this app's src/)
 *   - decisions: block / warn / agree thresholds, report vs block mode,
 *     baseline exceptions (reviewed, TODO, content changed since)
 *   - the free deterministic checks
 *   - never blocking on Jev being unavailable: no key, no network, 5xx, 401/402
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_CONFIG,
  applyBaseline,
  deterministic,
  dietRuleChanges,
  judge,
  loadDefs,
  materialize,
  porkRules,
  renderSummary,
  resolveBase,
  runGate,
  select,
  takeSnapshot,
  updateBaseline,
} from './gate.mjs';
import { OTHER, build } from './snapshot.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const tmp = (p = 'jev-gate-test-') => mkdtempSync(join(tmpdir(), p));
const quiet = () => {};
const defs = await loadDefs();
const rules = porkRules(ROOT);

/* ── Synthetic snapshots, built by the real snapshot builder ─────────────── */

const recipe = (id, items, tags = [], extra = {}) => ({
  id,
  name: id.replace(/_/g, ' '),
  cuisine: 'Test',
  items: items.map((n) => ({ g: '1', n, s: 1, src: 'model', opt: false })),
  method: [{ text: `Cook the ${id}.` }],
  tags,
  price: 1,
  ...extra,
});

const TAGGED = ['vegan', 'vegetarian', 'halal'];
const fakeDiets = {
  meetsDiet: (r, d) => (TAGGED.includes(d) ? r.tags.includes(d) : d === 'no_pork' ? !r.items.some((i) => /bacon|pork/i.test(i.n)) : true),
  tagContradictions: (r) => (r.tags.includes('vegan') && r.items.some((i) => /bacon/i.test(i.n)) ? { vegan: ['Bacon'] } : {}),
};

function snap(recipes, strings) {
  return build({
    cookbook: { DIETS: ['vegan', 'vegetarian', 'halal', 'no_pork'].map((id) => ({ id })), RECIPES: recipes },
    diets: fakeDiets,
    i18n: { strings: () => strings.en, pack: () => ({}) },
    extra: { EXTRA: { en: {} } },
    langs: Object.fromEntries(OTHER.map((l) => [l, { strings: strings[l], pack: {}, extra: {} }])),
  });
}

const STR = {
  en: { hello: 'Hello {name}', bye: 'Goodbye', ok: 'OK' },
  es: { hello: 'Hola {name}', bye: 'Adiós', ok: 'OK' },
  fr: { hello: 'Bonjour {name}', bye: 'Au revoir', ok: 'OK' },
  pl: { hello: 'Cześć {name}', bye: 'Do widzenia', ok: 'OK' },
  ur: { hello: 'ہیلو {name}', bye: 'خدا حافظ', ok: 'OK' },
  ar: { hello: 'مرحبا {name}', bye: 'مع السلامة', ok: 'OK' },
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const R = () => [
  recipe('lentil_soup', ['Red lentils', 'Onion', 'Stock cube'], ['vegan', 'vegetarian', 'halal']),
  recipe('beef_stew', ['Beef steak', 'Onion'], ['halal']),
  recipe('rice', ['Rice'], ['vegan', 'vegetarian', 'halal']),
];

test('snapshot: nothing changed selects nothing', () => {
  const s = select(snap(R(), STR), snap(R(), STR));
  assert.equal(s.recipes.length, 0);
  assert.equal(s.translations.length, 0);
  assert.deepEqual(s.removedRecipes, []);
});

test('snapshot: one changed recipe is the only one selected, with only the diets the app claims', () => {
  const head = R();
  head[0].items[2].n = 'Chicken stock cube';
  const s = select(snap(R(), STR), snap(head, STR));
  assert.deepEqual(s.recipes.map((x) => x.id), ['lentil_soup']);
  assert.equal(s.recipes[0].reason, 'name, ingredients, method or tags changed');
  assert.deepEqual(s.recipes[0].diets, ['vegan', 'vegetarian', 'halal', 'no_pork'], 'only diets the app says it meets');
  assert.equal(s.translations.length, 0);
});

test('snapshot: a price-only edit is noticed but not sent to Jev', () => {
  const head = R();
  head[1].price = 99;
  head[1].items[0].s = 7;
  const s = select(snap(R(), STR), snap(head, STR));
  assert.equal(s.recipes.length, 0);
  assert.deepEqual(s.changedNotDiet, ['beef_stew']);
});

test('snapshot: new and removed recipes', () => {
  const head = R().slice(1).concat(recipe('dal', ['Lentils'], ['vegan']));
  const s = select(snap(R(), STR), snap(head, STR));
  assert.deepEqual(s.recipes.map((x) => [x.id, x.reason]), [['dal', 'new recipe']]);
  assert.deepEqual(s.removedRecipes, ['lentil_soup']);
});

test('snapshot: a diet-rule change re-checks every recipe', () => {
  const s = select(snap(R(), STR), snap(R(), STR), { dietRulesChanged: ['src/lib/diets.ts'] });
  assert.equal(s.recipes.length, 3);
  assert.match(s.recipes[0].reason, /diet rules changed \(src\/lib\/diets\.ts\)/);
});

test('snapshot: a changed translation selects that language only; changed English selects all five', () => {
  const h1 = clone(STR);
  h1.es.bye = 'Hasta luego';
  const s1 = select(snap(R(), STR), snap(R(), h1));
  assert.deepEqual(s1.translations.map((x) => [x.id, x.langs, x.reason]), [['strings.bye', ['es'], 'translation changed']]);
  assert.equal(s1.recipes.length, 0);

  const h2 = clone(STR);
  h2.en.bye = 'See you soon';
  const s2 = select(snap(R(), STR), snap(R(), h2));
  assert.deepEqual(s2.translations.map((x) => [x.id, x.langs, x.reason]), [['strings.bye', OTHER, 'English changed']]);
});

test('snapshot: no base or --full selects everything', () => {
  assert.equal(select(null, snap(R(), STR)).recipes.length, 3);
  assert.equal(select(snap(R(), STR), snap(R(), STR), { full: true }).translations.length, 3);
});

/* ── The same, through git, on a copy of this app ────────────────────────── */

test('git fixture: recipe, diet rules, translation and a no-op commit are each detected correctly', () => {
  const repo = tmp('jev-gate-repo-');
  const g = (...args) => {
    const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
  };
  cpSync(join(ROOT, 'src'), join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, 'package.json'), '{ "type": "module" }\n');
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', 'gate@test');
  g('config', 'user.name', 'gate test');
  g('add', '-A');
  g('commit', '-qm', 'base');

  const edit = (file, from, to) => {
    const p = join(repo, file);
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes(from), `${file} contains ${from}`);
    writeFileSync(p, s.replace(from, to));
  };
  const commit = (msg) => {
    g('commit', '-qam', msg);
    return g('rev-parse', 'HEAD');
  };
  const detect = (baseRef, headRef) => {
    const d = tmp();
    const b = materialize(repo, baseRef, join(d, 'b'));
    const h = materialize(repo, headRef, join(d, 'h'));
    const bs = takeSnapshot(b);
    const hs = takeSnapshot(h);
    assert.ok(bs.ok && hs.ok, bs.error || hs.error);
    return select(bs, hs, { dietRulesChanged: dietRuleChanges(b, h, bs, hs) });
  };

  const c0 = g('rev-parse', 'HEAD');
  edit('src/data/cookbook.js', "I('400 g', 'Chickpeas, tinned', 0.55, 'model')", "I('400 g', 'Chickpeas, dried', 0.55, 'model')");
  const c1 = commit('change one recipe');
  edit('src/lib/diets.ts', "const TAGGED = ['vegan'", "const TAGGED = [/* audited */ 'vegan'");
  const c2 = commit('touch the diet rules');
  edit('src/data/lang/es.ts', "accountTitle: 'Consérvalo en todos tus dispositivos'", "accountTitle: 'Guárdalo en tus dispositivos'");
  const c3 = commit('change one translation');
  // A comment in the cookbook moves the text of every later recipe but
  // changes no value: a text diff would call that a change, this does not.
  edit('src/data/cookbook.js', 'export const RECIPES = [', '// a comment nobody cooks\nexport const RECIPES = [');
  const c4 = commit('no-op for the app');

  const s1 = detect(c0, c1);
  assert.deepEqual(s1.recipes.map((x) => x.id), ['veg_curry']);
  assert.equal(s1.translations.length, 0);
  assert.deepEqual(s1.dietRulesChanged, []);

  const s2 = detect(c1, c2);
  assert.deepEqual(s2.dietRulesChanged, ['src/lib/diets.ts']);
  assert.ok(s2.recipes.length > 100, `every recipe re-checked (${s2.recipes.length})`);
  assert.equal(s2.translations.length, 0);

  const s3 = detect(c2, c3);
  assert.equal(s3.recipes.length, 0);
  assert.deepEqual(s3.translations.map((x) => [x.id, x.langs]), [['extra.accountTitle', ['es']]]);

  const s4 = detect(c3, c4);
  assert.equal(s4.recipes.length + s4.translations.length, 0, 'nothing changed');

  // How CI picks the base: GATE_BASE, then the push's "before", then HEAD~1.
  assert.equal(resolveBase(repo, { GATE_BASE: c1 }).ref, c1);
  assert.equal(resolveBase(repo, { GATE_BEFORE: c2 }).ref, c2);
  assert.equal(resolveBase(repo, { GATE_BEFORE: '0'.repeat(40) }).ref, 'HEAD~1', 'a new branch push has an all-zero before');
  assert.equal(resolveBase(repo, { GATE_BASE: 'not-a-ref; rm -rf /' }).ref, 'HEAD~1', 'a bad ref is ignored, never run');
});

/* ── Decisions ───────────────────────────────────────────────────────────── */

/** A fake Jev answering each question with the probability `p(state, name)`. */
const answering = (p, seen = []) => async (url, init) => {
  const body = JSON.parse(init.body);
  seen.push(body);
  const answers = {};
  for (const n of Object.keys(body.questions)) answers[n] = { type: 'noul', noul: p(body.state, n) };
  return new Response(JSON.stringify({ answers, usage: { prompt_tokens: 200, cost: 200 * 0.042e-6 } }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const changedPair = () => {
  const head = R();
  head[0].items[2].n = 'Chicken stock cube'; // the app still tags it vegan
  const tr = clone(STR);
  tr.fr.bye = 'Bonjour'; // says the opposite
  return { base: snap(R(), STR), head: snap(head, tr) };
};

const gate = ({ config, ...extra } = {}) =>
  runGate({
    ...changedPair(),
    baseline: { exceptions: [] },
    maxUsd: 0.03,
    env: { OPENROUTER_API_KEY: 'sk-or-v1-test-not-a-real-key-000000' },
    outDir: tmp(),
    defs,
    rules,
    say: quiet,
    jevOptions: { baseDelayMs: 1 },
    ...extra,
    config: { ...DEFAULT_CONFIG, ...(config || {}) },
  });

const lowFor = ({ vegan = 0.99, bye = 0.99 } = {}) =>
  answering((state, name) => (name === 'vegan' ? vegan : name === 'fr_faithful' && state.key === 'strings.bye' ? bye : 0.97));

test('judge: thresholds split block, warn and agreement', () => {
  const head = changedPair().head;
  const calls = [
    { kind: 'diet', questions: { vegan: {}, halal: {}, no_pork: {} }, meta: { recipe: 'lentil_soup' } },
    { kind: 'translation', questions: { es_faithful: {}, fr_faithful: {}, pl_faithful: {} }, meta: { key: 'strings.bye' } },
  ];
  const ok = (value) => ({ ok: true, value });
  const results = [
    { ok: true, answers: { vegan: ok(0.05), halal: ok(0.5), no_pork: ok(0.95) } },
    { ok: true, answers: { es_faithful: ok(0.19), fr_faithful: ok(0.21), pl_faithful: { ok: false, problem: 'noul not in 0..1' } } },
  ];
  const j = judge(calls, results, DEFAULT_CONFIG, head);
  const by = Object.fromEntries(j.findings.map((f) => [f.id, f.severity]));
  assert.deepEqual(by, {
    'diet:lentil_soup:vegan': 'block', // app says vegan, Jev 0.05 < 0.10
    'diet:lentil_soup:halal': 'warn', // unsure band
    'translation:strings.bye:es': 'block', // 0.19 < 0.20
    'translation:strings.bye:fr': 'warn', // 0.21: unsure, not a block
  });
  assert.equal(j.agreed, 1);
  assert.equal(j.unanswered.length, 1, 'an unreadable answer is not an opinion');
});

test('report mode never blocks; block mode exits 1 on the same findings', async () => {
  const fetchImpl = lowFor({ vegan: 0.03, bye: 0.05 });
  const rep = await gate({ fetchImpl });
  assert.equal(rep.counts.block, 2);
  assert.equal(rep.exitCode, 0);
  assert.equal(rep.status, 'WOULD BLOCK (report mode)');

  const blk = await gate({ fetchImpl: lowFor({ vegan: 0.03, bye: 0.05 }), config: { mode: 'block' } });
  assert.equal(blk.exitCode, 1);
  assert.equal(blk.status, 'BLOCKED');
  const md = renderSummary(blk);
  assert.match(md, /### Blocks \(2\)/);
  assert.match(md, /lentil_soup \/ vegan \| {2}\| 0\.030/);
  assert.match(md, /strings\.bye \| fr \| 0\.050/);
});

test('Jev only ever adds a caution: it is never asked about diets the app already refuses', async () => {
  const seen = [];
  await gate({ fetchImpl: answering(() => 0.99, seen), mock: false });
  const diet = seen.find((b) => b.state.ingredients);
  // beef_stew is unchanged; lentil_soup is asked about the four diets it claims, nothing else.
  assert.deepEqual(Object.keys(diet.questions).sort(), ['halal', 'no_pork', 'vegan', 'vegetarian']);
  const tr = seen.find((b) => b.state.key);
  assert.deepEqual(Object.keys(tr.questions), ['fr_faithful'], 'only the changed language');
});

test('warnings alone pass, in block mode too', async () => {
  const r = await gate({ fetchImpl: lowFor({ vegan: 0.4, bye: 0.6 }), config: { mode: 'block' } });
  assert.equal(r.counts.block, 0);
  assert.equal(r.counts.warn, 2);
  assert.equal(r.exitCode, 0);
  assert.equal(r.status, 'PASS WITH WARNINGS');
});

test('baseline: a reviewed exception lets a block through; a TODO one does not; editing the content brings it back', async () => {
  const first = await gate({ fetchImpl: lowFor({ vegan: 0.03 }), config: { mode: 'block' } });
  assert.equal(first.exitCode, 1);
  const { baseline: todo, added } = updateBaseline({ exceptions: [] }, first.findings, '2026-09-23');
  assert.equal(added, 1);
  assert.match(todo.exceptions[0].reason, /^TODO/);

  const stillTodo = await gate({ fetchImpl: lowFor({ vegan: 0.03 }), config: { mode: 'block' }, baseline: todo });
  assert.equal(stillTodo.exitCode, 1, 'an unreviewed entry does not count');
  assert.ok(stillTodo.notices.some((n) => /still say TODO/.test(n.text)));

  const reviewedBl = { exceptions: [{ ...todo.exceptions[0], reason: 'Stock cube here is the vegetable kind; checked the brand.' }] };
  const ok = await gate({ fetchImpl: lowFor({ vegan: 0.03 }), config: { mode: 'block' }, baseline: reviewedBl });
  assert.equal(ok.exitCode, 0);
  assert.equal(ok.counts.excepted, 1);
  assert.match(renderSummary(ok), /Accepted in gate-baseline\.json \(1\)/);

  // Same recipe, different ingredients: the old acceptance no longer applies.
  const p = changedPair();
  p.head = snap(R().map((r, i) => (i === 0 ? { ...r, items: [...r.items, { g: '1', n: 'Honey', opt: false }] } : r)), STR);
  const again = await runGate({ ...p, config: { ...DEFAULT_CONFIG, mode: 'block' }, baseline: reviewedBl, maxUsd: 0.03, env: { OPENROUTER_API_KEY: 'k' }, outDir: tmp(), defs, rules, say: quiet, fetchImpl: lowFor({ vegan: 0.03 }) });
  assert.equal(again.exitCode, 1);
  assert.equal(again.stale_baseline.length, 1);
});

test('applyBaseline matches on id and fingerprint', () => {
  const f = [{ id: 'a', fp: '1', severity: 'block' }, { id: 'b', fp: '2', severity: 'block' }];
  const r = applyBaseline(f, { exceptions: [{ id: 'a', fp: '1', reason: 'fine' }, { id: 'b', fp: 'old', reason: 'fine' }, { id: 'c', reason: 'gone' }] });
  assert.deepEqual(r.findings.map((x) => x.severity), ['excepted', 'block']);
  assert.deepEqual(r.stale.map((e) => e.id), ['b', 'c']);
});

/* ── Deterministic checks ────────────────────────────────────────────────── */

test('the pork/alcohol words come from nopork.test.ts, so there is one list', () => {
  assert.equal(rules.source, 'src/data/nopork.test.ts');
  assert.ok(rules.pork.test('Smoked bacon') && !rules.pork.test('Hamburger buns'));
  assert.ok(rules.alcohol.test('a splash of white wine') && !rules.alcohol.test('rice vinegar'));
});

test('deterministic: pork in an ingredient or method, a broken placeholder, and a contradicted tag all block — in every run', () => {
  const rs = R();
  rs[0].items.push({ g: '1', n: 'Bacon', s: 1, src: 'model' }); // also contradicts its vegan tag
  rs[2].method.push({ text: 'Deglaze with a splash of white wine.' });
  rs[1].method.push({ text: 'Add a little white wine vinegar.' }); // vinegar is fine
  const tr = clone(STR);
  tr.pl.hello = 'Cześć {imie}';
  const head = snap(rs, tr);
  const f = deterministic(head, { rules, placeholderMismatches: defs.placeholderMismatches });
  const ids = f.map((x) => x.id).sort();
  assert.deepEqual(ids, ['diet-tag:lentil_soup:vegan', 'placeholder:strings.hello:pl', 'pork-alcohol:lentil_soup:item:Bacon', 'pork-alcohol:rice:step:2']);
  assert.ok(f.every((x) => x.severity === 'block'));
});

test('the real app at HEAD passes the free checks', () => {
  const head = takeSnapshot(ROOT);
  assert.ok(head.ok, head.error);
  assert.deepEqual(deterministic(head, { rules, placeholderMismatches: defs.placeholderMismatches }), []);
});

/* ── Jev unavailable must never block ────────────────────────────────────── */

test('no key: Jev part skipped with a notice, free checks still run, nothing blocks', async () => {
  let called = 0;
  const p = changedPair();
  const rs = R();
  rs[2].items.push({ g: '1', n: 'Mirin', s: 1, src: 'model' });
  const r = await runGate({ ...p, head: snap(rs, STR), config: { ...DEFAULT_CONFIG, mode: 'block' }, baseline: { exceptions: [] }, maxUsd: 0.03, env: {}, outDir: tmp(), defs, rules, say: quiet, fetchImpl: async () => (called++, new Response('{}')) });
  assert.equal(called, 0);
  assert.equal(r.jev, 'skipped — no key');
  assert.ok(r.notices.some((n) => n.level === 'notice' && /OPENROUTER_API_KEY is not set/.test(n.text)));
  // The free check still found the mirin — and in block mode that one does block.
  assert.deepEqual(r.findings.map((f) => f.id), ['pork-alcohol:rice:item:Mirin']);
  // Without it, a missing key alone exits 0.
  const clean = await runGate({ ...changedPair(), config: { ...DEFAULT_CONFIG, mode: 'block' }, baseline: { exceptions: [] }, maxUsd: 0.03, env: {}, outDir: tmp(), defs, rules, say: quiet });
  assert.equal(clean.exitCode, 0);
});

test('network down: warns, never blocks, and stops trying quickly', async () => {
  let attempts = 0;
  const r = await gate({
    config: { mode: 'block' },
    fetchImpl: async () => {
      attempts++;
      throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
    },
    jevOptions: { baseDelayMs: 1, maxAttempts: 3 },
  });
  assert.equal(r.exitCode, 0);
  assert.equal(r.counts.block, 0);
  assert.ok(r.notices.some((n) => n.level === 'warn' && /Nothing was blocked/.test(n.text)), JSON.stringify(r.notices));
  assert.ok(attempts <= 10, `gave up after ${attempts} attempts`);
});

test('5xx forever: warns and never blocks', async () => {
  const r = await gate({ config: { mode: 'block' }, fetchImpl: async () => new Response('{"error":{"message":"down"}}', { status: 503, headers: { 'retry-after': '0' } }) });
  assert.equal(r.exitCode, 0);
  assert.ok(r.notices.some((n) => n.level === 'warn'));
});

test('401 and 402 warn loudly, never block, and never print the key', async () => {
  const key = 'sk-or-v1-' + 'q'.repeat(64);
  for (const status of [401, 402]) {
    const outDir = tmp();
    const r = await gate({ config: { mode: 'block' }, env: { OPENROUTER_API_KEY: key }, outDir, fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'nope' } }), { status }) });
    assert.equal(r.exitCode, 0);
    const loud = r.notices.find((n) => n.level === 'loud');
    assert.ok(loud, `loud notice on ${status}`);
    assert.match(loud.text, status === 401 ? /refused the key/ : /out of credits/);
    assert.match(renderSummary(r), /\*\*WARNING:\*\*/);
    const everything = JSON.stringify(r) + renderSummary(r) + readdirSync(outDir).map((f) => readFileSync(join(outDir, f), 'utf8')).join('');
    assert.ok(!everything.includes('q'.repeat(12)), 'key never written');
  }
});

test('the spend cap stops a run cleanly, with a warning rather than a block', async () => {
  const r = await gate({ maxUsd: 0.000001, config: { mode: 'block' }, fetchImpl: lowFor({ vegan: 0.01 }) });
  assert.equal(r.exitCode, 0);
  assert.ok(r.notices.some((n) => /Spend cap/.test(n.text)));
});

test('--dry makes no call and prices the run', async () => {
  const r = await gate({ dry: true, fetchImpl: async () => assert.fail('dry must not call Jev') });
  assert.equal(r.jev, 'dry run — no calls made');
  assert.equal(r.cost.calls, 2);
  assert.ok(r.cost.est_usd > 0 && r.cost.est_usd < 0.001, `est ${r.cost.est_usd}`);
});
