# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 9 · branch `feat/drive-mode` · 17 commits, nothing pushed

---

## ⚠️ Two things for you — both about being findable

Unchanged, and they **compound**: drive mode is invisible to search from both directions at once, so fixing only one
won't surface it.

1. **`/drive` ships two `<link rel="canonical">` tags and the first points at your homepage** — the reachable copy
   disowns itself. `og:url` and `og:title` duplicate the same way, so a shared drive link previews as your homepage.
2. **`/drive` is not in your sitemap** — `public/sitemap.xml` lists only the site root.

Both are a handful of lines in files this run isn't allowed to edit (`_app.jsx`, `public/sitemap.xml`). **Exact patches
and one-line verification commands** are in the Needs-human section of `overnight-tasks-2026-08-05.md`.

**One small thing to try yourself:** press the **♪** button on the dash. Engine sound is the last thing that shipped
and it's the one feature I can't check from here — see below.

---

## Cycle 9 — sound, and a check that found nothing (which was the point)

**The drive has an engine now, if you ask for it.** A **♪** toggle on the console; press it and two oscillators an
octave apart follow the revs, with filtered tyre noise that follows speed instead. It's all synthesised, so it adds no
download and no dependency.

The conservative choices are the whole design. The audio context is created **inside the button's own click handler** —
never on load — and the preference is **deliberately not remembered**, because a stored "on" would try to make noise on
your next visit before you'd touched anything. That's the last thing a résumé someone opens in an open-plan office
should do.

I verified that by watching the `AudioContext` constructor itself: **zero exist before any gesture**, pressing the
toggle creates **exactly one**, toggling repeatedly reuses that same one rather than leaking, and leaving the page
closes it. Storage contains only your saved route progress — no audio key.

**That verification caught a real flaw.** The toggle originally lit up unconditionally, so when a browser refuses to
start audio the button would claim "on" over silence. It now only reports on if the context actually started.

**What I couldn't check: whether it actually makes a sound.** Browsers require a genuine user press to start audio, and
a scripted click doesn't count — so the context never runs in my environment. Press **♪** yourself: the note should
rise with the tachometer under throttle, and tyre noise should build with speed.

### The check that found nothing

Your phone layout hadn't been re-verified since cycle 1 — seven cycles of change ago. I measured it: no overflow,
cockpit correct, arrival panel scrollable, screenshots at full width, resume UI stacking properly. **Nothing needed
fixing.**

Worth mentioning because of the near-miss: the arrival panel measured 26px *into* the dashboard, which looked like a
clear overlap. It wasn't — it was the panel's entry animation frozen at its first frame, because animation is paused in
a backgrounded tab. The settled layout sits flush. Had I "fixed" it, I'd have permanently shifted the panel out of
place for every real visitor to correct a measurement artefact.

---

## Where the drive stands

Your three original asks shipped in cycle 1. The eight cycles since went into the standing brief:

a driver's-POV cockpit with working instruments · an arrival panel with auto-cycling full-bleed screenshots ·
dusk-to-dawn light that advances with your career · real interstate guide signs · per-leg roadside character ·
a trip computer counting the actual years · deep links to any exit · oncoming traffic · mile markers ·
resume-where-you-left-off · and now opt-in engine sound.

---

## Queued next

The backlog is down to two items, both deliberately held: structured data for `/drive` (blocked behind the canonical
fix above — adding page markup while two canonicals disagree just adds noise), and a drifting haze layer (the existing
horizon haze already does that job). So the next cycle will generate fresh ideas rather than mine the backlog.

Still parked: frame rate while driving, and now audible engine output — both need a foreground browser window, which
isn't something I can arrange from here.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-tasks-2026-08-05.md` | Source of truth — **and both Needs-human patches** |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

A production build is served on **http://localhost:3008** — use that rather than `npm run dev`, which has repeatedly
served pages that never come alive. Nothing has been pushed; everything is local commits on `feat/drive-mode`.
