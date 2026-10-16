#!/usr/bin/env python3
"""Generate losslessly traceable Dadyoom raster branding, without shipping SVG icons.

Arabic shaping is performed by Pillow with libraqm, using the system Noto Kufi
font. Fonts are never committed; all deliverables are PNG / WebP / ICO.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, features
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TEAL, DEEP, GOLD, CREAM, MUTED = "#174f47", "#123f39", "#f5cf7a", "#fffaf0", "#6d6255"

if not features.check("raqm"):
    raise RuntimeError("libraqm support required for correct Arabic shaping")

def font_path(style):
    result = subprocess.run(
        ["fc-match", "-f", "%{file}", f"Noto Kufi Arabic:style={style}"],
        check=True, capture_output=True, text=True
    )
    p = Path(result.stdout.strip())
    if not p.is_file():
        raise RuntimeError(f"Arabic font not installed: {style}")
    return str(p)

BOLD, MEDIUM = font_path("Bold"), font_path("Medium")

def icon(size):
    scale = 2 if size >= 180 else 4
    w = size * scale
    im = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w-1, w-1), radius=round(w*.245), fill=TEAL)
    d.line([(round(.205*w), round(.762*w)), (round(.795*w), round(.762*w))],
           fill=GOLD, width=round(.041*w))
    d.ellipse((round(.193*w),round(.74*w),round(.215*w),round(.784*w)),fill=GOLD)
    d.ellipse((round(.785*w),round(.74*w),round(.807*w),round(.784*w)),fill=GOLD)
    font = ImageFont.truetype(BOLD, round(w*.49), layout_engine=ImageFont.Layout.RAQM)
    d.text((w*.5, w*.44), "ض", anchor="mm", font=font, fill=GOLD, direction="rtl")
    return im.resize((size, size), Image.Resampling.LANCZOS)

def place_arabic(im, text, font, color, right, top):
    tile = Image.new("RGBA",(1600,420),(0,0,0,0))
    d = ImageDraw.Draw(tile)
    d.text((0,0),text,font=font,fill=color,direction="rtl")
    bounds=tile.getbbox()
    if bounds is None: raise RuntimeError("empty Arabic raster output")
    tile=tile.crop(bounds)
    im.alpha_composite(tile,(right-tile.width,top))

def logo(inverse=False):
    k=2
    im=Image.new("RGBA",(1000*k,300*k),(0,0,0,0))
    mark=icon(256*k)
    im.alpha_composite(mark,(22*k,22*k))
    place_arabic(im,"ضاديوم",ImageFont.truetype(BOLD,110*k,layout_engine=ImageFont.Layout.RAQM),
                 CREAM if inverse else DEEP,945*k,54*k)
    place_arabic(im,"بيت العربية الرقمي",ImageFont.truetype(MEDIUM,36*k,layout_engine=ImageFont.Layout.RAQM),
                 GOLD if inverse else MUTED,945*k,189*k)
    return im.resize((1000,300),Image.Resampling.LANCZOS)

def png(im, path):
    path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path,"PNG",optimize=True,compress_level=9)

def main():
    brand=ROOT/"public"/"brand"
    pwa=ROOT/"public"/"pwa"
    app=ROOT/"app"
    png(icon(512), brand/"dadyoom-icon.png")
    png(icon(512), app/"icon.png")
    png(icon(512), pwa/"icon-512.png")
    png(icon(192), pwa/"icon-192.png")
    png(icon(180), app/"apple-icon.png")
    normal=logo(False)
    png(normal, brand/"dadyoom-logo.png")
    normal.save(brand/"dadyoom-logo.webp","WEBP",quality=86,method=6)
    logo(True).save(brand/"dadyoom-logo-inverse.webp","WEBP",quality=86,method=6)
    icon(256).save(app/"favicon.ico","ICO",sizes=[(16,16),(32,32),(48,48),(64,64)])
    for file in [brand/"dadyoom-icon.png",brand/"dadyoom-logo.webp",
                 brand/"dadyoom-logo-inverse.webp",app/"icon.png",app/"apple-icon.png",
                 pwa/"icon-192.png",pwa/"icon-512.png",app/"favicon.ico"]:
        if not file.is_file() or file.stat().st_size==0:
            raise RuntimeError(f"missing raster: {file}")
    print("DADYOOM_RASTER_BRAND=PASS")

if __name__=="__main__":
    main()
