#!/usr/bin/env python3
"""Turn cut-out poses into the files the app ships.

`cut-mascot.py` gets a character sheet down to one transparent PNG per pose at
whatever size the generator drew it. This does the rest: trims each to its own
ink, scales it so every pose stands the same height on the same floor, and
writes WebP with an alpha channel.

The floor is the part worth explaining. Scaling each pose to a fixed image
height would make a character with a raised spoon shorter than one without,
because the spoon eats into the height — and since the corner of the screen is
a fixed box, the shorter one would appear to sink. So the scale is taken from
the height of the BODY, found by ignoring the columns a raised arm occupies,
and every pose is then padded to a common canvas with its feet on the same
line. Flick between them and the character changes pose rather than jumping.

    python3 scripts/mascot-poses.py cut/ public/mascot stand=1 point=2 wink=3

The arguments after the folders are name=N pairs, where N is the number
`cut-mascot.py` gave the piece. Anything not named is skipped, which is how the
speech bubble and the fifth pose you did not want stay out of the build.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

# How tall the character's own body — lid to shoes, ignoring anything held up
# — should come out in the file. Three times the 60 CSS pixels it stands at on
# screen, so it stays sharp on a phone. Bigger is weight nobody sees.
BODY_H = 180
# A row this wide, relative to the widest row in the drawing, is part of the
# body rather than an arm reaching up. A jar with a lid on it is several times
# wider than the spoon above it, so the line is not delicate.
BODY_ROW = 0.45


def trim(im: Image.Image) -> Image.Image:
    box = im.getbbox()
    return im.crop(box) if box else im


def body_rows(alpha: np.ndarray) -> tuple[int, int]:
    """Top and bottom of the pose's body, ignoring anything held up.

    The body is where the drawing is widest — a jar with a lid on it is several
    times wider than the arm above it. Rows narrower than a fraction of the
    widest row are read as raised spoon rather than character. This measures
    only; nothing is cropped away, and the spoon still appears in the file.
    """
    widths = np.array([np.count_nonzero(row) for row in alpha])
    solid = np.nonzero(widths >= widths.max() * BODY_ROW)[0]
    return int(solid.min()), int(solid.max()) + 1


def main() -> int:
    if len(sys.argv) < 4:
        print(__doc__)
        return 2
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    wanted = dict(pair.split('=') for pair in sys.argv[3:])
    out.mkdir(parents=True, exist_ok=True)

    poses = {}
    for name, n in wanted.items():
        found = sorted(src.glob(f'*-{n}.png'))
        if not found:
            print(f'no piece numbered {n}', file=sys.stderr)
            return 1
        poses[name] = trim(Image.open(found[0]).convert('RGBA'))

    # One scale for every pose, taken from the tallest body, so they stay a
    # family. Scaling each to a fixed image height instead would make the pose
    # holding a spoon up shorter than the one that is not, and in a fixed
    # corner of the screen a shorter character reads as a sinking one.
    bodies = {name: body_rows(np.asarray(im)[:, :, 3]) for name, im in poses.items()}
    scale = BODY_H / max(bottom - top for top, bottom in bodies.values())

    scaled, above, below = {}, {}, {}
    for name, im in poses.items():
        w = max(1, int(round(im.width * scale)))
        h = max(1, int(round(im.height * scale)))
        scaled[name] = im.resize((w, h), Image.LANCZOS)
        # Where the feet are, and how much drawing hangs below them.
        feet = bodies[name][1] * scale
        above[name] = feet
        below[name] = h - feet

    # The canvas is whatever it takes to hold the tallest pose above the floor
    # line and the deepest shadow below it, so no pose is ever clipped.
    floor = max(above.values())
    canvas_h = int(round(floor + max(below.values())))
    canvas_w = max(im.width for im in scaled.values())

    for name, im in scaled.items():
        canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((canvas_w - im.width) // 2, int(round(floor - above[name]))))
        path = out / f'{name}.webp'
        canvas.save(path, 'WEBP', quality=90, method=6)
        print(f'{path}  {canvas_w}×{canvas_h}  {path.stat().st_size // 1024} kB')

    print(f'\n{len(scaled)} poses, {canvas_w}×{canvas_h} each, all standing on the same floor.')
    print(f'Aspect ratio {canvas_w / canvas_h:.4f} — the component needs this.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
