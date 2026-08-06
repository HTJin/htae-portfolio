# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 6 · branch `feat/drive-mode` · 11 commits, nothing pushed

---

## ⚠️ Two things for you — both about being findable

Unchanged from last cycle, and they **compound**: drive mode is invisible to search from both directions at once, so
fixing only one won't surface it.

1. **`/drive` ships two `<link rel="canonical">` tags and the first points at your homepage** — the reachable copy
   disowns itself. `og:url` and `og:title` duplicate the same way, so a shared drive link previews as your homepage.
2. **`/drive` is not in your sitemap** — `public/sitemap.xml` lists only the site root.

Both are a handful of lines in files this run isn't allowed to edit (`_app.jsx`, `public/sitemap.xml`). **Exact patches
and one-line verification commands** are in the Needs-human section of `overnight-tasks-2026-08-05.md`.

---

## Cycle 6 — I could finally see the site again, so I checked the work instead of adding more

The browser blocker that ran through cycles 3–5 **cleared**. Chrome reached the site, drove the route, and screenshots
came back with real pixels. So this cycle was spent proving the work I'd shipped blind, rather than piling on more.

**The roadside work checks out.** Driving into the Scenic overlook, the guardrail renders along the right verge as one
continuous ribbon **with no seams** — which was the specific risk, and the reason it was built as a run-length pass
rather than segment-by-segment fills. The lamp line is visibly thinner through the overlook, thinner again across the
sabbatical stretch, and there's no guardrail anywhere else. Nothing pops as you approach it.

**Everything else re-verified end to end on a real production build:** deep links land correctly, the project
screenshots auto-cycle, and the year readout shows `2019` on the career highway and `NOW` at a side build — correctly
refusing to invent a date for projects that don't have one.

### The interesting part: a bug that wasn't

`?exit=12` came up dead — ignition screen, no panel, "Start engine" doing nothing. That looks exactly like I'd broken
the deep links I shipped in cycle 2.

I didn't take it at face value. `document.body.style.overflow` was unset, which meant the very first effect in the
component had never run — **React had never hydrated**. Plain `/drive` with no query was equally dead, which ruled out
the deep-link code entirely. All eight JavaScript chunks returned 200. The console was silent.

Rebuilding the *same commit* and serving it with `npm run start` fixed everything instantly. So: no defect. Your
`next dev` intermittently serves correct HTML that never comes alive — that's now the fourth distinct way the dev
server has faked a failure tonight, and it's written into the run's guardrails so future cycles check hydration before
believing anything.

**Worth knowing if you test this yourself:** use a production build (`npm run build`, then `npm run start`), not
`npm run dev`.

---

## One measurement I couldn't take

Frame rate while driving. `requestAnimationFrame` is paused in a backgrounded tab, so the timing loop waits forever —
it hung twice before I identified why. Every Chrome tab here reports itself as hidden. Screenshots, layout and DOM
reads all work in that state; only frame timing doesn't. It's the single item still parked, and for reference cycle 3
measured the much heavier daylight change at 34fps against a 26fps baseline, so the bar is low.

---

## Queued next — the backlog just reopened

Now that pixels can be verified again, four ideas that were on hold are live for the next cycle: mile markers counting
down between exits, weather and oncoming headlights so the road feels inhabited, resuming where a visitor left off, and
opt-in engine audio. Full reasoning in `overnight-suggestions-2026-08-05.md`, every idea with a checkbox.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-tasks-2026-08-05.md` | Source of truth — **and both Needs-human patches** |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

Production build is currently served on **http://localhost:3008**. Nothing has been pushed; everything is local commits
on `feat/drive-mode`.
