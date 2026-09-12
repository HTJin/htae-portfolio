/**
 * Node verify for stopStatus.js (R0m / R0h / R0i / Q064 / Q180).
 * No Storage shim. No progress.js import. Stdlib assert only.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  JUMPED,
  SKIPPED,
  TAKEN,
  UNREACHED,
  adaptProducerToken,
  dispositionOf,
  statusOf,
} from './stopStatus.js'

describe('stopStatus vocabulary', () => {
  it('adaptProducerToken maps arrived→taken and drops unset/passed/unknown (R0h)', () => {
    assert.equal(adaptProducerToken('arrived'), TAKEN)
    assert.equal(adaptProducerToken('taken'), TAKEN)
    assert.equal(adaptProducerToken('skipped'), SKIPPED)
    assert.equal(adaptProducerToken('jumped'), JUMPED)
    assert.equal(adaptProducerToken('unset'), undefined)
    assert.equal(adaptProducerToken('passed'), undefined)
    assert.equal(adaptProducerToken('unreached'), undefined)
    assert.equal(adaptProducerToken(null), undefined)
  })

  it('statusOf leapfrog ≠ never-reached; deep-link entryIndex leaves earlier unreached', () => {
    const leapfrog = statusOf(3, { furthestIndex: 10, entryIndex: 0 })
    const neverReached = statusOf(3, { furthestIndex: 2, entryIndex: 0 })
    assert.equal(leapfrog, JUMPED)
    assert.equal(neverReached, UNREACHED)
    assert.notEqual(leapfrog, neverReached)

    for (let i = 1; i <= 10; i += 1) {
      assert.equal(
        statusOf(i, { furthestIndex: 15, entryIndex: 11 }),
        UNREACHED,
        `deep-link leaves ${i} unreached`
      )
    }
    assert.equal(statusOf(12, { furthestIndex: 15, entryIndex: 11 }), JUMPED)
  })

  it('visited yields taken without a producer', () => {
    assert.equal(
      statusOf(4, { visited: new Set([4]), furthestIndex: 10 }),
      TAKEN
    )
  })

  it('producer unset at leapfrogged index yields jumped, not unset (R0h)', () => {
    const map = new Map([[5, 'unset']])
    const got = statusOf(5, {
      dispositionOf: map,
      furthestIndex: 10,
      entryIndex: 0,
    })
    assert.equal(got, JUMPED)
    assert.notEqual(got, 'unset')
  })

  it('#25 passed Set → skipped ≠ leapfrog-without-Set → jumped (R0i / Q064)', () => {
    const withSet = statusOf(7, {
      passed: new Set([7]),
      furthestIndex: 12,
      entryIndex: 0,
    })
    const withoutSet = statusOf(7, {
      furthestIndex: 12,
      entryIndex: 0,
    })
    assert.equal(withSet, SKIPPED)
    assert.equal(withoutSet, JUMPED)
    assert.notEqual(withSet, withoutSet)
  })

  it('#20 Map and #26 object (arrived→taken) short-circuit', () => {
    assert.equal(
      statusOf(2, {
        dispositionOf: new Map([[2, 'skipped']]),
        furthestIndex: 9,
      }),
      SKIPPED
    )
    assert.equal(
      statusOf(2, { stopStatus: { 2: 'arrived' }, furthestIndex: 9 }),
      TAKEN
    )
    assert.equal(dispositionOf(2, { stopStatus: { 2: 'arrived' } }), TAKEN)
  })

  it('canonical producer beats visited / jump derivation (R0h)', () => {
    assert.equal(
      statusOf(3, {
        dispositionOf: new Map([[3, 'jumped']]),
        visited: new Set([3]),
        furthestIndex: 10,
      }),
      JUMPED
    )
  })

  it('R0m: this harness imports stopStatus only (no Storage / progress)', () => {
    assert.equal(typeof statusOf, 'function')
    assert.equal(typeof globalThis.window, 'undefined')
  })
})
