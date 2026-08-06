# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 5 · branch `feat/drive-mode` · 11 commits, nothing pushed

---

## ⚠️ Two things for you — both out of my reach, both about being findable

These compound. Drive mode is currently invisible to search **from both directions at once**, and fixing only one of
them will not surface it.

**1. `/drive` ships two `<link rel="canonical">` tags and the first points at your homepage.** So the copy that *is*
reachable disowns itself.

```html
<link rel="canonical" href="https://htae.dev"/>        <!-- _app.jsx:69 -->
<link rel="canonical" href="https://htae.dev/drive"/>  <!-- drive.jsx:17 -->
```

`og:url` and `og:title` duplicate the same way, so sharing a drive-mode link previews as your homepage — which defeats
the `?exit=` deep links.

**2. `/drive` is not in your sitemap.** `public/sitemap.xml` lists only `https://htae.dev/`, and `robots.txt` points
crawlers at that file. So the page is never advertised in the first place.

Both fixes are a handful of lines, and both live in files this run isn't allowed to edit (`_app.jsx` and
`public/sitemap.xml`). The **exact patches** and one-line verification commands are in the **Needs human** section of
`overnight-tasks-2026-08-05.md`. I deliberately didn't half-fix the canonical from `drive.jsx` alone — without the
`_app` side it changes nothing and would have looked fixed.

---

## Cycle 5 — the cockpit is now usable without eyes

The backlog had run dry of anything I could verify without a browser, so the loop did what it's designed to do and
generated fresh work: an audit of the one surface still available to me, the served HTML. It found three real defects.

**Drive mode was close to unusable with a screen reader.** Measured, not guessed: **none of the 11 buttons had an
accessible name** — "Next ▸" announced as "Next right-pointing small triangle", the accelerator as "GO up-arrow slash
W". Meanwhile the *decorative* instruments were all being read aloud: `x1000 0 mph P R N D gear ~/route $ drive --to yr
2016 odo 0.0 mi`, which is noise, and which badly duplicated content the hidden itinerary already presents properly.

Now every control has a real name that keeps the word you can see — "Back to the previous exit", "Drive on to the next
exit", "Open the route map", "Brake", "Go — hold to accelerate" — so voice control still works on what's visible. The
gauges, gear selector and trip-computer screen are out of the accessibility tree: a speedometer tells you nothing if
you can't see the road. Verified from the HTML: 10 of 11 buttons labelled (the 11th is "Start engine", which already
names itself), `aria-hidden` up from 12 to 19, and the itinerary still fully exposed with all ten years.

**`/drive` was also serving two `<h1>`s** — the itinerary's and the ignition splash's — competing to describe the page.
The splash is now an `<h2>`; exactly one `<h1>` is served.

---

## Still blocked, and one false alarm

Chrome still can't reach the dev server (third cycle) — `curl` serves the page, the browser gets
`chrome-error://chromewebdata/`. Nothing about the site is broken; Chrome's networking is isolated from the shell's.
The visual pass on cycle 3's roadside work stays parked, and I'm still keeping the mile-markers and weather ideas in the
backlog rather than shipping canvas I can't look at. A Chrome window that can load `http://localhost:3007/drive`
unblocks all of it.

Mid-cycle the dev server hung and `/drive` stopped responding — which looked exactly like I'd broken something. Instead
of assuming, I killed the server and ran the linter and a full production build, both independent of it: clean, and
`/drive` compiled fine. It was the `.next` cache again. That's the third distinct way that cache has faked a defect
tonight.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-tasks-2026-08-05.md` | Source of truth — **and both Needs-human patches** |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

Dev server is on **http://localhost:3007**. Nothing has been pushed; everything is local commits on `feat/drive-mode`.
