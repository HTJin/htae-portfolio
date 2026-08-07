# Overnight log — 2026-08-05

Running progress, phase transitions, decisions and assumptions. Append-only.

---

**19:57 ET — Run start.** Relief heartbeat scheduled (`*/30 * * * *`, job `33b7cfc6`) as the very first action, before any phase. Focus area given by the user: drive mode on branch `feat/drive-mode` — (1) car interior dash, (2) arrival panel, (3) project photos cut off + should auto-cycle with a fade.

**19:58 ET — Phase: Suggester.** Read the drive-mode source cold: `DriveScene.jsx`, `CarInterior.jsx`, `Dashboard.jsx`, `StopCard.jsx`, `RoadCanvas.jsx`, `route.js`, `drive.module.css`, `src/lib/projects.js`. Confirmed on disk that `public/images/projects/` holds 2-5 PNGs per project (28 files across 8 projects).

**20:00 ET — Live audit via Chrome extension.** `npm run dev` → port 3000 was already in use, Next fell back to **http://localhost:3001**. Loaded `/drive` at 1440x900, clicked _Start engine_, opened the route map, jumped to EXIT 11 (Solar Power Indy). Observations recorded as evidence in the tasks file:

- The project screenshot renders as a cropped top-band strip, not the whole capture. (`StopCard.jsx:52-57`)
- Only one screenshot is reachable; `route.js:81-83` takes `screenshots[0]` only.
- The arrival panel overlaps the rear-view mirror at this viewport.
- The steering wheel sits at ~33% of viewport width while the road's vanishing point is at 50% — the wheel is not in front of the driver, and the gauges float beside it rather than in a binnacle.
- No hood, no vents, no warning lights; the dash is a flat dark gradient.

**20:02 ET — Suggester exit.** 10 ideas logged to `overnight-suggestions-2026-08-05.md` (S1-S10). S1-S4 promoted to this cycle (they map onto the user's three stated priorities plus the cockpit rebuild); S5-S10 seeded into the Backlog. → **Phase: Planner**.

**20:03 ET — Planner exit.** Five tasks written into _Tonight's tasks_ with why / files / evidence / done-when. Assumption locked in and documented: the camera is the driver's eyes in a left-hand-drive car, so the wheel belongs on the driver's axis (~44-47% of width) with the centre stack to its right. → **Phase: Critic**.

**20:04 ET — Critic exit.** Failure pre-mortem written into the Guardrails block as six named guardrails: hydration mismatch from unrounded SVG geometry; regressing the 60fps loop by adding React state per frame; the cockpit crowding out the road; the arrival panel becoming unreadable at 390px; carousel timers leaking across stop changes or overriding reduced-motion; `object-contain` leaving unintentional-looking letterbox bars. Also recorded a scope guardrail: the working tree had **pre-existing uncommitted edits** to `src/components/sections/*` and `src/content/*` before this run — never `git add -A`, stage only drive-mode files. → **Phase: Builder**.

**20:10-21:05 ET — Phase: Builder (cycle 1).**

- **Task 1 (route images) — built.** `route.js` project stops now carry `images[]` (every screenshot, resolved to its public path) plus `site`; `image` kept as `images[0]` for back-compat. Verified in the browser: EXIT 11 reported `1/4`, EXIT 12 reported `5/5`.
- **Task 2 (ProjectShots) — built.** New `src/components/drive/ProjectShots.jsx`. Measured every capture on disk first (`public/images/projects/**`, 28 PNGs) — they are all 1.95-2.07:1, so the frame is a 2:1 `browserViewport` with `object-contain` and the whole page shows. Cross-fade is a 900ms CSS opacity transition between absolutely-stacked `<img>`s on a 4.2s timer; dots jump, pointer/focus pauses, `useReducedMotion` disables autoplay, and the interval is torn down on stop change. **Verified in Chrome:** the frame advanced 4/4 -> 1/4 -> 2/4 -> 3/4 across successive screenshots, and the full Solar Power Indy capture was visible edge to edge instead of a cropped strip.
- **Task 3 (StopCard) — built.** Exit shield + leg + counter header, media|prose split at `lg`, projects up from its bottom edge (`transformOrigin: bottom center`, rotateX), reduced-motion falls back to a plain fade. Container in `DriveScene` re-bounded to `top-[14%] bottom-[36%]`. **Verified in Chrome:** no overlap with the rear-view mirror at 1920x895 (mirror bottom 100px, panel top 118px).
- **Task 4 (cockpit) — built.** See the commit message on `646b717` for the full list. Two genuine defects were found and fixed _during_ the build, both worth remembering:
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

- _Hydration on cold load_ — attached and cleared console tracking **before** navigating, then loaded `/drive` cold. Zero matches for `hydrat|did not match|Warning|Error|Uncaught|mismatch`. **Done.**
- _Phone title clamp_ — this one turned up a real fault. At 386x840 the h2 computed `display: block`, `line-clamp: none`, `overflow: visible`, and a stylesheet scan found **zero** `line-clamp` rules in the served CSS. `lg:truncate` was missing too — both classes came from the same edit, while older classes were present. That pattern pointed at stale CSS rather than a Tailwind problem, and `npm run dev:fresh` (wipes `.next`) restored both (`line-clamp: 1 rule`, `lg:truncate: 1 rule`). Root cause: **a corrupted `.next` webpack cache silently serving CSS without newly-added classes** — the log had been full of `PackFileCacheStrategy ... EPERM/ENOENT` warnings. Re-tested after the clean restart: the h2 computes `-webkit-line-clamp: 2`, `-webkit-box-orient: vertical`, `overflow: hidden`; the real title is 2 lines unclipped; an injected 113-character title still renders at exactly 2 lines (45px = 2 x 22.5) with `scrollHeight > clientHeight`. **Done.** Guardrail 6 was extended to cover this.
- _Reduced-motion carousel_ — patched `matchMedia('(prefers-reduced-motion: reduce)')` to report `matches: true` inside a 390px probe frame before hydration, then opened EXIT 11. Counter held `1/4` across 11 seconds (autoplay would have advanced 2-3 times), the third dot still moved it `1/4 -> 3/4`, and the `@media (prefers-reduced-motion: reduce) { .shot { transition: none } }` rule is in the served stylesheet. **Done.**

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

**21:05 — Critic.** Added guardrails 13-17. The one that mattered: _the year readout must never invent career history_ — projects have no dates, so past the last dated stop the readout says `NOW`, never a number.

**21:06-21:20 — Builder, task 1 (years).**

- `route.js` gains a derived `year` per stop and `yearAt(travel)`, interpolating between dated stops. `Dashboard.TripComputer` shows it as the hero number beside the odometer via `subscribe` + a ref (guardrail 16).
- **Verification technique, since the browser was unavailable (see below): an SSR probe.** Temporarily rendered `yearAt` samples into the page's existing `sr-only` block, read them with `curl`, then reverted the file to byte-identical-to-HEAD. That is real execution of the real module through the real toolchain, not a reimplementation.
- **The probe immediately caught a real bug.** It showed _four_ stops reporting 2023 when only three roles are from 2023. Root cause: `yearOf()` used `new Date(date).getFullYear()`, which parses `YYYY-MM-DD` as **UTC midnight** and then reads it back in **local time** — so in any timezone behind UTC a January 1st date reports the previous year. The StarPlus UI/UX role (`2024-01-01`, whose own label reads "Jan 2024 - Oct 2024") had silently moved to **2023**. Confirmed the mechanism in Node across all ten content dates: only the Jan 1st one differs (local 2023 vs UTC/string 2024). Fixed by reading the year straight off the string. This is exactly the class of bug guardrail 13 was written for — a wrong year on someone's résumé — and it would have shipped invisibly.
- Re-ran the probe after the fix: `0:-:2016 1:2016 2:2017 3:2019 4:2020 5:2023 6:2023 7:2023 8:2024 9:2024 10:NOW 11..20:NOW`. Quarter-leg midpoints confirm the interpolation ticks over between exits, including **2021 and 2022 while crossing the sabbatical** — the gap years are visibly driven through.

**21:21-21:32 — Builder, task 2 (roadside character).** `route.js` resolves a roadside style per stop once at module load and exposes `roadsideAt(s)`, keyed off the object's own world position rather than the camera's (guardrail 17). The scenic overlook gets a guardrail and a thinned lamp line; the sabbatical thins further. Guardrails are painted with a new run-length `rail`/`railRuns` pass — the same technique `stripes()` uses, because filling each segment separately leaves anti-aliasing seams (guardrail 15). Lamp thinning keeps side alternation by deriving the side from `Math.floor(n / every)` rather than `n`.

- SSR probe confirms the mapping exactly: Start line / School zone / Career highway at `lampEvery 1` with the sabbatical at `lampEvery 3`, the eight Scenic overlook stops at `lampEvery 2` **with RAIL**, then Pit stop and Destination back to `lampEvery 1`.

**ENVIRONMENTAL BLOCKER (new, different from cycle 1's).** From ~21:05 the Chrome extension can no longer reach the dev server **at all**:

- `localhost:3001/drive` in Chrome renders a _different application of the user's_ — "Virsh.shop — Operator Console" — while `curl` on the identical URL returns `<title>Hyun-Tae Jin | Drive mode</title>`, `netstat` shows this project's `next dev` owning the port, and the process command line confirms it.
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
- `route.js:7` compares instants (timezone-independent). `Intro.jsx:131` and `generateRssFeed.js:82` read the _current_ year for a copyright line, where local time is the wanted semantic. `generateRssFeed.js:107` hands a `Date` to the feed library, which serialises UTC.
- **Verdict:** `route.js` was the only affected site; fixed in cycle 3. No edit, no Needs-human item.

**21:41-21:45 — Task 2: a real SEO defect, parked as Needs human.** `/drive` ships **two** `<link rel="canonical">` — `https://htae.dev` from `_app.jsx:69` and `https://htae.dev/drive` from `drive.jsx:17` — plus two `og:url` and two `og:title`. Measured directly out of the served HTML, not inferred. A crawler taking the first canonical is told `/drive` duplicates the homepage; a social scraper taking the first `og:title` previews a shared drive link as the homepage, which defeats the `?exit=` deep links from cycle 2. Cause: `next/head` only dedupes tags carrying a matching `key`, and neither side sets one. The fix belongs in `_app.jsx`, which is outside this run's write scope, so it is parked as **Needs human** with the exact patch and a one-line verification command. Deliberately did **not** bodge a key into `drive.jsx` alone — without the `_app` side it changes nothing and would have _looked_ fixed.

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

**22:07-22:20 — Builder, tasks 1 and 2.** Labels keep the visible word and expand it ("Back to the previous exit", "Drive on to the next exit", "Open the route map", "Brake", "Go — hold to accelerate"), applied across _both_ cockpit layouts. Gauges, gear selectors and trip-computer screens marked `aria-hidden`. Ignition heading demoted to `<h2>`.

- **Verified against the served HTML:** exactly one `<h1>`; 10 of 11 buttons labelled, and the single unlabelled one enumerated explicitly to confirm it is "Start engine", whose visible text is already a correct accessible name; `aria-hidden` count 12 → 19 (3 gauges + 2 trip screens + 2 gear selectors); itinerary still exposed with all ten `<time>` years.

**Mid-cycle incident — the dev server hung, the code was fine.** After the edits, `curl` on `/drive` timed out at 10s with `status=000` while the dev log sat on `wait compiling /drive…`. Rather than assume my change caused it, I killed the server and ran `next lint` (clean) and `npm run build` (compiled successfully, `/drive` 17.2 kB) — both of which are independent of the dev server. That exonerated the code; `dev:fresh` then cleared it. Third distinct way the `.next` cache has produced a convincing fake defect tonight, and the reason guardrail 6 exists.

**22:21 — Task 3 parked as Needs human.** `public/sitemap.xml` is outside the write scope (`public/images/` only). Documented with the exact `<url>` entry to add and a one-line verification. Noted explicitly that it **compounds** with the cycle-4 canonical defect: drive mode is currently unlisted in the sitemap _and_ disowned by its own canonical, so fixing only one will not surface the page.

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

**Verifying the traffic needed a trick, because rAF is dead here.** A short frame-timing probe returned **0 frames in 8 seconds** — `requestAnimationFrame` is fully paused while `document.hidden` is true, so the scene only paints in bursts when CDP or a screenshot pokes the renderer. That rules out watching motion directly. Instead I used a **controlled pixel diff**: with the car _parked_ the entire canvas is static — travel is constant, so the palette, road, lamps and markers cannot change — which means anything that differs between two captures is the traffic and nothing else. Two `getImageData` captures either side of 45 forced repaints differed in **12,564 sampled pixels**, confined to a compact box (CSS px 809-968 x 357-500) near the vanishing point extending down and to the left: exactly the approach path of oncoming headlights. That is proof of both rendering _and_ motion without ever seeing an animation.

- A follow-up screenshot showed the bulbs were only ~2-4px, i.e. present but not legible as headlights, so they were enlarged and the halo strengthened. **Presence is not legibility** — worth separating those two questions in future canvas work.

**23:32 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 17.6 kB), verified against a production build with hydration confirmed first (guardrail 23). One commit: `ff1f8d9`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 8 / Phase: Planner`.

---

## Cycle 8

**23:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 8`. Production server healthy on :3008.

**23:34 — Frame-rate item re-checked, still unmeasurable.** A 20-frame probe returned **0 frames in 6 seconds** with `visibilityState: 'hidden'`. Stays parked; nothing else can be done about it from here.

**23:35 — Planner + Critic.** Picked S8 (resume progress) as the most valuable actionable item — it is the most likely reason someone abandons a 21-exit page on a second visit. Wrote guardrails 28-32 before building: never read storage during render (hydration); wrap every access because `localStorage` _throws_ in Safari private mode and with cookies blocked; version the key and validate the restored index against the stop id, because the route is derived from content; never auto-apply progress; never write from the frame loop.

**23:38-23:55 — Builder.** New `src/components/drive/progress.js` plus wiring in `DriveScene`. The design decision worth recording: progress is **offered, never applied**. A returning visitor sees "Resume · EXIT 13 / Co.Lab Portfolio App" beside _Start engine_, with "Forget my progress" underneath. Auto-jumping would take away their choice and hide the start of the route; this way nobody is trapped by state they did not ask for, and a fresh start is one click away. An explicit `?exit=` deep link always wins — that visitor asked for that exit specifically.

**23:56-00:05 — Verified against a production build, reading `localStorage` directly rather than inferring:**

- clean first visit — nothing stored, no Resume, no Forget;
- drove to EXIT 13 — stored exactly `{"index":13,"id":"project-co-lab-portfolio"}`;
- `?exit=5` — landed on EXIT 05, Resume _not_ offered, and the stored `13` survived untouched (the write is forward-only, so an earlier exit cannot clobber a later one);
- plain load — offered "Resume · EXIT 13", confirmed in a screenshot, and clicking it landed on EXIT 13 with the URL set to `?exit=13`;
- Forget — cleared the offer and the key, restoring the first-visit screen.

**Hostile-storage cases, each armed and reloaded through the real code path** (guardrails 29-30): a **stale id** (`index 13` pointing at a stop id that no longer exists), **unparseable JSON**, and **index 999**. All three fell back to "no offer" with the page alive and hydrated — none threw, none restored a bogus position. That last case matters most: the route is built from content, so a stored index means nothing on its own once a role is added or removed.

**00:06 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 18.1 kB). One commit: `4ebe999`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 9 / Phase: Planner`.

---

## Cycle 9

**00:03 local (2026-08-06) — Relief shift took the baton.** `Phase: Planner`, `Cycle: 9`. Production server healthy on :3008. Backlog down to one actionable item (S5 audio), one blocked (S15), one deliberately deferred (S13b).

**00:04-00:15 — Task 1: phone-width regression sweep, and a false positive I did not act on.** The phone cockpit had last been verified in **cycle 1**; since then the daylight system, traffic, mile markers, the aria pass and the resume UI had all landed, and the resume buttons had only ever been seen at desktop width. Measured at 386x840 against production: hydrated, **no horizontal overflow**, cluster strip and trip screen correct, arrival panel present and internally scrollable (472px of content in a 291px scroller), screenshot frame at its native 2:1, resume UI stacking correctly. **No regressions.**

- The near-miss worth recording: the panel measured **26px into the dash**, which looked like a clear overlap and would have been a plausible thing to "fix" by nudging the panel up. Its computed transform was `matrix3d(0.97, …, 26, 0, 1)` — framer-motion's _initial_ state (`translateY 26`, `rotateX 10°`, `scale .97`) never advancing, because rAF is paused in a hidden tab. Neutralising the transform showed the settled layout at 118→538 against a dash top of 538: flush, zero overlap. Compensating for that would have permanently mis-positioned the panel for every real user. Recorded as guardrail 36: check `getComputedStyle(el).transform` before believing a measured overlap.

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

**01:05 — The finding: my own cycle-7 traffic ignored `prefers-reduced-motion`.** Drive mode honours that preference deliberately and consistently — `useDrive.js:227,244` makes the throttle _jump_ to the next exit instead of animating travel, `ProjectShots.jsx:41` disables carousel autoplay, `StopCard.jsx:151,157` swaps the projecting entry for a plain fade, and `drive.module.css:329` kills the star twinkle, ignition pulse and blink. `grep -c reducedMotion src/components/drive/RoadCanvas.jsx` returned **0**. Because the cars advance from `performance.now()` deltas rather than from `sim.travel`, a visitor who had asked their system for less motion still got headlights sliding toward them **while stationary at a stop** — precisely what the preference exists to prevent.

**01:08 — Decision recorded:** under reduced motion, _don't draw_ the traffic rather than freeze it. Frozen cars sitting in a live carriageway would read as wreckage; an absent one simply restores the empty road the page had before cycle 7, which is a coherent state.

**01:10-01:40 — Verified by single-frame pixel comparison.** Movement could not be watched (rAF is paused here), and this time `setTimeout` was throttled too, so the repeated-repaint technique from cycle 7 blew the 45s CDP budget. A cleaner method suited the question anyway: the scene is **fully deterministic at a given exit**, so two loads of `?exit=6` — one with `matchMedia` patched before hydration to report reduced motion, one without — can differ _only_ where traffic is drawn. Result: **185 changed samples in a 30x32px box at the vanishing point**, every other pixel identical. That identity is itself the control: it confirms the rest of the frame is deterministic and the method sound.

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

**1. "you've put unnecessary opposing traffic in a portfolio site that should represent me."** Correct, and the reasoning behind adding it was wrong-headed: in cycle 7 I justified traffic as stopping the road feeling like a treadmill. But manufactured incident on the far carriageway is set-dressing for a driving game, not for a page whose job is to represent one person's work. Removed completely — constants, per-frame car state, `drawOncoming`, and the `reducedMotion` prop on `RoadCanvas` that existed _solely_ to suppress traffic for reduced-motion users (with the traffic gone it had no remaining purpose). S13b (drifting haze) is closed as unwanted for the same reason: the instruction is to take invented atmosphere _off_ the road, not add more.

**2. "i dislike how the car starts in the middle of the road"** — followed mid-turn by **"you also make me steer right back into the middle of the road instead of the middle of the lane of traffic im supposed to be in."** Both symptoms, one cause. The camera's lateral position was `sim.x`, and lateral **0 is the centre line** — so the car straddled it. Worse, `useDrive` decays `sim.x` toward 0 when you release the steering keys, so the game was _actively steering you back onto the centre line_. The second message named that precisely.

- **Fix:** the camera is now `cameraX(sim) = LANE_OFFSET + sim.x`, `LANE_OFFSET = 2.7` — the midpoint of the right-hand lane (the road spans -5.5..5.5 with the centre line at 0, so the right lane's midpoint is 2.75). `sim.x` becomes drift _within_ the lane, so the existing re-centring now returns you to the middle of your lane, which is what it should always have meant.
- Steering clamp tightened from ±3.4 to ±2.3 to match the new frame of reference: full left is 0.4m (just inside the centre line), full right is 5.0m (on the edge line). You can no longer wander onto the oncoming side or off the shoulder.
- Expressed **once** in `world.js` and consumed by all four camera-relative call sites — road ribbon, roadside furniture, exit signs, `project()` — so nothing can disagree about where the car is (the same discipline that fixed cycle 12's dash-height bug).

**Verified against a production build:** the yellow centre line now runs down the **left** of the view with the white edge line on the right, and the road's vanishing point sits slightly left of screen centre — which is where it belongs when you are seated to the right of the road's centreline, and incidentally makes the left-of-centre steering wheel read correctly for the first time. `next lint` clean, `npm run build` compiles (`/drive` 19 kB, down from 19.3). Commit `d76e0bd`.

---

## Cycle 14

**02:03 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 15`... read as `Cycle: 14`. Backlog dry (S15 blocked, S13b closed by the owner), so a **Suggester** pass — but it began with a self-check rather than a hunt for new work.

**02:05 — Regression check on my own cycle-13 change first.** Cycle 13 rewrote camera lateral maths in four places at the owner's request, and `ExitSign` is a DOM overlay positioned independently of the canvas — the likeliest thing to have broken silently. **No regression:** at EXIT 07 the sign's twin posts still meet the ground at the roadside, and the lane markings read correctly with the yellow centre line to the left and the white edge line to the right. The first-run flow was exercised end to end too — Start engine, hold the accelerator as the screen instructs, depart, arrive at EXIT 01 with the panel open.

**02:12 — Re-read the owner's original priorities and found (b) under-served.** Priority (b) was _"the destination-arrival panel needs work"_. Cycle 1 rebuilt the arrival panel **in general**, but nobody had ever looked at the **destination stop itself** — which is the conversion moment, the thing a recruiter reaches after driving twenty-one exits.

- **The defect, observed at `?exit=20`:** all four actions rendered identically, so **"Email hytjin@gmail.com" carried exactly the same visual weight as "Back to the classic site"**. The goal and the exit door were indistinguishable and the eye had nothing to land on. Nothing about the panel marked the end of a journey either.
- **Fixed:** the email is now the primary action and looks it; LinkedIn and the résumé stay secondary; the classic-site link drops to a quiet text link rather than a peer of the contact actions; and a short summary of the trip sits above them.

**The constraint that shaped the summary:** guardrail 13 — never put a number on someone's résumé that was not derived from their content. So the figures come from the route itself (counts of `kind === 'experience'` and `kind === 'project'` stops), from `education.date`, and from `routeLength`. Nothing is typed in, and adding a role or a build updates them automatically. The owner's own prose was left exactly as written; the summary sits alongside it rather than replacing it.

**Verified against a production build:** rendered **2016 / 9 / 8 / 2.7**, checked independently against the content — 9 ids in `experience.js`, 8 names in `projects.js`, `education.date` 2016, 21 stops x 220m = 2.7 mi. All four match. Link hierarchy reads PRIMARY / secondary / secondary / quiet. EXIT 11 re-checked to confirm no collateral change: no summary, both links still secondary.

**02:30 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.3 kB). One commit: `b6f444f`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 15 / Phase: Planner`.

---

## Cycle 15

**02:33 local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 15`. Backlog dry (S15 blocked, S13b closed by the owner). Since the owner's cycle-13 steer was explicitly _against_ unnecessary additions, this **Suggester** pass deliberately hunted the opposite: duplication, and code that lies about itself.

**02:36 — The finding: `world.project()` was dead, and its documentation was false.** The module header read _"Everything on screen — tarmac, poles, exit signs — is placed with `project()` so the canvas and the DOM overlays always agree."_ A grep for `project(` outside `world.js` returned **nothing**. Three sites hand-rolled the same maths independently: `RoadCanvas.buildPoints`, `RoadCanvas.place`, `ExitSign.paint`. All three are algebraically identical to `project(camera, sim, z, x, y)` — I checked term by term before touching anything.

- **Why it mattered more than tidiness:** this is precisely the shape that has already cost this branch twice — the dash height written twice in different units (cycle 12, a 71px overlap that hid résumé content on landscape phones) and the camera lateral written four times (cycle 13, which produced the owner's centre-line complaint). A comment asserting a single source of truth that does not exist actively misleads whoever changes the projection next.

**02:42 — Deliberately not a blind DRY sweep.** `buildPoints` runs SEGMENTS+1 = 131 times per frame, writes into **pre-allocated** point objects, and hoists `curveAt(sim.travel)`/`hillAt(sim.travel)` out of its loop. Routing it through `project()` would have added 131 allocations _and_ 131 redundant trig pairs every frame — trading guardrail 9 for neatness. So: `ExitSign` (one call per frame, free) and `place` (already allocated per call, so neutral) now go through `project()`; `buildPoints` stays inlined **with a comment stating why**, turning accidental duplication into a documented, justified exception. The module doc was rewritten to describe what is actually true and to name that exception.

**02:50-03:05 — Verified as a genuine A/B rather than by inspection.** A first attempt lost its baseline when the tab navigated between builds, so the comparison was redone properly: `git stash` the refactor -> rebuild -> capture a canvas frame from the **pre-refactor** build into the parent window (which never navigates) -> `git stash pop` -> rebuild -> capture again at the same exit. Result: **0 of 1,992,704 pixels differ, max channel delta 0.** For a pure refactor that is the only acceptable answer. The exit sign sits outside that canvas diff, being a DOM overlay, so it was checked separately: it still projects to a finite, correctly-scaled on-screen position (`translate(475px, 234px) scale(0.0508)` at 0.1 MI out).

**03:07 — Builder exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.4 kB). One commit: `e23a9db`. -> **Phase: Reviewer**, then the controller advanced to `Cycle: 16 / Phase: Planner`.

## Cycle 16

**06:2x local — Relief shift took the baton.** `Phase: Planner`, `Cycle: 16`. Backlog dry again, so a **Suggester** pass aimed at the _seams between_ features this run built separately, rather than at new surface.

**The finding: resuming makes the route map contradict itself.** Seeded progress at EXIT 13, loaded plain `/drive`, took the offered _"Resume · EXIT 13"_, opened the map — exactly **2 of 21** rows read "driven": `MILE 0` and `EXIT 13`. The app was telling the same visitor, one click apart, both that they had reached exit 13 and that they had never driven exits 01-12. `useDrive.js:56` starts `visited` as `new Set([0])` and only ever adds on `arriveAt`.

**Why the fix is safe to infer:** `progress.js` writes only inside the arrival path and `writeProgress` returns early unless the new index exceeds the stored one — progress is therefore _arrival-only and forward-only_, which makes a stored index of 13 proof of arrival at every exit before it. That is an observed property of the code, not an assumption about the visitor.

**The distinction that was the actual point:** this had to apply to **resume only**. A `?exit=11` deep link is proof of a click, not of a drive, so it must keep marking just the one exit. `markVisitedThrough` therefore lives on the hook but is called from exactly one place — `resumeDrive` — and the JSDoc says why, so a future cycle doesn't "helpfully" wire it into the deep-link effect too.

**Verified on a production build at `:3008`, all three cases, hydration confirmed each time:**

- resume to EXIT 13 → **14 of 21** driven, `MILE 0` through `EXIT 13`, contiguous;
- deep link `?exit=13` with the same storage → exactly `MILE 0` + `EXIT 13`;
- fresh visit, storage cleared → `MILE 0` only, and no resume offer rendered.

**Second item, deliberately not built.** While parked, `RoadCanvas.draw()` still repaints every frame and produces a provably identical image — since traffic was removed (cycle 13) the drawing is a pure function of `travel`, `x` and the camera, all constant while parked. The fix is a cheap dirty-check, but its _benefit_ cannot be measured in this environment (rAF suspended in a backgrounded tab; the only forced repaint is a resize, which must bypass the check because setting `canvas.width` clears the backing store). Shipping an unmeasurable optimisation into a hot path is guardrail 9's exact failure mode, so it was written to the Backlog as **S16a** with the reasoning attached instead.

**Builder + Reviewer exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.4 kB). One commit: `f0b7c6c`. Both cycle-16 tasks resolved **Done**. -> controller advanced to `Cycle: 17 / Phase: Planner`.

## Cycle 17

**Suggester.** Backlog dry (S15 blocked, S16a waiting on a foreground window, S13b closed). This pass deliberately left the canvas alone and looked at what the page says through the channels that are _not_ the canvas — the tab, the history entry, and what a screen reader hears — on the grounds that on a page which is almost entirely `<canvas>`, those are the only channels some visitors have.

**Finding 1 (measured, not inferred).** Drove EXIT 13 -> EXIT 14 on the production build. `location.href` changed; `document.title` was `"Hyun-Tae Jin | Drive mode"` **before and after**. Then the sharper half: the only `[aria-live]` element on the page while driving is Next's own route announcer, and it is `aria-live="assertive"`. `router.replace(..., {shallow:true})` fires on every departure, so a screen-reader user gets that same string barked at them on all twenty legs and is never told which exit it is. One change fixes both, because the announcer reads `document.title`.

**Finding 2 (measured).** Captured the `aria-live` node before and after an exit change: **different nodes**, and mid-drive there is no polite region on the page at all. `StopCard` carries the attribute but sits inside `AnimatePresence` keyed by `stop.id`, so it is destroyed and rebuilt on every arrival — the documented case where a live region announces nothing. The attribute was reading as an accessibility feature while doing nothing.

**Built.** A per-stop `next/head` title in `DriveScene`, rendered only once under way (before that the ignition splash is the page). A permanently mounted `role="status" aria-live="polite"` region alongside the itinerary. The dead attribute removed from `StopCard`, with a comment naming its replacement so it does not come back.

**Caught in verification, not in review.** The first build produced `"MILE 0 · Hyun-Tae Jin | Hyun-Tae Jin"` — stop 0's own title _is_ the owner's name, so appending the brand doubled it. `titleFor` now omits the brand in that one case. This is exactly the class of thing that only shows up when you look at the real output.

**Verified on the production build at `:3008`:** titles distinct across EXIT 14 / MILE 0 / EXIT 20; `curl` confirms the served HTML still carries the page-level `<title>` (guardrail 46 — the DOM would have lied here, since it shows the client's value); the status region is the **same DOM node** across three arrivals while its text changes (guardrail 47); exactly one status region; no `aria-live` on any remounting node; MILE 0 announces _"At the start line"_, not an arrival (guardrail 48).

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.6 kB). One commit: `aafb4d9`. Both tasks **Done**. -> `Cycle: 18 / Phase: Planner`.

## Cycle 18

**Suggester.** Backlog dry. This pass went deliberately back to the **owner's own priority (a)** — _"the car interior dash needs work ... think of what a car should look like from driving perspective"_ — instead of drifting further into peripheral polish, and compared the rendered cockpit against the geometry the road is actually drawn with.

**The finding, measured in two halves.** Ran `world.js` under Node and projected the road centre at increasing distance: `z=10 -> x=759`, `z=100 -> x=945`, `z=20000 -> x=960.14`, `z=1e6 -> x=960.00`, against a screen centre of 960. The vanishing point converges **exactly** on the middle of the image — it has to, because `project()` puts the principal point at `width/2` and divides the lateral offset by `z`. The camera is the driver's eye, so the eyeline is the middle of the viewport. Then measured the cockpit in the browser at 1920: steering wheel centred at **615 (32.0%)**, binnacle at 27—32%, but mirror at **960 (50.0%)** and the glass, pillars and headliner symmetric about 960. The wheel was **345px — 18% of the viewport — left of the driver's own eye**. You were sitting in the passenger seat looking across at the wheel.

**The comment that hid it.** `world.js` justified the framing with _"the road's vanishing point falls slightly left of screen centre, which is exactly where it belongs when you are sitting to the right of the road's centreline."_ The probe shows that is false: what falls left of centre is the road's _near_ field (-201px at 10m), which is correct and is what makes the centre line run down the left. The vanishing point does not move. A false sentence was the stated reason the cockpit was framed that way — the same defect shape as cycle 15, and load-bearing.

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

**T1 — frame rate.** A first attempt produced nonsense: the _ignition screen_ measured a 10fps median while the running sim measured 29.9. An idle page cannot be slower than a busy one, so the sampler was being disturbed rather than the app being slow (guardrail 58). Redone as an **alternating parked/driving comparison** in the same session, three rounds of 120 frames each: driving **29.9 / 30.0 / 29.9**, parked **21.8 / 17.1 / 21.8**. Driving is faster and steadier than idling, which places the ~30fps ceiling in the environment (the homepage empty loop gave 28) and shows the page coalescing frames when nothing is scheduled. **Verdict: the drive loop is not the limiting factor here.** Recorded with the explicit caveat that this machine is not a 60fps reference (guardrail 57).

**T2 — focus return.** Focus the "Route map" button -> open -> `activeElement` is the dialog panel and is inside the dialog -> **Escape** -> dialog closed and `activeElement === trigger`. Escape still reaches the global handler, so guardrail 61 holds. Passed as built.

**T3 — engine audio, parked since cycle 9.** The blocker was never the code: `element.click()` grants no user activation, so the context never reached `running` and `update()` correctly early-returned. Clicked the toggle with a **real dispatched input event** this time: `userActivation.hasBeenActive` true, context **`running`** at 192kHz, master gain ramped to **0.09**, label and `aria-pressed` flipped honestly.

Then, to prove it _tracks_ rather than merely runs: patched `createOscillator`/`createGain`/`createBiquadFilter` on the context prototype, navigated client-side to `/` and back so `AudioToggle` unmounted (tearing the old graph down) and rebuilt an observable one in the same JS realm, and read the AudioParams while driving. Idle **43.83 Hz** -> accelerating **65.37** -> at speed **71.56**; the square oscillator exactly double the saw at every sample; lowpass **691.9 -> 1112.8 -> 1284.2 Hz**; tyre noise **0 -> 0.0177 -> 0.0333**. Idle 43.83 Hz is exactly `IDLE_HZ + (REV_HZ-IDLE_HZ) * rpm` at parked idle, which is what proves `update()` is running against the real sim rather than the graph merely existing. Toggling off ramped master gain to **0**.

**Exit.** All three passed as built — **zero code changes** (guardrail 60). The **Needs testing** section is now empty for the first time in the run, and the **Awaiting scenario** entry is resolved. -> `Cycle: 21 / Phase: Planner`.

## Cycle 21

**Planner.** Backlog mined: **S16a** became actionable the moment cycle 20 established that the window is foregrounded and rAF genuinely runs. It had been parked since cycle 16 under guardrail 9 — not because the fix was hard, but because an optimisation whose win cannot be observed has no business going into a paint loop.

**Read the code before designing the check (guardrail 62).** A grep for `sim.` in `RoadCanvas.jsx` returns `sim.travel` alone; `sim.x` enters only through `cameraX(sim)` inside `buildPoints` and `project`; `camera` changes only in `resize()`. No `Math.random`, no clock. So the image is a pure function of `(travel, x, camera)` — established by reading, not assumed.

**The two details the design turns on.**

1. While parked, `useDrive.step()` still runs its steering block, so `sim.x` decays asymptotically toward 0 and never repeats a value. An equality check would have skipped **nothing** — the optimisation would have looked correct and done zero work. Hence a **1e-4 m** tolerance (~0.03px at the nearest projected point, where the scale is ~335 px/m).
2. The comparison is against the last _painted_ state, not the previous frame (guardrail 63). A per-frame delta threshold silently freezes slow motion; this one bounds the error at the threshold itself, because accumulated drift eventually crosses it.

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

**Suggester.** Backlog dry (S15 blocked, S13b closed), so a fresh pass — pointed back at the owner's priority (c), the project screenshots, which no cycle had re-examined since building them in cycle 1. The carousel itself holds up: captures show whole in a browser-chrome frame with `object-contain` at 2:1, they cross-fade on their own, they pause on hover _and_ focus, reduced motion holds frame 1, and a stop change restarts at frame 1. Two things **around** it are measurably wrong.

**Finding 1 (measured at EXIT 13).** All four `<img>` elements sit in the DOM at once with only the current one at `opacity: 1`. Opacity does not remove an element from the accessibility tree, so all four carried live `alt` text: _"Co.Lab Portfolio App — screenshot 1 of 4"_ through _"4 of 4"_. A screen-reader user met four screenshots where a sighted user sees one.

**Finding 2 (measured).** Each inactive dot's hit box was **6×6 CSS px** (active 20×6). WCAG 2.5.8 asks for 24×24. This carousel appears inside the arrival panel on a phone, so that is the difference between being able to browse the captures and not.

**A guardrail I had to amend rather than break.** I wrote guardrail 69 as "growing a hit area must not move a pixel". Building it, that turned out to be unsatisfiable: 6px dots with a 6px gap put centres **12px** apart, which fails the 24×24 target rule _and_ fails its spacing exception (24px circles centred on each target would intersect). Compliance requires more room by definition. Rather than silently ship against my own rule, the guardrail carries an amendment saying exactly this, and the weakened form — pill size unchanged, no overlapping targets, confirm by screenshot — is what was verified against.

**Verified on the production build at EXIT 13:** exactly **one** image exposed and it is the one at `opacity: 1` (guardrail 67 — a count of one would not have proved the _right_ one), still true after the carousel advanced from 3 of 4 to 4 of 4 (guardrail 68); every dot target **24×24**; neighbour overlap **0px**; pills unchanged at 6×6 and 20×6; and a zoomed screenshot confirms the row still reads as three dots and a pill.

**Exit.** `next lint` clean (after a first build failed on a JSX comment placed inside a ternary's expression slot — caught by the build, fixed, rebuilt), `npm run build` compiles (`/drive` 19.7 kB). One commit: `2f62f6d`. -> `Cycle: 23 / Phase: Planner`.

## Cycle 23

**Suggester.** Backlog dry, so a fresh pass aimed at the owner's priority (b) — the destination panel — on a **phone**. Guardrail 4 has demanded a 390×844 check of that panel since cycle 1; cycle 12 measured phone _overlap_ but never opened the destination stop there. Both faults below were measured in a sized same-origin iframe (the cycle-19 technique).

**Finding 1.** At EXIT 20 the panel's scroll area is `clientHeight` **316** against `scrollHeight` **328** — 12px hidden, and a screenshot shows those 12px cutting straight through _"Download résumé"_ and _"Back to the classic site"_. It scrolls, so nothing is unreachable, but the last frame of the whole drive — the conversion moment — reads as broken. The space had gone somewhere specific: the destination is the only stop carrying `TripSummary`, and on a 316px scroller its `sm:grid-cols-4` collapses to **two 143px columns**, stacking the four figures 2×2 for **112px** of height.

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

| viewport | dash          | bonnet visible | bonnet hidden | reflection hidden | wipers hidden |
| -------- | ------------- | -------------- | ------------- | ----------------- | ------------- |
| 1440×900 | 324px (36%)   | 49 of 54px     | 5px           | 0                 | 0             |
| 1024×500 | 190px (38%)   | 17 of 30px     | 13px          | 10px              | 0             |
| 844×390  | 190px (48.7%) | **0 of 23px**  | 52px          | 50px              | 30px          |

On a landscape phone the car's own bonnet — the element that says _you are looking over its nose_ — was gone completely, on the single viewport where the cockpit is already most cramped.

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

**Suggester.** Backlog dry. Cycle 24's landscape-phone screenshot had left an _impression_ that the trip computer looked wrong; this cycle went and measured it rather than carrying the impression forward.

**The finding, and why nothing looked obviously broken.** At 844×390 the terminal's box is **20px** tall (`clientHeight` 18) while its content needs **54px** — a 36px overflow. `.screen` is `overflow: visible`, so instead of clipping it **painted outside its own box, over the control row**. Row by row: `~/route $ drive --to` / `ARRIVED` was the only row still inside; **`EXIT 06 · Co.Lab` had height 0**; **the progress bar had height 0**; `yr 2023` / `odo 0.8 mi` sat entirely below the box. The line that says which exit you are at had been squashed out of existence, while the bar and year still _drew_ over the buttons — which is exactly why a screenshot alone was ambiguous (guardrail 82).

**Where the 190px goes — measured, so the fix was arithmetic and not taste.** Stack padding 18 + gaps 16 leaves **156**. Cluster strip **74** (`shrink-0`, driven by a 62px gauge), trip computer **20** (`flex-1`, gets the remainder), control row **62** (driven by the 62px GO pedal). 74 + 62 + 54 = 190 against a 156 budget — it could not fit, so the flex children collapsed to zero rather than anything visibly "breaking".

**Built.** The shortfall comes out of the three places that can afford it, conditioned on `@media (max-height: 430px)` alone: a 44px gauge instead of 62, tighter stack gaps and terminal padding, pedals at 42/48 instead of 52/62, and the shell-prompt row — the one row carrying nothing the exit line, bar and year do not already say — stands down. Deleting the gauge or the screen would have made the measurement clean while trading away the owner's priority (a); guardrail 84 was written to stop exactly that.

**Verified on the production build:**

- 844×390 — overflow **36px -> 0**, **no row clipped**, screen box **20 -> 68px**, exit line height **0 -> 17px**, progress bar **0 -> 6px** (guardrail 83 — "no overflow" alone could have been satisfied by collapsing further), budget rebalanced **74/20/62 -> 52/68/48**, screen fully inside the dash, smallest control **25px** with pedals 38/43px (guardrail 85), nothing below the viewport, no horizontal scroll, panel/dash overlap **0**
- 390×844 and 1440×900 — **identical** screen box and all four row heights, so the height breakpoint does not leak upward (guardrail 81)
- screenshot confirms the exit, the bar and the year all sit inside the bezel with the controls clear beneath

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 19.9 kB). One commit: `e9cfe30`. -> `Cycle: 26 / Phase: Planner`.

## Cycle 26

**Suggester.** Backlog dry. Cycles 12, 23 and 25 have all checked the arrival panel and the cockpit at phone sizes; nobody had ever opened the screen that comes _before_ both — the ignition splash, the first thing every visitor sees.

**The finding, and it only exists for returning visitors.** With saved progress present the splash gains two extra controls (`Resume` and `Forget my progress`), and that is enough to push it past a short landscape viewport:

| viewport         | splash content | overflow each side | "back to the classic site"      |
| ---------------- | -------------- | ------------------ | ------------------------------- |
| 390×844 portrait | 522 in 844     | 0                  | fully visible                   |
| 844×390          | **394 in 390** | 2px                | bottom 2px clipped              |
| 667×375          | **393 in 375** | 9px                | 368—384, ~7px of 17 visible     |
| 568×320          | **468 in 320** | **74px**           | **entirely below the viewport** |

With storage clear it fits at 844×390 (343px), which is exactly why this had never shown up — every previous check started from a clean slate.

**Why it is worse than a clipped link.** The splash is `z-50` and the scene's own "← exit" link is `z-40`, so while the splash is up that link is the **only** way out of drive mode, and `document.body` carries `overflow: hidden`, so there is no scrolling to recover it. At 568×320 the heading is cut off the top too, because `justify-center` splits the overflow evenly.

**Two halves, and it needed both.** Tightening alone cannot save 568×320 — it is 148px short — so the splash had to become scrollable. But a **centred flex child that overflows cannot be scrolled back to**: with `justify-center` the top is pushed to a negative offset that no scrollbar reaches. So the centring moved to `m-auto` on an inner wrapper (guardrail 86, written before building precisely because this trap is easy to walk into and produces a fix that _looks_ right). Then, below 430px of height, the splash tightens: smaller heading, tighter margins, the two buttons side by side rather than stacked, and the key legend three across instead of two.

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
| -------- | ------- | ------------ | -------------------------- |
| 844×390  | 13      | **3** of 21  | **803px**                  |
| 390×844  | 13      | 11 of 21     | 357px                      |
| 1440×900 | 20      | 12 of 21     | 791px                      |

On a landscape phone that is scrolling most of a twenty-one row list to find yourself before you can navigate relative to yourself.

**Built.** The open effect sets the scroller's own `scrollTop` so the current row is centred where there is room. Not `scrollIntoView` (it walks up the tree and can move ancestors it was never asked to, guardrail 92); instant rather than smooth (no reduced-motion branch needed to be honest about it, guardrail 93); and it does not touch focus — the existing effect owns that (guardrail 91).

**The first attempt was wrong, and the verification is what caught it.** It used `current.offsetTop`. But the scroll container is not positioned, so a row's `offsetParent` is the **dialog backdrop**, and `offsetTop` came back 1047 against a scroller sitting at `offsetTop` 111 — 111px of error, which scrolled the current row clean _past the top_ of the window. The tell was two checks disagreeing: "pixels below the fold" said 0 while "row inside the window" said false. Rather than adjust a constant, the measurement became a `getBoundingClientRect` delta, which is origin-independent and cannot drift if the DOM gains a positioned ancestor later.

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

| exit | stop                        | content | visible | hidden           |
| ---- | --------------------------- | ------- | ------- | ---------------- |
| 04   | Sabbatical / COVID / Family | 552px   | 326px   | **226px, 40.9%** |
| 19   | Pit stop — the toolbox      | 410px   | 326px   | 84px, 20.5%      |
| 10   | Senior MES DevOps Engineer  | 384px   | 326px   | 58px, 15.1%      |

The stop with _pictures_ got the room and the stop with _prose_ did not, while **736px of the band sat unused** either side. On a laptop, two fifths of a role's detail sat below a fold a recruiter may never scroll.

**Widening alone was measured and rejected.** At 928px: EXIT 10 -> 0 hidden, EXIT 19 84 -> 44, EXIT 04 226 -> 106. But the paragraphs already run ~100 characters a line at 704px, and widening pushes that to ~135 — trading a fold for a readability regression. Widening **and** flowing the prose in two balanced columns was measured instead: EXIT 10 -> 0, EXIT 19 -> 0, EXIT 04 226 -> 94, **and** the paragraph measure down to 412px, about 63 characters. Better on both axes, so that is what was built.

**The first build was worse than the trial, and the verification caught it.** The trial used a plain two-column rule; the build added `break-inside-avoid` on every direct child, which seemed prudent and was not: it stops the big blocks — the whole bullet list, the toolbox's group grid — from splitting at all, so the columns cannot balance and the content grows **taller**. Measured: the toolbox went **84 -> 261px hidden** and the senior role **58 -> 154**, i.e. worse than before the change. Scoped to list items only, the shipped version matches the trial exactly. The lesson is the one guardrail 99 half-anticipated: _a trial is not the shipped code_, and the sweep has to be re-run against the build.

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

**Getting the harness right took two attempts, and the first failure is worth recording.** `prefers-reduced-motion` cannot be toggled from here, so `matchMedia` has to be patched inside the iframe before React mounts. Patching _before_ setting `src` does nothing useful: navigation replaces the window, so the patch lands on the `about:blank` window and `matchMedia('(prefers-reduced-motion: reduce)').matches` came back **false** even though the patch reported success. The working version sets `src` first, then polls `contentWindow` and patches the moment `location.href` is the real URL — which happens while `readyState` is still `loading`, before hydration. The probe reports the readyState at patch time so this cannot silently regress.

**All four mechanisms hold, each against a control:**

| mechanism                | reduced motion ON                                              | control, motion allowed                                              |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| project carousel         | held frame 0 for **9s**; 4 dots still present                  | cycled frames **0 -> 1 -> 2** in 11s                                 |
| arrival panel transition | `transform: none` in **all 26 samples**; opacity animated 0->1 | **15** non-identity samples, e.g. `matrix3d(0.993956, 0, 0, 0, ...)` |
| Next -> arrival          | **102ms**, teleported                                          | **9,887ms**, drove the leg                                           |
| idle canvas repaints     | **0** in 9s                                                    | —                                                                    |

The control matters as much as the measurement: without it, "the panel used no transforms" is indistinguishable from "the harness never took effect". The control run shows the same code producing 3D transforms, an advancing carousel and a ten-second drive, so the reduced-motion readings are real.

**One interaction that did not exist in cycle 11.** Cycle 21 added the canvas dirty-check; cycle 11's reduced-motion path teleports rather than drives. Composed, they behave correctly: the teleport repainted the canvas exactly **2 times** and then **0** more once settled — the road is redrawn for the jump without falling back to painting an identical frame every tick. URL, document title and the arrival announcer all updated (`?exit=13 -> 14`).

**Outcome: no defect, and nothing changed.** Worth stating plainly rather than dressing up as work: eight cycles of layout and paint changes left the accessibility contract intact. The probe itself is now written into the tasks file so a future cycle can re-run it without rediscovering the navigation trap.

**Exit.** No commit to `src/` — there was nothing to fix. -> `Cycle: 30 / Phase: Planner`.

## Cycle 30

**Suggester.** Backlog dry. `ExitSign.jsx` was one of three drive files never audited in this run, and after the cockpit it is the roadside element the owner's priority (a) leans on hardest.

**Reading it first, then measuring.** The component is well built — it goes through the shared `project()` (cycle 15), hides itself when parked and when past the exit, and drives its flare off distance. The problem is one number. Driving a leg from EXIT 05 and sampling the wrapper, `opacity` came back **1 on the very first sample after departure** and stayed there.

**The arithmetic behind it.** `VISIBLE_FROM = 420` is a literal; `LEG_LENGTH = 220` is exported two files away and was never used here. So the sign's window is **1.91× the furthest you can ever be from it**:

- `opacity = min(1, (420 — z) / 160)` evaluates to **1.000** at z = 220. It would only have finished at z = 260 — past the start of the leg. The fade-in was dead code.
- `near = 1 — z/420` starts at **0.227**, so the retroreflective flare — which the comment above it calls _"most of why an approach reads as an approach rather than a sprite getting bigger"_ — was already a quarter spent before the car moved, and only ever reached 0.967.

What a visitor saw: the sign did not fade in on approach; it **popped into existence at full opacity, already partly lit**, the moment you pulled away from a stop.

**This is the shape this run keeps finding** — a constant chosen independently of the geometry it has to agree with (guardrail 43's family: the dash height written twice, the camera lateral written four times, the interior furniture pinned in percentages against a clamp). The fix is the same in kind: derive it. `VISIBLE_FROM = LEG_LENGTH`, `FADE_OVER = LEG_LENGTH * 0.35`.

**Verified on the production build, driving a real leg:**

|                        | before           | after                                            |
| ---------------------- | ---------------- | ------------------------------------------------ |
| opacity at departure   | **1.000**        | **0.004**                                        |
| opacity ramp           | none — dead code | 0.004 -> 0.42 -> full at **4.8s** of a ~9.9s leg |
| flare at departure     | 0.227            | **0.000**, sweeping to 0.46                      |
| parked / past the exit | hidden           | hidden (unchanged)                               |
| scale curve            | monotonic        | monotonic, transform untouched                   |

The sign is fully opaque roughly halfway along the leg, so nothing is lost as wayfinding — and the "Next exit" banner covers the first seconds regardless (guardrail 102).

**One thing not obtained, stated rather than glossed:** a screenshot of the sign mid-approach. By the time a capture could be timed the car had arrived and the arrival panel occludes that region. The numeric series above is the evidence; there is no visual for this one.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.1 kB). One commit: `f299914`. -> `Cycle: 31 / Phase: Planner`.

## Cycle 31

**Suggester.** Backlog dry. `Sky.jsx` and `daylight.js` were the last two drive files never audited in this run.

**Most of it holds up, and that is a result.** The shared-palette design — one module-level object mutated in place, for the reasons guardrail 9 gives — is safe: every caller (`Sky`, `RoadCanvas.draw`, `ExitSign.paint`) reads it immediately and nobody keeps the reference, so the mutation cannot leak between frames. The star field is generated from a fixed seed so SSR and the client agree. And the reduced-motion CSS block already covers **all four** animations `.star`, `.ignition`, `.blink` and `.shot` — which cycle 29's JS-level sweep had not looked at.

**The arc itself works.** Measured at six exits: horizon `rgb(226,140,84)` golden at MILE 0, `rgb(188,111,101)` at EXIT 05, `rgb(116,90,114)` at EXIT 10, `rgb(37,79,118)` blue at EXIT 14, `rgb(122,152,172)` pale at the destination; stars 0 -> 0.85, moon 0.12 -> 0.91.

**One anchor is in the wrong place, and the measurements are what exposed it.** EXIT 14 measured a **higher** moon (0.908) than EXIT 19 (0.887) — the sky was getting _lighter_ before the stop that is supposed to be the darkest. The cause: the keyframe reads `at: 0.92, // full night — the toolbox`, and the module header promises _"full night by the toolbox"_, but the toolbox is EXIT 19 of 20, which is **0.95**. `0.92` is **exit 18.40** — mid-leg, where nobody parks. Arrived at the toolbox you were already **37.5% into dawn**: `starOpacity` 0.850 against a peak of 1.0.

**The shape, for the fifth time this run:** a number typed by hand that has to agree with the route's geometry, and quietly does not (dash height, camera lateral, interior furniture, exit-sign window, now the daylight anchor). The fix is the same in kind — derive it.

**Built, with three deliberate limits.** Only the keyframe that names a _real stop_ was derived; "the middle of the career highway" and "the side builds" are ranges, so they keep their hand-picked fractions and their comments now say they are judgement calls rather than implying an anchor (guardrail 107). A missing stop falls back to the old literal rather than producing a NaN palette (108). And since `paletteAt` walks the keyframes assuming they ascend — a stray derived value would have broken interpolation for a whole stretch of road _silently_ — a guard nudges any out-of-sequence value back between its neighbours (106).

**Verified on the production build:**

|                        | before                 | after                                               |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| EXIT 19 toolbox        | star 0.850, moon 0.888 | **star 1.000, moon 1.000**, horizon `rgb(20,64,95)` |
| EXIT 18                | —                      | star 0.967, moon 0.982 — monotonic approach         |
| EXIT 20 destination    | 0.6 / 0.7              | **0.6 / 0.7, unchanged**                            |
| MILE 0, exits 05/10/14 | —                      | unchanged                                           |

A cold deep link straight to EXIT 19 also lands on peak night, and the run produced **zero console messages**. No colour value was retuned — this moved _when_ full night happens, not what it looks like.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.2 kB). One commit: `f6c267f`. Every drive file has now been audited at least once. -> `Cycle: 32 / Phase: Planner`.

## Cycle 32

**Suggester — hunting the pattern, not a file.** Every drive file has now been audited, so instead of picking another one this pass went after the _shape_ that has produced a defect in five separate cycles: a constant typed in one place that has to agree with a number kept somewhere else, and quietly does not — the dash height (24), the camera lateral (13), the interior furniture (24), the exit-sign window (30), the daylight anchor (31). Every module-level numeric constant in `src/components/drive/` was enumerated and asked one question: **does this have to agree with something it cannot see?**

Most do not. `HOLD`, `IDLE_HZ`/`REV_HZ`, `SWEEP`/`START_ANGLE`, the sign's own design dimensions and the road's segment counts are all self-contained, and the sign's lateral offset and the lamp positions already derive from `ROAD_HALF`. **Three did.**

**A — the sky's repaint guard re-typed the palette's quantisation.** `daylight.js` quantises progress into `STEPS = 360` before rebuilding colour strings, and does not export it; `Sky.jsx` independently wrote `Math.round(progress * 360)`. The dangerous direction is concrete: make the palette _finer_ and the sky would still repaint on 360 steps, lagging and banding, while the road — which reads the same palette every frame with no guard — kept up. `STEPS` is now exported and consumed.

**B — the mile markers.** `MARKER_SPACING = 110` sat under a comment saying _"Mile markers sit at half a leg"_, with the draw site repeating _"half a leg apart"_. `LEG_LENGTH` is 220. Correct today by coincidence of arithmetic; now `LEG_LENGTH / 2`.

**C — top gear.** `GEAR_RATIOS` ended at a literal `42` beside `MAX_SPEED = 42`, and the code's own fallback `GEAR_RATIOS[sim.gear] ?? MAX_SPEED` shows the top of the band is meant to _be_ `MAX_SPEED`. Raise `MAX_SPEED` alone and top gear still caps at 42, so `inGear` runs past 1 and clamps — the tachometer would peg for the entire top gear. Now built from `MAX_SPEED`.

**The verification is the whole point of this cycle.** All three substitutions produce identical numbers today, so the only acceptable result is that **nothing changed** — and that had to be measured rather than reasoned (guardrail 111), using the cycle-15 method: capture a canvas frame before, rebuild, capture after, compare every pixel.

|                                      | result                                                |
| ------------------------------------ | ----------------------------------------------------- |
| EXIT 09 canvas                       | **0 of 4,096,000 pixels differ**, max channel delta 0 |
| EXIT 16 canvas                       | **0 of 4,096,000 pixels differ**, max channel delta 0 |
| sky gradient / star / moon / skyline | **byte-identical** at both exits                      |
| gauge count                          | unchanged                                             |
| speed under autopilot                | 0 -> 81 mph, never past the 94 mph maximum            |

**One limitation stated rather than glossed:** the probe for the lit `PRND` letter matched both the phone and desktop copies of the selector, so it could not isolate which gear was showing. The speed curve is the evidence for the gear ladder, not the gear glyph.

**Also deliberate:** the `?? MAX_SPEED` fallback is now unreachable, and was left alone. It is still a correct guard for a short array, and removing it would be a second change hiding inside a no-op commit (guardrail 114).

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.2 kB). One commit: `57cd6cc`. -> `Cycle: 33 / Phase: Planner`.

## Cycle 33

**Two Suggester probes. The first came back clean; the second found a real defect.**

**Probe 1 — does the per-frame subscriber set leak?** `drive` is a `useMemo` whose identity changes on _every arrival_, so every consumer's effect tears down and re-subscribes 21 times across a drive. A single missing cleanup would grow the fan-out silently and cost a little more every frame for the rest of the session — the kind of fault nothing in the build would flag. Measured by patching `Set.prototype.forEach` and recording `this.size`: no other Set in drive code is iterated per frame, so that is exactly the listener count. **13 at MILE 0, and exactly 13 after twelve stop changes** across project stops, the toolbox and the destination, with one canvas and one status region throughout. No leak.

**Probe 2 — what can a keyboard-only visitor actually reach?** Never tested end to end. Of **38** focusable elements at EXIT 13, **25 live inside the `sr-only` itinerary** — the screen-reader and crawler copy of the résumé, which carries a link for every stop. That container is `position: absolute; clip: rect(0px, 0px, 0px, 0px)`: hidden visually, **fully present in the tab order**. So `Tab` from the top of `/drive` walked LinkedIn, GitHub, Résumé, two certificates, _Live site / Source_ for all eight builds, and the destination's four links — **25 presses** — before the first control a sighted person could see. Worse than "hard to follow": those elements have real layout boxes, up to 195×19.5, clipped to nothing, so the focus ring was painted on clipped-away content. Focus was **nowhere**.

**The fix had to serve two audiences at once.** The obvious move — `tabindex="-1"` on those 25 links — would fix the sighted keyboard user by robbing the screen-reader one, for whom that block _is_ the résumé and the only route to a stop's links without driving (guardrail 115, written before building). A skip link costs them nothing: first in the tab order, hidden until focused, one press to the cockpit.

**Verifying it took three attempts, and the first two were the interesting part.** `skip.focus()` set `document.activeElement` correctly but `element.matches(':focus')` was **false**, so the link stayed clipped and the measurement said the fix had failed. The CSS was fine — `:focus` does not match while the _document_ is unfocused, which was true inside the probe iframe and then true at top level too (`document.hasFocus()` had gone false since cycle 20). This is guardrail 45's trap wearing a new hat. The honest test needed a **real click to focus the page and real `Tab`/`Enter` keys**, and a fresh load so the click did not leave a focus starting point mid-page.

**Measured, with real key presses:**

| step    | result                                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Tab`   | **"Skip to the drive controls"** — `clip: auto`, box **171×22** at (12,12), was 34×18 clipped to nothing, `:focus-visible` |
| `Enter` | focus on `#drive-controls`                                                                                                 |
| `Tab`   | **"Back to the previous exit"**, inside the target, 78×31, visible                                                         |
| after   | the skip link clips itself away again                                                                                      |

**Presses to the first visible control: 25 -> 1.** The itinerary still carries all 25 links, text unchanged, and the target has `tabindex="-1"` with six controls inside it at 390×844, 844×390 and 1440×900.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.3 kB). One commit: `de9a7da`. -> `Cycle: 34 / Phase: Planner`.

## Cycle 34

**Suggester.** Cycle 33 made real keyboard focus measurable for the first time. This pass spent that capability on two things: a question left open since cycle 12, and the residue cycle 33 deliberately did not finish.

**Settled — the controls do have a focus indicator.** Cycle 12 measured "no focus indicator anywhere", correctly identified it as an artefact of programmatic focus (which never matches `:focus-visible`), and could not prove the negative. Fourteen real `Tab` presses on a focused document, recording `getComputedStyle` at every stop: **all fourteen** report `outline: auto 1px` with `:focus-visible` true, **none** suppressed. The alarm was false and is now closed on evidence rather than reasoning.

**The finding.** Of those fourteen stops, **13 were off-screen** — every itinerary link. They carry the ring; it is painted on content clipped to nothing. The skip link rescues anyone who takes it, but anyone who keeps tabbing still walks 25 blind stops.

**The fix I expected to make turned out to be impossible, and proving that was the useful part.** The standard treatment is `focus:not-sr-only` — which is exactly what makes the skip link appear at 171×22, because the skip link is _itself_ `sr-only`. It cannot work for a **descendant** of an `sr-only` container. Rather than assume, I forced a focused itinerary link to `position: fixed; clip: auto` at (16, 64): it took a correct **85×38** layout box, and `document.elementFromPoint` at its own centre returned the **canvas**. A fixed descendant does not escape an ancestor's `clip: rect(0,0,0,0)`.

That ruled out revealing the link in place. Unclipping the container on `focus-within` would drop the entire résumé over the driving scene; re-hiding the block by off-screen positioning instead of clipping would restructure the only machine-readable copy of the résumé on a hunch about screen-reader behaviour I cannot test here (guardrail 121). So the answer is not to move the link out but to **report where focus is, from outside the clip**: a small chip naming the focused link, `aria-hidden` and deliberately not a live region — a screen reader already announces it, and twice is worse than not at all (guardrail 122).

**A method note that matters.** My first hit test said the chip was painted _behind_ the canvas. It was not: `pointer-events-none` — which the chip needs so it can never intercept a click — also removes an element from hit testing, so `elementFromPoint` skipped it. Lifting that property _only for the measurement_ returns the chip itself. Guardrail 120 said a layout box is not visibility; it turns out a hit test is not either, unless you account for what you have done to the element.

**Verified with real key presses on a focused document:**

- `Tab`×3 -> chip reads **"Résumé outline: GitHub"**, box **183×34** at (12,12), `z-index: 50` over the canvas' `auto`; screenshot confirms it on screen
- `Tab`×2 more -> tracks to **"Résumé outline: Coding Temple certificate"**
- focus a real control -> chip **disappears**
- itinerary still **25** links; skip link still first in the tab order
- chip **absent** on a plain load, after clicking around with the mouse, and on the phone layout

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.4 kB). One commit: `ed61397`. -> `Cycle: 35 / Phase: Planner`.

## Cycle 35

**Suggester — auditing the run's own output.** Backlog dry. The three **Needs human** items are the highest-value work left in this run and the only things waiting on the owner — and they were written around cycles 4 and 10, **25 cycles ago**, against files the owner has been editing since (the working tree still carries their uncommitted changes under `src/components/sections/` and `src/content/`). A patch that no longer applies is worse than no patch, because it costs the owner time and then makes the analysis look wrong. So this pass re-checked all three against the current files and the served HTML rather than against the notes that recorded them.

**A wrong turn worth recording, because it nearly became the finding.** Checking whether `Projects.jsx` was still the live component, I grepped for its importers and filtered the results with `grep -v "sections/"` — which excluded the one line that mattered, because the import lives _in_ `sections/ProjectsSection.jsx`. For a moment the conclusion looked dramatic: the starred item aimed at dead code. It is not. The chain is `pages/index.jsx` -> `ProjectsSection` -> `<Projects />`, and the patch is correctly targeted. My filter was the broken thing — the third time this run a measurement rather than the code has been at fault (after the frozen-transform overlap in cycle 9 and the pointer-events hit test in cycle 34).

**All three items re-verified, all three still valid:**

**1. The classic site's project photos.** Still live, and both faults intact: `aspect-video` at `:97`, `object-cover` at `:120`, and no `useEffect` or timer anywhere in the file — advancing is only `handleScreenshotClick` at `:61`. Every line reference in the parked patch is confirmed against the current file. The crop was recomputed from the PNG headers rather than trusted: **28 of 28** screenshots are wider than 16:9, average width discarded **10.2%**, worst **14.2%** (`rift/2.png`). The recorded figure said 10.1%; corrected.

**2. The duplicate canonical.** Confirmed from the **served HTML** this time, rather than from reasoning about `next/head` key-deduping. `/drive` really does ship two:

```
<link rel="canonical" href="https://htae.dev"/>
<link rel="canonical" href="https://htae.dev/drive"/>
```

with `og:url` and `og:title` doubled the same way (homepage values first, drive values second). `/` ships exactly one. The cost is sharper than "duplicate tags": crawlers honour the **first** one, so `/drive` is currently telling them it _is_ the homepage.

**3. The sitemap.** Confirmed: `public/sitemap.xml` holds **exactly one** `<loc>`, `https://htae.dev/`. Worth restating in proportion — the site has exactly two indexable routes, `/` and `/drive`, so this is **half the site** missing rather than one page among many. `robots.txt` correctly points at the sitemap, so the omission is the only thing standing between `/drive` and discovery. It compounds with the canonical: even if a crawler found the page, the first canonical would send it away.

**Outcome: no code changed, and none should have been.** All three live outside this run's write scope, which is why they were parked in the first place. The deliverable is that the owner's three patches are trustworthy **today**, with confirmed line numbers and one corrected figure, rather than 25 cycles stale.

**Exit.** No commit to `src/`. -> `Cycle: 36 / Phase: Planner`.

## Cycle 36

**Two Suggester probes.** One integration never exercised, and one defect on the owner's priority (a).

**Probe 1 — resizing mid-drive.** Every layout measurement in this run has loaded at a fixed size, so nothing had ever tested what happens when the window changes _while the car is moving_. Departed EXIT 05, resized **1440×900 -> 900×650** under way, then waited for a genuine arrival rather than assuming one: the sim kept running and arrived (_"Arrived at EXIT 06"_), the canvas backing store followed **2880×1800 -> 1800×1300**, the dash re-laid out to 234px, the arrival panel appeared at 704×220 fully inside the viewport, panel/dash overlap **0**, no horizontal scroll. Clean.

_(A first pass on this looked alarming — the arrival panel was `null` after the resize. It was not a defect: the snapshot was taken 7.7s into a ~10s leg, so the car had simply not arrived yet. Waiting for the status region to fill, rather than for a fixed number of seconds, gave the real answer.)_

**Probe 2 — what the exit sign actually says.** Sampled every 450ms across one approach:

`0.14 MI -> 0.13 -> 0.12 -> 0.11 -> 0.10 MI -> **159 M** -> 154 M -> 146 M`

Two units in one readout, and the second is **metres** — on an American interstate guide sign, in a cockpit whose speedometer reads **mph** and whose odometer reads **MI**. And it disagrees with the sign the owner already wrote: `DriveModeSign.jsx:20`, the homepage sign that leads into drive mode, reads **"1/4 mile"**. So drive mode's own sign was inconsistent with the rest of the cockpit _and_ with the site's existing sign vocabulary.

**Built — feet, all the way down.** The tempting move is a fraction ladder ("1 MILE / 1/2 MILE / 1/4 MILE"), which reads beautifully and **can never execute**: a leg is `LEG_LENGTH` 220m = 0.137 miles, and the sign is only visible between 220m and 7m, so the whole range sits below a quarter mile. Shipping a branch that can never run is precisely the defect cycle 30 fixed, when the sign's fade turned out to be dead code. Guardrail 128 was written to stop me doing it again. Below a quarter mile, real advance signage is in feet. The conversion derives from `METERS_PER_MILE` × 5280 rather than a typed 3.28084 (guardrail 127) — this run has closed six constants that shadowed a number kept elsewhere.

**Verified across two approaches:**

- series **720 FT -> 110 FT**, monotonic, **single unit `FT` throughout**; no `M` and no `MI` in any sampled reading
- 720 FT at departure is exactly 220m through the derivation
- cycle 30's curves re-measured rather than assumed unaffected (guardrail 125): hidden while parked, opacity starting **0.002** and reaching full, flare starting **0.000**, scale still monotonic
- the sign hides below ~23 FT by design, so the last stretch is arithmetic (`z=7m -> 20 FT`) rather than sampled — stated rather than implied

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.4 kB). One commit: `faf5a43`. -> `Cycle: 37 / Phase: Planner`.

## Cycle 37

**Suggester — the highest-stakes thing on the page.** Backlog dry. Guardrail 13 states plainly that a wrong year on someone's résumé is the worst bug this page could ship, and cycle 4 found precisely that: `new Date('2024-01-01').getFullYear()` returns **2023** in any timezone behind UTC, which had quietly moved a January 1st role into the wrong year. It was fixed by reading the year off the string, and spot-checked at a single stop. Thirty-three cycles later it had still never been verified across every stop, in both of the places a year is displayed.

**Method.** Read the dates out of `src/content/education.js` and `experience.js` first — the source of truth — then measured what the page actually renders, rather than comparing the page against itself.

**The cockpit readout.** Visited all eleven dated positions and read the trip computer's `yr` field:

| exit   | stop                         | content date   | shown    |
| ------ | ---------------------------- | -------------- | -------- |
| MILE 0 | origin (undated)             | —              | 2016     |
| 01     | University of Pittsburgh     | 2016-12-01     | **2016** |
| 02     | Web Developer                | 2017-09-01     | **2017** |
| 03     | Application Developer        | 2019-03-01     | **2019** |
| 04     | Sabbatical                   | 2020-05-01     | **2020** |
| 05     | Full Stack Developer Trainee | 2023-04-01     | **2023** |
| 06     | Software Engineer            | 2023-09-01     | **2023** |
| 07     | Freelance Web Developer      | 2023-10-01     | **2023** |
| 08     | UI / UX Software Engineer    | **2024-01-01** | **2024** |
| 09     | MES Software Engineer        | 2024-11-01     | **2024** |
| 10     | Senior MES DevOps Engineer   | 2025-12-01     | NOW      |

EXIT 08 is the one that matters most — that is the January 1st entry cycle 4's bug moved to 2023. It reads 2024.

**The crawlable copy.** The `sr-only` itinerary is what a search engine and a screen reader consume, so an error there is arguably worse than one on the dashboard. 21 articles for 21 stops. **Ten** carry a year, every one correct, with `<time datetime>` matching the visible text in all ten. **Eleven** carry no `<time>` element at all — MILE 0, all eight side builds, the toolbox and the destination — which is exactly right: those have no date in the content and nothing fabricates one.

**One nuance worth writing down rather than flagging as a bug.** The current role reads **2025** in the crawlable copy and **NOW** in the cockpit. That is not a contradiction: the itinerary states the fact, the cockpit states the present. Both are correct in their own register.

**Outcome: no defect, and nothing changed.** Recorded as a result rather than a non-event — this is the property the whole page exists to get right, and it is now checked end to end instead of trusted.

**Exit.** No commit to `src/`. -> `Cycle: 38 / Phase: Planner`.

## Cycle 38

**Suggester.** Backlog dry. Two findings: one shippable defect, and one that changes the priority of a parked item.

**The defect — the modal was not modal.** `RouteMap` declares `aria-modal="true"`, and its own comment from cycle 10 spells out what that promises: _"everything behind it is inert — so it has to actually behave that way."_ It did not. `DriveScene`'s global `keydown` effect never checked `mapOpen`, and `mapOpen` was not even in its dependency array.

Measured at EXIT 05: with the map open, `ArrowUp` **pulled the car out of the stop** — `parked` went **true -> false** and the document title advanced **EXIT 05 -> EXIT 06** — while the dialog stayed up. The drive happened invisibly behind it. And arrow keys are the obvious way to scroll a twenty-one row list, so the natural gesture for _using_ the map was the one that left the exit you were reading.

**Built.** While the map is open only the two keys that get you _out_ still act. Everything else returns early **without** `preventDefault`, so the list still scrolls normally — suppressing the drive must not suppress the browser (guardrail 130). Opening the map also releases throttle, brake and steering, for the same reason the window `blur` handler exists: a key held before opening would otherwise stay latched, because its keyup arrives while the map is up and is ignored (guardrail 131).

**Verified on the production build:**

- map open — `ArrowUp`, `w`, `ArrowDown`, `s`, `ArrowLeft`, `ArrowRight`, `n`, `Backspace`, `p`: car stays parked, title unchanged, map open, **none `preventDefault`ed**
- map open — **Escape closes**, and **`M` still toggles** it closed
- map closed — `ArrowUp` drives exactly as before: parked -> false, title advances
- held key — holding the accelerator then opening the map drops the speed **22 -> 15 mph over six seconds**, so the throttle really is released rather than latched; closing and accelerating again reaches **52 mph**, so it is fully recoverable

_(A single early run reported Escape failing to close. Two later runs — isolated, and the same combined sequence at two timings — all closed correctly, so that was a flake. Recorded because it was measured, not because it stood.)_

**The second finding, recorded rather than built.** `/drive` inherits its whole social surface from `_app.jsx`: `og:image` and `twitter:image` are the **portrait avatar**, and `twitter:card` is **`summary`** — the small square card rather than `summary_large_image`. Giving the drive page its own card, adding backlog **S15**'s route-specific structured data, and fixing the duplicate canonical **all** require `key` props in `_app.jsx`: without them a second tag is _added_ rather than overriding, which is exactly why `/drive` currently serves two `og:url`, two `og:title` and two canonicals. That reframes the parked Needs-human item from a tidy-up into the single blocker in front of four separate improvements. Shipping a tag that cannot take effect is the defect cycles 30 and 36 each already fixed, so it stays recorded.

**A note on the shift itself:** the browser extension disconnected mid-verification. Rather than retry blindly, the check was re-run from scratch once it reconnected — which is why the held-key evidence is a speed curve (22 -> 15 -> 52 mph) rather than the weaker "the title did not change" reading the interrupted run had produced.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.4 kB). One commit: `e06709b`. -> `Cycle: 39 / Phase: Planner`.

## Cycle 39

**Suggester.** Backlog dry. This pass went after the residual cycle 28 accepted and recorded rather than hid: **EXIT 04, the sabbatical** — the entry that explains a gap on a résumé, and therefore the one least worth cutting off — still hid **22.4%** of itself on a desktop.

**Establishing what was _not_ available first.** The panel already fills its band exactly (card top = band top, card height = band height), so nothing is being wasted inside it. The band is pinned between the rear-view mirror above and the dashboard below, and the gap to the mirror measures **20px at 1440×1080, 8px at 1440×900 and 2px at 1440×800**. There is no vertical slack to reclaim without taking it from the cockpit, which guardrail 71 forbids and guardrail 133 restated for the mirror. Also worth recording: on a **1440×800** laptop the same entry hid **34.3%**.

**What _was_ available was width, and a lot of it.** The card capped at **58rem = 928px** at every width above `lg`:

| viewport  | band | card | unused    | hidden       |
| --------- | ---- | ---- | --------- | ------------ |
| 1440×900  | 1440 | 928  | 512px     | 94px (22.4%) |
| 1920×900  | 1920 | 928  | **992px** | 94px (22.4%) |
| 2560×1000 | 2560 | 928  | 1632px    | 44px (10.5%) |

On a 1920-wide monitor more than half the band sat empty while the longest entry on the résumé was cut off.

**Both options were trialled before choosing one** — the method cycle 28 established, after widening-alone turned out to trade a fold for a readability regression:

| trial at 1920×900       | hidden       | paragraph measure     |
| ----------------------- | ------------ | --------------------- |
| today: 928px, 2 columns | 94px (22.4%) | 412px (~63 chars)     |
| 1088px, 2 columns       | 22px (6.3%)  | 492px (~76 chars)     |
| **1216px, 3 columns**   | **0px**      | **363px (~56 chars)** |

Widening alone fixes less _and_ reads worse. Widening **and** adding a third column fixes it outright and **narrows** the line length. Better on both axes, so that shipped.

**A regression I introduced and the measurements caught.** The two width expressions were first written comma-separated inside a single template interpolation. Prettier wrapped them in parentheses, which makes it the **comma operator**: it evaluates the first operand and throws it away. The `shots` width silently stopped applying and the **picture stops dropped from 928px back to 704px**. `npm run build` compiled and `next lint` was clean — nothing but measuring an actual project stop would have found it. They are now two separate interpolations with a comment explaining why.

**Verified on the production build:**

- 1920×900 — EXIT 04 hidden **94 -> 0**, card **928 -> 1216**, measure **412 -> 363**; EXIT 10 and EXIT 19 at 0
- 1920×900 — project stops back at **928px** and the destination at **704px**, both `columns: auto`, untouched
- 1440×900 — EXIT 04 **identical to before**: 928px, 2 columns, 94px hidden (guardrail 135, no leak below `2xl`)
- 390×844 and 844×390 — unchanged, single column
- no horizontal overflow in the scroller or the document at any size
- screenshot of a three-bullet stop at 1920: three balanced columns, card sized to content, not an orphaned one

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.5 kB). One commit: `cb525ea`. -> `Cycle: 40 / Phase: Planner`.

## Cycle 40

**Suggester.** Backlog dry. Cycle 39 gave the **text** stops a wide-screen layout and left the **project** stops — the owner's priority (c) — capped, so this pass measured what that costs.

**The finding.** The screenshot renders **451×225** from a **1899×970** source: **23.7% of native**. And it is the _same 451px_ at 1440, 1920 and 2560 wide, because the card caps at 58rem while the band leaves **992px unused at 1920×900** and **1632px at 2560**. The original brief was _"the projects sections the photos just get cut off"_. Cycle 1 stopped the cropping; what was left on a large monitor is a whole web page shown at a quarter size, where you can make out the layout and nothing else.

**The constraint that shaped the fix came out of a trial, not an assumption.** The browser frame is a fixed **2:1**, so widening the card grows the frame's **height** too — and the band's height belongs to the cockpit, which guardrails 71 and 133 put out of reach. Widening to 1216px at **1920×900** introduced **46px** of overflow at the current split, and **83px** with a media-favouring one. That is trading small screenshots for cut-off text, the trade this run keeps refusing.

**So the gate had to be height as well as width, and the threshold was measured rather than picked.** At 1216px with a `1.5fr / 1fr` split:

| viewport  | shot    | scale | hidden   |
| --------- | ------- | ----- | -------- |
| 1920×900  | 672×336 | 35.4% | **83px** |
| 1920×1000 | 672×336 | 35.4% | **33px** |
| 1920×1080 | 678×339 | 35.7% | **0**    |
| 1920×1152 | 678×339 | 35.7% | **0**    |

The boundary sits between 1000 and 1080, so the rule fires at **min-width 1536 and min-height 1120** — margin above the boundary rather than sitting on it (guardrail 139).

**Verified on the production build:**

- 1920×1200 — card **928 -> 1216**, shot **451×225 -> 678×339**, **23.7% -> 35.7%** of native, prose column 454px, **0 hidden**
- 1920×900 and 1440×900 — **unchanged**, 928px card and 451px shot, 0 hidden
- **2560×900 — unchanged**: wide but short, and the rule correctly does not fire. This is the case that proves the gate is doing what it claims rather than just tracking width
- 1920×1200 — text stops still 1216px with three columns, destination still 704px, both untouched
- 390×844 and 844×390 — unchanged
- no horizontal overflow anywhere; a screenshot shows the page inside the frame is now **legible** — the heading, the bio paragraph and the body text can be read — rather than merely recognisable as a layout

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.5 kB). One commit: `cb086c2`. -> `Cycle: 41 / Phase: Planner`.

## Cycle 41

**Suggester.** Backlog dry. Cycle 40 made the screenshots legible; this pass weighed what they cost to deliver, and the answer was megabytes.

**The finding.** The 28 screenshots total **15.6 MB** on disk and were served as raw PNG — `content-type: image/png`, `cache-control: public, max-age=0`. Arriving at **EXIT 12 (Matrimoni)** requested **all five** of its frames, confirmed in the browser's resource timeline: `loading="lazy"` cannot help when every frame is stacked inside the panel that just opened.

| file            | served       |
| --------------- | ------------ |
| 1.png           | 1,903 KB     |
| 2.png           | 1,217 KB     |
| 3.png           | 1,627 KB     |
| 4.png           | 490 KB       |
| 5.png           | 67 KB        |
| **one arrival** | **5,306 KB** |

And the files are far larger than what is drawn — Matrimoni's frames are **2350px** natural, rendered at **451px**. Roughly five times the pixels on the wire that ever reach the screen.

**The fix was already in the building.** `/_next/image?...&w=750` returned **200**, `content-type: image/webp`, **11,054 bytes** for the frame that costs 1,903 KB as PNG — the same picture, ~176× smaller. The classic site's `Projects.jsx` has always rendered through `next/image`; drive mode was the one place still using a plain `<img>`. Nothing about the owner's files changes: the PNGs are read and a derivative is emitted (guardrail 143).

**Measured cache-cold, arriving at EXIT 12** — and cache-cold matters, because a warm cache reported `transferSize: 0` earlier in this very cycle and would have made any change look like a triumph (guardrail 147):

|        | requests                      | bytes        |
| ------ | ----------------------------- | ------------ |
| before | 5, raw PNG                    | **5,306 KB** |
| after  | 5, **all WebP**, zero raw PNG | **131 KB**   |

About **40× smaller**, and the derivative is sized to the frame rather than the file: **470px** at 1440×900, **692px** at 1920×1200 where cycle 40's larger frame applies.

**Everything that had to survive was re-measured rather than assumed** — this component carries work from cycles 1, 22 and 40:

- frame box unchanged: **451×225** at 1440×900, **678×339** at 1920×1200
- the cross-fade still runs — sampled **mid-transition at 0.961 / 0.039**, both frames partly visible, so it fades rather than cuts. Checking the end states alone would have proved nothing
- `object-fit: contain` preserved on every frame, so nothing is cropped
- auto-advance still runs and the dots still switch frames
- cycle 22's accessibility intact: **exactly one frame exposed, and it is the visible one**
- reduced motion still holds frame 1 for nine seconds

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 20.5 kB). One commit: `1f9c323`. -> `Cycle: 42 / Phase: Planner`.

## Cycle 42

**Suggester — look back before looking further.** Backlog dry, and cycles 38—41 had changed the global key handler, the arrival panel's width, its column count and the entire image pipeline. Four consecutive cycles of change to the same surface is exactly when a regression hides, so this pass re-ran the whole route instead of opening new ground.

**The sweep is clean.** All 21 stops render; **28 images, 0 broken, all 28 served through the optimiser**; **exactly one frame exposed** to assistive tech at every project stop (cycle 22's fix surviving the `next/image` swap); no horizontal scroll anywhere; and **zero console errors or warnings**. The only non-zero number is EXIT 04 hiding 94px at 1440×900, which is expected — its three-column fix is gated at `2xl`.

**Cold-load weight, measured for the first time:** `/drive` is **208 KB** total — 21 KB document, 168 KB across 11 script chunks, 18 KB CSS. The largest chunks are React's framework bundle (44 KB) and a shared vendor chunk (36 KB). Nothing worth chasing, and worth knowing rather than guessing at.

**Then a correction, which is the real output of this cycle.** Cycle 38 told the owner that the missing `key` props in `_app.jsx` block **four** improvements. Checking tag by tag against the served HTML shows that is too broad, and the difference matters to what they actually have to do.

`next/head` **auto-dedupes `<meta name="...">` by its name**, but does **not** dedupe `<meta property="...">` or `<link>`:

| tag                    | served on `/drive` | set by `drive.jsx`?       |
| ---------------------- | ------------------ | ------------------------- |
| `name="description"`   | **1**              | yes — overrides correctly |
| `name="twitter:title"` | **1**              | yes — overrides correctly |
| `property="og:title"`  | **2**              | yes — **duplicated**      |
| `property="og:url"`    | **2**              | yes — **duplicated**      |
| `rel="canonical"`      | **2**              | yes — **duplicated**      |

Every tag `drive.jsx` sets with `name` appears once; every one it sets with `property` or as a `link` appears twice. So **the drive page's search-result description is already correct** — I had implied otherwise. What genuinely needs `key` is the canonical, the `og:` tags, and S15's JSON-LD.

**And one thing I could have shipped and chose not to.** `twitter:card` and `twitter:image` are `name`-based, so `drive.jsx` could override them today, in scope, to get a wide share card. The only image available is `avatar.png`, a **612×612 square portrait** — putting that in a `summary_large_image` frame makes the card worse, not better. And since `og:image` genuinely is blocked, doing it would leave Twitter showing one card while LinkedIn and Slack show another. A wide drive-mode card image is a decision about the owner's own branding, not a gap for the loop to fill unasked.

**Exit.** No commit to `src/` — the sweep found nothing to fix and the finding is a correction to the notes, not to the code. -> `Cycle: 43 / Phase: Planner`.

## Cycle 43

**Suggester — audit the newest change first.** Backlog dry. Cycle 41 cut a project stop's payload from **5,306 KB to 131 KB**, and the cycle most likely to be hiding a defect is the one that just shipped. Two things could have gone wrong with "serve the image at the size it is drawn": softness on a high-DPI screen, and compression eating the small text those screenshots are full of. Both were measured.

**Softness — the first reading looked like a defect and was not.** `devicePixelRatio: 2`, a **451px** CSS slot (so 902px needed for a crisp 2× render), and `img.naturalWidth` reporting **470**. That looks exactly like a 1× image on a 2× display.

It resolves the other way, and the decisive step was not trusting either number: `currentSrc` carries **`w=1080`**, and re-decoding that exact URL in a fresh `Image()` returns **1080×552**. The resource genuinely is 1080px wide. `naturalWidth` on an image chosen from a `srcset` is **density-corrected** — 1080 divided by the effective density (1080 / the 470px `sizes` value ≈ 2.3) reports back as 470. Standard browser behaviour, not a small file. So the screenshots are delivered at about **2.4×** the CSS size on a 2× display. Byte win and sharpness are both real.

**Quality — measured rather than nudged.** Next's default is `q=75`, and WebP at 75 is a plausible place to lose fine UI text, which is precisely what cycle 40 worked to make readable. Rather than raise it on instinct, I decoded q=75, 85 and 90 against near-lossless **q=95** at the delivered 1080px width and compared every pixel:

| quality          | mean channel error | pixels differing by >8/255 | worst | bytes per 5-frame arrival |
| ---------------- | ------------------ | -------------------------- | ----- | ------------------------- |
| **75 (current)** | **1.73 / 255**     | **1.5%**                   | 40    | **129 KB**                |
| 85               | 1.39               | 0.48%                      | 22    | ~190 KB                   |
| 90               | 1.25               | 0.13%                      | 17    | **227 KB**                |

A mean error of **1.73 out of 255** is below anything an eye resolves, and the 1.5% of pixels above the threshold are the highest-contrast text edges. Moving to q=90 would buy **0.5/255** of accuracy for **+76% bytes**. That is not a trade worth making, and shipping it because it "probably looks better" would be the exact guess this run keeps refusing. **Left at 75.**

**Outcome: nothing changed, and both results are worth having.** The 40× saving from cycle 41 costs neither sharpness nor legibility, and that is now a measurement rather than a hope.

**Exit.** No commit to `src/`. -> `Cycle: 44 / Phase: Planner`.

## Cycle 44

**Suggester — widen the angle.** Two verification cycles in a row had found nothing, so this pass tested **conditions** rather than components: browser zoom, colour theme, and no JavaScript.

**Zoom — clean.** WCAG 1.4.4 asks for usability at 200%, which on a 1440×900 laptop means a **720×450** CSS viewport, a size never tested. At 150% (960×600) and 200% (720×450): the panel renders, **panel/dash overlap 0**, all six controls inside the dash, smallest control **25px**, nothing off-screen, no horizontal scroll. At 200% the dash takes 42.2% of the height — its 190px floor — and EXIT 06 has 23px of scrollable content. Both expected.

**Theme — clean.** `_document.jsx` puts `bg-white dark:bg-gray-950` on the body, and drive mode uses **no** theme variants at all. Forcing light mode turns the body white, but all four viewport corners still hit drive-mode elements: the scene is `fixed inset-0` and covers it.

**No JavaScript — a real gap.** The whole résumé **is** in the served HTML — _"Senior MES DevOps Engineer"_ and _"University of Pittsburgh"_ both present — but inside `class="sr-only"`, which the shipped stylesheet resolves to `position:absolute;width:1px;height:1px;clip:rect(0,0,0,0)`. The ignition splash renders too. So a visitor without scripting met _"The résumé, from the driver's seat"_ and a **"Start engine" button that does nothing**, with every word of the résumé in the page and invisible. And `grep -rn noscript src/` returned **nothing** — not one fallback anywhere in the application.

**The fix I did not make.** Unclipping `.sr-only` under `<noscript>` is the tempting one-liner and it is wrong twice over: the résumé would land _behind_ a `fixed` scene that still covers the viewport, and it would unclip the arrival announcer as well. Guardrail 151 was written before building for exactly that reason. The classic site renders its content server-side **and visibly** (same probes hit on `/`, one `sr-only` wrapper on the whole page), so there is a genuine destination to offer rather than a second dead end.

**Verified with scripting genuinely disabled**, which is the part worth recording as method: an `iframe sandbox="allow-same-origin"` **without** `allow-scripts` disables JavaScript while leaving the DOM readable, so the no-JS rendering could be _seen_ rather than inferred from an HTML string (guardrail 148).

- `body.style.overflow` is `""` — the effect never ran, confirming scripting really is off
- the panel renders, heading **"Drive mode needs JavaScript"**
- the fallback link is **257×47** and **hit-testable at its own centre**
- the centre of the screen hits the explanation, so the panel covers the dead-end splash
- a screenshot confirms it

**And with JavaScript on it costs nothing:** **zero console messages and zero hydration warnings** (the `<noscript>` uses `dangerouslySetInnerHTML` so server and client markup are identical — guardrail 149), the element renders a **0×0** box, its heading does not appear among the page's headings, and the drive is unchanged: card 928×214, dash 324px, overlap 0, centre still hitting the arrival panel.

**Exit.** `next lint` clean, `npm run build` compiles (`/drive` 21.1 kB). One commit: `a779878`. -> `Cycle: 45 / Phase: Planner`.

## Cycle 45

**Suggester — test the edges, not the middle.** Backlog dry again (S15 blocked behind the Needs-human canonical fix, S13b closed as unwanted). Forty-four cycles had exercised the middle of the drive; this pass went at its boundaries — junk in the URL, corrupt saved progress, and the end of the road.

**Two boundaries came back clean.** `?exit=99` and `?exit=21` both fall back to the splash at MILE 0 with Back disabled, and the parser also rejects `011`, `+11` and `11abc`. `progress.js` wraps every `localStorage` access, returns `null` for anything unparseable or out of range, and re-checks the stored `id` against the stop at that index, so a content edit cannot strand a returning visitor somewhere unrelated. The destination itself reads correctly: EXIT 20 / DESTINATION / 21/21, matching tab title, ARRIVED on the trip computer.

**The third was a real one.** At the destination, `NEXT` correctly reported `disabled: true`, `opacity: 0.3`, `cursor: not-allowed`. The **GO pedal beside it** reported `disabled: false`, `opacity: 1`, `cursor: pointer` — **62×76**, the largest control in the cockpit, and the one the ignition splash explicitly tells you to use. Holding it left the dash readout **byte-identical across 2.5s** of held `ArrowUp`. And it was worse than a no-op: `Pedal` carries `active:translate-y-[3px]` and `hover:brightness-125`, so the pedal **visibly depressed and brightened** under the press while the car went nowhere. The car genuinely cannot move there (`useDrive.js` only pulls away while `target < stops.length - 1`) — nothing said so.

**The control that proved the harness.** "Nothing moved" is worthless without proof the probe works: the identical dispatched `ArrowUp` at `?exit=10` took the car **0 -> 27 MPH** and on to EXIT 11.

**The pre-mortem found a second, bigger defect.** Guardrail 153 predicted that disabling GO under a visitor's focus would strand them — so I checked whether **NEXT already did it**. It did, and it was already shipped: polling every 500ms through an autopilot run from EXIT 19, at **t = 13.0s** the car arrived, NEXT flipped to disabled, and `document.activeElement` became **`<body>`** in the same instant. The next Tab restarted at the top of the document — back through the entire hidden résumé that cycle 33 spent a whole cycle getting the keyboard past. So the fix rescues focus rather than adding a third control that strands people.

**The measurement was broken before the code was — again (the fifth time this run).** My first focus test reported the rescue simply not firing. It was the harness: `document.hasFocus()` is **false** in this window, and programmatic `.focus()` then sets `activeElement` **without firing any `focus`/`focusin` event**, so the app's listener never recorded anything to rescue. Re-run with a **real click**, the rescue works. Two further harness artifacts worth recording: disabling the focused button fires **no `focusout` at all** (measured), and a synthetic `pointerId: 2` makes `setPointerCapture` throw `NotFoundError` **before** `onPress()` runs — which is what made one reading claim the throttle release had failed. Confirmed by calling it directly: id 2 throws, id 1 does not.

**Verified**, all with real input where focus was involved:

- focus on NEXT at arrival -> lands on `#drive-controls`, not `<body>`
- focus never in the cockpit -> left on `<body>`, **no steal**
- destination: GO `disabled`, `opacity 0.3`, `not-allowed`, named _"Go — unavailable, this is the end of the route"_
- brake, back and the map stay live — a brake at a standstill is not a lie (guardrail 155)
- **both** layouts: desktop 1568×731 and phone 390×844 (guardrail 156)
- exit 10 unchanged: pedal enabled, still drives **0 -> 27 MPH** (guardrail 157)
- throttle really released: held the pedal **through** arrival, then Back plus a **single** press drove away (0 -> 26 MPH), which only happens if `throttleLock` was false (guardrail 154)
- `ArrowUp` and `W` remain no-ops at the destination; console clean, no hydration warnings

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.3 kB). One commit: `c2338c8`. -> `Cycle: 46 / Phase: Planner`.

## Cycle 46

**Suggester — four angles, no defect.** Backlog dry (S15 blocked, S13b closed), so this was an idea hunt. It found nothing to ship, which is worth recording as carefully as a fix.

**1. The ignition splash.** Clean: START ENGINE, a **RESUME · EXIT 20** offer, FORGET MY PROGRESS, the six-key control legend, and a way back to the classic site. One false alarm on the way — my first probe reported the splash missing, because it tested `includes('Start engine')` against text that CSS uppercases. The probe was wrong, not the page.

**2. The origin boundary.** Cycle 45 tested the end of the road, so this tested the start. At MILE 0 the mirror reads **BEHIND YOU / "Open road"** — the empty case is authored, not left blank.

**3. Reduced motion, re-verified against cycle 45's pedal.** Cycle 45 was the first change to `Pedal` in many cycles, and reduced motion is the contract this run has broken and repaired more than any other. Patched at `readyState: "loading"` with `matchMedia` reporting `matches: true`: GO at EXIT 10 **jumps straight to EXIT 11 at 0 MPH**; the control with motion allowed **drives** it — 5 MPH at 0.7s, 25 MPH at 3.2s. Different exactly as designed, and the control is what makes "no animation" mean something.

**4. The wide-screen rule — the one that looked like a bug and was not.** On a **2560×1080** ultrawide a _text_ stop widens to **1216px** while a _project_ stop stays at **928px** with a 451×225 screenshot. Same screen, and it is the screenshots — the owner's priority (c) — that stay small. The cause is cycle 39: picture stops need `(min-width:1536px) and (min-height:1120px)`, text stops only a width-only `2xl:`.

That asymmetry reads as an oversight. It is not, and the measurement is the reason:

|                             | 1200 | 1080 | 950 | 800 |
| --------------------------- | ---- | ---- | --- | --- |
| **text stop** card height   | 340  | 340  | 340 | 340 |
| **text stop** hidden scroll | 0    | 0    | 0   | 0   |

A text stop gets **shorter** when it widens — three columns spend the width instead of the height — so it can never overflow, and needs no height guard. A picture stop gets **taller**, because the screenshot grows with it. Forcing the wide layout onto a picture stop at 1920 wide:

| viewport height | card height | screenshot frame | hidden below the fold |
| --------------- | ----------- | ---------------- | --------------------- |
| 1080            | 540         | **707×354**      | **10px**              |
| 1000            | 500         | 707×354          | 50px                  |
| 950             | 475         | 707×354          | 75px                  |
| 900             | 450         | 707×354          | 100px                 |
| 800             | 400         | 707×354          | 150px                 |

So the guard earns its place. The only free band is **1040-1119px** — 10-30px of scroll in a container that already scrolls, in exchange for **2.5× the screenshot area** — and once browser chrome is subtracted a 1080p monitor usually lands below it (**inference**, not measured: this window's chrome was not compared with a typical one). Reopening a deliberate, correctly-measuring rule to buy that band was not worth it. **Left alone.**

**Also clean:** geometry at **2560×1080** and **1920×900** — dash 36% of height, panel/dash overlap **0**, six controls in the dash, smallest control **25px**, nothing off-screen, no horizontal scroll.

**Exit.** No commit to `src/`. -> `Cycle: 47 / Phase: Suggester` (backlog still dry).

## Cycle 47

**Suggester — five angles, nothing to ship.** Second cycle running without a commit to `src/`. Recorded in full, because a pass that finds nothing is only worth anything if it says exactly where it looked.

**1. The carousel's pause behaviour — the one I expected to be a defect.** Priority (c) is auto-cycling screenshots, and the classic failure of an auto-advancing carousel is that it flips away while you are reading. Checked before assuming: `ProjectShots.jsx:59-62` pauses on `onPointerEnter` and `onFocus`, resumes on leave/blur, and `:48-52` tears the interval down entirely while paused rather than letting it run and skip. Already correct, including for the keyboard — React's `onFocus` bubbles, so focusing a dot pauses the strip.

**2. Browser history.** Never tested, and pressing Back is something real visitors do. Deep-linked to `?exit=5` and drove one leg: URL became `?exit=6` and **`history.length` stayed at 50**, so `router.replace` really is replacing — 21 exits cannot bury someone's Back button under 21 entries. Back from there lands on **`/`**, the page they came from. Correct on both counts.

**3. Reload.** Falls out of the same design: the URL always carries `?exit=N`, which is the deep-link path cycle 45 already proved (including junk and out-of-range values).

**4. The stylesheet, audited the way cycle 15 audited `world.js`.** `drive.module.css` defines **25** classes; the drive components reference **25**. Both directions checked: **no class defined and never used** (dead rules), and **no `styles.x` referenced that the stylesheet does not define** (which would silently render `class="undefined"`). Exactly in sync.

**5. Itinerary completeness.** The served HTML carries **21 `<h3>` headings for the 21 stops**, inside **6** labelled leg sections — Start line, School zone, Career highway, Scenic overlook, Pit stop, Destination. Nothing on the route is missing from what a screen reader or a crawler receives.

**The honest read.** Two cycles in a row with nothing shipped is not a reason to stop, and I have not stopped — but it is a signal worth writing down rather than papering over with invented work. Drive mode is now covered from several directions: geometry at eight viewport sizes, reduced motion, no-JavaScript, zoom, theme, focus order, the route boundaries, image bytes and quality, and now history, CSS and markup completeness. **The highest-value work left is parked in Needs human**, chiefly the classic site's `Projects.jsx` — which is the _other half of the owner's own priority (c)_ and sits outside this run's write scope. The next Suggester should widen the angle rather than re-probe anything in the exclusion list now at the top of the task file.

**Exit.** No commit to `src/`. -> `Cycle: 48 / Phase: Suggester` (backlog still dry).

## Cycle 48

**Suggester — widened from measuring to looking.** Two cycles of condition-probing had found nothing, so this pass went at the panel itself.

**First, a check that could have been ugly.** `StopCard.jsx:258` puts `line-clamp-2 lg:truncate` on the stop title — from `lg` up it is clipped to one line, and a truncated job title is a bad thing to ship on a résumé. Swept **all 21 stops** at **1440×900**, **1280×800** and **1024×800** (the tightest case: `truncate` active while the card is narrowest). **0 of 21 truncated** at every width. Clean.

**Then, looking at EXIT 12, something a measurement would never have flagged.** The description ends:

> ...featured on Colab's highlighted projects page: https://www.joincolab.io/product/matrimoni

A raw URL, rendered as **dead text** — `p.querySelector('a')` returned `null`. To follow it you had to select 43 characters by hand, which on a phone is not a reasonable thing to ask of someone reading a résumé.

**Scoped before fixing.** Grepped the whole content set: this is the **single** bare URL in any stop's prose; the ones in `education.js` are `href` fields already rendered as links. And I checked the obvious wrong diagnosis first — at **390×844** and **360×780** the paragraph's overflow is **0px** and the page has no horizontal scroll, so the URL wraps fine. The fault was that it was **dead**, not that it spilled.

**The copy is not mine to change.** The text lives at `src/lib/projects.js:16`, read-only under the Guardrails. So the words pass through exactly as written and only the link is added — built as **React elements, never `dangerouslySetInnerHTML`** (guardrail 159), because turning content text into markup is how an innocent linkifier becomes an injection.

**The regex was tested against the cases that do _not_ ship** (guardrail 160), since the one string that does ship ends with no punctuation and would have proved nothing:

| input                               | matched                                 |
| ----------------------------------- | --------------------------------------- |
| `https://a.dev/x.`                  | `https://a.dev/x` — full stop stays out |
| `https://a.dev/x,`                  | `https://a.dev/x`                       |
| `(https://a.dev/x)`                 | `https://a.dev/x`                       |
| `https://a.dev/x;`                  | `https://a.dev/x`                       |
| `https://a.dev/x?`                  | `https://a.dev/x`                       |
| two URLs in one line                | both                                    |
| `version 1.2.3, a/path, mail@x.dev` | **nothing**                             |

**Verified:**

- the paragraph's `textContent` is **character-for-character identical** to the string in `src/lib/projects.js` — compared against the extracted source, not eyeballed (guardrail 158)
- **exactly one** anchor: `href` === visible text === the URL as written, `target="_blank"`, `rel="noopener noreferrer"`
- swept all 21 stops: **21/21 render**, exactly **one** prose anchor on the whole route, **zero** added to the other 20 (guardrail 161)
- the hidden itinerary **deliberately does not linkify** (guardrail 162) — adding a focusable anchor inside the `sr-only` block would put a tab stop back into the very region cycle 33 spent a cycle letting keyboards skip; confirmed it gained no link
- console clean on a **fresh load** — the first console read was taken on an already-loaded page, which the tool warns proves nothing, so it was re-run after a reload

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.4 kB). One commit: `4a54a2e`. -> `Cycle: 49 / Phase: Planner`.

## Cycle 49

**Suggester — kept cycle 48's angle: audit the content as rendered.** Swept all 21 stops for how much of each panel is actually on screen, rather than probing another condition.

**20 of 21 were clean.** At 1440×900 every stop but one hides nothing; at 1280×800 the project stops hide a uniform 19px and the toolbox 26px, which is the scroll container doing its job on a short window.

**The one that was not is the one that matters most.** **EXIT 4** — _Sabbatical / COVID / Family and Personal Reasons_ — is by far the biggest stop on the route: **2,023 characters across 7 paragraphs**, where every other stop runs 224-1,082. It was also the **only** stop with content below the fold:

| viewport  | card   | hidden    | share of the entry |
| --------- | ------ | --------- | ------------------ |
| 1440×900  | 928px  | **94px**  | **22%**            |
| 1280×800  | 928px  | **144px** | **34%**            |
| 1920×1080 | 1216px | 0px       | —                  |

The last row is the diagnosis. Cycle 39 already built the fix — a wider card and a third column — and gated both at **`2xl` (1536px)**. So from 1280 to 1535, an entirely ordinary laptop, the longest and most personal entry on the résumé was squeezed into 928px and two columns, while the same entry hides nothing at 1920. The layout was right; the breakpoint was wrong. Moved both to **`xl`**.

**Width and columns had to move together** (guardrail 164) — widening alone would stretch the measure to roughly 590px per column, which is worse typography than the problem being fixed. Measured: the measure **narrows** from **412px** (two columns) to **359-363px** (three). Better on both axes, which is the same trade cycle 39 made.

**The hazard was cycle 28**, where widening a multi-column block made content _taller_ and took the toolbox from 84px hidden to **261px**. So the test was not "did EXIT 4 improve" but "did anything get worse" (guardrail 163) — every stop, before and after, at both sizes:

|                            | 1440×900    | 1280×800                                                       |
| -------------------------- | ----------- | -------------------------------------------------------------- |
| regressions                | **none**    | **none**                                                       |
| EXIT 4                     | 94 -> **0** | 144 -> **36**                                                  |
| toolbox (EXIT 19)          | 0 -> 0      | 26 -> **0**                                                    |
| total hidden, all 21 stops | **0**       | 188 (the project stops' unchanged 19px each, plus EXIT 4's 36) |
| max panel/dash overlap     | 0           | 0                                                              |

**And the edges of the change:** **1279px** still renders the old layout (928px, 2 columns) and **1280px** the new one (1203px, 3) — a clean breakpoint. Project stops are untouched at 928px with no columns, since `2xl:columns-3` and the roomy width both live on the text branch only (guardrail 165), and their own height-gated rule was confirmed correct back in C46.1. The destination is not `roomy` and keeps its 704px card (guardrail 166). `xl` was **confirmed** to be 1280px by reading `tailwind.config.js` — it only extends the theme and never overrides `screens` (guardrail 167).

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.4 kB). One commit: `9a2a721`. -> `Cycle: 50 / Phase: Planner`.

## Cycle 50

**Suggester — audit the newest change first.** Cycle 49 moved a rule from 1536px to 1280px and verified it at 1440×900 and 1280×800 — never where **wide meets short**. So that is where this pass went.

**Cycle 49 came back clean.** Comparing the shipped layout against the pre-49 layout forced back on at the same size: **1366×768 hides 52px against 136px**; **1280×720 hides 76px against 160px**. Better at both, no regression.

**But standing at those sizes turned up something else.** The panel band's own comment says _"below the mirror, above the dash"_. It was only true on a tall window.

The mirror hangs from the headliner by a drop that **does not shrink**: a 12px stalk and a 38px chip — **50px of pixels**, identical at all 21 stops because the titles never wrap. The band's top was a flat **14%**. Percentage against pixels:

| viewport                | gap between mirror and panel |
| ----------------------- | ---------------------------- |
| 1920×1080               | +72px                        |
| 1440×900                | +9px                         |
| 1366×768                | **0px**                      |
| 1280×720                | **-3px**                     |
| 844×390 landscape phone | **-25px**                    |

The model fits every sample — chip bottom = `7.5%×h + 50px`, band top = `14%×h`, crossing below **769px**, which is exactly where the measurements turn negative. And at 1280×720 it is **9 of 21 stops**, not all of them: only cards tall enough to reach the top of the band can touch the mirror.

**Confirmed by eye rather than trusting the arithmetic.** A screenshot at 1280×720 shows the chip's rounded bottom sliced by the panel's bright top border — the HUD drawn _in front of_ a mirror bolted to the roof, which is exactly the kind of thing that undoes priority (a).

**One measurement was broken and caught before it misled me.** A first sweep reported every stop overlapping by ~600px with a 720px-tall "mirror" — I had dropped a `children.length` filter and matched the whole scene container instead of the chip. Re-run with a selector that matches only the element whose own text is "Behind you", and a sanity check on the height, it gives a consistent **38px** chip at every stop.

**Which piece should move?** The mirror cannot: the headliner runs 0-58px at 720 and the chip starts at 66, so there is nothing above it but the stalk — raising it would embed it in the roof lining. I checked that before choosing, because "move the small decorative thing" was the tempting answer and it is the wrong one. The panel is the flexible piece, so the floor goes on the panel: `top-[max(14%,calc(7.5%+58px))]` — 7.5% is the mirror's own offset, 58px is its 50px drop plus 8px of daylight, and above ~892px tall the 14% wins and nothing changes.

**Verified:**

- all 21 stops at 1280×720: **no negative gaps, minimum +8px**
- **1920×1080 and 1440×900 band tops identical to before** — the `max()` is a no-op where the layout already worked (guardrail 169)
- 844×390 **-25 -> +8**, 1366×768 **0 -> +8**, 390×844 **+13 -> +16** (guardrail 170)
- **panel/dash overlap still 0 at every size** — the collision has not simply moved to the other end (guardrail 172)
- the arbitrary value **actually compiled**: `calc(7.5%` is in the emitted stylesheet, not silently dropped

**The cost, stated rather than buried (guardrail 168):** clearing the mirror pushes the panel down, so a 720-768 tall window hides **8-11px more** of a long entry than it did after cycle 49 — partly against what that cycle just won there. It is the right trade, because a sliced mirror reads as broken and a few pixels of scroll does not. On a landscape phone it costs nothing at all.

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.4 kB). One commit: `6544a7a`. -> `Cycle: 51 / Phase: Planner`.

## Cycle 51

**Suggester — audit my own newest constant, then look somewhere new.**

**Cycle 50's 58px floor came back clean, and it was worth checking.** That constant assumes the mirror's drop is a fixed **50px** — measured at 1280px wide, where titles never wrap. On a phone the chip is only 42% of the screen and one stop's mirror reads _"Sabbatical / COVID / Family and Personal Reasons"_; if that wrapped to two lines the constant would be too small and the overlap would be back. Swept all 21 stops at **390×844** and **844×390**: the chip is **38px at every stop at both sizes**, because the title truncates instead of wrapping (only EXIT 5's clips, by 6px). Minimum gap **+16** and **+8**, **zero** negatives. The fix holds.

**The route map's geometry is also fine.** At 844×390, 390×844 and 1440×900 the dialog fits exactly, all 21 rows are present, the close control stays on screen at 70×31, and the list scrolls. One false alarm: a first probe reported **16 controls off-screen**, which was my metric confusing _not currently scrolled into view_ with _unreachable_ inside a list that is meant to scroll. The map was fine; the measurement was not.

**But that probe surfaced a real one.** Looking for the current row, I searched for `aria-current` — and found **none**, at any exit.

The current exit is marked in **colour alone**: `border-sky-400/50 bg-sky-400/10` and nothing more. So a screen-reader user opening the route map meets **21 near-identical buttons** with no way to tell which one they are parked at. The file's own comment at `:20` says _"The map highlights the current exit"_ — that highlight is the point of the widget, and it was sighted-only.

What makes this an oversight rather than a deliberate choice is the state right beside it: **"driven" is rendered as real text**, so it always did announce. Only _where you are_ was silent.

**The token was chosen, not reached for.** `aria-current="location"` rather than `"true"`: ARIA defines `location` as the current place within an environment and gives **a map** as its example, which is literally this widget. Any reader that does not know the token treats it as `true` per spec, so it degrades safely.

**Verified with the map opened at three exits — the start, a project stop and the destination:**

- **exactly one** row carries `aria-current` each time — **not one per leg group**, which was the obvious way to get this wrong given the rows render inside six groups
- it is the **same element** as the single visually highlighted row, located **by class** rather than by the attribute I had just added
- it **follows** the exit rather than being pinned to one row — a single-exit check would have passed on a hard-coded value
- **nothing moved:** border `rgba(56,189,248,0.5)`, background `rgba(56,189,248,0.1)`, box **711×56**, identical at all three
- the "driven" markers were left alone, so no second row claims to be current

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.4 kB). One commit: `d88f5cd`. -> `Cycle: 52 / Phase: Planner`.

## Cycle 52

**Suggester — hunt the class, not the instance.** Cycle 51 found the route map telling you where you are in colour alone. Rather than wait to trip over another one, this pass went looking for **every** place drive mode signals state visually — the approach that paid off in cycle 32.

**It is clean everywhere else, and deliberately so.** Every decorative layer is hidden from assistive technology rather than half-exposed: the road `<canvas>`, the sky, the interior, the exit sign, the gauge cluster, the tell-tales, the **P R N D** gear block, and the trip computer. That last one carries its own justification in a comment — every value on that screen is already announced by the arrival panel and the itinerary — which is the difference between _hidden_ and _forgotten_. The carousel exposes only the frame actually on screen, and its dots carry `aria-current`. The route map was the single gap in this class, and cycle 51 closed it.

**The canvas is not soft on a retina screen either** — `RoadCanvas.jsx:352-357` already scales the backing store by `min(devicePixelRatio, 2)` and repaints after the resize wipes it.

**Then a scare, and the control that defused it.** Sampling `requestAnimationFrame` while driving at 81 MPH gave **16.1 fps**, a median frame of 46ms and **43 of 49 frames over 33ms**. On its face that is a severe regression after thirty cycles of change, and it is exactly the kind of number that gets reported in a panic.

The control says otherwise:

| what                                | fps      |
| ----------------------------------- | -------- |
| drive mode, driving                 | 16.1     |
| drive mode, parked                  | 15.2     |
| **a bare blank page, same browser** | **15.0** |

The empty page is the ceiling. Drive mode runs **at or above** it, so the whole drive loop — simulation, canvas repaint, gauges — costs nothing measurable here. The bottleneck is the automated browser's compositor, and **the window was genuinely foregrounded** (`document.hasFocus()` true), so guardrail 24 is not sufficient protection against this mistake. That is now written at the top of the task file: **do not try to measure frame rate in this environment.**

**And a look rather than a measurement.** At 390×844 the phone cockpit stacks correctly, the screenshot frame and its dots are legible, the panel shows its scroll affordances, and all six controls sit in one reachable row. Nothing to fix.

**Exit.** No commit to `src/`. -> `Cycle: 53 / Phase: Suggester` (backlog still dry).

## Cycle 53

**Suggester — the engine audio, untouched since cycle 20 and not on the exclusion list.**

**The finding, read off the code rather than guessed:** `grep -rn visibilitychange src/` returns **nothing**. `disable()` (`engineAudio.js:116-119`) ramps the master gain to 0 but **never suspends**; the only `ctx.close()` is on unmount; and `update()` is driven by `drive.subscribe`, which is driven by `requestAnimationFrame`. So when a tab is hidden the loop pauses and `update()` simply **stops being called** — the oscillators keep running at whatever revs they last received, master gain still at **0.09**.

**Why that is a defect and not a detail:** this component's own comment calls sound _"the one control that is off until you press it"_, and builds the AudioContext **inside the click handler** so noise can only follow a deliberate gesture. A hum that follows the visitor into another tab, frozen at the revs they left at, is precisely the noise that design set out to prevent — and it burns battery on a page nobody is looking at.

**What I could not verify, and did not claim.** Whether Chrome suspends a hidden tab's `AudioContext` on its own decides whether this is _heard_ or merely _wasteful_. I tried to test it: created a second tab to background this one, and the drive tab still reported `visibilityState: "visible"`, so the experiment never ran. Its result is worthless and is not being reported as one. **The fix does not depend on the answer** — if the browser already suspends, an explicit suspend is a no-op; if it does not, the noise stops.

**The fix.** `suspend()`, not `disable()`: ramping the gain would leave the context running and still doing the work. Deliberately separate from enable/disable so the toggle's own state is never touched — coming back restores what the visitor chose rather than deciding for them. The listener is gated on `on`, so it only exists once sound has been asked for.

**Verified by real execution.** The graph lives in a closure, so "it should suspend" is unobservable from outside — I patched `AudioContext.prototype` to record calls and drove a **real** `visibilitychange` with `document.hidden` overridden:

- a **real mouse click** enables sound — `aria-pressed` flips to true and the label becomes _"Turn engine sound off"_. This mattered: a synthetic click grants no user activation, and the whole test would have been measuring silence
- hiding the page records **`suspend`** on the app's own context; showing it again records **`resume`**
- with sound **never turned on**, hiding and showing **twice** creates **zero** AudioContexts and makes **zero** calls — nothing starts by itself
- after toggling back **off**, hiding makes **zero** calls: the listener dies with the state that owns it
- **exactly one** AudioContext exists across the whole session despite repeated toggling
- the toggle still reports truthfully in both directions

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.5 kB). One commit: `78d7f0f`. -> `Cycle: 54 / Phase: Planner`.

## Cycle 54

**Suggester — audit the newest change, and this time the newest change was mine and it was wrong.**

Cycle 53 added the visibility handler that suspends the engine when you leave the tab. Reading it back:

```js
else engineRef.current?.unpause()
```

`unpause()` is `async` and **answers whether the context actually came back**. That handler throws the answer away. A browser can refuse to resume — autoplay policy, a long spell in the background, stricter rules on Safari — and when it refuses, the sound is gone while the button still says it is on.

**That is the exact lie the rest of the file exists to prevent.** `enable()` is deliberately `async` and returns whether sound really started; `toggle()` only claims "on" if it did; and the comment above it says _"a toggle that reports 'on' while silent is worse than one that admits it could not start"_. I broke that contract on the way back into the tab.

**Proven before fixing, not reasoned about.** With sound enabled by a **real click** and `AudioContext.prototype.resume` patched to reject, hiding then showing the page left the button at `aria-pressed="true"` and _"Turn engine sound off"_ while the context sat suspended — with `resume` attempted exactly **once**, so the path definitely ran.

**The fix** honours the answer, and only the answer that means something: `false` is a genuine refusal and switches the toggle off; `undefined` means there is no engine at all, which is not a reason to overrule what the visitor chose.

**Verified, all four cases:**

| case                            | result                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| resume **refused**              | toggle reads `aria-pressed="false"`, _"Turn engine sound on"_ — it admits the sound is gone |
| **recovery** after that refusal | a real click brings sound back — the fix does not leave the control dead                    |
| resume **succeeds**             | toggle **stays on** — a healthy resume does not switch it off                               |
| sound **never on**              | **zero** suspend/resume calls — cycle 53's guarantee still holds                            |

_Precisely: in the success case I checked the resulting toggle state, not the recorded calls — my probe cleared its log before I read it. The suspend/resume calls themselves were recorded in the refusal case and in cycle 53._

**The lesson worth keeping.** Cycle 53 tested suspend-on-hide and resume-on-show and they both passed — because the happy path passes whether or not the return value is honoured. The bug lived entirely in the failure path, and only appeared when I went looking for it deliberately. That is now guardrail 183.

**Exit.** `next lint` clean (only the pre-existing `SideNav.jsx` warning), `npm run build` compiles (`/drive` 21.5 kB). One commit: `e5fce6a`. -> `Cycle: 55 / Phase: Planner`.

## Cycle 55

**Suggester — cycle 54's lesson as a lens.** Guardrail 183 says test the failure path, because the happy path passes either way. So this pass went looking for **other** places where a failure is unhandled or a returned answer is thrown away, which is exactly the shape of the bug I shipped and then caught last cycle.

**The candidate that looked most likely.** `router.replace` (`DriveScene.jsx:357`) is called without a `.catch()`, and Next's router rejects the promise when a route change is cancelled — which is precisely what rapid navigation causes. So I fired **14 rapid alternating Back/Next clicks** at it with `window.error` and `unhandledrejection` listeners attached and `console.error` patched to record.

**Zero** window errors, **zero** unhandled rejections, **zero** console errors, and the itinerary stayed coherent (ended where it started, URL matching the title). Not a problem in practice.

**Then chaos during motion**, which is harder than chaos while parked: autopilot started, and then interfered with mid-leg — route map opened, Escape, Back, Next, throttle tapped and released. Again no crash and no errors.

**One reading looked like a real find and was not.** After the chaos the arrival panel was **gone** — zero matches in the DOM — while the title and URL both said EXIT 11. That looks like a desync between the simulation and React.

It is not. Reading the actual state rather than trusting the first alarming number: the trip computer said **"0.1 MI"**, not ARRIVED, and the gear read **1**, not P. The car had simply **coasted to a halt between exits** — which is what happens when you stop accelerating, and is correct behaviour. The panel is for arrivals; there had been no arrival. **My check was wrong, not the page**: it compared against a panel that legitimately is not shown mid-leg.

**And it recovers properly, which is the part that would have mattered.** Holding the accelerator completed the leg in **10 seconds**, ARRIVED appeared, and the panel came back with the right stop. A visitor cannot get stranded.

**Exit.** No commit to `src/`. -> `Cycle: 56 / Phase: Suggester` (backlog still dry).

## Cycle 56

**Suggester — do the things this site links to actually exist?** Fifty-five cycles had audited how the page behaves and never once checked whether its outbound links resolve. For a résumé site that is a strange gap: a dead project link is visible to exactly the person you least want to show it to.

**First, the résumé PDF, which is the single most important link on the page.** `/resume.pdf` serves **200** — but at **3,730 bytes**, which looked like a placeholder. It is not: one page, 9 objects, base-14 Helvetica and a single Flate stream is exactly what a text-only résumé weighs. I decompressed the stream and read it. It is the real document, current, and it **agrees with the site** — _Senior MES DevOps Engineer, StarPlus Energy, Dec 2025 - Present_, matching `experience.js` role for role. A portfolio whose PDF contradicts its own pages would be a bad thing to ship; this one does not.

**Then all 21 outbound URLs in the content.** Two harness faults on the way, both caught by controls:

- the first sweep returned **000 for all 21**, which would have read as catastrophe. Python had written the URL list with Windows line endings, so every URL carried a trailing `\r`. A single `curl` to GitHub had returned **200** moments earlier — that mismatch is what exposed it.
- `virshop-flask.onrender.com` read 000 on the first pass and **200 in 0.27s** on retry: a free-tier cold start, not a fault. It is not in the findings because I re-checked it.

**Two links are genuinely dead, and both belong to the same project — Solar Power Indy, EXIT 11:**

| button        | href                                       | result                    |
| ------------- | ------------------------------------------ | ------------------------- |
| **Live site** | `https://gosolarindy.energy`               | **domain does not exist** |
| **Source**    | `https://github.com/HTJin/solar-questions` | **404**                   |

**Established rather than assumed:** `nslookup` says _"Non-existent domain"_; `curl` exits **6 (could not resolve host)** with `dns=0.000000s`; the `www.` and `http://` variants fail identically; and the **control**, `vercel.com`, returns **200** from the same shell, so the network is fine. GitHub answers **404 in 0.39s** — a real reply from a live host, not a timeout — while every other `github.com/HTJin/*` repo in the content returns 200. And the dead domain is not only linked but **printed**: the screenshot frame's browser chrome shows `gosolarindy.energy` as that project's address.

**Parked as Needs human, deliberately.** Both live in `src/lib/projects.js`, which the Guardrails make read-only, and the fix is a judgment only the owner can make — whether the domain lapsed, the repo went private, or there is a new address. The loop will not guess a replacement URL or quietly delete a project.

**Exit.** No commit to `src/`. -> `Cycle: 57 / Phase: Suggester` (backlog still dry).

## Cycle 57 (2026-08-06, resumed session)

- **Resumed.** Previous session ended; the relief heartbeat is session-only and died with it. Re-created (`*/30 * * * *`). Ledgers all intact on disk; state read as `Phase: Suggester, Cycle: 57`.
- **Environment repair.** Six orphaned `next dev` servers (3111-3116) + a `next start`, all sharing `.next`; `/drive` was serving 500. Killed, wiped `.next`, clean rebuild. Guardrail 6.
- **Phase: Suggester** -> began (audit + market research), produced S96 and S97, then **superseded by a direct owner instruction** mid-cycle. Owner instructions outrank loop-generated work; S96/S97 parked to the Backlog intact.
- **Phase: Builder** -> T1 built and committed `a511ce0`. Lint clean, build clean.
- **Phase: Reviewer** -> partial. Geometry proven at a stop by canvas pixel sampling. The taper in motion could NOT be exercised: `document.hidden` is true (Chrome window minimised), so rAF is paused (guardrail 24). First probe hung CDP 45s; retry timeout-guarded. Resolved to **Needs testing** rather than Done — self-verification is the only gate, so an unexercised claim does not get to be Done.
- **Progress flag:** yes — one substantial feature built and committed, two new ideas banked.

## Cycle 58 (2026-08-06)

- **Phase: Reviewer (cycle 57)** -> cleared the one Needs-testing item rather than parking it, by pumping rAF by hand instead of waiting for a foregrounded window. Cycle 57 T1 moved **Needs testing -> Done**.
- **Owner-directed work, seven messages** across the cycle. Six were real and are shipped in five commits; one - the "gap" on the right - was my own iframe harness and is recorded as **not a defect**.
- **Guardrail 50 amended, not broken.** Cycle 18 required the wheel centred on `innerWidth / 2`; the owner requires it left of centre. Amended in the open with the new target and the measured table.
- **New standing limit recorded.** `RAMP_DROP` cannot exceed `CAM_HEIGHT` in this renderer. The constant now carries the proof, and S102 describes the geometry needed to lift it.
- **Progress flag:** yes - one item verified to Done, six owner-directed changes shipped, one false alarm closed, one new backlog item.

## Cycle 59 (2026-08-06)

- **Phase: Planner** -> took S102 from the backlog: the only item that finishes _owner-directed_ work, since cycle 58 shipped the requested hill capped and filed the real fix rather than building it. S95/S97 stay queued.
- **Phase: Critic** -> five guardrails written (56-60). The load-bearing one was 56: a **baseline measurement showed 26,683 opaque road pixels already painting above the eyeline**, because `hillAt` swings +/-3.5m against a 1.35m eye. So the clip could never be a pure ramp change, and the crest case had to be re-checked afterwards. It was.
- **Phase: Builder** -> `8264530`. Drop 1.15 -> 3m.
- **Phase: Reviewer** -> verified by real execution: mainline inspected with the ramp fully out of it; three legs pumped with exact arrivals and a constant drop/ramp ratio.
- **A rejected attempt, recorded rather than buried.** 7.5m was built, rendered, looked at, and abandoned. The screenshot is the evidence and S104 describes what it would actually take.
- **Progress flag:** yes - one backlog item closed, one honest new one opened.

## Cycle 60 (2026-08-06)

- **Phase: Planner** -> took S97 (touch on the pedals). S95 (forced-colors) **not reached**; still queued, nothing claimed about it.
- **Phase: Critic** -> five guardrails (61-65). Guardrail 64 (React does not re-render on rAF) earned its place within minutes: the first destination check read `disabled: false` and would have been reported as a broken cycle-45 fix.
- **Phase: Builder** -> `ae31e76`. Two real defects, both in `onPointerDown`.
- **Phase: Reviewer** -> seven cases re-run against the rebuilt page with the sim pumped by hand; zero uncaught errors.
- **A browser-behaviour question settled with real input rather than assumed:** Chrome fires `pointerdown` on a disabled `<button>`. Proven with a control click that landed. This is what turned "probably a harness artefact" into a real defect.
- **Progress flag:** yes - one backlog item closed, two defects fixed.

## Cycle 61 (2026-08-06)

- **Owner-directed**, and explicitly asked for research first: how a car interior is actually proportioned, because "the elongated hud" looked wrong. Searched, then measured the shipped value (6.2:1), then changed it to the 16:9 that production centre displays use.
- **Both items measured before and after**, at five widths: aspect 6.21 -> 1.77-1.78, exit panel 76rem/3 columns -> 60rem/2 columns with a ~57 character measure, zero pedal/console/screen collisions, console on one row, no horizontal scroll.
- **A correction to an earlier cycle's reasoning, not just its output.** Cycle 49's third column was backed by real measurements that showed a win on both axes. The numbers were right and the conclusion was wrong, because "nothing hidden, narrow measure" does not capture "this is a metre-wide broadsheet". Recorded so the next pass does not re-derive the third column from the same numbers.
- **Progress flag:** yes - two owner-directed changes shipped.

## Cycle 62 (2026-08-06)

- **Phase: Planner** -> continued the owner's proportion work from cycle 61 ("certain parts", plural): audited the instrument cluster and steering wheel against how cars are actually built.
- **Phase: Reviewer** -> **nothing shipped, on purpose.** Two suspected defects were disproved by measuring properly, and the one real finding needs a cycle of its own rather than the tail of an audit.
- **A wrong first reading, caught and corrected.** "Cluster is 40px left of the wheel axis" came from measuring two of the row's three children. With the gear block included, children and row both centre on 602. Reported as a non-defect rather than as a fix.
- **Progress flag:** no shipped change. One suspected defect disproved, one non-defect documented, one well-evidenced backlog item opened (S107).

## Cycle 63 (2026-08-06)

- **Phase: Planner** -> took S107, which cycle 62 had filed as needing a cycle of its own.
- **Outcome: mechanism proven, one new confirmed defect, nothing shipped.** The wheel's width is the dash height, its column is width-derived, and the gauges are height-derived with a px cap - three rules where a real car has one.
- **New confirmed defect:** the wheel overflows its column (up to 1.57x) and **draws over the brake pedal** at 1280x1024 and 1024x1180.
- **A fix was attempted and abandoned for a specific, measured reason:** the wheel's rotation is a transform about the box centre, so any change that makes the wrapper non-square would make the wheel orbit rather than spin - a bug invisible to a static screenshot. Recorded in S107 so the next attempt does not walk into it.
- **Progress flag:** no shipped change, second consecutive on this thread. Flagged in the report as needing a decision rather than another audit.

## Cycle 64 (2026-08-07)

- **Phase: Planner** -> took S95, unreached since cycle 57. S107 left parked: it is awaiting the owner's decision after two no-ship cycles, and starting a third would be exactly what I said I would not do.
- **Phase: Builder** -> `dd32f65`, one line plus the reasoning.
- **Phase: Reviewer** -> layout neutrality measured at three widths (outer rects identical), audit re-run to an empty at-risk list, phone and landscape-phone checked.
- **A limitation stated rather than papered over:** forced-colors is not emulatable through this browser bridge. The inventory and the layout-neutrality are measured; the forced-colors rendering is not, and the commit says so.
- **Progress flag:** yes - one real accessibility defect fixed, backlog item closed.

## Cycle 65 (2026-08-07)

- **Owner-directed**, five items: thicker road, exit further out, lower elevation, longer legs, and a reported flaw - "you failed to give the profile of the highway road any existence".
- **The reported flaw was real and was mine.** The embankment was gated on lateral separation rather than elevation difference, leaving an undrawn gap across the first half of every taper, and the mainline had no side face at all.
- **It also retired S104's premise.** The 3m cap on `RAMP_DROP` and the filed "needs real 3D clipping" both rested on a wrong diagnosis: the black wedge at 6.5m and 7.5m came from the missing flank, not from the projection. 5.5m is now clean with no clipping work.
- **Verified:** three legs pumped with exact arrivals and a constant drop/ramp ratio; mid-taper and bottom-of-ramp inspected directly.
- **Progress flag:** yes - one real defect fixed, four tuning requests delivered, one backlog premise retired.

## Cycle 66 (2026-08-07)

- **Phase: Planner** -> actionable backlog dry (S107 parked on the owner, S104 premise retired, S15/S17 need `_app.jsx`), so took a regression sweep of cycle 65's road overhaul instead. Justified: `LEG_LENGTH` moved 24% and several quantities derive from it.
- **Phase: Reviewer** -> **no defect found.** 21/21 exits clean, 28/28 images, no horizontal scroll, derived route distance correct at 5.2 mi.
- **Recorded as a trade, not a bug:** a leg now takes 14.1s and the full route ~4.7 minutes of held accelerator, up from ~3.1 min originally.
- **Third instance this run of a bad selector masquerading as a defect** - noted in the journal, since it keeps happening and the pattern is worth naming.
- **Backlog now genuinely dry** -> next cycle goes to the Suggester for a fresh audit and market-research pass.
- **Progress flag:** no shipped change; a change-set verified and one consequence quantified.

## Cycle 67 (2026-08-07)

- **Phase: Suggester** -> backlog dry, so a fresh audit plus market research. Four new ideas: S111 (no print stylesheet - measured, zero rules), S112 (time-to-content, sharpened by cycle 65's longer legs), S113 (cold page weight - redo properly), S114 (heap over a long drive - redo properly).
- **Two measurements discarded rather than reported.** Page weight read 0.9 KB because cached resources report `transferSize: 0`. The heap probe never started the engine, so the car never moved and the delta was GC noise. Both filed as work, not findings.
- **Market research** reinforced two things the run has not looked at: load under two seconds, and not burying content behind animation.
- **Phase -> Planner** with a refilled backlog.
- **Progress flag:** no shipped change; backlog refilled from dry with four measured or clearly-scoped items.

## Cycle 67 continued - Builder/Reviewer (2026-08-07)

- **Phase: Planner -> Builder -> Reviewer** on S111 (printing). Shipped `1dde62c`.
- **Two build errors were the teacher.** `:global(html)` and `:global { html, body }` are both rejected by CSS Modules; that is how the constraint was found, not by reading docs and hoping. The body overflow is released in JS on `beforeprint` instead, next to where it is set.
- **Verified what is verifiable and said what is not:** rules, their targets, the beforeprint/afterprint round trip and screen-neutrality are all measured. The printed page is not - no print emulation through this bridge, and `window.print()` would open a blocking modal in an unattended loop.
- **Progress flag:** yes - one measured gap closed.

## Cycle 68 (2026-08-07)

- **Phase: Planner -> Reviewer** on S113 and S114, both re-dos of measurements botched in cycle 67.
- **S114 (heap over a long drive): DONE, no leak.** Full route driven - 20 legs, travel 8400, 16,780 frames - settled heap +0.62 MB total, 0.031 MB a leg. The validity gate (`travel > 0` before trusting anything) is what made this run trustworthy where the last was not.
- **S113 (cold page weight): PARKED - not measurable through this bridge.** Content-hashed chunks stay cached and report `transferSize: 0`; the browser cache cannot be cleared from here. Joins frame rate (cycle 52), forced colors (cycle 64) and the printed page (cycle 67) on the list of things this environment genuinely cannot see.
- **Progress flag:** yes - one backlog item closed with a real answer, one honestly reclassified as unmeasurable.

## Cycle 69 (2026-08-07)

- **Phase: Planner -> Reviewer** on S112 (time-to-content), the last unstarted backlog item. **Measurement only, per its own scope - nothing shipped.**
- **Result: no defect, and the premise behind the idea was wrong.** Content appears on click one (the origin card), the classic site is offered on the splash, and the route map is in the cockpit and named on the splash: three clicks to any of 21 stops. Only the intended path is slow (2 clicks + 14.1s), which is deliberate.
- **Recorded a standing measurement caveat:** a `width > 8 && height > 8` filter counts the sr-only itinerary's links, because `clip` on the ancestor does not zero descendants' rects. Affects any future "count the visible controls" probe.
- **Backlog now dry again** -> cycle 70 goes to the Suggester.
- **Progress flag:** no shipped change; last backlog item closed with a measured answer.

## Cycle 70 (2026-08-07)

- **Phase: Suggester** -> backlog dry, so a fresh audit. Checked one thing never checked in this run: **keyboard-only driving**. It works - throttle, brake, alternate keys, and a full leg completed on keys alone. No defect.
- **Two odd readings correctly diagnosed as harness artifacts** rather than filed as bugs (the `n` key, and a stale React `index`). That discipline is now the recurring theme of this run.
- **Three ideas filed:** S115 (re-verify reduced motion against the rewritten road - the strongest, since it is downstream of `goTo`, which changed), S116 (`n` key from a genuinely parked state), S117 (keyboard-only traversal end to end, including the route map and panel links).
- **Phase -> Planner** with a refilled backlog.
- **Progress flag:** no shipped change; one clean audit and three scoped ideas.

## Cycle 70 continued - Planner/Reviewer (2026-08-07)

- **S115 (reduced motion, re-verified against the rewritten road): no defect.** Teleport lands at travel 420 in 3 frames with ramp 30.2 and drop -5.5, correct for the destination. Control run animates over 842 frames, so the result is meaningful rather than a dead harness.
- **Caveat recorded:** the `matchMedia` patch landed at `readyState: interactive` rather than `loading`; it worked, and the control proves it, but `loading` stays the safer target.
- **Backlog:** S116 and S117 remain, both keyboard items. S107 still parked on the owner's decision.
- **Progress flag:** no shipped change; the largest outstanding regression risk from cycles 57-65 checked and cleared.

## Cycle 71 (2026-08-07)

- **Phase: Planner -> Reviewer** on S116 and S117, both keyboard items, settled in one probe.
- **S116 (the `n` shortcut from parked): PASS.** Target advances 0 -> 1, autopilot engages, arrives at travel 420 in 838 frames. Resolves the reading cycle 70 correctly refused to call either way.
- **S117 (keyboard traversal): PASS.** Map opens on `m`, focus moves into the dialog, Escape closes it, driving still works after the round trip.
- **Backlog dry again** -> cycle 72 goes to the Suggester.
- **Progress flag:** no shipped change; two backlog items closed with real answers and one earlier unproven reading resolved.

## Cycle 72 (2026-08-07)

- **Phase: Suggester** -> backlog dry. Audited the route map for distance figures that could have gone stale when `LEG_LENGTH` changed. All 21 stops list correctly; the map prints **no distances at all**, so the hypothesis did not apply. **No defect.**
- **One idea filed (S118)** and one honest observation: five consecutive cycles have returned "no defect" on drive mode.
- **Diminishing returns flagged in the report.** The remaining high-value work is parked on the owner (S107) or out of write scope (classic site, canonical, sitemap). Continued self-directed cycles should be a deliberate choice.
- **Phase -> Planner.**
- **Progress flag:** no shipped change; one audit clean, one idea filed, run state made explicit.

## Cycle 73 (2026-08-07)

- **Phase: Planner** -> no buildable item: S118 is parked on the owner's appetite (it is an addition to their cockpit, not a correction) and S119 is an observation. Followed cycle 35's precedent instead and re-verified the parked Needs-human patches, unchecked for ~38 cycles.
- **All four still valid.** Classic-site photo patch exact to the line; sitemap still one `<loc>`; `/drive` still ships two canonicals with the homepage first; `gosolarindy.energy` still does not resolve.
- **One correction to the record:** the Solar Power Indy repo returned a connection abort this time rather than cycle 56's clean 404. Still unreachable, control returns 200, but the difference is recorded rather than smoothed over.
- **Progress flag:** no shipped change; the owner's parked work confirmed safe to apply.

## Cycle 74 (2026-08-07)

- **Phase: Suggester** -> filed S121: three toolchain warnings the build and lint have been emitting all run, all in files outside this run's write scope, so all parked for the owner.
- **Phase -> Planner.**
- **Progress flag:** no shipped change; three standing warnings surfaced and attributed.

## Cycle 75 (2026-08-07)

- **Phase: Planner** -> no buildable item remained; everything left is parked on the owner or out of write scope. Ran an end-of-run **integrity check** on the branch instead of inventing work.
- **Result - the guardrails provably held:** zero content diff to `src/content`, `src/components/sections`, `src/lib`; exactly **nine** files changed across the run, all inside `src/components/drive/**` and `src/styles/drive.module.css`; the owner's own pre-existing uncommitted changes untouched.
- **Branch state:** build clean, `/drive` 22.5 kB, no drive-scope lint issues, nothing uncommitted in scope, 34 commits, nothing pushed.
- **Progress flag:** no shipped change; the run's own compliance verified rather than claimed.

## Cycle 76 (2026-08-07)

- **Phase: Suggester** -> no new defect hunted. The loop has returned "no defect" for six of the last seven cycles and everything of consequence is parked, so the useful act was **consolidation, not discovery**.
- Wrote `overnight-ACTION-REQUIRED.md`: one page covering the S107 decision, three out-of-scope fixes with confirmed line numbers, the two dead project links, four measurements only a human with DevTools can take, the leg-length preference, and three toolchain warnings.
- **Progress flag:** no shipped change and no new finding; the run's output made usable.

## Cycle 77 (2026-08-07)

- **Phase: Planner** -> nothing buildable remained, so verified the accuracy of what cycle 76 wrote for the owner rather than adding to it.
- **S107 collision re-measured** after cycles 61 and 65 changed the dash and road: still present at both viewports, figures corrected from -2px/-53px to **-1px/-52px**, 1920x1080 clear by 36px. `overnight-ACTION-REQUIRED.md` updated with the provenance.
- **Progress flag:** no shipped change; the owner-facing figures made current.

## Cycle 78 (2026-08-07)

- **Phase: Suggester** -> no new defect. Re-checked the owner-facing action file's own factual claims: the "34 commits" figure was already stale (37) and was replaced with the `git` commands that stay current. Nine-file scope and zero owner-content diff re-confirmed.
- **Position recorded plainly:** cycles 72-78 produced an audit, an integrity check, a consolidation, and two corrections to that consolidation. The loop is functioning as specified, but marginal value per self-directed cycle is now near zero with everything of consequence parked on the owner.
- **Progress flag:** no shipped change; one stale owner-facing figure removed at the root cause rather than updated.

## Cycle 79 (2026-08-07)

- **Owner-directed, three rounds on the exit's side profile.** Ramp given its own ground; barrier made opaque; bank turned from a 90-degree wall into a ~1:2.6 slope with the parapet reduced to a guardrail. Vegetation planted on the face, deterministic per guardrail 25. Commits `1e1445a`, `f3a85d7`, `97c1012`.
- **Root cause of needing three rounds:** every check was taken at the endpoints (parked, or on the open mainline) where the ramp offset is extreme. All three faults lived mid-descent. Recorded as the sampling rule for anything ramp-related.
- **New standing convention:** `npm run prettier` after every code change, before committing - in a new repo-root `CLAUDE.md` plus persistent memory.
- **Progress flag:** yes - three owner-reported defects fixed, one convention established.

## Cycle 80 (2026-08-07)

- **Phase: Suggester** -> tested the new vegetation in motion, per cycle 79's sampling rule. **Measurement invalid and discarded:** the flower-colour detector matches sunset sky, returning 4,837 "flowers" on the open mainline against 1,092 mid-descent. The gate is neither confirmed nor refuted.
- **Filed S123** with a method that would actually work.
- **Progress flag:** no shipped change, no valid finding. A bad probe caught before it became a bug report.

## Cycle 81 (2026-08-07)

- **Phase: Planner -> Reviewer** on S123. **Gate verified correct:** 0 marker pixels on the open mainline, 7 mid-descent, using temporary magenta/cyan flowers that no palette contains.
- **Experiment fully reverted** - colours restored, build clean, `git diff --numstat -- src/` empty, nothing stray committed. Scoped `npx prettier --write` used per the CLAUDE.md note added in cycle 79.
- **Method lesson recorded:** the fix for a detector that keeps lying is to measure a property the background cannot have.
- **Progress flag:** yes - one open question closed with a valid measurement, no code change needed.

## Cycle 82 (2026-08-07)

- **Phase: Suggester** -> examined the bank/ramp junction at full drop, the one case the slope change created and I had only reasoned about. **No gap** - ground continuous from bank to ramp at travel 420, drop -5.5.
- **One more invalid probe, discarded on the spot:** a "sky" reference sampled above the horizon was actually the embankment, so the hole-detector's zero was meaningless. Resolved by direct observation instead.
- **Progress flag:** no shipped change; one unverified assumption from the slope work closed by looking at it.

## Cycle 83 (2026-08-07)

- **Phase: Planner** -> backlog dry, everything parked. Refreshed `overnight-ACTION-REQUIRED.md` rather than manufacturing work: re-stamped to cycle 83, noted the cycle-77 re-measurement of the S107 figures, and made explicit that the recent side-profile fixes are absent from that page because they are **done**, not overlooked.
- **Branch verified clean:** zero content diffs across `src/`, nothing uncommitted in drive scope.
- **Progress flag:** no shipped change; the owner-facing page kept true.

## Cycle 84 (2026-08-07)

- **Phase: Suggester** -> plain smoke test on the real page rather than an invented finding. `/drive` clean: hydrated, canvas, splash, no horizontal scroll, print block present.
- **One false alarm caught:** the sr-only itinerary appeared to have collapsed from 9,854 characters to 26. `querySelector('.sr-only')` had returned the skip link; there are three such elements and the itinerary is still exactly 9,854 characters.
- **Fourth false reading this run caused by a selector matching the wrong element.** Named as a rule: when a selector can match more than one thing, count the matches before believing the one you got.
- **Progress flag:** no shipped change; current state confirmed sound and one false alarm dismissed.

## Cycle 85 (2026-08-07)

- **Phase: Planner** -> backlog dry. Consolidated the run's seven false readings into a "Measuring the drive scene" section in `CLAUDE.md`, so the lessons live where work happens rather than in journal entries.
- Six rules plus two environment limits, each traceable to a specific wrong conclusion caught during the run.
- **Progress flag:** no shipped change; the run's most transferable output moved somewhere it will be read.

## Cycle 86 (2026-08-07)

- **Phase: Suggester** -> executed the two commands `CLAUDE.md` instructs the next person to run. Both behave as documented: the scoped prettier command stays inside drive scope, and `git diff --numstat -- src/` returns 0 content diffs.
- **Progress flag:** no shipped change; the run's own documentation verified by running it.

## Cycle 87 (2026-08-07)

- **Phase: Planner** -> found the report's shipped-work table still ended at cycle 67, omitting the owner's three side-profile fixes (cycles 79-82) and their verification (81). Added four rows.
- **Progress flag:** no shipped change; an owner-facing summary corrected from stale to accurate.

## Cycle 88 (2026-08-07)

- **Phase: Suggester** -> asked whether cycle 87's contradiction was isolated. It was not: the leg time, the 4.7-minute route figure and the 52px overlap are all duplicated across the report and the action page.
- **Structural fix, not another sync:** the report's leg-length paragraph now points at `overnight-ACTION-REQUIRED.md` §5 rather than restating its numbers, with the reason recorded inline.
- **Progress flag:** no shipped change; the mechanism behind a documentation contradiction removed rather than its symptom patched.

## Cycle 89 (2026-08-07)

- **Phase: Planner** -> completed the de-duplication cycle 88 started: the report's S107 section no longer restates the collision figures and points at the action page instead.
- **Caught my own near-miss:** an HTML comment wrapping the old paragraph would have been left unclosed, swallowing the next section. Removed the paragraph outright and verified by grep that no action-page figures remain in the report.
- **Progress flag:** no shipped change; the single-source rule now actually holds across both documents.

## Cycle 90 (2026-08-07)

- **Phase: Suggester** -> removed the hard cycle count and the stale owner-directed list from the report header; it now points at the tasks file's phase marker, which the loop updates every cycle.
- **Named the shared root cause** behind cycles 78, 87, 88, 89 and 90: a figure copied into a summary is a figure that will be wrong later. A summary should point at what changes, not restate it.
- **Progress flag:** no shipped change; the last drifting figure in the owner-facing docs removed at its cause.

## Cycle 91 (2026-08-07)

- **Phase: Planner** -> found the report's shipped table broken into four fragments by blank lines between rows (a blank line ends a Markdown table), three fragments headerless, and rows out of cycle order. Rebuilt as one contiguous sorted table, 19 rows, 57 through 81.
- **Root cause noted:** every prior inspection read the file as raw text, where the defect is invisible. Same class as the canvas measurement failures - checking the artefact in a form the reader never sees.
- **Progress flag:** no shipped change; the owner-facing summary now actually renders.

## Cycle 92 (2026-08-07)

- **Phase: Suggester** -> checked all three owner-facing documents for the table fragmentation found in cycle 91. **Clean:** zero fragmenting blank lines in the action page, CLAUDE.md or the report.
- The fault was confined to the file appended to across dozens of cycles, which explains why it accumulated there alone.
- **Progress flag:** no shipped change, no defect found; cycle 91's fix confirmed complete rather than assumed so.

## Cycle 93 (2026-08-07)

- **Phase: Planner** -> after eight documentation-only cycles, verified the product itself. Last drive-mode source commit is still `97c1012` (the slope fix); build clean, `/drive` 22.8 kB / 152 kB first load; drive-scope lint clean. **No drift.**
- **Trend recorded:** cycles 85-92 produced documentation fixes and then nothing. Real faults in files the owner reads, but the productive backlog is empty and the cycle count should not be read as progress.
- **Progress flag:** no shipped change; product integrity confirmed after a long stretch of doc-only work.

## Cycle 95 (2026-08-07)

- **Phase: Planner -> Builder -> Reviewer** on S124 (print sheet), the most substantive review finding.
- **Fixed by inversion:** hide every direct child of the scene except the `printKeep` wrapper, rather than enumerating cockpit pieces. Verified by resolving the shipped selector against the live DOM - 11 children, 10 hidden, 1 kept, dashboard hidden, itinerary intact.
- **Lesson recorded:** the defect sat inside the exact area cycle 67 had flagged as unverifiable. Two cycles running, the bug was in the part I had honestly labelled as unchecked.
- **Progress flag:** yes - a real shipped-feature defect fixed. S125 and S126 remain.

## Cycle 96 (2026-08-07)

- **Phase: Planner -> Builder -> Reviewer** on S125 and S126, the last review findings. Both fixed and committed.
- **S125 verified against the case it exists for:** a foreign `overflow` value survives a print round trip (`clip -> visible -> clip`); the old hardcoded restore would have written `hidden`.
- **S126:** comments describing an abandoned `absolute` approach rewritten to match the shipped flow layout; dead `relative` removed.
- **All six review findings closed.** Two were real defects in shipped features.
- **Progress flag:** yes - review backlog fully cleared.

## Cycle 97 (2026-08-07)

- **Phase: Suggester -> Builder -> Reviewer.** Dispatched a second review over the first review's own fixes; it found a **medium defect I introduced in cycle 96**.
- **Fixed:** the `beforeprint` capture was unconditional, breaking on double-`beforeprint` (permanently scrollable) and lone-`afterprint` (lock cleared). Verified four paths against the built page. Also stripped a UTF-8 BOM I had added to `route.js` via PowerShell - the exact trap CLAUDE.md warns about.
- **Filed S127** (the `max` clamp contradicts its own comment; makes a ~0.25m vertical face early in descent) and **S128** (`<noscript>` overlay is a grandchild, so the print keep-rule cannot hide it).
- **Progress flag:** yes - one medium defect and one artifact fixed; two low findings filed.
