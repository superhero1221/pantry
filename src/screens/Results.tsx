import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, DishPic, Kicker } from '../ui/bits';
import { ChevronRight } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

const CHIP = 'flex:none;padding:6px 12px;border-radius:999px;background:#ebddc5;font-size:12.5px;font-weight:700';

export function Results({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:6px 0 26px')}>
      <div style={css('display:flex;align-items:center;gap:8px;padding:0 16px')}>
        <BackBtn onClick={v.goHome} />
        <div className="pg-x" style={css('flex:1;min-width:0;display:flex;gap:6px')}>
          <span style={css(CHIP)}>{v.cityName}</span>
          <span style={css(CHIP)}>{v.budgetLabel}</span>
          <span style={css(CHIP)}>{v.timeLabel}</span>
        </div>
      </div>

      <div style={css('padding:0 22px')}>
        {v.isCopycat && (
          <div style={css('display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:7px 14px;border-radius:999px;background:#201e1d;color:#f5ead8;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase')}>
            Copycat · {v.copycatOf}
          </div>
        )}
        <h1
          dir="auto"
          style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:34px;line-height:1.04;margin:14px 0 0;letter-spacing:-.4px")}
        >
          {v.dishName}
        </h1>
        <div style={css('display:flex;align-items:center;gap:9px;margin-top:7px')}>
          <span style={css('font-size:15px;color:#645c50')}>{v.dishLocal}</span>
          <span style={css('width:4px;height:4px;border-radius:50%;background:#c0b6a5')} />
          <span style={css('font-size:15px;color:#645c50')}>{v.dishCuisine}</span>
        </div>
      </div>

      <div style={css('margin:16px 22px 0;border-radius:28px;overflow:hidden;height:196px;background:#eee7db;box-shadow:0 3px 10px rgba(46,43,37,.16)')}>
        <DishPic src={v.dishPic} radius={0} style={{ display: 'block', filter: 'saturate(.82) contrast(.94) brightness(1.03)' }} />
      </div>

      <div style={css('margin:16px 22px 0;padding:20px;border-radius:28px;background:#ebddc5')}>
        <div style={css('display:flex;align-items:flex-end;justify-content:space-between')}>
          <div>
            <div style={css("font-family:'Caprasimo',serif;font-size:44px;line-height:1;letter-spacing:-1px")}>
              {v.priceTotal}
            </div>
            <div style={css('font-size:13.5px;color:#645c50;margin-top:5px')}>{v.priceSub}</div>
          </div>
          <div style={css('text-align:end')}>
            <div style={css("font-family:'Caprasimo',serif;font-size:26px;line-height:1;color:#8c491a")}>
              {v.pricePer}
            </div>
            <div style={css('font-size:12.5px;color:#645c50;margin-top:4px')}>{v.t.resServing}</div>
          </div>
        </div>
        <div
          dir="auto"
          style={css(`margin-top:14px;padding:11px 14px;border-radius:18px;background:${v.verdictBg};color:${v.verdictFg};font-size:13.5px;font-weight:700;line-height:1.4`)}
        >
          {v.verdict}
        </div>
      </div>

      <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 22px 0')}>
        {v.macros.map((m) => (
          <div key={m.key} style={css(`padding:13px 6px;border-radius:22px;background:${m.bg};text-align:center`)}>
            <div style={css(`font-family:'Caprasimo',serif;font-size:23px;line-height:1;color:${m.fg}`)}>
              {m.value}
            </div>
            <div
              style={css(`font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:${m.fg};opacity:.75;margin-top:6px`)}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      <Btn
        onClick={v.toggleMicro}
        css="margin:9px 22px 0;width:calc(100% - 44px);height:42px;border-radius:999px;background:#eee7db;font-size:13.5px;font-weight:700;color:#645c50;display:flex;align-items:center;justify-content:center;gap:7px"
        hover="background:#dcd3c4"
      >
        {v.microCta}
      </Btn>
      {v.showMicro && (
        <div style={css('margin:9px 22px 0;padding:16px 18px;border-radius:26px;background:#f9f4ed;animation:pgUp .28s ease-out both')}>
          {v.micros.map((n) => (
            <div key={n.key} style={css('display:flex;align-items:center;gap:11px;padding:7px 0')}>
              <span style={css('flex:none;width:92px;font-size:13.5px;font-weight:600')}>{n.label}</span>
              <span style={css('flex:1;height:8px;border-radius:999px;background:#eee7db;overflow:hidden')}>
                <span style={css(`display:block;height:100%;border-radius:999px;background:${n.color};width:${n.pct}`)} />
              </span>
              <span style={css('flex:none;width:70px;text-align:end;font-size:12.5px;color:#645c50')}>{n.amount}</span>
            </div>
          ))}
          <p dir="auto" style={css('margin:10px 0 0;font-size:12px;line-height:1.5;color:#82796a')}>
            {v.u.barsNote}
          </p>
        </div>
      )}

      <div style={css('margin:14px 22px 0;padding:18px 20px;border-radius:28px;background:#201e1d;color:#f5ead8')}>
        <div style={css('font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;opacity:.6')}>
          {v.insteadLabel}
        </div>
        <div style={css('display:flex;align-items:baseline;gap:12px;margin-top:9px')}>
          <span style={css("font-family:'Caprasimo',serif;font-size:27px;text-decoration:line-through;opacity:.5")}>
            {v.takeawayPrice}
          </span>
          <ChevronRight size={19} stroke="#f6a06b" />
          <span style={css("font-family:'Caprasimo',serif;font-size:34px;color:#f6a06b")}>{v.pricePer}</span>
        </div>
        <p dir="auto" style={css('margin:9px 0 0;font-size:13.5px;line-height:1.5;opacity:.82;text-wrap:pretty')}>
          {v.savingLine}
        </p>
      </div>

      <div style={css('display:flex;gap:9px;margin:14px 22px 0')}>
        <div style={css('flex:1;padding:14px;border-radius:22px;background:#eee7db;text-align:center')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:21px;line-height:1")}>{v.timeTotal}</div>
          <div style={css('font-size:11.5px;color:#645c50;margin-top:5px')}>{v.timeActive}</div>
        </div>
        <div style={css('flex:1;padding:14px;border-radius:22px;background:#eee7db;text-align:center')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:21px;line-height:1")}>{v.diffLabel}</div>
          <div style={css('font-size:11.5px;color:#645c50;margin-top:5px')}>{v.u.resTier}</div>
        </div>
      </div>

      <div style={css('margin:20px 22px 0')}>
        <Btn
          onClick={v.toShop}
          css="width:100%;height:60px;border-radius:999px;background:#c67139;color:#fff;font-size:17.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
          hover="background:#b2622d"
        >
          {v.t.resCook}
          <ChevronRight size={21} stroke="#fff" />
        </Btn>
      </div>

      <div style={css('margin:26px 22px 0')}>
        <Kicker>{v.twoOthersLabel}</Kicker>
        <div style={css('display:flex;flex-direction:column;gap:9px;margin-top:10px')}>
          {v.alternates.map((a) => (
            <Btn
              key={a.key}
              onClick={a.pick}
              css="display:flex;gap:13px;align-items:center;padding:11px;border-radius:24px;background:#f9f4ed;text-align:start;width:100%"
              hover="background:#eee7db"
            >
              <DishPic src={a.pic} size={62} radius={18} />
              <span style={css('flex:1;min-width:0')}>
                <span style={css('display:block;font-size:15.5px;font-weight:700;line-height:1.2')}>{a.name}</span>
                <span style={css('display:block;font-size:12.5px;color:#645c50;margin-top:4px')}>{a.meta}</span>
              </span>
              <span style={css('flex:none;text-align:end')}>
                <span style={css("display:block;font-family:'Caprasimo',serif;font-size:19px;color:#8c491a")}>
                  {a.price}
                </span>
                <span style={css('display:block;font-size:11px;color:#82796a;margin-top:2px')}>
                  {v.t.resServing}
                </span>
              </span>
            </Btn>
          ))}
        </div>
      </div>
    </div>
  );
}
