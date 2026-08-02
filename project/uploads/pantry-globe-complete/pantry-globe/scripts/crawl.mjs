// Clicks its way through the whole app and fails on the first JS error.
//
// "The website breaks when pressed" is not something you find by reading code.
// So: open the real built file, click every clickable thing on every screen,
// several levels deep, and record anything the console complains about.
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const DEPTH = Number(process.env.DEPTH || 3);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const errors = [];
page.on('pageerror', e => errors.push({ where: 'pageerror', msg: String(e).slice(0, 300) }));
page.on('console', m => {
  if (m.type() === 'error') {
    const t = m.text();
    // a 404 on a remote photo fallback is a network fact, not a broken app
    if (/favicon|net::ERR|Failed to load resource/i.test(t)) return;
    errors.push({ where: 'console', msg: t.slice(0, 300) });
  }
});

/** Every element a finger could land on, as a stable-ish description. */
async function targets() {
  return page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll('button,[role="button"],a[href],input,select,summary,[data-click]');
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      if (el.disabled) return;
      out.push({ i, tag: el.tagName, label: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40) });
    });
    return out;
  });
}

async function clickNth(n) {
  return page.evaluate(n => {
    const els = [...document.querySelectorAll('button,[role="button"],a[href],input,select,summary,[data-click]')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width >= 4 && r.height >= 4 && !el.disabled; });
    const el = els[n];
    if (!el) return null;
    const label = (el.innerText || el.value || '').trim().slice(0, 40);
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return { label, skipped: true };
    el.click();
    return { label };
  }, n);
}

let clicks = 0;
const seen = new Set();

async function walk(depth, trail) {
  if (depth > DEPTH) return;
  const list = await targets();
  for (const t of list) {
    const key = trail.concat(t.label).join(' > ');
    if (seen.has(key)) continue;
    seen.add(key);
    const before = errors.length;
    let r;
    try { r = await clickNth(t.i); } catch (e) { errors.push({ where: 'click', msg: `${key}: ${e}` }); continue; }
    if (!r || r.skipped) continue;
    clicks++;
    await page.waitForTimeout(45);
    if (errors.length > before) {
      for (let k = before; k < errors.length; k++) errors[k].trail = key;
    }
    await walk(depth + 1, trail.concat(t.label));
    // back to a known state so the next sibling click means what it says
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(120);
    for (const step of trail) {
      const l = await targets();
      const m = l.find(x => x.label === step);
      if (!m) break;
      await clickNth(m.i);
      await page.waitForTimeout(45);
    }
  }
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const booted = await page.evaluate(() => document.body.innerText.trim().length);
if (booted < 40) errors.push({ where: 'boot', msg: 'app rendered almost nothing' });

await walk(1, []);

// images that never resolved
const brokenImgs = await page.evaluate(() =>
  [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.slice(-60)));

await browser.close();

console.log(`\nclicked ${clicks} controls, ${seen.size} paths, depth ${DEPTH}`);
if (brokenImgs.length) console.log(`broken images on last screen: ${brokenImgs.length}`);
if (!errors.length) { console.log('no JS errors'); process.exit(0); }
console.log(`\n${errors.length} problem(s):`);
for (const e of errors.slice(0, 40)) console.log(`  [${e.where}] ${e.trail ? e.trail + ' :: ' : ''}${e.msg}`);
process.exit(1);
