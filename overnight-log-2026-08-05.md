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
