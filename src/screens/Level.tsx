import { Fragment } from 'react';
import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Dots } from '../ui/bits';
import { Check } from '../ui/Icon';
import type { Pantry } from '../state/usePantry';

const H2 = "font-family:'Caprasimo',serif;font-weight:400;font-size:32px;line-height:1.06;margin:0;letter-spacing:-.3px";

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
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:14px 22px 22px')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
        <BackBtn label={v.t.back} onClick={v.back} />
        {v.levelDots ? <Dots at={1} label={v.dotsLabel(1)} /> : <span style={css('width:38px')} />}
        <Btn
          onClick={v.levelNext}
          css="height:38px;padding:0 12px;border-radius:999px;font-size:14px;font-weight:600;color:#645c50"
          hover="background:#eee7db"
        >
          {v.t.tierSkip}
        </Btn>
      </div>

      <h2 id="pg-level-q" dir="auto" style={css(H2)}>
        {v.t.tierSkill}
      </h2>
      <p dir="auto" style={css('font-size:14.5px;line-height:1.5;margin:9px 0 18px;color:#645c50;text-wrap:pretty')}>
        {v.levelSub}
      </p>

      <div role="radiogroup" aria-labelledby="pg-level-q" style={css('display:flex;flex-direction:column;gap:9px')}>
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
              {o.on && <Check size={17} stroke="#b2622d" />}
              {o.acts.map((a, i) => (
                <Fragment key={a}>
                  {i > 0 && (
                    <span aria-hidden="true" style={css('color:#a19786;font-weight:600')}>
                      ·
                    </span>
                  )}
                  <bdi>{a}</bdi>
                </Fragment>
              ))}
            </span>
            <span dir="auto" style={css('font-size:13px;font-weight:500;color:#645c50;line-height:1.35')}>
              {o.name}
            </span>
          </Btn>
        ))}
      </div>

      <div style={css('margin-top:auto;padding-top:16px')}>
        {/* Mounted whether or not it has anything to say, so the live region
            exists before the text arrives. With no text it has no padding and
            no colour, so there is nothing to see. */}
        <div role="status" dir="auto" style={css(v.levelReadoutStyle)}>
          {v.levelReadout}
        </div>

        <Btn
          onClick={v.levelNext}
          css="width:100%;height:54px;border-radius:999px;background:#c67139;color:#fff;font-size:16.5px;font-weight:700;margin-top:12px"
          hover="background:#b2622d"
        >
          {v.levelCta}
        </Btn>
      </div>
    </div>
  );
}
