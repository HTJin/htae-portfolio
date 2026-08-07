/**
 * Shared pseudo-3D world math for drive mode.
 *
 * The camera sits on the road looking straight down it. A world point is
 * described by how far ahead it is (`z`, metres), how far off the road centre
 * it sits (`x`, metres, right-positive) and how high it stands off the tarmac
 * (`y`, metres).
 *
 * `project()` is the definition of that mapping, and the roadside furniture and
 * the exit-sign overlay both go through it so the canvas and the DOM agree.
 * The one deliberate exception is `RoadCanvas.buildPoints`, which inlines the
 * same maths for the road ribbon — see the comment there for why. If you change
 * the projection, change it here and check that one call site.
 */

/**
 * Where things sit across a divided highway.
 *
 * `x = 0` is the **median edge** of the carriageway you are driving on, not a
 * centre line — there is no centre line, because the traffic coming the other
 * way is behind a barrier rather than behind paint. Reading left to right:
 *
 *     -OPPOSING_EDGE .. -MEDIAN_WIDTH   the opposing carriageway
 *     -MEDIAN_WIDTH  .. 0               the median, with the barrier down it
 *      0             .. CARRIAGEWAY     your carriageway
 *
 * This used to be a single `ROAD_HALF = 5.5` measured "from the centre line",
 * with a dashed line at `x = 0` — which is the marking for a road you may
 * legally overtake into oncoming traffic on, not a highway.
 */
export const CARRIAGEWAY = 5.5 // metres, median edge line to outer edge line
export const MEDIAN_WIDTH = 4.2 // metres of median between the two carriageways
export const OPPOSING_EDGE = MEDIAN_WIDTH + CARRIAGEWAY // far side's outer edge
export const CAM_HEIGHT = 1.35 // driver eye height above the tarmac

/**
 * Where the car actually sits across the road.
 *
 * You drive *in a lane*, not astride the median — so the camera is offset into
 * the carriageway, and the median runs down the left of the view where it
 * belongs.
 *
 * What this does **not** do is move the vanishing point. `project()` divides
 * the lateral offset by `z`, so the offset only shifts the road's *near* field:
 * measured, the road centre lands 201px left of centre at 10m, 15px at 100m,
 * and converges on the screen centre exactly (960.00 of 960 at 1e6 m). The
 * camera is the driver's eye and it looks straight down the road, so the eye
 * is always at the middle of the image — which is why the cockpit is laid out
 * around the middle of the viewport, not around some offset seat position.
 */
export const LANE_OFFSET = 2.7

/**
 * The car's lateral position: its lane, the ramp it is on, plus steering drift.
 *
 * `sim.ramp` is how far the exit/entrance ramp has carried the road away from
 * the mainline at the car's own position — it is `rampAt(sim.travel)`, kept on
 * the sim by `useDrive` so this stays a pure function of the sim and `world.js`
 * need not know what the route looks like. It is added *outside* `sim.x` so
 * steering still re-centres to the middle of whichever lane you are in, on the
 * highway or on the ramp, exactly as before.
 */
export function cameraX(sim) {
  return LANE_OFFSET + (sim.ramp ?? 0) + sim.x
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
