/** Leftover verdict and reasoning for a recipe, as [title, body]. */
export declare const keepText: (code: string, id: string) => [string, string] | null;
export declare const food: (code: string) => Record<string, string> | null;
/** Translate an ingredient or micronutrient name, falling back to the English. */
export declare const foodName: (code: string, en: string) => string;
