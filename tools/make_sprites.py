# data/sprites.js üretir: assets klasöründeki her PNG'nin boyutu ve (çizimcinin parçaları için) içerik kutusu.
import sys, os, json
from PIL import Image
a, atlas, out = sys.argv[1:4]
d = json.load(open(atlas))
UP = {"rocket_sls_idle", "rocket_sls_nosrb", "rocket_sls_stage1", "rocket_sls_srb_l", "rocket_sls_srb_r", "rocket_sls_stage2", "rocket_sls_las"}
doc = {"rocket_sls_idle": [266, 2], "rocket_sls_nosrb": [282, 2], "rocket_sls_stage1": [282, 65], "rocket_sls_srb_l": [267, 127], "rocket_sls_srb_r": [311, 127]}
spr = {}
for f in sorted(os.listdir(a)):
    if not f.endswith(".png"): continue
    n = f[:-4]; im = Image.open(os.path.join(a, f)); e = {"w": im.width, "h": im.height}
    if n in UP:   # 4x büyütülmüş çizimci parçası: ölçüler özgün (küçük) dosyadan, k = büyütme oranı
        orig = Image.open(os.path.join(os.path.dirname(a), "art_originals", n + ".png")); e = {"w": orig.width, "h": orig.height, "k": im.width // orig.width}
    if n in d["meta"]:
        m = dict(d["meta"][n]); e["w"], e["h"] = m.pop("w"), m.pop("h"); e["s"] = d["scale"]; m.pop("noFilter", None); e.update(m)
    elif im.mode == "RGBA" and n != "bg_stars_near":
        if n in UP: im = orig
        bb = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        e["c"] = [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]
        if n in doc: e["doc"] = doc[n]
    spr[n] = e
open(out, "w").write("// Otomatik üretildi. Elle düzenlemeyin.\nwindow.SPRITES = " + json.dumps(spr, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(spr), "sprite")
