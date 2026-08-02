import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Kicker } from '../ui/bits';
import { ChevronRight, Flame, Fridge, Search } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

export function Home({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:6px 22px 26px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between')}>
        <div style={css('font-size:15px;font-weight:600;color:#645c50')}>{v.greeting}</div>
        <Btn
          onClick={v.goPassport}
          css="display:flex;align-items:center;gap:5px;padding:6px 12px 6px 9px;border-radius:999px;background:#fff2eb"
          hover="background:#ffe1d0"
        >
          <Flame size={16} stroke="#b2622d" />
          <span style={css('font-size:13.5px;font-weight:800;color:#8c491a')}>{v.streak}</span>
        </Btn>
      </div>

      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:38px;line-height:1;margin:14px 0 0;letter-spacing:-.6px")}
      >
        {v.t.homeWhat}
      </h1>

      <div style={css('margin-top:18px;position:relative')}>
        <Search size={20} stroke="#a19786" style={{ position: 'absolute', insetInlineStart: 18, top: 19 }} />
        <input
          value={v.query}
          onChange={v.onQuery}
          placeholder={v.t.homePlaceholder}
          aria-label={v.t.homeWhat}
          style={css('width:100%;height:58px;border-radius:999px;border:2px solid #dcd3c4;background:#fff;padding-inline:48px 18px;font-size:15px;font-weight:500;color:#201e1d')}
        />
      </div>

      <div className="pg-x" style={css('display:flex;gap:8px;margin:12px -22px 0;padding:2px 22px')}>
        {v.cravings.map((c) => (
          <Btn key={c.key} onClick={c.pick} aria-pressed={c.on} css={c.style}>
            {c.label}
          </Btn>
        ))}
      </div>

      <div style={css('margin-top:24px;display:flex;align-items:baseline;justify-content:space-between')}>
        <Kicker>{v.t.homeMoney}</Kicker>
        <div style={css('font-size:13px;color:#82796a')}>{v.servingsLabel}</div>
      </div>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:9px')}>
        {v.budgetChips.map((b) => (
          <Btn key={b.key} onClick={b.pick} aria-pressed={b.on} css={b.style}>
            {b.label}
          </Btn>
        ))}
      </div>
      {v.budgetOtherOpen && (
        <div style={css('margin-top:9px;display:flex;align-items:center;gap:10px;padding-inline:18px 6px;height:52px;border-radius:999px;border:2px solid #c67139;background:#fff')}>
          <span style={css("font-family:'Caprasimo',serif;font-size:21px;color:#c67139")}>{v.symbol}</span>
          <input
            value={v.budgetDraft}
            onChange={v.onBudgetDraft}
            onKeyDown={v.onBudgetKey}
            placeholder="6.50"
            inputMode="decimal"
            aria-label={v.t.homeMoney}
            style={css('flex:1;min-width:0;border:0;outline:none;background:none;font-size:18px;font-weight:700')}
          />
          <Btn
            onClick={v.commitBudget}
            css="height:40px;padding:0 18px;border-radius:999px;background:#c67139;color:#fff;font-size:14.5px;font-weight:700"
          >
            {v.u.setBtn}
          </Btn>
        </div>
      )}

      <Kicker style={{ marginTop: 22 }}>{v.t.homeTime}</Kicker>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:9px')}>
        {v.timeChips.map((t) => (
          <Btn key={t.key} onClick={t.pick} aria-pressed={t.on} css={t.style}>
            {t.label}
          </Btn>
        ))}
      </div>

      <Btn
        onClick={v.search}
        css="width:100%;height:60px;border-radius:999px;background:#c67139;color:#fff;font-size:17.5px;font-weight:700;margin-top:24px;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
        hover="background:#b2622d"
      >
        {v.searchCta}
        <ChevronRight size={21} stroke="#fff" />
      </Btn>
      <Btn
        onClick={v.decideForMe}
        css="width:100%;height:46px;border-radius:999px;font-size:15px;font-weight:600;color:#645c50;margin-top:6px"
        hover="background:#eee7db"
      >
        {v.t.homeAny}
      </Btn>
      <Btn
        onClick={v.goBrowse}
        css="width:100%;height:46px;border-radius:999px;font-size:15px;font-weight:700;color:#8c491a;background:#fff2eb;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px"
        hover="background:#ffe1d0"
      >
        {v.t.homeBrowse}
        <span style={css('font-size:12.5px;font-weight:600;opacity:.7')}>{v.browseCount}</span>
      </Btn>

      <Btn
        onClick={v.goPlan}
        css="width:100%;height:46px;border-radius:999px;font-size:15px;font-weight:700;color:#56633f;background:#e1eecc;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px"
        hover="background:#ccdbb2"
      >
        {v.xt('planTitle')}
        <span style={css('font-size:12.5px;font-weight:600;opacity:.75')}>{v.planDays}</span>
      </Btn>

      <Btn
        onClick={v.goKitchen}
        css="width:100%;text-align:start;margin-top:18px;padding:16px 18px;border-radius:26px;background:#e1eecc;display:flex;gap:13px;align-items:center"
        hover="background:#ccdbb2"
      >
        <Fridge size={26} stroke="#56633f" style={{ flex: 'none' }} />
        <span style={css('flex:1;min-width:0')}>
          <span style={css('display:block;font-size:15px;font-weight:700;color:#3d472b')}>{v.pantryLine}</span>
          <span style={css('display:block;font-size:13px;color:#56633f;margin-top:2px')}>{v.pantryNudge}</span>
        </span>
        <ChevronRight size={19} stroke="#56633f" style={{ flex: 'none' }} />
      </Btn>
    </div>
  );
}
