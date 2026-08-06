import styles from '@/styles/drive.module.css'

/**
 * Everything between the driver and the road: glass, pillars, headliner,
 * mirror, wipers and the car's own bonnet. Purely decorative — it never
 * swallows pointer events.
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

      {/* Headliner, roof line and sun visors. */}
      <div className="absolute inset-x-0 top-0 h-[7%] bg-[#0a0d12] shadow-[0_14px_34px_rgba(0,0,0,0.85)] sm:h-[8%]">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        <div className="absolute left-[6%] top-[35%] h-[52%] w-[26%] rounded-b-md bg-[#12161d] shadow-[0_6px_12px_-6px_rgba(0,0,0,0.9)]" />
        <div className="absolute right-[6%] top-[35%] h-[52%] w-[26%] rounded-b-md bg-[#12161d] shadow-[0_6px_12px_-6px_rgba(0,0,0,0.9)]" />
      </div>

      {/* Rear-view mirror: what is already behind you. */}
      <div className="absolute left-1/2 top-[6.5%] w-[42%] max-w-[280px] -translate-x-1/2 sm:top-[7.5%]">
        <div className="mx-auto h-3 w-2.5 rounded-b bg-[#12161d]" />
        <div className="rounded-md border border-white/10 bg-gradient-to-b from-[#0d141d] to-[#070a0f] px-3 py-1 shadow-[0_8px_20px_rgba(0,0,0,0.7)]">
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

      {/* Wipers parked at the base of the glass, just above the bonnet.

          Everything from here down is positioned against `--dash` (the
          dashboard's height, defined once in DriveScene) rather than against a
          percentage of the viewport. These used to be fixed percentages chosen
          to sit right when the dash was 36% tall — but the dash is
          `clamp(190px, 36%, 48%)`, so below ~528px of height the 190px floor
          wins and the furniture stayed put while the dash grew over it. On a
          844x390 landscape phone that hid the bonnet completely. The offsets
          below resolve to exactly the old values at the 36% branch. */}
      <svg
        className="absolute inset-x-0 bottom-[calc(var(--dash)_+_5%)] h-[8%] w-full opacity-70"
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

      {/* The dash top, smeared back at the driver by the windshield. Sits
          directly on the dash, so it reads from the same quantity. */}
      <div
        className={`absolute inset-x-[12%] bottom-[var(--dash)] h-[9%] ${styles.dashReflection}`}
      />

      {/* The car's own bonnet, the last thing before the road. It tucks a
          hair behind the dash so there is no seam between them, and keeps a
          floor on its height so it still reads as a bonnet on a short screen
          rather than thinning to a line. */}
      <div
        className={`absolute inset-x-[-6%] bottom-[calc(var(--dash)_-_0.6%)] h-[clamp(26px,6%,64px)] ${styles.hood}`}
      />

      {/* Vignette so the eye stays on the road. */}
      <div className="absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(2,5,10,0.85)]" />
    </div>
  )
}
