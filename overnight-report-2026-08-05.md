# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 8 · branch `feat/drive-mode` · 15 commits, nothing pushed

---

## ⚠️ Two things for you — both about being findable

Unchanged, and they **compound**: drive mode is invisible to search from both directions at once, so fixing only one
won't surface it.

1. **`/drive` ships two `<link rel="canonical">` tags and the first points at your homepage** — the reachable copy
   disowns itself. `og:url` and `og:title` duplicate the same way, so a shared drive link previews as your homepage.
2. **`/drive` is not in your sitemap** — `public/sitemap.xml` lists only the site root.

Both are a handful of lines in files this run isn't allowed to edit (`_app.jsx`, `public/sitemap.xml`). **Exact patches
and one-line verification commands** are in the Needs-human section of `overnight-tasks-2026-08-05.md`.

---

## Cycle 8 — the route remembers you

The route is 21 exits long. Anyone who read a few, closed the tab and came back was dropped at MILE 0 with no way back
except driving the whole thing again — probably the most likely reason to give up on this page on a second visit.

Now it remembers where you got to. But the design decision that matters is that it **offers** rather than **applies**:
come back and you see *Resume · EXIT 13 — Co.Lab Portfolio App* sitting beside *Start engine*, with **Forget my
progress** underneath. Auto-jumping you somewhere would take away the choice and hide the beginning of the route.
Nobody gets trapped by state they didn't ask for, and a clean start is always one click away.

A shared `?exit=` link always wins over saved progress — someone following your link asked for that exit specifically.

### Storage is hostile, so it's treated that way

`localStorage` doesn't just fail to save in Safari private mode or with cookies blocked — it **throws on access**. Every
read and write is wrapped, and a failure degrades to "no saved progress" rather than a broken page.

The subtler one: your route is *derived from your content*. If you add or remove a role, a stored index quietly points
at something else entirely. So the key is versioned and a restored position is only trusted if the stop's id still
matches the index. I armed three deliberately broken entries — a stale id, unparseable JSON, and index 999 — reloaded
through the real code path each time, and all three fell back to no offer with the page alive.

Everything was checked against a production build with `localStorage` read directly rather than inferred: clean first
visit offers nothing; driving to EXIT 13 stores it; `?exit=5` overrides without clobbering the saved 13; the plain load
offers the resume and lands there; Forget clears it.

---

## Where the drive stands

Your three original asks shipped in cycle 1. The seven cycles since have gone into the standing brief — making it feel
like a real place:

a driver's-POV cockpit with working instruments · an arrival panel with auto-cycling full-bleed screenshots ·
dusk-to-dawn light that advances with your career · real interstate guide signs · per-leg roadside character ·
a trip computer counting the actual years · deep links to any exit · oncoming traffic · mile markers · and now
resume-where-you-left-off.

---

## Queued next

Opt-in engine audio (the riskiest remaining item — Web Audio, must never autoplay); a drifting haze layer, deliberately
deferred because the existing horizon haze already does the job; and structured data for `/drive`, still blocked behind
the canonical fix above. Full reasoning in `overnight-suggestions-2026-08-05.md`, every idea with a checkbox.

Still parked: frame rate while driving. Every Chrome tab here reports itself hidden, which pauses animation entirely —
a probe returned zero frames in six seconds. Not something I can resolve from this side.

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
