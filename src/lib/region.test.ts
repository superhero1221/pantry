import { beforeAll, describe, expect, it } from 'vitest';
import { EN_COUNTRY, countryLabel, regionName } from './region';
import { COUNTRIES, RECIPES } from '../data/cookbook';
import { xt } from '../data/extra-copy';
import { loadPack } from '../data/lang-pack';
import { LANGS } from '../data/pantry-i18n';

const LANG_CODES = ['en', 'es', 'fr', 'pl', 'ur', 'ar'];
/** Every country a name is ever asked for: the cookbook's cuisines and the price table. */
const CODES = [...new Set([...RECIPES.map((r) => r.code), ...Object.keys(COUNTRIES)])];
const ARABIC_SCRIPT = /[؀-ۿ]/;

describe('country names', () => {
  it('has an English fallback for every country the app can name', () => {
    for (const code of CODES) expect(EN_COUNTRY[code], code).toBeTruthy();
  });

  it('names every country in every language, never as its code', () => {
    for (const lang of LANG_CODES) {
      for (const code of CODES) {
        const name = countryLabel(lang, code);
        expect(name, `${lang} ${code}`).toBeTruthy();
        expect(name, `${lang} ${code}`).not.toBe(code);
      }
    }
  });

  it('answers Urdu and Arabic in their own script', () => {
    expect(regionName('ar', 'LK')).toMatch(ARABIC_SCRIPT);
    expect(regionName('ur', 'ES')).toMatch(ARABIC_SCRIPT);
  });

  it('calls Palestine Palestine, and keeps the long form everywhere else', () => {
    expect(regionName('en', 'PS')).toBe('Palestine');
    expect(regionName('en', 'US')).toBe('United States');
    expect(regionName('en', 'GB')).toBe('United Kingdom');
  });

  it('lets a hand-written name win', () => {
    expect(countryLabel('fr', 'US', { US: 'les États-Unis' })).toBe('les États-Unis');
    expect(countryLabel('fr', 'ES', { US: 'les États-Unis' })).toBe('Espagne');
  });

  it('refuses what is not a region code rather than throwing', () => {
    expect(regionName('en', '')).toBe('');
    expect(regionName('en', 'gb')).toBe('');
    expect(regionName('en', 'QQ')).toBe('');
    expect(regionName('xx-invalid!!', 'GB')).toBe('');
    // The documented last resort, for a code no table has heard of.
    expect(countryLabel('en', 'QQ')).toBe('QQ');
  });

  it('leaves the English Locate card exactly as it was', () => {
    for (const k of Object.keys(COUNTRIES)) expect(regionName('en', k), k).toBe(COUNTRIES[k].name);
  });
});

describe('currency words', () => {
  beforeAll(async () => {
    await Promise.all(LANGS.map((l) => loadPack(l.code)));
  });

  it('names every currency the app prices in, in every language', () => {
    for (const k of Object.keys(COUNTRIES)) {
      const key = 'cur' + COUNTRIES[k].iso;
      // English is the old COUNTRIES[*].cur, so its sentences are unchanged.
      expect(xt('en', key), key).toBe(COUNTRIES[k].cur);
      for (const lang of ['ur', 'ar']) expect(xt(lang, key), `${lang} ${key}`).toMatch(ARABIC_SCRIPT);
    }
  });
});
