import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
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

function StopLinks({ links }) {
  if (!links?.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map((link, position) =>
        link.external ? (
          <a
            key={`${link.label}-${position}`}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={`${link.label}-${position}`}
            href={link.href}
            className="rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20"
          >
            {link.label}
          </Link>
        )
      )}
    </div>
  )
}

function StopBody({ stop }) {
  return (
    <>
      {stop.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stop.image}
          alt=""
          className="mt-3 h-28 w-full rounded-md border border-white/10 object-cover object-top opacity-80 sm:h-36"
          loading="lazy"
        />
      ) : null}

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

      <StopLinks links={stop.links} />

      {stop.hint ? (
        <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.16em] text-sky-300/60">
          {stop.hint}
        </p>
      ) : null}
    </>
  )
}

/** The windshield heads-up display: shown whenever the car is parked. */
export function StopCard({ stop, visible, position, total }) {
  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.section
          key={stop.id}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          aria-live="polite"
          className={`pointer-events-auto relative w-[min(92vw,44rem)] rounded-xl px-5 py-4 sm:px-7 sm:py-6 ${styles.hud}`}
        >
          <CornerBrackets />

          <div className="flex items-center justify-between gap-3 text-[0.625rem] uppercase tracking-[0.24em] text-sky-300/70">
            <span>
              {stop.exitLabel} · {stop.leg}
            </span>
            <span className="tabular-nums">
              {position} / {total}
            </span>
          </div>

          <h2 className="mt-2 font-display text-xl font-semibold leading-tight text-white sm:text-2xl">
            {stop.title}
          </h2>
          {stop.subtitle ? (
            <p className="text-sky-200/85 mt-1 text-sm">{stop.subtitle}</p>
          ) : null}
          {stop.meta ? (
            <p className="text-white/45 mt-1 text-[0.75rem]">{stop.meta}</p>
          ) : null}

          <div
            className={`mt-1 max-h-[34vh] overflow-y-auto pr-1 sm:max-h-[38vh] ${styles.hudScroll}`}
          >
            <StopBody stop={stop} />
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
