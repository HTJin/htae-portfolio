/**
 * Node verify for progress.js (R0-R0w + R0x).
 *
 * R0x: bind Map-backed Storage on window.localStorage BEFORE importing progress.
 * Alias + extensionless resolve via registerHooks (Node 22+), zero new deps.
 *
 * Docs: https://nodejs.org/api/module.html#modulenamespaceregisterhooks
 *       https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { describe, it, beforeEach } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const KEY_V1 = 'htae.drive.progress.v1'
const KEY_V2 = 'htae.drive.progress.v2'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')

function firstExisting(base) {
  for (const t of [base, base + '.js', base + '.jsx', base + '/index.js']) {
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
      const hit = firstExisting(path.join(root, 'src', specifier.slice(2)))
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
    }
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL))
      const hit = firstExisting(path.resolve(parentDir, specifier))
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

function createMapStorage() {
  const map = new Map()
  return {
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
    _map: map,
  }
}

/** @type {ReturnType<typeof createMapStorage>} */
let mem

function installWindowStorage(store) {
  const win = globalThis.window ?? {}
  win.localStorage = store
  globalThis.window = win
}

/** R0x: shim BEFORE importing progress APIs. */
mem = createMapStorage()
installWindowStorage(mem)

const { readProgress, writeProgress, clearProgress } = await import(
  './progress.js'
)
const { route } = await import('./route.js')

function seedV1(index) {
  const stop = route[index]
  mem.setItem(KEY_V1, JSON.stringify({ index, id: stop.id }))
}

function seedV2(index, outcomes) {
  const stop = route[index]
  mem.setItem(KEY_V2, JSON.stringify({ index, id: stop.id, outcomes }))
}

beforeEach(() => {
  mem = createMapStorage()
  installWindowStorage(mem)
})

describe('progress v2 + v1 resume', () => {
  it('v1-only resumes with empty outcomes; invent control differs', () => {
    seedV1(5)
    const got = readProgress()
    assert.ok(got)
    assert.equal(got.index, 5)
    assert.equal(got.id, route[5].id)
    assert.deepEqual(got.outcomes, {})
    assert.equal(got.title, route[5].title)
    assert.equal(got.label, route[5].exitLabel)
  })

  it('R0c: corrupt / id-mismatched v2 -> null; no v1 fall-through', () => {
    seedV1(5)
    mem.setItem(KEY_V2, '{not-json')
    assert.equal(readProgress(), null)

    mem = createMapStorage()
    installWindowStorage(mem)
    seedV1(5)
    mem.setItem(
      KEY_V2,
      JSON.stringify({ index: 5, id: 'wrong-id', outcomes: {} })
    )
    assert.equal(readProgress(), null)

    mem = createMapStorage()
    installWindowStorage(mem)
    seedV1(5)
    assert.equal(readProgress()?.index, 5)
  })

  it('R0: index-only write preserves seeded outcomes', () => {
    const a = route[2].id
    const b = route[3].id
    seedV2(4, { [a]: 'taken', [b]: 'skipped' })
    writeProgress(6)
    const got = readProgress()
    assert.equal(got.index, 6)
    assert.equal(got.outcomes[a], 'taken')
    assert.equal(got.outcomes[b], 'skipped')
  })

  it('R0b: nonempty patch at same index persists', () => {
    seedV2(4, {})
    const id = route[2].id
    writeProgress(4, { [id]: 'jumped' })
    assert.equal(readProgress().outcomes[id], 'jumped')
  })

  it('R0d: {} / omit at tip does not rewrite when outcomes plain', () => {
    seedV2(4, {})
    const before = mem.getItem(KEY_V2)
    writeProgress(4, {})
    assert.equal(mem.getItem(KEY_V2), before)
    writeProgress(4)
    assert.equal(mem.getItem(KEY_V2), before)
  })

  it('R0e: unreached / garbage tokens dropped', () => {
    seedV2(4, {})
    const id = route[2].id
    writeProgress(4, {
      [id]: 'unreached',
      junk: 'taken',
      [route[3].id]: 'nope',
    })
    assert.deepEqual(readProgress().outcomes, {})
  })

  it('R0f: title and label match live stop', () => {
    seedV2(4, {})
    const got = readProgress()
    assert.equal(got.title, route[4].title)
    assert.equal(got.label, route[4].exitLabel)
  })

  it('R0g: index-keyed outcomes dropped', () => {
    seedV2(4, { 2: 'taken', [route[2].id]: 'skipped' })
    assert.deepEqual(readProgress().outcomes, { [route[2].id]: 'skipped' })
  })

  it('R0j: clearProgress removes both keys; unrelated survives', () => {
    seedV1(3)
    seedV2(4, {})
    mem.setItem('other.origin.key', 'keep')
    clearProgress()
    assert.equal(mem.getItem(KEY_V1), null)
    assert.equal(mem.getItem(KEY_V2), null)
    assert.equal(mem.getItem('other.origin.key'), 'keep')
  })

  it('R0k: heal corrupt v2 then lower write does not tip at 3', () => {
    seedV1(15)
    mem.setItem(KEY_V2, 'not-json')
    writeProgress(3)
    const got = readProgress()
    assert.ok(got)
    assert.equal(got.index, 15)
    assert.notEqual(got.index, 3)
  })

  it('R0l / R0v: patch at lower index keeps max index + matching id', () => {
    seedV2(15, {})
    const patchId = route[3].id
    writeProgress(3, { [patchId]: 'skipped' })
    const raw = JSON.parse(mem.getItem(KEY_V2))
    assert.equal(raw.index, 15)
    assert.equal(raw.id, route[15].id)
    assert.notEqual(raw.id, route[3].id)
    assert.equal(raw.outcomes[patchId], 'skipped')
    assert.ok(readProgress())
  })

  it('R0n: shallow-merge keeps prior keys', () => {
    const A = route[1].id
    const B = route[2].id
    const C = route[3].id
    seedV2(5, { [A]: 'taken', [B]: 'skipped' })
    writeProgress(5, { [C]: 'jumped' })
    const o = readProgress().outcomes
    assert.equal(o[A], 'taken')
    assert.equal(o[B], 'skipped')
    assert.equal(o[C], 'jumped')
  })

  it('R0o: garbage patch does not erase prior; valid overwrite does', () => {
    const A = route[1].id
    seedV2(5, { [A]: 'taken' })
    writeProgress(5, { [A]: 'unreached' })
    assert.equal(readProgress().outcomes[A], 'taken')
    writeProgress(5, { [A]: 'skipped' })
    assert.equal(readProgress().outcomes[A], 'skipped')
  })

  it('R0p: bad outcomes shape soft-recovers on read', () => {
    const stop = route[4]
    mem.setItem(
      KEY_V2,
      JSON.stringify({ index: 4, id: stop.id, outcomes: null })
    )
    assert.deepEqual(readProgress().outcomes, {})
    mem.setItem(KEY_V2, JSON.stringify({ index: 4, id: stop.id }))
    assert.deepEqual(readProgress().outcomes, {})
    mem.setItem(KEY_V2, JSON.stringify({ index: 4, id: stop.id, outcomes: [] }))
    assert.deepEqual(readProgress().outcomes, {})
    mem.setItem(KEY_V2, JSON.stringify({ index: 4, id: 'nope', outcomes: [] }))
    assert.equal(readProgress(), null)
  })

  it('R0q: write soft-recovers array/string outcomes before merge', () => {
    const stop = route[4]
    const A = route[1].id
    mem.setItem(KEY_V2, JSON.stringify({ index: 4, id: stop.id, outcomes: [] }))
    writeProgress(4, { [A]: 'taken' })
    const o = JSON.parse(mem.getItem(KEY_V2)).outcomes
    assert.deepEqual(o, { [A]: 'taken' })
    assert.equal(
      Object.keys(o).some((k) => /^\d+$/.test(k)),
      false
    )
  })

  it('R0r / R0s: non-plain outcomes rewrite on index-only; plain {} early-returns', () => {
    const stop = route[4]
    mem.setItem(KEY_V2, JSON.stringify({ index: 4, id: stop.id, outcomes: [] }))
    writeProgress(4)
    assert.deepEqual(JSON.parse(mem.getItem(KEY_V2)).outcomes, {})

    seedV2(4, {})
    const before = mem.getItem(KEY_V2)
    writeProgress(4)
    assert.equal(mem.getItem(KEY_V2), before)
  })

  it('R0t: after heal, pre-heal junk outcomes are discarded', () => {
    seedV1(15)
    mem.setItem(
      KEY_V2,
      JSON.stringify({
        index: 3,
        id: 'bogus',
        outcomes: { junkKey: 'taken', [route[1].id]: 'skipped' },
      })
    )
    writeProgress(3, { [route[2].id]: 'taken' })
    const raw = JSON.parse(mem.getItem(KEY_V2))
    assert.equal(raw.index, 15)
    assert.equal(raw.id, route[15].id)
    assert.equal(raw.outcomes.junkKey, undefined)
    assert.equal(raw.outcomes[route[1].id], undefined)
    assert.equal(raw.outcomes[route[2].id], 'taken')
  })

  it('R0u: throw on removeItem(v1) still clears v2', () => {
    seedV1(3)
    seedV2(4, {})
    const realRemove = mem.removeItem.bind(mem)
    let v1Throws = true
    mem.removeItem = (key) => {
      if (key === KEY_V1 && v1Throws) {
        v1Throws = false
        throw new Error('boom-v1')
      }
      return realRemove(key)
    }
    clearProgress()
    assert.equal(mem.getItem(KEY_V2), null)
  })

  it('R0w: v1 bytes unchanged after v2 write; only clear removes v1', () => {
    seedV1(15)
    const v1Before = mem.getItem(KEY_V1)
    writeProgress(16)
    assert.equal(mem.getItem(KEY_V1), v1Before)
    assert.ok(mem.getItem(KEY_V2))
    clearProgress()
    assert.equal(mem.getItem(KEY_V1), null)
    assert.equal(mem.getItem(KEY_V2), null)
  })

  it('R0w control: mirrored setItem v1 tip-3 differs from heal resume @15', () => {
    seedV1(15)
    const v1Raw = mem.getItem(KEY_V1)
    mem.setItem(KEY_V2, 'corrupt')
    writeProgress(3)
    assert.equal(mem.getItem(KEY_V1), v1Raw)
    assert.equal(readProgress().index, 15)

    mem.setItem(KEY_V1, JSON.stringify({ index: 3, id: route[3].id }))
    assert.equal(JSON.parse(mem.getItem(KEY_V1)).index, 3)
    assert.notEqual(3, 15)
  })

  it('R0x: with window.localStorage, write then read non-null', () => {
    writeProgress(2, { [route[1].id]: 'taken' })
    assert.ok(readProgress())
  })
})

describe('R0x control without window', () => {
  it('without window both read and write stay inert', () => {
    const saved = globalThis.window
    try {
      delete globalThis.window
      assert.equal(readProgress(), null)
      writeProgress(2)
      globalThis.window = saved
      installWindowStorage(mem)
      assert.equal(mem.getItem(KEY_V2), null)
    } finally {
      globalThis.window = saved
      installWindowStorage(mem)
    }
  })
})
