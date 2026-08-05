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
        <div style={css('margin:8px 0 2px;padding:12px 15px;border-radius:20px;background:#ebddc5')}>
          <div dir="auto" style={css('font-size:13px;font-weight:700;color:#474238')}>
            {v.stepsEnglishTitle}
          </div>
          <p dir="auto" style={css('margin:5px 0 0;font-size:12.5px;line-height:1.5;color:#645c50;text-wrap:pretty')}>
            {v.stepsEnglishWhy}
          </p>
        </div>
      )}

      <div style={css('display:flex;align-items:center;gap:12px')}>
        <Btn
          aria-label={v.t.navTonight}
          onClick={v.goHome}
          css="flex:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-inline-start:-6px"
          hover="background:#eee7db"
        >
          <X size={19} stroke="#645c50" />
        </Btn>
        <div style={css('flex:1;height:7px;border-radius:999px;background:#e6dcc9;overflow:hidden')}>
          <div style={css(`height:100%;border-radius:999px;background:#c67139;transition:width .35s ease;width:${v.cookPct}`)} />
        </div>
        <div style={css('flex:none;font-size:13px;font-weight:700;color:#645c50')}>{v.stepCount}</div>
      </div>

      <div style={css('margin-top:22px;flex:1;display:flex;flex-direction:column')}>
        <div style={css('display:flex;align-items:center;gap:10px')}>
          <span style={css("width:40px;height:40px;border-radius:14px;background:#c67139;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;font-size:20px")}>
            {v.stepNo}
          </span>
          {v.stepMins && (
            <span style={css('display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:#eee7db;font-size:13px;font-weight:700;color:#645c50')}>
              <Clock size={15} stroke="#82796a" />
              {v.stepMins}
            </span>
          )}
        </div>

        {/* What this step looks like. A photograph when the dish has been shot,
            otherwise a drawing of the technique — either way something to find
            your place against after you look up from the pan. */}
        <div
          style={css('margin-top:16px;border-radius:26px;background:#f9f4ed;display:flex;align-items:center;justify-content:center;overflow:hidden;height:122px')}
        >
          {v.stepPic ? (
            <img
              src={v.stepPic}
              alt=""
              style={css('width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.86) contrast(.96)')}
            />
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

        {v.stepTip && (
          <div style={css('margin-top:20px;padding:17px 18px;border-radius:26px;background:#fff2eb;display:flex;gap:12px;align-items:flex-start')}>
            <Bulb size={20} stroke="#b2622d" style={{ flex: 'none', marginTop: 2 }} />
            <p dir="auto" style={css('margin:0;font-size:14.5px;line-height:1.5;color:#643312;text-wrap:pretty')}>
              {v.stepTip}
            </p>
          </div>
        )}

        {v.timerOn && (
          <div style={css('margin-top:20px;padding:20px;border-radius:28px;background:#201e1d;color:#f5ead8;display:flex;align-items:center;justify-content:space-between')}>
            <div>
              <div style={css('font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;opacity:.55')}>
                {v.u.timerLabel}
              </div>
              <div style={css("font-family:'Caprasimo',serif;font-size:44px;line-height:1.05;margin-top:5px;color:#f6a06b")}>
                {v.timerText}
              </div>
            </div>
            <Btn
              onClick={v.stopTimer}
              css="height:44px;padding:0 20px;border-radius:999px;background:rgba(245,234,216,.14);color:#f5ead8;font-size:14.5px;font-weight:700"
            >
              {v.u.stopBtn}
            </Btn>
          </div>
        )}
        {v.canTime && (
          <Btn
            onClick={v.startTimer}
            css="margin-top:20px;width:100%;height:50px;border-radius:999px;background:#ebddc5;font-size:15px;font-weight:700;color:#474238;display:flex;align-items:center;justify-content:center;gap:8px"
            hover="background:#dcd3c4"
          >
            <Clock size={18} stroke="#645c50" />
            {v.timerCta}
          </Btn>
        )}

        {v.lostOpen && (
          <div style={css('margin-top:16px;padding:17px 18px;border-radius:26px;background:#e1eecc;animation:pgUp .28s ease-out both')}>
            <Kicker color="#56633f">{v.t.cookWhere}</Kicker>
            <p dir="auto" style={css('margin:9px 0 0;font-size:14px;line-height:1.5;color:#3d472b;text-wrap:pretty')}>
              {v.recap}
            </p>
            <div style={css('margin-top:11px;padding-top:11px;border-top:1px solid rgba(61,71,43,.18);font-size:13.5px;line-height:1.5;color:#3d472b')}>
              {v.hobState}
            </div>
          </div>
        )}
      </div>

      <div style={css('margin-top:20px')}>
        <Btn
          onClick={v.toggleLost}
          css="width:100%;height:44px;border-radius:999px;font-size:14.5px;font-weight:600;color:#645c50;margin-bottom:8px"
          hover="background:#eee7db"
        >
          {v.lostCta}
        </Btn>
        <div style={css('display:flex;gap:9px')}>
          <Btn
            aria-label={v.xt('stepBack')}
            onClick={v.prevStep}
            css="flex:none;width:60px;height:60px;border-radius:999px;background:#ebddc5;display:flex;align-items:center;justify-content:center"
            hover="background:#dcd3c4"
          >
            <ChevronLeft size={22} stroke="#474238" />
          </Btn>
          <Btn
            onClick={v.nextStep}
            css="flex:1;height:60px;border-radius:999px;background:#c67139;color:#fff;font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 3px 10px rgba(46,43,37,.16)"
            hover="background:#b2622d"
          >
            {v.nextCta}
            <Check size={21} stroke="#fff" />
          </Btn>
        </div>
      </div>
    </div>
  );
}
