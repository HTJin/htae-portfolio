import { useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { legsOf, route } from './route'
import { legMilesAt } from './legMiles'
import {
  JUMPED,
  SKIPPED,
  STOP_STATUS_LABEL,
  TAKEN,
  UNREACHED,
} from './stopStatus'

const LEGS = legsOf(route)

const TABBABLE = 'button, a[href], [tabindex]:not([tabindex="-1"])'

/**
 * The rail: what happened at each exit, drawn rather than named.
 *
 * Q050, answered 2026-08-13, binding and verbatim: "could be more of a visual
 * roadmap of the experiences that went over in a dotted line node to node for
 * destinations and it will show which path I didn't take that way without
 * having to ponder about menial terminology such as passed or skipped".
 *
 * So the outcome is carried by the LINE, and the word that used to sit in a
 * green badge moves into the accessible name, where a screen reader needs it and
 * nobody else has to read it. That is also why the four looks differ in SHAPE
 * and not only in colour: a map that says "solid green against faint green" says
 * nothing at all to a visitor who cannot separate the two.
 */
const RAIL = {
  [TAKEN]: { dash: null, width: 2.2, opacity: 0.9, node: 'solid' },
  [SKIPPED]: { dash: '7 5', width: 2, opacity: 0.55, node: 'ring' },
  [JUMPED]: { dash: '1.5 4.5', width: 2, opacity: 0.55, node: 'ring' },
  [UNREACHED]: { dash: '1.5 4.5', width: 1, opacity: 0.2, node: 'faint' },
}

function Rail({ status, first, last }) {
  const look = RAIL[status] ?? RAIL[UNREACHED]
  const line = {
    stroke: 'currentColor',
    strokeWidth: look.width,
    strokeDasharray: look.dash ?? undefined,
    opacity: look.opacity,
    vectorEffect: 'non-scaling-stroke',
  }
  return (
    <svg
      // The rail is the only thing in this row that means something you can see
      // and a reader cannot, so role="img" belongs here and nowhere else. Its
      // name is the row's text equivalent.
      role="img"
      aria-label={STOP_STATUS_LABEL[status] ?? STOP_STATUS_LABEL[UNREACHED]}
      viewBox="0 0 14 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-y-0 left-2 w-[14px] text-emerald-300"
    >
      {/* Drawn as two half segments rather than one line, so the node sits in a
          gap of its own and the stroke never runs through it. */}
      {first ? null : <line x1="7" y1="0" x2="7" y2="41" {...line} />}
      {last ? null : <line x1="7" y1="59" x2="7" y2="100" {...line} />}
      <circle
        cx="7"
        cy="50"
        r={look.node === 'faint' ? 2 : 3.2}
        fill={look.node === 'solid' ? 'currentColor' : '#050b14'}
        stroke="currentColor"
        strokeWidth={look.node === 'faint' ? 1 : 1.6}
        opacity={look.node === 'faint' ? 0.28 : 0.9}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function RouteMap({
  open,
  onClose,
  onSelect,
  currentIndex,
  statuses,
  reducedMotion = false,
}) {
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)
  const currentRef = useRef(null)
  const scrollRef = useRef(null)

  /**
   * Open the list at the exit you are actually at.
   *
   * The map highlights the current exit, which is its own admission that
   * "where you are" is the useful thing - and then it opened at MILE 0 every
   * time. On a landscape phone that means three visible rows out of
   * twenty-one, with the current one 800px down.
   *
   * The scroller's own `scrollTop` is set rather than calling
   * `scrollIntoView`, which walks up the tree and can move ancestors it was
   * never asked to. It is instant on purpose: a smooth scroll would be motion
   * nobody requested, and would need a reduced-motion branch to be honest.
   * Deliberately does not touch focus - the effect below owns that.
   *
   * The measurement is a rect delta rather than `offsetTop`: the scroll
   * container is not positioned, so a row's `offsetParent` is the dialog
   * backdrop and its `offsetTop` is measured from there - 111px out, which
   * scrolled the current row clean past the top of the window.
   */
  useEffect(() => {
    if (!open) return
    const scroller = scrollRef.current
    const current = currentRef.current
    if (!scroller || !current) return

    const box = scroller.getBoundingClientRect()
    const row = current.getBoundingClientRect()
    // Where the row sits now, relative to the window, minus where it should
    // sit to be centred. At MILE 0 this clamps to 0 and nothing moves.
    const delta = row.top - box.top - (box.height - row.height) / 2
    scroller.scrollTop = Math.max(
      0,
      Math.min(
        scroller.scrollTop + delta,
        scroller.scrollHeight - scroller.clientHeight
      )
    )
  }, [open, currentIndex])

  /**
   * This dialog says `aria-modal`, which promises assistive technology that
   * everything behind it is inert - so it has to actually behave that way.
   * Focus moves in on open, cycles inside on Tab, and goes back to whatever
   * opened it on close. Escape is deliberately left alone: `DriveScene` binds
   * it globally along with the driving keys, and swallowing it here would stop
   * the map closing.
   */
  useEffect(() => {
    if (!open) return undefined

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const panel = panelRef.current
    const first = panel?.querySelector(TABBABLE)
    // Focus the panel itself rather than the first control, so a screen reader
    // reads the dialog's label before its contents.
    ;(panel ?? first)?.focus?.()

    const onKeyDown = (event) => {
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(TABBABLE)].filter(
        (node) => node.offsetParent !== null || node === document.activeElement
      )
      if (!items.length) return

      const edge = event.shiftKey ? items[0] : items[items.length - 1]
      if (
        document.activeElement === edge ||
        !panel.contains(document.activeElement)
      ) {
        event.preventDefault()
        ;(event.shiftKey ? items[items.length - 1] : items[0]).focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      returnFocusRef.current?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: reducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reducedMotion ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="bg-[#03070e]/92 absolute inset-0 z-40 flex items-start justify-center px-4 py-6 backdrop-blur-sm sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Route map"
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-sky-400/25 bg-[#050b14]/90 outline-none"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Route map
                </h2>
                <p className="text-white/35 text-[0.6875rem] uppercase tracking-[0.18em]">
                  Pick any exit to jump straight there
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-white/15 px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-white/60 transition hover:border-white/40 hover:text-white"
              >
                Close
              </button>
            </div>

            <div ref={scrollRef} className="overflow-y-auto px-5 py-4">
              {LEGS.map((leg) => (
                <div key={leg.name} className="mb-5 last:mb-0">
                  {/* Same left inset as the rows, so the rail passes beside the
                      leg name rather than through the letters of it. */}
                  <div className="mb-2 pl-9 text-[0.625rem] uppercase tracking-[0.24em] text-sky-300/70">
                    {leg.name}
                  </div>
                  <ul>
                    {leg.stops.map((stop) => (
                      <li key={stop.id}>
                        <button
                          type="button"
                          ref={stop.index === currentIndex ? currentRef : null}
                          onClick={() => onSelect(stop.index)}
                          // Where you are was said in colour alone - a border
                          // and a tint - so a screen reader met twenty-one
                          // near-identical buttons with nothing to separate
                          // them. "driven" below is real text and always did
                          // announce; only the current position was silent.
                          // `location` is the ARIA token for the current place
                          // within an environment, which is exactly what a
                          // route map is; anything a reader does not know
                          // degrades to "true" per spec.
                          aria-current={
                            stop.index === currentIndex ? 'location' : undefined
                          }
                          className={clsx(
                            'relative flex w-full items-baseline gap-3 rounded-md border py-2 pl-9 pr-3 text-left transition',
                            stop.index === currentIndex
                              ? 'border-sky-400/50 bg-sky-400/10'
                              : 'border-transparent hover:border-white/15 hover:bg-white/5'
                          )}
                        >
                          <Rail
                            status={statuses[stop.id] ?? UNREACHED}
                            first={stop.index === 0}
                            last={stop.index === route.length - 1}
                          />
                          <span className="text-white/35 w-[4.5rem] shrink-0 text-[0.625rem] uppercase tracking-[0.14em]">
                            {stop.exitLabel}
                          </span>
                          <span className="min-w-0 flex-auto">
                            <span className="block truncate text-sm text-white">
                              {stop.title}
                            </span>
                            <span className="block truncate text-[0.75rem] text-white/40">
                              {stop.subtitle ?? stop.signSub}
                            </span>
                          </span>
                          {/* Miles for the stretch that ENDS at this exit.
                              Q182, binding: "Add mile numbers to the new route
                              map picture". Q044, binding: display-only, so this
                              never touches LEG_LENGTH or the geometry. MILE 0
                              has nothing before it, so it shows none. */}
                          {stop.index > 0 ? (
                            <span
                              className="shrink-0 font-mono text-[0.625rem] tabular-nums tracking-[0.08em] text-white/45"
                              title={`${legMilesAt(stop.index)} miles from the previous exit`}
                            >
                              {legMilesAt(stop.index)} MI
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 px-5 py-3">
              <Link
                href="/"
                className="text-white/45 text-[0.6875rem] uppercase tracking-[0.16em] transition hover:text-sky-300"
              >
                ← Exit drive mode, back to the classic site
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
