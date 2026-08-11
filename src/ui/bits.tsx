import type { ReactNode } from 'react';
import { css } from '../lib/css';
import { Btn } from './Btn';
import { ChevronLeft } from './Icon';

/** The 38px round back control that opens most screens. Its label is the only
 *  thing it says, so it comes from the pack like every other piece of copy —
 *  required, so a screen cannot quietly go back to shipping English. */
export const BackBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Btn
    aria-label={label}
    onClick={onClick}
    css="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center"
    hover="background:#eee7db"
  >
    <ChevronLeft size={20} />
  </Btn>
);

/** Onboarding progress. Decorative to look at and, until now, silent — a row
 *  of dots with a label is the difference between "step 2 of 4" and nothing at
 *  all for anybody not looking at the screen. */
export const Dots = ({
  at,
  of = 4,
  width = 22,
  label,
}: {
  at: number;
  of?: number;
  width?: number;
  label?: string;
}) => (
  <div role="img" aria-label={label} style={{ display: 'flex', gap: 6 }}>
    {Array.from({ length: of }, (_, i) => (
      <span
        key={i}
        style={{
          width,
          height: 5,
          borderRadius: 999,
          background: i === at ? '#c67139' : '#dcd3c4',
        }}
      />
    ))}
  </div>
);

/** The name, as a lockup rather than as text.
 *
 *  Pinned left-to-right in every language. Everything around it mirrors in
 *  Arabic and Urdu and should; a wordmark is a drawing of a name, and
 *  "Pantry P" is not the mark. */
export const Wordmark = ({ size = 22 }: { size?: number }) => (
  <div dir="ltr" style={css('display:flex;align-items:center;gap:9px')}>
    <div
      style={css(
        `width:${Math.round(size * 1.45)}px;height:${Math.round(size * 1.45)}px;border-radius:${Math.round(size / 2.9)}px;background:#c67139;display:flex;align-items:center;justify-content:center;font-family:'Caprasimo',serif;color:#fff;font-size:${Math.round(size * 0.86)}px`,
      )}
    >
      P
    </div>
    <span style={css(`font-family:'Caprasimo',serif;font-size:${size}px;letter-spacing:-.3px`)}>Pantry</span>
  </div>
);

/** How far through setup you are, as a bar rather than as four dots.
 *
 *  The dots it replaces were the same width whether you had answered one
 *  question or three — four separate marks that you had to count, on screens
 *  whose entire argument is that you should not have to hold anything in your
 *  head. A bar that is a quarter full is read without being counted.
 *
 *  Still labelled "Step 2 of 4", because that is the sentence, and a screen
 *  reader cannot see how full anything is. */
export const Progress = ({ at, of = 4, label }: { at: number; of?: number; label: string }) => (
  <div
    role="img"
    aria-label={label}
    style={css('height:6px;border-radius:999px;background:#e2d8c6;overflow:hidden')}
  >
    <div
      style={css(
        `height:100%;width:${Math.round(((at + 1) / of) * 100)}%;border-radius:999px;background:#c67139;transition:width .3s ease-out`,
      )}
    />
  </div>
);

/** The frame every setup question is asked inside.
 *
 *  All four of these used to be their own arrangement of the same parts, which
 *  is how they came to disagree: three had a Skip and one did not, the dots
 *  moved, and none of them carried the name that the carousel right before
 *  them puts at the top of all five cards. Setup now looks like one thing
 *  because it is one component.
 *
 *  `art` fills the space between the last answer and the button. That space
 *  existed before and was empty — four hundred pixels of nothing on a phone,
 *  which is the single biggest reason these screens felt like a form. Putting
 *  the character in it costs no layout, because the gap was already there.
 *
 *  `note` is deliberately not a card. Both of the notes it carries used to sit
 *  in a coloured panel behind a circled ⓘ — the house style of every generated
 *  app there has ever been, applied to a sentence that is just the app talking.
 *  It says the same thing quietly now, in the character's own voice. */
export const Ask = ({
  title,
  sub,
  step,
  stepLabel,
  back,
  onBack,
  skip,
  onSkip,
  note,
  art,
  foot,
  children,
}: {
  title: string;
  sub: string;
  /** Null on a screen reached from Settings rather than from setup — there is
   *  no "step 2 of 4" when there is no 1, 3 or 4 coming. */
  step: number | null;
  stepLabel: string;
  back: string;
  onBack: () => void;
  skip?: string;
  onSkip?: () => void;
  note?: string;
  art?: ReactNode;
  foot: ReactNode;
  children: ReactNode;
}) => (
  <div style={css('min-height:100%;display:flex;flex-direction:column;padding:14px 22px 22px')}>
    <div style={css('display:flex;align-items:center;justify-content:space-between;height:38px')}>
      <BackBtn label={back} onClick={onBack} />
      <Wordmark size={19} />
      {/* The spacer is the same width as the control it stands in for, so the
          name stays on the centre line whether or not there is a Skip. */}
      {skip && onSkip ? (
        <Btn
          onClick={onSkip}
          css="height:38px;padding:0 10px;border-radius:999px;font-size:14px;font-weight:600;color:#645c50"
          hover="background:#eee7db"
        >
          {skip}
        </Btn>
      ) : (
        <span style={css('width:38px')} />
      )}
    </div>

    <div className="pg-ask-bar" style={css(step === null ? 'visibility:hidden' : '')}>
      <Progress at={step ?? 0} label={stepLabel} />
    </div>

    {/* The type scale is in the stylesheet rather than in a declaration string
        for one reason: on a short screen it has to come down, and a media
        query cannot select a style attribute. See .pg-ask-h / .pg-ask-p. */}
    <h2 dir="auto" className="pg-ask-h">
      {title}
    </h2>
    <p dir="auto" className="pg-ask-p">
      {sub}
    </p>

    {children}

    {note && (
      <p
        dir="auto"
        style={css(
          'font-size:13px;line-height:1.5;color:#7a7263;text-align:center;margin:16px auto 0;max-width:320px;text-wrap:pretty',
        )}
      >
        {note}
      </p>
    )}

    {/* Everything about this block lives in the stylesheet rather than in a
        declaration string, because the one rule that matters is a height media
        query and a media query cannot select a style attribute. See .pg-art:
        below a certain screen the character stands down, so that it can never
        be the reason the button is off the bottom of it. */}
    {art && <div className="pg-art">{art}</div>}

    <div style={css((art ? '' : 'margin-top:auto;') + 'padding-top:16px')}>{foot}</div>
  </div>
);

/** The small uppercase section label used across every screen. */
export const Kicker = ({
  children,
  color = '#645c50',
  style,
  id,
}: {
  children: ReactNode;
  color?: string;
  style?: React.CSSProperties;
  /** So a chip row can point aria-labelledby at its own heading. */
  id?: string;
}) => (
  <div
    id={id}
    style={{
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '.7px',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A dish photograph, washed back into the warm ground the way the system asks.
 *
 *  A real `<img>` rather than the background-image this used to be, purely so
 *  that `loading="lazy"` exists to write. Browse lists all hundred and fifty-
 *  three dishes at once and a background image is fetched the moment its
 *  element is laid out, whether or not it is anywhere near the screen — which
 *  made opening Browse an eight-megabyte download to look at four cards. The
 *  frame keeps the size, the radius and the wash so nothing about it looks any
 *  different; the picture inside it now waits its turn.
 *
 *  The filter stays on the frame rather than moving to the image, because two
 *  screens pass their own through `style` and a filter on the parent applies
 *  to the child anyway — putting one in both places would apply it twice. */
export const DishPic = ({
  src,
  size,
  radius,
  style,
}: {
  src?: string;
  size?: number;
  radius: number;
  style?: React.CSSProperties;
}) => (
  <span
    style={{
      flex: 'none',
      display: 'block',
      width: size ?? '100%',
      height: size ?? '100%',
      borderRadius: radius,
      background: '#eee7db',
      overflow: 'hidden',
      filter: 'saturate(.82) contrast(.94)',
      ...style,
    }}
  >
    {src && (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    )}
  </span>
);
