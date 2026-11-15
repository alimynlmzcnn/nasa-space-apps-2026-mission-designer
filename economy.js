"use strict";
// Space economy and competition: budget, contracts, research, rival agencies and a 12-round season.
const Econ = (() => {
  const W = window.WORLD, KEY = "smd-save-v2", SEASON = W.season;
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let S;

  function fresh() {
    return { seed: (Math.random() * 1e9) | 0, round: 1, budget: SEASON.startBudget, pts: 0, owned: {}, contract: null, outpost: SEASON.outpostStart,
      claims: {}, series: null, rivals: W.rivals.map(r => ({ id: r.id, pts: 0, money: SEASON.startBudget, wins: 0 })), news: ["The season begins. Be the first to reach each world."], history: [], over: false };
  }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.rivals && s.round) return s; } catch (e) {} return fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  S = load();
  const val = (m, p) => Math.round(m + p * 6);                       // agency valuation shown on the exchange: cash + points
  function snap() {                                                  // remember each agency's valuation (one point per round)
    if (!S.series) S.series = {};
    const row = { you: val(S.budget, S.pts) }; S.rivals.forEach(r => row[r.id] = val(r.money, r.pts));
    for (const k in row) { if (!S.series[k]) S.series[k] = [val(SEASON.startBudget, 0)]; S.series[k].push(row[k]); }
  }
  if (!S.series) { S.series = {}; const row = { you: val(S.budget, S.pts) }; S.rivals.forEach(r => row[r.id] = val(r.money, r.pts)); for (const k in row) S.series[k] = [val(SEASON.startBudget, 0), row[k]]; }

  const supplies = (craft, dest) => Math.ceil(W.craft[craft].crew * W.dest[dest].days * 0.006 * 10) / 10;

  // Contract offers for the current round (deterministic for a given season and round).
  function contracts() {
    const r = rng(S.seed + S.round * 7919), out = [];
    const tiers = [[["leo", "orion"], ["moon", "orion"], ["moon", "lander"], ["leo", "probe"]], [["mars", "probe"], ["venus", "probe"], ["mars", "lander"], ["moon", "probe"]], [["mars", "orion"], ["jupiter", "probe"], ["venus", "probe"]]];
    tiers.forEach((tier, i) => {
      const [dest, craft] = tier[(r() * tier.length) | 0], d = W.dest[dest];
      let reward = Math.round(d.reward * (0.85 + 0.45 * r()) / 10) * 10 + (craft === "orion" ? 150 : 0);
      const minCargo = craft === "orion" ? supplies(craft, dest) : craft === "lander" ? 2 + ((r() * 4) | 0) : 0;
      out.push({ id: `${S.round}-${i}`, veh: "sls", dest, craft, minCargo, reward });
    });
    const urgent = S.outpost < 25;
    out.push({ id: `${S.round}-s`, veh: "shuttle", dest: "outpost", craft: "supplies", minCargo: urgent ? 10 : 6, reward: urgent ? 450 : 250, urgent });
    return out;
  }
  function accept(id) { const c = contracts().find(x => x.id === id); if (c) { S.contract = c; save(); } return c; }
  function cancel() { S.contract = null; save(); }

  function buy(id) { const u = W.upgrades.find(x => x.id === id); if (!u || S.owned[id] || S.budget < u.cost) return false; S.budget -= u.cost; S.owned[id] = true; save(); return true; }
  const has = id => !!S.owned[id];

  const standings = () => [{ id: "you", name: "You", pts: S.pts, money: Math.round(S.budget), color: "#5be3b0" }]
    .concat(S.rivals.map(r => ({ id: r.id, name: W.rivals.find(x => x.id === r.id).name, pts: Math.round(r.pts), money: Math.round(r.money), color: W.rivals.find(x => x.id === r.id).color })))
    .sort((a, b) => b.pts - a.pts || b.money - a.money);
  const rank = () => standings().findIndex(x => x.id === "you") + 1;
  const claimName = id => id === "you" ? "You" : id ? W.rivals.find(x => x.id === id).name : null;

  // Rival agencies take their turn.
  function rivalsAct(news) {
    const r = rng(S.seed * 31 + S.round * 104729);
    S.rivals.forEach((rv, i) => {
      const info = W.rivals[i], un = ["leo"]; if (rv.wins >= 1) un.push("moon"); if (rv.wins >= 3) un.push("mars", "venus"); if (rv.wins >= 5) un.push("jupiter");
      const pick = un.slice(-2)[(r() * Math.min(2, un.length)) | 0], d = W.dest[pick];
      const p = clamp(0.88 - d.hard + (info.skill - 0.65) * 0.6, 0.2, 0.92);
      if (r() < p) {
        const first = !S.claims[pick]; if (first) S.claims[pick] = rv.id;
        rv.wins++; rv.pts += d.pts * (first ? 1.5 : 1); rv.money += d.reward * 0.8 - 150;
        if (first || d.pts >= 250) news.push(first ? `${info.name} reached ${d.short} first!` : `${info.name} completed a ${d.short} mission.`);
      } else { rv.money -= 120; if (r() < 0.6) news.push(`${info.name} lost a rocket on the way to ${d.short}.`); }
    });
  }

  function advance(news) {
    rivalsAct(news);
    S.outpost -= SEASON.outpostDrain;
    if (S.outpost <= 0) { S.budget -= 300; S.pts = Math.max(0, S.pts - 50); S.outpost = 15; news.push("Outpost supply crisis! The crew rationed food and you paid $300M for an emergency delivery (−50 points)."); }
    S.round++; if (S.round > SEASON.rounds) S.over = true;
    snap();
    S.news = news.concat(S.news).slice(0, 10);
  }

  // Called when a mission ends. m.success tells whether the mission fully succeeded.
  function finish(m) {
    const c = m.calc, cfg = m.cfg, d = W.dest[cfg.dest], news = [], sum = { cost: c.cost, reward: 0, bonus: 0, pts: 0, first: false, contractOk: false, contract: S.contract };
    if (m.success) {
      if (S.contract && S.contract.dest === cfg.dest && S.contract.craft === cfg.craft && cfg.payload >= S.contract.minCargo) { sum.reward = S.contract.reward; sum.contractOk = true; S.contract = null; }
      if (cfg.veh === "shuttle") { S.outpost = Math.min(SEASON.outpostMax, S.outpost + cfg.payload * SEASON.daysPerTonne); sum.pts = d.pts; }
      else {
        sum.pts = d.pts * (c.margin < 0.5 ? 1.2 : 1);
        if (!S.claims[cfg.dest]) { S.claims[cfg.dest] = "you"; sum.first = true; sum.pts *= 1.5; sum.bonus = 300; news.push(`You reached ${d.short} first! (+$300M prestige bonus)`); }
      }
    } else if (m.lostCrew) { S.pts = Math.max(0, S.pts - 25); news.push("A crew was lost. Investigators grounded the program (−25 points)."); }
    sum.sat = m.success ? (m.satPts || 0) : 0; sum.pts = Math.round(sum.pts + sum.sat);
    S.budget += sum.reward + sum.bonus - sum.cost; S.pts += sum.pts;
    S.history.push({ round: S.round, dest: cfg.dest, ok: m.success });
    advance(news);
    sum.news = news; sum.rank = rank(); sum.over = S.over; sum.budget = S.budget; sum.pts_total = S.pts; sum.round = Math.min(S.round, SEASON.rounds);
    save(); return sum;
  }
  // Skip a quarter: a small government grant, while rivals keep flying.
  function grant() { const news = []; S.budget += 200; advance(news); save(); return news; }
  function newSeason() { S = fresh(); save(); }
  const canAfford = cost => S.budget >= cost;

  // Upgrade effects used by the physics model
  const mods = () => ({ isp2: has("engines") ? 1.06 : 1, isp1: has("boosters") ? 1.05 : 1, coreDry: has("light") ? -12 : 0, icpsProp: has("eus") ? 18 : 0 });

  return { get S() { return S; }, val, W, contracts, accept, cancel, buy, has, standings, rank, claimName, finish, grant, newSeason, canAfford, mods, supplies, save };
})();
