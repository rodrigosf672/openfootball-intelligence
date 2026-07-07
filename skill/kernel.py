"""OpenFootball Intelligence (OFI) — reusable metric & workflow library (v0.2 -- adds live/as-of-minute mode).

Computes advanced football metrics from StatsBomb-format event data
(pandas DataFrame with `type`, `team`, `location`, `pass_end_location`,
`carry_end_location`, `shot_statsbomb_xg`, `minute`, `period`, ...).

Pitch coordinates: StatsBomb 120 x 80, every team attacks toward x=120
in its own event rows. See SKILL.md for the workflow and response format.
"""

# --- constants (literals only at module scope) ---
PITCH_X = 120.0
PITCH_Y = 80.0
GOAL = (120.0, 40.0)

# Karun Singh open Expected-Threat grid, 8 rows (y) x 12 cols (x), plain literal.
XT_GRID = [
 [0.00638303,0.00779616,0.00844854,0.00977659,0.01126267,0.01248344,0.01473596,0.0174506,0.02122129,0.02756312,0.03485072,0.0379259],
 [0.00750072,0.00878589,0.00942382,0.0105949,0.01214719,0.0138454,0.01611813,0.01870347,0.02401521,0.02953272,0.04066992,0.04647721],
 [0.0088799,0.00977745,0.01001304,0.01110462,0.01269174,0.01429128,0.01685596,0.01935132,0.0241224,0.02855202,0.05491138,0.06442595],
 [0.00941056,0.01082722,0.01016549,0.01132376,0.01262646,0.01484598,0.01689528,0.0199707,0.02385149,0.03511326,0.10805102,0.25745362],
 [0.00941056,0.01082722,0.01016549,0.01132376,0.01262646,0.01484598,0.01689528,0.0199707,0.02385149,0.03511326,0.10805102,0.25745362],
 [0.0088799,0.00977745,0.01001304,0.01110462,0.01269174,0.01429128,0.01685596,0.01935132,0.0241224,0.02855202,0.05491138,0.06442595],
 [0.00750072,0.00878589,0.00942382,0.0105949,0.01214719,0.0138454,0.01611813,0.01870347,0.02401521,0.02953272,0.04066992,0.04647721],
 [0.00638303,0.00779616,0.00844854,0.00977659,0.01126267,0.01248344,0.01473596,0.0174506,0.02122129,0.02756312,0.03485072,0.0379259],
]

DEFAULT_TEAM_COLORS = ("#6CACE4", "#1A2C5B")


# --- StatsBomb loader ---
def load_match(match_id, source="statsbomb", drop_shootout=True, as_of_minute=None):
    """Load a match as an events DataFrame with coordinates attached.

    source: "statsbomb" (open data via statsbombpy) or any name registered with
      register_source() -- e.g. a licensed live feed (Hudl StatsBomb API, Opta,
      Sportradar, Sportmonks). drop_shootout keeps periods <=4. as_of_minute
      (optional) returns only the game state up to that minute -- the live-query
      mode used to ask "why is X struggling right now".
    """
    if source == "statsbomb":
        from statsbombpy import sb
        ev = sb.events(match_id=match_id)
    else:
        if source not in LIVE_ADAPTERS:
            raise ValueError("unknown source '%s'; register it with register_source() first" % source)
        ev = LIVE_ADAPTERS[source](match_id)
    if drop_shootout and "period" in ev.columns:
        ev = ev[ev["period"] <= 4].copy()
    ev = add_coords(ev)
    if as_of_minute is not None:
        ev = snapshot(ev, as_of_minute)
    return ev


def list_matches(competition_id, season_id):
    """Return the StatsBomb match list for a competition/season."""
    from statsbombpy import sb
    return sb.matches(competition_id=competition_id, season_id=season_id)


# --- coordinate helpers ---
def parse_xy(loc):
    import json
    import numpy as np
    if isinstance(loc, str):
        try:
            loc = json.loads(loc)
        except Exception:
            return (np.nan, np.nan)
    if isinstance(loc, (list, tuple)) and len(loc) >= 2:
        return (float(loc[0]), float(loc[1]))
    return (np.nan, np.nan)


def add_coords(df):
    """Add x,y (start) and end_x,end_y (pass/carry end) columns."""
    import pandas as pd
    import numpy as np
    df = df.copy()
    df[["x", "y"]] = df["location"].apply(lambda v: pd.Series(parse_xy(v)))

    def _end(row):
        if row["type"] == "Pass":
            return parse_xy(row.get("pass_end_location"))
        if row["type"] == "Carry":
            return parse_xy(row.get("carry_end_location"))
        return (np.nan, np.nan)

    df[["end_x", "end_y"]] = df.apply(lambda r: pd.Series(_end(r)), axis=1)
    return df


def xt_at(x, y):
    import numpy as np
    if x is None or y is None or (isinstance(x, float) and np.isnan(x)) or (isinstance(y, float) and np.isnan(y)):
        return np.nan
    ny, nx = len(XT_GRID), len(XT_GRID[0])
    cx = min(int(x / PITCH_X * nx), nx - 1)
    cy = min(int(y / PITCH_Y * ny), ny - 1)
    return XT_GRID[cy][cx]


def is_progressive(sx, sy, ex, ey, frac=0.75):
    """True if a move ends >= (1-frac) closer to goal AND forward (x increases)."""
    import numpy as np
    vals = (sx, sy, ex, ey)
    if any(v is None or (isinstance(v, float) and np.isnan(v)) for v in vals):
        return False
    d0 = np.hypot(GOAL[0] - sx, GOAL[1] - sy)
    d1 = np.hypot(GOAL[0] - ex, GOAL[1] - ey)
    return bool((d1 < d0 * frac) and (ex > sx))


# --- metric functions (each takes an events DataFrame) ---
def xt_added(df):
    """xT added per successful pass/carry = xt(end) - xt(start). Returns rows
    with an added `xt` column (team, minute preserved)."""
    d = df[df["type"].isin(["Pass", "Carry"])].copy()
    if "x" not in d.columns:
        d = add_coords(d)
    succ = ~((d["type"] == "Pass") & d["pass_outcome"].notna())
    d = d[succ].copy()
    d["xt"] = [xt_at(x, y) - xt_at(sx, sy)
               for sx, sy, x, y in zip(d["x"], d["y"], d["end_x"], d["end_y"])]
    return d


def field_tilt(df):
    """Share of final-third possession actions (passes+carries, x>=80) per team."""
    d = df[df["type"].isin(["Pass", "Carry"])]
    if "x" not in d.columns:
        d = add_coords(d)
    f3 = d[d["x"] >= 80]
    c = f3.groupby("team").size()
    return (c / c.sum() * 100).round(1).to_dict()


def possession_share(df):
    """Possession % by summed event duration per possession_team."""
    dur = df.groupby("possession_team")["duration"].sum()
    return (dur / dur.sum() * 100).round(1).to_dict()


def ppda(df, team):
    """Passes-allowed-per-defensive-action: opponent build-up passes (their
    own two-thirds) divided by this team's pressing actions there. Lower =
    more aggressive press."""
    d = df if "x" in df.columns else add_coords(df)
    opp = d[d["team"] != team]
    us = d[d["team"] == team]
    opp_pass = opp[(opp["type"] == "Pass") & (opp["x"] < 80)]
    press = us[us["type"].isin(["Pressure", "Interception", "Foul Committed"]) & (us["x"] > 40)]
    return round(len(opp_pass) / max(len(press), 1), 2)


def team_metrics(df):
    """Full per-team metric table: possession, field tilt, passing, progression,
    entries, xT, shots/xG/goals, PPDA. Returns a DataFrame indexed by team."""
    import pandas as pd
    import numpy as np
    d = df if "x" in df.columns else add_coords(df)
    xt = xt_added(d)
    ft = field_tilt(d)
    ps = possession_share(d)
    rows = {}
    for t in d["team"].unique():
        td = d[d["team"] == t]
        passes = td[td["type"] == "Pass"]
        succ = passes[passes["pass_outcome"].isna()]
        carries = td[td["type"] == "Carry"]
        shots = td[td["type"] == "Shot"]
        f3 = succ[(succ["end_x"] >= 80) & (succ["x"] < 80)]
        z14 = succ[(succ["end_x"] >= 80) & (succ["end_x"] <= 102) &
                   (succ["end_y"] >= 22) & (succ["end_y"] <= 58) &
                   ~((succ["x"] >= 80) & (succ["x"] <= 102) &
                     (succ["y"] >= 22) & (succ["y"] <= 58))]
        prog_p = sum(is_progressive(r.x, r.y, r.end_x, r.end_y) for r in succ.itertuples())
        prog_c = sum(is_progressive(r.x, r.y, r.end_x, r.end_y) for r in carries.itertuples())
        xt_t = xt[xt["team"] == t]["xt"]
        rows[t] = dict(
            possession_pct=ps.get(t, np.nan),
            field_tilt=ft.get(t, np.nan),
            passes=len(passes),
            pass_completion=round(len(succ) / max(len(passes), 1) * 100, 1),
            progressive_passes=prog_p,
            progressive_carries=prog_c,
            final_third_entries=len(f3),
            zone14_entries=len(z14),
            xt_total=round(xt_t.sum(), 3),
            xt_per_action=round(xt_t.mean(), 4) if len(xt_t) else np.nan,
            shots=len(shots),
            xg=round(shots["shot_statsbomb_xg"].astype(float).sum(), 3),
            goals=int((shots["shot_outcome"] == "Goal").sum()),
            ppda=ppda(d, t),
        )
    return pd.DataFrame(rows).T


def passing_network(df, team, until_first_sub=True):
    """Average locations + weighted pass adjacency + betweenness centrality for
    a team's XI. Returns (nodes_df, edges_df). Betweenness uses inverse pass
    volume as edge DISTANCE (heavy links = short = central), which is the
    correct convention for networkx shortest-path centrality."""
    import pandas as pd
    import networkx as nx
    d = df if "x" in df.columns else add_coords(df)
    d = d[d["team"] == team]
    if until_first_sub:
        subs = d[d["type"] == "Substitution"]["minute"]
        cutoff = subs.min() if len(subs) else 1e9
        d = d[d["minute"] < cutoff]
    passes = d[(d["type"] == "Pass") & d["pass_outcome"].isna() & d["pass_recipient"].notna()]
    nodes = passes.groupby("player").agg(x=("x", "mean"), y=("y", "mean"),
                                         passes=("id", "size")).reset_index()
    pair = passes.groupby(["player", "pass_recipient"]).size().reset_index(name="n")
    pair["key"] = pair.apply(lambda r: tuple(sorted([r["player"], r["pass_recipient"]])), axis=1)
    edges = pair.groupby("key")["n"].sum().reset_index()
    edges[["p1", "p2"]] = pd.DataFrame(edges["key"].tolist(), index=edges.index)
    edges = edges[["p1", "p2", "n"]]
    G = nx.DiGraph()
    for r in pair.itertuples():
        G.add_edge(r.player, r.pass_recipient, weight=r.n, distance=1.0 / r.n)
    bc = nx.betweenness_centrality(G, weight="distance")
    nodes["betweenness"] = nodes["player"].map(bc).fillna(0).round(3)
    return (nodes.sort_values("passes", ascending=False),
            edges.sort_values("n", ascending=False))


def phase_split(df, windows):
    """Compute per-team metrics within minute windows.
    windows: list of (lo, hi, label). Returns a tidy DataFrame."""
    import pandas as pd
    d = df if "x" in df.columns else add_coords(df)
    out = []
    for lo, hi, label in windows:
        seg = d[(d["minute"] >= lo) & (d["minute"] < hi)]
        if len(seg) == 0:
            continue
        ft = field_tilt(seg)
        for t in d["team"].unique():
            td = seg[seg["team"] == t]
            passes = td[td["type"] == "Pass"]
            succ = passes[passes["pass_outcome"].isna()]
            shots = td[td["type"] == "Shot"]
            out.append(dict(
                phase=label, team=t, minutes=f"{lo}-{hi}",
                field_tilt=ft.get(t, 0),
                passes=len(passes),
                prog=sum(is_progressive(r.x, r.y, r.end_x, r.end_y) for r in succ.itertuples()),
                shots=len(shots),
                xg=round(shots["shot_statsbomb_xg"].astype(float).sum(), 3),
                goals=int((shots["shot_outcome"] == "Goal").sum()),
                ppda=ppda(seg, t),
            ))
    return pd.DataFrame(out)


def similarity_rank(vectors_df, target_idx, feature_cols):
    """Rank rows of a metric matrix by cosine similarity to a target row.
    Standardizes features first. Returns the frame with a `similarity` column."""
    import numpy as np
    from scipy.spatial.distance import cosine
    X = vectors_df[feature_cols].astype(float).values
    mu, sd = X.mean(0), X.std(0)
    sd[sd == 0] = 1.0
    Z = (X - mu) / sd
    df = vectors_df.copy()
    df["similarity"] = [1 - cosine(Z[i], Z[target_idx]) for i in range(len(Z))]
    return df.sort_values("similarity", ascending=False)


# ============================================================================
# Live capability: data-source adapters + as-of-minute state + replay
# ----------------------------------------------------------------------------
# OFI's metrics are source-agnostic. Historical open data is loaded directly;
# a live match is the SAME engine reading events up to the current minute.
# A licensed live provider plugs in through register_source() -- nothing in the
# metric functions changes.
# ============================================================================

LIVE_ADAPTERS = {}


def register_source(name, fetch_fn):
    """Register a data-source adapter so load_match(match_id, source=name) works.

    fetch_fn(match_id) must return an events DataFrame in StatsBomb schema
    (columns: type, team, location, pass_end_location, carry_end_location,
    minute, second, period, shot_statsbomb_xg, pass_outcome, ...). This is the
    single integration point for a licensed live feed: implement fetch_fn to
    poll/stream the provider and normalize to this schema, register it once, and
    every OFI metric + figure works unchanged on the live match.
    """
    LIVE_ADAPTERS[name] = fetch_fn
    return sorted(LIVE_ADAPTERS)


def snapshot(events, as_of_minute, as_of_second=0):
    """Match state as it stood at a clock time: every event at or before
    (as_of_minute, as_of_second). The core live primitive -- computing any
    metric on snapshot(events, 63) answers the question 'as of minute 63'."""
    cutoff = as_of_minute * 60 + as_of_second
    t = events["minute"].astype(float) * 60 + events["second"].astype(float)
    return events[t <= cutoff].copy()


def current_score(events, as_of_minute=None):
    """Score {team: goals} at a minute (or full match if None). Counts scored
    goals from Shot events; own goals (rare) are not attributed here."""
    e = events if as_of_minute is None else snapshot(events, as_of_minute)
    g = e[(e["type"] == "Shot") & (e["shot_outcome"] == "Goal") & (e["period"] <= 4)]
    return g.groupby("team").size().to_dict()


def live_state(events, as_of_minute):
    """One-call live snapshot: minute, score, field tilt, and full per-team
    metrics computed on the game up to `as_of_minute`. Feed this straight into
    a 'why' answer for a live or in-progress match."""
    snap = snapshot(events, as_of_minute)
    return {
        "as_of_minute": as_of_minute,
        "score": current_score(snap),
        "field_tilt": field_tilt(snap),
        "team_metrics": team_metrics(snap),
    }


def live_replay(events, step_minutes=5, start=0, end=None):
    """Generator that simulates a live feed: yields (minute, live_state) at each
    step. Use it to test the incremental engine on a historical match, or to
    drive a live ticker. In production the same loop consumes a provider push
    feed instead of a file."""
    if end is None:
        end = int(events["minute"].astype(float).max()) + 1
    m = start + step_minutes
    while m <= end:
        yield m, live_state(events, m)
        m += step_minutes
