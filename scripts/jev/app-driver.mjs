/**
 * The real app, built and driven headlessly, as ground truth for the dish pick.
 *
 * Home's "tonight" pick is `ranked()` inside the usePantry hook, closed over
 * a dozen pieces of state (cupboard, extras, store multiplier, profile,
 * level). It is not a pure function and the harness does not refactor app
 * code to make it one, so instead it asks the app itself: build it, serve it
 * locally, seed a profile, open Home, read the dish, press "Show me another",
 * read the next one.
 *
 * Seeding: the profile has to be in localStorage['pantry.v1'] BEFORE the
 * app's first script runs, so it goes in through addInitScript. Every key
 * must pass the SHAPE gate in usePantry.ts or it is dropped on load (budget a
 * finite number in 0..1000 GBP, level an integer 1..4, diets an array...), and
 * `seen: true` is what sends boot to Home rather than the welcome carousel.
 * A sessionStorage marker stops the seed being re-applied on any in-page
 * navigation, so the app's own saves are never overwritten mid-scenario.
 *
 * Everything outbound is aborted and service workers are blocked, so the run
 * is offline and deterministic: bundled exchange rates, modelled shops.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
export const APP_DIR = join(ROOT, 'node_modules/.cache/jev-app');
const DEFAULT_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** vite build into a private directory, so dist/ is never touched. */
export function buildApp({ rebuild = true, say = console.log } = {}) {
  if (!rebuild && existsSync(join(APP_DIR, 'index.html'))) return;
  say('  building the app for the pick check (vite build -> node_modules/.cache/jev-app)');
  const r = spawnSync(join(ROOT, 'node_modules/.bin/vite'), ['build', '--outDir', APP_DIR, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, BASE_PATH: '/' },
  });
  if (r.status !== 0) throw new Error('vite build failed:\n' + (r.stderr || r.stdout));
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

/** A static server with an index.html fallback. Local only. */
export function serve(dir = APP_DIR) {
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
    srv.listen(0, '127.0.0.1', () => ok({ port: srv.address().port, close: () => new Promise((c) => srv.close(c)) }));
  });
}

export async function launch() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error("the pick check needs Playwright ('playwright' is not installed here). Install it without saving: npm i --no-save playwright && npx playwright install chromium");
  }
  const exe = process.env.JEV_CHROMIUM || (existsSync(DEFAULT_CHROME) ? DEFAULT_CHROME : undefined);
  return chromium.launch(exe ? { executablePath: exe } : {});
}

/**
 * Seed a profile, open Home, and read the first `n` dishes the app offers,
 * in order: the pick, then each "Show me another".
 *
 * Each entry: { title, card, alert } — the h1, the text of the card under it
 * (cuisine, minutes, price range, shops), and the diet-clash alert if one is
 * on screen.
 */
export async function readOffers(browser, port, seed, { n = 5, anotherLabel }) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', locale: 'en-GB' });
  try {
    await ctx.addInitScript((s) => {
      try {
        if (!sessionStorage.getItem('jev.seeded')) {
          localStorage.clear();
          localStorage.setItem('pantry.v1', JSON.stringify(s));
          sessionStorage.setItem('jev.seeded', '1');
        }
      } catch {
        /* nothing to do: the check below will notice */
      }
    }, seed);
    const origin = `http://127.0.0.1:${port}`;
    await ctx.route((u) => !u.href.startsWith(origin), (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(origin + '/');
    await page.waitForSelector('h1', { timeout: 15000 });
    const hash = await page.evaluate(() => location.hash);
    if (!/home/.test(hash)) throw new Error(`seed did not reach Home (landed on ${hash || '/'}) — check the seed against SHAPE in usePantry.ts`);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pantry.v1') || '{}'));
    for (const k of ['diets', 'maxTime', 'budget', 'level', 'country']) {
      if (JSON.stringify(stored[k]) !== JSON.stringify(seed[k])) throw new Error(`seed key ${k} did not survive boot: sent ${JSON.stringify(seed[k])}, app kept ${JSON.stringify(stored[k])}`);
    }
    const out = [];
    const again = page.getByRole('button', { name: anotherLabel, exact: true });
    for (let i = 0; i < n; i++) {
      const before = (await page.locator('h1').first().innerText()).trim();
      const info = await page.evaluate(() => {
        const h = document.querySelector('h1');
        const parts = [];
        let el = h;
        while ((el = el.nextElementSibling) && el.tagName !== 'BUTTON') {
          if (el.getAttribute('role') !== 'alert' && el.getAttribute('role') !== 'status') parts.push(el.innerText.trim());
        }
        const alert = document.querySelector('main [role="alert"]');
        return { card: parts.filter(Boolean).join(' | '), alert: alert ? alert.innerText.trim() : null };
      });
      out.push({ title: before, ...info });
      if (i < n - 1) {
        await again.click();
        await page.waitForFunction((b) => document.querySelector('h1')?.innerText.trim() !== b, before, { timeout: 5000 }).catch(() => {});
      }
    }
    return out;
  } finally {
    await ctx.close();
  }
}
