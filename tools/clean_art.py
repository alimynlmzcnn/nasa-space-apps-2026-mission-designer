# Çizimcinin roket PNG'lerini 4 kat büyütüp kenarları temizler: pürüzlü silüeti yumuşatır, kopuk lekeleri siler,
# çizgileri hafifçe keskinleştirir. El çizimi görünümü korunur (renkler ve çizgi karakteri değişmez).
# Kullanım: python3 clean_art.py art_originals assets   (art_originals klasörü projede yok; çizimcinin özgün PNG'leri geçici olarak oraya konur)
import sys, os
import numpy as np
from collections import deque
from PIL import Image, ImageFilter
K = 4
src, dst = sys.argv[1:3]
NAMES = ["rocket_sls_idle", "rocket_sls_nosrb", "rocket_sls_stage1", "rocket_sls_srb_l", "rocket_sls_stage2", "rocket_sls_las"]

def drop_specks(im, min_area=10):
    a = np.array(im.getchannel("A")) > 30
    H, W = a.shape; seen = np.zeros_like(a); comps = []
    for y in range(H):
        for x in range(W):
            if a[y, x] and not seen[y, x]:
                q = deque([(y, x)]); seen[y, x] = True; pts = []
                while q:
                    cy, cx = q.popleft(); pts.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and a[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; q.append((ny, nx))
                comps.append(pts)
    big = max(len(c) for c in comps); arr = np.array(im)
    for c in comps:
        if len(c) < min_area and len(c) < big * 0.02:
            for y, x in c: arr[y, x, 3] = 0
    return Image.fromarray(arr, "RGBA")

def smoothstep(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def clean(path):
    im = Image.open(path).convert("RGBA"); im = drop_specks(im)
    W, H = im.size
    big = im.convert("RGBa").resize((W * K, H * K), Image.LANCZOS).convert("RGBA")
    a = np.array(big.getchannel("A")).astype(np.float32) / 255
    ab = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3))).astype(np.float32) / 255
    new_a = smoothstep(ab, 0.30, 0.62)
    # renk: kenarda dışarı taşan saydam siyahlık olmasın diye renk alanını dışa doğru yay
    rgb = np.array(big)[..., :3].astype(np.float32)
    pm = Image.fromarray((rgb * a[..., None]).astype(np.uint8))
    num = np.array(pm.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
    den = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    fill = num / np.maximum(den[..., None], 1e-3)
    w = np.clip((a - 0.6) / 0.4, 0, 1)[..., None]
    col = np.clip(rgb * w + fill * (1 - w), 0, 255).astype(np.uint8)
    col_img = Image.fromarray(col, "RGB").filter(ImageFilter.UnsharpMask(radius=1.4, percent=130, threshold=2))
    out = np.dstack([np.array(col_img), (new_a * 255).astype(np.uint8)])
    return Image.fromarray(out, "RGBA")

for n in NAMES:
    r = clean(os.path.join(src, n + ".png")); r.save(os.path.join(dst, n + ".png"), optimize=True); print(n, r.size)
Image.open(os.path.join(dst, "rocket_sls_srb_l.png")).transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(dst, "rocket_sls_srb_r.png"), optimize=True)
