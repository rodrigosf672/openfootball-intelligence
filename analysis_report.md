# OpenFootball Intelligence — Match Analysis

**Fixture:** Argentina 3–3 France (Argentina win 4–2 on penalties) · FIFA World Cup 2022 Final · 18 Dec 2022
**Data:** StatsBomb open event data (4,407 events) · **Question:** *Why was France so passive for the first 70+ minutes before their comeback?*

---

## Summary

France were passive because Argentina's connected, high-possession build-up and aggressive first-phase pressing pinned France into a disconnected block — their front line was cut off from midfield until personnel and game-state changes (two 41′ substitutions, then chasing a 2-goal deficit) finally forced France to play forward.

## Evidence

1. **France did not register a single shot in the first half** and did not attempt one until the 67th minute (Kolo Muani). Over the whole first hour Argentina held a decisive expected-goals lead (1.29–0.00 xG at half-time).
2. **Argentina dominated territory and circulation:** 54% possession, **60.5% field tilt**, 693 passes at 81% completion, and 51 progressive passes to France's 29 — Argentina repeatedly moved the ball into the final third while France chased.
3. **France's structure was fractured.** In the passing network their front players (Giroud, Dembélé, Griezmann) sit isolated from a deep midfield-defence cluster; only 27 of 162 completed first-half passes even reached the final third.
4. **Argentina pressed France's first phase harder** — first-half PPDA of 3.75 for Argentina vs 4.33 for France — so France's attempts to build were disrupted early and often turned into long, low-percentage passes (11% of first-half passes were 35+ yards).
5. **Deschamps conceded the setup had failed before half-time**, making a double substitution at **40–41′** (Giroud and Dembélé off) — an unusually early admission that France's shape was not functioning.
6. **The change was game-state, not a slow burn.** France's expected-threat output only rose around 60–70′, and the goals arrived as a burst: **two goals in 95 seconds (79′–81′)**, Mbappé's average action position jumping from x≈77 (first hour) to x≈96 once France committed bodies forward while chasing the game.

## Tactical Interpretation

France's passivity was **imposed, then situational**. For the first hour it was imposed: Argentina's ball retention and first-phase press denied France the platform to attack, and France's block was too stretched — a large gap between the front line and the Rabiot/Tchouaméni midfield — for them to combine through the middle. That is why possession that *did* reach France's forwards died in isolation rather than becoming shots.

The shift came from two levers, not from France gradually solving the puzzle. First, the 40–41′ double substitution changed the personnel (Kolo Muani and Thuram added directness and running). Second, and decisively, **falling 2–0 removed the incentive to stay compact**: once France had to chase, they pushed Mbappé higher and committed numbers forward, and the same players who had been passive produced two goals in 95 seconds. The momentum chart shows France's threat had actually been climbing from ~60′ — they were growing into the game before the goals, not converting from nothing.

## Historical Comparison

Across France's seven World Cup 2022 matches, their Final performance profile is **most similar to their semi-final win over Morocco** (cosine similarity 0.69 on nine standardized team metrics), and least like their group-stage romps against Australia and Denmark. Both the Final and the Morocco game were low-possession (39–46%), low-field-tilt (30–40%) performances built on absorbing pressure and striking in transition. In other words, **France did not play badly by their own knockout standards — they played the Final the way they had won knockout games all tournament**: reactive, territorially passive, and lethal on the break. The difference in the Final was that Argentina's chance quality was high enough that France's reactive model left them two goals down before the transition threat activated.

## Suggested Adjustments (for France, evidence-based)

- **Shorten the block vertically in the first phase.** The isolation of the front three from midfield (network gap; 27/162 passes reaching the final third) was the mechanism of passivity — pushing the midfield line up 5–10 m would have offered a passing outlet other than long balls.
- **Give Mbappé the ball higher, earlier.** His action map only advanced once France chased; deploying him against Molina from a higher starting position (rather than defending deep) would have created France's most dangerous matchup before the game-state forced it.
- **Don't wait for the deficit to trigger directness.** The Kolo Muani/Thuram profile that unlocked the comeback was available from 41′ — introducing that verticality proactively, rather than reactively at 2–0 down, is the clearest lever.

## Confidence

**High.** Every claim is computed from the complete StatsBomb event stream and cross-checked (xG totals match StatsBomb's published figures; goal timings and substitutions verified event-by-event). The one interpretive step — attributing the shift partly to game-state — is supported by the timing of the threat increase and Mbappé's positional jump, though it cannot be fully disentangled from the personnel changes.

---

## Figures

**Passing networks — Argentina's connected build-up vs France's fractured shape**
![Passing networks](figures/passing_network.png)

**Shot map — chance volume and quality**
![Shot map](figures/shot_map.png)

**Cumulative xG timeline — the advantage France converted in bursts**
![xG timeline](figures/xg_timeline.png)

**Momentum (net expected threat per 5 min)**
![Momentum](figures/momentum.png)

**Historical comparison — France's Final vs their tournament run**
![Similarity](figures/similarity.png)

---
*Generated by OpenFootball Intelligence · reproducible from StatsBomb open data · match_id 3869685*
