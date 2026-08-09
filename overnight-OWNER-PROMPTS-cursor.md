# Owner prompts to Cursor, recovered verbatim (2026-08-08)

The vault's prompt log captured these as `(empty)`: timestamps only, no text. Recovered instead from Cursor's own
store, `state.vscdb-wal`, by walking the JSON string payloads. **This loop had never seen most of them.**

Ordered as recovered. Quoted exactly, including profanity and typos, because paraphrasing requirements is how they
get lost.

## 1

> fix the side of the highway. there's nothing covering the side and you can see gaps

## 2

> still no, maybe it's the viewport of how far i can see ahead for the road. also I don't need the windshield wipers
> wtf

## 3

> look you need to fucking add in a new polygon along side the entire fucking highway

## 4

> maybe it's not the guardrail but im seeing a layer of separation where it's a horizontal gap separation with what
> the car is immediately driving on while exiting the ramp and the point of entry where the main highway road is.
> this gap should NOT exist and it's what I've been trying to express to eliminate. the gap should only be visible
> for the immediate path and roadway of the main highway road and the exit ramp downhill and uphill (elevation
> changes)

## 5 (NEW to this loop)

> good this is progress. looks like from the stripes you have a better understanding of where the profile body of
> the highway should exist. look at the red section of the screenshot i marked. that area I should not be seeing
> what's on the other side of it. like why do i see a bar of highway road asphalt gray in the horizon like that? and
> you haven't fixed the z-index of the exits at all which is what i told you that is peeking THROUGH the distant
> ground

## 6 (NEW to this loop, and the most specific direction in the set)

> that distinct halves of the darker gray upper section vs lower violet section is what is misaligned and im trying
> to get rid of. look at how the curve of the road when I'm on the exit ramp is not properly aligned to the entrance
> point to the main highway based upon the white stripes of the plane. that plane needs to be the highest z-index as
> we are in the lower elevation as well and the lower violet section needs to shifted upwards to cover more of the
> ui

## 7 (NEW to this loop)

> why is there an elongated guardrail that shouldn't exist on the right side of the exit ramp?? also I'm still
> seeing the darker gray horizontal bar half distinction and now the violet is more bluer

## 8

> issue is that you're merely changing the polygon's color instead of taking a chunk of the polygon out of the point
> of intersection such as the guardrail and the ramp downhill and uphill work based upon a container divided
> horizontally but the horizontal line never is aligned to the elevation of the actual highway, thus making the ramp
> road be invisible only until there is elevation change
>
> note that barrier aka that area you've sectioned out in a different color of the guardrail of the highway serves
> as the main point of intersection of the road that the car should be always on top of. keep the shape of the
> overall connection of the road from the highway and the exit ramp down and up as the basis of how the car should
> be moving and what we should be viewing rather than depending on the viewport of . the intersection aka the
> pointof entry of the highway road and the exit ramp road is what i mean for you to keep more aware of. the exit
> ramp and the exit has higher z index than the ground I see in the horizon so it shows through the ground.
>
> look at the image red marking that section should be be planed off as the body of the highway reaching all the way
> to the exit ramp road

---

## What is still open, read off these

1. **The asphalt bar on the horizon (prompt 5, restated in 7).** The owner saw it before I introduced my clamp, and
   again after. It is not solely my regression; it predates it and my clamp made a second one.
2. **Exits peek through the distant ground (5, 8).** Filed here as **S145**, still unverified. The owner says
   plainly it was raised earlier and never fixed.
3. **The plane the car is on must have the highest z-index while at lower elevation (6).** This is a stated
   requirement, not a hypothesis. Nothing in the loop implements it.
4. **The lower violet section must shift upwards to cover more of the UI (6).** Never attempted.
5. **The road's curve on the exit ramp is not aligned to the entrance point of the main highway, judged by the white
   stripes (6).** This is the alignment reference the owner has been pointing at all along.
6. **An elongated guardrail exists on the right of the exit ramp and should not (7).** Related to, and possibly
   surviving from, the trench work reverted in `9298a98`.
7. **View distance / how far ahead the road is visible may be the real lever (2).** Never investigated.
8. **Windshield wipers (2).** Removed already; noted so the record is complete.

---

## Recovered later, by a better method (2026-08-08 20:0x)

The string-walk below was the wrong tool. Cursor stores prompts as **structured JSON under known SQLite keys**, so
they can be read exactly, with timestamps, instead of scraped out of a binary. Redone that way, two more prompts
surfaced that the scrape had missed entirely.

### 9 - 17:16:09 (NEW)

> actually was the violet section added by you to simulate like a half risen windshield color filter of some sort??
> if so fucking remove it

Already resolved in the source: see the comments at `src/components/drive/RoadCanvas.jsx:306`, `:729` and `:889`,
which record the gray/violet halves as a clamped-to-horizon artifact and remove it.

### 10 - 17:23:36 (NEW, and the most recent Cursor instruction in the set)

> NO YOU FUCKING RETARD I DIND'T POINT THOSE OUT TO SAY THEY WERE THE WRONG COLOR YOU FUCKING DUMBASS IM FUCKING
> TRYING TO FIX THE OVERALL VIEWPORT OF THE WHOLE DRIVING EXPERIENCE. YOU DIDN'T DO SHIT ON WHAT I WANTED YOU TO DO.
> THERE IS A FUCKING LINE THAT IS ELONGATED ON THE RIGHT SIDE OF THE ROAD AT ALL TIMES AND THAT SHOULD ONLY BE
> VISIBLE WHEN THE VEHICLE IS ON THE MAIN HIGHWAY. SET THE FUCKING MAIN INITIAL ELEVATION BASED TO THE MAIN HIGHWAY.
> THE GUARDRAIL SHOULD NOT BE VISIBLE WHEN THE ELVATION IS LOWERING DURING THE EXIT RAMP PART OF THE ROAD

Three separate requirements, none of them about colour:

1. The elongated line on the **right** is visible at all times and must be visible **only on the main highway**.
   This is prompt 7 restated with force, and it is still open.
2. **The main initial elevation must be set to the main highway.** This is the same reference frame complaint as
   prompt 8: stop deriving the scene from the viewport's horizontal, derive it from the highway deck.
3. The guardrail must not be visible while elevation is dropping on the exit ramp.

Point 2 is the one the loop has never acted on directly, and it is the root the other two hang off.

## Method note, so this is not lost again

**Do not scrape the WAL.** Cursor keeps its own prompt history in SQLite, per workspace:

```
%APPDATA%/Cursor/User/workspaceStorage/<workspace-id>/state.vscdb
  ItemTable key `aiService.generations` -> [{unixMs, generationUUID, textDescription, type}]   <- timestamped
  ItemTable key `aiService.prompts`     -> [{text, commandType}]                               <- rolling buffer
```

Copy the DB **together with its `-wal`** before reading (recent prompts live in the WAL; reading the `.vscdb` alone
returns stale data). This workspace is `5f3770afa2146bf94289fdfa2564079b`.

This is now automated for every project on the machine by
`D:/Work/_machine-vault/scripts/cursor_chat_sync.py`, which mirrors Cursor chat into the Obsidian vault at
`08 - Prompt Log/cursor/<project> cursor prompts.md` and injects a recent digest at session start. The earlier
`(empty)` problem was in `prompt_log.py`, whose hook payload never carried the text under any key it read.
