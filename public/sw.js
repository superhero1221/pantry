/* Pantry service worker.
 *
 * A kitchen is the place your signal dies, and the cook screen is the place
 * you need it least to. What is precached up front is the shell: the page, the
 * manifest, the icon, the typefaces and the chunks the page starts from.
 * Everything else is kept the first time it is used — each split chunk on the
 * visit that loads it, each dish photograph the first time you look at it. So
 * the language you cook in and the dishes you have opened are all there with
 * no signal. What was never fetched was never kept: the ingredient names for a
 * language you have never opened online read in English until you are online,
 * and the Supabase client is only fetched when something asks the cloud a
 * question, which needs a network regardless. The only things that always hit
 * the network are the ones that are meaningless stale: shops near you, live
 * prices, and your account.
 *
 * Kept is not frozen. A file under /assets/ carries a hash of its bytes in its
 * name, so a changed file is a new name and the kept copy can be served for
 * ever. Nothing else here is named that way — a dish photograph that gets
 * replaced, the mascot, the icons, the manifest, fonts.css — so those are
 * served from the cache and checked behind your back (stale-while-
 * revalidate): the copy you have is on screen at once, and the new one is on
 * screen the visit after. Network-first would get it there one visit sooner
 * and make every photograph wait on the one bar of signal the kitchen has,
 * which is the trade this file exists to refuse.
 */

// Change this only when what is kept, or where, changes: activate throws away
// every cache that does not start with it. A deploy does not need it — the
// rules above already carry new files to returning users.
const VERSION = 'pantry-v2';
const SHELL = VERSION + '-shell';
const MEDIA = VERSION + '-media';

// The worker is served from wherever the app is — root on a custom domain,
// /<repo>/ on a GitHub Pages project site. Everything it caches is resolved
// against its own location rather than assumed to be at /.
const BASE = new URL('./', self.location).pathname;
const at = (p) => BASE + p;
const HASHED = at('assets/');

// The two typefaces are precached with the shell rather than kept on first
// use, because they are what the design looks like: a cold start with no
// signal should come up in Caprasimo and Figtree, not in Times.
const PRECACHE = [
  BASE,
  at('index.html'),
  at('manifest.webmanifest'),
  at('icon.svg'),
  at('fonts/fonts.css'),
  at('fonts/caprasimo-400.woff2'),
  at('fonts/figtree.woff2'),
];

/** Hosts whose answers are only worth having fresh. */
const ALWAYS_NETWORK = /(supabase\.co|nominatim\.openstreetmap\.org|overpass-api\.de|prices\.openfoodfacts\.org|world\.openfoodfacts\.org|api\.frankfurter\.app)/;

/** Keep a good answer. Resolves once it is written, so waitUntil can hold on;
 *  a full disk is a copy not kept, never a request that fails. */
const keep = (name, request, response) => {
  if (!response.ok) return Promise.resolve();
  const copy = response.clone();
  return caches
    .open(name)
    .then((c) => c.put(request, copy))
    .catch(() => {});
};

/** Where a same-origin file is kept: the shell for what starts the app, the
 *  media cache for the rest. One answer everywhere, because caches.match reads
 *  SHELL before MEDIA and a fresh copy kept behind a stale one is never seen. */
const cacheFor = (url) =>
  url.pathname.startsWith(HASHED) || PRECACHE.includes(url.pathname) ? SHELL : MEDIA;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // `reload` goes past the browser's own HTTP cache, so a new worker never
      // precaches yesterday's fonts.css out of it.
      await cache.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' })));

      // The chunks index.html starts from, read out of the copy just kept. On
      // a first visit they were fetched before this worker existed, so nothing
      // kept them; a tab upgraded from an older worker had them in a cache that
      // activate is about to throw away. Without them a cold start with no
      // signal is the shell with nothing to run.
      const page = await cache.match(at('index.html'));
      const html = page ? await page.text() : '';
      const chunks = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((m) => new URL(m[1], self.location).pathname)
        .filter((p) => p.startsWith(HASHED));
      await cache.addAll([...new Set(chunks)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const old = (await caches.keys()).filter((k) => !k.startsWith(VERSION));
      // An older worker's photographs and art move across before its caches
      // go: they are the dishes you opened, and nothing else would put them
      // back until you opened each one again with signal. Being unhashed, each
      // is checked for a newer copy the next time it is on screen online. Its
      // shell does not move — the page and chunks it held are yesterday's.
      // A move that fails part-way is photographs lost, never a worker stuck
      // on yesterday's caches.
      try {
        const media = await caches.open(MEDIA);
        for (const name of old.filter((k) => k.endsWith('-media'))) {
          const from = await caches.open(name);
          for (const request of await from.keys()) {
            if (PRECACHE.includes(new URL(request.url).pathname) || (await media.match(request))) continue;
            const response = await from.match(request);
            if (response) await media.put(request, response);
          }
        }
      } catch {
        /* the purge below goes ahead regardless */
      }
      await Promise.all(old.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (ALWAYS_NETWORK.test(url.host)) return;

  // Navigations: network first so a deploy lands, cache as the safety net.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((c) => c.put(at('index.html'), copy));
          return response;
        })
        .catch(() => caches.match(at('index.html')).then((r) => r || Response.error())),
    );
    return;
  }

  // Another origin's fonts and pictures: cache first, as they always were.
  // Anything else from another origin is left to the browser.
  if (url.origin !== self.location.origin) {
    const isMedia = /\.(webp|png|jpg|jpeg|svg|woff2?)$/.test(url.pathname) || url.host.includes('fonts.g');
    if (!isMedia) return;
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok || response.type === 'opaque') {
              const copy = response.clone();
              caches.open(MEDIA).then((c) => c.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Hashed build assets: cache first. The name changes when the bytes do.
  if (url.pathname.startsWith(HASHED)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            keep(SHELL, request, response);
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else from here — photographs, mascot, icons, manifest,
  // fonts.css: the kept copy now, a fresh one fetched behind it for next time.
  // `no-cache` asks the server rather than the browser's HTTP cache, which has
  // /pix/ marked immutable and would otherwise hand the old photograph back
  // for a year; an unchanged file costs a 304.
  const kept = caches.match(request);
  const fresh = kept.then((hit) =>
    fetch(request, { cache: 'no-cache' }).then(
      (response) => keep(cacheFor(url), request, response).then(() => response),
      () => hit || Response.error(),
    ),
  );
  event.respondWith(kept.then((hit) => hit || fresh));
  // The page has its answer; the worker stays up until the new copy is kept.
  event.waitUntil(fresh);
});

/* What the page fetched before this worker was there to see it.
 *
 * A first visit loads the bundle, warms every screen and draws the first
 * photograph while the worker is still being installed, so none of it passed
 * through here and none of it was kept — and "offline after one visit" would
 * quietly mean "after two". An update is the same story: the page was served
 * by the old worker, whose caches activate throws away. So main.tsx names
 * everything it has loaded once a worker is active and again whenever another
 * takes over, and anything not already kept is fetched again — usually out of
 * the browser's own cache, without touching the network. Same origin only. */
self.addEventListener('message', (event) => {
  const urls = event.data && event.data.keep;
  if (!Array.isArray(urls)) return;
  event.waitUntil(
    Promise.all(
      urls.map(async (u) => {
        const url = new URL(u, self.location);
        if (url.origin !== self.location.origin || url.pathname === at('sw.js')) return;
        // This worker's own cache, not caches.match: a new worker hears from
        // the page the moment it takes over, before activate has thrown the
        // old caches away, and a copy in one of those is about to be gone.
        const cache = await caches.open(cacheFor(url));
        if (await cache.match(url.href)) return;
        const response = await fetch(url.href).catch(() => null);
        if (response && response.ok) await cache.put(url.href, response).catch(() => {});
      }),
    ),
  );
});

/* ── The one notification this app sends ─────────────────────────────────
   Fired by the send-reminders edge function the day after you cook something
   that keeps. The body arrives already written in your language. */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Pantry', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Pantry', {
      body: payload.body || '',
      icon: at('icon-192.png'),
      badge: at('icon-192.png'),
      lang: payload.lang || 'en',
      dir: payload.lang === 'ar' || payload.lang === 'ur' ? 'rtl' : 'ltr',
      tag: payload.tag || 'pantry',
      data: { url: payload.url || '/' },
      requireInteraction: false,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || BASE;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
