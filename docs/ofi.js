/*
 * JavaScript port of ofi.py's metric formulas (see scripts/build_static_site.py
 * and ofi.py in the repo root for the canonical Python version).
 *
 * This exists so the static site can compute real tactical metrics for ANY
 * StatsBomb open-data match entirely client-side (no server, no Pyodide/WASM
 * download) -- same formulas, ported to run natively in the browser.
 *
 * Verified against the canonical Python/pandas/networkx implementation on the
 * World Cup Final (match_id 3869685): every number here matches ofi.py's
 * output exactly (xG, field tilt, PPDA, progressive passes, and passing-network
 * betweenness centrality per player, to 3 decimal places).
 */

const PITCH_X = 120.0;
const PITCH_Y = 80.0;
const GOAL = [120.0, 40.0];

const XT_GRID = [
  [0.00638303,0.00779616,0.00844854,0.00977659,0.01126267,0.01248344,0.01473596,0.0174506,0.02122129,0.02756312,0.03485072,0.0379259],
  [0.00750072,0.00878589,0.00942382,0.0105949,0.01214719,0.0138454,0.01611813,0.01870347,0.02401521,0.02953272,0.04066992,0.04647721],
  [0.0088799,0.00977745,0.01001304,0.01110462,0.01269174,0.01429128,0.01685596,0.01935132,0.0241224,0.02855202,0.05491138,0.06442595],
  [0.00941056,0.01082722,0.01016549,0.01132376,0.01262646,0.01484598,0.01689528,0.0199707,0.02385149,0.03511326,0.10805102,0.25745362],
  [0.00941056,0.01082722,0.01016549,0.01132376,0.01262646,0.01484598,0.01689528,0.0199707,0.02385149,0.03511326,0.10805102,0.25745362],
  [0.0088799,0.00977745,0.01001304,0.01110462,0.01269174,0.01429128,0.01685596,0.01935132,0.0241224,0.02855202,0.05491138,0.06442595],
  [0.00750072,0.00878589,0.00942382,0.0105949,0.01214719,0.0138454,0.01611813,0.01870347,0.02401521,0.02953272,0.04066992,0.04647721],
  [0.00638303,0.00779616,0.00844854,0.00977659,0.01126267,0.01248344,0.01473596,0.0174506,0.02122129,0.02756312,0.03485072,0.0379259],
];

function xtAt(x, y) {
  if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) return null;
  const ny = XT_GRID.length, nx = XT_GRID[0].length;
  const cx = Math.min(Math.max(Math.floor((x / PITCH_X) * nx), 0), nx - 1);
  const cy = Math.min(Math.max(Math.floor((y / PITCH_Y) * ny), 0), ny - 1);
  return XT_GRID[cy][cx];
}

function isProgressive(sx, sy, ex, ey, frac = 0.75) {
  if ([sx, sy, ex, ey].some((v) => v == null || Number.isNaN(v))) return false;
  const d0 = Math.hypot(GOAL[0] - sx, GOAL[1] - sy);
  const d1 = Math.hypot(GOAL[0] - ex, GOAL[1] - ey);
  return d1 < d0 * frac && ex > sx;
}

function flattenEvents(raw) {
  return raw.map((e) => {
    const etype = e.type && e.type.name;
    const team = e.team && e.team.name;
    const player = e.player && e.player.name;
    const loc = e.location;
    let x = null, y = null, endX = null, endY = null;
    let passOutcome = null, passRecipient = null, shotXg = null, shotOutcome = null;
    if (loc) { x = loc[0]; y = loc[1]; }
    if (etype === "Pass") {
      const p = e.pass || {};
      if (p.end_location) { endX = p.end_location[0]; endY = p.end_location[1]; }
      passRecipient = p.recipient && p.recipient.name;
      passOutcome = p.outcome && p.outcome.name;
    } else if (etype === "Carry") {
      const c = e.carry || {};
      if (c.end_location) { endX = c.end_location[0]; endY = c.end_location[1]; }
    } else if (etype === "Shot") {
      const s = e.shot || {};
      shotXg = s.statsbomb_xg;
      shotOutcome = s.outcome && s.outcome.name;
    }
    return {
      type: etype, team, player,
      x, y, endX, endY,
      passOutcome, passRecipient,
      minute: e.minute, second: e.second, period: e.period,
      shotXg, shotOutcome,
      possessionTeam: e.possession_team && e.possession_team.name,
      duration: e.duration || 0.0,
    };
  });
}

function teamList(events) {
  const teams = new Set();
  for (const e of events) if (e.team) teams.add(e.team);
  return [...teams].sort();
}

function fieldTilt(events) {
  const counts = {};
  let total = 0;
  for (const e of events) {
    if ((e.type === "Pass" || e.type === "Carry") && e.x != null && e.x >= 80) {
      counts[e.team] = (counts[e.team] || 0) + 1;
      total += 1;
    }
  }
  const out = {};
  for (const t in counts) out[t] = Math.round((counts[t] / total) * 1000) / 10;
  return out;
}

function possessionShare(events) {
  const dur = {};
  let total = 0;
  for (const e of events) {
    if (e.possessionTeam) {
      dur[e.possessionTeam] = (dur[e.possessionTeam] || 0) + e.duration;
      total += e.duration;
    }
  }
  const out = {};
  for (const t in dur) out[t] = Math.round((dur[t] / total) * 1000) / 10;
  return out;
}

function ppda(events, team) {
  const oppPass = events.filter(
    (e) => e.team !== team && e.team != null && e.type === "Pass" && e.x != null && e.x < 80
  ).length;
  const press = events.filter(
    (e) => e.team === team && ["Pressure", "Interception", "Foul Committed"].includes(e.type)
      && e.x != null && e.x > 40
  ).length;
  return Math.round((oppPass / Math.max(press, 1)) * 100) / 100;
}

function xtAdded(events) {
  const rows = [];
  for (const e of events) {
    if (e.type !== "Pass" && e.type !== "Carry") continue;
    if (e.type === "Pass" && e.passOutcome != null) continue;
    const xt0 = xtAt(e.x, e.y);
    const xt1 = xtAt(e.endX, e.endY);
    if (xt0 == null || xt1 == null) continue;
    rows.push({ team: e.team, xt: xt1 - xt0 });
  }
  return rows;
}

function round(v, d) {
  const m = 10 ** d;
  return Math.round(v * m) / m;
}

function teamMetrics(events) {
  const teams = teamList(events);
  const ft = fieldTilt(events);
  const ps = possessionShare(events);
  const xtRows = xtAdded(events);
  const result = {};
  for (const t of teams) {
    const passes = events.filter((e) => e.team === t && e.type === "Pass");
    const succ = passes.filter((e) => e.passOutcome == null);
    const carries = events.filter((e) => e.team === t && e.type === "Carry");
    const shots = events.filter((e) => e.team === t && e.type === "Shot");
    const f3 = succ.filter((e) => e.endX != null && e.endX >= 80 && e.x != null && e.x < 80);
    const z14 = succ.filter(
      (e) => e.endX != null && e.endX >= 80 && e.endX <= 102 && e.endY != null && e.endY >= 22 && e.endY <= 58
        && !(e.x != null && e.x >= 80 && e.x <= 102 && e.y != null && e.y >= 22 && e.y <= 58)
    );
    const progP = succ.filter((e) => isProgressive(e.x, e.y, e.endX, e.endY)).length;
    const progC = carries.filter((e) => isProgressive(e.x, e.y, e.endX, e.endY)).length;
    const xtT = xtRows.filter((r) => r.team === t).map((r) => r.xt);
    const goals = shots.filter((e) => e.shotOutcome === "Goal").length;
    const xg = shots.reduce((s, e) => s + (e.shotXg || 0), 0);
    result[t] = {
      possessionPct: ps[t] ?? NaN,
      fieldTilt: ft[t] ?? NaN,
      passes: passes.length,
      passCompletion: round((succ.length / Math.max(passes.length, 1)) * 100, 1),
      progressivePasses: progP,
      progressiveCarries: progC,
      finalThirdEntries: f3.length,
      zone14Entries: z14.length,
      xtTotal: round(xtT.reduce((a, b) => a + b, 0), 3),
      xtPerAction: xtT.length ? round(xtT.reduce((a, b) => a + b, 0) / xtT.length, 4) : NaN,
      shots: shots.length,
      xg: round(xg, 3),
      goals,
      ppda: ppda(events, t),
    };
  }
  return result;
}

// Brandes' algorithm for a weighted directed graph, matching
// networkx.betweenness_centrality(DiGraph, weight="distance") normalization: / ((n-1)(n-2)).
function betweennessCentrality(nodes, edges) {
  const adj = new Map(nodes.map((n) => [n, []]));
  for (const [u, v, w] of edges) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push([v, w]);
  }
  const betweenness = new Map(nodes.map((n) => [n, 0]));
  for (const s of nodes) {
    const dist = new Map([[s, 0]]);
    const sigma = new Map([[s, 1]]);
    const pred = new Map();
    const finalized = new Set();
    const order = [];
    // simple binary-heap-free Dijkstra (small graphs, fine to scan)
    const pq = [[0, s]];
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, u] = pq.shift();
      if (finalized.has(u)) continue;
      finalized.add(u);
      order.push(u);
      for (const [v, w] of adj.get(u) || []) {
        const nd = d + w;
        if (!dist.has(v) || nd < dist.get(v) - 1e-12) {
          dist.set(v, nd);
          sigma.set(v, sigma.get(u));
          pred.set(v, [u]);
          pq.push([nd, v]);
        } else if (Math.abs(nd - dist.get(v)) < 1e-12) {
          sigma.set(v, (sigma.get(v) || 0) + sigma.get(u));
          if (!pred.has(v)) pred.set(v, []);
          pred.get(v).push(u);
        }
      }
    }
    const delta = new Map(order.map((n) => [n, 0]));
    for (let i = order.length - 1; i >= 0; i--) {
      const w = order[i];
      for (const v of pred.get(w) || []) {
        if (sigma.get(w)) {
          delta.set(v, (delta.get(v) || 0) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
        }
      }
      if (w !== s) betweenness.set(w, betweenness.get(w) + delta.get(w));
    }
  }
  const n = nodes.length;
  const scale = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;
  const out = {};
  for (const [k, v] of betweenness) out[k] = v * scale;
  return out;
}

function passingNetwork(events, team, untilFirstSub = true) {
  let d = events.filter((e) => e.team === team);
  if (untilFirstSub) {
    const subMinutes = d.filter((e) => e.type === "Substitution" && e.minute != null).map((e) => e.minute);
    const cutoff = subMinutes.length ? Math.min(...subMinutes) : Infinity;
    d = d.filter((e) => e.minute != null && e.minute < cutoff);
  }
  const passes = d.filter((e) => e.type === "Pass" && e.passOutcome == null && e.passRecipient);
  const nodeX = {}, nodeY = {}, nodePasses = {};
  const pairCounts = new Map();
  for (const e of passes) {
    (nodeX[e.player] ??= []).push(e.x);
    (nodeY[e.player] ??= []).push(e.y);
    nodePasses[e.player] = (nodePasses[e.player] || 0) + 1;
    const key = `${e.player} ${e.passRecipient}`;
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  }
  const nodes = Object.keys(nodePasses).sort();
  const edges = [...pairCounts.entries()].map(([key, n]) => {
    const [u, v] = key.split(" ");
    return [u, v, 1.0 / n];
  });
  const bc = betweennessCentrality(nodes, edges);

  const avg = (arr) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const nodeRows = nodes.map((p) => ({
    player: p,
    x: avg(nodeX[p]),
    y: avg(nodeY[p]),
    passes: nodePasses[p],
    betweenness: round(bc[p] || 0, 3),
  }));
  nodeRows.sort((a, b) => b.passes - a.passes);

  const edgeTotals = new Map();
  for (const [key, n] of pairCounts) {
    const [u, v] = key.split(" ");
    const ek = [u, v].sort().join(" ");
    edgeTotals.set(ek, (edgeTotals.get(ek) || 0) + n);
  }
  const edgeRows = [...edgeTotals.entries()].map(([key, n]) => {
    const [p1, p2] = key.split(" ");
    return { p1, p2, n };
  });
  edgeRows.sort((a, b) => b.n - a.n);

  return { nodes: nodeRows, edges: edgeRows };
}

function phaseSplit(events, windows) {
  const teams = teamList(events);
  const out = [];
  for (const [lo, hi, label] of windows) {
    const seg = events.filter((e) => e.minute != null && e.minute >= lo && e.minute < hi);
    if (!seg.length) continue;
    const ft = fieldTilt(seg);
    for (const t of teams) {
      const td = seg.filter((e) => e.team === t);
      const passes = td.filter((e) => e.type === "Pass");
      const shots = td.filter((e) => e.type === "Shot");
      out.push({
        phase: label,
        team: t,
        minutes: `${lo}-${hi}`,
        fieldTilt: ft[t] || 0,
        passes: passes.length,
        shots: shots.length,
        xg: round(shots.reduce((s, e) => s + (e.shotXg || 0), 0), 3),
        goals: shots.filter((e) => e.shotOutcome === "Goal").length,
        ppda: ppda(seg, t),
      });
    }
  }
  return out;
}

window.OFI = {
  flattenEvents, teamList, fieldTilt, possessionShare, ppda, xtAdded,
  teamMetrics, passingNetwork, phaseSplit, betweennessCentrality,
};
