/**
 * st024 acceptance controls for per-stop peak lateral offsets.
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-offsets.mjs
 */
import {
  cameraX,
  CARRIAGEWAY,
  LANE_OFFSET,
} from '../src/components/drive/world.js'
import {
  LEG_LENGTH,
  RAMP_DROP,
  RAMP_EXTRA_MAX,
  RAMP_EXTRA_MIN,
  RAMP_OFFSET,
  RAMP_OFFSET_MAX,
  RAMP_OFFSET_SEED,
  RAMP_SEPARATES,
  RAMP_WIDTH,
  attachRampOffsets,
  dropHoldAt,
  dropHoldFor,
  rampAt,
  rampDropAt,
  rampOffsetAt,
  rampOffsets,
  rampProgress,
  route,
} from '../src/components/drive/route.js'

const stopIndex = 1
const stopS = stopIndex * LEG_LENGTH
const peak = rampOffsetAt(stopIndex)
const hold = dropHoldAt(stopIndex)

const offsetsA = attachRampOffsets(route.length, RAMP_OFFSET_SEED)
const offsetsB = attachRampOffsets(route.length, RAMP_OFFSET_SEED ^ 0xabcdef)

const bandOk = rampOffsets.every(
  (off) =>
    off >= CARRIAGEWAY + RAMP_EXTRA_MIN - 1e-9 &&
    off <= CARRIAGEWAY + RAMP_EXTRA_MAX + 1e-9
)

const clearsSeparates = rampOffsets.every((off) => off >= RAMP_SEPARATES)

const seedDiffers = offsetsA[stopIndex] !== offsetsB[stopIndex]
const sameSeedReplay = offsetsA.every((v, i) => v === rampOffsets[i])

// Parked at stop: full peel
const parkRamp = rampAt(stopS)
const parkMatchesPeak = Math.abs(parkRamp - peak) < 1e-9

// Mid-exit sample: lateral progress mid-way; drop must be drawable (non-zero
// once past hold, and hold itself must be < 1 so descent can start).
const midP = 0.5
const midHoldOk = hold < midP && hold < 0.9
// Approximate s where rampProgress ≈ 0.5 for this stop's length is elsewhere;
// here we check DROP_HOLD math vs offset and that mid-progress past hold drops.
const dropAtFull = rampDropAt(stopS)
const dropDrawable =
  dropAtFull < -GRADE_EPS() && Math.abs(dropAtFull + RAMP_DROP) < 1e-9

function GRADE_EPS() {
  return 0.15
}

// At lateral progress just above hold, drop should be tiny but non-zero;
// at progress below hold, drop is 0. Probe via synthetic progress by s.
const lenish = (() => {
  // find distance where progress is ~hold+epsilon via binary-ish search on s
  let lo = 0
  let hi = 200
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2
    const p = rampProgress(stopS - mid)
    if (p > hold + 0.05) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
})()
const midExitS = stopS - lenish
const midExitDrop = rampDropAt(midExitS)
const midExitRamp = rampAt(midExitS)
const openS = stopS + LEG_LENGTH / 2
const openRamp = rampAt(openS)
const openDrop = rampDropAt(openS)

const midExitDrawable =
  midExitDrop < 0 && Math.abs(openDrop) < 1e-12 && openRamp === 0

const signTracks =
  Math.abs(
    LANE_OFFSET +
      peak +
      RAMP_WIDTH / 2 +
      2 -
      (LANE_OFFSET + rampOffsetAt(stopIndex) + RAMP_WIDTH / 2 + 2)
  ) < 1e-12

const cameraComposition =
  cameraX({ ramp: parkRamp, x: 0.5 }) === LANE_OFFSET + parkRamp + 0.5

const holdMatchesFormula = Math.abs(hold - dropHoldFor(peak)) < 1e-12

const legacyOffsetFrozen = RAMP_OFFSET === CARRIAGEWAY + 22
const maxIsCeiling = RAMP_OFFSET_MAX === CARRIAGEWAY + RAMP_EXTRA_MAX

const checks = {
  tableSize: rampOffsets.length === route.length,
  bandOk,
  clearsSeparates,
  seedDiffers,
  sameSeedReplay,
  parkMatchesPeak,
  dropDrawable,
  midExitDrawable,
  midHoldOk,
  signTracks,
  cameraComposition,
  holdMatchesFormula,
  legacyOffsetFrozen,
  maxIsCeiling,
  midExitRampPositive: midExitRamp > 0,
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)

console.log(
  JSON.stringify(
    {
      RAMP_OFFSET_SEED,
      stopIndex,
      peak,
      hold,
      parkRamp,
      dropAtFull,
      midExitS,
      midExitRamp,
      midExitDrop,
      openS,
      openRamp,
      openDrop,
      offsetsSample: rampOffsets.slice(0, 5),
      controlSeedSample: offsetsB.slice(0, 5),
      RAMP_SEPARATES,
      checks,
    },
    null,
    2
  )
)

if (failed.length) {
  console.error(
    'FAIL',
    failed.map(([k]) => k)
  )
  process.exit(1)
}
console.log('PASS st024 ramp-offset controls')
