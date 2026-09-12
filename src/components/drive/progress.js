import { route } from './route'
import { isStoredToken } from './stopStatus'

/**
 * How far a visitor got last time, plus per-stop outcomes when known.
 *
 * v1 (`htae.drive.progress.v1`) stores `{ index, id }` only. v2
 * (`htae.drive.progress.v2`) adds `outcomes` keyed by stop id. Prefer v2 when
 * the key is present; fall back to v1 only when v2 is absent. Never invent
 * outcomes from a v1 index. Never delete v1 on first v2 write (R0w / Q1699).
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

function routeIds() {
  return new Set(route.map((stop) => stop.id))
}

/** Whitelist stored tokens and current-route stop ids (R0e / R0g). */
export function normalizeOutcomes(raw) {
  if (!isPlainObject(raw)) return {}
  const ids = routeIds()
  const out = {}
  for (const [key, token] of Object.entries(raw)) {
    if (!ids.has(key)) continue
    if (!isStoredToken(token)) continue
    out[key] = token
  }
  return out
}

function publicShape(index, stop, outcomes) {
  return {
    index,
    id: stop.id,
    title: stop.title,
    label: stop.exitLabel,
    outcomes,
  }
}

/**
 * Parse a stored tip. `kind: 'absent' | 'corrupt' | 'ok'`.
 * Bad outcomes alone still yields `ok` with soft-recovered `{}` (R0p).
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
    outcomes: outcomesPlain ? normalizeOutcomes(saved.outcomes) : {},
  }
}

function readV1Tip(store) {
  try {
    const raw = store.getItem(KEY_V1)
    if (!raw) return null
    const tip = parseTip(raw)
    if (tip.kind !== 'ok') return null
    return tip
  } catch {
    return null
  }
}

/**
 * The furthest exit reached, or null. Returns null rather than throwing for
 * anything unparseable, out of range, or pointing at a stop that has since
 * moved — an index alone is not enough to trust once the content can change.
 *
 * When v2 is present but corrupt / id-mismatched, return null (R0c). Do not
 * fall through to v1. Soft-recover bad outcomes shapes to {} (R0p).
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const v2Raw = store.getItem(KEY_V2)
    if (v2Raw != null) {
      const tip = parseTip(v2Raw)
      if (tip.kind !== 'ok') return null
      return publicShape(tip.index, tip.stop, tip.outcomes)
    }

    const v1 = readV1Tip(store)
    if (!v1) return null
    return publicShape(v1.index, v1.stop, {})
  } catch {
    return null
  }
}

/**
 * Remember an exit. Index only ever advances (R0l). Outcomes merge.
 *
 * `writeProgress(index)` with no / empty / non-object patch preserves prior
 * outcomes (R0 / R0d). A nonempty normalized patch bypasses the forward-only
 * early-return but still stores max(previous, caller) (R0b / R0l / R0v).
 * Writes setItem only on v2 (R0w).
 */
export function writeProgress(index, outcomesPatch) {
  const store = storage()
  if (!store) return

  const callerStop = route[index]
  if (!callerStop || index <= 0) return

  try {
    // R0k: heal corrupt / id-mismatched v2 before the forward-only floor.
    // Bad outcomes alone is not heal-corrupt (R0p).
    const v2Before = store.getItem(KEY_V2)
    if (v2Before != null) {
      const probe = parseTip(v2Before)
      if (probe.kind !== 'ok') {
        try {
          store.removeItem(KEY_V2)
        } catch {
          // Best-effort heal.
        }
      }
    }

    // R0t: discard any pre-heal parse; re-read after heal.
    let previousIndex = 0
    let priorOutcomes = {}
    let outcomesPlain = true

    const v2Raw = store.getItem(KEY_V2)
    if (v2Raw != null) {
      const tip = parseTip(v2Raw)
      if (tip.kind === 'ok') {
        previousIndex = tip.index
        // R0s / R0r: dirty check uses raw outcomesPlain, not public soft-recover.
        outcomesPlain = tip.outcomesPlain
        // R0q: soft-recover before any spread.
        priorOutcomes = tip.outcomes
      }
    } else {
      const v1 = readV1Tip(store)
      if (v1) {
        previousIndex = v1.index
        priorOutcomes = {}
        outcomesPlain = true
      }
    }

    const patchObject = isPlainObject(outcomesPatch) ? outcomesPatch : null
    // R0o: normalize patch first; omit invalid keys; then merge.
    const normalizedPatch = patchObject ? normalizeOutcomes(patchObject) : {}
    const hasPatch = Object.keys(normalizedPatch).length > 0

    // Forward-only early-return when no patch and outcomes already plain (R0d).
    // Non-plain raw outcomes bypass and rewrite soft-recovered {} (R0r).
    if (previousIndex >= index && !hasPatch && outcomesPlain) {
      return
    }

    const storedIndex = Math.max(previousIndex, index)
    const storedStop = route[storedIndex]
    if (!storedStop) return

    const outcomes = normalizeOutcomes({ ...priorOutcomes, ...normalizedPatch })

    // R0w clause 2: setItem only v2. Never mirror into v1.
    store.setItem(
      KEY_V2,
      JSON.stringify({
        index: storedIndex,
        id: storedStop.id,
        outcomes,
      })
    )
  } catch {
    // Storage full or unavailable — losing progress is not worth an error.
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
