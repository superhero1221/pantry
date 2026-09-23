import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { warmFirst } from './lazy-screens';
import { Boundary } from './ui/Boundary';
import { installCrashNet, langOf, reportStale } from './lib/crash';
import { loadPack, needsPack, packFailure } from './data/lang-pack';
import './styles.css';

// Before anything renders. A net that goes up after the fall is decoration.
installCrashNet();

// The service worker is what makes the cook screen work with no signal. Only
// in a real build — in dev it would serve yesterday's bundle back to you.
// The single-file build has no origin to register against.
//
// This sits ABOVE the await rather than at the foot of the file. A top-level
// await makes everything after it run in a later task, and "later" can be after
// `load` has already fired — at which point the listener is attached to an
// event that is never coming again, and the app silently stops working offline.
const standalone = import.meta.env.VITE_STANDALONE === '1';

if (import.meta.env.PROD && !standalone && 'serviceWorker' in navigator) {
  // What this page fetched with no worker in the way, handed to the worker,
  // so one visit is enough to cook offline. On a first visit the bundle, the
  // warmed screens and the first photograph all load before any worker exists;
  // after an update the new worker has just thrown the old one's caches away,
  // and it can take over before this line has even run. So once a worker is
  // active, and again whenever another takes over, the page names everything
  // it has loaded — and anything already on its way at that moment is named as
  // it lands. The worker fetches only what it has not got, which makes a name
  // sent twice cost nothing; see its message handler in public/sw.js.
  const sw = navigator.serviceWorker;
  const mine = (u: string) => u.startsWith(location.origin + '/');
  let to: ServiceWorker | null = null;
  let handedAt = -1;
  const handOver = (worker: ServiceWorker | null) => {
    if (!worker) return;
    to = worker;
    handedAt = performance.now();
    worker.postMessage({ keep: performance.getEntriesByType('resource').map((e) => e.name).filter(mine) });
  };
  sw.addEventListener('controllerchange', () => handOver(sw.controller));
  if (typeof PerformanceObserver === 'function') {
    new PerformanceObserver((list) => {
      const keep = list.getEntries().filter((e) => e.startTime < handedAt).map((e) => e.name).filter(mine);
      if (keep.length) to?.postMessage({ keep });
    }).observe({ type: 'resource' });
  }

  window.addEventListener('load', () => {
    sw.register(import.meta.env.BASE_URL + 'sw.js')
      .then(() => sw.ready)
      .then((reg) => handOver(reg.active))
      .catch((e) => {
        console.warn('service worker registration failed', e);
      });
  });
}

/* The language, before the first frame rather than after it.
 *
 * This is the only place in the app where anything can be waited for: the one
 * moment where React has not committed and control is still in a plain module
 * body. The memos in usePantry are synchronous by contract, and anything inside
 * the hook — an effect, a flag, a state change — renders at least one frame
 * first by definition. Wait here and an Arabic reader's first React frame is
 * Arabic; wait anywhere else and it is a right-to-left page full of English
 * words that then swaps wholesale.
 *
 * What is on screen meanwhile is index.html's own fallback, which has been the
 * first frame for every visitor in every language since the app shipped.
 * English readers never reach this at all — `needsPack('en')` is false.
 *
 * Bounded, because an unbounded wait is a hang rather than a slowdown: a
 * network that accepts the connection and never answers would leave React
 * unmounted and that fallback standing for ever. Past the deadline the app
 * mounts in English, and the fetch — still in flight — fills the registry and
 * re-renders through `packAt`.
 *
 * The failure is reported by hand because a caught rejection is a handled one:
 * the listeners installed above never see it, so the one-reload recovery for
 * yesterday's shell against today's chunks has to be asked for. On a timeout
 * `packFailure()` is still null, and reporting a failure that has not happened
 * would reload the page over nothing worse than a slow connection.
 */
const lang = langOf();

/* The screen in the address bar, fetched alongside the language rather than
 * after it. A shared #/browse link, or the app reopened on one, used to mount
 * an empty shell: its chunk was only asked for once the first render had
 * already suspended on it, and React then held that blank for 300ms on top.
 * Waiting here instead keeps index.html's fallback up a little longer — the
 * same pre-mount frame every visitor already sees — and the first React frame
 * has the screen in it. Started before the language wait so the two overlap.
 *
 * Bounded for the same reason the language is. warmFirst swallows a failure,
 * so a stale chunk still reaches its lazy import during render, and the crash
 * net and the Boundary deal with it exactly as before. Welcome and Tonight are
 * in this chunk already, so no-hash and #/home resolve at once. */
const first = warmFirst(location.hash);

if (needsPack(lang)) {
  const deadline = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500));
  const ok = await Promise.race([loadPack(lang), deadline]);
  if (!ok && packFailure()) reportStale(packFailure());
}

await Promise.race([first, new Promise((resolve) => setTimeout(resolve, 1500))]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The outer boundary. usePantry() runs inside App's own render, so if the
        state layer throws there is no shell to render a message into — this
        one brings its own .pg-page/.pg-shell. The inner one, in App, keeps the
        shell and the nav when it is only a screen that broke. */}
    <Boundary shell>
      <App />
    </Boundary>
  </StrictMode>,
);
