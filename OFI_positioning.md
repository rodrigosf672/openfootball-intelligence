# OpenFootball Intelligence (OFI)
### An open infrastructure layer for AI-native football analysis

---

## The one-line pitch

**Don't build another soccer analytics dashboard. Build the layer every soccer analytics agent sits on top of.**

Open Football Intelligence (OFI) is not a demo that answers one question about one match. It is a small, reusable, open metric-and-workflow layer that turns raw event data into tactical explanations — and any AI agent can load it and reason on top of it. The demo is the proof; the layer is the product.

---

## Why the reframe matters

The original concept — a "Live Match Intelligence Agent" — is a strong demo. But a demo answers *one* question and then it's over. Renaming and reframing it as **Open Football Intelligence** changes what it *is*:

| "Football Intelligence Studio" (a demo) | "OpenFootball Intelligence" (a layer) |
|---|---|
| One app, one match, one question | A metric library + workflow any agent can call |
| Insight lives in a notebook | Insight is a reusable, versioned, published capability |
| "Look what I built" | "Look what anyone can now build on" |
| Product thinking | **Platform thinking** |

That shift — from artifact to infrastructure — is the exact instinct a Technical Product Marketing Manager is hired to have: see past the single feature to the reusable system, and tell the story that makes the system's value obvious to a developer.

---

## What was actually built (the proof)

A working, reproducible prototype on **real StatsBomb open event data** — the 2022 World Cup Final (Argentina 3–3 France), 4,407 events:

- **A metric library** (`kernel.py`): xG aggregation, expected threat (xT), PPDA, field tilt, progressive passes/carries, final-third & Zone-14 entries, passing networks with betweenness centrality, and possession-based match similarity. Validated — computed xG matches StatsBomb's published totals to two decimals.
- **A tactical "why" analysis** answering *"Why was France passive for 70 minutes before their comeback?"* — in a fixed evidence-first response format (Summary → Evidence → Interpretation → Historical Comparison → Adjustments → Confidence).
- **Four publication-grade figures**: passing networks, shot map, xG timeline, momentum/field-tilt.
- **A historical comparison** ranking France's Final against their other six World Cup matches by cosine similarity — surfacing that the Final most resembled their Morocco semi-final (a low-possession, transition-based knockout profile).
- **A published Claude Science skill** — so the *next* question, on *any* match, is one `load_match()` call away. The workflow is captured, not re-implemented.

The last bullet is the whole point. The prototype didn't just answer a question; it left behind a reusable capability that answers the next thousand.

---

## The narrative arc for the Anaconda TPMM angle

Anaconda's story is about making data science **accessible, reproducible, and governed** — moving practitioners from wrangling environments and glue code toward the actual analysis. OFI is a compact, vivid embodiment of that same thesis in a domain everyone understands:

1. **More AI, Less Engineering.** The user asks *"why is France passive?"* in plain language. They never write pandas, never touch a coordinate transform, never fit an xT grid. The agent orchestrates reproducible Python behind the scenes and returns tactical meaning. That is the AI-native workflow Anaconda is positioning the market toward — shown, not told.

2. **Reproducibility is a feature, not an afterthought.** Every claim traces to a computed value; every figure regenerates from open data; the metric library is versioned and published. This is the governance-and-trust story Anaconda sells, made concrete.

3. **Open infrastructure beats closed demos.** Built on *open* data (StatsBomb) with an *open* metric grid (Karun Singh xT), packaged as a *reusable* skill. It composes rather than locks in — the same posture as an open, package-driven data platform.

4. **Systems thinking is the differentiator.** Anyone can prompt an LLM for a hot take on a match. The value — and the TPMM signal — is in recognizing that the durable asset is the *layer*: the metric definitions, the evidence-first workflow, the response contract. That's what turns a clever demo into a platform other people build careers on.

---

## The tagline

> **OpenFootball Intelligence — ask why, get tactical evidence.**
> An open layer for AI-native football analysis. More AI. Less engineering.

---

## How this scales beyond the demo

- **Any match, any competition.** The library is data-source-agnostic within the StatsBomb schema; `list_matches()` opens every free competition (World Cups, Euros, Champions League, La Liga, WSL, NWSL, and more).
- **Live, not just post-hoc.** The same functions run on a live event feed; the workflow already reasons about game state (score, minute, subs) so it degrades gracefully to partial data.
- **Composable with other skills.** OFI hands its figures to a figure-style layer and its claims to a narrative layer — it's a component, not a silo.
- **A template for other domains.** The pattern — *open data + a validated metric library + an evidence-first agent workflow, published as a reusable skill* — transfers directly to finance, ops, scientific analysis, or any field where "ask why, get evidence" beats "here's a dashboard."

---

*OFI is a portfolio piece demonstrating platform-level product thinking: an open, reusable infrastructure layer for AI-native analysis, proven on a real match and packaged so the next analyst starts where this one finished.*
