# OpenFootball Intelligence — Example Exchanges

The main `analysis_report.md` works one question in full depth. This file shows
the **range**: the same OFI workflow applied to different matches, eras, and
tactical questions. Every number is computed from StatsBomb open event data;
each answer follows the OFI response format.

---

## Exchange 1 — "Why couldn't Spain break down Morocco?"
**Morocco 0–0 Spain** (Morocco win 3–0 on pens) · FIFA World Cup 2022, Round of 16 · `match_id 3869220`

### Summary
Spain monopolized the ball but never turned territory into quality: they generated a tournament-caliber **74.6% possession and 101 final-third entries yet only 0.50 xG**, because Morocco's compact low block conceded the ball and the wide areas while sealing the penalty box and central lanes.

### Evidence
1. **Possession without penetration.** Spain played 1,068 passes at 89.9% completion to Morocco's 365 — but manufactured just **0.50 xG from 12 shots**. Morocco, with a quarter of the ball, matched them (0.57 xG).
2. **Territory was total, threat was not.** Spain's field tilt was **84.8%** and rose to 88.4% in the second half, yet their second-half xG was **0.06** — possession pinned Morocco in but produced nothing.
3. **The block funneled Spain wide.** Spain reached the final third 101 times but entered Zone 14 (the central pocket at the top of the box) only 48 times and resorted to **21 crosses** — the signature of a team forced away from the middle.
4. **Morocco's low block, by design.** Morocco's PPDA was **7.9** (they barely pressed, sitting off), while Spain's was 2.3 — a textbook mid/low-block-vs-possession contrast.

### Tactical Interpretation
This is the possession-dominance trap. Spain's field tilt of 85% looks like control, but Morocco were happy to concede it: they defended a deep, narrow two-bank block that protected Zone 14 and the box, and let Spain circulate harmlessly in front. Spain's passing was safe and lateral — high completion, low progression into dangerous zones — so the volume of final-third entries never became central chances. The 21 crosses are the tell: denied the middle, Spain went around the outside, which is exactly what a compact block wants to force.

### Historical Comparison
This is the same profile Morocco used to eliminate Spain, Portugal, and to trouble France all tournament — and it mirrors the "low-possession, low-field-tilt, transition-based" template that OFI's similarity search flagged in the Final analysis. Morocco were the tournament's clearest example of *out-of-possession* game control.

### Suggested Adjustments (for Spain)
- **Attack Zone 14, not the byline.** With only 48 central entries against 101 final-third entries, Spain needed a between-the-lines receiver to turn and play forward, not more wide circulation.
- **Add a runner beyond the last line.** A static block is beaten by depth; Spain's possession lacked penetrative runs to stretch the two banks vertically.
- **Provoke the block.** Morocco's 7.9 PPDA means they weren't pressing — Spain could have carried the ball into the block to commit defenders and open the gaps their passing couldn't.

### Confidence
**High.** The possession/xG/field-tilt divergence is unambiguous and computed from the full event stream. (Match went to extra time and penalties; open-play metrics tell the tactical story cleanly.)

---

## Exchange 2 — "How did Barcelona dominate at the Bernabéu?"
**Real Madrid 0–4 Barcelona** · La Liga 2015/16 · `match_id 266424`

### Summary
Barcelona won not through possession alone but through **ruthless chance quality and second-half control** — they out-shot and out-xG'd Madrid across the game (2.48 to 1.34 xG) and turned a 2–0 half-time lead into a rout by tilting the second half in their favor while Madrid's higher shot volume stayed low-value.

### Evidence
1. **Efficiency over the whole game.** Barcelona: 18 shots, **2.48 xG, 4 goals**. Real Madrid: 13 shots, 1.34 xG, 0 goals — Madrid shot often but from poor positions.
2. **A first half that set the tone.** Barcelona took a 2–0 lead from **0.73 first-half xG on 6 shots** (Suárez 10′, Neymar 38′), while Madrid managed a single shot worth 0.04 xG.
3. **Second-half control, not a backs-to-the-wall lead.** Barcelona's field tilt *rose* to **54%** after the break and they added 1.75 xG — Iniesta (52′) and Suárez again (73′) — rather than retreating.
4. **Barcelona's press stayed aggressive.** Even leading, their first-half PPDA was 3.4 — they pressed Madrid's build-up rather than dropping off.

### Tactical Interpretation
The scoreline flatters the margin, but the underlying numbers justify it. Madrid actually generated respectable second-half volume (12 shots, 1.30 xG) — this was not a team that stopped trying — but their chances were low-percentage while Barcelona's were high-value. The decisive tactical feature is that Barcelona did not sit on a 2–0 half-time lead: their field tilt increased and they kept pressing (Suárez's 73′ goal, worth 0.42 xG, was their best chance of the game). Winning the second half *while already ahead* is what converts a lead into a statement.

### Historical Comparison
This is peak MSN-era Barcelona: high possession (58%), high completion (88%), aggressive counter-press. Contrast it with the possession-without-penetration Spain–Morocco game above — same high possession, opposite outcome, because Barcelona's territory produced central, high-xG chances rather than crosses.

### Suggested Adjustments (for Real Madrid)
- **Improve shot selection.** 13 shots for 1.34 xG (≈0.10 per shot) means too many efforts from distance or tight angles — work the ball closer before shooting.
- **Protect the first phase.** Conceding two first-half goals off Barcelona's press (PPDA 3.4) put Madrid in a chase they couldn't win; a more secure build-up would have kept the game level.

### Confidence
**High.** xG, shot counts, and phase splits all point the same way and match the 0–4 result.

---

## Exchange 3 — "Why did Argentina nearly throw away control?"
**Netherlands 2–2 Argentina** (Argentina win 4–3 on pens) · FIFA World Cup 2022, Quarter-final · `match_id 3869321`

### Summary
Argentina dominated chance quality for 80 minutes (1.94 xG to 0.57) but invited pressure by **ceding territory after taking a 2–0 lead** — their second-half field tilt collapsed to 36% — which, combined with Wout Weghorst's aerial threat off the bench, let the Netherlands manufacture two late goals from low-xG situations.

### Evidence
1. **Argentina controlled the chances, not the ball.** Possession was even (50/50), but Argentina made **1.94 xG from 14 shots** to the Netherlands' 0.57 from 7 — including Molina's 34′ opener and Messi's 72′ penalty.
2. **The lead changed Argentina's posture.** Argentina's field tilt fell from **61% in the first half to 36% in the second** — they dropped deep to protect the 2–0 rather than keep pinning the Dutch.
3. **The Netherlands' goals were cheap, and that's the point.** Weghorst (on at 77′) scored twice — from chances worth **0.05 and 0.22 xG**. Low-quality chances beat a deep block only when the block invites enough of them.
4. **Territory flipped.** The Netherlands' second-half field tilt rose to **63.6%** — the mirror image of Argentina's retreat — turning the closing minutes into sustained Dutch pressure.

### Tactical Interpretation
Argentina were comfortably the better side on chance quality, but game-management, not chance-creation, nearly cost them. Going 2–0 up, they surrendered territory and let the Netherlands push a big target man (Weghorst) into a deeper, more passive Argentine block. Against that, chance *quality* stops mattering as much: enough crosses and set pieces into the box will eventually yield a 0.05-xG goal. Argentina's retreat converted a controlled win into a coin-flip — the same "protecting a lead invites the comeback" dynamic that the World Cup Final analysis shows from the other side.

### Historical Comparison
Structurally this rhymes with France's Final comeback: a dominant side eases off with a two-goal lead, the trailing team throws on a physical presence and commits numbers, and low-xG chances flow from the pressure. In both, the swing was game-state-driven, not a collapse in underlying quality.

### Suggested Adjustments (for Argentina)
- **Don't cede the halfway line with a 2–0 lead.** The field-tilt collapse (61%→36%) is the mechanism — keeping possession higher up would have denied the Netherlands their launch pad.
- **Defend the box, not just the space.** Against a target man, the danger was aerial; matching up on Weghorst and defending the first contact mattered more than dropping deep.

### Confidence
**High.** The xG gap, the field-tilt reversal, and the timing/quality of the Dutch goals are all computed and consistent.

---

*All three analyses generated with the OFI library (`ofi.py` / the `openfootball-intelligence` skill): `load_match()` → `team_metrics()` → `phase_split()`. Reproducible from StatsBomb open data.*
