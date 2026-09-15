import { route } from './route'
import { isStoredToken } from './stopStatus'

/**
 * How far a visitor got last time, plus per-stop outcomes when known.
 *
 * v1 (`htae.drive.progress.v1`) stores `{ index, id }` only. v2
 * (`htae.drive.progress.v2`) adds `outcomes` keyed by stop id. Prefer v2 when
 * the key is present; fall back to v1 only when v2 is absent. Never invent
 * outcomes from a v1 index. Never delete v1 on first v2 write. Never setItem
 * v1 from write / heal / clear rewrite (R0w / Q1699).
 *
 * Alternate structure: one tip parser + a sealed Prior snapshot for the write
 * path, so heal (R0k) and re-read (R0t) cannot leak a pre-heal parse.
 *
 * Every access is wrapped: `localStorage` throws outright in Safari private
 * mode, with cookies blocked, and in some embedded webviews. A storage failure
 * must degrade to "no saved progress", never to a broken page.
 */

// Literal v1 key kept forever for resume fallback (R0w clause 1).
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

function routeIdSet() {
  return new Set(route.map((stop) => stop.id))
}

/** Whitelist stored tokens and current-route stop ids (R0e / R0g). */
export function normalizeOutcomes(raw) {
  if (!isPlainObject(raw)) return {}
  const ids = routeIdSet()
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
 * @returns {{ kind: 'absent' } | { kind: 'corrupt' } | {
 *   kind: 'ok', index: number, id: string, stop: object,
 *   outcomesRaw: unknown, outcomesPlain: boolean, outcomes: object
 * }}
 */
function parseTip(raw) {
  if (raw == null || raw === '') return { kind: 'absent' }
  let saved
  try {
    saved = JSON.parse(raw)
  } catch {
    return { kind: 'corrupt' }
  }
  if (!isPlainObject(saved)) return { kind: 'corrupt' }

  const index = Number(saved?.index)
  if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
    return { kind: 'corrupt' }
  }
  const stop = route[index]
  if (!stop || stop.id !== saved.id) return { kind: 'corrupt' }

  const outcomesPlain = isPlainObject(saved.outcomes)
  return {
    kind: 'ok',
    index,
    id: stop.id,
    stop,
    outcomesRaw: saved.outcomes,
    outcomesPlain,
    // Soft-recover missing / null / array / non-plain to {} (R0p).
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
 * Public read. Prefer v2 when the key exists. Corrupt / id-mismatched v2 →
 * null with no v1 fall-through (R0c). Soft-recover bad outcomes (R0p).
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const v2Raw = readRaw(store, KEY_V2)
    if (v2Raw != null) {
      const tip = parseTip(v2Raw)
      if (tip.kind !== 'ok') return null
      return toPublic(tip.index, tip.stop, tip.outcomes)
    }

    const v1Raw = readRaw(store, KEY_V1)
    if (v1Raw == null) return null
    const tip = parseTip(v1Raw)
    if (tip.kind !== 'ok') return null
    return toPublic(tip.index, tip.stop, {})
  } catch {
    return null
  }
}

/** Empty prior used when neither key yields a usable tip. */
function emptyPrior() {
  return { source: 'none', index: 0, outcomes: {}, outcomesPlain: true }
}

/**
 * R0k heal: remove corrupt / id-mismatched v2 before the forward-only floor.
 * Bad outcomes alone is not heal-corrupt (R0p).
 */
function healCorruptV2(store) {
  const raw = readRaw(store, KEY_V2)
  if (raw == null || raw === '') return
  const tip = parseTip(raw)
  if (tip.kind === 'ok') return
  try {
    store.removeItem(KEY_V2)
  } catch {
    // Best-effort heal.
  }
}

/**
 * R0t: after heal, re-bind prior from storage. Never keep a pre-heal parse.
 * source: 'v2' | 'v1' | 'none' - early-return only applies to a live v2 tip so
 * a post-heal write still migrates v1 → v2 (R0w / H1).
 */
function bindPrior(store) {
  const v2Raw = readRaw(store, KEY_V2)
  if (v2Raw != null && v2Raw !== '') {
    const tip = parseTip(v2Raw)
    if (tip.kind === 'ok') {
      return {
        source: 'v2',
        index: tip.index,
        // R0q: soft-recovered outcomes ready for spread-merge.
        outcomes: tip.outcomes,
        // R0s / R0r: dirty signal is raw plain-ness, not public soft-recover.
        outcomesPlain: tip.outcomesPlain,
      }
    }
    return emptyPrior()
  }

  const v1Raw = readRaw(store, KEY_V1)
  if (v1Raw == null || v1Raw === '') return emptyPrior()
  const tip = parseTip(v1Raw)
  if (tip.kind !== 'ok') return emptyPrior()
  return {
    source: 'v1',
    index: tip.index,
    outcomes: {},
    outcomesPlain: true,
  }
}

function isNoPatch(outcomesPatch) {
  // R0d: omit / undefined / null / {} / non-object = no-patch.
  if (outcomesPatch == null) return true
  if (!isPlainObject(outcomesPatch)) return true
  return Object.keys(outcomesPatch).length === 0
}

/**
 * Remember an exit. Index only ever advances (R0l). Outcomes merge.
 *
 * Index-only / empty / non-object patch preserves prior outcomes (R0 / R0d).
 * Nonempty normalized patch bypasses the forward-only early-return but still
 * stores max(previous, caller) and id from route[storedIndex] (R0b / R0l / R0v).
 * Writes setItem only on v2 (R0w).
 */
export function writeProgress(index, outcomesPatch) {
  const store = storage()
  if (!store) return

  const callerStop = route[index]
  if (!callerStop || index <= 0) return

  try {
    healCorruptV2(store)
    const prior = bindPrior(store)

    const patchObject = isNoPatch(outcomesPatch) ? null : outcomesPatch
    // R0o: normalize patch first; omit invalid keys; then merge.
    const normalizedPatch = patchObject ? normalizeOutcomes(patchObject) : {}
    const hasPatch = Object.keys(normalizedPatch).length > 0

    // Forward-only early-return only for an existing v2 tip (R0d / R0r).
    // After heal the tip may live only in v1 - still write v2 so migration
    // does not depend on a missing key (R0w / H1).
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

    // R0n: shallow-merge; never replace the whole map.
    const outcomes = normalizeOutcomes({
      ...prior.outcomes,
      ...normalizedPatch,
    })

    // R0w clause 2: setItem only v2. Never mirror into v1.
    // R0v: id tracks max'd index, not the caller index.
    store.setItem(
      KEY_V2,
      JSON.stringify({
        index: storedIndex,
        id: storedStop.id,
        outcomes,
      })
    )
  } catch {
    // Storage full or unavailable - losing progress is not worth an error.
  }
}

/**
 * Forget resume. Removes both version keys only (R0j / Q1699).
 * Each remove runs in its own try/catch (R0u). Never Storage.clear().
 */
export function clearProgress() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY_V1)
  } catch {
    // Continue so a throw on v1 cannot skip v2 (R0u).
  }
  try {
    store.removeItem(KEY_V2)
  } catch {
    // Nothing to do; the caller already treats this as best-effort.
  }
}
