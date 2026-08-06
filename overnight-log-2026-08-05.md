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

---

## Cycle 3

**21:03 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 3`. Dev server healthy, five commits on the branch, backlog holding S5/S8/S9b/S11/S12/S13.

**21:04 — Planner.** Read the content data cold before planning anything that depends on it: `src/content/education.js:6` has `date: '2016-12-01'` and `src/content/experience.js` carries a `date` on all nine roles (`2017-09-01` .. `2025-12-01`), already sorted ascending into the route. `src/lib/projects.js` has **no** date field, and neither do the skills or destination stops. That fact shaped the whole design of task 1 — the year can only be honest for route indices 1-10. Planned S12 (years) + S11 (roadside character) with S9b (mile markers) as a stretch.

**21:05 — Critic.** Added guardrails 13-17. The one that mattered: *the year readout must never invent career history* — projects have no dates, so past the last dated stop the readout says `NOW`, never a number.

**21:06-21:20 — Builder, task 1 (years).**
- `route.js` gains a derived `year` per stop and `yearAt(travel)`, interpolating between dated stops. `Dashboard.TripComputer` shows it as the hero number beside the odometer via `subscribe` + a ref (guardrail 16).
- **Verification technique, since the browser was unavailable (see below): an SSR probe.** Temporarily rendered `yearAt` samples into the page's existing `sr-only` block, read them with `curl`, then reverted the file to byte-identical-to-HEAD. That is real execution of the real module through the real toolchain, not a reimplementation.
- **The probe immediately caught a real bug.** It showed *four* stops reporting 2023 when only three roles are from 2023. Root cause: `yearOf()` used `new Date(date).getFullYear()`, which parses `YYYY-MM-DD` as **UTC midnight** and then reads it back in **local time** — so in any timezone behind UTC a January 1st date reports the previous year. The StarPlus UI/UX role (`2024-01-01`, whose own label reads "Jan 2024 - Oct 2024") had silently moved to **2023**. Confirmed the mechanism in Node across all ten content dates: only the Jan 1st one differs (local 2023 vs UTC/string 2024). Fixed by reading the year straight off the string. This is exactly the class of bug guardrail 13 was written for — a wrong year on someone's résumé — and it would have shipped invisibly.
- Re-ran the probe after the fix: `0:-:2016 1:2016 2:2017 3:2019 4:2020 5:2023 6:2023 7:2023 8:2024 9:2024 10:NOW 11..20:NOW`. Quarter-leg midpoints confirm the interpolation ticks over between exits, including **2021 and 2022 while crossing the sabbatical** — the gap years are visibly driven through.

**21:21-21:32 — Builder, task 2 (roadside character).** `route.js` resolves a roadside style per stop once at module load and exposes `roadsideAt(s)`, keyed off the object's own world position rather than the camera's (guardrail 17). The scenic overlook gets a guardrail and a thinned lamp line; the sabbatical thins further. Guardrails are painted with a new run-length `rail`/`railRuns` pass — the same technique `stripes()` uses, because filling each segment separately leaves anti-aliasing seams (guardrail 15). Lamp thinning keeps side alternation by deriving the side from `Math.floor(n / every)` rather than `n`.
- SSR probe confirms the mapping exactly: Start line / School zone / Career highway at `lampEvery 1` with the sabbatical at `lampEvery 3`, the eight Scenic overlook stops at `lampEvery 2` **with RAIL**, then Pit stop and Destination back to `lampEvery 1`.

**ENVIRONMENTAL BLOCKER (new, different from cycle 1's).** From ~21:05 the Chrome extension can no longer reach the dev server **at all**:
- `localhost:3001/drive` in Chrome renders a *different application of the user's* — "Virsh.shop — Operator Console" — while `curl` on the identical URL returns `<title>Hyun-Tae Jin | Drive mode</title>`, `netstat` shows this project's `next dev` owning the port, and the process command line confirms it.
- Moving the dev server to a clean port (3007) did not help: Chrome returns `ERR_CONNECTION_REFUSED` for both `127.0.0.1:3007` and `localhost:3007` while `curl` succeeds on both, on both IPv4 and IPv6.
- Conclusion: **Chrome's networking is proxied or isolated away from the shell's.** Not a code fault and not fixable from here without changing the user's browser/proxy configuration, which is out of scope and would need a prompt.
- One reading was discarded rather than reported because of this: an in-browser `?exit=banana` check returned "running", which would have looked like a defect — but the document title showed it was the user's Virsh.shop page, not this app. Checked the title before trusting the reading, threw it out, and verified that predicate in Node instead.
- **Response:** did not stop. Switched verification to `npm run build`, `next lint`, Node, and SSR probes; parked the pixel-level checks as Needs testing / Awaiting scenario; and pulled the S9b stretch task back to the Backlog rather than shipping more unverifiable canvas work.

**21:33 — Builder exit.** `npm run build` compiles (`/drive` 17.1 kB), `next lint` clean, two commits: `94eea90`, `c209b57`. Dev server restarted clean after the build per guardrail 6, now on **port 3007**. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 4 / Phase: Planner`.

---

## Cycle 4

**21:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 4`. Dev server healthy on 3007.

**21:34 — Blocker re-check (as the Awaiting-scenario item instructs): still blocked.** `curl http://127.0.0.1:3007/drive` returns the page; navigating the same URL in Chrome lands on `chrome-error://chromewebdata/`. So cycle 4 was planned deliberately around work that is **fully verifiable without pixels** — server-rendered output, which `curl` can prove — rather than shipping more canvas work blind.

**21:35 — Planner + Critic.** Read `src/pages/drive.jsx`, `src/pages/_app.jsx`, `src/components/FormattedDate.jsx` cold. Planned the S14 audit, the newly-found canonical defect, and enriching the crawlable itinerary. Added guardrails 18-20: do not edit out of scope to "fix" the canonical; do not let the enriched itinerary invent content; do not call the timezone sweep clean without a verdict per call site.

**21:36-21:40 — Task 1: timezone audit. Closed clean — the classic site is not affected.** Enumerated all eight date call sites in `src/` and classified each:
- `FormattedDate.jsx:1-5` builds `Intl.DateTimeFormat('en-US', { year:'numeric', month:'short', timeZone:'UTC' })` — pinning UTC is exactly the right defence. `:15` writes `dateTime` from `toISOString()`, always UTC. **Not affected.**
- Proven rather than reasoned: ran that exact formatter config in Node against all ten content dates while the process was in a timezone behind UTC. It renders **Jan 2024** correctly. The same process returned `2023` for `new Date('2024-01-01').getFullYear()`, which self-validates that the test really was running behind UTC.
- `route.js:7` compares instants (timezone-independent). `Intro.jsx:131` and `generateRssFeed.js:82` read the *current* year for a copyright line, where local time is the wanted semantic. `generateRssFeed.js:107` hands a `Date` to the feed library, which serialises UTC.
- **Verdict:** `route.js` was the only affected site; fixed in cycle 3. No edit, no Needs-human item.

**21:41-21:45 — Task 2: a real SEO defect, parked as Needs human.** `/drive` ships **two** `<link rel="canonical">` — `https://htae.dev` from `_app.jsx:69` and `https://htae.dev/drive` from `drive.jsx:17` — plus two `og:url` and two `og:title`. Measured directly out of the served HTML, not inferred. A crawler taking the first canonical is told `/drive` duplicates the homepage; a social scraper taking the first `og:title` previews a shared drive link as the homepage, which defeats the `?exit=` deep links from cycle 2. Cause: `next/head` only dedupes tags carrying a matching `key`, and neither side sets one. The fix belongs in `_app.jsx`, which is outside this run's write scope, so it is parked as **Needs human** with the exact patch and a one-line verification command. Deliberately did **not** bodge a key into `drive.jsx` alone — without the `_app` side it changes nothing and would have *looked* fixed.

**21:46-21:52 — Task 3: years and structure in the crawlable itinerary.** The `sr-only` block is the only version of this résumé a crawler or screen reader can consume. It now groups stops under their leg (h1 route -> h2 leg -> h3 stop) using the `legsOf()` helper `route.js` already exported but nothing consumed, and carries a `<time>` year for every dated stop.
- Verified by reading the served HTML back: six `<h2>` leg headings, 21 `<h3>` stop headings, exactly ten `<time>` elements reading `2016 2017 2019 2020 2023 2023 2023 2024 2024 2025`. That matches education plus the nine roles and includes the January-2024 role the cycle-3 fix corrected. The eleven undated stops carry no year.

**21:53 — Builder exit.** `next lint` clean, one commit `e799e92`; task 1 closed with no code change, task 2 parked as Needs human. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 5 / Phase: Planner`.

---

## Cycle 5

**22:03 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 5`.

**22:04 — Blocker re-check: still blocked (third cycle).** `curl` serves `/drive`; the browser lands on `chrome-error://chromewebdata/`.

**22:05 — Backlog ran dry of browser-free work, so the loop went to Suggester.** Every remaining backlog item needs pixels (S9b, S13), needs a browser to verify (S5, S8), or is blocked behind the Needs-human canonical fix (S15). Per the controller that is the Suggester's cue. Ran a fresh audit over the one surface still available — the served HTML — and it surfaced three defects, each measured rather than guessed:
1. **0 of 11 buttons had an `aria-label`.** They announced as their symbol text: `◂ Back` reads as "left-pointing small triangle Back", `GO↑ / W` as "GO up-arrow slash W".
2. **The decorative instruments were in the accessibility tree.** `drive_screen__…` rendered with no `aria-hidden`, the gauge faces (`<svg viewBox="0 0 100 100">`) with none, the gear selector's `P` span with none — so `x1000 0 mph P R N D gear ~/route $ drive --to yr 2016 odo 0.0 mi` was all announced, badly duplicating what the itinerary already says properly.
3. **Two `<h1>` elements** competed to describe the page — the itinerary's (the real content) and the ignition splash's.
Also found, but out of scope: **`/drive` is missing from `public/sitemap.xml`**, which lists only the site root.

**22:06 — Critic.** Added guardrails 21-22: hide only decoration, never a control or the arrival panel, and re-read the HTML afterwards to prove content is still exposed; and never write an `aria-label` that contradicts the visible text, or voice-control users cannot say what they see.

**22:07-22:20 — Builder, tasks 1 and 2.** Labels keep the visible word and expand it ("Back to the previous exit", "Drive on to the next exit", "Open the route map", "Brake", "Go — hold to accelerate"), applied across *both* cockpit layouts. Gauges, gear selectors and trip-computer screens marked `aria-hidden`. Ignition heading demoted to `<h2>`.
- **Verified against the served HTML:** exactly one `<h1>`; 10 of 11 buttons labelled, and the single unlabelled one enumerated explicitly to confirm it is "Start engine", whose visible text is already a correct accessible name; `aria-hidden` count 12 → 19 (3 gauges + 2 trip screens + 2 gear selectors); itinerary still exposed with all ten `<time>` years.

**Mid-cycle incident — the dev server hung, the code was fine.** After the edits, `curl` on `/drive` timed out at 10s with `status=000` while the dev log sat on `wait compiling /drive…`. Rather than assume my change caused it, I killed the server and ran `next lint` (clean) and `npm run build` (compiled successfully, `/drive` 17.2 kB) — both of which are independent of the dev server. That exonerated the code; `dev:fresh` then cleared it. Third distinct way the `.next` cache has produced a convincing fake defect tonight, and the reason guardrail 6 exists.

**22:21 — Task 3 parked as Needs human.** `public/sitemap.xml` is outside the write scope (`public/images/` only). Documented with the exact `<url>` entry to add and a one-line verification. Noted explicitly that it **compounds** with the cycle-4 canonical defect: drive mode is currently unlisted in the sitemap *and* disowned by its own canonical, so fixing only one will not surface the page.

**22:22 — Builder exit.** Lint clean, build clean, one commit `5fcf996`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 6 / Phase: Planner`.

---

## Cycle 6 — the Reviewer cycle

**22:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 6`.

**22:35 — THE NETWORK BLOCKER CLEARED.** Chrome loaded `http://127.0.0.1:3007/drive`, rendered the canvas, reported 12 buttons and a dash measuring 342px, and a screenshot came back with real pixels — golden-hour dusk at MILE 0 with **YR 2016** live on the trip computer. After three cycles of working blind, pixel verification was available again, so this cycle became a **Reviewer** cycle: clear the parked visual work rather than start new features.

**22:40-22:55 — A convincing false alarm, chased to ground.** `?exit=10` and then `?exit=12` came up on the ignition screen with no panel — i.e. the cycle-2 deep link appeared to have regressed. It had not:
- `document.body.style.overflow` was **unset**, meaning `DriveScene`'s first effect had never run — **React had not hydrated**.
- Plain `/drive` with no query behaved identically, which ruled out the deep-link code.
- All eight JS chunks fetched **200**; the console reported nothing.
- Clicking "Start engine" did nothing, confirming the page was inert rather than mis-routed.
Rebuilt the same commit and served it with `npm run start` on port 3008: hydrated immediately, `?exit=12` landed parked on **EXIT 12 · Matrimoni** with the panel open, the carousel already cycling at 2/5, and the trip computer reading **`yr NOW`**. **No code defect existed** — this project's `next dev` intermittently serves correct HTML that never hydrates. Recorded as guardrail 23, with the standing instruction to verify against a production build.

**22:56-23:05 — Cleared the cycle-3 parked item (per-leg roadside character).** Against the production build:
- **Guardrail ribbon:** at EXIT 12/13 in the Scenic overlook it runs along the right verge as **one continuous band with no anti-aliasing seams**, confirmed by zooming the verge — precisely what the run-length `railRuns` pass was written to guarantee (guardrail 15).
- **Lamp thinning:** visibly sparser through the overlook than the career highway, and sparser again approaching EXIT 04, the sabbatical — matching the SSR mapping proven in cycle 3.
- **No guardrail outside the overlook:** confirmed at EXIT 04.
- **No popping** observed on approach, consistent with the style being keyed off each object's own world position (guardrail 17).
- **Frame rate: could not be measured.** Two rAF-timing attempts timed out the CDP call at 45s. Cause identified rather than guessed: every tab reports `document.hidden === true`, and `requestAnimationFrame` is paused in a background tab, so a loop awaiting N frames never resolves. Recorded as guardrail 24 and left as the single residual Needs-testing item.

**23:06 — Backlog unblocked.** S9b (mile markers), S13 (weather/traffic), S8 (persist progress) and S5 (audio) had all been held pending browser verification. That condition has arrived, so they are marked **UNBLOCKED** for cycle 7, with a standing note to verify against a production build rather than `next dev`.

**23:07 — Cycle exit.** No code changed this cycle — it was a verification cycle, and the honest outcome was that the thing that looked broken was not. -> the controller advanced to `Cycle: 7 / Phase: Planner`.

---

## Cycle 7

**23:03 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 7`. Production server healthy on :3008. With pixels verifiable again, the two canvas ideas held since cycle 2/3 were finally buildable — both addressing the same complaint: **the road is completely empty**, and the 220m legs have nothing marking progress.

**23:05 — Critic.** Added guardrails 25-27: keep traffic deterministic and pre-allocated with a clamped frame delta; keep vehicles on the opposite carriageway and never behind the camera; and make mile markers far sparser and visually distinct from the 24m delineator line — **checked in a screenshot rather than assumed**.

**23:08-23:30 — Builder.** Both features in `RoadCanvas`. Traffic closes at its own speed plus yours, so cars keep passing while you sit at an exit, and takes its colour from the route palette.

**Guardrail 27 earned its place immediately.** The first mile markers were authored at 0.5m x 0.36m, which projects to about **2x1 pixels** at distance — in the zoom they were a single speck, completely indistinguishable from the delineator reflectors. Had I assumed rather than looked, that would have shipped as "done". Enlarged to 0.95m x 0.7m, raised to 1.9m and moved outboard to `ROAD_HALF + 2.5`; they now read as distinct green plates on posts.

**Verifying the traffic needed a trick, because rAF is dead here.** A short frame-timing probe returned **0 frames in 8 seconds** — `requestAnimationFrame` is fully paused while `document.hidden` is true, so the scene only paints in bursts when CDP or a screenshot pokes the renderer. That rules out watching motion directly. Instead I used a **controlled pixel diff**: with the car *parked* the entire canvas is static — travel is constant, so the palette, road, lamps and markers cannot change — which means anything that differs between two captures is the traffic and nothing else. Two `getImageData` captures either side of 45 forced repaints differed in **12,564 sampled pixels**, confined to a compact box (CSS px 809-968 x 357-500) near the vanishing point extending down and to the left: exactly the approach path of oncoming headlights. That is proof of both rendering *and* motion without ever seeing an animation.
- A follow-up screenshot showed the bulbs were only ~2-4px, i.e. present but not legible as headlights, so they were enlarged and the halo strengthened. **Presence is not legibility** — worth separating those two questions in future canvas work.

**23:32 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 17.6 kB), verified against a production build with hydration confirmed first (guardrail 23). One commit: `ff1f8d9`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 8 / Phase: Planner`.

---

## Cycle 8

**23:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 8`. Production server healthy on :3008.

**23:34 — Frame-rate item re-checked, still unmeasurable.** A 20-frame probe returned **0 frames in 6 seconds** with `visibilityState: 'hidden'`. Stays parked; nothing else can be done about it from here.

**23:35 — Planner + Critic.** Picked S8 (resume progress) as the most valuable actionable item — it is the most likely reason someone abandons a 21-exit page on a second visit. Wrote guardrails 28-32 before building: never read storage during render (hydration); wrap every access because `localStorage` *throws* in Safari private mode and with cookies blocked; version the key and validate the restored index against the stop id, because the route is derived from content; never auto-apply progress; never write from the frame loop.

**23:38-23:55 — Builder.** New `src/components/drive/progress.js` plus wiring in `DriveScene`. The design decision worth recording: progress is **offered, never applied**. A returning visitor sees "Resume · EXIT 13 / Co.Lab Portfolio App" beside *Start engine*, with "Forget my progress" underneath. Auto-jumping would take away their choice and hide the start of the route; this way nobody is trapped by state they did not ask for, and a fresh start is one click away. An explicit `?exit=` deep link always wins — that visitor asked for that exit specifically.

**23:56-00:05 — Verified against a production build, reading `localStorage` directly rather than inferring:**
- clean first visit — nothing stored, no Resume, no Forget;
- drove to EXIT 13 — stored exactly `{"index":13,"id":"project-co-lab-portfolio"}`;
- `?exit=5` — landed on EXIT 05, Resume *not* offered, and the stored `13` survived untouched (the write is forward-only, so an earlier exit cannot clobber a later one);
- plain load — offered "Resume · EXIT 13", confirmed in a screenshot, and clicking it landed on EXIT 13 with the URL set to `?exit=13`;
- Forget — cleared the offer and the key, restoring the first-visit screen.

**Hostile-storage cases, each armed and reloaded through the real code path** (guardrails 29-30): a **stale id** (`index 13` pointing at a stop id that no longer exists), **unparseable JSON**, and **index 999**. All three fell back to "no offer" with the page alive and hydrated — none threw, none restored a bogus position. That last case matters most: the route is built from content, so a stored index means nothing on its own once a role is added or removed.

**00:06 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 18.1 kB). One commit: `4ebe999`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 9 / Phase: Planner`.

---

## Cycle 9

**00:03 local (2026-08-06) — Relief shift took the baton.** `Phase: Planner`, `Cycle: 9`. Production server healthy on :3008. Backlog down to one actionable item (S5 audio), one blocked (S15), one deliberately deferred (S13b).

**00:04-00:15 — Task 1: phone-width regression sweep, and a false positive I did not act on.** The phone cockpit had last been verified in **cycle 1**; since then the daylight system, traffic, mile markers, the aria pass and the resume UI had all landed, and the resume buttons had only ever been seen at desktop width. Measured at 386x840 against production: hydrated, **no horizontal overflow**, cluster strip and trip screen correct, arrival panel present and internally scrollable (472px of content in a 291px scroller), screenshot frame at its native 2:1, resume UI stacking correctly. **No regressions.**
- The near-miss worth recording: the panel measured **26px into the dash**, which looked like a clear overlap and would have been a plausible thing to "fix" by nudging the panel up. Its computed transform was `matrix3d(0.97, …, 26, 0, 1)` — framer-motion's *initial* state (`translateY 26`, `rotateX 10°`, `scale .97`) never advancing, because rAF is paused in a hidden tab. Neutralising the transform showed the settled layout at 118→538 against a dash top of 538: flush, zero overlap. Compensating for that would have permanently mis-positioned the panel for every real user. Recorded as guardrail 36: check `getComputedStyle(el).transform` before believing a measured overlap.

**00:16-00:25 — Task 2: opt-in engine audio (S5).** New `engineAudio.js`: two oscillators an octave apart through a lowpass following the revs, plus filtered noise following speed. All synthesised — no samples, no dependency. The conservative choices are the point: the `AudioContext` is constructed **inside the toggle's click handler**, and the preference is **deliberately not persisted**, because a stored "on" would attempt playback on the next visit before any gesture exists.

**00:26-00:40 — Verified by spying on the `AudioContext` constructor** from the parent frame (the same pre-hydration race used for `matchMedia` in cycle 2):
- **zero contexts before any gesture**;
- pressing the toggle creates **exactly one**;
- toggling off then on again **reuses that same one** — no leak (guardrail 35);
- unmounting (navigating the frame away) moves it to **`closed`**;
- storage contains only `htae.drive.progress.v1` — no audio key, so nothing can autostart later (guardrail 33).

**Verification caught a real flaw.** The toggle originally set itself "on" unconditionally. Under a synthetic click the context stayed `suspended` — browsers require genuine user activation — yet the button reported **on**, i.e. lit over silence. Fixed: `enable()` is now async and resolves to whether the context actually reached `running`, and the toggle reports that. Re-verified after the fix: context `suspended`, button correctly **off**.

**Honest limitation.** Audible output and the rpm→frequency mapping cannot be checked here: a synthetic click grants no user activation, so the context never runs and `update()` correctly early-returns. Parked as **Needs testing** for a real press in a foreground window.

**00:42 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19 kB). One commit: `655a3ce`. The backlog is now down to S15 (blocked behind the Needs-human canonical fix) and S13b (deliberately deferred) — so cycle 10 will need a fresh **Suggester** pass. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 10 / Phase: Planner`.

---

## Cycle 10

**00:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 10`. Backlog confirmed dry (S15 blocked behind the Needs-human canonical fix, S13b deliberately held), so per the controller this became a **Suggester** cycle. Audited two surfaces never examined in nine cycles: `RouteMap.jsx`, and — because it bears on the user's stated priority (c) — the **classic site's** project cards.

**00:36-00:45 — The most important finding of the night: priority (c) is only half-fixed.** The original brief asked for project photos that are not cut off and that cycle automatically with a smooth fade. That was delivered in **drive mode** in cycle 1. The **main portfolio page** still has both faults:
- `src/components/Projects.jsx:97` frames the image `aspect-video` (16:9) and `:120` renders it `object-cover`. Rather than estimate, I computed it against the real files: **all 28** screenshots in `public/images/projects/` are wider than 16:9, so `object-cover` discards **10.1%** of each image's width on average and **14.2%** at worst — both edges of every screenshot are cut.
- `grep -nE "setInterval|setTimeout|useEffect"` on that file returns **nothing**; advancing happens only in `handleScreenshotClick`, so a visitor who never clicks sees one screenshot out of up to five.
An in-browser measurement was attempted first but was inconclusive — the images lazy-load via IntersectionObserver, which is throttled in a hidden tab — so the finding rests on the source plus the measured file dimensions, which is arithmetic rather than inference. `src/components/Projects.jsx` is outside this run's write scope and the user has their own uncommitted edits nearby, so it is parked as **Needs human** with an exact patch, starred at the top of that section.

**00:46-00:52 — Task 1: the route map was lying about being a modal.** It renders `role="dialog" aria-modal="true"`, which tells assistive technology the page behind is inert. Measured with the map open: **23** tabbable elements inside it, and `dialog.contains(document.activeElement)` **false** — focus had never left the cockpit behind the overlay. Added focus-in on open, a Tab/Shift+Tab cycle, and restore-on-close. Escape was deliberately left alone (guardrail 37): `DriveScene` binds it globally with the driving keys, so the trap only ever `preventDefault`s Tab.

**00:53-01:05 — Verified by reading `document.activeElement` at each step:** opening moves focus to the panel (twice confirmed); Tab from the last item wraps to the first; Shift+Tab from the first wraps to the last; both stay inside the panel; Escape still closes the dialog.
- **Not verifiable here:** focus-restore-on-close. Programmatic `.focus()` on the trigger button does not stick without OS window focus, so `<body>` is what gets captured at open and dutifully restored at close — correct behaviour, but unobservable. Added to Needs testing rather than claimed as done.
- Along the way, two Escape presses appeared not to close the dialog before a later one did. Rather than call that a bug, the likely cause was identified: React 18 schedules updates through the scheduler, which is throttled along with rAF in a hidden tab, so state changes flush late. A subsequent run with longer waits confirmed Escape closes it.

**01:06 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.3 kB). One commit: `09fe15d`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 11 / Phase: Planner`.

---

## Cycle 11

**01:03 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 11`. Backlog dry again (S15 blocked, S13b held), so another **Suggester** pass — which found a regression this run itself had introduced.

**01:05 — The finding: my own cycle-7 traffic ignored `prefers-reduced-motion`.** Drive mode honours that preference deliberately and consistently — `useDrive.js:227,244` makes the throttle *jump* to the next exit instead of animating travel, `ProjectShots.jsx:41` disables carousel autoplay, `StopCard.jsx:151,157` swaps the projecting entry for a plain fade, and `drive.module.css:329` kills the star twinkle, ignition pulse and blink. `grep -c reducedMotion src/components/drive/RoadCanvas.jsx` returned **0**. Because the cars advance from `performance.now()` deltas rather than from `sim.travel`, a visitor who had asked their system for less motion still got headlights sliding toward them **while stationary at a stop** — precisely what the preference exists to prevent.

**01:08 — Decision recorded:** under reduced motion, *don't draw* the traffic rather than freeze it. Frozen cars sitting in a live carriageway would read as wreckage; an absent one simply restores the empty road the page had before cycle 7, which is a coherent state.

**01:10-01:40 — Verified by single-frame pixel comparison.** Movement could not be watched (rAF is paused here), and this time `setTimeout` was throttled too, so the repeated-repaint technique from cycle 7 blew the 45s CDP budget. A cleaner method suited the question anyway: the scene is **fully deterministic at a given exit**, so two loads of `?exit=6` — one with `matchMedia` patched before hydration to report reduced motion, one without — can differ *only* where traffic is drawn. Result: **185 changed samples in a 30x32px box at the vanishing point**, every other pixel identical. That identity is itself the control: it confirms the rest of the frame is deterministic and the method sound.

**Two environment lessons worth carrying:** a `setInterval(..., 0)` spy left running starved the main thread and produced three consecutive 45s CDP timeouts that looked like a frozen renderer — sweeping stray interval ids fixed it instantly. And in a backgrounded tab `setTimeout` is clamped hard, so any verification built on a loop of short awaits will time out; prefer a single deterministic comparison over a temporal one.

**01:42 — Task 2: swept the whole reduced-motion contract, which no cycle had done together.** All four hold: traffic absent; **throttle jumped `EXIT 06 -> EXIT 07`** with no intermediate driving state and `ARRIVED` on both sides, confirming the jump substitution; the **arrival panel** computed `transform: none`, i.e. the opacity-only variant; and the **carousel** was already proven in cycle 2.

**01:45 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.3 kB). One commit: `eef571b`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 12 / Phase: Planner`.

---

## Cycle 12

**01:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 12`. Backlog still held, so another **Suggester** pass over two things nobody had checked: focus visibility, and **landscape phone** — a viewport a driving interface is unusually likely to meet.

**01:36 — Focus visibility: investigated, no defect.** Drive mode defines no focus styles of its own and every control computed `outline-style: none` — damning until you notice the readings came from **programmatic** `.focus()`, and `:focus-visible` deliberately does not match scripted focus. A grep across `tailwind.css`, `base.css`, `components.css`, `utilities.css` and every drive component found **no author rule removing outlines**, so the browser default ring applies for real keyboard focus. Recorded as guardrail 45 and closed without a change.

**01:40 — Landscape phone: a real defect, and its cause was arithmetic.** At 840x386 the arrival panel ran **71px underneath the dashboard**, hiding the bottom of the résumé content, and the drivable glass was down to **45.6%** — under guardrail 3's 50% floor. The overlap survived the guardrail-36 frozen-transform check (neutralising the transform left the settled panel in an identical box), so it was layout, not animation.
- **Root cause:** the dash height was expressed **twice, in different units** — `Dashboard` as `h-[36%] min-h-[210px]`, `DriveScene` as `bottom-[36%]`. On a 386px-tall viewport 36% is 139px, so the dash's **pixel floor won at 210px** while the panel reserved 139px. 210 - 139 = **71px**, exactly the overlap measured — which is what turned a plausible story into a confirmed one.
- **Fix:** one expression, `clamp(190px,36%,48%)`, consumed by both sides so they cannot drift apart again (guardrail 43). The 190px floor keeps the stacked phone cockpit usable, 36% is the intended share, and the 48% cap stops the floor eating the road on short screens.
- **Result:** overlap **71 -> 0**, glass **45.6% -> 50.8%**. No regression elsewhere: 1916x946 unchanged at 36% dash / 64% glass with 32px clearance; 386x840 unchanged at 36% / 64%.

**01:52 — A second alarm, investigated and dismissed.** The guardrail-44 check flagged a control **156px below the viewport**. Rather than shrink anything I measured what it was: the **`sr-only` itinerary's** per-stop "Live site"/"Source" links, marching down the document ~144px apart — visually hidden crawlable content doing exactly what it should. The cockpit's own stack was then measured directly and fits precisely inside the dash (cluster 206-280, trip computer compressed to 20px by `min-h-0 flex-1`, controls 316-378, dash 196-386). Acting on that alarm would have shrunk a cockpit that was already correct.

**01:58 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.3 kB). One commit: `c71b624`. Two of four findings were real and fixed; two were investigated and closed without a change. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 13 / Phase: Planner`.

---

## Cycle 13 — owner feedback, mid-run

**The owner interrupted the loop with two corrections, both of my own decisions.** They take precedence over anything the loop planned, and both are now recorded at the top of the Guardrails block as standing law.

**1. "you've put unnecessary opposing traffic in a portfolio site that should represent me."** Correct, and the reasoning behind adding it was wrong-headed: in cycle 7 I justified traffic as stopping the road feeling like a treadmill. But manufactured incident on the far carriageway is set-dressing for a driving game, not for a page whose job is to represent one person's work. Removed completely — constants, per-frame car state, `drawOncoming`, and the `reducedMotion` prop on `RoadCanvas` that existed *solely* to suppress traffic for reduced-motion users (with the traffic gone it had no remaining purpose). S13b (drifting haze) is closed as unwanted for the same reason: the instruction is to take invented atmosphere *off* the road, not add more.

**2. "i dislike how the car starts in the middle of the road"** — followed mid-turn by **"you also make me steer right back into the middle of the road instead of the middle of the lane of traffic im supposed to be in."** Both symptoms, one cause. The camera's lateral position was `sim.x`, and lateral **0 is the centre line** — so the car straddled it. Worse, `useDrive` decays `sim.x` toward 0 when you release the steering keys, so the game was *actively steering you back onto the centre line*. The second message named that precisely.
- **Fix:** the camera is now `cameraX(sim) = LANE_OFFSET + sim.x`, `LANE_OFFSET = 2.7` — the midpoint of the right-hand lane (the road spans -5.5..5.5 with the centre line at 0, so the right lane's midpoint is 2.75). `sim.x` becomes drift *within* the lane, so the existing re-centring now returns you to the middle of your lane, which is what it should always have meant.
- Steering clamp tightened from ±3.4 to ±2.3 to match the new frame of reference: full left is 0.4m (just inside the centre line), full right is 5.0m (on the edge line). You can no longer wander onto the oncoming side or off the shoulder.
- Expressed **once** in `world.js` and consumed by all four camera-relative call sites — road ribbon, roadside furniture, exit signs, `project()` — so nothing can disagree about where the car is (the same discipline that fixed cycle 12's dash-height bug).

**Verified against a production build:** the yellow centre line now runs down the **left** of the view with the white edge line on the right, and the road's vanishing point sits slightly left of screen centre — which is where it belongs when you are seated to the right of the road's centreline, and incidentally makes the left-of-centre steering wheel read correctly for the first time. `next lint` clean, `npm run build` compiles (`/drive` 19 kB, down from 19.3). Commit `d76e0bd`.

---

## Cycle 14

**02:03 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 15`... read as `Cycle: 14`. Backlog dry (S15 blocked, S13b closed by the owner), so a **Suggester** pass — but it began with a self-check rather than a hunt for new work.

**02:05 — Regression check on my own cycle-13 change first.** Cycle 13 rewrote camera lateral maths in four places at the owner's request, and `ExitSign` is a DOM overlay positioned independently of the canvas — the likeliest thing to have broken silently. **No regression:** at EXIT 07 the sign's twin posts still meet the ground at the roadside, and the lane markings read correctly with the yellow centre line to the left and the white edge line to the right. The first-run flow was exercised end to end too — Start engine, hold the accelerator as the screen instructs, depart, arrive at EXIT 01 with the panel open.

**02:12 — Re-read the owner's original priorities and found (b) under-served.** Priority (b) was *"the destination-arrival panel needs work"*. Cycle 1 rebuilt the arrival panel **in general**, but nobody had ever looked at the **destination stop itself** — which is the conversion moment, the thing a recruiter reaches after driving twenty-one exits.
- **The defect, observed at `?exit=20`:** all four actions rendered identically, so **"Email hytjin@gmail.com" carried exactly the same visual weight as "Back to the classic site"**. The goal and the exit door were indistinguishable and the eye had nothing to land on. Nothing about the panel marked the end of a journey either.
- **Fixed:** the email is now the primary action and looks it; LinkedIn and the résumé stay secondary; the classic-site link drops to a quiet text link rather than a peer of the contact actions; and a short summary of the trip sits above them.

**The constraint that shaped the summary:** guardrail 13 — never put a number on someone's résumé that was not derived from their content. So the figures come from the route itself (counts of `kind === 'experience'` and `kind === 'project'` stops), from `education.date`, and from `routeLength`. Nothing is typed in, and adding a role or a build updates them automatically. The owner's own prose was left exactly as written; the summary sits alongside it rather than replacing it.

**Verified against a production build:** rendered **2016 / 9 / 8 / 2.7**, checked independently against the content — 9 ids in `experience.js`, 8 names in `projects.js`, `education.date` 2016, 21 stops x 220m = 2.7 mi. All four match. Link hierarchy reads PRIMARY / secondary / secondary / quiet. EXIT 11 re-checked to confirm no collateral change: no summary, both links still secondary.

**02:30 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.3 kB). One commit: `b6f444f`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 15 / Phase: Planner`.

---

## Cycle 15

**02:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 15`. Backlog dry (S15 blocked, S13b closed by the owner). Since the owner's cycle-13 steer was explicitly *against* unnecessary additions, this **Suggester** pass deliberately hunted the opposite: duplication, and code that lies about itself.

**02:36 — The finding: `world.project()` was dead, and its documentation was false.** The module header read *"Everything on screen — tarmac, poles, exit signs — is placed with `project()` so the canvas and the DOM overlays always agree."* A grep for `project(` outside `world.js` returned **nothing**. Three sites hand-rolled the same maths independently: `RoadCanvas.buildPoints`, `RoadCanvas.place`, `ExitSign.paint`. All three are algebraically identical to `project(camera, sim, z, x, y)` — I checked term by term before touching anything.
- **Why it mattered more than tidiness:** this is precisely the shape that has already cost this branch twice — the dash height written twice in different units (cycle 12, a 71px overlap that hid résumé content on landscape phones) and the camera lateral written four times (cycle 13, which produced the owner's centre-line complaint). A comment asserting a single source of truth that does not exist actively misleads whoever changes the projection next.

**02:42 — Deliberately not a blind DRY sweep.** `buildPoints` runs SEGMENTS+1 = 131 times per frame, writes into **pre-allocated** point objects, and hoists `curveAt(sim.travel)`/`hillAt(sim.travel)` out of its loop. Routing it through `project()` would have added 131 allocations *and* 131 redundant trig pairs every frame — trading guardrail 9 for neatness. So: `ExitSign` (one call per frame, free) and `place` (already allocated per call, so neutral) now go through `project()`; `buildPoints` stays inlined **with a comment stating why**, turning accidental duplication into a documented, justified exception. The module doc was rewritten to describe what is actually true and to name that exception.

**02:50-03:05 — Verified as a genuine A/B rather than by inspection.** A first attempt lost its baseline when the tab navigated between builds, so the comparison was redone properly: `git stash` the refactor -> rebuild -> capture a canvas frame from the **pre-refactor** build into the parent window (which never navigates) -> `git stash pop` -> rebuild -> capture again at the same exit. Result: **0 of 1,992,704 pixels differ, max channel delta 0.** For a pure refactor that is the only acceptable answer. The exit sign sits outside that canvas diff, being a DOM overlay, so it was checked separately: it still projects to a finite, correctly-scaled on-screen position (`translate(475px, 234px) scale(0.0508)` at 0.1 MI out).

**03:07 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.4 kB). One commit: `e23a9db`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 16 / Phase: Planner`.

## Cycle 16

**06:2x local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 16`. Backlog dry again, so a **Suggester** pass aimed at the *seams between* features this run built separately, rather than at new surface.

**The finding: resuming makes the route map contradict itself.** Seeded progress at EXIT 13, loaded plain `/drive`, took the offered *"Resume · EXIT 13"*, opened the map — exactly **2 of 21** rows read "driven": `MILE 0` and `EXIT 13`. The app was telling the same visitor, one click apart, both that they had reached exit 13 and that they had never driven exits 01-12. `useDrive.js:56` starts `visited` as `new Set([0])` and only ever adds on `arriveAt`.

**Why the fix is safe to infer:** `progress.js` writes only inside the arrival path and `writeProgress` returns early unless the new index exceeds the stored one — progress is therefore *arrival-only and forward-only*, which makes a stored index of 13 proof of arrival at every exit before it. That is an observed property of the code, not an assumption about the visitor.

**The distinction that was the actual point:** this had to apply to **resume only**. A `?exit=11` deep link is proof of a click, not of a drive, so it must keep marking just the one exit. `markVisitedThrough` therefore lives on the hook but is called from exactly one place — `resumeDrive` — and the JSDoc says why, so a future cycle doesn't "helpfully" wire it into the deep-link effect too.

**Verified on a production build at `:3008`, all three cases, hydration confirmed each time:**
- resume to EXIT 13 → **14 of 21** driven, `MILE 0` through `EXIT 13`, contiguous;
- deep link `?exit=13` with the same storage → exactly `MILE 0` + `EXIT 13`;
- fresh visit, storage cleared → `MILE 0` only, and no resume offer rendered.

**Second item, deliberately not built.** While parked, `RoadCanvas.draw()` still repaints every frame and produces a provably identical image — since traffic was removed (cycle 13) the drawing is a pure function of `travel`, `x` and the camera, all constant while parked. The fix is a cheap dirty-check, but its *benefit* cannot be measured in this environment (rAF suspended in a backgrounded tab; the only forced repaint is a resize, which must bypass the check because setting `canvas.width` clears the backing store). Shipping an unmeasurable optimisation into a hot path is guardrail 9's exact failure mode, so it was written to the Backlog as **S16a** with the reasoning attached instead.

**Builder + Reviewer exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.4 kB). One commit: `f0b7c6c`. Both cycle-16 tasks resolved **Done**. -> controller advanced to `Cycle: 17 / Phase: Planner`.

## Cycle 17

**Suggester.** Backlog dry (S15 blocked, S16a waiting on a foreground window, S13b closed). This pass deliberately left the canvas alone and looked at what the page says through the channels that are *not* the canvas — the tab, the history entry, and what a screen reader hears — on the grounds that on a page which is almost entirely `<canvas>`, those are the only channels some visitors have.

**Finding 1 (measured, not inferred).** Drove EXIT 13 -> EXIT 14 on the production build. `location.href` changed; `document.title` was `"Hyun-Tae Jin | Drive mode"` **before and after**. Then the sharper half: the only `[aria-live]` element on the page while driving is Next's own route announcer, and it is `aria-live="assertive"`. `router.replace(..., {shallow:true})` fires on every departure, so a screen-reader user gets that same string barked at them on all twenty legs and is never told which exit it is. One change fixes both, because the announcer reads `document.title`.

**Finding 2 (measured).** Captured the `aria-live` node before and after an exit change: **different nodes**, and mid-drive there is no polite region on the page at all. `StopCard` carries the attribute but sits inside `AnimatePresence` keyed by `stop.id`, so it is destroyed and rebuilt on every arrival — the documented case where a live region announces nothing. The attribute was reading as an accessibility feature while doing nothing.

**Built.** A per-stop `next/head` title in `DriveScene`, rendered only once under way (before that the ignition splash is the page). A permanently mounted `role="status" aria-live="polite"` region alongside the itinerary. The dead attribute removed from `StopCard`, with a comment naming its replacement so it does not come back.

**Caught in verification, not in review.** The first build produced `"MILE 0 · Hyun-Tae Jin | Hyun-Tae Jin"` — stop 0's own title *is* the owner's name, so appending the brand doubled it. `titleFor` now omits the brand in that one case. This is exactly the class of thing that only shows up when you look at the real output.

**Verified on the production build at `:3008`:** titles distinct across EXIT 14 / MILE 0 / EXIT 20; `curl` confirms the served HTML still carries the page-level `<title>` (guardrail 46 — the DOM would have lied here, since it shows the client's value); the status region is the **same DOM node** across three arrivals while its text changes (guardrail 47); exactly one status region; no `aria-live` on any remounting node; MILE 0 announces *"At the start line"*, not an arrival (guardrail 48).

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.6 kB). One commit: `aafb4d9`. Both tasks **Done**. -> `Cycle: 18 / Phase: Planner`.

## Cycle 18

**Suggester.** Backlog dry. This pass went deliberately back to the **owner's own priority (a)** — *"the car interior dash needs work ... think of what a car should look like from driving perspective"* — instead of drifting further into peripheral polish, and compared the rendered cockpit against the geometry the road is actually drawn with.

**The finding, measured in two halves.** Ran `world.js` under Node and projected the road centre at increasing distance: `z=10 -> x=759`, `z=100 -> x=945`, `z=20000 -> x=960.14`, `z=1e6 -> x=960.00`, against a screen centre of 960. The vanishing point converges **exactly** on the middle of the image — it has to, because `project()` puts the principal point at `width/2` and divides the lateral offset by `z`. The camera is the driver's eye, so the eyeline is the middle of the viewport. Then measured the cockpit in the browser at 1920: steering wheel centred at **615 (32.0%)**, binnacle at 27—32%, but mirror at **960 (50.0%)** and the glass, pillars and headliner symmetric about 960. The wheel was **345px — 18% of the viewport — left of the driver's own eye**. You were sitting in the passenger seat looking across at the wheel.

**The comment that hid it.** `world.js` justified the framing with *"the road's vanishing point falls slightly left of screen centre, which is exactly where it belongs when you are sitting to the right of the road's centreline."* The probe shows that is false: what falls left of centre is the road's *near* field (-201px at 10m), which is correct and is what makes the centre line run down the left. The vanishing point does not move. A false sentence was the stated reason the cockpit was framed that way — the same defect shape as cycle 15, and load-bearing.

**Built.** The desktop dash became a grid whose **middle column is the steering column**, so the wheel is centred on the eyeline by construction at any width. No maths changed (guardrail 49 — adding a principal-point offset to `project()` would have shoved the road into the left third of the windscreen).

**The consequence I had to then deal with.** Centring the wheel costs a column: the driver's left went blank, and a third of the dash reading as a void would have been a regression on the very priority this task was serving. Filled with a door card — card face angling away, armrest edge catching the cowl light, sunk pull — because that is what is beside you, not more dashboard. Quiet, no controls (guardrail 52).

**And the width risk.** An equal door column at `lg` would squeeze the console: computed, the centre stack drops from ~398px to ~224px at 1024. So the full-width door column is `xl`-and-up; `lg`—`xl` narrows it to `0.42fr`, correcting most of the offset without squeezing anything.

**Verified on the production build at 1920x895:** wheel centre **960**, offset **0** from the eyeline (guardrail 50 — measured with `getBoundingClientRect()`, not eyeballed); wheel/console overlap **0**; panel/dash overlap **0**; no horizontal scroll; screenshot confirms the wheel sits under the driver's eye with the console to its right and the door to its left.

**Honest gap.** `resize_window` reported success but `innerWidth` stayed 1920, so narrower widths could not be rendered this session. The phone block was not touched and the `lg` band was reasoned about arithmetically, but that is not a screenshot — parked as **Needs testing** rather than claimed (guardrail 51).

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.6 kB). One commit: `4d24fd9`. -> `Cycle: 19 / Phase: Planner`.

## Cycle 19

**Planner.** No Suggester pass — the controller found actionable work already open: cycle 18 shipped a layout change verified at exactly one viewport, which is what guardrail 51 exists to catch.

**The technique.** `resize_window` reported success last shift but `innerWidth` stayed 1920, so no narrow viewport was ever actually rendered. Instead `/drive` was loaded into a **same-origin iframe** of an explicit size: an iframe is its own viewport, so media queries and `vw` resolve against the frame, and because it is same-origin its `contentDocument` can be measured exactly like a top-level page.

**Proving the technique before trusting it (guardrail 53).** `contentWindow.innerWidth` read **1100** while the host window read **1920**, and the `lg:hidden` phone block computed `display: none` at 1100 and `flex` at 390. The frame is genuinely its own viewport and the Tailwind breakpoints genuinely applied. Hydration was confirmed inside each frame (guardrail 54) and every panel measurement was taken with `transform: none` (guardrail 55 — the trap from cycle 9).

**1100x800.** Console buttons on **one row** (Back 78 + Next 77 + Route map 105 + toggle), trip computer 356px wide, wheel/console overlap **0**, panel/dash overlap **0**, nothing overflowing right or bottom, no horizontal scroll. Screenshot confirms the door card, binnacle, wheel, console and pedals all read correctly. The wheel sits **153px (13.9%)** short of the eyeline — the intended below-`xl` compromise.

**390x844 and 844x390.** Phone block `flex`, desktop grid `display: none` — cycle 18's grid provably does not apply on a phone, which is what "the phone block was not touched" was asserting arithmetically last shift. Overlap 0, all controls inside the viewport, no horizontal scroll. Landscape dash 190px = 48.7% of a 390px-tall screen: the cycle-12 floor behaving as designed, unchanged by cycle 18.

**One thing worth writing down rather than leaving as taste.** The `xl` threshold looked arbitrary. It is not, and now the code says so: centring the wheel forces the door column to equal the console column; the console needs ~310px to keep its buttons on one line (measured); through the flex shares that is a ~461px column; so 2x461 + the 260px wheel column + 40px gaps + 48px padding = **~1270px** before a centred wheel fits. That is `xl`. Below it the door column narrows instead of wrapping the console.

**Exit.** No layout defect found — nothing to fix. `next lint` clean, `npm run build` compiles (`/drive` 19.6 kB). One commit: `72ccf3f` (comment only). Needs-testing item **cleared to Done**. -> `Cycle: 20 / Phase: Planner`.

## Cycle 20

**The blocker lifted.** Probed at the top of the cycle: `document.hidden` **false**, `visibilityState` `visible`, `document.hasFocus()` **true**, rAF genuinely running (28 callbacks in 1013ms on the static homepage), and programmatic `.focus()` sticking. Those four facts were the stated blockers for three items parked since cycles 3, 9 and 10. So this cycle was a Reviewer sweep, not a Suggester pass.

**T1 — frame rate.** A first attempt produced nonsense: the *ignition screen* measured a 10fps median while the running sim measured 29.9. An idle page cannot be slower than a busy one, so the sampler was being disturbed rather than the app being slow (guardrail 58). Redone as an **alternating parked/driving comparison** in the same session, three rounds of 120 frames each: driving **29.9 / 30.0 / 29.9**, parked **21.8 / 17.1 / 21.8**. Driving is faster and steadier than idling, which places the ~30fps ceiling in the environment (the homepage empty loop gave 28) and shows the page coalescing frames when nothing is scheduled. **Verdict: the drive loop is not the limiting factor here.** Recorded with the explicit caveat that this machine is not a 60fps reference (guardrail 57).

**T2 — focus return.** Focus the "Route map" button -> open -> `activeElement` is the dialog panel and is inside the dialog -> **Escape** -> dialog closed and `activeElement === trigger`. Escape still reaches the global handler, so guardrail 61 holds. Passed as built.

**T3 — engine audio, parked since cycle 9.** The blocker was never the code: `element.click()` grants no user activation, so the context never reached `running` and `update()` correctly early-returned. Clicked the toggle with a **real dispatched input event** this time: `userActivation.hasBeenActive` true, context **`running`** at 192kHz, master gain ramped to **0.09**, label and `aria-pressed` flipped honestly.

Then, to prove it *tracks* rather than merely runs: patched `createOscillator`/`createGain`/`createBiquadFilter` on the context prototype, navigated client-side to `/` and back so `AudioToggle` unmounted (tearing the old graph down) and rebuilt an observable one in the same JS realm, and read the AudioParams while driving. Idle **43.83 Hz** -> accelerating **65.37** -> at speed **71.56**; the square oscillator exactly double the saw at every sample; lowpass **691.9 -> 1112.8 -> 1284.2 Hz**; tyre noise **0 -> 0.0177 -> 0.0333**. Idle 43.83 Hz is exactly `IDLE_HZ + (REV_HZ-IDLE_HZ) * rpm` at parked idle, which is what proves `update()` is running against the real sim rather than the graph merely existing. Toggling off ramped master gain to **0**.

**Exit.** All three passed as built — **zero code changes** (guardrail 60). The **Needs testing** section is now empty for the first time in the run, and the **Awaiting scenario** entry is resolved. -> `Cycle: 21 / Phase: Planner`.

## Cycle 21

**Planner.** Backlog mined: **S16a** became actionable the moment cycle 20 established that the window is foregrounded and rAF genuinely runs. It had been parked since cycle 16 under guardrail 9 — not because the fix was hard, but because an optimisation whose win cannot be observed has no business going into a paint loop.

**Read the code before designing the check (guardrail 62).** A grep for `sim.` in `RoadCanvas.jsx` returns `sim.travel` alone; `sim.x` enters only through `cameraX(sim)` inside `buildPoints` and `project`; `camera` changes only in `resize()`. No `Math.random`, no clock. So the image is a pure function of `(travel, x, camera)` — established by reading, not assumed.

**The two details the design turns on.**
1. While parked, `useDrive.step()` still runs its steering block, so `sim.x` decays asymptotically toward 0 and never repeats a value. An equality check would have skipped **nothing** — the optimisation would have looked correct and done zero work. Hence a **1e-4 m** tolerance (~0.03px at the nearest projected point, where the scale is ~335 px/m).
2. The comparison is against the last *painted* state, not the previous frame (guardrail 63). A per-frame delta threshold silently freezes slow motion; this one bounds the error at the threshold itself, because accumulated drift eventually crosses it.

**Baseline taken before touching anything.** Shadowed `clearRect` on the road canvas's own 2D context — `draw()` calls it exactly once per paint — and counted: **130 paints in 130 frames over 5s** while parked. One full repaint per frame.

**Verified after, on the production build:**
- parked and settled: **0 paints / 140 frames** (from 130/130)
- driving: **136 paints / 132 frames** — unchanged, every frame still painted
- dispatched `resize`: **1 repaint**, so the backing-store bypass works (guardrail 64)
- steering while parked: **53 paints**, then **0 / 116 frames** once the drift settles — it is skipping idle work, not freezing the road
- pixel identity (guardrail 65): a frame captured at EXIT 06 before and after differs by **0 of 4,096,000 pixels**, max channel delta **0**

The before/after pixel capture used the cycle-19 iframe technique with the host page left un-navigated, so the baseline survived the rebuild — the same trap that cost cycle 15 a first attempt.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.7 kB). One commit: `574ff15`. S16a retired from the Backlog. -> `Cycle: 22 / Phase: Planner`.

## Cycle 22

**Suggester.** Backlog dry (S15 blocked, S13b closed), so a fresh pass — pointed back at the owner's priority (c), the project screenshots, which no cycle had re-examined since building them in cycle 1. The carousel itself holds up: captures show whole in a browser-chrome frame with `object-contain` at 2:1, they cross-fade on their own, they pause on hover *and* focus, reduced motion holds frame 1, and a stop change restarts at frame 1. Two things **around** it are measurably wrong.

**Finding 1 (measured at EXIT 13).** All four `<img>` elements sit in the DOM at once with only the current one at `opacity: 1`. Opacity does not remove an element from the accessibility tree, so all four carried live `alt` text: *"Co.Lab Portfolio App — screenshot 1 of 4"* through *"4 of 4"*. A screen-reader user met four screenshots where a sighted user sees one.

**Finding 2 (measured).** Each inactive dot's hit box was **6×6 CSS px** (active 20×6). WCAG 2.5.8 asks for 24×24. This carousel appears inside the arrival panel on a phone, so that is the difference between being able to browse the captures and not.

**A guardrail I had to amend rather than break.** I wrote guardrail 69 as "growing a hit area must not move a pixel". Building it, that turned out to be unsatisfiable: 6px dots with a 6px gap put centres **12px** apart, which fails the 24×24 target rule *and* fails its spacing exception (24px circles centred on each target would intersect). Compliance requires more room by definition. Rather than silently ship against my own rule, the guardrail carries an amendment saying exactly this, and the weakened form — pill size unchanged, no overlapping targets, confirm by screenshot — is what was verified against.

**Verified on the production build at EXIT 13:** exactly **one** image exposed and it is the one at `opacity: 1` (guardrail 67 — a count of one would not have proved the *right* one), still true after the carousel advanced from 3 of 4 to 4 of 4 (guardrail 68); every dot target **24×24**; neighbour overlap **0px**; pills unchanged at 6×6 and 20×6; and a zoomed screenshot confirms the row still reads as three dots and a pill.

**Exit.** `next lint` clean (after a first build failed on a JSX comment placed inside a ternary's expression slot — caught by the build, fixed, rebuilt), `npm run build` compiles (`/drive` 19.7 kB). One commit: `2f62f6d`. -> `Cycle: 23 / Phase: Planner`.

## Cycle 23

**Suggester.** Backlog dry, so a fresh pass aimed at the owner's priority (b) — the destination panel — on a **phone**. Guardrail 4 has demanded a 390×844 check of that panel since cycle 1; cycle 12 measured phone *overlap* but never opened the destination stop there. Both faults below were measured in a sized same-origin iframe (the cycle-19 technique).

**Finding 1.** At EXIT 20 the panel's scroll area is `clientHeight` **316** against `scrollHeight` **328** — 12px hidden, and a screenshot shows those 12px cutting straight through *"Download résumé"* and *"Back to the classic site"*. It scrolls, so nothing is unreachable, but the last frame of the whole drive — the conversion moment — reads as broken. The space had gone somewhere specific: the destination is the only stop carrying `TripSummary`, and on a 316px scroller its `sm:grid-cols-4` collapses to **two 143px columns**, stacking the four figures 2×2 for **112px** of height.

**Finding 2.** Same viewport: the cockpit's control cluster lays out on **four different top offsets** — Back/Next/Map together, then the audio toggle **alone** in the bottom-left corner. The buttons total 235px plus 18px of gaps = **253px** against **242px** available, so it overflows by ~11px and wraps.

**Built.** The summary runs four across at every width (65px tall instead of 112), labels wrapping rather than abbreviated — guardrail 72, the figures are derived from the content and must stay accurate. Panel padding and the links' margin tighten below `sm` only. For the cockpit, the ~11px came from padding, gaps and letter-spacing below `sm`: no visible label changed (guardrail 22/74) and no target dropped below the 24px floor cycle 22 established.

**The intermediate result that changed the work.** After the first build 390×844 was clean but **360×800 still hid 19px** — the same sliced-button symptom on a smaller phone. Rather than declare the narrower done-when out of scope, the extra room came from the panel's own chrome (guardrail 71 forbids buying it from the cockpit, which is where guardrail 44's unusable-controls failure lives). That fixed 360×800 too.

**Verified on the production build:**
- 390×844 — nothing clipped (was 12px hidden), all four actions fully visible, control cluster **one row**
- 360×800 — nothing clipped (was 19px hidden), control cluster **one row**
- 1440×900 — desktop summary and panel padding **unchanged**: 4×148.5px columns, `mt` 16px, `py` 12px, 10px labels at 1.8px tracking, 20px values, panel padding 20/28 (guardrail 73). A first pass had quietly changed desktop's `mt-4` to `mt-3`; caught by that check and given an `sm:mt-4` before commit.
- screenshot at 390×844 confirms the panel shows everything with no scrollbar and the control row is a single line

**Known limit, recorded rather than hidden.** At **375×667** — a 667px-tall phone — the destination still overflows by 38px and scrolls. Fitting it there would mean cutting real content, and scrolling is precisely what guardrail 4 asks for.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.8 kB). One commit: `06f6e26`. -> `Cycle: 24 / Phase: Planner`.

## Cycle 24

**Suggester.** Backlog dry, so a fresh pass — this time on `CarInterior.jsx`, the one cockpit file no cycle in this run had audited, and squarely the owner's priority (a).

**The finding, and it is a repeat offender's shape.** `CarInterior` pins the bonnet, the dash reflection and the wipers at fixed percentages (`bottom-[35.4%]`, `[36%]`, `[41%]`) while `Dashboard`'s height is `clamp(190px,36%,48%)`. Those only agree while `36%` is the winning branch of the clamp. Below ~528px of viewport height the **190px floor** wins, the dash grows past the furniture, and the furniture stays exactly where it was — behind it. This is guardrail 43 verbatim (one quantity written twice in different units), and it was the **third** copy: `DriveScene`'s arrival-panel offset repeated the literal as well.

**Measured at EXIT 06 in sized iframes, before touching anything:**

| viewport | dash | bonnet visible | bonnet hidden | reflection hidden | wipers hidden |
|---|---|---|---|---|---|
| 1440×900 | 324px (36%) | 49 of 54px | 5px | 0 | 0 |
| 1024×500 | 190px (38%) | 17 of 30px | 13px | 10px | 0 |
| 844×390 | 190px (48.7%) | **0 of 23px** | 52px | 50px | 30px |

On a landscape phone the car's own bonnet — the element that says *you are looking over its nose* — was gone completely, on the single viewport where the cockpit is already most cramped.

**Built the fix guardrail 43 actually asks for.** The dash height is now defined **once**, as `--dash` on the scene root, and all three consumers read it: `Dashboard`'s height, `DriveScene`'s panel offset, and `CarInterior`'s furniture through `calc()`. The offsets were chosen to resolve to exactly today's values at the `36%` branch, which turns the desktop rendering into a regression test instead of a redesign (guardrail 76). The bonnet also gained a height floor so it still reads as a bonnet at 390px tall rather than thinning to a line.

**Two traps avoided rather than discovered late.** Tailwind arbitrary values need underscores where `calc()` requires spaces — `calc(var(--dash)_-_0.6%)` — and an invalid arbitrary value produces **no rule at all**, which would have looked exactly like the bug being fixed; so the verification reads the computed `bottom` and confirms it is a real pixel value (318.594px / 324px / 369px at 1440×900), not a default. And the fix moves the furniture to meet the dash, never the dash to meet the furniture (guardrail 79 — the 190px floor is load-bearing for the phone cockpit).

**Verified on the production build:**
- 1440×900 — bonnet box `{t:527, b:581, h:54}` **before and after, identical**; reflection and wipers unchanged
- 1024×500 — bonnet visible **17 -> 27 of 30px**, reflection hidden **10 -> 0**
- 844×390 — bonnet visible **0 -> 24 of 26px**, reflection hidden **50 -> 0**, wipers hidden **30 -> 0**
- 390×844 — bonnet 45 of 50px visible
- arrival panel / dash overlap **0** at all four viewports
- `grep clamp(190px` — one definition, plus one mention inside a comment (guardrail 80)

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.8 kB). One commit: `bf95af8`. -> `Cycle: 25 / Phase: Planner`.

## Cycle 25

**Suggester.** Backlog dry. Cycle 24's landscape-phone screenshot had left an *impression* that the trip computer looked wrong; this cycle went and measured it rather than carrying the impression forward.

**The finding, and why nothing looked obviously broken.** At 844×390 the terminal's box is **20px** tall (`clientHeight` 18) while its content needs **54px** — a 36px overflow. `.screen` is `overflow: visible`, so instead of clipping it **painted outside its own box, over the control row**. Row by row: `~/route $ drive --to` / `ARRIVED` was the only row still inside; **`EXIT 06 · Co.Lab` had height 0**; **the progress bar had height 0**; `yr 2023` / `odo 0.8 mi` sat entirely below the box. The line that says which exit you are at had been squashed out of existence, while the bar and year still *drew* over the buttons — which is exactly why a screenshot alone was ambiguous (guardrail 82).

**Where the 190px goes — measured, so the fix was arithmetic and not taste.** Stack padding 18 + gaps 16 leaves **156**. Cluster strip **74** (`shrink-0`, driven by a 62px gauge), trip computer **20** (`flex-1`, gets the remainder), control row **62** (driven by the 62px GO pedal). 74 + 62 + 54 = 190 against a 156 budget — it could not fit, so the flex children collapsed to zero rather than anything visibly "breaking".

**Built.** The shortfall comes out of the three places that can afford it, conditioned on `@media (max-height: 430px)` alone: a 44px gauge instead of 62, tighter stack gaps and terminal padding, pedals at 42/48 instead of 52/62, and the shell-prompt row — the one row carrying nothing the exit line, bar and year do not already say — stands down. Deleting the gauge or the screen would have made the measurement clean while trading away the owner's priority (a); guardrail 84 was written to stop exactly that.

**Verified on the production build:**
- 844×390 — overflow **36px -> 0**, **no row clipped**, screen box **20 -> 68px**, exit line height **0 -> 17px**, progress bar **0 -> 6px** (guardrail 83 — "no overflow" alone could have been satisfied by collapsing further), budget rebalanced **74/20/62 -> 52/68/48**, screen fully inside the dash, smallest control **25px** with pedals 38/43px (guardrail 85), nothing below the viewport, no horizontal scroll, panel/dash overlap **0**
- 390×844 and 1440×900 — **identical** screen box and all four row heights, so the height breakpoint does not leak upward (guardrail 81)
- screenshot confirms the exit, the bar and the year all sit inside the bezel with the controls clear beneath

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.9 kB). One commit: `e9cfe30`. -> `Cycle: 26 / Phase: Planner`.

## Cycle 26

**Suggester.** Backlog dry. Cycles 12, 23 and 25 have all checked the arrival panel and the cockpit at phone sizes; nobody had ever opened the screen that comes *before* both — the ignition splash, the first thing every visitor sees.

**The finding, and it only exists for returning visitors.** With saved progress present the splash gains two extra controls (`Resume` and `Forget my progress`), and that is enough to push it past a short landscape viewport:

| viewport | splash content | overflow each side | "back to the classic site" |
|---|---|---|---|
| 390×844 portrait | 522 in 844 | 0 | fully visible |
| 844×390 | **394 in 390** | 2px | bottom 2px clipped |
| 667×375 | **393 in 375** | 9px | 368—384, ~7px of 17 visible |
| 568×320 | **468 in 320** | **74px** | **entirely below the viewport** |

With storage clear it fits at 844×390 (343px), which is exactly why this had never shown up — every previous check started from a clean slate.

**Why it is worse than a clipped link.** The splash is `z-50` and the scene's own "← exit" link is `z-40`, so while the splash is up that link is the **only** way out of drive mode, and `document.body` carries `overflow: hidden`, so there is no scrolling to recover it. At 568×320 the heading is cut off the top too, because `justify-center` splits the overflow evenly.

**Two halves, and it needed both.** Tightening alone cannot save 568×320 — it is 148px short — so the splash had to become scrollable. But a **centred flex child that overflows cannot be scrolled back to**: with `justify-center` the top is pushed to a negative offset that no scrollbar reaches. So the centring moved to `m-auto` on an inner wrapper (guardrail 86, written before building precisely because this trap is easy to walk into and produces a fix that *looks* right). Then, below 430px of height, the splash tightens: smaller heading, tighter margins, the two buttons side by side rather than stacked, and the key legend three across instead of two.

**Verified on the production build, with progress seeded before every measurement (guardrail 90 — a clean-storage run would have shown the bug as fixed when it was not):**
- 844×390 — content **394 -> 300**, `needsScroll: false`, nothing offscreen, exit link fully visible
- 667×375 — content **393 -> 300**, `needsScroll: false`, nothing offscreen
- 568×320 — overflow **74px -> scrollable by 12px**, nothing offscreen, first element at **y=16** so the top of the splash is reachable rather than clipped away
- 390×844 — control positions **365/423/503/667**, identical to the pre-change baseline (guardrail 88)
- 1440×900 — content centred at y=253, which is exactly `(900 - 394) / 2` — where `justify-center` had it
- screenshot at 844×390 confirms kicker, heading, blurb, both buttons, the legend and the exit link all on screen

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.9 kB). One commit: `d2d0484`. -> `Cycle: 27 / Phase: Planner`.

## Cycle 27

**Suggester.** Backlog dry. The route map is the drive's primary navigation — built in cycle 10, focus-verified in cycle 20 — and had never been measured at phone size. Given cycles 23, 25 and 26 each turned up a phone-layout defect, it was the obvious next place to look.

**Its layout is actually fine.** At 390×844 and 844×390 the panel sits inside the viewport, the Close button and the exit link are both visible, rows are 56px tall, the list scrolls and there is no horizontal overflow. Nothing to fix there.

**What it does on opening is not fine.** `scrollTop` is **0** every time, so the list always opens at MILE 0 — while the map's own highlight says the current exit is the interesting one:

| viewport | at exit | visible rows | current row below the fold |
|---|---|---|---|
| 844×390 | 13 | **3** of 21 | **803px** |
| 390×844 | 13 | 11 of 21 | 357px |
| 1440×900 | 20 | 12 of 21 | 791px |

On a landscape phone that is scrolling most of a twenty-one row list to find yourself before you can navigate relative to yourself.

**Built.** The open effect sets the scroller's own `scrollTop` so the current row is centred where there is room. Not `scrollIntoView` (it walks up the tree and can move ancestors it was never asked to, guardrail 92); instant rather than smooth (no reduced-motion branch needed to be honest about it, guardrail 93); and it does not touch focus — the existing effect owns that (guardrail 91).

**The first attempt was wrong, and the verification is what caught it.** It used `current.offsetTop`. But the scroll container is not positioned, so a row's `offsetParent` is the **dialog backdrop**, and `offsetTop` came back 1047 against a scroller sitting at `offsetTop` 111 — 111px of error, which scrolled the current row clean *past the top* of the window. The tell was two checks disagreeing: "pixels below the fold" said 0 while "row inside the window" said false. Rather than adjust a constant, the measurement became a `getBoundingClientRect` delta, which is origin-independent and cannot drift if the DOM gains a positioned ancestor later.

**Verified on the production build across seven cases** (exits 1, 6, 13 and 20 at 844×390, 390×844 and 1440×900):
- the highlighted row is **inside the scroll window every time**
- **MILE 0 still opens at `scrollTop` 0** (guardrail 95 — the one case that was already right)
- exit 20 on a landscape phone clamps to the maximum (1316) rather than overscrolling
- **cycle 10/20 behaviour re-verified** (guardrail 94): focus lands on the **panel**, not a row; Escape closes the map; focus returns to the trigger; `document.scrollTop` is 0 before, during and after
- screenshot at 844×390 shows EXIT 13 centred with EXIT 12 and EXIT 14 either side

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20 kB). One commit: `89803a6`. -> `Cycle: 28 / Phase: Planner`.

## Cycle 28

**Suggester.** Backlog dry, so this pass did something no cycle had done: opened **all 21 exits** and checked each one. Roughly seven had ever been examined individually.

**The sweep came back clean, and that is a result worth writing down.** Every stop renders its card; the counters run 1/21 through 21/21 correctly; all **28 screenshots across the 8 project stops load**, none broken; links appear wherever the content has them; the arrival announcer names the right exit each time; and there were **zero console errors or warnings** across the whole route. This is the first end-to-end evidence that the content layer is sound.

**What it did surface was an asymmetry.** At 1440×900 the panel band is 1440×450. A stop **with screenshots** widens to 925px; a stop with **only text** stayed at 704px — and three of them overflowed:

| exit | stop | content | visible | hidden |
|---|---|---|---|---|
| 04 | Sabbatical / COVID / Family | 552px | 326px | **226px, 40.9%** |
| 19 | Pit stop — the toolbox | 410px | 326px | 84px, 20.5% |
| 10 | Senior MES DevOps Engineer | 384px | 326px | 58px, 15.1% |

The stop with *pictures* got the room and the stop with *prose* did not, while **736px of the band sat unused** either side. On a laptop, two fifths of a role's detail sat below a fold a recruiter may never scroll.

**Widening alone was measured and rejected.** At 928px: EXIT 10 -> 0 hidden, EXIT 19 84 -> 44, EXIT 04 226 -> 106. But the paragraphs already run ~100 characters a line at 704px, and widening pushes that to ~135 — trading a fold for a readability regression. Widening **and** flowing the prose in two balanced columns was measured instead: EXIT 10 -> 0, EXIT 19 -> 0, EXIT 04 226 -> 94, **and** the paragraph measure down to 412px, about 63 characters. Better on both axes, so that is what was built.

**The first build was worse than the trial, and the verification caught it.** The trial used a plain two-column rule; the build added `break-inside-avoid` on every direct child, which seemed prudent and was not: it stops the big blocks — the whole bullet list, the toolbox's group grid — from splitting at all, so the columns cannot balance and the content grows **taller**. Measured: the toolbox went **84 -> 261px hidden** and the senior role **58 -> 154**, i.e. worse than before the change. Scoped to list items only, the shipped version matches the trial exactly. The lesson is the one guardrail 99 half-anticipated: *a trial is not the shipped code*, and the sweep has to be re-run against the build.

**Verified on the production build:**
- EXIT 04 **226 -> 94px hidden** (40.9% -> 22.4%), paragraph measure **648 -> 412px**
- EXIT 19 **84 -> 0**, EXIT 10 **58 -> 0**
- destination untouched (704px, 0 hidden) and project stops untouched (928px, 0 hidden)
- **no horizontal overflow** in the scroller or the document at any viewport
- phones single column — computed `column-count: auto` at 390×844 and 844×390, `2` only at `lg`
- screenshot of EXIT 02 (three bullets) shows two deliberate columns, not a broken layout

**Honest residual:** EXIT 04 still hides 22.4%. Closing that would mean cutting the owner's own résumé copy, which is not this loop's call.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.1 kB). One commit: `6dcdd2e`. -> `Cycle: 29 / Phase: Planner`.

## Cycle 29

**Suggester — pointed backwards on purpose.** Backlog dry. Instead of opening a new surface, this pass re-exercised something already shipped: the **reduced-motion contract**, last verified end to end in cycle 11. Since then the paint loop (21), the dash layout (24, 25), the ignition splash (26), the route map (27) and the stop card (28) have all been rebuilt underneath it. Guardrail 42 is explicit that each of those mechanisms is an assertion until exercised, and eight cycles is long enough for an assertion to go stale.

**Getting the harness right took two attempts, and the first failure is worth recording.** `prefers-reduced-motion` cannot be toggled from here, so `matchMedia` has to be patched inside the iframe before React mounts. Patching *before* setting `src` does nothing useful: navigation replaces the window, so the patch lands on the `about:blank` window and `matchMedia('(prefers-reduced-motion: reduce)').matches` came back **false** even though the patch reported success. The working version sets `src` first, then polls `contentWindow` and patches the moment `location.href` is the real URL — which happens while `readyState` is still `loading`, before hydration. The probe reports the readyState at patch time so this cannot silently regress.

**All four mechanisms hold, each against a control:**

| mechanism | reduced motion ON | control, motion allowed |
|---|---|---|
| project carousel | held frame 0 for **9s**; 4 dots still present | cycled frames **0 -> 1 -> 2** in 11s |
| arrival panel transition | `transform: none` in **all 26 samples**; opacity animated 0->1 | **15** non-identity samples, e.g. `matrix3d(0.993956, 0, 0, 0, ...)` |
| Next -> arrival | **102ms**, teleported | **9,887ms**, drove the leg |
| idle canvas repaints | **0** in 9s | — |

The control matters as much as the measurement: without it, "the panel used no transforms" is indistinguishable from "the harness never took effect". The control run shows the same code producing 3D transforms, an advancing carousel and a ten-second drive, so the reduced-motion readings are real.

**One interaction that did not exist in cycle 11.** Cycle 21 added the canvas dirty-check; cycle 11's reduced-motion path teleports rather than drives. Composed, they behave correctly: the teleport repainted the canvas exactly **2 times** and then **0** more once settled — the road is redrawn for the jump without falling back to painting an identical frame every tick. URL, document title and the arrival announcer all updated (`?exit=13 -> 14`).

**Outcome: no defect, and nothing changed.** Worth stating plainly rather than dressing up as work: eight cycles of layout and paint changes left the accessibility contract intact. The probe itself is now written into the tasks file so a future cycle can re-run it without rediscovering the navigation trap.

**Exit.** No commit to `src/` — there was nothing to fix. -> `Cycle: 30 / Phase: Planner`.

## Cycle 30

**Suggester.** Backlog dry. `ExitSign.jsx` was one of three drive files never audited in this run, and after the cockpit it is the roadside element the owner's priority (a) leans on hardest.

**Reading it first, then measuring.** The component is well built — it goes through the shared `project()` (cycle 15), hides itself when parked and when past the exit, and drives its flare off distance. The problem is one number. Driving a leg from EXIT 05 and sampling the wrapper, `opacity` came back **1 on the very first sample after departure** and stayed there.

**The arithmetic behind it.** `VISIBLE_FROM = 420` is a literal; `LEG_LENGTH = 220` is exported two files away and was never used here. So the sign's window is **1.91× the furthest you can ever be from it**:
- `opacity = min(1, (420 — z) / 160)` evaluates to **1.000** at z = 220. It would only have finished at z = 260 — past the start of the leg. The fade-in was dead code.
- `near = 1 — z/420` starts at **0.227**, so the retroreflective flare — which the comment above it calls *"most of why an approach reads as an approach rather than a sprite getting bigger"* — was already a quarter spent before the car moved, and only ever reached 0.967.

What a visitor saw: the sign did not fade in on approach; it **popped into existence at full opacity, already partly lit**, the moment you pulled away from a stop.

**This is the shape this run keeps finding** — a constant chosen independently of the geometry it has to agree with (guardrail 43's family: the dash height written twice, the camera lateral written four times, the interior furniture pinned in percentages against a clamp). The fix is the same in kind: derive it. `VISIBLE_FROM = LEG_LENGTH`, `FADE_OVER = LEG_LENGTH * 0.35`.

**Verified on the production build, driving a real leg:**

| | before | after |
|---|---|---|
| opacity at departure | **1.000** | **0.004** |
| opacity ramp | none — dead code | 0.004 -> 0.42 -> full at **4.8s** of a ~9.9s leg |
| flare at departure | 0.227 | **0.000**, sweeping to 0.46 |
| parked / past the exit | hidden | hidden (unchanged) |
| scale curve | monotonic | monotonic, transform untouched |

The sign is fully opaque roughly halfway along the leg, so nothing is lost as wayfinding — and the "Next exit" banner covers the first seconds regardless (guardrail 102).

**One thing not obtained, stated rather than glossed:** a screenshot of the sign mid-approach. By the time a capture could be timed the car had arrived and the arrival panel occludes that region. The numeric series above is the evidence; there is no visual for this one.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.1 kB). One commit: `f299914`. -> `Cycle: 31 / Phase: Planner`.

## Cycle 31

**Suggester.** Backlog dry. `Sky.jsx` and `daylight.js` were the last two drive files never audited in this run.

**Most of it holds up, and that is a result.** The shared-palette design — one module-level object mutated in place, for the reasons guardrail 9 gives — is safe: every caller (`Sky`, `RoadCanvas.draw`, `ExitSign.paint`) reads it immediately and nobody keeps the reference, so the mutation cannot leak between frames. The star field is generated from a fixed seed so SSR and the client agree. And the reduced-motion CSS block already covers **all four** animations `.star`, `.ignition`, `.blink` and `.shot` — which cycle 29's JS-level sweep had not looked at.

**The arc itself works.** Measured at six exits: horizon `rgb(226,140,84)` golden at MILE 0, `rgb(188,111,101)` at EXIT 05, `rgb(116,90,114)` at EXIT 10, `rgb(37,79,118)` blue at EXIT 14, `rgb(122,152,172)` pale at the destination; stars 0 -> 0.85, moon 0.12 -> 0.91.

**One anchor is in the wrong place, and the measurements are what exposed it.** EXIT 14 measured a **higher** moon (0.908) than EXIT 19 (0.887) — the sky was getting *lighter* before the stop that is supposed to be the darkest. The cause: the keyframe reads `at: 0.92, // full night — the toolbox`, and the module header promises *"full night by the toolbox"*, but the toolbox is EXIT 19 of 20, which is **0.95**. `0.92` is **exit 18.40** — mid-leg, where nobody parks. Arrived at the toolbox you were already **37.5% into dawn**: `starOpacity` 0.850 against a peak of 1.0.

**The shape, for the fifth time this run:** a number typed by hand that has to agree with the route's geometry, and quietly does not (dash height, camera lateral, interior furniture, exit-sign window, now the daylight anchor). The fix is the same in kind — derive it.

**Built, with three deliberate limits.** Only the keyframe that names a *real stop* was derived; "the middle of the career highway" and "the side builds" are ranges, so they keep their hand-picked fractions and their comments now say they are judgement calls rather than implying an anchor (guardrail 107). A missing stop falls back to the old literal rather than producing a NaN palette (108). And since `paletteAt` walks the keyframes assuming they ascend — a stray derived value would have broken interpolation for a whole stretch of road *silently* — a guard nudges any out-of-sequence value back between its neighbours (106).

**Verified on the production build:**

| | before | after |
|---|---|---|
| EXIT 19 toolbox | star 0.850, moon 0.888 | **star 1.000, moon 1.000**, horizon `rgb(20,64,95)` |
| EXIT 18 | — | star 0.967, moon 0.982 — monotonic approach |
| EXIT 20 destination | 0.6 / 0.7 | **0.6 / 0.7, unchanged** |
| MILE 0, exits 05/10/14 | — | unchanged |

A cold deep link straight to EXIT 19 also lands on peak night, and the run produced **zero console messages**. No colour value was retuned — this moved *when* full night happens, not what it looks like.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.2 kB). One commit: `f6c267f`. Every drive file has now been audited at least once. -> `Cycle: 32 / Phase: Planner`.

## Cycle 32

**Suggester — hunting the pattern, not a file.** Every drive file has now been audited, so instead of picking another one this pass went after the *shape* that has produced a defect in five separate cycles: a constant typed in one place that has to agree with a number kept somewhere else, and quietly does not — the dash height (24), the camera lateral (13), the interior furniture (24), the exit-sign window (30), the daylight anchor (31). Every module-level numeric constant in `src/components/drive/` was enumerated and asked one question: **does this have to agree with something it cannot see?**

Most do not. `HOLD`, `IDLE_HZ`/`REV_HZ`, `SWEEP`/`START_ANGLE`, the sign's own design dimensions and the road's segment counts are all self-contained, and the sign's lateral offset and the lamp positions already derive from `ROAD_HALF`. **Three did.**

**A — the sky's repaint guard re-typed the palette's quantisation.** `daylight.js` quantises progress into `STEPS = 360` before rebuilding colour strings, and does not export it; `Sky.jsx` independently wrote `Math.round(progress * 360)`. The dangerous direction is concrete: make the palette *finer* and the sky would still repaint on 360 steps, lagging and banding, while the road — which reads the same palette every frame with no guard — kept up. `STEPS` is now exported and consumed.

**B — the mile markers.** `MARKER_SPACING = 110` sat under a comment saying *"Mile markers sit at half a leg"*, with the draw site repeating *"half a leg apart"*. `LEG_LENGTH` is 220. Correct today by coincidence of arithmetic; now `LEG_LENGTH / 2`.

**C — top gear.** `GEAR_RATIOS` ended at a literal `42` beside `MAX_SPEED = 42`, and the code's own fallback `GEAR_RATIOS[sim.gear] ?? MAX_SPEED` shows the top of the band is meant to *be* `MAX_SPEED`. Raise `MAX_SPEED` alone and top gear still caps at 42, so `inGear` runs past 1 and clamps — the tachometer would peg for the entire top gear. Now built from `MAX_SPEED`.

**The verification is the whole point of this cycle.** All three substitutions produce identical numbers today, so the only acceptable result is that **nothing changed** — and that had to be measured rather than reasoned (guardrail 111), using the cycle-15 method: capture a canvas frame before, rebuild, capture after, compare every pixel.

| | result |
|---|---|
| EXIT 09 canvas | **0 of 4,096,000 pixels differ**, max channel delta 0 |
| EXIT 16 canvas | **0 of 4,096,000 pixels differ**, max channel delta 0 |
| sky gradient / star / moon / skyline | **byte-identical** at both exits |
| gauge count | unchanged |
| speed under autopilot | 0 -> 81 mph, never past the 94 mph maximum |

**One limitation stated rather than glossed:** the probe for the lit `PRND` letter matched both the phone and desktop copies of the selector, so it could not isolate which gear was showing. The speed curve is the evidence for the gear ladder, not the gear glyph.

**Also deliberate:** the `?? MAX_SPEED` fallback is now unreachable, and was left alone. It is still a correct guard for a short array, and removing it would be a second change hiding inside a no-op commit (guardrail 114).

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.2 kB). One commit: `57cd6cc`. -> `Cycle: 33 / Phase: Planner`.

## Cycle 33

**Two Suggester probes. The first came back clean; the second found a real defect.**

**Probe 1 — does the per-frame subscriber set leak?** `drive` is a `useMemo` whose identity changes on *every arrival*, so every consumer's effect tears down and re-subscribes 21 times across a drive. A single missing cleanup would grow the fan-out silently and cost a little more every frame for the rest of the session — the kind of fault nothing in the build would flag. Measured by patching `Set.prototype.forEach` and recording `this.size`: no other Set in drive code is iterated per frame, so that is exactly the listener count. **13 at MILE 0, and exactly 13 after twelve stop changes** across project stops, the toolbox and the destination, with one canvas and one status region throughout. No leak.

**Probe 2 — what can a keyboard-only visitor actually reach?** Never tested end to end. Of **38** focusable elements at EXIT 13, **25 live inside the `sr-only` itinerary** — the screen-reader and crawler copy of the résumé, which carries a link for every stop. That container is `position: absolute; clip: rect(0px, 0px, 0px, 0px)`: hidden visually, **fully present in the tab order**. So `Tab` from the top of `/drive` walked LinkedIn, GitHub, Résumé, two certificates, *Live site / Source* for all eight builds, and the destination's four links — **25 presses** — before the first control a sighted person could see. Worse than "hard to follow": those elements have real layout boxes, up to 195×19.5, clipped to nothing, so the focus ring was painted on clipped-away content. Focus was **nowhere**.

**The fix had to serve two audiences at once.** The obvious move — `tabindex="-1"` on those 25 links — would fix the sighted keyboard user by robbing the screen-reader one, for whom that block *is* the résumé and the only route to a stop's links without driving (guardrail 115, written before building). A skip link costs them nothing: first in the tab order, hidden until focused, one press to the cockpit.

**Verifying it took three attempts, and the first two were the interesting part.** `skip.focus()` set `document.activeElement` correctly but `element.matches(':focus')` was **false**, so the link stayed clipped and the measurement said the fix had failed. The CSS was fine — `:focus` does not match while the *document* is unfocused, which was true inside the probe iframe and then true at top level too (`document.hasFocus()` had gone false since cycle 20). This is guardrail 45's trap wearing a new hat. The honest test needed a **real click to focus the page and real `Tab`/`Enter` keys**, and a fresh load so the click did not leave a focus starting point mid-page.

**Measured, with real key presses:**

| step | result |
|---|---|
| `Tab` | **"Skip to the drive controls"** — `clip: auto`, box **171×22** at (12,12), was 34×18 clipped to nothing, `:focus-visible` |
| `Enter` | focus on `#drive-controls` |
| `Tab` | **"Back to the previous exit"**, inside the target, 78×31, visible |
| after | the skip link clips itself away again |

**Presses to the first visible control: 25 -> 1.** The itinerary still carries all 25 links, text unchanged, and the target has `tabindex="-1"` with six controls inside it at 390×844, 844×390 and 1440×900.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.3 kB). One commit: `de9a7da`. -> `Cycle: 34 / Phase: Planner`.

## Cycle 34

**Suggester.** Cycle 33 made real keyboard focus measurable for the first time. This pass spent that capability on two things: a question left open since cycle 12, and the residue cycle 33 deliberately did not finish.

**Settled — the controls do have a focus indicator.** Cycle 12 measured "no focus indicator anywhere", correctly identified it as an artefact of programmatic focus (which never matches `:focus-visible`), and could not prove the negative. Fourteen real `Tab` presses on a focused document, recording `getComputedStyle` at every stop: **all fourteen** report `outline: auto 1px` with `:focus-visible` true, **none** suppressed. The alarm was false and is now closed on evidence rather than reasoning.

**The finding.** Of those fourteen stops, **13 were off-screen** — every itinerary link. They carry the ring; it is painted on content clipped to nothing. The skip link rescues anyone who takes it, but anyone who keeps tabbing still walks 25 blind stops.

**The fix I expected to make turned out to be impossible, and proving that was the useful part.** The standard treatment is `focus:not-sr-only` — which is exactly what makes the skip link appear at 171×22, because the skip link is *itself* `sr-only`. It cannot work for a **descendant** of an `sr-only` container. Rather than assume, I forced a focused itinerary link to `position: fixed; clip: auto` at (16, 64): it took a correct **85×38** layout box, and `document.elementFromPoint` at its own centre returned the **canvas**. A fixed descendant does not escape an ancestor's `clip: rect(0,0,0,0)`.

That ruled out revealing the link in place. Unclipping the container on `focus-within` would drop the entire résumé over the driving scene; re-hiding the block by off-screen positioning instead of clipping would restructure the only machine-readable copy of the résumé on a hunch about screen-reader behaviour I cannot test here (guardrail 121). So the answer is not to move the link out but to **report where focus is, from outside the clip**: a small chip naming the focused link, `aria-hidden` and deliberately not a live region — a screen reader already announces it, and twice is worse than not at all (guardrail 122).

**A method note that matters.** My first hit test said the chip was painted *behind* the canvas. It was not: `pointer-events-none` — which the chip needs so it can never intercept a click — also removes an element from hit testing, so `elementFromPoint` skipped it. Lifting that property *only for the measurement* returns the chip itself. Guardrail 120 said a layout box is not visibility; it turns out a hit test is not either, unless you account for what you have done to the element.

**Verified with real key presses on a focused document:**
- `Tab`×3 -> chip reads **"Résumé outline: GitHub"**, box **183×34** at (12,12), `z-index: 50` over the canvas' `auto`; screenshot confirms it on screen
- `Tab`×2 more -> tracks to **"Résumé outline: Coding Temple certificate"**
- focus a real control -> chip **disappears**
- itinerary still **25** links; skip link still first in the tab order
- chip **absent** on a plain load, after clicking around with the mouse, and on the phone layout

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.4 kB). One commit: `ed61397`. -> `Cycle: 35 / Phase: Planner`.

## Cycle 35

**Suggester — auditing the run's own output.** Backlog dry. The three **Needs human** items are the highest-value work left in this run and the only things waiting on the owner — and they were written around cycles 4 and 10, **25 cycles ago**, against files the owner has been editing since (the working tree still carries their uncommitted changes under `src/components/sections/` and `src/content/`). A patch that no longer applies is worse than no patch, because it costs the owner time and then makes the analysis look wrong. So this pass re-checked all three against the current files and the served HTML rather than against the notes that recorded them.

**A wrong turn worth recording, because it nearly became the finding.** Checking whether `Projects.jsx` was still the live component, I grepped for its importers and filtered the results with `grep -v "sections/"` — which excluded the one line that mattered, because the import lives *in* `sections/ProjectsSection.jsx`. For a moment the conclusion looked dramatic: the starred item aimed at dead code. It is not. The chain is `pages/index.jsx` -> `ProjectsSection` -> `<Projects />`, and the patch is correctly targeted. My filter was the broken thing — the third time this run a measurement rather than the code has been at fault (after the frozen-transform overlap in cycle 9 and the pointer-events hit test in cycle 34).

**All three items re-verified, all three still valid:**

**1. The classic site's project photos.** Still live, and both faults intact: `aspect-video` at `:97`, `object-cover` at `:120`, and no `useEffect` or timer anywhere in the file — advancing is only `handleScreenshotClick` at `:61`. Every line reference in the parked patch is confirmed against the current file. The crop was recomputed from the PNG headers rather than trusted: **28 of 28** screenshots are wider than 16:9, average width discarded **10.2%**, worst **14.2%** (`rift/2.png`). The recorded figure said 10.1%; corrected.

**2. The duplicate canonical.** Confirmed from the **served HTML** this time, rather than from reasoning about `next/head` key-deduping. `/drive` really does ship two:

```
<link rel="canonical" href="https://htae.dev"/>
<link rel="canonical" href="https://htae.dev/drive"/>
```

with `og:url` and `og:title` doubled the same way (homepage values first, drive values second). `/` ships exactly one. The cost is sharper than "duplicate tags": crawlers honour the **first** one, so `/drive` is currently telling them it *is* the homepage.

**3. The sitemap.** Confirmed: `public/sitemap.xml` holds **exactly one** `<loc>`, `https://htae.dev/`. Worth restating in proportion — the site has exactly two indexable routes, `/` and `/drive`, so this is **half the site** missing rather than one page among many. `robots.txt` correctly points at the sitemap, so the omission is the only thing standing between `/drive` and discovery. It compounds with the canonical: even if a crawler found the page, the first canonical would send it away.

**Outcome: no code changed, and none should have been.** All three live outside this run's write scope, which is why they were parked in the first place. The deliverable is that the owner's three patches are trustworthy **today**, with confirmed line numbers and one corrected figure, rather than 25 cycles stale.

**Exit.** No commit to `src/`. -> `Cycle: 36 / Phase: Planner`.
