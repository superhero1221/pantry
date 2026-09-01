import { useState } from 'react';
import { css } from '../lib/css';
import { Btn } from './Btn';
import { Kicker } from './bits';
import { Check } from './Icon';
import type { Pantry } from '../state/usePantry';

/**
 * Signing in is a footnote, not a wall. The app has already worked for you by
 * the time you see this, so the copy explains what changes rather than what
 * you get, and there is no password to invent.
 */
export function Account({ v }: { v: Pantry }) {
  const [email, setEmail] = useState('');
  const x = v.xt;

  return (
    <>
      <Kicker style={{ marginTop: 18 }}>{x('account')}</Kicker>

      {!v.cloudEnabled && (
        <div
          dir="auto"
          style={css('margin-top:10px;padding:16px 18px;border-radius:26px;background:#ffffff;font-size:13.5px;line-height:1.5;color:#6a5c4c;text-wrap:pretty')}
        >
          {x('cloudOff')}
        </div>
      )}

      {v.cloudEnabled && v.signedIn && (
        <div style={css('margin-top:10px;padding:17px 19px;border-radius:26px;background:#e2f8c6')}>
          <div style={css('display:flex;gap:11px;align-items:center')}>
            <span style={css('flex:none;width:30px;height:30px;border-radius:50%;background:#7cc24a;display:flex;align-items:center;justify-content:center')}>
              <Check size={17} stroke="#fff" width={3} />
            </span>
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#3d7213;opacity:.8')}>
                {x('signedInAs')}
              </span>
              <span style={css('display:block;font-size:14.5px;font-weight:700;color:#2c5410;margin-top:2px;overflow-wrap:anywhere')}>
                {v.email}
              </span>
            </span>
          </div>
          <Btn
            onClick={v.signOut}
            css="height:42px;padding:0 20px;border-radius:999px;background:#cdf0a4;font-size:14px;font-weight:700;color:#2c5410;margin-top:13px"
            hover="background:#a8dc78"
          >
            {x('signOut')}
          </Btn>
        </div>
      )}

      {v.cloudEnabled && !v.signedIn && (
        <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#fff4ea')}>
          <div dir="auto" style={css('font-size:15.5px;font-weight:700;color:#7d2f04;line-height:1.35')}>
            {x('accountTitle')}
          </div>
          <p dir="auto" style={css('margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#a83f06;text-wrap:pretty')}>
            {x('accountBody')}
          </p>

          {v.authStatus === 'sent' ? (
            <div
              dir="auto"
              style={css('margin-top:14px;padding:14px 16px;border-radius:22px;background:#ffe4cd;font-size:13.5px;line-height:1.5;font-weight:600;color:#7d2f04;text-wrap:pretty')}
            >
              {x('linkSent')}
            </div>
          ) : (
            <>
              <div style={css('margin-top:14px;display:flex;align-items:center;gap:9px;padding-inline:16px 6px;height:54px;border-radius:999px;background:#fff')}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={x('emailPlaceholder')}
                  aria-label={x('emailLabel')}
                  style={css('flex:1;min-width:0;border:0;outline:none;background:none;font-size:14.5px;font-weight:600')}
                />
                <Btn
                  onClick={() => email.includes('@') && v.signIn(email.trim())}
                  disabled={v.authStatus === 'loading'}
                  css="height:42px;padding:0 18px;border-radius:999px;background:#a83f06;color:#fff;font-size:14px;font-weight:700;white-space:nowrap"
                  hover="background:#c04a03"
                >
                  {/* Not "Syncing" — nothing is syncing yet. One email is being
                      sent, and that is what it should say. */}
                  {v.authStatus === 'loading' ? x('sendingLink') : x('sendLink')}
                </Btn>
              </div>
              {v.authError && (
                <p dir="auto" style={css('margin:9px 2px 0;font-size:12.5px;line-height:1.5;color:#a83f06;font-weight:600')}>
                  {v.authError}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
