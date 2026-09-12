/**
 * Node verify for stopStatus.js (R0m / R0h / R0i / Q180 / Q064).
 * No Storage shim required.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  JUMPED,
  SKIPPED,
  TAKEN,
  UNREACHED,
  dispositionFromProducers,
  statusOf,
} from './stopStatus.js'

describe('stopStatus.statusOf', () => {
  it('leapfrog without producer → jumped; control off → unreached (Q180)', () => {
    assert.equal(
      statusOf(3, { furthestIndex: 10, entryIndex: 0, visited: new Set() }),
      JUMPED
    )
    assert.equal(
      statusOf(3, { furthestIndex: 3, entryIndex: 0, visited: new Set() }),
      UNREACHED
    )
  })

  it('visited → taken beats leapfrog', () => {
    assert.equal(
      statusOf(3, {
        furthestIndex: 10,
        entryIndex: 0,
        visited: new Set([3]),
      }),
      TAKEN
    )
  })

  it('deep-link entryIndex leaves earlier stops unreached', () => {
    for (let i = 1; i <= 10; i++) {
      assert.equal(
        statusOf(i, {
          furthestIndex: 15,
          entryIndex: 11,
          visited: new Set(),
        }),
        UNREACHED,
        `stop ${i}`
      )
    }
    assert.equal(
      statusOf(12, {
        furthestIndex: 15,
        entryIndex: 11,
        visited: new Set(),
      }),
      JUMPED
    )
  })

  it('R0h: producer unset does not short-circuit; leapfrog → jumped', () => {
    const dispositionOf = new Map([[5, 'unset']])
    assert.equal(
      statusOf(5, {
        dispositionOf,
        furthestIndex: 10,
        entryIndex: 0,
        visited: new Set(),
      }),
      JUMPED
    )
    assert.equal(
      statusOf(5, {
        dispositionOf,
        furthestIndex: 5,
        entryIndex: 0,
        visited: new Set(),
      }),
      UNREACHED
    )
  })

  it('R0h: canonical producer tokens short-circuit', () => {
    assert.equal(
      statusOf(2, {
        dispositionOf: new Map([[2, TAKEN]]),
        furthestIndex: 0,
        visited: new Set(),
      }),
      TAKEN
    )
    assert.equal(
      statusOf(2, {
        dispositionOf: new Map([[2, SKIPPED]]),
        furthestIndex: 0,
        visited: new Set(),
      }),
      SKIPPED
    )
    assert.equal(
      statusOf(2, {
        dispositionOf: new Map([[2, JUMPED]]),
        furthestIndex: 0,
        visited: new Set(),
      }),
      JUMPED
    )
  })

  it('R0i: #25 passed Set → skipped; leapfrog without Set → jumped', () => {
    assert.equal(
      statusOf(4, {
        passed: new Set([4]),
        furthestIndex: 10,
        entryIndex: 0,
        visited: new Set(),
      }),
      SKIPPED
    )
    assert.equal(
      statusOf(4, {
        furthestIndex: 10,
        entryIndex: 0,
        visited: new Set(),
      }),
      JUMPED
    )
  })

  it('#26 object arrived → taken', () => {
    assert.equal(
      dispositionFromProducers(1, { stopStatus: { 1: 'arrived' } }),
      TAKEN
    )
    assert.equal(
      statusOf(1, {
        stopStatus: { 1: 'arrived' },
        furthestIndex: 0,
        visited: new Set(),
      }),
      TAKEN
    )
  })

  it('#20 Map function form works', () => {
    assert.equal(
      statusOf(7, {
        dispositionOf: (i) => (i === 7 ? SKIPPED : null),
        furthestIndex: 0,
        visited: new Set(),
      }),
      SKIPPED
    )
  })

  it('R0m: module has no progress import side effects', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./stopStatus.js', import.meta.url), 'utf8')
    )
    assert.equal(/from\s+['"]\.\/progress/.test(src), false)
    assert.equal(/localStorage/.test(src), false)
  })
})
