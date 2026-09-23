/**
 * Tests for the Jev client, runnable offline:  node --test scripts/jev/lib.test.mjs
 *
 * Deliberately node:test and deliberately outside src/: the app's vitest run
 * only collects src/**\/*.test.ts, so this adds nothing to it and cannot break
 * it. Every test uses a fake fetch; none touches the network.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { Jev, estimateTokens, findAnswers, mask, mockFetch, normaliseAnswer, noul, choice, score, scrub } from './lib.mjs';

const out = () => mkdtempSync(join(tmpdir(), 'jev-'));
const quiet = () => {};
const Q = { a: noul('is it?'), b: choice('which?', { x: 'x', y: 'y', none: 'neither' }), c: score('how much?', ['low', 'mid', 'high']) };
const reply = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

test('reads answers from any of the envelopes it knows', () => {
  const names = ['a', 'b'];
  assert.deepEqual(Object.keys(findAnswers({ answers: { a: 1, b: 2 } }, names)), names);
  assert.deepEqual(Object.keys(findAnswers({ results: { a: 1 } }, names)), ['a']);
  assert.deepEqual(Object.keys(findAnswers({ data: { answers: { b: 1 } } }, names)), ['b']);
  assert.deepEqual(Object.keys(findAnswers({ a: { noul: 0.3 } }, names)), ['a']);
  assert.deepEqual(Object.keys(findAnswers({ results: [{ name: 'a', answer: { noul: 1 } }] }, names)), ['a']);
  assert.deepEqual(findAnswers({ nothing: true }, names), {});
});

test('normalises and validates each answer type', () => {
  assert.equal(normaliseAnswer(Q.a, { type: 'noul', noul: 0.98 }).value, 0.98);
  assert.equal(normaliseAnswer(Q.a, 0.4).value, 0.4);
  assert.equal(normaliseAnswer(Q.a, { noul: 1.7 }).ok, false);
  assert.equal(normaliseAnswer(Q.b, { choice: 'y', confidence: 0.8 }).value, 'y');
  assert.equal(normaliseAnswer(Q.b, { choice: 'z' }).ok, false, 'a label never offered is an error, not an opinion');
  assert.equal(normaliseAnswer(Q.c, { score: 1.05 }).value, 1.05);
  assert.equal(normaliseAnswer(Q.c, { score: 7 }).ok, false);
  assert.equal(normaliseAnswer(Q.a, undefined).ok, false);
});

test('never prints a key', () => {
  const k = 'sk-or-v1-' + 'a'.repeat(64);
  assert.ok(!mask(k).includes('a'.repeat(8)));
  assert.ok(!scrub(`Bearer ${k} failed`).includes('a'.repeat(8)));
});

test('the mock is deterministic and schema-valid', async () => {
  const body = JSON.stringify({ model: 'm', state: { s: 1 }, questions: Q });
  const f1 = mockFetch({ failAt: {} });
  const f2 = mockFetch({ failAt: {} });
  const a = await (await f1('u', { body })).json();
  const b = await (await f2('u', { body })).json();
  assert.deepEqual(a.answers, b.answers);
  for (const [n, q] of Object.entries(Q)) assert.equal(normaliseAnswer(q, a.answers[n]).ok, true, n);
  const p = Object.values(a.answers.b.probabilities).reduce((x, y) => x + y, 0);
  assert.ok(Math.abs(p - 1) < 1e-3);
});

test('retries 429 and 5xx, then succeeds', async () => {
  let n = 0;
  const fetchImpl = async () => (++n <= 2 ? reply(n === 1 ? 429 : 503, { error: { message: 'busy' } }, { 'retry-after': '0' }) : reply(200, { answers: { a: { noul: 0.9 } }, usage: { prompt_tokens: 100, cost: 0.0000042 } }));
  const j = new Jev({ apiKey: 'k', fetchImpl, outDir: out(), baseDelayMs: 1, say: quiet });
  const r = await j.decide({}, { a: Q.a });
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 3);
  assert.equal(j.retries, 2);
  assert.equal(r.answers.a.value, 0.9);
});

test('stops the whole run on 401 and 402', async () => {
  for (const status of [401, 402]) {
    const j = new Jev({ apiKey: 'sk-or-v1-secretsecretsecret', fetchImpl: async () => reply(status, { error: { message: 'no' } }), outDir: out(), baseDelayMs: 1, concurrency: 1, say: quiet });
    const rs = await j.runAll([1, 2, 3].map((i) => ({ id: String(i), state: {}, questions: { a: Q.a } })));
    assert.ok(j.stopped, `stopped on ${status}`);
    assert.ok(!j.stopped.includes('secretsecret'));
    assert.ok(rs.filter((r) => r.skipped).length >= 1, 'later calls are skipped, not sent');
  }
});

test('the spend guard stops before the cap, not after', async () => {
  let sent = 0;
  const fetchImpl = async () => {
    sent++;
    return reply(200, { answers: { a: { noul: 0.5 } }, usage: { cost: 0.004 } });
  };
  const j = new Jev({ apiKey: 'k', fetchImpl, outDir: out(), maxUsd: 0.01, concurrency: 1, say: quiet });
  const calls = Array.from({ length: 10 }, (_, i) => ({ id: String(i), state: {}, questions: { a: Q.a } }));
  const rs = await j.runAll(calls);
  assert.ok(j.stopped);
  assert.ok(j.spentUsd <= 0.01, `spent ${j.spentUsd}`);
  assert.ok(sent < 10);
  assert.ok(rs.some((r) => r.skipped));
});

test('writes the first raw response, without the key', async () => {
  const dir = out();
  const j = new Jev({ apiKey: 'sk-or-v1-zzzzzzzzzzzzzzzzzzzz', fetchImpl: async () => reply(200, { answers: { a: { noul: 0.1 } } }), outDir: dir, say: quiet });
  await j.decide({ x: 1 }, { a: Q.a });
  const f = join(dir, 'raw-first-response.json');
  assert.ok(existsSync(f));
  assert.ok(!readFileSync(f, 'utf8').includes('zzzzzzzz'));
  assert.ok(!readFileSync(join(dir, 'run.log.jsonl'), 'utf8').includes('zzzzzzzz'));
});

test('estimates grow with the payload', () => {
  const small = estimateTokens({ model: 'm', state: 'x', questions: { a: Q.a } });
  const big = estimateTokens({ model: 'm', state: 'x'.repeat(4000), questions: { a: Q.a } });
  assert.ok(big > small + 1000);
});

test('stops when paid responses cannot be read', async () => {
  const j = new Jev({ apiKey: 'k', fetchImpl: async () => reply(200, { something: 'else' }), outDir: out(), concurrency: 1, say: quiet });
  const rs = await j.runAll(Array.from({ length: 6 }, (_, i) => ({ id: String(i), state: {}, questions: { a: Q.a } })));
  assert.match(j.stopped, /no readable answers/);
  assert.equal(rs.filter((r) => r.skipped).length, 3);
});
