/**
 * Measured harness for st071 option-lane commit (cr100001 retarget).
 * Run: bun src/components/drive/optionLane.verify.mjs
 *
 * Imports route.js (needs Bun/@ alias) for the live rampLengthAt table.
 */
import {
  PASS_LATERAL_MAX,
  COMMIT_OPEN,
  COMMIT_TAKE,
  COMMIT_PASS,
  DISPOSITION_PASSED,
  DISPOSITION_TAKEN,
  DISPOSITION_UNSET,
  resolveCommit,
  assistAllowed,
  resolveGore,
} from './optionLane.js'
import { RAMP_LENGTH, rampLengthAt, rampLengths } from './route.js'

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('OK:', msg)
  }
}

assert(DISPOSITION_PASSED === 'passed', "decline token is 'passed' (Q064)")
assert(DISPOSITION_TAKEN === 'taken', "arrive token is 'taken'")
assert(DISPOSITION_UNSET === 'unset', "open token is 'unset'")

const table = rampLengths.map((length, index) => ({ index, length }))
const shortest = table.reduce((a, b) => (a.length <= b.length ? a : b))
const longest = table.reduce((a, b) => (a.length >= b.length ? a : b))
const maxLen = Math.max(...rampLengths)

assert(
  RAMP_LENGTH >= maxLen,
  `RAMP_LENGTH (${RAMP_LENGTH}) >= max(rampLengthAt)=${maxLen}`,
)

console.log(
  'rampLengthAt table:',
  table.map(({ index, length }) => `${index}:${length.toFixed(2)}`).join(' '),
)
console.log(
  `shortest i=${shortest.index} len=${shortest.length.toFixed(2)}; longest i=${longest.index} len=${longest.length.toFixed(2)}`,
)

const midLong = longest.length / 2

assert(
  resolveCommit(
    { commit: COMMIT_OPEN, brake: 1, throttle: 0, x: 0, autopilot: false },
    { remaining: midLong, lastStop: false, commitWindow: longest.length },
  ) === COMMIT_TAKE,
  'T1 brake -> take',
)
assert(assistAllowed(COMMIT_TAKE) === true, 'T1 assist allowed on take')

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: PASS_LATERAL_MAX,
      autopilot: false,
    },
    { remaining: midLong, lastStop: false, commitWindow: longest.length },
  ) === COMMIT_PASS,
  'T2 stay-left+throttle -> pass',
)
assert(assistAllowed(COMMIT_PASS) === false, 'T2 assist suppressed on pass')

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: PASS_LATERAL_MAX + 0.01,
      autopilot: false,
    },
    { remaining: midLong, lastStop: false, commitWindow: longest.length },
  ) === COMMIT_TAKE,
  'rightward past PASS_LATERAL_MAX -> take',
)

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: false,
    },
    { remaining: midLong, lastStop: true, commitWindow: longest.length },
  ) === COMMIT_OPEN,
  'T4 last stop stays open (cannot lock pass)',
)
assert(
  resolveGore(COMMIT_PASS, { lastStop: true }) === COMMIT_TAKE,
  'T4 last-stop gore forces take even if pass leaked',
)

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: true,
    },
    { remaining: midLong, lastStop: false, commitWindow: longest.length },
  ) === COMMIT_TAKE,
  'T5 autopilot -> take',
)

assert(
  resolveGore(COMMIT_OPEN, { lastStop: false }) === COMMIT_TAKE,
  'unresolved open at gore -> take',
)
assert(
  resolveGore(COMMIT_PASS, { lastStop: false }) === COMMIT_PASS,
  'pass at gore stays pass',
)

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: false,
    },
    {
      remaining: longest.length + 1,
      lastStop: false,
      commitWindow: longest.length,
    },
  ) === COMMIT_OPEN,
  'outside commit window stays open',
)

assert(
  resolveCommit(
    {
      commit: COMMIT_PASS,
      brake: 1,
      throttle: 0,
      x: 2,
      autopilot: true,
    },
    { remaining: midLong, lastStop: false, commitWindow: longest.length },
  ) === COMMIT_PASS,
  'locked pass does not flip on later brake',
)

// Per-stop window (Q778): remaining = shortest + 5 is outside the short stop
// and inside the long stop.
const probe = shortest.length + 5
assert(
  probe > shortest.length,
  `probe ${probe} is past shortest window ${shortest.length}`,
)
assert(
  probe <= longest.length,
  `probe ${probe} is inside longest window ${longest.length}`,
)

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: false,
    },
    {
      remaining: probe,
      lastStop: false,
      commitWindow: rampLengthAt(shortest.index),
    },
  ) === COMMIT_OPEN,
  `short-stop i=${shortest.index} at remaining=shortest+5 stays open`,
)

assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: false,
    },
    {
      remaining: probe,
      lastStop: false,
      commitWindow: rampLengthAt(longest.index),
    },
  ) === COMMIT_PASS,
  `long-stop i=${longest.index} at remaining=shortest+5 locks pass`,
)

let threw = false
try {
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: false,
    },
    { remaining: midLong, lastStop: false },
  )
} catch {
  threw = true
}
assert(threw, 'missing commitWindow throws (no default)')

console.log(
  `constants: PASS_LATERAL_MAX=${PASS_LATERAL_MAX} RAMP_LENGTH=${RAMP_LENGTH} decline=${DISPOSITION_PASSED}`,
)
if (process.exitCode) {
  console.error('optionLane.verify FAILED')
  process.exit(1)
}
console.log('optionLane.verify PASSED')
