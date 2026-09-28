/**
 * st025 / PR #4: seeded itinerary leg miles (drive-mode tip).
 * Reconciled over drive-r3f legMiles.js duplicate (st1395 / cr1000218).
 * Zero-dep: imports rng.js only (no @/content alias).
 */
import {
  drawLegMiles,
  seedFromStopIds,
} from '../src/components/drive/rng.js'

const ids = [
  'origin',
  'pitt',
  'checkmate',
  'highmark',
  'colab',
  'starplus',
  'destination',
]
const legCount = ids.length - 1
const seed = seedFromStopIds(ids)
const miles = drawLegMiles(seed, legCount)
const replay = drawLegMiles(seed, legCount)
const salted = drawLegMiles(seed ^ 0xabcdef, legCount)
const tripMiles = miles.reduce((a, b) => a + b, 0)
const cardMiles = 5.2

let pass = 0
let fail = 0
const check = (name, ok) => {
  if (ok) pass += 1
  else fail += 1
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`)
}

console.log('  stretches:', miles.join(', '))

check('leg count matches consecutive pairs', miles.length === legCount)
check('every stretch is 1-99', miles.every((m) => m >= 1 && m <= 99))
check('same seed replays', replay.every((m, i) => m === miles[i]))
check('CONTROL different seed differs', salted.some((m, i) => m !== miles[i]))
check('seed is stable uint32', Number.isInteger(seed) && seed >= 0)
check('stretches are not one constant', new Set(miles).size > 1)
check('Q190 CONTROL tripMiles is not the real 5.2 card figure', Math.abs(tripMiles - cardMiles) > 1)

// Content key: renaming a later stop must not reshuffle earlier legs only if
// seed is ordered-id based - mutating the last id changes the whole seed.
// Control: a different id list must differ somewhere.
const otherIds = [...ids.slice(0, -1), 'destination-alt']
const otherMiles = drawLegMiles(seedFromStopIds(otherIds), legCount)
check(
  'CONTROL different stop ids change the sequence',
  otherMiles.some((m, i) => m !== miles[i])
)

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
