import { describe, expect, it } from 'vitest';
import { creditOf, licenceUrl } from './photo-credit';

describe('photo credits', () => {
  it('turns the manifest licence into its deed', () => {
    expect(licenceUrl('CC BY 2.0')).toBe('https://creativecommons.org/licenses/by/2.0/');
    expect(licenceUrl('CC BY-SA 4.0')).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(licenceUrl('CC BY-SA 2.0 kr')).toBe('https://creativecommons.org/licenses/by-sa/2.0/kr/');
    expect(licenceUrl('CC0')).toBe('https://creativecommons.org/publicdomain/zero/1.0/');
    expect(licenceUrl('Public domain')).toBe('https://creativecommons.org/publicdomain/mark/1.0/');
    expect(licenceUrl('All rights reserved')).toBeNull();
  });

  it('answers null for a drawing', () => {
    expect(creditOf('aloo_gobi')).toBeNull();
  });

  it('finds a photograph filed under its own name rather than the recipe id', () => {
    // mango_wings' picture is buffalo_wings_baked.webp, and that is the key
    // the manifest has it under.
    const c = creditOf('mango_wings');
    expect(c?.author).toBeTruthy();
    expect(c?.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  });

  it('cleans a scraped author down to the name', () => {
    expect(creditOf('lancashire_hotpot')?.author).toBe('alexcwood');
    expect(creditOf('nasi_goreng')?.author).toBe('shankar s.');
  });
});
