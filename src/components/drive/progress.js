import { route } from './route'
import {
  isPlainObject,
  normalizeOutcomes,
  normalizeOutcomesPatch,
} from './stopStatus'

/**
 * How far a visitor got last time, plus per-stop outcome tokens (v2).
 *
 * The route is 21 exits long, so someone who reads a few and comes back later
 * would otherwise be dropped at MILE 0 with no way back except driving the
 * whole thing again. This remembers the furthest exit - but nothing here ever
 * *applies* it. The ignition screen offers it and the visitor chooses, so no
 * one is ever trapped mid-route by state they did not ask for.
 *
 * Every access is wrapped: `localStorage` throws outright in Safari private
 * mode, with cookies blocked, and in some embedded webviews. A storage failure
 * must degrade to "no saved progress", never to a broken page.
 *
 * v2 key holds `{ index, id, outcomes: { [stopId]: taken|skipped|jumped } }`.
 * v1 key stays readable for resume until clearProgress; write never setItem(v1).
 */

// Literal v1 string kept for resume fallback (R0w). Sibling v2 is the only write target.
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

/**
 * Parse a progress blob. Returns null when index/id are unusable (R0c corrupt).
 * Soft-recovers non-plain outcomes to {} when index/id still match (R0p).
 * @param {string|null} raw
 * @returns {{ index: number, id: string, outcomes: Record<string, string>, outcomesPlain: boolean }|null}
 */
function parseBlob(raw) {
  if (!raw) return null
  let saved
  try {
    saved = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isPlainObject(saved)) return null

  const index = Number(saved.index)
  if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
    return null
  }

  const stop = route[index]
  if (!stop || stop.id !== saved.id) return null

  const outcomesPlain = isPlainObject(saved.outcomes)
  const outcomes = normalizeOutcomes(outcomesPlain ? saved.outcomes : {}, route)

  return { index, id: stop.id, outcomes, outcomesPlain }
}

function publicShape(parsed) {
  const stop = route[parsed.index]
  return {
    index: parsed.index,
    id: stop.id,
    title: stop.title,
    label: stop.exitLabel,
    outcomes: { ...parsed.outcomes },
  }
}

/**
 * Read raw v2 string only (for dirty-check R0s). Does not soft-recover.
 */
function rawV2OutcomesField(store) {
  try {
    const raw = store.getItem(KEY_V2)
    if (!raw) return { present: false, field: undefined }
    const saved = JSON.parse(raw)
    if (!isPlainObject(saved))
      return { present: true, field: undefined, corrupt: true }
    return { present: true, field: saved.outcomes, corrupt: false }
  } catch {
    return { present: true, field: undefined, corrupt: true }
  }
}

/**
 * The furthest exit reached, or null. Prefer v2; fall back to v1 only when
 * the v2 key is absent. Corrupt / id-mismatched v2 returns null (R0c).
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const rawV2 = store.getItem(KEY_V2)
    if (rawV2 != null && rawV2 !== '') {
      const parsed = parseBlob(rawV2)
      // v2 key present: never fall through to v1 (R0c)
      if (!parsed) return null
      return publicShape(parsed)
    }

    const rawV1 = store.getItem(KEY_V1)
    if (!rawV1) return null
    const parsed = parseBlob(rawV1)
    if (!parsed) return null
    // v1 has no outcomes; never invent them from the index (A1)
    return {
      index: parsed.index,
      id: parsed.id,
      title: route[parsed.index].title,
      label: route[parsed.index].exitLabel,
      outcomes: {},
    }
  } catch {
    return null
  }
}

/**
 * Private read for write path: prefer healed v2, else v1 tip. Returns parsed
 * blob or null. Used after optional R0k heal.
 */
function readForWrite(store) {
  const rawV2 = store.getItem(KEY_V2)
  if (rawV2 != null && rawV2 !== '') {
    const parsed = parseBlob(rawV2)
    if (parsed) return { source: 'v2', parsed }
    return { source: 'v2-corrupt', parsed: null }
  }
  const rawV1 = store.getItem(KEY_V1)
  if (!rawV1) return { source: 'none', parsed: null }
  const parsed = parseBlob(rawV1)
  if (!parsed) return { source: 'none', parsed: null }
  return {
    source: 'v1',
    parsed: { ...parsed, outcomes: {}, outcomesPlain: true },
  }
}

/**
 * Remember an exit (forward-only on stored index) and merge outcome patches.
 *
 * @param {number} index
 * @param {Record<string, string>|null|undefined} [outcomesPatch]
 */
export function writeProgress(index, outcomesPatch) {
  const store = storage()
  if (!store) return

  if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) return
  if (!route[index]) return

  try {
    // R0k: heal corrupt / id-mismatched v2 before forward-only floor
    let prior = readForWrite(store)
    if (prior.source === 'v2-corrupt') {
      try {
        store.removeItem(KEY_V2)
      } catch {
        // best-effort heal
      }
      // R0t: discard pre-heal parse; re-read only
      prior = readForWrite(store)
    }

    const previous = prior.parsed
    const normalizedPatch = normalizeOutcomesPatch(outcomesPatch, route)
    const hasPatch = Object.keys(normalizedPatch).length > 0

    // R0s: dirty-check inspects raw stored outcomes, not public soft-recover
    const rawMeta = rawV2OutcomesField(store)
    const rawOutcomesDirty =
      prior.source === 'v2' &&
      rawMeta.present &&
      !rawMeta.corrupt &&
      !isPlainObject(rawMeta.field)

    // R0d / R0b: no-patch = omit / undefined / null / {} / non-object
    const noPatch =
      outcomesPatch === undefined ||
      outcomesPatch === null ||
      !isPlainObject(outcomesPatch) ||
      Object.keys(normalizeOutcomesPatch(outcomesPatch, route)).length === 0

    // Forward-only early-return only when a valid v2 tip already exists, no
    // meaningful patch, and raw outcomes already plain (R0d / R0r / R0s).
    // After R0k heal the tip may only live in v1 — still write v2 (migration /
    // heal persist) so resume does not depend on a missing key.
    if (
      prior.source === 'v2' &&
      previous &&
      previous.index >= index &&
      noPatch &&
      !hasPatch &&
      !rawOutcomesDirty &&
      previous.outcomesPlain
    ) {
      return
    }

    // Nonempty patch bypasses early-return; stored index still only advances (R0b / R0l)
    const storedIndex = Math.max(previous?.index ?? 0, index)
    const stop = route[storedIndex]
    if (!stop) return

    // R0q: soft-recover prior outcomes before any spread-merge
    const priorOutcomes =
      previous && previous.outcomesPlain
        ? normalizeOutcomes(previous.outcomes, route)
        : {}

    // R0n / R0o: shallow-merge normalized patch into prior; never replace whole map
    const outcomes = { ...priorOutcomes, ...normalizedPatch }

    // R0w: setItem only v2; never setItem v1
    store.setItem(
      KEY_V2,
      JSON.stringify({ index: storedIndex, id: stop.id, outcomes })
    )
  } catch {
    // Storage full or unavailable — losing progress is not worth an error.
  }
}

/**
 * Forget both progress keys. Never Storage.clear() (R0j / Q1699).
 * Independent try/catch per key (R0u).
 */
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

// Exported for verify harnesses only; not a public Drive API.
export const __progressKeys = Object.freeze({ v1: KEY_V1, v2: KEY_V2 })
