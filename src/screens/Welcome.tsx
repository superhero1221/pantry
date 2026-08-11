import { useRef } from 'react';
import { css } from '../lib/css';
import { Btn } from '../ui/Btn';
import { BackBtn, Wordmark } from '../ui/bits';
import { MascotBig } from '../ui/Mascot';
import type { Pantry } from '../state/usePantry';

const BLOB = 'position:absolute;border-radius:50%';

/**
 * The front door, as five cards you swipe rather than one page you read.
 *
 * What was here before was a landing page: a wordmark, a tagline, three
 * bullets with coloured dots and two buttons, all arriving at once. It read
 * like something to evaluate. The four screens immediately after it ask you
 * questions one at a time, so the opening was also the only part of setup
 * that worked differently from the rest of setup.
 *
 * The same claims now arrive one per card, each with a headline instead of a
 * bullet and the character acting it out. Nothing has been added to read —
 * the three bullets became three of the five headlines — but the pace is
 * something a thumb sets rather than a scroll.
 *
 * The logo stays put across all five and the buttons stay put underneath, so
 * the only thing that moves is the card. That is the whole trick: the frame
 * is the app, the card is the pitch, and the frame never blinks.
 */
export function Welcome({ v }: { v: Pantry }) {
  const card = v.slides[v.slide];

  /* Where the thumb went down, and whether it has since travelled far enough
     down the screen to be a scroll rather than a swipe. A ref, not state: it
     changes on every touchmove and none of those changes are worth a render. */
  const swipe = useRef<{ x: number; y: number; live: boolean } | null>(null);

  const onEnd = (x: number) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from || !from.live) return;
    const dx = x - from.x;
    /* 44px, roughly a fingertip. Below that it is a tap that wobbled, and
       stealing a tap from the dots underneath is worse than missing a swipe. */
    if (Math.abs(dx) < 44) return;
    /* Right-to-left languages read the gesture the other way round: in Arabic
       and Urdu, "forward" is a swipe to the right. Anything else would move
       the card the opposite way from the dots that track it. */
    const fwd = v.dir === 'rtl' ? dx > 0 : dx < 0;
    if (fwd) v.slideNext();
    else v.slidePrev();
  };

  return (
    <div
      style={css(
        'min-height:100%;display:flex;flex-direction:column;padding:14px 26px 26px;overflow:hidden',
      )}
    >
      <div style={css('display:flex;align-items:center;justify-content:space-between;height:38px')}>
        {/* Back only once there is somewhere back to go, and a spacer holding
            its width the rest of the time so the logo does not jump left on
            the first card and right on the second. */}
        {v.slide > 0 ? <BackBtn label={v.t.back} onClick={v.slidePrev} /> : <span style={css('width:38px')} />}
        {/* The same lockup, at the same place, as the four question screens
            after this one — that continuity is most of why the carousel reads
            as the app opening rather than as an advert in front of it. */}
        <Wordmark size={22} />
        <Btn
          onClick={v.skipOnboarding}
          css="height:38px;padding:0 10px;border-radius:999px;font-size:14px;font-weight:600;color:#645c50"
          hover="background:#eee7db"
        >
          {v.t.tierSkip}
        </Btn>
      </div>

      <div
        onTouchStart={(e) => {
          const t = e.touches[0];
          swipe.current = { x: t.clientX, y: t.clientY, live: true };
        }}
        onTouchMove={(e) => {
          const s = swipe.current;
          if (!s || !s.live) return;
          const t = e.touches[0];
          /* A vertical drag cancels the swipe for good rather than being
             ignored on the frame it happens: without this, a scroll that
             drifts sideways at the end lands as a page turn. */
          if (Math.abs(t.clientY - s.y) > Math.abs(t.clientX - s.x)) s.live = false;
        }}
        onTouchEnd={(e) => onEnd(e.changedTouches[0]?.clientX ?? 0)}
        style={css(
          'flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8px 0;touch-action:pan-y',
        )}
      >
        <div style={css(BLOB + ';top:2%;inset-inline-end:-58px;width:190px;height:190px;background:#e1eecc;opacity:.7')} />
        <div style={css(BLOB + ';bottom:8%;inset-inline-start:-52px;width:120px;height:120px;background:#ffc6a5;opacity:.7')} />

        {/* Keyed on the card, so React replaces the subtree instead of
            editing it, and the fade and the mascot's hop both restart. That
            keying is the animation — there is no transition anywhere. */}
        <div
          key={card.key}
          className="pg-slide"
          style={css('position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%')}
        >
          <h1
            dir="auto"
            style={css(
              "font-family:'Caprasimo',serif;font-weight:400;font-size:40px;line-height:1.02;margin:0;letter-spacing:-.5px;text-wrap:balance;max-width:320px",
            )}
          >
            {card.h}
          </h1>
          <MascotBig key={card.pose} pose={card.pose} jar="clamp(70px, 15vh, 104px)" />
          <p
            dir="auto"
            style={css('font-size:16px;line-height:1.5;margin:0;max-width:330px;color:#474238;text-wrap:pretty')}
          >
            {card.s}
          </p>
        </div>
      </div>

      {/* Tappable, because a row of dots on a carousel is a control whether or
          not it was drawn as one, and because a swipe is unavailable to
          anybody on a mouse or a keyboard. */}
      <div role="tablist" aria-label={v.slideLabel} style={css('display:flex;gap:7px;justify-content:center;padding:14px 0 16px')}>
        {v.slides.map((s, i) => (
          <Btn
            key={s.key}
            role="tab"
            aria-selected={i === v.slide}
            aria-label={s.h}
            onClick={() => v.slideTo(i)}
            css="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center"
            hover="background:#eee7db"
          >
            <span
              style={css(
                `width:${i === v.slide ? 26 : 8}px;height:8px;border-radius:999px;background:${i === v.slide ? '#c67139' : '#dcd3c4'}`,
              )}
            />
          </Btn>
        ))}
      </div>

      <Btn
        onClick={v.slideNext}
        css="width:100%;height:58px;border-radius:999px;background:#c67139;color:#fff;font-size:19px;font-weight:700;box-shadow:0 3px 10px rgba(46,43,37,.16)"
        hover="background:#b2622d"
      >
        {v.slideCta}
      </Btn>

      {/* The claim, on the front door.
          It was only at the foot of Settings, four taps in and behind
          onboarding — so the one visitor who never saw it was the one
          arriving at pantryglobe.com to look at how this was built. This is
          the first screen the site serves anybody, and the only one a person
          evaluating whether to copy it is guaranteed to reach.
          Small and last: it is a notice, not an argument, and nobody came
          here to read it. */}
      <div dir="auto" style={css('text-align:center;font-size:11.5px;color:#645c50;margin-top:12px')}>
        {v.xt('ownCopy')}
      </div>
    </div>
  );
}
