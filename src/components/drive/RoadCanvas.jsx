import { useEffect, useRef } from 'react'
import { paletteAt, withAlpha } from './daylight'
import {
  BANK_TOP_OFFSET,
  LEG_LENGTH,
  RAMP_OFFSET,
  RAMP_SEPARATES,
  RAMP_WIDTH,
  rampAt,
  rampDropAt,
  roadsideAt,
  routeLength,
} from './route'
import {
  CAM_HEIGHT,
  CARRIAGEWAY,
  LANE_OFFSET,
  LANE_WIDTH,
  LANES,
  MEDIAN_WIDTH,
  OPPOSING_EDGE,
  Z_FAR,
  Z_NEAR,
  cameraX,
  curveAt,
  hillAt,
  makeCamera,
  project,
} from './world'

const SEGMENTS = 130
const DASH_PERIOD = 14 // metres of "on" then "off" for a broken lane line
const DELINEATOR_SPACING = 24
const LAMP_SPACING = 72

// Mile markers sit at half a leg, far sparser than the 24m delineator line so
// they read as progress rather than clutter. Derived rather than typed: this
// was `110` beside a comment promising "half a leg", correct only while the
// leg happened to be 220.
const MARKER_SPACING = LEG_LENGTH / 2

export function RoadCanvas({ drive, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let camera = makeCamera(canvas.clientWidth || 1, canvas.clientHeight || 1)

    const points = []

    /**
     * The road ribbon. This deliberately inlines the same maths as
     * `project()` in world.js rather than calling it: it runs SEGMENTS+1 times
     * every frame, writes into pre-allocated point objects, and hoists the two
     * base trig terms out of the loop. Going through `project()` would add an
     * allocation and recompute `curveAt(sim.travel)`/`hillAt(sim.travel)` for
     * every point. Keep the two in step by hand.
     */
    function buildPoints(sim) {
      const { width, focal, horizon } = camera
      const baseCurve = curveAt(sim.travel)
      // The eye's own elevation includes how far the ramp has taken it down.
      const baseHill = hillAt(sim.travel) + (sim.drop ?? 0)

      for (let i = 0; i <= SEGMENTS; i += 1) {
        // Log spacing in depth gives roughly even spacing on screen.
        const z = Z_NEAR * Math.pow(Z_FAR / Z_NEAR, i / SEGMENTS)
        const s = sim.travel + z
        const scale = focal / z
        const point = points[i] || (points[i] = {})
        point.z = z
        point.s = s
        point.scale = scale
        point.cx = width / 2 + (curveAt(s) - baseCurve - cameraX(sim)) * scale
        point.y = horizon + (CAM_HEIGHT + baseHill - hillAt(s)) * scale
        // The ramp offset at this point's own world position. Computed once
        // here rather than per ribbon: five ribbons follow the ramp, and this
        // turns 5xN calls a frame into N. Allocates nothing (guardrail 14).
        point.ramp = rampAt(s)
        // Two surfaces exist at this depth now: the mainline at `point.y`, and
        // the ramp, which has fallen `rampDropAt(s)` below it. A ribbon that
        // follows the ramp has to follow it *down* as well as across, or the
        // exit slides sideways while staying glued to the highway's grade.
        point.drop = rampDropAt(s)
        point.yRamp = point.y - point.drop * scale
      }
    }

    /**
     * Fill one continuous ribbon of road between two lateral offsets.
     *
     * `follow` slides the ribbon sideways with the ramp at each point, which is
     * what makes an off-ramp peel away from a mainline that carries straight on
     * — both are painted by this one function, one following and one not.
     */
    function ribbon(first, last, from, to, fill, follow = false) {
      if (last <= first) return
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = first; i <= last; i += 1) {
        const point = points[i]
        const slide = follow ? point.ramp : 0
        const y = follow ? point.yRamp : point.y
        const x = point.cx + (from + slide) * point.scale
        if (i === first) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let i = last; i >= first; i -= 1) {
        const point = points[i]
        const slide = follow ? point.ramp : 0
        ctx.lineTo(
          point.cx + (to + slide) * point.scale,
          follow ? point.yRamp : point.y
        )
      }
      ctx.closePath()
      ctx.fill()
    }

    function band(from, to, fill, follow = false) {
      ribbon(0, SEGMENTS, from, to, fill, follow)
    }

    /**
     * Every contiguous run of segments where `test` holds, as one ramp-following
     * ribbon. The ramp's own edge lines use this: they must not be painted while
     * the ramp is still a deceleration lane inside the carriageway, or there
     * would be a white line down the middle of the lane you are driving in.
     */
    function ribbonRuns(from, to, fill, test) {
      let runStart = -1
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = test(points[i])
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          ribbon(runStart, i, from, to, fill, true)
          runStart = -1
        }
      }
    }

    /**
     * Paint every "on" stretch of a repeating pattern as a single ribbon.
     * Filling each segment separately would leave anti-aliasing seams.
     */
    function stripes(from, to, period, fill, follow = false) {
      let runStart = -1
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = Math.floor(points[i].s / period) % 2 === 0
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          ribbon(runStart, i, from, to, fill, follow)
          runStart = -1
        }
      }
    }

    /**
     * The gore: the wedge of no-man's-land between the mainline's outer edge
     * and the ramp's inner edge, once the ramp has pulled away.
     *
     * Its two sides move differently — the left edge belongs to the highway and
     * stays put, the right edge belongs to the ramp and slides — so none of the
     * `ribbon` family can draw it: they take one `follow` flag for both edges.
     * `embankment` already had this shape (fixed top, computed foot) and this
     * borrows it.
     *
     * `phase` gates which stretches are painted, which is what turns a solid
     * wedge into hatching. Runs are accumulated the same way `stripes` does, to
     * avoid anti-aliasing seams between adjacent segments.
     */
    function goreRuns(fill, minWidth, phase) {
      const spans = (point) =>
        point.ramp - RAMP_WIDTH / 2 - CARRIAGEWAY > minWidth && phase(point)
      let runStart = -1
      ctx.fillStyle = fill
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = spans(points[i])
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          if (i > runStart) {
            ctx.beginPath()
            for (let k = runStart; k <= i; k += 1) {
              const point = points[k]
              const x = point.cx + CARRIAGEWAY * point.scale
              if (k === runStart) ctx.moveTo(x, point.y)
              else ctx.lineTo(x, point.y)
            }
            for (let k = i; k >= runStart; k -= 1) {
              const point = points[k]
              const inner = LANE_OFFSET + point.ramp - RAMP_WIDTH / 2
              ctx.lineTo(point.cx + inner * point.scale, point.yRamp)
            }
            ctx.closePath()
            ctx.fill()
          }
          runStart = -1
        }
      }
    }

    /**
     * A rail standing above the verge, filled as one continuous shape between
     * two heights. Same reason `stripes` exists: filling each segment on its
     * own leaves anti-aliasing seams down the length of it.
     */
    function rail(first, last, lateral, low, high, fill, follow = false) {
      if (last <= first) return
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = first; i <= last; i += 1) {
        const point = points[i]
        const base = follow ? point.yRamp : point.y
        const x = point.cx + (lateral + (follow ? point.ramp : 0)) * point.scale
        const y = base - high * point.scale
        if (i === first) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let i = last; i >= first; i -= 1) {
        const point = points[i]
        const base = follow ? point.yRamp : point.y
        ctx.lineTo(
          point.cx + (lateral + (follow ? point.ramp : 0)) * point.scale,
          base - low * point.scale
        )
      }
      ctx.closePath()
      ctx.fill()
    }

    /**
     * The embankment: the ground falling from the mainline's verge down to the
     * ramp's grade, which is what you are actually looking at when the exit has
     * dropped away below the highway.
     *
     * Its top edge is drawn at `point.y` and its bottom edge at `point.yRamp` —
     * the *same* two values the mainline and the ramp are painted from, so the
     * face cannot drift away from either road however the ramp is tuned.
     *
     * Only drawn where the ramp has moved far enough right that there is real
     * ground between the two; nearer the mainline the ramp is still part of the
     * carriageway and there is nothing to embank.
     */
    function embankment(fill) {
      const TOP = BANK_TOP
      const footOf = (point) => bankFoot(point.ramp, point.drop)

      // Gated on **elevation difference**, not on lateral separation. Gating it
      // on separation was the bug: the ramp starts falling long before it moves
      // meaningfully sideways, so along the whole first half of the taper there
      // was a real height difference with nothing drawn to fill it — an empty
      // gap under the highway, and a road that appeared to snap back to grade 0
      // on the way back up. The face now exists wherever the two grades differ,
      // and shrinks to nothing exactly as they converge.
      const spans = (point) => point.drop < -0.02

      let runStart = -1
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = spans(points[i])
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          if (i > runStart) {
            ctx.fillStyle = fill
            ctx.beginPath()
            for (let k = runStart; k <= i; k += 1) {
              const point = points[k]
              const x = point.cx + TOP * point.scale
              // Up to the **underside of the shoulder rail**, not to the road
              // surface. This is the void the owner kept reporting and I kept
              // failing to find: the rail hangs 0.42m above grade, the bank
              // stopped at grade, and nothing painted the 0.42m between them.
              // On the mainline that slot is harmless — the verge behind it is
              // painted. From the ramp it is not: the deck is a flat surface
              // above the eye and correctly clipped, so behind the slot there
              // is nothing, and the canvas is transparent there. Measured on a
              // frozen mid-ramp frame (drop -4.15): alpha **0** at y206-212,
              // sky showing through a seam between rail and bank.
              const yTop = point.y - SHOULDER_RAIL_FOOT * point.scale
              if (k === runStart) ctx.moveTo(x, yTop)
              else ctx.lineTo(x, yTop)
            }
            for (let k = i; k >= runStart; k -= 1) {
              const point = points[k]
              ctx.lineTo(point.cx + footOf(point) * point.scale, point.yRamp)
            }
            ctx.closePath()
            ctx.fill()
          }
          runStart = -1
        }
      }
    }

    /**
     * The top of the bank: the outer edge of the mainline's verge. Imported
     * rather than typed here — `route` needs the same number to know when the
     * ramp has cleared the verge and may start descending.
     */
    const BANK_TOP = BANK_TOP_OFFSET

    /**
     * How high the shoulder guardrail's underside sits above the mainline
     * grade. Shared with the `railRuns` call that paints it, so the bank can
     * close the gap under it exactly — the two drifting apart is what left a
     * transparent seam along the whole length of every embankment.
     */
    const SHOULDER_RAIL_FOOT = 0.42

    /**
     * How far out the bank runs for every metre it falls. Real highway
     * embankments sit around 1:2 to 1:3; 2.6 reads as earth rather than
     * engineering. This is what stops the face being a 90-degree wall — the run
     * is a function of the drop, so the bank lies back further the deeper the
     * exit goes instead of standing upright.
     */
    const SLOPE_RUN = 2.6

    /**
     * Where the bank meets the lower ground. **One definition, used by both the
     * face and the planting on it** — they each had their own before, and
     * disagreed by ~1.7m at full ramp, which floated the flowers off the slope.
     *
     * This line was wrong four times, and every fix failed the same way because
     * they were all fixes to the wrong thing. The ramp used to start *falling*
     * while it was still laterally inside the carriageway, so there were spans
     * where the ramp was below the mainline and underneath it — a shape with no
     * ground between the two to slope, which no clamp can express. Flooring
     * gave a vertical face; gating gave a 3.7m step where the gate flipped.
     *
     * `route.dropProgress` now holds the descent until the ramp has cleared
     * `BANK_TOP_OFFSET`, so wherever `drop` is non-zero the ramp edge is
     * genuinely outboard of the bank's top and there is real ground between
     * them. That makes this the plain minimum it always wanted to be:
     * `slopeFoot` where the slope has room, the ramp edge where it doesn't.
     * Both terms are continuous in `s`, so the foot is too.
     *
     * **One definition, used by both the face and the planting on it** — they
     * each had their own before and disagreed by ~1.7m at full ramp, which
     * floated the flowers off the slope.
     */
    function bankFoot(ramp, drop) {
      const slopeFoot = BANK_TOP - drop * SLOPE_RUN
      const rampEdge = LANE_OFFSET + ramp - RAMP_WIDTH / 2 - 1.2
      return Math.min(rampEdge, slopeFoot)
    }

    /**
     * Grass and wildflowers on the embankment face.
     *
     * Deterministic, not random: the offsets come from the tuft's own index,
     * so the same plant is in the same place every frame and on every machine
     * (guardrail 25 — `Math.random` in the paint loop makes the scene
     * non-reproducible and can differ between server and client). Nothing is
     * allocated per tuft beyond the two `project` results the rest of the
     * roadside furniture already costs.
     */
    function vegetation(sim, colors) {
      const SPACING = 6
      const first = Math.ceil((sim.travel + Z_NEAR) / SPACING)
      const last = Math.floor((sim.travel + 190) / SPACING)
      const place = (s, x, y) => project(camera, sim, s - sim.travel, x, y)

      for (let n = last; n >= first; n -= 1) {
        const s = n * SPACING
        const drop = rampDropAt(s)
        if (drop > -0.35) continue // no slope here, nothing to plant on
        // The same foot the face itself is drawn from — see `bankFoot`.
        const top = BANK_TOP
        const foot = bankFoot(rampAt(s), drop)

        for (let k = 0; k < 4; k += 1) {
          // Spread across the face, biased away from both edges.
          const t = 0.12 + (((n * 7 + k * 23) % 76) / 76) * 0.76
          const x = top + (foot - top) * t
          const ground = drop * t // the face falls linearly between the grades
          const height = 0.34 + (((n + k * 5) % 7) / 7) * 0.3
          const base = place(s, x, ground)
          const tip = place(s, x, ground + height)
          if (base.y < camera.horizon || base.scale <= 0) continue

          ctx.strokeStyle = withAlpha(colors.vergeLight, 0.85)
          ctx.lineWidth = Math.max(0.6, 0.05 * base.scale)
          ctx.beginPath()
          ctx.moveTo(base.x, base.y)
          ctx.lineTo(tip.x + 0.12 * base.scale, tip.y)
          ctx.stroke()

          // One tuft in five carries a flower, warm against the grass.
          if ((n + k) % 5 === 0) {
            const petal = Math.max(0.7, 0.075 * base.scale)
            ctx.fillStyle =
              (n + k) % 10 === 0
                ? 'rgba(244, 208, 122, 0.9)'
                : 'rgba(226, 170, 196, 0.85)'
            ctx.beginPath()
            ctx.arc(tip.x + 0.12 * base.scale, tip.y, petal, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    /** Every contiguous run of segments where `test` holds, as one rail. */
    function railRuns(lateral, low, high, fill, test, follow = false) {
      let runStart = -1
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = test(points[i].s)
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          rail(runStart, i, lateral, low, high, fill, follow)
          runStart = -1
        }
      }
    }

    const hasGuardrail = (s) => roadsideAt(s).guardrail

    function drawRoadside(sim, colors) {
      const { focal, horizon, width, height } = camera
      const baseCurve = curveAt(sim.travel)
      const baseHill = hillAt(sim.travel)

      // Roadside furniture goes through the shared projection. It already
      // returned a fresh object per call, so routing it through project() costs
      // nothing and removes a second copy of the camera maths.
      const place = (s, x, y) => project(camera, sim, s - sim.travel, x, y)

      /**
       * The outer edge of the road on a given side, at that position's own `s`.
       *
       * Right-hand furniture rides the ramp: it stands on the verge of the road
       * you are driving on, so at an interchange it swings out with the ramp
       * instead of being left standing in the middle of it. Left-hand furniture
       * moved out to the *far* carriageway's outer edge, since everything
       * between you and it is now median and opposing tarmac.
       */
      const edge = (s, side) =>
        side > 0 ? CARRIAGEWAY + rampAt(s) : -OPPOSING_EDGE

      /**
       * Ground level for something standing on a given side, as a `y` offset.
       *
       * Right-hand furniture rides the ramp, so it also has to ride it
       * *downhill* — otherwise the lamps and posts along the exit stay pegged
       * at the highway's grade while the road sinks away beneath them, and the
       * ramp appears to burrow underground. Left-hand furniture is on the far
       * carriageway, which never leaves the mainline grade.
       */
      const ground = (s, side) => (side > 0 ? rampDropAt(s) : 0)

      // Far to near so nearer objects paint over distant ones.
      const firstLamp = Math.ceil((sim.travel + Z_NEAR) / LAMP_SPACING)
      const lastLamp = Math.floor((sim.travel + 320) / LAMP_SPACING)
      for (let n = lastLamp; n >= firstLamp; n -= 1) {
        const s = n * LAMP_SPACING
        // Which leg this mast stands on decides whether it stands at all.
        const every = roadsideAt(s).lampEvery
        if (n % every !== 0) continue
        // Keep alternating sides even where the line has been thinned.
        const side = Math.floor(n / every) % 2 === 0 ? 1 : -1
        const base = edge(s, side)
        const g = ground(s, side)
        const foot = place(s, base + side * 2.6, g)
        const head = place(s, base + side * 2.6, g + 8.6)
        const arm = place(s, base - side * 0.4, g + 8.2)
        const thickness = Math.max(1, 0.22 * foot.scale)

        ctx.strokeStyle = 'rgba(148, 170, 196, 0.5)'
        ctx.lineWidth = thickness
        ctx.beginPath()
        ctx.moveTo(foot.x, foot.y)
        ctx.lineTo(head.x, head.y)
        ctx.lineTo(arm.x, arm.y)
        ctx.stroke()

        // Lamps warm up as dusk turns to night, and dim again at first light.
        const glow = Math.max(2, 1.6 * arm.scale)
        const halo = ctx.createRadialGradient(
          arm.x,
          arm.y,
          0,
          arm.x,
          arm.y,
          glow * 3
        )
        halo.addColorStop(0, withAlpha(colors.lamp, 0.55 * colors.lampAlpha))
        halo.addColorStop(1, withAlpha(colors.lamp, 0))
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(arm.x, arm.y, glow * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = withAlpha(colors.lamp, 0.35 + 0.65 * colors.lampAlpha)
        ctx.beginPath()
        ctx.arc(arm.x, arm.y, glow * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Mile markers: a small plate on a slim post, half a leg apart, so the
      // long stretches between exits still show progress.
      const firstMarker = Math.ceil((sim.travel + Z_NEAR) / MARKER_SPACING)
      const lastMarker = Math.floor((sim.travel + 260) / MARKER_SPACING)
      for (let n = lastMarker; n >= firstMarker; n -= 1) {
        const s = n * MARKER_SPACING
        // Set further out than the delineator line and standing taller, so a
        // marker never reads as just another reflector post.
        const marker = CARRIAGEWAY + rampAt(s) + 2.5
        const g = rampDropAt(s)
        const foot = place(s, marker, g)
        const plate = place(s, marker, g + 1.9)
        if (foot.y > height * 1.4 || plate.y < horizon - 4) continue

        ctx.strokeStyle = 'rgba(170, 188, 208, 0.45)'
        ctx.lineWidth = Math.max(0.8, 0.12 * foot.scale)
        ctx.beginPath()
        ctx.moveTo(foot.x, foot.y)
        ctx.lineTo(plate.x, plate.y)
        ctx.stroke()

        const w = Math.max(3, 0.95 * plate.scale)
        const h = Math.max(2.2, 0.7 * plate.scale)
        ctx.fillStyle = withAlpha(colors.signFace, 0.95)
        ctx.fillRect(plate.x - w / 2, plate.y - h, w, h)
        ctx.strokeStyle = 'rgba(236, 246, 255, 0.75)'
        ctx.lineWidth = Math.max(0.4, 0.05 * plate.scale)
        ctx.strokeRect(plate.x - w / 2, plate.y - h, w, h)
      }

      // Reflective delineator posts read as pure speed.
      const firstPost = Math.ceil((sim.travel + Z_NEAR) / DELINEATOR_SPACING)
      const lastPost = Math.floor((sim.travel + 220) / DELINEATOR_SPACING)
      for (let n = lastPost; n >= firstPost; n -= 1) {
        const s = n * DELINEATOR_SPACING
        for (const side of [-1, 1]) {
          const post = edge(s, side) + side * 1.1
          const g = ground(s, side)
          const foot = place(s, post, g)
          const top = place(s, post, g + 1.05)
          if (foot.y > height * 1.4 || top.y < horizon - 4) continue
          ctx.strokeStyle = 'rgba(190, 205, 222, 0.4)'
          ctx.lineWidth = Math.max(0.8, 0.12 * foot.scale)
          ctx.beginPath()
          ctx.moveTo(foot.x, foot.y)
          ctx.lineTo(top.x, top.y)
          ctx.stroke()
          ctx.fillStyle =
            side > 0 ? 'rgba(255, 190, 110, 0.9)' : 'rgba(180, 225, 255, 0.85)'
          const dot = Math.max(1, 0.16 * top.scale)
          ctx.beginPath()
          ctx.arc(top.x, top.y, dot, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    /**
     * The last state we actually painted, and a flag that forces the next
     * paint regardless. See `draw()` for why this exists.
     */
    let paintedTravel = Number.NaN
    let paintedX = Number.NaN
    let forcePaint = true

    // 1e-4 m of movement. At the nearest projected point the scale is roughly
    // 335 px/m, so this is ~0.03 of a pixel — below anything that can be seen,
    // and far below the rounding the canvas does anyway.
    const STILL = 1e-4

    function draw(sim) {
      // Parked, the picture cannot change: `draw` reads `sim.travel` and
      // `sim.x` (the latter only through `cameraX`) plus `camera`, and nothing
      // else — no randomness, no clock. So repainting an identical image every
      // frame is pure cost on a page someone leaves open while reading a stop.
      //
      // Two details matter. The comparison is against the last *painted*
      // state, not the previous frame, so slow continuous motion accumulates
      // and still triggers a repaint instead of freezing. And `sim.x` decays
      // asymptotically toward 0 while parked, so this has to be a tolerance
      // rather than equality or it would never skip anything.
      if (
        !forcePaint &&
        Math.abs(sim.travel - paintedTravel) < STILL &&
        Math.abs(sim.x - paintedX) < STILL
      ) {
        return
      }
      forcePaint = false
      paintedTravel = sim.travel
      paintedX = sim.x

      const { width, height, horizon } = camera
      ctx.clearRect(0, 0, width, height)

      // Where we are along the route decides what time of day it is.
      const colors = paletteAt(routeLength > 0 ? sim.travel / routeLength : 0)

      const ground = ctx.createLinearGradient(0, horizon - 4, 0, height)
      ground.addColorStop(0, colors.groundFar)
      ground.addColorStop(1, colors.groundNear)
      ctx.fillStyle = ground
      ctx.fillRect(0, horizon - 6, width, height - horizon + 6)

      buildPoints(sim)

      // Everything from here to the matching `restore()` is a **flat surface**,
      // and a flat surface above your eye cannot be seen — you are looking at
      // its edge, or at whatever holds it up. Once the ramp drops far enough
      // the mainline sits above the eyeline entirely, and without this clip it
      // paints as a wedge of tarmac across the sky (measured at a 6.5m drop in
      // cycle 58: the highway hung over the windscreen).
      //
      // Standing objects are deliberately outside this: an 8.6m lamp mast, the
      // median barrier and the embankment face all cross the eyeline honestly.
      // The ground gradient above is outside it too, so nothing the clip
      // removes can leave sky showing through.
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, horizon, width, Math.max(0, height - horizon))
      ctx.clip()

      // Wide enough to cover both carriageways, the median, and the ramp at
      // full offset — the ground beneath everything the road is made of.
      band(
        -(OPPOSING_EDGE + 22),
        CARRIAGEWAY + RAMP_OFFSET + 22,
        colors.vergeDark
      )

      // The ground **at the ramp's own grade**, following it down.
      //
      // The band above is drawn at mainline grade, so the moment the ramp
      // descends it sits above the eyeline and the clip removes it — correctly,
      // since you cannot see ground that is above you. But nothing replaced it,
      // so the ramp became tarmac floating over the background gradient with an
      // empty void either side of it, for the whole descent. The embankment
      // only ever filled the wedge between the highway and the ramp; it never
      // gave the ramp any ground of its own.
      band(-(CARRIAGEWAY + 26), CARRIAGEWAY + 26, colors.vergeDark, true)

      // Rumble bands on the two outer verges, alternating with distance. The
      // right-hand one follows the ramp, because the right-hand verge is the
      // shoulder of whichever road you are actually on.
      stripes(-(OPPOSING_EDGE + 2.4), -OPPOSING_EDGE, 9, colors.vergeLight)
      stripes(CARRIAGEWAY, CARRIAGEWAY + 2.4, 9, colors.vergeLight, true)

      const tarmac = ctx.createLinearGradient(0, horizon, 0, height)
      tarmac.addColorStop(0, colors.tarmacFar)
      tarmac.addColorStop(1, colors.tarmacNear)

      // The carriageway coming the other way. Empty, and it stays empty — the
      // owner asked for the invented traffic to come off this road, so what
      // makes it a highway is the barrier and the second carriageway, not
      // vehicles on it.
      band(-OPPOSING_EDGE, -MEDIAN_WIDTH, tarmac)
      // Yours. The median strip between the two is left as verge.
      band(0, CARRIAGEWAY, tarmac)
      // The ramp. On the open highway its offset is 0 and it lies exactly on
      // the lane you are in, so it paints nothing you can see; approaching a
      // stop it slides right and peels out of the carriageway, opening a wedge
      // of verge between the two. That wedge is the gore, and it comes out of
      // the geometry rather than being drawn as a special case.
      band(
        LANE_OFFSET - RAMP_WIDTH / 2,
        LANE_OFFSET + RAMP_WIDTH / 2,
        tarmac,
        true
      )

      // Gore markings. Every real interchange paints this wedge, and it is the
      // most recognisable marking an exit has — without it the road simply
      // forks. Deliberately **inside the clip** with the other flat surfaces:
      // painted after `ctx.restore()` it would hang in the sky on the descent,
      // which is exactly what the mainline tarmac did in cycle 58.
      //
      // Chevrons proper would need per-segment geometry; these are transverse
      // bands across the wedge, which is what hatching reduces to once the
      // perspective has flattened it, and they reuse the run-accumulating shape
      // the rumble strips already use.
      const GORE_PERIOD = 7
      goreRuns(
        withAlpha(colors.paint, 0.34),
        0.8,
        (point) => Math.floor(point.s / GORE_PERIOD) % 2 === 0
      )

      const paint = withAlpha(colors.paint, 0.82)
      // Median-side lines are yellow, outer edges white — the same convention
      // that used to be carried by the centre line this replaces.
      const medianLine = withAlpha(colors.centreLine, 0.85)

      // Your carriageway: yellow against the median, white on the outside.
      band(0.25, 0.55, medianLine)
      band(CARRIAGEWAY - 0.55, CARRIAGEWAY - 0.25, paint)
      // The opposing carriageway, mirrored.
      band(-MEDIAN_WIDTH - 0.55, -MEDIAN_WIDTH - 0.25, medianLine)
      band(-OPPOSING_EDGE + 0.25, -OPPOSING_EDGE + 0.55, paint)

      // Lane lines. Broken white, one between each pair of lanes on each
      // carriageway — this is what makes it read as a highway rather than a
      // single-lane road with a barrier beside it. Derived from LANES, so
      // adding a third lane draws its line without another edit here.
      const laneLine = withAlpha(colors.paint, 0.7)
      for (let lane = 1; lane < LANES; lane += 1) {
        const at = lane * LANE_WIDTH
        stripes(at - 0.15, at + 0.15, DASH_PERIOD, laneLine)
        stripes(
          -MEDIAN_WIDTH - at - 0.15,
          -MEDIAN_WIDTH - at + 0.15,
          DASH_PERIOD,
          laneLine
        )
      }

      // The ramp's own edge lines, painted only where it has actually left the
      // carriageway. While it is still a deceleration lane these would be two
      // white stripes down the middle of the lane you are driving in.
      const separated = (point) => point.ramp > RAMP_SEPARATES
      ribbonRuns(
        LANE_OFFSET - RAMP_WIDTH / 2 + 0.05,
        LANE_OFFSET - RAMP_WIDTH / 2 + 0.35,
        paint,
        separated
      )
      ribbonRuns(
        LANE_OFFSET + RAMP_WIDTH / 2 - 0.35,
        LANE_OFFSET + RAMP_WIDTH / 2 - 0.05,
        paint,
        separated
      )

      // End of the flat surfaces. Everything below stands up off the ground.
      ctx.restore()

      // The face between the two grades, filling what the clip just opened up.
      embankment(colors.vergeDark)
      vegetation(sim, colors)
      // The highway's outer barrier, running its full length. **This is what
      // closes the void beside the road, and an 0.18m lip did not.**
      //
      // From the ramp you are *below* the mainline, so every flat surface it
      // has is correctly invisible — you cannot see the top of a road that is
      // above your eye. The embankment gave the highway a side; but above that
      // side there was nothing at all, because the deck itself is edge-on and
      // unseen. The eye reads that as a hole where the road should be.
      //
      // A real highway on an embankment is legible from beside it precisely
      // because its barrier stands against the sky. So the shoulder carries
      // one, the full length of the road, the same two-tone treatment as the
      // median barrier: a solid body and a lit cap.
      // **Opaque.** This was `withAlpha(..., 0.9)` over a `0.5` cap, and a
      // barrier you can see the sky through is not a barrier — the owner:
      // "why the hell am I able to see through the road???". Concrete is not
      // 90% opaque. Only the highlight along the top keeps any alpha, because
      // a lit edge is a reflection rather than a material.
      // A **guardrail**, not a wall: it hangs at rail height with the bank
      // visible under it, so the road's edge still reads against the sky
      // without putting a slab of concrete beside the carriageway. It was
      // 0.92m of solid, which is a parapet — and a parapet is the other way of
      // getting the 90-degree wall the bank was just fixed to avoid.
      //
      // **It breaks at the gore, because the ramp crosses it.** It ran the full
      // length with a `() => true` test, fixed in world space at the mainline's
      // shoulder, while the ramp sweeps from the running lane out past it — so
      // every exit and every entrance drove the car straight through a steel
      // barrier. The owner, plainly: "we're literally just driving through the
      // highway rail." A barrier that closes the void is worth nothing if the
      // road goes through it.
      //
      // Real interchanges open the shoulder rail at the gore for exactly this
      // reason and resume it past the nose. The opening is derived from the
      // ramp's own footprint rather than from a hand-tuned span of `s`, so it
      // stays correct if `RAMP_OFFSET`, `RAMP_WIDTH` or the ramp curve is
      // retuned — the same lesson as `RAMP_LENGTH` and `BANK_TOP_OFFSET`.
      const shoulder = CARRIAGEWAY + 2.4
      const GORE_CLEARANCE = 0.7
      const railClearOfRamp = (s) => {
        const centre = LANE_OFFSET + rampAt(s)
        const inner = centre - RAMP_WIDTH / 2 - GORE_CLEARANCE
        const outer = centre + RAMP_WIDTH / 2 + GORE_CLEARANCE
        return shoulder < inner || shoulder > outer
      }
      railRuns(
        shoulder,
        SHOULDER_RAIL_FOOT,
        0.72,
        colors.vergeLight,
        railClearOfRamp
      )
      railRuns(
        shoulder,
        0.66,
        0.72,
        withAlpha(colors.paint, 0.8),
        railClearOfRamp
      )

      // The median barrier. This is what makes it a divided highway rather than
      // a road you may legally overtake into oncoming traffic on: the traffic
      // coming the other way is behind concrete, not behind a dashed line.
      const barrierX = -MEDIAN_WIDTH / 2
      rail(0, SEGMENTS, barrierX, 0, 0.92, withAlpha(colors.vergeLight, 0.95))
      rail(0, SEGMENTS, barrierX, 0.74, 0.92, withAlpha(colors.paint, 0.45))

      // Guardrail along the scenic overlook — the one leg with a drop beside
      // it. Painted before the roadside furniture so lamps stand in front, and
      // following the ramp so it stays on the outside of the road it guards.
      railRuns(
        CARRIAGEWAY + 1.9,
        0.42,
        0.78,
        withAlpha(colors.paint, 0.5),
        hasGuardrail,
        true
      )
      railRuns(
        CARRIAGEWAY + 1.9,
        0.2,
        0.44,
        withAlpha(colors.vergeDark, 0.95),
        hasGuardrail,
        true
      )

      drawRoadside(sim, colors)

      // Haze so the tarmac dissolves into the sky instead of ending abruptly.
      const haze = ctx.createLinearGradient(
        0,
        horizon - 2,
        0,
        horizon + height * 0.14
      )
      haze.addColorStop(0, withAlpha(colors.haze, colors.hazeAlpha))
      haze.addColorStop(1, withAlpha(colors.haze, 0))
      ctx.fillStyle = haze
      ctx.fillRect(0, horizon - 2, width, height * 0.14 + 2)
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      camera = makeCamera(width, height)
      // Setting `canvas.width` above wiped the backing store, so this paint
      // must happen even though the car has not moved.
      forcePaint = true
      draw(drive.simRef.current)
    }

    resize()
    window.addEventListener('resize', resize)
    const unsubscribe = drive.subscribe(draw)

    return () => {
      window.removeEventListener('resize', resize)
      unsubscribe()
    }
  }, [drive])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
