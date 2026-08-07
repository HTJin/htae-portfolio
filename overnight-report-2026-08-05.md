# Overnight report — rolling summary

**Run:** started 2026-08-05, still running. **Last refreshed:** end of cycle 87 (2026-08-07). **See `overnight-ACTION-REQUIRED.md` for everything waiting on you.**
**Branch:** `feat/drive-mode`. Nothing has been pushed, merged or deployed — the guardrails forbid all three.

This file is rewritten every cycle. The full history lives in `overnight-tasks-2026-08-05.md` (source of truth),
`overnight-journal-2026-08-05.md` (one line per task), `overnight-log-2026-08-05.md` and
`overnight-suggestions-2026-08-05.md` (every idea, with a checkbox for you).

---

## Where the run is

87 cycles. Cycles 1–56 were self-directed: the loop generated its own ideas by auditing the live site and comparing
against comparable sites, then built and verified them. **Cycles 57, 58, 59 and 61 were owner-directed** — you gave
instructions mid-run, and those outrank anything the loop picks for itself. Cycle 60 came off the loop's own backlog.

## Shipped since cycle 57

|     | What                                                                                                                                                                                  | Commit               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 57  | Every stop is a real interchange, on a divided highway — median barrier and an empty opposing carriageway replace the dashed centre line; deceleration ramp in, acceleration ramp out | `a511ce0`            |
| 58  | The driver sits on the left — the dash stopped being symmetric and the wheel moved off the screen centre line                                                                         | `f1c5b4f`            |
| 58  | Pedals right of the wheel, pinned out of the flow so the console keeps its position; console capped so it stops stretching toward the passenger door                                  | `6d2e3aa`, `5ee5782` |
| 58  | Two lanes each way, and an exit that leaves the highway properly — 14m clear, 136m long, and descending                                                                               | `694c4f6`            |
| 58  | Continuous prose stopped being set in newspaper columns                                                                                                                               | `4195b71`            |

| 59 | The exit ramp's descent is no longer capped by the renderer — flat surfaces clip at the eyeline, an embankment fills the gap, and the hill went 1.15m → 3m | `8264530` |
| 60 | The pedals, driven with touch for the first time: a disabled pedal no longer moves the sim, and pointer capture can no longer swallow a press | `ae31e76` |
| 61 | The centre display was a 6.2:1 letterbox; it is now 16:9 like a real one. The exit panel narrowed from 76rem/3 columns to 60rem/2 | `664def6` |

| 62 | _Audit only — nothing shipped._ The rest of the cockpit's proportions checked; two suspected defects disproved, one real one measured and filed rather than rushed | — |
| 63 | _Audit only — nothing shipped._ The proportion mechanism proven, and a confirmed defect found: the wheel draws over the brake pedal on tall-narrow windows. Fix attempted and abandoned — see the decision section below | — |
| 64 | The BRAKE and GO pedals would have disappeared entirely in Windows high-contrast mode; they now keep a visible edge | `dd32f65` |
| 65 | The highway got a flank, so the gap under the elevation is gone. Plus a thicker road, the exit 22m out, a 5.5m drop and 420m legs | `b7cfa73` |
| 66 | _Sweep only — no defect._ All 21 exits re-checked after the road overhaul; the derived route distance followed correctly to 5.2 mi | — |
| 67 | The page had no print styling at all and would have printed a page of dashboard with no résumé. It now prints the résumé that was already in the DOM | `1dde62c` |
| 79 | **The exit had no ground beside it.** The verge is drawn at mainline grade, so once the ramp descends the eyeline clip removed it and nothing replaced it — the ramp was tarmac over empty gradient for the whole descent | `1e1445a` |
| 79 | **The barrier was see-through** (drawn at 0.9 alpha over a 0.5 cap) and the highway had no edge standing against the sky. Both fixed; planting added on the bank | `f3a85d7` |
| 79 | **The bank was a 90° wall.** A clamp of mine pinned its foot beside the top for the first half of every descent — with a comment claiming that was correct. It now lies back ~1:2.6 from the drop, and the shoulder parapet came down to a guardrail | `97c1012` |
| 81 | Verified the planting only appears where there is a slope, using a marker colour no palette contains — 0 on the mainline, 7 mid-descent | — |
| 68 | _Measurement only._ No heap leak over the full route (+0.62 MB across 21 stops). Cold page weight reclassified as unmeasurable from here | — |

**One trade to be aware of, from your "a bit longer" request.** A leg now takes **14.1 seconds**, so driving the
whole route on the accelerator is about **4.7 minutes** — up from ~3.8 min at the previous leg length and ~3.1 min
when the run started. That is the direct cost of the change and it is yours to judge; `Next` still autopilots for
anyone who would rather not hold a pedal. Say the word if you want the legs pulled back.

**One reported problem was not a defect.** The "gap spilling out the road on the right side of the UI" was a 1440px
measurement iframe I had overlaid on the live 1920px page — the page showing through beside my own harness. Removed
it, reloaded, re-measured: full-width dash, no horizontal scroll. Nothing was changed, because nothing was wrong.

## Two things worth your attention

**A decision of mine was overridden, and I amended the guardrail rather than quietly breaking it.** Cycle 18 centred
the steering wheel on `innerWidth / 2`, on the reasoning that the camera is the driver's eye looking straight down
the road, so whatever is in front of the driver lands in the middle of the image. That is sound geometry and it still
is — but it renders a car with the driver sitting in the middle of it. Guardrail 50 now records the new target (wheel
**left** of centre) and keeps the original text for the record.

**I was wrong twice about the hill, and you found why.** I capped the ramp's descent at 3m and told you a deeper
drop was impossible without real 3D clipping — that the projection had "run out of road". That diagnosis was wrong.
The black wedge I kept seeing at 6.5m and 7.5m was not a clipping limit: it was the **missing embankment flank** you
spotted. The highway was an infinitely thin ribbon with no side, so from below it floated and the fill swept across
the sky.

With the flank drawn continuously, **5.5m renders cleanly** — no wedge, sky intact — and no clipping work was needed
at all. **S104's premise is retired.** The lesson is recorded in the run's own notes: "a renderer limit is a strong
claim, and the bar for it should be higher than _my first fix looked bad_."

## ⚠ This needs a decision from you, not another audit

Cycles 62 and 63 both went at the cockpit proportions and **both shipped nothing.** That is two in a row on one
thread, so I am stopping and asking rather than starting a third.

**What is confirmed.** The steering wheel's width _is_ the dash height (`aspect-square h-full`, measured
`dashH − 19px` in six of six samples), the column holding it is sized by viewport **width**, and the gauges use the
height basis with a pixel cap that freezes them past ~971px tall. Three rules for what a real car builds as one
assembly.

**The defect that falls out of it:** on tall-narrow windows the wheel grows past its own column and **draws over the
brake pedal** — overlapping by 1px at 1280×1024 and by 52px at 1024×1180, and over the door card at both (re-measured in cycle 77; first taken in cycle 63 as 2px / 53px, before later dash and road changes). It is
`pointer-events-none`, so it does not block the press; it covers it.

**Why I did not just fix it.** The wheel rotates via a transform about the _box_ centre. Every one-line fix
(`max-w-full` and friends) leaves the wrapper non-square, at which point the wheel's content no longer shares that
centre and it would **orbit instead of spin** — a bug that does not show up in a screenshot and would have shipped.
The alternative that keeps rotation correct re-centres the wheel vertically out of its tuned position, and no
constant fraction works because the overflow ranges from 0.925 to about 1.57.

The real fix is to derive the wheel, its column and the gauges from a single `min(column width, dash height)`. That
is a genuine cockpit re-derivation touching the dash height budget three earlier cycles tuned for short and
landscape-phone viewports — the kind of change this run's guardrails say not to make quietly after you twice
rejected inventions of mine. **Tell me to do it and it gets a full cycle with those guardrails loaded; otherwise it
stays parked and the loop moves to other work.**

## Two cockpit things that are _not_ defects

Recorded so a later pass does not "fix" either. **The instrument cluster is exactly centred on the wheel axis** —
offset 0 at both 1920×1080 and 1440×900. My first reading said 40px off, and that was me measuring two of the gauge
row's three children and forgetting the gear block. And the gauges overflowing their inner flex row by ~9px a side
is invisible, because the element that paints the binnacle housing is a wider parent.

_(Cycle 62 also reported here that the wheel was sized from a viewport-width column. Cycle 63 measured it properly
and that was wrong — the wheel is sized from the dash **height**. The corrected mechanism is in the section above.)_

## Parked — needs you

- ⭐ **Two dead links on Solar Power Indy (EXIT 11).** `gosolarindy.energy` is NXDOMAIN and
  `github.com/HTJin/solar-questions` is a 404, while every other `HTJin` repo returns 200. Both live in
  `src/lib/projects.js`, which the guardrails make read-only, and only you know whether the domain lapsed, the repo
  went private, or there is a new address. The loop will not guess a replacement URL or delete the project.
- ⭐ **The classic site still crops project photos and never cycles them.** Fixed in drive mode back in cycle 1; the
  main portfolio page still has both faults. `src/components/Projects.jsx` is outside this run's write scope, and the
  working tree already carries uncommitted edits of yours in that area. The exact patch is written out in the task
  file.
- **`/drive` ships two canonical tags**, the first pointing at the homepage, so crawlers are told `/drive` _is_ the
  homepage. The fix is in `_app.jsx`, outside the write scope. **`/drive` is also missing from the sitemap**, which is
  half the site's indexable routes.

## Backlog the loop can still work on

S107 (cluster/wheel/column re-derivation — **parked on your decision**, see the section above), S104 (per-polygon
near-plane clipping, only if you want the ramp to drop further than 3m), S15/S17 (structured data for `/drive`,
blocked behind the canonical fix above). **S95 is now done** — see cycle 64 above.

The self-generated backlog is close to dry. When it runs out the loop goes back to the Suggester for a fresh audit
and market-research pass, which is how it refills.

## One thing worth knowing about how this run verifies itself

Cycle 60 found two real pedal defects, but its first two "failures" were the **harness**, not the site: React
synthesises `onPointerLeave` from `pointerout`, so a raw `pointerleave` proved nothing; and React's scheduler is not
driven by `requestAnimationFrame`, so pumping frames does not flush a re-render — which briefly made a working
cycle-45 fix look broken. Both were caught and thrown out rather than reported. Where a browser-behaviour question
actually decided whether a defect was real — _does Chrome fire pointer events at a disabled button?_ — it was
settled with a **real click and a control that proved the click landed**, not with an assumption.

## Health

`npm run build` and `npm run lint` clean. No page console errors and no hydration warnings — the only console output
is from a wallet extension. No horizontal scroll at any width tested, from 360px to 1920px.

**Housekeeping note:** this session opened with **six orphaned `next dev` servers** (ports 3111–3116) plus a stale
`next start`, all left from the previous session and all sharing `.next`, which was serving `/drive` as a flat 500.
They were killed and `.next` rebuilt clean. If `/drive` ever looks broken, check for orphaned servers before
suspecting the code.
