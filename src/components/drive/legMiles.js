/**
 * Display mileage for the stretch between one exit and the next.
 *
 * These numbers are DECORATION, not geometry.
 *
 * Q044, answered 2026-08-09, binding: "leaf freeze wins (display-only; keep
 * LEG_LENGTH=420)". So nothing here may reach `world.js` or `route.js` geometry.
 * The car still drives 420 metres between exits; only the label differs.
 *
 * Q190, answered 2026-08-20, binding: "Show a random number on each stretch
 * between exits, and keep the real 5.2 on the card". So the per-stretch numbers
 * are invented, and the trip summary's total stays the true route length. Those
 * two facts live together here so nobody later "fixes" the inconsistency by
 * making the card add these up.
 *
 * Q182, answered 2026-08-20, binding: the numbers belong on the route map.
 *
 * Seeded, not `Math.random`, so a reload shows the same road. A route that
 * renumbered itself every refresh would make the map useless as a memory aid,
 * and the owner has asked more than once why nothing looks stable.
 */

import { route } from './route'

/** Smallest and largest label. st008 asks for one to two digits. */
export const MIN_LEG_MILES = 3
export const MAX_LEG_MILES = 89

/**
 * FNV-1a over the seed string.
 *
 * Chosen because it is a few lines, has no dependency, and is stable across
 * engines. The requirement is only that the same input gives the same number
 * every time, not that it resists an attacker.
 */
function hashString(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Miles shown for the stretch that ENDS at `index`.
 *
 * Keyed by the two stop ids either side of the stretch, not by index, so
 * inserting a job into the middle of the resume renumbers only the stretches
 * that actually changed. Keying by index would reshuffle the whole road every
 * time the owner edited their history, which is the sort of churn that made the
 * earlier attempt feel random in the bad sense.
 */
export function legMilesAt(index) {
  const to = route[index]
  const from = route[index - 1]
  if (!to || !from) return 0
  const span = MAX_LEG_MILES - MIN_LEG_MILES + 1
  return MIN_LEG_MILES + (hashString(`${from.id}->${to.id}`) % span)
}

/** Every stretch, in route order. `legMiles[0]` is 0: nothing precedes MILE 0. */
export function allLegMiles() {
  return route.map((_, i) => (i === 0 ? 0 : legMilesAt(i)))
}

/**
 * Sum of the invented stretches.
 *
 * Deliberately NOT the trip total. Q190 keeps the real route length on the card.
 * This exists so a caller that genuinely wants the decorative sum has to ask for
 * it by this name and cannot reach it by accident.
 */
export function decorativeTotalMiles() {
  return allLegMiles().reduce((a, b) => a + b, 0)
}
