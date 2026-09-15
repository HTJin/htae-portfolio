/**
 * progress.verify.mjs — st132 progress v2 harness (R0–R0w + R0x).
 *
 * Alternate structure: sync module.registerHooks (same-thread) maps @/ → src/
 * and adds .js for extensionless relatives. Zero new deps; no fifth file.
 * Prefer registerHooks over async register(import.meta.url) so the hook is
 * live before the first dynamic import of progress/route.
 *
 * R0x: Map-backed Storage on window.localStorage BEFORE progress import.
 */
import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, extname, join, resolve as pathResolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = pathResolve(HERE, '../../..')
const SRC = pathResolve(ROOT, 'src')

function isFile(p) {
  try {
    return existsSync(p) && statSync(p).isFile()
  } catch {
    return false
  }
}

function tryFile(base) {
  for (const candidate of [
    base + '.js',
    base + '.mjs',
    join(base, 'index.js'),
  ]) {
    if (isFile(candidate)) {
      return { shortCircuit: true, url: pathToFileURL(candidate).href }
    }
  }
  return null
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const hit = tryFile(join(SRC, specifier.slice(2)))
      if (hit) return hit
    }
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !extname(specifier)
    ) {
      if (!context.parentURL || context.parentURL.startsWith('data:')) {
        return nextResolve(specifier, context)
      }
      const parent = fileURLToPath(context.parentURL)
      const hit = tryFile(join(dirname(parent), specifier))
      if (hit) return hit
    }
    return nextResolve(specifier, context)
  },
})

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
      map.delete(String(key))
    },
    clear() {
      map.clear()
    },
    _map: map,
  }
}

const KEY_V1 = 'htae.drive.progress.v1'
const KEY_V2 = 'htae.drive.progress.v2'
const OTHER = 'htae.drive.unrelated'

const store = makeStorage()
globalThis.window = { localStorage: store }

const { route } = await import('./route.js')
const { readProgress, writeProgress, clearProgress, normalizeOutcomes } =
  await import('./progress.js')

function pass(msg) {
  console.log('PASS:', msg)
}

function seedV1(index) {
  store.setItem(KEY_V1, JSON.stringify({ index, id: route[index].id }))
}

function seedV2(index, outcomes = {}) {
  store.setItem(
    KEY_V2,
    JSON.stringify({ index, id: route[index].id, outcomes })
  )
}

function raw(key) {
  return store.getItem(key)
}

// --- 1. v1-only resume; corrupt v2 nulls (R0c control differs) ---
store.clear()
seedV1(3)
{
  const r = readProgress()
  assert.equal(r?.index, 3)
  assert.deepEqual(r?.outcomes, {})
  assert.equal(r?.title, route[3].title)
  assert.equal(r?.label, route[3].exitLabel)
  pass('1a v1-only resumes with empty outcomes + title/label (R0f)')
}
store.clear()
store.setItem(KEY_V2, '{not-json')
seedV1(3)
{
  assert.equal(readProgress(), null)
  pass('1b corrupt v2 → null, no v1 fall-through (R0c)')
}
store.clear()
store.setItem(
  KEY_V2,
  JSON.stringify({ index: 3, id: 'not-a-real-stop', outcomes: {} })
)
assert.equal(readProgress(), null)
pass('1c id-mismatched v2 → null (R0c)')

// --- 2. Index-only writeProgress preserves seeded outcomes (R0) ---
store.clear()
seedV2(5, { [route[2].id]: 'taken', [route[4].id]: 'skipped' })
writeProgress(6)
{
  const r = readProgress()
  assert.equal(r.index, 6)
  assert.equal(r.outcomes[route[2].id], 'taken')
  assert.equal(r.outcomes[route[4].id], 'skipped')
  pass('2 index-only write preserves prior outcomes (R0)')
}

// --- 3. Patch at lower index keeps stored index high + R0v id ---
store.clear()
seedV2(10, { [route[2].id]: 'taken' })
writeProgress(4, { [route[3].id]: 'jumped' })
{
  const r = readProgress()
  assert.equal(r.index, 10)
  assert.equal(r.id, route[10].id)
  assert.equal(r.outcomes[route[2].id], 'taken')
  assert.equal(r.outcomes[route[3].id], 'jumped')
  pass(
    '3a lower-index patch keeps max index + id from route[storedIndex] (R0l/R0v)'
  )
}
store.setItem(
  KEY_V2,
  JSON.stringify({
    index: 10,
    id: route[4].id,
    outcomes: { [route[2].id]: 'taken' },
  })
)
assert.equal(readProgress(), null)
pass('3b wrong-id blob nulls on read (R0c control)')

// --- 4. clearProgress both keys; unrelated survives; independent throw ---
store.clear()
seedV1(2)
seedV2(5, { [route[1].id]: 'taken' })
store.setItem(OTHER, 'keep-me')
clearProgress()
assert.equal(raw(KEY_V1), null)
assert.equal(raw(KEY_V2), null)
assert.equal(raw(OTHER), 'keep-me')
pass('4a clearProgress removes v1+v2 only; unrelated survives (R0j/Q1699)')

store.clear()
seedV1(2)
seedV2(5)
{
  const realRemove = store.removeItem.bind(store)
  let first = true
  store.removeItem = (key) => {
    if (first && key === KEY_V1) {
      first = false
      throw new Error('boom-v1')
    }
    return realRemove(key)
  }
  clearProgress()
  store.removeItem = realRemove
  assert.equal(raw(KEY_V2), null)
  pass('4b throw on removeItem(v1) still clears v2 (R0u)')
}
store.clear()
seedV1(2)
seedV2(5)
{
  const realRemove = store.removeItem.bind(store)
  store.removeItem = (key) => {
    if (key === KEY_V2) throw new Error('boom-v2')
    return realRemove(key)
  }
  clearProgress()
  store.removeItem = realRemove
  assert.equal(raw(KEY_V1), null)
  pass('4c throw on removeItem(v2) still cleared v1 (R0u reverse)')
}

// --- 5. Soft-recover bad outcomes; rewrite non-plain (R0p–R0s) ---
store.clear()
store.setItem(
  KEY_V2,
  JSON.stringify({ index: 4, id: route[4].id, outcomes: ['taken'] })
)
{
  const r = readProgress()
  assert.equal(r.index, 4)
  assert.deepEqual(r.outcomes, {})
  pass('5a array outcomes soft-recover to {} on read (R0p)')
}
writeProgress(4)
{
  assert.deepEqual(JSON.parse(raw(KEY_V2)).outcomes, {})
  pass('5b write rewrites non-plain outcomes to {} (R0r/R0s)')
}
store.clear()
store.setItem(
  KEY_V2,
  JSON.stringify({
    index: 4,
    id: route[4].id,
    outcomes: {
      [route[2].id]: 'taken',
      bad: 'taken',
      [route[3].id]: 'nope',
    },
  })
)
{
  const r = readProgress()
  assert.equal(r.outcomes[route[2].id], 'taken')
  assert.equal(r.outcomes.bad, undefined)
  assert.equal(r.outcomes[route[3].id], undefined)
  pass('5c normalize drops unknown ids and unknown tokens (R0e/R0g/R0o)')
}

// --- 6. After corrupt-v2 heal, no pre-heal junk (R0t) ---
store.clear()
seedV1(8)
store.setItem(KEY_V2, '{corrupt')
writeProgress(3, { [route[1].id]: 'taken' })
{
  const r = readProgress()
  assert.equal(r.index, 8)
  assert.equal(r.id, route[8].id)
  assert.equal(r.outcomes[route[1].id], 'taken')
  assert.deepEqual(Object.keys(r.outcomes), [route[1].id])
  pass('6 heal corrupt v2 then merge; no pre-heal junk (R0k/R0t)')
}

// --- 7. R0w: v2 write leaves v1 unchanged; heal resumes from v1 tip ---
store.clear()
seedV1(15)
const v1Before = raw(KEY_V1)
writeProgress(4, { [route[2].id]: 'skipped' })
assert.equal(raw(KEY_V1), v1Before)
{
  const r = readProgress()
  assert.equal(r.index, 15)
  assert.equal(r.outcomes[route[2].id], 'skipped')
  pass('7a successful v2 write leaves v1 bytes unchanged (R0w)')
}
store.clear()
seedV1(15)
const v1Fixed = raw(KEY_V1)
store.setItem(KEY_V2, '{corrupt')
writeProgress(3)
{
  const r = readProgress()
  assert.equal(r.index, 15)
  assert.equal(raw(KEY_V1), v1Fixed)
  pass('7b corrupt v2 + writeProgress(3) resumes at 15; v1 untouched (R0w)')
}
store.clear()
seedV1(3)
seedV2(3, {})
writeProgress(3)
{
  assert.equal(readProgress().index, 3)
  pass('7c mirrored tip-3 control differs from tip-15 resume')
}

// --- 8. R0x shim vs no-window control ---
store.clear()
writeProgress(1)
assert.ok(readProgress())
pass('8a with window.localStorage shim, write+read non-null (R0x)')
{
  const savedWindow = globalThis.window
  delete globalThis.window
  assert.equal(readProgress(), null)
  writeProgress(2)
  globalThis.window = savedWindow
  assert.equal(readProgress()?.index, 1)
  pass('8b without window, read null and write is no-op (R0x control)')
}

assert.deepEqual(normalizeOutcomes(null), {})
assert.deepEqual(normalizeOutcomes([1]), {})
assert.equal(
  normalizeOutcomes({ [route[1].id]: 'taken' })[route[1].id],
  'taken'
)
assert.equal(
  normalizeOutcomes({ [route[1].id]: 'unreached' })[route[1].id],
  undefined
)
assert.equal(
  normalizeOutcomes({ [route[1].id]: 'passed' })[route[1].id],
  undefined
)
pass('normalizeOutcomes drops unreached/passed; keeps taken')

// R0d: empty patch at tip does not rewrite when outcomes plain
store.clear()
seedV2(6, {})
const before = raw(KEY_V2)
writeProgress(6, {})
assert.equal(raw(KEY_V2), before)
writeProgress(6)
assert.equal(raw(KEY_V2), before)
pass('R0d empty/omit patch early-returns when outcomes plain')

// R0n shallow merge
store.clear()
seedV2(5, { [route[1].id]: 'taken', [route[2].id]: 'skipped' })
writeProgress(5, { [route[3].id]: 'jumped' })
{
  const o = readProgress().outcomes
  assert.equal(o[route[1].id], 'taken')
  assert.equal(o[route[2].id], 'skipped')
  assert.equal(o[route[3].id], 'jumped')
  pass('R0n shallow-merge keeps prior keys')
}

// R0o invalid patch does not erase prior
store.clear()
seedV2(5, { [route[1].id]: 'taken' })
writeProgress(5, { [route[1].id]: 'unreached' })
assert.equal(readProgress().outcomes[route[1].id], 'taken')
writeProgress(5, { [route[1].id]: 'skipped' })
assert.equal(readProgress().outcomes[route[1].id], 'skipped')
pass('R0o invalid patch token does not erase prior valid token')

// First v2 write does not delete v1
store.clear()
seedV1(2)
writeProgress(3)
assert.ok(raw(KEY_V1))
assert.ok(raw(KEY_V2))
pass('first v2 write leaves v1 present')

console.log('progress.verify.mjs: OK')
