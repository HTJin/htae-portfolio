/**
 * Per-stop disposition contract (st011).
 *
 * Owner / RouteMap UI words stay distinct from the drive-layer enum and from
 * Q041 TAKE/PASS gesture labels. Cabin `passedStop` is a previous-title prop
 * only; do not overload it here.
 *
 * | Lexicon              | Token                         | Meaning                          |
 * | -------------------- | ----------------------------- | -------------------------------- |
 * | Owner / RouteMap UI  | `passed`                      | Took / parked at the exit        |
 * | Owner / RouteMap UI  | `skipped`                     | Continued without taking exit    |
 * | Drive disposition    | `arrived` \| `skipped` \| unset | Internal enum; unset = ahead    |
 * | st071 emit           | must mean owner-`skipped`     | Never alias emit-passed → UI-passed |
 * | Q041 gestures        | TAKE ≈ passed; PASS ≈ skipped | HUD only, not RouteMap badges    |
 */

export const ARRIVED = 'arrived'
export const SKIPPED = 'skipped'

/** Map drive disposition → visible RouteMap badge copy (Q050 working assumption). */
export const UI_BADGE = {
  [ARRIVED]: 'passed',
  [SKIPPED]: 'skipped',
}

export function badgeFor(disposition) {
  if (disposition == null) return null
  return UI_BADGE[disposition] ?? null
}

export function isDisposition(value) {
  return value === ARRIVED || value === SKIPPED
}
