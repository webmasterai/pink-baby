from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\hp\.cursor\projects\c-Users-hp-Desktop-pink-baby\assets\image-362da81c-031a-42f5-8044-4fab0b1ed226.jpg"
)
out = Path(r"C:\Users\hp\Desktop\pink baby\public\images")
out.mkdir(parents=True, exist_ok=True)
im = Image.open(src).convert("RGB")
w, h = im.size
print("size", w, h)

# Tighter photo-only crops to avoid mockup UI chrome inside product/category cards.
crops = {
    "hero-mother-baby.jpg": (250, 118, 518, 328),
    "hero-products.jpg": (12, 155, 175, 310),
    "category-feeding-bottles.jpg": (18, 432, 104, 520),
    "category-breast-care.jpg": (120, 432, 204, 520),
    "category-pacifiers.jpg": (220, 432, 304, 520),
    "category-teats.jpg": (320, 432, 404, 520),
    "category-accessories.jpg": (420, 432, 504, 520),
    "product-wide-neck-bottle.jpg": (28, 618, 126, 700),
    "product-manual-breast-pump.jpg": (154, 618, 246, 700),
    "product-pacifier-set.jpg": (274, 618, 370, 700),
    "product-silicone-teat.jpg": (398, 618, 494, 700),
    "promo-breast-care.jpg": (275, 792, 498, 880),
}


def clamp_box(box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    left, top, right, bottom = box
    left = max(0, min(left, w - 1))
    top = max(0, min(top, h - 1))
    right = max(left + 1, min(right, w))
    bottom = max(top + 1, min(bottom, h))
    return left, top, right, bottom


for name, box in crops.items():
    cropped = im.crop(clamp_box(box))
    scale = 4
    cropped = cropped.resize(
        (cropped.width * scale, cropped.height * scale),
        Image.Resampling.LANCZOS,
    )
    path = out / name
    cropped.save(path, quality=92, optimize=True)
    print(name, cropped.size)

print("done")
