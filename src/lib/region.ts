/* Country names in the reader's language, from the browser's own CLDR data.

   The Passport used to name a country from an eleven-entry English map and,
   past that, print the ISO code: cook one Sri Lankan dish and the row read
   "LK · cooked 1 time" in all six languages. The cookbook spans 37 countries,
   and hand-translating 37 names into five languages is exactly the list the
   browser already ships. Hand-written names (the packs' pc / cn) still win
   where they exist; this answers for the rest.

   Deliberately imports nothing: usePantry, the tests and the Jev harness all
   reach it, and none of them should drag the cookbook along to name a place. */

/** English names for every country the cookbook and the price table cover —
 *  the answer where Intl.DisplayNames does not exist (Safari before 14.1, old
 *  Android WebViews). English in a French UI is a gap; "LK" is a bug. */
export const EN_COUNTRY: Record<string, string> = {
  TH: 'Thailand', US: 'United States', CN: 'China', FR: 'France', IN: 'India',
  GB: 'United Kingdom', MA: 'Morocco', MX: 'Mexico', VN: 'Vietnam', NG: 'Nigeria',
  IT: 'Italy', PK: 'Pakistan', LK: 'Sri Lanka', JP: 'Japan', KR: 'South Korea',
  ID: 'Indonesia', MY: 'Malaysia', PE: 'Peru', AR: 'Argentina', LB: 'Lebanon',
  SY: 'Syria', PS: 'Palestine', IR: 'Iran', EG: 'Egypt', ET: 'Ethiopia',
  TN: 'Tunisia', GH: 'Ghana', SN: 'Senegal', KE: 'Kenya', IE: 'Ireland',
  ES: 'Spain', GR: 'Greece', TR: 'Türkiye', RS: 'Serbia', JM: 'Jamaica',
  CU: 'Cuba', BR: 'Brazil', DE: 'Germany', AE: 'United Arab Emirates',
};

const cache: Record<string, Intl.DisplayNames | null> = {};
const names = (lang: string, style: 'long' | 'short') => {
  const k = lang + ':' + style;
  if (k in cache) return cache[k];
  let d: Intl.DisplayNames | null = null;
  try {
    // [lang, 'en'], not [lang]: a locale the device lacks lands on English,
    // not on whatever language the phone itself happens to be set to.
    d = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames([lang, 'en'], { type: 'region', style, fallback: 'none' })
      : null;
  } catch {
    d = null;
  }
  return (cache[k] = d);
};

/** CLDR's long name for PS is "Palestinian Territories"; the short one
 *  ("Palestine", "فلسطين", "Palestyna") is what the cookbook's "Palestinian"
 *  cuisine answers to. Short is NOT the general rule — it turns the US and the
 *  UK into "US" and "UK", which is the very thing this file exists to stop. */
const SHORT = new Set(['PS']);

/** The country's name in `lang`, or '' when the browser cannot say. Never the
 *  code: fallback 'none' makes an unknown region come back empty, so the caller
 *  moves on down its own chain instead of rendering "QQ". */
export function regionName(lang: string, code: string): string {
  if (!/^[A-Z]{2}$/.test(code || '')) return '';
  try {
    return names(lang, SHORT.has(code) ? 'short' : 'long')?.of(code) || '';
  } catch {
    return '';
  }
}

/** Hand-written name first, then CLDR in the reader's language, then English,
 *  then — never expected for a cookbook code — the code itself. */
export const countryLabel = (lang: string, code: string, hand?: Record<string, string>) =>
  (hand && hand[code]) || regionName(lang, code) || EN_COUNTRY[code] || code;
