/**
 * General-purpose LLMs on OpenRouter, asked the same typed questions as Jev.
 *
 * bench.mjs uses this to answer one question: is Jev worth it compared with
 * sending the same state and the same questions to an ordinary small chat
 * model? So the request here is built from exactly the `state` and
 * `questions` a Jev call carries, and the reply is read back into exactly the
 * shape lib.mjs's normaliseAnswer() produces for Jev — a probability for a
 * noul, an offered label for a choice. Everything downstream scores the two
 * the same way.
 *
 * Same rules as lib.mjs: the key comes from process.env.OPENROUTER_API_KEY
 * only, is never written anywhere, and every log line is scrubbed. The spend
 * guard is shared (a Budget object) so several models and Jev cannot between
 * them spend past --max-usd, and it reserves each call's WORST case — input
 * estimate at the input price plus max_tokens at the output price — before
 * the call goes out.
 *
 * No dependencies: Node 22's fetch.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fmtUsd, mask, normaliseAnswer, scrub } from './lib.mjs';

export const CHAT_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models';

/* ── Money ───────────────────────────────────────────────────────────────── */

/** One spend guard for a whole run, shared by every client that spends. */
export class Budget {
  constructor(maxUsd) {
    this.maxUsd = maxUsd;
    this.spent = 0;
    this.reserved = 0;
  }
  left() {
    return this.maxUsd - this.spent - this.reserved;
  }
  /** True and reserved if `usd` fits; false (and nothing reserved) if not. */
  reserve(usd) {
    if (this.spent + this.reserved + usd > this.maxUsd + 1e-12) return false;
    this.reserved += usd;
    return true;
  }
  release(usd) {
    this.reserved = Math.max(0, this.reserved - usd);
  }
  commit(usd) {
    this.spent += usd;
  }
}

/** USD per token, from an OpenRouter /models row (prices are strings, per token). */
export function priceOf(model) {
  const p = model?.pricing || {};
  const n = (x) => (x == null || x === '' ? NaN : Number(x));
  return { input: n(p.prompt), output: n(p.completion), request: Number.isFinite(n(p.request)) ? n(p.request) : 0 };
}

/**
 * What a call cost. OpenRouter reports `usage.cost` (USD) on chat completions;
 * when it is there it wins. Otherwise the listed prices times the reported
 * tokens. `source` says which, so the report can too.
 */
export function costFromUsage(usage, model) {
  const u = usage || {};
  const inTok = Number(u.prompt_tokens ?? u.input_tokens ?? 0) || 0;
  const outTok = Number(u.completion_tokens ?? u.output_tokens ?? 0) || 0;
  const reported = typeof u.cost === 'number' && Number.isFinite(u.cost) ? u.cost : typeof u.cost === 'string' && Number.isFinite(+u.cost) ? +u.cost : null;
  if (reported != null) return { usd: reported, inputTokens: inTok, outputTokens: outTok, source: 'reported' };
  const p = priceOf(model);
  const usd = inTok * (p.input || 0) + outTok * (p.output || 0) + (p.request || 0);
  return { usd, inputTokens: inTok, outputTokens: outTok, source: 'listed-price' };
}

export const perMillion = (perToken) => (Number.isFinite(perToken) ? `$${(perToken * 1e6).toFixed(3)}/M` : 'n/a');

/* ── Choosing models ─────────────────────────────────────────────────────── */

/**
 * The default preference: one small Anthropic model and one small OpenAI or
 * Google model. Within each group the CHEAPEST listed match wins (priced on
 * this run's actual workload), because the point of the comparison is "a
 * normal, cheap LLM" and the budget is one dollar for everything.
 */
export const DEFAULT_PREFS = [
  { group: 'anthropic', patterns: ['anthropic/claude-*haiku*'] },
  { group: 'openai-or-google', patterns: ['openai/gpt-*-mini', 'google/gemini-*-flash', 'google/gemini-*-flash-001', 'google/gemini-*-flash-lite', 'google/gemini-*-flash-lite-001'] },
];

/**
 * Model families that always spend hidden "thinking" tokens, billed as
 * output. A small max_tokens can then be eaten before any JSON appears. They
 * are chosen only when a group has nothing else.
 */
const ALWAYS_THINKS = /\/(o\d|gpt-5|gemini-2\.5|gemini-3)|thinking|deepseek-r1/i;
/** Ids that are not a plain, paid, text chat model. */
const NOT_PLAIN = /:(free|beta|extended|thinking|online)\b|image|audio|tts|vision-only|embed|preview-\d{2}-\d{2}|-exp\b/i;

/** 'openai/gpt-*-mini' -> /^openai\/gpt-[^/]*-mini$/ . A pattern with no '*' is an exact id. */
export function globToRegExp(glob) {
  const esc = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp('^' + esc + '$', 'i');
}

/**
 * Pick models from a /models listing.
 *
 * @param {object[]} listing   rows of GET /api/v1/models `data`
 * @param {object}   o
 * @param {Array<{group:string, patterns:string[]}>} [o.prefs]  groups; one model per group
 * @param {{input:number, output:number}} o.workload  tokens this run would send / cap
 * @returns {{chosen: object[], considered: object[]}}  chosen rows carry
 *          `price`, `workloadUsd`, `group`, `thinks`
 */
export function selectModels(listing, { prefs = DEFAULT_PREFS, workload }) {
  const rows = (listing || []).filter((m) => m && typeof m.id === 'string');
  const chosen = [];
  const considered = [];
  for (const pref of prefs) {
    const res = pref.patterns.map(globToRegExp);
    const matches = rows
      .filter((m) => res.some((re) => re.test(m.id)))
      .filter((m) => !NOT_PLAIN.test(m.id))
      .map((m) => {
        const price = priceOf(m);
        const workloadUsd = workload.input * price.input + workload.output * price.output;
        return { ...m, price, workloadUsd, group: pref.group, thinks: ALWAYS_THINKS.test(m.id) };
      })
      // Free (0) and router (-1) prices are rate-limited or unpriceable; both
      // make a cost comparison meaningless.
      .filter((m) => Number.isFinite(m.workloadUsd) && m.price.input > 0 && m.price.output > 0)
      .filter((m) => !chosen.some((c) => c.id === m.id));
    matches.sort((a, b) => Number(a.thinks) - Number(b.thinks) || a.workloadUsd - b.workloadUsd || a.id.localeCompare(b.id));
    considered.push(...matches.map((m) => ({ id: m.id, group: pref.group, workloadUsd: m.workloadUsd, thinks: m.thinks })));
    if (matches.length) chosen.push(matches[0]);
  }
  return { chosen, considered };
}

/** --models=a,b  -> one preference group per entry, so each entry yields one model. */
export function prefsFromFlag(flag) {
  if (!flag) return DEFAULT_PREFS;
  return flag
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => ({ group: p, patterns: [p] }));
}

/**
 * Stand-in /models rows for --dry and --mock, which have no network. Prices
 * are what OpenRouter listed for these ids as of writing and are only used to
 * ESTIMATE; a live run always reads the real listing. Includes rows the
 * selector must reject (free, router, thinking-only, not matching) so the
 * mock exercises that code too.
 */
export const OFFLINE_MODELS = [
  { id: 'anthropic/claude-3-haiku', pricing: { prompt: '0.00000025', completion: '0.00000125' }, supported_parameters: ['max_tokens', 'temperature'] },
  { id: 'anthropic/claude-3.5-haiku', pricing: { prompt: '0.0000008', completion: '0.000004' }, supported_parameters: ['max_tokens', 'temperature'] },
  { id: 'anthropic/claude-haiku-4.5', pricing: { prompt: '0.000001', completion: '0.000005' }, supported_parameters: ['max_tokens', 'temperature', 'reasoning', 'structured_outputs', 'response_format'] },
  { id: 'anthropic/claude-sonnet-4.5', pricing: { prompt: '0.000003', completion: '0.000015' }, supported_parameters: ['max_tokens'] },
  { id: 'openai/gpt-4o-mini', pricing: { prompt: '0.00000015', completion: '0.0000006' }, supported_parameters: ['max_tokens', 'temperature', 'response_format', 'structured_outputs'] },
  { id: 'openai/gpt-4.1-mini', pricing: { prompt: '0.0000004', completion: '0.0000016' }, supported_parameters: ['max_tokens', 'temperature', 'response_format', 'structured_outputs'] },
  { id: 'openai/gpt-5-mini', pricing: { prompt: '0.00000025', completion: '0.000002' }, supported_parameters: ['max_tokens', 'reasoning', 'response_format', 'structured_outputs'] },
  { id: 'google/gemini-2.0-flash-001', pricing: { prompt: '0.0000001', completion: '0.0000004' }, supported_parameters: ['max_tokens', 'temperature', 'response_format', 'structured_outputs'] },
  { id: 'google/gemini-2.5-flash', pricing: { prompt: '0.0000003', completion: '0.0000025' }, supported_parameters: ['max_tokens', 'reasoning', 'response_format', 'structured_outputs'] },
  { id: 'google/gemini-2.0-flash-exp:free', pricing: { prompt: '0', completion: '0' }, supported_parameters: ['max_tokens'] },
  { id: 'openrouter/auto', pricing: { prompt: '-1', completion: '-1' }, supported_parameters: [] },
];

/**
 * Two made-up, dear models that only --mock lists and asks for, so a mock run
 * also walks the budget paths a live run hopes never to need: one whose full
 * plan does not fit but whose gold-only subset does, and one that is skipped.
 */
export const MOCK_EXTRA_MODELS = [
  { id: 'mock/pricey-model', pricing: { prompt: '0.0000012', completion: '0.000006' }, supported_parameters: ['max_tokens', 'response_format'] },
  { id: 'mock/very-pricey-model', pricing: { prompt: '0.00001', completion: '0.00005' }, supported_parameters: ['max_tokens'] },
];
export const MOCK_EXTRA_PREFS = [
  { group: 'mock: gold-only path', patterns: ['mock/pricey-model'] },
  { group: 'mock: skip path', patterns: ['mock/very-pricey-model'] },
];

/**
 * The dearest model the default preferences could plausibly land on, per
 * group — for the dry run's "if the cheap ones have been retired" ceiling.
 */
export function dearestPlausible(listing, { prefs = DEFAULT_PREFS, workload }) {
  return prefs.map((pref) => {
    const res = pref.patterns.map(globToRegExp);
    const ms = listing
      .filter((m) => res.some((re) => re.test(m.id)) && !NOT_PLAIN.test(m.id) && !ALWAYS_THINKS.test(m.id))
      .map((m) => ({ id: m.id, price: priceOf(m) }))
      .filter((m) => m.price.input > 0)
      .map((m) => ({ ...m, workloadUsd: workload.input * m.price.input + workload.output * m.price.output }))
      .sort((a, b) => b.workloadUsd - a.workloadUsd);
    return { group: pref.group, ...(ms[0] || { id: null, workloadUsd: 0 }) };
  });
}

/* ── The request and the reply ───────────────────────────────────────────── */

export const SYSTEM_PROMPT = [
  'You are being benchmarked on typed questions about a JSON "state". Answer every question in "questions".',
  'For a question of type "noul": give the probability, a number from 0 to 1, that the answer is true. "criteria.true" and "criteria.false" say what true and false mean. 0.5 means you cannot tell.',
  'For a question of type "choice": give exactly one of the offered labels (the keys of "criteria"), spelled exactly as given.',
  'For a question of type "score": give a number from 0 to (number of criteria - 1); the criteria are the levels in order.',
  'Reply with ONE JSON object whose keys are the question names and whose values are your answers. No prose, no code fences, no explanation.',
].join('\n');

/** A strict JSON schema for the reply: one property per question. */
export function answerSchema(questions) {
  const properties = {};
  for (const [name, q] of Object.entries(questions)) {
    if (q.type === 'choice') properties[name] = { type: 'string', enum: Object.keys(q.criteria || {}) };
    else properties[name] = { type: 'number' };
  }
  return { type: 'object', properties, required: Object.keys(questions), additionalProperties: false };
}

/**
 * The chat-completions body for one (state, questions) pair.
 * `response_format` goes in only when the model lists support for it —
 * otherwise some providers refuse the whole request — and the parser below
 * copes with a bare-JSON reply either way.
 */
export function chatBody(model, state, questions, { maxTokens }) {
  const params = model.supported_parameters || [];
  const body = {
    model: model.id,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ state, questions }) },
    ],
    temperature: 0,
    max_tokens: maxTokens,
    usage: { include: true },
  };
  if (params.includes('structured_outputs')) body.response_format = { type: 'json_schema', json_schema: { name: 'answers', strict: true, schema: answerSchema(questions) } };
  else if (params.includes('response_format')) body.response_format = { type: 'json_object' };
  return body;
}

/** Input tokens for a chat body, on the high side like lib.mjs's estimate. */
export function estimateChatTokens(body) {
  const chars = JSON.stringify(body.messages).length + (body.response_format ? JSON.stringify(body.response_format).length : 0);
  return Math.ceil(chars / 3.2) + 40;
}

/** The assistant's text, whether content is a string or an array of parts. */
export function contentOf(json) {
  const c = json?.choices?.[0]?.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((p) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
  return '';
}

/**
 * Read an LLM's reply into Jev-shaped answers.
 *
 * Tolerates what small models actually do: ```json fences, a sentence before
 * the object, numbers as strings, true/false for a probability, a label in the
 * wrong case. Anything it cannot read becomes `ok: false` with the reason — a
 * bad reply is an error, never a guessed opinion.
 */
export function parseLlmAnswers(text, questions) {
  const names = Object.keys(questions);
  const fail = (problem) => ({ answers: Object.fromEntries(names.map((n) => [n, { type: questions[n].type, ok: false, problem }])), problem });
  if (typeof text !== 'string' || !text.trim()) return fail('empty reply');
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return fail(`no JSON object in reply: ${JSON.stringify(text.slice(0, 80))}`);
  let obj;
  try {
    obj = JSON.parse(t.slice(a, b + 1));
  } catch (e) {
    return fail(`reply is not valid JSON: ${e.message}`);
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('reply JSON is not an object');
  // Some models nest the answers one level down.
  if (!names.some((n) => n in obj)) {
    const inner = Object.values(obj).find((v) => v && typeof v === 'object' && !Array.isArray(v) && names.some((n) => n in v));
    if (inner) obj = inner;
  }
  const answers = {};
  for (const n of names) {
    const q = questions[n];
    let raw = obj[n];
    if (q.type === 'noul' && typeof raw === 'boolean') raw = raw ? 1 : 0;
    if (q.type === 'choice' && typeof raw === 'string') {
      const labels = Object.keys(q.criteria || {});
      const exact = labels.find((l) => l === raw.trim());
      const loose = labels.find((l) => l.toLowerCase() === raw.trim().toLowerCase());
      raw = exact ?? loose ?? raw;
    }
    if (q.type === 'choice' && raw && typeof raw === 'object') raw = raw.choice ?? raw.label ?? raw.value;
    answers[n] = normaliseAnswer(q, raw);
  }
  return { answers };
}

/* ── A fake OpenRouter, for --mock ───────────────────────────────────────── */

const unit = (s) => parseInt(createHash('sha256').update(s).digest('hex').slice(0, 12), 16) / 2 ** 48;

/**
 * A fetch that answers GET /models and POST /chat/completions offline.
 *
 * Deterministic and deliberately awkward, so --mock walks every branch the
 * real thing can take: one model's replies come in ```json fences, one reply
 * in every 23 is prose with no JSON (a parse error), one model reports
 * usage.cost and the other does not (so the listed-price path runs), and the
 * second request is a 429 that the retry recovers from.
 */
export function mockOpenRouterFetch({ listing = [...OFFLINE_MODELS, ...MOCK_EXTRA_MODELS], failAt = { 2: 429 } } = {}) {
  let n = 0;
  const seen = new Set();
  return async (url, init = {}) => {
    if (String(url).startsWith(MODELS_ENDPOINT)) return new Response(JSON.stringify({ data: listing }), { status: 200, headers: { 'content-type': 'application/json' } });
    n += 1;
    const body = JSON.parse(init.body);
    const sig = init.body;
    if (failAt[n] && !seen.has(sig)) {
      seen.add(sig);
      return new Response(JSON.stringify({ error: { message: `mock ${failAt[n]}` } }), { status: failAt[n], headers: { 'content-type': 'application/json', 'retry-after': '0' } });
    }
    const { state, questions } = JSON.parse(body.messages[1].content);
    const key = body.model + '|' + JSON.stringify(state);
    const out = {};
    for (const [name, q] of Object.entries(questions)) {
      const u = unit(name + '|' + key);
      if (q.type === 'noul') out[name] = +(u < 0.7 ? 0.85 + u * 0.14 : u < 0.8 ? 0.3 + u * 0.3 : u * 0.1).toFixed(2);
      else if (q.type === 'choice') {
        const labels = Object.keys(q.criteria);
        out[name] = labels[Math.floor(u * labels.length) % labels.length];
      } else out[name] = +(u * ((q.criteria?.length || 2) - 1)).toFixed(1);
    }
    let content = JSON.stringify(out);
    if (/anthropic/.test(body.model)) content = 'Here are the answers:\n```json\n' + JSON.stringify(out, null, 1) + '\n```';
    if (unit('prose|' + key) < 1 / 23) content = 'I am not able to determine this from the information given.';
    const promptTokens = Math.ceil(JSON.stringify(body.messages).length / 3.6);
    const completionTokens = Math.ceil(content.length / 3.5);
    const model = listing.find((m) => m.id === body.model);
    const p = priceOf(model);
    const usage = { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens };
    if (!/anthropic/.test(body.model)) usage.cost = promptTokens * p.input + completionTokens * p.output;
    return new Response(JSON.stringify({ id: 'mock-chat-' + n, model: body.model, choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }], usage }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

/* ── Fetching the model list ─────────────────────────────────────────────── */

export async function fetchModels({ fetchImpl = globalThis.fetch, apiKey } = {}) {
  const res = await fetchImpl(MODELS_ENDPOINT, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
  if (!res.ok) throw new Error(`GET /models: HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json?.data)) throw new Error('GET /models: no data array');
  return json.data;
}

/* ── The client ──────────────────────────────────────────────────────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Llm {
  /**
   * @param {object} o
   * @param {object} o.model        a chosen /models row (id, pricing, supported_parameters)
   * @param {Budget} o.budget       shared spend guard
   * @param {string} [o.apiKey]     required unless mock
   * @param {boolean} [o.mock]
   * @param {Function} [o.fetchImpl]
   * @param {string} o.outDir
   * @param {number} [o.concurrency] default 4
   */
  constructor(o) {
    this.model = o.model;
    this.budget = o.budget;
    this.mock = !!o.mock;
    this.apiKey = o.apiKey;
    if (!this.mock && !this.apiKey) throw new Error('OPENROUTER_API_KEY is not set');
    this.fetch = o.fetchImpl || globalThis.fetch;
    this.concurrency = o.concurrency ?? 4;
    this.maxAttempts = o.maxAttempts ?? 5;
    this.baseDelayMs = o.baseDelayMs ?? (this.mock ? 5 : 1000);
    this.outDir = o.outDir;
    mkdirSync(o.outDir, { recursive: true });
    this.logFile = join(o.outDir, 'run.log.jsonl');
    this.price = priceOf(o.model);
    this.tokenRatio = 1;
    this.spentUsd = 0;
    this.calls = 0;
    this.retries = 0;
    this.errors = 0;
    this.consecutive400 = 0;
    this.consecutiveNetFail = 0;
    this.stopped = null;
    this.rawLogged = false;
    this.say = o.say || ((s) => console.log(s));
  }

  log(event) {
    appendFileSync(this.logFile, scrub(JSON.stringify({ at: new Date().toISOString(), model: this.model.id, ...event })) + '\n');
  }

  stop(reason) {
    if (!this.stopped) {
      this.stopped = reason;
      this.say(`  STOPPING ${this.model.id}: ${reason}`);
      this.log({ event: 'stop', reason });
    }
  }

  /** Worst-case USD for one body: estimated input at the input price, max_tokens at the output price. */
  worstCase(body) {
    const inTok = Math.ceil(estimateChatTokens(body) * this.tokenRatio);
    return { inTok, usd: inTok * this.price.input + body.max_tokens * this.price.output + (this.price.request || 0) };
  }

  async ask(state, questions, { id, maxTokens = 200 } = {}) {
    const body = chatBody(this.model, state, questions, { maxTokens });
    const wc = this.worstCase(body);
    if (this.stopped) return { skipped: true, reason: this.stopped };
    if (!this.budget.reserve(wc.usd)) {
      this.stop(`spend guard: ${fmtUsd(this.budget.spent)} spent + ${fmtUsd(this.budget.reserved)} in flight + ${fmtUsd(wc.usd)} worst case next > --max-usd ${fmtUsd(this.budget.maxUsd)}`);
      return { skipped: true, reason: this.stopped };
    }
    const t0 = performance.now();
    try {
      const r = await this.#send(body, wc, id);
      r.ms = performance.now() - t0;
      return r;
    } finally {
      this.budget.release(wc.usd);
    }
  }

  async #send(body, wc, id) {
    let lastErr = '';
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      if (this.stopped) return { skipped: true, reason: this.stopped };
      let res;
      const t0 = Date.now();
      try {
        this.calls += 1;
        res = await this.fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.mock ? 'mock' : this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pantryglobe.com',
            'X-Title': 'Pantry Jev bench',
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        lastErr = `network: ${e?.cause?.code || e?.message || e}`;
        this.log({ event: 'network-error', id, attempt, error: lastErr });
        if (attempt < this.maxAttempts) {
          this.retries += 1;
          await sleep(this.#backoff(attempt));
          continue;
        }
        if (++this.consecutiveNetFail >= 3) this.stop(`${lastErr} — three calls in a row could not reach openrouter.ai`);
        break;
      }
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* reported below */
      }
      this.log({ event: 'response', id, attempt, status: res.status, ms: Date.now() - t0 });
      this.consecutiveNetFail = 0;
      if (res.ok && json && !json.error) {
        this.consecutive400 = 0;
        if (!this.rawLogged) {
          this.rawLogged = true;
          writeFileSync(join(this.outDir, `raw-first-llm-${this.model.id.replace(/[^\w.-]+/g, '_')}.json`), scrub(JSON.stringify({ status: res.status, mock: this.mock, request: body, response: json }, null, 2)));
        }
        const cost = costFromUsage(json.usage, this.model);
        // Without any usage at all, charge the worst case rather than nothing.
        const usd = json.usage ? cost.usd : wc.usd;
        if (cost.inputTokens) this.tokenRatio = Math.max(this.tokenRatio, cost.inputTokens / wc.inTok);
        this.budget.commit(usd);
        this.spentUsd += usd;
        const parsed = parseLlmAnswers(contentOf(json), JSON.parse(body.messages[1].content).questions);
        const bad = Object.values(parsed.answers).filter((a) => !a.ok).length;
        if (bad) this.errors += bad === Object.keys(parsed.answers).length ? 1 : 0;
        return {
          ok: bad < Object.keys(parsed.answers).length,
          answers: parsed.answers,
          usage: { inputTokens: cost.inputTokens, outputTokens: cost.outputTokens, costUsd: usd, costSource: json.usage ? cost.source : 'worst-case (no usage in reply)', estTokens: wc.inTok },
          model: json.model,
          attempts: attempt,
          ...(parsed.problem ? { problem: parsed.problem } : {}),
        };
      }
      const msg = scrub((json && (json.error?.message || json.message)) || text.slice(0, 300));
      lastErr = `HTTP ${res.status}: ${msg}`;
      if (res.status === 429 || res.status >= 500 || (res.ok && json?.error)) {
        if (attempt < this.maxAttempts) {
          this.retries += 1;
          const ra = res.headers.get('retry-after');
          await sleep(ra !== null && Number.isFinite(Number(ra)) ? Math.min(Number(ra), 60) * 1000 : this.#backoff(attempt));
          continue;
        }
        break;
      }
      if (res.status === 401 || res.status === 403) this.stop(`${lastErr} — refused (${this.mock ? 'mock' : mask(this.apiKey)})`);
      else if (res.status === 402) this.stop(`${lastErr} — out of credits`);
      else if (res.status === 404) this.stop(`${lastErr} — model ${this.model.id} not found or has no provider`);
      else if (res.status === 400 || res.status === 422) {
        if (++this.consecutive400 >= 3) this.stop(`${lastErr} — three 400s in a row: this model refuses the request shape`);
      }
      break;
    }
    this.errors += 1;
    return { ok: false, error: lastErr };
  }

  #backoff(attempt) {
    const base = this.baseDelayMs * 2 ** (attempt - 1);
    return Math.min(30000, base + Math.floor(Math.random() * base * 0.25));
  }

  /** Many calls, `concurrency` at a time; results in input order. */
  async runAll(calls, { label = '' } = {}) {
    const out = new Array(calls.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (next < calls.length) {
        const i = next++;
        const c = calls[i];
        out[i] = await this.ask(c.state, c.questions, { id: c.id, maxTokens: c.maxTokens });
        done += 1;
        if (done % 25 === 0 || done === calls.length) this.say(`  ${label} ${done}/${calls.length}  spent ${fmtUsd(this.spentUsd)}`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, calls.length) }, worker));
    return out;
  }
}
