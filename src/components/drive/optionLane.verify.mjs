/**
 * Measured harness for st071 option-lane commit (coder-2 alt path, cr100001).
 * Run: bun src/components/drive/optionLane.verify.mjs
 *
 * Loads route.js so the live rampLengthAt table drives the window cases (Q778).
 * Alternate to a fixed 168 literal: missing commitWindow must throw.
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
import { RAMP_LENGTH, rampLengthAt, route } from './route.js'

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('OK:', msg)
  }
}

const table = route.map((_, i) => rampLengthAt(i))
const shortest = Math.min(...table)
const longest = Math.max(...table)
const shortIdx = table.indexOf(shortest)
const longIdx = table.indexOf(longest)
const midLong = longest / 2
const probe = shortest + 5

assert(
  DISPOSITION_PASSED === 'passed',
  "DISPOSITION_PASSED token is 'passed' (Q064/Q336)",
)
assert(
  DISPOSITION_TAKEN === 'taken' && DISPOSITION_UNSET === 'unset',
  'taken/unset tokens unchanged',
)
assert(
  RAMP_LENGTH >= longest,
  `RAMP_LENGTH (${RAMP_LENGTH}) >= max(rampLengthAt)=${longest}`,
)

let threw = false
try {
  resolveCommit(
    { commit: COMMIT_OPEN, brake: 0, throttle: 1, x: 0, autopilot: false },
    { remaining: midLong, lastStop: false },
  )
} catch {
  threw = true
}
assert(threw, 'missing commitWindow throws (no default)')

assert(
  resolveCommit(
    { commit: COMMIT_OPEN, brake: 1, throttle: 0, x: 0, autopilot: false },
    { remaining: midLong, lastStop: false, commitWindow: longest },
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
    { remaining: midLong, lastStop: false, commitWindow: longest },
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
    { remaining: midLong, lastStop: false, commitWindow: longest },
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
    { remaining: midLong, lastStop: true, commitWindow: longest },
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
    { remaining: midLong, lastStop: false, commitWindow: longest },
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
    { remaining: longest + 1, lastStop: false, commitWindow: longest },
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
    { remaining: midLong, lastStop: false, commitWindow: longest },
  ) === COMMIT_PASS,
  'locked pass does not flip on later brake',
)

// Per-stop window (Q778 / C3): remaining = shortest+5 is outside short, inside long.
assert(
  resolveCommit(
    {
      commit: COMMIT_OPEN,
      brake: 0,
      throttle: 1,
      x: 0,
      autopilot: false,
    },
    { remaining: probe, lastStop: false, commitWindow: shortest },
  ) === COMMIT_OPEN,
  `short stop ${shortIdx} at remaining=shortest+5 stays open`,
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
    { remaining: probe, lastStop: false, commitWindow: longest },
  ) === COMMIT_PASS,
  `long stop ${longIdx} at remaining=shortest+5 locks pass`,
)

console.log(
  `rampLengthAt table (${table.length}): ${table
    .map((v, i) => `${i}=${v.toFixed(3)}`)
    .join(' ')}`,
)
console.log(
  `shortest=${shortest.toFixed(3)}@${shortIdx} longest=${longest.toFixed(3)}@${longIdx} RAMP_LENGTH=${RAMP_LENGTH} PASS_LATERAL_MAX=${PASS_LATERAL_MAX} DISPOSITION_PASSED=${DISPOSITION_PASSED}`,
)
if (process.exitCode) {
  console.error('optionLane.verify FAILED')
  process.exit(1)
}
console.log('optionLane.verify PASSED')
