import type { CSSProperties } from 'react';

/**
 * The design expresses styling as CSS declaration strings — both in the markup
 * and in the values the state layer computes (`PILL_ON`, the tier-row styles,
 * the store cards). Parsing them keeps those strings intact rather than
 * splintering every rule into a hand-written object.
 */
export function css(input?: string | CSSProperties | null): CSSProperties {
  if (!input) return {};
  if (typeof input !== 'string') return input;
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
  return out as CSSProperties;
}

/** Join declaration strings, dropping the empty ones. */
export const join = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(';');
