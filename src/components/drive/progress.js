import { route } from './route'
import { isStoredToken } from './stopStatus'

/**
 * How far a visitor got last time, plus per-stop outcomes when known.
 *
 * Dual-key (R0w):
 *   - keep literal `htae.drive.progress.v1` for resume fallback
 *   - sibling `htae.drive.progress.v2` holds `{ index, id, outcomes }`
 * Prefer v2 when the key is present. Fall back to v1 only when v2 is absent.
 * Never invent outcomes from a v1 index. Never delete v1 on first v2 write.
 * After migration, setItem only the v2 key; only clearProgress removeItem(v1).
 *
 * Every access is wrapped: `localStorage` throws in Safari private mode, with
 * cookies blocked, and in some embedded webviews. Storage failure must degrade
 * to "no saved progress", never to a broken page.
 */

const KEY_V1 = 'htae.drive.progress.v1'
const KEY_V2 = 'htae.drive.progress.v2'

function storage() {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function knownStopIds() {
  return new Set(route.map((stop) => stop.id))
}

/** Drop unknown ids and non-whitelist tokens (R0e / R0g). */
function normalizeOutcomes(raw) {
  if (!isPlainObject(raw)) return {}
  const ids = knownStopIds()
  const out = {}
  for (const [key, token] of Object.entries(raw)) {
    if (!ids.has(key)) continue
    if (!isStoredToken(token)) continue
    out[key] = token
  }
  return out
}

function toPublic(index, stop, outcomes) {
  return {
    index,
    id: stop.id,
    title: stop.title,
    label: stop.exitLabel,
    outcomes,
  }
}

/**
 * Parse a stored tip blob.
 * Returns { ok:false, reason } or { ok:true, index, stop, outcomes, outcomesPlain }.
 * Empty / non-JSON / non-plain root / bad index / id mismatch → not ok (R0c).
 * Bad outcomes alone still ok with soft-recovered {} (R0p).
 */
function parseBlob(raw) {
  if (raw == null || raw === '') return { ok: false, reason: 'empty' }

  let saved
  try {
    saved = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'json' }
  }
  if (!isPlainObject(saved)) return { ok: false, reason: 'root' }

  const index = Number(saved.index)
  if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
    return { ok: false, reason: 'index' }
  }
  const stop = route[index]
  if (!stop || stop.id !== saved.id) return { ok: false, reason: 'id' }

  const outcomesPlain = isPlainObject(saved.outcomes)
  return {
    ok: true,
    index,
    stop,
    outcomesPlain,
    outcomes: outcomesPlain ? normalizeOutcomes(saved.outcomes) : {},
  }
}

function readRaw(store, key) {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

/**
 * Furthest exit reached, or null.
 * Present-but-invalid v2 → null; no v1 fall-through (R0c).
 * Soft-recover bad outcomes to {} when index/id match (R0p).
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const v2Raw = readRaw(store, KEY_V2)
    if (v2Raw != null) {
      const tip = parseBlob(v2Raw)
      if (!tip.ok) return null
      return toPublic(tip.index, tip.stop, tip.outcomes)
    }

    const v1Raw = readRaw(store, KEY_V1)
    if (v1Raw == null) return null
    const tip = parseBlob(v1Raw)
    if (!tip.ok) return null
    return toPublic(tip.index, tip.stop, {})
  } catch {
    return null
  }
}

/**
 * Heal corrupt / id-mismatched / empty v2 before the forward-only floor (R0k).
 * Empty string counts as heal-corrupt so an orphaned v1 tip still gates.
 */
function healCorruptV2(store) {
  const raw = readRaw(store, KEY_V2)
  if (raw == null) return
  const tip = parseBlob(raw)
  if (tip.ok) return
  try {
    store.removeItem(KEY_V2)
  } catch {
    // Best-effort heal.
  }
}

/**
 * Load prior tip after heal (R0t). Prefer valid v2; else v1 for index floor only.
 * outcomesPlain reflects raw stored shape (R0s), never the public soft-recover.
 * source: 'v2' | 'v1' | 'none' so early-return only gates a live v2 tip (R0w).
 */
function loadPrior(store) {
  const v2Raw = readRaw(store, KEY_V2)
  if (v2Raw != null) {
    const tip = parseBlob(v2Raw)
    if (tip.ok) {
      return {
        source: 'v2',
        index: tip.index,
        outcomes: tip.outcomes,
        outcomesPlain: tip.outcomesPlain,
      }
    }
    // Present but still unusable after heal attempt: ignore for floor; do not
    // invent a lower tip. Callers still may advance from 0.
  }

  const v1Raw = readRaw(store, KEY_V1)
  if (v1Raw == null) {
    return { source: 'none', index: 0, outcomes: {}, outcomesPlain: true }
  }
  const tip = parseBlob(v1Raw)
  if (!tip.ok) {
    return { source: 'none', index: 0, outcomes: {}, outcomesPlain: true }
  }
  return {
    source: 'v1',
    index: tip.index,
    outcomes: {},
    outcomesPlain: true,
  }
}

/**
 * Remember an exit. Stored index only advances (R0l / R0v).
 * Outcomes shallow-merge. setItem only v2 (R0w).
 */
export function writeProgress(index, outcomesPatch) {
  const store = storage()
  if (!store) return
  if (!route[index] || index <= 0) return

  try {
    healCorruptV2(store)
    // R0t: discard pre-heal parse; re-read only.
    const prior = loadPrior(store)

    const patchObject = isPlainObject(outcomesPatch) ? outcomesPatch : null
    // R0o: normalize patch first; omit invalid keys; then merge.
    const normalizedPatch = patchObject ? normalizeOutcomes(patchObject) : {}
    const hasPatch = Object.keys(normalizedPatch).length > 0

    // R0d early-return only for a live v2 tip with plain outcomes and no patch.
    // After heal the tip may live only in v1; still write v2 so migration does
    // not depend on a missing key (R0w). R0r: non-plain raw bypasses rewrite.
    if (
      prior.source === 'v2' &&
      prior.index >= index &&
      !hasPatch &&
      prior.outcomesPlain
    ) {
      return
    }

    const storedIndex = Math.max(prior.index, index)
    const storedStop = route[storedIndex]
    if (!storedStop) return

    // R0q: soft-recovered prior already; never spread raw array/string.
    const outcomes = normalizeOutcomes({
      ...prior.outcomes,
      ...normalizedPatch,
    })

    store.setItem(
      KEY_V2,
      JSON.stringify({
        index: storedIndex,
        id: storedStop.id,
        outcomes,
      })
    )
  } catch {
    // Storage full or unavailable. Losing progress is not worth an error.
  }
}

/**
 * Forget resume. removeItem both keys only (R0j / Q1699).
 * Independent try/catch per key (R0u). Never Storage.clear(). Never rewrite-empty v1.
 */
export function clearProgress() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY_V1)
  } catch {
    // Continue so a throw on v1 cannot skip v2.
  }
  try {
    store.removeItem(KEY_V2)
  } catch {
    // Best-effort.
  }
}
