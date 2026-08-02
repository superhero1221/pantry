import { CountryProfile } from './types';
import { WFP_COUNTRIES } from './wfp-countries';

// fx = how many units of local currency in 1 GBP (approximate, bundled, mid-2026)
// index = grocery cost level vs UK (UK = 1.00)
const HAND_WRITTEN: Record<string, CountryProfile> = {
  GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', fx: 1, index: 1.0, restaurantIndex: 1.0 },
  IE: { code: 'IE', name: 'Ireland', currency: 'EUR', symbol: '€', fx: 1.17, index: 1.08, restaurantIndex: 1.1 },
  US: { code: 'US', name: 'United States', currency: 'USD', symbol: '$', fx: 1.27, index: 1.15, restaurantIndex: 1.25 },
  CA: { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', fx: 1.74, index: 1.05, restaurantIndex: 1.1 },
  SE: { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr', fx: 13.6, index: 1.05, restaurantIndex: 1.15 },
  NO: { code: 'NO', name: 'Norway', currency: 'NOK', symbol: 'kr', fx: 13.9, index: 1.35, restaurantIndex: 1.5 },
  DK: { code: 'DK', name: 'Denmark', currency: 'DKK', symbol: 'kr', fx: 8.7, index: 1.15, restaurantIndex: 1.3 },
  FI: { code: 'FI', name: 'Finland', currency: 'EUR', symbol: '€', fx: 1.17, index: 1.1, restaurantIndex: 1.15 },
  DE: { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€', fx: 1.17, index: 0.95, restaurantIndex: 0.95 },
  FR: { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', fx: 1.17, index: 1.05, restaurantIndex: 1.1 },
  NL: { code: 'NL', name: 'Netherlands', currency: 'EUR', symbol: '€', fx: 1.17, index: 0.98, restaurantIndex: 1.05 },
  BE: { code: 'BE', name: 'Belgium', currency: 'EUR', symbol: '€', fx: 1.17, index: 1.0, restaurantIndex: 1.05 },
  AT: { code: 'AT', name: 'Austria', currency: 'EUR', symbol: '€', fx: 1.17, index: 1.0, restaurantIndex: 1.0 },
  CH: { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF', fx: 1.07, index: 1.6, restaurantIndex: 1.7 },
  IT: { code: 'IT', name: 'Italy', currency: 'EUR', symbol: '€', fx: 1.17, index: 0.9, restaurantIndex: 0.9 },
  ES: { code: 'ES', name: 'Spain', currency: 'EUR', symbol: '€', fx: 1.17, index: 0.85, restaurantIndex: 0.85 },
  PT: { code: 'PT', name: 'Portugal', currency: 'EUR', symbol: '€', fx: 1.17, index: 0.8, restaurantIndex: 0.75 },
  GR: { code: 'GR', name: 'Greece', currency: 'EUR', symbol: '€', fx: 1.17, index: 0.85, restaurantIndex: 0.8 },
  PL: { code: 'PL', name: 'Poland', currency: 'PLN', symbol: 'zł', fx: 5.0, index: 0.7, restaurantIndex: 0.6 },
  CZ: { code: 'CZ', name: 'Czechia', currency: 'CZK', symbol: 'Kč', fx: 29, index: 0.75, restaurantIndex: 0.65 },
  RO: { code: 'RO', name: 'Romania', currency: 'RON', symbol: 'lei', fx: 5.8, index: 0.6, restaurantIndex: 0.55 },
  UA: { code: 'UA', name: 'Ukraine', currency: 'UAH', symbol: '₴', fx: 53, index: 0.5, restaurantIndex: 0.45 },
  RU: { code: 'RU', name: 'Russia', currency: 'RUB', symbol: '₽', fx: 105, index: 0.55, restaurantIndex: 0.5 },
  TR: { code: 'TR', name: 'Türkiye', currency: 'TRY', symbol: '₺', fx: 44, index: 0.5, restaurantIndex: 0.45 },
  IL: { code: 'IL', name: 'Israel', currency: 'ILS', symbol: '₪', fx: 4.6, index: 1.15, restaurantIndex: 1.15 },
  JO: { code: 'JO', name: 'Jordan', currency: 'JOD', symbol: 'JD', fx: 0.9, index: 0.75, restaurantIndex: 0.7 },
  KW: { code: 'KW', name: 'Kuwait', currency: 'KWD', symbol: 'KD', fx: 0.39, index: 0.85, restaurantIndex: 0.8 },
  AE: { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'AED', fx: 4.66, index: 0.9, restaurantIndex: 0.95 },
  SA: { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: 'SR', fx: 4.76, index: 0.85, restaurantIndex: 0.8 },
  QA: { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: 'QR', fx: 4.62, index: 0.88, restaurantIndex: 0.9 },
  BH: { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: 'BD', fx: 0.478, index: 0.85, restaurantIndex: 0.8 },
  OM: { code: 'OM', name: 'Oman', currency: 'OMR', symbol: 'RO', fx: 0.488, index: 0.8, restaurantIndex: 0.75 },
  IQ: { code: 'IQ', name: 'Iraq', currency: 'IQD', symbol: 'IQD', fx: 1660, index: 0.6, restaurantIndex: 0.5 },
  EG: { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£', fx: 62, index: 0.4, restaurantIndex: 0.35 },
  MA: { code: 'MA', name: 'Morocco', currency: 'MAD', symbol: 'DH', fx: 12.6, index: 0.55, restaurantIndex: 0.5 },
  TN: { code: 'TN', name: 'Tunisia', currency: 'TND', symbol: 'DT', fx: 3.95, index: 0.45, restaurantIndex: 0.4 },
  ZA: { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', fx: 23, index: 0.55, restaurantIndex: 0.5 },
  NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', fx: 1900, index: 0.45, restaurantIndex: 0.4 },
  KE: { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', fx: 164, index: 0.5, restaurantIndex: 0.45 },
  IN: { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', fx: 108, index: 0.28, restaurantIndex: 0.25 },
  PK: { code: 'PK', name: 'Pakistan', currency: 'PKR', symbol: 'Rs', fx: 355, index: 0.28, restaurantIndex: 0.22 },
  BD: { code: 'BD', name: 'Bangladesh', currency: 'BDT', symbol: '৳', fx: 152, index: 0.35, restaurantIndex: 0.28 },
  LK: { code: 'LK', name: 'Sri Lanka', currency: 'LKR', symbol: 'Rs', fx: 380, index: 0.35, restaurantIndex: 0.3 },
  TH: { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿', fx: 43, index: 0.55, restaurantIndex: 0.4 },
  VN: { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫', fx: 32000, index: 0.45, restaurantIndex: 0.3 },
  MY: { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', fx: 5.6, index: 0.5, restaurantIndex: 0.4 },
  SG: { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', fx: 1.7, index: 1.05, restaurantIndex: 0.9 },
  ID: { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', fx: 20500, index: 0.45, restaurantIndex: 0.35 },
  PH: { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', fx: 73, index: 0.55, restaurantIndex: 0.45 },
  CN: { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', fx: 9.1, index: 0.65, restaurantIndex: 0.5 },
  JP: { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', fx: 190, index: 1.05, restaurantIndex: 0.8 },
  KR: { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩', fx: 1750, index: 1.1, restaurantIndex: 0.85 },
  AU: { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', fx: 1.94, index: 1.1, restaurantIndex: 1.15 },
  NZ: { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', fx: 2.1, index: 1.15, restaurantIndex: 1.15 },
  BR: { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', fx: 6.9, index: 0.55, restaurantIndex: 0.5 },
  MX: { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: 'MX$', fx: 23.5, index: 0.62, restaurantIndex: 0.5 },
  AR: { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: 'AR$', fx: 1400, index: 0.55, restaurantIndex: 0.5 },
  CL: { code: 'CL', name: 'Chile', currency: 'CLP', symbol: 'CLP$', fx: 1230, index: 0.7, restaurantIndex: 0.6 },
  CO: { code: 'CO', name: 'Colombia', currency: 'COP', symbol: 'COL$', fx: 5200, index: 0.5, restaurantIndex: 0.4 },
  PE: { code: 'PE', name: 'Peru', currency: 'PEN', symbol: 'S/', fx: 4.7, index: 0.55, restaurantIndex: 0.45 },
};

/**
 * Every country the app can price, in one table.
 *
 * The hand-written entries came first and cover the rich world, where the
 * exchange rate and price level had to be looked up by a person. The derived
 * ones come out of World Food Programme market data — 41 countries whose
 * currency the app simply did not know, which is what "not global" really
 * meant. Hand-written wins on collision: those have a real restaurant survey
 * behind them, and the derived entries only assume eating out tracks groceries.
 */
export const COUNTRIES: Record<string, CountryProfile> = { ...WFP_COUNTRIES, ...HAND_WRITTEN };

/** Countries whose currency and price level were derived from measured data. */
export const DERIVED_COUNTRIES = Object.keys(WFP_COUNTRIES).filter((c) => !(c in HAND_WRITTEN));

export const DEFAULT_COUNTRY: CountryProfile = {
  code: 'XX', name: 'Unknown', currency: 'GBP', symbol: '£', fx: 1, index: 1.0, restaurantIndex: 1.0,
};

export function getCountry(code?: string | null): CountryProfile {
  if (!code) return DEFAULT_COUNTRY;
  return COUNTRIES[code.toUpperCase()] ?? DEFAULT_COUNTRY;
}

export function fmtMoney(v: number, c: CountryProfile): string {
  const big = c.fx > 500; // VND, IDR, NGN, COP, CLP, KRW — no decimals
  const n = big ? Math.round(v).toLocaleString('en-US') : v.toFixed(c.fx < 1 ? 3 : 2);
  return `${c.symbol}${n}`;
}
