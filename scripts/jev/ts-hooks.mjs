/**
 * A resolve hook so plain `node` can import the app's own TypeScript.
 *
 * Node 22.18+ strips types from .ts files by default, but the app is written
 * for a bundler: its imports say `'./diet-audit'` and `'./lang/es'`, with no
 * extension, which Node's ESM resolver refuses. This tries the extensions Vite
 * would, in the order Vite would, and changes nothing else. No dependency,
 * no build step, and the app source is read exactly as it is on disk.
 */
const EXT = ['.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.js'];

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/');
    if (!relative || err?.code !== 'ERR_MODULE_NOT_FOUND') throw err;
    for (const ext of EXT) {
      try {
        return await next(specifier + ext, context);
      } catch {
        /* try the next one */
      }
    }
    throw err;
  }
}
