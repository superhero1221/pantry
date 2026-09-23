import type { CSSProperties } from 'react';

/**
 * The design expresses styling as CSS declaration strings — both in the markup
 * and in the values the state layer computes (`PILL_ON`, the tier-row styles,
 * the store cards). Parsing them keeps those strings intact rather than
 * splintering every rule into a hand-written object.
 *
 * Memoised, because the same few hundred strings come round on every render —
 * Browse alone parsed about nine hundred per visit. A hit hands back the very
 * object it gave last time, so React sees an unchanged style and skips the
 * diff as well as the parse. Frozen, because it is now shared: a caller that
 * wrote into it would be restyling every other element with that string.
 * The cap only matters to strings built from live values (a colour, a width);
 * the design's own are a fixed set far below it.
 */
const parsed = new Map<string, CSSProperties>();

export function css(input?: string | CSSProperties | null): CSSProperties {
  if (!input) return {};
  if (typeof input !== 'string') return input;
  const hit = parsed.get(input);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const decl of input.split(';')) {
    const at = decl.indexOf(':');
    if (at < 0) continue;
    const prop = decl.slice(0, at).trim();
    const value = decl.slice(at + 1).trim();
    if (!prop || !value) continue;
    out[prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] =
      value;
  }
  if (parsed.size >= 2000) parsed.clear();
  const done = Object.freeze(out) as CSSProperties;
  parsed.set(input, done);
  return done;
}

/** Join declaration strings, dropping the empty ones. */
export const join = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(';');
