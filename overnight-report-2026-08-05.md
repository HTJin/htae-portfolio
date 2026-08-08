# Overnight run — report (rewritten at the end of cycle 106)

**Branch:** `feat/drive-mode` · **Cycle:** 106 · nothing pushed, all commits local.

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
