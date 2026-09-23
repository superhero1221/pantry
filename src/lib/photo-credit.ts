import { PHOTO_CREDITS } from '../data/cookbook-credits';

/**
 * Who took a dish's photograph, under what licence, and where both live.
 *
 * Looked up by recipe id alone, never by the picture's path: the path has been
 * through asset() by the time a screen sees it, and the single-file build turns
 * every photograph into a data: URI with no extension left to test. The map
 * only holds photographs, so a drawing answers null here without asking.
 */
const COMMONS = 'https://commons.wikimedia.org/wiki/File:';

/** The deed for a licence as the manifest spells it ("CC BY-SA 2.0 kr"). Public
 *  domain points at the Public Domain Mark, which says the same in CC's words. */
export function licenceUrl(code: string): string | null {
  if (/^CC0$/i.test(code)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (/^public domain$/i.test(code)) return 'https://creativecommons.org/publicdomain/mark/1.0/';
  const m = /^CC (BY(?:-SA)?) (\d\.\d)(?: ([a-z]{2}))?$/i.exec(code);
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/${m[3] ? m[3].toLowerCase() + '/' : ''}` : null;
}

export type Credit = {
  author: string;
  licence: string;
  /** The file's page on Wikimedia Commons: the original, and its full terms. */
  page: string;
  licenceUrl: string | null;
};

export function creditOf(id: string): Credit | null {
  const c = PHOTO_CREDITS[id];
  if (!c) return null;
  const [author, licence, file] = c;
  return { author, licence, page: COMMONS + file, licenceUrl: licenceUrl(licence) };
}

/** Every credited photograph, for the list in Settings. */
export const CREDITED_IDS = Object.keys(PHOTO_CREDITS);
