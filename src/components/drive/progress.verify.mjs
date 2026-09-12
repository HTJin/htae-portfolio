/**
 * Node verify for progress.js (R0–R0x).
 *
 * R0x: bind Map-backed Storage onto globalThis.window.localStorage BEFORE
 * importing progress.js. Bare globalThis.localStorage without window must not
 * count as success. Alias-safe @/content resolve via node:module register.
 * Zero new deps.
 */
import assert from 'node:assert/strict'
import { register } from 'node:module'
import path from 'node:path'
import { describe, it, beforeEach } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)
const KEY_V1 = 'htae.drive.progress.v1'
const KEY_V2 = 'htae.drive.progress.v2'

register(
  `data:text/javascript,${encodeURIComponent(`
    import path from 'node:path';
    import { pathToFileURL, fileURLToPath } from 'node:url';
    import { existsSync, statSync } from 'node:fs';
    const ROOT = ${JSON.stringify(ROOT.split(path.sep).join('/'))};
    function isFile(candidate) {
      try {
        return existsSync(candidate) && statSync(candidate).isFile();
      } catch {
        return false;
      }
    }
    function pick(candidates) {
      for (const candidate of candidates) {
        if (isFile(candidate)) {
          return { shortCircuit: true, url: pathToFileURL(candidate).href };
        }
      }
      return null;
    }
    export async function resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('@/')) {
        const rel = specifier.slice(2);
        const hit = pick([
          path.join(ROOT, 'src', rel + '.js'),
          path.join(ROOT, 'src', rel + '.jsx'),
          path.join(ROOT, 'src', rel, 'index.js'),
          path.join(ROOT, 'src', rel),
        ]);
        if (hit) return hit;
        return {
          shortCircuit: true,
          url: pathToFileURL(path.join(ROOT, 'src', rel, 'index.js')).href,
        };
      }
      // Next/jsconfig resolves extensionless relatives; Node ESM does not.
      if (
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        !path.extname(specifier) &&
        context.parentURL
      ) {
        const parentDir = path.dirname(fileURLToPath(context.parentURL));
        const base = path.resolve(parentDir, specifier);
        const hit = pick([
          base + '.js',
          base + '.jsx',
          path.join(base, 'index.js'),
        ]);
        if (hit) return hit;
      }
      return nextResolve(specifier, context);
    }
  `)}`,
  import.meta.url
)

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

/** R0x bind — must happen before progress.js import. */
const store = makeStorage()
globalThis.window = { localStorage: store }

const { readProgress, writeProgress, clearProgress, normalizeOutcomes } =
  await import('./progress.js')
const { route } = await import('./route.js')

function seedV2(index, outcomes, id = route[index].id) {
  store.setItem(KEY_V2, JSON.stringify({ index, id, outcomes }))
}

function seedV1(index, id = route[index].id) {
  store.setItem(KEY_V1, JSON.stringify({ index, id }))
}

function rawV2() {
  const raw = store.getItem(KEY_V2)
  return raw ? JSON.parse(raw) : null
}

beforeEach(() => {
  store.clear()
})

describe('progress v2 + v1 resume (R0–R0x)', () => {
  it('R0x: window.localStorage round-trips; no-window returns null', () => {
    writeProgress(3)
    assert.ok(readProgress())
    const savedWindow = globalThis.window
    delete globalThis.window
    assert.equal(readProgress(), null)
    globalThis.window = savedWindow
    assert.ok(readProgress())
  })

  it('hand-written v2 outcomes round-trip keyed by stop id', () => {
    const id = route[4].id
    seedV2(4, { [id]: 'taken' })
    const got = readProgress()
    assert.equal(got.index, 4)
    assert.equal(got.outcomes[id], 'taken')
    assert.equal(got.title, route[4].title)
    assert.equal(got.label, route[4].exitLabel)
  })

  it('v1-only → resume + empty outcomes; empty storage → null (must differ)', () => {
    seedV1(5)
    const fromV1 = readProgress()
    assert.equal(fromV1.index, 5)
    assert.deepEqual(fromV1.outcomes, {})
    store.clear()
    assert.equal(readProgress(), null)
  })

  it('R0c: corrupt / id-mismatch / array-root v2 → null; no v1 fall-through', () => {
    seedV1(8)
    store.setItem(KEY_V2, 'not-json')
    assert.equal(readProgress(), null)

    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 8, id: 'wrong-id', outcomes: {} })
    )
    assert.equal(readProgress(), null)

    store.setItem(KEY_V2, JSON.stringify([{ index: 8, id: route[8].id }]))
    assert.equal(readProgress(), null)

    // Control: v2 absent still reads v1
    store.removeItem(KEY_V2)
    assert.equal(readProgress()?.index, 8)
  })

  it('R0w: first v2 write leaves v1 bytes unchanged; never setItem v1', () => {
    seedV1(6)
    const v1Before = store.getItem(KEY_V1)
    writeProgress(7, { [route[7].id]: 'taken' })
    assert.equal(store.getItem(KEY_V1), v1Before)
    assert.ok(store.getItem(KEY_V2))
    const blob = rawV2()
    assert.equal(blob.index, 7)
    assert.equal(blob.outcomes[route[7].id], 'taken')

    // Dual-write control must differ: v1 must not be rewritten to match tip
    assert.notEqual(store.getItem(KEY_V1), store.getItem(KEY_V2))
  })

  it('R0w control: KEY retargeted to v2 would orphan v1 (must differ)', () => {
    seedV1(6)
    // Simulate the forbidden "bump KEY constant to v2 string" by reading only V2.
    assert.equal(store.getItem(KEY_V2), null)
    assert.ok(store.getItem(KEY_V1))
    // Prefer-v2-absent still resumes from v1 (control that retarget would break).
    assert.equal(readProgress()?.index, 6)
  })

  it('R0: index-only write after seeded outcomes preserves the seed', () => {
    const a = route[2].id
    seedV2(2, { [a]: 'skipped' })
    writeProgress(5)
    const got = readProgress()
    assert.equal(got.index, 5)
    assert.equal(got.outcomes[a], 'skipped')
  })

  it('R0b / R0d: nonempty patch persists at same index; {} does not bypass', () => {
    seedV2(9, {})
    writeProgress(9, { [route[9].id]: 'jumped' })
    assert.equal(readProgress().outcomes[route[9].id], 'jumped')

    const before = store.getItem(KEY_V2)
    writeProgress(9, {})
    assert.equal(store.getItem(KEY_V2), before)
    writeProgress(9, null)
    assert.equal(store.getItem(KEY_V2), before)
  })

  it('R0e / R0g / R0f: drop unreached/garbage/index keys; keep title/label', () => {
    seedV2(4, {})
    writeProgress(4, {
      [route[4].id]: 'unreached',
      [route[3].id]: 'garbage',
      3: 'taken',
      [route[2].id]: 'taken',
    })
    const got = readProgress()
    assert.equal(got.outcomes[route[4].id], undefined)
    assert.equal(got.outcomes[route[3].id], undefined)
    assert.equal(got.outcomes['3'], undefined)
    assert.equal(got.outcomes[route[2].id], 'taken')
    assert.ok(got.title)
    assert.ok(got.label)
  })

  it('R0k / R0t / R0w: corrupt v2 + v1@15 + writeProgress(3) resumes v1@15; no junk rewrite', () => {
    const v1Raw = JSON.stringify({ index: 15, id: route[15].id })
    store.setItem(KEY_V1, v1Raw)
    store.setItem(
      KEY_V2,
      JSON.stringify({
        index: 15,
        id: 'not-a-real-stop',
        outcomes: { junk: 'taken', [route[1].id]: 'skipped' },
      })
    )
    writeProgress(3)
    // Heal removes corrupt v2; index-only non-advancing early-returns (no rewrite).
    assert.equal(store.getItem(KEY_V2), null)
    assert.equal(store.getItem(KEY_V1), v1Raw)
    assert.equal(readProgress()?.index, 15)
    // Control: mirrored tip-3 must differ
    assert.notEqual(readProgress()?.index, 3)
  })

  it('R0l / R0v: lower caller index with patch keeps high tip + matching id', () => {
    seedV2(15, {})
    writeProgress(3, { [route[3].id]: 'skipped' })
    const blob = rawV2()
    assert.equal(blob.index, 15)
    assert.equal(blob.id, route[15].id)
    assert.equal(blob.outcomes[route[3].id], 'skipped')
    assert.ok(readProgress())

    // Wrong-id control must null on read (R0c)
    store.setItem(
      KEY_V2,
      JSON.stringify({
        index: 15,
        id: route[3].id,
        outcomes: { [route[3].id]: 'skipped' },
      })
    )
    assert.equal(readProgress(), null)
  })

  it('R0n: seed {A,B} + patch {C} keeps A and B', () => {
    const A = route[2].id
    const B = route[3].id
    const C = route[4].id
    seedV2(10, { [A]: 'taken', [B]: 'skipped' })
    writeProgress(10, { [C]: 'jumped' })
    const o = readProgress().outcomes
    assert.equal(o[A], 'taken')
    assert.equal(o[B], 'skipped')
    assert.equal(o[C], 'jumped')
  })

  it('R0o: unreached patch keeps prior taken; valid overwrite applies', () => {
    const A = route[2].id
    seedV2(6, { [A]: 'taken' })
    writeProgress(6, { [A]: 'unreached' })
    assert.equal(readProgress().outcomes[A], 'taken')
    writeProgress(6, { [A]: 'skipped' })
    assert.equal(readProgress().outcomes[A], 'skipped')
  })

  it('R0p: null / omit / [] outcomes resume with {}; id-mismatch still null', () => {
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 7, id: route[7].id, outcomes: null })
    )
    assert.deepEqual(readProgress().outcomes, {})

    store.setItem(KEY_V2, JSON.stringify({ index: 7, id: route[7].id }))
    assert.deepEqual(readProgress().outcomes, {})

    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 7, id: route[7].id, outcomes: [] })
    )
    assert.deepEqual(readProgress().outcomes, {})

    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 7, id: 'nope', outcomes: [] })
    )
    assert.equal(readProgress(), null)
  })

  it('R0q: array/string outcomes + patch stores only clean tokens', () => {
    const A = route[2].id
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 5, id: route[5].id, outcomes: [] })
    )
    writeProgress(5, { [A]: 'taken' })
    assert.deepEqual(readProgress().outcomes, { [A]: 'taken' })

    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 5, id: route[5].id, outcomes: 'taken' })
    )
    writeProgress(5, { [A]: 'taken' })
    assert.deepEqual(readProgress().outcomes, { [A]: 'taken' })
  })

  it('R0r / R0s: non-plain outcomes rewrite on index-only; plain {} early-returns', () => {
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: 8, id: route[8].id, outcomes: [] })
    )
    writeProgress(8)
    assert.deepEqual(rawV2().outcomes, {})

    seedV2(8, {})
    const before = store.getItem(KEY_V2)
    writeProgress(8)
    assert.equal(store.getItem(KEY_V2), before)
  })

  it('R0u / R0j: removeItem throw on one key still clears the other; unrelated key remains', () => {
    seedV1(4)
    seedV2(4, {})
    store.setItem('htae.unrelated', 'keep-me')

    const realRemove = store.removeItem.bind(store)
    store.removeItem = (key) => {
      if (key === KEY_V1) throw new Error('boom-v1')
      return realRemove(key)
    }
    clearProgress()
    assert.equal(store.getItem(KEY_V2), null)
    assert.equal(store.getItem('htae.unrelated'), 'keep-me')

    seedV1(4)
    seedV2(4, {})
    store.removeItem = (key) => {
      if (key === KEY_V2) throw new Error('boom-v2')
      return realRemove(key)
    }
    clearProgress()
    assert.equal(store.getItem(KEY_V1), null)
    assert.equal(store.getItem('htae.unrelated'), 'keep-me')

    store.removeItem = realRemove
  })

  it('normalizeOutcomes drops non-plain roots', () => {
    assert.deepEqual(normalizeOutcomes([]), {})
    assert.deepEqual(normalizeOutcomes(null), {})
    assert.deepEqual(normalizeOutcomes({ [route[1].id]: 'taken' }), {
      [route[1].id]: 'taken',
    })
  })
})

describe('R0x control: host-only localStorage without window fails', () => {
  it('storage() ignores bare globalThis.localStorage', () => {
    const host = makeStorage()
    host.setItem(KEY_V1, JSON.stringify({ index: 3, id: route[3].id }))
    globalThis.localStorage = host
    const saved = globalThis.window
    delete globalThis.window
    assert.equal(readProgress(), null)
    globalThis.window = saved
    delete globalThis.localStorage
  })
})
