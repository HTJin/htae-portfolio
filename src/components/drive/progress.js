import { route } from './route'
import { UNREACHED, isStopStatus, strongerStatus } from './stopStatus'

/**
 * How far a visitor got last time.
 *
 * The route is 21 exits long, so someone who reads a few and comes back later
 * would otherwise be dropped at MILE 0 with no way back except driving the
 * whole thing again. This remembers the furthest exit — but nothing here ever
 * *applies* it. The ignition screen offers it and the visitor chooses, so no
 * one is ever trapped mid-route by state they did not ask for.
 *
 * Every access is wrapped: `localStorage` throws outright in Safari private
 * mode, with cookies blocked, and in some embedded webviews. A storage failure
 * must degrade to "no saved progress", never to a broken page.
 */

// Versioned: the route is derived from content, so a future edit could shift
// what any stored index means. Bump this and old entries are ignored.
const KEY = 'htae.drive.progress.v1'
/**
 * v2 stores what happened at EACH stop, not just the furthest one reached.
 *
 * v1 is still read. A visitor who has been here before must not lose their place
 * because the shape changed underneath them, so a v1 entry is migrated into a v2
 * record on first read: everything up to the saved index counts as reached, and
 * the saved index itself as taken. That is the honest reading of what v1 knew.
 */
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
 * The furthest exit reached, or null. Returns null rather than throwing for
 * anything unparseable, out of range, or pointing at a stop that has since
 * moved — an index alone is not enough to trust once the content can change.
 */
export function readProgress() {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(KEY)
    if (!raw) return null

    const saved = JSON.parse(raw)
    const index = Number(saved?.index)
    if (!Number.isInteger(index) || index <= 0 || index > route.length - 1) {
      return null
    }

    // The id must still match the index, or the route has changed underneath
    // this entry and restoring it would land somewhere unrelated.
    const stop = route[index]
    if (!stop || stop.id !== saved.id) return null

    return { index, id: stop.id, title: stop.title, label: stop.exitLabel }
  } catch {
    return null
  }
}

/** Remember an exit, but only ever move forward. */
export function writeProgress(index) {
  const store = storage()
  if (!store) return

  const stop = route[index]
  if (!stop || index <= 0) return

  try {
    const previous = readProgress()
    if (previous && previous.index >= index) return
    store.setItem(KEY, JSON.stringify({ index, id: stop.id }))
  } catch {
    // Storage full or unavailable — losing progress is not worth an error.
  }
}

export function clearProgress() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY)
  } catch {
    // Nothing to do; the caller already treats this as best-effort.
  }
}


/* --------------------------------------------------------------------------
 * v2: per-stop outcomes
 * ------------------------------------------------------------------------ */

/** Keyed by stop id rather than index, so editing the route cannot shift meaning. */
export function readStopStatuses() {
  const store = storage()
  if (!store) return {}
  try {
    const raw = store.getItem(KEY_V2)
    if (raw) {
      const saved = JSON.parse(raw)
      const out = {}
      for (const [id, status] of Object.entries(saved || {})) {
        // Drop anything the vocabulary does not define, and anything naming a
        // stop the route no longer has. Both mean the entry cannot be drawn.
        if (isStopStatus(status) && route.some((s) => s.id === id)) out[id] = status
      }
      return out
    }
    return migrateFromV1()
  } catch {
    return {}
  }
}

/**
 * Best-effort upgrade of a v1 entry.
 *
 * v1 knew one number: the furthest exit. It did not know whether anything before
 * it was read or driven past, so nothing is claimed as taken except the saved
 * stop itself. Guessing 'taken' for the whole prefix would put words in the
 * visitor's mouth and mark exits they may never have opened.
 */
function migrateFromV1() {
  const previous = readProgress()
  if (!previous) return {}
  const out = {}
  const stop = route[previous.index]
  if (stop) out[stop.id] = 'taken'
  return out
}

/** Record an outcome. Never downgrades: visiting an exit outranks passing it. */
export function writeStopStatus(id, status) {
  const store = storage()
  if (!store || !id || !isStopStatus(status)) return
  if (!route.some((s) => s.id === id)) return
  try {
    const all = readStopStatuses()
    const next = strongerStatus(all[id] ?? UNREACHED, status)
    if (next === all[id]) return
    all[id] = next
    store.setItem(KEY_V2, JSON.stringify(all))
  } catch {
    // Storage full or blocked. Losing an outcome is not worth an error.
  }
}

export function clearStopStatuses() {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(KEY_V2)
  } catch {
    // best effort, same as clearProgress
  }
}
