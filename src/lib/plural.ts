/**
 * Counted strings, in the grammar of the language reading them.
 *
 * Every count on screen used to be a number glued to one fixed word — "1
 * days", "153 dań", "2 حصص" — which is right in English for everything but 1
 * and wrong far more often than that in Polish (one/few/many) and Arabic
 * (six forms, including a dual that drops the numeral altogether).
 *
 * One key per string. Its value is either plain text, which every count
 * shares, or forms labelled with the CLDR category they answer for:
 *
 *   'one:{n} day|other:{n} days'
 *
 * One key rather than fooOne/fooFew/fooMany because data.test.ts holds every
 * language to English's key SET: per-category keys would make French and
 * Urdu carry six Arabic forms they have no use for. Here each language lists
 * only the forms it needs, a missing one falls to `other`, and a language
 * that needs none stays plain text.
 *
 * Digits are not touched. Callers still fill {n} with String(n), which is
 * what every count printed before this existed.
 */

export type PluralCat = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

const CAT = /^(zero|one|two|few|many|other):/;
const rules: Record<string, Intl.PluralRules> = {};

/** Which CLDR form `n` takes in `lang`. A browser too old for PluralRules
 *  gets English's rule rather than an exception in the middle of a render. */
export const pluralCat = (lang: string, n: number): PluralCat => {
  try {
    return (rules[lang] ||= new Intl.PluralRules(lang)).select(n) as PluralCat;
  } catch {
    return n === 1 ? 'one' : 'other';
  }
};

/** The form of a labelled template that `n` takes in `lang`; a template with
 *  no '|' comes back as it went in. A label must open its segment, so a
 *  direction mark (U+200F) goes after the colon, never before it. */
export const pickForm = (lang: string, tpl: string, n: number): string => {
  if (!tpl || tpl.indexOf('|') < 0) return tpl;
  const forms: Partial<Record<PluralCat, string>> = {};
  for (const seg of tpl.split('|')) {
    const m = CAT.exec(seg);
    if (m) forms[m[1] as PluralCat] = seg.slice(m[0].length);
  }
  return forms[pluralCat(lang, n)] ?? forms.other ?? tpl;
};
