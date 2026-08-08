# Suggestions ledger (overnight-suggestions-2026-08-05.md)

Every idea the Suggester generates, what happened to it, and a box for you to sign off. Append-only; the loop reads
this before each Suggester pass so it never re-proposes an idea already here.

**Status flow:** `Proposed` -> `Planned` -> `Built` -> `Done` / `Failed (back to Backlog)` / `Needs human` / `Discarded`.

## Ideas

- [ ] **S1 — Project screenshots display in full instead of being hard-cropped** — Status: Done — Cycle: 1

  - **Source:** site audit — `http://localhost:3001/drive`, EXIT 11 "Solar Power Indy". The screenshot renders as a short letterbox strip showing only the top band of the image. Code: `src/components/drive/StopCard.jsx:52-57` (`h-28 sm:h-36` + `object-cover object-top`).
  - **Suggestion:** render each screenshot inside a fixed-aspect frame with `object-contain` on an intentional backing, so the whole capture is visible.
  - **Why / expected impact:** the screenshots are the only proof of the work; cropping them to a sliver wastes the strongest content on the page. Directly user-reported.
  - **Scope:** small — `StopCard.jsx` + a new component. Low risk.
  - **Outcome:** **Shipped** in `8883aaa`. Measured all 28 PNGs on disk first — they are 1.95-2.07:1, so the frame is a 2:1 viewport with `object-contain`. Evidence: the full Solar Power Indy capture rendered edge to edge in Chrome at EXIT 11, where previously only its top ~25% was visible.

- [ ] **S2 — Auto-cycling screenshot carousel with a smooth cross-fade** — Status: Done — Cycle: 1

  - **Source:** site audit — only one screenshot is ever reachable in drive mode; `src/components/drive/route.js:81-83` maps `project.screenshots[0]` only, while `src/lib/projects.js` lists 2-5 per project and the files exist under `public/images/projects/<name>/`.
  - **Suggestion:** carry all screenshots into the stop and cross-fade through them on a timer, with dot indicators, hover/focus pause, and a reduced-motion fallback.
  - **Why / expected impact:** shows 2-5x more of each project with zero extra clicks; user explicitly asked for automatic cycling with a smooth fade.
  - **Scope:** small-medium — `route.js`, new `ProjectShots.jsx`, `drive.module.css`.
  - **Outcome:** **Shipped** in `8883aaa`. 900ms cross-fade on a 4.2s timer, dot indicators, pointer/focus pause, reduced-motion fallback, interval torn down on stop change. Evidence: successive Chrome screenshots showed the counter advance 4/4 -> 1/4 -> 2/4 -> 3/4 unaided at EXIT 11, and 5/5 at EXIT 12. The reduced-motion path is still untested — see Needs testing.

- [ ] **S3 — Rebuild the arrival panel so it reads as part of the car, not a floating rectangle** — Status: Done — Cycle: 1

  - **Source:** site audit — at 1440x900 the panel overlaps the rear-view mirror (panel at `top-[13%]`, mirror at `top-[6.5%]`, `CarInterior.jsx:26-36`); its content is a single narrow column so a screenshot and its description compete for the same width.
  - **Suggestion:** give it an interstate-style exit-shield header, a two-column layout on wide screens (media | text), and placement that clears the mirror.
  - **Why / expected impact:** the panel is where every piece of résumé content is actually read — it should be the most finished thing on screen. User explicitly asked for this.
  - **Scope:** medium — `StopCard.jsx`, `drive.module.css`, placement in `DriveScene.jsx`.
  - **Outcome:** **Shipped** in `8883aaa`. Interstate exit shield + leg + counter header, media|prose split at `lg`, and it now projects up from its bottom edge instead of fading in place. Evidence: at 1920x895 the panel's top edge is y=118 and the mirror ends at y=100, so the audited overlap is gone.

- [ ] **S4 — Rebuild the cockpit around real driver geometry ("the engineer's cockpit")** — Status: Done — Cycle: 1

  - **Source:** site audit — the steering wheel renders at ~33% of viewport width while the road's vanishing point is at 50%, so the wheel is not in front of the driver; the gauges float at dash level to the wheel's right instead of sitting in a binnacle behind it; there is no hood, no vents, no warning lights, and the dash is a flat dark gradient (`Dashboard.jsx:334-424`, `drive.module.css:63-74`).
  - **Suggestion:** put the wheel on the driver's axis with a hooded instrument binnacle behind it, add the car's hood below the glass, a warning-light row, a centre screen styled as a terminal, and amber/terminal-green accents — an instrument-dense telemetry machine matching a Senior MES DevOps Engineer's identity.
  - **Why / expected impact:** the cockpit is the frame around every other element; if it doesn't read as a car the whole conceit falls flat. User explicitly asked for this.
  - **Scope:** large — `Dashboard.jsx`, `CarInterior.jsx`, `drive.module.css`. Highest risk of crowding the road; guardrail 3 in the tasks file bounds it.
  - **Outcome:** **Shipped** in `646b717`. Wheel on the driver's axis with a hooded binnacle behind it, moulded dash grain, cowl lip, vents, bonnet, meaningful tell-tales, PRND, a terminal-styled centre screen, tilted pedal pads, and a separate stacked cockpit for phones. Evidence: a live driving frame at 1920x895 showed 35 MPH, tach up, `P R N D 3` with D lit, CRUISE lit under autopilot, and the screen counting down `EXIT 12 · Matrimoni  0.1 MI`; at 386x840 the phone layout had no horizontal overflow. Guardrail 3 held — glass is 573px of 895 (64%). Two real defects were found and fixed en route (see the log).

- [ ] **S5 — Ambient drive audio (engine note, turn-signal tick), muted by default** — Status: Done (audible output Needs testing) — Cycle: 9

  - **Source:** market research — driving/scroll-story portfolios commonly pair motion with a subtle audio layer; absent here entirely.
  - **Suggestion:** a muted-by-default speaker toggle on the dash, with a synthesized engine note tied to `sim.rpm`.
  - **Why / expected impact:** large presence gain for a small surface; must stay opt-in so it never autoplays.
  - **Scope:** medium; Web Audio only, no new deps. Deferred to Backlog this cycle.
  - **Outcome:** **Shipped** in `655a3ce`. Two oscillators through a lowpass follow the revs, filtered noise follows speed; all synthesised, no download, no dependency. Off by default, built only inside the toggle's click handler, and deliberately **not** persisted so nothing can autostart on a later visit. Verified by spying on the `AudioContext` constructor: zero before any gesture, exactly one after, reused across toggles, `closed` on unmount, no audio key in storage. Verification also caught the toggle lying — it lit up even when the browser refused to resume — so `enable()` now reports whether audio really started. **Audible output itself is still untested** (a synthetic click grants no user activation); see Needs testing.

- [ ] **S6 — Time-of-day lighting that advances along the route** — Status: Done — Cycle: 2

  - **Source:** site audit — the scene is permanently night (`RoadCanvas.jsx:17-27` fixed colour table, `Sky.jsx` stars).
  - **Suggestion:** interpolate sky/tarmac/lamp colours from dawn at MILE 0 to night at the destination, so the drive visibly passes time as it passes years.
  - **Why / expected impact:** makes the route feel like a journey rather than a loop of the same frame.
  - **Scope:** medium-large; touches the canvas colour tables. Deferred to Backlog.
  - **Outcome:** **Shipped** in `dd4b28b`. Chose a narrow dusk-to-night band rather than a full day cycle, so the night-tuned art survives; the destination gets the first hint of dawn because it is the stop that asks what comes next. Evidence: star opacity read live at 0 / 0.23 / 0.95 / 0.6 across four points on the route, with screenshots confirming golden hour, full night and first light. Performance measured both ways — 34.2fps with the palette vs 26.6fps at baseline, so no regression.

- [ ] **S7 — Mobile driving ergonomics pass** — Status: Done (superseded by the cycle-1 phone cockpit) — Cycle: 2

  - **Source:** site audit — pedals are 62-72px buttons pinned to the right of the dash grid (`Dashboard.jsx:404-423`); untested at 390px where the dash also has to hold the trip computer and three console buttons.
  - **Suggestion:** a thumb-reachable control layout at small widths.
  - **Why / expected impact:** drive mode is unusable on a phone if the controls don't fall under a thumb.
  - **Scope:** medium. Deferred until task 4 settles the dash layout.
  - **Outcome:** **Resolved** by the phone cockpit in `646b717`: at small widths the dash stacks (cluster strip / terminal / controls and both pedals in one thumb-reachable row) instead of laying out side by side, which is what was overflowing. Verified at 386x840 with no horizontal overflow and every control inside the viewport. Closing this rather than carrying it — reopen only if real thumb testing on a device finds a problem.

- [ ] **S8 — Persist route progress to `localStorage`** — Status: Done — Cycle: 8

  - **Source:** market research — long interactive narratives normally let you resume; here every visit restarts at MILE 0 (`useDrive.js` initialises fresh).
  - **Suggestion:** remember the furthest exit reached and offer "resume from EXIT n" on the ignition screen, with a reset.
  - **Scope:** small-medium. Deferred to Backlog.
  - **Outcome:** **Shipped** in `86d0174`. Exit number moved to a plaque above the right corner, twin supports, a retroreflective face that flares as the headlights reach it, and a green taken from the route palette so it sits right at both dusk and midnight. Verified mid-approach at dusk and, with the brake held to freeze it, at night. The _mile markers_ half was carved out as backlog item S9b — it needs new drawing in the canvas roadside pass.

- [ ] **S9 — Exit-sign realism pass (MUTCD-style shields, counting-down mile markers)** — Status: Done (mile markers split to S9b) — Cycle: 2

  - **Source:** site audit — signage is the metaphor's anchor but `ExitSign.jsx` was not yet read in this cycle, so this is proposed on the strength of the concept, not a code reading.
  - **Scope:** small-medium. Deferred to Backlog.
  - **Outcome:** **Shipped** in `86d0174`. Exit number moved to a plaque above the right corner, twin supports, a retroreflective face that flares as the headlights reach it, and a green taken from the route palette so it sits right at both dusk and midnight. Verified mid-approach at dusk and, with the brake held to freeze it, at night. The _mile markers_ half was carved out as backlog item S9b — it needs new drawing in the canvas roadside pass.

- [ ] **S10 — Deep-link a specific exit (`/drive?exit=11`)** — Status: Done — Cycle: 2

  - **Source:** market research — shareable deep links are table stakes for portfolio set-pieces; drive mode currently has one URL for 21 stops.
  - **Why / expected impact:** lets the owner link a recruiter straight to a relevant role or build.
  - **Scope:** small-medium; router wiring in `src/pages/drive.jsx`. Deferred to Backlog.
  - **Outcome:** **Shipped** in `0d3e493`. `/drive?exit=11` opens parked at that exit with the engine already running, and the URL tracks the exit as you travel so it is always copyable. Verified end to end for `?exit=11` and `?exit=999`, with the accept predicate exercised across fourteen junk and boundary inputs.

- [ ] **S11 — Give each leg its own roadside character** — Status: Done — Cycle: 6

  - **Source:** site audit after the daylight work — the route has five named legs but `RoadCanvas.drawRoadside` paints identical lamps and delineators for all 21 stops, so position on the route is invisible from the roadside.
  - **Suggestion:** vary the furniture per leg — denser lighting through the city legs, a guardrail on the scenic overlook, sparse open road elsewhere.
  - **Why / expected impact:** makes where-you-are legible at a glance and stops the middle of the drive feeling repetitive.
  - **Scope:** medium; canvas only, subject to the per-frame allocation guardrail.
  - **Outcome:** **Built** in `c209b57`. The scenic overlook gets a guardrail and a thinned lamp line; the sabbatical thins further. Style is resolved once at module load and keyed off each object's own world position, so nothing changes character as you approach it. Mapping proven by SSR probe across all 21 stops; build and lint clean. **Pixels verified in cycle 6** once the browser blocker cleared: against a production build the guardrail renders along the right verge of the Scenic overlook as one continuous ribbon with **no anti-aliasing seams**, the lamp line is visibly thinner there and thinner again across the sabbatical, and there is no guardrail elsewhere. Nothing pops on approach. Only frame-rate remains unmeasured (rAF is paused in a background tab).

- [ ] **S12 — Odometer that reads in years, not just miles** — Status: Done — Cycle: 3

  - **Source:** site audit — the trip computer counts miles, but the route is chronological and education/experience stops already carry dates.
  - **Suggestion:** show the year you are driving through beside the odometer.
  - **Why / expected impact:** ties the metaphor to the résumé far more directly than distance; a recruiter reads "2019" faster than "1.4 MI". Needs a date added to project stops in `route.js`, which currently have none.
  - **Scope:** small-medium.
  - **Outcome:** **Shipped** in `94eea90`, and it earned its keep twice over. The readout counts 2016 -> 2025 across school and the nine roles, ticking over _between_ exits (2021 and 2022 pass while crossing the sabbatical), then reads `NOW` for the side builds, the toolbox and the destination — which have no dates, so they never get a fabricated one. Verifying it also **uncovered a live data bug**: `new Date('YYYY-MM-DD').getFullYear()` reads UTC midnight in local time, so the StarPlus UI/UX role (`2024-01-01`, labelled "Jan 2024 - Oct 2024") was reporting **2023**. Fixed.

- [ ] **S13 — Weather and traffic that belong to the light** — Status: **REVERTED at the owner's request** — Cycle: 13

  - **Source:** site audit after the daylight work — the road is completely empty; nothing else is ever on it.
  - **Suggestion:** a thin drifting haze layer and occasional oncoming headlights on the far carriageway, tinted by the current palette.
  - **Why / expected impact:** makes the road feel inhabited rather than a treadmill, and sells the dusk-to-night transition further.
  - **Scope:** medium; canvas only, must not allocate per frame.
  - **Outcome:** **Traffic shipped** in `ff1f8d9` — headlights on the opposite carriageway, closing at their own speed plus yours so they keep passing while you are parked, deterministic and palette-tinted. Proven by a controlled pixel diff while parked (12,564 samples changed, confined to the approach path). The **drifting-haze half was not built** and returns to the Backlog as S13b: the existing horizon haze already blends the tarmac into the sky, and a second drifting layer risks muddying it.

- [ ] **S9b — Mile markers counting down between exits** — Status: Done — Cycle: 7

  - **Source:** carved out of S9 when the sign itself shipped; the markers need new drawing in the canvas roadside pass rather than DOM work.
  - **Scope:** small-medium.
  - **Outcome:** **Shipped** in `ff1f8d9`. A green plate on a slim post every half-leg, set outboard of and taller than the delineator line. The first pass rendered at ~2x1 pixels and was invisible — caught by checking a screenshot, then enlarged until it read as a marker.

- [ ] **S14 — Audit the rest of the site for the same timezone year bug** — Status: Done (no bug found) — Cycle: 4

  - **Source:** the bug found while verifying S12. `new Date('YYYY-MM-DD').getFullYear()` reports the previous year for January 1st dates in any timezone behind UTC.
  - **Suggestion:** check whether the classic site formats the same content dates the same way — the education and experience sections render the same `date` fields.
  - **Why / expected impact:** if it does, a role's year is wrong on the main résumé page too, which matters more than on the drive page.
  - **Scope:** small, but **read-only from this run** — `src/components/sections/**` is outside the write scope, so a confirmed hit becomes a **Needs human** item with the evidence attached rather than an edit.
  - **Outcome:** **Investigated, closed clean — the classic site is not affected.** `FormattedDate.jsx` already builds its formatter with `timeZone: 'UTC'`, which is exactly the right defence, and writes its `dateTime` attribute from `toISOString()`. Proven by running that exact config in Node against all ten content dates in a timezone behind UTC: it renders _Jan 2024_ correctly while `getFullYear()` in the same process returns 2023. All eight date call sites in `src/` were classified individually. `route.js` was the only affected one and was fixed in cycle 3. No change needed.

- [ ] **S16 — `/drive` ships two canonical tags, the first pointing at the homepage** — Status: **Needs human** — Cycle: 4

  - **Source:** site audit — measured straight out of the served HTML while looking at what crawlers see.
  - **Suggestion:** add matching `key` props so `next/head` deduplicates and the page-level tag wins. Exact patch is written out in the **Needs human** section of `overnight-tasks-2026-08-05.md`.
  - **Why / expected impact:** a crawler taking the first canonical is told `/drive` duplicates the homepage, which drops drive mode out of the index; a social scraper taking the first `og:title` previews a shared drive link as the homepage, defeating the `?exit=` deep links. `og:url` and `og:title` duplicate the same way.
  - **Scope:** tiny — three lines in `_app.jsx` and three in `drive.jsx` — but `_app.jsx` is outside this run's write scope, so it is parked rather than edited.
  - **Outcome:** _(awaiting a human; the loop deliberately did not half-fix it from `drive.jsx` alone, which would have looked fixed and changed nothing)_

- [ ] **S17 — Structured data for `/drive`** — Status: Proposed — Cycle: 4

  - **Source:** site audit — `_app.jsx:16-48` emits a WebSite / Person / ProfilePage graph all anchored to the site root, so `/drive` inherits markup describing the homepage.
  - **Suggestion:** a route-specific `WebPage`, or an `ItemList` of the exits, so drive mode stands on its own in search.
  - **Scope:** small. **Blocked behind S16** — adding page-level head content while two canonicals disagree just adds noise.
  - **Outcome:** _(proposed)_

- [ ] **S18 — The cockpit was unusable with a screen reader** — Status: Done — Cycle: 5

  - **Source:** site audit of the served HTML, run because the backlog had no browser-free work left. Measured: 0 of 11 buttons carried an `aria-label`, and the gauges, gear selector and trip-computer screen had no `aria-hidden`.
  - **Suggestion:** name every control while keeping its visible word, and take the decorative instruments out of the accessibility tree.
  - **Why / expected impact:** drive mode is a canvas and an instrument panel; without this a screen-reader user got unlabelled buttons plus a stream of meaningless numerals that duplicated the itinerary badly.
  - **Scope:** small, in scope, fully verifiable from the served HTML.
  - **Outcome:** **Shipped** in `5fcf996`. 10 of 11 buttons named (the 11th is "Start engine", already self-naming); `aria-hidden` 12 -> 19; itinerary and arrival panel confirmed still exposed.

- [ ] **S19 — `/drive` served two `<h1>` elements** — Status: Done — Cycle: 5

  - **Source:** same HTML audit — the itinerary's heading and the ignition splash's were both `<h1>`.
  - **Outcome:** **Shipped** in `5fcf996`. The splash is now an `<h2>`; exactly one `<h1>` is served.

- [ ] **S20 — `/drive` is missing from the sitemap** — Status: **Needs human** — Cycle: 5

  - **Source:** `curl /sitemap.xml` returns a single `<loc>` for the site root; `robots.txt` points at that file.
  - **Why / expected impact:** compounds with S16 — drive mode is both unlisted _and_ disowned by its own canonical, so fixing either alone will not surface it in search.
  - **Scope:** one `<url>` block in `public/sitemap.xml`, which is outside this run's write scope (it covers `public/images/` only). Exact patch is in the **Needs human** section of `overnight-tasks-2026-08-05.md`.
  - **Outcome:** _(awaiting a human)_

- [ ] **S21 — Phone-width regression sweep** — Status: Done (no regressions) — Cycle: 9

  - **Source:** noticed that the phone cockpit had not been re-checked since cycle 1, with the daylight system, traffic, mile markers, the aria pass and the resume UI all landing since.
  - **Outcome:** **Clean.** At 386x840 against a production build: no horizontal overflow, cockpit laid out correctly, arrival panel present and internally scrollable, screenshot frame at its native 2:1, and the new resume UI stacking rather than overflowing. One apparent 26px overlap of the panel into the dash turned out to be a frozen framer-motion entry transform (rAF is paused in a hidden tab); the settled layout is flush. Nothing was changed — and deliberately so.

- [ ] **S22 — The route map claimed to be a modal but never took focus** — Status: Done — Cycle: 10

  - **Source:** Suggester audit of `RouteMap.jsx`, a surface never examined in nine cycles. Measured: 23 tabbable elements inside the open dialog, `dialog.contains(document.activeElement)` false.
  - **Why / expected impact:** `aria-modal="true"` promises assistive tech that the page behind is inert. Without focus management a keyboard user tabs through the cockpit under an overlay they cannot see past.
  - **Outcome:** **Shipped** in `09fe15d`. Focus moves to the panel on open, Tab/Shift+Tab cycle within it, Escape still closes it (the trap only intercepts Tab). Focus-restore executes but needs a foreground window to observe — see Needs testing.

- [ ] **⭐ S23 — The CLASSIC site still crops project photos and never cycles them** — Status: **Needs human** — Cycle: 10

  - **Source:** Suggester audit, prompted by re-reading the original brief. Priority (c) was fixed in drive mode in cycle 1 but never checked on the main portfolio page.
  - **Why / expected impact:** this is the user's own stated priority, still live on the page most visitors actually see — and easy to believe is already solved. `src/components/Projects.jsx:97` uses an `aspect-video` frame with `object-cover` at `:120`; computed against the real files, **all 28** screenshots are wider than 16:9, so **10.1%** of each image's width is cropped on average (**14.2%** worst). Cycling is click-only — no timer exists anywhere in the file.
  - **Scope:** small, but `src/components/Projects.jsx` is outside this run's write scope, and the working tree carries the user's own uncommitted edits nearby. Exact patch is in the **Needs human** section of `overnight-tasks-2026-08-05.md`.
  - **Outcome:** _(awaiting a human)_

- [ ] **S24 — Oncoming traffic ignored `prefers-reduced-motion`** — Status: Done — Cycle: 11

  - **Source:** Suggester audit of the reduced-motion contract. `grep -c reducedMotion src/components/drive/RoadCanvas.jsx` returned 0, while four other mechanisms in drive mode honour it.
  - **Why / expected impact:** a regression this branch introduced in cycle 7 — cars advance on a wall clock independent of travel, so a visitor who asked for less motion still got headlights sliding toward them while parked.
  - **Outcome:** **Shipped** in `eef571b`; traffic is not drawn under the preference. Proven by comparing two deterministic single frames of `?exit=6` with `matchMedia` patched: 185 samples changed in a 30x32px box at the vanishing point, every other pixel identical.

- [ ] **S25 - Arrival panel hidden behind the cockpit on short viewports** - Status: Done - Cycle: 12

  - **Source:** Suggester audit of landscape phone (840x386), a viewport never measured before.
  - **Why / expected impact:** the panel carries every word of the resume; 71px of it sat under the dashboard. Glass was also down to 45.6%, under the 50% guardrail.
  - **Outcome:** **Shipped** in `c71b624`. The dash height had been written twice in different units (`h-[36%] min-h-[210px]` vs `bottom-[36%]`); at 386px tall the pixel floor won and the two disagreed by exactly 71px. Both now consume one `clamp(190px,36%,48%)`. Overlap 71px to 0, glass 45.6% to 50.8%, no regression at 1916x946 or 386x840.

- [ ] **S26 - Focus visibility in drive mode** - Status: Done (no defect) - Cycle: 12

  - **Source:** drive mode defines no focus styles of its own.
  - **Outcome:** **No defect.** Every control computed `outline-style: none`, but from programmatic `.focus()`, which does not match `:focus-visible`. No author rule removing outlines exists anywhere in the stylesheets, so the browser default ring applies to real keyboard focus. Closed without a change.

- [ ] **S27 - Oncoming traffic removed at the owner's request** - Status: Done - Cycle: 13

  - **Source:** direct owner feedback: _"you've put unnecessary opposing traffic in a portfolio site that should represent me."_
  - **Outcome:** **Removed** in `d76e0bd`, along with the `reducedMotion` prop that existed only to suppress it. Recorded as standing law in the Guardrails block; S13b (haze) closed as unwanted for the same reason. **Do not re-propose invented traffic, weather or other road "life".**

- [ ] **S28 - The car drives in a lane, not down the centre line** - Status: Done - Cycle: 13

  - **Source:** direct owner feedback, twice: _"i dislike how the car starts in the middle of the road"_ and _"you also make me steer right back into the middle of the road instead of the middle of the lane of traffic im supposed to be in."_
  - **Why / expected impact:** the camera sat at lateral 0, which is the centre line, and `sim.x` decays to 0 - so the game actively steered you back onto the centre line whenever you let go.
  - **Outcome:** **Shipped** in `d76e0bd`. `cameraX(sim) = LANE_OFFSET + sim.x`, `LANE_OFFSET = 2.7` (midpoint of the right-hand lane); `sim.x` is now drift within the lane. Steering clamp tightened to keep the car between the centre line and the edge line. Verified: the centre line now runs down the left of the view.

- [ ] **S29 - The destination did not read as an arrival** - Status: Done - Cycle: 14

  - **Source:** re-reading the owner's priority (b), _"the destination-arrival panel needs work"_, and noticing that the **destination stop itself** had never been examined - only the arrival panel in general (cycle 1).
  - **Why / expected impact:** it is the conversion moment. All four actions rendered identically, so the email and "back to the classic site" were visually indistinguishable; the eye had nothing to land on after twenty-one exits.
  - **Outcome:** **Shipped** in `b6f444f`. Email primary, classic-site link demoted to quiet text, and a trip summary above them whose every figure is derived from the content (rendered 2016 / 9 / 8 / 2.7, matching 9 roles, 8 builds, education 2016, 21 stops x 220m). Owner's prose untouched; EXIT 11 confirmed unchanged.

- [ ] **S30 - `world.project()` was dead code with false documentation** - Status: Done - Cycle: 15

  - **Source:** a Suggester pass aimed at duplication rather than features, prompted by the owner's steer against unnecessary additions.
  - **Why / expected impact:** the module claimed `project()` kept the canvas and DOM overlays in agreement, but nothing called it and three sites duplicated the maths. This branch had already been bitten twice by the same shape - the dash height written twice (71px overlap) and the camera lateral written four times (the centre-line complaint).
  - **Outcome:** **Shipped** in `e23a9db`. `ExitSign` and `RoadCanvas.place` now call `project()`; `buildPoints` stays inlined on purpose (131 iterations/frame into pre-allocated objects) with a comment explaining the trade, so the remaining duplication is deliberate. Proven pixel-identical by a stash/rebuild A/B: **0 of 1,992,704 pixels differ**.

- [ ] **S31 - Resuming made the route map contradict itself** - Status: Done - Cycle: 16

  - **Source:** a Suggester pass aimed at the _seams between_ features built separately in this run - resume (cycle 8) and the route map's "driven" markers.
  - **Why / expected impact:** measured, not guessed - seeded progress at EXIT 13, took the offered resume, opened the map: **2 of 21** rows read "driven". The app told the same visitor, one click apart, that they had reached exit 13 and that they had never driven exits 01-12.
  - **Outcome:** **Shipped** in `f0b7c6c`. `markVisitedThrough()` restores the history behind a resumed exit, justified by an observed property of `progress.js` (writes happen only on arrival, and only forwards). Called from `resumeDrive` **only** - a `?exit=` deep link proves a click, not a drive. Verified on a production build, all three cases: resume → 14 of 21 driven (`MILE 0`..`EXIT 13`); deep link → `MILE 0` + `EXIT 13` only; fresh visit → `MILE 0` only.

- [ ] **S32 - Canvas repaints every frame while parked** - Status: Backlog (recorded, deliberately not built) - Cycle: 16

  - **Source:** reading `RoadCanvas.draw()` after the cycle-13 traffic removal made it a pure function of `travel`, `x` and the camera.
  - **Why / expected impact:** parked at a stop, every animation frame redraws a provably identical image - continuous CPU and battery burn on a page someone may leave open while reading.
  - **Outcome:** **Backlog S16a.** Not built, on purpose: the win (frames skipped) cannot be measured here - rAF is suspended in a backgrounded tab, and the only way to force a repaint is a resize, which must bypass any dirty-check because setting `canvas.width` clears the backing store. Shipping an unmeasurable optimisation into a hot path is guardrail 9's failure mode. Pick it up when a foregrounded window is available, so the check and its evidence land together.

- [ ] **S33 - Every exit had the same tab title, and the route announcer repeated it** - Status: Done - Cycle: 17

  - **Source:** a Suggester pass that left the canvas alone and asked what the page says through the channels that are _not_ the canvas - the tab, the history entry, and what a screen reader hears.
  - **Why / expected impact:** measured - the URL changed from `?exit=13` to `?exit=14` while `document.title` stayed `"Hyun-Tae Jin | Drive mode"`. Twenty-one destinations, one bookmark name. And Next's route announcer (`aria-live="assertive"`) reads that title on every shallow URL change, so a screen-reader user was interrupted twenty times with the identical sentence and never told the exit.
  - **Outcome:** **Shipped** in `aafb4d9`. A per-stop `next/head` title in `DriveScene`; the SSR `<title>` in `drive.jsx` untouched and confirmed by `curl`. Verified distinct across EXIT 14 / MILE 0 / EXIT 20. A first attempt read `"MILE 0 · Hyun-Tae Jin | Hyun-Tae Jin"` - stop 0's title _is_ the name - caught in verification and fixed.

- [ ] **S34 - The arrival panel's `aria-live` could never fire** - Status: Done - Cycle: 17

  - **Source:** the same pass, checking whether the accessibility attributes on the page do what they claim.
  - **Why / expected impact:** measured - the live node was a _different node_ before and after an exit change, and between exits there was no polite region on the page at all. `StopCard` is keyed by stop inside `AnimatePresence`, so it is destroyed and rebuilt on arrival; a live region created together with its content is the documented unreliable case. The attribute read as an accessibility feature while announcing nothing.
  - **Outcome:** **Shipped** in `aafb4d9`. A permanently mounted `role="status"` region in `DriveScene`; the dead attribute removed with a comment naming its replacement. Verified by DOM node identity across three arrivals while the text changed, exactly one region, and MILE 0 announcing _"At the start line"_ rather than an arrival.

- [ ] **S35 - The cockpit and the windshield disagreed about where the driver sits** - Status: Done - Cycle: 18

  - **Source:** a Suggester pass that went back to the owner's stated priority (a), _"the car interior dash needs work ... think of what a car should look like from driving perspective"_, and checked the rendered cockpit against the geometry the road is drawn with.
  - **Why / expected impact:** measured both halves. A Node probe of `world.js` shows the road's vanishing point converges exactly on the screen centre (960.00 of 960), so the driver's eyeline is the middle of the viewport. The browser shows the steering wheel centred at 615 (32.0%) while the mirror and pillars are symmetric about 960 - the wheel was 345px, 18% of the viewport, left of the driver's own eye. Worse, the comment in `world.js` justifying that framing asserted the vanishing point falls left of centre, which the probe disproves.
  - **Outcome:** **Shipped** in `4d24fd9`. The desktop dash is a grid whose middle column is the steering column, so the wheel is centred by construction; a door card occupies what that leaves to the driver's left. The false comment now states what the numbers show; no maths changed. Verified at 1920x895: wheel centre 960, offset 0, no overlaps, no horizontal scroll. **Narrower widths are parked as Needs testing** - the window would not actually resize this session.

- [ ] **S36 - Verify the re-centred dash at widths the window would not give me** - Status: Done - Cycle: 19

  - **Source:** the Needs-testing item cycle 18 parked honestly rather than claiming coverage it did not have.
  - **Why / expected impact:** a layout change verified at one viewport is the exact shape of the cycle-12 bug, where a dash height written twice hid resume content on a landscape phone. `resize_window` reported success but `innerWidth` stayed 1920, so no narrow viewport had ever been rendered.
  - **Outcome:** **Verified, no defect found.** Loaded `/drive` in same-origin iframes of explicit size - proving first that the frame was genuinely its own viewport (`innerWidth` 1100 inside vs 1920 outside; `lg:hidden` block `none` at 1100 and `flex` at 390). At 1100x800: console on one row, zero overlaps, no overflow, wheel 153px short of the eyeline as designed below `xl`. At 390x844 and 844x390: the desktop grid computes `display: none`, so cycle 18 provably does not touch the phone cockpit; zero overlap, everything inside the viewport. Shipped one comment-only commit (`72ccf3f`) recording the measured arithmetic behind the `xl` threshold.

- [ ] **S37 - Clear the three items parked behind a foregrounded browser window** - Status: Done - Cycle: 20

  - **Source:** the Awaiting-scenario entry, re-checked at the top of the cycle as the controller requires. Its condition had arrived: `document.hidden` false, `hasFocus()` true, rAF running, `.focus()` sticking.
  - **Why / expected impact:** three claims about the drive had been asserted but never observed - the frame budget (since cycle 3), focus return on closing the route map (since cycle 10), and whether the engine audio makes any sound at all (since cycle 9). Unverified claims are exactly what this run treats as defects.
  - **Outcome:** **All three verified, zero code changes.** Frame rate: driving 29.9/30.0/29.9 fps against a parked 21.8/17.1/21.8 and a 28 fps empty-loop baseline - the ceiling is the environment, not the code. Focus: trigger -> dialog panel -> Escape -> back on the trigger, observed. Audio: with a _real_ click (the eleven-cycle blocker was that a scripted click grants no user activation) the context runs, master gain reaches 0.09, and the oscillators climb 43.83 -> 65.37 -> 71.56 Hz with the revs, the square exactly an octave above, the filter opening 692 -> 1284 Hz, tyre noise 0 -> 0.033 with speed; toggling off returns master gain to 0.

- [ ] **S16a - The road repainted every frame while parked** - Status: Done - Cycle: 21 (found cycle 16)

  - **Source:** reading `RoadCanvas.draw()` after the cycle-13 traffic removal made it a pure function of position and camera.
  - **Why / expected impact:** parked at a stop the canvas was repainted on every animation frame to produce a provably identical image - measured at **130 full repaints in 130 frames over 5s**, into a 3840x1790 backing store. That is continuous CPU and battery on a page someone leaves open while reading an exit.
  - **Outcome:** **Shipped** in `574ff15`, five cycles after it was found. It was deliberately _not_ built in cycle 16 because the win could not be measured in a backgrounded tab, and guardrail 9 forbids unmeasurable optimisations in a paint loop; cycle 20 removed that blocker. Parked repaints went **130/130 frames -> 0/140**, driving is unchanged at 136 paints/132 frames, a resize still repaints exactly once, steering while parked still repaints and then settles to zero, and a captured frame differs by **0 of 4,096,000 pixels**. The design detail that mattered: an equality check would have skipped nothing, because the parked steering drift decays asymptotically and never repeats a value.

- [ ] **S38 - Every screenshot was announced, not just the visible one** - Status: Done - Cycle: 22

  - **Source:** a Suggester pass aimed back at the owner's priority (c), the project screenshots, unexamined since cycle 1.
  - **Why / expected impact:** measured at EXIT 13 - the captures are stacked and cross-faded with `opacity`, which does not remove an element from the accessibility tree, so all four carried live alt text. A screen-reader user met "screenshot 1 of 4" through "4 of 4" for a single visible picture.
  - **Outcome:** **Shipped** in `2f62f6d`. Inactive frames are `aria-hidden`. Verified that exactly one image is exposed _and that it is the one at opacity 1_ - a count alone would not have proved the right one - and that it still holds after the carousel advanced.

- [ ] **S39 - The carousel dots were 6x6px targets** - Status: Done - Cycle: 22

  - **Source:** the same pass, measuring the controls rather than reading them.
  - **Why / expected impact:** each inactive dot's hit box was 6x6 CSS px (20x6 active) against the WCAG 2.5.8 minimum of 24x24, in a carousel that sits inside the arrival panel on a phone.
  - **Outcome:** **Shipped** in `2f62f6d`. Each dot is a 24x24 box with the same pill centred inside; targets verified at 24x24 with 0px neighbour overlap and pill sizes unchanged. Worth knowing: the plan's own guardrail said the visible dots must not move, and building it showed that to be impossible - 6px dots 6px apart put centres 12px apart, failing both the target rule and its spacing exception. The guardrail was amended with that reasoning rather than quietly ignored, and only the spacing between dots grew.

- [ ] **S40 - The destination's call to action was sliced in half on a phone** - Status: Done - Cycle: 23

  - **Source:** a Suggester pass aimed at the owner's priority (b) on a phone. Guardrail 4 has asked for a 390x844 check of the arrival panel since cycle 1, and the _destination stop_ had never been opened there.
  - **Why / expected impact:** measured - the panel's scroll area was 316px against 328px of content, and those 12px cut straight through "Download resume" and "Back to the classic site". After twenty-one exits, the moment that asks for a conversation looked broken. The space had gone to the trip summary, whose four figures stacked 2x2 on a narrow scroller for 112px.
  - **Outcome:** **Shipped** in `06f6e26`. The summary runs four across at every width (65px), labels wrapping rather than abbreviated since the figures are derived from the content; panel padding and the links' margin tighten below `sm` only. Verified: 390x844 and 360x800 clip nothing (was 12px and 19px), desktop at 1440x900 is byte-for-byte the same layout, and a screenshot confirms it. Recorded limit: at 375x667 it still overflows by 38px and scrolls, which is what the guardrail asks for - fitting it there would mean cutting real content.

- [ ] **S41 - The phone control row stranded the audio toggle on its own line** - Status: Done - Cycle: 23

  - **Source:** the same pass, measuring the cockpit's controls at 390px rather than looking at them.
  - **Why / expected impact:** the four controls sat on four different top offsets, with the audio toggle alone in the bottom-left corner - the cluster needed 253px against 242px available and wrapped by ~11px. It read as an accident rather than a layout.
  - **Outcome:** **Shipped** in `06f6e26`. The room came from padding, gaps and letter-spacing below `sm`: one row at both 390px and 360px, smallest control still 25px (above the 24px floor set in cycle 22), and no visible label changed - a voice-control user can still say the word they see.

- [ ] **S42 - The car's bonnet was swallowed by the dashboard on short screens** - Status: Done - Cycle: 24

  - **Source:** a Suggester pass on `CarInterior.jsx`, the one cockpit file no cycle in this run had audited - the owner's priority (a).
  - **Why / expected impact:** the bonnet, dash reflection and wipers were pinned at fixed percentages while the dashboard's height is `clamp(190px,36%,48%)`; they agree only while 36% is the winning branch. Measured: at 1440x900 the bonnet showed 49 of 54px, at 1024x500 only 17 of 30, and at 844x390 (landscape phone) **0 of 23px** - gone completely, along with 50px of reflection and 30px of wipers. The bonnet is what makes the view read as "sitting in a car", and it disappeared on the tightest viewport there is.
  - **Outcome:** **Shipped** in `bf95af8`. The dash height is now defined once as a `--dash` custom property and read by the dashboard, the arrival panel's bottom edge and the interior furniture - the same "express it once" fix guardrail 43 was written for after the cycle-12 overlap bug, and this was the third copy of that literal. Verified: desktop pixel-identical (bonnet box unchanged), 1024x500 17 -> 27 of 30px, 844x390 **0 -> 24 of 26px** with reflection and wipers fully back, panel/dash overlap 0 everywhere, and one definition of the literal left in the codebase.

- [ ] **S43 - The trip computer overflowed its box on a landscape phone** - Status: Done - Cycle: 25

  - **Source:** cycle 24's landscape screenshot left an impression that the terminal looked wrong; this pass measured it instead of carrying the impression forward.
  - **Why / expected impact:** at 844x390 the box is 20px tall against 54px of content, and `.screen` is `overflow: visible` - so it painted _outside its box over the control row_ rather than clipping. The `EXIT 06 . Co.Lab` line and the progress bar were both squashed to **height 0**: the readout that tells you which exit you are at had been squeezed out of existence while the bar still drew over the buttons.
  - **Outcome:** **Shipped** in `e9cfe30`. The dash's 190px budget was measured (74 cluster / 20 terminal / 62 controls against a 156 budget, needing 190) and rebalanced on short viewports only: a 44px gauge, tighter gaps and padding, shorter pedals, and the shell-prompt row stood down. Overflow 36 -> 0, exit line 0 -> 17px, bar 0 -> 6px, budget 52/68/48, smallest control still 25px - and portrait and desktop measured byte-identical, so the height breakpoint does not leak upward. Nothing was deleted: gutting the gauge would have made the numbers clean at the cost of the owner's priority (a).

- [ ] **S44 - The ignition splash pushed the way out off the screen for returning visitors** - Status: Done - Cycle: 26

  - **Source:** a Suggester pass on the ignition splash - the first screen every visitor sees, and the one screen never opened at phone size, even though the arrival panel and cockpit had been checked there in cycles 12, 23 and 25.
  - **Why / expected impact:** measured with saved progress present, which adds the `Resume` and `Forget my progress` controls: 844x390 overflowed by 2px each side, 667x375 by 9px, and 568x320 by **74px** with the "back to the classic site" link entirely below the viewport and the heading cut off the top. That link is the _only_ way out of drive mode while the splash is up - it sits over the scene's own exit link - and the page cannot scroll, so there was no recovery. With storage clear it fits, which is why no earlier check caught it.
  - **Outcome:** **Shipped** in `d2d0484`. The splash is now scrollable, with the centring moved from `justify-center` to an inner `m-auto` wrapper - a centred flex child that overflows cannot be scrolled back to, so without that change the heading would have been unreachable rather than merely clipped - plus it tightens below 430px of height. Verified with progress seeded every time: 844x390 and 667x375 now fit outright (394 -> 300px), 568x320 is fully reachable, portrait control positions identical to before, desktop centred exactly where it was.

- [ ] **S45 - The route map opened at MILE 0 instead of where you are** - Status: Done - Cycle: 27

  - **Source:** a Suggester pass on the route map - the drive's primary navigation, built in cycle 10 and focus-verified in cycle 20, but never measured at phone size. Its _layout_ turned out to be sound; its opening behaviour was not.
  - **Why / expected impact:** measured, `scrollTop` on open was 0 at every viewport while the highlighted current row sat below the fold - 803px down at 844x390 (where only 3 of 21 rows are visible), 357px at 390x844, 791px at 1440x900. The map highlights the current exit, which is its own statement that "where you are" is the useful thing, and then opened somewhere else.
  - **Outcome:** **Shipped** in `89803a6`. The list now opens centred on the current exit, instantly and without touching focus, by setting the scroller's own `scrollTop` rather than using `scrollIntoView`. Verified across seven exit/viewport combinations, with MILE 0 still opening at the top and the last exit clamping rather than overscrolling; the cycle-10/20 focus trap, Escape and focus-restore were re-measured rather than assumed. A first attempt used `offsetTop` and was 111px out - the scroll container is not positioned, so a row's `offsetParent` is the dialog backdrop - which the verification caught by two checks disagreeing with each other.

- [ ] **S46 - All 21 exits swept for the first time** - Status: Done (no defect found) - Cycle: 28

  - **Source:** the realisation that across 27 cycles only about seven stops had ever been opened individually.
  - **Why / expected impact:** the content layer had never been checked end to end - a broken screenshot, a missing link or a console error on an unvisited exit would simply not have been noticed.
  - **Outcome:** **Clean.** Every stop renders its card, counters run 1/21 to 21/21, all 28 screenshots across the 8 project stops load with none broken, links appear where the content has them, the arrival announcer names the right exit every time, and there were zero console errors or warnings for the whole route.

- [ ] **S47 - The stops with the most to say got the least room** - Status: Done - Cycle: 28

  - **Source:** the same sweep, comparing panel widths across stop types.
  - **Why / expected impact:** measured at 1440x900 - a stop with screenshots widened to 925px while a text-only stop stayed at 704px, so the sabbatical hid **40.9%** of its content, the toolbox 20.5% and the senior role 15.1%, with 736px of the band unused either side. The stop with pictures got the room and the stop with prose did not; on a laptop, two fifths of a role's detail sat below a fold.
  - **Outcome:** **Shipped** in `6dcdd2e`. Text-only stops (not the project stops, not the destination) now take the same width and flow in two balanced columns. Widening alone was measured and rejected because it would have pushed lines from ~100 to ~135 characters; the two-column version fixes the fold _and_ brings the measure to ~63. Verified: two of the three now hide nothing, the sabbatical drops 40.9% -> 22.4%, no horizontal overflow, phones stay single-column, destination and project stops untouched. A first build regressed two stops (a `break-inside-avoid` that stopped the columns balancing) and the re-sweep caught it before commit.

- [ ] **S48 - Re-verify the reduced-motion contract after eight cycles of change** - Status: Done (no defect found) - Cycle: 29

  - **Source:** not a new idea but an old promise - the contract was last exercised in cycle 11, and the paint loop, dash layout, ignition splash, route map and stop card have all been rebuilt since.
  - **Why / expected impact:** guardrail 42 says each of these mechanisms is an assertion until it is actually run. A silent regression here would affect exactly the visitors least able to tolerate it, and nothing in the build would have flagged it.
  - **Outcome:** **Verified, nothing changed.** With `matchMedia` patched before hydration: the project carousel held frame 0 for 9s (dots still available), the arrival panel animated opacity only with `transform: none` in all 26 samples, `Next` teleported in **102ms**, and the parked canvas repainted **0** times in 9s. Each was checked against a control run with motion allowed, which produced an advancing carousel, 15 non-identity 3D transforms and a **9,887ms** drive - so the readings are real rather than an inert harness. Also confirmed a pairing that did not exist in cycle 11: cycle 21's canvas dirty-check and the reduced-motion teleport compose correctly (2 repaints for the jump, 0 after). The probe technique, including the navigation trap that made the first attempt silently fail, is now recorded in the tasks file.

- [ ] **S49 - The exit sign never faded in** - Status: Done - Cycle: 30

  - **Source:** a Suggester pass on `ExitSign.jsx`, one of three drive files never audited in this run.
  - **Why / expected impact:** measured on a real leg - the sign's wrapper reported `opacity: 1` on the very first sample after departure and never changed. The cause is a literal `VISIBLE_FROM = 420` against a `LEG_LENGTH` of 220, a window 1.91x the furthest you can ever be from the sign: the fade `min(1, (420 - z) / 160)` is already 1.000 at z = 220 and would only have completed at z = 260, beyond the leg entirely. The retroreflective flare was pre-charged to 0.227 for the same reason, so a quarter of the effect the code calls "most of why an approach reads as an approach" was spent before the car moved. A visitor saw the sign pop into existence at full opacity, already partly lit.
  - **Outcome:** **Shipped** in `f299914`. Both the window and the fade now derive from `LEG_LENGTH` rather than a literal, so they cannot drift again if the route spacing changes. Verified driving a real leg: opacity at departure 1.000 -> 0.004, ramping to full at 4.8s of a ~9.9s leg; flare starting at 0.000 instead of 0.227; scale curve and position untouched; still hidden when parked and past the exit.

- [ ] **S50 - Sky and daylight audited; the shared palette and reduced-motion CSS are sound** - Status: Done (no defect) - Cycle: 31

  - **Source:** the last two drive files never audited in this run.
  - **Why / expected impact:** `daylight.js` mutates one shared palette object for performance, which is the kind of design that leaks bugs if any caller keeps the reference; and the CSS animations had never been checked against `prefers-reduced-motion` at the stylesheet level.
  - **Outcome:** **Clean.** Every caller reads the palette immediately and none retains it; the star field is seeded so SSR and client match; and the reduced-motion block already covers all four animations (`.star`, `.ignition`, `.blink`, `.shot`) - something cycle 29's JS-level sweep had not examined.

- [ ] **S51 - Full night happened between two exits, not at the toolbox** - Status: Done - Cycle: 31

  - **Source:** measuring the daylight arc across six exits during the audit above.
  - **Why / expected impact:** the measurements exposed it - EXIT 14 showed a **higher** moon (0.908) than EXIT 19 (0.887), meaning the sky was brightening before the stop meant to be darkest. The keyframe read `at: 0.92, // full night - the toolbox`, but the toolbox is EXIT 19 of 20 = **0.95**; `0.92` is exit 18.40, mid-leg where nobody parks. Arriving at the toolbox you were already 37.5% into dawn, at starOpacity 0.850 against a peak of 1.0.
  - **Outcome:** **Shipped** in `f6c267f`. The anchor is derived from the toolbox stop's own position, with a literal fallback if the content loses that stop and an ordering guard because `paletteAt` assumes ascending keyframes and would have failed silently. Verified: toolbox star/moon **0.850/0.888 -> 1.000/1.000** with the authored full-night horizon, a monotonic approach through EXIT 18, and the destination's first light unchanged at 0.6/0.7. No colour was retuned - only _when_ full night happens.

- [ ] **S52 - Hunt the recurring pattern instead of waiting to trip over it again** - Status: Done - Cycle: 32

  - **Source:** five separate cycles had each found the same defect - a constant typed in one place that has to agree with a number kept somewhere else. With every drive file audited, this pass went after the shape rather than another file: every module-level numeric constant in `src/components/drive/` was enumerated and asked whether it has to agree with something it cannot see.
  - **Why / expected impact:** these are latent rather than visible - each one is correct today and breaks silently the moment the number it shadows is changed. Three qualified: `Sky.jsx` re-typing the palette's `STEPS = 360` repaint quantisation (make the palette finer and the sky bands while the road keeps up), `MARKER_SPACING = 110` under a comment promising "half a leg" against a `LEG_LENGTH` of 220, and `GEAR_RATIOS` ending at a literal `42` beside `MAX_SPEED = 42` (raise MAX_SPEED alone and the tachometer pegs for the whole of top gear).
  - **Outcome:** **Shipped** in `57cd6cc`. All three now read from the single place that owns the value. Because all three are no-ops at today's numbers, the requirement was that nothing change, and it was measured rather than argued: **0 of 4,096,000 pixels differ** at each of two exits, with the sky gradient, star, moon and skyline readings byte-identical and the speed curve unchanged. No value was altered - only where it comes from.

- [ ] **S53 - Does the per-frame subscriber set leak across stops?** - Status: Done (no defect) - Cycle: 33

  - **Source:** `drive` is a `useMemo` whose identity changes on every arrival, so every consumer's effect tears down and re-subscribes 21 times across a drive.
  - **Why / expected impact:** one missing cleanup would grow the per-frame fan-out silently and cost a little more every frame for the rest of the session - nothing in the build would flag it.
  - **Outcome:** **Clean.** Measured by recording the size of the Set iterated each frame: 13 subscribers at MILE 0 and exactly 13 after twelve stop changes covering project stops, the toolbox and the destination, with one canvas and one status region throughout.

- [ ] **S54 - Tab spent 25 presses on invisible links before any control** - Status: Done - Cycle: 33

  - **Source:** the first end-to-end look at what a keyboard-only visitor can reach.
  - **Why / expected impact:** measured at EXIT 13 - 25 of the 38 focusable elements live inside the `sr-only` itinerary, which is clipped to nothing but fully present in the tab order. Their layout boxes are real (up to 195x19.5) and clipped away, so the focus ring was painted on invisible content: for a sighted keyboard user, focus was _nowhere_ for 25 presses before the first control they could see.
  - **Outcome:** **Shipped** in `de9a7da`. A skip link, first in the tab order and hidden until focused. Deliberately not `tabindex="-1"` on the itinerary links - that would have fixed the sighted keyboard user by robbing the screen-reader one, for whom that block is the resume. Verified with real key presses: Tab reveals the link at 171x22, Enter moves focus to the controls, the next Tab lands on a real button - **25 presses down to 1** - with all 25 itinerary links intact. Proving it required real keys: programmatic `.focus()` sets `activeElement` but never matches `:focus` while the document itself is unfocused, which made two earlier attempts report a failure that was not there.

- [ ] **S55 - Do the drive controls actually have a focus indicator?** - Status: Done (no defect) - Cycle: 34

  - **Source:** a question cycle 12 raised, correctly diagnosed as unanswerable at the time, and left open - programmatic focus never matches `:focus-visible`, so a computed `outline: none` proved nothing.
  - **Why / expected impact:** if any control had its outline stripped with no replacement, a keyboard user would be navigating blind. Cycle 33 established how to get genuine keyboard focus, which made the question answerable.
  - **Outcome:** **No defect.** Fourteen real Tab presses on a focused document: every one of the fourteen focused elements reports `outline: auto 1px` with `:focus-visible` true, and none has its outline suppressed.

- [ ] **S56 - Focus was invisible for 25 presses inside the hidden resume, and the standard fix cannot work there** - Status: Done - Cycle: 34

  - **Source:** the same fourteen-press recording - 13 of the 14 stops were off-screen, all itinerary links.
  - **Why / expected impact:** cycle 33's skip link rescues anyone who takes it, but a keyboard user who keeps tabbing still walked 25 stops with the focus ring painted on content clipped to nothing.
  - **Outcome:** **Shipped** in `ed61397`, and the interesting part is what was ruled out. The usual `focus:not-sr-only` reveal works on an element that is _itself_ sr-only - which is why the skip link appears - but not on a descendant of an sr-only container. Tested rather than assumed: a focused link forced to `position: fixed; clip: auto` keeps a correct 85x38 box while `elementFromPoint` at its own centre returns the canvas. Unclipping the container would drop the whole resume over the scene, and re-hiding that block differently would restructure the only machine-readable copy of the resume on a hunch. So the fix reports _where focus is_ from outside the clip: an aria-hidden chip naming the focused link, which tracks as focus moves and vanishes when focus leaves. Verified with real keys, including that it never appears for mouse users.

- [ ] **S57 - Are the three parked Needs-human patches still valid 25 cycles later?** - Status: Done (all three valid) - Cycle: 35

  - **Source:** auditing the run's own output rather than the code. Those three items are the only work waiting on you, they were measured around cycles 4 and 10, and the working tree has carried your own uncommitted edits in that area the whole time. A patch that no longer applies costs you time and then makes the analysis look wrong.
  - **Why / expected impact:** stale line numbers or a figure that has drifted would be discovered only when you sat down to apply them.
  - **Outcome:** **All three still valid, re-verified against the current files and the served HTML.** `Projects.jsx` is still live and still has both faults (`aspect-video` at :97, `object-cover` at :120, no timer anywhere, click-only at :61) with every line reference in the patch confirmed; the crop was recomputed from the PNG headers - 28 of 28 files wider than 16:9, average **10.2%** of width discarded, worst 14.2% (`rift/2.png`) - and the recorded 10.1% corrected. The duplicate canonical was confirmed from the served HTML rather than reasoned about: `/drive` ships the homepage's canonical **first**, then its own, so crawlers currently read it as the homepage. The sitemap holds exactly one URL, and since the site has exactly two indexable routes that is half the site missing.

- [ ] **S58 - Does resizing the window mid-drive break anything?** - Status: Done (no defect) - Cycle: 36

  - **Source:** every layout measurement in this run had loaded at a fixed size; nothing had tested a resize while the car was actually moving.
  - **Why / expected impact:** the canvas, the dash height and the arrival panel are all derived from viewport size, and the sim runs on a frame loop that a resize could plausibly disturb.
  - **Outcome:** **Clean.** Resized 1440x900 -> 900x650 mid-drive: the sim kept running and arrived, the canvas backing store followed 2880x1800 -> 1800x1300, the dash re-laid out to 234px, and the arrival panel appeared fully inside the viewport with zero overlap and no horizontal scroll.

- [ ] **S59 - The exit sign changed units halfway through the approach, into metric** - Status: Done - Cycle: 36

  - **Source:** sampling what the sign's distance readout actually displays across a full approach.
  - **Why / expected impact:** measured, it ran `0.14 MI -> 0.10 MI -> 159 M -> 146 M` - two units in one readout, the second metric, on an American interstate guide sign in a cockpit whose speedometer says mph and odometer says MI. It also disagreed with the sign you already wrote: the homepage's `DriveModeSign` reads "1/4 mile".
  - **Outcome:** **Shipped** in `faf5a43`. Feet throughout, derived from the existing `METERS_PER_MILE` rather than a typed conversion factor. The fraction ladder ("1/4 MILE") was deliberately not added: a leg is 0.137 miles and the sign is only visible below that, so it could never run - and shipping a branch that can never execute is exactly the defect cycle 30 fixed. Verified across two approaches: 720 FT -> 110 FT, monotonic, single unit throughout, with the sign's opacity, flare and scale curves re-measured and unchanged.

- [ ] **S60 - Does every year on the page still match the resume?** - Status: Done (no defect) - Cycle: 37

  - **Source:** guardrail 13 - a wrong year on a resume is the worst bug this page could ship - plus the fact that cycle 4 found exactly that (a timezone bug moving a January 1st role into the previous year), fixed it, and spot-checked one stop. It had never been verified across every stop.
  - **Why / expected impact:** the years appear in two places - the cockpit's trip computer and the hidden crawlable copy - and an error in the second would be read by search engines and screen readers without anyone seeing it.
  - **Outcome:** **No defect.** Dates were read from `src/content/*` first, then compared against what the page renders. Cockpit: all ten dated stops correct, including **EXIT 08 (`2024-01-01`) still reading 2024** - the exact entry the old bug moved to 2023. Crawlable copy: 21 articles for 21 stops, ten carrying the correct year with `<time datetime>` matching the visible text, and eleven carrying no year at all because they have no date in the content. One nuance, correct rather than contradictory: the current role reads 2025 in the crawlable copy and NOW in the cockpit - the first states the fact, the second states the present.

- [ ] **S61 - The route map claimed to be modal while the driving keys stayed live** - Status: Done - Cycle: 38

  - **Source:** checking whether the dialog's `aria-modal="true"` promise - that everything behind it is inert - is actually kept.
  - **Why / expected impact:** measured at EXIT 05 - with the map open, ArrowUp pulled the car out of the stop (`parked` true -> false, title advancing EXIT 05 -> EXIT 06) while the dialog stayed up, so the drive happened invisibly behind it. Arrow keys are also the obvious way to scroll a twenty-one row list, which made the natural gesture for using the map the one that left the exit you were reading.
  - **Outcome:** **Shipped** in `e06709b`. While the map is open only Escape and M still act; everything else returns early without `preventDefault`, so the list still scrolls. Opening the map also releases throttle, brake and steering, since a key held beforehand would otherwise stay latched. Verified: nine driving keys inert with the map open, Escape and M still close it, driving unchanged with the map closed, and a held accelerator dropping 22 -> 15 mph over six seconds (then recovering to 52 after closing) proving the release is real.

- [ ] **S62 - The missing `key` props block four improvements, not one** - Status: Recorded (Needs human, already parked) - Cycle: 38

  - **Source:** checking what `/drive` actually serves for social sharing.
  - **Why / expected impact:** `/drive` inherits its entire social surface from `_app.jsx` - the share image is your **portrait avatar** and the card type is `summary`, the small square one. Giving the drive page its own card, adding the route-specific structured data already in the backlog, and fixing the duplicate canonical all need `key` props in `_app.jsx`; without them a second tag is added rather than overriding, which is exactly why `/drive` serves two `og:url`, two `og:title` and two canonicals today.
  - **Outcome:** **Recorded, not shipped.** This makes the parked canonical item a blocker in front of four separate improvements rather than a tidy-up. Nothing was built, because a meta tag that cannot take effect is precisely the defect cycles 30 and 36 each fixed.

- [ ] **S63 - The arrival panel ignored wide screens, so the longest entry stayed cut off** - Status: Done - Cycle: 39

  - **Source:** the residual cycle 28 accepted rather than hid - EXIT 04, the sabbatical, still hiding 22.4% of itself on a desktop.
  - **Why / expected impact:** that entry explains a gap on a resume, so it is the one least worth cutting off, and on a 1440x800 laptop it hid **34.3%**. Measurement first established what was _not_ available: the panel already fills its band exactly, and the band is pinned between the mirror (2px of clearance at 1440x800) and the dash, so there is no vertical slack to take without raiding the cockpit. What was available was width - the card capped at 928px at every size, leaving **992px of the band empty at 1920x900**, more than half.
  - **Outcome:** **Shipped** in `cb525ea`. Text-only stops now widen to 1216px with a third column at `2xl`. Both options were trialled first: widening alone to 1088px left 22px hidden and pushed the measure to ~76 characters, while 1216px with three columns hides nothing and _narrows_ the measure to ~56 - better on both axes. Verified: EXIT 04 94 -> 0 hidden at 1920, project stops and the destination untouched, 1440 and both phone sizes identical to before, no horizontal overflow, and a three-bullet stop reading as three balanced columns. A comma-operator slip in the first build silently dropped the picture stops from 928 to 704px - the build and linter were both happy, and only measuring a project stop caught it.

- [ ] **S64 - Project screenshots were a quarter size on every monitor** - Status: Done - Cycle: 40

  - **Source:** cycle 39 gave the text stops a wide-screen layout and left the project stops capped, so this pass measured what that costs on the owner's priority (c).
  - **Why / expected impact:** the screenshot rendered 451x225 from a 1899x970 source - **23.7% of native** - and it was the same 451px at 1440, 1920 and 2560 wide, while the band left 992px unused at 1920x900. Cycle 1 stopped the cropping; what remained on a large monitor was a whole web page at a quarter size, where the layout reads and nothing else does.
  - **Outcome:** **Shipped** in `cb086c2`. The screenshot grows to 678x339 - 35.7% of native - where there is room. The interesting part is the constraint: the frame is a fixed 2:1, so widening grows its height too, and the band's height belongs to the cockpit. Widening at 1920x900 introduced 83px of overflow, so the rule is gated on **height as well as width**, with the threshold measured (900 -> 83px hidden, 1000 -> 33px, 1080 -> 0) rather than guessed. Verified: 1920x1200 gains the bigger shot with 0 hidden, while 1920x900, 1440x900 and **2560x900** are all unchanged - that last one being wide but short, which is what proves the gate tracks room rather than width.

- [ ] **S65 - Arriving at a project stop downloaded several megabytes of PNG** - Status: Done - Cycle: 41

  - **Source:** cycle 40 made the screenshots legible, so this pass weighed what they cost to deliver.
  - **Why / expected impact:** the 28 screenshots total **15.6 MB** on disk and were served as raw PNG with `cache-control: max-age=0`. Arriving at EXIT 12 requested **all five** of its frames - `loading="lazy"` cannot help when every frame is stacked inside the panel that just opened - for **5,306 KB** in a single arrival, from files that are 2350px natural and drawn at 451px. On the page a recruiter opens, that is minutes of a slow connection for pictures shown at a fifth of their size.
  - **Outcome:** **Shipped** in `1f9c323`. Drive mode now renders through `next/image`, which the classic site has always used - it was the one outlier on a plain `<img>`. Measured cache-cold: **5,306 KB -> 131 KB**, all WebP, zero raw-PNG requests, about **40x smaller**, with the derivative sized to the frame (470px normally, 692px on a big screen). Your original PNGs are only ever read. Everything the component carries from earlier cycles was re-measured intact: the frame box, the cross-fade (sampled mid-fade at 0.961/0.039), `object-fit: contain`, the dots, the one-frame-exposed accessibility fix, and reduced motion.

- [ ] **S66 - Regression sweep after four cycles of change to one surface** - Status: Done (no defect) - Cycle: 42

  - **Source:** cycles 38-41 changed the global key handler, the arrival panel's width, its column count and the whole image pipeline. Four consecutive cycles on one surface is when a regression hides.
  - **Why / expected impact:** the `next/image` swap in particular replaced the exact element carrying the screen-reader fix from cycle 22 and the frame sizing from cycles 1 and 40.
  - **Outcome:** **Clean.** All 21 stops render; 28 images, 0 broken, all served through the optimiser; exactly one frame exposed to assistive tech at every project stop; no horizontal scroll; zero console errors. Also measured `/drive`'s cold-load weight for the first time: 208 KB total (21 KB document, 168 KB of script across 11 chunks, 18 KB CSS).

- [ ] **S67 - Correction: the `key` blocker is narrower than I reported** - Status: Done (correction) - Cycle: 42

  - **Source:** re-checking cycle 38's claim that the missing `key` props in `_app.jsx` block four improvements.
  - **Why / expected impact:** that claim shaped what I asked you to do, and it was too broad. Measured tag by tag against the served HTML: `next/head` auto-dedupes `<meta name="...">` but not `<meta property="...">` or `<link>`. Every tag `drive.jsx` sets with `name` appears once; every `property` or `link` one appears twice.
  - **Outcome:** **Your drive page's search-result description is already correct** - that never needed fixing. The `key` props are needed for the canonical, the `og:` tags and the structured data only. Separately: `twitter:card` and `twitter:image` are `name`-based and could be overridden today, but were deliberately not - the only image available is a 612x612 square portrait, so a wide card would look worse, and with `og:image` genuinely blocked it would leave Twitter showing one card and LinkedIn another. A drive-mode share image is your branding decision, not one for the loop to make unasked.

- [ ] **S68 - Did the 40x image saving make the screenshots soft?** - Status: Done (no defect) - Cycle: 43

  - **Source:** cycle 41 shipped a large optimisation, and the cycle most likely to hide a defect is the one that just shipped. "Serve it at the size it is drawn" is exactly how images end up blurry on a high-DPI screen.
  - **Why / expected impact:** the first reading looked like a confirmed defect - a 451px slot on a 2x display needs 902px, and `naturalWidth` reported 470.
  - **Outcome:** **No defect.** `currentSrc` carries `w=1080`, and re-decoding that exact URL in a fresh `Image()` returns 1080x552 - the resource really is 1080px. `naturalWidth` on a srcset image is density-corrected, which is why it reports 470. The screenshots are delivered at about **2.4x** the CSS size. Both the byte saving and the sharpness are real.

- [ ] **S69 - Is the default image quality right for screenshots full of small text?** - Status: Done (deliberately not changed) - Cycle: 43

  - **Source:** the same audit. WebP at the default q=75 is a plausible place to lose the fine UI text that cycle 40 worked to make readable.
  - **Why / expected impact:** it would have been easy to raise the quality on the grounds that it probably looks better - which is a guess, not a finding.
  - **Outcome:** **Measured, and left alone.** Decoding q=75/85/90 against near-lossless q=95 at the delivered 1080px width: q=75 has a mean channel error of **1.73 out of 255** with 1.5% of pixels differing by more than 8; q=90 improves that to 1.25 while costing **+76% bytes** (129 KB -> 227 KB per arrival). Below any perceptual threshold, so the trade is not worth making.

- [ ] **S70 - Does drive mode survive browser zoom and light theme?** - Status: Done (no defect) - Cycle: 44

  - **Source:** widening the angle after two verification cycles - testing conditions rather than components.
  - **Why / expected impact:** WCAG asks for usability at 200% zoom, which on a 1440x900 laptop means a 720x450 viewport - a size never tested. And the site's body is `bg-white` in light theme, which would show badly if the scene ever failed to cover it.
  - **Outcome:** **Both clean.** At 150% and 200% zoom the panel renders with zero panel/dash overlap, all six controls inside the dash, smallest control 25px, nothing off-screen and no horizontal scroll. Drive mode uses no theme variants at all, and with light mode forced every viewport corner still hits a drive-mode element.

- [ ] **S71 - With JavaScript off, /drive was a dead end** - Status: Done - Cycle: 44

  - **Source:** the same pass, testing the no-JavaScript condition.
  - **Why / expected impact:** the entire resume **is** in the served HTML, but wrapped in `sr-only`, which the stylesheet clips to nothing. The ignition splash renders as well - so a visitor without scripting saw "The resume, from the driver's seat" and a "Start engine" button that does nothing, with every word of the resume present and invisible. There was no `<noscript>` anywhere in the application.
  - **Outcome:** **Shipped** in `a779878`. A `<noscript>` panel explaining that drive mode needs JavaScript and linking to the classic site, which renders its content server-side and visibly. Unclipping the hidden resume was rejected: it would land behind a fixed scene that still covers the viewport, and would unclip the arrival announcer too. Verified with scripting **genuinely disabled** (a sandboxed iframe without `allow-scripts`, so the no-JS render could be seen rather than inferred): the panel renders, the link is hit-testable, and it covers the dead-end splash. With JavaScript on it renders a 0x0 box, produces no hydration warnings, and leaves the drive unchanged.

- [ ] **S72 - Do the edges of the route hold: junk deep links, corrupt saved progress, the end of the road?** - Status: Done (no defect in two of three) - Cycle: 45

  - **Source:** 44 cycles had all tested the middle of the drive. This pass tested its boundaries.
  - **Why / expected impact:** a shared link with a stale exit number, or a saved position from before you edited your content, are both things a real visitor hits and neither had ever been exercised.
  - **Outcome:** **Both clean.** `?exit=99` and `?exit=21` fall back to the ignition splash at MILE 0; the parser also rejects `011`, `+11` and `11abc`. Saved progress is wrapped against storage being unavailable, ignores anything out of range, and re-checks that the stored id still matches the stop at that index - so editing your content cannot drop a returning visitor somewhere unrelated. The destination page itself reads correctly (EXIT 20, 21/21, ARRIVED).

- [ ] **S73 - At the end of the road the accelerator was still lit, and did nothing** - Status: Done - Cycle: 45

  - **Source:** the same boundary pass, at `/drive?exit=20`.
  - **Why / expected impact:** the console's Next button correctly greyed itself out at the destination, but the **GO pedal beside it stayed fully lit** - at 62x76 the largest control in the cockpit, and the one the ignition splash tells you to use. Holding it left the dashboard byte-identical for 2.5 seconds. Worse than doing nothing: the pedal visibly depressed and brightened under the press while the car went nowhere, which reads as a broken page at the exact moment your contact details are on screen.
  - **Outcome:** **Shipped** in `c2338c8`. The pedal is now as visibly unavailable as Next, and tells a screen reader why ("Go - unavailable, this is the end of the route"). The brake stays live, because a brake that does nothing while stopped is how a real car behaves. Verified on both the desktop and phone layouts, and exit 10 re-measured to prove the pedal still drives (0 -> 27 MPH).

- [ ] **S74 - Arriving at the destination threw a keyboard visitor to the top of the page** - Status: Done - Cycle: 45

  - **Source:** not planned - found while writing the pre-mortem for S73, by asking whether the hazard I was about to introduce already existed.
  - **Why / expected impact:** it did, and it was already live. Driving the last leg with the keyboard on the Next button: at the instant the car arrived, Next disabled itself and the browser dropped focus to the top of the document. The next Tab then restarted from the beginning of the page - back through the entire screen-reader copy of your resume that an earlier cycle worked specifically to let the keyboard skip.
  - **Outcome:** **Shipped** in the same commit. Focus now moves deliberately into the cockpit, and only when that is demonstrably what happened - a visitor who never touched the controls is left alone. Verified with real clicks and keys, after discovering that this window reports `document.hasFocus()` as false, which makes programmatic focus fire no events at all and had made the first test report a false failure.

- [ ] **S75 - Does reduced motion still hold after the accelerator changed?** - Status: Done (no defect) - Cycle: 46

  - **Source:** cycle 45 was the first change to the pedal component in many cycles, and reduced motion is the promise this run has broken and repaired more often than any other.
  - **Why / expected impact:** visitors who ask their system for less animation must still be able to travel the whole route; the pedal is how they do it.
  - **Outcome:** **Intact.** With the preference forced on, pressing GO jumps straight to the next exit at 0 MPH; with motion allowed the identical press drives the car (5 MPH after 0.7s, 25 MPH after 3.2s). The control is what makes the result meaningful - without it, "no animation" is indistinguishable from a dead test.

- [ ] **S76 - The ignition splash and the start of the road** - Status: Done (no defect) - Cycle: 46

  - **Source:** cycle 45 tested the end of the route, so this tested the beginning.
  - **Outcome:** **Both clean.** The splash offers Start engine, a Resume - Exit 20 shortcut, Forget my progress, the six-key control legend and a way back to the classic site. At MILE 0 the mirror reads "Open road" rather than sitting empty - the no-previous-stop case is written, not overlooked.

- [ ] **S77 - On an ultrawide monitor your screenshots stay small while text panels go full width** - Status: Done (measured, deliberately not changed) - Cycle: 46

  - **Source:** probing viewport sizes no cycle had tried - 2560x1080 and 1920x900.
  - **Why / expected impact:** on a 2560x1080 screen a text stop stretches to 1216px while a project stop stays at 928px with a 451x225 screenshot. Same screen - and it is the screenshots, your stated priority, that stay small. It looks exactly like an oversight.
  - **Outcome:** **It is not one, and I left it alone.** The rule differs because the content does: widening a text stop makes it **shorter** (340px tall with nothing hidden, at every height from 1200 down to 800) because the extra width buys a third column. Widening a picture stop makes it **taller**, because the screenshot grows too - forcing it costs 10px of hidden content at 1080, 75px at 950 and 150px at 800. The height requirement added in an earlier cycle is therefore doing real work. The only genuinely free band is 1040-1119px tall, and a 1080p monitor's usable height usually falls below it once browser chrome is subtracted. Changing a deliberate rule that measures correctly, to buy that narrow band, was not a good trade.

- [ ] **S78 - Does the screenshot strip flip away while you are reading it?** - Status: Done (no defect) - Cycle: 47

  - **Source:** priority (c) is auto-cycling screenshots, and the classic failure of an auto-advancing carousel is that it moves on while you are still looking.
  - **Outcome:** **Already correct.** It pauses when the pointer is over it and when anything inside it takes keyboard focus, and the timer is torn down while paused rather than left running to skip a frame. Nothing to change.

- [ ] **S79 - Does driving 21 exits bury your Back button?** - Status: Done (no defect) - Cycle: 47

  - **Source:** never tested, and pressing Back is something real visitors do.
  - **Why / expected impact:** the address bar updates as you drive so a stop can be copied and shared. Done carelessly that adds a history entry per exit, and Back would then need 21 presses to escape the page.
  - **Outcome:** **Clean.** Driving a leg left the history length unchanged, and Back returned to the page the visitor came from.

- [ ] **S80 - Dead rules in the drive stylesheet, and markup completeness** - Status: Done (no defect) - Cycle: 47

  - **Source:** an earlier cycle found a function that was dead code carrying false documentation, so the same audit was run against the stylesheet and the server-rendered markup.
  - **Outcome:** **Both clean.** The stylesheet defines 25 classes and the components use 25 - no orphaned rules, and no reference to a class that does not exist (which would silently render a broken `class="undefined"`). The served HTML carries a heading for every one of the 21 stops, grouped into the 6 legs, so nothing on the route is missing from what a screen reader or a search engine sees.

- [ ] **S81 - Is any stop's title being cut off?** - Status: Done (no defect) - Cycle: 48

  - **Source:** the panel clips stop titles to a single line on desktop, and a truncated job title would be a bad thing to ship on a resume.
  - **Outcome:** **Clean.** All 21 stops checked at three widths including the tightest case, where the clipping is active and the panel is at its narrowest. Nothing is cut off anywhere.

- [ ] **S82 - A raw URL sat in a project description as dead text** - Status: Done - Cycle: 48

  - **Source:** looking at the panel rather than measuring it, after two cycles of condition-probing found nothing.
  - **Why / expected impact:** the Matrimoni description ends "...featured on Colab's highlighted projects page: https://www.joincolab.io/product/matrimoni" and that URL was plain text, not a link. To follow it a visitor had to select 43 characters by hand - awkward on a desktop, genuinely annoying on a phone, and it reads as unfinished on a page whose job is to present you as someone careful.
  - **Outcome:** **Shipped** in `4a54a2e`. The URL is now a link. **Your words are untouched** - the description lives in a file this run treats as read-only, so the text is passed through character-for-character and only the link was added; I verified that by comparing the rendered paragraph against the source string rather than reading it and deciding it looked the same. It also cannot run away with your copy: the pattern was tested against sentences ending in a full stop, a comma, a bracket, a semicolon and a question mark (none of which end up inside the link), and against a line containing a version number, a file path and an email address, which it correctly leaves alone. All 21 stops still render, with no link added to any of the other 20.
  - **One thing you may want to change yourself:** the sentence quotes a bare URL mid-paragraph. It is now clickable, but if you would rather it read as _"featured on Colab's highlighted projects page"_ with the link on those words instead, that is an edit to your own copy - which is yours to make, not mine.

- [ ] **S83 - The longest entry on your resume was the one you could not read without scrolling** - Status: Done - Cycle: 49

  - **Source:** continuing the previous cycle's approach of auditing the panels as they actually render. I measured how much of every one of the 21 stops is on screen.
  - **Why / expected impact:** 20 of 21 were fine. The exception was **EXIT 4, the sabbatical** - at 2,023 characters it is by far your longest entry, and the most personal thing on the route. On a 1440-wide laptop **22% of it sat below the fold**, and at 1280 wide, **34%**. On a 1920 monitor it fits perfectly. An earlier cycle had already built the wide three-column layout that solves this, but switched it on only at 1536px and up - so exactly the machines most people actually use were left with the cramped version of the one entry that most needed room.
  - **Outcome:** **Shipped** in `9a2a721`. The wide layout now starts at 1280px. At 1440 that entry hides nothing at all, and across all 21 stops **nothing is hidden anywhere** at that size; at 1280 it drops from 144px hidden to 36, and your toolbox stop went from 26px hidden to none. The text also reads better rather than worse - the column width narrows from 412px to about 360, which is a more comfortable line length, not a longer one.
  - **How I made sure nothing else broke:** an earlier cycle learned the hard way that widening a multi-column block can make content _taller_, so I measured every stop before and after at both screen sizes. Nothing got worse anywhere. Your project stops and the arrival screen were deliberately left exactly as they were.

- [ ] **S84 - Did last cycle's change hold up on a short screen?** - Status: Done (no defect) - Cycle: 50

  - **Source:** the previous cycle moved a layout rule down to 1280px but only ever measured it on two screen sizes, neither of them short.
  - **Outcome:** **It holds.** On a 1366x768 laptop the sabbatical entry now hides 52px where the old layout hid 136, and at 1280x720 it hides 76 against 160. Better at both, nothing worse.

- [ ] **S85 - The arrival panel was cutting your rear-view mirror in half** - Status: Done - Cycle: 50

  - **Source:** found while standing at those short screen sizes to check the above.
  - **Why / expected impact:** the mirror hangs from the roof lining by a fixed amount - a small stalk and a 38-pixel chip - while the panel's top was set as a percentage of the window height. Percentages shrink and pixels do not, so below about 769 pixels tall they collide. On a 1280x720 window the panel drew its bright top border straight through the bottom of the mirror, and on a phone held sideways it covered 25 pixels of it. The result read as the heads-up display floating _in front of_ a mirror that is bolted to the roof - exactly the kind of detail that breaks the illusion you asked for.
  - **Outcome:** **Shipped** in `6544a7a`. The panel now keeps a floor of clearance under the mirror, so all 21 stops clear it by at least 8 pixels at every size I tested, from a sideways phone up to a 1920x1080 monitor. Big screens are completely untouched - the new rule only does anything once the window gets short enough to matter.
  - **The cost, plainly:** pushing the panel down means a 720-768 pixel tall window now hides 8-11 more pixels of a long entry than it did after last cycle's improvement. I think that is the right way round - a sliced mirror looks broken, a little more scrolling does not - but it is a real trade and you should know it was made. On a sideways phone it costs nothing.

- [ ] **S86 - Does the mirror fix from last cycle survive on a phone?** - Status: Done (no defect) - Cycle: 51

  - **Source:** last cycle's fix relies on the mirror label being a fixed height, which was measured on a desktop where titles never wrap. On a phone the label is much narrower, and one stop's mirror reads "Sabbatical / COVID / Family and Personal Reasons".
  - **Outcome:** **It holds.** The label truncates rather than wrapping, so it stays exactly the same height at all 21 stops on both a portrait and a sideways phone, and the clearance never goes negative.

- [ ] **S87 - The route map told you where you were only if you could see it** - Status: Done - Cycle: 51

  - **Source:** found while checking the route map's layout on small screens.
  - **Why / expected impact:** the map marks the exit you are parked at with a coloured border and tint - and nothing else. There was no non-visual marker anywhere in it. Someone using a screen reader opened the route map and met **21 near-identical buttons**, with no way to tell which one is where they currently are. The map's whole purpose is to show you your place on the route, so for those visitors it did not do its job. What tells you this was an oversight rather than a decision: the "driven" tag next to it is real text, so that always was announced. Only your current position was silent.
  - **Outcome:** **Shipped** in `d88f5cd`. The current exit now carries a proper marker, using the specific term the accessibility standard reserves for "the current place on a map". Checked at the start of the route, a project stop and the destination: exactly one row is marked each time, it is the same row that is highlighted visually, it moves as you drive, and **nothing about the appearance changed** - it is an attribute, not a style.

- [ ] **S88 - Is anything else in drive mode saying something in colour alone?** - Status: Done (no defect) - Cycle: 52

  - **Source:** last cycle found the route map marking your current position visually only. Rather than wait to trip over another one, I went looking for the whole class.
  - **Outcome:** **Clean everywhere else, and deliberately so.** The road, sky, car interior, exit sign, gauges, warning lights and gear letters are all explicitly hidden from screen readers, with the actual information carried as text in the arrival panel and the itinerary instead - that is the right way round, and the trip computer even documents why. The screenshot strip exposes only the picture currently showing. The route map was the one gap, and it is now fixed.

- [ ] **S89 - Has the drive got slower after thirty cycles of changes?** - Status: Done (cannot be measured here) - Cycle: 52

  - **Source:** frame rate had not been checked since cycle 20, and a great deal has changed since.
  - **Why / expected impact:** the first reading looked alarming - about 16 frames per second while driving, with most frames far too slow.
  - **Outcome:** **The reading was meaningless, and I checked before telling you otherwise.** A completely blank page in the same browser runs at 15 frames per second, and drive mode sitting still runs at 15.2. Drive mode is therefore at or slightly above the ceiling this automated browser can produce at all - the driving simulation costs nothing measurable. I have written a warning into the task file so a later pass does not "discover" a performance problem that is really just the test environment. **A genuine frame-rate check needs a normal browser on your own machine**, which is something only you can run.

- [ ] **S90 - The engine kept running after you left the tab** - Status: Done - Cycle: 53

  - **Source:** the engine sound had not been looked at since cycle 20.
  - **Why / expected impact:** nothing in drive mode watched for the page being hidden. Turning sound off only fades the volume - it never stops the audio engine - and the code that follows the revs runs on the browser's animation loop, which pauses on a background tab. So if you switched tabs with sound on, the engine note did not wind down: it **froze at whatever revs you left at** and carried on, while the page quietly kept an audio engine running for a tab nobody was looking at.
  - **Outcome:** **Shipped** in `78d7f0f`. Leaving the tab now suspends the sound and coming back restores it - and it restores _your_ choice, rather than switching sound on for you.
  - **What I could not check, in fairness:** whether Chrome already silences hidden tabs by itself, which would make this inaudible rather than annoying. I tried to test it and could not get this browser to report itself as hidden, so I am not claiming to have heard it. **The change is safe either way** - if the browser already does it, this does nothing; if it does not, the noise stops.
  - **What I did check, by really running it:** a real click turns sound on (the button confirms it); hiding the page suspends the audio and showing it resumes it; with sound never turned on, hiding and showing twice creates no audio engine at all and does nothing; after switching sound back off, hiding does nothing; and only ever one audio engine exists no matter how often you toggle.

- [ ] **S91 - Coming back to the tab could leave the sound button lit over silence** - Status: Done - Cycle: 54

  - **Source:** auditing my own change from the previous cycle.
  - **Why / expected impact:** last cycle I made the engine suspend when you leave the tab and resume when you come back. The resume can be refused by the browser - and my code ignored the answer, so in that case the sound was gone while the button still said it was on. Your audio code is written specifically to never do that: turning sound on only claims success if sound genuinely started, because a control that lies about its own state is worse than one that admits it failed. I broke that rule on the way back in.
  - **Outcome:** **Fixed** in `e5fce6a`, one cycle after I introduced it. I proved the bug first by forcing the browser to refuse - the button did indeed keep claiming sound was on - then fixed it and checked all four situations: a refused resume now switches the button off honestly, clicking it afterwards still brings sound back, a successful resume leaves it on, and with sound never turned on nothing happens at all.
  - **Worth noting about the process:** last cycle's testing was not sloppy, but it only exercised the case where everything works, and this bug lived entirely in the case where something fails. I have written that into my own rules: test the failure path, because the happy path passes either way.

- [ ] **S92 - Can rough handling break the drive?** - Status: Done (no defect) - Cycle: 55

  - **Source:** last cycle's bug lived in a failure path that ordinary testing never touches, so this pass hunted for others.
  - **Why / expected impact:** the page updates the address bar as you drive, and that kind of update can fail when navigation is interrupted - which is exactly what happens if someone clicks Back and Next repeatedly. Left unhandled, that produces errors in the console.
  - **Outcome:** **Clean.** Fourteen rapid alternating Back/Next clicks produced no errors of any kind and left the route in a sensible state. Interfering with the car mid-drive - opening the map, hitting Escape, jumping backwards and forwards, tapping the accelerator - also produced nothing.
  - **One thing that looked like a bug and was not:** after all that, the arrival panel was missing. It turned out the car had simply coasted to a stop **between** two exits, which is what happens when you stop accelerating; the panel is for arrivals, and the dashboard correctly showed the distance still to go rather than "arrived". Holding the accelerator finished the journey in ten seconds and the panel came back. Nobody can get stranded.

- [ ] **S93 - Is the resume PDF real, current, and consistent with the site?** - Status: Done (no defect) - Cycle: 56

  - **Source:** the destination panel's "Download resume" button had never been checked in 55 cycles.
  - **Why / expected impact:** it is arguably the most important link on the whole site, and at 3,730 bytes it looked small enough to be a placeholder.
  - **Outcome:** **It is genuine.** That size is normal for a one-page, text-only PDF using standard fonts. I decompressed it and read the text: it is your real resume, and it matches the site - same current role, employer and dates as your experience file. Your PDF and your pages do not contradict each other, which is the failure mode that would actually cost you something.

- [ ] **S94 - Two dead links on the Solar Power Indy project** - Status: **Needs human** - Cycle: 56
  - **Source:** the first check in this run of whether the site's outbound links actually resolve. 18 of 21 are fine.
  - **Why / expected impact:** on **EXIT 11 (Solar Power Indy)**, _both_ buttons are dead. **Live site** points at `gosolarindy.energy`, and that domain **no longer exists** - not slow, not down: it does not resolve at all, and the `www.` and `http://` versions fail the same way, while other sites resolve fine from here. **Source** points at `github.com/HTJin/solar-questions`, which returns **404**, while every one of your other repositories returns fine. The dead address is also _printed on screen_ as the little browser bar above that project's screenshots.
  - **Why this is yours and not mine:** the fix depends on things only you know - whether the domain lapsed, whether the repo was renamed or made private, or whether there is a new home for it - and both values live in a file this run treats as read-only. I will not guess a replacement URL or quietly delete a project from your portfolio.
  - **Worth knowing:** everything else checks out, so this reads as one project that moved on rather than general rot.

_(Check the box once you've reviewed the outcome.)_

- [ ] **S95 - Every stop is a real interchange, on a divided highway** - Status: **Built, Needs testing** - Cycle: 57

  - **Source:** the owner, directly, mid-cycle. Not an idea the loop generated - it outranks what the Suggester had started on.
  - **What was wrong:** the road was marked as a two-lane road (a _dashed_ centre line at x=0) and called a highway, and every stop was a point on that line the car simply halted at. There was no ramp anywhere in the drive code.
  - **What was built:** a median with a barrier and an empty opposing carriageway replacing the dashed line; `rampAt(s)` giving every stop a deceleration ramp in and an acceleration ramp out; roadside furniture and the exit sign riding the ramp so they stand on the verge rather than in it.
  - **Evidence:** lint + build clean; at MILE 0 the canvas pixels read mainline / edge line / gore / ramp edge line / ramp across the near field, and the median barrier renders. Commit `a511ce0`.
  - **Not yet proven:** the taper in motion - the Chrome window was minimised, so rAF was paused (guardrail 24) and the car could not be driven.

- [ ] **S96 - Nothing in drive mode answers `forced-colors: active`** - Status: Proposed - Cycle: 57

  - **Source:** site audit + research (high-contrast mode is used by roughly 30% of WebAIM's 2018 low-vision respondents). `grep` finds no `forced-colors` or `-ms-high-contrast` rule anywhere in `src/`. Measure before fixing: the canvas is `aria-hidden` and its meaning is carried in text elsewhere, so this may be fine as it stands.

- [ ] **S97 - The pedals are pointer-driven but have only ever been tested with a mouse** - Status: Proposed - Cycle: 57

  - **Source:** site audit. `Pedal` binds pointer events and sets `touch-none select-none`, which is the right shape, but no cycle has exercised it with real touch events - specifically `setPointerCapture` + `pointerleave` when a finger slides off, and the long-press callout.

- [ ] **S98 - The cockpit was laid out as if the driver sat in the middle of the car** - Status: Done - Cycle: 58

  - **Source:** the owner, directly: "the left side of the dash is unrealistically long", "the driving wheel is supposed to be the left side of the vehicle but it's centered to the screen", "I don't think it makes much sense to have th brake and gas on the right side", "that doesn't mean to push the hud ... to be pushed to the right", "brake and go pedals should be to the right of the wheel", "now the dash is stretched way too far to the right".
  - **Shipped:** xl columns 0.5fr / wheel / 1.5fr; pedals pinned out of the flow right of the wheel; console capped at 720px.
  - **Evidence:** wheel 358/282/252/221/138px left of centre at 1920/1600/1440/1280/1024, `lg` unchanged at exactly the 153px recorded in cycle 18; zero pedal/console/trip/wheel collisions at five widths; console on one row everywhere; no horizontal scroll. Commits `f1c5b4f`, `6d2e3aa`, `5ee5782`.
  - **Note:** overrides cycle 18's centred-wheel decision. Guardrail 50 amended in the open.

- [ ] **S99 - Frame-driven behaviour IS measurable in a hidden tab** - Status: Done (technique) - Cycle: 58

  - Guardrail 24 says rAF is paused when the tab is hidden, which had been read as "unobtainable". Patching `requestAnimationFrame` before hydration inside a same-origin iframe lets the loop be pumped by hand with a synthetic clock, running the real `step()` and the real canvas paint deterministically. Recorded as a reusable probe in the task file.

- [ ] **S100 - The highway was one lane, and the exit barely left it** - Status: Done - Cycle: 58

  - **Source:** the owner: "why is the highway just one lane? make it at least 2" and "the exit is still not far enough away from the highway road".
  - **Shipped:** two lanes per carriageway with a broken lane line drawn from `LANES`; `LANE_OFFSET` and the steering drift limit derived from `LANE_WIDTH`; `RAMP_OFFSET` out to `CARRIAGEWAY + 14`; `LEG_LENGTH` 220 -> 340 so `RAMP_LENGTH` could grow 88 -> 136m with 68m of mainline still between ramps. Commit `694c4f6`.

- [ ] **S101 - The exit ramp now goes downhill and climbs back** - Status: Done (capped) - Cycle: 58

  - **Source:** the owner: "make the exit ramp way longer down a hill and then back up".
  - **Shipped:** `rampDropAt(s)` sharing one `rampProgress` with `rampAt(s)`; `sim.drop` on the camera; every ramp-following ribbon follows it down via `point.yRamp`; roadside furniture and the exit sign descend with it.
  - **Evidence:** `drop / ramp` constant at -0.0536214953271028 over 617 frames, spread 2e-17, matching `-RAMP_DROP / RAMP_OFFSET`.
  - **Honest limit:** the descent is capped at `CAM_HEIGHT * 0.85`. Deeper and the mainline lifts above the horizon and paints across the sky, because the renderer has flat ribbons and no depth buffer. See S102.

- [ ] **S102 - A real embankment, so the ramp can drop properly** - Status: Proposed - Cycle: 58

  - Needs an embankment face between the ramp grade and the mainline grade, plus clipping the mainline where it passes above the eye. Both are drawable with the existing `rail()` and a run-test like `ribbonRuns`. Until then `RAMP_DROP` stays under `CAM_HEIGHT`.

- [ ] **S103 - Continuous prose should not be set in newspaper columns** - Status: Done - Cycle: 58

  - **Source:** the owner: "the passage describing my time unemployed is not friendly to read with like 3 column layout."
  - Cycles 39/49 measured columns as a win and were right about _items_; prose is the opposite. Split now by content rather than width: paragraphs-only stops get one column with the measure bounded in `ch`. Measured at 1440x900 and 1280x800 on EXIT 04: one column, 679px, panel scrolls 178px. EXIT 02 unchanged as a control. Commit `4195b71`.

- [ ] **S102 - A real embankment, so the exit ramp can drop properly** - Status: Done - Cycle: 59

  - **Shipped:** flat road surfaces clipped at the eyeline (a horizontal plane above your eye cannot be seen) while standing objects stay unclipped; a new `embankment()` face between the mainline grade and the ramp grade, drawn from the same `point.y` / `point.yRamp` the two roads use. `RAMP_DROP` 1.15 -> 3m, 2.6x deeper.
  - **Evidence:** mainline re-inspected at travel 150.6 with the ramp fully out of it - two lanes, lane line, median line, edge line, barrier, delineators, sign, no artefacts. Three consecutive legs pumped: arrivals exactly on 340/680/1020, drop -3 and ramp 21.4 at every stop, drop/ramp constant at -0.14018691588785048 over 1,443 samples (spread 5.6e-17). Commit `8264530`.
  - **Honest limit, tried and rejected:** 7.5m was built and looked at. The embankment's near field lands off-screen left and its polygon sweeps in as a black wedge over the sky. See S104.

- [ ] **S104 - Per-polygon near-plane clipping** - Status: Proposed - Cycle: 59

  - Only needed if the ramp should drop further than 3m. Polygons would have to be split against a near plane and against the horizon instead of being handed to `ctx.fill()` whole. Genuinely large. Do **not** just raise `RAMP_DROP`: that has been tried at 6.5m and 7.5m and rejected both times, with screenshots.

- [ ] **S97 - The pedals were pointer-driven but had only ever been tested with a mouse** - Status: Done - Cycle: 60

  - **Two real defects found by finally exercising touch.**
  - **1. A disabled pedal still moved the sim.** Chrome dispatches pointer events to disabled buttons - settled with a real click plus an enabled control proving the click landed, not inferred from synthetic dispatch. Pressing the greyed-out GO at the destination set throttle to 1. The car could not move, so nothing looked wrong.
  - **2. `setPointerCapture` could swallow the press.** `?.` guards a missing method, not a throw; when it threw, `onPress()` never ran and the pedal did nothing.
  - **Evidence after the fix:** press survives the throw (throttle 1, zero uncaught errors); press drives the car at 4.11 m/s over 30 frames; pointerup, pointercancel and slide-off all release; brake works; disabled GO leaves throttle 0; brake still live at the destination. `touch-action: none`, `user-select: none` confirmed. Commit `ae31e76`.
  - **Not claimed:** dispatched pointer events are untrusted, so this covers what the handlers do with the events they receive, not real-finger behaviour against Chrome's gesture heuristics.

- [ ] **S105 - The centre display was a 6.2:1 letterbox, not a screen** - Status: Done - Cycle: 61

  - **Source:** the owner, asking for a web search on real car interior proportions: "the proportions of certain parts of the ui just really makes it look very unrealistic. such as the elongated hud".
  - **Measured first:** 720 x 116 px = 6.21:1. Production centre displays run ~10-12.3 inches on a 16:9 panel (~1.78:1); a 10-inch 16:9 unit is 8.7 x 4.9 inches. The 48- and 56-inch pillar-to-pillar panels are several displays side by side, not one strip.
  - **Shipped:** `aspect-video` with width derived from height; centre stack capped at 24rem; footwell back in normal flow now that the stack cannot stretch.
  - **Evidence:** aspect 1.77-1.78 at 1920/1600/1440/1280/1100, zero collisions, console on one row, no horizontal scroll. Commit `664def6`.

- [ ] **S106 - The exit panel was too wide to read** - Status: Done - Cycle: 61

  - **Source:** the owner: "i dislike the 3 column layout of the exit. it's too wide and hard to read".
  - **Shipped:** card 76rem -> 60rem, columns capped at two.
  - **Evidence:** `columnCount` 2 at every width, measure 433px (~57 characters). Commit `664def6`.
  - **Note:** this reverses part of cycle 49, whose measurements were correct but whose conclusion was not - a narrow measure inside a very wide panel is still a hard read.

- [ ] **S107 - The instrument cluster and the steering wheel are sized by unrelated rules** - Status: Proposed (measured) - Cycle: 62

  - **Source:** the owner's cycle-61 note that "the proportions of certain parts of the ui just really makes it look very unrealistic" - plural. Cycle 61 fixed the HUD; this is the other half.
  - **Measured:** gauges are sized in `vh`, the wheel comes from a `vw`-based column, so the ratio between them drifts with the window: 0.813 at 2560x800, 0.602 at 1600x1200, 0.673 at 1920x1080, 0.712 at 1280x1024, 0.774 at 1440x900, 0.831 at 1100x760. **Spread 0.229** - 38% variation in a relationship that is fixed hardware in a real car.
  - **Not fixed on sight, deliberately:** guardrail 52 forbids quietly redesigning the cockpit, and the fix lands in the dash height budget tuned by cycles 12, 25 and 44 for short and landscape-phone viewports. Needs its own cycle with guardrails 43/44/51 loaded.
  - **Suggested shape:** size the gauges from the wheel's column width, keep today's `vh` value as a ceiling so short viewports are provably unchanged, and prove the phone cockpit byte-identical.

- [ ] **S108 - Two cockpit non-defects, recorded so nobody "fixes" them** - Status: Done (no defect) - Cycle: 62

  - The instrument cluster **is** centred on the wheel axis: offset 0 at 1920x1080 and 1440x900. A first reading said 40px left; that was measuring two of the row's three children and ignoring the gear block.
  - The gauges overflow their flex row by ~9px each side, and it is invisible - the element that paints the binnacle housing is a wider parent, so nothing clips.

- [ ] **S107 - Cluster, wheel and column are sized by three different rules** - Status: Proposed (mechanism proven, defect confirmed) - Cycle: 63 (opened 62)

  - **Mechanism:** `--dash` = exactly 36% of viewport height. The wheel wrapper is `aspect-square h-full`, so the wheel's width **is** the dash height (measured `dashH - 19px` in six of six samples). The gauges use the same height basis but with a px cap that freezes them past ~971px viewport height. The column containing both is `clamp(260px, 24vw, 400px)` - viewport width.
  - **Confirmed defect:** the wheel overflows its column - 1.077x at 1600x1200, 1.141x at 1280x1024, ~1.57x at 1024x1180 - and **draws over the brake pedal and the door card** at the latter two (gap -2px and -53px). It is `pointer-events-none`, so it does not block the press; it covers it.
  - **Trap for whoever fixes this:** the wheel rotates via `style.transform` about `origin-center`, the _box_ centre. Any fix that leaves the wrapper non-square (e.g. bare `max-w-full`) lets `preserveAspectRatio` centre the content somewhere other than the box centre, and the wheel will **orbit instead of spin** - invisible in a static screenshot. `inset-0` keeps origin and content aligned but re-centres the wheel vertically out of its tuned `top-[40%]`. No constant fraction works: the overflow spans 0.925 to ~1.57.
  - **Shape of the real fix:** derive wheel, column and gauges from one `min(column width, dash height)`. That is a cockpit re-derivation touching the dash budget tuned by cycles 12/25/44, so guardrail 52 applies - it wants an explicit decision, not another audit.

- [ ] **S95 - Nothing in drive mode answered `forced-colors: active`** - Status: Done - Cycle: 64 (opened 57)

  - **Researched then measured.** Forced colors reverts `box-shadow` and collapses gradients to flat system colours.
  - **Audit of 35 on-screen controls:** 27 plain text links (fine - system colour plus text backplate), 6 with real borders (recoloured, fine), and **2 painted boxes with no border: BRAKE and GO**. Their entire shape is a gradient plus a box-shadow over a transparent background, so both would have vanished as boxes and left the primary driving controls as bare labels.
  - **Fix:** `border border-transparent` on the pedal - invisible normally, painted in a system colour under forced colors.
  - **Evidence:** pedal outer rects identical before and after at 1920/1440/1280 (border-box, so no layout cost); post-fix audit returns an empty at-risk list; console row on one line; no horizontal scroll; phone and landscape-phone checked. Commit `dd32f65`.
  - **Not claimed:** forced colors cannot be emulated through this browser bridge, so the rendering itself was not observed - only the inventory and the layout neutrality were measured. Worth a human eye on a real high-contrast setup.

- [ ] **S109 - The highway had no flank, so there was a gap under the elevation** - Status: Done - Cycle: 65

  - **Source:** the owner: "you failed to give the profile of the highway road any existence so I literally see an empty gap between the elevation ... it looks very unnatural when you get back on the highway road as the road just flattens out to 0 elevation".
  - **Cause:** `embankment()` was gated on lateral separation. The ramp starts falling long before it moves sideways, so the whole first half of each taper had a real height difference with nothing drawn to fill it. And the mainline itself was an infinitely thin ribbon - no side face - so it floated.
  - **Fix:** gate on elevation difference; clamp the face's foot so it can never sit inboard of its top, which collapses the quad to a vertical face - the highway's flank - when the ramp has dropped but not yet moved aside.
  - **Knock-on:** retired the premise of S104. 5.5m drop now renders cleanly where 6.5m and 7.5m previously did not.
  - **Evidence:** three legs pumped, arrivals exactly on 840/1260/1680, drop -5.5 and ramp 30.2 at every stop, drop/ramp constant (spread 8.3e-17), 387 frames on open mainline, zero errors; mid-taper and bottom-of-ramp inspected. Commit `b7cfa73`.
  - **Also delivered:** lane width 3.7 -> 4.1m, ramp offset +14 -> +22m, drop 3 -> 5.5m, leg length 340 -> 420m.

- [ ] **S110 - Regression sweep after the road overhaul** - Status: Done (no defect) - Cycle: 66

  - All 21 exits deep-linked and checked: hydrated, heading present, `n/21` counter correct, 28 of 28 images loading, no horizontal scroll at any exit.
  - Derived route distance followed `LEG_LENGTH` correctly: 20 x 420 / 1609.34 = 5.2 mi, destination reads `5.2 MI`.
  - **Consequence quantified, for the owner to judge:** a leg is now 14.1s and the whole route about 4.7 minutes of held accelerator, up from ~3.1 minutes before the run started widening the legs. Not a defect - the direct result of "I want the ride to the next exit a bit longer".

- [ ] **S111 - There is no print stylesheet anywhere** - Status: Proposed - Cycle: 67

  - **Measured:** walked every stylesheet in the live page and counted `@media print` rules. **Zero.** `/drive` is a fixed-position cockpit with `body { overflow: hidden }`, a full-viewport canvas and absolutely-positioned chrome, so Print or Save-as-PDF will almost certainly produce a blank or broken page.
  - **Why it matters:** recruiters do save portfolios to PDF, and the resume itself is the content here. Measure the actual print render first, then decide - the fix might be as small as a print block that hides the cockpit and shows the crawlable itinerary that already exists in the DOM.

- [ ] **S112 - Time-to-content: a first visitor must drive to reach anything** - Status: Proposed - Cycle: 67

  - **Source:** market research. Hiring managers spend only a few minutes on a portfolio, and the repeated advice is "do not bury the case studies behind animations - the first click should answer what you owned and why it matters".
  - `/drive` puts the entire resume behind a driving simulation. There _are_ fast paths - the route map, `?exit=N` deep links, and the classic site - but none is obvious on arrival, and **cycle 65's longer legs made this measurably worse: 14.1s per leg now, up from ~9.3s**.
  - **Measure first:** seconds and actions from cold load to the first substantive stop, and how discoverable the route map is to someone who has not read the key hints. Only then decide whether anything should change - the owner chose this experience deliberately, so this is a measurement, not a redesign proposal.

- [ ] **S113 - Cold page weight is unmeasured, and my attempt to measure it was worthless** - Status: Proposed - Cycle: 67

  - Tried to total `transferSize` from the frame's resource timing and got **0.9 KB**, which is nonsense: everything was served from cache, and cached resources report `transferSize: 0`. Recorded so nobody quotes that number.
  - Needs a genuinely cache-bypassed load. Market research is specific here - "should load in under 2 seconds", Lighthouse 90+ - and the last real figure was 208 KB back in cycle 42, since when the drive page has gained the ramp geometry, the embankment and the two-lane road.

- [ ] **S114 - Heap growth over a long drive is still unmeasured** - Status: Proposed - Cycle: 67

  - Cycle 33 proved the per-frame subscriber set does not leak, but nothing has ever measured the **heap** across a long session.
  - **My cycle-67 attempt was invalid and is not evidence of anything:** I never clicked "Start engine" in the probe frame, so the sim loop never mounted, all 48,000 pumped frames were no-ops and `travel` stayed at 0. The 3.9 MB delta it produced measures GC noise, nothing more.
  - Redo properly: start the engine, drive the full 20 legs, force GC where possible, and treat `performance.memory` as coarse - look for a trend across repeated runs rather than a single delta.

- [ ] **S111 - No print stylesheet anywhere** - Status: Done - Cycle: 67

  - **Measured before building:** zero `@media print` rules on the live page. Printing would have given a page of dashboard and no resume, because `body.style.overflow = 'hidden'` clips the document to one page, the cockpit and canvas are absolutely positioned scenery, and the real content is a 9,854-character `.sr-only` itinerary clipped to `rect(0,0,0,0)`.
  - **Shipped:** a print block that hides the canvas and everything `aria-hidden` inside the scene, and un-clips the `.sr-only` itinerary so the resume itself prints. Plus a `beforeprint`/`afterprint` pair in `DriveScene` that releases and restores the inline body overflow.
  - **Two constraints found by the compiler, not assumed:** CSS Modules rejects any top-level selector with no local class (`:global(html)` and the `:global { html, body }` block form are both build errors), and the body overflow is inline so a stylesheet could not have won anyway.
  - **Evidence:** one print block with four selectors in the shipped CSS; `.sr-only` un-hashed via `:global`, `.printable` hashed and matched against the scene root; `beforeprint` -> overflow `visible`, `afterprint` -> `hidden`; screen layout identical across seven controls. Commit `1dde62c`.
  - **Not claimed:** the printed output was not observed - print media is not emulatable through this bridge and `window.print()` opens a blocking modal. Worth a human hitting Ctrl+P once.

- [ ] **S114 - Heap growth over a long drive** - Status: Done (no leak) - Cycle: 68

  - **Redone properly** after cycle 67's attempt was invalid. This run started the engine and used `travel > 0` as a **validity gate before reading any heap figure**.
  - **Result:** 20 legs, `finalTravel` 8400 (= 20 x 420, the whole route), 16,780 frames pumped. Settled heap **90.05 -> 90.67 MB: +0.62 MB total, 0.031 MB per leg.** No leak.
  - **Worth knowing:** the mid-drive samples climb 95 -> 100.5 -> 106.8 -> 113.8 MB and read exactly like a leak. They are allocation churn - the settled figure returns to baseline. Anyone re-running this must let it settle before concluding anything.
  - Together with cycle 33 (subscriber set does not leak) the long-session question is now closed.

- [ ] **S113 - Cold page weight** - Status: **Not measurable in this environment** - Cycle: 68

  - Cache-busting the document URL is not enough: the JS and CSS chunks are content-hashed and already cached, so 11 of 13 resources report `transferSize: 0`, and the browser cache cannot be cleared through this bridge. The 22.6 KB measured is the **document alone**.
  - Joins the list of things this environment cannot see: frame rate (cycle 52), forced-colors rendering (cycle 64), the printed page (cycle 67). All need a human with DevTools, where "Disable cache" plus a reload answers it in seconds. The last real figure was 208 KB in cycle 42.

- [ ] **S112 - Time-to-content: does the drive bury the resume?** - Status: Done (no defect) - Cycle: 69

  - **Measured, and the worry does not hold.** The idea came from market research ("do not bury the case studies behind animations"), but on this site:
    - the **origin card - name, role, tagline - renders on the first click**, not after a drive;
    - the splash offers **"back to the classic site"** for anyone who does not want the drive at all;
    - the **route map is a cockpit control and is named on the splash**: three clicks reaches any of the 21 stops instantly.
  - The only slow route is the intended one: 2 clicks and **14.1s** to EXIT 01. That is the owner's deliberate design, and S112 was scoped as a measurement, not a redesign proposal. **No change recommended.**
  - **Caveat found while measuring:** a `width > 8 && height > 8` "visible control" filter counts the sr-only itinerary's links, because `clip: rect(0,0,0,0)` on the ancestor does not zero descendants' rects. Did not affect this result or cycle 64's, but future probes should test the clipped ancestor.

- [ ] **S115 - Re-verify the reduced-motion contract against the rewritten road** - Status: Proposed - Cycle: 70

  - Last verified in **cycle 46**. Since then cycles 57-65 rewrote nearly everything underneath it: the exit ramps, the elevation drop, the embankment, the two-lane carriageway, and - most relevant - `goTo` now sets `sim.ramp` and `sim.drop`. **Reduced motion teleports through `goTo`**, so it sits directly downstream of the code that changed most.
  - Verify with the cycle-29 probe (patch `matchMedia` after `src` is set but while `readyState` is still `loading`), and always against a control run with motion allowed - without one, "no animation" is indistinguishable from a harness that did nothing.
  - Check specifically that a reduced-motion teleport lands with `ramp` and `drop` correct for the destination stop, not left at the values from where it started.

- [ ] **S116 - Does the `n` shortcut work from a parked state?** - Status: Proposed - Cycle: 70

  - Cycle 70's keyboard audit could not settle this: the target had already advanced from the earlier accelerator press, so `n` had nothing to do and the result was inconclusive. **Recorded as unproven rather than as a pass or a failure.** Retest from a genuinely parked state.

- [ ] **S117 - Keyboard-only traversal, end to end** - Status: Proposed - Cycle: 70

  - Cycle 70 proved a leg can be _driven_ on keys alone, and cycles 33/34 fixed focus order and the skip link. What has never been done in one pass: start the engine, drive, open and close the route map, reach the arrival panel's links, and continue - all without a pointer. That is the actual journey a keyboard user takes.

- [ ] **S115 - Re-verify the reduced-motion contract against the rewritten road** - Status: Done (no defect) - Cycle: 70

  - **The risk:** reduced motion teleports through `goTo`, and cycles 57-65 gave `goTo` responsibility for `sim.ramp` and `sim.drop`. A teleport could plausibly have landed with both stranded at the origin's values.
  - **It does not.** Reduced motion jumps to **travel 420 in 2 frames** (3 to arrive) with **ramp 30.2 and drop -5.5, both correct for the destination**.
  - **Control run with motion allowed animates properly** - travel still 0 after 2 frames, speed 0.27, 842 frames to arrive. Without the control, "it teleported" would have been indistinguishable from a harness that did nothing.
  - **Caveat:** the `matchMedia` patch landed at `readyState: interactive`, not the `loading` cycle 29 recommends. It worked - the patched run reports true, the control false, and they behave differently - because framer-motion reads the query at mount. `loading` is still the safer target.

- [ ] **S116 - Does the `n` shortcut work from a parked state?** - Status: Done (pass) - Cycle: 71

  - Cycle 70 could not settle this and filed it as **unproven** rather than guessing: the throttle had already advanced the itinerary, so `n` had nothing to do.
  - Retested from a controlled parked state (`parked: true, target: 0, travel: 0, throttle: 0`): `n` advances the target **0 -> 1**, engages autopilot, and arrives at travel 420 in 838 frames. **Works.**

- [ ] **S117 - Keyboard-only traversal, end to end** - Status: Done (no defect) - Cycle: 71

  - Route map is closed on arrival, **opens on `m`**, **focus moves into the dialog** (cycle 10's fix still holding after everything cycles 57-65 changed), **closes on Escape**, and the car is still drivable after the round trip.
  - With cycle 70's finding that a full leg drives on keys alone, and cycles 33/34's focus-order and skip-link work, the keyboard journey is now covered end to end.

- [ ] **S118 - The route map gives no sense of distance or position** - Status: Proposed (needs owner appetite) - Cycle: 72

  - **Measured:** the map lists all 21 stops correctly but prints **zero** distance figures. A visitor looking at it has no sense of where a stop sits along a 5.2-mile route, or how far the next one is.
  - `stop.s` and `formatMiles()` already exist, so a mile figure per row would be derived rather than invented - the same discipline as the trip summary.
  - **Flagged as needing the owner's appetite rather than queued for building.** The owner has twice rejected inventions of mine in this cockpit, and adding a column to their route map is an addition, not a correction. It is filed as an idea, not a defect.

- [ ] **S119 - Five consecutive no-defect cycles: the run is at diminishing returns on drive mode** - Status: Observation - Cycle: 72

  - Cycles 66, 69, 70, 71 and 72 all returned no defect. Drive mode has now been audited from most angles this environment can reach.
  - The remaining substantive work is **parked on the owner** (S107 - the wheel drawing over the brake pedal, a confirmed defect deliberately not fixed) or **outside this run's write scope** (the classic site's cropped and non-cycling photos, the duplicate canonical on `/drive`, the missing sitemap entry).
  - Four things this environment provably cannot measure remain open for a human with DevTools: frame rate, forced-colors rendering, the printed page, cold page weight.
  - Recorded so that continuing to generate self-directed work is a deliberate decision rather than momentum.

- [ ] **S120 - Re-verification of all four parked Needs-human items** - Status: Done (all still valid) - Cycle: 73

  - Cycle 35 last did this, 38 cycles ago. These are patches the owner applies **blind**, so drifted line numbers would be my fault.
  - **Classic site photo patch - exact:** `aspect-video` line 97, `object-cover` line 120, `AnimatePresence` line 104, `handleScreenshotClick` line 61, file 152 lines, and `setInterval|setTimeout|useEffect` still returns **nothing** - still click-only, still cropping.
  - **Sitemap - unchanged:** one `<loc>`, no `/drive`.
  - **Duplicate canonical - unchanged:** `/drive` ships two canonical tags, `https://htae.dev` **first** and `https://htae.dev/drive` second, so crawlers still read `/drive` as the homepage. `og:url` still doubled.
  - **Dead links - still dead, with one honest correction:** `gosolarindy.energy` still does not resolve. The repo link returned a **connection abort** this run rather than cycle 56's clean **404** - still unreachable, and the control `github.com/HTJin` returns **200** so the network and GitHub are fine, but the ledger now records what actually came back rather than repeating the older figure.

- [ ] **S121 - Three toolchain warnings, all outside this run's write scope** - Status: Needs human (parked) - Cycle: 74

  - Captured from real `npm run lint` / `npm run build` output during this session, not from reading config:
    1. **`SideNav.jsx:38:6` - `useCallback` has a missing dependency, `sections`.** The only one of the three with genuine bug potential: a stale closure over `sections` would make the callback act on outdated data. Worth a look even if it turns out to be intentional.
    2. **`next.config.mjs` enables the experimental `scrollRestoration` flag.** Experimental features are outside semver, so a Next upgrade can change or drop it silently.
    3. **`tailwind.config.js` safelists `/^apexcharts-.*$/`, which matches no classes.** Dead config for a charting library the site does not appear to use; harmless but it makes every build print a warning, which trains people to ignore build warnings.
  - **All three are in files the Guardrails block puts off-limits** (`next.config.mjs`, `tailwind.config.js`, and `src/components/**` outside `drive/`), so they are recorded rather than fixed. All are small.

- [ ] **S122 - End-of-run integrity check on the branch** - Status: Done (clean) - Cycle: 75

  - Run because nothing buildable remained and 34 commits is a lot for the owner to take on trust.
  - **Owner content untouched, proven:** `git diff --numstat` against `src/content`, `src/components/sections` and `src/lib` returns nothing at all.
  - **Scope held, proven:** the complete set of source files changed across the entire run is **nine** - `Dashboard.jsx`, `DriveScene.jsx`, `ExitSign.jsx`, `RoadCanvas.jsx`, `route.js`, `StopCard.jsx`, `useDrive.js`, `world.js` and `drive.module.css`. Every one inside the declared scope. No leakage into the classic site, config, or content.
  - **The owner's own pre-existing uncommitted edits** in `src/components/sections/*` and `src/content/*` are still exactly as the run found them - never staged, never committed, never edited.
  - **Branch state:** build clean, `/drive` 22.5 kB first-load 152 kB, zero drive-scope lint issues, nothing uncommitted in scope, nothing pushed.

- [ ] **S123 - Verify the vegetation only appears where there is a slope** - Status: Proposed (first attempt invalid) - Cycle: 80

  - The tufts are gated on `drop > -0.35 -> skip`, so nothing should be planted on the open mainline. **Unverified.**
  - **Cycle 80's attempt does not count:** counting pixels near the flower colours matched the **sunset sky** - amber `(244,208,122)` +/-22 is the dusk gradient - giving 4,837 "flowers" at drop 0 versus 1,092 mid-descent. The impossible direction (more planting where there is no slope) is what exposed it.
  - **A method that would work:** temporarily raise the flower colours to something absent from every daylight palette (pure magenta), rebuild, count, then revert. Or count only within a narrow band tracking the slope face rather than the whole canvas. Either needs a control run that must come out different.

- [ ] **S123 - Verify the vegetation only appears where there is a slope** - Status: Done (gate correct) - Cycle: 81

  - Cycle 80's attempt was discarded: counting near the real flower colours matched **sunset sky**.
  - **Valid method:** temporarily repaint the flowers pure magenta / cyan - colours absent from every daylight palette - so a hit can only be a flower.
  - **Result: 0 marker pixels on the open mainline (drop 0), 7 mid-descent (drop -2.61).** The gate holds; nothing is planted where there is no slope. The control differs, so the zero is meaningful rather than an inert harness.
  - Markers reverted, build clean, `git diff --numstat -- src/` empty. **No code change was needed** - the code was already right, only the evidence was missing.

- [ ] **S124 - The print sheet does not actually hide the cockpit** - Status: Proposed (review finding, medium) - Cycle: 94

  - The `@media print` block hides `.printable canvas` and `.printable [aria-hidden='true']`. `Sky` and `CarInterior` are aria-hidden and `RoadCanvas` is a canvas - but **`Dashboard`'s root carries `id="drive-controls"` and no `aria-hidden`**, and neither do the StopCard overlay wrapper, the exit link, or the ignition splash. Forcing `.printable` to `position: static` removes their containing block, so in paged media they land on page 1 over the now-unclipped itinerary.
  - Printing before pressing Start engine would give a full-bleed ignition panel; printing mid-drive gives a dashboard band across the first page.
  - **This is a feature I shipped in cycle 67 and called verified.** What I verified was that the rules existed, targeted the right selectors and did not change the screen - never that the printed page was right, which I stated at the time as a limitation. The limitation turned out to be hiding a real defect.
  - Fix: hide everything under `.printable` and re-show only `.sr-only`, rather than enumerating things to hide.

- [ ] **S125 - `afterprint` hardcodes `overflow: hidden` instead of restoring** - Status: Proposed (review finding, low) - Cycle: 94

  - The mount effect deliberately saves `previousOverflow` before setting `hidden`; the print handler I added writes the literal `'hidden'` back. Equivalent today, divergent the moment anything else touches `body.style.overflow`. A browser firing `beforeprint` without `afterprint` leaves the page permanently scrollable.

- [ ] **S126 - Dashboard comments describe an implementation that no longer exists** - Status: Proposed (review finding, low) - Cycle: 94

  - The block explaining that the pedals are "positioned out of the flow, pinned to the bottom left" and the long note about why `absolute` must live on a separate node from `.footwell` both describe the _abandoned_ approach - the shipped markup has no `absolute` anywhere and the `relative` positions nothing. Two adjacent comments also state opposite facts about whether the footwell is in flow.
  - In a codebase where comments carry the reasoning, this is how a later edit preserves the wrong invariant. It is the same fault as the `footOf` comment that defended a vertical wall.

- [ ] **S127 - The `max` clamp and its own comment disagree** - Status: Proposed (review finding, low) - Cycle: 97

  - `bankFoot` is `max(BANK_TOP + 0.25, min(rampEdge, BANK_TOP - drop * SLOPE_RUN))`. The JSDoc says "the `min` stops the bank running out across the ramp" - but **whenever the `max` wins, the foot is outboard of `rampEdge`**, so that guarantee does not hold in exactly the regime the `max` was added for. At the measured point (drop -0.86, top 10.6, rampEdge 7.46) the foot is 10.85, i.e. 3.4m past the ramp's near edge.
  - It also makes the face a ~0.25m near-vertical wall for the first part of every descent - the "90-degree wall" `SLOPE_RUN`'s own comment says must never happen. The drop is tiny there so it is not visually severe, but **the invariant the comments assert is not the one the code enforces**, which is the third time in this run a comment has argued for something the code does not do.
  - Fix: either bound the ramp clamp to `rampEdge > BANK_TOP` explicitly, or correct both comments to describe the real precedence.

- [ ] **S128 - The `<noscript>` overlay is inside `printKeep`, so print cannot hide it** - Status: Proposed (review finding, low) - Cycle: 97
  - `.printable > *:not(.printKeep)` only reaches **direct children** of the scene. The `<noscript>` full-bleed panel is a _grandchild_, inside the kept wrapper, so with scripting disabled a printed page gets a solid dark "Drive mode needs JavaScript" panel over the unclipped resume - the same `position: fixed` overlay failure the keep-list approach was supposed to make impossible.
  - Fix: hoist the `<noscript>` to be a sibling of the `printKeep` wrapper, or hide it explicitly in the print block.

## Cycle 100 — owner-reported (not AI-generated)

- [ ] **S129 — Transparent seam under the shoulder guardrail** — _source: owner, "the gap is still there"._
      Status: **Done** (`1cdd982`). The rail hangs 0.42m above grade; the bank stopped at grade; the 0.42m between was
      never painted, and from the ramp there is nothing behind it. Evidence: alpha 0 at y206-212/y230-236 on a frozen
      frame at drop −4.18; after the fix, 0/1406 transparent samples below the horizon at drop −5.5.
- [ ] **S130 — Car drives through the shoulder guardrail** — _source: owner, "we're literally just driving through the
      highway rail"._ Status: **Done** (`1cdd982`). Rail was `() => true`, full length, fixed in world space, while the
      ramp sweeps past it. Now breaks at the gore, opening derived from the ramp's footprint. Evidence: mainline
      regression sweep 0/1406 transparent below horizon.

## Cycle 102 — Suggester

_Source: live audit of `/drive` on the current build (`:3009`), driven with the engine running and inspected at the
gore (travel 302, ramp 6.4m, drop 0). **No market research was done this pass** — the audit filled the batch, and
claiming research I did not run would be worse than a short list._

- [ ] **S131 — The gore has no markings.** _Status: Proposed._ **Observed**, not inferred: at the point where the
      ramp separates, the wedge between the mainline and the ramp is plain verge. Both roads carry white edge lines,
      but the gore itself has no diagonal hatching, no bounding solid line, and no painted nose. Every real
      interchange paints that wedge, and it is the single most recognisable marking of an exit — the owner asked for
      "a real highway exit", and this is the part of one that is missing. _Scope:_ small and self-contained; the gore
      wedge already comes out of the geometry (`RoadCanvas`, the ramp `band(..., true)` and the mainline band), so
      this is a paint pass between two known lateral offsets, in the same `stripes`/`ribbonRuns` idiom already used
      for the rumble bands. _Expected impact:_ the exit reads as an interchange rather than a road that forks.
      _Guardrail to carry:_ the hatching must be painted **inside the eyeline clip** with the other flat surfaces, or
      it will hang in the sky on the descent exactly as the tarmac did in cycle 58.
- [ ] **S132 — Investigate: vegetation may read as floating dots near the horizon.** _Status: Proposed._ **This is an
      investigation, not a fix** — I saw scattered pink/orange specks above the road surface near the vanishing point
      in the gore frame, and I do **not** know whether they are flowers correctly planted on the _previous_ exit's
      embankment (which is genuinely in view there) or tufts being drawn where no bank exists. Those two look
      identical at that distance and the difference is the whole question. _Done when:_ the planting's world position
      at those screen coordinates is known — measure whether tufts are emitted at points where `drop` is ~0, which
      would mean planting with no bank to plant on. Do not change `vegetation()` before that is answered.

## Cycle 116 — Suggester

_Live audit of the running build. **No market research this pass** — the audit filled the batch, and claiming
research I did not run would be worse than a short list._

- [x] **Audit: console is clean.** A cold load, a full leg driven, route map opened and closed, sound toggled and
      Back pressed produced **zero** errors or warnings — including no hydration mismatch after ten source changes
      tonight. **Verified with a control:** a deliberate `console.error`/`console.warn` sentinel *was* captured by the
      same reader, so the empty result is a real absence rather than a dead probe. (The tool only starts capturing
      when first called — the first read returned "no messages" for a page that had already loaded, which would have
      been a false all-clear.)
- [x] **Audit: deep links are robust.** `?exit=999`, `-1`, `abc`, `1.5` all fall back to index 0, hydrate correctly
      (`body.overflow === 'hidden'`) and show the default title; `?exit=0` yields `MILE 0`. The differing title on a
      valid value is the control proving the harness distinguishes states. No crash, no blank card, no stuck state.
- [ ] **S138 — dev-only debug tint so the gore invariant needs no source edit.** _Proposed._ See the backlog entry.
      Comes directly from the fact that the run's most-regressed invariant currently costs an instrumented build to
      check, which is why its regression went unnoticed.

## Cycle 119 — Suggester

- [x] **Audit: advance-sign distances are accurate.** 1380 / 1150 / 820 / 490 / 260 FT against a true
      1378 / 1148 / 817 / 486 / 259, rounded to the nearest 10ft, sampled while driving a full leg.
- [ ] **S140 — the sign uses feet above a quarter mile.** _Proposed._ Surfaced by the audit above: the comment
      justifying feet-only asserted a 220m leg, and the leg has been 420m since cycle 58, so the sign is now visible
      at 0.261 miles. Stale comment corrected in place; the behaviour change is filed, not made.

## Cycle 121 — Suggester (with market research, finally)

_Research done this pass, unlike cycles 102 and 116 where I recorded skipping it._

- [ ] **S141 — no in-page way to reduce motion.** _Proposed._ `prefers-reduced-motion` is honoured in four places;
      in-page controls: zero. A first-person driving scene is the canonical vestibular trigger, and a canvas removes
      the accessibility the browser would otherwise provide. Someone on a work laptop who gets motion sick has no
      lever short of leaving for the classic site. Machinery already exists — it is one boolean in `DriveScene`.
- **Research note:** the comparable-site material was mostly template listicles and stack recommendations
      (Next.js/Tailwind/Framer, all of which this project already uses) — no feature gap worth filing from those.
      The one genuinely transferable finding was the canvas-accessibility and motion-sickness angle.

## Cycle 124

- [x] **S140 — RETIRED, not built.** Measured: the `1/4 MILE` ladder would apply for **17.7m of a 420m approach**
      (4.2%), which is **0.44–0.71 seconds** at driving speed. Adding a mid-approach unit switch to relabel that is
      not worth the branch. The genuine defect behind S140 — a comment asserting a 220m leg when the leg is 420m —
      was fixed separately in `2faaece`. Recorded as retired so a later Suggester pass does not re-propose it.
