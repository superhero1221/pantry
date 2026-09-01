import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, DishPic, Kicker } from '../ui/bits';
import { ChevronRight } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

const CHIP = 'flex:none;padding:6px 12px;border-radius:999px;background:#ffe9d2;font-size:12.5px;font-weight:700';

export function Results({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:6px 0 26px')}>
      <div style={css('display:flex;align-items:center;gap:8px;padding:0 16px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
        <div className="pg-x" style={css('flex:1;min-width:0;display:flex;gap:6px')}>
          <span style={css(CHIP)}>{v.cityName}</span>
          <span style={css(CHIP)}>{v.budgetLabel}</span>
          <span style={css(CHIP)}>{v.timeLabel}</span>
        </div>
      </div>

      <div style={css('padding:0 22px')}>
        {v.isCopycat && (
          <div style={css('display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:7px 14px;border-radius:999px;background:#1b1714;color:#fffaf3;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase')}>
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
          <span style={css('font-size:15px;color:#6a5c4c')}>{v.dishLocal}</span>
          <span style={css('width:4px;height:4px;border-radius:50%;background:#cbb79f')} />
          <span style={css('font-size:15px;color:#6a5c4c')}>{v.dishCuisine}</span>
        </div>
      </div>

      {/* Above the photograph and above the price, because it changes whether
          you want either. A dish that breaks a restriction you set can still
          reach this screen — search, Browse, a planner slot, a shared link —
          and until now the screen met it with the reasons it was a good idea
          and said nothing about the reason it was not. role=alert so it is
          announced rather than merely drawn. */}
      {v.dietClash && (
        <div
          role="alert"
          style={css('margin:16px 22px 0;padding:15px 17px;border-radius:26px;background:#ffe4cd;border:2px solid #a83f06')}
        >
          <div dir="auto" style={css('font-size:15.5px;font-weight:700;color:#571f02;line-height:1.35')}>
            {v.dietClash}
          </div>
          {v.dietClashWhy && (
            <p dir="auto" style={css('margin:6px 0 0;font-size:14px;line-height:1.45;color:#7d2f04')}>
              {v.dietClashWhy}
            </p>
          )}
          <p dir="auto" style={css('margin:8px 0 0;font-size:12.5px;line-height:1.5;color:#7d2f04;text-wrap:pretty')}>
            {v.dietClashNote}
          </p>
        </div>
      )}

      <div style={css('margin:16px 22px 0;border-radius:28px;overflow:hidden;height:196px;background:#fdf0e3;box-shadow:0 3px 10px rgba(46,43,37,.16)')}>
        <DishPic src={v.dishPic} radius={0} style={{ display: 'block', filter: 'saturate(1.06) contrast(1.02)' }} />
      </div>

      <div style={css('margin:16px 22px 0;padding:20px;border-radius:28px;background:#ffe9d2')}>
        <div style={css('display:flex;align-items:flex-end;justify-content:space-between')}>
          <div style={css('min-width:0')}>
            {/* Set from the bag rather than fixed, because a span is twice the
                characters and 44px Caprasimo fits one price, not two. Falls
                back to the original 44 whenever the ends collapse — a shop
                list with one tier, or a currency that rounds to whole units. */}
            <div style={css(`font-family:'Caprasimo',serif;font-size:${v.priceTotalFs};line-height:1;letter-spacing:-1px`)}>
              {v.priceTotal}
            </div>
            <div style={css('font-size:13.5px;color:#6a5c4c;margin-top:5px')}>{v.priceSub}</div>
          </div>
          <div style={css('text-align:end;min-width:0')}>
            <div style={css(`font-family:'Caprasimo',serif;font-size:${v.pricePerFs};line-height:1;color:#a83f06`)}>
              {v.pricePerSpan}
            </div>
            <div style={css('font-size:12.5px;color:#6a5c4c;margin-top:4px')}>{v.t.resServing}</div>
          </div>
        </div>
        {/* What the two ends are, and it is never optional when a range shows.
            Both endpoints come off the same modelled baseline, so a baseline
            that is wrong slides the range rather than widening it — the width
            is shop spread and not confidence, and a reader will assume the
            opposite unless the shops are named. */}
        {v.priceRangeWhy && (
          <div dir="auto" style={css('font-size:12px;color:#6a5c4c;margin-top:9px')}>
            {v.priceRangeWhy}
          </div>
        )}
        <div
          dir="auto"
          style={css(`margin-top:14px;padding:11px 14px;border-radius:18px;background:${v.verdictBg};color:${v.verdictFg};font-size:13.5px;font-weight:700;line-height:1.4`)}
        >
          {v.verdict}
        </div>
      </div>

      {/* Why this one, and not the other hundred and fifty-two.
          Directly under the price card and above the verb, because it is the
          answer to the question a single recommendation provokes — a grid at
          least lets you see it was you who chose. Every line is a condition
          the reader set, confirmed; nothing is padded to reach a count, and
          the block does not render at all for somebody who asked for nothing.
          The ticks are text rather than an icon component: a check is the
          whole meaning here, and at 13px an SVG stroke would be lighter than
          the words beside it. */}
      {v.pickedWhy.length > 0 && (
        <div style={css('margin:12px 22px 0;padding:15px 18px;border-radius:26px;background:#ffffff')}>
          <div
            dir="auto"
            style={css('font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#6a5c4c')}
          >
            {v.pickedWhyTitle}
          </div>
          <ul style={css('list-style:none;margin:9px 0 0;padding:0;display:flex;flex-direction:column;gap:7px')}>
            {v.pickedWhy.map((r) => (
              <li key={r.key} style={css('display:flex;gap:9px;align-items:flex-start')}>
                <span
                  aria-hidden="true"
                  style={css('flex:none;width:17px;height:17px;border-radius:50%;background:#e2f8c6;color:#2c5410;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:1px')}
                >
                  ✓
                </span>
                <span dir="auto" style={css('font-size:13.5px;line-height:1.4;color:#3b3229;text-wrap:pretty')}>
                  {r.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The verb, in the first viewport, directly under the price.
          It used to sit below four nutrition tiles, a black savings panel and
          two alternates — so somebody who had already decided had to scroll
          past the app's justification for a decision they had made. Price wins
          the eye, which is right; it should not also win the hand. */}
      <div style={css('margin:16px 22px 0')}>
        <Btn
          onClick={v.toShop}
          css="width:100%;height:58px;border-radius:999px;background:#e85d04;color:#fff;font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
          hover="background:#c04a03"
        >
          {v.t.shopTitle}
          <ChevronRight size={21} stroke="#fff" />
        </Btn>
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
        css="margin:9px 22px 0;width:calc(100% - 44px);height:42px;border-radius:999px;background:#fdf0e3;font-size:13.5px;font-weight:700;color:#6a5c4c;display:flex;align-items:center;justify-content:center;gap:7px"
        hover="background:#efdcc8"
      >
        {v.microCta}
      </Btn>
      {v.showMicro && (
        <div style={css('margin:9px 22px 0;padding:16px 18px;border-radius:26px;background:#ffffff;animation:pgUp .28s ease-out both')}>
          {v.micros.map((n) => (
            <div key={n.key} style={css('display:flex;align-items:center;gap:11px;padding:7px 0')}>
              <span style={css('flex:none;width:92px;font-size:13.5px;font-weight:600')}>{n.label}</span>
              <span style={css('flex:1;height:8px;border-radius:999px;background:#fdf0e3;overflow:hidden')}>
                <span style={css(`display:block;height:100%;border-radius:999px;background:${n.color};width:${n.pct}`)} />
              </span>
              <span style={css('flex:none;width:70px;text-align:end;font-size:12.5px;color:#6a5c4c')}>{n.amount}</span>
            </div>
          ))}
          <p dir="auto" style={css('margin:10px 0 0;font-size:12px;line-height:1.5;color:#6a5c4c')}>
            {v.u.barsNote}
          </p>
        </div>
      )}

      <div style={css('margin:14px 22px 0;padding:18px 20px;border-radius:28px;background:#1b1714;color:#fffaf3')}>
        <div style={css('font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;opacity:.6')}>
          {v.insteadLabel}
        </div>
        <div style={css('display:flex;align-items:baseline;gap:12px;margin-top:9px')}>
          <span style={css("font-family:'Caprasimo',serif;font-size:27px;text-decoration:line-through;opacity:.5")}>
            {v.takeawayPrice}
          </span>
          <ChevronRight size={19} stroke="#ff9d4f" />
          <span style={css("font-family:'Caprasimo',serif;font-size:34px;color:#ff9d4f")}>{v.pricePer}</span>
        </div>
        <p dir="auto" style={css('margin:9px 0 0;font-size:13.5px;line-height:1.5;opacity:.82;text-wrap:pretty')}>
          {v.savingLine}
        </p>
      </div>

      <div style={css('display:flex;gap:9px;margin:14px 22px 0')}>
        <div style={css('flex:1;padding:14px;border-radius:22px;background:#fdf0e3;text-align:center')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:21px;line-height:1")}>{v.timeTotal}</div>
          <div style={css('font-size:11.5px;color:#6a5c4c;margin-top:5px')}>{v.timeActive}</div>
        </div>
        <div style={css('flex:1;padding:14px;border-radius:22px;background:#fdf0e3;text-align:center')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:21px;line-height:1")}>{v.diffLabel}</div>
          <div style={css('font-size:11.5px;color:#6a5c4c;margin-top:5px')}>{v.resLevelLabel}</div>
        </div>
      </div>

      {v.timeOverNote && (
        <p
          dir="auto"
          style={css('margin:9px 22px 0;font-size:12.5px;line-height:1.5;color:#6a5c4c;text-wrap:pretty')}
        >
          {v.timeOverNote}
        </p>
      )}

      <div style={css('margin:26px 22px 0')}>
        <Kicker>{v.twoOthersLabel}</Kicker>
        <div style={css('display:flex;flex-direction:column;gap:9px;margin-top:10px')}>
          {v.alternates.map((a) => (
            <Btn
              key={a.key}
              onClick={a.pick}
              css="display:flex;gap:13px;align-items:center;padding:11px;border-radius:24px;background:#ffffff;text-align:start;width:100%"
              hover="background:#fdf0e3"
            >
              <DishPic src={a.pic} size={62} radius={18} />
              <span style={css('flex:1;min-width:0')}>
                <span style={css('display:block;font-size:15.5px;font-weight:700;line-height:1.2')}>{a.name}</span>
                <span style={css('display:block;font-size:12.5px;color:#6a5c4c;margin-top:4px')}>{a.meta}</span>
              </span>
              <span style={css('flex:none;text-align:end')}>
                <span style={css("display:block;font-family:'Caprasimo',serif;font-size:19px;color:#a83f06")}>
                  {a.price}
                </span>
                <span style={css('display:block;font-size:11px;color:#6a5c4c;margin-top:2px')}>
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
