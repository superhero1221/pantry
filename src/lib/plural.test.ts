import { beforeAll, describe, expect, it } from 'vitest';
import { pickForm, pluralCat } from './plural';
import { EXTRA, xt } from '../data/extra-copy';
import { loadPack } from '../data/lang-pack';
import { LANGS, pack, strings } from '../data/pantry-i18n';
import * as es from '../data/lang/es';
import * as fr from '../data/lang/fr';
import * as pl from '../data/lang/pl';
import * as ur from '../data/lang/ur';
import * as ar from '../data/lang/ar';

const fill = (s: string, n: number) => s.split('{n}').join(String(n));
const say = (lang: string, key: string, n: number) => fill(pickForm(lang, xt(lang, key), n), n);

describe('pickForm', () => {
  it('picks one and other in English', () => {
    const t = 'one:{n} day|other:{n} days';
    expect(pickForm('en', t, 1)).toBe('{n} day');
    expect(pickForm('en', t, 0)).toBe('{n} days');
    expect(pickForm('en', t, 2)).toBe('{n} days');
  });

  it('counts 0 as singular in French, as French does', () => {
    const t = 'one:{n} plat|other:{n} plats';
    expect(pickForm('fr', t, 0)).toBe('{n} plat');
    expect(pickForm('fr', t, 1)).toBe('{n} plat');
    expect(pickForm('fr', t, 2)).toBe('{n} plats');
  });

  it("follows Polish few, and lets 'other' carry the many form", () => {
    const t = 'one:{n} danie|few:{n} dania|other:{n} dań';
    expect(pickForm('pl', t, 1)).toBe('{n} danie');
    for (const n of [2, 3, 4, 22, 153]) expect(pickForm('pl', t, n), String(n)).toBe('{n} dania');
    for (const n of [0, 5, 11, 12, 21, 25, 100]) expect(pickForm('pl', t, n), String(n)).toBe('{n} dań');
  });

  it('knows all six Arabic forms', () => {
    const cats: [number, string][] = [
      [0, 'zero'], [1, 'one'], [2, 'two'], [3, 'few'], [10, 'few'],
      [11, 'many'], [99, 'many'], [100, 'other'], [102, 'other'], [103, 'few'],
    ];
    for (const [n, c] of cats) expect(pluralCat('ar', n), String(n)).toBe(c);
  });

  it('returns plain text untouched, and falls to other for a form not listed', () => {
    expect(pickForm('ar', '{n} min', 2)).toBe('{n} min');
    expect(pickForm('ar', 'one:a|other:b', 2)).toBe('b');
    expect(pickForm('en', '', 2)).toBe('');
  });

  it('does not turn digits into anything else', () => {
    // The counts were ASCII in Arabic and Urdu before this existed and still are.
    expect(say('ar', 'dishesCount', 153)).toContain('153');
    expect(say('ur', 'dishesCount', 153)).toContain('153');
  });
});

describe('the counted strings, as they read', () => {
  beforeAll(async () => {
    await Promise.all(LANGS.map((l) => loadPack(l.code)));
  });

  it('reads the streak right in every language on day one', () => {
    expect(say('en', 'streakShort', 1)).toBe('1 day');
    expect(say('fr', 'streakShort', 1)).toBe('1 jour');
    expect(say('pl', 'streakShort', 1)).toBe('1 dzień');
    expect(say('es', 'streakShort', 1)).toBe('1 día');
    expect(say('en', 'streakRunning', 1)).toBe('1 day running');
  });

  it('gives Arabic its dual and its 3-10, 11-99 and 100 forms', () => {
    expect(say('ar', 'streakShort', 1)).toBe('يوم واحد');
    expect(say('ar', 'streakShort', 2)).toBe('يومان');
    expect(say('ar', 'streakShort', 3)).toBe('3 أيام');
    expect(say('ar', 'streakShort', 11)).toBe('11 يوماً');
    expect(say('ar', 'streakShort', 100)).toBe('100 يوم');
    expect(say('ar', 'dishesCount', 153)).toBe('153 طبقاً');
    expect(say('ar', 'pantryLineSample', 23)).toBe('23 شيئاً يضمّه مطبخ عادةً');
  });

  it('puts Polish 153 in few', () => {
    expect(say('pl', 'dishesCount', 153)).toBe('153 dania');
    expect(say('pl', 'dishesCount', 5)).toBe('5 dań');
  });

  it('says one cook, not one cooks, on the Stats screen', () => {
    expect(fill(pickForm('en', pack('en').x.statsSub, 1), 1)).toMatch(/^1 cook logged\./);
    expect(fill(pickForm('fr', pack('fr').x.statsSub, 1), 1)).toMatch(/^1 plat enregistré\./);
  });
});

/* Every value in every language, checked for the shape pickForm needs. A
   mistake here does not throw — it prints "one:" on screen, or a {k} that
   never gets filled — so the data is held to it rather than the code. */
describe('every labelled string', () => {
  const REST = { es, fr, pl, ur, ar } as Record<string, { strings: object; pack: object; extra: object }>;
  const CAT = /^(zero|one|two|few|many|other):/;
  const holes = (s: string) => new Set(s.match(/\{\w+\}/g) || []);

  /** path -> string, for every string at any depth. */
  const walk = (o: unknown, at: string, out: Map<string, string>) => {
    if (typeof o === 'string') out.set(at, o);
    else if (o && typeof o === 'object')
      for (const [k, v] of Object.entries(o)) walk(v, at + '.' + k, out);
    return out;
  };
  const tables = (code: string) => {
    const src = code === 'en' ? { strings: strings('en'), pack: pack('en'), extra: EXTRA.en } : REST[code];
    return walk(src, '', new Map());
  };
  const en = tables('en');

  for (const l of LANGS) {
    it(`is well formed in ${l.code}`, () => {
      const allowed = new Set(new Intl.PluralRules(l.code).resolvedOptions().pluralCategories);
      let seen = 0;
      for (const [path, v] of tables(l.code)) {
        if (!v.includes('|') && !CAT.test(v)) continue;
        seen++;
        const segs = v.split('|');
        const labels = segs.map((s) => CAT.exec(s)?.[1]);
        expect(labels.every(Boolean), `${l.code}${path}: a segment has no label — "${v}"`).toBe(true);
        expect(labels, `${l.code}${path}: no other form`).toContain('other');
        for (const c of labels) expect(allowed.has(c as Intl.LDMLPluralRule), `${l.code}${path}: ${l.code} has no ${c}`).toBe(true);
        expect(new Set(labels).size, `${l.code}${path}: a form is listed twice`).toBe(labels.length);

        // A form may drop the number (Arabic's "يومان"), never add a hole English does not fill.
        const english = holes(en.get(path) ?? '');
        for (const s of segs)
          for (const h of holes(s)) expect(english.has(h), `${l.code}${path}: ${h} is not in English`).toBe(true);

        for (let n = 0; n <= 130; n++) {
          const out = pickForm(l.code, v, n);
          expect(out.includes('|') || CAT.test(out), `${l.code}${path} at ${n}: "${out}"`).toBe(false);
        }
      }
      expect(seen, `${l.code} has no counted strings at all`).toBeGreaterThan(0);
    });
  }
});
