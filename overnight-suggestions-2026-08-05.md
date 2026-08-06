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

- [ ] **S6 — Time-of-day lighting that advances along the route** — Status: Proposed — Cycle: 1
  - **Source:** site audit — the scene is permanently night (`RoadCanvas.jsx:17-27` fixed colour table, `Sky.jsx` stars).
  - **Suggestion:** interpolate sky/tarmac/lamp colours from dawn at MILE 0 to night at the destination, so the drive visibly passes time as it passes years.
  - **Why / expected impact:** makes the route feel like a journey rather than a loop of the same frame.
  - **Scope:** medium-large; touches the canvas colour tables. Deferred to Backlog.
  - **Outcome:** *(deferred)*

- [ ] **S7 — Mobile driving ergonomics pass** — Status: Proposed — Cycle: 1
  - **Source:** site audit — pedals are 62-72px buttons pinned to the right of the dash grid (`Dashboard.jsx:404-423`); untested at 390px where the dash also has to hold the trip computer and three console buttons.
  - **Suggestion:** a thumb-reachable control layout at small widths.
  - **Why / expected impact:** drive mode is unusable on a phone if the controls don't fall under a thumb.
  - **Scope:** medium. Deferred until task 4 settles the dash layout.
  - **Outcome:** *(deferred)*

- [ ] **S8 — Persist route progress to `localStorage`** — Status: Proposed — Cycle: 1
  - **Source:** market research — long interactive narratives normally let you resume; here every visit restarts at MILE 0 (`useDrive.js` initialises fresh).
  - **Suggestion:** remember the furthest exit reached and offer "resume from EXIT n" on the ignition screen, with a reset.
  - **Scope:** small-medium. Deferred to Backlog.
  - **Outcome:** *(deferred)*

- [ ] **S9 — Exit-sign realism pass (MUTCD-style shields, counting-down mile markers)** — Status: Proposed — Cycle: 1
  - **Source:** site audit — signage is the metaphor's anchor but `ExitSign.jsx` was not yet read in this cycle, so this is proposed on the strength of the concept, not a code reading.
  - **Scope:** small-medium. Deferred to Backlog.
  - **Outcome:** *(deferred)*

- [ ] **S10 — Deep-link a specific exit (`/drive?exit=11`)** — Status: Proposed — Cycle: 1
  - **Source:** market research — shareable deep links are table stakes for portfolio set-pieces; drive mode currently has one URL for 21 stops.
  - **Why / expected impact:** lets the owner link a recruiter straight to a relevant role or build.
  - **Scope:** small-medium; router wiring in `src/pages/drive.jsx`. Deferred to Backlog.
  - **Outcome:** *(deferred)*

*(Check the box once you've reviewed the outcome.)*
