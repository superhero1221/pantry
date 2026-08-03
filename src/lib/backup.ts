/**
 * Everything Pantry knows about you is one key, in one browser, on one
 * device. Clear the browser and it is gone: there is no server copy to fall
 * back on, because there is deliberately no server unless you asked for one.
 *
 * So this is the door out and the door back. A Blob, an object URL and an
 * anchor the page never sees — no dependency, no upload, nothing leaves the
 * device unless you put the file somewhere yourself.
 *
 * This module imports nothing, on purpose. The crash screen calls it when
 * React is the thing that broke, so it cannot afford to need anything.
 */

/** The one place this key is written down. usePantry imports it from here. */
export const STORE_KEY = 'pantry.v1';

/** What the file says it is. Renaming something to .json is not a claim of
 *  provenance, so the envelope carries one. */
export const KIND = 'pantry.backup';

/** The version of the envelope, not of the app. `data` is the pantry.v1 blob
 *  verbatim and is versioned by that key's own name. Bump this only when the
 *  wrapper changes shape. */
export const VERSION = 1;

export interface Backup {
  kind: string;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
  /** Only present when the stored blob would not parse — the raw text, kept
   *  rather than dropped. An unreadable blob is exactly when you most want the
   *  bytes out of the building. */
  raw?: string;
}

/** The stored blob as text, or null. Storage can throw — a locked-down iframe,
 *  Safari with cookies off — and a read that throws is not a reason to fail. */
export function readStore(): string | null {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

/** Hand the browser a file. Called from Settings and from the crash screen. */
export function exportBackup(raw: string | null): void {
  const now = new Date();
  const body: Backup = {
    kind: KIND,
    version: VERSION,
    exportedAt: now.toISOString(),
    data: {},
  };
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        body.data = parsed as Record<string, unknown>;
      } else {
        body.raw = raw;
      }
    } catch {
      body.raw = raw;
    }
  }

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pantry-' + now.toISOString().slice(0, 10) + '.json';
  // Never attached to the document: a click on a detached anchor still
  // downloads, and nothing flickers into the layout on the way past.
  a.click();
  // The tick is for Firefox, which has read the URL by the time it fires.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export type Read =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; why: 'shape' | 'future' };

/**
 * Is this one of ours, and is it one this build can read?
 *
 * Only the envelope is judged here. What is inside `data` is somebody else's
 * text until it has been through the caller's own KEEP filter, and this
 * function neither trusts it nor touches it.
 *
 * A newer version is refused outright rather than half-opened. Taking the keys
 * we recognise and dropping the rest would look like it worked, and then the
 * next state change would write the pruned blob back over the file — an import
 * that quietly deletes half your history. There is no honest partial answer.
 */
export function readBackup(text: string): Read {
  let blob: unknown;
  try {
    blob = JSON.parse(text);
  } catch {
    return { ok: false, why: 'shape' };
  }
  if (!blob || typeof blob !== 'object' || Array.isArray(blob)) return { ok: false, why: 'shape' };
  const b = blob as Record<string, unknown>;
  if (b.kind !== KIND) return { ok: false, why: 'shape' };
  if (typeof b.version !== 'number' || !Number.isFinite(b.version)) {
    return { ok: false, why: 'shape' };
  }
  if (b.version > VERSION) return { ok: false, why: 'future' };
  const data = b.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, why: 'shape' };
  return { ok: true, data: data as Record<string, unknown> };
}
