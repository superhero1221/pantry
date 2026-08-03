/**
 * Serve dist/ with the EXACT headers from public/_headers, then drive the app
 * and fail on any CSP violation or lost styling.
 *
 * vite preview does not read _headers (it is Netlify's format), so without this
 * the policy would first be exercised on the live domain, which is the worst
 * possible place to discover that style-src-attr was spelled wrong.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('../dist', import.meta.url).pathname;
const HEADERS = readFileSync(new URL('../public/_headers', import.meta.url).pathname, 'utf8');

// Parse _headers: a path line, then indented "Key: value" lines under it.
const rules = [];
let cur = null;
for (const raw of HEADERS.split('\n')) {
  if (!raw.trim() || raw.trim().startsWith('#')) continue;
  if (!/^\s/.test(raw)) {
    cur = { path: raw.trim(), headers: [] };
    rules.push(cur);
  } else if (cur) {
    const at = raw.indexOf(':');
    cur.headers.push([raw.slice(0, at).trim(), raw.slice(at + 1).trim()]);
  }
}
const matches = (pattern, url) =>
  pattern === '/*' ? true : pattern.endsWith('/*') ? url.startsWith(pattern.slice(0, -1)) : url === pattern;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];
  let file = join(ROOT, url === '/' ? 'index.html' : url);
  if (!existsSync(file) || !statSync(file).isFile()) file = join(ROOT, 'index.html');
  const applied = {};
  for (const r of rules) if (matches(r.path, url)) for (const [k, v] of r.headers) applied[k] = v;
  for (const [k, v] of Object.entries(applied)) res.setHeader(k, v);
  if (!applied['Content-Type']) res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
  res.end(readFileSync(file));
});

await new Promise((r) => server.listen(4180, r));

const { chromium } = await import('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
const p = await ctx.newPage();

const violations = [];
const errs = [];
p.on('console', (m) => {
  const t = m.text();
  if (/Content Security Policy|Refused to/i.test(t)) violations.push(t.slice(0, 160));
  else if (m.type() === 'error' && !/frankfurter|ERR_|favicon/i.test(t)) errs.push(t.slice(0, 120));
});
p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));

await p.addInitScript(() => {
  if (!localStorage.getItem('pantry.v1'))
    localStorage.setItem('pantry.v1', JSON.stringify({ seen: true, country: 'GB', budget: 6, maxTime: 999, lang: 'en' }));
});
await p.goto('http://localhost:4180/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1200);

// Did the design survive? The accent pill and Caprasimo are the two tells.
const look = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const accent = btns.find((b) => getComputedStyle(b).backgroundColor === 'rgb(198, 113, 57)');
  const h1 = document.querySelector('h1');
  return {
    styledButtons: btns.filter((b) => getComputedStyle(b).borderRadius !== '0px').length,
    accentPresent: !!accent,
    displayFont: h1 ? getComputedStyle(h1).fontFamily : '(no h1)',
    bg: getComputedStyle(document.querySelector('.pg-shell') || document.body).backgroundColor,
  };
});
console.log('styling  :', JSON.stringify(look));

// Walk the app so more of the policy is exercised.
for (const hash of ['#/browse', '#/kitchen', '#/stats', '#/passport', '#/settings', '#/plan']) {
  await p.goto('http://localhost:4180/' + hash, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(400);
}
// A cook, which touches images, the service worker scope and the plate input.
await p.goto('http://localhost:4180/#/home', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(300);
await p.getByRole('textbox', { name: /fancy/i }).fill('omelette');
await p.getByRole('button', { name: /Find me|Show me/i }).first().click();
await p.waitForTimeout(500);
await p.getByRole('button', { name: 'Cook this', exact: true }).click();
await p.waitForTimeout(600);

const imgs = await p.evaluate(() =>
  [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length);
console.log('broken images:', imgs);
console.log('CSP violations:', violations.length);
violations.slice(0, 8).forEach((v) => console.log('   !', v));
console.log('other errors  :', errs.length);
errs.slice(0, 5).forEach((e) => console.log('   ?', e));

await b.close();
server.close();
process.exitCode = violations.length || imgs || !look.accentPresent ? 1 : 0;
console.log(process.exitCode ? '\nFAIL — the policy breaks the app' : '\nPASS — app is intact under the real CSP');
