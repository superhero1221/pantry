import { describe, expect, it } from 'vitest';
import { css, join } from './css';

describe('css', () => {
  it('turns declaration strings into style objects', () => {
    expect(css('display:flex;gap:11px')).toEqual({ display: 'flex', gap: '11px' });
  });

  it('camel-cases hyphenated properties', () => {
    expect(css('border-radius:999px;font-weight:700')).toEqual({
      borderRadius: '999px',
      fontWeight: '700',
    });
  });

  it('leaves custom properties alone', () => {
    expect(css('--shell-max:480px')).toEqual({ '--shell-max': '480px' });
  });

  it('keeps a colon inside a value, but splits on a semicolon inside one', () => {
    // Colons are safe: only the first one separates property from value.
    expect(css('background:linear-gradient(to right, red, blue)')).toEqual({
      background: 'linear-gradient(to right, red, blue)',
    });
    // Semicolons are NOT — a data URI in a declaration string gets truncated.
    // Documented rather than fixed: every data URI in this app is passed as a
    // style object, never as a string, so the parser is never handed one.
    expect(css('background:url(data:image/webp;base64,AAA)')).toEqual({
      background: 'url(data:image/webp',
    });
  });

  it('survives the shapes the state layer actually produces', () => {
    const pill =
      'flex:none;padding:11px 16px;border-radius:999px;font-size:14px;font-weight:600;white-space:nowrap;transition:background .15s,color .15s;';
    const out = css(pill);
    expect(out.whiteSpace).toBe('nowrap');
    expect(out.transition).toBe('background .15s,color .15s');
    // the trailing semicolon must not create an empty key
    expect(Object.keys(out)).not.toContain('');
  });

  it('passes objects straight through and tolerates nothing', () => {
    expect(css({ color: 'red' })).toEqual({ color: 'red' });
    expect(css(null)).toEqual({});
    expect(css(undefined)).toEqual({});
    expect(css('')).toEqual({});
  });

  it('joins only the truthy parts', () => {
    expect(join('a:1', false, null, 'b:2')).toBe('a:1;b:2');
  });
});
