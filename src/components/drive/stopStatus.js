/**
 * Per-stop status vocabulary for the drive route map.
 *
 * Storage whitelist: taken | skipped | jumped.
 * unreached is derived absence only and must never be persisted (R0e).
 *
 * Pure module: no React, no Storage, no import of progress.js (R0m).
 *
 * Alternate structure vs peer Map/if ladders: ordered producer adapters +
 * a frozen alias table so #20 / #26 / #25 stay one-line each.
 */

export const TAKEN = 'taken'
export const SKIPPED = 'skipped'
export const JUMPED = 'jumped'
export const UNREACHED = 'unreached'

/** Tokens allowed inside a progress.v2 outcomes blob. */
export const STORED_TOKENS = Object.freeze([TAKEN, SKIPPED, JUMPED])

const STORED = new Set(STORED_TOKENS)

/** Producer string aliases → stored token. `passed` string is never stored. */
const ALIASES = Object.freeze({
  arrived: TAKEN,
  [TAKEN]: TAKEN,
  [SKIPPED]: SKIPPED,
  [JUMPED]: JUMPED,
})

export function isStoredToken(token) {
  return STORED.has(token)
}

/**
 * Map a raw producer value to a canonical stored token, or undefined when
 * absent / unset / unknown (R0h). #26 `arrived` becomes `taken`.
 */
export function adaptProducerToken(raw) {
  return ALIASES[raw]
}

function readKeyed(source, index) {
  if (source == null || typeof source !== 'object') return undefined
  if (source instanceof Map) {
    if (source.has(index)) return source.get(index)
    if (source.has(String(index))) return source.get(String(index))
    return undefined
  }
  if (Array.isArray(source)) return undefined
  if (Object.prototype.hasOwnProperty.call(source, index)) return source[index]
  if (Object.prototype.hasOwnProperty.call(source, String(index))) {
    return source[String(index)]
  }
  return undefined
}

/**
 * Ordered producer adapters. First hit wins.
 * #20 Map (or function), #26 object (`arrived`→`taken`),
 * #25 passed Set (membership→`skipped`, never jumped; R0i / Q064).
 */
const PRODUCER_ADAPTERS = [
  (index, { dispositionOf }) => {
    if (typeof dispositionOf === 'function') {
      return adaptProducerToken(dispositionOf(index))
    }
    return adaptProducerToken(readKeyed(dispositionOf, index))
  },
  (index, { stopStatus }) => adaptProducerToken(readKeyed(stopStatus, index)),
  (index, { passed }) => {
    if (!(passed instanceof Set)) return undefined
    if (passed.has(index) || passed.has(String(index))) return SKIPPED
    return undefined
  },
]

/**
 * Resolve a producer disposition for one stop index.
 */
export function dispositionOf(index, producers = {}) {
  for (const adapter of PRODUCER_ADAPTERS) {
    const token = adapter(index, producers)
    if (token) return token
  }
  return undefined
}

function isVisited(index, visited) {
  if (visited == null) return false
  if (visited instanceof Set) {
    return visited.has(index) || visited.has(String(index))
  }
  if (Array.isArray(visited)) return visited.includes(index)
  if (typeof visited === 'object') {
    return Boolean(visited[index] || visited[String(index)])
  }
  return false
}

/**
 * Derive the four-state status for one stop.
 *
 * Precedence: canonical producer token (R0h) → visited→taken →
 * behind furthest and at/after entryIndex → jumped → else unreached.
 * [[Q180]]: jumped = !visited && index < furthest && index >= entryIndex.
 */
export function statusOf(index, opts = {}) {
  const {
    visited,
    currentIndex,
    entryIndex = 0,
    furthestIndex,
    dispositionOf: mapLike,
    stopStatus,
    passed,
  } = opts

  const producer = dispositionOf(index, {
    dispositionOf: mapLike,
    stopStatus,
    passed,
  })
  if (producer === TAKEN || producer === SKIPPED || producer === JUMPED) {
    return producer
  }

  if (isVisited(index, visited)) return TAKEN

  const furthest =
    furthestIndex != null
      ? furthestIndex
      : currentIndex != null
      ? currentIndex
      : 0

  if (index < furthest && index >= entryIndex) return JUMPED

  return UNREACHED
}
