/**
 * progress.verify.mjs — Node stdlib harness for st132 progress v2 (R0–R0w + R0x).
 *
 * Zero new deps. Run:
 *   node ./src/components/drive/progress.verify.mjs
 *
 * R0x: Map-backed Storage is bound on globalThis.window.localStorage BEFORE
 * progress is imported. Bare host Storage / Node built-in Web Storage is not
 * trusted. Alias + .js extension resolve is inlined (no fifth file).
 */
import { register } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'

const ROOT = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))

register(
  `data:text/javascript,${encodeURIComponent(`
    import path from 'node:path';
    import { pathToFileURL } from 'node:url';
    const ROOT = ${JSON.stringify(ROOT)};
    async function tryNext(nextResolve, spec, context) {
      try { return await nextResolve(spec, context); }
      catch (err) {
        if (
          err &&
          (err.code === 'ERR_MODULE_NOT_FOUND' ||
            err.code === 'ERR_UNSUPPORTED_DIR_IMPORT')
        ) {
          return null;
        }
        throw err;
      }
    }
    export async function resolve(specifier, context, nextResolve) {
      let base = specifier;
      if (specifier.startsWith('@/')) {
        base = pathToFileURL(path.join(ROOT, 'src', specifier.slice(2))).href;
      } else if (
        context.parentURL &&
        (specifier.startsWith('./') || specifier.startsWith('../'))
      ) {
        base = new URL(specifier, context.parentURL).href;
      } else {
        return nextResolve(specifier, context);
      }
      const candidates = [
        base,
        base.endsWith('.js') ? null : base + '.js',
        base.replace(/\\/$/, '') + '/index.js',
      ].filter(Boolean);
      for (const candidate of candidates) {
        const hit = await tryNext(nextResolve, candidate, context);
        if (hit) return hit;
      }
      return nextResolve(specifier, context);
    }
  `)}`
)

/** Minimal Map-backed Storage (R0x). */
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

const { readProgress, writeProgress, clearProgress, normalizeOutcomes } =
  await import('./progress.js')
const { route } = await import('./route.js')

function fail(msg) {
  console.error('FAIL:', msg)
  process.exitCode = 1
}

function pass(msg) {
  console.log('PASS:', msg)
}

function seedV1(index) {
  const stop = route[index]
  store.setItem(KEY_V1, JSON.stringify({ index, id: stop.id }))
}

function seedV2(index, outcomes = {}) {
  const stop = route[index]
  store.setItem(KEY_V2, JSON.stringify({ index, id: stop.id, outcomes }))
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
  const r = readProgress()
  assert.equal(r, null)
  pass('1b corrupt v2 → null, no v1 fall-through (R0c)')
}
store.clear()
seedV2(3)
{
  // id mismatch
  store.setItem(
    KEY_V2,
    JSON.stringify({ index: 3, id: 'not-a-real-stop', outcomes: {} })
  )
  assert.equal(readProgress(), null)
  pass('1c id-mismatched v2 → null (R0c)')
}

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

// --- 3. Patch at lower index keeps stored index high + R0v id (R0l/R0v) ---
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
// Wrong-id blob nulls on next read (must differ)
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

// --- 4. clearProgress both keys; unrelated survives; independent throw (R0j/R0u) ---
store.clear()
seedV1(2)
seedV2(5, { [route[1].id]: 'taken' })
store.setItem(OTHER, 'keep-me')
clearProgress()
assert.equal(raw(KEY_V1), null)
assert.equal(raw(KEY_V2), null)
assert.equal(raw(OTHER), 'keep-me')
pass('4a clearProgress removes v1+v2 only; unrelated survives (R0j/Q1699)')

// Independent throw: wrap removeItem so first key throws, second still clears.
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

// --- 5. Soft-recover bad outcomes on read; rewrite non-plain on write (R0p–R0s) ---
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
  const parsed = JSON.parse(raw(KEY_V2))
  assert.deepEqual(parsed.outcomes, {})
  pass('5b write rewrites non-plain outcomes to {} (R0r/R0s)')
}
store.clear()
store.setItem(
  KEY_V2,
  JSON.stringify({
    index: 4,
    id: route[4].id,
    outcomes: { [route[2].id]: 'taken', bad: 'taken', [route[3].id]: 'nope' },
  })
)
{
  const r = readProgress()
  assert.equal(r.outcomes[route[2].id], 'taken')
  assert.equal(r.outcomes.bad, undefined)
  assert.equal(r.outcomes[route[3].id], undefined)
  pass('5c normalize drops unknown ids and unknown tokens (R0e/R0g/R0o)')
}

// --- 6. After corrupt-v2 heal, no pre-heal junk outcomes (R0t) ---
store.clear()
seedV1(8)
store.setItem(KEY_V2, '{corrupt')
writeProgress(3, { [route[1].id]: 'taken' })
{
  const r = readProgress()
  assert.equal(r.index, 8)
  assert.equal(r.id, route[8].id)
  assert.equal(r.outcomes[route[1].id], 'taken')
  const keys = Object.keys(r.outcomes)
  assert.deepEqual(keys, [route[1].id])
  pass('6 heal corrupt v2 then merge; no pre-heal junk (R0k/R0t)')
}

// --- 7. R0w: v2 write leaves v1 bytes unchanged; heal resumes from v1 tip ---
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
  assert.equal(r.id, route[15].id)
  assert.equal(raw(KEY_V1), v1Fixed)
  // Post-heal write must migrate tip into v2 (not stay on v1-only fallback).
  const v2 = JSON.parse(raw(KEY_V2))
  assert.equal(v2.index, 15)
  assert.equal(v2.id, route[15].id)
  pass('7b corrupt v2 + writeProgress(3) migrates tip 15 into v2; v1 untouched (R0w)')
}
// Mirrored-v1 tip 3 must differ (control)
store.clear()
seedV1(3)
seedV2(3, {})
writeProgress(3)
{
  // If someone dual-wrote v1 down to 3 after a heal-from-15 scenario, that
  // would regress. Control: with only tip 3, read stays 3 — differs from 15.
  assert.equal(readProgress().index, 3)
  pass('7c mirrored tip-3 control differs from tip-15 resume')
}

// --- 8. R0x: with shim, write/read works; without window both null ---
store.clear()
writeProgress(1)
assert.ok(readProgress())
pass('8a with window.localStorage shim, write+read non-null (R0x)')
{
  const savedWindow = globalThis.window
  delete globalThis.window
  assert.equal(readProgress(), null)
  writeProgress(2)
  // restore then confirm still at prior tip (write was no-op without window)
  globalThis.window = savedWindow
  // Without window the write was a no-op; tip still 1 from before.
  assert.equal(readProgress()?.index, 1)
  pass('8b without window, read null and write is no-op (R0x control)')
}

// --- normalizeOutcomes export sanity ---
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

if (process.exitCode) {
  console.error('progress.verify.mjs: FAILED')
  process.exit(1)
}
console.log('progress.verify.mjs: OK')
