# Overnight run — report (rewritten at the end of cycle 100)

**Branch:** `feat/drive-mode` · **Phase:** Planner · **Cycle:** 101 · nothing pushed, all commits local.

> **Read `overnight-ACTION-REQUIRED.md` first** — that is the short list of things only you can decide. This file is
> the status of the loop itself.

## What shipped in cycle 100 (both owner-reported)

The owner interrupted the loop twice. Both reports were real, and both were in the same few lines of `RoadCanvas`.

| | What was wrong | Evidence |
| --- | --- | --- |
| **S129** | The shoulder guardrail hangs `0.42m` above the mainline grade and the embankment's top stopped **at** grade. Nothing painted the gap. On the mainline the painted verge sits behind it so it is invisible; from the ramp the deck is clipped (a flat surface above your eye cannot be seen) so behind the slot there is **nothing** — the canvas was literally transparent. | `alpha = 0` at y206-212 and y230-236 on a frozen frame at drop −4.18. After: **0 / 1406** transparent samples below the horizon at the deepest drop (−5.5m). |
| **S130** | The rail was drawn with a `() => true` test — full length, fixed in world space — while the ramp sweeps out past it. Every exit and entrance drove the car through a steel barrier. | Now breaks at the gore, opening derived from the ramp's own footprint. Mainline regression sweep: **0 / 1406** transparent below horizon. |

Commit `1cdd982`. Build clean, prettier run, only `RoadCanvas.jsx` touched.

## The method change that actually mattered

**Measure alpha, not colour.** Three cycles of colour-matching walked straight past a hole that a single alpha read
found immediately. On a transparent canvas layered over a DOM sky element, "is anything painted here" is the only
question that separates a gap from a dark surface.

This is also why cycle 99's full-taper geometry sweep passed while the screen was still wrong: **the defect was above
the slope being measured.** A green sweep over the wrong quantity is not evidence.

## Corrections logged against my own reporting

- I reported "3 enclosed holes remain" after the fix. **One was real; two were my own detector** counting a lamp halo
  (alpha 1-7) as opaque and therefore calling the sky either side "enclosed". The third sits *above the horizon* —
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
- **Two servers are running locally:** `:3008` started *before* the current build and serves stale code; **`:3009`
  serves the current build.** Check `:3009`.
- Owner-parked items are unchanged in `overnight-ACTION-REQUIRED.md`.
