"use strict";
// Ascent trajectory computed from physics: a gravity turn.
//
// A rocket lifts off vertically (it has to clear the tower and climb out of the thickest air), then a small pitch-over
// "kick" tips it slightly eastward. After that gravity itself bends the flight path: with the engines pushing exactly
// along the velocity (no angle of attack, so almost no sideways air load at Max-Q) the flight-path angle γ obeys
//
//        dγ/dt = −( g/v − v/(R+h) ) · cos γ         (γ measured above the horizon)
//
// The first term is gravity pulling the path down; the second is the "centrifugal" relief as speed approaches orbital speed.
// We prescribe the speed v(t) from the vehicle's thrust profile and bisect the kick angle so that γ reaches ~0 at engine
// cutoff, i.e. a horizontal, orbital-speed insertion. Altitude, downrange distance and the rocket's tilt all follow.
const Traj = (() => {
  const R = 6371e3, MU = 3.986e14;

  const speedFn = tbl => T => {
    for (let i = 1; i < tbl.length; i++) if (T <= tbl[i][0]) { const a = tbl[i - 1], b = tbl[i], k = (T - a[0]) / (b[0] - a[0]); return (a[2] + (b[2] - a[2]) * k) / 3.6; }
    return tbl[tbl.length - 1][2] / 3.6;
  };

  function integrate(vf, kickDeg, T0, T1, rec) {
    let g = kickDeg * Math.PI / 180, h = 300, x = 0, T = T0; const dt = 0.1;
    while (T < T1) {
      const v = Math.max(vf(T), 30), r = R + h, gr = MU / (r * r);
      g += -(gr / v - v / r) * Math.cos(g) * dt; h += v * Math.sin(g) * dt; x += v * Math.cos(g) * (R / r) * dt; T += dt;
      if (h < 0) return { gamma: -90, h, x };
      if (rec && Math.abs(T - Math.round(T)) < dt / 2) rec.push([Math.round(T), h / 1000, v * 3.6, g * 180 / Math.PI, x / 1000]);
    }
    return { gamma: g * 180 / Math.PI, h, x };
  }

  // Build samples [T, altKm, speedKmh, elevationDeg, downrangeKm] at 1 s steps.
  function build(tbl, T0, Tend, Tmax) {
    const vf = speedFn(tbl);
    let lo = 85, hi = 89.99;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (integrate(vf, mid, T0, Tend).gamma > 0) hi = mid; else lo = mid; }
    const kick = (lo + hi) / 2, rec = [];
    // before the pitch-over: straight up
    for (let T = 0; T < T0; T++) rec.push([T, 0.3 * Math.pow(T / T0, 2), vf(T) * 3.6, 90, 0]);
    const fin = integrate(vf, kick, T0, Tend, rec);
    const last = rec[rec.length - 1];
    // after engine cutoff: coast in a (nearly) circular orbit
    for (let T = Tend + 1; T <= Tmax; T++) { const p = rec[rec.length - 1]; rec.push([T, p[1], p[2], 0, p[4] + (p[2] / 3.6 / 1000) * (R / (R + p[1] * 1000))]); }
    return { kick, samples: rec, tEnd: Tend, final: { alt: last[1], gamma: fin.gamma, down: last[4] } };
  }
  function at(tr, T) {
    const s = tr.samples; if (T <= 0) return { alt: 0, vel: 0, elev: 90, down: 0 };
    const i = Math.min(s.length - 2, Math.floor(T)), a = s[i], b = s[i + 1], k = Math.max(0, Math.min(1, T - i));
    return { alt: a[1] + (b[1] - a[1]) * k, vel: a[2] + (b[2] - a[2]) * k, elev: a[3] + (b[3] - a[3]) * k, down: a[4] + (b[4] - a[4]) * k };
  }
  function timeAtAlt(tr, altKm) { for (const p of tr.samples) if (p[1] >= altKm) return p[0]; return null; }

  return { build, at, timeAtAlt };
})();
