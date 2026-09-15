/**
 * Option-lane TAKE/PASS commit (st071) - pure helpers.
 *
 * Commit string lives on `sim.commit` (`open`|`take`|`pass`). Durable
 * disposition tokens are `taken` | `passed` | unset (Q064 / Q336). Cabin
 * `passedStop` stays unrelated. Zero new deps; tiny FSM inline
 * (https://stately.ai/blog/2021-01-20-you-dont-need-a-library-for-state-machines).
 *
 * Thresholds locked by cr100001 architect-consensus / Q041 option-lane.
 * Commit window is per-stop `rampLengthAt(sim.target)` (Q778); caller must pass it.
 */

/**
 * Max lane offset (`sim.x`) still counted as "stay left" for a PASS commit.
 * ~1/3 of `LANE_DRIFT`; rightward past this toward the peel locks TAKE.
 */
export const PASS_LATERAL_MAX = 0.55

export const COMMIT_OPEN = 'open'
export const COMMIT_TAKE = 'take'
export const COMMIT_PASS = 'pass'

/** Durable disposition tokens (Q064). Decline is `passed`; arrive is `taken`. */
export const DISPOSITION_TAKEN = 'taken'
export const DISPOSITION_PASSED = 'passed'
export const DISPOSITION_UNSET = 'unset'

/**
 * Resolve option-lane commit while the decision window is open.
 * Window: `0 < remaining <= commitWindow` (caller passes rampLengthAt(target)).
 * Once locked, stays locked. Missing commitWindow throws (no silent default).
 *
 * @param {{ commit: string, brake: number, throttle: number, x: number, autopilot: boolean }} sim
 * @param {{ remaining: number, lastStop: boolean, commitWindow: number }} ctx
 * @returns {'open'|'take'|'pass'}
 */
export function resolveCommit(sim, { remaining, lastStop, commitWindow }) {
  if (commitWindow == null || !(commitWindow > 0)) {
    throw new Error(
      `resolveCommit requires a positive commitWindow (got ${commitWindow})`,
    )
  }
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
