/**
 * st025 / st137 leg-miles controls (sibling of assert-ramp-lengths.mjs).
 *   node --import ./scripts/load-route.mjs ./scripts/assert-leg-miles.mjs
 *
 * NON-EMPTY first. Tile pins live formatMiles(routeLength) (Q190), never
 * String(tripMiles) or a literal "5.2". Control A requires those strings differ.
 *
 * Alternate structure vs @-alias GOLDEN: relative import + checks map (tip style).
 */
import {
  formatMiles,
  legMiles,
  route,
  routeLength,
  routeMilesSeed,
  tripMiles,
  tripSummary,
} from '../src/components/drive/route.js'

const fail = []
const ok = (name, cond) => {
  if (!cond) fail.push(name)
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`)
}

// Existence first: an undefined export must not silently satisfy a zero-count check.
ok('legMiles exported', Array.isArray(legMiles) && legMiles.length > 0)
ok('tripMiles exported', Number.isFinite(tripMiles))
ok('routeMilesSeed exported', Number.isFinite(routeMilesSeed))
ok(
  'routeLength exported finite',
  Number.isFinite(routeLength) && routeLength > 0,
)

ok('seed is 190417787 (bare NUL join, no salt)', routeMilesSeed === 190417787)
ok('20 legs for 21 stops', legMiles.length === 20 && route.length === 21)
ok(
  'every leg is a 1-to-2-digit integer in [1,99]',
  legMiles.every((m) => Number.isInteger(m) && m >= 1 && m <= 99),
)
ok('tripMiles is 930', tripMiles === 930)

ok(
  'tripSummary exported non-empty',
  Array.isArray(tripSummary) && tripSummary.length > 0,
)
const tile = tripSummary.find((t) => t.label === 'Miles driven')
ok(
  'trip summary has a Miles driven tile',
  Boolean(tile) && String(tile?.value ?? '').length > 0,
)

const liveTile = formatMiles(routeLength)
const tripAsString = String(tripMiles)
ok(
  'Miles driven tile equals formatMiles(routeLength)',
  tile && tile.value === liveTile,
)
ok(
  'Control A: tile differs from String(tripMiles)',
  tile && tile.value !== tripAsString,
)

console.log(
  JSON.stringify(
    {
      routeMilesSeed,
      legCount: legMiles.length,
      tripMiles,
      liveTile,
      tripAsString,
      tileValue: tile && tile.value,
      controlADiffers: tile && tile.value !== tripAsString,
      legsSample: legMiles.slice(0, 5),
    },
    null,
    2,
  ),
)

if (fail.length) {
  console.log(
    `FAIL st025 leg-miles controls (${fail.length}): ${fail.join(', ')}`,
  )
  process.exit(1)
}
console.log('PASS st025 leg-miles controls')
