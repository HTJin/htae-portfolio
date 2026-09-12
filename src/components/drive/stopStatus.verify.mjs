/**
 * stopStatus.verify.mjs — Node stdlib harness for st132 status vocabulary.
 *
 * Zero new deps. No Storage shim required (R0m). Run:
 *   node ./src/components/drive/stopStatus.verify.mjs
 */
import assert from 'node:assert/strict'
import {
  TAKEN,
  SKIPPED,
  JUMPED,
  UNREACHED,
  STORED_TOKENS,
  isStoredToken,
  adaptProducerToken,
  dispositionOf,
  statusOf,
} from './stopStatus.js'

function pass(msg) {
  console.log('PASS:', msg)
}

assert.deepEqual([...STORED_TOKENS], [TAKEN, SKIPPED, JUMPED])
assert.equal(isStoredToken(TAKEN), true)
assert.equal(isStoredToken(SKIPPED), true)
assert.equal(isStoredToken(JUMPED), true)
assert.equal(isStoredToken(UNREACHED), false)
assert.equal(isStoredToken('passed'), false)
assert.equal(isStoredToken('arrived'), false)
pass('stored whitelist is taken|skipped|jumped only (R0e)')

assert.equal(adaptProducerToken('arrived'), TAKEN)
assert.equal(adaptProducerToken(TAKEN), TAKEN)
assert.equal(adaptProducerToken(SKIPPED), SKIPPED)
assert.equal(adaptProducerToken(JUMPED), JUMPED)
assert.equal(adaptProducerToken('passed'), undefined)
assert.equal(adaptProducerToken('unset'), undefined)
assert.equal(adaptProducerToken(undefined), undefined)
pass('adaptProducerToken: arrived→taken; passed string ignored (R0h)')

// #20 Map
{
  const map = new Map([
    [2, 'arrived'],
    [4, SKIPPED],
  ])
  assert.equal(dispositionOf(2, { dispositionOf: map }), TAKEN)
  assert.equal(dispositionOf(4, { dispositionOf: map }), SKIPPED)
  assert.equal(dispositionOf(3, { dispositionOf: map }), undefined)
  pass('#20 Map producer: arrived→taken, skipped, miss→undefined')
}

// #20 function
{
  const fn = (i) => (i === 1 ? JUMPED : undefined)
  assert.equal(dispositionOf(1, { dispositionOf: fn }), JUMPED)
  assert.equal(dispositionOf(2, { dispositionOf: fn }), undefined)
  pass('#20 function producer tolerated')
}

// #26 object
{
  const stopStatus = { 1: 'arrived', 3: SKIPPED }
  assert.equal(dispositionOf(1, { stopStatus }), TAKEN)
  assert.equal(dispositionOf(3, { stopStatus }), SKIPPED)
  assert.equal(dispositionOf(2, { stopStatus }), undefined)
  pass('#26 object producer: arrived→taken')
}

// #25 Set → skipped (R0i / Q064); never jumped
{
  const passed = new Set([2, 5])
  assert.equal(dispositionOf(2, { passed }), SKIPPED)
  assert.equal(dispositionOf(5, { passed }), SKIPPED)
  assert.equal(dispositionOf(3, { passed }), undefined)
  assert.notEqual(dispositionOf(2, { passed }), JUMPED)
  pass('#25 passed Set → skipped, never jumped (R0i/Q064)')
}

// statusOf short-circuit on canonical producer (R0h)
assert.equal(
  statusOf(2, {
    passed: new Set([2]),
    visited: new Set(),
    currentIndex: 10,
    entryIndex: 0,
  }),
  SKIPPED
)
pass('statusOf short-circuits on Set→skipped even when behind furthest (R0h)')

// Leapfrog without Set → jumped (must differ from Set→skipped)
assert.equal(
  statusOf(2, {
    visited: new Set([0, 1]),
    currentIndex: 5,
    entryIndex: 0,
  }),
  JUMPED
)
pass('leapfrog without Set → jumped (Q180); differs from Set→skipped')

// Deep-link entryIndex leaves earlier stops unreached
assert.equal(
  statusOf(1, {
    visited: new Set([5]),
    currentIndex: 5,
    entryIndex: 5,
  }),
  UNREACHED
)
pass('deep-link entryIndex: earlier stops stay unreached')

// Visited → taken
assert.equal(
  statusOf(3, {
    visited: new Set([3]),
    currentIndex: 5,
    entryIndex: 0,
  }),
  TAKEN
)
pass('visited → taken')

// Absent producer still yields taken / jumped / unreached
assert.equal(statusOf(0, { visited: new Set([0]), currentIndex: 0 }), TAKEN)
assert.equal(
  statusOf(1, { visited: new Set([0]), currentIndex: 3, entryIndex: 0 }),
  JUMPED
)
assert.equal(
  statusOf(4, { visited: new Set([0]), currentIndex: 3, entryIndex: 0 }),
  UNREACHED
)
pass('absent producer still yields taken / jumped / unreached')

// Precedence: Map beats Set
assert.equal(
  dispositionOf(2, {
    dispositionOf: new Map([[2, TAKEN]]),
    passed: new Set([2]),
  }),
  TAKEN
)
pass('Map token precedes Set membership')

console.log('stopStatus.verify.mjs: OK')
