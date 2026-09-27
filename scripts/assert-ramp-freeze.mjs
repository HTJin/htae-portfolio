/**
 * st023 ramp-length freeze (golden vector).
 *   node --import ./scripts/load-route.mjs ./scripts/assert-ramp-freeze.mjs
 *
 * assert-ramp-lengths.mjs checks the BAND and the ceiling, not the values: moving
 * RAMP_FRAC_MIN 0.25 -> 0.26 changes all 21 lengths and that gate still prints
 * PASS 12/12. This file freezes the values themselves.
 *
 * GOLDEN captured from clean 4a185dc, not from a ported tree. Re-capturing it from
 * the tree under test would make the freeze vacuous.
 */
import { rampLengthAt, route, RAMP_LENGTH_SEED } from '@/components/drive/route'

const GOLDEN_SEED = 3184890066
const GOLDEN = [
  136.64746213518083, 140.45014322083443, 167.8719477772247, 110.92661473271438,
  145.35571899195202, 114.6684707547538, 119.93997414107434, 158.2100984095596,
  148.7742759876419, 126.06654553161935, 116.81390697159804, 139.9452157036867,
  124.28628019080497, 117.26837994949894, 129.43965942319483, 166.3185563168954,
  107.00840740115382, 118.69179461407475, 122.11938271019609,
  126.73478861292826, 144.93308983021416,
]

const fail = []
const ok = (name, cond) => {
  if (!cond) fail.push(name)
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`)
}

// Subject must exist and be non-empty before any comparison; an empty actual must
// never compare equal to an empty expected.
ok('route exported non-empty', Array.isArray(route) && route.length > 0)
ok('golden vector is non-empty', GOLDEN.length === 21)
ok('stop count still 21', route.length === GOLDEN.length)
ok('RAMP_LENGTH_SEED frozen at 3184890066', RAMP_LENGTH_SEED === GOLDEN_SEED)

const actual = route.map((_, i) => rampLengthAt(i))
ok(
  'rampLengthAt returns a finite value per stop',
  actual.every(Number.isFinite)
)

let moved = []
for (let i = 0; i < GOLDEN.length; i += 1) {
  if (actual[i] !== GOLDEN[i]) moved.push(`${i}: ${GOLDEN[i]} -> ${actual[i]}`)
}
ok(`all 21 ramp lengths bit-identical to 4a185dc`, moved.length === 0)

if (moved.length)
  console.log(
    `moved (${moved.length}/21):\n  ${moved.slice(0, 5).join('\n  ')}`
  )
if (fail.length) {
  console.log(
    `FAIL st023 ramp-length freeze (${fail.length}): ${fail.join(', ')}`
  )
  process.exit(1)
}
console.log('PASS st023 ramp-length freeze')
