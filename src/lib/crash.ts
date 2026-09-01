import { dirOf, detect, LANGS } from '../data/pantry-i18n';
import { xt } from '../data/extra-copy';
import { exportBackup, readStore, STORE_KEY } from './backup';

/**
 * The net under the net.
 *
 * A React error boundary catches what happens inside a render. It does not
 * catch an error thrown from an event handler, from a setTimeout, from an
 * await, or from a module that never loaded in the first place — and the last
 * of those is the one that actually happens to this app in the wild.
 *
 * Pantry is a PWA and public/sw.js precaches the shell. Ship a new build and a
 * returning tab can be running yesterday's HTML against today's hashed chunks,
 * so the first `import('../data/pantry-live')` resolves to a file that is no
 * longer on the server. That arrives as an unhandled rejection, not a render
 * error, and no boundary will ever see it.
 *
 * Everything this file imports is either dependency-free data or backup.ts,
 * which imports nothing at all. A net that needs the module graph it exists to
 * survive is not a net.
 */

/** One automatic reload per tab session, ever. */
const RELOADED = 'pantry.reloaded.v1';

/** How the browsers word a chunk that is no longer on the server. */
const STALE =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i;

/**
 * The language, worked out without React and without usePantry, because either
 * may be what threw. What you chose, then what your browser says, then
 * English — and someone crashing on their very first render has no storage at
 * all, which is exactly why the browser guess is here.
 */
export function langOf(): string {
  try {
    const raw = readStore();
    const saved = raw ? (JSON.parse(raw) as { lang?: unknown }).lang : null;
    if (typeof saved === 'string' && LANGS.some((l) => l.code === saved)) return saved;
  } catch {
    /* unreadable storage is not a reason to render nothing */
  }
  try {
    return detect();
  } catch {
    return 'en';
  }
}

const textOf = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

let painted = false;

/**
 * The last resort: React never mounted, so #root is still empty and the page
 * is white. Built with createElement and cssText rather than JSX, because if
 * React is unavailable this is the only kind of markup left. Same palette,
 * same shapes, same six-language copy as the boundary.
 */
function paint(message: string) {
  if (painted) return;
  const root = document.getElementById('root');
  if (!root) return;
  // index.html ships a hardcoded English card inside #root, for the visitor
  // whose bundle never arrived at all. React empties the container at its
  // first commit — but until that commit the card is a child, and "has
  // children" used to mean "React painted, do not take its screen". Which
  // meant this function could never run in the one case it was written for:
  // nothing loaded, nothing painted, #fallback still standing.
  const fallback = root.querySelector('#fallback');
  if (root.childElementCount > (fallback ? 1 : 0)) return;
  painted = true;
  fallback?.remove();

  const lang = langOf();
  const dir = dirOf(lang);
  const x = (k: string) => xt(lang, k);

  const el = (tag: string, style: string, text?: string) => {
    const n = document.createElement(tag);
    n.style.cssText = style;
    if (text) n.textContent = text;
    return n;
  };

  const card = el(
    'div',
    "padding:32px 22px;max-width:520px;margin:0 auto;text-align:start;font-family:'Figtree',system-ui,sans-serif;color:#3b3229",
  );
  card.setAttribute('dir', dir);
  card.setAttribute('lang', lang);
  card.setAttribute('role', 'alert');

  card.appendChild(
    el(
      'h1',
      "font-family:'Caprasimo',serif;font-weight:400;font-size:30px;line-height:1.06;margin:0;letter-spacing:-.4px",
      x('crashTitle'),
    ),
  );
  card.appendChild(
    el(
      'p',
      'margin:12px 0 0;font-size:14.5px;line-height:1.55;color:#6a5c4c;text-wrap:pretty',
      x('crashBody'),
    ),
  );

  const reload = el(
    'button',
    'width:100%;height:54px;border-radius:999px;border:0;background:#a83f06;color:#fff;font:inherit;font-size:16px;font-weight:700;margin-top:20px;cursor:pointer',
    x('crashReload'),
  );
  reload.addEventListener('click', () => window.location.reload());
  card.appendChild(reload);

  const save = el(
    'button',
    'width:100%;height:48px;border-radius:999px;border:0;background:#ffe9d2;color:#3b3229;font:inherit;font-size:14.5px;font-weight:700;margin-top:9px;cursor:pointer',
    x('crashSave'),
  );
  save.addEventListener('click', () => exportBackup(readStore()));
  card.appendChild(save);

  const why = el('div', 'margin-top:20px;padding:14px 16px;border-radius:22px;background:#ffffff');
  why.appendChild(
    el(
      'div',
      'font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#847462',
      x('crashWhat'),
    ),
  );
  const line = el(
    'div',
    'margin-top:6px;font-size:12.5px;line-height:1.5;color:#6a5c4c;overflow-wrap:anywhere',
    message,
  );
  line.setAttribute('dir', 'ltr');
  why.appendChild(line);
  card.appendChild(why);

  const page = el('div', 'min-height:100vh;background:#fffaf3');
  page.appendChild(card);
  root.appendChild(page);
}

/** One automatic reload per tab session, ever. Returns whether it fired. */
function reloadOnce(): boolean {
  // Yesterday's shell against today's chunks. One reload fixes it; a loop would
  // be worse than the bug, so the flag is checked and set together and never
  // cleared. No sessionStorage means no way to stop a loop — so do not start
  // one.
  let already = true;
  try {
    already = sessionStorage.getItem(RELOADED) === '1';
    sessionStorage.setItem(RELOADED, '1');
  } catch {
    already = true;
  }
  if (already) return false;
  window.location.reload();
  return true;
}

/**
 * A dynamic import that failed somewhere it was caught.
 *
 * The listeners below only ever see *unhandled* rejections, so a try/catch
 * around an import buys you a page that works and quietly costs you the reload
 * that would have fixed it. This is how a caller hands the failure back.
 *
 * Deliberately never paints: a language that did not arrive is a page in
 * English, not a page that is gone.
 */
export function reportStale(raw: unknown): void {
  const message = textOf(raw);
  console.error('pantry: language pack did not load', message, raw);
  if (STALE.test(message)) reloadOnce();
}

/** Install before anything renders — the net has to be up before the fall. */
export function installCrashNet(): void {
  const handle = (raw: unknown) => {
    const message = textOf(raw);
    console.error('pantry: uncaught', message, raw);
    if (STALE.test(message) && reloadOnce()) return;
    // Anything else: if React painted, the screen is still standing and a
    // stray rejection has not earned the right to take it. If it never
    // painted, this is the difference between a crash page and a white one.
    paint(message);
  };
  window.addEventListener('error', (e: ErrorEvent) => handle(e.error || e.message));
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => handle(e.reason));
}
