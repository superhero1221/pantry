import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RECIPES } from './cookbook';

/**
 * Every photograph has to name its photographer.
 *
 * This is not tidiness. Almost all of these are CC BY or CC BY-SA, and both
 * licences grant the right to use the work *on condition* that the author and
 * the licence are named. A photograph in the app with no entry here is a
 * licence breach, not a missing nicety — so it fails the build rather than
 * waiting for somebody to notice.
 */
const manifest = JSON.parse(readFileSync('public/pix/manifest.json', 'utf8')) as Record<
  string,
  { licence?: string; author?: string; file?: string }
>;

const isPhoto = (pic: string) => /\.(webp|jpe?g|png)$/i.test(pic);

/** Credits are keyed by recipe id, or by the photograph's own filename for the
 *  six that were filed under the picture's name before recipes had ids. */
const creditFor = (id: string, pic: string) =>
  manifest[id] ?? manifest[pic.replace(/^pix\//, '').replace(/\.\w+$/, '')];

describe('the pictures', () => {
  it('exist on disk for every dish', () => {
    for (const r of RECIPES) {
      expect(existsSync(`public/${r.pic}`), `${r.id} points at ${r.pic}, which is not there`).toBe(true);
    }
  });

  it('names the photographer and licence of every photograph', () => {
    const uncredited: string[] = [];
    for (const r of RECIPES) {
      if (!isPhoto(r.pic)) continue;
      const c = creditFor(r.id, r.pic);
      if (!c?.author || !c?.licence) uncredited.push(`${r.id} (${r.pic})`);
    }
    expect(uncredited, 'photographs used without crediting anyone').toEqual([]);
  });

  it('uses no licence that forbids commercial use or modification', () => {
    // NC forbids exactly what a live site does; ND forbids the resize every one
    // of these has had. Neither may ship, whatever else is true of them.
    const RESTRICTED = /\b(nc|nd|non[- ]?commercial|noderiv\w*|fair use|non[- ]free)\b/i;
    const bad: string[] = [];
    for (const r of RECIPES) {
      if (!isPhoto(r.pic)) continue;
      const licence = creditFor(r.id, r.pic)?.licence ?? '';
      if (RESTRICTED.test(licence)) bad.push(`${r.id}: ${licence}`);
    }
    expect(bad, 'licences that do not permit this use').toEqual([]);
  });

  it('never puts one photograph on two dishes', () => {
    // Two dishes sharing a picture looks like a bug to a reader, and it is one:
    // dal tadka and the Sri Lankan dhal were both given the same stock photo of
    // dried lentils, which was wrong twice over.
    const seen = new Map<string, string>();
    const shared: string[] = [];
    for (const r of RECIPES) {
      if (!isPhoto(r.pic)) continue;
      const file = creditFor(r.id, r.pic)?.file;
      if (!file) continue;
      const first = seen.get(file);
      if (first) shared.push(`${first} and ${r.id} both use ${file}`);
      else seen.set(file, r.id);
    }
    expect(shared, 'one photograph on more than one dish').toEqual([]);
  });
});
