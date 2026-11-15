# Eksik assetleri çizimcinin tarzında üretir: düz dolgu, yumuşak gri kontur, hafif titrek çizgi.
# Çıktı: tek bir atlas SVG + her parçanın konumu (JSON). Chrome ile PNG'ye çevrilip dilimlenir.
import sys, math, json, random
OUT_SVG, OUT_JSON = sys.argv[1], sys.argv[2]
S = 2            # mantıksal piksel -> atlas pikseli
OL = "#4b4a57"   # kontur
STEEL, STEEL_D, DEEP = "#8e90c2", "#4a4d86", "#2b2c5e"
ORANGE, YELLOW, MINT, RED, BLUE = "#ff6a1f", "#ffd23f", "#5be3b0", "#ff3b3b", "#6fb4ff"

def path(d, fill="none", stroke=OL, sw=1.6, op=1, extra=""):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round" opacity="{op}" {extra}/>'
def rect(x, y, w, h, fill, r=2, stroke=OL, sw=1.6, op=1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def circ(cx, cy, r, fill, stroke=OL, sw=1.4, op=1):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def ell(cx, cy, rx, ry, fill, stroke=OL, sw=1.4, op=1):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def line(x1, y1, x2, y2, stroke=OL, sw=1.3, op=1):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" opacity="{op}"/>'
def limb(pts, color, w):
    d = "M" + " L".join(f"{x},{y}" for x, y in pts)
    return path(d, stroke=OL, sw=w + 2.2) + path(d, stroke=color, sw=w)
def text(x, y, t, size=9, fill="#e9eef7", anchor="middle", weight=700):
    return f'<text x="{x}" y="{y}" font-family="Helvetica,Arial,sans-serif" font-weight="{weight}" font-size="{size}" fill="{fill}" text-anchor="{anchor}">{t}</text>'
def hazard(x, y, w, h, cid):
    s = f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2"/></clipPath><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="#2d2b3a"/>'
    s += f'<g clip-path="url(#{cid})">' + "".join(f'<line x1="{x+i}" y1="{y+h+2}" x2="{x+i+h+4}" y2="{y-2}" stroke="{YELLOW}" stroke-width="{h*.42}"/>' for i in range(-h, int(w) + h, int(h * 1.25))) + '</g>'
    return s + f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="none" stroke="{OL}" stroke-width="1.6"/>'

sprites = []   # (ad, w, h, svg)
meta = {}
def add(name, w, h, body, **m):
    sprites.append((name, w, h, body)); meta[name] = dict(w=w, h=h, **m)

# ------------------------------------------------------------------ insanlar
OUTFITS = {
    "sci": dict(top="#eef0f6", legs="#3a3f6b", hair="#3b2a22", skin="#f1c9a5", coat=True),
    "sci2": dict(top="#eef0f6", legs="#2b2f55", hair="#d8b060", skin="#c98f63", coat=True),
    "eng": dict(top=ORANGE, legs="#3a3f6b", hair="#1f1f28", skin="#d9a071", hat=YELLOW),
    "eng2": dict(top=ORANGE, legs="#2b2f55", hair="#4a2c1a", skin="#f3d2b3", hat="#ffffff"),
    "ctl": dict(top="#5b78e6", legs="#2b2f55", hair="#c9a15a", skin="#f3d2b3", headset=True),
    "ctl2": dict(top="#5b78e6", legs="#3a3f6b", hair="#1f1f28", skin="#8d5a3b", headset=True),
    "dir": dict(top="#2d315c", legs="#23264d", hair="#8f93a8", skin="#f1c9a5", headset=True, tie=True),
}
def person(pose, f, o):
    s = []; hx0, hipy, shx, shy = 30, 72, 32, 46
    bob = 1 if (f % 2 and pose in ("sit", "idle")) else 0
    shoe = "#1f2040"
    if pose == "sit":
        s += [rect(9, 40, 5, 40, "#55598a"), rect(9, 76, 32, 6, "#55598a", r=3), rect(23, 82, 4, 18, "#43466f"), rect(11, 99, 28, 4, "#43466f", r=2)]
        s.append(limb([(hx0, hipy + 3), (53, hipy + 3), (53, 100)], o["legs"], 8))
        s.append(ell(57, 102, 7, 3.5, shoe))
    else:
        feet = {"walk": [((43, 103), (19, 101)), ((34, 103), (29, 97)), ((19, 101), (43, 103)), ((29, 97), (34, 103))][f % 4]}.get(pose, ((35, 103), (27, 103)))
        knees = [((feet[0][0] + hx0) / 2 + 2, 88), ((feet[1][0] + hx0) / 2 + 2, 88)]
        s.append(limb([(hx0 - 2, hipy), knees[1], feet[1]], o["legs"], 7)); s.append(ell(feet[1][0] + 3, feet[1][1] + 1, 6, 3, shoe))
        s.append(limb([(hx0 + 2, hipy), knees[0], feet[0]], o["legs"], 7)); s.append(ell(feet[0][0] + 3, feet[0][1] + 1, 6, 3, shoe))
    # arka kol
    if pose == "sit":   s.append(limb([(shx - 1, shy + 5), (44, 64), (55, 67 - (2 if f % 2 else -1))], o["top"], 5.5))
    elif pose == "walk":
        sw = [1, 0, -1, 0][f % 4]; s.append(limb([(shx - 2, shy + 5), (27 - sw * 5, 60), (25 - sw * 9, 70)], o["top"], 5.5))
    elif pose == "point": s.append(limb([(shx - 2, shy + 5), (27, 60), (27, 71)], o["top"], 5.5))
    elif pose == "idle":  s.append(limb([(shx - 2, shy + 5), (21, 58), (29, 68)], o["top"], 5.5))
    # gövde
    bot = hipy + (15 if o.get("coat") and pose != "sit" else 5)
    s.append(path(f"M{shx-11},{shy+bob} Q{shx},{shy-5+bob} {shx+10},{shy+bob} L{hx0+11},{bot} L{hx0-10},{bot} Z", fill=o["top"]))
    if o.get("coat"): s.append(line(shx + 4, shy + 3 + bob, hx0 + 5, bot - 2, "#b9bdd0", 1.2))
    if o.get("tie"):  s.append(path(f"M{shx+6},{shy+2+bob} l3,12 l-3,4 l-2,-5 Z", fill=ORANGE, sw=1))
    if o.get("hat"):  s.append(rect(shx - 8, shy + 10 + bob, 18, 4, YELLOW, r=1, sw=1))   # yelek şeridi
    # baş
    hx, hy = shx + 3, shy - 19 + bob
    s.append(circ(hx, hy, 11, o["skin"]))
    s.append(path(f"M{hx-11},{hy+2} A11,11 0 1 1 {hx+9.5},{hy-5.5} Q{hx+2},{hy-7} {hx-3},{hy-2} Q{hx-6},{hy+3} {hx-11},{hy+2} Z", fill=o["hair"], sw=1.2))
    s.append(circ(hx + 5.5, hy - .5, 1.4, "#23233a", stroke="none")); s.append(path(f"M{hx+5},{hy+5.5} q3,1.2 5,-.4", sw=1.1))
    s.append(circ(hx - 2.5, hy + 1.5, 2.2, o["skin"], sw=1))
    if o.get("hat"):
        s.append(path(f"M{hx-12.5},{hy-3} A12.5,12.5 0 0 1 {hx+12.5},{hy-3} L{hx+18},{hy-2} L{hx+18},{hy} L{hx-12.5},{hy} Z", fill=o["hat"]))
    if o.get("headset"):
        s.append(path(f"M{hx-9},{hy-1} A10.5,10.5 0 0 1 {hx+4},{hy-11.5}", stroke="#23233a", sw=2.4)); s.append(rect(hx - 6, hy - 2, 6, 8, "#23233a", r=2, sw=1))
        s.append(path(f"M{hx-3},{hy+5} Q{hx+2},{hy+10} {hx+8},{hy+7}", stroke="#23233a", sw=1.5)); s.append(circ(hx + 8.5, hy + 7, 1.6, MINT, sw=.8))
    # ön kol
    if pose == "sit":   s.append(limb([(shx, shy + 5), (43, 63), (57, 65 + (2 if f % 2 else -1))], o["top"], 5.5)); s.append(circ(58, 65 + (2 if f % 2 else -1), 3, o["skin"], sw=1))
    elif pose == "walk":
        s.append(limb([(shx, shy + 5), (41, 61), (50, 58)], o["top"], 5.5)); s.append(rect(47, 46, 13, 16, "#f4f5fa", r=1.5, sw=1.2)); s += [line(50, 51 + i * 3.4, 57, 51 + i * 3.4, "#9aa0c0", 1) for i in range(3)]
        s.append(circ(50, 59, 3, o["skin"], sw=1))
    elif pose == "point":
        ty = 23 + (3 if f % 2 else 0); s.append(limb([(shx, shy + 5), (48, 37), (61, ty)], o["top"], 5.5)); s.append(circ(62.5, ty - 1, 3, o["skin"], sw=1))
    elif pose == "idle":
        s.append(limb([(shx, shy + 5), (46, 51), (43, 36 + bob)], o["top"], 5.5)); s.append(circ(43, 35 + bob, 3, o["skin"], sw=1))
    return "".join(s)
for o in ("sci", "sci2", "eng", "eng2", "ctl", "ctl2"):
    for f in range(2): add(f"char_{o}_sit_{f+1}", 72, 110, person("sit", f, OUTFITS[o]))
for f in range(2): add(f"char_sci_point_{f+1}", 72, 110, person("point", f, OUTFITS["sci"]))
for f in range(2): add(f"char_sci2_point_{f+1}", 72, 110, person("point", f, OUTFITS["sci2"]))
for f in range(4): add(f"char_eng_walk_{f+1}", 72, 110, person("walk", f, OUTFITS["eng"]))
for f in range(4): add(f"char_sci_walk_{f+1}", 72, 110, person("walk", f, OUTFITS["sci2"]))
for f in range(2): add(f"char_dir_idle_{f+1}", 72, 110, person("idle", f, OUTFITS["dir"]))

# ------------------------------------------------------------------ amfi konsol
def arc_pt(t, k):   # k=0 iç yay, k=1 dış yay
    ix, iy = 320 + 230 * math.cos(t), 62 + 78 * math.sin(t)
    ox, oy = 320 + 310 * math.cos(t), 70 + 120 * math.sin(t)
    return ix + (ox - ix) * k, iy + (oy - iy) * k
def console():
    s = [path("M10,70 A310,120 0 0 0 630,70 L630,118 A310,120 0 0 1 10,118 Z", fill="#3d3f7a")]
    s.append(path("M10,96 A310,120 0 0 0 630,96", stroke=ORANGE, sw=4))
    s.append(path("M10,108 A310,120 0 0 0 630,108", stroke="#2b2c5e", sw=2))
    for i in range(1, 12):
        t = math.pi * i / 12; x, y = 320 + 310 * math.cos(t), 70 + 120 * math.sin(t)
        s.append(line(x, y, x, y + 48, "#2b2c5e", 1.4))
    for i in range(12):   # ön panel havalandırma ızgaraları
        t = math.pi * (i + .5) / 12; x, y = 320 + 310 * math.cos(t), 70 + 120 * math.sin(t)
        if i % 2 == 0: s += [line(x - 9, y + 32 + j * 4, x + 9, y + 32 + j * 4, "#6b6fa8", 1.2) for j in range(3)]
        else: s.append(rect(x - 10, y + 30, 20, 9, "#23244f", r=2, sw=1))
    s.append(path("M10,70 A310,120 0 0 0 630,70 L550,62 A230,78 0 0 1 90,62 Z", fill="#7f83bd"))
    s.append(path("M30,70 A290,110 0 0 0 610,70", stroke="#b9bcec", sw=1.4, op=.7))
    for i in range(1, 9):
        t = math.pi * i / 9; a = arc_pt(t, 0); b = arc_pt(t, 1); s.append(line(a[0], a[1], b[0], b[1], "#5a5d96", 1.3))
    btns = []; rnd = random.Random(7)
    for seg in range(9):
        t0, t1 = math.pi * seg / 9, math.pi * (seg + 1) / 9; tm = (t0 + t1) / 2
        if seg in (1, 3, 5, 7):   # gömülü küçük ekran
            q = [arc_pt(tm - .1, .28), arc_pt(tm + .1, .28), arc_pt(tm + .1, .78), arc_pt(tm - .1, .78)]
            s.append(path("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in q) + " Z", fill="#14163a", sw=1.3))
            meta_scr.append([[round(x, 1), round(y, 1)] for x, y in q])
        else:
            for r in range(3):
                for c in range(4):
                    x, y = arc_pt(t0 + (t1 - t0) * (.2 + c * .2), .26 + r * .25)
                    col = rnd.choice(["red", "red", "red", "amber", "green"])
                    s.append(circ(x, y, 3.1, {"red": "#7a2030", "amber": "#7a6420", "green": "#1f6b55"}[col], sw=1))
                    btns.append([round(x, 1), round(y, 1), col])
    return "".join(s), btns
meta_scr = []
cbody, cbtns = console()
add("room_console_amfi", 640, 244, cbody, buttons=cbtns, screens=meta_scr)

# büyük ekran (ortası delik: canlı görüntü kod ile çizilir)
scr = path("M8,0 H432 Q440,0 440,8 V254 Q440,262 432,262 H8 Q0,262 0,254 V8 Q0,0 8,0 Z M18,16 V244 H422 V16 Z", fill="#2b2c5e", extra='fill-rule="evenodd"')
scr += path("M18,16 H422 V244 H18 Z", stroke="#8e90c2", sw=2)
scr += path("M186,262 H254 L262,300 H178 Z", fill="#3d3f7a") + rect(150, 296, 140, 8, "#4a4d86", r=3)
scr += circ(220, 253, 2.6, "#7a2030", sw=.8) + text(60, 257, "CAM 1", 7.5, "#b9bcec") + text(382, 257, "PAD 39B", 7.5, "#b9bcec")
scr += rect(204, -1, 32, 5, "#4a4d86", r=2, sw=1)
add("room_screen_big", 440, 306, scr, hole=[18, 16, 404, 228])

# masa (yandan), monitörlü
dk = rect(2, 42, 146, 8, "#7f83bd", r=2) + rect(10, 50, 130, 40, "#4a4d86", r=2) + line(10, 62, 140, 62, "#3d3f7a", 1.2) + rect(60, 68, 30, 12, "#3d3f7a", r=2, sw=1)
dk += rect(116, 30, 5, 13, "#55598a", sw=1) + rect(104, 40, 30, 3, "#55598a", r=1, sw=1)
dk += path("M100,4 L138,7 L138,31 L100,33 Z", fill="#23244f") + path("M103.5,8 L134.5,10.5 L134.5,28 L103.5,29.5 Z", fill="#1c3f5e", sw=1)
dk += path("M107,24 l5,-7 l4,5 l5,-9 l4,6 l5,-3", stroke=MINT, sw=1.3)
dk += rect(66, 38, 28, 4, "#d9dbf0", r=1.5, sw=1) + path("M22,30 h9 v10 q0,2 -2,2 h-5 q-2,0 -2,-2 Z", fill="#f4f5fa", sw=1.1) + path("M31,33 q5,0 0,6", sw=1.1)
add("room_desk", 150, 92, dk, monitor=[103.5, 8, 31, 21])

# beyaz tahta: roket denklemi
wb = rect(2, 2, 176, 112, "#f4f5fa", r=4, sw=2) + rect(2, 2, 176, 8, "#b9bcec", r=3, sw=1.2) + rect(60, 112, 60, 5, "#8e90c2", r=2, sw=1)
wb += f'<text x="14" y="34" font-family="Georgia,serif" font-style="italic" font-size="13" fill="#2b2c5e">Δv = I<tspan font-size="8" dy="3">sp</tspan><tspan dy="-3"> · g</tspan><tspan font-size="8" dy="3">0</tspan><tspan dy="-3"> · ln(m</tspan><tspan font-size="8" dy="3">0</tspan><tspan dy="-3"> / m</tspan><tspan font-size="8" dy="3">f</tspan><tspan dy="-3">)</tspan></text>'
wb += path("M16,96 L16,50 M16,96 L96,96", stroke="#2b2c5e", sw=1.4) + path("M18,94 Q50,90 62,70 T94,52", stroke=ORANGE, sw=2) + line(62, 70, 62, 96, "#8e90c2", 1)
wb += text(128, 60, "LEO", 9, "#2b2c5e") + text(128, 74, "~9.4 km/s", 9, ORANGE) + path("M106,84 q10,-8 22,0 t22,0", stroke=BLUE, sw=1.6) + circ(151, 44, 5, "none", stroke=RED, sw=1.4)
add("room_whiteboard", 180, 120, wb)

# sunucu dolabı
sr = rect(2, 2, 60, 148, "#23244f", r=3, sw=2) + "".join(rect(8, 9 + i * 17, 48, 13, "#3d3f7a", r=2, sw=1) + line(12, 15.5 + i * 17, 34, 15.5 + i * 17, "#5a5d96", 1.2) for i in range(8))
add("room_server", 64, 152, sr, leds=[[49, 15.5 + i * 17] for i in range(8)])

# saksı
pl = path("M12,54 H34 L31,76 H15 Z", fill="#b5673a") + "".join(path(f"M23,54 Q{23+dx},{30+dy} {23+dx*1.9},{14+dy*1.6} Q{23+dx*.6},{34+dy} 23,54 Z", fill=c, sw=1.2) for dx, dy, c in [(-9, 6, "#2f9e6a"), (9, 4, "#2f9e6a"), (-4, -4, "#3fb87e"), (5, -6, "#3fb87e"), (0, -10, "#58cf93")])
add("room_plant", 46, 78, pl)

# çerçeve (mekik posteri için ortası delik)
fr = path("M3,0 H137 Q140,0 140,3 V177 Q140,180 137,180 H3 Q0,180 0,177 V3 Q0,0 3,0 Z M9,9 V150 H131 V9 Z", fill="#d9dbf0", extra='fill-rule="evenodd"') + path("M9,9 H131 V150 H9 Z", sw=1.2)
fr += text(70, 163, "SLS BLOCK 1", 9, "#2b2c5e") + text(70, 174, "ARTEMIS · MOON ROCKET", 7.5, "#5a5d96", weight=400)
add("room_poster_frame", 140, 180, fr, hole=[9, 9, 122, 141])

# harita ekranı (yörünge izi kodla çizilir)
mp = rect(1, 1, 318, 168, "#2b2c5e", r=6, sw=2) + rect(9, 9, 302, 152, "#14163a", r=3, sw=1.2)
mp += "".join(line(9 + i * 50.3, 9, 9 + i * 50.3, 161, "#2b2c6a", 1) for i in range(1, 6)) + "".join(line(9, 9 + i * 38, 311, 9 + i * 38, "#2b2c6a", 1) for i in range(1, 4))
land = ["M40,48 q14,-16 34,-8 q10,8 2,22 q-4,16 -14,30 q-8,-10 -10,-24 q-14,-6 -12,-20 Z", "M72,96 q12,2 12,16 q-2,18 -10,30 q-8,-14 -6,-28 Z",
        "M150,44 q16,-10 30,-2 q4,10 -6,16 q-12,2 -24,-14 Z", "M156,70 q18,-4 26,10 q2,22 -10,42 q-12,-12 -14,-30 q-6,-10 -2,-22 Z",
        "M196,40 q30,-14 62,0 q14,12 6,26 q-18,8 -30,2 q-10,10 -24,-2 q-12,-10 -14,-26 Z", "M258,112 q16,-6 26,6 q-2,12 -16,12 q-10,-4 -10,-18 Z"]
mp += "".join(path(d, fill="#2f6b6a", stroke="#3fae7a", sw=1) for d in land)
add("room_map", 320, 170, mp, inner=[9, 9, 302, 152])

# tavan lambası
lm = rect(30, 0, 4, 10, "#4a4d86", sw=1) + path("M6,24 Q32,2 58,24 Z", fill="#4a4d86") + rect(10, 22, 44, 5, "#fff3c4", r=2.5, sw=1)
add("room_lamp", 64, 30, lm)

# ------------------------------------------------------------------ hangar
st = hazard(4, 4, 132, 14, "hz1") + rect(12, 18, 116, 16, "#4a4d86", r=2) + line(12, 26, 128, 26, "#3d3f7a", 1.2)
add("hangar_stand", 140, 38, st)
cr = rect(3, 3, 54, 48, "#b98a55", r=2, sw=2) + line(3, 3, 57, 51, "#7a5a36", 2) + line(57, 3, 3, 51, "#7a5a36", 2) + rect(3, 3, 54, 7, "#a37848", r=1, sw=1.2) + rect(3, 44, 54, 7, "#a37848", r=1, sw=1.2)
add("hangar_crate", 60, 54, cr)
br = rect(4, 3, 28, 42, ORANGE, r=4) + line(4, 14, 32, 14, "#b8420e", 2.2) + line(4, 32, 32, 32, "#b8420e", 2.2) + line(10, 6, 10, 42, "#ffb07a", 1.4, .7)
add("hangar_barrel", 36, 48, br)
tb = rect(2, 2, 156, 104, "#55598a", r=3, sw=2) + "".join(circ(12 + i * 13, 12 + j * 13, .9, "#8e90c2", stroke="none") for i in range(11) for j in range(7))
tb += path("M22,20 v40 M22,20 q-7,2 -6,10 M22,20 q7,2 6,10", stroke="#d9dbf0", sw=3) + path("M48,18 l0,34 M43,52 h10 v14 h-10 Z", stroke="#d9dbf0", sw=2.6, fill=ORANGE)
tb += path("M72,18 l10,36", stroke="#d9dbf0", sw=3) + path("M96,20 v36 M90,20 h12", stroke="#d9dbf0", sw=3) + path("M120,22 l-6,30 M126,22 l6,30 M112,40 h22", stroke=YELLOW, sw=2.6)
tb += rect(14, 78, 46, 8, ORANGE, r=2, sw=1.2) + rect(68, 80, 60, 7, BLUE, r=2, sw=1.2) + rect(136, 74, 14, 16, YELLOW, r=2, sw=1.2)
add("hangar_toolboard", 160, 108, tb)
lb = rect(2, 2, 126, 22, "#14163a", r=4, sw=1.6)
add("hangar_label", 130, 26, lb)

# ------------------------------------------------------------------ rampa
def lattice(x0, x1, y0, y1, seg, col, w=4):
    s = rect(x0, y0, w, y1 - y0, col, r=1, sw=1.2) + rect(x1 - w, y0, w, y1 - y0, col, r=1, sw=1.2)
    y = y1
    while y - seg >= y0 - .1:
        s += line(x0 + w, y, x1 - w, y - seg, col, 2) + line(x1 - w, y, x0 + w, y - seg, col, 2) + line(x0, y - seg, x1, y - seg, col, 2.2)
        y -= seg
    return s
tw = lattice(20, 78, 60, 560, 50, STEEL, 5)
tw += rect(12, 40, 74, 22, STEEL_D, r=3) + rect(6, 34, 86, 8, "#6b6fa8", r=2) + rect(46, 6, 5, 30, STEEL, sw=1) + circ(48.5, 6, 4, RED, sw=1)
for i, (y, l) in enumerate([(150, 74), (270, 70), (380, 66), (470, 62)]):
    tw += rect(78, y, l, 9, "#6b6fa8", r=2) + line(78, y + 18, 78 + l * .7, y + 9, STEEL, 2) + rect(78 + l - 6, y - 2, 8, 13, ORANGE, r=2, sw=1.2)
tw += "".join(rect(30 + (i % 2) * 22, 110 + i * 52, 9, 6, YELLOW, r=1, sw=.8) for i in range(8))
add("pad_tower", 170, 564, tw, base=[49, 560])
pf = hazard(4, 4, 312, 22, "hz2") + rect(4, 26, 312, 10, "#3d3f7a", r=2)
pf += rect(46, 36, 26, 58, STEEL_D, r=2) + rect(248, 36, 26, 58, STEEL_D, r=2) + line(72, 40, 248, 92, "#3d3f7a", 3) + line(248, 40, 72, 92, "#3d3f7a", 3) + rect(40, 90, 240, 6, "#3d3f7a", r=2)
add("pad_platform", 320, 98, pf, deck=[160, 4])
lt = lattice(12, 28, 50, 600, 40, "#6b6fa8", 2.5) + rect(18, 20, 4, 32, "#6b6fa8", sw=1) + circ(20, 18, 4, RED, sw=1)
add("pad_lightning", 40, 604, lt, base=[20, 600])
wt = rect(22, 150, 7, 190, "#6b6fa8", sw=1.2) + rect(81, 150, 7, 190, "#6b6fa8", sw=1.2) + line(26, 338, 84, 250, "#6b6fa8", 2) + line(84, 338, 26, 250, "#6b6fa8", 2) + line(26, 250, 84, 162, "#6b6fa8", 2) + line(84, 250, 26, 162, "#6b6fa8", 2)
wt += rect(6, 70, 98, 84, "#8e90c2", r=6) + ell(55, 70, 49, 12, "#b9bcec") + rect(6, 104, 98, 12, ORANGE, r=1, sw=1.2) + line(92, 78, 92, 148, "#d9dbf0", 2, .6)
add("pad_water", 110, 344, wt, base=[55, 340])
def hills(col, ol, base, amp, ph, f1, f2):
    pts = "".join(f"L{x},{base - amp * (.5 + .5 * math.sin(x * f1 * 2 * math.pi / 1280 + ph)) - 6 * math.sin(x * f2 * 2 * math.pi / 1280 + ph * 2):.1f} " for x in range(0, 1281, 20))
    return f'<path d="M0,160 {pts} L1280,160 Z" fill="{col}" stroke="{ol}" stroke-width="2"/>'
add("pad_hills_far", 1280, 160, hills("#8fb4d6", "#6f95ba", 110, 70, 1.0, 2, 7), noFilter=True)
add("pad_hills_near", 1280, 160, hills("#5f9a62", "#4a7d4e", 130, 50, 2.6, 3, 9), noFilter=True)
ap = path("M90,6 H810 L896,96 H4 Z", fill="#9a9eb2") + line(90, 6, 810, 6, "#d4d7e4", 2.4)
ap += "".join(line(60 + i * 44, 62, 82 + i * 44, 62, YELLOW, 3, .8) for i in range(18)) + line(250, 6, 200, 96, "#7f8398", 1.6) + line(650, 6, 700, 96, "#7f8398", 1.6)
add("pad_apron", 900, 100, ap)

# bulut ve duman
def puff(circles, fill, shade, ol=OL, sw=1.6):
    d = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{ol}"/>' for x, y, r in [(x, y, r + sw) for x, y, r in circles])
    d += "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>' for x, y, r in circles)
    d += "".join(f'<path d="M{x-r*.55},{y+r*.35} q{r*.5},{r*.4} {r*1.05},{-r*.05}" fill="none" stroke="{shade}" stroke-width="1.6" stroke-linecap="round"/>' for x, y, r in circles[::2])
    return d
add("fx_cloud_1", 280, 120, puff([(60, 78, 34), (104, 58, 44), (158, 62, 40), (206, 78, 32), (132, 86, 30), (84, 88, 26), (182, 90, 24)], "#efeaff", "#c9c0ee", ol="#8c82c4"))
add("fx_cloud_2", 240, 110, puff([(50, 70, 30), (92, 52, 38), (140, 60, 34), (184, 72, 28), (116, 80, 26)], "#e6e0fb", "#c2b8ea", ol="#8c82c4"))
add("fx_cloud_3", 200, 96, puff([(44, 60, 26), (82, 46, 32), (126, 54, 30), (158, 64, 22)], "#f4f0ff", "#cfc7f0", ol="#8c82c4"))
add("fx_smoke_1", 120, 112, puff([(40, 66, 28), (70, 46, 32), (84, 74, 26), (54, 84, 22)], "#e9e6f2", "#bdb8d0", ol="#8a86a0"))
add("fx_smoke_2", 120, 112, puff([(46, 50, 30), (78, 62, 30), (52, 80, 24), (34, 66, 20)], "#dcd8ea", "#b3aecb", ol="#8a86a0"))
add("fx_smoke_3", 120, 112, puff([(60, 56, 36), (36, 70, 22), (86, 74, 22)], "#f2f0f8", "#c6c2d8", ol="#8a86a0"))

# Dünya yayı (yörünge sahnesi)
ea = '<clipPath id="ec"><rect x="0" y="0" width="1280" height="340"/></clipPath><g clip-path="url(#ec)">'
ea += '<ellipse cx="640" cy="1500" rx="1900" ry="1480" fill="#7fc4ff" opacity=".35"/><ellipse cx="640" cy="1500" rx="1880" ry="1462" fill="#2f6fd0" stroke="#bfe2ff" stroke-width="5"/>'
for d in ["M120,180 q80,-60 190,-40 q60,30 30,90 q-90,50 -200,30 q-70,-30 -20,-80 Z", "M520,70 q120,-34 230,10 q50,40 -20,80 q-110,30 -190,-10 q-60,-40 -20,-80 Z",
          "M900,150 q110,-50 230,0 q50,50 -30,110 q-120,30 -200,-20 q-40,-50 0,-90 Z", "M330,270 q90,-30 170,10 q20,50 -60,80 q-100,10 -130,-40 Z"]:
    ea += f'<path d="{d}" fill="#3fae7a" stroke="#2a8a5c" stroke-width="3"/>'
for d in ["M200,110 q60,-18 120,0 q40,14 90,2", "M640,200 q70,-22 150,-4 q50,12 110,-6", "M60,260 q50,-14 110,0", "M980,90 q50,-12 100,0 q30,8 70,0", "M760,300 q60,-16 130,0"]:
    ea += f'<path d="{d}" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity=".85"/>'
ea += '</g>'
add("bg_earth_limb", 1280, 340, ea, noFilter=True)


# ------------------------------------------------------------------ oda detayları (2. tur)
sh_ = rect(2, 2, 146, 118, "#3d3f7a", r=3, sw=2)
for yy in (40, 80): sh_ += rect(2, yy, 146, 5, "#6b6fa8", r=1, sw=1.2)
bk = [("#ff6a1f", 14), ("#5be3b0", 10), ("#6fb4ff", 16), ("#ffd23f", 11), ("#e9eef7", 9), ("#b37bff", 13)]
for row, yy in enumerate((6, 46, 86)):
    x_ = 8
    for i, (c, w_) in enumerate(bk * 2):
        if x_ + w_ > 140: break
        h_ = 28 + ((i * 7 + row * 3) % 6)
        sh_ += rect(x_, yy + 34 - h_, w_, h_, c, r=1, sw=1.1) + line(x_ + 3, yy + 34 - h_ + 4, x_ + 3, yy + 30, "#00000033", 1)
        x_ += w_ + 3
add("room_shelf", 150, 122, sh_)
cf = rect(4, 6, 34, 46, "#55598a", r=3) + rect(8, 12, 26, 14, "#14163a", r=2, sw=1) + circ(21, 19, 3, RED, sw=.8) + rect(10, 32, 22, 12, "#23244f", r=1, sw=1) + rect(14, 44, 14, 8, "#f4f5fa", r=1, sw=1) + rect(0, 52, 42, 6, "#3d3f7a", r=2)
add("room_coffee", 44, 60, cf)
ex = rect(4, 10, 14, 34, RED, r=5) + rect(7, 4, 8, 8, "#2d2b3a", r=2, sw=1) + path("M15,6 q8,0 8,10", sw=1.6) + rect(5, 22, 12, 8, "#f4f5fa", r=1, sw=.8)
add("room_extinguisher", 26, 46, ex)
cl = circ(32, 32, 28, "#f4f5fa", sw=2.4) + circ(32, 32, 24, "none", stroke="#8e90c2", sw=1) + "".join(line(32 + 21 * math.sin(a * math.pi / 6), 32 - 21 * math.cos(a * math.pi / 6), 32 + 24 * math.sin(a * math.pi / 6), 32 - 24 * math.cos(a * math.pi / 6), "#2b2c5e", 1.6) for a in range(12))
add("room_clock", 64, 64, cl)
bd = rect(2, 2, 206, 118, "#2b2c5e", r=6, sw=2) + rect(10, 10, 190, 102, "#14163a", r=3, sw=1.2) + rect(10, 10, 190, 16, "#23244f", r=3, sw=1)
add("room_board", 210, 124, bd, inner=[10, 10, 190, 102])
bn = rect(2, 30, 196, 50, "#55598a", r=3, sw=2) + rect(2, 30, 196, 8, "#6b6fa8", r=2, sw=1.2) + rect(10, 80, 8, 14, "#4a4d86", sw=1.2) + rect(180, 80, 8, 14, "#4a4d86", sw=1.2)
bn += circ(48, 22, 7, "#8e90c2") + path("M40,22 h-14 v8", sw=1.6) + rect(80, 14, 36, 16, "#d9dbf0", r=1.5, sw=1) + rect(130, 10, 8, 20, "#b9bcec", r=1, sw=1) + path("M64,48 l24,-6 l18,14 l-30,4 Z", fill="#ff6a1f", sw=1.2) + rect(150, 40, 30, 36, "#14163a", r=2, sw=1)
bn += circ(150, 48, 2.4, MINT, sw=.6)
add("hangar_bench", 200, 100, bn)
ct = rect(4, 18, 66, 8, "#6b6fa8", r=2) + rect(8, 26, 58, 34, "#4a4d86", r=2) + line(8, 43, 66, 43, "#3d3f7a", 1.4) + circ(16, 66, 6, "#23244f") + circ(58, 66, 6, "#23244f") + rect(24, 6, 12, 12, ORANGE, r=1.5, sw=1.2) + path("M44,18 l8,-12 l8,12 Z", fill=YELLOW, sw=1.2)
add("hangar_cart", 74, 74, ct)
tk = rect(6, 8, 44, 88, "#8e90c2", r=18, sw=2) + rect(6, 36, 44, 10, ORANGE, r=1, sw=1.2) + rect(22, 0, 12, 10, "#55598a", r=2, sw=1.2) + rect(10, 92, 36, 6, "#3d3f7a", r=2, sw=1.2) + line(14, 22, 14, 86, "#e9eef7", 2, .5)
add("hangar_tank", 56, 100, tk)
vt = rect(2, 2, 56, 36, "#4a4d86", r=3, sw=1.6) + "".join(line(8, 10 + i * 7, 52, 10 + i * 7, "#23244f", 2.2) for i in range(4)) + circ(30, 20, 12, "none", stroke="#6b6fa8", sw=1.2)
add("room_vent", 60, 40, vt)
sg = rect(2, 2, 96, 40, YELLOW, r=4, sw=2) + path("M10,34 L22,10 L34,34 Z", fill="#2d2b3a", sw=1) + rect(42, 14, 48, 6, "#2d2b3a", r=1, sw=0) + rect(42, 26, 36, 5, "#2d2b3a", r=1, sw=0)
add("hangar_sign", 100, 44, sg)
cr = rect(2, 6, 300, 14, "#6b6fa8", r=2) + "".join(line(2 + i * 20, 6, 22 + i * 20, 20, "#4a4d86", 1.4) for i in range(15)) + rect(120, 20, 60, 14, ORANGE, r=2) + circ(130, 36, 4, "#2d2b3a", sw=1) + circ(170, 36, 4, "#2d2b3a", sw=1)
add("hangar_crane", 304, 42, cr)
hk = rect(2, 0, 4, 40, "#8e90c2", r=1, sw=.8) + path("M-2,40 h12 v8 q0,10 -8,10 q-8,0 -8,-10 Z", fill=ORANGE, sw=1.4)
add("hangar_hook", 12, 60, hk)
pp = rect(0, 4, 400, 14, "#55598a", r=2) + rect(0, 22, 400, 8, "#6b6fa8", r=2) + "".join(rect(40 + i * 100, 0, 6, 36, "#4a4d86", r=1, sw=1.2) for i in range(4)) + "".join(rect(60 + i * 100, 2, 10, 18, ORANGE if i % 2 else MINT, r=1, sw=1) for i in range(4))
add("hangar_pipes", 400, 36, pp)


# ------------------------------------------------------------------ uzay araçları (3. tur)
W_, FUS = "#eef0f6", "#d9dbf0"
orb = path("M20,46 L64,40 L64,84 L20,76 Z", fill="#55598a")                                   # arka motor bölümü
orb += "".join(path(f"M{14+i*0},{50+i*11} l-9,2 l0,6 l9,2 Z", fill="#2d2b3a", sw=1) for i in range(3))
orb += path("M62,40 L196,42 Q236,46 252,64 Q236,80 196,84 L62,84 Z", fill=W_)                    # gövde ve burun
orb += path("M196,48 Q222,50 236,60 L200,60 Z", fill="#14163a", sw=1)                           # kokpit camı
orb += path("M64,40 L58,8 L92,32 L100,41 Z", fill=W_)                                          # dikey kuyruk
orb += path("M70,84 L150,84 L214,104 L120,112 Z", fill="#3d3f7a")                               # delta kanat (alt yüzey karoları)
orb += path("M70,84 L150,84 L214,104 L120,112 Z", fill="none", sw=1.4)
orb += path("M92,44 L176,46 L168,36 L100,34 Z", fill="#2d2b3a", sw=1.4)                          # açık yük bölmesi
orb += path("M100,34 L176,36 L172,22 L108,20 Z", fill=W_, sw=1.4)                                # bölme kapağı
orb += line(70, 66, 240, 68, "#b9bcec", 1.2) + rect(150, 52, 24, 7, "#14163a", r=2, sw=.8) + circ(170, 54, 1.4, MINT, sw=0)
add("craft_orbiter", 262, 120, orb)

ost = rect(92, 62, 130, 26, "#d9dbf0", r=8) + rect(92, 62, 130, 7, "#f4f5fa", r=4, sw=0) + rect(222, 66, 36, 18, "#b9bcec", r=4)
ost += rect(70, 66, 22, 18, "#8e90c2", r=3) + rect(60, 70, 12, 10, "#55598a", r=2)                    # kenetlenme limanı (soldan)
ost += rect(150, 40, 14, 22, "#8e90c2", r=3) + rect(150, 88, 14, 22, "#8e90c2", r=3)
for yy in (4, 100):
    ost += rect(110, yy, 98, 28, "#2b5fb8", r=2, sw=1.6) + "".join(line(110 + i * 16.3, yy, 110 + i * 16.3, yy + 28, "#8fb5ff", 1) for i in range(1, 6)) + line(110, yy + 14, 208, yy + 14, "#8fb5ff", 1)
ost += circ(250, 54, 9, "#f4f5fa", sw=1.4) + line(250, 63, 244, 70, OL, 1.6) + circ(112, 75, 3, MINT, sw=.6) + circ(130, 75, 3, "#ffd23f", sw=.6)
add("craft_outpost", 290, 140, ost)

prb = rect(40, 52, 50, 46, "#c9a23c", r=3) + "".join(line(40, 60 + i * 9, 90, 60 + i * 9, "#8a6a1a", 1) for i in range(4))
prb += path("M66,52 L66,28", sw=2) + path("M44,18 Q66,40 88,18 Q66,8 44,18 Z", fill="#e9eef7")
prb += rect(2, 62, 34, 26, "#2b5fb8", r=2) + rect(94, 62, 34, 26, "#2b5fb8", r=2) + line(36, 75, 40, 75, OL, 2) + line(90, 75, 94, 75, OL, 2)
prb += rect(52, 98, 26, 8, "#55598a", r=2) + circ(65, 76, 6, "#14163a", sw=1.2) + circ(65, 76, 2, MINT, sw=0)
add("craft_probe", 132, 112, prb)

lnd = rect(32, 22, 64, 56, "#e9eef7", r=14) + rect(32, 44, 64, 10, ORANGE, r=1, sw=1.2) + circ(64, 34, 8, "#14163a", sw=1.2)
lnd += path("M40,78 L18,118 M88,78 L110,118 M52,78 L44,118 M76,78 L84,118", sw=3) + "".join(rect(x - 9, 116, 18, 5, "#55598a", r=2, sw=1) for x in (18, 44, 84, 110))
lnd += path("M54,78 L74,78 L70,92 L58,92 Z", fill="#2d2b3a", sw=1.2)
add("craft_lander", 130, 126, lnd)
# ------------------------------------------------------------------ atlas
GAP = 10; AW = 2660
x = y = GAP; rowh = 0; pos = {}; parts = []
for name, w, h, body in sorted(sprites, key=lambda s: -s[2]):
    pw, ph = w * S, h * S
    if x + pw + GAP > AW: x = GAP; y += rowh + GAP; rowh = 0
    pos[name] = [x, y, pw, ph]
    flt = "" if meta[name].get("noFilter") else ' filter="url(#sk)"'
    parts.append(f'<svg x="{x}" y="{y}" width="{pw}" height="{ph}" viewBox="0 0 {w} {h}" overflow="hidden"><g{flt}>{body}</g></svg>')
    x += pw + GAP; rowh = max(rowh, ph)
AH = y + rowh + GAP
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{AW}" height="{AH}" viewBox="0 0 {AW} {AH}">'
       '<defs><filter id="sk" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="11" result="n"/>'
       '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>' + "".join(parts) + '</svg>')
open(OUT_SVG, "w").write(svg)
json.dump(dict(size=[AW, AH], scale=S, pos=pos, meta=meta), open(OUT_JSON, "w"))
print(len(sprites), "parça, atlas", AW, AH)
