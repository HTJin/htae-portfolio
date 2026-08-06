# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 19 · branch `feat/drive-mode` · 34 commits, nothing pushed

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

## Cycle 19 — checking the thing I said I hadn't checked

Last cycle I moved the steering wheel and told you I'd only verified it on one screen size, because the browser window
refused to resize. That is the kind of gap that has bitten this branch before — the worst bug of the whole run was a
dash height that was fine on a desktop and hid the bottom of your résumé on a phone.

So I got the sizes a different way: I loaded `/drive` inside a frame of an exact size on the page. A frame is its own
window as far as the layout is concerned, so 1100 wide, and a phone at 390×844 and 844×390, all became reachable
without touching the actual window. I checked that the trick was real before believing anything it told me — the page
inside genuinely reported itself as 1100 wide, and genuinely switched to the phone layout at 390.

**It holds up.** At 1100 the console buttons stay on one line, the trip computer keeps its width, and nothing overlaps
or runs off the edge. On both phone orientations the desktop cockpit isn't merely "untouched" by my change — it is
switched off entirely, which I can now show rather than assert. Nothing needed fixing.

**One honest detail:** between roughly 1024 and 1280 pixels wide, the wheel is still about 150px short of your eyeline
rather than dead on it. That's deliberate, and now I can tell you exactly why: centring the wheel forces the door side
to match the console side, and the console needs about 310px to keep its buttons on one row — which works out to
needing a ~1270px window before a centred wheel fits without wrapping. Below that I'd be trading a small
misalignment for a cramped control panel, which is a bad trade. That arithmetic is now written into the code, so the
breakpoint isn't a number someone picked by eye.

---

## Cycle 18 — you were sitting in the passenger seat

You asked me to think about what a car should look like from the driving perspective. This one had the steering wheel
in the wrong place, and I can show you by how much.

The road is drawn from a camera that *is* your eyes. I checked where that camera looks by projecting the road out to a
million metres: the vanishing point lands on **960px** of a 1920px screen — dead centre, every time. So your eyeline is
the middle of the window. Then I measured the cockpit: the mirror, the glass and the pillars were all centred on 960
too — but the **steering wheel was centred on 615**. It sat 345 pixels, eighteen percent of the screen, to the left of
your own eyes. You were looking at the wheel from the passenger seat.

What made it stick was a comment in the code claiming the road's vanishing point sits left of centre, which was given
as the reason for that framing. It doesn't. What sits left of centre is the road *near you* — which is correct, and is
why the centre line runs down your left. The far end doesn't move. So the justification was false and had gone
unchallenged.

The wheel is now the middle column of the dash, which means it is centred on your eyeline at any window size, by
construction rather than by a number someone tuned. And centring it opened up the space to your left — so that space
became a **door**: card face, armrest edge catching the light off the windscreen, and a door pull sunk under it. That
is what is actually beside you when you drive; it isn't more dashboard. The console and the pedals sit to your right,
where they belong.

I did not touch the projection maths to achieve this. Shifting the camera sideways would have shoved the road into the
left third of the windscreen — the dash was what was wrong, not the road.

**One thing I could not check:** the browser window refused to actually resize this session, so this is verified at
1920x895 and nowhere else. The phone layout is untouched code, and I deliberately kept the door column narrow between
1024 and 1280 so the trip computer can't get squeezed — but that is arithmetic, not a screenshot. It's listed under
things needing a look in a real window.

---

## Cycle 17 — what the page says when nobody is looking at it

Almost all of `/drive` is a `<canvas>`. So this pass ignored the picture entirely and asked what the page says through
the channels that aren't the picture: the browser tab, the history entry, and what a screen reader actually hears.

**The tab never moved.** Drive from exit 13 to exit 14 and the address bar updates — but the tab title stayed
*"Hyun-Tae Jin | Drive mode"* the whole way. Twenty-one different destinations, one bookmark name, one history entry.
Bookmark the Co.Lab build and later you can't tell it from the toolbox.

**And that same string was being read aloud.** Next.js announces the page title to screen readers on every URL change —
assertively, meaning it interrupts. Since the URL changes each time you pull away from an exit, a blind visitor was
interrupted twenty times with the *identical* sentence, and never once told which exit they'd reached. The title now
carries the exit, so the interruption became the useful sentence it was always trying to be: *"EXIT 14 · Virshop -
Backend."* Your crawler-facing title is untouched — I checked the served HTML directly, not the browser, because the
browser would have shown me my own change and told me nothing.

**The arrival panel was labelled as announcing itself, and couldn't.** It carried the right attribute, but the panel is
rebuilt from scratch every time you arrive — and a region that appears at the same moment as its text announces
nothing. Measured: different DOM node before and after each arrival, and no region on the page at all while driving.
There's now a small permanent one that says *"Arrived at EXIT 14 — Virshop - Backend"* as you pull up. Mile 0 says
*"At the start line"*, because you didn't arrive anywhere yet.

One thing worth mentioning because it's how these get caught: the first build produced the tab title *"MILE 0 ·
Hyun-Tae Jin | Hyun-Tae Jin"* — the start line's title is your name, so appending your name doubled it. That only
showed up by looking at the actual output.

---

## Cycle 16 — the app was contradicting itself

Two features built on different nights disagreed about the same fact, and a visitor could see both statements one
click apart.

Come back to the site after reading a few exits and it offers **"Resume · EXIT 13"**. Take it, open the route map —
and the map said you had **never driven exits 01 through 12**. Two of twenty-one rows were marked "driven". The page
was simultaneously telling you that you'd got as far as exit 13 and that you'd never passed the ones before it.

The fix rests on something the code already guarantees rather than on an assumption about you: progress is saved
**only on arrival**, and **only ever moves forward**. So a stored exit 13 is proof of arrival at everything behind it.
Resuming now restores that history, and the map reads as your own drive.

**The part that took the actual thought:** this had to apply to *resuming only*. If someone sends a colleague a link
straight to exit 11, that colleague clicked a link — they didn't drive the road, and their map shouldn't pretend
otherwise. The restore is wired into the resume path and nowhere else, with the reasoning written next to it so a
later pass doesn't "helpfully" apply it to deep links too.

Checked on a real build, all three ways: resume to exit 13 → 14 rows driven, mile 0 through exit 13; deep link to the
same exit → just that one; a first-ever visit → just mile 0.

**One thing I found and deliberately left alone.** While the car is parked, the road is still being redrawn sixty
times a second to produce an identical picture — real battery burn on a page someone leaves open while reading. The
fix is small, but I can't *measure* that it works from here (animation is suspended in a background tab), and shipping
an unmeasurable optimisation into code that runs every frame is how this branch has broken before. It's written down
with its reasoning as backlog item S16a instead of guessed at.

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

Your three original asks shipped in cycle 1 (with (c) flagged above for the classic site). Fourteen cycles since went
into the standing brief:

a driver's-POV cockpit with working instruments · an arrival panel with auto-cycling full-bleed screenshots ·
dusk-to-dawn light that advances with your career · real interstate guide signs · per-leg roadside character ·
a trip computer counting the actual years · deep links to any exit · mile markers ·
resume-where-you-left-off that now remembers the whole drive · opt-in engine sound · a keyboard-accessible route map ·
a reduced-motion path that holds together · a cockpit that fits a landscape phone · and a destination that finally
reads as an arrival.

---

## Parked, all needing a foreground browser window

Frame rate while driving; audible engine output; and focus returning to the button when you close the route map.
(The re-centred dash at narrow widths came off this list in cycle 19 — it was measurable after all.)
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
