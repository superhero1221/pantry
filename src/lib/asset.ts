/**
 * Resolve a bundled asset against wherever the app is actually served from.
 *
 * A GitHub Pages project site lives at `/<repo>/`, not `/`, so an absolute
 * `/pix/pad_thai.webp` 404s there. Vite hands us the real prefix in
 * `BASE_URL`; everything that points at a file goes through here.
 *
 * Left alone: data URIs (the single-file build inlines the photographs) and
 * absolute URLs, neither of which wants a prefix.
 */
export const asset = (path: string): string =>
  /^(data:|blob:|https?:)/.test(path)
    ? path
    : import.meta.env.BASE_URL + path.replace(/^\//, '');
