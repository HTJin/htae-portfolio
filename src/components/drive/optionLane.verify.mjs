/**
 * Measured harness for st071 option-lane commit (coder-2 alt path).
 * Run: node src/components/drive/optionLane.verify.mjs
 */
import {
  PASS_LATERAL_MAX,
  COMMIT_WINDOW,
  COMMIT_OPEN,
  COMMIT_TAKE,
  COMMIT_PASS,
  resolveCommit,
  assistAllowed,
  resolveGore,
} from './optionLane.js'

const mid = COMMIT_WINDOW / 2

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('OK:', msg)
  }
}

assert(COMMIT_WINDOW === 168, 'COMMIT_WINDOW === measured RAMP_LENGTH 168')

assert(
  resolveCommit(
    { commit: COMMIT_OPEN, brake: 1, throttle: 0, x: 0, autopilot: false },
    { remaining: mid, lastStop: false }
  ) === COMMIT_TAKE,
  'T1 brake -> take'
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
    { remaining: mid, lastStop: false }
  ) === COMMIT_PASS,
  'T2 stay-left+throttle -> pass'
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
    { remaining: mid, lastStop: false }
  ) === COMMIT_TAKE,
  'rightward past PASS_LATERAL_MAX -> take'
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
    { remaining: mid, lastStop: true }
  ) === COMMIT_OPEN,
  'T4 last stop stays open (cannot lock pass)'
)
assert(
  resolveGore(COMMIT_PASS, { lastStop: true }) === COMMIT_TAKE,
  'T4 last-stop gore forces take even if pass leaked'
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
    { remaining: mid, lastStop: false }
  ) === COMMIT_TAKE,
  'T5 autopilot -> take'
)

assert(
  resolveGore(COMMIT_OPEN, { lastStop: false }) === COMMIT_TAKE,
  'unresolved open at gore -> take'
)
assert(
  resolveGore(COMMIT_PASS, { lastStop: false }) === COMMIT_PASS,
  'pass at gore stays pass'
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
    { remaining: COMMIT_WINDOW + 1, lastStop: false }
  ) === COMMIT_OPEN,
  'outside commit window stays open'
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
    { remaining: mid, lastStop: false }
  ) === COMMIT_PASS,
  'locked pass does not flip on later brake'
)

console.log(
  `constants: COMMIT_WINDOW=${COMMIT_WINDOW} PASS_LATERAL_MAX=${PASS_LATERAL_MAX}`
)
if (process.exitCode) {
  console.error('optionLane.verify FAILED')
  process.exit(1)
}
console.log('optionLane.verify PASSED')
