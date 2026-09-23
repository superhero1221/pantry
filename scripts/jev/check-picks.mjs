/**
 * Check B — picks. Is the dish the app offers tonight a sensible one?
 *
 * About forty realistic people — a country (including the four whose money is
 * whole units: rupees, naira, Pakistani rupees, lira), a budget, a time limit,
 * diets, a cooking level and sometimes a goal. For each, the app's real Home
 * screen is asked for its pick and the four dishes behind it (app-driver.mjs;
 * the ranking is not importable, so the built app is driven headlessly).
 *
 * Then three layers:
 *   1. deterministic, no Jev: does the #1 pick break a diet (meetsDiet) or the
 *      time limit, or cost more than the budget at the cheapest shop shown?
 *      Does the diet-clash banner on Home describe the dish actually shown?
 *   2. Jev noul: does the #1 pick satisfy every hard constraint?
 *   3. Jev choice among the app's top five (plus "none"), asked twice in two
 *      orderings in the same request: which fits this person best tonight?
 *      A different answer across orderings is an order flip, reported, and
 *      that scenario's preference is treated as unsettled.
 */
import { COUNTRIES, DIETS, EXTRA, RECIPES, dietWords, meetsDiet, pack, toLocal } from './app.mjs';
import { APP_DIR, buildApp, launch, readOffers, serve } from './app-driver.mjs';
import { MOCK_BANNER, band, choice, esc, noul, pct, r3 } from './lib.mjs';

export const name = 'picks';

const LEVEL_WORDS = { 1: 'beginner (can chop an onion, cook rice)', 2: 'can sear meat and make a pan sauce', 3: 'confident (uses a thermometer, kneads dough)', 4: 'experienced (deep fries, fillets fish)' };
const GOAL_WORDS = { cheap: 'spend as little as possible', lose: 'lose weight', gain: 'gain weight', muscle: 'build muscle', energy: 'more energy', '': null };

/**
 * Forty people, fixed, so two runs are comparable. Five per country; diet
 * sets, time limits, budgets, levels and goals cycled on coprime strides so
 * the combinations spread instead of repeating in lockstep.
 */
export function scenarios() {
  const countries = Object.keys(COUNTRIES);
  const dietSets = [
    [], ['vegan'], ['vegetarian'], ['halal'], ['kosher'], ['gluten_free'], ['dairy_free'], ['nut_free'],
    ['vegan', 'gluten_free'], ['halal', 'nut_free'], ['vegetarian', 'dairy_free'], ['kosher', 'gluten_free'],
    ['gluten_free', 'dairy_free'], ['vegan', 'nut_free'], ['halal', 'dairy_free'],
  ];
  const times = [15, 30, 45, 60, 999];
  const budgets = [3, 5, 6, 8, 12]; // the Home chip presets, in the GBP baseline
  const goals = ['', 'cheap', '', 'lose', '', 'muscle', '', 'energy', 'gain'];
  const out = [];
  for (let i = 0; i < 40; i++) {
    const country = countries[i % countries.length];
    out.push({
      id: `s${String(i + 1).padStart(2, '0')}-${country}`,
      country,
      diets: dietSets[(i * 4) % dietSets.length],
      maxTime: times[(i * 3 + Math.floor(i / 8)) % times.length],
      budget: budgets[(i * 2 + Math.floor(i / 5)) % budgets.length],
      level: 1 + ((i * 3 + 1) % 4),
      goal: goals[(i * 5) % goals.length],
    });
  }
  return out;
}

/** What the app would print for a GBP-baseline amount, offline. */
export function money(gbp, code) {
  const c = COUNTRIES[code];
  const v = toLocal(gbp, c, c.fx);
  return c.fx >= 40 ? c.sym + Math.round(v).toLocaleString('en-GB') : c.sym + v.toFixed(2);
}

/** Every amount printed in a card, as numbers, in order. */
export function amounts(text) {
  const clean = text.replace(/[⁦⁧⁨⁩‎‏]/g, '');
  return [...clean.matchAll(/(?:£|\$|€|₹|₦|₺|Rs|AED)\s?([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, '')));
}

function seedOf(s) {
  return {
    seen: true,
    lang: 'en',
    country: s.country,
    diets: s.diets,
    budget: s.budget,
    budgetSet: true,
    maxTime: s.maxTime,
    timeSet: true,
    level: s.level,
    profile: s.goal ? { goal: s.goal } : {},
  };
}

const dietLabel = (id) => dietWords[id] || DIETS.find((d) => d.id === id)?.label || id;

export function person(s) {
  return {
    lives_in: `${COUNTRIES[s.country].city}, ${COUNTRIES[s.country].name}`,
    currency: COUNTRIES[s.country].cur,
    budget_for_the_whole_shop: money(s.budget, s.country),
    time_available: s.maxTime >= 999 ? 'no limit' : `${s.maxTime} minutes, start to finish`,
    diets: s.diets.length ? s.diets.map(dietLabel) : 'none',
    cooking_level: LEVEL_WORDS[s.level],
    ...(GOAL_WORDS[s.goal] ? { goal: GOAL_WORDS[s.goal] } : {}),
  };
}

function dish(r, offer) {
  return {
    name: r.name,
    cuisine: r.cuisine,
    total_minutes: r.total,
    difficulty: `${r.diff}/4 (${r.diffLabel})`,
    servings: r.servings,
    price_shown_by_app: offer.card.split(' | ').find((x) => /to buy/.test(x))?.replace(/[⁦⁧⁨⁩]/g, '').replace(/\n/g, ' ') || null,
    kcal_per_serving: r.per.kcal,
    protein_g_per_serving: r.per.protein,
    ingredients: r.items.map((i) => `${i.g} ${i.n}${i.opt ? ' (optional)' : ''}`),
  };
}

/** The hard-constraints line every pick question is read against. */
export const HARD_CONSTRAINTS = 'Diets are absolute. The time available is a hard limit. The budget covers the whole shop for the recipe, all servings, not per serving.';

/** Does the #1 pick keep every hard constraint? Exported so bench.mjs asks it word for word. */
export const pickOkQuestion = () =>
  noul(
    "Does the app's pick (apps_pick) satisfy every one of this person's hard constraints — it fits every diet listed, can be made within the time available, and its price to buy is within the budget?",
    { true: 'It fits every diet, the time and the budget.', false: 'It breaks at least one: a diet, the time limit or the budget.' },
  );

/** Which of these recipes fits best, with the options in `order` (indexes into `recipes`), plus "none". */
export function bestQuestion(recipes, order) {
  const criteria = Object.fromEntries([
    ...order.map((i) => [recipes[i].id, { what: `${recipes[i].name} (${recipes[i].cuisine}, ${recipes[i].total} min, difficulty ${recipes[i].diff}/4)`, not_for: 'Anyone whose diet, time or budget it breaks.' }]),
    ['none', { what: 'None of these dishes is a reasonable dinner for this person tonight.', not_for: 'Use only if every dish above breaks a hard constraint or is clearly unsuitable.' }],
  ]);
  return choice('Which one of these dishes best fits this person for dinner tonight, given their diets, time, budget, cooking level and goal?', criteria);
}

/** h1 text -> recipe. English pack names first (they can differ from r.name). */
function resolver() {
  const byName = new Map();
  const p = pack('en').dishes || {};
  for (const r of RECIPES) {
    byName.set(r.name, r);
    if (p[r.id]) byName.set(p[r.id], r);
  }
  return (title) => byName.get(title);
}

export async function prepare({ limit, rebuild = true, say = console.log }) {
  const list = limit ? scenarios().slice(0, limit) : scenarios();
  buildApp({ rebuild, say });
  const server = await serve(APP_DIR);
  const browser = await launch();
  const find = resolver();
  const anotherLabel = EXTRA.en.another;
  const calls = [];
  const failures = [];
  try {
    for (const s of list) {
      let offers;
      try {
        offers = await readOffers(browser, server.port, seedOf(s), { n: 5, anotherLabel });
      } catch (e) {
        failures.push({ id: s.id, error: String(e.message || e) });
        continue;
      }
      const top = offers.map((o) => ({ ...o, recipe: find(o.title) }));
      const unknown = top.filter((o) => !o.recipe);
      if (unknown.length) {
        failures.push({ id: s.id, error: `dish name(s) not in the cookbook: ${unknown.map((o) => o.title).join(', ')}` });
        continue;
      }
      const fwd = [0, 1, 2, 3, 4];
      const rev = [4, 3, 2, 1, 0];
      const pick = top[0].recipe;
      calls.push({
        id: s.id,
        state: {
          person: person(s),
          hard_constraints: HARD_CONSTRAINTS,
          apps_pick: dish(pick, top[0]),
          candidates: Object.fromEntries(top.map((o) => [o.recipe.id, dish(o.recipe, o)])),
        },
        questions: {
          pick_ok: pickOkQuestion(),
          best_a: bestQuestion(top.map((o) => o.recipe), fwd),
          best_b: bestQuestion(top.map((o) => o.recipe), rev),
        },
        meta: { scenario: s, top: top.map((o) => ({ id: o.recipe.id, title: o.title, card: o.card, alert: o.alert })) },
      });
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return { calls, failures, notes: [`${list.length} scenarios; ${calls.length} read from the app; ${failures.length} could not be read`] };
}

/** The deterministic half: what the app did, judged by the app's own rules. */
export function facts(meta) {
  const s = meta.scenario;
  const budgetLocal = toLocal(s.budget, COUNTRIES[s.country], COUNTRIES[s.country].fx);
  return meta.top.map((o, rank) => {
    const r = RECIPES.find((x) => x.id === o.id);
    const broken = s.diets.filter((d) => !meetsDiet(r, d));
    const prices = amounts(o.card);
    const cheapest = prices.length ? prices[0] : null;
    // The banner Home shows under the dish. It should name exactly the diets
    // this dish breaks — no banner when it breaks none.
    const bannerDiets = o.alert ? s.diets.filter((d) => o.alert.includes(dietLabel(d))) : [];
    const bannerRight = broken.length ? !!o.alert && broken.every((d) => bannerDiets.includes(d)) : !o.alert;
    return {
      rank: rank + 1,
      id: o.id,
      name: r.name,
      total: r.total,
      breaks_diets: broken,
      over_time: r.total > s.maxTime,
      cheapest_shown: cheapest,
      budget_local: budgetLocal,
      over_budget: cheapest != null ? cheapest > budgetLocal + 1e-9 : null,
      banner: o.alert,
      banner_right: bannerRight,
    };
  });
}

export function analyse(prep, results, { mock }) {
  const rows = prep.calls.map((c, i) => {
    const res = results[i];
    const f = facts(c.meta);
    const a = res?.answers || {};
    const top1 = f[0];
    const choiceA = a.best_a?.ok ? a.best_a.value : null;
    const choiceB = a.best_b?.ok ? a.best_b.value : null;
    return {
      id: c.id,
      scenario: c.meta.scenario,
      top: f,
      // Avoidable: the pick breaks a rule while one of the five behind it does not.
      avoidable_violation: (top1.breaks_diets.length > 0 || top1.over_time) && f.some((x) => !x.breaks_diets.length && !x.over_time),
      pick_ok: a.pick_ok?.ok ? a.pick_ok.value : null,
      choice_a: choiceA,
      conf_a: a.best_a?.confidence ?? null,
      choice_b: choiceB,
      conf_b: a.best_b?.confidence ?? null,
      flip: choiceA != null && choiceB != null && choiceA !== choiceB,
      agrees: choiceA != null && choiceB != null && choiceA === choiceB && choiceA === top1.id,
      error: res?.skipped ? res.reason : res?.error || null,
    };
  });

  const n = rows.length;
  const judged = rows.filter((r) => r.choice_a != null && r.choice_b != null);
  const stable = judged.filter((r) => !r.flip);
  const agree = stable.filter((r) => r.agrees).length;
  const detDiet = rows.filter((r) => r.top[0].breaks_diets.length);
  const detTime = rows.filter((r) => r.top[0].over_time);
  const detBudget = rows.filter((r) => r.top[0].over_budget);
  const bannerWrong = rows.flatMap((r) => r.top.filter((x) => !x.banner_right).map((x) => ({ ...x, scenario: r.id, diets: r.scenario.diets })));
  const jevSaysBroken = rows.filter((r) => r.pick_ok != null && r.pick_ok < 0.5);

  const md = ['# Jev second opinion: dish picks\n'];
  if (mock) md.push(MOCK_BANNER);
  md.push(
    "The app's own Home screen was asked, for each person below, for tonight's pick and the four dishes behind it (built app, driven headlessly, offline rates). " +
      "Deterministic checks come first and use the app's own rules. Then Jev answered whether the pick keeps every hard constraint, and which of the five it would pick — asked twice with the options in opposite orders. " +
      'An answer that changes with the order is an **order flip** and counts as no opinion.\n',
  );
  md.push('## Summary\n');
  md.push(`- scenarios: ${n} read from the app${prep.failures.length ? `, ${prep.failures.length} failed to read` : ''}`);
  md.push(`- **deterministic** — #1 pick breaks a diet: ${detDiet.length}; over the time limit: ${detTime.length}; cheapest shown price over budget (the app treats budget as soft): ${detBudget.length}; avoidable (a compliant dish was in the top five): ${rows.filter((r) => r.avoidable_violation).length}`);
  md.push(`- **deterministic** — diet-clash banner on Home not describing the dish on screen: ${bannerWrong.length} of ${rows.length * 5} dishes shown`);
  md.push(`- Jev says the #1 pick breaks a hard constraint (noul < 0.5): ${jevSaysBroken.length} of ${rows.filter((r) => r.pick_ok != null).length}`);
  md.push(`- Jev choice: ${judged.length} answered both orderings; ${judged.length - stable.length} order flips (${pct(judged.length - stable.length, judged.length)}); of the stable ones, Jev picked the app's #1 in ${agree} (${pct(agree, stable.length)})`);
  const bands = {};
  for (const r of judged) for (const c of [r.conf_a, r.conf_b]) bands[band(c)] = (bands[band(c)] || 0) + 1;
  md.push(`- choice confidence bands (TypeSafe: > 0.9 act, 0.5–0.9 confirm, < 0.5 escalate): ${Object.entries(bands).map(([k, v]) => `${k} ${v}`).join(', ') || 'n/a'}\n`);

  if (bannerWrong.length) {
    md.push(`## Diet-clash banner does not match the dish shown (${bannerWrong.length})\n`);
    md.push(
      "Deterministic. On Home the red 'This one breaks your … setting' banner should describe the dish on the card. " +
        "In usePantry.ts `dietBroken` is computed from `recipe` (the dish of `S.pickId`, which defaults to Pad Thai and is not persisted) rather than `offer` (the dish Home is showing), " +
        'so the banner can warn about a dish that is fine and stay silent about one that is not. Not changed here — app source is read-only for this harness.\n',
    );
    md.push('| scenario | rank | dish on card | its diets broken | banner text |');
    md.push('|---|---|---|---|---|');
    for (const b of bannerWrong.slice(0, 60)) md.push(`| ${b.scenario} (${b.diets.join('+') || 'no diet'}) | ${b.rank} | ${b.name} | ${b.breaks_diets.join(', ') || 'none'} | ${esc(b.banner || '(none)')} |`);
    if (bannerWrong.length > 60) md.push(`\n…and ${bannerWrong.length - 60} more in picks.json.`);
    md.push('');
  }

  const viol = rows.filter((r) => r.top[0].breaks_diets.length || r.top[0].over_time || (r.pick_ok != null && r.pick_ok < 0.5));
  md.push(`## Constraint problems with the #1 pick (${viol.length})\n`);
  if (!viol.length) md.push('None.\n');
  for (const r of viol) {
    const t = r.top[0];
    const s = r.scenario;
    md.push(`### ${r.id}: ${t.name}`);
    md.push(`- person: ${s.country}, diets ${s.diets.join(', ') || 'none'}, ${s.maxTime >= 999 ? 'no time limit' : s.maxTime + ' min'}, budget ${money(s.budget, s.country)}, level ${s.level}${s.goal ? ', goal ' + s.goal : ''}`);
    md.push(`- app rules: breaks diets [${t.breaks_diets.join(', ') || '—'}], ${t.total} min${t.over_time ? ' (OVER)' : ''}, cheapest shown ${t.cheapest_shown ?? '?'} vs budget ${t.budget_local.toFixed(2)}${t.over_budget ? ' (over)' : ''}${r.avoidable_violation ? ' — **avoidable**: a compliant dish was in the top five' : ''}`);
    md.push(`- Jev pick_ok: ${r3(r.pick_ok)}`);
    md.push(`- top five: ${r.top.map((x) => `${x.rank}. ${x.name} (${x.total} min${x.breaks_diets.length ? ', breaks ' + x.breaks_diets.join('+') : ''})`).join('; ')}`);
    md.push('');
  }

  const dis = rows.filter((r) => r.choice_a != null && !r.flip && !r.agrees);
  md.push(`## Jev would pick something else (${dis.length})\n`);
  if (!dis.length) md.push('None.\n');
  else {
    md.push('| scenario | person | app #1 | Jev picks | conf a / b | top five |');
    md.push('|---|---|---|---|---|---|');
    for (const r of dis) {
      const s = r.scenario;
      const jev = r.choice_a === 'none' ? '**none of them**' : `${r.top.find((x) => x.id === r.choice_a)?.name} (#${r.top.find((x) => x.id === r.choice_a)?.rank})`;
      md.push(`| ${r.id} | ${s.diets.join('+') || 'no diet'}, ${s.maxTime >= 999 ? '∞' : s.maxTime}m, ${money(s.budget, s.country)}, L${s.level}${s.goal ? ', ' + s.goal : ''} | ${r.top[0].name} | ${jev} | ${r3(r.conf_a)} / ${r3(r.conf_b)} | ${r.top.map((x) => x.name).join(', ')} |`);
    }
    md.push('');
  }

  const flips = rows.filter((r) => r.flip);
  md.push(`## Order flips (${flips.length})\n`);
  md.push('The same question with the five options listed in reverse gave a different answer. These say more about the question than about the app.\n');
  for (const r of flips) md.push(`- ${r.id}: forward → ${r.choice_a} (${r3(r.conf_a)}), reversed → ${r.choice_b} (${r3(r.conf_b)})`);
  md.push('');

  if (prep.failures.length) {
    md.push(`## Scenarios the app could not be read for (${prep.failures.length})\n`);
    for (const f of prep.failures) md.push(`- ${f.id}: ${esc(f.error)}`);
    md.push('');
  }
  const errs = rows.filter((r) => r.error);
  if (errs.length) {
    md.push(`## Jev errors (${errs.length})\n`);
    for (const r of errs) md.push(`- ${r.id}: ${esc(r.error)}`);
    md.push('');
  }

  return {
    json: {
      check: name,
      mock,
      summary: {
        scenarios: n,
        deterministic: { diet: detDiet.length, time: detTime.length, budget: detBudget.length, banner_wrong: bannerWrong.length },
        jev_pick_broken: jevSaysBroken.length,
        judged: judged.length,
        flips: judged.length - stable.length,
        agree_with_app: agree,
      },
      rows,
      failures: prep.failures,
    },
    markdown: md.join('\n'),
    headline: `picks: ${n} scenarios, banner wrong on ${bannerWrong.length} dishes, #1 breaks diet ${detDiet.length}/time ${detTime.length}, Jev agrees ${agree}/${stable.length} stable, ${judged.length - stable.length} flips`,
  };
}
