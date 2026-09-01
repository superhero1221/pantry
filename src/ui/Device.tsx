import { css } from '../lib/css';
import { Btn } from './Btn';
import { Kicker } from './bits';
import { Check } from './Icon';
import { usePwa } from '../state/usePwa';
import type { Pantry } from '../state/usePantry';

const NOTE =
  'margin-top:10px;padding:16px 18px;border-radius:26px;font-size:13.5px;line-height:1.5;text-wrap:pretty';

/** Home-screen install and the leftover nudge. Both optional, both reversible. */
export function Device({ v }: { v: Pantry }) {
  const pwa = usePwa(v.userId);
  const x = v.xt;

  const showNotify = pwa.pushConfigured && pwa.permission !== 'unsupported';

  return (
    <>
      <Kicker style={{ marginTop: 24 }}>{x('installTitle')}</Kicker>

      {pwa.installed ? (
        <div dir="auto" style={css(NOTE + ';background:#e2f8c6;color:#2c5410;display:flex;gap:11px;align-items:flex-start')}>
          <Check size={18} stroke="#3d7213" style={{ flex: 'none', marginTop: 2 }} />
          <span>{x('offlineReady')}</span>
        </div>
      ) : (
        <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#ffffff')}>
          <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#6a5c4c;text-wrap:pretty')}>
            {x('installBody')}
          </p>
          {pwa.canInstall && (
            <Btn
              onClick={pwa.install}
              css="height:46px;padding:0 22px;border-radius:999px;background:#a83f06;color:#fff;font-size:14.5px;font-weight:700;margin-top:13px"
              hover="background:#c04a03"
            >
              {x('install')}
            </Btn>
          )}
          {pwa.iosOnly && (
            <p dir="auto" style={css('margin:11px 0 0;font-size:12.5px;line-height:1.5;color:#6a5c4c;font-weight:600')}>
              {x('installIos')}
            </p>
          )}
        </div>
      )}

      {showNotify && (
        <>
          <Kicker style={{ marginTop: 24 }}>{x('notifyTitle')}</Kicker>
          {pwa.subscribed && pwa.permission === 'granted' ? (
            <div dir="auto" style={css(NOTE + ';background:#e2f8c6;color:#2c5410;display:flex;gap:11px;align-items:flex-start')}>
              <Check size={18} stroke="#3d7213" style={{ flex: 'none', marginTop: 2 }} />
              <span>{x('notifyGranted')}</span>
            </div>
          ) : pwa.permission === 'denied' ? (
            <div dir="auto" style={css(NOTE + ';background:#ffffff;color:#6a5c4c')}>
              {x('notifyDenied')}
            </div>
          ) : (
            <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#fff4ea')}>
              <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#a83f06;text-wrap:pretty')}>
                {x('notifyBody')}
              </p>
              {v.signedIn ? (
                <Btn
                  onClick={pwa.enableNudges}
                  css="height:46px;padding:0 22px;border-radius:999px;background:#a83f06;color:#fff;font-size:14.5px;font-weight:700;margin-top:13px"
                  hover="background:#c04a03"
                >
                  {x('notifyOn')}
                </Btn>
              ) : (
                <p dir="auto" style={css('margin:11px 0 0;font-size:12.5px;line-height:1.5;color:#a83f06;font-weight:600')}>
                  {x('notifyNeedsAccount')}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
