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

export function Mascot({ pose = 'walk', jar = 41 }: { pose?: Pose; jar?: number }) {
  return <Figure set="small" pose={pose} jar={jar} className="pg-mascot" hop bob />;
}

/** The same character, big, standing in a screen rather than over one. */
export function MascotBig({ pose, jar = 96 }: { pose: BigPose; jar?: number }) {
  return <Figure set="big" pose={pose} jar={jar} className="pg-mascot-big" hop bob />;
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
  jar: number;
  className: string;
  hop?: boolean;
  bob?: boolean;
}) {
  const { dir, w, h } = SET[set];
  const width = Math.round((jar * w) / JAR);
  const height = Math.round((jar * h) / JAR);
  return (
    <div
      className={className}
      aria-hidden="true"
      style={css(
        `width:${width}px;height:${height}px` +
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
          width={width}
          height={height}
          style={css('width:100%;height:100%;display:block;object-fit:contain')}
        />
      </div>
    </div>
  );
}
