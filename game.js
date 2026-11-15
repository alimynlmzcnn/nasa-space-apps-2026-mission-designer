"use strict";
// Game state and mission simulation. Drawing lives in scene.js, the interface in ui.js, the economy in economy.js.
const Game = (() => {
  const D = window.DATA, WD = window.WORLD;
  // Launch pad layout (logical 1280x720 coordinates)
  const PAD = { GY: 610, PY: 518, RX: 640, RS: 1.35, RISE: 56 };
  const TR_DUR = 10, AR_DUR = 4.2;   // seconds of real time for the interplanetary cruise and the arrival

  // ---- Rocket equation (Tsiolkovsky): Δv = Isp · g0 · ln(m0 / mf), three-stage simplified SLS Block 1 ----
  // Masses in tonnes and APPROXIMATE (verify against sources).
  const PHYS = { g0: 9.80665, coreProp: 987, srbPropEach: 630, srbDryEach: 90, coreDry: 85, icpsDry: 4, icpsProp: 27, burnCoreInSrbPhase: 150,
    isp1: 300, isp2: 450, isp3: 462, thrustCore: 7.44, thrustSrbEach: 16, losses: 1.5, marginBest: 0.3 };
  const CFG = { veh: "sls", dest: "leo", craft: "orion", core: 100, srb: 100, payload: 14, delay: 0 };
  const LIM = { core: [60, 110, 1], srb: [80, 110, 1], payload: [0, 80, 1], delay: [0, 5500, 5] };
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const G = { cfg: Object.assign({}, CFG), scene: "base", room: 1, camX: 1280, zoom: 0, time: 0, fast: 1, mission: null };
  const handlers = {};
  const on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  const emit = (ev, data) => { (handlers[ev] = handlers[ev] || []).forEach(fn => fn(data)); };

  // Ascent trajectories from a physical gravity turn (see trajectory.js)
  const TRJ = { sls: Traj.build(D.profile, 8, D.tMeco, 760), shuttle: Traj.build(WD.shuttle.profile, 8, WD.shuttle.tm.meco, 760) };
  for (const [ev, tr] of [[D.events, TRJ.sls], [WD.shuttle.events, TRJ.shuttle]]) { const k = ev.find(e => e.id === "karman"); if (k) k.t = Traj.timeAtAlt(tr, 100); ev.sort((a, b) => a.t - b.t); }

  // Satellite fly-bys at orbit insertion. Satellites move along the orbit at ~7.5 km/s, so the launch delay (the launch window) decides who is near.
  function satPass(veh, delay) {
    const tr = TRJ[veh === "shuttle" ? "shuttle" : "sls"], Ti = tr.tEnd, p = Traj.at(tr, Ti), C = 2 * Math.PI * (6371 + p.alt);
    return WD.sats.map(s => {
      const pos = s.s0 + WD.satW * (Ti + delay); let d = (((pos - p.down) % C) + C) % C; if (d > C / 2) d -= C;
      const dz = p.alt + s.dalt - p.alt, dist = Math.hypot(d, dz), pts = dist <= 300 ? Math.max(10, Math.round(s.pts * (1 - dist / 300))) : 0;
      return { id: s.id, name: s.name, delta: d, dz: s.dalt, dist, pts };
    });
  }
  function satWindows(veh) {
    const tr = TRJ[veh === "shuttle" ? "shuttle" : "sls"], Ti = tr.tEnd, p = Traj.at(tr, Ti), C = 2 * Math.PI * (6371 + p.alt), period = C / WD.satW;
    return WD.sats.map(s => { let d = ((p.down - s.s0) / WD.satW - Ti) % period; if (d < 0) d += period; return { id: s.id, name: s.name, delay: Math.round(d / 5) * 5 }; }).sort((a, b) => a.delay - b.delay);
  }

  function calc(c) {
    const P = PHYS;
    if (c.veh === "shuttle") {
      const cap = WD.shuttle.capacity, cargo = clampN(c.payload, WD.shuttle.minCargo, cap), ok = c.payload <= cap;
      return { veh: "shuttle", ok, suppOk: true, kind: ok ? "ok" : "low", cargo, cap, cost: WD.shuttle.cost, need: 0, gross: 0, margin: cap - c.payload, dv1: 0, dv2: 0, dv3: 0, M: 2030, tw: 1.5,
        score: Math.round(300 + cargo * 10), core: 0, srb: 0, pay: cargo, suppliesNeed: 0 };
    }
    const mods = Econ.mods(), cr = WD.craft[c.craft], d = WD.dest[c.dest];
    const core = P.coreProp * c.core / 100, srb = 2 * P.srbPropEach * c.srb / 100, pay = cr.mass + c.payload;
    const coreDry = P.coreDry + mods.coreDry, icpsProp = P.icpsProp + mods.icpsProp, icpsDry = P.icpsDry + (mods.icpsProp ? 2 : 0), upper = icpsDry + icpsProp;
    const M = coreDry + core + upper + pay + 2 * P.srbDryEach + srb;
    const burn1 = srb + P.burnCoreInSrbPhase, m1f = M - burn1;
    const dv1 = P.isp1 * mods.isp1 * P.g0 * Math.log(M / m1f) / 1000;
    const coreRem = Math.max(1, core - P.burnCoreInSrbPhase), m2 = m1f - 2 * P.srbDryEach, m2f = m2 - coreRem;
    const dv2 = P.isp2 * mods.isp2 * P.g0 * Math.log(m2 / m2f) / 1000;
    const dv3 = d.transfer ? P.isp3 * P.g0 * Math.log((upper + pay) / (icpsDry + pay)) / 1000 : 0;
    const gross = dv1 + dv2 + dv3, margin = gross - d.need;
    const thrust = P.thrustCore + 2 * P.thrustSrbEach * c.srb / 100, tw = thrust * 1e6 / (M * 1000 * P.g0);
    const suppliesNeed = Econ.supplies(c.craft, c.dest), suppOk = cr.crew === 0 || c.payload >= suppliesNeed;
    const ok = margin >= 0, kind = !ok ? (margin >= -1.3 ? "sub" : "low") : (!suppOk ? "supplies" : "ok");
    const cost = Math.round(120 + 0.12 * (core + srb) + cr.cost);
    const score = ok ? Math.round(400 + Math.min(300, c.payload * 3.3) + Math.max(0, 200 - Math.max(0, margin - P.marginBest) * 120)) : Math.round(100 * Math.max(0, gross) / d.need);
    return { veh: "sls", M, dv1, dv2, dv3, gross, margin, need: d.need, thrust, tw, ok, suppOk, kind, cost, score, core, srb, pay, m1f, m2, m2f, suppliesNeed };
  }

  function newMission() {
    const sh = G.cfg.veh === "shuttle";
    return { phase: "ready", cfg: Object.assign({}, G.cfg), calc: null, log: [], vf: 1, T: -5, alt: 0, vel: 0, srb: true, las: true, core: true, debris: [], puffs: [], shake: 0, layer: 0,
      fired: {}, close: 0, doneT: 0, lasFly: -1, puffT: 0, real: 0, veh: G.cfg.veh, success: false, lostCrew: false, tr: 0, ar: 0, day: 0, lostT: 0, traj: TRJ[sh ? "shuttle" : "sls"], elev: 90, phi: 0, down: 0, sats: null, satPts: 0,
      prof: sh ? WD.shuttle.profile : D.profile, ev: sh ? WD.shuttle.events : D.events,
      tm: sh ? WD.shuttle.tm : { ign: D.tIgnition, meco: D.tMeco, orbit: D.tOrbit } };
  }
  G.mission = newMission();

  function profileAt(m, T) {
    const p = m.prof;
    if (T <= p[0][0]) return [p[0][1], p[0][2]];
    for (let i = 1; i < p.length; i++) if (T <= p[i][0]) { const a = p[i - 1], b = p[i], k = (T - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    const l = p[p.length - 1]; return [l[1], l[2]];
  }
  function timeScale(T) { if (T < 0) return 1; return (T < 20 ? 4 : T < 240 ? 8 : T < 470 ? 16 : T < 495 ? 8 : 4) * G.fast; }
  const altToPx = alt => alt <= 15 ? alt * 70 : 1050 + (alt - 15) * 40;
  function rocketPos(m) {
    const hpx = altToPx(m.alt), k = Math.max(0, Math.min(1, (m.alt - 0.8) / 7));
    const rise = Math.min(hpx, PAD.RISE) - 110 * k * k * (3 - 2 * k);
    return { x: PAD.RX, y: PAD.PY - rise, camY: hpx - rise };
  }
  function spawnDebris(m, o) { m.debris.push(Object.assign({ rot: 0, life: 4, age: 0 }, o)); }

  function fire(m, e) {
    const rp = rocketPos(m), sh = m.veh === "shuttle", ph = m.phi || 0, sn = Math.sin(ph), cs = Math.cos(ph);
    // the vehicle is tilted about a pivot 160 px above its base, so the base moves: debris start from there, and fly away relative to the tilted axis
    const bx = rp.x - 160 * sn, by = rp.y - 160 + 160 * cs, back = [-60 * sn, 60 * cs];
    if (e.id === "srbsep") {
      m.srb = false; const dx = sh ? 46 : 0;
      spawnDebris(m, { kind: "srb_l", x: bx - dx * cs, y: by - dx * sn, phi: ph, rot: ph, vx: -70 * cs + back[0], vy: -70 * sn + back[1], vr: -0.5 });
      spawnDebris(m, { kind: "srb_r", x: bx + dx * cs, y: by + dx * sn, phi: ph, rot: ph, vx: 70 * cs + back[0], vy: 70 * sn + back[1], vr: 0.5 });
    } else if (e.id === "las") { m.las = false; m.lasFly = 0; spawnDebris(m, { kind: "las_small", x: bx, y: by, phi: ph, rot: ph, vx: 60 * cs - 90 * sn, vy: 60 * sn - 90 * cs, vr: 1.4, life: 2.5 }); }
    else if (e.id === "coresep" || e.id === "etsep") { m.core = false; spawnDebris(m, { kind: "core", x: bx, y: by, phi: ph, rot: ph, vx: back[0] * 0.5, vy: back[1] * 0.5, vr: -0.04, life: 9 }); }
    else if (e.id === "liftoff") m.shake = 1; else if (e.id === "maxq") m.shake = 0.6;
  }
  function finish(m, success) { if (m.fired.done) return; m.fired.done = 1; m.success = success; m.phase = "done"; emit("done", m); }
  function card(m, id, title, text, label) { m.log.push({ t: null, label, title }); emit("event", { id, title, text }); }

  function stepDeep(dt) {
    const m = G.mission, d = WD.dest[m.cfg.dest];
    if (m.phase === "transfer") {
      if (m.xf < 1) m.xf = Math.min(1, m.xf + dt / 1.8); m.tr += dt * G.fast / (m.trDur || TR_DUR) * (m.xf < 1 ? 0 : 1); m.day = Math.min(d.days, m.tr * d.days);
      if (!m.calc.suppOk && m.tr >= 0.62) { m.phase = "lost"; m.lostT = 0; m.lostCrew = true; card(m, "lost", "Supplies exhausted", `On day ${Math.round(m.day)} the crew ran out of food and water. This trip needs about ${m.calc.suppliesNeed} t of crew supplies; you packed ${m.cfg.payload} t.`, "Day " + Math.round(m.day)); return; }
      if (m.tr >= 1) { m.phase = "arrival"; m.ar = 0; m.day = d.days; m.land = (m.cfg.craft === "lander" && (m.cfg.dest === "moon" || m.cfg.dest === "mars")) || (m.cfg.craft === "probe" && m.cfg.dest === "venus"); m.arDur = m.land ? 16 : 7; card(m, "arrive", "Arrival at " + d.name, d.fact, "Day " + d.days); }
    } else if (m.phase === "arrival") {
      m.ar += dt * G.fast; const dur = m.arDur || AR_DUR;
      if (m.land && !m.fired.landc && m.ar > dur * 0.52) { m.fired.landc = 1; const k = m.cfg.dest; card(m, "land", k === "venus" ? "Descent into the clouds" : "Powered descent", k === "moon" ? "The Moon has no air, so there is no parachute: the lander must slow down with its engine alone and touch down gently." : k === "mars" ? "Mars has only about 1% of Earth's air. A parachute helps, but the lander still needs its engines to land softly." : "The probe falls through thick acid clouds under a parachute. It will survive only about an hour in the 465 °C heat.", "Landing"); }
      if (m.ar >= dur) { m.ar = dur; if (!m.hold) { m.hold = true; emit("hold"); } }      // wait here: the player reads the hover notes, then asks for the report
    }
    else if (m.phase === "lost") { m.lostT += dt; if (m.lostT > 3.4) finish(m, false); }
  }

  function stepMission(dt) {
    const m = G.mission;
    if (m.phase === "ready" || m.phase === "done") return;
    m.real += dt;
    if (m.phase === "transfer" || m.phase === "arrival" || m.phase === "lost") { stepDeep(dt); return; }
    m.T += dt * timeScale(m.T);
    for (const e of m.ev) if (!m.fired[e.id] && m.T >= e.t) { m.fired[e.id] = 1; m.log.push({ t: e.t, title: e.title }); fire(m, e); emit("event", e); }
    if (m.phase === "count" && m.T >= 0) m.phase = "flight";
    const pv = Traj.at(m.traj, Math.max(0, m.T));
    m.alt = pv.alt; m.vel = pv.vel * (1 - (1 - m.vf) * Math.max(0, Math.min(1, m.T / 483))); m.elev = pv.elev; m.phi = 0; m.down = 0;   // the rocket flies straight up on screen (no gravity-turn tilt)
    if (!m.fired.sat && m.T >= m.tm.meco) { m.fired.sat = 1; if (m.calc.ok) { m.sats = satPass(m.veh, m.cfg.delay); m.satPts = m.sats.reduce((a, s) => a + s.pts, 0); const hit = m.sats.filter(s => s.pts); const near = m.sats.slice().sort((a, b) => a.dist - b.dist)[0];
      m.log.push({ t: m.T, title: hit.length ? "Satellite fly-by: +" + m.satPts + " points" : "No satellite nearby" });
      emit("event", { id: "sat", title: hit.length ? `Satellite fly-by: +${m.satPts} points` : "No satellite nearby", text: hit.length ? hit.map(s => `${s.name}: ${Math.round(s.dist)} km away (+${s.pts})`).join(". ") + ". (Real operators keep spacecraft many kilometres apart to avoid collisions: here the bonus rewards a planned, safe pass of a cooperating satellite.)" : `The closest satellite (${near.name}) is ${Math.round(near.dist)} km away. A different launch window would change who you meet in orbit.` }); } }
    let idx = D.layers.findIndex(l => m.alt < l.to); if (idx < 0) idx = D.layers.length - 1;
    if (idx > m.layer) { m.layer = idx; emit("layer", D.layers[idx]); }
    if (m.phase === "flight" && m.T >= m.tm.orbit) {
      const d = WD.dest[m.cfg.dest], c = m.calc;
      m.phase = "orbit"; m.doneT = 0;                    // every mission first sits in its parking orbit (slow zoom-in, satellites fly by)
      if (!c.ok && m.veh === "sls" && d.transfer) card(m, "tlifail", "Not enough speed to leave Earth orbit", `The rocket reached Earth orbit, but it can only deliver about ${(c.gross || 0).toFixed(1)} km/s of delta-v and ${d.name} needs ${d.need.toFixed(1)} km/s. The ${WD.craft[m.cfg.craft].name.toLowerCase()} stays in Earth orbit: add propellant, carry less cargo or pick a nearer target.`, "T+" + Math.floor(m.T / 60) + ":" + String(Math.floor(m.T % 60)).padStart(2, "0"));
    }
    if (m.phase === "orbit") {
      m.close = Math.min(1, m.close + dt / 2.4); m.doneT += dt;
      const d = WD.dest[m.cfg.dest], go = m.calc.ok && m.veh === "sls" && d.transfer;
      if (go) {
        if (m.doneT > 6.5) {
          m.phase = "transfer"; m.tr = 0; m.xf = 0; m.trDur = m.cfg.dest === "moon" ? 13 : 22;
          card(m, "tli", "Departure burn toward " + d.short, `The upper stage fires and sends your ${WD.craft[m.cfg.craft].name.toLowerCase()} toward ${d.name} (${d.dist}). Radio signals will take ${d.delay} one way.`, "T+" + Math.floor(m.T / 60) + ":" + String(Math.floor(m.T % 60)).padStart(2, "0"));
        }
      } else if (m.doneT > (m.veh === "shuttle" ? 6.2 : (m.veh === "sls" && d.transfer ? 8 : 5.5))) finish(m, m.calc.ok && m.calc.suppOk);
    }
    if (m.lasFly >= 0) m.lasFly += dt;
    m.shake = Math.max(0, m.shake - dt * 0.45);

    const rp = rocketPos(m); m.puffT -= dt;
    const burning = m.T >= m.tm.ign && m.T < m.tm.meco;
    if (burning && m.puffT <= 0 && m.alt < 32) {
      m.puffT = 0.045; const onPad = m.alt < 0.25, side = Math.random() < 0.5 ? -1 : 1;
      if (onPad) m.puffs.push({ x: rp.x + side * (10 + Math.random() * 30), wy: PAD.PY + 62 + Math.random() * 20, vx: side * (70 + Math.random() * 190) * (m.T < 0 ? 0.55 : 1), vy: -8 - Math.random() * 30, s: 0.35 + Math.random() * 0.3, gs: 0.55, life: 2.6, age: 0, k: 1 + (Math.random() * 3 | 0) });
      else m.puffs.push({ x: rp.x + (Math.random() - 0.5) * 26, wy: rp.y - rp.camY + 70 + Math.random() * 30, vx: (Math.random() - 0.5) * 30, vy: 20, s: 0.28 + Math.random() * 0.2, gs: 0.5, life: 1.5, age: 0, k: 1 + (Math.random() * 3 | 0) });
    }
  }

  function update(dt) {
    G.time += dt;
    G.camX += (G.room * 1280 - G.camX) * (1 - Math.exp(-dt * 5));
    if (G.scene === "zoomin") { G.zoom = Math.min(1, G.zoom + dt / 1.15); if (G.zoom >= 1) { G.scene = "pad"; emit("scene", G.scene); } }
    else if (G.scene === "zoomout") { G.zoom = Math.max(0, G.zoom - dt / 0.9); if (G.zoom <= 0) { G.scene = "base"; emit("scene", G.scene); } }
    stepMission(dt);
    const m = G.mission;
    // Debris physics in the vehicle's frame: while the engines burn, the vehicle accelerates away so debris seems to drop BACK along the rocket's axis;
    // after engine cutoff everything is in free fall together, so debris just drifts at constant speed. Real "falling" only happens in thick air.
    const burning = m.T >= 0 && m.T < m.tm.meco, ph = m.phi || 0, bx = -Math.sin(ph), by = Math.cos(ph), gA = 150 * Math.max(0, 1 - m.alt / 30);
    for (const d of m.debris) { d.age += dt; d.x += d.vx * dt; d.y += d.vy * dt; if (burning) { d.vx += bx * 110 * dt; d.vy += by * 110 * dt; } d.vy += gA * dt; d.rot += d.vr * dt; }
    m.debris = m.debris.filter(d => d.age < d.life);
    for (const p of m.puffs) { p.age += dt; p.x += p.vx * dt; p.wy += p.vy * dt; p.vx *= 1 - dt * 0.9; p.s += p.gs * dt; }
    m.puffs = m.puffs.filter(p => p.age < p.life);
  }

  // ---- actions ----
  function fixCfg() {
    const c = G.cfg;
    if (c.veh === "shuttle") { c.dest = "outpost"; c.craft = "supplies"; c.payload = clampN(c.payload, WD.shuttle.minCargo, WD.shuttle.capacity); return; }
    if (c.dest === "outpost" || !WD.dest[c.dest]) c.dest = "leo";
    if (!WD.craft[c.craft] || !WD.craft[c.craft].dests.includes(c.dest)) c.craft = Object.keys(WD.craft).find(k => WD.craft[k].dests.includes(c.dest)) || "orion";
    c.payload = clampN(c.payload, LIM.payload[0], LIM.payload[1]);
  }
  function resetReady() { if (G.mission.phase === "ready") { const puffs = G.mission.puffs; G.mission = newMission(); G.mission.puffs = puffs; } }
  function setCfg(k, v) { const l = LIM[k]; G.cfg[k] = l ? clampN(+v, l[0], l[1]) : +v; fixCfg(); resetReady(); emit("cfg"); }
  // After choosing a destination or spacecraft, pick a cargo mass that actually reaches it (the largest up to 14 t that still works,
  // never less than the crew's supplies). Otherwise a heavy default payload leaves the first Mars/Venus/Jupiter flight stuck in Earth orbit.
  function autoPayload() {
    const c = G.cfg; if (c.veh !== "sls") return;
    let best = -1; for (let p = 14; p >= 0; p--) { const r = calc(Object.assign({}, c, { payload: p })); if (r.ok && r.suppOk) { best = p; break; } }
    c.payload = best >= 0 ? best : Math.ceil(Econ.supplies(c.craft, c.dest));
  }
  function setSel(k, v) { G.cfg[k] = v; if (k === "veh") G.cfg.payload = v === "shuttle" ? 12 : 14; fixCfg(); if (G.cfg.veh === "sls" && (k === "dest" || k === "craft" || k === "veh")) { autoPayload(); fixCfg(); } resetReady(); emit("cfg"); }
  function applyContract(c) {
    G.cfg.veh = c.veh; G.cfg.dest = c.dest; if (c.veh === "sls") G.cfg.craft = c.craft;
    G.cfg.payload = c.veh === "shuttle" ? Math.max(c.minCargo, 8) : c.minCargo; fixCfg(); resetReady(); emit("cfg");
  }
  function setRoom(i) { if (G.scene === "base") { G.room = Math.max(0, Math.min(2, i)); emit("room", G.room); } }
  function goToPad() { if (G.scene === "base" && G.room === 1) { G.scene = "zoomin"; emit("scene", G.scene); } }
  function backToBase() { if (G.scene !== "pad") return; G.mission = newMission(); G.scene = "zoomout"; emit("scene", G.scene); emit("reset"); }
  function begin(m) {
    m.cfg = Object.assign({}, G.cfg); m.calc = calc(m.cfg);
    m.vf = (m.calc.ok || m.veh === "shuttle") ? 1 : Math.max(0.5, Math.min(1, m.calc.gross / Math.max(1, m.calc.need)));
    m.phase = "count"; m.T = -5;
  }
  function launch() {
    const m = G.mission;
    if (G.scene !== "pad" || m.phase !== "ready") return;
    const cost = calc(G.cfg).cost; if (!Econ.canAfford(cost)) { emit("broke", cost); return; }
    begin(m); emit("count");
  }
  function showReport() { const m = G.mission; if (m && m.hold && !m.fired.done) finish(m, true); }
  function relaunch() { if (G.scene === "pad") { G.mission = newMission(); emit("reset"); } }
  // Test helpers
  function jumpTo(T) { const m = G.mission = newMission(); begin(m); m.T = -0.01; emit("reset"); stepMission(0.02); let n = 0; while (m.T < T && m.phase !== "transfer" && n++ < 20000) stepMission(0.05 / timeScale(m.T) * Math.min(8, Math.max(1, (T - m.T)))); }
  function jumpDeep(frac, phase) { if (G.mission.phase !== "transfer") jumpTo(1e9); const m = G.mission; if (m.phase === "transfer") { m.xf = 1; m.tr = frac; m.day = frac * WD.dest[m.cfg.dest].days; if (phase === "arrival") { m.phase = "arrival"; m.ar = frac; m.land = (m.cfg.craft === "lander" && (m.cfg.dest === "moon" || m.cfg.dest === "mars")) || (m.cfg.craft === "probe" && m.cfg.dest === "venus"); m.arDur = m.land ? 16 : 7; m.xf = 1; } } }

  return { G, PAD, D, WD, PHYS, LIM, TR_DUR, AR_DUR, TRJ, satPass, satWindows, calc, setCfg, setSel, applyContract, on, update, setRoom, showReport, goToPad, backToBase, launch, relaunch, jumpTo, jumpDeep, rocketPos, profileAt, timeScale, fixCfg };
})();
