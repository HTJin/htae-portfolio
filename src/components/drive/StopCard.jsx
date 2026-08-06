import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ProjectShots } from './ProjectShots'
import { tripSummary } from './route'
import styles from '@/styles/drive.module.css'

function CornerBrackets() {
  const corner = 'pointer-events-none absolute h-4 w-4 border-sky-300/60'
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </>
  )
}

/** The green interstate shield, bolted to the top-left of the panel. */
function ExitShield({ stop }) {
  const [tag, number] = stop.exitLabel.split(' ')
  return (
    <div
      className={`flex shrink-0 flex-col items-center rounded-md px-2.5 py-1 ${styles.shield}`}
    >
      <span className="text-[0.5rem] uppercase leading-none tracking-[0.2em] text-emerald-100/70">
        {tag}
      </span>
      <span className="font-display text-base font-bold leading-none tracking-tight text-white">
        {number}
      </span>
    </div>
  )
}

/**
 * Actions carry weight in proportion to what they are for. At the destination
 * the point is to start a conversation, so the email is the loud one and the
 * way back out is quiet — otherwise the goal and the exit door look identical
 * and the eye has nothing to land on.
 */
function linkClass(link) {
  if (link.primary) {
    return 'rounded-md border border-sky-300/70 bg-sky-400/25 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(56,189,248,0.9)] transition hover:bg-sky-400/40'
  }
  if (link.quiet) {
    return 'rounded-md px-2 py-1.5 text-xs font-medium text-white/45 underline-offset-4 transition hover:text-sky-200 hover:underline'
  }
  return 'rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20'
}

function StopLinks({ links }) {
  if (!links?.length) return null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {links.map((link, position) =>
        link.external ? (
          <a
            key={`${link.label}-${position}`}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass(link)}
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={`${link.label}-${position}`}
            href={link.href}
            className={linkClass(link)}
          >
            {link.label}
          </Link>
        )
      )}
    </div>
  )
}

/**
 * The trip, in numbers, at the destination only. Every figure comes from
 * `route.js`, derived from the content itself — nothing here is written down.
 */
function TripSummary() {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-sky-400/15 py-3 sm:grid-cols-4">
      {tripSummary.map((item) => (
        <div key={item.label}>
          <dt className="text-[0.625rem] uppercase tracking-[0.18em] text-sky-300/60">
            {item.label}
          </dt>
          <dd className="mt-0.5 font-display text-xl font-semibold leading-none text-white">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Everything except the media — the column that always has something in it. */
function StopProse({ stop }) {
  return (
    <>
      {stop.paragraphs?.map((paragraph) => (
        <p
          key={paragraph.slice(0, 40)}
          className="mt-3 text-[0.8125rem] leading-6 text-sky-100/80"
        >
          {paragraph}
        </p>
      ))}

      {stop.bullets?.length ? (
        <ul className="mt-3 space-y-1.5">
          {stop.bullets.map((bullet) => (
            <li
              key={bullet.slice(0, 40)}
              className="flex gap-2 text-[0.8125rem] leading-6 text-sky-100/80"
            >
              <span
                aria-hidden="true"
                className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-sky-300/70"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {stop.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stop.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6875rem] text-sky-100/70"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {stop.groups?.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {stop.groups.map((group) => (
            <div
              key={group.id}
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
            >
              <div className="text-[0.6875rem] uppercase tracking-[0.16em] text-sky-300/80">
                {group.title}
              </div>
              <div className="mt-1 text-[0.75rem] leading-5 text-sky-100/70">
                {group.items}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {stop.kind === 'destination' ? <TripSummary /> : null}

      <StopLinks links={stop.links} />

      {stop.hint ? (
        <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.16em] text-sky-300/60">
          {stop.hint}
        </p>
      ) : null}
    </>
  )
}

/**
 * The windshield heads-up display: shown whenever the car is parked. It
 * projects up from the dash, so it animates from its bottom edge.
 */
export function StopCard({ stop, visible, position, total }) {
  const reducedMotion = useReducedMotion()
  const shots = stop.images?.length ? stop.images : null

  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.section
          key={stop.id}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 26, rotateX: 10, scale: 0.97 }
          }
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -14, rotateX: -6, scale: 0.98 }
          }
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'bottom center', perspective: 1200 }}
          // Deliberately not a live region: this node is keyed by stop inside
          // AnimatePresence, so it is destroyed and rebuilt on every arrival and
          // could never announce anything. `ArrivalAnnouncer` in DriveScene is
          // mounted for the life of the page and does the announcing.
          className={`pointer-events-auto relative flex max-h-full w-[min(94vw,44rem)] flex-col rounded-xl px-5 py-4 sm:px-7 sm:py-5 ${
            shots ? 'lg:w-[min(94vw,58rem)]' : ''
          } ${styles.hud}`}
        >
          <CornerBrackets />

          {/* Sign rail: the shield, the leg you are on, and how far along. */}
          <header className="flex items-center gap-3">
            <ExitShield stop={stop} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.625rem] uppercase tracking-[0.24em] text-emerald-300/70">
                {stop.leg}
              </p>
              <h2 className="mt-0.5 line-clamp-2 font-display text-lg font-semibold leading-tight text-white sm:text-2xl lg:truncate">
                {stop.title}
              </h2>
            </div>
            <span className="shrink-0 self-start font-mono text-[0.625rem] tabular-nums text-sky-300/60">
              {position}/{total}
            </span>
          </header>

          {(stop.subtitle || stop.meta) && (
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-white/10 pt-1.5">
              {stop.subtitle ? (
                <p className="text-sky-200/85 text-sm">{stop.subtitle}</p>
              ) : null}
              {stop.meta ? (
                <p className="text-white/45 text-[0.75rem]">{stop.meta}</p>
              ) : null}
            </div>
          )}

          <div
            className={`min-h-0 flex-1 overflow-y-auto pr-1 ${styles.hudScroll}`}
          >
            {shots ? (
              <div className="gap-x-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <ProjectShots
                  images={shots}
                  title={stop.title}
                  site={stop.site}
                />
                <div className="lg:pt-3">
                  <StopProse stop={stop} />
                </div>
              </div>
            ) : (
              <StopProse stop={stop} />
            )}
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
