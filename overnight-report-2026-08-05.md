# Overnight report

**Branch:** `feat/drive-mode` · **Cycle:** 152 (Planner) · **Rewritten:** 2026-08-08, end of cycle 151

---

## Read this first

Two things this run got wrong are worth more than anything it got right.

**1. It was reading half the conversation.** The owner instructs Cursor and Claude Code against the same repo,
often within the same hour, and the loop only ever saw its own channel. The vault's prompt log had been recording
every Cursor prompt as `(empty)` since it was built: the hook fires, but its payload does not carry the text under
any key the logger reads. So the vault recorded **that** the owner spoke and lost **what he said**.

Fixed at the source. `D:/Work/_machine-vault/scripts/cursor_chat_sync.py` ignores the hook and reads Cursor's own
store (`aiService.generations`, timestamped). **716 prompts recovered across 16 projects**, retroactively, and a
12h digest is now injected at every session start. Several owner instructions had never reached this loop.

**2. It fixed a z-order bug by painting something opaque over it.** Commit `20a5e9d` added a second `highwayBody`
pass after the roadside furniture. `highwayBody` only draws while `camDrop < -0.15`, which is only on the ramp, so
a solid `#0c0e12` face landed over the mainline at exactly the elevation the owner was looking from. He got two
complaints out of that one commit. Reverted in `d0931ae`.

That move works in a compositor and is nearly always wrong in a depth-sorted scene. The loop reached for it because
the correct fix needed a measurement it had already failed to take.

---

## Shipped in cycle 151

| commit    | what                                                                |
| --------- | ------------------------------------------------------------------- |
| `d20456c` | Removed the scenic-overlook guardrail that ran across the exit ramp |
| `20a5e9d` | (regression, see above)                                             |
| `5641969` | Recovered two unseen owner prompts via Cursor's SQLite store        |
| `37dcc74` | **T151-1 verified**: the horizontal division is the ground plate    |
| `d0931ae` | Reverted the black face; the mainline keeps its own guardrail       |
| `c24c6d8` | Cycle close-out                                                     |

### The one measurement that matters

The owner has described the same defect three times in three vocabularies. It is now a number:

- Strongest full-width horizontal edge at **y = 832**, with **480 of 480 columns on that exact row** (fraction 1.000)
- `RoadCanvas.jsx:732` paints `fillRect(0, horizon - 6, ...)`, predicting **830.9** - about 1px off
- `world.js:101` defines `horizon = height * 0.44`, with **no elevation term**, so it cannot track the highway

Control, from the same run: topmost painted row per column was 474 / 796 / 824, differing by hundreds of pixels, so
the detector plainly does not call everything flat.

**Not shipped, deliberately.** Filed as **S152**. Changing the scene's base occlusion surface while the harness
that verifies it wedges the sim is how the clamp and the trench both happened. That is the third time this run has
been asked to choose between shipping fast and shipping proven; this time it chose proven.

---

## Owner complaints, current status

| #   | complaint                                                         | status                                 |
| --- | ----------------------------------------------------------------- | -------------------------------------- |
| 1   | Guardrail vanishes from the right of the **main highway** on exit | Fixed `d0931ae`, browser-unverified    |
| 2   | Main highway invisible at lowered elevation                       | Fixed `d0931ae`, browser-unverified    |
| 3   | Sunset band should not be there at lowered elevation              | **Open**, cause measured (S152)        |
| 4   | Plane replaced with solid black; wanted the **pathing** corrected | Black reverted; **pathing still open** |

Complaint 4's real ask - correcting how the exit ramp paths back onto the main highway - has still not been
addressed. It is the oldest outstanding item and it should lead cycle 152.

---

## Process changes that outlast this run

- **Cursor and Claude Code are one conversation.** Written into `~/.claude/CLAUDE.md` and the always-on Cursor rule.
- **Four-role pipeline** (Architect -> Coder -> Tester -> Manager), charters in `09 - Agents/`, driven by
  `agent_intake.py`, with every request recorded as one intake note so a cold session reads a conclusion rather
  than a transcript. Invoked as workflow `wknw370xe`.
- **Instrument discipline:** port 3008 was a stale server whose CSS 404s, caught only because a screenshot looked
  wrong. Check the running server, not just the build timestamp.

---

## Needs the owner

1. Down on the ramp, should the embankment **occlude the sky** on the highway side, or should sky stay visible?
2. Is hazing the ground toward the sky colour at distance acceptable, or does that count as invented atmosphere?
3. Standing decisions still parked: NH-10 (windscreen aperture), NH-11 (cluster/wheel ratio), S107 (wheel over
   brake pedal), S137 (font subsetting), S142 (touch target size).
