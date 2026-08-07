# Action required — one page

Everything below is waiting on **you**. The loop verified each item by running it, and cannot proceed on any of them
alone: they are either outside its write scope, or judgement calls it declined to make for you.

The full history is in `overnight-report-2026-08-05.md` and the ledgers beside it. This file exists because those
have grown past the point where the actionable parts are findable.

_Last confirmed: cycle 75, 2026-08-07. All file/line references re-verified in cycle 73._

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

## 4. Four measurements this environment genuinely cannot take

Each is seconds of work with DevTools open, and each is currently an unknown rather than a pass:

| What                        | How                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cold page weight**        | Network tab → _Disable cache_ → reload `/drive`. Last real figure was 208 KB in cycle 42, before the ramp geometry, embankment and two-lane road.          |
| **Forced-colors rendering** | Rendering tab → _Emulate CSS media feature forced-colors: active_. The pedals were fixed for this in cycle 64 by inventory, but the render was never seen. |
| **The printed page**        | Ctrl+P on `/drive`. Print styling was added in cycle 67 and its rules verified, but the paper was never observed.                                          |
| **Frame rate**              | Any real profiler. Unmeasurable here since cycle 52 — a blank page benchmarks the same as the drive.                                                       |

## 5. One preference

**The legs are now 14.1 seconds each** — about **4.7 minutes** to drive the whole route on the accelerator, up from
~3.1 min when this run started. That is the direct result of your "I want the ride to the next exit a bit longer".
`Next` still autopilots. Say the word if you want it pulled back.

## 6. Three toolchain warnings, all out of scope

- **`SideNav.jsx:38:6` — `useCallback` missing dependency `sections`.** The only one with real bug potential; a
  stale closure would act on outdated data.
- **`next.config.mjs`** enables experimental `scrollRestoration` — outside semver, so an upgrade can drop it.
- **`tailwind.config.js`** safelists `/^apexcharts-.*$/`, which matches no classes. Dead config that makes every
  build print a warning, which is how people learn to ignore build warnings.

---

## What the loop did, in one line

**All work is on `feat/drive-mode`; nothing has been pushed, merged or deployed.** Exactly **nine** source files
touched across the whole run, every one inside `src/components/drive/**` or `src/styles/drive.module.css`:

`Dashboard.jsx` · `DriveScene.jsx` · `ExitSign.jsx` · `RoadCanvas.jsx` · `route.js` · `StopCard.jsx` ·
`useDrive.js` · `world.js` · `drive.module.css`

**Zero diff to `src/content`, `src/components/sections` and `src/lib`** — your content was never touched, and your
own pre-existing uncommitted edits are exactly as the run found them.

Verify any of that yourself:

```
git diff --name-only 6c19c99..HEAD -- src/          # the nine files
git diff --numstat -- src/content src/lib           # empty
```

_(Deliberately no commit count here — it only goes stale. The commands above are always current.)_
