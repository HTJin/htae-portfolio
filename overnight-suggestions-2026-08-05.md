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
  - **Outcome:** **Shipped** in `86d0174`. Exit number moved to a plaque above the right corner, twin supports, a retroreflective face that flares as the headlights reach it, and a green taken from the route palette so it sits right at both dusk and midnight. Verified mid-approach at dusk and, with the brake held to freeze it, at night. The *mile markers* half was carved out as backlog item S9b — it needs new drawing in the canvas roadside pass.

- [ ] **S9 — Exit-sign realism pass (MUTCD-style shields, counting-down mile markers)** — Status: Done (mile markers split to S9b) — Cycle: 2
  - **Source:** site audit — signage is the metaphor's anchor but `ExitSign.jsx` was not yet read in this cycle, so this is proposed on the strength of the concept, not a code reading.
  - **Scope:** small-medium. Deferred to Backlog.
  - **Outcome:** **Shipped** in `86d0174`. Exit number moved to a plaque above the right corner, twin supports, a retroreflective face that flares as the headlights reach it, and a green taken from the route palette so it sits right at both dusk and midnight. Verified mid-approach at dusk and, with the brake held to freeze it, at night. The *mile markers* half was carved out as backlog item S9b — it needs new drawing in the canvas roadside pass.

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
  - **Outcome:** **Shipped** in `94eea90`, and it earned its keep twice over. The readout counts 2016 -> 2025 across school and the nine roles, ticking over *between* exits (2021 and 2022 pass while crossing the sabbatical), then reads `NOW` for the side builds, the toolbox and the destination — which have no dates, so they never get a fabricated one. Verifying it also **uncovered a live data bug**: `new Date('YYYY-MM-DD').getFullYear()` reads UTC midnight in local time, so the StarPlus UI/UX role (`2024-01-01`, labelled "Jan 2024 - Oct 2024") was reporting **2023**. Fixed.

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
  - **Outcome:** **Investigated, closed clean — the classic site is not affected.** `FormattedDate.jsx` already builds its formatter with `timeZone: 'UTC'`, which is exactly the right defence, and writes its `dateTime` attribute from `toISOString()`. Proven by running that exact config in Node against all ten content dates in a timezone behind UTC: it renders *Jan 2024* correctly while `getFullYear()` in the same process returns 2023. All eight date call sites in `src/` were classified individually. `route.js` was the only affected one and was fixed in cycle 3. No change needed.

- [ ] **S16 — `/drive` ships two canonical tags, the first pointing at the homepage** — Status: **Needs human** — Cycle: 4
  - **Source:** site audit — measured straight out of the served HTML while looking at what crawlers see.
  - **Suggestion:** add matching `key` props so `next/head` deduplicates and the page-level tag wins. Exact patch is written out in the **Needs human** section of `overnight-tasks-2026-08-05.md`.
  - **Why / expected impact:** a crawler taking the first canonical is told `/drive` duplicates the homepage, which drops drive mode out of the index; a social scraper taking the first `og:title` previews a shared drive link as the homepage, defeating the `?exit=` deep links. `og:url` and `og:title` duplicate the same way.
  - **Scope:** tiny — three lines in `_app.jsx` and three in `drive.jsx` — but `_app.jsx` is outside this run's write scope, so it is parked rather than edited.
  - **Outcome:** *(awaiting a human; the loop deliberately did not half-fix it from `drive.jsx` alone, which would have looked fixed and changed nothing)*

- [ ] **S17 — Structured data for `/drive`** — Status: Proposed — Cycle: 4
  - **Source:** site audit — `_app.jsx:16-48` emits a WebSite / Person / ProfilePage graph all anchored to the site root, so `/drive` inherits markup describing the homepage.
  - **Suggestion:** a route-specific `WebPage`, or an `ItemList` of the exits, so drive mode stands on its own in search.
  - **Scope:** small. **Blocked behind S16** — adding page-level head content while two canonicals disagree just adds noise.
  - **Outcome:** *(proposed)*

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
  - **Why / expected impact:** compounds with S16 — drive mode is both unlisted *and* disowned by its own canonical, so fixing either alone will not surface it in search.
  - **Scope:** one `<url>` block in `public/sitemap.xml`, which is outside this run's write scope (it covers `public/images/` only). Exact patch is in the **Needs human** section of `overnight-tasks-2026-08-05.md`.
  - **Outcome:** *(awaiting a human)*

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
  - **Outcome:** *(awaiting a human)*

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
  - **Source:** direct owner feedback: *"you've put unnecessary opposing traffic in a portfolio site that should represent me."*
  - **Outcome:** **Removed** in `d76e0bd`, along with the `reducedMotion` prop that existed only to suppress it. Recorded as standing law in the Guardrails block; S13b (haze) closed as unwanted for the same reason. **Do not re-propose invented traffic, weather or other road "life".**

- [ ] **S28 - The car drives in a lane, not down the centre line** - Status: Done - Cycle: 13
  - **Source:** direct owner feedback, twice: *"i dislike how the car starts in the middle of the road"* and *"you also make me steer right back into the middle of the road instead of the middle of the lane of traffic im supposed to be in."*
  - **Why / expected impact:** the camera sat at lateral 0, which is the centre line, and `sim.x` decays to 0 - so the game actively steered you back onto the centre line whenever you let go.
  - **Outcome:** **Shipped** in `d76e0bd`. `cameraX(sim) = LANE_OFFSET + sim.x`, `LANE_OFFSET = 2.7` (midpoint of the right-hand lane); `sim.x` is now drift within the lane. Steering clamp tightened to keep the car between the centre line and the edge line. Verified: the centre line now runs down the left of the view.

- [ ] **S29 - The destination did not read as an arrival** - Status: Done - Cycle: 14
  - **Source:** re-reading the owner's priority (b), *"the destination-arrival panel needs work"*, and noticing that the **destination stop itself** had never been examined - only the arrival panel in general (cycle 1).
  - **Why / expected impact:** it is the conversion moment. All four actions rendered identically, so the email and "back to the classic site" were visually indistinguishable; the eye had nothing to land on after twenty-one exits.
  - **Outcome:** **Shipped** in `b6f444f`. Email primary, classic-site link demoted to quiet text, and a trip summary above them whose every figure is derived from the content (rendered 2016 / 9 / 8 / 2.7, matching 9 roles, 8 builds, education 2016, 21 stops x 220m). Owner's prose untouched; EXIT 11 confirmed unchanged.

- [ ] **S30 - `world.project()` was dead code with false documentation** - Status: Done - Cycle: 15
  - **Source:** a Suggester pass aimed at duplication rather than features, prompted by the owner's steer against unnecessary additions.
  - **Why / expected impact:** the module claimed `project()` kept the canvas and DOM overlays in agreement, but nothing called it and three sites duplicated the maths. This branch had already been bitten twice by the same shape - the dash height written twice (71px overlap) and the camera lateral written four times (the centre-line complaint).
  - **Outcome:** **Shipped** in `e23a9db`. `ExitSign` and `RoadCanvas.place` now call `project()`; `buildPoints` stays inlined on purpose (131 iterations/frame into pre-allocated objects) with a comment explaining the trade, so the remaining duplication is deliberate. Proven pixel-identical by a stash/rebuild A/B: **0 of 1,992,704 pixels differ**.

- [ ] **S31 - Resuming made the route map contradict itself** - Status: Done - Cycle: 16
  - **Source:** a Suggester pass aimed at the *seams between* features built separately in this run - resume (cycle 8) and the route map's "driven" markers.
  - **Why / expected impact:** measured, not guessed - seeded progress at EXIT 13, took the offered resume, opened the map: **2 of 21** rows read "driven". The app told the same visitor, one click apart, that they had reached exit 13 and that they had never driven exits 01-12.
  - **Outcome:** **Shipped** in `f0b7c6c`. `markVisitedThrough()` restores the history behind a resumed exit, justified by an observed property of `progress.js` (writes happen only on arrival, and only forwards). Called from `resumeDrive` **only** - a `?exit=` deep link proves a click, not a drive. Verified on a production build, all three cases: resume → 14 of 21 driven (`MILE 0`..`EXIT 13`); deep link → `MILE 0` + `EXIT 13` only; fresh visit → `MILE 0` only.

- [ ] **S32 - Canvas repaints every frame while parked** - Status: Backlog (recorded, deliberately not built) - Cycle: 16
  - **Source:** reading `RoadCanvas.draw()` after the cycle-13 traffic removal made it a pure function of `travel`, `x` and the camera.
  - **Why / expected impact:** parked at a stop, every animation frame redraws a provably identical image - continuous CPU and battery burn on a page someone may leave open while reading.
  - **Outcome:** **Backlog S16a.** Not built, on purpose: the win (frames skipped) cannot be measured here - rAF is suspended in a backgrounded tab, and the only way to force a repaint is a resize, which must bypass any dirty-check because setting `canvas.width` clears the backing store. Shipping an unmeasurable optimisation into a hot path is guardrail 9's failure mode. Pick it up when a foregrounded window is available, so the check and its evidence land together.

- [ ] **S33 - Every exit had the same tab title, and the route announcer repeated it** - Status: Done - Cycle: 17
  - **Source:** a Suggester pass that left the canvas alone and asked what the page says through the channels that are *not* the canvas - the tab, the history entry, and what a screen reader hears.
  - **Why / expected impact:** measured - the URL changed from `?exit=13` to `?exit=14` while `document.title` stayed `"Hyun-Tae Jin | Drive mode"`. Twenty-one destinations, one bookmark name. And Next's route announcer (`aria-live="assertive"`) reads that title on every shallow URL change, so a screen-reader user was interrupted twenty times with the identical sentence and never told the exit.
  - **Outcome:** **Shipped** in `aafb4d9`. A per-stop `next/head` title in `DriveScene`; the SSR `<title>` in `drive.jsx` untouched and confirmed by `curl`. Verified distinct across EXIT 14 / MILE 0 / EXIT 20. A first attempt read `"MILE 0 · Hyun-Tae Jin | Hyun-Tae Jin"` - stop 0's title *is* the name - caught in verification and fixed.

- [ ] **S34 - The arrival panel's `aria-live` could never fire** - Status: Done - Cycle: 17
  - **Source:** the same pass, checking whether the accessibility attributes on the page do what they claim.
  - **Why / expected impact:** measured - the live node was a *different node* before and after an exit change, and between exits there was no polite region on the page at all. `StopCard` is keyed by stop inside `AnimatePresence`, so it is destroyed and rebuilt on arrival; a live region created together with its content is the documented unreliable case. The attribute read as an accessibility feature while announcing nothing.
  - **Outcome:** **Shipped** in `aafb4d9`. A permanently mounted `role="status"` region in `DriveScene`; the dead attribute removed with a comment naming its replacement. Verified by DOM node identity across three arrivals while the text changed, exactly one region, and MILE 0 announcing *"At the start line"* rather than an arrival.

- [ ] **S35 - The cockpit and the windshield disagreed about where the driver sits** - Status: Done - Cycle: 18
  - **Source:** a Suggester pass that went back to the owner's stated priority (a), *"the car interior dash needs work ... think of what a car should look like from driving perspective"*, and checked the rendered cockpit against the geometry the road is drawn with.
  - **Why / expected impact:** measured both halves. A Node probe of `world.js` shows the road's vanishing point converges exactly on the screen centre (960.00 of 960), so the driver's eyeline is the middle of the viewport. The browser shows the steering wheel centred at 615 (32.0%) while the mirror and pillars are symmetric about 960 - the wheel was 345px, 18% of the viewport, left of the driver's own eye. Worse, the comment in `world.js` justifying that framing asserted the vanishing point falls left of centre, which the probe disproves.
  - **Outcome:** **Shipped** in `4d24fd9`. The desktop dash is a grid whose middle column is the steering column, so the wheel is centred by construction; a door card occupies what that leaves to the driver's left. The false comment now states what the numbers show; no maths changed. Verified at 1920x895: wheel centre 960, offset 0, no overlaps, no horizontal scroll. **Narrower widths are parked as Needs testing** - the window would not actually resize this session.

- [ ] **S36 - Verify the re-centred dash at widths the window would not give me** - Status: Done - Cycle: 19
  - **Source:** the Needs-testing item cycle 18 parked honestly rather than claiming coverage it did not have.
  - **Why / expected impact:** a layout change verified at one viewport is the exact shape of the cycle-12 bug, where a dash height written twice hid resume content on a landscape phone. `resize_window` reported success but `innerWidth` stayed 1920, so no narrow viewport had ever been rendered.
  - **Outcome:** **Verified, no defect found.** Loaded `/drive` in same-origin iframes of explicit size - proving first that the frame was genuinely its own viewport (`innerWidth` 1100 inside vs 1920 outside; `lg:hidden` block `none` at 1100 and `flex` at 390). At 1100x800: console on one row, zero overlaps, no overflow, wheel 153px short of the eyeline as designed below `xl`. At 390x844 and 844x390: the desktop grid computes `display: none`, so cycle 18 provably does not touch the phone cockpit; zero overlap, everything inside the viewport. Shipped one comment-only commit (`72ccf3f`) recording the measured arithmetic behind the `xl` threshold.

- [ ] **S37 - Clear the three items parked behind a foregrounded browser window** - Status: Done - Cycle: 20
  - **Source:** the Awaiting-scenario entry, re-checked at the top of the cycle as the controller requires. Its condition had arrived: `document.hidden` false, `hasFocus()` true, rAF running, `.focus()` sticking.
  - **Why / expected impact:** three claims about the drive had been asserted but never observed - the frame budget (since cycle 3), focus return on closing the route map (since cycle 10), and whether the engine audio makes any sound at all (since cycle 9). Unverified claims are exactly what this run treats as defects.
  - **Outcome:** **All three verified, zero code changes.** Frame rate: driving 29.9/30.0/29.9 fps against a parked 21.8/17.1/21.8 and a 28 fps empty-loop baseline - the ceiling is the environment, not the code. Focus: trigger -> dialog panel -> Escape -> back on the trigger, observed. Audio: with a *real* click (the eleven-cycle blocker was that a scripted click grants no user activation) the context runs, master gain reaches 0.09, and the oscillators climb 43.83 -> 65.37 -> 71.56 Hz with the revs, the square exactly an octave above, the filter opening 692 -> 1284 Hz, tyre noise 0 -> 0.033 with speed; toggling off returns master gain to 0.

- [ ] **S16a - The road repainted every frame while parked** - Status: Done - Cycle: 21 (found cycle 16)
  - **Source:** reading `RoadCanvas.draw()` after the cycle-13 traffic removal made it a pure function of position and camera.
  - **Why / expected impact:** parked at a stop the canvas was repainted on every animation frame to produce a provably identical image - measured at **130 full repaints in 130 frames over 5s**, into a 3840x1790 backing store. That is continuous CPU and battery on a page someone leaves open while reading an exit.
  - **Outcome:** **Shipped** in `574ff15`, five cycles after it was found. It was deliberately *not* built in cycle 16 because the win could not be measured in a backgrounded tab, and guardrail 9 forbids unmeasurable optimisations in a paint loop; cycle 20 removed that blocker. Parked repaints went **130/130 frames -> 0/140**, driving is unchanged at 136 paints/132 frames, a resize still repaints exactly once, steering while parked still repaints and then settles to zero, and a captured frame differs by **0 of 4,096,000 pixels**. The design detail that mattered: an equality check would have skipped nothing, because the parked steering drift decays asymptotically and never repeats a value.

- [ ] **S38 - Every screenshot was announced, not just the visible one** - Status: Done - Cycle: 22
  - **Source:** a Suggester pass aimed back at the owner's priority (c), the project screenshots, unexamined since cycle 1.
  - **Why / expected impact:** measured at EXIT 13 - the captures are stacked and cross-faded with `opacity`, which does not remove an element from the accessibility tree, so all four carried live alt text. A screen-reader user met "screenshot 1 of 4" through "4 of 4" for a single visible picture.
  - **Outcome:** **Shipped** in `2f62f6d`. Inactive frames are `aria-hidden`. Verified that exactly one image is exposed *and that it is the one at opacity 1* - a count alone would not have proved the right one - and that it still holds after the carousel advanced.

- [ ] **S39 - The carousel dots were 6x6px targets** - Status: Done - Cycle: 22
  - **Source:** the same pass, measuring the controls rather than reading them.
  - **Why / expected impact:** each inactive dot's hit box was 6x6 CSS px (20x6 active) against the WCAG 2.5.8 minimum of 24x24, in a carousel that sits inside the arrival panel on a phone.
  - **Outcome:** **Shipped** in `2f62f6d`. Each dot is a 24x24 box with the same pill centred inside; targets verified at 24x24 with 0px neighbour overlap and pill sizes unchanged. Worth knowing: the plan's own guardrail said the visible dots must not move, and building it showed that to be impossible - 6px dots 6px apart put centres 12px apart, failing both the target rule and its spacing exception. The guardrail was amended with that reasoning rather than quietly ignored, and only the spacing between dots grew.

- [ ] **S40 - The destination's call to action was sliced in half on a phone** - Status: Done - Cycle: 23
  - **Source:** a Suggester pass aimed at the owner's priority (b) on a phone. Guardrail 4 has asked for a 390x844 check of the arrival panel since cycle 1, and the *destination stop* had never been opened there.
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
  - **Why / expected impact:** at 844x390 the box is 20px tall against 54px of content, and `.screen` is `overflow: visible` - so it painted *outside its box over the control row* rather than clipping. The `EXIT 06 . Co.Lab` line and the progress bar were both squashed to **height 0**: the readout that tells you which exit you are at had been squeezed out of existence while the bar still drew over the buttons.
  - **Outcome:** **Shipped** in `e9cfe30`. The dash's 190px budget was measured (74 cluster / 20 terminal / 62 controls against a 156 budget, needing 190) and rebalanced on short viewports only: a 44px gauge, tighter gaps and padding, shorter pedals, and the shell-prompt row stood down. Overflow 36 -> 0, exit line 0 -> 17px, bar 0 -> 6px, budget 52/68/48, smallest control still 25px - and portrait and desktop measured byte-identical, so the height breakpoint does not leak upward. Nothing was deleted: gutting the gauge would have made the numbers clean at the cost of the owner's priority (a).

- [ ] **S44 - The ignition splash pushed the way out off the screen for returning visitors** - Status: Done - Cycle: 26
  - **Source:** a Suggester pass on the ignition splash - the first screen every visitor sees, and the one screen never opened at phone size, even though the arrival panel and cockpit had been checked there in cycles 12, 23 and 25.
  - **Why / expected impact:** measured with saved progress present, which adds the `Resume` and `Forget my progress` controls: 844x390 overflowed by 2px each side, 667x375 by 9px, and 568x320 by **74px** with the "back to the classic site" link entirely below the viewport and the heading cut off the top. That link is the *only* way out of drive mode while the splash is up - it sits over the scene's own exit link - and the page cannot scroll, so there was no recovery. With storage clear it fits, which is why no earlier check caught it.
  - **Outcome:** **Shipped** in `d2d0484`. The splash is now scrollable, with the centring moved from `justify-center` to an inner `m-auto` wrapper - a centred flex child that overflows cannot be scrolled back to, so without that change the heading would have been unreachable rather than merely clipped - plus it tightens below 430px of height. Verified with progress seeded every time: 844x390 and 667x375 now fit outright (394 -> 300px), 568x320 is fully reachable, portrait control positions identical to before, desktop centred exactly where it was.

- [ ] **S45 - The route map opened at MILE 0 instead of where you are** - Status: Done - Cycle: 27
  - **Source:** a Suggester pass on the route map - the drive's primary navigation, built in cycle 10 and focus-verified in cycle 20, but never measured at phone size. Its *layout* turned out to be sound; its opening behaviour was not.
  - **Why / expected impact:** measured, `scrollTop` on open was 0 at every viewport while the highlighted current row sat below the fold - 803px down at 844x390 (where only 3 of 21 rows are visible), 357px at 390x844, 791px at 1440x900. The map highlights the current exit, which is its own statement that "where you are" is the useful thing, and then opened somewhere else.
  - **Outcome:** **Shipped** in `89803a6`. The list now opens centred on the current exit, instantly and without touching focus, by setting the scroller's own `scrollTop` rather than using `scrollIntoView`. Verified across seven exit/viewport combinations, with MILE 0 still opening at the top and the last exit clamping rather than overscrolling; the cycle-10/20 focus trap, Escape and focus-restore were re-measured rather than assumed. A first attempt used `offsetTop` and was 111px out - the scroll container is not positioned, so a row's `offsetParent` is the dialog backdrop - which the verification caught by two checks disagreeing with each other.

- [ ] **S46 - All 21 exits swept for the first time** - Status: Done (no defect found) - Cycle: 28
  - **Source:** the realisation that across 27 cycles only about seven stops had ever been opened individually.
  - **Why / expected impact:** the content layer had never been checked end to end - a broken screenshot, a missing link or a console error on an unvisited exit would simply not have been noticed.
  - **Outcome:** **Clean.** Every stop renders its card, counters run 1/21 to 21/21, all 28 screenshots across the 8 project stops load with none broken, links appear where the content has them, the arrival announcer names the right exit every time, and there were zero console errors or warnings for the whole route.

- [ ] **S47 - The stops with the most to say got the least room** - Status: Done - Cycle: 28
  - **Source:** the same sweep, comparing panel widths across stop types.
  - **Why / expected impact:** measured at 1440x900 - a stop with screenshots widened to 925px while a text-only stop stayed at 704px, so the sabbatical hid **40.9%** of its content, the toolbox 20.5% and the senior role 15.1%, with 736px of the band unused either side. The stop with pictures got the room and the stop with prose did not; on a laptop, two fifths of a role's detail sat below a fold.
  - **Outcome:** **Shipped** in `6dcdd2e`. Text-only stops (not the project stops, not the destination) now take the same width and flow in two balanced columns. Widening alone was measured and rejected because it would have pushed lines from ~100 to ~135 characters; the two-column version fixes the fold *and* brings the measure to ~63. Verified: two of the three now hide nothing, the sabbatical drops 40.9% -> 22.4%, no horizontal overflow, phones stay single-column, destination and project stops untouched. A first build regressed two stops (a `break-inside-avoid` that stopped the columns balancing) and the re-sweep caught it before commit.

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
  - **Outcome:** **Shipped** in `f6c267f`. The anchor is derived from the toolbox stop's own position, with a literal fallback if the content loses that stop and an ordering guard because `paletteAt` assumes ascending keyframes and would have failed silently. Verified: toolbox star/moon **0.850/0.888 -> 1.000/1.000** with the authored full-night horizon, a monotonic approach through EXIT 18, and the destination's first light unchanged at 0.6/0.7. No colour was retuned - only *when* full night happens.

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
  - **Why / expected impact:** measured at EXIT 13 - 25 of the 38 focusable elements live inside the `sr-only` itinerary, which is clipped to nothing but fully present in the tab order. Their layout boxes are real (up to 195x19.5) and clipped away, so the focus ring was painted on invisible content: for a sighted keyboard user, focus was *nowhere* for 25 presses before the first control they could see.
  - **Outcome:** **Shipped** in `de9a7da`. A skip link, first in the tab order and hidden until focused. Deliberately not `tabindex="-1"` on the itinerary links - that would have fixed the sighted keyboard user by robbing the screen-reader one, for whom that block is the resume. Verified with real key presses: Tab reveals the link at 171x22, Enter moves focus to the controls, the next Tab lands on a real button - **25 presses down to 1** - with all 25 itinerary links intact. Proving it required real keys: programmatic `.focus()` sets `activeElement` but never matches `:focus` while the document itself is unfocused, which made two earlier attempts report a failure that was not there.

- [ ] **S55 - Do the drive controls actually have a focus indicator?** - Status: Done (no defect) - Cycle: 34
  - **Source:** a question cycle 12 raised, correctly diagnosed as unanswerable at the time, and left open - programmatic focus never matches `:focus-visible`, so a computed `outline: none` proved nothing.
  - **Why / expected impact:** if any control had its outline stripped with no replacement, a keyboard user would be navigating blind. Cycle 33 established how to get genuine keyboard focus, which made the question answerable.
  - **Outcome:** **No defect.** Fourteen real Tab presses on a focused document: every one of the fourteen focused elements reports `outline: auto 1px` with `:focus-visible` true, and none has its outline suppressed.

- [ ] **S56 - Focus was invisible for 25 presses inside the hidden resume, and the standard fix cannot work there** - Status: Done - Cycle: 34
  - **Source:** the same fourteen-press recording - 13 of the 14 stops were off-screen, all itinerary links.
  - **Why / expected impact:** cycle 33's skip link rescues anyone who takes it, but a keyboard user who keeps tabbing still walked 25 stops with the focus ring painted on content clipped to nothing.
  - **Outcome:** **Shipped** in `ed61397`, and the interesting part is what was ruled out. The usual `focus:not-sr-only` reveal works on an element that is *itself* sr-only - which is why the skip link appears - but not on a descendant of an sr-only container. Tested rather than assumed: a focused link forced to `position: fixed; clip: auto` keeps a correct 85x38 box while `elementFromPoint` at its own centre returns the canvas. Unclipping the container would drop the whole resume over the scene, and re-hiding that block differently would restructure the only machine-readable copy of the resume on a hunch. So the fix reports *where focus is* from outside the clip: an aria-hidden chip naming the focused link, which tracks as focus moves and vanishes when focus leaves. Verified with real keys, including that it never appears for mouse users.

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
  - **Why / expected impact:** that entry explains a gap on a resume, so it is the one least worth cutting off, and on a 1440x800 laptop it hid **34.3%**. Measurement first established what was *not* available: the panel already fills its band exactly, and the band is pinned between the mirror (2px of clearance at 1440x800) and the dash, so there is no vertical slack to take without raiding the cockpit. What was available was width - the card capped at 928px at every size, leaving **992px of the band empty at 1920x900**, more than half.
  - **Outcome:** **Shipped** in `cb525ea`. Text-only stops now widen to 1216px with a third column at `2xl`. Both options were trialled first: widening alone to 1088px left 22px hidden and pushed the measure to ~76 characters, while 1216px with three columns hides nothing and *narrows* the measure to ~56 - better on both axes. Verified: EXIT 04 94 -> 0 hidden at 1920, project stops and the destination untouched, 1440 and both phone sizes identical to before, no horizontal overflow, and a three-bullet stop reading as three balanced columns. A comma-operator slip in the first build silently dropped the picture stops from 928 to 704px - the build and linter were both happy, and only measuring a project stop caught it.

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
  - **One thing you may want to change yourself:** the sentence quotes a bare URL mid-paragraph. It is now clickable, but if you would rather it read as *"featured on Colab's highlighted projects page"* with the link on those words instead, that is an edit to your own copy - which is yours to make, not mine.

*(Check the box once you've reviewed the outcome.)*
