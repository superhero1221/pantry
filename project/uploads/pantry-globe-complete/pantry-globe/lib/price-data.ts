// GENERATED — do not edit by hand. Run `npm run prices` to refresh.
//
// Real grocery prices from Open Prices (Open Food Facts), ODbL licensed,
// community-submitted. Snapshot taken 2026-07-27.
//
// Each entry survived a median-absolute-deviation filter and needed at least
// three independent observations. `spread` is the interquartile range over the
// median — treat anything above ~0.6 as a wide, weakly-supported price.
//
// Coverage is deliberately partial. Ingredients absent here fall back to the
// estimate model in lib/prices.ts, and the UI labels which is which.

export interface RealPrice { gbpPerKg: number; n: number; rejected: number; spread: number }

export const PRICE_SNAPSHOT_DATE = '2026-07-27';
export const PRICE_SOURCE = 'Open Prices (Open Food Facts), ODbL';

export const REAL_PRICES: Record<string, RealPrice> = {
  "chicken_thigh": {
    "gbpPerKg": 4.094,
    "n": 3,
    "rejected": 1,
    "spread": 0.12
  },
  "onion": {
    "gbpPerKg": 2.436,
    "n": 79,
    "rejected": 3,
    "spread": 0.53
  },
  "red_onion": {
    "gbpPerKg": 3.333,
    "n": 73,
    "rejected": 18,
    "spread": 0.25
  },
  "potato": {
    "gbpPerKg": 1.692,
    "n": 83,
    "rejected": 7,
    "spread": 0.55
  },
  "sweet_potato": {
    "gbpPerKg": 2.726,
    "n": 65,
    "rejected": 3,
    "spread": 0.43
  },
  "carrot": {
    "gbpPerKg": 1.701,
    "n": 82,
    "rejected": 11,
    "spread": 0.18
  },
  "courgette": {
    "gbpPerKg": 2.265,
    "n": 91,
    "rejected": 7,
    "spread": 0.44
  },
  "aubergine": {
    "gbpPerKg": 3.632,
    "n": 94,
    "rejected": 2,
    "spread": 0.47
  },
  "red_pepper": {
    "gbpPerKg": 4.231,
    "n": 91,
    "rejected": 5,
    "spread": 0.36
  },
  "mushroom": {
    "gbpPerKg": 9.06,
    "n": 98,
    "rejected": 0,
    "spread": 0.66
  },
  "white_cabbage": {
    "gbpPerKg": 2.251,
    "n": 24,
    "rejected": 0,
    "spread": 0.91
  },
  "spinach_fresh": {
    "gbpPerKg": 4.701,
    "n": 35,
    "rejected": 5,
    "spread": 0.29
  },
  "avocado": {
    "gbpPerKg": 5.111,
    "n": 13,
    "rejected": 3,
    "spread": 0.31
  },
  "cucumber": {
    "gbpPerKg": 1.705,
    "n": 10,
    "rejected": 3,
    "spread": 0.44
  },
  "tomato_fresh": {
    "gbpPerKg": 3.376,
    "n": 89,
    "rejected": 0,
    "spread": 0.73
  },
  "lettuce": {
    "gbpPerKg": 3.684,
    "n": 7,
    "rejected": 2,
    "spread": 0.76
  },
  "lemon": {
    "gbpPerKg": 3.325,
    "n": 69,
    "rejected": 3,
    "spread": 0.39
  },
  "lime": {
    "gbpPerKg": 5.744,
    "n": 52,
    "rejected": 0,
    "spread": 0.51
  },
  "almonds": {
    "gbpPerKg": 9.393,
    "n": 7,
    "rejected": 0,
    "spread": 0.79
  },
  "cashews": {
    "gbpPerKg": 17.902,
    "n": 10,
    "rejected": 0,
    "spread": 0.51
  }
};
