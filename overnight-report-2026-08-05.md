# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 4 · branch `feat/drive-mode` · 9 commits, nothing pushed

---

## ⚠️ One thing for you — a real SEO bug I'm not allowed to fix

**`/drive` ships two `<link rel="canonical">` tags, and the first one points at your homepage.** Measured straight out
of the served HTML:

```html
<link rel="canonical" href="https://htae.dev"/>        <!-- _app.jsx:69 -->
<link rel="canonical" href="https://htae.dev/drive"/>  <!-- drive.jsx:17 -->
```

`og:url` and `og:title` are duplicated the same way. A crawler that takes the first canonical is told drive mode is a
duplicate of your homepage and drops it from the index; a social scraper that takes the first `og:title` previews a
shared drive link as the homepage — which defeats the `?exit=` deep links entirely.

The cause is that `next/head` only deduplicates tags carrying a matching `key`, and neither side sets one. The fix is
six lines, but it belongs in `_app.jsx`, which is outside what this run is allowed to edit — so I've written the exact
patch into the **Needs human** section of `overnight-tasks-2026-08-05.md` rather than touching it. I deliberately did
*not* add a key to `drive.jsx` alone: without the `_app` side it changes nothing and would have looked fixed.

Verify after applying: `curl -s http://localhost:3007/drive | grep -c 'rel="canonical"'` should print `1`.

---

## Good news on the date bug

Cycle 3 found that a January 1st date was reporting the previous year, which had put your StarPlus UI/UX role in 2023.
The obvious worry was that your **main résumé page** had the same fault. It doesn't. `FormattedDate.jsx` already pins
`timeZone: 'UTC'`, which is exactly the right defence — I proved it by running that exact formatter config against all
ten of your content dates in a timezone behind UTC, where it renders "Jan 2024" correctly while the buggy pattern
returns 2023 in the same process. All eight date call sites in `src/` were checked individually. The drive page was the
only one affected, and it's fixed.

---

## Cycle 4 — the version of your résumé that machines read

Chrome still can't reach the dev server (that's unchanged from cycle 3 — see below), so this cycle deliberately took on
work that `curl` can prove rather than shipping more canvas work blind.

**The crawlable itinerary now carries the years and a real structure.** The `sr-only` block in drive mode is the only
version of this résumé a search engine or a screen reader can actually consume — everything else is a canvas and a
cockpit. It used to be a flat run of headings with no dates, so "Web Developer" had nothing placing it in time. Now
stops are grouped under their leg with a proper hierarchy (route → leg → stop), and every stop with a date carries its
year in a `<time>` element. Verified by reading the HTML back: six leg headings, 21 stop headings, and exactly ten years
— `2016 2017 2019 2020 2023 2023 2023 2024 2024 2025` — matching your education and nine roles. The eleven stops with no
date in your content carry no year at all.

---

## Still blocked (not a fault in the site)

Chrome returns `chrome-error://chromewebdata/` for the dev server while `curl` on the identical URL returns the page.
Re-checked at the top of this cycle, as I will every cycle. Nothing about the site is broken; Chrome's networking is
isolated from the shell's, and I can't change that from here without touching your browser or proxy settings.

**Parked because of it:** the visual pass on cycle 3's roadside work (guardrail seams, lamp thinning). Its *logic* is
already proven by server-side probe, build and lint — only the pixels are unseen. I've also kept the mile-markers and
weather ideas in the backlog rather than shipping more canvas I can't look at.

If you want that unblocked, a Chrome window that can load `http://localhost:3007/drive` is all it takes.

---

## Queued next

Structured data for `/drive` (blocked behind the canonical fix above); mile markers between exits; weather and oncoming
headlights; resuming where a visitor left off; opt-in engine audio. Full reasoning in
`overnight-suggestions-2026-08-05.md`, every idea with a checkbox.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-tasks-2026-08-05.md` | Source of truth: phase/cycle, guardrails, task states — **and the canonical patch** |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

Dev server is on **http://localhost:3007**. Nothing has been pushed; everything is local commits on `feat/drive-mode`.
