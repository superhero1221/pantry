import { css } from '../lib/css';
import type { Pantry } from '../state/usePantry';

export function Passport({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:14px 22px 26px')}>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {v.t.passTitle}
      </h1>
      <p dir="auto" style={css('font-size:14px;line-height:1.5;margin:8px 0 0;color:#645c50;text-wrap:pretty')}>
        {v.passportSub}
      </p>

      {v.passportIsSample && (
        <div
          dir="auto"
          style={css('margin-top:14px;padding:15px 17px;border-radius:24px;background:#ebddc5;font-size:12.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}
        >
          {v.xt('samplePassport')}
        </div>
      )}

      <div style={css('margin-top:14px;padding:20px;border-radius:28px;background:#201e1d;color:#f5ead8;display:flex;gap:18px')}>
        <div style={css('flex:1')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:34px;line-height:1;color:#f6a06b")}>
            {v.countriesCooked}
          </div>
          <div style={css('font-size:12.5px;opacity:.7;margin-top:6px')}>{v.ofCountriesLabel}</div>
        </div>
        <div style={css('width:1px;background:rgba(245,234,216,.16)')} />
        <div style={css('flex:1')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:34px;line-height:1;color:#aebf92")}>
            {v.totalSaved}
          </div>
          <div style={css('font-size:12.5px;opacity:.7;margin-top:6px')}>{v.keptOutLabel}</div>
        </div>
      </div>

      <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:16px')}>
        {v.passport.map((p) => (
          <div key={p.key} style={css(`display:flex;gap:12px;align-items:center;padding:13px 15px;border-radius:24px;background:${p.bg}`)}>
            <span style={css(`flex:none;width:22px;text-align:center;font-family:'Caprasimo',serif;font-size:17px;color:${p.rankFg}`)}>
              {p.rank}
            </span>
            <span
              style={css(`flex:none;width:40px;height:40px;border-radius:50%;background:${p.chipBg};color:${p.chipFg};display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;font-size:14px`)}
            >
              {p.code}
            </span>
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:14.5px;font-weight:700;line-height:1.25')}>{p.dish}</span>
              <span style={css('display:block;font-size:12px;color:#645c50;margin-top:3px')}>{p.meta}</span>
            </span>
            <span style={css('flex:none;text-align:end')}>
              <span style={css("display:block;font-family:'Caprasimo',serif;font-size:18px;color:#8c491a")}>
                {p.price}
              </span>
              <span style={css('display:block;font-size:10.5px;color:#82796a;margin-top:2px')}>
                {v.t.resServing}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div
        dir="auto"
        style={css('margin-top:14px;padding:17px 19px;border-radius:26px;background:#e1eecc;font-size:13.5px;line-height:1.5;color:#3d472b;text-wrap:pretty')}
      >
        {v.passportNudge}
      </div>
    </div>
  );
}
