import { asset } from '../lib/asset';
import { css } from '../lib/css';
import type { BigPose, Pose } from '../state/usePantry';

/**
 * Pantry — the canister with the spoon.
 *
 * The character is drawn art, not code. Sheets go through
 * `scripts/cut-mascot.py`, which keys out the background and cuts each pose
 * into its own transparent file, and then `scripts/mascot-poses.py`, which
 * scales them all to a common jar width and stands them on a common floor.
 * That second part is what stops the character shrinking and sinking every
 * time it changes pose.
 *
 * There are two sets, because a corner sticker and a full-width illustration
 * want different canvases. The four poses in `mascot/` hold nothing, so their
 * canvas is barely wider than the character. The seven in `mascot/big/` are
 * holding a barbell, a plate of breakfast or a purse, and need half again as
 * much room — put those in a corner at corner size and the character shrinks
 * to nothing to make space for a prop nobody can see.
 *
 * Both are sized by the JAR rather than by the image: `jar` is how wide the
 * character itself should come out, and everything else follows from the
 * canvas it was written on. Sizing by the image instead would make the pose
 * with the widest prop the smallest character on screen.
 */
const SET = {
  small: { dir: 'mascot', w: 290, h: 336 },
  big: { dir: 'mascot/big', w: 523, h: 358 },
} as const;

/** How wide the jar itself is inside each canvas, from mascot-poses.py. */
const JAR = 150;

export function Mascot({ pose = 'walk', jar = 41 }: { pose?: Pose; jar?: number | string }) {
  return <Figure set="small" pose={pose} jar={jar} className="pg-mascot" hop bob />;
}

/** The same character, big, standing in a screen rather than over one. */
export function MascotBig({ pose, jar = 96 }: { pose: BigPose; jar?: number | string }) {
  return <Figure set="big" pose={pose} jar={jar} className="pg-mascot-big" hop bob />;
}

/** The empty-handed set, standing in a screen instead of over one.
 *
 *  The onboarding questions want a reaction, not a prop: "heard you" and
 *  "still waiting" are the only two things being said, and the four poses that
 *  hold nothing say them without a barbell or a purse turning up to be
 *  explained. It is the corner character at four times the size, which is
 *  fine — these are drawings, not sprites, and `jar` normalises them anyway. */
export function MascotMid({ pose, jar = 76 }: { pose: Pose; jar?: number | string }) {
  return <Figure set="small" pose={pose} jar={jar} hop bob />;
}

function Figure({
  set,
  pose,
  jar,
  className,
  hop,
  bob,
}: {
  set: keyof typeof SET;
  pose: string;
  /** A number of pixels, or any CSS length — `clamp(46px, 11vh, 88px)` on the
   *  setup screens, where the room the character has is whatever is left after
   *  the question, and that is a different amount on every phone. Both come out
   *  of the same arithmetic; a length goes through calc() instead of through
   *  Math.round, and the ratio is a plain number either way. */
  jar: number | string;
  className?: string;
  hop?: boolean;
  bob?: boolean;
}) {
  const { dir, w, h } = SET[set];
  const span = (side: number) =>
    typeof jar === 'number'
      ? Math.round((jar * side) / JAR) + 'px'
      : `calc(${jar} * ${(side / JAR).toFixed(4)})`;
  const width = span(w);
  const height = span(h);
  return (
    <div
      className={className}
      aria-hidden="true"
      style={css(
        `width:${width};height:${height}` +
          (hop ? ';animation:pgHop .52s cubic-bezier(.2,.9,.3,1.4) both' : ''),
      )}
    >
      {/* Two nested elements because the hop and the bob both want `transform`.
          Nested, the hop can be short and springy while the bob stays slow. */}
      <div
        style={css(
          'width:100%;height:100%' +
            (bob ? ';animation:pgBob 3.4s ease-in-out infinite;transform-origin:50% 96%' : ''),
        )}
      >
        <img
          src={asset(`${dir}/${pose}.webp`)}
          alt=""
          decoding="async"
          /* The attributes are a hint about the aspect ratio, so they are the
             drawing's own numbers rather than the rendered size — a calc() is
             not a number and setting one here would be dropped as invalid. */
          width={w}
          height={h}
          style={css('width:100%;height:100%;display:block;object-fit:contain')}
        />
      </div>
    </div>
  );
}
