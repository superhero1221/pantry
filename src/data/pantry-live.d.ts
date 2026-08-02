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
export declare const SOURCES: { name: string; use: string; licence: string; url: string }[];
