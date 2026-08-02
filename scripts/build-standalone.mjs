/**
 * Fold the whole app into one HTML file.
 *
 * Everything goes inline — the bundle, the stylesheet, the dish photographs as
 * data URIs, and the two webfonts the design depends on. The result runs from
 * a file:// path, an email attachment or a hosted page with a strict CSP,
 * with no server and no network. It is how you hand someone the app to look
 * at rather than a description of it.
 *
 *   STANDALONE=1 npx vite build && node scripts/build-standalone.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const args = process.argv.slice(2);
// --fragment emits body content only, for hosts that supply their own document
const FRAGMENT = args.includes('--fragment');
const OUT =
  args.find((a) => !a.startsWith('--')) ||
  join(ROOT, 'dist', FRAGMENT ? 'pantry-fragment.html' : 'pantry-standalone.html');

const CHROME =
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const curl = (url) =>
  execFileSync('curl', ['-sL', '-A', UA, url], { maxBuffer: 64 * 1024 * 1024 });

/* ── Fonts ──────────────────────────────────────────────────────────────
   Caprasimo and Figtree, latin only. The Arabic and Urdu screens fall back
   to the system face either way — neither family carries those scripts. */
function inlineFonts() {
  // The faces live in public/fonts, so this needs no network and cannot come
  // out in Times because a CDN was unreachable at build time. Each url() is
  // swapped for the base64 of the file it points at.
  const local = join(ROOT, 'public', 'fonts', 'fonts.css');
  if (existsSync(local)) {
    const out = readFileSync(local, 'utf8').replace(
      /url\(\/fonts\/([^)]+)\)/g,
      (_, file) =>
        `url(data:font/woff2;base64,${readFileSync(join(ROOT, 'public', 'fonts', file)).toString('base64')})`,
    );
    console.log(`  fonts: ${(out.match(/@font-face/g) || []).length} faces inlined from disk`);
    return out;
  }

  const href =
    'https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;500;600;700;800&display=swap';
  let cssText;
  try {
    cssText = curl(href).toString('utf8');
  } catch {
    console.warn('! could not reach Google Fonts — the page will use system faces');
    return '';
  }

  const blocks = cssText.split('@font-face').slice(1);
  const wanted = blocks.filter((b) => /unicode-range:[^;]*U\+0000-00FF/.test(b));
  const out = [];

  for (const block of wanted) {
    const url = /url\((https:[^)]+\.woff2)\)/.exec(block)?.[1];
    if (!url) continue;
    try {
      const bytes = curl(url);
      const data = `data:font/woff2;base64,${bytes.toString('base64')}`;
      out.push('@font-face' + block.replace(url, data).split('}')[0] + '}');
    } catch {
      /* one missing weight is survivable */
    }
  }
  console.log(`  fonts: ${out.length} faces inlined`);
  return out.join('\n');
}

/* ── Photographs ────────────────────────────────────────────────────────
   Re-encoded through a headless Chromium: the originals are sized for a
   retina hero and the page only ever shows them at 390 CSS px, so this
   trades bytes nobody sees for a file you can actually open. */
async function inlinePhotos() {
  const dir = join(ROOT, 'public', 'pix');
  const names = readdirSync(dir).filter((f) => f.endsWith('.webp'));
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();

  const map = {};
  let before = 0;
  let after = 0;

  for (const name of names) {
    const raw = readFileSync(join(dir, name));
    before += raw.length;
    const src = `data:image/webp;base64,${raw.toString('base64')}`;
    const encoded = await page.evaluate(
      ([dataUrl, maxWidth]) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, maxWidth / img.naturalWidth);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/webp', 0.74));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        }),
      [src, 620],
    );
    const best = encoded.length < src.length ? encoded : src;
    after += Math.round((best.length * 3) / 4);
    map['pix/' + name] = best;
  }

  await browser.close();
  console.log(
    `  photos: ${names.length} files, ${Math.round(before / 1024)}kB → ${Math.round(after / 1024)}kB`,
  );
  return map;
}

/* ── Assemble ───────────────────────────────────────────────────────── */
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assets = readdirSync(join(DIST, 'assets'));
const jsName = assets.find((f) => f.endsWith('.js'));
const cssName = assets.find((f) => f.endsWith('.css'));
if (!jsName) throw new Error('no bundle in dist/assets — run the vite build first');

let js = readFileSync(join(DIST, 'assets', jsName), 'utf8');
const css = cssName ? readFileSync(join(DIST, 'assets', cssName), 'utf8') : '';

const photos = await inlinePhotos();
for (const [path, data] of Object.entries(photos)) {
  js = js.split(JSON.stringify(path)).join(JSON.stringify(data));
  js = js.split(path).join(data);
}

const favicon = existsSync(join(ROOT, 'public', 'favicon.svg'))
  ? 'data:image/svg+xml;base64,' +
    readFileSync(join(ROOT, 'public', 'favicon.svg')).toString('base64')
  : '';

const fonts = inlineFonts();

// `</script>` inside a string literal would close the tag we are writing into.
const safeJs = js.split('</script>').join('<\\/script>');

const page = html
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link[^>]*fonts\.googleapis[^>]*>\s*/g, '')
  // The self-hosted faces are inlined as data URIs below, so the stylesheet
  // link and its two preloads would be three dead requests in a file:// page.
  .replace(/<link[^>]*\/fonts\/[^>]*>\s*/g, '')
  .replace(/<link rel="manifest"[^>]*>\s*/g, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '')
  .replace(/<link rel="icon"[^>]*>/, () => (favicon ? `<link rel="icon" href="${favicon}">` : ''))
  .replace(/<script type="module"[^>]*><\/script>/, '')
  .replace(/<link rel="stylesheet"[^>]*>\s*/g, '')
  // Replacer FUNCTIONS, not strings: a minified bundle is full of `$` and
  // `String.replace` would read `$&` and `` $` `` as backreferences, splicing
  // the document into itself. That is a five-megabyte mistake.
  .replace('</head>', () => `<style>${fonts}\n${css}</style>\n</head>`)
  .replace('</body>', () => `<script type="module">${safeJs}</script>\n</body>`);

const fragment = [
  `<style>${fonts}\n${css}</style>`,
  '<div id="root"></div>',
  `<script type="module">${safeJs}</script>`,
].join('\n');

writeFileSync(OUT, FRAGMENT ? fragment : page);
console.log(`\n  → ${OUT}  (${Math.round(page.length / 1024)}kB)`);
