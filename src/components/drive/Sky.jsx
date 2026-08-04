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

export function Sky() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: `${HORIZON_RATIO * 100}%`,
          background:
            'linear-gradient(to bottom, #03060d 0%, #061224 45%, #0b2440 78%, #14405f 100%)',
        }}
      />

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

      {/* Moon, low and to the left, matching the site's sky palette. */}
      <div
        className="absolute h-16 w-16 rounded-full sm:h-20 sm:w-20"
        style={{
          left: '14%',
          top: '9%',
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
          d="M0 80 L0 62 L40 62 L52 44 L64 62 L120 62 L128 34 L146 34 L154 62 L210 62 L222 50 L236 50 L244 62 L320 62 L330 28 L352 28 L360 62 L430 62 L444 46 L470 46 L478 62 L560 62 L570 38 L592 38 L600 62 L700 62 L712 52 L738 52 L746 62 L820 62 L832 30 L856 30 L864 62 L940 62 L950 48 L972 48 L980 62 L1060 62 L1072 40 L1092 40 L1100 62 L1200 62 L1200 80 Z"
          fill="rgba(6, 18, 34, 0.92)"
        />
      </svg>

      {/* Glow where the road vanishes — the destination, always ahead. */}
      <div
        className="absolute left-1/2 h-40 w-[70%] -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${HORIZON_RATIO * 100}%`,
          background:
            'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.22) 0%, rgba(0, 71, 255, 0.08) 45%, rgba(10, 14, 23, 0) 72%)',
        }}
      />
    </div>
  )
}
