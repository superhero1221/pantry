import type { Recipe } from '../data/types';

/**
 * The whole menu, filtered or ordered by one Browse chip.
 *
 * Out here rather than inline in usePantry so a test can hold it against the
 * comparators it replaced. Those called toBuy() inside the comparator — about
 * 2 × n log n price walks for "Cheapest", each one re-checking the cupboard
 * item by item — which made that chip the slowest tap in the app. Each key is
 * now worked out once per dish, and ties fall back to cookbook order, which is
 * what Array.prototype.sort already did with the old comparators (it is stable
 * by spec). Same keys, same arithmetic, same tie rule: the same order.
 *
 * `ordered` false skips the sort. Off Browse the only reader is Tonight's dish
 * count, and a sort never changes a length.
 */
export function orderBrowse(
  list: Recipe[],
  cat: string,
  priceOf: (r: Recipe) => number,
  ordered = true,
): Recipe[] {
  const by = (key: (r: Recipe) => number) =>
    ordered
      ? list
          .map((r, i) => ({ r, k: key(r), i }))
          .sort((a, b) => a.k - b.k || a.i - b.i)
          .map((e) => e.r)
      : list;
  switch (cat) {
    case 'quick':
      return list.filter((x) => x.total <= 30);
    case 'cheap':
      return by((x) => priceOf(x) / x.servings);
    case 'protein':
      return by((x) => -x.per.protein);
    case 'veg':
      return list.filter((x) => x.tags.indexOf('vegetarian') >= 0 || x.tags.indexOf('vegan') >= 0);
    case 'easy':
      return by((x) => x.diff);
    default:
      return list;
  }
}
