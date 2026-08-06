# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 41 · branch `feat/drive-mode` · 53 commits, nothing pushed

---

## ⭐ Read this one first: your priority (c) is only half-fixed

You asked for three things. The third was *"the projects sections the photos just get cut off and then the cycling
through photos should just happen automatically with smooth fade transition to the next screenshot."*

I fixed that in **drive mode** in cycle 1. The **main portfolio page** — the one most visitors actually see — still has
**both** faults:

- **Every screenshot is cropped.** `src/components/Projects.jsx` puts them in a 16:9 frame with `object-cover`.
  Computed against your actual files: **all 28 screenshots** are wider than 16:9, so **10.2% of each image's width is
  thrown away** on average, 14.2% at worst (`rift/2.png`). Re-verified in cycle 35.
- **They only advance if you click them.** There is no timer anywhere in that file, so a visitor who doesn't think to
  click sees screenshot 1 of up to 5.

Small patch — the same two moves that fixed drive mode, and the fade comes free because `AnimatePresence` already wraps
the image. It's starred at the top of the Needs-human section of `overnight-tasks-2026-08-05.md`. I didn't apply it:
that file is outside the scope you set, and you have uncommitted edits in that area.

**Also waiting:** `/drive` ships **two canonical tags** (the first pointing at your homepage) and **isn't in your
sitemap**. These compound, so fixing one alone won't surface the page. Patches are in the same section.

---

## Cycle 41 — one project stop was a five-megabyte download

Having made the screenshots bigger last cycle, I weighed what they cost to load. Opening the **Matrimoni** project
downloaded **5.3 megabytes**. Not the page — just that one stop's five screenshots.

All five load the moment you arrive, because they are stacked on top of each other inside the panel, so the browser's
usual "only load what is on screen" behaviour does not save you. And the files are far bigger than anything you see:
those images are 2350 pixels wide and were being drawn at 451. You were sending about five times the picture that ever
reached the screen, as uncompressed PNG, with caching switched off.

Across all your projects that is **15.6 MB** of screenshots.

The fix was already in your own codebase. Your main site runs its project images through Next.js's image optimiser —
drive mode was the one place still loading them raw. Now it does the same:

| | arriving at that stop |
|---|---|
| before | **5,306 KB** of PNG |
| after | **131 KB** of WebP |

**About forty times smaller**, and the images are now generated at the size they are actually shown — 470 pixels
normally, 692 on a large monitor where last cycle's bigger frame kicks in. **Your original screenshot files are
untouched**; the optimiser reads them and produces its own copies.

I re-checked everything that shares that component rather than assuming a swap this size was harmless: the frame is
the same size, the fade between screenshots still fades (I caught it mid-transition with two frames both partly
visible, rather than just checking the start and end), nothing is cropped, the dots still work, the screen-reader fix
from earlier still holds, and reduced-motion still freezes on the first image.

---

## Cycle 40 — your project screenshots were being shown at a quarter size

Your original brief had three parts, and the third was that the project photos were getting cut off. That was fixed in
drive mode on the first night — they show whole now, and they cycle themselves. But measuring them properly this cycle
turned up the other half of the problem: they were being displayed at **451 pixels wide, from images that are 1899
pixels wide**. Under a quarter of their real size, on every monitor, whether yours is 1440 or 2560 across. Meanwhile
nearly a thousand pixels of the panel area sat empty beside them.

At that size you can tell there *is* a web page in the frame. You cannot read a word of it.

They now render at **678 pixels** — about 36% of native instead of 24% — on screens with the room for it, and the
difference is the difference between recognising a layout and actually reading the page you built.

**The catch, and why this took a measurement rather than a one-line change.** The little browser frame is a fixed
2:1 shape, so making it wider also makes it taller — and the height it has to fit into belongs to the dashboard and
the mirror, which I am not willing to shrink. Widening it on a 1920×900 screen pushed 83 pixels of your project
description below the fold. That is trading one problem for another.

So the bigger screenshot only appears when there is genuinely room for it — wide *and* tall. I measured where that
line falls rather than guessing: at 900 tall it overflows by 83 pixels, at 1000 by 33, and from 1080 upward it fits
exactly. On a standard laptop nothing changes at all, which is the correct answer rather than a compromise.

The check I am most pleased with: a **2560×900** screen — very wide, but short — correctly gets no change. That is
what proves the rule is tracking actual room rather than just how wide your monitor is.

---

## Cycle 39 — your sabbatical entry is no longer cut off

Eleven cycles ago I widened the text-heavy stops and told you one was still not fixed: the **sabbatical** entry still
had about a fifth of itself below the fold on a desktop, and I said closing that would mean cutting your own words.
It turned out there was another way.

First I checked the obvious idea and ruled it out: give the panel more height. There is none to give. The panel already
fills its space exactly, and that space is squeezed between the rear-view mirror above and the dashboard below — the
clearance to the mirror is 20 pixels on a tall screen, 8 on a standard one, and **2 pixels** on a 1440×800 laptop.
Taking more would mean shrinking the cockpit, which is the thing you asked me to build.

What there was plenty of is **width**. The panel stopped growing at 928 pixels no matter how wide your monitor is — so
on a 1920-wide screen, **more than half the available space sat empty** while the longest entry on your résumé was
still cut off.

I tried it two ways before picking one:

| | hidden | line length |
|---|---|---|
| today | 22% | ~63 characters |
| just make it wider | 6% | ~76 characters |
| **wider, plus a third column** | **nothing** | **~56 characters** |

Simply making it wider fixes less *and* makes the lines harder to read. Wider **with a third column** shows all of it
and makes the lines *shorter*. On a 1920 screen the sabbatical entry now fits completely. Your standard 1440 screen,
your project pages and the final destination panel are all deliberately untouched, and phones are unchanged.

**One mistake worth telling you about.** My first version quietly broke the project stops — they shrank from 928 pixels
back to 704. I had written two width rules separated by a comma, which in JavaScript means "work out the first one,
throw it away, keep the second". The build compiled and the linter was happy; nothing flagged it. The only reason I
found it was that I measure a project stop every time I touch this panel. That habit is the whole reason it did not
reach you.

---

## Cycle 38 — the route map was letting you drive away by accident

Open the route map, press the down arrow to scroll the list of exits, and the car pulled away from the stop you were
reading — silently, behind the dialog. I measured it: with the map open, one press of the up arrow took the car out
of EXIT 05 and the page title changed to EXIT 06 while the map was still covering the screen.

The unlucky part is that arrow keys are the obvious way to scroll a list of twenty-one exits. So the natural gesture
for *using* the map was the gesture that lost your place.

While the map is open, the driving keys now do nothing — except Escape and M, which still close it. The arrow keys are
deliberately left alone rather than blocked, so they still scroll the list the way you would expect. And opening the
map lets go of the controls, so if you were holding the accelerator when you opened it, the car does not keep going
behind the dialog. Close it and drive on; I checked that it picks up again normally.

**Also worth knowing, and this one is for you rather than something I can fix.** I looked at what actually gets sent
when someone shares your drive-mode link. The preview image is your **portrait photo**, and the card is the small
square kind rather than the wide one — both inherited from your homepage, because the drive page cannot override
them. That is the same underlying cause as the duplicate canonical tag already on your list: without `key` props in
`_app.jsx`, a page can only *add* tags, never replace them.

So that item is bigger than it looked. It is not one stray tag — it is the single thing standing in front of **four**
improvements: the canonical, a proper drive-mode share image, a wide share card, and the search-engine markup I parked
back in cycle 4. I have not built any of them, because a tag that cannot take effect is exactly the kind of dead code
I have had to remove twice already in this run.

---

## Cycle 37 — checking every year on your résumé, properly this time

The single worst thing this page could do is show a wrong year on your résumé. Early in this run it did: a date written
`2024-01-01` came out as **2023**, because of how JavaScript reads dates in timezones behind UTC. I fixed it and
checked one stop. That was thirty-three cycles ago, and it had never been checked properly since — so this cycle
checked all of it.

I read the dates straight out of your content files first, then compared them against what the page actually shows —
so the page is being checked against your résumé, not against itself.

**The dashboard readout is right at every stop:** 2016 at Pittsburgh, 2017, 2019, 2020, 2023 three times, 2024 twice,
and *NOW* at your current role. Critically, the UI/UX role dated **January 1st, 2024** reads **2024** — that is the exact
entry the old bug moved into the wrong year.

**The hidden copy is right too,** and that one matters more than it looks: it is what Google and screen readers read.
Twenty-one entries for twenty-one stops. Ten carry a year, all correct, with the machine-readable date matching the
visible one every time. **Eleven carry no year at all** — your eight side builds, the toolbox, the destination and the
start line — because those have no date in your content, and nothing on the page invents one for them.

One detail that looks like a contradiction and is not: your current role shows **2025** in the hidden copy and **NOW**
on the dashboard. The first is stating a fact; the second is saying "this is where you are". Both are correct.

**Nothing changed this cycle,** and that is the result. This is the property the whole page exists to get right, and it
is now verified end to end rather than assumed.

---

## Cycle 36 — your American highway sign was counting down in metres

Watching what the green exit sign actually displays as you drive toward it:

`0.14 MI -> 0.13 -> 0.12 -> 0.11 -> 0.10 MI -> **159 M** -> 154 M -> 146 M`

It starts in miles and finishes in **metres** — on an interstate guide sign, in a car whose speedometer reads mph and
whose odometer reads MI. It also disagreed with the sign **you** wrote: the one on your homepage that leads into drive
mode says *"1/4 mile"*.

It now reads feet the whole way down, from **720 FT** as you pull away to the low hundreds as you roll up. One unit,
imperial, consistent with everything else on the dash and with your own sign.

**What I deliberately didn't do:** the obvious flourish is a proper sign ladder — *1 MILE, 1/2 MILE, 1/4 MILE* — which
is how real advance signage works and would have read beautifully. It can never happen here. The gap between your
exits is 220 metres, which is 0.137 of a mile, so the sign is only ever visible at distances **below** a quarter mile.
That code would have sat there looking correct and never once run. That is exactly the bug I fixed six cycles ago,
where the sign's fade-in turned out to be unreachable for the same reason, so this time I checked before writing it
rather than after.

I also tested something that had never been tried: **resizing the browser window while the car is moving**. It holds
up — the drive keeps going and arrives, the road redraws at the new size, the dashboard re-proportions itself, and
the panel that opens at the exit lands fully on screen.

---

## Cycle 35 — checking that the three things I'm asking *you* to do are still true

The three items waiting on you have been sitting there since cycles 4 and 10 — about 25 cycles. In that time you have
had your own uncommitted edits in that part of the tree. Notes go stale, and a patch that no longer applies is worse
than no patch: it costs you an hour and then makes the whole analysis look unreliable. So this cycle re-checked all
three against the files as they are **today**, not against my own notes.

**All three still hold.**

**Your project photos on the main site.** Still cropped, still click-only. I re-measured the crop from the image files
themselves rather than trusting the earlier number: **28 of 28 screenshots** are wider than the 16:9 frame they are
forced into, losing an average of **10.2%** of their width — worst case 14.2%, on `rift/2.png`. (My earlier note said
10.1%; corrected.) Every line number in the suggested patch still points where it should.

**The duplicate canonical tag.** This time I read the HTML your server actually sends rather than reasoning about how
Next.js merges tags, and it is worse than "there are two of them". `/drive` sends the **homepage's** canonical first
and its own second — and search engines honour the first one they see. So right now the drive page is telling Google
*"I am the homepage"*.

**The sitemap.** It contains exactly one URL. Your site has exactly two pages worth indexing, `/` and `/drive`, so this
is not one page missing from a long list — it is half the site. And it compounds with the tag above: even if a
crawler stumbled onto `/drive`, that first canonical would send it away again.

**Nothing was changed this cycle, and nothing should have been** — all three live in files outside the boundary you set
for this run, which is exactly why they are parked for you rather than done by me. The point of the cycle is that when
you do sit down with them, the line numbers and the numbers are right.

**One thing I got wrong along the way,** since I would rather tell you than not: while checking whether that Projects
file was even still in use, my own search command excluded the one line that proved it was, and for a few minutes I
believed I had found something dramatic — that the most important item on your list pointed at dead code. It does not.
The file is live and the patch is aimed correctly. That is the third time in this run that my *measurement* was the
broken thing rather than the code.

---

## Cycle 34 — finishing the keyboard story, and closing an old question

Last cycle added a "Skip to the drive controls" link, which helps anyone who takes it. But someone who keeps pressing
Tab still walked twenty-five stops through the invisible résumé with nothing on screen to show where they were. This
cycle finished that, and settled something that had been sitting unanswered since cycle 12.

**First, the old question: do your controls show a focus outline?** Back in cycle 12 a check reported that none of them
did. I suspected the test was at fault rather than the site — browsers only draw that outline for genuine keyboard
use, and my test was faking it — but I could not prove it either way and left it open. Now I can: fourteen real Tab
presses, and **every single control shows the browser's focus ring**. Nothing on the page suppresses it. That alarm
was false, and it is now closed properly rather than assumed away.

**Second, the invisible stretch.** The obvious fix is the same trick the skip link uses — let the focused item pop into
view. It turns out that cannot work here, and finding out why was the useful part. The skip link can reveal itself
because *it* is the hidden element. The résumé links are hidden by their **container**, and a child cannot climb out of
its parent's hiding. I tested it directly rather than guessing: forced one of those links to jump to the top-left
corner, and while the browser agreed it was now an 85×38 box at that spot, checking what is actually painted there
returns the road behind it. The link was still nowhere.

The alternatives were worse: unhiding the container dumps your entire résumé across the driving scene, and changing how
that block is hidden means rebuilding the one machine-readable copy of your résumé on a hunch.

So instead of dragging the link into view, the page now **tells you where you are**: a small label in the corner reading
*"Résumé outline: GitHub"*, which follows along as you tab and disappears the moment you reach a real control. Screen
reader users are unaffected — they already hear each link, and the label is deliberately silent so they do not hear it
twice. Mouse users never see it at all.

**One thing I nearly got wrong.** My first check said the new label was hidden behind the road. It was not — I had made
it click-through, so that it could never block a button, and click-through also makes it invisible to the *test* I was
using. The label was on screen the whole time. Worth mentioning because it is the second time this run that a
measurement, not the code, was the thing that was broken.

---

## Cycle 33 — pressing Tab did nothing visible twenty-five times

If someone opens `/drive` and navigates with the keyboard — no mouse, which is how a lot of people work, and how
recruiters using assistive tech often work — the first thing they did was press **Tab twenty-five times with nothing
happening on screen**.

The cause is a feature, not an accident. Behind the driving scene there is a plain-text copy of your entire résumé,
invisible to the eye but readable by screen readers and search engines. It contains a link for every stop — LinkedIn,
GitHub, your résumé PDF, both certificates, the live site and source for all eight builds, and the four at the
destination. Twenty-five links. They are hidden by clipping them to a zero-sized window, which hides them from *eyes*
but not from the keyboard. So focus really was moving — onto things clipped down to nothing. The focus outline was
being drawn where nobody could see it.

The tempting fix is to make those links unreachable by keyboard. That would have solved it for sighted keyboard users
by breaking it for screen-reader users, who need exactly those links — that block is their version of your résumé, and
their only way to your project links without driving there.

So there is now a **"Skip to the drive controls"** link: invisible until you Tab to it, at which point it appears in
the top-left corner. One press and you are at the cockpit; the next press puts you on a real button. **Twenty-five
presses down to one**, with the hidden résumé exactly as complete as it was.

**Two things worth telling you about how this went.** First, my initial two attempts to verify the fix reported that it
had failed — the link stayed invisible when I focused it. The code was fine: a browser only lights up `:focus`
styling when the page itself is the focused window, and mine was not. I had to click into the page for real and press
real Tab and Enter keys before the test meant anything. Second, I also checked something unrelated while I was in
there — whether the page slowly accumulates work as you drive through the twenty-one exits. It does not: exactly 13
per-frame subscribers at the start, and exactly 13 after twelve stops.

---

## Cycle 32 — going looking for the bug I keep finding by accident

Five times now I have found the same kind of fault in this codebase: a number typed into one file that has to match a
number kept in another, with nothing making sure they agree. The dashboard height. The car's sideways position. The
bonnet. The exit sign's approach. Nightfall. Each one was found by accident, while looking at something else.

Since every file has now had a proper read-through, this cycle went looking for it on purpose — listing every fixed
number in the drive code and asking, one at a time, whether it has to agree with something it cannot see. Most do not.
**Three did**, and all three were correct today and would have broken quietly later:

- The **sky** had its own copy of how finely the colour fade is stepped. Change the fade to be smoother and the sky
  would have kept updating at the old rate — visibly banding and lagging while the road, which reads the same colours
  every frame, kept up.
- The **mile markers** were spaced at 110, under a comment promising they sit *"half a leg"* apart. A leg is 220. Right
  by coincidence, with nothing keeping it right.
- **Top gear** ended at 42 next to a top speed of 42. Raise the top speed alone and the rev counter would have sat
  pinned at the redline for the whole of top gear.

All three now read the real value from the one place that owns it.

**The interesting part of this cycle is the proof, not the change.** Because all three produce the same numbers today,
the only acceptable outcome was that *nothing whatsoever* changed on screen. So I photographed the rendered road
before and after at two different exits and compared every pixel: **0 of 4,096,000 different**, both times, with the
sky readings identical to the last decimal and the speedometer curve unchanged.

Nothing here will look different to you. It means the next time one of those numbers moves, the things that depend on
it will move with it instead of drifting apart.

---

## Cycle 31 — nightfall was arriving in the wrong place

The drive passes time as well as distance: golden hour as you pull onto the highway, dusk across the career stretch,
full night at the toolbox, and the first hint of dawn as you arrive. That last beat is the point — the final stop is
the one that asks what comes next.

Full night was landing in the wrong place. The code anchors it at 92% of the route and labels that "the toolbox", but
the toolbox is exit 19 of 20 — **95%**. 92% is exit 18.4: halfway down a stretch of road where nobody stops. So the
darkest, most night-like moment of the whole drive was happening while you were still moving, and by the time you
parked at the toolbox the sky was already **37% of the way into dawn**.

The measurements are what gave it away — exit 14 had a *brighter* moon than exit 19. The sky was getting lighter
before the stop that is supposed to be darkest.

That anchor now comes from where the toolbox actually is, so adding a role or a build can't pull the two apart again.
At the toolbox the stars and moon are now at full strength against the authored night palette, exit 18 climbs toward
it, and your arrival still opens into exactly the same first light as before — the dawn just happens over the final
leg, where it belongs.

**Nothing about the colours changed** — only when they arrive.

This was also the last of the fifteen drive files to get a proper read-through. The rest of that audit came back clean:
the palette machinery is safe, the star field is stable between server and browser, and the "reduce motion" setting
already silences every animation in the stylesheet — including two that my earlier accessibility sweep hadn't looked at.

---

## Cycle 30 — the exit signs weren't fading in — they were popping

The green highway sign for the next exit is supposed to fade up out of the dark as you approach it, and its face is
supposed to catch your headlights more and more as you get closer. That flare is the thing that makes it feel like
you're driving toward something rather than watching a picture get bigger.

It wasn't doing the first part at all. The sign was written to become visible from 420 metres away and fade in over
160 of those — but the gap between your exits is **220 metres**. You are never further than 220m from the next sign,
which means the fade had already finished before you started. Measured on a real leg: the sign reported **full
opacity on the very first frame after pulling away**. It popped into existence, already lit.

Same cause, second symptom: the headlight flare was scaled to that same 420m, so it started about a quarter of the way
through its sweep rather than at nothing.

Both numbers now come from the actual distance between your exits, so if that spacing ever changes they follow it
instead of drifting apart again. On a real leg the sign now starts at **0.4% opacity**, fades up, and is fully solid
about halfway along — well before you need to read it — while the flare builds from nothing to its brightest just as
you arrive.

This is the fourth time this run has found the same *kind* of bug: a number typed in one file that had to agree with a
number in another, and quietly didn't. The dashboard height, the car's sideways position, the bonnet, and now the
sign. Each fix replaces the guess with the real value.

**One honest note:** I could not get you a screenshot of the sign mid-approach — by the time a capture is timed the car
has arrived and the panel covers that part of the screen. The measurements are the evidence here, not a picture.

---

## Cycle 29 — checking that eight cycles of changes didn't quietly break something

No new work this cycle — deliberately. Some visitors set their device to "reduce motion" (people who get motion
sickness, migraines, or vestibular symptoms from things sliding around). The site respects that: no auto-playing
screenshot carousel, no panel swooping in, and pressing **Next** jumps straight to the exit instead of driving there.

I last actually tested that in cycle 11. Since then I have rebuilt the paint loop, the dashboard layout twice, the
start screen, the route map and the arrival panel. That is a lot of ground to move under a promise without re-checking
it, so this cycle re-checked it.

**It all still works:**

| what should happen | with reduce-motion on | normally (my control) |
|---|---|---|
| screenshots don't auto-play | held on the first one for 9 seconds | cycled through three |
| panel doesn't swoop | faded in, no movement at all | tilts and slides in as designed |
| Next doesn't drive you | jumped there in **0.1 seconds** | drove the leg in **9.9 seconds** |
| road stops redrawing when parked | 0 redraws in 9 seconds | — |

The control column is the part that makes this trustworthy. "No animation happened" is exactly what you'd also see if
my test simply hadn't worked, so I ran the same checks with motion allowed and confirmed the same code does animate.
It does.

**Nothing was changed, and I'd rather say that plainly than dress it up as work.** The result is the finding: eight
cycles of layout and rendering changes left that promise intact. I also wrote the test method down — including a
trap that made my first attempt silently report success while actually testing nothing — so a future pass can re-run
it cheaply.

---

## Cycle 28 — I opened all 21 exits, and gave your words the same room as your screenshots

Across twenty-seven cycles I had only ever opened about seven of the twenty-one exits individually. So this pass
opened **every one**. The good news first: it is clean. Every stop renders, the counters run 1/21 to 21/21, **all 28
of your screenshots load**, the links are where they should be, and there was not a single console error on the whole
route. That is the first end-to-end proof that the content itself is sound.

**What it did turn up is that your writing was getting less space than your pictures.** On a 1440×900 laptop, a stop
with screenshots widens to 925 pixels. A stop with only text stayed at 704 — and three of them ran off the bottom:

| exit | stop | hidden below the fold |
|---|---|---|
| 04 | Sabbatical / COVID / Family | **40.9%** |
| 19 | Pit stop — the toolbox | 20.5% |
| 10 | Senior MES DevOps Engineer | 15.1% |

Two fifths of the sabbatical entry — the one that explains a gap on a résumé, so probably the one you least want
missed — sat below a fold, while 736 pixels of the panel area went unused on either side.

The obvious fix is "make it wider", and I measured that and turned it down: it fixes the fold but stretches your lines
to about 135 characters, which is genuinely hard to read. Making it wider **and** letting the text flow in two columns
fixes the fold *and* brings your lines down to about 63 characters — better on both counts. Two of the three stops now
hide nothing at all; the sabbatical drops from 40.9% to 22.4%. Your project stops and the final destination panel are
deliberately untouched, and phones stay single-column.

**One thing I got wrong first, and how it surfaced.** My initial build added a rule to stop blocks splitting across
columns, which sounded sensible. It made things *worse* — the toolbox went from hiding 84 pixels to 261 — because a
block that cannot split cannot balance either. I only knew because I re-ran the measurements against the actual build
rather than trusting the earlier trial. Scoped down to individual list items, it does what the trial promised.

**Still not perfect:** the sabbatical entry hides about a fifth of itself. Closing that gap would mean shortening your
own words, which is your call and not mine.

---

## Cycle 27 — the route map didn't show you where you were

The route map — the list of all twenty-one exits you can jump to — highlights the exit you are currently at. That
highlight is the map saying *this is the bit you care about*. And then it opened at the top of the list every single
time, with your actual position somewhere off-screen below.

| screen | you are at | rows you can see | how far down you were |
|---|---|---|---|
| phone, sideways | exit 13 | **3** of 21 | 803 pixels |
| phone, upright | exit 13 | 11 of 21 | 357 pixels |
| desktop | exit 20 | 12 of 21 | 791 pixels |

On a phone held sideways you could see three rows out of twenty-one, so finding yourself meant scrolling most of the
list before you could even decide where to go next. It now opens centred on the exit you're at, with its neighbours
either side. Mile 0 still opens at the top, because that is already where you are.

**I got this wrong on the first attempt, and I want to be straight about how it got caught.** The obvious way to
measure "where is this row" gave an answer that was 111 pixels off, because of a detail about how the list is
positioned — so the first build scrolled your exit clean *past the top* of the window instead of to the middle. What
exposed it was two of my own checks disagreeing: one said the row wasn't below the fold, the other said it wasn't
visible. Both were true, which meant it had gone the other way. I rewrote the calculation to use a measurement that
can't drift like that rather than nudging a number until it looked right.

I also re-checked the things this change sits next to rather than assuming they still worked: opening the map still
puts focus on the dialog itself, Escape still closes it, and focus still returns to the button you opened it with.

---

## Cycle 26 — the way out was falling off the bottom of the start screen

The start screen — *"The résumé, from the driver's seat"* with the **Start engine** button — is the first thing anyone
sees, and it turns out nobody had ever measured it on a phone. The arrival panel and the cockpit have both been
checked at phone sizes; the screen that comes before them never was.

**And it only breaks for people who come back.** If you've visited before, that screen gains two extra controls —
*Resume · EXIT 13* and *Forget my progress*. On a phone held sideways that is enough to push the whole thing past the
screen:

| screen | content | what fell off |
|---|---|---|
| 390×844 upright | fits | nothing |
| 844×390 sideways | 394 in 390 | bottom of the exit link |
| 667×375 sideways | 393 in 375 | most of the exit link |
| 568×320 sideways | 468 in 320 | the whole exit link, **and the heading off the top** |

That link is the *only* way out of drive mode while the start screen is up — it sits on top of the small "exit" link
in the corner — and the page deliberately doesn't scroll, so there was no way to get it back. A returning visitor on
a small phone could start the drive but not leave it, except with the browser's back button.

It now fits outright on both common landscape phones (the content came down from 394 pixels to 300), and on the very
smallest screens it scrolls so nothing is stranded.

**One detail I want to flag, because getting it wrong would have looked like a fix.** The obvious repair is "make it
scrollable". That alone would not have worked: the content was *centred*, and a centred item that grows past its
container gets pushed to a position no scrollbar can reach. So the centring had to move onto an inner wrapper first.
Without that, the heading would have gone from clipped to genuinely unreachable, and the measurement would still have
said "scrollable".

Your upright-phone and desktop start screens are unchanged, measured position by position.

---

## Cycle 25 — the dashboard screen was drawing on top of the buttons

Last cycle's landscape-phone screenshot left me with a hunch that the little green terminal on the dash looked off. A
hunch is not a finding, so this cycle measured it.

On a phone held sideways, that screen had **20 pixels** of space for **54 pixels** of content. And because of how it
was styled it did not crop — it drew straight past its own border, over the buttons underneath. The line that tells
you **which exit you are at** had been squeezed to zero height and vanished; so had the progress bar. What you could
still see — the bar and the year — was painting outside the box, which is precisely why it looked *slightly* wrong
rather than obviously broken.

The cause was arithmetic, and I measured it rather than guessing: the dash gets 190 pixels on that screen; the
instrument strip was taking 74, the buttons 62, and the terminal got whatever was left — 20 — for something that needs
54. It never fit, so the layout quietly collapsed instead of complaining.

The 190 pixels are now shared properly, and **only on short screens**: a slightly smaller speedometer, tighter
spacing, slightly shorter pedals, and the decorative `~/route $ drive --to` prompt line steps aside so the exit name,
the route bar and the year all survive. The terminal went from 20 pixels to 68, the exit line is back, and the bar is
back.

**What I did not do:** the easy fix would have been to delete the speedometer or the screen on a landscape phone. That
would have made my measurements clean and quietly given up the thing you actually asked for — a dash that looks like
a car. Everything is still there, just sized for the screen.

Your desktop and portrait-phone cockpits are untouched, and I checked that rather than assuming it: same box, same row
heights, before and after.

---

## Cycle 24 — the car lost its bonnet on a phone

Your priority (a) again, and this one is the same bug that has now bitten this branch three times.

The dashboard's height is a formula: 36% of the screen, but never less than 190 pixels. The bonnet, the dash
reflection on the glass and the parked wipers were positioned separately, at fixed percentages picked to line up when
that formula lands on 36%. Below about 528 pixels of screen height the 190-pixel floor takes over, the dash grows —
and the furniture stays where it was, behind it.

Measured at the same exit:

| screen | bonnet visible |
|---|---|
| 1440×900 desktop | 49 of 54 pixels |
| 1024×500 short laptop | 17 of 30 |
| 844×390 landscape phone | **0 of 23** |

Turn a phone sideways — which is the natural thing to do with a driving interface — and the car's own bonnet was gone
completely, along with the reflection and the wipers. The bonnet is the single element that makes the view read as
*sitting in a car looking over its nose*, and it vanished on the one screen where the cockpit is already tightest.

The dashboard's height is now written down **once** and everything that has to line up with it reads that one value:
the dash, the arrival panel's bottom edge, and the bonnet, reflection and wipers. That is the same fix I applied after
the landscape-phone overlap bug in cycle 12 — this was the third copy of that number quietly disagreeing with itself.

On the landscape phone the bonnet went from **0 to 24 of 26 pixels visible**, with the reflection and wipers fully
back. And your desktop cockpit is untouched: I captured the bonnet's exact box before and after and it lands on
precisely the same pixels, which is the point — this was a correction, not a restyle.

---

## Cycle 23 — the last thing a recruiter sees, on the device they see it on

This one is your priority (b), and it turned out the destination panel had **never** been opened on a phone in this
whole run. The rule to check it at phone size has been in my notes since the first cycle; cycle 12 checked other
panels there and this one slipped through.

**Your call to action was cut in half.** At the final exit on a 390-wide phone, the panel's content ran 12 pixels past
its scroll edge — and those 12 pixels went straight through the middle of *"Download résumé"* and *"Back to the
classic site"*. It scrolled, so nothing was unreachable, but the moment the whole drive builds toward — after
twenty-one exits — looked broken.

The culprit was specific: the destination is the only stop with the trip summary, and on a narrow screen its four
figures stacked into a 2×2 block 112 pixels tall. They now run **four across** at every width, at 65 pixels, with the
labels wrapping instead of being abbreviated — those numbers come from your content and I am not going to shorten
"MILES DRIVEN" into something that could mislead. Everything on the destination now fits with no scrolling at all,
and your desktop layout is untouched (I measured it column by column before and after).

**And the cockpit was stranding a button.** On the same screen the four controls were laid out across four different
lines, with the audio toggle sitting alone in the bottom-left corner like it had been dropped there. The row needed
253 pixels and had 242. That came back from spacing — padding, gaps, letter-spacing — so nothing is renamed and no
button got smaller than the tap-target minimum. One clean row now, at 390 and at 360.

**One thing I did not fix, and why.** On a 667-pixel-tall phone (an older iPhone SE) the destination still runs 38
pixels long and scrolls. Fitting it there would mean cutting actual content, and scrolling is the correct behaviour
for a panel that genuinely has more to say than the screen has room for. I'd rather tell you that than quietly delete
a sentence.

---

## Cycle 22 — back to the screenshots, and two things around them

Your priority (c) — screenshots showing whole and cycling themselves — has been working in drive mode since the first
cycle, and I hadn't looked at it since. It holds up: the captures show complete in a little browser window with the
real URL in the address bar, they cross-fade on their own every few seconds, they pause when you hover or tab into
them, and they hold still for anyone who's asked their system for reduced motion. But two things *around* them were
measurably wrong.

**A screen reader heard four screenshots where you see one.** The captures are stacked on top of each other and faded
between — and fading something to invisible does not hide it from a screen reader. So at the Co.Lab exit, someone
listening to the page was told "screenshot 1 of 4", "screenshot 2 of 4", "3 of 4", "4 of 4", for a single picture.
Only the one actually on screen is announced now.

**The little dots under the screenshots were 6 pixels wide.** The guideline minimum for something you tap is 24. That
carousel shows up inside the arrival panel on a phone, so those dots were effectively decoration you couldn't use. Each
one now has a proper 24-pixel target around it — the dots themselves are exactly the same size, they just sit a bit
further apart.

**One note on how that second one went**, because it's the sort of thing worth being straight about. My own plan said
the fix must not move the visible dots at all. Building it, that turned out to be impossible: 6px dots with a 6px gap
sit 12px apart, and the accessibility rule can be satisfied either by big enough targets *or* by enough spacing — at
12px apart, both fail. There is no version of this that doesn't take more room. So I amended the rule in the notes with
that reasoning attached, rather than quietly shipping against it and saying nothing.

---

## Cycle 21 — the road was redrawing itself for nobody

When you're parked at an exit reading it, the road ahead isn't moving — but the page was still redrawing the entire
scene, sixty times a second, into a canvas the size of your screen. I measured it before touching anything: **130 full
repaints in 130 frames** over five seconds, all producing the identical picture. If you leave the tab open while
reading, that is your laptop fan for no reason at all.

It now stops painting when nothing that affects the picture has moved. Parked and settled: **0 repaints in 140
frames.** Driving is untouched — still every frame. Resize still redraws. Steer while parked and it redraws, because
then the picture genuinely *is* changing, and settles back to zero when the car finishes drifting into lane.

Two things made this less trivial than it sounds, and both are the kind of detail that turns an "optimisation" into a
bug. A plain "has anything changed?" check would have skipped **nothing**, because the car's sideways position keeps
decaying toward centre by ever-smaller amounts and never repeats a value — so the test is a tolerance of a tenth of a
millimetre, about a thirtieth of a pixel. And the check compares against the last frame *actually painted*, not the
previous frame, because otherwise slow movement would be dismissed as "no change" every frame and the road would
freeze while you were driving.

To be sure it changes nothing you'd see, I captured the rendered road before and after: **0 of 4,096,000 pixels
differ.**

Worth noting how this one got here: I found it five cycles ago and deliberately **didn't build it**, because at the
time I had no way to prove it helped, and an unmeasurable optimisation in code that runs every frame is how things
quietly get worse. Once the browser window was properly available, the measurement became possible and it shipped the
same cycle.

---

## Cycle 20 — everything that was "waiting for a real window" is now checked

Three things had been sitting unverified for most of this run — not because they were broken, but because a browser
window that is never actually in front of you can't animate, can't hold focus, and won't let a page make sound. This
cycle the window was properly foregrounded, so all three got measured. **None of them needed fixing.**

**The engine really does sound like an engine.** This one had been parked the longest, and the reason was subtle: a
click made *by a script* doesn't count as you clicking, so browsers refuse to start audio for it. With a genuine click,
the audio starts, and I could read the actual synthesiser while driving:

| | engine note | octave above | filter | tyre noise |
|---|---|---|---|---|
| idling at a stop | 43.8 Hz | 87.7 Hz | 692 Hz | none |
| pulling away | 65.4 Hz | 130.7 Hz | 1113 Hz | rising |
| at speed | 71.6 Hz | 143.1 Hz | 1284 Hz | rising |

The note climbs with the tachometer, the harmony stays exactly an octave above it, the tone opens up as the engine
works, and tyre roar builds with speed. Switching it off fades it to true silence. It is doing everything it claimed.

**Frame rate: the driving isn't what costs you.** Driving holds a steady 29.9—30.0 fps across three separate samples —
while *sitting parked* manages only 17—22. That inversion is the useful part: an idle page can't be slower than a busy
one, so the ~30 ceiling belongs to this machine (an empty animation loop on your homepage measured 28), not to the
road. The drive loop keeps up with everything the environment will give it. I'm not claiming 60fps on your hardware —
I'm claiming driving costs no measurable frames over standing still.

**And the route map gives focus back.** Tab to it, open it, press Escape — focus lands back on the button you opened it
with, which is what makes it usable without a mouse.

**Nothing is parked behind a browser window any more.** That list is empty for the first time tonight.

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

**Nothing — this list is empty.** Frame rate, engine audio and route-map focus were all cleared in cycle 20; the
re-centred dash at narrow widths was cleared in cycle 19.
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
