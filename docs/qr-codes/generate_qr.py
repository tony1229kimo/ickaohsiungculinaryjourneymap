"""
Generate restaurant QR codes for IC Kaohsiung culinary journey game.

5 PNGs, one per restaurant. Each QR encodes the LIFF URL with a `?r=XX`
query param that the frontend auto-binds against.

Output: docs/qr-codes/qr_<CODE>.png at 300dpi, A6-printable.

Run: python generate_qr.py
"""

import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

# 從 GAME_LIFF_ID 來,固定的 LIFF ID
LIFF_ID = "1656533531-U5OvwB62"

RESTAURANTS = [
    ("ZL", "Zhan Lu",        "湛露中餐廳"),
    ("WR", "WA-RA",          "WA-RA 日式餐廳"),
    ("SD", "SEEDS",          "大地全日餐廳"),
    ("HW", "HAWKER",         "南洋料理"),
    ("BL", "BLT33",          "大廳酒吧"),
]

# IC 品牌色
IC_NAVY = (10, 37, 64)       # #0A2540
IC_GOLD = (201, 169, 97)     # #C9A961
WHITE   = (255, 255, 255)
DARK    = (26, 26, 26)
GREY    = (107, 114, 128)

CN_FONT = "C:/Windows/Fonts/msjhbd.ttc"   # 微軟正黑體 bold
CN_FONT_LIGHT = "C:/Windows/Fonts/msjh.ttc"

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def make_card(code: str, name_en: str, name_zh: str) -> Image.Image:
    """產一張 A6 直立桌牌 (300dpi → 1240 × 1748 px),含 QR + 餐廳名."""
    W, H = 1240, 1748   # A6 portrait @ 300dpi (105×148mm)
    canvas = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(canvas)

    # Top navy band — IC logo / branding
    draw.rectangle([(0, 0), (W, 280)], fill=IC_NAVY)

    # IC brand text
    font_brand    = ImageFont.truetype(CN_FONT,       64)
    font_subbrand = ImageFont.truetype(CN_FONT_LIGHT, 28)
    font_h1       = ImageFont.truetype(CN_FONT,       72)
    font_h2       = ImageFont.truetype(CN_FONT,       48)
    font_body     = ImageFont.truetype(CN_FONT_LIGHT, 30)
    font_small    = ImageFont.truetype(CN_FONT_LIGHT, 22)

    # Brand header
    draw.text((W//2, 90),  "INTERCONTINENTAL",         fill=IC_GOLD, font=font_brand,    anchor="mm")
    draw.text((W//2, 160), "KAOHSIUNG · 高雄洲際酒店",  fill=WHITE,   font=font_subbrand, anchor="mm")
    draw.text((W//2, 220), "Culinary Journey · 大富翁遊戲", fill=IC_GOLD, font=font_subbrand, anchor="mm")

    # Restaurant name (large center)
    draw.text((W//2, 360), name_zh, fill=IC_NAVY, font=font_h1, anchor="mm")
    draw.text((W//2, 440), name_en, fill=IC_GOLD, font=font_h2, anchor="mm")

    # QR Code
    url = f"https://liff.line.me/{LIFF_ID}?r={code}"
    qr = qrcode.QRCode(
        version=4,                                       # ~80 chars capacity
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # 30% redundancy — safe even if logo overlay
        box_size=24,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    qr_size = 800
    qr_resized = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    qr_x = (W - qr_size) // 2
    qr_y = 540
    canvas.paste(qr_resized, (qr_x, qr_y))

    # Tagline below QR
    draw.text((W//2, qr_y + qr_size + 60), "請用 LINE 相機掃一下", fill=IC_NAVY, font=font_h2, anchor="mm")
    draw.text((W//2, qr_y + qr_size + 130), "結帳後即可開始遊戲拿擲骰機會", fill=DARK,    font=font_body, anchor="mm")

    # Footer rules
    rules_y = H - 160
    draw.line([(80, rules_y), (W-80, rules_y)], fill=IC_GOLD, width=2)
    draw.text((W//2, rules_y + 35), "規則:消費滿 NT$2,000 = 1 次擲骰  ·  最高 5 次", fill=DARK, font=font_body, anchor="mm")
    draw.text((W//2, rules_y + 80), "走大富翁地圖 → 抽獎拿餐券 / 酒水折抵 / 住宿券", fill=GREY, font=font_small, anchor="mm")
    draw.text((W//2, rules_y + 120), f"#{code} · v2026-05-18", fill=GREY, font=font_small, anchor="mm")

    return canvas


def main() -> None:
    for code, name_en, name_zh in RESTAURANTS:
        img = make_card(code, name_en, name_zh)
        path = os.path.join(OUT_DIR, f"qr_{code}_{name_en.replace(' ', '_')}.png")
        img.save(path, "PNG", dpi=(300, 300), optimize=True)
        print(f"[OK] {path}")

    # Also output simple QR-only PNGs (no decoration) in case design team wants to redo the card
    raw_dir = os.path.join(OUT_DIR, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    for code, name_en, _ in RESTAURANTS:
        url = f"https://liff.line.me/{LIFF_ID}?r={code}"
        qr = qrcode.QRCode(version=4, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=30, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        path = os.path.join(raw_dir, f"qr_{code}_raw.png")
        img.save(path, "PNG", dpi=(300, 300), optimize=True)
        print(f"[OK] {path}")


if __name__ == "__main__":
    main()
