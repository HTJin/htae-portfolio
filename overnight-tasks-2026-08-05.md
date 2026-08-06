# Overnight session — tasks (overnight-tasks-2026-08-05.md)

> **For the executing agent:** You're picking this up fresh. This document is your entire brief. Read it top to bottom, follow the operating rules, work the tasks in order, log to `overnight-log-2026-08-05.md`, journal to `overnight-journal-2026-08-05.md`, and rewrite `overnight-report-2026-08-05.md` at the end of every cycle. This run **loops** Suggester -> Planner -> Critic -> Builder -> Reviewer autonomously and endlessly until the user stops it. If something is ambiguous, make the most reasonable documented assumption and keep moving — do **not** stop and wait for a human.

**Date:** 2026-08-05
**Goal of the night (one line):** Make `/drive` feel like sitting in a real car built by a software engineer — a believable driver's-POV cockpit, an arrival panel worth reading, and project screenshots that display in full and cycle themselves.
**Phase:** Planner
**Cycle:** 5

## Project orientation (so a fresh agent can start cold)

- **Stack:** Next.js 13 (pages router), React 18, Tailwind CSS, framer-motion, CSS modules. JS (not TS) — `jsconfig.json`, `@/` -> `src/`.
- **Install:** `npm install`
- **Run:** `npm run dev` — NOTE: port 3000 is already occupied on this machine, Next falls back to **http://localhost:3001**. Always confirm the port from the dev-server log before browsing.
- **Test:** no test suite in `package.json` (scripts are dev / dev:fresh / build / start / lint / prettier). Verification is therefore **`npm run build` + real browser exercise via the Claude Chrome extension**.
- **Build / lint:** `npm run build`, `npm run lint`
- **Where the relevant code lives:**
  - `src/pages/drive.jsx` — the drive-mode page
  - `src/components/drive/DriveScene.jsx` — composition root (Sky, RoadCanvas, ExitSign, CarInterior, StopCard, Dashboard, RouteMap, Ignition)
  - `src/components/drive/CarInterior.jsx` — glass, pillars, headliner, mirror, wipers
  - `src/components/drive/Dashboard.jsx` — gauges, steering wheel, trip computer, console buttons, pedals
  - `src/components/drive/StopCard.jsx` — the panel that opens on arrival at a stop
  - `src/components/drive/route.js` — builds the itinerary from `src/content/*`
  - `src/components/drive/RoadCanvas.jsx` / `world.js` / `useDrive.js` — the driving sim
  - `src/styles/drive.module.css` — `.hud`, `.dash`, `.glass`, `.pillarLeft/Right`, `.star`, `.ignition`, `.blink`
  - `src/lib/projects.js` — project data incl. `screenshots: ['/1.png', ...]`; files live at `public/images/projects/<name>/<n>.png`
- **Glossary:** *stop* = one exit on the route (a job, a project, education, the toolbox, the destination). *parked* = the car is stationary at a stop, which is when `StopCard` shows. *leg* = a named group of stops (Career highway, Scenic overlook, Pit stop…).

## Operating rules (how to run this list)

- **Never block.** Unclear → assume, log the assumption, continue. There is no human.
- **Check before building.** Search the code first; finish half-built things rather than forking a second version.
- **Verify it actually works.** `npm run build` must pass AND the change must be seen working in the real browser at `/drive`.
- **Commit per task**, locally, with a clear message.
- **Resolve every task — never leave it `[ ]`.** `[x]` = built & self-verified, *pending the auto-Reviewer*; otherwise move it to **Needs testing / Awaiting scenario / Blocked / Needs human**. Only the Reviewer phase writes **Done**.

## Guardrails (THIS BLOCK IS THE LAW — permissive by default)

**Authorized actions:** commit locally to the current branch `feat/drive-mode`; create files under `src/` and the repo root for the overnight logs; run `npm run dev`, `npm run build`, `npm run lint`, `npm run prettier`; read/write any file under `src/`, `public/images/`, `src/styles/`; kill and restart the dev server; drive the local site in Chrome via the extension; add SVG/CSS assets authored in-repo.
**Prohibited actions:** do NOT push to any remote; do NOT merge to `main`; do NOT open/modify PRs; do NOT deploy (no Vercel/`vercel` CLI); do NOT install new npm dependencies (work with what is already in `package.json`); do NOT touch `.env.local`, `.git/config`, or anything under `.git/`; do NOT delete or overwrite the user's screenshot PNGs in `public/images/projects/`; do NOT modify `src/content/*.js` or `src/lib/projects.js` factual content (adding a *derived/optional* field is allowed, rewriting the user's copy is not); do NOT touch the Supabase MCP project.
**Hard floors (always on):** (1) never trigger an interactive permission/approval prompt — park such tasks as **Needs human**. (2) never take an irreversible/unrecoverable action unless explicitly authorized above.
**Scope — only touch:** `src/components/drive/**`, `src/styles/drive.module.css`, `src/pages/drive.jsx`, and (read-only) `src/lib/projects.js` / `src/content/**`. New drive-only components may be added under `src/components/drive/`.
**Do NOT touch:** the classic site sections (`src/components/sections/**`), `src/content/**` copy, `next.config.mjs`, `tailwind.config.js`, `package.json`. NOTE: the working tree already had uncommitted modifications to `src/components/sections/*` and `src/content/*` **before this run started** — leave them alone, and never `git add -A`; stage only the drive-mode files this run touches.

**Pre-mortem guardrails (prevent likely failure modes):**
1. *Failure: hydration mismatch.* The gauges already round coordinates to keep SSR and client byte-identical (`Dashboard.jsx:11-17`). Any new SVG geometry computed with `Math.*` must be rounded the same way, and nothing may branch on `window`/`Date` during render. **Guardrail:** after every visual change, check the browser console for a hydration warning before calling the task built.
2. *Failure: the 60fps loop gets slower.* The sim pushes state via `drive.subscribe(...)` and writes to refs, deliberately bypassing React re-renders. **Guardrail:** never add per-frame React state to the drive loop; new live readouts must use the `subscribe` + `ref.textContent`/`style.transform` pattern already in `Dashboard.jsx:32-45`.
3. *Failure: the cockpit eats the road.* Making the dash taller/denser can crowd the windshield until there is nothing to look at. **Guardrail:** the drivable glass area must stay >= ~50% of viewport height at 900px tall, and the dash must not exceed ~38% height; verify visually at 1440x900 AND 390x844.
4. *Failure: a redesigned StopCard becomes unreadable or unscrollable on mobile.* **Guardrail:** verify the panel at 390x844 — content must scroll, no horizontal overflow, and the close/next affordances must stay reachable.
5. *Failure: the screenshot carousel autoplays over reduced-motion users, or leaks timers between stops.* **Guardrail:** honor `useReducedMotion()` (show a static first frame + manual dots), and clear the interval on unmount/stop-change; verify by switching stops repeatedly and watching for stacked timers.
6. *Failure: running `npm run build` while `npm run dev` is live, or trusting a poisoned `.next` cache.* They share `.next`; the build clobbers the dev server's route manifest (`/drive` starts 404ing for new requests while the open tab keeps working off HMR). Worse, the webpack cache can go stale and **silently serve CSS that is missing newly-added Tailwind classes** — observed in cycle 2, where `line-clamp-2` and `lg:truncate` produced zero CSS rules until a clean restart. **Guardrail:** after any `npm run build`, restart the dev server; and if a class looks inert, run `npm run dev:fresh` (wipes `.next`) and re-check *before* concluding the class or the config is at fault.
7. *Failure: mistaking a hidden Chrome window for a broken page.* A backgrounded tab reports `document.visibilityState === 'hidden'`; Chrome then unrenders it, so screenshots come back solid black and every `getBoundingClientRect()` returns 0. **Guardrail:** before reporting any visual defect, check `document.hidden` first — if true, the finding is worthless, and verification must fall back to build/lint until a person foregrounds Chrome.
8. *Failure: `object-contain` fixes cropping but leaves ugly letterbox bars.* **Guardrail:** the frame must have an intentional backing (browser-chrome mock) so unused space reads as design, not as a bug.
9. *Failure (cycle 2): the time-of-day palette allocates per frame and drags the 60fps loop down.* `paletteAt()` would run inside the canvas paint, building fresh objects and gradient strings 60x a second. **Guardrail:** mutate one module-level palette object in place, quantise progress before rebuilding any gradient string, and re-check that driving still feels smooth afterwards.
10. *Failure (cycle 2): `Sky` starts re-rendering React per frame.* It is currently pure static markup. **Guardrail:** it must stay a `drive.subscribe` + refs component exactly like `Dashboard`; no `useState` may be driven by the sim.
11. *Failure (cycle 2): hydration mismatch from a progress-dependent sky.* Server markup must match the client's first paint. **Guardrail:** the server renders the palette at progress = 0, with no `Math.random`/`Date` at render time; all motion happens in effects afterwards.
12. *Failure (cycle 2): a brighter dusk sky washes out the HUD or the exit signs.* **Guardrail:** check `StopCard` legibility and exit-sign contrast at the brightest point of the cycle (MILE 0), not only at night.
13. *Failure (cycle 3): the year readout invents career history.* Projects, the toolbox and the destination have **no** date in the content, so interpolating a year across them would put a fabricated date on the owner's résumé — the worst possible bug on this page. **Guardrail:** only stops with a real `date` in `src/content/**` may carry a year; past the last dated stop the readout says `NOW` and never a number. Verify by checking the readout at a project stop specifically.
14. *Failure (cycle 3): the roadside leg lookup allocates per frame.* `drawRoadside` runs inside the 60fps paint and iterates every lamp and post. **Guardrail:** precompute the leg/style table once at module load; the paint loop may only index into it — no `.map`/`.filter`/object literals per lamp.
15. *Failure (cycle 3): new roadside ribbons reintroduce anti-aliasing seams.* `stripes()` exists precisely because filling each segment separately leaves visible seams (`RoadCanvas.jsx` comment on the stripes helper). **Guardrail:** any new continuous roadside element (guardrail rail, kerb) must be painted with the same run-length approach, never per-segment fills.
16. *Failure (cycle 3): the year readout re-renders React 60 times a second.* **Guardrail:** it must follow the existing `drive.subscribe` + `ref.textContent` pattern used by every other live readout in `TripComputer`.
18. *Failure (cycle 4): "fixing" the canonical tag by editing a file outside the write scope.* The real fix is in `_app.jsx`, which this run may not touch. **Guardrail:** measure it, write the exact patch out, park it as **Needs human** — do not edit `_app.jsx`, and do not bodge a half-fix into `drive.jsx` that only appears to work.
19. *Failure (cycle 4): the enriched itinerary changes what the page claims.* The `sr-only` block is the crawlable résumé; adding years there repeats the guardrail-13 risk. **Guardrail:** render `stop.year` only where it exists, never a fallback, and diff the rendered text against the previous output rather than eyeballing it.
20. *Failure (cycle 4): calling the timezone sweep "clean" without reading each site.* **Guardrail:** enumerate every date-formatting call in the repo and record a verdict per call site with the line reference, rather than concluding from one file.
17. *Failure (cycle 3): per-leg furniture pops as you drive.* If the leg is derived from the **camera** position rather than each object's own world position, furniture will change appearance as you approach it. **Guardrail:** the leg must be a function of the object's `s`, not of `sim.travel`.

## Decisions & assumptions locked in

- **The three user-stated priorities come first, in this order:** (1) car interior dashboard should look like a real car from the driver's POV; (2) the arrival panel (`StopCard`) needs work; (3) project photos are cut off and should auto-cycle with a smooth fade. Creative identity work is welcome but must not displace these.
- **Creative direction (chosen this run, documented so later cycles stay coherent):** *"the engineer's cockpit."* The owner is a Senior MES DevOps Engineer — hands-on with data, servers, and factory-floor hardware. The car is therefore an **instrument-dense telemetry machine**, not a luxury sedan: a hooded binnacle, real warning-light row, a centre screen that reads like a terminal, amber + terminal-green accents alongside the existing sky-blue. Restraint over gimmicks — every added element should either read as a real car part or as a developer's signature, not both at once.
- **Driver geometry assumption:** the camera is the driver's eyes in a left-hand-drive car. Therefore the steering wheel belongs on the driver's axis (slightly left of viewport centre, ~44-47%), the instrument binnacle sits *behind and above* the wheel so it reads through the wheel's upper aperture, and the centre stack sits to the **right** of the wheel. Observed defect: the wheel currently sits at ~33% of viewport width while the road's vanishing point is at 50%, and the cluster floats to the wheel's right at dash level rather than in a binnacle — which is why it does not read as a car.
- **Evidence for "photos get cut off":** `src/components/drive/StopCard.jsx:52-57` renders `<img className="mt-3 h-28 w-full ... object-cover object-top sm:h-36">` — a fixed ~7rem/9rem strip with `object-cover`, so a full-page screenshot is hard-cropped to its top band. Verified in the browser at EXIT 11 (Solar Power Indy): only the top ~25% of the screenshot is visible.
- **Evidence for "no cycling":** `src/components/drive/route.js:81-83` maps only `project.screenshots[0]` into `stop.image`. `src/lib/projects.js` has 2-5 screenshots per project (e.g. `solar-indy` has 4) and the files exist on disk under `public/images/projects/<name>/`. So the other screenshots are never reachable in drive mode.
- **Evidence for the panel/mirror collision:** at 1440x900 the `StopCard` (top-[13%]) renders over the rear-view mirror (top-[6.5%], `CarInterior.jsx:26-36`) — verified in the browser, the mirror's "BEHIND YOU" text sits partly behind the panel's top edge.
- **No test suite exists**, so "verified" means `npm run build` passes *and* the behaviour was observed in Chrome. Do not fabricate a test run.
- **Do not add npm dependencies.** framer-motion, clsx and Tailwind are already present and are sufficient.

## Carried forward (from prior runs)

- *(none — cycle 1 is the first)*

## Tonight's tasks (in order)

*(cycle 4's list is fully resolved — see Done / Needs human. The Planner fills this for cycle 5 from the Backlog.)*

<details>
<summary>Cycle 4's list (resolved — kept for context)</summary>

### CYCLE 4

Chrome still cannot reach the dev server (re-checked at the top of this cycle: `curl` returns the page,
the browser returns `chrome-error://chromewebdata/`). So cycle 4 deliberately picks work that is **fully verifiable
without pixels** — server-rendered output, which `curl` can prove — rather than shipping more canvas work blind.

- [ ] **1. Audit the rest of the site for the timezone year bug** (backlog S14)
  - **Why:** cycle 3 found that `new Date('YYYY-MM-DD').getFullYear()` reports the previous year for January 1st dates
    in any timezone behind UTC, which had put a role in the wrong year. The classic site renders the same content
    dates, so it may have the same fault — and that page matters more than the drive page.
  - **Files:** read-only sweep of `src/components/**`, `src/lib/**`, `src/pages/**`.
  - **Done when:** every date-formatting site in the codebase has been read and classified as affected or not, with the
    evidence recorded. If anything outside this run's write scope is affected it becomes **Needs human**, not an edit.
- [ ] **2. Investigate the duplicate canonical / Open Graph tags on `/drive`** *(new, found this cycle)*
  - **Why:** `/drive` currently ships **two** `<link rel="canonical">` tags — one pointing at the site root and one at
    `/drive` — plus two `og:url` and two `og:title`. Search engines take one canonical; if they take the first, `/drive`
    is declared a duplicate of the homepage and drops out of the index. Social scrapers take the first `og:title`, so
    sharing a drive-mode link would preview as the homepage.
  - **Evidence (measured this cycle):** `curl http://127.0.0.1:3007/drive` emits
    `<link rel="canonical" href="https://htae.dev"/>` **and** `<link rel="canonical" href="https://htae.dev/drive"/>`;
    likewise `og:url` = `https://htae.dev` and `https://htae.dev/drive`; `og:title` = "Hyun-Tae Jin | Senior MES DevOps
    Engineer" and "Hyun-Tae Jin | Drive mode". `<title>` is fine — Next dedupes that one.
  - **Cause:** `src/pages/_app.jsx:69,80,81` emit site-root `canonical` / `og:url` / `og:title` on **every** page, and
    `src/pages/drive.jsx:17-20` emits its own. `next/head` only dedupes tags that carry a matching `key` prop, and
    neither side sets one.
  - **Scope constraint:** the real fix belongs in `_app.jsx`, which is **outside this run's write scope**
    (scope is `src/components/drive/**`, `src/styles/drive.module.css`, `src/pages/drive.jsx`).
  - **Done when:** the defect is proven by measurement, an exact patch is written out for a human to apply, and the item
    is parked as **Needs human** rather than edited.
- [ ] **3. Put the years into the crawlable itinerary** *(new, follows from cycle 3)*
  - **Why:** the `sr-only` block in `DriveScene` is the version of this résumé that screen readers and crawlers
    actually consume — the rest of the page is a canvas and a cockpit. It lists every stop but omits the years, even
    though `route.js` now carries a real year for education and all nine roles. A crawler currently reads
    "Web Developer" with no date attached to it.
  - **Files:** `src/components/drive/DriveScene.jsx` (in scope).
  - **Done when:** the server-rendered itinerary carries the year for every dated stop and groups stops under their
    leg, proven by reading the HTML back with `curl`; and no year appears for a stop that has none (guardrail 13).

</details>

<details>
<summary>Cycle 3's list (resolved — kept for context)</summary>

### CYCLE 3

Cycle 2 made the drive pass *time*. Cycle 3 makes that time **readable** — putting the actual years of the career on
the instruments — and makes *where you are* on the route legible from the roadside instead of only from the signs.

- [ ] **1. The trip computer reads in years, not just miles** (backlog S12)
  - **Why:** the strongest thing about this page is that the road *is* the résumé, but the only quantity on the dash is
    distance. A recruiter reads "2019" faster than "1.4 MI". Putting the year on the instrument cluster ties the
    metaphor to the actual career with one readout.
  - **Evidence the data supports it:** `src/content/education.js:6` has `date: '2016-12-01'`, and
    `src/content/experience.js` carries a `date` on all nine roles — `2017-09-01` (Checkmate Digital) through
    `2025-12-01` (Senior MES DevOps Engineer), already sorted ascending into the route by
    `route.js:7,54` (`byDateAscending`). So route indices 1-10 have real, monotonic years: 2016 -> 2025.
  - **Evidence for the limit:** `src/lib/projects.js` has **no** date field on any project, and the skills and
    destination stops have none either. Route indices 11-20 therefore have no year in the data.
  - **Direction (decided):** the readout counts the years while there is real data behind it, then switches to
    **`NOW`** once past the last dated stop. That is honest — the last role is "Dec 2025 - Present" and today is
    August 2026 — and it reads well: the odometer counts out the career, then simply says NOW for the side builds,
    the toolbox and the destination.
  - **Files:** `src/components/drive/route.js` (add a derived `year` per stop + a `yearAt(travel)` lookup),
    `src/components/drive/Dashboard.jsx` (`TripComputer`).
  - **Done when:** driving from MILE 0 to the destination shows the year advancing 2016 -> 2025 across the career
    highway and then reading `NOW`; the readout updates through `drive.subscribe` + a ref, never React state; and no
    year is ever shown for a stop that has no date in the content.
- [ ] **2. Give each leg its own roadside character** (backlog S11)
  - **Why:** the route has five named legs but every mile of roadside is identical — the same lamps and the same
    delineators from MILE 0 to the destination. You cannot tell the school zone from the scenic overlook without
    reading a sign, so the middle of the drive feels like a treadmill.
  - **Evidence:** `RoadCanvas.jsx` draws roadside furniture from two fixed constants, `LAMP_SPACING = 72` and
    `DELINEATOR_SPACING = 24`, with no reference to which stop or leg a given world position belongs to.
  - **Direction:** derive the leg from the world position (not the camera), and vary the furniture per leg — a
    guardrail along the scenic overlook, denser lighting through the pit stop and destination, sparse open road across
    the sabbatical stretch. The point is that position becomes legible at a glance.
  - **Files:** `src/components/drive/RoadCanvas.jsx`, possibly a small table in `route.js`.
  - **Done when:** the roadside visibly differs between at least three legs while driving, the change is driven by
    world position so furniture keeps its identity as you pass it, and the paint loop still allocates nothing per
    frame (guardrail 14) with no anti-aliasing seams (guardrail 15).
- [ ] **3. Mile markers counting down between exits** (backlog S9b) *(stretch; returns to Backlog if the cycle runs long)*
  - **Why:** completes the signage story started in cycle 2 and gives the long legs a sense of progress between exits.
  - **Files:** `src/components/drive/RoadCanvas.jsx`.
  - **Done when:** small markers appear between exits without adding visual noise to the delineator line.
</details>


<details>
<summary>Cycle 2's list (resolved — kept for context)</summary>

### CYCLE 2

The user's three stated priorities all shipped in cycle 1. Cycle 2 spends its budget on the standing brief — *"get
creative, capture my identity as a software developer and the purpose of this portfolio"* — starting with the single
biggest lever available: making the drive pass **time**, not just distance.

- [ ] **1. Time-of-day lighting that advances along the route** (backlog S6)
  - **Why:** the route is a career in chronological order — school, nine roles, the side builds, the destination — but
    every frame currently looks identical, so the drive reads as a loop rather than a journey. Changing the light as
    you travel is the one change that touches every pixel and makes the metaphor land: you can *see* time passing.
  - **Direction (decided, so later cycles stay coherent):** do **not** do a full day cycle — the existing art is
    night-tuned (stars, moon, sodium lamp glow, neon HUD) and a washed-out midday would destroy it. Instead run a
    narrow, rich band: **golden-hour dusk at MILE 0 -> deepening twilight across the career highway -> full night by
    the toolbox**, then let the *destination* carry the first hint of dawn on the horizon. Dusk-to-night keeps the
    aesthetic; the dawn hint at "You have arrived" earns the "next chapter" note without being heavy-handed.
  - **Files:** new `src/components/drive/daylight.js` (keyframe palette + `paletteAt(progress)`), `RoadCanvas.jsx`
    (replace the frozen `COLORS` table), `Sky.jsx` (becomes subscription-driven), `DriveScene.jsx` (pass `drive` to
    `Sky`), possibly `drive.module.css`.
  - **Evidence it is currently static:** `RoadCanvas.jsx:17-27` is a module-level `COLORS` constant used directly in
    `draw()`; `Sky.jsx:24-90` renders a fixed `linear-gradient(#03060d -> #14405f)`, a fixed moon at `left:14% top:9%`
    and 110 deterministic stars — nothing in either file reads the sim.
  - **Done when:** driving from MILE 0 to the destination visibly changes sky, tarmac, verge and lamp warmth; stars and
    moon fade in as night falls; the destination shows the dawn hint; the paint loop still runs smoothly (guardrail 9);
    `Sky` uses subscribe+refs, not state (guardrail 10); and a cold load has no hydration warning (guardrail 11).
- [ ] **2. Exit-sign realism pass** (backlog S9)
  - **Why:** the signs anchor the whole road-trip conceit and are what you read at every stop, but they are a plain
    green box on a single post. Real interstate guide signs have an exit-number plaque, twin supports, and a
    retroreflective face that lights up as headlights reach it — which also makes each approach feel like arriving.
  - **Files:** `src/components/drive/ExitSign.jsx`, `drive.module.css`.
  - **Evidence:** `ExitSign.jsx:78-91` — one rounded green panel (`bg-[#12603c]`, `border-white/90`) plus a single
    12px post; no exit plaque, no retroreflection, and a fixed colour that will not sit correctly against the new dusk
    palette from task 1.
  - **Done when:** the sign carries an exit-number plaque, twin posts, and a face that brightens as it nears the
    camera, and it reads correctly at both the dusk and night ends of the task-1 palette.
- [ ] **3. Deep-link a specific exit — `/drive?exit=11`** (backlog S10) *(stretch; returns to Backlog if cycle 2 runs long)*
  - **Why:** drive mode has one URL for 21 stops, so the owner cannot send a recruiter straight to the role or build
    that matters — the main practical use of this page.
  - **Files:** `src/pages/drive.jsx`, `DriveScene.jsx` (read the query on mount, jump via the existing `goTo`).
  - **Done when:** `/drive?exit=11` starts parked at EXIT 11 with its panel open, junk/out-of-range values fall back to
    MILE 0 without throwing, and the URL tracks the current exit so it can be copied.

</details>

## Done (proven by the autonomous Reviewer)

- **1. Expose every project screenshot to the route** — proven working: `route.js` project stops carry `images[]`; in Chrome at `/drive` the carousel counter read `1/4` at EXIT 11 (solar-indy, 4 files on disk) and `5/5` at EXIT 12 (matrimoni-react, 5 files on disk). Commit `8883aaa`.
- **2. Auto-cycling project screenshots that are not cut off** — proven working: the full Solar Power Indy capture rendered edge to edge inside the browser frame (previously only its top ~25% was visible), and successive screenshots showed the counter advance 4/4 -> 1/4 -> 2/4 -> 3/4 unaided, with the active dot tracking it. Commit `8883aaa`.
- **3. Rebuilt arrival panel** — proven working: exit shield + leg + counter header and the media|prose split rendered at 1920x895; the panel's top edge sits at y=118 with the rear-view mirror ending at y=100, so the overlap reported in the audit is gone. Commit `8883aaa`.
- **4. Cockpit rebuilt around driver geometry** — proven working: at 1920x895 the wheel is centred on the binnacle on the driver's axis with the cluster read over the rim, and a live driving frame showed 35 MPH with the tach up, `P R N D 3` with D lit, the CRUISE tell-tale lit under autopilot, and the terminal screen counting down `EXIT 12 · Matrimoni  0.1 MI`. Commit `646b717`.
- **4b. Phone cockpit** — proven working: at 386x840 the stacked layout (cluster strip / terminal / controls+pedals) rendered correctly with `scrollWidth === innerWidth` (no horizontal overflow) and every control inside the viewport. Commit `646b717`.
- **5a. Cold-load hydration check** *(cleared cycle 2)* — proven clean: console tracking attached and cleared **before** navigating, then `/drive` loaded cold. Zero messages matched `hydrat|did not match|Warning|Error|Uncaught|mismatch`.
- **5b. Title clamping at phone width** *(cleared cycle 2)* — proven working, and it exposed a real cache fault on the way (see the log). At 386x840 on EXIT 11 the h2 computes `-webkit-line-clamp: 2`, `-webkit-box-orient: vertical`, `overflow: hidden`; the real title renders on exactly 2 lines unclipped, and an injected 113-character title still renders at exactly 2 lines (45px = 2 x 22.5px line-height) with `scrollHeight > clientHeight` — i.e. genuinely clamped, not merely short enough.
- **C2-1. Time-of-day lighting along the route** — proven working. Live state read at four points: MILE 0 `starOpacity=0` with a warm `rgb(226,140,84)` horizon; Coding Temple `0.2303`; Weather Window `0.9475`; destination `0.6` (dawn dims them again). Screenshots confirm golden-hour dusk at MILE 0, full night at the toolbox, first light at the destination. Performance measured both ways rather than assumed: **34.2fps median with the palette vs 26.6fps at baseline** (same machine, same 180-frame method, baseline obtained by stashing only the cycle-2 drive files) — no regression. Cold load has no hydration warning. Commit `dd4b28b`.
- **C2-2. Exit-sign realism pass** — proven working: mid-approach at dusk the sign shows its MUTCD exit plaque, twin posts, leg name, live distance countdown ("38 M"), title and sub, with the retroreflective face flaring as it nears; frozen mid-approach at night (brake held) it keeps good contrast against the dark sky. Commit `86d0174`.
- **C4-1. Timezone year bug — audit of the rest of the site** — investigated and **closed clean**: the classic site is *not* affected. Every date call site in `src/` was read and classified: `FormattedDate.jsx:1-5` builds its formatter with `Intl.DateTimeFormat('en-US', { …, timeZone: 'UTC' })`, which is exactly the right defence, and `:15` writes the `dateTime` attribute from `toISOString()` (always UTC). Proven by running that exact formatter config in Node against all ten content dates in a timezone behind UTC: it renders **Jan 2024** correctly, while `getFullYear()` on the same date returns 2023 in the same process — so the test conditions were valid and self-checking. `route.js:7` (`byDateAscending`) compares instants and is timezone-independent; `Intro.jsx:131` and `generateRssFeed.js:82` read the *current* year for a copyright line, where local time is the wanted semantic; `generateRssFeed.js:107` hands a `Date` to the feed library, which serialises UTC. Conclusion: `route.js` was the only affected site and it was fixed in `94eea90`. No code change needed, no Needs-human item.
- **C4-3. Years and leg structure in the crawlable itinerary** — proven working by reading the served HTML back: six `<h2>` leg headings, 21 `<h3>` stop headings, and exactly ten `<time>` elements reading `2016 2017 2019 2020 2023 2023 2023 2024 2024 2025` — matching education and the nine roles, including the January-2024 role the cycle-3 fix corrected. The eleven stops with no date in the content carry no year at all (guardrail 13 / 19). Commit `e799e92`.
- **C3-1. Trip computer reads in years** — proven working by server-rendering `yearAt` across all 21 stops plus quarter-leg midpoints. Sequence: 2016 at school, 2017 / 2019 / 2020 across the early roles, **2021 and 2022 while crossing the sabbatical**, 2023 / 2024 / 2025 through StarPlus, then `NOW` from the last dated role onward — and `NOW` at every project, toolbox and destination stop, never a fabricated number (guardrail 13 satisfied). SSR HTML confirms the readout renders `2016` initially. Commit `94eea90`.
- **C3-1b. Timezone year bug (found while verifying C3-1)** — proven fixed. `yearOf()` used `new Date(d).getFullYear()`, which parses `YYYY-MM-DD` as UTC midnight then reads it back in local time, so in any timezone behind UTC a January 1st date reports the previous year. The SSR probe showed **four** stops at 2023 when only three roles are from 2023: the StarPlus UI/UX role (`2024-01-01`, own label "Jan 2024 - Oct 2024") had silently moved to 2023. Confirmed the mechanism in Node across all ten content dates — only the Jan 1st one differed (local 2023 vs UTC/string 2024). The year is now read straight off the string; the re-run probe shows index 8 at 2024. Commit `94eea90`.
- **C2-3. Deep-link an exit** — proven working: `/drive?exit=11` opens parked on Solar Power Indy with the panel up and the carousel at 1/4; driving on moved the URL to `?exit=12`; `?exit=999` falls back to the ignition screen at MILE 0 without throwing. The accept predicate was additionally exercised across `11/0/20/21/999/-3/banana/11abc/" 11 "/1.5/""/1e3/null/0x5` — only in-range integers accepted. Commit `0d3e493`.
- **5c. Reduced-motion path through the carousel** *(cleared cycle 2)* — proven by real execution: `matchMedia('(prefers-reduced-motion: reduce)')` was patched to report `matches: true` inside a 390px probe frame before hydration, then EXIT 11 was opened. The frame counter held at `1/4` across 11 seconds (autoplay would have advanced 2-3 times at the 4.2s interval), clicking the third dot still moved it `1/4 -> 3/4`, and the `@media (prefers-reduced-motion: reduce) { .shot { transition: none } }` rule is present in the served stylesheet.

## Needs testing (testable now — Reviewer must clear all of these each run)

- [ ] **C3-2 visual pass: per-leg roadside character** — the *logic* is proven (see below), but the **pixels are unverified**: Chrome in this environment can no longer reach the dev server on any host/port (`ERR_CONNECTION_REFUSED` in the browser while `curl` on the same URL succeeds, and `localhost:3001` returns one of the user's other apps entirely). Test when the browser can reach the server again: drive from EXIT 10 into the Scenic overlook (EXIT 11-18) and confirm (a) a guardrail appears along the right verge and runs continuously with **no anti-aliasing seams** down its length, (b) the lamp line visibly thins there and thins further across the sabbatical (EXIT 04), (c) nothing pops or changes character as you approach it, and (d) driving still feels smooth.
  - **Already proven without the browser:** `roadsideAt` server-rendered across all 21 stops gives exactly the intended mapping — Start line / School zone / Career highway at `lampEvery 1` with the sabbatical at `lampEvery 3`, the eight Scenic overlook stops at `lampEvery 2` **with the rail**, then Pit stop and Destination back to `lampEvery 1`. `npm run build` compiles and `next lint` is clean.

## Awaiting scenario (can't test until a specific scenario occurs)

- [ ] **All pixel-level browser verification** — Awaiting scenario: **a Chrome that can reach the local dev server.** From ~21:05 local, Chrome returns `ERR_CONNECTION_REFUSED` for `127.0.0.1:3007` and `localhost:3007` while `curl` on the identical URLs returns the page, and `localhost:3001` renders a *different* application of the user's ("Virsh.shop — Operator Console") even though `netstat` shows this project's `next dev` owning the port and `curl` returns the right HTML. So Chrome's networking is proxied or isolated away from the shell's. This is environmental and cannot be fixed from here without changing the user's browser/proxy configuration.
  - **Each cycle:** re-check with one `curl` + one browser navigation. If the browser can reach the server, clear the Needs-testing items above.
  - **Meanwhile:** verify through the channels that still work — `npm run build`, `next lint`, Node execution, and **SSR probes** (temporarily rendering a value into the page's `sr-only` block, reading it with `curl`, then reverting). That last technique proved both cycle-3 tasks and caught the timezone bug; it is real execution of the real modules through the real toolchain.

## Blocked (couldn't be implemented — missing dependency the loop can't supply)

*(empty)*

## Needs human (parked — requires a person; the loop will NOT guess these)

- [ ] **`/drive` ships two canonical tags, and the first one points at the homepage** — Needs human because the fix
  belongs in `src/pages/_app.jsx`, which is **outside this run's write scope** (guardrail 18).

  **The defect, measured — not inferred.** `curl http://127.0.0.1:3007/drive` returns:

  ```html
  <link rel="canonical" href="https://htae.dev"/>        <!-- from _app.jsx:69 -->
  <link rel="canonical" href="https://htae.dev/drive"/>  <!-- from drive.jsx:17 -->
  <meta property="og:url" content="https://htae.dev"/>          <!-- _app.jsx:80 -->
  <meta property="og:url" content="https://htae.dev/drive"/>    <!-- drive.jsx:18 -->
  <meta property="og:title" content="Hyun-Tae Jin | Senior MES DevOps Engineer"/>  <!-- _app.jsx:81 -->
  <meta property="og:title" content="Hyun-Tae Jin | Drive mode"/>                  <!-- drive.jsx:19 -->
  ```

  `<title>` is fine — Next dedupes that one on its own.

  **Why it matters.** A crawler that honours the first canonical is told `/drive` is a duplicate of the homepage, which
  drops drive mode out of the index entirely. A social scraper that takes the first `og:title`/`og:url` previews a
  shared drive-mode link as the homepage — which defeats the `?exit=` deep links shipped in cycle 2.

  **Cause.** `next/head` only deduplicates tags that carry a matching `key` prop. `_app.jsx` emits site-root
  `canonical` / `og:url` / `og:title` on **every** page and neither side sets a `key`, so both render.

  **Exact patch — add a `key` to each side; the page-level tag then wins:**

  ```jsx
  // src/pages/_app.jsx  (lines 69, 80, 81)
  <link rel="canonical" href={siteUrl} key="canonical" />
  <meta property="og:url" content={siteUrl} key="og:url" />
  <meta property="og:title" content={meta.pageTitle} key="og:title" />

  // src/pages/drive.jsx  (lines 17-19)
  <link rel="canonical" href={url} key="canonical" />
  <meta property="og:url" content={url} key="og:url" />
  <meta property="og:title" content={title} key="og:title" />
  ```

  Same treatment is worth applying to `og:description` / `twitter:title` / `twitter:description`, which duplicate the
  same way. **Verify after applying** with
  `curl -s http://localhost:3007/drive | grep -c 'rel="canonical"'` — it should print `1`, and the surviving href
  should be `https://htae.dev/drive`.

  *(The loop deliberately did not bodge a half-fix into `drive.jsx` alone: without a `key` on the `_app` side, adding
  one only to the page changes nothing, and it would have looked fixed.)*

## Backlog (deferred — the Planner mines this at the start of every cycle)

- **S5 — Ambient drive audio (engine note, turn-signal tick), default muted with a dash toggle** — still deferred: Web Audio only (no new deps allowed), must be opt-in so it never autoplays, and needs a speaker toggle somewhere on the dash that does not crowd the console.
- **S8 — Persist progress (visited stops / furthest exit) to `localStorage` so a returning visitor resumes** — still deferred: needs a reset affordance so it can't trap someone mid-route. Now interacts with the `?exit=` deep link shipped in cycle 2 — an explicit deep link must win over a stored position.
- **S9b — Mile markers counting down between exits** — carved out of S9 and *deferred again from cycle 3*: it was the stretch task and the cycle filled up. Needs new drawing in `RoadCanvas.drawRoadside`. Hold until the browser can verify pixels again — shipping more unverifiable canvas work is how seams get missed.
- **S15 — Structured data for `/drive`** *(new, cycle 4)* — `_app.jsx:16-48` emits a `@graph` of WebSite / Person / ProfilePage, all `@id`-anchored to the site root, so `/drive` inherits markup that describes the homepage. A route-specific `WebPage` (or `ItemList` of the exits) would let the drive page stand on its own in search. **Blocked behind the Needs-human canonical fix** — adding more page-level head content while two canonicals disagree would just add noise.
- **S13 — Weather that belongs to the light** *(new, cycle 2)* — with the dusk-to-night palette in, a thin layer of drifting haze or a few passing headlights on the opposite carriageway would make the road feel inhabited rather than empty. Canvas-only, must respect the per-frame allocation guardrail.
