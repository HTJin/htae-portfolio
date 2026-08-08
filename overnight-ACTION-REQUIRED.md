# Action required — one page

Everything below is waiting on **you**. The loop verified each item by running it, and cannot proceed on any of them
alone: they are either outside its write scope, or judgement calls it declined to make for you.

The full history is in `overnight-report-2026-08-05.md` and the ledgers beside it. This file exists because those
have grown past the point where the actionable parts are findable.

_Last confirmed: **cycle 128**, 2026-08-08. Not re-stamped from memory — each of these was re-run:_

- _**§1 reproduces exactly**, 49 cycles after it was first measured and after a control was added to the dash:
  **−36px at 1920×1080, 1px at 1280×1024, 52px at 1024×1180.**_
- _**§3 reproduces exactly**: `github.com/HTJin/solar-questions` → **404**, `gosolarindy.energy` → **DNS failure**,
  `github.com/HTJin` → **200**. Both of your calls-to-action are dead; your account is not._
- _**§2 reproduces exactly**: two `canonical` tags with `https://htae.dev` **first**, `og:url` doubled the same way,
  and `public/sitemap.xml` carrying a single `<loc>` for the homepage._
- _**§5 was wrong and is corrected** — a leg is **21 s**, not 14.1 s; the route is **~7 min**, not 4.7._
- _**§4 narrowed**: two of its three items now have their **mechanism** confirmed in the shipped artifact, leaving
  only the visual confirmation to a human; and frame-rate **regressions** turn out to be measurable even though the
  absolute number is not._
- _**Structural claims** re-verified by the commands at the foot of this page: still exactly nine committed source
  files, `src/content` and `src/lib` diff still empty, `Projects.jsx` line numbers in §2 still landing correctly._

**Nothing on this page was caused by the drive-scene work** — the missing ground, the see-through barrier, the
90-degree bank, the walls beside the exit and the buried planting were all reported by you, fixed, and verified.
They are not listed here because they are done.

> **Section 7 is new since this page was last written** and holds five items filed between cycles 100 and 123. If
> you read this page before, that section is the only part you have not seen.

---

## 1. A decision — the wheel draws over the brake pedal

**Confirmed defect, re-measured in cycle 77.** On tall-narrow windows the steering wheel grows past its own column
and paints over the brake pedal: **1px overlap at 1280×1024, 52px at 1024×1180**, and over the door card at both. It
is `pointer-events-none`, so it does not block the press — it covers it. At 1920×1080 it clears by 36px.

_(First measured in cycle 63 as 2px / 53px. Re-checked here because cycles 61 and 65 changed the dash and the road
afterwards and this page is written to be acted on — the defect survives both, and the difference is sub-pixel
rounding, not movement.)_

**I did not fix it, deliberately.** The wheel rotates via a transform about the _box_ centre. Every one-line fix
(`max-w-full` and relatives) makes the wrapper non-square, at which point the wheel's content no longer shares that
centre and it would **orbit instead of spin** — invisible in a screenshot, so it would have shipped. The fix that
keeps rotation correct re-centres the wheel out of its tuned position, and no constant fraction works because the
overflow ranges 0.925 → ~1.57.

The real fix derives the wheel, its column and the gauges from one `min(column width, dash height)` — a cockpit
re-derivation touching the dash-height budget that three earlier cycles tuned for short and landscape-phone
viewports. **Say go and it gets a full cycle with those guardrails loaded.** (Ledger: S107.)

## 2. Three fixes outside the loop's write scope

Re-verified in cycle 73 and still exactly applicable — line numbers confirmed, not remembered.

- **The classic site still crops project photos and never cycles them.** `src/components/Projects.jsx`:
  `aspect-video` at **line 97**, `object-cover` at **line 120**, `AnimatePresence` already at **104**,
  `handleScreenshotClick` at **61**, and a grep for `setInterval|setTimeout|useEffect` returns **nothing** — so
  every screenshot is cropped and only advances on click. Drive mode fixed both faults back in cycle 1; the main
  page never got them. The exact patch is written out in `overnight-tasks-2026-08-05.md`.
- **`/drive` ships two canonical tags**, `https://htae.dev` **first** and `https://htae.dev/drive` second. Crawlers
  honour the first, so `/drive` currently tells them it is the homepage. `og:url` is doubled the same way. Fix is
  `key` props in `_app.jsx`.
- **`/drive` is missing from `public/sitemap.xml`** — one `<loc>`, for the homepage. That is half the site's
  indexable routes.

## 3. Two dead buttons on your own project

**Solar Power Indy (EXIT 11)** — both calls to action fail. `gosolarindy.energy` does not resolve; the Source link
is unreachable (a clean **404** in cycle 56, a connection abort when re-checked in cycle 73 — either way, dead),
while `github.com/HTJin` returns **200**, so it is not a network problem.

Both live in `src/lib/projects.js`, which the guardrails make read-only, and **only you know** whether the domain
lapsed, the repo went private, or there is a new address. The loop will not guess a replacement or delete the
project.

## 4. Three measurements this environment genuinely cannot take

**Cold page weight is no longer one of them — it was measured in cycle 112, so please ignore any earlier note asking
you to take it.** Over the wire, cache bypassed: **572.6 KB**, of which **352.5 KB (62%) is two variable fonts**
(`Inter-roman` 221.9 KB, `Mona-Sans` 130.6 KB) against 198.4 KB for _all_ JS and CSS. `Inter-italic` (239 KB) is
declared but never requested on `/drive`. **The old 208 KB figure has been retired, not beaten** — it sits within a
rounding error of the JS+CSS-only number, so it almost certainly excluded fonts and is not a comparable baseline.
Fonts are the only remaining weight win and are outside this run's scope (ledger: S137).

The rest are still unknowns rather than passes — each is seconds of work with DevTools open:

| What                        | How                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Forced-colors rendering** | Rendering tab → _Emulate CSS media feature forced-colors: active_. **The mechanism is now confirmed in the shipped page** (cycle 128): both pedals compute to `1px solid rgba(0,0,0,0)` — a real border that forced-colors repaints into a visible outline — against a control element that computes `0px` and correctly fails the same check. Only the **render** still needs a human eye.          |
| **The printed page**        | Ctrl+P on `/drive`. **The `@media print` block is confirmed present in the served CSS bundle** (cycle 128), which a Tailwind purge or a stale webpack cache could have dropped. Only the **paper** still needs a human eye.                                                                                                                                                                          |
| **Frame rate**              | Any real profiler for the **absolute** number — a blank page still benchmarks the same as the drive here. **Regressions, however, are measurable**: A/B the same harness against a rebuilt baseline. Done for real in cycle 122 — 84.6 ms with the change against 83.7 ms without, which is how a ~1% cost was distinguished from a guardrail violation and stopped a correct change being reverted. |

## 5. One preference

**A leg takes about 21 seconds** — roughly **7 minutes** to drive the whole route on the accelerator. That is the
direct result of your "I want the ride to the next exit a bit longer". `Next` still autopilots, and the deep links
(`?exit=N`) are instant. Say the word if you want it pulled back.

_Corrected in cycle 127. This section previously said **14.1 seconds and 4.7 minutes**, which was roughly half the
real figure — you would have been deciding whether to shorten the drive against a number that was not true.
Re-measured stop to stop over a clean full leg (1260 → 1680, exactly 420m, throttle held, peak 94 mph): **21.1 s**,
which agrees with an independent 23.4 s measured for the first leg in cycle 113. The old figure probably timed
cruising only, excluding the pull-away and the braking into the next stop — both of which you sit through._

## 6. Three toolchain warnings, all out of scope

- **`SideNav.jsx:38:6` — `useCallback` missing dependency `sections`.** The only one with real bug potential; a
  stale closure would act on outdated data.
- **`next.config.mjs`** enables experimental `scrollRestoration` — outside semver, so an upgrade can drop it.
- **`tailwind.config.js`** safelists `/^apexcharts-.*$/`, which matches no classes. Dead config that makes every
  build print a warning, which is how people learn to ignore build warnings.

## 7. Five things filed since this page was last written

**Read this one first.**

- **Someone else edited the drive source while the loop was running, and two files are still uncommitted.**
  `CarInterior.jsx` and `world.js` carry changes this loop did not make, timestamped after its own commits. It has
  left them alone throughout: committing them would attribute your work to the run, reverting them would destroy
  work whose intent it cannot see. `RoadCanvas.jsx` was the third such file, and its changes **were** committed —
  they had become inseparable from a fix you asked for. **Decide which of those you want kept.** (NH-9.)
- **The windscreen shows about 86% of the viewport width.** You reported the view looked cut off at the road's side.
  Measured: the canvas is the full viewport with **no clipping anywhere in its ancestor chain** — the framing is the
  cockpit's own pillars, which is roughly a real windscreen. Pulling them back means less car in frame. Your call.
  (NH-10.)
- **The cluster/wheel ratio drifts** 0.281 → 0.227 from wide to tall-narrow viewports, because the wheel scales with
  its column while the gauge caps. Making it constant changes cockpit proportions at every desktop size. (NH-11.)
- **Both dash toggles are 29×31px** — clears WCAG 2.5.8 AA (24×24), under the 44px comfort target. It is the
  existing pattern, so enlarging one means enlarging both, in a control row with zero slack. (S142.)
- **`/drive` now has an in-page "reduce motion" control**, because `prefers-reduced-motion` was honoured but only
  the OS could ask. It defaults to your system setting, so **nothing changed for anyone who does not press it**, and
  it is not persisted. Mentioned here only so a new button on your dash is not a surprise. (S141 — done, not a
  decision.)

---

## What the loop did, in one line

**All work is on `feat/drive-mode`; nothing has been pushed, merged or deployed.** Exactly **nine** source files
touched across the whole run, every one inside `src/components/drive/**` or `src/styles/drive.module.css`:

`Dashboard.jsx` · `DriveScene.jsx` · `ExitSign.jsx` · `RoadCanvas.jsx` · `route.js` · `StopCard.jsx` ·
`useDrive.js` · `world.js` · `drive.module.css`

**Zero diff to `src/content`, `src/components/sections` and `src/lib`** — your content was never touched, and your
own pre-existing uncommitted edits are exactly as the run found them.

That count is of **committed** work. Two files also carry **uncommitted** changes the loop did not write — see §7.

Verify any of that yourself:

```
git diff --name-only 6c19c99..HEAD -- src/          # the nine files
git diff --numstat -- src/content src/lib           # empty
```

_(Deliberately no commit count here — it only goes stale. The commands above are always current.)_
