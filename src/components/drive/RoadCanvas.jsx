import { useEffect, useRef } from 'react'
import { paletteAt, withAlpha } from './daylight'
import { roadsideAt, routeLength } from './route'
import {
  CAM_HEIGHT,
  ROAD_HALF,
  Z_FAR,
  Z_NEAR,
  curveAt,
  hillAt,
  makeCamera,
} from './world'

const SEGMENTS = 130
const DASH_PERIOD = 14 // metres of "on" then "off" for the centre line
const DELINEATOR_SPACING = 24
const LAMP_SPACING = 72

// Mile markers sit at half a leg, far sparser than the 24m delineator line so
// they read as progress rather than clutter.
const MARKER_SPACING = 110

// Traffic on the far carriageway. Their own speed is added to yours, so they
// keep passing even while you are parked at an exit.
const ONCOMING_SPEED = 31 // m/s
const ONCOMING_SPAWN = 300 // metres ahead
const ONCOMING_GAPS = [40, 165, 275] // deterministic start positions

export function RoadCanvas({ drive, className, reducedMotion = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let camera = makeCamera(canvas.clientWidth || 1, canvas.clientHeight || 1)

    const points = []

    // Pre-allocated and mutated in place — the paint loop must not build these
    // every frame. `z` is metres ahead of the camera, counting down.
    const oncoming = ONCOMING_GAPS.map((z) => ({ z }))
    let lastFrameAt = 0

    function buildPoints(sim) {
      const { width, focal, horizon } = camera
      const baseCurve = curveAt(sim.travel)
      const baseHill = hillAt(sim.travel)

      for (let i = 0; i <= SEGMENTS; i += 1) {
        // Log spacing in depth gives roughly even spacing on screen.
        const z = Z_NEAR * Math.pow(Z_FAR / Z_NEAR, i / SEGMENTS)
        const s = sim.travel + z
        const scale = focal / z
        const point = points[i] || (points[i] = {})
        point.z = z
        point.s = s
        point.scale = scale
        point.cx = width / 2 + (curveAt(s) - baseCurve - sim.x) * scale
        point.y = horizon + (CAM_HEIGHT + baseHill - hillAt(s)) * scale
      }
    }

    /** Fill one continuous ribbon of road between two lateral offsets. */
    function ribbon(first, last, from, to, fill) {
      if (last <= first) return
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = first; i <= last; i += 1) {
        const point = points[i]
        const x = point.cx + from * point.scale
        if (i === first) ctx.moveTo(x, point.y)
        else ctx.lineTo(x, point.y)
      }
      for (let i = last; i >= first; i -= 1) {
        const point = points[i]
        ctx.lineTo(point.cx + to * point.scale, point.y)
      }
      ctx.closePath()
      ctx.fill()
    }

    function band(from, to, fill) {
      ribbon(0, SEGMENTS, from, to, fill)
    }

    /**
     * Paint every "on" stretch of a repeating pattern as a single ribbon.
     * Filling each segment separately would leave anti-aliasing seams.
     */
    function stripes(from, to, period, fill) {
      let runStart = -1
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = Math.floor(points[i].s / period) % 2 === 0
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          ribbon(runStart, i, from, to, fill)
          runStart = -1
        }
      }
    }

    /**
     * A rail standing above the verge, filled as one continuous shape between
     * two heights. Same reason `stripes` exists: filling each segment on its
     * own leaves anti-aliasing seams down the length of it.
     */
    function rail(first, last, lateral, low, high, fill) {
      if (last <= first) return
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = first; i <= last; i += 1) {
        const point = points[i]
        const x = point.cx + lateral * point.scale
        const y = point.y - high * point.scale
        if (i === first) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let i = last; i >= first; i -= 1) {
        const point = points[i]
        ctx.lineTo(
          point.cx + lateral * point.scale,
          point.y - low * point.scale
        )
      }
      ctx.closePath()
      ctx.fill()
    }

    /** Every contiguous run of segments where `test` holds, as one rail. */
    function railRuns(lateral, low, high, fill, test) {
      let runStart = -1
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const on = test(points[i].s)
        if (on && runStart < 0) runStart = i
        if (runStart >= 0 && (!on || i === SEGMENTS)) {
          rail(runStart, i, lateral, low, high, fill)
          runStart = -1
        }
      }
    }

    const hasGuardrail = (s) => roadsideAt(s).guardrail

    function drawRoadside(sim, colors) {
      const { focal, horizon, width, height } = camera
      const baseCurve = curveAt(sim.travel)
      const baseHill = hillAt(sim.travel)

      const place = (s, x, y) => {
        const z = s - sim.travel
        const scale = focal / z
        return {
          x: width / 2 + (curveAt(s) - baseCurve + x - sim.x) * scale,
          y: horizon + (CAM_HEIGHT + baseHill - hillAt(s) - y) * scale,
          scale,
        }
      }

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
        const foot = place(s, side * (ROAD_HALF + 2.6), 0)
        const head = place(s, side * (ROAD_HALF + 2.6), 8.6)
        const arm = place(s, side * (ROAD_HALF - 0.4), 8.2)
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
        const foot = place(s, ROAD_HALF + 2.5, 0)
        const plate = place(s, ROAD_HALF + 2.5, 1.9)
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
          const foot = place(s, side * (ROAD_HALF + 1.1), 0)
          const top = place(s, side * (ROAD_HALF + 1.1), 1.05)
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

      drawOncoming(sim, colors, place)
    }

    /**
     * Headlights on the far carriageway. Twenty-one exits of an empty highway
     * reads as a treadmill; a car passing the other way every few seconds is
     * the cheapest thing that makes a road feel like a road.
     *
     * They close at their own speed plus yours, so they keep coming while you
     * sit at an exit. Positions are mutated in place and the frame delta is
     * clamped, so a resize or a backgrounded tab cannot teleport them.
     */
    function drawOncoming(sim, colors, place) {
      // The rest of drive mode already honours the motion preference: the
      // throttle jumps between exits instead of animating, the carousel does
      // not autoplay, the arrival panel fades rather than projecting. Traffic
      // moves on a wall clock independent of travel, so it would keep sliding
      // toward a stationary viewer — the one thing that preference is asking
      // us not to do. Absent traffic simply restores the empty road.
      if (reducedMotion) return

      const { horizon, height } = camera

      const now = performance.now()
      const dt = lastFrameAt ? Math.min((now - lastFrameAt) / 1000, 0.05) : 0
      lastFrameAt = now

      for (const car of oncoming) {
        car.z -= (ONCOMING_SPEED + sim.speed) * dt
        if (car.z <= Z_NEAR) car.z += ONCOMING_SPAWN

        const s = sim.travel + car.z
        const centre = place(s, -(ROAD_HALF * 0.52), 0.75)
        if (centre.y < horizon - 4 || centre.y > height * 1.3) continue

        // Fade in at the far end so they arrive rather than blink into being.
        const fade = Math.min(1, (ONCOMING_SPAWN - car.z) / 90)
        const spread = 0.9 * centre.scale
        const bulb = Math.max(1.5, 0.3 * centre.scale)

        const halo = ctx.createRadialGradient(
          centre.x,
          centre.y,
          0,
          centre.x,
          centre.y,
          Math.max(6, spread * 3)
        )
        halo.addColorStop(0, withAlpha(colors.lamp, 0.6 * fade))
        halo.addColorStop(1, withAlpha(colors.lamp, 0))
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(centre.x, centre.y, Math.max(6, spread * 3), 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = withAlpha(colors.paint, 0.92 * fade)
        for (const offset of [-spread, spread]) {
          ctx.beginPath()
          ctx.arc(centre.x + offset, centre.y, bulb, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    function draw(sim) {
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

      band(-(ROAD_HALF + 22), ROAD_HALF + 22, colors.vergeDark)

      // Rumble bands on the verge, alternating with distance travelled.
      stripes(-(ROAD_HALF + 2.4), -ROAD_HALF, 9, colors.vergeLight)
      stripes(ROAD_HALF, ROAD_HALF + 2.4, 9, colors.vergeLight)

      const tarmac = ctx.createLinearGradient(0, horizon, 0, height)
      tarmac.addColorStop(0, colors.tarmacFar)
      tarmac.addColorStop(1, colors.tarmacNear)
      band(-ROAD_HALF, ROAD_HALF, tarmac)

      const paint = withAlpha(colors.paint, 0.82)
      band(-ROAD_HALF + 0.25, -ROAD_HALF + 0.55, paint)
      band(ROAD_HALF - 0.55, ROAD_HALF - 0.25, paint)

      stripes(-0.16, 0.16, DASH_PERIOD, withAlpha(colors.centreLine, 0.85))

      // Guardrail along the scenic overlook — the one leg with a drop beside
      // it. Painted before the roadside furniture so lamps stand in front.
      railRuns(
        ROAD_HALF + 1.9,
        0.42,
        0.78,
        withAlpha(colors.paint, 0.5),
        hasGuardrail
      )
      railRuns(
        ROAD_HALF + 1.9,
        0.2,
        0.44,
        withAlpha(colors.vergeDark, 0.95),
        hasGuardrail
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
      draw(drive.simRef.current)
    }

    resize()
    window.addEventListener('resize', resize)
    const unsubscribe = drive.subscribe(draw)

    return () => {
      window.removeEventListener('resize', resize)
      unsubscribe()
    }
  }, [drive, reducedMotion])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
