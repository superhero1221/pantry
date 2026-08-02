import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Kicker } from '../ui/bits';
import { Check } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

const H2 = "font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.06;margin:0;letter-spacing:-.3px";

export function Tier({ v }: { v: Pantry }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:14px 18px 18px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
        <div style={css('display:flex;gap:6px')}>
          <span style={css('width:22px;height:5px;border-radius:999px;background:#c67139')} />
          <span style={css(`width:22px;height:5px;border-radius:999px;background:${v.dot1}`)} />
          <span style={css(`width:22px;height:5px;border-radius:999px;background:${v.dot2}`)} />
          <span style={css('width:22px;height:5px;border-radius:999px;background:#dcd3c4')} />
          <span style={css('width:22px;height:5px;border-radius:999px;background:#dcd3c4')} />
        </div>
        <Btn
          onClick={v.tierNext}
          css="height:38px;padding:0 12px;border-radius:999px;font-size:14px;font-weight:600;color:#645c50"
          hover="background:#eee7db"
        >
          {v.t.tierSkip}
        </Btn>
      </div>

      <h2 dir="auto" style={css(H2)}>
        {v.tierTitle}
      </h2>
      <p dir="auto" style={css('font-size:14.5px;line-height:1.5;margin:9px 0 16px;color:#645c50;text-wrap:pretty')}>
        {v.tierSub}
      </p>

      <div style={css('display:flex;flex-direction:column;gap:8px')}>
        {v.tierRows.map((row) => (
          <div key={row.key} data-tier={row.key} onClick={row.onDrop} style={css(row.style)}>
            {/* The badge doubles as this row's keyboard drop target: tab to a
                card, Enter to pick it up, then Enter here. It is a real button
                because the row cannot be one — the cards placed in it are. */}
            <Btn
              onClick={row.place}
              aria-label={row.placeLabel}
              css={`flex:none;width:44px;height:44px;padding:0;border-radius:14px;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;font-size:22px;background:${row.badgeBg};color:${row.badgeFg}`}
            >
              {row.key}
            </Btn>
            <div style={css('flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:5px;align-items:center')}>
              {row.cards.map((c) => (
                <Btn
                  key={c.key}
                  onClick={c.pull}
                  css="padding:6px 11px;border-radius:999px;background:#fff;font-size:12.5px;font-weight:600;box-shadow:0 1px 2px rgba(46,43,37,.14);white-space:nowrap"
                >
                  {c.label}
                </Btn>
              ))}
              {row.empty && (
                <span style={css('font-size:12.5px;color:#a19786;font-weight:500')}>{row.label}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={css('margin-top:auto;padding-top:16px')}>
        <Kicker style={{ marginBottom: 9 }}>{v.trayLabel}</Kicker>
        <div style={css('display:flex;flex-wrap:wrap;gap:7px;min-height:44px')}>
          {v.tray.map((c) => (
            <Btn
              key={c.key}
              onPointerDown={c.grab}
              onKeyDown={c.onKey}
              aria-pressed={c.on}
              css={c.style}
            >
              {c.label}
            </Btn>
          ))}
          {v.trayEmpty && (
            <div style={css('display:flex;align-items:center;gap:8px;font-size:13.5px;color:#728157;font-weight:600')}>
              <Check size={17} stroke="#8fa073" width={3} />
              {v.u.thatsLot}
            </div>
          )}
        </div>

        <div
          dir="auto"
          style={css('margin-top:14px;padding:13px 15px;border-radius:20px;background:#e1eecc;font-size:13.5px;line-height:1.5;color:#3d472b;text-wrap:pretty')}
        >
          {v.tierReadout}
        </div>

        <Btn
          onClick={v.tierNext}
          css="width:100%;height:54px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700;margin-top:12px"
          hover="background:#b2622d"
        >
          {v.tierCta}
        </Btn>
      </div>
    </div>
  );
}
