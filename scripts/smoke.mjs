/**
 * Browser smoke test: every screen, in six languages, at phone and desktop
 * width, in the real built app.
 *
 *   npm run smoke                      build, then the whole matrix (about a minute)
 *   npm run smoke -- --no-build        reuse the last build
 *   npm run smoke -- --only=ar         profiles whose id contains "ar"
 *   npm run smoke -- --shots           a screenshot per page, in smoke-results/shots/
 *   npm run smoke -- --strict          warnings (overflow, console errors) fail too
 *   npm run smoke -- --jobs=3          how many people are driven at once
 *
 * Why it exists: tsc and vitest can both be green while the app throws for
 * everybody who has a diet set — a const helper in usePantry called above its
 * definition only fails at runtime, and only on the code path that reaches it.
 * The only test for that is to open the app as those people and look.
 *
 * Who it opens the app as: a first-time visitor (the welcome carousel, Next
 * to the last card, Back once, Skip), then seven seeded profiles chosen to
 * cover both right-to-left languages, a whole-unit currency and every diet
 * family. Each one visits every screen by hash and presses the buttons most
 * likely to take a screen down: "Show me another" on Home, every category
 * chip on Browse, Done twice and "I've lost the thread" open and shut on Cook.
 *
 * What counts, per page:
 *   FAIL  crash       the error boundary or the crash net is on screen (matched
 *                     by its title in all six languages, so a crash in Urdu is
 *                     not mistaken for a heading)
 *   FAIL  pageerror   an uncaught exception
 *   FAIL  render-threw  Boundary's own console line
 *   FAIL  http        a same-origin response of 400 or more — the server here
 *                     follows public/_redirects, so a missing chunk or photo is
 *                     a 404 rather than the index shell answered with a 200
 *   FAIL  request-failed  a same-origin request that never completed
 *   FAIL  broken-image    a same-origin <img> that finished loading with no pixels
 *   FAIL  blank / interaction / seed  the page never drew, a button this test
 *                     presses was not there, or the profile did not survive boot
 *   FAIL  stopped     three crash screens in a row: the app is down for that
 *                     person, and the run moves on to the next one
 *   WARN  overflow    the page, or .pg-main, is wider than the screen; the
 *                     detail names the elements that stick out
 *   WARN  console-error   any other console error mentioning "Error"
 *   WARN  route       the app rewrote the hash to somewhere else
 *
 * Requests to any other host are aborted by design (the app is offline here,
 * on bundled rates and modelled shops) and never reported.
 *
 * Exit 0 clean or warnings only, 1 on any failure, 2 if the test itself could
 * not run. Needs Playwright, which is in node_modules but deliberately not in
 * package.json: npm i --no-save playwright. Chromium is found the same way the
 * Jev harness finds it (JEV_CHROMIUM, then the sandbox's copy).
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildApp, launch, openContext, serve } from './jev/app-driver.mjs';
import { EXTRA, LANGS, RECIPES, pack, strings } from './jev/app.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const APP = join(ROOT, 'node_modules/.cache/smoke-app');
const OUT = join(ROOT, 'smoke-results');

const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const opt = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : dflt;
};
const SHOTS = flag('shots');
const STRICT = flag('strict');
const ONLY = opt('only', '');
const JOBS = Math.max(1, Number(opt('jobs', 3)) || 3);

const PHONE = { width: 360, height: 780 };
const DESK = { width: 1280, height: 800 };

/* One dish with a photograph and one with a drawing, because the two go
   through different branches of DishPic and different files on disk. Checked
   against the cookbook below, so a renamed id fails loudly rather than
   quietly smoke-testing the fallback dish. */
const DISHES = ['pad_thai', 'aloo_gobi'];
for (const [id, ext] of [[DISHES[0], '.webp'], [DISHES[1], '.svg']]) {
  const r = RECIPES.find((x) => x.id === id);
  if (!r || !r.pic.endsWith(ext)) {
    console.error(`smoke: ${id} is no longer a dish with a ${ext} picture — pick another from RECIPES`);
    process.exit(2);
  }
}

const SCREENS = ['home', 'browse', 'kitchen', 'plan', 'passport', 'stats', 'settings', 'locate', 'privacy', 'terms'];

const PROFILES = [
  { id: 'en-GB', lang: 'en', country: 'GB', diets: [], desk: true },
  { id: 'en-US-vegan+gluten_free', lang: 'en', country: 'US', diets: ['vegan', 'gluten_free'] },
  { id: 'ar-AE-halal', lang: 'ar', country: 'AE', diets: ['halal'], desk: true },
  { id: 'ur-PK', lang: 'ur', country: 'PK', diets: [] },
  { id: 'pl-NG-kosher', lang: 'pl', country: 'NG', diets: ['kosher'] },
  { id: 'fr-DE-dairy_free', lang: 'fr', country: 'DE', diets: ['dairy_free'] },
  { id: 'es-IN-nut_free', lang: 'es', country: 'IN', diets: ['nut_free'] },
];

/* The words on the buttons this test presses, read from the app's own
   language files rather than copied here, so a reworded button moves with
   the app. Straight from each file, English-backed per key the way the
   accessors are — the accessors themselves would answer English in Node,
   where no language chunk is ever fetched. */
const EN_T = strings('en');
const EN_U = pack('en').u;
function labels(lang) {
  const m = LANGS[lang];
  const s = (k) => m?.strings?.[k] ?? EN_T[k];
  const x = (k) => m?.extra?.[k] ?? EXTRA.en[k];
  return {
    next: s('tierNext'),
    back: s('back'),
    skip: s('tierSkip'),
    another: x('another'),
    stepBack: x('stepBack'),
    lost: s('cookLost'),
    gotIt: m?.pack?.u?.gotIt ?? EN_U.gotIt,
  };
}
/** The crash screen's title in every language: Boundary and the crash net
 *  both put it in an h1 inside role="alert". */
const CRASH_TITLES = ['en', ...Object.keys(LANGS)].map((l) => LANGS[l]?.extra?.crashTitle ?? EXTRA.en.crashTitle);

/** Thrown by look() to end a run whose every screen is the crash screen. */
class Down extends Error {}

const findings = [];
const runs = [];

/**
 * One person at one width, start to finish, in a context of their own.
 * Everything the page reports is attributed to `at.screen`, whatever the test
 * was last looking at when the event arrived.
 */
async function drive(browser, port, who, viewport) {
  const origin = `http://127.0.0.1:${port}`;
  const same = (u) => typeof u === 'string' && u.startsWith(origin);
  /* `crashed` is the page just looked at; `down` counts crashed pages in a
     row. Three means the state layer itself is throwing and every screen will
     say the same thing, so the run stops there rather than timing out on
     forty buttons that are not on a crash screen. */
  const at = { screen: 'boot', n: 0, crashed: false, down: 0 };
  const width = viewport.width;
  const add = (kind, detail) => findings.push({ profile: who.id, width, screen: at.screen, kind, detail: String(detail).slice(0, 400) });

  const seed = who.fresh ? null : { seen: true, lang: who.lang, country: who.country, diets: who.diets };
  const ctx = await openContext(browser, port, seed, { viewport, locale: who.fresh ? 'en-GB' : `${who.lang}-${who.country}` });
  const page = await ctx.newPage();
  const L = labels(who.lang);
  const t0 = Date.now();

  /* In-flight same-origin requests, so "settled" can mean the network went
     quiet rather than a guessed sleep. */
  let inflight = 0;
  let lastNet = Date.now();
  const done = (r) => {
    if (!same(r.url())) return;
    inflight = Math.max(0, inflight - 1);
    lastNet = Date.now();
  };
  page.on('request', (r) => {
    if (!same(r.url())) return;
    inflight++;
    lastNet = Date.now();
  });
  page.on('requestfinished', done);
  page.on('requestfailed', (r) => {
    done(r);
    // An image dropped because its screen was left is not a failure.
    const why = r.failure()?.errorText || 'failed';
    if (same(r.url()) && !/ERR_ABORTED/.test(why)) add('request-failed', `${why} ${r.url().slice(origin.length)}`);
  });
  page.on('response', (r) => {
    if (same(r.url()) && r.status() >= 400) add('http', `${r.status()} ${r.url().slice(origin.length)}`);
  });
  page.on('pageerror', (e) => add('pageerror', e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = m.location()?.url || '';
    if (where && !same(where)) return; // the blocked outside world saying so
    // The first line: the message. The stack is minified and the same every time.
    const text = m.text().split('\n')[0];
    if (/render threw/.test(text)) add('render-threw', text);
    else if (/Error/.test(text)) add('console-error', text);
  });

  const settle = async () => {
    const until = Date.now() + 6000;
    while (Date.now() < until && (inflight > 0 || Date.now() - lastNet < 250)) await page.waitForTimeout(50);
    // Pictures that were asked for, decoded — or failed, which is the point.
    await page
      .evaluate(() =>
        Promise.race([
          Promise.all([...document.images].filter((i) => !i.complete && i.loading !== 'lazy').map((i) => i.decode().catch(() => {}))),
          new Promise((r) => setTimeout(r, 3000)),
        ]),
      )
      .catch(() => {});
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  };

  /** Walk .pg-main to the bottom and back, so every lazy picture on the page
   *  is asked for and gets its turn at the broken-image check. */
  const scrollThrough = async () => {
    for (let i = 0; i < 60; i++) {
      const more = await page.evaluate(() => {
        const m = document.querySelector('.pg-main');
        if (!m || m.scrollTop + m.clientHeight >= m.scrollHeight - 2) return false;
        m.scrollTop += m.clientHeight;
        return true;
      });
      if (!more) break;
      await page.waitForTimeout(60);
      await settle();
    }
    await page.evaluate(() => {
      const m = document.querySelector('.pg-main');
      if (m) m.scrollTop = 0;
    });
  };

  /** Everything this test looks at on one page, read in one pass. */
  const look = async (screen) => {
    at.screen = screen;
    await settle();
    const r = await page.evaluate(
      ({ titles, origin }) => {
        const out = { crash: null, blank: false, over: [], broken: [] };
        for (const a of document.querySelectorAll('[role="alert"]')) {
          const h = a.querySelector('h1');
          if (h && titles.includes(h.textContent.trim())) {
            out.crash = (a.querySelector('div[dir="ltr"]') || a.lastElementChild || a).textContent.trim() || '(no message)';
          }
        }
        const main = document.querySelector('.pg-main');
        if (!out.crash && (!main || !main.textContent.trim())) out.blank = true;

        /* Who is sticking out: elements that cross the edge of .pg-main (or
           the window) and are not inside something meant to scroll sideways.
           Only the outermost offender of each branch, so a wide row reports
           once rather than once per chip in it. */
        const clipped = (el, stop) => {
          for (let p = el.parentElement; p && p !== stop; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox !== 'visible') return true;
          }
          return false;
        };
        const culprits = (box, scope) => {
          const hits = [];
          for (const el of scope.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (!r.width || (r.right <= box.right + 1 && r.left >= box.left - 1)) continue;
            if (getComputedStyle(el).position === 'fixed' || clipped(el, scope)) continue;
            if (hits.some((h) => h.el.contains(el))) continue;
            const name = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
            const text = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
            const px = Math.round(Math.max(r.right - box.right, box.left - r.left));
            hits.push({ el, say: `${name}${text ? ` "${text}"` : ''} +${px}px` });
            if (hits.length >= 3) break;
          }
          return hits.map((h) => h.say).join('; ');
        };
        const d = document.documentElement;
        if (d.scrollWidth > d.clientWidth + 1) {
          out.over.push(`page ${d.scrollWidth}px in ${d.clientWidth}px: ${culprits({ left: 0, right: d.clientWidth }, document.body)}`);
        }
        if (main && main.scrollWidth > main.clientWidth + 1) {
          out.over.push(`.pg-main ${main.scrollWidth}px in ${main.clientWidth}px: ${culprits(main.getBoundingClientRect(), main)}`);
        }
        for (const i of document.images) {
          const src = i.currentSrc || i.src;
          if (src.startsWith(origin) && i.complete && i.naturalWidth === 0) out.broken.push(src.slice(origin.length));
        }
        return out;
      },
      { titles: CRASH_TITLES, origin },
    );
    if (r.crash) add('crash', r.crash);
    at.crashed = !!r.crash;
    at.down = r.crash ? at.down + 1 : 0;
    if (r.blank) add('blank', 'nothing rendered in .pg-main');
    for (const o of r.over) add('overflow', o);
    for (const b of r.broken) add('broken-image', b);
    at.n++;
    if (SHOTS) {
      const slug = `${who.id}_${width}_${String(at.n).padStart(2, '0')}-${screen}`.replace(/[^\w.+-]+/g, '-').replace(/-+$/, '');
      await page.screenshot({ path: join(OUT, 'shots', slug + '.png') }).catch(() => {});
    }
    if (at.down >= 3) throw new Down();
  };

  /** Press something, or say which button was missing and carry on. */
  const press = async (locator, what) => {
    if (at.crashed) return false; // already reported, and the button is not there to press
    try {
      await locator.first().click({ timeout: 4000 });
      return true;
    } catch (e) {
      add('interaction', `could not press ${what}: ${String(e.message).split('\n')[0]}`);
      return false;
    }
  };

  const go = async (hash) => {
    await page.evaluate((h) => {
      location.hash = h;
    }, hash);
    const want = hash.split('/')[1];
    const ok = await page
      .waitForFunction((w) => location.hash.split('/')[1] === w, want, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) add('route', `asked for ${hash}, the app is on ${await page.evaluate(() => location.hash)}`);
  };

  try {
    await page.goto(origin + '/');
    await page.waitForSelector('.pg-main, [role="alert"]', { timeout: 15000 });

    if (who.fresh) {
      /* The first visit: five cards, Next to the last, Back once, Skip. */
      await look('welcome 1');
      for (let i = 2; i <= 5; i++) {
        if (!(await press(page.getByRole('button', { name: L.next, exact: true }), `Next (to card ${i})`))) break;
        await look(`welcome ${i}`);
      }
      if (await press(page.getByRole('button', { name: L.back, exact: true }), 'Back')) await look('welcome back');
      if (await press(page.getByRole('button', { name: L.skip, exact: true }), 'Skip')) {
        await page.waitForFunction(() => /home/.test(location.hash), null, { timeout: 5000 }).catch(() => {});
        await look('home after skip');
      }
      return;
    }

    const kept = await page.evaluate(() => {
      try {
        return { hash: location.hash, s: JSON.parse(localStorage.getItem('pantry.v1') || '{}') };
      } catch {
        return { hash: location.hash, s: {} };
      }
    });
    if (!/home/.test(kept.hash)) add('seed', `boot landed on ${kept.hash || '/'} rather than Home`);
    for (const k of ['lang', 'country', 'diets']) {
      if (JSON.stringify(kept.s[k]) !== JSON.stringify(seed[k])) add('seed', `${k}: sent ${JSON.stringify(seed[k])}, the app kept ${JSON.stringify(kept.s[k])}`);
    }

    for (const screen of SCREENS) {
      if (screen !== 'home') await go(`#/${screen}`);
      await look(screen);

      if (screen === 'home') {
        for (let i = 1; i <= 2; i++) {
          if (await press(page.getByRole('button', { name: L.another, exact: true }), '"Show me another"')) await look(`home another ${i}`);
        }
      }
      if (screen === 'browse') {
        await scrollThrough();
        await look('browse scrolled');
        // The category chips are the first sideways row on the screen.
        const chips = page.locator('.pg-main .pg-x').first().locator('button');
        const n = await chips.count();
        if (!n) add('interaction', 'no category chips on Browse');
        for (let i = 0; i < n; i++) {
          const name = (await chips.nth(i).innerText().catch(() => '')).trim();
          if (await press(chips.nth(i), `chip ${i + 1}`)) await look(`browse chip ${i + 1} ${name}`);
        }
      }
    }

    for (const dish of DISHES) {
      for (const screen of ['results', 'shop', 'cook']) {
        await go(`#/${screen}/${dish}`);
        await look(`${screen}/${dish}`);
      }
      // Done is the button after Back, whatever it says on the last step.
      const done = page.getByRole('button', { name: L.stepBack, exact: true }).locator('xpath=following-sibling::button[1]');
      for (let i = 1; i <= 2; i++) {
        if (await press(done, `Done (step ${i})`)) await look(`cook/${dish} done ${i}`);
      }
      if (await press(page.getByRole('button', { name: L.lost, exact: true }), "I've lost the thread")) {
        await look(`cook/${dish} lost open`);
        if (await press(page.getByRole('button', { name: L.gotIt, exact: true }), 'the lost-thread close')) await look(`cook/${dish} lost shut`);
      }
    }
  } catch (e) {
    if (e instanceof Down) add('stopped', `${at.down} crashed screens in a row: the whole app is down for this profile, so the rest were not visited`);
    else add('harness', String(e.message || e).split('\n')[0]);
  } finally {
    runs.push({ profile: who.id, width, pages: at.n, seconds: Math.round((Date.now() - t0) / 100) / 10 });
    await ctx.close();
  }
}

const FAILING = new Set(['crash', 'stopped', 'pageerror', 'render-threw', 'http', 'request-failed', 'broken-image', 'blank', 'interaction', 'seed', 'harness']);
const levelOf = (kind) => (FAILING.has(kind) || STRICT ? 'FAIL' : 'WARN');

async function main() {
  const started = Date.now();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(SHOTS ? join(OUT, 'shots') : OUT, { recursive: true });

  const who = [{ id: 'fresh-visitor', lang: 'en', fresh: true }, ...PROFILES].filter((p) => p.id.includes(ONLY));
  if (!who.length) {
    console.error(`smoke: no profile id contains "${ONLY}". Ids: fresh-visitor, ${PROFILES.map((p) => p.id).join(', ')}`);
    process.exit(2);
  }
  const jobs = who.map((p) => [p, PHONE]).concat(who.filter((p) => p.desk).map((p) => [p, DESK]));

  let browser;
  try {
    buildApp({ rebuild: !flag('no-build'), dir: APP, why: 'the smoke test' });
    browser = await launch();
  } catch (e) {
    console.error('smoke: ' + (e.message || e));
    process.exit(2);
  }
  const server = await serve(APP, { hostRules: true });
  console.log(`  ${jobs.length} runs (${who.length} people), ${JOBS} at a time`);
  try {
    const queue = [...jobs];
    await Promise.all(
      Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
        while (queue.length) {
          const [p, vp] = queue.shift();
          await drive(browser, server.port, p, vp);
        }
      }),
    );
  } finally {
    await browser.close();
    await server.close();
  }

  for (const f of findings) f.level = levelOf(f.kind);
  const fails = findings.filter((f) => f.level === 'FAIL');
  const warns = findings.filter((f) => f.level === 'WARN');
  const order = new Map(jobs.map(([p, vp], i) => [p.id + vp.width, i]));
  runs.sort((a, b) => order.get(a.profile + a.width) - order.get(b.profile + b.width));
  writeFileSync(
    join(OUT, 'summary.json'),
    JSON.stringify({ when: new Date().toISOString(), strict: STRICT, only: ONLY || null, seconds: Math.round((Date.now() - started) / 1000), runs, fails: fails.length, warnings: warns.length, findings }, null, 2) + '\n',
  );

  console.log('\n  profile                       width  pages  fail  warn   secs');
  for (const r of runs) {
    const mine = findings.filter((f) => f.profile === r.profile && f.width === r.width);
    const nf = mine.filter((f) => f.level === 'FAIL').length;
    const nw = mine.length - nf;
    console.log(`  ${r.profile.padEnd(29)} ${String(r.width).padStart(5)}  ${String(r.pages).padStart(5)}  ${String(nf).padStart(4)}  ${String(nw).padStart(4)}  ${String(r.seconds).padStart(5)}`);
  }

  /* The same finding on the same screen for several people is one line with
     their names on it — six copies of one overflow would bury a crash. */
  const grouped = new Map();
  for (const f of [...fails, ...warns]) {
    const key = [f.level, f.kind, f.screen, f.width, f.detail].join('\u0000');
    if (!grouped.has(key)) grouped.set(key, { ...f, who: [] });
    grouped.get(key).who.push(f.profile);
  }
  if (grouped.size) console.log('');
  let shown = 0;
  for (const g of grouped.values()) {
    if (shown++ >= 60) {
      console.log(`  … ${grouped.size - 60} more in smoke-results/summary.json`);
      break;
    }
    console.log(`  ${g.level} ${g.kind.padEnd(14)} ${g.width} ${g.screen.padEnd(22)} ${g.who.join(', ')}\n       ${g.detail}`);
  }
  const broke = [...new Set(fails.map((f) => `${f.profile} @${f.width}`))];
  if (broke.length) console.log(`\n  FAILED for: ${broke.join(', ')}`);
  console.log(`\n  ${fails.length} failure(s), ${warns.length} warning(s) in ${Math.round((Date.now() - started) / 1000)}s -> smoke-results/summary.json${SHOTS ? ' + shots/' : ''}`);
  process.exit(fails.length ? 1 : 0);
}

await main();
