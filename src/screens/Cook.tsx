import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Kicker } from '../ui/bits';
import { Bulb, Check, ChevronLeft, Clock, X } from '../ui/Icon';
import { StepArt } from '../ui/StepArt';
import type { Pantry } from '../state/usePantry';

export function Cook({ v }: { v: Pantry }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:6px 22px 20px')}>
      {v.methodUntranslated && (
        <div style={css('margin:8px 0 2px;padding:12px 15px;border-radius:20px;background:#ffe9d2')}>
          <div dir="auto" style={css('font-size:13px;font-weight:700;color:#3b3229')}>
            {v.stepsEnglishTitle}
          </div>
          <p dir="auto" style={css('margin:5px 0 0;font-size:12.5px;line-height:1.5;color:#6a5c4c;text-wrap:pretty')}>
            {v.stepsEnglishWhy}
          </p>
        </div>
      )}

      <div style={css('display:flex;align-items:center;gap:12px')}>
        <Btn
          aria-label={v.t.navTonight}
          onClick={v.goHome}
          css="flex:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-inline-start:-6px"
          hover="background:#fdf0e3"
        >
          <X size={19} stroke="#6a5c4c" />
        </Btn>
        <div style={css('flex:1;height:7px;border-radius:999px;background:#f6e7d5;overflow:hidden')}>
          <div style={css(`height:100%;border-radius:999px;background:#e85d04;transition:width .35s ease;width:${v.cookPct}`)} />
        </div>
        <div style={css('flex:none;font-size:13px;font-weight:700;color:#6a5c4c')}>{v.stepCount}</div>
      </div>

      <div style={css('margin-top:22px;flex:1;display:flex;flex-direction:column')}>
        <div style={css('display:flex;align-items:center;gap:10px')}>
          <span style={css("width:40px;height:40px;border-radius:14px;background:#e85d04;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;font-size:20px")}>
            {v.stepNo}
          </span>
          {v.stepMins && (
            <span style={css('display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:#fdf0e3;font-size:13px;font-weight:700;color:#6a5c4c')}>
              <Clock size={15} stroke="#847462" />
              {v.stepMins}
            </span>
          )}
        </div>

        {/* What this step looks like. A photograph when the dish has been shot,
            otherwise a drawing of the technique — either way something to find
            your place against after you look up from the pan. */}
        <div
          style={css('position:relative;margin-top:16px;border-radius:26px;background:#ffffff;display:flex;align-items:center;justify-content:center;overflow:hidden;height:' + (v.stepPic ? '176px' : '122px'))}
        >
          {v.stepPic ? (
            <>
              {/* The dish, shown as food. No wash — the photograph is the one
                  thing on this screen that makes anybody want to finish. */}
              <img
                src={v.stepPic}
                alt=""
                style={css('width:100%;height:100%;object-fit:cover;display:block')}
              />
              {/* The technique, as a badge on the photograph rather than
                  instead of it: the picture says what you are making, the
                  badge says what this step does with your hands. */}
              {v.stepPicIsDish && (
                <div
                  style={css('position:absolute;inset-inline-end:10px;bottom:10px;width:58px;height:58px;border-radius:18px;background:rgba(249,244,237,.94);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(46,43,37,.22)')}
                >
                  <StepArt technique={v.stepTechnique} size={46} />
                </div>
              )}
            </>
          ) : (
            <StepArt technique={v.stepTechnique} size={146} />
          )}
        </div>

        <p
          dir="auto"
          style={css('font-size:23px;line-height:1.38;font-weight:500;margin:16px 0 0;letter-spacing:-.2px;text-wrap:pretty')}
        >
          {v.stepText}
        </p>

        {/* The honest remainder. This screen runs one step at a time, so the
            time still owed is the sum of the timers ahead of you — which for
            most recipes is more than the figure on the card that sold you the
            dish. Better to see it here than to meet it a timer at a time. */}
        {v.timeLeft > 0 && (
          <div dir="auto" style={css('font-size:12.5px;color:#6a5c4c;margin-top:10px')}>
            {v.timeLeftLine}
          </div>
        )}

        {v.stepTip && (
          <div style={css('margin-top:20px;padding:17px 18px;border-radius:26px;background:#fff4ea;display:flex;gap:12px;align-items:flex-start')}>
            <Bulb size={20} stroke="#c04a03" style={{ flex: 'none', marginTop: 2 }} />
            <p dir="auto" style={css('margin:0;font-size:14.5px;line-height:1.5;color:#7d2f04;text-wrap:pretty')}>
              {v.stepTip}
            </p>
          </div>
        )}

        {v.timerOn && (
          <div style={css('margin-top:20px;padding:20px;border-radius:28px;background:#1b1714;color:#fffaf3;display:flex;align-items:center;justify-content:space-between')}>
            <div>
              <div style={css('font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;opacity:.55')}>
                {v.u.timerLabel}
              </div>
              <div style={css("font-family:'Caprasimo',serif;font-size:44px;line-height:1.05;margin-top:5px;color:#ff9d4f")}>
                {v.timerText}
              </div>
            </div>
            <Btn
              onClick={v.stopTimer}
              css="height:44px;padding:0 20px;border-radius:999px;background:rgba(245,234,216,.14);color:#fffaf3;font-size:14.5px;font-weight:700"
            >
              {v.u.stopBtn}
            </Btn>
          </div>
        )}
        {v.canTime && (
          <Btn
            onClick={v.startTimer}
            css="margin-top:20px;width:100%;height:50px;border-radius:999px;background:#ffe9d2;font-size:15px;font-weight:700;color:#3b3229;display:flex;align-items:center;justify-content:center;gap:8px"
            hover="background:#efdcc8"
          >
            <Clock size={18} stroke="#6a5c4c" />
            {v.timerCta}
          </Btn>
        )}

        {v.lostOpen && (
          <div style={css('margin-top:16px;padding:17px 18px;border-radius:26px;background:#e2f8c6;animation:pgUp .28s ease-out both')}>
            <Kicker color="#3d7213">{v.t.cookWhere}</Kicker>
            <p dir="auto" style={css('margin:9px 0 0;font-size:14px;line-height:1.5;color:#2c5410;text-wrap:pretty')}>
              {v.recap}
            </p>
            <div style={css('margin-top:11px;padding-top:11px;border-top:1px solid rgba(61,71,43,.18);font-size:13.5px;line-height:1.5;color:#2c5410')}>
              {v.hobState}
            </div>
          </div>
        )}
      </div>

      <div style={css('margin-top:20px')}>
        <Btn
          onClick={v.toggleLost}
          css="width:100%;height:44px;border-radius:999px;font-size:14.5px;font-weight:600;color:#6a5c4c;margin-bottom:8px"
          hover="background:#fdf0e3"
        >
          {v.lostCta}
        </Btn>
        <div style={css('display:flex;gap:9px')}>
          {/* Disabled on the first step rather than merely ineffective there:
              it used to clamp to step 0 and stop your running timer on the way,
              which is the one outcome nobody wants from a Back button. */}
          <Btn
            aria-label={v.xt('stepBack')}
            onClick={v.prevStep}
            disabled={!v.canPrev}
            css={
              'flex:none;width:60px;height:60px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#ffe9d2' +
              (v.canPrev ? '' : ';opacity:.4;cursor:default')
            }
            hover={v.canPrev ? 'background:#efdcc8' : ''}
          >
            <ChevronLeft size={22} stroke="#3b3229" />
          </Btn>
          <Btn
            onClick={v.nextStep}
            css="flex:1;height:60px;border-radius:999px;background:#e85d04;color:#fff;font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
            hover="background:#c04a03"
          >
            {v.nextCta}
            <Check size={21} stroke="#fff" />
          </Btn>
        </div>
      </div>
    </div>
  );
}
