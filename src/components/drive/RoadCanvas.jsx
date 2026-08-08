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

const SEGMENTS = 170
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

    /**
     * `?probe=barrier` — tint one element a colour no palette contains.
     *
     * The shoulder barrier's gore opening is the one scene invariant that
     * **cannot** be measured from a composited frame: the barrier shares its
     * colour with the ramp's edge lines and the rumble strips, and those *grow*
     * as the ramp separates, so counting bright pixels near the shoulder reports
     * the barrier present while it is absent. The only method that works is to
     * repaint it magenta — which until now meant editing this file, rebuilding,
     * measuring, reverting, and grepping to prove the revert. Five steps and a
     * build is why **that opening regressed once and nothing caught it**.
     *
     * Read here, inside the effect, and never during render: the server has no
     * `location`, and branching on it in the render path is the hydration
     * mismatch guardrail 1 exists for.
     *
     * It changes a **fill and nothing else**. A debug affordance that moved
     * geometry would corrupt the very measurement it exists to enable, so the
     * void sweep must come out identical with the flag on and off.
     */
    const probe = new URLSearchParams(window.location.search).get('probe')
    const PROBE_TINT = '#ff00ff'

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
     *
     * **Every** vertex clamps to the camera eye line, mainline and ramp alike,
     * so a surface above you cannot paint as a sky wedge — see `yOf`. Clamping
     * only the mainline is what split the road at its junction; the full-canvas
     * horizon clip that preceded both was worse still, hiding the peel-off
     * entirely because a screen-space rectangle cannot track road elevation.
     */
    function ribbon(first, last, from, to, fill, follow = false) {
      if (last <= first) return
      const { horizon } = camera
      /**
       * **One rule, applied to whichever surface the vertex belongs to.**
       *
       * This clamped the mainline and left the ramp alone, and that asymmetry
       * was the seam the owner kept reporting: _"a horizontal gap separation
       * with what the car is immediately driving on… and the point of entry
       * where the main highway road is. this gap should NOT exist."_
       *
       * At the point of entry `drop` is 0, so `yRamp === y` — the ramp and the
       * mainline are the **same surface at the same height** and must join
       * seamlessly. Clamping one and not the other tore them apart along a
       * horizontal line exactly where they had to be continuous.
       *
       * The cull itself is sound and stays: a flat surface above your eye
       * cannot be seen, which is why a 6.5m drop painted tarmac as a wedge
       * across the sky in cycle 58. That is equally true of the ramp — so both
       * are culled by the same test, against each vertex's own height.
       *
       * Where the two genuinely differ in elevation they still separate, and
       * they should: that is the descent, and it is the **only** separation the
       * owner wants visible between the highway and the exit.
       */
      const yOf = (point) => {
        const y = follow ? point.yRamp : point.y
        return y < horizon ? horizon : y
      }
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = first; i <= last; i += 1) {
        const point = points[i]
        const slide = follow ? point.ramp : 0
        const x = point.cx + (from + slide) * point.scale
        const y = yOf(point)
        if (i === first) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let i = last; i >= first; i -= 1) {
        const point = points[i]
        const slide = follow ? point.ramp : 0
        ctx.lineTo(point.cx + (to + slide) * point.scale, yOf(point))
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
     *
     * Zero lateral thickness: fine for a median barrier seen head-on, useless
     * as the *side* of an elevated deck. From the ramp you look at that edge
     * sideways, and a zero-width ribbon collapses to a line with sky showing
     * through every anti-aliased join. Use `wall` for anything that has to
     * cover a side face.
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
     * The top of the bank / highway-body shoulder. Imported rather than typed
     * here — `route` needs the same number to know when the ramp has cleared
     * the verge and may start descending.
     */
    const BANK_TOP = BANK_TOP_OFFSET

    /** Barrier height above the deck. The body itself is the deck-to-ramp face. */
    const HIGHWAY_SIDE_TOP = 0.92

    /**
     * How far out the bank runs for every metre it falls. Real highway
     * embankments sit around 1:2 to 1:3; 2.6 reads as earth rather than
     * engineering.
     */
    const SLOPE_RUN = 2.6

    /**
     * The highway body closes the void between the elevated mainline and the
     * ramp you are on. Two faces, one job:
     *
     * 1. **Elevated deck face** — when the camera is below the mainline, a solid
     *    wall under the full elevated carriageway (opposing edge → shoulder)
     *    from deck grade down to the lower grade. Without this the deck floats
     *    over a horizontal gap of empty ground — the separation marked in red.
     * 2. **Interchange wedge** — shoulder → ramp inner edge, deck → ramp grade.
     *    Opens as the ramp peels; chunked out where the ramp crosses the
     *    shoulder so the point of entry is a hole in the shape.
     *
     * Gaps that should read: the two roadways, and the elevation change between
     * them. Never a void under the highway.
     */
    function highwayBodySlice(first, last, fill, camDrop) {
      if (last <= first) return
      const shoulder = BANK_TOP
      const leftEdge = -OPPOSING_EDGE
      const rampInnerOf = (point) => LANE_OFFSET + point.ramp - RAMP_WIDTH / 2
      const clearOfIntersection = (point) => {
        const centre = LANE_OFFSET + point.ramp
        const inner = centre - RAMP_WIDTH / 2 - 0.7
        const outer = centre + RAMP_WIDTH / 2 + 0.7
        return shoulder < inner || shoulder > outer
      }
      const deeperOf = (point) => Math.min(point.drop, camDrop)

      // --- 1. Solid face under the elevated deck (kills the horizontal gap) ---
      if (camDrop < -0.15) {
        ctx.fillStyle = fill
        // Right face (toward the ramp): deck shoulder down to lower grade.
        ctx.beginPath()
        for (let i = first; i <= last; i += 1) {
          const point = points[i]
          const x = point.cx + shoulder * point.scale
          if (i === first) ctx.moveTo(x, point.y)
          else ctx.lineTo(x, point.y)
        }
        for (let i = last; i >= first; i -= 1) {
          const point = points[i]
          const deeper = deeperOf(point)
          ctx.lineTo(
            point.cx + shoulder * point.scale,
            point.y - deeper * point.scale
          )
        }
        ctx.closePath()
        ctx.fill()
        // Left face (far carriageway edge).
        ctx.beginPath()
        for (let i = first; i <= last; i += 1) {
          const point = points[i]
          const x = point.cx + leftEdge * point.scale
          if (i === first) ctx.moveTo(x, point.y)
          else ctx.lineTo(x, point.y)
        }
        for (let i = last; i >= first; i -= 1) {
          const point = points[i]
          const deeper = deeperOf(point)
          ctx.lineTo(
            point.cx + leftEdge * point.scale,
            point.y - deeper * point.scale
          )
        }
        ctx.closePath()
        ctx.fill()
        // Underside slab between those two feet — seals the void under the deck.
        ctx.beginPath()
        for (let i = first; i <= last; i += 1) {
          const point = points[i]
          const deeper = deeperOf(point)
          const x = point.cx + shoulder * point.scale
          const y = point.y - deeper * point.scale
          if (i === first) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        for (let i = last; i >= first; i -= 1) {
          const point = points[i]
          const deeper = deeperOf(point)
          ctx.lineTo(
            point.cx + leftEdge * point.scale,
            point.y - deeper * point.scale
          )
        }
        ctx.closePath()
        ctx.fill()
        // Deck top between the two edges (reads as the elevated road body).
        ctx.beginPath()
        for (let i = first; i <= last; i += 1) {
          const point = points[i]
          const x = point.cx + shoulder * point.scale
          if (i === first) ctx.moveTo(x, point.y)
          else ctx.lineTo(x, point.y)
        }
        for (let i = last; i >= first; i -= 1) {
          const point = points[i]
          ctx.lineTo(point.cx + leftEdge * point.scale, point.y)
        }
        ctx.closePath()
        ctx.fill()
      }

      // --- 2. Interchange wedge: shoulder → ramp road ---
      const spans = (point) =>
        clearOfIntersection(point) && rampInnerOf(point) - shoulder > 0.35

      let runStart = -1
      for (let i = first; i <= last; i += 1) {
        const on = spans(points[i])
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === last)) {
          if (i > runStart) {
            ctx.fillStyle = fill
            ctx.beginPath()
            for (let k = runStart; k <= i; k += 1) {
              const point = points[k]
              const x = point.cx + shoulder * point.scale
              if (k === runStart) ctx.moveTo(x, point.y)
              else ctx.lineTo(x, point.y)
            }
            for (let k = i; k >= runStart; k -= 1) {
              const point = points[k]
              ctx.lineTo(
                point.cx + rampInnerOf(point) * point.scale,
                point.yRamp
              )
            }
            ctx.closePath()
            ctx.fill()
          }
          runStart = -1
        }
      }
    }

    /**
     * Where the bank meets the lower ground. **One definition, used by the
     * planting on it.**
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
      const last = Math.floor((sim.travel + 420) / SPACING)
      const place = (s, x, y) => project(camera, sim, s - sim.travel, x, y)

      for (let n = last; n >= first; n -= 1) {
        const s = n * SPACING
        const drop = rampDropAt(s)
        if (drop > -0.35) continue // no slope here, nothing to plant on
        // The same foot the face itself is drawn from — see `bankFoot`.
        const top = BANK_TOP
        const foot = bankFoot(rampAt(s), drop)

        // One tuft, wherever it stands. Kept as a helper although only one face
        // plants now: the outboard face it also served was the trench wall, and
        // that is gone — there is one bank in this scene, the highway's.
        const tuft = (x, ground, seed) => {
          const height = 0.34 + ((seed % 7) / 7) * 0.3
          const base = place(s, x, ground)
          const tip = place(s, x, ground + height)
          if (base.y < camera.horizon || base.scale <= 0) return

          // `?probe=grass` — same trick as the barrier, for the same reason.
          // The planting invariant is the weakest one in the probe doc: flowers
          // are one tuft in five, so the honest signal is 0-12 pixels and cannot
          // separate "planting regressed" from "few tufts in this frame". Worse,
          // the flowers draw at alpha 0.85 and composite away from their source
          // colour, which defeated three probes before one worked. Tinting the
          // tuft stroke makes the count unambiguous and large.
          ctx.strokeStyle =
            probe === 'grass' ? PROBE_TINT : withAlpha(colors.vergeLight, 0.85)
          ctx.lineWidth = Math.max(0.6, 0.05 * base.scale)
          ctx.beginPath()
          ctx.moveTo(base.x, base.y)
          ctx.lineTo(tip.x + 0.12 * base.scale, tip.y)
          ctx.stroke()

          // One tuft in five carries a flower, warm against the grass.
          if (seed % 5 === 0) {
            const petal = Math.max(0.7, 0.075 * base.scale)
            ctx.fillStyle =
              seed % 10 === 0
                ? 'rgba(244, 208, 122, 0.9)'
                : 'rgba(226, 170, 196, 0.85)'
            ctx.beginPath()
            ctx.arc(tip.x + 0.12 * base.scale, tip.y, petal, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        for (let k = 0; k < 4; k += 1) {
          // Spread across the face, biased away from both edges.
          const t = 0.12 + (((n * 7 + k * 23) % 76) / 76) * 0.76
          // The bank between mainline and ramp — the one face there is.
          tuft(top + (foot - top) * t, drop * t, n + k * 5)
        }
      }
    }

    /** Every contiguous run of segments where `test` holds, as one rail. */
    /**
     * A point part-way between two segment ends.
     *
     * Every field is a linear blend, which is not an approximation here: the
     * ribbon and rail polygons already draw **straight lines** between adjacent
     * points, so a blended point lies exactly on the edge that is being drawn.
     */
    function between(a, b, t) {
      return {
        s: a.s + (b.s - a.s) * t,
        cx: a.cx + (b.cx - a.cx) * t,
        y: a.y + (b.y - a.y) * t,
        yRamp: a.yRamp + (b.yRamp - a.yRamp) * t,
        scale: a.scale + (b.scale - a.scale) * t,
        ramp: a.ramp + (b.ramp - a.ramp) * t,
        drop: a.drop + (b.drop - a.drop) * t,
      }
    }

    /** Where `test` flips between two segment ends, to within a metre. */
    function flipBetween(a, b, test) {
      let lo = 0
      let hi = 1
      const want = test(b.s)
      for (let i = 0; i < 12; i += 1) {
        const mid = (lo + hi) / 2
        if (test(a.s + (b.s - a.s) * mid) === want) hi = mid
        else lo = mid
      }
      return between(a, b, hi)
    }

    /** One rail from an explicit list of points, so the ends can be anywhere. */
    function railFrom(pts, lateral, low, high, fill, follow) {
      if (pts.length < 2) return
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i]
        const base = follow ? p.yRamp : p.y
        const x = p.cx + (lateral + (follow ? p.ramp : 0)) * p.scale
        if (i === 0) ctx.moveTo(x, base - high * p.scale)
        else ctx.lineTo(x, base - high * p.scale)
      }
      for (let i = pts.length - 1; i >= 0; i -= 1) {
        const p = pts[i]
        const base = follow ? p.yRamp : p.y
        ctx.lineTo(
          p.cx + (lateral + (follow ? p.ramp : 0)) * p.scale,
          base - low * p.scale
        )
      }
      ctx.closePath()
      ctx.fill()
    }

    /**
     * Rail runs **cut at the intersection**, not at the nearest segment.
     *
     * This used to hand `rail()` a pair of integer segment indices, so a hole in
     * the barrier could only begin and end where a segment happened to end. With
     * log-spaced segments the far ones are long, so the gore opening was
     * quantised: the owner, exactly — _"you're merely changing the polygon's
     * colour instead of taking a chunk of the polygon out of the point of
     * intersection"_. Omitting whole segments is a colour decision dressed as
     * geometry; the barrier has to actually end where the ramp crosses it.
     *
     * Each run now carries interpolated end points found by bisecting `test`
     * between the two segments that straddle the crossing.
     */
    function railRuns(lateral, low, high, fill, test, follow = false) {
      let run = null
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const p = points[i]
        const on = test(p.s)
        if (on) {
          // opening edge: start exactly where the test flipped
          if (!run) {
            run = []
            if (i > 0) run.push(flipBetween(points[i - 1], p, test))
          }
          run.push(p)
        } else if (run) {
          // closing edge: stop exactly where it flipped back
          run.push(flipBetween(points[i - 1], p, test))
          railFrom(run, lateral, low, high, fill, follow)
          run = null
        }
      }
      if (run) railFrom(run, lateral, low, high, fill, follow)
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
      const lastLamp = Math.floor((sim.travel + 720) / LAMP_SPACING)
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
      const lastMarker = Math.floor((sim.travel + 600) / MARKER_SPACING)
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
      const lastPost = Math.floor((sim.travel + 520) / DELINEATOR_SPACING)
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

      // Flat mainline surfaces cull to the eye plane inside `ribbon()` itself.
      // There used to be a full-canvas `rect(0, horizon, …)` clip here — a
      // screen-space horizontal cut that did not track highway elevation. The
      // ramp peel-off sat on that line until it dropped, so the exit was
      // invisible until the grade changed, and distant ramp tarmac painted
      // over the ground as if it had a higher z-index. Standing work
      // (highway body, barriers, lamps) was never inside that clip.

      const tarmac = ctx.createLinearGradient(0, horizon, 0, height)
      tarmac.addColorStop(0, colors.tarmacFar)
      tarmac.addColorStop(1, colors.tarmacNear)

      /**
       * The three surfaces that sit at **different heights**, painted
       * back-to-front one depth slice at a time.
       *
       * Everything else here is coplanar — markings lie on the carriageway they
       * belong to — so a single full-length polygon per surface is both correct
       * and cheaper. These three are not: the mainline's ground is at grade, the
       * ramp and the ground under it are up to 5.5m below it, and they were each
       * painted as one polygon spanning the whole 980m of `Z_FAR` in a fixed
       * object order. Object order is not depth order, so the next exit's cut —
       * 224m away and well below your eyeline — was painted *after* all the
       * grade-level ground in front of it and could never be occluded by it. It
       * read as the landscape being transparent. It was not; it was solid, and
       * simply in front of things it should have been behind.
       *
       * Painting slice-by-slice from far to near lets the near ground bury the
       * distant cut the way the ground itself would. No distance gate (terrain
       * would visibly pop as you approach) and no narrowing of the ramp's own
       * ground (that re-opens the void beside the ramp this band was added to
       * fix). Occlusion falls out of the geometry instead.
       *
       * **Cost:** three fills per segment rather than three per frame. That is
       * the reason only these three moved — guardrail 2 — and the frame budget
       * is measured, not assumed.
       *
       * **Seams:** each slice shares an edge with its neighbour and carries the
       * same fill, so the anti-aliased join blends into an identical colour.
       * This is why the alternating surfaces (`stripes`, `ribbonRuns`) are NOT
       * in here: there the neighbour is a different colour and the seam shows,
       * which is the whole reason those helpers accumulate runs.
       */
      const graded = [
        // The ground beneath everything the road is made of, at mainline grade.
        {
          from: -(OPPOSING_EDGE + 22),
          to: CARRIAGEWAY + RAMP_OFFSET + 22,
          fill: colors.vergeDark,
          follow: false,
        },
        // The ground at the ramp's own grade, following it down.
        //
        // **This is deliberately wide, and a narrower shelf was a mistake.**
        // Cycle 107 cut it back and added a wall climbing from the shelf to the
        // grade beyond, on the theory that land holding grade beside the ramp
        // would make the descent legible. It did — and it also put the exit in a
        // trench, with a wall on the *right* of the ramp. The owner, immediately:
        // "why the hell am I seeing walls to the right of the highway and exit?
        // you're only supposed to have that for the highway."
        //
        // They are right, and the model is the correction: the highway sits on
        // an embankment and the ramp descends to *natural ground level* beside
        // it. There is one face in this scene — the highway's own — and it is on
        // your left as you come down. To the right the ground simply is the
        // ground. So it follows the ramp down, as wide as the view needs.
        {
          from: -(CARRIAGEWAY + 26),
          to: CARRIAGEWAY + 26,
          fill: colors.vergeDark,
          follow: true,
        },
        // The ramp itself.
        {
          from: LANE_OFFSET - RAMP_WIDTH / 2,
          to: LANE_OFFSET + RAMP_WIDTH / 2,
          fill: tarmac,
          follow: true,
        },
      ]
      for (let i = SEGMENTS - 1; i >= 0; i -= 1) {
        for (const layer of graded) {
          ribbon(i, i + 1, layer.from, layer.to, layer.fill, layer.follow)
        }
        // Highway body at this depth, after the roads it sits between, so a
        // nearer body face buries a farther ramp cut instead of the ramp
        // painting over the horizon ground.
        highwayBodySlice(i, i + 1, colors.vergeDark, sim.drop ?? 0)
      }

      // Rumble bands on the two outer verges, alternating with distance. The
      // right-hand one follows the ramp, because the right-hand verge is the
      // shoulder of whichever road you are actually on.
      stripes(-(OPPOSING_EDGE + 2.4), -OPPOSING_EDGE, 9, colors.vergeLight)
      stripes(CARRIAGEWAY, CARRIAGEWAY + 2.4, 9, colors.vergeLight, true)

      // The carriageway coming the other way. Empty, and it stays empty — the
      // owner asked for the invented traffic to come off this road, so what
      // makes it a highway is the barrier and the second carriageway, not
      // vehicles on it.
      band(-OPPOSING_EDGE, -MEDIAN_WIDTH, tarmac)
      // Yours. The median strip between the two is left as verge.
      band(0, CARRIAGEWAY, tarmac)
      // The ramp is painted with the depth-sorted slices above, not here — it
      // is one of the three surfaces that lives at a different height.

      // Gore markings. Every real interchange paints this wedge, and it is the
      // most recognisable marking an exit has — without it the road simply
      // forks. Inside the flat-surface pass with the other coplanar paints.
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
      // The highway body was already painted depth-sorted with the graded
      // slices above — deck shoulder to ramp inner edge, chunked at the
      // intersection — so a nearer face buries a farther ramp cut.

      // **Roadside furniture before the barrier:** lamps on the far carriageway
      // sit behind the highway from an exit ramp; painted after the barrier they
      // read as see-through road.
      drawRoadside(sim, colors)

      // Barrier on top of the deck only. Chunked out at the same intersection
      // the body uses, so the car's path through the gore is a hole in both.
      const shoulder = BANK_TOP
      const SIDE_TOP = HIGHWAY_SIDE_TOP
      const railClearOfRamp = (s) => {
        const centre = LANE_OFFSET + rampAt(s)
        const inner = centre - RAMP_WIDTH / 2 - 0.7
        const outer = centre + RAMP_WIDTH / 2 + 0.7
        return shoulder < inner || shoulder > outer
      }
      railRuns(
        shoulder,
        0,
        SIDE_TOP,
        probe === 'barrier' ? PROBE_TINT : colors.vergeLight,
        railClearOfRamp
      )
      // Deck slab thickness under the barrier — reads as pavement edge, not soffit.
      railRuns(
        shoulder,
        -0.38,
        0,
        withAlpha(colors.tarmacNear, 0.98),
        railClearOfRamp
      )
      railRuns(
        shoulder,
        SIDE_TOP - 0.12,
        SIDE_TOP,
        colors.paint,
        railClearOfRamp
      )

      vegetation(sim, colors)

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
