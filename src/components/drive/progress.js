import { route } from './route'
import { isDisposition } from './disposition'

/**
 * How far a visitor got last time, plus per-stop disposition (st011 / Q053).
 *
 * The route is 21 exits long, so someone who reads a few and comes back later
 * would otherwise be dropped at MILE 0 with no way back except driving the
 * whole thing again. This remembers the furthest exit and each stop's outcome
 * (`arrived` / `skipped`). Nothing here ever *applies* it. The ignition
 * screen offers it and the visitor chooses, so no one is ever trapped mid-route
 * by state they did not ask for.
 *
 * Every access is wrapped: `localStorage` throws outright in Safari private
 * mode, with cookies blocked, and in some embedded webviews. A storage failure
 * must degrade to "no saved progress", never to a broken page.
 *
 * v2 stores outcomes so a skip is never painted as passed on resume. v1 entries
 * (furthest index only) are ignored: inventing intermediate `arrived` marks
 * would lie about skips that never had a place to persist.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
 */

const KEY = 'htae.drive.progress.v2'
const LEGACY_KEY = 'htae.drive.progress.v1'

function storage() {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Normalize a raw outcomes blob into { [index: number]: 'arrived'|'skipped' }.
 * Invalid keys/values are dropped; never invent disposition.
 */
export function normalizeOutcomes(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out

  for (const [key, value] of Object.entries(raw)) {
    const index = Number(key)
    if (!Number.isInteger(index) || index < 0 || index > route.length - 1) {
      continue
    }
    if (!isDisposition(value)) continue
    out[index] = value
  }
  return out
}

/**
 * The furthest exit reached plus per-stop outcomes, or null.
 * Returns null rather than throwing for anything unparseable, out of range, or
 * pointing at a stop that has since moved.
 *
 * Does not invent `arrived` for the furthest index when outcomes omit it
 * (in-transit furthest is valid; inventing would paint a skip-gap as passed).
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(KEY)
    if (!raw) {
      // Drop legacy v1: index-only history cannot encode skips, and restoring
      // it via mark-through would paint every prior stop as passed.
      return null
    }

    const saved = JSON.parse(raw)
    const index = Number(saved?.index)
    if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
      return null
    }

    const stop = route[index]
    if (!stop || stop.id !== saved.id) return null

    return {
      index,
      id: stop.id,
      title: stop.title,
      label: stop.exitLabel,
      outcomes: normalizeOutcomes(saved.outcomes),
    }
  } catch {
    return null
  }
}

/**
 * Remember furthest exit + outcomes. Only ever move the furthest index forward.
 * The live outcomes object is authoritative for each index. Missing disposition
 * for `index` is left unset; do not invent `arrived`.
 */
export function writeProgress(index, outcomes = {}) {
  const store = storage()
  if (!store) return

  const stop = route[index]
  if (!stop || index <= 0) return

  try {
    const previous = readProgress()
    const nextOutcomes = {
      ...(previous?.outcomes ?? {}),
      ...normalizeOutcomes(outcomes),
    }

    const furthest =
      previous && previous.index >= index
        ? { index: previous.index, id: route[previous.index].id }
        : { index, id: stop.id }

    store.setItem(
      KEY,
      JSON.stringify({
        index: furthest.index,
        id: furthest.id,
        outcomes: nextOutcomes,
      })
    )
  } catch {
    // Storage full or unavailable: losing progress is not worth an error.
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
