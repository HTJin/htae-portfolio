import { route } from './route'
import { isStoredToken } from './stopStatus'

/**
 * How far a visitor got last time, plus per-stop outcomes (v2).
 *
 * v2 (`htae.drive.progress.v2`) holds `{ index, id, outcomes }` keyed by stop
 * id. v1 is resume-only: read when v2 is absent, never rewritten after
 * migration starts (R0w). clearProgress removes both keys (Q1699).
 *
 * Every access is wrapped: `localStorage` throws outright in Safari private
 * mode, with cookies blocked, and in some embedded webviews. A storage failure
 * must degrade to "no saved progress", never to a broken page.
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
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** Soft-recover missing / null / array / non-plain outcomes to {} (R0p / R0q). */
function softOutcomes(raw) {
  if (!isPlainObject(raw)) return {}
  return raw
}

/**
 * Keep only current-route stop ids and stored tokens taken|skipped|jumped.
 * Drops unreached, unknowns, and index keys (R0e / R0g / R0o).
 */
function normalizeOutcomes(raw) {
  const src = softOutcomes(raw)
  const out = {}
  const validIds = new Set(route.map((s) => s.id))
  for (const [key, token] of Object.entries(src)) {
    if (!validIds.has(key)) continue
    if (!isStoredToken(token)) continue
    out[key] = token
  }
  return out
}

function normalizePatch(patch) {
  if (patch == null || typeof patch !== 'object' || Array.isArray(patch)) {
    return {}
  }
  return normalizeOutcomes(patch)
}

function isNoPatch(patch) {
  // omit / undefined / null / {} / non-object = no-patch (R0d)
  if (patch === undefined || patch === null) return true
  if (typeof patch !== 'object' || Array.isArray(patch)) return true
  return Object.keys(normalizePatch(patch)).length === 0
}

/**
 * Parse a stored blob. Returns:
 * - { kind: 'absent' }
 * - { kind: 'corrupt' }  parse fail / bad root / bad index / id mismatch
 * - { kind: 'ok', index, id, outcomes, outcomesDirty }
 *   outcomesDirty true when raw outcomes were non-plain (R0s)
 */
function parseBlob(raw) {
  if (raw == null || raw === '') return { kind: 'absent' }
  let saved
  try {
    saved = JSON.parse(raw)
  } catch {
    return { kind: 'corrupt' }
  }
  if (!isPlainObject(saved)) return { kind: 'corrupt' }

  const index = Number(saved.index)
  if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
    return { kind: 'corrupt' }
  }
  const stop = route[index]
  if (!stop || stop.id !== saved.id) return { kind: 'corrupt' }

  const outcomesDirty = !isPlainObject(saved.outcomes)
  return {
    kind: 'ok',
    index,
    id: stop.id,
    outcomes: softOutcomes(saved.outcomes),
    outcomesDirty,
  }
}

function publicFromOk(ok) {
  const stop = route[ok.index]
  return {
    index: ok.index,
    id: ok.id,
    title: stop.title,
    label: stop.exitLabel,
    outcomes: normalizeOutcomes(ok.outcomes),
  }
}

function readV1Raw(store) {
  try {
    return store.getItem(KEY_V1)
  } catch {
    return null
  }
}

function readV2Raw(store) {
  try {
    return store.getItem(KEY_V2)
  } catch {
    return null
  }
}

/**
 * Prefer v2. If v2 absent, resume from v1 with empty outcomes.
 * Corrupt / id-mismatched v2 → null (no v1 fall-through) (R0c).
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const v2raw = readV2Raw(store)
    if (v2raw != null && v2raw !== '') {
      const parsed = parseBlob(v2raw)
      if (parsed.kind === 'corrupt') return null
      if (parsed.kind === 'ok') return publicFromOk(parsed)
      return null
    }

    const v1raw = readV1Raw(store)
    if (v1raw == null || v1raw === '') return null
    const parsed = parseBlob(v1raw)
    if (parsed.kind !== 'ok') return null
    return {
      ...publicFromOk(parsed),
      outcomes: {},
    }
  } catch {
    return null
  }
}

/**
 * Private tip used by write: prefer valid v2; else valid v1.
 * Does not apply R0c (write may heal corrupt v2 first).
 */
function readTipForWrite(store) {
  const v2raw = readV2Raw(store)
  if (v2raw != null && v2raw !== '') {
    const parsed = parseBlob(v2raw)
    if (parsed.kind === 'ok') return { source: 'v2', ...parsed }
    if (parsed.kind === 'corrupt') return { source: 'v2-corrupt' }
  }
  const v1raw = readV1Raw(store)
  if (v1raw != null && v1raw !== '') {
    const parsed = parseBlob(v1raw)
    if (parsed.kind === 'ok') {
      return {
        source: 'v1',
        index: parsed.index,
        id: parsed.id,
        outcomes: {},
        outcomesDirty: false,
      }
    }
  }
  return { source: 'none' }
}

/**
 * Remember an exit (forward-only on index) and optionally merge outcomes.
 * Index-only callers (DriveScene until st134) must preserve prior outcomes (R0).
 * Never setItem v1 (R0w).
 */
export function writeProgress(index, outcomesPatch) {
  const store = storage()
  if (!store) return

  if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) return
  if (!route[index]) return

  try {
    let tip = readTipForWrite(store)

    // R0k / R0t: heal corrupt v2 before the forward-only floor; discard pre-heal.
    if (tip.source === 'v2-corrupt') {
      try {
        store.removeItem(KEY_V2)
      } catch {
        // best-effort heal
      }
      tip = readTipForWrite(store)
    }

    const previousIndex = tip.source === 'none' ? 0 : tip.index
    const priorOutcomes =
      tip.source === 'none' ? {} : softOutcomes(tip.outcomes)
    const outcomesDirty = tip.source === 'v2' && tip.outcomesDirty === true

    const patch = normalizePatch(outcomesPatch)
    const noPatch = isNoPatch(outcomesPatch)

    // Forward-only early-return (R0 / R0b / R0d / R0r):
    // Only when a valid v2 tip already exists. A v1 tip must still migrate to
    // v2 (R0w / R0k heal persist) even when the caller index does not advance.
    if (
      tip.source === 'v2' &&
      previousIndex >= index &&
      noPatch &&
      !outcomesDirty
    ) {
      return
    }

    const storedIndex = Math.max(previousIndex, index)
    const stop = route[storedIndex]
    if (!stop) return

    // R0n / R0o: normalize then shallow-merge; never erase prior valid with garbage.
    const merged = { ...normalizeOutcomes(priorOutcomes), ...patch }

    const blob = {
      index: storedIndex,
      id: stop.id, // R0v: id from route[storedIndex], never caller index
      outcomes: merged,
    }

    store.setItem(KEY_V2, JSON.stringify(blob))
    // R0w: never setItem KEY_V1
  } catch {
    // Storage full or unavailable. Losing progress is not worth an error.
  }
}

/** Forget both keys. Never Storage.clear(). Independent try per key (R0j / R0u / Q1699). */
export function clearProgress() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY_V1)
  } catch {
    // continue to v2
  }
  try {
    store.removeItem(KEY_V2)
  } catch {
    // best-effort
  }
}
