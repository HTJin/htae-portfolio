/**
 * Per-stop status vocabulary for the drive route map.
 *
 * Storage whitelist is taken | skipped | jumped. unreached is derived absence
 * only and must never be persisted. Producer shapes from st071 survivors are
 * adapted here so progress.js and RouteMap stay free of shape forks.
 *
 * Pure module: no React, no Storage, no import of progress.js (R0m).
 */

export const TAKEN = 'taken'
export const SKIPPED = 'skipped'
export const JUMPED = 'jumped'
export const UNREACHED = 'unreached'

/** Tokens allowed inside a progress.v2 outcomes blob. */
export const STORED_TOKENS = Object.freeze([TAKEN, SKIPPED, JUMPED])

const STORED = new Set(STORED_TOKENS)

export function isStoredToken(token) {
  return STORED.has(token)
}

/**
 * Map a raw producer value to a canonical stored token, or undefined when
 * absent / unset / unknown (R0h). #26 `arrived` becomes `taken`.
 */
export function adaptProducerToken(raw) {
  if (raw === 'arrived' || raw === TAKEN) return TAKEN
  if (raw === SKIPPED) return SKIPPED
  if (raw === JUMPED) return JUMPED
  return undefined
}

function lookupMapOrObject(source, index) {
  if (source == null) return undefined
  if (source instanceof Map) {
    if (source.has(index)) return source.get(index)
    if (source.has(String(index))) return source.get(String(index))
    return undefined
  }
  if (typeof source === 'function') return source(index)
  if (typeof source === 'object' && !Array.isArray(source)) {
    if (Object.prototype.hasOwnProperty.call(source, index))
      return source[index]
    if (Object.prototype.hasOwnProperty.call(source, String(index))) {
      return source[String(index)]
    }
  }
  return undefined
}

/**
 * Resolve a producer disposition for one stop index.
 *
 * Tolerates #20 dispositionOf Map (or function), #26 stopStatus object
 * (arrived→taken), and #25 passed Set (membership→skipped, never jumped;
 * R0i / Q064).
 */
export function dispositionOf(index, producers = {}) {
  const { dispositionOf: mapLike, stopStatus, passed } = producers

  const fromMap = adaptProducerToken(lookupMapOrObject(mapLike, index))
  if (fromMap) return fromMap

  const fromObject = adaptProducerToken(lookupMapOrObject(stopStatus, index))
  if (fromObject) return fromObject

  if (
    passed instanceof Set &&
    (passed.has(index) || passed.has(String(index)))
  ) {
    return SKIPPED
  }

  return undefined
}

function isVisited(index, visited) {
  if (visited == null) return false
  if (visited instanceof Set)
    return visited.has(index) || visited.has(String(index))
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
