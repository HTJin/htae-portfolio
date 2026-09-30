import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { curveAt, hillAt } from '@/components/drive/world'
import { rampAt } from '@/components/drive/route'

// R3F touches window on import, so it cannot be server rendered.
const RoadScene = dynamic(() => import('@/components/drive/RoadScene'), { ssr: false })

/**
 * Side-by-side proving ground for the 3D renderer.
 *
 * Deliberately drives its own minimal sim rather than useDrive, so the scene can
 * be judged without dragging in the cockpit, audio, stop cards and route overlay.
 * The sim shape matches what useDrive keeps ({ travel, speed, x, ramp }), so
 * swapping the real hook in later is a one line change.
 */
export default function DriveR3F() {
  const simRef = useRef({ travel: 0, speed: 0, x: 0, ramp: rampAt(0) })
  const [hud, setHud] = useState({ travel: 0, speed: 0 })
  const held = useRef(false)

  useEffect(() => {
    let raf
    let last = performance.now()
    const down = (e) => { if (e.key === 'ArrowUp') held.current = true }
    const up = (e) => { if (e.key === 'ArrowUp') held.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const sim = simRef.current
      sim.speed += (held.current ? 26 : -14) * dt
      sim.speed = Math.max(0, Math.min(38, sim.speed))
      sim.travel += sim.speed * dt
      sim.ramp = rampAt(sim.travel)
      setHud({ travel: Math.round(sim.travel), speed: Math.round(sim.speed * 2.237) })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return (
    <>
      <Head>
        <title>Drive, R3F renderer</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ position: 'fixed', inset: 0, background: '#0b0d13' }}>
        <RoadScene simRef={simRef} />
        <div
          style={{
            position: 'absolute', left: 16, bottom: 16, zIndex: 10,
            font: '12px ui-monospace, monospace', color: '#9fb4d8',
            background: 'rgba(11,13,19,0.7)', padding: '8px 12px', borderRadius: 6,
          }}
        >
          hold ArrowUp to drive
          <br />
          travel {hud.travel} m / {hud.speed} mph
          <br />
          curve {curveAt(hud.travel).toFixed(2)} / hill {hillAt(hud.travel).toFixed(2)}
        </div>
      </div>
    </>
  )
}
