/**
 * Check C — translations. Does each of the five translations say what the
 * English says?
 *
 * Enumerates the same three tables data.test.ts holds to key parity —
 * `strings`, `pack` and `extra` — but reads the language files directly, the
 * way that test does, because every accessor English-backs a missing key and
 * would hand back English to compare with English.
 *
 * Two layers:
 *   1. deterministic, no Jev: the set of {placeholders} in each translation
 *      must equal the English set exactly. A translated or dropped {n} is a
 *      bug fill() cannot recover from, and it costs nothing to find.
 *   2. Jev: one request per key carrying all five languages, one noul per
 *      language — "does this say the same thing as the English?"
 */
import { EXTRA, LANGS, OTHER, pack, strings } from './app.mjs';
import { MOCK_BANNER, esc, noul, r3 } from './lib.mjs';

export const name = 'translations';

const LANG_NAME = { es: 'Spanish', fr: 'French', pl: 'Polish', ur: 'Urdu', ar: 'Arabic' };

/** Leaves of a nested pack section as dotted keys: 'dishes.pad_thai', 'levels.2'. */
function flatten(x, prefix, out) {
  if (typeof x === 'string') out[prefix] = x;
  else if (Array.isArray(x)) x.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) flatten(v, `${prefix}.${k}`, out);
  return out;
}

/** Every key with English and all five translations, as {table, key, en, es, ...}. */
export function enumerate() {
  const tables = {
    strings: { en: strings('en'), ...Object.fromEntries(OTHER.map((l) => [l, LANGS[l].strings])) },
    pack: {
      en: Object.entries(pack('en')).reduce((o, [k, v]) => flatten(v, k, o), {}),
      ...Object.fromEntries(OTHER.map((l) => [l, Object.entries(LANGS[l].pack).reduce((o, [k, v]) => flatten(v, k, o), {})])),
    },
    extra: { en: EXTRA.en, ...Object.fromEntries(OTHER.map((l) => [l, LANGS[l].extra])) },
  };
  const rows = [];
  const incomplete = [];
  for (const [table, t] of Object.entries(tables)) {
    for (const [key, en] of Object.entries(t.en)) {
      if (typeof en !== 'string') continue;
      const tr = Object.fromEntries(OTHER.map((l) => [l, t[l]?.[key]]));
      const missing = OTHER.filter((l) => typeof tr[l] !== 'string');
      if (missing.length) {
        incomplete.push({ table, key, missing });
        continue;
      }
      rows.push({ table, key, en, ...tr });
    }
  }
  return { rows, incomplete };
}

const PH = /\{[A-Za-z0-9_]+\}/g;
const tokens = (s) => [...new Set(s.match(PH) || [])].sort();

export function placeholderMismatches(rows) {
  const out = [];
  for (const r of rows) {
    const en = tokens(r.en);
    for (const l of OTHER) {
      const t = tokens(r[l]);
      if (en.join() !== t.join()) {
        out.push({ table: r.table, key: r.key, lang: l, english: en, translation: t, missing: en.filter((x) => !t.includes(x)), extra: t.filter((x) => !en.includes(x)), text: r[l] });
      }
    }
  }
  return out;
}

/**
 * Keys not worth a call, and why. Nothing is skipped silently — the report
 * lists every one.
 *   identical — all five translations are the English, character for
 *               character: a brand, a symbol, a unit. Nothing to compare.
 *   no-words  — English has fewer than two letters once placeholders are
 *               removed ('{n}', '·', '→'). Any rendering is as good as another.
 */
export function skipReason(r) {
  if (OTHER.every((l) => r[l] === r.en)) return 'identical';
  const letters = r.en.replace(PH, '').replace(/[^\p{L}]/gu, '');
  if (letters.length < 2) return 'no-words';
  return null;
}

const question = (l) =>
  noul(
    `Does the ${LANG_NAME[l]} text (field "${l}") say the same thing as the English (field "english") — nothing important added, dropped, reversed or mistranslated? It is interface copy for a cooking app; natural idiom and tone changes are fine. Placeholders in braces like {n} are deliberately left untranslated and are not an error. Judge only ${LANG_NAME[l]}; ignore the other languages.`,
    {
      true: `The ${LANG_NAME[l]} says the same thing as the English.`,
      false: `The ${LANG_NAME[l]} adds, drops, reverses or mistranslates something that matters.`,
    },
  );

export async function prepare({ limit }) {
  const { rows, incomplete } = enumerate();
  const skipped = [];
  const keep = [];
  for (const r of rows) {
    const why = skipReason(r);
    if (why) skipped.push({ table: r.table, key: r.key, why, en: r.en });
    else keep.push(r);
  }
  const picked = limit ? keep.slice(0, limit) : keep;
  const calls = picked.map((r) => ({
    id: `${r.table}:${r.key}`,
    state: { key: `${r.table}.${r.key}`, english: r.en, es: r.es, fr: r.fr, pl: r.pl, ur: r.ur, ar: r.ar },
    questions: Object.fromEntries(OTHER.map((l) => [`${l}_faithful`, question(l)])),
    meta: { row: r },
  }));
  return {
    calls,
    placeholders: placeholderMismatches(rows),
    skipped,
    incomplete,
    total: rows.length,
    notes: [`${rows.length} complete keys across strings/pack/extra; ${skipped.length} skipped; ${incomplete.length} not present in all five languages; ${calls.length} to ask`],
  };
}

export function analyse(prep, results, { mock }) {
  const per = Object.fromEntries(OTHER.map((l) => [l, []]));
  const errors = [];
  prep.calls.forEach((c, i) => {
    const res = results[i];
    if (!res || res.skipped || res.error) {
      errors.push({ id: c.id, why: res?.reason || res?.error || 'no result' });
      return;
    }
    for (const l of OTHER) {
      const a = res.answers[`${l}_faithful`];
      if (!a?.ok) {
        errors.push({ id: c.id, lang: l, why: a?.problem || 'no answer' });
        continue;
      }
      per[l].push({ id: c.id, noul: a.value, en: c.meta.row.en, text: c.meta.row[l] });
    }
  });
  for (const l of OTHER) per[l].sort((a, b) => a.noul - b.noul);

  const FLAG = 0.5;
  const summary = OTHER.map((l) => {
    const xs = per[l];
    return { lang: l, judged: xs.length, flagged: xs.filter((x) => x.noul < FLAG).length, unsure: xs.filter((x) => x.noul >= FLAG && x.noul < 0.8).length, placeholder_mismatches: prep.placeholders.filter((p) => p.lang === l).length };
  });

  const md = ['# Jev second opinion: translations\n'];
  if (mock) md.push(MOCK_BANNER);
  md.push(
    `For each interface key, Jev's probability that each translation says the same thing as the English. **Flagged** is below ${FLAG}; 0.5–0.8 is listed as unsure. ` +
      'Jev is judging meaning, not grammar or register, and its reliability per language is unmeasured here — treat a flag as "a fluent reader should look", not as "wrong". ' +
      'The placeholder section is deterministic (no Jev) and every row in it is a real bug.\n',
  );
  md.push('## Summary\n');
  md.push(`${prep.total} keys have English and all five translations. ${prep.calls.length} asked, ${prep.skipped.length} skipped, ${errors.length} errors.\n`);
  md.push('| lang | judged | flagged (< 0.5) | unsure (0.5–0.8) | placeholder mismatches |');
  md.push('|---|---|---|---|---|');
  for (const s of summary) md.push(`| ${s.lang} | ${s.judged} | ${s.flagged} | ${s.unsure} | ${s.placeholder_mismatches} |`);
  md.push('');

  md.push(`## Placeholder mismatches — deterministic (${prep.placeholders.length})\n`);
  if (!prep.placeholders.length) md.push('None. Every translation carries exactly the English set of {tokens}.\n');
  else {
    md.push('| key | lang | missing | extra | translation |');
    md.push('|---|---|---|---|---|');
    for (const p of prep.placeholders) md.push(`| ${p.table}.${p.key} | ${p.lang} | ${p.missing.join(' ')} | ${p.extra.join(' ')} | ${esc(p.text.slice(0, 120))} |`);
    md.push('');
  }

  for (const l of OTHER) {
    const xs = per[l].filter((x) => x.noul < 0.8);
    md.push(`## ${LANG_NAME[l]} (${l}) — lowest first (${xs.length} below 0.8)\n`);
    if (!xs.length) {
      md.push('Nothing below 0.8.\n');
      continue;
    }
    md.push('| noul | key | English | translation |');
    md.push('|---|---|---|---|');
    for (const x of xs) md.push(`| ${r3(x.noul)}${x.noul < FLAG ? ' **flag**' : ''} | ${x.id} | ${esc(x.en.slice(0, 140))} | <span dir="auto">${esc(x.text.slice(0, 140))}</span> |`);
    md.push('');
  }

  md.push(`## Skipped (${prep.skipped.length})\n`);
  md.push('`identical`: all five translations equal the English (brands, symbols, units). `no-words`: fewer than two letters once placeholders are removed.\n');
  for (const s of prep.skipped) md.push(`- ${s.table}.${s.key} — ${s.why}: \`${esc(s.en)}\``);
  md.push('');
  if (prep.incomplete.length) {
    md.push(`## Not in all five languages (${prep.incomplete.length})\n`);
    md.push('Pack leaves the parity test does not reach (it compares section names, not what is inside them). English backs these at runtime.\n');
    for (const s of prep.incomplete) md.push(`- ${s.table}.${s.key} — missing in ${s.missing.join(', ')}`);
    md.push('');
  }
  if (errors.length) {
    md.push(`## Errors (${errors.length})\n`);
    for (const e of errors.slice(0, 50)) md.push(`- ${e.id}${e.lang ? ' ' + e.lang : ''}: ${esc(e.why)}`);
    md.push('');
  }

  return {
    json: { check: name, mock, summary, placeholders: prep.placeholders, per_language: per, skipped: prep.skipped, incomplete: prep.incomplete, errors },
    markdown: md.join('\n'),
    headline: `translations: ${summary.map((s) => `${s.lang} ${s.flagged} flagged`).join(', ')}; ${prep.placeholders.length} placeholder mismatches`,
  };
}
