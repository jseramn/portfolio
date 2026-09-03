#!/usr/bin/env python3
"""Render a 1200×630 Tinity lockup OG image (mark + wordmark on #050505)."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH = 1200
HEIGHT = 630
BG = (5, 5, 5)
STROKE = (232, 232, 232)
LED = (31, 219, 18)
TEXT = (245, 245, 245)
EYEBROW = (163, 163, 163)

POLYGONS = [
    ([0.00000, -1.00000, 0.86603, -0.50000, 0.00000, 0.00000, -0.86603, -0.50000], (245, 245, 245, 17)),
    ([0.86603, -0.50000, 1.73205, 0.00000, 0.86603, 0.50000, 0.00000, 0.00000], (245, 245, 245, 17)),
    ([-0.86603, 0.50000, 0.00000, 1.00000, 0.00000, 0.00000, -0.86603, -0.50000], (245, 245, 245, 11)),
    ([0.86603, 0.50000, 0.00000, 1.00000, 0.00000, 0.00000, 0.86603, -0.50000], (245, 245, 245, 8)),
    ([-0.43301, -0.25000, 0.43301, 0.25000, -0.43301, 0.75000, -1.29904, 0.25000], (245, 245, 245, 17)),
    ([0.00000, 1.00000, 0.86603, 1.50000, 0.86603, 0.50000, 0.00000, 0.00000], (245, 245, 245, 11)),
    ([1.73205, 1.00000, 0.86603, 1.50000, 0.86603, 0.50000, 1.73205, 0.00000], (245, 245, 245, 8)),
    ([-1.29904, 1.25000, -0.43301, 1.75000, -0.43301, 0.75000, -1.29904, 0.25000], (245, 245, 245, 11)),
    ([0.43301, 1.25000, -0.43301, 1.75000, -0.43301, 0.75000, 0.43301, 0.25000], (245, 245, 245, 8)),
]

LINES = [
    (0.86603, 0.50000, 0.00000, 0.00000),
    (0.00000, 1.00000, 0.86603, 0.50000),
    (0.00000, 1.00000, -0.86603, 0.50000),
    (-0.86603, 0.50000, 0.00000, 0.00000),
    (0.00000, -1.00000, 0.86603, -0.50000),
    (0.00000, 0.00000, 0.86603, -0.50000),
    (0.00000, 0.00000, -0.86603, -0.50000),
    (-0.86603, -0.50000, 0.00000, -1.00000),
    (0.00000, 0.00000, 0.00000, -1.00000),
    (0.86603, 0.50000, 0.86603, -0.50000),
    (0.00000, 1.00000, 0.00000, 0.00000),
    (-0.86603, 0.50000, -0.86603, -0.50000),
    (0.86603, 0.50000, 1.73205, 1.00000),
    (1.73205, 1.00000, 0.86603, 1.50000),
    (0.86603, 1.50000, 0.00000, 1.00000),
    (0.86603, -0.50000, 1.73205, 0.00000),
    (1.73205, 0.00000, 0.86603, 0.50000),
    (1.73205, 1.00000, 1.73205, 0.00000),
    (0.86603, 1.50000, 0.86603, 0.50000),
    (-0.43301, 0.75000, 0.43301, 1.25000),
    (0.43301, 1.25000, -0.43301, 1.75000),
    (-0.43301, 1.75000, -1.29904, 1.25000),
    (-1.29904, 1.25000, -0.43301, 0.75000),
    (-0.43301, -0.25000, 0.43301, 0.25000),
    (0.43301, 0.25000, -0.43301, 0.75000),
    (-0.43301, 0.75000, -1.29904, 0.25000),
    (-1.29904, 0.25000, -0.43301, -0.25000),
    (-0.43301, 0.75000, -0.43301, -0.25000),
    (0.43301, 1.25000, 0.43301, 0.25000),
    (-0.43301, 1.75000, -0.43301, 0.75000),
    (-1.29904, 1.25000, -1.29904, 0.25000),
]

VIEW_X = -1.519038105676658
VIEW_Y = -1.3605444566227676
VIEW_W = 3.471088913245535
VIEW_H = 3.471088913245535
MARK = 168


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = (
        "/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf"
        if bold
        else "/usr/share/fonts/truetype/macos/Inter-Regular.ttf"
    )
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def transform(x: float, y: float, origin: tuple[float, float]) -> tuple[float, float]:
    ox, oy = origin
    px = ox + (x - VIEW_X) / VIEW_W * MARK
    py = oy + (y - VIEW_Y) / VIEW_H * MARK
    return px, py


def draw_mark(base: Image.Image, origin: tuple[float, float]) -> None:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for coords, fill in POLYGONS:
        pts = [transform(coords[i], coords[i + 1], origin) for i in range(0, len(coords), 2)]
        draw.polygon(pts, fill=fill)
    line = ImageDraw.Draw(overlay)
    width = max(1, round(0.032 / VIEW_W * MARK))
    for x1, y1, x2, y2 in LINES:
        line.line([transform(x1, y1, origin), transform(x2, y2, origin)], fill=(*STROKE, 255), width=width)
    cx, cy = transform(0, 0, origin)
    r = 0.088 / VIEW_W * MARK * 1.6
    line.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*LED, 255))
    base.paste(overlay, (0, 0), overlay)


def draw_wordmark(draw: ImageDraw.ImageDraw, x: float, y: float) -> tuple[float, float]:
    face = font(64)
    text = "tinity"
    draw.text((x, y), text, font=face, fill=TEXT)
    bbox = draw.textbbox((x, y), text, font=face)
    # LED dots on both i glyphs (indexes 1 and 3).
    for index in (1, 3):
        prefix = text[:index]
        glyph = text[index]
        left = x + draw.textlength(prefix, font=face)
        width = draw.textlength(glyph, font=face)
        cx = left + width / 2
        cy = y + 10
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=LED)
    return bbox[2], bbox[3]


def render(dest: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    mark_origin = ((WIDTH - MARK) / 2 - 150, (HEIGHT - MARK) / 2 - 8)
    draw_mark(image, mark_origin)
    word_x = mark_origin[0] + MARK + 18
    word_y = mark_origin[1] + MARK / 2 - 36
    eyebrow = font(14, bold=True)
    draw.text((word_x, word_y - 28), "HARNESS", font=eyebrow, fill=EYEBROW)
    draw_wordmark(draw, word_x, word_y)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "PNG", optimize=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("usage: tinity-og.py <dest.png>\n")
        sys.exit(2)
    render(Path(sys.argv[1]))
