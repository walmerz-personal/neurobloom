"""Generates full-frame transparent PNG overlays (Pillow) for ffmpeg
compositing: title card, bottom instruction pill, rep counter, hold
countdown, side label.

Design rules for stroke survivors: large type (>=44 px), high contrast
(navy #1a237e on white, >=4.5:1), max two lines, no movement."""

import os

from PIL import Image, ImageDraw, ImageFont

NAVY = (26, 35, 126, 255)        # app primary deepNavy
TEXT_GRAY = (75, 85, 99, 255)
WHITE = (255, 255, 255, 242)
WHITE_SOLID = (255, 255, 255, 255)

FONT_DIRS = [
    "/usr/share/fonts/opentype/inter",
    "/usr/share/fonts/truetype/dejavu",
]


def _font(size, weight="Bold"):
    candidates = [
        f"Inter-{weight}.otf",
        "Inter-Bold.otf",
        "DejaVuSans-Bold.ttf",
        "DejaVuSans.ttf",
    ]
    for d in FONT_DIRS:
        for name in candidates:
            path = os.path.join(d, name)
            if os.path.exists(path):
                return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _rounded(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def _wrap(draw, text, font, max_width):
    words = text.split()
    lines, line = [], ""
    for word in words:
        trial = (line + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def _canvas(width, height):
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def title_card(text, subtitle, path, width=1280, height=720):
    img, draw = _canvas(width, height)
    f_title = _font(76)
    f_sub = _font(38, "Medium")
    tw = draw.textlength(text, font=f_title)
    sw = draw.textlength(subtitle, font=f_sub) if subtitle else 0
    panel_w = max(tw, sw) + 140
    panel_h = 230 if subtitle else 170
    x0 = (width - panel_w) / 2
    y0 = (height - panel_h) / 2 - 40
    _rounded(draw, (x0, y0, x0 + panel_w, y0 + panel_h), 28, WHITE)
    draw.text(((width - tw) / 2, y0 + 42), text, font=f_title, fill=NAVY)
    if subtitle:
        draw.text(((width - sw) / 2, y0 + 148), subtitle, font=f_sub, fill=TEXT_GRAY)
    img.save(path)


def instruction_pill(text, path, width=1280, height=720):
    img, draw = _canvas(width, height)
    font = _font(46)
    lines = _wrap(draw, text, font, 1040)
    line_h = 60
    pad_x, pad_y = 44, 26
    text_w = max(draw.textlength(l, font=font) for l in lines)
    pill_w = text_w + pad_x * 2
    pill_h = line_h * len(lines) + pad_y * 2
    x0 = (width - pill_w) / 2
    y0 = height - pill_h - 36
    _rounded(draw, (x0, y0, x0 + pill_w, y0 + pill_h), pill_h / 2 if len(lines) == 1 else 26, WHITE)
    for i, line in enumerate(lines):
        lw = draw.textlength(line, font=font)
        draw.text(((width - lw) / 2, y0 + pad_y + i * line_h), line, font=font, fill=NAVY)
    img.save(path)


def rep_counter(current, total, path, width=1280, height=720):
    img, draw = _canvas(width, height)
    font = _font(40)
    text = f"Rep {current} of {total}"
    tw = draw.textlength(text, font=font)
    pad_x, pad_y = 32, 18
    pill_w, pill_h = tw + pad_x * 2, 40 + pad_y * 2
    x0, y0 = width - pill_w - 36, 32
    _rounded(draw, (x0, y0, x0 + pill_w, y0 + pill_h), pill_h / 2, (26, 35, 126, 235))
    draw.text((x0 + pad_x, y0 + pad_y - 4), text, font=font, fill=WHITE_SOLID)
    img.save(path)


def countdown(n, path, width=1280, height=720):
    img, draw = _canvas(width, height)
    cx, cy, r = 1075, 330, 84
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE,
                 outline=(26, 35, 126, 255), width=6)
    f_label = _font(30, "SemiBold")
    lw = draw.textlength("HOLD", font=f_label)
    draw.text((cx - lw / 2, cy - 64), "HOLD", font=f_label, fill=TEXT_GRAY)
    f_num = _font(86)
    num = str(n)
    nw = draw.textlength(num, font=f_num)
    draw.text((cx - nw / 2, cy - 36), num, font=f_num, fill=NAVY)
    img.save(path)


def side_label(text, path, width=1280, height=720):
    img, draw = _canvas(width, height)
    font = _font(38)
    tw = draw.textlength(text, font=font)
    pad_x, pad_y = 30, 16
    x0, y0 = 36, 32
    _rounded(draw, (x0, y0, x0 + tw + pad_x * 2, y0 + 40 + pad_y * 2),
             (40 + pad_y * 2) / 2, (26, 35, 126, 235))
    draw.text((x0 + pad_x, y0 + pad_y - 4), text, font=font, fill=WHITE_SOLID)
    img.save(path)
