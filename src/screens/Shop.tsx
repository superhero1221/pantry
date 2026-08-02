import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Kicker } from '../ui/bits';
import { Check, ChevronRight } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

export function Shop({ v }: { v: Pantry }) {
  const legend: [string, string][] = [
    ['#56633f', v.xt('legCommunity')],
    ['#728157', v.u.legMeasured],
    ['#f6a06b', v.u.legEurope],
    ['#c0b6a5', v.u.legModelled],
  ];

  return (
    <div style={css('padding:6px 22px 26px')}>
      <div style={css('margin-inline-start:-6px')}>
        <BackBtn onClick={v.back} />
      </div>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.04;margin:8px 0 0;letter-spacing:-.4px")}
      >
        {v.t.shopTitle}
      </h1>
      <p dir="auto" style={css('font-size:14px;line-height:1.5;margin:8px 0 0;color:#645c50')}>
        {v.shopSubLine}
      </p>

      <div style={css('display:flex;flex-direction:column;gap:9px;margin-top:16px')}>
        {v.stores.map((s) => (
          <Btn key={s.key} onClick={s.pick} css={s.style}>
            <span style={css('flex:1;min-width:0;text-align:start')}>
              <span style={css('display:flex;align-items:center;gap:7px')}>
                <span style={css('font-size:15.5px;font-weight:700')}>{s.name}</span>
                <span
                  style={css(`padding:3px 8px;border-radius:999px;background:${s.tagBg};color:${s.tagFg};font-size:10.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase`)}
                >
                  {s.tier}
                </span>
              </span>
              <span style={css('display:block;font-size:12.5px;color:#645c50;margin-top:5px')}>{s.meta}</span>
            </span>
            <span style={css('flex:none;text-align:end')}>
              <span style={css(`display:block;font-family:'Caprasimo',serif;font-size:22px;color:${s.priceFg}`)}>
                {s.price}
              </span>
              <span style={css('display:block;font-size:11px;color:#82796a;margin-top:2px')}>{s.delta}</span>
            </span>
          </Btn>
        ))}
      </div>

      <div style={css('display:flex;align-items:baseline;justify-content:space-between;margin-top:26px')}>
        <Kicker>{v.t.shopList}</Kicker>
        <div style={css('font-size:12.5px;color:#82796a')}>{v.listSummary}</div>
      </div>

      <div style={css('margin-top:11px;border-radius:28px;background:#f9f4ed;padding:6px 16px')}>
        {v.basket.map((i) => {
          const row = (
            <>
              <span
                style={css(`flex:none;width:22px;height:22px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${i.boxBg}`)}
              >
                {i.tick}
              </span>
              <span style={css('flex:1;min-width:0;text-align:start')}>
                <span
                  style={css(`display:block;font-size:14.5px;font-weight:600;line-height:1.25;color:${i.nameFg};text-decoration:${i.strike}`)}
                >
                  {i.name}
                </span>
                <span style={css('display:block;font-size:11.5px;color:#82796a;margin-top:3px')}>
                  {i.community
                    ? `${i.community.reports} ${v.xt('priceCommunity')} · ${i.community.newest}`
                    : i.sub}
                </span>
              </span>
              <span style={css('flex:none;display:flex;align-items:center;gap:7px')}>
                <span style={css(`width:7px;height:7px;border-radius:50%;background:${i.srcColor}`)} />
                <span style={css(`min-width:46px;text-align:end;font-size:14px;font-weight:700;color:${i.priceFg}`)}>
                  {i.price}
                </span>
              </span>
            </>
          );
          const shared =
            'display:flex;gap:11px;align-items:center;padding:11px 0;border-bottom:1px solid rgba(32,30,29,.07);width:100%';
          return v.canReport ? (
            <Btn key={i.key} onClick={i.openReport} css={shared} hover="background:#f2ece2">
              {row}
            </Btn>
          ) : (
            <div key={i.key} style={css(shared)}>
              {row}
            </div>
          );
        })}
        <div style={css('display:flex;justify-content:space-between;align-items:baseline;padding:15px 0 13px')}>
          <span style={css('font-size:16px;font-weight:700')}>{v.t.shopTotal}</span>
          <span style={css("font-family:'Caprasimo',serif;font-size:28px")}>{v.basketTotal}</span>
        </div>
      </div>

      <div style={css('margin-top:12px;padding:16px 18px;border-radius:26px;background:#e1eecc;display:flex;gap:12px;align-items:flex-start')}>
        <Check size={20} stroke="#56633f" style={{ flex: 'none', marginTop: 2 }} />
        <p dir="auto" style={css('margin:0;font-size:13.5px;line-height:1.5;color:#3d472b;text-wrap:pretty')}>
          {v.savedLine}
        </p>
      </div>

      <div style={css('margin-top:12px;padding:15px 18px;border-radius:26px;background:#f9f4ed')}>
        <Kicker>{v.t.shopWhere}</Kicker>
        <div style={css('display:flex;flex-direction:column;gap:7px;margin-top:10px')}>
          {legend.map(([dot, text]) => (
            <div key={dot} style={css('display:flex;gap:9px;align-items:center;font-size:12.5px;color:#645c50')}>
              <span style={css(`flex:none;width:7px;height:7px;border-radius:50%;background:${dot}`)} />
              {text}
            </div>
          ))}
        </div>
        <p dir="auto" style={css('margin:11px 0 0;font-size:12px;line-height:1.5;color:#82796a;text-wrap:pretty')}>
          {v.honestyLine}
        </p>
      </div>

      {v.canReport && (
        <div style={css('margin-top:12px;padding:16px 18px;border-radius:26px;background:#fff2eb')}>
          <div dir="auto" style={css('font-size:14.5px;font-weight:700;color:#643312')}>
            {v.xt('priceAsk')}
          </div>
          <p dir="auto" style={css('margin:6px 0 0;font-size:12.5px;line-height:1.5;color:#8c491a;text-wrap:pretty')}>
            {v.xt('priceAskBody')}
          </p>
        </div>
      )}

      {v.reportOpen && (
        <div style={css('margin-top:12px;padding:19px 20px;border-radius:28px;background:#ebddc5;animation:pgUp .28s ease-out both')}>
          <div dir="auto" style={css('font-size:15.5px;font-weight:700;line-height:1.3')}>
            {v.reportItemName}
          </div>
          <div style={css('display:flex;gap:9px;margin-top:12px')}>
            <label style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:11.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#82796a;margin-bottom:6px')}>
                {v.xt('priceWhat')}
              </span>
              <span style={css('display:flex;align-items:center;gap:6px;padding-inline:14px 12px;height:50px;border-radius:999px;background:#fff')}>
                <span style={css("font-family:'Caprasimo',serif;font-size:18px;color:#c67139")}>
                  {v.symbol}
                </span>
                <input
                  value={v.reportPriceValue}
                  onChange={v.onReportPrice}
                  inputMode="decimal"
                  placeholder="2.49"
                  style={css('width:100%;min-width:0;border:0;outline:none;background:none;font-size:16px;font-weight:700')}
                />
              </span>
            </label>
            <label style={css('flex:1;min-width:0')}>
              <span style={css('display:block;font-size:11.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#82796a;margin-bottom:6px')}>
                {v.xt('pricePack')}
              </span>
              <span style={css('display:flex;align-items:center;gap:6px;padding-inline:14px 12px;height:50px;border-radius:999px;background:#fff')}>
                <input
                  value={v.reportPackValue}
                  onChange={v.onReportPack}
                  inputMode="numeric"
                  placeholder="500"
                  style={css('width:100%;min-width:0;border:0;outline:none;background:none;font-size:16px;font-weight:700')}
                />
                <span style={css('font-size:13px;font-weight:700;color:#82796a')}>g</span>
              </span>
            </label>
          </div>
          <div style={css('display:flex;gap:9px;margin-top:14px')}>
            <Btn
              onClick={v.submitReport}
              disabled={v.reportBusy}
              css="flex:1;height:48px;border-radius:999px;background:#c67139;color:#fff;font-size:14.5px;font-weight:700"
              hover="background:#b2622d"
            >
              {v.xt('priceSend')}
            </Btn>
            <Btn
              onClick={v.closeReport}
              css="flex:none;height:48px;padding:0 20px;border-radius:999px;background:#dcd3c4;color:#474238;font-size:14.5px;font-weight:700"
              hover="background:#c0b6a5"
            >
              {v.u.notRight}
            </Btn>
          </div>
        </div>
      )}

      <Btn
        onClick={v.toCook}
        css="width:100%;height:60px;border-radius:999px;background:#c67139;color:#fff;font-size:17.5px;font-weight:700;margin-top:18px;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
        hover="background:#b2622d"
      >
        {v.t.shopGo}
        <ChevronRight size={21} stroke="#fff" />
      </Btn>
    </div>
  );
}
