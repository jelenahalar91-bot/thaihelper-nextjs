"""Generate LINE Rich Menu compact (2500x843) for ThaiHelper."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 2500, 843
TEAL = (42, 157, 143)
TEAL_DARK = (30, 120, 110)
NAVY = (27, 58, 75)
NAVY_LIGHT = (46, 90, 110)
GOLD = (244, 162, 97)
WHITE = (255, 255, 255)
WHITE_SOFT = (255, 255, 255, 230)

THAI_FONT = "/System/Library/Fonts/Supplemental/SukhumvitSet.ttc"
EN_FONT = "/System/Library/Fonts/HelveticaNeue.ttc"

def gradient_rect(img, xy, color_a, color_b, direction="vertical"):
    x0, y0, x1, y1 = xy
    w, h = x1 - x0, y1 - y0
    base = Image.new("RGB", (w, h), color_a)
    top = Image.new("RGB", (w, h), color_b)
    mask = Image.new("L", (w, h))
    md = ImageDraw.Draw(mask)
    if direction == "vertical":
        for y in range(h):
            md.line([(0, y), (w, y)], fill=int(255 * y / h))
    else:
        for x in range(w):
            md.line([(x, 0), (x, h)], fill=int(255 * x / w))
    merged = Image.composite(top, base, mask)
    img.paste(merged, (x0, y0))

def load_font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()

img = Image.new("RGB", (W, H), WHITE)
draw = ImageDraw.Draw(img)

# LEFT half: Teal gradient (Looking for work / หางาน)
gradient_rect(img, (0, 0, W // 2, H), TEAL_DARK, TEAL, "vertical")
# RIGHT half: Navy gradient (Find a helper / หาคนช่วย)
gradient_rect(img, (W // 2, 0, W, H), NAVY_LIGHT, NAVY, "vertical")

# Divider line (thin white with transparency effect via narrow rect)
draw.rectangle((W // 2 - 2, 0, W // 2 + 2, H), fill=WHITE)

# Decorative circles (subtle)
for cx, cy, r, col in [
    (180, 120, 90, (255, 255, 255, 30)),
    (1050, 720, 140, (255, 255, 255, 20)),
    (1460, 150, 110, (255, 255, 255, 30)),
    (2320, 700, 120, (255, 255, 255, 20)),
]:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    img.paste(overlay, (0, 0), overlay)

# LEFT BUTTON — หางาน
# Icon: simple briefcase using shapes, centered
def draw_briefcase(draw, cx, cy, size, color):
    # handle
    hw = size // 2
    draw.rounded_rectangle(
        (cx - hw // 2 - 10, cy - size // 2 - size // 4, cx + hw // 2 + 10, cy - size // 2 + 10),
        radius=12, outline=color, width=14)
    # case body
    draw.rounded_rectangle(
        (cx - size, cy - size // 2, cx + size, cy + size // 2),
        radius=20, fill=color)

# LEFT icon & text
left_cx = W // 4
draw_briefcase(draw, left_cx, 260, 90, WHITE)

# Thai main label
thai_font = load_font(THAI_FONT, 150)
en_font = load_font(EN_FONT, 60)
en_font_bold = load_font(EN_FONT, 60, index=1)

thai_left = "หางาน"
bbox = draw.textbbox((0, 0), thai_left, font=thai_font)
tw = bbox[2] - bbox[0]
draw.text((left_cx - tw // 2, 380), thai_left, font=thai_font, fill=WHITE)

en_left = "Looking for Work"
bbox = draw.textbbox((0, 0), en_left, font=en_font)
tw = bbox[2] - bbox[0]
draw.text((left_cx - tw // 2, 580), en_left, font=en_font, fill=WHITE)

# Small gold accent line under labels
draw.rectangle((left_cx - 80, 680, left_cx + 80, 688), fill=GOLD)

# RIGHT BUTTON — หาคนช่วย
def draw_search_person(draw, cx, cy, size, color):
    # magnifying glass
    r = size // 2
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=14)
    draw.line((cx + int(r * 0.7), cy + int(r * 0.7), cx + r + 50, cy + r + 50),
              fill=color, width=16)
    # small person head inside
    hr = size // 5
    draw.ellipse((cx - hr, cy - hr - 10, cx + hr, cy + hr - 10), fill=color)
    # body
    draw.pieslice((cx - size // 3, cy, cx + size // 3, cy + size // 2),
                  start=180, end=360, fill=color)

right_cx = 3 * W // 4
draw_search_person(draw, right_cx, 250, 100, WHITE)

thai_right = "หาคนช่วย"
bbox = draw.textbbox((0, 0), thai_right, font=thai_font)
tw = bbox[2] - bbox[0]
draw.text((right_cx - tw // 2, 380), thai_right, font=thai_font, fill=WHITE)

en_right = "Find a Helper"
bbox = draw.textbbox((0, 0), en_right, font=en_font)
tw = bbox[2] - bbox[0]
draw.text((right_cx - tw // 2, 580), en_right, font=en_font, fill=WHITE)

# Gold accent line
draw.rectangle((right_cx - 80, 680, right_cx + 80, 688), fill=GOLD)

out_path = "/Users/jelenahermann/Desktop/Schreibtisch – MacBook Pro von Jelena/Thai Helper/thaihelper-nextjs/line-assets/rich_menu_compact.png"
img.save(out_path, "PNG", optimize=True)
print(f"Saved: {out_path}")
print(f"Size: {W}x{H}")

import os
print(f"File size: {os.path.getsize(out_path) / 1024:.1f} KB")
