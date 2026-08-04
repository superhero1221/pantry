import { asset } from '../lib/asset';
import { css } from '../lib/css';
import type { Pose } from '../state/usePantry';

/**
 * Pantry — the canister with the spoon.
 *
 * The character is drawn art, not code. A generated sheet goes through
 * `scripts/cut-mascot.py`, which keys out the background by flooding in from
 * the edges and cuts each pose into its own transparent file, and then through
 * `scripts/mascot-poses.py`, which scales them all by the height of the BODY
 * rather than of the image and stands them on a common floor line. That second
 * part is the one that matters here: a pose holding a spoon up is a taller
 * picture than one that is not, and if you scale by picture height, the corner
 * of the screen shows a character that shrinks and sinks every time the pose
 * changes. Scaled by body and floored together, it changes pose instead.
 *
 * Which is why the aspect ratio below is a constant rather than left to the
 * image: every pose is written to the same canvas, so the box never moves and
 * nothing reflows when one file arrives before another.
 *
 * Two nested elements because two animations both want the transform property:
 * the outer one hops the character in when a screen arrives, the inner one
 * breathes. Separate rather than one composite keyframe, so the hop can be
 * short and springy while the bob stays long and slow.
 */
const ASPECT = 189 / 251;

export function Mascot({ pose = 'walk', height = 68 }: { pose?: Pose; height?: number }) {
  return (
    <div
      className="pg-mascot"
      aria-hidden="true"
      style={css(
        `width:${Math.round(height * ASPECT)}px;height:${height}px;animation:pgHop .52s cubic-bezier(.2,.9,.3,1.4) both`,
      )}
    >
      <div style={css('width:100%;height:100%;animation:pgBob 3.4s ease-in-out infinite;transform-origin:50% 96%')}>
        <img
          src={asset(`mascot/${pose}.webp`)}
          alt=""
          decoding="async"
          width={Math.round(height * ASPECT)}
          height={height}
          style={css('width:100%;height:100%;display:block;object-fit:contain')}
        />
      </div>
    </div>
  );
}
