/* Pantry service worker.
 *
 * A kitchen is the place your signal dies, and the cook screen is the place
 * you need it least to. What is precached up front is the shell: the page, the
 * manifest, the icon. Everything else is kept the first time it is used — the
 * bundle and each of its split chunks on the visit that loads them, each dish
 * photograph the first time you look at it. So the language you cook in and
 * the dishes you have opened are all there with no signal. What was never
 * fetched was never kept: the ingredient names for a language you have never
 * opened online read in English until you are online, and the Supabase client
 * is only fetched when something asks the cloud a question, which needs a
 * network regardless. The only things that always hit the network are the ones
 * that are meaningless stale: shops near you, live prices, and your account.
 */

const VERSION = 'pantry-v1';
const SHELL = VERSION + '-shell';
const MEDIA = VERSION + '-media';

// The worker is served from wherever the app is — root on a custom domain,
// /<repo>/ on a GitHub Pages project site. Everything it caches is resolved
// against its own location rather than assumed to be at /.
const BASE = new URL('./', self.location).pathname;
const at = (p) => BASE + p;

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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
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

  // Dish photographs and fonts: cache first, they never change under a name.
  const isMedia =
    url.pathname.includes('/pix/') ||
    /\.(webp|png|jpg|jpeg|svg|woff2?)$/.test(url.pathname) ||
    url.host.includes('fonts.g');

  if (isMedia) {
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

  // Hashed build assets: cache first; anything else, network with a fallback.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(SHELL).then((c) => c.put(request, copy));
          }
          return response;
        })
        .catch(() => hit || Response.error());
    }),
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
