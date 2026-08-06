import { useEffect, useRef } from 'react'
import { STEPS, paletteAt, withAlpha } from './daylight'
import { routeLength } from './route'
import { HORIZON_RATIO } from './world'
import styles from '@/styles/drive.module.css'

/** Deterministic star field so server and client markup match. */
function makeStars(count) {
  let seed = 20260803
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }

  return Array.from({ length: count }, (unused, index) => ({
    id: index,
    left: random() * 100,
    top: random() * (HORIZON_RATIO * 100 - 2),
    size: 0.6 + random() * 1.6,
    opacity: 0.25 + random() * 0.6,
    delay: random() * 6,
  }))
}

const STARS = makeStars(110)

function skyGradient(colors) {
  return `linear-gradient(to bottom, ${colors.skyTop} 0%, ${colors.skyUpper} 45%, ${colors.skyLower} 78%, ${colors.skyHorizon} 100%)`
}

function glowGradient(colors) {
  return `radial-gradient(ellipse at center, ${withAlpha(
    colors.glow,
    colors.glowAlpha
  )} 0%, ${withAlpha(colors.glow, colors.glowAlpha * 0.35)} 45%, ${withAlpha(
    colors.glow,
    0
  )} 72%)`
}

/**
 * The sky, lit for wherever you are on the route. It repaints through refs on
 * the sim's subscription — the same trick the gauges use — so the 60fps loop
 * never touches React state.
 *
 * The server renders the palette at progress 0, which is exactly what the
 * client paints on its first frame, so hydration matches.
 */
export function Sky({ drive }) {
  const gradientRef = useRef(null)
  const starsRef = useRef(null)
  const moonRef = useRef(null)
  const glowRef = useRef(null)
  const skylineRef = useRef(null)

  useEffect(() => {
    if (!drive) return undefined

    let painted = -1

    return drive.subscribe((sim) => {
      const progress = routeLength > 0 ? sim.travel / routeLength : 0
      // The palette itself is quantised; skip the DOM writes too when the
      // step has not moved. Uses the palette's own step count, so the two
      // cannot drift apart.
      const step = Math.round(progress * STEPS)
      if (step === painted) return
      painted = step

      const colors = paletteAt(progress)

      if (gradientRef.current) {
        gradientRef.current.style.background = skyGradient(colors)
      }
      if (starsRef.current) {
        starsRef.current.style.opacity = String(colors.starOpacity)
      }
      if (moonRef.current) {
        moonRef.current.style.opacity = String(colors.moonOpacity)
      }
      if (glowRef.current) {
        glowRef.current.style.background = glowGradient(colors)
      }
      if (skylineRef.current) {
        skylineRef.current.setAttribute('fill', withAlpha(colors.skyline, 0.92))
      }
    })
  }, [drive])

  const start = paletteAt(0)

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={gradientRef}
        className="absolute inset-x-0 top-0"
        style={{
          height: `${HORIZON_RATIO * 100}%`,
          background: skyGradient(start),
        }}
      />

      <div
        ref={starsRef}
        className="absolute inset-0"
        style={{ opacity: start.starOpacity }}
      >
        {STARS.map((star) => (
          <span
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Moon, low and to the left, matching the site's sky palette. */}
      <div
        ref={moonRef}
        className="absolute h-16 w-16 rounded-full sm:h-20 sm:w-20"
        style={{
          left: '14%',
          top: '9%',
          opacity: start.moonOpacity,
          background:
            'radial-gradient(circle at 35% 35%, #f4f9ff 0%, #cfe2f5 45%, #8fb3d4 100%)',
          boxShadow: '0 0 60px 18px rgba(120, 180, 240, 0.25)',
        }}
      />

      {/* Distant skyline the road is heading toward. */}
      <svg
        className="absolute inset-x-0"
        style={{ top: `${HORIZON_RATIO * 100 - 6}%`, height: '6.4%' }}
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
      >
        <path
          ref={skylineRef}
          d="M0 80 L0 62 L40 62 L52 44 L64 62 L120 62 L128 34 L146 34 L154 62 L210 62 L222 50 L236 50 L244 62 L320 62 L330 28 L352 28 L360 62 L430 62 L444 46 L470 46 L478 62 L560 62 L570 38 L592 38 L600 62 L700 62 L712 52 L738 52 L746 62 L820 62 L832 30 L856 30 L864 62 L940 62 L950 48 L972 48 L980 62 L1060 62 L1072 40 L1092 40 L1100 62 L1200 62 L1200 80 Z"
          fill={withAlpha(start.skyline, 0.92)}
        />
      </svg>

      {/* Glow where the road vanishes — the destination, always ahead. */}
      <div
        ref={glowRef}
        className="absolute left-1/2 h-40 w-[70%] -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${HORIZON_RATIO * 100}%`,
          background: glowGradient(start),
        }}
      />
    </div>
  )
}
