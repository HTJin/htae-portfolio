/**
 * Option-lane TAKE/PASS commit (st071) - pure helpers.
 *
 * Commit string lives on `sim.commit` (`open`|`take`|`pass`). Durable
 * disposition tokens are `taken` | `skipped` | unset - never name decline
 * `passed` (st011 uses that for arrive). Zero new deps; tiny FSM inline
 * (https://stately.ai/blog/2021-01-20-you-dont-need-a-library-for-state-machines).
 *
 * Thresholds locked by cr049 architect-consensus / Q041 option-lane.
 */

/**
 * Max lane offset (`sim.x`) still counted as "stay left" for a PASS commit.
 * ~1/3 of `LANE_DRIFT`; rightward past this toward the peel locks TAKE.
 */
export const PASS_LATERAL_MAX = 0.55

/**
 * Commit window metres. Must equal `RAMP_LENGTH` in route.js (`LEG_LENGTH * 0.4`).
 * Kept numeric here so this module stays free of the Next `@/` content import.
 */
export const COMMIT_WINDOW = 168

export const COMMIT_OPEN = 'open'
export const COMMIT_TAKE = 'take'
export const COMMIT_PASS = 'pass'

/** Durable disposition tokens (Q065). Decline is never named `passed`. */
export const DISPOSITION_TAKEN = 'taken'
export const DISPOSITION_SKIPPED = 'skipped'
export const DISPOSITION_UNSET = 'unset'

/**
 * Resolve option-lane commit while the decision window is open.
 * Window: `0 < remaining <= commitWindow` (caller passes route.RAMP_LENGTH).
 * Once locked, stays locked.
 *
 * @param {{ commit: string, brake: number, throttle: number, x: number, autopilot: boolean }} sim
 * @param {{ remaining: number, lastStop: boolean, commitWindow?: number }} ctx
 * @returns {'open'|'take'|'pass'}
 */
export function resolveCommit(
  sim,
  { remaining, lastStop, commitWindow = COMMIT_WINDOW }
) {
  if (sim.commit !== COMMIT_OPEN) return sim.commit
  if (!(remaining > 0 && remaining <= commitWindow)) return COMMIT_OPEN

  // TAKE wins on brake, rightward lean, or autopilot / Drive-on.
  if (sim.brake > 0 || sim.x > PASS_LATERAL_MAX || sim.autopilot) {
    return COMMIT_TAKE
  }

  // PASS needs intentional stay-left + throttle; last stop cannot PASS.
  if (
    !lastStop &&
    sim.throttle > 0 &&
    sim.brake === 0 &&
    sim.x <= PASS_LATERAL_MAX
  ) {
    return COMMIT_PASS
  }

  return COMMIT_OPEN
}

/**
 * Brake-assist only for TAKE / unresolved open - never under locked PASS.
 */
export function assistAllowed(commit) {
  return commit !== COMMIT_PASS
}

/**
 * At the gore: unresolved open defaults to TAKE. PASS keeps rolling;
 * TAKE (and last-stop) parks.
 *
 * @returns {'pass'|'take'}
 */
export function resolveGore(commit, { lastStop }) {
  const locked = commit === COMMIT_OPEN ? COMMIT_TAKE : commit
  if (locked === COMMIT_PASS && !lastStop) return COMMIT_PASS
  return COMMIT_TAKE
}
