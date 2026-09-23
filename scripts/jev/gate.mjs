#!/usr/bin/env node
/**
 * Jev checks every change — the CI gate.
 *
 *   node scripts/jev/gate.mjs [--base=REF | --base-dir=DIR] [--head=REF | --head-dir=DIR]
 *        [--full] [--dry] [--mock] [--mode=report|block] [--max-usd=0.03]
 *        [--out=jev-results] [--update-baseline] [--repo=DIR]
 *
 * What it does, cheapest first:
 *
 *   1. Works out what changed between a base commit and HEAD, by importing
 *      the app's own modules from both (snapshot.mjs) and comparing canonical
 *      JSON — not by diffing text. A recipe counts as changed for diets when
 *      its name, ingredients, method or tags change, or when the app's own
 *      meetsDiet() answer for it changes. If the diet rules themselves change
 *      (src/lib/diets.ts, src/lib/diet-audit.js, or the DIETS list) every
 *      recipe is re-checked. A translation counts as changed per language:
 *      the English moved (so all five may now be stale) or that language's
 *      text moved.
 *   2. Runs the free deterministic checks over EVERYTHING at HEAD, every
 *      time: {placeholder} mismatches, pork or alcohol words in any recipe's
 *      ingredients or method, and the app's own diet-tag audit.
 *   3. Asks Jev only about what changed, and only the questions that can add
 *      a caution: for a recipe, only the diets the app says it MEETS. The app's
 *      diet rules stay authoritative; Jev can only ever raise a flag.
 *
 * Decisions (thresholds in gate.config.json):
 *   BLOCK  app says a recipe meets a diet and Jev's P(yes) < 0.10
 *   BLOCK  a changed translation with Jev's P(same meaning) < 0.20
 *   BLOCK  any deterministic failure
 *   WARN   the unsure band above those thresholds
 *   ...unless the finding is in gate-baseline.json with a written reason.
 * In "report" mode (the default until a baseline has been reviewed) nothing
 * blocks: the summary says what WOULD have blocked. In "block" mode a block
 * exits 1.
 *
 * Never blocks on Jev being unavailable: a missing key (forks, the secret not
 * yet added) skips the Jev part with a notice; network errors and 5xx after
 * retries warn; 401/402 warn loudly. A flaky API must not stop a push.
 *
 * The key is read from OPENROUTER_API_KEY and nowhere else (see lib.mjs).
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Jev, MODEL, estimateTokens, fmtUsd, mask, mockFetch, noul, r3, usd } from './lib.mjs';
import { OTHER, canonical, hash } from './snapshot.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_CONFIG = {
  mode: 'report',
  max_usd: 0.03,
  max_usd_full: 0.1,
  diets: { block_below: 0.1, warn_below: 0.8 },
  translations: { block_below: 0.2, warn_below: 0.8 },
};

/** Files whose change means every recipe's diet answer may have moved. */
export const DIET_RULE_FILES = ['src/lib/diets.ts', 'src/lib/diet-audit.js'];

/* ── Config and baseline ─────────────────────────────────────────────────── */

export function loadConfig(path = join(HERE, 'gate.config.json')) {
  const raw = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const c = {
    ...DEFAULT_CONFIG,
    ...raw,
    diets: { ...DEFAULT_CONFIG.diets, ...(raw.diets || {}) },
    translations: { ...DEFAULT_CONFIG.translations, ...(raw.translations || {}) },
  };
  if (!['report', 'block'].includes(c.mode)) throw new Error(`gate.config.json: mode must be "report" or "block", not ${JSON.stringify(c.mode)}`);
  return c;
}

export function loadBaseline(path = join(HERE, 'gate-baseline.json')) {
  if (!existsSync(path)) return { exceptions: [] };
  const b = JSON.parse(readFileSync(path, 'utf8'));
  return { ...b, exceptions: Array.isArray(b.exceptions) ? b.exceptions : [] };
}

/** An exception only counts once a person has written why. */
export const reviewed = (e) => typeof e.reason === 'string' && e.reason.trim() !== '' && !/^todo\b/i.test(e.reason.trim());

/**
 * Mark findings a person has already accepted. An exception matches on the
 * finding id AND, when it carries one, the fingerprint of the content it was
 * accepted for — so editing the recipe or the translation puts it back in
 * front of a person instead of staying silently excused.
 */
export function applyBaseline(findings, baseline) {
  const ex = baseline.exceptions || [];
  const used = new Set();
  const unreviewed = [];
  const out = findings.map((f) => {
    const hit = ex.find((e) => e.id === f.id && (!e.fp || e.fp === f.fp));
    if (!hit) return f;
    if (!reviewed(hit)) {
      unreviewed.push(f.id);
      return { ...f, baseline: 'unreviewed' };
    }
    used.add(hit);
    return { ...f, severity: 'excepted', original: f.severity, reason: hit.reason };
  });
  // Reviewed entries nothing matched: the finding went away, or the content
  // it was accepted for changed. Listed so the file does not rot.
  const stale = ex.filter((e) => reviewed(e) && !used.has(e));
  return { findings: out, stale, unreviewed };
}

/** --update-baseline: add every current block that is not already covered, with a TODO reason. */
export function updateBaseline(baseline, findings, today = new Date().toISOString().slice(0, 10)) {
  const ex = [...(baseline.exceptions || [])];
  let added = 0;
  for (const f of findings) {
    if (f.severity !== 'block') continue;
    if (ex.some((e) => e.id === f.id && (!e.fp || e.fp === f.fp))) continue;
    ex.push({ id: f.id, fp: f.fp, kind: f.kind, subject: f.subject, detail: f.detail, ...(f.p != null ? { jev_p: f.p } : {}), reason: 'TODO: a person writes why this is acceptable, or fixes the data instead', added: today });
    added += 1;
  }
  return { baseline: { ...baseline, exceptions: ex }, added };
}

/* ── What changed ────────────────────────────────────────────────────────── */

/**
 * Which recipes and which (translation key, language) pairs to ask Jev about.
 * Pure: takes two snapshots (see snapshot.mjs) and returns the selection.
 * `base` null means there is no usable base — everything is selected.
 */
export function select(base, head, { dietRulesChanged = [], full = false } = {}) {
  const recipes = [];
  const unchangedForDiets = [];
  const changedNotDiet = [];
  for (const [id, h] of Object.entries(head.recipes)) {
    const b = base?.recipes?.[id];
    let reason = null;
    if (full) reason = 'full run';
    else if (!base) reason = 'no base to compare with';
    else if (dietRulesChanged.length) reason = `diet rules changed (${dietRulesChanged.join(', ')})`;
    else if (!b) reason = 'new recipe';
    else if (b.fp !== h.fp) reason = 'name, ingredients, method or tags changed';
    else if (canonical(b.meets) !== canonical(h.meets)) reason = "the app's diet answer changed";
    if (reason) recipes.push({ id, reason, diets: head.diets.filter((d) => h.meets[d]) });
    else if (b && b.all !== h.all) changedNotDiet.push(id);
    else unchangedForDiets.push(id);
  }
  const removedRecipes = base ? Object.keys(base.recipes).filter((id) => !head.recipes[id]) : [];

  const translations = [];
  for (const [k, row] of Object.entries(head.translations)) {
    const b = base?.translations?.[k];
    let langs;
    let reason;
    if (full) [langs, reason] = [OTHER, 'full run'];
    else if (!base) [langs, reason] = [OTHER, 'no base to compare with'];
    else if (!b) [langs, reason] = [OTHER, 'new key'];
    else if (b.en !== row.en) [langs, reason] = [OTHER, 'English changed'];
    else {
      langs = OTHER.filter((l) => b[l] !== row[l]);
      reason = 'translation changed';
    }
    if (langs.length) translations.push({ id: k, table: row.table, key: row.key, langs, reason });
  }
  const removedKeys = base ? Object.keys(base.translations).filter((k) => !head.translations[k]) : [];
  return { recipes, translations, removedRecipes, removedKeys, changedNotDiet, unchangedForDiets: unchangedForDiets.length, dietRulesChanged };
}

/** Which diet-rule inputs differ between two materialised trees. */
export function dietRuleChanges(baseRoot, headRoot, baseSnap, headSnap) {
  const out = DIET_RULE_FILES.filter((f) => {
    const a = join(baseRoot, f);
    const b = join(headRoot, f);
    return (existsSync(a) ? readFileSync(a, 'utf8') : null) !== (existsSync(b) ? readFileSync(b, 'utf8') : null);
  });
  if (baseSnap?.ok && headSnap?.ok && canonical(baseSnap.diets) !== canonical(headSnap.diets)) out.push('DIETS list in src/data/cookbook.js');
  return out;
}

/* ── The free checks ─────────────────────────────────────────────────────── */

/**
 * The pork and alcohol word lists, read out of src/data/nopork.test.ts at
 * run time so there is exactly one list. If that file ever stops parsing, the
 * copy below (identical today) is used and the run says so.
 */
const FALLBACK_RULES = {
  pork: /\b(pork|bacon|ham|gammon|lardons?|pancetta|guanciale|chorizo|prosciutto|salami|lard|pepperoni)\b/i,
  alcohol: /\b(red wine|white wine|rice wine|cooking wine|shaoxing|mirin|sake|beer|lager|ale|stout|cider|rum|brandy|vodka|whisky|whiskey|sherry|vermouth|marsala|kirsch)\b/i,
};

export function porkRules(root) {
  const p = join(root, 'src/data/nopork.test.ts');
  try {
    const src = readFileSync(p, 'utf8');
    const grab = (name) => {
      const m = src.match(new RegExp(`const ${name} =\\s*\\/((?:\\\\\\/|[^/\\n])+)\\/([a-z]*);`));
      return m ? new RegExp(m[1], m[2]) : null;
    };
    const pork = grab('PORK');
    const alcohol = grab('ALCOHOL');
    if (pork && alcohol) return { pork, alcohol, source: 'src/data/nopork.test.ts' };
  } catch {
    /* fall through */
  }
  return { ...FALLBACK_RULES, source: 'built-in copy (could not read src/data/nopork.test.ts)' };
}

const PH = /\{[A-Za-z0-9_]+\}/g;

/**
 * Every deterministic finding at HEAD. `placeholderMismatches` is the one
 * check-translations.mjs already uses, passed in so this stays pure.
 */
export function deterministic(head, { rules, placeholderMismatches }) {
  const out = [];
  if (!head.ok) {
    out.push({ id: 'snapshot:head', kind: 'snapshot', severity: 'block', subject: 'HEAD', detail: `could not load the app's data at HEAD: ${String(head.error).split('\n')[0]}`, fp: 'x' });
    return out;
  }
  const offending = (text) => (/vinegar/i.test(text) ? null : rules.pork.test(text) ? 'pork' : rules.alcohol.test(text) ? 'alcohol' : null);
  for (const [id, r] of Object.entries(head.recipes)) {
    for (const it of r.view.items) {
      const w = offending(it.n);
      if (w) out.push({ id: `pork-alcohol:${id}:item:${it.n}`, kind: 'pork-alcohol', severity: 'block', subject: `${id} ingredient`, recipe: id, detail: `"${it.n}" is ${w}`, fp: hash(it.n) });
    }
    r.view.method.forEach((s, i) => {
      const text = `${s.text} ${s.tip ?? ''}`;
      const w = offending(text);
      if (w) out.push({ id: `pork-alcohol:${id}:step:${i + 1}`, kind: 'pork-alcohol', severity: 'block', subject: `${id} step ${i + 1}`, recipe: id, detail: `method mentions ${w}: "${(text.match(w === 'pork' ? rules.pork : rules.alcohol) || [''])[0]}"`, fp: hash(text) });
    });
    for (const [tag, why] of Object.entries(r.contradictions || {})) {
      out.push({ id: `diet-tag:${id}:${tag}`, kind: 'diet-tag', severity: 'block', subject: `${id} / ${tag}`, recipe: id, diet: tag, detail: `the app's own audit: tag contradicted by ${why.join(', ')}`, fp: r.fp });
    }
  }
  for (const m of placeholderMismatches(Object.values(head.translations))) {
    out.push({
      id: `placeholder:${m.table}.${m.key}:${m.lang}`,
      kind: 'placeholder',
      severity: 'block',
      subject: `${m.table}.${m.key}`,
      lang: m.lang,
      detail: `${m.missing.length ? 'missing ' + m.missing.join(' ') : ''}${m.missing.length && m.extra.length ? '; ' : ''}${m.extra.length ? 'extra ' + m.extra.join(' ') : ''}`,
      fp: hash({ en: head.translations[`${m.table}.${m.key}`].en, t: m.text }),
    });
  }
  return out;
}

/* ── Asking Jev ──────────────────────────────────────────────────────────── */

/**
 * The calls for a selection, diets first — they are the safety half, so if the
 * spend guard ever cuts a run short it cuts translations, not diets.
 * `defs`: { DEFS, stateOf } from check-diets.mjs, { question, skipReason } from
 * check-translations.mjs — the existing checks' own wording, reused verbatim.
 */
export function buildCalls(selection, head, defs) {
  const calls = [];
  const notes = [];
  for (const s of selection.recipes) {
    const diets = s.diets.filter((d) => defs.DEFS[d]);
    const nodef = s.diets.filter((d) => !defs.DEFS[d]);
    if (nodef.length) notes.push(`${s.id}: no Jev wording for ${nodef.join(', ')} — add it to DEFS in check-diets.mjs`);
    if (!diets.length) continue; // the app claims no diet for it: nothing Jev could add a caution to
    calls.push({
      id: `diet:${s.id}`,
      kind: 'diet',
      state: defs.stateOf(head.recipes[s.id].view),
      questions: Object.fromEntries(diets.map((d) => [d, noul(defs.DEFS[d].q, { true: defs.DEFS[d].t, false: defs.DEFS[d].f })])),
      meta: { recipe: s.id, reason: s.reason },
    });
  }
  let skipped = 0;
  for (const s of selection.translations) {
    const row = head.translations[s.id];
    if (defs.skipReason(row)) {
      skipped += 1;
      continue;
    }
    calls.push({
      id: `translation:${s.id}`,
      kind: 'translation',
      state: { key: s.id, english: row.en, ...Object.fromEntries(s.langs.map((l) => [l, row[l]])) },
      questions: Object.fromEntries(s.langs.map((l) => [`${l}_faithful`, defs.question(l)])),
      meta: { key: s.id, langs: s.langs, reason: s.reason },
    });
  }
  if (skipped) notes.push(`${skipped} selected key(s) not asked: identical in every language or no words (same rule as check-translations.mjs)`);
  return { calls, notes };
}

/** Turn Jev's answers into findings. Answers above warn_below are agreement and produce nothing. */
export function judge(calls, results, config, head) {
  const findings = [];
  const unanswered = [];
  let agreed = 0;
  calls.forEach((c, i) => {
    const res = results[i];
    for (const qn of Object.keys(c.questions)) {
      const a = res?.answers?.[qn];
      if (!res || res.skipped || res.error || !a?.ok) {
        unanswered.push({ call: c.id, question: qn, why: res?.reason || res?.error || a?.problem || 'no result' });
        continue;
      }
      const p = a.value;
      if (c.kind === 'diet') {
        const t = config.diets;
        const sev = p < t.block_below ? 'block' : p < t.warn_below ? 'warn' : null;
        if (!sev) {
          agreed += 1;
          continue;
        }
        findings.push({
          id: `diet:${c.meta.recipe}:${qn}`,
          kind: 'diet',
          severity: sev,
          subject: `${c.meta.recipe} / ${qn}`,
          recipe: c.meta.recipe,
          diet: qn,
          p,
          detail: `the app says ${head.recipes[c.meta.recipe].view.name} meets ${qn}; Jev P(yes) ${r3(p)}`,
          fp: head.recipes[c.meta.recipe].fp,
        });
      } else {
        const t = config.translations;
        const lang = qn.replace(/_faithful$/, '');
        const sev = p < t.block_below ? 'block' : p < t.warn_below ? 'warn' : null;
        if (!sev) {
          agreed += 1;
          continue;
        }
        const row = head.translations[c.meta.key];
        findings.push({
          id: `translation:${c.meta.key}:${lang}`,
          kind: 'translation',
          severity: sev,
          subject: c.meta.key,
          lang,
          p,
          detail: `EN "${row.en.slice(0, 80)}" / ${lang.toUpperCase()} "${row[lang].slice(0, 80)}"`,
          fp: hash({ en: row.en, t: row[lang] }),
        });
      }
    }
  });
  return { findings, unanswered, agreed };
}

/** What a stop reason means for the person reading the summary. */
export function classifyStop(stopped) {
  if (!stopped) return null;
  if (/HTTP 40[13]/.test(stopped) && !/network in between/.test(stopped)) return { level: 'loud', text: `Jev refused the key — ${stopped}. Rotate or re-add the OPENROUTER_API_KEY secret. Nothing was blocked.` };
  if (/HTTP 402/.test(stopped)) return { level: 'loud', text: `Jev says the key is out of credits — ${stopped}. Top it up on openrouter.ai. Nothing was blocked.` };
  if (/spend guard|reported spend/.test(stopped)) return { level: 'warn', text: `Spend cap reached — ${stopped}. The rest were not asked; nothing was blocked for it.` };
  return { level: 'warn', text: `Jev was unreachable or failing — ${stopped}. Nothing was blocked for it.` };
}

/* ── The whole gate, given two snapshots ─────────────────────────────────── */

/**
 * Run the gate on already-computed snapshots. Everything the CLI does after
 * git, and everything the tests exercise.
 *
 * @param {object} o
 * @param {object|null} o.base   base snapshot (null: no base, check everything)
 * @param {object} o.head        head snapshot
 * @param {string[]} [o.dietRulesChanged]
 * @param {boolean} [o.full] [o.dry] [o.mock]
 * @param {object} o.config      loadConfig()
 * @param {object} o.baseline    loadBaseline()
 * @param {number} o.maxUsd
 * @param {object} o.env         process.env or a stand-in
 * @param {function} [o.fetchImpl]
 * @param {object} [o.jevOptions] passed to new Jev() (tests shorten backoff)
 * @param {string} o.outDir
 * @param {object} o.defs        { DEFS, stateOf, question, skipReason, placeholderMismatches }
 * @param {object} o.rules       porkRules()
 */
export async function runGate(o) {
  const say = o.say || ((s) => console.log(s));
  const notices = [];
  const head = o.head;
  const base = o.base && o.base.ok ? o.base : null;
  if (o.base && !o.base.ok) notices.push({ level: 'warn', text: `Could not load the base commit's data (${String(o.base.error).split('\n')[0]}); checking everything instead, within the spend cap.` });

  const det = deterministic(head, { rules: o.rules, placeholderMismatches: o.defs.placeholderMismatches });
  if (o.rules.source && !o.rules.source.startsWith('src/')) notices.push({ level: 'warn', text: `Pork/alcohol word list: ${o.rules.source}.` });

  let selection = { recipes: [], translations: [], removedRecipes: [], removedKeys: [], changedNotDiet: [], unchangedForDiets: 0, dietRulesChanged: [] };
  let calls = [];
  if (head.ok) {
    selection = select(base, head, { dietRulesChanged: o.dietRulesChanged || [], full: o.full });
    const built = buildCalls(selection, head, o.defs);
    calls = built.calls;
    for (const n of built.notes) notices.push({ level: 'info', text: n });
  }

  const bodies = calls.map((c) => ({ model: MODEL, state: c.state, questions: c.questions }));
  const estTokens = bodies.reduce((a, b) => a + estimateTokens(b), 0);
  const questions = bodies.reduce((a, b) => a + Object.keys(b.questions).length, 0);
  const cost = { calls: calls.length, questions, est_tokens: estTokens, est_usd: usd(estTokens), max_usd: o.maxUsd, spent_usd: 0, requests: 0, retries: 0 };

  let jevFindings = [];
  let unanswered = [];
  let agreed = 0;
  let jevStatus;
  const key = o.env.OPENROUTER_API_KEY;
  if (!calls.length) jevStatus = 'nothing to ask';
  else if (o.dry) {
    jevStatus = 'dry run — no calls made';
    const dir = join(o.outDir, 'gate-samples');
    mkdirSync(dir, { recursive: true });
    bodies.slice(0, 3).forEach((b, i) => writeFileSync(join(dir, `${calls[i].id.replace(/[^A-Za-z0-9_.-]+/g, '_')}.json`), JSON.stringify(b, null, 2)));
  } else if (!o.mock && !key) {
    jevStatus = 'skipped — no key';
    notices.push({ level: 'notice', text: `OPENROUTER_API_KEY is not set (a fork, or the secret has not been added yet), so the ${calls.length} Jev call(s) were skipped. The free checks still ran. Add the repository secret to turn Jev on — see scripts/jev/README.md.` });
  } else {
    // lib.mjs retries each call up to five times with backoff and stops after
    // three calls in a row cannot connect — but an API answering 5xx forever
    // would still cost every remaining call its full backoff, long enough to
    // hit the job's timeout and turn a flaky API into a red build. So the gate
    // stops the client itself after FAIL_LIMIT failed attempts in a row.
    const FAIL_LIMIT = o.failLimit ?? 10;
    const inner = o.fetchImpl || (o.mock ? mockFetch() : globalThis.fetch);
    let bad = 0;
    let client;
    const giveUp = (what) => {
      if (++bad >= FAIL_LIMIT) client.stop(`${bad} attempts in a row failed (${what})`);
    };
    const guarded = async (url, init) => {
      let res;
      try {
        res = await inner(url, init);
      } catch (e) {
        giveUp(`no connection: ${e?.cause?.code || e?.message || e}`);
        throw e;
      }
      if (res.status === 429 || res.status >= 500) giveUp(`HTTP ${res.status}`);
      else bad = 0;
      return res;
    };
    client = new Jev({
      apiKey: key,
      mock: !!o.mock,
      fetchImpl: guarded,
      maxUsd: o.maxUsd,
      concurrency: 4,
      outDir: o.outDir,
      say: (s) => say(s),
      ...(o.jevOptions || {}),
    });
    say(`Asking Jev (${o.mock ? 'MOCK — offline fake' : `${MODEL}, key ${mask(key)}`}): ${calls.length} call(s), ${questions} question(s), est. ${fmtUsd(cost.est_usd)}, cap ${fmtUsd(o.maxUsd)}`);
    const results = await client.runAll(calls, { label: 'gate' });
    ({ findings: jevFindings, unanswered, agreed } = judge(calls, results, o.config, head));
    Object.assign(cost, { spent_usd: client.spentUsd, requests: client.calls, retries: client.retries });
    const stop = classifyStop(client.stopped);
    if (stop) notices.push(stop);
    if (unanswered.length && !stop) notices.push({ level: 'warn', text: `${unanswered.length} Jev answer(s) missing or unreadable (first: ${unanswered[0].call} ${unanswered[0].question}: ${unanswered[0].why}). Nothing was blocked for them.` });
    jevStatus = o.mock ? 'mock' : 'live';
  }

  const applied = applyBaseline([...det, ...jevFindings], o.baseline);
  const findings = applied.findings;
  if (applied.unreviewed.length) notices.push({ level: 'warn', text: `${applied.unreviewed.length} finding(s) match baseline entries that still say TODO — they count until a person writes a reason.` });
  const blocks = findings.filter((f) => f.severity === 'block');
  const warns = findings.filter((f) => f.severity === 'warn');
  const excepted = findings.filter((f) => f.severity === 'excepted');
  const mode = o.config.mode;
  const exitCode = mode === 'block' && blocks.length ? 1 : 0;
  const jevMissing = !o.dry && calls.length > 0 && (jevStatus === 'skipped — no key' || unanswered.length > 0);
  const status =
    (blocks.length ? (mode === 'block' ? 'BLOCKED' : 'WOULD BLOCK (report mode)') : warns.length ? 'PASS WITH WARNINGS' : 'PASS') +
    (jevMissing ? (jevStatus === 'skipped — no key' ? ' (free checks only: no Jev key)' : ` (Jev left ${unanswered.length} question(s) unanswered)`) : '');

  return {
    status,
    exitCode,
    mode,
    jev: jevStatus,
    mock: !!o.mock,
    dry: !!o.dry,
    base: o.baseLabel || (base ? 'base' : 'none'),
    head: o.headLabel || 'HEAD',
    selection: {
      recipes: selection.recipes,
      translations: selection.translations,
      removed_recipes: selection.removedRecipes,
      removed_keys: selection.removedKeys,
      changed_not_diet: selection.changedNotDiet,
      diet_rules_changed: selection.dietRulesChanged,
    },
    totals: head.ok ? { recipes: Object.keys(head.recipes).length, keys: Object.keys(head.translations).length } : { recipes: 0, keys: 0 },
    deterministic_checked: head.ok,
    cost,
    agreed,
    unanswered,
    notices,
    findings,
    counts: { block: blocks.length, warn: warns.length, excepted: excepted.length, deterministic: det.length },
    stale_baseline: applied.stale,
  };
}

/* ── The summary people read ─────────────────────────────────────────────── */

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const KIND = { diet: 'Jev: diet', translation: 'Jev: translation', placeholder: 'placeholder', 'pork-alcohol': 'pork/alcohol word', 'diet-tag': 'diet tag audit', snapshot: 'app data' };

export function renderSummary(r) {
  const md = [];
  md.push(`## Jev gate: ${r.status}\n`);
  md.push(
    `Mode **${r.mode}**${r.mode === 'report' ? ' (never blocks; shows what would)' : ''} · base ${r.base} → head ${r.head} · Jev: ${r.jev}${r.mock ? ' — **MOCK answers, meaningless**' : ''}\n`,
  );
  for (const n of r.notices.filter((x) => x.level === 'loud')) md.push(`> **WARNING:** ${cell(n.text)}\n`);
  for (const n of r.notices.filter((x) => x.level !== 'loud')) md.push(`> ${n.level === 'warn' ? '**Warning:** ' : n.level === 'notice' ? '**Notice:** ' : ''}${cell(n.text)}\n`);

  const s = r.selection;
  const dietQs = s.recipes.reduce((a, x) => a + x.diets.length, 0);
  const trQs = s.translations.reduce((a, x) => a + x.langs.length, 0);
  const why = (xs) => {
    const c = {};
    for (const x of xs) c[x.reason] = (c[x.reason] || 0) + 1;
    return Object.entries(c).map(([k, v]) => `${k}: ${v}`).join('; ') || 'nothing changed';
  };
  md.push('### What was checked\n');
  md.push('| check | scope | why | paid? |');
  md.push('|---|---|---|---|');
  md.push(
    `| Recipes vs diets (Jev) | ${s.recipes.length} of ${r.totals.recipes} recipes, ${dietQs} diet claim(s) the app makes about them${s.removed_recipes.length ? `; removed: ${cell(s.removed_recipes.join(', '))}` : ''} | ${cell(why(s.recipes))}${s.changed_not_diet.length ? `; ${s.changed_not_diet.length} other recipe edit(s) (price, photo, nutrition…) not diet-relevant` : ''} | Jev |`,
  );
  md.push(`| Translations (Jev) | ${s.translations.length} of ${r.totals.keys} keys, ${trQs} (key, language) pair(s)${s.removed_keys.length ? `; ${s.removed_keys.length} key(s) removed` : ''} | ${cell(why(s.translations))} | Jev |`);
  md.push(`| Placeholders | all ${r.totals.keys} keys × 5 languages | every run | free |`);
  md.push(`| Pork / alcohol words | all ${r.totals.recipes} recipes, ingredients and method | every run | free |`);
  md.push(`| Diet tag audit (app's own) | all ${r.totals.recipes} recipes | every run | free |`);
  md.push('');
  const listed = [...s.recipes.map((x) => `- recipe \`${x.id}\` — ${x.reason}; app claims: ${x.diets.join(', ') || 'no diet (nothing to ask)'}`), ...s.translations.map((x) => `- key \`${x.id}\` — ${x.reason}: ${x.langs.join(', ')}`)];
  if (listed.length && listed.length <= 40) md.push(`<details><summary>Selected for Jev (${listed.length})</summary>\n\n${listed.join('\n')}\n\n</details>\n`);
  md.push(
    `**Cost:** ${r.cost.calls} Jev call(s), ${r.cost.questions} question(s), ~${r.cost.est_tokens.toLocaleString('en')} input tokens est. ≈ ${fmtUsd(r.cost.est_usd)}` +
      (r.jev === 'live' || r.jev === 'mock' ? `; spent ${fmtUsd(r.cost.spent_usd)}${r.mock ? ' (mock, nothing real)' : ''}, ${r.cost.requests} request(s), ${r.cost.retries} retr${r.cost.retries === 1 ? 'y' : 'ies'}` : '') +
      `; cap ${fmtUsd(r.cost.max_usd)}. ${r.agreed ? `${r.agreed} answer(s) agreed with the app.` : ''}\n`,
  );

  const table = (title, xs) => {
    md.push(`### ${title} (${xs.length})\n`);
    if (!xs.length) return md.push('None.\n');
    md.push('| check | subject | lang | Jev P(yes) | detail |');
    md.push('|---|---|---|---|---|');
    for (const f of xs.slice(0, 60)) md.push(`| ${KIND[f.kind] || f.kind} | ${cell(f.subject)} | ${f.lang || ''} | ${f.p != null ? r3(f.p) : '—'} | <span dir="auto">${cell(f.detail)}</span>${f.reason ? ` — accepted: ${cell(f.reason)}` : ''} |`);
    if (xs.length > 60) md.push(`\n…and ${xs.length - 60} more in gate.json.`);
    md.push('');
  };
  const byP = (a, b) => (a.p ?? -1) - (b.p ?? -1);
  table(r.mode === 'block' ? 'Blocks' : 'Would block', r.findings.filter((f) => f.severity === 'block').sort(byP));
  table('Warnings', r.findings.filter((f) => f.severity === 'warn').sort(byP));
  const ex = r.findings.filter((f) => f.severity === 'excepted');
  if (ex.length) table('Accepted in gate-baseline.json', ex);
  if (r.stale_baseline.length) {
    md.push(`### Baseline entries that no longer match (${r.stale_baseline.length})\n`);
    md.push('The finding is gone or its content changed. Remove the entry, or re-accept the new content.\n');
    for (const e of r.stale_baseline.slice(0, 30)) md.push(`- \`${cell(e.id)}\` — ${cell(e.reason)}`);
    md.push('');
  }
  md.push('Jev is a second opinion, not an authority: the app\'s diet rules decide what is shown, and Jev can only add a caution. Thresholds live in `scripts/jev/gate.config.json`; accepted exceptions in `scripts/jev/gate-baseline.json`.\n');
  return md.join('\n');
}

/* ── Git and the CLI ─────────────────────────────────────────────────────── */

const git = (repo, args, opts = {}) => spawnSync('git', args, { cwd: repo, encoding: opts.encoding ?? 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
const isCommit = (repo, ref) => !!ref && git(repo, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status === 0;
const short = (repo, ref) => (git(repo, ['rev-parse', '--short', `${ref}^{commit}`]).stdout || '').trim() || ref;

/**
 * The commit to compare with, and how it was chosen. Refs are passed to git as
 * separate argv entries, never through a shell.
 */
export function resolveBase(repo, env, explicit) {
  const zero = /^0+$/;
  const tries = [];
  if (explicit) tries.push([explicit, '--base']);
  if (env.GATE_BASE) tries.push([env.GATE_BASE, 'GATE_BASE']);
  if (env.GITHUB_BASE_REF) {
    const mb = git(repo, ['merge-base', 'HEAD', `origin/${env.GITHUB_BASE_REF}`]);
    if (mb.status === 0) tries.push([mb.stdout.trim(), `merge base with origin/${env.GITHUB_BASE_REF} (pull request)`]);
  }
  if (env.GATE_BEFORE && !zero.test(env.GATE_BEFORE)) tries.push([env.GATE_BEFORE, 'the commit before this push']);
  if (env.GATE_DEFAULT_BRANCH) {
    const mb = git(repo, ['merge-base', 'HEAD', `origin/${env.GATE_DEFAULT_BRANCH}`]);
    const headSha = git(repo, ['rev-parse', 'HEAD']).stdout?.trim();
    if (mb.status === 0 && mb.stdout.trim() !== headSha) tries.push([mb.stdout.trim(), `merge base with origin/${env.GATE_DEFAULT_BRANCH} (new branch)`]);
  }
  tries.push(['HEAD~1', 'the previous commit']);
  for (const [ref, how] of tries) if (isCommit(repo, ref)) return { ref, how, label: `\`${short(repo, ref)}\` (${how})` };
  return null;
}

/** `git archive <ref> src` into a fresh directory, plus the package.json that makes .js files ES modules. */
export function materialize(repo, ref, dir) {
  mkdirSync(dir, { recursive: true });
  const a = git(repo, ['archive', '--format=tar', ref, 'src'], { encoding: 'buffer' });
  if (a.status !== 0) throw new Error(`git archive ${ref} failed: ${String(a.stderr).trim()}`);
  const t = spawnSync('tar', ['-x', '-C', dir], { input: a.stdout, maxBuffer: 1024 * 1024 });
  if (t.status !== 0) throw new Error(`tar failed: ${String(t.stderr).trim()}`);
  writeFileSync(join(dir, 'package.json'), '{ "type": "module" }\n');
  return dir;
}

/** The app's data at <root>, via snapshot.mjs in its own process. */
export function takeSnapshot(root) {
  const r = spawnSync(process.execPath, [join(HERE, 'snapshot.mjs'), root], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  try {
    return JSON.parse(r.stdout);
  } catch {
    return { ok: false, error: (r.stderr || r.stdout || `exit ${r.status}`).slice(0, 2000) };
  }
}

/** The existing checks' own wording and helpers, loaded only when needed. */
export async function loadDefs() {
  const d = await import('./check-diets.mjs');
  const t = await import('./check-translations.mjs');
  return { DEFS: d.DEFS, stateOf: d.stateOf, question: t.question, skipReason: t.skipReason, placeholderMismatches: t.placeholderMismatches };
}

const escData = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escProp = (s) => escData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');

async function main(argv) {
  const flag = (n) => argv.includes(`--${n}`);
  const opt = (n, d) => {
    const a = argv.find((x) => x.startsWith(`--${n}=`));
    return a ? a.slice(n.length + 3) : d;
  };
  if (flag('help')) {
    console.log('usage: node scripts/jev/gate.mjs [--base=REF | --base-dir=DIR] [--head=REF | --head-dir=DIR] [--full] [--dry] [--mock] [--mode=report|block] [--max-usd=N] [--out=jev-results] [--update-baseline] [--repo=DIR]');
    return 0;
  }
  const config = loadConfig(opt('config', join(HERE, 'gate.config.json')));
  if (opt('mode')) {
    if (!['report', 'block'].includes(opt('mode'))) return console.error('--mode must be report or block'), 2;
    config.mode = opt('mode');
  }
  const baselinePath = opt('baseline', join(HERE, 'gate-baseline.json'));
  const baseline = loadBaseline(baselinePath);
  const full = flag('full');
  const maxUsd = Number(opt('max-usd', String(full ? config.max_usd_full : config.max_usd)));
  if (!Number.isFinite(maxUsd) || maxUsd <= 0) return console.error('--max-usd must be a positive number'), 2;
  if (maxUsd > 1) console.warn(`warning: --max-usd ${maxUsd} is above the key's $1 hard cap`);
  const outDir = resolve(opt('out', 'jev-results'));
  mkdirSync(outDir, { recursive: true });
  const repo = resolve(opt('repo', (git(process.cwd(), ['rev-parse', '--show-toplevel']).stdout || '').trim() || resolve(HERE, '../..')));
  const tmp = mkdtempSync(join(tmpdir(), 'jev-gate-'));

  try {
    let headRoot = repo;
    let headLabel = 'working tree';
    if (opt('head-dir')) {
      headRoot = resolve(opt('head-dir'));
      headLabel = `directory ${opt('head-dir')}`;
    } else if (opt('head')) {
      if (!isCommit(repo, opt('head'))) return console.error(`--head: not a commit: ${opt('head')}`), 2;
      headRoot = materialize(repo, opt('head'), join(tmp, 'head'));
      headLabel = `\`${short(repo, opt('head'))}\``;
    } else {
      const sha = (git(repo, ['rev-parse', '--short', 'HEAD']).stdout || '').trim();
      const dirty = (git(repo, ['status', '--porcelain', '--', 'src']).stdout || '').trim();
      headLabel = sha ? `\`${sha}\`${dirty ? ' + uncommitted changes' : ''}` : 'working tree';
    }

    let baseRoot = null;
    let baseError = null;
    let baseLabel = 'none';
    if (full) baseLabel = 'none (full run)';
    else if (opt('base-dir')) {
      baseRoot = resolve(opt('base-dir'));
      baseLabel = `directory ${opt('base-dir')}`;
    } else {
      const b = resolveBase(repo, process.env, opt('base'));
      if (b) {
        baseLabel = b.label;
        try {
          baseRoot = materialize(repo, b.ref, join(tmp, 'base'));
        } catch (e) {
          baseError = String(e?.message || e);
        }
      } else baseLabel = 'none (no earlier commit found — checking everything)';
    }

    console.log(`Jev gate — mode ${config.mode}${flag('dry') ? ', DRY' : ''}${flag('mock') ? ', MOCK' : ''}; base ${baseLabel.replace(/`/g, '')} → head ${headLabel.replace(/`/g, '')}`);
    const head = takeSnapshot(headRoot);
    const base = baseRoot ? takeSnapshot(baseRoot) : baseError ? { ok: false, error: baseError } : null;
    const dietRulesChanged = baseRoot && base?.ok ? dietRuleChanges(baseRoot, headRoot, base, head) : [];
    const defs = head.ok ? await loadDefs() : { DEFS: {}, stateOf: (x) => x, question: () => ({}), skipReason: () => null, placeholderMismatches: () => [] };

    const report = await runGate({
      base,
      head,
      dietRulesChanged,
      full,
      dry: flag('dry'),
      mock: flag('mock'),
      config,
      baseline,
      maxUsd,
      env: process.env,
      outDir,
      defs,
      rules: porkRules(headRoot),
      baseLabel,
      headLabel,
    });

    const md = renderSummary(report);
    writeFileSync(join(outDir, 'gate.json'), JSON.stringify(report, null, 2));
    writeFileSync(join(outDir, 'gate-summary.md'), md);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const n of report.notices.filter((x) => x.level === 'loud')) console.log(`::warning title=${escProp('Jev key problem')}::${escData(n.text)}`);
      for (const f of report.findings.filter((x) => x.severity === 'block').slice(0, 10)) console.log(`::${config.mode === 'block' ? 'error' : 'warning'} title=${escProp(`Jev gate: ${KIND[f.kind] || f.kind}`)}::${escData(`${f.subject}${f.lang ? ' [' + f.lang + ']' : ''}: ${f.detail}`)}`);
    }

    // The console gets the same facts, compactly.
    console.log(`\n${report.status}`);
    console.log(`  checked: ${report.selection.recipes.length} recipe(s) and ${report.selection.translations.length} translation key(s) with Jev (${report.jev}); free checks over ${report.totals.recipes} recipes and ${report.totals.keys} keys`);
    console.log(`  cost: ${report.cost.calls} call(s), ${report.cost.questions} question(s), ~${report.cost.est_tokens} tokens est. ≈ ${fmtUsd(report.cost.est_usd)}; spent ${fmtUsd(report.cost.spent_usd)}; cap ${fmtUsd(maxUsd)}`);
    console.log(`  findings: ${report.counts.block} block, ${report.counts.warn} warn, ${report.counts.excepted} accepted in baseline`);
    for (const n of report.notices) console.log(`  ${n.level.toUpperCase()}: ${n.text}`);
    for (const f of report.findings.filter((x) => x.severity !== 'excepted').slice(0, 20)) console.log(`  ${f.severity.toUpperCase().padEnd(5)} ${(KIND[f.kind] || f.kind).padEnd(16)} ${f.subject}${f.lang ? ' [' + f.lang + ']' : ''}${f.p != null ? '  P(yes)=' + r3(f.p) : ''}  ${f.detail}`);
    console.log(`  wrote ${join(outDir, 'gate-summary.md')} and gate.json`);

    if (flag('update-baseline')) {
      // Mock answers mean nothing, so a mock run only ever records the
      // deterministic findings.
      const eligible = flag('mock') ? report.findings.filter((f) => f.kind !== 'diet' && f.kind !== 'translation') : report.findings;
      const { baseline: nb, added } = updateBaseline(baseline, eligible);
      writeFileSync(baselinePath, JSON.stringify(nb, null, 2) + '\n');
      console.log(`  --update-baseline: added ${added} entr${added === 1 ? 'y' : 'ies'} to ${baselinePath} with a TODO reason. They do not count until a person replaces TODO with why the finding is acceptable.`);
    }
    return report.exitCode;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
      console.error(`gate crashed: ${e?.stack || e}`);
      process.exitCode = 2;
    },
  );
}
