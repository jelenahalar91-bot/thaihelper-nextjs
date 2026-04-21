"""Generate LINE Cover Photo (1040x520) for ThaiHelper."""
from PIL import Image, ImageDraw, ImageFont

W, H = 2080, 1040
TEAL = (42, 157, 143)
TEAL_DARK = (30, 120, 110)
NAVY = (27, 58, 75)
NAVY_LIGHT = (46, 90, 110)
GOLD = (244, 162, 97)
WHITE = (255, 255, 255)
MINT = (138, 245, 232)

THAI_FONT = "/System/Library/Fonts/Supplemental/SukhumvitSet.ttc"
EN_FONT = "/System/Library/Fonts/HelveticaNeue.ttc"

def load_font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()

def gradient_diagonal(img, color_a, color_b):
    w, h = img.size
    base = Image.new("RGB", (w, h), color_a)
    top = Image.new("RGB", (w, h), color_b)
    mask = Image.new("L", (w, h))
    md = ImageDraw.Draw(mask)
    for i in range(w + h):
        md.line([(i, 0), (0, i)], fill=int(255 * i / (w + h)))
    merged = Image.composite(top, base, mask)
    img.paste(merged)

img = Image.new("RGB", (W, H), NAVY)
gradient_diagonal(img, NAVY, TEAL)
draw = ImageDraw.Draw(img)

# Decorative circles
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.ellipse((-160, -160, 360, 360), fill=(255, 255, 255, 25))
od.ellipse((W - 440, H - 400, W + 160, H + 200), fill=(138, 245, 232, 35))
od.ellipse((W - 280, 80, W - 40, 320), fill=(244, 162, 97, 60))
img.paste(overlay, (0, 0), overlay)

# Thai headline (main) — 2x font sizes for 2x canvas
thai_main = load_font(THAI_FONT, 136)
thai_sub = load_font(THAI_FONT, 64)
en_bold = load_font(EN_FONT, 44, index=1)
en_reg = load_font(EN_FONT, 36)

headline = "หางาน & หาคนช่วย"
bbox = draw.textbbox((0, 0), headline, font=thai_main)
hw = bbox[2] - bbox[0]
draw.text((W // 2 - hw // 2, 260), headline, font=thai_main, fill=WHITE)

# Gold accent bar
draw.rectangle((W // 2 - 120, 450, W // 2 + 120, 464), fill=GOLD)

# Thai tagline
tagline = "โดยตรง · ไม่มีค่านายหน้า"
bbox = draw.textbbox((0, 0), tagline, font=thai_sub)
tw = bbox[2] - bbox[0]
draw.text((W // 2 - tw // 2, 510), tagline, font=thai_sub, fill=MINT)

# English subtitle
en_text = "Direct Connections. No Middlemen."
bbox = draw.textbbox((0, 0), en_text, font=en_bold)
ew = bbox[2] - bbox[0]
draw.text((W // 2 - ew // 2, 640), en_text, font=en_bold, fill=WHITE)

# Badges row
def draw_badge(draw, x, y, text, font, bg, fg):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 36, 16
    draw.rounded_rectangle(
        (x, y, x + tw + pad_x * 2, y + th + pad_y * 2 + 8),
        radius=40, fill=bg
    )
    draw.text((x + pad_x, y + pad_y - 4), text, font=font, fill=fg)
    return tw + pad_x * 2

badge_font_thai = load_font(THAI_FONT, 34)
badge_font_en = load_font(EN_FONT, 30, index=1)
badges = [
    ("ฟรี 100% สำหรับคนหางาน", (255, 255, 255, 255), NAVY, badge_font_thai),
    ("Verified Profiles", MINT, NAVY, badge_font_en),
    ("100% Direct", GOLD, NAVY, badge_font_en),
]

total_w = 0
widths = []
for text, _, _, f in badges:
    bbox = draw.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0] + 72
    widths.append(w)
    total_w += w
gap = 28
total_w += gap * (len(badges) - 1)

x = W // 2 - total_w // 2
y = 800
for (text, bg, fg, f), w in zip(badges, widths):
    draw_badge(draw, x, y, text, f, bg, fg)
    x += w + gap

out_path = "/Users/jelenahermann/Desktop/Schreibtisch – MacBook Pro von Jelena/Thai Helper/thaihelper-nextjs/line-assets/line_cover.png"
img.save(out_path, "PNG", optimize=True)
print(f"Saved: {out_path}")

import os
print(f"Size: {W}x{H}, File: {os.path.getsize(out_path) / 1024:.1f} KB")
