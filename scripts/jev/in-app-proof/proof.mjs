// Browser proof for Jev inside the app (docs/JEV-IN-APP.md). Serves each
// build on 127.0.0.1:$PORT in turn, drives it in Chromium at phone size
// (402x874), and intercepts the Supabase function with page.route: no
// network, no key, canned answers. Screenshots and proof-results.json land in
// PROOF_DIR.
//
// Needs Playwright (not in package.json; see scripts/jev/README.md) and five
// builds in PROOF_DIR: this branch three ways, and the commit before the Jev
// work two ways, so "flag off" can be compared with what shipped before.
//
//   export PROOF_DIR=/tmp/jev-in-app-proof
//   B=scripts/jev/in-app-proof/build.mjs
//   node $B $PROOF_DIR/dist-on on
//   node $B $PROOF_DIR/dist-off off
//   node $B $PROOF_DIR/dist-cloud cloud
//   mkdir -p $PROOF_DIR/base-src && git archive <base-commit> | tar -x -C $PROOF_DIR/base-src
//   ln -s "$PWD/node_modules" $PROOF_DIR/base-src/node_modules
//   node $B $PROOF_DIR/base-off off $PROOF_DIR/base-src
//   node $B $PROOF_DIR/base-cloud cloud $PROOF_DIR/base-src
//   node scripts/jev/in-app-proof/proof.mjs
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const S = process.env.PROOF_DIR || join(tmpdir(), 'jev-in-app-proof');
const PORT = Number(process.env.PORT) || 4711;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FN = 'https://fakeproj.supabase.co/functions/v1/jev-decide';
const VIEW = { width: 402, height: 874 };
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
function serve(dir) {
  return new Promise((ok) => {
    const srv = http.createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(dir, p));
      try {
        if (!file.startsWith(dir)) throw new Error('outside');
        const b = await readFile(file);
        res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
        res.end(b);
      } catch {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(await readFile(join(dir, 'index.html')));
      }
    });
    srv.listen(PORT, '127.0.0.1', () => ok({ close: () => new Promise((c) => srv.close(c)) }));
  });
}

const SEED = { seen: true, level: 2, diets: [], country: 'GB', budget: 6, budgetSet: false, maxTime: 60, timeSet: false, lang: 'en' };
const USER_ID = '00000000-0000-4000-8000-000000000001';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const fakeJwt = (exp) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER_ID, role: 'authenticated', aud: 'authenticated', exp, email: 'test@example.com' })}.c2ln`;

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS, GET, PATCH, DELETE' };
const json = (route, body, status = 200) => route.fulfill({ status, headers: { 'content-type': 'application/json', ...cors }, body: JSON.stringify(body) });

/**
 * One phone-sized context. `jev` answers the function; everything else on the
 * fake Supabase project answers empty; every other host is aborted and
 * recorded.
 */
async function open(browser, { seed = SEED, jev, signedIn = false, hash = '' } = {}) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'en-GB' });
  const now = Math.floor(Date.now() / 1000);
  await ctx.addInitScript(
    ([s, session]) => {
      if (sessionStorage.getItem('proof.seeded')) return;
      localStorage.clear();
      localStorage.setItem('pantry.v1', JSON.stringify(s));
      if (session) localStorage.setItem('sb-fakeproj-auth-token', JSON.stringify(session));
      sessionStorage.setItem('proof.seeded', '1');
    },
    [
      seed,
      signedIn
        ? {
            access_token: fakeJwt(now + 3600),
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: now + 3600,
            refresh_token: 'fake-refresh',
            user: { id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'test@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
          }
        : null,
    ],
  );
  const log = { outside: [], fn: [], supabase: [] };
  await ctx.route(
    (u) => !u.href.startsWith(ORIGIN),
    async (route) => {
      const req = route.request();
      const url = req.url();
      if (url.startsWith(FN)) {
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
        const body = JSON.parse(req.postData() || '{}');
        log.fn.push({ body, headers: req.headers() });
        if (!jev) return route.abort();
        return jev(route, body);
      }
      if (url.startsWith('https://fakeproj.supabase.co/')) {
        log.supabase.push(req.method() + ' ' + url.replace('https://fakeproj.supabase.co', ''));
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
        if (url.includes('/auth/v1/user')) return json(route, { id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'test@example.com' });
        if (url.includes('/rest/v1/price_reports') && req.method() === 'POST') return json(route, [], 201);
        return json(route, []);
      }
      log.outside.push(url);
      return route.abort();
    },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(ORIGIN + '/' + hash);
  await page.waitForSelector('h1', { timeout: 20000 });
  return { ctx, page, log, errors };
}

const cravingAnswer = (over = {}) => ({
  ok: true,
  task: 'craving',
  answers: {
    cuisine: 'none_or_unclear',
    cuisine_confidence: 0.9,
    intents: { quick: 0.96, cheap: 0.12, comforting: 0.93, light: 0.04, high_protein: 0.08, spicy: 0.05, vegetarian_leaning: 0.1 },
    ...over,
  },
  confidence: 0.9,
  ms: 410,
});

async function openRefine(page) {
  await page.getByText('Something else in mind?').click();
  return page.getByRole('textbox', { name: /what do you fancy/i });
}
const minsShown = async (page) => Number((await page.locator('h1 + div span').nth(2).innerText()).match(/\d+/)?.[0]);
const pressed = (page, name) => page.getByRole('button', { name, exact: true }).getAttribute('aria-pressed');
const shot = (page, name) => page.screenshot({ path: `${S}/${name}.png` });

const browser = await chromium.launch(process.env.JEV_CHROMIUM ? { executablePath: process.env.JEV_CHROMIUM } : {});

/* ── Flag ON ─────────────────────────────────────────────────────────────── */
let srv = await serve(S + '/dist-on');
{
  // 1. Craving: "something cosy and quick" -> chip + filters -> offer changes.
  const { ctx, page, log, errors } = await open(browser, { jev: (route) => json(route, cravingAnswer()) });
  const box = await openRefine(page);
  await box.fill('something cosy and quick');
  // Today's answer to that text, before Jev is even asked (700 ms debounce):
  // the matcher's word-by-word guess.
  await page.waitForTimeout(250);
  const before = (await page.locator('h1').first().innerText()).trim();
  const beforeMins = await minsShown(page);
  const chip = page.getByRole('status').filter({ hasText: 'Read as' });
  await chip.waitFor({ timeout: 5000 });
  const chipText = (await chip.innerText()).replace(/\s+/g, ' ');
  check('flag on: craving chip appears', /Read as Quick · Comforting/.test(chipText), chipText);
  const after = (await page.locator('h1').first().innerText()).trim();
  const mins = await minsShown(page);
  check('flag on: offer changed and fits the 30-minute cap', after !== before && mins <= 30, `${before} (${beforeMins} min) -> ${after} (${mins} min)`);
  check('flag on: 30 min chip is lit (existing time filter reused)', (await pressed(page, '30 min')) === 'true');
  check('flag on: the craving box was cleared (nothing unmatched left to say "none of that")', (await box.inputValue()) === '');
  check('flag on: request carried only task/input/lang, anon key, no OpenRouter key', log.fn.length === 1 && JSON.stringify(Object.keys(log.fn[0].body)) === '["task","input","lang"]' && log.fn[0].headers.apikey === 'fake-anon-key-public' && !JSON.stringify(log.fn[0]).includes('sk-or'), JSON.stringify(log.fn[0]?.body));
  await shot(page, '1-craving-dish');
  await chip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, '1-craving-chip');
  // Undo puts everything back.
  await chip.getByRole('button', { name: 'Undo' }).click();
  await page.waitForTimeout(1200);
  const undone = (await page.locator('h1').first().innerText()).trim();
  check(
    'flag on: undo restores the text, the time budget and today’s behaviour, and does not re-ask',
    (await box.inputValue()) === 'something cosy and quick' && (await pressed(page, 'An hour')) === 'true' && (await chip.count()) === 0 && undone === before && log.fn.length === 1,
    `h1 ${undone}, calls ${log.fn.length}`,
  );
  await box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, '1b-craving-undone');
  check('flag on: no page errors (craving)', errors.length === 0, errors.join(' | '));
  // The app's own exchange-rate fetch (api.frankfurter.app) is today's behaviour, not Jev's.
  const strange = log.outside.filter((u) => !u.startsWith('https://api.frankfurter.app/'));
  check('flag on: nothing contacted but the fake project and hosts the app already calls', strange.length === 0, log.outside.join(' '));
  await ctx.close();
}
{
  // 1c. With a (misspelt) cuisine the chip names it and the pool narrows to it.
  const { ctx, page } = await open(browser, { jev: (route) => json(route, cravingAnswer({ cuisine: 'italian', cuisine_confidence: 0.88 })) });
  const box = await openRefine(page);
  await box.fill('somethin cosy n quick, itallian');
  const chip = page.getByRole('status').filter({ hasText: 'Read as' });
  await chip.waitFor({ timeout: 5000 });
  const chipText = (await chip.innerText()).replace(/\s+/g, ' ');
  const cuisine = await page.locator('h1 + div span').first().innerText();
  const m = await minsShown(page);
  check('flag on: "Quick · Comforting · Italian" chip, a quick Italian dish on offer', /Quick · Comforting · Italian/.test(chipText) && /Italian/.test(cuisine) && m <= 30, `${chipText} | ${cuisine} | ${await page.locator('h1').first().innerText()} (${m} min)`);
  await shot(page, '1c-craving-dish-italian');
  await chip.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, '1c-craving-chip-italian');
  await ctx.close();
}
{
  // 2. Slow function (2 s): the client gives up at 1.5 s, and nothing changes.
  const { ctx, page, log, errors } = await open(browser, {
    jev: async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return json(route, cravingAnswer()).catch(() => {});
    },
  });
  const box = await openRefine(page);
  await box.fill('something cosy and quick');
  await page.waitForTimeout(250);
  const before = (await page.locator('h1').first().innerText()).trim();
  await page.waitForTimeout(4000);
  const chipCount = await page.getByRole('status').filter({ hasText: 'Read as' }).count();
  check(
    'flag on: slow (2 s) answer -> silent fallback to today’s behaviour',
    log.fn.length === 1 && chipCount === 0 && (await box.inputValue()) === 'something cosy and quick' && (await pressed(page, 'An hour')) === 'true' && (await page.locator('h1').first().innerText()).trim() === before,
    `calls ${log.fn.length}, chip ${chipCount}, dish ${before}`,
  );
  check('flag on: no page errors (slow)', errors.length === 0, errors.join(' | '));
  await box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, '2-slow-fallback');
  await ctx.close();
}
{
  // 3. Kitchen: "Worcestershire sauce", vegan profile -> Jev adds a caution.
  const itemAnswer = (vals) => ({ ok: true, task: 'pantry_item', answers: vals, confidence: null, ms: 380 });
  const low = { vegan: 0.02, vegetarian: 0.02, halal: 0.02, kosher: 0.02, gluten_free: 0.02, dairy_free: 0.02, nut_free: 0.02, no_pork: 0.02, no_alcohol: 0.02 };
  const { ctx, page, log, errors } = await open(browser, {
    seed: { ...SEED, diets: ['vegan'] },
    hash: '#/kitchen',
    jev: (route, body) =>
      json(route, itemAnswer(body.input === 'Worcestershire sauce' ? { ...low, vegan: 0.94, vegetarian: 0.91, gluten_free: 0.35 } : low)),
  });
  const field = page.getByRole('textbox', { name: 'Check an item' });
  await field.fill('Worcestershire sauce');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  const caution = page.getByText(/Vegan: Worcestershire sauce is often made with something this rules out\. Check the label\./);
  await caution.waitFor({ timeout: 5000 });
  check('flag on: Kitchen caution for Worcestershire sauce (vegan profile)', (await caution.count()) === 1);
  await field.scrollIntoViewIfNeeded();
  await shot(page, '3-kitchen-caution');
  // The fail-safe, live: Jev says 0.02 for everything, the app's own rule still flags bacon.
  await field.fill('bacon');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  const own = page.getByText('Vegan: bacon breaks this setting.');
  await own.waitFor({ timeout: 5000 });
  check('flag on: Jev saying "fine" cannot remove the app’s own caution (bacon, vegan)', (await own.count()) === 1 && log.fn.length === 2);
  await shot(page, '3b-kitchen-app-caution-kept');
  check('flag on: no page errors (kitchen)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
{
  // 4. Price report 100x too high -> confirm step; "send it" still sends it.
  const { ctx, page, log, errors } = await open(browser, {
    signedIn: true,
    hash: '#/shop/pad_thai',
    jev: (route) =>
      json(route, { ok: true, task: 'price_report', answers: { plausible: 0.03, error: 'extra_zero_or_decimal_slip', error_confidence: 0.91 }, confidence: 0.91, ms: 450 }),
  });
  const priceBtn = page.getByRole('button', { name: 'Saw a different price?' }).first();
  await priceBtn.waitFor({ timeout: 15000 });
  const lineText = await priceBtn.innerText();
  const line = Number(lineText.replace(/[^0-9.]/g, ''));
  await priceBtn.click();
  const priceField = page.locator('input[inputmode="decimal"]').last();
  const typed = (line * 100).toFixed(2);
  await priceField.fill(typed);
  await page.getByRole('button', { name: 'Add this price' }).click();
  const alert = page.getByRole('alert').filter({ hasText: 'the usual price here' });
  await alert.waitFor({ timeout: 5000 });
  const text = (await alert.innerText()).replace(/\s+/g, ' ');
  check('flag on: price 100x too high -> confirm step', /about 100× the usual price here/.test(text) && /Did you mean £/.test(text), text);
  check('flag on: nothing was sent before the reader answered', !log.supabase.some((l) => l.startsWith('POST /rest/v1/price_reports')));
  check('flag on: price_report request is typed fields only', JSON.stringify(Object.keys(log.fn[0]?.body?.input || {})) === '["item","amount","currency","country","pack_grams","modelled"]', JSON.stringify(log.fn[0]?.body));
  await alert.scrollIntoViewIfNeeded();
  await shot(page, '4-price-confirm');
  await alert.getByRole('button', { name: 'It is right — send it' }).click();
  await page.waitForTimeout(1500);
  const posted = log.supabase.filter((l) => l.startsWith('POST /rest/v1/price_reports'));
  check('flag on: "send it" sends the typed price anyway (never silently rejected)', posted.length === 1, posted.join(' '));
  check('flag on: no page errors (price)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
await srv.close();

/* ── Flag OFF: same interactions, compared with the commit before this work ── */
async function offRun(dir, label, withCloud = false, extra = {}) {
  srv = await serve(dir);
  const out = {};
  {
    const { ctx, page, log, errors } = await open(browser, { jev: (route) => json(route, cravingAnswer()), ...extra });
    const box = await openRefine(page);
    await box.fill('something cosy and quick');
    await page.waitForTimeout(3000);
    await calm(page);
    out.homeDom = await page.evaluate(() => document.querySelector('main')?.outerHTML || document.body.outerHTML);
    out.homeFn = log.fn.length;
    out.homeOutside = log.outside.slice();
    out.homeSupabase = log.supabase.slice();
    out.errors = errors.slice();
    await shot(page, `5-${label}-home`);
    await ctx.close();
  }
  {
    const { ctx, page, log } = await open(browser, { seed: { ...SEED, diets: ['vegan'] }, hash: '#/kitchen', ...extra });
    await page.waitForTimeout(1500);
    await calm(page);
    out.kitchenDom = await page.evaluate(() => document.querySelector('main')?.outerHTML || document.body.outerHTML);
    out.kitchenField = await page.getByRole('textbox', { name: 'Check an item' }).count();
    out.kitchenFn = log.fn.length;
    await shot(page, `5-${label}-kitchen`);
    await ctx.close();
  }
  if (withCloud) {
    // Signed in, the same 100x price: today it goes straight in, no question.
    const { ctx, page, log } = await open(browser, { signedIn: true, hash: '#/shop/pad_thai' });
    const priceBtn = page.getByRole('button', { name: 'Saw a different price?' }).first();
    await priceBtn.waitFor({ timeout: 15000 });
    const line = Number((await priceBtn.innerText()).replace(/[^0-9.]/g, ''));
    await priceBtn.click();
    await page.locator('input[inputmode="decimal"]').last().fill((line * 100).toFixed(2));
    await calm(page);
    out.reportDom = await page.evaluate(() => document.querySelector('main')?.outerHTML || document.body.outerHTML);
    await page.getByRole('button', { name: 'Add this price' }).click();
    await page.waitForTimeout(1500);
    out.reportPosts = log.supabase.filter((l) => l.startsWith('POST /rest/v1/price_reports')).length;
    out.reportFn = log.fn.length;
    await calm(page);
    out.afterDom = await page.evaluate(() => document.querySelector('main')?.outerHTML || document.body.outerHTML);
    await ctx.close();
  }
  await srv.close();
  return out;
}
// Park the pointer so a hover style left by the last click is not in the snapshot.
async function calm(page) {
  await page.mouse.move(1, 1);
  await page.waitForTimeout(150);
}
// Strip the one thing that legitimately differs between two builds: hashed asset names.
const norm = (h) => h.replace(/-[A-Za-z0-9_-]{8}\.(js|css|webp|png|svg)/g, '.$1');

const mineOff = await offRun(S + '/dist-off', 'flag-off');
const baseOff = await offRun(S + '/base-off', 'base-off');
check('flag off (no Supabase): no request to the function', mineOff.homeFn === 0 && mineOff.kitchenFn === 0);
check('flag off (no Supabase): no chip, no Kitchen check field', !mineOff.homeDom.includes('Read as') && mineOff.kitchenField === 0);
check('flag off (no Supabase): Home DOM identical to the base commit after the same typing', norm(mineOff.homeDom) === norm(baseOff.homeDom), `${mineOff.homeDom.length} vs ${baseOff.homeDom.length} chars`);
check('flag off (no Supabase): Kitchen DOM identical to the base commit', norm(mineOff.kitchenDom) === norm(baseOff.kitchenDom));
check('flag off (no Supabase): exactly the same outside requests as base', JSON.stringify(mineOff.homeOutside) === JSON.stringify(baseOff.homeOutside), JSON.stringify(mineOff.homeOutside));

const mineCloud = await offRun(S + '/dist-cloud', 'flag-off-cloud', true);
const baseCloud = await offRun(S + '/base-cloud', 'base-cloud', true);
check('flag off (Supabase configured): no request to the function', mineCloud.homeFn === 0 && mineCloud.kitchenFn === 0);
check('flag off (Supabase configured): exactly the same outside requests as base', JSON.stringify(mineCloud.homeOutside) === JSON.stringify(baseCloud.homeOutside), JSON.stringify(mineCloud.homeOutside));
check('flag off (Supabase configured): Home DOM identical to base', norm(mineCloud.homeDom) === norm(baseCloud.homeDom));
check('flag off (Supabase configured): Kitchen DOM identical to base', norm(mineCloud.kitchenDom) === norm(baseCloud.kitchenDom));
check('flag off (Supabase configured): price form DOM identical to base', norm(mineCloud.reportDom) === norm(baseCloud.reportDom));
check('flag off (Supabase configured): screen after sending identical to base', norm(mineCloud.afterDom) === norm(baseCloud.afterDom));
// Anything that differed is written out whole, for a person to diff.
for (const [tag, mine, base] of [['off', mineOff, baseOff], ['cloud', mineCloud, baseCloud]]) {
  for (const k of ['homeDom', 'kitchenDom', 'reportDom', 'afterDom']) {
    if (mine[k] !== undefined && norm(mine[k]) !== norm(base[k])) {
      await writeFile(`${S}/diff-${tag}-${k}-mine.html`, norm(mine[k]));
      await writeFile(`${S}/diff-${tag}-${k}-base.html`, norm(base[k]));
    }
  }
}
check('flag off (Supabase configured): a 100x price goes straight in, as before, with no function call', mineCloud.reportPosts === 1 && baseCloud.reportPosts === 1 && mineCloud.reportFn === 0);
check(
  'flag off (Supabase configured): the same Supabase requests as base',
  JSON.stringify(mineCloud.homeSupabase) === JSON.stringify(baseCloud.homeSupabase),
  JSON.stringify(mineCloud.homeSupabase),
);

await browser.close();
await writeFile(`${S}/proof-results.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
