#!/usr/bin/env python3
"""
Find the transparent "screen cutout" region inside a device-frame PNG
(an Apple bezel asset or Figma UI Kit component export with alpha intact).

Usage:
    python3 find_cutout.py <frame.png>
    python3 find_cutout.py <frame.png> --scale 3   # convert result to Figma design-space units

IMPORTANT: naive "bounding box of every alpha==0 pixel" does NOT work on
Apple's official bezel PNGs -- the image canvas also has transparent
corners *outside* the rounded device silhouette (the corner triangles of
the rectangular canvas beyond the device's own rounded edge). Those get
included in a naive bbox scan and blow it out to nearly the full canvas
size. This script flood-fills from the image's center pixel instead,
which is reliably inside the screen on every device asset seen so far,
and returns the bounding box of only that connected transparent region.

Only works on a RAW asset with real alpha -- not a flattened/composited
render (Figma's `get_screenshot`, or any PNG re-saved without alpha)
which bakes transparency onto a solid background and loses the cutout.
"""
import sys
import argparse
from collections import deque
from PIL import Image


def find_screen_region(im, downsample=6):
    """Flood-fill from center at reduced resolution (fast in pure Python,
    no numpy/scipy dependency), then scale the bounding box back up."""
    W, H = im.size
    factor = max(1, downsample)
    small = im.resize((max(1, W // factor), max(1, H // factor)), Image.NEAREST)
    w, h = small.size
    px = small.load()

    cx, cy = w // 2, h // 2
    if px[cx, cy][3] != 0:
        raise ValueError(
            f"Center pixel ({cx},{cy}) is not transparent (alpha={px[cx,cy][3]}). "
            "This image may not have a real screen cutout, or the device isn't "
            "centered in the canvas -- inspect manually."
        )

    visited = [[False] * w for _ in range(h)]
    q = deque([(cx, cy)])
    visited[cy][cx] = True
    min_x = max_x = cx
    min_y = max_y = cy
    count = 0
    while q:
        x, y = q.popleft()
        count += 1
        if x < min_x: min_x = x
        if x > max_x: max_x = x
        if y < min_y: min_y = y
        if y > max_y: max_y = y
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and px[nx, ny][3] == 0:
                visited[ny][nx] = True
                q.append((nx, ny))

    return {
        "downsample_factor": factor,
        "region_pixel_count_at_downsample": count,
        "x": min_x * factor,
        "y": min_y * factor,
        "w": (max_x - min_x) * factor,
        "h": (max_y - min_y) * factor,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image")
    parser.add_argument("--scale", type=float, default=1.0,
                         help="Export/DPI scale the PNG was captured at (e.g. 3 for a Figma 3x "
                              "download). Divide pixel coords by this to get Figma design-space units. "
                              "Not needed for Apple's direct-download bezel PNGs -- those are used at "
                              "native pixel resolution.")
    parser.add_argument("--downsample", type=int, default=6,
                         help="Downsample factor before flood-fill (speed vs. precision tradeoff). "
                              "Default 6 is accurate to within a few px on a ~1350x2760 source.")
    args = parser.parse_args()

    im = Image.open(args.image).convert("RGBA")
    w, h = im.size
    region = find_screen_region(im, args.downsample)

    print(f"Image size:      {w} x {h}")
    print(f"Screen cutout:   x={region['x']} y={region['y']} "
          f"w={region['w']} h={region['h']}")
    if args.scale != 1.0:
        s = args.scale
        print(f"In design units (/{s}): "
              f"x={region['x']/s:.1f} y={region['y']/s:.1f} "
              f"w={region['w']/s:.1f} h={region['h']/s:.1f}")


if __name__ == "__main__":
    main()
