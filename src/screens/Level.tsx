import { Fragment } from 'react';
import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { Ask } from '../ui/bits';
import { Check } from '../ui/Icon';
import { MascotMid } from '../ui/Mascot';
import type { Pantry } from '../state/usePantry';

/**
 * One question, four answers, one tap.
 *
 * This replaces two screens of drag-and-drop — eight technique cards into four
 * rows, then five time cards into four more. Thirteen drags on a phone, before
 * anybody had seen a single recipe, to produce one number between 1 and 4.
 *
 * Four alternatives to one question is a radio group, not four independent
 * toggles: `aria-pressed` would say each row is separately on or off, which is
 * exactly wrong. Arrows move and choose, which is what the drag screen's
 * carefully built keyboard support was for and what this keeps. The button at
 * the bottom is the only thing that leaves the screen — a tap that jumped
 * straight to the next question would throw a keyboard user out of the group
 * on the first ArrowDown and make options three and four unreachable.
 */
export function Level({ v }: { v: Pantry }) {
  return (
    <Ask
      title={v.t.tierSkill}
      sub={v.levelSub}
      /* Null when you have arrived from Settings to change one answer: there
         is no step 2 of 4 if there is no 1, 3 or 4 coming. */
      step={v.levelDots ? 1 : null}
      stepLabel={v.dotsLabel(1)}
      back={v.t.back}
      onBack={v.back}
      skip={v.t.tierSkip}
      onSkip={v.levelNext}
      /* Four full-width rows leave less room than the chip screens do, so this
         one gets the smaller drawing and gives it up first on a short phone. */
      art={<MascotMid key={v.levelChosen ? "on" : "off"} pose={v.levelChosen ? "cheer" : "think"} jar="clamp(40px, 8vh, 64px)" />}
      foot={
        <>
          {/* Mounted whether or not it has anything to say, so the live region
              exists before the text arrives. With no text it has no padding and
              no colour, so there is nothing to see. */}
          <div role="status" dir="auto" style={css(v.levelReadoutStyle)}>
            {v.levelReadout}
          </div>
          <Btn
            onClick={v.levelNext}
            css="width:100%;height:56px;border-radius:999px;background:#e85d04;color:#fff;font-size:19px;font-weight:700;box-shadow:0 3px 10px rgba(46,43,37,.16);margin-top:12px"
            hover="background:#c04a03"
          >
            {v.levelCta}
          </Btn>
        </>
      }
    >
      <div
        role="radiogroup"
        aria-label={v.t.tierSkill}
        style={css('display:flex;flex-direction:column;gap:9px')}
      >
        {v.levelOptions.map((o) => (
          <Btn
            key={o.key}
            id={o.id}
            role="radio"
            aria-checked={o.on}
            tabIndex={o.tabIndex}
            onClick={o.pick}
            onKeyDown={o.onKey}
            css={o.style}
            hover={o.hover}
          >
            {/* The acts lead and the level name follows, not the other way
                round: you pick "Sear meat hard · Make a pan sauce" and merely
                notice that it is called "you can feed yourself".

                Each act is its own <bdi> rather than one joined string —
                .pg-scroll sets unicode-bidi:plaintext, so a single English
                fallback inside an Arabic row would otherwise flip the whole
                line left-to-right. */}
            <span style={css('display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:16px;font-weight:700;line-height:1.25')}>
              {o.on && <Check size={17} stroke="#c04a03" />}
              {o.acts.map((a, i) => (
                <Fragment key={a}>
                  {i > 0 && (
                    <span aria-hidden="true" style={css('color:#96866f;font-weight:600')}>
                      ·
                    </span>
                  )}
                  <bdi>{a}</bdi>
                </Fragment>
              ))}
            </span>
            <span dir="auto" style={css('font-size:13px;font-weight:500;color:#6a5c4c;line-height:1.35')}>
              {o.name}
            </span>
          </Btn>
        ))}
      </div>
    </Ask>
  );
}
