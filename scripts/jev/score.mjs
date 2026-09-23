/**
 * Pure scoring for bench.mjs and usecases.mjs. No I/O, no app imports, so
 * bench.test.mjs can test every number a report prints.
 *
 * Conventions, the same everywhere:
 *   - a noul is read as yes when p >= 0.5;
 *   - "confident and wrong" is the dangerous case: a noul outside 0.1..0.9 on
 *     the wrong side, or a choice given with confidence > 0.9 that is wrong;
 *   - gold may be `null`/`undefined`, meaning "no single right answer" — those
 *     rows are counted as n/a, never as right or wrong;
 *   - a choice gold may be an array of acceptable labels.
 */

export const yes = (p) => p >= 0.5;

/** Score one noul answer against a boolean gold. */
export function scoreNoul(p, gold) {
  if (gold == null) return { status: 'n/a' };
  if (typeof p !== 'number' || !Number.isFinite(p)) return { status: 'error' };
  const right = yes(p) === gold;
  const confidentWrong = !right && (gold ? p < 0.1 : p > 0.9);
  return { status: right ? 'right' : 'wrong', confidentWrong };
}

/** Score one choice answer. `gold` is a label, an array of labels, or null. */
export function scoreChoice(label, gold, confidence) {
  if (gold == null || (Array.isArray(gold) && !gold.length)) return { status: 'n/a' };
  if (typeof label !== 'string') return { status: 'error' };
  const ok = Array.isArray(gold) ? gold.includes(label) : label === gold;
  return { status: ok ? 'right' : 'wrong', confidentWrong: !ok && typeof confidence === 'number' && confidence > 0.9 };
}

/** Score a 0..k score against an integer gold level: right when it rounds to it. */
export function scoreLevel(v, gold) {
  if (gold == null) return { status: 'n/a' };
  if (typeof v !== 'number' || !Number.isFinite(v)) return { status: 'error' };
  const right = Math.round(v) === gold;
  return { status: right ? 'right' : 'wrong', confidentWrong: Math.abs(v - gold) >= 2, absErr: Math.abs(v - gold) };
}

/**
 * A question that was never asked because the spend guard stopped the run (or
 * the model ran only its gold subset). Not an answer, so neither right nor
 * wrong: it must not drag accuracy down to 0% for a job that never ran.
 */
export const NOT_RUN = Object.freeze({ status: 'not_run' });
/** `s`, unless the call behind it was skipped: then NOT_RUN (n/a stays n/a). */
export const unlessSkipped = (res, s) => (res?.skipped && s.status !== 'n/a' ? NOT_RUN : s);

/** Sum up a list of {status, confidentWrong}. accuracy is over scored rows only. */
export function tally(scores) {
  const t = { right: 0, wrong: 0, error: 0, na: 0, notRun: 0, confidentWrong: 0, n: scores.length };
  for (const s of scores) {
    if (s.status === 'right') t.right++;
    else if (s.status === 'wrong') t.wrong++;
    else if (s.status === 'error') t.error++;
    else if (s.status === 'not_run') t.notRun++;
    else t.na++;
    if (s.confidentWrong) t.confidentWrong++;
  }
  // Errors count against accuracy: an unreadable answer is not a right one.
  // Questions never asked (not_run) do not.
  const scored = t.right + t.wrong + t.error;
  t.scored = scored;
  t.accuracy = scored ? t.right / scored : null;
  return t;
}

/** The q-th quantile (0..1) of a list of numbers, linear interpolation. null if empty. */
export function quantile(xs, q) {
  const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}
export const median = (xs) => quantile(xs, 0.5);
export const p90 = (xs) => quantile(xs, 0.9);

/**
 * How often two runs of the same noul questions land on different sides of
 * 0.5. Pairs where either side is missing are left out and counted.
 */
export function flipRate(a, b) {
  let flips = 0;
  let pairs = 0;
  let missing = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (typeof a[i] !== 'number' || typeof b[i] !== 'number') {
      missing++;
      continue;
    }
    pairs++;
    if (yes(a[i]) !== yes(b[i])) flips++;
  }
  return { flips, pairs, missing, rate: pairs ? flips / pairs : null };
}

/** Agreement between two lists of nouls (on the 0.5 side), or noul vs booleans. */
export function agreement(ps, truths) {
  let agree = 0;
  let n = 0;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const t = truths[i];
    if (typeof p !== 'number' || t == null) continue;
    const tb = typeof t === 'number' ? yes(t) : !!t;
    n++;
    if (yes(p) === tb) agree++;
  }
  return { agree, n, rate: n ? agree / n : null };
}

/** Cost per 1,000 of something, from a total and a count. */
export const per1000 = (usd, count) => (count ? (usd / count) * 1000 : null);

/**
 * The verdict for a product job. Deliberately strict: a job that can be
 * confidently wrong about somebody's diet does not get "use it".
 */
export function verdictFor({ accuracy, confidentWrong, scored, notRun = 0 }, { mock = false, useAt = 0.9, maybeAt = 0.75 } = {}) {
  if (mock) return 'n/a (mock run — answers are fake)';
  if (!scored && notRun) return 'not run (the spend guard stopped before this job)';
  if (!scored || accuracy == null) return "can't tell (nothing was scored)";
  const partial = notRun ? ` (partial: ${notRun} scored questions not run)` : '';
  if (accuracy >= useAt && confidentWrong === 0) return 'use it' + partial;
  if (accuracy >= maybeAt) return (confidentWrong ? 'maybe — only with a human or a rule behind it' : 'maybe — as a suggestion, with a fallback') + partial;
  return "don't" + partial;
}

/** 'as good' within `tol` (absolute), else better / worse. */
export function compareWord(a, b, tol = 0.05) {
  if (a == null || b == null) return 'not comparable';
  if (Math.abs(a - b) <= tol) return 'as good as';
  return a > b ? 'better than' : 'worse than';
}

export const pctStr = (x) => (x == null ? 'n/a' : (100 * x).toFixed(1) + '%');
export const msStr = (x) => (x == null ? 'n/a' : x >= 1000 ? (x / 1000).toFixed(2) + ' s' : Math.round(x) + ' ms');
export const usdStr = (x) => (x == null ? 'n/a' : x === 0 ? '$0' : x < 0.01 ? '$' + x.toFixed(5) : '$' + x.toFixed(4));
export const times = (a, b) => (a == null || b == null || !b ? 'n/a' : (a / b >= 10 ? Math.round(a / b) : (a / b).toFixed(1)) + '×');
