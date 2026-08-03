import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Kicker } from '../ui/bits';
import { CameraOff, Flame } from '../ui/Icon';
import { PlateDrop } from '../ui/PlateDrop';
import type { Pantry } from '../state/usePantry';

export function After({ v }: { v: Pantry }) {
  return (
    <div style={css('padding:14px 22px 26px')}>
      <h1
        dir="auto"
        style={css("font-family:'Caprasimo',serif;font-weight:400;font-size:34px;line-height:1.04;margin:0;letter-spacing:-.4px")}
      >
        {v.t.afterTitle}
      </h1>
      <p dir="auto" style={css('font-size:15px;line-height:1.5;margin:9px 0 0;color:#645c50;text-wrap:pretty')}>
        {v.t.afterSub} {v.t.afterOptional}
      </p>

      {v.photoSkipped && (
        <Btn
          onClick={v.unskipPhoto}
          css="width:100%;margin-top:16px;padding:15px 18px;border-radius:26px;background:#f9f4ed;display:flex;gap:11px;align-items:center;text-align:start"
          hover="background:#eee7db"
        >
          <CameraOff size={19} stroke="#a19786" style={{ flex: 'none' }} />
          <span style={css('flex:1;min-width:0;font-size:13.5px;font-weight:600;color:#82796a')}>
            {v.u.noPhoto}
          </span>
        </Btn>
      )}

      {v.photoWanted && (
        <>
          <div style={css('margin-top:16px;height:200px;border-radius:28px;overflow:hidden;background:#eee7db')}>
            <PlateDrop src={v.plate} placeholder={v.platePlaceholder} onPick={v.setPlate} />
          </div>
          <Btn
            onClick={v.skipPhoto}
            css="width:100%;height:42px;border-radius:999px;font-size:13.5px;font-weight:700;color:#645c50;margin-top:8px"
            hover="background:#eee7db"
          >
            {v.t.afterSkip}
          </Btn>
        </>
      )}

      {v.wasteUnset && (
        <div style={css('margin-top:16px')}>
          <Kicker>{v.t.afterTell}</Kicker>
          <div style={css('display:flex;gap:8px;margin-top:10px')}>
            {v.wasteChoices.map((w) => (
              <Btn key={w.key} onClick={w.pick} css={w.style} hover="background:#eee7db">
                <span style={css("display:block;font-family:'Caprasimo',serif;font-size:19px;line-height:1")}>
                  {w.pct}
                </span>
                <span style={css('display:block;font-size:12px;font-weight:600;margin-top:6px;opacity:.8')}>
                  {w.label}
                </span>
              </Btn>
            ))}
          </div>
        </div>
      )}

      {v.wasteSet && (
        <div style={css('animation:pgUp .34s ease-out both')}>
          <div style={css('margin-top:16px;padding:19px 20px;border-radius:28px;background:#ebddc5')}>
            <div style={css('display:flex;align-items:baseline;justify-content:space-between')}>
              <div style={css("font-family:'Caprasimo',serif;font-size:30px;line-height:1")}>
                {v.wasteHeadline}
              </div>
              <Btn
                onClick={v.resetWaste}
                css="flex:none;white-space:nowrap;margin-inline-start:12px;font-size:12.5px;font-weight:600;color:#8c491a;text-decoration:underline"
              >
                {v.u.notRight}
              </Btn>
            </div>
            <p dir="auto" style={css('margin:9px 0 0;font-size:14px;line-height:1.5;color:#474238;text-wrap:pretty')}>
              {v.wasteBody}
            </p>
          </div>

          <div style={css(`margin-top:12px;padding:19px 20px;border-radius:28px;background:${v.keepBg}`)}>
            <div style={css('display:flex;gap:11px;align-items:flex-start')}>
              <span
                style={css(`flex:none;width:30px;height:30px;border-radius:50%;background:${v.keepIconBg};display:flex;align-items:center;justify-content:center`)}
              >
                {v.keepIcon}
              </span>
              <div style={css('min-width:0')}>
                <div dir="auto" style={css(`font-size:16px;font-weight:700;line-height:1.3;color:${v.keepFg}`)}>
                  {v.keepTitle}
                </div>
                <p
                  dir="auto"
                  style={css(`margin:6px 0 0;font-size:13.5px;line-height:1.5;color:${v.keepFg};opacity:.85;text-wrap:pretty`)}
                >
                  {v.keepBody}
                </p>
              </div>
            </div>
            {v.canRemind && (
              <Btn
                onClick={v.setReminder}
                css="width:100%;height:46px;border-radius:999px;background:#56633f;color:#fff;font-size:14.5px;font-weight:700;margin-top:14px"
                hover="background:#3d472b"
              >
                {v.remindCta}
              </Btn>
            )}
            {v.remindNeedsAccount && (
              <p
                dir="auto"
                style={css('margin:12px 2px 0;font-size:12.5px;line-height:1.5;color:#56633f;opacity:.85;text-wrap:pretty')}
              >
                {v.remindNeedsAccountLine}
              </p>
            )}
          </div>

          {/* The portion-shrink offer that used to sit here made three
              promises — resize the next cook, undo any time, stop asking —
              and no code kept any of them. An offer the app cannot honour is
              not a feature, so it is gone rather than half-built. */}

          <div style={css('margin-top:12px;padding:20px;border-radius:28px;background:#201e1d;color:#f5ead8')}>
            <div style={css('display:flex;align-items:center;gap:12px')}>
              <span style={css('flex:none;width:52px;height:52px;border-radius:50%;background:rgba(246,160,107,.16);display:flex;align-items:center;justify-content:center;animation:pgFlick 2.4s ease-in-out infinite')}>
                <Flame size={27} stroke="#f6a06b" />
              </span>
              <div style={css('min-width:0')}>
                <div style={css("font-family:'Caprasimo',serif;font-size:26px;line-height:1;color:#f6a06b")}>
                  {v.streakBig}
                </div>
                <div style={css('font-size:13px;opacity:.72;margin-top:5px')}>{v.streakSub}</div>
              </div>
            </div>
            <div style={css('display:flex;gap:6px;margin-top:16px')}>
              {v.streakDots.map((d) => (
                <span
                  key={d.key}
                  style={css(`flex:1;height:34px;border-radius:12px;background:${d.bg};display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;color:${d.fg}`)}
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          <Btn
            onClick={v.finishMeal}
            css="width:100%;height:56px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700;margin-top:16px"
            hover="background:#b2622d"
          >
            {v.u.doneThanks}
          </Btn>
        </div>
      )}
    </div>
  );
}
