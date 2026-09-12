/**
 * Per-stop status vocabulary for the drive route map.
 *
 * Pure module: no React, no Storage, no progress.js import (R0m).
 * Tokens: taken | skipped | jumped | unreached.
 * Only taken | skipped | jumped may be persisted (R0e).
 */

export const TAKEN = 'taken'
export const SKIPPED = 'skipped'
export const JUMPED = 'jumped'
export const UNREACHED = 'unreached'

/** Tokens allowed in the progress v2 outcomes map. */
export const STORED_TOKENS = Object.freeze([TAKEN, SKIPPED, JUMPED])

const STORED = new Set(STORED_TOKENS)
const CANONICAL = new Set([TAKEN, SKIPPED, JUMPED])

/**
 * True when `token` may be written into progress outcomes.
 * @param {unknown} token
 */
export function isStoredToken(token) {
  return STORED.has(token)
}

/**
 * Map a producer value to a canonical short-circuit token, or null.
 * `arrived` (#26) → taken. `unset` → null (R0h).
 * @param {unknown} value
 * @returns {'taken'|'skipped'|'jumped'|null}
 */
export function normalizeProducerToken(value) {
  if (value === 'arrived') return TAKEN
  if (value === TAKEN || value === SKIPPED || value === JUMPED) return value
  return null
}

function lookupMapOrObject(source, index) {
  if (source == null) return undefined
  if (source instanceof Map) {
    if (source.has(index)) return source.get(index)
    if (source.has(String(index))) return source.get(String(index))
    return undefined
  }
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
 * Tolerates #20 Map (or function), #26 object (`arrived`→`taken`),
 * and #25 `passed` Set (membership → `skipped`, never `jumped`) (R0i / Q064).
 * @param {number} index
 * @param {{
 *   dispositionOf?: Map<number, unknown> | ((i: number) => unknown),
 *   stopStatus?: Record<string|number, unknown> | Map<number, unknown>,
 *   passed?: Set<number>,
 * }} [producers]
 * @returns {'taken'|'skipped'|'jumped'|null}
 */
export function dispositionFromProducers(index, producers = {}) {
  const { dispositionOf, stopStatus, passed } = producers

  if (typeof dispositionOf === 'function') {
    const token = normalizeProducerToken(dispositionOf(index))
    if (token) return token
  } else {
    const token = normalizeProducerToken(
      lookupMapOrObject(dispositionOf, index)
    )
    if (token) return token
  }

  const fromObject = normalizeProducerToken(
    lookupMapOrObject(stopStatus, index)
  )
  if (fromObject) return fromObject

  if (
    passed instanceof Set &&
    (passed.has(index) || passed.has(String(index)))
  ) {
    return SKIPPED
  }

  return null
}

function isVisited(visited, index) {
  if (!visited) return false
  if (visited instanceof Set) {
    return visited.has(index) || visited.has(String(index))
  }
  if (Array.isArray(visited)) return visited.includes(index)
  if (typeof visited.has === 'function') return visited.has(index)
  return Boolean(visited[index] || visited[String(index)])
}

/**
 * Status of one stop for map / assistive labels.
 *
 * Precedence (R0h):
 * 1. Canonical producer token (taken | skipped | jumped) short-circuits.
 * 2. Visited → taken.
 * 3. Behind furthest, at/after entry, not visited → jumped (Q180).
 * 4. Else unreached.
 *
 * @param {number} index
 * @param {{
 *   dispositionOf?: Map<number, unknown> | ((i: number) => unknown),
 *   stopStatus?: Record<string|number, unknown> | Map<number, unknown>,
 *   passed?: Set<number>,
 *   visited?: Set<number> | number[] | { has?: Function, [k: number]: unknown },
 *   currentIndex?: number,
 *   entryIndex?: number,
 *   furthestIndex?: number,
 * }} [ctx]
 * @returns {'taken'|'skipped'|'jumped'|'unreached'}
 */
export function statusOf(index, ctx = {}) {
  const fromProducer = dispositionFromProducers(index, ctx)
  if (fromProducer && CANONICAL.has(fromProducer)) return fromProducer

  if (isVisited(ctx.visited, index)) return TAKEN

  const furthest = Number(ctx.furthestIndex ?? ctx.currentIndex ?? 0)
  const entry = Number(ctx.entryIndex ?? 0)

  if (Number.isFinite(furthest) && index < furthest && index >= entry) {
    return JUMPED
  }

  return UNREACHED
}
