/**
 * Shared pseudo-3D world math for drive mode.
 *
 * The camera sits on the road looking straight down it. A world point is
 * described by how far ahead it is (`z`, metres), how far off the road centre
 * it sits (`x`, metres, right-positive) and how high it stands off the tarmac
 * (`y`, metres). Everything on screen — tarmac, poles, exit signs — is placed
 * with `project()` so the canvas and the DOM overlays always agree.
 */

export const ROAD_HALF = 5.5 // metres from centre line to the outer edge line
export const CAM_HEIGHT = 1.35 // driver eye height above the tarmac

/**
 * Where the car actually sits across the road.
 *
 * You drive *in a lane*, not astride the centre line — so the camera is offset
 * into the right-hand lane. This is also what makes the driver's-seat framing
 * read correctly: the road's vanishing point falls slightly left of screen
 * centre, which is exactly where it belongs when you are sitting to the right
 * of the road's centreline in a left-hand-drive car.
 */
export const LANE_OFFSET = 2.7

/** The car's lateral position: its lane, plus whatever steering drift. */
export function cameraX(sim) {
  return LANE_OFFSET + sim.x
}
export const HORIZON_RATIO = 0.44 // where the vanishing point sits vertically
export const Z_NEAR = 2.4
export const Z_FAR = 460

/** Lateral drift of the road centre at world position `s`. */
export function curveAt(s) {
  return 9 * Math.sin(s / 340) + 4.5 * Math.sin(s / 127 + 1.7)
}

/** Elevation of the road surface at world position `s`. */
export function hillAt(s) {
  return 2.4 * Math.sin(s / 240) + 1.1 * Math.sin(s / 95 + 0.6)
}

export function makeCamera(width, height) {
  return {
    width,
    height,
    focal: height * 0.9,
    horizon: height * HORIZON_RATIO,
  }
}

/**
 * Project a world point into screen space.
 * Returns screen coordinates plus the pixels-per-metre scale at that depth.
 */
export function project(camera, sim, z, x = 0, y = 0) {
  const s = sim.travel + z
  const scale = camera.focal / z
  const lateral = curveAt(s) - curveAt(sim.travel) + x - cameraX(sim)
  const vertical = CAM_HEIGHT + hillAt(sim.travel) - hillAt(s) - y

  return {
    x: camera.width / 2 + lateral * scale,
    y: camera.horizon + vertical * scale,
    scale,
  }
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value
}
