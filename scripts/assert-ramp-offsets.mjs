/**
 * st024 acceptance controls for per-stop peak lateral offsets.
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-offsets.mjs
 *
 * Band asserts use literal 12 and 28 plus imported CARRIAGEWAY, never the
 * constants under test. A ceiling of 99 must FAIL extraInBand.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashSeed, mulberry32 } from '../src/components/drive/rng.js'
import { LANE_OFFSET } from '../src/components/drive/world.js'
import {
  BANK_TOP_OFFSET,
  CARRIAGEWAY,
  LEG_LENGTH,
  RAMP_DROP,
  RAMP_FRAC_MAX,
  RAMP_FRAC_MIN,
  RAMP_OFFSET,
  RAMP_OFFSET_MAX,
  RAMP_SEPARATES,
  RAMP_WIDTH,
  descentGradeAt,
  dropHoldAt,
  dropHoldFor,
  rampAt,
  rampExtraForId,
  rampLengthAt,
  rampLengths,
  rampOffsetAt,
  rampOffsets,
  rampProgress,
  route,
} from '../src/components/drive/route.js'

const here = dirname(fileURLToPath(import.meta.url))
const routeSrc = readFileSync(
  join(here, '../src/components/drive/route.js'),
  'utf8'
)
const exitSrc = readFileSync(
  join(here, '../src/components/drive/ExitSign.jsx'),
  'utf8'
)

const extras = rampOffsets.map((off) => off - CARRIAGEWAY)
const n = extras.length

function mean(xs) {
  return xs.reduce((sum, x) => sum + x, 0) / xs.length
}

function sampleSd(xs) {
  const m = mean(xs)
  const acc = xs.reduce((sum, x) => sum + (x - m) * (x - m), 0)
  return Math.sqrt(acc / (xs.length - 1))
}

function pearson(xs, ys) {
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < xs.length; i += 1) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  return num / Math.sqrt(dx * dy)
}

function sequentialExtras(ids, lo, hi) {
  const next = mulberry32(hashSeed(`drive:ramp-offset:${ids.join('|')}`) >>> 0)
  return ids.map(() => lo + next() * (hi - lo))
}

function bankClearance(peak, hold) {
  const nearEdge = LANE_OFFSET + hold * peak - RAMP_WIDTH / 2
  return nearEdge - BANK_TOP_OFFSET
}

function signX(index) {
  return LANE_OFFSET + rampOffsetAt(index) + RAMP_WIDTH / 2 + 2
}

const extraInBand = extras.every((e) => e >= 12 - 1e-12 && e <= 28 + 1e-12)
const distinct = new Set(extras.map((e) => e.toPrecision(12))).size
const sd = sampleSd(extras)
const constantExtras = route.map(() => RAMP_OFFSET - CARRIAGEWAY)
const constantDistinct = new Set(constantExtras).size
const constantSd = sampleSd(constantExtras)
const constantInBand = constantExtras.every((e) => e >= 12 && e <= 28)

const ids = route.map((stop) => stop.id)
const extrasIfCeiling99 = ids.map((id) => {
  const next = mulberry32(hashSeed('drive:ramp-offset:' + id))
  return 12 + next() * (99 - 12)
})
const ceiling99WouldFail = extrasIfCeiling99.some((e) => e > 28 + 1e-12)
const insertedIds = [
  ...ids.slice(0, 3),
  'synthetic-insert-st024',
  ...ids.slice(3),
]
const keyedBefore = ids.map((id) => rampExtraForId(id))
const keyedAfterById = Object.fromEntries(
  insertedIds.map((id) => [id, rampExtraForId(id)])
)
const keyedUnchanged = ids.filter(
  (id, i) => keyedBefore[i] === keyedAfterById[id]
).length
const seqBefore = sequentialExtras(ids, 12, 28)
const seqAfterById = (() => {
  const table = sequentialExtras(insertedIds, 12, 28)
  return Object.fromEntries(insertedIds.map((id, i) => [id, table[i]]))
})()
const seqUnchanged = ids.filter(
  (id, i) => seqBefore[i] === seqAfterById[id]
).length

const replay = ids.map((id) => rampExtraForId(id))
const replayMatch = keyedBefore.every((e, i) => e === replay[i]) ? n : 0
const mutatedIds = ids.map((id) => `${id}~mut`)
const mutatedTable = mutatedIds.map((id) => rampExtraForId(id))
const mutatedDiffers = mutatedTable.filter(
  (e, i) => e !== keyedBefore[i]
).length
const saltedTable = ids.map((id) => {
  const next = mulberry32(hashSeed('drive:ramp-offset-salt:' + id))
  return 12 + next() * (28 - 12)
})
const saltedDiffers = saltedTable.filter((e, i) => e !== keyedBefore[i]).length

const liveHolds = route.map((_, i) => dropHoldAt(i))
const liveClearances = route.map((_, i) =>
  bankClearance(rampOffsetAt(i), liveHolds[i])
)
const liveClearanceOk = liveClearances.every((c) => Math.abs(c - 1.2) < 1e-9)

const frozenHold = dropHoldFor(RAMP_OFFSET)
const survivorSeqOffsets = sequentialExtras(ids, 12, 35).map(
  (extra) => CARRIAGEWAY + extra
)
const frozenClearances = survivorSeqOffsets.map((peak) =>
  bankClearance(peak, frozenHold)
)
const frozenBreaches = frozenClearances.filter((c) => c < 1.2 - 1e-6)
const frozenWorst = Math.min(...frozenClearances)

const todayBaseline = RAMP_DROP / ((1 - frozenHold) * Math.min(...rampLengths))
const deliveredGrades = route.map((_, i) => descentGradeAt(i))
const deliveredMax = Math.max(...deliveredGrades)
const bandFloorPeak = CARRIAGEWAY + 12
const bandTail =
  RAMP_DROP / ((1 - dropHoldFor(bandFloorPeak)) * (LEG_LENGTH * RAMP_FRAC_MIN))

const r = pearson(extras, rampLengths)
const sameSaltU = ids.map((id) =>
  mulberry32(hashSeed('drive:ramp-offset:' + id))()
)
const sameSaltExtras = sameSaltU.map((u) => 12 + u * (28 - 12))
const sameSaltLens = sameSaltU.map(
  (u) => LEG_LENGTH * (RAMP_FRAC_MIN + u * (RAMP_FRAC_MAX - RAMP_FRAC_MIN))
)
const rSameSalt = pearson(sameSaltExtras, sameSaltLens)

const iNarrow = extras.indexOf(Math.min(...extras))
const iWide = extras.indexOf(Math.max(...extras))
const signNarrow = signX(iNarrow)
const signWide = signX(iWide)
const signAtBandMax = LANE_OFFSET + RAMP_OFFSET_MAX + RAMP_WIDTH / 2 + 2

const midIndex = 1
const midLen = rampLengthAt(midIndex)
const midS = midIndex * LEG_LENGTH - midLen / 2
const midProgress = rampProgress(midS)
const parkProgress = rampProgress(midIndex * LEG_LENGTH)
const openProgress = rampProgress(midIndex * LEG_LENGTH + LEG_LENGTH / 2)

const noMathRandom = !routeSrc.includes('Math.random(')
const keyedDraw = routeSrc.includes("'drive:ramp-offset:' + id")
const noJoinedOffsetSeed = !routeSrc.includes('drive:ramp-offset:${')
const noDropHoldConst = !/\b(?:export\s+)?const\s+DROP_HOLD\b/.test(routeSrc)
const extraMaxNot35 = !routeSrc.includes('RAMP_EXTRA_MAX = 35')
const signUsesIndex = exitSrc.includes('rampOffsetAt(stop.index)')
const signNoFallback = !exitSrc.includes('??')

const checks = {
  carriagewayPinned: CARRIAGEWAY === 8.2,
  extraInBand,
  ceiling99WouldFail,
  tableSize: rampOffsets.length === route.length,
  distinctEnough: distinct >= 18,
  sdWideEnough: sd > 3,
  roadNoLongerFrozen: new Set(rampOffsets).size > 1,
  legacyConstantPinned: RAMP_OFFSET === CARRIAGEWAY + 22,
  constantWouldPassBand: constantInBand,
  constantWouldFailVariance: !(constantDistinct >= 18 && constantSd > 3),
  insertKeepsExisting: keyedUnchanged === n,
  sequentialInsertMovesAll: seqUnchanged === 0,
  replayIdentical: replayMatch === n,
  mutatedIdsDiffer: mutatedDiffers === n,
  saltedSeedDiffers: saltedDiffers === n,
  bankTopClearance: liveClearanceOk,
  frozenHoldBreachesFive: frozenBreaches.length === 5,
  frozenHoldWorst: Math.abs(frozenWorst + 1.383) < 0.01,
  gradeUnderBound: deliveredMax < 0.095 && bandTail < 0.095,
  uncorrelated: Math.abs(r) < 0.433,
  sameSaltPerfect: Math.abs(rSameSalt - 1) < 1e-12,
  signNarrowWideDiffer: signNarrow !== signWide,
  bandMaxWouldCollide:
    signAtBandMax !== signNarrow || signAtBandMax !== signWide,
  halfLegSlack: LEG_LENGTH * RAMP_FRAC_MAX < LEG_LENGTH / 2,
  fracMax06WouldFire: !(LEG_LENGTH * 0.6 < LEG_LENGTH / 2),
  midRampInBand: midProgress > 0.3 && midProgress < 0.7,
  parkedIsEndpoint: parkProgress === 1,
  openIsEndpoint: openProgress === 0,
  parkMatchesPeak:
    Math.abs(rampAt(midIndex * LEG_LENGTH) - rampOffsetAt(midIndex)) < 1e-12,
  clearsSeparates: rampOffsets.every((off) => off >= RAMP_SEPARATES),
  holdMatchesFormula: liveHolds.every(
    (h, i) => Math.abs(h - dropHoldFor(rampOffsetAt(i))) < 1e-12
  ),
  noMathRandom,
  keyedDraw,
  noJoinedOffsetSeed,
  noDropHoldConst,
  extraMaxNot35,
  signUsesIndex,
  signNoFallback,
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)

console.log(
  JSON.stringify(
    {
      extras,
      distinct,
      sd,
      keyedUnchanged,
      seqUnchanged,
      r,
      rSameSalt,
      todayBaseline,
      deliveredMax,
      bandTail,
      liveClearances,
      frozenBreaches: frozenBreaches.length,
      frozenWorst,
      signNarrow,
      signWide,
      midProgress,
      parkProgress,
      openProgress,
      controlKeyCount: Object.keys(checks).length,
      controlKeys: Object.keys(checks),
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
