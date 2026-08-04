import { useEffect, useRef } from 'react'
import { METERS_PER_MILE } from './route'
import { CAM_HEIGHT, ROAD_HALF, curveAt, hillAt, makeCamera } from './world'

// The sign is authored at 300x180 design px standing for 6m x 3.6m of
// roadside furniture, mounted with its centre 5.4m above the tarmac.
const DESIGN_WIDTH = 300
const SIGN_METERS = 6
const MOUNT_HEIGHT = 5.4
const ANCHOR_Y = 90
const OFFSET_X = ROAD_HALF + 4.6
const VISIBLE_FROM = 420
const VISIBLE_UNTIL = 7

export function ExitSign({ drive, stop }) {
  const wrapperRef = useRef(null)
  const distanceRef = useRef(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || !stop) return undefined

    const parent = wrapper.parentElement
    let camera = makeCamera(parent.clientWidth || 1, parent.clientHeight || 1)

    const resize = () => {
      camera = makeCamera(parent.clientWidth || 1, parent.clientHeight || 1)
    }

    const paint = (sim) => {
      const z = stop.s - sim.travel

      if (z > VISIBLE_FROM || z < VISIBLE_UNTIL) {
        wrapper.style.opacity = '0'
        wrapper.style.visibility = 'hidden'
        return
      }

      const scale = camera.focal / z
      const x =
        camera.width / 2 +
        (curveAt(stop.s) - curveAt(sim.travel) + OFFSET_X - sim.x) * scale
      const y =
        camera.horizon +
        (CAM_HEIGHT + hillAt(sim.travel) - hillAt(stop.s) - MOUNT_HEIGHT) *
          scale
      const size = (SIGN_METERS * scale) / DESIGN_WIDTH

      wrapper.style.visibility = 'visible'
      wrapper.style.opacity = String(Math.min(1, (VISIBLE_FROM - z) / 160))
      wrapper.style.transform = `translate(${x}px, ${y}px) scale(${size}) translate(-50%, -${ANCHOR_Y}px)`

      if (distanceRef.current) {
        const miles = z / METERS_PER_MILE
        distanceRef.current.textContent =
          miles >= 0.1 ? `${miles.toFixed(2)} MI` : `${Math.round(z)} M`
      }
    }

    window.addEventListener('resize', resize)
    const unsubscribe = drive.subscribe(paint)

    return () => {
      window.removeEventListener('resize', resize)
      unsubscribe()
    }
  }, [drive, stop])

  if (!stop) return null

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 origin-top-left"
      style={{ width: DESIGN_WIDTH, visibility: 'hidden' }}
    >
      <div className="rounded-md border-[6px] border-white/90 bg-[#12603c] px-4 py-3 text-white shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-baseline justify-between font-display text-[15px] font-semibold uppercase tracking-[0.18em] text-white/80">
          <span>{stop.exitLabel}</span>
          <span ref={distanceRef}>—</span>
        </div>
        <div className="mt-1 truncate font-display text-[30px] font-semibold leading-tight">
          {stop.signTitle}
        </div>
        <div className="truncate font-display text-[17px] leading-tight text-white/75">
          {stop.signSub}
        </div>
      </div>
      <div className="mx-auto h-[180px] w-[12px] bg-gradient-to-b from-[#6b7787] to-[#2b333f]" />
    </div>
  )
}
