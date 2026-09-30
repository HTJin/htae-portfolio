/**
 * What happened at each exit.
 *
 * Q053, answered 2026-08-09, binding: "persist_outcomes: bump progress key and
 * store per-stop disposition". That is what progress.js v2 does, and this file is
 * the vocabulary it stores.
 *
 * Progress used to be a single number: the furthest exit reached. That cannot
 * answer the question the route map needs to draw, which is not "how far did you
 * get" but "what did you do at each one". A visitor who drove past twenty exits
 * and read the last is not in the same state as one who read all twenty, and a
 * single index calls them identical.
 *
 * The vocabulary is closed on purpose. Four states, no free strings, so a typo
 * cannot invent a fifth that the map has no way to draw.
 */

/** Pulled off, stopped, read it. */
export const TAKEN = 'taken'
/** Drove past it deliberately without exiting. */
export const SKIPPED = 'skipped'
/** Arrived by deep link or the route map, not by driving there. */
export const JUMPED = 'jumped'
/** Never got there at all. The default for everything ahead of the car. */
export const UNREACHED = 'unreached'

export const STOP_STATUSES = [TAKEN, SKIPPED, JUMPED, UNREACHED]

/** True for a value this module actually defines. Anything else is not a status. */
export function isStopStatus(value) {
  return STOP_STATUSES.includes(value)
}

/**
 * Wording for the TEXT EQUIVALENT only. Never the visible badge.
 *
 * Q050, answered 2026-08-13, binding and verbatim: "perhaps a new approach to
 * show the route map is better. could be more of a visual roadmap of the
 * experiences that went over in a dotted line node to node for destinations and
 * it will show which path I didn't take that way without having to ponder about
 * menial terminology such as passed or skipped".
 *
 * So the map must SHOW the difference, node to node, solid against dotted. These
 * strings exist for the screen-reader row that st133 requires beside that visual,
 * and for nothing else. Do not render them as badges next to a stop.
 *
 * Kept beside the vocabulary rather than in the component, so a fifth state can
 * never be added to one and forgotten in the other.
 */
export const STOP_STATUS_LABEL = {
  [TAKEN]: 'visited',
  [SKIPPED]: 'driven past',
  [JUMPED]: 'jumped to',
  [UNREACHED]: 'not reached yet',
}

/**
 * Adapter from what the drive layer records to the stored vocabulary.
 *
 * `useDrive` writes 'passed' when the car commits a pass, and marks arrivals
 * through `arriveAt`. This is the one place those producer words are translated,
 * so the drive layer never has to import the storage vocabulary and the storage
 * layer never has to know how the car behaves.
 */
export function statusFromDrive({ visited = false, passed = false, jumped = false } = {}) {
  if (jumped) return JUMPED
  if (visited) return TAKEN
  if (passed) return SKIPPED
  return UNREACHED
}

/**
 * Which of two statuses wins when both are recorded for one stop.
 *
 * Visiting an exit is the strongest claim and must never be overwritten by a
 * later drive past it, or a second lap would erase everything the visitor read.
 * Reaching a stop at all beats never reaching it.
 */
const RANK = { [TAKEN]: 3, [JUMPED]: 2, [SKIPPED]: 1, [UNREACHED]: 0 }

export function strongerStatus(a, b) {
  const ra = RANK[a] ?? 0
  const rb = RANK[b] ?? 0
  return rb > ra ? b : a
}
