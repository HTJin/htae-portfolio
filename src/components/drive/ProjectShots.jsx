import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import styles from '@/styles/drive.module.css'

const HOLD = 4200 // ms a frame stays up before the cross-fade to the next one

/** "https://gosolarindy.energy/" -> "gosolarindy.energy" */
function hostOf(site) {
  if (!site) return null
  try {
    return new URL(site).host.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * The project screenshots, framed like a browser window and cross-fading on
 * their own. Every capture is ~2:1, so a 2:1 frame with `object-contain` shows
 * the whole page instead of cropping it to a strip.
 */
export function ProjectShots({ images, title, site }) {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = images?.length ?? 0
  const host = hostOf(site)

  // A stop change swaps the whole array — always restart from the first frame.
  const key = images?.[0]
  useEffect(() => {
    setIndex(0)
  }, [key])

  const show = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  )

  useEffect(() => {
    if (reducedMotion || paused || count < 2) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), HOLD)
    return () => clearInterval(timer)
  }, [reducedMotion, paused, count, key])

  if (!count) return null

  return (
    <figure
      className="mt-3"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.browserFrame}>
        {/* Chrome: the tell that this is a thing that ships to a URL. */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#0b1119] px-3 py-1.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-2 w-2 rounded-full bg-rose-400/70" />
            <i className="h-2 w-2 rounded-full bg-amber-300/70" />
            <i className="h-2 w-2 rounded-full bg-emerald-400/70" />
          </span>
          <span className="text-white/35 min-w-0 flex-1 truncate rounded bg-black/40 px-2 py-0.5 text-center font-mono text-[0.5625rem] tracking-tight">
            {host ?? title}
          </span>
          {count > 1 ? (
            <span className="shrink-0 font-mono text-[0.5625rem] tabular-nums text-sky-300/50">
              {index + 1}/{count}
            </span>
          ) : null}
        </div>

        {/* The viewport. Fixed 2:1 so the layout never jumps between frames. */}
        <div className={styles.browserViewport}>
          {images.map((source, position) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={source}
              src={source}
              alt={`${title} — screenshot ${position + 1} of ${count}`}
              className={`${styles.shot} ${
                position === index ? styles.shotOn : ''
              }`}
              loading={position === 0 ? 'eager' : 'lazy'}
              draggable="false"
            />
          ))}
        </div>
      </div>

      {count > 1 ? (
        <figcaption className="mt-2 flex items-center justify-center gap-1.5">
          {images.map((source, position) => (
            <button
              key={source}
              type="button"
              onClick={() => show(position)}
              aria-label={`Show screenshot ${position + 1}`}
              aria-current={position === index}
              className={`h-1.5 rounded-full transition-all ${
                position === index
                  ? 'w-5 bg-sky-300'
                  : 'w-1.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </figcaption>
      ) : null}
    </figure>
  )
}
