import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { DishPic, Kicker } from '../ui/bits';
import { ChevronRight, Flame, Fridge, Search } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

/**
 * Tonight — the front door, and the screen this app exists to be.
 *
 * It used to open as a form: what do you fancy, how much do you want to spend,
 * how long have you got, then a button. Four decisions on the one screen whose
 * whole job is to end decision paralysis — the fridge-staring loop rebuilt
 * inside the app that was meant to end it. The craving box was the worst of the
 * four, because a blank field asks you to GENERATE a desire, and generating is
 * the expensive thing when you are already depleted. Reacting is cheap.
 *
 * So it opens on an answer. A real dish, really costed, chosen from everything
 * the app already knows. The first thing you do is react — take it, or ask for
 * another — and both are one tap. The craving box, the money and the time are
 * all still here; they sit below the answer behind a disclosure, for the
 * minority who arrive knowing exactly what they want.
 */
export function Home({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:6px 22px 26px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between')}>
        <div style={css('font-size:15px;font-weight:600;color:#645c50')}>{v.greeting}</div>
        {v.showStreak && (
          <Btn
            onClick={v.goPassport}
            css="display:flex;align-items:center;gap:5px;padding:6px 12px 6px 9px;border-radius:999px;background:#fff2eb"
            hover="background:#ffe1d0"
          >
            <Flame size={16} stroke="#b2622d" />
            <span style={css('font-size:13.5px;font-weight:800;color:#8c491a')}>{v.streak}</span>
          </Btn>
        )}
      </div>

      {/* ── The answer ─────────────────────────────────────────────────────
          Everything down to the two buttons is one viewport on a phone. */}
      <p style={css('font-size:14.5px;font-weight:600;color:#645c50;margin:12px 0 0')}>{v.tonightId}</p>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:36px;line-height:1.02;margin:4px 0 0;letter-spacing:-.6px;text-wrap:balance")}
      >
        {v.tonightDish}
      </h1>
      <div style={css('display:flex;align-items:center;gap:9px;margin-top:6px')}>
        <span style={css('font-size:14.5px;color:#645c50')}>{v.tonightCuisine}</span>
        <span style={css('width:4px;height:4px;border-radius:50%;background:#c0b6a5')} />
        <span style={css('font-size:14.5px;color:#645c50')}>{v.tonightMins}</span>
      </div>

      <div style={css('margin-top:13px;border-radius:28px;overflow:hidden;height:162px;background:#eee7db;box-shadow:0 3px 10px rgba(46,43,37,.16)')}>
        <DishPic src={v.tonightPic} radius={0} style={{ display: 'block' }} />
      </div>

      <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:13px')}>
        <div>
          <div style={css("font-family:'Caprasimo',serif;font-size:38px;line-height:1;letter-spacing:-1px")}>
            {v.tonightTotal}
          </div>
          <div style={css('font-size:13px;color:#645c50;margin-top:5px')}>{v.tonightSub}</div>
        </div>
        <div style={css('text-align:end')}>
          <div style={css("font-family:'Caprasimo',serif;font-size:25px;line-height:1;color:#8c491a")}>
            {v.tonightPer}
          </div>
          <div style={css('font-size:13px;color:#645c50;margin-top:5px')}>{v.tonightPerSub}</div>
        </div>
      </div>

      {/* The dish name changes in place when you ask for another, so a screen
          reader is told what arrived. Politely — it is not an interruption. */}
      <p
        role="status"
        style={css('position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap')}
      >
        {v.tonightSaid}
      </p>

      <Btn
        onClick={v.tonightOpen}
        css="width:100%;height:58px;border-radius:999px;background:#c67139;color:#fff;font-size:19px;font-weight:700;margin-top:15px;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
        hover="background:#b2622d"
      >
        {v.tonightCta}
        <ChevronRight size={21} stroke="#fff" />
      </Btn>
      <Btn
        onClick={v.tonightAgain}
        css="width:100%;height:48px;border-radius:999px;font-size:15px;font-weight:700;color:#8c491a;background:#fff2eb;margin-top:8px"
        hover="background:#ffe1d0"
      >
        {v.tonightAgainCta}
      </Btn>

      {/* The one question the app ever asks unprompted, and only after six
          cooks. It used to live on Stats, which is no longer a tab — and it is
          not a readout anyway: the answer changes what gets offered here. It
          renders nothing at all until there is something to ask. */}
      {v.questions.map((q) => (
        <div key={q.key} style={css('margin-top:22px;padding:20px;border-radius:30px;background:#fff2eb;animation:pgUp .3s ease-out both')}>
          <div style={css('display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;background:#ffe1d0;font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8c491a')}>
            {v.patternLabel}
          </div>
          <div dir="auto" style={css('font-size:17px;font-weight:700;color:#643312;line-height:1.32;margin-top:11px;text-wrap:pretty')}>
            {q.q}
          </div>
          <p dir="auto" style={css('margin:8px 0 0;font-size:14px;line-height:1.5;color:#8c491a;text-wrap:pretty')}>
            {q.why}
          </p>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:15px')}>
            {q.opts.map((o) => (
              <Btn
                key={o.key}
                onClick={o.pick}
                css="padding:12px 17px;border-radius:999px;background:#8c491a;color:#fff;font-size:14px;font-weight:700"
                hover="background:#b2622d"
              >
                {o.label}
              </Btn>
            ))}
            <Btn
              onClick={q.skip}
              css="padding:12px 17px;border-radius:999px;background:#ffe1d0;color:#8c491a;font-size:14px;font-weight:700"
              hover="background:#ffc6a5"
            >
              {v.t.notNow}
            </Btn>
          </div>
        </div>
      ))}

      <Btn
        onClick={v.goBrowse}
        css="width:100%;height:46px;border-radius:999px;font-size:15px;font-weight:700;color:#8c491a;background:#fff2eb;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px"
        hover="background:#ffe1d0"
      >
        {v.t.homeBrowse}
        <span style={css('font-size:12.5px;font-weight:600;opacity:.75')}>{v.browseCount}</span>
      </Btn>

      <Btn
        onClick={v.goPlan}
        css="width:100%;height:46px;border-radius:999px;font-size:15px;font-weight:700;color:#3d472b;background:#e1eecc;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px"
        hover="background:#ccdbb2"
      >
        {v.xt('planTitle')}
        <span style={css('font-size:12.5px;font-weight:600;opacity:.8')}>{v.planDays}</span>
      </Btn>

      {/* ── The refinement, for anyone who arrived knowing ─────────────────
          A real <details>, so it needs no state of its own and the keyboard
          works for free. Everything the old form asked for lives in here. */}
      <details
        open={v.refineOpen}
        onToggle={v.toggleRefine}
        style={css('margin-top:18px;border-radius:26px;background:#f9f4ed;overflow:hidden')}
      >
        <summary style={css('padding:15px 18px;font-size:14.5px;font-weight:700;color:#645c50;cursor:pointer')}>
          {v.refineLabel}
        </summary>

        <div style={css('padding:0 18px 18px')}>
          <div style={css('position:relative')}>
            <Search size={20} stroke="#a19786" style={{ position: 'absolute', insetInlineStart: 18, top: 19 }} />
            <input
              value={v.query}
              onChange={v.onQuery}
              placeholder={v.t.homePlaceholder}
              aria-label={v.t.homeWhat}
              style={css('width:100%;height:58px;border-radius:999px;border:2px solid #dcd3c4;background:#fff;padding-inline:48px 18px;font-size:15px;font-weight:500;color:#201e1d')}
            />
          </div>

          <div className="pg-x" style={css('display:flex;gap:8px;margin:12px -18px 0;padding:2px 18px')}>
            {v.cravings.map((c) => (
              <Btn key={c.key} onClick={c.pick} aria-pressed={c.on} css={c.style}>
                {c.label}
              </Btn>
            ))}
          </div>

          <div style={css('margin-top:20px;display:flex;align-items:baseline;justify-content:space-between')}>
            <Kicker id="pg-money-k">{v.t.homeMoney}</Kicker>
            <div style={css('font-size:13px;color:#645c50')}>{v.servingsLabel}</div>
          </div>
          <div role="group" aria-labelledby="pg-money-k" style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:9px')}>
            {v.budgetChips.map((b) => (
              <Btn key={b.key} onClick={b.pick} aria-pressed={b.on} css={b.style}>
                {b.label}
              </Btn>
            ))}
          </div>
          {v.budgetOtherOpen && (
            <div style={css('margin-top:9px;display:flex;align-items:center;gap:10px;padding-inline:18px 6px;height:52px;border-radius:999px;border:2px solid #c67139;background:#fff')}>
              <span style={css("font-family:'Caprasimo',serif;font-size:21px;color:#8c491a")}>{v.symbol}</span>
              <input
                value={v.budgetDraft}
                onChange={v.onBudgetDraft}
                onKeyDown={v.onBudgetKey}
                placeholder="6.50"
                inputMode="decimal"
                aria-label={v.t.homeMoney}
                aria-invalid={v.budgetErr}
                style={css('flex:1;min-width:0;border:0;outline:none;background:none;font-size:18px;font-weight:700')}
              />
              <Btn
                onClick={v.commitBudget}
                css="height:40px;padding:0 18px;border-radius:999px;background:#8c491a;color:#fff;font-size:14.5px;font-weight:700"
              >
                {v.u.setBtn}
              </Btn>
            </div>
          )}
          {/* Only after you pressed Set on something the app cannot show you,
              and only until the next keystroke. role="status" rather than
              "alert": it exists because you pressed a button, so it does not
              need to interrupt anybody. */}
          {v.budgetOtherOpen && v.budgetErr && (
            <p
              role="status"
              dir="auto"
              style={css('margin:8px 4px 0;font-size:12.5px;line-height:1.5;font-weight:600;color:#8c491a;text-wrap:pretty')}
            >
              {v.budgetRangeLine}
            </p>
          )}

          <Kicker id="pg-time-k" style={{ marginTop: 20 }}>
            {v.t.homeTime}
          </Kicker>
          <div role="group" aria-labelledby="pg-time-k" style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:9px')}>
            {v.timeChips.map((t) => (
              <Btn key={t.key} onClick={t.pick} aria-pressed={t.on} css={t.style}>
                {t.label}
              </Btn>
            ))}
          </div>

          <Btn
            onClick={v.search}
            css="width:100%;height:52px;border-radius:999px;background:#c67139;color:#fff;font-size:19px;font-weight:700;margin-top:18px"
            hover="background:#b2622d"
          >
            {v.searchCta}
          </Btn>
        </div>
      </details>



      <Btn
        onClick={v.goKitchen}
        css="width:100%;text-align:start;margin-top:18px;padding:16px 18px;border-radius:26px;background:#e1eecc;display:flex;gap:13px;align-items:center"
        hover="background:#ccdbb2"
      >
        <Fridge size={26} stroke="#56633f" style={{ flex: 'none' }} />
        <span style={css('flex:1;min-width:0')}>
          <span style={css('display:block;font-size:15px;font-weight:700;color:#3d472b')}>{v.pantryLine}</span>
          <span style={css('display:block;font-size:13px;color:#3d472b;margin-top:2px')}>{v.pantryNudge}</span>
        </span>
        <ChevronRight size={19} stroke="#56633f" style={{ flex: 'none' }} />
      </Btn>
    </div>
  );
}
