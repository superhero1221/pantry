export interface Coords {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface Place {
  city: string;
  area: string;
  countryCode: string;
  countryName: string;
  attribution: string;
}

export interface Shop {
  name: string;
  brand: string;
  km: number;
  hours: string;
  osmId: string;
  tierLabel: string;
  mult: number;
}

export interface Price {
  value: number;
  currency: string;
  n: number;
  newest: string;
  source: string;
}

export declare const setVendorKey: (k: string) => void;
export declare const hasVendorKey: () => boolean;
export declare function locate(opts?: PositionOptions): Promise<Coords>;
export declare function reverseGeocode(lat: number, lon: number): Promise<Place>;
export declare function nearbyShops(
  lat: number,
  lon: number,
  radius?: number,
  limit?: number,
): Promise<Shop[]>;
export declare function openPrice(ingredient: string, countryCode?: string): Promise<Price | null>;
export declare function priceBasket(
  ingredients: string[],
  countryCode: string,
): Promise<Record<string, Price>>;
export declare function vendorPrice(ingredient: string, chainDomain: string): Promise<Price | null>;

export interface Fx {
  /** The ECB publication date these rates carry, 'YYYY-MM-DD'. Empty when the
   *  answer did not say. */
  date: string;
  /** Local units per pound, by ISO 4217 code, and deliberately partial: only
   *  what the ECB actually publishes. GBP itself is included, as 1. */
  rates: Record<string, number>;
}

/** Null on any failure at all, which means "keep the bundled rates". */
export declare function fxRates(): Promise<Fx | null>;

export declare const SOURCES: { name: string; use: string; licence: string; url: string }[];
