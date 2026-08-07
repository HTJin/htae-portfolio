# Overnight report — rolling summary

**Run:** started 2026-08-05, still running. **Last refreshed:** end of cycle 62 (2026-08-06).
**Branch:** `feat/drive-mode`. Nothing has been pushed, merged or deployed — the guardrails forbid all three.

This file is rewritten every cycle. The full history lives in `overnight-tasks-2026-08-05.md` (source of truth),
`overnight-journal-2026-08-05.md` (one line per task), `overnight-log-2026-08-05.md` and
`overnight-suggestions-2026-08-05.md` (every idea, with a checkbox for you).

---

## Where the run is

62 cycles. Cycles 1–56 were self-directed: the loop generated its own ideas by auditing the live site and comparing
against comparable sites, then built and verified them. **Cycles 57, 58, 59 and 61 were owner-directed** — you gave
instructions mid-run, and those outrank anything the loop picks for itself. Cycle 60 came off the loop's own backlog.

## Shipped since cycle 57

| | What | Commit |
|---|---|---|
| 57 | Every stop is a real interchange, on a divided highway — median barrier and an empty opposing carriageway replace the dashed centre line; deceleration ramp in, acceleration ramp out | `a511ce0` |
| 58 | The driver sits on the left — the dash stopped being symmetric and the wheel moved off the screen centre line | `f1c5b4f` |
| 58 | Pedals right of the wheel, pinned out of the flow so the console keeps its position; console capped so it stops stretching toward the passenger door | `6d2e3aa`, `5ee5782` |
| 58 | Two lanes each way, and an exit that leaves the highway properly — 14m clear, 136m long, and descending | `694c4f6` |
| 58 | Continuous prose stopped being set in newspaper columns | `4195b71` |

| 59 | The exit ramp's descent is no longer capped by the renderer — flat surfaces clip at the eyeline, an embankment fills the gap, and the hill went 1.15m → 3m | `8264530` |
| 60 | The pedals, driven with touch for the first time: a disabled pedal no longer moves the sim, and pointer capture can no longer swallow a press | `ae31e76` |
| 61 | The centre display was a 6.2:1 letterbox; it is now 16:9 like a real one. The exit panel narrowed from 76rem/3 columns to 60rem/2 | `664def6` |

| 62 | *Audit only — nothing shipped.* The rest of the cockpit's proportions checked; two suspected defects disproved, one real one measured and filed rather than rushed | — |

**One reported problem was not a defect.** The "gap spilling out the road on the right side of the UI" was a 1440px
measurement iframe I had overlaid on the live 1920px page — the page showing through beside my own harness. Removed
it, reloaded, re-measured: full-width dash, no horizontal scroll. Nothing was changed, because nothing was wrong.

## Two things worth your attention

**A decision of mine was overridden, and I amended the guardrail rather than quietly breaking it.** Cycle 18 centred
the steering wheel on `innerWidth / 2`, on the reasoning that the camera is the driver's eye looking straight down
the road, so whatever is in front of the driver lands in the middle of the image. That is sound geometry and it still
is — but it renders a car with the driver sitting in the middle of it. Guardrail 50 now records the new target (wheel
**left** of centre) and keeps the original text for the record.

**The hill you asked for is now 3m rather than 1.15m, and it stops there for a reason I checked rather than assumed.**
Cycle 58 capped the descent because a deeper drop lifted the whole highway above the horizon and painted it across
the sky. Cycle 59 fixed the cause: flat road surfaces are now clipped at the eyeline (you cannot see a horizontal
plane above your eye) while standing objects — lamp masts, the barrier, the embankment — are left alone, and a new
embankment face fills the gap between the highway and the dropped ramp. That bought 2.6× the descent.

**I then tried 7.5m and rejected it by looking at it.** At that depth the camera sits about 6m below and 17m to the
side of the highway, so the embankment's near field falls off the left of the screen and its polygon sweeps in as a
black wedge over the sky. That is this projection running out of road — flat ribbons, no depth buffer, no
per-polygon near-plane clipping — not a number to nudge. Going deeper is filed as **S104** and is a genuinely large
job; 3m already reads as a hill. **`RAMP_DROP` has now been raised too far twice and reverted twice**, so the
constant carries that history.

## One proportion I measured but did not change

You said "certain parts", plural, so cycle 62 audited the rest of the cockpit. Two things I expected to be defects
were not: **the instrument cluster is exactly centred on the wheel axis** (my first reading said 40px off, and that
was me measuring two of the row's three children), and the gauges overflowing their inner row by ~9px is invisible
because the housing that paints the binnacle is a wider parent.

The real finding: **the cluster and the wheel are sized by unrelated rules** — the gauges in viewport *height*, the
wheel from a viewport-*width* column — so the ratio between them ranges **0.602 to 0.831** depending on your window,
a 38% swing in something that is one piece of hardware in a real car. **I did not fix it on sight.** The obvious fix
lands squarely in the dash height budget that three earlier cycles tuned for short and landscape-phone viewports,
and rushing it is exactly the "quiet cockpit redesign" the run's own guardrails forbid. It is filed as **S107** with
the measurements and a safe shape for the fix — say the word and it gets a proper cycle.

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

S107 (cluster/wheel sizing, above), S95 (nothing answers `forced-colors: active` — measure before fixing; **not reached yet**, and nothing is claimed
about it), S104 (per-polygon near-plane clipping, only if you want the ramp to drop further than 3m), S15/S17
(structured data for `/drive`, blocked behind the canonical fix above).

## One thing worth knowing about how this run verifies itself

Cycle 60 found two real pedal defects, but its first two "failures" were the **harness**, not the site: React
synthesises `onPointerLeave` from `pointerout`, so a raw `pointerleave` proved nothing; and React's scheduler is not
driven by `requestAnimationFrame`, so pumping frames does not flush a re-render — which briefly made a working
cycle-45 fix look broken. Both were caught and thrown out rather than reported. Where a browser-behaviour question
actually decided whether a defect was real — *does Chrome fire pointer events at a disabled button?* — it was
settled with a **real click and a control that proved the click landed**, not with an assumption.

## Health

`npm run build` and `npm run lint` clean. No page console errors and no hydration warnings — the only console output
is from a wallet extension. No horizontal scroll at any width tested, from 360px to 1920px.

**Housekeeping note:** this session opened with **six orphaned `next dev` servers** (ports 3111–3116) plus a stale
`next start`, all left from the previous session and all sharing `.next`, which was serving `/drive` as a flat 500.
They were killed and `.next` rebuilt clean. If `/drive` ever looks broken, check for orphaned servers before
suspecting the code.
