# OFI Live — architecture & feasibility

**Can OFI answer "why is [team] struggling right now" during a live 2026 World
Cup match? Yes — the moment a licensed live feed is connected.** The metric
engine is source-agnostic; live is the same engine reading events up to the
current minute.

## What was added (v0.2)

| Piece | Function | Role |
|---|---|---|
| As-of-minute state | `snapshot(events, minute)` | the core live primitive — game state at a clock time |
| Live snapshot | `live_state(events, minute)` | one call → minute, score, field tilt, full team metrics |
| Live ticker | `live_replay(events, step_minutes=5)` | generator; simulate or consume a push feed |
| Provider hook | `register_source(name, fetch_fn)` | plug in any licensed feed, unchanged metrics |

### Proof it works
Live-replaying the 2022 Final, the same "who's in control?" question answers
correctly and differently as the game evolves:

| As of | Score | ARG field tilt | ARG xG | FRA xG |
|---|---|---|---|---|
| 30′ | 1–0 | 67.0% | — | — |
| 45′ | 2–0 | 69.7% | — | — |
| 75′ | 2–0 | 58.6% | 1.55 | 0.15 |
| 82′ | 2–2 | 59.2% | 1.55 | 1.03 |

At 75′ OFI sees total Argentine control; by 82′ it registers France's two-goal
burst — the live engine reflects state in real time.

## The honest blocker: data, not code

Full **live event data with x/y coordinates and xG** — what OFI's spatial
metrics need — is available only from **licensed** providers:

- **Hudl StatsBomb** — same schema OFI already uses; thousands of events/match, direct-integration API. Lowest-friction path (zero metric changes).
- **Opta / Stats Perform**, **Sportradar**, **Sportmonks** — full live feeds; each needs a `fetch_fn` that normalizes to StatsBomb schema.

**Free sources don't cover it:** StatsBomb *open* data is post-tournament, not
live (expect 2026 World Cup data released free *after* the event, as with 2018/
2022). Free live APIs (Sofascore, API-Football, football-data.org) give scores
and basic counts — not the coordinate event stream. As of Jan 2026 FBref no
longer updates advanced stats live (Opta licence ended).

## Wiring a live feed (the entire integration)

```python
import ofi

def hudl_statsbomb_live(match_id):
    # poll/stream the licensed API, return events in StatsBomb schema
    events = my_provider_client.get_events(match_id)   # your client
    return normalize_to_statsbomb_schema(events)

ofi.register_source("hudl_live", hudl_statsbomb_live)

# now, mid-match:
state = ofi.live_state(ofi.load_match(MATCH_ID, source="hudl_live"), as_of_minute=63)
# → feed state into a 'why' answer, unchanged
```

That `fetch_fn` is the whole job. Everything downstream — field tilt, xT,
passing networks, the figures, the response format — already works.
