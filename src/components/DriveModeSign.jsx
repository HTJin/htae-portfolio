import Link from 'next/link'

/**
 * The way into drive mode: a roadside guide sign bolted to the sidebar.
 * Hovering lifts it the way a sign grows as you close on the exit.
 */
export function DriveModeSign() {
  return (
    <Link
      href="/drive"
      className="group mt-8 block w-full max-w-[19rem] focus:outline-none lg:mt-10"
      aria-label="Open drive mode: the résumé from the driver's seat"
    >
      <div className="border-white/85 relative overflow-hidden rounded-md border-[3px] bg-[#12603c] px-3.5 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white group-hover:shadow-[0_16px_36px_-14px_rgba(16,185,129,0.6)] group-focus-visible:ring-2 group-focus-visible:ring-sky-300">
        {/* Headlights sweeping across the reflective face. */}
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-[110%] group-hover:opacity-100" />

        <div className="flex items-baseline justify-between font-display text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-white/75">
          <span>Exit 1</span>
          <span>1/4 mile</span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-semibold leading-tight text-white">
            Drive Mode
          </span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 flex-none text-white transition-transform duration-300 group-hover:translate-x-1"
            fill="currentColor"
          >
            <path d="M13.4 4.6a1 1 0 0 0-1.4 1.4L16.2 10H4a1 1 0 1 0 0 2h12.2l-4.2 4a1 1 0 0 0 1.4 1.4l6-5.7a1 1 0 0 0 0-1.4l-6-5.7Z" />
          </svg>
        </div>

        <div className="mt-0.5 font-display text-[0.75rem] leading-tight text-white/80">
          The résumé from the driver&apos;s seat
        </div>
      </div>

      {/* Sign posts. */}
      <div className="mx-auto flex w-[70%] justify-between px-2">
        <span className="h-5 w-[3px] rounded-b bg-gradient-to-b from-gray-400 to-gray-600" />
        <span className="h-5 w-[3px] rounded-b bg-gradient-to-b from-gray-400 to-gray-600" />
      </div>

      <p className="mt-1 text-center text-[0.6875rem] text-gray-500 transition group-hover:text-sky-300/80 lg:text-left">
        Same résumé, different road. Keyboard or touch.
      </p>
    </Link>
  )
}
