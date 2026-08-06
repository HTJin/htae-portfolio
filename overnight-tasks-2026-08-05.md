# Overnight session — tasks (overnight-tasks-2026-08-05.md)

> **For the executing agent:** You're picking this up fresh. This document is your entire brief. Read it top to bottom, follow the operating rules, work the tasks in order, log to `overnight-log-2026-08-05.md`, journal to `overnight-journal-2026-08-05.md`, and rewrite `overnight-report-2026-08-05.md` at the end of every cycle. This run **loops** Suggester -> Planner -> Critic -> Builder -> Reviewer autonomously and endlessly until the user stops it. If something is ambiguous, make the most reasonable documented assumption and keep moving — do **not** stop and wait for a human.

**Date:** 2026-08-05
**Goal of the night (one line):** Make `/drive` feel like sitting in a real car built by a software engineer — a believable driver's-POV cockpit, an arrival panel worth reading, and project screenshots that display in full and cycle themselves.
**Phase:** Planner
**Cycle:** 2

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
6. *Failure: running `npm run build` while `npm run dev` is live.* They share `.next`, and the build clobbers the dev server's route manifest — `/drive` starts returning 404 to new requests while the already-open tab keeps working off HMR, which looks exactly like a code regression. **Guardrail:** after any `npm run build`, restart the dev server before browsing, and never diagnose a 404 without checking whether a build just ran.
7. *Failure: mistaking a hidden Chrome window for a broken page.* A backgrounded tab reports `document.visibilityState === 'hidden'`; Chrome then unrenders it, so screenshots come back solid black and every `getBoundingClientRect()` returns 0. **Guardrail:** before reporting any visual defect, check `document.hidden` first — if true, the finding is worthless, and verification must fall back to build/lint until a person foregrounds Chrome.
8. *Failure: `object-contain` fixes cropping but leaves ugly letterbox bars.* **Guardrail:** the frame must have an intentional backing (browser-chrome mock) so unused space reads as design, not as a bug.

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

*(cycle 1's list is fully resolved — see Done / Needs testing below. The Planner fills this for cycle 2.)*

## Done (proven by the autonomous Reviewer)

- **1. Expose every project screenshot to the route** — proven working: `route.js` project stops carry `images[]`; in Chrome at `/drive` the carousel counter read `1/4` at EXIT 11 (solar-indy, 4 files on disk) and `5/5` at EXIT 12 (matrimoni-react, 5 files on disk). Commit `8883aaa`.
- **2. Auto-cycling project screenshots that are not cut off** — proven working: the full Solar Power Indy capture rendered edge to edge inside the browser frame (previously only its top ~25% was visible), and successive screenshots showed the counter advance 4/4 -> 1/4 -> 2/4 -> 3/4 unaided, with the active dot tracking it. Commit `8883aaa`.
- **3. Rebuilt arrival panel** — proven working: exit shield + leg + counter header and the media|prose split rendered at 1920x895; the panel's top edge sits at y=118 with the rear-view mirror ending at y=100, so the overlap reported in the audit is gone. Commit `8883aaa`.
- **4. Cockpit rebuilt around driver geometry** — proven working: at 1920x895 the wheel is centred on the binnacle on the driver's axis with the cluster read over the rim, and a live driving frame showed 35 MPH with the tach up, `P R N D 3` with D lit, the CRUISE tell-tale lit under autopilot, and the terminal screen counting down `EXIT 12 · Matrimoni  0.1 MI`. Commit `646b717`.
- **4b. Phone cockpit** — proven working: at 386x840 the stacked layout (cluster strip / terminal / controls+pedals) rendered correctly with `scrollWidth === innerWidth` (no horizontal overflow) and every control inside the viewport. Commit `646b717`.

## Needs testing (testable now — Reviewer must clear all of these each run)

- [ ] **Title clamping on phones** — `StopCard` h2 is `line-clamp-2 lg:truncate`. Confirmed the utility compiles and applies (`-webkit-line-clamp: 2`, `overflow: hidden` on a probe element), but **not** confirmed visually on a long title at 390px — a probe div resolved to `display: flow-root` rather than `-webkit-box`, which would defeat the clamp. Test: load `/drive` at 390px, jump to EXIT 11 (the longest title, "Solar Power Indy - Sales Qualification App") and confirm it wraps to exactly two lines with an ellipsis rather than one truncated line or three full lines.
- [ ] **Reduced-motion path through the carousel** — the code disables autoplay and the CSS transition under `prefers-reduced-motion`, but this was never exercised. Test: set the OS/Chrome reduced-motion preference, load a project stop, confirm the first frame is static, the dots still switch frames, and no interval is running.
- [ ] **Hydration check on a cold load of `/drive`** — console tracking was only started mid-session, so a page-load hydration warning would have been missed. Test: hard-reload `/drive` with the console tool attached first and confirm no hydration or React errors.

## Awaiting scenario (can't test until a specific scenario occurs)

- [ ] **All remaining browser verification** — Awaiting scenario: a foregrounded Chrome window. As of 21:00 ET every tab reports `document.visibilityState === 'hidden'`, so Chrome has unrendered them — screenshots return solid black and all `getBoundingClientRect()` calls return 0. This is environmental, not a code fault (dev server 200s, build compiles, lint clean, and the same page rendered correctly minutes earlier in the same session). Each cycle: re-check `document.hidden` first; if false, clear the Needs-testing items above.

## Blocked (couldn't be implemented — missing dependency the loop can't supply)

*(empty)*

## Needs human (parked — requires a person; the loop will NOT guess these)

*(empty)*

## Backlog (deferred — the Planner mines this at the start of every cycle)

- **S5 — Ambient drive audio (engine note, turn-signal tick), default muted with a dash toggle** — deferred: needs authored audio assets and a mute-by-default UX decision; revisit once the visual work lands.
- **S6 — Day/dusk/night lighting that advances along the route** — deferred: touches `Sky.jsx` + `RoadCanvas.jsx` colour tables; larger than one cycle, schedule after the cockpit lands.
- **S7 — Touch/mobile driving controls (thumb throttle + tilt-free steering)** — deferred: pedals exist as buttons but ergonomics at 390px are untested; schedule after task 4 settles the dash layout.
- **S8 — Persist progress (visited stops / furthest exit) to `localStorage` so a returning visitor resumes** — deferred: needs a reset affordance so it can't trap someone mid-route.
- **S9 — Exit-sign realism pass (retroreflective green MUTCD-style shields, mile markers counting down)** — deferred: `ExitSign.jsx` not yet read in this cycle.
- **S10 — Share/deep-link a specific exit (`/drive?exit=11`)** — deferred: needs router wiring in `src/pages/drive.jsx`.
