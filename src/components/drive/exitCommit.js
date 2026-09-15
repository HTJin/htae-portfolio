/**
 * Option-lane TAKE / PASS commit for an interchange (st071).
 *
 * Thresholds are locked by architect consensus (Q036 / Q041). Coders may hoist
 * them next to ARRIVAL_WINDOW; do not invent a second gesture scheme.
 */

export const PASS_LATERAL_MAX = 0.55

/** @typedef {'open' | 'take' | 'pass'} ExitCommit */

/**
 * Resolve the exit commit while approaching stop N.
 *
 * @param {{
 *   commit: ExitCommit,
 *   remaining: number,
 *   rampLength: number,
 *   arrivalWindow: number,
 *   brake: number,
 *   throttle: number,
 *   x: number,
 *   autopilot: boolean,
 *   isLast: boolean,
 * }} input
 * @returns {ExitCommit}
 */
export function resolveExitCommit({
  commit,
  remaining,
  rampLength,
  arrivalWindow,
  brake,
  throttle,
  x,
  autopilot,
  isLast,
}) {
  if (commit !== 'open') return commit

  // Decision is only open inside the approach ramp band.
  if (!(remaining > 0 && remaining <= rampLength)) return 'open'

  // TAKE: any peel cue or autopilot / Drive-on.
  if (autopilot || brake > 0 || x > PASS_LATERAL_MAX) return 'take'

  // PASS: stay left + throttle, never the last content stop.
  if (
    !isLast &&
    throttle > 0 &&
    brake === 0 &&
    x <= PASS_LATERAL_MAX &&
    !autopilot
  ) {
    return 'pass'
  }

  // At the gore, unresolved open defaults to TAKE.
  if (remaining <= arrivalWindow) return 'take'

  return 'open'
}

/**
 * Whether ego should inherit peel geometry at `travel` (st072).
 *
 * Painted exit ribbons stay on `follow:true` bands; this only gates the
 * camera/car `sim.ramp` / `sim.drop` assignment.
 *
 * @param {{
 *   travel: number,
 *   commit: ExitCommit,
 *   target: number,
 * }} sim
 * @param {{ s: number, index: number }[]} stops
 * @param {Set<number>} passed
 * @param {number} rampLength
 */
export function egoFollowsRamp(sim, stops, passed, rampLength) {
  if (sim.commit === 'pass') return false

  for (let i = 0; i < stops.length; i += 1) {
    const stop = stops[i]
    if (!passed.has(stop.index ?? i)) continue
    if (Math.abs(sim.travel - stop.s) <= rampLength) return false
  }

  return true
}
