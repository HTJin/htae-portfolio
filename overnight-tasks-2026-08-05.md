# Overnight session — tasks (overnight-tasks-2026-08-05.md)

> **For the executing agent:** You're picking this up fresh. This document is your entire brief. Read it top to bottom, follow the operating rules, work the tasks in order, log to `overnight-log-2026-08-05.md`, journal to `overnight-journal-2026-08-05.md`, and rewrite `overnight-report-2026-08-05.md` at the end of every cycle. This run **loops** Suggester -> Planner -> Critic -> Builder -> Reviewer autonomously and endlessly until the user stops it. If something is ambiguous, make the most reasonable documented assumption and keep moving — do **not** stop and wait for a human.

**Date:** 2026-08-05
**Goal of the night (one line):** Make `/drive` feel like sitting in a real car built by a software engineer — a believable driver's-POV cockpit, an arrival panel worth reading, and project screenshots that display in full and cycle themselves.
**Phase:** Planner
**Cycle:** 39

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

**OWNER'S DIRECT INSTRUCTIONS (given 2026-08-06, cycle 13 — these outrank anything the loop decided for itself):**
- **No traffic, and no other invented "life" on the road.** Oncoming vehicles were removed at the owner's request:
  *"you've put unnecessary opposing traffic in a portfolio site that should represent me."* Do **not** re-add oncoming
  cars, tail lights, other drivers, pedestrians or similar. The Suggester must not re-propose them, and S13b
  (drifting haze) is now **closed as unwanted** for the same reason — the road is meant to be the owner's road, not a
  simulation of a busy highway. If a future cycle thinks the road feels empty, that is the intended feeling.
- **The car drives in a lane.** *"i dislike how the car starts in the middle of the road"* and *"you also make me
  steer right back into the middle of the road instead of the middle of the lane of traffic im supposed to be in."*
  The camera sits at `cameraX(sim) = LANE_OFFSET + sim.x` (`world.js`), `LANE_OFFSET = 2.7` — the midpoint of the
  right-hand lane. `sim.x` is drift **within the lane**, so steering re-centres to the lane, never to the centre line.
  Any future change touching camera lateral position must go through `cameraX()` and preserve this.

**Pre-mortem guardrails (prevent likely failure modes):**
1. *Failure: hydration mismatch.* The gauges already round coordinates to keep SSR and client byte-identical (`Dashboard.jsx:11-17`). Any new SVG geometry computed with `Math.*` must be rounded the same way, and nothing may branch on `window`/`Date` during render. **Guardrail:** after every visual change, check the browser console for a hydration warning before calling the task built.
2. *Failure: the 60fps loop gets slower.* The sim pushes state via `drive.subscribe(...)` and writes to refs, deliberately bypassing React re-renders. **Guardrail:** never add per-frame React state to the drive loop; new live readouts must use the `subscribe` + `ref.textContent`/`style.transform` pattern already in `Dashboard.jsx:32-45`.
3. *Failure: the cockpit eats the road.* Making the dash taller/denser can crowd the windshield until there is nothing to look at. **Guardrail:** the drivable glass area must stay >= ~50% of viewport height at 900px tall, and the dash must not exceed ~38% height; verify visually at 1440x900 AND 390x844.
4. *Failure: a redesigned StopCard becomes unreadable or unscrollable on mobile.* **Guardrail:** verify the panel at 390x844 — content must scroll, no horizontal overflow, and the close/next affordances must stay reachable.
5. *Failure: the screenshot carousel autoplays over reduced-motion users, or leaks timers between stops.* **Guardrail:** honor `useReducedMotion()` (show a static first frame + manual dots), and clear the interval on unmount/stop-change; verify by switching stops repeatedly and watching for stacked timers.
6. *Failure: running `npm run build` while `npm run dev` is live, or trusting a poisoned `.next` cache.* They share `.next`; the build clobbers the dev server's route manifest (`/drive` starts 404ing for new requests while the open tab keeps working off HMR). Worse, the webpack cache can go stale and **silently serve CSS that is missing newly-added Tailwind classes** — observed in cycle 2, where `line-clamp-2` and `lg:truncate` produced zero CSS rules until a clean restart. **Guardrail:** after any `npm run build`, restart the dev server; and if a class looks inert, run `npm run dev:fresh` (wipes `.next`) and re-check *before* concluding the class or the config is at fault.
46. *Failure (cycle 15): a "tidying" refactor that changes what is on screen.* This is a pure refactor — identical maths, fewer copies. **Guardrail:** capture a canvas frame *before* touching anything and require the after-frame to differ by **zero** pixels. Any non-zero diff means the refactor is wrong, not that the threshold needs relaxing.
47. *Failure (cycle 15): DRY-ing the hot loop and paying for it every frame.* `buildPoints` deliberately mutates pre-allocated objects and hoists its base trig out of the loop. **Guardrail:** do not route it through a function that returns a new object or recomputes `curveAt(sim.travel)`/`hillAt(sim.travel)` per point; leave it inlined and say why in a comment.
43. *Failure (cycle 12): fixing the overlap by nudging one number.* The dash height and the panel's bottom offset are **the same quantity written twice**. Adjusting either alone leaves them able to drift apart again at some other viewport. **Guardrail:** express it once and have both sides consume that single expression.
44. *Failure (cycle 12): reclaiming glass by shrinking the dash until the controls stop working.* The 210px floor exists because the phone cockpit stacks a cluster strip, a screen and a control row. **Guardrail:** after any height change, measure at 840x386 that the controls still fit inside the dash and nothing overflows — do not trade a visible bug for an unusable one.
45. *Failure (cycle 12): concluding "no focus ring" from programmatic focus.* `.focus()` does not match `:focus-visible`, so a computed `outline-style: none` after a scripted focus is meaningless. **Guardrail:** to claim a focus-visibility defect, find an author rule that removes the outline — not a computed style from synthetic focus.
40. *Failure (cycle 11): reading the motion preference during render and breaking hydration.* Same trap as guardrail 28 — the server has no `matchMedia`. **Guardrail:** the flag comes from `useReducedMotion()` in `DriveScene`, which framer-motion already resolves safely, and is passed down as a prop; the canvas must never query it itself during render.
41. *Failure (cycle 11): the canvas effect not re-running when the preference flips.* `RoadCanvas` builds its draw loop inside a `useEffect` keyed on `[drive]`; adding a prop it reads without adding it to the deps would silently keep the old value. **Guardrail:** include the flag in the dependency array and confirm a change actually re-subscribes.
42. *Failure (cycle 11): "verifying" reduced motion by reading the code.* Every one of these four mechanisms is an assertion until exercised. **Guardrail:** patch `matchMedia` before hydration and prove each one from observable state — pixels for the traffic, the frame counter for the carousel, `travel`/odometer for the throttle.
37. *Failure (cycle 10): a focus trap that fights the existing key handling.* `DriveScene` already binds global `keydown` for driving and for Escape. A second handler that swallows keys would break closing the map, or leave the car accelerating while the dialog is open. **Guardrail:** the trap may only act on Tab; Escape must continue to reach the existing handler.
38. *Failure (cycle 10): stealing focus when the dialog is shut.* An effect that focuses on every render would yank focus away from whatever the visitor is using. **Guardrail:** move focus only on the open transition, restore only on the close transition, and never touch focus while closed.
39. *Failure (cycle 10): trapping focus so completely the page becomes a prison.* **Guardrail:** cycle Tab within the dialog, but leave Escape and the browser's own chrome reachable — never `preventDefault` anything except Tab.
33. *Failure (cycle 9): audio that starts without being asked for.* A résumé page that makes noise on load is worse than one with no sound at all. **Guardrail:** the `AudioContext` may only be constructed inside the toggle's own click handler, and the preference must **not** be persisted — a stored "on" would attempt playback on the next visit before any gesture exists.
34. *Failure (cycle 9): the audio graph driven from React state per frame.* Same trap as guardrail 2, but worse — re-rendering at 60fps to set a frequency would be pure waste. **Guardrail:** drive `AudioParam`s from `drive.subscribe` using `setTargetAtTime`/`value`, never component state.
35. *Failure (cycle 9): a leaked `AudioContext`.* Browsers cap how many a page may create, so a context per mount would eventually throw. **Guardrail:** close the context on unmount and null the reference; never build a second one while the first is alive.
36. *Failure (cycle 9): "fixing" a layout defect that is really a frozen animation.* Observed this cycle — the arrival panel measured 26px into the dash at phone width, which looked like an overlap. It was framer-motion's *initial* transform (`translateY 26`, `rotateX 10°`, `scale .97`) never advancing, because rAF is paused in a hidden tab. Neutralising the transform showed the settled layout was flush and correct. **Guardrail:** before treating a measured overlap as real, read `getComputedStyle(el).transform`; if it is not `none`/identity, the element is mid-animation and the number is meaningless.
28. *Failure (cycle 8): reading `localStorage` during render and breaking hydration.* The server has no storage, so any markup that depends on it differs from the client's first paint — the exact class of bug guardrail 1 exists for. **Guardrail:** never touch storage during render. Read it in an effect, hold it in state that starts `null`, and render the resume affordance only once mounted; then confirm a cold load is warning-free.
29. *Failure (cycle 8): storage access throwing and taking the page with it.* `localStorage` throws on access in Safari private mode, when cookies are blocked, and in some embedded webviews — not just on write. **Guardrail:** every read *and* write goes through try/catch; a storage failure must degrade to "no saved progress", never to a broken page.
30. *Failure (cycle 8): restoring a stale index onto a changed route.* The route is derived from content; if a role is added or removed, a stored index points somewhere else entirely — or off the end. **Guardrail:** version the storage key, and clamp/validate the restored index against `route.length` before using it. Store the stop's `id` too and only trust the index if the id still matches.
31. *Failure (cycle 8): trapping a returning visitor.* Auto-jumping someone to a stored position takes away their choice and hides the beginning of the route. **Guardrail:** progress is *offered*, never applied automatically, and clearing it is always one click away on the same screen.
32. *Failure (cycle 8): writing to storage from the 60fps loop.* **Guardrail:** persist only when the current exit changes — never inside `subscribe`.
25. *Failure (cycle 7): oncoming traffic that breaks determinism or the frame budget.* `Math.random` in the paint loop would make the scene non-reproducible and could differ between server and client; allocating fresh car objects each frame would churn. **Guardrail:** keep a fixed, pre-allocated set of cars in the effect closure and mutate their positions in place; drive them from a clamped frame delta (a huge `dt` after a resize or a background tab must not teleport them).
26. *Failure (cycle 7): a car drives through the player or through an exit sign.* **Guardrail:** oncoming vehicles live on the opposite carriageway only, and are skipped once they are nearer than the near clip — never drawn at or behind the camera.
27. *Failure (cycle 7): mile markers become visual noise.* Delineator posts already appear every 24m; adding markers at a similar cadence would read as clutter. **Guardrail:** markers must be far sparser than the delineator line and visually distinct from it, and the result must be checked in a screenshot rather than assumed.
23. *Failure (cycle 6): trusting the dev server's client bundle.* This project's `next dev` intermittently serves a page whose HTML is correct but which **never hydrates** — `body.style.overflow` stays unset, "Start engine" does nothing, and every deep link appears broken, all with **no console error and all JS chunks returning 200**. It looks exactly like a shipped regression. **Guardrail:** before diagnosing any interactivity bug, confirm hydration with `document.body.style.overflow === 'hidden'`; if it is false, re-verify against a **production build** (`npm run build` then `PORT=<p> npm run start`) before concluding anything. Production has been reliable all night; dev has faked three separate defects.
24. *Failure (cycle 6): rAF-based measurements in a background tab.* `requestAnimationFrame` is paused when `document.hidden` is true, so any loop awaiting N frames never resolves and the CDP call times out at 45s, which reads as "the renderer is frozen". **Guardrail:** check `document.hidden` before any frame-timing measurement; if true, the number is unobtainable — say so rather than inventing one.
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
21. *Failure (cycle 5): hiding something from assistive tech that a non-visual user actually needs.* `aria-hidden` on the instruments is right only because the `sr-only` itinerary and the `aria-live` arrival panel already carry the real content. **Guardrail:** hide only decoration — never a control, never the `StopCard`, never the itinerary — and re-read the served HTML afterwards to confirm the controls and panel are still exposed.
22. *Failure (cycle 5): an `aria-label` that contradicts the visible text.* A sighted keyboard user reads "Next ▸" while the label says something else; if they disagree, voice-control users cannot say what they see. **Guardrail:** every label must contain the visible word ("Back", "Next", "Map", "Brake", "Go"), just expanded — not renamed.
18. *Failure (cycle 4): "fixing" the canonical tag by editing a file outside the write scope.* The real fix is in `_app.jsx`, which this run may not touch. **Guardrail:** measure it, write the exact patch out, park it as **Needs human** — do not edit `_app.jsx`, and do not bodge a half-fix into `drive.jsx` that only appears to work.
19. *Failure (cycle 4): the enriched itinerary changes what the page claims.* The `sr-only` block is the crawlable résumé; adding years there repeats the guardrail-13 risk. **Guardrail:** render `stop.year` only where it exists, never a fallback, and diff the rendered text against the previous output rather than eyeballing it.
20. *Failure (cycle 4): calling the timezone sweep "clean" without reading each site.* **Guardrail:** enumerate every date-formatting call in the repo and record a verdict per call site with the line reference, rather than concluding from one file.
17. *Failure (cycle 3): per-leg furniture pops as you drive.* If the leg is derived from the **camera** position rather than each object's own world position, furniture will change appearance as you approach it. **Guardrail:** the leg must be a function of the object's `s`, not of `sim.travel`.

### Cycle 17 pre-mortem (guardrails for this cycle's tasks)

46. **Do not weaken the SSR title.** A client-side per-stop title is for the tab, the bookmark and the route announcer.
    The `<title>` in `src/pages/drive.jsx` is what a crawler sees and must still be in the served HTML — verify with
    `curl`, not with the browser's DOM, which shows the client's value.
47. **A live region is only real if it is still the same node.** The whole defect being fixed is a remounting region;
    "it has `aria-live` on it" is not evidence. Verification must compare node identity across an arrival.
48. **Do not announce what did not happen.** MILE 0 is where you start, not somewhere you arrived. And do not fire an
    arrival announcement while the car is still moving.

### Cycle 18 pre-mortem (guardrails for this cycle's tasks)

49. **Move the cockpit, not the projection.** The road maths is verified correct and was proven pixel-identical in
    cycle 15. Do not add a principal-point offset to `project()` to "fix" this — that would shove the road into the
    left third of the windshield. The defect is in the dash layout.
50. **Measure the wheel, do not eyeball it.** "Looks centred" is not a result. Verify with
    `getBoundingClientRect()` against `innerWidth / 2`, the same measurement that found the defect.
51. **Landscape phone is the one that breaks.** Cycle 12's 71px panel/dash overlap lived there and came from a height
    written twice in different units. Re-check 844×390 and 390×844 explicitly after any dash layout change, and
    check the arrival panel does not collide with the moved controls.
52. **Do not quietly redesign the cockpit.** The owner has twice rejected inventions of mine. This task is correcting
    a measured geometric contradiction — it is not licence to restyle the dash, add instruments, or change what the
    gauges show.

### Cycle 19 pre-mortem (guardrails for this cycle's tasks)

53. **An iframe is only a valid viewport if it really is one.** Before trusting any measurement taken inside it,
    prove the frame is being treated as its own viewport: read `innerWidth` *from inside the frame* and confirm it is
    the frame's width, not the host window's, and confirm the expected Tailwind breakpoint actually applied (e.g. the
    `lg:hidden` phone block is displayed at 390px and not at 1100px). If that check fails the technique is invalid and
    the item stays parked — do not report a number from a frame that is silently inheriting the host viewport.
54. **Wait for hydration inside the frame, not the host.** Guardrail 23 applies per document. Confirm
    `frame.contentDocument.body.style.overflow === 'hidden'` before measuring anything in it.
55. **A frozen framer-motion transform still lies at every width.** Guardrail 36 caught a phantom 26px overlap once
    already. Before calling any measured overlap real, read `getComputedStyle(el).transform` and discard the number if
    it is not identity.
56. **Do not "fix" the phone layout to make a number look better.** The `lg:hidden` block was not touched by cycle 18.
    If something looks wrong there it is either pre-existing or an artefact — diagnose which before changing anything,
    because a change there is out of this task's scope.

### Cycle 20 pre-mortem (guardrails for this cycle's tasks)

57. **A frame rate without a baseline is a number, not a result.** This machine returned 28fps for an *empty* rAF loop
    on the static homepage, so the renderer here is not a 60fps reference. Every drive-mode figure must be reported
    beside a same-method sample taken in the same session, and the verdict must be about the *difference*.
58. **Measure the sim, not the measurement.** The probe loop is itself work on the main thread. Sample with a plain
    rAF delta accumulator — no DOM writes, no logging per frame — and discard the first few frames.
59. **`element.click()` is not a gesture.** That is precisely why the audio item has been parked for eleven cycles.
    Use a real dispatched input event; if the context still does not reach `running`, report that, do not describe
    the audio as working because the code looks right (the cycle-9 defect was a toggle that lied about its own state).
60. **Do not "fix" a passing test.** These three items are being *verified*, not built. If they pass, the change to
    the repo is zero and the tasks move to Done on the evidence alone.
61. **Escape must still close the map.** Guardrail 37 stands: the focus test drives the real key path, so if Escape
    stops closing the dialog that is a regression to report, not an inconvenience to work around with a Close click.

### Cycle 21 pre-mortem (guardrails for this cycle's tasks)

62. **A dirty-check that misses an input freezes the road.** The check must cover everything `draw()` reads. Those
    were enumerated from the file this cycle — `sim.travel`, `sim.x` via `cameraX`, and `camera` — and the enumeration
    is the guardrail: if a later change makes `draw()` read anything else, the check must gain it in the same commit.
63. **Compare against the last *drawn* state, never the last frame.** A per-frame delta threshold silently freezes
    slow motion; a last-drawn threshold bounds the error at the threshold itself.
64. **`resize()` bypasses the check, always.** `canvas.width = ...` wipes the backing store, so a skipped paint after
    a resize is a blank screen, not a saved frame.
65. **Prove it changes nothing on screen.** This is an optimisation, so the only acceptable visual result is identical
    output: capture a frame at a fixed exit before and after and require a zero-pixel difference (the cycle-15
    method).
66. **If the measurement does not show a win, do not ship it.** The item was parked for five cycles under guardrail 9
    for exactly this reason. A dirty-check that skips nothing is added complexity in a hot path.

### Cycle 22 pre-mortem (guardrails for this cycle's tasks)

67. **Never hide the *visible* screenshot from assistive tech.** The whole point is that one image carries the
    content. Hiding all of them would turn an over-announcement into silence, which is worse — verify the exposed
    one is the one at `opacity: 1`, not merely that the count dropped to one.
68. **The exposure must follow the cycle, not the first render.** Check after the carousel advances, not only on
    load — a check that passes once and then goes stale is the same defect in a new place.
69. **Growing a hit area must not move a pixel.** Verify the *visible* pill's box is unchanged (same width, height
    and centre) after the change, and confirm neighbouring hit boxes do not overlap.
    > **AMENDED during the Builder phase, cycle 22 — this rule as written was unsatisfiable, and saying so is better
    > than quietly breaking it.** The dots are 6px wide with a 6px gap, so centres sit **12px** apart. WCAG 2.5.8 is
    > met either by a 24×24 target or by its spacing exception (24px circles centred on each target must not
    > intersect) — and at 12px centres **both** fail. Compliance is therefore impossible without more room, so
    > "unchanged centre" cannot hold. **Amended rule:** the visible pill's own width and height must be unchanged and
    > neighbouring hit boxes must not overlap; the *spacing* between dots may grow, and the result must be confirmed
    > by screenshot rather than assumed to look fine.
70. **`alt=""` and `aria-hidden` are not interchangeable here.** An empty `alt` still leaves the element in the tree
    as decorative; the goal is that the inactive frames are not announced at all.

### Cycle 23 pre-mortem (guardrails for this cycle's tasks)

71. **Do not buy panel space from the cockpit.** The obvious way to fit the destination content is to shrink the dash,
    and guardrail 44 exists because that road ends in controls that no longer work. The space must come from the
    panel's own content, not from `clamp(190px,36%,48%)`.
72. **The trip figures are derived, and must stay derived.** `tripSummary` is computed in `route.js` from the content
    (guardrail 13). Making it fit is a layout change only — do not drop a figure, abbreviate a label into something
    inaccurate, or hardcode anything to save room.
73. **Desktop must not pay for the phone fix.** Capture the destination panel on desktop before and after; the
    summary's four-across layout at `sm` and up is not to change.
74. **Un-wrapping the control row must not shrink a target below 24px or rename a button.** Cycle 22 just established
    24×24 as the floor for this run, and guardrail 22 requires the visible word to survive in the label. Winning the
    ~11px from gaps and padding is fine; winning it by turning "Back" into a bare glyph is not.
75. **Verify at 360 as well as 390.** The overflow is only ~11px, so a fix that clears 390 by a hair will still wrap
    on a 360px phone. Both widths, measured, or the task is not done.

### Cycle 24 pre-mortem (guardrails for this cycle's tasks)

76. **The desktop cockpit is the regression test, not the deliverable.** The new expressions must resolve to today's
    exact offsets at the `36%` branch. Capture the bonnet, reflection and wiper boxes at 1440×900 before the change
    and require them back to the pixel afterwards. A "nicer" bonnet is out of scope (guardrail 52).
77. **A percentage inside `calc()` still resolves against the containing block.** All three consumers must sit in the
    same containing block for `--dash` to mean one thing — verify `Dashboard`, the panel container and
    `CarInterior`'s children all resolve against the scene root, not against some intermediate positioned ancestor.
78. **Tailwind arbitrary values need underscores for the spaces `calc()` requires.** `calc(var(--dash)-0.6%)` is
    invalid CSS; it must be written `calc(var(--dash)_-_0.6%)`. A silently invalid arbitrary value produces **no rule
    at all**, which looks exactly like the bug being fixed — so confirm the computed `bottom` is a real pixel value,
    not the browser default.
79. **Do not fix this by shrinking the dash.** Guardrail 44 stands: the 190px floor exists because the phone cockpit
    stacks a cluster, a screen and a control row. The furniture moves to meet the dash, never the reverse.
80. **One literal, checked by grep.** The point of the task is that the quantity exists once. Finish by grepping for
    `clamp(190px` and confirming a single definition.

### Cycle 25 pre-mortem (guardrails for this cycle's tasks)

81. **Height breakpoints must not leak upward.** Everything here is conditioned on a short viewport. Measure
    390×844 and 1440×900 after the change and require them byte-identical to before — a `max-height` variant that
    accidentally applies on a desktop would shrink the cockpit for everyone.
82. **`overflow: visible` is why this was invisible.** The content was painting outside its box rather than clipping,
    so nothing looked obviously broken in a screenshot. Verification must be `scrollHeight` vs `clientHeight` and
    per-row boxes, not "it looks fine now".
83. **A row with height 0 is the failure, not the symptom.** Requiring "no overflow" alone could be satisfied by the
    rows collapsing further. Assert explicitly that the exit line and the progress bar have **non-zero height**.
84. **Do not gut the cockpit to make it fit.** Deleting the gauge or the screen on a landscape phone would trade the
    owner's priority (a) for a clean measurement. Every element stays; they get smaller (guardrail 52).
85. **Pedals stay usable.** Cycle 22 set 24×24 as this run's floor and guardrail 44 warns against trading a visible
    bug for an unusable one. Any pedal shrink must be measured against that floor, not assumed safe.

### Cycle 26 pre-mortem (guardrails for this cycle's tasks)

86. **`justify-center` + `overflow-auto` silently clips the top.** This is the specific flexbox trap this task walks
    into: a centred flex child that overflows cannot be scrolled back to. The centring must move to an `m-auto`
    wrapper, and the fix must be verified by measuring that the splash's **first** element is reachable, not just
    that a scrollbar exists.
87. **Do not remove the way out to make the layout fit.** The link to the classic site is the only exit while the
    splash is up (it is `z-50` over the scene's own `z-40` exit link). Whatever else is tightened, that link stays.
88. **The height breakpoint must not leak upward.** Same rule as cycle 25's guardrail 81: measure 390×844 and
    1440×900 after the change and require them identical.
89. **Keep the keyboard legend honest.** If the controls list is hidden or reduced on small screens, it must not
    become *wrong* on the screens that keep it — and the on-screen controls must still be discoverable without it.
90. **Verify with saved progress present.** The fault only appears for a returning visitor, so every measurement in
    this cycle seeds `htae.drive.progress.v1` first. A clean-storage run would show the bug as fixed when it is not.

### Cycle 27 pre-mortem (guardrails for this cycle's tasks)

91. **Do not let scrolling touch focus.** The open effect already moves focus to the panel so a screen reader reads
    the dialog label first (cycle 10, guardrail 38). Scrolling must not call `.focus()` on a row, and must run
    alongside that effect without racing it — verify focus still lands on the panel, not on a list item.
92. **`scrollIntoView` can scroll ancestors.** Setting the scroller's own `scrollTop` is bounded and predictable;
    `scrollIntoView` walks up the tree and can move things it was never asked to. Prefer the explicit calculation, and
    verify the document itself did not scroll.
93. **Instant, never animated.** A smooth scroll would be motion the visitor did not ask for and would need a
    `prefers-reduced-motion` branch to be honest about. Jumping straight there needs no branch (guardrail 40's family).
94. **Re-verify the cycle-10/20 behaviour, do not assume it.** This edits the same effect that owns the focus trap and
    focus restore. Escape must still close the map and focus must still return to the trigger — measured, as in C20.2.
95. **MILE 0 must stay put.** At index 0 the correct scroll position is 0; a fix that always centres would push the
    top of the list under the header for the one case that was already right.

### Cycle 28 pre-mortem (guardrails for this cycle's tasks)

96. **The destination is out of scope.** Cycles 14 and 23 composed that panel deliberately — email as the primary
    action, the derived trip summary, the phone fit. It overflows by 0. Columns must not touch it.
97. **Never nest columns inside the project stops' grid.** Those already split media from prose; adding a second
    column context inside would produce a layout nobody designed. Apply only where there are no screenshots.
98. **Phones stay one column.** Everything here is `lg` and up. Re-measure 390×844 and 844×390 to prove the rule did
    not leak down, the same way cycles 25 and 26 proved their height breakpoints did not leak up.
99. **Check horizontal overflow explicitly.** Multi-column inside a scrolling box can overflow in the inline
    direction instead of the block direction. It measured 0 in trials, but the built version must be re-measured — a
    trial is not the shipped code.
100. **A short stop must not look broken.** Two columns with three bullets can read as a mistake. Look at exit 02 in a
    screenshot before calling this done, and narrow the rule if it reads badly.

### Cycle 30 pre-mortem (guardrails for this cycle's tasks)

101. **Derive it, do not retune it.** The fix is to read `LEG_LENGTH` from `route.js`, not to swap 420 for another
     literal. If a future cycle changes the leg length the sign must follow it without anyone remembering to.
102. **A fade-in must not become a disappearance.** The sign is wayfinding. Verify it is fully opaque well before the
     stop, not only at the last moment — and note that the "Next exit" banner already covers the first seconds, so
     starting from transparent costs no information.
103. **The flare and the fade share the same window.** Both read `VISIBLE_FROM`; changing it moves both. Measure both,
     not just the one being fixed.
104. **Do not touch the projection.** `project()` placement was proven pixel-identical in cycle 15 and re-measured in
     cycle 24. This task changes opacity and brightness only — the sign's position and scale curve must be unchanged.
105. **Check the parked and past-the-exit states explicitly.** `z < VISIBLE_UNTIL` and `z > VISIBLE_FROM` are the two
     hide branches; narrowing the window changes the second one, so re-verify the sign is hidden when parked.

### Cycle 31 pre-mortem (guardrails for this cycle's tasks)

106. **Keyframes must stay strictly ascending.** `paletteAt` walks the list assuming order; a derived `at` that lands
     out of sequence would silently break the interpolation for a whole stretch of road. Assert the ordering at module
     load and verify it, rather than trusting the arithmetic.
107. **Derive only what names a real stop.** "Middle of the career highway" and "the side builds" are ranges, not
     stops — there is nothing to anchor them to, so they keep their hand-picked fractions and their comments get
     corrected to say so. Only the toolbox keyframe names one specific stop.
108. **A missing stop must not break the sky.** If the content ever loses the toolbox, the lookup must fall back to
     the current literal rather than producing `undefined` and a `NaN` palette.
109. **Do not retune the colours.** This moves *when* full night happens, not what it looks like. Every colour value
     stays exactly as authored (guardrail 52).
110. **Check the destination did not change.** Compressing the dawn into the last leg makes it faster; verify EXIT 20
     still measures the authored first-light values and does not overshoot.

### Cycle 32 pre-mortem (guardrails for this cycle's tasks)

111. **This must be a no-op, and "must" means measured.** All three substitutions produce the same numbers today. The
     only acceptable result is identical output: zero pixels different on the canvas, identical sky and gauge
     readings. A visible change means the substitution was wrong, not that the baseline needs updating.
112. **Do not "improve" the values while touching them.** The temptation with `GEAR_RATIOS` is to respace the whole
     ladder. Out of scope — this cycle changes where a number comes from, never what it is (guardrail 52).
113. **Watch the import graph.** `daylight.js` gained an import of `route.js` in cycle 31. Adding
     `RoadCanvas -> route` (already present) and `Sky -> daylight` (already present) is safe, but confirm the build
     still compiles rather than assuming no cycle was created.
114. **Leave the unreachable fallback alone, and say why.** Once `GEAR_RATIOS` ends at `MAX_SPEED`, the
     `?? MAX_SPEED` in `gearCeiling` can no longer fire. It is a correct guard for an empty/short array and removing
     it would be a second change hiding inside a no-op commit.

### Cycle 33 pre-mortem (guardrails for this cycle's tasks)

115. **Do not take the itinerary out of the tab order.** The obvious "fix" is `tabindex="-1"` on those 25 links, and
     it would trade a sighted keyboard user's problem for a screen-reader user's — that block is their résumé and
     their only path to a stop's links without driving. Verify the count is still 25 afterwards.
116. **A skip link that is invisible when focused is worse than none.** It has to have a real, measurable box once
     focused — check `getBoundingClientRect()` in both states, not just that the class list changed.
117. **The target must actually receive focus.** An `href="#id"` to a container without `tabindex="-1"` moves the
     scroll position but not focus in several browsers. Measure `document.activeElement` after activation, and
     measure that the *next* Tab reaches a real control rather than going back to the top.
118. **Do not disturb the crawlable copy.** The itinerary is the only machine-readable version of the résumé
     (guardrail 19/21). Its text and link count must be byte-identical after this change.
119. **Check both layouts.** The cockpit renders a phone stack and a desktop grid; the skip target must land somewhere
     real in both, so verify at 390×844 as well as desktop.

### Cycle 34 pre-mortem (guardrails for this cycle's tasks)

120. **A layout box is not visibility.** This cycle's own experiment showed an element with a correct
     `getBoundingClientRect` that was still painted nowhere. Every visibility claim here must be a hit test
     (`document.elementFromPoint` returning the element at its own centre), not a rectangle.
121. **Do not restructure the crawlable résumé.** The itinerary is the only machine-readable copy (guardrails 19,
     21, 118). Changing how it is hidden — off-screen positioning instead of clipping, or `sr-only` moved onto every
     child — is a bigger change than this finding justifies, and would be made on a hunch about screen-reader
     behaviour that cannot be tested here.
122. **The chip must never speak.** It duplicates what a screen reader already announces, so it is `aria-hidden` and
     must not be a live region — two announcements of the same link is worse than none.
123. **It must not appear for mouse users.** Bind it to focus inside the itinerary only; verify it is absent on a
     normal load and after clicking around.
124. **Verify with real keys.** Programmatic focus does not match `:focus-visible` on an unfocused document — the trap
     that made two cycle-33 attempts report a false failure. Use real `Tab` presses and a focused window.

### Cycle 36 pre-mortem (guardrails for this cycle's tasks)

125. **Change the text, nothing else.** Cycle 30 measured the sign's opacity ramp, flare sweep and scale curve. Those
     must come back identical — re-measure them, do not assume a text change cannot move them.
126. **One unit, across the whole visible range.** The defect is the switch, not the choice. Verify by sampling a
     complete approach and asserting a single suffix, not by checking two endpoints.
127. **Feet derive from `METERS_PER_MILE`.** A typed 3.28084 would be a seventh copy of a number that lives somewhere
     else. Use miles × 5280, where 5280 is a definition rather than a measurement of this route.
128. **Do not invent a fraction ladder.** "1/4 MILE" reads well but never applies: the sign is only ever visible below
     0.14 miles. Shipping a branch that can never execute is worse than not shipping it (the cycle-30 lesson, where a
     fade that could never run was the whole defect).

### Cycle 38 pre-mortem (guardrails for this cycle's tasks)

129. **Escape and `M` must still close the map.** Guardrail 37 already says the focus trap may only swallow Tab and
     that Escape must reach the global handler. Suppressing keys while the map is open must not suppress the two that
     get you out of it — verify both, not just Escape.
130. **Do not `preventDefault` the arrow keys while the map is open.** The whole point is that the list should scroll
     normally. Suppressing the *drive* must not suppress the *browser*. Measure `defaultPrevented`, not just that the
     car stayed put.
131. **Release anything already held.** A key held before the map opens would otherwise stay latched with no keyup
     reaching the handler — the same class of bug the existing window `blur` handler exists to prevent.
132. **Prove the closed-map path is untouched.** This edits the handler every control on the page runs through. With
     the map closed, every key must behave exactly as it does today, measured rather than assumed.

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

## Tonight's tasks (in order) — CYCLE 39

_Not yet planned — the Planner writes this list next._

<details>
<summary>Cycle 38's list (resolved — kept for context)</summary>

### CYCLE 38

Backlog dry. Two findings this pass: one shippable defect, and one that reframes a parked item.

- [x] **1. The driving keys stay live while the route map is open, so the car drives behind the dialog** — **DONE**
  - **Evidence (measured at EXIT 05):** opened the route map, then dispatched `ArrowUp`. The car **left the stop** —
    `parked` **true -> false**, and the document title advanced **"EXIT 05 · Full Stack Devel..." -> "EXIT 06 ·
    Software Enginee..."** — while the dialog **stayed open**. The drive happens invisibly behind it.
  - **Why this is more than an annoyance:** arrow keys are the obvious way to scroll a twenty-one row list, so the
    natural gesture for using the map is also the gesture that pulls you off the exit you were reading. And the dialog
    declares `aria-modal="true"` — a promise, written into `RouteMap`'s own comment in cycle 10, that everything
    behind it is inert. It is not: `DriveScene`'s global `keydown` effect never checks `mapOpen`, and `mapOpen` is not
    in its dependency array.
  - **Files:** `src/components/drive/DriveScene.jsx`.
  - **Done when:** with the map open, `ArrowUp`/`W`, `ArrowDown`/`S`, arrows/`A`/`D`, `N` and `Backspace`/`P` leave the
    car parked, the title unchanged and the map open; **Escape still closes it** (guardrail 37) and **`M` still
    toggles**; arrow keys are **not** `preventDefault`ed while the map is open, so the list can still be scrolled; a
    control held *before* the map opens is released rather than left stuck on; and with the map **closed** every key
    behaves exactly as it does today, measured, not assumed.

**Finding recorded, not built — the missing `key` props block more than one duplicate tag.** `/drive` inherits its
whole social surface from `_app.jsx`: `og:image` and `twitter:image` are the **portrait avatar**, and `twitter:card` is
**`summary`** (the small square card) rather than `summary_large_image`. Giving the drive page its own card, or the
route-specific structured data of backlog **S15**, or fixing the duplicate canonical, all require `key` props in
`_app.jsx` — without them a second tag is *added* rather than overriding, which is exactly the state `/drive` is in
now (two `og:url`, two `og:title`, two canonicals). So the parked Needs-human item is not a tidy-up: it is the single
blocker in front of **four** separate improvements. Recorded there rather than shipped, because shipping a tag that
cannot take effect is the defect cycles 30 and 36 already fixed twice.

</details>

<details>
<summary>Cycle 37's list (resolved — kept for context)</summary>

### CYCLE 37

Backlog dry. This Suggester pass went after the **highest-stakes correctness property on the page**: the years. Guardrail
13 calls a wrong year on someone's résumé the worst bug this page could ship, and cycle 4 found exactly that — a
timezone bug that moved a January 1st role into the previous year. It was fixed and spot-checked at one stop. It had
never been verified **systematically, across every stop, in both places the years appear**.

- [x] **1. Audit every year against the content, in the cockpit and in the crawlable copy** — **DONE (no defect)**
  - **Done when:** every dated stop's readout matches `src/content/*` exactly; every undated stop shows no invented
    year in either place; and the January 1st entry is confirmed still correct.

</details>

<details>
<summary>Cycle 36's list (resolved — kept for context)</summary>

### CYCLE 36

Two Suggester probes. The first — an integration never exercised — came back clean; the second found a real defect on
the owner's priority (a).

**Probe 1 — resizing the window *mid-drive* is handled.** Every layout check in this run has loaded at a fixed size.
Departed EXIT 05, resized 1440×900 -> 900×650 while under way, then waited for a real arrival: the sim kept running
and arrived (status *"Arrived at EXIT 06"*), the canvas backing store followed **2880×1800 -> 1800×1300**, the dash
re-laid out to 234px (36% of the new height), the arrival panel appeared at 704×220 **fully inside the viewport**,
panel/dash overlap **0**, no horizontal scroll. Nothing to fix.

- [x] **1. The exit sign changes units halfway through the approach — into metric** — **DONE**
  - **Evidence (sampled every 450ms across one approach):** the readout runs
    `0.14 MI -> 0.13 -> 0.12 -> 0.11 -> 0.10 MI -> **159 M** -> 154 M -> 146 M`. Two distinct units in one readout,
    and the second is **metres** — on an American interstate guide sign, in a cockpit whose speedometer reads **mph**
    and whose odometer reads **MI**. `ExitSign.jsx:97`: `miles >= 0.1 ? "X.XX MI" : "N M"`.
  - **The site already has a sign vocabulary, and this disagrees with it.** The owner's own
    `src/components/DriveModeSign.jsx:20` — the sign on the homepage that leads into drive mode — reads
    **"1/4 mile"**, the fraction convention of real US guide signage. So drive mode's sign is inconsistent with the
    rest of the cockpit *and* with the sign the owner already wrote.
  - **Why feet, not fractions:** a leg is `LEG_LENGTH` 220m = 0.137 mi, and the sign is visible from 220m down to 7m,
    so the whole range sits **below** a quarter mile — the fraction ladder ("1 MILE / 1/2 / 1/4") never applies. Real
    advance signage below a quarter mile is given in feet. One unit, imperial, consistent with mph and MI.
  - **Derive, do not type:** feet must come from the existing `METERS_PER_MILE`, not a hand-typed 3.28084 — this run
    has closed six instances of a constant shadowing another (guardrail 101's family).
  - **Files:** `src/components/drive/ExitSign.jsx`.
  - **Done when:** one unit appears across a whole approach, sampled the same way — **no `M` and no `MI`**; the series
    decreases monotonically; the endpoints are sane (~720 FT at departure down to ~20 FT before the sign hides); the
    value derives from `METERS_PER_MILE`; and the sign's position, scale, opacity and flare curves are unchanged from
    cycle 30, measured, since this touches only the text.

</details>

<details>
<summary>Cycle 35's list (resolved — kept for context)</summary>

### CYCLE 35

Backlog dry. This Suggester pass audited the run's **own output** rather than the code: the three **Needs human**
items are the highest-value work left, they are the only things waiting on the owner, and they were written
**25 cycles ago** against files the owner has been editing since. A stale patch is worse than no patch.

- [x] **1. Re-verify the three parked Needs-human patches against today's files** — **DONE (all three still valid)**
  - **Done when:** each claim is checked against the current file or the served HTML, not the note that recorded it;
    every line reference is confirmed; and any figure that has drifted is corrected.

</details>

<details>
<summary>Cycle 34's list (resolved — kept for context)</summary>

### CYCLE 34

Cycle 33 made real keyboard focus measurable for the first time. This pass used it to answer a question left open since
cycle 12 and to finish what cycle 33 started.

**Settled: every control does have a focus indicator.** Fourteen real `Tab` presses on a genuinely focused document,
recording `getComputedStyle` at each stop: **all fourteen** report `outline: auto 1px` with `:focus-visible` true, and
**none** has its outline suppressed. Cycle 12 dismissed a "no focus indicator" alarm as an artefact of programmatic
focus and could not prove it either way; it can now be closed as correct.

- [x] **1. Focus still vanishes for 25 presses inside the itinerary, and the usual fix provably cannot work** — **DONE**
  - **Evidence:** of the 14 recorded stops, **13 were off-screen** — every itinerary link. They carry the browser's
    focus ring, but on content clipped to nothing, so the ring is painted where nobody can see it. The skip link from
    cycle 33 rescues anyone who takes it; anyone who keeps tabbing still walks 25 blind stops.
  - **Why the standard reveal is unavailable, established by experiment rather than assumed:** the usual treatment is
    `focus:not-sr-only`, which works on an element that is *itself* `sr-only` — that is exactly why the skip link
    appears at 171×22. It cannot work for a **descendant** of an `sr-only` container. Tested directly: a focused
    itinerary link forced to `position: fixed; clip: auto` at (16, 64) has the right layout box (85×38) but
    `document.elementFromPoint` at its own centre returns the **canvas**, not the link. A fixed descendant does not
    escape the ancestor's `clip: rect(0px, 0px, 0px, 0px)`.
  - **What that rules out:** revealing the link in place. Unclipping the container on `focus-within` would drop the
    entire résumé over the driving scene; changing how that block is hidden would mean restructuring the one
    machine-readable copy of the résumé (guardrail 118) on a hunch.
  - **What is left, and it is small:** show *where focus is* rather than trying to reveal the element — a chip outside
    the clipped container, `aria-hidden`, that appears only while focus is inside the itinerary and names the focused
    link. Screen-reader users are unaffected (they already hear it); the block's markup and text are untouched.
  - **Files:** `src/components/drive/DriveScene.jsx`.
  - **Done when:** tabbing into the itinerary shows an on-screen chip naming the focused link, proven with
    `document.elementFromPoint` returning the chip at its own centre (a layout box is not enough — that is what the
    experiment above disproved); the chip names each link as focus moves; it disappears when focus leaves the block;
    it is `aria-hidden`; the itinerary still holds **25** links with unchanged text; and the skip link still works.

</details>

<details>
<summary>Cycle 33's list (resolved — kept for context)</summary>

### CYCLE 33

Two Suggester probes this cycle. The first came back clean and is recorded as such; the second found a real defect.

**Probe 1 — the per-frame subscriber set does not leak.** `drive` is a `useMemo` whose identity changes on *every
arrival*, so every consumer's effect tears down and re-subscribes 21 times across a drive — one missing cleanup would
grow the fan-out silently and cost a little more every frame, forever. Measured by recording the size of the Set being
`forEach`-ed each frame: **13 subscribers at MILE 0, and exactly 13 after twelve stop changes** covering project
stops, the toolbox and the destination, with a single canvas and a single status region throughout. No leak.

- [x] **1. A keyboard user meets 25 invisible links before reaching a single control** — **DONE**
  - **Evidence (measured at EXIT 13, desktop):** of **38** focusable elements on the page, **25** live inside the
    `sr-only` itinerary — the screen-reader and crawler copy of the résumé. That container is
    `position: absolute; clip: rect(0px, 0px, 0px, 0px)`, which hides content **visually but not from the tab order**.
    So `Tab` from the top of `/drive` moves through *LinkedIn, GitHub, Résumé (PDF)*, two certificates, then
    *Live site / Source* for all eight builds, then the destination's four links — **25 presses** — before the first
    control a sighted person can see. The elements have real layout boxes (up to 195×19.5) that are clipped to
    nothing, so the focus ring is painted on clipped-away content: focus is not merely hard to see, it is **nowhere**.
  - **Who this hurts, and who it must not:** it is the sighted keyboard user who is stranded. A screen-reader user
    *wants* those links — the itinerary is their version of the résumé and their only route to a stop's links without
    driving. So the fix must not remove them from the tab order.
  - **The standard answer, and the reason it fits here:** a skip link — hidden until focused, first in the tab order,
    jumping past the itinerary to the cockpit. One press and you are at the controls; the itinerary stays exactly as
    reachable as it is now for anyone who wants it.
  - **Files:** `src/components/drive/DriveScene.jsx`, `src/components/drive/Dashboard.jsx` (a target id only).
  - **Done when:** the skip link is the **first** focusable element; it is invisible until focused and has a real
    visible box once focused; activating it puts focus on the drive controls and the **next** `Tab` lands on a real
    control; presses-to-first-visible-control drops **25 -> 1**; the itinerary still contains all 25 links and its
    text is unchanged; and nothing regresses at phone width.

</details>

<details>
<summary>Cycle 32's list (resolved — kept for context)</summary>

### CYCLE 32

All fifteen drive files have now been audited, so this Suggester pass hunted the **pattern** instead of a file. Five
separate cycles have found the same defect — a constant typed in one place that has to agree with a number kept
somewhere else, and quietly does not: the dash height (cycle 24), the camera lateral (13), the interior furniture
(24), the exit-sign window (30), the daylight anchor (31). Rather than wait to trip over the sixth, every module-level
numeric constant in `src/components/drive/` was enumerated and asked one question: *does this have to agree with
something it cannot see?* Three do.

- [x] **1. Close the three remaining copies of a number that lives somewhere else** — **DONE**
  - **A — `Sky.jsx:65` re-types the palette's quantisation.** `daylight.js` quantises progress into `STEPS = 360`
    before rebuilding colour strings; `Sky` independently writes `Math.round(progress * 360)` as its own repaint
    guard, and `STEPS` is **not exported**. They must match. The dangerous direction is real: make the palette *finer*
    (say 720) and `Sky` still repaints on 360 steps — the sky would visibly lag and band while the road, which reads
    the same palette every frame with no guard, keeps up.
  - **B — `RoadCanvas.jsx:23` types `MARKER_SPACING = 110`** under a comment that says *"Mile markers sit at half a
    leg"*, with a second comment at the draw site repeating *"half a leg apart"*. `LEG_LENGTH` is **220**. It is
    correct today by coincidence of arithmetic, and nothing keeps it correct.
  - **C — `useDrive.js:12` ends `GEAR_RATIOS` at `42`, which is `MAX_SPEED`.** The code's own fallback
    (`GEAR_RATIOS[sim.gear] ?? MAX_SPEED`) shows the top of the band is meant to *be* `MAX_SPEED`. Raise `MAX_SPEED`
    alone and top gear still caps at 42, so `inGear` exceeds 1 and the tachometer pegs early for the whole top gear.
  - **Files:** `src/components/drive/Sky.jsx`, `src/components/drive/daylight.js`,
    `src/components/drive/RoadCanvas.jsx`, `src/components/drive/useDrive.js`.
  - **Done when:** each of the three reads its value from the single place that owns it; **and the rendered output is
    provably unchanged**, because all three are no-ops at today's numbers — a canvas frame captured before and after
    must differ by **zero pixels** (the cycle-15 method), and the sky and gauge readings must measure identical.

</details>

<details>
<summary>Cycle 31's list (resolved — kept for context)</summary>

### CYCLE 31

Backlog dry, so a **Suggester** pass on `Sky.jsx` and `daylight.js` — the last two drive files never audited.

**Most of it holds up and that is worth recording.** The shared-palette design is safe (every caller reads it
immediately, nobody keeps the reference); the star field is deterministic so SSR and client match; the reduced-motion
CSS block already covers **all four** animations (`.star`, `.ignition`, `.blink`, `.shot`); and the arc genuinely
progresses — measured at six exits, the horizon runs `rgb(226,140,84)` golden at MILE 0 through `rgb(37,79,118)` blue
at EXIT 14 to `rgb(122,152,172)` pale at the destination, with stars 0 -> 0.85 and the moon 0.12 -> 0.91. One anchor is
in the wrong place.

- [x] **1. "Full night" lands between two exits instead of at the stop it names** — **DONE**
  - **Evidence:** the keyframe is written `at: 0.92, // full night — the toolbox`, and the module header promises
    *"full night by the toolbox"*. The toolbox is **EXIT 19**, whose progress is **19/20 = 0.95**. `0.92` is
    **exit 18.40** — mid-leg between two stops, where nobody ever parks.
  - **What that costs, measured at the toolbox:** by the time you arrive the palette is already **37.5% of the way
    into dawn** — `starOpacity` **0.850** against a peak of 1.0, moon **0.888**. The darkest, most night-like moment
    of the drive happens while you are moving between EXIT 18 and EXIT 19, and the stop that was designed to *be* full
    night is already brightening. Confirmed live: EXIT 14 measures a **higher** moon (0.908) than EXIT 19 (0.887).
  - **The shape, again:** a fraction typed by hand that has to agree with the route's geometry, and does not — the
    fifth instance this run (dash height, camera lateral, interior furniture, exit-sign window, now this).
  - **Files:** `src/components/drive/daylight.js`.
  - **Done when:** the full-night keyframe is **derived from the toolbox stop's own position** rather than typed, so it
    cannot drift if a role or a build is added; measured at EXIT 19 `starOpacity` is **1.0** and moon **1.0**; the
    destination still reads first light (0.6 / 0.7); MILE 0 is unchanged; the keyframes remain strictly ascending; and
    the other two anchors' comments are corrected to describe where they actually fall rather than implying a
    precision they do not have.

</details>

<details>
<summary>Cycle 30's list (resolved — kept for context)</summary>

### CYCLE 30

Backlog dry, so a **Suggester** pass on `ExitSign.jsx` — one of the three drive files never audited in this run, and
the roadside element the owner's priority (a) leans on hardest after the cockpit itself.

- [x] **1. The exit sign's approach is scaled to a road twice as long as the real one** — **DONE**
  - **Evidence (measured, then confirmed arithmetically):** driving a leg from EXIT 05, the sign's wrapper reported
    `opacity: 1` on the **very first sample after departure** and stayed there. The reason is in the constants:
    `VISIBLE_FROM = 420` while `LEG_LENGTH = 220` (`route.js:4`), so the sign's window is **1.91× the longest distance
    you can ever be from it.
    - opacity is `min(1, (420 — z) / 160)`, so at departure (`z = 220`) it is already **1.000**. The ramp would only
      finish at `z = 260`, which is **beyond the leg entirely** — the fade-in is dead code.
    - the retroreflective flare is `near = 1 — z/420`, so it starts at **0.227** instead of ~0 and only sweeps to
      0.967. The comment above it says that flare is *"most of why an approach reads as an approach rather than a
      sprite getting bigger"* — and a quarter of it is spent before you have moved.
  - **What a visitor sees:** the sign does not fade in on approach. It **pops into existence at full opacity** the
    instant you pull away from a stop, already partly lit.
  - **This is the same defect shape this run keeps finding** (guardrail 43's family): a number chosen independently of
    the geometry it has to agree with. `LEG_LENGTH` is exported and was simply not used here.
  - **Files:** `src/components/drive/ExitSign.jsx`.
  - **Done when:** the window is derived from `LEG_LENGTH` rather than a literal; measured on a real leg, opacity
    starts at **~0** at departure and reaches 1 partway along; the flare sweeps from **~0** to ~0.94 instead of
    starting at 0.227; the sign still hides while parked and while past the exit; scale still grows monotonically
    through the approach; and a deep link to a mid-route exit still shows nothing until you depart.

</details>

<details>
<summary>Cycle 29's list (resolved — kept for context)</summary>

### CYCLE 29

Backlog dry. Rather than a new feature surface, this pass re-exercised something **already shipped**: the
reduced-motion contract, last verified end to end in **cycle 11**. Eight cycles have changed the code underneath it
since — the paint loop (21), the dash layout (24, 25), the ignition splash (26), the route map (27) and the stop card
(28) — and guardrail 42 says every one of those mechanisms is an assertion until it is exercised.

- [x] **1. Re-verify the whole reduced-motion contract against the current build** — **DONE (no defect found)**
  - **Method:** `prefers-reduced-motion` cannot be toggled from here, so `matchMedia` is patched inside a sized
    same-origin iframe **before React mounts** — the patch is applied once the real document has committed but while
    `readyState` is still `loading`, confirmed by reporting the readyState at patch time.
  - **Done when:** all four mechanisms are observed under reduced motion **and** a control run with motion allowed
    shows each one behaving differently — otherwise a "pass" could just mean the harness did nothing.

</details>

<details>
<summary>Cycle 28's list (resolved — kept for context)</summary>

### CYCLE 28

Backlog dry, so a **Suggester** pass — this one an exhaustive sweep of **all 21 exits**, which had never been done:
only about seven had ever been opened individually across 27 cycles.

**The sweep itself came back clean** and that is worth recording: every stop renders its card, the counters run 1/21
through 21/21 correctly, all **28 screenshots across the 8 project stops load** (0 broken), links are present where the
content has them, the arrival announcer names the right exit every time, and there were **zero console errors or
warnings** across the whole route. What it did surface is a layout asymmetry.

- [x] **1. The stops with the most to say get the least room** — **DONE**
  - **Evidence (measured at 1440×900, panel band 1440×450):** a stop **with screenshots** widens to **925px**
    (`lg:w-[min(94vw,58rem)]`). A stop with **only text** stays at **704px** — and three of them overflow:
    | exit | stop | content | visible | hidden |
    |---|---|---|---|---|
    | 04 | Sabbatical / COVID / Family | 552px | 326px | **226px — 40.9%** |
    | 19 | Pit stop — the toolbox | 410px | 326px | 84px — 20.5% |
    | 10 | Senior MES DevOps Engineer | 384px | 326px | 58px — 15.1% |
    So the stop with *pictures* gets the room and the stop with *prose* does not, while **736px of the band sits
    unused** on either side. On a 1440×900 laptop two fifths of a role's detail is below a fold a recruiter may
    never scroll.
  - **Why widening alone is the wrong fix, and how that was established:** at 704px the paragraphs already run ~648px
    — about **100 characters** a line, past the comfortable range. Widening to 928px measured **exit 10 -> 0 hidden,
    exit 19 84 -> 44, exit 4 226 -> 106**, but pushes lines to ~135 characters. That trades a fold for a readability
    regression.
  - **What was measured instead:** widening **and** flowing the prose in two balanced columns — the same structural
    idea the project stops already use — gives **exit 10 58 -> 0**, **exit 19 84 -> 0**, **exit 4 226 -> 94**
    (40.9% -> 22.4%), *and* takes the paragraph measure to **412px, about 63 characters** — better than today on
    both axes. Horizontal overflow was checked in two separate implementations and measured **0** in both.
  - **Scope, deliberately narrow:** experience and toolbox stops only. Project stops already have a two-column
    media/prose layout, and the **destination is excluded** — its summary band and primary call to action were
    deliberately composed in cycles 14 and 23, it overflows by 0, and splitting it into columns would undo that work.
  - **Files:** `src/components/drive/StopCard.jsx`.
  - **Done when:** at 1440×900 exits 10 and 19 hide **0px** and exit 4's hidden share drops from 40.9% to about 22%;
    the paragraph measure narrows rather than widens; **no horizontal overflow at any viewport**; project stops and the
    destination are **unchanged**, measured; phones stay single-column below `lg`, measured; and a short experience
    stop (exit 02, three bullets) is checked in a screenshot so two columns do not read as broken when there is little
    to put in them.

</details>

<details>
<summary>Cycle 27's list (resolved — kept for context)</summary>

### CYCLE 27

Backlog dry, so a **Suggester** pass on the **route map** — the drive's primary navigation, built in cycle 10, focus-
verified in cycle 20, but never measured at phone size. Its layout turned out to be sound at 390×844 and 844×390
(panel inside the viewport, close and exit both visible, 56px rows, scrolls, no horizontal overflow). What it does on
*opening* is not.

- [x] **1. The route map opens without showing you where you are** — **DONE**
  - **Evidence (measured on the production build, `scrollTop` on open and the highlighted row's position):**
    | viewport | at exit | visible rows | current row | below the fold |
    |---|---|---|---|---|
    | 844×390 landscape | 13 | **3** of 21 | index 13 | **803px** |
    | 390×844 portrait | 13 | 11 of 21 | index 13 | **357px** |
    | 1440×900 desktop | 20 | 12 of 21 | index 20 | **791px** |
    `scrollTop` is **0** in every case, so the list always opens at MILE 0.
  - **Why it matters:** the map already highlights the current exit — that is its own statement that "where you are"
    is the useful thing — and then opens somewhere else. On a landscape phone, three rows of twenty-one are visible,
    so a visitor at EXIT 13 must scroll most of the list to find themselves before they can navigate relative to it.
  - **Files:** `src/components/drive/RouteMap.jsx`.
  - **Done when:** opening the map at any exit leaves the highlighted row **inside the scroll window** at 844×390,
    390×844 and 1440×900; MILE 0 still opens at `scrollTop` 0 (nothing to scroll to); the focus behaviour and the
    Escape path from cycles 10 and 20 are **unchanged**, re-verified rather than assumed; and the page itself never
    scrolls as a side effect.

</details>

<details>
<summary>Cycle 26's list (resolved — kept for context)</summary>

### CYCLE 26

Backlog dry, so a **Suggester** pass — on the **ignition splash**, which is the first thing every visitor sees and had
never been measured on a phone. Cycles 12, 23 and 25 checked the panel and the cockpit at phone sizes; the screen that
comes *before* both was never opened there.

- [x] **1. The ignition splash overflows on short landscape screens and pushes the way out off the bottom** — **DONE**
  - **Evidence (measured, splash content height vs viewport, with saved progress present):**
    | viewport | content | overflow (each side) | "back to the classic site" |
    |---|---|---|---|
    | 390×844 portrait | 522 in 844 | 0 | fully visible |
    | 844×390 landscape | **394 in 390** | 2px | bottom 2px clipped |
    | 667×375 landscape | **393 in 375** | 9px | 368—384, only ~7px of 17 visible |
    | 568×320 landscape | **468 in 320** | **74px** | 378—394 — **entirely below the viewport** |
    Without saved progress it fits at 844×390 (343px), so this is specifically the **returning visitor**, who gets two
    extra controls (`Resume` and `Forget my progress`).
  - **Why it is worse than a clipped link:** the splash is `z-50` and the scene's own "← exit" link is `z-40`, so while
    the splash is up that link is the *only* way out of drive mode — and `document.body` has `overflow: hidden`, so
    there is no scrolling to recover it. On a 568×320 screen the heading is cut off the top as well, because
    `justify-center` splits the overflow evenly.
  - **The fix has two halves, and needs both:** tightening alone cannot save 568×320 (148px short), so the splash must
    become **scrollable** as the safety net — and a flex container with `justify-center` clips the top when content
    overflows, so the centring has to move to an inner `m-auto` wrapper for scrolling to actually reach it. Then
    tighten below the height breakpoint so the *common* landscape phones (844×390, 667×375) need no scrolling at all.
  - **Files:** `src/components/drive/DriveScene.jsx`.
  - **Done when:** at **844×390 and 667×375 with saved progress** the whole splash fits with **0 overflow** and every
    control — including the way out — is fully inside the viewport; at **568×320** nothing is unreachable (content
    scrollable and the top of the splash reachable, not clipped away); **390×844 and 1440×900 are unchanged**,
    measured; and `Start engine` stays reachable everywhere it already was.

</details>

<details>
<summary>Cycle 25's list (resolved — kept for context)</summary>

### CYCLE 25

Backlog dry, so a **Suggester** pass. Cycle 24's landscape-phone screenshot showed the trip computer looking wrong;
this cycle went and measured it instead of leaving it as an impression.

- [x] **1. The trip computer overflows its own box on a landscape phone and paints over the controls** — **DONE**
  - **Evidence (measured at 844×390, EXIT 06):** the screen's box is **20px tall** (`clientHeight` 18) while its
    content needs **54px** — a **36px overflow**. Because `.screen` is `overflow: visible`, that content does not clip,
    it *paints outside the box*, over the control row beneath it. Row by row:
    - `~/route $ drive --to` / `ARRIVED` — 14px tall, the only row still inside the box
    - **`EXIT 06 · Co.Lab` — height 0**, below the box edge. The line that says which exit you are at is gone.
    - **progress bar — height 0**, below the box edge
    - `yr 2023` / `odo 0.8 mi` — 16px, entirely below the box
    All four rows report as clipped. At 390×844 (portrait) the same component overflows by **0** and nothing is
    clipped, so this is specific to short viewports.
  - **Where the 190px goes** (measured, so the fix is not guesswork): stack padding 18 + gaps 16 leaves **156**;
    cluster strip **74** (`shrink-0`, driven by a 62px gauge), trip computer **20** (`flex-1`, gets the remainder),
    control row **62** (driven by the 62px GO pedal). 74 + 62 + 54 = 190 against a 156 budget — it cannot fit as
    currently sized, which is why the flex children collapsed to zero instead.
  - **The approach:** take the shortfall from the three places that can afford it *on short viewports only*, and keep
    every element present rather than deleting the speedometer or the screen — the owner asked for a cockpit, and this
    is the viewport where it is most tempting and most wrong to gut it. Below a height breakpoint: a smaller gauge, a
    tighter stack, slightly shorter pedals (still far above the 24px floor), and the trip computer's shell-prompt row
    — pure chrome — stands down so the exit, the bar and the year survive.
  - **Files:** `src/components/drive/Dashboard.jsx`, `src/styles/drive.module.css`.
  - **Done when:** at 844×390 the trip computer's content overflow is **0** and no row is clipped — specifically the
    `EXIT 06 · Co.Lab` line and the progress bar have **non-zero height** and sit inside the box; every control stays
    **>= 24px**; the dash still totals its `--dash` height with nothing painting outside it; and **390×844 and
    1440×900 are unchanged**, measured, since the breakpoint must not leak upward.

</details>

<details>
<summary>Cycle 24's list (resolved — kept for context)</summary>

### CYCLE 24

Backlog dry, so a **Suggester** pass — this one on `CarInterior.jsx`, the one cockpit file no cycle in this run had
ever audited, and squarely the owner's priority (a).

- [x] **1. The car's own bonnet is swallowed by the dashboard on short viewports** — **DONE**
  - **The shape of it:** `CarInterior` pins the bonnet, the dash reflection and the wipers at **fixed percentages**
    (`bottom-[35.4%]`, `bottom-[36%]`, `bottom-[41%]`) while `Dashboard`'s height is **`clamp(190px,36%,48%)`**. They
    only agree while `36%` is the winning branch of that clamp. This is guardrail 43's exact failure mode — the same
    quantity written twice in different units — and it is the *third* copy: `DriveScene`'s panel container repeats the
    clamp literal too.
  - **Evidence (measured in sized iframes at EXIT 06):**
    | viewport | dash | bonnet visible | bonnet hidden | reflection hidden | wipers hidden |
    |---|---|---|---|---|---|
    | 1440×900 | 324px (36%) | 49 of 54px | 5px | 0 | 0 |
    | 1024×500 | 190px (38%) | 17 of 30px | 13px | 10px | 0 |
    | 844×390 | 190px (48.7%) | **0 of 23px** | 52px | 50px | 30px |
  - **Why it matters beyond tidiness:** the bonnet is the element that says *you are sitting in a car looking over its
    nose*. On a landscape phone it disappears completely, which is the one viewport where the cockpit is already
    tightest — so the car stops reading as a car exactly where it can least afford to.
  - **The fix guardrail 43 actually asks for:** express the dash height **once** — a `--dash` custom property on the
    scene root — and have all three consumers read it: `Dashboard`'s height, `DriveScene`'s panel offset, and
    `CarInterior`'s furniture via `calc()`. Chosen so that at the `36%` branch every offset resolves to exactly
    today's value, which makes the desktop rendering a regression test rather than a redesign.
  - **Files:** `src/components/drive/CarInterior.jsx`, `src/components/drive/Dashboard.jsx`,
    `src/components/drive/DriveScene.jsx`.
  - **Done when:** at 1440×900 the bonnet, reflection and wipers land on **the same pixels as before** (this must not
    restyle the desktop cockpit); at 1024×500 and 844×390 the bonnet is **visible above the dash** rather than behind
    it; the panel/dash overlap stays **0** at every viewport tested in cycles 12/19/23; and the `clamp(190px,36%,48%)`
    literal appears **once** in the codebase.

</details>

<details>
<summary>Cycle 23's list (resolved — kept for context)</summary>

### CYCLE 23

Backlog dry, so a **Suggester** pass — this one aimed at the owner's priority (b), the destination panel, on a
**phone**. Guardrail 4 has demanded a 390×844 check of that panel since the first cycle and it had never actually been
run there; cycle 12 measured phone *overlap* but never opened the destination. Two faults, both measured in a sized
same-origin iframe at 390×844.

- [x] **1. The destination's call to action is sliced in half on a phone** — **DONE**
  - **Evidence:** at EXIT 20, the panel's scroll area is `clientHeight` **316** against `scrollHeight` **328** — **12px
    hidden**, and those 12px cut straight through the last row of actions. A screenshot shows *"Download résumé"* and
    *"Back to the classic site"* severed through the middle of their text. It scrolls, so nothing is unreachable, but
    the final frame of the whole drive — the conversion moment, after twenty-one exits — reads as broken.
  - **Where the space went:** the destination is the only stop carrying `TripSummary`, and on a 316px-wide scroller
    its `sm:grid-cols-4` collapses to **two 143px columns**, so the four figures stack 2×2 and the block costs
    **112px** of height.
  - **Files:** `src/components/drive/StopCard.jsx`.
  - **Done when:** at 390×844 the destination panel's `scrollHeight` is **<= `clientHeight`** (nothing clipped at all),
    every action is fully visible without scrolling, a screenshot confirms the summary still reads clearly, and the
    desktop rendering of the summary is unchanged.
- [x] **2. The phone control row wraps and strands the audio toggle on its own line** — **DONE**
  - **Evidence:** measured at 390px, the cockpit's control cluster lays out on **four different top offsets**:
    Back / Next / Map together at y=769, then the audio toggle **alone** at y=806 in the bottom-left corner, with
    BRAKE and GO off to the right. The cluster's buttons total 235px plus 18px of gaps = **253px** against **242px**
    of available width — it overflows by ~11px and wraps.
  - **Files:** `src/components/drive/Dashboard.jsx`.
  - **Done when:** at **390px and 360px** the four controls sit on a single row (one shared top offset), nothing
    overflows the dash or the viewport, the pedals are unmoved, and **no visible label text changes** (guardrail 22 —
    every `aria-label` must still contain the word a voice-control user can see).

</details>

<details>
<summary>Cycle 22's list (resolved — kept for context)</summary>

### CYCLE 22

Backlog dry (S15 blocked, S13b closed), so a **Suggester** pass — aimed back at the owner's priority (c), the project
screenshots, which no cycle has re-examined since it was built in cycle 1. The carousel itself is in good shape: the
captures show whole (browser-chrome frame, `object-contain`, 2:1), they cross-fade on their own, they pause on hover
and focus, and reduced motion holds frame 1. Two things around it are measurably wrong.

- [x] **1. Every screenshot is announced, not just the visible one** — **DONE**
  - **Evidence (measured at EXIT 13, 4 captures):** all four `<img>` elements are in the DOM at once, stacked, with
    only the current one at `opacity: 1`. `opacity: 0` does **not** remove an element from the accessibility tree, so
    all four carry live `alt` text — *"Co.Lab Portfolio App — screenshot 1 of 4"*, *"...2 of 4"*, *"...3 of 4"*,
    *"...4 of 4"*. A screen-reader user hears four screenshots where a sighted user sees one.
  - **Files:** `src/components/drive/ProjectShots.jsx`.
  - **Done when:** exactly **one** image is exposed to assistive tech at a time, it is the visible one, and the
    exposure follows the cross-fade as it cycles.
- [x] **2. The carousel dots are 6×6px targets** — **DONE**
  - **Evidence (measured):** each inactive dot's hit box is **6×6 CSS px** (the active one is 20×6). WCAG 2.2 SC 2.5.8
    asks for 24×24. This carousel appears inside the arrival panel on a phone, where a 6px target is the difference
    between "you can browse the screenshots" and "you cannot".
  - **The constraint that makes it interesting:** the dots are deliberately small *visually* — that is the design, and
    growing the pill would change the panel. The hit area has to grow without the visible dot changing at all.
  - **Files:** `src/components/drive/ProjectShots.jsx`.
  - **Done when:** every dot's hit box is at least 24×24 CSS px, the **visible** pill is unchanged in size and
    position, and neighbouring hit boxes do not overlap (an enlarged target that swallows its neighbour's clicks is a
    worse bug than a small one).

</details>

<details>
<summary>Cycle 21's list (resolved — kept for context)</summary>

### CYCLE 21

Backlog mined: **S16a** became actionable when cycle 20 proved the window is foregrounded and `requestAnimationFrame`
genuinely runs. It has been sitting since cycle 16 precisely because it could not be measured, and guardrail 9 forbids
shipping an unmeasurable optimisation into a paint loop. It can be measured now.

- [x] **1. Skip the canvas repaint while the picture cannot have changed (S16a)** — **DONE**
  - **Why:** parked at a stop, `RoadCanvas.draw()` runs on every animation frame and produces the same image. On a
    page someone leaves open while reading an exit, that is continuous CPU and battery for a still picture.
  - **What `draw()` actually depends on — read, not assumed** (`RoadCanvas.jsx`): `sim.travel` (directly, and via
    `paletteAt`, `buildPoints`, `drawRoadside`, `roadsideAt`) and `sim.x` (only through `cameraX(sim)` inside
    `buildPoints` and `project`), plus `camera`, which only `resize()` changes. A grep for `sim.` in the file returns
    `sim.travel` alone; `sim.x` enters solely through `cameraX`. No `Math.random`, no clock. The image is therefore a
    pure function of `(travel, x, camera)`.
  - **The subtlety that decides the design:** while parked, `useDrive.step()` still runs its steering block, so
    `sim.x` decays asymptotically toward 0 and never becomes exactly equal frame to frame. An equality check would
    therefore never skip anything. The check compares against the **last drawn** values with a **1e-4 m** tolerance
    (0.034px at the nearest projected point, where the scale is ~335 px/m) — against the last *drawn* values, not the
    last frame, so slow continuous motion accumulates and still triggers a redraw instead of freezing.
  - **`resize()` must bypass it.** Setting `canvas.width` clears the backing store, so the identical-state check would
    otherwise leave a blank canvas after a resize. It sets the dirty flag before drawing.
  - **How the win is measured (this is the whole reason it was parked):** shadow `clearRect` on the road canvas's own
    2D context with a counter — `draw()` calls it exactly once per paint — and count paints over a fixed wall-clock
    window, before and after, on the production build.
  - **Files:** `src/components/drive/RoadCanvas.jsx`.
  - **Done when:** parked and settled, paints per 5s drop from roughly one-per-frame to **0**; while driving the paint
    count is unchanged; a dispatched `resize` still repaints; and a captured frame at a fixed exit is **pixel-identical**
    before and after, because this must not change what is drawn. If the measurement shows no real reduction, it is
    **not shipped** — guardrail 9 stands.

</details>

<details>
<summary>Cycle 20's list (resolved — kept for context)</summary>

### CYCLE 20

**The Awaiting-scenario condition has arrived.** Probed at the start of this cycle: `document.hidden` is **false**,
`document.visibilityState` is `visible`, `document.hasFocus()` is **true**, `requestAnimationFrame` actually runs
(28 callbacks in 1013ms on the homepage), and programmatic `.focus()` now sticks (`document.activeElement` is the
element). Every one of those was the stated blocker for the three parked **Needs testing** items. So this cycle is a
Reviewer sweep to clear them rather than a Suggester pass — they have been waiting since cycles 3, 9 and 10.

- [x] **1. Frame rate while driving, on the production build** — **DONE** *(parked since cycle 3/6)*
  - **Why:** the roadside furniture, the daylight cycle and the per-frame canvas work were all shipped without ever
    measuring the frame budget, because rAF is paused in a hidden tab and the measurement timed out at 45s twice.
  - **Method:** load `/drive` on the production build, put the car under autopilot, sample ~240 frames of real rAF
    deltas, and report median and 5th-percentile fps — plus the same sample taken while parked, so the *cost of
    driving* is separable from the cost of the machine.
  - **Done when:** a real distribution is recorded, compared against a same-method baseline, with a verdict.
- [x] **2. Focus returns to its trigger when the route map closes** — **DONE** *(parked since cycle 10)*
  - **Why:** `RouteMap`'s cleanup restores `returnFocusRef`, and that path runs, but it could never be observed —
    `.focus()` did not stick without OS window focus, so `<body>` was captured and restored.
  - **Method:** focus the "Route map" button for real, open the dialog, confirm focus moved into the panel, close it
    with Escape, and read `document.activeElement` back.
  - **Done when:** focus is observed on the trigger after close — or a real defect is found and fixed this cycle.
- [x] **3. Engine audio actually sounds and tracks the revs** — **DONE** *(parked since cycle 9)*
  - **Why:** everything structural was verified, but audible output never was: a scripted click grants no user
    activation, so the `AudioContext` never reached `running`.
  - **Method:** click the toggle with a **real dispatched input event** (CDP-level, which Chrome treats as a trusted
    gesture) rather than `element.click()`. Then read the context's own state and its live `AudioParam` values under
    throttle — audibility itself cannot be heard from here, but "the context is `running` and its oscillator
    frequency rises with the tachometer" is observable and is the actual claim.
  - **Done when:** either the context reaches `running` and its parameters track the sim, or it does not and the
    reason is recorded from observation rather than assumed.

</details>

<details>
<summary>Cycle 19's list (resolved — kept for context)</summary>

### CYCLE 19

No Suggester pass: the controller found actionable work already open. Cycle 18 shipped the re-centred cockpit but
could only verify it at one viewport, and an unverified layout change is exactly what guardrail 51 exists to catch.

- [x] **1. Clear the cycle-18 Needs-testing item: the re-centred dash at narrow widths** — **DONE**
  - **Why:** the dash was rebuilt as a three-column grid so the steering wheel sits on the driver's eyeline. That was
    measured at 1920x895 and nowhere else. `resize_window` reported success last shift but `innerWidth` stayed 1920,
    so no narrower viewport was ever actually rendered. The `lg`—`xl` band (0.42fr door column) and the phone block were
    reasoned about arithmetically only.
  - **The technique that does not depend on the OS window:** load `/drive` in a **same-origin iframe** of an explicit
    size. An iframe is its own viewport — CSS media queries and `vw` units resolve against the frame, not the host
    window — and because it is same-origin, `contentDocument` can be measured exactly like the top-level page. This
    makes 1100x800, 390x844 and 844x390 all reachable from a window that will not resize.
  - **Files:** `src/components/drive/Dashboard.jsx`, `src/styles/drive.module.css` (only if a defect is found).
  - **Done when:** at **1100x800** the wheel is on or near the eyeline and the trip computer and console buttons are
    not squeezed or overflowing; at **390x844** and **844x390** the phone cockpit is unchanged from before cycle 18
    (it uses the untouched `lg:hidden` block) with no panel/dash overlap and no horizontal scroll; and each result is
    a measurement, not an impression. If a defect is found it is fixed in this cycle, not re-parked.

</details>

<details>
<summary>Cycle 18's list (resolved — kept for context)</summary>

### CYCLE 18

Backlog dry. This Suggester pass deliberately went back to the **owner's own priority (a)** — *"the car interior dash
needs work … think of what a car should look like from driving perspective"* — rather than to more peripheral polish,
and looked at the rendered cockpit against the geometry the road is actually drawn with.

- [x] **1. The cockpit and the windshield disagree about where the driver is sitting** — **DONE**
  - **Evidence (both halves measured, nothing inferred):**
    - *Where the eye is.* Ran `world.js` under Node and projected the road centre at increasing distance:
      `z=10 -> x=759`, `z=100 -> x=945`, `z=20000 -> x=960.14`, `z=1e6 -> x=960.00`, against a screen centre of
      **960**. The vanishing point converges **exactly on the screen centre** — it must, because `project()` puts the
      principal point at `width / 2` and the lateral offset is divided by `z`. The camera *is* the driver's eye, so
      the driver's eyeline is at 50% of the viewport.
    - *Where the cockpit says the driver is.* Measured in the browser at 1920px: the steering wheel's `<svg>` is
      centred at **x=615 (32.0%)**, the binnacle gauges at 27–32%, while the rear-view mirror sits at **960 (50.0%)**
      and the glass, pillars and headliner are symmetric about 960.
    - So the wheel is **345px — 18% of the viewport — to the left of the driver's own eyeline.** You are sitting in
      the passenger seat looking across at the steering wheel.
  - **The comment that hid it.** `world.js:19-27` justifies the framing by asserting *"the road's vanishing point
    falls slightly left of screen centre, which is exactly where it belongs when you are sitting to the right of the
    road's centreline."* The Node probe above shows that is **false**: what falls left of centre is the road's *near*
    field (−201px at 10m), which is correct and is what makes the centre line run down the left. The vanishing point
    does not move. That false sentence is the stated reason the cockpit was framed the way it is — exactly the class
    of defect cycle 15 was about, and it is load-bearing here.
  - **What "from the driver's seat" actually looks like:** the wheel is directly in front of your eyes, so it is
    horizontally **centred** in your field of view, and the console sits to its right. Everything else in the cockpit
    is already symmetric about the eyeline; only the steering column contradicts it.
  - **Files:** `src/components/drive/world.js` (correct the false comment — no maths change),
    `src/components/drive/Dashboard.jsx`, and `src/styles/drive.module.css` if the layout needs it.
  - **Done when:** the steering wheel's measured centre sits on the viewport centre (within a few px) at desktop
    width; the binnacle sits behind it; the trip computer and controls sit clear of it with no overlap; `world.js`'s
    comment states what the probe actually shows; and nothing regresses at 390×844 (portrait phone) or 844×390
    (landscape phone), where cycle 12's overlap bug lived.

</details>

<details>
<summary>Cycle 17's list (resolved — kept for context)</summary>

### CYCLE 17

Backlog dry again (S15 blocked, S16a waiting on a foreground window, S13b closed). A **Suggester** pass aimed at what
the page *tells* a visitor who is not looking at the canvas — the tab, the history entry, and what a screen reader
hears — since the whole drive is a canvas and those channels are all that is left.

- [x] **1. The tab never says where you are, and the route announcer repeats itself** — **DONE**
  - **Evidence (measured on the production build):** drove from EXIT 13 to EXIT 14. `location.href` changed
    `?exit=13` -> `?exit=14`; `document.title` was `"Hyun-Tae Jin | Drive mode"` **before and after**. Twenty-one
    exits share one tab title, one bookmark name and one history entry.
  - **The part that makes it worse, also measured:** the only `[aria-live]` element left on the page while driving is
    Next's own route announcer, and it is `aria-live="assertive"`. `router.replace(..., {shallow:true})` fires on every
    departure, so a screen-reader user is interrupted with the identical string *"Hyun-Tae Jin | Drive mode"* on every
    one of the twenty legs — and is never told which exit it is.
  - **Why one change fixes both:** the announcer reads `document.title`. Give the title the exit and the same
    interruption becomes the useful sentence it was always trying to be.
  - **Files:** `src/components/drive/DriveScene.jsx` (a `next/head` title; the page-level `<title>` in `drive.jsx`
    stays as the SSR/crawler title and must not be weakened).
  - **Done when:** parked at EXIT 14 the tab reads the exit and its title; the SSR HTML still carries the original
    `<title>` for crawlers; and the title changes as you move between exits.
- [x] **2. The arrival panel claims to announce itself and cannot** — **DONE**
  - **Evidence (measured):** `StopCard`'s root carries `aria-live="polite"`, but it lives inside `AnimatePresence`
    keyed by `stop.id`. Captured the live node before an exit change and after: **different nodes** (`sameNode:false`),
    and for the whole drive between exits there is **no polite region on the page at all**. A live region has to be
    present *before* its content changes; one created together with its content is the documented unreliable case.
    So the attribute reads as an accessibility feature while announcing nothing.
  - **Files:** `src/components/drive/DriveScene.jsx` (a permanently mounted `role="status"` region), and
    `src/components/drive/StopCard.jsx` (drop the attribute that cannot work).
  - **Done when:** the region's DOM node is **identical** before and after an arrival while its text changes to name
    the exit; no `aria-live` remains on a node that remounts; and MILE 0 does not claim you "arrived" there.

</details>

<details>
<summary>Cycle 16's list (resolved — kept for context)</summary>

### CYCLE 16

Backlog dry. A **Suggester** pass aimed at the seams *between* features — where two things this run built separately
might disagree — rather than at new surface.

- [x] **1. Resuming makes the route map contradict itself** — **DONE** *(new, cycle 16 — a seam from cycle 8)*
  - **Why:** the app offers *"Resume · EXIT 13"*, and one click later the route map says you have never driven exits
    01-12. Those are the same visitor's own steps: progress only advances **on arrival** and only **forwards**
    (`progress.js`), so a stored index of 13 is proof they arrived at every exit before it.
  - **Evidence (measured):** seeded progress at EXIT 13, loaded plain `/drive`, took the offered resume, opened the
    map. Exactly **2 of 21** rows were marked "driven" — `MILE 0` and `EXIT 13`. `useDrive.js:56` starts
    `visited` as `new Set([0])` and only ever adds on `arriveAt`.
  - **The distinction that matters:** this applies to **resume only**. A `?exit=11` deep link must *not* mark 01-11 as
    driven — that visitor arrived by following a link, not by driving. Restoring history for one and not the other is
    the whole point.
  - **Files:** `src/components/drive/useDrive.js`, `src/components/drive/DriveScene.jsx`.
  - **Done when:** resuming to EXIT 13 marks MILE 0 through EXIT 13 as driven, a deep link to the same exit marks only
    that one, and a fresh first visit still marks only MILE 0.
- [x] **2. Record the idle-repaint finding without building it** — **DONE** *(new, cycle 16)*
  - **Found this cycle:** while parked at a stop the canvas still repaints every animation frame, producing a
    provably identical image — since traffic was removed (cycle 13) `draw()` is a pure function of `travel`, `x` and
    the camera, all of which are constant while parked. That is continuous CPU and battery burn for a static picture,
    on a page someone may leave open while reading.
  - **Why it is being recorded rather than built:** the fix is a cheap dirty-check in `RoadCanvas`, but its *benefit*
    (frames actually skipped) cannot be measured here — `requestAnimationFrame` is suspended in this backgrounded tab,
    and the only way to force a repaint is a resize, which must legitimately bypass any such check because setting
    `canvas.width` clears the backing store. Shipping an optimisation whose win cannot be observed, into a hot path,
    is how guardrail 9 gets broken quietly. It goes to the Backlog with this reasoning attached.

</details>

<details>
<summary>Cycle 15's list (resolved — kept for context)</summary>

### CYCLE 15

Backlog dry (S15 blocked, S13b closed by the owner). The owner's cycle-13 steer was explicitly *against* unnecessary
additions, so this **Suggester** pass looked for the opposite: duplication and code that lies about itself.

- [ ] **1. `world.project()` is dead, and its documentation is false** *(new, cycle 15)*
  - **Why it matters:** the module doc for `world.js` states *"Everything on screen — tarmac, poles, exit signs — is
    placed with `project()` so the canvas and the DOM overlays always agree."* **Nothing calls `project()`.** Three
    places hand-roll the same projection independently, so a future change to `CAM_HEIGHT`, the horizon or the curve
    model must be made in three files in lockstep. This run has already been bitten by exactly this pattern **twice**:
    the dash height written twice (cycle 12, 71px overlap) and the camera lateral written four times (cycle 13, the
    owner's lane complaint). A comment that claims a single source of truth which does not exist is worse than no
    comment.
  - **Evidence:** `grep` for `project(` across `src/components/drive/` outside `world.js` returns **nothing**. The three
    implementations are `RoadCanvas.buildPoints`, `RoadCanvas.place`, and `ExitSign.paint`, and all three are
    algebraically identical to `project(camera, sim, z, x, y)`.
  - **Decision — not a blind DRY sweep.** `buildPoints` runs 131 times a frame against **pre-allocated** point objects
    and hoists `curveAt(sim.travel)`/`hillAt(sim.travel)` out of its loop. Routing it through `project()` would add 131
    allocations *and* 131 redundant trig pairs per frame, regressing guardrail 9 to satisfy tidiness. So: adopt
    `project()` where it is free (`ExitSign`, once per frame) and allocation-neutral (`place`, which already returns a
    fresh object), and leave `buildPoints` inlined **with a comment saying why**, so the remaining duplication is
    deliberate and documented rather than accidental. Fix the module doc to describe what is actually true.
  - **Files:** `src/components/drive/world.js`, `src/components/drive/RoadCanvas.jsx`, `src/components/drive/ExitSign.jsx`.
  - **Done when:** the rendering is **pixel-identical** — this is a pure refactor, so anything else is a bug — and the
    exit sign's projected position is unchanged.

</details>

<details>
<summary>Cycle 14's list (resolved — kept for context)</summary>

### CYCLE 14

Backlog is dry (S15 blocked, S13b closed by the owner), so a **Suggester** pass. It started by re-checking cycle 13's
own change for regressions, then re-read the owner's original priority **(b) "the destination-arrival panel needs
work"** — and looked at the *destination* stop specifically, which no cycle had ever examined on its own.

- [ ] **0. Regression check on cycle 13** *(done during the Suggester pass)*
  - Cycle 13 changed camera lateral maths in four places, and `ExitSign` is a DOM overlay positioned independently of
    the canvas — the obvious thing to break. **Checked at EXIT 07: no regression** — the sign's twin posts meet the
    ground at the roadside and the lane markings read correctly (yellow centre line left, white edge line right, car
    between them). The first-run flow was exercised end to end too: Start engine -> hold accelerator -> depart ->
    arrive at EXIT 01 with the panel open. No defect.
- [ ] **1. Give the destination the weight of an arrival** (priority (b))
  - **Why:** the destination is the conversion moment — a recruiter who has driven 21 exits to reach it — but it is
    shaped exactly like every other stop.
  - **Evidence (observed at `?exit=20`):** all four actions render identically, so **"Email hytjin@gmail.com" carries
    the same visual weight as "Back to the classic site"** — the goal and the exit door are indistinguishable, and the
    eye has nothing to land on. Nothing about the panel marks the end of a journey.
  - **Design:** a primary action (email) that actually looks primary; "back to the classic site" demoted to a quiet
    exit rather than a peer of the contact actions; and a short summary of the trip just driven.
  - **Hard constraint (guardrail 13):** every number in that summary must be **derived from the real content** —
    counts of roles and builds, the first dated year, the route's own length. Nothing typed in, nothing estimated. The
    owner's existing prose is **not** to be rewritten; the summary sits alongside it.
  - **Files:** `src/components/drive/route.js`, `src/components/drive/StopCard.jsx`.
  - **Done when:** the destination shows a derived trip summary whose numbers match the content, the email action is
    visually primary and the classic-site link is not, and no other stop's appearance changes.

</details>

<details>
<summary>Cycle 13's list (owner feedback — resolved; see Done C13-1/C13-2)</summary>

*(cycle 12's list is fully resolved — see Done. The Planner fills this for cycle 13.)*

</details>

<details>
<summary>Cycle 12's list (resolved — kept for context)</summary>

### CYCLE 12

Another **Suggester** pass (backlog still held). It checked two things nobody had: focus visibility, and **landscape
phone** — a viewport a driving interface is unusually likely to meet, and one that had never been measured.

- [ ] **1. The arrival panel is hidden behind the cockpit on short viewports** *(new, cycle 12)*
  - **Why:** on a landscape phone the panel — the thing that carries every word of the résumé — runs 71px *underneath*
    the dashboard, so its bottom is simply not visible.
  - **Evidence (measured at 840x386, and it survives the guardrail-36 transform check):** the panel container computes
    to `y 54 → 247` while the dash starts at `y 176`. Neutralising the frozen entry transform leaves the settled panel
    at exactly the same box, so this is layout, not animation.
  - **Root cause, confirmed arithmetically:** `Dashboard` is `h-[36%] min-h-[210px]`; `DriveScene`'s panel container is
    `bottom-[36%]`. On a 386px-tall viewport 36% is 139px, so the dash's **min-height wins at 210px** while the panel
    still reserves only 139px. 210 − 139 = **71px**, exactly the overlap measured. The two express the same quantity in
    two places and disagree whenever the floor engages.
  - **Fix:** express the dash height once, as a value that already accounts for the floor, and have both the dash and
    the panel container use it — so they cannot drift apart.
  - **Files:** `src/components/drive/Dashboard.jsx`, `src/components/drive/DriveScene.jsx`.
  - **Done when:** at 840x386 the panel's settled bottom is at or above the dash's top, and nothing regresses at
    1920x950 or 390x844.
- [ ] **2. Cockpit eats more than half the screen in landscape** *(new, cycle 12 — guardrail 3)*
  - **Why:** guardrail 3 requires the drivable glass to stay >= ~50% of viewport height. Measured at 840x386 the dash
    is **54.4%**, leaving only **45.6%** of glass — you can barely see the road on a landscape phone.
  - **Done when:** either the glass share is brought back to >= 50% *without* making the cockpit controls unusable, or
    — if the controls genuinely cannot fit — the trade-off is measured and recorded rather than silently accepted.
- [ ] **3. Focus visibility** *(new, cycle 12 — investigated, closed)*
  - Checked because drive mode defines no focus styles of its own. Every control computed `outline-style: none`, but
    that reading came from **programmatic** `.focus()`, which does not match `:focus-visible` — so it proves nothing.
    A grep across `tailwind.css`, `base.css`, `components.css`, `utilities.css` and all drive components found **no
    author rule removing outlines**, so the browser default ring applies for real keyboard focus. **No defect; no
    change made.**

</details>

<details>
<summary>Cycle 11's list (resolved — kept for context)</summary>

### CYCLE 11

Backlog dry again (S15 blocked, S13b held), so another **Suggester** pass. It turned up a regression this run itself
introduced — the kind worth catching before a human ever sees it.

- [ ] **1. Oncoming traffic ignores `prefers-reduced-motion`** *(new, cycle 11 — a regression from cycle 7)*
  - **Why:** drive mode already honours the preference everywhere else, deliberately and consistently:
    `useDrive.js:227,244` makes the throttle **jump** to the next exit instead of animating travel;
    `ProjectShots.jsx:41` disables carousel autoplay; `StopCard.jsx:151,157` swaps the projecting entry for a plain
    fade; and `drive.module.css:329` kills the star twinkle, the ignition pulse and the blink. The traffic added in
    cycle 7 respects none of it — it advances from `performance.now()` deltas, entirely independent of `sim.travel`,
    so a visitor who has asked their system for less motion still gets headlights sliding toward them **even while
    parked at a stop**.
  - **Evidence:** `grep -c reducedMotion src/components/drive/RoadCanvas.jsx` returns **0** — the canvas has no
    awareness of the preference at all.
  - **Decision:** under reduced motion, **do not draw the traffic**, rather than freezing it. Frozen cars would read as
    vehicles abandoned in the live carriageway; absent traffic simply restores the empty road the page had before
    cycle 7, which is a coherent state.
  - **Files:** `src/components/drive/RoadCanvas.jsx`, `src/components/drive/DriveScene.jsx` (pass the flag through).
  - **Done when:** with `prefers-reduced-motion: reduce` the canvas draws no oncoming vehicles, and with it off they
    behave exactly as before — both proven by pixel comparison, not by reading the code.
- [ ] **2. Verify the whole reduced-motion contract end to end** *(new, cycle 11)*
  - **Why:** four separate mechanisms claim to honour the preference and no cycle has ever exercised them together.
    Cycle 2 tested the carousel alone; the rest are unverified assertions.
  - **Done when:** with `matchMedia('(prefers-reduced-motion: reduce)')` patched to match before hydration, each of
    these is checked against a production build: traffic absent, carousel not autoplaying, throttle jumping rather
    than animating travel, and the arrival panel using the plain-fade variant.

</details>

<details>
<summary>Cycle 10's list (resolved — kept for context)</summary>

### CYCLE 10

The backlog was dry (S15 blocked, S13b deliberately held), so this cycle ran a **Suggester** pass over two surfaces
never examined in nine cycles: `RouteMap.jsx`, and — because it bears directly on the user's stated priority (c) — the
**classic site's** project cards.

- [ ] **1. The route map claims to be a modal but never takes focus** *(new, cycle 10 — in scope)*
  - **Why:** `RouteMap` renders `role="dialog" aria-modal="true"`, which tells assistive technology that everything
    behind it is inert. Nothing enforces that: focus is never moved into the dialog, never trapped, and never returned
    to the trigger on close. A keyboard user presses "Route map" and is left tabbing through the cockpit *behind* an
    overlay they cannot see past; a screen-reader user is told a modal opened while their focus sits outside it.
  - **Evidence (measured):** with the map open, the dialog contains **23** tabbable elements, yet
    `dialog.contains(document.activeElement)` is **false** — focus stayed on `<body>`.
  - **Files:** `src/components/drive/RouteMap.jsx`.
  - **Done when:** opening the map moves focus into it, Tab and Shift+Tab cycle within it, Escape still closes it (the
    existing global handler must keep working), and closing returns focus to the button that opened it — each verified
    by reading `document.activeElement` rather than assumed.
- [ ] **2. The classic site still crops project photos and never cycles them** *(new, cycle 10 — OUT of scope → Needs human)*
  - **Why this matters most:** this is the user's own priority (c) — *"the projects sections the photos just get cut
    off and then the cycling through photos should just happen automatically with smooth fade transition"*. It was
    fixed in **drive mode** in cycle 1, but the **main portfolio page** has the same two faults, so they may well
    believe it is already solved everywhere.
  - **Evidence (computed from the real files, not estimated):** `src/components/Projects.jsx:97` puts the image in an
    `aspect-video` (16:9 = 1.778) box and `:120` renders it `object-cover`. **All 28 screenshots** on disk are wider
    than that — `object-cover` therefore crops an average of **10.1%** of each image's width, worst case **14.2%**.
    And `grep` for `setInterval|setTimeout|useEffect` in that file returns **nothing**: cycling only happens via
    `handleScreenshotClick`, so a visitor who never clicks the picture never sees screenshots 2..n.
  - **Scope constraint:** the write scope is `src/components/drive/**`, `src/styles/drive.module.css`,
    `src/pages/drive.jsx`. `src/components/Projects.jsx` is outside it, and the working tree already carries the
    user's own uncommitted edits nearby.
  - **Done when:** the defect is proven and an exact patch is written out under **Needs human**, not applied.

</details>

<details>
<summary>Cycle 9's list (resolved — kept for context)</summary>

### CYCLE 9

- [ ] **1. Phone-width regression sweep of the three stated priorities** *(new, cycle 9)*
  - **Why:** the phone cockpit was last verified in **cycle 1**. Since then the daylight system, traffic, mile markers,
    the aria pass and the resume UI have all landed, and the resume buttons were only ever seen at desktop width.
    Nobody had re-checked the user's three actual priorities on a phone in seven cycles.
  - **Done when:** cockpit, arrival panel, screenshot carousel and the new ignition resume UI are each measured at
    390x844 against a production build, with any real defect either fixed or recorded.
- [ ] **2. Opt-in engine audio** (backlog S5 — the last actionable item)
  - **Why:** the last idea in the backlog, and the only sense the drive doesn't engage. An engine that responds to the
    throttle is the difference between watching a road and driving one.
  - **Design (decided):** **off by default and never persisted.** The `AudioContext` is created lazily *inside the
    toggle's click handler*, so it can only ever exist as the result of a deliberate user gesture — that is both the
    browser's autoplay requirement and the right default for a résumé page someone may open in an open-plan office.
    The preference is deliberately **not** stored: a persisted "on" would try to start audio on the next visit before
    any gesture, which is exactly what must never happen.
  - **Files:** new `src/components/drive/engineAudio.js`, `src/components/drive/Dashboard.jsx` (toggle on the console).
  - **Done when:** no `AudioContext` exists before the toggle is pressed; pressing it creates a running context whose
    oscillator frequency tracks `sim.rpm`; pressing it again silences and suspends; the gain is driven from
    `drive.subscribe` via `AudioParam`, never React state per frame; and everything is torn down on unmount.

</details>

<details>
<summary>Cycle 8's list (resolved — kept for context)</summary>

### CYCLE 8

- [ ] **1. Remember where a visitor got to, and offer to resume** (backlog S8)
  - **Why:** the route is 21 exits long. Anyone who reads a few, closes the tab and comes back is dropped at MILE 0 with
    no way back to where they were except driving the whole thing again. That is the single most likely reason someone
    abandons this page on a second visit.
  - **Design (decided, and the reset affordance is the point):** progress is remembered, but it is **never applied
    automatically**. On the ignition screen, a returning visitor sees their furthest exit offered next to *Start
    engine* — "Resume — EXIT 07 · 3FGolf" — plus a way to clear it. Nobody can be trapped mid-route by state they did
    not ask for, and a fresh start is always one click away.
  - **Precedence:** an explicit `?exit=` deep link **always wins** over stored progress. Someone following a shared
    link asked for that exit specifically.
  - **Files:** `src/components/drive/DriveScene.jsx`, new `src/components/drive/progress.js` (in scope).
  - **Done when:** driving to an exit and reloading shows the resume option for that exit; clicking it lands there with
    the engine running; clearing it returns the ignition screen to its first-visit state; `?exit=` overrides a stored
    position; and a cold load has **no hydration warning** (guardrail 28).
- [ ] **2. Verify against a production build** (guardrail 23)
  - **Done when:** `npm run build` passes, the page is served with `npm run start`, hydration is confirmed via
    `document.body.style.overflow === 'hidden'`, and the resume/clear/override paths are each exercised in the browser
    with `localStorage` inspected directly.

</details>

<details>
<summary>Cycle 7's list (resolved — kept for context)</summary>

### CYCLE 7

Pixels can be verified again, so the two canvas ideas that were held through cycles 3-6 are finally buildable. Both are
about the same complaint: **the road is completely empty.** Nothing else is ever on it, and between exits there is no
sense of progress.

- [ ] **1. Put other traffic on the road** (backlog S13, the traffic half)
  - **Why:** twenty-one exits of a totally deserted highway reads as a treadmill. A few cars passing the other way is
    the cheapest thing that makes a road feel like a road — and it gives the long legs something to watch.
  - **Evidence it is currently empty:** `RoadCanvas.drawRoadside` draws lamps and delineator posts and nothing else;
    there is no vehicle of any kind in the scene.
  - **Design:** headlights on the **opposite** carriageway only, closing at their own speed plus yours, so they still
    pass while you are parked. Deterministic — no `Math.random` — and they take their colour from the route palette so
    they belong to the current light.
  - **Files:** `src/components/drive/RoadCanvas.jsx`.
  - **Done when:** cars visibly approach and pass on the far side at several points on the route, they never appear on
    your carriageway or collide with the exit signs, and the paint loop still allocates nothing new per frame beyond
    the gradients the lamps already create (guardrail 9).
- [ ] **2. Mile markers between exits** (backlog S9b)
  - **Why:** completes the signage story started in cycle 2 and gives the 220m legs a sense of progress between exits.
  - **Files:** `src/components/drive/RoadCanvas.jsx`.
  - **Done when:** small markers appear between exits, sparse enough not to add noise to the delineator line
    (which is already every 24m), and visually distinct from it.
- [ ] **3. Verify against a production build** (guardrail 23)
  - **Done when:** `npm run build` passes, the page is served with `npm run start`, hydration is confirmed via
    `document.body.style.overflow === 'hidden'`, and both changes are seen in screenshots at more than one point on
    the route.

</details>

<details>
<summary>Cycle 6's list (a verification cycle — no tasks were planned; see Done C6-1..C6-3)</summary>

*(cycle 5's list is fully resolved — see Done / Needs human.)*

</details>

<details>
<summary>Cycle 5's list (resolved — kept for context)</summary>

### CYCLE 5

Chrome is still unreachable (re-checked: `curl` serves the page, the browser lands on `chrome-error://chromewebdata/`),
and **the backlog ran dry of browser-free work** — everything left in it needs pixels (S9b, S13), a browser to verify
(S5, S8), or is blocked behind the Needs-human canonical fix (S15). So this cycle ran a fresh **Suggester** pass over
what can still be examined: the served HTML. That surfaced three defects, all measured rather than guessed.

- [ ] **1. Make the cockpit read properly to assistive technology** *(new, cycle 5 — in scope, SSR-verifiable)*
  - **Why:** drive mode is a canvas and an instrument panel, so the only usable non-visual version of it is the
    `sr-only` itinerary plus the `aria-live` arrival panel. But the decorative instruments are also in the
    accessibility tree, and none of the controls have accessible names — so a screen-reader user gets a stream of
    meaningless numerals *and* unlabelled buttons.
  - **Evidence (measured from the served HTML):**
    - **0 of 11 `<button>` elements carry an `aria-label`.** They announce as their symbol text: `◂ Back`,
      `Next ▸`, `BRAKE↓ / S`, `GO↑ / W` — i.e. "left-pointing small triangle Back", "BRAKE down-arrow slash S".
    - The trip-computer screen renders as `<div class="flex h-full flex-col justify-between drive_screen__geG90">`
      with **no** `aria-hidden`; the gauge faces render as `<svg viewBox="0 0 100 100" class="h-full w-full">` with
      none either; the gear selector's `P` span has none. So `x1000`, `0`, `mph`, `P R N D`, `gear`,
      `~/route $ drive --to`, `yr 2016`, `odo 0.0 mi` are all announced — duplicating, badly, what the itinerary
      already says properly.
  - **Files:** `src/components/drive/Dashboard.jsx` (in scope).
  - **Done when:** every control has a real accessible name while its visible text is unchanged, the decorative
    instruments are out of the accessibility tree, and both facts are proven by reading the served HTML back.
- [ ] **2. Fix the duplicate `<h1>` on `/drive`** *(new, cycle 5 — in scope)*
  - **Why:** two `<h1>` elements compete to describe the page, which muddles the document outline for assistive tech
    and for crawlers.
  - **Evidence:** the served HTML contains `<h1>Drive mode — the résumé of Hyun-Tae Jin as a road trip</h1>` (the
    `sr-only` itinerary, which is the real content) **and** `<h1>The résumé, from the driver's seat</h1>` (the ignition
    overlay, which is a transient splash).
  - **Files:** `src/components/drive/DriveScene.jsx` (in scope).
  - **Done when:** exactly one `<h1>` is served, the itinerary keeps it, and the ignition splash sits below it in the
    outline.
- [ ] **3. `/drive` is missing from the sitemap** *(new, cycle 5 — OUT of scope, park as Needs human)*
  - **Why:** `public/sitemap.xml` lists only `https://htae.dev/`. Combined with the canonical defect already parked
    from cycle 4 — which tells crawlers `/drive` duplicates the homepage — drive mode is effectively invisible to
    search: not linked from the sitemap, and disowned by its own canonical.
  - **Evidence:** `curl http://127.0.0.1:3007/sitemap.xml` returns a single `<url>` entry for the site root;
    `public/robots.txt` points at that sitemap.
  - **Scope constraint:** the write scope covers `public/images/` only, not `public/sitemap.xml`.
  - **Done when:** the gap is proven and an exact patch is written out under **Needs human**, not applied.

</details>

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

- **C38.1 — The driving keys are inert while the route map is open** *(cycle 38, commit `e06709b`)* — the dialog
  declares `aria-modal="true"`, which `RouteMap`'s own cycle-10 comment describes as a promise that everything behind
  it is inert. It was not: `DriveScene`'s global `keydown` effect never checked `mapOpen`, and `mapOpen` was not in its
  dependency array. **Measured at EXIT 05:** with the map open, `ArrowUp` pulled the car out of the stop — `parked`
  **true -> false**, title **"EXIT 05 · Full Stack Devel..." -> "EXIT 06 · Software Enginee..."** — while the dialog
  stayed up, so the drive happened invisibly behind it. Arrow keys being the obvious way to scroll a twenty-one row
  list made the natural gesture the destructive one. **Verified:** with the map open all nine driving keys leave the
  car parked, the title unchanged and the map open, and **none is `preventDefault`ed** so the list still scrolls
  (guardrail 130); **Escape closes and `M` toggles** (guardrail 129); with the map **closed** `ArrowUp` drives exactly
  as before (guardrail 132); and holding the accelerator then opening the map drops the speed **22 -> 15 mph over six
  seconds**, proving the throttle is released rather than latched (guardrail 131), with a further press reaching
  **52 mph** so it is fully recoverable.
  **One measurement recorded because it happened:** a single early run reported Escape failing to close the map. Two
  later runs — isolated, and the same combined key sequence at two timings — all closed correctly, so that first
  result was a flake rather than a defect.
- **C38.2 — The missing `key` props block four improvements, not one** *(cycle 38 — finding, recorded not built)* —
  `/drive` inherits its entire social surface from `_app.jsx`: `og:image` and `twitter:image` are the **portrait
  avatar** and `twitter:card` is **`summary`**, the small square card. Giving the drive page its own card, adding the
  route-specific structured data of backlog **S15**, and fixing the duplicate canonical all require `key` props in
  `_app.jsx` — without them a second tag is *added* rather than overriding, which is exactly the state `/drive` is in
  (two `og:url`, two `og:title`, two canonicals). So the parked Needs-human item is not a tidy-up but the single
  blocker in front of four separate improvements. Not shipped, because a tag that cannot take effect is the defect
  cycles 30 and 36 each fixed.

- **C37.0 — Every year on the page matches the content** *(cycle 37 — verification only, no code changed)* — the
  highest-stakes property here, and never checked systematically before. Read the dates straight out of
  `src/content/education.js` and `experience.js`, then measured both places a year is shown.
  **The cockpit readout, all eleven dated positions:** MILE 0 **2016**, EXIT 01 **2016**, 02 **2017**, 03 **2019**,
  04 **2020**, 05/06/07 **2023**, 08 **2024**, 09 **2024**, 10 **NOW**. Every one matches its content date — including
  **EXIT 08, dated `2024-01-01`**, the January 1st entry that cycle 4's timezone bug had moved to 2023. Still correct.
  **The crawlable `sr-only` copy:** 21 articles for 21 stops; **10 dated**, each carrying the right year with
  `<time datetime>` matching its visible text in every case; **11 undated** (MILE 0, all eight builds, the toolbox and
  the destination) carrying **no `<time>` at all** — nothing invents a year, which is what guardrails 13 and 19 exist
  to protect.
  **One nuance, correct rather than contradictory:** the current role shows **2025** in the crawlable copy and **NOW**
  in the cockpit. The itinerary states the fact; the cockpit states the present. Both are right.

- **C36.0 — Resizing the window mid-drive is handled** *(cycle 36 — verification only)* — every layout check in this
  run had loaded at a fixed size. Departed EXIT 05, resized **1440×900 -> 900×650 while under way**, then waited for a
  real arrival: the sim kept running and arrived, the canvas backing store followed **2880×1800 -> 1800×1300**, the
  dash re-laid out to 234px (36% of the new height), the arrival panel appeared at 704×220 **fully inside the
  viewport**, panel/dash overlap **0**, no horizontal scroll.
- **C36.1 — The exit sign reads one unit, and it is imperial** *(cycle 36, commit `faf5a43`)* — sampled across an
  approach, the readout ran `0.14 MI -> 0.13 -> 0.12 -> 0.11 -> 0.10 MI -> **159 M** -> 154 M -> 146 M`: two units in one
  readout, the second **metric**, on an American guide sign in a cockpit whose speedometer reads **mph** and odometer
  reads **MI**. It also disagreed with the sign the owner already wrote — `DriveModeSign.jsx:20` reads **"1/4 mile"**.
  Now feet throughout. The fraction ladder was deliberately **not** added (guardrail 128): a leg is 220m = 0.137 miles
  and the sign is only visible between 220m and 7m, so "1/4 MILE" could never execute — shipping a dead branch is the
  exact defect cycle 30 fixed. Feet derive from `METERS_PER_MILE` × 5280, not a typed 3.28084 (guardrail 127).
  **Verified across two approaches:** series **720 FT -> 110 FT**, monotonic, **single unit `FT` throughout**, no `M`
  or `MI` in any sampled reading; 720 FT at departure matches 220m through the derivation; and cycle 30's curves came
  back unchanged (guardrail 125) — hidden while parked, opacity starting **0.002** and reaching full, flare starting
  **0.000**, scale still monotonic. The sign hides below ~23 FT by design, so the final stretch is arithmetic
  (`z=7m -> 20 FT`) rather than sampled.

- **C34.0 — Every control does have a focus indicator** *(cycle 34 — closes a question open since cycle 12)* — cycle
  12 dismissed a "no focus indicator anywhere" alarm as an artefact of programmatic focus but could not prove it.
  With real keyboard focus available (cycle 33), fourteen genuine `Tab` presses were recorded on a focused document:
  **all fourteen** report `outline: auto 1px` with `:focus-visible` **true**, and **none** has its outline suppressed.
  Closed as correct.
- **C34.1 — Focus is now locatable while tabbing the hidden résumé** *(cycle 34, commit `ed61397`)* — of those
  fourteen stops, **13 were off-screen** — every itinerary link, carrying a focus ring painted on content clipped to
  nothing. **The usual reveal was proven impossible rather than assumed:** `focus:not-sr-only` works on an element
  that is *itself* `sr-only` (which is why the skip link appears at 171×22), but not on a **descendant** of an
  `sr-only` container. Tested — a focused itinerary link forced to `position: fixed; clip: auto` at (16, 64) keeps a
  correct **85×38** layout box while `document.elementFromPoint` at its own centre returns the **canvas**. A fixed
  descendant does not escape `clip: rect(0,0,0,0)`. Unclipping on `focus-within` would drop the whole résumé over the
  scene, and re-hiding that block differently would restructure the only machine-readable copy on a hunch (guardrail
  121). So the fix reports *where focus is* from outside the clip: an `aria-hidden` chip naming the focused link,
  deliberately not a live region (guardrail 122). **Verified with real keys:** chip reads *"Résumé outline: GitHub"* at
  **183×34** (12,12) with a screenshot confirming it on screen; tracks to *"Coding Temple certificate"* two presses
  later; **disappears** when focus reaches a control; itinerary still **25** links; skip link still first; and the chip
  is **absent** on a plain load, after mouse clicking, and on the phone layout (guardrail 123).

- **C33.0 — The per-frame subscriber set does not leak** *(cycle 33 — verification only)* — `drive` is a `useMemo`
  whose identity changes on **every arrival**, so every consumer's effect tears down and re-subscribes across a drive;
  one missing cleanup would grow the fan-out silently and cost more every frame for the rest of the session. Measured
  by recording the size of the Set being `forEach`-ed each frame: **13 subscribers at MILE 0 and exactly 13 after
  twelve stop changes**, covering project stops, the toolbox and the destination, with a single canvas and a single
  status region throughout.
- **C33.1 — A keyboard user reaches the cockpit in one press instead of twenty-five** *(cycle 33, commit `de9a7da`)*
  — the `sr-only` itinerary carries a link for every stop: measured, **25 of the 38** focusable elements on the page.
  Its container is `position: absolute; clip: rect(0px, 0px, 0px, 0px)` — hidden visually but **not** from the tab
  order — so `Tab` from the top spent **25 presses** on links whose layout boxes (up to 195×19.5) are clipped to
  nothing, meaning the focus ring was painted on clipped-away content and focus was **nowhere**, before reaching a
  control anyone could see. Removing them from the tab order would have fixed the sighted keyboard user by robbing the
  screen-reader one (guardrail 115), so a skip link was added instead. **Verified with real key presses on a genuinely
  focused document:** `Tab` -> *"Skip to the drive controls"*, `clip: auto`, box **171×22** at (12,12) from 34×18
  clipped to nothing, `:focus-visible` matching (guardrail 116); `Enter` -> focus on `#drive-controls` (guardrail 117);
  `Tab` -> *"Back to the previous exit"* inside the target, 78×31, visible; the skip link clips itself away again.
  **Presses to the first visible control: 25 -> 1.** The itinerary still carries all **25** links with unchanged text
  (guardrail 118), and the target exists with `tabindex="-1"` and six controls inside it at 390×844, 844×390 and
  1440×900 (guardrail 119).

- **C32.1 — The last three copies of a number that lives elsewhere** *(cycle 32, commit `57cd6cc`)* — with every
  drive file audited, this pass hunted the **pattern**: every module-level numeric constant in
  `src/components/drive/` was enumerated and asked whether it has to agree with something it cannot see. Three did.
  **(A)** `Sky.jsx` typed its own `360` as a repaint guard while `daylight.js` holds `STEPS = 360` and did not export
  it — make the palette finer and the sky keeps repainting on the old step, lagging and banding while the road,
  which reads the same palette every frame with no guard, keeps up. **(B)** `RoadCanvas` typed `MARKER_SPACING = 110`
  under a comment promising half a leg, against `LEG_LENGTH = 220` — right by arithmetic coincidence, with nothing
  keeping it right. **(C)** `useDrive` ended `GEAR_RATIOS` at a literal `42` beside `MAX_SPEED = 42`, and its own
  `?? MAX_SPEED` fallback shows the top of the band is meant to *be* `MAX_SPEED`; raise `MAX_SPEED` alone and top gear
  still caps at 42, so `inGear` runs past 1 and the tachometer pegs for the whole of top gear.
  **All three are no-ops at today's numbers, so the requirement was that nothing change — measured, not assumed
  (guardrail 111):** EXIT 09 and EXIT 16 each **0 of 4,096,000 pixels different**, max channel delta **0**; sky
  gradient, star, moon and skyline readings **byte-identical** at both; gauge count unchanged; speed climbs 0 -> 81 mph
  under autopilot and stays under the 94 mph maximum. No value changed — only where it comes from. The now
  unreachable `?? MAX_SPEED` was left in place on purpose (guardrail 114).

- **C31.0 — `Sky.jsx` and `daylight.js` audited; most of it holds** *(cycle 31)* — the last two never-audited drive
  files. The shared-palette design is safe (every caller reads it immediately; nobody keeps the reference), the star
  field is deterministic so SSR and client agree, the reduced-motion CSS block already covers **all four** animations
  (`.star`, `.ignition`, `.blink`, `.shot`), and the arc genuinely progresses — measured across six exits, horizon
  `rgb(226,140,84)` golden at MILE 0 through `rgb(37,79,118)` at EXIT 14 to `rgb(122,152,172)` at the destination.
- **C31.1 — Full night now happens at the toolbox** *(cycle 31, commit `f6c267f`)* — the keyframe read
  `at: 0.92, // full night — the toolbox` and the module header promises *"full night by the toolbox"*, but the
  toolbox is EXIT 19 of 20 = **0.95**. `0.92` is **exit 18.40**, mid-leg. Measured, the toolbox was already **37.5% of
  the way into dawn** — `starOpacity` **0.850** against a peak of 1.0, moon **0.888** — so the darkest moment of the
  drive fell between EXIT 18 and EXIT 19 and the stop designed to *be* full night was brightening. It showed up in the
  numbers: EXIT 14 measured a **higher** moon (0.908) than EXIT 19 (0.887). The anchor is now **derived from the
  toolbox stop's own position** (guardrail 107 — only the keyframe that names a real stop was derived; the other two
  name ranges and keep their fractions with corrected comments), with a literal fallback if the content ever loses
  that stop (guardrail 108) and an ascending-order guard, since `paletteAt` walks the list assuming order and would
  have failed silently (guardrail 106). **Verified:** EXIT 19 star **0.850 -> 1.000**, moon **0.888 -> 1.000**, horizon
  `rgb(20, 64, 95)` — the authored full-night palette; EXIT 18 0.967/0.982, a monotonic approach; **destination
  unchanged** at 0.6/0.7 and `rgb(122,152,172)` (guardrail 110); MILE 0 and exits 05/10/14 unchanged; a cold deep link
  to EXIT 19 lands on peak night; **zero console messages**. No colour was retuned (guardrail 109) — this changed
  *when* full night happens, not what it looks like.

- **C30.1 — The exit sign's approach is scaled to the real leg** *(cycle 30, commit `f299914`)* — `ExitSign` used a
  literal `VISIBLE_FROM = 420` against `LEG_LENGTH = 220` (`route.js:4`), a window **1.91× the furthest you can ever be
  from the sign. Measured on a real leg from EXIT 05, the wrapper reported `opacity: 1` on the **very first sample
  after departure** and never moved: `min(1, (420 - z) / 160)` is already **1.000** at z = 220 and would only have
  finished at z = 260, beyond the leg entirely — the fade-in was dead code, and the sign popped into existence at
  full opacity the instant you pulled away. The retroreflective flare was pre-charged for the same reason:
  `near = 1 - z/420` starts at **0.227**, so a quarter of the sweep the code calls *"most of why an approach reads as
  an approach"* was spent before the car had moved. Both now derive from `LEG_LENGTH` (guardrail 101 — derived, not
  retuned), so neither can drift again if the route spacing changes. **Verified driving a real leg:** parked -> hidden
  at opacity 0; first visible sample **0.004** (was 1.000); ramp **0.004 -> 0.42 -> full at 4.8s of a ~9.9s leg**, so
  it is solid long before the stop (guardrail 102); flare **starts 0.000** (was 0.227) and sweeps to 0.46 (guardrail
  103); **scale still monotonic** through the approach and the transform untouched (guardrail 104); hidden again past
  the exit (guardrail 105).

- **C29.1 — The reduced-motion contract still holds, eight cycles on** *(cycle 29 — verification only, no code
  changed)* — last exercised in cycle 11; the paint loop, dash, ignition splash, route map and stop card have all
  been rebuilt since. `matchMedia` was patched inside a same-origin iframe **before hydration** (applied at
  `readyState: "loading"`, verified by reporting the readyState at patch time), and every mechanism was observed
  against a **control run with motion allowed**, so a pass cannot mean the harness simply did nothing:
  | mechanism | reduced motion ON | control, motion allowed |
  |---|---|---|
  | project carousel | held frame 0 for **9s**, 4 dots still present | cycled frames **0 -> 1 -> 2** in 11s |
  | arrival panel transition | `transform: none` in **all 26 samples**, opacity animated 0->1 | **15** non-identity samples, e.g. `matrix3d(0.993956, ...)` |
  | Next -> arrival | **102ms** — teleported | **9,887ms** — drove the leg |
  | idle canvas repaints | **0** in 9s | (cycle 21 covers this) |
  **New interaction checked, because it did not exist in cycle 11:** cycle 21's dirty-check and the reduced-motion
  teleport compose correctly — the jump repainted the canvas exactly **2 times** and then **0** more once settled,
  so the road is redrawn for the teleport without going back to painting an idle frame every tick. URL, document title
  and the arrival announcer all updated on the teleport (`?exit=13 -> 14`).
  **No defect found, and nothing was changed** — recorded as a result rather than a non-event: it is the first
  evidence that eight cycles of layout and paint work left the accessibility contract intact.

- **C28.0 — All 21 exits swept, and they are clean** *(cycle 28)* — the first exhaustive pass of the route; about
  seven stops had ever been opened individually across 27 cycles. Every stop renders its card, counters run **1/21
  through 21/21**, all **28 screenshots across the 8 project stops load (0 broken)**, links are present where the
  content has them, the arrival announcer names the right exit every time, and there were **zero console errors or
  warnings** for the whole route. Recorded as a result, not a non-event: it is the first evidence that the content
  layer is sound end to end.
- **C28.1 — The text-only stops get the room the picture stops already had** *(cycle 28, commit `6dcdd2e`)* — at
  1440×900 a stop **with screenshots** widened to 925px while a stop with **only text** stayed at 704px, and three
  overflowed: EXIT 04 **40.9% hidden**, EXIT 19 20.5%, EXIT 10 15.1% — with **736px of the band unused** either side.
  The stop with pictures got the room; the stop with prose did not. **Widening alone was measured and rejected:** it
  fixes the fold but takes lines from ~100 to ~135 characters. Widening **and** flowing the prose in two balanced
  columns fixes the fold *and* brings the measure to ~63 characters. **Verified:** EXIT 04 **226 -> 94px hidden**
  (40.9% -> 22.4%) with the paragraph measure **648 -> 412px**; EXIT 19 **84 -> 0**; EXIT 10 **58 -> 0**; the
  destination untouched at 704px/0 (guardrail 96) and project stops untouched at 928px/0 (guardrail 97); **no
  horizontal overflow anywhere** (guardrail 99); phones stay single column, computed `column-count: auto` at 390×844
  and 844×390 versus `2` only at `lg` (guardrail 98); and EXIT 02, a three-bullet stop, reads as two deliberate
  columns in a screenshot (guardrail 100).
  **The first build was worse than the trial, and the sweep caught it:** `break-inside-avoid` on *every direct child*
  stops the big blocks — the whole bullet list, the toolbox grid — from splitting at all, so the columns cannot
  balance and the content gets **taller**. The toolbox went **84 -> 261px hidden** and the senior role **58 -> 154**.
  Scoped to list items only, it matches the trial exactly.

- **C27.1 — The route map opens at the exit you are at** *(cycle 27, commit `89803a6`)* — the map highlights the
  current exit and then opened at MILE 0 every time. Measured, `scrollTop` on open was **0** and the highlighted row
  was below the fold at every viewport: 844×390 at exit 13, **3 of 21 rows visible, 803px below**; 390×844,
  357px below; 1440×900 at exit 20, 791px below. The scroller's own `scrollTop` is now set — not `scrollIntoView`,
  which walks up the tree (guardrail 92) — instantly rather than smoothly, so it needs no reduced-motion branch
  (guardrail 93), and without touching focus (guardrail 91). **Verified across seven cases** (exits 1, 6, 13, 20 at
  three viewports): the highlighted row is inside the scroll window every time, **MILE 0 still opens at `scrollTop` 0**
  (guardrail 95), and exit 20 on a landscape phone clamps to the maximum rather than overscrolling. **Cycle 10/20
  behaviour re-verified, not assumed** (guardrail 94): focus lands on the panel and **not** on a row, Escape still
  closes the map, focus returns to the trigger, and document scroll stays 0 throughout.
  **A wrong first attempt, caught by verification:** it used `offsetTop`, but the scroll container is not positioned,
  so a row's `offsetParent` is the dialog backdrop — `offsetTop` was 111px out and scrolled the current row clean
  *past the top* of the window. Two checks disagreeing (in-view by one measure, above-window by another) exposed it;
  the calculation is now a `getBoundingClientRect` delta, which is origin-independent.

- **C26.1 — The ignition splash fits, and keeps the way out on screen** *(cycle 26, commit `d2d0484`)* — the first
  screen every visitor sees had never been measured on a phone. **With saved progress present** — a returning visitor,
  who gets two extra controls — it overflowed short landscape viewports: 844×390 **394 in 390** (exit link 2px clipped),
  667×375 **393 in 375** (~7px of a 17px link visible), 568×320 **468 in 320** with the exit link **entirely below the
  viewport** and the heading cut off the top. That link is not cosmetic: the splash is `z-50` over the scene's own
  `z-40` exit link, so while it is up that is the **only** way out of drive mode, and `body` has `overflow: hidden`
  so nothing can be scrolled back. **Two halves, both required:** tightening alone cannot save 568×320 (148px short),
  so the splash is now scrollable — and because a centred flex child that overflows cannot be scrolled back to, the
  centring moved from `justify-center` to `m-auto` on an inner wrapper (guardrail 86; without that the heading would
  have been *unreachable* rather than merely clipped). Below 430px of height it also tightens. **Verified with
  progress seeded every time (guardrail 90):** 844×390 **394 -> 300**, no scrolling needed, nothing offscreen;
  667×375 **393 -> 300**, same; 568×320 overflow **74px -> scrollable by 12px**, nothing offscreen, first element at
  y=16 so the top is reachable; **390×844 control positions 365/423/503/667 — identical to before** (guardrail 88);
  1440×900 centred at y=253, exactly where `justify-center` put it.

- **C25.1 — The trip computer fits its box on a landscape phone** *(cycle 25, commit `e9cfe30`)* — at 844×390 the
  terminal's box was **20px** tall against **54px** of content, and because `.screen` is `overflow: visible` it did not
  clip — it painted **outside the box, over the control row**. Measured row by row: the shell prompt was the only
  row still inside; **`EXIT 06 · Co.Lab` had height 0**; **the progress bar had height 0**; the `yr`/`odo` row sat
  entirely below the box. The line telling you which exit you are at was gone. **Where the 190px went** (measured, not
  assumed): padding 18 + gaps 16 left **156**, cluster strip took **74** (62px gauge, `shrink-0`), controls **62**
  (62px GO pedal), leaving **20** for a component needing 54. The shortfall now comes from the three places that can
  afford it, **on short viewports only**: a 44px gauge, tighter stack gaps and terminal padding, shorter pedals, and
  the shell-prompt row — pure chrome — stands down. Nothing is deleted; the cockpit keeps its instrument (guardrail
  84). **Verified:** 844×390 overflow **36 -> 0**, no row clipped, screen box **20 -> 68px**, exit line **0 -> 17px**,
  bar **0 -> 6px** (guardrail 83), budget **74/20/62 -> 52/68/48**, screen fully inside the dash, smallest control
  **25px** and pedals 38/43px (guardrail 85), nothing below the viewport, panel/dash overlap **0**; and **390×844 and
  1440×900 are byte-identical to before** — same screen box, same four row heights (guardrail 81).

- **C24.1 — The bonnet stays in front of the driver on short screens** *(cycle 24, commit `bf95af8`)* —
  `CarInterior` pinned the bonnet, dash reflection and wipers at fixed percentages while `Dashboard`'s height is
  `clamp(190px,36%,48%)`. They agree only while `36%` is the winning branch: below ~528px of height the 190px floor
  wins, the dash grows, and the furniture stays put **behind** it. Guardrail 43's exact shape, and the *third* copy of
  the literal — `DriveScene`'s panel offset repeated it too. **Measured before:** 1440×900 bonnet 49 of 54px visible;
  1024×500 **17 of 30** with 10px of reflection hidden; **844×390 bonnet 0 of 23px** — gone entirely — with 50px of
  reflection and 30px of wipers hidden too. The dash height is now `--dash` on the scene root, read by the dash, the
  panel's bottom edge and the interior furniture, with offsets that resolve to exactly the old values at the `36%`
  branch. **Verified:** 1440×900 bonnet box `{t:527, b:581, h:54}` **identical before and after** (guardrail 76);
  1024×500 **17 -> 27 of 30px**, reflection hidden **10 -> 0**; 844×390 **0 -> 24 of 26px**, reflection **50 -> 0**,
  wipers **30 -> 0**; 390×844 45 of 50px; panel/dash overlap **0** at all four; computed `bottom` values are real
  pixels, so the `calc()` arbitrary values produced rules rather than being silently dropped (guardrail 78); and the
  `clamp(190px,36%,48%)` literal now appears **once** in the codebase (guardrail 80).

- **C23.1 — The destination's call to action is no longer sliced on a phone** *(cycle 23, commit `06f6e26`)* —
  guardrail 4 has asked for a 390×844 check of the arrival panel since cycle 1, and the **destination** had never been
  opened there. Measured: scroll area `clientHeight` **316** against `scrollHeight` **328** — 12px hidden, cutting
  straight through *"Download résumé"* and *"Back to the classic site"*. The space had gone to `TripSummary`, whose
  `sm:grid-cols-4` collapsed to two 143px columns on a phone and stacked the figures 2×2 for **112px**. It now runs
  four across at every width (**65px**), labels wrapping rather than abbreviated (guardrail 72 — the figures are
  derived and stay accurate), with panel padding and the links' margin tightened below `sm` only.
  **Verified:** 390×844 nothing clipped (was 12px), all four actions visible; 360×800 nothing clipped (was 19px);
  **desktop 1440×900 unchanged** — 4×148.5px columns, `mt` 16px, `py` 12px, 10px labels at 1.8px tracking, 20px
  values, panel padding 20/28, all identical to before (guardrail 73). Screenshot confirms the summary reads clearly.
  **Known limit, measured not assumed:** at 375×667 the destination still overflows by 38px and scrolls. Fitting it
  there would mean cutting real content, and scrolling is exactly what guardrail 4 asks for.
- **C23.2 — The phone control row no longer strands the audio toggle** *(cycle 23, commit `06f6e26`)* — measured at
  390px, the cockpit's controls sat on **four different top offsets**, with the audio toggle alone in the bottom-left
  corner: the cluster totalled **253px** against **242px** available and wrapped. The room was taken from padding, gaps
  and letter-spacing **below `sm` only**. **Verified:** a single row at both **390px and 360px**, smallest control
  25px (above the 24px floor from cycle 22), no visible label changed (guardrail 22/74), pedals unmoved, no horizontal
  scroll.

- **C22.1 — Only the screenshot you can see is announced** *(cycle 22, commit `2f62f6d`)* — the carousel stacks
  every capture and cross-fades with `opacity`, which does **not** remove an element from the accessibility tree. At
  EXIT 13 all **four** images carried live `alt` text, so a screen-reader user met *"screenshot 1 of 4"* through
  *"4 of 4"* where a sighted user sees one picture. Inactive frames are now `aria-hidden`. **Verified:** exactly one
  image exposed, and it is the one at `opacity: 1` (guardrail 67 — the count alone would not have proved this), and
  still true after the carousel advanced, 3 of 4 -> 4 of 4 (guardrail 68).
- **C22.2 — The carousel dots are hittable** *(cycle 22, commit `2f62f6d`)* — each dot was a **6×6 CSS px** target
  (20×6 when active) against the WCAG 2.5.8 minimum of 24×24 — and this carousel sits inside the arrival panel on a
  phone. Each is now a 24×24 box with the same pill centred inside. **Verified:** every target 24×24, neighbour
  overlap **0px**, pill sizes unchanged at 6×6 and 20×6, and a screenshot confirms the row still reads as designed.
  **Guardrail 69 was amended mid-build rather than quietly broken:** as written it required the visible dots not to
  move, which is unsatisfiable — 6px dots 6px apart put centres 12px apart, failing both the 24×24 rule *and* its
  spacing exception, so compliance needs more room by definition. The amendment and its reasoning are recorded on the
  guardrail itself.

- **C21.1 — The road stops repainting when the picture cannot have changed (S16a)** *(cycle 21, commit `574ff15`)*
  — parked at a stop, `draw()` was running every animation frame and producing the same image: **130 full repaints in
  130 frames over 5s**, into a **3840×1790** backing store. `draw()` reads `sim.travel`, `sim.x` (only through
  `cameraX`) and `camera`, and nothing else, so it now skips when none of them has moved. The comparison is against
  the last *painted* state rather than the previous frame (guardrail 63), with a **1e-4 m** tolerance rather than
  equality, because the parked steering drift decays asymptotically and never repeats a value — ~0.03px at the
  nearest projected point. `resize()` forces a paint, since `canvas.width` wipes the backing store (guardrail 64).
  **Measured on the production build:** parked and settled **130/130 -> 0 paints / 140 frames**; driving **136 paints /
  132 frames (unchanged)**; a dispatched resize **1 repaint**; steering while parked **53 paints, then 0 once
  settled** — so it is skipping idle work, not freezing motion. **And it changes nothing on screen:** a frame captured
  at EXIT 06 before and after differs by **0 of 4,096,000 pixels**, max channel delta **0** (guardrail 65).
  Parked since cycle 16 under guardrail 9 because the win could not be measured in a backgrounded tab.

- **C20.1 — Frame rate while driving, finally measured** *(cycle 20; clears the item parked since cycle 3/6)* — on
  the production build, three independent alternating samples of 120 real rAF deltas each. **Driving under autopilot:
  median 29.9 / 30.0 / 29.9 fps.** **Parked at a stop: 21.8 / 17.1 / 21.8 fps.** Driving is *faster and far steadier*
  than idling, which identifies the ceiling as the environment, not the code: an empty rAF loop on the static homepage
  in the same session returned **28 fps**, so this renderer is capped near 30 and coalesces frames when the page has
  nothing to schedule. **Verdict: the drive loop keeps up with everything this environment will give it** — it is not
  the limiting factor. This is explicitly *not* a claim of 60fps on the owner's machine; it is a claim that driving
  costs no measurable frames relative to sitting still (guardrail 57).
- **C20.2 — Focus returns to the route-map trigger** *(cycle 20; clears the item parked since cycle 10)* — observed
  end to end now that `.focus()` sticks: focus on the "Route map" button -> open -> `document.activeElement` is the
  dialog panel and `dialog.contains(activeElement)` is true -> **Escape** closes it (guardrail 61: the global key path
  still works) -> `document.activeElement === trigger` is **true**. The `aria-modal` promise is kept.
- **C20.3 — The engine really sounds, and really tracks the revs** *(cycle 20; clears the item parked since cycle 9)*
  — the eleven-cycle blocker was that `element.click()` grants no user activation. Clicked the toggle with a **real
  dispatched input event** instead: `navigator.userActivation.hasBeenActive` **true**, `AudioContext.state`
  **`running`**, master gain ramped to **0.09** (the `enable()` target — audible, not muted), and the toggle's own
  label/`aria-pressed` flipped honestly. Then, with the graph captured by patching the context's factory methods
  before a client-side remount, the sim was driven and the **AudioParams read directly**:
  | | low osc | high osc | lowpass | tyre noise |
  |---|---|---|---|---|
  | parked idle | 43.83 Hz | 87.67 Hz | 691.9 Hz | 0 |
  | accelerating | 65.37 Hz | 130.74 Hz | 1112.8 Hz | 0.0177 |
  | at speed | 71.56 Hz | 143.13 Hz | 1284.2 Hz | 0.0333 |
  Pitch rises with revs, the square holds **exactly** an octave above the saw at every sample, the filter opens as the
  engine works, and tyre noise builds with speed — and idle 43.83 Hz is exactly `IDLE_HZ + (REV_HZ-IDLE_HZ) * rpm`
  at the parked idle rpm, so `update()` is demonstrably running against the real sim. Turning it off ramped master
  gain to **0**. Nothing was changed: this was verification (guardrail 60).

- **C19.1 — The re-centred dash verified at narrow widths** *(cycle 19, commit `72ccf3f`; clears the cycle-18
  Needs-testing item)* — the OS window would not resize, so `/drive` was loaded in a **same-origin iframe** of an
  explicit size instead. Guardrail 53 was satisfied first: `contentWindow.innerWidth` read **1100** while the host read
  1920, and the `lg:hidden` phone block computed `display: none` at 1100 and `flex` at 390 — so the frame really is its
  own viewport and the breakpoints really applied. Hydration confirmed per frame (guardrail 54) and every panel
  measured with an identity transform (guardrail 55).
  **Results.** *1100×800:* console buttons on **one row**, trip computer 356px, wheel/console overlap **0**,
  panel/dash overlap **0**, no horizontal scroll, nothing overflowing right or bottom; the wheel sits **153px (13.9%)**
  short of the eyeline — the deliberate below-`xl` compromise, not a defect. *390×844 and 844×390:* the phone block
  is `flex` and the desktop grid is `display: none`, so cycle 18's change provably does not apply there; overlap 0,
  all controls inside the viewport, no horizontal scroll. Landscape dash is 190px = 48.7% of a 390px-tall screen,
  which is the cycle-12 floor behaving as designed, unchanged by cycle 18.
  **Also shipped:** the `xl` threshold is no longer an unexplained breakpoint — the code now records the
  arithmetic behind it (console needs ~310px of button row -> a ~461px column -> ~1270px total before a centred wheel
  fits).

- **C18.1 — The steering wheel is now in front of the driver** *(cycle 18, commit `4d24fd9`)* — the cockpit and the
  windshield disagreed about where the driver sits. Projecting the road centre through `world.js` under Node gives
  `z=10 -> 759`, `z=100 -> 945`, `z=1e6 -> 960.00` against a screen centre of **960**: the vanishing point converges
  exactly on the middle of the image, so the driver's eyeline is the middle of the viewport. Measured in the browser at
  1920, the wheel was centred at **615 (32.0%)** while the mirror, glass and pillars were symmetric about 960 — the
  wheel sat **345px, 18% of the viewport, left of the driver's own eye**. The desktop dash is now a grid whose middle
  column *is* the steering column, so the wheel is centred by construction; a door card (face, armrest edge, pull)
  occupies the driver's left, because that is what is beside you. `world.js`'s comment claiming the vanishing point
  falls left of centre — the stated justification for the old framing — was false and now states what the probe shows.
  **Verified at 1920x895:** wheel centre 960, offset **0**; no wheel/console overlap; no panel/dash overlap; no
  horizontal scroll.

- **C17.1 — The tab, the bookmark and the route announcer now name the exit** *(cycle 17, commit `aafb4d9`)* —
  `document.title` was identical at every exit while the URL changed, so twenty-one destinations shared one bookmark
  name and one history entry; and because Next's route announcer reads the title **assertively** on every shallow URL
  change (every departure), a screen-reader user was interrupted twenty times with the same sentence. `DriveScene` now
  renders a per-stop `next/head` title, which fixes both at once. **Verified:** titles distinct across EXIT 14 / MILE 0
  / EXIT 20, and `curl` confirms the served HTML still carries the page-level `<title>` for crawlers (guardrail 46).
  MILE 0 drops the duplicated brand, whose own title *is* the owner's name.
- **C17.2 — Arrivals are announced by a region that actually exists** *(cycle 17, commit `aafb4d9`)* — `StopCard` was
  labelled `aria-live="polite"` but is keyed by stop inside `AnimatePresence`: measured, the live node was a **different
  node** before and after an exit change, and between exits there was **no polite region on the page at all**. A
  permanently mounted `role="status"` region in `DriveScene` replaces it, and the attribute that could not work was
  removed. **Verified:** identical DOM node across three arrivals while its text changed (guardrail 47), exactly one
  region, no `aria-live` left on a remounting node, and MILE 0 reads *"At the start line"* rather than claiming an
  arrival (guardrail 48).

- **C16.1 — Resuming restores the history behind the resumed exit** *(cycle 16, commit `f0b7c6c`)* — the route map no
  longer contradicts the resume offer. `useDrive` gained `markVisitedThrough(index)`, called from `resumeDrive` in
  `DriveScene.jsx` **and nowhere else**: saved progress is written only on arrival and only forwards, so a stored index
  is proof of every exit before it, whereas a `?exit=` deep link is proof of nothing but a click. **Verified on a
  production build at `:3008`, all three cases:** resume to EXIT 13 → 14 of 21 rows driven, `MILE 0` through `EXIT 13`;
  deep link `?exit=13` → exactly `MILE 0` + `EXIT 13`; fresh visit with storage cleared → `MILE 0` only (and no resume
  offer shown).
- **C16.2 — Idle-repaint finding recorded, deliberately not built** *(cycle 16)* — see Backlog **S16a**. The measurement
  that would justify it is not available in this environment, so it was written down with its reasoning instead of
  shipped blind (guardrail 9).

- **1. Expose every project screenshot to the route** — proven working: `route.js` project stops carry `images[]`; in Chrome at `/drive` the carousel counter read `1/4` at EXIT 11 (solar-indy, 4 files on disk) and `5/5` at EXIT 12 (matrimoni-react, 5 files on disk). Commit `8883aaa`.
- **2. Auto-cycling project screenshots that are not cut off** — proven working: the full Solar Power Indy capture rendered edge to edge inside the browser frame (previously only its top ~25% was visible), and successive screenshots showed the counter advance 4/4 -> 1/4 -> 2/4 -> 3/4 unaided, with the active dot tracking it. Commit `8883aaa`.
- **3. Rebuilt arrival panel** — proven working: exit shield + leg + counter header and the media|prose split rendered at 1920x895; the panel's top edge sits at y=118 with the rear-view mirror ending at y=100, so the overlap reported in the audit is gone. Commit `8883aaa`.
- **4. Cockpit rebuilt around driver geometry** — proven working: at 1920x895 the wheel is centred on the binnacle on the driver's axis with the cluster read over the rim, and a live driving frame showed 35 MPH with the tach up, `P R N D 3` with D lit, the CRUISE tell-tale lit under autopilot, and the terminal screen counting down `EXIT 12 · Matrimoni  0.1 MI`. Commit `646b717`.
- **4b. Phone cockpit** — proven working: at 386x840 the stacked layout (cluster strip / terminal / controls+pedals) rendered correctly with `scrollWidth === innerWidth` (no horizontal overflow) and every control inside the viewport. Commit `646b717`.
- **5a. Cold-load hydration check** *(cleared cycle 2)* — proven clean: console tracking attached and cleared **before** navigating, then `/drive` loaded cold. Zero messages matched `hydrat|did not match|Warning|Error|Uncaught|mismatch`.
- **5b. Title clamping at phone width** *(cleared cycle 2)* — proven working, and it exposed a real cache fault on the way (see the log). At 386x840 on EXIT 11 the h2 computes `-webkit-line-clamp: 2`, `-webkit-box-orient: vertical`, `overflow: hidden`; the real title renders on exactly 2 lines unclipped, and an injected 113-character title still renders at exactly 2 lines (45px = 2 x 22.5px line-height) with `scrollHeight > clientHeight` — i.e. genuinely clamped, not merely short enough.
- **C2-1. Time-of-day lighting along the route** — proven working. Live state read at four points: MILE 0 `starOpacity=0` with a warm `rgb(226,140,84)` horizon; Coding Temple `0.2303`; Weather Window `0.9475`; destination `0.6` (dawn dims them again). Screenshots confirm golden-hour dusk at MILE 0, full night at the toolbox, first light at the destination. Performance measured both ways rather than assumed: **34.2fps median with the palette vs 26.6fps at baseline** (same machine, same 180-frame method, baseline obtained by stashing only the cycle-2 drive files) — no regression. Cold load has no hydration warning. Commit `dd4b28b`.
- **C2-2. Exit-sign realism pass** — proven working: mid-approach at dusk the sign shows its MUTCD exit plaque, twin posts, leg name, live distance countdown ("38 M"), title and sub, with the retroreflective face flaring as it nears; frozen mid-approach at night (brake held) it keeps good contrast against the dark sky. Commit `86d0174`.
- **C15-1. `world.project()` made true instead of dead** — the module documented itself as the single source of truth for placing everything on screen, but **nothing called it**; three sites hand-rolled the same projection. That is the exact shape that has already cost this branch twice (dash height written twice -> 71px overlap; camera lateral written four times -> the owner's centre-line complaint). `ExitSign` and `RoadCanvas.place` now go through `project()`; `buildPoints` stays inlined **on purpose**, with a comment explaining that routing a 131-iteration-per-frame loop through it would add 131 allocations and 131 redundant `curveAt`/`hillAt` pairs each frame (guardrails 46-47). The module doc now describes reality and names the exception. Commit `e23a9db`.
  - **Proven as a real A/B, not by inspection:** stashed the refactor, rebuilt, captured a canvas frame from the pre-refactor build; restored, rebuilt, captured again at the same exit. **0 of 1,992,704 pixels differ, max channel delta 0.** The exit sign — a DOM overlay outside that diff — was checked separately and still projects to a finite, correctly-scaled on-screen position (`translate(475px, 234px) scale(0.0508)` at 0.1 MI out).
- **C14-0. Regression check on cycle 13's camera change** — cycle 13 rewrote camera lateral maths in four places, and `ExitSign` positions itself independently of the canvas, so it was the likeliest casualty. **No regression:** at EXIT 07 the sign's twin posts still meet the ground at the roadside and the lane markings read correctly (yellow centre line left, white edge line right, car between them). The first-run flow was also exercised end to end — Start engine -> hold accelerator -> depart -> arrive at EXIT 01 with the panel open.
- **C14-1. The destination now reads as an arrival** — priority (b) named this panel and no cycle had examined the destination stop on its own. It was shaped like every other stop: all four actions rendered identically, so **"Email hytjin@gmail.com" carried the same weight as "Back to the classic site"** — goal and exit door indistinguishable. The email is now primary, LinkedIn and the résumé stay secondary, the classic-site link drops to quiet text, and a derived summary of the trip sits above them. Commit `b6f444f`.
  - **Every number is derived, none written down (guardrail 13):** rendered **2016 / 9 / 8 / 2.7**, checked against the content itself — 9 ids in `experience.js`, 8 names in `projects.js`, `education.date` 2016, and 21 stops x 220m = 2.7 mi. Add a role or a build and they follow automatically. The owner's prose was not touched.
  - **No collateral change:** EXIT 11 re-checked — no summary, both links still secondary.
- **C13-1. Oncoming traffic removed** — at the owner's direct request: *"you've put unnecessary opposing traffic in a portfolio site that should represent me."* Removed the constants, the per-frame car state, `drawOncoming`, and the `reducedMotion` prop that existed only to suppress it. Recorded at the top of the Guardrails block as standing law so no future Suggester pass re-proposes it; S13b (drifting haze) closed as unwanted for the same reason. Commit `d76e0bd`.
- **C13-2. The car now drives in a lane, not down the centre line** — also at the owner's request, twice: *"i dislike how the car starts in the middle of the road"* and *"you also make me steer right back into the middle of the road instead of the middle of the lane of traffic im supposed to be in."* Both symptoms had one cause: the camera sat at lateral **0**, which **is** the centre line, and `sim.x` decays to 0 — so releasing the steering keys actively walked you back onto it. The camera now sits at `cameraX(sim) = LANE_OFFSET + sim.x` with `LANE_OFFSET = 2.7`, the midpoint of the right-hand lane (road spans -5.5..5.5, centre line at 0, so the right lane's midpoint is 2.75). `sim.x` is now drift *within* the lane, so re-centring returns you to your lane. Steering clamp tightened ±3.4 -> ±2.3 so full-left is 0.4m (just inside the centre line) and full-right is 5.0m (on the edge line) — you can no longer stray onto the oncoming side or the shoulder. Expressed once in `world.js` and consumed by all four camera-relative call sites (road ribbon, roadside furniture, exit signs, `project()`). Commit `d76e0bd`.
  - **Verified against a production build:** the yellow centre line now runs down the **left** of the view with the white edge line on the right, and the vanishing point sits slightly left of screen centre — exactly where it belongs when seated right of the road's centreline.
- **C12-1. Arrival panel no longer hides behind the cockpit on short viewports** — on a landscape phone the panel ran **71px underneath** the dash, hiding the bottom of the résumé content. Root cause found arithmetically: the dash height was written twice in different units — `Dashboard` `h-[36%] min-h-[210px]` vs `DriveScene` `bottom-[36%]`. At 386px tall, 36% = 139px so the **min-height won at 210px** while the panel reserved only 139px; 210 - 139 = **71px**, exactly the measured overlap. Both now consume a single expression, `clamp(190px,36%,48%)`, so they cannot drift apart (guardrail 43). Measured before/after at 840x386: overlap **71px -> 0**, and it survived the guardrail-36 frozen-transform check both times. Commit `c71b624`.
- **C12-2. Cockpit no longer eats more than half a landscape screen** — the same change brought the drivable glass from **45.6% -> 50.8%**, back over guardrail 3's 50% floor. No regression at other sizes: 1916x946 unchanged at 36% dash / 64% glass with 32px of panel clearance; 386x840 unchanged at 36% / 64%.
- **C12-3. Focus visibility - investigated, no defect** — every control computed `outline-style: none`, but from **programmatic** `.focus()`, which does not match `:focus-visible`, so it proved nothing (guardrail 45). A grep across `tailwind.css`, `base.css`, `components.css`, `utilities.css` and every drive component found **no author rule removing outlines**, so the browser default ring applies to real keyboard focus. No change made.
- **C12-4. "Controls below the viewport" - investigated, no defect** — a sweep flagged a control 156px below the fold at 840x386. It was the **`sr-only` itinerary's** per-stop links, ~144px apart down the document: visually hidden crawlable content behaving as intended. The cockpit's own stack fits precisely inside the dash (cluster 206-280, trip computer compressed to 20px, controls 316-378, dash 196-386). Dismissed rather than "fixed".
- **C11-1. Oncoming traffic respects `prefers-reduced-motion`** — a regression this branch introduced in cycle 7, found and fixed before any human saw it. `grep -c reducedMotion src/components/drive/RoadCanvas.jsx` returned **0**, while every other mechanism in drive mode honours the preference. Because cars advance from `performance.now()` deltas rather than `sim.travel`, a visitor asking for less motion still got headlights sliding toward them **while parked**. Now not drawn at all under the preference (frozen cars would read as wreckage in a live carriageway; an empty road is the coherent state the page had pre-cycle-7). Commit `eef571b`.
  - **Proven by pixel comparison, not by reading the code.** The scene is fully deterministic at a given exit, so two loads of `?exit=6` — one with `matchMedia` patched to report reduced motion, one without — can differ *only* where traffic is drawn. **185 samples changed, confined to a 30x32px box at the vanishing point**; every other pixel identical, which also validates the method.
- **C11-2. The whole reduced-motion contract, swept end to end** — four mechanisms claimed it and none had been exercised together. All hold: **traffic** absent (above); **throttle** jumped `EXIT 06 -> EXIT 07` with no intermediate driving state, confirming `useDrive` substitutes a jump for animated travel; the **arrival panel** computed `transform: none`, i.e. the opacity-only variant rather than the projecting one; and the **carousel** was already proven in cycle 2 (counter held `1/4` across 11s while the dots still worked).
- **C10-1. Route map behaves like the modal it claims to be** — proven working against a production build by reading `document.activeElement` at each step. Before: the open dialog held **23** tabbable elements while `dialog.contains(document.activeElement)` was **false**. After: opening moves focus to the panel (verified twice), **Tab** from the last item wraps to the first and **Shift+Tab** from the first wraps to the last — both staying inside the panel — and **Escape still closes it**, confirming the global handler in `DriveScene` is untouched (guardrail 37: the trap only ever `preventDefault`s Tab). Commit `09fe15d`.
  - *Focus-restore-on-close executes but could not be observed here:* programmatic `.focus()` on the trigger does not stick without OS window focus, so nothing meaningful was captured to restore to. Added to Needs testing rather than claimed.
- **C10-2. The classic site's project cards** — investigated; **out of scope, parked as Needs human with an exact patch.** This is the user's own priority (c) and it is only half-fixed: drive mode was corrected in cycle 1, but `src/components/Projects.jsx` still crops every screenshot (`aspect-video` + `object-cover`; computed against the real files, **all 28** are wider than 16:9, losing **10.1%** of width on average and **14.2%** at worst) and still advances only on click (`grep` for `setInterval|setTimeout|useEffect` in that file returns nothing). See the starred entry under **Needs human**.
- **C9-1. Phone-width regression sweep — no regressions found** — the cockpit had not been re-checked at phone width since cycle 1, with seven cycles of change since. Measured at 386x840 against a production build: hydrated, **no horizontal overflow**, cluster strip and trip screen laid out correctly, the arrival panel present and internally scrollable (content 472px in a 291px scroller), the screenshot frame at its native 2:1 (287x141), and the new ignition resume UI stacking correctly instead of overflowing. Nothing needed fixing.
  - **A false positive was caught and *not* acted on.** The panel measured 26px into the dash, which read as an overlap. Its computed transform was `matrix3d(0.97, …, 26, 0, 1)` — framer-motion's *initial* state (`translateY 26`, `rotateX 10°`, `scale .97`) frozen, because rAF is paused in a hidden tab. Neutralising the transform showed the settled layout at 118→538 against a dash top of 538: flush, zero overlap. "Fixing" it would have permanently shifted the panel to compensate for a measurement artefact. Recorded as guardrail 36.
- **C9-2. Opt-in engine audio** — proven working against a production build with the `AudioContext` constructor spied on from a parent frame: **zero contexts before any gesture**; pressing the toggle creates **exactly one**; toggling off then on again reuses that same one rather than leaking a second (guardrail 35); unmounting moves it to **`closed`**; and no audio key is written to storage (only `htae.drive.progress.v1` is present), so nothing can autostart on a later visit (guardrail 33). Commit `655a3ce`.
  - **Verification caught a real flaw.** The toggle originally set itself "on" unconditionally, so a browser that refuses to resume would leave it lit over silence. `enable()` now resolves to whether the context actually reached `running`, and the toggle reports that. Confirmed after the fix: under a synthetic click the context stays `suspended` and the button correctly stays **off**.
- **C8-1. Remember progress and offer to resume** — proven working against a production build, every path exercised with `localStorage` read directly rather than inferred:
  - **clean first visit** — nothing stored, no Resume and no Forget button on the ignition screen;
  - **driving to EXIT 13** — stored exactly `{"index":13,"id":"project-co-lab-portfolio"}`;
  - **`?exit=5` overrides it** — landed on EXIT 05, Resume *not* offered, and the stored `13` left intact (the write is forward-only, so visiting an earlier exit cannot clobber it);
  - **plain load** — offered "Resume · EXIT 13 / Co.Lab Portfolio App" with "Forget my progress" beneath, confirmed in a screenshot; clicking it landed on EXIT 13 and set the URL to `?exit=13`;
  - **Forget** — cleared both the offer and the storage key, returning the screen to its first-visit state with Start engine intact.
  - **Hostile storage (guardrails 29-30)** — three malformed entries were each armed and reloaded through the real code path: a **stale id** (`index 13` with a non-existent id), **unparseable JSON**, and **index 999**. All three fell back to "no offer" with the page alive and hydrated; none threw. Commit `4ebe999`.
- **C7-1. Oncoming traffic on the far carriageway** — proven working against a production build, and proven by measurement rather than by eye. With the car **parked** the whole scene is static, so two canvas captures taken either side of 45 forced repaints can only differ where something animates: **12,564 sampled pixels changed**, confined to a compact box (CSS px 809-968 x 357-500) near the vanishing point extending down and to the left — exactly the approach path of oncoming headlights, and nothing else in the canvas moves while parked. A screenshot afterwards shows the headlights as a bright warm pair on the opposite carriageway. Cars are deterministic (no `Math.random`), pre-allocated and mutated in place, with a clamped frame delta (guardrails 25-26). Commit `ff1f8d9`.
- **C7-2. Mile markers between exits** — proven working, and the first attempt was caught **failing**: at `0.5m x 0.36m` the plates rendered about **2x1 pixels** at distance, indistinguishable from the delineator reflectors — visible in the zoom only as a speck. Guardrail 27 required checking a screenshot rather than assuming, which is what caught it. Enlarged to `0.95m x 0.7m`, raised to 1.9m and set outboard at `ROAD_HALF + 2.5`; they now read as distinct green plates on posts, clearly separate from the 24m delineator line. Commit `ff1f8d9`.
- **C6-1. Per-leg roadside character — visual pass (clears the cycle-3 parked item)** — proven working in the browser at last, against a **production** build. At EXIT 12/13 (Scenic overlook) the guardrail renders along the right verge as **one continuous ribbon with no anti-aliasing seams** — confirmed by zooming the right-hand verge, where it recedes as a single smooth band (guardrail 15 satisfied; this is exactly what the run-length `railRuns` pass was written for). The lamp line is visibly thinner there than on the career highway, and at EXIT 04 (the sabbatical) it is thinner again **with no guardrail**, matching the SSR mapping proven in cycle 3. Nothing was observed popping or changing character on approach, consistent with the style being keyed off each object's own world position (guardrail 17). Commit `c209b57`. *Frame-rate remains unmeasured — see Needs testing.*
- **C6-2. `?exit=` deep links, carousel and year readout re-verified end to end on a production build** — `/drive?exit=12` hydrates, lands parked on **EXIT 12 · Matrimoni** with the panel open and the screenshot carousel already cycling (2/5), and the trip computer reads **`yr NOW`** — correctly refusing to invent a year for a project stop (guardrail 13). `?exit=3` and `?exit=11` behaved likewise; `?exit=4` showed **`yr 2019`**. This was checked because the dev server made all of it *look* broken (see C6-3).
- **C6-3. False alarm investigated and cleared: the dev server, not the code** — `/drive?exit=12` on `next dev` showed the ignition screen, no panel, and a dead "Start engine" button, which looked exactly like a regression in the cycle-2 deep link. Rather than accept that, the cause was isolated: `document.body.style.overflow` was **unset**, meaning `DriveScene`'s very first effect had never run — **React had not hydrated at all**. Plain `/drive` with no query behaved identically, ruling out the deep-link code; all eight JS chunks returned **200**; the console produced no error. Rebuilding and serving the same commit with `npm run start` on port 3008 hydrated correctly and every feature worked. **No code defect existed.** Recorded as guardrail 23.
- **C5-1. Cockpit reads properly to assistive technology** — proven working against the served HTML. Before: **0 of 11** buttons had an `aria-label`, and the gauge faces, gear selector and trip-computer screen had no `aria-hidden`, so the instrument noise was announced. After: **10 of 11** buttons carry a name that keeps the visible word (the 11th is "Start engine", which already names itself — confirmed by listing every unlabelled button); `aria-hidden` count went **12 → 19**, covering 3 gauge wrappers, 2 trip-computer screens and 2 gear selectors. Guardrail 21 re-checked: the itinerary is still exposed with all ten `<time>` years, and the `aria-live` arrival panel is untouched (absent from cold SSR only because it renders solely while parked). Commit `5fcf996`.
- **C5-2. Duplicate `<h1>` on `/drive`** — proven fixed: the served HTML now contains exactly **one** `<h1>` ("Drive mode — the résumé of Hyun-Tae Jin as a road trip"), and the transient ignition splash sits below it as an `<h2>`. Commit `5fcf996`.
- **C4-1. Timezone year bug — audit of the rest of the site** — investigated and **closed clean**: the classic site is *not* affected. Every date call site in `src/` was read and classified: `FormattedDate.jsx:1-5` builds its formatter with `Intl.DateTimeFormat('en-US', { …, timeZone: 'UTC' })`, which is exactly the right defence, and `:15` writes the `dateTime` attribute from `toISOString()` (always UTC). Proven by running that exact formatter config in Node against all ten content dates in a timezone behind UTC: it renders **Jan 2024** correctly, while `getFullYear()` on the same date returns 2023 in the same process — so the test conditions were valid and self-checking. `route.js:7` (`byDateAscending`) compares instants and is timezone-independent; `Intro.jsx:131` and `generateRssFeed.js:82` read the *current* year for a copyright line, where local time is the wanted semantic; `generateRssFeed.js:107` hands a `Date` to the feed library, which serialises UTC. Conclusion: `route.js` was the only affected site and it was fixed in `94eea90`. No code change needed, no Needs-human item.
- **C4-3. Years and leg structure in the crawlable itinerary** — proven working by reading the served HTML back: six `<h2>` leg headings, 21 `<h3>` stop headings, and exactly ten `<time>` elements reading `2016 2017 2019 2020 2023 2023 2023 2024 2024 2025` — matching education and the nine roles, including the January-2024 role the cycle-3 fix corrected. The eleven stops with no date in the content carry no year at all (guardrail 13 / 19). Commit `e799e92`.
- **C3-1. Trip computer reads in years** — proven working by server-rendering `yearAt` across all 21 stops plus quarter-leg midpoints. Sequence: 2016 at school, 2017 / 2019 / 2020 across the early roles, **2021 and 2022 while crossing the sabbatical**, 2023 / 2024 / 2025 through StarPlus, then `NOW` from the last dated role onward — and `NOW` at every project, toolbox and destination stop, never a fabricated number (guardrail 13 satisfied). SSR HTML confirms the readout renders `2016` initially. Commit `94eea90`.
- **C3-1b. Timezone year bug (found while verifying C3-1)** — proven fixed. `yearOf()` used `new Date(d).getFullYear()`, which parses `YYYY-MM-DD` as UTC midnight then reads it back in local time, so in any timezone behind UTC a January 1st date reports the previous year. The SSR probe showed **four** stops at 2023 when only three roles are from 2023: the StarPlus UI/UX role (`2024-01-01`, own label "Jan 2024 - Oct 2024") had silently moved to 2023. Confirmed the mechanism in Node across all ten content dates — only the Jan 1st one differed (local 2023 vs UTC/string 2024). The year is now read straight off the string; the re-run probe shows index 8 at 2024. Commit `94eea90`.
- **C2-3. Deep-link an exit** — proven working: `/drive?exit=11` opens parked on Solar Power Indy with the panel up and the carousel at 1/4; driving on moved the URL to `?exit=12`; `?exit=999` falls back to the ignition screen at MILE 0 without throwing. The accept predicate was additionally exercised across `11/0/20/21/999/-3/banana/11abc/" 11 "/1.5/""/1e3/null/0x5` — only in-range integers accepted. Commit `0d3e493`.
- **5c. Reduced-motion path through the carousel** *(cleared cycle 2)* — proven by real execution: `matchMedia('(prefers-reduced-motion: reduce)')` was patched to report `matches: true` inside a 390px probe frame before hydration, then EXIT 11 was opened. The frame counter held at `1/4` across 11 seconds (autoplay would have advanced 2-3 times at the 4.2s interval), clicking the third dot still moved it `1/4 -> 3/4`, and the `@media (prefers-reduced-motion: reduce) { .shot { transition: none } }` rule is present in the served stylesheet.

## Needs testing (testable now — Reviewer must clear all of these each run)

*(empty — all three long-parked items were cleared in cycle 20 once the window became foregrounded.)*

## Awaiting scenario (can't test until a specific scenario occurs)

- **RESOLVED in cycle 20 — the foregrounded Chrome window arrived.** Probed at the top of cycle 20:
  `document.hidden` **false**, `visibilityState` `visible`, `document.hasFocus()` **true**, `requestAnimationFrame`
  actually running, and programmatic `.focus()` sticking. All three items that had been waiting on this (frame rate
  since cycle 3/6, focus return since cycle 10, audible engine since cycle 9) were measured and moved to **Done**.
  Keep the check in mind for future cycles — the window may go back to hidden — but nothing is parked behind it now.

## Blocked (couldn't be implemented — missing dependency the loop can't supply)

*(empty)*

## Needs human (parked — requires a person; the loop will NOT guess these)

> **All three re-verified at cycle 35 against the current files and the served HTML** — they were first measured
> around cycles 4 and 10, and the working tree has changed since, so they were re-checked rather than trusted:
> - **Projects.jsx** — still live (`index.jsx` -> `ProjectsSection` -> `Projects`), still `aspect-video` at `:97` and
>   `object-cover` at `:120`, still no `useEffect`/timer anywhere in the file, still click-only at `:61`,
>   `AnimatePresence` still at `:104`. Every line reference in the patch below is confirmed. The crop was recomputed
>   from the PNG headers: **28 of 28** files are wider than 16:9, average width lost **10.2%**, worst **14.2%**
>   (`rift/2.png`) — the recorded 10.1% was a rounding difference and has been corrected above.
> - **Duplicate canonical** — confirmed from the **served HTML**, not from reasoning about how `next/head` dedupes:
>   `/drive` ships `<link rel="canonical" href="https://htae.dev"/>` **followed by**
>   `<link rel="canonical" href="https://htae.dev/drive"/>`. `og:url` and `og:title` are doubled the same way. `/`
>   ships exactly one. Crawlers honour the **first**, so `/drive` currently tells them it is the homepage.
> - **Sitemap** — confirmed: `public/sitemap.xml` contains **exactly one** `<loc>`, `https://htae.dev/`. The site has
>   exactly two indexable routes (`/` and `/drive`), so this is **half the site** missing, not one page among many.
>   `robots.txt` does point at the sitemap correctly.

- [ ] **⭐ The CLASSIC site still crops project photos and never cycles them — this is priority (c), only half-fixed** —
  Needs human because `src/components/Projects.jsx` is outside this run's write scope.

  **Why this is the most important item here.** The original brief said: *"the projects sections the photos just get
  cut off and then the cycling through photos should just happen automatically with smooth fade transition to the next
  screenshot."* That was fixed in **drive mode** in cycle 1 — but the **main portfolio page** has both faults still, so
  it would be easy to believe the problem is solved everywhere when it is not.

  **Fault 1 — photos are cropped.** `src/components/Projects.jsx:97` wraps the image in an `aspect-video` box
  (16:9 = 1.778) and `:120` renders it with `object-cover`. Computed against the real files: **all 28 screenshots** in
  `public/images/projects/` are wider than 16:9, so `object-cover` discards an average of **10.2%** of each image's
  width — worst case **14.2%** (`rift/2.png`). Both edges of every screenshot are cut off.

  **Fault 2 — cycling is click-only.** `grep -nE "setInterval|setTimeout|useEffect" src/components/Projects.jsx`
  returns **nothing**. Advancing happens solely in `handleScreenshotClick` (`:61`), so a visitor who never thinks to
  click the picture sees only screenshot 1 of up to 5.

  **Suggested patch** — the same two moves that fixed drive mode, and the cross-fade already present there:

  ```jsx
  // :97  give the frame the screenshots' own ~2:1 shape instead of 16:9
  <div className="relative aspect-[2/1] w-full min-w-0 !max-w-xl overflow-hidden">

  // :120 stop cropping; letterbox against the card instead
  className="max-w-full cursor-pointer rounded-lg object-contain shadow-lg"

  // and advance on a timer as well as on click (pausing on hover), e.g.
  useEffect(() => {
    if (screenshots.length < 2) return undefined
    const id = setInterval(handleScreenshotClick, 4200)
    return () => clearInterval(id)
  }, [currentScreenshot, screenshots.length])
  ```

  `AnimatePresence` already wraps the image at `:104`, so the smooth fade the user asked for comes for free once the
  timer drives it. Consider `useReducedMotion()` to skip the autoplay, as `ProjectShots` does in drive mode.

  **Verify after applying:** the full width of a screenshot should be visible (compare against
  `public/images/projects/solar-indy/1.png`), and the image should advance on its own after ~4 seconds without a click.

  *(The loop did not apply this: the scope is drive mode, and the working tree already carries uncommitted edits of
  the user's own in this area.)*

- [ ] **`/drive` is missing from the sitemap** — Needs human because `public/sitemap.xml` is outside this run's write
  scope (the scope covers `public/images/` only).

  **Measured:** `curl http://127.0.0.1:3007/sitemap.xml` returns exactly one entry:

  ```xml
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://htae.dev/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
  </urlset>
  ```

  `public/robots.txt` points crawlers at that file, so this is the authoritative list.

  **Why it matters — and why it compounds.** Taken together with the canonical defect parked below, drive mode is
  invisible to search from both directions at once: it is **not listed** in the sitemap, and the copy that *is*
  reachable **disowns itself** via a canonical pointing at the homepage. Fixing only one of the two will not surface
  the page.

  **Exact patch — add a second entry to `public/sitemap.xml`:**

  ```xml
  <url>
    <loc>https://htae.dev/drive</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ```

  **Verify after applying:** `curl -s https://htae.dev/sitemap.xml | grep -c '<loc>'` should print `2`.


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

- **S15 — Structured data for `/drive`** *(new, cycle 4)* — `_app.jsx:16-48` emits a `@graph` of WebSite / Person / ProfilePage, all `@id`-anchored to the site root, so `/drive` inherits markup that describes the homepage. A route-specific `WebPage` (or `ItemList` of the exits) would let the drive page stand on its own in search. **Blocked behind the Needs-human canonical fix** — adding more page-level head content while two canonicals disagree would just add noise.
- **S13b — Drifting haze** — **CLOSED as unwanted (cycle 13).** The owner asked for invented atmosphere to come off the road, not be added to. Do not revisit.

---

**Reusable probe (added cycle 29) — testing `prefers-reduced-motion` from here.** The preference cannot be toggled
in this environment, and patching `matchMedia` on the iframe *before* setting `src` is useless — navigation replaces the
window, so the patch goes to the `about:blank` window and `matches` comes back false. What works: set `src`, then poll
`contentWindow` and patch as soon as `location.href` is the real URL, which lands while `readyState` is still
`loading` — before React mounts. Always report the readyState at patch time, and always run a **control with motion
allowed**: without one, "no animation" is indistinguishable from "the harness did nothing".

**Standing verification note (added cycle 6):** browser verification works again, but **use a production build**, not
`next dev`: `npm run build` then `PORT=3008 npm run start`, and load `http://127.0.0.1:3008/drive`. Confirm hydration
with `document.body.style.overflow === 'hidden'` before trusting any interactivity result (guardrail 23). Frame-timing
needs a *foregrounded* window (guardrail 24).
