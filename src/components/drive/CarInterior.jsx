import styles from '@/styles/drive.module.css'

/**
 * Everything between the driver and the road: glass, pillars, headliner,
 * mirror and wipers. Purely decorative — it never swallows pointer events.
 */
export function CarInterior({ passedStop }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden="true"
    >
      <div className={`absolute inset-0 ${styles.glass}`} />

      {/* Tinted strip along the top of the windshield. */}
      <div className="absolute inset-x-0 top-0 h-[16%] bg-gradient-to-b from-[#050a12] via-[#050a12]/70 to-transparent" />

      {/* Headliner and roof line. */}
      <div className="absolute inset-x-0 top-0 h-[7%] bg-[#0a0d12] shadow-[0_14px_34px_rgba(0,0,0,0.85)] sm:h-[8%]">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        <div className="absolute left-[6%] top-[35%] h-[52%] w-[26%] rounded-b-md bg-[#12161d]" />
        <div className="absolute right-[6%] top-[35%] h-[52%] w-[26%] rounded-b-md bg-[#12161d]" />
      </div>

      {/* Rear-view mirror: what is already behind you. */}
      <div className="absolute left-1/2 top-[6.5%] w-[46%] max-w-[300px] -translate-x-1/2 sm:top-[7.5%]">
        <div className="mx-auto h-3 w-3 rounded-b bg-[#12161d]" />
        <div className="rounded-md border border-white/10 bg-gradient-to-b from-[#0d141d] to-[#070a0f] px-3 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.7)]">
          <div className="text-[0.5rem] uppercase tracking-[0.22em] text-white/30">
            Behind you
          </div>
          <div className="truncate text-[0.6875rem] leading-4 text-sky-200/70">
            {passedStop ? passedStop.title : 'Open road'}
          </div>
        </div>
      </div>

      {/* A-pillars, wider apart at the bottom like real glass. */}
      <div
        className={`absolute inset-y-0 left-0 w-[15%] bg-[#0a0d12] sm:w-[11%] ${styles.pillarLeft}`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-[15%] bg-[#0a0d12] sm:w-[11%] ${styles.pillarRight}`}
      />

      {/* Wipers parked at the base of the glass. */}
      <svg
        className="absolute inset-x-0 bottom-[34%] h-[9%] w-full opacity-70 sm:bottom-[33%]"
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
      >
        <path
          d="M120 74 L470 18"
          stroke="rgba(12,16,22,0.9)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M520 74 L840 26"
          stroke="rgba(12,16,22,0.9)"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>

      {/* Vignette so the eye stays on the road. */}
      <div className="absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(2,5,10,0.85)]" />
    </div>
  )
}
