"""Precompute every answer the static site (docs/) can show, from real OFI
metrics on the cached World Cup Final dataset, and dump them to docs/data.json.

Run this once (or whenever the underlying data/metrics change):
    python scripts/build_static_site.py

The published site then does no computation itself -- it just looks up one of
these precomputed, evidence-first answers by keyword match in the browser.
Every number in the output was computed by ofi.py, not invented.
"""
import json
import os
import sys

import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import ofi

DATA_DIR = os.path.join(ROOT, "data")
OUT_PATH = os.path.join(ROOT, "docs", "data.json")

with open(os.path.join(DATA_DIR, "data_provenance.json")) as f:
    PROV = json.load(f)

SIMILARITY_TABLE = pd.read_csv(os.path.join(DATA_DIR, "similarity_table.csv"))


def load_events():
    df = pd.read_parquet(os.path.join(DATA_DIR, "match_events.parquet"))
    df = df[df["period"] <= 4].copy()
    return ofi.add_coords(df)


def fixture_label():
    return f"{PROV['fixture']} - {PROV['competition']} ({PROV['date']})"


def fmt_pct(x):
    return f"{x:.1f}%" if pd.notna(x) else "n/a"


def build_overview(df):
    tm = ofi.team_metrics(df)
    lines = [f"**{fixture_label()}**", ""]
    for t in tm.index:
        r = tm.loc[t]
        lines.append(
            f"- **{t}**: {fmt_pct(r.possession_pct)} possession, "
            f"{fmt_pct(r.field_tilt)} field tilt, {r.xg:.2f} xG from {int(r.shots)} shots "
            f"({int(r.goals)} goals), PPDA {r.ppda:.2f}, "
            f"{int(r.progressive_passes)} progressive passes"
        )
    lines.append("")
    lines.append("_Computed via `ofi.team_metrics()`._")
    return "\n".join(lines), None


def build_press(df):
    ps = ofi.phase_split(df, [(0, 45, "1st half"), (45, 90, "2nd half"), (90, 120, "Extra time")])
    lines = [f"**Pressing intensity (PPDA -- lower means a more aggressive press) by phase, {fixture_label()}:**", ""]
    for _, r in ps.iterrows():
        lines.append(f"- {r.phase}, {r.team}: PPDA {r.ppda:.2f}")
    lines.append("")
    lines.append("_Computed via `ofi.phase_split()` (PPDA per team per time window)._")
    return "\n".join(lines), None


def build_xg(df):
    tm = ofi.team_metrics(df)
    lines = [f"**Shots and expected goals (xG), {fixture_label()}:**", ""]
    for t in tm.index:
        r = tm.loc[t]
        lines.append(f"- **{t}**: {int(r.shots)} shots, {r.xg:.3f} xG, {int(r.goals)} goals")
    lines.append("")
    lines.append("_Computed via `ofi.team_metrics()`; xG summed from StatsBomb's `shot_statsbomb_xg`._")
    return "\n".join(lines), None


def build_progression(df):
    tm = ofi.team_metrics(df)
    lines = [f"**Progression into dangerous areas, {fixture_label()}:**", ""]
    for t in tm.index:
        r = tm.loc[t]
        lines.append(
            f"- **{t}**: {int(r.progressive_passes)} progressive passes, "
            f"{int(r.progressive_carries)} progressive carries, "
            f"{int(r.final_third_entries)} final-third entries, "
            f"{int(r.zone14_entries)} Zone-14 entries"
        )
    lines.append("")
    lines.append("_Computed via `ofi.team_metrics()` (progressive move = ends significantly closer to goal and forward)._")
    return "\n".join(lines), None


def build_network(df, team):
    nodes, _ = ofi.passing_network(df, team)
    top = nodes.sort_values("betweenness", ascending=False).head(5)
    lines = [f"**{team}'s passing network (until first substitution), {fixture_label()}:**", "",
             "Most central players by betweenness centrality (how much the team's ball circulation runs through them):", ""]
    for _, r in top.iterrows():
        lines.append(f"- {r.player}: {int(r.passes)} passes, betweenness {r.betweenness:.3f}")
    lines.append("")
    lines.append(f'_Computed via `ofi.passing_network(df, "{team}")`._')
    return "\n".join(lines), "passing_network.png"


def build_phase(df):
    ps = ofi.phase_split(df, [(0, 45, "1st half"), (45, 90, "2nd half"), (90, 120, "Extra time")])
    lines = [f"**Phase-by-phase breakdown, {fixture_label()}:**", ""]
    for _, r in ps.iterrows():
        lines.append(
            f"- {r.phase}, {r.team}: field tilt {r.field_tilt:.1f}%, {int(r.shots)} shots, "
            f"{r.xg:.2f} xG, {int(r.goals)} goals, PPDA {r.ppda:.2f}"
        )
    lines.append("")
    lines.append("_Computed via `ofi.phase_split(df, [(0,45,'1st half'), (45,90,'2nd half'), (90,120,'Extra time')])`._")
    return "\n".join(lines), "xg_timeline.png"


def build_similarity():
    t = SIMILARITY_TABLE[SIMILARITY_TABLE["match_id"] != PROV["match_id"]].sort_values("similarity", ascending=False)
    lines = ["**France's other 2022 World Cup matches ranked by tactical similarity to the Final "
             "(cosine similarity over 9 standardized team metrics):**", ""]
    for _, r in t.iterrows():
        lines.append(f"- {r.label}: similarity {r.similarity:.2f} "
                      f"(possession {r.possession:.0f}%, field tilt {r.field_tilt:.0f}%, xG {r.xg:.2f})")
    lines.append("")
    lines.append("_Computed via `ofi.similarity_rank()` over France's tournament matches._")
    return "\n".join(lines), "similarity.png"


def build_why_passive(df):
    ps = ofi.phase_split(df, [(0, 45, "1st half"), (45, 90, "2nd half"), (90, 120, "Extra time")])
    tm = ofi.team_metrics(df)
    teams = sorted(df["team"].dropna().unique().tolist())
    lines = [f"**{fixture_label()} -- tactical summary:**", ""]
    first_half = ps[ps["phase"] == "1st half"].set_index("team")
    for t in teams:
        r = tm.loc[t]
        fh = first_half.loc[t] if t in first_half.index else None
        extra = f", {fh.xg:.2f} first-half xG on {int(fh.shots)} shots (PPDA {fh.ppda:.2f})" if fh is not None else ""
        lines.append(f"- **{t}** overall: {fmt_pct(r.field_tilt)} field tilt, {r.xg:.2f} xG, {int(r.goals)} goals{extra}")
    lines.append("")
    lines.append("_Computed via `ofi.team_metrics()` and `ofi.phase_split()`. "
                  "For the full evidence-first narrative on this exact question, see "
                  "`analysis_report.md` in the GitHub repo._")
    return "\n".join(lines), "momentum.png"


def main():
    df = load_events()
    teams = sorted(df["team"].dropna().unique().tolist())

    routes = {
        "overview": build_overview(df),
        "press": build_press(df),
        "xg": build_xg(df),
        "progression": build_progression(df),
        "phase": build_phase(df),
        "similarity": build_similarity(),
        "why_passive": build_why_passive(df),
    }
    for t in teams:
        routes[f"network_{t.lower()}"] = build_network(df, t)

    payload = {
        "provenance": PROV,
        "teams": teams,
        "routes": {k: {"text": v[0], "image": v[1]} for k, v in routes.items()},
        "examples": [
            "Why was France passive for the first 70 minutes?",
            "How aggressive was Argentina's press in each phase of the game?",
            "Who was France's most important passer?",
            "Which of France's other World Cup matches is the Final most similar to?",
            "Compare Argentina and France's progressive passing and final-third entries.",
            "What happened in extra time?",
            "Give me the full team comparison.",
        ],
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")


if __name__ == "__main__":
    main()
