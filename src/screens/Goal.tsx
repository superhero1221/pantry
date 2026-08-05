import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Dots } from '../ui/bits';
import { Info } from '../ui/Icon';
import { MascotBig } from '../ui/Mascot';
import type { Pantry } from '../state/usePantry';

const H2 = "font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.06;margin:0;letter-spacing:-.3px";

export function Goal({ v }: { v: Pantry }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:14px 22px 22px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
        <Dots at={0} label={v.dotsLabel(0)} />
        <Btn
          onClick={v.toTier}
          css="height:38px;padding:0 12px;border-radius:999px;font-size:14px;font-weight:600;color:#645c50"
          hover="background:#eee7db"
        >
          {v.t.tierSkip}
        </Btn>
      </div>

      <h2 dir="auto" style={css(H2)}>
        {v.goalTitle}
      </h2>
      <p dir="auto" style={css('font-size:14.5px;line-height:1.5;margin:9px 0 20px;color:#645c50;text-wrap:pretty')}>
        {v.goalSub}
      </p>

      <div style={css('display:flex;flex-wrap:wrap;gap:9px')}>
        {v.goalChips.map((g) => (
          <Btn key={g.key} onClick={g.pick} css={g.style}>
            {g.label}
          </Btn>
        ))}
      </div>

      {/* The character acts out whatever you just picked. Keyed on the pose so
          it hops again when you change your mind, which is the moment worth
          animating — nothing else on this screen tells you the app heard you.
          It takes no room until there is something to show. */}
      {v.goalPose && (
        <div style={css('display:flex;justify-content:center;margin-top:14px')}>
          <MascotBig key={v.goalPose} pose={v.goalPose} />
        </div>
      )}

      <div style={css('margin-top:22px;padding:15px 16px;border-radius:22px;background:#e1eecc;display:flex;gap:11px;align-items:flex-start')}>
        <Info size={19} stroke="#56633f" style={{ flex: 'none', marginTop: 1 }} />
        <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#3d472b;text-wrap:pretty')}>
          {v.goalNote}
        </p>
      </div>

      <div style={css('margin-top:auto;padding-top:20px')}>
        <Btn
          onClick={v.toTier}
          css="width:100%;height:54px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700"
          hover="background:#b2622d"
        >
          {v.t.tierNext}
        </Btn>
        <Btn
          onClick={v.toTier}
          css="width:100%;height:44px;border-radius:999px;font-size:14.5px;font-weight:600;color:#645c50;margin-top:4px"
          hover="background:#eee7db"
        >
          {v.goalSkip}
        </Btn>
      </div>
    </div>
  );
}
