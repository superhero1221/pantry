import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Kicker } from '../ui/bits';
import type { Pantry } from '../state/usePantry';

export function Kitchen({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:14px 22px 26px')}>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {v.t.kitchenTitle}
      </h1>
      <p dir="auto" style={css('font-size:14px;line-height:1.5;margin:8px 0 0;color:#645c50;text-wrap:pretty')}>
        {v.kitchenSub}
      </p>

      <div
        dir="auto"
        style={css('margin-top:14px;padding:15px 17px;border-radius:24px;background:#ebddc5;font-size:12.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}
      >
        {v.xt('sampleKitchen')}
      </div>

      <div style={css('display:flex;gap:9px;margin-top:16px')}>
        <div style={css('flex:1;padding:15px;border-radius:24px;background:#fff2eb')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:26px;line-height:1;color:#8c491a")}>
            {v.useFirstCount}
          </div>
          <div style={css('font-size:12px;color:#8c491a;margin-top:5px;opacity:.85')}>{v.goingOffLabel}</div>
        </div>
        <div style={css('flex:1;padding:15px;border-radius:24px;background:#e1eecc')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:26px;line-height:1;color:#56633f")}>
            {v.stockValue}
          </div>
          <div style={css('font-size:12px;color:#56633f;margin-top:5px;opacity:.85')}>{v.cupboardLabel}</div>
        </div>
      </div>

      <Kicker color="#b2622d" style={{ marginTop: 22 }}>
        {v.t.kitchenFirst}
      </Kicker>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:10px')}>
        {v.perishables.map((p) => (
          <div key={p.key} style={css('display:flex;gap:12px;align-items:center;padding:13px 16px;border-radius:22px;background:#f9f4ed')}>
            <span
              style={css(`flex:none;width:40px;height:40px;border-radius:14px;background:${p.chipBg};color:${p.chipFg};display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1`)}
            >
              <span style={css("font-family:'Caprasimo',serif;font-size:16px")}>{p.days}</span>
              <span style={css('font-size:8px;font-weight:700;letter-spacing:.4px;margin-top:2px')}>
                {v.daysWord}
              </span>
            </span>
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:14.5px;font-weight:700')}>{p.name}</span>
              <span style={css('display:block;font-size:12px;color:#82796a;margin-top:2px')}>{p.amount}</span>
            </span>
            <Btn
              onClick={p.use}
              css="flex:none;height:34px;padding:0 14px;border-radius:999px;background:#ffe1d0;color:#8c491a;font-size:12.5px;font-weight:700"
              hover="background:#ffc6a5"
            >
              {v.useItLabel}
            </Btn>
          </div>
        ))}
      </div>

      <Kicker color="#728157" style={{ marginTop: 22 }}>
        {v.keepsMonthsLabel}
      </Kicker>
      <div style={css('display:flex;flex-wrap:wrap;gap:7px;margin-top:10px')}>
        {v.staples.map((s) => (
          <span
            key={s.key}
            style={css('padding:8px 13px;border-radius:999px;background:#e1eecc;font-size:13px;font-weight:600;color:#3d472b')}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* "Scan a receipt" used to sit here and ping a toast admitting it was
          a sketch. A button that confesses when pressed is still a button
          that does nothing — gone until there is a scanner behind it. */}
    </div>
  );
}
