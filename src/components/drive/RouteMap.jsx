import { useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { legsOf, route } from './route'

const LEGS = legsOf(route)

const TABBABLE = 'button, a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Four rail states, one look each. The token comes from `statusByIndex`;
 * anything not in this table paints as `unreached`. `visited` is still
 * accepted so the call site keeps working, but it is never read: it marks
 * every index at or before a jump target, so it cannot tell a leapfrogged
 * exit from a taken one.
 */
const STROKE = {
  taken: { strokeWidth: 2 },
  skipped: { strokeWidth: 2, strokeDasharray: '0 5', strokeLinecap: 'round' },
  jumped: { strokeWidth: 2, strokeDasharray: '5 3' },
  unreached: { strokeWidth: 1, opacity: 0.3 },
}

const LABEL = {
  taken: 'driven',
  skipped: 'driven past',
  jumped: 'not taken',
  unreached: 'road ahead',
}

const EMPTY = Object.freeze({})

function statusOf(statusByIndex, index) {
  const source = statusByIndex ?? EMPTY
  const token = source instanceof Map ? source.get(index) : source[index]
  return Object.hasOwn(STROKE, token) ? token : 'unreached'
}

export function RouteMap({
  open,
  onClose,
  onSelect,
  currentIndex,
  visited,
  statusByIndex = EMPTY,
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
   * "where you are" is the useful thing — and then it opened at MILE 0 every
   * time. On a landscape phone that means three visible rows out of
   * twenty-one, with the current one 800px down.
   *
   * The scroller's own `scrollTop` is set rather than calling
   * `scrollIntoView`, which walks up the tree and can move ancestors it was
   * never asked to. It is instant on purpose: a smooth scroll would be motion
   * nobody requested, and would need a reduced-motion branch to be honest.
   * Deliberately does not touch focus — the effect below owns that.
   *
   * The measurement is a rect delta rather than `offsetTop`: the scroll
   * container is not positioned, so a row's `offsetParent` is the dialog
   * backdrop and its `offsetTop` is measured from there — 111px out, which
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
   * everything behind it is inert — so it has to actually behave that way.
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
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
                  <div className="mb-2 text-[0.625rem] uppercase tracking-[0.24em] text-sky-300/70">
                    {leg.name}
                  </div>
                  <ul className="space-y-1">
                    {leg.stops.map((stop) => {
                      const status = statusOf(statusByIndex, stop.index)
                      const isCurrent = stop.index === currentIndex
                      return (
                        <li key={stop.id}>
                          <button
                            type="button"
                            ref={isCurrent ? currentRef : null}
                            onClick={() => onSelect(stop.index)}
                            // Where you are was said in colour alone — a border
                            // and a tint — so a screen reader met twenty-one
                            // near-identical buttons with nothing to separate
                            // them. `location` is the ARIA token for the current
                            // place within an environment, which is exactly what
                            // a route map is; anything a reader does not know
                            // degrades to "true" per spec.
                            aria-current={isCurrent ? 'location' : undefined}
                            className={clsx(
                              'relative flex w-full items-baseline gap-3 rounded-md border py-2 pl-7 pr-3 text-left transition',
                              isCurrent
                                ? 'border-sky-400/50 bg-sky-400/10'
                                : 'border-transparent hover:border-white/15 hover:bg-white/5'
                            )}
                          >
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
                            {/*
                              The rail sits on the button so its label joins the
                              button's name. An svg is a replaced element, so
                              top and bottom alone leave it at its 150px
                              intrinsic height; the explicit height spans the
                              border box, which also closes the gap between
                              neighbouring segments to the list's own 4px.
                            */}
                            <svg
                              role="img"
                              aria-label={LABEL[status]}
                              focusable="false"
                              className="pointer-events-none absolute -inset-y-px left-1 h-[calc(100%+2px)] w-3 text-sky-300"
                            >
                              <line
                                x1="50%"
                                y1="0"
                                x2="50%"
                                y2="100%"
                                stroke="currentColor"
                                {...STROKE[status]}
                              />
                              <circle
                                cx="50%"
                                cy="50%"
                                r="3"
                                fill="currentColor"
                                className={clsx(
                                  isCurrent && !reducedMotion && 'animate-pulse'
                                )}
                              />
                            </svg>
                          </button>
                        </li>
                      )
                    })}
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
