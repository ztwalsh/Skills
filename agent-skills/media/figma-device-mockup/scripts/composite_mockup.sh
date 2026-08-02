#!/usr/bin/env bash
# Composite a screenshot into a device bezel PNG (with a real transparent
# screen cutout) and drop the result onto a clean background with a shadow.
#
# Usage:
#   composite_mockup.sh <screenshot.png> <frame.png> <out.png> \
#       <cutout_x> <cutout_y> <cutout_w> <cutout_h> <corner_radius> \
#       [bg_hex] [bg_width] [bg_height]
#
# cutout_x/y/w/h/corner_radius are in the SAME pixel space as frame.png
# (i.e. native pixels for an Apple direct-download bezel; design units * scale
# if working from a Figma export -- see find_cutout.py --scale).
#
# bg_hex/bg_width/bg_height are optional -- if omitted, only the raw
# frame+screenshot composite is produced (transparent canvas, frame's native size).
#
# Example (values from find_cutout.py on an Apple iPhone 17 bezel PNG):
#   composite_mockup.sh shot.png "iPhone 17 - Black - Portrait.png" out.png \
#       72 66 1200 2616 164 "#F2F1EF" 2400 4400

set -euo pipefail

SHOT="$1"; FRAME="$2"; OUT="$3"
CX="$4"; CY="$5"; CW="$6"; CH="$7"; RADIUS="$8"
BG_HEX="${9:-}"; BG_W="${10:-}"; BG_H="${11:-}"

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

FRAME_W=$(magick identify -format "%w" "$FRAME")
FRAME_H=$(magick identify -format "%h" "$FRAME")

# 1) Cover-fit crop the screenshot to the cutout size, round the corners
magick "$SHOT" -resize "${CW}x${CH}^" -gravity center -extent "${CW}x${CH}" \
  \( +clone -alpha extract \
     -draw "fill black polygon 0,0 0,${RADIUS} ${RADIUS},0 fill white circle ${RADIUS},${RADIUS} ${RADIUS},0" \
     \( +clone -flip \) -compose Multiply -composite \
     \( +clone -flop \) -compose Multiply -composite \
  \) -alpha off -compose CopyOpacity -composite \
  "$WORKDIR/screen_rounded.png"

# 2) Place the rounded screenshot behind the frame at the cutout offset
magick -size "${FRAME_W}x${FRAME_H}" xc:none \
  "$WORKDIR/screen_rounded.png" -geometry "+${CX}+${CY}" -composite \
  "$FRAME" -geometry +0+0 -composite \
  "$WORKDIR/composited.png"

if [ -z "$BG_HEX" ]; then
  cp "$WORKDIR/composited.png" "$OUT"
  echo "Wrote $OUT (transparent, ${FRAME_W}x${FRAME_H})"
  exit 0
fi

# 3) Add a soft drop shadow, then composite onto a solid background canvas
magick "$WORKDIR/composited.png" \
  \( +clone -background black -shadow 55x35+0+30 \) \
  +swap -background none -layers merge +repage \
  "$WORKDIR/with_shadow.png"

magick -size "${BG_W}x${BG_H}" xc:"$BG_HEX" \
  "$WORKDIR/with_shadow.png" -gravity center -compose over -composite \
  "$OUT"

echo "Wrote $OUT (${BG_W}x${BG_H}, background $BG_HEX)"
