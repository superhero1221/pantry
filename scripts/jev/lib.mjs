/**
 * A small client for TypeSafe's Jev decision model on OpenRouter.
 *
 * Jev is not a chat model. It takes a `state` (anything JSON) and a set of
 * named `questions`, evaluates them in parallel, and answers each one in a
 * fixed shape — a probability for a yes/no (`noul`), a label plus a
 * distribution for a `choice`, a number for a `score`. That is what makes it
 * useful as a second opinion: the answers are numbers a script can sort by.
 *
 * Everything in here is about spending as little of a one-dollar key as
 * possible and never leaking it:
 *
 *   - the key is read from process.env.OPENROUTER_API_KEY and nowhere else,
 *     is never written to disk, and only ever printed masked;
 *   - a spend guard stops the run cleanly before the next call would take the
 *     estimated or reported total past --max-usd;
 *   - 429 and 5xx are retried with backoff, 401/402/404 stop everything
 *     (every further call would fail the same way), a run of 400s stops
 *     everything (the request shape is wrong, not the data);
 *   - the first raw response is written to disk as-is, because the envelope is
 *     known only from public examples and the parser below is defensive;
 *   - --mock swaps fetch for a deterministic fake so the whole pipeline can be
 *     run with no network at all.
 *
 * No dependencies: Node 22's global fetch and nothing else.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ENDPOINT = 'https://openrouter.ai/api/alpha/decisions';
export const MODEL = 'typesafe/jev-1.13';
/** USD per input token. Output is free. */
export const USD_PER_TOKEN = 0.042 / 1e6;

/* ── Tokens and money ────────────────────────────────────────────────────── */

/**
 * An input-token estimate for one request, deliberately on the high side.
 *
 * JSON is token-dense (quotes, braces, short keys), so characters / 3.2
 * rather than the usual / 4, plus a per-question allowance for whatever
 * framing the service wraps around each question. TypeSafe quotes ~420 input
 * tokens for a typical small call; this estimates a small call a little above
 * that. Once a real response reports its token count the client scales every
 * later estimate by the worst ratio it has seen, so an underestimate corrects
 * itself after the first call instead of after the budget.
 */
export function estimateTokens(body) {
  const chars = JSON.stringify(body).length;
  const q = body && body.questions ? Object.keys(body.questions).length : 1;
  return Math.ceil(chars / 3.2) + 80 * q + 60;
}

export const usd = (tokens) => tokens * USD_PER_TOKEN;
export const fmtUsd = (x) => '$' + (x < 0.01 ? x.toFixed(6) : x.toFixed(4));

/** 'sk-or-v1-…f472 (73 chars)'. Enough to tell two keys apart, not enough to use. */
export function mask(key) {
  if (!key) return '(none)';
  const head = key.startsWith('sk-or-') ? key.slice(0, key.indexOf('-', 6) + 1 || 6) : key.slice(0, 3);
  return `${head}…${key.slice(-4)} (${key.length} chars)`;
}

/** Strip anything shaped like an OpenRouter key out of a string before it is logged. */
export const scrub = (s) => String(s).replace(/sk-or-[A-Za-z0-9-]{10,}/g, (k) => mask(k));

/* ── Question builders ───────────────────────────────────────────────────── */

export const noul = (instructions, criteria) =>
  criteria ? { type: 'noul', instructions, criteria } : { type: 'noul', instructions };
export const choice = (instructions, criteria) => ({ type: 'choice', instructions, criteria });
export const score = (instructions, criteria) => ({ type: 'score', instructions, criteria });

/* ── Reading a response ──────────────────────────────────────────────────── */

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

/**
 * Find the answers in a response whose exact envelope is not documented.
 *
 * Tries, in order: `answers`, `results`, `decisions`, `outputs`, `output`,
 * `data.answers`, `data`, then the top level itself — the first of those that
 * is an object holding at least one of the question names wins. An array of
 * `{name|question|key, ...}` rows is accepted too. Anything else comes back
 * empty, and the caller records it as a malformed response rather than
 * guessing.
 */
export function findAnswers(json, names) {
  const candidates = [
    json?.answers,
    json?.results,
    json?.decisions,
    json?.outputs,
    json?.output,
    json?.data?.answers,
    json?.data,
    json,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      const out = {};
      for (const row of c) {
        const k = row?.name ?? row?.question ?? row?.key ?? row?.id;
        if (typeof k === 'string' && names.includes(k)) out[k] = row.answer ?? row.result ?? row;
      }
      if (Object.keys(out).length) return out;
    } else if (isObj(c) && names.some((n) => n in c)) {
      const out = {};
      for (const n of names) if (n in c) out[n] = c[n];
      return out;
    }
  }
  return {};
}

const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && x.trim() !== '' && Number.isFinite(+x) ? +x : undefined);

/**
 * One answer, in one shape, whatever the wire said.
 *
 * Returns `{ type, value, probabilities?, confidence?, ok, problem? }` where
 * `value` is the noul probability, the choice label or the score. `ok` is
 * false when the answer does not fit the question — a choice label that was
 * never offered, a noul outside 0..1 — so a bad answer is counted as an error
 * rather than read as an opinion.
 */
export function normaliseAnswer(q, raw) {
  if (raw == null) return { type: q.type, ok: false, problem: 'missing' };
  const a = isObj(raw) ? raw : { [q.type]: raw };
  const type = a.type || q.type;
  const probabilities = isObj(a.probabilities) ? a.probabilities : undefined;
  const confidence = num(a.confidence);
  if (q.type === 'noul') {
    const v = num(a.noul ?? a.value ?? a.probability ?? a.p);
    if (v === undefined || v < 0 || v > 1) return { type, ok: false, problem: `noul not in 0..1: ${JSON.stringify(raw)}` };
    return { type, value: v, confidence, ok: true };
  }
  if (q.type === 'choice') {
    const v = a.choice ?? a.value ?? a.label;
    const labels = Object.keys(q.criteria || {});
    if (typeof v !== 'string' || !labels.includes(v)) return { type, ok: false, problem: `choice not an offered label: ${JSON.stringify(v)}` };
    return { type, value: v, probabilities, confidence, ok: true };
  }
  if (q.type === 'score') {
    const v = num(a.score ?? a.value);
    const max = Array.isArray(q.criteria) ? q.criteria.length - 1 : Infinity;
    if (v === undefined || v < 0 || v > max + 1e-9) return { type, ok: false, problem: `score out of range: ${JSON.stringify(raw)}` };
    return { type, value: v, probabilities, confidence, ok: true };
  }
  return { type, ok: false, problem: `unknown question type ${q.type}` };
}

/** Tokens and cost, from whichever usage fields the response carries. */
export function readUsage(json) {
  const u = json?.usage || json?.meta?.usage || {};
  const inputTokens = num(u.prompt_tokens ?? u.input_tokens ?? u.promptTokens ?? u.inputTokens ?? u.total_tokens);
  const cost = num(u.cost ?? u.total_cost ?? json?.cost);
  return { inputTokens, cost };
}

/** TypeSafe's own reading of a confidence figure. */
export const band = (c) => (c == null ? 'n/a' : c > 0.9 ? 'act' : c >= 0.5 ? 'confirm' : 'escalate');

/* ── A fake Jev, for --mock ──────────────────────────────────────────────── */

const unit = (s) => parseInt(createHash('sha256').update(s).digest('hex').slice(0, 12), 16) / 2 ** 48;

/**
 * A fetch that answers like Jev without leaving the machine.
 *
 * Deterministic: the same state and question always get the same answer, so
 * two mock runs diff clean. Answers are schema-valid and deliberately spread
 * across the whole range, so every branch of every report (agree, both kinds
 * of disagreement, unsure, order flips) gets exercised. They mean nothing and
 * every report written from them says so in its first line.
 *
 * `failAt` injects failures by request number — a 429 and a 503 by default —
 * so the retry path is exercised on every mock run, not just described.
 */
export function mockFetch({ failAt = { 2: 429, 5: 503 } } = {}) {
  let n = 0;
  const seen = new Set();
  return async (url, init) => {
    n += 1;
    const body = JSON.parse(init.body);
    const sig = JSON.stringify(body);
    // Fail each injected request number once; the retry of the same body
    // gets through.
    if (failAt[n] && !seen.has(sig)) {
      seen.add(sig);
      return new Response(JSON.stringify({ error: { message: `mock ${failAt[n]}` } }), {
        status: failAt[n],
        headers: { 'content-type': 'application/json', 'retry-after': '0' },
      });
    }
    const state = JSON.stringify(body.state);
    const answers = {};
    for (const [name, q] of Object.entries(body.questions)) {
      const u = unit(name + '|' + state);
      if (q.type === 'noul') {
        // Mostly confident, some middling: roughly the shape a real
        // classifier's answers take, so every report branch gets rows.
        const v = u < 0.72 ? 0.9 + unit('hi' + u) * 0.09 : u < 0.84 ? 0.2 + unit('mid' + u) * 0.6 : 0.01 + unit('lo' + u) * 0.17;
        answers[name] = { type: 'noul', noul: +v.toFixed(3) };
      } else if (q.type === 'choice') {
        const labels = Object.keys(q.criteria);
        // Order-sensitive on purpose (the label's position is in the hash), so
        // the two-orderings flip detector has something to find.
        const w = labels.map((l, i) => 0.05 + unit(l + '|' + i + '|' + state) ** 3);
        const sum = w.reduce((a, b) => a + b, 0);
        const probabilities = Object.fromEntries(labels.map((l, i) => [l, +(w[i] / sum).toFixed(4)]));
        const best = labels[w.indexOf(Math.max(...w))];
        answers[name] = { type: 'choice', choice: best, probabilities, confidence: +Math.max(...w.map((x) => x / sum)).toFixed(3) };
      } else if (q.type === 'score') {
        const k = q.criteria.length;
        const v = +(u * (k - 1)).toFixed(2);
        answers[name] = { type: 'score', score: v, confidence: +(0.5 + unit('c' + u) / 2).toFixed(3) };
      }
    }
    const tokens = estimateTokens(body);
    return new Response(
      JSON.stringify({
        id: 'mock-' + createHash('sha256').update(sig).digest('hex').slice(0, 10),
        model: body.model,
        provider: 'mock',
        answers,
        usage: { prompt_tokens: tokens, completion_tokens: 0, total_tokens: tokens, cost: usd(tokens) },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };
}

/* ── The client ──────────────────────────────────────────────────────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class StopRun extends Error {}

export class Jev {
  /**
   * @param {object} o
   * @param {string} [o.apiKey]      required unless mock
   * @param {boolean} [o.mock]
   * @param {number} [o.maxUsd]      spend guard, default 0.50
   * @param {number} [o.concurrency] default 4
   * @param {string} o.outDir        where the log and first raw response go
   * @param {number} [o.maxAttempts] default 5
   * @param {number} [o.baseDelayMs] default 1000 (10 in mock)
   */
  constructor(o) {
    this.mock = !!o.mock;
    this.apiKey = o.apiKey;
    if (!this.mock && !this.apiKey) throw new Error('OPENROUTER_API_KEY is not set');
    this.fetch = o.fetchImpl || (this.mock ? mockFetch() : globalThis.fetch);
    this.maxUsd = o.maxUsd ?? 0.5;
    this.concurrency = o.concurrency ?? 4;
    this.maxAttempts = o.maxAttempts ?? 5;
    this.baseDelayMs = o.baseDelayMs ?? (this.mock ? 10 : 1000);
    this.outDir = o.outDir;
    this.logFile = join(o.outDir, 'run.log.jsonl');
    mkdirSync(o.outDir, { recursive: true });
    this.spentUsd = 0;
    this.reservedUsd = 0;
    /** reported / estimated tokens, worst seen — scales later estimates. */
    this.tokenRatio = 1;
    /** reported cost / estimated cost, worst seen — for when the price per
     *  token is not what the docs said. */
    this.costRatio = 1;
    this.calls = 0;
    this.retries = 0;
    this.errors = 0;
    this.consecutive400 = 0;
    this.consecutiveNetFail = 0;
    this.consecutiveUnread = 0;
    this.stopped = null;
    this.rawLogged = false;
    this.errLogged = false;
    this.say = o.say || ((s) => console.log(s));
  }

  log(event) {
    appendFileSync(this.logFile, scrub(JSON.stringify({ at: new Date().toISOString(), ...event })) + '\n');
  }

  stop(reason) {
    if (!this.stopped) {
      this.stopped = reason;
      this.say(`  STOPPING: ${reason}`);
      this.log({ event: 'stop', reason });
    }
  }

  /** One request: many questions about one state. */
  async decide(state, questions, meta = {}) {
    const body = { model: MODEL, state, questions };
    const est = Math.ceil(estimateTokens(body) * this.tokenRatio);
    const estUsd = usd(est) * this.costRatio;
    if (this.stopped) return { skipped: true, reason: this.stopped, estTokens: est };
    // Reserve before sending, so four in-flight calls cannot each think the
    // last cent is theirs.
    if (this.spentUsd + this.reservedUsd + estUsd > this.maxUsd) {
      this.stop(`spend guard: ${fmtUsd(this.spentUsd)} spent + ${fmtUsd(this.reservedUsd)} in flight + ${fmtUsd(estUsd)} next > --max-usd ${fmtUsd(this.maxUsd)}`);
      return { skipped: true, reason: this.stopped, estTokens: est };
    }
    this.reservedUsd += estUsd;
    try {
      return await this.#send(body, est, meta);
    } finally {
      this.reservedUsd -= estUsd;
    }
  }

  async #send(body, est, meta) {
    const names = Object.keys(body.questions);
    let lastErr = '';
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      if (this.stopped) return { skipped: true, reason: this.stopped, estTokens: est };
      let res;
      const t0 = Date.now();
      try {
        this.calls += 1;
        res = await this.fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.mock ? 'mock' : this.apiKey}`,
            'Content-Type': 'application/json',
            // OpenRouter's attribution headers. Harmless if ignored.
            'HTTP-Referer': 'https://pantryglobe.com',
            'X-Title': 'Pantry Jev harness',
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        lastErr = `network: ${e?.cause?.code || e?.message || e}`;
        this.log({ event: 'network-error', id: meta.id, attempt, error: lastErr });
        if (attempt < this.maxAttempts) {
          this.retries += 1;
          await sleep(this.#backoff(attempt));
          continue;
        }
        // Three calls in a row that never reached the server: the network is
        // down or blocked, and retrying 800 more calls five times each helps
        // nobody.
        if (++this.consecutiveNetFail >= 3) this.stop(`${lastErr} — three calls in a row could not reach ${new URL(ENDPOINT).host}`);
        break;
      }
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* reported below */
      }
      // The envelope is known only from examples, so keep the first real
      // answer exactly as it came — and, separately, the first refusal, so a
      // proxy or auth error cannot take the place of the answer.
      const rawKey = res.ok ? 'rawLogged' : 'errLogged';
      if (!this[rawKey]) {
        this[rawKey] = true;
        writeFileSync(
          join(this.outDir, res.ok ? 'raw-first-response.json' : 'raw-first-error.json'),
          scrub(JSON.stringify({ status: res.status, mock: this.mock, request: body, response: json ?? text }, null, 2)),
        );
      }
      this.log({ event: 'response', id: meta.id, attempt, status: res.status, ms: Date.now() - t0 });

      this.consecutiveNetFail = 0;
      if (res.ok && json) {
        this.consecutive400 = 0;
        const found = findAnswers(json, names);
        const answers = {};
        for (const n of names) answers[n] = normaliseAnswer(body.questions[n], found[n]);
        const usage = readUsage(json);
        if (usage.inputTokens) this.tokenRatio = Math.max(this.tokenRatio, usage.inputTokens / est);
        const cost = usage.cost ?? usd(usage.inputTokens ?? est);
        if (usage.cost != null) this.costRatio = Math.max(this.costRatio, usage.cost / usd(usage.inputTokens ?? est));
        this.spentUsd += cost;
        if (this.spentUsd > this.maxUsd) this.stop(`reported spend ${fmtUsd(this.spentUsd)} passed --max-usd ${fmtUsd(this.maxUsd)}`);
        const bad = names.filter((n) => !answers[n].ok);
        if (bad.length === names.length) {
          this.errors += 1;
          // Paid for and unreadable. Three in a row means the envelope is not
          // one findAnswers() knows — stop before the budget goes on more.
          if (++this.consecutiveUnread >= 3) this.stop(`three paid responses in a row had no readable answers — see raw-first-response.json and adjust findAnswers() in lib.mjs`);
        } else this.consecutiveUnread = 0;
        return {
          ok: bad.length < names.length,
          answers,
          usage: { ...usage, estTokens: est, costUsd: cost },
          model: json.model,
          provider: json.provider,
          attempts: attempt,
          ...(bad.length ? { problems: Object.fromEntries(bad.map((n) => [n, answers[n].problem])) } : {}),
        };
      }

      const msg = scrub((json && (json.error?.message || json.message)) || text.slice(0, 300));
      lastErr = `HTTP ${res.status}: ${msg}`;
      if (res.status === 429 || res.status >= 500) {
        if (attempt < this.maxAttempts) {
          this.retries += 1;
          const ra = Number(res.headers.get('retry-after'));
          await sleep(Number.isFinite(ra) && ra >= 0 && res.headers.get('retry-after') !== null ? Math.min(ra, 60) * 1000 : this.#backoff(attempt));
          continue;
        }
        break;
      }
      if (res.status === 403 && /allowlist|egress|proxy|blocked/i.test(msg)) this.stop(`${lastErr} — the network in between refused ${new URL(ENDPOINT).host}; the key was never checked`);
      else if (res.status === 401 || res.status === 403) this.stop(`${lastErr} — the key was refused (${this.mock ? 'mock' : mask(this.apiKey)})`);
      else if (res.status === 402) this.stop(`${lastErr} — out of credits`);
      else if (res.status === 404) this.stop(`${lastErr} — endpoint or model not found; every call would do the same`);
      else if (res.status === 400 || res.status === 422) {
        this.consecutive400 += 1;
        if (this.consecutive400 >= 5) this.stop(`${lastErr} — five 400s in a row: the request shape is wrong, not the data`);
      }
      break;
    }
    this.errors += 1;
    return { ok: false, error: lastErr, estTokens: est };
  }

  #backoff(attempt) {
    const base = this.baseDelayMs * 2 ** (attempt - 1);
    return Math.min(30000, base + Math.floor(Math.random() * base * 0.25));
  }

  /**
   * Run many calls, `concurrency` at a time, in order of `calls`.
   * Returns results in the same order. A stop leaves the rest `skipped`.
   */
  async runAll(calls, { label = '', onProgress } = {}) {
    const out = new Array(calls.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (next < calls.length) {
        const i = next++;
        const c = calls[i];
        out[i] = await this.decide(c.state, c.questions, { id: c.id });
        done += 1;
        if (onProgress) onProgress(done, calls.length);
        else if (done % 25 === 0 || done === calls.length) this.say(`  ${label} ${done}/${calls.length}  spent ${fmtUsd(this.spentUsd)}`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, calls.length) }, worker));
    return out;
  }
}

/* ── Small shared helpers for the checks ─────────────────────────────────── */

export const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
export const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + '%' : 'n/a');
export const r3 = (x) => (typeof x === 'number' ? x.toFixed(3) : String(x));

/** Deterministic PRNG, so the scenario list is the same every run. */
export function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_BANNER =
  '> **MOCK RUN.** These answers came from the offline fake in `scripts/jev/lib.mjs`, not from Jev. They exercise the pipeline and mean nothing about the app. Re-run without `--mock` for real opinions.\n';
