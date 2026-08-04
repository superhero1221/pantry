#!/usr/bin/env python3
"""Cut a character sheet into one transparent PNG per pose.

The sheets come back from an image generator as a single flat picture: several
poses laid out on a cream field, no transparency, no alpha channel, sometimes a
speech bubble or a bit of sparkle thrown in. This turns that into the files the
app can actually use.

Two things make it work rather than approximately work.

The background is removed by flood filling inward from the edges, not by
deleting every pixel that happens to be near the background colour. That
distinction is the whole job here: the character's body is cream too, and a
colour test would punch a hole straight through the middle of the jar. A flood
fill cannot get inside, because the character is drawn with a closed dark
outline all the way round.

The poses are then separated by finding connected blobs of ink and clustering
the ones that sit close together, rather than by slicing the sheet on empty
rows and columns. Empty rows and columns is the obvious way and it does not
work: sheets are never on a grid, one pose is always kicking a leg further out
than the others, and a single stray sparkle floating between two rows welds the
whole sheet into one piece. Clustering also puts a character back together with
the things that belong to it — its cast shadow, the little speed ticks behind a
swinging arm — which are separate blobs of ink but not separate drawings.

    python3 scripts/cut-mascot.py sheet.png public/mascot --prefix pantry

Anything smaller than a fiftieth of the sheet is dropped, which is what gets
rid of stray sparkles and motion ticks. Speech bubbles are large and will come
out as their own file; look at what lands in the folder and delete what you did
not want.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# How far a pixel may sit from the background colour and still count as
# background. Generous, because these sheets are lightly textured rather than
# flat, and the fill cannot escape the outline however generous it is.
TOLERANCE = 34
# Padding kept around each pose, so a drop shadow is not clipped to the ankle.
MARGIN = 6
# Anything with fewer pixels than this share of the sheet is a sparkle.
MIN_SHARE = 1 / 2500
# A blob this big relative to the biggest one on the sheet is a drawing in its
# own right rather than a shadow or a sparkle. Poses on a character sheet are
# all roughly one size; the debris around them is tiny.
FIGURE_SHARE = 0.2
# How far a small blob may sit from a figure and still belong to it.
CLUSTER = 0.03


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """True where a flood fill from the edges can reach."""
    h, w, _ = rgb.shape
    # The corners are background in every sheet anyone has ever generated.
    seed = np.stack([rgb[0, 0], rgb[0, w - 1], rgb[h - 1, 0], rgb[h - 1, w - 1]])
    near = (np.abs(rgb.astype(np.int16) - seed.mean(0).astype(np.int16)).max(2) <= TOLERANCE)

    # Iterative dilation of the reachable set, intersected with `near`. Slower
    # than a real flood fill and enormously shorter; a sheet is a few million
    # pixels and this settles in well under a second.
    reach = np.zeros_like(near)
    reach[0, :] = near[0, :]
    reach[-1, :] = near[-1, :]
    reach[:, 0] = near[:, 0]
    reach[:, -1] = near[:, -1]
    while True:
        grown = reach.copy()
        grown[1:, :] |= reach[:-1, :]
        grown[:-1, :] |= reach[1:, :]
        grown[:, 1:] |= reach[:, :-1]
        grown[:, :-1] |= reach[:, 1:]
        grown &= near
        if grown.sum() == reach.sum():
            return reach
        reach = grown


def distance(a, b) -> float:
    """Gap between two boxes, zero if they touch or overlap."""
    ay0, ay1, ax0, ax1 = a
    by0, by1, bx0, bx1 = b
    dy = max(by0 - ay1, ay0 - by1, 0)
    dx = max(bx0 - ax1, ax0 - bx1, 0)
    return (dy * dy + dx * dx) ** 0.5


def group_by_figure(boxes, sizes, gap):
    """Assign every blob to one of the drawings.

    Clustering everything by proximity is the obvious approach and it welds the
    whole sheet into one piece, because a raised spoon in one pose reaches over
    the top of the pose below it: their bounding boxes overlap even though the
    drawings do not touch. So the big blobs are taken as the figures — a
    character is an order of magnitude larger than its own shadow — and the
    small ones are handed to whichever figure they are nearest, which is how a
    cast shadow and a couple of speed ticks end up in the right file.
    """
    biggest = max(sizes)
    figures = [i for i, s in enumerate(sizes) if s >= biggest * FIGURE_SHARE]
    groups = {i: [i] for i in figures}
    for i, size in enumerate(sizes):
        if i in groups:
            continue
        near = min(figures, key=lambda f: distance(boxes[i], boxes[f]))
        if distance(boxes[i], boxes[near]) <= gap:
            groups[near].append(i)
    return list(groups.values())


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    sheet, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    prefix = sys.argv[sys.argv.index('--prefix') + 1] if '--prefix' in sys.argv else 'pose'

    img = Image.open(sheet).convert('RGB')
    rgb = np.asarray(img)
    ink = ~background_mask(rgb)

    rgba = np.dstack([rgb, np.where(ink, 255, 0).astype(np.uint8)])
    outdir.mkdir(parents=True, exist_ok=True)

    labels, count = ndimage.label(ink)
    boxes = [(s[0].start, s[0].stop, s[1].start, s[1].stop) for s in ndimage.find_objects(labels)]
    sizes = [int(v) for v in ndimage.sum(ink, labels, range(1, count + 1))]

    floor = ink.size * MIN_SHARE
    gap = ink.shape[1] * CLUSTER
    cut, dropped = 0, 0
    pieces = []
    for group in group_by_figure(boxes, sizes, gap):
        if sum(sizes[i] for i in group) < floor:
            dropped += 1
            continue
        y0 = min(boxes[i][0] for i in group)
        y1 = max(boxes[i][1] for i in group)
        x0 = min(boxes[i][2] for i in group)
        x1 = max(boxes[i][3] for i in group)
        pieces.append((x0, y0, x1, y1))

    # Left to right, top to bottom, so the numbering matches how the sheet reads.
    for x0, y0, x1, y1 in sorted(pieces, key=lambda p: (p[1] // (ink.shape[0] // 4), p[0])):
        y0, x0 = max(0, y0 - MARGIN), max(0, x0 - MARGIN)
        y1, x1 = min(ink.shape[0], y1 + MARGIN), min(ink.shape[1], x1 + MARGIN)
        cut += 1
        path = outdir / f'{prefix}-{cut}.png'
        Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA').save(path)
        print(f'{path}  {x1 - x0}×{y1 - y0}')

    print(f'\n{cut} pieces, {dropped} specks ignored.')
    print('Look at them, rename the ones you want, bin the rest.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
