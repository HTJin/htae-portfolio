# Overnight run — report (rewritten at the end of cycle 118)

**Branch:** `feat/drive-mode` · **Cycle:** 119 · nothing pushed, all commits local.

## Current state: all three scene invariants pass

Re-measured on the current build rather than carried forward, because the cut wall was removed, planting reordered
and two probe flags added since the last route-wide check.

| invariant | result |
| --- | --- |
| **I1 void** — the road is never see-through | 8 samples, two legs, mainline → −5.3m: **0 holes / 1813 every time**, sky control 91–100% |
| **I2 gore** — the barrier opens where the ramp crosses | 28,222px before → **0 through 2.3–4.1m** → 42,678px after |
| **I3 planting** — grass on the bank, nowhere else | mainline **0/0** (correctly bare), parked stop **16 left / 0 right** |

I3's shape *is* the model: one face, on the left. The right-hand zero is the trench being gone; the mainline zero is
a real negative control.

## Since cycle 111

| | | |
| --- | --- | --- |
| Trench removed — the only wall is the highway's own | The owner: "you're only supposed to have that for the highway." Verified the removal did not re-open the void. | `9298a98` |
| Planting on the bank; road no longer buries the grass | `vegetation` ran before the side polygon, which covers exactly the inboard bank. 0 flower px left → 12. | `2c2e16f` |
| `?probe=barrier` | The gore invariant becomes a URL instead of an edit-rebuild-revert cycle. | `ef0f01b` |
| `?probe=grass` | Fixes the planting check's *reliability*, not its magnitude — and says so. | `b618819` |

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

- **NH-9** — `CarInterior.jsx`, `world.js`, `DriveScene.jsx` carry uncommitted third-party edits.
- **NH-10** — windscreen aperture (~86% of viewport width). Widening trades against cockpit realism.
- **NH-11** — cluster/wheel ratio drifts 0.281 → 0.227; making it constant changes desktop proportions.
- **S137** — two variable fonts are **62% of a 572.6KB cold page**. The only real weight win, out of this run's scope.
- **No automated guard.** The probe is a console tool a human runs, not a test that fails a build.

## Since cycle 106

| | | |
| --- | --- | --- |
| **Gore opening restored** | It had regressed — the barrier was back to a solid wall across the ramp's path, and **this loop committed that regression itself**. Verified with the magenta technique: 45,587px before the crossing → **0 through it** → 48,220px after. | `38d3b6a` |
| **Descent made legible** | Narrowed the ramp's ground, added a wall climbing back to grade. | `ce94c3f` |
| **…then reverted** | It worked by putting the exit in a **trench**, with a wall right of the ramp. The owner: "you're only supposed to have that for the highway." | `9298a98` |
| **Planting on the cut's faces; road no longer buries the grass** | `vegetation` ran *before* the side polygon, which at a 5.5m drop covers exactly the inboard bank. 0 flower px left of camera → 12. | `2c2e16f` |
| **Scene probe** | The check that would have caught both silent regressions. | `cd96dd3` |

## The model, stated at last — and it is the thing that kept going wrong

**There is exactly one face in this scene: the highway's own embankment, on your left as you descend.** The ramp
descends to natural ground level; the ground right of it is open. Every fix that went wrong here went wrong by
inventing a second face.

The trench is the sharpest example: it passed **both** criteria I had written for it — void closed, slope visible —
because neither asked _"is this still a highway?"_. A check can only catch what it thinks to ask.

## S136 — the descent reads, and it was fixed by work aimed elsewhere

Measured on the current build. Topmost opaque pixel (the highway's silhouette) as a fraction of frame height:

| drop | x=0.15 | x=0.25 | x=0.35 |
| --- | --- | --- | --- |
| 0 | 0.434 | 0.434 | 0.434 |
| −1.91 | 0.350 | 0.377 | 0.402 |
| −3.84 | 0.293 | 0.334 | 0.375 |
| −4.84 | **0.278** | 0.323 | 0.368 |

Monotonic at all three columns — the highway rises **15.6% of frame height** beside you. Drop 0 reading an identical
0.434 at all three columns is the built-in flat control. The batter, the three-material top and the depth sort gave
the highway a *body*, and a body is what rises beside you. Whether it now **feels** right is perceptual and is left
with the owner.

## Still open

- **Flank is thin through the first half of a descent** (owner-reported).
- **NH-9** — `CarInterior.jsx`, `world.js`, `DriveScene.jsx` carry uncommitted third-party edits.
- **NH-10** — windscreen aperture (~86% of viewport width); widening it trades against cockpit realism. Your call.
- **No automated guard.** `overnight-scene-probe.md` is a console probe a human must run, not a test that fails a
  build. The two regressions this run both slipped through the same hole.

## The headline: a fix of mine regressed silently and nothing caught it

The gore opening — the break in the shoulder barrier where the ramp crosses it — shipped in `1cdd982`, then
**disappeared** when the continuous side polygon landed. The barrier reverted to `rail(0, SEGMENTS, …)`: a solid wall
at a fixed 10.9m running the whole length of the road, while the ramp sweeps from 6m out to 36m straight across it.
**This loop committed that regression itself, in `74331f6` and `403f7f4`.** It surfaced only because the owner kept
reporting it. Restored and re-gated (barrier, deck fascia and lit cap) in `38d3b6a`.

**Every visual fix in this run carries the same exposure.** There is no check that would catch the next one. That gap
is the single most valuable thing left on the list.

## What shipped since cycle 100

| | | |
| --- | --- | --- |
| **S131** | Gore markings — the wedge between mainline and ramp was bare verge | `b137505` |
| **S133** | Depth-sort the three surfaces at different heights, so near ground buries the distant cut | `403f7f4` |
| **S129/S130** | Transparent seam under the guardrail; rail crossing the ramp | `1cdd982` |
| — | Highway given a top (barrier / deck fascia / earth) so it stops reading as a soffit | `ff3586c` |
| — | Side face battered instead of vertical | `7a666e9` |
| — | Gore opening restored after regression | `38d3b6a` |

## Measurement lessons this run paid for, in blood

1. **A number without a control is not a measurement.** S133 measured 84.6ms/frame and looked like a flat guardrail
   violation; I began reverting. The baseline — stashed, rebuilt, same harness — was **83.7ms**. The change costs
   ~1%; the 12fps was the instrument. I nearly threw away the right fix.
2. **Don't measure a property the background also has.** Counting "bright pixels near the shoulder" to find the
   barrier also counted the ramp's edge lines, which *grow* as the ramp separates — it would have reported the
   barrier present while it was absent. The **magenta technique** (repaint the one thing in a colour no palette
   contains) settled it in a single run, with the control inherent.
3. **Alpha, not colour.** Three cycles of colour-matching walked past a hole one alpha read found instantly.
4. **Sample the transition, not the endpoints.** Stills at rest are the wrong instrument for a 60fps scene; frame
   strips keyed on `drop` showed in one image what a dozen parked screenshots missed.
5. **A server responding is not a server serving your code.** Three stale servers faked results tonight; every
   measurement now checks source → build → server timestamps first.

## Open, owner-reported, not fixed

- **S135 — the descent is invisible.** Geometry is sound (110m for 5.5m = **5.0% grade**); the rendering is not: a
  52m swath of ground follows the ramp *down*, so nothing holds grade to measure the drop against. Filed with its
  trap — narrowing that band needs a cut wall outside the ramp **in the same change**, or the right-hand void
  returns.
- **The flank is thin through the first half of a descent**, and the scene is **clipped at the frame edge** before
  the road's side is fully in view.
- **NH-9:** three drive files still carry uncommitted third-party edits. `RoadCanvas.jsx` was committed because it
  became inseparable from the fixes; `CarInterior.jsx`, `world.js` and `DriveScene.jsx` are untouched.

## Cycle 101 — the cycle-100 fix holds across the whole route

No source change; this cycle existed to stop a fix from being trusted on the strength of one sample. S129/S130 had
been verified at **one ramp of one exit** — the same narrow re-checking that let `bankFoot` stay broken for four
cycles.

**13 alpha sweeps** across exits 0→3, both the acceleration and deceleration ramp, at drops of 0, −1.9, −2.7, −3.0,
−4.5, −4.9 and −5.5, plus open mainline: **0 transparent samples below the horizon in every one** (1406 samples each).

**The instrument was proven in the same run** — the identical grid moved _above_ the horizon returns **784 / 962
(81.5%)** transparent. Without that, "0 holes" and "the probe is broken" are the same reading, and this run has
produced the second more than once.

Two things went wrong and were handled rather than reported as passes: a leg that measured nothing (`reachedSamples:
0`, `driveToNext` called while already en route) was discarded and the sequencing fixed; and the stronger control —
sweeping the pre-fix `:3008` build — could not be run at all, because the fiber walk returns null on that older
bundle. That is logged as a limitation, not quietly swapped for the weaker control.

> **Read `overnight-ACTION-REQUIRED.md` first** — that is the short list of things only you can decide. This file is
> the status of the loop itself.

## What shipped in cycle 100 (both owner-reported)

The owner interrupted the loop twice. Both reports were real, and both were in the same few lines of `RoadCanvas`.

|          | What was wrong                                                                                                                                                                                                                                                                                                                                                              | Evidence                                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S129** | The shoulder guardrail hangs `0.42m` above the mainline grade and the embankment's top stopped **at** grade. Nothing painted the gap. On the mainline the painted verge sits behind it so it is invisible; from the ramp the deck is clipped (a flat surface above your eye cannot be seen) so behind the slot there is **nothing** — the canvas was literally transparent. | `alpha = 0` at y206-212 and y230-236 on a frozen frame at drop −4.18. After: **0 / 1406** transparent samples below the horizon at the deepest drop (−5.5m). |
| **S130** | The rail was drawn with a `() => true` test — full length, fixed in world space — while the ramp sweeps out past it. Every exit and entrance drove the car through a steel barrier.                                                                                                                                                                                         | Now breaks at the gore, opening derived from the ramp's own footprint. Mainline regression sweep: **0 / 1406** transparent below horizon.                    |

Commit `1cdd982`. Build clean, prettier run, only `RoadCanvas.jsx` touched.

## The method change that actually mattered

**Measure alpha, not colour.** Three cycles of colour-matching walked straight past a hole that a single alpha read
found immediately. On a transparent canvas layered over a DOM sky element, "is anything painted here" is the only
question that separates a gap from a dark surface.

This is also why cycle 99's full-taper geometry sweep passed while the screen was still wrong: **the defect was above
the slope being measured.** A green sweep over the wrong quantity is not evidence.

## Corrections logged against my own reporting

- I reported "3 enclosed holes remain" after the fix. **One was real; two were my own detector** counting a lamp halo
  (alpha 1-7) as opaque and therefore calling the sky either side "enclosed". The third sits _above the horizon_ —
  between the bank's silhouette and the horizon line — which is what you correctly see from inside a cut.
- A `git add -A` swept **53MB** of `.next-dev` webpack cache into a commit. Reset before it went anywhere; the
  directory is now in `.gitignore`.
- Cycle 99's fix to `bankFoot` was, per review, **a regression on all three counts** against what it replaced. The
  real fault was upstream (the ramp descended before diverging) and is fixed in `route.dropProgress`.

## Standing lessons this run has paid for

1. **Verify the whole domain, not the neighbourhood of the last bug.** `bankFoot` was wrong four times; each fix was
   checked only where the previous bug lived.
2. **Check what your reference actually is.** A "sky reference" that returns near-black is the windshield mask, and
   every comparison against it is void.
3. **Always run a control that must come out different.** Both sweeps above carry a ground = 255 reference.
4. **Four fixes to one line means the line was never the fault.**

## Where the loop is

- **Phase:** Planner, **Cycle:** 101. Backlog holds actionable items — S96 (pedals never exercised on real touch),
  S112 / S113 (measurements), S107 (cluster/wheel proportions, needs its own cycle).
- **Two servers are running locally:** `:3008` started _before_ the current build and serves stale code; **`:3009`
  serves the current build.** Check `:3009`.
- Owner-parked items are unchanged in `overnight-ACTION-REQUIRED.md`.
