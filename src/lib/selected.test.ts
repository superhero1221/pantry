import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PILL_OFF, PILL_ON } from '../data/cookbook';

/**
 * Chosen options have to be visible to a screen reader, and visible without
 * colour.
 *
 * Every chip row here had the look right and the semantics missing: Locate's
 * cities, Settings' languages, the Plan sizes, Browse's categories, the shop
 * cards and the tab bar all showed the chosen one with a ring or a hue and
 * told assistive tech nothing. The convention is Home's: a role="group" with a
 * name, and aria-pressed on each chip (Level alone is a radiogroup, because it
 * handles arrow keys). This reads the screens' source, because the rows only
 * render deep inside flows a unit test cannot reach, and a new row copied from
 * an old pattern is the likeliest way for this to come back.
 */
const ROOT = join(__dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

/** Every chip row in the state bag that shows a chosen option. */
const GROUPS = [
  'countryChips',
  'langOptions',
  'goalChips',
  'browseCats',
  'planDayChips',
  'planServingChips',
  'planMealChips',
  'budgetChips',
  'timeChips',
  'cravings',
  'dietChips',
  'stores',
];

describe('option groups', () => {
  const screens = readdirSync(join(ROOT, 'screens'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => ({ f, src: read('screens/' + f) }));

  const uses = screens.flatMap(({ f, src }) =>
    GROUPS.flatMap((g) => {
      const out: { where: string; before: string; after: string }[] = [];
      const needle = `v.${g}.map(`;
      for (let i = src.indexOf(needle); i >= 0; i = src.indexOf(needle, i + 1)) {
        out.push({
          where: `${f} ${g}`,
          // The row's own wrapper is the last <div opened before the map.
          before: src.slice(src.lastIndexOf('<div', i), i),
          // The Btn the map returns, up to the end of its opening tag.
          after: src.slice(i, src.indexOf('>', src.indexOf('<Btn', i))),
        });
      }
      return out;
    }),
  );

  it('finds the rows it is guarding', () => {
    // If a rename hides every row from this test, it should fail, not pass.
    expect(uses.length).toBeGreaterThanOrEqual(GROUPS.length);
  });

  it('marks the chosen chip with aria-pressed', () => {
    expect(uses.filter((u) => !u.after.includes('aria-pressed=')).map((u) => u.where)).toEqual([]);
  });

  it('wraps each row in a named group', () => {
    const bad = uses.filter(
      (u) => !/role="group"/.test(u.before) || !/aria-label(ledby)?=/.test(u.before),
    );
    expect(bad.map((u) => u.where)).toEqual([]);
  });

  it('tells assistive tech which tab is current', () => {
    expect(read('ui/Nav.tsx')).toMatch(/aria-current=\{n\.on \? 'page'/);
  });
});

/* WCAG relative luminance and contrast, as in scripts/palette.mjs. */
const long = (h: string) => (h.length === 4 ? '#' + [...h.slice(1)].map((c) => c + c).join('') : h);
const lum = (short: string) => {
  const hex = long(short);
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const pick = (decl: string, re: RegExp) => {
  const m = decl.match(re);
  if (!m) throw new Error(`no match for ${re} in ${decl}`);
  return m[1];
};
const ring = /inset 0 0 0 2px (#[0-9a-f]{3,6})/i;
const bg = /background:(#[0-9a-f]{3,6})/i;
const fg = /[^-]color:(#[0-9a-f]{3,6})/i;

/** The tab bar's ground: rgba(245,234,216,.94) over the #fffaf3 shell. */
const NAV_GROUND = '#f6ebda';

describe('selected-state contrast', () => {
  it('PILL_ON keeps a 3:1 ring and 4.5:1 text', () => {
    const r = pick(PILL_ON, ring);
    expect(ratio(r, '#ffffff')).toBeGreaterThanOrEqual(3);
    expect(ratio(r, '#fffaf3')).toBeGreaterThanOrEqual(3);
    expect(ratio(r, pick(PILL_ON, bg))).toBeGreaterThanOrEqual(3);
    expect(ratio(pick(PILL_ON, fg), pick(PILL_ON, bg))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(pick(PILL_OFF, fg), pick(PILL_OFF, bg))).toBeGreaterThanOrEqual(4.5);
  });

  const pantry = read('state/usePantry.ts');

  it("LEVEL_ON's ring clears 3:1 against its own fill", () => {
    const level = pick(pantry, /const LEVEL_ON = '([^']+)'/);
    expect(ratio(pick(level, ring), pick(level, bg))).toBeGreaterThanOrEqual(3);
  });

  it('the shop tier tags are AA at 10.5px', () => {
    const tagBg = pantry.match(/tagBg: on \? '(#[0-9a-f]{3,6})' : '(#[0-9a-f]{3,6})'/i);
    const tagFg = pantry.match(/tagFg: on \? '(#[0-9a-f]{3,6})' : '(#[0-9a-f]{3,6})'/i);
    expect(tagBg && tagFg).toBeTruthy();
    expect(ratio(tagFg![1], tagBg![1])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tagFg![2], tagBg![2])).toBeGreaterThanOrEqual(4.5);
  });

  it('every tab label is AA on the bar and on the current-tab pill', () => {
    const nav = pantry.slice(pantry.indexOf('nav: navItems.map'));
    const colours = [...nav.slice(0, nav.indexOf('go: () =>')).matchAll(/[^-]color:(#[0-9a-f]{3,6})/gi)].map((m) => m[1]);
    expect(colours.length).toBeGreaterThanOrEqual(2);
    for (const c of colours) {
      expect(ratio(c, NAV_GROUND)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    }
  });
});
