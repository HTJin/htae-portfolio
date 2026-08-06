# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 3 · branch `feat/drive-mode` · 7 commits, nothing pushed

---

## One thing worth knowing (nothing to do right now)

**Chrome can no longer reach the dev server, so I've stopped verifying pixels.** From about 21:05 the browser returns
`ERR_CONNECTION_REFUSED` for the dev server while `curl` on the identical URL returns the page perfectly — and
`localhost:3001` in Chrome renders one of *your* other apps ("Virsh.shop — Operator Console") even though this
project's server owns that port. Moving my server to a clean port (3007) didn't help. Chrome's networking is proxied or
isolated away from the shell's; it isn't a fault in the site, and I can't fix it from here without changing your
browser or proxy settings.

I did **not** stop. I switched to verifying through the channels that still work — the build, the linter, Node, and
**SSR probes** (temporarily rendering a value into the page, reading it with `curl`, then reverting). That technique
proved both of this cycle's tasks and caught a real bug. But the *visual* pass on the roadside work is parked until the
browser can reach the server again. If you want that unblocked, the simplest fix is a Chrome window that can load
`http://localhost:3007/drive`.

One reading I threw away rather than reporting: a check briefly returned a result that looked like a defect, but the
page title showed Chrome was serving your Virsh.shop console, not this app. Wrong document, worthless reading.

---

## Cycle 3 — the dash now tells you *when* you are

**The trip computer reads in years.** The road is your résumé, but the only quantity on the dash was distance. Now the
hero number beside the odometer is the year: **2016** at Pittsburgh, counting up through the nine roles to **2025** at
StarPlus, then simply **`NOW`** for the side builds, the toolbox and the destination. It ticks over *between* exits, so
crossing the sabbatical visibly takes you through 2021 and 2022 — the gap years are something you drive through rather
than skip.

Projects, the toolbox and the destination have no dates in your content, so they never get a year. `NOW` is honest and,
as it happens, reads better than a number would.

**Verifying that found a real bug in your dates.** The probe showed four stops reporting 2023 when only three of your
roles are from 2023. The cause: `new Date('2024-01-01').getFullYear()` parses the string as UTC midnight and then reads
it back in local time, so in any timezone behind UTC a **January 1st date reports the previous year**. Your StarPlus
UI/UX role — whose own label reads "Jan 2024 – Oct 2024" — was being computed as **2023**. Fixed by reading the year
straight off the string. Worth noting this is the kind of bug that ships silently; nothing crashes, a number is just
quietly wrong on your CV.

I've queued a follow-up to check whether the **classic site** formats those same dates the same way. If it does, the
year is wrong there too — and that page matters more. That check is read-only from this run, since the classic sections
are outside what I'm allowed to edit, so if it's confirmed I'll hand it to you with the evidence rather than touching it.

**Each leg of the road now looks different.** Every mile used to carry identical lamps and delineators, so you couldn't
tell the school zone from the scenic overlook without reading a sign. Now the scenic overlook has a **guardrail** along
the verge and a thinner lamp line, as a road with a drop beside it would — and the **sabbatical stretch thins the lights
out further**, because it really was a quiet piece of road. The logic is proven; the pixels are the thing I can't
currently see.

---

## Parked

**Needs testing** — one item: the visual pass on the roadside work (guardrail seams, lamp thinning, nothing popping as
you approach it). Everything about its *logic* is already proven by server-side probe, build and lint.

**Awaiting scenario** — pixel-level browser verification generally, until Chrome can reach the dev server.

**Blocked** — nothing. **Needs human** — nothing yet (the classic-site date audit may become one).

I also pulled the mile-markers task back to the backlog rather than shipping it. Adding more canvas work I can't look at
is how seams get missed.

---

## Queued next

Check the classic site for that same date bug; mile markers between exits; weather and oncoming headlights so the road
feels inhabited; resuming where a visitor left off; and opt-in engine audio. Full reasoning in
`overnight-suggestions-2026-08-05.md`, every idea with a checkbox.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-tasks-2026-08-05.md` | Source of truth: phase/cycle, guardrails, task states |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including every fault and environment gotcha |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

Dev server is on **http://localhost:3007** now (3001 was returning your other app in Chrome). Nothing has been pushed;
everything is local commits on `feat/drive-mode`.
