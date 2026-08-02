/**
 * The ingredient and leftover tables, fetched only if you need them.
 *
 * `pantry-food.js` holds no English: the English name *is* the key, and both
 * functions already fall back to it. So the whole table is 33 kB that an
 * English kitchen never has any use for, and it is loaded on the first render
 * in another language rather than before the first screen in every language.
 *
 * Until it lands — and if it never does, because you are offline and switched
 * language for the first time — every name reads in English, which is the same
 * fallback the table itself gives for a word nobody has translated yet.
 */
type Table = typeof import('../data/pantry-food');

let table: Table | null = null;
let pending: Promise<boolean> | null = null;

/** English is the key, so English needs nothing fetched. */
export const needsTable = (lang: string) => lang !== 'en';

export const ready = () => !!table;

export function loadTable(): Promise<boolean> {
  if (table) return Promise.resolve(true);
  if (!pending) {
    pending = import('../data/pantry-food')
      .then((m) => {
        table = m;
        return true;
      })
      .catch(() => {
        pending = null;
        return false;
      });
  }
  return pending;
}

export const foodName = (lang: string, en: string) => (table ? table.foodName(lang, en) : en);

export const keepText = (lang: string, id: string) => (table ? table.keepText(lang, id) : null);
