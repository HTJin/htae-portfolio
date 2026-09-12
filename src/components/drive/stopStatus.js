/**
 * Per-stop status vocabulary for the drive route map.
 *
 * Stored tokens: taken | skipped | jumped.
 * Derived-only: unreached (never persisted).
 *
 * Pure: no React, no Storage, no progress.js import (R0m).
 */

export const TAKEN = 'taken'
export const SKIPPED = 'skipped'
export const JUMPED = 'jumped'
export const UNREACHED = 'unreached'

const CANONICAL = new Set([TAKEN, SKIPPED, JUMPED])

/** True when token may live in a progress.v2 outcomes blob (R0e). */
export function isStoredToken(token) {
  return CANONICAL.has(token)
}

/**
 * Map raw producer values to a stored token.
 * #26 `arrived` → taken. `unset` / `passed` / unknown → absent (R0h).
 */
export function adaptProducerToken(raw) {
  if (raw === 'arrived' || raw === TAKEN) return TAKEN
  if (raw === SKIPPED) return SKIPPED
  if (raw === JUMPED) return JUMPED
  return undefined
}

function readAt(source, index) {
  if (source == null) return undefined
  if (typeof source.get === 'function' && typeof source.has === 'function') {
    if (source.has(index)) return source.get(index)
    if (source.has(String(index))) return source.get(String(index))
    return undefined
  }
  if (typeof source === 'object' && !Array.isArray(source)) {
    if (Object.prototype.hasOwnProperty.call(source, index))
      return source[index]
    const asString = String(index)
    if (Object.prototype.hasOwnProperty.call(source, asString))
      return source[asString]
  }
  return undefined
}

function hasMember(collection, index) {
  if (collection == null) return false
  if (collection instanceof Set) {
    return collection.has(index) || collection.has(String(index))
  }
  if (Array.isArray(collection)) {
    return collection.includes(index) || collection.includes(String(index))
  }
  if (typeof collection === 'object') {
    return Boolean(collection[index] || collection[String(index)])
  }
  return false
}

/**
 * Producer adapter for st071 survivor shapes.
 * #20 dispositionOf Map, #26 stopStatus object, #25 passed Set → skipped (R0i / Q064).
 */
export function dispositionOf(index, producers = {}) {
  const fromMap = adaptProducerToken(readAt(producers.dispositionOf, index))
  if (fromMap) return fromMap

  const fromObject = adaptProducerToken(readAt(producers.stopStatus, index))
  if (fromObject) return fromObject

  if (producers.passed instanceof Set && hasMember(producers.passed, index)) {
    return SKIPPED
  }

  return undefined
}

/**
 * Four-state status for one stop index.
 *
 * Precedence: canonical producer (R0h) → visited→taken →
 * index in [entryIndex, furthest) → jumped → else unreached.
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

  if (hasMember(visited, index)) return TAKEN

  const furthest =
    furthestIndex != null
      ? furthestIndex
      : currentIndex != null
      ? currentIndex
      : 0

  if (index < furthest && index >= entryIndex) return JUMPED

  return UNREACHED
}
