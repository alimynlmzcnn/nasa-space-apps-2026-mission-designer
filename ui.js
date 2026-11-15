"use strict";
// Interface: DOM elements, clicks, sound, the economy panel, the mission report and the main loop.
(() => {
  const { G, D, WD } = Game, $ = id => document.getElementById(id), cv = $("c");
  const show = (id, v, mode = "block") => { $(id).style.display = v ? mode : "none"; };
  let snd = false, ac = null, rumble = null, cardT = 0, bannerT = 0, infoT = 0, econTab = "contracts";
  const f1 = (v, n = 1) => v.toLocaleString("en-US", { minimumFractionDigits: n, maximumFractionDigits: n });
  const money = v => (v < 0 ? "−$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-US") + "M";
  const fmtT = T => { const s = Math.abs(Math.floor(T)); return (T < 0 ? "T−" : "T+") + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const DEEP = ["transfer", "arrival", "lost"];

  // --- sound (WebAudio): countdown beeps and engine rumble ---
  function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return ac; }
  function beep(f, d = 0.12) {
    if (!snd || !audio()) return; const o = ac.createOscillator(), v = ac.createGain();
    o.frequency.value = f; v.gain.setValueAtTime(0.12, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
    o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  }
  function setRumble(level) {
    if (!snd || !audio()) { if (rumble) rumble.gain.gain.value = 0; return; }
    if (!rumble) {
      const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < n; i++) { last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03; ch[i] = last * 3; }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
      const gain = ac.createGain(); gain.gain.value = 0; src.connect(lp).connect(gain).connect(ac.destination); src.start(); rumble = { gain };
    }
    rumble.gain.gain.value = level;
  }
  const sndLabel = () => { $("snd").textContent = snd ? "Sound: on" : "Sound: off"; };
  $("snd").onclick = () => { snd = !snd; if (snd && audio()) ac.resume(); sndLabel(); }; sndLabel();

  // --- budget chip and scene-dependent interface ---
  function budget() { const S = Econ.S; $("bud").textContent = `${money(S.budget)} · Round ${Math.min(S.round, WD.season.rounds)}/${WD.season.rounds} · Rank ${Econ.rank()}`; }

  // ---------- visual mission setup: vehicle -> destination -> spacecraft -> fine tuning ----------
  let wiz = 0, wizKey = "";
  const IMGS = { sls: "rocket_sls_idle", shuttle: "shuttle_idle" }, PH = { leo: "earth", outpost: "earth", moon: "moon", mars: "mars", venus: "venus", jupiter: "jupiter" };
  const CIMG = { orion: ["rocket_sls_stage2", "top"], probe: ["craft_probe", ""], lander: ["craft_lander", ""] };
  const dots = n => `<div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
  const card = (i, key, pic, name, tag, stats, more, extra = "") => `<div class="wc ${extra}" data-k="${key}" style="--i:${i}"><div class="pic">${pic}</div><h3>${name}</h3><div class="tag">${tag}</div>${stats ? `<div class="stats">${stats.map(s => `<span>${s}</span>`).join("")}</div>` : ""}<div class="more">${more}</div></div>`;
  function wizRender() {
    const c = G.cfg, steps = ["Vehicle", "Destination", "Spacecraft"], sh = c.veh === "shuttle";
    let title, sub, body;
    if (wiz === 0) {
      title = "Choose your launch vehicle"; sub = "Every mission starts with the right rocket.";
      body = card(0, "sls", `<img src="assets/${IMGS.sls}.png">`, "SLS Block 1", "Heavy launcher for the Moon and the planets", ["98 m tall", "Crew + cargo"], "NASA's Moon rocket. Choose a destination and a spacecraft, then tune the fuel.", "big")
           + card(1, "shuttle", `<img src="assets/${IMGS.shuttle}.png">`, "Space Shuttle", "Resupply flight: food and spare parts for the crew in orbit", ["Earth orbit", "Cargo bay"], "Keeps the orbital outpost alive. Every tonne of supplies adds days to the crew's clock.", "big");
    } else if (wiz === 1) {
      title = "Choose your destination"; sub = "Farther worlds pay more, but need much more speed (Δv).";
      body = ["leo", "moon", "mars", "venus", "jupiter"].map((k, i) => { const d = WD.dest[k];
        return card(i, k, `<img class="planet" src="assets/nasa/${PH[k]}.png">`, d.short, d.dist, [d.days ? d.days + " days" : "Direct", "$" + d.reward + "M"], d.fact, "") + ""; }).join("");
    } else {
      title = "Choose your spacecraft"; sub = "What rides on top of the rocket?";
      body = Object.keys(WD.craft).map((k, i) => { const cr = WD.craft[k], im = CIMG[k]; return card(i, k, `<img class="${im[1]}" src="assets/${im[0]}.png">`, cr.name, cr.crew ? cr.crew + " astronauts" : "Robotic", ["Mass " + cr.mass + " t", "Cost $" + cr.cost + "M"], !cr.dests.includes(c.dest) && cr.why && cr.why[c.dest] ? cr.why[c.dest] : cr.text, cr.dests.includes(c.dest) ? "" : "off"); }).join("");
    }
    const crumbs = steps.map((s, i) => `<button data-s="${i}" class="${i === wiz ? "on" : i < wiz ? "done" : ""}">${i + 1} · ${s}</button>`).join("");
    $("wiz").innerHTML = `<div class="crumbs">${crumbs}</div><h2>${title}</h2><div class="sub">${sub}</div><div class="cards">${body}</div>`;
  }
  function wizSync() { $("hint").style.visibility = G.scene === "pad" && G.mission.phase === "ready" && wiz < 3 ? "hidden" : ""; show("wiz", G.scene === "pad" && G.mission.phase === "ready" && wiz < 3, "flex"); const key = wiz + G.cfg.veh + G.cfg.dest; if (wiz < 3 && key !== wizKey) { wizKey = key; wizRender(); } if (wiz >= 3) wizKey = ""; }
  $("wiz").onclick = e => {
    const cr = e.target.closest("[data-s]"); if (cr) { wiz = +cr.dataset.s; if (G.cfg.veh === "shuttle" && wiz > 0) wiz = 0; return sync(); }
    const cd = e.target.closest(".wc"); if (!cd) return; const k = cd.dataset.k;
    if (wiz === 0) { Game.setSel("veh", k); wiz = k === "shuttle" ? 3 : 1; }
    else if (wiz === 1) { Game.setSel("dest", k); wiz = 2; }
    else { Game.setSel("craft", k); wiz = 3; }
    beep(660, 0.12); sync();
  };
  // compact summary at the top of the fine-tuning panel (click a chip to change that choice)
  function sumRender() {
    const c = G.cfg, sh = c.veh === "shuttle", cr = WD.craft[c.craft], d = WD.dest[c.dest];
    $("sum").innerHTML = `<div class="chip" data-s="0"><img src="assets/${IMGS[c.veh]}.png"><b>${sh ? "Shuttle" : "SLS"}</b>Vehicle</div>`
      + (sh ? "" : `<div class="chip" data-s="1"><img class="planet" src="assets/nasa/${PH[c.dest]}.png"><b>${d.short}</b>Destination</div><div class="chip" data-s="2"><img src="assets/${CIMG[c.craft][0]}.png" style="${CIMG[c.craft][1] ? "object-fit:cover;object-position:50% 0;height:46px" : ""}"><b>${cr.name.split(" ")[0]}</b>Spacecraft</div>`);
  }
  $("sum").onclick = e => { const b = e.target.closest("[data-s]"); if (b) { wiz = +b.dataset.s; sync(); } };
  for (const id of ["vehs", "dests", "crafts"]) { const el = $(id); el.style.display = "none"; if (el.previousElementSibling && el.previousElementSibling.classList.contains("lab")) el.previousElementSibling.style.display = "none"; }
  $("dinfo").style.display = "none";
  function sync() {
    const pad = G.scene === "pad", base = G.scene === "base", m = G.mission, deep = DEEP.includes(m.phase);
    show("nav", base, "flex"); show("back", pad); show("speed", pad && m.phase !== "ready");
    const win = pad && m.phase === "done"; $("report").classList.toggle("win", !!(win && m.success)); $("report").classList.toggle("lose", !!(win && !m.success)); show("hud", pad && m.phase !== "ready" && !win, "flex"); show("alt", pad && m.phase !== "ready" && !deep && !win); show("karm", pad && m.phase !== "ready" && !deep && !win); show("cfg", pad && m.phase === "ready" && wiz >= 3); wizSync(); if (pad && m.phase === "ready" && wiz >= 3) { cfgSync(); sumRender(); }
    [...$("nav").children].forEach(b => b.classList.toggle("on", +b.dataset.i === G.room));
    const hint = base ? (G.room === 1 ? "Click the big screen to go to the launch pad" : "Move the mouse over any part to learn what it does")
      : pad && m.phase === "ready" ? "Pick a destination, set the fuel, then click the rocket or press Launch" : "";
    $("hint").textContent = hint; show("hint", !!hint);
    $("speed").textContent = "Speed ×" + G.fast; budget();
    if (!pad) { show("report", false); show("count", false); }
  }
  $("nav").onclick = e => { const i = e.target.dataset.i; if (i == null) return; if (+i === 3) openEcon(); else Game.setRoom(+i); };
  $("back").onclick = () => Game.backToBase();
  $("go").onclick = () => { if (snd && audio()) ac.resume(); Game.launch(); };
  $("eco").onclick = () => openEcon();
  for (const [id, k] of [["sc", "core"], ["ss", "srb"], ["sp", "payload"], ["sd", "delay"]]) $(id).oninput = e => Game.setCfg(k, e.target.value);
  $("speed").onclick = () => { G.fast = G.fast === 1 ? 2 : G.fast === 2 ? 4 : 1; sync(); };
  $("vehs").onclick = e => { const b = e.target.closest("button"); if (b && !b.disabled) Game.setSel("veh", b.dataset.v); };
  $("dests").onclick = e => { const b = e.target.closest("button"); if (b && !b.disabled) Game.setSel("dest", b.dataset.v); };
  $("sats").onclick = e => { const b = e.target.closest("button"); if (b && b.dataset.d) Game.setCfg("delay", b.dataset.d); };
  $("crafts").onclick = e => { const b = e.target.closest("button"); if (b && !b.disabled) Game.setSel("craft", b.dataset.v); };

  function act(h) {
    if (!h) return;
    if (h.type === "screen") Game.goToPad();
    else if (h.type === "rocket") { if (snd && audio()) ac.resume(); Game.launch(); }
    else if (h.type === "part") Scene.setHover(h.id);
  }
  cv.addEventListener("click", e => act(Scene.hit(e.clientX, e.clientY)));
  cv.addEventListener("mousemove", e => { const h = Scene.hit(e.clientX, e.clientY); cv.style.cursor = h ? "pointer" : "default"; Scene.setHover(h && h.type === "part" ? h.id : null); });
  cv.addEventListener("mouseleave", () => Scene.setHover(null));
  addEventListener("keydown", e => {
    if (e.target && e.target.tagName === "INPUT") return;
    if ($("econ").style.display === "block") { if (e.key === "Escape") show("econ", false); return; }
    if (e.key === "ArrowLeft") Game.setRoom(G.room - 1); else if (e.key === "ArrowRight") Game.setRoom(G.room + 1);
    else if (e.key === "Escape") Game.backToBase();
    else if (e.key === "Enter" || e.key === " ") { if (G.scene === "pad") Game.launch(); else if (G.scene === "base" && G.room === 1) Game.goToPad(); }
  });

  // --- game events ---
  Game.on("hold", () => show("repbtn", true)); $("repbtn").onclick = () => { show("repbtn", false); Game.showReport(); };
  Game.on("scene", sync); Game.on("room", () => { show("info", false); sync(); });
  Game.on("count", sync); Game.on("cfg", () => { if (G.scene === "pad" && G.mission.phase === "ready" && wiz >= 3) { cfgSync(); sumRender(); } });
  Game.on("reset", () => { show("repbtn", false); wiz = 0; show("report", false); show("card", false); Scene.clearCalls(); show("count", false); $("banner").style.opacity = 0; setRumble(0); sync(); });
  Game.on("broke", cost => { $("hint").textContent = `Not enough budget (${money(cost)} needed). Open the Economy panel: take a contract or a grant.`; show("hint", true); });
  function evTarget(e) {
    const m = G.mission, id = e.id || "";
    if (DEEP.includes(m.phase)) return /arriv|land|orbit|flyby|capture/.test(id) ? "planet" : "craft";
    if (/ignition|liftoff/.test(id)) return "base";
    if (/maxq|las|karman/.test(id)) return "nose";
    if (/srbsep/.test(id)) return "srb";
    if (/meco|coresep|etsep/.test(id)) return "core";
    return m.phase === "orbit" ? "craft" : "mid";
  }
  Game.on("event", e => { Scene.say("event", e.title, e.alts ? pickFact(e, [e.text].concat(e.alts), e.id) : e.text, evTarget(e), 9); if (e.id === "liftoff") beep(880, 0.5); sync(); });
  function pickFact(l, pool, key) {          // a different note each flight: never the same one twice in a row
    let st = {}; try { st = JSON.parse(localStorage.getItem("smd-facts")) || {}; } catch (e) {}
    let i = Math.floor(Math.random() * pool.length); if (pool.length > 1 && i === st[key]) i = (i + 1) % pool.length; st[key] = i;
    try { localStorage.setItem("smd-facts", JSON.stringify(st)); } catch (e) {} return pool[i];
  }
  Game.on("layer", l => Scene.say("layer", l.name + " · " + l.from + "–" + l.to + " km", pickFact(l, l.facts || [l.fact], l.id), "gauge:" + Math.max(0, D.layers.findIndex(q => q.id === l.id)), 7));
  Game.on("done", m => { show("repbtn", false); m.sum = Econ.finish(m); show("card", false); $("rep").innerHTML = buildReport(m, false); show("report", true); sync(); bindReport(m); budget(); });

  // --- launch configuration panel ---
  const segBtn = (v, on, label, extra = "", dis = false, title = "") => `<button data-v="${v}" class="${on ? "on" : ""}" ${dis ? "disabled" : ""} title="${title}">${extra}${label}</button>`;
  function contractLine(c) {
    const k = Econ.S.contract; if (!k) return "No contract: this flight earns no payment.";
    const label = k.veh === "shuttle" ? "Outpost resupply" : `${WD.dest[k.dest].short} · ${WD.craft[k.craft].name}`;
    const meets = c.veh === k.veh && c.dest === k.dest && (k.veh === "shuttle" || c.craft === k.craft) && c.payload >= k.minCargo;
    return `Contract: <b>${label}</b>, pays <b>${money(k.reward)}</b> (min cargo ${k.minCargo} t) · <span style="color:${meets ? "#5be3b0" : "#ffd23f"}">${meets ? "requirements met" : "requirements not met"}</span>`;
  }
  function cfgSync() {
    const c = G.cfg, sh = c.veh === "shuttle", r = Game.calc(c), d = WD.dest[c.dest], cr = WD.craft[c.craft];
    $("vehs").innerHTML = segBtn("sls", !sh, "SLS rocket", "", false, "Heavy launcher for the Moon and the planets") + segBtn("shuttle", sh, "Space Shuttle · resupply", "", false, "Carries food and supplies to the crew in Earth orbit");
    show("sls-only", !sh); show("sl-core", !sh); show("sl-srb", !sh);
    if (!sh) {
      $("dests").innerHTML = ["leo", "moon", "mars", "venus", "jupiter"].map(k => segBtn(k, c.dest === k, WD.dest[k].short, `<i style="background:${WD.dest[k].color}"></i>`)).join("");
      $("dinfo").innerHTML = `<b>${d.name}</b>: ${d.dist}${d.days ? ` · about ${d.days} days` : ""} · radio delay ${d.delay} · needs Δv ${f1(d.need, 2)} km/s`;
      $("crafts").innerHTML = Object.keys(WD.craft).map(k => segBtn(k, c.craft === k, WD.craft[k].name, "", !WD.craft[k].dests.includes(c.dest), WD.craft[k].text)).join("");
    }
    const pl = sh ? [WD.shuttle.minCargo, WD.shuttle.capacity] : Game.LIM.payload;
    $("sp").min = pl[0]; $("sp").max = pl[1]; $("sc").value = c.core; $("ss").value = c.srb; $("sp").value = c.payload;
    $("cl").textContent = sh ? "Supplies for the outpost crew" : cr.crew ? "Crew supplies & cargo" : "Extra cargo";
    $("vc").textContent = `${c.core}% · ${Math.round(r.core)} t`; $("vs").textContent = `${c.srb}% · ${Math.round(r.srb)} t`; $("vp").textContent = `${c.payload} t`;
    // launch window and satellite fly-bys
    const mmss = s => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");
    $("sd").value = c.delay; $("vd").textContent = "+" + mmss(c.delay);
    const passes = Game.satPass(c.veh, c.delay), wins = Game.satWindows(c.veh);
    $("sats").innerHTML = passes.map(s => `<div class="row"><span>${s.name.split(" ")[0]}: ${s.dist < 9999 ? Math.round(s.dist).toLocaleString("en-US") + " km" : "far"}</span><b style="color:${s.pts ? "#5be3b0" : "var(--dim)"}">${s.pts ? "+" + s.pts + " pts" : "no pass"}</b></div>`).join("")
      + `<div style="margin-top:4px">Best windows: ${wins.map(w => `<button data-d="${w.delay}" title="${w.name}">${w.name.split(" ")[0]} +${mmss(w.delay)}</button>`).join("")}</div>`;
    const v = $("cv"); let verdict = "", col = "#5be3b0";
    if (sh) {
      $("o1").innerHTML = `Cargo <b>${c.payload} t</b> of ${WD.shuttle.capacity} t capacity`; $("dvb").style.width = (c.payload / WD.shuttle.capacity * 100) + "%"; $("dvb").style.background = "#5be3b0"; $("dvn").style.left = "100%";
      $("o2").innerHTML = `Outpost supplies now: <b>${Math.round(Econ.S.outpost)} days</b>`;
      verdict = `Adds about ${Math.round(c.payload * WD.season.daysPerTonne)} days of food, water and oxygen`;
    } else {
      $("o1").innerHTML = `Δv <b>${f1(r.gross, 2)}</b> / needed ${f1(r.need, 2)} km/s`; const mx = 19; $("dvb").style.width = Math.min(100, r.gross / mx * 100) + "%"; $("dvb").style.background = r.ok ? "#5be3b0" : "#ff7a3d"; $("dvn").style.left = (r.need / mx * 100) + "%";
      $("o2").innerHTML = `Liftoff mass <b>${Math.round(r.M).toLocaleString("en-US")} t</b> · Thrust/weight <b>${f1(r.tw, 2)}</b>`;
      if (r.kind === "ok") verdict = `Reaches ${d.short} (Δv margin +${f1(r.margin, 2)} km/s)`;
      else if (r.kind === "supplies") { col = "#ffd23f"; verdict = `Fast enough, but the crew needs at least ${r.suppliesNeed} t of supplies (you packed ${c.payload} t)`; }
      else if (r.kind === "sub") { col = "#ffd23f"; verdict = `Not fast enough: falls back (−${f1(-r.margin, 2)} km/s)`; }
      else { col = "#ff6a5c"; verdict = `Far too slow (−${f1(-r.margin, 2)} km/s)`; }
    }
    v.style.color = col; v.textContent = verdict;
    const afford = Econ.canAfford(r.cost);
    $("o3").innerHTML = `Launch cost <b>${money(r.cost)}</b> · Budget <b style="color:${afford ? "#5be3b0" : "#ff6a5c"}">${money(Econ.S.budget)}</b><br>${contractLine(c)}` + (WD.dest[c.dest || CFG.dest] && WD.dest[c.dest || CFG.dest].orb ? `<div style="margin-top:6px;font-size:11px;opacity:.85"><b>NASA spacecraft there:</b> ${WD.dest[c.dest || CFG.dest].orb.map(o => o.n + (o.st === "active" ? "" : " (" + o.st + ")")).join(" · ")}</div>` : "");
    $("go").disabled = !afford; $("go").textContent = afford ? "Launch" : "Not enough budget";
  }

  // --- economy panel ---
  const offerText = k => k.veh === "shuttle" ? "Space Shuttle resupply flight to the orbital outpost" : `${WD.craft[k.craft].name} to ${WD.dest[k.dest].name}`;
  const AGC = { you: "#5be3b0", aurora: "#ff7ab8", helios: "#ffd23f", vanguard: "#6fb4ff" }, UPIC = { engines: "RS-25", boosters: "SRB", light: "LT", eus: "EUS" };
  const agencyName = id => id === "you" ? "Your agency" : WD.rivals.find(r => r.id === id).name;
  const seriesOf = id => {
    let s = (Econ.S.series && Econ.S.series[id]) || [Econ.val(WD.season.startBudget, 0)]; if (s.length < 2) s = [s[0], s[0]];
    if (s.length === 2 && Econ.S.round > 2) {          // an old save without history: draw a plausible path from the start to today
      const n = Math.min(Econ.S.round, WD.season.rounds + 1), a = s[0], b = s[1], seed = id.length * 7 + id.charCodeAt(0); s = [];
      for (let i = 0; i < n; i++) { const k = i / (n - 1), w = (i === 0 || i === n - 1) ? 0 : Math.sin(i * 2.1 + seed) * (Math.abs(b - a) * 0.06 + 40); s.push(Math.round(a + (b - a) * k * k * (3 - 2 * k) + w)); }
    }
    return s;
  };
  const chg = id => { const s = seriesOf(id), a = s[s.length - 2], b = s[s.length - 1]; return a ? (b - a) / a * 100 : 0; };
  function econHTML() {
    const S = Econ.S, st = Econ.standings(), pct = Math.min(100, S.outpost / WD.season.outpostMax * 100), ids = ["you"].concat(WD.rivals.map(r => r.id));
    const tk = ids.map(id => { const s = seriesOf(id), c = chg(id); return `<span>${agencyName(id).toUpperCase()} <span class="${c >= 0 ? "up" : "dn"}">${money(s[s.length - 1])} ${c >= 0 ? "▲" : "▼"} ${Math.abs(c).toFixed(1)}%</span></span>`; })
      .concat(["PROPELLANT", "LAUNCH INDEX", "ORBIT SLOTS", "SATELLITE DEMAND", "MOON FUTURES", "MARS FUTURES"].map((n, i) => { const c = Math.sin(S.round * 1.7 + i * 2.3) * 3.4; return `<span>${n} <span class="${c >= 0 ? "up" : "dn"}">${c >= 0 ? "▲" : "▼"} ${Math.abs(c).toFixed(1)}%</span></span>`; })).join("");
    $("ecTick").innerHTML = tk + tk;
    let h = `<div class="top"><h1>SPACE EXCHANGE<small>SEASON OF ${WD.season.rounds} ROUNDS · RIVAL AGENCIES FLY EVERY ROUND · MOST POINTS WINS</small></h1>
<div class="kpis"><div class="kpi"><b>${money(S.budget)}</b><span>Budget</span></div><div class="kpi"><b>${Math.min(S.round, WD.season.rounds)} / ${WD.season.rounds}</b><span>Round</span></div><div class="kpi"><b>${S.pts}</b><span>Your points</span></div><div class="kpi"><b>#${Econ.rank()}</b><span>Rank</span></div>
<div class="kpi" style="min-width:170px"><b class="${S.outpost < 25 ? "urgent" : ""}">${Math.round(S.outpost)} days</b><span>Outpost supplies</span><div class="bar"><i style="width:${pct}%;${S.outpost < 25 ? "background:#ff6a5c" : ""}"></i></div></div></div>
<button class="pri" data-t="close">← Back to the game</button></div>`;
    if (S.over) h += `<div class="panel" style="display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:20px">Season over!</b><div class="sub">Winner: ${st[0].name} with ${st[0].pts} points. You finished #${Econ.rank()}.</div></div><button class="pri" data-t="newseason">Start a new season</button></div>`;
    // left column
    h += `<div class="grid"><div><div class="panel"><h2>Agency valuation <span class="legend">${ids.map(id => `<span><i style="background:${AGC[id]}"></i>${agencyName(id)}</span>`).join("")}</span></h2><canvas id="ecBig" height="300"></canvas></div>
<div class="panel"><h2>Contract board <span style="color:var(--dim);font-size:11px;letter-spacing:.04em;text-transform:none">Accept one to set up the launch pad. Contracts pay only if the mission fully succeeds.</span></h2><div class="cards">`;
    Econ.contracts().forEach((k, i) => {
      const act = S.contract && S.contract.id === k.id, pic = k.veh === "shuttle" ? "earth" : PH[k.dest], d = WD.dest[k.dest];
      h += `<div class="ct ${act ? "act" : ""}" style="--i:${i}"><img class="pl" src="assets/nasa/${pic}.png"><div class="nm">${offerText(k)}</div><div class="rw">${money(k.reward)}<small>REWARD</small></div>
<div class="chips"><span>min cargo ${k.minCargo} t</span>${k.veh === "sls" ? `<span>${d.days ? d.days + " days" : "orbit only"}</span>` : "<span>outpost</span>"}${k.urgent ? '<span class="hot">URGENT</span>' : ""}${!S.claims[k.dest] && k.veh !== "shuttle" ? '<span class="hot">FIRST +$300M</span>' : ""}</div>
<button class="${act ? "" : "pri"}" data-a="${act ? "cancel" : "accept"}" data-id="${k.id}">${act ? "Accepted ✓ (cancel)" : "Accept contract"}</button></div>`;
    });
    h += `<div class="ct" style="--i:5"><div class="nm">Government grant</div><div class="rw">+$200M<small>SKIP A ROUND</small></div><div class="chips"><span>rivals keep flying</span><span>outpost supplies drop</span></div><button data-a="grant">Take the grant</button></div></div></div></div>`;
    // right column
    h += `<div><div class="panel"><h2>Watchlist</h2><table><tr><th>Agency</th><th>Value</th><th>Rd</th><th>Trend</th><th>Pts</th></tr>${ids.map(id => { const s = seriesOf(id), c = chg(id), r = id === "you" ? { pts: S.pts } : S.rivals.find(x => x.id === id); return `<tr class="${id === "you" ? "you" : ""}"><td><span style="color:${AGC[id]}">●</span> ${agencyName(id)}</td><td>${money(s[s.length - 1])}</td><td class="${c >= 0 ? "up" : "dn"}">${c >= 0 ? "▲" : "▼"}${Math.abs(c).toFixed(1)}%</td><td><canvas class="spark" data-id="${id}" height="28"></canvas></td><td>${Math.round(r.pts)}</td></tr>`; }).join("")}</table></div>
<div class="panel"><h2>Research lab <span style="color:var(--dim);font-size:11px;letter-spacing:.04em;text-transform:none">permanent upgrades</span></h2>${WD.upgrades.map(u => `<div class="rs ${Econ.has(u.id) ? "own" : ""}"><div class="ic">${UPIC[u.id] || "R&D"}</div><div><b>${u.name}</b><p>${u.text}</p></div><button ${Econ.has(u.id) ? "disabled" : (Econ.canAfford(u.cost) ? 'class="pri"' : "disabled")} data-a="buy" data-id="${u.id}">${Econ.has(u.id) ? "Owned ✓" : "Buy " + money(u.cost)}</button></div>`).join("")}</div>
<div class="panel"><h2>First to reach</h2><div class="claim">${["leo", "moon", "mars", "venus", "jupiter"].map(k => `<div><img src="assets/nasa/${PH[k]}.png"><span>${WD.dest[k].short}: <b>${Econ.claimName(S.claims[k]) || "<span style='color:var(--dim)'>nobody yet</span>"}</b></span></div>`).join("")}</div></div>
<div class="panel"><h2>Market news</h2><ul class="news">${S.news.map(n => `<li>${n}</li>`).join("")}</ul></div></div></div>`;
    return h;
  }
  let econAnim = 0;
  function drawEconCharts() {
    const DPR = window.devicePixelRatio || 1, ids = ["you"].concat(WD.rivals.map(r => r.id)), N = WD.season.rounds;
    document.querySelectorAll("#econ canvas.spark").forEach(c => {
      const s = seriesOf(c.dataset.id), w = c.clientWidth || 90, h = 28; c.width = w * DPR; c.height = h * DPR; c.style.height = h + "px"; const x = c.getContext("2d"); x.scale(DPR, DPR);
      const mn = Math.min(...s), mx = Math.max(...s) || 1, up = s[s.length - 1] >= s[0]; x.strokeStyle = up ? "#5be3b0" : "#ff6a5c"; x.lineWidth = 2; x.lineJoin = "round"; x.beginPath();
      s.forEach((v, i) => { const px = 3 + i / (s.length - 1) * (w - 6), py = h - 4 - (v - mn) / ((mx - mn) || 1) * (h - 8); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
    });
    const cv = $("ecBig"); if (!cv) return;
    const W = cv.clientWidth || 700, H = 300; cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + "px"; const x = cv.getContext("2d"); const all = ids.flatMap(seriesOf);
    let mn = Math.min(...all), mx = Math.max(...all); const pad = (mx - mn) * 0.15 || 100; mn = Math.max(0, mn - pad); mx += pad;
    const L = 56, R = 70, T = 14, B = 26, px = i => L + i / N * (W - L - R), py = v => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
    const t0 = performance.now(); cancelAnimationFrame(econAnim);
    const frame = now => {
      const p = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - p, 3);
      x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, W, H); x.font = "600 11px -apple-system,Segoe UI,Arial,sans-serif";
      for (let i = 0; i <= 4; i++) { const v = mn + (mx - mn) * i / 4, y = py(v); x.strokeStyle = "rgba(160,150,255,.16)"; x.lineWidth = 1; x.beginPath(); x.moveTo(L, y); x.lineTo(W - R, y); x.stroke(); x.fillStyle = "#9a9bd6"; x.textAlign = "right"; x.fillText("$" + Math.round(v), L - 8, y + 4); }
      for (let i = 0; i <= N; i += 2) { x.fillStyle = "#9a9bd6"; x.textAlign = "center"; x.fillText("R" + i, px(i), H - 8); }
      const cur = Math.min(Econ.S.round - 1, N); x.strokeStyle = "rgba(255,122,61,.5)"; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(px(cur), T); x.lineTo(px(cur), H - B); x.stroke(); x.setLineDash([]);
      ids.slice().reverse().forEach(id => {
        const s = seriesOf(id), n = s.length, col = AGC[id], you = id === "you", upto = (n - 1) * e;
        const pts = []; for (let i = 0; i <= Math.floor(upto); i++) pts.push([px(i), py(s[i])]); if (upto % 1 > 0 && Math.floor(upto) + 1 < n) { const i = Math.floor(upto), f = upto - i; pts.push([px(i + f), py(s[i] + (s[i + 1] - s[i]) * f)]); }
        if (pts.length < 2) return;
        if (you) { const gr = x.createLinearGradient(0, T, 0, H - B); gr.addColorStop(0, "rgba(91,227,176,.35)"); gr.addColorStop(1, "rgba(91,227,176,0)"); x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.lineTo(pts[pts.length - 1][0], H - B); x.lineTo(pts[0][0], H - B); x.closePath(); x.fillStyle = gr; x.fill(); }
        x.strokeStyle = col; x.lineWidth = you ? 3.4 : 2; x.lineJoin = "round"; x.shadowColor = col; x.shadowBlur = you ? 10 : 4; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); x.shadowBlur = 0;
        const lp = pts[pts.length - 1]; x.fillStyle = col; x.beginPath(); x.arc(lp[0], lp[1], you ? 5 : 3.4, 0, 7); x.fill();
        if (p >= 1) { x.textAlign = "left"; x.fillStyle = col; x.font = "800 11px -apple-system,Segoe UI,Arial,sans-serif"; x.fillText("$" + s[n - 1], lp[0] + 8, lp[1] + 4); x.font = "600 11px -apple-system,Segoe UI,Arial,sans-serif"; }
      });
      if (p < 1) econAnim = requestAnimationFrame(frame);
    };
    econAnim = requestAnimationFrame(frame);
  }
  function openEcon() { $("ecn").innerHTML = econHTML(); show("econ", true); drawEconCharts(); $("econ").scrollTop = 0; }
  $("econ").onclick = e => {
    if (e.target === $("econ")) return show("econ", false);
    const b = e.target.closest("button"); if (!b) return;
    const t = b.dataset.t, a = b.dataset.a;
    if (t === "close") return show("econ", false);
    if (t === "newseason") { Econ.newSeason(); Game.applyContract({ veh: "sls", dest: "leo", craft: "orion", minCargo: 14 }); wiz = 3; }
    else if (t) econTab = t;
    else if (a === "accept") { const c = Econ.accept(b.dataset.id); if (c) { Game.applyContract(c); wiz = 3; } }
    else if (a === "cancel") Econ.cancel();
    else if (a === "buy") Econ.buy(b.dataset.id);
    else if (a === "grant") Econ.grant();
    $("ecn").innerHTML = econHTML(); drawEconCharts(); budget(); if (G.scene === "pad" && G.mission.phase === "ready") cfgSync();
  };

  // --- mission report ---
  function maxCargo(cfg) { let best = -1; for (let p = Game.LIM.payload[0]; p <= Game.LIM.payload[1]; p++) { const r = Game.calc(Object.assign({}, cfg, { payload: p })); if (r.ok && r.suppOk) best = p; } return best; }
  function buildReport(m, forFile) {
    const c = m.calc, cf = m.cfg, sh = m.veh === "shuttle", d = WD.dest[cf.dest], sum = m.sum || {}, ok = m.success;
    const good = [], bad = [], learn = [];
    const tag = ok ? "MISSION SUCCESS" : m.lostCrew ? "CREW LOST" : (m.veh === "sls" && d.transfer && c.gross >= WD.dest.leo.need) ? "STUCK IN EARTH ORBIT" : "ORBIT NOT REACHED";
    if (sh) {
      good.push(`<b>Resupply delivered:</b> ${cf.payload} t of food, water and oxygen reached the outpost (about ${Math.round(cf.payload * WD.season.daysPerTonne)} more days for the crew).`);
      if (cf.payload < 10) bad.push("<b>Small delivery:</b> the shuttle can carry up to 27.5 t. A bigger delivery means fewer emergency flights later.");
      learn.push("Everything a crew eats, drinks and breathes must be launched from Earth. That is why resupply flights and recycling matter so much in space.");
      learn.push("The Space Shuttle flew 135 missions between 1981 and 2011 and was the first reusable orbital spacecraft.");
    } else if (ok) {
      if (m.satPts) m.sats.filter(s => s.pts).forEach(s => good.push(`<b>Satellite fly-by:</b> passed ${s.name} at ${Math.round(s.dist)} km (+${s.pts} points). ${(WD.sats.find(q => q.id === s.id) || {}).fact || ""}`));
      else if (m.sats) bad.push(`<b>No satellite fly-by:</b> the closest satellite was ${Math.round(Math.min(...m.sats.map(s => s.dist))).toLocaleString("en-US")} km away. Your launch window decides who you meet in orbit.`);
      good.push(`<b>Enough speed:</b> total Δv ${f1(c.gross, 2)} km/s against ${f1(c.need, 1)} km/s required for ${d.name}.`);
      if (cf.payload >= 40) good.push(`<b>Heavy payload:</b> you carried ${cf.payload} t of cargo.`);
      if (c.margin <= 0.7) good.push("<b>Efficient setup:</b> the Δv margin is small, so you did not waste mass on extra propellant.");
      if (c.margin > 0.7) { const mc = maxCargo(cf); bad.push(`<b>Too much margin:</b> Δv margin +${f1(c.margin, 2)} km/s. ${mc > cf.payload ? `With this fuel you could have carried up to ${mc} t of cargo.` : "Extra propellant is dead weight."}`); }
      if (WD.craft[cf.craft].crew) good.push(`<b>Crew supplied:</b> ${cf.payload} t of supplies covered the ${d.days || 0} day trip (about ${c.suppliesNeed} t needed).`);
      learn.push("The rocket equation is <b>logarithmic</b>: doubling the fuel does not double Δv. Extra propellant helps less and less because it has to lift its own weight.");
      learn.push(d.fact);
      if (d.orb) learn.push("<b>NASA spacecraft at " + d.short + ":</b> " + d.orb.map(o => o.n + (o.st === "active" ? "" : " (" + o.st + ")")).join(", ") + ".");
    } else if (m.lostCrew) {
      bad.push(`<b>Supplies exhausted:</b> the crew needed about ${c.suppliesNeed} t of food, water and oxygen for ${d.days} days; you packed ${cf.payload} t.`);
      good.push(`<b>Fast enough:</b> the rocket reached ${d.name} with Δv ${f1(c.gross, 2)} km/s.`);
      learn.push("Crewed missions have a hidden second fuel tank: consumables. About 6 kg per person per day multiplies quickly on long trips.");
    } else {
      bad.push(c.kind === "sub" ? `<b>Not fast enough:</b> you reached ${f1(c.gross, 2)} km/s but needed ${f1(c.need, 1)} km/s. The spacecraft stayed on a suborbital path and fell back into the atmosphere.` : `<b>Far too slow:</b> only ${f1(c.gross, 2)} km/s. The rocket reached space but never came close to ${d.name}.`);
      const mc = maxCargo(cf); bad.push(mc >= 0 ? `With this fuel you could have carried at most <b>${mc} t</b> of cargo (you chose ${cf.payload} t).` : "This destination is out of reach with the current setup. Try a lighter spacecraft or research better engines.");
      good.push(`<b>Good liftoff:</b> thrust-to-weight ${f1(c.tw, 2)}, so the rocket could leave the pad (it must be above 1).`);
      learn.push("Staying in space takes <b>sideways speed</b>, not just height. Without enough speed you fall back, however high you climb.");
    }
    if (!sh) learn.push("Rockets are <b>staged</b>: dropping the empty boosters and core lets the remaining fuel add much more speed.");
    const line = (n, v, col, max) => `<div class="hb"><span>${n}</span><div><i style="width:${Math.min(100, v / max * 100)}%;background:${col}"></i></div><b>${f1(v, 2)} km/s</b></div>`;
    const dv = sh ? "" : `<h2>Δv budget (Tsiolkovsky: Δv = Isp · g0 · ln(m0 / mf))</h2>${line("Stage 1 (boosters + core)", c.dv1, "#ff7a3d", 19)}${line("Stage 2 (core)", c.dv2, "#6fb4ff", 19)}${d.transfer ? line("Upper stage (departure burn)", c.dv3, "#b898e8", 19) : ""}${line("Total achieved", c.gross, ok || m.lostCrew ? "#5be3b0" : "#ffd23f", 19)}${line("Required for " + d.short, c.need, "#8e90c2", 19)}
<div class="sub">Required Δv includes about 1.5 km/s of gravity, drag and steering losses. Values are approximate.</div>`;
    const trip = sh ? "" : `<h2>Destination: ${d.name}</h2><table><tr><td>Distance</td><td>${d.dist}</td></tr><tr><td>Travel time</td><td>${d.days ? "about " + d.days + " days" : "orbit only"}</td></tr><tr><td>Radio delay (one way)</td><td>${d.delay}</td></tr></table>`;
    const rows = (sum.news || []).map(n => `<li>${n}</li>`).join("");
    const rewardNote = sum.contract ? (sum.contractOk ? "Contract fulfilled" : "Contract not fulfilled") : "No contract";
    const net = (sum.reward || 0) + (sum.bonus || 0) - (sum.cost || 0);
    const eco = sum.cost == null ? "" : `<h2>Economy</h2><table><tr><td>Launch cost</td><td>${money(-sum.cost)}</td></tr><tr><td>${rewardNote}</td><td>${money(sum.reward)}</td></tr>${sum.first ? `<tr><td>First to reach ${d.short}: prestige bonus</td><td>${money(sum.bonus)}</td></tr>` : ""}<tr><td><b>Net result</b></td><td><b style="color:${net >= 0 ? "#5be3b0" : "#ff6a5c"}">${money(net)}</b></td></tr>${sum.sat ? `<tr><td>Satellite fly-by bonus</td><td>+${sum.sat} points</td></tr>` : ""}<tr><td>Points earned${sum.first ? " (×1.5 first!)" : ""}</td><td>+${sum.pts}</td></tr><tr><td>Budget now</td><td>${money(sum.budget)}</td></tr><tr><td>Your rank after round ${sum.round}</td><td>#${sum.rank} · ${sum.pts_total} points</td></tr></table>
${rows ? `<h2>Rival news</h2><ul class="news">${rows}</ul>` : ""}${sum.over ? `<div class="sub" style="margin-top:8px"><b>The season is over.</b> Open the Economy panel to see the final standings.</div>` : ""}`;
    const cruise = !sh && d.transfer && m.day;
    return `<h1>Mission Report · ${sh ? "Space Shuttle" : "SLS Block 1 · " + WD.craft[cf.craft].name} <span class="tag ${ok ? "ok" : "bad"}">${tag}</span></h1>
<div class="sub">${new Date().toLocaleString("en-US")} · Space Mission Designer</div>
<div class="kpis"><div class="kpi"><b>${c.score}</b><span>Mission score</span></div><div class="kpi"><b>${cruise ? Math.round(m.day) + " d" : fmtT(m.T)}</b><span>${cruise ? "Cruise time" : "Flight time"}</span></div>
<div class="kpi"><b>${sh ? cf.payload + " t" : f1(c.gross, 1)}</b><span>${sh ? "Delivered" : "Δv achieved (km/s)"}</span></div><div class="kpi"><b>${sh ? "—" : (c.margin >= 0 ? "+" : "") + f1(c.margin, 2)}</b><span>Δv margin (km/s)</span></div></div>
<h2>Your configuration</h2><table><tr><td>Launch vehicle</td><td>${sh ? "Space Shuttle" : "SLS Block 1"}</td></tr>${sh ? "" : `<tr><td>Destination</td><td>${d.name}</td></tr><tr><td>Spacecraft</td><td>${WD.craft[cf.craft].name}</td></tr><tr><td>Core stage fuel</td><td>${cf.core}% · ${Math.round(c.core)} t</td></tr><tr><td>Booster fuel (2 boosters)</td><td>${cf.srb}% · ${Math.round(c.srb)} t</td></tr>`}<tr><td>${sh ? "Supplies" : "Cargo"}</td><td>${cf.payload} t</td></tr><tr><td>Liftoff mass</td><td>${Math.round(c.M).toLocaleString("en-US")} t</td></tr><tr><td>Launch window delay</td><td>+${Math.floor(cf.delay / 60)}:${String(cf.delay % 60).padStart(2, "0")}</td></tr></table>
${trip}${dv}
<h2>Flight timeline</h2><table>${m.log.map(e => `<tr><td>${e.title}</td><td>${e.t == null ? e.label : fmtT(e.t)}</td></tr>`).join("")}</table>
<div class="cols"><div><h2>What went well</h2><ul>${good.map(x => "<li>" + x + "</li>").join("") || "<li>-</li>"}</ul></div><div><h2>What went wrong</h2><ul>${bad.map(x => "<li>" + x + "</li>").join("") || "<li>No major problems.</li>"}</ul></div></div>
<h2>What you learned</h2><ul>${learn.map(x => "<li>" + x + "</li>").join("")}</ul>
${eco}
${forFile ? "" : `<div class="row"><button class="pri" id="again">Plan the next mission</button><button id="home">Back to Mission Control</button><button id="econb">Economy</button><button id="prt">Print / PDF</button><button id="dl">Download report (.html)</button></div>`}`;
  }
  function bindReport(m) {
    $("again").onclick = () => Game.relaunch(); $("home").onclick = () => Game.backToBase(); $("prt").onclick = () => print(); $("econb").onclick = () => openEcon();
    $("dl").onclick = () => {
      const css = "body{font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#111}h1{font-size:22px}h2{font-size:15px;color:#d95f26;margin:16px 0 6px}.sub{color:#555;font-size:12px}.tag{padding:2px 10px;border-radius:99px;font-size:12px;color:#fff;background:" + (m.success ? "#1f8a68" : "#d83024") + "}.kpis{display:flex;gap:10px;flex-wrap:wrap}.kpi{background:#eee;border-radius:8px;padding:8px 12px;text-align:center}.kpi b{display:block;font-size:20px}.kpi span{font-size:11px;color:#555}table{width:100%;border-collapse:collapse;font-size:14px}td{padding:4px 6px;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:700}.hb{display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0}.hb span{width:210px;color:#444}.hb div{flex:1;height:12px;background:#eee;border-radius:6px;overflow:hidden}.hb i{display:block;height:100%}.hb b{width:90px;text-align:right}ul{font-size:14px;line-height:1.5}.cols{display:flex;gap:20px}.cols>div{flex:1}";
      const blob = new Blob([`<!doctype html><html lang="en"><meta charset="utf-8"><title>Mission Report</title><style>${css}</style><body>${buildReport(m, true)}</body></html>`], { type: "text/html" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mission-report.html"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
  }

  const altPct = a => a <= 12 ? a / 12 * 20 : a <= 50 ? 20 + (a - 12) / 38 * 25 : a <= 85 ? 45 + (a - 50) / 35 * 20 : Math.min(100, 65 + (a - 85) / 75 * 35);
  let lastCount = null, lastDeep = null;
  function hud() {
    const m = G.mission;
    if (G.scene !== "pad" || m.phase === "ready") return;
    const deep = DEEP.includes(m.phase);
    if (deep !== lastDeep) { lastDeep = deep; const fin = m.phase === "done"; show("alt", !deep && !fin); show("karm", !deep && !fin); }
    if (deep) {
      const d = WD.dest[m.cfg.dest];
      $("lT").textContent = "Day"; $("hT").textContent = `${Math.round(m.day)} / ${d.days}`; $("lA").textContent = "Destination"; $("hA").textContent = d.short;
      $("lV").textContent = "Radio delay"; $("hV").textContent = d.delay; $("lL").textContent = "Phase"; $("hL").textContent = m.phase === "transfer" ? "Cruise" : m.phase === "arrival" ? "Arrival" : "Crew in trouble";
      show("count", false); setRumble(0); $("banner").style.opacity = 0; return;
    }
    $("lT").textContent = "Time"; $("lA").textContent = "Altitude"; $("lV").textContent = "Speed"; $("lL").textContent = "Layer";
    $("hT").textContent = fmtT(m.T); $("hA").textContent = (m.alt < 10 ? m.alt.toFixed(1) : Math.round(m.alt)) + " km";
    $("hV").textContent = Math.round(m.vel).toLocaleString("en-US") + " km/h"; $("hL").textContent = D.layers[m.layer].name;
    $("altm").style.bottom = altPct(m.alt) + "%";
    const c = m.T < 0 ? String(Math.ceil(-m.T)) : m.T < 6 ? "LIFTOFF!" : "";
    if (c !== lastCount) { lastCount = c; $("count").textContent = c; show("count", !!c); $("count").style.fontSize = c.length > 2 ? "64px" : "120px"; if (c && c.length < 3) beep(440); }
    setRumble(m.T > m.tm.ign && m.T < m.tm.meco ? Math.max(0.05, 0.5 * Math.max(0, 1 - m.alt / 90)) : 0);
  }

  // --- loop ---
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    Game.update(dt); Scene.draw(); hud();
    if (cardT > 0 && (cardT -= dt) <= 0) show("card", false);
    if (bannerT > 0 && (bannerT -= dt) <= 0) $("banner").style.opacity = 0;
    if (infoT > 0 && (infoT -= dt) <= 0) show("info", false);
    requestAnimationFrame(loop);
  }

  // ---- title screen ----
  { const T = $("title"), q0 = new URLSearchParams(location.search), skip = [...q0.keys()].length > 0;
    const go = () => { T.classList.add("out"); setTimeout(() => { T.style.display = "none"; }, 650); if (snd && audio()) ac.resume(); };
    if (skip) T.style.display = "none"; else { $("playBtn").onclick = go; addEventListener("keydown", e => { if (e.key === "Enter" && T.style.display !== "none" && !T.classList.contains("out")) go(); }); } }
  Scene.init(cv);
  Scene.load(() => {
    // Test/demo shortcuts: ?room=0, ?scene=pad, ?veh=shuttle&dest=mars&craft=probe&core=60&payload=10, ?t=140, ?deep=0.5, ?econ=research
    const q = new URLSearchParams(location.search);
    if (q.has("room")) G.room = +q.get("room"), G.camX = G.room * 1280;
    if (q.get("scene") === "pad" || q.has("t") || q.has("deep")) { G.scene = "pad"; G.zoom = 1; }
    for (const k of ["veh", "dest", "craft"]) if (q.has(k)) { Game.setSel(k, q.get(k)); wiz = 3; }
    if (q.has("wiz")) wiz = +q.get("wiz");
    for (const k of ["core", "srb", "payload", "delay"]) if (q.has(k)) Game.setCfg(k, q.get(k));
    if (q.has("zoom")) { G.scene = "zoomin"; G.zoom = +q.get("zoom"); }
    if (q.has("launch")) { wiz = 3; Game.launch(); }
    if (q.has("t")) Game.jumpTo(+q.get("t"));
    if (q.has("deep")) Game.jumpDeep(+q.get("deep"), q.get("phase"));
    if (q.has("adv")) for (let i = 0, n = +q.get("adv") * 60; i < n; i++) Game.update(1 / 60);
    sync(); requestAnimationFrame(loop);
    if (q.has("econ")) openEcon(q.get("econ"));
  });
})();
