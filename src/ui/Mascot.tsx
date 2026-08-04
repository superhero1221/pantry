import { css } from '../lib/css';

/**
 * Pantry — the canister with the spoon.
 *
 * Drawn to the character sheet: a cream storage jar with a brown lid and knob,
 * a brass plate on its belly, rubber-hose arms in white gloves, brown shoes,
 * and a wooden spoon held up. 1930s cartoon idiom throughout — heavy uniform
 * outlines, limbs with no elbows, everything built out of circles — which is
 * also the one drawing style that survives being shrunk to the size of a
 * thumbnail. It is an original character in a genre that is public property.
 *
 * The proportions are 72 × 100 and it is drawn for about seventy pixels tall,
 * which is where the plate stops being letters and becomes a brass rectangle.
 * Everything in here was checked at that size; nothing is in it that only
 * works blown up.
 *
 * Two nested elements because two animations both want the transform property:
 * the outer one hops the character in when a screen arrives, the inner one
 * breathes. Separate rather than one composite keyframe, so the hop can be
 * short and springy while the bob stays long and slow.
 */
export function Mascot({ height = 62 }: { height?: number }) {
  return (
    <div
      className="pg-mascot"
      aria-hidden="true"
      style={css(
        `width:${Math.round(height * 0.72)}px;height:${height}px;animation:pgHop .52s cubic-bezier(.2,.9,.3,1.4) both`,
      )}
    >
      <div style={css('width:100%;height:100%;animation:pgBob 3.4s ease-in-out infinite;transform-origin:50% 94%')}>
        <svg viewBox="0 0 72 100" width="100%" height="100%" role="presentation" focusable="false">
          {/* Grounding. Without it the character floats in the corner like a
              sticker; with it, the bob above reads as weight leaving the floor. */}
          <ellipse cx="36" cy="93.5" rx="21" ry="3" fill="#2e2b25" opacity=".13" />

          <g stroke="#2e2b25" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Legs and shoes first, so the body sits over the top of the hose
                and the join needs no drawing. */}
            <path d="M28 72 L27 85" fill="none" strokeWidth="5.4" />
            <path d="M45 72 L46 85" fill="none" strokeWidth="5.4" />
            <path d="M27 85 C21 85 16.5 86.5 16.5 89 C16.5 91.6 20 92.5 25 92.5 C30 92.5 32 91 32 88.4 C32 86 30 85 27 85 Z" fill="#8a5a34" />
            <path d="M46 85 C52 85 56.5 86.5 56.5 89 C56.5 91.6 53 92.5 48 92.5 C43 92.5 41 91 41 88.4 C41 86 43 85 46 85 Z" fill="#8a5a34" />

            {/* The raised arm, and the spoon in it. Shaft drawn twice — dark and
                fat underneath, wood-coloured and thin over it — which is
                cheaper than an outlined shape and keeps the join to the bowl
                seamless. Both go behind the glove, which lands on top. */}
            <path d="M18 43 C11 40 8 33 10.5 26" fill="none" strokeWidth="5" />
            <path d="M10.5 26 L5.6 8.5" fill="none" strokeWidth="5.6" />
            <path d="M10.5 26 L5.6 8.5" fill="none" strokeWidth="2.8" stroke="#b0784a" />
            <ellipse cx="4.9" cy="6.2" rx="4" ry="5.2" fill="#9a6738" transform="rotate(-14 4.9 6.2)" />

            {/* The other arm, out and down with the fist closed. */}
            <path d="M54 47 C62 48 65 53 63.5 58" fill="none" strokeWidth="5" />

            {/* The jar. A straight-sided canister rather than a pot, with the
                light down one side the way a glazed thing catches it. */}
            <rect x="16" y="26" width="40" height="48" rx="8" fill="#e9dcbf" />
            <rect x="20.5" y="32" width="4.6" height="34" rx="2.3" fill="#f8f2e4" stroke="none" />

            {/* Lid: the seat first, then the dome on top of it, then the knob,
                so each overlaps the last and no outline is left crossing. */}
            <rect x="12.5" y="20" width="47" height="7.5" rx="3.75" fill="#a06a3c" />
            <path d="M15 20 C15 12.5 24 9 36 9 C48 9 57 12.5 57 20 Z" fill="#b0784a" />
            <path d="M32 9 C32 6 33.6 4.5 36 4.5 C38.4 4.5 40 6 40 9 Z" fill="#8a5a34" />
            <ellipse cx="36" cy="4.4" rx="4.6" ry="2.6" fill="#8a5a34" />

            {/* Gloves last of everything, so both hands read as in front. */}
            <circle cx="9.6" cy="24" r="5" fill="#fff9ec" />
            <circle cx="64" cy="59.5" r="5" fill="#fff9ec" />
          </g>

          {/* The face. Eyes high on the jar, mouth below them, and the brass
              plate under that — the order the character sheet has it in. */}
          <g>
            <g stroke="#2e2b25" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M23.5 32.5 C25.5 30 29.5 30 31.5 32" />
              <path d="M40.5 32 C42.5 30 46.5 30 48.5 32.5" />
            </g>
            <ellipse cx="28.5" cy="41" rx="5.4" ry="6.4" fill="#fff9ec" stroke="#2e2b25" strokeWidth="2.2" />
            <ellipse cx="43.5" cy="41" rx="5.4" ry="6.4" fill="#fff9ec" stroke="#2e2b25" strokeWidth="2.2" />
            <ellipse cx="29.6" cy="42.2" rx="2.7" ry="3.3" fill="#2e2b25" />
            <ellipse cx="44.6" cy="42.2" rx="2.7" ry="3.3" fill="#2e2b25" />
            <circle cx="28.4" cy="40.4" r="1" fill="#fff9ec" />
            <circle cx="43.4" cy="40.4" r="1" fill="#fff9ec" />

            {/* An open smile: the dark of the mouth, the tongue sitting in it,
                then the teeth over the top lip. */}
            <path
              d="M28.5 51 C31 58.5 41 58.5 43.5 51 Z"
              fill="#5a3320"
              stroke="#2e2b25"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <ellipse cx="36" cy="56" rx="3.4" ry="2" fill="#d9614a" />
            <path d="M29.4 51.4 C32 53.6 40 53.6 42.6 51.4 Z" fill="#fff9ec" />
          </g>

          {/* The plate. Real text rather than a drawing of text, so it is sharp
              at whatever size this ends up and readable to anyone who zooms. */}
          <g>
            <rect
              x="21"
              y="60"
              width="30"
              height="10"
              rx="2"
              fill="#d9a441"
              stroke="#2e2b25"
              strokeWidth="1.8"
            />
            <text
              x="36"
              y="67.4"
              textAnchor="middle"
              fontFamily="'Figtree', system-ui, sans-serif"
              fontSize="6.4"
              fontWeight="800"
              letterSpacing=".5"
              fill="#6b4420"
            >
              PANTRY
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
