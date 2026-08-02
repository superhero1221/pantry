import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { DishPic } from '../ui/bits';
import type { Pantry } from '../state/usePantry';

export function Browse({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:14px 22px 26px')}>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {v.wholeMenuTitle}
      </h1>
      <p dir="auto" style={css('font-size:14px;line-height:1.5;margin:8px 0 0;color:#645c50;text-wrap:pretty')}>
        {v.browseSub}
      </p>

      <div className="pg-x" style={css('display:flex;gap:8px;margin:14px -22px 0;padding:2px 22px')}>
        {v.browseCats.map((b) => (
          <Btn key={b.key} onClick={b.pick} css={b.style}>
            {b.label}
          </Btn>
        ))}
      </div>

      <div style={css('display:flex;flex-direction:column;gap:9px;margin-top:16px')}>
        {v.browseList.map((x) => (
          <Btn
            key={x.key}
            onClick={x.pick}
            css="display:flex;gap:13px;align-items:center;padding:12px;border-radius:28px;background:#f9f4ed;text-align:start;width:100%"
            hover="background:#eee7db"
          >
            <DishPic src={x.pic} size={74} radius={22} />
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:15.5px;font-weight:700;line-height:1.25')}>{x.name}</span>
              <span style={css('display:block;font-size:12.5px;color:#82796a;margin-top:3px')}>{x.cuisine}</span>
              <span
                style={css(
                  `display:inline-block;margin-top:8px;padding:4px 11px;border-radius:999px;background:${x.diffBg};color:${x.diffFg};font-size:11px;font-weight:700`,
                )}
              >
                {x.diffLabel}
              </span>
            </span>
            <span style={css('flex:none;text-align:end')}>
              <span style={css("display:block;font-family:'Caprasimo',serif;font-size:20px;color:#8c491a")}>
                {x.per}
              </span>
              <span style={css('display:block;font-size:10.5px;color:#82796a;margin-top:2px')}>
                {v.t.resServing}
              </span>
            </span>
          </Btn>
        ))}
      </div>
    </div>
  );
}
