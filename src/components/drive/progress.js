import { route } from './route'

/**
 * How far a visitor got last time, plus per-stop disposition (Q053).
 *
 * The route is 21 exits long, so someone who reads a few and comes back later
 * would otherwise be dropped at MILE 0 with no way back except driving the
 * whole thing again. This remembers the furthest exit and whether each stop
 * was arrived (UI: passed) or skipped , but nothing here ever *applies* it.
 * The ignition screen offers it and the visitor chooses, so no one is ever
 * trapped mid-route by state they did not ask for.
 *
 * Every access is wrapped: `localStorage` throws outright in Safari private
 * mode, with cookies blocked, and in some embedded webviews. A storage failure
 * must degrade to "no saved progress", never to a broken page.
 *
 * Dictionary (st011): disposition `arrived` ↔ UI passed; `skipped` ↔ UI
 * skipped; unset = never reached. st071 pass-through must emit `skipped`,
 * never silently alias emit-passed to UI-passed.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem
 */

// Versioned: bump drops legacy shape that could not encode skip vs arrive.
const KEY = 'htae.drive.progress.v2'
const LEGACY_KEY = 'htae.drive.progress.v1'

const OUTCOMES = new Set(['arrived', 'skipped'])

function storage() {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Normalize a raw outcomes object into `{ [index]: 'arrived'|'skipped' }`.
 * Unknown keys and values are dropped.
 */
export function normalizeOutcomes(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    const index = Number(key)
    if (!Number.isInteger(index) || index < 0) continue
    if (!OUTCOMES.has(value)) continue
    out[String(index)] = value
  }
  return out
}

/**
 * Serialize a Map (or plain object) of stop dispositions for storage.
 */
export function outcomesFromStatus(status) {
  if (!status) return {}
  if (status instanceof Map) {
    const out = {}
    for (const [index, value] of status) {
      if (!OUTCOMES.has(value)) continue
      if (!Number.isInteger(index) || index < 0) continue
      out[String(index)] = value
    }
    return out
  }
  return normalizeOutcomes(status)
}

function packResume(index, id, outcomes) {
  const stop = route[index]
  if (!stop || stop.id !== id) return null
  return {
    index,
    id: stop.id,
    title: stop.title,
    label: stop.exitLabel,
    outcomes: normalizeOutcomes(outcomes),
  }
}

/**
 * Legacy v1 only stored furthest index and implied every prior stop was
 * arrived. Migrating that shape fills 0..index as arrived , correct for
 * pre-skip data, never invents skipped.
 */
function migrateLegacy(store) {
  try {
    const raw = store.getItem(LEGACY_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    const index = Number(saved?.index)
    if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
      return null
    }
    const stop = route[index]
    if (!stop || stop.id !== saved.id) return null

    const outcomes = {}
    for (let i = 0; i <= index; i += 1) outcomes[String(i)] = 'arrived'
    return packResume(index, stop.id, outcomes)
  } catch {
    return null
  }
}

/**
 * The furthest exit reached, or null. Returns null rather than throwing for
 * anything unparseable, out of range, or pointing at a stop that has since
 * moved , an index alone is not enough to trust once the content can change.
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const index = Number(saved?.index)
      if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
        return null
      }
      const stop = route[index]
      if (!stop || stop.id !== saved.id) return null
      return packResume(index, stop.id, saved.outcomes)
    }

    return migrateLegacy(store)
  } catch {
    return null
  }
}

/**
 * Remember furthest exit + per-stop outcomes. Furthest index only moves
 * forward; outcomes always rewrite so a later skip is not stuck as arrived.
 */
export function writeProgress(index, status) {
  const store = storage()
  if (!store) return

  const stop = route[index]
  if (!stop || index <= 0) return

  try {
    const previous = readProgress()
    const outcomes =
      status != null ? outcomesFromStatus(status) : (previous?.outcomes ?? {})
    const nextIndex =
      previous && previous.index > index ? previous.index : index
    const nextStop = route[nextIndex]
    if (!nextStop) return

    store.setItem(
      KEY,
      JSON.stringify({
        index: nextIndex,
        id: nextStop.id,
        outcomes: normalizeOutcomes(outcomes),
      }),
    )
    try {
      store.removeItem(LEGACY_KEY)
    } catch {
      // Best-effort legacy cleanup.
    }
  } catch {
    // Storage full or unavailable , losing progress is not worth an error.
  }
}

export function clearProgress() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY)
    store.removeItem(LEGACY_KEY)
  } catch {
    // Nothing to do; the caller already treats this as best-effort.
  }
}
