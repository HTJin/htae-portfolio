# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 7 · branch `feat/drive-mode` · 13 commits, nothing pushed

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

## Cycle 7 — the road isn't empty any more

Two things that had been waiting on the browser blocker finally shipped, both answering the same complaint: you were
driving twenty-one exits of a completely deserted highway, with nothing between exits to tell you you were making
progress.

**There's other traffic now.** Headlights come toward you on the far carriageway, closing at their own speed plus
yours — so they keep passing even while you're parked reading a stop. They take their colour from the time of day, so
they belong to whatever light you're driving through.

**And mile markers between the exits** — a green plate on a slim post every half-leg, set outboard of and taller than
the reflector line so they never read as just more delineator posts.

### Both checks were worth doing properly

The mile markers **failed the first time**. At the size I'd authored them they projected to about **two pixels by one**
at distance — a speck, indistinguishable from the reflectors. Nothing errored; the code was "working". Only looking at
a zoomed screenshot caught it. They're now four times the area, raised and set further out.

The traffic needed a trick to verify at all. A frame-timing probe returned **zero frames in eight seconds** — this
Chrome reports every tab as hidden, which pauses animation entirely, so the scene only paints in bursts when something
pokes it. I couldn't watch the cars move. So I used the fact that **a parked car makes the whole scene static**:
nothing in the canvas can change while you're stopped. Two pixel captures either side of 45 forced repaints differed in
**12,564 pixels**, confined to a compact box near the vanishing point extending down and to the left — exactly the
approach path of oncoming headlights, and nothing else could have produced it. That proved both rendering *and*
motion without ever seeing an animation.

A follow-up screenshot then showed the headlights were only 2–4 pixels across: present, but not legible as headlights.
So they got bigger. **Presence and legibility are different questions** — worth separating in future canvas work.

---

## Where the drive stands now

Everything you originally asked for shipped in cycle 1, and the six cycles since have gone into the standing brief —
making it feel like a real place. As it stands: a driver's-POV cockpit with working instruments, an arrival panel with
auto-cycling full-bleed screenshots, dusk-to-dawn light that advances with your career, real guide signs, per-leg
roadside character, a trip computer counting the actual years, deep links to any exit, oncoming traffic, and mile
markers.

---

## Queued next

Resume-where-you-left-off; opt-in engine audio; a drifting haze layer (deliberately deferred — the existing horizon
haze already does the job and a second layer risks muddying it); and structured data for `/drive`, which stays blocked
behind the canonical fix above. Full reasoning in `overnight-suggestions-2026-08-05.md`, every idea with a checkbox.

Still parked: frame rate while driving, which can't be measured while every tab reports itself hidden.

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
