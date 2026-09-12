/**
 * Node verify for progress.js (R0–R0x).
 *
 * Binds Map-backed Storage onto globalThis.window.localStorage BEFORE importing
 * progress.js (R0x). Alias-safe @/content + extensionless relatives via
 * registerHooks (sync). No new deps.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, it, before, beforeEach } from 'node:test'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC_ROOT = join(HERE, '../..')

function firstExisting(base) {
  for (const t of [base, base + '.js', base + '.jsx', join(base, 'index.js')]) {
    try {
      if (fs.existsSync(t) && fs.statSync(t).isFile()) return t
    } catch {
      // continue
    }
  }
  return null
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const hit = firstExisting(join(SRC_ROOT, specifier.slice(2)))
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
    }
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL
    ) {
      const parentDir = dirname(fileURLToPath(context.parentURL))
      const hit = firstExisting(join(parentDir, specifier))
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

const KEY_V1 = 'htae.drive.progress.v1'
const KEY_V2 = 'htae.drive.progress.v2'
const OTHER_KEY = 'htae.drive.unrelated'

function makeStorage() {
  const map = new Map()
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null
    },
    setItem(key, value) {
      map.set(String(key), String(value))
    },
    removeItem(key) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
    _map: map,
  }
}

let store
let readProgress
let writeProgress
let clearProgress
let route

before(async () => {
  store = makeStorage()
  globalThis.window = { localStorage: store }
  ;({ readProgress, writeProgress, clearProgress } = await import(
    './progress.js'
  ))
  ;({ route } = await import('./route.js'))
})

beforeEach(() => {
  store._map.clear()
  globalThis.window = { localStorage: store }
})

function seedV1(index) {
  const stop = route[index]
  store.setItem(KEY_V1, JSON.stringify({ index, id: stop.id }))
}

function seedV2(index, outcomes, idOverride) {
  const stop = route[index]
  store.setItem(
    KEY_V2,
    JSON.stringify({
      index,
      id: idOverride ?? stop.id,
      outcomes,
    })
  )
}

describe('progress v2', () => {
  it('R0x: window.localStorage round-trips; no-window is null', () => {
    writeProgress(3, { [route[3].id]: 'taken' })
    const got = readProgress()
    assert.equal(got.index, 3)
    assert.equal(got.outcomes[route[3].id], 'taken')

    const savedWindow = globalThis.window
    delete globalThis.window
    assert.equal(readProgress(), null)
    globalThis.window = savedWindow
  })

  it('R0x control: host-only globalThis.localStorage without window fails', () => {
    const hostStore = makeStorage()
    globalThis.localStorage = hostStore
    const savedWindow = globalThis.window
    delete globalThis.window
    assert.equal(readProgress(), null)
    writeProgress(2, { [route[2].id]: 'taken' })
    assert.equal(hostStore.getItem(KEY_V2), null)
    globalThis.window = savedWindow
    delete globalThis.localStorage
  })

  it('hand-written v2 outcomes round-trip by stop id', () => {
    const id = route[5].id
    seedV2(5, { [id]: 'skipped' })
    const got = readProgress()
    assert.equal(got.index, 5)
    assert.equal(got.outcomes[id], 'skipped')
    assert.equal(got.title, route[5].title)
    assert.equal(got.label, route[5].exitLabel)
  })

  it('v1-only → resume + empty outcomes; empty storage → null', () => {
    assert.equal(readProgress(), null)
    seedV1(8)
    const got = readProgress()
    assert.equal(got.index, 8)
    assert.deepEqual(got.outcomes, {})
    assert.notEqual(got, null)
  })

  it('R0c: corrupt / id-mismatch / array-root v2 → null; no v1 fall-through', () => {
    seedV1(10)
    store.setItem(KEY_V2, '{not-json')
    assert.equal(readProgress(), null)

    store._map.clear()
    seedV1(10)
    seedV2(10, {}, 'wrong-id')
    assert.equal(readProgress(), null)

    store._map.clear()
    seedV1(10)
    store.setItem(KEY_V2, JSON.stringify([{ index: 10 }]))
    assert.equal(readProgress(), null)
  })

  it('R0w: first v2 write leaves v1 bytes unchanged; setItem only v2', () => {
    seedV1(4)
    const v1Before = store.getItem(KEY_V1)
    writeProgress(6, { [route[6].id]: 'taken' })
    assert.equal(store.getItem(KEY_V1), v1Before)
    assert.ok(store.getItem(KEY_V2))
    const tip = JSON.parse(store.getItem(KEY_V2))
    assert.equal(tip.index, 6)
    assert.equal(tip.outcomes[route[6].id], 'taken')
  })

  it('R0w control: dual-write into v1 would differ from leave-v1-alone', () => {
    seedV1(4)
    const v1Before = store.getItem(KEY_V1)
    writeProgress(6, { [route[6].id]: 'taken' })
    const dualWouldBe = JSON.stringify({ index: 6, id: route[6].id })
    assert.notEqual(store.getItem(KEY_V1), dualWouldBe)
    assert.equal(store.getItem(KEY_V1), v1Before)
  })

  it('R0: index-only writeProgress preserves seeded outcomes', () => {
    const a = route[2].id
    seedV2(4, { [a]: 'taken' })
    writeProgress(7)
    const got = readProgress()
    assert.equal(got.index, 7)
    assert.equal(got.outcomes[a], 'taken')
  })

  it('R0b / R0d: nonempty patch bypasses; {} does not', () => {
    const id = route[5].id
    seedV2(5, { [id]: 'taken' })
    const before = store.getItem(KEY_V2)
    writeProgress(5, {})
    assert.equal(store.getItem(KEY_V2), before)

    writeProgress(5, { [id]: 'skipped' })
    assert.equal(readProgress().outcomes[id], 'skipped')
  })

  it('R0e / R0g: unreached / garbage / index keys never round-trip', () => {
    writeProgress(3, {
      [route[3].id]: 'unreached',
      [route[2].id]: 'taken',
      2: 'skipped',
      bogus: 'jumped',
      [route[1].id]: 'nope',
    })
    const outcomes = readProgress().outcomes
    assert.equal(outcomes[route[2].id], 'taken')
    assert.equal(outcomes[route[3].id], undefined)
    assert.equal(outcomes['2'], undefined)
    assert.equal(outcomes.bogus, undefined)
  })

  it('R0f: title / label present', () => {
    writeProgress(4)
    const got = readProgress()
    assert.equal(got.title, route[4].title)
    assert.equal(got.label, route[4].exitLabel)
  })

  it('R0k / R0t: corrupt v2 + v1@15; writeProgress(3) does not tip at 3; no pre-heal junk', () => {
    seedV1(15)
    store.setItem(
      KEY_V2,
      JSON.stringify({
        index: 9,
        id: 'wrong',
        outcomes: { junk: 'taken', [route[1].id]: 'taken' },
      })
    )
    writeProgress(3)
    const got = readProgress()
    assert.notEqual(got.index, 3)
    assert.equal(got.index, 15)
    assert.equal(got.outcomes.junk, undefined)
    assert.equal(got.outcomes[route[1].id], undefined)
  })

  it('R0l / R0v: seed@15 + writeProgress(3, patch) keeps tip 15 and matching id', () => {
    const patchId = route[3].id
    seedV2(15, {})
    writeProgress(3, { [patchId]: 'skipped' })
    const raw = JSON.parse(store.getItem(KEY_V2))
    assert.equal(raw.index, 15)
    assert.equal(raw.id, route[15].id)
    assert.equal(raw.outcomes[patchId], 'skipped')
  })

  it('R0n: shallow-merge keeps siblings', () => {
    const a = route[1].id
    const b = route[2].id
    const c = route[3].id
    seedV2(5, { [a]: 'taken', [b]: 'skipped' })
    writeProgress(5, { [c]: 'jumped' })
    const outcomes = readProgress().outcomes
    assert.equal(outcomes[a], 'taken')
    assert.equal(outcomes[b], 'skipped')
    assert.equal(outcomes[c], 'jumped')
  })

  it('R0o: invalid patch token does not erase prior; valid overwrite applies', () => {
    const a = route[1].id
    seedV2(4, { [a]: 'taken' })
    writeProgress(4, { [a]: 'unreached' })
    assert.equal(readProgress().outcomes[a], 'taken')
    writeProgress(4, { [a]: 'skipped' })
    assert.equal(readProgress().outcomes[a], 'skipped')
  })

  it('R0p: null / omit / array outcomes soft-recover; id-mismatch still null', () => {
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 6, id: route[6].id, outcomes: null })
    )
    let got = readProgress()
    assert.equal(got.index, 6)
    assert.deepEqual(got.outcomes, {})

    store.setItem(KEY_V2, JSON.stringify({ index: 6, id: route[6].id }))
    got = readProgress()
    assert.equal(got.index, 6)
    assert.deepEqual(got.outcomes, {})

    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 6, id: route[6].id, outcomes: [] })
    )
    got = readProgress()
    assert.equal(got.index, 6)
    assert.deepEqual(got.outcomes, {})

    seedV2(6, {}, 'nope')
    assert.equal(readProgress(), null)
  })

  it('R0q: array/string outcomes + patch store clean object only', () => {
    const a = route[1].id
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 4, id: route[4].id, outcomes: [] })
    )
    writeProgress(4, { [a]: 'taken' })
    let raw = JSON.parse(store.getItem(KEY_V2))
    assert.deepEqual(raw.outcomes, { [a]: 'taken' })

    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 4, id: route[4].id, outcomes: 'xy' })
    )
    writeProgress(4, { [a]: 'taken' })
    raw = JSON.parse(store.getItem(KEY_V2))
    assert.deepEqual(raw.outcomes, { [a]: 'taken' })
    assert.equal(raw.outcomes['0'], undefined)
  })

  it('R0r / R0s: non-plain outcomes rewrite to {}; plain {} early-returns', () => {
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 5, id: route[5].id, outcomes: [] })
    )
    writeProgress(5)
    assert.deepEqual(JSON.parse(store.getItem(KEY_V2)).outcomes, {})

    seedV2(5, {})
    const before = store.getItem(KEY_V2)
    writeProgress(5)
    assert.equal(store.getItem(KEY_V2), before)
  })

  it('R0u / R0j: independent removeItem; unrelated key survives', () => {
    seedV1(3)
    seedV2(3, {})
    store.setItem(OTHER_KEY, 'keep')

    const realRemove = store.removeItem.bind(store)
    store.removeItem = (key) => {
      if (key === KEY_V1) throw new Error('v1 boom')
      return realRemove(key)
    }
    clearProgress()
    assert.equal(store.getItem(KEY_V2), null)
    assert.equal(store.getItem(OTHER_KEY), 'keep')

    store.removeItem = realRemove
    seedV1(3)
    seedV2(3, {})
    store.removeItem = (key) => {
      if (key === KEY_V2) throw new Error('v2 boom')
      return realRemove(key)
    }
    clearProgress()
    assert.equal(store.getItem(KEY_V1), null)
    assert.equal(store.getItem(OTHER_KEY), 'keep')
    store.removeItem = realRemove
  })

  it('empty-string v2 heals so v1 floor still gates (R0k empty)', () => {
    seedV1(12)
    store.setItem(KEY_V2, '')
    writeProgress(2)
    const got = readProgress()
    assert.equal(got.index, 12)
  })
})
