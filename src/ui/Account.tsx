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
          style={css('margin-top:10px;padding:16px 18px;border-radius:26px;background:#f9f4ed;font-size:13.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}
        >
          {x('cloudOff')}
        </div>
      )}

      {v.cloudEnabled && v.signedIn && (
        <div style={css('margin-top:10px;padding:17px 19px;border-radius:26px;background:#e1eecc')}>
          <div style={css('display:flex;gap:11px;align-items:center')}>
            <span style={css('flex:none;width:30px;height:30px;border-radius:50%;background:#8fa073;display:flex;align-items:center;justify-content:center')}>
              <Check size={17} stroke="#fff" width={3} />
            </span>
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#56633f;opacity:.8')}>
                {x('signedInAs')}
              </span>
              <span style={css('display:block;font-size:14.5px;font-weight:700;color:#3d472b;margin-top:2px;overflow-wrap:anywhere')}>
                {v.email}
              </span>
            </span>
          </div>
          <Btn
            onClick={v.signOut}
            css="height:42px;padding:0 20px;border-radius:999px;background:#ccdbb2;font-size:14px;font-weight:700;color:#3d472b;margin-top:13px"
            hover="background:#aebf92"
          >
            {x('signOut')}
          </Btn>
        </div>
      )}

      {v.cloudEnabled && !v.signedIn && (
        <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#fff2eb')}>
          <div dir="auto" style={css('font-size:15.5px;font-weight:700;color:#643312;line-height:1.35')}>
            {x('accountTitle')}
          </div>
          <p dir="auto" style={css('margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#8c491a;text-wrap:pretty')}>
            {x('accountBody')}
          </p>

          {v.authStatus === 'sent' ? (
            <div
              dir="auto"
              style={css('margin-top:14px;padding:14px 16px;border-radius:22px;background:#ffe1d0;font-size:13.5px;line-height:1.5;font-weight:600;color:#643312;text-wrap:pretty')}
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
                  css="height:42px;padding:0 18px;border-radius:999px;background:#c67139;color:#fff;font-size:14px;font-weight:700;white-space:nowrap"
                  hover="background:#b2622d"
                >
                  {v.authStatus === 'loading' ? x('syncing') : x('sendLink')}
                </Btn>
              </div>
              {v.authError && (
                <p dir="auto" style={css('margin:9px 2px 0;font-size:12.5px;line-height:1.5;color:#8c491a;font-weight:600')}>
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
