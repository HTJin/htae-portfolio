# Overnight report — through Cycle 4

**Branch:** `update/stellix-prep`, pushed to `origin`. **Nothing deployed.**
**Role:** Enterprise Solutions Engineer III at **Stellix** (Syncade / life-sciences cGMP MES), director round with **Stephen Britton**.

---

## ⚠ Two things need you, and one is time-critical

**1. None of this work is live.** Measured against the real htae.dev, not assumed:

| On live htae.dev right now | |
|---|---|
| "How I work" | **0 occurrences** |
| "Off the résumé" | **0 occurrences** |
| `Remote \| Remote` bug | **still there** |
| `aria-label` count | **1** (branch has 18) |
| Invisible section headings | **still invisible** |

Four cycles of fixes exist only on the branch. A director opening your site today sees none of it and still sees the defects. Deploying is prohibited by this run's guardrails — correctly, because publishing to your live site is your call. But it is the single action that converts all of this into something anyone can see.

**2. The interview may be TODAY.** The machine clock read **Tuesday, 4 August 2026, 01:29 AM**. Your Cursor thread says *"next up is tuesday at 1pm with the director"* — and **4 August is a Tuesday**. In session you said "tomorrow" (Wednesday the 5th). Both are your words; they conflict. Earlier files asserted the 5th as fact and that assertion has been **withdrawn**. If it is Tuesday 1pm, the deploy decision and the GitHub bio are due this morning.

---

## Shipped

**Cycle 1** — "How I work" (six practice cards, each naming the `experience.js` bullet it derives from); "Off the résumé" (your own approved narrative); **section headings that were invisible on every desktop screen** — `SectionIntro` painted its title at `x: 0` under the fixed sidebar, so Experience, Projects and Education had no visible heading at all.

**Cycle 2** — `3FGolf | Remote | Remote` (location and workMode are both "Remote" and the join didn't dedupe); **17 links with no accessible name** — every project's GitHub and live-site icon plus the logo, announced by screen readers as bare URLs.

**Cycle 3** — audit only, nothing built, deliberately. Closed three unknowns: **mobile verified at 390px** (a gap open two cycles — `resize_window` silently fails on a maximised window, so verification went through a same-origin iframe, which carries its own viewport); **`resume.pdf` verified current** (5,445 chars parsed, title and all eight role dates match the site); **all outbound links resolve** (LinkedIn's 999 identified as anti-automation, not reported as a dead link).

**Cycle 4** — **the heading outline, unparked and fixed.** Cycle 2 shelved this as needing a visual decision. That framing was wrong: `entry.lead` is a *date range*, and a date is not a heading — so the fix was never a level change, the element simply shouldn't be a heading. Now a `<p>` reproducing the `h4` rules.

Proven rather than claimed: computed styles captured before and after showed **zero diffs across all ten properties**. Verified in dark *and* light (the date's colour equals the company heading's in both). Verified at 390px. Heading skips **9 → 0**; zero `<h4>` in the production HTML.

`npm run build` passes clean throughout.

---

## Still needs you

- **Deploy decision** (above) — the highest-leverage item in the run.
- **Confirm the interview date** (above).
- **GitHub bio still reads "Software Engineer at StarPlus Energy."** Open since Cycle 1. ~30 seconds, and a director will click that link.
- **S14 — 16 MB of project screenshots** in the repo, largest ~2 MB. Explicitly *not* reported as a performance defect: `next/image` serves resized WebP, and the real transfer size was never measured. Measure before touching anything.

## What was deliberately not done

No Syncade / cGMP / IQ-OQ-PQ / VBS keywords anywhere. No new employers, dates, metrics or scale claims. No edits to the tagline, role, header or section order. Every sentence added traces to an existing `experience.js` bullet or to your own words — the six "How I work" cards each name their source, so the lot is auditable in about a minute.

One false pass was caught and discarded rather than reported: a mobile probe returned `innerWidth: 0` on an unloaded iframe, which would have shown "0 heading skips" from an empty document. It was re-run properly.
