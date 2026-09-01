import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Ask } from '../ui/bits';
import { MascotMid } from '../ui/Mascot';
import type { Pantry } from '../state/usePantry';

export function Diet({ v }: { v: Pantry }) {
  return (
    <Ask
      title={v.t.dietTitle}
      sub={v.u.dietSub}
      step={2}
      stepLabel={v.dotsLabel(2)}
      back={v.t.back}
      onBack={v.back}
      note={v.dietNote}
      /* Walking while nothing is chosen, winking once something is. The
         difference is small on purpose — this is a question where picking
         nothing is a real answer, and a character that only cheers up when you
         tick a box turns "no" into the wrong one. */
      art={<MascotMid key={v.dietChosen ? 'on' : 'off'} pose={v.dietChosen ? 'wink' : 'walk'} jar="clamp(46px, 10vh, 74px)" />}
      foot={
        <Btn
          onClick={v.toLocate}
          css="width:100%;height:56px;border-radius:999px;background:#e85d04;color:#fff;font-size:19px;font-weight:700;box-shadow:0 3px 10px rgba(46,43,37,.16)"
          hover="background:#c04a03"
        >
          {v.t.tierNext}
        </Btn>
      }
    >
      <div style={css('display:flex;flex-wrap:wrap;gap:9px;justify-content:center')}>
        {v.dietChips.map((d) => (
          <Btn key={d.key} onClick={d.toggle} aria-pressed={d.on} css={d.style}>
            {d.label}
          </Btn>
        ))}
      </div>
    </Ask>
  );
}
