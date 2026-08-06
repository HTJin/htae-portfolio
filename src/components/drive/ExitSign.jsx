import { useEffect, useRef } from 'react'
import { paletteAt, withAlpha } from './daylight'
import { METERS_PER_MILE, routeLength } from './route'
import { CAM_HEIGHT, ROAD_HALF, curveAt, hillAt, makeCamera } from './world'
import styles from '@/styles/drive.module.css'

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
  const faceRef = useRef(null)
  const plaqueRef = useRef(null)
  const sheenRef = useRef(null)

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

      // Retroreflective sheeting: the face is dull at distance and flares as
      // the headlights reach it. That flare is most of why an approach reads
      // as an approach rather than a sprite getting bigger.
      const near = 1 - Math.min(1, z / VISIBLE_FROM)
      const glare = near * near
      const colors = paletteAt(routeLength > 0 ? sim.travel / routeLength : 0)

      if (faceRef.current) {
        faceRef.current.style.backgroundColor = colors.signFace
        faceRef.current.style.filter = `brightness(${(
          0.72 +
          0.85 * glare
        ).toFixed(3)})`
      }
      if (plaqueRef.current) {
        plaqueRef.current.style.backgroundColor = colors.signFace
        plaqueRef.current.style.filter = `brightness(${(
          0.72 +
          0.85 * glare
        ).toFixed(3)})`
      }
      if (sheenRef.current) {
        sheenRef.current.style.opacity = (glare * 0.5).toFixed(3)
      }

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

  const [exitWord, exitNumber] = stop.exitLabel.split(' ')
  const start = paletteAt(0)

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 origin-top-left"
      style={{ width: DESIGN_WIDTH, visibility: 'hidden' }}
    >
      <div className="relative">
        {/* Exit-number plaque, bolted above the right corner like the real
            thing — the first part of a guide sign you can actually read. */}
        <div
          ref={plaqueRef}
          className="absolute -top-[30px] right-0 rounded-t-md border-[5px] border-b-0 border-white/90 px-3 pb-0.5 pt-1 text-center font-display leading-none text-white"
          style={{ backgroundColor: start.signFace }}
        >
          <span className="text-white/85 block text-[11px] font-semibold uppercase tracking-[0.2em]">
            {exitWord}
          </span>
          <span className="block text-[19px] font-bold tracking-tight">
            {exitNumber}
          </span>
        </div>

        <div
          ref={faceRef}
          className="relative overflow-hidden rounded-md border-[6px] border-white/90 px-4 py-3 text-white shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          style={{ backgroundColor: start.signFace }}
        >
          <div className="flex items-baseline justify-between font-display text-[15px] font-semibold uppercase tracking-[0.18em] text-white/80">
            <span>{stop.leg}</span>
            <span ref={distanceRef}>—</span>
          </div>
          <div className="mt-1 truncate font-display text-[30px] font-semibold leading-tight">
            {stop.signTitle}
          </div>
          <div className="truncate font-display text-[17px] leading-tight text-white/75">
            {stop.signSub}
          </div>

          {/* The headlight sweep across the sheeting. */}
          <span
            ref={sheenRef}
            className={styles.signSheen}
            style={{ opacity: 0 }}
          />
        </div>
      </div>

      {/* Twin supports — a guide sign this size never stands on one post. */}
      <div className="relative mx-auto h-[180px] w-[150px]">
        <div className="absolute left-[26px] top-0 h-full w-[11px] bg-gradient-to-b from-[#6b7787] to-[#2b333f]" />
        <div className="absolute right-[26px] top-0 h-full w-[11px] bg-gradient-to-b from-[#6b7787] to-[#2b333f]" />
      </div>
    </div>
  )
}
