import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { DishPic, Kicker } from '../ui/bits';
import type { Pantry } from '../state/usePantry';

const FIELD = 'display:flex;flex-direction:column;gap:8px;flex:1;min-width:0';

export function Plan({ v }: { v: Pantry }) {
  const x = v.xt;

  return (
    <div style={css('padding:14px 22px 26px')}>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {x('planTitle')}
      </h1>
      <p dir="auto" style={css('font-size:14px;line-height:1.5;margin:8px 0 0;color:#645c50;text-wrap:pretty')}>
        {x('planSub')}
      </p>

      <div style={css('display:flex;gap:12px;margin-top:18px')}>
        <div style={css(FIELD)}>
          <Kicker>{x('planDays')}</Kicker>
          <div style={css('display:flex;gap:6px')}>
            {v.planDayChips.map((d) => (
              <Btn key={d.key} onClick={d.pick} css={d.style}>
                {d.label}
              </Btn>
            ))}
          </div>
        </div>
        <div style={css(FIELD)}>
          <Kicker>{x('planServings')}</Kicker>
          <div style={css('display:flex;gap:6px')}>
            {v.planServingChips.map((n) => (
              <Btn key={n.key} onClick={n.pick} css={n.style}>
                {n.label}
              </Btn>
            ))}
          </div>
        </div>
      </div>

      <Kicker style={{ marginTop: 16 }}>{x('planMeals')}</Kicker>
      <div style={css('display:flex;gap:6px;margin-top:8px')}>
        {v.planMealChips.map((m) => (
          <Btn key={m.key} onClick={m.pick} css={m.style}>
            {m.label}
          </Btn>
        ))}
      </div>

      <Btn
        onClick={v.buildPlan}
        css="width:100%;height:56px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700;margin-top:20px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
        hover="background:#b2622d"
      >
        {v.planEmpty ? x('planBuild') : x('planRebuild')}
      </Btn>

      {v.planEmpty ? (
        <div
          dir="auto"
          style={css('margin-top:16px;padding:19px 20px;border-radius:28px;background:#f9f4ed;font-size:13.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}
        >
          {x('planEmpty')}
        </div>
      ) : (
        <>
          <div style={css('display:flex;gap:9px;margin-top:16px')}>
            <div style={css('flex:1;padding:16px 15px;border-radius:24px;background:#ebddc5')}>
              <div style={css("font-family:'Caprasimo',serif;font-size:26px;line-height:1")}>
                {v.planTotal}
              </div>
              <div style={css('font-size:11.5px;color:#645c50;margin-top:6px')}>{x('planTotal')}</div>
            </div>
            <div style={css('flex:1;padding:16px 15px;border-radius:24px;background:#e1eecc')}>
              <div style={css("font-family:'Caprasimo',serif;font-size:26px;line-height:1;color:#56633f")}>
                {v.planPerDay}
              </div>
              <div style={css('font-size:11.5px;color:#56633f;margin-top:6px;opacity:.85')}>
                {x('planPerDay')}
              </div>
            </div>
          </div>

          <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:18px')}>
            {v.planCells.map((cell) => (
              <div key={cell.key}>
                {cell.showDay && (
                  <Kicker style={{ margin: '10px 0 8px' }}>{cell.dayLabel}</Kicker>
                )}
                <div style={css('display:flex;gap:9px;align-items:stretch')}>
                  <Btn
                    onClick={cell.open}
                    css="flex:1;min-width:0;display:flex;gap:12px;align-items:center;padding:11px;border-radius:24px;background:#f9f4ed;text-align:start"
                    hover="background:#eee7db"
                  >
                    <DishPic src={cell.pic} size={54} radius={17} />
                    <span style={css('flex:1;min-width:0')}>
                      <span style={css('display:block;font-size:14.5px;font-weight:700;line-height:1.25')}>
                        {cell.name}
                      </span>
                      <span style={css('display:block;font-size:11.5px;color:#82796a;margin-top:3px')}>
                        {cell.meta}
                      </span>
                    </span>
                    <span style={css("flex:none;font-family:'Caprasimo',serif;font-size:17px;color:#8c491a")}>
                      {cell.price}
                    </span>
                  </Btn>
                  <Btn
                    onClick={cell.swap}
                    css="flex:none;width:56px;border-radius:20px;background:#ebddc5;font-size:12px;font-weight:700;color:#474238"
                    hover="background:#dcd3c4"
                  >
                    {x('planSwap')}
                  </Btn>
                </div>
              </div>
            ))}
          </div>

          <Kicker style={{ marginTop: 24 }}>{x('planList')}</Kicker>
          <div style={css('margin-top:11px;border-radius:28px;background:#f9f4ed;padding:6px 16px')}>
            {v.planList.map((l) => (
              <div
                key={l.key}
                style={css('display:flex;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid rgba(32,30,29,.07)')}
              >
                <span
                  style={css(`flex:none;width:22px;height:22px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${l.boxBg}`)}
                >
                  {l.tick}
                </span>
                <span style={css('flex:1;min-width:0')}>
                  <span
                    style={css(`display:block;font-size:14.5px;font-weight:600;line-height:1.25;color:${l.nameFg};text-decoration:${l.strike}`)}
                  >
                    {l.name}
                  </span>
                  <span style={css('display:block;font-size:11.5px;color:#82796a;margin-top:3px')}>
                    {l.sub}
                  </span>
                </span>
                <span style={css(`flex:none;min-width:52px;text-align:end;font-size:14px;font-weight:700;color:${l.priceFg}`)}>
                  {l.price}
                </span>
              </div>
            ))}
            <div style={css('display:flex;justify-content:space-between;align-items:baseline;padding:15px 0 13px')}>
              <span style={css('font-size:16px;font-weight:700')}>{v.t.shopTotal}</span>
              <span style={css("font-family:'Caprasimo',serif;font-size:28px")}>{v.planTotal}</span>
            </div>
          </div>

          {v.signedIn ? (
            <Btn
              onClick={v.savePlan}
              disabled={v.planBusy}
              css={
                'width:100%;height:52px;border-radius:999px;background:#ebddc5;font-size:15px;font-weight:700;color:#474238;margin-top:16px' +
                (v.planBusy ? ';opacity:.62' : '')
              }
              hover="background:#dcd3c4"
            >
              {v.planBusy ? x('planSaving') : v.planSavedNote ? x('planSaved') : x('planSave')}
            </Btn>
          ) : (
            <p
              dir="auto"
              style={css('margin:16px 2px 0;font-size:12.5px;line-height:1.55;color:#82796a;text-wrap:pretty')}
            >
              {x('planNeedsAccount')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
