import { readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { COUNTRIES, DIETS, HISTORY, PASSPORT, RECIPES, SKILL_CARDS, SKILL_LEVELS, STORES_BY_COUNTRY } from './cookbook';
import { ENFORCEABLE, meetsDiet } from '../lib/diets';
import { CRASH } from './crash-copy';
import { EXTRA } from './extra-copy';
import { loadPack, packOf } from './lang-pack';
import * as es from './lang/es';
import * as fr from './lang/fr';
import * as pl from './lang/pl';
import * as ur from './lang/ur';
import * as ar from './lang/ar';

/**
 * The five languages that are not in the main chunk, imported directly.
 *
 * Not through pack() or strings() or xt(): every one of those English-backs a
 * missing language by design, so an assertion that goes through them compares
 * English to English and passes whatever has gone missing. That is not
 * theoretical — with all five deleted from the source, every test in this file
 * passed and strings('ar').navTonight answered 'Tonight'. These read the
 * files.
 */
const REST: Record<string, typeof es> = { es, fr, pl, ur, ar };
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

  it('names the currency of every country, so a live rate can find it', () => {
    // A missing or misspelled ISO code does not fail loudly — that country just
    // stays on the rate the app shipped with, quietly, forever. Which is the
    // whole failure this line exists to catch early.
    for (const [code, country] of Object.entries(COUNTRIES)) {
      expect(/^[A-Z]{3}$/.test(country.iso), `${code} -> ${country.iso}`).toBe(true);
    }
  });

  it('can actually answer for every diet it offers', () => {
    // Five of the nine were offered and then silently ignored: halal and kosher
    // had tags nothing read, and nut free, no pork and no alcohol had no tag on
    // any recipe at all. Ticking "Nut free" returned Pad Thai and its peanuts.
    for (const d of DIETS) {
      expect(ENFORCEABLE, `"${d.label}" is offered but nothing enforces it`).toContain(d.id);
    }
  });

  it('keeps allergens off a plate that says it has none', () => {
    const nutty = RECIPES.filter((r) => !meetsDiet(r, 'nut_free')).map((r) => r.name);
    expect(nutty).toContain('Pad Thai'); // roasted peanuts
    expect(nutty).toContain('Sweet Potato and Chickpea Curry'); // coconut milk
    // A derived diet must never exclude everything, which is what a matcher
    // that has gone wrong looks like from the outside.
    for (const d of DIETS) {
      const left = RECIPES.filter((r) => meetsDiet(r, d.id)).length;
      expect(left, `no dish at all survives "${d.label}"`).toBeGreaterThan(0);
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
  // The accessor-level tests below go through pack(), which cannot answer for a
  // language it has not been handed. Fill the registry the way the app does,
  // then check it actually filled — an empty registry would make every one of
  // them pass while checking nothing at all.
  beforeAll(async () => {
    await Promise.all(LANGS.map((l) => loadPack(l.code)));
    for (const code of Object.keys(REST)) {
      expect(packOf(code), `${code} did not load`).toBeTruthy();
    }
  });

  it('says the same thing in the crash copy as in the language it came from', () => {
    // These five keys are deliberately in two places: crash-copy.ts, which is
    // eager because the crash net cannot wait for a file to arrive, and the
    // language itself. A correction applied to one and not the other is a
    // crash page that disagrees with the app around it.
    const keys = ['crashBody', 'crashReload', 'crashSave', 'crashTitle', 'crashWhat'];
    for (const code of Object.keys(CRASH)) {
      expect(Object.keys(CRASH[code]).sort(), code).toEqual(keys);
      for (const k of keys) expect(CRASH[code][k], `${code}.${k}`).toBe(REST[code].extra[k]);
    }
  });

  it('keeps the level names 1-indexed and complete in every language', () => {
    // The onboarding question shows one of these on each of four buttons, and
    // Settings capitalises one on every render. A hole in the array used to be
    // a blank fragment in a small readout; it is now a blank button, and the
    // .charAt that capitalises it runs inside App's own render.
    for (const l of LANGS) {
      const p = pack(l.code);
      expect(p.levels, l.code).toHaveLength(5);
      expect(p.levels[0], l.code).toBe('');
      for (const n of [1, 2, 3, 4]) expect(p.levels[n], `${l.code}[${n}]`).toBeTruthy();
    }
  });

  it('translates every technique the question shows', () => {
    for (const l of LANGS) {
      const p = pack(l.code);
      for (const id of SKILL_LEVELS.flatMap((r) => r.ids)) {
        expect(p.skill[id], `${l.code}.${id}`).toBeTruthy();
      }
    }
  });

  it('spells out every technique card, not just the ones on a button', () => {
    for (const l of LANGS) {
      const p = pack(l.code);
      for (const cd of SKILL_CARDS) expect(p.skill[cd.id], `${l.code}.${cd.id}`).toBeTruthy();
    }
  });

  it('ships every flat interface string in all six languages', () => {
    // Nothing tested this until the languages moved into their own files. A
    // key added to English and forgotten in Urdu renders the English word,
    // silently, because every reader of this table falls back to it.
    const en = Object.keys(strings('en')).sort();
    for (const code of Object.keys(REST)) {
      expect(Object.keys(REST[code].strings).sort(), code).toEqual(en);
    }
  });

  it('ships every design-pack section in all six languages', () => {
    const en = Object.keys(pack('en')).sort();
    for (const code of Object.keys(REST)) {
      expect(Object.keys(REST[code].pack).sort(), code).toEqual(en);
    }
  });

  it('covers every added string in all six languages', () => {
    const en = Object.keys(EXTRA.en).sort();
    for (const code of Object.keys(REST)) {
      expect(Object.keys(REST[code].extra).sort(), code).toEqual(en);
    }
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
