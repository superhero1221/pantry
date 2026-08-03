import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Dots } from '../ui/bits';
import { Pin } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

const H2 = "font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.06;margin:0;letter-spacing:-.3px";
/* opacity:0 is the resting state: a ripple that is not running is not there.
   The keyframes set opacity at every stop, so this is only ever seen when the
   animation is not — during its delay, and when reduced motion is honoured. */
const PING = 'position:absolute;inset:0;border-radius:50%;background:#c67139;opacity:0';

export function Locate({ v }: { v: Pantry }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:14px 22px 22px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
        <Dots at={3} />
        <span style={css('width:38px')} />
      </div>

      {v.locating && (
        <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px')}>
          <div style={css('position:relative;width:150px;height:150px;display:flex;align-items:center;justify-content:center')}>
            <span style={css(PING + ';animation:pgPing 2s ease-out infinite')} />
            <span style={css(PING + ';animation:pgPing 2s ease-out .66s infinite')} />
            <span style={css(PING + ';animation:pgPing 2s ease-out 1.33s infinite')} />
            <span style={css('position:relative;width:62px;height:62px;border-radius:50%;background:#c67139;display:flex;align-items:center;justify-content:center')}>
              <Pin size={30} stroke="#fff" />
            </span>
          </div>
          <p dir="auto" style={css("font-family:'Caprasimo',serif;font-size:22px;margin:0;color:#645c50")}>
            {v.t.locFinding}
          </p>
        </div>
      )}

      {v.located && (
        <div style={css('animation:pgUp .4s ease-out both')}>
          {/* "Found you" is only true after a real fix. Until then it is a
              question, and the card below is an assumption you can change. */}
          <h2 dir="auto" style={css(H2)}>
            {v.liveOn ? v.t.locFound : v.xt('locStart')}
          </h2>

          <div style={css('margin-top:16px;padding:20px;border-radius:28px;background:#ebddc5;display:flex;gap:14px;align-items:center')}>
            <div style={css("flex:none;width:52px;height:52px;border-radius:50%;background:#c67139;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;color:#fff;font-size:19px")}>
              {v.countryCode}
            </div>
            <div style={css('min-width:0')}>
              <div style={css('font-size:19px;font-weight:700;line-height:1.2')}>{v.cityName}</div>
              <div style={css('font-size:13.5px;color:#645c50;margin-top:3px')}>{v.countryLine}</div>
            </div>
          </div>

          {v.liveIdle && (
            <div style={css('margin-top:12px;padding:19px 20px;border-radius:28px;background:#fff2eb')}>
              <div dir="auto" style={css('font-size:15.5px;font-weight:700;color:#643312;line-height:1.35')}>
                {v.u.lookTitle}
              </div>
              <p dir="auto" style={css('margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#8c491a;text-wrap:pretty')}>
                {v.t.locWhy}
              </p>
              <Btn
                onClick={v.useLocation}
                css="width:100%;height:50px;border-radius:999px;background:#c67139;color:#fff;font-size:15.5px;font-weight:700;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:9px"
                hover="background:#b2622d"
              >
                <Pin size={19} stroke="#fff" />
                {v.t.locUse}
              </Btn>
            </div>
          )}

          {v.liveBusy && (
            <div style={css('margin-top:12px;padding:19px 20px;border-radius:28px;background:#ebddc5;font-size:14px;font-weight:600;color:#474238')}>
              {v.t.locFinding}
            </div>
          )}

          {v.liveOn && (
            <div style={css('margin-top:12px;padding:19px 20px;border-radius:28px;background:#e1eecc;animation:pgUp .3s ease-out both')}>
              <div dir="auto" style={css('font-size:15.5px;font-weight:700;color:#3d472b;line-height:1.35')}>
                {v.liveAreaLine}
              </div>
              <p dir="auto" style={css('margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#3d472b;opacity:.85;text-wrap:pretty')}>
                {v.liveShopLine}
              </p>
            </div>
          )}

          {v.liveFailed && (
            <div style={css('margin-top:12px;padding:17px 19px;border-radius:26px;background:#ebddc5')}>
              <div dir="auto" style={css('font-size:14px;font-weight:700;color:#474238')}>
                {v.liveErrText}
              </div>
              <p dir="auto" style={css('margin:6px 0 0;font-size:13px;line-height:1.5;color:#645c50;text-wrap:pretty')}>
                {v.u.noBother}
              </p>
            </div>
          )}

          <p dir="auto" style={css('font-size:13.5px;line-height:1.5;color:#645c50;margin:14px 2px 0;text-wrap:pretty')}>
            {/* The one string the design's translation sweep never reached — it has no
                key in pantry-i18n.js, so it renders in English in every language. */}
            Every price you see from here is in {v.currencyName}, at shops that actually exist near you. Not
            right?
          </p>

          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:12px')}>
            {v.countryChips.map((c) => (
              <Btn key={c.key} onClick={c.pick} css={c.style}>
                {c.label}
              </Btn>
            ))}
          </div>

          <div
            dir="auto"
            style={css('margin-top:20px;padding:15px 16px;border-radius:22px;background:#e1eecc;font-size:13px;line-height:1.5;color:#3d472b;text-wrap:pretty')}
          >
            {v.u.coverage}
          </div>

          <Btn
            onClick={v.finishOnboarding}
            css="width:100%;height:54px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700;margin-top:20px"
            hover="background:#b2622d"
          >
            {v.u.thatsMe}
          </Btn>
        </div>
      )}
    </div>
  );
}
