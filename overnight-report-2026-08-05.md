# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 11 · branch `feat/drive-mode` · 21 commits, nothing pushed

---

## ⭐ Read this one first: your priority (c) is only half-fixed

You asked for three things. The third was *"the projects sections the photos just get cut off and then the cycling
through photos should just happen automatically with smooth fade transition to the next screenshot."*

I fixed that in **drive mode** in cycle 1. The **main portfolio page** — the one most visitors actually see — still has
**both** faults:

- **Every screenshot is cropped.** `src/components/Projects.jsx` puts them in a 16:9 frame with `object-cover`.
  Computed against your actual files: **all 28 screenshots** are wider than 16:9, so **10.1% of each image's width is
  thrown away** on average, 14.2% at worst.
- **They only advance if you click them.** There is no timer anywhere in that file, so a visitor who doesn't think to
  click sees screenshot 1 of up to 5.

Small patch — the same two moves that fixed drive mode, and the fade comes free because `AnimatePresence` already wraps
the image. It's starred at the top of the Needs-human section of `overnight-tasks-2026-08-05.md`. I didn't apply it:
that file is outside the scope you set, and you have uncommitted edits in that area.

**Also waiting:** `/drive` ships **two canonical tags** (the first pointing at your homepage) and **isn't in your
sitemap** — these compound, so fixing one alone won't surface the page. Patches are in the same section.

---

## Cycle 11 — I broke something in cycle 7 and caught it

Drive mode honours `prefers-reduced-motion` deliberately: holding the accelerator **jumps** you to the next exit
instead of animating the road past you, the screenshot carousel doesn't autoplay, the arrival panel fades instead of
swinging up, and the star twinkle and ignition pulse stop.

The oncoming traffic I added in cycle 7 respected none of it. Because the cars run on a wall clock rather than on your
travel, someone who had asked their system for less motion still got **headlights sliding toward them while parked at a
stop** — exactly what that setting exists to prevent. Now they simply aren't drawn, which restores the empty road the
page had before cycle 7. Freezing them instead would have left cars sitting in a live carriageway looking like wreckage.

**How I proved it, given I can't watch animation here:** the scene is fully deterministic at a given exit — same
travel, same light, same roadside. So two loads of the same exit, one with the motion preference forced on, can differ
*only* where traffic is drawn. They differed in **185 pixels, all inside a 30×32px box at the vanishing point**, and
were otherwise identical. That identity is the control: it confirms nothing else varies, so the difference is the cars.

While I was there I swept the **whole** reduced-motion contract, which no cycle had ever tested together. All four hold:
traffic gone, throttle jumped `EXIT 06 → EXIT 07` with no driving in between, the panel used its plain-fade variant,
and the carousel stays put (proven back in cycle 2).

---

## Where the drive stands

Your three original asks shipped in cycle 1 (with (c) flagged above for the classic site). Ten cycles since went into
the standing brief:

a driver's-POV cockpit with working instruments · an arrival panel with auto-cycling full-bleed screenshots ·
dusk-to-dawn light that advances with your career · real interstate guide signs · per-leg roadside character ·
a trip computer counting the actual years · deep links to any exit · oncoming traffic · mile markers ·
resume-where-you-left-off · opt-in engine sound · a keyboard-accessible route map · and a reduced-motion path that
actually holds together.

---

## Parked, all needing a foreground browser window

Frame rate while driving; audible engine output; and focus returning to the button when you close the route map. All
three need a Chrome window that's genuinely in front — animation, timers and focus are all suspended in a backgrounded
tab. Not something I can arrange from here.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-tasks-2026-08-05.md` | Source of truth — **and all three Needs-human patches** |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

A production build is served on **http://localhost:3008** — use that rather than `npm run dev`, which has repeatedly
served pages that never come alive. Nothing has been pushed; everything is local commits on `feat/drive-mode`.
