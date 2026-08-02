import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'en-GB' });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
await p.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: '/tmp/s1.png' });

await p.evaluate(() => document.querySelectorAll('.card')[1].click());
await p.waitForTimeout(900);
await p.screenshot({ path: '/tmp/s2.png' });

await p.evaluate(() => window.scrollTo(0, 620));
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/s3.png' });

await p.evaluate(() => window.scrollTo(0, 1500));
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/s4.png' });

console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no JS errors');
console.log(await p.evaluate(() => {
  const i = [...document.images];
  return `${i.filter(x => x.naturalWidth > 0).length}/${i.length} images loaded`;
}));
await b.close();
