/**
 * st025 / PR #4: per-leg display miles from route.js (drawLegMiles), not the
 * retired legMiles.js hash helper. Zero-dep; no server.
 *
 *   node --import ./scripts/load-route.mjs ./scripts/verify-leg-miles.mjs
 */
import {
  drawLegMiles,
  intInclusive,
  mulberry32,
  seedFromStopIds,
} from '../src/components/drive/rng.js'
import {
  legMiles,
  route,
  routeMilesSeed,
  tripMiles,
} from '../src/components/drive/route.js'

let pass = 0
let fail = 0
const check = (name, ok) => {
  if (ok) pass += 1
  else fail += 1
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`)
}

const ids = route.map((stop) => stop.id)
const seed = seedFromStopIds(ids)
const redraw = drawLegMiles(seed, route.length - 1)

check('seed matches routeMilesSeed', seed === routeMilesSeed)
check('leg count is stop pairs', legMiles.length === route.length - 1)
check(
  'every stretch is 1-99',
  legMiles.every((m) => m >= 1 && m <= 99)
)
check(
  'same seed replays',
  redraw.every((m, i) => m === legMiles[i])
)
check('MILE 0 has no milesFromPrev', route[0].milesFromPrev === 0)
check(
  'stop.milesFromPrev matches legMiles',
  route.slice(1).every((stop, i) => stop.milesFromPrev === legMiles[i])
)
check(
  'tripMiles equals sum of stretches',
  tripMiles === legMiles.reduce((a, b) => a + b, 0)
)

const distinct = new Set(legMiles).size
check(
  `stretches are not one repeated constant (${distinct} distinct of ${legMiles.length})`,
  distinct > 1
)

const next = mulberry32(seed ^ 0xabcdef)
const control = []
for (let i = 0; i < legMiles.length; i += 1) {
  control.push(intInclusive(next(), 1, 99))
}
check(
  'CONTROL different seed changes at least one stretch',
  control.some((m, i) => m !== legMiles[i])
)

// Q190: decorative trip total must not be the real 5.2 mi card figure.
check(
  'CONTROL tripMiles differs from real 5.2 mi card figure',
  Math.abs(tripMiles - 5.2) > 1
)

console.log(`\n  stretches sample: ${legMiles.slice(0, 5).join(', ')}...`)
console.log(`  ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
