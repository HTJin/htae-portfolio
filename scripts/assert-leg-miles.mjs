/**
 * st025 leg-miles controls (sibling of assert-ramp-lengths.mjs).
 *   node --import ./scripts/load-route.mjs ./scripts/assert-leg-miles.mjs
 *
 * Every check asserts its subject exists and is non-empty before comparing, so a
 * crashed or empty probe cannot read as a pass.
 *
 * Miles driven tile pins live formatMiles(routeLength) (Q190), not String(tripMiles).
 * Control A requires the tile to differ from String(tripMiles).
 */
import {
  formatMiles,
  legMiles,
  route,
  routeLength,
  routeMilesSeed,
  tripMiles,
  tripSummary,
} from '@/components/drive/route'

const fail = []
const ok = (name, cond) => {
  if (!cond) fail.push(name)
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`)
}

// Existence first: an undefined export must not silently satisfy a zero-count check.
ok('legMiles exported', Array.isArray(legMiles) && legMiles.length > 0)
ok('tripMiles exported', Number.isFinite(tripMiles))
ok('routeMilesSeed exported', Number.isFinite(routeMilesSeed))

ok('seed is 190417787 (bare NUL join, no salt)', routeMilesSeed === 190417787)
ok('20 legs for 21 stops', legMiles.length === 20 && route.length === 21)
ok(
  'every leg is a 1-to-2-digit integer in [1,99]',
  legMiles.every((m) => Number.isInteger(m) && m >= 1 && m <= 99)
)
ok('tripMiles is 930', tripMiles === 930)

// tripSummary is an exported const ARRAY, not a function.
ok(
  'tripSummary exported non-empty',
  Array.isArray(tripSummary) && tripSummary.length > 0
)
const tile = tripSummary.find((t) => t.label === 'Miles driven')
ok(
  'trip summary has a Miles driven tile',
  Boolean(tile) && String(tile.value).length > 0
)
ok(
  'Miles driven tile equals formatMiles(routeLength)',
  tile && tile.value === formatMiles(routeLength)
)
ok(
  'Control A: Miles driven tile differs from String(tripMiles)',
  tile && tile.value !== String(tripMiles)
)

console.log(`legs: [${legMiles.join(',')}]`)
console.log(
  `tile: ${tile && tile.value} formatMiles(routeLength)=${formatMiles(
    routeLength
  )} tripMiles=${tripMiles}`
)
if (fail.length) {
  console.log(
    `FAIL st025 leg-miles controls (${fail.length}): ${fail.join(', ')}`
  )
  process.exit(1)
}
console.log('PASS st025 leg-miles controls')
