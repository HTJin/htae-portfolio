# Overnight log — 2026-08-05

Running progress, phase transitions, decisions and assumptions. Append-only.

---

**19:57 ET — Run start.** Relief heartbeat scheduled (`*/30 * * * *`, job `33b7cfc6`) as the very first action, before any phase. Focus area given by the user: drive mode on branch `feat/drive-mode` — (1) car interior dash, (2) arrival panel, (3) project photos cut off + should auto-cycle with a fade.

**19:58 ET — Phase: Suggester.** Read the drive-mode source cold: `DriveScene.jsx`, `CarInterior.jsx`, `Dashboard.jsx`, `StopCard.jsx`, `RoadCanvas.jsx`, `route.js`, `drive.module.css`, `src/lib/projects.js`. Confirmed on disk that `public/images/projects/` holds 2-5 PNGs per project (28 files across 8 projects).

**20:00 ET — Live audit via Chrome extension.** `npm run dev` → port 3000 was already in use, Next fell back to **http://localhost:3001**. Loaded `/drive` at 1440x900, clicked *Start engine*, opened the route map, jumped to EXIT 11 (Solar Power Indy). Observations recorded as evidence in the tasks file:
- The project screenshot renders as a cropped top-band strip, not the whole capture. (`StopCard.jsx:52-57`)
- Only one screenshot is reachable; `route.js:81-83` takes `screenshots[0]` only.
- The arrival panel overlaps the rear-view mirror at this viewport.
- The steering wheel sits at ~33% of viewport width while the road's vanishing point is at 50% — the wheel is not in front of the driver, and the gauges float beside it rather than in a binnacle.
- No hood, no vents, no warning lights; the dash is a flat dark gradient.

**20:02 ET — Suggester exit.** 10 ideas logged to `overnight-suggestions-2026-08-05.md` (S1-S10). S1-S4 promoted to this cycle (they map onto the user's three stated priorities plus the cockpit rebuild); S5-S10 seeded into the Backlog. → **Phase: Planner**.

**20:03 ET — Planner exit.** Five tasks written into *Tonight's tasks* with why / files / evidence / done-when. Assumption locked in and documented: the camera is the driver's eyes in a left-hand-drive car, so the wheel belongs on the driver's axis (~44-47% of width) with the centre stack to its right. → **Phase: Critic**.

**20:04 ET — Critic exit.** Failure pre-mortem written into the Guardrails block as six named guardrails: hydration mismatch from unrounded SVG geometry; regressing the 60fps loop by adding React state per frame; the cockpit crowding out the road; the arrival panel becoming unreadable at 390px; carousel timers leaking across stop changes or overriding reduced-motion; `object-contain` leaving unintentional-looking letterbox bars. Also recorded a scope guardrail: the working tree had **pre-existing uncommitted edits** to `src/components/sections/*` and `src/content/*` before this run — never `git add -A`, stage only drive-mode files. → **Phase: Builder**.

**20:10-21:05 ET — Phase: Builder (cycle 1).**

- **Task 1 (route images) — built.** `route.js` project stops now carry `images[]` (every screenshot, resolved to its public path) plus `site`; `image` kept as `images[0]` for back-compat. Verified in the browser: EXIT 11 reported `1/4`, EXIT 12 reported `5/5`.
- **Task 2 (ProjectShots) — built.** New `src/components/drive/ProjectShots.jsx`. Measured every capture on disk first (`public/images/projects/**`, 28 PNGs) — they are all 1.95-2.07:1, so the frame is a 2:1 `browserViewport` with `object-contain` and the whole page shows. Cross-fade is a 900ms CSS opacity transition between absolutely-stacked `<img>`s on a 4.2s timer; dots jump, pointer/focus pauses, `useReducedMotion` disables autoplay, and the interval is torn down on stop change. **Verified in Chrome:** the frame advanced 4/4 -> 1/4 -> 2/4 -> 3/4 across successive screenshots, and the full Solar Power Indy capture was visible edge to edge instead of a cropped strip.
- **Task 3 (StopCard) — built.** Exit shield + leg + counter header, media|prose split at `lg`, projects up from its bottom edge (`transformOrigin: bottom center`, rotateX), reduced-motion falls back to a plain fade. Container in `DriveScene` re-bounded to `top-[14%] bottom-[36%]`. **Verified in Chrome:** no overlap with the rear-view mirror at 1920x895 (mirror bottom 100px, panel top 118px).
- **Task 4 (cockpit) — built.** See the commit message on `646b717` for the full list. Two genuine defects were found and fixed *during* the build, both worth remembering:
  1. **The per-frame `style.transform` was wiping Tailwind's centring translate.** `SteeringWheel` set `style.transform = rotate(...)` on the same element that carried `-translate-x-1/2`; inline style wins, so the wheel rendered at x=605 in a column centred on 615 (measured, not guessed: `wheelParent` x=408 w=414 -> centre 615; wheel x=605 w=375 -> centre 792.5). Fixed by splitting centring (wrapper div) from rotation (inner svg).
  2. **A CSS-module `display: flex` out-ordered Tailwind's `.hidden`.** `.vent { display: flex }` meant `hidden xl:flex` never hid the outboard vents, so they leaked onto the phone layout. Fixed by moving `display` into the component's utility classes and leaving only paint in the module. Re-verified numerically at 386px: `visibleVents: 0`.
- **Mobile rebuild.** The first 390x844 capture showed the side-by-side dash overflowing badly — the binnacle ran off the left edge, PRND rendered on top of the terminal screen, pedals collided with the buttons. Replaced with a separate stacked `lg:hidden` cockpit (ClusterStrip -> screen -> controls+pedals in one thumb row). **Verified in Chrome at 386x840:** correct layout, `scrollWidth === innerWidth` (no horizontal overflow), controls and pedals all inside the viewport.

**Assumptions and decisions logged this cycle:**
- The dash was raised from `h-[34%]` to `h-[36%]` to fit the binnacle-plus-wheel stack. Guardrail 3 said glass must stay >= ~50% of viewport height: at 895px the glass is 573px (64%), so it holds.
- The rpm gauge is dropped on phones (speedo + tell-tales + PRND only). Assumption: on a 386px strip, two dials plus a gear display cannot all be legible, and speed is the one that changes meaningfully.

**BLOCKER encountered (environmental, not code) — 21:00 ET.** Every Chrome tab now reports `document.visibilityState === 'hidden'`, so Chrome has unrendered them: screenshots come back solid black and every `getBoundingClientRect()` returns 0. Confirmed this is **not** a code regression — the dev server returns 200 for `/drive`, `npm run build` compiles, `npx next lint` is clean, and the same page rendered correctly in the same session minutes earlier. The Chrome window is minimised or behind another window at the OS level. Browser verification is unavailable until a person foregrounds Chrome; relief shifts should re-test `document.hidden` first and fall back to build/lint verification while it is true.

**Dev-server gotcha worth carrying forward:** running `npm run build` while `npm run dev` is live against the same `.next` clobbers the dev server's route manifest — `/drive` started returning 404 to new requests while the already-open tab kept working off HMR. Fix is to restart dev after any build. Done twice this cycle; noted as a standing guardrail.

**21:05 ET — Builder exit.** Tasks 1-4 built, self-verified and committed (`8883aaa`, `646b717`). Task 5 partially satisfied: build + lint pass, desktop and mobile both exercised in the real browser before the window went hidden. Two follow-ups move to Needs testing. -> **Phase: Reviewer**.

---

## Cycle 2

**20:30 local — Relief shift picked up the baton.** Read `Phase: Planner` / `Cycle: 2` and the run files, then checked the environment first, as the Awaiting-scenario item instructed.

**20:31 — BLOCKER CLEARED.** Chrome reports `hidden=false`, `visibilityState=visible`, and the dash measures 322px — real layout, real rendering. The "foregrounded Chrome" condition arrived, so the parked verification work ran immediately.

**20:32-20:45 — Reviewer work carried into cycle 2. All three Needs-testing items cleared:**
- *Hydration on cold load* — attached and cleared console tracking **before** navigating, then loaded `/drive` cold. Zero matches for `hydrat|did not match|Warning|Error|Uncaught|mismatch`. **Done.**
- *Phone title clamp* — this one turned up a real fault. At 386x840 the h2 computed `display: block`, `line-clamp: none`, `overflow: visible`, and a stylesheet scan found **zero** `line-clamp` rules in the served CSS. `lg:truncate` was missing too — both classes came from the same edit, while older classes were present. That pattern pointed at stale CSS rather than a Tailwind problem, and `npm run dev:fresh` (wipes `.next`) restored both (`line-clamp: 1 rule`, `lg:truncate: 1 rule`). Root cause: **a corrupted `.next` webpack cache silently serving CSS without newly-added classes** — the log had been full of `PackFileCacheStrategy ... EPERM/ENOENT` warnings. Re-tested after the clean restart: the h2 computes `-webkit-line-clamp: 2`, `-webkit-box-orient: vertical`, `overflow: hidden`; the real title is 2 lines unclipped; an injected 113-character title still renders at exactly 2 lines (45px = 2 x 22.5) with `scrollHeight > clientHeight`. **Done.** Guardrail 6 was extended to cover this.
- *Reduced-motion carousel* — patched `matchMedia('(prefers-reduced-motion: reduce)')` to report `matches: true` inside a 390px probe frame before hydration, then opened EXIT 11. Counter held `1/4` across 11 seconds (autoplay would have advanced 2-3 times), the third dot still moved it `1/4 -> 3/4`, and the `@media (prefers-reduced-motion: reduce) { .shot { transition: none } }` rule is in the served stylesheet. **Done.**

**20:46 — Planner + Critic.** Read `ExitSign.jsx` and `Sky.jsx` cold (neither had been read before). Confirmed both are fully static — `RoadCanvas.jsx` uses a module-level frozen `COLORS`, `Sky.jsx` a fixed gradient/moon/starfield; nothing reads the sim. Planned three tasks from the Backlog (S6 time-of-day, S9 sign realism, S10 deep-link) and wrote four new pre-mortem guardrails (9-12) covering per-frame allocation, Sky staying off React state, SSR/hydration of a progress-dependent sky, and HUD/sign contrast at the bright end of the palette.

**20:50-21:05 — Builder, task 1 (time-of-day).** New `daylight.js` with five keyframes and `paletteAt(progress)`. Decision recorded: **not** a full day cycle — dusk-to-night keeps the night-tuned art intact, and the destination gets the first hint of dawn because it is the stop that asks what comes next.
- Verified the progression by reading live state at four points: MILE 0 `stars=0` with a warm `rgb(226,140,84)` horizon; Coding Temple `stars=0.23`; Weather Window `stars=0.95`; destination `stars=0.6` (dawn dims them again). Screenshots at MILE 0, the toolbox and the destination confirm dusk / full night / first light respectively.
- **Guardrail 9 (performance) checked properly rather than assumed.** Measured 180 frames while driving under autopilot: **34.2fps median (29.2ms)** with the palette. Then stashed only the three cycle-2 drive files (`git stash push -- ...`), reloaded, and measured the same way: **26.6fps median (37.6ms)** at baseline. So the change is not a regression — the sub-60fps is the dev server plus extension instrumentation. Stash popped and work restored.
- Guardrail 11: cold load after the change shows no hydration warning; the server renders `paletteAt(0)`, which is what the client paints first.
- Guardrail 12: the `StopCard` is legible against the bright dusk sky (checked on the MILE 0 screenshot).

**21:06-21:15 — Builder, task 2 (exit signs).** Exit number moved to a MUTCD-style plaque above the right corner; header row now carries the leg name and the distance countdown; twin supports; retroreflective face that flares as headlights reach it (`brightness(0.72 + 0.85 * near^2)`) plus a sheen sweep; face and plaque take their green from the route palette. Verified mid-approach at dusk (plaque, twin posts, "SCHOOL ZONE / 38 M / University of Pitt… / 2016" all legible) and at night by holding the brake to freeze the approach — good contrast at both ends.

**Mid-task incident (environmental, not code).** After the sign edit the page lost its module CSS and the road canvas stopped painting. Dev log showed `Could not find files for /drive in .next/build-manifest.json` — the same `.next` corruption as before, aggravated by the stash/pop churn. Compiles were succeeding but the manifest had no entry, so the page loaded without its chunks. `dev:fresh` fixed it; nothing was wrong with the code. Logged because it is the second distinct way this cache has produced a convincing fake defect tonight.

**21:16-21:25 — Builder, task 3 (deep-link).** `/drive?exit=n` jumps to that exit with the engine running, and the URL tracks the exit as you travel. Verified `?exit=11` lands parked on Solar Power Indy with the panel up and the carousel at 1/4, and driving on moved the URL to `?exit=12`. `?exit=999` falls back to the ignition screen at MILE 0 with no throw. The accept predicate was then exercised in Node across `11 / 0 / 20 / 21 / 999 / -3 / banana / 11abc / " 11 " / 1.5 / "" / 1e3 / null / 0x5` — only the in-range integers are accepted.

**Note on one inconclusive browser reading.** An in-browser check of `?exit=banana` returned "running", which would have been a defect — but the tab's `document.title` was **"Virsh.shop — Operator Console"**, i.e. Chrome was showing one of the user's own pages, not this app. `curl` on both the IPv4 and IPv6 stacks returned `<title>Hyun-Tae Jin | Drive mode</title>`, and PID 59844 on :3001 is this project's `next dev`. The reading was therefore against the wrong document and was discarded rather than reported; the user appears to be actively using Chrome, so the loop stopped competing for their tabs and verified the predicate in Node instead.

**21:26 — Builder exit.** `npm run build` compiles (`/drive` 16.4 kB), `next lint` clean, three commits: `dd4b28b`, `86d0174`, `0d3e493`. Dev server restarted clean after the build per guardrail 6. -> **Phase: Reviewer**.
