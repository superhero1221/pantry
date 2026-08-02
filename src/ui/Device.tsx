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
        <div dir="auto" style={css(NOTE + ';background:#e1eecc;color:#3d472b;display:flex;gap:11px;align-items:flex-start')}>
          <Check size={18} stroke="#56633f" style={{ flex: 'none', marginTop: 2 }} />
          <span>{x('offlineReady')}</span>
        </div>
      ) : (
        <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#f9f4ed')}>
          <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}>
            {x('installBody')}
          </p>
          {pwa.canInstall && (
            <Btn
              onClick={pwa.install}
              css="height:46px;padding:0 22px;border-radius:999px;background:#c67139;color:#fff;font-size:14.5px;font-weight:700;margin-top:13px"
              hover="background:#b2622d"
            >
              {x('install')}
            </Btn>
          )}
          {pwa.iosOnly && (
            <p dir="auto" style={css('margin:11px 0 0;font-size:12.5px;line-height:1.5;color:#82796a;font-weight:600')}>
              {x('installIos')}
            </p>
          )}
        </div>
      )}

      {showNotify && (
        <>
          <Kicker style={{ marginTop: 24 }}>{x('notifyTitle')}</Kicker>
          {pwa.subscribed && pwa.permission === 'granted' ? (
            <div dir="auto" style={css(NOTE + ';background:#e1eecc;color:#3d472b;display:flex;gap:11px;align-items:flex-start')}>
              <Check size={18} stroke="#56633f" style={{ flex: 'none', marginTop: 2 }} />
              <span>{x('notifyGranted')}</span>
            </div>
          ) : pwa.permission === 'denied' ? (
            <div dir="auto" style={css(NOTE + ';background:#f9f4ed;color:#82796a')}>
              {x('notifyDenied')}
            </div>
          ) : (
            <div style={css('margin-top:10px;padding:18px 20px;border-radius:28px;background:#fff2eb')}>
              <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#8c491a;text-wrap:pretty')}>
                {x('notifyBody')}
              </p>
              {v.signedIn ? (
                <Btn
                  onClick={pwa.enableNudges}
                  css="height:46px;padding:0 22px;border-radius:999px;background:#c67139;color:#fff;font-size:14.5px;font-weight:700;margin-top:13px"
                  hover="background:#b2622d"
                >
                  {x('notifyOn')}
                </Btn>
              ) : (
                <p dir="auto" style={css('margin:11px 0 0;font-size:12.5px;line-height:1.5;color:#8c491a;font-weight:600')}>
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
