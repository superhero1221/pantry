/**
 * The five translations that are not English, fetched only by the person
 * reading one of them.
 *
 * English is not one language of six. It is the fallback every accessor falls
 * through to — per key in `xt()`, per key in `strings()`, per array entry in
 * `pack()` — so it stays in the main chunk and the other five leave.
 *
 * One chunk per language, not one chunk holding five. That distinction is the
 * whole change: five in one file would hand a Spanish reader the same bytes
 * they download today, plus a round trip to fetch them. Per language they pay
 * for their own and nobody else's.
 *
 * The five arms in `loadPack` are written out longhand because a bundler can
 * only split what it can see statically — the same reason App.tsx lists its
 * fifteen screens by hand rather than generating them from a map.
 *
 * Shaped like the food table on purpose: a module-level cache, a `pending`
 * promise so two callers share one fetch, a failure that clears `pending` so it
 * can be tried again, and a synchronous reader that answers `undefined` until
 * the file lands. `undefined` is a complete answer — it means English — which
 * is why nothing downstream of this file has to learn what a promise is.
 *
 * This module imports nothing, and must not. `pantry-i18n.js` and
 * `extra-copy.ts` both import it, and `crash.ts` imports both of those;
 * importing LANGS here to validate a code would close that loop.
 */
export type LangPack = {
  strings: Record<string, string>;
  pack: Record<string, unknown>;
  extra: Record<string, string>;
};

const loaded: Record<string, LangPack> = {};
const pending: Record<string, Promise<boolean>> = {};
let failure: unknown = null;

/** English needs nothing fetched — and neither does a code we do not ship.
 *  A profile carrying 'de', or 'pl' after a language is ever withdrawn, must
 *  not queue a request on every boot for a file that cannot exist. */
export const needsPack = (code: string) =>
  code === 'es' || code === 'fr' || code === 'pl' || code === 'ur' || code === 'ar';

/** What has landed, or undefined — which means English. */
export const packOf = (code: string): LangPack | undefined => loaded[code];

export const ready = (code: string) => !needsPack(code) || !!loaded[code];

/** Why the last attempt failed, for the one caller that reports it. */
export const packFailure = () => failure;

/** Resolves to whether the language is now in hand. Never rejects: every call
 *  site is one line, and the failure is reported deliberately rather than
 *  thrown into a boot sequence that has nowhere to put it. */
export function loadPack(code: string): Promise<boolean> {
  if (ready(code)) return Promise.resolve(true);
  if (!pending[code]) {
    const got = (m: LangPack) => {
      loaded[code] = m;
      return true;
    };
    const lost = (e: unknown) => {
      failure = e;
      delete pending[code];
      return false;
    };
    const p =
      code === 'es'
        ? import('./lang/es')
        : code === 'fr'
          ? import('./lang/fr')
          : code === 'pl'
            ? import('./lang/pl')
            : code === 'ur'
              ? import('./lang/ur')
              : import('./lang/ar');
    pending[code] = p.then(got, lost);
  }
  return pending[code];
}
