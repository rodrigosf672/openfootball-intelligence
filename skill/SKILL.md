---
name: openfootball-intelligence
description: Turn StatsBomb-format soccer/football event data into tactical explanations. Use when the user asks a "why" question about a real match (why a team struggled to progress, why a press was ineffective, what changed after half-time), wants advanced football metrics (xG, xT/expected threat, PPDA, field tilt, progressive passes/carries, final-third and Zone-14 entries, passing networks with centrality, possession-based similarity), tactical figures (passing network, shot map, xG timeline, momentum/field-tilt chart), or a historical comparison across matches. Loads a metric library (kernel.py) and a fixed evidence-first workflow and response format.
---

# OpenFootball Intelligence (OFI)

**Ask why. Get tactical evidence.** OFI transforms live or completed match
event data into tactical explanations grounded in reproducible Python — it
retrieves data, computes advanced metrics, compares against historical
matches, and explains findings in football language. It explains **why**, not
just **what**.

Data source: **StatsBomb open event data** (free, via `statsbombpy`) or any
DataFrame in the same schema (`type`, `team`, `location`, `pass_end_location`,
`carry_end_location`, `shot_statsbomb_xg`, `minute`, `period`, `possession_team`,
`pass_recipient`, ...). Pitch is 120×80; every team attacks toward x=120 in its
own event rows.

## Setup

Use an environment with `pandas`, `numpy`, `scipy`, `networkx`, `matplotlib`,
`mplsoccer`, `statsbombpy` (the `soccer` env has these). Loading this skill
defines the metric functions below in your kernel via `kernel.py`.

## Metric library (all defined on load)

| Function | Returns |
|---|---|
| `load_match(match_id, drop_shootout=True)` | events DataFrame with coords attached (periods ≤4) |
| `list_matches(competition_id, season_id)` | StatsBomb match list |
| `add_coords(df)` | adds `x,y` (start) and `end_x,end_y` (pass/carry end) |
| `team_metrics(df)` | per-team table: possession, field tilt, passing, progression, entries, xT, shots/xG/goals, PPDA |
| `field_tilt(df)` | % of final-third possession actions per team |
| `possession_share(df)` | possession % by summed event duration |
| `ppda(df, team)` | passes-allowed-per-defensive-action (lower = more aggressive press) |
| `xt_added(df)` | expected-threat added per successful pass/carry |
| `is_progressive(sx,sy,ex,ey)` | progressive move test (≥25% closer to goal AND forward) |
| `passing_network(df, team)` | (nodes, edges) with avg location, pass volume, betweenness centrality |
| `phase_split(df, windows)` | per-team metrics within `[(lo,hi,label),...]` minute windows |
| `similarity_rank(vectors_df, target_idx, feature_cols)` | cosine-similarity ranking of matches |

**Metric notes.** Betweenness centrality uses *inverse* pass volume as edge
distance (heavy links = short = central) — the correct convention for
networkx shortest-path centrality. xT uses the open Karun Singh 12×8 grid.
Validate xG by comparing `team_metrics(df)["xg"]` against StatsBomb's own
shot xG (they should match to 2 dp).

## Workflow (for every question)

1. **Understand the tactical question** — what is being asked, about which team/phase.
2. **Load the match** — `m = load_match(match_id)`. Find ids with `list_matches(...)`.
3. **Compute only the necessary metrics** — `team_metrics(m)` for a headline read; `phase_split` when the question is about *change* (halves, before/after a sub or goal).
4. **Compare against historical baselines** — build a metric vector per match, then `similarity_rank(...)` to surface the most similar games.
5. **Identify the strongest evidence** — 3–6 observations that actually move the answer; check them against game state (score, minute, subs, formation).
6. **Produce visualizations if helpful** — passing network, shot map, xG timeline, momentum/field-tilt chart (see the figure recipe below). Load the `figure-style` skill first.
7. **Generate a concise explanation** — in the response format below. Never report a number without its tactical meaning ("field tilt 73%" → "possession is stuck in the attacking third but not becoming chances because the central lanes are blocked").
8. **Report confidence** — High / Medium / Low, with justification.

## Figures

Load `figure-style` and call `apply_figure_style()` first. Recommended set:
- **Passing network**: `mplsoccer.Pitch`, node size = passes made, edge width/opacity = pair volume, position = average location. Restrict to a clean XI window (to first substitution).
- **Shot map**: `VerticalPitch(half=True)`, marker area ∝ xG, ring goals.
- **xG timeline**: cumulative step chart per team, goals annotated, half-time/ET breaks marked.
- **Momentum**: net expected threat per 5-min window (positive = team A, negative = team B), goals as vertical lines.

## Response format (always)

```
## Summary            — one-sentence answer
## Evidence           — 3 to 6 computed observations
## Tactical Interpretation — what the evidence means, in football language
## Historical Comparison   — most similar prior matches (when available)
## Suggested Adjustments    — evidence-based recommendations tied to observed data
## Confidence         — High / Medium / Low, with justification
```

## Principles
- **Evidence first** — every conclusion supported by computed data.
- **Explainability** — explain *why*, not just *what*.
- **Reproducibility** — every answer traceable to reproducible Python.
- **Context awareness** — always weigh score, minute, subs, formations, match state, opponent behavior before concluding.
