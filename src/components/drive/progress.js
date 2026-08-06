import { route } from './route'

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
