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
