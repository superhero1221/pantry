import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Dots } from '../ui/bits';
import { Info } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

const H2 = "font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.06;margin:0;letter-spacing:-.3px";

export function Diet({ v }: { v: Pantry }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:14px 22px 22px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
        <BackBtn onClick={v.back} />
        <Dots at={2} of={4} width={26} />
        <span style={css('width:38px')} />
      </div>

      <h2 dir="auto" style={css(H2)}>
        {v.t.dietTitle}
      </h2>
      <p dir="auto" style={css('font-size:14.5px;line-height:1.5;margin:9px 0 20px;color:#645c50;text-wrap:pretty')}>
        {v.u.dietSub}
      </p>

      <div style={css('display:flex;flex-wrap:wrap;gap:9px')}>
        {v.dietChips.map((d) => (
          <Btn key={d.key} onClick={d.toggle} css={d.style}>
            {d.label}
          </Btn>
        ))}
      </div>

      <div style={css('margin-top:22px;padding:15px 16px;border-radius:22px;background:#fff2eb;display:flex;gap:11px;align-items:flex-start')}>
        <Info size={19} stroke="#b2622d" style={{ flex: 'none', marginTop: 1 }} />
        <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#643312;text-wrap:pretty')}>
          {v.dietNote}
        </p>
      </div>

      <div style={css('margin-top:auto;padding-top:20px')}>
        <Btn
          onClick={v.toLocate}
          css="width:100%;height:54px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700"
          hover="background:#b2622d"
        >
          {v.t.tierNext}
        </Btn>
      </div>
    </div>
  );
}
