/*
 * Builds evidence-first answer text from live-computed OFI metrics (ofi.js).
 * Mirrors the response style of the SKILL.md workflow: a claim, then the
 * computed numbers behind it, then which function produced them.
 */

function fmtPct(x) {
  return Number.isFinite(x) ? `${x.toFixed(1)}%` : "n/a";
}

function fixtureLabel(prov) {
  return `${prov.fixture} - ${prov.competition}${prov.date ? " (" + prov.date + ")" : ""}`;
}

function buildOverview(events, prov) {
  const tm = window.OFI.teamMetrics(events);
  const lines = [`**${fixtureLabel(prov)}**`, ""];
  for (const t of Object.keys(tm).sort()) {
    const r = tm[t];
    lines.push(
      `- **${t}**: ${fmtPct(r.possessionPct)} possession, ${fmtPct(r.fieldTilt)} field tilt, ` +
      `${r.xg.toFixed(2)} xG from ${r.shots} shots (${r.goals} goals), PPDA ${r.ppda.toFixed(2)}, ` +
      `${r.progressivePasses} progressive passes`
    );
  }
  lines.push("", "_Computed via `teamMetrics()` (JS port of `ofi.team_metrics()`)._");
  return { text: lines.join("\n"), image: null };
}

function buildPress(events, prov) {
  const ps = window.OFI.phaseSplit(events, [[0, 45, "1st half"], [45, 90, "2nd half"], [90, 120, "Extra time"]]);
  const lines = [`**Pressing intensity (PPDA -- lower means a more aggressive press) by phase, ${fixtureLabel(prov)}:**`, ""];
  for (const r of ps) lines.push(`- ${r.phase}, ${r.team}: PPDA ${r.ppda.toFixed(2)}`);
  lines.push("", "_Computed via `phaseSplit()` (PPDA per team per time window)._");
  return { text: lines.join("\n"), image: null };
}

function buildXg(events, prov) {
  const tm = window.OFI.teamMetrics(events);
  const lines = [`**Shots and expected goals (xG), ${fixtureLabel(prov)}:**`, ""];
  for (const t of Object.keys(tm).sort()) {
    const r = tm[t];
    lines.push(`- **${t}**: ${r.shots} shots, ${r.xg.toFixed(3)} xG, ${r.goals} goals`);
  }
  lines.push("", "_Computed via `teamMetrics()`; xG summed from StatsBomb's `shot.statsbomb_xg`._");
  return { text: lines.join("\n"), image: null };
}

function buildProgression(events, prov) {
  const tm = window.OFI.teamMetrics(events);
  const lines = [`**Progression into dangerous areas, ${fixtureLabel(prov)}:**`, ""];
  for (const t of Object.keys(tm).sort()) {
    const r = tm[t];
    lines.push(
      `- **${t}**: ${r.progressivePasses} progressive passes, ${r.progressiveCarries} progressive carries, ` +
      `${r.finalThirdEntries} final-third entries, ${r.zone14Entries} Zone-14 entries`
    );
  }
  lines.push("", "_Computed via `teamMetrics()` (progressive move = ends significantly closer to goal and forward)._");
  return { text: lines.join("\n"), image: null };
}

function buildNetwork(events, prov, team) {
  const { nodes } = window.OFI.passingNetwork(events, team);
  const top = [...nodes].sort((a, b) => b.betweenness - a.betweenness).slice(0, 5);
  const lines = [
    `**${team}'s passing network (until first substitution), ${fixtureLabel(prov)}:**`, "",
    "Most central players by betweenness centrality (how much the team's ball circulation runs through them):", "",
  ];
  for (const r of top) lines.push(`- ${r.player}: ${r.passes} passes, betweenness ${r.betweenness.toFixed(3)}`);
  lines.push("", `_Computed via `+ "`passingNetwork(events, \"" + team + "\")`" + "._");
  return { text: lines.join("\n"), image: "figures/passing_network.png" };
}

function buildPhase(events, prov) {
  const ps = window.OFI.phaseSplit(events, [[0, 45, "1st half"], [45, 90, "2nd half"], [90, 120, "Extra time"]]);
  const lines = [`**Phase-by-phase breakdown, ${fixtureLabel(prov)}:**`, ""];
  for (const r of ps) {
    lines.push(
      `- ${r.phase}, ${r.team}: field tilt ${r.fieldTilt.toFixed(1)}%, ${r.shots} shots, ` +
      `${r.xg.toFixed(2)} xG, ${r.goals} goals, PPDA ${r.ppda.toFixed(2)}`
    );
  }
  lines.push("", "_Computed via `phaseSplit(events, [[0,45,'1st half'], [45,90,'2nd half'], [90,120,'Extra time']])`._");
  return { text: lines.join("\n"), image: "figures/xg_timeline.png" };
}

function buildSimilarity(prov, similarityData) {
  if (!similarityData) {
    return {
      text: "Historical similarity ranking is only precomputed for the default World Cup Final "
        + "dataset (France's full tournament run). Switch back to the default match to use this.",
      image: null,
    };
  }
  const rows = similarityData.filter((r) => r.match_id !== prov.match_id).sort((a, b) => b.similarity - a.similarity);
  const lines = ["**France's other 2022 World Cup matches ranked by tactical similarity to the Final "
    + "(cosine similarity over 9 standardized team metrics):**", ""];
  for (const r of rows) {
    lines.push(`- ${r.label}: similarity ${r.similarity.toFixed(2)} `
      + `(possession ${r.possession.toFixed(0)}%, field tilt ${r.field_tilt.toFixed(0)}%, xG ${r.xg.toFixed(2)})`);
  }
  lines.push("", "_Computed via `similarity_rank()` (Python) over France's tournament matches; cached from `ofi.py`._");
  return { text: lines.join("\n"), image: "figures/similarity.png" };
}

function buildWhyPassive(events, prov) {
  const tm = window.OFI.teamMetrics(events);
  const ps = window.OFI.phaseSplit(events, [[0, 45, "1st half"], [45, 90, "2nd half"], [90, 120, "Extra time"]]);
  const teams = window.OFI.teamList(events);
  const firstHalf = {};
  for (const r of ps) if (r.phase === "1st half") firstHalf[r.team] = r;
  const lines = [`**${fixtureLabel(prov)} -- tactical summary:**`, ""];
  for (const t of teams) {
    const r = tm[t];
    const fh = firstHalf[t];
    const extra = fh ? `, ${fh.xg.toFixed(2)} first-half xG on ${fh.shots} shots (PPDA ${fh.ppda.toFixed(2)})` : "";
    lines.push(`- **${t}** overall: ${fmtPct(r.fieldTilt)} field tilt, ${r.xg.toFixed(2)} xG, ${r.goals} goals${extra}`);
  }
  lines.push("", "_Computed via `teamMetrics()` and `phaseSplit()`. For the full evidence-first narrative on this "
    + "exact question (default match only), see `analysis_report.md` in the GitHub repo._");
  return { text: lines.join("\n"), image: "figures/momentum.png" };
}

const KEYWORD_ROUTES = [
  { re: /press|ppda|intensity/i, fn: buildPress },
  { re: /\bxg\b|expected goal|shot/i, fn: buildXg },
  { re: /progress|final.?third|zone.?14|entr(y|ies)/i, fn: buildProgression },
  { re: /passive|why.*struggl|why.*comeback|why.*control/i, fn: buildWhyPassive },
  { re: /half|phase|extra time|minute|before|after/i, fn: buildPhase },
  { re: /possess|control|overview|summary|dominant|comparison|compare$/i, fn: buildOverview },
];

function routeQuestion(question, events, prov, similarityData) {
  const teams = window.OFI.teamList(events);
  const q = (question || "").trim();
  if (!q) return { text: "Ask a tactical question, or pick one of the examples below.", image: null };
  const lower = q.toLowerCase();

  if (/network|passer|playmaker|centrality|isolat|key player/.test(lower)) {
    const team = teams.find((t) => lower.includes(t.toLowerCase())) || teams[0];
    return buildNetwork(events, prov, team);
  }
  if (/similar|historical|compare.*tournament|other.*match/i.test(lower)) {
    return buildSimilarity(prov, similarityData);
  }
  for (const { re, fn } of KEYWORD_ROUTES) {
    if (re.test(lower)) return fn(events, prov);
  }
  const fallback = buildOverview(events, prov);
  return {
    text: "_Couldn't match that to a specific metric, so here's the full team comparison instead. "
      + "Try one of the example questions below for a more targeted answer._\n\n" + fallback.text,
    image: fallback.image,
  };
}

window.OFI_ROUTES = { routeQuestion, buildOverview, fixtureLabel };
