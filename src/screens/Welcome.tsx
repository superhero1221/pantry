import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import type { Pantry } from '../state/usePantry';

const BLOB = 'position:absolute;border-radius:50%';

export function Welcome({ v }: { v: Pantry }) {
  const points: [string, string][] = [
    [v.t.welcome1, '#c67139'],
    [v.t.welcome3, '#8fa073'],
    [v.t.welcome2, '#a19786'],
  ];

  return (
    <div
      style={css(
        'min-height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:34px 26px',
      )}
    >
      <div style={css('position:relative')}>
        <div style={css(BLOB + ';top:-14px;inset-inline-end:-46px;width:190px;height:190px;background:#e1eecc;opacity:.75')} />
        <div style={css(BLOB + ';top:104px;inset-inline-end:64px;width:88px;height:88px;background:#ffc6a5;opacity:.8')} />
        <div style={css('position:relative;padding-top:18px')}>
          <div
            style={css(
              "width:62px;height:62px;border-radius:20px;background:#c67139;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;color:#fff;font-size:34px;box-shadow:0 3px 10px rgba(46,43,37,.16)",
            )}
          >
            P
          </div>
          <h1
            dir="auto"
            style={css(
              "font-family:'Caprasimo',serif;font-weight:400;font-size:52px;line-height:.98;margin:26px 0 0;letter-spacing:-.5px",
            )}
          >
            Pantry
          </h1>
          <p
            dir="auto"
            style={css('font-size:19px;line-height:1.45;margin:16px 0 0;max-width:270px;color:#474238;text-wrap:pretty')}
          >
            {v.t.welcomeTag}
          </p>
        </div>
      </div>

      <div style={css('display:flex;flex-direction:column;gap:16px;padding-top:40px')}>
        <div style={css('display:flex;flex-direction:column;gap:10px')}>
          {points.map(([text, dot]) => (
            <div key={text} style={css('display:flex;gap:10px;align-items:center;font-size:14.5px;color:#474238')}>
              <span style={css(`flex:none;width:9px;height:9px;border-radius:50%;background:${dot}`)} />
              {text}
            </div>
          ))}
        </div>
        <Btn
          onClick={v.start}
          css="width:100%;height:58px;border-radius:999px;background:#c67139;color:#fff;font-size:19px;font-weight:700;box-shadow:0 3px 10px rgba(46,43,37,.16)"
          hover="background:#b2622d"
        >
          {v.u.setMe}
        </Btn>
        <Btn
          onClick={v.skipOnboarding}
          css="width:100%;height:44px;border-radius:999px;font-size:15px;font-weight:600;color:#645c50"
          hover="background:#eee7db"
        >
          {v.t.welcomeSkip}
        </Btn>
      </div>
    </div>
  );
}
