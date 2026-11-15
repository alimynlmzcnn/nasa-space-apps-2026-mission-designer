# Hand-drawn style sprites of the real spacecraft used in the game (simplified from their public photos/diagrams).
# Output: assets/sats/<id>.png (transparent, 400x280). Needs headless Chrome.
import os, subprocess, sys
from PIL import Image
OUT = sys.argv[1] if len(sys.argv) > 1 else "assets/sats"
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OL = "#3d3a52"; GOLD = "#e6c24a"; GOLD2 = "#b8912a"; SILV = "#d6d9f2"; SILV2 = "#9ea2cf"; BLUE = "#3f6fd8"; BLUE2 = "#2b4aa8"; WHITE = "#f4f1ff"; DARK = "#2a2850"; RED = "#ff5a4a"

def P(d, f="none", s=OL, w=2.4, op=1): return f'<path d="{d}" fill="{f}" stroke="{s}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round" opacity="{op}"/>'
def R(x, y, w, h, f, r=3, s=OL, sw=2.4): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{f}" stroke="{s}" stroke-width="{sw}" stroke-linejoin="round"/>'
def E(cx, cy, rx, ry, f, s=OL, sw=2.4): return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{f}" stroke="{s}" stroke-width="{sw}"/>'
def L(x1, y1, x2, y2, s=OL, w=2.2): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{s}" stroke-width="{w}" stroke-linecap="round"/>'
def panel(x, y, w, h, cols=4, rows=2, f=BLUE):          # solar panel with cell grid
    g = R(x, y, w, h, f, 2)
    for i in range(1, cols): g += L(x + w * i / cols, y, x + w * i / cols, y + h, "#9db8ff", 1.2)
    for j in range(1, rows): g += L(x, y + h * j / rows, x + w, y + h * j / rows, "#9db8ff", 1.2)
    return g
def dish(cx, cy, rx, ry, rot=0):
    return f'<g transform="rotate({rot} {cx} {cy})">' + E(cx, cy, rx, ry, WHITE) + E(cx, cy, rx * .55, ry * .55, SILV) + L(cx, cy, cx, cy - ry * .15, OL, 1.6) + '</g>'
def foil(x, y, w, h): return R(x, y, w, h, GOLD, 3) + "".join(L(x + 4 + i * w / 5, y + 3, x + 2 + i * w / 5, y + h - 3, GOLD2, 1.4) for i in range(1, 5))

S = {}
# ISS: long truss, big array wings above and below, white modules in the middle
S["iss"] = (L(20, 100, 380, 100, SILV2, 6) + L(20, 100, 380, 100, OL, 1.6)
  + "".join(panel(x, 14, 40, 76, 2, 6) + panel(x, 110, 40, 76, 2, 6) for x in (30, 80, 270, 320))
  + R(160, 84, 80, 32, WHITE, 8) + R(180, 70, 40, 60, SILV, 6) + R(150, 92, 12, 16, GOLD) + R(238, 92, 12, 16, GOLD) + E(200, 70, 14, 6, SILV2)
  + R(135, 94, 28, 12, SILV, 3) + R(238, 94, 28, 12, SILV, 3) + "".join(R(150 + i * 30, 150, 18, 28, WHITE, 2) for i in range(0, 3)) )
# Hubble: silver tube with open aperture door, gold foil section, two solar wings
S["hubble"] = (panel(200, 8, 60, 70, 3, 5) + panel(200, 202, 60, 70, 3, 5) + L(230, 78, 230, 100, OL, 3) + L(230, 180, 230, 202, OL, 3)
  + R(70, 100, 250, 80, SILV, 14) + foil(240, 100, 80, 80) + R(70, 100, 40, 80, SILV2, 12) + E(70, 140, 16, 40, DARK) + P("M60 100 L40 70 L90 96 Z", SILV) + R(120, 92, 70, 10, SILV2, 3)
  + L(300, 100, 340, 66, OL, 3) + E(346, 62, 12, 10, WHITE) + L(120, 180, 100, 214, OL, 3) + E(96, 220, 10, 8, WHITE) + E(160, 140, 6, 6, RED))
# Imece: boxy bus, two fixed angled panels, camera tube below
S["imece"] = (P("M120 80 L50 40 L50 150 L120 150 Z", BLUE, OL, 2.4) + P("M280 80 L350 40 L350 150 L280 150 Z", BLUE, OL, 2.4)
  + "".join(L(50 + i * 14, 40 + i * 5.7 - 0, 50 + i * 14, 150, "#9db8ff", 1.2) for i in range(1, 5)) + "".join(L(344 - i * 14, 44, 344 - i * 14, 150, "#9db8ff", 1.2) for i in range(1, 5))
  + R(120, 70, 160, 110, SILV, 6) + foil(130, 78, 60, 94) + R(205, 80, 64, 30, SILV2, 4) + E(237, 95, 8, 8, DARK)
  + R(165, 180, 70, 80, WHITE, 6) + E(200, 262, 35, 10, DARK) + R(165, 186, 70, 10, SILV2, 2) + L(270, 70, 300, 40, OL, 3) + E(306, 36, 10, 8, WHITE) + E(150, 126, 6, 6, RED))
# Goktürk-2: boxy bus, one large panel wing, telescope tube
S["gokturk"] = (R(90, 80, 130, 100, SILV, 6) + foil(98, 88, 50, 84) + E(190, 112, 18, 18, DARK) + E(190, 112, 10, 10, SILV2)
  + L(220, 130, 250, 130, OL, 4) + panel(250, 70, 130, 110, 5, 4) + R(120, 180, 70, 76, WHITE, 6) + E(155, 258, 35, 10, DARK) + L(90, 100, 60, 70, OL, 3) + E(54, 64, 11, 9, WHITE) + E(120, 40, 4, 4, RED))
# LRO: gold box, big panel, dish on boom
S["lro"] = (R(110, 90, 120, 100, GOLD, 5) + foil(110, 90, 120, 100) + R(210, 120, 24, 50, SILV, 4) + L(230, 140, 262, 140, OL, 4) + panel(262, 60, 110, 150, 4, 5)
  + L(110, 110, 70, 70, OL, 3) + dish(58, 58, 24, 18, -25) + R(140, 190, 44, 50, WHITE, 4) + E(162, 242, 22, 8, DARK) + R(70, 140, 40, 24, SILV, 3))
# CAPSTONE: small cube with two panel wings
S["capstone"] = (panel(10, 100, 100, 70, 3, 3) + panel(290, 100, 100, 70, 3, 3) + L(110, 135, 150, 135, OL, 4) + L(290, 135, 250, 135, OL, 4)
  + R(150, 90, 100, 90, SILV, 4) + foil(154, 94, 40, 82) + R(200, 104, 40, 40, SILV2, 4) + E(220, 124, 12, 12, DARK) + L(200, 90, 200, 50, OL, 3) + E(200, 44, 7, 7, WHITE))
# ARTEMIS P1 (THEMIS): small spin-stabilised probe with long booms
S["artemis"] = (L(200, 140, 40, 140, OL, 3) + L(200, 140, 360, 140, OL, 3) + L(200, 140, 200, 30, OL, 3) + L(200, 140, 200, 250, OL, 3) + E(40, 140, 12, 12, SILV) + E(360, 140, 12, 12, SILV) + E(200, 30, 12, 12, SILV) + E(200, 250, 12, 12, SILV)
  + E(200, 172, 54, 20, GOLD2) + R(146, 120, 108, 52, GOLD, 8) + E(200, 120, 54, 18, GOLD) + "".join(L(160 + i * 20, 124, 160 + i * 20, 170, "#4a6fe0", 5) for i in range(5)))
# MRO: gold bus, big white dish, two tall panels
S["mro"] = (panel(20, 40, 100, 200, 3, 6) + panel(280, 40, 100, 200, 3, 6) + L(120, 140, 160, 140, OL, 4) + L(280, 140, 240, 140, OL, 4)
  + R(160, 100, 80, 80, GOLD, 6) + foil(160, 100, 80, 80) + L(200, 100, 200, 60, OL, 4) + dish(200, 46, 46, 30, 0) + R(176, 180, 48, 40, WHITE, 4) + E(200, 222, 24, 8, DARK))
# MAVEN: bus with two arrays, boom tips with instruments, dish
S["maven"] = (panel(30, 70, 120, 70, 4, 3) + panel(30, 150, 120, 70, 4, 3) + panel(250, 70, 120, 70, 4, 3) + panel(250, 150, 120, 70, 4, 3) + L(150, 140, 170, 140, OL, 4) + L(250, 140, 230, 140, OL, 4)
  + R(30, 40, 26, 24, SILV, 3) + R(344, 40, 26, 24, SILV, 3) + L(43, 64, 43, 70, OL, 3) + L(357, 64, 357, 70, OL, 3)
  + R(170, 100, 60, 80, GOLD, 5) + foil(170, 100, 60, 80) + L(200, 100, 200, 66, OL, 3) + dish(200, 56, 34, 22, 0))
# Mars Odyssey: bus, single array, round dish
S["odyssey"] = (R(100, 100, 100, 80, GOLD, 5) + foil(100, 100, 100, 80) + L(200, 140, 240, 140, OL, 4) + panel(240, 76, 130, 128, 5, 4)
  + L(150, 100, 150, 70, OL, 3) + dish(150, 60, 38, 26, -15) + R(120, 180, 44, 44, WHITE, 4) + E(142, 226, 22, 8, DARK) + E(110, 112, 5, 5, RED))
# Magellan: cylinder bus with a big dish on top, small panels
S["magellan"] = (panel(20, 150, 90, 70, 3, 3) + panel(290, 150, 90, 70, 3, 3) + L(110, 185, 150, 185, OL, 4) + L(290, 185, 250, 185, OL, 4)
  + R(150, 140, 100, 110, GOLD, 8) + foil(150, 140, 100, 110) + R(150, 140, 100, 22, SILV, 6) + L(200, 140, 200, 100, OL, 4) + dish(200, 70, 90, 38, 0) + E(200, 70, 30, 14, SILV))
# Pioneer Venus Orbiter: drum with a dish and mast, spinning
S["pioneer"] = (R(110, 110, 180, 90, SILV, 10) + R(110, 140, 180, 36, BLUE, 4) + "".join(L(125 + i * 22, 140, 125 + i * 22, 176, "#9db8ff", 1.2) for i in range(8)) + E(200, 110, 90, 22, SILV2)
  + dish(200, 82, 66, 26, 0) + L(200, 82, 200, 24, OL, 3) + E(200, 20, 6, 6, RED) + L(110, 160, 60, 160, OL, 3) + E(54, 160, 8, 8, SILV) + L(290, 160, 340, 160, OL, 3) + E(346, 160, 8, 8, SILV))
# Parker Solar Probe: heat shield, small bus, tiny wings
S["parker"] = (P("M120 20 L150 8 L186 4 L186 276 L150 272 L120 260 Z", "#efe7cf", OL, 2.6) + "".join(L(130 + i * 12, 26, 130 + i * 12, 254, "#c9bf9a", 1.2) for i in range(5))
  + R(186, 100, 120, 80, SILV, 6) + foil(190, 104, 40, 72) + panel(240, 40, 60, 48, 3, 2) + panel(240, 192, 60, 48, 3, 2) + L(270, 88, 270, 100, OL, 3) + L(270, 180, 270, 192, OL, 3)
  + L(306, 140, 350, 140, OL, 3) + E(356, 140, 10, 10, WHITE))
# Juno: hexagonal body with three huge panel wings and a dish
S["juno"] = (panel(10, 60, 130, 90, 5, 4) + panel(10, 160, 130, 90, 5, 4) + panel(260, 60, 130, 90, 5, 4) + panel(260, 160, 130, 90, 5, 4) + L(140, 140, 170, 140, OL, 4) + L(260, 140, 230, 140, OL, 4)
  + P("M170 100 L230 100 L250 140 L230 180 L170 180 L150 140 Z", SILV, OL, 2.6) + foil(172, 104, 56, 72) + L(200, 100, 200, 66, OL, 4) + dish(200, 50, 40, 26, 0) + R(180, 180, 40, 30, WHITE, 3))
# Galileo: umbrella dish, spinner, long boom
S["galileo"] = (P("M200 20 L120 120 L280 120 Z", "#efe7cf", OL, 2.4) + "".join(L(200, 20, 120 + i * 32, 120, "#c9bf9a", 1.3) for i in range(1, 5)) + E(200, 120, 80, 12, "#efe7cf")
  + R(170, 132, 60, 70, SILV, 5) + foil(172, 134, 56, 66) + L(230, 160, 340, 160, OL, 4) + R(334, 144, 36, 30, SILV, 3) + L(170, 170, 90, 200, OL, 4) + R(60, 192, 40, 28, GOLD2, 3) + L(230, 190, 320, 230, OL, 4) + R(310, 224, 40, 26, SILV2, 3) + E(200, 214, 20, 8, DARK))
# Europa Clipper: enormous panels, dish, radar antennas
S["clipper"] = (panel(6, 80, 150, 60, 6, 2) + panel(6, 150, 150, 60, 6, 2) + panel(244, 80, 150, 60, 6, 2) + panel(244, 150, 150, 60, 6, 2) + L(156, 140, 176, 140, OL, 4) + L(244, 140, 224, 140, OL, 4)
  + R(176, 96, 48, 90, SILV, 5) + foil(176, 96, 48, 90) + L(200, 96, 200, 60, OL, 4) + dish(200, 46, 44, 28, 0) + L(176, 186, 176, 262, OL, 3) + L(224, 186, 224, 262, OL, 3) + L(170, 262, 182, 262, OL, 6) + L(218, 262, 230, 262, OL, 6) + L(176, 110, 130, 24, OL, 2.6) + L(224, 110, 270, 24, OL, 2.6))
# Landsat 9: bus with one big solar wing and an aperture
S["landsat9"] = (R(110, 90, 100, 100, SILV, 6) + foil(116, 96, 46, 88) + E(186, 124, 14, 14, DARK) + L(210, 140, 240, 140, OL, 4) + panel(240, 50, 140, 180, 5, 6) + R(130, 190, 60, 50, WHITE, 5) + E(160, 242, 30, 9, DARK) + L(110, 110, 80, 80, OL, 3) + E(74, 74, 10, 8, WHITE))

# Türksat (geostationary communications satellite): box bus, two long wings of panels, two big reflector antennas
S["turksat"] = (panel(8, 96, 70, 88, 2, 3) + panel(82, 96, 70, 88, 2, 3) + panel(248, 96, 70, 88, 2, 3) + panel(322, 96, 70, 88, 2, 3) + L(152, 140, 170, 140, OL, 4) + L(248, 140, 230, 140, OL, 4)
  + R(170, 90, 60, 100, GOLD, 6) + foil(170, 90, 60, 100) + L(176, 100, 120, 44, OL, 3) + dish(112, 36, 40, 26, -20) + L(224, 100, 280, 44, OL, 3) + dish(288, 36, 40, 26, 20) + R(180, 190, 40, 30, SILV, 3) + E(200, 222, 20, 6, DARK))
# Goktürk-1: reconnaissance satellite, bus with two small panels and a long camera barrel
S["gokturk1"] = (panel(40, 100, 80, 70, 3, 3) + panel(280, 100, 80, 70, 3, 3) + L(120, 135, 150, 135, OL, 4) + L(280, 135, 250, 135, OL, 4) + R(150, 90, 100, 90, SILV, 6) + foil(156, 96, 40, 78)
  + R(165, 180, 70, 90, WHITE, 8) + E(200, 272, 35, 10, DARK) + R(165, 186, 70, 12, SILV2, 2) + R(165, 226, 70, 8, SILV2, 2) + L(250, 100, 280, 66, OL, 3) + E(286, 60, 10, 8, WHITE) + E(185, 110, 8, 8, DARK))
# RASAT: small box satellite with one body-mounted panel wing
S["rasat"] = (R(120, 90, 90, 90, SILV, 5) + foil(126, 96, 34, 78) + E(186, 126, 13, 13, DARK) + L(210, 135, 240, 135, OL, 4) + panel(240, 90, 100, 90, 4, 3) + R(140, 180, 50, 44, WHITE, 5) + E(165, 226, 25, 8, DARK) + L(130, 90, 100, 56, OL, 3) + E(94, 50, 9, 7, WHITE))

ids = list(S.keys()); W, H = 400, 280
cell = ""
cols = 5
for i, k in enumerate(ids):
    x, y = (i % cols) * W, (i // cols) * H
    cell += f'<g transform="translate({x} {y})"><g filter="url(#w)">{S[k]}</g></g>'
rows = (len(ids) + cols - 1) // cols
svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols*W}" height="{rows*H}" viewBox="0 0 {cols*W} {rows*H}"><defs><filter id="w" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter></defs>{cell}</svg>'
tmp = "/tmp/sats_atlas"; os.makedirs(tmp, exist_ok=True)
open(f"{tmp}/a.html", "w").write(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
subprocess.run([CH, "--headless=new", "--disable-gpu", "--default-background-color=00000000", f"--window-size={cols*W},{rows*H}", f"--screenshot={tmp}/a.png", f"file://{tmp}/a.html"], capture_output=True, timeout=90)
im = Image.open(f"{tmp}/a.png").convert("RGBA")
os.makedirs(OUT, exist_ok=True)
for i, k in enumerate(ids):
    c = im.crop(((i % cols) * W, (i // cols) * H, (i % cols) * W + W, (i // cols) * H + H)); bb = c.getbbox()
    if bb: c = c.crop((max(0, bb[0] - 6), max(0, bb[1] - 6), min(W, bb[2] + 6), min(H, bb[3] + 6)))
    c.save(f"{OUT}/{k}.png"); print(k, c.size)
