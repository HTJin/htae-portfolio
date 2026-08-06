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

- [ ] **S5 — Ambient drive audio (engine note, turn-signal tick), muted by default** — Status: Proposed — Cycle: 1
  - **Source:** market research — driving/scroll-story portfolios commonly pair motion with a subtle audio layer; absent here entirely.
  - **Suggestion:** a muted-by-default speaker toggle on the dash, with a synthesized engine note tied to `sim.rpm`.
  - **Why / expected impact:** large presence gain for a small surface; must stay opt-in so it never autoplays.
  - **Scope:** medium; Web Audio only, no new deps. Deferred to Backlog this cycle.
  - **Outcome:** *(deferred)*

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

- [ ] **S8 — Persist route progress to `localStorage`** — Status: Proposed — Cycle: 1
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

- [ ] **S11 — Give each leg its own roadside character** — Status: Built (pixels Needs testing) — Cycle: 3
  - **Source:** site audit after the daylight work — the route has five named legs but `RoadCanvas.drawRoadside` paints identical lamps and delineators for all 21 stops, so position on the route is invisible from the roadside.
  - **Suggestion:** vary the furniture per leg — denser lighting through the city legs, a guardrail on the scenic overlook, sparse open road elsewhere.
  - **Why / expected impact:** makes where-you-are legible at a glance and stops the middle of the drive feeling repetitive.
  - **Scope:** medium; canvas only, subject to the per-frame allocation guardrail.
  - **Outcome:** **Built** in `c209b57`. The scenic overlook gets a guardrail and a thinned lamp line; the sabbatical thins further. Style is resolved once at module load and keyed off each object's own world position, so nothing changes character as you approach it. Mapping proven by SSR probe across all 21 stops; build and lint clean. **The pixels are not yet verified** — Chrome cannot currently reach the dev server — so the visual pass sits in Needs testing.

- [ ] **S12 — Odometer that reads in years, not just miles** — Status: Done — Cycle: 3
  - **Source:** site audit — the trip computer counts miles, but the route is chronological and education/experience stops already carry dates.
  - **Suggestion:** show the year you are driving through beside the odometer.
  - **Why / expected impact:** ties the metaphor to the résumé far more directly than distance; a recruiter reads "2019" faster than "1.4 MI". Needs a date added to project stops in `route.js`, which currently have none.
  - **Scope:** small-medium.
  - **Outcome:** **Shipped** in `94eea90`, and it earned its keep twice over. The readout counts 2016 -> 2025 across school and the nine roles, ticking over *between* exits (2021 and 2022 pass while crossing the sabbatical), then reads `NOW` for the side builds, the toolbox and the destination — which have no dates, so they never get a fabricated one. Verifying it also **uncovered a live data bug**: `new Date('YYYY-MM-DD').getFullYear()` reads UTC midnight in local time, so the StarPlus UI/UX role (`2024-01-01`, labelled "Jan 2024 - Oct 2024") was reporting **2023**. Fixed.

- [ ] **S13 — Weather and traffic that belong to the light** — Status: Proposed — Cycle: 2
  - **Source:** site audit after the daylight work — the road is completely empty; nothing else is ever on it.
  - **Suggestion:** a thin drifting haze layer and occasional oncoming headlights on the far carriageway, tinted by the current palette.
  - **Why / expected impact:** makes the road feel inhabited rather than a treadmill, and sells the dusk-to-night transition further.
  - **Scope:** medium; canvas only, must not allocate per frame.
  - **Outcome:** *(proposed)*

- [ ] **S9b — Mile markers counting down between exits** — Status: Proposed — Cycle: 2
  - **Source:** carved out of S9 when the sign itself shipped; the markers need new drawing in the canvas roadside pass rather than DOM work.
  - **Scope:** small-medium.
  - **Outcome:** *(proposed)*

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

*(Check the box once you've reviewed the outcome.)*
