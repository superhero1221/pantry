import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNTRIES, HISTORY, PASSPORT, RECIPES, STORES_BY_COUNTRY } from './cookbook';
import { EXTRA, orphaned, untranslated } from './extra-copy';
import { LANGS, pack, strings } from './pantry-i18n';

describe('the cookbook', () => {
  const ids = new Set(RECIPES.map((r) => r.id));
  const names = new Set(RECIPES.map((r) => r.name));

  it('has a photograph on disk for every dish', () => {
    const onDisk = new Set(readdirSync('public/pix'));
    for (const r of RECIPES) {
      expect(onDisk.has(r.pic.replace('pix/', '')), `${r.id} -> ${r.pic}`).toBe(true);
    }
  });

  it('only claims to already own things the recipe actually uses', () => {
    for (const r of RECIPES) {
      for (const had of r.have) {
        const used = r.items.some((i) => i.n.split(',')[0] === had);
        expect(used, `${r.id} says you have "${had}", which it never asks for`).toBe(true);
      }
    }
  });

  it('resolves every logged cook and every passport row to a real dish', () => {
    for (const h of HISTORY) expect(ids.has(h.id), h.id).toBe(true);
    for (const p of PASSPORT) expect(names.has(p.dish), p.dish).toBe(true);
  });

  it('can price every country it offers, with shops for each', () => {
    for (const code of Object.keys(COUNTRIES)) {
      expect(STORES_BY_COUNTRY[code]?.length, code).toBeGreaterThan(0);
    }
  });

  it('keeps the passport denominator honest', () => {
    // The Passport counts countries you have cooked FROM, so its denominator
    // has to be the number the cookbook actually covers. It once said 91.
    const covered = new Set(RECIPES.map((r) => r.code)).size;
    for (const l of LANGS) {
      const label = pack(l.code).w.ofCountries ?? strings(l.code).ofCountries ?? '';
      const digits = label.replace(/[^\d٠-٩۰-۹]/g, '');
      const latin = digits
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
      expect(Number(latin), `${l.code}: "${label}"`).toBe(covered);
    }
  });
});

describe('translations', () => {
  it('covers every added string in all six languages', () => {
    for (const l of LANGS) {
      expect(untranslated(l.code), `${l.code} is missing keys`).toEqual([]);
      expect(orphaned(l.code), `${l.code} has keys English does not`).toEqual([]);
    }
  });

  it('ships a block for each language the picker offers', () => {
    for (const l of LANGS) expect(Object.keys(EXTRA[l.code] ?? {}).length).toBeGreaterThan(0);
  });

  it('keeps the design pack English-backed, so no key can render blank', () => {
    // pack() walks Object.keys(PACKS.en) — a key missing there is dropped
    // silently, which is the bug that cost the design several rounds.
    const en = pack('en');
    for (const l of LANGS) {
      const p = pack(l.code);
      expect(Object.keys(p).sort()).toEqual(Object.keys(en).sort());
    }
  });
});
