/**
 * Per-stop status vocabulary for the drive route map.
 *
 * Stored / producer tokens that persist: taken | skipped | jumped.
 * Runtime-only: unreached (never written to progress outcomes).
 *
 * Pure module: no React, no Storage, no progress.js import.
 */

export const TAKEN = 'taken'
export const SKIPPED = 'skipped'
export const JUMPED = 'jumped'
export const UNREACHED = 'unreached'

/** Tokens allowed in progress.v2 outcomes. */
export const STORED_TOKENS = Object.freeze([TAKEN, SKIPPED, JUMPED])

const CANONICAL = new Set(STORED_TOKENS)

/**
 * True when value is a plain object (not null, array, or boxed primitive).
 * @param {unknown} value
 */
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Keep only route stop-id keys with stored tokens.
 * @param {unknown} raw
 * @param {Iterable<{ id: string }>} routeStops
 * @returns {Record<string, 'taken'|'skipped'|'jumped'>}
 */
export function normalizeOutcomes(raw, routeStops) {
  const allowed = new Set()
  for (const stop of routeStops) {
    if (stop && typeof stop.id === 'string') allowed.add(stop.id)
  }
  if (!isPlainObject(raw)) return {}
  /** @type {Record<string, 'taken'|'skipped'|'jumped'>} */
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key)) continue
    if (CANONICAL.has(value)) out[key] = value
  }
  return out
}

/**
 * Normalize an outcomes patch the same way as stored outcomes.
 * Empty / non-object patches yield {}.
 * @param {unknown} patch
 * @param {Iterable<{ id: string }>} routeStops
 */
export function normalizeOutcomesPatch(patch, routeStops) {
  if (patch === undefined || patch === null) return {}
  if (!isPlainObject(patch)) return {}
  return normalizeOutcomes(patch, routeStops)
}

/**
 * Map a producer value to a canonical stored token, or null if absent / unset.
 *
 * Tolerates:
 * - #20 Map / function dispositionOf → taken|skipped|jumped (unset stays absent)
 * - #26 object map with arrived → taken
 * - #25 passed Set → membership means skipped ([[Q064]])
 *
 * @param {number} index
 * @param {unknown} producer
 * @returns {'taken'|'skipped'|'jumped'|null}
 */
export function adaptProducer(index, producer) {
  if (producer == null) return null

  // #25 / Q064: passed Set membership → skipped (never jumped, never store "passed")
  if (producer instanceof Set) {
    return producer.has(index) ? SKIPPED : null
  }

  let raw
  if (typeof producer === 'function') {
    raw = producer(index)
  } else if (producer instanceof Map) {
    raw = producer.get(index)
  } else if (isPlainObject(producer)) {
    raw = producer[index] ?? producer[String(index)]
  } else {
    return null
  }

  if (raw == null || raw === 'unset') return null
  if (raw === 'arrived') return TAKEN
  if (raw === TAKEN || raw === SKIPPED || raw === JUMPED) return raw
  return null
}

/**
 * Resolve display / map status for one stop index.
 *
 * Precedence:
 * 1. Canonical producer token (R0h)
 * 2. visited → taken
 * 3. behind furthest, at/after entry, not visited → jumped ([[Q180]])
 * 4. else unreached
 *
 * @param {number} index
 * @param {{
 *   dispositionOf?: unknown,
 *   stopStatus?: unknown,
 *   passed?: unknown,
 *   visited?: Set<number>|Iterable<number>|null,
 *   currentIndex?: number,
 *   entryIndex?: number,
 *   furthestIndex?: number,
 * }} [ctx]
 * @returns {'taken'|'skipped'|'jumped'|'unreached'}
 */
export function statusOf(index, ctx = {}) {
  const producers = [ctx.dispositionOf, ctx.stopStatus, ctx.passed]
  for (const producer of producers) {
    const adapted = adaptProducer(index, producer)
    if (adapted && CANONICAL.has(adapted)) return adapted
  }

  let visited = ctx.visited
  if (visited && !(visited instanceof Set)) {
    visited = new Set(visited)
  }
  if (visited && visited.has(index)) return TAKEN

  const furthest =
    typeof ctx.furthestIndex === 'number'
      ? ctx.furthestIndex
      : typeof ctx.currentIndex === 'number'
      ? ctx.currentIndex
      : 0
  const entry = typeof ctx.entryIndex === 'number' ? ctx.entryIndex : 0

  // Q180: leapfrog = not visited and i < furthest, and at/after entry (deep-link)
  if (!visited?.has(index) && index < furthest && index >= entry) {
    return JUMPED
  }

  return UNREACHED
}
