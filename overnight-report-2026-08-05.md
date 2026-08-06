# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 15 · branch `feat/drive-mode` · 28 commits, nothing pushed

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
sitemap**. These compound, so fixing one alone won't surface the page. Patches are in the same section.

---

## Cycle 15 — removing something rather than adding it

You said you didn't want unnecessary things added, so this pass went looking for the opposite: code that duplicates
itself, and code that lies about what it does.

`world.js` — the file that defines how a point in the world maps to a point on screen — carried this comment:
*"Everything on screen is placed with `project()` so the canvas and the DOM overlays always agree."*

**Nothing called `project()`.** Three separate places wrote out the same maths by hand instead. So the comment
described an architecture that didn't exist, and anyone changing the projection later — including me on a future pass —
would have had to find and update three files in lockstep without being told.

That's not hypothetical tidiness. It's the exact shape of the two worst bugs on this branch: the dashboard height
written twice in different units (which hid the bottom of your résumé on a landscape phone), and the car's sideways
position written four times (which is why you were driving down the centre line).

Two of the three now call the shared function. The third — the road surface itself — **deliberately keeps its own
copy**, because it runs 131 times per frame and routing it through the shared function would add 131 object
allocations and 131 redundant trig calls every frame. That would be trading real performance for neatness. It now
carries a comment saying exactly that, so the remaining duplication is a decision rather than an accident.

**How I checked I hadn't changed anything:** this is a pure refactor, so the only acceptable result is that the page
looks *identical*. I built the old code, captured the rendered frame, rebuilt with the new code, and compared:
**0 of 1,992,704 pixels differ.**

---

## Cycle 14 — the destination now reads as an arrival

Your priority (b) was *"the destination-arrival panel needs work."* Cycle 1 rebuilt the arrival panel **in general** —
but nobody had ever looked at the **destination stop itself**, which is the whole point of the drive: the moment a
recruiter reaches after twenty-one exits.

It was shaped like every other stop. All four actions rendered identically, so **"Email hytjin@gmail.com" carried
exactly the same visual weight as "Back to the classic site"** — the thing you want them to do and the door out looked
the same, and the eye had nothing to land on.

Now the email is the primary action and looks it, LinkedIn and the résumé sit behind it, and "back to the classic site"
drops to a quiet text link rather than competing with them. Above the actions there's a short summary of the drive:

> **Driving since** 2016 · **Roles** 9 · **Side builds** 8 · **Miles driven** 2.7

Every one of those is **derived from your own content** — the counts come from the route's stops, the year from
`education.date`, the distance from the route's length. Nothing is typed in, so adding a role or a build updates them
by itself. That's deliberate: a hardcoded number on a résumé goes stale silently, which is the worst kind of wrong.
I left your prose exactly as you wrote it; the summary sits alongside it.

I also checked my own cycle-13 change for damage before touching anything: the exit signs still land correctly at the
roadside after the camera moved into the lane, and the first-run flow (start engine → hold accelerator → arrive) works
end to end.

---

## Cycle 13 — your two corrections, both applied

**The oncoming traffic is gone.** You were right that it doesn't belong. I'd added it in cycle 7 reasoning that an
empty road felt like a treadmill — but manufactured incident on the far carriageway is set-dressing for a driving game,
not for a page whose job is to represent your work. Removed completely, along with the reduced-motion plumbing that
existed only to suppress it. I've written it into the run's standing rules so no later cycle re-proposes traffic,
weather or other invented road "life", and closed the drifting-haze idea for the same reason.

**The car now drives in a lane.** Your second message named the cause exactly. The camera sat at lateral **0** — which
*is* the centre line — so you straddled it. And because the steering drift decays back to 0, the game was actively
steering you onto the centre line every time you let go. Now the camera sits at the **midpoint of the right-hand lane**
(2.7m of a lane that runs 0–5.5m), and the steering drift is measured *within* that lane, so releasing the keys returns
you to the middle of your lane instead. I also tightened the steering range so full-left leaves you just inside the
centre line and full-right on the edge line — you can't wander onto the oncoming side or off the shoulder any more.

You can see it immediately: the yellow centre line now runs down the **left** of the view with the white edge line to
the right, and the road's vanishing point sits slightly left of screen centre — which is where it belongs when you're
sitting right of the road's centreline, and which finally makes the left-of-centre steering wheel read correctly.

---

## Cycle 12 — landscape phone was quietly broken

Nobody had ever measured drive mode on a **landscape phone**, which is an odd omission for a driving interface. It was
broken in two ways at once:

- The **arrival panel ran 71px underneath the dashboard**, so the bottom of the résumé content was simply invisible.
- The cockpit ate **54% of the screen**, leaving under half for the road.

The cause turned out to be arithmetic, which is the satisfying kind. The dash height was written **twice, in different
units** — the dashboard said "36% tall, but never less than 210px", while the panel reserved space assuming a flat 36%.
On a 386px-tall screen 36% is 139px, so the 210px floor won and the two disagreed by exactly 210 − 139 = **71px** —
precisely the overlap measured. Both now read from one expression, so they can't drift apart again.

Result: overlap **71px → 0**, road visibility **45.6% → 50.8%**. Desktop and portrait phone are unchanged.

### Two alarms I deliberately didn't act on

Both would have been easy — and wrong — to "fix":

- **"No focus indicator anywhere."** Every control reported no outline. But that reading came from *scripted* focus,
  which by design doesn't trigger the browser's focus ring. Nothing in your stylesheets removes outlines, so real
  keyboard users get the normal ring. No change made.
- **"A control is 156px below the screen."** It was the screen-reader-only résumé block's per-stop links, marching down
  the document as they should. The actual cockpit fits its space exactly. Acting on it would have shrunk something that
  was already correct.

---

## Where the drive stands

Your three original asks shipped in cycle 1 (with (c) flagged above for the classic site). Eleven cycles since went
into the standing brief:

a driver's-POV cockpit with working instruments · an arrival panel with auto-cycling full-bleed screenshots ·
dusk-to-dawn light that advances with your career · real interstate guide signs · per-leg roadside character ·
a trip computer counting the actual years · deep links to any exit · mile markers ·
resume-where-you-left-off · opt-in engine sound · a keyboard-accessible route map · a reduced-motion path that holds
together · a cockpit that fits a landscape phone · and a destination that finally reads as an arrival.

---

## Parked, all needing a foreground browser window

Frame rate while driving; audible engine output; and focus returning to the button when you close the route map.
Animation, timers and focus are all suspended in a backgrounded tab, which isn't something I can arrange from here.

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
