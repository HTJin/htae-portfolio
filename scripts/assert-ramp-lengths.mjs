/**
 * st023 acceptance controls for per-stop ramp lengths (coder-2 alt structure).
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-lengths.mjs
 *
 * Controls (each has a must-differ counterpart):
 *   - seed A vs seed A^salt → lengths at same index differ
 *   - mid-ramp at stop.s - length/2 → progress ≈ smoothstep(0.5)
 *   - open mid-leg → progress === 0
 *   - fraction band Q042 [0.25, 0.40] of LEG_LENGTH
 *   - pairwise gap open (may be dormant under ceiling; still asserted)
 */
import {
  LEG_LENGTH,
  RAMP_FRAC_MAX,
  RAMP_FRAC_MIN,
  RAMP_LENGTH,
  RAMP_LENGTH_SEED,
  RAMP_OFFSET,
  attachRampLengths,
  enforceMainlineGap,
  legLengthFor,
  rampAt,
  rampLengthAt,
  rampLengths,
  rampProgress,
  route,
} from '../src/components/drive/route.js'

const LEG = 420
const STOP = 1

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

const lengthsA = attachRampLengths(route.length, LEG, RAMP_LENGTH_SEED)
const lengthsB = attachRampLengths(
  route.length,
  LEG,
  RAMP_LENGTH_SEED ^ 0xabcdef,
)

// Forced oversize pair → clamp must shrink (control that clamp is not dead code)
const forced = enforceMainlineGap([LEG * 0.6, LEG * 0.6], LEG)
const clampFires = forced[0] + forced[1] < LEG

const pairGapOk = rampLengths.every((len, i) => {
  if (i >= rampLengths.length - 1) return true
  return len + rampLengths[i + 1] < LEG
})

const bandOk = rampLengths.every(
  (len) =>
    len >= LEG * RAMP_FRAC_MIN - 1e-9 && len <= LEG * RAMP_FRAC_MAX + 1e-9,
)

const stopS = STOP * LEG
const len = rampLengthAt(STOP)
const midS = stopS - len / 2
const midP = rampProgress(midS)
const expectedMid = smoothstep(0.5)

const openS = stopS + LEG / 2
const openP = rampProgress(openS)

const checks = {
  legFrozen: LEG_LENGTH === LEG,
  legLengthForMatches: legLengthFor(STOP) === LEG,
  rampLengthCeiling: RAMP_LENGTH === LEG * RAMP_FRAC_MAX,
  tableSize: rampLengths.length === route.length,
  bandOk,
  pairGapOk,
  clampFiresOnForcedPair: clampFires,
  seedDiffers: lengthsA[STOP] !== lengthsB[STOP],
  sameSeedReplay: lengthsA.every((v, i) => v === rampLengths[i]),
  midRampMatchesLength: Math.abs(midP - expectedMid) < 1e-9,
  openMainlineZero: openP === 0,
  offsetFrozen: RAMP_OFFSET === 8.2 + 22,
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)

console.log(
  JSON.stringify(
    {
      RAMP_LENGTH_SEED,
      STOP,
      len,
      midS,
      midP,
      expectedMid,
      openS,
      openP,
      forced,
      lengthsSample: rampLengths.slice(0, 5),
      controlSeedSample: lengthsB.slice(0, 5),
      rampAtStop: rampAt(stopS),
      checks,
    },
    null,
    2,
  ),
)

if (failed.length) {
  console.error(
    'FAIL',
    failed.map(([k]) => k),
  )
  process.exit(1)
}
console.log('PASS st023 ramp-length controls (coder-2)')
