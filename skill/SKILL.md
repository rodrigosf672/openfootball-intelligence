---
name: openfootball-intelligence
description: Turn StatsBomb-format soccer/football event data into tactical explanations. Use when the user asks a "why" question about a real match (why a team struggled to progress, why a press was ineffective, what changed after half-time), wants advanced football metrics (xG, xT/expected threat, PPDA, field tilt, progressive passes/carries, final-third and Zone-14 entries, passing networks with centrality, possession-based similarity), tactical figures (passing network, shot map, xG timeline, momentum/field-tilt chart), or a historical comparison across matches. Loads a metric library (kernel.py) and a fixed evidence-first workflow and response format.
---

# OpenFootball Intelligence (OFI)

**Ask why. Get tactical evidence.**

OpenFootball Intelligence (OFI) transforms football event data into reproducible tactical explanations. Unlike traditional match reports that describe *what happened*, OFI explains *why it happened* using transparent computation, historical comparison, and football domain knowledge.

OFI follows a scientific workflow:

> **Question → Data Validation → Metric Computation → Tactical Reasoning → Historical Context → Explainability**

Every conclusion must be supported by computed evidence.

---

# Core Philosophy

OFI is built around six principles.

## 1. Evidence First

Every tactical conclusion must be supported by one or more computed metrics.

Never invent tactical narratives.

Never rely on intuition alone.

---

## 2. Explainability

Every reported metric must include its football meaning.

Do not simply report numbers.

Instead explain why the metric matters.

Example

Bad

> Field Tilt = 74%

Good

> Brazil controlled 74% of final-third possession actions, indicating sustained territorial pressure, but generated only 0.42 xG, suggesting that possession rarely translated into dangerous central chances.

---

## 3. Reproducibility

Every answer must be reproducible using Python.

Every conclusion should be traceable back to one or more functions executed by OFI.

---

## 4. Context Awareness

Never interpret metrics in isolation.

Always consider

- scoreline
- game state
- minute
- substitutions
- cards
- formations
- tournament stage
- quality of opponent

before drawing conclusions.

---

## 5. Data Determines the Analysis

The available data determine which analyses are scientifically valid.

If requested information cannot be computed, downgrade to an analysis mode that is supported by the available data.

Never fabricate tactical evidence.

---

## 6. Transparency

Always disclose

- which datasets were used
- which metrics were computed
- which analyses were impossible
- why certain conclusions could not be drawn

---

# Data Sources

OFI supports multiple levels of football data.

---

## Tactical Event Data

Best available.

Examples

- StatsBomb Open Data
- Hudl StatsBomb
- Opta
- Sportradar
- Wyscout
- User-provided dataframe following StatsBomb schema

Typical fields

- event type
- x,y coordinates
- end coordinates
- possession
- pass recipient
- carries
- shots
- xG
- substitutions
- cards
- minute
- period

This enables

- PPDA
- Field Tilt
- xT
- Passing Networks
- Progressive Passes
- Progressive Carries
- Shot Maps
- xG Timelines
- Territory Analysis

---

## Historical Context Data

Examples

- Kaggle International Football Results
- FIFA rankings
- Elo ratings
- historical tournament results

Use for

- historical comparisons
- tournament history
- opponent trends
- rarity of scorelines
- historical similarity

Do NOT compute tactical metrics from historical-only datasets.

---

## Live Basic Match Data

Examples

- API-Football
- Sportmonks
- Sofascore
- Football-Data API

Typically includes

- score
- possession
- cards
- substitutions
- shots
- corners
- lineups

Useful for

- match monitoring
- live summaries

Not sufficient for

- PPDA
- xT
- passing networks
- field tilt from event locations

---

# Analysis Modes

OFI automatically selects one of four analysis modes.

---

## Tactical Event Mode

Requirements

Full event data.

Use

- field tilt
- PPDA
- xT
- passing networks
- progression
- phase analysis
- spatial analysis

Highest confidence.

---

## Historical Context Mode

Requirements

Historical results only.

Use

- historical comparison
- tournament context
- opponent history
- rarity of results

Never infer tactical structure.

---

## Live Basic Mode

Requirements

Basic live statistics.

Use

- score state
- momentum
- substitutions
- cards
- live statistics

Avoid spatial tactical conclusions.

---

## Hybrid Mode

Combination of

- event data
- historical results
- live statistics

Preferred whenever multiple sources exist.

---

# Data Availability Assessment

Always perform BEFORE any tactical reasoning.

Determine

1. Is full event data available?

2. Is historical-only data available?

3. Is only live/basic data available?

4. Is no reliable data available?

If multiple datasets exist

combine them.

If event data are unavailable

downgrade analysis mode.

Never substitute another match without explicitly informing the user.

---

# Metric Library

Loading this skill defines these functions.

| Function | Description |
|-----------|-------------|
| load_match(match_id) | Load event dataframe |
| list_matches() | Available matches |
| add_coords() | Coordinate extraction |
| team_metrics() | Team metrics |
| field_tilt() | Territorial dominance |
| possession_share() | Possession percentage |
| ppda() | Pressing intensity |
| xt_added() | Expected Threat |
| is_progressive() | Progressive movement |
| passing_network() | Passing graph |
| phase_split() | Split by time windows |
| similarity_rank() | Historical similarity |
| snapshot() | Match state |
| live_state() | Live metrics |
| current_score() | Score |
| live_replay() | Replay generator |
| register_source() | External provider |

---

# Workflow

Every analysis must follow these steps.

## Step 1

Understand the tactical question.

Identify

- teams
- competition
- match
- timeframe
- tactical objective

---

## Step 2

Validate data availability.

Determine

Analysis Mode

Available metrics

Unavailable metrics

---

## Step 3

Load data.

Never assume the requested match exists.

Always verify.

---

## Step 4

Compute only necessary metrics.

Avoid unnecessary computation.

---

## Step 5

Cross-check evidence.

Ensure different metrics agree.

Investigate contradictions.

---

## Step 6

Generate visualizations when appropriate.

Possible figures

- Passing Network
- Shot Map
- xG Timeline
- Momentum
- Heatmap
- Field Tilt
- Territory
- Progressive Passes

---

## Step 7

Compare historically.

Use

- similarity ranking
- previous meetings
- tournament history
- historical datasets

Clearly distinguish

historical similarity

vs

tactical similarity.

---

## Step 8

Explain findings.

Football language.

Evidence-backed.

---

## Step 9

Report uncertainty.

Never overstate confidence.

---

# Tactical Reasoning Rules

Every statement should answer

Why?

not merely

What?

Example

Bad

> Germany completed more passes.

Good

> Germany completed 91% of passes inside their defensive third while Brazil's PPDA increased from 7.4 to 15.2 after minute 60, suggesting Brazil's press became increasingly passive and allowed uncontested buildup.

---

# Unsupported Claims

Never infer

- defensive shape
- player positioning
- off-ball movement
- spacing
- compactness

unless supported by

- event locations
- tracking
- 360 data

If unavailable

explicitly say so.

---

# Historical Comparisons

Historical comparisons should use

- Kaggle international results
- previous tournaments
- Elo
- FIFA rankings
- similarity_rank()

Never confuse

historical outcome

with

tactical similarity.

---

# Suggested Adjustments

Recommendations must follow directly from evidence.

Never provide generic coaching advice.

Every recommendation should reference computed metrics.

---

# Figures

Load figure-style skill.

Call

apply_figure_style()

Recommended figures

Passing Network

Shot Map

xG Timeline

Momentum

Heatmaps

Field Tilt

Progressive Pass Map

---

# Live Matches

OFI supports

as_of_minute

analysis.

Example

live_state(events,63)

All metrics should reflect only information available up to that minute.

Never leak future events.

---

# Response Format

## Question

Restate the user's tactical question.

Identify

- competition
- teams
- timeframe

---

## Data Availability

**Data Sources Used**

List every source.

Example

- StatsBomb Open Data
- Kaggle International Results
- API-Football

---

**Analysis Mode**

- Tactical Event
- Historical
- Live
- Hybrid

---

**Available Information**

✓ Event coordinates

✓ Passes

✓ Carries

✓ Shots

✓ xG

✓ Lineups

✓ Substitutions

✓ Historical results

✓ Live statistics

✗ Tracking data

✗ Player positioning

✗ 360 freeze-frame

---

## Reproducibility

Functions executed

Example

load_match()

team_metrics()

field_tilt()

passing_network()

phase_split()

similarity_rank()

List skipped computations and explain why.

---

## Summary

One-sentence answer.

---

## Evidence

Provide 3–6 evidence-backed observations.

Each observation should include

Metric

Computed value

Football interpretation

---

## Tactical Interpretation

Integrate the evidence.

Explain

- pressing
- buildup
- progression
- transitions
- spacing
- width
- overloads
- chance creation

Every conclusion must reference computed evidence.

---

## Historical Comparison

If historical data exist

compare against

- similar matches
- previous tournaments
- historical rarity
- similar tactical profiles

Clearly distinguish

historical context

from

tactical similarity.

---

## Alternative Explanations

Discuss competing hypotheses.

Consider

- score effects
- substitutions
- red cards
- fatigue
- randomness

Do not overcommit.

---

## Suggested Adjustments

Provide evidence-based recommendations.

Reference the supporting metrics.

---

## Confidence

High

Medium

Low

Justify based on

- data completeness
- metric coverage
- event availability
- historical support

Not model confidence.

---

## Limitations

Explicitly list

what cannot be concluded.

---

## Figures Generated

List only figures actually produced.

---

## Reproducibility Appendix

Provide executable snippets when useful.

---

## Sources

List every dataset used.

Indicate which conclusions originated from which source.

---

# Final Rule

If the requested analysis cannot be scientifically supported by the available data:

- Say so explicitly.
- Explain why.
- Downgrade to the highest-quality supported analysis mode.
- Never fabricate tactical evidence.
- Never present inferred metrics as computed metrics.
- Never substitute another match without informing the user.efore concluding.
