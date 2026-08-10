/**
 * st023 acceptance controls for per-stop ramp lengths.
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-lengths.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LEG_LENGTH,
  RAMP_FRAC_MAX,
  RAMP_FRAC_MIN,
  RAMP_LENGTH,
  RAMP_LENGTH_SEED,
  RAMP_OFFSET,
  attachRampLengths,
  enforceMainlineGap,
  rampAt,
  rampLengthAt,
  rampLengths,
  rampProgress,
  route,
} from '../src/components/drive/route.js'

const LEG = 420
const midProgress = 0.5 // distance = length/2 → smoothstep(0.5)
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

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

// Mid-ramp at stop 1: progress matches that stop's length (not global RAMP_LENGTH).
const stopIndex = 1
const stopS = stopIndex * LEG
const len = rampLengthAt(stopIndex)
const midS = stopS - len / 2
const midP = rampProgress(midS)
const expectedMid = smoothstep(midProgress)

// Open mainline mid-leg between 1 and 2
const openS = stopS + LEG / 2
const openP = rampProgress(openS)

// Control: two seeds differ at same stop index
const seedDiffers = lengthsA[stopIndex] !== lengthsB[stopIndex]

// Same seed replay matches module table
const sameSeedReplay = lengthsA.every((v, i) => v === rampLengths[i])

// Lateral offset untouched (st024 out of scope)
const offsetFrozen = RAMP_OFFSET === 8.2 + 22

// Real structural control: geometry sources must not call Math.random()
const routeSrc = fs.readFileSync(
  path.join(root, 'src/components/drive/route.js'),
  'utf8',
)
const rngSrc = fs.readFileSync(
  path.join(root, 'src/components/drive/rng.js'),
  'utf8',
)
const noMathRandomInLengths =
  !/\bMath\.random\s*\(/.test(routeSrc) && !/\bMath\.random\s*\(/.test(rngSrc)

const checks = {
  legFrozen: LEG_LENGTH === LEG,
  rampLengthCeiling: RAMP_LENGTH === LEG * RAMP_FRAC_MAX,
  tableSize: rampLengths.length === route.length,
  bandOk,
  pairGapOk,
  clampFiresOnForcedPair: clampFires,
  seedDiffers,
  sameSeedReplay,
  midRampMatchesLength: Math.abs(midP - expectedMid) < 1e-9,
  openMainlineZero: openP === 0,
  offsetFrozen,
  noMathRandomInLengths,
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)

console.log(
  JSON.stringify(
    {
      RAMP_LENGTH_SEED,
      stopIndex,
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
console.log('PASS st023 ramp-length controls')
