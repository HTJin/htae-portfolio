# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 10 · branch `feat/drive-mode` · 19 commits, nothing pushed

---

## ⭐ Read this one first: your priority (c) is only half-fixed

You asked for three things. The third was *"the projects sections the photos just get cut off and then the cycling
through photos should just happen automatically with smooth fade transition to the next screenshot."*

I fixed that in **drive mode** in cycle 1. Tonight I went back and checked the **main portfolio page** — the one most
visitors actually see — and it still has **both** faults:

- **Every screenshot is cropped.** `src/components/Projects.jsx` puts them in a 16:9 frame with `object-cover`. I
  computed it against your actual files rather than eyeballing: **all 28 screenshots** are wider than 16:9, so
  **10.1% of each image's width is thrown away** on average — 14.2% at worst. Both edges of every shot are cut off.
- **They only advance if you click them.** There is no timer anywhere in that file. A visitor who doesn't think to
  click the picture sees screenshot 1 of up to 5, and never learns there are more.

It's a small patch — the same two moves that fixed drive mode, and the fade you asked for comes free because
`AnimatePresence` is already wrapping the image. The **exact patch** is starred at the top of the Needs-human section
of `overnight-tasks-2026-08-05.md`.

I didn't apply it: that file is outside this run's scope (which you scoped to drive mode), and you have your own
uncommitted edits in that area right now.

---

## Also still waiting on you — the two SEO issues

They **compound**: drive mode is invisible to search from both directions at once.

1. **`/drive` ships two `<link rel="canonical">` tags and the first points at your homepage.**
2. **`/drive` is not in your sitemap.**

Exact patches and one-line verification commands are in the same Needs-human section.

---

## Cycle 10 — the route map was lying about being a modal

The exit list declares itself `role="dialog" aria-modal="true"`, which tells assistive technology that everything
behind it is inert. Nothing enforced that. Measured with the map open: **23 tabbable elements inside it, and focus was
still outside**. A keyboard user pressed "Route map" and was left tabbing through the cockpit underneath an overlay
they couldn't see past; a screen-reader user was told a modal opened while their focus sat behind it.

Now focus moves into the panel on open (the panel itself, so the dialog's label is read before its contents), Tab and
Shift+Tab cycle within it, and Escape still closes it — the trap only ever intercepts Tab, so the global driving keys
are untouched.

Verified by reading `document.activeElement` at each step rather than assuming: focus lands inside, Tab from the last
item wraps to the first, Shift+Tab from the first wraps to the last, Escape closes.

One honest gap: **focus returning to the button on close** runs, but I can't observe it here — `.focus()` doesn't stick
without a real foreground window, so there's nothing meaningful to restore to. It's parked rather than claimed.

---

## Where the drive stands

Your three original asks shipped in cycle 1 (and (c) is now flagged above for the classic site). The nine cycles since
went into the standing brief:

a driver's-POV cockpit with working instruments · an arrival panel with auto-cycling full-bleed screenshots ·
dusk-to-dawn light that advances with your career · real interstate guide signs · per-leg roadside character ·
a trip computer counting the actual years · deep links to any exit · oncoming traffic · mile markers ·
resume-where-you-left-off · opt-in engine sound · and a route map that's now properly keyboard-accessible.

---

## Parked, all needing a foreground browser window

Frame rate while driving; audible engine output; and focus-restore on closing the route map. All three need a Chrome
window that's actually in front — animation and focus are both suspended in a backgrounded tab, which isn't something
I can arrange from here.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-tasks-2026-08-05.md` | Source of truth — **and all three Needs-human patches** |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

A production build is served on **http://localhost:3008** — use that rather than `npm run dev`, which has repeatedly
served pages that never come alive. Nothing has been pushed; everything is local commits on `feat/drive-mode`.
