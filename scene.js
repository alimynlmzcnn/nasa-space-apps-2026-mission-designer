"use strict";
// Tüm çizim burada: iki oda (hangar, görev kontrol), rampa ve uçuş. Mantıksal tuval 1280x720.
const Scene = (() => {
  const { G, PAD, D } = Game;
  const SP = window.SPRITES, IMG = {};
  let cv, g, W = 0, H = 0, DPR = 1;
  const view = { s: 1, ox: 0, oy: 0 };
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = k => k * k * (3 - 2 * k);
  const rnd = (i, s = 1) => { const x = Math.sin(i * 78.233 + s * 12.9898) * 43758.5453; return x - Math.floor(x); };

  // Görev kontrol odası yerleşimi
  const CON = { x: 320, y: 410 };                 // amfi konsol
  const SCR = { x: 420, y: 164 };                 // büyük ekran
  const HOLE = { x: SCR.x + 18, y: SCR.y + 16.4, w: 404, h: 227.25 };   // ekranın camı (16:9)
  const ZMAX = 1280 / HOLE.w;

  // Hangar sergisi: [id, sprite, merkez x, ölçek, etiket]
  const EXH = [
    ["stage1", "rocket_sls_stage1", 120, 1.0, "CORE STAGE"],
    ["srb", "rocket_sls_srb_l", 236, 1.0, "BOOSTER"],
    ["stage2", "rocket_sls_stage2", 350, 0.95, "UPPER STAGE + ORION"],
    ["las", "rocket_sls_las", 462, 0.95, "ABORT TOWER"]
  ];
  const hits = { hangar: [], lab: [], land: [], rocket: null };

  function load(done) {
    const names = Object.keys(SP); let n = names.length;
    names.forEach(k => { const im = new Image(); im.onload = im.onerror = () => { if (--n === 0) done(); }; im._k = SP[k].k || 1; im.src = "assets/" + k + ".png"; IMG[k] = im; });
  }
  function init(canvas) { cv = canvas; g = cv.getContext("2d");
    const _di = g.drawImage.bind(g);   // 4x büyütülmüş çizimler: kaynak dikdörtgenleri özgün birimden çevir
    g.drawImage = (im, ...a) => { if (a.length === 8 && im._k > 1) for (let i = 0; i < 4; i++) a[i] *= im._k; return _di(im, ...a); }; resize(); addEventListener("resize", resize); }
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    view.s = Math.min(W / 1280, H / 720); view.ox = (W - 1280 * view.s) / 2; view.oy = (H - 720 * view.s) / 2;
  }
  const toLogical = (px, py) => [(px - view.ox) / view.s, (py - view.oy) / view.s];
  const visRect = () => ({ x0: -view.ox / view.s, y0: -view.oy / view.s, x1: (W - view.ox) / view.s, y1: (H - view.oy) / view.s });

  // ---------- temel çizim yardımcıları ----------
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function spr(name, x, y, sc = 1, flip = false) {          // üretilen asset: sol-üst köşe
    const m = SP[name], w = m.w * sc, h = m.h * sc;
    if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(IMG[name], 0, 0, w, h); g.restore(); }
    else g.drawImage(IMG[name], x, y, w, h);
  }
  const sprB = (name, cx, by, sc = 1, flip = false) => spr(name, cx - SP[name].w * sc / 2, by - SP[name].h * sc, sc, flip);
  function art(name, cx, by, sc = 1) {                      // çizimcinin asseti: içerik kutusu, alt-orta
    const c = SP[name].c; g.drawImage(IMG[name], c[0], c[1], c[2], c[3], cx - c[2] * sc / 2, by - c[3] * sc, c[2] * sc, c[3] * sc);
    return [cx - c[2] * sc / 2, by - c[3] * sc, c[2] * sc, c[3] * sc];
  }
  function docDraw(name, ax, ay, RS, top = 0, bottom = null) {   // Krita belge koordinatına göre hizalı roket parçası
    const m = SP[name], c = m.c, d = m.doc, sh = (bottom === null ? c[3] : bottom) - top;
    g.drawImage(IMG[name], c[0], c[1] + top, c[2], sh, ax + (d[0] - 297) * RS, ay + (d[1] + top - 332) * RS, c[2] * RS, sh * RS);
  }
  function flame(x, y, sx, sy, ph, t) {                     // çizimcinin 8 karelik alevi, aşağı dönük
    const k = 1 + (Math.floor(t * 12 + ph) % 8), im = IMG["fx_flame_0" + k];
    g.save(); g.translate(x, y); g.scale(sx, -sy); g.drawImage(im, -37, -218); g.restore();
  }
  function glow(x, y, r, rgb, a) {
    const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${rgb},${a})`); q.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function shadow(x, y, rw, rh = 5, a = 0.4) {
    g.save(); g.translate(x, y); g.scale(1, rh / rw); glow(0, 0, rw, "5,2,30", a); g.restore();
  }
  function cone(x, y, half, len, spread, rgb, a) {
    const q = g.createLinearGradient(0, y, 0, y + len); q.addColorStop(0, `rgba(${rgb},${a})`); q.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = q; g.beginPath(); g.moveTo(x - half, y); g.lineTo(x + half, y); g.lineTo(x + half + spread, y + len); g.lineTo(x - half - spread, y + len); g.fill();
  }
  function label(x, y, txt, size = 11, color = "#e9eef7", align = "center", weight = 700) {
    g.font = `${weight} ${size}px -apple-system,"Segoe UI",Helvetica,Arial,sans-serif`; g.textAlign = align; g.fillStyle = color; g.fillText(txt, x, y); g.textAlign = "left";
  }
  function tileBg(name, vis, off, tw, th, xo = 0) {
    const im = IMG[name]; off = ((off % th) + th) % th;
    for (let x = Math.floor((vis.x0 - xo) / tw) * tw + xo; x < vis.x1; x += tw)
      for (let y = vis.y0 - th + ((off - vis.y0) % th + th) % th; y < vis.y1; y += th) g.drawImage(im, x, y, tw + 1, th + 1);
  }

  // ---------- ortak oda kabuğu ----------
  function roomShell(pal, title, t, x0, x1) {
    const wg = g.createLinearGradient(0, 40, 0, 610); wg.addColorStop(0, pal.w0); wg.addColorStop(1, pal.w1);
    g.fillStyle = wg; g.fillRect(x0, -1500, x1 - x0, 2110);
    g.fillStyle = "rgba(255,255,255,.03)"; for (let x = 80; x < 1280; x += 160) g.fillRect(x, 40, 2, 570);
    R(x0, -1500, x1 - x0, 1544, pal.trim); R(x0, 44, x1 - x0, 3, "rgba(255,255,255,.12)");
    R(x0, 610, x1 - x0, 1500, pal.floor); R(x0, 610, x1 - x0, 3, "rgba(255,255,255,.2)");
    g.fillStyle = "rgba(255,255,255,.04)"; for (let x = 0; x < 1280; x += 64) g.fillRect(x, 613, 1, 110);
    label(26, 82, title, 22, "rgba(233,238,247,.85)", "left");
  }
  function lamp(x, t, rgb = "255,236,190") {
    cone(x, 62, 26, 520, 150, rgb, 0.16); spr("room_lamp", x - 32, 36); glow(x, 62, 70, rgb, 0.35);
  }
  function person(name, frames, cx, by, t, o = {}) {
    const f = 1 + Math.floor(t * (o.fps || 6) + (o.ph || 0)) % frames;
    shadow(cx, by, 26 * (o.sc || 1), 5, 0.35);
    sprB(`${name}_${f}`, cx, by + 4 * (o.sc || 1), o.sc || 1, !!o.flip);
  }
  function workstation(px, by, t, outfit, ph, flip) {      // masa + oturan kişi (yandan görünüş)
    const typing = Math.sin(t * 0.6 + ph * 3) > -0.45, DS = 0.8, dw = 150 * DS;
    const dx = flip ? px + 30 - dw : px - 30, name = `char_${outfit}_sit_${typing ? 1 + (Math.abs(Math.floor(t * 7 + ph)) || 0) % 2 : 1}`;
    shadow(px + (flip ? -26 : 26), by, 84, 6, 0.4);
    spr("room_desk", dx, by - 92 * DS, DS, flip);
    const mx = flip ? dx + dw - (103.5 + 31) * DS : dx + 103.5 * DS;   // monitör parıltısı
    g.fillStyle = `rgba(91,227,176,${0.12 + 0.08 * Math.sin(t * 5 + ph)})`; g.fillRect(mx, by - 92 * DS + 8 * DS, 31 * DS, 21 * DS);
    glow(mx + (flip ? 31 * DS : 0), by - 62, 44, "91,227,176", 0.16);
    sprB(name, px, by + 4, 1, flip);
  }
  function tier(x0, x1, top, pal) {
    R(x0, top, x1 - x0, 610 - top, pal.tier); R(x0, top, x1 - x0, 5, pal.tierTop); R(x0, top + 5, x1 - x0, 2, "rgba(0,0,0,.25)");
    g.fillStyle = "rgba(91,227,176,.5)"; g.fillRect(x0, top + 14, x1 - x0, 2);
  }


  // ---------- oda detayları ----------
  function skyPane(x, y, w, h, t) {   // gündüz gökyüzü: pencerelerden dışarısı Dünya gibi
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    const q = g.createLinearGradient(0, y, 0, y + h); q.addColorStop(0, "#2a6ccd"); q.addColorStop(0.6, "#6aaeee"); q.addColorStop(1, "#cfe6ff"); g.fillStyle = q; g.fillRect(x, y, w, h);
    const cw = w * 0.9, cx = x + ((t * 6 + x * 3) % (w + cw)) - cw; g.globalAlpha = 0.95; spr("fx_cloud_3", cx, y + h * 0.35, cw / 200); g.globalAlpha = 1;
    R(x, y + h - 10, w, 10, "#5f9a62"); g.restore();
  }
  function clockAt(x, y, t, label) {
    spr("room_clock", x, y); const cx = x + 32, cy = y + 32, d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, mi = d.getMinutes() + s / 60, h = (d.getHours() % 12) + mi / 60;
    const hand = (a, l, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * l, cy - Math.cos(a) * l); g.stroke(); };
    hand(h / 12 * 6.283, 14, 3, "#2b2c5e"); hand(mi / 60 * 6.283, 20, 2.2, "#2b2c5e"); hand(s / 60 * 6.283, 22, 1.2, "#ff3b3b");
    g.fillStyle = "#2b2c5e"; g.beginPath(); g.arc(cx, cy, 2.4, 0, 7); g.fill();
    if (label) label_(x + 32, y + 78, label);
  }
  const label_ = (x, y, txt) => label(x, y, txt, 9, "rgba(233,238,247,.7)");
  function hangarBack(t) {
    for (let x = 0; x < 1280; x += 400) spr("hangar_pipes", x, 48);
    for (const wx of [40, 260, 1010]) {
      skyPane(wx, 104, 110, 76, t);
      g.strokeStyle = "#5a4cc0"; g.lineWidth = 4; g.strokeRect(wx, 104, 110, 76); g.lineWidth = 2; g.beginPath(); g.moveTo(wx + 55, 104); g.lineTo(wx + 55, 180); g.moveTo(wx, 142); g.lineTo(wx + 110, 142); g.stroke();
      g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.moveTo(wx + 8, 104); g.lineTo(wx + 40, 104); g.lineTo(wx + 14, 180); g.lineTo(wx - 6, 180); g.fill();
    }
    R(0, 92, 1280, 8, "#4a4d86"); R(0, 92, 1280, 2, "rgba(255,255,255,.15)");
    spr("hangar_crane", 488, 84);
    const hx = 488 + 150 - 6, cl = 36 + 18 * Math.sin(t * 0.5);
    g.strokeStyle = "#8e90c2"; g.lineWidth = 2; g.beginPath(); g.moveTo(hx + 6, 118); g.lineTo(hx + 6, 118 + cl); g.stroke(); spr("hangar_hook", hx, 118 + cl);
    spr("room_vent", 340, 106); spr("room_vent", 1150, 108); spr("hangar_sign", 24, 214); spr("hangar_sign", 1140, 322);
    clockAt(836, 56, t);
    
    spr("room_shelf", 1108, 372);
    g.strokeStyle = "rgba(255,210,63,.28)"; g.lineWidth = 3; g.setLineDash([26, 18]); g.beginPath(); g.moveTo(0, 628); g.lineTo(1280, 628); g.stroke(); g.setLineDash([]);
  }
  function hangarFront(t) {
    shadow(1020, 614, 100, 7, 0.45); spr("hangar_bench", 840, 512);
    shadow(804, 614, 34, 5, 0.4); spr("hangar_tank", 776, 512); spr("hangar_tank", 748, 520, 0.9);
    shadow(1088, 614, 44, 5, 0.4); spr("hangar_cart", 1050, 540);
    shadow(26, 614, 20, 4, 0.4); spr("room_extinguisher", 12, 566);
    if (Math.sin(t * 2.4) > 0.2) glow(990, 540, 14, "255,200,90", 0.5);     // tezgahta kaynak ışığı
    person("char_sci_walk", 4, 1000 + 60 * Math.sin(t * 0.4 + 1), 612, t, { fps: 6, flip: Math.cos(t * 0.4 + 1) < 0 });
  }
  function controlBack(t) {
    R(0, 47, 1280, 10, "#3a2a94"); g.strokeStyle = "#5a4cc0"; g.lineWidth = 1.4; g.beginPath();
    for (let x = 0; x < 1280; x += 22) { g.moveTo(x, 47); g.lineTo(x + 11, 57); g.lineTo(x + 22, 47); } g.stroke();
    g.strokeStyle = "#1a1050"; g.lineWidth = 3; for (const x of [260, 1000]) { g.beginPath(); g.moveTo(x, 57); g.quadraticCurveTo(x + 20, 90, x + 8, 120); g.stroke(); }
    clockAt(226, 64, t, "KENNEDY"); clockAt(1200, 64, t, "UTC");
    spr("room_vent", 118, 104); spr("room_shelf", 190, 325); spr("room_shelf", 950, 330);
    // durum panosu
    const bs = 0.78, bx = 1020, by = 56; spr("room_board", bx, by, bs);
    const m = G.mission, T = m.T, ix = bx + 10 * bs + 6, iy = by + 10 * bs;
    const fmt = v => (v < 0 ? "T−" : "T+") + String(Math.floor(Math.abs(v) / 60)).padStart(2, "0") + ":" + String(Math.floor(Math.abs(v) % 60)).padStart(2, "0");
    label(ix, iy + 10, "SLS · STATUS", 8, "#b9bcec", "left"); label(ix + 140, iy + 10, m.phase === "ready" ? "STANDBY" : fmt(T), 8.5, m.phase === "ready" ? "#ffd23f" : "#5be3b0", "right");
    [["FUEL", "#5be3b0"], ["POWER", "#5be3b0"], ["WEATHER", "#ffd23f"], ["TRAJ.", "#5be3b0"]].forEach(([n, c], i) => {
      const y = iy + 26 + i * 13; label(ix, y, n, 8, "#e9eef7", "left");
      const on = i === 2 ? Math.sin(t * 2) > 0 : true; g.fillStyle = on ? c : "#3a3f6b"; g.beginPath(); g.arc(ix + 136, y - 3, 3, 0, 7); g.fill(); if (on) glow(ix + 136, y - 3, 8, c === "#5be3b0" ? "91,227,176" : "255,210,63", 0.5);
      g.fillStyle = "#23244f"; g.fillRect(ix + 48, y - 7, 66, 6); g.fillStyle = c; g.fillRect(ix + 48, y - 7, 66 * (0.55 + 0.4 * Math.sin(t * 0.5 + i * 2) * 0.5 + 0.2), 6);
    });
  }
  function controlTier(t) {
    shadow(184, 440, 18, 4, 0.4); spr("room_extinguisher", 162, 394);
    shadow(1112, 440, 26, 4, 0.4); spr("room_coffee", 1090, 380);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.lineCap = "round"; for (let i = 0; i < 2; i++) { const p = (t * 0.7 + i * 0.5) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.moveTo(1108 + i * 5, 378 - p * 22); g.quadraticCurveTo(1112 + i * 5 + Math.sin(p * 9) * 3, 368 - p * 22, 1108 + i * 5, 360 - p * 22); g.stroke(); } g.globalAlpha = 1;
  }
  function controlFloor(t) {
    const paths = [[[330, 640], [250, 700], [140, 640], [30, 696]], [[950, 640], [1030, 700], [1140, 640], [1250, 696]]];
    for (const [a, b, c, d] of paths) {
      g.strokeStyle = "#0e0838"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(...a); g.bezierCurveTo(...b, ...c, ...d); g.stroke();
      g.strokeStyle = "#3a2a94"; g.lineWidth = 3; g.stroke();
      const u = (t * 0.25) % 1, x = (1 - u) ** 3 * a[0] + 3 * (1 - u) ** 2 * u * b[0] + 3 * (1 - u) * u * u * c[0] + u ** 3 * d[0], y = (1 - u) ** 3 * a[1] + 3 * (1 - u) ** 2 * u * b[1] + 3 * (1 - u) * u * u * c[1] + u ** 3 * d[1];
      glow(x, y, 14, "91,227,176", 0.7);
    }
  }

  // ---------- GÖREV KONTROL ----------
  const PALC = { w0: "#2c1c7c", w1: "#1c1158", trim: "#150c44", floor: "#140b40", tier: "#2a1d74", tierTop: "#5a4cc0" };
  // ---------- Mission Control: a 3D room (one-point perspective) drawn in the artist's hand-drawn style ----------
  const VPY = 262, FY = 458, ZB = 1.0, ks = z => 1 / (1 + z);
  const P3 = (X, Y, z) => [640 + X * ks(z), VPY + (FY - Y) * ks(z)];   // X sideways, Y height, z depth (0 = nearest)
  const INK = "#2b2268";
  function sk_edge(a, b, col, lw) {            // a hand-drawn line: slightly wobbly, rounded
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24)), sd = Math.round(a[0] * 7 + a[1] * 13 + b[0] * 3);
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    for (let j = 0; j <= n; j++) { const k = j / n, x = a[0] + (b[0] - a[0]) * k + (j && j < n ? (rnd(sd + j, 3) - 0.5) * 2.6 : 0), y = a[1] + (b[1] - a[1]) * k + (j && j < n ? (rnd(sd + j, 5) - 0.5) * 2.6 : 0); j ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  function shape(pts, fill, line = INK, lw = 3, hatch = 0) {   // flat colour + hand-drawn outline (+ optional pencil hatching)
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = fill; g.fill();
    if (hatch) { g.save(); g.clip(); g.strokeStyle = `rgba(255,255,255,${hatch})`; g.lineWidth = 1.2; g.beginPath(); for (let x = -720; x < 1400; x += 13) { g.moveTo(x, 760); g.lineTo(x + 560, -40); } g.stroke(); g.restore(); }
    if (line) for (let i = 0; i < pts.length; i++) sk_edge(pts[i], pts[(i + 1) % pts.length], line, lw);
  }
  const OFFC = {};
  const offc = (id, w, h) => { if (!OFFC[id] || OFFC[id].width !== w) { const c = document.createElement("canvas"); c.width = w; c.height = h; OFFC[id] = c; } return OFFC[id]; };
  function wallPic(side, z0, z1, Y0, Y1, cv) {     // pictures on the side walls are squeezed into perspective strip by strip
    const N = 44, pad = 6;
    shape([P3(side * 640, Y0 - pad, z0 - 0.01), P3(side * 640, Y1 + pad, z0 - 0.01), P3(side * 640, Y1 + pad, z1 + 0.01), P3(side * 640, Y0 - pad, z1 + 0.01)], "#3a2f8f", INK, 2.5);
    for (let k = 0; k < N; k++) {
      const za = side < 0 ? z0 + (z1 - z0) * k / N : z1 - (z1 - z0) * k / N, zb = side < 0 ? z0 + (z1 - z0) * (k + 1) / N : z1 - (z1 - z0) * (k + 1) / N;
      const xa = P3(side * 640, 0, za)[0], xb = P3(side * 640, 0, zb)[0], sm = ks((za + zb) / 2);
      g.drawImage(cv, k * cv.width / N, 0, cv.width / N, cv.height, Math.min(xa, xb), VPY + (FY - Y1) * sm, Math.abs(xb - xa) + 0.8, (Y1 - Y0) * sm);
    }
  }
  function sprAt(name, X, Y, z, sc = 1, flip = false) { const p = P3(X, Y, z), k = ks(z) * sc; g.save(); g.translate(p[0], p[1]); g.scale(k, k); spr(name, 0, 0, 1, flip); g.restore(); }
  function stationAt(X, z, t, outfit, ph, flip) {   // the artist's desk + seated person, placed in the room with depth scaling
    const p = P3(X, 0, z), k = ks(z) * 1.22; g.save(); g.translate(p[0], p[1]); g.scale(k, k); workstation(0, 0, t, outfit, ph, flip); g.restore();
  }
  // ---- desks in rows across the room, seen from behind like a real control room. Every desk is different. ----
  const SKINS = ["#f1c9a5", "#c98f66", "#8d5a3c", "#e8b894", "#b97a52"], HAIRS = ["#2b1a12", "#6b4423", "#1a1a1a", "#d9b25a", "#4a2f1d", "#8a8a98"], SHIRTS = ["#e8e8f8", "#ff7a3d", "#5a82d8", "#2d3668", "#e8e8f8", "#6fb4a0"];
  const DESKC = [{ t: "#7d78c8", f: "#3b3a82" }, { t: "#9db0d8", f: "#4a5a96" }, { t: "#c9a46c", f: "#7a5a34" }, { t: "#72bba8", f: "#2f6a5c" }];
  const M1 = [[0, 84, 56, 88]], M2 = [[-36, 62, 46, 88], [36, 62, 46, 88]], M3 = [[-56, 52, 40, 88], [0, 52, 40, 88], [56, 52, 40, 88]], M2S = [[0, 66, 40, 86], [0, 66, 40, 128]];
  function screenFill(ix, iy, iw, ih, t, ph, k) {                // what a screen shows (wave / text rows / bar chart)
    g.fillStyle = "#0f3042"; g.fillRect(ix, iy, iw, ih); g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    const mode = Math.abs(Math.floor(ph * 3)) % 3;
    if (mode === 0) { g.strokeStyle = k % 2 ? "#ffd23f" : "#5be3b0"; g.lineWidth = Math.max(1, iw / 28); g.beginPath(); for (let i = 0; i <= iw; i += 3) { const yy = iy + ih * 0.4 + Math.sin(t * 2.4 + i / iw * 9 + ph) * ih * 0.16; i ? g.lineTo(ix + i, yy) : g.moveTo(ix, yy); } g.stroke(); }
    else if (mode === 1) { for (let r = 0; r < 6; r++) { g.fillStyle = r % 3 ? "rgba(91,227,176,.55)" : "rgba(255,210,63,.7)"; g.fillRect(ix + iw * 0.06, iy + ih * (0.1 + r * 0.14), iw * 0.88 * (0.3 + 0.6 * Math.abs(Math.sin(t * 0.5 + r * 1.3 + ph))), Math.max(1.2, ih * 0.06)); } }
    else { for (let c = 0; c < 6; c++) { const hh = ih * (0.25 + 0.6 * Math.abs(Math.sin(t * 0.9 + c * 1.1 + ph))); g.fillStyle = c % 2 ? "#6fb4ff" : "#5be3b0"; g.fillRect(ix + iw * (0.08 + c * 0.15), iy + ih - hh - 2, iw * 0.1, hh); } }
    g.restore();
  }
  function monitorGroup(X, z, t, ph, k, ms, yo) {      // one combined monitor asset: a single frame with 1-3 screens inside and a single stand
    const x0 = Math.min(...ms.map(m => m[0] - m[1] / 2)), x1 = Math.max(...ms.map(m => m[0] + m[1] / 2)), y0 = Math.min(...ms.map(m => m[3])) + yo, y1 = Math.max(...ms.map(m => m[3] + m[2])) + yo, zz = z + 0.03, pad = 4;
    const a = P3(X + x0 - pad, y1 + pad, zz), b = P3(X + x1 + pad, y0 - pad, zz), kk = ks(z);
    glow((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (b[0] - a[0]) * 0.7, k % 2 ? "255,210,63" : "91,227,176", 0.12);
    const st = P3(X + (x0 + x1) / 2, y0 - pad, zz); R(st[0] - 4 * kk, st[1] - 1, 8 * kk, 13 * kk, "#1e1b52"); R(st[0] - 13 * kk, st[1] + 11 * kk, 26 * kk, 4 * kk, "#232060");
    shape([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], "#232060", INK, 2.8);
    ms.forEach((m, i) => { const p = P3(X + m[0] - m[1] / 2, m[3] + m[2] + yo, zz), q = P3(X + m[0] + m[1] / 2, m[3] + yo, zz); screenFill(p[0], p[1], q[0] - p[0], q[1] - p[1], t, ph + i * 0.9, k + i); g.strokeStyle = INK; g.lineWidth = 1.2; g.strokeRect(p[0], p[1], q[0] - p[0], q[1] - p[1]); });
  }
  function deskAcc(kind, X, z, t) {
    const Yd = 74, p = P3(X, Yd, z + 0.04), k = ks(z);
    if (kind === "mug") { R(p[0] - 5 * k, p[1] - 14 * k, 10 * k, 14 * k, "#f4f0ff"); g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(p[0] - 5 * k, p[1] - 14 * k, 10 * k, 14 * k); g.beginPath(); g.arc(p[0] + 6 * k, p[1] - 7 * k, 3.5 * k, -1.4, 1.4); g.stroke(); }
    else if (kind === "bottle") { R(p[0] - 4 * k, p[1] - 22 * k, 8 * k, 22 * k, "#6fb4ff"); R(p[0] - 2 * k, p[1] - 28 * k, 4 * k, 6 * k, "#f4f0ff"); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(p[0] - 4 * k, p[1] - 22 * k, 8 * k, 22 * k); }
    else if (kind === "papers") { shape([[p[0] - 24 * k, p[1] - 3 * k], [p[0] + 18 * k, p[1] - 3 * k], [p[0] + 24 * k, p[1] + 4 * k], [p[0] - 18 * k, p[1] + 4 * k]], "#f4f0ff", INK, 1.8); shape([[p[0] - 20 * k, p[1] - 6 * k], [p[0] + 14 * k, p[1] - 6 * k], [p[0] + 20 * k, p[1] + 1 * k], [p[0] - 14 * k, p[1] + 1 * k]], "#d9d4f5", INK, 1.5); }
    else if (kind === "laptop") { shape([[p[0] - 24 * k, p[1] - 30 * k], [p[0] + 24 * k, p[1] - 30 * k], [p[0] + 24 * k, p[1] - 2 * k], [p[0] - 24 * k, p[1] - 2 * k]], "#4a4a78", INK, 2); g.fillStyle = "#cfd0f0"; g.beginPath(); g.arc(p[0], p[1] - 16 * k, 3.4 * k, 0, 7); g.fill(); }
    else if (kind === "flag") { sk_edge([p[0], p[1]], [p[0], p[1] - 34 * k], "#f4f0ff", 2); const fx = p[0], fy = p[1] - 34 * k; for (let i = 0; i < 5; i++) R(fx, fy + i * 3.4 * k, 24 * k, 3.4 * k, i % 2 ? "#f4f0ff" : "#e23c3c"); R(fx, fy, 10 * k, 10 * k, "#2a3f9f"); g.strokeStyle = INK; g.lineWidth = 1.3; g.strokeRect(fx, fy, 24 * k, 17 * k); }
    else if (kind === "plant") { R(p[0] - 6 * k, p[1] - 10 * k, 12 * k, 10 * k, "#b86a3a"); g.strokeStyle = "#4aa86a"; g.lineWidth = 2.2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(p[0], p[1] - 10 * k); g.quadraticCurveTo(p[0] + i * 7 * k, p[1] - 22 * k, p[0] + i * 11 * k, p[1] - 30 * k); g.stroke(); } }
  }
  function deskSign(X, z, text) {
    const p = P3(X, 232, z + 0.03), k = ks(z), w = 118 * k, h = 24 * k; sk_edge([p[0], p[1] + h], [p[0], P3(X, 170, z + 0.03)[1]], INK, 2);
    shape([[p[0] - w / 2, p[1]], [p[0] + w / 2, p[1]], [p[0] + w / 2, p[1] + h], [p[0] - w / 2, p[1] + h]], "#3a6fe0", INK, 2.4); label(p[0], p[1] + h * 0.7, text, Math.max(6, 11 * k), "#f4f0ff");
  }
  let CEL = "";                            // mission success: everybody in Mission Control cheers
  function backPerson(X, z, t, ph, o) {      // a hand-drawn person seen from behind at a desk
    const p = P3(X, 0, z), k = ks(z), sway = Math.sin(t * 0.7 + ph) * (o.pose === "turn" ? 7 : 2.2), ty = Math.sin(t * 7 + ph) * 2;
    const sk = SKINS[o.sk || 0], hr = HAIRS[o.hr || 0], sh = SHIRTS[o.sh || 0], lw = 2.6, wide = o.pose === "wide" ? 1.18 : 1, lean = (o.pose === "lean" ? 7 : 0) + (CEL === "lose" ? 6 : 0);
    const outline = () => { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round"; g.stroke(); g.save(); g.translate(0.9, 0.7); g.globalAlpha = 0.45; g.stroke(); g.restore(); };
    g.save(); g.translate(p[0], p[1]); g.scale(k * wide, k);
    const jy = CEL === "win" ? -Math.abs(Math.sin(t * 5.2 + ph * 1.3)) * 34 : 0; g.save(); g.translate(0, jy);
    g.fillStyle = sh;
    if (CEL === "lose") for (const sd of [-1, 1]) { g.save(); g.translate(sd * 38, -100 + lean); g.rotate(-sd * (0.62 + Math.sin(t * 9 + ph + sd) * 0.05)); g.beginPath(); g.roundRect(-8, -48, 16, 56, 8); g.fill(); outline(); g.fillStyle = sk; g.beginPath(); g.arc(0, -50, 7.5, 0, 7); g.fill(); outline(); g.fillStyle = sh; g.restore(); }
    else if (CEL) for (const sd of [-1, 1]) { g.save(); g.translate(sd * 38, -100); g.rotate(sd * (0.32 + Math.sin(t * 10 + ph + sd) * 0.22)); g.beginPath(); g.roundRect(-8, -48, 16, 56, 8); g.fill(); outline(); g.fillStyle = sk; g.beginPath(); g.arc(0, -50, 7.5, 0, 7); g.fill(); outline(); g.fillStyle = sh; g.restore(); }
    else { g.beginPath(); g.roundRect(-46, -98 + ty, 16, 46, 8); g.fill(); outline(); }
    if (CEL) {}
    else if (o.pose === "hand") { g.save(); g.translate(38, -100); g.rotate(-0.9 + Math.sin(t * 2 + ph) * 0.08); g.beginPath(); g.roundRect(-8, -42, 16, 50, 8); g.fill(); outline(); g.fillStyle = sk; g.beginPath(); g.arc(0, -44, 7, 0, 7); g.fill(); outline(); g.restore(); }
    else { g.beginPath(); g.roundRect(30, -98 - ty, 16, 46, 8); g.fill(); outline(); }
    g.fillStyle = sh; g.beginPath(); g.roundRect(-30, -108 + lean, 60, 64 - lean, [24, 24, 6, 6]); g.fill(); outline();
    if (o.sh === 1) { g.fillStyle = "#ffd23f"; g.fillRect(-30, -76, 60, 6); g.fillRect(-30, -62, 60, 4); }
    if (o.sh === 0 || o.sh === 4) { g.strokeStyle = "rgba(20,12,70,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -106 + lean); g.lineTo(0, -48); g.stroke(); }
    const hx = sway + (CEL === "lose" ? Math.sin(t * 9 + ph) * 2.2 : 0), hy = -136 + lean;
    g.fillStyle = sk; g.beginPath(); g.roundRect(hx * 0.5 - 8, -126 + lean, 16, 24, 4); g.fill(); outline();
    if (o.long) { g.fillStyle = hr; g.beginPath(); g.roundRect(hx - 17, hy - 4, 34, 46, 12); g.fill(); outline(); }
    g.fillStyle = sk; g.beginPath(); g.arc(hx - 15.5, hy + 4, 3.6, 0, 7); g.arc(hx + 15.5, hy + 4, 3.6, 0, 7); g.fill(); outline();
    g.beginPath(); g.arc(hx, hy, 15.5, 0, 7); g.fill(); outline();
    if (o.hr >= 0) { g.fillStyle = hr; g.beginPath(); g.ellipse(hx, hy - 2, 15.8, 14.2, 0, 0, 7); g.fill(); outline(); }
    if (o.pose === "turn") { const sd = Math.sin(t * 0.7 + ph) > 0 ? 1 : -1; g.fillStyle = sk; g.beginPath(); g.ellipse(hx + sd * 12, hy + 3, 4.5, 9, 0, 0, 7); g.fill(); }
    if (o.hs) { g.strokeStyle = "#14102e"; g.lineWidth = 3; g.beginPath(); g.arc(hx, hy, 17, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); g.fillStyle = "#14102e"; g.beginPath(); g.roundRect(hx - 22, hy - 2, 8, 13, 3); g.roundRect(hx + 14, hy - 2, 8, 13, 3); g.fill(); }
    if (CEL === "lose") for (let n = 0; n < 12; n++) { const sd = n % 2 ? 1 : -1, u = (t * 1.3 + ph * 0.37 + n / 12) % 1, x = hx + sd * (16 + u * 58), y = hy + 2 + u * u * 80 - u * 30, r = 1 - u * 0.35; g.fillStyle = "rgba(150,215,255," + (1 - u * 0.75) + ")"; g.strokeStyle = "rgba(255,255,255," + (0.9 - u * 0.7) + ")"; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y, 5.5 * r, 8 * r, 0, 0, 7); g.fill(); g.stroke(); }
    g.restore();
    g.fillStyle = "#3b3085"; g.beginPath(); g.roundRect(-33, -74, 66, 36, 12); g.fill(); outline();
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 2; g.beginPath(); g.moveTo(-22, -64); g.lineTo(22, -64); g.stroke();
    g.restore();
  }
  function deskStation(X, z, o, t, ph) {       // one desk piece with its own monitors, clutter and person
    const Yd = 74, d = 0.1, w = o.w, x0 = X - w / 2, x1 = X + w / 2, dc = DESKC[o.d || 0];
    const sh = P3(X, 0, z + d / 2); g.save(); g.translate(sh[0], sh[1]); g.scale(1, 0.12); glow(0, 0, w * ks(z) * 0.62, "4,2,28", 0.55); g.restore();
    if (o.riser) { shape([P3(x0 + 6, 120, z + d), P3(x1 - 6, 120, z + d), P3(x1 - 6, 120, z + d + 0.06), P3(x0 + 6, 120, z + d + 0.06)], dc.t, INK, 2.6); shape([P3(x0 + 6, 120, z + d), P3(x1 - 6, 120, z + d), P3(x1 - 6, Yd, z + d), P3(x0 + 6, Yd, z + d)], dc.f, INK, 2.6); }
    shape([P3(x0, Yd, z), P3(x1, Yd, z), P3(x1, 0, z), P3(x0, 0, z)], dc.f, INK, 3, 0.05); shape([P3(x0, Yd, z), P3(x1, Yd, z), P3(x1, Yd, z + d), P3(x0, Yd, z + d)], dc.t, INK, 3, 0.07);
    if (o.w > 140) sk_edge(P3(X, Yd - 8, z), P3(X, 10, z), "rgba(20,12,70,.55)", 2);
    const ry = o.riser ? 46 : 0;
    monitorGroup(X, z, t, ph, o.k || 0, o.m, o.riser ? 46 : 0);
    if (o.acc) deskAcc(o.acc, X + (o.accx || 52), z, t);
    if (o.sign) deskSign(X, z, o.sign);
    backPerson(X + (o.px || 0), z - 0.07, t, ph, o.p || {});
  }
  function deskRows(t) {
    const rows = [
      [0.64, [[-640, [{ w: 160, m: M3, d: 1, acc: "papers", accx: 40, p: { sk: 0, hr: 2, sh: 3, hs: 1, pose: "lean" } }, { w: 150, m: M2, d: 1, acc: "mug", p: { sk: 2, hr: 0, sh: 0, pose: "turn" } }, { w: 160, m: M1, d: 1, acc: "flag", p: { sk: 3, hr: 3, sh: 2, long: 1 } }]],
               [170, [{ w: 150, m: M2, d: 0, acc: "bottle", p: { sk: 4, hr: 4, sh: 4, hs: 1 } }, { w: 160, m: M3, d: 0, acc: "laptop", sign: "COMM", p: { sk: 1, hr: -1, sh: 1, pose: "wide" } }, { w: 160, m: M2, d: 0, acc: "mug", p: { sk: 0, hr: 5, sh: 3, pose: "lean" } }]]]],
      [0.38, [[-640, [{ w: 170, m: M2, d: 2, acc: "papers", p: { sk: 1, hr: 1, sh: 1, hs: 1, pose: "lean" } }, { w: 140, m: M1, d: 2, acc: "plant", sign: "FLIGHT", p: { sk: 4, hr: 5, sh: 0, pose: "wide" } }, { w: 150, m: M2, d: 2, acc: "mug", p: { sk: 0, hr: 4, sh: 2, pose: "turn", long: 1 } }, { w: 90, m: M1, d: 2, acc: "bottle", p: { sk: 3, hr: 0, sh: 4, hs: 1 } }]],
               [150, [{ w: 140, m: M3, d: 3, acc: "laptop", p: { sk: 3, hr: 0, sh: 3, hs: 1, pose: "lean" } }, { w: 150, m: M2, d: 3, acc: "bottle", sign: "GROUND CONTROL", p: { sk: 2, hr: 2, sh: 4 } }, { w: 120, m: M1, d: 3, acc: "flag", p: { sk: 0, hr: 3, sh: 1, pose: "turn" } }, { w: 80, m: M1, d: 3, acc: "mug", p: { sk: 1, hr: 1, sh: 5, hs: 1 } }]]]],
      [0.1, [[-640, [{ w: 150, m: M2, d: 0, acc: "mug", p: { sk: 0, hr: 0, sh: 1, hs: 1, pose: "lean" } }, { w: 140, m: M3, d: 2, acc: "papers", p: { sk: 1, hr: 2, sh: 0, pose: "turn" } }, { w: 150, m: M1, d: 1, acc: "plant", p: { sk: 4, hr: 4, sh: 3, long: 1 } }, { w: 120, m: M2, d: 3, acc: "bottle", p: { sk: 2, hr: 5, sh: 2, hs: 1 } }]],
              [90, [{ w: 130, m: M2, d: 3, acc: "flag", p: { sk: 3, hr: 3, sh: 2, long: 1, hs: 1 } }, { w: 150, m: M1, d: 2, acc: "papers", p: { sk: 0, hr: 1, sh: 0, pose: "wide" } }, { w: 150, m: M3, d: 1, acc: "mug", p: { sk: 4, hr: 2, sh: 1, hs: 1 } }, { w: 120, m: M2, d: 0, acc: "laptop", p: { sk: 1, hr: 0, sh: 4, pose: "turn" } }]]]]
    ];
    for (const [z, segs] of rows) {
      const list = []; for (const [x, sts] of segs) { let cx = x; sts.forEach((o, i) => { list.push([cx + o.w / 2, o]); cx += o.w; }); }
      list.forEach(([X, o], i) => deskStation(X, z, o, t, z * 5 + i * 1.7));
      if (z === 0.38) { const p = P3(0, 0, 0.3), k = ks(0.3) * 2.1; g.save(); g.translate(p[0], p[1] + (CEL === "win" ? -Math.abs(Math.sin(t * 4.6)) * 60 * ks(0.3) : 0)); g.scale(k, k); shadow(0, 0, 40, 5, 0.4); sprB(`char_dir_idle_${1 + (Math.abs(Math.floor(t * 1.2)) || 0) % 2}`, 0, 0, 1, false); g.restore(); }   // the flight director stands in the aisle
    }
  }
  function drawControl(t, miniPad) {
    g.lineJoin = "round";
    const L = (X, Y, z) => P3(X, Y, z);
    // --- the room box: flat artist colours, outlined, with light pencil hatching ---
    shape([L(-640, 720, ZB), L(640, 720, ZB), L(640, 0, ZB), L(-640, 0, ZB)], "#2f2084", INK, 4, 0.03);
    for (const sd of [-1, 1]) {
      shape([L(sd * 640, 720, 0), L(sd * 640, 720, ZB), L(sd * 640, 0, ZB), L(sd * 640, 0, 0)], sd < 0 ? "#261a74" : "#241872", INK, 4, 0.045);
      shape([L(sd * 640, 120, 0), L(sd * 640, 120, ZB), L(sd * 640, 0, ZB), L(sd * 640, 0, 0)], "#1c1258", INK, 3);                    // wainscot
      for (let z = 0.1; z < ZB - 0.02; z += 0.1) sk_edge(L(sd * 640, 120, z), L(sd * 640, 720, z), "rgba(150,140,240,.22)", 1.6);          // panel seams
    }
    shape([L(-640, 720, 0), L(640, 720, 0), L(640, 720, ZB), L(-640, 720, ZB)], "#170e4c", INK, 4, 0.03);                              // ceiling
    shape([L(-640, 0, ZB), L(640, 0, ZB), L(640, 0, 0), L(-640, 0, 0)], "#170e48", INK, 4, 0.035);                                      // floor
    for (let X = -512; X <= 512; X += 128) sk_edge(L(X, 0, 0), L(X, 0, ZB), "rgba(120,110,230,.3)", 1.5);
    for (let z = 0.1; z < ZB; z += 0.1) sk_edge(L(-640, 0, z), L(640, 0, z), "rgba(120,110,230,.3)", 1.5);
    shape([L(-640, 26, ZB), L(640, 26, ZB), L(640, 0, ZB), L(-640, 0, ZB)], "#1c1258", INK, 3);                                           // baseboard
    glow(640, 600, 420, "130,120,255", 0.14);
    // --- ceiling lamps (the artist's lamp sprite) with soft light cones ---
    for (let z = 0.15; z < ZB; z += 0.2) sk_edge(L(-640, 719, z), L(640, 719, z), "rgba(150,140,240,.28)", 1.5);
    for (let X = -480; X <= 480; X += 160) sk_edge(L(X, 719, 0), L(X, 719, ZB), "rgba(150,140,240,.28)", 1.5);
    for (const [X, z] of [[-320, 0.14], [320, 0.14], [-320, 0.42], [320, 0.42], [-320, 0.7], [320, 0.7], [0, 0.28], [0, 0.56]]) {
      const p = L(X, 719, z), k = ks(z); cone(p[0], p[1] + 14 * k, 22 * k, 330 * k, 90 * k, "255,236,190", 0.12);
      sk_edge(p, [p[0], p[1] + 12 * k], INK, 2); g.save(); g.translate(p[0] - 32 * k, p[1] + 4 * k); g.scale(k, k); spr("room_lamp", 0, 0); g.restore(); glow(p[0], p[1] + 30 * k, 40 * k, "255,236,190", 0.35);
    }
    // --- back wall decoration: the artist's flat sprites ---
    const bs = ks(ZB), wx = x => 640 + x * bs, wy = y => VPY + (FY - y) * bs;
    sprAt("room_map", -640, 670, ZB, 0.5); sprAt("room_whiteboard", -640, 520, ZB, 0.85); sprAt("room_poster_frame", 482, 520, ZB, 0.92);
    sprAt("room_board", 478, 670, ZB, 0.78);
    { const p = P3(478, 670, ZB), k = ks(ZB) * 0.78, m = G.mission; g.save(); g.translate(p[0], p[1]); g.scale(k, k);   // live status text on the board
      label(16, 20, "SLS · STATUS", 8, "#b9bcec", "left"); label(150, 20, m.phase === "ready" ? "STANDBY" : "LIVE", 8.5, m.phase === "ready" ? "#ffd23f" : "#5be3b0", "right");
      [["FUEL", "#5be3b0"], ["POWER", "#5be3b0"], ["WEATHER", "#ffd23f"], ["TRAJ.", "#5be3b0"]].forEach(([n, c], i) => { const y = 36 + i * 13; label(16, y, n, 8, "#e9eef7", "left"); g.fillStyle = "#23244f"; g.fillRect(64, y - 7, 66, 6); g.fillStyle = c; g.fillRect(64, y - 7, 66 * (0.55 + 0.2 * Math.sin(t * 0.5 + i * 2) + 0.15), 6); }); g.restore(); }
    { const p = P3(482, 520, ZB), k = ks(ZB) * 0.92; art("rocket_sls_idle", p[0] + 70 * k, p[1] + 150 * k, 0.4 * k); }
    { const k = ks(ZB) * 0.55; for (const X of [-360, 360]) { const p = P3(X, 705, ZB); g.save(); g.translate(p[0] - 32 * k, p[1] - 22 * k); g.scale(k, k); clockAt(0, 0, t, ""); g.restore(); } }
    // --- side wall pictures in perspective: world map, shelves, mission patches, framed NASA photos (like a real control room's walls) ---
    { const im = IMG.room_map, mc = offc("map", im.naturalWidth || 640, im.naturalHeight || 340), x = mc.getContext("2d"), sc = mc.width / 320; x.clearRect(0, 0, mc.width, mc.height); x.drawImage(im, 0, 0, mc.width, mc.height);
      x.save(); x.scale(sc, sc); x.beginPath(); x.rect(9, 9, 302, 152); x.clip(); x.strokeStyle = "#ff6a1f"; x.lineWidth = 2; x.beginPath(); for (let u = 0; u <= 302; u += 6) { const y = 85 + Math.sin(u / 302 * Math.PI * 2 + 1) * 52; u ? x.lineTo(9 + u, y) : x.moveTo(9, y); } x.stroke();
      const ox = (t * 14) % 302; x.fillStyle = "#fff"; x.beginPath(); x.arc(9 + ox, 85 + Math.sin(ox / 302 * Math.PI * 2 + 1) * 52, 4, 0, 7); x.fill(); x.restore();
      wallPic(-1, 0.1, 0.46, 190, 390, mc); }
    { const pc = offc("patch", 480, 200), x = pc.getContext("2d"), cols = ["#ff7a3d", "#5be3b0", "#6fb4ff", "#ffd23f", "#ff7ab8", "#b9a4ff"];
      x.fillStyle = "#2a2070"; x.fillRect(0, 0, 480, 200); x.lineWidth = 3; x.strokeStyle = INK;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const cx = 40 + c * 80, cy = 50 + r * 100, k = r * 6 + c; x.fillStyle = cols[k % 6]; x.beginPath(); x.arc(cx, cy, 32, 0, 7); x.fill(); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(cx, cy, 20, 0, 7); x.fill(); x.stroke(); x.fillStyle = cols[(k + 2) % 6]; x.beginPath(); if (k % 3 === 0) { x.moveTo(cx, cy - 14); x.lineTo(cx + 13, cy + 10); x.lineTo(cx - 13, cy + 10); x.closePath(); } else if (k % 3 === 1) x.arc(cx, cy, 9, 0, 7); else x.rect(cx - 9, cy - 9, 18, 18); x.fill(); x.stroke(); }
      wallPic(-1, 0.52, 0.96, 200, 400, pc); }
    { const im = IMG.room_shelf, sh = offc("shelf", im.naturalWidth || 300, im.naturalHeight || 244), x = sh.getContext("2d"); x.clearRect(0, 0, sh.width, sh.height); x.drawImage(im, 0, 0, sh.width, sh.height); wallPic(1, 0.1, 0.4, 140, 380, sh); }
    { const fc = offc("frames", 480, 200), x = fc.getContext("2d"); x.fillStyle = "#2a2070"; x.fillRect(0, 0, 480, 200); x.lineWidth = 4; x.strokeStyle = INK;
      ["earth", "moon", "mars"].forEach((n, i) => { const fx = 14 + i * 156; x.fillStyle = "#e9e4ff"; x.fillRect(fx, 14, 140, 172); x.strokeRect(fx, 14, 140, 172); x.fillStyle = "#0d0a32"; x.fillRect(fx + 10, 24, 120, 120); if (PH[n]) x.drawImage(PH[n], fx + 20, 34, 100, 100); x.fillStyle = INK; x.fillRect(fx + 30, 158, 80, 5); x.fillRect(fx + 45, 168, 50, 4); });
      wallPic(1, 0.46, 0.96, 200, 400, fc); }
    // --- big window in the back wall (the old TV): same size and place, recessed, hand-drawn frame ---
    const H = HOLE, O = { x: H.x - 10, y: H.y - 10, w: H.w + 20, h: H.h + 20 };
    shape([[O.x, O.y], [O.x + O.w, O.y], [H.x + H.w, H.y], [H.x, H.y]], "#1c1262", null); shape([[O.x, O.y], [H.x, H.y], [H.x, H.y + H.h], [O.x, O.y + O.h]], "#281a80", null);
    shape([[O.x + O.w, O.y], [H.x + H.w, H.y], [H.x + H.w, H.y + H.h], [O.x + O.w, O.y + O.h]], "#160e52", null); shape([[O.x, O.y + O.h], [H.x, H.y + H.h], [H.x + H.w, H.y + H.h], [O.x + O.w, O.y + O.h]], "#4b3aa8", null);
    g.save(); g.beginPath(); g.rect(H.x, H.y, H.w, H.h + 1); g.clip(); g.translate(H.x, H.y); g.scale(H.w / 1280, H.w / 1280); miniPad(); g.restore();
    g.save(); g.beginPath(); g.rect(H.x, H.y, H.w, H.h); g.clip(); g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.moveTo(H.x + 40, H.y); g.lineTo(H.x + 120, H.y); g.lineTo(H.x + 70, H.y + H.h); g.lineTo(H.x - 10, H.y + H.h); g.fill();
    g.beginPath(); g.moveTo(H.x + 150, H.y); g.lineTo(H.x + 172, H.y); g.lineTo(H.x + 122, H.y + H.h); g.lineTo(H.x + 100, H.y + H.h); g.fill(); g.restore();
    for (const [p, q2] of [[[O.x, O.y], [H.x, H.y]], [[O.x + O.w, O.y], [H.x + H.w, H.y]], [[O.x, O.y + O.h], [H.x, H.y + H.h]], [[O.x + O.w, O.y + O.h], [H.x + H.w, H.y + H.h]]]) sk_edge(p, q2, INK, 2.5);
    sk_edge([H.x, H.y], [H.x + H.w, H.y], INK, 3.5); sk_edge([H.x + H.w, H.y], [H.x + H.w, H.y + H.h], INK, 3.5); sk_edge([H.x + H.w, H.y + H.h], [H.x, H.y + H.h], INK, 3.5); sk_edge([H.x, H.y + H.h], [H.x, H.y], INK, 3.5);
    const F = 16, OF = { x: O.x - F, y: O.y - F, w: O.w + 2 * F, h: O.h + 2 * F };
    g.beginPath(); g.rect(OF.x, OF.y, OF.w, OF.h); g.rect(O.x, O.y, O.w, O.h); g.fillStyle = "#554aa8"; g.fill("evenodd");
    R(OF.x, OF.y, OF.w, 5, "#8c7df0"); R(OF.x, OF.y, 5, OF.h, "#7a6cdc"); R(OF.x, OF.y + OF.h - 5, OF.w, 5, "#352a85"); R(OF.x + OF.w - 5, OF.y, 5, OF.h, "#352a85");
    for (const [a2, b2] of [[[OF.x, OF.y], [OF.x + OF.w, OF.y]], [[OF.x + OF.w, OF.y], [OF.x + OF.w, OF.y + OF.h]], [[OF.x + OF.w, OF.y + OF.h], [OF.x, OF.y + OF.h]], [[OF.x, OF.y + OF.h], [OF.x, OF.y]], [[O.x, O.y], [O.x + O.w, O.y]], [[O.x + O.w, O.y], [O.x + O.w, O.y + O.h]], [[O.x + O.w, O.y + O.h], [O.x, O.y + O.h]], [[O.x, O.y + O.h], [O.x, O.y]]]) sk_edge(a2, b2, INK, 3.5);
    for (const [cx, cy] of [[OF.x + 8, OF.y + 8], [OF.x + OF.w - 8, OF.y + 8], [OF.x + 8, OF.y + OF.h - 8], [OF.x + OF.w - 8, OF.y + OF.h - 8]]) { g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, 2.6, 0, 7); g.fill(); }
    { const yb = OF.y + OF.h, xa = OF.x - 24, xb = OF.x + OF.w + 24, f = 1.12, fy = VPY + (yb - VPY) * f, fa = 640 + (xa - 640) * f, fb = 640 + (xb - 640) * f;      // sill slab sticking out
      shape([[xa, yb], [xb, yb], [fb, fy], [fa, fy]], "#8c7df0", INK, 3); shape([[fa, fy], [fb, fy], [fb, fy + 13], [fa, fy + 13]], "#4f43a6", INK, 3); }
    deskRows(t);
    if (G.scene === "base") { const p = (t * 0.7) % 1; g.strokeStyle = `rgba(255,122,61,${0.7 * (1 - p)})`; g.lineWidth = 3; g.strokeRect(OF.x - p * 10, OF.y - p * 10, OF.w + p * 20, OF.h + p * 20); }
  }

  // ---------- HANGAR ----------
  const PALH = { w0: "#33247c", w1: "#221560", trim: "#170d48", floor: "#170d44" };
  // ======================= shared 3D helpers for the hangar and the research lab =======================
  function solid(x0, x1, Y0, Y1, z0, z1, c) {            // a solid box in the room: hand-drawn outline, flat colours
    if (x0 > 0) shape([P3(x0, Y0, z0), P3(x0, Y1, z0), P3(x0, Y1, z1), P3(x0, Y0, z1)], c.s, INK, 2.6, 0.05);
    if (x1 < 0) shape([P3(x1, Y0, z0), P3(x1, Y1, z0), P3(x1, Y1, z1), P3(x1, Y0, z1)], c.s, INK, 2.6, 0.05);
    if (Y1 < FY) shape([P3(x0, Y1, z0), P3(x1, Y1, z0), P3(x1, Y1, z1), P3(x0, Y1, z1)], c.t, INK, 2.6, 0.07);
    shape([P3(x0, Y1, z0), P3(x1, Y1, z0), P3(x1, Y0, z0), P3(x0, Y0, z0)], c.f, INK, 2.8, 0.05);
  }
  function boxRoom(Zb, c) {                               // the room itself: back wall, side walls, ceiling, floor
    const L = P3;
    shape([L(-640, 720, Zb), L(640, 720, Zb), L(640, 0, Zb), L(-640, 0, Zb)], c.back, INK, 4, 0.03);
    for (const sd of [-1, 1]) {
      shape([L(sd * 640, 720, 0), L(sd * 640, 720, Zb), L(sd * 640, 0, Zb), L(sd * 640, 0, 0)], c.side, INK, 4, 0.045);
      shape([L(sd * 640, 120, 0), L(sd * 640, 120, Zb), L(sd * 640, 0, Zb), L(sd * 640, 0, 0)], c.wain, INK, 3);
      for (let z = 0.1; z < Zb - 0.02; z += 0.1) sk_edge(L(sd * 640, 120, z), L(sd * 640, 720, z), "rgba(150,140,240,.22)", 1.6);
    }
    shape([L(-640, 720, 0), L(640, 720, 0), L(640, 720, Zb), L(-640, 720, Zb)], c.ceil, INK, 4, 0.03);
    shape([L(-640, 0, Zb), L(640, 0, Zb), L(640, 0, 0), L(-640, 0, 0)], c.floor, INK, 4, 0.035);
    for (let X = -512; X <= 512; X += 128) sk_edge(L(X, 0, 0), L(X, 0, Zb), "rgba(120,110,230,.3)", 1.5);
    for (let z = 0.1; z < Zb; z += 0.1) sk_edge(L(-640, 0, z), L(640, 0, z), "rgba(120,110,230,.3)", 1.5);
    shape([L(-640, 26, Zb), L(640, 26, Zb), L(640, 0, Zb), L(-640, 0, Zb)], c.wain, INK, 3);
    glow(640, 600, 420, "130,120,255", 0.14);
  }
  function ceilLamp(X, z, rgb = "255,236,190") {
    const p = P3(X, 719, z), k = ks(z); cone(p[0], p[1] + 14 * k, 22 * k, 330 * k, 90 * k, rgb, 0.12);
    sk_edge(p, [p[0], p[1] + 12 * k], INK, 2); g.save(); g.translate(p[0] - 32 * k, p[1] + 4 * k); g.scale(k, k); spr("room_lamp", 0, 0); g.restore(); glow(p[0], p[1] + 30 * k, 40 * k, "255,236,190", 0.35);
  }
  function spriteAt(name, X, Y, z, sc = 1, flip = false) {   // artist sprite standing on a point of the 3D floor (bottom-centre anchored)
    const p = P3(X, Y, z), k = ks(z) * sc; g.save(); g.translate(p[0], p[1]); g.scale(k, k); sprB(name, 0, 0, 1, flip); g.restore();
  }
  function spriteK(name, X, Y, z, k, flip = false) {          // artist sprite with a fixed on-screen scale (so every person is the same size)
    const p = P3(X, Y, z); g.save(); g.translate(p[0], p[1]); g.scale(k, k); sprB(name, 0, 0, 1, flip); g.restore();
  }
  let hoverId = null;
  function setHover(id) { hoverId = id; }
  function partInfo(list, t, yBase) {                         // hovering a part: it glows and its info is written on the scene with a leader line
    const hs = list.filter(q => q.id === hoverId); if (!hs.length || !D.parts[hoverId]) return;
    const pul = 0.6 + 0.4 * Math.sin(t * 5);
    for (const q of hs) { const r = q.r; g.save(); g.strokeStyle = `rgba(255,154,82,${pul})`; g.lineWidth = 3; g.shadowColor = "#ff9a52"; g.shadowBlur = 14; g.beginPath(); g.roundRect(r[0] - 4, r[1] - 4, r[2] + 8, r[3] + 8, 10); g.stroke(); g.restore(); }
    const q0 = hs[0], ax = q0.r[0] + q0.r[2] / 2, ay = q0.r[1] + q0.r[3] / 2, info = D.parts[hoverId], left = ax > 640, TW = 360;
    const tl = wrap(info.title, TW, 20), bl = wrap(info.text, TW, 15), x = left ? 40 : 1240 - TW, H = tl.length * 26 + bl.length * 21;
    const y0 = yBase || 120, ex = left ? x + TW + 10 : x - 10, ey = y0 + 12;
    g.save(); g.strokeStyle = "#ffb070"; g.lineWidth = 2; g.shadowColor = "rgba(10,6,40,.9)"; g.shadowBlur = 6; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ax, ay); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = "#ffb070"; g.beginPath(); g.arc(ax, ay, 5, 0, 7); g.fill(); g.restore();
    const bw = TW + 60; g.save(); g.translate(x + TW / 2, y0 + H / 2); g.scale(bw / (H + 40), 1); const gq = g.createRadialGradient(0, 0, 0, 0, 0, (H + 40) / 2); gq.addColorStop(0, "rgba(8,4,34,.62)"); gq.addColorStop(0.7, "rgba(8,4,34,.4)"); gq.addColorStop(1, "rgba(8,4,34,0)"); g.fillStyle = gq; g.fillRect(-(H + 40) / 2, -(H + 40) / 2, H + 40, H + 40); g.restore();
    let y = y0 + 20; for (const ln of tl) { ink(ln, x, y, 20, "#fff", "left", 800); y += 26; } for (const ln of bl) { ink(ln, x, y - 2, 15, "#f1f3ff", "left", 700); y += 21; }
  }
  const CMET = { f: "#4d4f99", t: "#8e90c2", s: "#34366f" }, CHAZ = { f: "#c9a227", t: "#e6c24a", s: "#8c7014" };
  function weldSparks(x, y, t) {
    g.save(); glow(x, y, 26, "255,230,150", 0.55 + 0.3 * Math.sin(t * 30)); g.strokeStyle = "#ffd23f"; g.lineWidth = 1.6; g.lineCap = "round";
    for (let i = 0; i < 9; i++) { const a = rnd(i + Math.floor(t * 14), 7) * 6.283, l = 5 + rnd(i + Math.floor(t * 14), 9) * 16; g.beginPath(); g.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l + l * 0.4); g.stroke(); }
    g.restore();
  }
  // ======================= HANGAR: the rocket is assembled; engineers work around it =======================
  function drawHangar(t) {
    g.lineJoin = "round"; const ZH = 1.1; hits.hangar = [];
    boxRoom(ZH, { back: "#2d2486", side: "#251c70", wain: "#1c1258", ceil: "#150d46", floor: "#16103f" });
    // ceiling trusses, lamps
    for (let z = 0.12; z < ZH; z += 0.22) { sk_edge(P3(-640, 719, z), P3(640, 719, z), "rgba(170,160,250,.45)", 3); sk_edge(P3(-640, 700, z), P3(640, 700, z), "rgba(170,160,250,.25)", 2); }
    for (const [X, z] of [[-330, 0.16], [330, 0.16], [-330, 0.44], [330, 0.44], [-330, 0.72], [330, 0.72], [0, 0.3], [0, 0.6], [0, 0.9]]) ceilLamp(X, z);
    // back wall: big hangar door with hazard stripe, windows, sign
    const bw = ks(ZH), bx = X => 640 + X * bw, by = Y => VPY + (FY - Y) * bw;
    shape([[bx(-330), by(470)], [bx(330), by(470)], [bx(330), by(26)], [bx(-330), by(26)]], "#201865", INK, 3.5, 0.04);
    for (let i = -5; i <= 5; i++) sk_edge([bx(i * 60), by(470)], [bx(i * 60), by(26)], "rgba(150,140,240,.25)", 1.5);
    for (let i = 0; i < 24; i++) R(bx(-330) + i * (bx(330) - bx(-330)) / 24, by(470), (bx(330) - bx(-330)) / 48, 7, "#e6c24a");
    for (const X of [-520, 520]) { const x0 = bx(X - 55), y0 = by(400), w = 110 * bw, h = 90 * bw; skyPane(x0, y0, w, h, t); sk_edge([x0, y0], [x0 + w, y0], INK, 3); sk_edge([x0 + w, y0], [x0 + w, y0 + h], INK, 3); sk_edge([x0 + w, y0 + h], [x0, y0 + h], INK, 3); sk_edge([x0, y0 + h], [x0, y0], INK, 3); sk_edge([x0 + w / 2, y0], [x0 + w / 2, y0 + h], INK, 2); }
    { const p = P3(-470, 250, ZH), k = bw * 1; g.save(); g.translate(p[0], p[1]); g.scale(k, k); spr("hangar_sign", 0, 0); g.restore(); }
    // side walls: tool board and shelves in perspective
    { const im = IMG.hangar_toolboard, cv = offc("toolb", im.naturalWidth || 320, im.naturalHeight || 216), x = cv.getContext("2d"); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(im, 0, 0, cv.width, cv.height); wallPic(-1, 0.3, 0.7, 190, 400, cv); }
    { const im = IMG.room_shelf, cv = offc("hshelf", im.naturalWidth || 300, im.naturalHeight || 244), x = cv.getContext("2d"); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(im, 0, 0, cv.width, cv.height); wallPic(1, 0.3, 0.7, 150, 390, cv); }
    { const im = IMG.hangar_pipes, cv = offc("hpipes", im.naturalWidth || 800, im.naturalHeight || 72), x = cv.getContext("2d"); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(im, 0, 0, cv.width, cv.height); wallPic(-1, 0.1, 1.0, 560, 640, cv); wallPic(1, 0.1, 1.0, 560, 640, cv); }
    // floor: yellow lane lines and the hazard-striped assembly zone
    for (const X of [-210, 210]) sk_edge(P3(X, 0, 0.05), P3(X, 0, ZH), "rgba(255,210,63,.55)", 3);
    // overhead crane
    { const z = 0.5, tx = Math.sin(t * 0.18) * 260, hl = 90 + 40 * Math.sin(t * 0.4);
      solid(-640, 640, 650, 678, z, z + 0.05, CMET); solid(tx - 38, tx + 38, 612, 650, z - 0.01, z + 0.06, CHAZ);
      const c0 = P3(tx, 612, z + 0.02), c1 = P3(tx, 612 - hl, z + 0.02); sk_edge(c0, c1, "#c6c8f0", 2.4); g.save(); g.translate(c1[0] - 6 * ks(z), c1[1]); g.scale(ks(z), ks(z)); spr("hangar_hook", 0, 0); g.restore(); }
    // plinth + rocket + scaffold towers
    const rz = 0.46;
    solid(-150, 150, 0, 26, rz - 0.07, rz + 0.07, CHAZ); const pl = P3(0, 26, rz); shadow(pl[0], P3(0, 0, rz)[1], 140, 10, 0.5);
    const tower = (sx) => {
      const z0 = rz - 0.07, z1 = rz + 0.07, X = sx * 200;
      for (const zz of [z0, z1]) for (const dx of [-14, 14]) sk_edge(P3(X + dx, 26, zz), P3(X + dx, 560, zz), "#8e90c2", 3.4);
      for (let Y = 26; Y < 560; Y += 90) { sk_edge(P3(X - 14, Y, z0), P3(X + 14, Y + 90, z0), "rgba(190,190,240,.6)", 2); sk_edge(P3(X + 14, Y, z0), P3(X - 14, Y + 90, z0), "rgba(190,190,240,.6)", 2); }
      for (const Y of [120, 300, 480]) { const xa = sx * 62, xb = X + sx * 14; shape([P3(xa, Y, z0), P3(xb, Y, z0), P3(xb, Y, z1), P3(xa, Y, z1)], "#7d78c8", INK, 2.6, 0.07); sk_edge(P3(xa, Y + 40, z0), P3(xb, Y + 40, z0), "#c6c8f0", 2); sk_edge(P3(xa, Y, z0), P3(xa, Y + 40, z0), "#c6c8f0", 2); }
    };
    tower(-1); tower(1);
    const RSC = 1.25, rf = P3(0, 26, rz); const r = art("rocket_sls_idle", rf[0], rf[1], RSC);
    // the rocket's parts (hover each one for its info): fallback first, then specific parts last (checked first)
    const rx = r[0], ry = r[1], rw = r[2], rh = r[3];
    hits.hangar.push({ id: "sls", r: [rx, ry, rw, rh] });
    hits.hangar.push({ id: "stage1", r: [rx + rw * 0.33, ry + rh * 0.3, rw * 0.34, rh * 0.68] });
    hits.hangar.push({ id: "srb", r: [rx, ry + rh * 0.27, rw * 0.33, rh * 0.68] }); hits.hangar.push({ id: "srb", r: [rx + rw * 0.67, ry + rh * 0.27, rw * 0.33, rh * 0.68] });
    hits.hangar.push({ id: "stage2", r: [rx + rw * 0.28, ry + rh * 0.1, rw * 0.44, rh * 0.22] });
    hits.hangar.push({ id: "las", r: [rx + rw * 0.36, ry, rw * 0.28, rh * 0.12] });
    if (hoverId === "sls") { /* whole-rocket hover glows via partInfo */ }
    // engineers on the scaffolds (welding, walking), floor crew, and a monitoring desk seen from behind
    weldSparks(rx + rw * 0.24, ry + rh * 0.74, t);
    for (const [sx, Y, ph] of [[-1, 120, 0], [1, 300, 1.7], [-1, 480, 3.1]]) { const Xc = sx * (140 + 30 * Math.sin(t * 0.25 + ph)), p = P3(Xc, Y, rz), k = 1.2; g.save(); g.translate(p[0], p[1]); g.scale(k, k); shadow(0, 0, 22, 4, 0.35); sprB(`char_eng_walk_${1 + (Math.abs(Math.floor(t * 6 + ph)) || 0) % 4}`, 0, 4, 1, Math.cos(t * 0.25 + ph) * sx < 0); g.restore(); }
    deskStation(-470, 0.1, { w: 190, m: M3, d: 0, acc: "papers", p: { sk: 0, hr: 2, sh: 1, hs: 1, pose: "lean" } }, t, 1.3); deskStation(-290, 0.1, { w: 170, m: M2, d: 2, acc: "mug", p: { sk: 3, hr: 0, sh: 3, hs: 1, pose: "turn" } }, t, 2.2);
    { const wx = 90 + Math.sin(t * 0.3) * 170; spriteK("char_eng_walk_" + (1 + (Math.abs(Math.floor(t * 7)) || 0) % 4), wx, 0, 0.26, 1.2, Math.cos(t * 0.3) < 0); }
    spriteK("char_sci_point_" + (1 + (Math.abs(Math.floor(t * 1.3)) || 0) % 2), -508, 0, 0.68, 1.0, false);
    // right foreground: workbench, crates, barrels, tank, cart (artist sprites placed in depth)
    spriteAt("hangar_bench", 470, 0, 0.14, 1.25); spriteAt("hangar_tank", 600, 0, 0.12, 1.3); spriteAt("hangar_barrel", 380, 0, 0.3, 1.2); spriteAt("hangar_barrel", 420, 0, 0.32, 1.2); spriteAt("hangar_crate", 520, 0, 0.3, 1.3); spriteAt("hangar_crate", 520, 56, 0.3, 1.0); spriteAt("hangar_cart", -120, 0, 0.18, 1.2);
    spriteK("char_eng_sit_" + (1 + (Math.abs(Math.floor(t * 5)) || 0) % 2), 400, 0, 0.1, 1.2, false);
    partInfo(hits.hangar, t);
  }
  // ======================= RESEARCH LAB: scientists at work (small room) =======================
  function microscope(px, py, k) {
    g.save(); g.translate(px, py); g.scale(k, k);
    shape([[-18, 0], [18, 0], [18, -6], [-18, -6]], "#3b3a82", INK, 2.2); shape([[-4, -6], [4, -6], [4, -44], [-4, -44]], "#6a64b0", INK, 2.2);
    g.save(); g.translate(0, -44); g.rotate(-0.35); shape([[-5, 0], [5, 0], [5, -34], [-5, -34]], "#dcd8ff", INK, 2.2); shape([[-3.5, -34], [3.5, -34], [3.5, -42], [-3.5, -42]], "#2a2a5c", INK, 2); g.restore();
    shape([[8, -30], [20, -30], [20, -26], [8, -26]], "#6a64b0", INK, 1.8); g.restore();
  }
  function beaker(px, py, k, col, ph, t) {
    g.save(); g.translate(px, py); g.scale(k, k);
    shape([[-9, -34], [9, -34], [10, 0], [-10, 0]], "rgba(220,230,255,.18)", INK, 2); const lv = 14 + 4 * Math.sin(t + ph);
    shape([[-9.4, -lv], [9.4, -lv], [10, 0], [-10, 0]], col, null); for (let i = 0; i < 3; i++) { const b = (t * 14 + i * 9 + ph * 7) % 16; g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(-4 + i * 4, -2 - b * (lv / 16), 1.4, 0, 7); g.fill(); }
    sk_edge([-9, -34], [9, -34], INK, 2.2); g.restore();
  }
  function drawLab(t) {
    g.lineJoin = "round"; const ZL = 0.85; hits.lab = [];
    boxRoom(ZL, { back: "#2a3088", side: "#222a78", wain: "#1a1f5c", ceil: "#12104a", floor: "#181a50" });
    for (const [X, z] of [[-250, 0.16], [250, 0.16], [-250, 0.5], [250, 0.5], [0, 0.33], [0, 0.66]]) ceilLamp(X, z, "220,240,255");
    const bw = ks(ZL), by = Y => VPY + (FY - Y) * bw;
    // big wall screen: live satellite feed of Earth (the lab is on the ground, so this is a monitor, not a window)
    { const cx = 640, cy = by(380), w = 190, h = 135, x0 = cx - w / 2, y0 = cy - h / 2;
      shape([[x0 - 12, y0 - 12], [x0 + w + 12, y0 - 12], [x0 + w + 12, y0 + h + 12], [x0 - 12, y0 + h + 12]], "#4f43a6", INK, 3.4);
      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.fillStyle = "#070520"; g.fillRect(x0, y0, w, h);
      for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(x0 + rnd(i, 3) * w, y0 + rnd(i, 5) * h, 1.6, 1.6); }
      if (PH.earth) g.drawImage(PH.earth, cx - 70 + Math.sin(t * 0.15) * 7, y0 + 16 + Math.cos(t * 0.15) * 4, 140, 140);
      g.fillStyle = "rgba(120,160,255,.06)"; for (let y = y0; y < y0 + h; y += 4) g.fillRect(x0, y, w, 1);
      g.fillStyle = "rgba(10,6,40,.65)"; g.fillRect(x0 + 6, y0 + 6, 122, 18); if (Math.sin(t * 3) > -0.3) { g.fillStyle = "#ff3b3b"; g.beginPath(); g.arc(x0 + 16, y0 + 15, 4, 0, 7); g.fill(); } label(x0 + 26, y0 + 19, "LIVE · ORBIT CAM", 10, "#fff", "left");
      g.restore(); sk_edge([x0, y0], [x0 + w, y0], INK, 3); sk_edge([x0 + w, y0], [x0 + w, y0 + h], INK, 3); sk_edge([x0 + w, y0 + h], [x0, y0 + h], INK, 3); sk_edge([x0, y0 + h], [x0, y0], INK, 3);
      hits.lab.push({ id: "lab_window", r: [x0 - 12, y0 - 12, w + 24, h + 24] }); }
    const wb = P3(-635, 460, ZL), wk = bw * 1.2; g.save(); g.translate(wb[0], wb[1]); g.scale(wk, wk); spr("room_whiteboard", 0, 0); g.restore(); hits.lab.push({ id: "lab_board", r: [wb[0], wb[1], 180 * wk, 120 * wk] });
    const sh = P3(-470, 30 + 122 * 1.2, ZL), sk2 = bw * 1.2; g.save(); g.translate(sh[0], sh[1]); g.scale(sk2, sk2); spr("room_shelf", 0, 0); g.restore(); hits.lab.push({ id: "lab_samples", r: [sh[0], sh[1], 150 * sk2, 122 * sk2] });
    const sv = P3(460, 30 + 152 * 1.1, ZL), svk = bw * 1.1; g.save(); g.translate(sv[0], sv[1]); g.scale(svk, svk); spr("room_server", 0, 0); g.restore(); hits.lab.push({ id: "lab_spec", r: [sv[0], sv[1], 64 * svk, 152 * svk] });
    // more things on the back wall: framed NASA photos, a periodic-table poster, a live spectrum screen, gas cylinders
    const frame = (X, Yt, w, h, img) => { const a = P3(X, Yt, ZL), b = P3(X + w, Yt - h, ZL); shape([[a[0] - 4, a[1] - 4], [b[0] + 4, a[1] - 4], [b[0] + 4, b[1] + 4], [a[0] - 4, b[1] + 4]], "#e9e4ff", INK, 2.4); g.fillStyle = "#0d0a32"; g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); if (img) { const sz = Math.min(b[0] - a[0], b[1] - a[1]) - 4; g.drawImage(img, (a[0] + b[0]) / 2 - sz / 2, (a[1] + b[1]) / 2 - sz / 2, sz, sz); } };
    frame(-400, 470, 110, 140, PH.moon); frame(290, 470, 110, 140, PH.jupiter);
    { const a = P3(425, 470, ZL), cw = 22 * bw, ch = 20 * bw, cols = ["#ff7a3d", "#5be3b0", "#6fb4ff", "#ffd23f", "#ff7ab8", "#b9a4ff"]; shape([[a[0] - 5, a[1] - 5], [a[0] + 8 * cw + 5, a[1] - 5], [a[0] + 8 * cw + 5, a[1] + 5 * ch + 5], [a[0] - 5, a[1] + 5 * ch + 5]], "#e9e4ff", INK, 2.4);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { if ((r > 1 && c > 5) || (r === 0 && c > 0 && c < 7)) continue; g.fillStyle = cols[(r * 3 + c) % 6]; g.fillRect(a[0] + c * cw + 1, a[1] + r * ch + 1, cw - 2, ch - 2); } hits.lab.push({ id: "lab_table", r: [a[0] - 5, a[1] - 5, 8 * cw + 10, 5 * ch + 10] }); }
    { const a = P3(-400, 290, ZL), b = P3(-290, 200, ZL); shape([[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], "#0b0a30", INK, 2.6); screenFill(a[0] + 3, a[1] + 3, b[0] - a[0] - 6, b[1] - a[1] - 6, t, 1, 1); hits.lab.push({ id: "lab_spec", r: [a[0], a[1], b[0] - a[0], b[1] - a[1]] }); }
    spriteAt("hangar_tank", 570, 0, ZL - 0.03, 1.3); spriteAt("hangar_tank", 615, 0, ZL - 0.03, 1.3);

    { const pp = P3(-440, 120, ZL), pk = bw * 1.2; g.save(); g.translate(pp[0], pp[1]); g.scale(pk, pk); spr("room_plant", 0, 0); g.restore(); }
    // map and board on the side walls
    { const im = IMG.room_map, mc = offc("lmap", im.naturalWidth || 640, im.naturalHeight || 340), x = mc.getContext("2d"); x.clearRect(0, 0, mc.width, mc.height); x.drawImage(im, 0, 0, mc.width, mc.height); wallPic(-1, 0.14, 0.5, 190, 390, mc); }
    { const im = IMG.room_poster_frame, pc = offc("lposter", im.naturalWidth || 280, im.naturalHeight || 360), x = pc.getContext("2d"); x.clearRect(0, 0, pc.width, pc.height); x.drawImage(im, 0, 0, pc.width, pc.height); if (PH.mars) x.drawImage(PH.mars, pc.width * 0.12, pc.height * 0.08, pc.width * 0.76, pc.width * 0.76); wallPic(1, 0.14, 0.4, 150, 400, pc); }
    // solar-system model (orrery) on a pedestal
    { const z = 0.5, X = 235; solid(X - 26, X + 26, 0, 64, z, z + 0.05, { f: "#6f6ab4", t: "#a9a4e8", s: "#3b3a82" });
      const c = P3(X, 150, z + 0.025), k = ks(z) * 1.25, b0 = P3(X, 64, z + 0.025); sk_edge(b0, [c[0], c[1] + 8 * k], "#c6c8f0", 3);
      glow(c[0], c[1], 44 * k, "255,170,60", 0.4); if (PH.sun) g.drawImage(PH.sun, c[0] - 14 * k, c[1] - 14 * k, 28 * k, 28 * k); else { g.beginPath(); g.arc(c[0], c[1], 14 * k, 0, 7); g.fillStyle = "#ffb347"; g.fill(); }
      [[34, "#c9a96a", 0.9], [54, "#6fb4ff", 0.6], [76, "#d9693a", 0.45], [102, "#d3a373", 0.3]].forEach(([rr, col, sp], i) => { const R2 = rr * k; g.strokeStyle = "rgba(190,190,255,.4)"; g.lineWidth = 1.4; g.beginPath(); g.ellipse(c[0], c[1], R2, R2 * 0.3, 0, 0, 7); g.stroke(); const a2 = t * sp + i * 1.7; g.beginPath(); g.arc(c[0] + Math.cos(a2) * R2, c[1] + Math.sin(a2) * R2 * 0.3, (i === 3 ? 8 : 5.5) * k, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); });
      hits.lab.push({ id: "lab_solar", r: [c[0] - 106 * k, c[1] - 34 * k, 212 * k, 140 * k] }); }
    // long lab table with a microscope and beakers
    solid(-190, 190, 0, 78, 0.3, 0.46, { f: "#a9a4e8", t: "#ece9ff", s: "#6f6ab4" });
    const tp = P3(0, 78, 0.34), tk = ks(0.34);
    microscope(tp[0] - 100 * tk, tp[1] + 4 * tk, tk * 1.35); { const mk = tk * 1.35, mx = tp[0] - 100 * tk; hits.lab.push({ id: "lab_scope", r: [mx - 26 * mk, tp[1] + 4 * tk - 92 * mk, 56 * mk, 96 * mk] }); }
    [["#ff7ab8", 0], ["#5be3b0", 1.3], ["#ffd23f", 2.4]].forEach(([col, ph], i) => beaker(tp[0] + (-10 + i * 30) * tk, tp[1] + 6 * tk, tk * 1.3, col, ph, t)); hits.lab.push({ id: "lab_chem", r: [tp[0] - 24 * tk * 1.3, tp[1] + 6 * tk - 40 * tk * 1.3, 84 * tk * 1.3, 44 * tk * 1.3] });
    shape([[tp[0] + 120 * tk, tp[1] + 2 * tk], [tp[0] + 164 * tk, tp[1] + 2 * tk], [tp[0] + 164 * tk, tp[1] - 26 * tk], [tp[0] + 120 * tk, tp[1] - 26 * tk]], "#2d2a68", INK, 2); screenFill(tp[0] + 124 * tk, tp[1] - 22 * tk, 36 * tk, 20 * tk, t, 2, 0);
    // telescope on a tripod
    { const z = 0.34, b = P3(-580, 120, z), k = ks(z) * 1.2; for (const dx of [-34, 0, 34]) sk_edge([b[0], b[1]], [b[0] + dx * k, P3(0, 0, z)[1]], "#8e90c2", 3.2);
      g.save(); g.translate(b[0], b[1]); g.rotate(-0.75); shape([[-13 * k, 0], [13 * k, 0], [10 * k, -108 * k], [-10 * k, -108 * k]], "#dcd8ff", INK, 2.6); shape([[-14 * k, -96 * k], [14 * k, -96 * k], [14 * k, -112 * k], [-14 * k, -112 * k]], "#4f43a6", INK, 2.6); g.restore();
      hits.lab.push({ id: "lab_tele", r: [b[0] - 100 * k, b[1] - 110 * k, 125 * k, 130 * k] }); }
    // scientists: two benches seen from behind, plus walking, pointing and seated lab-coat characters (the artist's sprites)
    deskStation(-520, 0.1, { w: 170, m: M2, d: 3, acc: "mug", p: { sk: 2, hr: 0, sh: 0, pose: "lean" } }, t, 0.4); deskStation(-350, 0.1, { w: 170, m: M1, d: 1, acc: "papers", p: { sk: 0, hr: 3, sh: 0, long: 1, pose: "turn" } }, t, 1.6);
    deskStation(350, 0.1, { w: 170, m: M3, d: 3, acc: "bottle", p: { sk: 3, hr: 5, sh: 0, hs: 0, pose: "wide" } }, t, 2.8); deskStation(520, 0.1, { w: 170, m: M2, d: 1, acc: "flag", p: { sk: 4, hr: 1, sh: 0, pose: "lean" } }, t, 3.9);
    spriteK("char_sci_walk_" + (1 + (Math.abs(Math.floor(t * 6)) || 0) % 4), Math.sin(t * 0.25) * 200, 0, 0.04, 1.62, Math.cos(t * 0.25) < 0);
    spriteK("char_sci_point_" + (1 + (Math.abs(Math.floor(t * 1.3)) || 0) % 2), -549, 0, 0.71, 1.25, false);
    partInfo(hits.lab, t);
  }
  function tag(cx, y, txt) {
    g.font = '700 10.5px -apple-system,"Segoe UI",Helvetica,Arial,sans-serif'; const w = g.measureText(txt).width + 18;
    g.fillStyle = "rgba(14,10,52,.9)"; g.strokeStyle = "#5a4cc0"; g.lineWidth = 1.5; g.beginPath(); g.roundRect(cx - w / 2, y - 13, w, 19, 6); g.fill(); g.stroke();
    label(cx, y + 1, txt, 10.5, "#e9eef7");
  }

  // ---------- RAMPA VE UÇUŞ ----------
  const CLOUDS = [[150, 4.6, 1, 0.9], [1060, 5.4, 2, 1], [330, 6.6, 3, 1.1], [900, 7.4, 1, 1.2], [80, 8.3, 2, 1], [1150, 9, 3, 1.2], [420, 9.9, 1, 1.1], [820, 10.8, 2, 0.9], [600, 11.6, 3, 1]];
  function drawPad(vis, t, mini) {
    const m = G.mission, rp = Game.rocketPos(m), camY = rp.camY, GY = PAD.GY, vw = vis.x1 - vis.x0;
    const fading = m.phase === "transfer" && m.xf < 1;            // the journey fades in over the parking-orbit close-up
    if ((m.phase === "transfer" || m.phase === "arrival" || m.phase === "lost") && !fading) { drawDeep(vis, t); return; }
    const spaceDrift = m.phase === "flight" || m.phase === "orbit" ? m.real * 26 : 0;
    tileBg("bg_space", vis, camY * 0.1 + spaceDrift * 0.4, 1280, 2560, -(m.down || 0) * 0.35);
    const day = clamp(1 - m.alt / 95);            // 1: yerde gündüz mavisi, 0: uzay
    g.globalAlpha = 0.85 * (1 - day); tileBg("bg_stars_near", vis, camY * 0.24 + spaceDrift, 1280, 2560, -(m.down || 0) * 0.8); g.globalAlpha = 1;
    if (day > 0) {
      const a0 = clamp(day * 1.35 - 0.3), a1 = clamp(day * 2.6), q = g.createLinearGradient(0, vis.y0, 0, vis.y1);
      q.addColorStop(0, `rgba(34,98,205,${a0})`); q.addColorStop(0.55, `rgba(92,164,238,${Math.max(a0, a1 * 0.85)})`); q.addColorStop(1, `rgba(206,232,255,${a1})`);
      g.fillStyle = q; g.fillRect(vis.x0, vis.y0, vw, vis.y1 - vis.y0);
      glow(vis.x0 + vw * 0.8, vis.y0 + 90, 320, "255,246,214", 0.4 * day);
    }
    // aşağıda mavi atmosfer parıltısı (yükseldikçe ince bir kuşağa dönüşür)
    const ga = clamp(1 - m.alt / 150) * 0.85;
    if (ga > 0.02) { const q = g.createLinearGradient(0, vis.y1 - 420, 0, vis.y1); q.addColorStop(0, "rgba(70,150,255,0)"); q.addColorStop(1, `rgba(90,170,255,${ga})`); g.fillStyle = q; g.fillRect(vis.x0, vis.y1 - 420, vw, 420); }
    // Dünya yayı: uzaya çıkınca belirir
    const ea = clamp((m.alt - 95) / 45);
    if (ea > 0) { g.globalAlpha = ea; earthDisc(640, 1350 + (1 - ease(ea)) * 420, 900); g.globalAlpha = 1; }          // the real NASA photo of Earth rises into the lower-left corner, exactly where the journey starts

    if (camY < 1100) {
      // tepeler, zemin, rampa yapıları
      for (const [name, par, col] of [["pad_hills_far", 0.55, "#8fb4d6"], ["pad_hills_near", 0.78, "#5f9a62"]]) {
        const hy = GY - 150 + camY * par;
        for (let x = Math.floor(vis.x0 / 1280) * 1280; x < vis.x1; x += 1280) g.drawImage(IMG[name], x, hy, 1281, 160);
        R(vis.x0, hy + 158, vw, GY + camY - hy - 150, col);
      }
      const gy = GY + camY;
      R(vis.x0, gy, vw, Math.max(0, vis.y1 - gy) + 4, "#4a9650"); R(vis.x0, gy, vw, 3, "#86cc8a");
      spr("pad_apron", 190, gy - 4);
      const blink = Math.sin(t * 3) > 0;
      for (const x of [150, 270, 1010, 1130]) { shadow(x, gy + 3, 26); spr("pad_lightning", x - 20, gy - 600); if (blink) glow(x, gy - 582, 22, "255,59,59", 0.7); }
      shadow(930, gy + 3, 60); spr("pad_water", 875, gy - 340);
      shadow(640, gy + 4, 190, 12, 0.5);
      spr("pad_tower", 449, gy - 560); if (!blink) glow(497.5, gy - 554, 24, "255,59,59", 0.7);
      spr("pad_platform", 480, gy - 98);
      // projektörler
      const fl = 0;
      if (fl > 0) { g.save(); g.globalCompositeOperation = "lighter";
        for (const [lx, tx] of [[150, 520], [270, 560], [1010, 720], [1130, 760]]) { g.fillStyle = `rgba(255,240,200,${0.07 * fl})`; g.beginPath(); g.moveTo(lx, gy - 560); g.lineTo(tx - 70, gy - 60); g.lineTo(tx + 70, gy - 60); g.fill(); glow(lx, gy - 560, 40, "255,240,200", 0.5 * fl); }
        g.restore(); }
    }
    // bulutlar (troposfer)
    for (const [cx, alt, k, sc] of CLOUDS) {
      const y = GY - alt * 70 + camY, x = cx + Math.sin(t * 0.05 + alt) * 30;
      if (y > vis.y0 - 160 && y < vis.y1 + 40) { g.globalAlpha = 0.92; spr("fx_cloud_" + k, x - 140 * sc, y - 60 * sc, sc); g.globalAlpha = 1; }
    }
    // hız çizgileri
    const sl = clamp(1 - m.alt / 70) * clamp(m.vel / 1500) * (m.phase === "flight" ? 1 : 0);
    if (sl > 0.02 && !RM) { g.save(); g.translate(640, 360); g.rotate(m.phi || 0); g.translate(-640, -360); g.strokeStyle = `rgba(255,255,255,${0.35 * sl})`; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i < 26; i++) { const x = vis.x0 + rnd(i, 3) * vw, sp = 500 + rnd(i, 5) * 700, y = vis.y0 + ((rnd(i, 7) * 900 + t * sp) % 900) - 90, ln = 30 + 70 * sl * rnd(i, 9); g.moveTo(x, y); g.lineTo(x, y + ln); }
      g.stroke(); g.restore(); }

    const sh = (m.shake > 0 && !RM) ? m.shake * 5 : 0, sxk = (Math.random() - 0.5) * sh, syk = (Math.random() - 0.5) * sh;
    g.save(); g.translate(sxk, syk);
    const RS = PAD.RS, ax = rp.x, ay = rp.y, burnCore = m.T >= m.tm.ign && m.T < m.tm.meco && m.core, burnSrb = m.T >= 0 && m.srb, shuttle = m.veh === "shuttle";
    const throttle = m.T < 0 ? clamp((m.T - m.tm.ign) / 3, 0.25, 0.7) : 1;
    // iz dumanı (roketin arkasında)
    for (const p of m.puffs) if (p.wy < PAD.PY + 40) drawPuff(p, camY);
    if (m.close < 1) {
      g.save(); if (m.phi) { g.translate(ax, ay - 160); g.rotate(m.phi); g.translate(-ax, -(ay - 160)); }   // gravity turn: tilt about the vehicle's middle
      if (shuttle) drawShuttle(m, ax, ay, t, throttle, burnSrb, burnCore);
      else {
        if (burnSrb) { glow(ax, ay + 40, 190, "255,150,60", 0.30); flame(ax - 22 * RS, ay - 3, 0.42, 0.95, 3, t); flame(ax + 22 * RS, ay - 3, 0.42, 0.95, 6, t); }
        if (burnCore) { glow(ax, ay + 30, 120 * throttle, "255,170,80", 0.35); flame(ax, ay - 2, 0.6 * throttle, 0.62 * throttle, 0, t); }
        if (m.srb) docDraw("rocket_sls_idle", ax, ay, RS);
        else if (m.core) docDraw("rocket_sls_nosrb", ax, ay, RS, m.las ? 0 : 29);
        else docDraw("rocket_sls_nosrb", ax, ay, RS, m.las ? 0 : 29, 64);
      }
      g.restore();
      for (const d of m.debris) drawDebris(d, RS, t);
    }
    ANCH.base = [ax, ay - 8]; ANCH.mid = [ax, ay - 150]; ANCH.nose = [ax, ay - (shuttle ? 340 : 329 * RS)];
    hits.rocket = shuttle ? [ax - 110, ay - 370, 220, 380] : [ax - 46, ay - 329 * RS, 92, 329 * RS + 10];
    // rampa dumanı (roketin önünde)
    for (const p of m.puffs) if (p.wy >= PAD.PY + 40) drawPuff(p, camY);
    g.restore();

    if (!mini) { drawPip(t); drawCloseup(vis, t); }
    if (fading) { g.save(); g.globalAlpha = ease(clamp((m.xf - 0.15) / 0.85)); drawDeep(vis, t); g.restore(); }
    // rokete dikkat çeken halka
    if (!mini && m.phase === "ready" && G.scene === "pad") { const p = (t * 0.8) % 1; g.strokeStyle = `rgba(255,122,61,${0.8 * (1 - p)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(ax, ay - 222, 70 + p * 26, 250 + p * 26, 0, 0, 7); g.stroke(); }
  }
  // ---------- Space Shuttle ascent ----------
  function drawShuttle(m, ax, ay, t, th, burnSrb, burnCore) {
    const sp = SP.shuttle_idle, h = 360, w = h * sp.w / sp.h;
    if (m.srb) {
      if (burnSrb) { glow(ax, ay + 40, 190, "255,150,60", 0.30); flame(ax - 0.27 * w, ay - 6, 0.42, 0.95, 3, t); flame(ax + 0.27 * w, ay - 6, 0.42, 0.95, 6, t); }
      if (burnCore) { glow(ax, ay + 30, 110 * th, "255,170,80", 0.3); flame(ax, ay - 0.1 * h, 0.5 * th, 0.55 * th, 0, t); }
      g.drawImage(IMG.shuttle_idle, ax - w / 2, ay - h, w, h);
    } else {   // after booster separation: orbiter with its external tank, nose up
      if (burnCore) { glow(ax - 12, ay - 10, 120, "255,170,80", 0.3); flame(ax - 12, ay - 14, 0.6, 0.7, 0, t); }
      if (m.core) art("rocket_sls_stage1", ax - 12, ay - 18, 0.7);
      g.save(); g.translate(ax + (m.core ? 24 : 0), ay - 112); g.rotate(-Math.PI / 2); g.scale(0.78, 0.78); g.drawImage(IMG.craft_orbiter, -131, -60, 262, 120); g.restore();
    }
  }
  // ---------- planets ----------
  // NASA photographs (public domain, see assets/nasa/CREDITS.txt); drawn instead of the hand-made planets once loaded
  // NASA photograph of Earth as a disc with a thin blue atmosphere (same place and size everywhere: ascent, orbit and the start of the journey)
  function earthDisc(cx, cy, R) {
    if (!PH.earth) { const eh = 340; g.drawImage(IMG.bg_earth_limb, 0, 720 - eh * 0.8, 1280, eh); return; }
    const q = g.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.12); q.addColorStop(0, "rgba(120,185,255,.55)"); q.addColorStop(0.35, "rgba(90,150,255,.22)"); q.addColorStop(1, "rgba(90,150,255,0)");
    g.fillStyle = q; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.drawImage(PH.earthHi || PH.earth, cx - R, cy - R, R * 2, R * 2);
    const sh = g.createRadialGradient(cx + R * 0.3, cy - R * 0.3, R * 0.5, cx, cy, R * 1.02); sh.addColorStop(0, "rgba(8,4,40,0)"); sh.addColorStop(1, "rgba(8,4,40,.35)"); g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2); g.restore();
  }
  const PH = {}; { const hi = new Image(); hi.onload = () => { PH.earthHi = hi; }; hi.src = "assets/nasa/earth_hi.jpg"; } ["earth", "moon", "mars", "venus", "jupiter", "sun"].forEach(k => { const im = new Image(); im.onload = () => { PH[k] = im; }; im.src = "assets/nasa/" + k + ".png"; });
  function planet(type, x, y, r, t) {
    if (r < 2) return;
    if (PH[type]) {
      glow(x, y, r * 1.4, type === "earth" ? "110,180,255" : "255,226,180", 0.2);
      g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.drawImage(PH[type], x - r, y - r, r * 2, r * 2);
      const sh = g.createRadialGradient(x + r * 0.45, y - r * 0.45, r * 0.5, x + r * 0.45, y - r * 0.45, r * 2.2); sh.addColorStop(0, "rgba(8,4,40,0)"); sh.addColorStop(1, "rgba(8,4,40,.55)"); g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.restore(); return;
    }
    glow(x, y, r * 1.4, type === "earth" ? "110,180,255" : "255,226,180", 0.2);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const base = { earth: ["#62b0ff", "#1f4fa8"], moon: ["#dcdce6", "#7c7c92"], mars: ["#f4965a", "#8a3418"], venus: ["#f8e6b0", "#c39a4a"], jupiter: ["#ecd0a4", "#a36a40"] }[type] || ["#ccc", "#666"];
    const q = g.createRadialGradient(x + r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 1.1); q.addColorStop(0, base[0]); q.addColorStop(1, base[1]); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2);
    const R = (i, k) => rnd(i, k);
    if (type === "moon") for (let i = 0; i < 18; i++) { const cx = x + (R(i, 1) * 2 - 1) * r * 0.8, cy = y + (R(i, 2) * 2 - 1) * r * 0.8, cr = r * (0.04 + 0.1 * R(i, 3));
      g.fillStyle = "rgba(80,80,100,.35)"; g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.fill(); g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = Math.max(1, r * 0.012); g.beginPath(); g.arc(cx - cr * 0.12, cy - cr * 0.12, cr, 0, 7); g.stroke(); }
    if (type === "mars") { for (let i = 0; i < 7; i++) { g.fillStyle = "rgba(100,34,16,.42)"; g.beginPath(); g.ellipse(x + (R(i, 4) * 2 - 1) * r * 0.6, y + (R(i, 5) * 2 - 1) * r * 0.5, r * (0.1 + 0.2 * R(i, 6)), r * (0.06 + 0.1 * R(i, 7)), R(i, 8), 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.ellipse(x, y - r * 0.97, r * 0.42, r * 0.17, 0, 0, 7); g.fill(); }
    if (type === "venus") for (let i = 0; i < 8; i++) { g.strokeStyle = "rgba(255,255,255,.38)"; g.lineWidth = r * 0.07; g.beginPath(); g.arc(x + Math.sin(t * 0.1 + i) * r * 0.1, y + (i - 3.5) * r * 0.27, r * (0.95 - Math.abs(i - 3.5) * 0.07), 0.15, 2.95); g.stroke(); }
    if (type === "jupiter") { const cols = ["#dcbb90", "#b9804f", "#efdcbc", "#a06440", "#dcbb90", "#c79566", "#f0e2c8", "#b47a4c"]; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(x - r, y - r + i * (2 * r / 8), 2 * r, 2 * r / 8 + 1); });
      g.fillStyle = "#c4452a"; g.strokeStyle = "rgba(90,30,20,.8)"; g.lineWidth = Math.max(1, r * 0.015); g.beginPath(); g.ellipse(x + r * 0.28, y + r * 0.3, r * 0.22, r * 0.11, 0, 0, 7); g.fill(); g.stroke(); }
    if (type === "earth") { for (let i = 0; i < 6; i++) { g.fillStyle = "#3fae7a"; g.beginPath(); g.ellipse(x + (R(i, 11) * 2 - 1) * r * 0.65, y + (R(i, 12) * 2 - 1) * r * 0.6, r * (0.12 + 0.2 * R(i, 13)), r * (0.08 + 0.12 * R(i, 14)), R(i, 15), 0, 7); g.fill(); }
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = r * 0.06; g.lineCap = "round"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - r * 0.7 + R(i, 20) * r, y - r * 0.5 + i * r * 0.35); g.quadraticCurveTo(x + R(i, 21) * r * 0.5, y - r * 0.6 + i * r * 0.35, x + r * 0.5, y - r * 0.5 + i * r * 0.35 + R(i, 22) * r * 0.2); g.stroke(); } }
    const sh = g.createRadialGradient(x + r * 0.5, y - r * 0.5, r * 0.3, x + r * 0.5, y - r * 0.5, r * 2.1); sh.addColorStop(0, "rgba(8,4,40,0)"); sh.addColorStop(1, "rgba(8,4,40,.7)"); g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.restore(); g.strokeStyle = "rgba(50,40,90,.9)"; g.lineWidth = Math.max(1.5, r * 0.012); g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  }
  // ---------- interplanetary cruise and arrival ----------
  // ---- hand-drawn sprites of the real satellites (see tools/gen_sats.py) ----
  const SATIMG = {}; ["iss", "hubble", "imece", "gokturk", "lro", "capstone", "artemis", "mro", "maven", "odyssey", "magellan", "pioneer", "parker", "juno", "galileo", "clipper", "landsat9", "turksat", "gokturk1", "rasat"].forEach(k => { const im = new Image(); im.onload = () => { SATIMG[k] = im; }; im.src = "assets/sats/" + k + ".png"; });
  function satDraw(id, x, y, w, ang = 0, alpha = 1) {
    const im = SATIMG[id]; if (!im) return false; const h = w * im.naturalHeight / im.naturalWidth;
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha *= alpha; g.drawImage(im, -w / 2, -h / 2, w, h); g.restore(); return true;
  }
  function drawCraftSprite(kind, x, y, sc, ang, burn, t, dim, retro) {
    g.save(); g.translate(x, y); g.rotate(ang); if (dim) g.globalAlpha = 0.6;
    if (retro) { g.save(); g.rotate(Math.PI); glow(0, 40 * sc, 60 * sc, "255,170,80", 0.4); flame(0, 30 * sc, 0.34 * sc * 1.4, 0.34 * sc * 1.4, 0, t); g.restore(); }   // retro burn: the flame points forward to slow the craft down
    if (kind === "orion") { if (burn) { glow(0, 60 * sc, 70 * sc, "120,190,255", 0.4); flame(0, 114 * sc, 0.4 * sc * 1.2, 0.4 * sc * 1.2, 0, t); } art("rocket_sls_stage2", 0, 114 * sc, sc); }
    else { const k = kind === "probe" ? "craft_probe" : "craft_lander", m = SP[k], w = m.w * sc * 1.6, h = m.h * sc * 1.6; g.drawImage(IMG[k], -w / 2, -h / 2, w, h); }
    g.restore();
  }
  const canLand = cfg => (cfg.craft === "lander" && (cfg.dest === "moon" || cfg.dest === "mars")) || (cfg.craft === "probe" && cfg.dest === "venus");
  // ---- touchdown scene: the surface of the destination ----
  function drawLanding(vis, t, p, key, cfg) {
    hits.land = [];
    const x0 = vis.x0, x1 = vis.x1, GY = 570, W = x1 - x0;
    const SKY = { moon: ["#04020e", "#140e34"], mars: ["#b8663c", "#f3c79c"], venus: ["#6d3010", "#e2aa50"] }[key], GRD = { moon: "#8f8fa6", mars: "#b4562b", venus: "#5e3418" }[key], GRD2 = { moon: "#6e6e88", mars: "#8f4222", venus: "#44240f" }[key];
    let q = g.createLinearGradient(0, vis.y0, 0, GY); q.addColorStop(0, SKY[0]); q.addColorStop(1, SKY[1]); g.fillStyle = q; g.fillRect(x0, vis.y0, W, GY - vis.y0 + 40);
    if (key === "moon") { for (let i = 0; i < 70; i++) { g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(x0 + rnd(i, 3) * W, vis.y0 + rnd(i, 5) * (GY - 80), 1.6, 1.6); } if (PH.earth) { g.drawImage(PH.earth, 1010, 120, 120, 120); } }
    if (key === "mars") { glow(900, 200, 150, "255,235,200", 0.45); g.fillStyle = "#fff3d8"; g.beginPath(); g.arc(900, 200, 16, 0, 7); g.fill(); for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(255,225,190,.16)"; g.beginPath(); g.ellipse(200 + i * 330, 130 + (i % 2) * 70, 150, 26, 0, 0, 7); g.fill(); } }
    if (key === "venus") { for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(255,${200 - i * 12},120,.16)`; g.beginPath(); g.ellipse(x0 + rnd(i, 3) * W, 90 + i * 55 + Math.sin(t * 0.3 + i) * 8, 260, 36, 0, 0, 7); g.fill(); } }
    // far ridge + ground, hand-drawn
    const ridge = (base, amp, col, seed) => { g.beginPath(); g.moveTo(x0, GY); for (let x = x0; x <= x1 + 20; x += 20) g.lineTo(x, base - amp * (Math.sin(x * 0.006 + seed) + 0.5 * Math.sin(x * 0.017 + seed * 2))); g.lineTo(x1, GY + 200); g.lineTo(x0, GY + 200); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); };
    ridge(GY - 40, 26, GRD2, 1.3); g.fillStyle = GRD; g.fillRect(x0, GY, W, 400); sk_edge([x0, GY], [x1, GY], INK, 3.5);
    g.fillStyle = "rgba(255,255,255,.08)"; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(x0 + rnd(i, 11) * W, GY + 20 + rnd(i, 13) * 120, 40 + rnd(i, 15) * 60, 9, 0, 0, 7); g.fill(); }
    if (key === "moon") for (let i = 0; i < 6; i++) { const cx = x0 + 80 + i * 230 + rnd(i, 4) * 60, cy = GY + 40 + rnd(i, 6) * 100, r = 28 + rnd(i, 8) * 34; g.strokeStyle = INK; g.lineWidth = 2.6; g.fillStyle = "rgba(60,60,90,.35)"; g.beginPath(); g.ellipse(cx, cy, r, r * 0.3, 0, 0, 7); g.fill(); g.stroke(); }
    for (let i = 0; i < 9; i++) { const rx = x0 + 40 + rnd(i, 21) * (W - 80), ry = GY + 24 + rnd(i, 23) * 130, s2 = 8 + rnd(i, 25) * 16; g.fillStyle = GRD2; g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.moveTo(rx - s2, ry); g.lineTo(rx - s2 * 0.4, ry - s2 * 0.8); g.lineTo(rx + s2 * 0.6, ry - s2 * 0.6); g.lineTo(rx + s2, ry); g.closePath(); g.fill(); g.stroke(); }
    // the flag that Apollo 11 left is already standing there
    { const cx = 640;
      if (key === "moon") {       // the first nation on the Moon: the United States (Apollo 11, 1969)
        const fx = cx + 230, fy = GY + 40, FW = 74, FH = 46; sk_edge([fx, fy], [fx, fy - 100], "#e9eef7", 3.2);
        const fl = Math.sin(t * 2) * 1.5; for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f0ff" : "#d9342b"; g.fillRect(fx, fy - 100 + i * FH / 13 + fl * 0.2, FW, FH / 13 + 0.5); }
        g.fillStyle = "#2a3f9f"; g.fillRect(fx, fy - 100, FW * 0.42, FH * 7 / 13); g.fillStyle = "#fff"; for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 5; c2++) g.fillRect(fx + 3 + c2 * 5.8, fy - 97 + r2 * 5.4, 1.8, 1.8);
        g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(fx, fy - 100, FW, FH); hits.land.push({ id: "flag_moon", r: [fx - 8, fy - 108, FW + 16, FH + 100] }); }
    }
    // the lander / probe
    const lander = cfg.craft === "lander", spr0 = lander ? SP.craft_lander : SP.craft_probe, k = lander ? 0.8 : 0.9, w = spr0.w * k * 1.6, h = spr0.h * k * 1.6, cx = 640;
    const f = ease(clamp(p / 0.66)), yTop = -150, yEnd = GY + 40 - h / 2, cy = yTop + (yEnd - yTop) * f, chute = key !== "moon" && p < 0.45;
    const landed = p >= 0.66;
    if (chute) { const cw = 190, ch = 120; g.fillStyle = key === "venus" ? "#ffb25a" : "#f4f0ff"; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - cw / 2, cy - h / 2 - 150 + ch * 0.5); g.quadraticCurveTo(cx, cy - h / 2 - 150 - ch * 0.6, cx + cw / 2, cy - h / 2 - 150 + ch * 0.5); g.quadraticCurveTo(cx + cw / 4, cy - h / 2 - 150 + ch * 0.7, cx, cy - h / 2 - 150 + ch * 0.5); g.quadraticCurveTo(cx - cw / 4, cy - h / 2 - 150 + ch * 0.7, cx - cw / 2, cy - h / 2 - 150 + ch * 0.5); g.fill(); g.stroke(); for (const dx of [-cw / 2, -cw / 5, cw / 5, cw / 2]) sk_edge([cx + dx, cy - h / 2 - 150 + ch * 0.5], [cx + dx * 0.15, cy - h / 2 + 4], "#3d3a52", 1.6); }
    const sway = chute ? Math.sin(t * 2) * 0.06 : 0;
    g.save(); g.translate(cx, cy); g.rotate(sway); g.drawImage(IMG[lander ? "craft_lander" : "craft_probe"], -w / 2, -h / 2, w, h); g.restore();
    if (!landed && !chute && p > 0.02) { glow(cx, cy + h / 2, 90, "255,170,80", 0.45); flame(cx, cy + h / 2 - 6, 0.34, 0.4, 0, t); }
    if (landed) {            // dust cloud rolling out from the landing spot, then a flag on the Moon and Mars
      const dp = clamp((p - 0.66) / 0.34);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283, d = 20 + dp * 150 * (0.6 + rnd(i, 3) * 0.6); g.fillStyle = `rgba(${key === "mars" ? "230,170,120" : key === "venus" ? "210,150,80" : "210,210,230"},${0.5 * (1 - dp)})`; g.beginPath(); g.ellipse(cx + Math.cos(a) * d, GY + 38 + Math.sin(a) * d * 0.22, 26 + dp * 20, 12 + dp * 8, 0, 0, 7); g.fill(); }
      if (key === "mars") hits.land.push({ id: "mars_lander", r: [cx - w / 2, cy - h / 2, w, h] });
      if (key === "venus") hits.land.push({ id: "venus_probe", r: [cx - w / 2, cy - h / 2, w, h] });
      ink(key === "venus" ? "Signal lost after about an hour at 465 °C" : "Touchdown! Landing successful", cx, 120, 28, key === "venus" ? "#ffd2a0" : "#9dffd8", "center", 800);
      if (key === "venus") ink("Venus is hot enough to melt lead, and the pressure is about 90 times that of Earth.", cx, 156, 16, "#fff3d8", "center", 700);
    } else ink(chute ? "Parachute descent" : "Engine burn: slowing for touchdown", cx, 120, 24, "#fff", "center", 800);
    ANCH.craft = [cx, cy]; ANCH.planet = [cx, GY];
    if (hits.land.length) partInfo(hits.land, t, 270);
    if (p < 0.1) { g.fillStyle = `rgba(255,245,230,${1 - p / 0.1})`; g.fillRect(x0, vis.y0, W, vis.y1 - vis.y0); }       // crossfade from the orbit view
  }
  // ---- scientific background pieces for the cruise ----
  function sunGlare(x, y, r, label) {          // the Sun: NASA's SDO photograph with a soft corona
    const t = G.time;
    glow(x, y, r * 7, "255,150,50", 0.22 + 0.04 * Math.sin(t * 0.8)); glow(x, y, r * 3, "255,190,90", 0.5); glow(x, y, r * 1.6, "255,225,150", 0.55);
    if (PH.sun) { g.save(); g.translate(x, y); g.rotate(t * 0.01); g.drawImage(PH.sun, -r, -r, r * 2, r * 2); g.restore(); }
    else { g.fillStyle = "#ffb347"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    if (label) label_(x, y + r * 2.3 + 8, label);
  }
  function geoRing(Ex, Ey, Re, t) {                // geostationary belt at 6.6 Earth radii, with the Turkish Türksat satellites
    const RR = 6.6 * Re; if (RR > 1500 || RR < 40) return;
    g.save(); g.strokeStyle = "rgba(255,210,63,.4)"; g.lineWidth = 1.8; g.setLineDash([7, 9]); g.beginPath(); g.arc(Ex, Ey, RR, 0, 7); g.stroke(); g.setLineDash([]);
    window.WORLD.geo.forEach((q, i) => { const th = -0.5 - (q.lon - 31) * 0.045 + t * 0.02, x = Ex + Math.cos(th) * RR, y = Ey + Math.sin(th) * RR; if (x < 30 || x > 1250 || y < 40 || y > 700) return; satDraw("turksat", x, y, 70 * Math.min(1, RR / 300 + 0.5)); label(x, i === 2 ? y + 46 : y - 34, q.name, 11, "#ffd23f"); });
    const lx = Ex + Math.cos(-0.15) * RR, ly = Ey + Math.sin(-0.15) * RR; if (lx > 100 && lx < 1180 && ly > 60 && ly < 690) label(lx, ly + 18, "Geostationary orbit · 35,786 km", 11, "rgba(255,226,138,.9)");
    g.restore();
  }
  function kepler(M, e) { let E = M; for (let i = 0; i < 12; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
  // ---- one continuous camera for the whole journey: Earth -> (Moon orbit, geostationary belt) -> the Solar System -> the destination ----
  const RKM = { earth: 6371, moon: 1737, venus: 6052, mars: 3390, jupiter: 69911, sun: 696000 }, smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const niceKm = x => { const p = Math.pow(10, Math.floor(Math.log10(x))), q = x / p; return (q < 2 ? 1 : q < 5 ? 2 : 5) * p; };
  const fmtKm = v => v >= 1.496e7 ? (v / 1.496e8).toFixed(v >= 1.496e8 ? 1 : 2) + " AU" : v >= 1e6 ? (v / 1e6).toLocaleString("en-US") + " million km" : Math.round(v).toLocaleString("en-US") + " km";
  function drawJourney(vis, t, m) {
    const Wd = window.WORLD, Hh = Wd.helio, key = m.cfg.dest, moonTrip = key === "moon", dst = Wd.dest[key], days = dst.days, tr = clamp(m.tr), day = tr * days, AU = 149.6e6, FL = 0.6;
    const size = { moon: 1.0, mars: 0.9, venus: 1.05, jupiter: 1.35 }[key] || 1, rdst = RKM[key], wm = 2 * Math.PI / 27.32, TAU = 2 * Math.PI;
    const earthAt = dd => moonTrip ? [0, 0] : [AU * Math.cos(TAU * dd / 365.25), AU * Math.sin(TAU * dd / 365.25)];
    const ph0 = id => id === key ? Math.PI - TAU * days / Hh[id].per : Hh[id].ph, helioAt = (id, dd) => { const th = ph0(id) + TAU * dd / Hh[id].per; return [Hh[id].au * AU * Math.cos(th), Hh[id].au * AU * Math.sin(th)]; };
    const moonAt = (dd, eP) => { const th = (moonTrip ? Math.PI - wm * days : 1.0) + wm * dd; return [eP[0] + 384400 * Math.cos(th), eP[1] + 384400 * Math.sin(th)]; };
    const destAt = dd => moonTrip ? moonAt(dd, [0, 0]) : helioAt(key, dd);
    const r1 = moonTrip ? 6700 : AU, r2 = moonTrip ? 384400 : Hh[key].au * AU, a1 = (r1 + r2) / 2, e = Math.abs(r2 - r1) / (r1 + r2), out = r2 > r1, M0 = out ? 0 : Math.PI;
    const posAt = f => { const M = M0 + Math.PI * f, E = kepler(M, e), nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)), rr = a1 * (1 - e * e) / (1 + e * Math.cos(nu)), th = out ? nu : nu - Math.PI; return [rr * Math.cos(th), rr * Math.sin(th)]; };
    const K0 = 900 / RKM.earth, xmax = moonTrip ? 192200 * 1.12 : Math.max(1, Hh[key].au) * AU * 1.12, Kc = moonTrip ? 540 / xmax : 500 / xmax, Kend = 175 * size / rdst, z1 = moonTrip ? 0.24 : 0.28, z2 = 0.8;
    let K, u1 = 1, w = 0; if (tr < z1) { u1 = tr / z1; K = K0 * Math.pow(Kc / K0, smooth(u1)); } else if (tr < z2) K = Kc; else { w = (tr - z2) / (1 - z2); K = Kc * Math.pow(Kend / Kc, smooth(w)); }
    // the camera keeps the Earth on screen: the Earth's screen position glides from the lower-left corner to where it sits in the final cruise view
    // the Earth starts big at the bottom of the screen (like the ascent view) and glides to its place in the final view; the world is turned by 180 degrees for outward trips so the departure heads upwards
    const us = smooth(u1), eP = earthAt(day), cC = moonTrip ? [-192200, 0] : [0, 0], ROT = out ? Math.PI : 0, cR = Math.cos(ROT), sR = Math.sin(ROT);
    const rot = v => [v[0] * cR - v[1] * sR, v[0] * sR + v[1] * cR], unrot = v => [v[0] * cR + v[1] * sR, -v[0] * sR + v[1] * cR];
    const eRel = rot([eP[0] - cC[0], eP[1] - cC[1]]), Ac = [640 + eRel[0] * Kc, 372 + eRel[1] * Kc * FL], A = [640 + (Ac[0] - 640) * us, 450 + (Ac[1] - 450) * us + (1 - us) * RKM.earth * K];   // the top of the Earth stays near the horizon height of the ascent view while it shrinks
    const dW = destAt(day), ws = smooth(w), toWorld = (sx, sy) => unrot([(sx - 640) / K, (sy - 372) / (K * FL)]);
    let cam; { const u = toWorld(A[0], A[1]); cam = [eP[0] - u[0], eP[1] - u[1]]; }
    if (tr >= z1) { cam = cC; if (tr >= z2) { const dRel = rot([dW[0] - cC[0], dW[1] - cC[1]]), Adc = [640 + dRel[0] * Kc, 372 + dRel[1] * Kc * FL], Ad = [Adc[0] + (1010 - Adc[0]) * ws, Adc[1] + (250 - Adc[1]) * ws], u = toWorld(Ad[0], Ad[1]); cam = [dW[0] - u[0], dW[1] - u[1]]; } }
    const pan = [0, 0], proj0 = (wp, pn) => { const r = rot([wp[0] - cam[0], wp[1] - cam[1]]); return [640 + pn[0] + r[0] * K, 372 + pn[1] + r[1] * K * FL]; }, P = wp => proj0(wp, pan);
    tileBg("bg_space", vis, t * 8, 1280, 2560); g.globalAlpha = 0.85; tileBg("bg_stars_near", vis, t * 22, 1280, 2560); g.globalAlpha = 1;
    const ellip = (c, rpx, col, lw, dash) => { if (rpx < 14 || rpx > 2600) return false; g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash || []); g.beginPath(); g.ellipse(c[0], c[1], rpx, rpx * FL, 0, 0, 7); g.stroke(); g.setLineDash([]); return true; };
    { const sp = moonTrip ? [640 + 4000, 372 - 2400] : P([0, 0]), srad = Math.max(RKM.sun * K, 20); let sx = sp[0], sy = sp[1];
      if (sx < 70 || sx > 1210 || sy < 70 || sy > 670) { const dx = sx - 640, dy = sy - 372, tt = Math.min(dx ? 560 / Math.abs(dx) : 1e9, dy ? 290 / Math.abs(dy) : 1e9); sx = 640 + dx * tt; sy = 372 + dy * tt; sunGlare(sx, sy, 20, "Sun"); }
      else sunGlare(sx, sy, Math.min(srad, 40), "Sun"); }
    if (!moonTrip) {
      const sp = P([0, 0]); for (const id of Object.keys(Hh)) { const hh = Hh[id], rpx = hh.au * AU * K; if (hh.au > xmax / AU * 1.05) continue; if (ellip(sp, rpx, id === "earth" ? "rgba(111,180,255,.45)" : id === key ? "rgba(255,160,100,.55)" : "rgba(190,200,255,.22)", id === key || id === "earth" ? 1.8 : 1.2, id === "earth" ? null : [5, 7]) && rpx > 70 && rpx < 800) label(sp[0], sp[1] - rpx * FL - 5, hh.name + " · " + hh.au + " AU", 10, "rgba(200,210,255,.7)"); }
      if (xmax / AU > 3.4 && 3.2 * AU * K > 40 && 2.2 * AU * K < 2600) { for (let i = 0; i < 520; i++) { const rr = 2.2 + rnd(i, 3), th = rnd(i, 5) * TAU + TAU * day / (365.25 * Math.pow(rr, 1.5)), p = P([rr * AU * Math.cos(th), rr * AU * Math.sin(th)]); if (p[0] < -10 || p[0] > 1290 || p[1] < -10 || p[1] > 730) continue; g.fillStyle = `rgba(190,180,170,${0.35 + rnd(i, 7) * 0.4})`; g.beginPath(); g.arc(p[0], p[1], 0.8 + rnd(i, 9) * 1.3, 0, 7); g.fill(); } const lp = P([2.7 * AU * Math.cos(5.6), 2.7 * AU * Math.sin(5.6)]); if (lp[1] > 40 && lp[1] < 690 && 2.7 * AU * K > 120) label(lp[0], lp[1] + 22, "Asteroid belt · 2.2–3.2 AU", 11, "#d8c9a8"); }
    }
    const eC = P(eP), Re = Math.max(RKM.earth * K, moonTrip ? 12 : 10);
    { const gr = 42164 * K, mr = 384400 * K;
      if (ellip(eC, gr, "rgba(255,210,63,.45)", 1.8, [7, 9]) && gr > 70 && gr < 700) { window.WORLD.geo.forEach((q, i) => { const th = -0.5 - (q.lon - 31) * 0.045 + t * 0.02, x = eC[0] + Math.cos(th) * gr, y = eC[1] + Math.sin(th) * gr * FL; if (x < 30 || x > 1250 || y < 40 || y > 700) return; satDraw("turksat", x, y, 64); label(x, i === 2 ? y + 42 : y - 32, q.name, 11, "#ffd23f"); }); label(eC[0] + Math.cos(-0.15) * gr, eC[1] + Math.sin(-0.15) * gr * FL + 22, "Geostationary orbit · 35,786 km", 11, "rgba(255,226,138,.9)"); }
      if (!moonTrip && ellip(eC, mr, "rgba(210,210,230,.35)", 1.4, [4, 8]) && mr > 70 && mr < 800) label(eC[0], eC[1] - mr * FL - 6, "Moon's orbit · 384,400 km", 10, "rgba(220,220,240,.75)"); }
    const pathA = clamp((2600 - r2 * K) / 1400) * (1 - smooth((tr - 0.86) / 0.1));
    if (pathA > 0.02) { g.save(); g.globalAlpha = pathA; g.strokeStyle = "rgba(190,210,255,.4)"; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); for (let i = 0; i <= 80; i++) { const p = P(posAt(i / 80)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.setLineDash([]);
      g.strokeStyle = "rgba(91,227,176,.9)"; g.lineWidth = 3.4; g.beginPath(); for (let i = 0; i <= 80; i++) { const p = P(posAt(tr * i / 80)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore(); }
    const SIZ = { mercury: 6, venus: 9, earth: 10, mars: 8, jupiter: 17, saturn: 14 }, showName = (x, y, r, txt, col) => { if (r < 60 && x > 20 && x < 1260 && y > 30 && y < 690) label(x, y + r + 14, txt, 11, col); };
    if (!moonTrip) for (const id of Object.keys(Hh)) { if (id === "earth" || id === key || Hh[id].au > xmax / AU * 1.05) continue; const p = P(helioAt(id, day)), r = Math.max((RKM[id] || 3000) * K, SIZ[id]); if (p[0] > -50 && p[0] < 1330 && p[1] > -50 && p[1] < 770) { planet(id === "mercury" || id === "saturn" ? "moon" : id, p[0], p[1], r, t); showName(p[0], p[1], r, Hh[id].name, "#e9eef7"); } }
    if (!moonTrip) { const mp = P(moonAt(day, eP)), mr0 = 384400 * K; if (mr0 > 28) { planet("moon", mp[0], mp[1], Math.max(RKM.moon * K, 4), t); showName(mp[0], mp[1], Math.max(RKM.moon * K, 4), "Moon", "#d8d8e8"); } }
    if (Re > 40) earthDisc(eC[0], eC[1], Re); else planet("earth", eC[0], eC[1], Re, t); showName(eC[0], eC[1], Re, "Earth", "#8fd0ff");
    { const dp = P(destAt(day)), rd = Math.max(rdst * K, (SIZ[key] || 8) + (moonTrip ? 4 : 2));
      if (rd < 40) { const arrP = P(destAt(days)), pu = 6 + 4 * Math.sin(t * 4); g.strokeStyle = "rgba(255,160,100,.85)"; g.lineWidth = 1.6; g.setLineDash([3, 4]); g.beginPath(); g.arc(arrP[0], arrP[1], rd + pu, 0, 7); g.stroke(); g.setLineDash([]); }
      planet(key, dp[0], dp[1], rd, t); showName(dp[0], dp[1], rd, dst.short, "#ffb070"); }
    const wp = posAt(tr), np = posAt(Math.min(1, tr + 0.01)), p0 = P(wp); let cp = p0; const cn = P(np), off = [cp[0] - eC[0], cp[1] - eC[1]], dist0 = Math.hypot(off[0], off[1]), L = Re + 200 + 2400 * smooth((tr - 0.08) / 0.22);
    if (tr < z1 + 0.12) { const dir = dist0 > 1e-3 ? [off[0] / dist0, off[1] / dist0] : [0, -1], dd2 = Math.max(Math.min(dist0, L), RKM.earth * K + 150 * (1 - us) + 34 * us); cp = [eC[0] + dir[0] * dd2, eC[1] + dir[1] * dd2];
      const o2 = [cp[0] - eC[0], cp[1] - eC[1]]; let sc2 = 1; if (o2[0] > 0) sc2 = Math.min(sc2, (1190 - eC[0]) / o2[0]); if (o2[0] < 0) sc2 = Math.min(sc2, (90 - eC[0]) / o2[0]); if (o2[1] > 0) sc2 = Math.min(sc2, (640 - eC[1]) / o2[1]); if (o2[1] < 0) sc2 = Math.min(sc2, (110 - eC[1]) / o2[1]); if (sc2 > 0 && sc2 < 1) cp = [eC[0] + o2[0] * sc2, eC[1] + o2[1] * sc2]; }   // keep the craft on screen while the camera is still zooming out
    let ang = Math.atan2(cn[1] - p0[1], cn[0] - p0[0]) + Math.PI / 2;
    // while zooming in on the destination the craft keeps its direction and glides into the arrival-orbit entry point (no jump when the arrival scene starts)
    let retro = false;
    if (tr >= z2) {
      const dp = P(dW), o = [p0[0] - dp[0], p0[1] - dp[1]], mag0 = Math.hypot(o[0], o[1]), dir0 = mag0 > 1e-6 ? [o[0] / mag0, o[1] / mag0] : [-0.961, 0.276], k = smooth((tr - z2) / (1 - z2));
      const R0 = Math.min(330, 175 * size), ORx = R0 * 1.42 + 34, F = [-0.961, 0.276], dv = [dir0[0] + (F[0] - dir0[0]) * k, dir0[1] + (F[1] - dir0[1]) * k], dl = Math.hypot(dv[0], dv[1]) || 1, mag = Math.min(mag0, 560) + (ORx - Math.min(mag0, 560)) * k;
      let ox = dv[0] / dl * mag, oy = dv[1] / dl * mag, sc3 = 1;                       // never leave the screen on the way in
      if (ox > 0) sc3 = Math.min(sc3, (1200 - dp[0]) / ox); if (ox < 0) sc3 = Math.min(sc3, (80 - dp[0]) / ox); if (oy > 0) sc3 = Math.min(sc3, (660 - dp[1]) / oy); if (oy < 0) sc3 = Math.min(sc3, (100 - dp[1]) / oy);
      if (sc3 > 0 && sc3 < 1) { ox *= sc3; oy *= sc3; }
      cp = [dp[0] + ox, dp[1] + oy];
      const tgt = Math.atan2(-0.288 * ORx, -0.0828 * ORx) + Math.PI / 2; let dlt = tgt - ang; dlt = ((dlt + Math.PI * 3) % (Math.PI * 2)) - Math.PI; ang += dlt * k; retro = tr > 0.92;
    }
    let sc = 0.42 - 0.2 * smooth(u1) + 0.12 * ws;
    { const e0 = m.xf < 1 ? 0 : smooth(tr / 0.2);              // at the start of the journey the craft is exactly where the close-up showed it, then it flies out
      if (e0 < 1) { const c0 = [400, 330 + Math.sin(t * 0.8) * 6], sc0 = m.cfg.craft === "orion" ? 1.5 : 1.75, a0 = 0.5; let dlt = ang - a0; dlt = ((dlt + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        cp = [c0[0] + (cp[0] - c0[0]) * e0, c0[1] + (cp[1] - c0[1]) * e0]; sc = sc0 + (sc - sc0) * e0; ang = a0 + dlt * e0; } }
    ANCH.craft = cp; ANCH.planet = P(destAt(day));
    glow(cp[0], cp[1], 26 * sc / 0.3, "91,227,176", 0.3); drawCraftSprite(m.cfg.craft, cp[0], cp[1], sc, ang, tr < 0.08, t, m.phase === "lost", retro);
    const dEarth = Math.hypot(wp[0] - eP[0], wp[1] - eP[1]), stage = tr < z1 ? "Leaving Earth: zooming out" : tr < z2 ? (moonTrip ? "Coasting to the Moon" : "Cruising through the Solar System") : "Approaching " + dst.name;
    ink(stage, 640, 38, 18, "#fff", "center", 800);
    ink("Distance from Earth: " + (dEarth < 1e7 ? Math.round(dEarth).toLocaleString("en-US") + " km" : (dEarth / 1e6).toFixed(1) + " million km") + " · radio signal takes " + (dEarth / 299792 < 90 ? (dEarth / 299792).toFixed(dEarth / 299792 < 10 ? 1 : 0) + " s" : (dEarth / 299792 / 60).toFixed(1) + " min"), 640, 62, 14, "#e9eef7", "center", 700);
    ink("Day " + Math.round(day) + " of " + days + (moonTrip ? "" : " · orbits and distances are to scale; planet sizes are not"), 640, 84, 12, "#b9bcec", "center", 600);
    { const kmLen = niceKm(170 / K), px = kmLen * K; g.strokeStyle = "#e9eef7"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(1000, 690); g.lineTo(1000 + px, 690); g.moveTo(1000, 684); g.lineTo(1000, 696); g.moveTo(1000 + px, 684); g.lineTo(1000 + px, 696); g.stroke(); ink(fmtKm(kmLen), 1000, 676, 12, "#e9eef7", "left", 700); }
  }
  // ---- interplanetary cruise, orbit insertion and landing ----
  // things that really happen on the worlds we visit: small animated hot spots on the planet, hover for a short NASA note
  const PEV = {
    venus: [{ id: "ev_venus_volcano", x: -0.22, y: 0.2, k: "volcano", n: "Volcano" }],
    mars: [{ id: "ev_mars_dust", x: 0.26, y: 0.3, k: "dust", n: "Dust devil" }, { id: "ev_mars_dust", x: -0.4, y: -0.12, k: "dust", n: "Dust devil", o: 1.7 }],
    jupiter: [{ id: "ev_jupiter_lightning", x: 0.2, y: -0.6, k: "bolt", n: "Lightning" }, { id: "ev_jupiter_lightning", x: -0.36, y: 0.6, k: "bolt", n: "Lightning", o: 2.9 }, { id: "ev_jupiter_lightning", x: 0.5, y: -0.3, k: "bolt", n: "Lightning", o: 5.3 }]
  };
  function drawPlanetEvents(key, px, py, R, t, al) {
    const list = PEV[key]; if (!list || al < 0.05) return;
    const s = clamp(R * 0.12, 13, 30);
    list.forEach((e, i) => {
      const x = px + e.x * R, y = py + e.y * R, o = e.o || 0, ph = t + o;
      g.save(); g.globalAlpha = al;
      if (e.k === "volcano") {
        g.fillStyle = "#4a2a22"; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s * 1.1, y + s * 0.6); g.lineTo(x - s * 0.28, y - s * 0.5); g.lineTo(x + s * 0.28, y - s * 0.5); g.lineTo(x + s * 1.1, y + s * 0.6); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = "#ff8a3a"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + s * 0.1, y - s * 0.4); g.quadraticCurveTo(x + s * 0.3, y, x + s * 0.2, y + s * 0.55); g.stroke();
        glow(x, y - s * 0.6, s * (1.5 + 0.3 * Math.sin(ph * 5)), "255,140,50", 0.65);
        for (let j = 0; j < 7; j++) { const u = (ph * 0.55 + j / 7) % 1; g.fillStyle = `rgba(255,${150 + j * 12},70,${0.9 * (1 - u)})`; g.beginPath(); g.arc(x + Math.sin(j * 3.1 + ph) * s * 0.4 * u, y - s * 0.55 - u * s * 2.3, s * (0.22 + 0.1 * (1 - u)), 0, 7); g.fill(); }
      } else if (e.k === "dust") {
        const dx = Math.sin(ph * 0.5) * s * 0.5;
        for (let j = 0; j < 9; j++) { const u = j / 8, w = s * (0.22 + 0.7 * u), yy = y + s * 0.9 - u * s * 2.2, xx = x + dx * u + Math.sin(ph * 6 + j * 0.9) * s * 0.14;
          g.fillStyle = `rgba(232,176,126,${0.75 - u * 0.3})`; g.strokeStyle = "rgba(90,45,30,.55)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(xx, yy, w, w * 0.26, 0, 0, 7); g.fill(); g.stroke(); }
      } else {
        const cyc = ph * 1.6, n = Math.floor(cyc), f = cyc - n, on = rnd(n + i * 13, 5) > 0.35 && f < 0.28, k = on ? 1 - f / 0.28 : 0;
        glow(x, y, s * (1.2 + 1.8 * k), "190,215,255", 0.18 + 0.6 * k);
        if (on) { g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * k})`; g.lineWidth = 2.6; g.shadowColor = "#9cc3ff"; g.shadowBlur = 12; g.beginPath(); let bx = x - s * 0.1, by = y - s * 1.1; g.moveTo(bx, by); for (let j = 1; j <= 5; j++) { bx = x + (rnd(n + j, 7 + i) - 0.5) * s * 0.9; by = y - s * 1.1 + j * s * 0.46; g.lineTo(bx, by); } g.stroke(); }
        else { g.fillStyle = "rgba(220,235,255,.7)"; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
      }
      const pr = (ph * 0.7) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - pr)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, s * (1.2 + pr * 0.8), 0, 7); g.stroke();       // soft ring: "hover me"
      label(x, y + s * 1.45 + 10, e.n, 11, "rgba(255,255,255,.92)");
      g.restore();
      if (al > 0.5) hits.land.push({ id: e.id, r: [x - s * 1.25, y - s * 1.7, s * 2.5, s * 3.3] });
    });
  }
  function drawDeep(vis, t) {
    const m = G.mission, cfg = m.cfg, key = cfg.dest, lost = m.phase === "lost", arriving = m.phase === "arrival", dur = m.arDur || Game.AR_DUR;
    const prog = m.phase === "transfer" ? m.tr : 1, arrT = arriving ? clamp(m.ar / dur) : 0, land = arriving && m.land;
    if (land && arrT > 0.5) { drawLanding(vis, t, (arrT - 0.5) / 0.5, key, cfg); return; }
    if (!arriving) {       // the whole cruise is one continuous zooming camera
      drawJourney(vis, t, m);
      if (lost) { g.fillStyle = `rgba(255,40,40,${0.10 + 0.08 * Math.sin(t * 6)})`; g.fillRect(vis.x0, vis.y0, vis.x1 - vis.x0, vis.y1 - vis.y0); }
      return;
    }
    const a = arriving ? (land ? clamp(arrT / 0.5) : arrT) : 0, ae = ease(a);
    tileBg("bg_space", vis, t * 8, 1280, 2560); g.globalAlpha = 0.85; tileBg("bg_stars_near", vis, t * 22, 1280, 2560); g.globalAlpha = 1;
    const size = { moon: 1.0, mars: 0.9, venus: 1.05, jupiter: 1.35 }[key] || 1;
    const R = Math.min(330, (10 + 165 * Math.pow(clamp(prog), 2.4)) * size + ae * 70 * size), px = 1010 - ae * 330, py = 250 + ae * 90;
    // orbit geometry (craft)
    const ORx = R * 1.42 + 34, ORy = ORx * 0.3, tilt = -0.28, ct = Math.cos(tilt), st = Math.sin(tilt);
    const opos = (th, rx, ry, tl = tilt) => { const c2 = Math.cos(tl), s2 = Math.sin(tl); return [px + rx * Math.cos(th) * c2 - ry * Math.sin(th) * s2, py + rx * Math.cos(th) * s2 + ry * Math.sin(th) * c2]; };
    const start = opos(Math.PI, ORx, ORy);
    // trajectory curve ends exactly where the orbit begins
    const x0 = 260, y0 = 540, x1 = start[0], y1 = start[1], cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 150;
    const B = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
    const trailA = 0;
    if (trailA > 0.02) { g.globalAlpha = trailA; g.lineWidth = 2; g.setLineDash([8, 8]); g.strokeStyle = "rgba(190,210,255,.35)"; g.beginPath(); for (let i = 0; i <= 40; i++) { const [bx, by] = B(i / 40); i ? g.lineTo(bx, by) : g.moveTo(bx, by); } g.stroke(); g.setLineDash([]);
      const u = arriving ? 1 : clamp(prog, 0.01, 1); g.strokeStyle = "rgba(91,227,176,.8)"; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 40; i++) { const [bx, by] = B(u * i / 40); i ? g.lineTo(bx, by) : g.moveTo(bx, by); } g.stroke(); g.globalAlpha = 1; }
    // things in orbit: the craft and the real NASA spacecraft, drawn behind or in front of the planet
    const back = [], front = [], orb = window.WORLD.dest[key].orb || [], oa = clamp((prog - 0.7) / 0.3) * (arriving ? 1 : 0.85);
    const ring = (rx, ry, tl, al) => { g.strokeStyle = `rgba(190,210,255,${al})`; g.lineWidth = 1.6; g.setLineDash([5, 7]); const half = f => { g.beginPath(); for (let i = 0; i <= 40; i++) { const th = (f ? 0 : Math.PI) + i / 40 * Math.PI, p = opos(th, rx, ry, tl); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }; return half; };
    const rings = [];
    if (oa > 0.05) orb.forEach((o, i) => {
      const rx = Math.min(540, R * (1.95 + 0.42 * i) + 50), ry = rx * (0.2 + 0.06 * i), tl = 0.32 - 0.3 * i, th = t * (0.45 - 0.09 * i) + i * 2.1, p = opos(th, rx, ry, tl), isF = Math.sin(th) > 0;
      rings.push([rx, ry, tl]); (isF ? front : back).push(() => { g.globalAlpha = oa; const w = (o.id === "iss" ? 78 : 62) * (isF ? 1 : 0.8); satDraw(o.id, p[0], p[1], w, 0, isF ? 1 : 0.8); label(p[0], p[1] - w * 0.42 - 6, (o.n.match(/\((.*)\)/) || [0, o.n])[1], 11, o.st === "historic" ? "#c9a96a" : o.st === "active" ? "#9fd8ff" : "#ffd23f"); g.globalAlpha = 1; });
    });
    // the player's craft
    let sx, sy, ang, retro = false, isF = true, sc = 0.42;
    if (arriving) { const th = Math.PI + ae * Math.PI * 2.35 + (a >= 1 ? t * 0.5 : 0), p = opos(th, ORx, ORy), tx = -ORx * Math.sin(th) * ct - ORy * Math.cos(th) * st, ty = -ORx * Math.sin(th) * st + ORy * Math.cos(th) * ct; sx = p[0]; sy = p[1]; ang = Math.atan2(ty, tx) + Math.PI / 2; isF = Math.sin(th) > 0; sc = 0.34 + (isF ? 0.08 : 0); retro = a < 0.3; }
    else { const u = clamp(prog, 0.01, 1), [bx, by] = B(u), [cx2, cy2] = B(Math.min(1, u + 0.02)); sx = bx; sy = by; ang = Math.atan2(cy2 - by, cx2 - bx) + Math.PI / 2; }
    ANCH.craft = [sx, sy]; ANCH.planet = [px, py - R * 0.2];
    const craftDraw = () => drawCraftSprite(cfg.craft, sx, sy, sc, ang, prog < 0.1 && !arriving, t, lost, retro);
    (isF ? front : back).push(craftDraw);
    if (arriving && a > 0.15) { const al = clamp((a - 0.15) / 0.3) * 0.35; g.save(); g.globalAlpha = al; g.strokeStyle = "#5be3b0"; g.lineWidth = 2; g.setLineDash([4, 6]); g.beginPath(); for (let i = 0; i <= 80; i++) { const p = opos(i / 80 * Math.PI * 2, ORx, ORy); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.setLineDash([]); g.restore(); }
    for (const fn of back) fn();
    planet(key, px, py, R, t);
    hits.land = []; if (arriving) drawPlanetEvents(key, px, py, R, t, clamp((a - 0.6) / 0.3));
    for (const fn of front) fn();
    if (lost) { g.fillStyle = `rgba(255,40,40,${0.10 + 0.08 * Math.sin(t * 6)})`; g.fillRect(vis.x0, vis.y0, vis.x1 - vis.x0, vis.y1 - vis.y0); }
    if (arriving && hits.land.length) partInfo(hits.land, t, 270);
    if (arriving && land && arrT > 0.42) { const o = clamp((arrT - 0.42) / 0.08); g.fillStyle = `rgba(255,245,230,${o})`; g.fillRect(vis.x0, vis.y0, vis.x1 - vis.x0, vis.y1 - vis.y0); }   // flash into the landing scene
  }
  function drawPuff(p, camY) {
    const a = clamp(1 - p.age / p.life) * 0.85, w = 120 * p.s, h = 112 * p.s;
    g.globalAlpha = a; g.drawImage(IMG["fx_smoke_" + p.k], p.x - w / 2, p.wy + camY - h / 2, w, h); g.globalAlpha = 1;
  }
  function drawDebris(d, RS, t) {
    const a = clamp((d.life - d.age) / 0.8), cp = Math.cos(d.phi || 0), sp = Math.sin(d.phi || 0), ro = (ox, oy) => [ox * cp - oy * sp, ox * sp + oy * cp];
    g.save(); g.globalAlpha = a;
    if (d.kind === "srb_l" || d.kind === "srb_r") {
      const name = "rocket_sls_" + d.kind, dc = SP[name].doc, c = SP[name].c, o = ro((dc[0] + c[2] / 2 - 297) * RS, (dc[1] + c[3] / 2 - 332) * RS), px = d.x + o[0], py = d.y + o[1];
      g.translate(px, py); g.rotate(d.rot); g.drawImage(IMG[name], c[0], c[1], c[2], c[3], -c[2] * RS / 2, -c[3] * RS / 2, c[2] * RS, c[3] * RS);
      if (d.age < 0.7) flame(0, c[3] * RS / 2 - 3, 0.3 * (1 - d.age / 0.7), 0.5 * (1 - d.age / 0.7), 2, t);
    } else if (d.kind === "core") {
      const name = "rocket_sls_stage1", dc = SP[name].doc, c = SP[name].c, o = ro(0, (dc[1] + c[3] / 2 - 332) * RS);
      g.translate(d.x + o[0], d.y + o[1]); g.rotate(d.rot); g.drawImage(IMG[name], c[0], c[1], c[2], c[3], -c[2] * RS / 2, -c[3] * RS / 2, c[2] * RS, c[3] * RS);
    } else if (d.kind === "las_small") {
      const c = SP.rocket_sls_nosrb.c, o = ro(0, -316 * RS); g.translate(d.x + o[0], d.y + o[1]); g.rotate(d.rot); g.drawImage(IMG.rocket_sls_nosrb, c[0], c[1], c[2], 29, -c[2] * RS / 2, -14 * RS, c[2] * RS, 29 * RS);
    }
    g.restore();
  }
  // Yakın kamera penceresi: iptal kulesinin atılışı (çizimcinin büyük üst kademe ve kule çizimleri)
  function drawPip(t) {
    const m = G.mission; if (m.phase !== "flight" || m.T < 183 || m.T > 226) return;
    const a = clamp(Math.min((m.T - 183) / 5, (226 - m.T) / 5)), e = ease(a), N = ANCH.nose, w = 200, h = 236, X = Math.max(60, N[0] - 80 - w), Y = Math.max(70, N[1] - 120);
    g.save();
    // a magnifier: two lines from the real Orion at the top of the rocket to the enlarged camera view
    g.globalAlpha = a; g.strokeStyle = "rgba(160,150,255,.7)"; g.lineWidth = 1.6; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(N[0] - 6, N[1] + 4); g.lineTo(X + w, Y + 4); g.moveTo(N[0] - 6, N[1] + 26); g.lineTo(X + w, Y + h - 4); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#ff9a52"; g.lineWidth = 2.4; g.beginPath(); g.ellipse(N[0], N[1] + 18, 12, 26, 0, 0, 7); g.stroke();
    g.translate(X + w, Y + h / 2); g.scale(e, e); g.translate(-(X + w), -(Y + h / 2));              // grows out of the Orion
    g.fillStyle = "#0e0a34"; g.strokeStyle = "#5a4cc0"; g.lineWidth = 3; g.beginPath(); g.roundRect(X, Y, w, h, 12); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(X + 3, Y + 3, w - 6, h - 6, 10); g.clip();
    g.drawImage(IMG.bg_space, 200, 600 + (t * 40) % 700, 400, 524, X, Y, w, h);
    const cx = X + w / 2, by = Y + h - 14, sc = 0.58;
    flame(cx, by - 6, 0.24, 0.16, 1, t);
    const r = art("rocket_sls_stage2", cx, by, sc);
    const f = m.lasFly < 0 ? 0 : m.lasFly, lc = SP.rocket_sls_las.c;
    g.save(); g.translate(cx + f * f * 50 + f * 14, r[1] + 6 - f * 110 - f * f * 44); g.rotate(f * 0.9); g.globalAlpha = a * clamp(1.6 - f);
    if (f > 0 && f < 1.2) flame(0, -4, 0.18, 0.22, 4, t);
    g.drawImage(IMG.rocket_sls_las, lc[0], lc[1], lc[2], lc[3], -lc[2] * sc / 2, -lc[3] * sc, lc[2] * sc, lc[3] * sc); g.restore();
    g.restore(); g.save(); g.globalAlpha = a;
    g.fillStyle = "rgba(14,10,52,.85)"; g.beginPath(); g.roundRect(X + 8, Y + 8, 128, 20, 6); g.fill(); label(X + 15, Y + 22, "CAMERA · ORION", 10, "#fff", "left");
    g.restore();
  }
  // satellites near the orbit insertion point (positions relative to the spacecraft)
  function drawSats(m, t) {
    if (!m.sats || !m.calc.ok) return;
    for (const s of m.sats) {
      if (Math.abs(s.delta) > 420) continue;
      const x = 400 + s.delta * 1.5 + Math.sin(t * 0.4) * 3, y = 250 - s.dz * 6, hit = s.pts > 0, sm = SP.craft_probe;
      if (hit) { g.strokeStyle = "rgba(91,227,176,.85)"; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.arc(x, y, 40, 0, 7); g.stroke(); g.setLineDash([]); }
      if (!satDraw(s.id, x, y, s.id === "iss" ? 150 : 110)) g.drawImage(IMG.craft_probe, x - sm.w * 0.3, y - sm.h * 0.3, sm.w * 0.6, sm.h * 0.6);
      label(x, y - 52, s.name.split(" · ")[0] + " · " + Math.round(s.dist) + " km", 11, hit ? "#5be3b0" : "#b9bcec"); if (hit) label(x, y - 68, "+" + s.pts + " pts", 13, "#5be3b0");
    }
  }
  // Yörünge: üst kademe ve Orion yakın plan
  function drawCloseup(vis, t) {
    const m = G.mission; if (m.close <= 0) return;
    const vw = vis.x1 - vis.x0;
    g.save(); g.globalAlpha = ease(m.close);
    tileBg("bg_space", vis, t * 14, 1280, 2560); g.globalAlpha = ease(m.close) * 0.85; tileBg("bg_stars_near", vis, t * 34, 1280, 2560); g.globalAlpha = ease(m.close);
    earthDisc(640, 1350, 900);
    if (m.veh === "shuttle") {   // orbiter docks with the outpost
      const k = ease(clamp(m.doneT / 4.2)), ox = 760, oy = 200, sc = 0.8;
      g.drawImage(IMG.craft_outpost, ox, oy, 290, 140);
      const nx = 120 + k * (ox + 58 - 262 * sc - 120), ny = oy + 75 - 64 * sc;
      glow(ox + 62, oy + 76, 30, "91,227,176", 0.3 * k);
      g.drawImage(IMG.craft_orbiter, nx, ny + Math.sin(t) * (1 - k) * 8, 262 * sc, 120 * sc);
      g.restore(); return;
    }
    const failing = m.calc && !m.calc.ok, fk = failing ? m.doneT : 0;
    // the craft starts exactly where the ascent view left the upper stage (same place, size, upright) and glides into its close-up pose
    const kk = ease(clamp(m.close)), RSl = PAD.RS, dd = SP.rocket_sls_nosrb.doc, rp0 = Game.rocketPos(m), sbx = rp0.x, sby = rp0.y + (dd[1] + 64 - 332) * RSl - 171 * (RSl / 1.5);
    const tx = 400 + fk * 40, ty = 330 + Math.sin(t * 0.8) * 6 + fk * fk * 28 + fk * 40, cx = sbx + (tx - sbx) * kk, cy = sby + (ty - sby) * kk, ss = (RSl + (1.5 - RSl) * kk) / 1.5;
    g.globalAlpha = 1; g.translate(cx, cy); g.rotate((0.5 + fk * 0.9) * kk); g.scale(ss, ss);
    if (failing) { glow(0, 120, 170, "255,120,40", 0.5); flame(0, 166, 0.7, 0.8, 0, t); }
    else { glow(0, 190, 120, "120,190,255", 0.3 * kk);
      const canFilter = "filter" in g; if (canFilter) g.filter = "hue-rotate(185deg) saturate(1.3)";
      flame(0, 166, 0.5, 0.42, 0, t); if (canFilter) g.filter = "none"; }
    if (m.cfg.craft === "orion" || failing) art("rocket_sls_stage2", 0, 171, 1.5);
    else { const k2 = m.cfg.craft === "probe" ? "craft_probe" : "craft_lander", sm = SP[k2]; g.globalAlpha = 1 - kk; art("rocket_sls_stage2", 0, 171, 1.5); g.globalAlpha = kk; g.drawImage(IMG[k2], -sm.w * 1.4, 20 - sm.h * 1.4, sm.w * 2.8, sm.h * 2.8); g.globalAlpha = 1; }
    g.restore();
    if (m.veh !== "shuttle") { g.save(); g.globalAlpha = ease(m.close); drawSats(m, t); g.restore(); }
  }


  // ---------- on-screen callouts: info panel + leader line to the thing it is about ----------
  const ANCH = { base: [640, 600], mid: [640, 400], nose: [640, 250], craft: [640, 360], planet: [1000, 250] };
  const calls = [], FONT = '-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';
  const now = () => performance.now() / 1000;
  function wrap(txt, w, size) {
    g.font = `500 ${size}px ${FONT}`; const out = []; let line = "";
    for (const wd of txt.split(" ")) { const tr = line ? line + " " + wd : wd; if (g.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; }
    if (line) out.push(line); return out;
  }
  // kind: "event" (left panel, orange) | "layer" (right panel, blue); target: base|mid|nose|srb|core|craft|planet
  function say(kind, title, text, target, ttl) {
    for (let i = calls.length - 1; i >= 0; i--) if (calls[i].kind === kind) calls.splice(i, 1);
    calls.push({ kind, title, text, target, t0: now(), ttl: ttl || 8, lines: null });
  }
  function clearCalls() { calls.length = 0; }
  function targetPos(c) {
    const m = G.mission;
    if (c.target === "srb" || c.target === "core") { const d = m.debris.find(q => q.kind.indexOf(c.target) === 0); if (d) return [d.x, d.y - 120]; return ANCH.mid; }
    if (c.target.indexOf("gauge") === 0) {   // the altitude gauge on the right: the atmosphere layer's own band
      const bar = document.getElementById("alt"), idx = +c.target.split(":")[1], seg = [[0, .2], [.2, .45], [.45, .65], [.65, 1]][idx] || [0, 1];
      if (bar && bar.offsetParent) { const r = bar.getBoundingClientRect(), y = r.bottom - (seg[0] + seg[1]) / 2 * r.height, p = toLogical(r.left - 6, y); return [p[0], p[1], r.height * (seg[1] - seg[0]) / view.s]; }
      return [1250, 360, 100];
    }
    return ANCH[c.target] || ANCH.mid;
  }
  // text drawn straight on the scene: dark outline + soft shadow keep it readable on any background
  function ink(txt, x, y, size, col, align, weight) {
    g.font = `${weight} ${size}px ${FONT}`; g.textAlign = align; g.lineJoin = "round";
    g.strokeStyle = "rgba(8,4,34,.95)"; g.lineWidth = 7; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); g.textAlign = "left";
  }
  function drawCallouts(vis) {
    const T = now();
    for (let i = calls.length - 1; i >= 0; i--) {
      const c = calls[i], age = T - c.t0; if (age > c.ttl) { calls.splice(i, 1); continue; }
      const a = clamp(Math.min(age / 0.35, (c.ttl - age) / 0.6)), grow = ease(clamp(age / 0.5)), layer = c.kind === "layer", col = layer ? "#8fd0ff" : "#ffb070";
      const TW = layer ? 340 : 410, tl = wrap(c.title, TW, 21); c.lines = c.lines || wrap(c.text, TW, 16);
      const H = tl.length * 27 + c.lines.length * 22 + 4, [tx, ty, bh] = targetPos(c);
      const x = layer ? vis.x1 - 96 - TW : vis.x0 + 28, al = layer ? "right" : "left";
      const y0 = layer ? clamp(ty - H / 2, vis.y0 + 90, vis.y1 - H - 40) : vis.y1 - 34 - H;
      g.font = `800 21px ${FONT}`; const tw0 = Math.max(...tl.map(l => g.measureText(l).width)), ex = layer ? x + TW + 10 : x + tw0 + 12, ey = y0 + 14;
      g.save(); g.globalAlpha = a;
      if (bh) { g.strokeStyle = col; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(tx + 10, ty - bh / 2 * grow); g.lineTo(tx + 10, ty + bh / 2 * grow); g.stroke(); }   // bracket along the layer's band
      const lx = ex + (tx - ex) * grow, ly = ey + (ty - ey) * grow;
      g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = "rgba(10,6,40,.9)"; g.shadowBlur = 6;
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(lx, ly); g.stroke(); g.shadowBlur = 0;
      if (grow > 0.95) { const p = (T * 1.2) % 1; g.beginPath(); g.arc(tx, ty, 5, 0, 7); g.fillStyle = col; g.fill(); g.beginPath(); g.arc(tx, ty, 5 + 14 * p, 0, 7); g.globalAlpha = a * (1 - p); g.stroke(); g.globalAlpha = a; }
      // soft dark glow behind the text (no box), so it stays readable on bright sky and clouds
      const bw = TW + 60, bcx = layer ? x + TW - bw / 2 + 40 : x + bw / 2 - 30, bcy = y0 + H / 2 - 4;
      g.save(); g.translate(bcx, bcy); g.scale(bw / (H + 40), 1); const q = g.createRadialGradient(0, 0, 0, 0, 0, (H + 40) / 2); q.addColorStop(0, "rgba(8,4,34,.62)"); q.addColorStop(0.7, "rgba(8,4,34,.4)"); q.addColorStop(1, "rgba(8,4,34,0)");
      g.globalAlpha = a * grow; g.fillStyle = q; g.fillRect(-(H + 40) / 2, -(H + 40) / 2, H + 40, H + 40); g.restore(); g.globalAlpha = a;
      // typewriter reveal + slide-in
      let left = Math.max(0, (age - 0.2) * 75), y = y0 + 20; const slide = (1 - grow) * (layer ? 40 : -40);
      const type = (ln, size, col, wt, dy) => {
        if (left <= 0) { y += dy; return; }
        const part = ln.slice(0, Math.ceil(left)); left -= ln.length;
        g.font = `${wt} ${size}px ${FONT}`; const fw = g.measureText(ln).width;
        ink(part, (layer ? x + TW - fw : x) + slide, y, size, col, "left", wt); y += dy;
      };
      for (const ln of tl) type(ln, 21, "#fff", 800, 27);
      y -= 1; for (const ln of c.lines) type(ln, 16, "#f1f3ff", 700, 22);
      g.restore();
    }
  }

  // ---------- kare çizimi ----------
  function draw() {
    const t = G.time;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = "#120a3a"; g.fillRect(0, 0, W, H);
    CEL = G.scene === "pad" && G.mission.phase === "done" ? (G.mission.success ? "win" : "lose") : "";
    if (CEL) {
      g.setTransform(DPR * view.s, 0, 0, DPR * view.s, DPR * view.ox, DPR * view.oy);
      g.save(); g.beginPath(); g.rect(0, 0, 1280, 720); g.clip(); drawControl(t, () => drawPad({ x0: 0, y0: 0, x1: 1280, y1: 720 }, t, true));
      if (CEL === "lose") { g.fillStyle = "rgba(18,26,72,.38)"; g.fillRect(0, 0, 1280, 720); }
      else for (let i = 0; i < 60; i++) { const sp = 0.35 + (i * 37 % 10) / 14, y = ((t * sp * 160 + i * 97) % 820) - 60, x = (i * 211 % 1280) + Math.sin(t * 2 + i) * 24; g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillStyle = ["#ff7a3d", "#5be3b0", "#ffd23f", "#7fb2ff", "#ff6fae"][i % 5]; g.fillRect(-5, -3, 10, 6); g.restore(); }
      g.restore();
    } else if (G.scene === "pad") {
      g.setTransform(DPR * view.s, 0, 0, DPR * view.s, DPR * view.ox, DPR * view.oy);
      drawPad(visRect(), t, false); drawCallouts(visRect());
    } else {
      const e = ease(G.zoom), Z = 1 + (ZMAX - 1) * e, tx = -HOLE.x * ZMAX * e, ty = -HOLE.y * ZMAX * e, sc = view.s * Z;
      for (let i = 0; i < 3; i++) {
        const off = i * 1280 - G.camX;
        if (off > 1400 || off < -1400) continue;
        g.setTransform(DPR * sc, 0, 0, DPR * sc, DPR * (view.ox + view.s * (tx + off * Z)), DPR * (view.oy + view.s * ty));
        g.save(); g.beginPath(); g.rect(i === 0 ? -3000 : 0, -3000, i === 0 ? 4280 : 4280, 6000); g.clip();
        if (i === 0) drawHangar(t); else if (i === 1) drawControl(t, () => drawPad({ x0: 0, y0: 0, x1: 1280, y1: 720 }, t, true)); else drawLab(t);
        g.restore();
        R(-8, -1500, 16, 3000, "#150c44");
      }
    }
    // kenar karartma
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const q = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8); q.addColorStop(0, "rgba(8,3,30,0)"); q.addColorStop(1, "rgba(8,3,30,.5)");
    g.fillStyle = q; g.fillRect(0, 0, W, H);
  }

  const inR = (r, x, y) => r && x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
  function hit(px, py) {
    const [x, y] = toLogical(px, py);
    if (G.scene === "pad") { if (G.mission.phase === "arrival") { for (const q of hits.land) if (inR(q.r, x, y)) return { type: "part", id: q.id }; return null; } return G.mission.phase === "ready" && inR(hits.rocket, x, y) ? { type: "rocket" } : null; }
    if (G.scene !== "base" || Math.abs(G.camX - G.room * 1280) > 30) return null;
    if (G.room === 1) return inR([HOLE.x, HOLE.y, HOLE.w, HOLE.h], x, y) ? { type: "screen" } : null;
    const hl = G.room === 2 ? hits.lab : hits.hangar;
    for (let i = hl.length - 1; i >= 0; i--) if (inR(hl[i].r, x, y)) return { type: "part", id: hl[i].id };
    return null;
  }

  return { load, init, draw, hit, say, clearCalls, setHover, ANCH };
})();
