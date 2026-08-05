#!/usr/bin/env python3
"""Turn cut-out poses into the files the app ships.

`cut-mascot.py` gets a drawing down to a transparent PNG at whatever size the
generator happened to draw it. This does the rest: scales every pose so the
character is the same size in all of them, stands them on a common floor line,
lines their bodies up over the same point, and writes WebP with alpha.

Getting the scale right is the whole job, and it is harder than it sounds.

Scaling to a fixed IMAGE height is wrong: a pose holding a spoon over its head
is a taller picture than one standing still, so the character comes out smaller
in it. In a fixed corner of the screen that reads as the character shrinking
and sinking every time it changes pose.

Scaling to the height of the BODY is better but still breaks, because half
these drawings come with a prop. A barbell held overhead is part of the drawing
and it is enormous; measure the body by "the rows where the drawing is widest"
and you measure the barbell.

So the scale comes from the character's WIDTH: specifically the most common
width of a solid unbroken run of ink across a row. The jar is a cylinder, so
several hundred rows share one width, and nothing else in any of these drawings
occupies enough rows to outvote it — a plate is thirty rows, a barbell is
twenty. An outstretched arm does beat it, because an arm is joined to the jar
and the run measures both together, so poses that point come out too small.
Those get a nudge on the command line, which is the honest way to do it: this
is thirteen files made once, and looking at them is faster and more reliable
than another heuristic.

    python3 scripts/mascot-poses.py cut/ public/mascot walk=sheet-1 point=point-1*0.72

`name=piece` takes `cut/piece.png` and writes `name.webp`. `*0.72` multiplies
that pose's scale. Anything not named is skipped, which is how a banner cut off
a celebration drawing stays out of the build.
"""

import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# How wide the jar itself comes out in the file. Everything else — how tall the
# canvas ends up, how much room a barbell needs — follows from this. Three
# times what it occupies on screen, so it stays sharp on a phone.
JAR_W = 150
# Row-width histogram bucket, in source pixels before scaling.
BUCKET = 10


def trim(im: Image.Image) -> Image.Image:
    box = im.getbbox()
    return im.crop(box) if box else im


def widest_runs(alpha: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """For each row: the longest unbroken run of ink, and where its middle is."""
    width = np.zeros(alpha.shape[0], dtype=int)
    middle = np.zeros(alpha.shape[0], dtype=float)
    for i, row in enumerate(alpha):
        edges = np.nonzero(np.diff(np.concatenate(([0], row.view(np.int8), [0]))))[0]
        if not len(edges):
            continue
        starts, stops = edges[0::2], edges[1::2]
        k = int(np.argmax(stops - starts))
        width[i] = int(stops[k] - starts[k])
        middle[i] = (starts[k] + stops[k]) / 2
    return width, middle


def jar(alpha: np.ndarray) -> tuple[float, float]:
    """The character's width, and the point to line it up on.

    Both come from the rows whose longest run is closest to the commonest one,
    because those are the rows where the jar is standing on its own with
    nothing attached. Taking the middle of the whole drawing instead would slide
    the character sideways every time it picked something up — which it did,
    and which is why the pointing pose was over to the left of all the others.
    """
    width, middle = widest_runs(alpha)
    real = width[width > 20]
    mode = int(np.argmax(np.bincount(real // BUCKET))) * BUCKET + BUCKET // 2
    clean = np.abs(width - mode) <= BUCKET
    # The commonest middle, not the average one. A few rows where the jar and
    # an outstretched arm happen to measure the same width as the jar alone
    # still creep into `clean`, and they all lean the same way, so a mean or a
    # median of them drags the character off to one side. The mode cannot be
    # dragged: the hundreds of rows through the bare jar all agree.
    mids = middle[clean].astype(int)
    return float(mode), float(np.argmax(np.bincount(mids // BUCKET)) * BUCKET + BUCKET / 2)


def main() -> int:
    if len(sys.argv) < 4:
        print(__doc__)
        return 2
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)

    poses = {}
    for arg in sys.argv[3:]:
        name, _, spec = arg.partition('=')
        piece, nudge = re.match(r'([^*]+)(?:\*([\d.]+))?$', spec).groups()
        path = src / f'{piece}.png'
        if not path.exists():
            print(f'no such piece: {path}', file=sys.stderr)
            return 1
        poses[name] = (trim(Image.open(path).convert('RGBA')), float(nudge or 1))

    # Measure everything first: the canvas has to be big enough for the pose
    # that needs the most room on each side of the character, and every pose
    # gets the same canvas so the box on screen never moves.
    plan = {}
    for name, (im, nudge) in poses.items():
        width, middle = jar(np.asarray(im)[:, :, 3] > 0)
        scale = (JAR_W / width) * nudge
        plan[name] = (im, scale, middle * scale, im.height * scale)

    left = max(cx for _, _, cx, _ in plan.values())
    right = max(im.width * s - cx for im, s, cx, _ in plan.values())
    canvas_w = int(round(left + right))
    canvas_h = int(round(max(h for *_, h in plan.values())))

    for name, (im, scale, cx, h) in plan.items():
        w = max(1, int(round(im.width * scale)))
        scaled = im.resize((w, max(1, int(round(h)))), Image.LANCZOS)
        canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
        # Feet on the floor, jar over the same point, whatever it is holding.
        canvas.alpha_composite(scaled, (int(round(left - cx)), canvas_h - scaled.height))
        path = out / f'{name}.webp'
        canvas.save(path, 'WEBP', quality=90, method=6)
        print(f'{path}  {canvas_w}×{canvas_h}  {path.stat().st_size // 1024} kB')

    print(f'\n{len(plan)} poses, {canvas_w}×{canvas_h} each.')
    print(f'Aspect ratio {canvas_w / canvas_h:.4f} — the component needs this.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
