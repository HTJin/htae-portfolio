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
  rideState,
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
      //
      // **Do not "simplify" this by dropping `sim.drop`.** The datum here is
      // already the one the owner describes: zero is the mainline grade, and the
      // ramp is a deviation measured from it (`rampDropAt` is 0 on the highway
      // and negative on the exit). "Initial elevation is at the highway" says
      // where zero is; "the eye stays above the road it is driving on" says
      // where the eye is, expressed in that same zero. They are one elevation
      // field sampled at two places, not two competing datums, and this line is
      // where a naive reading of the second sentence breaks the first.
      //
      // Both literal alternatives are regressions, and one of them has already
      // shipped. Take `sim.drop` off the eye and the camera floats
      // `CAM_HEIGHT + RAMP_DROP` = 6.85m above the ramp it is driving on; make
      // the mainline the only surface and the camera sits 4.15m underground on
      // the exit. `route.js` records the first one going out: "the whole
      // mainline lifted above the horizon", "the highway hung over the
      // windscreen".
      //
      // What was actually wrong is downstream of here: the render did not look
      // like the datum it already had. See `ribbon`.
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
     * **Surfaces above the eye are CLIPPED along the eye plane. Never CLAMPED to
     * it, and no longer dropped a whole segment at a time.**
     *
     * Clamping every vertex to `horizon` is what painted a flat asphalt bar on
     * the vanishing line, and nothing here does that: only the two vertices that
     * land exactly on the crossing sit at `horizon`, and they sit there because
     * that is genuinely where a horizontal surface at eye height ends. Every
     * other vertex keeps its real projected height.
     *
     * Skipping the above-eye vertices instead, which is what this did until now,
     * avoided the bar but had a quieter and worse failure. Where the surface
     * crossed the eye plane the straddling pair contributed exactly **one**
     * forward vertex and **one** backward vertex, so `closePath()` enclosed a
     * degenerate two-point path. Measured in a browser rather than assumed: a
     * two-vertex closed path fills **0** pixels, against a four-vertex control
     * that fills 300. That slice therefore painted nothing at all, and the
     * surface ended at the last segment boundary lying wholly below the eye.
     * The segments are log-spaced, about 5m long at z=140 and 18m at z=500, so
     * the end of the road was quantised to them and jumped a whole segment at a
     * time as the car moved. That jump is largest exactly where the grade is
     * changing, because that is when vertices cross the eye plane. Swept over
     * the route, 55.8% of mainline positions (201/360) have the surface
     * crossing the eye plane, so it was live in most frames.
     *
     * The straddling pair now contributes an interpolated vertex on the crossing
     * itself. The blend is of the two endpoints' **screen** x, not of `cx` and
     * `scale` blended separately: the polygon edge that actually gets drawn is
     * the straight line between those two screen points, so a screen-space blend
     * lies exactly on the drawn edge, where a world-space one would not. Same
     * fix and the same reasoning as f831a24 applied to the barrier runs via
     * `flipBetween`; this family never received it.
     *
     * Allocates nothing (guardrail 14): the crossing is carried in scalars and
     * written straight to the path, and the per-call `yOf` closure this used to
     * build is gone.
     */
    function ribbon(first, last, from, to, fill, follow = false) {
      if (last <= first) return
      const { horizon } = camera

      let visible = 0
      for (let i = first; i <= last; i += 1) {
        const p = points[i]
        if ((follow ? p.yRamp : p.y) >= horizon) visible += 1
      }
      if (visible === 0) return

      ctx.fillStyle = fill
      ctx.beginPath()

      // Out along the `from` edge, back along the `to` edge. Each walk emits an
      // extra vertex wherever consecutive points straddle the eye plane, so the
      // ribbon ends on the crossing instead of a whole segment short of it.
      let started = false
      let prevX = 0
      let prevY = 0
      let prevVisible = false

      for (let i = first; i <= last; i += 1) {
        const point = points[i]
        const y = follow ? point.yRamp : point.y
        const x = point.cx + (from + (follow ? point.ramp : 0)) * point.scale
        const isVisible = y >= horizon
        if (i > first && isVisible !== prevVisible) {
          // Exactly one side is above the eye, so `y - prevY` cannot be zero.
          const t = (horizon - prevY) / (y - prevY)
          const cut = prevX + (x - prevX) * t
          if (started) ctx.lineTo(cut, horizon)
          else {
            ctx.moveTo(cut, horizon)
            started = true
          }
        }
        if (isVisible) {
          if (started) ctx.lineTo(x, y)
          else {
            ctx.moveTo(x, y)
            started = true
          }
        }
        prevX = x
        prevY = y
        prevVisible = isVisible
      }
      if (!started) return

      for (let i = last; i >= first; i -= 1) {
        const point = points[i]
        const y = follow ? point.yRamp : point.y
        const x = point.cx + (to + (follow ? point.ramp : 0)) * point.scale
        const isVisible = y >= horizon
        if (i < last && isVisible !== prevVisible) {
          const t = (horizon - prevY) / (y - prevY)
          ctx.lineTo(prevX + (x - prevX) * t, horizon)
        }
        if (isVisible) ctx.lineTo(x, y)
        prevX = x
        prevY = y
        prevVisible = isVisible
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
     * The highway profile body when viewed from the exit ramp.
     *
     * One opaque face from the elevated deck shoulder down to the **ramp
     * grade**, along the ramp's inner edge. The foot follows `point.yRamp` —
     * the same curve as the white edge line of the road you are on — so the
     * body meets the entrance at the road, not at a flat screen-horizon cut.
     *
     * Never clamp the foot to `horizon`: that was the gray/violet halves split.
     *
     * **The caller owns the "am I below the deck?" test.** This used to open
     * with its own `if (camDrop >= -0.15) return`, a second hand-typed copy of
     * the `belowDeck` threshold sitting 400 lines from the first and free to
     * drift from it. The one call site is already inside `if (belowDeck)`, so
     * the guard could never do anything the caller had not already done, and
     * removing it deletes a duplicate constant without changing a pixel. The
     * threshold now exists once, in `route.js`, as `rideState`.
     */
    function highwayBody(fill, camDrop) {
      const shoulder = BANK_TOP
      const rampInnerOf = (point) => LANE_OFFSET + point.ramp - RAMP_WIDTH / 2
      const clearOfIntersection = (point) => {
        const centre = LANE_OFFSET + point.ramp
        const inner = centre - RAMP_WIDTH / 2 - 0.7
        const outer = centre + RAMP_WIDTH / 2 + 0.7
        return shoulder < inner || shoulder > outer
      }

      // Profile + interchange as one face: deck shoulder → ramp inner edge.
      // Chunked out where the ramp crosses the shoulder (point of entry).
      const spans = (point) =>
        clearOfIntersection(point) && rampInnerOf(point) - shoulder > 0.15

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
              const x = point.cx + shoulder * point.scale
              // Deck edge — real elevation, never flattened to the horizon.
              if (k === runStart) ctx.moveTo(x, point.y)
              else ctx.lineTo(x, point.y)
            }
            for (let k = i; k >= runStart; k -= 1) {
              const point = points[k]
              // Foot on the ramp road itself — aligned to the white stripe.
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

      // When the ramp has not yet peeled (open mainline ahead while you sit
      // below), still seal under the deck with a shoulder face down to the
      // camera grade so nothing shows through beside the wedge.
      //
      // **This pass is standing geometry and is deliberately NOT clipped to the
      // eye plane**, for the same reason `rail` and `railFrom` are not. Both of
      // its edges sit at the same lateral offset (`shoulder`), so it is a
      // vertical curtain, not a horizontal surface, and a vertical face ahead of
      // you is legitimately visible above your eye. From the bottom of a 5.5m
      // exit the mainline shoulder *is* above eye level for most of the view,
      // which is exactly when this curtain is doing its job. Clipping it at
      // `horizon` would cut away the part above the eye and let sky show through
      // the embankment. The eye-plane clip in `ribbon` applies to flat surfaces
      // only; do not "finish the job" by extending it here.
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const point = points[i]
        const x = point.cx + shoulder * point.scale
        if (i === 0) ctx.moveTo(x, point.y)
        else ctx.lineTo(x, point.y)
      }
      for (let i = SEGMENTS; i >= 0; i -= 1) {
        const point = points[i]
        // Camera grade at this depth: mainline y shifted by the camera's drop.
        const footY = point.y - camDrop * point.scale
        ctx.lineTo(point.cx + shoulder * point.scale, footY)
      }
      ctx.closePath()
      ctx.fill()
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
      const camDrop = sim.drop ?? 0
      // One place asks "highway or ramp?", and it is `route.js`. `belowDeck`
      // ("is there a height difference to the deck?") and `onMainline` ("am I on
      // the mainline, laterally as well as vertically?") are different questions
      // and stay separate, but they now come off one grade threshold instead of
      // the three that used to be typed out across this file. `deckFall01` is
      // the continuous form of the same fall, 0 on the deck to 1 where
      // `belowDeck` turns true.
      const { deckFall01, belowDeck, onMainline } = rideState(sim)

      // Ground under the road. Neutral charcoal — night `vergeDark` / `groundNear`
      // are blue-violet and read as a tinted lower half of the windshield.
      const GROUND = '#0c0e12'
      // The plate starts 6px *above* the horizon on the mainline, where the
      // overlap is buried under tarmac and haze and closes the seam against
      // the sky div. Below deck there is no tarmac up there to bury it, so
      // those 6px are bare ground painted above the eye plane — which no
      // elevation can produce, since the true horizon is at eye level at every
      // grade. Measured mid-descent (drop -4.17) the topmost opaque pixel from
      // 52% of the width rightward was a dead-flat row 775 device px, and
      // `(horizon - 6) * dpr` predicts 775.6. That is the cut the owner sees.
      // Starting at `horizon` when below deck does not remove the cut — the
      // ground legitimately begins at the eye plane out there — but it stops
      // the scene claiming ground where only sky can be.
      //
      // Those 6px used to be a `belowDeck ? horizon : horizon - 6` step, so a
      // full-width opaque edge jumped 12 device px in a single frame at the
      // exact instant the elevation started changing. Both ends of that
      // expression are kept exactly, and over exactly the same 0.15m of descent;
      // only the jump between them is gone.
      const groundTop = horizon - 6 * (1 - deckFall01)
      ctx.fillStyle = GROUND
      ctx.fillRect(0, groundTop, width, height - groundTop)

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
        // Mainline-grade verge — only while you are on the mainline. From an
        // exit it sits near the vanishing line and paints the dark gray
        // horizontal bar across the horizon.
        ...(!belowDeck
          ? [
              {
                from: -(OPPOSING_EDGE + 22),
                to: CARRIAGEWAY + RAMP_OFFSET + 22,
                fill: GROUND,
                follow: false,
              },
            ]
          : []),
        // The ground at the ramp's own grade, following it down.
        {
          from: -(CARRIAGEWAY + 26),
          to: CARRIAGEWAY + 26,
          fill: GROUND,
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
      const FAR_EXIT_Z = 140

      // Opaque highway profile — charcoal, not night vergeDark (blue).
      if (belowDeck) {
        highwayBody(GROUND, camDrop)
      }

      for (let i = SEGMENTS - 1; i >= 0; i -= 1) {
        const point = points[i]
        const farExitCut =
          point.z > FAR_EXIT_Z && Math.abs(point.drop - camDrop) > 0.8

        for (const layer of graded) {
          // Defer the live ramp tarmac until after the body when below.
          if (belowDeck && layer.follow && layer.fill === tarmac) continue
          if (farExitCut && layer.follow && layer.fill === tarmac) continue
          ribbon(i, i + 1, layer.from, layer.to, layer.fill, layer.follow)
        }
      }

      // (There is no second `highwayBody` pass here. It read as a companion to
      // the one above, but both call sites are gated on `belowDeck` — so the
      // call could never draw anything the first had not. The genuinely opaque
      // second pass that *did* draw, after `drawRoadside`, is what covered the
      // mainline from the ramp and was removed in d0931ae; keeping a dead
      // lookalike here invited someone to "restore" it.)

      // Rumble bands. Off the exit entirely — the right-hand strip following
      // the ramp read as another elongated rail to the horizon.
      if (!belowDeck) {
        stripes(-(OPPOSING_EDGE + 2.4), -OPPOSING_EDGE, 9, colors.vergeLight)
        stripes(CARRIAGEWAY, CARRIAGEWAY + 2.4, 9, colors.vergeLight, true)
      }

      // Mainline tarmac. When the camera is below the deck, the elevated body
      // already represents the highway — painting full-length tarmac here is
      // what left the asphalt bar on the horizon (clamped deck edge).
      if (!belowDeck) {
        band(-OPPOSING_EDGE, -MEDIAN_WIDTH, tarmac)
        band(0, CARRIAGEWAY, tarmac)
      }

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

      // Mainline markings stay with the mainline tarmac — hidden when below.
      if (!belowDeck) {
        band(0.25, 0.55, medianLine)
        band(CARRIAGEWAY - 0.55, CARRIAGEWAY - 0.25, paint)
        band(-MEDIAN_WIDTH - 0.55, -MEDIAN_WIDTH - 0.25, medianLine)
        band(-OPPOSING_EDGE + 0.25, -OPPOSING_EDGE + 0.55, paint)

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
      }

      // The ramp you are on — painted last so it is the topmost plane and its
      // white edge lines meet the highway body at the entrance instead of
      // sitting under a separate gray/violet half.
      if (belowDeck) {
        for (let i = SEGMENTS - 1; i >= 0; i -= 1) {
          const point = points[i]
          if (point.z > FAR_EXIT_Z && Math.abs(point.drop - camDrop) > 0.8) {
            continue
          }
          ribbon(
            i,
            i + 1,
            LANE_OFFSET - RAMP_WIDTH / 2,
            LANE_OFFSET + RAMP_WIDTH / 2,
            tarmac,
            true
          )
        }
      }

      const separated = (point) =>
        point.ramp > RAMP_SEPARATES &&
        !(point.z > FAR_EXIT_Z && Math.abs(point.drop - camDrop) > 0.8)
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

      // End of the flat surfaces. Standing geometry follows.

      // **Roadside furniture before the barrier:** lamps on the far carriageway
      // sit behind the highway from an exit ramp; painted after the barrier they
      // read as see-through road.
      // Baseline elevation is the main highway (drop = 0). The exit only lowers
      // from that. `belowDeck` alone is not enough for furniture: drop is held
      // until the ramp clears the verge, so the first half of every exit still
      // has drop ≈ 0 while you are already off the mainline — and the shoulder
      // rail kept drawing as an endless line on the right. That is why
      // `onMainline` carries a lateral term as well as a grade one, and why it
      // is not simply `!belowDeck`.
      const shoulder = BANK_TOP
      const railClearOfRamp = (s) => {
        const centre = LANE_OFFSET + rampAt(s)
        const inner = centre - RAMP_WIDTH / 2 - 0.7
        const outer = centre + RAMP_WIDTH / 2 + 0.7
        return shoulder < inner || shoulder > outer
      }

      drawRoadside(sim, colors)

      // A second `highwayBody(GROUND, camDrop)` pass used to run here, after the
      // furniture, to stop far-carriageway lamps showing through the body. It is
      // gone. `highwayBody` is only called while `belowDeck`, which is exactly
      // when you are down on the ramp, so repainting it opaque here covered the
      // view of the mainline at the one elevation you most need to see it from.
      // The owner: "I no longer see the main highway while lowered elevation"
      // and "why teh hell did you replace the plane polygon area with just solid
      // black???? it was good as it was before".
      //
      // The lamp z-order it was meant to fix is real but is not worth this: fix
      // it by ordering the lamps against the body, not by painting a black face
      // over the scene.

      // Shoulder barrier: it belongs to the **main highway**, so it follows the
      // main highway. It does not switch off because you happen to be driving
      // somewhere else.
      //
      // It used to be gated on `onMainline`, which suppressed all three runs
      // for the whole exit. That removed the mainline's own rail the moment you
      // took the ramp, when the mainline is precisely what you are looking
      // across at. The owner: "the guardrail seems to disappear from the right
      // side of the main highway when exit ramp is accessed. it should only
      // disappear from the right side of the exit ramp."
      //
      // `railClearOfRamp` already does that, per segment: it opens the rail only
      // where the ramp actually crosses the shoulder, and closes it again after.
      // That is the correct instrument, and it was already being passed in.
      {
        const SIDE_TOP = HIGHWAY_SIDE_TOP
        railRuns(
          shoulder,
          0,
          SIDE_TOP,
          probe === 'barrier' ? PROBE_TINT : colors.vergeLight,
          railClearOfRamp
        )
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

        // The scenic-overlook guardrail used to stand here, at `CARRIAGEWAY +
        // 1.9`. Removed: the owner, seeing it from the exit, asked "why is
        // there an elongated guardrail that shouldn't exist on the right side
        // of the exit ramp??"
        //
        // Two things made it wrong rather than merely extra. It sat 0.8m from
        // the shoulder barrier at `shoulder + SIDE_OUT`, which was added later
        // and runs the **whole** route, so it duplicated a rail that already
        // exists. And it was the **only** rail in the scene tested with
        // something other than `railClearOfRamp` - it took `hasGuardrail` - so
        // it never opened at the gore and ran straight across the ramp's path
        // on every scenic-overlook leg, which is the elongated rail the owner
        // could see from a road it had no business crossing.
        //
        // To bring it back, it needs both: `railClearOfRamp` in its test, and a
        // lateral that does not shadow the shoulder barrier.
      }

      vegetation(sim, colors)

      // The median barrier. This is what makes it a divided highway rather than
      // a road you may legally overtake into oncoming traffic on: the traffic
      // coming the other way is behind concrete, not behind a dashed line.
      if (onMainline) {
        const barrierX = -MEDIAN_WIDTH / 2
        rail(0, SEGMENTS, barrierX, 0, 0.92, withAlpha(colors.vergeLight, 0.95))
        rail(0, SEGMENTS, barrierX, 0.74, 0.92, withAlpha(colors.paint, 0.45))
      }

      // Haze so the tarmac dissolves into the sky instead of ending abruptly.
      //
      // The gradient used to open at full `hazeAlpha` on its very first row, and
      // the rect started on that same row — so the haze itself had a hard,
      // dead-flat alpha step across the full width of the canvas, from nothing
      // to as much as 0.95 (the palettes run 0.75/0.85/0.92/0.95/0.85) in one
      // pixel, at a fixed screen y that no elevation moves. A full-width step
      // like that reads as a drawn line whether or not there is any geometry
      // there, and measured on the running page it is the strongest full-width
      // edge in the frame: luminance jump 75.76 across every column at device
      // row 833, against 22.44 at row 824 for the ground plate. `(horizon - 2) *
      // dpr` is 832.9 on the owner's 951px canvas, which is where it lands.
      // Ramping the alpha in over the first few pixels costs one extra colour
      // stop and takes that edge to 9.43, without moving the rect or painting
      // anything outside it.
      const HAZE_RAMP = 8
      const hazeTop = horizon - 2
      const hazeDepth = height * 0.14 + 2
      const haze = ctx.createLinearGradient(0, hazeTop, 0, hazeTop + hazeDepth)
      haze.addColorStop(0, withAlpha(colors.haze, 0))
      haze.addColorStop(
        Math.min(HAZE_RAMP / hazeDepth, 0.5),
        withAlpha(colors.haze, colors.hazeAlpha)
      )
      haze.addColorStop(1, withAlpha(colors.haze, 0))
      ctx.fillStyle = haze
      ctx.fillRect(0, hazeTop, width, hazeDepth)
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
