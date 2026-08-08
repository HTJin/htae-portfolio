# Overnight run — report (rewritten at the end of cycle 129)

**Branch:** `feat/drive-mode` · **Cycle:** 130 · nothing pushed, all commits local.

> ## ⚠ The loop has run out of work it is allowed to do — this needs your direction
>
> Every remaining item is one of:
>
> |                                 |                                                                                                                                                                              |
> | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **Your decision**               | NH-9 (uncommitted third-party edits, **two** files), NH-10 (windscreen aperture), NH-11 (cluster/wheel ratio), S107 (wheel over brake pedal — explicitly gated on your "go") |
> | **Out of the run's scope**      | S137 — two fonts are **62% of a 572.6KB cold page**, the only real weight win left                                                                                           |
> | **Filed, justified, not built** | S142 (both dash toggles are 29×31px)                                                                                                                                         |
>
> **Read `overnight-ACTION-REQUIRED.md`** — it is now re-verified end to end rather than re-stamped, and it is where
> the decisions live.
>
> ### What changed in cycles 122–129
>
> - **S141 shipped** — an in-page "reduce motion" control. It defaults to your OS setting, so nothing changed for
>   anyone who does not press it. I had filed rather than built it, citing the trench and the buried planting;
>   **that comparison did not survive scrutiny** — those changed existing geometry you had opinions about, this is
>   additive. Four cycles of "nothing shipped" were the cost of applying a caution to a case it did not fit.
> - **S140 retired on measurement** rather than built: the `1/4 MILE` ladder would apply for **17.7m of a 420m
>   approach — 0.44s at speed**. The real defect behind it was a stale comment, already fixed.
> - **The action page was 42 cycles stale and is now re-verified line by line.** §1, §2 and §3 reproduce **exactly**;
>   §5 was **wrong by ~50%** and is corrected; §4 lost two of its three "unmeasurable" items; §7 was added for five
>   items the page had never mentioned.
> - **Lint clean** across ~15 source edits; the one warning is pre-existing and out of scope.

## Current state: all three scene invariants pass

Re-measured on the current build rather than carried forward, because the cut wall was removed, planting reordered
and two probe flags added since the last route-wide check.

| invariant                                              | result                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **I1 void** — the road is never see-through            | 8 samples, two legs, mainline → −5.3m: **0 holes / 1813 every time**, sky control 91–100% |
| **I2 gore** — the barrier opens where the ramp crosses | 28,222px before → **0 through 2.3–4.1m** → 42,678px after                                 |
| **I3 planting** — grass on the bank, nowhere else      | mainline **0/0** (correctly bare), parked stop **16 left / 0 right**                      |

I3's shape _is_ the model: one face, on the left. The right-hand zero is the trench being gone; the mainline zero is
a real negative control.

## Since cycle 111

|                                                       |                                                                                                                |           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------- |
| Trench removed — the only wall is the highway's own   | The owner: "you're only supposed to have that for the highway." Verified the removal did not re-open the void. | `9298a98` |
| Planting on the bank; road no longer buries the grass | `vegetation` ran before the side polygon, which covers exactly the inboard bank. 0 flower px left → 12.        | `2c2e16f` |
| `?probe=barrier`                                      | The gore invariant becomes a URL instead of an edit-rebuild-revert cycle.                                      | `ef0f01b` |
| `?probe=grass`                                        | Fixes the planting check's _reliability_, not its magnitude — and says so.                                     | `b618819` |

## What measurement cost this run, and what it bought

Roughly half of tonight's wrong turns were **the instrument, not the code**. Each is now written into
`overnight-scene-probe.md`:

- a frame-rate reading with no baseline (84.6ms looked like a violation; the baseline was 83.7ms) — nearly reverted a correct change
- a **detected** horizon that moved when the scene changed (317 → 294) — nearly condemned another
- matching a **source** colour through `alpha 0.85` — three probes found nothing while the thing was on screen
- a timing harness that measured **its own latency** (41.3s, of which 17.4s was my own sleep)
- a console reader that only starts capturing **when first called** — its first empty result was a false all-clear
- a sampling **stride of 2** against 1px strokes — read as "the feature failed"
- MILE 0, itself a stop at −5.5m, recorded as a **traversal**

The rule that survived all of them: **every invariant carries a control that must come out different.**

## The model, which is what actually kept going wrong

**There is exactly one face in this scene: the highway's own embankment, on your left as you descend.** Every fix
that went wrong invented a second one. The trench is the clearest case — it passed **both** criteria I had written
for it, because neither asked _"is this still a highway?"_.

## Still open — all yours

- **NH-9** — `CarInterior.jsx` and `world.js` carry uncommitted third-party edits. **Two files, not three:**
  `DriveScene.jsx` was committed with S141.
- **NH-10** — windscreen aperture (~86% of viewport width). Widening trades against cockpit realism.
- **NH-11** — cluster/wheel ratio drifts 0.281 → 0.227; making it constant changes desktop proportions.
- **S137** — two variable fonts are **62% of a 572.6KB cold page**. The only real weight win, out of this run's scope.
- **No automated guard.** The probe is a console tool a human runs, not a test that fails a build.

---

## Where the older detail went

This file had grown to **19 sections and 242 lines**, because successive "rewrites" _prepended_ a new status block
without removing the one it superseded — so it carried **two** "Still open" sections, **two** "The model" sections
and **two** "Since cycle" sections, and the same stale fact (NH-9 as three files) appeared twice.

Those strata are cut, not lost. Every measurement in them is in `overnight-journal-2026-08-05.md` and
`overnight-log-2026-08-05.md`, which are append-only by design and are the right home for history. This file is a
**status** page and is only useful if the top of it is the truth.

Highlights that were in the cut strata, if you want to find them:

- the cycle-100 gore regression and its magenta verification — journal, cycle 105
- S136's descent-legibility crest table (0.434 → 0.278 of frame height) — journal, cycle 111
- the full list of measurement failures and what each nearly cost — kept above, and in `overnight-scene-probe.md`
