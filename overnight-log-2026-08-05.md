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
