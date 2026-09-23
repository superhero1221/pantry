#!/usr/bin/env node
/**
 * Three independent second opinions on Pantry from TypeSafe's Jev.
 *
 *   node scripts/jev/run.mjs <diets|picks|translations|all> [--dry] [--mock]
 *        [--limit=N] [--max-usd=0.5] [--out=jev-results] [--concurrency=4]
 *        [--no-build]
 *
 *   --dry       count calls, estimate tokens and dollars, write three sample
 *               payloads per check, and make NO network call. No key needed.
 *   --mock      run the whole pipeline against the offline fake in lib.mjs.
 *               No key needed, no network.
 *   --limit=N   only the first N calls of each check (N scenarios for picks).
 *   --max-usd   spend guard for the whole run, all checks together.
 *   --no-build  picks: reuse the last build in node_modules/.cache/jev-app.
 *
 * A real run reads the key from OPENROUTER_API_KEY and nowhere else. See
 * scripts/jev/README.md. Never put the key in src/: everything there ships to
 * every visitor's browser.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Jev, MODEL, estimateTokens, fmtUsd, mask, usd } from './lib.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const a = argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const which = argv.find((x) => !x.startsWith('--'));
const CHECKS = ['diets', 'picks', 'translations'];

if (!which || !(which === 'all' || CHECKS.includes(which)) || flag('help')) {
  console.log('usage: node scripts/jev/run.mjs <diets|picks|translations|all> [--dry] [--mock] [--limit=N] [--max-usd=0.5] [--out=jev-results] [--concurrency=4] [--no-build]');
  process.exit(which ? 0 : 2);
}

const dry = flag('dry');
const mock = flag('mock');
const limit = opt('limit') ? Number(opt('limit')) : 0;
const maxUsd = Number(opt('max-usd', '0.5'));
const concurrency = Number(opt('concurrency', '4'));
const outDir = resolve(opt('out', 'jev-results'));
if (!Number.isFinite(maxUsd) || maxUsd <= 0) {
  console.error('--max-usd must be a positive number');
  process.exit(2);
}
if (maxUsd > 1) console.warn(`warning: --max-usd ${maxUsd} is above the key's $1 hard cap; OpenRouter will refuse (402) before this guard does.`);
if (!Number.isInteger(limit) || limit < 0) {
  console.error('--limit must be a whole number');
  process.exit(2);
}

const key = process.env.OPENROUTER_API_KEY;
if (!dry && !mock && !key) {
  console.error('OPENROUTER_API_KEY is not set. Export it in this shell (never in a file under src/), or use --dry / --mock.');
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });
const mode = dry ? 'DRY (no network)' : mock ? 'MOCK (offline fake)' : `LIVE ${MODEL}, key ${mask(key)}`;
console.log(`Jev harness — ${mode}; checks: ${which}; limit ${limit || 'none'}; max ${fmtUsd(maxUsd)}; out ${outDir}`);

const mods = {
  diets: () => import('./check-diets.mjs'),
  picks: () => import('./check-picks.mjs'),
  translations: () => import('./check-translations.mjs'),
};

const client = dry ? null : new Jev({ apiKey: key, mock, maxUsd, concurrency, outDir });
const summary = [];

for (const c of which === 'all' ? CHECKS : [which]) {
  console.log(`\n[${c}] preparing`);
  const m = await mods[c]();
  const prep = await m.prepare({ limit, rebuild: !flag('no-build') });
  for (const n of prep.notes || []) console.log(`  ${n}`);
  const bodies = prep.calls.map((x) => ({ model: MODEL, state: x.state, questions: x.questions }));
  const tokens = bodies.reduce((a, b) => a + estimateTokens(b), 0);
  const qs = bodies.reduce((a, b) => a + Object.keys(b.questions).length, 0);
  console.log(`  ${bodies.length} calls, ${qs} questions, ~${tokens.toLocaleString()} input tokens est., ~${fmtUsd(usd(tokens))}`);

  if (dry) {
    const dir = join(outDir, 'samples');
    mkdirSync(dir, { recursive: true });
    bodies.slice(0, 3).forEach((b, i) => writeFileSync(join(dir, `${c}-${i + 1}.json`), JSON.stringify(b, null, 2)));
    // The deterministic parts need no Jev, so a dry run still reports them.
    if (c === 'translations') {
      console.log(`  placeholder mismatches (deterministic): ${prep.placeholders.length}`);
      writeFileSync(join(outDir, 'translations-placeholders.json'), JSON.stringify({ mismatches: prep.placeholders, skipped: prep.skipped, incomplete: prep.incomplete }, null, 2));
    }
    if (c === 'picks') {
      const { facts } = m;
      const f = prep.calls.map((x) => facts(x.meta));
      writeFileSync(join(outDir, 'picks-facts.json'), JSON.stringify(prep.calls.map((x, i) => ({ id: x.id, scenario: x.meta.scenario, top: f[i] })), null, 2));
      console.log(`  deterministic: #1 breaks a diet ${f.filter((x) => x[0].breaks_diets.length).length}, over time ${f.filter((x) => x[0].over_time).length}, over budget ${f.filter((x) => x[0].over_budget).length}, banner not matching dish ${f.flat().filter((x) => !x.banner_right).length}/${f.flat().length}`);
      if (prep.failures.length) console.log(`  could not read ${prep.failures.length}: ${prep.failures.map((x) => x.id + ' ' + x.error).join('; ')}`);
    }
    summary.push({ check: c, calls: bodies.length, questions: qs, est_tokens: tokens, est_usd: usd(tokens), samples: bodies.slice(0, 3).map((_, i) => join(dir, `${c}-${i + 1}.json`)) });
    continue;
  }

  const results = await client.runAll(prep.calls, { label: c });
  const report = m.analyse(prep, results, { mock });
  writeFileSync(join(outDir, `${c}.json`), JSON.stringify(report.json, null, 2));
  writeFileSync(join(outDir, `${c}.md`), report.markdown);
  console.log(`  ${report.headline}`);
  console.log(`  wrote ${join(outDir, c + '.md')} and ${c}.json`);
  summary.push({
    check: c,
    calls: bodies.length,
    answered: results.filter((r) => r && r.ok).length,
    skipped: results.filter((r) => r && r.skipped).length,
    failed: results.filter((r) => r && !r.ok && !r.skipped).length,
    est_tokens: tokens,
    headline: report.headline,
  });
}

const tail = client
  ? { spent_usd: client.spentUsd, requests: client.calls, retries: client.retries, errors: client.errors, stopped: client.stopped }
  : {};
writeFileSync(join(outDir, dry ? 'dry-run.json' : 'summary.json'), JSON.stringify({ mode: dry ? 'dry' : mock ? 'mock' : 'live', model: MODEL, max_usd: maxUsd, limit, checks: summary, ...tail }, null, 2));

console.log('\n' + '─'.repeat(60));
for (const s of summary) console.log(`${s.check.padEnd(13)} ${String(s.calls).padStart(4)} calls  ~${s.est_tokens.toLocaleString().padStart(9)} tok  ~${fmtUsd(usd(s.est_tokens))}${s.headline ? '  ' + s.headline : ''}`);
const totalTok = summary.reduce((a, s) => a + s.est_tokens, 0);
console.log(`${'total'.padEnd(13)} ${String(summary.reduce((a, s) => a + s.calls, 0)).padStart(4)} calls  ~${totalTok.toLocaleString().padStart(9)} tok  ~${fmtUsd(usd(totalTok))}`);
if (client) {
  console.log(`requests ${client.calls} (retries ${client.retries}), errors ${client.errors}, spent ${fmtUsd(client.spentUsd)}${mock ? ' (mock — nothing spent)' : ''}`);
  if (client.stopped) {
    console.log(`STOPPED EARLY: ${client.stopped}`);
    process.exitCode = 3;
  }
}
