import { useEffect, useRef } from 'react'
import { paletteAt } from './daylight'
import {
  LEG_LENGTH,
  METERS_PER_MILE,
  RAMP_OFFSET,
  RAMP_WIDTH,
  rampDropAt,
  routeLength,
} from './route'
import { LANE_OFFSET, makeCamera, project } from './world'
import styles from '@/styles/drive.module.css'

// The sign is authored at 300x180 design px standing for 6m x 3.6m of
// roadside furniture, mounted with its centre 5.4m above the tarmac.
const DESIGN_WIDTH = 300
const SIGN_METERS = 6
const MOUNT_HEIGHT = 5.4
const ANCHOR_Y = 90
/**
 * The sign stands on the far verge of the ramp it names.
 *
 * It is anchored at the stop's own `s`, which is the end of the off-ramp, so
 * the ramp has carried the road to `RAMP_OFFSET` by the time you reach it -
 * leaving this at `CARRIAGEWAY + 4.6` would have planted the sign in the middle
 * of the ramp's tarmac. Derived from the ramp's own geometry so it stays put if
 * either changes.
 */
const OFFSET_X = LANE_OFFSET + RAMP_OFFSET + RAMP_WIDTH / 2 + 2

/**
 * The sign's whole approach is scaled to the leg you actually drive.
 *
 * This was a literal 420m, against a `LEG_LENGTH` of 220 - a window nearly
 * twice the furthest you can ever be from the sign. Two things fell out of
 * that, both measured: the fade-in was dead code, because `min(1, (420 - z) /
 * 160)` is already **1.0** at z = 220 and would only have finished at z = 260;
 * and the retroreflective flare began at **0.227** rather than 0, so a quarter
 * of the sweep that makes an approach read as an approach was spent before the
 * car had moved. Deriving both from `LEG_LENGTH` means neither can drift again
 * if the route spacing changes.
 */
const VISIBLE_FROM = LEG_LENGTH
const FADE_OVER = LEG_LENGTH * 0.35
const VISIBLE_UNTIL = 7
const FEET_PER_MILE = 5280

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

      // Same projection the canvas uses, so the sign always stands exactly
      // where the roadside furniture around it does.
      // The sign stands on the ramp's verge, so it stands at the ramp's
      // *grade* too - anchored at the stop, which is the bottom of the exit.
      // Without the drop it would float at the height the highway used to be.
      const { x, y, scale } = project(
        camera,
        sim,
        z,
        OFFSET_X,
        MOUNT_HEIGHT + rampDropAt(stop.s)
      )
      const size = (SIGN_METERS * scale) / DESIGN_WIDTH

      wrapper.style.visibility = 'visible'
      wrapper.style.opacity = String(
        Math.min(1, (VISIBLE_FROM - z) / FADE_OVER)
      )
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
        // Feet, all the way down. This used to read miles above 0.1 and then
        // switch to *metres* - two units in one readout, the second metric,
        // on an American guide sign in a cockpit whose speedometer says mph
        // and whose odometer says MI.
        //
        // **The justification that used to sit here has expired.** It read: "a
        // leg is 220m = 0.137 miles and the sign is only ever visible below
        // that, so the 1 MILE / 1/2 / 1/4 ladder can never apply here." The leg
        // has been **420m** since cycle 58, so the sign is now visible at
        // 0.261 miles - measured: it reads `1380 FT` at 420m out, which is
        // above a quarter mile, exactly where real signage switches to the
        // ladder. Feet are still correct for most of the approach and the
        // readout is accurate throughout (1380/1150/820/490/260 FT against a
        // true 1378/1148/817/486/259), so this is a realism gap, not a bug -
        // filed as S140 rather than changed on the way past.
        //
        // Derived from METERS_PER_MILE rather than a typed 3.28084: this run
        // has already closed six constants that shadowed a number kept
        // somewhere else. 5280 is a definition, not a measurement.
        const feet = (z / METERS_PER_MILE) * FEET_PER_MILE
        distanceRef.current.textContent = `${Math.round(feet / 10) * 10} FT`
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
            thing - the first part of a guide sign you can actually read. */}
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
            <span ref={distanceRef}>-</span>
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

      {/* Twin supports - a guide sign this size never stands on one post. */}
      <div className="relative mx-auto h-[180px] w-[150px]">
        <div className="absolute left-[26px] top-0 h-full w-[11px] bg-gradient-to-b from-[#6b7787] to-[#2b333f]" />
        <div className="absolute right-[26px] top-0 h-full w-[11px] bg-gradient-to-b from-[#6b7787] to-[#2b333f]" />
      </div>
    </div>
  )
}
