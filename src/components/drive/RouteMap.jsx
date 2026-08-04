import Link from 'next/link'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { legsOf, route } from './route'

const LEGS = legsOf(route)

export function RouteMap({ open, onClose, onSelect, currentIndex, visited }) {
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
          <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-sky-400/25 bg-[#050b14]/90">
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

            <div className="overflow-y-auto px-5 py-4">
              {LEGS.map((leg) => (
                <div key={leg.name} className="mb-5 last:mb-0">
                  <div className="mb-2 text-[0.625rem] uppercase tracking-[0.24em] text-sky-300/70">
                    {leg.name}
                  </div>
                  <ul className="space-y-1">
                    {leg.stops.map((stop) => (
                      <li key={stop.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(stop.index)}
                          className={clsx(
                            'flex w-full items-baseline gap-3 rounded-md border px-3 py-2 text-left transition',
                            stop.index === currentIndex
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
                          {visited.has(stop.index) ? (
                            <span className="shrink-0 text-[0.625rem] uppercase tracking-[0.14em] text-emerald-300/70">
                              driven
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
