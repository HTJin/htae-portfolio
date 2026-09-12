/**
 * stopStatus.verify.mjs — pure status vocabulary (R0h / R0i / R0m).
 *
 * Run (no Storage shim required):
 *   node ./src/components/drive/stopStatus.verify.mjs
 */

import assert from 'node:assert/strict'
import {
  statusOf,
  adaptProducer,
  TAKEN,
  SKIPPED,
  JUMPED,
  UNREACHED,
} from './stopStatus.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`PASS ${name}`)
}

check('R0m no window / Storage required', () => {
  assert.equal(typeof globalThis.window, 'undefined')
  assert.equal(statusOf(3, { furthestIndex: 10, entryIndex: 0 }), JUMPED)
})

check('visited → taken', () => {
  assert.equal(statusOf(2, { visited: new Set([2]), furthestIndex: 5 }), TAKEN)
})

check('Q180 leapfrog → jumped; control unreached', () => {
  assert.equal(
    statusOf(3, { visited: new Set(), furthestIndex: 8, entryIndex: 0 }),
    JUMPED
  )
  assert.equal(
    statusOf(3, { visited: new Set(), furthestIndex: 2, entryIndex: 0 }),
    UNREACHED
  )
})

check('deep-link entryIndex leaves earlier stops unreached', () => {
  for (let i = 1; i <= 10; i += 1) {
    assert.equal(
      statusOf(i, {
        visited: new Set(),
        furthestIndex: 15,
        entryIndex: 11,
      }),
      UNREACHED,
      `index ${i}`
    )
  }
  assert.equal(
    statusOf(12, {
      visited: new Set(),
      furthestIndex: 15,
      entryIndex: 11,
    }),
    JUMPED
  )
})

check('R0h producer unset stays absent; leapfrog still jumped', () => {
  const dispositionOf = new Map([[5, 'unset']])
  assert.equal(
    statusOf(5, {
      dispositionOf,
      visited: new Set(),
      furthestIndex: 9,
      entryIndex: 0,
    }),
    JUMPED
  )
  assert.notEqual(
    statusOf(5, {
      dispositionOf,
      visited: new Set(),
      furthestIndex: 9,
      entryIndex: 0,
    }),
    'unset'
  )
})

check('R0h canonical producer short-circuit', () => {
  assert.equal(
    statusOf(1, {
      dispositionOf: new Map([[1, TAKEN]]),
      visited: new Set(),
      furthestIndex: 0,
    }),
    TAKEN
  )
  assert.equal(
    statusOf(1, {
      dispositionOf: new Map([[1, SKIPPED]]),
      furthestIndex: 9,
    }),
    SKIPPED
  )
})

check('R0i #25 Set → skipped; leapfrog without Set → jumped', () => {
  const passedSet = new Set([4])
  assert.equal(
    statusOf(4, {
      passed: passedSet,
      visited: new Set(),
      furthestIndex: 9,
      entryIndex: 0,
    }),
    SKIPPED
  )
  assert.equal(
    statusOf(4, {
      visited: new Set(),
      furthestIndex: 9,
      entryIndex: 0,
    }),
    JUMPED
  )
  assert.notEqual(statusOf(4, { passed: passedSet, furthestIndex: 9 }), JUMPED)
})

check('#26 arrived → taken via stopStatus object', () => {
  assert.equal(
    statusOf(2, { stopStatus: { 2: 'arrived' }, furthestIndex: 0 }),
    TAKEN
  )
})

check('adaptProducer never returns passed token', () => {
  assert.equal(adaptProducer(1, new Set([1])), SKIPPED)
  assert.notEqual(adaptProducer(1, new Set([1])), 'passed')
})

console.log(`\nstopStatus.verify.mjs: ${passed} checks passed`)
