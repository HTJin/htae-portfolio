# Overnight report — rolling summary

**Run:** started 2026-08-05, still running. **Last refreshed:** end of cycle 58 (2026-08-06).
**Branch:** `feat/drive-mode`. Nothing has been pushed, merged or deployed — the guardrails forbid all three.

This file is rewritten every cycle. The full history lives in `overnight-tasks-2026-08-05.md` (source of truth),
`overnight-journal-2026-08-05.md` (one line per task), `overnight-log-2026-08-05.md` and
`overnight-suggestions-2026-08-05.md` (every idea, with a checkbox for you).

---

## Where the run is

58 cycles. Cycles 1–56 were self-directed: the loop generated its own ideas by auditing the live site and comparing
against comparable sites, then built and verified them. **Cycles 57 and 58 were owner-directed** — you gave
instructions mid-run, and those outrank anything the loop picks for itself.

## Shipped in the last two cycles (all owner-directed)

| | What | Commit |
|---|---|---|
| 57 | Every stop is a real interchange, on a divided highway — median barrier and an empty opposing carriageway replace the dashed centre line; deceleration ramp in, acceleration ramp out | `a511ce0` |
| 58 | The driver sits on the left — the dash stopped being symmetric and the wheel moved off the screen centre line | `f1c5b4f` |
| 58 | Pedals right of the wheel, pinned out of the flow so the console keeps its position; console capped so it stops stretching toward the passenger door | `6d2e3aa`, `5ee5782` |
| 58 | Two lanes each way, and an exit that leaves the highway properly — 14m clear, 136m long, and descending | `694c4f6` |
| 58 | Continuous prose stopped being set in newspaper columns | `4195b71` |

**One reported problem was not a defect.** The "gap spilling out the road on the right side of the UI" was a 1440px
measurement iframe I had overlaid on the live 1920px page — the page showing through beside my own harness. Removed
it, reloaded, re-measured: full-width dash, no horizontal scroll. Nothing was changed, because nothing was wrong.

## Two things worth your attention

**A decision of mine was overridden, and I amended the guardrail rather than quietly breaking it.** Cycle 18 centred
the steering wheel on `innerWidth / 2`, on the reasoning that the camera is the driver's eye looking straight down
the road, so whatever is in front of the driver lands in the middle of the image. That is sound geometry and it still
is — but it renders a car with the driver sitting in the middle of it. Guardrail 50 now records the new target (wheel
**left** of centre) and keeps the original text for the record.

**The exit ramp's descent is capped, and the cap is a renderer limit rather than taste.** `RAMP_DROP` is
`CAM_HEIGHT * 0.85`. The road is painted as flat ribbons with no depth buffer and no embankment faces; a point's
screen height is `CAM_HEIGHT + drop − hillAt(s)`, so the moment `drop` exceeds eye height that goes negative for
*every* position and the entire mainline lifts above the horizon and paints as a wedge across the sky. Measured at a
first attempt of 6.5m: the highway hung over the windscreen and the sky vanished behind it. **A deeper descent is a
real feature, not a constant to nudge** — it needs an embankment face between the two grades and clipping of the
mainline where it passes above the eye. Filed as **S102**.

## Parked — needs you

- ⭐ **Two dead links on Solar Power Indy (EXIT 11).** `gosolarindy.energy` is NXDOMAIN and
  `github.com/HTJin/solar-questions` is a 404, while every other `HTJin` repo returns 200. Both live in
  `src/lib/projects.js`, which the guardrails make read-only, and only you know whether the domain lapsed, the repo
  went private, or there is a new address. The loop will not guess a replacement URL or delete the project.
- ⭐ **The classic site still crops project photos and never cycles them.** Fixed in drive mode back in cycle 1; the
  main portfolio page still has both faults. `src/components/Projects.jsx` is outside this run's write scope, and the
  working tree already carries uncommitted edits of yours in that area. The exact patch is written out in the task
  file.
- **`/drive` ships two canonical tags**, the first pointing at the homepage, so crawlers are told `/drive` *is* the
  homepage. The fix is in `_app.jsx`, outside the write scope. **`/drive` is also missing from the sitemap**, which is
  half the site's indexable routes.

## Backlog the loop can still work on

S102 (embankment geometry, above), S95 (nothing answers `forced-colors: active` — measure before fixing), S97 (the
pedals are pointer-driven but have only ever been exercised with a mouse, never real touch events), S15/S17
(structured data for `/drive`, blocked behind the canonical fix above).

## Health

`npm run build` and `npm run lint` clean. No page console errors and no hydration warnings — the only console output
is from a wallet extension. No horizontal scroll at any width tested, from 360px to 1920px.

**Housekeeping note:** this session opened with **six orphaned `next dev` servers** (ports 3111–3116) plus a stale
`next start`, all left from the previous session and all sharing `.next`, which was serving `/drive` as a flat 500.
They were killed and `.next` rebuilt clean. If `/drive` ever looks broken, check for orphaned servers before
suspecting the code.
