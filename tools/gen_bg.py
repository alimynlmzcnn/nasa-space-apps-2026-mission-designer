# Mor yıldızlı arka plan: örnek görselin renklerinden esinlenildi, kendi üretimimiz. Dikeyde ve yatayda döşenebilir.
import sys, random, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]
W, H = 1024, 2048
rng = random.Random(2026)
def field(gw, gh, seed):
    r = np.random.default_rng(seed).random((gh, gw)).astype(np.float32)
    big = np.tile(r, (3, 3))
    im = Image.fromarray((big * 255).astype(np.uint8)).resize((W * 3, H * 3), Image.BICUBIC).filter(ImageFilter.GaussianBlur(60))
    return np.asarray(im.crop((W, H, 2 * W, 2 * H))).astype(np.float32) / 255
a = field(3, 6, 1); b = field(4, 8, 2); c = field(2, 4, 3)
base = np.array([58, 13, 152], np.float32)
dark = np.array([36, 10, 112], np.float32)
bright = np.array([74, 22, 190], np.float32)
mag = np.array([92, 10, 128], np.float32)
t = (a - a.min()) / (a.max() - a.min())
img = dark[None, None] * (1 - t[..., None]) + bright[None, None] * t[..., None]
img = img * .55 + base[None, None] * .45
m = np.clip((b - .58) * 3.2, 0, 1)[..., None]
img = img * (1 - m * .55) + mag[None, None] * (m * .55)
k = np.clip((c - .6) * 2.5, 0, 1)[..., None]
img = img * (1 - k * .35) + np.array([30, 40, 170], np.float32)[None, None] * (k * .35)
im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
# yıldızlar: 2x çizip küçült (yumuşak kenar), kenarlardan taşanı karşıya sar
S = 2
layer = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
def star(x, y, r, tail=None, a=255):
    for ox in (-W, 0, W):
        for oy in (-H, 0, H):
            X, Y = (x + ox) * S, (y + oy) * S
            if -40 < X < W * S + 40 and -40 < Y < H * S + 40:
                d.ellipse((X - r * S, Y - r * S, X + r * S, Y + r * S), fill=(255, 255, 255, a))
                if tail:
                    ang, ln = tail
                    d.line((X, Y, X + math.cos(ang) * ln * S, Y + math.sin(ang) * ln * S), fill=(255, 255, 255, a), width=max(1, int(r * S * .9)))
for i in range(330):
    x, y = rng.random() * W, rng.random() * H
    u = rng.random()
    r = .7 + u ** 3.2 * 5.2
    tail = (rng.random() * 6.283, 4 + rng.random() * 12) if rng.random() < .16 and r < 2.6 else None
    star(x, y, r, tail, a=255 if r > 1.2 else rng.choice((150, 200, 255)))
for i in range(26):  # ince çizikler
    x, y = rng.random() * W, rng.random() * H; ang = rng.random() * 6.283; ln = 8 + rng.random() * 18
    for ox in (-W, 0, W):
        for oy in (-H, 0, H):
            X, Y = (x + ox) * S, (y + oy) * S
            d.line((X, Y, X + math.cos(ang) * ln * S, Y + math.sin(ang) * ln * S), fill=(255, 255, 255, 120), width=1)
layer = layer.resize((W, H), Image.LANCZOS)
im = im.convert("RGBA"); im.alpha_composite(layer)
im.convert("RGB").save(out + "/bg_space.png", optimize=True)
# yakın yıldız katmanı (şeffaf, paralaks için)
near = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(near)
for i in range(46):
    x, y = rng.random() * W, rng.random() * H; r = 1.6 + rng.random() * 3.4
    for ox in (-W, 0, W):
        for oy in (-H, 0, H):
            X, Y = (x + ox) * S, (y + oy) * S
            d.ellipse((X - r * S, Y - r * S, X + r * S, Y + r * S), fill=(255, 255, 255, 235))
near.resize((W, H), Image.LANCZOS).save(out + "/bg_stars_near.png", optimize=True)
print("bg ok")
