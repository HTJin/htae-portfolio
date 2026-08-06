import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CarInterior } from './CarInterior'
import { Dashboard } from './Dashboard'
import { ExitSign } from './ExitSign'
import { RoadCanvas } from './RoadCanvas'
import { RouteMap } from './RouteMap'
import { Sky } from './Sky'
import { StopCard } from './StopCard'
import { route } from './route'
import { useDrive } from './useDrive'
import styles from '@/styles/drive.module.css'

const CONTROLS = [
  ['↑ / W', 'accelerate'],
  ['↓ / S', 'brake'],
  ['← / →', 'steer'],
  ['N', 'next stop'],
  ['⌫', 'previous'],
  ['M', 'route map'],
]

/** Everything readable on the page, for screen readers and crawlers. */
function Itinerary() {
  return (
    <div className="sr-only">
      <h1>Drive mode — the résumé of Hyun-Tae Jin as a road trip</h1>
      {route.map((stop) => (
        <section key={stop.id} aria-label={`${stop.exitLabel}: ${stop.title}`}>
          <h2>
            {stop.exitLabel} — {stop.title}
          </h2>
          {stop.subtitle ? <p>{stop.subtitle}</p> : null}
          {stop.meta ? <p>{stop.meta}</p> : null}
          {stop.paragraphs?.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {stop.bullets?.length ? (
            <ul>
              {stop.bullets.map((bullet) => (
                <li key={bullet.slice(0, 40)}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          {stop.tags?.length ? <p>Built with {stop.tags.join(', ')}.</p> : null}
          {stop.groups?.map((group) => (
            <p key={group.id}>
              {group.title}: {group.items}
            </p>
          ))}
          {stop.links?.map((link, position) => (
            <p key={`${link.label}-${position}`}>
              <a href={link.href}>{link.label}</a>
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}

function Ignition({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#03070e]/80 px-6 text-center backdrop-blur-[2px]"
    >
      <p className="text-[0.6875rem] uppercase tracking-[0.3em] text-sky-300/70">
        Hyun-Tae Jin · drive mode
      </p>
      <h1 className="mt-3 max-w-xl font-display text-2xl font-light leading-tight text-white sm:text-4xl">
        The résumé, from the driver&apos;s seat
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/50">
        Every exit on this road is a job, a build, or a chapter. Hold the
        accelerator, roll up to the sign, read, then drive on.
      </p>

      <button
        type="button"
        onClick={onStart}
        className={`mt-8 rounded-full border border-yellow-300/60 bg-yellow-300/10 px-8 py-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200 transition hover:bg-yellow-300/20 ${styles.ignition}`}
      >
        Start engine
      </button>

      <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-1.5 text-left text-[0.6875rem] sm:grid-cols-3">
        {CONTROLS.map(([key, action]) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[0.625rem] text-white/70">
              {key}
            </dt>
            <dd className="text-white/40">{action}</dd>
          </div>
        ))}
      </dl>

      <Link
        href="/"
        className="text-white/35 mt-8 text-[0.6875rem] uppercase tracking-[0.18em] transition hover:text-sky-300"
      >
        ← back to the classic site
      </Link>
    </motion.div>
  )
}

export function DriveScene() {
  const reducedMotion = useReducedMotion()
  const drive = useDrive(route, { reducedMotion: Boolean(reducedMotion) })
  const [mapOpen, setMapOpen] = useState(false)

  const { started, start, index, parked, setThrottle, setBrake, setSteer } =
    drive
  const stop = route[index]
  const passedStop = index > 0 ? route[index - 1] : null

  const toggleMap = useCallback(() => setMapOpen((open) => !open), [])

  const selectStop = useCallback(
    (stopIndex) => {
      drive.goTo(stopIndex)
      setMapOpen(false)
    },
    [drive]
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (!started) return undefined

    const isTyping = (target) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

    const onKeyDown = (event) => {
      if (event.repeat || isTyping(event.target)) return

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          event.preventDefault()
          setThrottle(1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault()
          setBrake(1)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          setSteer(-1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          setSteer(1)
          break
        case 'n':
        case 'N':
          drive.driveToNext()
          break
        case 'Backspace':
        case 'p':
        case 'P':
          event.preventDefault()
          drive.goBack()
          break
        case 'm':
        case 'M':
          toggleMap()
          break
        case 'Escape':
          setMapOpen(false)
          break
        default:
          break
      }
    }

    const onKeyUp = (event) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          setThrottle(0)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          setBrake(0)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ArrowRight':
        case 'd':
        case 'D':
          setSteer(0)
          break
        default:
          break
      }
    }

    const onBlur = () => {
      setThrottle(0)
      setBrake(0)
      setSteer(0)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [started, setThrottle, setBrake, setSteer, drive, toggleMap])

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#03060c] text-white">
      <Itinerary />

      <Sky drive={drive} />
      <RoadCanvas drive={drive} className="absolute inset-0 h-full w-full" />
      <ExitSign drive={drive} stop={stop} />
      <CarInterior passedStop={passedStop} />

      {/* Heads-up display floats on the glass: below the mirror, above the dash. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[36%] top-[14%] z-30 flex items-center justify-center px-4">
        <StopCard
          stop={stop}
          visible={started && parked && !mapOpen}
          position={index + 1}
          total={route.length}
        />
      </div>

      {/* Turn-signal style status while under way. */}
      <AnimatePresence>
        {started && !parked && !mapOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-[16%] z-30 flex justify-center"
          >
            <div className="flex items-center gap-2 rounded-full border border-emerald-300/30 bg-[#04121a]/70 px-4 py-1.5 text-[0.625rem] uppercase tracking-[0.22em] text-emerald-200/80 backdrop-blur-sm">
              <span className={styles.blink} aria-hidden="true">
                ▸
              </span>
              Next exit — {stop.signTitle}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dashboard
        drive={drive}
        stop={stop}
        onOpenMap={toggleMap}
        mapOpen={mapOpen}
      />

      <Link
        href="/"
        className="text-white/35 absolute left-3 top-2 z-40 rounded-md px-2 py-1 text-[0.625rem] uppercase tracking-[0.18em] transition hover:text-sky-300 sm:left-5 sm:top-3"
      >
        ← exit
      </Link>

      <RouteMap
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={selectStop}
        currentIndex={index}
        visited={drive.visited}
      />

      <AnimatePresence>
        {started ? null : <Ignition onStart={start} />}
      </AnimatePresence>
    </div>
  )
}
