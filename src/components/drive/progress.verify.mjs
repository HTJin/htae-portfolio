/**
 * progress.verify.mjs — Node stdlib harness for progress v2 (R0–R0w + R0x).
 *
 * Run:
 *   node --import ./scripts/load-route.mjs ./src/components/drive/progress.verify.mjs
 *
 * Installs Map-backed window.localStorage BEFORE importing progress (R0x).
 */

import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** Map-backed Storage shim (R0x). */
function installStorageShim() {
  const map = new Map()
  const storage = {
    getItem(key) {
      return map.has(key) ? map.get(key) : null
    },
    setItem(key, value) {
      map.set(String(key), String(value))
    },
    removeItem(key) {
      map.delete(String(key))
    },
    clear() {
      map.clear()
    },
    get length() {
      return map.size
    },
    key(i) {
      return [...map.keys()][i] ?? null
    },
    _map: map,
  }
  globalThis.window = { localStorage: storage }
  return storage
}

const store = installStorageShim()

const { route } = await import(pathToFileURL(path.join(here, 'route.js')).href)
const { readProgress, writeProgress, clearProgress, __progressKeys } =
  await import(pathToFileURL(path.join(here, 'progress.js')).href)

const KEY_V1 = __progressKeys.v1
const KEY_V2 = __progressKeys.v2

function seedV1(index) {
  const stop = route[index]
  store.setItem(KEY_V1, JSON.stringify({ index, id: stop.id }))
}

function seedV2(index, outcomes) {
  const stop = route[index]
  store.setItem(KEY_V2, JSON.stringify({ index, id: stop.id, outcomes }))
}

function rawV2() {
  const raw = store.getItem(KEY_V2)
  return raw ? JSON.parse(raw) : null
}

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`PASS ${name}`)
}

// 1. v1-only resumes; outcomes empty. Corrupt v2 → null (no v1 fall-through).
check('A1/R0c v1-only vs corrupt-v2', () => {
  store.clear()
  seedV1(5)
  const ok = readProgress()
  assert.equal(ok.index, 5)
  assert.deepEqual(ok.outcomes, {})
  assert.ok(ok.title)
  assert.ok(ok.label)

  store.clear()
  seedV1(5)
  store.setItem(KEY_V2, '{not-json')
  assert.equal(readProgress(), null)

  store.clear()
  seedV1(5)
  store.setItem(
    KEY_V2,
    JSON.stringify({ index: 5, id: 'wrong-id', outcomes: {} })
  )
  assert.equal(readProgress(), null)
})

// 2. Index-only write preserves seeded outcomes (R0)
check('R0 index-only keeps outcomes', () => {
  store.clear()
  const idA = route[2].id
  const idB = route[3].id
  seedV2(4, { [idA]: 'taken', [idB]: 'skipped' })
  writeProgress(6)
  const got = readProgress()
  assert.equal(got.index, 6)
  assert.equal(got.outcomes[idA], 'taken')
  assert.equal(got.outcomes[idB], 'skipped')
})

// 3. Nonempty patch at lower index keeps tip high + correct id (R0l/R0v)
check('R0l/R0v max index + id from storedIndex', () => {
  store.clear()
  seedV2(15, {})
  const patchId = route[3].id
  writeProgress(3, { [patchId]: 'skipped' })
  const blob = rawV2()
  assert.equal(blob.index, 15)
  assert.equal(blob.id, route[15].id)
  assert.notEqual(blob.id, route[3].id)
  assert.equal(blob.outcomes[patchId], 'skipped')

  // Wrong-id blob nulls on next read (R0c)
  store.setItem(
    KEY_V2,
    JSON.stringify({ index: 15, id: route[3].id, outcomes: {} })
  )
  assert.equal(readProgress(), null)
})

// 4. clearProgress both keys; unrelated survives; independent throw (R0j/R0u)
check('R0j/R0u clear both + independent try', () => {
  store.clear()
  seedV1(4)
  seedV2(4, {})
  store.setItem('other.origin.key', 'keep-me')
  clearProgress()
  assert.equal(store.getItem(KEY_V1), null)
  assert.equal(store.getItem(KEY_V2), null)
  assert.equal(store.getItem('other.origin.key'), 'keep-me')

  // Force removeItem(v1) to throw once; v2 still clears
  store.clear()
  seedV1(4)
  seedV2(4, {})
  let v1Throws = true
  const realRemove = store.removeItem.bind(store)
  store.removeItem = (key) => {
    if (key === KEY_V1 && v1Throws) {
      v1Throws = false
      throw new Error('forced v1 remove fail')
    }
    return realRemove(key)
  }
  clearProgress()
  store.removeItem = realRemove
  assert.equal(store.getItem(KEY_V2), null)
})

// 5. Soft-recover bad outcomes; rewrite non-plain on write (R0p–R0s)
check('R0p-R0s soft-recover + dirty rewrite', () => {
  store.clear()
  const stop = route[7]
  store.setItem(
    KEY_V2,
    JSON.stringify({ index: 7, id: stop.id, outcomes: null })
  )
  const soft = readProgress()
  assert.equal(soft.index, 7)
  assert.deepEqual(soft.outcomes, {})

  // id-mismatch still null (must differ from soft-recover)
  store.setItem(
    KEY_V2,
    JSON.stringify({ index: 7, id: 'nope', outcomes: null })
  )
  assert.equal(readProgress(), null)

  // R0r/R0s: non-plain outcomes at tip; index-only write rewrites to {}
  store.clear()
  store.setItem(KEY_V2, JSON.stringify({ index: 7, id: stop.id, outcomes: [] }))
  writeProgress(7)
  const after = rawV2()
  assert.deepEqual(after.outcomes, {})
  assert.ok(!Array.isArray(after.outcomes))

  // R0d: plain {} + index-only at tip early-returns (no rewrite required)
  store.clear()
  const before = JSON.stringify({ index: 7, id: stop.id, outcomes: {} })
  store.setItem(KEY_V2, before)
  writeProgress(7)
  assert.equal(store.getItem(KEY_V2), before)
})

// 6. After corrupt-v2 heal, no pre-heal junk (R0t)
check('R0t heal discards pre-heal junk', () => {
  store.clear()
  seedV1(15)
  store.setItem(
    KEY_V2,
    JSON.stringify({
      index: 15,
      id: 'mismatched',
      outcomes: { junkKey: 'taken', 0: 'skipped' },
    })
  )
  writeProgress(3)
  const blob = rawV2()
  assert.equal(blob.index, 15)
  assert.equal(blob.id, route[15].id)
  assert.equal(blob.outcomes.junkKey, undefined)
  assert.equal(blob.outcomes['0'], undefined)
})

// 7. R0w: v2 write leaves v1 bytes unchanged; heal resumes from v1 tip 15
check('R0w never setItem v1; heal from untouched v1', () => {
  store.clear()
  const v1Raw = JSON.stringify({ index: 15, id: route[15].id })
  store.setItem(KEY_V1, v1Raw)
  // Advancing write migrates to v2; tip maxes with prior (R0l) → 16
  writeProgress(16)
  assert.equal(store.getItem(KEY_V1), v1Raw)
  assert.equal(rawV2().index, 16)
  assert.equal(rawV2().id, route[16].id)

  // Corrupt v2 + writeProgress(3) after heal → tip 15 from v1 (not 3)
  store.clear()
  store.setItem(KEY_V1, v1Raw)
  store.setItem(KEY_V2, '<<<corrupt>>>')
  writeProgress(3)
  const healed = rawV2()
  assert.equal(healed.index, 15)
  assert.equal(store.getItem(KEY_V1), v1Raw)

  // Control: mirrored-v1 tip 3 must differ (we never write that)
  assert.notEqual(healed.index, 3)
})

// 8. R0x: with shim, write then read non-null; without window both null
check('R0x window.localStorage shim required', () => {
  store.clear()
  writeProgress(1)
  assert.ok(readProgress())

  const savedWindow = globalThis.window
  delete globalThis.window
  assert.equal(readProgress(), null)
  writeProgress(2)
  // restore
  globalThis.window = savedWindow
  // write while window missing did nothing; still only prior tip 1 if any
  // (store still holds tip 1 from before delete)
  assert.equal(readProgress().index, 1)
})

// 9. R0e/R0g/R0n/R0o/R0b/R0q token + merge rules
check('R0e/R0g/R0n/R0o/R0b/R0q normalize + merge', () => {
  store.clear()
  const A = route[2].id
  const B = route[3].id
  const C = route[4].id
  seedV2(5, { [A]: 'taken', [B]: 'skipped' })
  writeProgress(5, { [C]: 'jumped' })
  let blob = rawV2()
  assert.equal(blob.outcomes[A], 'taken')
  assert.equal(blob.outcomes[B], 'skipped')
  assert.equal(blob.outcomes[C], 'jumped')

  writeProgress(5, { [A]: 'unreached', garbage: 'taken', 1: 'jumped' })
  blob = rawV2()
  assert.equal(blob.outcomes[A], 'taken') // R0o keep prior
  assert.equal(blob.outcomes.garbage, undefined)
  assert.equal(blob.outcomes['1'], undefined)

  writeProgress(5, { [A]: 'skipped' })
  assert.equal(rawV2().outcomes[A], 'skipped')

  // R0q: array outcomes then patch
  store.clear()
  store.setItem(
    KEY_V2,
    JSON.stringify({ index: 5, id: route[5].id, outcomes: [] })
  )
  writeProgress(5, { [A]: 'taken' })
  blob = rawV2()
  assert.deepEqual(blob.outcomes, { [A]: 'taken' })
  assert.equal(
    Object.keys(blob.outcomes).some((k) => /^\d+$/.test(k)),
    false
  )
})

// 10. R0f title/label present
check('R0f title and label', () => {
  store.clear()
  seedV2(4, {})
  const got = readProgress()
  assert.equal(got.title, route[4].title)
  assert.equal(got.label, route[4].exitLabel)
})

console.log(`\nprogress.verify.mjs: ${passed} checks passed`)
