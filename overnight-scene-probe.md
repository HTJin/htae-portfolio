# Drive-scene probe — the check that would have caught tonight's regressions

**Why this file exists.** Two fixes in this run regressed silently and were found only because the owner kept
reporting them: the gore opening in the shoulder barrier (fixed, lost to an unrelated edit, re-fixed) and the
inboard bank's planting (buried by the highway's side polygon). Nothing in the repo would have caught either. This
is the probe, with every trap that cost time tonight encoded in it.

Run it in the browser console on the drive page after any change to `RoadCanvas.jsx`.

## Before you measure anything: check what is actually being served

Three stale servers faked results tonight. A port answering `200` is not a server running your code.

```
source = (Get-Item src\components\drive\RoadCanvas.jsx).LastWriteTime
build  = (Get-Item .next\build-manifest.json).LastWriteTime
server = (Get-Process -Id <pid on the port>).StartTime
```

`source <= build <= server`, or the measurement is meaningless.

## The rules the probe encodes

1. **Alpha, not colour.** The sky is a DOM layer *behind* a transparent canvas, so `alpha > 0` means "scene" and
   `alpha === 0` means "hole". Three cycles of colour-matching walked past a hole one alpha read found instantly.
2. **Fixed horizon, never a detected one.** A detector that takes "the first opaque pixel down a column" moves when
   the scene changes. It moved 317 → 294 when the cut wall landed and twice nearly condemned correct code.
3. **Every invariant carries a control that must come out different.** A probe returning zero and a broken probe are
   the same reading. The sky control must find transparency; the opaque control must find scene.
4. **Never match a source colour.** Flowers are drawn at `alpha 0.85` and composite to something else entirely;
   matching `rgba(226,170,196)` finds nothing while the flowers are plainly on screen.
5. **Sample the transition, not the endpoints.** Park-and-shoot missed everything that mattered; frame strips keyed
   on `drop` found it.
6. **Accumulate into page state, not the return value.** A three-leg sweep exceeded the 45s CDP budget and the call
   errored — every row survived because it had been pushed to `window.__rows`.

## Setup

```js
const c = document.querySelector('canvas')
const fk = Object.keys(c).find(x => x.startsWith('__reactFiber$'))
let fb = c[fk], drive = null, hop = 0
while (fb && hop < 80) { if (fb.memoizedProps && fb.memoizedProps.drive) { drive = fb.memoizedProps.drive; break } fb = fb.return; hop++ }
if (!drive) throw new Error('probe aborted: sim unreachable')   // fail loud, never silently pass
const g = c.getContext('2d', { willReadFrequently: true })
const K = c.width / 1568
const HZ = 330                                                   // FIXED (rule 2)
const A = (x, y) => g.getImageData(Math.round(x*K), Math.round(y*K), 1, 1).data[3]
```

## I1 — no void below the horizon (strong)

The road must never be see-through. 1813 samples per state.

```js
const I1 = () => {
  let holes = 0, checked = 0
  for (let x = 60; x <= 1500; x += 30) for (let y = HZ; y <= 620; y += 8) { checked++; if (A(x, y) === 0) holes++ }
  let sky = 0, skyN = 0
  for (let x = 60; x <= 1500; x += 30) for (let y = 90; y <= 150; y += 8) { skyN++; if (A(x, y) === 0) sky++ }
  return { holes, checked, skyControlPct: +(100*sky/skyN).toFixed(0) }   // sky must be high, or the probe is dead
}
```

**Pass:** `holes === 0` at every state **and** `skyControlPct > 80`.

## I3 — both faces of the cut are planted (weak — read the caveat)

```js
const I3 = () => {
  const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width
  let L = 0, R = 0, opaque = 0
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < W; x += 2) {
    const i = (y*W + x)*4, r = d[i], gg = d[i+1], bb = d[i+2], a = d[i+3]
    if (a < 200) continue
    opaque++
    if (bb > gg + 12 && r > gg + 20 && r > 120) { if (x/W < 0.5) L++; else R++ }
  }
  return { flowersLeft: L, flowersRight: R, opaqueControl: opaque }
}
```

> **Caveat, stated because a weak check presented as strong is worse than none.** Flower pixel counts are tiny —
> 0 to 12 in the states below — because only one tuft in five carries a flower. That is enough to prove planting
> renders, and **not** enough to distinguish "planting regressed" from "few flowers in frame". Evaluate it only at a
> **fully parked stop** (`drop <= -5.45`), and treat a drop to zero on a side that previously had flowers as the
> signal, not the absolute count.

## I2 — the gore opening (needs an instrumented build)

Cannot be measured from the composited frame: the barrier shares its colour with the ramp's edge lines and rumble
strips, which *grow* as the ramp separates — counting "bright pixels near the shoulder" reports the barrier present
while it is absent. Use the **magenta technique**: temporarily set the barrier's `railRuns` fill to `'#ff00ff'`,
rebuild, then count magenta across the crossing window. No palette colour is magenta, so every hit is the barrier.

Expected (measured `38d3b6a`): full before the crossing, **zero through it**, full after.

| ramp | barrier px | | ramp | barrier px |
| --- | --- | --- | --- | --- |
| 0.7m | 45587 | | 6.1m | 2236 |
| 1.1m | 44819 | | 7.1m | 48220 |
| 2.1m | **0** | | 8.0m | 58967 |
| 3.1m | **0** | | 9.1m | 41019 |

**Revert the probe colour and `grep -c ff00ff` before committing.**

## Baseline — current build (cycle 110)

| state | void | sky control | flowers L / R |
| --- | --- | --- | --- |
| mainline | 0 / 1813 | 100% | 0 / 0 |
| gore r≈3.6 | 0 / 1813 | 100% | 0 / 0 |
| descent −1.84 | 0 / 1813 | 100% | 0 / 0 |
| descent −3.82 | 0 / 1813 | 100% | 0 / 6 |
| stop −5.32 | 0 / 1813 | 99% | 2 / 3 |

Flowers are legitimately absent on the mainline and at the gore: planting is gated on `drop > -0.35`, so there is no
bank to plant on there.
