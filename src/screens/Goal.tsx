import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Ask } from '../ui/bits';
import { MascotBig, MascotMid } from '../ui/Mascot';
import type { Pantry } from '../state/usePantry';

export function Goal({ v }: { v: Pantry }) {
  return (
    <Ask
      title={v.goalTitle}
      sub={v.goalSub}
      step={0}
      stepLabel={v.dotsLabel(0)}
      back={v.t.back}
      onBack={v.back}
      skip={v.t.tierSkip}
      onSkip={v.toTier}
      note={v.goalNote}
      /* The character acts out whatever you just picked, keyed on the pose so
         it hops again when you change your mind. That is the moment worth
         animating: nothing else on this screen tells you the app heard you.
         Before you have picked, it is the empty-handed one thinking — the six
         goal drawings are all holding something, and one of them standing
         there before you have chosen would be answering for you. */
      art={
        v.goalPose ? (
          <MascotBig key={v.goalPose} pose={v.goalPose} jar="clamp(52px, 12vh, 88px)" />
        ) : (
          <MascotMid pose="think" jar="clamp(46px, 10vh, 74px)" />
        )
      }
      foot={
        <Btn
          onClick={v.toTier}
          css="width:100%;height:56px;border-radius:999px;background:#c67139;color:#fff;font-size:19px;font-weight:700;box-shadow:0 3px 10px rgba(46,43,37,.16)"
          hover="background:#b2622d"
        >
          {v.t.tierNext}
        </Btn>
      }
    >
      {/* Centred, so a row of two and a row of one read as a considered shape
          rather than as a list that ran out. */}
      <div style={css('display:flex;flex-wrap:wrap;gap:9px;justify-content:center')}>
        {v.goalChips.map((g) => (
          <Btn key={g.key} onClick={g.pick} css={g.style}>
            {g.label}
          </Btn>
        ))}
      </div>
    </Ask>
  );
}
