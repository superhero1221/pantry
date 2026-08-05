import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, DishPic, Kicker } from '../ui/bits';
import type { Pantry } from '../state/usePantry';

export function Stats({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:14px 22px 26px')}>
      {/* This screen keeps its address but no longer has a tab, so it needs a
          way back that is not the tab bar — an installed phone has no browser
          chrome to fall back on. */}
      <div style={css('margin-bottom:10px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
      </div>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {v.t.statsTitle}
      </h1>
      <p dir="auto" style={css('font-size:14px;line-height:1.5;margin:8px 0 0;color:#645c50;text-wrap:pretty')}>
        {v.statsSub}
      </p>

      {v.isSampleLog && (
        <div
          dir="auto"
          style={css('margin-top:14px;padding:15px 17px;border-radius:24px;background:#ebddc5;font-size:12.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}
        >
          {v.xt('sampleStats')}
        </div>
      )}

      <div style={css('margin-top:16px;padding:22px 20px 20px;border-radius:30px;background:#201e1d;color:#f5ead8')}>
        <div style={css('font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;opacity:.55')}>
          {v.t.statsSpend}
        </div>
        <div style={css('display:flex;align-items:baseline;gap:11px;margin-top:7px')}>
          <span style={css("font-family:'Caprasimo',serif;font-size:40px;line-height:1;color:#f6a06b")}>
            {v.statsSpendWeek}
          </span>
          <span style={css('font-size:13px;opacity:.7')}>{v.statsSpendDelta}</span>
        </div>
        <div style={css('display:flex;gap:5px;height:118px;margin-top:20px')}>
          {v.weekBars.map((b) => (
            <span
              key={b.key}
              style={css('flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px')}
            >
              <span style={css(`width:100%;height:${b.h};border-radius:9px 9px 4px 4px;background:${b.bg}`)} />
              <span style={css('font-size:9.5px;opacity:.5;letter-spacing:.2px')}>{b.label}</span>
            </span>
          ))}
        </div>
        <div style={css('font-size:11.5px;opacity:.45;margin-top:10px')}>{v.eightWeeksLabel}</div>
      </div>

      <div style={css('display:flex;gap:9px;margin-top:12px')}>
        <div style={css('flex:1;padding:16px 15px;border-radius:24px;background:#e1eecc')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:23px;line-height:1;color:#56633f")}>
            {v.statsAvgServing}
          </div>
          <div style={css('font-size:11.5px;color:#56633f;margin-top:6px;opacity:.85')}>
            {v.aServingAvgLabel}
          </div>
        </div>
        <div style={css('flex:1;padding:16px 15px;border-radius:24px;background:#fff2eb')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:23px;line-height:1;color:#8c491a")}>
            {v.statsSaved}
          </div>
          <div style={css('font-size:11.5px;color:#8c491a;margin-top:6px;opacity:.85')}>{v.notSpentLabel}</div>
        </div>
        <div style={css('flex:1;padding:16px 15px;border-radius:24px;background:#ebddc5')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:23px;line-height:1;color:#474238")}>
            {v.statsWaste}
          </div>
          <div style={css('font-size:11.5px;color:#645c50;margin-top:6px')}>{v.leftOnPlateLabel}</div>
        </div>
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.statsCooked}</Kicker>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:11px')}>
        {v.topDishes.map((d) => (
          <div key={d.key} style={css('display:flex;gap:12px;align-items:center;padding:11px 14px;border-radius:24px;background:#f9f4ed')}>
            <DishPic src={d.pic} size={44} radius={15} style={{ background: '#ebddc5' }} />
            <span style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:14.5px;font-weight:700;line-height:1.25')}>{d.name}</span>
              <span style={css('display:block;font-size:11.5px;color:#645c50;margin-top:3px')}>{d.meta}</span>
              <span style={css('display:block;height:5px;border-radius:999px;background:#eee7db;margin-top:7px;overflow:hidden')}>
                <span style={css(`display:block;height:100%;width:${d.barW};border-radius:999px;background:#d67f48`)} />
              </span>
            </span>
            <span style={css("flex:none;font-family:'Caprasimo',serif;font-size:19px;color:#8c491a")}>
              {d.count}
            </span>
          </div>
        ))}
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.statsHard}</Kicker>
      <div style={css('margin-top:11px;padding:18px 20px;border-radius:28px;background:#f9f4ed;display:flex;flex-direction:column;gap:12px')}>
        {v.diffBars.map((d) => (
          <div key={d.key} style={css('display:flex;align-items:center;gap:11px')}>
            <span style={css('flex:none;width:88px;font-size:13px;font-weight:600')}>{d.label}</span>
            <span style={css('flex:1;height:9px;border-radius:999px;background:#eee7db;overflow:hidden')}>
              <span style={css(`display:block;height:100%;width:${d.w};border-radius:999px;background:${d.bg}`)} />
            </span>
            <span style={css('flex:none;width:34px;text-align:end;font-size:12.5px;color:#645c50')}>{d.pct}</span>
          </div>
        ))}
      </div>

      <Kicker style={{ marginTop: 24 }}>{v.t.statsLearned}</Kicker>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:11px')}>
        {v.learnedList.map((l) => (
          <div key={l.key} style={css('padding:17px 19px;border-radius:26px;background:#e1eecc')}>
            <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:12px')}>
              <span style={css('font-size:15px;font-weight:700;color:#3d472b')}>{l.title}</span>
              <Btn
                onClick={l.forget}
                css="flex:none;white-space:nowrap;font-size:12.5px;font-weight:700;color:#56633f;text-decoration:underline"
              >
                {v.t.statsForget}
              </Btn>
            </div>
            <p dir="auto" style={css('margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#3d472b;opacity:.85;text-wrap:pretty')}>
              {l.body}
            </p>
          </div>
        ))}
        {v.nothingLearned && (
          <div
            dir="auto"
            style={css('padding:17px 19px;border-radius:26px;background:#f9f4ed;font-size:13.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}
          >
            {v.nothingLearnedText}
          </div>
        )}
      </div>

      <Btn
        onClick={v.forgetAll}
        css="width:100%;height:50px;border-radius:999px;font-size:14.5px;font-weight:700;color:#8c491a;margin-top:14px"
        hover="background:#ffe1d0"
      >
        {v.forgetAllLabel}
      </Btn>
    </div>
  );
}
