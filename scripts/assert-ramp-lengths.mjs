/**
 * Acceptance probe for cr015 coder-2 (st023 only).
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-lengths.mjs
 */
import {
  LEG_LENGTH,
  RAMP_DROP,
  RAMP_LENGTH,
  RAMP_LENGTH_FRAC_MAX,
  RAMP_LENGTH_FRAC_MIN,
  RAMP_LENGTH_SEED,
  RAMP_MAINLINE_GAP_MIN,
  RAMP_OFFSET,
  RAMP_WIDTH,
  buildRampLengthTable,
  legLengthFor,
  rampAt,
  rampLengthFor,
  rampLengths,
  rampProgressAt,
  route,
  routeLength,
} from '../src/components/drive/route.js'
import { hashSeed } from '../src/components/drive/rng.js'

const LEG = 420
const midLeg = (i) => i * LEG + LEG / 2

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

const seedB = RAMP_LENGTH_SEED ^ 0xdeadbeef
const lengthsB = buildRampLengthTable(route.length, seedB, legLengthFor)

const pairwiseGaps = []
for (let i = 0; i < rampLengths.length - 1; i += 1) {
  const leg = legLengthFor(i + 1)
  pairwiseGaps.push(leg - rampLengths[i] - rampLengths[i + 1])
}

const midRampSamples = route.map((stop, i) => {
  const len = rampLengths[i]
  const s = stop.s + len * 0.5
  const expected = smoothstep(1 - 0.5)
  const got = rampProgressAt(s)
  return { i, len, s, got, expected, ok: Math.abs(got - expected) < 1e-9 }
})

const checks = {
  legLengthFrozen: LEG_LENGTH === LEG,
  rampLengthBandTop: RAMP_LENGTH === LEG * RAMP_LENGTH_FRAC_MAX,
  rampDropFrozen: RAMP_DROP === 5.5,
  rampOffsetFrozen: RAMP_OFFSET === 8.2 + 22,
  rampWidthFrozen: RAMP_WIDTH === 4.4,
  stopSMultiples: route.every((stop, i) => stop.s === i * LEG),
  routeLengthWorld: routeLength === (route.length - 1) * LEG,
  tableLen: rampLengths.length === route.length,
  noStopDecoration: route.every((stop) => !('rampLength' in stop)),
  fracBand: rampLengths.every((len) => {
    const frac = len / LEG
    return (
      frac >= RAMP_LENGTH_FRAC_MIN - 1e-9 && frac <= RAMP_LENGTH_FRAC_MAX + 1e-9
    )
  }),
  halfLeg: rampLengths.every((len) => 2 * len < LEG),
  pairwiseMainline: pairwiseGaps.every(
    (g) => g >= RAMP_MAINLINE_GAP_MIN - 1e-9,
  ),
  sameSeedReplay:
    JSON.stringify(buildRampLengthTable(route.length, RAMP_LENGTH_SEED)) ===
    JSON.stringify(rampLengths),
  differentSeedDiffers:
    JSON.stringify(lengthsB) !== JSON.stringify(rampLengths),
  seedMatchesHash:
    RAMP_LENGTH_SEED ===
    hashSeed(`${route.map((s) => s.id).join('|')}|ramp-length`),
  rampLengthForMatches: route.every(
    (_, i) => rampLengthFor(i) === rampLengths[i],
  ),
  openMainlineProgress: route.slice(0, -1).every((_, i) => {
    const p = rampProgressAt(midLeg(i))
    return p === 0 || Math.abs(p) < 1e-12
  }),
  midRampMatchesLength: midRampSamples.every((s) => s.ok),
  parkAtStop: route.every(
    (stop) => Math.abs(rampProgressAt(stop.s) - 1) < 1e-12,
  ),
  peakRampAtUsesOffset: Math.abs(rampAt(route[1].s) - RAMP_OFFSET) < 1e-9,
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)
console.log(
  JSON.stringify(
    {
      RAMP_LENGTH_SEED,
      routeStops: route.length,
      rampLengths,
      lengthsB,
      pairwiseGaps,
      midRampSamples: midRampSamples.map(({ i, len, got, expected, ok }) => ({
        i,
        len,
        got,
        expected,
        ok,
      })),
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
console.log('PASS live ramp-length exports (st023)')
