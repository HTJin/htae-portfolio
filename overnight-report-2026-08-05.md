# Overnight report — 2026-08-05

Rolling summary, rewritten at the end of every cycle. **The loop is still running** — it does not stop on its own.
Stop it by telling me to end the run (that cancels the recurring relief task).

**Last updated:** end of cycle 1 · branch `feat/drive-mode` · commits `8883aaa`, `646b717`

---

## ⚠️ One thing needs you (30 seconds)

**Bring the Chrome window to the front and leave it visible.** As of 21:00 ET every tab reports
`document.visibilityState === 'hidden'`, which means Chrome has unrendered them — screenshots come back solid black and
every element measures 0×0. That is environmental, not a bug: the dev server returns 200, `npm run build` compiles and
`next lint` is clean, and the same pages rendered correctly minutes earlier in the same session. Until Chrome is
foregrounded the loop can still build, lint and reason about code, but it cannot *see* the site, so the remaining
visual checks stay parked. Everything else can run unattended.

Also worth keeping true overnight: computer awake (no sleep), Claude app open, dev server alive on
**http://localhost:3001** (port 3000 was already taken by something of yours).

---

## Shipped and verified (cycle 1)

All three things you asked for are done and were seen working in a real browser before the window went dark.

**1. Project photos no longer get cut off, and they cycle themselves.**
The captures were being squeezed into a ~7rem strip with `object-cover`, so only the top quarter of each one showed —
and only ever the *first* screenshot, because the route only carried `screenshots[0]`. Now every project carries all
its captures. I measured all 28 PNGs on disk first: they are all almost exactly 2:1, so they now sit in a 2:1 frame
with `object-contain` and you see the whole page. They cross-fade every 4.2 seconds, with dots to jump, hover to
pause, and a static fallback for reduced-motion visitors. Verified live: EXIT 11 stepped 4/4 → 1/4 → 2/4 → 3/4 on its
own, EXIT 12 reached 5/5.

**2. The arrival panel is rebuilt.**
It now opens with a green interstate exit shield, the leg name and a position counter, and on wide screens it splits
into screenshot-left / text-right so the two stop fighting for the same column. It projects up from the dash rather
than fading in place. It also no longer renders over the rear-view mirror, which it did before.

**3. The cockpit reads as a real car from the driver's seat.**
This was the big one. The old dash had the steering wheel at ~33% of the screen width while the road's vanishing point
was at 50% — the wheel simply wasn't in front of the driver — and the gauges floated beside it rather than behind it.
Now: the wheel sits on the driver's axis with a **hooded instrument binnacle behind it**, so you read the cluster over
the top of the rim the way you actually do in a car. Added the car's **bonnet** at the base of the glass, a lit **cowl
lip** where the dash meets the windshield, moulded dash grain, **slatted air vents**, and the dash smeared back at you
by the glass.

The developer identity is in the details rather than pasted on top:
- **tell-tales that actually mean something** — the turn arrows follow your steering, `CRUISE` lights when autopilot is
  driving you to the next exit, `BRAKE` follows the brake — plus one amber `{ }` lamp that is not from any car and
  stays lit as long as the engine is running.
- **the centre screen is a terminal**: `~/route $ drive --to`, green on black, counting down the miles to the next exit.
- **PRND** with the live gear, an `HT` horn boss, and ribbed pedal pads tilted into a footwell instead of flat buttons.

**Phones get their own cockpit.** The side-by-side dash overflowed badly at 390px — the cluster ran off the left edge
and PRND rendered on top of the screen. Small widths now get a stacked layout: cluster strip across the cowl, terminal
under it, then Back / Next / Map and both pedals in one thumb-reachable row. Verified at 386×840 with no horizontal
overflow.

**Two real bugs found and fixed while building**, both the kind that would have quietly stayed wrong:
- the per-frame `style.transform` that rotates the wheel was overwriting Tailwind's centring translate, throwing the
  wheel ~180px off its own axis;
- a `display: flex` in the CSS module out-ordered Tailwind's `.hidden`, so vents meant to be desktop-only leaked onto
  the phone layout.

---

## Parked

**Needs testing** (the loop will clear these itself once Chrome is visible)
- Title clamping at 390px — the two-line clamp compiles and applies, but a probe resolved to `display: flow-root`
  rather than `-webkit-box`, which would defeat it. Needs one look at EXIT 11's long title on a phone width.
- The reduced-motion path through the carousel — written, never exercised.
- A hydration check on a cold load of `/drive` — console tracking was only attached mid-session.

**Awaiting scenario**
- All remaining browser verification, until Chrome is foregrounded (see the box at the top).

**Needs human** — nothing. **Blocked** — nothing.

---

## Queued for the next cycles

Ranked roughly by payoff: time-of-day lighting that advances along the route (dawn at MILE 0 → night at the
destination, so the drive visibly passes time as it passes years); a realism pass on the exit signage; deep-links to a
specific exit so you can send a recruiter straight to one role; resuming where a visitor left off; and opt-in ambient
audio tied to engine revs. Full detail, with why each was suggested, is in
`overnight-suggestions-2026-08-05.md` — every idea has a checkbox for you to sign off.

---

## Where to look

| File | What it holds |
| --- | --- |
| `overnight-suggestions-2026-08-05.md` | Every idea, its source, and what happened to it — with checkboxes |
| `overnight-tasks-2026-08-05.md` | Source of truth: phase/cycle, guardrails, task states |
| `overnight-log-2026-08-05.md` | Blow-by-blow, including both bugs and the two environment gotchas |
| `overnight-journal-2026-08-05.md` | One line per task, with its commit |

Nothing has been pushed; everything is local commits on `feat/drive-mode`.
